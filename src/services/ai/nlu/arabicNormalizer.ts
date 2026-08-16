export function normalizeArabic(text: string): string {
  if (!text) return '';
  
  let normalized = text.toLowerCase();
  
  // Remove diacritics (Tashkeel)
  normalized = normalized.replace(/[\u0617-\u061A\u064B-\u0652\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '');
  
  // Normalize Hamza & Alif variants
  normalized = normalized.replace(/[أإآٱٲٳ]/g, 'ا');
  
  // Normalize Taa Marbuta to Haa
  normalized = normalized.replace(/ة/g, 'ه');
  
  // Normalize Alif Maqsura to Yaa
  normalized = normalized.replace(/ى/g, 'ي');

  // Normalize Hamza forms:
  // Hamza on Nabrah (ئ) is phonetically/orthographically Yaa (e.g., رائد -> رايد, فائز -> فايز)
  normalized = normalized.replace(/ئ/g, 'ي');
  // Hamza on Waw (ؤ) is phonetically/orthographically Waw (e.g., مؤيد -> مويد, لؤي -> لوي)
  normalized = normalized.replace(/ؤ/g, 'و');
  // Standalone Hamza (ء)
  normalized = normalized.replace(/ء/g, '');
  
  // Normalize Eastern Arabic & Persian numbers to Western digits
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
    normalized = normalized.replace(new RegExp(persianNumbers[i], 'g'), i.toString());
  }
  
  // Remove Tatweel (Kashida)
  normalized = normalized.replace(/ـ/g, '');
  
  // Strip punctuation but keep alphanumeric and spaces
  normalized = normalized.replace(/[^\w\s\u0600-\u06FF]/g, ' ');
  
  // Strip leading conjunctions when they start short follow-up questions (e.g. "والأمس" -> "الامس", "وهذا الشهر" -> "هذا الشهر", "ومن أكثر" -> "من اكثر", "وكم ربحنا" -> "كم ربحنا")
  normalized = normalized.replace(/^و\s*(الامس|امس|البارحه|اليوم|هذا الشهر|الشهر الماضي|هذا الاسبوع|الاسبوع الماضي|من اكثر|كم ربحنا|كم دخل|كم باقي|ايش اكثر)\b/gi, '$1');

  // Normalize common Yemeni & Arabian dialectal question/filler/colloquial words
  // Extensive mapping for dialect tolerance
  normalized = normalized.replace(/\b(ماهو|ماهي|ماهوش|ايشهو|ايشبه|ايش فيه|وش|شو|شنو|كم به|كمشي|كمو|كم عاد|شكم|قد به|قدو|مابه|ما به|شتي|تشتي|اشتيك|اشتي|يشتي|نشتي|اديني|ادلي|جيب لي|هات لي|طلع لي|احسب لي|وريني|خبرني|علمني|قل لي|فهمني|ابغاك|ابغى|ودي|قديش|قد ايه|شلون|ازاي|وين|فين|تكفه|برجاء|لو سمحت|عايز|عاوز|يبي|يبغي|محتاج|بالله|اسمع|يا ذكي|يا محاسب|يا وكيل|ياخي|يارجال|بكمشي|على كم|شاقول|الصدق|امانه|امانتك|ممكن|تقدر|لو تكرمت|معاك|سعكم|سع|مقضي|مسابرة|اديلو|ادي|مابش|مامن|ماحد|لديكم|عندكم)\b/gi, ' ');

  // Standardize core interrogatives and phrases
  normalized = normalized.replace(/\b(ايش بعنا|ايش انباع|ايش الذي بعناه|ايش اللي بعناه)\b/g, 'كم مبيعات');
  normalized = normalized.replace(/\b(كم جاب المحل|كم دخل لنا|كم دخل للمحل|كم كانت مبيعاتنا|كم مبيعاتنا|كم دخل اليوميه|كم طلعنا|كم حق اليوم)\b/g, 'كم مبيعات');
  normalized = normalized.replace(/\b(مين اكثر واحد عليه فلوس|من اكثر واحد يدين|من عليه اكثر ديون|من اكثر زبون متسلف|من اكثر العملاء دينا)\b/g, 'اكثر العملاء ديونا');
  normalized = normalized.replace(/\b(ايش اكثر صنف جاب لنا فلوس|ايش اكثر منتج دخل فلوس|ايش اكثر صنف ربحنا منه|ايش اعلى صنف بيعا)\b/g, 'اكثر المنتجات ربحا ومبيعا');
  normalized = normalized.replace(/\b(ايش الاشياء اللي قربت تخلص|ايش الاصناف اللي بتخلص|ايش اللي ناقص|ايش النواقص|ايش عاد به ناقص)\b/g, 'المنتجات الناقصة');
  normalized = normalized.replace(/\b(هل الشغل هذا الشهر افضل|هل مبيعاتنا احسن|هل وضعنا افضل من قبل|قارن هذا الشهر بالماضي)\b/g, 'مقارنة اداء الشهر الحالي بالماضي');
  normalized = normalized.replace(/\b(كيف وضع المحل|كيف صحة المحل|كيف الشغل عموما|اعطني تشخيص المحل|تقرير شامل عن المحل)\b/g, 'تقرير صحة المحل الشامل');

  // Normalize phonetic and dialectal spelling variations & shortcuts (Yemeni/Local)
  normalized = normalized.replace(/\b(زلط|بيس|مصاري|قروش|دراهم|نقود)\b/g, 'فلوس');
  normalized = normalized.replace(/\b(دكاكين|محلات|بقالات|بوفيات)\b/g, 'محل');
  normalized = normalized.replace(/\b(كشفه|حسابه|حساباتهم|دفتره|دفاتر|حساباته|كشوفاته|كشف حساب)\b/g, 'حساب');
  normalized = normalized.replace(/\b(الزباين|للزبائن|المشتريين|مشترين|زباينه|للزباين|لزبون)\b/g, 'عميل');
  normalized = normalized.replace(/\b(الموردين|للموردين|موردينه|مزودين|تجار الجمله|مندوبين|المندوبين|للمندوبين)\b/g, 'مورد');
  normalized = normalized.replace(/\b(اصناف|ايتم|الايتمات|سلع|اغراض|غرض|حبات|حبه|قطعه|قطع|بضايع|مواد)\b/g, 'منتج');
  normalized = normalized.replace(/\b(تسليفه|سلف|سلفه|دين|الديون|مديونيه|مديونية|دينه|ديوننا|لهم|لنا|يبونا|نبيهم|نشتي منهم|يشتو مننا)\b/g, 'ديون');
  normalized = normalized.replace(/\b(امس|البارح|البارحه|امسيه|الامسيه)\b/g, 'الامس');
  normalized = normalized.replace(/\b(ذلحين|الان|الآن|هسع|الوقت هذا|حاليا|دحين)\b/g, 'اليوم');
  normalized = normalized.replace(/\b(مشتريات|اشترينا|شرينا|قضينا|تقضينا|مقاضي|صرفنا بضاعه|شراء)\b/g, 'مشتريات');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Extracts N-grams (unigrams, bigrams, trigrams, and 4-grams) from normalized text.
 */
export function extractNGrams(text: string, maxN = 4): string[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const nGrams: string[] = [];

  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const gram = words.slice(i, i + n).join(' ');
      nGrams.push(gram);
    }
  }

  return nGrams;
}

