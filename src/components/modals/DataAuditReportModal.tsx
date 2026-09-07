import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  X, 
  Sparkles, 
  FileText, 
  Database, 
  Check,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { AuditReport } from '../../services/dataSanitizer';

interface DataAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport | null;
  onComplete?: () => void;
}

export const DataAuditReportModal: React.FC<DataAuditReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onComplete
}) => {
  if (!isOpen || !report) return null;

  const handleFinish = () => {
    onClose();
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-150 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-indigo-50/30 to-violet-50/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100/90 text-emerald-700 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-right">
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  <span>تقرير الفحص والمعالجة الذاتية للبيانات</span>
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    محلي 100% ⚡
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  تم فحص الجداول، تصحيح الأنواع، وتصفية العيوب وتدقيق البيانات تلقائياً
                </p>
              </div>
            </div>
            <button
              onClick={handleFinish}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-right">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500">إجمالي السجلات التي تم فحصها</span>
                <span className="text-2xl font-black text-slate-800 mt-1">{report.totalRecordsProcessed}</span>
              </div>

              <div className={`p-3 border rounded-2xl flex flex-col justify-between ${
                report.totalFixesApplied > 0 
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}>
                <span className="text-xs font-bold flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>العيوب والتصحيحات الذكية</span>
                </span>
                <span className="text-2xl font-black mt-1">
                  {report.totalFixesApplied > 0 ? `${report.totalFixesApplied} تصحيح` : 'سليمة 100%'}
                </span>
              </div>
            </div>

            {/* Tables Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>ملخص السجلات المستوردة حسب الجداول:</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-600">
                {Object.entries(report.tablesSummary).map(([table, count]) => (
                  <div key={table} className="p-2 bg-slate-100/70 border border-slate-200/60 rounded-xl flex items-center justify-between">
                    <span className="text-slate-500">{table}:</span>
                    <span className="font-mono text-indigo-700 font-black">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Fixes Log */}
            {report.fixesDetails.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>تفاصيل المعالجة والحلول الذكية المطبقة:</span>
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-amber-50/40 border border-amber-200/70 rounded-2xl text-xs">
                  {report.fixesDetails.map((fix, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-amber-900 bg-white/80 p-2 rounded-xl border border-amber-100/80 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-[12px]">{fix.description}</p>
                        <p className="text-[10px] text-slate-500">
                          الجدول: <span className="font-bold text-slate-700">{fix.table}</span> ({fix.count} حالة)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings if any */}
            {report.warnings.length > 0 && (
              <div className="space-y-1.5 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900">
                <div className="flex items-center gap-1.5 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنبيهات وملاحظات محاسبية:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 font-medium">
                  {report.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clean Badge if no issues */}
            {report.totalFixesApplied === 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>البيانات ممتازة وخالية تماماً من العيوب والأخطاء! تم حفظها وتحديثها في نظامك بنجاح.</span>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              تم التخزين والحماية في ذاكرة الجهاز المحلية 100%
            </span>
            <Button
              onClick={handleFinish}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>موافق واعتماد البيانات</span>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
