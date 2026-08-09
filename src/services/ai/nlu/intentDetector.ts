import { UserQuery, Intent } from '../types';
import { INTENT_DATASET, IntentType } from './intentDataset';

interface ScoredIntent {
  name: IntentType;
  score: number;
  confidence: number;
  parameters: Record<string, any>;
}

/**
 * Detects intent from normalized and synonym-resolved query text.
 */
export function detectIntent(
  normalizedText: string,
  synonymResolvedText: string,
  userQuery: UserQuery
): Intent {
  if (!normalizedText || normalizedText.trim().length === 0) {
    return { name: 'UNKNOWN', confidence: 0 };
  }

  const scores: ScoredIntent[] = INTENT_DATASET.map(def => {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 1. Regex Pattern Matching (High weight = 5 points per match)
    for (const pattern of def.patterns) {
      if (pattern.test(normalizedText) || pattern.test(synonymResolvedText)) {
        score += 5;
      }
    }

    // 2. Keyword & N-Gram Matching in normalized and synonym-resolved text
    const wordsNorm = normalizedText.split(' ').filter(w => w.length > 0);
    const wordsSyn = synonymResolvedText.split(' ').filter(w => w.length > 0);
    const allWords = new Set([...wordsNorm, ...wordsSyn]);

    // Construct Bigrams & Trigrams for multi-word phrase matching
    const nGrams = new Set<string>();
    for (let i = 0; i < wordsNorm.length - 1; i++) {
      nGrams.add(`${wordsNorm[i]} ${wordsNorm[i + 1]}`);
      if (i < wordsNorm.length - 2) {
        nGrams.add(`${wordsNorm[i]} ${wordsNorm[i + 1]} ${wordsNorm[i + 2]}`);
      }
    }
    for (let i = 0; i < wordsSyn.length - 1; i++) {
      nGrams.add(`${wordsSyn[i]} ${wordsSyn[i + 1]}`);
      if (i < wordsSyn.length - 2) {
        nGrams.add(`${wordsSyn[i]} ${wordsSyn[i + 1]} ${wordsSyn[i + 2]}`);
      }
    }

    for (const kw of def.keywords) {
      if (allWords.has(kw) || nGrams.has(kw) || normalizedText.includes(kw) || synonymResolvedText.includes(kw)) {
        // N-Gram phrases get higher weight (3 points) than single words (2 points)
        score += kw.includes(' ') ? 3 : 2;
        matchedKeywords.push(kw);
      }
    }

    // 3. Match Exact Examples (Bonus weight = 10)
    for (const example of def.examples) {
      if (normalizedText === example || synonymResolvedText === example) {
        score += 10;
        break;
      }
    }

    // 4. Domain Heuristic Combination Boosts
    const textCombined = `${normalizedText} ${synonymResolvedText}`;

    const hasDebtWord = /(ديون|دين|رصيد|مستحق|فلوس|اطالب|اجل|عنده|عليه|ذمم|ذمه|مديونيه)/i.test(textCombined);
    const hasCustomerWord = /(عملاء|زبائن|زبون|عميل|ناس|زباين|شخص)/i.test(textCombined);
    const hasSupplierWord = /(موردين|مورد|شركات|شركه|مؤسسة|تاجر|موزع)/i.test(textCombined);
    const hasSalesWord = /(مبيعات|مبيع|دخل|فواتير|بعنا|مبيعه|إيراد|مقروضات)/i.test(textCombined);
    const hasProfitWord = /(ارباح|ربح|مكسب|كسبنا|صافي|هامش)/i.test(textCombined);
    const hasInventoryWord = /(مخزون|نواقص|ناقص|منتهيه|قريبه|اصناف|منتجات|صنف|منتج|باركود|سعر|بضاعه|استوك)/i.test(textCombined);
    const hasCashWord = /(مصاريف|مصروف|سحب|سحوبات|صندوق|درج|كاش|مسحوبات|سيوله|درج)/i.test(textCombined);
    const hasTaxWord = /(ضريبه|الضريبه|القيمه المضافه|زكاه|زكاة|vat)/i.test(textCombined);
    const hasReturnWord = /(مرتجع|ترجيع|مردودات|استبدال|ارجاع)/i.test(textCombined);

    if ((def.name === 'DEBT_CUSTOMER_QUERY' || def.name === 'CUSTOMER_BALANCE' || def.name === 'CUSTOMER_STATEMENT') && (hasDebtWord && (hasCustomerWord || /(عليه|عنده|حقنا)/i.test(textCombined)))) {
      score += 8;
    }
    if ((def.name === 'DEBT_SUPPLIER_QUERY' || def.name === 'SUPPLIER_BALANCE' || def.name === 'SUPPLIER_STATEMENT') && (hasDebtWord && hasSupplierWord)) {
      score += 8;
    }
    if ((def.name === 'SALES_QUERY' || def.name === 'SALES_SUMMARY') && (hasSalesWord && !hasDebtWord && !hasReturnWord)) {
      score += 8;
    }
    if ((def.name === 'PROFIT_QUERY' || def.name === 'PROFIT_SUMMARY') && hasProfitWord) {
      score += 8;
    }
    if ((def.name === 'INVENTORY_QUERY' || def.name === 'INVENTORY_STATUS') && hasInventoryWord && !hasReturnWord) {
      score += 8;
    }
    if ((def.name === 'EXPENSE_CASH_QUERY' || def.name === 'EXPENSES_SUMMARY' || def.name === 'CASH_BALANCE') && hasCashWord) {
      score += 8;
    }
    if (def.name === 'TAX_ZATCA_QUERY' && hasTaxWord) {
      score += 10;
    }
    if (def.name === 'RETURN_REFUND_QUERY' && hasReturnWord) {
      score += 10;
    }

    // Contextual Pronoun Heuristic (e.g. user asks "كم عليه؟" after speaking about a customer)
    if (userQuery?.context) {
      const activeEntity = userQuery.context.activeCustomer || userQuery.context.lastTargetName;
      if (activeEntity && /(عليه|له|حسابه|كشفه|ديونه)/i.test(textCombined)) {
        if (def.name === 'CUSTOMER_STATEMENT' || def.name === 'CUSTOMER_BALANCE' || def.name === 'DEBT_CUSTOMER_QUERY') {
          score += 6;
        }
      }
    }

    return {
      name: def.name,
      score,
      confidence: 0, // Calculated below
      parameters: { matchedKeywords },
    };
  });

  // Sort by highest score
  scores.sort((a, b) => b.score - a.score);

  const topMatch = scores[0];

  if (!topMatch || topMatch.score <= 0) {
    return { name: 'UNKNOWN', confidence: 0 };
  }

  // Calculate normalized confidence score (max expected score ~ 15)
  const maxExpectedScore = 12;
  const rawConfidence = Math.min(topMatch.score / maxExpectedScore, 1.0);
  
  // Apply sigmoid smoothing or floor for lower bounds
  const confidence = Math.round(rawConfidence * 100) / 100;

  // Threshold check
  if (confidence < 0.25) {
    return { name: 'UNKNOWN', confidence, parameters: topMatch.parameters };
  }

  return {
    name: topMatch.name,
    confidence,
    parameters: topMatch.parameters,
  };
}
