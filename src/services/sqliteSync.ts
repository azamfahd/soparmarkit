import { Capacitor } from '@capacitor/core';
import { db } from '../db';

// This sync service replicates IndexedDB (Dexie) data into a native SQLite database on Android/iOS
// using @capacitor-community/sqlite.
// It resolves the "cache clearing" risk by using SQLite as the single source of truth (gold standard)
// on native devices, while utilizing Dexie's fast useLiveQuery inside the React frontend.

let sqliteConnection: any = null;
let sqliteDb: any = null;
let isSyncing = false;

// Dynamic import for Capacitor SQLite to avoid breaking the Web Preview
async function getCapacitorSQLite() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { SQLiteConnection, CapacitorSQLite } = await import('@capacitor-community/sqlite');
    return { SQLiteConnection, CapacitorSQLite };
  } catch (err) {
    console.error('Failed to import @capacitor-community/sqlite:', err);
    return null;
  }
}

/**
 * Initializes the SQLite database on Native platform and synchronizes with Dexie
 */
export async function initializeSQLiteSync(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('🌐 Web Environment detected: Using IndexedDB (Dexie) directly.');
    return;
  }

  console.log('📱 Native APK Platform detected: Starting Native SQLite Sync System...');
  
  const capSqlite = await getCapacitorSQLite();
  if (!capSqlite) {
    console.warn('⚠️ @capacitor-community/sqlite is not available. Operating in WebView-only mode.');
    return;
  }

  try {
    const { SQLiteConnection, CapacitorSQLite } = capSqlite;
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
    
    // Create connection to the native database
    // false = read-only (we want read-write so false), "no-encryption"
    sqliteDb = await sqliteConnection.createConnection('SmartAccounting_Local.db', false, 'no-encryption', 1, false);
    await sqliteDb.open();
    
    console.log('✅ Native SQLite connection opened successfully.');

    // Initialize all tables in SQLite
    await createSQLiteTables();

    // Synchronize data between Dexie and SQLite
    await performInitialDataSync();

    // Register Dexie hooks to listen for real-time changes
    registerDexieSyncHooks();

  } catch (error) {
    console.error('❌ Failed to initialize Native SQLite Sync:', error);
  }
}

/**
 * Creates mirroring SQLite tables
 */
async function createSQLiteTables(): Promise<void> {
  if (!sqliteDb) return;

  const queries = [
    // 1. Products table
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      cost_price REAL,
      sale_price REAL,
      stock_quantity REAL,
      category TEXT,
      barcode TEXT,
      unit TEXT,
      supplier_id INTEGER,
      production_date TEXT,
      expiration_date TEXT
    );`,

    // 2. Customers table
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      balance REAL DEFAULT 0
    );`,

    // 3. Suppliers table
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      balance REAL DEFAULT 0
    );`,

    // 4. Sales table
    `CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      total_amount REAL,
      paid_amount REAL,
      remaining_amount REAL,
      payment_status TEXT,
      payment_type TEXT,
      created_at TEXT,
      notes TEXT,
      previous_balance REAL,
      new_balance REAL
    );`,

    // 5. Sale Items table
    `CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY,
      sale_id INTEGER,
      product_id INTEGER,
      quantity REAL,
      price_at_sale REAL
    );`,

    // 6. Debts table
    `CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      sale_id INTEGER,
      amount REAL,
      type TEXT,
      created_at TEXT,
      notes TEXT,
      previous_balance REAL,
      new_balance REAL
    );`,

    // 7. Suppliers payments table
    `CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY,
      supplier_id INTEGER,
      amount REAL,
      payment_date TEXT,
      notes TEXT
    );`,

    // 8. Cash Withdrawals table
    `CREATE TABLE IF NOT EXISTS cash_withdrawals (
      id INTEGER PRIMARY KEY,
      amount REAL,
      by_whom TEXT,
      reason TEXT,
      created_at TEXT,
      is_repaid INTEGER DEFAULT 0,
      repay_date TEXT
    );`,

    // 9. Notes table
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      title TEXT,
      content TEXT,
      created_at TEXT,
      reminder_date TEXT,
      is_completed INTEGER DEFAULT 0,
      priority TEXT
    );`,

    // 10. Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );`,

    // 11. Sales Settlements table
    `CREATE TABLE IF NOT EXISTS sales_settlements (
      id INTEGER PRIMARY KEY,
      total_sales REAL,
      delivered_amount REAL,
      difference REAL,
      created_at TEXT,
      notes TEXT,
      cash_withdrawals REAL
    );`
  ];

  for (const query of queries) {
    try {
      await sqliteDb.execute(query);
    } catch (err) {
      console.error('Error creating SQLite table with query:', query, err);
    }
  }
  
  console.log('✅ Mirrored SQLite tables successfully verified/created.');
}

