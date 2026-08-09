import { db } from '../../../db';

export interface DailySalesFeatureRow {
  dateStr: string;
  timestamp: number;
  totalSales: number;
  transactionCount: number;
  averageBasketValue: number;
  totalQuantitySold: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isWeekend: boolean;
  
  // Rolling Window & Lag Features (engineered)
  salesLag1?: number;
  salesLag7?: number;
  rollingMean7?: number;
  rollingStd7?: number;
  rollingMean30?: number;
}

export interface MarketBasketFeatureRow {
  productIdA: number;
  productNameA: string;
  productIdB: number;
  productNameB: string;
  coOccurrenceCount: number;
  supportA: number;     // P(A)
  supportB: number;     // P(B)
  supportAB: number;    // P(A and B)
  confidenceAtoB: number; // P(B|A)
  lift: number;         // P(A and B) / (P(A) * P(B))
}

export interface CustomerBehaviorFeatureRow {
  customerId: number;
  customerName: string;
  totalPurchasedAmount: number;
  cashSalesCount: number;
  debtSalesCount: number;
  paymentCount: number;
  totalPaidAmount: number;
  averagePurchaseIntervalDays: number;
  debtToPaymentRatio: number; // debts / payments
  creditRiskScore: number;
}

export interface SupplierRepaymentProfile {
  supplierId: number;
  supplierName: string;
  totalInvoicedAmount: number;
  totalDisbursedAmount: number;
  netAccountsPayable: number;
  disbursementRatio: number;
  averageDaysToRepay: number;
}

/**
 * Builds a highly engineered daily sales time-series dataset from local Dexie sales data.
 * Features rolling moving averages, volatility (standard deviation), and day-of-week lag signals.
 */
export async function prepareDailySalesTimeSeries(): Promise<DailySalesFeatureRow[]> {
  const allSales = await db.sales.toArray();
  const saleItems = await db.saleItems?.toArray() || [];

  if (allSales.length === 0) return [];

  // Group items by sale_id for quick lookup
  const itemsBySaleId: Record<number, number> = {};
  saleItems.forEach(item => {
    itemsBySaleId[item.sale_id] = (itemsBySaleId[item.sale_id] || 0) + item.quantity;
  });

  // Aggregate stats by calendar day (YYYY-MM-DD)
  const dailyAggregates: Record<string, {
    totalSales: number;
    transactionCount: number;
    totalQuantity: number;
  }> = {};

  allSales.forEach(sale => {
    const dateStr = sale.created_at.slice(0, 10);
    const qty = sale.id ? (itemsBySaleId[sale.id] || 0) : 0;

    if (!dailyAggregates[dateStr]) {
      dailyAggregates[dateStr] = { totalSales: 0, transactionCount: 0, totalQuantity: 0 };
    }

    dailyAggregates[dateStr].totalSales += sale.total_amount;
    dailyAggregates[dateStr].transactionCount += 1;
    dailyAggregates[dateStr].totalQuantity += qty;
  });

  const sortedDates = Object.keys(dailyAggregates).sort();
  const rawRows: DailySalesFeatureRow[] = sortedDates.map(dateStr => {
    const agg = dailyAggregates[dateStr];
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday in some Arab contexts, adjust generally
    
    return {
      dateStr,
      timestamp: date.getTime(),
      totalSales: parseFloat(agg.totalSales.toFixed(2)),
      transactionCount: agg.transactionCount,
      averageBasketValue: agg.transactionCount > 0 
        ? parseFloat((agg.totalSales / agg.transactionCount).toFixed(2)) 
        : 0,
      totalQuantitySold: agg.totalQuantity,
      dayOfWeek,
      isWeekend,
    };
  });

  // Calculate Lags, Rolling Averages, and Volatilities
  for (let i = 0; i < rawRows.length; i++) {
    // 1. Lag Features
    if (i >= 1) rawRows[i].salesLag1 = rawRows[i - 1].totalSales;
    if (i >= 7) rawRows[i].salesLag7 = rawRows[i - 7].totalSales;

    // 2. Rolling 7-day metrics
    if (i >= 6) {
      const window7 = rawRows.slice(i - 6, i + 1);
      const sum7 = window7.reduce((sum, row) => sum + row.totalSales, 0);
      const mean7 = sum7 / 7;
      rawRows[i].rollingMean7 = parseFloat(mean7.toFixed(2));

      // Rolling standard deviation (Volatility indicator)
      const variance = window7.reduce((sum, row) => sum + Math.pow(row.totalSales - mean7, 2), 0) / 7;
      rawRows[i].rollingStd7 = parseFloat(Math.sqrt(variance).toFixed(2));
    }

    // 3. Rolling 30-day metrics
    if (i >= 29) {
      const window30 = rawRows.slice(i - 29, i + 1);
      const sum30 = window30.reduce((sum, row) => sum + row.totalSales, 0);
      rawRows[i].rollingMean30 = parseFloat((sum30 / 30).toFixed(2));
    }
  }

  return rawRows;
}

