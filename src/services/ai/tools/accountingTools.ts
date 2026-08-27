import { db } from '../../../db';
import { Evidence, NLUResult } from '../types';
import { detectAnomalies, forecastSales, getMarketBasketRules } from '../ml';

export function filterSalesByDateRange(records: any[], dateRange?: string, dateField = 'created_at') {
  if (!dateRange || dateRange === 'ALL' || !Array.isArray(records)) return records || [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Helper to extract timestamp from item
  const getTime = (item: any): number => {
    const raw = item[dateField] || item.created_at || item.payment_date || item.date;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
  };

  // 0. Date Interval (DATE_BETWEEN:start:end)
  if (dateRange.startsWith('DATE_BETWEEN:')) {
    const parts = dateRange.replace('DATE_BETWEEN:', '').split(':');
    if (parts.length === 2) {
      let startMs = 0;
      let endMs = Infinity;

      if (parts[0] === 'START_OF_MONTH') {
        startMs = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      } else if (parts[0] === 'START_OF_YEAR') {
        startMs = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
      } else {
        const [y, m, d] = parts[0].split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          startMs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
        }
      }

      if (parts[1] === 'TODAY') {
        endMs = endOfToday.getTime();
      } else {
        const [y, m, d] = parts[1].split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          endMs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
        }
      }

      return records.filter(r => {
        const t = getTime(r);
        return t >= startMs && t <= endMs;
      });
    }
  }

  // 0.1 Specific Month (MONTH:YYYY-MM or MONTH:MM)
  if (dateRange.startsWith('MONTH:')) {
    const mStr = dateRange.replace('MONTH:', '').trim();
    let y = now.getFullYear();
    let m = now.getMonth() + 1;
    if (mStr.includes('-')) {
      const [parsedY, parsedM] = mStr.split('-').map(Number);
      if (!isNaN(parsedY) && !isNaN(parsedM)) {
        y = parsedY;
        m = parsedM;
      }
    } else {
      const parsedM = Number(mStr);
      if (!isNaN(parsedM)) m = parsedM;
    }
    const startMs = new Date(y, m - 1, 1, 0, 0, 0, 0).getTime();
    const endMs = new Date(y, m, 0, 23, 59, 59, 999).getTime();
    return records.filter(r => {
      const t = getTime(r);
      return t >= startMs && t <= endMs;
    });
  }

  // 0.2 Quarters (QUARTER_1, QUARTER_2, QUARTER_3, QUARTER_4)
  const quarterMatch = dateRange.match(/^QUARTER_([1-4])$/);
  if (quarterMatch) {
    const qNum = parseInt(quarterMatch[1], 10);
    const startMonth = (qNum - 1) * 3; // 0, 3, 6, 9
    const endMonth = startMonth + 2;
    const startMs = new Date(now.getFullYear(), startMonth, 1, 0, 0, 0, 0).getTime();
    const endMs = new Date(now.getFullYear(), endMonth + 1, 0, 23, 59, 59, 999).getTime();
    return records.filter(r => {
      const t = getTime(r);
      return t >= startMs && t <= endMs;
    });
  }

  // 0.3 Last N Days (LAST_N_DAYS:N)
  if (dateRange.startsWith('LAST_N_DAYS:')) {
    const days = parseInt(dateRange.replace('LAST_N_DAYS:', ''), 10);
    if (!isNaN(days) && days > 0) {
      const startMs = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).getTime();
      return records.filter(r => getTime(r) >= startMs);
    }
  }

  // 1. Exact Date (EXACT_DATE:YYYY-MM-DD)
  if (dateRange.startsWith('EXACT_DATE:')) {
    const dateStr = dateRange.replace('EXACT_DATE:', '').trim();
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const targetStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
      const targetEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
      return records.filter(r => {
        const t = getTime(r);
        return t >= targetStart && t <= targetEnd;
      });
    }
  }

  // 2. Specific Weeks of Month (WEEK_1, WEEK_2, WEEK_3, WEEK_4, WEEK_5)
  const weekMatch = dateRange.match(/^WEEK_([1-5])(_LAST_MONTH)?$/);
  if (weekMatch) {
    const weekNum = parseInt(weekMatch[1], 10);
    const isLastMonth = !!weekMatch[2];
    const targetYear = isLastMonth && now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const targetMonth = isLastMonth ? (now.getMonth() === 0 ? 11 : now.getMonth() - 1) : now.getMonth();

    const startDay = (weekNum - 1) * 7 + 1;
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const endDay = weekNum === 5 ? daysInMonth : Math.min(weekNum * 7, daysInMonth);

    const weekStart = new Date(targetYear, targetMonth, startDay, 0, 0, 0, 0).getTime();
    const weekEnd = new Date(targetYear, targetMonth, endDay, 23, 59, 59, 999).getTime();

    return records.filter(r => {
      const t = getTime(r);
      return t >= weekStart && t <= weekEnd;
    });
  }

  // 3. Days of the Week (DAY_SATURDAY, DAY_SUNDAY, DAY_MONDAY, etc.)
  const dayNameMap: Record<string, number> = {
    SATURDAY: 6,
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
  };

  const dayMatch = dateRange.match(/^DAY_([A-Z]+)(_LAST_WEEK)?$/);
  if (dayMatch) {
    const targetDayIndex = dayNameMap[dayMatch[1]];
    const isLastWeek = !!dayMatch[2];

    if (targetDayIndex !== undefined) {
      const currentDay = now.getDay();
      let diffDays = targetDayIndex - currentDay;
      if (diffDays > 0) diffDays -= 7; // Previous occurrence
      if (isLastWeek) diffDays -= 7;

      const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffDays);
      const targetStart = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 0, 0, 0, 0).getTime();
      const targetEnd = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59, 999).getTime();

      return records.filter(r => {
        const t = getTime(r);
        return t >= targetStart && t <= targetEnd;
      });
    }
  }

  // 4. Relative Ranges
  if (dateRange === 'TODAY') {
    return records.filter(r => getTime(r) >= startOfToday.getTime() && getTime(r) <= endOfToday.getTime());
  }

  if (dateRange === 'YESTERDAY') {
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);
    return records.filter(r => {
      const t = getTime(r);
      return t >= startOfYesterday.getTime() && t <= endOfYesterday.getTime();
    });
  }

  if (dateRange === 'THIS_WEEK') {
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay(); // 0 is Sunday, 6 is Saturday
    const diff = (day + 1) % 7; // If Saturday (6), diff is 0
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    return records.filter(r => getTime(r) >= startOfWeek.getTime());
  }

  if (dateRange === 'LAST_WEEK') {
    const startOfThisWeek = new Date(startOfToday);
    const day = startOfThisWeek.getDay();
    const diff = (day + 1) % 7;
    startOfThisWeek.setDate(startOfThisWeek.getDate() - diff);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek.getTime() - 1);

    return records.filter(r => {
      const t = getTime(r);
      return t >= startOfLastWeek.getTime() && t <= endOfLastWeek.getTime();
    });
  }

  if (dateRange === 'THIS_MONTH') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
    return records.filter(r => getTime(r) >= startOfMonth);
  }

  if (dateRange === 'LAST_MONTH') {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
    return records.filter(r => {
      const t = getTime(r);
      return t >= startOfLastMonth && t <= endOfLastMonth;
    });
  }

  if (dateRange === 'THIS_YEAR') {
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
    return records.filter(r => getTime(r) >= startOfYear);
  }

  if (dateRange === 'LAST_YEAR') {
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0).getTime();
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).getTime();
    return records.filter(r => {
      const t = getTime(r);
      return t >= startOfLastYear && t <= endOfLastYear;
    });
  }

  return records;
}

const PLURAL_CATEGORY_WORDS = new Set([
  'عميل', 'عملاء', 'العملاء', 'زبون', 'زبائن', 'الزبائن', 'زباين', 'مورد', 'موردين', 'الموردين',
  'شركة', 'شركات', 'الشركات', 'منتج', 'منتجات', 'المنتجات', 'صنف', 'اصناف', 'الاصناف',
  'بضاعه', 'البضاعه', 'مبيعات', 'ارباح', 'مصروفات', 'مصاريف', 'مخزون', 'المخزن', 'فواتير',
  'الكل', 'الجميع', 'الناس', 'شغل', 'محل', 'متجر', 'صندوق', 'درج', 'كاش', 'دين', 'ديون',
  'نظام', 'النظام', 'تطبيق', 'التطبيق', 'برنامج', 'البرنامج', 'اصدار', 'الاصدار', 'نسخة', 'النسخة',
  'معلومات', 'الوكيل', 'المستشار', 'السيستم'
]);

function isGenericPluralCategory(name?: string): boolean {
  if (!name) return true;
  const cleaned = name.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
  const words = cleaned.split(/\s+/);
  const blacklisted = ['كل', 'جميع', 'كامل', 'عن', 'من', 'ما', 'اي', 'ايش', 'شو', 'الكل', 'الجميع'];
  return words.some(w => {
    const normW = w.replace(/^ال/, '');
    return PLURAL_CATEGORY_WORDS.has(w) || 
           PLURAL_CATEGORY_WORDS.has(normW) || 
           blacklisted.includes(w) || 
           blacklisted.includes(normW);
  });
}

function matchesNameFuzzy(source: string, query: string): boolean {
  if (!source || !query) return false;
  const clean = (s: string) => s.toLowerCase()
    .replace(/[أإآٱٲٳ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ء/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .trim();

  const normSource = clean(source);
  const normQuery = clean(query);
  
  if (normSource === normQuery || normSource.includes(normQuery) || normQuery.includes(normSource)) return true;

  const queryWords = normQuery.split(/\s+/).filter(w => w.length >= 2);
  const sourceWords = normSource.split(/\s+/).filter(w => w.length >= 2);

  return queryWords.some(qw => {
    const rawQw = qw.replace(/^ال/, '');
    return sourceWords.some(sw => {
      const rawSw = sw.replace(/^ال/, '');
      return sw === qw || rawSw === rawQw || sw.includes(rawQw) || (rawQw.length >= 3 && sw.includes(rawQw));
    });
  });
}

/**
 * 1. Sales Summary Tool
 */
export async function getSalesSummaryTool(dateRange?: string, targetCustomer?: string, isVerification?: boolean): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const customers = await db.customers.toArray();
  const customerMap = new Map(customers.map(c => [c.id, c]));

  let filteredSales = filterSalesByDateRange(allSales, dateRange);

  // If a specific customer is queried for their sales
  const effectiveCust = isGenericPluralCategory(targetCustomer) ? undefined : targetCustomer?.trim();
  let matchedCustomerObj: any = null;
  if (effectiveCust) {
    matchedCustomerObj = customers.find(c => matchesNameFuzzy(c.name, effectiveCust));
    if (matchedCustomerObj) {
      filteredSales = filteredSales.filter(s => s.customer_id === matchedCustomerObj.id);
    }
  }

  const totalAmount = filteredSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const count = filteredSales.length;

  const cashSales = filteredSales
    .filter(s => s.payment_type === 'cash')
    .reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const debtSales = filteredSales
    .filter(s => s.payment_type === 'debt')
    .reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const saleIds = new Set(filteredSales.map(s => s.id));
  const allSaleItems = await db.saleItems.toArray();
  const filteredSaleItems = allSaleItems.filter(si => saleIds.has(si.sale_id));
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

  const itemStats: Record<number, { name: string; totalQty: number; totalRevenue: number }> = {};
  filteredSaleItems.forEach(item => {
    const p = productMap.get(item.product_id);
    const name = p ? p.name : `منتج #${item.product_id}`;
    if (!itemStats[item.product_id]) {
      itemStats[item.product_id] = { name, totalQty: 0, totalRevenue: 0 };
    }
    itemStats[item.product_id].totalQty += item.quantity || 0;
    itemStats[item.product_id].totalRevenue += (item.quantity || 0) * (item.price_at_sale || 0);
  });

  const topProducts = Object.values(itemStats)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);

  const detailedInvoices = filteredSales.slice(-10).map(s => {
    const cust = s.customer_id ? customerMap.get(s.customer_id) : null;
    return {
      id: s.id,
      date: s.created_at,
      customerName: cust ? cust.name : 'زبون نقدي',
      paymentType: s.payment_type === 'cash' ? 'نقداً' : 'آجل',
      totalAmount: s.total_amount,
    };
  });

  const allTimeSalesTotal = allSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const allTimeInvoicesCount = allSales.length;

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'ALL',
      isVerification: !!isVerification,
      searchedCustomer: effectiveCust,
      customerMatched: !!matchedCustomerObj,
      customerName: matchedCustomerObj?.name,
      totalAmount,
      invoiceCount: count,
      averageInvoiceValue: count > 0 ? Math.round(totalAmount / count) : 0,
      cashSales,
      debtSales,
      topProducts,
      recentInvoices: detailedInvoices,
      allTimeSalesTotal,
      allTimeInvoicesCount,
    },
    metadata: { toolName: 'getSalesSummary' },
  };
}

