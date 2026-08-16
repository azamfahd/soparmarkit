import { normalizeArabic, isFuzzyMatch, stemArabicWord } from './arabicNormalizer';

const rawSynonymsDict: Record<string, string[]> = {
  'مبيعات': [
    'بيع', 'المبيعات', 'مبيع', 'بعنا', 'دخلنا', 'دخل', 'مبيعه', 'شغل', 'شغل اليوم', 'دخل المحل', 
    'طلّع المحل', 'إيراد', 'إيرادات', 'مقبوضات', 'مبيعاتنا', 'فواتير المبيعات', 'حق البيع', 
    'خرجنا بضاعة', 'كم بعنا', 'كم دخلنا', 'مخرجات اليوم', 'كم حق اليوم', 'حساب المبيعات',
    'فواتير البيع', 'الي بعناه', 'الي طلع', 'دخل اليوميه', 'بياعه', 'تصريف', 'صرفنا', 'حركه',
    'جاب المحل', 'زلط البيع', 'كم جاب المحل', 'كم دخل لنا', 'كم كانت مبيعاتنا', 'كم دخل للمحل',
    'كم طلعنا اليوم', 'شغل البقالة', 'مبيعات الكاشير', 'حركة البيع', 'إجمالي البيع', 'المبيعات اليومية',
    'مبياعت', 'مبيعاتنا اليوم'
  ],
  'مشتريات': [
    'شراء', 'اشترينا', 'شرينا', 'قضينا', 'تقضينا', 'مقاضي', 'صرفنا بضاعه', 'مشترياتنا', 'وارد', 
    'بضاعه داخله', 'تسوقنا', 'توريد', 'مشترا', 'فاتورة مشتريات', 'فواتير المشتريات', 'بضاعة جديدة',
    'بضاعة واصلة', 'شحنة واردة', 'فاتورة المورد'
  ],
  'عميل': [
    'زبون', 'عملاء', 'زبائن', 'العميل', 'شخص', 'مشتري', 'زباين', 'مشتريين', 'الناس', 'المشتري', 
    'عميلنا', 'الزبائن المدينين', 'اهل الديون', 'اصحاب الديون', 'المدينين', 'الزبون حقنا', 'المشتريين',
    'متسوق', 'مستهلك', 'الذمم المدينة', 'أصحاب الحسابات', 'الزبون', 'زبايين', 'مشترين'
  ],
  'مورد': [
    'موردين', 'المورد', 'تجار', 'تاجر', 'شركه', 'مؤسسه', 'الموزعين', 'اصحاب البضاعه', 'الموردون', 
    'الشركات', 'موزع', 'مستورد', 'شركات التوريد', 'المندوب', 'مندوبين', 'اصحاب الشحن', 'الموزع حقنا',
    'شركات', 'تجار الجملة', 'المزودين', 'موردينا', 'مندوب الشركة', 'مورديين'
  ],
  'رصيد': [
    'حساب', 'مستحق', 'باقي', 'ديون', 'عليه', 'له', 'لنا', 'عنده', 'الرصيد', 'فلوس', 'زلط', 'بيس', 
    'باقي له', 'باقي عليه', 'حسابه', 'فلوسنا', 'حقنا', 'اللي لينا', 'اللي علينا', 'طالع علينا', 
    'حق الناس', 'حق الموردين', 'نطلب', 'يطلبنا', 'نطلبه', 'يطلبونا', 'ذمم', 'ذمة', 'سلف', 'تقسيط', 'آجل', 
    'اجل', 'مديونية', 'مديونيات', 'دفتر الديون', 'الحساب المعلق', 'كم باقي له', 'كم باقي عليه', 
    'كم نطلبه', 'كم يطلبنا', 'زلطنا', 'بيساتنا', 'فلوس الدفتر', 'حساب الدفتر', 'كم له عندنا', 'كم عنده لنا',
    'مبلغ', 'المبلغ', 'مبالغ', 'المبالغ', 'تسليفه', 'دينه', 'ديوننا', 'عليهم', 'عليه فلوس',
    'مين اكثر واحد عليه فلوس', 'من عليه ديون', 'من اكثر واحد يدين', 'كم شي باقي', 'كم باقي لنا',
    'كم باقي علينا', 'الحساب المتبقي', 'الذمة المالية', 'المستحقات', 'كشف الحساب'
  ],
  'منتج': [
    'صنف', 'بضاعه', 'سلعه', 'منتجات', 'اصناف', 'الاغراض', 'الصنف', 'الموجودات', 'عنصر', 'بضائع', 
    'الأصناف', 'ايتم', 'مواد', 'اغراض', 'سلع', 'كراتين', 'حبات', 'بضاعة المحل', 'المواد الغذائية',
    'غرض', 'قطعه', 'قطع', 'بضايع', 'أغراض', 'سلعة', 'عناصر'
  ],
  'فاتوره': [
    'فواتير', 'الفاتوره', 'حساب', 'كشف', 'ورقه', 'سند', 'فاتورتنا', 'سندات', 'وصل', 'إيصال', 
    'ارصده الفواتير', 'سند قبض', 'سند صرف', 'قسيمة', 'بوليصة', 'فاتورة مبيعات', 'فاتورة مشتريات',
    'الفواتير المعلقة', 'فواتيرر'
  ],
  'نقص': [
    'ناقص', 'يخلص', 'بيخلص', 'نفاد', 'نواقص', 'يحتاج', 'ناقصه', 'خلصت', 'ناقصين', 'قريبه النفاد', 
    'شبه منتهي', 'مخلص', 'عجز', 'ما بش منه', 'ما في منه', 'قارب يخلص', 'بيفضى', 'مخزونه قليل', 
    'تحت الحد', 'نطلب بضاعة', 'ناقصنا', 'ايش ناقص', 'وش ناقص', 'بيكمل', 'يكمل', 'قربت تخلص',
    'ايش الاشياء اللي قربت تخلص', 'الاصناف التي قاربت على النفاد', 'بضاعة ناقصة', 'كم عاد به'
  ],
  'مصروف': [
    'مصروفات', 'مصاريف', 'نفقات', 'صرفيات', 'خسرنا', 'صرفنا', 'دفعنا', 'مصرف', 'خسارة', 'تكاليف', 
    'مصاريفنا', 'مسحوبات', 'ايجار', 'كهرباء', 'رواتب', 'حق الغداء', 'حق القات', 'صرفة اليوم', 
    'نثريات', 'صرفيات المحل', 'مسحوبات شخصية', 'مصاريف تشغيلية', 'صرفه', 'منصرف', 'كم صرفنا كاش',
    'مسحوبات الدرج', 'نفقات تشغيل'
  ],
  'ربح': [
    'ارباح', 'مكسب', 'كسبنا', 'فائده', 'صافي', 'مكاسب', 'ارباحنا', 'الربحيه', 'فايده', 'هامش الربح', 
    'عوائد', 'مردود', 'ربحية', 'فائدتنا', 'مكسبنا', 'صافي اليوم', 'صافي المحل', 'كم طلع ربح', 'كم طلع لنا',
    'ربحنا', 'مربح', 'فوايد', 'ايش اكثر صنف جاب لنا فلوس', 'اكثر منتج ربحا', 'ارابح', 'مجمل الربح',
    'صافي الربح', 'ربحنا منه'
  ],
  'مخزون': [
    'مستودع', 'المخزن', 'كميات', 'الموجود', 'بالمخزن', 'البضاعه', 'المستودعات', 'الستوك', 'الخزين', 
    'بضاعة المخزن', 'المتوفر', 'كم باقي حبات', 'كم باقي كراتين', 'حجم المخزون', 'بضاعة الرف', 
    'رصيد مخزني', 'راس مال البضاعة', 'قيمة المخزون', 'جرد المخزن', 'مستودعات'
  ],
  'نقد': [
    'صندوق', 'درج', 'كاش', 'خزنه', 'بيزات', 'زلط', 'فلوس', 'الخزينه', 'النقدية', 'سيولة', 'فلوس كاش', 
    'الدرج', 'شبكة', 'مدى', 'فيزا', 'تحويل', 'سداد الكتروني', 'نقدية الصندوق', 'حق الدرج', 'فلوس الصندوق',
    'مطابقة الصندوق', 'جرد الدرج', 'كم في الصندوق', 'كم به بالدرج', 'كم زلط بالدرج', 'كم فلوس بالصندوق',
    'رصيد الصندوق', 'حركه الصندوق', 'دراهم', 'نقود', 'تسوية الصندوق', 'تسوية الوردية'
  ],
  'صحة': [
    'وضع المحل', 'كيف وضع المحل', 'صحة المحل', 'تقييم المحل', 'تشخيص المحل', 'حالة المحل',
    'كيف الشغل', 'كيف وضعنا', 'تقرير 360', 'نظرة عامة', 'الملخص الشامل للمحل', 'مؤشرات الاداء'
  ],
  'مقارنة': [
    'قارن', 'مقارنة', 'هل الشغل افضل', 'هل الشغل احسن', 'مقارنة الشهر', 'مقارنة الفترات',
    'هل مبيعاتنا احسن', 'هل نحن افضل', 'هل زادت المبيعات', 'الفرق بين الشهرين', 'مقارنة بالماضي'
  ],
  'اليوم': [
    'النهارده', 'يومنا', 'النهاردا', 'اليوم الحالي', 'النهارده كام', 'حق اليوم', 'اليوميه', 'الليلة'
  ],
  'امس': [
    'الأمس', 'البارحة', 'البارح', 'امسيه', 'يوم امس', 'امبارح'
  ],
  'شهر': [
    'الشهر', 'شهريا', 'شهرنا'
  ],
  'سنه': [
    'السنه', 'عام', 'سنويا', 'سنتنا'
  ],
  'راكد': [
    'غير مباع', 'بطيء الحركة', 'ما ينباع', 'راكدة', 'بطيئة', 'نامية بالمخزن', 'مكدس', 'ميت', 
    'ما يتحرك', 'بضاعة واقفة', 'بضاعة نايمة', 'ما يمشيش', 'مايباع'
  ],
  'مرتجع': [
    'ترجيع', 'مردودات', 'استبدال', 'ارجاع', 'المرتجعات', 'رجعنا', 'استرجاع', 'مردود', 'رجع بضاعة', 
    'ترجيع الزبون', 'مرتجعات المبيعات'
  ],
  'خصم': [
    'تخفيض', 'عرض', 'خصومات', 'عروض', 'تنزيلات', 'خصم خاص', 'تخفيضات', 'مراعاة', 'راعيه', 'نزل له', 'خصمنا له', 'نقص له'
  ],
  'ضريبة': [
    'القيمة المضافة', 'فواتير ضريبية', 'زكاة', 'زكاه', 'الضريبة', 'VAT', 'زكاتنا', 'الضريبه', 'حق الضريبة', 'ضريبة القيمة المضافة', 'ضرايب'
  ],
  'توالف': [
    'تالف', 'خربان', 'منتهي', 'تاريخ الانتهاء', 'منتهي الصلاحية', 'إتلاف', 'تالفة', 'كسر', 'مضروب', 
    'خربانين', 'تاريخه قريب', 'قارب ينتهي', 'قريب الانتهاء', 'خسارة التوالف', 'منتهيه'
  ],
  'اكثر': [
    'أكثر', 'اكبر', 'اعلى', 'أعلى', 'احسن', 'أحسن', 'افضل', 'أفضل', 'الاعلى', 'الأكثر', 'اقوى', 
    'اكثر شي', 'مين اكثر', 'اكثر واحد'
  ],
  'اقل': [
    'أقل', 'اصغر', 'أصغر', 'ادنى', 'أدنى', 'اسوا', 'أسوأ', 'الاقل', 'الأقل', 'اضعف', 'اضعف شي', 
    'مين اقل'
  ],
  'سداد': [
    'سدد', 'سددنا', 'دفع', 'دفعنا', 'حاسب', 'خلص حساب', 'قفل حساب', 'اوفى', 'تسديد', 'دفعات', 
    'دفعوه', 'ادوه'
  ]
};

