import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { Database, X, Search, Package, ShoppingCart } from 'lucide-react';

export interface InventoryDetailsModalProps {
  showInventoryDetailsModal: boolean;
  setShowInventoryDetailsModal: (show: boolean) => void;
  summary: {
    totalOriginalInventoryCost?: number;
    totalInventoryCost?: number;
    totalCostOfSoldItems?: number;
    totalStockQuantity?: number;
    totalItemsSold?: number;
  };
  selectedCostDetailType: 'remaining' | 'sold' | 'total' | null;
  setSelectedCostDetailType: (type: 'remaining' | 'sold' | 'total' | null) => void;
  costDetailSearchTerm: string;
  setCostDetailSearchTerm: (term: string) => void;
  filteredCostDetailsList: any[];
  formatPrice: (amount: number) => string;
}

export const InventoryDetailsModal: React.FC<InventoryDetailsModalProps> = ({
  showInventoryDetailsModal,
  setShowInventoryDetailsModal,
  summary,
  selectedCostDetailType,
  setSelectedCostDetailType,
  costDetailSearchTerm,
  setCostDetailSearchTerm,
  filteredCostDetailsList,
  formatPrice,
}) => {
  if (!showInventoryDetailsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-50 w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/10">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">تفاصيل رأس المال وتكاليف المخزون</h3>
              <p className="text-xs text-slate-500 font-bold">ملخص مالي دقيق مبني على سعر التكلفة (سعر الشراء الفعلي)</p>
            </div>
          </div>
          <button onClick={() => {
            setShowInventoryDetailsModal(false);
            setCostDetailSearchTerm('');
          }} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* --- Section 1: Overview (Cost price focus with click interactivity) --- */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5 justify-start">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                تحليل تكاليف رأس المال (اضغط للتفاصيل بالأسفل)
              </h4>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                اختر أي بطاقة للمعاينة
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Total Capital */}
              <div 
                onClick={() => setSelectedCostDetailType('total')}
                className={`border p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right cursor-pointer select-none active:scale-[0.98] ${
                  selectedCostDetailType === 'total' 
                    ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/80 border-indigo-500 ring-2 ring-indigo-500/15' 
                    : 'bg-white border-slate-200/80 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] font-black ${selectedCostDetailType === 'total' ? 'text-indigo-800' : 'text-indigo-700'}`}>رأس المال الكلي</p>
                  {selectedCostDetailType === 'total' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                </div>
                <p className="text-lg font-black font-mono text-indigo-950 mt-1">{formatPrice(summary.totalOriginalInventoryCost ?? 0)}</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  إجمالي كلفة جميع البضائع المسجلة (المتبقية + المباعة)
                </p>
              </div>

              {/* Card 2: Cost of Remaining Goods */}
              <div 
                onClick={() => setSelectedCostDetailType('remaining')}
                className={`border p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right cursor-pointer select-none active:scale-[0.98] ${
                  selectedCostDetailType === 'remaining' 
                    ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 border-emerald-500 ring-2 ring-emerald-500/15' 
                    : 'bg-white border-slate-200/80 hover:border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] font-black ${selectedCostDetailType === 'remaining' ? 'text-emerald-800' : 'text-emerald-700'}`}>كلفة البضائع المتبقية</p>
                  {selectedCostDetailType === 'remaining' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                </div>
                <p className="text-lg font-black font-mono text-emerald-950 mt-1">{formatPrice(summary.totalInventoryCost ?? 0)}</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  رأس المال المعلق بالمحل ويمثل البضاعة المتواجدة بالرفوف حالياً
                </p>
              </div>

              {/* Card 3: Recovered Capital */}
              <div 
                onClick={() => setSelectedCostDetailType('sold')}
                className={`border p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right cursor-pointer select-none active:scale-[0.98] ${
                  selectedCostDetailType === 'sold' 
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100/80 border-blue-500 ring-2 ring-blue-500/15' 
                    : 'bg-white border-slate-200/80 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] font-black ${selectedCostDetailType === 'sold' ? 'text-blue-800' : 'text-blue-700'}`}>رأس المال المسترد</p>
                  {selectedCostDetailType === 'sold' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </div>
                <p className="text-lg font-black font-mono text-blue-950 mt-1">{formatPrice(summary.totalCostOfSoldItems ?? 0)}</p>
                <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                  قيمة كلفة شراء البضائع التي تم بيعها وخرجت من ذمة المحل
                </p>
              </div>
            </div>
          </div>

          {/* --- Section 1.5: Detailed Items Breakdown (Dynamic list based on selected card) --- */}
          {selectedCostDetailType && (
            <div className="space-y-3 bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    {selectedCostDetailType === 'remaining' && "📦 تفاصيل كلفة البضائع المتبقية (الرفوف)"}
                    {selectedCostDetailType === 'sold' && "💸 تفاصيل كلفة البضائع المستردة (المباعة)"}
                    {selectedCostDetailType === 'total' && "💼 تفاصيل رأس المال الكلي للأصناف"}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">فرز تلقائي تصاعدي حسب قيمة التكلفة الإجمالية للبند</p>
                </div>
                
                {/* Live Search input */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <input
                    type="text"
                    placeholder="بحث باسم الصنف أو القسم..."
                    value={costDetailSearchTerm}
                    onChange={(e) => setCostDetailSearchTerm(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-700"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              {/* Scrollable list of items */}
              <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1">
                {filteredCostDetailsList.length > 0 ? (
                  filteredCostDetailsList.map((item, idx) => {
                    let displayQty = 0;
                    let displayCost = 0;
                    let qtyLabel = "";
                    
                    if (selectedCostDetailType === 'remaining') {
                      displayQty = item.remainingQty;
                      displayCost = item.remainingCost;
                      qtyLabel = "متبقي";
                    } else if (selectedCostDetailType === 'sold') {
                      displayQty = item.soldQty;
                      displayCost = item.soldCost;
                      qtyLabel = "مباع";
                    } else {
                      displayQty = item.totalQty;
                      displayCost = item.totalCost;
                      qtyLabel = "إجمالي";
                    }

                    return (
                      <div 
                        key={item.id || idx} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 border border-slate-100/80 transition-all text-right"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1 pl-3">
                          <p className="text-xs font-black text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
                            <span className="bg-slate-200/50 px-1.5 py-0.5 rounded-md text-slate-600">
                              {item.category}
                            </span>
                            <span>•</span>
                            <span>كلفة الشراء للمفرد: <span className="font-mono text-slate-500 font-bold">{formatPrice(item.costPrice)}</span></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0 text-left font-mono">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-bold block">{qtyLabel}</span>
                            <span className="text-xs font-extrabold text-slate-700">{displayQty} قطعة</span>
                          </div>
                          <div className="text-left bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs min-w-[85px]">
                            <span className="text-[9px] text-slate-400 font-bold block text-left">إجمالي الكلفة</span>
                            <span className="text-xs font-black text-slate-900">{formatPrice(displayCost)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 italic text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا توجد أصناف تطابق تصفية البحث الحالية.
                  </div>
                )}
              </div>

              {/* Summary footer for the selected detail list */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
                <span>البنود المطابقة: {filteredCostDetailsList.length} صنف</span>
                <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-extrabold font-mono text-[11px] border border-slate-200/60">
                  مجموع التكلفة: <span className="text-emerald-800 font-black">
                    {formatPrice(
                      filteredCostDetailsList.reduce((sum, item) => {
                        if (selectedCostDetailType === 'remaining') return sum + item.remainingCost;
                        if (selectedCostDetailType === 'sold') return sum + item.soldCost;
                        return sum + item.totalCost;
                      }, 0)
                    )}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* --- Section 2: Stock Quantities & Rates --- */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5 justify-start">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              القطع والمخزون الفعلي ومعدل التصفية
            </h4>
            
            <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    القطع المتبقية بالرفوف:
                  </span>
                  <span className="font-extrabold text-slate-800 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200">
                    {(summary.totalStockQuantity ?? 0)} قطعة
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                    القطع المباعة للعملاء:
                  </span>
                  <span className="font-extrabold text-slate-800 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200">
                    {(summary.totalItemsSold ?? 0)} قطعة
                  </span>
                </div>
              </div>

              {/* Styled Progress Bar representing liquidation progress */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-black">معدل تصفية المخزون (النسبة المباعة)</span>
                  <span className="font-black text-sm text-emerald-800 font-mono">
                    {((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0)) > 0 
                      ? `${(((summary.totalItemsSold ?? 0) / ((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0))) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="h-full bg-gradient-to-l from-emerald-500 to-indigo-500 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0)) > 0 
                        ? (((summary.totalItemsSold ?? 0) / ((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0))) * 100).toFixed(1)
                        : 0}%` 
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>طريق الاسترداد الكامل</span>
                  <span>مجموع قطع البضائع الكليّة: {((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0))} قطعة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all" onClick={() => setShowInventoryDetailsModal(false)}>إغلاق النافذة</Button>
        </div>
      </motion.div>
    </div>
  );
};
