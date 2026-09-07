/**
 * Dedicated High-Reliability Printing Engine for Invoices, Statements, and Vouchers
 * Uses hidden iframe rendering to avoid mutating the main React DOM or causing styling conflicts.
 */

export interface PrintCustomerStatementOptions {
  customer: {
    id?: number;
    name: string;
    phone?: string;
    balance: number;
    notes?: string;
  };
  entries: any[];
  stats: {
    totalPurchased: number;
    totalPaid: number;
  };
  storeName?: string;
  storePhone?: string;
  currency?: string;
  monthLabel?: string;
}

export interface PrintSaleReceiptOptions {
  sale: {
    id?: number | string;
    customer_id?: number;
    customer_name?: string;
    created_at?: string;
    total_amount: number;
    paid_amount?: number;
    payment_type?: string;
    payment_status?: string;
    notes?: string;
    items?: any;
    discount?: number;
  };
  customerName?: string;
  customerPhone?: string;
  storeName?: string;
  storePhone?: string;
  currency?: string;
}

export interface PrintVoucherOptions {
  type: 'receipt' | 'payment';
  voucherNumber: string;
  date: string;
  partyName: string;
  partyPhone?: string;
  amount: number;
  previousBalance?: number;
  newBalance?: number;
  notes?: string;
  paymentMethod?: string;
  storeName?: string;
  storePhone?: string;
  currency?: string;
  paperFormat?: 'thermal' | 'a5';
}

/**
 * Universal print handler that creates a clean, isolated iframe, populates it with HTML and CSS,
 * and commands the browser to print without modifying the active UI or closing active modals.
 */
export const executeDirectPrint = (htmlBody: string, title: string = 'طباعة مستند'): void => {
  // Remove any previously created print iframe or container
  const existingIframe = document.getElementById('app-print-frame');
  if (existingIframe) {
    try {
      existingIframe.remove();
    } catch (e) {}
  }

  const existingFallback = document.getElementById('direct-fallback-print-container');
  if (existingFallback) {
    try {
      existingFallback.remove();
    } catch (e) {}
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        body {
          margin: 0;
          padding: 16px;
          font-family: 'Cairo', Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
          direction: rtl;
          text-align: right;
          font-size: 13px;
          line-height: 1.5;
        }

        @page {
          margin: 8mm 10mm;
          size: auto;
        }

        h1, h2, h3, h4, p {
          margin: 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 12px;
        }

        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          font-size: 12px;
        }

        th {
          background-color: #f1f5f9 !important;
          color: #0f172a;
          font-weight: 800;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .font-mono { font-family: monospace; }
        .text-muted { color: #64748b; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: bold;
        }
        .badge-danger { background-color: #fee2e2 !important; color: #991b1b !important; }
        .badge-success { background-color: #dcfce7 !important; color: #166534 !important; }
        .badge-warning { background-color: #fef3c7 !important; color: #92400e !important; }

        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      ${htmlBody}
    </body>
    </html>
  `;

  const isInsideIframe = (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();

  const fallbackPrint = () => {
    // If inside iframe or blocked, try opening a popup print window first
    try {
      const printWin = window.open('', '_blank', 'width=800,height=900,menubar=no,toolbar=no,location=no,status=no');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(fullHtml);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {}
        }, 400);
        return;
      }
    } catch (e) {
      console.warn('Popup print blocked or failed:', e);
    }

    // Direct DOM overlay fallback
    const container = document.createElement('div');
    container.id = 'direct-fallback-print-container';
    container.innerHTML = fullHtml;
    const style = document.createElement('style');
    style.id = 'direct-fallback-print-style';
    style.innerHTML = `
      @media print {
        body > :not(#direct-fallback-print-container) {
          display: none !important;
        }
        #direct-fallback-print-container {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
        }
      }
      @media screen {
        #direct-fallback-print-container {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
    try {
      window.print();
    } catch (e) {
      console.warn('Direct window.print error:', e);
    }
    setTimeout(() => {
      try {
        container.remove();
        style.remove();
      } catch (e) {}
    }, 2000);
  };

  const iframe = document.createElement('iframe');
  iframe.id = 'app-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '1024px';
  iframe.style.height = '768px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.zIndex = '-9999';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  let hasPrinted = false;
  const doPrint = () => {
    if (hasPrinted) return;
    hasPrinted = true;
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        fallbackPrint();
      }
    } catch (err) {
      console.warn('Iframe print error, using fallback:', err);
      fallbackPrint();
    } finally {
      setTimeout(() => {
        try {
          const frame = document.getElementById('app-print-frame');
          if (frame) frame.remove();
        } catch (e) {}
      }, 4000);
    }
  };

  try {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(fullHtml);
      doc.close();
      setTimeout(doPrint, 250);
    } else {
      fallbackPrint();
    }
  } catch (err) {
    console.warn('Failed to access print iframe doc:', err);
    fallbackPrint();
  }
};

