import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SalesSummaryModalProps {
  showSalesSummaryModal: boolean;
  setShowSalesSummaryModal: (show: boolean) => void;
  summary: {
    totalSales?: number;
    totalSaleValueOfRemainingInventory?: number;
    totalOriginalInventorySaleValue?: number;
  };
  formatPrice: (amount: number) => string;
}

export const SalesSummaryModal: React.FC<SalesSummaryModalProps> = ({
  showSalesSummaryModal,
  setShowSalesSummaryModal,
  summary,
  formatPrice,
}) => {
  if (!showSalesSummaryModal) return null;

  return (
    <div key="modal-sales-summary" className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-50 w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-md shadow-blue-500/10">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">تفاصيل وتحليل المبيعات</h3>
              <p className="text-xs text-slate-500 font-bold">تحليل كامل لعمليات البيع المحققة وتوقعات المبيعات المتبقية بالمتجر</p>
            </div>
          </div>
          <button onClick={() => setShowSalesSummaryModal(false)} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* --- Section 1: Sales / Projections (Sale price focus) --- */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              تحليل المبيعات (بسعر البيع الكلي)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                <p className="text-[10px] text-blue-700 font-extrabold">المبيعات المحققة بالفعل</p>
                <p className="text-lg font-black font-mono text-blue-900 mt-1">{formatPrice(summary.totalSales ?? 0)}</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  قيمة ما تم تسييله وبيعه واستلامه نقداً أو كديون محتسبة للعملاء
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                <p className="text-[10px] text-amber-700 font-extrabold">مبيعات المتبقي المتوقعة</p>
                <p className="text-lg font-black font-mono text-amber-900 mt-1">{formatPrice(summary.totalSaleValueOfRemainingInventory ?? 0)}</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  العائد البيعي المقدر للبضائع المعروضة حالياً عند بيعها بالكامل
                </p>
              </div>

              <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 border border-fuchsia-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                <p className="text-[10px] text-fuchsia-700 font-extrabold">القيمة البيعية الكليّة</p>
                <p className="text-lg font-black font-mono text-fuchsia-900 mt-1">{formatPrice(summary.totalOriginalInventorySaleValue ?? 0)}</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  مجموع قيمة البضائع (المباعة والمتبقية معاً) بأسعار البيع الكلية
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all" onClick={() => setShowSalesSummaryModal(false)}>إغلاق النافذة</Button>
        </div>
      </motion.div>
    </div>
  );
};
