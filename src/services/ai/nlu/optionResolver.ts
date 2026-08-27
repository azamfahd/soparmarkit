import { MemoryContext } from '../memory/types';

interface ResolvedOptionResult {
  resolvedText: string;
  forceIntent?: string;
  categoryName?: string;
}

/**
  Normalizes option selection numbers (Arabic numerals, English numerals, words).
 */
export function parseOptionNumber(text: string): number | null {
  if (!text) return null;
  const clean = text.trim().toLowerCase().replace(/[أإآ]/g, 'ا');

  const directMap: Record<string, number> = {
    '1': 1, '١': 1, '1️⃣': 1, 'واحد': 1, 'الاول': 1, 'الخيار الاول': 1, 'الخيار 1': 1, 'رقم 1': 1, 'اول واحد': 1, 'خيار 1': 1, 'خيار واحد': 1, 'الاولى': 1,
    '2': 2, '٢': 2, '2️⃣': 2, 'اثنين': 2, 'اثنان': 2, 'الثاني': 2, 'الخيار الثاني': 2, 'الخيار 2': 2, 'رقم 2': 2, 'ثاني واحد': 2, 'خيار 2': 2, 'خيار اثنين': 2, 'الثانية': 2,
    '3': 3, '٣': 3, '3️⃣': 3, 'ثلاثه': 3, 'الثالث': 3, 'الخيار الثالث': 3, 'الخيار 3': 3, 'رقم 3': 3, 'ثالث واحد': 3, 'خيار 3': 3, 'خيار ثلاثة': 3, 'الثالثة': 3,
    '4': 4, '٤': 4, '4️⃣': 4, 'اربعة': 4, 'الرابع': 4, 'الخيار الرابع': 4, 'الخيار 4': 4, 'رقم 4': 4, 'رابع واحد': 4, 'خيار 4': 4, 'خيار اربعة': 4, 'الرابعة': 4,
    '5': 5, '٥': 5, '5️⃣': 5, 'خمسه': 5, 'الخامس': 5, 'الخيار الخامس': 5, 'الخيار 5': 5, 'رقم 5': 5, 'خامس واحد': 5, 'خيار 5': 5, 'الخامسة': 5,
  };

  if (directMap[clean]) return directMap[clean];

  // Regex pattern matching for numbers at the start or standalone
  const match = clean.match(/^(?:الخيار|رقم|خيار|اختيار)?\s*([1-5١-٥])\b/);
  if (match) {
    const numChar = match[1];
    return directMap[numChar] || parseInt(numChar, 10);
  }

  return null;
}

/**
 * Resolves user numbered selection based on conversation history context.
 */
