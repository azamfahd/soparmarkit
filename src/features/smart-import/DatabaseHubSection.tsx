import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Package, 
  Users, 
  Truck, 
  FileText, 
  DollarSign,
  Activity,
  FileSpreadsheet,
  Lock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { db } from '../../db';
import { downloadExcelBackupManual } from '../../services/excelSync';

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
  onOpenSecureExport?: () => void;
}

export const DatabaseHubSection: React.FC<DatabaseHubSectionProps> = ({
  exportData,
  importData,
  isBackupOverdue,
  lastBackupDate,
  backupAlertInterval = '7',
  updateBackupAlertInterval,
  showNotification,
  onOpenSecureExport
}) => {
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    suppliers: 0,
    invoices: 0,
    expenses: 0
  });
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Load database counts
  const refreshStats = async () => {
    try {
      const [pCount, cCount, sCount, iCount, eCount] = await Promise.all([
        db.products.count(),
        db.customers.count(),
        db.suppliers.count(),
        db.sales.count(),
        db.expenses ? db.expenses.count() : Promise.resolve(0)
      ]);
      setStats({
        products: pCount,
        customers: cCount,
        suppliers: sCount,
        invoices: iCount,
        expenses: eCount
      });
    } catch (err) {
      console.error('Failed to load DB stats:', err);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleExportExcelDirect = async () => {
    setIsExportingExcel(true);
    try {
      await downloadExcelBackupManual();
      showNotification?.('تم تصدير نسخة إكسل كاملة بنجاح وتحديث تاريخ النسخ الاحتياطي 📊', 'success');
    } catch (err: any) {
      console.error('Excel export failed:', err);
      showNotification?.('حدث خطأ أثناء تصدير ملف الإكسل', 'error');
    } finally {
      setIsExportingExcel(false);
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
              تخزين محلي فائق السرعة عبر محرك IndexedDB، مع إمكانية التصدير بتنسيقات JSON و Excel والمشفر برمز سري (AES-256).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSecureExport && (
            <button
              onClick={onOpenSecureExport}
              className="text-xs font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>تأمين النسخة برمز 🔒</span>
            </button>
          )}

          <button
            onClick={refreshStats}
            className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1.5 p-2 bg-violet-50 rounded-xl border border-violet-200 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>
        </div>
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

      {/* Main Unified Backup & Restore Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-800">النسخ الاحتياطي والاسترجاع (JSON / Excel / مشفر)</h3>
              <p className="text-[11px] text-slate-400">حفظ وتصدير قاعدة البيانات واسترجاعها بكافة التنسيقات بسهولة وأمان</p>
            </div>
          </div>
          
          {isBackupOverdue ? (
            <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>تأخر النسخ!</span>
            </span>
          ) : (
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>آمن ومحدث</span>
            </span>
          )}
        </div>

        {/* Last Backup Info & Alert Interval Setting */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>آخر نسخة احتياطية:</span>
            </span>
            <span className="font-bold text-slate-700">{lastBackupDate || 'لم يتم تصدير نسخة بعد'}</span>
          </div>

          {updateBackupAlertInterval && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-bold">تنبيه بالنسخ الاحتياطي كل:</span>
              <select
                value={backupAlertInterval}
                onChange={(e) => updateBackupAlertInterval(e.target.value)}
                aria-label="تحديد فترة تنبيه النسخ الاحتياطي"
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1 font-bold focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
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

        {/* Export & Import Action Buttons */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Secure Encrypted Export */}
            {onOpenSecureExport && (
              <Button
                onClick={onOpenSecureExport}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-emerald-800"
              >
                <Lock className="w-4 h-4" />
                <span>تصدير محمي برمز 🔐</span>
              </Button>
            )}

            {/* 2. Direct Excel Export */}
            <Button
              onClick={handleExportExcelDirect}
              disabled={isExportingExcel}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExportingExcel ? 'جاري التصدير...' : 'تصدير إكسل (Excel .xlsx) 📊'}</span>
            </Button>

            {/* 3. Fast Standard JSON Export */}
            {exportData && (
              <Button
                onClick={exportData}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-black py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>تصدير عادي (JSON) 📥</span>
              </Button>
            )}
          </div>

          {/* Import / Restore Button (Supports normal JSON, Encrypted backups, Excel) */}
          {importData && (
            <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>استرجاع ملف نسخة احتياطية (JSON أو Excel أو ملف مشفر) 📂</span>
              <input 
                type="file" 
                accept=".json,.xlsx,.xls,.smartpos,.doc" 
                onChange={importData} 
                className="hidden" 
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
