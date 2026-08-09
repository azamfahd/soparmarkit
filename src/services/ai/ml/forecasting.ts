import { db } from '../../../db';
import { prepareDailySalesTimeSeries, prepareProductAssociationFeatures, MarketBasketFeatureRow } from './datasetBuilder';

export interface SalesForecastResult {
  historicalDaysCount: number;
  averageDailySales: number;
  projectedNext7DaysSales: number;
  projectedNext30DaysSales: number;
  growthTrendPercentage: number;
  confidenceScore: number;
  seasonalityMessage: string;
  regressionModel: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  dailyProjections: { dateStr: string; projectedSales: number }[];
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

  // Slope: m = (n*sum(xy) - sum(x)*sum(y)) / (n*sum(x^2) - (sum(x))^2)
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 
    ? (n * sumXY - sumX * sumY) / denominator 
    : 0;

  // Intercept: c = meanY - m * meanX
  const intercept = meanY - slope * meanX;

  // R-squared calculation
  const yPred = x.map(xi => slope * xi + intercept);
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const ssRes = y.reduce((sum, yi, idx) => sum + Math.pow(yi - yPred[idx], 2), 0);
  
  const rSquared = ssTotal !== 0 
    ? parseFloat((1 - (ssRes / ssTotal)).toFixed(4)) 
    : 0;

  return { slope, intercept, rSquared };
}

/**
 * Holt's Linear Exponential Smoothing (Double Exponential Smoothing)
 * Better for catching and projecting trend-based sequences.
 */
export function forecastHoltLinear(
  y: number[], 
  alpha: number = 0.3, 
  beta: number = 0.1
): { level: number; trend: number; smoothedValues: number[] } {
  const n = y.length;
  if (n === 0) return { level: 0, trend: 0, smoothedValues: [] };
  if (n === 1) return { level: y[0], trend: 0, smoothedValues: [y[0]] };

  const levelHistory: number[] = new Array(n);
  const trendHistory: number[] = new Array(n);

  // Initialize
  levelHistory[0] = y[0];
  trendHistory[0] = y[1] - y[0];

  for (let i = 1; i < n; i++) {
    // Level: L_t = alpha * Y_t + (1 - alpha) * (L_t-1 + T_t-1)
    levelHistory[i] = alpha * y[i] + (1 - alpha) * (levelHistory[i - 1] + trendHistory[i - 1]);
    
    // Trend: T_t = beta * (L_t - L_t-1) + (1 - beta) * T_t-1
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
 * Predicts future sales trends using hybrid OLS Regression + Holt-Linear Smoothing.
 */
export async function forecastSales(): Promise<SalesForecastResult> {
  const dailyFeatures = await prepareDailySalesTimeSeries();
  
  if (dailyFeatures.length === 0) {
    return {
      historicalDaysCount: 0,
      averageDailySales: 0,
      projectedNext7DaysSales: 0,
      projectedNext30DaysSales: 0,
      growthTrendPercentage: 0,
      confidenceScore: 0,
      seasonalityMessage: 'لا توجد سجلات مبيعات سابقة كافية للتنبؤ المحاسبي.',
      regressionModel: { slope: 0, intercept: 0, rSquared: 0 },
      dailyProjections: [],
    };
  }

  const y = dailyFeatures.map(f => f.totalSales);
  const x = dailyFeatures.map((_, idx) => idx);
  const n = y.length;

  // 1. Calculate OLS Model
  const ols = calculateOLS(x, y);

  // 2. Calculate Holt Double Smoothing
  const holt = forecastHoltLinear(y, 0.35, 0.15);

  // 3. Make Daily Projections for the next 7 days
  const dailyProjections: { dateStr: string; projectedSales: number }[] = [];
  const lastDate = new Date(dailyFeatures[n - 1].dateStr);
  
  let projected7Sum = 0;
  let projected30Sum = 0;

  for (let step = 1; step <= 30; step++) {
    const projDate = new Date(lastDate);
    projDate.setDate(lastDate.getDate() + step);
    const dateStr = projDate.toISOString().slice(0, 10);

    // Hybrid forecast: Holt linear forecast model + OLS linear model (weighted 65% Holt, 35% OLS)
    const holtForecast = holt.level + step * holt.trend;
    const olsForecast = ols.slope * (n - 1 + step) + ols.intercept;
    
    // Ensure predictions do not fall below zero
    const hybridForecast = Math.max(0, Math.round(holtForecast * 0.65 + olsForecast * 0.35));

    if (step <= 7) {
      projected7Sum += hybridForecast;
      dailyProjections.push({ dateStr, projectedSales: hybridForecast });
    }
    projected30Sum += hybridForecast;
  }

  // 4. Trend Analysis
  // Calculate rolling growth of last 7 days relative to OLS baseline
  const averageSales = y.reduce((a, b) => a + b, 0) / n;
  const recent7Val = y.slice(-7).reduce((a, b) => a + b, 0);
  const recentDailyAvg = recent7Val / (Math.min(7, n));
  
  const growthTrendPercentage = averageSales > 0 
    ? parseFloat((((recentDailyAvg - averageSales) / averageSales) * 100).toFixed(1))
    : 0;

  let seasonalityMessage = 'مستويات المبيعات طبيعية ومستقرة في الصندوق.';
  if (growthTrendPercentage > 15) {
    seasonalityMessage = `📈 نمو تصاعدي قوي في الأسبوع الأخير بنسبة +${growthTrendPercentage}% مقارنة بالمتوسط العام.`;
  } else if (growthTrendPercentage < -15) {
    seasonalityMessage = `⚠️ انخفاض نسبي في المبيعات بنسبة ${growthTrendPercentage}%؛ يُوصى بتقديم عروض لتنشيط حركة البيع.`;
  }

  // Confidence Score derived from data size (historical days) & R-squared correlation strength
  const confidenceScore = parseFloat(
    Math.min(0.98, Math.max(0.3, 0.4 + (n / 90) * 0.4 + (ols.rSquared * 0.18))).toFixed(2)
  );

  return {
    historicalDaysCount: n,
    averageDailySales: Math.round(averageSales),
    projectedNext7DaysSales: projected7Sum,
    projectedNext30DaysSales: projected30Sum,
    growthTrendPercentage,
    confidenceScore,
    seasonalityMessage,
    regressionModel: ols,
    dailyProjections,
  };
}

/**
 * Mines Market Basket Association Rules using the Apriori pattern.
 * Identifies high-confidence cross-selling items and formats actionable Arabic merchant recommendations.
 */
export async function getMarketBasketRules(
  minConfidence: number = 0.1,
  minLift: number = 1.05
): Promise<AssociationRule[]> {
  const associations = await prepareProductAssociationFeatures();
  const rules: AssociationRule[] = [];

  associations.forEach(feat => {
    // We evaluate reciprocal association direction rules: A -> B and B -> A
    // Rule A -> B
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

    // Rule B -> A
    // Confidence of B -> A = P(A|B) = P(A and B) / P(B)
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

  // Sort rules by joint Lift strength first, then confidence
  return rules.sort((a, b) => (b.lift * b.confidence) - (a.lift * a.confidence));
}
