import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Plus, 
  Search, 
  Users 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface SuppliersViewProps {
  setActiveTab: (tab: string) => void;
  setShowAddSupplier: (show: boolean) => void;
  suppliers: any[];
  fetchSupplierHistory: (supplier: any) => void;
  formatPrice: (price: number) => string;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  setActiveTab,
  setShowAddSupplier,
      suppliers,
  fetchSupplierHistory,
  formatPrice,
}) => {
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');

  return (
    <motion.div 
      key="suppliers"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
            <Home className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight text-right">إدارة الموردين والشركات</h2>
        </div>
        <Button variant="outline" className="flex items-center gap-2 rounded-2xl" onClick={() => setShowAddSupplier(true)}>
          <Plus className="w-4 h-4" /> إضافة مورد جديد
        </Button>
      </div>

      <div className="bg-amber-100/30 border border-amber-100 p-3 rounded-2xl mb-4">
        <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
          💡 هنا يمكنك تصفية حسابات الموردين بالتكلفة. عند بيع أي منتج مرتبط بمورد، يتم إضافة "سعر التكلفة" تلقائياً لرصيد المورد المستحق.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-3.5 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="ابحث عن مورد بالاسم..." 
          className="w-full p-3.5 pr-11 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all text-right"
          value={supplierSearchTerm}
          onChange={(e) => setSupplierSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {suppliers
          .filter(s => s.name.includes(supplierSearchTerm))
          .map((s, idx) => (
          <Card 
            key={`supplier-card-list-${s.id ?? 'no-id'}-${idx}`} 
            className="hover:border-amber-200 transition-all cursor-pointer p-0 overflow-hidden bg-white border border-slate-100/60 shadow-xs" 
            onClick={() => fetchSupplierHistory(s)}
          >
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-xs border border-amber-100/50">
                  {s.name.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-800">{s.name}</p>
                  <p className="text-[11px] text-slate-400 font-bold">{s.phone || 'لم يسجل رقم هاتف'}</p>
                </div>
              </div>
              <div className="text-left bg-slate-50/70 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100/60 transition-colors hover:bg-slate-100/70">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">المستحق للمورد (بالتكلفة)</p>
                <p className={`font-mono font-black text-sm ${s.balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {formatPrice(s.balance)}
                </p>
              </div>
            </div>
          </Card>
        ))}
        
        {suppliers.filter(s => s.name.includes(supplierSearchTerm)).length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold">لم يتم العثور على موردين.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAddSupplier(true)}>أضف موردك الأول الآن</Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SuppliersView;
