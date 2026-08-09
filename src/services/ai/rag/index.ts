import { Evidence } from '../types';
import { searchRAGVectorStore } from './vectorEngine';
import { searchKnowledgeBase } from '../knowledge';
import { rerankSearchResults } from './reranker';

/**
 * RAG Context Retrieval Engine using hybrid Cosine Vector + BM25 search + Phase 11 Reranking.
 */
export async function retrieveContext(queryText: string): Promise<Evidence[]> {
  const rawResults = await searchRAGVectorStore(queryText, 15);

  if (rawResults && rawResults.length > 0) {
    const reranked = rerankSearchResults(rawResults, queryText, 5);
    
    return [
      {
        source: 'RAG',
        data: {
          matchedDocuments: reranked.map(r => ({
            id: r.document.id,
            title: r.document.title,
            category: r.document.category,
            content: r.chunkContent || r.document.content,
            score: r.score,
            cosineSimilarity: r.cosineSimilarity,
            confidencePercent: r.confidencePercent,
            explanation: r.explanation,
            citation: r.citation,
          })),
        },
        metadata: { toolName: 'knowledgeBaseRetrieval' },
      },
    ];
  }

  // Fallback to keyword matching if vector search returns no high-confidence match
  const docs = await searchKnowledgeBase(queryText);
  if (!docs || docs.length === 0) return [];

  return [
    {
      source: 'RAG',
      data: {
        matchedDocuments: docs.map(d => {
          const docSizeKB = d.fileSize ? `${Math.round(d.fileSize / 1024)} كيلوبايت` : 'غير محدد';
          return {
            id: d.id,
            title: d.title,
            category: d.category,
            content: d.content,
            score: 0.5,
            confidencePercent: 50,
            explanation: 'تطابق نصوص عادي (كلمات مفتاحية)',
            citation: {
              title: d.title,
              fileName: d.fileName || `${d.title.replace(/\s+/g, '_')}.txt`,
              fileType: d.fileType || 'txt',
              fileSize: docSizeKB,
              category: d.category || 'عام',
            }
          };
        }),
      },
      metadata: { toolName: 'knowledgeBaseRetrieval' },
    },
  ];
}

export * from './documentProcessor';
export * from './vectorEngine';
export * from './semanticSearch';
export * from './embeddings';
export * from './reranker';

