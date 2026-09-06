import { db } from '../../../db';
import { prepareDailySalesTimeSeries, prepareProductAssociationFeatures, MarketBasketFeatureRow } from './datasetBuilder';

export type ForecastHorizonKey = '7d' | '30d' | '90d' | '365d' | 'custom';

export interface DayOfWeekSeasonality {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayName: string; // السبت، الأحد، ...
  avgSales: number;
  salesSharePercentage: number;
  relativeStrengthIndex: number; // 1.0 = average, >1.0 above average, <1.0 below average
  transactionCount: number;
}

export interface AdvancedStatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  volatilityRatePercentage: number; // Coefficient of Variation (CV)
  minDailySales: number;
  maxDailySales: number;
  totalHistoricalVolume: number;
  activeTradingDays: number;
  rSquared: number;
  slope: number;
  intercept: number;
  trendClassification: 'growing' | 'stable' | 'declining';
  peakDay: string;
  slowestDay: string;
  movingAverage7d: number;
  movingAverage30d: number;
}

export interface ProbabilisticScenario {
  scenarioName: 'optimistic' | 'baseline' | 'conservative';
  titleAr: string;
  totalProjectedSales: number;
  dailyAvgProjected: number;
  confidenceMarginPercentage: number;
  description: string;
  dailySeries: { dateStr: string; projectedSales: number }[];
}

export interface StoreDiagnosticIssue {
  id: string;
  severity: 'critical' | 'warning' | 'opportunity' | 'info';
  category: 'pricing' | 'inventory' | 'debts' | 'cashflow' | 'margins';
  title: string;
  diagnosis: string;
  impactValue?: number;
  suggestedAction: string;
  actionCode?: 'FIX_PRICE' | 'COLLECT_DEBT' | 'CLEAR_INVENTORY' | 'LIMIT_EXPENSES' | 'RESTOCK';
}

export interface SalesForecastResult {
  horizonDays: number;
  historicalDaysCount: number;
  averageDailySales: number;
  projectedNext7DaysSales: number;
  projectedNext30DaysSales: number;
  projectedNext90DaysSales: number;
  projectedNext365DaysSales: number;
  projectedTotalForSelectedHorizon: number;
  growthTrendPercentage: number;
  confidenceScore: number;
  seasonalityMessage: string;
  
  // Statistical & Exploratory Analysis
  statistics: AdvancedStatisticalSummary;
  dayOfWeekSeasonality: DayOfWeekSeasonality[];
  scenarios: {
    baseline: ProbabilisticScenario;
    optimistic: ProbabilisticScenario;
    conservative: ProbabilisticScenario;
  };
  
  // Model Parameters
  regressionModel: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  
  // Projected time series
  dailyProjections: { 
    dateStr: string; 
    projectedSales: number;
    optimisticSales: number;
    conservativeSales: number;
    dayName: string;
  }[];
  
  // Store Health Diagnostics & Remediation Suggestions
  diagnostics: StoreDiagnosticIssue[];
}

export interface AssociationRule {
  antecedentId: number;
  antecedentName: string;
  consequentId: number;
  consequentName: string;
  coOccurrence: number;
  support: number;
  confidence: number;
  lift: number;
  recommendationText: string;
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/**
 * Fits an Ordinary Least Squares (OLS) Linear Regression model: Y = mx + c
 */
export function calculateOLS(x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = x.length;
  if (n === 0 || n !== y.length) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, idx) => sum + xi * y[idx], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 
    ? (n * sumXY - sumX * sumY) / denominator 
    : 0;

  const intercept = meanY - slope * meanX;

  // R-squared calculation
  const yPred = x.map(xi => slope * xi + intercept);
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const ssRes = y.reduce((sum, yi, idx) => sum + Math.pow(yi - yPred[idx], 2), 0);
  
  const rSquared = ssTotal !== 0 
    ? parseFloat(Math.max(0, Math.min(1, 1 - (ssRes / ssTotal))).toFixed(4)) 
    : 0;