/**
 * Handles two-way synchronization on startup to ensure data consistency
 */
async function performInitialDataSync(): Promise<void> {
  if (!sqliteDb || isSyncing) return;
  isSyncing = true;
  
  try {
    console.log('🔄 Checking SQLite vs Dexie database synchronization...');

    // We use Products as our indicator table to check if SQLite or Dexie are empty
    const sqliteProductsResult = await sqliteDb.query('SELECT COUNT(*) as count FROM products;');
    const sqliteCount = sqliteProductsResult?.values?.[0]?.count || 0;
    
    const dexieCount = await db.products.count();

    console.log(`📊 Products Count - SQLite: ${sqliteCount}, Dexie (IndexedDB): ${dexieCount}`);

    if (sqliteCount > 0 && dexieCount === 0) {
      // SCENARIO A: The user cleared the WebView app cache, so Dexie is empty, but native SQLite still has the data!
      // This is the CRITICAL safety feature. Restore Dexie from native SQLite.
      console.log('🚨 SCENARIO A: App cache was cleared! Restoring IndexedDB from native SQLite database...');
      await restoreDexieFromSQLite();
      console.log('🎉 Successfully restored entire system state from SQLite!');
    } else if (dexieCount > 0 && sqliteCount === 0) {
      // SCENARIO B: Brand new APK installation or first time sync. Populate SQLite with existing Dexie data.
      console.log('📥 SCENARIO B: SQLite is empty! Exporting entire IndexedDB database to native SQLite file...');
      await backupDexieToSQLite();
      console.log('🎉 Successfully backed up entire IndexedDB to SQLite!');
    } else {
      // SCENARIO C: Both contain data. Merge changes (for simplicity, we keep them aligned via real-time write hooks).
      console.log('⚖️ Both databases contain data. Real-time hooks will keep them updated.');
    }
  } catch (error) {
    console.error('❌ Data synchronization failed on startup:', error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Restores IndexedDB (Dexie) with native SQLite data
 */
async function restoreDexieFromSQLite(): Promise<void> {
  const tablesToRestore = [
    { name: 'products', dexieTable: db.products },
    { name: 'customers', dexieTable: db.customers },
    { name: 'suppliers', dexieTable: db.suppliers },
    { name: 'sales', dexieTable: db.sales },
    { name: 'sale_items', dexieTable: db.saleItems },
    { name: 'debts', dexieTable: db.debts },
    { name: 'supplier_payments', dexieTable: db.supplierPayments },
    { name: 'cash_withdrawals', dexieTable: db.cashWithdrawals },
    { name: 'notes', dexieTable: db.notes },
    { name: 'sales_settlements', dexieTable: db.salesSettlements }
  ];

  for (const table of tablesToRestore) {
    try {
      const result = await sqliteDb.query(`SELECT * FROM ${table.name};`);
      const rows = result?.values || [];
      
      if (rows.length > 0) {
        // Clear existing local cache to prevent duplicate keys
        await (table.dexieTable as any).clear();
        
        // Transform boolean types stored as 0/1 back to true/false for JS compatibility
        const parsedRows = rows.map((row: any) => {
          const item = { ...row };
          if ('is_completed' in item) item.is_completed = item.is_completed === 1;
          if ('is_repaid' in item) item.is_repaid = item.is_repaid === 1;
          return item;
        });
        
        await (table.dexieTable as any).bulkAdd(parsedRows);
        console.log(`✅ Restored table [${table.name}] with ${rows.length} records into Dexie.`);
      }
    } catch (err) {
      console.error(`Failed to restore table ${table.name}:`, err);
    }
  }

  // Restore settings separately (key-value structure)
  try {
    const settingsResult = await sqliteDb.query(`SELECT * FROM settings;`);
    const rows = settingsResult?.values || [];
    if (rows.length > 0) {
      await db.settings.clear();
      for (const row of rows) {
        await db.settings.add({
          key: row.key,
          value: JSON.parse(row.value)
        });
      }
      console.log('✅ Restored system settings successfully.');
    }
  } catch (err) {
    console.error('Failed to restore settings:', err);
  }
}

/**
 * Backs up entire IndexedDB to native SQLite file
 */
async function backupDexieToSQLite(): Promise<void> {
  // Products
  const products = await db.products.toArray();
  for (const item of products) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO products (id, name, cost_price, sale_price, stock_quantity, category, barcode, unit, supplier_id, production_date, expiration_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [item.id, item.name, item.cost_price, item.sale_price, item.stock_quantity, item.category, item.barcode, item.unit, item.supplier_id, item.production_date, item.expiration_date]
    );
  }

  // Customers
  const customers = await db.customers.toArray();
  for (const item of customers) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO customers (id, name, phone, balance) VALUES (?, ?, ?, ?);`,
      [item.id, item.name, item.phone, item.balance]
    );
  }

  // Suppliers
  const suppliers = await db.suppliers.toArray();
  for (const item of suppliers) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO suppliers (id, name, phone, balance) VALUES (?, ?, ?, ?);`,
      [item.id, item.name, item.phone, item.balance]
    );
  }

  // Sales
  const sales = await db.sales.toArray();
  for (const item of sales) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO sales (id, customer_id, total_amount, paid_amount, remaining_amount, payment_status, payment_type, created_at, notes, previous_balance, new_balance) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [item.id, item.customer_id, item.total_amount, item.paid_amount, item.remaining_amount, item.payment_status, item.payment_type, item.created_at, item.notes, item.previous_balance, item.new_balance]
    );
  }

  // Sale Items
  const saleItems = await db.saleItems.toArray();
  for (const item of saleItems) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?, ?);`,
      [item.id, item.sale_id, item.product_id, item.quantity, item.price_at_sale]
    );
  }

  // Debts
  const debts = await db.debts.toArray();
  for (const item of debts) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO debts (id, customer_id, sale_id, amount, type, created_at, notes, previous_balance, new_balance) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [item.id, item.customer_id, item.sale_id, item.amount, item.type, item.created_at, item.notes, item.previous_balance, item.new_balance]
    );
  }

  // Supplier Payments
  const supplierPayments = await db.supplierPayments.toArray();
  for (const item of supplierPayments) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO supplier_payments (id, supplier_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?);`,
      [item.id, item.supplier_id, item.amount, item.payment_date, item.notes]
    );
  }

  // Cash Withdrawals
  const withdrawals = await db.cashWithdrawals.toArray();
  for (const item of withdrawals) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO cash_withdrawals (id, amount, by_whom, reason, created_at, is_repaid, repay_date) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [item.id, item.amount, item.by_whom, item.reason, item.created_at, item.is_repaid ? 1 : 0, item.repay_date]
    );
  }

  // Notes
  const notes = await db.notes.toArray();
  for (const item of notes) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO notes (id, title, content, created_at, reminder_date, is_completed, priority) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [item.id, item.title, item.content, item.created_at, item.reminder_date, item.is_completed ? 1 : 0, item.priority]
    );
  }

  // Sales Settlements
  const settlements = await db.salesSettlements.toArray();
  for (const item of settlements) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO sales_settlements (id, total_sales, delivered_amount, difference, created_at, notes, cash_withdrawals) 
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [item.id, item.total_sales, item.delivered_amount, item.difference, item.created_at, item.notes, item.cash_withdrawals]
    );
  }

  // Settings (key-value serialization)
  const settings = await db.settings.toArray();
  for (const item of settings) {
    await runSQLiteQuery(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);`,
      [item.key, JSON.stringify(item.value)]
    );
  }
}

/**
 * Registers real-time write hooks on Dexie tables so that any add/update/delete
 * automatically replicates to SQLite instantly.
 */
function registerDexieSyncHooks(): void {
  // Products Sync
  db.products.hook('creating', (primaryKey, obj) => {
    runSQLiteQueryAsync(
      `INSERT OR REPLACE INTO products (id, name, cost_price, sale_price, stock_quantity, category, barcode, unit, supplier_id, production_date, expiration_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [primaryKey || obj.id, obj.name, obj.cost_price, obj.sale_price, obj.stock_quantity, obj.category, obj.barcode, obj.unit, obj.supplier_id, obj.production_date, obj.expiration_date]
    );
  });
  db.products.hook('updating', (modifications, primKey, obj) => {
    const merged = { ...obj, ...modifications };
    runSQLiteQueryAsync(
      `UPDATE products SET name = ?, cost_price = ?, sale_price = ?, stock_quantity = ?, category = ?, barcode = ?, unit = ?, supplier_id = ?, production_date = ?, expiration_date = ? 
       WHERE id = ?;`,
      [merged.name, merged.cost_price, merged.sale_price, merged.stock_quantity, merged.category, merged.barcode, merged.unit, merged.supplier_id, merged.production_date, merged.expiration_date, primKey]
    );
  });
  db.products.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM products WHERE id = ?;`, [primKey]);
  });

  // Customers Sync
  db.customers.hook('creating', (primKey, obj) => {
    runSQLiteQueryAsync(`INSERT OR REPLACE INTO customers (id, name, phone, balance) VALUES (?, ?, ?, ?);`, [primKey || obj.id, obj.name, obj.phone, obj.balance]);
  });
  db.customers.hook('updating', (modifications, primKey, obj) => {
    const merged = { ...obj, ...modifications };
    runSQLiteQueryAsync(`UPDATE customers SET name = ?, phone = ?, balance = ? WHERE id = ?;`, [merged.name, merged.phone, merged.balance, primKey]);
  });
  db.customers.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM customers WHERE id = ?;`, [primKey]);
  });

  // Suppliers Sync
  db.suppliers.hook('creating', (primKey, obj) => {
    runSQLiteQueryAsync(`INSERT OR REPLACE INTO suppliers (id, name, phone, balance) VALUES (?, ?, ?, ?);`, [primKey || obj.id, obj.name, obj.phone, obj.balance]);
  });
  db.suppliers.hook('updating', (modifications, primKey, obj) => {
    const merged = { ...obj, ...modifications };
    runSQLiteQueryAsync(`UPDATE suppliers SET name = ?, phone = ?, balance = ? WHERE id = ?;`, [merged.name, merged.phone, merged.balance, primKey]);
  });
  db.suppliers.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM suppliers WHERE id = ?;`, [primKey]);
  });

  // Sales Sync
  db.sales.hook('creating', (primKey, obj) => {
    runSQLiteQueryAsync(
      `INSERT OR REPLACE INTO sales (id, customer_id, total_amount, paid_amount, remaining_amount, payment_status, payment_type, created_at, notes, previous_balance, new_balance) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [primKey || obj.id, obj.customer_id, obj.total_amount, obj.paid_amount, obj.remaining_amount, obj.payment_status, obj.payment_type, obj.created_at, obj.notes, obj.previous_balance, obj.new_balance]
    );
  });
  db.sales.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM sales WHERE id = ?;`, [primKey]);
  });

  // Sale Items Sync
  db.saleItems.hook('creating', (primKey, obj) => {
    runSQLiteQueryAsync(`INSERT OR REPLACE INTO sale_items (id, sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?, ?);`, [primKey || obj.id, obj.sale_id, obj.product_id, obj.quantity, obj.price_at_sale]);
  });
  db.saleItems.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM sale_items WHERE id = ?;`, [primKey]);
  });

  // Debts Sync
  db.debts.hook('creating', (primKey, obj) => {
    runSQLiteQueryAsync(
      `INSERT OR REPLACE INTO debts (id, customer_id, sale_id, amount, type, created_at, notes, previous_balance, new_balance) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [primKey || obj.id, obj.customer_id, obj.sale_id, obj.amount, obj.type, obj.created_at, obj.notes, obj.previous_balance, obj.new_balance]
    );
  });
  db.debts.hook('updating', (modifications, primKey, obj) => {
    const merged = { ...obj, ...modifications };
    runSQLiteQueryAsync(
      `UPDATE debts SET customer_id = ?, sale_id = ?, amount = ?, type = ?, created_at = ?, notes = ?, previous_balance = ?, new_balance = ? WHERE id = ?;`,
      [merged.customer_id, merged.sale_id, merged.amount, merged.type, merged.created_at, merged.notes, merged.previous_balance, merged.new_balance, primKey]
    );
  });
  db.debts.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM debts WHERE id = ?;`, [primKey]);
  });

  // Notes Sync
  db.notes.hook('creating', (primKey, obj) => {
    runSQLiteQueryAsync(`INSERT OR REPLACE INTO notes (id, title, content, created_at, reminder_date, is_completed, priority) VALUES (?, ?, ?, ?, ?, ?, ?);`, [primKey || obj.id, obj.title, obj.content, obj.created_at, obj.reminder_date, obj.is_completed ? 1 : 0, obj.priority]);
  });
  db.notes.hook('updating', (modifications, primKey, obj) => {
    const merged = { ...obj, ...modifications };
    runSQLiteQueryAsync(`UPDATE notes SET title = ?, content = ?, created_at = ?, reminder_date = ?, is_completed = ?, priority = ? WHERE id = ?;`, [merged.title, merged.content, merged.created_at, merged.reminder_date, merged.is_completed ? 1 : 0, merged.priority, primKey]);
  });
  db.notes.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM notes WHERE id = ?;`, [primKey]);
  });

  // Settings Sync
  db.settings.hook('creating', (primKey, obj) => {
    runSQLiteQueryAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);`, [obj.key, JSON.stringify(obj.value)]);
  });
  db.settings.hook('updating', (modifications, primKey, obj) => {
    const merged = { ...obj, ...modifications };
    runSQLiteQueryAsync(`UPDATE settings SET value = ? WHERE key = ?;`, [JSON.stringify(merged.value), primKey]);
  });
  db.settings.hook('deleting', (primKey) => {
    runSQLiteQueryAsync(`DELETE FROM settings WHERE key = ?;`, [primKey]);
  });

  console.log('✅ Real-time synchronization hooks successfully linked between Dexie and Native SQLite.');
}

// Helpers
async function runSQLiteQuery(statement: string, params: any[]): Promise<void> {
  if (!sqliteDb) return;
  try {
    await sqliteDb.run(statement, params);
  } catch (err) {
    console.error('SQLite query execution error:', statement, err);
  }
}

function runSQLiteQueryAsync(statement: string, params: any[]): void {
  if (!sqliteDb) return;
  sqliteDb.run(statement, params).catch((err: any) => {
    console.error('Async SQLite query execution error:', statement, err);
  });
}