/**
 * Builds Market Basket Analysis metrics using transaction product pairs.
 * Evaluates Support, Confidence, and Lift features for intelligent cross-selling models.
 */
export async function prepareProductAssociationFeatures(): Promise<MarketBasketFeatureRow[]> {
  const sales = await db.sales.toArray();
  const saleItems = await db.saleItems?.toArray() || [];
  const products = await db.products.toArray();

  if (sales.length === 0 || saleItems.length === 0) return [];

  const totalSalesCount = sales.length;
  const productMap = new Map(products.map(p => [p.id!, p.name]));

  // Group items by sale ID
  const saleToProductsMap: Record<number, Set<number>> = {};
  const productTxCount: Record<number, number> = {};

  saleItems.forEach(item => {
    if (!saleToProductsMap[item.sale_id]) {
      saleToProductsMap[item.sale_id] = new Set();
    }
    saleToProductsMap[item.sale_id].add(item.product_id);
  });

  // Calculate frequency for individual products
  Object.values(saleToProductsMap).forEach(prodSet => {
    prodSet.forEach(pid => {
      productTxCount[pid] = (productTxCount[pid] || 0) + 1;
    });
  });

  // Co-occurrence counts
  const coOccurrenceMap: Record<string, number> = {};

  Object.values(saleToProductsMap).forEach(prodSet => {
    const prodArray = Array.from(prodSet);
    for (let i = 0; i < prodArray.length; i++) {
      for (let j = i + 1; j < prodArray.length; j++) {
        const idA = prodArray[i];
        const idB = prodArray[j];
        // Enforce consistent order to key co-occurrence
        const key = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
        coOccurrenceMap[key] = (coOccurrenceMap[key] || 0) + 1;
      }
    }
  });

  const associationFeatures: MarketBasketFeatureRow[] = [];

  Object.entries(coOccurrenceMap).forEach(([key, count]) => {
    const [idAStr, idBStr] = key.split('_');
    const idA = parseInt(idAStr);
    const idB = parseInt(idBStr);

    const nameA = productMap.get(idA) || `صنف #${idA}`;
    const nameB = productMap.get(idB) || `صنف #${idB}`;

    const txA = productTxCount[idA] || 0;
    const txB = productTxCount[idB] || 0;

    // Calculate statistical probability rules
    const supportA = txA / totalSalesCount;
    const supportB = txB / totalSalesCount;
    const supportAB = count / totalSalesCount;

    // Confidence of A -> B: P(B|A) = P(A and B) / P(A)
    const confidenceAtoB = txA > 0 ? count / txA : 0;

    // Lift: P(A and B) / (P(A) * P(B))
    // A lift value > 1.0 indicates products are highly correlated and frequently bought together
    const lift = (supportA * supportB) > 0 
      ? supportAB / (supportA * supportB) 
      : 0;

    if (count >= 2) { // Filter out random unique joint occurrences for better noise control
      associationFeatures.push({
        productIdA: idA,
        productNameA: nameA,
        productIdB: idB,
        productNameB: nameB,
        coOccurrenceCount: count,
        supportA: parseFloat(supportA.toFixed(4)),
        supportB: parseFloat(supportB.toFixed(4)),
        supportAB: parseFloat(supportAB.toFixed(4)),
        confidenceAtoB: parseFloat(confidenceAtoB.toFixed(4)),
        lift: parseFloat(lift.toFixed(4)),
      });
    }
  });

  // Sort by Lift descending (highest correlation first)
  return associationFeatures.sort((a, b) => b.lift - a.lift);
}

/**
 * Builds behavioral profile metrics for customer credit Risk & Payment delay forecasting.
 */
