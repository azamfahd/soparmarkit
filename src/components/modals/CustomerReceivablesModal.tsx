import React from 'react';
import { motion } from 'motion/react';
import { X, Users } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CustomerReceivablesModalProps {
  showCustomerReceivablesModal: boolean;
  setShowCustomerReceivablesModal: (show: boolean) => void;
  customerSalesBreakdown: any[];
  formatPrice: (amount: number) => string;
  totalSales: number;
}

export const CustomerReceivablesModal: React.FC<CustomerReceivablesModalProps> = ({
  showCustomerReceivablesModal,
  setShowCustomerReceivablesModal,
  customerSalesBreakdown,
  formatPrice,
  totalSales,
}) => {
  if (!showCustomerReceivablesModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-7xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/10">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">ذمم العملاء</h3>
              <p className="text-xs text-slate-500 font-bold">تقرير شامل بأرصدة العملاء والديون المعلقة</p>
            </div>
          </div>
          <button onClick={() => setShowCustomerReceivablesModal(false)} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="p-3">اسم العميل</th>
                <th className="p-3">الفواتير</th>
                <th className="p-3">مسدد</th>
                <th className="p-3">دين</th>
                <th className="p-3">إجمالي</th>
                <th className="p-3 text-rose-700">رصيد متبقي</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerSalesBreakdown.map((cust, idx) => (
                <tr key={`cust-rec-${cust.id || idx}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-black text-slate-800">{cust.name}</td>
                  <td className="p-3 font-bold text-slate-600">{cust.count}</td>
                  <td className="p-3 font-bold text-slate-600">{formatPrice(cust.cashAmount)}</td>
                  <td className="p-3 font-bold text-amber-600">{formatPrice(cust.debtAmount)}</td>
                  <td className="p-3 font-black text-indigo-600">{formatPrice(cust.totalAmount)}</td>
                  <td className={`p-3 font-black ${cust.balance > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                    {formatPrice(cust.balance)}
                  </td>
                  <td className="p-3">
                    {cust.balance > 0 ? (
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black px-2 py-1 rounded-full">⚠️ مديون</span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full">✅ مسدد</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <Button className="w-full py-3 rounded-2xl text-sm font-extrabold" onClick={() => setShowCustomerReceivablesModal(false)}>إغلاق</Button>
        </div>
      </motion.div>
    </div>
  );
};
