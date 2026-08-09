import { Entity, NLUResult } from '../types';
import { ActiveEntityState } from './types';

const FOLLOW_UP_PRONOUN_REGEX = /(له|عليه|منه|إليه|حسابه|فواتيره|مبيعاته|تسديداته|ديونه|بضاعته|تفاصيله|السابقة|الماضي|المتبقي|الباقي|نفسه|الأخير|الاخير)/i;

const CUSTOMER_TOPIC_REGEX = /(زبون|عميل|الزبائن|العملاء|دين|ديون|آجل|اجل|زبائني|عملاء)/i;
const SUPPLIER_TOPIC_REGEX = /(مورد|موردين|شركة|شركات|موزع|تاجر|مستحقات|سددنا|مشتريات)/i;
const PRODUCT_TOPIC_REGEX = /(صنف|منتج|بضاعة|مخزون|سعر|كرتون|حبة|كيلو|كمية|نواقص)/i;
const INVOICE_TOPIC_REGEX = /(فاتورة|فاتوره|سند|فواتير)/i;
const SALES_TOPIC_REGEX = /(مبيعات|بيع|إيراد|ايراد|دخل)/i;
const PROFIT_TOPIC_REGEX = /(أرباح|ارباح|ربح|صافي|تكلفة)/i;

/**
 * Extracts topic domain from raw text or intent.
 */
export function detectTopic(text: string, intentName: string): ActiveEntityState['lastTopic'] {
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
  if (!previousState || !previousState.targetName) return false;

  // If query contains explicit pronoun references ("له", "حسابه", "المتبقي")
  if (FOLLOW_UP_PRONOUN_REGEX.test(text)) return true;

  // If query starts with conjunctions ("وكم", "وماذا عن", "وما هو", "كذلك") and lacks explicit name
  const startsWithConjunction = /^(و|وما|وكم|وهل|وكذلك|ايضا|أيضاً|فما)\b/i.test(text.trim());
  const hasExplicitName = currentEntities.some(e => e.type === 'TARGET_NAME' || e.type === 'CUSTOMER' || e.type === 'SUPPLIER' || e.type === 'PRODUCT');

  if (startsWithConjunction && !hasExplicitName) return true;

  // Short queries lacking entity ("كم المتبقي؟", "اعطني التفاصيل")
  if (text.split(' ').length <= 4 && !hasExplicitName) return true;

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
  if (!targetName && isFollowUp && previousState?.targetName) {
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

      // Also append inherited entity to NLU result so downstream tools process it seamlessly
      if (!nluResult.entities.some(e => e.type === 'TARGET_NAME')) {
        nluResult.entities.push({
          type: 'TARGET_NAME',
          value: targetName,
          confidence: 0.85,
        });
      }
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

  const updatedState: ActiveEntityState = {
    targetName: targetName || (isFollowUp ? previousState?.targetName : undefined),
    targetType: targetType || (isFollowUp ? previousState?.targetType : undefined),
    dateRange: dateRange || (isFollowUp ? previousState?.dateRange : undefined),
    invoiceId: explicitInvoiceEntity ? explicitInvoiceEntity.value : (isFollowUp ? previousState?.invoiceId : undefined),
    expenseType: explicitExpenseEntity ? explicitExpenseEntity.value : (isFollowUp ? previousState?.expenseType : undefined),
    lastIntent: nluResult.intent.name,
    lastTopic: currentTopic,
    updatedAt: Date.now(),
  };

  return {
    updatedState,
    inheritedEntities,
    isFollowUp,
  };
}
