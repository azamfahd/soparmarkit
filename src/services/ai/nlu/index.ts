import { UserQuery, NLUResult } from '../types';
import { normalizeArabic } from './arabicNormalizer';
import { resolveSynonymsInText } from './synonyms';
import { detectIntent } from './intentDetector';
import { extractEntities } from './entityExtractor';

export async function processNLU(query: UserQuery): Promise<NLUResult> {
  // 1. Normalize Arabic Text
  const normalizedText = normalizeArabic(query.rawText);

  // 2. Resolve Synonyms to Canonical Terms
  const synonymResolvedText = resolveSynonymsInText(normalizedText);

  // 3. Detect Intent
  const intent = detectIntent(normalizedText, synonymResolvedText, query);

  // 4. Extract Entities
  const entities = extractEntities(normalizedText, synonymResolvedText);

  // 5. Evaluate Clarification Requirement
  let isClarificationNeeded = false;
  let clarificationMessage: string | undefined = undefined;

  if (intent.name === 'UNKNOWN' || intent.confidence < 0.25) {
    isClarificationNeeded = true;
    clarificationMessage =
      `🤖 **المستشار الذكي:**\n` +
      `عذراً، لم أستطع فهم سؤالك بوضوح. هل تقصد أحد الاستعلامات المحاسبية التالية؟\n\n` +
      `1️⃣ **ديون العملاء**: كم ديون العملاء أو رصيد زبون معين\n` +
      `2️⃣ **المبيعات والأرباح**: كم مبيعات اليوم وأرباح الفترة\n` +
      `3️⃣ **المخزون والنواقص**: المنتجات قريبة النفاد أو حالة صنف\n` +
      `4️⃣ **ديون الموردين**: المستحقات المترتبة علينا للشركات والموردين`;
  }

  return {
    intent,
    entities,
    isClarificationNeeded,
    clarificationMessage,
  };
}

export * from './arabicNormalizer';
export * from './synonyms';
export * from './intentDataset';
export * from './intentDetector';
export * from './entityExtractor';
