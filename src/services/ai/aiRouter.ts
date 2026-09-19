import { UserQuery, NLUResult, Evidence, AgentResponse } from './types';
import { normalizeArabic } from './nlu/arabicNormalizer';
import { processNLU } from './nlu';
import { executeTools } from './tools';
import { retrieveContext } from './rag';
import { getMemoryContext, saveAIMessage, updateMemoryState, saveTurnExecutionOutcome } from './memory';
import { generateResponse } from './providers';
import { preloadTrainingData } from './engine/trainingManager';
import { seedExtendedKnowledgeBase } from './knowledge/knowledgeStore';

let isInitialized = false;

/**
 * Ensures offline training data and system knowledge bases are seeded and preloaded locally.
 */
async function ensureAiInitialized() {
  if (isInitialized) return;
  try {
    await Promise.all([
      preloadTrainingData(),
      seedExtendedKnowledgeBase(),
    ]);
    isInitialized = true;
  } catch (err) {
    console.warn('Error during local AI initialization:', err);
  }
}

function mapIntentToTopic(intentName: string): 'DEBT' | 'SALES' | 'PROFIT' | 'INVENTORY' | 'SUPPLIER' | 'INVOICE' | 'EXPENSE' | 'FINANCIAL_REPORT' | 'LARGEST_SALE' | 'GENERAL' {
  if (intentName.includes('DEBT') || intentName.includes('CUSTOMER')) return 'DEBT';
  if (intentName.includes('SALES')) return 'SALES';
  if (intentName.includes('PROFIT')) return 'PROFIT';
  if (intentName.includes('INVENTORY') || intentName.includes('STOCK') || intentName.includes('PRODUCT')) return 'INVENTORY';
  if (intentName.includes('SUPPLIER')) return 'SUPPLIER';
  if (intentName.includes('INVOICE')) return 'INVOICE';
  if (intentName.includes('EXPENSE') || intentName.includes('CASH')) return 'EXPENSE';
  if (intentName.includes('FINANCIAL') || intentName.includes('REPORT')) return 'FINANCIAL_REPORT';
  if (intentName.includes('LARGEST')) return 'LARGEST_SALE';
  return 'GENERAL';
}

/**
 * Main Autonomous Local AI Router:
 * Processes Arabic natural language queries 100% offline using local NLU,
 * IndexedDB accounting tools, vector RAG semantic search, machine learning, and knowledge graphs.
 */
export const routeUserQuery = async (queryText: string, context?: any): Promise<AgentResponse> => {
  const startTime = Date.now();
  await ensureAiInitialized();

  const conversationId = typeof context === 'string'
    ? context
    : (context?.conversationId || context?.activeConversationId || 'default_session');

  const rawText = (queryText || '').trim();
  if (!rawText) {
    return {
      answer: 'يرجى إدخال استفسارك أو اختيار سؤال جاهز من القائمة.',
      evidence: [],
      confidence: 1.0,
    };
  }

  // 1. Load Conversation Memory & History
  const memoryContext = await getMemoryContext(conversationId);

  // 2. Construct User Query Object
  const userQuery: UserQuery = {
    rawText,
    normalizedText: normalizeArabic(rawText),
    timestamp: Date.now(),
    context: {
      activeCustomer: typeof context === 'object' ? context?.activeCustomer : undefined,
      activeSupplier: typeof context === 'object' ? context?.activeSupplier : undefined,
      lastTargetName: memoryContext.activeEntities?.targetName,
      lastIntent: memoryContext.activeEntities?.lastIntent,
    },
  };

  // 3. Process Local Natural Language Understanding (NLU, Stems, Synonyms, Entities, Intent)
  const nluResult: NLUResult = await processNLU(userQuery);

  // 4. Update Memory State with Entity Tracking & Multi-turn Inheritance
  const { updatedState, isFollowUp } = updateMemoryState(
    conversationId,
    rawText,
    nluResult,
    memoryContext.activeEntities
  );
  memoryContext.activeEntities = updatedState;
  memoryContext.isFollowUp = isFollowUp;

  // 5. Handle Clarification if query is ambiguous
  if (
    nluResult.isClarificationNeeded &&
    nluResult.clarificationMessage &&
    (!nluResult.intent || nluResult.intent.name === 'UNKNOWN' || nluResult.intent.confidence < 0.25)
  ) {
    const clarResponse: AgentResponse = {
      answer: nluResult.clarificationMessage,
      evidence: [],
      confidence: nluResult.intent.confidence || 0.3,
      suggestedActions: nluResult.suggestedClarifications,
      metadata: {
        routeType: 'CLARIFICATION',
        executionTimeMs: Date.now() - startTime,
        intentName: nluResult.intent.name,
        confidence: nluResult.intent.confidence,
      },
    };

    // Save to local memory
    await saveAIMessage(conversationId, {
      role: 'user',
      content: rawText,
      intent: nluResult.intent.name,
    });
    await saveAIMessage(conversationId, {
      role: 'assistant',
      content: clarResponse.answer,
      intent: nluResult.intent.name,
    });

    return clarResponse;
  }

  // 6. Execute Local Accounting DB Tools
  let evidences: Evidence[] = [];
  try {
    evidences = await executeTools(nluResult, memoryContext);
  } catch (toolErr) {
    console.warn('Local tool execution error:', toolErr);
  }

  // 7. Retrieve Context from Local RAG / Knowledge Base if needed
  if (
    evidences.length === 0 ||
    ['SYSTEM_SECTIONS_GUIDE', 'SYSTEM_HELP', 'ACCOUNTING_CONCEPT', 'SYSTEM_INFO'].includes(nluResult.intent.name)
  ) {
    try {
      const ragEvidences = await retrieveContext(rawText);
      if (ragEvidences && ragEvidences.length > 0) {
        evidences = [...evidences, ...ragEvidences];
      }
    } catch (ragErr) {
      console.warn('Local RAG retrieval error:', ragErr);
    }
  }

  // 8. Generate Clear & Accurate Accounting Response
  const response = await generateResponse(userQuery, nluResult, evidences, memoryContext);

  // 9. Persist Interaction into IndexedDB Memory
  try {
    await saveAIMessage(conversationId, {
      role: 'user',
      content: rawText,
      intent: nluResult.intent.name,
    });
    await saveAIMessage(conversationId, {
      role: 'assistant',
      content: response.answer,
      intent: nluResult.intent.name,
      evidence: evidences,
    });

    saveTurnExecutionOutcome(conversationId, {
      lastIntent: nluResult.intent.name,
      lastTopic: mapIntentToTopic(nluResult.intent.name),
      lastEvidenceData: evidences[0]?.data,
      lastToolName: evidences[0]?.metadata?.toolName,
      lastUserQuery: rawText,
      lastAssistantAnswer: response.answer,
    });
  } catch (saveErr) {
    console.warn('Failed to save message to local memory:', saveErr);
  }

  return response;
};

/**
 * Convenience wrapper returning the formatted Arabic answer string.
 */
export const processUserQuery = async (query: string, context?: any): Promise<string> => {
  const result = await routeUserQuery(query, context);
  return result.answer;
};

