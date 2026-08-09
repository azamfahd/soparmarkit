import { db } from '../../../db';
import { Evidence } from '../types';
import { detectAnomalies, forecastSales, getMarketBasketRules } from '../ml';

export function filterSalesByDateRange(sales: any[], dateRange?: string) {
  if (!dateRange || dateRange === 'ALL') return sales;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateRange === 'TODAY') {
    return sales.filter(s => new Date(s.created_at) >= startOfDay);
  }

  if (dateRange === 'YESTERDAY') {
    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfDay);
    return sales.filter(s => {
      const d = new Date(s.created_at);
      return d >= startOfYesterday && d < endOfYesterday;
    });
  }

  if (dateRange === 'THIS_WEEK') {
    const startOfWeek = new Date(startOfDay);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    return sales.filter(s => new Date(s.created_at) >= startOfWeek);
  }

  if (dateRange === 'THIS_MONTH') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return sales.filter(s => new Date(s.created_at) >= startOfMonth);
  }

  if (dateRange === 'LAST_MONTH') {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return sales.filter(s => {
      const d = new Date(s.created_at);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    });
  }

  if (dateRange === 'THIS_YEAR') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return sales.filter(s => new Date(s.created_at) >= startOfYear);
  }

  return sales;
}

const PLURAL_CATEGORY_WORDS = new Set([
  'عميل', 'عملاء', 'العملاء', 'زبون', 'زبائن', 'الزبائن', 'زباين', 'مورد', 'موردين', 'الموردين',
  'شركة', 'شركات', 'الشركات', 'منتج', 'منتجات', 'المنتجات', 'صنف', 'اصناف', 'الاصناف',
  'بضاعه', 'البضاعه', 'مبيعات', 'ارباح', 'مصروفات', 'مصاريف', 'مخزون', 'المخزن', 'فواتير',
  'الكل', 'الجميع', 'الناس', 'شغل', 'محل', 'متجر', 'صندوق', 'درج', 'كاش', 'دين', 'ديون'
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
  const normSource = source.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  const normQuery = query.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  
  if (normSource.includes(normQuery) || normQuery.includes(normSource)) return true;

  const queryWords = normQuery.split(' ').filter(w => w.length > 1);
  return queryWords.some(word => normSource.includes(word));
}

/**
 * 1. Sales Summary Tool
 */
export async function getSalesSummaryTool(dateRange?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const filteredSales = filterSalesByDateRange(allSales, dateRange);

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

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'TODAY',
      totalAmount,
      invoiceCount: count,
      averageInvoiceValue: count > 0 ? Math.round(totalAmount / count) : 0,
      cashSales,
      debtSales,
      topProducts,
    },
    metadata: { toolName: 'getSalesSummary' },
  };
}

/**
 * 2. Profit Summary Tool
 */
export async function getProfitSummaryTool(dateRange?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const filteredSales = filterSalesByDateRange(allSales, dateRange);
  const saleIds = new Set(filteredSales.map(s => s.id));

  const allSaleItems = await db.saleItems.toArray();
  const filteredSaleItems = allSaleItems.filter(si => saleIds.has(si.sale_id));
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

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

  return {
    source: 'INDEXED_DB',
    data: {
      dateRange: dateRange || 'TODAY',
      totalRevenue,
      totalCost,
      netProfit,
      marginPercent,
    },
    metadata: { toolName: 'getProfitSummary' },
  };
}

/**
 * 3. Customer Debts & Balances Tool
 */
