import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface WithdrawModalProps {
  showWithdrawModal: boolean;
  setShowWithdrawModal: (val: boolean) => void;
  handleSaveWithdrawal: (data: any, resetForm: () => void) => void;
  currency: string;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  showWithdrawModal,
  setShowWithdrawModal,
              handleSaveWithdrawal,
  currency,
}) => {

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawByWhom, setWithdrawByWhom] = useState('');

  const handleSave = () => {
    handleSaveWithdrawal(
      { withdrawAmount, withdrawReason, withdrawByWhom },
      () => {
        setWithdrawAmount('');
        setWithdrawReason('');
        setWithdrawByWhom('');
      }
    );
  };

  if (!showWithdrawModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 text-right flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <button 
            onClick={() => { setShowWithdrawModal(false); }}
            className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20 rotate-3">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black">تسجيل مسحوبات / سلف نقدية</h3>
              <p className="text-indigo-100 text-[10px] mt-1 opacity-80">أوامر الصرف الشخصية والعهد المؤقتة للتسديد</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <div className="space-y-1.5 font-sans">
              <label className="text-[11px] font-black text-slate-500 block pr-1">المبلغ المطلوب سحبه (كاش):</label>
              <div className="relative group">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg font-mono focus:outline-none focus:ring-4 focus:ring-indigo-50 pl-16 text-slate-800 text-right transition-all focus:bg-white focus:border-indigo-300 shadow-xs" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-xs bg-indigo-50 px-2.5 py-1 rounded-xl">{currency}</span>
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label className="text-[11px] font-black text-slate-500 block pr-1">المستلم / الشخص المسؤول (لسحب الشطب):</label>
              <input 
                type="text" 
                placeholder="مثال: أحمد أمين الصندوق، أو مالك الحساب..." 
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all focus:bg-white focus:border-indigo-300 shadow-xs text-right" 
                value={withdrawByWhom} 
                onChange={e => setWithdrawByWhom(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5 font-sans">
              <label className="text-[11px] font-black text-slate-500 block pr-1">البيان / سبب السحب الشخصي:</label>
              <textarea
                rows={2}
                placeholder="مثال: سلفة نقدية طارئة، أو تغطية مصروف بضائع عاجل..." 
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all focus:bg-white focus:border-indigo-300 shadow-xs text-right" 
                value={withdrawReason} 
                onChange={e => setWithdrawReason(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 text-right">
            <Button 
              className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-50 rounded-2xl transition-all active:scale-[0.98]" 
              onClick={handleSave}
              disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || !withdrawReason.trim()}
            >
              تسجيل وسحب من الصندوق
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800"
              onClick={() => { setShowWithdrawModal(false); }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
