import { db, AITrainingRecord } from '../../../db';
import { Entity } from '../types';

let cachedTrainingData: AITrainingRecord[] = [];

/**
 * Preloads the custom local training data from IndexedDB into memory.
 * Should be called when the application or AI module starts.
 */
export async function preloadTrainingData() {
  if (!db.aiTrainingData) return;
  try {
    cachedTrainingData = await db.aiTrainingData.toArray();
    console.log(`[AI Engine] Preloaded ${cachedTrainingData.length} custom training records.`);
  } catch (err) {
    console.error('Failed to preload AI training data', err);
  }
}

/**
 * Retrieves the currently loaded training examples.
 */
export function getLocalTrainingData(): AITrainingRecord[] {
  return cachedTrainingData;
}

/**
 * Saves a new feedback correction / training example to the database,
 * and updates the in-memory cache.
 */
export async function addTrainingExample(
  query: string,
  expectedIntent: string,
  expectedEntities?: Entity[]
) {
  if (!db.aiTrainingData) return;

  const record: AITrainingRecord = {
    query: query.trim(),
    expectedIntent,
    expectedEntities: expectedEntities ? JSON.stringify(expectedEntities) : undefined,
    createdAt: Date.now()
  };

  try {
    // Check if it already exists to prevent duplicates
    const existing = await db.aiTrainingData.where({ query: record.query }).first();
    if (existing && existing.id) {
      await db.aiTrainingData.update(existing.id, record);
      // Update cache
      const idx = cachedTrainingData.findIndex(r => r.id === existing.id);
      if (idx !== -1) cachedTrainingData[idx] = { ...existing, ...record };
    } else {
      const id = await db.aiTrainingData.add(record);
      cachedTrainingData.push({ ...record, id });
    }
  } catch (err) {
    console.error('Failed to add AI training example', err);
  }
}
