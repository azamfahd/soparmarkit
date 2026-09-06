import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, AlertTriangle, Phone, X, User } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EditCustomerModalProps {
  customer: any | null;
  onClose: () => void;
  onUpdateCustomer: (id: number, updatedData: { name: string; phone: string }) => Promise<boolean> | void;
  customers?: any[];
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  onClose,
  onUpdateCustomer,
  customers = [],
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setErrorMessage(null);
    }
  }, [customer]);

  const trimmedName = name.trim();

  // Check for duplicate names (excluding current customer)
  const duplicateCustomer = useMemo(() => {
    if (!trimmedName || !customer || !customers) return null;
    return customers.find(
      (c) =>
        c.id !== customer.id &&
        c.name &&
        c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
  }, [trimmedName, customer, customers]);

  if (!customer) return null;

  const handleSave = async () => {
    setErrorMessage(null);
    if (!trimmedName) {
      setErrorMessage('يرجى إدخال اسم العميل');
      return;
    }
    if (duplicateCustomer) {
      setErrorMessage(`يوجد عميل آخر مسجل باسم "${duplicateCustomer.name}" بالفعل! يرجى اختيار اسم مختلف أو تمييزه.`);
      return;
    }

    await onUpdateCustomer(customer.id, { name: trimmedName, phone: phone.trim() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs"
      dir="rtl"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">تعديل بيانات العميل</h3>
              <p className="text-xs text-slate-400 font-medium">تحديث الاسم ورقم الهاتف</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5 text-right">
          <label className="text-xs text-slate-600 font-bold block">اسم العميل :</label>
          <div className="relative">
            <input
              className={`w-full p-3 pr-10 text-sm font-bold bg-slate-50 border rounded-2xl transition-all outline-none ${
                duplicateCustomer
                  ? 'border-amber-400 bg-amber-50/30 text-amber-950 focus:ring-2 focus:ring-amber-400'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              }`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="اسم العميل"
            />
            <User className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <AnimatePresence>
          {duplicateCustomer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>تنبيه: يوجد عميل آخر بنفس الاسم (&quot;{duplicateCustomer.name}&quot;)! يرجى تمييز الاسم.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5 text-right">
          <label className="text-xs text-slate-600 font-bold block">رقم الهاتف :</label>
          <div className="relative">
            <input
              className="w-full p-3 pr-10 text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الهاتف"
              type="tel"
            />
            <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button
            className="flex-1 py-3 text-sm font-black rounded-2xl shadow-lg bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            onClick={handleSave}
            disabled={!!duplicateCustomer}
          >
            حفظ التعديلات
          </Button>
          <Button
            variant="secondary"
            className="py-3 px-5 text-sm font-bold rounded-2xl"
            onClick={onClose}
          >
            إلغاء
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditCustomerModal;
