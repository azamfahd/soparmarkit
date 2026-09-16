import * as XLSX from 'xlsx';
import { db, Product, Customer, Supplier, Sale, Expense } from '../db';
import { downloadWorkbook } from '../utils/fileSaver';

export interface ExcelSyncStatus {
  isLinked: boolean;
  fileName: string | null;
  lastSync: string | null;
  error: string | null;
  lastModified?: number | null;
}

export interface SyncResult {
  addedProducts: number;
  updatedProducts: number;
  addedCustomers: number;
  updatedCustomers: number;
  addedSuppliers: number;
  updatedSuppliers: number;
  addedExpenses: number;
  updatedExpenses: number;
}

/**
 * Checks if the File System Access API is supported by the current browser.
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

/**
 * Requests or verifies read/write permission for a given FileSystemFileHandle.
 */
export async function verifyHandlePermission(fileHandle: any, readWrite: boolean): Promise<boolean> {
  const options: any = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }

  try {
    if ((await fileHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await fileHandle.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (err) {
    console.warn('Handle permission query failed:', err);
  }

  return false;
}

/**
 * Selects a local Excel file and links it to the app for automatic sync.
 */
export async function linkLocalExcelFile(): Promise<{ handle: any; name: string } | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('متصفحك الحالي لا يدعم ميزة الوصول المباشر للملفات المحلية. يمكنك استخدام الاستيراد والتصدير اليدوي عبر ملفات Excel.');
  }

  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'ملفات إكسل المحاسبية',
          accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
          }
        }
      ],
      excludeAcceptAllOption: true,
      multiple: false
    });

    const hasPermission = await verifyHandlePermission(handle, true);
    if (!hasPermission) {
      throw new Error('تم رفض إذن الوصول والقراءة/الكتابة لملف الإكسل.');
    }

    const file = await handle.getFile();
    const lastModified = file.lastModified;

    // Store file handle and metadata in db.settings
    await db.settings.put({ key: 'excel_file_handle', value: handle });
    await db.settings.put({ key: 'excel_file_name', value: handle.name });
    await db.settings.put({ key: 'excel_last_sync', value: new Date().toISOString() });
    await db.settings.put({ key: 'excel_file_last_modified', value: lastModified });

    return { handle, name: handle.name };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return null; // User cancelled dialog
    }
    console.error('Error linking Excel file:', error);
    throw error;
  }
}

/**
 * Unlinks the currently linked local Excel file.
 */
export async function unlinkExcelFile(): Promise<void> {
  const handleRec = await db.settings.where('key').equals('excel_file_handle').first();
  if (handleRec?.id) await db.settings.delete(handleRec.id);

  const nameRec = await db.settings.where('key').equals('excel_file_name').first();
  if (nameRec?.id) await db.settings.delete(nameRec.id);

  const syncRec = await db.settings.where('key').equals('excel_last_sync').first();
  if (syncRec?.id) await db.settings.delete(syncRec.id);

  const modRec = await db.settings.where('key').equals('excel_file_last_modified').first();
  if (modRec?.id) await db.settings.delete(modRec.id);
}

/**
 * Retrieves the linked Excel file handle if it exists and has permissions.
 */
