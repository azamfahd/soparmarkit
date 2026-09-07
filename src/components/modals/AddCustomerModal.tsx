import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, AlertTriangle, CheckCircle2, Phone, Wallet, ExternalLink, Sparkles, X, User } from 'lucide-react';
import { Button } from '../ui/Button';

export interface AddCustomerModalProps {
  showAddCustomer: boolean;
  setShowAddCustomer: (val: boolean) => void;
  handleAddCustomer: (customer: any, resetForm: () => void) => void;
  customers?: any[];
  formatPrice?: (price: number) => string;
  onSelectExistingCustomer?: (customer: any) => void;
  fetchCustomerHistory?: (customer: any) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  showAddCustomer,
  setShowAddCustomer,
  handleAddCustomer,
  customers = [],
  formatPrice = (p: number) => `${p.toLocaleString('en-US')}`,
  onSelectExistingCustomer,
  fetchCustomerHistory,
}) => {
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', initialDebt: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check in real-time if a customer with the exact same name exists
  const trimmedName = newCustomer.name.trim();

  const exactDuplicate = useMemo(() => {
    if (!trimmedName || !customers || customers.length === 0) return null;
    return customers.find(
      (c) => c.name && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
  }, [trimmedName, customers]);

  // Check for similar / partially matching names
  const similarCustomers = useMemo(() => {
    if (!trimmedName || trimmedName.length < 2 || !customers || exactDuplicate) return [];
    const lower = trimmedName.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name &&
          c.name.trim().toLowerCase() !== lower &&
          c.name.toLowerCase().includes(lower)
      )
      .slice(0, 3);
  }, [trimmedName, customers, exactDuplicate]);

  const handleSave = () => {
    setErrorMessage(null);

    if (!trimmedName) {
      setErrorMessage('يرجى إدخال اسم العميل أولاً');
      return;
    }

    if (exactDuplicate) {
      setErrorMessage(`العميل "${exactDuplicate.name}" مسجل بالفعل! يرجى تغيير الاسم أو إضافة تمييز له.`);
      return;
    }

    handleAddCustomer(newCustomer, () => {
      setNewCustomer({ name: '', phone: '', initialDebt: '' });
      setErrorMessage(null);
    });
  };

  // Helper to distinguish name automatically
  const handleAutoDistinguish = () => {
    if (!exactDuplicate) return;
    let nextNum = 2;
    let proposed = `${trimmedName} (${nextNum})`;
    while (customers.some((c) => c.name.trim().toLowerCase() === proposed.toLowerCase())) {
      nextNum += 1;
      proposed = `${trimmedName} (${nextNum})`;
    }
    setNewCustomer((prev) => ({ ...prev, name: proposed }));
    setErrorMessage(null);
  };

  // Helper to select/open existing customer
  const handleUseExisting = (customer: any) => {
    setShowAddCustomer(false);
    if (onSelectExistingCustomer) {
      onSelectExistingCustomer(customer);
    } else if (fetchCustomerHistory) {
      fetchCustomerHistory(customer);
    }
  };

  if (!showAddCustomer) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs"
      dir="rtl"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">إضافة عميل جديد</h3>
              <p className="text-xs text-slate-400 font-medium">تسجيل زبون جديد في سجلات النظام والديون</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddCustomer(false)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inline Error Message if any */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Customer Name Input */}
        <div className="space-y-1.5 text-right">
          <label className="text-xs text-slate-600 font-bold block flex items-center justify-between">
            <span>اسم العميل الكامل <span className="text-red-500">*</span></span>
            {exactDuplicate && (
              <span className="text-[11px] font-black text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> مكرر في النظام
              </span>
            )}
          </label>
          <div className="relative">
            <input
              placeholder="مثال: أحمد محمد القحطاني"
              className={`w-full p-3 pr-10 text-sm font-bold bg-slate-50 border rounded-2xl transition-all outline-none ${
                exactDuplicate
                  ? 'border-amber-400 bg-amber-50/30 text-amber-950 focus:ring-2 focus:ring-amber-400'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
              value={newCustomer.name}
              onChange={(e) => {
                setNewCustomer({ ...newCustomer, name: e.target.value });
                if (errorMessage) setErrorMessage(null);
              }}
              autoFocus
            />
            <User className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* DUPLICATE WARNING BOX (Triggered when exact duplicate is detected) */}
        <AnimatePresence>
          {exactDuplicate && (
            <motion.div
              key="exact-duplicate-warning"
              initial={{ opacity: 0, height: 0, scale: 0.96 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-sm text-right">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-black text-amber-900 leading-tight">
                      تنبيه: العميل &quot;{exactDuplicate.name}&quot; مسجل مسبقاً في النظام!
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium">
                      لتجنب الخلط بين الحسابات وتكرار الأرصدة، يرجى تمييز الاسم أو استخدام الحساب الحالي.
                    </p>
                  </div>
                </div>

                {/* Existing Customer Summary Card */}
                <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-amber-200/70 flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">معلومات الحساب المسجل:</span>
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{exactDuplicate.phone || 'بدون رقم هاتف'}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {exactDuplicate.balance > 0
                        ? 'المديونية الحالية'
                        : exactDuplicate.balance < 0
                        ? 'رصيد دائن'
                        : 'الحساب'}
                    </span>
                    <span
                      className={`font-black font-mono text-xs ${
                        exactDuplicate.balance > 0
                          ? 'text-red-600'
                          : exactDuplicate.balance < 0
                          ? 'text-emerald-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {exactDuplicate.balance !== 0 ? formatPrice(Math.abs(exactDuplicate.balance)) : 'خالص (0)'}
                    </span>
                  </div>
                </div>

                {/* Action buttons to resolve duplicate */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUseExisting(exactDuplicate)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                    استخدام الملف الحالي
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoDistinguish}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    تمييز الاسم تلقائياً
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Similar Names Hint (Non-blocking) */}
        {!exactDuplicate && similarCustomers.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-right space-y-1">
            <span className="text-[10px] text-slate-500 font-bold block">💡 أسماء مشابهة مسجلة في النظام:</span>
            <div className="flex flex-wrap gap-1.5">
              {similarCustomers.map((c, idx) => (
                <button
                  key={`sim-cust-${c.id ?? 'noid'}-${idx}`}
                  type="button"
                  onClick={() => handleUseExisting(c)}
                  className="text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>{c.name}</span>
                  {c.phone && <span className="text-[9px] text-slate-400">({c.phone})</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phone Number Input */}
        <div className="space-y-1.5 text-right">
          <label className="text-xs text-slate-600 font-bold block pr-1">رقم الهاتف :</label>
          <div className="relative">
            <input
              placeholder="مثال: 777123456 (اختياري)"
              type="tel"
              className="w-full p-3 pr-10 text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
            <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Initial Debt Input */}
        <div className="space-y-1.5 text-right">
          <label className="text-xs text-slate-600 font-bold block pr-1">الدين السابق المستحق (إن وجد) :</label>
          <div className="relative">
            <input
              placeholder="0.00"
              type="number"
              className="w-full p-3 pr-10 text-sm font-bold font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              value={newCustomer.initialDebt}
              onChange={(e) => setNewCustomer({ ...newCustomer, initialDebt: e.target.value })}
            />
            <Wallet className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-400 block pr-1">
            استخدم هذا الحقل لتسجيل أي ديون قديمة ومستحقة على الزبون قبل بدء استخدامه للبرنامج.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button
            className={`flex-1 py-3 text-sm font-black rounded-2xl shadow-lg transition-all ${
              exactDuplicate
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
            }`}
            onClick={handleSave}
          >
            {exactDuplicate ? 'تعديل الاسم أولاً للحفظ' : 'حفظ بيانات العميل'}
          </Button>
          <Button
            variant="secondary"
            className="py-3 px-5 text-sm font-bold rounded-2xl"
            onClick={() => setShowAddCustomer(false)}
          >
            إلغاء
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddCustomerModal;