/**
 * Calculates Levenshtein Distance between two strings for typo tolerance.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if two words match within an edit distance threshold (fuzzy match for typos).
 */
export function isFuzzyMatch(word1: string, word2: string, maxDistance = 1): boolean {
  if (Math.abs(word1.length - word2.length) > maxDistance) return false;
  if (word1 === word2) return true;
  if (word1.length <= 3) return false; // Avoid fuzzy false positives for very short words
  return levenshteinDistance(word1, word2) <= maxDistance;
}

/**
 * Stems common Arabic prefixes and suffixes for resilient keyword matching.
 */
export function stemArabicWord(word: string): string {
  if (!word || word.length <= 3) return word;
  
  let stemmed = word;

  // Multi-letter Compound Prefixes
  const compoundPrefixes = ['وبال', 'فبال', 'كبال', 'فلل', 'ولل', 'وبالم', 'فبالم', 'بال', 'كال', 'فال', 'لل', 'ال', 'با', 'فا', 'وا'];
  for (const prefix of compoundPrefixes) {
    if (stemmed.startsWith(prefix) && stemmed.length - prefix.length >= 3) {
      stemmed = stemmed.substring(prefix.length);
      break;
    }
  }

  // Single letter prefixes if length still >= 4
  if (stemmed.length >= 4 && (stemmed.startsWith('و') || stemmed.startsWith('ف') || stemmed.startsWith('ب') || stemmed.startsWith('ل') || stemmed.startsWith('ك') || stemmed.startsWith('س'))) {
    const candidate = stemmed.substring(1);
    if (candidate.length >= 3) {
      stemmed = candidate;
    }
  }

  // Common Suffixes
  const suffixes = ['هما', 'هما', 'اتنا', 'اتكم', 'اتهم', 'تنا', 'تكم', 'تهم', 'هم', 'كم', 'نا', 'ها', 'ين', 'ون', 'ات', 'ه', 'ي'];
  for (const suffix of suffixes) {
    if (stemmed.endsWith(suffix) && stemmed.length - suffix.length >= 3) {
      stemmed = stemmed.substring(0, stemmed.length - suffix.length);
      break;
    }
  }

  return stemmed;
}

const ARABIC_SPELLED_NUMBERS: Record<string, number> = {
  'صفر': 0, 'واحد': 1, 'واحده': 1, 'اثنان': 2, 'اثنين': 2, 'ثلاثه': 3, 'ثلاث': 3,
  'اربعه': 4, 'اربع': 4, 'خمسه': 5, 'خمس': 5, 'سته': 6, 'ست': 6, 'سبعه': 7, 'سبع': 7,
  'ثمانيه': 8, 'ثماني': 8, 'تسعه': 9, 'تسع': 9, 'عشره': 10, 'عشر': 10,
  'مائه': 100, 'ميه': 100, 'الف': 1000, 'مليون': 1000000
};

export function extractNumbers(text: string): number[] {
  const normalized = normalizeArabic(text);
  const regex = /\d+(\.\d+)?/g;
  const matches = normalized.match(regex);
  const numbers: number[] = matches ? matches.map(Number) : [];

  // Parse spelled out words if no digits were found
  const words = normalized.split(/\s+/);
  for (const w of words) {
    if (ARABIC_SPELLED_NUMBERS[w] !== undefined) {
      numbers.push(ARABIC_SPELLED_NUMBERS[w]);
    }
  }

  return numbers;
}


