import { db, DocumentChunkRecord } from '../../../db';
import { addKnowledgeDocument } from '../knowledge';
import { normalizeArabic } from '../nlu/arabicNormalizer';

export interface DocumentChunk {
  chunkIndex: number;
  sectionTitle?: string;
  content: string;
  cleanContent: string;
  wordCount: number;
  tags: string[];
}

export interface ProcessedDocumentResult {
  docId: number;
  title: string;
  category: string;
  cleanedText: string;
  chunks: DocumentChunk[];
  tags: string[];
}

/**
 * Clean document text: strip HTML tags, standardize whitespace & newlines.
 */
export function cleanDocumentText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // Standardize newlines
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Replace multiple horizontal spaces with a single space
  text = text.replace(/[ \t]+/g, ' ');

  // Reduce 3+ consecutive newlines to 2 newlines (paragraphs)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Section header detection regex for Markdown headers, numbered headings, and Arabic section markers.
 */
const SECTION_HEADER_REGEX = /^(#+\s+.*|[\d١٢٣٤٥٦٧٨٩٠]+[\.-]\s+.*|[📌🔹📑▪️•]\s+.*|(القسم|البند|المادة|شرح|دليل|سياسة|طريقة):\s+.*)/i;

/**
 * Splits document text into semantically cohesive overlapping chunks that preserve header boundaries and context.
 */
export function chunkTextSemantically(
  text: string,
  docTitle: string,
  maxWordsPerChunk: number = 200,
  overlapWords: number = 40
): DocumentChunk[] {
  const cleaned = cleanDocumentText(text);
  if (!cleaned) return [];

  const lines = cleaned.split('\n');
  const chunks: DocumentChunk[] = [];

  let currentSectionTitle = docTitle;
  let currentChunkLines: string[] = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const isHeader = SECTION_HEADER_REGEX.test(trimmedLine);
    const lineWords = trimmedLine.split(/\s+/);
    const lineWordCount = lineWords.length;

    // If new section header encountered and we already have content, finalize current chunk
    if (isHeader && currentWordCount > 50) {
      const chunkContent = currentChunkLines.join('\n');
      const headerContext = `[المستند: ${docTitle} | القسم: ${currentSectionTitle}]\n`;
      const fullChunkContent = headerContext + chunkContent;

      chunks.push({
        chunkIndex,
        sectionTitle: currentSectionTitle,
        content: fullChunkContent,
        cleanContent: cleanDocumentText(chunkContent),
        wordCount: currentWordCount,
        tags: extractKeyTags(chunkContent),
      });

      chunkIndex++;

      // Handle overlap by keeping last N words
      const allWords = currentChunkLines.join(' ').split(/\s+/);
      const overlapText = allWords.slice(-overlapWords).join(' ');
      currentChunkLines = overlapText ? [overlapText] : [];
      currentWordCount = overlapText ? overlapText.split(/\s+/).length : 0;

      // Update active section title
      currentSectionTitle = trimmedLine.replace(/^#+\s*|[📌🔹📑▪️•]\s*/g, '');
    }

    currentChunkLines.push(trimmedLine);
    currentWordCount += lineWordCount;

    // Finalize chunk if max words limit reached
    if (currentWordCount >= maxWordsPerChunk) {
      const chunkContent = currentChunkLines.join('\n');
      const headerContext = `[المستند: ${docTitle} | القسم: ${currentSectionTitle}]\n`;
      const fullChunkContent = headerContext + chunkContent;

      chunks.push({
        chunkIndex,
        sectionTitle: currentSectionTitle,
        content: fullChunkContent,
        cleanContent: cleanDocumentText(chunkContent),
        wordCount: currentWordCount,
        tags: extractKeyTags(chunkContent),
      });

      chunkIndex++;

      // Create overlap for next chunk
      const allWords = currentChunkLines.join(' ').split(/\s+/);
      const overlapText = allWords.slice(-overlapWords).join(' ');
      currentChunkLines = overlapText ? [overlapText] : [];
      currentWordCount = overlapText ? overlapText.split(/\s+/).length : 0;
    }
  }

  // Final remaining lines
  if (currentChunkLines.length > 0 && currentWordCount > 10) {
    const chunkContent = currentChunkLines.join('\n');
    const headerContext = `[المستند: ${docTitle} | القسم: ${currentSectionTitle}]\n`;
    const fullChunkContent = headerContext + chunkContent;

    chunks.push({
      chunkIndex,
      sectionTitle: currentSectionTitle,
      content: fullChunkContent,
      cleanContent: cleanDocumentText(chunkContent),
      wordCount: currentWordCount,
      tags: extractKeyTags(chunkContent),
    });
  }

  return chunks;
}

/**
 * Legacy wrapper for backward compatibility.
 */
export function chunkText(
  text: string,
  maxWordsPerChunk: number = 150,
  overlapWords: number = 30
): DocumentChunk[] {
  return chunkTextSemantically(text, 'مستند', maxWordsPerChunk, overlapWords);
}

/**
 * Extracts key Arabic tags from text automatically.
 */
export function extractKeyTags(text: string): string[] {
  const normalized = normalizeArabic(text);
  const words = normalized.split(/\s+/);

  const stopWords = new Set([
    'في', 'من', 'على', 'عن', 'إلى', 'مع', 'هذا', 'هذه', 'ذلك', 'تم', 'كان', 'يكون',
    'أن', 'إن', 'أو', 'لا', 'ما', 'كل', 'بعد', 'قبل', 'عند', 'حتى', 'ثم', 'غير', 'طريقة', 'كيفية', 'قسم'
  ]);

  const freqMap: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 3 && !stopWords.has(w)) {
      freqMap[w] = (freqMap[w] || 0) + 1;
    }
  }

  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Stores semantically parsed chunks into IndexedDB `db.documentChunks`.
 */