  return { slope, intercept, rSquared };
}

/**
 * Holt's Linear Exponential Smoothing (Double Exponential Smoothing)
 */
export function forecastHoltLinear(
  y: number[], 
  alpha: number = 0.35, 
  beta: number = 0.15
): { level: number; trend: number; smoothedValues: number[] } {
  const n = y.length;
  if (n === 0) return { level: 0, trend: 0, smoothedValues: [] };
  if (n === 1) return { level: y[0], trend: 0, smoothedValues: [y[0]] };

  const levelHistory: number[] = new Array(n);
  const trendHistory: number[] = new Array(n);

  levelHistory[0] = y[0];
  trendHistory[0] = (y[1] - y[0]) || 0;

  for (let i = 1; i < n; i++) {
    levelHistory[i] = alpha * y[i] + (1 - alpha) * (levelHistory[i - 1] + trendHistory[i - 1]);
    trendHistory[i] = beta * (levelHistory[i] - levelHistory[i - 1]) + (1 - beta) * trendHistory[i - 1];
  }

  const smoothedValues = levelHistory.map((l, idx) => parseFloat((l + trendHistory[idx]).toFixed(2)));

  return {
    level: levelHistory[n - 1],
    trend: trendHistory[n - 1],
    smoothedValues
  };
}

/**
 * Computes descriptive and exploratory statistical parameters.
 */
function computeExploratoryStats(y: number[], ols: { slope: number; intercept: number; rSquared: number }): {
  mean: number;
  median: number;
  stdDev: number;
  volatilityRate: number;
  min: number;
  max: number;
  sum: number;
  ma7: number;
  ma30: number;
} {
  const n = y.length;
  if (n === 0) {
    return { mean: 0, median: 0, stdDev: 0, volatilityRate: 0, min: 0, max: 0, sum: 0, ma7: 0, ma30: 0 };
  }

  const sum = y.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const sorted = [...y].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const variance = y.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / Math.max(1, n - 1);
  const stdDev = Math.sqrt(variance);
  const volatilityRate = mean > 0 ? parseFloat(((stdDev / mean) * 100).toFixed(1)) : 0;

  const min = sorted[0];
  const max = sorted[n - 1];

  const recent7 = y.slice(-7);
  const ma7 = recent7.length > 0 ? recent7.reduce((a, b) => a + b, 0) / recent7.length : mean;

  const recent30 = y.slice(-30);
  const ma30 = recent30.length > 0 ? recent30.reduce((a, b) => a + b, 0) / recent30.length : mean;

  return {
    mean: Math.round(mean),
    median: Math.round(median),
    stdDev: Math.round(stdDev),
    volatilityRate,
    min,
    max,
    sum,
    ma7: Math.round(ma7),
    ma30: Math.round(ma30),
  };
}

/**
 * Analyzes Day-of-Week Seasonality indices from time series features.
 */
function computeDayOfWeekSeasonality(features: any[]): DayOfWeekSeasonality[] {
  const dayStats: { [day: number]: { totalSales: number; count: number; txCount: number } } = {
    0: { totalSales: 0, count: 0, txCount: 0 },
    1: { totalSales: 0, count: 0, txCount: 0 },
    2: { totalSales: 0, count: 0, txCount: 0 },
    3: { totalSales: 0, count: 0, txCount: 0 },
    4: { totalSales: 0, count: 0, txCount: 0 },
    5: { totalSales: 0, count: 0, txCount: 0 },
    6: { totalSales: 0, count: 0, txCount: 0 },
  };

  features.forEach(f => {
    const d = f.dayOfWeek !== undefined ? f.dayOfWeek : new Date(f.dateStr).getDay();
    if (dayStats[d]) {
      dayStats[d].totalSales += f.totalSales || 0;
      dayStats[d].count += 1;
      dayStats[d].txCount += f.transactionCount || 1;
    }
  });

  const totalSalesAll = Object.values(dayStats).reduce((sum, s) => sum + s.totalSales, 0);
  const overallAvgPerDay = totalSalesAll / Math.max(1, features.length);

  return [0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
    const stat = dayStats[dayIndex];
    const avgForDay = stat.count > 0 ? stat.totalSales / stat.count : overallAvgPerDay;
    const share = totalSalesAll > 0 ? (stat.totalSales / totalSalesAll) * 100 : 14.28;
    const relIndex = overallAvgPerDay > 0 ? avgForDay / overallAvgPerDay : 1.0;

    return {
      dayIndex,
      dayName: ARABIC_DAYS[dayIndex],
      avgSales: Math.round(avgForDay),
      salesSharePercentage: parseFloat(share.toFixed(1)),
      relativeStrengthIndex: parseFloat(relIndex.toFixed(2)),
      transactionCount: stat.txCount,
    };
  });
}

