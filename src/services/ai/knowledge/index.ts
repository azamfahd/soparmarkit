import { db, KnowledgeDocumentRecord } from '../../../db';
import { normalizeArabic } from '../nlu/arabicNormalizer';
import { seedExtendedKnowledgeBase } from './knowledgeStore';

/**
 * Knowledge Base CRUD and Search Service
 */

export async function addKnowledgeDocument(
  doc: Omit<KnowledgeDocumentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<number> {
  const now = Date.now();
  const record: KnowledgeDocumentRecord = {
    ...doc,
    createdAt: now,
    updatedAt: now,
  };
  return await db.knowledgeDocuments.add(record);
}

export async function updateKnowledgeDocument(
  id: number,
  updates: Partial<Omit<KnowledgeDocumentRecord, 'id' | 'createdAt'>>
): Promise<number> {
  const now = Date.now();
  await db.knowledgeDocuments.update(id, {
    ...updates,
    updatedAt: now,
  });
  return id;
}

export async function deleteKnowledgeDocument(id: number): Promise<void> {
  await db.knowledgeDocuments.delete(id);
}

export async function getAllKnowledgeDocuments(): Promise<KnowledgeDocumentRecord[]> {
  if (!db.knowledgeDocuments) return [];
  await seedExtendedKnowledgeBase();
  return await db.knowledgeDocuments.toArray();
}

/**
 * Searches the knowledge base by matching normalized keywords against titles, content, and tags.
 */
export async function searchKnowledgeBase(queryText: string): Promise<KnowledgeDocumentRecord[]> {
  if (!db.knowledgeDocuments) return [];
  await seedExtendedKnowledgeBase();

  const allDocs = await db.knowledgeDocuments.toArray();
  if (!queryText || queryText.trim().length === 0) return allDocs;

  const normalizedQuery = normalizeArabic(queryText);
  const queryTerms = normalizedQuery.split(' ').filter(t => t.length > 2);

  const scoredDocs = allDocs.map(doc => {
    let score = 0;
    const normTitle = normalizeArabic(doc.title);
    const normContent = normalizeArabic(doc.content);

    for (const term of queryTerms) {
      if (normTitle.includes(term)) score += 5;
      if (normContent.includes(term)) score += 2;
      if (doc.tags && doc.tags.some(tag => normalizeArabic(tag).includes(term))) {
        score += 4;
      }
    }

    return { doc, score };
  });

  return scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.doc);
}

export * from './fileParsers';
export * from './knowledgeStore';
