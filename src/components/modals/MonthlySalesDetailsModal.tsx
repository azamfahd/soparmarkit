import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface MonthlySalesDetailsModalProps {
  showMonthlySalesDetailsModal: boolean;
  setShowMonthlySalesDetailsModal: (show: boolean) => void;
  salesDetailsStats: {
    days: Array<{ label: string; total: number; count: number; itemsCount: number; cash: number; debt: number }>;
    weeks: Array<{ label: string; total: number; count: number; itemsCount: number; cash: number; debt: number }>;
    months: Array<{ label: string; total: number; count: number; itemsCount: number; cash: number; debt: number }>;
    productStats: Array<{ id?: number; name: string; category: string; soldQty: number; revenue: number; transactions: number }>;
  };
  salesDetailsTab: 'days' | 'weeks' | 'months';
  setSalesDetailsTab: (tab: any) => void;
  formatPrice: (amount: number) => string;
}

export const MonthlySalesDetailsModal: React.FC<MonthlySalesDetailsModalProps> = ({
  showMonthlySalesDetailsModal,
  setShowMonthlySalesDetailsModal,
  salesDetailsStats,
  salesDetailsTab,
  setSalesDetailsTab,
  formatPrice,
}) => {
  if (!showMonthlySalesDetailsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white text-slate-800 w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">سجل وتحليلات المبيعات التفصيلية</h3>
              <p className="text-xs text-slate-500 font-bold">مراجعة شاملة لمبيعات الأيام والأسابيع والأشهر والمنتجات الأكثر طلباً</p>
            </div>
          </div>
          <button onClick={() => setShowMonthlySalesDetailsModal(false)} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Main Stats Aggregation */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي مبيعات المتجر</span>
            <span className="text-base font-black text-slate-800 font-mono">
              {formatPrice(salesDetailsStats.days.reduce((sum, d) => sum + d.total, 0))}
            </span>
          </div>
          <div className="text-right border-r border-slate-200/60 pr-3">
            <span className="text-[10px] text-slate-400 font-bold block">القطع المباعة الكلية</span>
            <span className="text-base font-black text-indigo-700 font-mono">
              {salesDetailsStats.days.reduce((sum, d) => sum + d.itemsCount, 0)} قطعة
            </span>
          </div>
          <div className="text-right border-r border-slate-200/60 pr-3">
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي الفواتير</span>
            <span className="text-base font-black text-emerald-700 font-mono">
              {salesDetailsStats.days.reduce((sum, d) => sum + d.count, 0)} عملية
            </span>
          </div>
        </div>

        {/* Tab select Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setSalesDetailsTab('days')}
            className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === 'days' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            مبيعات الأيام
          </button>
          <button
            onClick={() => setSalesDetailsTab('weeks')}
            className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === 'weeks' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            مبيعات الأسابيع
          </button>
          <button
            onClick={() => setSalesDetailsTab('months')}
            className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === 'months' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            مبيعات الأشهر
          </button>
          <button
            onClick={() => setSalesDetailsTab('products_breakdown')}
            className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === ('products_breakdown' as any) ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            المنتجات المباعة
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {salesDetailsTab === 'days' && (
            <div className="space-y-2">
              {salesDetailsStats.days.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد مبيعات مسجلة حتى الآن.</p>
              ) : (
                salesDetailsStats.days.map((item, idx) => (
                  <div key={`day-detail-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800 font-mono">{item.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {item.count} فواتير
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        كمية القطع المباعة اليوم: <strong className="text-slate-600">{item.itemsCount} قطعة</strong>
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-black text-sm text-slate-800">{formatPrice(item.total)}</span>
                      <div className="flex items-center gap-2 text-[9px] font-bold">
                        <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-red-500 font-mono">دين: {formatPrice(item.debt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {salesDetailsTab === 'weeks' && (
            <div className="space-y-2 font-sans">
              {salesDetailsStats.weeks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد مبيعات مسجلة حتى الآن.</p>
              ) : (
                salesDetailsStats.weeks.map((item, idx) => (
                  <div key={`week-detail-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">{item.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {item.count} فواتير
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        إجمالي القطع المباعة بالأسبوع: <strong className="text-slate-600">{item.itemsCount} قطعة</strong>
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-black text-sm text-indigo-700">{formatPrice(item.total)}</span>
                      <div className="flex items-center gap-2 text-[9px] font-bold">
                        <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-red-500 font-mono">دين: {formatPrice(item.debt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {salesDetailsTab === 'months' && (
            <div className="space-y-2 font-sans">
              {salesDetailsStats.months.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد مبيعات مسجلة حتى الآن.</p>
              ) : (
                salesDetailsStats.months.map((item, idx) => (
                  <div key={`month-detail-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800">{item.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          {item.count} فواتير
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        إجمالي القطع المباعة بالترميز الشهري: <strong className="text-slate-600">{item.itemsCount} قطعة</strong>
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-black text-sm text-indigo-800">{formatPrice(item.total)}</span>
                      <div className="flex items-center gap-2 text-[9px] font-bold">
                        <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-red-500 font-mono">دين: {formatPrice(item.debt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {salesDetailsTab === ('products_breakdown' as any) && (
            <div className="space-y-2">
              {salesDetailsStats.productStats.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد منتجات مباعة ومسجلة بعد.</p>
              ) : (
                salesDetailsStats.productStats.map((item, idx) => (
                  <div key={`prod-stat-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 block leading-tight">{item.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 block mt-0.5 bg-slate-100 px-2 py-0.5 rounded-full w-max">
                          تصنيف: {item.category}
                        </span>
                      </div>
                      <div className="text-left font-sans">
                        <span className="text-xs font-black text-indigo-700 font-mono block">{formatPrice(item.revenue)}</span>
                        <span className="text-[9px] font-bold text-slate-400 block">العائد المبيعات</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pt-1 border-t border-slate-100 mt-2">
                      <span>الكمية المباعة: <strong className="text-slate-700 font-mono text-xs">{item.soldQty} قطعة</strong></span>
                      <span>تكرر في: <strong className="text-slate-700 font-mono text-xs">{item.transactions} عمليات</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer closed button */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button className="w-full py-3.5 rounded-2xl text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-md" onClick={() => setShowMonthlySalesDetailsModal(false)}>
            إغلاق التقارير الشاملة
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
