import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Briefcase, 
  Moon, 
  Trash2, 
  Edit3, 
  ExternalLink,
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { db, CashWithdrawal, Sale, Product } from '../../db';

export interface AnomalyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  anomalyType: 'withdrawals' | 'odd_hours_sales' | 'low_margin_products' | 'pricing' | null;
  cashWithdrawals: CashWithdrawal[];
  sales: Sale[];
  products: Product[];
  formatPrice: (amount: number) => string;
  currency: string;
  onResolveAnomaly: (anomalyKey: string) => void;
}

export const AnomalyReviewModal: React.FC<AnomalyReviewModalProps> = ({
  isOpen,
  onClose,
  anomalyType,
  cashWithdrawals,
  sales,
  products,
  formatPrice,
  currency,
  onResolveAnomaly,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWithdrawal, setEditingWithdrawal] = useState<CashWithdrawal | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editByWhom, setEditByWhom] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !anomalyType) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Suspicious / Large Cash Withdrawals
  const filteredWithdrawals = cashWithdrawals.filter(w => {
    const isLarge = w.amount > 500;
    const reasonLower = (w.reason || '').toLowerCase();
    const isUnrecordedReason = !w.reason || w.reason.trim() === '' || reasonLower.includes('اخرى') || reasonLower.includes('سحب') || reasonLower.includes('بدون');
    const matchesSuspicious = isLarge || isUnrecordedReason;
    if (!matchesSuspicious) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (w.by_whom || '').toLowerCase().includes(q) ||
             (w.reason || '').toLowerCase().includes(q) ||
             w.amount.toString().includes(q);
    }
    return true;
  });

  // 2. Odd-Hour or Zero-Amount Sales
  const filteredAnomalousSales = sales.filter(s => {
    const d = new Date(s.created_at);
    const hours = d.getHours();
    const isOddHour = hours >= 0 && hours < 5;
    const isZeroAmount = s.total_amount <= 0;
    const isAnomaly = isOddHour || isZeroAmount;
    if (!isAnomaly) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (s.id?.toString().includes(q) || '') ||
             (s.notes || '').toLowerCase().includes(q) ||
             s.total_amount.toString().includes(q);
    }
    return true;
  });

  // 3. Low Margin or Negative Profit Products
  const filteredPricingProducts = products.filter(p => {
    const margin = p.sale_price - p.cost_price;
    const isProblematic = p.cost_price > 0 && (margin <= 0 || (margin / p.sale_price) < 0.1);
    if (!isProblematic) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) ||
             (p.barcode || '').toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Handlers for Cash Withdrawals
  const handleStartEditWithdrawal = (w: CashWithdrawal) => {
    setEditingWithdrawal(w);
    setEditReason(w.reason || '');
    setEditByWhom(w.by_whom || '');
    setEditAmount(w.amount.toString());
  };

  const handleSaveWithdrawalEdit = async () => {
    if (!editingWithdrawal?.id) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('⚠️ يرجى إدخال مبلغ سحب صحيح');
      return;
    }

    try {
      await db.cashWithdrawals.update(editingWithdrawal.id, {
        amount: amt,
        reason: editReason.trim() || 'سحب مصرح ومطابق',
        by_whom: editByWhom.trim() || 'أمين الصندوق'
      });
      setEditingWithdrawal(null);
      showToast('✅ تم تحديث بيانات سند السحب ومطابقته بنجاح');
    } catch (err) {
      console.error(err);
      showToast('❌ تعذر حفظ التعديل');
    }
  };

  const handleDeleteWithdrawal = async (id?: number) => {
    if (!id) return;
    if (window.confirm('هل أنت متأكد من حذف حركة السحب هذه من السجلات؟')) {
      try {
        await db.cashWithdrawals.delete(id);
        showToast('🗑️ تم حذف حركة السحب بنجاح');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkWithdrawalReviewed = async (id?: number) => {
    if (!id) return;
    try {
      const current = await db.cashWithdrawals.get(id);
      if (current) {
        const updatedReason = current.reason && !current.reason.includes('تمت المطابقة والاعتماد')
          ? `${current.reason} (تمت المطابقة والاعتماد)`
          : (current.reason || 'سحب معتمد ومطابق مع السند');
        await db.cashWithdrawals.update(id, { reason: updatedReason });
        showToast('✅ تم اعتماد ومطابقة حركة السحب رسمياً');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Odd-Hour Sales
  const handleMarkSaleReviewed = async (id?: number) => {
    if (!id) return;
    try {
      const sale = await db.sales.get(id);
      if (sale) {
        const updatedNotes = sale.notes && !sale.notes.includes('تمت مراجعة العملية واعتمادها')
          ? `${sale.notes} - [تمت مراجعة العملية واعتمادها]`
          : (sale.notes || 'تمت مراجعة توقيت العملية واعتمادها');
        await db.sales.update(id, { notes: updatedNotes });
        showToast('✅ تم التحقق وتوثيق صحة العملية');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSale = async (id?: number) => {
    if (!id) return;
    if (window.confirm('هل أنت متأكد من إلغاء وحذف هذه الفاتورة المشبوهة؟')) {
      try {
        await db.sales.delete(id);
        await db.saleItems.where('sale_id').equals(id).delete();
        showToast('🗑️ تم حذف الفاتورة وبنودها من السجل بنجاح');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Bulk Resolve and hide from recommendations
  const handleResolveAll = () => {
    if (anomalyType === 'withdrawals') {
      onResolveAnomaly('withdrawals');
      showToast('🎉 تم توثيق واعتماد مطابقة السحبيات وإخفاء التنبيه بنجاح');
    } else if (anomalyType === 'odd_hours_sales') {
      onResolveAnomaly('odd_hours_sales');
      showToast('🎉 تم توثيق التدقيق للفواتير المتأخرة وإخفاء التنبيه بنجاح');
    } else if (anomalyType === 'pricing' || anomalyType === 'low_margin_products') {
      onResolveAnomaly('pricing');
      showToast('🎉 تم توثيق مراجعة التسعير وإخفاء التنبيه بنجاح');
    }
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-3 sm:p-5 backdrop-blur-md" dir="rtl">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] p-5 sm:p-7 shadow-2xl relative text-right max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden"
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl border border-slate-700 animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-150 shrink-0 gap-3">
          <div className="flex items-center gap-3.5">
            <div className={`p-3.5 rounded-2xl text-white shadow-lg ${
              anomalyType === 'withdrawals' ? 'bg-gradient-to-br from-rose-600 to-amber-600 shadow-rose-500/20' :
              anomalyType === 'odd_hours_sales' ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-500/20' :
              'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
            }`}>
              {anomalyType === 'withdrawals' && <Briefcase className="w-6 h-6" />}
              {anomalyType === 'odd_hours_sales' && <Moon className="w-6 h-6" />}
              {anomalyType === 'pricing' && <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-800">
                  {anomalyType === 'withdrawals' && 'مركز تدقيق ومطابقة المسحوبات النقدية (السحبيات)'}
                  {anomalyType === 'odd_hours_sales' && 'مركز مراجعة الفواتير والعمليات الليلية غير الاعتيادية'}
                  {anomalyType === 'pricing' && 'مركز تصحيح هوامش الربح وثغرات التسعير'}
                </h3>
                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-full font-black">
                  رصد أمني
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-1">
                {anomalyType === 'withdrawals' && 'استعرض سندات الصرف، حدث الأسباب، أو قم باعتمادها لإغلاق التنبيه وإخفائه فوراً.'}
                {anomalyType === 'odd_hours_sales' && 'تحقق من الفواتير المسجلة في أوقات الإغلاق، طابقها مع الكاميرات أو اعتمدها.'}
                {anomalyType === 'pricing' && 'مراجعة المنتجات المسعرة بأقل من التكلفة أو بهامش ربح ضعيف لتعديلها.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="py-3.5 flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center shrink-0 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="بحث بالاسم، المبلغ، أو البيان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <Button 
            onClick={handleResolveAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>اعتماد وتأكيد الكل (إخفاء التنبيه)</span>
          </Button>
        </div>

        {/* Body Content List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-3 pr-1 space-y-3">
          
          {/* TYPE 1: WITHDRAWALS */}
          {anomalyType === 'withdrawals' && (
            <div className="space-y-3">
              {filteredWithdrawals.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <h4 className="text-sm font-black text-slate-700">لا توجد مسحوبات مشبوهة معلقة حالياً</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1">جميع سندات السحب مطابقة ومعتمدة في السجلات</p>
                </div>
              ) : (
                filteredWithdrawals.map((w, idx) => (
                  <div 
                    key={`anomaly-w-${w.id ?? 'noid'}-${idx}`} 
                    className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 font-mono">
                          {formatPrice(w.amount)}
                        </span>
                        {w.amount > 500 && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-md">
                            مبلغ كبير {'>'} 500
                          </span>
                        )}
                        {(!w.reason || w.reason.trim() === '' || w.reason.includes('اخرى')) && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-md">
                            سبب غير مفصل
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>المستلم: {w.by_whom || 'غير محدد'}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[11px]">{new Date(w.created_at).toLocaleString('ar-SA')}</span>
                      </div>
                      <div className="text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200/60 font-medium">
                        <strong>البيان / السبب:</strong> {w.reason || 'لم يتم تسجيل سبب'}
                      </div>
                    </div>

                    {/* Actions for withdrawal */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <button 
                        onClick={() => handleMarkWithdrawalReviewed(w.id)}
                        title="اعتماد وتوثيق المطابقة"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200/80 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>اعتماد ومطابقة</span>
                      </button>
                      <button 
                        onClick={() => handleStartEditWithdrawal(w)}
                        title="تعديل البيان أو المستلم"
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200/80 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteWithdrawal(w.id)}
                        title="حذف السند"
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/80 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TYPE 2: ODD-HOURS SALES */}
          {anomalyType === 'odd_hours_sales' && (
            <div className="space-y-3">
              {filteredAnomalousSales.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <h4 className="text-sm font-black text-slate-700">لا توجد عمليات بيع غير اعتيادية معلقة</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1">جميع الفواتير تمت مراجعتها والتأكد من صحتها</p>
                </div>
              ) : (
                filteredAnomalousSales.map((s, idx) => {
                  const saleHour = new Date(s.created_at).getHours();
                  const isLateNight = saleHour >= 0 && saleHour < 5;
                  return (
                    <div 
                      key={`anomaly-s-${s.id ?? 'noid'}-${idx}`}
                      className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 font-mono">
                            فاتورة #{s.id} — {formatPrice(s.total_amount)}
                          </span>
                          {isLateNight && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Moon className="w-3 h-3" />
                              ساعة متأخرة ({new Date(s.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                          {s.total_amount <= 0 && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-md">
                              مبلغ صفر/سالب
                            </span>
                          )}
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${s.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {s.payment_type === 'cash' ? 'كاش' : 'آجل'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{new Date(s.created_at).toLocaleString('ar-SA')}</span>
                          {s.notes && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-medium">ملاحظات: {s.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions for sale */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <button 
                          onClick={() => handleMarkSaleReviewed(s.id)}
                          title="تأكيد ومطابقة الفاتورة"
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200/80 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>تأكيد وصحة العملية</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteSale(s.id)}
                          title="إلغاء وحذف الفاتورة المشبوهة"
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/80 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TYPE 3: PRICING ANOMALIES */}
          {anomalyType === 'pricing' && (
            <div className="space-y-3">
              {filteredPricingProducts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <h4 className="text-sm font-black text-slate-700">لا توجد ثغرات تسعيرية في المخزون</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1">جميع المنتجات تحقق هوامش ربح صحيحة ومجدية</p>
                </div>
              ) : (
                filteredPricingProducts.map((p, idx) => {
                  const margin = p.sale_price - p.cost_price;
                  const isNegative = margin < 0;
                  return (
                    <div 
                      key={`anomaly-p-${p.id ?? 'noid'}-${idx}`}
                      className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">
                            {p.name}
                          </span>
                          {isNegative ? (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-md">
                              ⚠️ بيع بخسارة ({formatPrice(margin)})
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-md">
                              هامش ضئيل جداً ({((margin / p.sale_price) * 100).toFixed(1)}%)
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                            {p.category}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-600 flex items-center gap-3 font-mono">
                          <span>سعر التكلفة: {formatPrice(p.cost_price)}</span>
                          <span className="text-slate-300">•</span>
                          <span>سعر البيع: {formatPrice(p.sale_price)}</span>
                          <span className="text-slate-300">•</span>
                          <span className={isNegative ? 'text-rose-600' : 'text-amber-600'}>
                            الربح للقطعة: {formatPrice(margin)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-bold">
                          يرجى تعديل سعر البيع من قسم إدارة المنتجات
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Edit Withdrawal Sub-Form Modal / Panel */}
        {editingWithdrawal && (
          <div className="p-4 bg-indigo-50/90 border-2 border-indigo-200 rounded-2xl mb-3 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                تعديل وتوثيق سند السحب #{editingWithdrawal.id}
              </h4>
              <button onClick={() => setEditingWithdrawal(null)} className="text-indigo-400 hover:text-indigo-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">المبلغ (كاش):</label>
                <input 
                  type="number" 
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">المستلم / المسؤول:</label>
                <input 
                  type="text" 
                  value={editByWhom}
                  onChange={(e) => setEditByWhom(e.target.value)}
                  className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">البيان / السبب المفصل:</label>
                <input 
                  type="text" 
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="سلفة مؤقتة، مصروف بضاعة..."
                  className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button 
                onClick={() => setEditingWithdrawal(null)}
                variant="outline"
                className="text-xs py-1.5 px-3 rounded-xl"
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleSaveWithdrawalEdit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 px-4 rounded-xl font-bold"
              >
                حفظ التعديل والاعتماد
              </Button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-150 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-slate-400 font-bold">
            نظام الحماية والرقابة المحاسبية الذكية
          </div>
          <Button 
            onClick={onClose}
            className="py-2.5 px-6 rounded-2xl text-xs font-black bg-slate-800 hover:bg-slate-900 text-white"
          >
            إغلاق
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