export async function storeDocumentChunksInDB(
  documentId: number,
  chunks: DocumentChunk[],
  globalTags: string[]
): Promise<number[]> {
  if (!db.documentChunks) return [];

  // Delete existing chunks for this document first
  await deleteDocumentChunksFromDB(documentId);

  const now = Date.now();
  const chunkRecords: DocumentChunkRecord[] = chunks.map(chunk => ({
    documentId,
    chunkIndex: chunk.chunkIndex,
    sectionTitle: chunk.sectionTitle,
    content: chunk.content,
    cleanContent: chunk.cleanContent,
    wordCount: chunk.wordCount,
    tags: Array.from(new Set([...globalTags, ...chunk.tags])),
    createdAt: now,
  }));

  // Generate embeddings for the chunks using active provider (with lazy-load)
  try {
    const { embeddingManager } = await import('./embeddings');
    const chunkTexts = chunkRecords.map(r => `${r.sectionTitle || ''} ${r.cleanContent}`);
    const { values, providerId } = await embeddingManager.getEmbeddings(chunkTexts);
    
    chunkRecords.forEach((record, idx) => {
      if (values[idx]) {
        record.embedding = values[idx];
      }
    });
    console.log(`Generated ${chunkRecords.length} embeddings using "${providerId}" provider during storage`);
  } catch (err) {
    console.error('Failed to pre-compute embeddings for chunks during storage, chunks stored without embeddings:', err);
  }

  const ids = await db.documentChunks.bulkAdd(chunkRecords, { allKeys: true });
  return ids as number[];
}

/**
 * Deletes all chunks associated with a document ID.
 */
export async function deleteDocumentChunksFromDB(documentId: number): Promise<void> {
  if (!db.documentChunks) return;
  const keys = await db.documentChunks.where('documentId').equals(documentId).primaryKeys();
  await db.documentChunks.bulkDelete(keys as number[]);
}

/**
 * Processes raw text, cleans it, splits into semantic chunks, and saves both parent document and chunks to IndexedDB.
 */
export async function processAndStoreDocument(
  title: string,
  category: string,
  rawText: string,
  userTags?: string[]
): Promise<ProcessedDocumentResult> {
  const cleanedText = cleanDocumentText(rawText);
  const autoTags = extractKeyTags(cleanedText);
  const combinedTags = Array.from(new Set([...(userTags || []), ...autoTags]));

  const chunks = chunkTextSemantically(cleanedText, title, 200, 40);

  // 1. Save parent KnowledgeDocument
  const docId = await addKnowledgeDocument({
    title,
    category,
    content: cleanedText,
    tags: combinedTags,
  });

  // 2. Index and persist chunks in IndexedDB
  await storeDocumentChunksInDB(docId, chunks, combinedTags);

  return {
    docId,
    title,
    category,
    cleanedText,
    chunks,
    tags: combinedTags,
  };
}

/**
 * Re-indexes and chunks all documents in the knowledge base.
 */
export async function reindexAllKnowledgeDocuments(): Promise<{ totalDocs: number; totalChunks: number }> {
  if (!db.knowledgeDocuments || !db.documentChunks) {
    return { totalDocs: 0, totalChunks: 0 };
  }

  const allDocs = await db.knowledgeDocuments.toArray();
  let totalChunksCount = 0;

  for (const doc of allDocs) {
    if (doc.id) {
      const chunks = chunkTextSemantically(doc.content, doc.title, 200, 40);
      const chunkIds = await storeDocumentChunksInDB(doc.id, chunks, doc.tags || []);
      totalChunksCount += chunkIds.length;
    }
  }

  return {
    totalDocs: allDocs.length,
    totalChunks: totalChunksCount,
  };
}