/**
 * 1.1 Credit Sales Summary Tool (المبيعات بالآجل والبيع بالدين)
 */
export async function getCreditSalesSummaryTool(
  dateRange?: string,
  isVerification?: boolean
): Promise<Evidence> {
  const salesEvidence = await getSalesSummaryTool(dateRange, undefined, isVerification);
  return {
    source: 'INDEXED_DB',
    data: {
      ...salesEvidence.data,
      creditSalesTotal: salesEvidence.data.debtSales,
      totalSalesAll: salesEvidence.data.totalAmount,
      cashSalesTotal: salesEvidence.data.cashSales,
      dateRange: dateRange || 'ALL',
    },
    metadata: { toolName: 'getCreditSalesSummary' },
  };
}

/**
 * 2. Profit Summary Tool
 */
export async function getProfitSummaryTool(dateRange?: string, rawQuery?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const allSaleItems = await db.saleItems.toArray();
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

  // 1. Period Metrics
  const filteredSales = filterSalesByDateRange(allSales, dateRange);
  const periodSaleIds = new Set(filteredSales.map(s => s.id));
  const filteredSaleItems = allSaleItems.filter(si => periodSaleIds.has(si.sale_id));

  let totalRevenue = 0;
  let totalCost = 0;

  filteredSaleItems.forEach(item => {
    const revenue = (item.quantity || 0) * (item.price_at_sale || 0);
    const p = productMap.get(item.product_id);
    const costPrice = p ? p.cost_price || 0 : 0;
    const cost = (item.quantity || 0) * costPrice;

    totalRevenue += revenue;
    totalCost += cost;
  });

  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // 2. All-Time Cumulative Metrics
  let allTimeTotalRevenue = 0;
  let allTimeTotalCost = 0;

  allSaleItems.forEach(item => {
    const revenue = (item.quantity || 0) * (item.price_at_sale || 0);
    const p = productMap.get(item.product_id);
    const costPrice = p ? p.cost_price || 0 : 0;
    const cost = (item.quantity || 0) * costPrice;

    allTimeTotalRevenue += revenue;
    allTimeTotalCost += cost;
  });

  const allTimeNetProfit = allTimeTotalRevenue - allTimeTotalCost;
  const allTimeMarginPercent = allTimeTotalRevenue > 0 ? Math.round((allTimeNetProfit / allTimeTotalRevenue) * 100) : 0;

  const isCumulativeQuery = rawQuery ? /المحققة|التراكمية|المحل|الكلية|إجمالي|كلي|في النظام/i.test(rawQuery) : false;

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'ALL',
      totalRevenue,
      totalCost,
      netProfit,
      marginPercent,
      salesCount: filteredSales.length,
      allTimeTotalRevenue,
      allTimeTotalCost,
      allTimeNetProfit,
      allTimeMarginPercent,
      allTimeSalesCount: allSales.length,
      isCumulativeQuery,
    },
    metadata: { toolName: 'getProfitSummary' },
  };
}

/**
 * 3. Customer Debts & Balances Tool
 */
export async function getCustomerDebtsTool(targetName?: string, dateRange?: string): Promise<Evidence> {
  const customers = await db.customers.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  // Calculate committed paying customers based on real database records
  let committedCustomers: any[] = [];
  try {
    const allDebts = await db.debts.toArray();
    const payments = allDebts.filter(d => d.type === 'payment');
    const customerPaymentSums: Record<number, number> = {};
    payments.forEach(p => {
      if (p.customer_id) {
        customerPaymentSums[p.customer_id] = (customerPaymentSums[p.customer_id] || 0) + p.amount;
      }
    });

    committedCustomers = customers
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalPaid: customerPaymentSums[c.id!] || 0,
        balance: c.balance
      }))
      .filter(c => c.totalPaid > 0)
      .sort((a, b) => b.totalPaid - a.totalPaid);
  } catch (err) {
    console.warn('Failed to calculate committed customers:', err);
  }

  if (effectiveTarget) {
    const matched = customers.filter(c => matchesNameFuzzy(c.name, effectiveTarget));
    
    if (matched.length > 0) {
      const customerIds = new Set(matched.map(c => c.id));
      let debts = (await db.debts.toArray()).filter(d => customerIds.has(d.customer_id));
      if (dateRange && dateRange !== 'ALL') {
        debts = filterSalesByDateRange(debts, dateRange, 'created_at');
      }

      return {
        source: 'INDEXED_DB',
        data: {
          dateRange: dateRange || 'ALL',
          searchedName: effectiveTarget,
          matchedCustomers: matched.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            balance: c.balance,
          })),
          recentDebtTransactions: debts.slice(-10),
          committedCustomers: committedCustomers,
        },
        metadata: { toolName: 'getCustomerDebts' },
      };
    }
  }

  const totalDebt = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
  const indebtedCustomers = customers
    .filter(c => (c.balance || 0) > 0)
    .sort((a, b) => b.balance - a.balance);

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'ALL',
      notMatchedSearchedName: effectiveTarget,
      totalCustomerDebt: totalDebt,
      indebtedCount: indebtedCustomers.length,
      topDebtors: indebtedCustomers.slice(0, 5),
      allCustomersCount: customers.length,
      committedCustomers: committedCustomers,
    },
    metadata: { toolName: 'getCustomerDebts' },
  };
}

/**
 * 4. Detailed Customer Account Statement Tool (Kashf Hisab)
 */
export async function getCustomerStatementTool(targetName?: string, dateRange?: string): Promise<Evidence> {
  const customers = await db.customers.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  if (!effectiveTarget) {
    const totalDebt = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
    return {
      source: 'INDEXED_DB',
      data: {
        dateRange: dateRange || 'ALL',
        message: 'يرجى تحديد اسم العميل لعرض كشف الحساب التفصيلي',
        totalCustomerDebt: totalDebt,
        topCustomers: customers.slice(0, 5).map(c => ({ id: c.id, name: c.name, balance: c.balance })),
      },
      metadata: { toolName: 'getCustomerStatement' },
    };
  }

  const matched = customers.filter(c => matchesNameFuzzy(c.name, effectiveTarget));
  if (matched.length === 0) {
    return {
      source: 'INDEXED_DB',
      data: {
        dateRange: dateRange || 'ALL',
        searchedName: effectiveTarget,
        found: false,
        message: `لم يتم العثور على عميل باسم "${effectiveTarget}"`,
      },
      metadata: { toolName: 'getCustomerStatement' },
    };
  }

  const customer = matched[0];
  const allDebts = await db.debts.toArray();
  const customerDebts = allDebts
    .filter(d => d.customer_id === customer.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let periodDebts = customerDebts;
  if (dateRange && dateRange !== 'ALL') {
    periodDebts = filterSalesByDateRange(customerDebts, dateRange, 'created_at');
  }

  let runningBalance = 0;
  const statementLines = customerDebts.map(d => {
    if (d.type === 'purchase') {
      runningBalance += d.amount;
    } else {
      runningBalance -= d.amount;
    }
    return {
      id: d.id,
      date: d.created_at,
      type: d.type === 'purchase' ? 'آجل (فاتورة)' : 'سداد نقد',
      amount: d.amount,
      runningBalance,
      notes: d.notes || '',
    };
  });

  const periodPurchases = periodDebts.filter(d => d.type === 'purchase').reduce((acc, d) => acc + d.amount, 0);
  const periodPayments = periodDebts.filter(d => d.type === 'payment').reduce((acc, d) => acc + d.amount, 0);

  const totalPurchases = customerDebts.filter(d => d.type === 'purchase').reduce((acc, d) => acc + d.amount, 0);
  const totalPayments = customerDebts.filter(d => d.type === 'payment').reduce((acc, d) => acc + d.amount, 0);

  return {
    source: 'INDEXED_DB',
    data: {
      found: true,
      dateRange: dateRange || 'ALL',
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        currentBalance: customer.balance,
      },
      summary: {
        totalPurchases,
        totalPayments,
        netBalance: customer.balance,
        periodPurchases,
        periodPayments,
        periodCount: periodDebts.length,
      },
      periodDebts: periodDebts.map(d => ({
        id: d.id,
        date: d.created_at,
        type: d.type === 'purchase' ? 'آجل (فاتورة)' : 'سداد نقد',
        amount: d.amount,
        notes: d.notes || ''
      })),
      statementLines: statementLines.slice(-15), // Last 15 ledger entries
    },
    metadata: { toolName: 'getCustomerStatement' },
  };
}

/**
 * 5. Supplier Debts & Balances Tool
 */
export async function getSupplierDebtsTool(targetName?: string, dateRange?: string): Promise<Evidence> {
  const suppliers = await db.suppliers.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  if (effectiveTarget) {
    const matched = suppliers.filter(s => matchesNameFuzzy(s.name, effectiveTarget));

    if (matched.length > 0) {
      const supplierIds = new Set(matched.map(s => s.id));
      let payments = (await db.supplierPayments.toArray()).filter(p => supplierIds.has(p.supplier_id));
      if (dateRange && dateRange !== 'ALL') {
        payments = filterSalesByDateRange(payments, dateRange, 'payment_date');
      }

      return {
        source: 'INDEXED_DB',
        data: {
          dateRange: dateRange || 'ALL',
          searchedName: effectiveTarget,
          matchedSuppliers: matched.map(s => ({
            id: s.id,
            name: s.name,
            phone: s.phone,
            balance: s.balance,
          })),
          recentPayments: payments.slice(-10),
        },
        metadata: { toolName: 'getSupplierDebts' },
      };
    }
  }

  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.balance || 0), 0);
  const indebtedSuppliers = suppliers
    .filter(s => (s.balance || 0) > 0)
    .sort((a, b) => b.balance - a.balance);

  const supplierPayments = await db.supplierPayments.toArray();
  const totalCapitalPaidToSuppliers = supplierPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const products = await db.products.toArray();
  const totalInventoryCostValuation = products.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0);
  const totalInventoryRetailValuation = products.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.sale_price || 0)), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'ALL',
      notMatchedSearchedName: effectiveTarget,
      totalSupplierDebt,
      indebtedSuppliersCount: indebtedSuppliers.length,
      topSuppliersDue: indebtedSuppliers.slice(0, 5),
      allSuppliersCount: suppliers.length,
      totalCapitalPaidToSuppliers,
      totalInventoryCostValuation,
      totalInventoryRetailValuation,
    },
    metadata: { toolName: 'getSupplierDebts' },
  };
}

/**
 * 6. Detailed Supplier Statement Tool
 */
export async function getSupplierStatementTool(targetName?: string, dateRange?: string): Promise<Evidence> {
  const suppliers = await db.suppliers.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  if (!effectiveTarget) {
    const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.balance || 0), 0);
    return {
      source: 'INDEXED_DB',
      data: {
        dateRange: dateRange || 'ALL',
        message: 'يرجى تحديد اسم المورد أو الشركة لعرض كشف الحساب التفصيلي',
        totalSupplierDebt,
        topSuppliers: suppliers.slice(0, 5).map(s => ({ id: s.id, name: s.name, balance: s.balance })),
      },
      metadata: { toolName: 'getSupplierStatement' },
    };
  }

  const matched = suppliers.filter(s => matchesNameFuzzy(s.name, effectiveTarget));
  if (matched.length === 0) {
    return {
      source: 'INDEXED_DB',
      data: {
        dateRange: dateRange || 'ALL',
        searchedName: effectiveTarget,
        found: false,
        message: `لم يتم العثور على مورد باسم "${effectiveTarget}"`,
      },
      metadata: { toolName: 'getSupplierStatement' },
    };
  }

  const supplier = matched[0];
  const allPayments = await db.supplierPayments.toArray();
  const supplierPayments = allPayments
    .filter(p => p.supplier_id === supplier.id)
    .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());

  let periodPayments = supplierPayments;
  if (dateRange && dateRange !== 'ALL') {
    periodPayments = filterSalesByDateRange(supplierPayments, dateRange, 'payment_date');
  }

  const totalPaid = supplierPayments.reduce((acc, p) => acc + p.amount, 0);
  const periodPaid = periodPayments.reduce((acc, p) => acc + p.amount, 0);

  return {
    source: 'INDEXED_DB',
    data: {
      found: true,
      dateRange: dateRange || 'ALL',
      supplier: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        currentBalance: supplier.balance,
      },
      summary: {
        totalPaidToSupplier: totalPaid,
        periodPaidToSupplier: periodPaid,
        dueBalanceToSupplier: supplier.balance,
        periodPaymentCount: periodPayments.length,
      },
      periodPayments: periodPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        payment_date: p.payment_date,
        notes: p.notes || ''
      })),
      recentPayments: supplierPayments.slice(-10),
    },
    metadata: { toolName: 'getSupplierStatement' },
  };
}

