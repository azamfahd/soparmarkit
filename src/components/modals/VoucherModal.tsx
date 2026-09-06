import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  Share2, 
  Receipt, 
  Check, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  CreditCard,
  Layers,
  Send
} from 'lucide-react';
import { tafqeetArabic } from '../../utils/tafqeet';
import { Button } from '../ui/Button';

export interface VoucherData {
  type: 'receipt' | 'payment'; // receipt = سند قبض, payment = سند صرف
  voucherNumber: string;
  date: string;
  partyName: string; // Customer or Supplier name
  partyPhone?: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  notes?: string;
  paymentMethod?: 'cash' | 'transfer' | 'network';
}

export interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: VoucherData | null;
  storeName: string;
  formatPrice: (price: number) => string;
  currency?: string;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  voucher,
  storeName,
  formatPrice,
  currency = 'ريال'
}) => {
  const [paperFormat, setPaperFormat] = useState<'thermal' | 'a5'>('thermal');
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen || !voucher) return null;

  const isReceipt = voucher.type === 'receipt';
  const voucherTitle = isReceipt ? 'سند قبض نقدي' : 'سند صرف نقدي';
  const voucherColor = isReceipt ? 'emerald' : 'amber';
  const amountWords = tafqeetArabic(Math.abs(Number(voucher.amount) || 0), currency);

  const handlePrint = () => {
    const previewId = paperFormat === 'thermal' ? 'thermal-voucher-preview' : 'formal-voucher-preview';
    const previewElement = document.getElementById(previewId);
    if (!previewElement) {
      window.print();
      return;
    }

    const contentHtml = previewElement.outerHTML;

    // Custom print styles for non-blocking direct printing
    const printStyles = paperFormat === 'thermal' ? `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 4mm;
        width: 72mm;
        font-family: 'Cairo', Arial, sans-serif;
        direction: rtl;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color: #333;
      }
      #thermal-voucher-preview {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    ` : `
      @page {
        size: A5 landscape;
        margin: 5mm;
      }
      body {
        margin: 0;
        padding: 10px;
        font-family: 'Cairo', Arial, sans-serif;
        direction: rtl;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color: #333;
      }
      #formal-voucher-preview {
        box-shadow: none !important;
        max-width: 100% !important;
        border: 2px solid #000 !important;
      }
    `;

    const html = `
      <div style="direction: rtl;">
        <style>
          ${printStyles}
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .text-emerald-700 { color: #047857; }
          .bg-slate-50 { background-color: #f8fafc; }
          .bg-emerald-50\\/50 { background-color: rgba(236, 253, 245, 0.5); }
          .p-2 { padding: 8px; }
          .rounded-lg { border-radius: 8px; }
          .border { border: 1px solid #e2e8f0; }
          .border-t-2 { border-top-width: 2px; }
          .border-dashed { border-style: dashed; }
          .border-slate-300 { border-color: #cbd5e1; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .gap-4 { gap: 16px; }
          .gap-2 { gap: 8px; }
          .text-[10px] { font-size: 10px; }
          .text-[11px] { font-size: 11px; }
          .text-slate-400 { color: #94a3b8; }
          .text-slate-500 { color: #64748b; }
          .text-slate-600 { color: #475569; }
          .text-slate-700 { color: #334155; }
          .text-slate-900 { color: #0f172a; }
          .space-y-4 > * + * { margin-top: 16px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-1.5 > * + * { margin-top: 6px; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-6 > * + * { margin-top: 24px; }
          .pb-3 { padding-bottom: 12px; }
          .pt-2 { padding-top: 8px; }
          .pt-4 { padding-top: 16px; }
          .pt-6 { padding-top: 24px; }
          .border-b-2 { border-bottom-width: 2px; }
          .border-slate-800 { border-color: #1e293b; }
          .border-slate-200 { border-color: #e2e8f0; }
          .px-3 { padding-left: 12px; padding-right: 12px; }
          .py-0.5 { padding-top: 2px; padding-bottom: 2px; }
          .bg-white { background-color: #ffffff; }
          .rounded-xl { border-radius: 12px; }
          .border-l { border-left-width: 1px; }
          .pl-1 { padding-left: 4px; }
          .pr-1 { padding-right: 4px; }
          .px-1 { padding-left: 4px; padding-right: 4px; }
          .w-14 { width: 56px; }
          .h-14 { height: 56px; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          .rounded-full { border-radius: 9999px; }
          .text-indigo-500 { color: #6366f1; }
        </style>
        ${contentHtml}
      </div>
    `;

    // 1. Create a print container
    const printContainer = document.createElement('div');
    printContainer.id = 'direct-print-container';
    printContainer.innerHTML = html;
    document.body.appendChild(printContainer);

    // 2. Create style element to hide everything else during print
    const style = document.createElement('style');
    style.id = 'direct-print-style';
    style.innerHTML = `
      @media print {
        body {
          background: white !important;
          color: black !important;
        }
        body > :not(#direct-print-container) {
          display: none !important;
        }
        #direct-print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          direction: rtl;
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);

    // 3. Trigger printing on main window
    window.print();

    // 4. Cleanup
    const cleanup = () => {
      const container = document.getElementById('direct-print-container');
      const styleEl = document.getElementById('direct-print-style');
      if (container) container.remove();
      if (styleEl) styleEl.remove();
    };

    if ('onafterprint' in window) {
      window.addEventListener('afterprint', cleanup, { once: true });
    } else {
      setTimeout(cleanup, 1500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🧾 *${voucherTitle}*
📍 *${storeName}*
------------------------------
🔢 *رقم السند:* ${voucher.voucherNumber}
📅 *التاريخ:* ${new Date(voucher.date).toLocaleDateString('ar-YE', { dateStyle: 'full' })}
👤 *${isReceipt ? 'العميل' : 'المورد / المستلم'}:* ${voucher.partyName}
💵 *المبلغ المدفوع:* ${formatPrice(voucher.amount)}
📝 *فقط:* ${amountWords}
📊 *الرصيد السابق:* ${formatPrice(voucher.previousBalance)}
📉 *الرصيد المتبقي الحالي:* ${formatPrice(voucher.newBalance)}
${voucher.notes ? `📌 *ملاحظات:* ${voucher.notes}\n` : ''}------------------------------
_تم إصدار السند إلكترونياً وبشكل موثق_`;

    if (navigator.share) {
      navigator.share({ title: voucherTitle, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${
            isReceipt ? 'bg-gradient-to-r from-emerald-50 via-teal-50/20 to-white' : 'bg-gradient-to-r from-amber-50 via-orange-50/20 to-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl text-white shadow-md ${
                isReceipt ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-amber-600 shadow-amber-600/20'
              }`}>
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                  {voucherTitle}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isReceipt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {voucher.voucherNumber}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isReceipt ? 'إيصال رسمي معتمد لاستلام الدفعات النقدية والديون' : 'إيصال رسمي معتمد لصرف الدفعات النقدية للموردين'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Paper Mode Tabs */}
          <div className="px-6 pt-3 pb-1 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              تنسيق الطباعة:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPaperFormat('thermal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperFormat === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                طابعة فواتير حرارية (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('a5')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperFormat === 'a5'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                ورق رسمي (A5 / A4)
              </button>
            </div>
          </div>

          {/* Body: Voucher Visual Representation */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50 flex justify-center">
            {paperFormat === 'thermal' ? (
              // Thermal Receipt Preview (80mm)
              <div
                id="thermal-voucher-preview"
                className="w-full max-w-[340px] bg-white p-5 rounded-2xl shadow-md border border-slate-200 text-slate-800 space-y-4 font-mono text-xs"
              >
                <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
                  <h4 className="text-base font-black tracking-tight">{storeName}</h4>
                  <p className="text-[11px] font-bold text-slate-600">{voucherTitle}</p>
                  <p className="text-[10px] text-slate-400">رقم السند: {voucher.voucherNumber}</p>
                  <p className="text-[10px] text-slate-400">{new Date(voucher.date).toLocaleString('ar-YE')}</p>
                </div>

                <div className="space-y-2 py-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-bold">{isReceipt ? 'استلمنا من:' : 'صُرف للمكرم:'}</span>
                    <span className="font-black text-slate-900">{voucher.partyName}</span>
                  </div>
                  {voucher.partyPhone && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>الهاتف:</span>
                      <span>{voucher.partyPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 bg-slate-50 px-2 rounded-lg border border-slate-100 my-2">
                    <span className="font-bold">المبلغ المدفوع:</span>
                    <span className="text-sm font-black text-emerald-700">{formatPrice(voucher.amount)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-relaxed bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/60">
                    <span className="font-bold text-slate-700">المبلغ كتابة: </span>
                    <span>{amountWords}</span>
                  </div>
                </div>

                <div className="pt-2 border-t-2 border-dashed border-slate-300 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">الرصيد السابق:</span>
                    <span className="font-bold text-slate-700">{formatPrice(voucher.previousBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">المبلغ المسدد:</span>
                    <span className="font-bold text-emerald-600">-{formatPrice(voucher.amount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-800">الرصيد المتبقي:</span>
                    <span className="text-slate-900">{formatPrice(voucher.newBalance)}</span>
                  </div>
                </div>

                {voucher.notes && (
                  <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <strong>ملاحظات: </strong> {voucher.notes}
                  </div>
                )}

                <div className="pt-4 border-t-2 border-dashed border-slate-300 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-600">
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold">المستلم / المحاسب</p>
                  </div>
                  <div className="border-t border-slate-300 pt-1">
                    <p className="font-bold">{isReceipt ? 'توقيع العميل' : 'توقيع المورد'}</p>
                  </div>
                </div>

                <p className="text-[9px] text-center text-slate-400 pt-2">
                  شكراً لتعاملكم معنا • وثيقة مالية معتمدة
                </p>
              </div>
            ) : (
              // Formal A5 / A4 Voucher Preview
              <div
                id="formal-voucher-preview"
                className="w-full max-w-[540px] bg-white p-6 rounded-2xl shadow-md border-2 border-slate-800 text-slate-800 space-y-4 font-sans text-xs"
              >
                {/* Official Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{storeName}</h3>
                    <p className="text-[10px] text-slate-500 font-bold">للتجارة والتوزيع والمبيعات</p>
                  </div>
                  <div className="text-center px-4 py-1.5 border-2 border-slate-800 rounded-xl bg-slate-50">
                    <h4 className="text-sm font-black text-slate-900">{voucherTitle}</h4>
                    <p className="text-[10px] font-mono font-bold text-slate-600">NO: {voucher.voucherNumber}</p>
                  </div>
                  <div className="text-left text-[10px] text-slate-500 space-y-0.5">
                    <p>التاريخ: {new Date(voucher.date).toLocaleDateString('ar-YE')}</p>
                    <p>الوقت: {new Date(voucher.date).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Amount Highlight Box */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">المبلغ رقماً:</span>
                    <span className="text-base font-black text-slate-900 px-3 py-0.5 bg-white border border-slate-300 rounded-lg">
                      {formatPrice(voucher.amount)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    طريقة الدفع: {voucher.paymentMethod === 'transfer' ? 'حوالة بنكية' : 'نقداً (كاش)'}
                  </span>
                </div>

                {/* Details Table */}
                <div className="space-y-3 py-2 text-xs">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-700 w-28">
                      {isReceipt ? 'استلمنا من المكرم:' : 'صُرف للمكرم / السادة:'}
                    </span>
                    <span className="font-bold text-slate-900 flex-1">{voucher.partyName}</span>
                  </div>

                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-700 w-28">مبلغ وقدره (كتابةً):</span>
                    <span className="font-bold text-slate-900 flex-1">{amountWords}</span>
                  </div>

                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-700 w-28">وذلك عن:</span>
                    <span className="font-bold text-slate-700 flex-1">
                      {voucher.notes || (isReceipt ? 'سداد دفعة من الحساب وتخفيض المديونية' : 'سداد دفعة نقدية لحساب المورد')}
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <div className="border-l border-slate-200 last:border-0 pl-1">
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">الرصيد السابق</p>
                    <p className="font-bold text-slate-700">{formatPrice(voucher.previousBalance)}</p>
                  </div>
                  <div className="border-l border-slate-200 last:border-0 px-1">
                    <p className="text-[10px] text-emerald-600 font-bold mb-0.5">المبلغ المدفوع</p>
                    <p className="font-bold text-emerald-700">{formatPrice(voucher.amount)}</p>
                  </div>
                  <div className="pr-1">
                    <p className="text-[10px] text-indigo-500 font-bold mb-0.5">الرصيد المتبقي</p>
                    <p className="font-black text-slate-900">{formatPrice(voucher.newBalance)}</p>
                  </div>
                </div>

                {/* Signatures & Stamp */}
                <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs text-slate-700">
                  <div className="space-y-6">
                    <p className="font-bold">أمين الصندوق / المحاسب</p>
                    <div className="h-6 border-b border-dotted border-slate-400"></div>
                  </div>
                  <div className="space-y-6">
                    <p className="font-bold">الختم الرسمي</p>
                    <div className="w-14 h-14 mx-auto rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                      الختم
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="font-bold">{isReceipt ? 'توقيع العميل' : 'توقيع المستلم'}</p>
                    <div className="h-6 border-b border-dotted border-slate-400"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-4 text-xs text-slate-600 font-bold"
            >
              إغلاق
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleShareWhatsApp}
                className="rounded-xl px-3.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 flex items-center gap-1.5 font-bold"
              >
                {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{copiedShare ? 'تم النسخ!' : 'إرسال عبر واتساب'}</span>
              </Button>

              <Button
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 text-xs sm:text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden Printable Container for Direct Browser Printing */}
      <div id="printable-voucher-container" className="hidden print:block">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-voucher-container, #printable-voucher-container * {
                visibility: visible;
              }
              #printable-voucher-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: ${paperFormat === 'thermal' ? '0' : '10mm'};
                display: block !important;
              }
              @page {
                size: ${paperFormat === 'thermal' ? '80mm auto' : 'A5 landscape'};
                margin: ${paperFormat === 'thermal' ? '0' : '5mm'};
              }
            }
          `
        }} />
        {paperFormat === 'thermal' ? (
          <div style={{ width: '76mm', margin: '0 auto', fontFamily: 'monospace', fontSize: '10pt', padding: '2mm', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '3mm' }}>
              <div style={{ fontSize: '12pt', fontWeight: '900' }}>{storeName}</div>
              <div style={{ fontSize: '11pt', fontWeight: 'bold', margin: '1mm 0' }}>{voucherTitle}</div>
              <div style={{ fontSize: '9pt' }}>رقم السند: {voucher.voucherNumber}</div>
              <div style={{ fontSize: '8pt' }}>{new Date(voucher.date).toLocaleString('ar-YE')}</div>
            </div>

            <div style={{ padding: '3mm 0', lineHeight: '1.6' }}>
              <div><strong>{isReceipt ? 'استلمنا من:' : 'صُرف للمكرم:'}</strong> {voucher.partyName}</div>
              {voucher.partyPhone && <div><strong>الهاتف:</strong> {voucher.partyPhone}</div>}
              <div style={{ margin: '2mm 0', padding: '2mm', border: '1px solid #000', textAlign: 'center', fontSize: '11pt', fontWeight: 'bold' }}>
                المبلغ المدفوع: {formatPrice(voucher.amount)}
              </div>
              <div style={{ fontSize: '9pt', fontStyle: 'italic' }}>
                فقط: {amountWords}
              </div>
              {voucher.notes && <div><strong>ملاحظات:</strong> {voucher.notes}</div>}
            </div>

            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '2mm 0', margin: '2mm 0', fontSize: '9pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>الرصيد السابق:</span>
                <span>{formatPrice(voucher.previousBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>المبلغ المسدد:</span>
                <span>-{formatPrice(voucher.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>الرصيد المتبقي:</span>
                <span>{formatPrice(voucher.newBalance)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6mm', textAlign: 'center', fontSize: '8pt' }}>
              <div>
                <div>توقيع المستلم</div>
                <div style={{ marginTop: '8mm' }}>___________</div>
              </div>
              <div>
                <div>توقيع المحاسب</div>
                <div style={{ marginTop: '8mm' }}>___________</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '8pt', marginTop: '4mm' }}>
              شكراً لتعاملكم معنا
            </div>
          </div>
        ) : (
          <div style={{ border: '2px solid #000', padding: '8mm', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '11pt', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '3mm' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: '900' }}>{storeName}</h2>
                <div style={{ fontSize: '9pt', color: '#555' }}>سند مالي رسمي معتمد</div>
              </div>
              <div style={{ border: '2px solid #000', padding: '2mm 6mm', borderRadius: '4px', textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '13pt', fontWeight: 'bold' }}>{voucherTitle}</h3>
                <div style={{ fontSize: '9pt' }}>NO: {voucher.voucherNumber}</div>
              </div>
              <div style={{ fontSize: '9pt', textAlign: 'left' }}>
                <div>التاريخ: {new Date(voucher.date).toLocaleDateString('ar-YE')}</div>
                <div>الوقت: {new Date(voucher.date).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4mm 0', padding: '2mm', background: '#f5f5f5', border: '1px solid #ccc' }}>
              <div><strong>المبلغ رقماً:</strong> <span style={{ fontSize: '13pt', fontWeight: 'bold' }}>{formatPrice(voucher.amount)}</span></div>
              <div><strong>طريقة الدفع:</strong> {voucher.paymentMethod === 'transfer' ? 'حوالة بنكية' : 'نقداً'}</div>
            </div>

            <div style={{ lineHeight: '2', margin: '3mm 0' }}>
              <div><strong>{isReceipt ? 'استلمنا من المكرم:' : 'صُرف للمكرم / السادة:'}</strong> {voucher.partyName}</div>
              <div><strong>مبلغ وقدره (كتابةً):</strong> {amountWords}</div>
              <div><strong>وذلك عن:</strong> {voucher.notes || (isReceipt ? 'سداد دفعة من الحساب وتخفيض المديونية' : 'سداد دفعة نقدية لحساب المورد')}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '3mm 0', padding: '2mm', border: '1px solid #000', textAlign: 'center', fontSize: '10pt' }}>
              <div>الرصيد السابق: <strong>{formatPrice(voucher.previousBalance)}</strong></div>
              <div>المبلغ المدفوع: <strong>{formatPrice(voucher.amount)}</strong></div>
              <div>الرصيد المتبقي: <strong>{formatPrice(voucher.newBalance)}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10mm', textAlign: 'center' }}>
              <div>
                <div>أمين الصندوق / المحاسب</div>
                <div style={{ marginTop: '12mm' }}>__________________</div>
              </div>
              <div style={{ border: '1px dashed #999', width: '22mm', height: '22mm', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9pt', color: '#999' }}>
                الختم الرسمي
              </div>
              <div>
                <div>{isReceipt ? 'توقيع العميل' : 'توقيع المستلم'}</div>
                <div style={{ marginTop: '12mm' }}>__________________</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
