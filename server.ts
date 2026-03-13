const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
// استخدام المنفذ الذي توفره منصة Railway أو 3000 كافتراضي
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
    
    // التحقق من البيانات
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

app.delete("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    console.error("خطأ في حذف منتج:", err);
    res.status(500).json({ error: "فشل حذف المنتج" });
  }
});

app.put("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, cost_price, sale_price, stock_quantity, category } = req.body;
    
    const oldProduct = db.prepare("SELECT stock_quantity FROM products WHERE id = ?").get(id);
    if (!oldProduct) {
      return res.status(404).json({ error: "المنتج غير موجود" });
    }
    
    const diff = stock_quantity - (oldProduct as any).stock_quantity;

    db.prepare(`
      UPDATE products 
      SET name = ?, cost_price = ?, sale_price = ?, stock_quantity = ?, category = ? 
      WHERE id = ?
    `).run(name, cost_price, sale_price, stock_quantity, category, id);

    if (diff !== 0) {
      db.prepare("INSERT INTO inventory_logs (product_id, change_amount, reason) VALUES (?, ?, ?)")
        .run(id, diff, 'manual_update');
    }

    res.json({ success: true });
  } catch (err) {
    console.error("خطأ في تحديث منتج:", err);
    res.status(500).json({ error: "فشل تحديث المنتج" });
  }
});

app.delete("/api/customers/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM customers WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    console.error("خطأ في حذف زبون:", err);
    res.status(500).json({ error: "فشل حذف الزبون" });
  }
});

app.delete("/api/sales/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = db.transaction(() => {
      const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
      if (!sale) throw new Error("البيع غير موجود");

      // Restore stock
      const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(id);
      for (const item of items) {
        db.prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?")
          .run((item as any).quantity, (item as any).product_id);
        
        db.prepare("INSERT INTO inventory_logs (product_id, change_amount, reason) VALUES (?, ?, ?)")
          .run((item as any).product_id, (item as any).quantity, 'refund');
      }

      // If debt, reverse it
      if ((sale as any).payment_type === 'debt' && (sale as any).customer_id) {
        db.prepare("UPDATE customers SET balance = balance - ? WHERE id = ?")
          .run((sale as any).total_amount, (sale as any).customer_id);
        db.prepare("DELETE FROM debts WHERE sale_id = ?")
          .run(id);
      }

      db.prepare("DELETE FROM sale_items WHERE sale_id = ?").run(id);
      db.prepare("DELETE FROM sales WHERE id = ?").run(id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err) {
      console.error("خطأ في معاملة حذف البيع:", err);
      res.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error("خطأ في حذف بيع:", err);
    res.status(500).json({ error: "فشل حذف البيع" });
  }
});

app.get("/api/products/:id/history", (req, res) => {
  try {
    const { id } = req.params;
    const history = db.prepare("SELECT * FROM inventory_logs WHERE product_id = ? ORDER BY created_at DESC LIMIT 50").all(id);
    res.json(history);
  } catch (err) {
    console.error("خطأ في جلب سجل المنتج:", err);
    res.status(500).json({ error: "فشل جلب السجل" });
  }
});

app.get("/api/reports/daily-sales", (req, res) => {
  try {
    const data = db.prepare(`
      SELECT date(created_at) as date, SUM(total_amount) as total
      FROM sales
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();
    res.json(data);
  } catch (err) {
    console.error("خطأ في جلب تقرير المبيعات اليومية:", err);
    res.status(500).json({ error: "فشل جلب التقرير" });
  }
});

app.get("/api/reports/summary", (req, res) => {
  try {
    const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM sales").get();
    const totalDebts = db.prepare("SELECT SUM(balance) as total FROM customers").get();
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_quantity < 5").get();
    
    const profit = db.prepare(`
      SELECT SUM((si.price_at_sale - p.cost_price) * si.quantity) as total_profit
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
    `).get();
    
    res.json({
      totalSales: (totalSales as any)?.total || 0,
      totalDebts: (totalDebts as any)?.total || 0,
      lowStock: (lowStock as any)?.count || 0,
      totalProfit: (profit as any)?.total_profit || 0
    });
  } catch (err) {
    console.error("خطأ في جلب ملخص التقرير:", err);
    res.status(500).json({ error: "فشل جلب التقرير" });
  }
});

app.get("/api/export", (req, res) => {
  try {
    const products = db.prepare("SELECT * FROM products").all();
    const customers = db.prepare("SELECT * FROM customers").all();
    const sales = db.prepare("SELECT * FROM sales").all();
    const debts = db.prepare("SELECT * FROM debts").all();
    res.json({ products, customers, sales, debts, exportedAt: new Date().toISOString() });
  } catch (err) {
    console.error("خطأ في تصدير البيانات:", err);
    res.status(500).json({ error: "فشل تصدير البيانات" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = require("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("خطأ غير متوقع:", err);
    res.status(500).json({ error: "حدث خطأ غير متوقع" });
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

// Settings endpoints for PWA
app.get("/api/settings", (req, res) => {
  try {
    const settings = db.prepare("SELECT * FROM settings").all();
    res.json(settings);
  } catch (err) {
    console.error("خطأ في جلب الإعدادات:", err);
    res.status(500).json({ error: "فشل جلب الإعدادات" });
  }
});

app.post("/api/settings", (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: "المفتاح مطلوب" });
    }
    
    const existing = db.prepare("SELECT * FROM settings WHERE key = ?").get(key);
    if (existing) {
      db.prepare("UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?").run(JSON.stringify(value), key);
    } else {
      db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
    }
    res.json({ success: true });
  } catch (err) {
    console.error("خطأ في حفظ الإعدادات:", err);
    res.status(500).json({ error: "فشل حفظ الإعدادات" });
  }
});

// Reset database endpoint
app.post("/api/reset", (req, res) => {
  try {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM sale_items").run();
      db.prepare("DELETE FROM debts").run();
      db.prepare("DELETE FROM inventory_logs").run();
      db.prepare("DELETE FROM sales").run();
      db.prepare("DELETE FROM customers").run();
      db.prepare("DELETE FROM products").run();
    });
    transaction();
    res.json({ success: true, message: "تم إعادة تعيين قاعدة البيانات" });
  } catch (err) {
    console.error("خطأ في إعادة تعيين قاعدة البيانات:", err);
    res.status(500).json({ error: "فشل إعادة التعيين" });
  }
});

// توجيه جميع الطلبات الأخرى إلى index.html لدعم SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ: ${PORT}`);
});