export async function getLinkedExcelHandle(): Promise<any | null> {
  try {
    const record = await db.settings.where('key').equals('excel_file_handle').first();
    if (!record || !record.value) return null;

    const handle = record.value as any;
    const hasPermission = await verifyHandlePermission(handle, true);
    if (hasPermission) {
      return handle;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving linked file handle:', error);
    return null;
  }
}

/**
 * Generates an Excel Workbook from the current local database state.
 */
export async function generateWorkbookFromDatabase(): Promise<XLSX.WorkBook> {
  const products = await db.products.toArray();
  const customers = await db.customers.toArray();
  const suppliers = await db.suppliers.toArray();
  const expenses = await db.expenses.toArray();
  const sales = await db.sales.toArray();
  const saleItems = await db.saleItems.toArray();

  // 1. Products Sheet
  const productsRows = products.map(p => ({
    'رقم المنتج': p.id || '',
    'اسم المنتج': p.name,
    'القسم / التصنيف': p.category || 'عام',
    'الباركود': p.barcode || '',
    'سعر التكلفة': p.cost_price || 0,
    'سعر البيع': p.sale_price || 0,
    'الكمية الحالية': p.stock_quantity || 0,
    'الوحدة': p.unit || 'حبة',
    'تاريخ الصلاحية': p.expiration_date || '',
    'إجمالي قيمة التكلفة': (p.cost_price || 0) * (p.stock_quantity || 0),
    'إجمالي قيمة البيع المتوقعة': (p.sale_price || 0) * (p.stock_quantity || 0)
  }));

  // 2. Customers & Receivables Sheet
  const customersRows = customers.map(c => ({
    'رقم العميل': c.id || '',
    'اسم العميل': c.name,
    'رقم الجوال': c.phone || '',
    'الرصيد الحالي (الدين المترتب)': c.balance || 0,
    'ملاحظات': c.notes || ''
  }));

  // 3. Suppliers Sheet
  const suppliersRows = suppliers.map(s => ({
    'رقم المورد': s.id || '',
    'اسم المورد': s.name,
    'رقم الهاتف': s.phone || '',
    'الرصيد المستحق لهم': s.balance || 0,
    'ملاحظات': s.notes || ''
  }));

  // 4. Expenses Sheet (Operational)
  const expensesRows = expenses.map(e => ({
    'رقم المصروف': e.id || '',
    'بيان المصروف': e.title,
    'التصنيف': e.category || 'عام',
    'المبلغ': e.amount || 0,
    'تاريخ الصرف': e.date || '',
    'طريقة الدفع': e.payment_method === 'cash' ? 'نقداً من الصندوق' : e.payment_method === 'bank' ? 'حساب بنكي' : 'أخرى',
    'ملاحظات': e.notes || ''
  }));

  // 5. Sales Log Sheet
  const salesRows = sales.slice(-2000).reverse().map(s => ({
    'رقم الفاتورة': s.id || '',
    'الإجمالي': s.total_amount || 0,
    'طريقة الدفع': s.payment_type === 'cash' ? 'نقدي' : 'آجل / دين',
    'تاريخ العملية': s.created_at ? new Date(s.created_at).toLocaleString('ar-YE') : '',
    'ملاحظات': s.notes || ''
  }));

  // 6. Financial Overview KPI Sheet
  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalInventoryCost = products.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0);
  const totalInventorySaleValue = products.reduce((sum, p) => sum + ((p.sale_price || 0) * (p.stock_quantity || 0)), 0);
  const totalCustomerDebts = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalSupplierDebts = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

  // Profit calculation from sale items
  const prodCostMap = new Map(products.map(p => [p.id, p.cost_price || 0]));
  const grossProfit = saleItems.reduce((sum, item) => {
    const cost = prodCostMap.get(item.product_id) || 0;
    return sum + ((item.price_at_sale || 0) - cost) * (item.quantity || 0);
  }, 0);
  const netProfit = grossProfit - totalExpensesAmount;

  const financialOverviewRows = [
    { 'البند المحاسبي': 'إجمالي المبيعات المحققة', 'القيمة الإجمالية': totalSalesRevenue, 'ملاحظات': 'إجمالي قيمة جميع الفواتير الصادرة' },
    { 'البند المحاسبي': 'مجمل الأرباح من المبيعات', 'القيمة الإجمالية': grossProfit, 'ملاحظات': 'سعر البيع - سعر التكلفة للأصناف المباعة' },
    { 'البند المحاسبي': 'إجمالي المصروفات التشغيلية', 'القيمة الإجمالية': totalExpensesAmount, 'ملاحظات': 'إيجار، كهرباء، رواتب، نثريات' },
    { 'البند المحاسبي': 'صافي الربح الفعلي', 'القيمة الإجمالية': netProfit, 'ملاحظات': 'مجمل الأرباح - إجمالي المصروفات' },
    { 'البند المحاسبي': 'إجمالي قيمة المخزون الحالي (سعر التكلفة)', 'القيمة الإجمالية': totalInventoryCost, 'ملاحظات': 'رأس المال المستثمر في البضاعة حالياً' },
    { 'البند المحاسبي': 'إجمالي قيمة المخزون الحالي (سعر البيع)', 'القيمة الإجمالية': totalInventorySaleValue, 'ملاحظات': 'العائد المتوقع عند بيع كامل المخزون' },
    { 'البند المحاسبي': 'إجمالي ديون العملاء المترتبة', 'القيمة الإجمالية': totalCustomerDebts, 'ملاحظات': 'أموال المتجر المستحقة لدى الزبائن' },
    { 'البند المحاسبي': 'إجمالي مستحقات الموردين', 'القيمة الإجمالية': totalSupplierDebts, 'ملاحظات': 'مستحقات البضاعة لدى تجار الجملة والموردين' }
  ];

  const wb = XLSX.utils.book_new();

  // Create worksheets
  const wsOverview = XLSX.utils.json_to_sheet(financialOverviewRows);
  const wsProducts = XLSX.utils.json_to_sheet(productsRows);
  const wsCustomers = XLSX.utils.json_to_sheet(customersRows);
  const wsSuppliers = XLSX.utils.json_to_sheet(suppliersRows);
  const wsExpenses = XLSX.utils.json_to_sheet(expensesRows);
  const wsSales = XLSX.utils.json_to_sheet(salesRows);

  // Set Right-To-Left view for Arabic sheets
  const sheetView = [{ Reels: { RightToLeft: true } }];
  wsOverview['!views'] = sheetView as any;
  wsProducts['!views'] = sheetView as any;
  wsCustomers['!views'] = sheetView as any;
  wsSuppliers['!views'] = sheetView as any;
  wsExpenses['!views'] = sheetView as any;
  wsSales['!views'] = sheetView as any;

  // Append sheets
  XLSX.utils.book_append_sheet(wb, wsOverview, 'الملخص_المالي_والأرباح');
  XLSX.utils.book_append_sheet(wb, wsProducts, 'المنتجات_المخزون');
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'العملاء_والديون');
  XLSX.utils.book_append_sheet(wb, wsSuppliers, 'الموردين_والحسابات');
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'المصروفات_التشغيلية');
  XLSX.utils.book_append_sheet(wb, wsSales, 'سجل_المبيعات');

  return wb;
}