/**
 * 6.1 Supplier Payments Tool (سدادات ومدفوعات الموردين)
 */
export async function getSupplierPaymentsTool(
  targetName?: string,
  dateRange?: string,
  isVerification?: boolean
): Promise<Evidence> {
  const suppliers = await db.suppliers.toArray();
  const allPayments = await db.supplierPayments.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  const filteredPayments = filterSalesByDateRange(allPayments, dateRange, 'payment_date');

  if (effectiveTarget) {
    const matchedSuppliers = suppliers.filter(s => matchesNameFuzzy(s.name, effectiveTarget));
    
    if (matchedSuppliers.length > 0) {
      const supplierIds = new Set(matchedSuppliers.map(s => s.id));
      const targetSupplier = matchedSuppliers[0];
      
      const supplierPeriodPayments = filteredPayments.filter(p => supplierIds.has(p.supplier_id));
      const totalPaidPeriod = supplierPeriodPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      const allSupplierPayments = allPayments.filter(p => supplierIds.has(p.supplier_id));
      const allTimePaid = allSupplierPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

      return {
        source: 'INDEXED_DB',
        data: {
          dateRange: dateRange || 'TODAY',
          isVerification: !!isVerification,
          searchedSupplier: effectiveTarget,
          supplierMatched: true,
          supplierName: targetSupplier.name,
          supplierPhone: targetSupplier.phone,
          currentSupplierBalance: targetSupplier.balance || 0,
          totalPaid: totalPaidPeriod,
          paymentCount: supplierPeriodPayments.length,
          allTimePaid,
          payments: supplierPeriodPayments.map(p => ({
            id: p.id,
            amount: p.amount,
            payment_date: p.payment_date,
            notes: p.notes || ''
          }))
        },
        metadata: { toolName: 'getSupplierPayments' },
      };
    } else {
      return {
        source: 'INDEXED_DB',
        data: {
          dateRange: dateRange || 'TODAY',
          isVerification: !!isVerification,
          searchedSupplier: effectiveTarget,
          supplierMatched: false,
          totalPaid: 0,
          paymentCount: 0,
          payments: []
        },
        metadata: { toolName: 'getSupplierPayments' },
      };
    }
  }

  // General query for all suppliers in the specified date range
  const totalPaidPeriod = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

  const breakdownMap: Record<number, { name: string; totalPaid: number; count: number }> = {};
  filteredPayments.forEach(p => {
    const sName = supplierMap.get(p.supplier_id) || `مورد #${p.supplier_id}`;
    if (!breakdownMap[p.supplier_id]) {
      breakdownMap[p.supplier_id] = { name: sName, totalPaid: 0, count: 0 };
    }
    breakdownMap[p.supplier_id].totalPaid += p.amount || 0;
    breakdownMap[p.supplier_id].count += 1;
  });

  const supplierBreakdown = Object.values(breakdownMap).sort((a, b) => b.totalPaid - a.totalPaid);

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'TODAY',
      isVerification: !!isVerification,
      searchedSupplier: undefined,
      supplierMatched: false,
      totalPaid: totalPaidPeriod,
      paymentCount: filteredPayments.length,
      supplierBreakdown,
      payments: filteredPayments.slice(-10).map(p => ({
        id: p.id,
        supplierName: supplierMap.get(p.supplier_id) || `مورد #${p.supplier_id}`,
        amount: p.amount,
        payment_date: p.payment_date,
        notes: p.notes || ''
      }))
    },
    metadata: { toolName: 'getSupplierPayments' },
  };
}

/**
 * 6.2 Customer Payments Tool (تحصيلات وسدادات العملاء)
 */
export async function getCustomerPaymentsTool(
  targetName?: string,
  dateRange?: string,
  isVerification?: boolean
): Promise<Evidence> {
  const customers = await db.customers.toArray();
  const allDebts = await db.debts.toArray();
  const paymentDebts = allDebts.filter(d => d.type === 'payment');
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  const filteredPayments = filterSalesByDateRange(paymentDebts, dateRange, 'created_at');

  if (effectiveTarget) {
    const matchedCustomers = customers.filter(c => matchesNameFuzzy(c.name, effectiveTarget));
    
    if (matchedCustomers.length > 0) {
      const customerIds = new Set(matchedCustomers.map(c => c.id));
      const targetCustomer = matchedCustomers[0];
      
      const customerPeriodPayments = filteredPayments.filter(p => customerIds.has(p.customer_id));
      const totalCollectedPeriod = customerPeriodPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      const allCustomerPayments = paymentDebts.filter(p => customerIds.has(p.customer_id));
      const allTimeCollected = allCustomerPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

      return {
        source: 'INDEXED_DB',
        data: {
          dateRange: dateRange || 'TODAY',
          isVerification: !!isVerification,
          searchedCustomer: effectiveTarget,
          customerMatched: true,
          customerName: targetCustomer.name,
          customerPhone: targetCustomer.phone,
          currentCustomerBalance: targetCustomer.balance || 0,
          totalCollected: totalCollectedPeriod,
          paymentCount: customerPeriodPayments.length,
          allTimeCollected,
          payments: customerPeriodPayments.map(p => ({
            id: p.id,
            amount: p.amount,
            created_at: p.created_at,
            notes: p.notes || ''
          }))
        },
        metadata: { toolName: 'getCustomerPayments' },
      };
    } else {
      return {
        source: 'INDEXED_DB',
        data: {
          dateRange: dateRange || 'TODAY',
          isVerification: !!isVerification,
          searchedCustomer: effectiveTarget,
          customerMatched: false,
          totalCollected: 0,
          paymentCount: 0,
          payments: []
        },
        metadata: { toolName: 'getCustomerPayments' },
      };
    }
  }

  // General query for all customers in the specified date range
  const totalCollectedPeriod = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  const breakdownMap: Record<number, { name: string; totalCollected: number; count: number }> = {};
  filteredPayments.forEach(p => {
    const cName = customerMap.get(p.customer_id) || `عميل #${p.customer_id}`;
    if (!breakdownMap[p.customer_id]) {
      breakdownMap[p.customer_id] = { name: cName, totalCollected: 0, count: 0 };
    }
    breakdownMap[p.customer_id].totalCollected += p.amount || 0;
    breakdownMap[p.customer_id].count += 1;
  });

  const customerBreakdown = Object.values(breakdownMap).sort((a, b) => b.totalCollected - a.totalCollected);

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'TODAY',
      isVerification: !!isVerification,
      searchedCustomer: undefined,
      customerMatched: false,
      totalCollected: totalCollectedPeriod,
      paymentCount: filteredPayments.length,
      customerBreakdown,
      payments: filteredPayments.slice(-10).map(p => ({
        id: p.id,
        customerName: customerMap.get(p.customer_id) || `عميل #${p.customer_id}`,
        amount: p.amount,
        created_at: p.created_at,
        notes: p.notes || ''
      }))
    },
    metadata: { toolName: 'getCustomerPayments' },
  };
}

/**
 * 6.3 Purchases Summary Tool (ملخص ومتابعة المشتريات)
 */
export async function getPurchasesSummaryTool(
  targetName?: string,
  dateRange?: string
): Promise<Evidence> {
  const suppliers = await db.suppliers.toArray();
  const supplierPayments = await db.supplierPayments.toArray();
  const products = await db.products.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  const filteredPayments = filterSalesByDateRange(supplierPayments, dateRange, 'payment_date');

  let targetSupplierObj: any = null;
  if (effectiveTarget) {
    targetSupplierObj = suppliers.find(s => matchesNameFuzzy(s.name, effectiveTarget));
  }

  const supplierIds = targetSupplierObj ? new Set([targetSupplierObj.id]) : null;

  const relevantPayments = supplierIds
    ? filteredPayments.filter(p => supplierIds.has(p.supplier_id))
    : filteredPayments;

  const totalPaidInPeriod = relevantPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const relevantProducts = supplierIds
    ? products.filter(p => p.supplier_id === targetSupplierObj.id)
    : products;

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'THIS_MONTH',
      searchedSupplier: effectiveTarget,
      supplierMatched: !!targetSupplierObj,
      supplierName: targetSupplierObj?.name,
      totalPaidInPeriod,
      paymentCount: relevantPayments.length,
      supplierBalance: targetSupplierObj ? targetSupplierObj.balance : suppliers.reduce((acc, s) => acc + (s.balance || 0), 0),
      associatedProductsCount: relevantProducts.length,
      payments: relevantPayments.slice(-10)
    },
    metadata: { toolName: 'getPurchasesSummary' },
  };
}

/**
 * 7. Low Stock & Deficit Report Tool
 */
export async function getLowStockReportTool(): Promise<Evidence> {
  const products = await db.products.toArray();
  const lowStock = products.filter(p => (p.stock_quantity || 0) <= 5 && (p.stock_quantity || 0) > 0);
  const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0);

  const totalRestockCostEstimate = [...lowStock, ...outOfStock].reduce((acc, p) => {
    const minDesired = 10;
    const needed = Math.max(0, minDesired - (p.stock_quantity || 0));
    return acc + needed * (p.cost_price || 0);
  }, 0);

  return {
    source: 'INDEXED_DB',
    data: {
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      outOfStockItems: outOfStock.map(p => ({ id: p.id, name: p.name, category: p.category, cost_price: p.cost_price })),
      criticalLowItems: lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock_quantity, cost_price: p.cost_price })),
      totalRestockCostEstimate,
    },
    metadata: { toolName: 'getLowStockReport' },
  };
}

/**
 * 8. Expired & Expiring Inventory Report Tool
 */
export async function getExpiredAndExpiringReportTool(): Promise<Evidence> {
  const products = await db.products.toArray();
  const now = new Date();

  const expired: any[] = [];
  const expiring7Days: any[] = [];
  const expiring30Days: any[] = [];

  const dayInMs = 24 * 60 * 60 * 1000;

  products.forEach(p => {
    if (!p.expiration_date) return;
    const exp = new Date(p.expiration_date);
    const diffDays = (exp.getTime() - now.getTime()) / dayInMs;

    if (diffDays < 0) {
      expired.push(p);
    } else if (diffDays <= 7) {
      expiring7Days.push(p);
    } else if (diffDays <= 30) {
      expiring30Days.push(p);
    }
  });

  const totalExpiredLossCost = expired.reduce((acc, p) => acc + (p.stock_quantity || 0) * (p.cost_price || 0), 0);
  const totalExpiringAtRiskCost = [...expiring7Days, ...expiring30Days].reduce((acc, p) => acc + (p.stock_quantity || 0) * (p.cost_price || 0), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      expiredCount: expired.length,
      totalExpiredLossCost,
      expiredItems: expired.slice(0, 10).map(p => ({ name: p.name, stock: p.stock_quantity, exp: p.expiration_date })),
      expiring7DaysCount: expiring7Days.length,
      expiring7DaysItems: expiring7Days.slice(0, 5).map(p => ({ name: p.name, stock: p.stock_quantity, exp: p.expiration_date })),
      expiring30DaysCount: expiring30Days.length,
      totalExpiringAtRiskCost,
    },
    metadata: { toolName: 'getExpiredAndExpiringReport' },
  };
}

/**
 * 9. Inventory Status Tool
 */
