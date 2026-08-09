import { db } from '../../../db';

export interface InventoryVelocityScore {
  productId: number;
  productName: string;
  stockQuantity: number;
  salesVelocityPerDay: number;
  daysUntilStockout: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CustomerCreditRiskScore {
  customerId: number;
  customerName: string;
  currentBalance: number;
  debtAgeDays: number;
  riskScore: number; // 0 to 100
  riskCategory: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

/**
 * Computes Inventory Velocity and stockout risk for all products using historical sale items.
 */
export async function calculateInventoryVelocity(): Promise<InventoryVelocityScore[]> {
  const products = await db.products.toArray();
  const sales = await db.sales.toArray();
  const saleItems = await db.saleItems?.toArray() || [];

  if (products.length === 0) return [];

  // Consider sales from the last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentSaleIds = new Set(
    sales
      .filter(s => new Date(s.created_at).getTime() >= thirtyDaysAgo)
      .map(s => s.id!)
  );

  const productQtySoldMap: Record<number, number> = {};
  saleItems.forEach(item => {
    if (recentSaleIds.has(item.sale_id)) {
      productQtySoldMap[item.product_id] = (productQtySoldMap[item.product_id] || 0) + item.quantity;
    }
  });

  return products.map(p => {
    const qtySold30Days = productQtySoldMap[p.id!] || 0;
    const salesVelocityPerDay = parseFloat((qtySold30Days / 30).toFixed(2));
    const daysUntilStockout = salesVelocityPerDay > 0
      ? Math.round(p.stock_quantity / salesVelocityPerDay)
      : (p.stock_quantity === 0 ? 0 : 999);

    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (p.stock_quantity <= 0 || daysUntilStockout <= 5) {
      riskLevel = 'HIGH';
    } else if (p.stock_quantity <= 5 || daysUntilStockout <= 14) {
      riskLevel = 'MEDIUM';
    }

    return {
      productId: p.id!,
      productName: p.name,
      stockQuantity: p.stock_quantity,
      salesVelocityPerDay,
      daysUntilStockout,
      riskLevel,
    };
  }).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

/**
 * Computes Customer Debt Credit Risk Scores based on debt balance and age.
 */
export async function calculateCustomerCreditRisk(): Promise<CustomerCreditRiskScore[]> {
  const customers = await db.customers.toArray();
  const debts = await db.debts.toArray();

  if (customers.length === 0) return [];

  const now = Date.now();

  return customers
    .filter(c => c.balance > 0)
    .map(c => {
      const customerDebts = debts.filter(d => d.customer_id === c.id);
      let oldestDebtTimestamp = now;

      customerDebts.forEach(d => {
        const debtTime = new Date(d.created_at).getTime();
        if (debtTime < oldestDebtTimestamp) {
          oldestDebtTimestamp = debtTime;
        }
      });

      const debtAgeDays = Math.max(1, Math.round((now - oldestDebtTimestamp) / (1000 * 60 * 60 * 24)));

      // Risk score formula combining balance magnitude and age
      let riskScore = Math.min(100, Math.round((c.balance / 500) * 30 + (debtAgeDays / 30) * 70));
      if (debtAgeDays > 60) riskScore = Math.min(100, riskScore + 20);

      let riskCategory: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
      if (riskScore >= 70 || debtAgeDays >= 45) {
        riskCategory = 'CRITICAL';
      } else if (riskScore >= 40 || debtAgeDays >= 20) {
        riskCategory = 'WARNING';
      }

      return {
        customerId: c.id!,
        customerName: c.name,
        currentBalance: c.balance,
        debtAgeDays,
        riskScore,
        riskCategory,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}