const reverseSynonymsMap = new Map<string, string>();
const canonicalKeys: string[] = [];

// Pre-sort multi-word synonyms by word count descending to ensure greedy longest-phrase matching
const multiWordSynonyms: { phrase: string; canonical: string }[] = [];
const singleWordSynonyms = new Map<string, string>();

for (const [canonical, synonyms] of Object.entries(rawSynonymsDict)) {
  const normalizedCanonical = normalizeArabic(canonical);
  reverseSynonymsMap.set(normalizedCanonical, normalizedCanonical);
  singleWordSynonyms.set(normalizedCanonical, normalizedCanonical);
  if (!canonicalKeys.includes(normalizedCanonical)) {
    canonicalKeys.push(normalizedCanonical);
  }
  
  for (const synonym of synonyms) {
    const normalizedSynonym = normalizeArabic(synonym);
    reverseSynonymsMap.set(normalizedSynonym, normalizedCanonical);

    if (normalizedSynonym.includes(' ')) {
      multiWordSynonyms.push({ phrase: normalizedSynonym, canonical: normalizedCanonical });
    } else {
      singleWordSynonyms.set(normalizedSynonym, normalizedCanonical);
    }
  }
}

// Sort multi-word phrases by length descending
multiWordSynonyms.sort((a, b) => b.phrase.length - a.phrase.length);

