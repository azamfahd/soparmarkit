import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Filter, 
  CheckCircle2, 
  PieChart, 
  Layers,
  Building,
  Zap,
  Users,
  Wrench,
  ShoppingBag,
  Truck,
  HelpCircle
} from 'lucide-react';
import { db, Expense } from '../../db';
import { Button } from '../ui/Button';
import { saveFileToDevice } from '../../utils/fileSaver';

export interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  formatPrice: (amount: number) => string;
  currency: string;
  storeName: string;
  onExpenseChanged?: () => void;
}

export const EXPENSE_CATEGORIES = [
  { id: 'rent', label: 'إيجار المحل', icon: Building, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'electricity', label: 'كهرباء ومياه وخدمات', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'salaries', label: 'رواتب وعمالة', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'maintenance', label: 'صيانة وتصليحات', icon: Wrench, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'supplies', label: 'أكياس ومستلزمات تعبئة', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'transport', label: 'نقل وتوصيل وبنزين', icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'other', label: 'نثريات ومصاريف أخرى', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export const ExpensesModal: React.FC<ExpensesModalProps> = ({
  isOpen,
  onClose,
  formatPrice,
  currency,
  storeName,
  onExpenseChanged
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('CURRENT');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Expense Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('rent');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'bank' | 'other'>('cash');
  const [newNotes, setNewNotes] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const items = await db.expenses.reverse().toArray();
      setExpenses(items);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen]);

  const currentYearMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (selectedMonth === 'CURRENT') {
        if (!exp.date.startsWith(currentYearMonth)) return false;
      } else if (selectedMonth !== 'ALL') {
        if (!exp.date.startsWith(selectedMonth)) return false;
      }
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [expenses, selectedMonth, selectedCategory, currentYearMonth]);

  // Total amount
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredExpenses]);

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    return map;
  }, [filteredExpenses]);

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(amountVal) || amountVal <= 0) {
      return;
    }

    try {
      await db.expenses.add({
        title: newTitle.trim(),
        category: newCategory,
        amount: amountVal,
        date: newDate,
        payment_method: newPaymentMethod,
        notes: newNotes.trim() || undefined,
        created_at: new Date().toISOString()
      });

      setNewTitle('');
      setNewAmount('');
      setNewNotes('');
      setShowAddForm(false);
      await loadExpenses();
      onExpenseChanged?.();
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await db.expenses.delete(id);
        await loadExpenses();
        onExpenseChanged?.();
      } catch (err) {
        console.error('Error deleting expense:', err);
      }
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = async () => {
    if (filteredExpenses.length === 0) return;
    const headers = ['المعرف', 'البند', 'التصنيف', 'المبلغ', 'التاريخ', 'طريقة الدفع', 'الملاحظات'];
    const rows = filteredExpenses.map(item => {
      const cat = EXPENSE_CATEGORIES.find(c => c.id === item.category)?.label || item.category;
      const method = item.payment_method === 'cash' ? 'نقدي' : item.payment_method === 'bank' ? 'حساب بنكي' : 'أخرى';
      return [
        item.id,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${cat}"`,
        item.amount,
        item.date,
        `"${method}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `مصروفات_${storeName}_${new Date().toISOString().split('T')[0]}.csv`;
    await saveFileToDevice(blob, fileName, 'text/csv;charset=utf-8;');
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] p-6 shadow-2xl relative text-right max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">إدارة المصروفات التشغيلية</h3>
              <p className="text-xs text-slate-500 font-bold">تسجيل ومتابعة تكاليف وإيجارات ونفقات المتجر لاحتساب صافي الأرباح الحقيقي</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl">
              <span className="text-[10px] font-black text-rose-600 uppercase">إجمالي المصروفات المسجلة</span>
              <p className="text-2xl font-black font-mono text-rose-700 mt-1">{formatPrice(totalAmount)}</p>
              <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                {selectedMonth === 'CURRENT' ? 'خلال الشهر الحالي' : 'حسب التصفية الحالية'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <span className="text-[10px] font-black text-slate-500 uppercase">عدد بنود المصروفات</span>
              <p className="text-2xl font-black font-mono text-slate-800 mt-1">{filteredExpenses.length}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">عمليات مسجلة في السجل</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-700 uppercase">أعلى بند صرف</span>
                <p className="text-sm font-black text-emerald-900 mt-1 truncate">
                  {(() => {
                    const sorted = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
                    if (sorted.length === 0) return 'لا توجد بيانات';
                    const catObj = EXPENSE_CATEGORIES.find(c => c.id === sorted[0][0]);
                    return `${catObj?.label || sorted[0][0]}: ${formatPrice(sorted[0][1])}`;
                  })()}
                </p>
              </div>
              <p className="text-[9px] text-emerald-600 font-bold">يؤثر مباشرة في صافي أرباح المحل</p>
            </div>
          </div>

          {/* Action and Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  showAddForm 
                    ? 'bg-slate-800 text-white hover:bg-slate-900' 
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? 'إلغاء الإضافة' : 'تسجيل مصروف جديد'}</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={filteredExpenses.length === 0}
                className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="تصدير إلى إكسل CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>

              <button
                onClick={handlePrint}
                disabled={filteredExpenses.length === 0}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="طباعة التقرير"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>طباعة</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Period Filter */}
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="CURRENT">الشهر الحالي ({currentYearMonth})</option>
                <option value="ALL">كل الفترات السابقة</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="ALL">جميع بنود المصروفات</option>
                {EXPENSE_CATEGORIES.map((c, idx) => (
                  <option key={`exp-c-${c.id}-${idx}`} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Expense Accordion Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form 
                key="expenses-add-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddExpense}
                className="bg-slate-50 border-2 border-rose-100 p-4 sm:p-5 rounded-2xl space-y-4 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    إدخال بيانات المصروف الجديد
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">بيان المصروف *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="مثال: فاتورة كهرباء شهر 9، شراء أكياس"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">المبلغ ({currency}) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      min="0.01"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black font-mono text-rose-700 focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">التصنيف المحاسبي *</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      {EXPENSE_CATEGORIES.map((cat, idx) => (
                        <option key={`new-exp-cat-${cat.id}-${idx}`} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">تاريخ الصرف *</label>
                    <input 
                      type="date" 
                      required
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">طريقة الدفع</label>
                    <select
                      value={newPaymentMethod}
                      onChange={e => setNewPaymentMethod(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="cash">نقداً من الدرج (كاش)</option>
                      <option value="bank">تحويل بنكي / بطاقة</option>
                      <option value="other">طريقة أخرى</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">ملاحظات إضافية (اختياري)</label>
                    <input 
                      type="text" 
                      placeholder="رقم السند أو الفاتورة..."
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="submit"
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md"
                  >
                    حفظ المصروف
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Expenses Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">البند والبيان</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">طريقة الدفع</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">ملاحظات</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                        جاري تحميل المصروفات...
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        <TrendingDown className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-50" />
                        لا توجد مصروفات مسجلة لهذه التصفية. يمكنك إضافة مصروف جديد بالضغط على زر "تسجيل مصروف جديد".
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp, idx) => {
                      const catInfo = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      const IconComp = catInfo?.icon || HelpCircle;
                      return (
                        <tr key={`expense-row-${exp.id ?? 'noid'}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-extrabold text-slate-800">
                            {exp.title}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${catInfo?.color || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                              <IconComp className="w-3 h-3" />
                              {catInfo?.label || exp.category}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600 text-[11px]">
                            {exp.date}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 font-medium">
                            {exp.payment_method === 'cash' ? 'نقداً' : exp.payment_method === 'bank' ? 'بنكي' : 'أخرى'}
                          </td>
                          <td className="p-3 font-mono font-black text-rose-600 text-sm">
                            {formatPrice(exp.amount)}
                          </td>
                          <td className="p-3 text-[11px] text-slate-500 max-w-[150px] truncate">
                            {exp.notes || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => exp.id && handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف المصروف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-slate-500">
            الإجمالي المحسوب: <span className="text-rose-600 font-black font-mono text-sm">{formatPrice(totalAmount)}</span>
          </span>
          <Button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold"
          >
            إغلاق
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
