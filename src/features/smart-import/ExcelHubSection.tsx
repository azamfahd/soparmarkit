import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { downloadWorkbook } from '../../utils/fileSaver';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  ArrowLeftRight, 
  FileDown, 
  HardDrive, 
  ShieldCheck, 
  Layers, 
  X,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  isFileSystemAccessSupported, 
  linkLocalExcelFile, 
  unlinkExcelFile, 
  syncBidirectionalExcel, 
  downloadExcelBackupManual, 
  SyncResult 
} from '../../services/excelSync';
import { db } from '../../db';

interface ExcelHubSectionProps {
  showNotification?: (msg: string, type?: 'success' | 'error') => void;
  onOpenExcelSyncCenter?: () => void;
  onImportSuccess?: () => void;
  onOpenSecureExport?: () => void;
}

export const ExcelHubSection: React.FC<ExcelHubSectionProps> = ({
  showNotification,
  onOpenExcelSyncCenter,
  onImportSuccess,
  onOpenSecureExport
}) => {
  // Live Sync States
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

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

  // Download Individual Template Helper
  const handleDownloadCustomTemplate = async (type: 'all' | 'products' | 'customers' | 'suppliers' | 'expenses') => {
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

      await downloadWorkbook(wb, fileName);
      showNotification?.(`تم حفظ ${fileName} بنجاح!`, 'success');
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
              مزامنة حية مع ملفات الإكسل، تصدير كامل بنقرة واحدة، وقوالب محاسبية جاهزة دون الحاجة للإنترنت.
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

      {/* Main Card: Live Bi-directional Sync */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              onClick={handleExportFullDatabase}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>تصدير Excel عادي 📁</span>
            </Button>

            {onOpenSecureExport && (
              <Button
                onClick={onOpenSecureExport}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-emerald-700"
              >
                <Lock className="w-4 h-4 text-emerald-300" />
                <span>تصدير Excel محمي برمز 🔒</span>
              </Button>
            )}
          </div>
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
