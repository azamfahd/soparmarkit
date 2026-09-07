import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { Briefcase, X, FileText, Building2, Layers, CheckCircle2, ChevronLeft, ArrowUpRight } from 'lucide-react';
import { Supplier, Product, SaleItem } from '../../types';

export interface SupplierSummaryModalProps {
  showSupplierSummaryModal: boolean;
  setShowSupplierSummaryModal: (show: boolean) => void;
  summary: {
    totalOriginalSupplierCost?: number;
    totalSupplierPayments?: number;
    totalCostOfSales?: number;
    totalInventoryCost?: number;
  };
  suppliers: Supplier[];
  products?: Product[];
  saleItems?: SaleItem[];
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
  products = [],
  saleItems = [],
  enrichedSupplierPayments,
  formatPrice,
  formatDateWithDay,
  fetchSupplierHistory,
  setSelectedSupplierPayment,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Build product lookup map
  const productMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  // Compute stats per supplier
  const { supplierList, metrics, totalSuppliersDebt, totalSuppliersPaid } = useMemo(() => {
    let totalSuppliersDebt = 0;
    let totalSuppliersPaid = 0;

    const list = suppliers.map(s => {
      const sDebt = s.balance || 0;
      totalSuppliersDebt += sDebt;

      const payments = enrichedSupplierPayments.filter(p => p.supplier_id === s.id);
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      const supplierProducts = products.filter(p => p.supplier_id === s.id);
      const supplierProductIds = new Set(supplierProducts.map(p => p.id));
      
      const supplierStock = supplierProducts.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
      const supplierInventoryCostValue = supplierProducts.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0);
      
      let totalSoldQuantity = 0;
      let totalSoldCostValue = 0;
      saleItems.forEach(item => {
        if (supplierProductIds.has(item.product_id)) {
          totalSoldQuantity += item.quantity;
          const prod = productMap.get(item.product_id);
          const unitCost = prod ? prod.cost_price : (item.price_at_sale * 0.75);
          totalSoldCostValue += unitCost * item.quantity;
        }
      });

      const totalInventoryAndSoldCost = supplierInventoryCostValue + totalSoldCostValue;
      const totalRequiredBeforeSettlement = sDebt + totalPaid;

      return {
        ...s,
        balance: sDebt,
        totalPaid,
        totalRequiredBeforeSettlement,
        productsCount: supplierProducts.length,
        inventoryStock: supplierStock,
        inventoryCostValue: supplierInventoryCostValue,
        totalSoldQuantity,
        totalSoldCostValue,
        totalInventoryAndSoldCost,
        payments: payments.slice().sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
      };
    }).sort((a, b) => (b.balance || 0) - (a.balance || 0));

    // Global totals
    enrichedSupplierPayments.forEach(p => {
      totalSuppliersPaid += (p.amount || 0);
    });

    const totalInventoryCostAll = list.reduce((acc, s) => acc + s.inventoryCostValue, 0);
    const totalSoldCostAll = list.reduce((acc, s) => acc + s.totalSoldCostValue, 0);
    const totalInventoryAndSoldCostAll = totalInventoryCostAll + totalSoldCostAll;
    const totalRequiredBeforeSettlementAll = totalSuppliersDebt + totalSuppliersPaid;

    const selectedObj = selectedSupplierId === 'all' 
      ? null 
      : list.find(s => String(s.id) === String(selectedSupplierId)) || null;

    const activeMetrics = selectedObj ? {
      name: selectedObj.name,
      isSpecific: true,
      currentBalance: selectedObj.balance,
      totalPaid: selectedObj.totalPaid,
      totalRequiredBeforeSettlement: selectedObj.totalRequiredBeforeSettlement,
      inventoryCostValue: selectedObj.inventoryCostValue,
      soldCostValue: selectedObj.totalSoldCostValue,
      totalInventoryAndSoldCost: selectedObj.totalInventoryAndSoldCost,
      productsCount: selectedObj.productsCount,
      paymentsCount: selectedObj.payments.length,
      rawSupplier: selectedObj
    } : {
      name: 'جميع الموردين',
      isSpecific: false,
      currentBalance: totalSuppliersDebt,
      totalPaid: totalSuppliersPaid,
      totalRequiredBeforeSettlement: totalRequiredBeforeSettlementAll,
      inventoryCostValue: totalInventoryCostAll,
      soldCostValue: totalSoldCostAll,
      totalInventoryAndSoldCost: totalInventoryAndSoldCostAll,
      productsCount: products.filter(p => p.supplier_id != null).length,
      paymentsCount: enrichedSupplierPayments.length,
      rawSupplier: null
    };

    return {
      supplierList: list,
      metrics: activeMetrics,
      totalSuppliersDebt,
      totalSuppliersPaid
    };
  }, [suppliers, products, saleItems, enrichedSupplierPayments, productMap, selectedSupplierId]);

  if (!showSupplierSummaryModal) return null;

  // Filtered payments list
  const displayedPayments = selectedSupplierId === 'all'
    ? enrichedSupplierPayments
    : enrichedSupplierPayments.filter(p => String(p.supplier_id) === String(selectedSupplierId));

  // Filtered suppliers list
  const displayedSuppliers = supplierList.filter(s => 
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    (s.phone && s.phone.includes(searchFilter))
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
      <motion.div 
        initial={{ scale: 0.96, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-50 w-full max-w-3xl lg:max-w-4xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-3 shadow-2xl relative text-right max-h-[92vh] overflow-y-auto border border-white"
        dir="rtl"
      >
        {/* Header (Compact & Elegant) */}
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-2 rounded-xl shadow-xs">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  مستحقات الموردين وتفاصيل رأس المال
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                  {metrics.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                كشف تحليلي للمستحقات، الدفعات المسلمة للتجار، وقيمة البضائع بالمخزن والمباعة
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowSupplierSummaryModal(false)} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- Supplier Selector Bar (Compact) --- */}
        <div className="bg-white border border-slate-200/90 p-2.5 rounded-xl shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>المورد:</span>
              </span>
              <select
                id="supplier-select-main"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-amber-50/60 border border-amber-300 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs"
              >
                <option value="all">🌐 جميع الموردين ({suppliers.length})</option>
                {supplierList.map((sup, idx) => (
                  <option key={`sup-modal-opt-${sup.id ?? 'noid'}-${idx}`} value={String(sup.id)}>
                    {sup.name} {sup.balance > 0 ? `(مستحق: ${formatPrice(sup.balance)})` : '(خالص)'}
                  </option>
                ))}
              </select>
            </div>

            {metrics.isSpecific && metrics.rawSupplier && (
              <button
                type="button"
                onClick={() => {
                  setShowSupplierSummaryModal(false);
                  fetchSupplierHistory(metrics.rawSupplier);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <span>كشف الحساب الكامل</span>
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Supplier Pills */}
          {suppliers.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pt-0.5 pb-0.5">
              <button
                type="button"
                onClick={() => setSelectedSupplierId('all')}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  selectedSupplierId === 'all'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              {supplierList.map((sup, idx) => {
                const isSelected = selectedSupplierId === String(sup.id);
                return (
                  <button
                    key={`sup-modal-pill-${sup.id ?? 'noid'}-${idx}`}
                    type="button"
                    onClick={() => setSelectedSupplierId(String(sup.id))}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    <span>{sup.name}</span>
                    {sup.balance > 0 && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                        isSelected ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {formatPrice(sup.balance)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* --- 4 Financial Metrics Cards (Compact & Neat) --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {/* Card 1: المطلوب قبل السداد */}
          <div className="bg-gradient-to-br from-indigo-50/90 to-indigo-100/50 border border-indigo-200/90 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9.5px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-bold">المطلوب قبل السداد</span>
                <span className="text-[8.5px] text-indigo-500 font-mono font-bold">قبل الدفع</span>
              </div>
              <p className="text-[11px] text-indigo-900/80 font-bold">إجمالي المستحقات</p>
              <p className="text-sm sm:text-base font-black font-mono text-indigo-950 my-0.5">
                {formatPrice(metrics.totalRequiredBeforeSettlement)}
              </p>
            </div>
            <p className="text-[9px] text-indigo-700/90 font-medium leading-tight truncate">
              {metrics.isSpecific 
                ? `المستحق لـ (${metrics.name}) قبل السداد`
                : 'المستحقات الكليّة لجميع التجار قبل السداد'}
            </p>
          </div>

          {/* Card 2: المبالغ المسلمة */}
          <div className="bg-gradient-to-br from-emerald-50/90 to-emerald-100/50 border border-emerald-200/90 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9.5px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">المبالغ المسلمة</span>
                <span className="text-[8.5px] text-emerald-600 font-mono font-bold">مدفوع</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 font-bold">رأس المال المسلّم</p>
              <p className="text-sm sm:text-base font-black font-mono text-emerald-950 my-0.5">
                {formatPrice(metrics.totalPaid)}
              </p>
            </div>
            <p className="text-[9px] text-emerald-700/90 font-medium leading-tight truncate">
              {metrics.isSpecific
                ? `الدفعات المسددة للمورد (${metrics.paymentsCount} سداد)`
                : 'إجمالي الدفعات المسددة والمسجلة'}
            </p>
          </div>

          {/* Card 3: المطلوب حالياً */}
          <div className="bg-gradient-to-br from-amber-50/90 to-amber-100/60 border border-amber-200/90 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9.5px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">المطلوب حالياً</span>
                <span className="text-[8.5px] text-amber-700 font-mono font-bold">المتبقي</span>
              </div>
              <p className="text-[11px] text-amber-900/80 font-bold">المستحق الحالي المتبقي</p>
              <p className="text-sm sm:text-base font-black font-mono text-amber-950 my-0.5">
                {formatPrice(metrics.currentBalance)}
              </p>
            </div>
            <p className="text-[9px] text-amber-800 font-medium leading-tight truncate">
              {metrics.isSpecific
                ? (metrics.currentBalance > 0 ? 'المستحق المتبقي لهذا المورد' : 'الحساب خالص بالكامل')
                : 'صافي الديون المعلقة للتجار'}
            </p>
          </div>

          {/* Card 4: مستحق البضائع الكلي (المخزون + المباع بالتكلفة) */}
          <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/50 border border-purple-200/90 p-2.5 sm:p-3 rounded-xl flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9.5px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold">مستحق البضائع</span>
                <span className="text-[8.5px] text-purple-600 font-mono font-bold">مخزون+مباع</span>
              </div>
              <p className="text-[11px] text-purple-900/80 font-bold">إجمالي البضائع بالتكلفة</p>
              <p className="text-sm sm:text-base font-black font-mono text-purple-950 my-0.5">
                {formatPrice(metrics.totalInventoryAndSoldCost)}
              </p>
            </div>
            <div className="text-[8.5px] text-purple-800 font-mono font-bold flex justify-between items-center pt-0.5 border-t border-purple-200/60">
              <span className="truncate">المخزن: {formatPrice(metrics.inventoryCostValue)}</span>
              <span>•</span>
              <span className="truncate">المباع: {formatPrice(metrics.soldCostValue)}</span>
            </div>
          </div>
        </div>

        {/* --- Section 2 & 3: Side-by-Side Bento Grid (Compact List Views) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {/* Right Bento Column: Suppliers Balances */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2">
            <div>
              <div className="flex justify-between items-center pr-2 border-r-3 border-amber-500 pb-0.5 mb-1.5">
                <div>
                  <h4 className="text-xs font-black text-slate-800">أرصدة التجار المتبقية</h4>
                </div>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-bold">
                  {displayedSuppliers.length} مورد
                </span>
              </div>
              
              <div className="space-y-1.5 max-h-[160px] sm:max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {displayedSuppliers.length > 0 ? (
                  displayedSuppliers.map((s, idx) => {
                    const isSelected = selectedSupplierId === String(s.id);
                    return (
                      <div 
                        key={`supp-sum-${s.id ?? 'noid'}-${idx}`} 
                        onClick={() => setSelectedSupplierId(String(s.id))}
                        className={`p-2 rounded-lg border flex justify-between items-center cursor-pointer transition-all active:scale-[0.99] ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                            : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="space-y-0.5 text-right min-w-0 pr-1">
                          <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-600' : 'bg-amber-400'}`}></span>
                            <span className="truncate">{s.name}</span>
                            {isSelected && <span className="text-[8.5px] bg-amber-600 text-white px-1 rounded font-bold shrink-0">محدد</span>}
                          </span>
                          <span className="text-[9px] text-slate-400 block pr-2.5 truncate">{s.phone || 'بدون هاتف'}</span>
                        </div>
                        <div className="text-left flex items-center gap-1.5 shrink-0">
                          <span className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded border ${
                            s.balance > 0 
                              ? 'bg-amber-100/80 text-amber-900 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                          }`}>
                            {formatPrice(s.balance)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSupplierSummaryModal(false);
                              fetchSupplierHistory(s);
                            }}
                            title="فتح كشف الحساب"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-400 py-4 italic text-[10px] font-bold">لا يوجد موردين مسجلين حالياً.</p>
                )}
              </div>
            </div>
            
            <div className="text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-100 text-center">
              * إضغط على التاجر لتصفية البطاقات أعلاه وعرض حسابه الخاص.
            </div>
          </div>

          {/* Left Bento Column: Payment Logs */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2">
            <div>
              <div className="flex justify-between items-center pr-2 border-r-3 border-emerald-500 pb-0.5 mb-1.5">
                <div>
                  <h4 className="text-xs font-black text-slate-800">تفاصيل وسجل الدفعات المسددة</h4>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded-full font-bold">
                  {displayedPayments.length} دفعة
                </span>
              </div>

              <div className="space-y-1.5 max-h-[160px] sm:max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {displayedPayments.length > 0 ? (
                  displayedPayments.map((p, idx) => (
                    <div 
                      key={`supp-pay-item-${p.id ?? 'pmt'}-${idx}`} 
                      onClick={() => setSelectedSupplierPayment(p)}
                      className="bg-slate-50/80 p-2 rounded-lg border border-slate-100 flex justify-between items-center hover:bg-emerald-50/50 cursor-pointer transition-all active:scale-[0.99] gap-2"
                    >
                      <div className="space-y-0.5 text-right flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 leading-tight truncate">
                          <span className="font-bold text-slate-800 text-[11px] truncate">
                            سداد لـ <span className="text-emerald-800 font-black">{p.supplier_name}</span>
                          </span>
                          {p.notes && (
                            <span className="inline-flex items-center gap-0.5 text-[8.5px] bg-slate-200/60 text-slate-600 px-1 py-0.2 rounded font-medium max-w-[90px] truncate" title={p.notes}>
                              <span className="truncate">{p.notes}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[8.5px] text-slate-400 block font-mono">
                          {formatDateWithDay(p.payment_date)}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-800 font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 whitespace-nowrap shrink-0">
                        {formatPrice(p.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-4 italic text-[10px] font-bold">
                    {metrics.isSpecific ? 'لا توجد دفعات مسجلة لهذا المورد بعد.' : 'لا توجد دفعات مسجلة سلفاً.'}
                  </p>
                )}
              </div>
            </div>

            <div className="text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-100 text-center">
              * إضغط على أي دفعة لعرض تفاصيل إيصال السداد وملاحظاته.
            </div>
          </div>
        </div>

        {/* Footer (Compact Close Button) */}
        <div className="pt-2 border-t border-slate-200/80">
          <Button 
            className="w-full py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black bg-slate-800 hover:bg-slate-900 text-white shadow-xs active:scale-[0.99] transition-all cursor-pointer" 
            onClick={() => setShowSupplierSummaryModal(false)}
          >
            إغلاق النافذة
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

