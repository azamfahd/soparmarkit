import { VectorSearchResult, tokenizeArabicText } from './vectorEngine';
import { KnowledgeDocumentRecord } from '../../../db';
import { normalizeArabic } from '../nlu/arabicNormalizer';

export interface RerankedResult {
  document: KnowledgeDocumentRecord;
  score: number;
  cosineSimilarity: number;
  bm25Score: number;
  chunkId?: number;
  chunkContent?: string;
  sectionTitle?: string;
  chunkIndex?: number;
  confidencePercent: number;
  explanation: string; // Arabic explanation of relevance
  citation: {
    title: string;
    fileName: string;
    fileType: string;
    fileSize?: string;
    sectionTitle?: string;
    category: string;
  };
}

/**
 * Advanced Top-K Reranking and Attribution Engine for RAG.
 * Applies multi-factor sequence-matching, term density scoring, redundancy filtering,
 * and extracts precise document citation references.
 */
export function rerankSearchResults(
  rawResults: VectorSearchResult[],
  query: string,
  topK: number = 5
): RerankedResult[] {
  if (!rawResults || rawResults.length === 0) return [];

  const queryNorm = normalizeArabic(query).toLowerCase();
  const queryTokens = tokenizeArabicText(query);
  const rerankedList: RerankedResult[] = [];

  // Find max BM25 score in raw list for normalization
  const maxBM25 = Math.max(...rawResults.map(r => r.bm25Score), 1);

  for (const raw of rawResults) {
    const doc = raw.document;
    const content = raw.chunkContent || doc.content || '';
    const contentNorm = normalizeArabic(content).toLowerCase();
    const titleNorm = normalizeArabic(doc.title).toLowerCase();
    const sectionNorm = raw.sectionTitle ? normalizeArabic(raw.sectionTitle).toLowerCase() : '';

    let sequenceMatchBoost = 0;
    let titleMatchBoost = 0;
    let densityBoost = 0;
    const explanations: string[] = [];

    // 1. Exact Phrase Sequence Matching Boost
    if (queryNorm.length > 3) {
      if (contentNorm.includes(queryNorm)) {
        sequenceMatchBoost += 0.45;
        explanations.push('تطابق تام للجملة في محتوى المستند');
      } else if (titleNorm.includes(queryNorm)) {
        sequenceMatchBoost += 0.55;
        explanations.push('تطابق تام لجملة الاستفسار مع عنوان المستند');
      } else if (sectionNorm && sectionNorm.includes(queryNorm)) {
        sequenceMatchBoost += 0.50;
        explanations.push('تطابق تام لجملة الاستفسار مع اسم القسم');
      }
    }

    // 2. Query Term Density and Co-occurrence in Chunk
    if (queryTokens.length > 0) {
      let matchedTermsCount = 0;
      for (const token of queryTokens) {
        if (contentNorm.includes(token)) matchedTermsCount++;
      }
      
      const densityRatio = matchedTermsCount / queryTokens.length;
      if (densityRatio >= 0.8) {
        densityBoost += 0.35;
        explanations.push('كثافة كلمات عالية ومترابطة');
      } else if (densityRatio >= 0.5) {
        densityBoost += 0.20;
        explanations.push('ملاءمة جيدة للكلمات المفتاحية');
      }
    }

    // 3. Keyword Match in Title & Headers Boost
    let titleTermCount = 0;
    let sectionTermCount = 0;
    for (const token of queryTokens) {
      if (titleNorm.includes(token)) titleTermCount++;
      if (sectionNorm && sectionNorm.includes(token)) sectionTermCount++;
    }

    if (titleTermCount > 0) {
      titleMatchBoost += Math.min(0.3, titleTermCount * 0.1);
      explanations.push('الكلمات المفتاحية تطابق عنوان الموضوع الرئيسي');
    }
    if (sectionTermCount > 0) {
      titleMatchBoost += Math.min(0.2, sectionTermCount * 0.1);
      explanations.push('الكلمات المفتاحية تطابق عنوان القسم الفرعي');
    }

    // 4. Normalized BM25
    const normBM25 = raw.bm25Score / maxBM25;

    // 5. Weight-combined Rerank Score
    // Formulas: Cosine similarity: 30%, BM25: 25%, Phrase Sequence: 20%, Term Density: 15%, Title Match: 10%
    const combinedScore = 
      (raw.cosineSimilarity * 0.30) + 
      (normBM25 * 0.25) + 
      (sequenceMatchBoost * 0.20) + 
      (densityBoost * 0.15) + 
      (titleMatchBoost * 0.10);

    // Build natural language Arabic summary of relevance if no explicit ones were gathered
    if (explanations.length === 0) {
      if (raw.cosineSimilarity > 0.6) {
        explanations.push('تطابق سياقي عالي (عصبي دلالي)');
      } else if (normBM25 > 0.5) {
        explanations.push('مطابقة جيدة للمفردات الإحصائية');
      } else {
        explanations.push('مطابقة مرجعية عامة');
      }
    }

    // Construct pretty citation data
    const docSizeKB = doc.fileSize 
      ? `${Math.round(doc.fileSize / 1024)} كيلوبايت` 
      : 'غير محدد';

    const citation = {
      title: doc.title,
      fileName: doc.fileName || `${doc.title.replace(/\s+/g, '_')}.txt`,
      fileType: doc.fileType || 'txt',
      fileSize: docSizeKB,
      sectionTitle: raw.sectionTitle,
      category: doc.category || 'عام',
    };

    // Confidence scaling: Map the combined score to 0 - 100% bounds
    // Clamp between 10% and 99% for realistic visualization
    const confidencePercent = Math.min(
      99,
      Math.max(15, Math.round(combinedScore * 100))
    );

    rerankedList.push({
      document: doc,
      score: combinedScore,
      cosineSimilarity: raw.cosineSimilarity,
      bm25Score: raw.bm25Score,
      chunkId: raw.chunkId,
      chunkContent: raw.chunkContent,
      sectionTitle: raw.sectionTitle,
      chunkIndex: raw.chunkIndex,
      confidencePercent,
      explanation: explanations.slice(0, 2).join(' + '),
      citation,
    });
  }

  // 6. Redundancy Filtering (Deduplication of closely related duplicate chunks)
  // If we retrieve multiple chunks from the same document having identical content prefixes, only keep the best
  const seenPrefixes = new Set<string>();
  const uniqueList: RerankedResult[] = [];

  // Sort by reranked score descending
  const sortedList = rerankedList.sort((a, b) => b.score - a.score);

  for (const item of sortedList) {
    const text = item.chunkContent || '';
    const prefix = text.slice(0, 80).replace(/\s+/g, '').toLowerCase();
    
    if (prefix && seenPrefixes.has(prefix)) {
      continue; // Skip near-duplicate text window
    }
    seenPrefixes.add(prefix);
    uniqueList.push(item);
  }

  return uniqueList.slice(0, topK);
}