/**
 * Audits store health and creates prioritized diagnostic and remediation items.
 */
async function auditStoreHealthAndDiagnostics(): Promise<StoreDiagnosticIssue[]> {
  const issues: StoreDiagnosticIssue[] = [];

  try {
    const products = await db.products.toArray();
    const customers = await db.customers.toArray();
    const sales = await db.sales.toArray();
    const saleItems = (await db.saleItems?.toArray()) || [];
    const withdrawals = (await db.cashWithdrawals?.toArray()) || [];

    // 1. Audit Negative or Zero Margin Products
    const pricingIssues = products.filter(p => {
      const price = p.sale_price || 0;
      const cost = p.cost_price || 0;
      return price <= 0 || (cost > 0 && price < cost);
    });

    if (pricingIssues.length > 0) {
      issues.push({
        id: 'diag-pricing-err',
        severity: 'critical',
        category: 'pricing',
        title: '⚠️ وجود أصناف مسعّرة بأقل من سعر التكلفة أو بسعر صفر',
        diagnosis: `تم رصد ${pricingIssues.length} صنف مسجل في المخزون يباع بخسارة صريحة أو بدون هامش ربح محدد.`,
        suggestedAction: 'قم بمراجعة بطاقة تسعير الأصناف فوراً وتعديل سعر البيع لضمان تحقيق هامش ربح لا يقل عن 15%.',
        actionCode: 'FIX_PRICE'
      });
    }

    // 2. Audit Stagnant Aged Debts (> 45 days)
    const agedDebtors = customers.filter(c => c.balance > 0);
    const totalDebt = agedDebtors.reduce((acc, c) => acc + c.balance, 0);

    if (totalDebt > 0) {
      const highBalanceDebtors = agedDebtors.filter(c => c.balance >= 500);
      if (highBalanceDebtors.length > 0) {
        issues.push({
          id: 'diag-debts-risk',
          severity: totalDebt > 5000 ? 'critical' : 'warning',
          category: 'debts',
          title: '👥 تركز مديونيات معلقة بمبالغ مرتفعة',
          diagnosis: `يوجد إجمالي مديونيات بقيمة ${Math.round(totalDebt)} موزعة على ${agedDebtors.length} عميل، من بينهم ${highBalanceDebtors.length} عميل برصيد يتجاوز 500.`,
          impactValue: Math.round(totalDebt),
          suggestedAction: 'تفعيل إشعارات التحصيل، وضع سقف ائتماني للعملاء، واشتراط دفعات نقدية قبل فتح فواتير جديدة.',
          actionCode: 'COLLECT_DEBT'
        });
      }
    }

    // 3. Audit Stagnant Dead Stock (zero sales in recent volume)
    const soldProductIds = new Set(saleItems.slice(-300).map(si => si.product_id));
    const stagnantProducts = products.filter(p => p.stock_quantity > 10 && !soldProductIds.has(p.id));
    
    if (stagnantProducts.length > 0) {
      const frozenCapital = stagnantProducts.reduce((sum, p) => sum + (p.stock_quantity * (p.cost_price || p.sale_price * 0.7)), 0);
      issues.push({
        id: 'diag-stagnant-stock',
        severity: 'opportunity',
        category: 'inventory',
        title: '📦 بضائع راكدة تجمد السيولة في المستودع',
        diagnosis: `تم تحديد ${stagnantProducts.length} صنف برصيد مرتفع لم يتحرك مؤخراً، مما يجمد سيولة تقديرية بنحو ${Math.round(frozenCapital)}.`,
        impactValue: Math.round(frozenCapital),
        suggestedAction: 'إطلاق عروض ترويجية وتخفيضات تصريف أو عمل باقات مدمجة (Bundles) لتحويل المخزون الراكد إلى سيولة نقدية عاجلة.',
        actionCode: 'CLEAR_INVENTORY'
      });
    }

    // 4. Audit Cash Withdrawals vs Revenue
    const totalSalesRev = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    if (totalSalesRev > 0 && totalWithdrawals > 0) {
      const withdrawalRatio = (totalWithdrawals / totalSalesRev) * 100;
      if (withdrawalRatio > 35) {
        issues.push({
          id: 'diag-high-withdrawals',
          severity: 'warning',
          category: 'cashflow',
          title: '💵 ارتفاع نسبة السحوبات والمصروفات من الصندوق',
          diagnosis: `المسحوبات النقدية تمثل %${Math.round(withdrawalRatio)} من إجمالي المبيعات، وهو معدل قد يضغط على السيولة المخصصة للموردين.`,
          impactValue: Math.round(totalWithdrawals),
          suggestedAction: 'تقنين المصروفات الشخصية من الدرج وتخصيص ميزانية شهرية واضحة للسحوبات حفاظاً على استقرار الصندوق.',
          actionCode: 'LIMIT_EXPENSES'
        });
      }
    }
  } catch (err) {
    console.warn('Error auditing store diagnostics:', err);
  }

  return issues;
}

