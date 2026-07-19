import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Local File Database Backup endpoints (قاعدة بيانات النظام)
  app.post('/api/backup', (req, res) => {
    try {
      const data = req.body;
      const backupPath = path.join(process.cwd(), 'قاعدة بيانات النظام.json');
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
      
      res.json({ 
        success: true, 
        message: 'تم حفظ قاعدة بيانات النظام بنجاح على القرص',
        path: 'قاعدة بيانات النظام.json',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Local backup failed:', err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  app.get('/api/barcode/:barcode', async (req, res) => {
    const barcode = req.params.barcode;
    console.log(`Barcode lookup requested: ${barcode}`);
    try {
      const offUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
      const offResponse = await fetch(offUrl);
      if (offResponse.ok) {
        const offData = await offResponse.json();
        if (offData.status === 1 && offData.product) {
          res.json({
            name: offData.product.product_name_ar || offData.product.product_name || offData.product.generic_name || 'منتج غير معروف',
            category: offData.product.categories?.split(',')[0] || '',
            image_url: offData.product.image_front_url || offData.product.image_url,
          });
          return;
        }
      }

      const upcUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
      const upcResponse = await fetch(upcUrl);
      if (upcResponse.ok) {
        const upcData = await upcResponse.json();
        if (upcData.code === 'OK' && upcData.items && upcData.items.length > 0) {
          res.json({
            name: upcData.items[0].title || 'منتج غير معروف',
            category: upcData.items[0].category || '',
            image_url: upcData.items[0].images?.[0],
          });
          return;
        }
      }

      res.status(404).json({ error: 'Product not found' });
    } catch (error) {
      console.error("Error proxying barcode lookup:", error);
      res.status(500).json({ error: 'Failed to fetch from external API' });
    }
  });

  app.get('/api/backup/status', (req, res) => {
    try {
      const backupPath = path.join(process.cwd(), 'قاعدة بيانات النظام.json');
      const exists = fs.existsSync(backupPath);
      if (exists) {
        const stats = fs.statSync(backupPath);
        res.json({
          exists: true,
          size: stats.size,
          lastModified: stats.mtime,
          path: 'قاعدة بيانات النظام.json'
        });
      } else {
        res.json({ exists: false });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

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

  // AI Smart Import endpoint
  app.post('/api/gemini/smart-import', async (req, res) => {
    const { dataType, text, fileData } = req.body;

    if (!dataType || (!text && !fileData)) {
      return res.status(400).json({ success: false, error: 'الرجاء توفير نوع البيانات والمدخلات النصية أو ملف الصورة.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير متاح. يرجى إضافته من قائمة الإعدادات > أسرار التطبيق.'
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let contents: any[] = [];

      // If document or image is uploaded
      if (fileData && fileData.data) {
        contents.push({
          inlineData: {
            mimeType: fileData.mimeType || 'image/png',
            data: fileData.data // base64 payload
          }
        });
      }

      // Context-aware smart system guide prompt
      let instructionText = `أنت مساعد خبير وموثوق في إدخال وقراءة البيانات المحاسبية للمحلات التجارية والمنشآت.
مهمتك هي تحليل المستند أو الصورة أو النص المرفق واستخراج قائمة من البيانات التفضيلية المحاسبية النظيفة والموثوقة وإرجاعها بتنسيق JSON حصراً ملتزماً بالمخطط المحدد بدقة وسرعة وبدون أي لف ودوران.
نوع البيانات المطلوب استخراجها حالياً هو: [${dataType}]

إرشادات محاسبية صارمة:
1. استخراج الأرقام المحاسبية بدقة متناهية (الكميات، تكلفة الشراء، سعر البيع للمستهلك، أرصدة الديون المستحقة).
2. في حال عدم العثور على قيم رقمية محددة للمنتج أو الشخص، قم بافتراض صفر (0) لتأمين سلامة كشوف الحسابات واللوغاريتم المحاسبي للنظام.
3. التسميات والمسميات: حافظ على اسم الصنف أو العميل بدقة تامة وباللغة المكتوبة في الدفتر أو الفاتورة لمراعاة الأرشفة.
4. التصنيفات: قم بتخمين وتجنيس المنتجات لتبويب مالي رصين (مثال: مواد غذائية، زيوت، بقوليات، ألبان، منظفات، حلويات، مشروبات...).
5. لا تقم بكتابة أي عبارات ترحيبية أو شروح خارج إطار الـ JSON المطلوب.`;

      if (text) {
        instructionText += `\n\nالنص المرفق أو محتوى الملف الإضافي:\n${text}`;
      }

      contents.push(instructionText);

      let responseSchema: any;
      if (dataType === 'products') {
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              description: "قائمة المنتجات التي تم استخراجها وتصنيفها بنجاح.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "اسم المنتج بالتفصيل (مثال: أرز بسمتي 5كج)." },
                  cost_price: { type: Type.NUMBER, description: "سعر الشراء / التكلفة للمنتج الواحد. رقم فقط." },
                  sale_price: { type: Type.NUMBER, description: "سعر البيع للمستهلك. رقم فقط." },
                  stock_quantity: { type: Type.NUMBER, description: "الكمية الحالية المتوفرة بالمخزون. رقم فقط." },
                  category: { type: Type.STRING, description: "تصنيف المنتج لتبويب الرفوف (مثال: مواد غذائية، مجمدات، منظفات...)." },
                  barcode: { type: Type.STRING, description: "الباركود الخاص بالمنتج في حال وجوده بالجدول، أو اتركه فارغاً." },
                  unit: { type: Type.STRING, description: "وحدة القياس للمنتج (حبة، كيس، كرتون، كيلو). افتراضياً 'حبة'." }
                },
                required: ["name", "cost_price", "sale_price", "stock_quantity"]
              }
            }
          },
          required: ["products"]
        };
      } else if (dataType === 'customers') {
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            customers: {
              type: Type.ARRAY,
              description: "قائمة العملاء وبيانات ديونهم.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "اسم العميل/الزبون الكامل." },
                  phone: { type: Type.STRING, description: "رقم هاتف العميل، اتركه فارغاً إذا لم يذكر في المستند." },
                  balance: { type: Type.NUMBER, description: "حجم الدين الحالي المتراكم على العميل. رقم فقط." }
                },
                required: ["name", "phone", "balance"]
              }
            }
          },
          required: ["customers"]
        };
      } else if (dataType === 'mixed') {
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              description: "جميع أصناف المنتجات وبضائع الرفوف المستخرجة من المستند.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "الاسم التفصيلي للمنتج." },
                  cost_price: { type: Type.NUMBER, description: "سعر التكلفة أو الشراء. افتراضياً 0." },
                  sale_price: { type: Type.NUMBER, description: "سعر البيع للمستهلك. افتراضياً 0." },
                  stock_quantity: { type: Type.NUMBER, description: "الكمية الحالية المتبقية. افتراضياً 1." },
                  category: { type: Type.STRING, description: "التصنيف المحاسبي للمنتج." },
                  barcode: { type: Type.STRING, description: "الباركود أو رمز السلعة." },
                  unit: { type: Type.STRING, description: "الوحدة (حبة، كرتون، كيلو)." }
                },
                required: ["name"]
              }
            },
            customers: {
              type: Type.ARRAY,
              description: "جميع ديون العملاء والزبائن الذين يترتب عليهم مبالغ مالية.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "الاسم الكامل للزبون." },
                  phone: { type: Type.STRING, description: "الجوال للزبون." },
                  balance: { type: Type.NUMBER, description: "المبلغ الإجمالي المستحق أو الدين المترتب عليه. افتراضياً 0." }
                },
                required: ["name"]
              }
            },
            suppliers: {
              type: Type.ARRAY,
              description: "جميع السجلات المرتبطة بالشركات الموردة أو الفواتير المستحقة لهم.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "اسم الشركة الموردة أو المندوب." },
                  phone: { type: Type.STRING, description: "الهاتف أو الجوال للمورد." },
                  balance: { type: Type.NUMBER, description: "الرصيد أو المستحقات الحالية للمورد بذمتك. افتراضياً 0." }
                },
                required: ["name"]
              }
            }
          }
        };
      } else {
        // suppliers
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            suppliers: {
              type: Type.ARRAY,
              description: "قائمة الموردين والأرصدة المستحقة لهم.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "اسم الشركة الموردة أو المندوب الكامل." },
                  phone: { type: Type.STRING, description: "رقم هاتف المورد إن وجد." },
                  balance: { type: Type.NUMBER, description: "الرصيد أو المبلغ المستحق للمورد بذمة التاجر. رقم فقط." }
                },
                required: ["name", "phone", "balance"]
              }
            }
          },
          required: ["suppliers"]
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1
        }
      });

      const parsedResult = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsedResult });

    } catch (err: any) {
      console.error('Gemini smart import failed:', err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
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
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
