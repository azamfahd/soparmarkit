import { normalizeArabic } from './arabicNormalizer';
import { resolveSynonymsInText } from './synonyms';

export type QueryCategory =
  | 'SYSTEM_KNOWLEDGE'      // Structure, sections, tabs, what does section X do, what is the app
  | 'PROCEDURE_HELP'        // How to do action X in the UI (how to add customer, how to print receipt...)
  | 'ACCOUNTING_LIVE'       // Live DB numbers: sales today, profit, debts, low stock
  | 'DATA_ANALYTICS'        // Comparisons, 360 health diagnostic, anomalies, forecasting
  | 'ENTITY_INQUIRY'        // Specific customer, supplier, or product balance/price
  | 'ACCOUNTING_CONCEPT'    // Concept definitions: COGS, gross profit, VAT, ledger
  | 'COMPOUND_MULTI_INTENT' // Multi-part questions requiring decomposition
  | 'CONVERSATIONAL_FOLLOW_UP' // Multi-turn follow-up (and yesterday? and Mohamed?)
  | 'GREETING_SMALLTALK'    // Hello, thanks, who are you
  | 'USER_CORRECTION'       // User correcting previous answer ("لا اقصد كذا")
  | 'AMBIGUOUS_CLARIFICATION' // Multiple interpretations
  | 'OUT_OF_SCOPE'          // Weather, sports, non-pos general questions
  | 'UNKNOWN_UNCLEAR';      // Truly unparseable

export interface QueryClassificationResult {
  category: QueryCategory;
  confidence: number;
  subCategories?: QueryCategory[];
  isCompound: boolean;
  detectedSection?: string;
  isProcedural: boolean;
  reasoning: string;
}

/**
 * Classifies a user query into its overarching functional modality BEFORE accounting intent mapping.
 * Prevents the system from assuming every inquiry is a live accounting database calculation.
 */