/**
 * Replaces recognized synonyms with their canonical normalized form.
 * Supports multi-word compound phrases, exact word match, prefix stripping, stemming, and fuzzy edit distance.
 */
export function resolveSynonymsInText(normalizedText: string): string {
  if (!normalizedText) return '';

  let processedText = normalizedText;

  // 1. Greedy Multi-Word Phrase Replacement (Longest Phrases First)
  for (const { phrase, canonical } of multiWordSynonyms) {
    const regex = new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(?=\\s|$)`, 'gi');
    if (regex.test(processedText)) {
      processedText = processedText.replace(regex, `$1${canonical}`);
    }
  }

  // 2. Token-level replacement for remaining individual words
  const words = processedText.split(/\s+/).filter(w => w.length > 0);
  const resolvedWords = words.map(word => {
    // 2.1 Direct match
    let match = singleWordSynonyms.get(word) || reverseSynonymsMap.get(word);
    if (match) return match;

    // 2.2 Stemmed match (removing prefixes/suffixes)
    const stemmed = stemArabicWord(word);
    match = singleWordSynonyms.get(stemmed) || reverseSynonymsMap.get(stemmed);
    if (match) return match;

    // 2.3 Common prefixes fallback
    if (word.startsWith('ال') && word.length > 3) {
      match = singleWordSynonyms.get(word.substring(2)) || reverseSynonymsMap.get(word.substring(2));
      if (match) return match;
    }
    if (word.startsWith('ب') && word.length > 2) {
      match = singleWordSynonyms.get(word.substring(1)) || reverseSynonymsMap.get(word.substring(1));
      if (match) return match;
    }
    if (word.startsWith('بال') && word.length > 4) {
      match = singleWordSynonyms.get(word.substring(3)) || reverseSynonymsMap.get(word.substring(3));
      if (match) return match;
    }
    if (word.startsWith('و') && word.length > 2) {
      match = singleWordSynonyms.get(word.substring(1)) || reverseSynonymsMap.get(word.substring(1));
      if (match) return match;
    }

    // 2.4 Fuzzy matching against known dictionary terms for typos
    const skipFuzzyWords = ['ايام', 'أيام', 'اشهر', 'أشهر', 'اسبوع', 'أسبوع', 'سنوات', 'سنة', 'سنه', 'يوم', 'تاريخ', 'شهور', 'اعوام', 'أعوام'];
    if (word.length >= 4 && !skipFuzzyWords.includes(word)) {
      for (const [dictTerm, canonical] of singleWordSynonyms.entries()) {
        if (isFuzzyMatch(word, dictTerm, 1)) {
          return canonical;
        }
      }
    }

    return word;
  });

  return resolvedWords.join(' ');
}

export function getCanonicalForm(word: string): string {
  const norm = normalizeArabic(word);
  return reverseSynonymsMap.get(norm) || reverseSynonymsMap.get(stemArabicWord(norm)) || norm;
}

