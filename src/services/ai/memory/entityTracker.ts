import { Entity, NLUResult } from '../types';
import { ActiveEntityState } from './types';

const FOLLOW_UP_PRONOUN_REGEX = /(له|عليه|منه|إليه|حسابه|فواتيره|مبيعاته|تسديداته|ديونه|بضاعته|تفاصيله|تفاصيلها|فيها|السابقة|الماضي|المتبقي|الباقي|نفسه|الأخير|الاخير)/i;
const DRILLDOWN_KEYWORDS = /(وضح|اشرح|التفاصيل|تفاصيل|بالتفصيل|طريقة الحساب|كيف تم حساب|كيف حسبت|ما هي الاصناف|ما هي البضائع|ما هي الفواتير|زيد وضح|بين لي|كيف طلعت|توضيح)/i;
const ANALYTICAL_KEYWORDS = /(اكثر|اعلى|افضل|اقل|تحليل|ما هي|كيف|توقعات|كم)/i;

const CUSTOMER_TOPIC_REGEX = /(زبون|عميل|الزبائن|العملاء|دين|ديون|آجل|اجل|زبائني|عملاء)/i;
const SUPPLIER_TOPIC_REGEX = /(مورد|موردين|شركة|شركات|موزع|تاجر|مستحقات|سددنا|مشتريات)/i;
const PRODUCT_TOPIC_REGEX = /(صنف|منتج|بضاعة|مخزون|سعر|كرتون|حبة|كيلو|كمية|نواقص)/i;
const INVOICE_TOPIC_REGEX = /(فاتورة|فاتوره|سند|فواتير)/i;
const SALES_TOPIC_REGEX = /(مبيعات|بيع|إيراد|ايراد|دخل)/i;
const PROFIT_TOPIC_REGEX = /(أرباح|ارباح|ربح|صافي|تكلفة)/i;
const LARGEST_SALE_REGEX = /(اكثر|اعلى|اكبر|اضخم)\s+(عملية|عمليات|فاتورة|فواتير|بيعة|بيعات|مبيعة|مبيعات|صفقة|صفقات)\s*(بيع|مبيعات|البيع|كانت)?/i;

/**
 * Extracts topic domain from raw text or intent.
 */
export function detectTopic(text: string, intentName: string): ActiveEntityState['lastTopic'] {
  if (LARGEST_SALE_REGEX.test(text) || intentName === 'LARGEST_SALE_QUERY') return 'LARGEST_SALE';
  if (CUSTOMER_TOPIC_REGEX.test(text) || intentName.includes('CUSTOMER')) return 'DEBT';
  if (SUPPLIER_TOPIC_REGEX.test(text) || intentName.includes('SUPPLIER')) return 'SUPPLIER';
  if (PRODUCT_TOPIC_REGEX.test(text) || intentName.includes('INVENTORY') || intentName.includes('STOCK')) return 'INVENTORY';
  if (INVOICE_TOPIC_REGEX.test(text) || intentName.includes('INVOICE')) return 'INVOICE';
  if (PROFIT_TOPIC_REGEX.test(text) || intentName.includes('PROFIT')) return 'PROFIT';
  if (SALES_TOPIC_REGEX.test(text) || intentName.includes('SALES')) return 'SALES';
  if (intentName.includes('EXPENSE') || intentName.includes('CASH')) return 'EXPENSE';
  if (intentName.includes('REPORT')) return 'FINANCIAL_REPORT';
  return 'GENERAL';
}

/**
 * Determines whether a query is a continuation/follow-up to previous turn.
 */
export function isFollowUpQuery(text: string, currentEntities: Entity[], previousState?: ActiveEntityState): boolean {
  if (!previousState || (!previousState.lastIntent && !previousState.targetName && !previousState.lastTopic)) return false;

  // 1. Explicit request for drilldown/clarification/details of previous result
  if (DRILLDOWN_KEYWORDS.test(text)) return true;

  // 2. If query contains explicit pronoun references ("له", "حسابه", "فيها", "تفاصيلها", "المتبقي")
  if (FOLLOW_UP_PRONOUN_REGEX.test(text)) return true;

  // 3. If query starts with conjunctions ("وكم", "وماذا عن", "وما هو", "كذلك") and lacks explicit new name
  const startsWithConjunction = /^(و|وما|وكم|وهل|وكذلك|ايضا|أيضاً|فما)\b/i.test(text.trim());
  const hasExplicitName = currentEntities.some(e => e.type === 'TARGET_NAME' || e.type === 'CUSTOMER' || e.type === 'SUPPLIER' || e.type === 'PRODUCT');

  if (startsWithConjunction && !hasExplicitName) return true;

  // 4. Short queries without explicit entity or date-only follow-ups (e.g. "والأمس؟", "وهذا الشهر؟", "وكم ربحنا منه؟")
  if (text.split(/\s+/).length <= 5 && !LARGEST_SALE_REGEX.test(text)) {
    if (previousState.targetName || previousState.lastTopic || previousState.lastIntent || previousState.dateRange || previousState.lastProducts) {
      return true;
    }
  }

  return false;
}

