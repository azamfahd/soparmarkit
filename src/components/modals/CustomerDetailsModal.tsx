import React from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, ChevronLeft, FileText, Printer, Download, Upload, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

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
}) => {
  if (!showCustomerDetails) return null;

  return (
    <div key="modal-customer-details" className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-slate-50 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl flex flex-col h-[95vh] sm:h-[85vh] overflow-hidden"
      >
        {/* Header Section */}
        <div className="bg-white p-6 border-b border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Users className="text-emerald-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">{showCustomerDetails.name}</h3>
                <p className="text-slate-500 flex items-center gap-1 text-sm">
                  <TrendingUp className="w-3 h-3" /> {showCustomerDetails.phone}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowCustomerDetails(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 rotate-180 text-slate-400" />
            </button>
          </div>

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">إجمالي المشتريات</p>
              <p className="text-lg font-bold text-blue-900">{formatPrice(customerStats.totalPurchased)}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
              <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">تم تسديده</p>
              <p className="text-lg font-bold text-emerald-900">{formatPrice(customerStats.totalPaid)}</p>
            </div>
            {showCustomerDetails.balance > 0 ? (
              <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                <p className="text-[10px] text-red-600 font-bold uppercase mb-1">المتبقي (دين)</p>
                <p className="text-lg font-bold text-red-900">{formatPrice(showCustomerDetails.balance)}</p>
              </div>
            ) : showCustomerDetails.balance < 0 ? (
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-150">
                <p className="text-[10px] text-emerald-700 font-bold uppercase mb-1">الرصيد الدائن (مقدم)</p>
                <p className="text-lg font-bold text-emerald-800">{formatPrice(Math.abs(showCustomerDetails.balance))}</p>
              </div>
            ) : (
              <div className="bg-slate-100/60 p-3 rounded-2xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">رصيد الزبون</p>
                <p className="text-md sm:text-lg font-black text-slate-600 mt-1">خالص تماماً</p>
              </div>
            )}
          </div>
        </div>

        {/* Ledger Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          <div className="flex justify-between items-center px-2">
            <h4 className="font-bold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> كشف الحساب التفصيلي
            </h4>
            <div className="flex gap-2">
              <button 
                onClick={() => printStatement(showCustomerDetails)}
                className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
              >
                <Printer className="w-3 h-3" /> طباعة
              </button>
              <button 
                onClick={() => handleDownloadPDF(showCustomerDetails)}
                className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
              >
                <Download className="w-3 h-3" /> PDF
              </button>
              <button 
                onClick={() => handleShareWhatsApp(showCustomerDetails)}
                className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-emerald-100 shadow-sm transition-all"
              >
                <Upload className="w-3 h-3" /> واتساب
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {ledgerEntries.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="text-slate-300 w-6 h-6" />
                </div>
                <p className="text-slate-400 text-sm">لا توجد عمليات مسجلة لهذا الزبون</p>
              </div>
            )}
            
            {ledgerEntries.map((entry, idx) => {
              let typeLabel = '';
              let badgeColor = '';
              let iconColor = '';
              let amountPrefix = '';
              let amountText = '';
              let showItems = false;
              let noteText = '';
              
              if (entry.entryType === 'sale') {
                typeLabel = 'فاتورة شراء';
                badgeColor = 'bg-red-50 text-red-600';
                amountPrefix = '+';
                amountText = formatPrice(entry.total_amount);
                iconColor = 'border-r-red-400';
                showItems = true;
                noteText = entry.notes || '';
              } else {
                if (entry.amount === 0) {
                  typeLabel = 'ملاحظة حساب';
                  badgeColor = 'bg-slate-100 text-slate-600';
                  amountPrefix = '';
                  amountText = '0 ر.س';
                  iconColor = 'border-r-slate-400';
                  noteText = entry.notes || 'ملاحظة عامة';
                } else if (entry.type === 'purchase') {
                  typeLabel = 'زيادة مديونية';
                  badgeColor = 'bg-amber-50 text-amber-600';
                  amountPrefix = '+';
                  amountText = formatPrice(entry.amount);
                  iconColor = 'border-r-amber-400';
                  noteText = entry.notes || 'تعديل بالزيادة';
                } else {
                  typeLabel = 'دفعة مالية';
                  badgeColor = 'bg-emerald-50 text-emerald-600';
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeColor}`}>
                        {typeLabel}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{formatDateTimeWithDay(entry.created_at)}</p>
                    </div>
                    <p className="text-lg font-bold font-mono flex items-center gap-1" dir="ltr">
                      <span className="text-slate-400 text-sm font-sans">{amountPrefix}</span>
                      {amountText}
                    </p>
                  </div>
                  
                  {noteText && (
                    <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2 rounded-xl border border-slate-100/60 font-medium leading-relaxed flex gap-1.5 items-start">
                      <span>📝</span> <span>{noteText}</span>
                    </div>
                  )}
                  
                  {showItems && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <div className="space-y-1">
                        {JSON.parse(entry.items || '[]').map((item: any, i: number) => (
                          <div key={`ledger-sub-${item.product_id ?? i}-${i}`} className="flex justify-between text-xs text-slate-600">
                            <span>{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => printReceipt(entry)}
                          className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline"
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
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <Button 
            variant="primary" 
            className="flex-1 py-4 rounded-2xl shadow-lg shadow-emerald-100 cursor-pointer"
            onClick={() => {
              setShowCustomerDetails(null);
              setShowPaymentModal(showCustomerDetails);
            }}
          >
            {showCustomerDetails.balance > 0 ? 'تسجيل سداد دفعة مديونية' : 'إيداع دفعة مقدمة في الرصيد'}
          </Button>
          <Button
            variant="secondary"
            className="w-14 shrink-0 rounded-2xl flex items-center justify-center border border-slate-200 bg-slate-50 hover:bg-slate-100 shadow-sm"
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
  );
};
