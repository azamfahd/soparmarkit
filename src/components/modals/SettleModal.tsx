import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, X, AlertCircle, CheckCircle2, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SettleModalProps {
  showSettleModal: boolean;
  setShowSettleModal: (val: boolean) => void;
  currentCycleCashSales: number;
  currentCycleDebtPaymentsTotal: number;
  currentCycleDebtTotal: number;
  carriedForwardDeficit: number;
  currentCycleUnpaidWithdrawalsTotal: number;
  currentCycleSupplierPaymentsTotal: number;
  activeOutstandingCash: number;
  handleSaveSettlement: (data: any, resetForm: () => void) => void;
  formatPrice: (amount: number) => string;
  currency: string;
}

export const SettleModal: React.FC<SettleModalProps> = ({
  showSettleModal,
  setShowSettleModal,
          currentCycleCashSales,
  currentCycleDebtPaymentsTotal,
  currentCycleDebtTotal,
  carriedForwardDeficit,
  currentCycleUnpaidWithdrawalsTotal,
  currentCycleSupplierPaymentsTotal,
  activeOutstandingCash,
  handleSaveSettlement,
  formatPrice,
  currency,
}) => {

  const [deliveredSettleAmount, setDeliveredSettleAmount] = useState(String(activeOutstandingCash || ''));
  const [settleNotes, setSettleNotes] = useState('');

  const handleSave = () => {
    handleSaveSettlement(
      { deliveredSettleAmount, settleNotes },
      () => {
        setDeliveredSettleAmount('');
        setSettleNotes('');
      }
    );
  };

  if (!showSettleModal) return null;

  return (
    <div key="modal-settle" className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 text-right flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          {/* Close Button */}
          <button 
            onClick={() => { setShowSettleModal(false); setDeliveredSettleAmount(''); setSettleNotes(''); }}
            className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20 rotate-3">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black">تصفية نقدية الصندوق</h3>
              <p className="text-violet-100 text-[10px] mt-1 opacity-80">مطابقة المبيعات والديون المحصلة</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Alert */}
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed font-bold">
              مطابقة النقدية الفعلية مع المسجل تلقائياً، والترحيل الفوري للعجز.
            </p>
          </div>

          {/* Detailed Summary Card */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-indigo-100">
                <span className="text-[9px] text-slate-500 font-black block mb-1">مبيعات نقد</span>
                <span className="font-black text-slate-800 font-mono text-xs">{formatPrice(currentCycleCashSales)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-emerald-100">
                <span className="text-[9px] text-emerald-600 font-black block mb-1">تحصيل ديون</span>
                <span className="font-black text-emerald-700 font-mono text-xs">+{formatPrice(currentCycleDebtPaymentsTotal)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-amber-100">
                <span className="text-[9px] text-amber-600 font-black block mb-1">مبيعات لم تسدد بعد</span>
                <span className="font-black text-amber-700 font-mono text-xs">{formatPrice(currentCycleDebtTotal)}</span>
              </div>
              <div className={`p-3 rounded-xl border shadow-sm transition-all ${carriedForwardDeficit > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200/60'}`}>
                <span className={`text-[9px] font-black block mb-1 ${carriedForwardDeficit > 0 ? 'text-rose-600' : 'text-slate-400'}`}>عجز سابق</span>
                <span className={`font-black font-mono text-xs ${carriedForwardDeficit > 0 ? 'text-rose-700' : 'text-slate-500'}`}>{formatPrice(carriedForwardDeficit)}</span>
              </div>
            </div>

            {currentCycleUnpaidWithdrawalsTotal > 0 && (
              <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-2xl flex justify-between items-center text-[10px] sm:text-xs text-amber-900 font-bold shrink-0">
                <span>💸 مسحوبات وسلفيات الصندوق معلقة السداد:</span>
                <span className="font-mono text-xs text-rose-700 font-black">-{formatPrice(currentCycleUnpaidWithdrawalsTotal)}</span>
              </div>
            )}

            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-50 space-y-2.5 text-white">
              <div className="flex justify-between items-center text-xs">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black opacity-85">المستهدف الكلي للتسوية</span>
                  <span className="text-[9px] font-medium opacity-70">إجمالي السيولة المقيدة</span>
                  {currentCycleSupplierPaymentsTotal > 0 && (
                    <span className="text-[8px] font-bold text-violet-200 block pt-1 bg-violet-800/30 w-fit px-1.5 py-0.5 rounded-lg mt-1 border border-violet-500/30">خصم لموردين: {formatPrice(currentCycleSupplierPaymentsTotal)}</span>
                  )}
                </div>
                <span className="text-sm font-bold font-mono">{formatPrice(activeOutstandingCash)}</span>
              </div>
              
              {currentCycleUnpaidWithdrawalsTotal > 0 && (
                <div className="flex justify-between items-center border-t border-white/10 pt-2.5">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black opacity-90 text-amber-200">السيولة النقدية المتوقع جردها بالصندوق</span>
                    <span className="text-[9px] font-medium opacity-75 text-violet-100">المبلغ الفعلي المطلوب تسليمه كاش</span>
                  </div>
                  <span className="text-base font-black font-mono text-yellow-200">{formatPrice(Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interaction Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 flex items-center gap-1.5 pr-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
                المبلغ المسلم فعلياً:
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl font-mono focus:outline-none focus:ring-4 focus:ring-violet-50 pl-16 text-slate-800 transition-all focus:bg-white focus:border-violet-300 shadow-sm" 
                  value={deliveredSettleAmount} 
                  onChange={e => setDeliveredSettleAmount(e.target.value)} 
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-violet-600 text-xs bg-violet-50 px-2.5 py-1 rounded-xl">{currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const expectedPhysical = Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal);
                  setDeliveredSettleAmount(String(expectedPhysical));
                  setSettleNotes('مطابقة تامة ومسلمة بالكامل حسب الجرد الفعلي');
                }}
                className="py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all font-black text-[11px] shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" /> تصفية كاملة للجرد
              </button>
              <button
                type="button"
                onClick={() => {
                  const expectedPhysical = Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal);
                  setDeliveredSettleAmount(String(Math.ceil(expectedPhysical / 2)));
                  setSettleNotes('تصفية نصف مبلغ الجرد المستحق');
                }}
                className="py-3 bg-white text-slate-700 rounded-xl border-2 border-slate-100 hover:bg-slate-50 transition-all font-black text-[11px] flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" /> تصفية نصف المتبقي
              </button>
            </div>

            {/* Result Analysis */}
            {(() => {
              const deliveredVal = Number(deliveredSettleAmount) || 0;
              const expectedPhysical = Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal);
              const diff = deliveredVal - expectedPhysical;
              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                  <div className={`p-3 rounded-xl ${diff < 0 ? 'bg-rose-50/70 text-rose-700 border border-rose-100' : diff > 0 ? 'bg-amber-50/70 text-amber-700 border border-amber-100' : 'bg-emerald-50/70 text-emerald-700 border border-emerald-100'} text-[11px] leading-relaxed font-bold text-center`}>
                     {diff < 0 ? (
                       <span>🚨 عجز جرد فعلي (بخلاف المسحوبات): عجز بمقدار <span className="font-extrabold underline">{formatPrice(Math.abs(diff))}</span> سيرحل للدورة القادمة كعجز مالي بالصندوق.</span>
                     ) : diff > 0 ? (
                       <span>⚠️ زيادة بالصندوق: تم رصد زيادة بمقدار <span className="font-extrabold underline">{formatPrice(diff)}</span> عن المطلوب.</span>
                     ) : (
                       <span>✅ ممتاز: النقد مطابق تماماً لجرد الصندوق الفعلي المتوقع! (ولا يزال هناك {formatPrice(currentCycleUnpaidWithdrawalsTotal)} ذمم شخصية منفصلة).</span>
                     )}
                  </div>
                </div>
              );
            })()}

            <input 
              type="text" 
              placeholder="ملاحظات إضافية (اختياري)..." 
              className="w-full p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 border-2 border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-50 transition-all shadow-sm" 
              value={settleNotes} 
              onChange={e => setSettleNotes(e.target.value)} 
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              className="flex-[2] py-4 bg-violet-600 hover:bg-violet-700 text-white font-black text-base shadow-xl shadow-violet-50 rounded-2xl transition-all active:scale-[0.98]" 
              onClick={handleSave}
              disabled={deliveredSettleAmount === '' || Number(deliveredSettleAmount) < 0}
            >
              اعتماد التصفية
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800"
              onClick={() => { setShowSettleModal(false); setDeliveredSettleAmount(''); setSettleNotes(''); }}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
