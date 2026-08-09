import { Entity } from '../types';

export function extractEntities(
  normalizedText: string,
  synonymResolvedText: string
): Entity[] {
  const entities: Entity[] = [];

  // 1. Date Range & Time Period Extraction
  if (synonymResolvedText.includes('اليوم') || normalizedText.includes('اليوم') || normalizedText.includes('النهارده')) {
    entities.push({
      type: 'DATE_RANGE',
      value: 'TODAY',
      confidence: 0.95,
    });
  } else if (
    synonymResolvedText.includes('امس') ||
    normalizedText.includes('امس') ||
    normalizedText.includes('البارحه')
  ) {
    entities.push({
      type: 'DATE_RANGE',
      value: 'YESTERDAY',
      confidence: 0.95,
    });
  } else if (
    synonymResolvedText.includes('هذا الاسبوع') ||
    normalizedText.includes('هذا الاسبوع') ||
    normalizedText.includes('الاسبوع الحالي') ||
    normalizedText.includes('خلال اسبوع') ||
    normalizedText.includes('اخر 7 ايام')
  ) {
    entities.push({
      type: 'DATE_RANGE',
      value: 'THIS_WEEK',
      confidence: 0.9,
    });
  } else if (
    synonymResolvedText.includes('هذا الشهر') ||
    normalizedText.includes('هذا الشهر') ||
    normalizedText.includes('الشهر الحالي') ||
    normalizedText.includes('شهريا') ||
    normalizedText.includes('اخر 30 يوم')
  ) {
    entities.push({
      type: 'DATE_RANGE',
      value: 'THIS_MONTH',
      confidence: 0.9,
    });
  } else if (
    synonymResolvedText.includes('الشهر الماضي') ||
    normalizedText.includes('الشهر الماضي') ||
    normalizedText.includes('الشهر السابق')
  ) {
    entities.push({
      type: 'DATE_RANGE',
      value: 'LAST_MONTH',
      confidence: 0.9,
    });
  } else if (
    synonymResolvedText.includes('هذه السنه') ||
    normalizedText.includes('هذه السنه') ||
    normalizedText.includes('هالسنه') ||
    normalizedText.includes('السنه الحاليه')
  ) {
    entities.push({
      type: 'DATE_RANGE',
      value: 'THIS_YEAR',
      confidence: 0.9,
    });
  } else if (
    normalizedText.includes('السنه الماضيه') ||
    normalizedText.includes('العام الماضي') ||
    normalizedText.includes('العام المنصرم')
  ) {
    entities.push({
      type: 'DATE_RANGE',
      value: 'LAST_YEAR',
      confidence: 0.9,
    });
  }

  // Payment Method Entity Extraction
  if (/(كاش|نقدا|نقدي|صندوق|درج)/i.test(normalizedText)) {
    entities.push({ type: 'PAYMENT_METHOD', value: 'CASH', confidence: 0.9 });
  } else if (/(شبكة|مدى|فيزا|ماستر|بطاقة|الكتروني|سداد)/i.test(normalizedText)) {
    entities.push({ type: 'PAYMENT_METHOD', value: 'CARD', confidence: 0.9 });
  } else if (/(آجل|اجل|تقسيط|دين|ذمة|على الحساب)/i.test(normalizedText)) {
    entities.push({ type: 'PAYMENT_METHOD', value: 'CREDIT', confidence: 0.9 });
  }

  // 2. Numeric Limit & Threshold Extraction (e.g. أعلى 5 منتجات / أكثر من 500 ريال)
  const limitMatch = normalizedText.match(/(اعلى|اكثر|افضل|اقل|اول|اكبر)\s+(\d+)/i);
  if (limitMatch && limitMatch[2]) {
    entities.push({
      type: 'LIMIT',
      value: limitMatch[2],
      confidence: 0.9,
    });
  }

  const thresholdMatch = normalizedText.match(/(تتجاوز|تعدت|اكثر من|اكبر من|اعلى من|فوق)\s+(\d+)/i);
  if (thresholdMatch && thresholdMatch[2]) {
    entities.push({
      type: 'THRESHOLD',
      value: thresholdMatch[2],
      confidence: 0.9,
    });
  }

  // 3. Numbers extraction
  const numbersMatch = normalizedText.match(/\b\d+(\.\d+)?\b/g);
  if (numbersMatch) {
    numbersMatch.forEach(num => {
      // Don't duplicate if already extracted as limit
      if (!entities.some(e => e.type === 'LIMIT' && e.value === num)) {
        entities.push({
          type: 'NUMBER',
          value: num,
          confidence: 0.85,
        });
      }
    });
  }

  // 4. Target Name Extraction (Customer / Supplier / Product Name candidate)
  const namePatterns = [
    /(?:حساب|ديون|رصيد|عن|ل|على|الزبون|العميل|عند|لنا|له|نطلب|يطلبنا)\s+([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,})?)/i,
    /([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,})?)\s+(?:عليه|له|عنده|حسابه|ديونه|فلوسه|حقنا)\b/i,
    /(?:المورد|شركة|مؤسسة|مورد|تاجر|موزع)\s+([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,})?)/i,
    /(?:منتج|صنف|سعر|كمية|بضاعة)\s+([أ-يأإآءئؤ\d]{2,}(?:\s+[أ-يأإآءئؤ\d]{2,})?)/i,
  ];

  const genericStopWords = [
    'اليوم', 'الشهر', 'السنه', 'الماضي', 'المبيعات', 'الارباح', 'المصارف', 'المصاريف',
    'ديون', 'عميل', 'عملاء', 'العملاء', 'زبون', 'زبائن', 'الزبائن', 'زباين',
    'مورد', 'موردين', 'الموردين', 'شركة', 'شركات', 'الشركات', 'منتج', 'منتجات', 'المنتجات',
    'صنف', 'اصناف', 'الاصناف', 'بضاعه', 'البضاعه', 'مبيعات', 'ارباح', 'مصروفات', 'مصاريف',
    'مخزون', 'المخزن', 'فواتير', 'الفواتير', 'ملاحظات', 'التذكيرات', 'تذكيرات',
    'الكل', 'الجميع', 'الناس', 'شغل', 'محل', 'متجر', 'صندوق', 'درج', 'كاش', 'خزينة',
    'دين', 'رصيد', 'كم', 'هناك', 'عنده', 'عند', 'من', 'ما', 'مين', 'الي', 'اللي', 'عندنا', 'علينا', 'لنا',
    'شنو', 'ايش', 'قد', 'بعنا', 'دخلنا', 'حقنا', 'فلوسنا', 'كشف'
  ];

  for (const pattern of namePatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const extractedName = match[1].trim();
      const normExtracted = extractedName.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
      
      const isStopWord = genericStopWords.some(sw => {
        const normSw = sw.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
        return normExtracted === normSw || normExtracted.startsWith(normSw);
      });

      if (!isStopWord && extractedName.length >= 2) {
        entities.push({
          type: 'TARGET_NAME',
          value: extractedName,
          confidence: 0.75,
        });
        break;
      }
    }
  }

  // 5. Categorize TARGET_NAME into specific entity types (CUSTOMER, SUPPLIER, PRODUCT, INVOICE, EXPENSE_TYPE)
  const targetEntity = entities.find(e => e.type === 'TARGET_NAME');
  if (targetEntity) {
    const val = targetEntity.value;
    if (/(مورد|شركة|مؤسسة|تاجر|موزع)/i.test(normalizedText)) {
      entities.push({ type: 'SUPPLIER', value: val, confidence: 0.85 });
    } else if (/(منتج|صنف|سعر|كمية|بضاعة)/i.test(normalizedText)) {
      entities.push({ type: 'PRODUCT', value: val, confidence: 0.85 });
    } else {
      entities.push({ type: 'CUSTOMER', value: val, confidence: 0.80 });
    }
  }

  // 6. Expense Type Extraction
  const expenseMatch = normalizedText.match(/(كهرباء|إيجار|ايجار|رواتب|راتب|نقل|شحن|صيانة|بنزين|وقود|ماء|نت|إنترنت|انترنت|مصاريف إدارية)/i);
  if (expenseMatch) {
    entities.push({
      type: 'EXPENSE_TYPE',
      value: expenseMatch[1],
      confidence: 0.90,
    });
  }

  // 7. Invoice Number Extraction
  const invoiceMatch = normalizedText.match(/(?:فاتورة|فاتوره|سند)\s+(?:رقم\s+)?(\d+)/i);
  if (invoiceMatch && invoiceMatch[1]) {
    entities.push({
      type: 'INVOICE_ID',
      value: invoiceMatch[1],
      confidence: 0.95,
    });
  }

  return entities;
}
