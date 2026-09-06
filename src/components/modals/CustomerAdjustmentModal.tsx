import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings2, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CustomerAdjustmentModalProps {
  showCustomerAdjustmentModal: any;
  setShowCustomerAdjustmentModal: (val: any) => void;
  handleCustomerAdjustmentSubmit: (data: any, resetForm: () => void) => void;
  formatPrice: (amount: number) => string;
  currency: string;
}

export const CustomerAdjustmentModal: React.FC<CustomerAdjustmentModalProps> = ({
  showCustomerAdjustmentModal,
  setShowCustomerAdjustmentModal,
              handleCustomerAdjustmentSubmit,
  formatPrice,
  currency,
}) => {

  const [adjustmentType, setAdjustmentType] = useState<'note' | 'add_debt' | 'add_credit'>('note');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const handleSave = () => {
    handleCustomerAdjustmentSubmit({ adjustmentType, adjustmentAmount, adjustmentNotes }, () => {
        setAdjustmentType('note');
        setAdjustmentAmount('');
        setAdjustmentNotes('');
      }
    );
  };

  if (!showCustomerAdjustmentModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl relative text-right border border-slate-100"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 leading-tight">تعديل حساب الزبون</h3>
              <p className="text-sm font-bold text-slate-500">إضافة تعديلات أو ملاحظات استثنائية</p>
            </div>
          </div>
          <button 
            onClick={() => { setShowCustomerAdjustmentModal(null); setAdjustmentAmount(''); setAdjustmentNotes(''); setAdjustmentType('note'); }}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/60 shadow-inner flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase block mb-1">الزبون الحالي</p>
              <p className="text-slate-800 font-black text-sm truncate">{showCustomerAdjustmentModal.name}</p>
            </div>
            <div className="text-left bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                {showCustomerAdjustmentModal.balance > 0 ? 'عليه دين' : showCustomerAdjustmentModal.balance < 0 ? 'له رصيد' : 'رصيد مصفر'}
              </p>
              <p className="text-indigo-700 font-black text-sm font-mono leading-tight">{formatPrice(Math.abs(showCustomerAdjustmentModal.balance))}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-700 mb-2">نوع العملية / التعديل</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('note')}
                className={`py-3 px-2 rounded-2xl border transition-all text-xs font-bold ${adjustmentType === 'note' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                ملاحظة عامة
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('add_debt')}
                className={`py-3 px-2 rounded-2xl border transition-all text-xs font-bold ${adjustmentType === 'add_debt' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm ring-1 ring-red-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                زيادة المُديونية
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('add_credit')}
                className={`py-3 px-2 rounded-2xl border transition-all text-xs font-bold ${adjustmentType === 'add_credit' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm ring-1 ring-emerald-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                إضافة دائن / دفعة
              </button>
            </div>
          </div>

          {adjustmentType !== 'note' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <label className="block text-sm font-extrabold text-slate-700">المبلغ</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">{currency}</span>
                </div>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="w-full pr-14 pl-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-black focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left shadow-inner"
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-extrabold text-slate-700">ملاحظة أو بيان للعملية</label>
            <textarea
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
              placeholder="اكتب هنا (مثال: نقود باقية سابقة، تسوية، تصحيح رصيد، إلخ)"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <Button 
              variant="primary" 
              className={`flex-1 py-4 rounded-2xl text-white font-extrabold cursor-pointer shadow-lg ${adjustmentType === 'add_debt' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : adjustmentType === 'add_credit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
              onClick={handleSave}
            >
              حفظ التعديل في السجل
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold hover:bg-white hover:text-slate-800 cursor-pointer"
              onClick={() => { setShowCustomerAdjustmentModal(null); setAdjustmentAmount(''); setAdjustmentNotes(''); setAdjustmentType('note'); }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