export async function prepareCustomerBehaviorFeatures(): Promise<CustomerBehaviorFeatureRow[]> {
  const customers = await db.customers.toArray();
  const sales = await db.sales.toArray();
  const debts = await db.debts.toArray();

  if (customers.length === 0) return [];

  const now = Date.now();

  return customers.map(cust => {
    const cid = cust.id!;
    const custSales = sales.filter(s => s.customer_id === cid);
    const custDebts = debts.filter(d => d.customer_id === cid);

    const totalPurchased = custSales.reduce((sum, s) => sum + s.total_amount, 0);
    const cashSales = custSales.filter(s => s.payment_type === 'cash').length;
    const debtSales = custSales.filter(s => s.payment_type === 'debt').length;

    const paymentRecords = custDebts.filter(d => d.type === 'payment');
    const debtRecords = custDebts.filter(d => d.type === 'purchase');

    const totalPaid = paymentRecords.reduce((sum, d) => sum + d.amount, 0);
    const totalBorrowed = debtRecords.reduce((sum, d) => sum + d.amount, 0);

    // Calculate Average Purchase Intervals
    let avgInterval = 999;
    if (custSales.length >= 2) {
      const sortedTimes = custSales
        .map(s => new Date(s.created_at).getTime())
        .sort((a, b) => a - b);
      
      let sumIntervals = 0;
      for (let i = 1; i < sortedTimes.length; i++) {
        sumIntervals += (sortedTimes[i] - sortedTimes[i - 1]);
      }
      avgInterval = parseFloat((sumIntervals / (sortedTimes.length - 1) / (1000 * 60 * 60 * 24)).toFixed(1));
    }

    const debtToPaymentRatio = totalPaid > 0 
      ? parseFloat((totalBorrowed / totalPaid).toFixed(2)) 
      : (totalBorrowed > 0 ? 99.0 : 0.0);

    // Dynamic Credit Risk Rating: combines current balance, interval history, and payments
    let creditRiskScore = 0;
    if (cust.balance > 0) {
      const balanceWeight = Math.min(40, (cust.balance / 1000) * 40);
      const ratioWeight = Math.min(40, (debtToPaymentRatio / 2) * 40);
      const activityWeight = debtSales > cashSales ? 20 : 5;
      creditRiskScore = Math.round(balanceWeight + ratioWeight + activityWeight);
    }

    return {
      customerId: cid,
      customerName: cust.name,
      totalPurchasedAmount: parseFloat(totalPurchased.toFixed(2)),
      cashSalesCount: cashSales,
      debtSalesCount: debtSales,
      paymentCount: paymentRecords.length,
      totalPaidAmount: parseFloat(totalPaid.toFixed(2)),
      averagePurchaseIntervalDays: avgInterval,
      debtToPaymentRatio,
      creditRiskScore: Math.min(100, Math.max(0, creditRiskScore)),
    };
  }).sort((a, b) => b.creditRiskScore - a.creditRiskScore);
}

/**
 * Builds repayment features and Days Payable Outstanding (DPO) profiles for Supplier liability prediction.
 */
export async function prepareSupplierRepaymentFeatures(): Promise<SupplierRepaymentProfile[]> {
  const suppliers = await db.suppliers.toArray();
  const supplierPayments = await db.supplierPayments?.toArray() || [];

  if (suppliers.length === 0) return [];

  // Group payments by supplier
  const paymentsBySupplier: Record<number, { count: number; total: number; dates: number[] }> = {};
  supplierPayments.forEach(p => {
    if (!paymentsBySupplier[p.supplier_id]) {
      paymentsBySupplier[p.supplier_id] = { count: 0, total: 0, dates: [] };
    }
    paymentsBySupplier[p.supplier_id].count++;
    paymentsBySupplier[p.supplier_id].total += p.amount;
    paymentsBySupplier[p.supplier_id].dates.push(new Date(p.payment_date).getTime());
  });

  return suppliers.map(sup => {
    const sid = sup.id!;
    const pmnt = paymentsBySupplier[sid] || { count: 0, total: 0, dates: [] };

    // Net Accounts Payable is supplier's current ledger balance
    const netAccountsPayable = sup.balance;
    const totalDisbursed = pmnt.total;
    const totalInvoiced = netAccountsPayable + totalDisbursed;

    const disbursementRatio = totalInvoiced > 0 
      ? parseFloat((totalDisbursed / totalInvoiced).toFixed(2)) 
      : 1.0;

    // Average interval between payments as a proxy for repayment cycle speed (DPO Proxy)
    let avgDaysToRepay = 45; // Default average payment grace period (days)
    if (pmnt.dates.length >= 2) {
      const sortedDates = pmnt.dates.sort((a, b) => a - b);
      let sumDays = 0;
      for (let i = 1; i < sortedDates.length; i++) {
        sumDays += (sortedDates[i] - sortedDates[i - 1]);
      }
      avgDaysToRepay = Math.round(sumDays / (sortedDates.length - 1) / (1000 * 60 * 60 * 24));
    } else if (pmnt.dates.length === 1) {
      avgDaysToRepay = 30; // Standard single repayment baseline
    }

    return {
      supplierId: sid,
      supplierName: sup.name,
      totalInvoicedAmount: parseFloat(totalInvoiced.toFixed(2)),
      totalDisbursedAmount: parseFloat(totalDisbursed.toFixed(2)),
      netAccountsPayable: parseFloat(netAccountsPayable.toFixed(2)),
      disbursementRatio,
      averageDaysToRepay: avgDaysToRepay,
    };
  });
}
