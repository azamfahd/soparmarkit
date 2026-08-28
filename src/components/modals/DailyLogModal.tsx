import React from 'react';
import { motion } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DailyLogModalProps {
  showDailyLogModal: boolean;
  setShowDailyLogModal: (show: boolean) => void;
  dailySalesBreakdown: any[];
  formatPrice: (amount: number) => string;
}

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  showDailyLogModal,
  setShowDailyLogModal,
  dailySalesBreakdown,
  formatPrice,
}) => {
  if (!showDailyLogModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-6xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md shadow-indigo-500/10">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">السجل اليومي</h3>
              <p className="text-xs text-slate-500 font-bold">تفاصيل الحركة اليومية والمبيعات</p>
            </div>
          </div>
          <button onClick={() => setShowDailyLogModal(false)} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-150/55 rounded-2xl shadow-2xs">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="p-3">تاريخ الحركة</th>
                <th className="p-3 text-center">الفواتير</th>
                <th className="p-3">كاش</th>
                <th className="p-3">آجل</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3 text-amber-700">التكلفة</th>
                <th className="p-3 text-emerald-800">الأرباح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailySalesBreakdown.map((day, idx) => (
                <tr key={`daily-log-row-${day.dateStr ?? idx}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-black text-slate-800 font-mono text-[13px]">{day.dateStr}</td>
                  <td className="p-3 text-center font-bold text-slate-600">{day.count}</td>
                  <td className="p-3 font-bold text-slate-650 font-mono">{formatPrice(day.cashAmount)}</td>
                  <td className="p-3 font-bold text-amber-600 font-mono">{formatPrice(day.debtAmount)}</td>
                  <td className="p-3 font-black text-indigo-600 font-mono text-[13px]">{formatPrice(day.totalAmount)}</td>
                  <td className="p-3 font-black text-amber-700 font-mono">{formatPrice(day.cost)}</td>
                  <td className="p-3 font-extrabold text-emerald-700 font-mono">{formatPrice(day.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <Button className="w-full py-3 rounded-2xl text-sm font-extrabold" onClick={() => setShowDailyLogModal(false)}>إغلاق</Button>
        </div>
      </motion.div>
    </div>
  );
};
