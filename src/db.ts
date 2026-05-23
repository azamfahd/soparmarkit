import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  category: string;
  barcode?: string;
  unit?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  balance: number;
}

export interface Sale {
  id?: number;
  customer_id: number | null;
  total_amount: number;
  payment_type: 'cash' | 'debt';
  created_at: string;
  notes?: string;
}

export interface SaleItem {
  id?: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price_at_sale: number;
}

export interface Debt {
  id?: number;
  customer_id: number;
  sale_id?: number;
  amount: number;
  type: 'purchase' | 'payment';
  created_at: string;
}

export interface InventoryLog {
  id?: number;
  product_id: number;
  change_amount: number;
  reason: string;
  created_at: string;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: any;
}

export interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  created_at: string;
  reminder_date?: string | null;
  is_completed?: boolean;
}

export class GroceryDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  debts!: Table<Debt>;
  inventoryLogs!: Table<InventoryLog>;
  settings!: Table<AppSettings>;
  sync_queue!: Table<SyncQueueItem>;
  notes!: Table<Note>;

  constructor() {
    super('GroceryDB');
    this.version(4).stores({
      products: '++id, name, category, stock_quantity',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp'
    });
    this.version(5).stores({
      products: '++id, name, category, stock_quantity, barcode',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp'
    });
    this.version(6).stores({
      products: '++id, name, category, stock_quantity, barcode',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed'
    });
  }
}

export const db = new GroceryDatabase();

// Seed initial data if empty
export async function seedDatabase() {
  const isFirstRun = await db.settings.where('key').equals('isFirstRun').first();
  if (!isFirstRun) {
    await db.products.bulkAdd([
      { name: "أرز بسمتي 5كج", cost_price: 30, sale_price: 45, stock_quantity: 20, category: "مواد غذائية" },
      { name: "زيت طبخ 1.5لتر", cost_price: 12, sale_price: 18, stock_quantity: 15, category: "زيوت" },
      { name: "حليب طويل الأجل", cost_price: 3, sale_price: 5, stock_quantity: 4, category: "ألبان" },
      { name: "سكر ناعم 2كج", cost_price: 8, sale_price: 12, stock_quantity: 25, category: "مواد غذائية" },
      { name: "مكرونة 400جم", cost_price: 2, sale_price: 3.5, stock_quantity: 50, category: "مواد غذائية" },
      { name: "صابون يدين", cost_price: 5, sale_price: 8, stock_quantity: 12, category: "منظفات" },
      { name: "شاي أحمر 100 كيس", cost_price: 10, sale_price: 15, stock_quantity: 30, category: "مشروبات" },
      { name: "قهوة عربية 500جم", cost_price: 25, sale_price: 40, stock_quantity: 10, category: "مشروبات" },
      { name: "دقيق فاخر 1كج", cost_price: 4, sale_price: 6, stock_quantity: 40, category: "مواد غذائية" },
      { name: "صلصة طماطم", cost_price: 1.5, sale_price: 2.5, stock_quantity: 60, category: "مواد غذائية" }
    ]);

    await db.customers.bulkAdd([
      { name: "أحمد محمد", phone: "0501234567", balance: 150 },
      { name: "سارة علي", phone: "0557654321", balance: 0 },
      { name: "خالد عبدالله", phone: "0561112223", balance: 45 }
    ]);
    
    await db.settings.add({ key: 'isFirstRun', value: false });
  }
}
