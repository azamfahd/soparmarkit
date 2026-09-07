import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  HardDrive, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  Package, 
  Users, 
  Truck, 
  FileText, 
  DollarSign,
  Activity,
  Layers,
  ArrowRightLeft,
  FileSpreadsheet,
  FileJson,
  Wrench
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { db } from '../../db';
import { convertJsonDatabaseToExcel } from '../../services/dataSanitizer';
import { downloadWorkbook } from '../../utils/fileSaver';

interface DatabaseHubSectionProps {
  exportData?: () => void;
  importData?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportPython?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isBackupOverdue?: boolean;
  lastBackupDate?: string | null;
  backupAlertInterval?: string;
  updateBackupAlertInterval?: (interval: string) => void;
  isBackupSyncing?: boolean;
  isAutoBackupEnabled?: boolean;
  setIsAutoBackupEnabled?: (val: boolean) => void;
  autoBackupFileStatus?: { exists: boolean; lastModified?: string; size?: number; path?: string } | string | null;
  forceLocalDiskBackup?: () => Promise<void>;
  resetDatabase?: () => void;
  showNotification?: (msg: string, type?: 'success' | 'error') => void;
}

export const DatabaseHubSection: React.FC<DatabaseHubSectionProps> = ({
  exportData,
  importData,
  handleImportPython,
  isBackupOverdue,
  lastBackupDate,
  backupAlertInterval = '7',
  updateBackupAlertInterval,
  isBackupSyncing,
  isAutoBackupEnabled,
  setIsAutoBackupEnabled,
  autoBackupFileStatus,
  forceLocalDiskBackup,
  resetDatabase,
  showNotification
}) => {
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    suppliers: 0,
    invoices: 0,
    expenses: 0,
    categories: 0
  });

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isForcingBackup, setIsForcingBackup] = useState<boolean>(false);

  // Load database counts
  const refreshStats = async () => {
    try {
      const [pCount, cCount, sCount, iCount, eCount] = await Promise.all([
        db.products.count(),
        db.customers.count(),
        db.suppliers.count(),
        db.sales.count(),
        db.expenses.count()
      ]);
      setStats({
        products: pCount,
        customers: cCount,
        suppliers: sCount,
        invoices: iCount,
        expenses: eCount,
        categories: 0
      });
    } catch (err) {
      console.error('Failed to load DB stats:', err);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleForceDiskBackup = async () => {
    if (!forceLocalDiskBackup) return;
    setIsForcingBackup(true);
    try {
      await forceLocalDiskBackup();
      showNotification?.('تم الحفظ والتحديث الفوري على القرص بنجاح! 💾', 'success');
    } catch (err: any) {
      showNotification?.(err.message || 'تعذر الحفظ على القرص', 'error');
    } finally {
      setIsForcingBackup(false);
    }
  };

  const executeReset = async () => {
    if (!resetDatabase) return;
    setIsResetting(true);
    try {
      await resetDatabase();
      setShowResetConfirm(false);
      refreshStats();
    } catch (err: any) {
      showNotification?.(err.message || 'حدث خطأ أثناء التصفير', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConvertJsonToExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const wb = convertJsonDatabaseToExcel(jsonData);
      const fileName = `تحويل_نسخة_JSON_إلى_Excel_${new Date().toISOString().slice(0, 10)}.xlsx`;
      await downloadWorkbook(wb, fileName);
      showNotification?.('تم تحويل ملف JSON إلى مصنف Excel بنجاح وفتحه للحفظ 📊', 'success');
    } catch (err: any) {
      showNotification?.('فشل تحويل ملف JSON: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Offline & Data Privacy */}
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/5 border border-violet-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800">قاعدة البيانات والنسخ الاحتياطي المحلي</span>
              <span className="text-[10px] font-black bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full border border-violet-200">
                محلي 100% مشفر ومحمي
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              تخزين محلي فائق السرعة عبر محرك IndexedDB، مع إمكانية التصدير والاسترجاع الكامل لأي نسخة في أي وقت.
            </p>
          </div>
        </div>

        <button
          onClick={refreshStats}
          className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1.5 p-2 bg-violet-50 rounded-xl border border-violet-200 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تحديث الإحصائيات</span>
        </button>
      </div>

      {/* Database Statistics Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-sm text-slate-800">صحة وحجم السجلات المخزنة محلياً</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">IndexedDB Engine (Local Storage)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold">المنتجات</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-emerald-950">{stats.products}</p>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-bold">العملاء والديون</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-black text-blue-950">{stats.customers}</p>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-bold">الموردين</span>
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-black text-amber-950">{stats.suppliers}</p>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-bold">فواتير المبيعات</span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-indigo-950">{stats.invoices}</p>
          </div>

          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-xs font-bold">المصروفات</span>
              <DollarSign className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-black text-rose-950">{stats.expenses}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: JSON Backup/Restore & Automatic Local Disk Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: JSON Backup and Restore */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">النسخ الاحتياطي والاسترجاع (ملف JSON)</h3>
                  <p className="text-[11px] text-slate-400">تصدير قاعدة البيانات كاملة واستعادتها بضغطة زر</p>
                </div>
              </div>
              
              {isBackupOverdue && (
                <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>تأخر النسخ!</span>
                </span>
              )}
            </div>

            {/* Last Backup Info */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>آخر نسخة احتياطية:</span>
                </span>
                <span className="font-bold text-slate-700">{lastBackupDate || 'لم يتم تصدير نسخة بعد'}</span>
              </div>

              {/* Alert Interval Config */}
              {updateBackupAlertInterval && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-bold">تنبيه بالنسخ الاحتياطي كل:</span>
                  <select
                    value={backupAlertInterval}
                    onChange={(e) => updateBackupAlertInterval(e.target.value)}
                    aria-label="تحديد فترة تنبيه النسخ الاحتياطي"
                    className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="7">كل أسبوع (مستحسن)</option>
                    <option value="14">كل أسبوعين</option>
                    <option value="30">كل شهر</option>
                    <option value="60">كل شهرين</option>
                    <option value="disabled">معطل</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {exportData && (
              <Button
                onClick={exportData}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>تصدير نسخة JSON 📥</span>
              </Button>
            )}

            {importData && (
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>استرجاع ملف (JSON أو Excel) 📂</span>
                <input 
                  type="file" 
                  accept=".json,.xlsx,.xls" 
                  onChange={importData} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>

        {/* Card 2: JSON <-> Excel Conversion Tool */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 rounded-2xl border border-indigo-150 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">تحويل الصيغ أوفلاين (JSON ⇄ Excel)</h3>
                  <p className="text-[11px] text-slate-500">تحويل النسخ الاحتياطية وتدقيق البيانات فورياً</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                بدون إنترنت ⚡
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              تستطيع تحويل أي ملف نسخة احتياطية JSON إلى ملف إكسل منسق بصفحات متعددة (أصناف، عملاء، ديون، مبيعات)، أو استيراد ملف إكسل وتحويله تلقائياً لقاعدة بيانات النظام مع معالجة وتدقيق الأخطاء!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
              <span>تحويل ملف JSON إلى Excel 📊</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleConvertJsonToExcelFile} 
                className="hidden" 
              />
            </label>

            {importData && (
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs">
                <FileJson className="w-4 h-4" />
                <span>تحويل Excel واستيراده للنظام 📥</span>
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={importData} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>

        {/* Card 2: Local Disk Auto-Backup */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800">النسخ التلقائي المستمر للقرص</h3>
                  <p className="text-[11px] text-slate-400">حفظ تلقائي دوري وتحديث مستمر على القرص الصلب</p>
                </div>
              </div>

              {setIsAutoBackupEnabled && (
                <button
                  type="button"
                  onClick={() => setIsAutoBackupEnabled(!isAutoBackupEnabled)}
                  aria-label="تبديل تفعيل النسخ الاحتياطي التلقائي للقرص"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAutoBackupEnabled ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAutoBackupEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              )}
            </div>

            <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-3.5 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">حالة الحفظ التلقائي:</span>
                <span className={`font-black ${isAutoBackupEnabled ? 'text-teal-700' : 'text-slate-400'}`}>
                  {isAutoBackupEnabled ? '● نشط ويعمل في الخلفية' : 'متوقف'}
                </span>
              </div>
              {autoBackupFileStatus && (
                <div className="flex items-center justify-between border-t border-teal-100/60 pt-1.5">
                  <span className="text-slate-500 font-bold">الملف / المسار:</span>
                  <span className="font-mono text-[10px] text-teal-800 truncate max-w-[200px] dir-ltr text-left">
                    {typeof autoBackupFileStatus === 'string' 
                      ? autoBackupFileStatus 
                      : autoBackupFileStatus.path || (autoBackupFileStatus.exists ? 'قاعدة بيانات النظام (محفوظة)' : 'جاري التهيئة')}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 font-medium pt-1">
                يحافظ هذا الخيار على عدم ضياع أي فاتورة بيع أو تعديل في المخزون حتى في حال إعادة تشغيل الجهاز أو إغلاق التطبيق.
              </p>
            </div>
          </div>

          {/* Force Local Disk Backup Button */}
          {forceLocalDiskBackup && (
            <Button
              onClick={handleForceDiskBackup}
              disabled={isForcingBackup}
              variant="outline"
              className="w-full border-teal-300 text-teal-700 hover:bg-teal-50 text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isForcingBackup ? 'animate-spin' : ''}`} />
              <span>{isForcingBackup ? 'جاري الحفظ على القرص...' : 'تحديث وحفظ فوري لقاعدة البيانات على القرص 💾'}</span>
            </Button>
          )}
        </div>

      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="bg-gradient-to-br from-white to-rose-50/20 rounded-2xl border border-rose-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-800">منطقة الخطر: تصفير وإعادة ضبط قاعدة البيانات للمصنع</h3>
              <p className="text-[11px] text-slate-500">حذف كافة البيانات الممسوحة والبدء كلياً من جديد للمحل</p>
            </div>
          </div>

          <Button
            onClick={() => setShowResetConfirm(true)}
            variant="danger"
            className="text-xs font-black py-2.5 px-4 cursor-pointer self-start sm:self-auto shadow-xs"
          >
            إعادة ضبط المصنع وتصفير البيانات
          </Button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          ⚠️ يرجى الانتباه: هذا الإجراء سيقوم بحذف كافة السجلات المخزنة محلياً (المنتجات، فواتير المبيعات، كشوفات العملاء، وحسابات الموردين). نوصي دائماً بتصدير نسخة احتياطية (JSON أو Excel) قبل إجراء التصفير.
        </p>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-700 border-b border-rose-100 pb-3">
              <div className="p-2.5 bg-rose-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900">تأكيد إعادة ضبط المصنع الشامل</h4>
                <p className="text-xs text-rose-600 font-bold">هذا الإجراء نهائي ولا يمكن التراجع عنه</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد تماماً من رغبتك في حذف وتصفير قاعدة البيانات بالكامل؟ سيتم مسح كافة المنتجات والفواتير وحسابات العملاء للبدء من جديد.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="text-xs font-bold py-2 px-4 cursor-pointer"
              >
                إلغاء وتراجع
              </Button>
              <Button
                variant="danger"
                onClick={executeReset}
                disabled={isResetting}
                className="text-xs font-black py-2 px-4 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResetting ? 'جاري التصفير...' : 'نعم، قم بتصفير البيانات الآن'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
