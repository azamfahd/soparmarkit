import { describe, it, expect } from 'vitest';
import { rerankSearchResults, RerankedResult } from '../rag/reranker';
import { tokenizeArabicText, VectorSearchResult } from '../rag/vectorEngine';

describe('RAG Context Retrieval Evaluation', () => {

  describe('1. BM25 Tokenizer & Text Normalization', () => {
    it('should tokenize and normalize Arabic queries correctly', () => {
      const tokens = tokenizeArabicText('مبيعات الشركة المُحترمة لعام 2023م!');
      // Assuming tokenize removes stop words, keeps meaningful >2 length
      expect(tokens).toContain('مبيعات');
      expect(tokens).toContain('الشركه'); // normalized
      expect(tokens).toContain('المحترمه'); // removed Tashkeel, normalized taa marbuta
    });

    it('should handle typos via semantic overlap or normalization', () => {
       const tokens1 = tokenizeArabicText('ابراهيم');
       const tokens2 = tokenizeArabicText('إبراهيم');
       expect(tokens1.join(',')).toEqual(tokens2.join(','));
    });
  });

  describe('2. Hybrid Reranker (Cosine + BM25 + Phrase Boost)', () => {
    // Mock KnowledgeDocumentRecord
    const createMockDoc = (id: any, title: string, content: string) => ({
      id,
      title,
      content,
      fileType: 'TXT' as const,
      fileSize: 1024,
      fileName: 'doc.txt',
      category: 'عام',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const mockRawResults: VectorSearchResult[] = [
      {
        document: createMockDoc('d1', 'مفهوم الميزانية', 'الميزانية العمومية هي قائمة توضح الأصول والخصوم'),
        score: 0.8,
        cosineSimilarity: 0.8,
        bm25Score: 1.5,
        chunkContent: 'الميزانية العمومية هي قائمة توضح الأصول والخصوم'
      },
      {
        document: createMockDoc('d2', 'إعداد الميزانية', 'كيفية إعداد القوائم المالية خطوة بخطوة للشركات'),
        score: 0.7,
        cosineSimilarity: 0.7,
        bm25Score: 1.2,
        chunkContent: 'كيفية إعداد القوائم المالية خطوة بخطوة للشركات الميزانية'
      },
      {
        document: createMockDoc('d3', 'تقرير المبيعات', 'المبيعات هي عصب التجارة، ولا بد من تحليل أرقام الميزانية باستمرار'),
        score: 0.6,
        cosineSimilarity: 0.6,
        bm25Score: 0.9,
        chunkContent: 'المبيعات هي عصب التجارة، ولا بد من تحليل أرقام الميزانية باستمرار'
      }
    ];

    it('should rerank and prioritize exact phrase sequence in content', () => {
      const query = 'الميزانية العمومية';
      const reranked = rerankSearchResults(mockRawResults, query, 3);
      
      expect(reranked[0].document.id).toBe('d1');
      expect(reranked[0].explanation).toContain('تطابق تام للجملة في محتوى المستند');
    });

    it('should prioritize title matches', () => {
      const query = 'إعداد الميزانية';
      const reranked = rerankSearchResults(mockRawResults, query, 3);
      
      // d2 should win due to title sequence match
      expect(reranked[0].document.id).toBe('d2');
      expect(reranked[0].explanation).toContain('تطابق تام لجملة الاستفسار مع عنوان المستند');
    });

    it('should calculate confidence percentage correctly (10-99 clamp)', () => {
      const query = 'الميزانية';
      const reranked = rerankSearchResults(mockRawResults, query, 3);
      
      reranked.forEach(res => {
        expect(res.confidencePercent).toBeGreaterThanOrEqual(15);
        expect(res.confidencePercent).toBeLessThanOrEqual(99);
      });
    });
  });

  describe('3. Redundancy Filtering', () => {
    const createMockDoc = (id: any, content: string) => ({
      id,
      title: 'Doc',
      content,
      fileType: 'TXT' as const,
      fileSize: 1024,
      fileName: 'doc.txt',
      category: 'عام',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const redundantResults: VectorSearchResult[] = [
      {
        document: createMockDoc('d1', 'محتوى مكرر يبدأ بنفس الكلمات تماما في هذه الفقرة ليملأ المساحة ويجعل الجملة طويلة جدا بما يكفي ليتجاوز الثمانين حرفا'),
        score: 0.9,
        cosineSimilarity: 0.9,
        bm25Score: 1.5,
        chunkContent: 'محتوى مكرر يبدأ بنفس الكلمات تماما في هذه الفقرة ليملأ المساحة ويجعل الجملة طويلة جدا بما يكفي ليتجاوز الثمانين حرفا ولكن بنهاية مختلفة'
      },
      {
        document: createMockDoc('d1', 'محتوى مكرر يبدأ بنفس الكلمات تماما في هذه الفقرة ليملأ المساحة ويجعل الجملة طويلة جدا بما يكفي ليتجاوز الثمانين حرفا'),
        score: 0.88,
        cosineSimilarity: 0.88,
        bm25Score: 1.4,
        chunkContent: 'محتوى مكرر يبدأ بنفس الكلمات تماما في هذه الفقرة ليملأ المساحة ويجعل الجملة طويلة جدا بما يكفي ليتجاوز الثمانين حرفا مع نهاية أخرى'
      },
      {
        document: createMockDoc('d2', 'فقرة مختلفة تماما وتتحدث عن موضوع آخر'),
        score: 0.85,
        cosineSimilarity: 0.85,
        bm25Score: 1.2,
        chunkContent: 'فقرة مختلفة تماما وتتحدث عن موضوع آخر'
      }
    ];

    it('should filter out near-duplicate chunks starting with the same prefix', () => {
      const reranked = rerankSearchResults(redundantResults, 'محتوى مكرر', 5);
      
      // Only 2 unique items should remain, the redundant one is dropped
      expect(reranked.length).toBe(2);
      
      const chunkContents = reranked.map(r => r.chunkContent);
      expect(chunkContents).toContain('فقرة مختلفة تماما وتتحدث عن موضوع آخر');
      // The higher-scored redundant one should win
      expect(chunkContents).toContain('محتوى مكرر يبدأ بنفس الكلمات تماما في هذه الفقرة ليملأ المساحة ويجعل الجملة طويلة جدا بما يكفي ليتجاوز الثمانين حرفا ولكن بنهاية مختلفة');
      expect(chunkContents).not.toContain('محتوى مكرر يبدأ بنفس الكلمات تماما في هذه الفقرة ليملأ المساحة ويجعل الجملة طويلة جدا بما يكفي ليتجاوز الثمانين حرفا مع نهاية أخرى');
    });
  });
});
