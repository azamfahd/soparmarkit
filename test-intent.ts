import { normalizeArabic } from './src/services/ai/nlu/arabicNormalizer';
import { resolveSynonymsInText } from './src/services/ai/nlu/synonyms';
import { detectIntent } from './src/services/ai/nlu/intentDetector';

const rawText = 'كم على احمد؟';
const normalizedText = normalizeArabic(rawText);
const synonymResolvedText = resolveSynonymsInText(normalizedText);

console.log('Norm:', normalizedText);
console.log('Syn:', synonymResolvedText);
console.log('Intent:', detectIntent(normalizedText, synonymResolvedText, null as any));
