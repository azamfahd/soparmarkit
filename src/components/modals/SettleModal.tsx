import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, X, AlertCircle, CheckCircle2, Sparkles, RotateCcw, ShieldAlert, FileText, Check } from 'lucide-react';
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
  const [openingFloat, setOpeningFloat] = useState<string>('0');
  const [deliveredSettleAmount, setDeliveredSettleAmount] = useState(String(activeOutstandingCash || ''));
  const [settleNotes, setSettleNotes] = useState('');
  const [showAuditNotes, setShowAuditNotes] = useState(true);

  const floatVal = Number(openingFloat) || 0;
  const adjustedTargetCash = activeOutstandingCash + floatVal;

  const handleSave = () => {
    handleSaveSettlement(
      { 
        deliveredSettleAmount, 
        settleNotes: `[العهدة الافتتاحية: ${floatVal} ${currency}] ${settleNotes}`.trim() 
      },
      () => {
        setDeliveredSettleAmount('');
        setOpeningFloat('0');
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
        className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 text-right flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-6 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          
          {/* Close Button */}
          <button 
            onClick={() => { setShowSettleModal(false); setDeliveredSettleAmount(''); setSettleNotes(''); }}
            className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20 rotate-3">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black">بطاقة تسوية وتصفية مبيعات الصندوق</h3>
              <p className="text-violet-100 text-[11px] mt-1 opacity-90">مطابقة المبيعات النقدية، العهدة الافتتاحية، والمصروفات</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Detailed Summary Card */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/60 space-y-4">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-600" />
              أولاً: حركات السيولة النقدية الفعلية (صندوق الكاش)
            </h4>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                <span className="text-[9px] text-slate-500 font-black block mb-1">مبيعات نقدية مباشرة</span>
                <span className="font-black text-slate-800 font-mono text-xs">{formatPrice(currentCycleCashSales)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                <span className="text-[9px] text-emerald-600 font-black block mb-1">تحصيل ديون سابقة</span>
                <span className="font-black text-emerald-700 font-mono text-xs">+{formatPrice(currentCycleDebtPaymentsTotal)}</span>
              </div>
              <div className={`p-3 rounded-xl border shadow-sm ${carriedForwardDeficit > 0 ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-200/60'}`}>
                <span className={`text-[9px] font-black block mb-1 ${carriedForwardDeficit > 0 ? 'text-rose-600' : 'text-slate-400'}`}>عجز مرحل سابق</span>
                <span className={`font-black font-mono text-xs ${carriedForwardDeficit > 0 ? 'text-rose-700' : 'text-slate-500'}`}>{formatPrice(carriedForwardDeficit)}</span>
              </div>
              <div className="bg-violet-50/80 p-3 rounded-xl border border-violet-200/60 shadow-sm">
                <span className="text-[9px] text-violet-600 font-black block mb-1">مدفوعات للموردين</span>
                <span className="font-black text-violet-700 font-mono text-xs">-{formatPrice(currentCycleSupplierPaymentsTotal)}</span>
              </div>
            </div>

            {/* Opening Float Input */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-4">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-slate-800">الرصيد الافتتاحي للوردية (عهدة الفكة بالدرج):</span>
                <span className="text-[10px] text-slate-500">المبلغ الموجود أساساً في الدرج لبدء الصرف والرد</span>
              </div>
              <div className="relative w-36">
                <input 
                  type="number"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black font-mono text-sm text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Separated Credit Sales Box */}
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>كم باعت المنشأة بالآجل في هذه الدورة:</span>
              </div>
              <span className="font-mono text-amber-800 font-black">{formatPrice(currentCycleDebtTotal)}</span>
            </div>

            {currentCycleUnpaidWithdrawalsTotal > 0 && (
              <div className="bg-rose-50 border border-rose-200/60 p-3 rounded-2xl flex justify-between items-center text-xs text-rose-900 font-bold">
                <span>💸 مسحوبات نقدية شخصية / سلفيات معلقة:</span>
                <span className="font-mono text-rose-700 font-black">-{formatPrice(currentCycleUnpaidWithdrawalsTotal)}</span>
              </div>
            )}

            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 p-4 rounded-2xl shadow-lg shadow-indigo-100 space-y-2 text-white">
              <div className="flex justify-between items-center text-xs">
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-black">🎯 المستهدف الكلي للتسوية النقدية بالصندوق</span>
                  <span className="text-[9px] opacity-80">(المبيعات النقدية + التحصيلات + الفكة الافتتاحية - المدفوعات)</span>
                </div>
                <span className="text-base font-black font-mono">{formatPrice(adjustedTargetCash)}</span>
              </div>
            </div>
          </div>

          {/* Interaction Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 pr-1">
                <CheckCircle2 className="w-4 h-4 text-violet-600" />
                المبلغ النقدي المسلم فعلياً (نتيجة الجرد):
              </label>
              <div className="relative group">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-xl font-mono focus:outline-none focus:ring-4 focus:ring-violet-100 pl-16 text-slate-800 transition-all focus:bg-white focus:border-violet-500 shadow-sm" 
                  value={deliveredSettleAmount} 
                  onChange={e => setDeliveredSettleAmount(e.target.value)} 
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-violet-600 text-xs bg-violet-100 px-2.5 py-1 rounded-xl">{currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const expectedPhysical = Math.max(0, adjustedTargetCash - currentCycleUnpaidWithdrawalsTotal);
                  setDeliveredSettleAmount(String(expectedPhysical));
                  setSettleNotes('مطابقة تامة ومسلمة بالكامل حسب الجرد الفعلي');
                }}
                className="py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> تصفية كاملة للجرد
              </button>
              <button
                type="button"
                onClick={() => {
                  const expectedPhysical = Math.max(0, adjustedTargetCash - currentCycleUnpaidWithdrawalsTotal);
                  setDeliveredSettleAmount(String(Math.ceil(expectedPhysical / 2)));
                  setSettleNotes('تصفية نصف مبلغ الجرد المستحق');
                }}
                className="py-3 bg-white text-slate-700 rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition-all font-black text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> تصفية نصف المتبقي
              </button>
            </div>

            {/* Result Analysis */}
            {(() => {
              const deliveredVal = Number(deliveredSettleAmount) || 0;
              const expectedPhysical = Math.max(0, adjustedTargetCash - currentCycleUnpaidWithdrawalsTotal);
              const diff = deliveredVal - expectedPhysical;
              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                  <div className={`p-3 rounded-xl ${diff < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : diff > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'} text-xs leading-relaxed font-bold text-center`}>
                     {diff < 0 ? (
                       <span>🚨 عجز جرد فعلي: يوجد عجز نقدي بمقدار <span className="font-extrabold underline">{formatPrice(Math.abs(diff))}</span> سيتم ترحيله وسداده.</span>
                     ) : diff > 0 ? (
                       <span>⚠️ زيادة بالصندوق: تم رصد زيادة نقدية بمقدار <span className="font-extrabold underline">{formatPrice(diff)}</span> عن المتوقع.</span>
                     ) : (
                       <span>✅ مطابقة ممتازة: السيولة النقدية مطابقة تماماً للمستهدف المحاسبي المصحح!</span>
                     )}
                  </div>
                </div>
              );
            })()}

            <input 
              type="text" 
              placeholder="ملاحظات إضافية للتصفية والتدقيق..." 
              className="w-full p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" 
              value={settleNotes} 
              onChange={e => setSettleNotes(e.target.value)} 
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              className="flex-[2] py-4 bg-violet-600 hover:bg-violet-700 text-white font-black text-base shadow-xl rounded-2xl transition-all active:scale-[0.98]" 
              onClick={handleSave}
              disabled={deliveredSettleAmount === '' || Number(deliveredSettleAmount) < 0}
            >
              اعتماد التصفية المصححة
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 py-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800"
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

