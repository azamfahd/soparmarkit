import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { Briefcase, X, FileText } from 'lucide-react';
import { Supplier } from '../../types';

export interface SupplierSummaryModalProps {
  showSupplierSummaryModal: boolean;
  setShowSupplierSummaryModal: (show: boolean) => void;
  summary: {
    totalOriginalSupplierCost?: number;
    totalSupplierPayments?: number;
    totalCostOfSales?: number;
  };
  suppliers: Supplier[];
  enrichedSupplierPayments: any[];
  formatPrice: (amount: number) => string;
  formatDateWithDay: (dateStr: string) => string;
  fetchSupplierHistory: (supplier: Supplier) => void;
  setSelectedSupplierPayment: (payment: any) => void;
}

export const SupplierSummaryModal: React.FC<SupplierSummaryModalProps> = ({
  showSupplierSummaryModal,
  setShowSupplierSummaryModal,
  summary,
  suppliers,
  enrichedSupplierPayments,
  formatPrice,
  formatDateWithDay,
  fetchSupplierHistory,
  setSelectedSupplierPayment,
}) => {
  if (!showSupplierSummaryModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-50 w-full max-w-3xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-md shadow-amber-500/10">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">مستحقات الموردين وتفاصيل رأس المال</h3>
              <p className="text-xs text-slate-500 font-bold">ملخص مالي للمستحقات، الدفعات المسلمة للتجار، وأرصدتهم</p>
            </div>
          </div>
          <button onClick={() => setShowSupplierSummaryModal(false)} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-5">
          {/* --- Section 1: Financial Summary General Cards --- */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              الملخص المالي العام للموردين
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">المطلوب قبل السداد</span>
                <p className="text-xs text-indigo-700/80 font-bold mt-2">إجمالي مستحقات الموردين</p>
                <p className="text-xl font-black font-mono text-indigo-900">{formatPrice(summary.totalOriginalSupplierCost ?? 0)}</p>
                <p className="text-[9px] text-indigo-600 font-bold leading-tight pt-1">المستحقات الكليّة لجميع التجار قبل أي مدفوعات</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">المبالغ المسلمة</span>
                <p className="text-xs text-emerald-700/80 font-bold mt-2">رأس المال المسلّم للتجار</p>
                <p className="text-xl font-black font-mono text-emerald-900">{formatPrice(summary.totalSupplierPayments ?? 0)}</p>
                <p className="text-[9px] text-emerald-600 font-bold leading-tight pt-1">إجمالي الدفعات المسددة والمسجلة للموردين</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">المطلوب حالياً</span>
                <p className="text-xs text-amber-700/80 font-bold mt-2">المستحق الحالي المتبقي</p>
                <p className="text-xl font-black font-mono text-amber-900">{formatPrice(summary.totalCostOfSales ?? 0)}</p>
                <p className="text-[9px] text-amber-600 font-bold leading-tight pt-1">صافي الديون المعلقة في حسابات التجار</p>
              </div>
            </div>
          </div>

          {/* --- Section 2 & 3: Side-by-Side Bento Grid --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Right Bento Column: Suppliers Balances */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-4 flex flex-col justify-between shadow-xs space-y-3">
              <div>
                <div className="flex justify-between items-center pr-2 border-r-4 border-blue-500 pb-0.5 mb-2">
                  <h4 className="text-xs font-black text-slate-800">أرصدة التجار المتبقية</h4>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {suppliers.length} موردين
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {suppliers.length > 0 ? (
                    suppliers.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => {
                          setShowSupplierSummaryModal(false);
                          fetchSupplierHistory(s);
                        }}
                        className="bg-slate-50 p-2.5 rounded-xl shadow-xs border border-slate-100 flex justify-between items-center hover:bg-slate-100/80 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <div className="space-y-0.5 text-right">
                          <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            {s.name}
                          </span>
                          <span className="text-[9px] text-slate-400 block pr-3">{s.phone || 'بدون رقم هاتف'}</span>
                        </div>
                        <span className="font-extrabold text-amber-800 font-mono text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                          {formatPrice(s.balance)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-6 italic text-[11px] font-bold">لا يوجد موردين مسجلين حالياً.</p>
                  )}
                </div>
              </div>
              
              <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 text-center">
                * إضغط على إسم التاجر المورد لمراجعة تفاصيل كشف الحساب الكلي.
              </div>
            </div>

            {/* Left Bento Column: Payment Logs */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-4 flex flex-col justify-between shadow-xs space-y-3">
              <div>
                <div className="flex justify-between items-center pr-2 border-r-4 border-violet-500 pb-0.5 mb-2">
                  <h4 className="text-xs font-black text-slate-800">تفاصيل وسجل الدفعات السابقة</h4>
                  <span className="text-[9px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                    {enrichedSupplierPayments.length} سداد
                  </span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {enrichedSupplierPayments.length > 0 ? (
                    enrichedSupplierPayments.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedSupplierPayment(p)}
                        className="bg-slate-50 p-2.5 rounded-xl shadow-xs border border-slate-100 flex justify-between items-center hover:bg-violet-50/50 cursor-pointer transition-all active:scale-[0.98] gap-3"
                      >
                        <div className="space-y-1 text-right flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 leading-tight">
                            <span className="font-extrabold text-slate-800 text-xs">
                              دفعة سداد لـ <span className="text-violet-700">{p.supplier_name}</span>
                            </span>
                            {p.notes && (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded-full font-bold max-w-[120px] truncate" title={p.notes}>
                                <FileText className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{p.notes}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 block font-mono">
                            {formatDateWithDay(p.payment_date)}
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-800 font-mono text-xs bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 whitespace-nowrap shrink-0">
                          {formatPrice(p.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-400 py-6 italic text-[11px] font-bold">لا توجد دفعات أو سدادات مسجلة سلفاً.</p>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 text-center">
                * إضغط على الدفعة لعرض تفاصيلها وملاحظاتها المسجلة بوضوح.
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all" onClick={() => setShowSupplierSummaryModal(false)}>إغلاق النافذة</Button>
        </div>
      </motion.div>
    </div>
  );
};
