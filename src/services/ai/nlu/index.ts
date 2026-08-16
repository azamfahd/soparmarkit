import { UserQuery, NLUResult, Entity } from '../types';
import { normalizeArabic, stemArabicWord } from './arabicNormalizer';
import { resolveSynonymsInText } from './synonyms';
import { detectIntent, rankCandidateIntents, ScoredCandidateIntent } from './intentDetector';
import { extractEntities } from './entityExtractor';
import { classifyQueryCategory, QueryCategory } from './queryClassifier';
import { INTENT_DATASET, IntentDefinition } from './intentDataset';
import {
  SYSTEM_SECTIONS,
  SYSTEM_CARDS_AND_WIDGETS,
  SYSTEM_DICTIONARY,
  SYSTEM_PROCEDURE_GUIDES,
  getSectionFeaturesExplanation,
  getSystemCardExplanation,
  lookupSystemDictionary,
} from '../knowledge/systemKnowledgeGraph';

interface DynamicClarificationResult {
  message: string;
  suggestedQuestions: string[];
}

/**
 * Extracts key content tokens from user query by filtering out common Arabic stop words.
 */
function extractSignificantQueryTokens(
  rawText: string,
  normalizedText: string,
  synonymResolvedText: string
): string[] {
  const stopWords = new Set([
    'ما', 'هل', 'كيف', 'اين', 'أين', 'متى', 'اريد', 'أريد', 'بدي', 'يا', 'عن', 'في', 'من', 'على', 'إلى', 'الى',
    'مع', 'ايش', 'ماهو', 'ماهي', 'هذا', 'هذه', 'ذلك', 'صار', 'كان', 'غير', 'لي', 'لو', 'ان', 'أن',
    'كانت', 'هو', 'هي', 'به', 'فيه', 'عنها', 'منها', 'له', 'لها', 'كم', 'اين', 'التي', 'الذي',
    'حتى', 'بعد', 'قبل', 'اذا', 'إذا', 'اي', 'أاي', 'شو', 'شنو', 'وش', 'عايز', 'تريد', 'نريد',
    'ارغب', 'أرغب', 'ممكن', 'أود', 'اود'
  ]);

  const rawWords = rawText.split(/[^\w\u0600-\u06FF]+/).filter(w => w.trim().length >= 2);
  const normWords = normalizedText.split(/[^\w\u0600-\u06FF]+/).filter(w => w.trim().length >= 2);
  const synWords = synonymResolvedText.split(/[^\w\u0600-\u06FF]+/).filter(w => w.trim().length >= 2);

  const keyTokens = new Set<string>();
  for (const w of [...rawWords, ...normWords, ...synWords]) {
    const clean = w.trim();
    const normalizedWord = normalizeArabic(clean);
    if (normalizedWord.length >= 2 && !stopWords.has(normalizedWord)) {
      keyTokens.add(normalizedWord);
    }
  }

  return Array.from(keyTokens);
}

/**
 * Scores an intent definition based on word association, token overlaps, stemming, and domain semantics.
 */
