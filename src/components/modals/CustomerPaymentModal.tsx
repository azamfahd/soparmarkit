import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, X, TrendingUp, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CustomerPaymentModalProps {
  showPaymentModal: any;
  setShowPaymentModal: (val: any) => void;
  handlePayment: (data: any, resetForm: () => void) => void;
  formatPrice: (amount: number) => string;
  currency: string;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  showPaymentModal,
  setShowPaymentModal,
        handlePayment,
  formatPrice,
  currency,
}) => {

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const handleSave = () => {
    handlePayment({ paymentAmount, paymentNotes }, () => {
        setPaymentAmount('');
      }
    );
  };

  if (!showPaymentModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 text-right flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          {/* Close Button */}
          <button 
            onClick={() => { setShowPaymentModal(null); setPaymentAmount(''); setPaymentNotes(''); }}
            className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black">
                {showPaymentModal.balance > 0 ? 'تسوية مديونية زبون' : 'إيداع دفعة مقدمة (شحن رصيد)'}
              </h3>
              <p className="text-indigo-100 text-[10px] mt-1 opacity-80">
                {showPaymentModal.balance > 0 ? 'تحصيل المبالغ وتحديث الأرصدة' : 'شحن رصيد الزبون لاستعماله في مشترياته اللاحقة'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Customer Info Card */}
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tight">الزبون</p>
              <p className="text-slate-800 font-black text-sm truncate">{showPaymentModal.name}</p>
            </div>
            {showPaymentModal.balance > 0 ? (
              <div className="flex-1 bg-red-50 p-3.5 rounded-2xl border border-red-100">
                <p className="text-[10px] text-red-600 font-bold mb-1 uppercase tracking-tight">الرصيد المستحق (دين)</p>
                <p className="text-red-700 font-black text-sm font-mono leading-tight">{formatPrice(showPaymentModal.balance)}</p>
              </div>
            ) : (
              <div className="flex-1 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
                <p className="text-[10px] text-emerald-600 font-bold mb-1 uppercase tracking-tight">
                  {showPaymentModal.balance < 0 ? 'رصيد دائن حالي (مقدّم)' : 'رصيد الحساب الحالي'}
                </p>
                <p className="text-emerald-700 font-black text-sm font-mono leading-tight">
                  {showPaymentModal.balance < 0 ? formatPrice(Math.abs(showPaymentModal.balance)) : '0 ر.س'}
                </p>
              </div>
            )}
          </div>

          {/* Payment Input Area */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 flex items-center gap-2 pr-1 flex-row-reverse justify-end">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>{showPaymentModal.balance > 0 ? 'المبلغ المسدد الآن:' : 'مبلغ الإيداع المقدم الآن:'}</span>
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl font-mono focus:outline-none focus:ring-4 focus:ring-indigo-50 pl-16 text-slate-800 border-2 border-slate-100 transition-all focus:bg-white focus:border-indigo-300 shadow-sm text-center" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  autoFocus
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl text-xs">{currency}</span>
              </div>
            </div>

            {showPaymentModal.balance > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount(String(showPaymentModal.balance));
                    setPaymentNotes('تصفير كامل الحساب وتصفية المديونية');
                  }}
                  className="py-3 px-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all font-bold text-[12px] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> تصفير كامل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount(String(Math.ceil(showPaymentModal.balance / 2)));
                    setPaymentNotes('سداد نصف الرصيد المتبقي');
                  }}
                  className="py-3 px-3 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all font-bold text-[12px] border-2 border-slate-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> سداد (٥٠٪)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount('50');
                    setPaymentNotes('إيداع سلفة / دفعة مقدّمة بقيمة 50');
                  }}
                  className="py-3 px-2 bg-emerald-50 text-emerald-750 hover:bg-emerald-100 rounded-xl transition-all font-extrabold text-[12px] border border-emerald-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                >
                  +50 {currency}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount('100');
                    setPaymentNotes('إيداع سلفة / دفعة مقدّمة بقيمة 100');
                  }}
                  className="py-3 px-2 bg-emerald-50 text-emerald-100 rounded-xl transition-all font-extrabold text-[12px] border border-emerald-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                >
                  +100 {currency}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentAmount('200');
                    setPaymentNotes('إيداع سلفة / دفعة مقدّمة بقيمة 200');
                  }}
                  className="py-3 px-2 bg-emerald-50 text-emerald-100 rounded-xl transition-all font-extrabold text-[12px] border border-emerald-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                >
                  +200 {currency}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-600 pr-1">البيان / ملاحظات:</label>
            <textarea 
              placeholder="اكتب أي ملاحظات هنا..." 
              className="w-full p-4 bg-slate-50 rounded-2xl text-xs text-slate-700 focus:outline-none border-2 border-slate-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all min-h-[80px] resize-none" 
              value={paymentNotes} 
              onChange={e => setPaymentNotes(e.target.value)} 
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-100 rounded-2xl transition-all active:scale-[0.98] cursor-pointer" 
              onClick={handleSave}
              disabled={!paymentAmount || Number(paymentAmount) <= 0}
            >
              {showPaymentModal.balance > 0 ? 'حفظ السداد وتحديث الحساب' : 'تأكيد شحن الحساب المقدم'}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800 cursor-pointer"
              onClick={() => { setShowPaymentModal(null); setPaymentAmount(''); setPaymentNotes(''); }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