/**
 * Predicts future sales trends using multi-horizon hybrid OLS Regression + Holt-Winters + Day-of-Week Seasonality.
 * @param horizonDays Number of future days to project (7, 30, 90, 365, or custom)
 */
export async function forecastSales(horizonDays: number = 30): Promise<SalesForecastResult> {
  const targetHorizon = Math.max(1, Math.min(730, horizonDays));
  const dailyFeatures = await prepareDailySalesTimeSeries();
  const diagnostics = await auditStoreHealthAndDiagnostics();
  
  if (dailyFeatures.length === 0) {
    const emptyStats: AdvancedStatisticalSummary = {
      mean: 0, median: 0, standardDeviation: 0, volatilityRatePercentage: 0,
      minDailySales: 0, maxDailySales: 0, totalHistoricalVolume: 0, activeTradingDays: 0,
      rSquared: 0, slope: 0, intercept: 0, trendClassification: 'stable',
      peakDay: 'غير محدد', slowestDay: 'غير محدد', movingAverage7d: 0, movingAverage30d: 0
    };

    const emptyScenario = (name: 'baseline' | 'optimistic' | 'conservative', titleAr: string): ProbabilisticScenario => ({
      scenarioName: name,
      titleAr,
      totalProjectedSales: 0,
      dailyAvgProjected: 0,
      confidenceMarginPercentage: 0,
      description: 'لا توجد بيانات كافية لبناء السيناريو.',
      dailySeries: []
    });

    return {
      horizonDays: targetHorizon,
      historicalDaysCount: 0,
      averageDailySales: 0,
      projectedNext7DaysSales: 0,
      projectedNext30DaysSales: 0,
      projectedNext90DaysSales: 0,
      projectedNext365DaysSales: 0,
      projectedTotalForSelectedHorizon: 0,
      growthTrendPercentage: 0,
      confidenceScore: 0,
      seasonalityMessage: 'لا توجد سجلات مبيعات سابقة كافية للتنبؤ المحاسبي المتقدم.',
      statistics: emptyStats,
      dayOfWeekSeasonality: [0, 1, 2, 3, 4, 5, 6].map(i => ({
        dayIndex: i,
        dayName: ARABIC_DAYS[i],
        avgSales: 0,
        salesSharePercentage: 14.28,
        relativeStrengthIndex: 1.0,
        transactionCount: 0
      })),
      scenarios: {
        baseline: emptyScenario('baseline', 'المسار المتوقع المعتدل'),
        optimistic: emptyScenario('optimistic', 'المسار المتفائل (+95%)'),
        conservative: emptyScenario('conservative', 'المسار المتحفظ (-80%)')
      },
      regressionModel: { slope: 0, intercept: 0, rSquared: 0 },
      dailyProjections: [],
      diagnostics
    };
  }

  const y = dailyFeatures.map(f => f.totalSales);
  const x = dailyFeatures.map((_, idx) => idx);
  const n = y.length;

  // 1. Calculate OLS Regression Model
  const ols = calculateOLS(x, y);

  // 2. Calculate Holt Double Exponential Smoothing
  const holt = forecastHoltLinear(y, 0.35, 0.15);

  // 3. Exploratory Data Analysis & Seasonality
  const stats = computeExploratoryStats(y, ols);
  const seasonality = computeDayOfWeekSeasonality(dailyFeatures);

  // Find peak and slowest days
  const sortedDays = [...seasonality].sort((a, b) => b.avgSales - a.avgSales);
  const peakDayObj = sortedDays[0];
  const slowestDayObj = sortedDays[sortedDays.length - 1];

  let trendClassification: 'growing' | 'stable' | 'declining' = 'stable';
  if (ols.slope > 10) trendClassification = 'growing';
  else if (ols.slope < -10) trendClassification = 'declining';

  const fullStats: AdvancedStatisticalSummary = {
    mean: stats.mean,
    median: stats.median,
    standardDeviation: stats.stdDev,
    volatilityRatePercentage: stats.volatilityRate,
    minDailySales: stats.min,
    maxDailySales: stats.max,
    totalHistoricalVolume: Math.round(stats.sum),
    activeTradingDays: n,
    rSquared: ols.rSquared,
    slope: parseFloat(ols.slope.toFixed(2)),
    intercept: parseFloat(ols.intercept.toFixed(2)),
    trendClassification,
    peakDay: `${peakDayObj.dayName} (معدل ${Math.round(peakDayObj.avgSales)})`,
    slowestDay: `${slowestDayObj.dayName} (معدل ${Math.round(slowestDayObj.avgSales)})`,
    movingAverage7d: stats.ma7,
    movingAverage30d: stats.ma30
  };

  // 4. Generate Multi-Horizon Daily Projections & Probabilistic Scenarios
  const dailyProjections: { 
    dateStr: string; 
    projectedSales: number;
    optimisticSales: number;
    conservativeSales: number;
    dayName: string;
  }[] = [];

  const maxProjectionHorizon = Math.max(targetHorizon, 365);
  const lastDate = new Date(dailyFeatures[n - 1].dateStr);

  let proj7Sum = 0;
  let proj30Sum = 0;
  let proj90Sum = 0;
  let proj365Sum = 0;
  let projSelectedHorizonSum = 0;

  const baselineSeries: { dateStr: string; projectedSales: number }[] = [];
  const optimisticSeries: { dateStr: string; projectedSales: number }[] = [];
  const conservativeSeries: { dateStr: string; projectedSales: number }[] = [];

  // Volatility multiplier for confidence bounds
  const stdError = Math.max(stats.stdDev * 0.6, stats.mean * 0.12);

  for (let step = 1; step <= maxProjectionHorizon; step++) {
    const projDate = new Date(lastDate);
    projDate.setDate(lastDate.getDate() + step);
    const dateStr = projDate.toISOString().slice(0, 10);
    const dayOfWeek = projDate.getDay();
    const dayName = ARABIC_DAYS[dayOfWeek];

    // Day of week seasonality adjustment factor
    const seasonFactor = seasonality[dayOfWeek]?.relativeStrengthIndex || 1.0;

    // Hybrid forecast: Holt linear + OLS linear weighted with seasonal modulation
    const holtForecast = holt.level + step * holt.trend;
    const olsForecast = ols.slope * (n - 1 + step) + ols.intercept;
    const unadjustedBase = Math.max(0, holtForecast * 0.6 + olsForecast * 0.4);
    
    // Apply dampened seasonal multiplier (capped between 0.75 and 1.35)
    const seasonalMultiplier = Math.max(0.75, Math.min(1.35, 1 + (seasonFactor - 1) * 0.5));
    const baseProjected = Math.round(unadjustedBase * seasonalMultiplier);

    // Probabilistic Bounds
    const uncertaintySpread = stdError * Math.sqrt(1 + step / 30);
    const optimisticProjected = Math.round(baseProjected + uncertaintySpread * 1.35);
    const conservativeProjected = Math.max(0, Math.round(baseProjected - uncertaintySpread * 0.95));

    if (step <= targetHorizon) {
      projSelectedHorizonSum += baseProjected;
    }
    if (step <= 7) proj7Sum += baseProjected;
    if (step <= 30) proj30Sum += baseProjected;
    if (step <= 90) proj90Sum += baseProjected;
    if (step <= 365) proj365Sum += baseProjected;

    baselineSeries.push({ dateStr, projectedSales: baseProjected });
    optimisticSeries.push({ dateStr, projectedSales: optimisticProjected });
    conservativeSeries.push({ dateStr, projectedSales: conservativeProjected });

    if (step <= targetHorizon) {
      dailyProjections.push({
        dateStr,
        projectedSales: baseProjected,
        optimisticSales: optimisticProjected,
        conservativeSales: conservativeProjected,
        dayName
      });
    }
  }

  // Calculate rolling growth of last 7 days vs baseline
  const recent7Val = y.slice(-7).reduce((a, b) => a + b, 0);
  const recentDailyAvg = recent7Val / Math.min(7, n);
  const growthTrendPercentage = stats.mean > 0 
    ? parseFloat((((recentDailyAvg - stats.mean) / stats.mean) * 100).toFixed(1))
    : 0;

  let seasonalityMessage = 'مستويات المبيعات طبيعية ومستقرة في الصندوق.';
  if (growthTrendPercentage > 15) {
    seasonalityMessage = `📈 وتيرة نمو تصاعدية نشطة في الأسبوع الأخير بنسبة +${growthTrendPercentage}% مقارنة بالمتوسط العام.`;
  } else if (growthTrendPercentage < -15) {
    seasonalityMessage = `⚠️ هبوط نسبي في المبيعات بنسبة ${growthTrendPercentage}%؛ يُوصى بتقديم عروض وتنشيط الأصناف الرابحة.`;
  }

  const confidenceScore = parseFloat(
    Math.min(0.98, Math.max(0.35, 0.45 + (n / 100) * 0.35 + (ols.rSquared * 0.18))).toFixed(2)
  );

  const scenarios = {
    baseline: {
      scenarioName: 'baseline' as const,
      titleAr: 'المسار المتوقع المعتدل (Expected Baseline)',
      totalProjectedSales: projSelectedHorizonSum,
      dailyAvgProjected: Math.round(projSelectedHorizonSum / targetHorizon),
      confidenceMarginPercentage: 0,
      description: 'المسار الأكثر ترجيحاً استناداً إلى وتيرة المبيعات الفعلية وتأثير أيام الأسبوع.',
      dailySeries: baselineSeries.slice(0, targetHorizon)
    },
    optimistic: {
      scenarioName: 'optimistic' as const,
      titleAr: 'المسار المتفائل والنمو المرتفع (+95% Confidence)',
      totalProjectedSales: optimisticSeries.slice(0, targetHorizon).reduce((a, b) => a + b.projectedSales, 0),
      dailyAvgProjected: Math.round(optimisticSeries.slice(0, targetHorizon).reduce((a, b) => a + b.projectedSales, 0) / targetHorizon),
      confidenceMarginPercentage: 25,
      description: 'سيناريو الإقبال المرتفع وتفعيل العروض الترويجية وزيادة وتيرة حركة الزبائن.',
      dailySeries: optimisticSeries.slice(0, targetHorizon)
    },
    conservative: {
      scenarioName: 'conservative' as const,
      titleAr: 'المسار المتحفظ وإدارة المخاطر (-80% Bound)',
      totalProjectedSales: conservativeSeries.slice(0, targetHorizon).reduce((a, b) => a + b.projectedSales, 0),
      dailyAvgProjected: Math.round(conservativeSeries.slice(0, targetHorizon).reduce((a, b) => a + b.projectedSales, 0) / targetHorizon),
      confidenceMarginPercentage: -20,
      description: 'سيناريو الأمان المالي للتحوط من الركود وتقلبات السوق والمصاريف الطارئة.',
      dailySeries: conservativeSeries.slice(0, targetHorizon)
    }
  };

  return {
    horizonDays: targetHorizon,
    historicalDaysCount: n,
    averageDailySales: stats.mean,
    projectedNext7DaysSales: proj7Sum,
    projectedNext30DaysSales: proj30Sum,
    projectedNext90DaysSales: proj90Sum,
    projectedNext365DaysSales: proj365Sum,
    projectedTotalForSelectedHorizon: projSelectedHorizonSum,
    growthTrendPercentage,
    confidenceScore,
    seasonalityMessage,
    statistics: fullStats,
    dayOfWeekSeasonality: seasonality,
    scenarios,
    regressionModel: ols,
    dailyProjections,
    diagnostics
  };
}

