import { KnowledgeDocumentRecord, db } from '../../../db';
import { normalizeArabic, stemArabicWord } from '../nlu/arabicNormalizer';
import { resolveSynonymsInText } from '../nlu/synonyms';

export interface SearchRAGOptions {
  category?: string;
  fileType?: string;
  tags?: string[];
  minConfidence?: number;
}

export interface VectorSearchResult {
  document: KnowledgeDocumentRecord;
  score: number;
  cosineSimilarity: number;
  bm25Score: number;
  chunkId?: number;
  chunkContent?: string;
  sectionTitle?: string;
  chunkIndex?: number;
}

const STOP_WORDS = new Set([
  'في', 'من', 'على', 'عن', 'إلى', 'مع', 'هذا', 'هذه', 'ذلك', 'تم', 'كان', 'يكون',
  'أن', 'إن', 'أو', 'لا', 'ما', 'كل', 'بعد', 'قبل', 'عند', 'حتى', 'ثم', 'غير', 'هو', 'هي', 'هم',
  'التي', 'الذي', 'الذين', 'عنها', 'منها', 'فيها', 'عليها', 'إليها', 'له', 'لها', 'لهم', 'كما'
]);

/**
 * Multi-Query Expansion: Expands query into synonym-resolved and stemmed variations to maximize recall.
 */
export function expandQueryTerms(rawText: string): string[] {
  const norm = normalizeArabic(rawText);
  const syn = resolveSynonymsInText(norm);
  const wordsNorm = norm.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  const wordsSyn = syn.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
  const wordsStemmed = wordsNorm.map(w => stemArabicWord(w));

  const uniqueSet = new Set([...wordsNorm, ...wordsSyn, ...wordsStemmed]);
  return Array.from(uniqueSet);
}

/**
 * Tokenizes and normalizes Arabic text into clean term tokens.
 */
export function tokenizeArabicText(text: string): string[] {
  if (!text) return [];
  const normalized = normalizeArabic(text);
  const words = normalized
    .toLowerCase()
    .replace(/[^\u0621-\u064Aa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/);

  return words.filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

/**
 * Computes term frequencies (TF) for a token list.
 */
export function computeTermFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  if (tokens.length === 0) return tf;

  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }

  // Normalize by total tokens
  for (const token in tf) {
    tf[token] = tf[token] / tokens.length;
  }

  return tf;
}

/**
 * Calculates Cosine Similarity between two term frequency / TF-IDF vectors.
 */
export function calculateCosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    const valA = vecA[key];
    normA += valA * valA;
    if (vecB[key]) {
      dotProduct += valA * vecB[key];
    }
  }

  for (const key in vecB) {
    const valB = vecB[key];
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculates Cosine Similarity between two dense number arrays (vectors).
 */
export function calculateDenseCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const valA = vecA[i];
    const valB = vecB[i];
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes BM25 Score for a document given query terms and corpus parameters.
 */
export function computeBM25Score(
  queryTokens: string[],
  docTokens: string[],
  docCount: number,
  avgDocLength: number,
  docTermFreqsInCorpus: Record<string, number>,
  k1: number = 1.2,
  b: number = 0.75
): number {
  let score = 0;
  const docLen = docTokens.length;
  if (docLen === 0) return 0;

  const docTF: Record<string, number> = {};
  for (const t of docTokens) {
    docTF[t] = (docTF[t] || 0) + 1;
  }

  for (const qTerm of queryTokens) {
    const tf = docTF[qTerm] || 0;
    if (tf === 0) continue;

    const docsWithTerm = docTermFreqsInCorpus[qTerm] || 1;
    // IDF calculation
    const idf = Math.log((docCount - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);

    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLen / (avgDocLength || 1)));

    score += idf * (numerator / denominator);
  }

  return Math.max(0, score);
}

/**
 * Hybrid Vector Search Engine combining Vector Cosine Similarity, BM25, and Title/Tag boosting.
 * Performs search over granular document chunks with robust metadata filtering.
 */
