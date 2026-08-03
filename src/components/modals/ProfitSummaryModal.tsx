import React from 'react';
import { motion } from 'motion/react';
import { PieChart, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ProfitSummaryModalProps {
  showProfitSummaryModal: boolean;
  setShowProfitSummaryModal: (show: boolean) => void;
  summary: {
    totalProfit?: number;
    expectedRemainingProfit?: number;
  };
  formatPrice: (amount: number) => string;
}

export const ProfitSummaryModal: React.FC<ProfitSummaryModalProps> = ({
  showProfitSummaryModal,
  setShowProfitSummaryModal,
  summary,
  formatPrice,
}) => {
  if (!showProfitSummaryModal) return null;

  return (
    <div key="modal-profit-summary" className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 text-white w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-slate-800"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/20 animate-pulse">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">تفاصيل وتحليل الأرباح</h3>
              <p className="text-xs text-slate-400 font-bold">تحليل دقيق لصافي أرباح المتجر المحققة فعلياً والتوقعات المستقبلية</p>
            </div>
          </div>
          <button onClick={() => setShowProfitSummaryModal(false)} className="p-2.5 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* --- Section: Profit Projections --- */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              تحليل الأرباح الاستثمارية الصافية
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1 hover:border-emerald-500/30 hover:bg-slate-850 transition-all text-right">
                <p className="text-[10px] text-emerald-400 font-extrabold">صافي الأرباح المحققة</p>
                <p className="text-xl font-black font-mono text-emerald-350">{formatPrice(summary.totalProfit ?? 0)}</p>
                <p className="text-[9px] text-slate-400 font-bold leading-tight pt-1">
                  الأرباح الحقيقية المجناة والداخلة فعلياً في الصندوق بعد خصم رأس المال (التكلفة)
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1 hover:border-rose-500/30 hover:bg-slate-850 transition-all text-right">
                <p className="text-[10px] text-rose-400 font-extrabold">الربح المتوقع للمخزون المتبقي</p>
                <p className="text-xl font-black font-mono text-rose-300">{formatPrice(summary.expectedRemainingProfit ?? 0)}</p>
                <p className="text-[9px] text-slate-400 font-bold leading-tight pt-1">
                  هامش الأرباح المنتظر والتقديري عند تصريف كل القطع المتبقية بالرفوف
                </p>
              </div>

              {/* Highlight summary banner with sleek premium design */}
              <div className="sm:col-span-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/40 p-5 rounded-[2rem] flex justify-between items-center transition-all shadow-md text-right relative overflow-hidden">
                <div className="absolute -left-4 -bottom-4 opacity-10">
                  <Sparkles className="w-32 h-32 text-emerald-400" />
                </div>
                <div className="relative z-10 space-y-1">
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-black px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs">إسقاط بيعي متوقع</span>
                  <p className="text-xs text-slate-200 font-black pt-2">إجمالي الأرباح الكلية المتوقعة</p>
                  <p className="text-[9px] text-slate-400 font-bold">المجموع المقدر (الأرباح المحققة جراء البيع + ربح المتبقي) بعد نفاذ البضاعة</p>
                </div>
                <div className="relative z-10 text-left">
                  <p className="text-[10px] text-emerald-400 font-bold">الربح الإجمالي المرتقب</p>
                  <p className="text-2xl font-black font-mono text-emerald-400">
                    {formatPrice((summary.totalProfit ?? 0) + (summary.expectedRemainingProfit ?? 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-800">
          <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors" onClick={() => setShowProfitSummaryModal(false)}>إغلاق النافذة</Button>
        </div>
      </motion.div>
    </div>
  );
};