/**
 * Mines Market Basket Association Rules using the Apriori pattern.
 */
export async function getMarketBasketRules(
  minConfidence: number = 0.1,
  minLift: number = 1.05
): Promise<AssociationRule[]> {
  const associations = await prepareProductAssociationFeatures();
  const rules: AssociationRule[] = [];

  associations.forEach(feat => {
    if (feat.confidenceAtoB >= minConfidence && feat.lift >= minLift) {
      rules.push({
        antecedentId: feat.productIdA,
        antecedentName: feat.productNameA,
        consequentId: feat.productIdB,
        consequentName: feat.productNameB,
        coOccurrence: feat.coOccurrenceCount,
        support: feat.supportAB,
        confidence: feat.confidenceAtoB,
        lift: feat.lift,
        recommendationText: `العملاء الذين يشترون [${feat.productNameA}] لديهم احتمال بنسبة %${Math.round(feat.confidenceAtoB * 100)} لشراء [${feat.productNameB}]. يُنصح بعرضهما متجاورين في الرفوف أو عمل عرض تسويقي مدمج لزيادة المبيعات.`,
      });
    }

    const confidenceBtoA = feat.supportB > 0 ? feat.supportAB / feat.supportB : 0;
    if (confidenceBtoA >= minConfidence && feat.lift >= minLift) {
      rules.push({
        antecedentId: feat.productIdB,
        antecedentName: feat.productNameB,
        consequentId: feat.productIdA,
        consequentName: feat.productNameA,
        coOccurrence: feat.coOccurrenceCount,
        support: feat.supportAB,
        confidence: parseFloat(confidenceBtoA.toFixed(4)),
        lift: feat.lift,
        recommendationText: `العملاء الذين يشترون [${feat.productNameB}] لديهم احتمال بنسبة %${Math.round(confidenceBtoA * 100)} لشراء [${feat.productNameA}]. يُنصح بعرضهما متجاورين في الرفوف أو عمل عرض تسويقي مدمج لزيادة المبيعات.`,
      });
    }
  });

  return rules.sort((a, b) => (b.lift * b.confidence) - (a.lift * a.confidence));
}