/**
 * Triggers a bidirectional sync.
 * Reads Excel rows, merges with Dexie, then writes the updated merged dataset back to Excel.
 */
export async function syncBidirectionalExcel(): Promise<SyncResult> {
  const handle = await getLinkedExcelHandle();
  if (!handle) {
    throw new Error('لا يوجد ملف إكسل مرتبط أو تائه الإذن. يرجى ربط الملف المحلي أولاً.');
  }

  // 1. Read Excel file from local disk
  const file = await handle.getFile();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const result: SyncResult = {
    addedProducts: 0,
    updatedProducts: 0,
    addedCustomers: 0,
    updatedCustomers: 0,
    addedSuppliers: 0,
    updatedSuppliers: 0,
    addedExpenses: 0,
    updatedExpenses: 0
  };

  // Sync Products Sheet
  const sheetProducts = workbook.Sheets['المنتجات_المخزون'] || workbook.Sheets['المنتجات'] || workbook.Sheets['المخزون'];
  if (sheetProducts) {
    const rows: any[] = XLSX.utils.sheet_to_json(sheetProducts);
    for (const row of rows) {
      const name = String(row['اسم المنتج'] || row['الاسم'] || '').trim();
      if (!name) continue;

      const barcode = String(row['الباركود'] || row['باركود'] || '').trim();
      const category = String(row['القسم / التصنيف'] || row['القسم'] || row['التصنيف'] || 'عام').trim();
      const cost_price = parseFloat(row['سعر التكلفة'] || row['التكلفة'] || '0') || 0;
      const sale_price = parseFloat(row['سعر البيع'] || row['السعر'] || '0') || 0;
      const stock_quantity = parseFloat(row['الكمية الحالية'] || row['الكمية'] || '0') || 0;
      const unit = String(row['الوحدة'] || 'حبة').trim();
      const expiration_date = String(row['تاريخ الصلاحية'] || '').trim();

      // Check if product exists by barcode or name
      let existing: Product | undefined = undefined;
      if (barcode) {
        existing = await db.products.where('barcode').equals(barcode).first();
      }
      if (!existing) {
        existing = await db.products.where('name').equals(name).first();
      }

      if (existing) {
        let changed = false;
        if (existing.stock_quantity !== stock_quantity) {
          existing.stock_quantity = stock_quantity;
          changed = true;
        }
        if (existing.sale_price !== sale_price) {
          existing.sale_price = sale_price;
          changed = true;
        }
        if (existing.cost_price !== cost_price) {
          existing.cost_price = cost_price;
          changed = true;
        }
        if (category && existing.category !== category) {
          existing.category = category;
          changed = true;
        }
        if (expiration_date && existing.expiration_date !== expiration_date) {
          existing.expiration_date = expiration_date;
          changed = true;
        }
        if (unit && existing.unit !== unit) {
          existing.unit = unit;
          changed = true;
        }
        if (changed && existing.id) {
          await db.products.put(existing);
          result.updatedProducts++;
        }
      } else {
        await db.products.add({
          name,
          category,
          cost_price,
          sale_price,
          stock_quantity,
          barcode,
          unit,
          expiration_date
        });
        result.addedProducts++;
      }
    }
  }

  // Sync Customers Sheet
  const sheetCustomers = workbook.Sheets['العملاء_والديون'] || workbook.Sheets['العملاء'] || workbook.Sheets['الزبائن'];
  if (sheetCustomers) {
    const rows: any[] = XLSX.utils.sheet_to_json(sheetCustomers);
    for (const row of rows) {
      const name = String(row['اسم العميل'] || row['الاسم'] || '').trim();
      if (!name) continue;

      const phone = String(row['رقم الجوال'] || row['التلفون'] || '').trim();
      const balance = parseFloat(row['الرصيد الحالي (الدين المترتب)'] || row['الرصيد'] || '0') || 0;
      const notes = String(row['ملاحظات'] || '').trim();

      let existing = await db.customers.where('name').equals(name).first();
      if (!existing) {
        await db.customers.add({ name, phone, balance, notes });
        result.addedCustomers++;
      } else {
        let changed = false;
        if (existing.balance !== balance) {
          existing.balance = balance;
          changed = true;
        }
        if (phone && existing.phone !== phone) {
          existing.phone = phone;
          changed = true;
        }
        if (changed && existing.id) {
          await db.customers.put(existing);
          result.updatedCustomers++;
        }
      }
    }
  }

  // Sync Suppliers Sheet
  const sheetSuppliers = workbook.Sheets['الموردين_والحسابات'] || workbook.Sheets['الموردين'] || workbook.Sheets['الموردون'];
  if (sheetSuppliers) {
    const rows: any[] = XLSX.utils.sheet_to_json(sheetSuppliers);
    for (const row of rows) {
      const name = String(row['اسم المورد'] || row['الاسم'] || '').trim();
      if (!name) continue;

      const phone = String(row['رقم الهاتف'] || row['التلفون'] || '').trim();
      const balance = parseFloat(row['الرصيد المستحق لهم'] || row['الرصيد'] || '0') || 0;
      const notes = String(row['ملاحظات'] || '').trim();

      let existing = await db.suppliers.where('name').equals(name).first();
      if (!existing) {
        await db.suppliers.add({ name, phone, balance, notes });
        result.addedSuppliers++;
      } else {
        let changed = false;
        if (existing.balance !== balance) {
          existing.balance = balance;
          changed = true;
        }
        if (phone && existing.phone !== phone) {
          existing.phone = phone;
          changed = true;
        }
        if (changed && existing.id) {
          await db.suppliers.put(existing);
          result.updatedSuppliers++;
        }
      }
    }
  }

  // Sync Expenses Sheet
  const sheetExpenses = workbook.Sheets['المصروفات_التشغيلية'] || workbook.Sheets['المصروفات'] || workbook.Sheets['المصاريف'];
  if (sheetExpenses) {
    const rows: any[] = XLSX.utils.sheet_to_json(sheetExpenses);
    for (const row of rows) {
      const title = String(row['بيان المصروف'] || row['البيان'] || row['اسم المصروف'] || '').trim();
      const amount = parseFloat(row['المبلغ'] || '0') || 0;
      if (!title || amount <= 0) continue;

      const category = String(row['التصنيف'] || 'عام').trim();
      const date = String(row['تاريخ الصرف'] || row['التاريخ'] || new Date().toISOString().slice(0, 10)).trim();
      const paymentMethodRaw = String(row['طريقة الدفع'] || 'cash').trim();
      const payment_method: 'cash' | 'bank' | 'other' = 
        paymentMethodRaw.includes('بنك') ? 'bank' : paymentMethodRaw.includes('أخرى') ? 'other' : 'cash';
      const notes = String(row['ملاحظات'] || '').trim();

      // Check if expense already recorded on that date with same title and amount
      const existing = await db.expenses
        .where('date')
        .equals(date)
        .filter(e => e.title === title && Math.abs(e.amount - amount) < 0.01)
        .first();

      if (!existing) {
        await db.expenses.add({
          title,
          category,
          amount,
          date,
          payment_method,
          notes,
          created_at: new Date().toISOString()
        });
        result.addedExpenses++;
      }
    }
  }

  // 2. Generate updated Excel file with full merged state
  const updatedWb = await generateWorkbookFromDatabase();
  const excelBuffer = XLSX.write(updatedWb, { bookType: 'xlsx', type: 'array' });

  // 3. Write back to local Excel file directly
  const writable = await handle.createWritable();
  await writable.write(excelBuffer);
  await writable.close();

  // 4. Update last sync time and file modified timestamp
  const updatedFile = await handle.getFile();
  await db.settings.put({ key: 'excel_last_sync', value: new Date().toISOString() });
  await db.settings.put({ key: 'excel_file_last_modified', value: updatedFile.lastModified });

  return result;
}