export async function searchRAGVectorStore(
  queryText: string,
  topK: number = 5,
  options: SearchRAGOptions = {}
): Promise<VectorSearchResult[]> {
  if (!db.knowledgeDocuments) return [];

  let filteredDocs = await db.knowledgeDocuments.toArray();
  if (filteredDocs.length === 0) return [];

  // 1. Metadata filtering - Category
  if (options.category && options.category !== 'الكل') {
    const targetCatNorm = normalizeArabic(options.category);
    filteredDocs = filteredDocs.filter(
      doc => normalizeArabic(doc.category) === targetCatNorm
    );
  }

  // 2. Metadata filtering - FileType
  if (options.fileType) {
    filteredDocs = filteredDocs.filter(
      doc => doc.fileType === options.fileType
    );
  }

  // 3. Metadata filtering - Tags
  if (options.tags && options.tags.length > 0) {
    const targetTagsNorm = options.tags.map(t => normalizeArabic(t));
    filteredDocs = filteredDocs.filter(doc => {
      if (!doc.tags) return false;
      const docTagsNorm = doc.tags.map(t => normalizeArabic(t));
      return targetTagsNorm.some(tt => docTagsNorm.includes(tt));
    });
  }

  if (filteredDocs.length === 0) return [];

  const baseQueryTokens = tokenizeArabicText(queryText);
  const expandedTokens = expandQueryTerms(queryText);
  const queryTokens = Array.from(new Set([...baseQueryTokens, ...expandedTokens]));
  if (queryTokens.length === 0) return [];

  const queryTF = computeTermFrequency(queryTokens);
  const results: VectorSearchResult[] = [];

  const docMap = new Map<number, KnowledgeDocumentRecord>();
  filteredDocs.forEach(doc => {
    if (doc.id) docMap.set(doc.id, doc);
  });

  // Load embedding manager dynamically to prevent circular imports
  let queryEmbedding: number[] | null = null;
  let activeProvider: any = null;
  try {
    const { embeddingManager } = await import('./embeddings');
    activeProvider = await embeddingManager.getActiveProvider();
    const embResult = await embeddingManager.getEmbedding(queryText);
    queryEmbedding = embResult.values;
  } catch (err) {
    console.warn('Failed to generate query embedding vector, falling back to pure term-frequency search:', err);
  }

  // Load and filter the granular document chunks
  let filteredChunks: any[] = [];
  if (db.documentChunks) {
    const allChunks = await db.documentChunks.toArray();
    filteredChunks = allChunks.filter(chunk => docMap.has(chunk.documentId));
  }

  const minConfidence = options.minConfidence !== undefined ? options.minConfidence : 0.05;

  if (filteredChunks.length > 0) {
    // A. Perform granular chunk-level hybrid search
    let totalWords = 0;
    const chunkTermFreqsInCorpus: Record<string, number> = {};
    const chunkTokensMap = new Map<number, string[]>();
    const chunkTFMap = new Map<number, Record<string, number>>();

    filteredChunks.forEach((chunk, idx) => {
      const chunkId = chunk.id || idx;
      const fullText = `${chunk.sectionTitle || ''} ${chunk.content} ${(chunk.tags || []).join(' ')}`;
      const chunkTokens = tokenizeArabicText(fullText);
      chunkTokensMap.set(chunkId, chunkTokens);
      totalWords += chunkTokens.length;

      const chunkTF = computeTermFrequency(chunkTokens);
      chunkTFMap.set(chunkId, chunkTF);

      const uniqueTokens = new Set(chunkTokens);
      uniqueTokens.forEach(token => {
        chunkTermFreqsInCorpus[token] = (chunkTermFreqsInCorpus[token] || 0) + 1;
      });
    });

    const avgChunkLength = totalWords / filteredChunks.length;

    for (const chunk of filteredChunks) {
      const chunkId = chunk.id || 0;
      const doc = docMap.get(chunk.documentId)!;
      const chunkTokens = chunkTokensMap.get(chunkId) || [];
      const chunkTF = chunkTFMap.get(chunkId) || {};

      // 1. Vector Cosine Similarity (Dense embedding or TF-IDF representation)
      let cosineSim = 0;
      if (queryEmbedding && chunk.embedding && chunk.embedding.length === queryEmbedding.length) {
        cosineSim = calculateDenseCosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        // Self-healing: if using local provider and embedding is missing/wrong dimension, generate it on-the-fly!
        if (activeProvider && activeProvider.providerId === 'local' && queryEmbedding) {
          try {
            const { embeddingManager } = await import('./embeddings');
            const localEmb = await embeddingManager.getEmbedding(`${chunk.sectionTitle || ''} ${chunk.content}`);
            if (localEmb.values && localEmb.values.length === queryEmbedding.length) {
              cosineSim = calculateDenseCosineSimilarity(queryEmbedding, localEmb.values);
              // Asynchronously cache it back to Dexie so it is stored permanently
              db.documentChunks.update(chunk.id, { embedding: localEmb.values }).catch(e => 
                console.error('Failed to cache self-healed chunk embedding:', e)
              );
            } else {
              cosineSim = calculateCosineSimilarity(queryTF, chunkTF);
            }
          } catch {
            cosineSim = calculateCosineSimilarity(queryTF, chunkTF);
          }
        } else {
          cosineSim = calculateCosineSimilarity(queryTF, chunkTF);
        }
      }

      // 2. BM25 Score
      const bm25Score = computeBM25Score(
        queryTokens,
        chunkTokens,
        filteredChunks.length,
        avgChunkLength,
        chunkTermFreqsInCorpus
      );

      // 3. Title, Section Title, & Tag Match Boost
      let boost = 0;
      const normTitle = normalizeArabic(doc.title);
      const normSection = chunk.sectionTitle ? normalizeArabic(chunk.sectionTitle) : '';

      for (const qTerm of queryTokens) {
        if (normTitle.includes(qTerm)) boost += 0.3;
        if (normSection && normSection.includes(qTerm)) boost += 0.3;
        if (chunk.tags && chunk.tags.some((t: string) => normalizeArabic(t).includes(qTerm))) {
          boost += 0.2;
        }
      }

      // Combine scores (Weights: 40% Cosine Similarity, 40% BM25, 20% Heuristic Boost)
      const finalScore = (cosineSim * 0.4) + (bm25Score * 0.4) + (boost * 0.2);

      if (finalScore >= minConfidence) {
        results.push({
          document: doc,
          score: finalScore,
          cosineSimilarity: cosineSim,
          bm25Score,
          chunkId: chunk.id,
          chunkContent: chunk.content,
          sectionTitle: chunk.sectionTitle,
          chunkIndex: chunk.chunkIndex,
        });
      }
    }
  } else {
    // B. Fallback to document-level search if no chunks are available
    let totalDocWords = 0;
    const docTermFreqsInCorpus: Record<string, number> = {};
    const docTokensMap = new Map<number, string[]>();
    const docTFMap = new Map<number, Record<string, number>>();

    filteredDocs.forEach((doc, idx) => {
      const docId = doc.id || idx;
      const fullText = `${doc.title} ${doc.content} ${(doc.tags || []).join(' ')}`;
      const docTokens = tokenizeArabicText(fullText);
      docTokensMap.set(docId, docTokens);
      totalDocWords += docTokens.length;

      const docTF = computeTermFrequency(docTokens);
      docTFMap.set(docId, docTF);

      const uniqueTokens = new Set(docTokens);
      uniqueTokens.forEach(token => {
        docTermFreqsInCorpus[token] = (docTermFreqsInCorpus[token] || 0) + 1;
      });
    });

    const avgDocLength = totalDocWords / filteredDocs.length;

    for (const doc of filteredDocs) {
      const docId = doc.id!;
      const docTokens = docTokensMap.get(docId) || [];
      const docTF = docTFMap.get(docId) || {};

      // 1. Vector Cosine Similarity (Dense embedding or TF-IDF representation)
      let cosineSim = 0;
      if (queryEmbedding && doc.embedding && doc.embedding.length === queryEmbedding.length) {
        cosineSim = calculateDenseCosineSimilarity(queryEmbedding, doc.embedding);
      } else {
        // Self-healing fallback for local provider
        if (activeProvider && activeProvider.providerId === 'local' && queryEmbedding) {
          try {
            const { embeddingManager } = await import('./embeddings');
            const localEmb = await embeddingManager.getEmbedding(`${doc.title} ${doc.content}`);
            if (localEmb.values && localEmb.values.length === queryEmbedding.length) {
              cosineSim = calculateDenseCosineSimilarity(queryEmbedding, localEmb.values);
              // Asynchronously cache it back to Dexie
              db.knowledgeDocuments.update(doc.id!, { embedding: localEmb.values }).catch(e => 
                console.error('Failed to cache self-healed document embedding:', e)
              );
            } else {
              cosineSim = calculateCosineSimilarity(queryTF, docTF);
            }
          } catch {
            cosineSim = calculateCosineSimilarity(queryTF, docTF);
          }
        } else {
          cosineSim = calculateCosineSimilarity(queryTF, docTF);
        }
      }

      const bm25Score = computeBM25Score(
        queryTokens,
        docTokens,
        filteredDocs.length,
        avgDocLength,
        docTermFreqsInCorpus
      );

      let boost = 0;
      const normTitle = normalizeArabic(doc.title);
      for (const qTerm of queryTokens) {
        if (normTitle.includes(qTerm)) boost += 0.3;
        if (doc.tags && doc.tags.some(t => normalizeArabic(t).includes(qTerm))) {
          boost += 0.2;
        }
      }

      const finalScore = (cosineSim * 0.4) + (bm25Score * 0.4) + (boost * 0.2);

      if (finalScore >= minConfidence) {
        results.push({
          document: doc,
          score: finalScore,
          cosineSimilarity: cosineSim,
          bm25Score,
          chunkContent: doc.content,
        });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
