import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Local File Database Backup endpoints (قاعدة بيانات النظام)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/backup/status', (req, res) => {
    try {
      const backupPath = path.join(process.cwd(), 'قاعدة بيانات النظام.json');
      if (fs.existsSync(backupPath)) {
        const stats = fs.statSync(backupPath);
        res.json({
          exists: true,
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
          path: 'قاعدة بيانات النظام.json'
        });
      } else {
        res.json({
          exists: false,
          path: 'قاعدة بيانات النظام.json'
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/backup', (req, res) => {
    try {
      const backupPath = path.join(process.cwd(), 'قاعدة بيانات النظام.json');
      if (fs.existsSync(backupPath)) {
        const content = fs.readFileSync(backupPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(content);
      } else {
        res.status(404).json({ error: 'ملف النسخ الاحتياطي غير موجود حالياً' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

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

  // Verify API Key
  app.post('/api/gemini/verify', async (req, res) => {
    try {
      const { customApiKey } = req.body;
      const apiKeyToUse = customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKeyToUse) {
        return res.status(400).json({ success: false, error: 'مفتاح API الخاص بـ Gemini غير متوفر. يرجى إدخال مفتاح صالح.' });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKeyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'test',
      });

      if (response && response.text) {
        return res.json({ success: true });
      } else {
        return res.status(400).json({ success: false, error: 'لم تنجح عملية التحقق. يرجى مراجعة صلاحية المفتاح.' });
      }
    } catch (err: any) {
      console.error('Verify API key failed:', err);
      return res.status(400).json({ success: false, error: err.message || String(err) });
    }
  });

  // Smart Import
  app.post('/api/gemini/smart-import', async (req, res) => {
    try {
      const { dataType, text, fileData, customApiKey } = req.body;
      const apiKeyToUse = customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKeyToUse) {
        return res.status(400).json({ success: false, error: 'مفتاح API الخاص بـ Gemini غير متوفر. يرجى توفيره أو ضبطه في لوحة الإعدادات.' });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKeyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const contents: any[] = [];
      if (fileData && fileData.data) {
        contents.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        });
      }

      if (text) {
        contents.push({
          text: `البيانات النصية المدخلة أو المستخرجة:\n${text}`
        });
      }

      contents.push({
        text: `قم بتحليل البيانات أعلاه واستخراجها وتنظيمها محاسبياً بدقة متناهية.
النوع المطلوب استخراجه هو: ${dataType === 'mixed' ? 'كل أنواع البيانات (شامل)' : dataType === 'products' ? 'المنتجات والمخازن' : dataType === 'customers' ? 'العملاء والديون' : 'الموردين والحسابات'}.

تعليمات الاستخراج الفائق:
1. المنتجات (products): استخرج الأسماء، الأسعار والتكلفة، الكمية المتوفرة، تصنيف الصنف، وحدة القياس، والباركود. تأكد أن سعر البيع لا يقل عن سعر التكلفة لضمان سلامة الأرباح.
2. العملاء (customers): استخرج الاسم ورقم الجوال والرصيد المدين (الدين).
3. الموردين (suppliers): استخرج الاسم ورقم الهاتف والرصيد الدائن المستحق لهم.
4. أرجع مصفوفات فارغة للأنواع غير المكتشفة أو غير المطلوبة.`
      });

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          products: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "اسم المنتج الصريح والواضح" },
                cost_price: { type: Type.NUMBER, description: "سعر الشراء أو التكلفة للمنتج" },
                sale_price: { type: Type.NUMBER, description: "سعر البيع للمستهلك" },
                stock_quantity: { type: Type.NUMBER, description: "الكمية المتوفرة في المخزون" },
                category: { type: Type.STRING, description: "تصنيف المنتج أو قسمه" },
                unit: { type: Type.STRING, description: "وحدة القياس مثل حبة، كرتون، كيلو" },
                barcode: { type: Type.STRING, description: "الرمز الشريطي أو الباركود إذا وجد" }
              },
              required: ["name"]
            }
          },
          customers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "اسم العميل أو الزبون الثنائي أو الثلاثي" },
                phone: { type: Type.STRING, description: "رقم جوال العميل" },
                balance: { type: Type.NUMBER, description: "إجمالي الدين المترتب عليه" }
              },
              required: ["name"]
            }
          },
          suppliers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "اسم المورد أو الشركة الموردة" },
                phone: { type: Type.STRING, description: "رقم هاتف المورد" },
                balance: { type: Type.NUMBER, description: "الرصيد المستحق لهم أو الدائن" }
              },
              required: ["name"]
            }
          }
        }
      };

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          systemInstruction: "أنت خبير محاسبة وتدقيق مالي متطور للغاية. تقوم باستخراج البيانات المالية والديون وجداول المخازن من فواتير الشراء وصور الفواتير والملفات ودفاتر الديون وتنسيقها بشكل مثالي دون أي نقصان أو تلف في البيانات الحسابية الدقيقة.",
        }
      });

      const resultText = aiResponse.text;
      if (!resultText) {
        throw new Error('لم يقم نموذج الذكاء الاصطناعي بإرجاع استجابة صالحة.');
      }

      const parsedData = JSON.parse(resultText.trim());
      return res.json({
        success: true,
        data: parsedData
      });
    } catch (err: any) {
      console.error('Smart Import AI processing failed:', err);
      return res.status(500).json({ success: false, error: err.message || String(err) });
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