export async function getInventoryStatusTool(targetName?: string): Promise<Evidence> {
  const products = await db.products.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  if (effectiveTarget) {
    const matched = products.filter(
      p => matchesNameFuzzy(p.name, effectiveTarget) || (p.barcode && p.barcode.includes(effectiveTarget))
    );

    if (matched.length > 0) {
      const allSaleItems = await db.saleItems.toArray();
      const allSales = await db.sales.toArray();
      const saleMap = new Map(allSales.map(s => [s.id, s]));
      const customers = await db.customers.toArray();
      const customerMap = new Map(customers.map(c => [c.id, c]));

      const matchedDetails = matched.map(p => {
        const pItems = allSaleItems.filter(si => si.product_id === p.id);
        const totalQtySold = pItems.reduce((acc, si) => acc + si.quantity, 0);
        const totalRevenue = pItems.reduce((acc, si) => acc + si.quantity * si.price_at_sale, 0);
        const totalCost = pItems.reduce((acc, si) => acc + si.quantity * (p.cost_price || 0), 0);
        const totalProfit = totalRevenue - totalCost;
        const salesCount = pItems.length;

        const recentTransactions = pItems.slice(-5).reverse().map(si => {
          const s = saleMap.get(si.sale_id);
          const c = s && s.customer_id ? customerMap.get(s.customer_id) : null;
          return {
            saleId: si.sale_id,
            date: s ? s.created_at : '',
            customerName: c ? c.name : 'زبون نقدي',
            quantity: si.quantity,
            priceAtSale: si.price_at_sale,
            total: si.quantity * si.price_at_sale,
          };
        });

        return {
          id: p.id,
          name: p.name,
          barcode: p.barcode || 'غير محدد',
          unit: p.unit || 'حبة',
          stock_quantity: p.stock_quantity,
          sale_price: p.sale_price,
          cost_price: p.cost_price,
          category: p.category || 'عام',
          production_date: p.production_date,
          expiration_date: p.expiration_date,
          totalQtySold,
          totalRevenue,
          totalProfit,
          salesCount,
          recentTransactions,
        };
      });

      return {
        source: 'INDEXED_DB',
        data: {
          searchedName: effectiveTarget,
          matchedProducts: matchedDetails,
        },
        metadata: { toolName: 'getInventoryStatus' },
      };
    }
  }

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= 5);
  const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) === 0);

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringProducts = products.filter(p => {
    if (!p.expiration_date) return false;
    const exp = new Date(p.expiration_date);
    return exp >= now && exp <= thirtyDaysLater;
  });

  const totalStockValueCost = products.reduce((acc, p) => acc + (p.stock_quantity || 0) * (p.cost_price || 0), 0);
  const totalStockValueSale = products.reduce((acc, p) => acc + (p.stock_quantity || 0) * (p.sale_price || 0), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      notMatchedSearchedName: effectiveTarget,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringCount: expiringProducts.length,
      lowStockItems: lowStockProducts.slice(0, 5),
      expiringItems: expiringProducts.slice(0, 5),
      totalStockValueCost,
      totalStockValueSale,
    },
    metadata: { toolName: 'getInventoryStatus' },
  };
}

/**
 * 10. Sales By Product Tool
 */
export async function getSalesByProductTool(productName?: string, dateRange?: string, isVerification?: boolean): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const filteredSales = filterSalesByDateRange(allSales, dateRange);
  const filteredSaleIds = new Set(filteredSales.map(s => s.id));
  const saleMap = new Map(filteredSales.map(s => [s.id, s]));

  const allSaleItems = await db.saleItems.toArray();
  const dateSaleItems = allSaleItems.filter(si => filteredSaleIds.has(si.sale_id));

  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));
  const customers = await db.customers.toArray();
  const customerMap = new Map(customers.map(c => [c.id, c]));

  const effectiveTarget = isGenericPluralCategory(productName) ? undefined : productName?.trim();

  if (effectiveTarget) {
    const matchedProds = products.filter(p => matchesNameFuzzy(p.name, effectiveTarget));
    if (matchedProds.length > 0) {
      const prodIds = new Set(matchedProds.map(p => p.id));
      const relevantItems = dateSaleItems.filter(si => prodIds.has(si.product_id));

      const totalQuantity = relevantItems.reduce((acc, si) => acc + si.quantity, 0);
      const totalRevenue = relevantItems.reduce((acc, si) => acc + si.quantity * si.price_at_sale, 0);

      const detailedSales = relevantItems.slice(-10).map(si => {
        const sale = saleMap.get(si.sale_id);
        const cust = sale && sale.customer_id ? customerMap.get(sale.customer_id) : null;
        const prod = productMap.get(si.product_id);
        return {
          invoiceId: si.sale_id,
          productName: prod ? prod.name : `منتج #${si.product_id}`,
          date: sale ? sale.created_at : new Date().toISOString(),
          customerName: cust ? cust.name : 'زبون نقدي',
          quantity: si.quantity,
          priceAtSale: si.price_at_sale,
          total: si.quantity * si.price_at_sale,
        };
      });

      return {
        source: 'INDEXED_DB',
        data: {
          dateRange: dateRange || 'TODAY',
          isVerification: !!isVerification,
          searchedProduct: effectiveTarget,
          matchedProducts: matchedProds.map(p => p.name),
          totalQuantitySold: totalQuantity,
          totalRevenue,
          saleCount: relevantItems.length,
          isSold: totalQuantity > 0,
          invoices: detailedSales,
        },
        metadata: { toolName: 'getSalesByProduct' },
      };
    }
  }

  const productStats: Record<number, { name: string; category: string; qty: number; revenue: number }> = {};
  dateSaleItems.forEach(si => {
    const p = productMap.get(si.product_id);
    const name = p ? p.name : `منتج #${si.product_id}`;
    const category = p ? p.category : 'عام';

    if (!productStats[si.product_id]) {
      productStats[si.product_id] = { name, category, qty: 0, revenue: 0 };
    }
    productStats[si.product_id].qty += si.quantity;
    productStats[si.product_id].revenue += si.quantity * si.price_at_sale;
  });

  const sortedByQty = Object.values(productStats).sort((a, b) => b.qty - a.qty);
  const sortedByRevenue = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'TODAY',
      isVerification: !!isVerification,
      searchedProduct: effectiveTarget,
      topSellingByQty: sortedByQty.slice(0, 10),
      topSellingByRevenue: sortedByRevenue.slice(0, 10),
      totalUniqueProductsSold: Object.keys(productStats).length,
    },
    metadata: { toolName: 'getSalesByProduct' },
  };
}

/**
 * 11. Invoice Search & Detail Tool
 */
export async function getInvoiceSearchTool(invoiceId?: string, query?: string): Promise<Evidence> {
  const sales = await db.sales.toArray();
  const saleItems = await db.saleItems.toArray();
  const customers = await db.customers.toArray();
  const products = await db.products.toArray();

  const customerMap = new Map(customers.map(c => [c.id, c]));
  const productMap = new Map(products.map(p => [p.id, p]));

  if (invoiceId) {
    const idNum = parseInt(invoiceId, 10);
    const sale = sales.find(s => s.id === idNum);

    if (sale) {
      const items = saleItems.filter(si => si.sale_id === sale.id);
      const customer = sale.customer_id ? customerMap.get(sale.customer_id) : null;

      const detailedItems = items.map(si => {
        const p = productMap.get(si.product_id);
        return {
          productName: p ? p.name : `منتج #${si.product_id}`,
          quantity: si.quantity,
          priceAtSale: si.price_at_sale,
          total: si.quantity * si.price_at_sale,
        };
      });

      return {
        source: 'INDEXED_DB',
        data: {
          found: true,
          invoice: {
            id: sale.id,
            date: sale.created_at,
            customerName: customer ? customer.name : 'زبون نقدي',
            paymentType: sale.payment_type === 'cash' ? 'نقداً' : 'آجل (دين)',
            totalAmount: sale.total_amount,
            notes: sale.notes || '',
            items: detailedItems,
          },
        },
        metadata: { toolName: 'getInvoiceSearch' },
      };
    }
  }

  const recentInvoices = sales.slice(-10).reverse().map(s => {
    const customer = s.customer_id ? customerMap.get(s.customer_id) : null;
    return {
      id: s.id,
      date: s.created_at,
      customerName: customer ? customer.name : 'زبون نقدي',
      paymentType: s.payment_type === 'cash' ? 'نقداً' : 'آجل',
      totalAmount: s.total_amount,
    };
  });

  return {
    source: 'INDEXED_DB',
    data: {
      found: false,
      message: invoiceId ? `لم يتم العثور على الفاتورة رقم ${invoiceId}` : 'قائمة آخر الفواتير الصادرة',
      recentInvoices,
    },
    metadata: { toolName: 'getInvoiceSearch' },
  };
}

/**
 * 12. Cash and Expense Tool
 */
export async function getCashSummaryTool(dateRange?: string, isVerification?: boolean): Promise<Evidence> {
  const allWithdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const settlements = await db.salesSettlements ? await db.salesSettlements.toArray() : [];

  const withdrawals = filterSalesByDateRange(allWithdrawals, dateRange, 'date');
  const unrepaidWithdrawals = withdrawals.filter(w => !w.is_repaid);
  const totalUnrepaidAmount = unrepaidWithdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);
  const totalWithdrawalsAmount = withdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);
  const lastSettlement = settlements.length > 0 ? settlements[settlements.length - 1] : null;

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'TODAY',
      isVerification: !!isVerification,
      withdrawalsCount: withdrawals.length,
      totalWithdrawalsAmount,
      unrepaidWithdrawalsCount: unrepaidWithdrawals.length,
      totalUnrepaidAmount,
      recentWithdrawals: withdrawals.slice(-10),
      lastSettlement,
    },
    metadata: { toolName: 'getCashSummary' },
  };
}

/**
 * 13. Financial Anomaly & Outlier Scanner Tool
 */
export async function getAnomalyDetectionTool(dateRange?: string, isVerification?: boolean): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const allWithdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const customers = await db.customers.toArray();

  const sales = filterSalesByDateRange(allSales, dateRange);
  const withdrawals = filterSalesByDateRange(allWithdrawals, dateRange, 'date');

  const zeroAmountSales = sales.filter(s => (s.total_amount || 0) <= 0);
  const largeDebtSales = sales.filter(s => s.payment_type === 'debt' && (s.total_amount || 0) >= 500);
  const unrepaidWithdrawals = withdrawals.filter(w => !w.is_repaid);

  const topDistressedCustomers = customers
    .filter(c => (c.balance || 0) > 300)
    .sort((a, b) => b.balance - a.balance);

  // Invoke statistical Z-score machine learning detector
  const mlAnomalies = await detectAnomalies();

  const totalAnomalies = zeroAmountSales.length + unrepaidWithdrawals.length + (dateRange && dateRange !== 'ALL' ? 0 : mlAnomalies.length);

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'TODAY',
      isVerification: !!isVerification,
      anomalyCount: totalAnomalies,
      zeroAmountSalesCount: zeroAmountSales.length,
      unrepaidWithdrawalsCount: unrepaidWithdrawals.length,
      unrepaidWithdrawalsTotal: unrepaidWithdrawals.reduce((acc, w) => acc + (w.amount || 0), 0),
      largeDebtSalesCount: largeDebtSales.length,
      topDistressedCustomers: topDistressedCustomers.map(c => ({ name: c.name, balance: c.balance })),
      mlAnomalies,
    },
    metadata: { toolName: 'getAnomalyDetection' },
  };
}

/**
 * 13b. Sales Prediction and Product Cross-Selling Association Rule Forecast Tool
 */
export async function getForecastTool(): Promise<Evidence> {
  const forecast = await forecastSales();
  const basketRules = await getMarketBasketRules();

  return {
    source: 'INDEXED_DB',
    data: {
      forecast,
      crossSellingRecommendations: basketRules.slice(0, 10),
    },
    metadata: { toolName: 'getForecast' },
  };
}

/**
 * 14. Comprehensive Financial Report (P&L + Balance Sheet)
 */
export async function getFinancialReportTool(dateRange?: string): Promise<Evidence> {
  const sales = await db.sales.toArray();
  const filteredSales = filterSalesByDateRange(sales, dateRange);
  const saleIds = new Set(filteredSales.map(s => s.id));

  const saleItems = (await db.saleItems.toArray()).filter(si => saleIds.has(si.sale_id));
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

  let totalSalesRevenue = 0;
  let totalCOGS = 0;

  saleItems.forEach(si => {
    const rev = si.quantity * si.price_at_sale;
    const p = productMap.get(si.product_id);
    const cost = si.quantity * (p ? p.cost_price || 0 : 0);

    totalSalesRevenue += rev;
    totalCOGS += cost;
  });

  const grossProfit = totalSalesRevenue - totalCOGS;

  const withdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const operatingExpenses = withdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);
  const netOperatingProfit = grossProfit - operatingExpenses;

  const customers = await db.customers.toArray();
  const totalAccountsReceivable = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

  const suppliers = await db.suppliers.toArray();
  const totalAccountsPayable = suppliers.reduce((acc, s) => acc + (s.balance || 0), 0);

  const inventoryValueCost = products.reduce((acc, p) => acc + (p.stock_quantity || 0) * (p.cost_price || 0), 0);
  const inventoryValueRetail = products.reduce((acc, p) => acc + (p.stock_quantity || 0) * (p.sale_price || 0), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange || 'TODAY',
      pAndL: {
        totalSalesRevenue,
        totalCOGS,
        grossProfit,
        operatingExpenses,
        netOperatingProfit,
        grossMarginPercent: totalSalesRevenue > 0 ? Math.round((grossProfit / totalSalesRevenue) * 100) : 0,
      },
      balanceSheet: {
        accountsReceivableCustomerDebt: totalAccountsReceivable,
        accountsPayableSupplierDebt: totalAccountsPayable,
        inventoryAssetValuationCost: inventoryValueCost,
        inventoryAssetValuationRetail: inventoryValueRetail,
      },
    },
    metadata: { toolName: 'getFinancialReport' },
  };
}

