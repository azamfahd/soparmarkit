import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';

export interface AddSupplierModalProps {
  showAddSupplier: boolean;
  setShowAddSupplier: (show: boolean) => void;
    handleAddSupplier: (supplier: any, resetForm: () => void) => void;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  showAddSupplier,
  setShowAddSupplier,
    handleAddSupplier,
}) => {

  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', initialBalance: '' });

  const handleSave = () => {
    handleAddSupplier(newSupplier, () => {
      setNewSupplier({ name: '', phone: '', initialBalance: '' });
    });
  };

  if (!showAddSupplier) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <h3 className="text-xl font-bold text-slate-800">إضافة مورد جديد</h3>
        <div className="space-y-1 text-right">
          <label className="text-xs text-slate-500 font-bold block pr-1">اسم المورد :</label>
          <input 
            placeholder="اسم المورد أو الشركة" 
            className="w-full p-3 bg-slate-100 rounded-xl font-bold" 
            value={newSupplier.name} 
            onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} 
          />
        </div>
        <div className="space-y-1 text-right">
          <label className="text-xs text-slate-500 font-bold block pr-1">رقم الهاتف :</label>
          <input 
            placeholder="رقم الهاتف للتواصل" 
            className="w-full p-3 bg-slate-100 rounded-xl" 
            value={newSupplier.phone} 
            onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} 
          />
        </div>
        <div className="space-y-1 text-right">
          <label className="text-xs text-slate-500 font-bold block pr-1">الرصيد المستحق الحالي للمورد :</label>
          <input 
            placeholder="0.00" 
            type="number" 
            className="w-full p-3 bg-slate-100 rounded-xl font-mono" 
            value={newSupplier.initialBalance} 
            onChange={e => setNewSupplier({...newSupplier, initialBalance: e.target.value})} 
          />
          <p className="text-[10px] text-slate-400 block pr-1">المبلغ الذي تدين به حالياً لهذا المورد قبل بدء التسجيل.</p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button className="flex-1" onClick={handleSave}>حفظ المورد</Button>
          <Button variant="secondary" onClick={() => setShowAddSupplier(false)}>إلغاء</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddSupplierModal;
