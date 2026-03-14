import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // SQLite database setup
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'grocery.db');
  const db = new Database(dbPath);

  // Initialize database schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cost_price REAL NOT NULL,
      sale_price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL,
      category TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      balance REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total_amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saleItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_sale REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      sale_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventoryLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      value TEXT NOT NULL
    );
  `);

  // Products
  app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
  });

  app.post('/api/products', (req, res) => {
    const { name, cost_price, sale_price, stock_quantity, category } = req.body;
    const stmt = db.prepare('INSERT INTO products (name, cost_price, sale_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, cost_price, sale_price, stock_quantity, category);
    res.json({ id: info.lastInsertRowid, name, cost_price, sale_price, stock_quantity, category });
  });

  app.put('/api/products/:id', (req, res) => {
    const { name, cost_price, sale_price, stock_quantity, category } = req.body;
    const stmt = db.prepare('UPDATE products SET name = ?, cost_price = ?, sale_price = ?, stock_quantity = ?, category = ? WHERE id = ?');
    stmt.run(name, cost_price, sale_price, stock_quantity, category, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/products/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/products/:id/history', (req, res) => {
    const logs = db.prepare('SELECT * FROM inventoryLogs WHERE product_id = ?').all(req.params.id);
    res.json(logs);
  });

  // Customers
  app.get('/api/customers', (req, res) => {
    const customers = db.prepare('SELECT * FROM customers').all();
    res.json(customers);
  });

  app.post('/api/customers', (req, res) => {
    const { name, phone, balance } = req.body;
    const stmt = db.prepare('INSERT INTO customers (name, phone, balance) VALUES (?, ?, ?)');
    const info = stmt.run(name, phone, balance);
    res.json({ id: info.lastInsertRowid, name, phone, balance });
  });

  app.delete('/api/customers/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/customers/:id/pay', (req, res) => {
    const { amount } = req.body;
    const stmt = db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?');
    stmt.run(amount, req.params.id);
    res.json({ success: true });
  });

  app.get('/api/customers/:id/history', (req, res) => {
    const sales = db.prepare('SELECT * FROM sales WHERE customer_id = ?').all(req.params.id);
    const debts = db.prepare('SELECT * FROM debts WHERE customer_id = ?').all(req.params.id);
    res.json({ sales, debts });
  });

  // Sales
  app.get('/api/sales', (req, res) => {
    const sales = db.prepare('SELECT * FROM sales').all();
    res.json(sales);
  });

  app.post('/api/sales', (req, res) => {
    const { customer_id, total_amount, payment_type, created_at } = req.body;
    const stmt = db.prepare('INSERT INTO sales (customer_id, total_amount, payment_type, created_at) VALUES (?, ?, ?, ?)');
    const info = stmt.run(customer_id, total_amount, payment_type, created_at);
    res.json({ id: info.lastInsertRowid, customer_id, total_amount, payment_type, created_at });
  });

  app.delete('/api/sales/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM sales WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Reports
  app.get('/api/reports/summary', (req, res) => {
    const totalSales = (db.prepare('SELECT SUM(total_amount) as total FROM sales').get() as { total: number })?.total || 0;
    const totalDebts = (db.prepare('SELECT SUM(balance) as total FROM customers').get() as { total: number })?.total || 0;
    const lowStock = (db.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity < 5').get() as { count: number })?.count || 0;
    res.json({ totalSales, totalDebts, lowStock, totalProfit: 0 });
  });

  app.get('/api/reports/daily-sales', (req, res) => {
    const sales = db.prepare('SELECT date(created_at) as date, SUM(total_amount) as total FROM sales GROUP BY date(created_at) ORDER BY date DESC LIMIT 7').all();
    res.json(sales);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