function scoreIntentByWordAssociations(
  candidateDef: IntentDefinition,
  keyTokens: string[],
  normalizedText: string,
  synonymResolvedText: string,
  entities: Entity[]
): number {
  let score = 0;
  const textCombined = `${normalizedText} ${synonymResolvedText}`;

  // 1. Token Overlaps & Stem Matches
  for (const token of keyTokens) {
    const tokenStem = stemArabicWord(token);

    // Keyword match
    for (const kw of candidateDef.keywords) {
      if (kw === token) {
        score += 6;
      } else if (kw.includes(token) || token.includes(kw)) {
        score += 4;
      } else if (stemArabicWord(kw) === tokenStem) {
        score += 5;
      }
    }

    // Arabic Name match
    if (candidateDef.arabicName.includes(token) || candidateDef.arabicName.includes(tokenStem)) {
      score += 5;
    }

    // Description match
    if (candidateDef.description.includes(token)) {
      score += 3;
    }

    // Example match
    for (const example of candidateDef.examples) {
      if (example.includes(token) || example.includes(tokenStem)) {
        score += 3;
        break;
      }
    }
  }

  // 2. Entity Alignment Boost
  const hasNameEntity = entities.some(e => e.type === 'PERSON' || e.type === 'CUSTOMER' || e.type === 'SUPPLIER');
  const hasProductEntity = entities.some(e => e.type === 'PRODUCT');

  if (hasNameEntity) {
    if (['CUSTOMER_BALANCE', 'DEBT_CUSTOMER_QUERY', 'CUSTOMER_STATEMENT', 'SALES_BY_CUSTOMER', 'SUPPLIER_BALANCE', 'DEBT_SUPPLIER_QUERY', 'SUPPLIER_STATEMENT', 'CUSTOMER_PAYMENTS', 'SUPPLIER_PAYMENTS'].includes(candidateDef.name)) {
      score += 10;
    }
  }

  if (hasProductEntity) {
    if (['PRODUCT_SEARCH', 'INVENTORY_QUERY', 'SALES_BY_PRODUCT', 'LOW_STOCK', 'EXPIRED_PRODUCTS', 'INVENTORY_VALUATION'].includes(candidateDef.name)) {
      score += 10;
    }
  }

  // 3. Domain Action & Subject Co-occurrence Associations
  const hasActionTerm = /(تعديل|تغيير|حذف|إضافة|اضافة|طريقة|كيف|طباعة|سداد|دفع|استعلام|بحث)/i.test(textCombined);
  const hasInvoiceTerm = /(فاتورة|فواتير|سند|إيصال|ايصال)/i.test(textCombined);
  if (hasActionTerm && hasInvoiceTerm) {
    if (candidateDef.name === 'SYSTEM_HELP' || candidateDef.name === 'INVOICE_SEARCH' || candidateDef.name === 'CUSTOMER_STATEMENT') {
      score += 12;
    }
  }

  const hasCustomerTerm = /(عميل|عملاء|زبون|زبائن|زباين)/i.test(textCombined);
  const hasPaymentTerm = /(سداد|دفع|قبض|تحصيل|سدد|دفعنا)/i.test(textCombined);
  if (hasCustomerTerm && hasPaymentTerm) {
    if (candidateDef.name === 'CUSTOMER_PAYMENTS' || candidateDef.name === 'CUSTOMER_STATEMENT' || candidateDef.name === 'CUSTOMER_BALANCE') {
      score += 12;
    }
  }

  const hasRatioTerm = /(نسبة|معدل|هامش)/i.test(textCombined);
  const hasProfitTerm = /(ربح|أرباح|ارباح|مكسب)/i.test(textCombined);
  if (hasRatioTerm && hasProfitTerm) {
    if (candidateDef.name === 'PROFIT_MARGIN_RANKING' || candidateDef.name === 'PROFIT_QUERY' || candidateDef.name === 'PROFIT_SUMMARY') {
      score += 12;
    }
  }

  const hasSectionTerm = /(قسم|أقسام|اقسام|شاشة|شاشات|واجهة|واجهات)/i.test(textCombined);
  if (hasSectionTerm) {
    if (candidateDef.name === 'SYSTEM_SECTIONS_GUIDE') {
      score += 15;
    }
  }

  return score;
}

