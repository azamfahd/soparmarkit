import React, { useState, useMemo, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Search, 
  UserPlus, 
  Trash2,
  Edit2,
  SlidersHorizontal,
  ShoppingBag,
  Clock,
  Phone,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { db } from '../../db';
import { useLiveQuery } from '../../hooks/useLiveQuery';

interface CustomersViewProps {
  setActiveTab: (tab: string) => void;
  setShowAddCustomer: (show: boolean) => void;
  customers: any[];
  fetchCustomerHistory: (customer: any) => void;
  formatPrice: (price: number) => string;
  setShowPaymentModal: (customer: any) => void;
  handleDeleteCustomer: (id: number) => void;
  setEditingCustomer?: (customer: any) => void;
}

const CustomersViewComponent: React.FC<CustomersViewProps> = ({
  setActiveTab,
  setShowAddCustomer,
  customers,
  fetchCustomerHistory,
  formatPrice,
  setShowPaymentModal,
  handleDeleteCustomer,
  setEditingCustomer,
}) => {
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [sortType, setSortType] = useState<
    'last_sale_desc' | 'last_sale_asc' | 'newest' | 'oldest' | 'debt_desc' | 'debt_asc' | 'name_asc'
  >(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('customer_view_sort_type');
      const validSorts = ['last_sale_desc', 'last_sale_asc', 'newest', 'oldest', 'debt_desc', 'debt_asc', 'name_asc'];
      if (saved && validSorts.includes(saved)) {
        return saved as any;
      }
    }
    return 'newest';
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('customer_view_sort_type', sortType);
    }
  }, [sortType]);

  // Fetch all sales that have customer_id to calculate last sale per customer
  const customerSales = useLiveQuery(async () => {
    return await db.sales.where('customer_id').above(0).toArray();
  }) || [];

  // Map each customer ID to their latest sale timestamp and details
  const lastSaleByCustomer = useMemo(() => {
    const map = new Map<number, { date: string; timestamp: number; total_amount: number; count: number }>();
    for (const s of customerSales) {
      if (s.customer_id) {
        const time = s.created_at ? new Date(s.created_at).getTime() : 0;
        const existing = map.get(s.customer_id);
        if (!existing) {
          map.set(s.customer_id, {
            date: s.created_at,
            timestamp: time,
            total_amount: s.total_amount || 0,
            count: 1
          });
        } else {
          existing.count += 1;
          if (time > existing.timestamp) {
            existing.timestamp = time;
            existing.date = s.created_at;
            existing.total_amount = s.total_amount || 0;
          }
        }
      }
    }
    return map;
  }, [customerSales]);

  // Format relative/Arabic date
  const formatRelativeDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${y}/${m}/${d}`;

    if (diffDays === 0) return `اليوم (${formattedDate})`;
    if (diffDays === 1) return `أمس (${formattedDate})`;
    if (diffDays > 1 && diffDays < 7) return `منذ ${diffDays} أيام (${formattedDate})`;
    if (diffDays >= 7 && diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع (${formattedDate})`;
    return formattedDate;
  };

  // Sorting logic
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      switch (sortType) {
        case 'last_sale_desc': {
          const timeA = lastSaleByCustomer.get(a.id)?.timestamp || 0;
          const timeB = lastSaleByCustomer.get(b.id)?.timestamp || 0;
          if (timeB !== timeA) return timeB - timeA;
          return (b.id || 0) - (a.id || 0);
        }
        case 'last_sale_asc': {
          const timeA = lastSaleByCustomer.get(a.id)?.timestamp || 0;
          const timeB = lastSaleByCustomer.get(b.id)?.timestamp || 0;
          if (timeA === 0 && timeB > 0) return 1;
          if (timeB === 0 && timeA > 0) return -1;
          if (timeA !== timeB) return timeA - timeB;
          return (a.id || 0) - (b.id || 0);
        }
        case 'newest':
          return (b.id || 0) - (a.id || 0);
        case 'oldest':
          return (a.id || 0) - (b.id || 0);
        case 'debt_desc':
          return (b.balance || 0) - (a.balance || 0);
        case 'debt_asc':
          return (a.balance || 0) - (b.balance || 0);
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '', 'ar');
        default:
          return 0;
      }
    });
  }, [customers, sortType, lastSaleByCustomer]);

  // Search filter
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return sortedCustomers;
    const term = customerSearchTerm.toLowerCase().trim();
    return sortedCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(term) ||
      (c.phone || '').includes(term) ||
      (c.notes || '').toLowerCase().includes(term)
    );
  }, [sortedCustomers, customerSearchTerm]);

  return (
    <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer">
            <Home className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">الزبائن والديون</h2>
            <p className="text-xs text-slate-500 font-medium">إدارة حسابات العملاء، سجل المبيعات، ومتابعة الأرصدة</p>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-white shadow-2xs hover:bg-slate-50 transition-all border-slate-200 text-slate-700 font-bold" onClick={() => setShowAddCustomer(true)}>
          <UserPlus className="w-4 h-4" /> زبون جديد
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <input 
            type="text" 
            placeholder="ابحث عن زبون بالاسم أو رقم الهاتف..." 
            className="w-full p-3 pr-10 pl-9 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 placeholder-slate-400 shadow-2xs transition-all font-bold text-sm"
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
          />
          {customerSearchTerm && (
            <button
              type="button"
              onClick={() => setCustomerSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="shrink-0 flex items-center bg-emerald-50/80 border border-emerald-200 rounded-xl shadow-sm pl-2 pr-3 overflow-hidden transition-all hover:bg-emerald-100/80 hover:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-500/20 cursor-pointer">
           <SlidersHorizontal className="w-4 h-4 text-emerald-600 ml-2" />
           <span className="text-xs font-extrabold text-emerald-800 whitespace-nowrap">ترتيب:</span>
           <select
             value={sortType}
             onChange={(e) => setSortType(e.target.value as any)}
             className="p-3 bg-transparent border-none outline-none text-sm font-black text-emerald-950 cursor-pointer transition-colors appearance-none pr-8 relative z-10"
             style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 0.5rem center', backgroundSize: '1em' }}
           >
             <option value="last_sale_desc">🛒 آخر عملية بيع (الأحدث)</option>
             <option value="last_sale_asc">⏱️ أقدم عملية بيع (المنقطعون)</option>
             <option value="newest">✨ آخر إضافة (الأحدث)</option>
             <option value="oldest">📅 تاريخ الإضافة (الأقدم)</option>
             <option value="debt_desc">🔻 الأعلى مديونية (عليه ديون)</option>
             <option value="debt_asc">🔺 الأعلى دائنية (له رصيد)</option>
             <option value="name_asc">🔤 أبجدياً (أ - ي)</option>
           </select>
        </div>
      </div>

      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-600">لا يوجد زبائن مطابقين للبحث</p>
          </Card>
        ) : (
          filteredCustomers.map((c, idx) => {
            const lastSale = lastSaleByCustomer.get(c.id);

            return (
              <Card 
                key={`customer-card-${c.id ?? 'no-id'}-${idx}`} 
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer active:bg-slate-50 p-4 border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all shadow-xs rounded-2xl"
                onClick={() => fetchCustomerHistory(c)}
              >
                <div className="text-right space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 text-base">{c.name}</p>
                    {lastSale ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded-lg font-bold border border-sky-200/70">
                        <ShoppingBag className="w-3 h-3 text-sky-600" />
                        آخر شراء: {formatRelativeDate(lastSale.date)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                        لا توجد مشتريات
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {c.phone || 'بدون رقم هاتف'}
                    </span>
                    {lastSale && lastSale.count > 1 && (
                      <span className="text-[11px] text-slate-400">
                        • {lastSale.count} عملية بيع سابقة
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-right sm:text-left">
                    <p className="text-[10px] text-slate-400 font-bold">
                      {c.balance > 0 ? 'الرصيد المستحق (دين)' : c.balance < 0 ? 'رصيد دائن (دفعة مقدمة)' : 'الرصيد خالص'}
                    </p>
                    <p className={`font-bold text-sm sm:text-base ${c.balance > 0 ? 'text-red-500' : c.balance < 0 ? 'text-emerald-600 font-black' : 'text-slate-500'}`}>
                      {c.balance < 0 ? formatPrice(Math.abs(c.balance)) : formatPrice(c.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowPaymentModal(c); }}
                      className={`font-semibold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs ${
                        c.balance > 0 
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                          : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                      }`}
                    >
                      {c.balance > 0 ? 'سداد متبقي' : 'إيداع مقدم'}
                    </button>
                    {setEditingCustomer && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); }}
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl cursor-pointer transition-colors"
                        title="تعديل بيانات العميل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id!); }}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl cursor-pointer transition-colors"
                      title="حذف العميل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export const CustomersView = memo(CustomersViewComponent);
export default CustomersView;