/**
 * Checks if the linked local Excel file on disk was modified externally (e.g., edited in MS Excel).
 * If modified, automatically triggers bidirectional sync.
 */
export async function checkFileModifiedAndSync(): Promise<{ hasChanged: boolean; result?: SyncResult }> {
  const handle = await getLinkedExcelHandle();
  if (!handle) return { hasChanged: false };

  try {
    const file = await handle.getFile();
    const lastModified = file.lastModified;

    const storedModRec = await db.settings.where('key').equals('excel_file_last_modified').first();
    const lastKnownModified = storedModRec?.value ? Number(storedModRec.value) : 0;

    // If file on disk has a newer lastModified date by at least 1 second (1000ms)
    if (lastModified && lastModified - lastKnownModified > 1000) {
      console.log('External modification detected in Excel file on disk! Running auto-sync...');
      const syncResult = await syncBidirectionalExcel();
      return { hasChanged: true, result: syncResult };
    }

    return { hasChanged: false };
  } catch (err) {
    console.warn('Could not check Excel file modification status:', err);
    return { hasChanged: false };
  }
}

/**
 * Writes current local database state into the linked Excel file (Export update).
 */
export async function writeCurrentDbToLinkedExcel(): Promise<boolean> {
  const handle = await getLinkedExcelHandle();
  if (!handle) return false;

  try {
    const updatedWb = await generateWorkbookFromDatabase();
    const excelBuffer = XLSX.write(updatedWb, { bookType: 'xlsx', type: 'array' });
    const writable = await handle.createWritable();
    await writable.write(excelBuffer);
    await writable.close();

    const file = await handle.getFile();
    await db.settings.put({ key: 'excel_last_sync', value: new Date().toISOString() });
    await db.settings.put({ key: 'excel_file_last_modified', value: file.lastModified });
    return true;
  } catch (err) {
    console.warn('Failed to write database updates to linked Excel:', err);
    return false;
  }
}

