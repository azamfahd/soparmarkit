import { db } from '../../../db';
import { prepareDailySalesTimeSeries } from './datasetBuilder';

export interface AnomalyAlert {
  id: string;
  type: 'WITHDRAWAL_SPIKE' | 'MARGIN_SQUEEZE' | 'DEBT_CONCENTRATION' | 'UNUSUAL_INVOICE' | 'EXPIRED_STOCK' | 'SALES_DROP' | 'SALES_SPIKE';
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  description: string;
  metricValue?: string;
  recommendation: string;
  timestamp: number;
}

/**
 * Scans accounting and inventory data for operational & financial anomalies using statistical thresholding.
 */
export async function detectAnomalies(): Promise<AnomalyAlert[]> {
  const alerts: AnomalyAlert[] = [];

  const sales = await db.sales.toArray();
  const customers = await db.customers.toArray();
  const products = await db.products.toArray();
  const withdrawals = await db.cashWithdrawals?.toArray() || [];

  const now = Date.now();

  // 1. Check Cash Withdrawals Spike
  if (withdrawals.length > 0) {
    const unrepaid = withdrawals.filter(w => !w.is_repaid);
    const totalUnrepaid = unrepaid.reduce((sum, w) => sum + w.amount, 0);

    if (totalUnrepaid > 1000) {
      alerts.push({
        id: 'anomaly_withdrawal_' + now,
        type: 'WITHDRAWAL_SPIKE',
        severity: totalUnrepaid > 3000 ? 'HIGH' : 'MEDIUM',
        title: 'ارتفاع المبالغ المسحوبة من الصندوق بدون تسديد',
        description: `إجمالي المسحوبات الشخصية النقدية غير المسددة بلغت ${totalUnrepaid.toLocaleString()} ر.س.`,
        metricValue: `${totalUnrepaid} ر.س`,
        recommendation: 'يُفضل توريد المبالغ المسحوبة إلى الصندوق للحفاظ على السيولة النقدية وسداد التزامات الموردين.',
        timestamp: now,
      });
    }
  }

  // 2. Check Debt Concentration Risk (Single customer holds > 40% of total debts)
  if (customers.length > 0) {
    const totalCustomerDebt = customers.reduce((sum, c) => sum + c.balance, 0);
    if (totalCustomerDebt > 0) {
      const topDebtor = [...customers].sort((a, b) => b.balance - a.balance)[0];
      const concentrationRatio = (topDebtor.balance / totalCustomerDebt) * 100;

      if (concentrationRatio >= 40 && topDebtor.balance > 200) {
        alerts.push({
          id: 'anomaly_debt_conc_' + now,
          type: 'DEBT_CONCENTRATION',
          severity: concentrationRatio >= 60 ? 'HIGH' : 'MEDIUM',
          title: 'تركز عالي للديون عند عميل واحد',
          description: `الزبون (${topDebtor.name}) يستحوذ على %${Math.round(concentrationRatio)} من إجمالي ديون السوق بقيمة ${topDebtor.balance.toLocaleString()} ر.س.`,
          metricValue: `%${Math.round(concentrationRatio)}`,
          recommendation: 'وضع حد ائتماني محدد لهذا الزبون ومطالبته بتحصيل جزء من الدين قبل منح آجل جديد.',
          timestamp: now,
        });
      }
    }
  }

  // 3. Check Zero or Negative Margin Products
  if (products.length > 0) {
    const zeroMarginProducts = products.filter(p => p.sale_price <= p.cost_price && p.cost_price > 0);
    if (zeroMarginProducts.length > 0) {
      alerts.push({
        id: 'anomaly_margin_' + now,
        type: 'MARGIN_SQUEEZE',
        severity: 'HIGH',
        title: 'أصناف تباع بسعر التكلفة أو بأقل منها (هامش معدوم)',
        description: `تم العثور على ${zeroMarginProducts.length} صنف يباع بسعر مساوٍ للتكلفة أو أدنى منها.`,
        metricValue: `${zeroMarginProducts.length} أصناف`,
        recommendation: 'مراجعة تسعير هذه الأصناف فوراً لتجنب استنزاف أرباح المتجر.',
        timestamp: now,
      });
    }

    // Expiring products in less than 15 days
    const nearExpiry = products.filter(p => {
      if (!p.expiration_date) return false;
      const expTime = new Date(p.expiration_date).getTime();
      const daysLeft = (expTime - now) / (1000 * 3600 * 24);
      return daysLeft > 0 && daysLeft <= 15;
    });

    if (nearExpiry.length > 0) {
      alerts.push({
        id: 'anomaly_expiry_' + now,
        type: 'EXPIRED_STOCK',
        severity: 'MEDIUM',
        title: 'منتجات تنتهي صلاحيتها قريباً جدًا',
        description: `يوجد ${nearExpiry.length} صنف تنتهي صلاحيتها خلال أقل من 15 يوماً.`,
        metricValue: `${nearExpiry.length} صنف`,
        recommendation: 'عمل تخفيضات أو عروض ترويجية لتصريفها قبل انتهاء الصلاحية وتجنب الخسارة الكلية.',
        timestamp: now,
      });
    }
  }

  // 4. Statistical Outliers: Z-Score Sales Spikes & Drops
  try {
    const salesSeries = await prepareDailySalesTimeSeries();
    if (salesSeries.length >= 7) {
      const salesValues = salesSeries.map(s => s.totalSales);
      const sum = salesValues.reduce((a, b) => a + b, 0);
      const mean = sum / salesValues.length;
      
      const variance = salesValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / salesValues.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev > 10) { // Avoid division and noise with near-zero deviations
        const lastDay = salesSeries[salesSeries.length - 1];
        const lastZScore = (lastDay.totalSales - mean) / stdDev;

        if (lastZScore < -1.96) {
          alerts.push({
            id: 'anomaly_sales_drop_' + now,
            type: 'SALES_DROP',
            severity: 'HIGH',
            title: 'انخفاض مفاجئ حاد في مبيعات اليوم',
            description: `مبيعات اليوم (${lastDay.totalSales.toLocaleString()} ر.س) تسجل انحرافاً سلبياً غير معتاد بمؤشر Z-Score قدره ${lastZScore.toFixed(2)}.`,
            metricValue: `${lastDay.totalSales} ر.س`,
            recommendation: 'مراجعة أداء الكاشير ونشاط المحل اليوم للتأكد من عدم وجود عطل في تسجيل الفواتير أو غياب العملاء.',
            timestamp: now,
          });
        } else if (lastZScore > 1.96) {
          alerts.push({
            id: 'anomaly_sales_spike_' + now,
            type: 'SALES_SPIKE',
            severity: 'INFO',
            title: 'طفرة مبيعات قياسية إيجابية اليوم',
            description: `حجم مبيعات اليوم (${lastDay.totalSales.toLocaleString()} ر.س) استثنائي وصاعد بشكل ملحوظ بـ Z-Score قدره +${lastZScore.toFixed(2)}.`,
            metricValue: `${lastDay.totalSales} ر.س`,
            recommendation: 'تحليل الأصناف الأكثر طلباً اليوم وتأمين مخزونها تحسباً لاستمرار الطلب المرتفع.',
            timestamp: now,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Statistical Z-Score sales check skipped:', err);
  }

  // 5. Check Unusual Invoice Totals (Unusually high transaction ticket)
  if (sales.length >= 10) {
    const saleAmounts = sales.map(s => s.total_amount);
    const sum = saleAmounts.reduce((a, b) => a + b, 0);
    const avg = sum / sales.length;
    
    const variance = saleAmounts.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / sales.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 5) {
      const criticalInvoiceThreshold = avg + 2.5 * stdDev;
      const unusualInvoices = sales.filter(s => s.total_amount > criticalInvoiceThreshold);

      if (unusualInvoices.length > 0) {
        const target = unusualInvoices[unusualInvoices.length - 1];
        alerts.push({
          id: 'anomaly_high_invoice_' + target.id,
          type: 'UNUSUAL_INVOICE',
          severity: 'MEDIUM',
          title: 'فاتورة مبيعات استثنائية الحجم',
          description: `تم رصد فاتورة بقيمة ${target.total_amount.toLocaleString()} ر.س متجاوزة متوسط سلة المشتريات بشكل كبير.`,
          metricValue: `${target.total_amount} ر.س`,
          recommendation: `مراجعة تفاصيل الفاتورة رقم #${target.id} للتأكد من تسعير الأصناف المباعة وخصوماتها بشكل صحيح.`,
          timestamp: now,
        });
      }
    }
  }

  return alerts;
}
