import React from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Wallet, 
  History, 
  CreditCard,
  ChevronLeft,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Customer {
  id?: number;
  name: string;
  phone: string;
  balance: number;
}

interface CustomersProps {
  customers: Customer[];
  customerSearchTerm: string;
  setCustomerSearchTerm: (term: string) => void;
  onAddCustomer: () => void;
  onShowDetails: (customer: Customer) => void;
  onShowPayment: (customer: Customer) => void;
  formatPrice: (price: number) => string;
}

const Customers: React.FC<CustomersProps> = ({ 
  customers, 
  customerSearchTerm, 
  setCustomerSearchTerm, 
  onAddCustomer, 
  onShowDetails, 
  onShowPayment,
  formatPrice
}) => {
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.phone.includes(customerSearchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Search & Add Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 w-full md:w-96 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث عن عميل بالاسم أو الهاتف..." 
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full px-2 text-slate-600"
          />
        </div>
        
        <button 
          onClick={onAddCustomer}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          <span>إضافة عميل</span>
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer, idx) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{customer.name}</h4>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone || 'بدون هاتف'}</span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">الرصيد الحالي</span>
              </div>
              <span className={`text-lg font-black ${customer.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {formatPrice(customer.balance)}
              </span>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => onShowPayment(customer)}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                تسديد
              </button>
              <button 
                onClick={() => onShowDetails(customer)}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
              >
                <History className="w-4 h-4" />
                السجل
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">لا يوجد عملاء</h3>
          <p className="text-slate-400">أضف عملاءك لتتبع ديونهم ومشترياتهم</p>
        </div>
      )}
    </div>
  );
};

export default Customers;
