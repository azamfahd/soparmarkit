import { UserQuery, NLUResult, Intent, Entity } from '../types';
import { normalizeArabic } from './arabicNormalizer';
import { processNLU } from './index';

/**
 * Splits a raw query into sub-queries based on Arabic conjunctions and punctuation,
 * returning multiple NLU results if the query is compound.
 */
export async function parseCompoundQuery(query: UserQuery): Promise<NLUResult[]> {
  const normalizedText = normalizeArabic(query.rawText);

  // Split by common compound separators (و، ثم، فاصله، علامات استفهام متعددة)
  // We use a regex that looks for standard separators that denote separate commands.
  const separators = /،|,|؛|;|\?|؟|(?:\s+و\s+(?=كم|ما|ايش|ماهو|قارن|قل لي|اعطني|من|هل|كيف|أكثر|اقل|اشرح|وضح|بين|طريقة))/gi;
  
  const subTexts = query.rawText.split(separators)
    .map(t => t.trim())
    .filter(t => t.length > 2);

  if (subTexts.length <= 1) {
    // Single query processing
    const singleResult = await processNLU(query);
    return [singleResult];
  }

  // Multi-query processing
  const results: NLUResult[] = [];
  
  // Pass entities across sub-queries (e.g. "sales this month and profit" -> profit inherits "this month")
  let inheritedDateEntity: Entity | undefined;
  
  for (const subText of subTexts) {
    const subResult = await processNLU({
      ...query,
      rawText: subText,
      normalizedText: normalizeArabic(subText)
    });
    
    const dateEntity = subResult.entities.find(e => e.type === 'DATE_RANGE');
    if (dateEntity) {
      inheritedDateEntity = dateEntity;
    } else if (inheritedDateEntity) {
      subResult.entities.push(inheritedDateEntity);
    }
    
    if (subResult.intent.name !== 'UNKNOWN' && subResult.intent.confidence >= 0.25) {
      results.push(subResult);
    }
  }

  // If no subqueries were valid, fallback to evaluating the whole text
  if (results.length === 0) {
    const singleResult = await processNLU(query);
    return [singleResult];
  }

  return results;
}