export async function getCustomerDebtsTool(targetName?: string): Promise<Evidence> {
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
      const debts = (await db.debts.toArray()).filter(d => customerIds.has(d.customer_id));

      return {
        source: 'INDEXED_DB',
        data: {
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
export async function getCustomerStatementTool(targetName?: string): Promise<Evidence> {
  const customers = await db.customers.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  if (!effectiveTarget) {
    const totalDebt = customers.reduce((acc, c) => acc + (c.balance || 0), 0);
    return {
      source: 'INDEXED_DB',
      data: {
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

  const totalPurchases = customerDebts.filter(d => d.type === 'purchase').reduce((acc, d) => acc + d.amount, 0);
  const totalPayments = customerDebts.filter(d => d.type === 'payment').reduce((acc, d) => acc + d.amount, 0);

  return {
    source: 'INDEXED_DB',
    data: {
      found: true,
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
      },
      statementLines: statementLines.slice(-15), // Last 15 ledger entries
    },
    metadata: { toolName: 'getCustomerStatement' },
  };
}

/**
 * 5. Supplier Debts & Balances Tool
 */
export async function getSupplierDebtsTool(targetName?: string): Promise<Evidence> {
  const suppliers = await db.suppliers.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  if (effectiveTarget) {
    const matched = suppliers.filter(s => matchesNameFuzzy(s.name, effectiveTarget));

    if (matched.length > 0) {
      const supplierIds = new Set(matched.map(s => s.id));
      const payments = (await db.supplierPayments.toArray()).filter(p => supplierIds.has(p.supplier_id));

      return {
        source: 'INDEXED_DB',
        data: {
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

  return {
    source: 'INDEXED_DB',
    data: {
      notMatchedSearchedName: effectiveTarget,
      totalSupplierDebt,
      indebtedSuppliersCount: indebtedSuppliers.length,
      topSuppliersDue: indebtedSuppliers.slice(0, 5),
      allSuppliersCount: suppliers.length,
    },
    metadata: { toolName: 'getSupplierDebts' },
  };
}

/**
 * 6. Detailed Supplier Statement Tool
 */
export async function getSupplierStatementTool(targetName?: string): Promise<Evidence> {
  const suppliers = await db.suppliers.toArray();
  const effectiveTarget = isGenericPluralCategory(targetName) ? undefined : targetName?.trim();

  if (!effectiveTarget) {
    const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.balance || 0), 0);
    return {
      source: 'INDEXED_DB',
      data: {
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

  const totalPaid = supplierPayments.reduce((acc, p) => acc + p.amount, 0);

  return {
    source: 'INDEXED_DB',
    data: {
      found: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        currentBalance: supplier.balance,
      },
      summary: {
        totalPaidToSupplier: totalPaid,
        dueBalanceToSupplier: supplier.balance,
      },
      recentPayments: supplierPayments.slice(-10),
    },
    metadata: { toolName: 'getSupplierStatement' },
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
      return {
        source: 'INDEXED_DB',
        data: {
          searchedName: effectiveTarget,
          matchedProducts: matched.map(p => ({
            id: p.id,
            name: p.name,
            stock_quantity: p.stock_quantity,
            sale_price: p.sale_price,
            cost_price: p.cost_price,
            category: p.category,
            expiration_date: p.expiration_date,
          })),
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
export async function getSalesByProductTool(productName?: string): Promise<Evidence> {
  const allSales = await db.sales.toArray();
  const allSaleItems = await db.saleItems.toArray();
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));

  const effectiveTarget = isGenericPluralCategory(productName) ? undefined : productName?.trim();

  if (effectiveTarget) {
    const matchedProds = products.filter(p => matchesNameFuzzy(p.name, effectiveTarget));
    if (matchedProds.length > 0) {
      const prodIds = new Set(matchedProds.map(p => p.id));
      const relevantItems = allSaleItems.filter(si => prodIds.has(si.product_id));

      const totalQuantity = relevantItems.reduce((acc, si) => acc + si.quantity, 0);
      const totalRevenue = relevantItems.reduce((acc, si) => acc + si.quantity * si.price_at_sale, 0);

      return {
        source: 'INDEXED_DB',
        data: {
          searchedProduct: effectiveTarget,
          matchedProducts: matchedProds.map(p => p.name),
          totalQuantitySold: totalQuantity,
          totalRevenue,
          saleCount: relevantItems.length,
        },
        metadata: { toolName: 'getSalesByProduct' },
      };
    }
  }

  const productStats: Record<number, { name: string; category: string; qty: number; revenue: number }> = {};
  allSaleItems.forEach(si => {
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
export async function getCashSummaryTool(): Promise<Evidence> {
  const withdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const settlements = await db.salesSettlements ? await db.salesSettlements.toArray() : [];

  const unrepaidWithdrawals = withdrawals.filter(w => !w.is_repaid);
  const totalUnrepaidAmount = unrepaidWithdrawals.reduce((acc, w) => acc + (w.amount || 0), 0);
  const lastSettlement = settlements.length > 0 ? settlements[settlements.length - 1] : null;

  return {
    source: 'INDEXED_DB',
    data: {
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
export async function getAnomalyDetectionTool(): Promise<Evidence> {
  const sales = await db.sales.toArray();
  const withdrawals = await db.cashWithdrawals ? await db.cashWithdrawals.toArray() : [];
  const customers = await db.customers.toArray();

  const zeroAmountSales = sales.filter(s => (s.total_amount || 0) <= 0);
  const largeDebtSales = sales.filter(s => s.payment_type === 'debt' && (s.total_amount || 0) >= 500);
  const unrepaidWithdrawals = withdrawals.filter(w => !w.is_repaid);

  const topDistressedCustomers = customers
    .filter(c => (c.balance || 0) > 300)
    .sort((a, b) => b.balance - a.balance);

  // Invoke statistical Z-score machine learning detector
  const mlAnomalies = await detectAnomalies();

  return {
    source: 'INDEXED_DB',
    data: {
      anomalyCount: zeroAmountSales.length + unrepaidWithdrawals.length + mlAnomalies.length,
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
