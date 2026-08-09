import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, ChevronLeft, FileText, Printer, Download, Upload, Plus, Calendar, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { CustomerStatementCardModal } from './CustomerStatementCardModal';

export interface CustomerDetailsModalProps {
  showCustomerDetails: any;
  setShowCustomerDetails: (val: any) => void;
  customerStats: { totalPurchased: number; totalPaid: number };
  ledgerEntries: any[];
  printStatement: (customer: any) => void;
  handleDownloadPDF: (customer: any) => void;
  handleShareWhatsApp: (customer: any) => void;
  printReceipt: (entry: any) => void;
  formatPrice: (amount: number) => string;
  formatDateTimeWithDay: (dateStr: string) => string;
  setShowPaymentModal: (val: any) => void;
  setShowCustomerAdjustmentModal: (val: any) => void;
  storeName?: string;
  storePhone?: string;
  currency?: string;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  showCustomerDetails,
  setShowCustomerDetails,
  customerStats,
  ledgerEntries,
  printStatement,
  handleDownloadPDF,
  handleShareWhatsApp,
  printReceipt,
  formatPrice,
  formatDateTimeWithDay,
  setShowPaymentModal,
  setShowCustomerAdjustmentModal,
  storeName = 'متجرنا',
  storePhone = '',
  currency = 'ر.س',
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [showCardImageModal, setShowCardImageModal] = useState<boolean>(false);

