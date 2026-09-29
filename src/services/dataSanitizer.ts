import * as XLSX from 'xlsx';
import { db } from '../db';
import { downloadWorkbook, saveFileToDevice } from '../utils/fileSaver';
import { isSystemLicensingKey } from '../utils/licensing';

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
    if (typeof val === 'number') {
      // Excel date serial number (days since 1899-12-30)
      if (val > 25000 && val < 75000) {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) return date.toISOString();
      }
    }
    try {
      const str = String(val).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
      const d = new Date(str);
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

      const name = safeString(p.name || p.title || p['اسم المنتج'] || p['اسم الصنف'] || p['الاسم'] || p['الصنف'] || p['المنتج'], `منتج غير مسمى #${idx + 1}`, 'المنتجات', 'الاسم');
      let barcode = String(p.barcode || p['الباركود'] || p['باركود'] || p['كود'] || p['كود المنتج'] || '').trim();

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

      const sale_price = safeNumber(
        p.sale_price !== undefined ? p.sale_price : (p.salePrice !== undefined ? p.salePrice : (p['سعر البيع'] !== undefined ? p['سعر البيع'] : (p.price !== undefined ? p.price : (p['السعر'] !== undefined ? p['السعر'] : (p['سعر'] !== undefined ? p['سعر'] : p['قطاعي']))))),
        0, 'المنتجات', 'سعر البيع'
      );
      const cost_price = safeNumber(
        p.cost_price !== undefined ? p.cost_price : (p.costPrice !== undefined ? p.costPrice : (p['سعر التكلفة'] !== undefined ? p['سعر التكلفة'] : (p['سعر الشراء'] !== undefined ? p['سعر الشراء'] : (p['التكلفة'] !== undefined ? p['التكلفة'] : (p['شراء'] !== undefined ? p['شراء'] : p['تكلفة']))))),
        0, 'المنتجات', 'سعر التكلفة'
      );
      if (cost_price > sale_price && sale_price > 0) {
        report.warnings.push(`تنبيه: سعر التكلفة أعلى من سعر البيع للمنتج "${name}"`);
      }

      const stock_quantity = safeNumber(
        p.stock_quantity !== undefined ? p.stock_quantity : (p.stockQuantity !== undefined ? p.stockQuantity : (p['الكمية الحالية'] !== undefined ? p['الكمية الحالية'] : (p.stock !== undefined ? p.stock : (p.quantity !== undefined ? p.quantity : (p['الكمية'] !== undefined ? p['الكمية'] : (p['المخزون'] !== undefined ? p['المخزون'] : (p['الرصيد'] !== undefined ? p['الرصيد'] : p['العدد']))))))),
        0, 'المنتجات', 'الكمية'
      );
      const min_stock = safeNumber(
        p.min_stock_alert !== undefined ? p.min_stock_alert : (p.min_stock !== undefined ? p.min_stock : (p.minStock !== undefined ? p.minStock : (p['حد تنبيه النواقص'] !== undefined ? p['حد تنبيه النواقص'] : (p['الحد الأدنى للمخزون'] !== undefined ? p['الحد الأدنى للمخزون'] : (p['حد الأدنى'] !== undefined ? p['حد الأدنى'] : (p['الحد الأدنى'] !== undefined ? p['الحد الأدنى'] : 5)))))),
        5, 'المنتجات', 'الحد الأدنى'
      );
      const category = safeString(p.category || p['القسم / التصنيف'] || p['التصنيف'] || p['القسم'] || p['الفئة'], 'عام', 'المنتجات', 'التصنيف');

      let finalId = undefined;
      const rawId = p.id !== undefined ? p.id : (p['رقم المنتج'] !== undefined ? p['رقم المنتج'] : (p['المعرف'] !== undefined ? p['المعرف'] : p['رقم الصنف']));
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const productObj: any = {
        name,
        barcode,
        sale_price,
        cost_price,
        stock_quantity,
        min_stock,
        min_stock_alert: min_stock,
        category,
        unit: safeString(p.unit || p['الوحدة'] || p['وحدة'], 'حبة', 'المنتجات', 'الوحدة'),
        production_date: p.production_date || p.productionDate || p['تاريخ الإنتاج'] || '',
        expiration_date: p.expiration_date || p.expirationDate || p['تاريخ الصلاحية'] || p['الصلاحية'] || p['تاريخ الانتهاء'] || '',
        supplier_id: p.supplier_id !== undefined ? (p.supplier_id === null ? null : Number(p.supplier_id)) : (p.supplierId !== undefined ? Number(p.supplierId) : (p['رقم المورد'] !== undefined ? Number(p['رقم المورد']) : null))
      };

      if (finalId !== undefined) {
        productObj.id = finalId;
      }

      cleanedProducts.push(productObj);
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

      const name = safeString(c.name || c['اسم العميل'] || c['العميل'] || c['الاسم'] || c['الزبون'], `عميل غير مسمى #${idx + 1}`, 'العملاء', 'الاسم');
      const phone = safeString(c.phone || c['الهاتف'] || c['رقم الجوال'] || c['الجوال'] || c['رقم الهاتف'] || '', '', 'العملاء', 'الهاتف');
      const key = `${name.toLowerCase()}_${phone}`;

      if (seenCustomers.has(key)) {
        addFix('العملاء', 'الاسم', `دمج أو منع تكرار العميل (${name})`);
        return;
      }
      seenCustomers.add(key);

      const balance = safeNumber(
        c.balance !== undefined ? c.balance : (c.debt !== undefined ? c.debt : (c['الرصيد الحالي (الدين المترتب)'] !== undefined ? c['الرصيد الحالي (الدين المترتب)'] : (c['الرصيد المتبقي'] !== undefined ? c['الرصيد المتبقي'] : (c['الرصيد'] !== undefined ? c['الرصيد'] : (c['المتبقي'] !== undefined ? c['المتبقي'] : (c['الدين'] !== undefined ? c['الدين'] : 0)))))),
        0, 'العملاء', 'الرصيد'
      );

      let finalId = undefined;
      const rawId = c.id !== undefined ? c.id : (c['رقم العميل'] !== undefined ? c['رقم العميل'] : c['المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const customerObj: any = {
        name,
        phone,
        balance,
        address: safeString(c.address || c['العنوان'], '', 'العملاء', 'العنوان'),
        notes: safeString(c.notes || c['ملاحظات'], '', 'العملاء', 'ملاحظات')
      };

      if (finalId !== undefined) {
        customerObj.id = finalId;
      }

      cleanedCustomers.push(customerObj);
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

      const name = safeString(s.name || s['اسم المورد'] || s['المورد'] || s['الاسم'], `مورد غير مسمى #${idx + 1}`, 'الموردين', 'الاسم');
      const balance = safeNumber(
        s.balance !== undefined ? s.balance : (s.debt !== undefined ? s.debt : (s['الرصيد المستحق لهم'] !== undefined ? s['الرصيد المستحق لهم'] : (s['رصيد المورد'] !== undefined ? s['رصيد المورد'] : (s['الرصيد'] !== undefined ? s['الرصيد'] : (s['له علينا'] !== undefined ? s['له علينا'] : 0))))),
        0, 'الموردين', 'الرصيد'
      );

      let finalId = undefined;
      const rawId = s.id !== undefined ? s.id : (s['رقم المورد'] !== undefined ? s['رقم المورد'] : s['المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const supplierObj: any = {
        name,
        phone: safeString(s.phone || s['الهاتف'] || s['الجوال'] || s['رقم الهاتف'], '', 'الموردين', 'الهاتف'),
        balance,
        company: safeString(s.company || s['الشركة'], '', 'الموردين', 'الشركة'),
        notes: safeString(s.notes || s['ملاحظات'], '', 'الموردين', 'ملاحظات')
      };

      if (finalId !== undefined) {
        supplierObj.id = finalId;
      }

      cleanedSuppliers.push(supplierObj);
    });

    sanitizedData.suppliers = cleanedSuppliers;
    report.tablesSummary['الموردين'] = cleanedSuppliers.length;
  }

  // Helper for supplier balance
  function cBalance(obj: any): number {
    return obj['رصيد المورد'] || obj['الرصيد المستحق لهم'] || obj['له علينا'] || 0;
  }

  // ----------------------------------------------------
  // 4. SALES & SALE ITEMS TABLE
  // ----------------------------------------------------
  if (Array.isArray(rawData.sales)) {
    const cleanedSales: any[] = [];
    rawData.sales.forEach((s: any, idx: number) => {
      report.totalRecordsProcessed++;
      if (!s || typeof s !== 'object') return;

      let finalId = undefined;
      const rawId = s.id !== undefined ? s.id : (s['رقم الفاتورة'] !== undefined ? s['رقم الفاتورة'] : s['المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const total_amount = safeNumber(s.total_amount !== undefined ? s.total_amount : (s.total !== undefined ? s.total : s['الإجمالي']), 0, 'المبيعات', 'الإجمالي');
      const discount = safeNumber(s.discount !== undefined ? s.discount : (s['الخصم'] !== undefined ? s['الخصم'] : 0), 0, 'المبيعات', 'الخصم');
      const paid_amount = safeNumber(s.paid_amount !== undefined ? s.paid_amount : (s.paid !== undefined ? s.paid : s['المدفوع']), 0, 'المبيعات', 'المدفوع');
      const remaining_amount = safeNumber(s.remaining_amount !== undefined ? s.remaining_amount : (s.remaining !== undefined ? s.remaining : s['المتبقي']), 0, 'المبيعات', 'المتبقي');
      const created_at = safeDate(s.created_at || s.createdAt || s['التاريخ'] || s['تاريخ العملية'], 'المبيعات');
      
      let payment_type: 'cash' | 'debt' = 'cash';
      const rawPt = String(s.payment_type || s.paymentMethod || s['طريقة الدفع'] || '').trim().toLowerCase();
      if (rawPt.includes('دين') || rawPt.includes('آجل') || rawPt.includes('اجل') || rawPt.includes('debt')) {
        payment_type = 'debt';
      }

      const rawCustId = s.customer_id !== undefined ? s.customer_id : (s.customerId !== undefined ? s.customerId : (s['رقم العميل'] !== undefined && s['رقم العميل'] !== '' ? s['رقم العميل'] : null));

      const saleObj: any = {
        customer_id: rawCustId !== null && rawCustId !== undefined ? Number(rawCustId) : null,
        customer_name: s.customer_name || s.customerName || s['اسم العميل'] || s['العميل'] || 'عميل نقدي',
        total_amount,
        discount,
        paid_amount,
        remaining_amount,
        payment_type,
        payment_status: s.payment_status || s['حالة الدفع'] || (remaining_amount <= 0 ? 'paid' : paid_amount > 0 ? 'partial' : 'unpaid'),
        created_at,
        notes: safeString(s.notes || s['الملاحظات'] || s['ملاحظات'] || '', '', 'المبيعات', 'الملاحظات'),
        previous_balance: s.previous_balance !== undefined ? Number(s.previous_balance) : (s['الرصيد السابق'] !== undefined ? Number(s['الرصيد السابق']) : (s['الرصيد السابق للعميل'] !== undefined ? Number(s['الرصيد السابق للعميل']) : 0)),
        new_balance: s.new_balance !== undefined ? Number(s.new_balance) : (s['الرصيد الجديد'] !== undefined ? Number(s['الرصيد الجديد']) : (s['الرصيد الجديد للعميل'] !== undefined ? Number(s['الرصيد الجديد للعميل']) : 0))
      };

      if (finalId !== undefined) {
        saleObj.id = finalId;
      }

      cleanedSales.push(saleObj);
    });
    sanitizedData.sales = cleanedSales;
    report.tablesSummary['المبيعات'] = cleanedSales.length;
  }

  if (Array.isArray(rawData.saleItems)) {
    const cleanedItems: any[] = [];
    rawData.saleItems.forEach((item: any) => {
      if (!item || typeof item !== 'object') return;

      let finalId = undefined;
      const rawId = item.id !== undefined ? item.id : (item['المعرف'] !== undefined ? item['المعرف'] : item['رقم المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const sale_id = item.sale_id !== undefined ? Number(item.sale_id) : (item.saleId !== undefined ? Number(item.saleId) : (item['رقم الفاتورة'] !== undefined ? Number(item['رقم الفاتورة']) : 0));
      const product_id = item.product_id !== undefined ? Number(item.product_id) : (item.productId !== undefined ? Number(item.productId) : (item['رقم المنتج'] !== undefined ? Number(item['رقم المنتج']) : 0));
      const quantity = safeNumber(item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : item['الكمية']), 1, 'تفاصيل المبيعات', 'الكمية');
      const price_at_sale = safeNumber(item.price_at_sale !== undefined ? item.price_at_sale : (item.priceAtSale !== undefined ? item.priceAtSale : (item.price !== undefined ? item.price : (item['سعر البيع'] !== undefined ? item['سعر البيع'] : item['السعر']))), 0, 'تفاصيل المبيعات', 'السعر عند البيع');

      const saleItemObj: any = {
        sale_id,
        product_id,
        quantity,
        price_at_sale
      };

      if (finalId !== undefined) {
        saleItemObj.id = finalId;
      }

      cleanedItems.push(saleItemObj);
    });
    sanitizedData.saleItems = cleanedItems;
    report.tablesSummary['تفاصيل المبيعات'] = cleanedItems.length;
  }

  // ----------------------------------------------------
  // 5. EXPENSES TABLE
  // ----------------------------------------------------
  if (Array.isArray(rawData.expenses)) {
    const cleanedExpenses = rawData.expenses.map((e: any, idx: number) => {
      report.totalRecordsProcessed++;

      let finalId = undefined;
      const rawId = e.id !== undefined ? e.id : (e['رقم المصروف'] !== undefined ? e['رقم المصروف'] : e['المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      let payment_method = 'cash';
      const rawPm = String(e.payment_method || e.paymentMethod || e['طريقة الدفع'] || '').trim().toLowerCase();
      if (rawPm.includes('بنك') || rawPm.includes('bank')) {
        payment_method = 'bank';
      }

      const expenseObj: any = {
        title: safeString(e.title || e['البند'] || e['بيان المصروف'] || e['اسم المصروف'], 'مصروف عام', 'المصروفات', 'البند'),
        amount: safeNumber(e.amount !== undefined ? e.amount : e['المبلغ'], 0, 'المصروفات', 'المبلغ'),
        category: safeString(e.category || e['التصنيف'], 'عام', 'المصروفات', 'التصنيف'),
        notes: safeString(e.notes || e['الملاحظات'] || e['ملاحظات'], '', 'المصروفات', 'الملاحظات'),
        created_at: safeDate(e.created_at || e.createdAt || e['التاريخ'] || e.date, 'المصروفات'),
        date: e.date || e['تاريخ الصرف'] || (e.created_at ? e.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        payment_method
      };

      if (finalId !== undefined) {
        expenseObj.id = finalId;
      }

      return expenseObj;
    });
    sanitizedData.expenses = cleanedExpenses;
    report.tablesSummary['المصروفات'] = cleanedExpenses.length;
  }

  // ----------------------------------------------------
  // 6. OTHER SYSTEM TABLES (DEBTS, PAYMENTS, LOGS, ETC)
  // ----------------------------------------------------
  if (Array.isArray(rawData.debts)) {
    const cleanedDebts: any[] = [];
    rawData.debts.forEach((d: any) => {
      if (!d || typeof d !== 'object') return;

      let finalId = undefined;
      const rawId = d.id !== undefined ? d.id : (d['المعرف'] !== undefined ? d['المعرف'] : d['رقم المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const debtObj: any = {
        customer_id: d.customer_id !== undefined ? Number(d.customer_id) : (d.customerId !== undefined ? Number(d.customerId) : (d['رقم العميل'] !== undefined ? Number(d['رقم العميل']) : 0)),
        sale_id: d.sale_id !== undefined ? Number(d.sale_id) : (d.saleId ? Number(d.saleId) : (d['رقم الفاتورة'] !== undefined ? Number(d['رقم الفاتورة']) : undefined)),
        amount: safeNumber(d.amount !== undefined ? d.amount : d['المبلغ'], 0, 'الديون', 'المبلغ'),
        type: d.type || d['النوع'] || 'purchase',
        created_at: safeDate(d.created_at || d.createdAt || d['التاريخ'], 'الديون'),
        notes: safeString(d.notes || d['ملاحظات'] || '', '', 'الديون', 'ملاحظات'),
        previous_balance: safeNumber(d.previous_balance !== undefined ? d.previous_balance : (d.previousBalance !== undefined ? d.previousBalance : d['الرصيد السابق']), 0, 'الديون', 'الرصيد السابق'),
        new_balance: safeNumber(d.new_balance !== undefined ? d.new_balance : (d.newBalance !== undefined ? d.newBalance : d['الرصيد الجديد']), 0, 'الديون', 'الرصيد الجديد')
      };

      if (finalId !== undefined) {
        debtObj.id = finalId;
      }

      cleanedDebts.push(debtObj);
    });
    sanitizedData.debts = cleanedDebts;
    report.tablesSummary['ديون العملاء'] = cleanedDebts.length;
  }

  if (Array.isArray(rawData.supplierPayments)) {
    const cleanedPayments: any[] = [];
    rawData.supplierPayments.forEach((p: any) => {
      if (!p || typeof p !== 'object') return;

      let finalId = undefined;
      const rawId = p.id !== undefined ? p.id : (p['المعرف'] !== undefined ? p['المعرف'] : p['رقم المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const paymentObj: any = {
        supplier_id: p.supplier_id !== undefined ? Number(p.supplier_id) : (p.supplierId !== undefined ? Number(p.supplierId) : (p['رقم المورد'] !== undefined ? Number(p['رقم المورد']) : 0)),
        amount: safeNumber(p.amount !== undefined ? p.amount : (p['المبلغ المدفوع'] !== undefined ? p['المبلغ المدفوع'] : p['المبلغ']), 0, 'دفعات الموردين', 'المبلغ'),
        payment_date: safeDate(p.payment_date || p.paymentDate || p['تاريخ الدفع'] || p['التاريخ'], 'دفعات الموردين'),
        notes: safeString(p.notes || p['ملاحظات'] || '', '', 'دفعات الموردين', 'ملاحظات')
      };

      if (finalId !== undefined) {
        paymentObj.id = finalId;
      }

      cleanedPayments.push(paymentObj);
    });
    sanitizedData.supplierPayments = cleanedPayments;
    report.tablesSummary['دفعات الموردين'] = cleanedPayments.length;
  }

  if (Array.isArray(rawData.inventoryLogs)) {
    const cleanedLogs: any[] = [];
    rawData.inventoryLogs.forEach((log: any) => {
      if (!log || typeof log !== 'object') return;

      let finalId = undefined;
      const rawId = log.id !== undefined ? log.id : (log['المعرف'] !== undefined ? log['المعرف'] : log['رقم المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const logObj: any = {
        product_id: log.product_id !== undefined ? Number(log.product_id) : (log.productId !== undefined ? Number(log.productId) : (log['رقم المنتج'] !== undefined ? Number(log['رقم المنتج']) : 0)),
        product_name: safeString(log.product_name || log.productName || log['اسم المنتج'] || '', '', 'سجلات حركة المخزون', 'اسم المنتج'),
        old_quantity: safeNumber(log.old_quantity !== undefined ? log.old_quantity : (log.oldQuantity !== undefined ? log.oldQuantity : log['الكمية السابقة']), 0, 'سجلات حركة المخزون', 'الكمية السابقة'),
        new_quantity: safeNumber(log.new_quantity !== undefined ? log.new_quantity : (log.newQuantity !== undefined ? log.newQuantity : log['الكمية الجديدة']), 0, 'سجلات حركة المخزون', 'الكمية الجديدة'),
        change_amount: safeNumber(log.change_amount !== undefined ? log.change_amount : (log.changeAmount !== undefined ? log.changeAmount : log['مقدار التغيير']), 0, 'سجلات حركة المخزون', 'مقدار التغيير'),
        reason: safeString(log.reason || log['السبب'] || '', '', 'سجلات حركة المخزون', 'السبب'),
        type: safeString(log.type || log['النوع'] || '', '', 'سجلات حركة المخزون', 'النوع'),
        notes: safeString(log.notes || log['ملاحظات'] || '', '', 'سجلات حركة المخزون', 'ملاحظات'),
        created_at: safeDate(log.created_at || log.createdAt || log['التاريخ'], 'سجلات حركة المخزون')
      };

      if (finalId !== undefined) {
        logObj.id = finalId;
      }

      cleanedLogs.push(logObj);
    });
    sanitizedData.inventoryLogs = cleanedLogs;
    report.tablesSummary['سجلات حركة المخزون'] = cleanedLogs.length;
  }

  if (Array.isArray(rawData.salesSettlements)) {
    const cleanedSettlements: any[] = [];
    rawData.salesSettlements.forEach((s: any) => {
      if (!s || typeof s !== 'object') return;

      let finalId = undefined;
      const rawId = s.id !== undefined ? s.id : (s['المعرف'] !== undefined ? s['المعرف'] : s['رقم المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const settlementObj: any = {
        total_sales: safeNumber(s.total_sales !== undefined ? s.total_sales : (s.totalSales !== undefined ? s.totalSales : s['إجمالي المبيعات']), 0, 'تسويات المبيعات', 'إجمالي المبيعات'),
        delivered_amount: safeNumber(s.delivered_amount !== undefined ? s.delivered_amount : (s.deliveredAmount !== undefined ? s.deliveredAmount : s['المبلغ المسلم']), 0, 'تسويات المبيعات', 'المبلغ المسلم'),
        difference: safeNumber(s.difference !== undefined ? s.difference : s['الفارق'], 0, 'تسويات المبيعات', 'الفارق'),
        created_at: safeDate(s.created_at || s.createdAt || s['التاريخ'], 'تسويات المبيعات'),
        notes: safeString(s.notes || s['ملاحظات'] || '', '', 'تسويات المبيعات', 'ملاحظات'),
        cash_withdrawals: safeNumber(s.cash_withdrawals !== undefined ? s.cash_withdrawals : (s.cashWithdrawals !== undefined ? s.cashWithdrawals : s['المسحوبات']), 0, 'تسويات المبيعات', 'المسحوبات')
      };

      if (finalId !== undefined) {
        settlementObj.id = finalId;
      }

      cleanedSettlements.push(settlementObj);
    });
    sanitizedData.salesSettlements = cleanedSettlements;
    report.tablesSummary['تسويات المبيعات'] = cleanedSettlements.length;
  }

  if (Array.isArray(rawData.cashWithdrawals)) {
    const cleanedWithdrawals: any[] = [];
    rawData.cashWithdrawals.forEach((w: any) => {
      if (!w || typeof w !== 'object') return;

      let finalId = undefined;
      const rawId = w.id !== undefined ? w.id : (w['المعرف'] !== undefined ? w['المعرف'] : w['رقم المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const isRepaidRaw = w.is_repaid !== undefined ? w.is_repaid : (w.isRepaid !== undefined ? w.isRepaid : w['تم السداد']);
      const is_repaid = isRepaidRaw === true || isRepaidRaw === 'نعم' || isRepaidRaw === 1 || isRepaidRaw === 'true';

      const withdrawalObj: any = {
        amount: safeNumber(w.amount !== undefined ? w.amount : w['المبلغ'], 0, 'المسحوبات النقدية', 'المبلغ'),
        by_whom: safeString(w.by_whom || w.byWhom || w['المسحوب لصالحه'] || '', '', 'المسحوبات النقدية', 'المسحوب لصالحه'),
        reason: safeString(w.reason || w['السبب'] || '', '', 'المسحوبات النقدية', 'السبب'),
        created_at: safeDate(w.created_at || w.createdAt || w['التاريخ'], 'المسحوبات النقدية'),
        is_repaid,
        repay_date: w.repay_date || w.repayDate || w['تاريخ السداد'] || ''
      };

      if (finalId !== undefined) {
        withdrawalObj.id = finalId;
      }

      cleanedWithdrawals.push(withdrawalObj);
    });
    sanitizedData.cashWithdrawals = cleanedWithdrawals;
    report.tablesSummary['المسحوبات النقدية'] = cleanedWithdrawals.length;
  }

  if (Array.isArray(rawData.settings)) {
    // Filter out system licensing keys so external files can never alter hardware activation
    sanitizedData.settings = rawData.settings
      .map((s: any) => ({
        key: s.key || s['المفتاح'] || '',
        value: s.value !== undefined ? s.value : s['القيمة']
      }))
      .filter((s: any) => s.key && !isSystemLicensingKey(s.key));
    report.tablesSummary['إعدادات النظام'] = sanitizedData.settings.length;
  }

  if (Array.isArray(rawData.notes)) {
    sanitizedData.notes = rawData.notes.map((n: any) => {
      let finalId = undefined;
      const rawId = n.id !== undefined ? n.id : (n['المعرف'] !== undefined ? n['المعرف'] : n['رقم المعرف']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsedId = parseInt(rawId, 10);
        if (!isNaN(parsedId)) {
          finalId = parsedId;
        } else {
          finalId = rawId;
        }
      }

      const isCompletedRaw = n.is_completed !== undefined ? n.is_completed : (n.completed !== undefined ? n.completed : n['مكتمل']);
      const is_completed = isCompletedRaw === true || isCompletedRaw === 'نعم' || isCompletedRaw === 1 || isCompletedRaw === 'true';

      const priorityRaw = String(n.priority || n['الأولوية'] || 'normal').toLowerCase();
      const priority = (priorityRaw === 'high' || priorityRaw === 'مهمة' || priorityRaw === 'عالية') ? 'high' :
                       (priorityRaw === 'warning' || priorityRaw === 'تحذير') ? 'warning' :
                       (priorityRaw === 'info' || priorityRaw === 'تنبيه') ? 'info' : 'normal';

      const noteObj: any = {
        title: safeString(n.title || n['العنوان'] || '', 'ملاحظة', 'ملاحظات ومهام', 'العنوان'),
        content: safeString(n.content || n['المحتوى'] || '', '', 'ملاحظات ومهام', 'المحتوى'),
        is_completed,
        priority,
        reminder_date: n.reminder_date || n.reminderDate || n['تاريخ التذكير'] || null,
        created_at: safeDate(n.created_at || n.createdAt || n['التاريخ'], 'ملاحظات ومهام')
      };

      if (finalId !== undefined) {
        noteObj.id = finalId;
      }
      return noteObj;
    });
    report.tablesSummary['ملاحظات ومهام'] = sanitizedData.notes.length;
  }

  // ----------------------------------------------------
  // 7. AI & KNOWLEDGE BASE TABLES
  // ----------------------------------------------------
  if (Array.isArray(rawData.aiConversations)) {
    sanitizedData.aiConversations = rawData.aiConversations.map((c: any, idx: number) => {
      if (!c || typeof c !== 'object') return null;
      const rawId = c.id || c['المعرف'] || c['رقم المحادثة'] || `conv_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
      return {
        id: String(rawId),
        title: safeString(c.title || c['العنوان'], 'محادثة جديدة', 'محادثات المساعد', 'العنوان'),
        createdAt: safeDate(c.createdAt || c.created_at || c['تاريخ الإنشاء'], 'محادثات المساعد'),
        updatedAt: safeDate(c.updatedAt || c.updated_at || c['تاريخ التحديث'], 'محادثات المساعد')
      };
    }).filter(Boolean);
    report.tablesSummary['محادثات المساعد الذكي'] = sanitizedData.aiConversations.length;
  }

  if (Array.isArray(rawData.aiMessages)) {
    sanitizedData.aiMessages = rawData.aiMessages.map((m: any, idx: number) => {
      if (!m || typeof m !== 'object') return null;
      const rawId = m.id || m['المعرف'] || `msg_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
      const rawRole = String(m.role || m['الدور'] || 'assistant').toLowerCase();
      const role = (rawRole === 'user' || rawRole === 'مستخدم') ? 'user' : 'assistant';
      return {
        id: String(rawId),
        conversationId: String(m.conversationId || m.conversation_id || m['رقم المحادثة'] || 'default'),
        role,
        content: safeString(m.content || m['المحتوى'], '', 'رسائل المساعد', 'المحتوى'),
        timestamp: typeof m.timestamp === 'number' ? m.timestamp : (typeof m['الوقت'] === 'number' ? m['الوقت'] : Date.now()),
        intent: m.intent || m['النية'] || undefined,
        reasoningSummary: m.reasoningSummary || m['ملخص التفكير'] || undefined
      };
    }).filter(Boolean);
    report.tablesSummary['رسائل المساعد الذكي'] = sanitizedData.aiMessages.length;
  }

  if (Array.isArray(rawData.knowledgeDocuments)) {
    sanitizedData.knowledgeDocuments = rawData.knowledgeDocuments.map((doc: any, idx: number) => {
      if (!doc || typeof doc !== 'object') return null;
      let finalId = undefined;
      const rawId = doc.id !== undefined ? doc.id : (doc['المعرف'] !== undefined ? doc['المعرف'] : doc['رقم المستند']);
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsed = parseInt(rawId, 10);
        if (!isNaN(parsed) && parsed > 0) finalId = parsed;
      }
      const rawTags = doc.tags || doc['الوسوم'] || [];
      const tags = Array.isArray(rawTags) ? rawTags : (typeof rawTags === 'string' ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
      const docObj: any = {
        title: safeString(doc.title || doc['العنوان'], `مستند معرفي #${idx + 1}`, 'قاعدة المعرفة', 'العنوان'),
        category: safeString(doc.category || doc['التصنيف'], 'عام', 'قاعدة المعرفة', 'التصنيف'),
        content: safeString(doc.content || doc['المحتوى'], '', 'قاعدة المعرفة', 'المحتوى'),
        tags,
        fileName: doc.fileName || doc['اسم الملف'] || undefined,
        fileType: doc.fileType || doc['نوع الملف'] || undefined,
        createdAt: safeDate(doc.createdAt || doc.created_at || doc['تاريخ الإنشاء'], 'قاعدة المعرفة')
      };
      if (finalId !== undefined) docObj.id = finalId;
      return docObj;
    }).filter(Boolean);
    report.tablesSummary['مستندات المعرفة للذكاء الاصطناعي'] = sanitizedData.knowledgeDocuments.length;
  }

  if (Array.isArray(rawData.documentChunks)) {
    sanitizedData.documentChunks = rawData.documentChunks.map((chk: any) => {
      if (!chk || typeof chk !== 'object') return null;
      let finalId = undefined;
      const rawId = chk.id !== undefined ? chk.id : chk['المعرف'];
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsed = parseInt(rawId, 10);
        if (!isNaN(parsed) && parsed > 0) finalId = parsed;
      }
      const rawTags = chk.tags || chk['الوسوم'] || [];
      const tags = Array.isArray(rawTags) ? rawTags : (typeof rawTags === 'string' ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
      const chunkObj: any = {
        documentId: safeNumber(chk.documentId || chk.document_id || chk['رقم المستند'], 0, 'أجزاء المستندات', 'رقم المستند'),
        chunkIndex: safeNumber(chk.chunkIndex || chk.chunk_index || chk['رقم المقطع'], 0, 'أجزاء المستندات', 'رقم المقطع'),
        sectionTitle: chk.sectionTitle || chk['عنوان القسم'] || undefined,
        content: safeString(chk.content || chk['المحتوى'], '', 'أجزاء المستندات', 'المحتوى'),
        wordCount: safeNumber(chk.wordCount || chk.word_count || chk['عدد الكلمات'], 0, 'أجزاء المستندات', 'عدد الكلمات'),
        tags,
        createdAt: safeDate(chk.createdAt || chk.created_at || chk['تاريخ الإنشاء'], 'أجزاء المستندات')
      };
      if (finalId !== undefined) chunkObj.id = finalId;
      return chunkObj;
    }).filter(Boolean);
    report.tablesSummary['أجزاء المستندات'] = sanitizedData.documentChunks.length;
  }

  if (Array.isArray(rawData.aiFeedback)) {
    sanitizedData.aiFeedback = rawData.aiFeedback.map((f: any) => {
      if (!f || typeof f !== 'object') return null;
      let finalId = undefined;
      const rawId = f.id !== undefined ? f.id : f['المعرف'];
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsed = parseInt(rawId, 10);
        if (!isNaN(parsed) && parsed > 0) finalId = parsed;
      }
      const fbObj: any = {
        messageId: String(f.messageId || f.message_id || f['رقم الرسالة'] || ''),
        userQuery: safeString(f.userQuery || f['سؤال المستخدم'], '', 'تقييمات المساعد', 'سؤال المستخدم'),
        responseAnswer: safeString(f.responseAnswer || f['إجابة المساعد'], '', 'تقييمات المساعد', 'إجابة المساعد'),
        rating: safeNumber(f.rating || f['التقييم'], 5, 'تقييمات المساعد', 'التقييم'),
        userComment: f.userComment || f['ملاحظة المستخدم'] || undefined,
        timestamp: typeof f.timestamp === 'number' ? f.timestamp : (typeof f['الوقت'] === 'number' ? f['الوقت'] : Date.now())
      };
      if (finalId !== undefined) fbObj.id = finalId;
      return fbObj;
    }).filter(Boolean);
    report.tablesSummary['تقييمات الذكاء الاصطناعي'] = sanitizedData.aiFeedback.length;
  }

  if (Array.isArray(rawData.aiTrainingData)) {
    sanitizedData.aiTrainingData = rawData.aiTrainingData.map((t: any) => {
      if (!t || typeof t !== 'object') return null;
      let finalId = undefined;
      const rawId = t.id !== undefined ? t.id : t['المعرف'];
      if (rawId !== undefined && rawId !== null && rawId !== '') {
        const parsed = parseInt(rawId, 10);
        if (!isNaN(parsed) && parsed > 0) finalId = parsed;
      }
      const trainObj: any = {
        query: safeString(t.query || t['السؤال التجريبي'], '', 'بيانات التدريب', 'السؤال'),
        expectedIntent: safeString(t.expectedIntent || t['النية المتوقعة'], 'general_query', 'بيانات التدريب', 'النية'),
        expectedEntities: typeof t.expectedEntities === 'object' ? JSON.stringify(t.expectedEntities) : (t.expectedEntities || t['الكيانات المتوقعة'] || undefined),
        notes: t.notes || t['ملاحظات'] || undefined,
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : (typeof t['تاريخ الإنشاء'] === 'number' ? t['تاريخ الإنشاء'] : Date.now())
      };
      if (finalId !== undefined) trainObj.id = finalId;
      return trainObj;
    }).filter(Boolean);
    report.tablesSummary['بيانات تدريب المساعد'] = sanitizedData.aiTrainingData.length;
  }

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
    ws['!views'] = [{ rightToLeft: true }];
    const colNames = Object.keys(rows[0]);
    ws['!cols'] = colNames.map(col => {
      let maxLen = col.length;
      const sample = Math.min(rows.length, 100);
      for (let i = 0; i < sample; i++) {
        const val = rows[i][col];
        const str = val === undefined || val === null ? '' : String(val);
        if (str.length > maxLen) maxLen = str.length;
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 48) };
    });
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  if (Array.isArray(jsonData.products)) {
    addSheet('المنتجات_والمخزون', jsonData.products.map((p: any) => ({
      'المعرف': p.id,
      'اسم المنتج': p.name,
      'الباركود': p.barcode,
      'سعر البيع': p.sale_price !== undefined ? p.sale_price : p.salePrice,
      'سعر التكلفة': p.cost_price !== undefined ? p.cost_price : p.costPrice,
      'الكمية الحالية': p.stock_quantity !== undefined ? p.stock_quantity : p.stock,
      'حد الأدنى': p.min_stock !== undefined ? p.min_stock : p.minStock,
      'التصنيف': p.category,
      'الوحدة': p.unit,
      'رقم المورد': p.supplier_id !== undefined ? p.supplier_id : p.supplierId,
      'تاريخ الإنتاج': p.production_date || p.productionDate || '',
      'تاريخ الصلاحية': p.expiration_date || p.expirationDate || ''
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
      'رقم العميل': s.customer_id !== undefined ? s.customer_id : s.customerId,
      'العميل': s.customer_name || s.customerName,
      'الإجمالي': s.total_amount !== undefined ? s.total_amount : s.total,
      'الخصم': s.discount || 0,
      'المدفوع': s.paid_amount !== undefined ? s.paid_amount : s.paid,
      'المتبقي': s.remaining_amount !== undefined ? s.remaining_amount : s.remaining,
      'طريقة الدفع': s.payment_type || s.paymentMethod,
      'حالة الدفع': s.payment_status || (Number(s.remaining_amount || 0) <= 0 ? 'خالصة' : 'متبقي'),
      'التاريخ': s.created_at || s.createdAt,
      'الملاحظات': s.notes || ''
    })));
  }

  if (Array.isArray(jsonData.expenses)) {
    addSheet('المصروفات_التشغيلية', jsonData.expenses.map((e: any) => ({
      'المعرف': e.id,
      'البند': e.title,
      'التصنيف': e.category,
      'المبلغ': e.amount,
      'طريقة الدفع': e.payment_method || e.paymentMethod || 'نقداً',
      'الملاحظات': e.notes,
      'التاريخ': e.created_at || e.createdAt || e.date
    })));
  }

  if (Array.isArray(jsonData.saleItems)) {
    addSheet('تفاصيل_أصناف_المبيعات', jsonData.saleItems.map((item: any) => ({
      'المعرف': item.id,
      'رقم الفاتورة': item.sale_id !== undefined ? item.sale_id : item.saleId,
      'رقم المنتج': item.product_id !== undefined ? item.product_id : item.productId,
      'الكمية': item.quantity,
      'سعر البيع': item.price_at_sale !== undefined ? item.price_at_sale : item.priceAtSale
    })));
  }

  if (Array.isArray(jsonData.debts)) {
    addSheet('حركة_الديون', jsonData.debts.map((d: any) => ({
      'المعرف': d.id,
      'رقم العميل': d.customer_id !== undefined ? d.customer_id : d.customerId,
      'رقم الفاتورة': d.sale_id !== undefined ? d.sale_id : d.saleId,
      'المبلغ': d.amount,
      'النوع': d.type,
      'الرصيد السابق': d.previous_balance !== undefined ? d.previous_balance : d.previousBalance,
      'الرصيد الجديد': d.new_balance !== undefined ? d.new_balance : d.newBalance,
      'التاريخ': d.created_at || d.createdAt,
      'ملاحظات': d.notes
    })));
  }

  if (Array.isArray(jsonData.supplierPayments)) {
    addSheet('دفعات_الموردين', jsonData.supplierPayments.map((p: any) => ({
      'المعرف': p.id,
      'رقم المورد': p.supplier_id !== undefined ? p.supplier_id : p.supplierId,
      'المبلغ المدفوع': p.amount,
      'تاريخ الدفع': p.payment_date || p.paymentDate,
      'ملاحظات': p.notes
    })));
  }

  if (Array.isArray(jsonData.salesSettlements)) {
    addSheet('تسويات_المبيعات_اليومية', jsonData.salesSettlements.map((s: any) => ({
      'المعرف': s.id,
      'إجمالي المبيعات': s.total_sales !== undefined ? s.total_sales : s.totalSales,
      'المبلغ المسلم': s.delivered_amount !== undefined ? s.delivered_amount : s.deliveredAmount,
      'الفارق': s.difference,
      'المسحوبات': s.cash_withdrawals !== undefined ? s.cash_withdrawals : s.cashWithdrawals,
      'التاريخ': s.created_at || s.createdAt,
      'ملاحظات': s.notes
    })));
  }

  if (Array.isArray(jsonData.cashWithdrawals)) {
    addSheet('المسحوبات_النقدية', jsonData.cashWithdrawals.map((w: any) => ({
      'المعرف': w.id,
      'المبلغ': w.amount,
      'المسحوب لصالحه': w.by_whom || w.byWhom,
      'السبب': w.reason,
      'تم السداد': (w.is_repaid !== undefined ? w.is_repaid : w.isRepaid) ? 'نعم' : 'لا',
      'تاريخ السداد': w.repay_date || w.repayDate,
      'التاريخ': w.created_at || w.createdAt
    })));
  }

  if (Array.isArray(jsonData.inventoryLogs)) {
    addSheet('حركة_المخزون', jsonData.inventoryLogs.map((log: any) => ({
      'المعرف': log.id,
      'رقم المنتج': log.product_id !== undefined ? log.product_id : log.productId,
      'اسم المنتج': log.product_name || log.productName,
      'الكمية السابقة': log.old_quantity !== undefined ? log.old_quantity : log.oldQuantity,
      'الكمية الجديدة': log.new_quantity !== undefined ? log.new_quantity : log.newQuantity,
      'مقدار التغيير': log.change_amount !== undefined ? log.change_amount : log.changeAmount,
      'السبب': log.reason,
      'النوع': log.type,
      'التاريخ': log.created_at || log.createdAt,
      'ملاحظات': log.notes
    })));
  }

  if (Array.isArray(jsonData.notes)) {
    addSheet('الملاحظات_والمهام', jsonData.notes.map((n: any) => ({
      'المعرف': n.id,
      'العنوان': n.title,
      'المحتوى': n.content,
      'الأولوية': n.priority === 'high' ? 'عالية' : (n.priority === 'warning' ? 'تحذير' : (n.priority === 'info' ? 'تنبيه' : 'عادية')),
      'تاريخ التذكير': n.reminder_date || n.reminderDate || '',
      'مكتمل': (n.is_completed || n.completed) ? 'نعم' : 'لا',
      'التاريخ': n.created_at || n.createdAt
    })));
  }

  if (Array.isArray(jsonData.settings)) {
    const safeSettings = jsonData.settings.filter((s: any) => !isSystemLicensingKey(s.key || s['المفتاح']));
    if (safeSettings.length > 0) {
      addSheet('إعدادات_النظام', safeSettings.map((s: any) => ({
        'المفتاح': s.key || s['المفتاح'] || '',
        'القيمة': typeof s.value === 'object' && s.value !== null ? JSON.stringify(s.value) : (s.value !== undefined ? s.value : (s['القيمة'] !== undefined ? s['القيمة'] : ''))
      })));
    }
  }

  if (Array.isArray(jsonData.aiConversations) && jsonData.aiConversations.length > 0) {
    addSheet('محادثات_المساعد', jsonData.aiConversations.map((c: any) => ({
      'المعرف': c.id,
      'العنوان': c.title,
      'تاريخ الإنشاء': c.createdAt,
      'تاريخ التحديث': c.updatedAt
    })));
  }

  if (Array.isArray(jsonData.aiMessages) && jsonData.aiMessages.length > 0) {
    addSheet('رسائل_المساعد', jsonData.aiMessages.map((m: any) => ({
      'المعرف': m.id,
      'رقم المحادثة': m.conversationId,
      'الدور': m.role,
      'المحتوى': m.content,
      'الوقت': m.timestamp,
      'النية': m.intent || '',
      'ملخص التفكير': m.reasoningSummary || ''
    })));
  }

  if (Array.isArray(jsonData.knowledgeDocuments) && jsonData.knowledgeDocuments.length > 0) {
    addSheet('قاعدة_المعرفة', jsonData.knowledgeDocuments.map((doc: any) => ({
      'المعرف': doc.id,
      'العنوان': doc.title,
      'التصنيف': doc.category,
      'المحتوى': doc.content,
      'الوسوم': Array.isArray(doc.tags) ? doc.tags.join(', ') : (doc.tags || ''),
      'اسم الملف': doc.fileName || '',
      'نوع الملف': doc.fileType || '',
      'تاريخ الإنشاء': doc.createdAt
    })));
  }

  if (Array.isArray(jsonData.documentChunks) && jsonData.documentChunks.length > 0) {
    addSheet('أجزاء_المستندات', jsonData.documentChunks.map((chk: any) => ({
      'المعرف': chk.id,
      'رقم المستند': chk.documentId,
      'رقم المقطع': chk.chunkIndex,
      'عنوان القسم': chk.sectionTitle || '',
      'المحتوى': chk.content,
      'عدد الكلمات': chk.wordCount,
      'تاريخ الإنشاء': chk.createdAt
    })));
  }

  if (Array.isArray(jsonData.aiFeedback) && jsonData.aiFeedback.length > 0) {
    addSheet('تقييمات_المساعد', jsonData.aiFeedback.map((f: any) => ({
      'المعرف': f.id,
      'رقم الرسالة': f.messageId,
      'سؤال المستخدم': f.userQuery,
      'إجابة المساعد': f.responseAnswer,
      'التقييم': f.rating,
      'ملاحظة المستخدم': f.userComment || '',
      'الوقت': f.timestamp
    })));
  }

  if (Array.isArray(jsonData.aiTrainingData) && jsonData.aiTrainingData.length > 0) {
    addSheet('بيانات_تدريب_المساعد', jsonData.aiTrainingData.map((t: any) => ({
      'المعرف': t.id,
      'السؤال التجريبي': t.query,
      'النية المتوقعة': t.expectedIntent,
      'الكيانات المتوقعة': typeof t.expectedEntities === 'object' ? JSON.stringify(t.expectedEntities) : (t.expectedEntities || ''),
      'ملاحظات': t.notes || '',
      'تاريخ الإنشاء': t.createdAt
    })));
  }

  return wb;
}

/**
 * Normalizes sheet name for exact dictionary matching
 */
function normalizeSheetName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\s_\-–—\.]+/g, '')
    .trim();
}

const TABLE_DEFINITIONS: { table: string; aliases: string[] }[] = [
  {
    table: 'suppliers',
    aliases: [
      'الموردين_والحسابات', 'الموردين_وحساباتهم', 'الموردين', 'الموردون', 'حسابات_الموردين',
      'سجل_الموردين', 'قائمة_الموردين', 'بيانات_الموردين', 'suppliers', 'vendors', 'supplier', 'vendor'
    ]
  },
  {
    table: 'supplierPayments',
    aliases: [
      'دفعات_الموردين', 'مدفوعات_الموردين', 'سداد_الموردين', 'دفعات_المورد', 'سداد_المورد',
      'مدفوعات_المورد', 'دفعة_مورد', 'سجل_دفعات_الموردين', 'supplierPayments', 'supplier_payments', 'supplierpayments'
    ]
  },
  {
    table: 'products',
    aliases: [
      'المنتجات_المخزون', 'المنتجات_والمخزون', 'المنتجات', 'المخزون', 'الأصناف', 'الاصناف',
      'البضائع', 'قائمة_المنتجات', 'سجل_المنتجات', 'مخزون_المنتجات', 'products', 'items', 'inventory', 'stock'
    ]
  },
  {
    table: 'customers',
    aliases: [
      'العملاء_والديون', 'العملاء', 'الزبائن', 'سجل_العملاء', 'قائمة_العملاء', 'بيانات_العملاء',
      'customers', 'clients', 'customer', 'client'
    ]
  },
  {
    table: 'saleItems',
    aliases: [
      'تفاصيل_أصناف_المبيعات', 'تفاصيل_اصناف_المبيعات', 'تفاصيل_المبيعات', 'بنود_المبيعات',
      'عناصر_المبيعات', 'أصناف_الفواتير', 'اصناف_الفواتير', 'saleItems', 'sale_items', 'saleitems', 'invoicedetails'
    ]
  },
  {
    table: 'sales',
    aliases: [
      'سجل_المبيعات', 'سجلات_المبيعات', 'المبيعات', 'الفواتير', 'سجل_الفواتير', 'فواتير_المبيعات',
      'sales', 'invoices', 'orders', 'sale', 'invoice'
    ]
  },
  {
    table: 'debts',
    aliases: [
      'حركة_الديون', 'سجل_الديون', 'كشف_الديون', 'ديون_العملاء', 'الديون', 'حركة_ديون',
      'سجل_حركة_الديون', 'كشف_حساب_الديون', 'debts', 'debt', 'receivables'
    ]
  },
  {
    table: 'expenses',
    aliases: [
      'المصروفات_التشغيلية', 'المصروفات', 'المصاريف', 'النفقات', 'سجل_المصروفات', 'مصروفات_تشغيلية',
      'expenses', 'expense', 'expenditures'
    ]
  },
  {
    table: 'salesSettlements',
    aliases: [
      'تسويات_المبيعات_اليومية', 'تسويات_المبيعات', 'التسويات_اليومية', 'تسوية_المبيعات',
      'التسويات', 'salesSettlements', 'sales_settlements', 'settlements'
    ]
  },
  {
    table: 'cashWithdrawals',
    aliases: [
      'المسحوبات_النقدية', 'المسحوبات', 'مسحوبات_الكاش', 'سجل_المسحوبات', 'مسحوبات_نقدية',
      'cashWithdrawals', 'cash_withdrawals', 'withdrawals'
    ]
  },
  {
    table: 'inventoryLogs',
    aliases: [
      'سجل_حركة_المخزون', 'حركة_المخزون', 'سجل_المخزون', 'حركات_المخزون', 'حركة_الاصناف',
      'inventoryLogs', 'inventory_logs', 'stocklogs'
    ]
  },
  {
    table: 'notes',
    aliases: [
      'الملاحظات_والمهام', 'الملاحظات', 'المهام', 'المفكرة', 'سجل_الملاحظات', 'notes', 'tasks', 'todos'
    ]
  },
  {
    table: 'settings',
    aliases: [
      'إعدادات_النظام', 'اعدادات_النظام', 'الإعدادات', 'الاعدادات', 'ضبط_النظام', 'settings', 'config'
    ]
  },
  {
    table: 'aiConversations',
    aliases: [
      'محادثات_المساعد', 'محادثات_الذكاء_الاصطناعي', 'محادثات_ai', 'aiConversations', 'ai_conversations'
    ]
  },
  {
    table: 'aiMessages',
    aliases: [
      'رسائل_المساعد', 'رسائل_الذكاء_الاصطناعي', 'رسائل_ai', 'aiMessages', 'ai_messages'
    ]
  },
  {
    table: 'knowledgeDocuments',
    aliases: [
      'قاعدة_المعرفة', 'مستندات_المعرفة', 'وثائق_المعرفة', 'knowledgeDocuments', 'knowledge_documents'
    ]
  },
  {
    table: 'documentChunks',
    aliases: [
      'أجزاء_المستندات', 'اجزاء_المستندات', 'مقاطع_المستندات', 'documentChunks', 'document_chunks'
    ]
  },
  {
    table: 'aiFeedback',
    aliases: [
      'تقييمات_المساعد', 'تقييمات_الذكاء_الاصطناعي', 'aiFeedback', 'ai_feedback'
    ]
  },
  {
    table: 'aiTrainingData',
    aliases: [
      'بيانات_تدريب_المساعد', 'بيانات_تدريب_الذكاء_الاصطناعي', 'تدريب_المساعد', 'aiTrainingData', 'ai_training_data'
    ]
  }
];

const TABLE_EXACT_MAP: { [normalizedAlias: string]: string } = {};
TABLE_DEFINITIONS.forEach(def => {
  def.aliases.forEach(alias => {
    TABLE_EXACT_MAP[normalizeSheetName(alias)] = def.table;
  });
});

/**
 * Identify matching database table for any Excel sheet name
 */
export function identifyTableFromSheetName(sheetName: string): string | null {
  const norm = normalizeSheetName(sheetName);
  
  // 1. Direct exact alias match
  if (TABLE_EXACT_MAP[norm]) {
    return TABLE_EXACT_MAP[norm];
  }

  // 2. Skip overview / KPI / Summary reports from polluting tables
  if (
    norm.includes('ملخص') || 
    norm.includes('ارباح') || 
    norm.includes('overview') || 
    norm.includes('kpi') || 
    norm.includes('شهاده') || 
    norm.includes('تحليل') || 
    norm.includes('تقرير') || 
    norm.includes('analytics') || 
    norm.includes('report')
  ) {
    return null;
  }

  // 3. Fallback Heuristic with strict keyword order (Suppliers BEFORE Debts to prevent 'الموردين' containing 'دين' bug)
  if ((norm.includes('دفع') || norm.includes('سداد') || norm.includes('مدفوع')) && (norm.includes('مورد') || norm.includes('supplier'))) {
    return 'supplierPayments';
  }
  if (norm.includes('مورد') || norm.includes('supplier') || norm.includes('vendor')) {
    return 'suppliers';
  }
  if (
    norm.includes('تفاصيل') || 
    norm.includes('saleitem') || 
    (norm.includes('صنف') && (norm.includes('فاتور') || norm.includes('مبيع'))) ||
    norm.includes('بنودالمبيعات') ||
    norm.includes('عناصرالمبيعات')
  ) {
    return 'saleItems';
  }
  if (norm.includes('تسوي') || norm.includes('settlement')) {
    return 'salesSettlements';
  }
  if (norm.includes('مسحوب') || norm.includes('سحب') || norm.includes('withdrawal')) {
    return 'cashWithdrawals';
  }
  if ((norm.includes('مخزون') && norm.includes('حرك')) || norm.includes('سجلمخزون') || norm.includes('inventorylog')) {
    return 'inventoryLogs';
  }
  if (norm.includes('عميل') || norm.includes('عملاء') || norm.includes('زبون') || norm.includes('زبائن') || norm.includes('customer') || norm.includes('client')) {
    return 'customers';
  }
  if (norm.includes('دين') || norm.includes('ديون') || norm.includes('debt') || norm.includes('كشفديون')) {
    return 'debts';
  }
  if (norm.includes('منتج') || norm.includes('اصناف') || norm.includes('بضائع') || norm.includes('product') || norm.includes('مخزون')) {
    return 'products';
  }
  if (norm.includes('مبيع') || norm.includes('فاتور') || norm.includes('sale') || norm.includes('invoice')) {
    return 'sales';
  }
  if (norm.includes('مصروف') || norm.includes('مصاريف') || norm.includes('نفقات') || norm.includes('expense')) {
    return 'expenses';
  }
  if (norm.includes('ملاحظ') || norm.includes('مهام') || norm.includes('note') || norm.includes('task')) {
    return 'notes';
  }
  if (norm.includes('إعداد') || norm.includes('اعداد') || norm.includes('ضبط') || norm.includes('setting') || norm.includes('config')) {
    return 'settings';
  }
  if (norm.includes('محادث') || norm.includes('conversation')) {
    return 'aiConversations';
  }
  if (norm.includes('رسائل') || norm.includes('message')) {
    return 'aiMessages';
  }
  if (norm.includes('معرف') || norm.includes('knowledge') || norm.includes('وثائق')) {
    return 'knowledgeDocuments';
  }
  if (norm.includes('اجزاء') || norm.includes('chunk')) {
    return 'documentChunks';
  }
  if (norm.includes('تقييم') || norm.includes('feedback')) {
    return 'aiFeedback';
  }
  if (norm.includes('تدريب') || norm.includes('training')) {
    return 'aiTrainingData';
  }

  return null;
}

/**
 * Convert Excel Workbook (.xlsx) to JSON database object
 */
export function convertExcelToDatabaseJson(wb: XLSX.WorkBook): any {
  const rawData: any = {};

  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    if (!rows || rows.length === 0) return;

    const matchedTable = identifyTableFromSheetName(sheetName);
    if (matchedTable) {
      // Special parsing for settings if JSON serialized
      if (matchedTable === 'settings') {
        rawData.settings = rows.map((r: any) => {
          let val = r['القيمة'] !== undefined ? r['القيمة'] : r.value;
          if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
            try { val = JSON.parse(val); } catch (_) {}
          }
          return {
            key: r['المفتاح'] || r.key || '',
            value: val
          };
        });
      } else {
        rawData[matchedTable] = rows;
      }
    } else if (!rawData.products) {
      // Default fallback for first unmatched sheet
      rawData.products = rows;
    }
  });

  return rawData;
}

/**
 * Safe table import helper that cleanly handles auto-increment keys vs explicit keys,
 * preventing IndexedDB key path evaluation errors across all browsers and file formats.
 */
async function safeImportTableRecords(
  table: any,
  records: any[],
  tableName: string,
  isAutoIncrement: boolean = true
): Promise<void> {
  if (!records || !Array.isArray(records) || records.length === 0) return;

  const cleanedRecords = records.map((item, idx) => {
    if (!item || typeof item !== 'object') return null;
    const record = { ...item };

    if (isAutoIncrement) {
      if (record.id !== undefined && record.id !== null && record.id !== '') {
        const numId = Number(record.id);
        if (!isNaN(numId) && Number.isInteger(numId) && numId > 0) {
          record.id = numId;
        } else {
          delete record.id;
        }
      } else {
        delete record.id;
      }
    } else {
      // Non-auto-increment tables (e.g. aiConversations, aiMessages) require a non-empty string/number ID
      if (!record.id) {
        record.id = `${tableName}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`;
      } else {
        record.id = String(record.id);
      }
    }
    return record;
  }).filter(Boolean);

  if (cleanedRecords.length === 0) return;

  const withId: any[] = [];
  const withoutId: any[] = [];

  for (const r of cleanedRecords) {
    if (r.id !== undefined) {
      withId.push(r);
    } else {
      withoutId.push(r);
    }
  }

  try {
    if (withId.length > 0) {
      await table.bulkPut(withId);
    }
    if (withoutId.length > 0) {
      await table.bulkAdd(withoutId);
    }
  } catch (bulkErr) {
    console.warn(`Bulk operation for table [${tableName}] had issue, falling back to safe item-by-item:`, bulkErr);
    for (const r of cleanedRecords) {
      try {
        if (r.id !== undefined) {
          await table.put(r);
        } else {
          await table.add(r);
        }
      } catch (itemErr) {
        try {
          const fallback = { ...r };
          delete fallback.id;
          await table.add(fallback);
        } catch (finalErr) {
          console.error(`Skipping unrecoverable item in [${tableName}]:`, finalErr, r);
        }
      }
    }
  }
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
    // 2. Perform DB Transaction on all tables
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
      db.notes,
      db.supplierPayments,
      db.salesSettlements,
      db.cashWithdrawals,
      db.aiConversations,
      db.aiMessages,
      db.knowledgeDocuments,
      db.documentChunks,
      db.aiFeedback,
      db.aiTrainingData
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
        if (sanitizedData.settings) {
          // Clear only non-licensing business settings, preserving hardware device ID and activation state
          const allCurrent = await db.settings.toArray();
          for (const s of allCurrent) {
            if (!isSystemLicensingKey(s.key) && s.id) {
              await db.settings.delete(s.id);
            }
          }
        }
        if (sanitizedData.notes) await db.notes.clear();
        if (sanitizedData.supplierPayments) await db.supplierPayments.clear();
        if (sanitizedData.salesSettlements) await db.salesSettlements.clear();
        if (sanitizedData.cashWithdrawals) await db.cashWithdrawals.clear();
        if (sanitizedData.aiConversations) await db.aiConversations.clear();
        if (sanitizedData.aiMessages) await db.aiMessages.clear();
        if (sanitizedData.knowledgeDocuments) await db.knowledgeDocuments.clear();
        if (sanitizedData.documentChunks) await db.documentChunks.clear();
        if (sanitizedData.aiFeedback) await db.aiFeedback.clear();
        if (sanitizedData.aiTrainingData) await db.aiTrainingData.clear();
      }

      await safeImportTableRecords(db.products, sanitizedData.products, 'products', true);
      await safeImportTableRecords(db.customers, sanitizedData.customers, 'customers', true);
      await safeImportTableRecords(db.suppliers, sanitizedData.suppliers, 'suppliers', true);
      await safeImportTableRecords(db.sales, sanitizedData.sales, 'sales', true);
      await safeImportTableRecords(db.saleItems, sanitizedData.saleItems, 'saleItems', true);
      await safeImportTableRecords(db.debts, sanitizedData.debts, 'debts', true);
      await safeImportTableRecords(db.expenses, sanitizedData.expenses, 'expenses', true);
      await safeImportTableRecords(db.inventoryLogs, sanitizedData.inventoryLogs, 'inventoryLogs', true);

      if (sanitizedData.settings?.length) {
        const safeSettings = sanitizedData.settings.filter((s: any) => !isSystemLicensingKey(s.key));
        for (const s of safeSettings) {
          const existing = await db.settings.where('key').equals(s.key).first();
          if (existing && existing.id) {
            await db.settings.update(existing.id, { value: s.value });
          } else {
            await db.settings.add({ key: s.key, value: s.value });
          }
        }
      }

      await safeImportTableRecords(db.notes, sanitizedData.notes, 'notes', true);
      await safeImportTableRecords(db.supplierPayments, sanitizedData.supplierPayments, 'supplierPayments', true);
      await safeImportTableRecords(db.salesSettlements, sanitizedData.salesSettlements, 'salesSettlements', true);
      await safeImportTableRecords(db.cashWithdrawals, sanitizedData.cashWithdrawals, 'cashWithdrawals', true);
      await safeImportTableRecords(db.aiConversations, sanitizedData.aiConversations, 'aiConversations', false);
      await safeImportTableRecords(db.aiMessages, sanitizedData.aiMessages, 'aiMessages', false);
      await safeImportTableRecords(db.knowledgeDocuments, sanitizedData.knowledgeDocuments, 'knowledgeDocuments', true);
      await safeImportTableRecords(db.documentChunks, sanitizedData.documentChunks, 'documentChunks', true);
      await safeImportTableRecords(db.aiFeedback, sanitizedData.aiFeedback, 'aiFeedback', true);
      await safeImportTableRecords(db.aiTrainingData, sanitizedData.aiTrainingData, 'aiTrainingData', true);
    });

    return { report, success: true };
  } catch (err) {
    console.error('Offline Database Import Failed:', err);
    return { report, success: false };
  }
}