/**
 * 15. Notes and Reminders Tool
 */
export async function getNotesAndRemindersTool(): Promise<Evidence> {
  const notes = await db.notes ? await db.notes.toArray() : [];
  const pendingNotes = notes.filter(n => !n.is_completed);

  return {
    source: 'INDEXED_DB',
    data: {
      totalNotes: notes.length,
      pendingCount: pendingNotes.length,
      pendingNotes: pendingNotes.slice(0, 5),
    },
    metadata: { toolName: 'getNotesAndReminders' },
  };
}

/**
 * 16. VAT & Tax Report Tool (ZATCA 15%)
 */
export async function getTaxReportTool(dateRange?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const filteredSales = filterSalesByDateRange(allSales, dateRange);

  const totalSalesInclusive = filteredSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  // VAT 15% calculation: Amount_Excluding_VAT = Total / 1.15; VAT = Total - Amount_Excluding_VAT
  const taxBaseAmount = totalSalesInclusive / 1.15;
  const vatCollectedAmount = totalSalesInclusive - taxBaseAmount;

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange || 'TODAY',
      totalSalesInclusive,
      taxBaseAmount: Math.round(taxBaseAmount * 100) / 100,
      vatCollectedAmount: Math.round(vatCollectedAmount * 100) / 100,
      vatRatePercent: 15,
      invoicesCount: filteredSales.length,
    },
    metadata: { toolName: 'getTaxReport' },
  };
}

/**
 * 17. Top Selling Products Tool
 */
export async function getTopSellingProductsTool(limit = 5): Promise<Evidence> {
  const saleItems = await db.saleItems.toArray();
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

  const productAgg: Record<number, { name: string; totalQty: number; totalRevenue: number }> = {};

  saleItems.forEach(si => {
    const p = productMap.get(si.product_id);
    const name = p ? p.name : `منتج #${si.product_id}`;
    if (!productAgg[si.product_id]) {
      productAgg[si.product_id] = { name, totalQty: 0, totalRevenue: 0 };
    }
    productAgg[si.product_id].totalQty += si.quantity;
    productAgg[si.product_id].totalRevenue += si.quantity * si.price_at_sale;
  });

  const sortedList = Object.values(productAgg)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, limit);

  return {
    source: 'INDEXED_DB',
    data: {
      topProducts: sortedList,
      limit,
    },
    metadata: { toolName: 'getTopSellingProducts' },
  };
}

/**
 * 18. POS Shift Summary Tool
 */
export async function getPOSShiftSummaryTool(dateRange?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const filteredSales = filterSalesByDateRange(allSales, dateRange || 'TODAY');

  const cashTotal = filteredSales
    .filter(s => s.payment_type === 'cash')
    .reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const cardTotal = filteredSales
    .filter(s => s.payment_type === 'card')
    .reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const creditTotal = filteredSales
    .filter(s => s.payment_type === 'credit')
    .reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const totalNetSales = cashTotal + cardTotal + creditTotal;

  const withdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const todayWithdrawals = withdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange || 'TODAY',
      totalSales: totalNetSales,
      paymentBreakdown: {
        cash: cashTotal,
        card: cardTotal,
        credit: creditTotal,
      },
      cashInDrawer: cashTotal - todayWithdrawals,
      cashWithdrawals: todayWithdrawals,
      transactionCount: filteredSales.length,
    },
    metadata: { toolName: 'getPOSShiftSummary' },
  };
}

/**
 * 19. Largest Sale / Highest Invoice Tool
 */
export async function getLargestSaleTool(dateRange?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const customers = await db.customers.toArray();
  const customerMap = new Map(customers.map(c => [c.id, c]));

  const effectiveRange = dateRange || 'ALL';
  const filteredSales = (effectiveRange !== 'ALL') ? filterSalesByDateRange(allSales, effectiveRange) : allSales;

  if (filteredSales.length === 0) {
    // If no sales in specified range, check if there are all-time sales
    if (effectiveRange !== 'ALL' && allSales.length > 0) {
      const allTimeSorted = [...allSales].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
      const topSale = allTimeSorted[0];
      const custObj = topSale.customer_id ? customerMap.get(topSale.customer_id) : null;
      return {
        source: 'INDEXED_DB',
        data: {
          found: false,
          fallbackFound: true,
          message: `لا توجد فواتير بيع مسجلة خلال الفترة المحددة، ولكن أعلى عملية بيع مسجلة في المتجر بشكل عام هي الفاتورة #${topSale.id} بمبلغ ${topSale.total_amount?.toLocaleString()} ر.س لصالح (${custObj ? custObj.name : 'زبون نقدي'}).`,
        },
        metadata: { toolName: 'getLargestSale' },
      };
    }

    return {
      source: 'INDEXED_DB',
      data: {
        found: false,
        message: 'لا توجد أي فواتير أو عمليات بيع مسجلة في النظام حتى الآن.',
      },
      metadata: { toolName: 'getLargestSale' },
    };
  }

  // Sort sales descending by total_amount
  const sortedSales = [...filteredSales].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
  const largestSale = sortedSales[0];

  // Fetch customer details
  const customerObj = largestSale.customer_id ? customerMap.get(largestSale.customer_id) : null;

  // Fetch sale items
  const allSaleItems = await db.saleItems.toArray();
  const invoiceItems = allSaleItems.filter(si => si.sale_id === largestSale.id);

  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

  let totalCost = 0;
  const detailedItems = invoiceItems.map(item => {
    const p = productMap.get(item.product_id);
    const costPrice = p?.cost_price || 0;
    const itemCost = (item.quantity || 0) * costPrice;
    const itemRevenue = (item.quantity || 0) * (item.price_at_sale || 0);
    const itemProfit = itemRevenue - itemCost;
    totalCost += itemCost;

    return {
      productId: item.product_id,
      productName: p ? p.name : `منتج #${item.product_id}`,
      barcode: p?.barcode || '',
      quantity: item.quantity,
      unitPrice: item.price_at_sale,
      costPrice,
      totalPrice: itemRevenue,
      totalProfit: itemProfit,
      marginPercent: itemRevenue > 0 ? Math.round((itemProfit / itemRevenue) * 100) : 0,
    };
  });

  const totalRevenue = largestSale.total_amount;
  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Top 5 largest sales summary
  const topSalesSummary = sortedSales.slice(0, 5).map((s, idx) => {
    const cust = s.customer_id ? customerMap.get(s.customer_id) : null;
    return {
      rank: idx + 1,
      invoiceId: s.id,
      date: s.created_at,
      totalAmount: s.total_amount,
      customerName: cust ? cust.name : 'زبون نقدي عام',
      paymentType: s.payment_type === 'cash' ? 'نقداً (كاش)' : s.payment_type === 'card' ? 'شبكة' : 'آجل (دين)',
    };
  });

  return {
    source: 'INDEXED_DB',
    data: {
      found: true,
      sale: largestSale,
      invoiceId: largestSale.id,
      date: largestSale.created_at,
      totalAmount: totalRevenue,
      paymentType: largestSale.payment_type === 'cash' ? 'نقداً (كاش)' : largestSale.payment_type === 'card' ? 'شبكة / بطاقة' : 'آجل (دين)',
      customerName: customerObj ? customerObj.name : 'زبون نقدي عام',
      customerPhone: customerObj?.phone,
      customerBalance: customerObj?.balance || 0,
      items: detailedItems,
      itemCount: detailedItems.length,
      totalCost,
      netProfit,
      marginPercent,
      dateRange: effectiveRange,
      totalSalesCount: filteredSales.length,
      topSales: topSalesSummary,
    },
    metadata: { toolName: 'getLargestSale' },
  };
}

/**
 * 20. Multi-Turn Drill-down & Contextual Explanation Tool
 */
export async function getDrilldownExplanationTool(context?: any): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const allSaleItems = await db.saleItems.toArray();
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));
  const customers = await db.customers.toArray();
  const customerMap = new Map(customers.map(c => [c.id, c]));

  // If specific invoiceId in context or previous evidence
  const invoiceId = context?.invoiceId || context?.lastEvidenceData?.invoiceId || context?.lastEvidenceData?.sale?.id;

  if (invoiceId) {
    const sale = allSales.find(s => String(s.id) === String(invoiceId));
    if (sale) {
      const items = allSaleItems.filter(si => si.sale_id === sale.id);
      let totalCost = 0;
      const detailedItems = items.map(item => {
        const p = productMap.get(item.product_id);
        const costPrice = p?.cost_price || 0;
        const itemCost = (item.quantity || 0) * costPrice;
        const itemRevenue = (item.quantity || 0) * (item.price_at_sale || 0);
        const itemProfit = itemRevenue - itemCost;
        totalCost += itemCost;

        return {
          productId: item.product_id,
          productName: p ? p.name : `منتج #${item.product_id}`,
          quantity: item.quantity,
          unitPrice: item.price_at_sale,
          costPrice,
          totalPrice: itemRevenue,
          totalProfit: itemProfit,
        };
      });

      const cust = sale.customer_id ? customerMap.get(sale.customer_id) : null;

      return {
        source: 'INDEXED_DB',
        data: {
          type: 'INVOICE_DRILLDOWN',
          sale,
          invoiceId: sale.id,
          date: sale.created_at,
          totalAmount: sale.total_amount,
          customerName: cust ? cust.name : 'زبون نقدي',
          paymentType: sale.payment_type === 'cash' ? 'نقداً (كاش)' : 'آجل (دين)',
          items: detailedItems,
          totalCost,
          netProfit: sale.total_amount - totalCost,
        },
        metadata: { toolName: 'getDrilldownExplanation' },
      };
    }
  }

  // If previous topic was DEBT / CUSTOMER
  const targetName = context?.targetName;
  if (targetName) {
    const cust = customers.find(c => matchesNameFuzzy(c.name, targetName));
    if (cust) {
      const custSales = allSales.filter(s => s.customer_id === cust.id);
      const debts = await db.debts ? await db.debts.toArray() : [];
      const custDebts = debts.filter(d => d.customer_id === cust.id);

      return {
        source: 'INDEXED_DB',
        data: {
          type: 'CUSTOMER_DRILLDOWN',
          customer: cust,
          totalPurchases: custSales.reduce((sum, s) => sum + s.total_amount, 0),
          invoicesCount: custSales.length,
          recentInvoices: custSales.slice(-10),
          debtRecords: custDebts.slice(-10),
          currentBalance: cust.balance,
        },
        metadata: { toolName: 'getDrilldownExplanation' },
      };
    }
  }

  // Default General Sales/Profit Drilldown from last turn
  return {
    source: 'INDEXED_DB',
    data: {
      type: 'GENERAL_EXPLANATION',
      lastTopic: context?.lastTopic || 'GENERAL',
      lastIntent: context?.lastIntent,
      lastEvidenceData: context?.lastEvidenceData,
      explanationContext: context?.explanationContext,
    },
    metadata: { toolName: 'getDrilldownExplanation' },
  };
}

/**
 * 21. Sales & Profit Comparison Tool (Month-over-Month & Period Comparison)
 */
