import { db, AIMessageRecord, AIConversationRecord } from '../../../db';
import { AIMessage, NLUResult } from '../types';
import { MemoryContext, ActiveEntityState, ConversationSession, ConversationSummary } from './types';
import { processEntityInheritance } from './entityTracker';

const DEFAULT_CONVERSATION_ID = 'default_session';
const MAX_WINDOW_MESSAGES = 10;

// In-memory active entity state cache per conversation for fast multi-turn access
const activeStateCache = new Map<string, ActiveEntityState>();

/**
 * Saves a message (user or assistant) into IndexedDB.
 */
export async function saveAIMessage(
  conversationId: string = DEFAULT_CONVERSATION_ID,
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    intent?: string;
    evidence?: any;
    processingStages?: any;
    reasoningSummary?: string;
  }
): Promise<AIMessageRecord> {
  const timestamp = Date.now();
  const id = `msg_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;

  const msgRecord: AIMessageRecord = {
    id,
    conversationId,
    role: message.role,
    content: message.content,
    timestamp,
    intent: message.intent,
    evidence: message.evidence,
    processingStages: message.processingStages,
    reasoningSummary: message.reasoningSummary,
  };

  try {
    if (db.aiMessages) {
      await db.aiMessages.add(msgRecord);
    }

    if (db.aiConversations) {
      const existing = await db.aiConversations.get(conversationId);
      if (existing) {
        await db.aiConversations.update(conversationId, { updatedAt: timestamp });
      } else {
        const title = message.role === 'user' ? message.content.slice(0, 35) : 'محادثة جديدة';
        await db.aiConversations.add({
          id: conversationId,
          title,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }
  } catch (err) {
    console.warn('Failed to persist AI message in IndexedDB:', err);
  }

  return msgRecord;
}

/**
 * Retrieves memory context including history, active entity tracking, and session summary.
 */
export async function getMemoryContext(
  conversationId: string = DEFAULT_CONVERSATION_ID,
  limit: number = MAX_WINDOW_MESSAGES
): Promise<MemoryContext> {
  let recentMessages: AIMessageRecord[] = [];

  try {
    if (db.aiMessages) {
      const allMsgs = await db.aiMessages
        .where('conversationId')
        .equals(conversationId)
        .sortBy('timestamp');

      recentMessages = allMsgs;
    }
  } catch (err) {
    console.warn('Failed to read AI messages from IndexedDB:', err);
  }

  // Active state recovery
  let currentState: ActiveEntityState = activeStateCache.get(conversationId) || {
    updatedAt: Date.now(),
  };

  // Reconstruct state from recent history if cache empty
  if (!currentState.targetName && recentMessages.length > 0) {
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msg = recentMessages[i];
      if (msg.evidence && Array.isArray(msg.evidence)) {
        for (const ev of msg.evidence) {
          if (ev.data?.searchedName && !currentState.targetName) {
            currentState.targetName = ev.data.searchedName;
          }
          if (ev.data?.customer?.name && !currentState.targetName) {
            currentState.targetName = ev.data.customer.name;
            currentState.targetType = 'CUSTOMER';
          }
          if (ev.data?.supplier?.name && !currentState.targetName) {
            currentState.targetName = ev.data.supplier.name;
            currentState.targetType = 'SUPPLIER';
          }
          if (ev.data?.dateRange && !currentState.dateRange) {
            currentState.dateRange = ev.data.dateRange;
          }
        }
      }
    }
  }

  // Prune messages window for LLM prompt context while keeping key facts
  let slicedMessages = recentMessages;
  let summary: ConversationSummary | undefined = undefined;

  if (recentMessages.length > limit) {
    const olderMsgs = recentMessages.slice(0, recentMessages.length - limit);
    slicedMessages = recentMessages.slice(-limit);

    const summaryText = buildSummaryText(olderMsgs);
    summary = {
      conversationId,
      summaryText,
      keyFacts: extractKeyFacts(olderMsgs),
      lastUpdated: Date.now(),
    };
  }

  return {
    conversationId,
    recentMessages: slicedMessages,
    activeEntities: currentState,
    summary,
    isFollowUp: false,
    inheritedEntities: [],
  };
}

/**
 * Updates memory context state for a new turn.
 */
export function updateMemoryState(
  conversationId: string,
  rawText: string,
  nluResult: NLUResult,
  previousState?: ActiveEntityState
): { updatedState: ActiveEntityState; isFollowUp: boolean } {
  const prevState = previousState || activeStateCache.get(conversationId);
  const { updatedState, isFollowUp } = processEntityInheritance(rawText, nluResult, prevState);

  activeStateCache.set(conversationId, updatedState);
  return { updatedState, isFollowUp };
}

/**
 * Updates active session entity state with execution evidence and final answer outcome.
 */
export function saveTurnExecutionOutcome(
  conversationId: string,
  patch: Partial<ActiveEntityState>
): void {
  const current = activeStateCache.get(conversationId) || { updatedAt: Date.now() };
  const updated: ActiveEntityState = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  activeStateCache.set(conversationId, updated);
}

/**
 * Lists all active conversation sessions.
 */
export async function getConversations(): Promise<ConversationSession[]> {
  try {
    if (!db.aiConversations) return [];
    const convs = await db.aiConversations.toArray();
    const result: ConversationSession[] = [];

    for (const c of convs) {
      const msgs = db.aiMessages
        ? await db.aiMessages.where('conversationId').equals(c.id).toArray()
        : [];

      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].content : undefined;

      result.push({
        id: c.id,
        title: c.title || 'محادثة جديدة',
        messageCount: msgs.length,
        lastMessageSnippet: lastMsg ? lastMsg.slice(0, 40) + '...' : undefined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.warn('Failed to fetch conversation list:', err);
    return [];
  }
}

/**
 * Creates a new conversation thread.
 */
export async function createNewConversation(title?: string): Promise<string> {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const timestamp = Date.now();

  try {
    if (db.aiConversations) {
      await db.aiConversations.add({
        id,
        title: title || 'محادثة جديدة',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  } catch (err) {
    console.warn('Failed to create conversation session:', err);
  }

  activeStateCache.set(id, { updatedAt: timestamp });
  return id;
}

/**
 * Deletes a conversation session and all associated messages.
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    if (db.aiMessages) {
      const keys = await db.aiMessages.where('conversationId').equals(conversationId).primaryKeys();
      await db.aiMessages.bulkDelete(keys as string[]);
    }
    if (db.aiConversations) {
      await db.aiConversations.delete(conversationId);
    }
    activeStateCache.delete(conversationId);
  } catch (err) {
    console.warn('Failed to delete conversation:', err);
  }
}

/**
 * Clears messages for a session.
 */
export async function clearMemory(conversationId: string = DEFAULT_CONVERSATION_ID): Promise<void> {
  await deleteConversation(conversationId);
}

function buildSummaryText(messages: AIMessageRecord[]): string {
  const userQueries = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' | ');

  return `ملخص الأسئلة السابقة في الحوار: ${userQueries.slice(0, 200)}`;
}

function extractKeyFacts(messages: AIMessageRecord[]): string[] {
  const facts: string[] = [];
  messages.forEach(m => {
    if (m.intent) facts.push(`الطلب: ${m.intent}`);
  });
  return facts.slice(-5);
}