  // Extract unique months from ledger entries for filtering (e.g. "2026-08")
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    ledgerEntries.forEach((entry) => {
      if (!entry.created_at) return;
      const d = new Date(entry.created_at);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNamesAr[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, label);
      }
    });

    return Array.from(monthsMap.entries()).map(([key, label]) => ({ key, label }));
  }, [ledgerEntries]);

  // Filter entries based on selected month
  const filteredEntries = useMemo(() => {
    if (selectedMonth === 'ALL') return ledgerEntries;
    return ledgerEntries.filter((entry) => {
      if (!entry.created_at) return false;
      const d = new Date(entry.created_at);
      if (isNaN(d.getTime())) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [ledgerEntries, selectedMonth]);

  // Recalculate stats for selected period
  const periodStats = useMemo(() => {
    let purchased = 0;
    let paid = 0;

    filteredEntries.forEach((entry) => {
      if (entry.entryType === 'sale') {
        purchased += entry.total_amount || 0;
      } else {
        if (entry.type === 'purchase') {
          purchased += entry.amount || 0;
        } else if (entry.type === 'payment' || entry.amount > 0) {
          paid += entry.amount || 0;
        }
      }
    });

    return { purchased, paid };
  }, [filteredEntries]);

  if (!showCustomerDetails) return null;

  const currentMonthLabel = selectedMonth === 'ALL'
    ? 'كشف الحساب الكامل'
    : availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth;

  return (
    <>
      <div key="modal-customer-details" className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
        <motion.div 
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          className="bg-slate-50 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl flex flex-col h-[95vh] sm:h-[85vh] overflow-hidden shadow-2xl"
        >
          {/* Header Section */}
          <div className="bg-white p-5 border-b border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
                  <Users className="text-emerald-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">{showCustomerDetails.name}</h3>
                  <p className="text-slate-500 flex items-center gap-1 text-sm font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> {showCustomerDetails.phone || 'بدون رقم هاتف'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCustomerDetails(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>

            {/* Month Filter Selector Bar */}
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> فلترة الفترات:
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth('ALL')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  selectedMonth === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                جميع العمليات ({ledgerEntries.length})
              </button>
              {availableMonths.map((m) => (
                <button
                  key={`month-btn-${m.key}`}
                  type="button"
                  onClick={() => setSelectedMonth(m.key)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    selectedMonth === m.key
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Summary Stats Grid (Reflects Filtered Period vs Overall Balance) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-700 font-bold uppercase mb-0.5">
                  {selectedMonth === 'ALL' ? 'إجمالي المشتريات' : 'مشتريات الشهر'}
                </p>
                <p className="text-base sm:text-lg font-black text-blue-900">
                  {formatPrice(selectedMonth === 'ALL' ? customerStats.totalPurchased : periodStats.purchased)}
                </p>
              </div>
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100">
                <p className="text-[10px] text-emerald-700 font-bold uppercase mb-0.5">
                  {selectedMonth === 'ALL' ? 'تم تسديده' : 'تسديدات الشهر'}
                </p>
                <p className="text-base sm:text-lg font-black text-emerald-900">
                  {formatPrice(selectedMonth === 'ALL' ? customerStats.totalPaid : periodStats.paid)}
                </p>
              </div>
              {showCustomerDetails.balance > 0 ? (
                <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                  <p className="text-[10px] text-red-600 font-bold uppercase mb-0.5">المتبقي الكلي (دين)</p>
                  <p className="text-base sm:text-lg font-black text-red-900">{formatPrice(showCustomerDetails.balance)}</p>
                </div>
              ) : showCustomerDetails.balance < 0 ? (
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase mb-0.5">رصيد دائن (مقدم)</p>
                  <p className="text-base sm:text-lg font-black text-emerald-800">{formatPrice(Math.abs(showCustomerDetails.balance))}</p>
                </div>
              ) : (
                <div className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">رصيد الزبون</p>
                  <p className="text-sm sm:text-base font-black text-slate-700 mt-0.5">خالص تماماً</p>
                </div>
              )}
            </div>
          </div>

          {/* Ledger Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80">
            <div className="flex flex-wrap justify-between items-center gap-2 px-1">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>كشف الحساب التفصيلي</span>
                <span className="text-xs font-normal text-slate-400">({currentMonthLabel})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <button 
                  type="button"
                  onClick={() => setShowCardImageModal(true)}
                  className="text-xs bg-gradient-to-r from-slate-900 to-indigo-950 text-emerald-400 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
                  title="تصميم بطاقة كشف الحساب كصورة احترافية عالية الجودة"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>بطاقة صورة 🖼️</span>
                </button>
                <button 
                  type="button"
                  onClick={() => printStatement(showCustomerDetails)}
                  className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl flex items-center gap-1 hover:bg-slate-50 shadow-sm transition-all cursor-pointer font-bold"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" /> طباعة
                </button>
                <button 
                  type="button"
                  onClick={() => handleDownloadPDF(showCustomerDetails)}
                  className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl flex items-center gap-1 hover:bg-slate-50 shadow-sm transition-all cursor-pointer font-bold"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> PDF
                </button>
                <button 
                  type="button"
                  onClick={() => handleShareWhatsApp(showCustomerDetails)}
                  className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-emerald-100 shadow-sm transition-all cursor-pointer font-bold"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" /> واتساب
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredEntries.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="text-slate-300 w-6 h-6" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">لا توجد عمليات مسجلة لـ ({currentMonthLabel})</p>
                </div>
              )}
              
              {filteredEntries.map((entry, idx) => {
                let typeLabel = '';
                let badgeColor = '';
                let iconColor = '';
                let amountPrefix = '';
                let amountText = '';
                let showItems = false;
                let noteText = '';
                
                if (entry.entryType === 'sale') {
                  typeLabel = 'فاتورة شراء';
                  badgeColor = 'bg-rose-50 text-rose-700 border border-rose-100';
                  amountPrefix = '+';
                  amountText = formatPrice(entry.total_amount);
                  iconColor = 'border-r-rose-400';
                  showItems = true;
                  noteText = entry.notes || '';
                } else {
                  if (entry.amount === 0) {
                    typeLabel = 'ملاحظة حساب';
                    badgeColor = 'bg-slate-100 text-slate-600';
                    amountPrefix = '';
                    amountText = '0 ' + currency;
                    iconColor = 'border-r-slate-400';
                    noteText = entry.notes || 'ملاحظة عامة';
                  } else if (entry.type === 'purchase') {
                    typeLabel = 'زيادة مديونية';
                    badgeColor = 'bg-amber-50 text-amber-700 border border-amber-100';
                    amountPrefix = '+';
                    amountText = formatPrice(entry.amount);
                    iconColor = 'border-r-amber-400';
                    noteText = entry.notes || 'تعديل بالزيادة';
                  } else {
                    typeLabel = 'دفعة مالية';
                    badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                    amountPrefix = '-';
                    amountText = formatPrice(entry.amount);
                    iconColor = 'border-r-emerald-400';
                    noteText = entry.notes || '';
                  }
                }
                
                return (
                  <div 
                    key={`ledger-${entry.entryType}-${entry.id ?? 'no-id'}-${idx}`} 
                    className={`bg-white p-4 rounded-2xl border-r-4 shadow-sm transition-all hover:shadow-md ${iconColor}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${badgeColor}`}>
                          {typeLabel}
                        </span>
                        <p className="text-xs text-slate-400 font-medium mt-1">{formatDateTimeWithDay(entry.created_at)}</p>
                      </div>
                      <p className="text-lg font-black font-mono flex items-center gap-1" dir="ltr">
                        <span className="text-slate-400 text-sm font-sans">{amountPrefix}</span>
                        {amountText}
                      </p>
                    </div>
                    
                    {noteText && (
                      <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2.5 rounded-xl border border-slate-100 font-medium leading-relaxed flex gap-1.5 items-start">
                        <span>📝</span> <span>{noteText}</span>
                      </div>
                    )}
                    
                    {showItems && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="space-y-1">
                          {(() => {
                            let parsedItems: any[] = [];
                            try {
                              parsedItems = typeof entry.items === 'string' ? JSON.parse(entry.items) : (entry.items || []);
                            } catch (e) {}
                            return Array.isArray(parsedItems) ? parsedItems.map((item: any, i: number) => (
                              <div key={`ledger-sub-${item.product_id ?? i}-${i}`} className="flex justify-between text-xs text-slate-600">
                                <span>{item.name} <span className="text-slate-400 font-mono">× {item.quantity}</span></span>
                                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            )) : null;
                          })()}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button 
                            onClick={() => printReceipt(entry)}
                            className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> طباعة الفاتورة
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <Button 
              variant="primary" 
              className="flex-1 py-4 rounded-2xl shadow-lg shadow-emerald-100 cursor-pointer font-bold text-sm"
              onClick={() => {
                setShowCustomerDetails(null);
                setShowPaymentModal(showCustomerDetails);
              }}
            >
              {showCustomerDetails.balance > 0 ? 'تسجيل سداد دفعة مديونية' : 'إيداع دفعة مقدمة في الرصيد'}
            </Button>
            <Button
              variant="secondary"
              className="w-14 shrink-0 rounded-2xl flex items-center justify-center border border-slate-200 bg-slate-50 hover:bg-slate-100 shadow-sm cursor-pointer"
              onClick={() => {
                setShowCustomerDetails(null);
                setShowCustomerAdjustmentModal(showCustomerDetails);
              }}
              title="تعديل الحساب أو ملاحظات"
            >
              <Plus className="w-5 h-5 text-slate-600" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Image Generator Modal */}
      <CustomerStatementCardModal
        isOpen={showCardImageModal}
        onClose={() => setShowCardImageModal(false)}
        customer={showCustomerDetails}
        storeName={storeName}
        storePhone={storePhone}
        currency={currency}
        monthLabel={currentMonthLabel}
        ledgerEntries={filteredEntries}
        customerStats={customerStats}
        formatPrice={formatPrice}
        formatDateTimeWithDay={formatDateTimeWithDay}
      />
    </>
  );
};
