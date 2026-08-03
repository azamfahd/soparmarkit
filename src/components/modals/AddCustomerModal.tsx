import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';

export interface AddCustomerModalProps {
  showAddCustomer: boolean;
  setShowAddCustomer: (val: boolean) => void;
    handleAddCustomer: (customer: any, resetForm: () => void) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  showAddCustomer,
  setShowAddCustomer,
    handleAddCustomer,
}) => {

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', initialDebt: '' });

  const handleSave = () => {
    handleAddCustomer(newCustomer, () => {
      setNewCustomer({ name: '', phone: '', initialDebt: '' });
    });
  };

  if (!showAddCustomer) return null;

  return (
    <div key="modal-add-customer" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <h3 className="text-xl font-bold text-slate-800">إضافة زبون جديد</h3>
        
        <div className="space-y-1 text-right">
          <label className="text-xs text-slate-500 font-bold block pr-1">اسم الزبون :</label>
          <input placeholder="اسم الزبون الكامل" className="w-full p-3 bg-slate-100 rounded-xl" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
        </div>
        
        <div className="space-y-1 text-right">
          <label className="text-xs text-slate-500 font-bold block pr-1">رقم الهاتف :</label>
          <input placeholder="رقم الهاتف (اختياري)" className="w-full p-3 bg-slate-100 rounded-xl" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
        </div>

        <div className="space-y-1 text-right">
          <label className="text-xs text-slate-500 font-bold block pr-1">الدين السابق المستحق (إن وجد) :</label>
          <input 
            placeholder="رصيد دين سابق متبقي على الزبون" 
            type="number" 
            className="w-full p-3 bg-slate-100 rounded-xl" 
            value={newCustomer.initialDebt} 
            onChange={e => setNewCustomer({...newCustomer, initialDebt: e.target.value})} 
          />
          <p className="text-[10px] text-slate-400 block pr-1">استخدم هذا الحقل لتسجيل المبالغ والديون القديمة والمستحقة على الزبون قبل بدء استخدامه للبرنامج.</p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button className="flex-1" onClick={handleSave}>حفظ البيانات</Button>
          <Button variant="secondary" onClick={() => setShowAddCustomer(false)}>إلغاء</Button>
        </div>
      </motion.div>
    </div>
  );
};
