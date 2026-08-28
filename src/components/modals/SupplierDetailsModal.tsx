import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { 
  Briefcase, 
  ChevronLeft, 
  Wallet, 
  FileText, 
  Package, 
  RotateCcw, 
  PackageMinus, 
  RefreshCw, 
  PackagePlus 
} from 'lucide-react';
import { Supplier } from '../../types';

export interface SupplierDetailsModalProps {
  showSupplierDetails: Supplier | null;
  setShowSupplierDetails: (supplier: Supplier | null) => void;
  supplierDetailsTab: string;
  setSupplierDetailsTab: (tab: any) => void;
  supplierHistory: {
    stats: {
      totalSoldValue: number;
      totalPayments: number;
      currentInventoryValue: number;
      currentInventoryStock: number;
      totalReceivedQuantity: number;
      totalSoldQuantity: number;
    };
    payments: any[];
    products: any[];
    inventoryLogs: any[];
  };
  formatPrice: (amount: number) => string;
  getProductBadgeStyles: (productName: string) => { bg: string; dot: string };
  formatDateWithDay: (dateStr: string) => string;
  setSelectedSupplierPayment: (pay: any) => void;
  verifyAdminPermission: (action: string, callback: () => void, label?: string) => void;
  setShowSupplierPaymentModal: (supplier: Supplier | null) => void;
}

