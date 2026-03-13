import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_PATH = process.env.DATABASE_PATH || "grocery.db";

// إنشاء قاعدة البيانات مع معالجة الأخطاء
let db;
try {
  db = new Database(DATABASE_PATH);
  console.log(`تم الاتصال بقاعدة البيانات: ${DATABASE_PATH}`);
} catch (err) {
  console.error("فشل الاتصال بقاعدة البيانات:", err);
  process.exit(1);
}

// تفعيل Foreign Keys
db.pragma('foreign_keys = ON');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cost_price REAL NOT NULL,
    sale_price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    balance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total_amount REAL NOT NULL,
    payment_type TEXT CHECK(payment_type IN ('cash', 'debt')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price_at_sale REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    sale_id INTEGER,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('purchase', 'payment')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(sale_id) REFERENCES sales(id)
  );

  CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    change_amount INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());

// تقديم الملفات الثابتة من مجلد dist
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

// Middleware لتسجيل الطلبات
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.get("/api/products", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  } catch (err) {
    console.error("خطأ في جلب المنتجات:", err);
    res.status(500).json({ error: "فشل جلب المنتجات" });
  }
});

app.post("/api/products", (req, res) => {
  try {
    const { name, cost_price, sale_price, stock_quantity, category } = req.body;
    
    if (!name || cost_price === undefined || sale_price === undefined || stock_quantity === undefined) {
      return res.status(400).json({ error: "بيانات غير كاملة" });
    }
    
    const info = db.prepare("INSERT INTO products (name, cost_price, sale_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?)")
      .run(name, cost_price, sale_price, stock_quantity, category);
    
    db.prepare("INSERT INTO inventory_logs (product_id, change_amount, reason) VALUES (?, ?, ?)")
      .run(info.lastInsertRowid, stock_quantity, 'initial');
      
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    console.error("خطأ في إضافة منتج:", err);
    res.status(500).json({ error: "فشل إضافة المنتج" });
  }
});

app.get("/api/customers", (req, res) => {
  try {
    const customers = db.prepare("SELECT * FROM customers").all();
    res.json(customers);
  } catch (err) {
    console.error("خطأ في جلب الزبائن:", err);
    res.status(500).json({ error: "فشل جلب الزبائن" });
  }
});

app.post("/api/customers", (req, res) => {
  try {
    const { name, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "اسم الزبون مطلوب" });
    }
    
    const info = db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)")
      .run(name, phone);
    res.json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    console.error("خطأ في إضافة زبون:", err);
    res.status(500).json({ error: "فشل إضافة الزبون" });
  }
});

app.post("/api/sales", (req, res) => {
  try {
    const { customer_id, items, payment_type, total_amount } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "لا توجد عناصر في البيع" });
    }
    
    const transaction = db.transaction(() => {
      const saleInfo = db.prepare("INSERT INTO sales (customer_id, total_amount, payment_type) VALUES (?, ?, ?)")
        .run(customer_id || null, total_amount, payment_type);
      
      const saleId = saleInfo.lastInsertRowid;

      for (const item of items) {
        db.prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)")
          .run(saleId, item.product_id, item.quantity, item.price);
        
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?")
          .run(item.quantity, item.product_id);

        db.prepare("INSERT INTO inventory_logs (product_id, change_amount, reason) VALUES (?, ?, ?)")
          .run(item.product_id, -item.quantity, 'sale');
      }

      if (payment_type === "debt" && customer_id) {
        db.prepare("UPDATE customers SET balance = balance + ? WHERE id = ?")
          .run(total_amount, customer_id);
        
        db.prepare("INSERT INTO debts (customer_id, sale_id, amount, type) VALUES (?, ?, ?, 'purchase')")
          .run(customer_id, saleId, total_amount);
      }
      
      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ success: true, saleId });
    } catch (err) {
      console.error("خطأ في معاملة البيع:", err);
      res.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error("خطأ في إنشاء بيع:", err);
    res.status(500).json({ error: "فشل إنشاء البيع" });
  }
});

