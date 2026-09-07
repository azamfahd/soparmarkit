import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { 
  X, 
  Printer, 
  Share2, 
  Receipt, 
  Check, 
  Calendar, 
  User, 
  Phone, 
  Layers, 
  ShoppingBag,
  CreditCard,
  Building2,
  Tag,
  Download,
  ExternalLink,
  Info
} from 'lucide-react';
import { Button } from '../ui/Button';
import { printSaleReceiptDoc, executeDirectPrint } from '../../utils/printUtils';

export interface SaleReceiptData {
  sale: any;
  items: any[];
  customerName?: string;
  customerPhone?: string;
}

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: SaleReceiptData | null;
  storeName: string;
  storePhone?: string;
  formatPrice: (price: number) => string;
  currency?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  storeName,
  storePhone = '',
  formatPrice,
  currency = 'ر.س'
}) => {
  const [paperFormat, setPaperFormat] = useState<'thermal' | 'a5'>('thermal');
  const [copiedShare, setCopiedShare] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  if (!isOpen || !receiptData) return null;

  const { sale, items = [], customerName, customerPhone } = receiptData;
  const clientName = customerName || sale.customer_name || 'زبون نقدي';
  const saleId = sale.id || 'N/A';
  
  const saleDate = sale.created_at 
    ? new Date(sale.created_at).toLocaleDateString('ar-YE', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('ar-YE', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const totalAmount = Number(sale.total_amount) || 0;
  const paidAmount = sale.paid_amount !== undefined 
    ? Number(sale.paid_amount) 
    : (sale.payment_type === 'cash' ? totalAmount : 0);
  const remaining = totalAmount - paidAmount;
  const isCash = sale.payment_type === 'cash';
  const notesText = typeof sale.notes === 'string' ? sale.notes.trim() : '';

  const handlePrint = () => {
    printSaleReceiptDoc({
      sale: {
        ...sale,
        items
      },
      customerName: clientName,
      customerPhone: customerPhone || sale.customer_phone || '',
      storeName: storeName || 'متجرنا',
      storePhone: storePhone || '',
      currency: currency || 'ر.س'
    });
  };

  const handleDownloadPDF = async () => {
    const targetElement = document.getElementById(
      paperFormat === 'thermal' ? 'thermal-receipt-preview' : 'formal-receipt-preview'
    );
    if (!targetElement) return;

    setIsExportingPDF(true);
    try {
      const opt = {
        margin: [4, 4, 4, 4],
        filename: `فاتورة_مبيعات_${saleId}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: paperFormat === 'thermal' ? [80, 180] : 'a5', orientation: 'portrait' }
      };
      await (html2pdf as any)().set(opt).from(targetElement).save();
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleShareWhatsApp = () => {
    let itemsText = '';
    if (items.length > 0) {
      itemsText = items.map((it, idx) => {
        const name = it.name || it.product_name || `صنف ${idx + 1}`;
        const qty = it.quantity || 1;
        const price = Number(it.price !== undefined ? it.price : (it.price_at_sale || 0));
        return `▫️ ${name} (${qty} × ${formatPrice(price)}) = ${formatPrice(qty * price)}`;
      }).join('\n');
    }

    const text = `🧾 *فاتورة مبيعات #${saleId}*
📍 *${storeName}*
------------------------------
📅 *التاريخ:* ${saleDate}
👤 *الزبون:* ${clientName}
💳 *طريقة الدفع:* ${isCash ? 'نقداً (كاش)' : 'آجل (دين)'}
------------------------------
🛍️ *الأصناف:*
${itemsText || 'تفاصيل الأصناف'}
------------------------------
💰 *الإجمالي النهائي:* ${formatPrice(totalAmount)}
💵 *المبلغ المدفوع:* ${formatPrice(paidAmount)}
${remaining > 0 ? `⚠️ *المتبقي دَيْن:* ${formatPrice(remaining)}\n` : ''}${notesText ? `📌 *ملاحظات:* ${notesText}\n` : ''}------------------------------
_شكراً لتعاملكم معنا ونسعد بزيارتكم دائماً 🌹_`;

    if (navigator.share) {
      navigator.share({ title: `فاتورة مبيعات #${saleId}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div key="receipt-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50/20 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl text-white shadow-md bg-emerald-600 shadow-emerald-600/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  معاينة إيصال الفاتورة
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                    #{saleId}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  معاينة وتدقيق الفاتورة الرسمية قبل إرسالها للطباعة
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

          {/* Paper Mode Tabs */}
          <div className="px-6 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              تنسيق المعاينة:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPaperFormat('thermal')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  paperFormat === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                حراري (80mm POS)
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('a5')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  paperFormat === 'a5'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                نموذج رسمي (A5/A4)
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center items-start">
            {paperFormat === 'thermal' ? (
              /* Thermal 80mm Preview Card */
              <div 
                id="thermal-receipt-preview"
                className="w-full max-w-[340px] bg-white rounded-2xl shadow-md border border-slate-200 p-4 text-slate-900 font-sans text-xs select-none"
              >
                {/* Store Header */}
                <div className="text-center border-b-2 border-dashed border-slate-800 pb-3 mb-3">
                  <h2 className="text-base font-black text-slate-900 tracking-tight">{storeName}</h2>
                  {storePhone && <p className="text-[10px] text-slate-500 mt-0.5">هاتف: {storePhone}</p>}
                  <div className="inline-block mt-2 px-3 py-0.5 bg-slate-100 rounded-md font-extrabold text-[11px] text-slate-800 border border-slate-200">
                    فاتورة مبيعات #{saleId}
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-1 text-[11px] border-b border-slate-200 pb-2.5 mb-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">التاريخ:</span>
                    <span className="font-bold text-slate-800">{saleDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الزبون:</span>
                    <span className="font-black text-slate-900">{clientName}</span>
                  </div>
                  {customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">رقم الهاتف:</span>
                      <span className="font-mono text-slate-700">{customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">طريقة الدفع:</span>
                    <span className="font-extrabold text-emerald-700">{isCash ? 'نقداً (كاش)' : 'آجل (دين)'}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 border-b border-slate-800 pb-1 mb-1.5">
                    <span className="w-1/2">الصنف</span>
                    <span className="w-1/6 text-center">الكمية</span>
                    <span className="w-1/6 text-center">السعر</span>
                    <span className="w-1/6 text-left">المجموع</span>
                  </div>
                  {items.length === 0 ? (
                    <div className="text-center py-2 text-slate-400 text-[10px]">لا توجد تفاصيل أصناف</div>
                  ) : (
                    <div className="space-y-1">
                      {items.map((it, idx) => {
                        const name = it.name || it.product_name || `صنف ${idx + 1}`;
                        const qty = it.quantity || 1;
                        const price = Number(it.price !== undefined ? it.price : (it.price_at_sale || 0));
                        const subtotal = qty * price;
                        return (
                          <div key={`receipt-item-${idx}`} className="flex justify-between items-center text-[11px] border-b border-dashed border-slate-100 pb-1">
                            <span className="w-1/2 truncate font-bold text-slate-800" title={name}>{name}</span>
                            <span className="w-1/6 text-center font-mono font-bold text-slate-700">{qty}</span>
                            <span className="w-1/6 text-center font-mono text-slate-600">{price.toLocaleString('en-US')}</span>
                            <span className="w-1/6 text-left font-mono font-black text-slate-900">{subtotal.toLocaleString('en-US')}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Totals Section */}
                <div className="border-t-2 border-slate-900 pt-2 space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between font-black text-sm text-slate-900">
                    <span>الإجمالي النهائي:</span>
                    <span className="font-mono">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-mono">{formatPrice(paidAmount)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between font-black text-red-700 bg-red-50 p-1.5 rounded-lg border border-red-100">
                      <span>المتبقي دَيْن:</span>
                      <span className="font-mono">{formatPrice(remaining)}</span>
                    </div>
                  )}
                </div>

                {notesText && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] text-slate-600 mb-3">
                    <strong>ملاحظات:</strong> {notesText}
                  </div>
                )}

                {/* Footer Message */}
                <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                  <p className="font-bold">شكراً لتعاملكم معنا ونسعد بزيارتكم دائماً 🌹</p>
                  <p className="text-[8px] text-slate-400 mt-0.5">نظام المبيعات الإلكتروني</p>
                </div>
              </div>
            ) : (
              /* A5/A4 Formal Invoice Preview */
              <div 
                id="formal-receipt-preview"
                className="w-full max-w-lg bg-white rounded-2xl shadow-md border border-slate-200 p-6 text-slate-900 font-sans text-xs select-none"
              >
                {/* Formal Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{storeName}</h2>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">فاتورة مبيعات ضريبية / رسمية</p>
                    {storePhone && <p className="text-xs text-slate-500">هاتف: {storePhone}</p>}
                  </div>
                  <div className="text-left">
                    <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-lg font-black text-sm">
                      #{saleId}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{saleDate}</p>
                  </div>
                </div>

                {/* Customer Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">اسم العميل:</p>
                    <p className="font-black text-slate-900 text-sm">{clientName}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-bold">طريقة الدفع:</p>
                    <span className="inline-block font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                      {isCash ? 'دفع نقدي (كاش)' : 'آجل (حساب دين)'}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px]">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">الصنف</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-center">السعر</th>
                        <th className="p-2.5 text-left">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const name = it.name || it.product_name || `صنف ${idx + 1}`;
                        const qty = it.quantity || 1;
                        const price = Number(it.price !== undefined ? it.price : (it.price_at_sale || 0));
                        return (
                          <tr key={`a5-item-${idx}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="p-2.5 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-800">{name}</td>
                            <td className="p-2.5 text-center font-mono font-bold">{qty}</td>
                            <td className="p-2.5 text-center font-mono">{price.toLocaleString('en-US')} {currency}</td>
                            <td className="p-2.5 text-left font-mono font-black text-slate-900">{(qty * price).toLocaleString('en-US')} {currency}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end mb-4">
                  <div className="w-64 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <div className="flex justify-between p-2 text-xs border-b border-slate-200">
                      <span className="text-slate-500 font-bold">الإجمالي:</span>
                      <span className="font-mono font-black">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between p-2 text-xs border-b border-slate-200 text-emerald-700">
                      <span className="font-bold">المسدد:</span>
                      <span className="font-mono font-black">{formatPrice(paidAmount)}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between p-2 text-xs text-red-700 font-black bg-red-50">
                        <span>المتبقي:</span>
                        <span className="font-mono">{formatPrice(remaining)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-[10px] text-slate-400">
                  <div>وثيقة مبيعات رسمية - {storeName}</div>
                  <div>شكراً لتعاملكم معنا 🌹</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer"
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-emerald-600" />}
                <span>{copiedShare ? 'تم النسخ للمشاركة!' : 'مشاركة واتساب'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer disabled:opacity-50"
                title="تصدير وحفظ الفاتورة كملف PDF"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>{isExportingPDF ? 'جاري التصدير...' : 'تصدير PDF'}</span>
              </button>
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
                <span>طباعة الإيصال الآن</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
