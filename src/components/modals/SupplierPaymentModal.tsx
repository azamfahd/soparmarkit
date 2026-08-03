import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SupplierPaymentModalProps {
  showSupplierPaymentModal: any;
  setShowSupplierPaymentModal: (val: any) => void;
  handleSupplierPayment: (data: any, resetForm: () => void) => void;
  formatPrice: (amount: number) => string;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  showSupplierPaymentModal,
  setShowSupplierPaymentModal,
        handleSupplierPayment,
  formatPrice,
}) => {

  const [supplierPaymentAmount, setSupplierPaymentAmount] = useState('');
  const [supplierPaymentNotes, setSupplierPaymentNotes] = useState('');

  const handleSave = () => {
    handleSupplierPayment(
      { supplierPaymentAmount, supplierPaymentNotes },
      () => {
        setSupplierPaymentAmount('');
        setSupplierPaymentNotes('');
      }
    );
  };

  if (!showSupplierPaymentModal) return null;

  return (
    <div key="modal-supplier-payment" className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl relative text-right"
        dir="rtl"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <Wallet className="w-6 h-6 text-amber-600" />
          </div>
          <button onClick={() => setShowSupplierPaymentModal(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div>
          <h3 className="text-xl font-black text-slate-800">تسديد مبلغ للمورد</h3>
          <p className="text-sm text-slate-500 font-bold">تسجيل دفعة نقدية لتصفية حساب {showSupplierPaymentModal.name}</p>
        </div>

        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
          <p className="text-[10px] text-amber-600 font-bold uppercase mb-1">إجمالي المستحق حالياً</p>
          <p className="text-xl font-black font-mono text-amber-900">{formatPrice(showSupplierPaymentModal.balance)}</p>
        </div>

        <div className="space-y-4">
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block pr-1">المبلغ المراد تسديده :</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={supplierPaymentAmount}
                onChange={(e) => setSupplierPaymentAmount(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-center text-2xl font-black text-emerald-700 focus:border-emerald-500 outline-none transition-all"
              />
           </div>
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block pr-1">ملاحظات (اختياري) :</label>
              <textarea 
                placeholder="اكتب تفاصيل الدفعة أو رقم السند..." 
                value={supplierPaymentNotes}
                onChange={(e) => setSupplierPaymentNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl h-20 text-sm outline-none focus:border-emerald-500 resize-none transition-all"
              />
           </div>
           <Button className="w-full py-4 rounded-2xl text-lg font-black shadow-lg shadow-emerald-500/20" onClick={handleSave}>
             تأكيد التسديد وحفظ
           </Button>
        </div>
      </motion.div>
    </div>
  );
};
