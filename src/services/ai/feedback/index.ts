import { db, AIFeedbackRecord } from '../../../db';

export interface FeedbackSummary {
  totalFeedbackCount: number;
  positiveCount: number;
  negativeCount: number;
  satisfactionRatePercent: number;
}

/**
 * Records user feedback (thumbs up / thumbs down) for an AI response.
 */
export async function submitAIFeedback(
  feedback: Omit<AIFeedbackRecord, 'id' | 'timestamp'>
): Promise<number> {
  const timestamp = Date.now();
  const record: AIFeedbackRecord = {
    ...feedback,
    timestamp,
  };

  if (db.aiFeedback) {
    return await db.aiFeedback.add(record);
  }
  return 0;
}

/**
 * Calculates feedback satisfaction metrics.
 */
export async function getAIFeedbackSummary(): Promise<FeedbackSummary> {
  if (!db.aiFeedback) {
    return {
      totalFeedbackCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      satisfactionRatePercent: 0,
    };
  }

  const allFeedback = await db.aiFeedback.toArray();
  const totalFeedbackCount = allFeedback.length;

  if (totalFeedbackCount === 0) {
    return {
      totalFeedbackCount: 0,
      positiveCount: 0,
      negativeCount: 0,
      satisfactionRatePercent: 100,
    };
  }

  const positiveCount = allFeedback.filter(f => f.rating === 'THUMBS_UP').length;
  const negativeCount = totalFeedbackCount - positiveCount;
  const satisfactionRatePercent = Math.round((positiveCount / totalFeedbackCount) * 100);

  return {
    totalFeedbackCount,
    positiveCount,
    negativeCount,
    satisfactionRatePercent,
  };
}

/**
 * Retrieves all user feedback records.
 */
export async function getAllFeedbackRecords(): Promise<AIFeedbackRecord[]> {
  if (!db.aiFeedback) return [];
  return await db.aiFeedback.reverse().toArray();
}

/**
 * Logs a system-level AI processing or execution error into the feedback/quality DB.
 */
export async function logAIError(
  query: string,
  error: any,
  intent = 'SYSTEM_ERROR'
): Promise<number> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack || '' : '';

  return await submitAIFeedback({
    messageId: 'err_' + Date.now(),
    userQuery: query,
    responseAnswer: `Error: ${errorMessage}\nStack: ${errorStack}`,
    rating: 'THUMBS_DOWN',
    intent,
  });
}