export function classifyQueryCategory(rawText: string, context?: any): QueryClassificationResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      category: 'UNKNOWN_UNCLEAR',
      confidence: 0,
      isCompound: false,
      isProcedural: false,
      reasoning: 'استعلام فارغ'
    };
  }

  const cleanRaw = rawText.trim();
  const normalized = normalizeArabic(cleanRaw);
  const synonymText = resolveSynonymsInText(normalized);

  // 1. Check User Correction
  if (/^(لا|غلط|مش كذا|خطا|اقصد|قصدي|غير صحيح)\b/i.test(normalized)) {
    return {
      category: 'USER_CORRECTION',
      confidence: 0.95,
      isCompound: false,
      isProcedural: false,
      reasoning: 'تصحيح مباشر من المستخدم لإجابة سابقة'
    };
  }

  // 2. Check Greetings & Small Talk
  if (/^(مرحبا|اهلا|السلام عليكم|صباح الخير|مساء الخير|شكرا|يعطيك العافيه|تسلم|من انت|عرف بنفسك|هلا|سلام)$/i.test(normalized)) {
    return {
      category: 'GREETING_SMALLTALK',
      confidence: 0.98,
      isCompound: false,
      isProcedural: false,
      reasoning: 'تحية وترحيب عام'
    };
  }

  // 3. Check Multi-turn Conversational Follow-up
  const isShortFollowUp = /^(و|ثم|ايضا|طب|طيب)?\s*(الامس|امس|البارحه|اليوم|هذا الشهر|الشهر الماضي|هذا الاسبوع|الاسبوع الماضي|من اكثر|وكم|ومحمد|واحمد|وعلي|وسالم|والمورد|والزبون|وماذا عن|وكيف بخصوص)\??$/i.test(cleanRaw.trim());
  if (isShortFollowUp && context?.lastIntent) {
    return {
      category: 'CONVERSATIONAL_FOLLOW_UP',
      confidence: 0.92,
      isCompound: false,
      isProcedural: false,
      reasoning: 'سؤال متابعة لسياق المحادثة السابق'
    };
  }

  // 4. Check Compound Multi-Intent Queries
  // Examples: "ما وظيفة قسم المبيعات، وكيف أستخدمه، وكم مبيعات اليوم؟"
  const hasMultipleQuestions = (cleanRaw.includes('?') && cleanRaw.split('?').filter(s => s.trim().length > 3).length > 1) ||
    cleanRaw.includes('،') || cleanRaw.includes(' وكم ') || cleanRaw.includes(' وايش ') || cleanRaw.includes(' وايضا ');
  
  const hasSystemKeyword = /قسم|شاشه|شاشات|اقسام|صفحه|صفحات|برنامج|نظام|وظيفة|فائدة/i.test(normalized);
  const hasAccountingKeyword = /كم مبيعات|كم ارباح|كم ديون|كم رصيد|كم دخل|كم في الصندوق/i.test(normalized) || /كم مبيعات|كم ربح|كم دين|كم نقد/i.test(synonymText);
  const hasHowToKeyword = /كيف استخدم|طريقه|كيف اعمل|كيف اضيف|كيف اسجل|كيف اطبع/i.test(normalized);

  let detectedIntentCount = 0;
  if (hasSystemKeyword) detectedIntentCount++;
  if (hasAccountingKeyword) detectedIntentCount++;
  if (hasHowToKeyword) detectedIntentCount++;

  if (hasMultipleQuestions && detectedIntentCount >= 2) {
    return {
      category: 'COMPOUND_MULTI_INTENT',
      confidence: 0.94,
      isCompound: true,
      isProcedural: hasHowToKeyword,
      reasoning: 'سؤال مركب يحتوي على أكثر من شق وظيفي مستقل'
    };
  }

  // 5. Check System Knowledge & Program Structure & Card & Feature Questions
  // Examples: "ماذا يعني كل قسم في البرنامج؟", "ما وظيفة قسم المبيعات؟", "ما هي مميزات قسم الكاشير؟", "شرح بطاقة ديون العملاء", "ماذا تعني بطاقة رأس مال المخزون؟"
  const systemStructurePatterns = [
    /ماذا يعني كل قسم/i,
    /ما معنى كل قسم/i,
    /ما هي اقسام/i,
    /ما هي شاشات/i,
    /ما هي صفحات/i,
    /ما وظيفه كل قسم/i,
    /شرح اقسام/i,
    /اشرح لي البرنامج/i,
    /ما هو هذا البرنامج/i,
    /ما الذي استطيع فعله/i,
    /ما فائدة (قسم|شاشه|شاشة|صفحه|صفحة|نظام|برنامج)/i,
    /ما وظيفه (قسم|شاشه|شاشة|صفحه|صفحة|نظام|برنامج)/i,
    /ماذا يفعل (قسم|شاشه|شاشة|صفحه|صفحة|نظام|برنامج)/i,
    /ماذا يوجد داخل (قسم|شاشه|شاشة|صفحه|صفحة)/i,
    /اشرح لي (قسم|شاشه|شاشة|صفحه|صفحة)/i,
    /وظيفة (قسم|شاشة|شاشه|المبيعات|الكاشير|المخزون|المنتجات|العملاء|الموردين|الصندوق|التقارير)/i,
    /فائدة (قسم|شاشة|شاشه)/i,
    /(مميزات|مزايا|خصائص|وظائف|امكانيات) (قسم|شاشة|صفحة|لوحة|الكاشير|المخزون|العملاء|الموردين|السجل|الصندوق|التحليلات|الاعدادات|المستشار)/i,
    /ما (هي|هو) (مميزات|مزايا|خصائص) (قسم|شاشة|صفحة|لوحة|الكاشير|المخزون|العملاء|الموردين|السجل|الصندوق|التحليلات|الاعدادات|المستشار)/i,
    /(شرح|توضيح|بيان|تفاصيل) (بطاقة|كارت|مؤشر|نافذة|شاشة|قسم)/i,
    /ماذا (تعرض|تحسب|توضح|تعني|تبين) (بطاقة|كارت|مؤشر)/i,
    /ما الفرق بين/i,
    /الفرق بين (العملاء|الموردين|المبيعات|المخزون|سجل الفواتير|لوحة التحكم|المستشار)/i,
    /دليل البرنامج/i,
    /دليل استخدام/i,
    /اقسام البرنامج/i,
    /شاشات النظام/i,
    /عن البرنامج/i,
    /ايش يسوي البرنامج/i,
    /ايش فايدة (قسم|شاشة|البرنامج)/i,
    /ايش وظيفة (قسم|شاشة|البرنامج)/i,
    /ايش مميزات/i,
    /(?:معلومات|بيانات|تفاصيل|شرح|نبذة|فكرة)\s+(?:عن|حول)?\s*(?:قسم|شاشة|صفحة|واجهة|لوحة|الاستيراد|الكاشير|المخزون|العملاء|الموردين|السجل|الصندوق|التحليلات|الاعدادات)/i,
    /(?:قسم|شاشة|صفحة)\s+(?:الاستيراد|استيراد|الكاشير|المخزون|المنتجات|العملاء|الزبائن|الموردين|الشركات|السجل|الصندوق|التحليلات|المستشار|الاعدادات)/i,
    /(?:الاستيراد الذكي|استيراد السلع|استيراد البيانات|رفع ملف اكسل|smart import)/i,
  ];

  for (const pattern of systemStructurePatterns) {
    if (pattern.test(normalized)) {
      return {
        category: 'SYSTEM_KNOWLEDGE',
        confidence: 0.98,
        isCompound: false,
        isProcedural: false,
        reasoning: 'سؤال استفساري عن بنية ووظائف وأقسام شاشات النظام'
      };
    }
  }

  // 6. Check Procedure / How-To Help
  // Examples: "كيف أضيف منتج؟", "كيف أطبع فاتورة؟", "طريقة تسديد دين", "كيف أسجل مرتجع؟"
  const procedurePatterns = [
    /كيف (اضيف|اسجل|اطبع|احذف|اعدل|اسدد|ادفع|استرجع|اصدر|اعمل|استخدم|افتتح|اقفل|اصفي|اجرد|اشتري|ابيع)/i,
    /كيفيه (الاضافه|التسجيل|الطباعه|الحذف|التعديل|التسديد|الدفع|الاسترجاع|الاصدار|العمل|الاستخدام|التصفيه|الجرد)/i,
    /طريقه (اضافه|تسجيل|طباعه|حذف|تعديل|تسديد|دفع|استرجاع|اصدار|عمل|استخدام|تصفيه|جرد|بيع|شراء)/i,
    /خطوات (اضافه|تسجيل|طباعه|تسديد|تصفيه|عمل|بيع|شراء)/i,
    /ازاي (اضيف|اعمل|اسجل|اطبع|اسدد|ابيع)/i,
    /شلون (اضيف|اسجل|اطبع|اسدد|ابيع)/i,
    /كيف اسوي/i,
    /كيف يمكنني (اضافة|تسجيل|طباعة|تسديد|تعديل)/i
  ];

  for (const pattern of procedurePatterns) {
    if (pattern.test(normalized)) {
      return {
        category: 'PROCEDURE_HELP',
        confidence: 0.96,
        isCompound: false,
        isProcedural: true,
        reasoning: 'سؤال إجرائي استرشادي حول كيفية استخدام ميزة بالواجهة'
      };
    }
  }

  // 7. Check Accounting Conceptual Queries
  // Examples: "ما معنى تكلفة البضاعة المباعة؟", "ما هو مجمل الربح؟", "ما هو سند القبض؟", "ما هي ضريبة القيمة المضافة؟"
  const conceptPatterns = [
    /ما (هو|هي|معنى|المقصود ب|تعريف) (تكلفه البضاعه|مجمل الربح|صافي الربح|هامش الربح|سند قبض|سند صرف|الذمم المدينه|الحد الائتماني|المخزون الراكد|ضريبه القيمه المضافه|الرصيد الدائن|الرصيد المدين|جرد المخزن)/i,
    /ماذا يعني (مجمل الربح|صافي الربح|تكلفه البضاعه|هامش الربح|سند القبض|سند الصرف|سند قبض|سند صرف)/i,
    /الفرق بين (مجمل الربح|صافي الربح|الاصول|الخصوم|المدين|الدائن)/i,
    /كيف يحسب (مجمل الربح|صافي الربح|هامش الربح|الاهلاك)/i,
    /مجمل الربح/i
  ];

  for (const pattern of conceptPatterns) {
    if (pattern.test(normalized)) {
      return {
        category: 'ACCOUNTING_CONCEPT',
        confidence: 0.95,
        isCompound: false,
        isProcedural: false,
        reasoning: 'سؤال حول مفهوم محاسبي أو مصطلح مالي نظري'
      };
    }
  }

  // 8. Check Analytics & Diagnostic Queries
  // Examples: "كيف صحة المحل؟", "قارن هذا الشهر بالشهر الماضي", "لماذا انخفضت المبيعات؟", "توقع مبيعات الاسبوع القادم"
  const analyticsPatterns = [
    /صحه المحل|وضع المحل|تشخيص المحل|تقرير 360/i,
    /قارن (هذا الشهر|هذا الاسبوع|اليوم|المبيعات)/i,
    /لماذا (انخفضت|قلت|زادت|تراجعت) (المبيعات|الارباح)/i,
    /توقع (المبيعات|الارباح|الطلب)/i,
    /كشف الاخطاء|حركات مشبوهه|تشوهات ماليه/i,
    /اكثر المنتجات ربحا|اعلى الاصناف بيعا|اكثر الزبائن ديونا/i
  ];

  for (const pattern of analyticsPatterns) {
    if (pattern.test(normalized)) {
      return {
        category: 'DATA_ANALYTICS',
        confidence: 0.91,
        isCompound: false,
        isProcedural: false,
        reasoning: 'طلب تحليل إحصائي أو تشخيص مالي مقارن'
      };
    }
  }

  // 9. Check Specific Entity Lookup
  // Examples: "كم على أحمد؟", "كم للمورد سالم؟", "سعر البيبسي", "كم باقي من حليب المراعي؟"
  const entityPatterns = [
    /كم (على|لحساب|دين|رصيد|يطلبنا|نطلب)\s+([آأإء-يA-Za-z0-9_\s]+)/i,
    /(سعر|كميه|باقي من|مخزون)\s+([آأإء-يA-Za-z0-9_\s]+)/i
  ];

  if (/(كم على|كم دين|كم حساب|كم للمورد|كم يطلبنا|سعر المنتج|كم باقي من)\b/i.test(normalized)) {
    return {
      category: 'ENTITY_INQUIRY',
      confidence: 0.90,
      isCompound: false,
      isProcedural: false,
      reasoning: 'استعلام عن رصيد عميل أو مورد أو بيانات صنف محدد'
    };
  }

  // 10. Check Live Accounting Database Metrics
  // Examples: "كم مبيعات اليوم؟", "كم الأرباح؟", "كم الديون الإجمالية؟", "ما هي النواقص؟"
  if (/(كم مبيعات|كم ارباح|كم ديون|كم مصاريف|كم في الصندوق|كم كاش|ما هي النواقص|المنتجات المنتهيه|اجمالي المبيعات)\b/i.test(normalized) ||
      /(مبيعات|ربح|ديون|مصروف|نقد|نقص)\b/i.test(synonymText)) {
    return {
      category: 'ACCOUNTING_LIVE',
      confidence: 0.88,
      isCompound: false,
      isProcedural: false,
      reasoning: 'استعلام حسابي مباشر من قاعدة بيانات المتجر'
    };
  }

  // 11. Check Out of Scope (Weather, football, general non-pos knowledge)
  if (/(طقس|جو|كره قدم|مباراه|اخبار اليوم|طبخ|شعر|سياسه|فيلم|اغنيه)\b/i.test(normalized)) {
    return {
      category: 'OUT_OF_SCOPE',
      confidence: 0.95,
      isCompound: false,
      isProcedural: false,
      reasoning: 'سؤال عام خارج نطاق نظام إدارة المتجر والمحاسبة'
    };
  }

  // Default Fallback
  return {
    category: 'UNKNOWN_UNCLEAR',
    confidence: 0.3,
    isCompound: false,
    isProcedural: false,
    reasoning: 'استعلام غير واضح أو غير مصنف بدقة'
  };
}
