import { normalizeArabic, isFuzzyMatch, stemArabicWord } from './arabicNormalizer';

const rawSynonymsDict: Record<string, string[]> = {
  'مبيعات': ['بيع', 'المبيعات', 'مبيع', 'بعنا', 'دخلنا', 'دخل', 'مبيعه', 'شغل', 'شغل اليوم', 'دخل المحل', 'طلّع المحل', 'إيراد', 'إيرادات', 'مقبوضات', 'مبيعاتنا', 'فواتير المبيعات'],
  'عميل': ['زبون', 'عملاء', 'زبائن', 'العميل', 'شخص', 'مشتري', 'زباين', 'مشتريين', 'الناس', 'المشتري', 'عميلنا'],
  'مورد': ['موردين', 'المورد', 'تجار', 'تاجر', 'شركه', 'مؤسسه', 'الموزعين', 'اصحاب البضاعه', 'الموردون', 'الشركات', 'موزع', 'مستورد'],
  'رصيد': ['حساب', 'مستحق', 'باقي', 'ديون', 'عليه', 'له', 'لنا', 'عنده', 'الرصيد', 'فلوس', 'حسابه', 'فلوسنا', 'حقنا', 'اللي لينا', 'اللي علينا', 'طالع علينا', 'حق الناس', 'حق الموردين', 'نطلب', 'يطلبنا', 'نطلبه', 'ذمم', 'ذمة', 'تقسيط', 'آجل', 'مديونية'],
  'منتج': ['صنف', 'بضاعه', 'سلعه', 'منتجات', 'اصناف', 'الاغراض', 'الصنف', 'الموجودات', 'عنصر', 'بضائع', 'الأصناف', 'ايتم', 'مواد'],
  'فاتوره': ['فواتير', 'الفاتوره', 'حساب', 'كشف', 'ورقه', 'سند', 'فاتورتنا', 'سندات', 'وصل', 'إيصال'],
  'نقص': ['ناقص', 'يخلص', 'بيخلص', 'نفاد', 'نواقص', 'يحتاج', 'ناقصه', 'خلصت', 'ناقصين', 'قريبه النفاد', 'شبه منتهي', 'مخلص', 'عجز'],
  'مصروف': ['مصروفات', 'مصاريف', 'نفقات', 'صرفيات', 'خسرنا', 'صرفنا', 'دفعنا', 'مصرف', 'خسارة', 'تكاليف', 'مصاريفنا', 'مسحوبات', 'ايجار', 'كهرباء', 'رواتب'],
  'ربح': ['ارباح', 'مكسب', 'كسبنا', 'فائده', 'صافي', 'مكاسب', 'ارباحنا', 'الربحيه', 'فايده', 'هامش الربح', 'عوائد', 'مردود', 'ربحية'],
  'مخزون': ['مستودع', 'المخزن', 'كميات', 'الموجود', 'بالمخزن', 'البضاعه', 'المستودعات', 'الستوك', 'الخزين', 'بضاعة المخزن'],
  'نقد': ['صندوق', 'درج', 'كاش', 'خزنه', 'بيزات', 'الخزينه', 'النقدية', 'سيولة', 'فلوس كاش', 'الدرج', 'شبكة', 'مدى', 'فيزا', 'تحويل', 'سداد الكتروني'],
  'اليوم': ['اليوم', 'النهارده', 'يومنا', 'النهاردا', 'اليوم الحالي', 'النهارده كام'],
  'شهر': ['الشهر', 'هالشهر', 'شهريا', 'هذا الشهر', 'شهرنا', 'الشهر الماضي', 'الشهر الجاي'],
  'سنه': ['السنه', 'عام', 'هالسنه', 'سنويا', 'هذه السنه', 'سنتنا', 'العام الماضي'],
  'راكد': ['غير مباع', 'بطيء الحركة', 'ما ينباع', 'راكدة', 'بطيئة', 'نامية بالمخزن', 'مكدس'],
  'مرتجع': ['ترجيع', 'مردودات', 'استبدال', 'ارجاع', 'المرتجعات', 'رجعنا', 'استرجاع', 'مردود'],
  'خصم': ['تخفيض', 'عرض', 'خصومات', 'عروض', 'تنزيلات', 'خصم خاص', 'تخفيضات'],
  'ضريبة': ['القيمة المضافة', 'فواتير ضريبية', 'زكاة', 'زكاه', 'الضريبة', 'VAT', 'زكاتنا', 'الضريبه'],
  'توالف': ['تالف', 'خربان', 'منتهي', 'تاريخ الانتهاء', 'منتهي الصلاحية', 'إتلاف', 'تالفة', 'كسر'],
};

const reverseSynonymsMap = new Map<string, string>();
const canonicalKeys: string[] = [];

for (const [canonical, synonyms] of Object.entries(rawSynonymsDict)) {
  const normalizedCanonical = normalizeArabic(canonical);
  reverseSynonymsMap.set(normalizedCanonical, normalizedCanonical);
  if (!canonicalKeys.includes(normalizedCanonical)) {
    canonicalKeys.push(normalizedCanonical);
  }
  
  for (const synonym of synonyms) {
    const normalizedSynonym = normalizeArabic(synonym);
    reverseSynonymsMap.set(normalizedSynonym, normalizedCanonical);
  }
}

/**
 * Replaces recognized synonyms with their canonical normalized form.
 * Supports exact match, prefix stripping, stemming, and fuzzy edit distance for typos.
 */
export function resolveSynonymsInText(normalizedText: string): string {
  const words = normalizedText.split(' ');
  const resolvedWords = words.map(word => {
    // 1. Direct match
    let match = reverseSynonymsMap.get(word);
    if (match) return match;

    // 2. Stemmed match (removing prefixes/suffixes)
    const stemmed = stemArabicWord(word);
    match = reverseSynonymsMap.get(stemmed);
    if (match) return match;

    // 3. Common prefixes fallback
    if (word.startsWith('ال') && word.length > 3) {
      match = reverseSynonymsMap.get(word.substring(2));
      if (match) return match;
    }
    if (word.startsWith('ب') && word.length > 2) {
      match = reverseSynonymsMap.get(word.substring(1));
      if (match) return match;
    }
    if (word.startsWith('بال') && word.length > 4) {
      match = reverseSynonymsMap.get(word.substring(3));
      if (match) return match;
    }
    if (word.startsWith('و') && word.length > 2) {
      match = reverseSynonymsMap.get(word.substring(1));
      if (match) return match;
    }

    // 4. Fuzzy matching against known dictionary terms for typos (e.g., "دبون" -> "ديون", "احنمد" -> "احمد")
    if (word.length >= 4) {
      for (const [dictTerm, canonical] of reverseSynonymsMap.entries()) {
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