export const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({
  showSupplierDetails,
  setShowSupplierDetails,
  supplierDetailsTab,
  setSupplierDetailsTab,
  supplierHistory,
  formatPrice,
  getProductBadgeStyles,
  formatDateWithDay,
  setSelectedSupplierPayment,
  verifyAdminPermission,
  setShowSupplierPaymentModal,
}) => {
  if (!showSupplierDetails) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end p-0 whitespace-normal backdrop-blur-sm">
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-slate-50 w-full rounded-t-3xl sm:max-w-2xl sm:mx-auto max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <Briefcase className="text-amber-600 w-6 h-6" />
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">{showSupplierDetails.name}</h3>
                <p className="text-slate-500 text-sm">
                  رقم الهاتف: {showSupplierDetails.phone || 'بدون هاتف'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSupplierDetails(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 rotate-180 text-slate-400" />
            </button>
          </div>

          {/* Primary Highlight Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-4 rounded-2xl border border-amber-100/80 flex justify-between items-center text-right mb-4">
            <div>
              <p className="text-[10px] text-amber-700 font-black uppercase mb-1">المستحق الحالي المتبقي للتسليم</p>
              <p className="text-2xl font-black text-amber-900 font-mono">{formatPrice(showSupplierDetails.balance)}</p>
            </div>
            <div className="text-left">
              <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-1 rounded-lg font-bold">
                ديون تجارية معلقة
              </span>
            </div>
          </div>

          {/* Interactive Dashboard Instructions */}
          <div className="text-right pb-1">
            <p className="text-[10px] text-slate-400 font-bold leading-normal">
              اضغط على أي بطاقة أدناه لعرض كشف التفاصيل والتقارير المتعلقة بها فوراً.
            </p>
          </div>
        </div>

        {/* Ledger Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-right" dir="rtl">
          
          {/* Clickable Metric Cards - Serving as Interactive Tabs */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: Sales / COGS */}
            <button
              onClick={() => setSupplierDetailsTab('sales')}
              className={`p-3 rounded-2xl border text-right transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between h-[100px] ${
                supplierDetailsTab === 'sales'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/10 shadow-xs font-semibold'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className={`text-[10px] font-black ${supplierDetailsTab === 'sales' ? 'text-amber-800' : 'text-slate-400'}`}>
                  إجمالي المبيعات للعملاء
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${supplierDetailsTab === 'sales' ? 'bg-amber-500 animate-pulse' : 'bg-transparent'}`}></span>
              </div>
              <p className={`text-base font-black font-mono leading-tight ${supplierDetailsTab === 'sales' ? 'text-amber-900' : 'text-slate-800'}`}>
                {formatPrice(supplierHistory.stats.totalSoldValue)}
              </p>
              <p className="text-[9px] text-slate-400 font-medium truncate">تكلفة البضائع التي تم بيعها وصرفها</p>
            </button>

            {/* Card 2: Payments Ledger */}
            <button
              onClick={() => setSupplierDetailsTab('payments')}
              className={`p-3 rounded-2xl border text-right transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between h-[100px] ${
                supplierDetailsTab === 'payments'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs font-semibold'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className={`text-[10px] font-black ${supplierDetailsTab === 'payments' ? 'text-emerald-800' : 'text-slate-400'}`}>
                  إجمالي المبالغ المسددة
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${supplierDetailsTab === 'payments' ? 'bg-emerald-500 animate-pulse' : 'bg-transparent'}`}></span>
              </div>
              <p className={`text-base font-black font-mono leading-tight ${supplierDetailsTab === 'payments' ? 'text-emerald-900' : 'text-emerald-800'}`}>
                {formatPrice(supplierHistory.stats.totalPayments)}
              </p>
              <p className="text-[9px] text-slate-400 font-medium truncate">إجمالي الدفعات المسلمة للتاجر</p>
            </button>

            {/* Card 3: Stock Value */}
            <button
              onClick={() => setSupplierDetailsTab('products')}
              className={`p-3 rounded-2xl border text-right transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between h-[100px] ${
                supplierDetailsTab === 'products'
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/10 shadow-xs font-semibold'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className={`text-[10px] font-black ${supplierDetailsTab === 'products' ? 'text-indigo-800' : 'text-slate-400'}`}>
                  قيمة البضاعة الحالية بالمخزن
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${supplierDetailsTab === 'products' ? 'bg-indigo-500 animate-pulse' : 'bg-transparent'}`}></span>
              </div>
              <p className={`text-base font-black font-mono leading-tight ${supplierDetailsTab === 'products' ? 'text-indigo-900' : 'text-slate-800'}`}>
                {formatPrice(supplierHistory.stats.currentInventoryValue)}
              </p>
              <p className="text-[9px] text-slate-400 font-medium truncate">قيمة المخزون المتبقي بسعر الجملة</p>
            </button>

            {/* Card 4: Stock Qty */}
            <button
              onClick={() => setSupplierDetailsTab('stock_qty')}
              className={`p-3 rounded-2xl border text-right transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between h-[100px] ${
                supplierDetailsTab === 'stock_qty'
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/10 shadow-xs font-semibold'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className={`text-[10px] font-black ${supplierDetailsTab === 'stock_qty' ? 'text-blue-800' : 'text-slate-400'}`}>
                  الكميات الحالية بالمستودع
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${supplierDetailsTab === 'stock_qty' ? 'bg-blue-500 animate-pulse' : 'bg-transparent'}`}></span>
              </div>
              <p className={`text-base font-black font-mono leading-tight ${supplierDetailsTab === 'stock_qty' ? 'text-blue-900' : 'text-blue-800'}`}>
                {supplierHistory.stats.currentInventoryStock} قطعة
              </p>
              <p className="text-[9px] text-slate-400 font-medium truncate">إجمالي كمية القطع المتوفرة للبيع</p>
            </button>
          </div>

          {/* Section Separator & Heading */}
          <div className="pt-2">
            {supplierDetailsTab === 'sales' && (
              <h4 className="text-xs font-black text-amber-800 flex items-center gap-1">
                <span>📈</span>
                <span>تفاصيل مبيعات البضائع وتصريفها للعملاء</span>
              </h4>
            )}
            {supplierDetailsTab === 'payments' && (
              <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1">
                <span>💸</span>
                <span>سجل حوالات السداد والدفعات المسلمة للمورد</span>
              </h4>
            )}
            {supplierDetailsTab === 'products' && (
              <h4 className="text-xs font-black text-indigo-800 flex items-center gap-1">
                <span>📦</span>
                <span>قائمة الأصناف وقيمة المخزون الحالي بسعر الجملة</span>
              </h4>
            )}
            {supplierDetailsTab === 'stock_qty' && (
              <h4 className="text-xs font-black text-blue-800 flex items-center gap-1">
                <span>📥</span>
                <span>حركة التوريدات اليدوية ومخزون البداية للأصناف</span>
              </h4>
            )}
          </div>

          {/* Dynamic Details Panels based on Card Selected */}
          
          {/* --- SUB-VIEW: SALES LOGS DETAILED --- */}
          {supplierDetailsTab === 'sales' && (() => {
            const allLogs = supplierHistory.inventoryLogs || [];
            const salesLogs = allLogs.filter(log => log.change_amount < 0);
            
            return (
              <div className="space-y-3.5">
                {/* Financial Progress & Target Info */}
                {supplierHistory.stats.totalSoldValue > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">نسبة سداد قيمة المبيعات</span>
                      <span className="text-emerald-600">
                        {Math.min(100, Math.round((supplierHistory.stats.totalPayments / supplierHistory.stats.totalSoldValue) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round((supplierHistory.stats.totalPayments / supplierHistory.stats.totalSoldValue) * 100))}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-normal">
                      تم تسديد <strong className="text-emerald-600 font-mono">{formatPrice(supplierHistory.stats.totalPayments)}</strong> من إجمالي قيمة مبيعاته المستحقة والبالغة <strong className="text-slate-700 font-mono">{formatPrice(supplierHistory.stats.totalSoldValue)}</strong>.
                    </p>
                  </div>
                )}

                {/* Quantities Sold Performance */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2.5">
                  <span className="text-[10px] text-slate-400 font-black block">تحليل حركة القطع</span>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50/50 p-2 rounded-xl">
                      <p className="text-[9px] text-slate-400 font-bold">إجمالي المستلم</p>
                      <p className="text-xs font-black text-slate-700 font-mono">{supplierHistory.stats.totalReceivedQuantity} قطعة</p>
                    </div>
                    <div className="bg-indigo-50/50 p-2 rounded-xl">
                      <p className="text-[9px] text-indigo-500 font-bold">إجمالي المباع</p>
                      <p className="text-xs font-black text-indigo-700 font-mono">{supplierHistory.stats.totalSoldQuantity} قطعة</p>
                    </div>
                  </div>
                  {supplierHistory.stats.totalReceivedQuantity > 0 && (
                    <div className="space-y-1 pt-1.5">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400">
                        <span>معدل تصريف الكميات</span>
                        <span>{Math.round((supplierHistory.stats.totalSoldQuantity / supplierHistory.stats.totalReceivedQuantity) * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{ width: `${Math.min(100, Math.round((supplierHistory.stats.totalSoldQuantity / supplierHistory.stats.totalReceivedQuantity) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sales Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                  {salesLogs.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-slate-400 text-xs font-bold">لا توجد مبيعات مسجلة لهذا المورد حتى الآن</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black">
                            <th className="py-2 px-3">المنتج / الصنف</th>
                            <th className="py-2 px-3 text-center">الكمية المباعة</th>
                            <th className="py-2 px-3 text-center">تكلفة الحبة</th>
                            <th className="py-2 px-3 text-center">الإجمالي</th>
                            <th className="py-2 px-3 text-left">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {salesLogs.map((log, idx) => {
                            const costPrice = log.cost_price || 0;
                            const totalCost = Math.abs(log.change_amount) * costPrice;
                            const badgeStyle = getProductBadgeStyles(log.product_name || '');
                            return (
                              <tr key={`supp-sale-log-${log.id ?? 'log'}-${idx}`} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${badgeStyle.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}></span>
                                    {log.product_name}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-black text-rose-600 font-mono">
                                  {log.change_amount} قطعة
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                                  {formatPrice(costPrice)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-extrabold text-slate-700 font-mono">
                                  {formatPrice(totalCost)}
                                </td>
                                <td className="py-2.5 px-3 text-left text-[9px] text-slate-400 font-mono">
                                  {formatDateWithDay(log.created_at)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* --- SUB-VIEW: PAYMENTS LEDGER --- */}
          {supplierDetailsTab === 'payments' && (
            <div className="space-y-3">
              {(!supplierHistory.payments || supplierHistory.payments.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wallet className="text-slate-300 w-6 h-6" />
                  </div>
                  <p className="text-slate-400 text-xs font-bold">لا توجد دفعات مالية مسجلة لهذا المورد</p>
                </div>
              ) : (
                supplierHistory.payments.map((pay, idx) => (
                  <div 
                    key={`supp-payment-${pay.id ?? 'pay'}-${idx}`} 
                    onClick={() => setSelectedSupplierPayment({ ...pay, supplier_name: showSupplierDetails.name })}
                    className={`bg-white p-4 rounded-2xl border-r-4 ${pay.amount < 0 ? 'border-r-amber-500' : 'border-r-emerald-500'} shadow-xs flex flex-col gap-2 cursor-pointer hover:bg-slate-50 active:scale-[0.99] transition-all`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">
                          {pay.payment_date ? formatDateWithDay(pay.payment_date) : ''}
                        </span>
                        {pay.notes && (
                          <span className={`inline-flex items-center gap-1.5 text-[10px] ${pay.amount < 0 ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'} px-2 py-0.5 rounded-full font-bold max-w-[130px] sm:max-w-[220px] truncate`} title={pay.notes}>
                            <FileText className={`w-2.5 h-2.5 ${pay.amount < 0 ? 'text-amber-600' : 'text-emerald-600'} shrink-0`} />
                            <span className="truncate">{pay.notes}</span>
                          </span>
                        )}
                      </div>
                      
                      <span className={`font-extrabold ${pay.amount < 0 ? 'text-amber-700' : 'text-emerald-700'} font-mono text-base whitespace-nowrap`}>
                        {formatPrice(pay.amount)}
                      </span>
                    </div>
                    {pay.notes ? (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 line-clamp-1 hover:line-clamp-none transition-all">
                        {pay.notes}
                      </p>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-1 italic">اضغط لمشاهدة تفاصيل السند...</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* --- SUB-VIEW: PRODUCTS LIST (STOCK VALUE) --- */}
          {supplierDetailsTab === 'products' && (
            <div className="space-y-3">
              {(!supplierHistory.products || supplierHistory.products.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="text-slate-300 w-6 h-6" />
                  </div>
                  <p className="text-slate-400 text-xs font-bold">لا توجد منتجات مسجلة تتبع هذا المورد</p>
                </div>
              ) : (
                supplierHistory.products.map((prod, idx) => {
                  const prodLogs = supplierHistory.inventoryLogs.filter(l => l.product_id === prod.id);
                  const soldQty = prodLogs.filter(l => l.reason === 'sale').reduce((sum, l) => sum + Math.abs(l.change_amount), 0) - prodLogs.filter(l => l.reason === 'sale_cancel').reduce((sum, l) => sum + l.change_amount, 0);
                  const suppliedQty = prodLogs.filter(l => l.change_amount > 0 && l.reason !== 'sale_cancel').reduce((sum, l) => sum + l.change_amount, 0);

                  let stockBadgeClass = '';
                  let stockText = '';
                  if (prod.stock_quantity === 0) {
                    stockBadgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
                    stockText = 'نفذت الكمية';
                  } else if (prod.stock_quantity < 5) {
                    stockBadgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
                    stockText = `مخزون منخفض: ${prod.stock_quantity}`;
                  } else {
                    stockBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    stockText = `متوفر: ${prod.stock_quantity}`;
                  }

                  return (
                    <div key={`supp-prod-${prod.id ?? 'prod'}-${idx}`} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 hover:shadow-sm transition-all flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800 text-sm">{prod.name}</p>
                          <div className="flex gap-2.5 text-[10px] text-slate-400">
                            <span>تكلفة الجملة: <strong className="text-slate-600 font-mono">{formatPrice(prod.cost_price)}</strong></span>
                            <span>•</span>
                            <span>سعر البيع: <strong className="text-emerald-600 font-mono">{formatPrice(prod.sale_price)}</strong></span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-lg ${stockBadgeClass}`}>
                          {stockText}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl text-center text-[10px]">
                        <div className="border-l border-slate-200/60">
                          <p className="text-slate-400 font-bold">إجمالي المستلم تاريخياً</p>
                          <p className="text-xs font-black font-mono text-slate-700 mt-0.5">{suppliedQty} قطعة</p>
                        </div>
                        <div className="border-l border-slate-200/60">
                          <p className="text-slate-400 font-bold">إجمالي القطع المباعة</p>
                          <p className="text-xs font-black font-mono text-indigo-700 mt-0.5">{soldQty} قطعة</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold">إجمالي قيمة المخزن</p>
                          <p className="text-xs font-black font-mono text-emerald-700 mt-0.5">{formatPrice(prod.stock_quantity * prod.cost_price)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* --- SUB-VIEW: STOCK QUANTITY & ADDITIONS --- */}
          {supplierDetailsTab === 'stock_qty' && (() => {
            const allLogs = supplierHistory.inventoryLogs || [];
            const relevantLogs = allLogs.filter(log => ['initial', 'manual_update', 'refund'].includes(log.reason));
            
            return (
              <div className="space-y-3.5">
                {/* Summary of stock additions */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center text-right">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-black block">إجمالي حركة المخزون</span>
                    <p className="text-[9px] text-slate-400 max-w-[240px]">يشمل مخزون التأسيس، التوريد الإضافي، والتحديثات والمرتجعات.</p>
                  </div>
                  <div className="bg-blue-50/70 p-2.5 rounded-xl shrink-0 text-left">
                    <span className="text-[9px] text-blue-600 font-bold block">صافي الحركة</span>
                    <strong className="text-xs font-black text-blue-950 font-mono font-bold">
                      {relevantLogs.reduce((sum, l) => sum + l.change_amount, 0)} قطعة
                    </strong>
                  </div>
                </div>

                {/* Inventory Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                  {relevantLogs.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-slate-400 text-xs font-bold">لا توجد عمليات مخزنية مسجلة لهذا المورد</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black">
                            <th className="py-2 px-3">اسم المنتج / الصنف</th>
                            <th className="py-2 px-3 text-center">الكمية</th>
                            <th className="py-2 px-3 text-center">النوع / السبب</th>
                            <th className="py-2 px-3 text-left">التاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {relevantLogs.map((log, idx) => {
                            const isReturn = log.reason === 'refund';
                            const isWithdrawal = log.reason === 'manual_update' && log.change_amount < 0;
                            const isUpdate = log.reason === 'manual_update' && log.change_amount > 0;
                            const badgeStyle = getProductBadgeStyles(log.product_name || '');
                            return (
                              <tr key={`supp-stock-log-${log.id ?? 'log'}-${idx}`} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${badgeStyle.bg} shadow-sm transition-all duration-300 hover:shadow-md hover:ring-2 hover:ring-offset-1 ${isReturn ? 'hover:ring-rose-200' : isWithdrawal ? 'hover:ring-amber-200' : isUpdate ? 'hover:ring-sky-200' : 'hover:ring-indigo-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}></span>
                                    {isReturn ? <RotateCcw size={10} /> : isWithdrawal ? <PackageMinus size={10} /> : isUpdate ? <RefreshCw size={10} /> : <PackagePlus size={10} />}
                                    {log.product_name}
                                  </span>
                                  {log.notes && <span className="text-[9px] text-slate-400 block mt-1 pr-2">📝 {log.notes}</span>}
                                </td>
                                <td className={`py-2.5 px-3 text-center font-black font-mono ${log.change_amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {log.change_amount > 0 ? '+' : ''}{log.change_amount} قطعة
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                    isReturn 
                                      ? 'bg-rose-50 text-rose-700' 
                                      : isWithdrawal
                                        ? 'bg-amber-50 text-amber-700'
                                        : isUpdate
                                          ? 'bg-sky-50 text-sky-700'
                                          : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    {isReturn ? 'مرتجع' : isWithdrawal ? 'سحب' : isUpdate ? 'تحديث مخزون' : 'توريد/أساسي'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-left text-[9px] text-slate-400 font-mono">
                                  {formatDateWithDay(log.created_at)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-white border-t border-slate-100">
          <Button 
            className="w-full py-4 rounded-2xl shadow-lg shadow-amber-100 cursor-pointer text-center font-bold"
            onClick={() => {
              verifyAdminPermission('supplier_payment', () => {
                setShowSupplierPaymentModal(showSupplierDetails);
                setShowSupplierDetails(null);
              }, '💸 تسديد دفعة مالية للمورد');
            }}
          >
            تسديد دفعة مالية للمورد
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
