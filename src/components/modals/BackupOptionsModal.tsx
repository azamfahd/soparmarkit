import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  FileSpreadsheet, 
  Database, 
  Upload, 
  X, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileJson
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { downloadExcelBackupManual } from '../../services/excelSync';

export interface BackupOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: () => void | Promise<void>;
  importData: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  handleImportPython?: () => void | Promise<void>;
  lastBackupDate: string | null;
  isBackupOverdue?: boolean;
  onOpenSmartImportHub?: () => void;
}

export const BackupOptionsModal: React.FC<BackupOptionsModalProps> = ({
  isOpen,
  onClose,
  exportData,
  importData,
  handleImportPython,
  lastBackupDate,
  isBackupOverdue = false,
  onOpenSmartImportHub,
}) => {
  if (!isOpen) return null;

  const handleExportExcel = async () => {
    try {
      await downloadExcelBackupManual();
    } catch (err) {
      console.error("Excel export error:", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-150 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-emerald-50/20">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${
                isBackupOverdue 
                  ? 'bg-rose-100 text-rose-600 animate-pulse' 
                  : 'bg-emerald-100/80 text-emerald-700'
              }`}>
                <Database className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  تصدير وحفظ النسخة الاحتياطية
                  {isBackupOverdue && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                      مطلوبة ⚠️
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  اختر التنسيق المناسب لحفظ أو تصدير بيانات متجرك محلياً 100%
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Overdue Warning */}
            {isBackupOverdue && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">لم تقم بحفظ نسخة احتياطية منذ فترة!</p>
                  <p className="text-[11px] text-amber-700">
                    يُنصح بتصدير نسخة احتياطية دورياً لضمان سلامة بيانات المبيعات، المخزون، والديون.
                  </p>
                </div>
              </div>
            )}

            {/* Last Backup Info */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-150/70 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                آخر نسخة احتياطية:
              </span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                {lastBackupDate 
                  ? new Date(lastBackupDate).toLocaleDateString('ar-EG', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : 'لم يتم أخذ نسخة حتى الآن'}
              </span>
            </div>

            {/* Main Export Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: JSON Full Backup */}
              <div className="p-4 rounded-2xl border-2 border-indigo-150 bg-gradient-to-b from-indigo-50/40 via-white to-white hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      الأشمل للاسترجاع
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">نسخة كاملة (JSON)</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                      النسخة الأصلية الشاملة لكافة المبيعات، المنتجات، الديون، والموردين. مناسبة للاسترجاع والنقل لجهاز آخر.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    exportData();
                    onClose();
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير نسخة JSON</span>
                </Button>
              </div>

              {/* Option 2: Excel Full Workbook */}
              <div className="p-4 rounded-2xl border-2 border-emerald-150 bg-gradient-to-b from-emerald-50/40 via-white to-white hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      للقراءة والطباعة
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">ملف إكسل (Excel .xlsx)</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                      مصنف إكسل احترافي يحتوي على صفحات منفصلة (الأصناف، المبيعات، العملاء، الموردين) للعرض والطباعة.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    handleExportExcel();
                    onClose();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير ملف Excel</span>
                </Button>
              </div>
            </div>

            {/* Quick Import Section */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>استرجاع نسخة احتياطية سابقة:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">ملفات .json فقط</span>
              </div>

              {window.pywebview && window.pywebview.api ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleImportPython?.();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-2 text-slate-700 border-slate-300 hover:bg-white"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>استيراد ملف نسخة احتياطية من الجهاز</span>
                </Button>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      importData(e);
                      onClose();
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5 text-xs py-2 text-slate-700 border-slate-300 hover:bg-white cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>اختيار واسترجاع ملف JSON من جهازك</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Hub link */}
            {onOpenSmartImportHub && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSmartImportHub();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 hover:border-violet-300 text-violet-800 transition-all text-xs font-bold cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>فتح مركز الاستيراد، مزامنة Excel، وقاعدة البيانات الشامل</span>
                </div>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              محلي 100% بدون إنترنت وأمان تام للبيانات
            </span>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-bold px-3 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