export async function getSalesComparisonTool(dateRange?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const allSaleItems = await db.saleItems.toArray();
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

  const now = new Date();
  // Current Month vs Last Month
  const currentMonthSales = filterSalesByDateRange(allSales, 'THIS_MONTH');
  const lastMonthSales = filterSalesByDateRange(allSales, 'LAST_MONTH');

  const calcMetrics = (salesList: typeof allSales) => {
    const saleIds = new Set(salesList.map(s => s.id));
    const items = allSaleItems.filter(si => saleIds.has(si.sale_id));
    
    let totalRevenue = 0;
    let totalCost = 0;
    let cashSales = 0;
    let debtSales = 0;

    salesList.forEach(s => {
      totalRevenue += (s.total_amount || 0);
      if (s.payment_type === 'cash') cashSales += (s.total_amount || 0);
      else debtSales += (s.total_amount || 0);
    });

    items.forEach(si => {
      const p = productMap.get(si.product_id);
      totalCost += (si.quantity || 0) * (p?.cost_price || 0);
    });

    const netProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
    const avgInvoice = salesList.length > 0 ? Math.round(totalRevenue / salesList.length) : 0;

    return {
      totalRevenue,
      totalCost,
      netProfit,
      marginPercent,
      invoiceCount: salesList.length,
      avgInvoice,
      cashSales,
      debtSales,
    };
  };

  const current = calcMetrics(currentMonthSales);
  const previous = calcMetrics(lastMonthSales);

  const revenueDiff = current.totalRevenue - previous.totalRevenue;
  const revenueGrowthPercent = previous.totalRevenue > 0 ? Math.round((revenueDiff / previous.totalRevenue) * 100) : (current.totalRevenue > 0 ? 100 : 0);

  const profitDiff = current.netProfit - previous.netProfit;
  const profitGrowthPercent = previous.netProfit > 0 ? Math.round((profitDiff / previous.netProfit) * 100) : (current.netProfit > 0 ? 100 : 0);

  const invoiceDiff = current.invoiceCount - previous.invoiceCount;

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange || 'THIS_MONTH_VS_LAST_MONTH',
      current,
      previous,
      comparison: {
        revenueDiff,
        revenueGrowthPercent,
        profitDiff,
        profitGrowthPercent,
        invoiceDiff,
        isGrowing: revenueGrowthPercent >= 0,
      },
    },
    metadata: { toolName: 'getSalesComparison' },
  };
}

/**
 * 22. Root Cause Diagnostic Tool (لماذا انخفضت الأرباح والمبيعات)
 */
export async function getDiagnosticAnalysisTool(): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const allSaleItems = await db.saleItems.toArray();
  const products = await db.products.toArray();
  const withdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const customers = await db.customers.toArray();

  const currentMonthSales = filterSalesByDateRange(allSales, 'THIS_MONTH');
  const lastMonthSales = filterSalesByDateRange(allSales, 'LAST_MONTH');

  const currentRev = currentMonthSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const lastRev = lastMonthSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) <= 0);
  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5);

  const monthWithdrawals = filterSalesByDateRange(withdrawals, 'THIS_MONTH', 'date');
  const totalMonthWithdrawals = monthWithdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);

  const creditSales = currentMonthSales.filter(s => s.payment_type === 'credit' || s.payment_type === 'debt');
  const creditSalesTotal = creditSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const creditRatio = currentRev > 0 ? Math.round((creditSalesTotal / currentRev) * 100) : 0;

  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (currentRev < lastRev) {
    const dropPercent = lastRev > 0 ? Math.round(((lastRev - currentRev) / lastRev) * 100) : 0;
    reasons.push(`تراجع إجمالي المبيعات بنسبة ${dropPercent}% مقارنة بالشهر الماضي (${currentRev.toLocaleString()} ر.س مقابل ${lastRev.toLocaleString()} ر.س).`);
  }

  if (outOfStockProducts.length > 0) {
    reasons.push(`وجود ${outOfStockProducts.length} أصناف منتهية تماماً من الرفوف والمخزن مما سبب فقدان مبيعات محققة.`);
    recommendations.push(`إعادة طلب وتغذية الأصناف المنتهية (مثل: ${outOfStockProducts.slice(0, 3).map(p => p.name).join('، ')}) فوراً.`);
  }

  if (totalMonthWithdrawals > 0) {
    reasons.push(`تسجيل مسحوبات ونفقات نقدية خلال هذا الشهر بقيمة ${totalMonthWithdrawals.toLocaleString()} ر.س تؤثر على السيولة وصافي الأرباح.`);
    recommendations.push(`ضبط وترشيد المصاريف والمسحوبات التشغيلية اليومية.`);
  }

  if (creditRatio > 35) {
    reasons.push(`ارتفاع نسبة المبيعات الآجلة (ذمم مدينة) إلى ${creditRatio}% من إجمالي المبيعات مما يعطل حركة السيولة النقدية.`);
    recommendations.push(`وضع سقف ائتماني للعملاء وتكثيف التحصيل النقدي.`);
  }

  if (reasons.length === 0) {
    reasons.push(`المبيعات والأرباح مستقرة وتسير ضمن المعدلات الطبيعية، ولا توجد مؤشرات انخفاض حادة.`);
    recommendations.push(`الاستمرار في تحسين خلطة المنتجات الأكثر ربحية وعروض الترويج.`);
  }

  return {
    source: 'INDEXED_DB',
    data: {
      currentRev,
      lastRev,
      outOfStockCount: outOfStockProducts.length,
      lowStockCount: lowStockProducts.length,
      totalMonthWithdrawals,
      creditRatio,
      totalCustomerDebt,
      reasons,
      recommendations,
    },
    metadata: { toolName: 'getDiagnosticAnalysis' },
  };
}

/**
 * 23. Growth Strategy & Revenue Optimization Tool (كيف أزيد مبيعاتي وأرباح المحل)
 */
export async function getGrowthStrategyTool(): Promise<Evidence> {
  const basketRules = await getMarketBasketRules();
  const products = await db.products.toArray();
  const saleItems = await db.saleItems.toArray();
  const customers = await db.customers.toArray();

  // Find top profitable products
  const profitableProducts = products
    .filter(p => p.sale_price && p.cost_price && p.sale_price > p.cost_price && (p.stock_quantity || 0) > 0)
    .map(p => ({
      name: p.name,
      margin: Math.round(((p.sale_price - p.cost_price) / p.sale_price) * 100),
      stock: p.stock_quantity,
      profitPerUnit: p.sale_price - p.cost_price,
    }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  // Fast moving products that need stock monitoring
  const outOfStock = products.filter(p => (p.stock_quantity || 0) <= 0);

  // Top Debtors with overdue cash
  const topDebtors = customers
    .filter(c => (c.balance || 0) > 200)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 4);

  return {
    source: 'INDEXED_DB',
    data: {
      crossSelling: basketRules.slice(0, 4),
      highMarginProducts: profitableProducts,
      outOfStockCount: outOfStock.length,
      topDebtorsToCollect: topDebtors.map(c => ({ name: c.name, balance: c.balance })),
    },
    metadata: { toolName: 'getGrowthStrategy' },
  };
}

/**
 * 24. Customer Collection Rate Tool (نسبة السداد والتحصيل من الزبائن)
 */
export async function getCustomerCollectionRateTool(dateRange?: string): Promise<Evidence> {
  const debts = await db.debts ? await db.debts.toArray() : [];
  const customers = await db.customers.toArray();
  const now = new Date();
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
  const monthDebts = debts.filter(d => new Date(d.created_at).getTime() >= startOfMonth);

  const purchasesInMonth = monthDebts.filter(d => d.type === 'purchase');
  const paymentsInMonth = monthDebts.filter(d => d.type === 'payment');

  const totalNewDebts = purchasesInMonth.reduce((acc, d) => acc + (d.amount || 0), 0);
  const totalCollected = paymentsInMonth.reduce((acc, d) => acc + (d.amount || 0), 0);

  const totalOutstandingBalance = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

  const totalDueBase = totalNewDebts + totalOutstandingBalance;
  const collectionRate = totalDueBase > 0 ? Math.round((totalCollected / (totalNewDebts > 0 ? totalNewDebts : totalDueBase)) * 100) : 0;

  // Top paying customers this month
  const customerPayMap: Record<number, number> = {};
  paymentsInMonth.forEach(p => {
    customerPayMap[p.customer_id] = (customerPayMap[p.customer_id] || 0) + (p.amount || 0);
  });

  const customerMap = new Map(customers.map(c => [c.id, c]));
  const topPayers = Object.entries(customerPayMap).map(([idStr, amount]) => {
    const c = customerMap.get(Number(idStr));
    return {
      name: c ? c.name : `عميل #${idStr}`,
      amount,
      currentBalance: c?.balance || 0,
    };
  }).sort((a, b) => b.amount - a.amount).slice(0, 5);

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange || 'THIS_MONTH',
      totalNewDebts,
      totalCollected,
      totalOutstandingBalance,
      collectionRate: Math.min(collectionRate, 100),
      paymentTransactionsCount: paymentsInMonth.length,
      topPayers,
    },
    metadata: { toolName: 'getCustomerCollectionRate' },
  };
}

/**
 * 25. Cash Flow Statement Tool (ملخص حركة التدفقات النقدية الداخلة والخارجة)
 */
export async function getCashFlowStatementTool(dateRange?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const debts = await db.debts ? await db.debts.toArray() : [];
  const withdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const supplierPayments = await db.supplierPayments ? await db.supplierPayments.toArray() : [];

  const filteredSales = filterSalesByDateRange(allSales, dateRange || 'THIS_MONTH');
  const filteredDebts = filterSalesByDateRange(debts, dateRange || 'THIS_MONTH', 'created_at');
  const filteredWithdrawals = filterSalesByDateRange(withdrawals, dateRange || 'THIS_MONTH', 'date');
  const filteredSupplierPayments = filterSalesByDateRange(supplierPayments, dateRange || 'THIS_MONTH', 'payment_date');

  // Inflows
  const cashSalesInflow = filteredSales
    .filter(s => s.payment_type === 'cash')
    .reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const debtRepaymentInflow = filteredDebts
    .filter(d => d.type === 'payment')
    .reduce((acc, d) => acc + (d.amount || 0), 0);

  const totalInflows = cashSalesInflow + debtRepaymentInflow;

  // Outflows
  const supplierCashOutflow = filteredSupplierPayments
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const operationalWithdrawalOutflow = filteredWithdrawals
    .reduce((acc, w) => acc + (w.amount || 0), 0);

  const totalOutflows = supplierCashOutflow + operationalWithdrawalOutflow;

  const netCashFlow = totalInflows - totalOutflows;

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange || 'THIS_MONTH',
      inflows: {
        cashSales: cashSalesInflow,
        debtRepayments: debtRepaymentInflow,
        totalInflows,
      },
      outflows: {
        supplierPayments: supplierCashOutflow,
        operationalWithdrawals: operationalWithdrawalOutflow,
        totalOutflows,
      },
      netCashFlow,
      isPositive: netCashFlow >= 0,
    },
    metadata: { toolName: 'getCashFlowStatement' },
  };
}

/**
 * 26. Unpaid Credit Invoices Tool (كشف الذمم المدينة (الفواتير الآجلة))
 */
export async function getUnpaidInvoicesTool(): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const customers = await db.customers.toArray();
  const customerMap = new Map(customers.map(c => [c.id, c]));

  const creditSales = allSales
    .filter(s => s.payment_type === 'debt')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalCreditAmount = creditSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);

  const detailedList = creditSales.slice(0, 15).map(s => {
    const cust = s.customer_id ? customerMap.get(s.customer_id) : null;
    return {
      invoiceId: s.id,
      date: s.created_at,
      customerName: cust ? cust.name : 'عميل غير مسجل',
      phone: cust?.phone || 'غير مسجل',
      totalAmount: s.total_amount,
      customerCurrentBalance: cust?.balance || s.total_amount,
    };
  });

  return {
    source: 'INDEXED_DB',
    data: {
      totalCreditInvoicesCount: creditSales.length,
      totalCreditAmount,
      recentUnpaidInvoices: detailedList,
    },
    metadata: { toolName: 'getUnpaidInvoices' },
  };
}

/**
 * 27. Due Supplier Balances Tool (الموردين الذين لديهم مستحقات واجبة السداد)
 */
export async function getSuppliersDueTool(): Promise<Evidence> {
  const suppliers = await db.suppliers.toArray();
  const indebtedSuppliers = suppliers
    .filter(s => (s.balance || 0) > 0)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0));

  const totalDueAmount = indebtedSuppliers.reduce((acc, s) => acc + (s.balance || 0), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      dueSuppliersCount: indebtedSuppliers.length,
      totalDueAmount,
      suppliersList: indebtedSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone || 'غير مسجل',
        balance: s.balance,
      })),
    },
    metadata: { toolName: 'getSuppliersDue' },
  };
}

/**
 * 28. Inventory Financial Valuation Tool (القيمة المالية للمخزون الحالي)
 */
