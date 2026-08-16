import { UserQuery, Intent } from '../types';
import { INTENT_DATASET, IntentType } from './intentDataset';
import { getLocalTrainingData } from '../engine/trainingManager';

interface ScoredIntent {
  name: IntentType;
  score: number;
  confidence: number;
  parameters: Record<string, any>;
}

export interface ScoredCandidateIntent {
  definition: (typeof INTENT_DATASET)[0];
  name: IntentType;
  score: number;
  confidence: number;
  parameters: Record<string, any>;
}

/**
 * Ranks candidate intents from INTENT_DATASET by relevance score.
 */
export function rankCandidateIntents(
  normalizedText: string,
  synonymResolvedText: string,
  userQuery?: UserQuery
): ScoredCandidateIntent[] {
  if (!normalizedText || normalizedText.trim().length === 0) {
    return [];
  }

  const scores: ScoredCandidateIntent[] = INTENT_DATASET.map(def => {
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

    // 3.5 Match Local Training Data (High Bonus = 20)
    const localTraining = getLocalTrainingData();
    for (const record of localTraining) {
      if (record.expectedIntent === def.name) {
        if (record.query === userQuery?.rawText || record.query === normalizedText || record.query === synonymResolvedText) {
          score += 20; // Exact match heavily overrides everything
          break;
        }
      }
    }

    // 4. Domain & Relational Syntax Matrix (فهم ترابط الكلمات والتركيب الدلالي)
    const textCombined = `${normalizedText} ${synonymResolvedText}`;

    // Directional Debt Links
    const isCustomerDebtDirection = /(نطلب|نطلبه|نطلبهم|لنا عند|لنا عليه|باقي علي|حساب العميل|ديون العملاء|سدد لنا|دفع لنا|قبضنا من|حصلنا من|كم علي|دفتر الزباين|دين الزبون)/i.test(textCombined);
    const isSupplierDebtDirection = /(يطلبنا|يطلبونا|علينا ل|علينا له|باقي ل|مستحقات|سددنا ل|دفعنا ل|صرفنا ل|حولنا ل|كم ل|حساب المورد|ديون الموردين|شركات التوريد)/i.test(textCombined);

    // Specific Action & Entity Indicators
    const hasCustomerWord = /(عملاء|زبائن|زبون|عميل|ناس|زباين|شخص|مشتري)/i.test(textCombined);
    const hasSupplierWord = /(موردين|مورد|شركات|شركه|مؤسسه|تاجر|موزع|مندوب|شركات التوريد)/i.test(textCombined);
    const hasSalesWord = /(مبيعات|مبيع|دخل|فواتير|بعنا|مبيعه|ايراد|مقبوضات|شغل|دخلنا|طلع المحل|شغل اليوم|دخل المحل|بيع)/i.test(textCombined);
    const hasProfitWord = /(ارباح|ربح|مكسب|كسبنا|صافي|هامش|فائده|مكاسب|ارباحنا)/i.test(textCombined);
    const hasInventoryWord = /(مخزون|نواقص|ناقص|منتهيه|قريبه|اصناف|منتجات|صنف|منتج|باركود|سعر|بضاعه|استوك|كراتين|حبات|ما بش|مافي|كم باقي من)/i.test(textCombined);
    const hasCashDrawerWord = /(صندوق|درج|خزنه|خزينه|جرد الدرج|فلوس الدرج|فلوس الصندوق|كاش الصندوق|مطابقه الصندوق|كم في الدرج|كم في الصندوق)/i.test(textCombined);
    const hasExpenseWord = /(مصاريف|مصروف|صرفنا|خسرنا|نفقات|صرفيات|مسحوبات|نثريات|صرفه|ايجار|كهرباء|رواتب|بنزين)/i.test(textCombined);
    const hasTaxWord = /(ضريبه|الضريبه|القيمه المضافه|زكاه|زكاه|vat)/i.test(textCombined);
    const hasReturnWord = /(مرتجع|ترجيع|مردودات|استبدال|ارجاع)/i.test(textCombined);
    const hasAuditWord = /(تدقيق|مشبوه|غريب|شاذ|تشوهات|اخطاء|خطا|تلاعب|فحص|رقابه|مراقبه|مشكله|مشكله|حدثت مشكله|صار مشكله)/i.test(textCombined);
    const hasForecastWord = /(توقع|توقعات|مستقبل|تنبؤ|الشهر الجاي|الشهر القادم|بكره|القادم)/i.test(textCombined);
    const hasProductSalesWord = /(كم بعنا من|كم مبيعات صنف|كم مبيعات منتج|هل تم بيع|هل بعنا|مبيعات صنف|مبيعات منتج|كميه المباعه|حركه بيع|المنتجات الاكثر مبيعا|الاصناف الاكثر مبيعا)/i.test(textCombined);
    const hasDatePeriodWord = /(تاريخ|يوم|ايام|أيام|الاسبوع|السبت|الاحد|الاثنين|الثلاثاء|الاربعاء|الخميس|الجمعه|امس|البارحه|اليوم|الشهر|شهر|اشهر|أشهر|الربع|فتره|فترة|اخر|أخر|خلال|منذ|من|الى|إلى)/i.test(textCombined);
    const isSystemInfoQuery = /(معلومات|بيانات|حول|عن|اصدار|نسخه|حاله|شرح)\s+(النظام|التطبيق|البرنامج|الوكيل|المستشار|المحاسب)/i.test(textCombined) || /(من انت|من انت|ما هذا النظام|ماذا تفعل|ماهو النظام|ما هو النظام|ما هو هذا التطبيق|ما هو هذا البرنامج)/i.test(textCombined);
    const isSystemSectionsGuideQuery = /(ماذا|ايش|ما|شرح|وظيفة|دور|فائدة|ماهي|ما هي|دليل|كيف استخدم|مكونات|بيان|معلومات|تفاصيل|مميزات)\s+(?:يعني|تعني|معنى|وظيفة|دور|فائدة|عن)?\s*(كل قسم|اقسام|شاشات|القوائم|كل شاشة|شاشات البرنامج|اقسام البرنامج|اقسام النظام|شاشات النظام|واجهات البرنامج|مكونات البرنامج|قسم\s+[آأإء-يA-Za-z0-9_\s]+|شاشة\s+[آأإء-يA-Za-z0-9_\s]+)/i.test(textCombined) ||
      /(?:معلومات|شرح|تفاصيل|وظيفة|وظائف|مميزات|مزايا|طريقة استخدام|كيف استخدم|ما هو|ماهو|ما هي|ماهي|عن)\s+(?:عن )?(?:قسم|شاشة|صفحة|واجهة|لوحة)?\s*(الاستيراد الذكي|الاستيراد|استيراد البيانات|استيراد المنتجات|الكاشير|نقطة البيع|المخزون|المنتجات|العملاء|الزبائن|الديون|الموردين|الشركات|سجل الفواتير|السجل|تصفية الصندوق|الصندوق|الدرج|التحليلات|المستشار|الاعدادات|الاستيراد الذكي للبيانات)/i.test(textCombined) ||
      /(?:قسم|شاشة|صفحة)\s+(الاستيراد الذكي|الاستيراد|الكاشير|نقطة البيع|المخزون|المنتجات|العملاء|الزبائن|الموردين|الشركات|سجل الفواتير|السجل|تصفية الصندوق|الصندوق|الدرج|التحليلات|المستشار الذكي|الاعدادات)/i.test(textCombined) ||
      /(الاستيراد الذكي|استيراد السلع|استيراد البيانات|رفع ملف اكسل|smart import)/i.test(textCombined) ||
      /(ماذا يعني كل قسم|شرح اقسام البرنامج|شرح شاشات البرنامج|ما هي اقسام النظام|وظائف اقسام البرنامج|ايش يعني كل قسم|شرح كل قسم في البرنامج|ما هي شاشات البرنامج)/i.test(textCombined);
    const isSystemHelpQuery = /(كيف استخدم البرنامج|طريقة استخدام البرنامج|شرح استخدام النظام|دليل الاستخدام|كيف اضيف زبون|كيف اسجل فاتورة)/i.test(textCombined);

    // Compound phrases
    const hasLargestSaleWord = /(اكثر|اعلي|اكبر|اضخم)\s+(عمليه|عمليات|فاتوره|فواتير|بيعه|بيعات|مبيعه|مبيعات|صفقه|صفقات)\s*(بيع|مبيعات|البيع|كانت)?/i.test(textCombined) ||
      /(اكثر|اعلي|اكبر)\s+(المبيعات|الفواتير|البيعات|الصفقات)\s*(كانت)?/i.test(textCombined) ||
      /(عمليه|عمليات)\s+البيع\s+(الاعلي|الاكثر|الاكبر|الاضخم)/i.test(textCombined) ||
      /(الفاتوره|الفواتير)\s+(الاعلي|الاكثر|الاكبر|الاضخم)/i.test(textCombined);

    const hasDrilldownExplanationWord = /(وضح|اشرح|التفاصيل|تفاصيل|بالتفصيل|طريقه الحساب|كيف تم حساب|كيف حسبت|ما هي الاصناف|ما هي البضائع|ما هي الفواتير|زيد وضح|بين لي|فكك لي)/i.test(textCombined);
    const hasDiagnosticWord = /(لماذا|ليش|ليه|ما سبب|ماهو سبب|سبب)\s+(انخفضت|انخفاض|تراجع|نزول|هبوط|قلت)\s*(الارباح|المبيعات|الدخل)?/i.test(textCombined) ||
      /(انخفضت|تراجعت|نزلت|هبطت)\s+(الارباح|المبيعات)/i.test(textCombined);
    const hasGrowthWord = /كيف\s+(ازيد|ارفع|اضاعف|اطور|احسن)\s*(مبيعاتي|المبيعات|الارباح|ارباح المحل|الدخل)?/i.test(textCombined) ||
      /(طرق|طريقه|استراتيجيه|نصائح|خطه)\s+(زياده|رفع|مضاعفه)\s*(المبيعات|الارباح)/i.test(textCombined);
    const hasComparisonWord = /(قارن|مقارنه|مقارنه)\s+(مبيعات|ارباح|المبيعات|الارباح|هذا الشهر بالشهر الماضي|بين فترتين)/i.test(textCombined) ||
      /(الشهر الحالي والشهر الماضي|الشهر الماضي وهذا الشهر)/i.test(textCombined);
    const hasCollectionRateWord = /(نسبه|معدل)\s+(السداد|التحصيل|سداد الديون|تحصيل الديون|التحصيل من الزبائن)/i.test(textCombined);
    const hasInventoryValuationWord = /(القيمه الماليه|قيمه المخزون المالي|راس مال المخزون|تقييم المخزون|القيمه الماليه للمخزون)/i.test(textCombined) ||
      /(كم|ماهي)\s+(القيمه الماليه|قيمه البضاعه|قيمه المخزون)\s*(الحالي|ب بالمخزن)?/i.test(textCombined);
    const hasCashFlowWord = /(التدفق النقدي|التدفقات النقديه|حركه التدفقات النقديه|الداخله والخارجه|الداخل والخارج|كشف التدفقات)/i.test(textCombined);
    const hasUnpaidInvoicesWord = /(الفواتير الاجله|الفواتير الاجله|غير المسدده|غير مسدده|فواتير غير مدفوعه|الفواتير المعلقه)/i.test(textCombined);
    const hasSuppliersDueWord = /(مستحقات واجبه السداد|واجبه السداد|مستحقات الموردين|عليهم سداد|موردين لديهم مستحقات)/i.test(textCombined);
    const hasSlowMovingWord = /(الراكده|الراكده|بطيئه الحركه|نايمه بالمخزن|واقفه بالمحل|ناميه)/i.test(textCombined);
    const hasComprehensiveFinancialWord = /(التقرير المالي الشامل|صحه المحل|تقييم صحه المحل|المركز المالي الشامل|تشخيص المحل|كيف وضع المحل)/i.test(textCombined);
    const hasStoreHealthWord = /(كيف وضع المحل|كيف صحه المحل|صحه المحل|تشخيص المحل|تقييم المحل|كيف الشغل عموما|كيف الوضع|كيف الامور)/i.test(textCombined);
    const hasTopRevenueProductWord = /(اكثر صنف جاب فلوس|اكثر منتج دخل فلوس|ايش اكثر صنف جاب|اكثر صنف ربحنا منه|اكثر المنتجات ربحا ومبيعا|اعلى المنتجات دخلا)/i.test(textCombined);
    const hasTopDebtorsWord = /(اكثر واحد عليه فلوس|من عليه ديون|اكثر العملاء ديونا|اعلى الزبائن ديونا|اكبر المدينين|من اكثر واحد يدين)/i.test(textCombined);
    const hasLowStockWord = /(المنتجات الناقصه|الاصناف اللي بتخلص|ايش عاد به ناقص|ايش الاشياء اللي قربت تخلص|قربت تخلص|نواقص المخزن|النواقص|نواقص|الاصناف الناقصه|الاصناف الناقصة|السلع الناقصة)/i.test(textCombined);

    // --- Relational Scoring Adjustments ---
    if (def.name === 'STORE_HEALTH_DIAGNOSTIC') {
      if (hasStoreHealthWord) score += 35;
    }
    else if (def.name === 'PERFORMANCE_COMPARISON') {
      if (hasComparisonWord || /(مقارنه اداء الشهر|هل الشغل هذا الشهر افضل|هل مبيعاتنا احسن)/i.test(textCombined)) score += 35;
    }
    else if (def.name === 'TOP_REVENUE_PRODUCT_QUERY') {
      if (hasTopRevenueProductWord) score += 35;
    }
    else if (def.name === 'TOP_DEBTORS_QUERY') {
      if (hasTopDebtorsWord) score += 35;
    }
    else if (def.name === 'LOW_STOCK') {
      if (hasLowStockWord) score += 35;
    }
    else if (def.name === 'LARGEST_SALE_QUERY') {
      if (hasLargestSaleWord) score += 30;
    }
    else if (def.name === 'DRILLDOWN_EXPLANATION') {
      if (hasDrilldownExplanationWord) score += 25;
    }
    else if (def.name === 'DIAGNOSTIC_ANALYSIS') {
      if (hasDiagnosticWord) score += 30;
    }
    else if (def.name === 'GROWTH_ADVICE') {
      if (hasGrowthWord) score += 30;
    }
    else if (def.name === 'COMPARISON' || def.name === 'SALES_COMPARISON') {
      if (hasComparisonWord) score += 30;
    }
    else if (def.name === 'CUSTOMER_COLLECTION_RATE') {
      if (hasCollectionRateWord) score += 30;
    }
    else if (def.name === 'INVENTORY_VALUATION') {
      if (hasInventoryValuationWord) score += 30;
    }
    else if (def.name === 'CASH_FLOW') {
      if (hasCashFlowWord) score += 30;
    }
    else if (def.name === 'UNPAID_INVOICES') {
      if (hasUnpaidInvoicesWord) score += 30;
    }
    else if (def.name === 'SUPPLIER_PAYMENT_DUE') {
      if (hasSuppliersDueWord) score += 30;
    }
    else if (def.name === 'SLOW_MOVING_STOCK') {
      if (hasSlowMovingWord) score += 25;
    }
    else if (def.name === 'FINANCIAL_REPORT') {
      if (hasComprehensiveFinancialWord) score += 25;
    }
    else if (def.name === 'CASH_BALANCE') {
      if (hasCashDrawerWord) score += 20;
    }
    else if (def.name === 'SALES_BY_PRODUCT') {
      if (hasProductSalesWord || (hasSalesWord && /(صنف|منتج|بضاعه|عصير|حليب|سكر|رز|زيت|ماء|شاي|قهوه|تونه|صابون|شامبو|بيبسي)/i.test(textCombined))) {
        score += 25;
      } else if (hasSalesWord && /(كم مبيعات|سعر) ([أ-ي\w\s]+)/i.test(textCombined)) {
        // If it asks for sales of a specific entity (and not date)
        if (!hasDatePeriodWord) score += 20;
      }
    }
    else if (def.name === 'PRODUCT_SEARCH') {
      if (/(كم سعر|بكم|ايش سعر|كم باقي من|كم مخزون|كم رصيد من|ابحث عن صنف)/i.test(textCombined)) {
        if (!/(العميل|الزبون|المورد|الشركه)/i.test(textCombined)) {
          score += 20;
        }
      }
    }
    else if (def.name === 'SYSTEM_SECTIONS_GUIDE') {
      if (isSystemSectionsGuideQuery) score += 60;
    }
    else if (def.name === 'SYSTEM_HELP') {
      if (isSystemHelpQuery) score += 40;
    }
    else if (def.name === 'SYSTEM_INFO') {
      if (isSystemInfoQuery) score += 50;
    }
    else if (def.name === 'CUSTOMER_BALANCE' || def.name === 'DEBT_CUSTOMER_QUERY' || def.name === 'CUSTOMER_STATEMENT') {
      if (isCustomerDebtDirection) score += 18;
      else if (hasCustomerWord && /(دين|ديون|رصيد|حساب|مستحق|فلوس)/i.test(textCombined)) score += 12;
    }
    else if (def.name === 'SUPPLIER_BALANCE' || def.name === 'DEBT_SUPPLIER_QUERY' || def.name === 'SUPPLIER_STATEMENT') {
      if (isSupplierDebtDirection) score += 18;
      else if (hasSupplierWord && /(دين|ديون|رصيد|حساب|مستحق|سددنا|دفعنا)/i.test(textCombined)) score += 12;
    }
    else if (def.name === 'PROFIT_QUERY' || def.name === 'PROFIT_SUMMARY') {
      if (hasProfitWord) score += 15;
    }
    else if (def.name === 'EXPENSES_SUMMARY' || def.name === 'EXPENSE_CASH_QUERY') {
      if (hasExpenseWord && !hasCashDrawerWord) score += 15;
    }
    else if (def.name === 'INVENTORY_QUERY' || def.name === 'INVENTORY_STATUS') {
      if (hasInventoryWord && !hasProductSalesWord && !hasReturnWord) score += 12;
    }
    else if (def.name === 'SALES_SUMMARY' || def.name === 'SALES_QUERY' || def.name === 'SALES_BY_PERIOD') {
      if ((hasSalesWord || hasDatePeriodWord) && !hasLargestSaleWord && !isCustomerDebtDirection && !isSupplierDebtDirection && !hasProfitWord && !hasReturnWord && !hasAuditWord) {
        score += 10;
      }
    }
    else if (def.name === 'TAX_ZATCA_QUERY') {
      if (hasTaxWord) score += 15;
    }
    else if (def.name === 'RETURN_REFUND_QUERY') {
      if (hasReturnWord) score += 15;
    }
    else if (def.name === 'ANOMALY_DETECTION') {
      if (hasAuditWord || /(هل حدثت مشكله|هل حصل تلاعب|هل فيه خطا|هل فيه تلاعب)/i.test(textCombined)) score += 18;
    }
    else if (def.name === 'FORECAST') {
      if (hasForecastWord) score += 15;
    }

    // Contextual Pronoun Heuristic & Short Follow-ups
    if (userQuery?.context) {
      const activeEntity = userQuery.context.activeCustomer || userQuery.context.lastTargetName;
      if (activeEntity && /(عليه|له|حسابه|كشفه|ديونه)/i.test(textCombined)) {
        if (def.name === 'CUSTOMER_STATEMENT' || def.name === 'CUSTOMER_BALANCE' || def.name === 'DEBT_CUSTOMER_QUERY') {
          score += 6;
        }
      }
      
      if (userQuery.context.lastIntent === def.name) {
        // Boost if the query is very short (likely a follow up with just a name or date like "ومحمد؟" or "والامس؟")
        if (normalizedText.length <= 15) {
           score += 8;
        }
      }
    }

    const confidence = Math.round(Math.min(score / 12, 1.0) * 100) / 100;

    return {
      definition: def,
      name: def.name,
      score,
      confidence,
      parameters: { matchedKeywords },
    };
  });

  return scores.sort((a, b) => b.score - a.score);
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

  const scores = rankCandidateIntents(normalizedText, synonymResolvedText, userQuery);

  const topMatch = scores[0];

  if (!topMatch || topMatch.score <= 0) {
    return { name: 'UNKNOWN', confidence: 0 };
  }

  // Threshold check
  if (topMatch.confidence < 0.25) {
    return { name: 'UNKNOWN', confidence: topMatch.confidence, parameters: topMatch.parameters };
  }

  return {
    name: topMatch.name,
    confidence: topMatch.confidence,
    parameters: topMatch.parameters,
  };
}
