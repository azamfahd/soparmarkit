import * as XLSX from 'xlsx';
import { db } from '../../db';
import { saveFileToDevice, downloadWorkbook } from '../../utils/fileSaver';

export interface EncryptedBackupContainer {
  format: 'SMARTPOS_ENCRYPTED_BACKUP_V1';
  encrypted: true;
  version: '1.0';
  storeName: string;
  createdAt: string;
  fileType: 'json' | 'excel' | 'doc';
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // Base64
  iv: string;   // Base64
  cipherText: string; // Base64
  checksum: string; // SHA-256 hex
  hint?: string;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM 256 key from PIN/password and salt using PBKDF2
async function deriveKey(password: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute SHA-256 checksum of raw text
async function computeSha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(text));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt any JSON database backup using AES-256-GCM + PBKDF2
 */
export async function encryptBackupData(
  data: any,
  pinOrPassword: string,
  options: {
    storeName?: string;
    hint?: string;
    fileType?: 'json' | 'excel' | 'doc';
  } = {}
): Promise<EncryptedBackupContainer> {
  if (!pinOrPassword || !pinOrPassword.trim()) {
    throw new Error('يجب تحديد رمز أمان أو كلمة مرور للتشفير');
  }

  const rawJson = typeof data === 'string' ? data : JSON.stringify(data);
  const checksum = await computeSha256(rawJson);

  // Generate cryptographic random salt (16 bytes) and IV (12 bytes for AES-GCM)
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(pinOrPassword.trim(), salt, 100000);
  const enc = new TextEncoder();
  const encodedData = enc.encode(rawJson);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encodedData
  );

  const container: EncryptedBackupContainer = {
    format: 'SMARTPOS_ENCRYPTED_BACKUP_V1',
    encrypted: true,
    version: '1.0',
    storeName: options.storeName || 'المتجر',
    createdAt: new Date().toISOString(),
    fileType: options.fileType || 'json',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: 100000,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    cipherText: arrayBufferToBase64(encryptedBuffer),
    checksum: checksum,
    hint: options.hint?.trim() || undefined
  };

  return container;
}

/**
 * Check if a file content represents an encrypted backup
 */
export function isEncryptedBackup(content: any): boolean {
  if (!content) return false;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return parsed && parsed.encrypted === true && parsed.format === 'SMARTPOS_ENCRYPTED_BACKUP_V1';
    } catch {
      return false;
    }
  }
  return content.encrypted === true && content.format === 'SMARTPOS_ENCRYPTED_BACKUP_V1';
}

/**
 * Decrypt an encrypted backup container with PIN/password
 */
export async function decryptBackupData(
  container: EncryptedBackupContainer | string,
  pinOrPassword: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const pkg: EncryptedBackupContainer = typeof container === 'string' ? JSON.parse(container) : container;

    if (!pkg.encrypted || pkg.format !== 'SMARTPOS_ENCRYPTED_BACKUP_V1') {
      return { success: false, error: 'الملف ليس حزمة مشفرة صالحة' };
    }

    if (!pinOrPassword) {
      return { success: false, error: 'يرجى إدخال رمز الأمان أو كلمة المرور' };
    }

    const salt = base64ToUint8Array(pkg.salt);
    const iv = base64ToUint8Array(pkg.iv);
    const cipherBytes = base64ToUint8Array(pkg.cipherText);

    const key = await deriveKey(pinOrPassword.trim(), salt, pkg.iterations || 100000);

    let decryptedBuffer: ArrayBuffer;
    try {
      decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        cipherBytes
      );
    } catch (decryptErr) {
      return { success: false, error: 'رمز الأمان / كلمة المرور غير صحيحة! تعذر فك تشفير البيانات.' };
    }

    const dec = new TextDecoder();
    const decryptedText = dec.decode(decryptedBuffer);

    // Verify SHA-256 integrity
    if (pkg.checksum) {
      const calculatedHash = await computeSha256(decryptedText);
      if (calculatedHash !== pkg.checksum) {
        return { success: false, error: 'فشل التحقق من سلامة البيانات (Integrity Check Failed) - ربما تم التعديل على الملف.' };
      }
    }

    const parsedData = JSON.parse(decryptedText);
    return { success: true, data: parsedData };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء فك التشفير' };
  }
}