function buildCustomQuestionForIntent(
  candidate: ScoredCandidateIntent,
  rawText: string,
  entities: Entity[]
): string {
  const nameEntity = entities.find(e => e.type === 'PERSON' || e.type === 'CUSTOMER' || e.type === 'SUPPLIER');
  let extractedName = nameEntity ? nameEntity.value : '';

  if (!extractedName) {
    const nameMatch = rawText.match(/(?:على|لـ|العميل|المورد|زبون|حساب|عن)\s+([آأإء-يA-Za-z0-9_\s]{2,18})/i);
    if (nameMatch && nameMatch[1]) {
      const candidateName = nameMatch[1].split(/\s+/)[0].trim();
      if (candidateName.length >= 2 && !['كم', 'ديون', 'مبيعات', 'الارباح', 'المحل', 'المخزن', 'اليوم', 'هذا', 'ما'].includes(candidateName)) {
        extractedName = candidateName;
      }
    }
  }

  const productEntity = entities.find(e => e.type === 'PRODUCT');
  let extractedProduct = productEntity ? productEntity.value : '';
  if (!extractedProduct) {
    const prodMatch = rawText.match(/(?:سعر|صنف|منتج|بضاعة|كمية|مبيعات|بكم)\s+([آأإء-يA-Za-z0-9_\s]{2,15})/i);
    if (prodMatch && prodMatch[1]) {
      const candidateProd = prodMatch[1].split(/\s+/)[0].trim();
      if (candidateProd.length >= 2 && !['كم', 'هو', 'في', 'من', 'عن'].includes(candidateProd)) {
        extractedProduct = candidateProd;
      }
    }
  }

  const normalized = normalizeArabic(rawText);
  const defName = candidate.name;

  switch (defName) {
    case 'CUSTOMER_BALANCE':
    case 'DEBT_CUSTOMER_QUERY':
      return extractedName
        ? `كم المبلغ المستحق وإجمالي الديون المسجلة على العميل (${extractedName})؟`
        : `كم إجمالي الديون والمبالغ المستحقة على العملاء والزبائن؟`;

    case 'CUSTOMER_STATEMENT':
      return extractedName
        ? `عرض كشف حساب تفصيلي للعميل (${extractedName}) بالعمليات والمسددات`
        : `عرض كشف حساب تفصيلي بجميع فواتير وسدادات الزبائن`;

    case 'CUSTOMER_PAYMENTS':
      return extractedName
        ? `كيفية تسجيل سداد أو دفع مبلغ مالي للعميل (${extractedName})؟`
        : `تسجيل سداد أو تحصيل مبالغ مالية من حسابات العملاء`;

    case 'SALES_BY_CUSTOMER':
      return extractedName
        ? `كم إجمالي المبيعات والفواتير الخاصة بالعميل (${extractedName})؟`
        : `عرض المبيعات والفواتير موزعة حسب كل زبون`;

    case 'SUPPLIER_BALANCE':
    case 'DEBT_SUPPLIER_QUERY':
      return extractedName
        ? `كم المبلغ المتبقي والمستحق واجب السداد للمورد (${extractedName})؟`
        : `كم إجمالي الديون والمستحقات المترتبة علينا لصالح الموردين والشركات؟`;

    case 'SUPPLIER_STATEMENT':
      return extractedName
        ? `عرض كشف حساب تفصيلي بالعمليات وفواتير الشراء للمورد (${extractedName})`
        : `كشف حسابات الموردين ومستندات الشراء`;

    case 'SALES_BY_PRODUCT':
      return extractedProduct
        ? `كم إجمالي كمية مبيعات وأرباح صنف (${extractedProduct})؟`
        : `ما هي مبيعات وأرباح الأصناف الفردية الأكثر طلباً؟`;

    case 'PRODUCT_SEARCH':
    case 'INVENTORY_QUERY':
    case 'INVENTORY_STATUS':
      return extractedProduct
        ? `كم الكمية المتبقية وسعر البيع والتكلفة لصنف (${extractedProduct}) في المخزن؟`
        : `كم إجمالي عدد الأصناف المسجلة والقيمة المالية للمخزون الحالي؟`;

    case 'LOW_STOCK':
      return extractedProduct
        ? `هل صنف (${extractedProduct}) قريب من النفاد بداخل المحل؟`
        : `ما هي المنتجات والبضائع الناقصة القريبة من النفاد بداخل المحل؟`;

    case 'EXPIRED_PRODUCTS':
    case 'EXPIRING_PRODUCTS':
      return `هل توجد بضائع تنتهي صلاحيتها قريباً خلال الـ 30 يوماً القادمة؟`;

    case 'PROFIT_MARGIN_RANKING':
      return `ما هي نسبة هامش الربح والأصناف الأكثر إدراراً للأرباح بالمحل؟`;

    case 'PROFIT_QUERY':
    case 'PROFIT_SUMMARY':
    case 'PROFIT_ANALYSIS':
      return `كم صافي أرباح ومكاسب المحل الصافية (بعد خصم التكاليف والمصاريف)؟`;

    case 'SALES_SUMMARY':
    case 'SALES_QUERY':
    case 'SALES_BY_PERIOD':
      return `كم إجمالي مبيعات وإيرادات اليوم أو هذا الأسبوع؟`;

    case 'INVOICE_SEARCH':
      if (/(تعديل|تغيير)/i.test(normalized)) {
        return `البحث عن فاتورة مبيعات محددة وتعديل تفاصيلها برقم الفاتورة`;
      }
      return `البحث عن فاتورة مبيعات محددة برقم الفاتورة أو باسم الزبون`;

    case 'CASH_BALANCE':
    case 'EXPENSE_CASH_QUERY':
      return `ما هو الرصيد النقدي الفعلي بداخل درج الصندوق الآن (مطابقة الصندوق)؟`;

    case 'EXPENSES_SUMMARY':
      return `كم إجمالي المصاريف والمسحوبات التشغيلية المسجلة؟`;

    case 'COMPARISON':
    case 'SALES_COMPARISON':
      return `قارن مبيعات وأرباح هذا الشهر بالأداء في الشهر الماضي`;

    case 'DIAGNOSTIC_ANALYSIS':
      return `لماذا انخفضت الأرباح والمبيعات وما هو التحليل التشخيصي للأسباب؟`;

    case 'GROWTH_ADVICE':
      return `كيف أزيد مبيعات وأرباح المحل وأحسن هامش الربحية؟`;

    case 'SYSTEM_SECTIONS_GUIDE':
      return `ماذا يعني كل قسم في البرنامج وما هي وظائف شاشات النظام؟`;

    case 'SYSTEM_HELP':
      if (/(تعديل|تغيير)/i.test(normalized)) {
        return `كيف أعدل أو أغير بيانات فاتورة مبيعات أو صنف بداخل البرنامج؟`;
      }
      if (/(اضافة|إضافة|اضيف)/i.test(normalized)) {
        return `كيف أضيف صنف جديد أو أسجل فاتورة مبيعات جديدة؟`;
      }
      if (/(حذف|الغاء)/i.test(normalized)) {
        return `كيفية إقالة أو حذف فاتورة مسجلة بداخل النظام؟`;
      }
      return `كيف أستخدم خيارات البرنامج وأزرار تسجيل الفواتير والحسابات؟`;

    case 'SYSTEM_INFO':
      return `معلومات النظام المحاسبي وإصدار الوكيل الذكي`;

    default:
      if (candidate.definition.examples && candidate.definition.examples.length > 0) {
        return candidate.definition.examples[0];
      }
      return `استعلام حول ${candidate.definition.arabicName}`;
  }
}