/**
 * Format date in standard Arabic friendly representation
 */
const formatFriendlyDate = (dateStr?: string | Date): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayName = days[d.getDay()];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;

  return `${dayName} ${y}/${m}/${day} - ${hours}:${minutes} ${ampm}`;
};

/**
 * Generates and prints a complete, professional Statement of Account (كشف حساب زبون)
 */
export const printCustomerStatementDoc = (options: PrintCustomerStatementOptions): void => {
  const {
    customer,
    entries = [],
    stats = { totalPurchased: 0, totalPaid: 0 },
    storeName = 'متجرنا',
    storePhone = '',
    currency = 'ر.س',
    monthLabel = 'كشف الحساب الكامل'
  } = options;

  const issueDate = formatFriendlyDate(new Date());

  const balanceNum = customer.balance || 0;
  const balanceStatusBadge = balanceNum > 0
    ? `<span style="color: #b91c1c; font-weight: 800;">مديونية مستحقة: ${balanceNum.toLocaleString('en-US')} ${currency}</span>`
    : balanceNum < 0
    ? `<span style="color: #15803d; font-weight: 800;">رصيد دائن مقدّم: ${Math.abs(balanceNum).toLocaleString('en-US')} ${currency}</span>`
    : `<span style="color: #475569; font-weight: 800;">الرصيد خالص تماماً (0 ${currency})</span>`;

  const rowsHtml = entries.length === 0
    ? `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">لا توجد عمليات مسجلة في هذا الكشف</td></tr>`
    : entries.map((entry, idx) => {
        let title = '';
        let debit: string | number = '-';
        let credit: string | number = '-';

        if (entry.entryType === 'sale') {
          let itemDetails = '';
          if (entry.items) {
            try {
              const parsed = typeof entry.items === 'string' ? JSON.parse(entry.items) : entry.items;
              if (Array.isArray(parsed) && parsed.length > 0) {
                itemDetails = parsed.map((i: any) => `${i.name || i.product_name} (${i.quantity} × ${i.price || i.price_at_sale || 0})`).join('، ');
              }
            } catch (e) {}
          }
          title = `<strong>فاتورة مبيعات #${entry.id || idx + 1}</strong>`;
          if (itemDetails) {
            title += `<div style="font-size: 11px; color: #64748b; margin-top: 3px;">الأصناف: ${itemDetails}</div>`;
          }
          debit = `${(entry.total_amount || 0).toLocaleString('en-US')} ${currency}`;
        } else {
          if (entry.amount === 0) {
            title = entry.notes || 'ملاحظة إدارية';
          } else if (entry.type === 'purchase') {
            title = `<strong>زيادة مديونية</strong>${entry.notes ? ` - ${entry.notes}` : ''}`;
            debit = `${(entry.amount || 0).toLocaleString('en-US')} ${currency}`;
          } else {
            title = `<strong>سداد دفعة مالية</strong>${entry.notes ? ` - ${entry.notes}` : ''}`;
            credit = `${(entry.amount || 0).toLocaleString('en-US')} ${currency}`;
          }
        }

        return `
          <tr>
            <td style="text-align: center; width: 40px; font-weight: bold;">${idx + 1}</td>
            <td style="text-align: center; width: 140px; font-size: 11px; color: #475569;">${formatFriendlyDate(entry.created_at)}</td>
            <td style="text-align: right;">${title}</td>
            <td style="text-align: center; font-weight: 800; font-family: monospace; color: #b91c1c; width: 110px;">${debit}</td>
            <td style="text-align: center; font-weight: 800; font-family: monospace; color: #15803d; width: 110px;">${credit}</td>
          </tr>
        `;
      }).join('');

  const html = `
    <div style="max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${storeName}</h1>
          <p style="font-size: 13px; color: #475569; font-weight: bold;">كشف حساب عميل رسمي (${monthLabel})</p>
        </div>
        <div style="text-align: left; font-size: 11px; color: #64748b;">
          <p><strong>تاريخ الطباعة:</strong> ${issueDate}</p>
          ${storePhone ? `<p><strong>هاتف المتجر:</strong> ${storePhone}</p>` : ''}
        </div>
      </div>

      <!-- Customer Summary Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">
            العميل: ${customer.name}
          </div>
          <div style="font-size: 12px; color: #64748b;">
            رقم الهاتف: <strong>${customer.phone || 'غير مسجل'}</strong>
          </div>
        </div>
        <div style="text-align: left;">
          <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">حالة الرصيد الصافي:</div>
          <div style="font-size: 14px;">${balanceStatusBadge}</div>
        </div>
      </div>

      <!-- Ledger Table -->
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th style="width: 140px; text-align: center;">التاريخ والوقت</th>
            <th style="text-align: right;">البيان والتفاصيل</th>
            <th style="width: 110px; text-align: center;">مدين (+)</th>
            <th style="width: 110px; text-align: center;">دائن (-)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Summary Footer -->
      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <div style="width: 280px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">
            <span style="color: #64748b; font-weight: bold;">إجمالي المشتريات / المدين:</span>
            <span style="font-weight: 800; font-family: monospace;">${(stats.totalPurchased || 0).toLocaleString('en-US')} ${currency}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">
            <span style="color: #64748b; font-weight: bold;">إجمالي المسدد / الدائن:</span>
            <span style="font-weight: 800; font-family: monospace; color: #15803d;">${(stats.totalPaid || 0).toLocaleString('en-US')} ${currency}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px 12px; background: #f8fafc; font-size: 13px; font-weight: 900;">
            <span>الرصيد المتبقي المستحق:</span>
            <span style="font-family: monospace; color: ${balanceNum > 0 ? '#b91c1c' : balanceNum < 0 ? '#15803d' : '#0f172a'};">
              ${balanceNum.toLocaleString('en-US')} ${currency}
            </span>
          </div>
        </div>
      </div>

      <!-- Footer / Seal -->
      <div style="margin-top: 40px; padding-top: 15px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8;">
        <div>وثيقة حسابية رسمية صادرة من نظام ${storeName}</div>
        <div>صفحة 1 من 1</div>
      </div>
    </div>
  `;

  executeDirectPrint(html, `كشف_حساب_${customer.name}`);
};

