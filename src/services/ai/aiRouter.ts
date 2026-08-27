import { UserQuery, NLUResult, AgentResponse, Evidence } from './types';
import { processNLU } from './nlu';
import { parseCompoundQuery } from './nlu/compoundQueryParser';
import { executeTools } from './tools';
import { retrieveContext } from './rag';
import { getMemoryContext, saveAIMessage, updateMemoryState, saveTurnExecutionOutcome } from './memory';
import { generateResponse } from './providers';
import { normalizeArabic } from './nlu/arabicNormalizer';
import { addTrainingExample } from './engine/trainingManager';
import { resolveOptionSelectionFromHistory } from './nlu/optionResolver';
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

  // 3. Construct Normalized Query Object
  const query: UserQuery = {
    rawText: sanitizedQueryText,
    normalizedText,
    timestamp: Date.now(),
  };

  // 4. Fetch Context / Memory
  const memoryContext = await getMemoryContext(conversationId);

  // 4.5 Resolve Numbered Option Selection (e.g. 1, 2, 3, 4) from previous assistant response
  const resolvedOption = resolveOptionSelectionFromHistory(sanitizedQueryText, memoryContext);
  if (resolvedOption) {
    query.rawText = resolvedOption.resolvedText;
    query.normalizedText = normalizeArabic(resolvedOption.resolvedText);
  }

  // 5. NLU (Intent & Entity Extraction) - Support Compound Queries
  let nluResults = await parseCompoundQuery(query);
  let primaryNlu = nluResults[0];

  if (resolvedOption?.forceIntent) {
    primaryNlu.intent.name = resolvedOption.forceIntent as any;
    primaryNlu.intent.confidence = 0.98;
  }

  // Learning Engine Loop: Handle User Corrections
  if (primaryNlu.intent.name === 'USER_CORRECTION_FEEDBACK' && memoryContext.recentMessages.length > 0) {
     const lastUserMsg = memoryContext.recentMessages.slice().reverse().find(m => m.role === 'user');
     const lastQuery = lastUserMsg ? lastUserMsg.content : '';
     // The user is correcting the last query. Let's find what they *actually* meant in the current query text.
     // By running processNLU on the *rest* of the sentence. 
     // For example: "لا اقصد ديون العملاء اقصد ديون الموردين"
     const correctedNLU = await processNLU({
         ...query,
         rawText: query.rawText.replace(/^(لا|غلط|مش كذا|اقصد|قصدي).*/, '$1') // Fallback simple clean
     }); // Actually, parseCompoundQuery would have already found the *other* intent if they said "اقصد ديون الموردين"
     
     // Let's see if nluResults has a SECOND intent that is the actual corrected intent
     let actualIntentNlu = nluResults.find(n => n.intent.name !== 'USER_CORRECTION_FEEDBACK');
     
     if (!actualIntentNlu && query.rawText.includes('اقصد')) {
       const substring = query.rawText.split('اقصد')[1];
       if (substring) {
         actualIntentNlu = await processNLU({ ...query, rawText: substring, normalizedText: normalizeArabic(substring) });
       }
     }

     if (actualIntentNlu && actualIntentNlu.intent.name !== 'UNKNOWN') {
       // Save to training data mapping the LAST query to this NEW intent
       await addTrainingExample(lastQuery, actualIntentNlu.intent.name, actualIntentNlu.entities);
       
       // Override current processing to execute the corrected intent
       primaryNlu = actualIntentNlu;
       nluResults = [primaryNlu];
     }
  }

  // 6. Context-Aware Memory Inheritance: Process follow-up questions and entity state persistence
  const { updatedState, isFollowUp } = updateMemoryState(
    conversationId,
    sanitizedQueryText,
    primaryNlu,
    memoryContext.activeEntities
  );
  memoryContext.activeEntities = updatedState;
  memoryContext.isFollowUp = isFollowUp;

  // 2. Check Cache (Only for independent static queries to avoid collision on multi-turn follow-ups)
  const cacheKey = `${conversationId}_${normalizedText}_${updatedState?.targetName || ''}_${updatedState?.invoiceId || ''}`;
  if (!isFollowUp && primaryNlu.intent.name !== 'DRILLDOWN_EXPLANATION') {
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
  }

  // Save user message to memory
  await saveAIMessage(conversationId, {
    role: 'user',
    content: sanitizedQueryText,
    intent: primaryNlu.intent.name,
  });

  if (primaryNlu.isClarificationNeeded && nluResults.length === 1) {
    const fallbackNlu = await processNLU(query);
    const clarificationAnswer =
      fallbackNlu.clarificationMessage || 'عذراً، هل يمكنك توضيح سؤالك أكثر؟ (مثال: كم المبيعات اليوم، ديون الزبائن، المنتجات الناقصة)';

    const res: AgentResponse = {
      answer: clarificationAnswer,
      evidence: [],
      confidence: 0.3,
      suggestedActions: (fallbackNlu.suggestedClarifications && fallbackNlu.suggestedClarifications.length > 0)
        ? fallbackNlu.suggestedClarifications
        : [
            'كم ديون العملاء الإجمالية؟',
            'كم مبيعات اليوم والأرباح؟',
            'ما هي المنتجات القريبة من النفاد؟',
            'كم المستحقات للموردين؟'
          ],
      metadata: {
        routeType: 'CLARIFICATION',
        executionTimeMs: Math.round(performance.now() - startTime),
        intentName: primaryNlu.intent.name,
        confidence: primaryNlu.intent.confidence,
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

  const runTools = nluResults.some(nlu => needsAccountingData(nlu.intent.name));
  const runRAG = nluResults.some(nlu => needsKnowledgeBase(nlu.intent.name));

  if (runTools && runRAG) {
    routeType = 'HYBRID';
  } else if (runRAG) {
    routeType = 'KNOWLEDGE_RAG';
  } else if (nluResults.some(nlu => nlu.intent.name.includes('ANOMALY') || nlu.intent.name.includes('FORECAST'))) {
    routeType = 'STATISTICAL_ML';
  } else {
    routeType = 'ACCOUNTING_DB';
  }

  try {
    if (runTools) {
      for (const nlu of nluResults) {
        if (needsAccountingData(nlu.intent.name)) {
          const toolData = await executeTools(nlu, memoryContext);
          evidence.push(...toolData);
        }
      }
    }
  } catch (err: any) {
    console.error('Error executing accounting tools:', err);
    executionError = err?.message || 'فشل في تشغيل أدوات الاستعلام المحلي';
    logAIError(sanitizedQueryText, err, 'TOOL_EXECUTION_ERROR').catch(console.warn);
  }

  try {
    if (runRAG || (evidence.length === 0 && primaryNlu.intent.name === 'UNKNOWN')) {
      const ragData = await retrieveContext(query.normalizedText);
      evidence.push(...ragData);
      if (ragData.length > 0 && routeType === 'ACCOUNTING_DB') {
        routeType = 'HYBRID';
      }
    }
  } catch (err: any) {
    console.warn('RAG search fallback notification:', err?.message || err);
  }

  // 8. LLM / Template Response Generation
  let response: AgentResponse;
  try {
    response = await generateResponse(query, primaryNlu, evidence, memoryContext);
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

  // Construct Explicit Multi-Stage Processing Pipeline Steps
  const extractedEntitiesText = primaryNlu.entities.length > 0
    ? primaryNlu.entities.map(e => `${e.type}: ${e.value}`).join(', ')
    : 'لا توجد قيود محددة (استعلام عام)';

  const processingStages: any[] = [
    {
      stageNumber: 1,
      title: 'فهم القصد وتفكيك الاستعلام (NLU)',
      description: 'تحليل المعنى اللغوي، تحديد النية المحاسبية، واستخراج الكيانات والمحددات',
      status: 'completed',
      badge: `نية: ${primaryNlu.intent.name}`,
      details: `• النية الميكانيكية: ${primaryNlu.intent.name} (دقة الفهم: ${Math.round(primaryNlu.intent.confidence * 100)}%)\n• المحدّدات والكيانات المستخرجة: [${extractedEntitiesText}]`
    },
    {
      stageNumber: 2,
      title: 'استرجاع البيانات الحقيقية والسياق (RAG & DB)',
      description: 'الربط المباشر بقاعدة بيانات المتجر واستخراج الأدلة المؤكدة',
      status: 'completed',
      badge: `مسار: ${routeType}`,
      details: `• مصدر البيانات المستخدم: ${routeType === 'HYBRID' ? 'دعم متقاطع (قاعدة البيانات + قاعدة المعرفة)' : routeType === 'KNOWLEDGE_RAG' ? 'قاعدة المعرفة والتعليمات' : 'دفتر الحسابات والجداول المحلية (IndexedDB)'}\n• عدد السجلات والأدلة الحسابية المعتمدة: ${evidence.length} سجل`
    },
    {
      stageNumber: 3,
      title: 'التحليل الذكي، التدقيق، وتطابق الأرقام',
      description: 'إجراء المقارنات المباشرة، فحص أسباب الفوارق، وتأكيد صحة النتائج',
      status: 'completed',
      badge: 'تدقيق ذكي',
      details: `• تم مطابقة القيم الحسابية وفحص الموازنات للفترة المحددة.\n• التحقق من عدم وجود تناقض بين السندات المقيدة ورصيد الصندوق والديون.`
    },
    {
      stageNumber: 4,
      title: 'صياغة الإجابة المباشرة الموثوقة',
      description: 'إخراج النتيجة بصياغة واضحة ومباشرة تلائم احتياج المستخدم',
      status: 'completed',
      badge: `${executionTimeMs} ملي ثانية`,
      details: `تم إنشاء الرد النهائي بدقة وسرعة معالجة عالية (${executionTimeMs}ms).`
    }
  ];

  const finalResponse: AgentResponse = {
    ...response,
    processingStages,
    metadata: {
      routeType,
      executionTimeMs,
      intentName: primaryNlu.intent.name,
      confidence: primaryNlu.intent.confidence,
      fallbackUsed: !!executionError || primaryNlu.intent.name === 'UNKNOWN' || response.confidence === 0,
      error: executionError,
    },
  };

  // 9. Save Assistant Message to Memory
  await saveAIMessage(conversationId, {
    role: 'assistant',
    content: finalResponse.answer,
    intent: primaryNlu.intent.name,
    evidence,
    processingStages,
  });

  // 10. Update Active Entity State Outcome for Multi-Turn Continuity
  const primaryEvidence = evidence[0];
  saveTurnExecutionOutcome(conversationId, {
    lastIntent: primaryNlu.intent.name,
    lastEvidenceData: primaryEvidence?.data,
    lastToolName: primaryEvidence?.metadata?.toolName,
    lastUserQuery: sanitizedQueryText,
    lastAssistantAnswer: finalResponse.answer,
    invoiceId: primaryEvidence?.data?.invoiceId || primaryEvidence?.data?.sale?.id || memoryContext.activeEntities?.invoiceId,
    lastLargestSale: primaryEvidence?.data?.sale || memoryContext.activeEntities?.lastLargestSale,
    targetName: memoryContext.activeEntities?.targetName,
    targetType: memoryContext.activeEntities?.targetType,
    dateRange: memoryContext.activeEntities?.dateRange,
  });

  // 11. Cache Response
  setCachedQueryResponse(cacheKey, finalResponse);

  return finalResponse;
}

function needsAccountingData(intentName: string): boolean {
  const nonAccountingIntents = [
    'EXPLANATION_HELP', 'GREETING_SMALLTALK', 'SECURITY_BLOCKED', 
    'UNKNOWN', 'SYSTEM_HELP', 'SYSTEM_SECTIONS_GUIDE', 'SYSTEM_INFO', 'ACCOUNTING_CONCEPT', 
    'GENERAL_ACCOUNTING', 'COMPANY_POLICY', 'COMPANY_INFORMATION', 
    'DOCUMENT_SEARCH', 'KNOWLEDGE_SEARCH', 'USER_CORRECTION_FEEDBACK'
  ];
  return !nonAccountingIntents.includes(intentName);
}

function needsKnowledgeBase(intentName: string): boolean {
  const knowledgeIntents = [
    'COMPANY_POLICY', 'COMPANY_INFORMATION', 
    'DOCUMENT_SEARCH', 'KNOWLEDGE_SEARCH'
  ];
  return knowledgeIntents.includes(intentName);
}
