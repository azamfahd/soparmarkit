import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  Share2, 
  FileText, 
  Check, 
  Calendar, 
  User, 
  Phone, 
  Layers, 
  Download,
  Building2,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { printCustomerStatementDoc } from '../../utils/printUtils';

export interface CustomerStatementPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  entries: any[];
  stats: { totalPurchased: number; totalPaid: number };
  monthLabel?: string;
  storeName: string;
  storePhone?: string;
  formatPrice: (price: number) => string;
  currency?: string;
  onExportPDF?: () => void;
  onShareWhatsApp?: () => void;
}

export const CustomerStatementPrintModal: React.FC<CustomerStatementPrintModalProps> = ({
  isOpen,
  onClose,
  customer,
  entries = [],
  stats,
  monthLabel = 'كشف الحساب الكامل',
  storeName,
  storePhone = '',
  formatPrice,
  currency = 'ر.س',
  onExportPDF,
  onShareWhatsApp
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen || !customer) return null;

  const balanceNum = Number(customer.balance) || 0;
  const totalPurchased = Number(stats?.totalPurchased) || 0;
  const totalPaid = Number(stats?.totalPaid) || 0;

  const handlePrint = () => {
    printCustomerStatementDoc({
      customer,
      entries,
      stats: {
        totalPurchased,
        totalPaid
      },
      storeName: storeName || 'متجرنا',
      storePhone: storePhone || '',
      currency: currency || 'ر.س',
      monthLabel
    });
  };

  const handleLocalShare = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
      return;
    }

    const text = `📋 *كشف حساب العميل: ${customer.name}*
📍 *${storeName}*
📅 *الفترة:* ${monthLabel}
------------------------------
🛍️ *إجمالي المشتريات:* ${formatPrice(totalPurchased)}
💵 *إجمالي المسدد:* ${formatPrice(totalPaid)}
📊 *الرصيد المتبقي المستحق:* ${formatPrice(balanceNum)}
------------------------------
_تم التصدير من المنظومة المحاسبية_`;

    if (navigator.share) {
      navigator.share({ title: `كشف حساب ${customer.name}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div key="statement-print-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50/20 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl text-white shadow-md bg-emerald-600 shadow-emerald-600/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  معاينة كشف الحساب قبل الطباعة
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {monthLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  معاينة السجل المالي الرسمي للعميل وتدقيقه قبل إصدار أمر الطباعة
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Printable Document Card Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center items-start">
            <div className="w-full bg-white rounded-2xl shadow-md border border-slate-200 p-5 sm:p-7 text-slate-900 font-sans select-none space-y-5">
              {/* Store & Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{storeName}</h2>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">كشف حساب عميل رسمي ومفصل</p>
                  {storePhone && <p className="text-xs text-slate-600 mt-0.5">هاتف: {storePhone}</p>}
                </div>
                <div className="text-right sm:text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-700">تاريخ الإصدار:</div>
                  <div className="font-mono text-slate-900 font-black">
                    {new Date().toLocaleDateString('ar-YE', { dateStyle: 'long' })}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-extrabold mt-0.5">الفترة: {monthLabel}</div>
                </div>
              </div>

              {/* Customer Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">العميل:</span>
                    <span className="font-black text-slate-900 text-sm">{customer.name}</span>
                  </div>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2.5 sm:justify-end">
                    <div className="w-8 h-8 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center font-bold">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">رقم الهاتف:</span>
                      <span className="font-mono font-bold text-slate-800">{customer.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-red-700 block mb-0.5">إجمالي المشتريات (مدين)</span>
                  <span className="text-sm sm:text-base font-black font-mono text-red-800">{formatPrice(totalPurchased)}</span>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">إجمالي المسدد (دائن)</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-800">{formatPrice(totalPaid)}</span>
                </div>
                <div className={`p-3 rounded-2xl border ${
                  balanceNum > 0 ? 'bg-amber-50 border-amber-300' : balanceNum < 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-300'
                }`}>
                  <span className="text-[10px] font-bold text-slate-600 block mb-0.5">الرصيد المستحق</span>
                  <span className={`text-sm sm:text-base font-black font-mono ${
                    balanceNum > 0 ? 'text-amber-900' : balanceNum < 0 ? 'text-emerald-900' : 'text-slate-800'
                  }`}>
                    {formatPrice(balanceNum)}
                  </span>
                </div>
              </div>

              {/* Detailed Transactions Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 text-[11px]">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">التاريخ والوقت</th>
                      <th className="p-2.5">نوع الحركة</th>
                      <th className="p-2.5">البيان / التفاصيل</th>
                      <th className="p-2.5 text-center">مدين (+)</th>
                      <th className="p-2.5 text-center">دائن (-)</th>
                      <th className="p-2.5 text-left">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400 font-bold">
                          لا توجد حركات مسجلة في هذا الكشف
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry, idx) => {
                        const isSale = entry.entryType === 'sale' || entry.type === 'purchase';
                        const isPayment = entry.entryType !== 'sale' && (entry.type === 'payment' || entry.amount > 0);
                        const amount = Math.abs(Number(entry.total_amount || entry.amount) || 0);
                        
                        let dateDisplay = '';
                        try {
                          dateDisplay = new Date(entry.created_at || new Date()).toLocaleDateString('ar-YE', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch (e) {
                          dateDisplay = String(entry.created_at || '');
                        }

                        let desc = entry.notes || '';
                        if (entry.entryType === 'sale' && entry.items) {
                          try {
                            const parsed = typeof entry.items === 'string' ? JSON.parse(entry.items) : entry.items;
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              desc = parsed.map((p: any) => `${p.name || p.product_name} (×${p.quantity})`).join(', ');
                            }
                          } catch (e) {}
                        }
                        if (!desc) {
                          desc = isSale ? 'فاتورة مبيعات' : isPayment ? 'سند قبض دفعة نقدية' : 'تسوية حساب';
                        }

                        return (
                          <tr key={`stmt-row-${idx}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-slate-400 font-mono font-bold text-[10px]">{idx + 1}</td>
                            <td className="p-2.5 text-slate-600 font-medium text-[11px] whitespace-nowrap">{dateDisplay}</td>
                            <td className="p-2.5 font-bold">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                isSale ? 'bg-red-100 text-red-800' : isPayment ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isSale ? 'فاتورة بيع' : isPayment ? 'سداد دفعة' : 'تعديل رصيد'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700 max-w-[200px] truncate text-[11px]" title={desc}>{desc}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-red-700">
                              {isSale ? formatPrice(amount) : '-'}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                              {isPayment ? formatPrice(amount) : '-'}
                            </td>
                            <td className="p-2.5 text-left font-mono font-black text-slate-900">
                              {entry.new_balance !== undefined ? formatPrice(entry.new_balance) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Bottom Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                <div className="text-[11px]">
                  وثيقة حسابية رسمية صادرة من نظام <strong>{storeName}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">إجمالي الحركات: {entries.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLocalShare}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer"
                title="مشاركة كشف الحساب عبر الواتساب"
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-emerald-600" />}
                <span>{copiedShare ? 'تم النسخ للمشاركة!' : 'مشاركة واتساب'}</span>
              </button>

              {onExportPDF && (
                <button
                  type="button"
                  onClick={onExportPDF}
                  className="text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer"
                  title="تصدير بصيغة PDF"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>تصدير PDF</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                إغلاق
              </Button>
              <Button
                variant="primary"
                onClick={handlePrint}
                className="text-xs py-2 px-5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة كشف الحساب الآن</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
