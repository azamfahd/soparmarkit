import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, RefreshCw, Download, Upload, CheckCircle2, 
  AlertCircle, X, Check, HardDrive, ArrowLeftRight, Clock,
  FileDown, Sparkles, HelpCircle, Layers, Database, ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  isFileSystemAccessSupported, 
  linkLocalExcelFile, 
  unlinkExcelFile, 
  getLinkedExcelHandle, 
  syncBidirectionalExcel, 
  downloadExcelBackupManual, 
  importExcelBackupManual, 
  downloadExcelTemplate,
  checkFileModifiedAndSync,
  SyncResult
} from '../../services/excelSync';
import { db } from '../../db';

interface ExcelSyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const ExcelSyncCenterModal: React.FC<ExcelSyncCenterModalProps> = ({
  isOpen,
  onClose,
  showNotification
}) => {
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'manual' | 'guide'>('live');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSupported = isFileSystemAccessSupported();

  // Load initial link status
  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      try {
        const nameRec = await db.settings.where('key').equals('excel_file_name').first();
        const syncRec = await db.settings.where('key').equals('excel_last_sync').first();
        const autoSyncRec = await db.settings.where('key').equals('excel_auto_sync_enabled').first();

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

        if (autoSyncRec !== undefined) {
          setAutoSyncEnabled(autoSyncRec.value !== false);
        }
      } catch (err) {
        console.error('Failed to load excel sync status:', err);
      }
    };

    checkStatus();
  }, [isOpen]);

  // Handle Link File
  const handleLink = async () => {
    try {
      setIsSyncing(true);
      const res = await linkLocalExcelFile();
      if (res) {
        setFileName(res.name);
        setIsLinked(true);
        showNotification(`تم ربط ملف الإكسل (${res.name}) بنجاح!`, 'success');
        
        // Immediate first sync
        const result = await syncBidirectionalExcel();
        setSyncResult(result);
        setLastSync(new Date().toISOString());
        showNotification('تمت أول مزامنة ثنائية مع الملف بنجاح!', 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'فشل في ربط ملف الإكسل', 'error');
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
      setSyncResult(null);
      showNotification('تم إلغاء ربط ملف الإكسل.', 'success');
    } catch (err: any) {
      showNotification('فشل إلغاء الربط: ' + err.message, 'error');
    }
  };

  // Handle Manual Trigger Sync
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      const result = await syncBidirectionalExcel();
      setSyncResult(result);
      setLastSync(new Date().toISOString());
      
      const totalChanges = 
        result.addedProducts + result.updatedProducts + 
        result.addedCustomers + result.updatedCustomers + 
        result.addedSuppliers + result.updatedSuppliers + 
        result.addedExpenses;

      if (totalChanges > 0) {
        showNotification(`تمت المزامنة بنجاح! (إجمالي التعديلات: ${totalChanges})`, 'success');
      } else {
        showNotification('تمت المزامنة! البيانات متطابقة تماماً ولا توجد فروقات جديدة.', 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'حدث خطأ أثناء المزامنة مع الإكسل', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Auto Sync
  const handleToggleAutoSync = async (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    await db.settings.put({ key: 'excel_auto_sync_enabled', value: enabled });
    showNotification(
      enabled ? 'تم تفعيل المزامنة التلقائية اللحظية.' : 'تم إيقاف المزامنة التلقائية.',
      'success'
    );
  };

  // Handle Manual File Upload
  const handleManualUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsSyncing(true);
      const res = await importExcelBackupManual(file);
      setSyncResult(res);
      showNotification(
        `تم استيراد الملف بنجاح! تم قيد (${res.addedProducts} صنف جديد، وتحديث ${res.updatedProducts} صنف، و ${res.addedExpenses} مصروف).`,
        'success'
      );
    } catch (err: any) {
      showNotification(err.message || 'فشل في استيراد ملف الإكسل', 'error');
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">مركز المزامنة مع Excel 📊</h2>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-emerald-50">
                  محلي 100%
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                ربط احترافي وتزامن فوري ثنائي الاتجاه بين النظام وملفات Excel بجهازك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'live' 
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>الربط المباشر اللحظي</span>
            {isLinked && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'manual' 
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>استيراد وتصدير يدوي</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'guide' 
                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>الصفحات والقوالب الجاهزة</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'live' && (
            <div className="space-y-4">
              {/* Status Box */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isLinked 
                  ? 'bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-emerald-200' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      isLinked ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-800 text-sm sm:text-base">
                          {isLinked ? 'ملف الإكسل مرتبط ومتزامن 🟢' : 'لا يوجد ملف Excel مرتبط حالياً'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {isLinked ? fileName : 'اربط ملف Excel من القرص الصلب لتفعيل المزامنة الفورية التلقائية'}
                      </p>
                    </div>
                  </div>

                  {isLinked && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        onClick={handleTriggerSync}
                        disabled={isSyncing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>مزامنة فورية الآن</span>
                      </Button>
                      <Button
                        onClick={handleUnlink}
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs py-2 px-3 rounded-xl font-bold"
                      >
                        إلغاء الربط
                      </Button>
                    </div>
                  )}
                </div>

                {isLinked && lastSync && (
                  <div className="mt-3 pt-3 border-t border-emerald-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>آخر مزامنة مكتملة:</span>
                      <strong className="font-mono text-slate-800">
                        {new Date(lastSync).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </strong>
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      تزامن ثنائي الاتجاه نشط
                    </span>
                  </div>
                )}
              </div>

              {/* Not Linked Callout */}
              {!isLinked && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-amber-900">
                        كيف تعمل ميزة الربط الاحترافي مع الإكسل؟
                      </h4>
                      <p className="text-xs text-amber-800/90 leading-relaxed mt-1">
                        تتيح لك هذه الميزة اختيار ملف Excel على جهازك. أي تعديل تجريه على أسعار أو كميات الأصناف في الإكسل وحفظه، سيتعرف عليه البرنامج فوراً ويحدث قاعدة بياناته، وكذلك أي عملية بيع أو إضافة في البرنامج تُحفظ وتُحدث في ملف الإكسل تلقائياً!
                      </p>
                    </div>
                  </div>

                  {isSupported ? (
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleLink}
                        disabled={isSyncing}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>اختيار وربط ملف Excel محلي</span>
                      </Button>
                      <Button
                        onClick={downloadExcelTemplate}
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <FileDown className="w-4 h-4 text-slate-500" />
                        <span>تحميل قالب Excel جاهز أولاً</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs text-amber-900">
                      ⚠️ متصفحك الحالي أو بيئة العمل لا تدعم واجهة الملفات المحلية المباشرة (File System Access API). يمكنك استخدام تبويب <strong>"استيراد وتصدير يدوي"</strong> بالأعلى لرفع وتنزيل ملفات الإكسل بكل سهولة.
                    </div>
                  )}
                </div>
              )}

              {/* Real-time sync options */}
              {isLinked && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                    خيارات المزامنة الذكية التلقائية
                  </h4>

                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/60 cursor-pointer hover:border-emerald-300 transition-all">
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-800 block">
                        المزامنة عند فحص الملف وملاحظة أي تعديل خارجي
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        يقوم البرنامج برصد حفظ الملف في برنامج Excel بالخلفية وتحديث الأصناف فوراً
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>
              )}

              {/* Sync Results Banner */}
              {syncResult && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تقرير آخر نتيجة مزامنة:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">أصناف جديدة</span>
                      <strong className="text-sm font-black text-emerald-700">{syncResult.addedProducts}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">أصناف محدثة</span>
                      <strong className="text-sm font-black text-blue-700">{syncResult.updatedProducts}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">عملاء وديون</span>
                      <strong className="text-sm font-black text-amber-700">
                        {syncResult.addedCustomers + syncResult.updatedCustomers}
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block">مصروفات تشغيلية</span>
                      <strong className="text-sm font-black text-rose-700">{syncResult.addedExpenses}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleManualUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  dragOver 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleManualUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="manual-excel-file-input"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-800">
                      اسحب وأفلت ملف إكسل هنا، أو اضغط للاختيار
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      يدعم ملفات (.xlsx أو .xls) مع صفحات المخزون والعملاء والمصروفات
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSyncing}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    استعراض الملفات
                  </Button>
                </div>
              </div>

              {/* Export and Template actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>تصدير نسخة Excel شاملة</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      تصدير كافة الأصناف، المبيعات، حسابات العملاء والموردين، المصروفات، والملخص المالي في ملف إكسل منظم.
                    </p>
                  </div>
                  <Button
                    onClick={downloadExcelBackupManual}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تنزيل ملف الإكسل الكامل</span>
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                      <FileDown className="w-4 h-4 text-blue-600" />
                      <span>تحميل قالب Excel جاهز وفارغ</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      قالب نظيف باللغة العربية مجهز برؤوس الأعمدة لتعبئة بيانات البضاعة والعملاء بسهولة ثم استيرادها.
                    </p>
                  </div>
                  <Button
                    onClick={downloadExcelTemplate}
                    variant="outline"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>تحميل القالب الجاهز</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <strong>💡 التوافق المحاسبي الكامل:</strong> يتعرف النظام تلقائياً على الصفحات التالية داخل ملف الإكسل عند الاستيراد والمزامنة:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>المنتجات_المخزون</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    اسم المنتج، الباركود، التصنيف، سعر التكلفة، سعر البيع، الكمية، الوحدة، وتاريخ الصلاحية.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>المصروفات_التشغيلية</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    بيان المصروف، المبلغ، التصنيف، تاريخ الصرف، طريقة الدفع، والملاحظات.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>العملاء_والديون</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    اسم العميل، رقم الهاتف، الرصيد المترتب، وتفاصيل الديون المسجلة.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    <span>الموردين_والحسابات</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    اسم المورد، الهاتف، ومستحقات الموردين لتسوية الحسابات التجارية.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>هل تريد تجربة القالب النموذجي مباشرة؟</span>
                <Button
                  onClick={downloadExcelTemplate}
                  className="text-xs py-1.5 px-3 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  تحميل القالب النموذجي
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>بياناتك تحفظ محلياً فقط ولا تُرفع لأي خادم خارجي</span>
          </div>

          <Button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs py-2 px-4 rounded-xl font-bold"
          >
            إغلاق النافذة
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