/**
 * Generates and prints a clean, formatted POS Sale Receipt (فاتورة / إيصال بيع)
 */
export const printSaleReceiptDoc = (options: PrintSaleReceiptOptions): void => {
  const {
    sale,
    customerName,
    storeName = 'متجرنا',
    storePhone = '',
    currency = 'ر.س'
  } = options;

  let items: any[] = [];
  try {
    items = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || []);
  } catch (e) {
    items = [];
  }

  const clientName = customerName || sale.customer_name || 'زبون نقدي';
  const saleId = sale.id || 'N/A';
  const saleDate = formatFriendlyDate(sale.created_at || new Date());
  const totalAmount = Number(sale.total_amount) || 0;
  const paidAmount = sale.paid_amount !== undefined 
    ? Number(sale.paid_amount) 
    : (sale.payment_type === 'cash' ? totalAmount : 0);
  const remaining = totalAmount - paidAmount;

  const itemsRows = items.length === 0
    ? `<tr><td colspan="4" style="text-align: center; padding: 10px; color: #64748b;">لا توجد أصناف</td></tr>`
    : items.map((item, idx) => {
        const name = item.name || item.product_name || `صنف ${idx + 1}`;
        const qty = item.quantity || 1;
        const price = Number(item.price || item.price_at_sale || 0);
        const subtotal = qty * price;
        return `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 6px 4px; text-align: right; font-weight: bold;">${name}</td>
            <td style="padding: 6px 4px; text-align: center; font-family: monospace;">${qty}</td>
            <td style="padding: 6px 4px; text-align: center; font-family: monospace;">${price.toLocaleString('en-US')}</td>
            <td style="padding: 6px 4px; text-align: left; font-family: monospace; font-weight: bold;">${subtotal.toLocaleString('en-US')}</td>
          </tr>
        `;
      }).join('');

  const html = `
    <div style="max-width: 320px; margin: 0 auto; font-family: 'Cairo', Arial, sans-serif; direction: rtl; text-align: right; color: #0f172a; padding: 10px;">
      <!-- Store Header -->
      <div style="text-align: center; border-bottom: 2px dashed #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
        <h2 style="font-size: 18px; font-weight: 900; margin-bottom: 2px;">${storeName}</h2>
        ${storePhone ? `<p style="font-size: 11px; color: #475569;">هاتف: ${storePhone}</p>` : ''}
        <p style="font-size: 12px; font-weight: bold; margin-top: 4px; background: #f1f5f9; display: inline-block; padding: 2px 10px; border-radius: 4px;">
          فاتورة مبيعات #${saleId}
        </p>
      </div>

      <!-- Info Meta -->
      <div style="font-size: 11px; margin-bottom: 12px; line-height: 1.6; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">التاريخ:</span>
          <span style="font-weight: bold;">${saleDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">الزبون:</span>
          <span style="font-weight: 900;">${clientName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">طريقة الدفع:</span>
          <span style="font-weight: bold;">${sale.payment_type === 'cash' ? 'نقداً (كاش)' : 'آجل (دين)'}</span>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;">
        <thead>
          <tr style="border-bottom: 1px solid #0f172a; background: #f8fafc;">
            <th style="padding: 6px 4px; text-align: right; font-weight: 800;">الصنف</th>
            <th style="padding: 6px 4px; text-align: center; font-weight: 800; width: 35px;">الكمية</th>
            <th style="padding: 6px 4px; text-align: center; font-weight: 800; width: 50px;">السعر</th>
            <th style="padding: 6px 4px; text-align: left; font-weight: 800; width: 55px;">المجموع</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Totals Box -->
      <div style="border-top: 2px solid #0f172a; padding-top: 8px; margin-bottom: 12px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; font-weight: 900;">
          <span>الإجمالي النهائي:</span>
          <span style="font-family: monospace;">${totalAmount.toLocaleString('en-US')} ${currency}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #15803d; font-weight: bold;">
          <span>المبلغ المدفوع:</span>
          <span style="font-family: monospace;">${paidAmount.toLocaleString('en-US')} ${currency}</span>
        </div>
        ${remaining > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #b91c1c; font-weight: 900; background: #fef2f2; padding: 4px 6px; border-radius: 4px;">
            <span>المتبقي دَيْن:</span>
            <span style="font-family: monospace;">${remaining.toLocaleString('en-US')} ${currency}</span>
          </div>
        ` : ''}
      </div>

      ${sale.notes ? `
        <div style="font-size: 10px; color: #475569; background: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
          <strong>ملاحظات:</strong> ${sale.notes}
        </div>
      ` : ''}

      <!-- Footer Message -->
      <div style="text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
        <p style="font-weight: bold; margin-bottom: 2px;">شكراً لتعاملكم معنا ونسعد بزيارتكم دائماً 🌹</p>
        <p style="font-size: 9px; color: #94a3b8;">تم الإصدار إلكترونياً</p>
      </div>
    </div>
  `;

  executeDirectPrint(html, `فاتورة_${saleId}`);
};
