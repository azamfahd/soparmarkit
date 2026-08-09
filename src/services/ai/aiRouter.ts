import { UserQuery, NLUResult, AgentResponse, Evidence } from './types';
import { processNLU } from './nlu';
import { executeTools } from './tools';
import { retrieveContext } from './rag';
import { getMemoryContext, saveAIMessage, updateMemoryState } from './memory';
import { generateResponse } from './providers';
import { normalizeArabic } from './nlu/arabicNormalizer';
import {
  validateQuerySecurity,
  getCachedQueryResponse,
  setCachedQueryResponse,
} from './evaluation';
import { logAIError } from './feedback';

/**
 * Intelligent Query Router with Security, Memory, Caching, and Optimization
 * Orchestrates the flow of processing a user's question.
 */
export async function processUserQuery(
  rawQuery: string,
  conversationId = 'default_session'
): Promise<AgentResponse> {
  const startTime = performance.now();

  // 1. Security Validation
  const validation = validateQuerySecurity(rawQuery);
  if (!validation.isValid) {
    return {
      answer: validation.errorReason || 'عذراً، السؤال غير صالح.',
      evidence: [],
      confidence: 1,
      metadata: {
        routeType: 'FALLBACK',
        executionTimeMs: Math.round(performance.now() - startTime),
        intentName: 'SECURITY_BLOCKED',
        confidence: 1,
        fallbackUsed: true,
      },
    };
  }

  const sanitizedQueryText = validation.sanitizedText;
  const normalizedText = normalizeArabic(sanitizedQueryText);

  // 2. Check Cache
  const cacheKey = `${conversationId}_${normalizedText}`;
  const cachedResponse = getCachedQueryResponse(cacheKey);
  if (cachedResponse) {
    return {
      ...cachedResponse,
      metadata: {
        ...cachedResponse.metadata,
        executionTimeMs: Math.round(performance.now() - startTime),
      },
    };
  }

  // 3. Construct Normalized Query Object
  const query: UserQuery = {
    rawText: sanitizedQueryText,
    normalizedText,
    timestamp: Date.now(),
  };

  // 4. Fetch Context / Memory
  const memoryContext = await getMemoryContext(conversationId);

  // 5. NLU (Intent & Entity Extraction)
  const nluResult: NLUResult = await processNLU(query);

  // 6. Context-Aware Memory Inheritance: Process follow-up questions and entity state persistence
  const { updatedState, isFollowUp } = updateMemoryState(
    conversationId,
    sanitizedQueryText,
    nluResult,
    memoryContext.activeEntities
  );
  memoryContext.activeEntities = updatedState;
  memoryContext.isFollowUp = isFollowUp;

  // Save user message to memory
  await saveAIMessage(conversationId, {
    role: 'user',
    content: sanitizedQueryText,
    intent: nluResult.intent.name,
  });

  if (nluResult.isClarificationNeeded) {
    const clarificationAnswer =
      nluResult.clarificationMessage || 'عذراً، هل يمكنك توضيح سؤالك أكثر؟ (مثال: كم المبيعات اليوم، ديون الزبائن، المنتجات الناقصة)';

    const res: AgentResponse = {
      answer: clarificationAnswer,
      evidence: [],
      confidence: 0.3,
      suggestedActions: [
        'كم ديون العملاء الإجمالية؟',
        'كم مبيعات اليوم والأرباح؟',
        'ما هي المنتجات القريبة من النفاد؟',
        'كم المستحقات للموردين؟'
      ],
      metadata: {
        routeType: 'CLARIFICATION',
        executionTimeMs: Math.round(performance.now() - startTime),
        intentName: nluResult.intent.name,
        confidence: nluResult.intent.confidence,
        fallbackUsed: true,
      },
    };

    await saveAIMessage(conversationId, {
      role: 'assistant',
      content: res.answer,
      intent: 'CLARIFICATION',
    });

    return res;
  }

  // 7. Route Classification & Data Retrieval Pipeline
  let evidence: Evidence[] = [];
  let routeType: 'ACCOUNTING_DB' | 'KNOWLEDGE_RAG' | 'STATISTICAL_ML' | 'HYBRID' | 'FALLBACK' = 'ACCOUNTING_DB';
  let executionError: string | undefined;

  const runTools = needsAccountingData(nluResult.intent.name);
  const runRAG = needsKnowledgeBase(nluResult.intent.name);

  if (runTools && runRAG) {
    routeType = 'HYBRID';
  } else if (runRAG) {
    routeType = 'KNOWLEDGE_RAG';
  } else if (nluResult.intent.name.includes('ANOMALY') || nluResult.intent.name.includes('FORECAST')) {
    routeType = 'STATISTICAL_ML';
  } else {
    routeType = 'ACCOUNTING_DB';
  }

  try {
    if (runTools) {
      const toolData = await executeTools(nluResult);
      evidence.push(...toolData);
    }
  } catch (err: any) {
    console.error('Error executing accounting tools:', err);
    executionError = err?.message || 'فشل في تشغيل أدوات الاستعلام المحلي';
    logAIError(sanitizedQueryText, err, 'TOOL_EXECUTION_ERROR').catch(console.warn);
  }

  try {
    if (runRAG || (evidence.length === 0 && nluResult.intent.name === 'UNKNOWN')) {
      const ragData = await retrieveContext(query.normalizedText);
      evidence.push(...ragData);
      if (ragData.length > 0 && routeType === 'ACCOUNTING_DB') {
        routeType = 'HYBRID';
      }
    }
  } catch (err: any) {
    console.error('Error executing RAG search:', err);
    if (!executionError) executionError = err?.message || 'فشل في البحث في قاعدة المعرفة';
    logAIError(sanitizedQueryText, err, 'RAG_SEARCH_ERROR').catch(console.warn);
  }

  // 8. LLM / Template Response Generation
  let response: AgentResponse;
  try {
    response = await generateResponse(query, nluResult, evidence, memoryContext);
  } catch (err: any) {
    console.error('Error generating response:', err);
    response = {
      answer: 'عذراً، حدث خطأ أثناء معالجة الإجابة. يرجى المحاولة مرة أخرى.',
      evidence: [],
      confidence: 0,
    };
    executionError = err?.message || 'فشل توليد الإجابة';
    logAIError(sanitizedQueryText, err, 'RESPONSE_GENERATION_ERROR').catch(console.warn);
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  const finalResponse: AgentResponse = {
    ...response,
    metadata: {
      routeType,
      executionTimeMs,
      intentName: nluResult.intent.name,
      confidence: nluResult.intent.confidence,
      fallbackUsed: !!executionError || nluResult.intent.name === 'UNKNOWN',
      error: executionError,
    },
  };

  // 9. Save Assistant Message to Memory
  await saveAIMessage(conversationId, {
    role: 'assistant',
    content: finalResponse.answer,
    intent: nluResult.intent.name,
    evidence,
  });

  // 10. Cache Response
  setCachedQueryResponse(cacheKey, finalResponse);

  return finalResponse;
}

function needsAccountingData(intentName: string): boolean {
  const nonAccountingIntents = ['EXPLANATION_HELP', 'GENERAL_SMALLTALK', 'SECURITY_BLOCKED'];
  return !nonAccountingIntents.includes(intentName);
}

function needsKnowledgeBase(intentName: string): boolean {
  return intentName === 'EXPLANATION_HELP' || intentName === 'COMPANY_KNOWLEDGE';
}
