import { Product, Sale, SaleItem, Supplier, SupplierPayment, Customer, Debt } from '../types';

export interface AccountingSummary {
  todaySales: number;
  monthlySales: number;
  totalSales: number;
  totalProfit: number;
  totalCostOfSales: number;
  totalInventoryCost: number;
  totalDebts: number;
  lowStockCount: number;
}

/**
 * Calculates core store metrics from raw entities in a single unified pass.
 */
export function calculateAccountingSummary(
  sales: Sale[] = [],
  saleItems: SaleItem[] = [],
  products: Product[] = [],
  customers: Customer[] = [],
  debts: Debt[] = []
): AccountingSummary {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  let todaySales = 0;
  let monthlySales = 0;
  let totalSales = 0;

  // Build quick map for product cost
  const productCostMap = new Map<number, number>();
  products.forEach(p => {
    if (p.id !== undefined) {
      productCostMap.set(p.id, p.cost_price || 0);
    }
  });

  // Calculate sales totals
  sales.forEach(sale => {
    const saleAmount = sale.total_amount || 0;
    totalSales += saleAmount;

    const saleDateStr = sale.created_at ? sale.created_at.split('T')[0] : '';
    if (saleDateStr === todayStr) {
      todaySales += saleAmount;
    }
    if (saleDateStr.startsWith(currentMonthStr)) {
      monthlySales += saleAmount;
    }
  });

  // Calculate cost of goods sold (COGS)
  let totalCostOfSales = 0;
  saleItems.forEach(item => {
    const unitCost = productCostMap.get(item.product_id) ?? (item.price_at_sale * 0.75);
    totalCostOfSales += unitCost * item.quantity;
  });

  const totalProfit = Math.max(0, totalSales - totalCostOfSales);

  // Calculate inventory valuation
  let totalInventoryCost = 0;
  let lowStockCount = 0;
  products.forEach(p => {
    const qty = p.stock_quantity || 0;
    const cost = p.cost_price || 0;
    totalInventoryCost += qty * cost;
    if (qty <= 5) {
      lowStockCount++;
    }
  });

  // Calculate total customer debts
  const totalDebts = customers.reduce((sum, c) => sum + Math.max(0, c.balance || 0), 0);

  return {
    todaySales,
    monthlySales,
    totalSales,
    totalProfit,
    totalCostOfSales,
    totalInventoryCost,
    totalDebts,
    lowStockCount
  };
}

/**
 * Calculates metrics for a specific supplier or all suppliers.
 */
export function calculateSupplierMetrics(
  supplierId: number | 'all',
  suppliers: Supplier[] = [],
  products: Product[] = [],
  saleItems: SaleItem[] = [],
  supplierPayments: SupplierPayment[] = []
) {
  const isAll = supplierId === 'all';
  const targetSupplierId = isAll ? null : Number(supplierId);

  const filteredSuppliers = isAll
    ? suppliers
    : suppliers.filter(s => s.id === targetSupplierId);

  const totalBalanceDue = filteredSuppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

  const filteredPayments = isAll
    ? supplierPayments
    : supplierPayments.filter(p => p.supplier_id === targetSupplierId);

  const totalPaid = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRequiredBeforeSettlement = totalBalanceDue + totalPaid;

  const supplierProducts = isAll
    ? products.filter(p => p.supplier_id != null)
    : products.filter(p => p.supplier_id === targetSupplierId);

  const supplierProductIds = new Set(supplierProducts.map(p => p.id));

  const totalInventoryCostValue = supplierProducts.reduce(
    (sum, p) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)),
    0
  );

  let totalSoldCostValue = 0;
  saleItems.forEach(item => {
    if (supplierProductIds.has(item.product_id)) {
      const prod = supplierProducts.find(p => p.id === item.product_id);
      const unitCost = prod ? prod.cost_price : (item.price_at_sale * 0.75);
      totalSoldCostValue += unitCost * item.quantity;
    }
  });

  const totalInventoryAndSoldCost = totalInventoryCostValue + totalSoldCostValue;

  return {
    totalBalanceDue,
    totalPaid,
    totalRequiredBeforeSettlement,
    totalInventoryCostValue,
    totalSoldCostValue,
    totalInventoryAndSoldCost,
    productsCount: supplierProducts.length,
    paymentsCount: filteredPayments.length
  };
}
