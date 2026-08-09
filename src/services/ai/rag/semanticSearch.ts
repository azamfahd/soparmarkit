import { searchRAGVectorStore, VectorSearchResult } from './vectorEngine';
import { db, KnowledgeDocumentRecord } from '../../../db';
import { normalizeArabic } from '../nlu/arabicNormalizer';
import { rerankSearchResults, RerankedResult } from './reranker';

export interface SemanticSearchOptions {
  category?: string;
  minConfidence?: number;
  topK?: number;
}

export interface HighlightedSearchResult {
  document: KnowledgeDocumentRecord;
  score: number;
  matchedExcerpt: string;
  confidencePercent: number;
  explanation: string;
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
 * High-level Semantic Search Engine with Top-K Reranking, excerpt highlighting, and category filtering.
 */
export async function executeSemanticSearch(
  query: string,
  options: SemanticSearchOptions = {}
): Promise<HighlightedSearchResult[]> {
  const { category, minConfidence = 0.05, topK = 5 } = options;

  // Utilize advanced metadata filtering inside vector search (retrieve twice the candidates to enable meaningful rerank)
  const rawResults: VectorSearchResult[] = await searchRAGVectorStore(query, topK * 3, {
    category,
    minConfidence,
  });

  // Apply Phase 11 reranker
  const reranked = rerankSearchResults(rawResults, query, topK);

  const queryTerms = normalizeArabic(query).split(/\s+/).filter(w => w.length > 2);

  return reranked.map(r => {
    const doc = r.document;
    const content = r.chunkContent || doc.content;

    // Generate matched excerpt window
    let matchedExcerpt = content.slice(0, 180) + (content.length > 180 ? '...' : '');

    if (queryTerms.length > 0) {
      const normContent = normalizeArabic(content);
      for (const term of queryTerms) {
        const idx = normContent.indexOf(term);
        if (idx !== -1) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + 140);
          matchedExcerpt = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
          break;
        }
      }
    }

    return {
      document: doc,
      score: r.score,
      matchedExcerpt,
      confidencePercent: r.confidencePercent,
      explanation: r.explanation,
      citation: r.citation,
    };
  });
}

