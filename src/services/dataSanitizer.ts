import * as XLSX from 'xlsx';
import { db } from '../db';
import { downloadWorkbook, saveFileToDevice } from '../utils/fileSaver';

export interface AuditFixItem {
  table: string;
  field: string;
  description: string;
  count: number;
}

export interface AuditReport {
  isClean: boolean;
  totalRecordsProcessed: number;
  totalFixesApplied: number;
  tablesSummary: Record<string, number>;
  fixesDetails: AuditFixItem[];
  warnings: string[];
}

/**
 * Universal Offline Data Sanitizer & Repair Engine.
 * Inspects, cleanses, type-checks, deduplicates, and heals any JSON/Excel database tables.
 */
export function sanitizeAndRepairDatabase(rawData: any): { sanitizedData: any; report: AuditReport } {
  const report: AuditReport = {
    isClean: true,
    totalRecordsProcessed: 0,
    totalFixesApplied: 0,
    tablesSummary: {},
    fixesDetails: [],
    warnings: []
  };

  const addFix = (table: string, field: string, description: string, count: number = 1) => {
    report.isClean = false;
    report.totalFixesApplied += count;
    const existing = report.fixesDetails.find(f => f.table === table && f.field === field && f.description === description);
    if (existing) {
      existing.count += count;
    } else {
      report.fixesDetails.push({ table, field, description, count });
    }
  };

  // Safe Number Converter
  const safeNumber = (val: any, defaultVal: number, tableName: string, fieldName: string): number => {
    if (val === undefined || val === null || val === '') return defaultVal;
    if (typeof val === 'number' && !isNaN(val)) return val;
    
    // Attempt string conversion
    const str = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(str);
    if (!isNaN(parsed)) {
      addFix(tableName, fieldName, `تحويل القيم النصية إلى أرقام صحيحة (${fieldName})`);
      return parsed;
    }
    
    addFix(tableName, fieldName, `معالجة قيمة غير عددية وافتراض القيمة (${defaultVal})`);
    return defaultVal;
  };

  // Safe String Cleaner
  const safeString = (val: any, defaultVal: string, tableName: string, fieldName: string): string => {
    if (val === undefined || val === null) return defaultVal;
    const str = String(val).trim();
    if (str !== String(val)) {
      addFix(tableName, fieldName, `إزالة المسافات الزائدة من النصوص (${fieldName})`);
    }
    return str || defaultVal;
  };

  // Safe Date Converter
  const safeDate = (val: any, tableName: string): string => {
    if (!val) return new Date().toISOString();
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {
      // ignore
    }
    addFix(tableName, 'date', 'تصحيح صيغة التاريخ والوقت المفقودة إلى التاريخ الحالي');
    return new Date().toISOString();
  };

  const sanitizedData: any = {};

  // ----------------------------------------------------
  // 1. PRODUCTS TABLE
  // ----------------------------------------------------
  if (Array.isArray(rawData.products)) {
    const rawProducts = rawData.products;
    const cleanedProducts: any[] = [];
    const seenBarcodes = new Set<string>();

    rawProducts.forEach((p: any, idx: number) => {
      report.totalRecordsProcessed++;
      if (!p || typeof p !== 'object') return;

      const name = safeString(p.name || p.title || p['اسم المنتج'] || p['اسم الصنف'], `منتج غير مسمى #${idx + 1}`, 'المنتجات', 'الاسم');
      let barcode = String(p.barcode || p['الباركود'] || p['كود المنتج'] || '').trim();

      // Handle duplicate or missing barcodes
      if (!barcode || seenBarcodes.has(barcode)) {
        const newBarcode = `INT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        if (barcode && seenBarcodes.has(barcode)) {
          addFix('المنتجات', 'الباركود', `حل مشكلة الباركود المكرر (${barcode}) وتوليد باركود فريد جديد`);
        } else {
          addFix('المنتجات', 'الباركود', 'توليد باركود تلقائي فريد للمنتجات بدون باركود');
        }
        barcode = newBarcode;
      }
      seenBarcodes.add(barcode);

      const salePrice = safeNumber(p.salePrice || p.price || p['سعر البيع'] || p['السعر'], 0, 'المنتجات', 'سعر البيع');
      let costPrice = safeNumber(p.costPrice || p['سعر الشراء'] || p['سعر التكلفة'] || p['التكلفة'], 0, 'المنتجات', 'سعر التكلفة');
      if (costPrice > salePrice && salePrice > 0) {
        report.warnings.push(`تنبيه: سعر التكلفة أعلى من سعر البيع للمنتج "${name}"`);
      }

      const stock = safeNumber(p.stock || p.quantity || p['الكمية'] || p['المخزون'], 0, 'المنتجات', 'الكمية');
      const minStock = safeNumber(p.minStock || p['حد الأدنى'] || p['الحد الأدنى'], 5, 'المنتجات', 'الحد الأدنى');
      const category = safeString(p.category || p['التصنيف'] || p['القسم'], 'عام', 'المنتجات', 'التصنيف');

      cleanedProducts.push({
        id: p.id || `prod_${Date.now()}_${idx}`,
        name,
        barcode,
        salePrice,
        costPrice,
        stock,
        minStock,
        category,
        unit: safeString(p.unit || p['الوحدة'], 'حبة', 'المنتجات', 'الوحدة'),
        updatedAt: safeDate(p.updatedAt, 'المنتجات')
      });
    });

    sanitizedData.products = cleanedProducts;
    report.tablesSummary['المنتجات'] = cleanedProducts.length;
  }

  // ----------------------------------------------------
  // 2. CUSTOMERS TABLE
  // ----------------------------------------------------
  if (Array.isArray(rawData.customers)) {
    const rawCustomers = rawData.customers;
    const cleanedCustomers: any[] = [];
    const seenCustomers = new Set<string>();

    rawCustomers.forEach((c: any, idx: number) => {
      report.totalRecordsProcessed++;
      if (!c || typeof c !== 'object') return;

      const name = safeString(c.name || c['اسم العميل'] || c['العميل'], `عميل غير مسمى #${idx + 1}`, 'العملاء', 'الاسم');
      const phone = safeString(c.phone || c['الهاتف'] || c['رقم الجوال'] || '', '', 'العملاء', 'الهاتف');
      const key = `${name.toLowerCase()}_${phone}`;

      if (seenCustomers.has(key)) {
        addFix('العملاء', 'الاسم', `دمج أو منع تكرار العميل (${name})`);
        return;
      }
      seenCustomers.add(key);

      const balance = safeNumber(c.balance || c.debt || c['الرصيد'] || c['المتبقي'] || c['الدين'], 0, 'العملاء', 'الرصيد');

      cleanedCustomers.push({
        id: c.id || `cust_${Date.now()}_${idx}`,
        name,
        phone,
        balance,
        address: safeString(c.address || c['العنوان'], '', 'العملاء', 'العنوان'),
        notes: safeString(c.notes || c['ملاحظات'], '', 'العملاء', 'ملاحظات'),
        updatedAt: safeDate(c.updatedAt, 'العملاء')
      });
    });

    sanitizedData.customers = cleanedCustomers;
    report.tablesSummary['العملاء'] = cleanedCustomers.length;
  }

  // ----------------------------------------------------
  // 3. SUPPLIERS TABLE
  // ----------------------------------------------------
  if (Array.isArray(rawData.suppliers)) {
    const rawSuppliers = rawData.suppliers;
    const cleanedSuppliers: any[] = [];

    rawSuppliers.forEach((s: any, idx: number) => {
      report.totalRecordsProcessed++;
      if (!s || typeof s !== 'object') return;

      const name = safeString(s.name || s['اسم المورد'] || s['المورد'], `مورد غير مسمى #${idx + 1}`, 'الموردين', 'الاسم');
      const balance = safeNumber(s.balance || s.debt || s['الرصيد'] || cBalance(s), 0, 'الموردين', 'الرصيد');

      cleanedSuppliers.push({
        id: s.id || `supp_${Date.now()}_${idx}`,
        name,
        phone: safeString(s.phone || s['الهاتف'] || s['الجوال'], '', 'الموردين', 'الهاتف'),
        balance,
        company: safeString(s.company || s['الشركة'], '', 'الموردين', 'الشركة'),
        notes: safeString(s.notes || s['ملاحظات'], '', 'الموردين', 'ملاحظات'),
        updatedAt: safeDate(s.updatedAt, 'الموردين')
      });
    });

    sanitizedData.suppliers = cleanedSuppliers;
    report.tablesSummary['الموردين'] = cleanedSuppliers.length;
  }

  // Helper for supplier balance
  function cBalance(obj: any): number {
    return obj['رصيد المورد'] || obj['له علينا'] || 0;
  }

  // ----------------------------------------------------
  // 4. SALES & SALE ITEMS TABLE
  // ----------------------------------------------------
  if (Array.isArray(rawData.sales)) {
    const cleanedSales = rawData.sales.map((s: any, idx: number) => {
      report.totalRecordsProcessed++;
      return {
        id: s.id || `sale_${Date.now()}_${idx}`,
        total: safeNumber(s.total || s['الإجمالي'], 0, 'المبيعات', 'الإجمالي'),
        discount: safeNumber(s.discount || s['الخصم'], 0, 'المبيعات', 'الخصم'),
        paid: safeNumber(s.paid || s['المدفوع'], 0, 'المبيعات', 'المدفوع'),
        remaining: safeNumber(s.remaining || s['المتبقي'], 0, 'المبيعات', 'المتبقي'),
        customerName: safeString(s.customerName || s['العميل'], 'عميل نقدي', 'المبيعات', 'العميل'),
        paymentMethod: safeString(s.paymentMethod || s['طريقة الدفع'], 'cash', 'المبيعات', 'طريقة الدفع'),
        createdAt: safeDate(s.createdAt || s['التاريخ'], 'المبيعات')
      };
    });
    sanitizedData.sales = cleanedSales;
    report.tablesSummary['المبيعات'] = cleanedSales.length;
  }

  if (Array.isArray(rawData.saleItems)) {
    sanitizedData.saleItems = rawData.saleItems;
    report.tablesSummary['تفاصيل المبيعات'] = rawData.saleItems.length;
  }

  // ----------------------------------------------------
  // 5. EXPENSES TABLE
  // ----------------------------------------------------
  if (Array.isArray(rawData.expenses)) {
    const cleanedExpenses = rawData.expenses.map((e: any, idx: number) => {
      report.totalRecordsProcessed++;
      return {
        id: e.id || `exp_${Date.now()}_${idx}`,
        title: safeString(e.title || e['البند'] || e['اسم المصروف'], 'مصروف عام', 'المصروفات', 'البند'),
        amount: safeNumber(e.amount || e['المبلغ'], 0, 'المصروفات', 'المبلغ'),
        category: safeString(e.category || e['التصنيف'], 'عام', 'المصروفات', 'التصنيف'),
        notes: safeString(e.notes || e['الملاحظات'], '', 'المصروفات', 'الملاحظات'),
        createdAt: safeDate(e.createdAt || e['التاريخ'], 'المصروفات')
      };
    });
    sanitizedData.expenses = cleanedExpenses;
    report.tablesSummary['المصروفات'] = cleanedExpenses.length;
  }

  // Copy other tables directly if present
  ['debts', 'supplierPayments', 'inventoryLogs', 'settings', 'notes'].forEach(tableName => {
    if (Array.isArray(rawData[tableName])) {
      sanitizedData[tableName] = rawData[tableName];
      report.tablesSummary[tableName] = rawData[tableName].length;
    }
  });

  return { sanitizedData, report };
}

/**
 * Convert JSON database object to Excel Workbook (.xlsx)
 */
export function convertJsonDatabaseToExcel(jsonData: any): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const addSheet = (sheetName: string, rows: any[]) => {
    if (!rows || rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  if (Array.isArray(jsonData.products)) {
    addSheet('المنتجات_والمخزون', jsonData.products.map((p: any) => ({
      'المعرف': p.id,
      'اسم المنتج': p.name,
      'الباركود': p.barcode,
      'سعر البيع': p.salePrice,
      'سعر التكلفة': p.costPrice,
      'الكمية الحالية': p.stock,
      'حد الأدنى': p.minStock,
      'التصنيف': p.category,
      'الوحدة': p.unit
    })));
  }

  if (Array.isArray(jsonData.customers)) {
    addSheet('العملاء_والديون', jsonData.customers.map((c: any) => ({
      'المعرف': c.id,
      'اسم العميل': c.name,
      'الهاتف': c.phone,
      'الرصيد المتبقي': c.balance,
      'العنوان': c.address,
      'ملاحظات': c.notes
    })));
  }

  if (Array.isArray(jsonData.suppliers)) {
    addSheet('الموردين_والحسابات', jsonData.suppliers.map((s: any) => ({
      'المعرف': s.id,
      'اسم المورد': s.name,
      'الهاتف': s.phone,
      'الشركة': s.company,
      'رصيد المورد': s.balance,
      'ملاحظات': s.notes
    })));
  }

  if (Array.isArray(jsonData.sales)) {
    addSheet('سجلات_المبيعات', jsonData.sales.map((s: any) => ({
      'رقم الفاتورة': s.id,
      'العميل': s.customerName,
      'الإجمالي': s.total,
      'الخصم': s.discount,
      'المدفوع': s.paid,
      'المتبقي': s.remaining,
      'طريقة الدفع': s.paymentMethod,
      'التاريخ': s.createdAt
    })));
  }

  if (Array.isArray(jsonData.expenses)) {
    addSheet('المصروفات_التشغيلية', jsonData.expenses.map((e: any) => ({
      'المعرف': e.id,
      'البند': e.title,
      'التصنيف': e.category,
      'المبلغ': e.amount,
      'الملاحظات': e.notes,
      'التاريخ': e.createdAt
    })));
  }

  return wb;
}

/**
 * Convert Excel Workbook (.xlsx) to JSON database object
 */
export function convertExcelToDatabaseJson(wb: XLSX.WorkBook): any {
  const rawData: any = {};

  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const name = sheetName.toLowerCase();
    if (name.includes('منتج') || name.includes('صنف') || name.includes('product') || name.includes('stock')) {
      rawData.products = rows;
    } else if (name.includes('عميل') || name.includes('دين') || name.includes('customer') || name.includes('debt')) {
      rawData.customers = rows;
    } else if (name.includes('مورد') || name.includes('supplier')) {
      rawData.suppliers = rows;
    } else if (name.includes('بيع') || name.includes('فاتورة') || name.includes('sale') || name.includes('invoice')) {
      rawData.sales = rows;
    } else if (name.includes('مصروف') || name.includes('expense')) {
      rawData.expenses = rows;
    } else if (!rawData.products) {
      // Default to products if unidentified first sheet
      rawData.products = rows;
    }
  });

  return rawData;
}

