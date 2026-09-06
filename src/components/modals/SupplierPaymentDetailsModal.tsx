import React from 'react';
import { motion } from 'motion/react';
import { FileText, X, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SupplierPaymentDetailsModalProps {
  selectedSupplierPayment: any;
  setSelectedSupplierPayment: (val: any) => void;
  formatPrice: (amount: number) => string;
  formatDateTimeWithDay: (dateStr: string) => string;
  onPrintVoucher?: (payment: any) => void;
}

export const SupplierPaymentDetailsModal: React.FC<SupplierPaymentDetailsModalProps> = ({
  selectedSupplierPayment,
  setSelectedSupplierPayment,
  formatPrice,
  formatDateTimeWithDay,
  onPrintVoucher,
}) => {
  if (!selectedSupplierPayment) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl relative text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
            <FileText className="w-6 h-6 text-emerald-600" />
          </div>
          <button onClick={() => setSelectedSupplierPayment(null)} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-black text-slate-800">تفاصيل دفعة سداد المورد</h3>
          <p className="text-xs text-slate-400 font-bold">مراجعة كاملة لبيانات وملاحظات الدفعة المالية للمورد بالتفصيل</p>
        </div>

        {/* Details Content */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 text-right">
            <span className="text-[11px] font-bold text-slate-400 block">اسم التاجر المورد</span>
            <span className="text-xs font-extrabold text-slate-800">{selectedSupplierPayment.supplier_name}</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 text-right">
            <span className="text-[11px] font-bold text-slate-400 block">تاريخ الدفعة والوقت</span>
            <span className="text-xs font-bold text-slate-700 font-mono">
              {selectedSupplierPayment.payment_date ? formatDateTimeWithDay(selectedSupplierPayment.payment_date) : 'غير متوفر'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 text-right">
            <span className="text-[11px] font-bold text-slate-400 block">المبلغ المدفوع</span>
            <span className="text-sm font-black text-emerald-700 font-mono">
              {formatPrice(selectedSupplierPayment.amount)}
            </span>
          </div>

          <div className="pt-1 text-right">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">الملاحظات والبيان المسجل</span>
            {selectedSupplierPayment.notes ? (
              <p className="text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-sans shadow-2xs whitespace-pre-line">
                {selectedSupplierPayment.notes}
              </p>
            ) : (
              <p className="text-xs italic text-slate-400 bg-white p-3 rounded-xl border border-slate-200">
                لا توجد ملاحظات مسجلة لهذه الدفعة.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onPrintVoucher && (
            <Button 
              className="flex-1 py-3 rounded-2xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => onPrintVoucher(selectedSupplierPayment)}
            >
              <Printer className="w-4 h-4" />
              <span>طباعة سند صرف</span>
            </Button>
          )}
          <Button 
            variant="secondary"
            className="flex-1 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors" 
            onClick={() => setSelectedSupplierPayment(null)}
          >
            إغلاق
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