export function resolveOptionSelectionFromHistory(
  userQueryText: string,
  memoryContext: MemoryContext
): ResolvedOptionResult | null {
  const optionNumber = parseOptionNumber(userQueryText);
  if (!optionNumber) return null;

  const lastAssistantMsg = memoryContext?.recentMessages
    ?.slice()
    .reverse()
    .find(m => m.role === 'assistant');

  if (!lastAssistantMsg || !lastAssistantMsg.content) return null;

  const lastContent = lastAssistantMsg.content;

  // 1. SUPPLIERS Section Context
  if (lastContent.includes('قسم الموردين') || lastContent.includes('ديون الموردين') || lastContent.includes('بطاقات الموردين') || lastContent.includes('مستحق المورد')) {
    if (optionNumber === 1) {
      return {
        resolvedText: 'كم المبلغ الذي تم تسديده للموردين ورأس المال المسلم للتجار؟',
        forceIntent: 'SUPPLIER_PAYMENTS',
        categoryName: 'المسدد والمدفوع للتجار'
      };
    }
    if (optionNumber === 2) {
      return {
        resolvedText: 'كم المتبقي والديون القائمة للموردين والشركات؟',
        forceIntent: 'SUPPLIER_BALANCE',
        categoryName: 'المتبقي والديون القائمة للموردين'
      };
    }
    if (optionNumber === 3) {
      return {
        resolvedText: 'اريد كشف حساب مورد معين',
        forceIntent: 'SUPPLIER_STATEMENT',
        categoryName: 'كشف حساب مورد'
      };
    }
    if (optionNumber === 4) {
      return {
        resolvedText: 'تقرير شامل وجرد كلي لقسم الموردين والتجار',
        forceIntent: 'FULL_SYSTEM_AUDIT',
        categoryName: 'جرد شامل للموردين'
      };
    }
  }

  // 2. CUSTOMERS Section Context
  if (lastContent.includes('ديون العملاء') || lastContent.includes('قسم العملاء') || lastContent.includes('بطاقة ديون العملاء') || lastContent.includes('ذمم العملاء')) {
    if (optionNumber === 1) {
      return {
        resolvedText: 'كم إجمالي ديون العملاء المترتبة بكتيب الديون وأعلى المدينين؟',
        forceIntent: 'CUSTOMER_BALANCE',
        categoryName: 'إجمالي ديون العملاء'
      };
    }
    if (optionNumber === 2) {
      return {
        resolvedText: 'من هم أكثر العملاء التزاماً بسداد ديونهم؟',
        forceIntent: 'CUSTOMER_BALANCE',
        categoryName: 'العملاء الأكثر التزاماً'
      };
    }
    if (optionNumber === 3) {
      return {
        resolvedText: 'اريد كشف حساب عميل معين',
        forceIntent: 'CUSTOMER_STATEMENT',
        categoryName: 'كشف حساب عميل'
      };
    }
    if (optionNumber === 4) {
      return {
        resolvedText: 'كم تحصيلات وسدادات ديون العملاء النقدية؟',
        forceIntent: 'CUSTOMER_PAYMENTS',
        categoryName: 'تحصيلات وسدادات العملاء'
      };
    }
  }

  // 3. PROFIT & SALES Section Context
  if (lastContent.includes('الأرباح المحققة') || lastContent.includes('تقرير الأرباح') || lastContent.includes('صافي الربح') || lastContent.includes('المبيعات بالآجل')) {
    if (optionNumber === 1) {
      return {
        resolvedText: 'ما هو إجمالي صافي الأرباح المحققة التراكمية في النظام؟',
        forceIntent: 'PROFIT_SUMMARY',
        categoryName: 'الأرباح المحققة التراكمية'
      };
    }
    if (optionNumber === 2) {
      return {
        resolvedText: 'كم إجمالي المبيعات بالآجل والبيع بالدين؟',
        forceIntent: 'CREDIT_SALES_QUERY',
        categoryName: 'المبيعات بالآجل'
      };
    }
    if (optionNumber === 3) {
      return {
        resolvedText: 'ما هي المنتجات والأصناف الأكثر مبيعات وإيراداً؟',
        forceIntent: 'TOP_SELLING_PRODUCTS',
        categoryName: 'المنتجات الأكثر مبيعا'
      };
    }
    if (optionNumber === 4) {
      return {
        resolvedText: 'كم المسحوبات والتسويات النقدية بالدرج والصندوق؟',
        forceIntent: 'WITHDRAWALS_AND_ADJUSTMENTS_QUERY',
        categoryName: 'المسحوبات والتسويات النقدية'
      };
    }
  }

  // 4. INVENTORY Section Context
  if (lastContent.includes('قسم المخزون') || lastContent.includes('البضائع والسلع') || lastContent.includes('النواقص والكميات الحرجة') || lastContent.includes('قيمة المخزون')) {
    if (optionNumber === 1) {
      return {
        resolvedText: 'ما هي المنتجات والأصناف القريبة من النفاد والنواقص؟',
        forceIntent: 'LOW_STOCK',
        categoryName: 'النواقص والكميات الحرجة'
      };
    }
    if (optionNumber === 2) {
      return {
        resolvedText: 'ما هي القيمة المالية الإجمالية للمخزون بسعر التكلفة والجملة والبيع؟',
        forceIntent: 'INVENTORY_VALUATION',
        categoryName: 'تقييم قيمة المخزون'
      };
    }
    if (optionNumber === 3) {
      return {
        resolvedText: 'ما هي السلع والمنتجات الراكدة بطيئة الحركة بالمخزن؟',
        forceIntent: 'SLOW_MOVING_PRODUCTS',
        categoryName: 'البضائع الراكدة'
      };
    }
    if (optionNumber === 4) {
      return {
        resolvedText: 'ما هي المنتجات القريبة من تاريخ انتهاء الصلاحية؟',
        forceIntent: 'EXPIRING_PRODUCTS',
        categoryName: 'تاريخ انتهاء الصلاحية'
      };
    }
  }

  // 5. Generic Line Parser for any response containing numbered list lines
  const lines = lastContent.split('\n');
  const matchingLine = lines.find(l => 
    l.includes(`${optionNumber}️⃣`) || 
    l.includes(`${optionNumber}.`) || 
    l.includes(`${optionNumber}-`) || 
    l.includes(`${optionNumber} )`) ||
    l.includes(`${optionNumber})`)
  );

  if (matchingLine) {
    const cleanedText = matchingLine.replace(/^[1-5١-٥1️⃣2️⃣3️⃣4️⃣5️⃣.\-\)\s:]+/, '').trim();
    if (cleanedText.length > 3) {
      return {
        resolvedText: cleanedText,
        categoryName: `الخيار ${optionNumber}`
      };
    }
  }

  return null;
}
