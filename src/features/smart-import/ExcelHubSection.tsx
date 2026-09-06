import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeftRight, 
  Clock, 
  FileDown, 
  Sparkles, 
  HardDrive, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  Check, 
  Layers, 
  X,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  isFileSystemAccessSupported, 
  linkLocalExcelFile, 
  unlinkExcelFile, 
  syncBidirectionalExcel, 
  downloadExcelBackupManual, 
  importExcelBackupManual, 
  downloadExcelTemplate,
  SyncResult 
} from '../../services/excelSync';
import { db } from '../../db';

interface ExcelHubSectionProps {
  showNotification?: (msg: string, type?: 'success' | 'error') => void;
  onOpenExcelSyncCenter?: () => void;
  onImportSuccess?: () => void;
}

export const ExcelHubSection: React.FC<ExcelHubSectionProps> = ({
  showNotification,
  onOpenExcelSyncCenter,
  onImportSuccess
}) => {
  // Live Sync States
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Manual File Upload & Preview States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState<boolean>(false);
  const [isExecutingImport, setIsExecutingImport] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [filePreview, setFilePreview] = useState<{
    sheetNames: string[];
    productsCount: number;
    customersCount: number;
    suppliersCount: number;
    expensesCount: number;
    sampleRows: any[];
  } | null>(null);

  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSupported = isFileSystemAccessSupported();

  // Load initial link status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const nameRec = await db.settings.where('key').equals('excel_file_name').first();
        const syncRec = await db.settings.where('key').equals('excel_last_sync').first();
        if (nameRec?.value) {
          setFileName(nameRec.value);
          setIsLinked(true);
        } else {
          setFileName(null);
          setIsLinked(false);
        }
        if (syncRec?.value) {
          setLastSync(syncRec.value);
        }
      } catch (err) {
        console.error('Error reading excel sync settings:', err);
      }
    };
    checkStatus();
  }, []);

  // Handle Link File
  const handleLinkFile = async () => {
    try {
      setIsSyncing(true);
      const res = await linkLocalExcelFile();
      if (res && res.name) {
        setFileName(res.name);
        setIsLinked(true);
        setLastSync(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        showNotification?.(`تم ربط ملف Excel بنجاح: ${res.name}`, 'success');
      }
    } catch (err: any) {
      showNotification?.(err.message || 'حدث خطأ أثناء ربط الملف', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Unlink
  const handleUnlink = async () => {
    try {
      await unlinkExcelFile();
      setIsLinked(false);
      setFileName(null);
      setLastSync(null);
      showNotification?.('تم إلغاء ربط ملف Excel المحلي.', 'success');
    } catch (err: any) {
      showNotification?.(err.message || 'خطأ في إلغاء الربط', 'error');
    }
  };

  // Handle Sync Now
  const handleSyncNow = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      const res = await syncBidirectionalExcel();
      if (res) {
        setSyncResult(res);
        setLastSync(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        const total = (res.addedProducts || 0) + (res.updatedProducts || 0) + 
                      (res.addedCustomers || 0) + (res.updatedCustomers || 0) + 
                      (res.addedSuppliers || 0) + (res.updatedSuppliers || 0) +
                      (res.addedExpenses || 0) + (res.updatedExpenses || 0);
        showNotification?.(`اكتملت المزامنة بنجاح! تم تحديث ومعالجة ${total} سجلاً.`, 'success');
        onImportSuccess?.();
      }
    } catch (err: any) {
      showNotification?.(err.message || 'خطأ أثناء المزامنة الحية', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Full Database Export to Excel
  const handleExportFullDatabase = async () => {
    try {
      showNotification?.('جاري تحضير وتصدير ملف Excel الشامل...', 'success');
      await downloadExcelBackupManual();
      showNotification?.('تم تصدير ملف الإكسل بنجاح وحفظه على جهازك! 📁', 'success');
    } catch (err: any) {
      showNotification?.(err.message || 'فشل تصدير ملف الإكسل', 'error');
    }
  };

  // Handle Drag & Drop
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      inspectAndSetFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      inspectAndSetFile(files[0]);
    }
  };

  // Inspect any Excel file and show instant preview
  const inspectAndSetFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    if (!validExtensions.some(ext => lowerName.endsWith(ext))) {
      showNotification?.('يرجى اختيار ملف Excel بصيغة .xlsx أو .xls أو .csv', 'error');
      return;
    }

    setSelectedFile(file);
    setIsAnalyzingFile(true);
    setFilePreview(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      let prodCount = 0;
      let custCount = 0;
      let suppCount = 0;
      let expCount = 0;
      let sampleRows: any[] = [];

      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        if (!ws) continue;
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        if (rows.length === 0) continue;

        const lowerSheet = sheetName.toLowerCase();
        if (lowerSheet.includes('منتج') || lowerSheet.includes('مخزون') || lowerSheet.includes('صنف') || lowerSheet.includes('أصناف') || lowerSheet.includes('product') || lowerSheet.includes('item')) {
          prodCount += rows.length;
          if (sampleRows.length < 5) sampleRows.push(...rows.slice(0, 5 - sampleRows.length));
        } else if (lowerSheet.includes('عميل') || lowerSheet.includes('عملاء') || lowerSheet.includes('زبون') || lowerSheet.includes('زبائن') || lowerSheet.includes('customer') || lowerSheet.includes('debt')) {
          custCount += rows.length;
        } else if (lowerSheet.includes('مورد') || lowerSheet.includes('موردين') || lowerSheet.includes('supplier')) {
          suppCount += rows.length;
        } else if (lowerSheet.includes('مصروف') || lowerSheet.includes('مصاريف') || lowerSheet.includes('expense')) {
          expCount += rows.length;
        } else {
          // Check columns of generic sheet
          const sample = rows[0] || {};
          const keysStr = Object.keys(sample).join(' ').toLowerCase();
          if (keysStr.includes('سعر') || keysStr.includes('price') || keysStr.includes('صنف') || keysStr.includes('كمية') || keysStr.includes('مخزون')) {
            prodCount += rows.length;
            if (sampleRows.length < 5) sampleRows.push(...rows.slice(0, 5 - sampleRows.length));
          } else if (keysStr.includes('عميل') || keysStr.includes('زبون') || keysStr.includes('customer') || keysStr.includes('دين')) {
            custCount += rows.length;
          } else if (keysStr.includes('مورد') || keysStr.includes('supplier')) {
            suppCount += rows.length;
          }
        }
      }

      setFilePreview({
        sheetNames: workbook.SheetNames,
        productsCount: prodCount,
        customersCount: custCount,
        suppliersCount: suppCount,
        expensesCount: expCount,
        sampleRows
      });
      showNotification?.(`تم التعرف على ملف الإكسل (${workbook.SheetNames.length} ورقات عمل).`, 'success');
    } catch (err: any) {
      showNotification?.('تعذر قراءة محتوى ملف الإكسل: ' + err.message, 'error');
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  // Execute smart import from selected file
  const handleExecuteImport = async () => {
    if (!selectedFile) return;
    setIsExecutingImport(true);

    try {
      if (importMode === 'replace') {
        const confirmed = window.confirm('⚠️ تحذير: الاستبدال الكامل سيقوم بمسح المنتجات والعملاء الحاليين واستبدالهم بما في الملف. هل تود المتابعة؟');
        if (!confirmed) {
          setIsExecutingImport(false);
          return;
        }
        await db.products.clear();
        await db.customers.clear();
        await db.suppliers.clear();
      }

      const res = await importExcelBackupManual(selectedFile);
      setSyncResult(res);
      showNotification?.(`تم استيراد الملف بنجاح! (+${res.addedProducts} منتج جديد، ${res.updatedProducts} محدث، +${res.addedCustomers} عميل، +${res.addedSuppliers} مورد).`, 'success');
      setSelectedFile(null);
      setFilePreview(null);
      onImportSuccess?.();
    } catch (err: any) {
      showNotification?.(err.message || 'حدث خطأ أثناء استيراد ملف الإكسل', 'error');
    } finally {
      setIsExecutingImport(false);
    }
  };

  // Download Individual Template Helper
  const handleDownloadCustomTemplate = (type: 'all' | 'products' | 'customers' | 'suppliers' | 'expenses') => {
    try {
      const wb = XLSX.utils.book_new();
      const rtlView = [{ Reels: { RightToLeft: true } }];

      if (type === 'products' || type === 'all') {
        const sampleProducts = [
          { 'اسم المنتج': 'سكر البادية 5 كجم', 'القسم / التصنيف': 'مواد غذائية', 'الباركود': '628100010001', 'سعر التكلفة': 20, 'سعر البيع': 25, 'الكمية الحالية': 50, 'الوحدة': 'كيس', 'تاريخ الصلاحية': '2026-12-31' },
          { 'اسم المنتج': 'زيت عافية 1.5 لتر', 'القسم / التصنيف': 'زيوت', 'الباركود': '628100010002', 'سعر التكلفة': 14, 'سعر البيع': 18, 'الكمية الحالية': 30, 'الوحدة': 'حبة', 'تاريخ الصلاحية': '2026-10-15' },
          { 'اسم المنتج': 'أرز بسمتي الشعلان 10 كجم', 'القسم / التصنيف': 'أرز وحبوب', 'الباركود': '628100010003', 'سعر التكلفة': 65, 'سعر البيع': 78, 'الكمية الحالية': 20, 'الوحدة': 'كيس', 'تاريخ الصلاحية': '2027-05-01' }
        ];
        const ws = XLSX.utils.json_to_sheet(sampleProducts);
        ws['!views'] = rtlView as any;
        XLSX.utils.book_append_sheet(wb, ws, 'المنتجات_المخزون');
      }

      if (type === 'customers' || type === 'all') {
        const sampleCustomers = [
          { 'اسم العميل': 'محمد علي السالم', 'رقم الجوال': '0551234567', 'الرصيد الحالي (الدين المترتب)': 150, 'ملاحظات': 'حساب جاري شهري' },
          { 'اسم العميل': 'سالم صالح النهدي', 'رقم الجوال': '0509876543', 'الرصيد الحالي (الدين المترتب)': 0, 'ملاحظات': 'عميل نقدي دائم' }
        ];
        const ws = XLSX.utils.json_to_sheet(sampleCustomers);
        ws['!views'] = rtlView as any;
        XLSX.utils.book_append_sheet(wb, ws, 'العملاء_والديون');
      }

      if (type === 'suppliers' || type === 'all') {
        const sampleSuppliers = [
          { 'اسم المورد': 'شركة البركة للتجارة والتوريد', 'رقم الهاتف': '0112345678', 'الرصيد المستحق لهم': 2500, 'ملاحظات': 'مورد زيوت ومعلبات' },
          { 'اسم المورد': 'مؤسسة الأمل للمواد الغذائية', 'رقم الهاتف': '0119876543', 'الرصيد المستحق لهم': 0, 'ملاحظات': 'مندوب: فهد' }
        ];
        const ws = XLSX.utils.json_to_sheet(sampleSuppliers);
        ws['!views'] = rtlView as any;
        XLSX.utils.book_append_sheet(wb, ws, 'الموردين_والحسابات');
      }

      if (type === 'expenses' || type === 'all') {
        const sampleExpenses = [
          { 'بيان المصروف': 'إيجار المحل لشهر الحالي', 'التصنيف': 'إيجار', 'المبلغ': 50000, 'تاريخ الصرف': new Date().toISOString().slice(0, 10), 'طريقة الدفع': 'نقداً من الصندوق', 'ملاحظات': 'سداد كامل الإيجار' },
          { 'بيان المصروف': 'فاتورة الكهرباء والماء', 'التصنيف': 'فواتير ومرافق', 'المبلغ': 12000, 'تاريخ الصرف': new Date().toISOString().slice(0, 10), 'طريقة الدفع': 'نقداً من الصندوق', 'ملاحظات': '' }
        ];
        const ws = XLSX.utils.json_to_sheet(sampleExpenses);
        ws['!views'] = rtlView as any;
        XLSX.utils.book_append_sheet(wb, ws, 'المصروفات_التشغيلية');
      }

      const fileName = type === 'all' 
        ? `قالب_إكسل_محاسبي_شامل_${new Date().toISOString().slice(0, 10)}.xlsx`
        : `قالب_استيراد_${type === 'products' ? 'المنتجات' : type === 'customers' ? 'العملاء' : type === 'suppliers' ? 'الموردين' : 'المصروفات'}.xlsx`;

      XLSX.writeFile(wb, fileName);
      showNotification?.(`تم تحميل ${fileName} بنجاح!`, 'success');
    } catch (err: any) {
      showNotification?.('فشل تحميل القالب: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Local-first Assurance */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800">إدارة Excel المحلية المتقدمة</span>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                محلي 100% أوفلاين (بدون إنترنت)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              استيراد فوري ذكي لأي شيت إكسل، ربط حي بالملفات، تصدير كامل بنقرة واحدة، دون الحاجة للإنترنت.
            </p>
          </div>
        </div>

        {onOpenExcelSyncCenter && (
          <Button
            onClick={onOpenExcelSyncCenter}
            variant="outline"
            className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 py-2 px-3 self-start sm:self-auto cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>فتح نافذة مركز المزامنة المنبثقة</span>
          </Button>
        )}
      </div>

      {/* Main Grid: Live Sync & Fast Excel Importer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Live Bi-directional Sync */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">المزامنة الحية المباشرة (Excel Live-Sync)</h3>
                  <p className="text-[11px] text-slate-400">ربط ملف إكسل محلي على قرص جهازك ليتحدث تلقائياً</p>
                </div>
              </div>
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                isLinked 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isLinked ? '● متصل ومقترن' : 'غير مقترن'}
              </span>
            </div>

            {/* Connection Info */}
            {isLinked ? (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">الملف المقترن بالجهاز:</span>
                  <span className="font-black text-emerald-800 dir-ltr text-left max-w-[200px] truncate">{fileName || 'ملف إكسل'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">آخر مزامنة ناجحة:</span>
                  <span className="font-bold text-slate-700">{lastSync || 'الآن'}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-emerald-100/60">
                  أي فاتورة جديدة أو تعديل بالمخزون ينعكس على ملفك، وأي تعديل تفتحه في Excel يمكنك مزامنته فوراً.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 space-y-2">
                <div className="flex items-start gap-2">
                  <HardDrive className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    قم بربط ملف Excel موجود على حاسوبك أو لابتوبك ليتم حفظ وتحديث كافة المبيعات والمخزون والعملاء فيه مباشرة وبشكل دائم.
                  </p>
                </div>
                {!isSupported && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ملاحظة: متصفحك الحالي لا يدعم نظام File System Access. يمكنك استخدام التصدير والاستيراد اليدوي أدناه بسلاسة تامة.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {isLinked ? (
              <>
                <Button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة فورية الآن 🔄'}</span>
                </Button>
                <Button
                  onClick={handleUnlink}
                  disabled={isSyncing}
                  variant="outline"
                  className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 py-2.5 cursor-pointer"
                >
                  إلغاء الربط
                </Button>
              </>
            ) : (
              <Button
                onClick={handleLinkFile}
                disabled={isSyncing || !isSupported}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <HardDrive className="w-4 h-4" />
                <span>ربط ملف إكسل محلي من جهازك 🔗</span>
              </Button>
            )}
          </div>
        </div>

        {/* Card 2: Smart Excel File Importer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">الاستيراد الذكي لأي ملف Excel</h3>
                  <p className="text-[11px] text-slate-400">يدعم أي ملف أو شيت أو صيغة (.xlsx, .xls, .csv)</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                التعرف الذكي التلقائي
              </span>
            </div>

            {/* Drag & Drop Area */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInputChange} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />

            {!selectedFile ? (
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  dragOver 
                    ? 'border-indigo-500 bg-indigo-50/60' 
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-xs text-slate-800">اسحب وأفلت أي ملف إكسل هنا، أو انقر للاختيار</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">يكتشف تلقائياً الأعمدة والشيتات (منتجات، عملاء، موردين)</p>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span className="font-black text-xs text-indigo-900 truncate max-w-[220px]">{selectedFile.name}</span>
                  </div>
                  <button 
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isAnalyzingFile ? (
                  <div className="text-center py-2 text-xs text-indigo-600 font-bold animate-pulse flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري تحليل شيتات وأعمدة الملف...</span>
                  </div>
                ) : filePreview && (
                  <div className="space-y-2 text-[11px] bg-white/80 p-3 rounded-xl border border-indigo-100">
                    <p className="font-black text-slate-700">نتيجة التعرف التلقائي الذكي على البيانات:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                        <span className="text-emerald-800 font-bold">الأصناف المكتشفة:</span>
                        <span className="font-black text-emerald-900">{filePreview.productsCount}</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
                        <span className="text-blue-800 font-bold">العملاء والديون:</span>
                        <span className="font-black text-blue-900">{filePreview.customersCount}</span>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-between">
                        <span className="text-amber-800 font-bold">الموردين:</span>
                        <span className="font-black text-amber-900">{filePreview.suppliersCount}</span>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-lg border border-purple-100 flex items-center justify-between">
                        <span className="text-purple-800 font-bold">المصروفات:</span>
                        <span className="font-black text-purple-900">{filePreview.expensesCount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Import Mode Selector */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setImportMode('merge')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      importMode === 'merge'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    دمج ذكي وتحديث (Smart Merge)
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      importMode === 'replace'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    استبدال كامل (Replace)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          {selectedFile && (
            <Button
              onClick={handleExecuteImport}
              disabled={isExecutingImport || isAnalyzingFile}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isExecutingImport ? 'جاري الاستيراد والتطبيق...' : 'حفظ وتطبيق البيانات في قاعدة البيانات الآن 🚀'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sync Result Summary Banner */}
      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-black text-xs text-emerald-900">ملخص آخر عملية استيراد ومزامنة ناجحة:</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                الأصناف: (+{syncResult.addedProducts} جديد، {syncResult.updatedProducts} محدث) | 
                العملاء: (+{syncResult.addedCustomers} جديد، {syncResult.updatedCustomers} محدث) | 
                الموردين: (+{syncResult.addedSuppliers} جديد، {syncResult.updatedSuppliers} محدث)
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSyncResult(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Row: Full Excel Export & Pre-made Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Full Database Export to Excel */}
        <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl border border-emerald-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-800">تصدير كامل قاعدة البيانات إلى Excel (.xlsx)</h3>
                <p className="text-[11px] text-slate-500">كافة السجلات المالية في ملف واحد منسق متعدد الأوراق</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              تحميل ملف إكسل شامل يحتوي على أوراق عمل مخصصة: الملخص المالي العام، المخزون والأسعار، سجل العملاء والديون، الموردين، والمصروفات. جاهز للأرشفة والطباعة.
            </p>
          </div>

          <Button
            onClick={handleExportFullDatabase}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>تصدير وتحميل ملف Excel الشامل الآن 📁</span>
          </Button>
        </div>

        {/* Ready-made Excel Templates Downloads */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-slate-800">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-800">تحميل قوالب Excel النموذجية الجاهزة</h3>
                <p className="text-[11px] text-slate-400">ملفات نموذجية منسقة لتعبئتها واستيرادها بسهولة</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              اختر القالب المطلوب لتنزيل ملف إكسل يحتوي على أسماء الأعمدة الصحيحة ونماذج بيانات استرشادية:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={() => handleDownloadCustomTemplate('products')}
              className="p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>قالب المنتجات 📦</span>
            </button>
            <button
              onClick={() => handleDownloadCustomTemplate('customers')}
              className="p-2.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>قالب العملاء 👥</span>
            </button>
            <button
              onClick={() => handleDownloadCustomTemplate('suppliers')}
              className="p-2.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 hover:border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>قالب الموردين 🚚</span>
            </button>
            <button
              onClick={() => handleDownloadCustomTemplate('expenses')}
              className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>قالب المصروفات 💸</span>
            </button>
          </div>
          <button
            onClick={() => handleDownloadCustomTemplate('all')}
            className="w-full mt-2 p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>تحميل القالب المحاسبي الشامل المتكامل (All In One) 👑</span>
          </button>
        </div>

      </div>
    </div>
  );
};