export async function getInventoryValuationTool(): Promise<Evidence> {
  const products = await db.products.toArray();

  let totalStockQty = 0;
  let totalCostValuation = 0;
  let totalRetailValuation = 0;

  const categoryBreakdown: Record<string, { qty: number; costVal: number; retailVal: number }> = {};

  products.forEach(p => {
    const qty = p.stock_quantity || 0;
    const cost = p.cost_price || 0;
    const retail = p.sale_price || 0;
    const cat = p.category || 'عام';

    totalStockQty += qty;
    totalCostValuation += qty * cost;
    totalRetailValuation += qty * retail;

    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { qty: 0, costVal: 0, retailVal: 0 };
    }
    categoryBreakdown[cat].qty += qty;
    categoryBreakdown[cat].costVal += qty * cost;
    categoryBreakdown[cat].retailVal += qty * retail;
  });

  const expectedGrossProfit = totalRetailValuation - totalCostValuation;
  const expectedMarginPercent = totalRetailValuation > 0 ? Math.round((expectedGrossProfit / totalRetailValuation) * 100) : 0;

  return {
    source: 'INDEXED_DB',
    data: {
      totalProductsCount: products.length,
      totalStockUnits: totalStockQty,
      totalCostValuation,
      totalRetailValuation,
      expectedGrossProfit,
      expectedMarginPercent,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, stat]) => ({
        category: name,
        ...stat,
      })),
    },
    metadata: { toolName: 'getInventoryValuation' },
  };
}

/**
 * 29. 360-Degree Store Health Diagnostic Tool (تشخيص صحة المحل الشامل)
 */
export async function getStoreHealthDiagnosticTool(): Promise<Evidence> {
  const [sales, saleItems, products, customers, suppliers, withdrawals] = await Promise.all([
    db.sales.toArray(),
    db.saleItems.toArray(),
    db.products.toArray(),
    db.customers.toArray(),
    db.suppliers.toArray(),
    db.cashWithdrawals.toArray(),
  ]);

  // Product price/cost lookup
  const productMap = new Map<number, { cost: number; price: number; name: string; stock: number }>();
  products.forEach(p => {
    if (p.id) productMap.set(p.id, { cost: p.cost_price || 0, price: p.sale_price || 0, name: p.name, stock: p.stock_quantity || 0 });
  });

  // Sales this month vs last month
  const thisMonthSales = filterSalesByDateRange(sales, 'THIS_MONTH');
  const lastMonthSales = filterSalesByDateRange(sales, 'LAST_MONTH');

  const thisMonthRevenue = thisMonthSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const lastMonthRevenue = lastMonthSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const salesGrowthRate = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

  // Profit calculations
  const thisMonthSaleIds = new Set(thisMonthSales.map(s => s.id));
  const thisMonthItems = saleItems.filter(item => thisMonthSaleIds.has(item.sale_id));

  let totalCost = 0;
  let totalGrossRevenue = 0;
  thisMonthItems.forEach(item => {
    const prod = productMap.get(item.product_id);
    const itemCost = prod ? prod.cost : 0;
    totalCost += item.quantity * itemCost;
    totalGrossRevenue += item.quantity * item.price_at_sale;
  });

  const grossProfit = totalGrossRevenue - totalCost;
  const grossMarginPercent = totalGrossRevenue > 0 ? Math.round((grossProfit / totalGrossRevenue) * 100) : 0;

  // Operational expenses / withdrawals this month
  const thisMonthWithdrawals = filterSalesByDateRange(withdrawals, 'THIS_MONTH');
  const totalExpenses = thisMonthWithdrawals.filter(w => !w.is_repaid).reduce((acc, w) => acc + (w.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;

  // Debts & Liquidity
  const totalCustomerDebt = customers.reduce((acc, c) => acc + ((c.balance || 0) > 0 ? c.balance : 0), 0);
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + ((s.balance || 0) > 0 ? s.balance : 0), 0);
  const topDebtors = [...customers].filter(c => (c.balance || 0) > 0).sort((a, b) => b.balance - a.balance).slice(0, 3);
  const topCreditors = [...suppliers].filter(s => (s.balance || 0) > 0).sort((a, b) => b.balance - a.balance).slice(0, 3);

  // Inventory Health
  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= 5);
  let totalInventoryCostValuation = 0;
  products.forEach(p => {
    totalInventoryCostValuation += (p.stock_quantity || 0) * (p.cost_price || 0);
  });

  // Calculate Comprehensive 360 Score (0 to 100)
  let healthScore = 70; // baseline
  if (salesGrowthRate > 0) healthScore += 10;
  else if (salesGrowthRate < -10) healthScore -= 10;

  if (grossMarginPercent >= 20) healthScore += 10;
  else if (grossMarginPercent < 10) healthScore -= 10;

  if (lowStockProducts.length <= 5) healthScore += 5;
  else if (lowStockProducts.length > 15) healthScore -= 10;

  if (totalCustomerDebt > totalGrossRevenue * 1.5 && totalGrossRevenue > 0) healthScore -= 10;
  healthScore = Math.max(10, Math.min(100, healthScore));

  let statusArabic = 'ممتاز ومستقر';
  if (healthScore < 50) statusArabic = 'يحتاج إلى تدخل وإعادة ضبط';
  else if (healthScore < 75) statusArabic = 'جيد مع بعض نقاط التحسين';

  return {
    source: 'INDEXED_DB',
    data: {
      healthScore,
      statusArabic,
      sales: {
        thisMonthRevenue,
        lastMonthRevenue,
        salesGrowthRate,
        invoicesCount: thisMonthSales.length,
      },
      profit: {
        grossProfit,
        grossMarginPercent,
        totalExpenses,
        netProfit,
      },
      debts: {
        totalCustomerDebt,
        totalSupplierDebt,
        topDebtors: topDebtors.map(d => ({ name: d.name, balance: d.balance })),
        topCreditors: topCreditors.map(s => ({ name: s.name, balance: s.balance })),
      },
      inventory: {
        totalProductsCount: products.length,
        lowStockCount: lowStockProducts.length,
        totalInventoryValuation: totalInventoryCostValuation,
        lowStockSample: lowStockProducts.slice(0, 5).map(p => ({ name: p.name, stock: p.stock_quantity })),
      }
    },
    metadata: { toolName: 'getStoreHealthDiagnostic' },
  };
}

/**
 * 30. Performance Comparison Tool (مقارنة الأداء بين الفترات)
 */
export async function getPerformanceComparisonTool(dateRange = 'THIS_MONTH'): Promise<Evidence> {
  const [sales, saleItems, products] = await Promise.all([
    db.sales.toArray(),
    db.saleItems.toArray(),
    db.products.toArray(),
  ]);

  const productMap = new Map<number, number>();
  products.forEach(p => {
    if (p.id) productMap.set(p.id, p.cost_price || 0);
  });

  // Current period vs previous period
  let currentRange = 'THIS_MONTH';
  let previousRange = 'LAST_MONTH';
  let currentLabel = 'هذا الشهر';
  let previousLabel = 'الشهر الماضي';

  if (dateRange === 'TODAY' || dateRange === 'YESTERDAY') {
    currentRange = 'TODAY';
    previousRange = 'YESTERDAY';
    currentLabel = 'اليوم';
    previousLabel = 'الأمس';
  } else if (dateRange === 'THIS_WEEK' || dateRange === 'LAST_WEEK') {
    currentRange = 'THIS_WEEK';
    previousRange = 'LAST_WEEK';
    currentLabel = 'هذا الأسبوع';
    previousLabel = 'الأسبوع الماضي';
  }

  const currentSales = filterSalesByDateRange(sales, currentRange);
  const prevSales = filterSalesByDateRange(sales, previousRange);

  const currentRevenue = currentSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const prevRevenue = prevSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const revenueDiff = currentRevenue - prevRevenue;
  const revenueGrowthPercent = prevRevenue > 0 ? Math.round((revenueDiff / prevRevenue) * 100) : (currentRevenue > 0 ? 100 : 0);

  // Profit in current vs prev
  const currentSaleIds = new Set(currentSales.map(s => s.id));
  const prevSaleIds = new Set(prevSales.map(s => s.id));

  let currentGrossProfit = 0;
  let prevGrossProfit = 0;

  saleItems.forEach(item => {
    const cost = productMap.get(item.product_id) || 0;
    const profit = item.quantity * (item.price_at_sale - cost);
    if (currentSaleIds.has(item.sale_id)) currentGrossProfit += profit;
    if (prevSaleIds.has(item.sale_id)) prevGrossProfit += profit;
  });

  const profitDiff = currentGrossProfit - prevGrossProfit;
  const profitGrowthPercent = prevGrossProfit > 0 ? Math.round((profitDiff / prevGrossProfit) * 100) : (currentGrossProfit > 0 ? 100 : 0);

  const isBetter = revenueDiff > 0 && profitDiff >= 0;

  return {
    source: 'INDEXED_DB',
    data: {
      currentLabel,
      previousLabel,
      isBetter,
      current: {
        revenue: currentRevenue,
        invoicesCount: currentSales.length,
        grossProfit: currentGrossProfit,
        avgInvoiceValue: currentSales.length > 0 ? Math.round(currentRevenue / currentSales.length) : 0,
      },
      previous: {
        revenue: prevRevenue,
        invoicesCount: prevSales.length,
        grossProfit: prevGrossProfit,
        avgInvoiceValue: prevSales.length > 0 ? Math.round(prevRevenue / prevSales.length) : 0,
      },
      comparison: {
        revenueDiff,
        revenueGrowthPercent,
        profitDiff,
        profitGrowthPercent,
        invoicesDiff: currentSales.length - prevSales.length,
      }
    },
    metadata: { toolName: 'getPerformanceComparison' },
  };
}

/**
 * 31. Top Revenue & Profit Contributing Products Tool (أكثر الأصناف دخلاً وربحاً)
 */
export async function getTopRevenueOrProfitProductsTool(dateRange = 'THIS_MONTH', limit = 5): Promise<Evidence> {
  const [sales, saleItems, products] = await Promise.all([
    db.sales.toArray(),
    db.saleItems.toArray(),
    db.products.toArray(),
  ]);

  const productMap = new Map<number, { name: string; cost: number; price: number; category: string }>();
  products.forEach(p => {
    if (p.id) productMap.set(p.id, { name: p.name, cost: p.cost_price || 0, price: p.sale_price || 0, category: p.category || 'عام' });
  });

  const filteredSales = filterSalesByDateRange(sales, dateRange);
  const targetSaleIds = new Set(filteredSales.map(s => s.id));
  const relevantItems = saleItems.filter(item => targetSaleIds.has(item.sale_id));

  const productStats = new Map<number, { id: number; name: string; category: string; quantitySold: number; totalRevenue: number; totalCost: number; grossProfit: number }>();

  relevantItems.forEach(item => {
    const prod = productMap.get(item.product_id);
    const cost = prod ? prod.cost : 0;
    const name = prod ? prod.name : `منتج #${item.product_id}`;
    const category = prod ? prod.category : 'عام';

    const revenue = item.quantity * item.price_at_sale;
    const itemCost = item.quantity * cost;
    const profit = revenue - itemCost;

    if (!productStats.has(item.product_id)) {
      productStats.set(item.product_id, {
        id: item.product_id,
        name,
        category,
        quantitySold: 0,
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
      });
    }

    const stat = productStats.get(item.product_id)!;
    stat.quantitySold += item.quantity;
    stat.totalRevenue += revenue;
    stat.totalCost += itemCost;
    stat.grossProfit += profit;
  });

  const statsList = Array.from(productStats.values());
  const sortedByRevenue = [...statsList].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, limit);
  const sortedByProfit = [...statsList].sort((a, b) => b.grossProfit - a.grossProfit).slice(0, limit);

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange,
      topRevenueProducts: sortedByRevenue,
      topProfitProducts: sortedByProfit,
      highestRevenueProduct: sortedByRevenue[0] || null,
      highestProfitProduct: sortedByProfit[0] || null,
    },
    metadata: { toolName: 'getTopRevenueOrProfitProducts' },
  };
}

/**
 * 32. Top Debtors Tool (كبار المدينين وأعلى الزبائن ديوناً)
 */
export async function getTopDebtorsTool(limit = 5): Promise<Evidence> {
  const customers = await db.customers.toArray();
  const indebted = customers
    .filter(c => (c.balance || 0) > 0)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0));

  const totalDebt = indebted.reduce((acc, c) => acc + (c.balance || 0), 0);
  const topList = indebted.slice(0, limit);

  return {
    source: 'INDEXED_DB',
    data: {
      totalDebtorsCount: indebted.length,
      totalOutstandingDebt: totalDebt,
      topDebtors: topList.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || 'غير مسجل',
        balance: c.balance,
        debtSharePercent: totalDebt > 0 ? Math.round(((c.balance || 0) / totalDebt) * 100) : 0,
      })),
      topDebtor: topList[0] || null,
    },
    metadata: { toolName: 'getTopDebtors' },
  };
}

/**
 * 33. Name Ambiguity & Disambiguation Tool (التحقق من لبس تشابه أسماء العميل والمورد)
 */
