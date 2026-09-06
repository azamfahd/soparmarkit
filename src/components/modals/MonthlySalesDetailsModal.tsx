import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, X, Calendar, ShoppingBag, Receipt, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

export interface MonthlySalesDetailsModalProps {
  showMonthlySalesDetailsModal: boolean;
  setShowMonthlySalesDetailsModal: (show: boolean) => void;
  salesDetailsStats: {
    days: Array<{ label: string; total: number; count: number; itemsCount: number; cash: number; debt: number; rawDate?: string }>;
    weeks: Array<{ label: string; total: number; count: number; itemsCount: number; cash: number; debt: number; rawDate?: string }>;
    months: Array<{ label: string; total: number; count: number; itemsCount: number; cash: number; debt: number; rawKey?: string }>;
    productStats: Array<{ id?: number; name: string; category: string; soldQty: number; revenue: number; transactions: number }>;
  };
  salesDetailsTab: 'days' | 'weeks' | 'months' | 'products_breakdown';
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

  // Compute active aggregate numbers dynamically based on tab
  const activeList = 
    salesDetailsTab === 'days' ? salesDetailsStats.days :
    salesDetailsTab === 'weeks' ? salesDetailsStats.weeks :
    salesDetailsTab === 'months' ? salesDetailsStats.months :
    salesDetailsStats.productStats;

  const totalRevenue = activeList.reduce((sum, item: any) => sum + (item.total ?? item.revenue ?? 0), 0);
  const totalItemsCount = activeList.reduce((sum, item: any) => sum + (item.itemsCount ?? item.soldQty ?? 0), 0);
  const totalInvoicesCount = activeList.reduce((sum, item: any) => sum + (item.count ?? item.transactions ?? 0), 0);