const PLURAL_WORDS = new Set([
  'عميل', 'عملاء', 'العملاء', 'زبون', 'زبائن', 'الزبائن', 'زباين', 'مورد', 'موردين', 'الموردين',
  'شركة', 'شركات', 'الشركات', 'منتج', 'منتجات', 'المنتجات', 'صنف', 'اصناف', 'الاصناف',
  'بضاعه', 'البضاعه', 'مبيعات', 'ارباح', 'مصروفات', 'مصاريف', 'مخزون', 'المخزن', 'فواتير',
  'الكل', 'الجميع', 'الناس', 'شغل', 'محل', 'متجر', 'صندوق', 'درج', 'كاش', 'دين', 'ديون'
]);

export function isTextGenericPlural(text: string): boolean {
  const cleaned = text.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
  const words = cleaned.split(/\s+/);
  return words.some(w => PLURAL_WORDS.has(w) || PLURAL_WORDS.has(w.replace(/^ال/, '')) || w === 'كل' || w === 'جميع');
}

/**
 * Updates active entity context with new query entities and inherits context for follow-up queries.
 */
export function processEntityInheritance(
  rawText: string,
  nluResult: NLUResult,
  previousState?: ActiveEntityState
): { updatedState: ActiveEntityState; inheritedEntities: Entity[]; isFollowUp: boolean } {
  const inheritedEntities: Entity[] = [];
  const currentEntities = nluResult.entities;
  const currentTopic = detectTopic(rawText, nluResult.intent.name);

  const explicitNameEntity = currentEntities.find(
    e => e.type === 'TARGET_NAME' || e.type === 'CUSTOMER' || e.type === 'SUPPLIER' || e.type === 'PRODUCT'
  );
  const explicitDateEntity = currentEntities.find(e => e.type === 'DATE_RANGE');
  const explicitInvoiceEntity = currentEntities.find(e => e.type === 'INVOICE_ID');
  const explicitExpenseEntity = currentEntities.find(e => e.type === 'EXPENSE_TYPE');

  let targetName = explicitNameEntity ? explicitNameEntity.value : undefined;
  let targetType: ActiveEntityState['targetType'] = undefined;

  if (explicitNameEntity) {
    if (explicitNameEntity.type === 'CUSTOMER' || CUSTOMER_TOPIC_REGEX.test(rawText)) targetType = 'CUSTOMER';
    else if (explicitNameEntity.type === 'SUPPLIER' || SUPPLIER_TOPIC_REGEX.test(rawText)) targetType = 'SUPPLIER';
    else if (explicitNameEntity.type === 'PRODUCT' || PRODUCT_TOPIC_REGEX.test(rawText)) targetType = 'PRODUCT';
    else targetType = 'UNKNOWN';
  }

  const isFollowUp = isFollowUpQuery(rawText, currentEntities, previousState) && !isTextGenericPlural(rawText);

  // Inherit targetName if follow-up and missing explicit name
  if (!targetName && isFollowUp) {
    if (previousState?.targetName) {
      // Check for topic conflict (e.g. was CUSTOMER, now user explicitly asked about SUPPLIER without name)
      const topicConflict =
        (previousState.targetType === 'CUSTOMER' && SUPPLIER_TOPIC_REGEX.test(rawText) && !CUSTOMER_TOPIC_REGEX.test(rawText)) ||
        (previousState.targetType === 'SUPPLIER' && CUSTOMER_TOPIC_REGEX.test(rawText) && !SUPPLIER_TOPIC_REGEX.test(rawText));

      if (!topicConflict) {
        targetName = previousState.targetName;
        targetType = previousState.targetType;

        inheritedEntities.push({
          type: 'TARGET_NAME',
          value: targetName,
          confidence: 0.85,
        });

        if (!nluResult.entities.some(e => e.type === 'TARGET_NAME')) {
          nluResult.entities.push({
            type: 'TARGET_NAME',
            value: targetName,
            confidence: 0.85,
          });
        }
      }
    } else if (previousState?.lastProducts && previousState.lastProducts.length > 0 && /(منه|ربحنا منه|بعنا منه|عنه)/i.test(rawText)) {
      // Inherit top product from previous turn (e.g. "ومن أكثر منتج باع؟" -> "وكم ربحنا منه؟")
      targetName = previousState.lastProducts[0].name;
      targetType = 'PRODUCT';

      inheritedEntities.push({
        type: 'TARGET_NAME',
        value: targetName,
        confidence: 0.9,
      });
      inheritedEntities.push({
        type: 'PRODUCT',
        value: targetName,
        confidence: 0.9,
      });

      if (!nluResult.entities.some(e => e.type === 'TARGET_NAME')) {
        nluResult.entities.push({
          type: 'TARGET_NAME',
          value: targetName,
          confidence: 0.9,
        });
      }
      if (!nluResult.entities.some(e => e.type === 'PRODUCT')) {
        nluResult.entities.push({
          type: 'PRODUCT',
          value: targetName,
          confidence: 0.9,
        });
      }
    }
  }

  // If query is just a date follow-up (e.g. "والأمس؟", "وهذا الشهر؟") and intent is generic, carry over previous intent
  if (isFollowUp && explicitDateEntity && (!nluResult.intent.name || nluResult.intent.name === 'UNKNOWN' || nluResult.intent.name === 'SALES_QUERY') && previousState?.lastIntent) {
    if (['SALES_SUMMARY', 'PROFIT_SUMMARY', 'EXPENSES_SUMMARY', 'FINANCIAL_REPORT', 'TOP_SELLING_PRODUCTS'].includes(previousState.lastIntent)) {
      nluResult.intent.name = previousState.lastIntent;
    }
  }

  // Inherit dateRange if missing in current turn
  let dateRange = explicitDateEntity ? (explicitDateEntity.value as string) : undefined;
  if (!dateRange && isFollowUp && previousState?.dateRange) {
    dateRange = previousState.dateRange;
    inheritedEntities.push({
      type: 'DATE_RANGE',
      value: dateRange,
      confidence: 0.8,
    });
    if (!nluResult.entities.some(e => e.type === 'DATE_RANGE')) {
      nluResult.entities.push({
        type: 'DATE_RANGE',
        value: dateRange,
        confidence: 0.8,
      });
    }
  }

  // Inherit invoiceId if missing in current turn
  let invoiceId = explicitInvoiceEntity ? explicitInvoiceEntity.value : undefined;
  if (!invoiceId && isFollowUp && previousState?.invoiceId) {
    invoiceId = previousState.invoiceId;
    inheritedEntities.push({
      type: 'INVOICE_ID',
      value: invoiceId,
      confidence: 0.85,
    });
    if (!nluResult.entities.some(e => e.type === 'INVOICE_ID')) {
      nluResult.entities.push({
        type: 'INVOICE_ID',
        value: invoiceId,
        confidence: 0.85,
      });
    }
  }

  const updatedState: ActiveEntityState = {
    targetName: targetName || (isFollowUp ? previousState?.targetName : undefined),
    targetType: targetType || (isFollowUp ? previousState?.targetType : undefined),
    dateRange: dateRange || (isFollowUp ? previousState?.dateRange : undefined),
    invoiceId: invoiceId || (isFollowUp ? previousState?.invoiceId : undefined),
    expenseType: explicitExpenseEntity ? explicitExpenseEntity.value : (isFollowUp ? previousState?.expenseType : undefined),
    lastIntent: nluResult.intent.name !== 'DRILLDOWN_EXPLANATION' ? nluResult.intent.name : (previousState?.lastIntent || nluResult.intent.name),
    lastTopic: currentTopic !== 'GENERAL' ? currentTopic : (previousState?.lastTopic || 'GENERAL'),
    lastEvidenceData: previousState?.lastEvidenceData,
    lastToolName: previousState?.lastToolName,
    lastUserQuery: previousState?.lastUserQuery,
    lastAssistantAnswer: previousState?.lastAssistantAnswer,
    lastInvoices: previousState?.lastInvoices,
    lastProducts: previousState?.lastProducts,
    lastLargestSale: previousState?.lastLargestSale,
    explanationContext: isFollowUp ? (previousState?.lastAssistantAnswer || previousState?.explanationContext) : undefined,
    updatedAt: Date.now(),
  };

  return {
    updatedState,
    inheritedEntities,
    isFollowUp,
  };
}
