import { Entity } from '../types';

/**
 * Enhanced Entity Extractor with deep date, time, week, day, verification, product, and financial entity parsing.
 */
export function extractEntities(
  normalizedText: string,
  synonymResolvedText: string,
  rawText = ''
): Entity[] {
  const entities: Entity[] = [];
  const textCombined = `${rawText} ${normalizedText} ${synonymResolvedText}`;

  // 1. Interrogative / Verification Intent Flag (هل تم / هل حدث / هل اشتري / هل في...)
  const isVerification = /(?:^|\s)(هل|هل تم|هل في|هل حدث|هل حصل|هل يوجد|هل هناك|هل بعنا|هل اشتري|هل دفع|هل سدد|هل سجل|هل نطلب|هل يطلبنا|هل فيه|هل مبيعات|هل به|هل يوجد)\b/i.test(
    rawText || normalizedText
  );
  if (isVerification) {
    entities.push({
      type: 'IS_VERIFICATION',
      value: 'true',
      confidence: 0.98,
    });
  }

  // 2. Comprehensive Date Extraction

  let extractedDate: string | null = null;

  // 2.0 Date Interval Extraction (e.g. "من 2026-08-01 الى 2026-08-15" or "من 1/8/2026 إلى 15/8/2026" or "من بداية الشهر الى اليوم")
  const betweenIsoMatch = (rawText || normalizedText).match(/من\s+(?:تاريخ\s+)?(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|بداية الشهر|بداية السنة)\s+(?:الى|إلى|حتى|و)\s+(?:تاريخ\s+)?(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|اليوم)/i);
  if (betweenIsoMatch) {
    const parsePart = (p: string) => {
      if (/بداية الشهر/i.test(p)) return 'START_OF_MONTH';
      if (/بداية السنة/i.test(p)) return 'START_OF_YEAR';
      if (/اليوم/i.test(p)) return 'TODAY';
      const parts = p.split(/[-/.]/).map(Number);
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
        } else {
          const y = parts[2] < 100 ? 2000 + parts[2] : parts[2];
          return `${y}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
        }
      }
      return p;
    };
    const startStr = parsePart(betweenIsoMatch[1]);
    const endStr = parsePart(betweenIsoMatch[2]);
    extractedDate = `DATE_BETWEEN:${startStr}:${endStr}`;
  }

  // 2.1 Check for ISO or numeric single dates: YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY
  if (!extractedDate) {
    const isoMatch = rawText.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
      const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
      extractedDate = `EXACT_DATE:${y}-${m}-${d}`;
    }
  }

  if (!extractedDate) {
    const ddmmyyyyMatch = rawText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
    if (ddmmyyyyMatch) {
      const d = String(parseInt(ddmmyyyyMatch[1], 10)).padStart(2, '0');
      const m = String(parseInt(ddmmyyyyMatch[2], 10)).padStart(2, '0');
      const y = parseInt(ddmmyyyyMatch[3], 10);
      extractedDate = `EXACT_DATE:${y}-${m}-${d}`;
    }
  }

  // Regex 3: Phrases like "تاريخ 10-5-2024" or "في تاريخ 10/5" or "يوم 15-6"
  if (!extractedDate) {
    const prefixedDateMatch = rawText.match(/(?:تاريخ|في تاريخ|يوم|بتاريخ)\s*(\d{1,2})[-/.](\d{1,2})(?:[-/.](20\d{2}))?/i);
    if (prefixedDateMatch) {
      const d = String(parseInt(prefixedDateMatch[1], 10)).padStart(2, '0');
      const m = String(parseInt(prefixedDateMatch[2], 10)).padStart(2, '0');
      const y = prefixedDateMatch[3] ? parseInt(prefixedDateMatch[3], 10) : new Date().getFullYear();
      extractedDate = `EXACT_DATE:${y}-${m}-${d}`;
    }
  }

  // Regex 4: Space-separated normalized date (e.g., "2024 05 10" or "10 05 2024")
  if (!extractedDate) {
    const spaceIsoMatch = normalizedText.match(/\b(20\d{2})\s+(\d{1,2})\s+(\d{1,2})\b/);
    if (spaceIsoMatch) {
      const y = parseInt(spaceIsoMatch[1], 10);
      const m = String(parseInt(spaceIsoMatch[2], 10)).padStart(2, '0');
      const d = String(parseInt(spaceIsoMatch[3], 10)).padStart(2, '0');
      extractedDate = `EXACT_DATE:${y}-${m}-${d}`;
    }
  }

  // Regex 5: Arabic month names with day and optional year (e.g. "10 مايو 2024" or "15 يناير")
  if (!extractedDate) {
    const arabicMonths: Record<string, number> = {
      'يناير': 1, 'فبراير': 2, 'مارس': 3, 'ابريل': 4, 'مايو': 5, 'يونيو': 6,
      'يوليو': 7, 'اغسطس': 8, 'سبتمبر': 9, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
      'كانون الثاني': 1, 'شباط': 2, 'اذار': 3, 'نيسان': 4, 'ايار': 5, 'حزيران': 6,
      'تموز': 7, 'اب': 8, 'ايلول': 9, 'تشرين الاول': 10, 'تشرين الثاني': 11, 'كانون الاول': 12
    };

    for (const [mName, mIndex] of Object.entries(arabicMonths)) {
      const mRegex = new RegExp(`(?:في\\s+|يوم\\s+|تاريخ\\s+)?(\\d{1,2})\\s+${mName}(?:\\s+(20\\d{2}))?`, 'i');
      const mMatch = normalizedText.match(mRegex) || rawText.match(mRegex);
      if (mMatch) {
        const d = String(parseInt(mMatch[1], 10)).padStart(2, '0');
        const m = String(mIndex).padStart(2, '0');
        const y = mMatch[2] ? parseInt(mMatch[2], 10) : new Date().getFullYear();
        extractedDate = `EXACT_DATE:${y}-${m}-${d}`;
        break;
      }
    }
  }

  // 2.2 Month-Only Extraction (e.g., "شهر 8" or "شهر اغسطس 2026" or "شهر 5 سنة 2026")
  if (!extractedDate) {
    const monthNumMatch = (rawText || normalizedText).match(/شهر\s+(\d{1,2})(?:\s+(?:سنة|عام|لسنة)?\s*(20\d{2}))?/i);
    if (monthNumMatch) {
      const m = String(parseInt(monthNumMatch[1], 10)).padStart(2, '0');
      const y = monthNumMatch[2] ? parseInt(monthNumMatch[2], 10) : new Date().getFullYear();
      extractedDate = `MONTH:${y}-${m}`;
    }
  }

  if (extractedDate) {
    entities.push({
      type: 'DATE_RANGE',
      value: extractedDate,
      confidence: 0.98,
    });
  } else {
    // 2.3 Quarter Extraction (الربع الاول / الثاني / الثالث / الرابع)
    if (/(الربع الاول|الربع 1|Q1)/i.test(normalizedText)) {
      entities.push({ type: 'DATE_RANGE', value: 'QUARTER_1', confidence: 0.95 });
    } else if (/(الربع الثاني|الربع 2|Q2)/i.test(normalizedText)) {
      entities.push({ type: 'DATE_RANGE', value: 'QUARTER_2', confidence: 0.95 });
    } else if (/(الربع الثالث|الربع 3|Q3)/i.test(normalizedText)) {
      entities.push({ type: 'DATE_RANGE', value: 'QUARTER_3', confidence: 0.95 });
    } else if (/(الربع الرابع|الربع 4|Q4)/i.test(normalizedText)) {
      entities.push({ type: 'DATE_RANGE', value: 'QUARTER_4', confidence: 0.95 });
    }
    // 2.4 Custom N Days / Weeks / Months (اخر 5 ايام / اخر اسبوعين / اخر 3 اشهر)
    else if (/(اخر|خلال)\s+(\d+)\s*(يوم|ايام|أيام)/i.test(normalizedText)) {
      const match = normalizedText.match(/(اخر|خلال)\s+(\d+)\s*(يوم|ايام|أيام)/i);
      if (match && match[2]) {
        entities.push({ type: 'DATE_RANGE', value: `LAST_N_DAYS:${match[2]}`, confidence: 0.95 });
      }
    } else if (/(اخر|خلال)\s+اسبوعين/i.test(normalizedText)) {
      entities.push({ type: 'DATE_RANGE', value: 'LAST_N_DAYS:14', confidence: 0.95 });
    } else if (/(اخر|خلال)\s+ثلاثة?\s+اشهر/i.test(normalizedText)) {
      entities.push({ type: 'DATE_RANGE', value: 'LAST_N_DAYS:90', confidence: 0.95 });
    }
    // 2.5 Specific Week Extraction (الاسبوع الاول / الثاني / الثالث / الرابع / الاخير)
    else {
      const isLastMonth = /(الشهر الماضي|الشهر السابق|الشهر المنصرم)/i.test(textCombined);
      const lastMonthSuffix = isLastMonth ? '_LAST_MONTH' : '';

      if (/(الاسبوع الاول|اول اسبوع|الاسبوع رقم 1|اسبوع 1)/i.test(normalizedText)) {
        entities.push({ type: 'DATE_RANGE', value: `WEEK_1${lastMonthSuffix}`, confidence: 0.95 });
      } else if (/(الاسبوع الثاني|ثاني اسبوع|الاسبوع رقم 2|اسبوع 2)/i.test(normalizedText)) {
        entities.push({ type: 'DATE_RANGE', value: `WEEK_2${lastMonthSuffix}`, confidence: 0.95 });
      } else if (/(الاسبوع الثالث|ثالث اسبوع|الاسبوع رقم 3|اسبوع 3)/i.test(normalizedText)) {
        entities.push({ type: 'DATE_RANGE', value: `WEEK_3${lastMonthSuffix}`, confidence: 0.95 });
      } else if (/(الاسبوع الرابع|رابع اسبوع|الاسبوع رقم 4|اسبوع 4)/i.test(normalizedText)) {
        entities.push({ type: 'DATE_RANGE', value: `WEEK_4${lastMonthSuffix}`, confidence: 0.95 });
      } else if (/(الاسبوع الخامس|اخر اسبوع|الاسبوع الاخير)/i.test(normalizedText)) {
        entities.push({ type: 'DATE_RANGE', value: `WEEK_5${lastMonthSuffix}`, confidence: 0.95 });
      }
      // 2.6 Specific Day of Week Extraction
      else if (/(السبت|يوم السبت)/i.test(normalizedText)) {
        const isLast = /(الماضي|السابق|الفائت|اللي فات)/i.test(normalizedText);
        entities.push({ type: 'DATE_RANGE', value: isLast ? 'DAY_SATURDAY_LAST_WEEK' : 'DAY_SATURDAY', confidence: 0.92 });
      } else if (/(الاحد|يوم الاحد)/i.test(normalizedText)) {
        const isLast = /(الماضي|السابق|الفائت|اللي فات)/i.test(normalizedText);
        entities.push({ type: 'DATE_RANGE', value: isLast ? 'DAY_SUNDAY_LAST_WEEK' : 'DAY_SUNDAY', confidence: 0.92 });
      } else if (/(الاثنين|يوم الاثنين)/i.test(normalizedText)) {
        const isLast = /(الماضي|السابق|الفائت|اللي فات)/i.test(normalizedText);
        entities.push({ type: 'DATE_RANGE', value: isLast ? 'DAY_MONDAY_LAST_WEEK' : 'DAY_MONDAY', confidence: 0.92 });
      } else if (/(الثلاثاء|يوم الثلاثاء)/i.test(normalizedText)) {
        const isLast = /(الماضي|السابق|الفائت|اللي فات)/i.test(normalizedText);
        entities.push({ type: 'DATE_RANGE', value: isLast ? 'DAY_TUESDAY_LAST_WEEK' : 'DAY_TUESDAY', confidence: 0.92 });
      } else if (/(الاربعاء|يوم الاربعاء)/i.test(normalizedText)) {
        const isLast = /(الماضي|السابق|الفائت|اللي فات)/i.test(normalizedText);
        entities.push({ type: 'DATE_RANGE', value: isLast ? 'DAY_WEDNESDAY_LAST_WEEK' : 'DAY_WEDNESDAY', confidence: 0.92 });
      } else if (/(الخميس|يوم الخميس)/i.test(normalizedText)) {
        const isLast = /(الماضي|السابق|الفائت|اللي فات)/i.test(normalizedText);
        entities.push({ type: 'DATE_RANGE', value: isLast ? 'DAY_THURSDAY_LAST_WEEK' : 'DAY_THURSDAY', confidence: 0.92 });
      } else if (/(الجمعه|يوم الجمعه)/i.test(normalizedText)) {
        const isLast = /(الماضي|السابق|الفائت|اللي فات)/i.test(normalizedText);
        entities.push({ type: 'DATE_RANGE', value: isLast ? 'DAY_FRIDAY_LAST_WEEK' : 'DAY_FRIDAY', confidence: 0.92 });
      }
      // 2.7 Relative Ranges
      else if (/(اليوم|النهارده|اليوميه|الليله)/i.test(textCombined)) {
        entities.push({ type: 'DATE_RANGE', value: 'TODAY', confidence: 0.95 });
      } else if (/(الامس|امس|امسيه|البارحه|البارح|امبارح)/i.test(textCombined)) {
        entities.push({ type: 'DATE_RANGE', value: 'YESTERDAY', confidence: 0.95 });
      } else if (
        /(هذا الاسبوع|الاسبوع الحالي|خلال اسبوع|اخر 7 ايام)/i.test(textCombined)
      ) {
        entities.push({ type: 'DATE_RANGE', value: 'THIS_WEEK', confidence: 0.9 });
      } else if (
        /(الاسبوع الماضي|الاسبوع السابق|الاسبوع الفائت|الاسبوع اللي فات)/i.test(textCombined)
      ) {
        entities.push({ type: 'DATE_RANGE', value: 'LAST_WEEK', confidence: 0.9 });
      } else if (
        /(هذا الشهر|هالشهر|الشهر الحالي|طول الشهر|اخر 30 يوم)/i.test(textCombined)
      ) {
        entities.push({ type: 'DATE_RANGE', value: 'THIS_MONTH', confidence: 0.9 });
      } else if (
        /(الشهر الماضي|الشهر السابق|الشهر المنصرم|الشهر اللي فات)/i.test(textCombined)
      ) {
        entities.push({ type: 'DATE_RANGE', value: 'LAST_MONTH', confidence: 0.9 });
      } else if (
        /(هذه السنه|هالسنه|السنه الحاليه|العام الحالي)/i.test(textCombined)
      ) {
        entities.push({ type: 'DATE_RANGE', value: 'THIS_YEAR', confidence: 0.9 });
      } else if (
        /(السنه الماضيه|العام الماضي|العام المنصرم|السنه اللي فاتت)/i.test(textCombined)
      ) {
        entities.push({ type: 'DATE_RANGE', value: 'LAST_YEAR', confidence: 0.9 });
      }
    }
  }

  // 3. Payment Method Entity Extraction
  if (/(كاش|نقدا|نقدي|صندوق|درج)/i.test(normalizedText)) {
    entities.push({ type: 'PAYMENT_METHOD', value: 'CASH', confidence: 0.9 });
  } else if (/(شبكه|مدي|فيزا|ماستر|بطاقه|الكتروني|سداد)/i.test(normalizedText)) {
    entities.push({ type: 'PAYMENT_METHOD', value: 'CARD', confidence: 0.9 });
  } else if (/(اجل|اجل|تقسيط|دين|ذمه|عل[ىي] الحساب)/i.test(normalizedText)) {
    entities.push({ type: 'PAYMENT_METHOD', value: 'CREDIT', confidence: 0.9 });
  }

  // 4. Numeric Limit & Threshold Extraction (e.g. اعل[ىي] 5 منتجات / اكثر من 500 ريال)
  const limitMatch = normalizedText.match(/(اعل[ىي]|اكثر|افضل|اقل|اول|اكبر)\s+(\d+)/i);
  if (limitMatch && limitMatch[2]) {
    entities.push({
      type: 'LIMIT',
      value: limitMatch[2],
      confidence: 0.9,
    });
  }

  const thresholdMatch = normalizedText.match(/(تتجاوز|تعدت|اكثر من|اكبر من|اعل[ىي] من|فوق)\s+(\d+)/i);
  if (thresholdMatch && thresholdMatch[2]) {
    entities.push({
      type: 'THRESHOLD',
      value: thresholdMatch[2],
      confidence: 0.9,
    });
  }

  // 5. Target Name Extraction (Customer / Supplier / Product / Category candidate)
  const namePatterns = [
    // Product-specific patterns with dates or quantities
    // E.g. "كم مبيعات عصير المراعي في تاريخ 2024-05-10", "كم بعنا من رز الشعلان الاسبوع الاول", "هل تم بيع حليب نيدو في يوم كذا"
    /(?:كم مبيعات|مبيعات|كم بعنا من|بعنا من|هل تم بيع|هل بعنا|بيع من|كم بيع من|صنف|منتج|بضاعه|سعر|كميه)\s+(?:المنتج|الصنف|بضاعه)?\s*([أ-يأإآءئؤ\d]{2,}(?:\s+[أ-يأإآءئؤ\d]{2,}){0,3})(?=\s+(?:في|بتاريخ|تاريخ|يوم|الاسبوع|هذا|الشهر|امس|اليوم|$))/i,
    // E.g. "كم مبيعات عصير المراعي", "سعر حليب نيدو", "كم باقي من سكر الاسره"
    /(?:مبيعات|كم سعر|سعر صنف|سعر منتج|سعر|كميه|بضاعه|بكم سعر|بكم|كم باقي من|كميه صنف|كميه منتج|حركه بيع)\s+(?:المنتج|الصنف|بضاعه)?\s*([أ-يأإآءئؤ\d]{2,}(?:\s+[أ-يأإآءئؤ\d]{2,}){0,3})/i,
    // Customer/Supplier patterns with amount/balance/debt phrases
    // E.g. "كم المبلغ الذي تم تسديده للمورد المراعي", "كم سددنا للمورد نادك", "كم دفعنا لشركه بيبسي"
    /(?:كم\s+)?(?:المبلغ\s+)?(?:الذي\s+تم\s+|اللي\s+تم\s+)?(?:تسديده|سداده|دفعه|صرفه|تحويله|عطيناه|تحصيله|قبضه|استلامه)\s+(?:للمورد|المورد|للشركه|الشركه|لشركه|للتاجر|لـ|من\s+العميل|من\s+الزبون|من)?\s*([أ-يأإآءئؤ\d]{2,}(?:\s+[أ-يأإآءئؤ\d]{2,}){0,2})(?=\s+(?:في|بتاريخ|تاريخ|يوم|الاسبوع|هذا|الشهر|امس|اليوم|$))/i,
    /(?:كم\s+)?(?:سددنا|دفعنا|صرفنا|حولنا|عطينا|سدد\s+لنا|دفع\s+لنا|قبضنا\s+من|حصلنا\s+من)\s+(?:للمورد|المورد|للشركه|الشركه|لشركه|للتاجر|العميل|الزبون|لـ)?\s*([أ-يأإآءئؤ\d]{2,}(?:\s+[أ-يأإآءئؤ\d]{2,}){0,2})/i,
// E.g. "كم المبلغ الذي عند العميل رائد", "كم المبلغ اللي عل[ىي] محمد", "كم الفلوس اللي عند خالد", "كم الزلط عند سعيد"
    /(?:كم\s+)?(?:المبلغ|الفلوس|الزلط|البيس|الدين|الرصيد|الحساب)\s+(?:الذي|اللي|المتبقي|المستحق)?\s*(?:عند|عل[ىي]|ل|من)\s+(?:الزبون|العميل|المشتري|المورد|الشركه)?\s*([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,}){0,2})/i,
    // "باقي عل[ىي] محمد توفيق كم"
    /(?:باقي عل[ىي]|كم باقي عل[ىي])\s+([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,}){0,2})\s+كم/i,
    // E.g. "معلومات العميل احمد", "كم عند الزبون محمد", "كم عل[ىي] فهد", "كم باقي عل[ىي] عل[ىي]", "كم نطلب فهد", "كم علينا لشركه المراعي"
    /(?:معلومات|بيانات|كشف|كشف حساب|حساب|ديون|دين|رصيد|عن|عل[ىي]|عند|لنا عند|نطلب|نطلبه|يطلبنا|يطلبونا|باقي ل|المتبقي عل[ىي]|المستحق عل[ىي]|دفتر|ملف|هل اشتري|هل سدد|كم علينا ل|علينا ل|كم للمورد|للمورد)\s+(?:الزبون|العميل|الزبائن|العملاء|المشتري|شركه|لشركه)?\s*([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,}){0,2})/i,
    // E.g. "الزبون محمد", "العميل فهد عل[ىي]"
    /(?:الزبون|العميل|المشتري)\s+([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,}){0,2})/i,
    // E.g. "احمد كم عل[ىي]ه؟", "محمد ايش حسابه؟", "خالد كم باقي له؟"
    /([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,}){0,2})\s+(?:عل[ىي]ه|له|عنده|حسابه|ديونه|فلوسه|حقنا|نطلبه|يطلبنا|كم عل[ىي]ه|كم حسابه|كم دينه)\b/i,
    // E.g. "المورد المراعي", "شركه نادك", "مؤسسه الامل", "الموزع بيبسي"
    /(?:المورد|شركه|مؤسسه|مورد|تاجر|موزع|مندوب|شركات التوريد)\s+([أ-يأإآءئؤ]{2,}(?:\s+[أ-يأإآءئؤ]{2,}){0,2})/i,
  ];

  const genericStopWords = [
    'اليوم', 'الشهر', 'السنه', 'الماضي', 'المبيعات', 'الارباح', 'المصارف', 'المصاريف',
    'ديون', 'عميل', 'عملاء', 'العملاء', 'زبون', 'زبائن', 'الزبائن', 'زباين',
    'مورد', 'موردين', 'الموردين', 'شركه', 'شركات', 'الشركات', 'منتج', 'منتجات', 'المنتجات',
    'صنف', 'اصناف', 'الاصناف', 'بضاعه', 'البضاعه', 'مبيعات', 'ارباح', 'مصروفات', 'مصاريف',
    'مخزون', 'المخزن', 'فواتير', 'الفواتير', 'ملاحظات', 'التذكيرات', 'تذكيرات',
    'الكل', 'الجميع', 'الناس', 'شغل', 'محل', 'متجر', 'صندوق', 'درج', 'كاش', 'خزينه',
    'دين', 'رصيد', 'كم', 'هناك', 'عنده', 'عند', 'من', 'ما', 'مين', 'الي', 'اللي', 'عندنا', 'علينا', 'لنا',
    'شنو', 'ايش', 'قد', 'بعنا', 'دخلنا', 'حقنا', 'فلوسنا', 'كشف', 'حساب', 'معلومات', 'بيانات', 'تقرير', 'ملخص',
    'كميه', 'سعر', 'فلوس', 'زلط', 'بيس', 'دفتر', 'الاسبوع', 'الاول', 'الثاني', 'الثالث', 'الرابع', 'الاخير',
    'السبت', 'الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعه', 'تاريخ', 'يوم',
    'اخر', 'أخر', 'خلال', 'منذ', 'حتى', 'إلى', 'من', 'الربع', 'شهر', 'اشهر', 'ايام', 'أيام', 'يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو',
    'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر',
    'عمليه', 'العمليه', 'فاتوره', 'الفاتوره', 'بيعه', 'البيعه', 'صفقه', 'الصفقه', 'مبيعه', 'المبيعه',
    'اكثر', 'اعلي', 'اكبر', 'اقل', 'اضخم', 'افضل', 'احسن', 'توضيح', 'التوضيح', 'تفاصيل', 'التفاصيل',
    'شرح', 'الشرح', 'طريقه', 'الحساب', 'طريقه الحساب', 'كانت', 'صار', 'حصل',
    'النظام', 'نظام', 'التطبيق', 'تطبيق', 'البرنامج', 'برنامج', 'اصدار', 'الاصدار', 'نسخه', 'النسخه',
    'حاله', 'الحاله', 'الوكيل', 'المستشار', 'المتجر', 'المحل', 'المؤسسه', 'الشركه'
  ];

  // Bypass name extraction if query is clearly asking about system info
  const isSystemQuery = /(معلومات|بيانات|حول|عن|اصدار|نسخه|حاله|شرح)\s+(النظام|التطبيق|البرنامج|الوكيل|المستشار|المحاسب)/i.test(normalizedText) ||
                        /معلومات\s+عن\s+(النظام|التطبيق|البرنامج)/i.test(normalizedText) ||
                        /(من\s+انت|من\s+انت|ما\s+هذا\s+النظام|ماهو\s+النظام|ما\s+هو\s+النظام)/i.test(normalizedText);

  if (!isSystemQuery) {
    for (const pattern of namePatterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        let extractedName = match[1].trim();
        // Clean leading articles or title words
        extractedName = extractedName.replace(/^(العميل|الزبون|المشتري|المورد|الشركه|مؤسسه|المنتج|الصنف)\s+/i, '').trim();

        const normExtracted = extractedName.replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه');
        
        const isStopWord = genericStopWords.some(sw => {
          const normSw = sw.replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه');
          return normExtracted === normSw || normExtracted.split(/\s+/).every(w => {
            const normW = w.replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه');
            return /^\d+$/.test(w) || 
              ['اخر', 'خلال', 'من', 'الى', 'حتى', 'منذ', 'بين', 'شهر', 'ايام', 'الربع'].includes(normW) ||
              genericStopWords.some(gsw => gsw.replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه') === normW);
          });
        });

        if (!isStopWord && extractedName.length >= 2) {
          entities.push({
            type: 'TARGET_NAME',
            value: extractedName,
            confidence: 0.9,
          });
          break;
        }
      }
    }
  }

  // 6. Short query entity fallback (e.g., "ومحمد؟", "فهد؟")
  if (!entities.some(e => e.type === 'TARGET_NAME' || e.type === 'CUSTOMER' || e.type === 'SUPPLIER')) {
    const cleanedText = normalizedText.replace(/[؟\?]/g, '').trim();
    const shortMatch = cleanedText.match(/^و?([أ-يأإآءئؤ]{3,}(?:\s+[أ-يأإآءئؤ]{2,})?)$/i);
    if (shortMatch && shortMatch[1]) {
       const candidate = shortMatch[1].trim();
       if (!genericStopWords.includes(candidate) && !/(اليوم|امس|اسبوع|شهر|سنه|البارحه)/i.test(candidate)) {
          entities.push({
            type: 'TARGET_NAME',
            value: candidate,
            confidence: 0.7,
          });
       }
    }
  }

  // 7. Categorize TARGET_NAME into specific entity types (CUSTOMER, SUPPLIER, PRODUCT, CATEGORY)
  const targetEntity = entities.find(e => e.type === 'TARGET_NAME');
  if (targetEntity) {
    const val = targetEntity.value;
    if (/(مورد|شركه|مؤسسه|تاجر|موزع|تسديد|تسديده|سداد|سددنا|دفعنا|صرفنا|صرف|سند صرف)/i.test(normalizedText)) {
      entities.push({ type: 'SUPPLIER', value: val, confidence: 0.92 });
    } else if (/(منتج|صنف|سعر|كميه|بضاعه|بعنا|مبيعات|حبه|كرتون|بكم|تكلفه)/i.test(normalizedText)) {
      entities.push({ type: 'PRODUCT', value: val, confidence: 0.92 });
    } else {
      entities.push({ type: 'CUSTOMER', value: val, confidence: 0.88 });
    }
  }

  return entities;
}

