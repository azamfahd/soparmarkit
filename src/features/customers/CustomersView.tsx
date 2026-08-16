import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Search, 
  UserPlus, 
  Trash2,
  Edit2
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

  return (
    <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
            <Home className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold">الزبائن والديون</h2>
        </div>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowAddCustomer(true)}>
          <UserPlus className="w-4 h-4" /> زبون جديد
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="ابحث عن زبون..." 
          className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          value={customerSearchTerm}
          onChange={(e) => setCustomerSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {customers
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
