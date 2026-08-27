import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Search, 
  UserPlus, 
  Trash2,
  Edit2,
  SlidersHorizontal
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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

export const CustomersView: React.FC<CustomersViewProps> = ({
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
  const [sortType, setSortType] = useState<'newest' | 'oldest' | 'debt_desc' | 'debt_asc' | 'name_asc'>('newest');

  // Sorting logic
  const sortedCustomers = [...customers].sort((a, b) => {
    switch (sortType) {
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

  return (
    <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer">
            <Home className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">الزبائن والديون</h2>
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-white shadow-2xs hover:bg-slate-50 transition-all border-slate-200 text-slate-700 font-bold" onClick={() => setShowAddCustomer(true)}>
          <UserPlus className="w-4 h-4" /> زبون جديد
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5 pointer-events-none" />
          <input 
            type="text" 
            placeholder="ابحث عن زبون بالاسم..." 
            className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 placeholder-slate-400 shadow-2xs transition-all"
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
          />
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
             <option value="newest">آخر إضافة (الأحدث)</option>
             <option value="oldest">تاريخ الإضافة (الأقدم)</option>
             <option value="debt_desc">الأعلى مديونية (عليه ديون)</option>
             <option value="debt_asc">الأعلى دائنية (له رصيد)</option>
             <option value="name_asc">أبجدياً (أ - ي)</option>
           </select>
        </div>
      </div>

      <div className="space-y-2">
        {sortedCustomers
          .filter(c => c.name.includes(customerSearchTerm))
          .map((c, idx) => (
            <Card 
              key={`customer-card-${c.id ?? 'no-id'}-${idx}`} 
              className="flex justify-between items-center cursor-pointer active:bg-slate-50 p-4 border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-xs"
              onClick={() => fetchCustomerHistory(c)}
            >
              <div className="text-right">
                <p className="font-bold text-slate-800">{c.name}</p>
                <p className="text-sm text-slate-500">{c.phone || 'بدون رقم هاتف'}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-bold">
                    {c.balance > 0 ? 'الرصيد المستحق (دين)' : c.balance < 0 ? 'رصيد دائن (دفعة مقدمة)' : 'الرصيد خالص'}
                  </p>
                  <p className={`font-bold text-sm ${c.balance > 0 ? 'text-red-500' : c.balance < 0 ? 'text-emerald-600 font-black' : 'text-slate-500'}`}>
                    {c.balance < 0 ? formatPrice(Math.abs(c.balance)) : formatPrice(c.balance)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowPaymentModal(c); }}
                    className={`font-semibold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      c.balance > 0 
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {c.balance > 0 ? 'سداد متبقي' : 'إيداع مقدم'}
                  </button>
                  {setEditingCustomer && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); }}
                      className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg cursor-pointer transition-colors"
                      title="تعديل بيانات العميل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id!); }}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg cursor-pointer transition-colors"
                    title="حذف العميل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
        ))}
      </div>
    </motion.div>
  );
};

export default CustomersView;
