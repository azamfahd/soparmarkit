import React from 'react';
import { motion } from 'motion/react';
import { PieChart, Sparkles, X, TrendingDown, ArrowUpRight, DollarSign, Wallet } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ProfitSummaryModalProps {
  showProfitSummaryModal: boolean;
  setShowProfitSummaryModal: (show: boolean) => void;
  summary: {
    totalProfit?: number; // Gross margin from sales
    expectedRemainingProfit?: number;
    expensesTotal?: number; // Total operating expenses
    totalSalesRevenue?: number;
  };
  formatPrice: (amount: number) => string;
  onOpenExpensesModal?: () => void;
}

export const ProfitSummaryModal: React.FC<ProfitSummaryModalProps> = ({
  showProfitSummaryModal,
  setShowProfitSummaryModal,
  summary,
  formatPrice,
  onOpenExpensesModal,
}) => {
  if (!showProfitSummaryModal) return null;

  const grossProfit = summary.totalProfit ?? 0;
  const expenses = summary.expensesTotal ?? 0;
  const netProfit = grossProfit - expenses;
  const remainingExpected = summary.expectedRemainingProfit ?? 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 text-white w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-slate-800"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/20">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">التحليل المالي وصافي الأرباح</h3>
              <p className="text-xs text-slate-400 font-bold">حساب مجمل الأرباح والمصروفات التشغيلية وصافي الربح الفعلي الحقيقي</p>
            </div>
          </div>
          <button onClick={() => setShowProfitSummaryModal(false)} className="p-2.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Main Net Profit Highlight Card */}
          <div className={`p-5 rounded-3xl border transition-all text-right relative overflow-hidden ${
            netProfit >= 0 
              ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-900/60 border-emerald-500/40 shadow-xl' 
              : 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-rose-900/60 border-rose-500/40 shadow-xl'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                  netProfit >= 0 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {netProfit >= 0 ? 'صافي الربح الفعلي الحقيقي (Net Profit)' : 'عجز مؤقت بعد احتساب المصروفات'}
                </span>
                <h4 className="text-xs text-slate-300 font-bold mt-2">
                  الناتج بعد خصم تكلفة البضاعة وكافة المصروفات التشغيلية
                </h4>
              </div>
              <div className="text-left">
                <p className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatPrice(netProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Three Key Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Gross Profit */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1 text-right">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-emerald-400 font-extrabold">مجمل ربح المبيعات</p>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-lg font-black font-mono text-emerald-300">{formatPrice(grossProfit)}</p>
              <p className="text-[9px] text-slate-400 font-medium">سعر البيع ناقص سعر التكلفة</p>
            </div>

            {/* 2. Operational Expenses */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1 text-right">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-rose-400 font-extrabold">المصروفات التشغيلية</p>
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-lg font-black font-mono text-rose-300">{formatPrice(expenses)}</p>
              <p className="text-[9px] text-slate-400 font-medium">إيجارات، كهرباء، رواتب، نثريات</p>
            </div>

            {/* 3. Expected Remaining */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1 text-right">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-amber-400 font-extrabold">ربح المخزون المتبقي</p>
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-lg font-black font-mono text-amber-300">{formatPrice(remainingExpected)}</p>
              <p className="text-[9px] text-slate-400 font-medium">الربح المتوقع عند بيع البضاعة المتبقية</p>
            </div>
          </div>

          {/* Action Row: Expenses Management Button */}
          {onOpenExpensesModal && (
            <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-200">إدارة وتسجيل المصروفات التشغيلية</p>
                <p className="text-[10px] text-slate-400">سجل الإيجارات، الفواتير، ونفقات المحل للحصول على دقة تامة في الأرباح</p>
              </div>
              <Button
                onClick={() => {
                  setShowProfitSummaryModal(false);
                  onOpenExpensesModal();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5"
              >
                <TrendingDown className="w-4 h-4" />
                <span>إدارة المصروفات</span>
              </Button>
            </div>
          )}

          {/* Projection Banner */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex justify-between items-center text-right">
            <div className="space-y-0.5">
              <span className="text-[9px] bg-slate-700 text-slate-300 font-black px-2.5 py-0.5 rounded-full">إجمالي الربح التقديري الكامل</span>
              <p className="text-xs text-slate-300 font-black pt-1">صافي الربح الفعلي + ربح البضاعة المتبقية في المخزن</p>
            </div>
            <div className="text-left">
              <p className="text-xl font-black font-mono text-emerald-400">
                {formatPrice(netProfit + remainingExpected)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-800">
          <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md bg-slate-800 text-white hover:bg-slate-700 transition-colors" onClick={() => setShowProfitSummaryModal(false)}>
            إغلاق التحليل
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
