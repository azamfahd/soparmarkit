import * as XLSX from 'xlsx';
import { db, Product, Customer, Supplier, Sale, Expense } from '../db';
import { downloadWorkbook } from '../utils/fileSaver';
export { downloadWorkbook } from '../utils/fileSaver';
import { convertExcelToDatabaseJson, importAndRepairDatabaseOffline } from './dataSanitizer';
import { isSystemLicensingKey } from '../utils/licensing';

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
 * Applies RTL view and auto-calculates column widths based on cell content
 */
export function formatSheetWithAutoCols(ws: XLSX.WorkSheet, rows: any[]) {
  ws['!dir'] = 'rtl';
  ws['!views'] = [{ rightToLeft: true }];
  if (!rows || rows.length === 0) return;
  const colNames = Object.keys(rows[0]);
  ws['!cols'] = colNames.map(col => {
    let maxLen = col.length;
    const sampleSize = Math.min(rows.length, 120);
    for (let i = 0; i < sampleSize; i++) {
      const val = rows[i][col];
      const str = val === undefined || val === null ? '' : String(val);
      if (str.length > maxLen) maxLen = str.length;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
  });
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
  const debts = db.debts ? await db.debts.toArray() : [];
  const supplierPayments = db.supplierPayments ? await db.supplierPayments.toArray() : [];
  const salesSettlements = db.salesSettlements ? await db.salesSettlements.toArray() : [];
  const cashWithdrawals = db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const inventoryLogs = db.inventoryLogs ? await db.inventoryLogs.toArray() : [];
  const notes = db.notes ? await db.notes.toArray() : [];
  const settings = db.settings ? await db.settings.toArray() : [];
  const aiConversations = db.aiConversations ? await db.aiConversations.toArray() : [];
  const aiMessages = db.aiMessages ? await db.aiMessages.toArray() : [];
  const knowledgeDocuments = db.knowledgeDocuments ? await db.knowledgeDocuments.toArray() : [];
  const documentChunks = db.documentChunks ? await db.documentChunks.toArray() : [];
  const aiFeedback = db.aiFeedback ? await db.aiFeedback.toArray() : [];
  const aiTrainingData = db.aiTrainingData ? await db.aiTrainingData.toArray() : [];

  // 1. Products Sheet
  const productsRows = products.map(p => ({
    'رقم المنتج': p.id || '',
    'اسم المنتج': p.name,
    'القسم / التصنيف': p.category || 'عام',
    'الباركود': p.barcode || '',
    'سعر التكلفة': p.cost_price || 0,
    'سعر البيع': p.sale_price || 0,
    'الكمية الحالية': p.stock_quantity || 0,
    'الحد الأدنى للمخزون': p.min_stock !== undefined ? p.min_stock : 5,
    'الوحدة': p.unit || 'حبة',
    'رقم المورد': p.supplier_id || '',
    'تاريخ الإنتاج': p.production_date || '',
    'تاريخ الصلاحية': p.expiration_date || '',
    'إجمالي قيمة التكلفة': (p.cost_price || 0) * (p.stock_quantity || 0),
    'إجمالي قيمة البيع المتوقعة': (p.sale_price || 0) * (p.stock_quantity || 0)
  }));

  // 2. Customers & Receivables Sheet
  const customersRows = customers.map(c => ({
    'رقم العميل': c.id || '',
    'اسم العميل': c.name,
    'رقم الجوال': c.phone || '',
    'العنوان': c.address || '',
    'الرصيد الحالي (الدين المترتب)': c.balance || 0,
    'ملاحظات': c.notes || ''
  }));

  // 3. Suppliers Sheet
  const suppliersRows = suppliers.map(s => ({
    'رقم المورد': s.id || '',
    'اسم المورد': s.name,
    'رقم الهاتف': s.phone || '',
    'الشركة': s.company || '',
    'الرصيد المستحق لهم': s.balance || 0,
    'ملاحظات': s.notes || ''
  }));

  // 4. Expenses Sheet (Operational)
  const expensesRows = expenses.map(e => ({
    'رقم المصروف': e.id || '',
    'بيان المصروف': e.title,
    'التصنيف': e.category || 'عام',
    'المبلغ': e.amount || 0,
    'طريقة الدفع': e.payment_method === 'bank' ? 'حساب بنكي' : 'نقداً من الصندوق',
    'تاريخ الصرف': e.date || (e.created_at ? e.created_at.slice(0, 10) : ''),
    'التاريخ الكامل': e.created_at || '',
    'ملاحظات': e.notes || ''
  }));

  // 5. Sales Log Sheet (Full historical sales)
  const salesRows = sales.map(s => ({
    'رقم الفاتورة': s.id || '',
    'رقم العميل': s.customer_id || '',
    'اسم العميل': s.customer_name || 'عميل نقدي',
    'الإجمالي': s.total_amount || 0,
    'الخصم': s.discount || 0,
    'المدفوع': s.paid_amount || 0,
    'المتبقي': s.remaining_amount || 0,
    'طريقة الدفع': s.payment_type === 'cash' ? 'نقدي' : 'آجل / دين',
    'حالة الدفع': s.payment_status || (Number(s.remaining_amount || 0) <= 0 ? 'خالصة' : 'متبقي'),
    'الرصيد السابق للعميل': s.previous_balance || 0,
    'الرصيد الجديد للعميل': s.new_balance || 0,
    'تاريخ العملية': s.created_at || '',
    'ملاحظات': s.notes || ''
  }));

  // 6. Sale Items Sheet
  const saleItemsRows = saleItems.map(item => {
    const matchedProd = products.find(p => p.id === item.product_id);
    return {
      'رقم المعرف': item.id || '',
      'رقم الفاتورة': item.sale_id || '',
      'رقم المنتج': item.product_id || '',
      'اسم المنتج': matchedProd?.name || '',
      'الكمية': item.quantity || 1,
      'سعر البيع': item.price_at_sale || 0
    };
  });

  // 7. Financial Overview KPI Sheet
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

  const debtsRows = debts.map(d => ({
    'رقم المعرف': d.id || '',
    'رقم العميل': d.customer_id || '',
    'رقم الفاتورة': d.sale_id || '',
    'المبلغ': d.amount || 0,
    'النوع': d.type || '',
    'الرصيد السابق': d.previous_balance || 0,
    'الرصيد الجديد': d.new_balance || 0,
    'التاريخ': d.created_at || '',
    'ملاحظات': d.notes || ''
  }));

  const supplierPaymentsRows = supplierPayments.map(p => ({
    'رقم المعرف': p.id || '',
    'رقم المورد': p.supplier_id || '',
    'المبلغ المدفوع': p.amount || 0,
    'تاريخ الدفع': p.payment_date || '',
    'ملاحظات': p.notes || ''
  }));

  const salesSettlementsRows = salesSettlements.map(s => ({
    'رقم المعرف': s.id || '',
    'إجمالي المبيعات': s.total_sales || 0,
    'المبلغ المسلم': s.delivered_amount || 0,
    'الفارق': s.difference || 0,
    'المسحوبات': s.cash_withdrawals || 0,
    'التاريخ': s.created_at || '',
    'ملاحظات': s.notes || ''
  }));

  const cashWithdrawalsRows = cashWithdrawals.map(w => ({
    'رقم المعرف': w.id || '',
    'المبلغ': w.amount || 0,
    'المسحوب لصالحه': w.by_whom || '',
    'السبب': w.reason || '',
    'تم السداد': w.is_repaid ? 'نعم' : 'لا',
    'تاريخ السداد': w.repay_date || '',
    'التاريخ': w.created_at || ''
  }));

  const inventoryLogsRows = inventoryLogs.map(log => ({
    'رقم المعرف': log.id || '',
    'رقم المنتج': log.product_id || '',
    'اسم المنتج': log.product_name || '',
    'الكمية السابقة': log.old_quantity || 0,
    'الكمية الجديدة': log.new_quantity || 0,
    'مقدار التغيير': log.change_amount || 0,
    'السبب': log.reason || '',
    'النوع': log.type || '',
    'التاريخ': log.created_at || '',
    'ملاحظات': log.notes || ''
  }));

  const notesRows = notes.map(n => ({
    'رقم المعرف': n.id || '',
    'العنوان': n.title || '',
    'المحتوى': n.content || '',
    'الأولوية': n.priority === 'high' ? 'عالية' : (n.priority === 'warning' ? 'تحذير' : (n.priority === 'info' ? 'تنبيه' : 'عادية')),
    'تاريخ التذكير': n.reminder_date || '',
    'مكتمل': n.is_completed ? 'نعم' : 'لا',
    'التاريخ': n.created_at || ''
  }));

  const safeSettings = settings.filter(s => !isSystemLicensingKey(s.key));
  const settingsRows = safeSettings.map(s => ({
    'المفتاح': s.key || '',
    'القيمة': typeof s.value === 'object' && s.value !== null ? JSON.stringify(s.value) : (s.value !== undefined ? s.value : '')
  }));

  const aiConversationsRows = aiConversations.map(c => ({
    'رقم المعرف': c.id || '',
    'العنوان': c.title || '',
    'تاريخ الإنشاء': c.createdAt || '',
    'تاريخ التحديث': c.updatedAt || ''
  }));

  const aiMessagesRows = aiMessages.map(m => ({
    'رقم المعرف': m.id || '',
    'رقم المحادثة': m.conversationId || '',
    'الدور': m.role || '',
    'المحتوى': m.content || '',
    'الوقت': m.timestamp || '',
    'النية': m.intent || '',
    'ملخص التفكير': m.reasoningSummary || ''
  }));

  const knowledgeDocumentsRows = knowledgeDocuments.map(doc => ({
    'رقم المعرف': doc.id || '',
    'العنوان': doc.title || '',
    'التصنيف': doc.category || '',
    'المحتوى': doc.content || '',
    'الوسوم': Array.isArray(doc.tags) ? doc.tags.join(', ') : (doc.tags || ''),
    'اسم الملف': doc.fileName || '',
    'نوع الملف': doc.fileType || '',
    'تاريخ الإنشاء': doc.createdAt || ''
  }));

  const documentChunksRows = documentChunks.map(chk => ({
    'رقم المعرف': chk.id || '',
    'رقم المستند': chk.documentId || '',
    'رقم المقطع': chk.chunkIndex || 0,
    'عنوان القسم': chk.sectionTitle || '',
    'المحتوى': chk.content || '',
    'عدد الكلمات': chk.wordCount || 0,
    'تاريخ الإنشاء': chk.createdAt || ''
  }));

  const aiFeedbackRows = aiFeedback.map(f => ({
    'رقم المعرف': f.id || '',
    'رقم الرسالة': f.messageId || '',
    'سؤال المستخدم': f.userQuery || '',
    'إجابة المساعد': f.responseAnswer || '',
    'التقييم': f.rating || 0,
    'ملاحظة المستخدم': f.userComment || '',
    'الوقت': f.timestamp || ''
  }));

  const aiTrainingDataRows = aiTrainingData.map(t => ({
    'رقم المعرف': t.id || '',
    'السؤال التجريبي': t.query || '',
    'النية المتوقعة': t.expectedIntent || '',
    'الكيانات المتوقعة': typeof t.expectedEntities === 'object' ? JSON.stringify(t.expectedEntities) : (t.expectedEntities || ''),
    'ملاحظات': t.notes || '',
    'تاريخ الإنشاء': t.createdAt || ''
  }));

  const wb = XLSX.utils.book_new();

  // Create worksheets with auto column widths and RTL layout
  const wsOverview = XLSX.utils.json_to_sheet(financialOverviewRows);
  formatSheetWithAutoCols(wsOverview, financialOverviewRows);

  const wsProducts = XLSX.utils.json_to_sheet(productsRows);
  formatSheetWithAutoCols(wsProducts, productsRows);

  const wsCustomers = XLSX.utils.json_to_sheet(customersRows);
  formatSheetWithAutoCols(wsCustomers, customersRows);

  const wsSuppliers = XLSX.utils.json_to_sheet(suppliersRows);
  formatSheetWithAutoCols(wsSuppliers, suppliersRows);

  const wsExpenses = XLSX.utils.json_to_sheet(expensesRows);
  formatSheetWithAutoCols(wsExpenses, expensesRows);

  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  formatSheetWithAutoCols(wsSales, salesRows);

  const wsSaleItems = XLSX.utils.json_to_sheet(saleItemsRows);
  formatSheetWithAutoCols(wsSaleItems, saleItemsRows);

  const wsDebts = XLSX.utils.json_to_sheet(debtsRows);
  formatSheetWithAutoCols(wsDebts, debtsRows);

  const wsSupplierPayments = XLSX.utils.json_to_sheet(supplierPaymentsRows);
  formatSheetWithAutoCols(wsSupplierPayments, supplierPaymentsRows);

  const wsSettlements = XLSX.utils.json_to_sheet(salesSettlementsRows);
  formatSheetWithAutoCols(wsSettlements, salesSettlementsRows);

  const wsCashWithdrawals = XLSX.utils.json_to_sheet(cashWithdrawalsRows);
  formatSheetWithAutoCols(wsCashWithdrawals, cashWithdrawalsRows);

  const wsInventoryLogs = XLSX.utils.json_to_sheet(inventoryLogsRows);
  formatSheetWithAutoCols(wsInventoryLogs, inventoryLogsRows);

  const wsNotes = XLSX.utils.json_to_sheet(notesRows);
  formatSheetWithAutoCols(wsNotes, notesRows);

  const wsSettings = XLSX.utils.json_to_sheet(settingsRows);
  formatSheetWithAutoCols(wsSettings, settingsRows);

  // Append sheets in optimal order for both user readability and import reliability
  XLSX.utils.book_append_sheet(wb, wsProducts, 'المنتجات_المخزون');
  XLSX.utils.book_append_sheet(wb, wsSales, 'سجل_المبيعات');
  XLSX.utils.book_append_sheet(wb, wsSaleItems, 'تفاصيل_أصناف_المبيعات');
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'العملاء_والديون');
  XLSX.utils.book_append_sheet(wb, wsSuppliers, 'الموردين_والحسابات');
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'المصروفات_التشغيلية');
  XLSX.utils.book_append_sheet(wb, wsDebts, 'حركة_الديون');
  XLSX.utils.book_append_sheet(wb, wsSupplierPayments, 'دفعات_الموردين');
  XLSX.utils.book_append_sheet(wb, wsSettlements, 'تسويات_المبيعات_اليومية');
  XLSX.utils.book_append_sheet(wb, wsCashWithdrawals, 'المسحوبات_النقدية');
  XLSX.utils.book_append_sheet(wb, wsInventoryLogs, 'سجل_حركة_المخزون');
  XLSX.utils.book_append_sheet(wb, wsNotes, 'الملاحظات_والمهام');
  XLSX.utils.book_append_sheet(wb, wsSettings, 'إعدادات_النظام');

  if (aiConversationsRows.length > 0) {
    const wsAiConv = XLSX.utils.json_to_sheet(aiConversationsRows);
    formatSheetWithAutoCols(wsAiConv, aiConversationsRows);
    XLSX.utils.book_append_sheet(wb, wsAiConv, 'محادثات_المساعد');
  }
  if (aiMessagesRows.length > 0) {
    const wsAiMsg = XLSX.utils.json_to_sheet(aiMessagesRows);
    formatSheetWithAutoCols(wsAiMsg, aiMessagesRows);
    XLSX.utils.book_append_sheet(wb, wsAiMsg, 'رسائل_المساعد');
  }
  if (knowledgeDocumentsRows.length > 0) {
    const wsDoc = XLSX.utils.json_to_sheet(knowledgeDocumentsRows);
    formatSheetWithAutoCols(wsDoc, knowledgeDocumentsRows);
    XLSX.utils.book_append_sheet(wb, wsDoc, 'قاعدة_المعرفة');
  }
  if (documentChunksRows.length > 0) {
    const wsChk = XLSX.utils.json_to_sheet(documentChunksRows);
    formatSheetWithAutoCols(wsChk, documentChunksRows);
    XLSX.utils.book_append_sheet(wb, wsChk, 'أجزاء_المستندات');
  }
  if (aiFeedbackRows.length > 0) {
    const wsFdb = XLSX.utils.json_to_sheet(aiFeedbackRows);
    formatSheetWithAutoCols(wsFdb, aiFeedbackRows);
    XLSX.utils.book_append_sheet(wb, wsFdb, 'تقييمات_المساعد');
  }
  if (aiTrainingDataRows.length > 0) {
    const wsTrn = XLSX.utils.json_to_sheet(aiTrainingDataRows);
    formatSheetWithAutoCols(wsTrn, aiTrainingDataRows);
    XLSX.utils.book_append_sheet(wb, wsTrn, 'بيانات_تدريب_المساعد');
  }

  XLSX.utils.book_append_sheet(wb, wsOverview, 'الملخص_المالي_والأرباح');

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

  // Convert and sanitize entire Excel database across all 19 entities
  const rawDbJson = convertExcelToDatabaseJson(workbook);
  const importResult = await importAndRepairDatabaseOffline(rawDbJson, 'merge');

  const result: SyncResult = {
    addedProducts: importResult.report?.tablesSummary['المنتجات'] || 0,
    updatedProducts: 0,
    addedCustomers: importResult.report?.tablesSummary['العملاء'] || 0,
    updatedCustomers: 0,
    addedSuppliers: importResult.report?.tablesSummary['الموردين'] || 0,
    updatedSuppliers: 0,
    addedExpenses: importResult.report?.tablesSummary['المصروفات'] || 0,
    updatedExpenses: 0
  };

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
        const rawJson = convertExcelToDatabaseJson(workbook);
        const { report, success } = await importAndRepairDatabaseOffline(rawJson, 'merge');

        if (!success) {
          throw new Error('فشل في استيراد بيانات ملف الإكسل أو معالجتها.');
        }

        const result: SyncResult = {
          addedProducts: report.tablesSummary['المنتجات'] || 0,
          updatedProducts: 0,
          addedCustomers: report.tablesSummary['العملاء'] || 0,
          updatedCustomers: 0,
          addedSuppliers: report.tablesSummary['الموردين'] || 0,
          updatedSuppliers: 0,
          addedExpenses: report.tablesSummary['المصروفات'] || 0,
          updatedExpenses: 0
        };

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('خطأ أثناء قراءة ملف الإكسل.'));
    reader.readAsBinaryString(file);
  });
}