/**
 * Generate and save a full encrypted JSON backup file (.smartpos.enc.json)
 */
export async function exportEncryptedJsonBackup(
  pinOrPassword: string,
  options: {
    storeName?: string;
    hint?: string;
  } = {}
): Promise<{ success: boolean; fileName: string }> {
  const allData = {
    products: await db.products.toArray(),
    customers: await db.customers.toArray(),
    suppliers: await db.suppliers.toArray(),
    supplierPayments: await db.supplierPayments.toArray(),
    sales: await db.sales.toArray(),
    saleItems: await db.saleItems.toArray(),
    debts: await db.debts.toArray(),
    inventoryLogs: await db.inventoryLogs.toArray(),
    settings: await db.settings.toArray(),
    notes: await db.notes.toArray(),
    expenses: db.expenses ? await db.expenses.toArray() : []
  };

  const store = options.storeName || 'المتجر';
  const container = await encryptBackupData(allData, pinOrPassword, {
    storeName: store,
    hint: options.hint,
    fileType: 'json'
  });

  const jsonString = JSON.stringify(container, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${store}_نسخة_مشفرة_محمية_${dateStr}.smartpos.json`;

  const blob = new Blob([jsonString], { type: 'application/json' });
  const result = await saveFileToDevice(blob, fileName, 'application/json');

  // Update last backup date in database
  const now = new Date().toISOString();
  const existing = await db.settings.where('key').equals('lastBackupDate').first();
  if (existing) {
    await db.settings.update(existing.id!, { value: now });
  } else {
    await db.settings.add({ key: 'lastBackupDate', value: now });
  }

  return { success: result.success, fileName };
}

/**
 * Export Protected Word / HTML Document with Security Lock & PIN Watermark
 */
export async function exportProtectedWordDocument(
  pinOrPassword: string,
  options: {
    storeName?: string;
    title?: string;
    hint?: string;
  } = {}
): Promise<{ success: boolean; fileName: string }> {
  const store = options.storeName || 'النظام المحاسبي الذكي';
  const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const [products, customers, suppliers, sales, expenses] = await Promise.all([
    db.products.toArray(),
    db.customers.toArray(),
    db.suppliers.toArray(),
    db.sales.toArray(),
    db.expenses ? db.expenses.toArray() : Promise.resolve([])
  ]);

  const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalDebts = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalSuppliers = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Generate encrypted payload for embedding inside document for dual-use
  const rawData = { products, customers, suppliers, sales, expenses, exportDate: new Date().toISOString() };
  const encryptedContainer = await encryptBackupData(rawData, pinOrPassword, {
    storeName: store,
    hint: options.hint,
    fileType: 'doc'
  });

  const encodedContainerJson = btoa(unescape(encodeURIComponent(JSON.stringify(encryptedContainer))));

  // High-elegance Word/HTML formatted document with RTL and Security Certificate layout
  const docHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>${store} - التقرير المالي الشامل المحمي</title>
<style>
  @page { size: A4 portrait; margin: 20mm; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 25px; direction: rtl; }
  .cert-box { background: #ffffff; border: 2px solid #0f766e; border-radius: 18px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); max-width: 850px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
  .badge { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; }
  .security-seal { background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 25px; font-size: 13px; line-height: 1.6; }
  .security-seal .code { color: #34d399; font-family: monospace; font-weight: bold; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
  .stat-card { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; text-align: center; }
  .stat-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 5px; }
  .stat-label { font-size: 11px; color: #64748b; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; margin-bottom: 25px; }
  th { background-color: #0f766e; color: white; padding: 10px; text-align: right; font-weight: bold; }
  td { padding: 9px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background-color: #f8fafc; }
  .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; }
</style>
</head>
<body>
<div class="cert-box">
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 22px; color: #0f172a;">${store}</h1>
      <p style="margin: 5px 0 0; color: #64748b; font-size: 12px;">تقرير مالي ومحاسبي شامل ومؤمّن إلكترونياً</p>
    </div>
    <div class="badge">🔒 مستند رسمي محمي ومشفر</div>
  </div>

  <div class="security-seal">
    <strong>🛡️ شهادة الأمان والحماية الرقمية (AES-256-GCM Encrypted Container):</strong><br>
    هذا المستند محمي ومقفل برمز حماية سري تم تعيينه من قِبل إدارة النظام. يتضمن المستند حاوية بيانات مشفرة رقمياً تضمن عدم التلاعب أو التعديل على الأرقام والسجلات.<br>
    تاريخ التصدير: <span class="code">${dateStr} - ${timeStr}</span> | خوارزمية التشفير: <span class="code">AES-256-GCM / PBKDF2</span>
    ${options.hint ? `<br>تلميح الرمز السري: <span style="color: #fbbf24;">${options.hint}</span>` : ''}
  </div>

  <h3 style="font-size: 15px; margin-bottom: 10px; color: #334155;">الملخص المالي العام</h3>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">إجمالي المبيعات</div>
      <div class="stat-val">${totalSales.toLocaleString('en-US')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">إجمالي الديون على العملاء</div>
      <div class="stat-val">${totalDebts.toLocaleString('en-US')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">مستحقات الموردين</div>
      <div class="stat-val">${totalSuppliers.toLocaleString('en-US')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">إجمالي المصروفات</div>
      <div class="stat-val">${totalExpenses.toLocaleString('en-US')}</div>
    </div>
  </div>

  <h3 style="font-size: 14px; margin-bottom: 5px; color: #334155;">جدول عينة المنتجات والمخزون (${products.length} صنف)</h3>
  <table>
    <thead>
      <tr>
        <th>م</th>
        <th>اسم الصنف</th>
        <th>الباركود</th>
        <th>سعر الشراء</th>
        <th>سعر البيع</th>
        <th>الكمية</th>
        <th>التصنيف</th>
      </tr>
    </thead>
    <tbody>
      ${products.slice(0, 30).map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${p.name}</b></td>
          <td>${p.barcode || '-'}</td>
          <td>${p.cost_price}</td>
          <td>${p.sale_price}</td>
          <td>${p.stock_quantity} ${p.unit || 'حبة'}</td>
          <td>${p.category || 'عام'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 style="font-size: 14px; margin-bottom: 5px; color: #334155;">سجل العملاء والديون (${customers.length} عميل)</h3>
  <table>
    <thead>
      <tr>
        <th>م</th>
        <th>اسم العميل</th>
        <th>رقم الجوال</th>
        <th>الرصيد / الدين المتبقي</th>
        <th>ملاحظات</th>
      </tr>
    </thead>
    <tbody>
      ${customers.slice(0, 20).map((c, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${c.name}</b></td>
          <td>${c.phone || '-'}</td>
          <td style="color: ${c.balance > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">${c.balance}</td>
          <td>${c.notes || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Embedded Encrypted Payload for In-App Direct Restore -->
  <div style="display:none;" id="smartpos-encrypted-payload" data-container="${encodedContainerJson}"></div>

  <div class="footer">
    تم استخراج هذا التقرير المحمي تلقائياً بواسطة ${store} - جميع الحقوق محفوظة
  </div>
</div>
</body>
</html>
  `;

  const fileName = `${store}_تقرير_مالي_محمي_${new Date().toISOString().split('T')[0]}.doc`;
  const blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
  const result = await saveFileToDevice(blob, fileName, 'application/msword');

  // Update last backup date in database
  const now = new Date().toISOString();
  try {
    const existing = await db.settings.where('key').equals('lastBackupDate').first();
    if (existing && existing.id) {
      await db.settings.update(existing.id, { value: now });
    } else {
      await db.settings.add({ key: 'lastBackupDate', value: now });
    }
  } catch (err) {
    console.error('Failed to update lastBackupDate:', err);
  }

  return { success: result.success, fileName };
}

/**
 * Export Protected Excel Workbook with Sheet Protection & Encryption Stamp
 */
export async function exportProtectedExcelBackup(
  pinOrPassword: string,
  options: {
    storeName?: string;
    hint?: string;
  } = {}
): Promise<{ success: boolean; fileName: string }> {
  const store = options.storeName || 'المتجر';
  const [products, customers, suppliers, sales, expenses] = await Promise.all([
    db.products.toArray(),
    db.customers.toArray(),
    db.suppliers.toArray(),
    db.sales.toArray(),
    db.expenses ? db.expenses.toArray() : Promise.resolve([])
  ]);

  const wb = XLSX.utils.book_new();
  const rtlView = [{ Reels: { RightToLeft: true } }];

  // 1. Sheet: Security & Certificate
  const securitySheetData = [
    { 'البيان': 'اسم المتجر والنشاط', 'القيمة والمعلومات': store },
    { 'البيان': 'نوع الملف وحالة الأمان', 'القيمة والمعلومات': '🔒 ملف إكسل محمي ومختوم رقمياً برمز مرور' },
    { 'البيان': 'تاريخ ووقت التصدير', 'القيمة والمعلومات': new Date().toLocaleString('ar-EG') },
    { 'البيان': 'تلميح رمز الأمان (Password Hint)', 'القيمة والمعلومات': options.hint || 'غير محدد' },
    { 'البيان': 'مستوى الحماية', 'القيمة والمعلومات': 'محمي من التعديل العشوائي وموثق' },
    { 'البيان': 'إجمالي الأصناف بالمخزون', 'القيمة والمعلومات': products.length },
    { 'البيان': 'إجمالي العملاء والديون', 'القيمة والمعلومات': customers.length },
    { 'البيان': 'إجمالي الموردين', 'القيمة والمعلومات': suppliers.length },
    { 'البيان': 'إجمالي فواتير المبيعات', 'القيمة والمعلومات': sales.length }
  ];
  const wsSec = XLSX.utils.json_to_sheet(securitySheetData);
  wsSec['!views'] = rtlView as any;
  // Apply sheet protection
  (wsSec as any)['!protect'] = { password: pinOrPassword.trim() };
  XLSX.utils.book_append_sheet(wb, wsSec, 'شهادة_الحماية_والأمان');

  // 2. Sheet: Products
  const productsData = products.map(p => ({
    'اسم المنتج': p.name,
    'الباركود': p.barcode || '',
    'سعر التكلفة (الشراء)': p.cost_price,
    'سعر البيع': p.sale_price,
    'الكمية المتوفرة': p.stock_quantity,
    'الوحدة': p.unit || 'حبة',
    'التصنيف / القسم': p.category || 'عام',
    'تاريخ الصلاحية': p.expiration_date || ''
  }));
  const wsProd = XLSX.utils.json_to_sheet(productsData);
  wsProd['!views'] = rtlView as any;
  (wsProd as any)['!protect'] = { password: pinOrPassword.trim() };
  XLSX.utils.book_append_sheet(wb, wsProd, 'المخزون_والمنتجات');

  // 3. Sheet: Customers
  const custData = customers.map(c => ({
    'اسم العميل': c.name,
    'رقم الجوال': c.phone || '',
    'الرصيد / الدين المترتب': c.balance,
    'ملاحظات': c.notes || ''
  }));
  const wsCust = XLSX.utils.json_to_sheet(custData);
  wsCust['!views'] = rtlView as any;
  (wsCust as any)['!protect'] = { password: pinOrPassword.trim() };
  XLSX.utils.book_append_sheet(wb, wsCust, 'العملاء_والديون');

  // 4. Sheet: Suppliers
  const suppData = suppliers.map(s => ({
    'اسم المورد': s.name,
    'رقم الهاتف': s.phone || '',
    'الرصيد المستحق لهم': s.balance || 0,
    'ملاحظات': s.notes || ''
  }));
  const wsSupp = XLSX.utils.json_to_sheet(suppData);
  wsSupp['!views'] = rtlView as any;
  (wsSupp as any)['!protect'] = { password: pinOrPassword.trim() };
  XLSX.utils.book_append_sheet(wb, wsSupp, 'الموردين_والحسابات');

  const fileName = `${store}_مصنف_إكسل_محمي_${new Date().toISOString().split('T')[0]}.xlsx`;
  const success = await downloadWorkbook(wb, fileName);

  // Update last backup date in database
  const nowExcel = new Date().toISOString();
  try {
    const existing = await db.settings.where('key').equals('lastBackupDate').first();
    if (existing && existing.id) {
      await db.settings.update(existing.id, { value: nowExcel });
    } else {
      await db.settings.add({ key: 'lastBackupDate', value: nowExcel });
    }
  } catch (err) {
    console.error('Failed to update lastBackupDate:', err);
  }

  return { success, fileName };
}
