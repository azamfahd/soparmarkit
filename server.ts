import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

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