export async function checkNameAmbiguityTool(searchName: string): Promise<Evidence> {
  const [customers, suppliers] = await Promise.all([
    db.customers.toArray(),
    db.suppliers.toArray(),
  ]);

  const norm = (s: string) => s.toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').trim();
  const term = norm(searchName);

  const matchedCustomers = customers.filter(c => norm(c.name).includes(term));
  const matchedSuppliers = suppliers.filter(s => norm(s.name).includes(term));

  const isAmbiguous = matchedCustomers.length > 0 && matchedSuppliers.length > 0;

  return {
    source: 'INDEXED_DB',
    data: {
      searchName,
      isAmbiguous,
      matchedCustomers: matchedCustomers.map(c => ({ id: c.id, name: c.name, balance: c.balance, phone: c.phone })),
      matchedSuppliers: matchedSuppliers.map(s => ({ id: s.id, name: s.name, balance: s.balance, phone: s.phone })),
    },
    metadata: { toolName: 'checkNameAmbiguity' },
  };
}

/**
 * 34. Product Profit & Sales Drilldown Tool (تحليل مبيعات وربح صنف محدد)
 */
export async function getProductProfitAndSalesTool(productNameOrId: string | number, dateRange = 'THIS_MONTH'): Promise<Evidence> {
  const [products, sales, saleItems] = await Promise.all([
    db.products.toArray(),
    db.sales.toArray(),
    db.saleItems.toArray(),
  ]);

  const norm = (s: string) => s.toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').trim();
  let targetProduct: any = null;

  if (typeof productNameOrId === 'number' || /^\d+$/.test(String(productNameOrId))) {
    targetProduct = products.find(p => p.id === Number(productNameOrId));
  }
  if (!targetProduct) {
    const term = norm(String(productNameOrId));
    targetProduct = products.find(p => norm(p.name).includes(term)) || products.find(p => term.includes(norm(p.name)));
  }

  if (!targetProduct) {
    return {
      source: 'INDEXED_DB',
      data: { found: false, searchName: productNameOrId },
      metadata: { toolName: 'getProductProfitAndSales' },
    };
  }

  const filteredSales = filterSalesByDateRange(sales, dateRange);
  const targetSaleIds = new Set(filteredSales.map(s => s.id));
  const productSaleItems = saleItems.filter(item => item.product_id === targetProduct.id && targetSaleIds.has(item.sale_id));

  let totalQtySold = 0;
  let totalRevenue = 0;
  productSaleItems.forEach(item => {
    totalQtySold += item.quantity;
    totalRevenue += item.quantity * item.price_at_sale;
  });

  const costPerUnit = targetProduct.cost_price || 0;
  const salePriceDefault = targetProduct.sale_price || 0;
  const totalCost = totalQtySold * costPerUnit;
  const grossProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  return {
    source: 'INDEXED_DB',
    data: {
      found: true,
      product: {
        id: targetProduct.id,
        name: targetProduct.name,
        category: targetProduct.category,
        costPrice: costPerUnit,
        salePrice: salePriceDefault,
        currentStock: targetProduct.stock_quantity,
      },
      dateRange,
      totalQtySold,
      totalRevenue,
      totalCost,
      grossProfit,
      profitMarginPercent,
      salesCount: productSaleItems.length,
    },
    metadata: { toolName: 'getProductProfitAndSales' },
  };
}

/**
 * 35. Full System Audit & Inventory Tool (جرد تفصيلي ومبتكر وشامل لكل شيء في النظام حسب الفترة الزمنية)
 */
export async function getFullSystemAuditTool(dateRange = 'ALL'): Promise<Evidence> {
  const [products, sales, saleItems, customers, suppliers, withdrawals] = await Promise.all([
    db.products.toArray(),
    db.sales.toArray(),
    db.saleItems.toArray(),
    db.customers.toArray(),
    db.suppliers.toArray(),
    db.cashWithdrawals?.toArray() || Promise.resolve([]),
  ]);

  // Product Map for fast cost lookup
  const costMap = new Map<number, number>();
  products.forEach(p => {
    if (p.id) costMap.set(p.id, p.cost_price || 0);
  });

  // Filter Sales & Withdrawals based on requested dateRange
  const filteredSales = filterSalesByDateRange(sales, dateRange, 'created_at');
  const filteredSaleIds = new Set(filteredSales.map(s => s.id));
  const filteredSaleItems = saleItems.filter(item => filteredSaleIds.has(item.sale_id));
  const filteredWithdrawals = filterSalesByDateRange(withdrawals, dateRange, 'date');

  // 1. Inventory & Products Audit
  const totalProductsCount = products.length;
  let totalStockQuantity = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let outOfStockCount = 0;

  const lowStockList: any[] = [];
  products.forEach(p => {
    const q = p.stock_quantity || 0;
    const cost = p.cost_price || 0;
    const sale = p.sale_price || 0;
    const minStock = (p as any).min_stock_level || 5;

    totalStockQuantity += q;
    totalCostValue += q * cost;
    totalRetailValue += q * sale;

    if (q <= 0) {
      outOfStockCount++;
    } else if (q <= minStock) {
      lowStockList.push({ name: p.name, q, minStock });
    }
  });
  const potentialProfit = totalRetailValue - totalCostValue;
  const periodSoldItemsCount = filteredSaleItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  // 2. Receivables & Debts Audit
  const indebtedCustomers = customers.filter(c => (c.balance || 0) > 0);
  const totalCustomerDebt = indebtedCustomers.reduce((acc, c) => acc + (c.balance || 0), 0);
  const topDebtors = indebtedCustomers
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 5)
    .map(c => ({ name: c.name, balance: c.balance }));

  const creditorSuppliers = suppliers.filter(s => (s.balance || 0) > 0);
  const totalSupplierDebt = creditorSuppliers.reduce((acc, s) => acc + (s.balance || 0), 0);
  const topCreditors = creditorSuppliers
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 5)
    .map(s => ({ name: s.name, balance: s.balance }));

  // 3. Sales & Financial Revenue Audit
  const totalInvoicesCount = filteredSales.length;
  const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);

  let totalCostOfSales = 0;
  filteredSaleItems.forEach(item => {
    const cost = costMap.get(item.product_id) || 0;
    totalCostOfSales += item.quantity * cost;
  });
  const grossProfit = totalSalesRevenue - totalCostOfSales;

  const totalWithdrawalsAmount = filteredWithdrawals.reduce((acc: number, w: any) => acc + (w.amount || 0), 0);
  const netProfit = grossProfit - totalWithdrawalsAmount;

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange,
      inventory: {
        totalProductsCount,
        totalStockQuantity,
        totalCostValue,
        totalRetailValue,
        potentialProfit,
        outOfStockCount,
        lowStockCount: lowStockList.length,
        lowStockList,
        periodSoldItemsCount,
      },
      customers: {
        totalCount: customers.length,
        indebtedCount: indebtedCustomers.length,
        totalDebt: totalCustomerDebt,
        topDebtors,
      },
      suppliers: {
        totalCount: suppliers.length,
        creditorCount: creditorSuppliers.length,
        totalDebt: totalSupplierDebt,
        topCreditors,
      },
      finance: {
        totalInvoicesCount,
        totalSalesRevenue,
        totalCostOfSales,
        grossProfit,
        totalWithdrawalsAmount,
        netProfit,
        allTimeInvoicesCount: sales.length,
        allTimeSalesRevenue: sales.reduce((acc, s) => acc + (s.total_amount || 0), 0),
      },
      netBusinessPosition: totalCustomerDebt - totalSupplierDebt,
    },
    metadata: { toolName: 'getFullSystemAudit' },
  };
}

/**
 * Supplier Payments Filtered By Date and/or Supplier Name Tool
 */
export async function getSupplierPaymentsByDateTool(nluResult: NLUResult, memoryContext: any): Promise<Evidence> {
  const dateEntity = nluResult.entities.find(e => e.type === 'DATE_RANGE');
  const supplierEntity = nluResult.entities.find(e => e.type === 'SUPPLIER_NAME' || e.type === 'NAME');
  
  const supplierName = supplierEntity?.value || memoryContext?.activeEntities?.targetName;
  const dateRange = (dateEntity?.value as string) || memoryContext?.activeEntities?.dateRange || 'TODAY';

  const payments = await db.supplierPayments.toArray();
  const suppliers = await db.suppliers.toArray();

  let filtered = filterSalesByDateRange(payments, dateRange, 'payment_date');

  if (supplierName) {
    const targetSup = suppliers.find(s => matchesNameFuzzy(s.name, supplierName));
    if (targetSup) {
      filtered = filtered.filter(t => t.supplier_id === targetSup.id);
    } else {
      filtered = filtered.filter(t => t.notes && t.notes.toLowerCase().includes(supplierName.toLowerCase()));
    }
  }

  const totalPaid = filtered.reduce((acc, t) => acc + (t.amount || 0), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      supplierName: supplierName || 'كافة الموردين',
      dateFilter: dateRange,
      totalPaid,
      count: filtered.length,
      payments: filtered.slice(0, 10).map(t => ({
        id: t.id,
        amount: t.amount,
        date: t.payment_date,
        notes: t.notes || 'سداد مورد'
      }))
    },
    metadata: { toolName: 'getSupplierPaymentsByDate' },
  };
}

/**
 * Credit Sales (Sales on Debt / Credit) Tool
 */
export async function getCreditSalesTool(nluResult: NLUResult, memoryContext: any): Promise<Evidence> {
  const dateEntity = nluResult.entities.find(e => e.type === 'DATE_RANGE');
  const dateRange = (dateEntity?.value as string) || memoryContext?.activeEntities?.dateRange || 'THIS_MONTH';

  const sales = await db.sales.toArray();
  const periodSales = filterSalesByDateRange(sales, dateRange, 'created_at');

  const creditSales = periodSales.filter(s => s.payment_type === 'debt' || s.payment_type === 'CREDIT');
  const totalCreditAmount = creditSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalSalesRevenue = periodSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const creditRatio = totalSalesRevenue > 0 ? (totalCreditAmount / totalSalesRevenue) * 100 : 0;

  const customers = await db.customers.toArray();
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange,
      creditInvoicesCount: creditSales.length,
      totalCreditAmount,
      totalSalesRevenue,
      creditRatio: Math.round(creditRatio * 10) / 10,
      recentCreditInvoices: creditSales.slice(0, 5).map(s => ({
        id: s.id,
        customerName: s.customer_id ? customerMap.get(s.customer_id) || 'عميل آجل' : 'عميل آجل',
        amount: s.total_amount,
        date: s.created_at
      }))
    },
    metadata: { toolName: 'getCreditSales' },
  };
}

/**
 * Cash Withdrawals & Adjustments Tool
 */
export async function getWithdrawalsAndAdjustmentsTool(nluResult: NLUResult, memoryContext: any): Promise<Evidence> {
  const dateEntity = nluResult.entities.find(e => e.type === 'DATE_RANGE');
  const dateRange = (dateEntity?.value as string) || memoryContext?.activeEntities?.dateRange || 'TODAY';

  const withdrawals = await db.cashWithdrawals.toArray();
  const periodWithdrawals = filterSalesByDateRange(withdrawals, dateRange, 'created_at');

  const totalAmount = periodWithdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      period: dateRange,
      count: periodWithdrawals.length,
      totalAmount,
      items: periodWithdrawals.slice(0, 10).map(w => ({
        id: w.id,
        amount: w.amount,
        reason: w.reason || 'مسحوبات نقدي / تسوية',
        date: w.created_at
      }))
    },
    metadata: { toolName: 'getWithdrawalsAndAdjustments' },
  };
}

/**
 * System Dictionary Explanation Tool
 */
export async function getSystemDictionaryExplanationTool(nluResult: NLUResult, _memoryContext: any): Promise<Evidence> {
  const { lookupSystemDictionary } = await import('../knowledge/systemDictionary');
  const rawQuery = (nluResult as any).rawQuery || '';
  const dictionaryMatches = lookupSystemDictionary(rawQuery);

  const sales = await db.sales.toArray();
  const suppliers = await db.suppliers.toArray();
  const customers = await db.customers.toArray();
  const products = await db.products.toArray();

  const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.balance || 0), 0);
  const totalCostValue = products.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0);

  return {
    source: 'INDEXED_DB',
    data: {
      queryText: rawQuery,
      matches: dictionaryMatches,
      liveMetricsSummary: {
        totalSalesRevenue,
        totalCustomerDebt,
        totalSupplierDebt,
        totalCostValue,
      }
    },
    metadata: { toolName: 'getSystemDictionaryExplanation' },
  };
}