export function generateSmartClarification(
  rawText: string,
  normalizedText: string,
  synonymResolvedText: string,
  userQuery: UserQuery,
  entities: Entity[],
  category: QueryCategory
): DynamicClarificationResult {
  const candidateIntents = rankCandidateIntents(normalizedText, synonymResolvedText, userQuery);
  const keyTokens = extractSignificantQueryTokens(rawText, normalizedText, synonymResolvedText);

  // 1. Combine base candidate scores with word association analysis
  const scoredDataset: ScoredCandidateIntent[] = INTENT_DATASET.map(def => {
    const baseCand = candidateIntents.find(c => c.name === def.name);
    const baseScore = baseCand ? baseCand.score : 0;
    const wordAssocScore = scoreIntentByWordAssociations(def, keyTokens, normalizedText, synonymResolvedText, entities);
    const totalScore = baseScore + wordAssocScore;
    const confidence = Math.round(Math.min(totalScore / 12, 1.0) * 100) / 100;

    return {
      definition: def,
      name: def.name,
      score: totalScore,
      confidence,
      parameters: baseCand ? baseCand.parameters : {},
    };
  }).sort((a, b) => b.score - a.score);

  const validCandidates = scoredDataset.filter(c => 
    c.name !== 'UNKNOWN' && 
    c.name !== 'GREETING_SMALLTALK' && 
    c.name !== 'USER_CORRECTION_FEEDBACK' &&
    c.score > 0
  );

  const selectedCandidates: ScoredCandidateIntent[] = [];
  const usedNames = new Set<string>();

  for (const cand of validCandidates) {
    if (!usedNames.has(cand.name)) {
      usedNames.add(cand.name);
      selectedCandidates.push(cand);
    }
    if (selectedCandidates.length >= 3) break;
  }

  // Modality-aligned fallback choices if word breakdown didn't yield 3 distinct options
  let fallbackIntentNames: Array<{ name: string; question: string; arabicName: string }> = [];

  if (category === 'SYSTEM_KNOWLEDGE' || category === 'PROCEDURE_HELP') {
    fallbackIntentNames = [
      { name: 'SYSTEM_SECTIONS_GUIDE', question: 'ماذا يعني كل قسم في البرنامج وما هي وظائف شاشات النظام؟', arabicName: 'شرح أقسام البرنامج' },
      { name: 'SYSTEM_HELP', question: 'كيف أضيف منتج جديد أو أسجل فاتورة مبيعات؟', arabicName: 'دليل استخدام العمليات' },
      { name: 'SYSTEM_INFO', question: 'معلومات عامة عن النظام المحاسبي والوكيل الذكي', arabicName: 'معلومات النظام' },
    ];
  } else {
    fallbackIntentNames = [
      { name: 'SALES_SUMMARY', question: 'كم إجمالي مبيعات وأرباح اليوم أو الأسبوع؟', arabicName: 'ملخص المبيعات والأرباح' },
      { name: 'DEBT_CUSTOMER_QUERY', question: 'كم إجمالي الديون المستحقة على العملاء؟', arabicName: 'ديون العملاء' },
      { name: 'LOW_STOCK', question: 'ما هي البضائع والأصناف الناقصة بالمتجر؟', arabicName: 'النواقص والمخزون' },
      { name: 'CASH_BALANCE', question: 'ما هو الرصيد النقدي ومطابقة درج الصندوق؟', arabicName: 'مطابقة الصندوق' },
    ];
  }

  const suggestedQuestions: string[] = [];
  const optionsListMarkdown: string[] = [];

  selectedCandidates.forEach((cand, idx) => {
    const question = buildCustomQuestionForIntent(cand, rawText, entities);
    suggestedQuestions.push(question);
    optionsListMarkdown.push(`${idx + 1}️⃣ **${cand.definition.arabicName}**:\n   👉 "${question}"`);
  });

  let fallbackIdx = 0;
  while (suggestedQuestions.length < 3 && fallbackIdx < fallbackIntentNames.length) {
    const fb = fallbackIntentNames[fallbackIdx];
    if (!suggestedQuestions.includes(fb.question)) {
      suggestedQuestions.push(fb.question);
      optionsListMarkdown.push(`${suggestedQuestions.length}️⃣ **${fb.arabicName}**:\n   👉 "${fb.question}"`);
    }
    fallbackIdx++;
  }

  const keyWordsFormatted = keyTokens.length > 0
    ? `بناءً على تحليل الكلمات والمفاهيم في سؤالك (**${keyTokens.slice(0, 4).join('**، **')}**)، `
    : `بناءً على الكلمات والترابط في سؤالك ("${rawText}")، `;

  const message = (
    `🤖 **المساعد المحاسبي الذكي:**\n\n` +
    `عذراً، لم أستطع تحديد قصدك بدقة تامة. ${keyWordsFormatted}هل تقصد أحد الاستعلامات التالية؟\n\n` +
    `${optionsListMarkdown.join('\n\n')}\n\n` +
    `💡 *يمكنك النقر مباشرة على أحد الخيارات المقترحة أعلاه أو إعادة صياغة سؤالك بصيغة أكثر تحديداً.*`
  );

  return {
    message,
    suggestedQuestions,
  };
}

