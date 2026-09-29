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
    const threshold = getProductMinStockAlert(p);
    if (qty <= threshold) {
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
 * Gets the custom minimum stock alert threshold for a product (defaults to 5)
 */
export function getProductMinStockAlert(product?: Partial<Product> | null): number {
  if (!product) return 5;
  const val = product.min_stock_alert ?? product.min_stock;
  if (typeof val === 'number' && !isNaN(val) && val >= 0) {
    return val;
  }
  return 5;
}

export type StockStatusType = 'out_of_stock' | 'critical_low' | 'low_stock' | 'in_stock';

export interface StockStatusInfo {
  status: StockStatusType;
  threshold: number;
  label: string;
  badgeClass: string;
  badgeBg: string;
  textColor: string;
  isAlert: boolean;
  suggestedReorderQty: number;
}

/**
 * Evaluates the multi-tier inventory status for a product based on its custom threshold
 */
export function getProductStockStatus(product?: Partial<Product> | null): StockStatusInfo {
  const stock = Number(product?.stock_quantity ?? 0);
  const threshold = getProductMinStockAlert(product);
  const reorderTarget = Math.max(threshold * 3, threshold + 10, 10);
  const suggestedReorderQty = Math.max(0, reorderTarget - Math.max(0, stock));

  if (stock <= 0) {
    return {
      status: 'out_of_stock',
      threshold,
      label: 'نفاد كلي (0)',
      badgeClass: 'bg-rose-500 text-white border-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      textColor: 'text-rose-600',
      isAlert: true,
      suggestedReorderQty
    };
  }

  // Critical Low: <= 50% of custom threshold (or <= 2)
  const criticalLimit = Math.max(1, Math.floor(threshold / 2));
  if (stock <= criticalLimit) {
    return {
      status: 'critical_low',
      threshold,
      label: `حرج جداً (بقي ${stock})`,
      badgeClass: 'bg-amber-600 text-white border-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
      textColor: 'text-amber-700',
      isAlert: true,
      suggestedReorderQty
    };
  }

  // Low stock: reached or below custom threshold
  if (stock <= threshold) {
    return {
      status: 'low_stock',
      threshold,
      label: `وصل حد الطلب (${stock}/${threshold})`,
      badgeClass: 'bg-yellow-500 text-slate-900 border-yellow-600',
      badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      textColor: 'text-yellow-700',
      isAlert: true,
      suggestedReorderQty
    };
  }

  // Normal in-stock
  return {
    status: 'in_stock',
    threshold,
    label: `متوفر (${stock})`,
    badgeClass: 'bg-emerald-600 text-white border-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textColor: 'text-emerald-700',
    isAlert: false,
    suggestedReorderQty: 0
  };
}

/**
 * Calculates a dynamic, smart stock threshold based on recent sales history (e.g. 7-14 days velocity)
 */
export function calculateSmartStockThreshold(saleItems: SaleItem[] = [], productId?: number, daysBuffer: number = 7): number {
  if (!productId || !saleItems || saleItems.length === 0) return 5;
  
  const productSales = saleItems.filter(item => item.product_id === productId);
  if (productSales.length === 0) return 5;

  const totalSold = productSales.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  // If we have sales entries, estimate daily velocity
  // Simple heuristic: average ~14 days observation period
  const dailyVelocity = Math.max(0.2, totalSold / 14);
  const calculated = Math.ceil(dailyVelocity * daysBuffer);
  
  return Math.max(3, Math.min(1000, calculated));
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