  const getTabTitle = () => {
    switch (salesDetailsTab) {
      case 'days': return 'المبيعات اليومية';
      case 'weeks': return 'المبيعات الأسبوعية';
      case 'months': return 'المبيعات الشهرية';
      case 'products_breakdown': return 'أكثر المنتجات مباعاً';
      default: return 'سجل وتحليلات المبيعات';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white text-slate-800 w-full max-w-2xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-slate-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-2.5 rounded-2xl shadow-sm shadow-indigo-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">سجل وتحليلات المبيعات التفصيلية</h3>
                <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  {getTabTitle()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">مراجعة شاملة لمبيعات الأيام والأسابيع والأشهر والمنتجات</p>
            </div>
          </div>
          <button 
            onClick={() => setShowMonthlySalesDetailsModal(false)} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Dynamic Aggregation Card for Active Tab */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100/80">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-black block">إجمالي مبيعات {getTabTitle()}</span>
            <span className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5 block">
              {formatPrice(totalRevenue)}
            </span>
          </div>
          <div className="text-right border-r border-slate-200/60 pr-2.5 sm:pr-3">
            <span className="text-[10px] text-slate-400 font-black block">إجمالي القطع</span>
            <span className="text-sm sm:text-base font-black text-indigo-700 font-mono mt-0.5 block">
              {totalItemsCount} قطعة
            </span>
          </div>
          <div className="text-right border-r border-slate-200/60 pr-2.5 sm:pr-3">
            <span className="text-[10px] text-slate-400 font-black block">إجمالي الفواتير</span>
            <span className="text-sm sm:text-base font-black text-emerald-700 font-mono mt-0.5 block">
              {totalInvoicesCount} عملية
            </span>
          </div>
        </div>

        {/* Tab select Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setSalesDetailsTab('days')}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all duration-200 ${salesDetailsTab === 'days' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            الأيام 📅
          </button>
          <button
            onClick={() => setSalesDetailsTab('weeks')}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all duration-200 ${salesDetailsTab === 'weeks' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            الأسابيع 📊
          </button>
          <button
            onClick={() => setSalesDetailsTab('months')}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all duration-200 ${salesDetailsTab === 'months' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            الأشهر 🗓️
          </button>
          <button
            onClick={() => setSalesDetailsTab('products_breakdown')}
            className={`flex-1 py-1.5 text-[11px] sm:text-xs font-black rounded-lg transition-all duration-200 ${salesDetailsTab === 'products_breakdown' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            المنتجات 🛒
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
          {salesDetailsTab === 'days' && (
            <div className="space-y-2">
              {salesDetailsStats.days.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-black">لا توجد مبيعات يومية مسجلة في هذا اليوم حتى الآن.</p>
                  <p className="text-[10px] text-slate-400 font-bold">يمكنك إجراء عملية بيع جديدة من شاشة المبيعات (الكاشير).</p>
                </div>
              ) : (
                salesDetailsStats.days.map((item, idx) => (
                  <div key={`day-detail-${idx}`} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-indigo-100 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-800">{item.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-black">
                          {item.count} فواتير
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold block">
                        قطع مباعة: <strong className="text-slate-700 font-mono">{item.itemsCount} قطعة</strong>
                      </span>
                    </div>
                    
                    <div className="flex sm:flex-col items-between sm:items-end justify-between gap-1 pt-1 sm:pt-0 border-t sm:border-0 border-slate-50">
                      <span className="font-mono font-black text-sm text-slate-900">{formatPrice(item.total)}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-black">
                        <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-amber-600 font-mono">دين: {formatPrice(item.debt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {salesDetailsTab === 'weeks' && (
            <div className="space-y-2">
              {salesDetailsStats.weeks.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-black">لا توجد مبيعات أسبوعية مسجلة بعد.</p>
                </div>
              ) : (
                salesDetailsStats.weeks.map((item, idx) => (
                  <div key={`week-detail-${idx}`} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-indigo-100 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-800">{item.label}</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-black">
                          {item.count} فواتير
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold block">
                        قطع مباعة بالأسبوع: <strong className="text-slate-700 font-mono">{item.itemsCount} قطعة</strong>
                      </span>
                    </div>
                    
                    <div className="flex sm:flex-col items-between sm:items-end justify-between gap-1 pt-1 sm:pt-0 border-t sm:border-0 border-slate-50">
                      <span className="font-mono font-black text-sm text-indigo-800">{formatPrice(item.total)}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-black">
                        <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-amber-600 font-mono">دين: {formatPrice(item.debt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {salesDetailsTab === 'months' && (
            <div className="space-y-2">
              {salesDetailsStats.months.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-black">لا توجد مبيعات شهرية مسجلة بعد.</p>
                </div>
              ) : (
                salesDetailsStats.months.map((item, idx) => (
                  <div key={`month-detail-${idx}`} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-indigo-100 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900">{item.label}</span>
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-black">
                          {item.count} عمليات بيع
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold block">
                        قطع مباعة بالشهر: <strong className="text-slate-700 font-mono">{item.itemsCount} قطعة</strong>
                      </span>
                    </div>
                    
                    <div className="flex sm:flex-col items-between sm:items-end justify-between gap-1 pt-1 sm:pt-0 border-t sm:border-0 border-slate-50">
                      <span className="font-mono font-black text-base text-indigo-900">{formatPrice(item.total)}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-black">
                        <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-amber-600 font-mono">دين: {formatPrice(item.debt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {salesDetailsTab === 'products_breakdown' && (
            <div className="space-y-2">
              {salesDetailsStats.productStats.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-black">لا توجد بيانات منتجات مباعة بعد.</p>
                </div>
              ) : (
                salesDetailsStats.productStats.map((item, idx) => (
                  <div key={`prod-stat-${idx}`} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs hover:border-indigo-100 transition-all">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div>
                        <span className="font-black text-xs text-slate-800 block leading-tight">{item.name}</span>
                        <span className="text-[9px] font-black text-slate-500 mt-0.5 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                          تصنيف: {item.category}
                        </span>
                      </div>
                      <div className="text-left font-sans">
                        <span className="text-xs font-black text-indigo-700 font-mono block">{formatPrice(item.revenue)}</span>
                        <span className="text-[9px] font-bold text-slate-400 block">عائد المبيعات</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-black pt-1.5 border-t border-slate-100 mt-2">
                      <span>الكمية المباعة: <strong className="text-slate-800 font-mono">{item.soldQty} قطعة</strong></span>
                      <span>تكرر في: <strong className="text-slate-800 font-mono">{item.transactions} عمليات</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer close button */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Button 
            className="w-full py-3 rounded-2xl text-xs sm:text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md active:scale-98" 
            onClick={() => setShowMonthlySalesDetailsModal(false)}
          >
            إغلاق النافذة
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