export async function processNLU(query: UserQuery): Promise<NLUResult> {
  // 1. Normalize Arabic Text
  const normalizedText = normalizeArabic(query.rawText);

  // 2. Resolve Synonyms to Canonical Terms
  const synonymResolvedText = resolveSynonymsInText(normalizedText);

  // 3. Pre-classify Query Modality
  const classification = classifyQueryCategory(query.rawText, query.context);

  // 4. Detect Intent
  let intent = detectIntent(normalizedText, synonymResolvedText, query);

  // Decisively override if modality is System Knowledge, Procedure Help, or Accounting Concept
  if (classification.category === 'SYSTEM_KNOWLEDGE' && classification.confidence >= 0.8) {
    intent = {
      name: 'SYSTEM_SECTIONS_GUIDE',
      confidence: classification.confidence,
      parameters: { category: classification.category, reasoning: classification.reasoning }
    };
  } else if (classification.category === 'PROCEDURE_HELP' && classification.confidence >= 0.8) {
    intent = {
      name: 'SYSTEM_HELP',
      confidence: classification.confidence,
      parameters: { category: classification.category, reasoning: classification.reasoning }
    };
  } else if (classification.category === 'ACCOUNTING_CONCEPT' && classification.confidence >= 0.8) {
    intent = {
      name: 'ACCOUNTING_CONCEPT',
      confidence: classification.confidence,
      parameters: { category: classification.category, reasoning: classification.reasoning }
    };
  } else if (classification.category === 'GREETING_SMALLTALK' && classification.confidence >= 0.8) {
    intent = {
      name: 'GREETING_SMALLTALK',
      confidence: classification.confidence,
      parameters: { category: classification.category, reasoning: classification.reasoning }
    };
  }

  // 4.5 Universal Knowledge Graph & Semantic Match Check
  const rawTextClean = query.rawText || '';
  const isWhyDiagnostic = /^(لماذا|ليش|ليه|ما سبب|ماهو سبب|سبب)\b/i.test(normalizedText);
  const isExplicitSectionInquiry = /(?:معلومات|شرح|تفاصيل|وظيفة|مميزات|طريقة|عن|كيف)\s+(?:عن )?(?:قسم|شاشة|صفحة|واجهة|لوحة)?\s*(الاستيراد|الكاشير|المخزون|العملاء|الموردين|السجل|الصندوق|التحليلات|الاعدادات)/i.test(rawTextClean) ||
    /(?:قسم|شاشة|صفحة)\s+(الاستيراد|الكاشير|المخزون|العملاء|الموردين|السجل|الصندوق|التحليلات|الاعدادات)/i.test(rawTextClean) ||
    /(الاستيراد الذكي|استيراد السلع|استيراد البيانات|smart import)/i.test(rawTextClean);

  const secFeaturesMatch = getSectionFeaturesExplanation(rawTextClean) || getSectionFeaturesExplanation(normalizedText);
  const cardExplMatch = getSystemCardExplanation(rawTextClean) || getSystemCardExplanation(normalizedText);
  const dictMatches = lookupSystemDictionary(normalizedText) || lookupSystemDictionary(rawTextClean);

  if (isExplicitSectionInquiry && secFeaturesMatch) {
    intent = {
      name: 'SYSTEM_SECTIONS_GUIDE',
      confidence: 0.98,
      parameters: { matchType: 'SECTION_FEATURES' }
    };
  } else if (intent.name === 'UNKNOWN' || intent.confidence < 0.35 || isExplicitSectionInquiry) {
    if (secFeaturesMatch || cardExplMatch) {
      intent = {
        name: 'SYSTEM_SECTIONS_GUIDE',
        confidence: 0.95,
        parameters: { matchType: secFeaturesMatch ? 'SECTION_FEATURES' : 'SYSTEM_CARD' }
      };
    } else if (dictMatches && dictMatches.length > 0) {
      intent = {
        name: 'ACCOUNTING_CONCEPT',
        confidence: 0.92,
        parameters: { dictionaryTerm: dictMatches[0].arabicName }
      };
    } else if (isWhyDiagnostic) {
      intent = {
        name: 'DIAGNOSTIC_ANALYSIS',
        confidence: 0.90,
        parameters: { isWhyQuery: true }
      };
    } else {
      // Check if query contains any known section alias or system term
      for (const key of Object.keys(SYSTEM_SECTIONS)) {
        const sec = SYSTEM_SECTIONS[key];
        if (
          normalizedText.includes(normalizeArabic(sec.arabicName)) ||
          sec.aliases.some(a => normalizedText.includes(normalizeArabic(a)))
        ) {
          intent = {
            name: 'SYSTEM_SECTIONS_GUIDE',
            confidence: 0.88,
            parameters: { detectedSection: sec.id }
          };
          break;
        }
      }
    }
  }

  // 5. Extract Entities (passing rawText for exact date and numeric preservation)
  const entities = extractEntities(normalizedText, synonymResolvedText, query.rawText);

  // 6. Evaluate Clarification Requirement
  let isClarificationNeeded = false;
  let clarificationMessage: string | undefined = undefined;
  let suggestedClarifications: string[] | undefined = undefined;

  if (intent.name === 'UNKNOWN' || intent.confidence < 0.25) {
    isClarificationNeeded = true;
    const clarification = generateSmartClarification(
      query.rawText,
      normalizedText,
      synonymResolvedText,
      query,
      entities,
      classification.category
    );
    clarificationMessage = clarification.message;
    suggestedClarifications = clarification.suggestedQuestions;
  }

  return {
    intent,
    entities,
    isClarificationNeeded,
    clarificationMessage,
    suggestedClarifications,
  };
}

export * from './arabicNormalizer';
export * from './synonyms';
export * from './intentDataset';
export * from './intentDetector';
export * from './entityExtractor';
export * from './queryClassifier';