/**
 * Downloads a professional, pre-formatted Excel template for entering products, customers, suppliers, and expenses.
 */
export async function downloadExcelTemplate(): Promise<void> {
  const wb = XLSX.utils.book_new();

  // Instructions Sheet
  const instructions = [
    { 'الخطوة': '1', 'التعليمات والإرشادات': 'هذا القالب مصمم للربط والتزامن المباشر مع النظام المحاسبي المحلي.' },
    { 'الخطوة': '2', 'التعليمات والإرشادات': 'يمكنك إضافة وتعديل الأصناف في صفحة "المنتجات_المخزون".' },
    { 'الخطوة': '3', 'التعليمات والإرشادات': 'إذا كان المنتج يحتوي على باركود، يرجى كتابته لسهولة البحث والمطابقة.' },
    { 'الخطوة': '4', 'التعليمات والإرشادات': 'يمكنك تعديل الأسعار أو الكميات في أي وقت في Excel وسيقوم البرنامج بمزامنتها فوراً.' },
    { 'الخطوة': '5', 'التعليمات والإرشادات': 'صفحة "المصروفات_التشغيلية" مخصصة لقيد الإيجارات والفواتير والرواتب.' }
  ];

  // Sample Products
  const sampleProducts = [
    {
      'اسم المنتج': 'سكر أبيض ناعم 10 كجم',
      'القسم / التصنيف': 'مواد غذائية',
      'الباركود': '628100010001',
      'سعر التكلفة': 3500,
      'سعر البيع': 4000,
      'الكمية الحالية': 25,
      'الوحدة': 'كيس',
      'تاريخ الصلاحية': '2026-12-31'
    },
    {
      'اسم المنتج': 'أرز بسمتي هندي 5 كجم',
      'القسم / التصنيف': 'مواد غذائية',
      'الباركود': '628100010002',
      'سعر التكلفة': 2800,
      'سعر البيع': 3200,
      'الكمية الحالية': 40,
      'الوحدة': 'كيس',
      'تاريخ الصلاحية': '2027-06-30'
    },
    {
      'اسم المنتج': 'زيت طهي نباتي 1.5 لتر',
      'القسم / التصنيف': 'زيوت وسمن',
      'الباركود': '628100010003',
      'سعر التكلفة': 950,
      'سعر البيع': 1150,
      'الكمية الحالية': 60,
      'الوحدة': 'حبة',
      'تاريخ الصلاحية': '2026-10-15'
    }
  ];

  // Sample Customers
  const sampleCustomers = [
    {
      'اسم العميل': 'محمد علي الأهدل',
      'رقم الجوال': '777123456',
      'الرصيد الحالي (الدين المترتب)': 15000,
      'ملاحظات': 'حساب جاري - سداد شهري'
    },
    {
      'اسم العميل': 'سوبرماركت النور',
      'رقم الجوال': '771987654',
      'الرصيد الحالي (الدين المترتب)': 0,
      'ملاحظات': 'عميل نقدي'
    }
  ];

  // Sample Suppliers
  const sampleSuppliers = [
    {
      'اسم المورد': 'شركة البركة للمواد الغذائية',
      'رقم الهاتف': '01234567',
      'الرصيد المستحق لهم': 85000,
      'ملاحظات': 'مندوب المبيعات: أحمد'
    }
  ];

  // Sample Expenses
  const sampleExpenses = [
    {
      'بيان المصروف': 'إيجار المحل لشهر الحالي',
      'التصنيف': 'إيجار',
      'المبلغ': 50000,
      'تاريخ الصرف': new Date().toISOString().slice(0, 10),
      'طريقة الدفع': 'نقداً من الصندوق',
      'ملاحظات': 'سداد كامل الإيجار'
    },
    {
      'بيان المصروف': 'فاتورة الكهرباء والماء',
      'التصنيف': 'فواتير ومرافق',
      'المبلغ': 12000,
      'تاريخ الصرف': new Date().toISOString().slice(0, 10),
      'طريقة الدفع': 'نقداً من الصندوق',
      'ملاحظات': ''
    }
  ];

  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  const wsProducts = XLSX.utils.json_to_sheet(sampleProducts);
  const wsCustomers = XLSX.utils.json_to_sheet(sampleCustomers);
  const wsSuppliers = XLSX.utils.json_to_sheet(sampleSuppliers);
  const wsExpenses = XLSX.utils.json_to_sheet(sampleExpenses);

  const sheetView = [{ Reels: { RightToLeft: true } }];
  wsInstructions['!views'] = sheetView as any;
  wsProducts['!views'] = sheetView as any;
  wsCustomers['!views'] = sheetView as any;
  wsSuppliers['!views'] = sheetView as any;
  wsExpenses['!views'] = sheetView as any;

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'إرشادات_البداية');
  XLSX.utils.book_append_sheet(wb, wsProducts, 'المنتجات_المخزون');
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'العملاء_والديون');
  XLSX.utils.book_append_sheet(wb, wsSuppliers, 'الموردين_والحسابات');
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'المصروفات_التشغيلية');

  await downloadWorkbook(wb, `قالب_محاسبي_إكسل_جاهز_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Records the current timestamp as lastBackupDate in Dexie settings
 */
export async function recordBackupDate(): Promise<string> {
  const now = new Date().toISOString();
  try {
    const existing = await db.settings.where('key').equals('lastBackupDate').first();
    if (existing && existing.id) {
      await db.settings.update(existing.id, { value: now });
    } else {
      await db.settings.add({ key: 'lastBackupDate', value: now });
    }
  } catch (err) {
    console.error('Failed to update lastBackupDate in db.settings:', err);
  }
  return now;
}

/**
 * Manual Download of full accounting database to Excel (.xlsx)
 */
export async function downloadExcelBackupManual(): Promise<void> {
  const wb = await generateWorkbookFromDatabase();
  await downloadWorkbook(wb, `قاعدة_البيانات_المحاسبية_إكسل_${new Date().toISOString().slice(0, 10)}.xlsx`);
  await recordBackupDate();
}

/**
 * Manual Upload and Sync for environments without File System Access API
 */
export async function importExcelBackupManual(file: File): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('فشل في قراءة محتوى ملف الإكسل.');

        const workbook = XLSX.read(data, { type: 'binary' });
        const result: SyncResult = {
          addedProducts: 0,
          updatedProducts: 0,
          addedCustomers: 0,
          updatedCustomers: 0,
          addedSuppliers: 0,
          updatedSuppliers: 0,
          addedExpenses: 0,
          updatedExpenses: 0
        };

        // Helper to find sheet by multiple flexible keywords
        const findSheet = (keywords: string[]): XLSX.WorkSheet | null => {
          for (const name of workbook.SheetNames) {
            const cleanName = name.toLowerCase().trim();
            if (keywords.some(k => cleanName.includes(k.toLowerCase()))) {
              return workbook.Sheets[name];
            }
          }
          return null;
        };

        // 1. Products Sync
        const sheetProducts = findSheet(['منتج', 'مخزون', 'صنف', 'أصناف', 'بضائع', 'بضاعة', 'product', 'item', 'stock', 'inventory']);
        const sheetCustomers = findSheet(['عملاء', 'عميل', 'زبائن', 'زبون', 'ديون', 'دين', 'customer', 'client', 'debt']);
        const sheetSuppliers = findSheet(['موردين', 'مورد', 'موردون', 'حسابات مورد', 'supplier', 'vendor']);
        const sheetExpenses = findSheet(['مصروفات', 'مصروف', 'مصاريف', 'نفقات', 'expense', 'cost_operational']);

        // Helper to extract rows from sheet
        const getRows = (ws: XLSX.WorkSheet | null): any[] => {
          if (!ws) return [];
          return XLSX.utils.sheet_to_json(ws);
        };

        // If no named sheets matched and workbook only has 1 or 2 sheets, scan generic sheets (e.g. Sheet1)
        const unassignedSheets = workbook.SheetNames.filter(name => {
          const s = workbook.Sheets[name];
          return s !== sheetProducts && s !== sheetCustomers && s !== sheetSuppliers && s !== sheetExpenses && !name.includes('إرشاد') && !name.includes('ملخص');
        });

        // 1. Process Products
        const prodRows = getRows(sheetProducts);
        if (prodRows.length === 0 && unassignedSheets.length > 0) {
          // Check first unassigned sheet
          const firstSheet = workbook.Sheets[unassignedSheets[0]];
          const rows = getRows(firstSheet);
          if (rows.length > 0) {
            const sample = rows[0];
            const sampleKeys = Object.keys(sample).join(' ').toLowerCase();
            if (sampleKeys.includes('سعر') || sampleKeys.includes('price') || sampleKeys.includes('صنف') || sampleKeys.includes('منتج') || sampleKeys.includes('كمية') || sampleKeys.includes('مخزون') || sampleKeys.includes('تكلفة')) {
              prodRows.push(...rows);
              unassignedSheets.shift();
            }
          }
        }

        for (const row of prodRows) {
          const name = String(
            row['اسم المنتج'] || row['اسم الصنف'] || row['الاسم'] || row['الصنف'] || 
            row['المنتج'] || row['المادة'] || row['البضاعة'] || row['اسم البضاعة'] || 
            row['Item Name'] || row['Product Name'] || row['Name'] || row['name'] || ''
          ).trim();
          if (!name) continue;

          const barcode = String(row['الباركود'] || row['باركود'] || row['كود'] || row['الرمز'] || row['رمز الصنف'] || row['Barcode'] || row['barcode'] || '').trim();
          const category = String(row['القسم / التصنيف'] || row['القسم'] || row['التصنيف'] || row['الفئة'] || row['المجموعة'] || row['Category'] || 'عام').trim();
          const cost_price = parseFloat(row['سعر التكلفة'] || row['التكلفة'] || row['سعر الشراء'] || row['شراء'] || row['تكلفه'] || row['Cost Price'] || row['Cost'] || '0') || 0;
          const sale_price = parseFloat(row['سعر البيع'] || row['السعر'] || row['سعر'] || row['بيع'] || row['قطاعي'] || row['Sale Price'] || row['Price'] || '0') || 0;
          const stock_quantity = parseFloat(row['الكمية الحالية'] || row['الكمية'] || row['المخزون'] || row['العدد'] || row['عدد'] || row['الرصيد'] || row['Quantity'] || row['Qty'] || '0') || 0;
          const unit = String(row['الوحدة'] || row['وحدة'] || row['Unit'] || 'حبة').trim();
          const expiration_date = String(row['تاريخ الصلاحية'] || row['الصلاحية'] || row['تاريخ الانتهاء'] || row['Expiry'] || '').trim();

          let existing = barcode ? await db.products.where('barcode').equals(barcode).first() : null;
          if (!existing) existing = await db.products.where('name').equals(name).first();

          if (existing) {
            let changed = false;
            if (existing.stock_quantity !== stock_quantity) {
              existing.stock_quantity = stock_quantity;
              changed = true;
            }
            if (sale_price > 0 && existing.sale_price !== sale_price) {
              existing.sale_price = sale_price;
              changed = true;
            }
            if (cost_price > 0 && existing.cost_price !== cost_price) {
              existing.cost_price = cost_price;
              changed = true;
            }
            if (category && existing.category !== category) {
              existing.category = category;
              changed = true;
            }
            if (expiration_date && existing.expiration_date !== expiration_date) {
              existing.expiration_date = expiration_date;
              changed = true;
            }
            if (unit && existing.unit !== unit) {
              existing.unit = unit;
              changed = true;
            }
            if (changed && existing.id) {
              await db.products.put(existing);
              result.updatedProducts++;
            }
          } else {
            await db.products.add({
              name,
              category,
              cost_price,
              sale_price,
              stock_quantity,
              barcode,
              unit,
              expiration_date
            });
            result.addedProducts++;
          }
        }

        // 2. Customers Sync
        const custRows = getRows(sheetCustomers);
        if (custRows.length === 0 && unassignedSheets.length > 0) {
          const firstSheet = workbook.Sheets[unassignedSheets[0]];
          const rows = getRows(firstSheet);
          if (rows.length > 0) {
            const sample = rows[0];
            const sampleKeys = Object.keys(sample).join(' ').toLowerCase();
            if (sampleKeys.includes('عميل') || sampleKeys.includes('زبون') || sampleKeys.includes('customer') || sampleKeys.includes('دين')) {
              custRows.push(...rows);
              unassignedSheets.shift();
            }
          }
        }

        for (const row of custRows) {
          const name = String(row['اسم العميل'] || row['العميل'] || row['الزبون'] || row['اسم الزبون'] || row['الاسم'] || row['Customer Name'] || row['Customer'] || '').trim();
          if (!name) continue;

          const phone = String(row['رقم الجوال'] || row['الجوال'] || row['الهاتف'] || row['التلفون'] || row['رقم الهاتف'] || row['Phone'] || '').trim();
          const balance = parseFloat(row['الرصيد الحالي (الدين المترتب)'] || row['الرصيد'] || row['الدين'] || row['المبلغ'] || row['Balance'] || '0') || 0;
          const notes = String(row['ملاحظات'] || row['Notes'] || '').trim();

          let existing = await db.customers.where('name').equals(name).first();
          if (!existing) {
            await db.customers.add({ name, phone, balance, notes });
            result.addedCustomers++;
          } else {
            let changed = false;
            if (existing.balance !== balance) {
              existing.balance = balance;
              changed = true;
            }
            if (phone && existing.phone !== phone) {
              existing.phone = phone;
              changed = true;
            }
            if (notes && existing.notes !== notes) {
              existing.notes = notes;
              changed = true;
            }
            if (changed && existing.id) {
              await db.customers.put(existing);
              result.updatedCustomers++;
            }
          }
        }

        // 3. Suppliers Sync
        const suppRows = getRows(sheetSuppliers);
        if (suppRows.length === 0 && unassignedSheets.length > 0) {
          const firstSheet = workbook.Sheets[unassignedSheets[0]];
          const rows = getRows(firstSheet);
          if (rows.length > 0) {
            const sample = rows[0];
            const sampleKeys = Object.keys(sample).join(' ').toLowerCase();
            if (sampleKeys.includes('مورد') || sampleKeys.includes('supplier')) {
              suppRows.push(...rows);
              unassignedSheets.shift();
            }
          }
        }

        for (const row of suppRows) {
          const name = String(row['اسم المورد'] || row['المورد'] || row['الاسم'] || row['اسم التاجر'] || row['Supplier Name'] || row['Supplier'] || '').trim();
          if (!name) continue;

          const phone = String(row['رقم الهاتف'] || row['الهاتف'] || row['الجوال'] || row['التلفون'] || row['Phone'] || '').trim();
          const balance = parseFloat(row['الرصيد المستحق لهم'] || row['الرصيد'] || row['المستحق'] || row['الدين'] || row['Balance'] || '0') || 0;
          const notes = String(row['ملاحظات'] || row['Notes'] || '').trim();

          let existing = await db.suppliers.where('name').equals(name).first();
          if (!existing) {
            await db.suppliers.add({ name, phone, balance, notes });
            result.addedSuppliers++;
          } else {
            let changed = false;
            if (existing.balance !== balance) {
              existing.balance = balance;
              changed = true;
            }
            if (phone && existing.phone !== phone) {
              existing.phone = phone;
              changed = true;
            }
            if (notes && existing.notes !== notes) {
              existing.notes = notes;
              changed = true;
            }
            if (changed && existing.id) {
              await db.suppliers.put(existing);
              result.updatedSuppliers++;
            }
          }
        }

        // 4. Expenses Sync
        const expRows = getRows(sheetExpenses);
        for (const row of expRows) {
          const title = String(row['بيان المصروف'] || row['البيان'] || row['اسم المصروف'] || row['المصروف'] || row['Title'] || '').trim();
          const amount = parseFloat(row['المبلغ'] || row['القيمة'] || row['Amount'] || '0') || 0;
          if (!title || amount <= 0) continue;

          const category = String(row['التصنيف'] || row['القسم'] || row['Category'] || 'عام').trim();
          const date = String(row['تاريخ الصرف'] || row['التاريخ'] || row['Date'] || new Date().toISOString().slice(0, 10)).trim();
          const paymentMethodRaw = String(row['طريقة الدفع'] || 'cash').trim();
          const payment_method: 'cash' | 'bank' | 'other' = 
            paymentMethodRaw.includes('بنك') ? 'bank' : paymentMethodRaw.includes('أخرى') ? 'other' : 'cash';
          const notes = String(row['ملاحظات'] || row['Notes'] || '').trim();

          const existing = await db.expenses
            .where('date')
            .equals(date)
            .filter(e => e.title === title && Math.abs(e.amount - amount) < 0.01)
            .first();

          if (!existing) {
            await db.expenses.add({
              title,
              category,
              amount,
              date,
              payment_method,
              notes,
              created_at: new Date().toISOString()
            });
            result.addedExpenses++;
          }
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('خطأ أثناء قراءة ملف الإكسل.'));
    reader.readAsBinaryString(file);
  });
}
