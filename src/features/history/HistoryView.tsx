import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Printer, 
  RotateCcw, 
  ChevronLeft 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';

export interface HistoryViewProps {
  setActiveTab: (tab: string) => void;
  enrichedSales: any[];
  historyFilter: 'all' | 'cash' | 'debt';
  setHistoryFilter: (filter: 'all' | 'cash' | 'debt') => void;
  expandedSaleId: number | null;
  handleExpandSale: (saleId: number) => void;
  expandedSaleItems: any[];
  printReceipt: (sale: any) => void;
  verifyAdminPermission: (action: string, onSuccess: () => void, label: string) => void;
  handleRefundSale: (saleId: number) => void;
  formatDateTimeWithDay: (dateStr: string | Date) => string;
  formatPrice: (amount: number) => string;
}

const HistoryViewComponent: React.FC<HistoryViewProps> = ({
  setActiveTab,
  enrichedSales,
  historyFilter,
  setHistoryFilter,
  expandedSaleId,
  handleExpandSale,
  expandedSaleItems,
  printReceipt,
  verifyAdminPermission,
  handleRefundSale,
  formatDateTimeWithDay,
  formatPrice,
}) => {
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    const term = historySearchTerm.trim().toLowerCase();
    return enrichedSales.filter(s => {
      const matchesSearch = !term || 
        (s.customer_name && s.customer_name.toLowerCase().includes(term)) || 
        (s.notes && s.notes.toLowerCase().includes(term)) || 
        String(s.id).includes(term);
      const matchesFilter = historyFilter === 'all' || s.payment_type === historyFilter;
      return matchesSearch && matchesFilter;
    });
  }, [enrichedSales, historySearchTerm, historyFilter]);

  return (
    <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
            <Home className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold">سجل المبيعات</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث برقم الطلب، الزبون، أو الملاحظة..." 
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <select 
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value as any)}
            className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="all">كل الطلبات</option>
            <option value="cash">نقدي (كاش)</option>
            <option value="debt">آجل (دين)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSales.map((s, idx) => (
          <div key={`sale-card-${s.id ?? 'no-id'}-${idx}`} className={`relative group ${expandedSaleId === s.id ? 'z-30' : 'z-10'} transition-all duration-200`}>
            <div className="absolute left-6 top-6 bottom-[-1.5rem] w-0.5 bg-slate-100 -z-10 group-last:hidden" />
            <Card className={`overflow-hidden border transition-all duration-300 ${expandedSaleId === s.id ? 'border-emerald-400 bg-white shadow-xl scale-[1.01]' : 'border-slate-100/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:border-emerald-200 bg-white'}`}>
              <div 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 cursor-pointer ${expandedSaleId === s.id ? 'bg-slate-50/50' : 'bg-white'}`}
                onClick={() => handleExpandSale(s.id!)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border-[3px] border-white shadow-sm transition-transform group-hover:scale-110 ${s.payment_type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {s.payment_type === 'cash' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{s.customer_name}</p>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold leading-none">#{s.id}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      {formatDateTimeWithDay(s.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0 pl-1">
                  {s.notes && (
                    <div className="hidden sm:flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg" title={s.notes}>
                      <FileText className="w-3 h-3" />
                      <p className="text-[10px] max-w-[100px] truncate">{s.notes}</p>
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-bold text-sm text-emerald-700">{formatPrice(s.total_amount)}</p>
                    <p className="text-[9px] uppercase font-bold text-slate-400">{s.payment_type === 'cash' ? 'دفع نقدي' : 'آجل (دين)'}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 sm:border-r border-slate-200 sm:pr-3 sm:mr-1 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); printReceipt(s); }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="طباعة"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        verifyAdminPermission('delete_sale', () => handleRefundSale(s.id!), '🔄 إلغاء وعكس مبيعات الفاتورة');
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="إلغاء العملية"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <ChevronLeft className={`w-4 h-4 text-slate-400 transition-transform ${expandedSaleId === s.id ? 'rotate-[270deg]' : 'rotate-180'}`} />
                  </div>
                </div>
                {/* Mobile Notes */}
                {s.notes && (
                  <div className="sm:hidden mt-2 flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1.5 rounded-lg w-full">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    <p className="text-[10px] line-clamp-1">{s.notes}</p>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {expandedSaleId === s.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 bg-slate-50/80"
                  >
                    <div className="p-3 space-y-1.5">
                      {expandedSaleItems.length > 0 ? (
                        <>
                          <div className="grid grid-cols-4 gap-3 px-3 py-1.5 object-cover bg-slate-200/50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <div className="col-span-2">المنتج</div>
                            <div className="text-center">الكمية</div>
                            <div className="text-left">الإجمالي</div>
                          </div>
                          {expandedSaleItems.map((item, idx) => (
                            <div key={`expanded-sale-item-${item.product_id}-${idx}`} className="grid grid-cols-4 gap-3 px-3 py-1.5 border-b border-slate-200/50 last:border-0 text-xs items-center hover:bg-white rounded-lg transition-colors">
                              <div className="col-span-2 font-bold text-slate-700">{item.product_name}</div>
                              <div className="text-center font-bold bg-white px-2 py-0.5 mx-auto rounded-md flex items-center justify-center border border-slate-100 min-w-[1.75rem] text-[11px] whitespace-nowrap">{item.quantity} {item.product_unit || ''}</div>
                              <div className="text-left font-bold text-emerald-600">{formatPrice(item.price_at_sale * item.quantity)}</div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-6 flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-500 font-bold">جاري تحميل الأصناف...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const HistoryView = memo(HistoryViewComponent);
export default HistoryView;