/**
 * Full Offline Smart Import with Sanitization and IndexedDB Sync
 */
export async function importAndRepairDatabaseOffline(
  rawData: any,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ report: AuditReport; success: boolean }> {
  // 1. Sanitize & Auto-Repair Data
  const { sanitizedData, report } = sanitizeAndRepairDatabase(rawData);

  try {
    // 2. Perform DB Transaction
    await db.transaction('rw', [
      db.products, 
      db.customers, 
      db.suppliers, 
      db.sales, 
      db.saleItems, 
      db.debts, 
      db.expenses, 
      db.inventoryLogs, 
      db.settings, 
      db.notes
    ], async () => {
      if (mode === 'replace') {
        if (sanitizedData.products) await db.products.clear();
        if (sanitizedData.customers) await db.customers.clear();
        if (sanitizedData.suppliers) await db.suppliers.clear();
        if (sanitizedData.sales) await db.sales.clear();
        if (sanitizedData.saleItems) await db.saleItems.clear();
        if (sanitizedData.debts) await db.debts.clear();
        if (sanitizedData.expenses) await db.expenses.clear();
        if (sanitizedData.inventoryLogs) await db.inventoryLogs.clear();
        if (sanitizedData.settings) await db.settings.clear();
        if (sanitizedData.notes) await db.notes.clear();
      }

      if (sanitizedData.products?.length) await db.products.bulkPut(sanitizedData.products);
      if (sanitizedData.customers?.length) await db.customers.bulkPut(sanitizedData.customers);
      if (sanitizedData.suppliers?.length) await db.suppliers.bulkPut(sanitizedData.suppliers);
      if (sanitizedData.sales?.length) await db.sales.bulkPut(sanitizedData.sales);
      if (sanitizedData.saleItems?.length) await db.saleItems.bulkPut(sanitizedData.saleItems);
      if (sanitizedData.debts?.length) await db.debts.bulkPut(sanitizedData.debts);
      if (sanitizedData.expenses?.length) await db.expenses.bulkPut(sanitizedData.expenses);
      if (sanitizedData.inventoryLogs?.length) await db.inventoryLogs.bulkPut(sanitizedData.inventoryLogs);
      if (sanitizedData.settings?.length) await db.settings.bulkPut(sanitizedData.settings);
      if (sanitizedData.notes?.length) await db.notes.bulkPut(sanitizedData.notes);
    });

    return { report, success: true };
  } catch (err) {
    console.error('Offline Database Import Failed:', err);
    return { report, success: false };
  }
}