// Seed Initial Data if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get();
if (productCount && productCount.count === 0) {
  console.log("إضافة بيانات أولية...");
  const seedProducts = [
    ["أرز بسمتي 5كج", 30, 45, 20, "مواد غذائية"],
    ["زيت طبخ 1.5لتر", 12, 18, 15, "زيوت"],
    ["حليب طويل الأجل", 3, 5, 4, "ألبان"],
    ["سكر ناعم 2كج", 8, 12, 25, "مواد غذائية"],
    ["مكرونة 400جم", 2, 3.5, 50, "مواد غذائية"],
    ["صابون يدين", 5, 8, 12, "منظفات"],
    ["شاي أحمر 100 كيس", 10, 15, 30, "مشروبات"],
    ["قهوة عربية 500جم", 25, 40, 10, "مشروبات"],
    ["دقيق فاخر 1كج", 4, 6, 40, "مواد غذائية"],
    ["صلصة طماطم", 1.5, 2.5, 60, "مواد غذائية"]
  ];

  const insertProduct = db.prepare("INSERT INTO products (name, cost_price, sale_price, stock_quantity, category) VALUES (?, ?, ?, ?, ?)");
  seedProducts.forEach(p => insertProduct.run(...p));

  db.prepare("INSERT INTO customers (name, phone, balance) VALUES (?, ?, ?)")
    .run("أحمد محمد", "0501234567", 150);
  db.prepare("INSERT INTO customers (name, phone, balance) VALUES (?, ?, ?)")
    .run("سارة علي", "0557654321", 0);
  db.prepare("INSERT INTO customers (name, phone, balance) VALUES (?, ?, ?)")
    .run("خالد عبدالله", "0561112223", 45);
    
  console.log("تم إضافة البيانات الأولية بنجاح");
}

app.get("/api/customers/:id/history", (req, res) => {
  try {
    const { id } = req.params;
    
    const sales = db.prepare(`
      SELECT s.*, 
             (SELECT json_group_array(json_object('name', p.name, 'quantity', si.quantity, 'price', si.price_at_sale))
              FROM sale_items si 
              JOIN products p ON si.product_id = p.id 
              WHERE si.sale_id = s.id) as items
      FROM sales s
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `).all(id);

    const debts = db.prepare(`
      SELECT * FROM debts 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `).all(id);

    res.json({ sales, debts });
  } catch (err) {
    console.error("خطأ في جلب سجل الزبون:", err);
    res.status(500).json({ error: "فشل جلب السجل" });
  }
});

app.post("/api/customers/:id/pay", (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "المبلغ غير صحيح" });
    }

    const transaction = db.transaction(() => {
      db.prepare("UPDATE customers SET balance = balance - ? WHERE id = ?")
        .run(amount, id);
      
      db.prepare("INSERT INTO debts (customer_id, amount, type) VALUES (?, ?, 'payment')")
        .run(id, amount);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error("خطأ في معاملة الدفع:", err);
      res.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error("خطأ في معالجة الدفع:", err);
    res.status(500).json({ error: "فشل معالجة الدفع" });
  }
});

app.get("/api/sales", (req, res) => {
  try {
    const sales = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      ORDER BY s.created_at DESC 
      LIMIT 50
    `).all();
    res.json(sales);
  } catch (err) {
    console.error("خطأ في جلب المبيعات:", err);
    res.status(500).json({ error: "فشل جلب المبيعات" });
  }
});

// Health check endpoint
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("خطأ غير متوقع:", err);
    res.status(500).json({ error: "حدث خطأ غير متوقع" });
  });

  // توجيه جميع الطلبات الأخرى إلى index.html لدعم SPA
  // في Express 5، نستخدم التعبير النمطي (RegExp) لضمان التوافق مع مسار "catch-all"
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Start server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`📊 قاعدة البيانات: ${DATABASE_PATH}`);
    console.log(`🌍 البيئة: ${process.env.NODE_ENV || 'production'}`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nإغلاق الخادم...');
  db.close();
  process.exit(0);
});
