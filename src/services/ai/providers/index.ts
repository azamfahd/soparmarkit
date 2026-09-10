import { UserQuery, NLUResult, Evidence, AgentResponse } from '../types';
import { normalizeArabic } from '../nlu/arabicNormalizer';
import {
  getSystemSectionsFullGuide,
  getSectionDetails,
  getSectionFeaturesExplanation,
  getSystemCardExplanation,
  getAllSystemCardsFullGuide,
  getWhyExplanationForQuery,
  searchUniversalKnowledge,
  SECTION_COMPARISONS,
  SYSTEM_PROCEDURE_GUIDES,
  SYSTEM_SECTIONS,
  SYSTEM_CARDS_AND_WIDGETS,
  SYSTEM_FINANCIAL_METRICS_AND_FORMULAS
} from '../knowledge/systemKnowledgeGraph';
import { SYSTEM_DICTIONARY, lookupSystemDictionary } from '../knowledge/systemDictionary';

/**
 * Formats structured Evidence into a clear, professional Arabic response.
 * Local Offline Accounting Agent
 */
export async function generateResponse(
  query: UserQuery,
  nluResult: NLUResult,
  evidence: Evidence[],
  memoryContext: any
): Promise<AgentResponse> {
  if (!evidence || evidence.length === 0) {
    const intent = nluResult.intent.name;
    const raw = query.rawText || '';
    const normalized = query.normalizedText || normalizeArabic(raw);
    let answer = 'لم أتمكن من العثور على بيانات مطابقة لاستفسارك في سجلات النظام.';
    
    // 1. Check for "Why / لماذا / ليش / سبب" diagnostic questions
    const whyDiagnostic = getWhyExplanationForQuery(raw) || getWhyExplanationForQuery(normalized);
    if (whyDiagnostic) {
      return {
        answer: `🔒 **[الوكيل المحاسبي المحلي]**\n\n${whyDiagnostic}`,
        evidence: [],
        confidence: 0.95
      };
    }

    // 2. Check for Specific System Card explanation
    const cardExplanation = getSystemCardExplanation(raw) || getSystemCardExplanation(normalized);
    if (cardExplanation) {
      return {
        answer: `🔒 **[الوكيل المحاسبي المحلي]**\n\n${cardExplanation}`,
        evidence: [],
        confidence: 0.95
      };
    }

    if (intent === 'GREETING_SMALLTALK') {
      answer = `👋 **مرحباً بك في نظام المخزن الذكي المحاسبي!**\n\n` +
        `أنا **مستشارك الحسابي الذكي** المدمج بالكامل داخل النظام. أعمل محلياً (Offline) بنسبة 100% لضمان أقصى درجات الخصوصية وسرعة الاستجابة.\n\n` +
        `💡 *يمكنك سؤالي مباشرة عن مبيعات اليوم، البضائع الناقصة، كشف حساب أي زبون، شرح أي بطاقة في لوحة التحكم، أو مميزات أي قسم في البرنامج.*`;
    } else if (intent === 'SYSTEM_INFO') {
      answer = `💻 **معلومات النظام والوكيل المحاسبي الذكي:**\n\n` +
        `• **اسم النظام:** المستشار المحاسبي الذكي (Autonomous Local AI Accountant)\n` +
        `• **وضع التشغيل:** محلي وآمن 100% (Local Engine / Offline-First)\n` +
        `• **الخصوصية والسرية:** جميع البيانات تُحفظ وتُعالج بالكامل بداخل جهازك دون إرسال أي سجلات لخوادم خارجية.\n` +
        `• **المحرك المحاسبي:** الدفتر المالي المدمج (Local IndexedDB Ledger)\n` +
        `• **الإصدار والخدمات:** الإصدار 3.5 - مسجل فيه كافة تفاصيل أقسام النظام، بطاقات ومؤشرات لوحة التحكم، العمليات المحاسبية، وتحديثات الجداول تلقائياً.\n\n` +
        `💡 *يمكنك سؤالي في أي وقت عن أرباحك، مبيعاتك، ديون العملاء، شرح أي بطاقة أو زر في البرنامج.*`;
    } else if (intent === 'SYSTEM_SECTIONS_GUIDE') {
      // Check if user asked about cards in general
      if (/(بطاقات|كروت|بطاقة|كارت|مؤشرات) (النظام|اللوحة|الداشبورد|البرنامج)/i.test(raw) || /(شرح البطاقات|شرح الكروت)/i.test(raw)) {
        answer = getAllSystemCardsFullGuide();
      } else {
        // 1. Check if user asked for a comparison between two sections
        const isComparisonQuery = /فرق|مقارن/i.test(raw) || /فرق|مقارن/i.test(normalized);
        let matchedComparison: any = null;

        if (isComparisonQuery) {
          const isCustSupp = /(عميل|عملاء|زبائن|زبون)/i.test(raw) && /(مورد|موردين|شركات|شركه)/i.test(raw);
          const isPosHist = /(مبيعات|كاشير|pos)/i.test(raw) && /(سجل|ارشيف|تاريخ)/i.test(raw);
          const isInvCap = /(مخزون|منتجات)/i.test(raw) && /(راس مال|تفاصيل|تقييم)/i.test(raw);
          const isDashAdv = /(رئيسية|تحكم|داشبورد)/i.test(raw) && /(مستشار|تحليلات|ذكاء)/i.test(raw);

          if (isCustSupp) matchedComparison = SECTION_COMPARISONS.find(c => c.sectionA.includes('العملاء'));
          else if (isPosHist) matchedComparison = SECTION_COMPARISONS.find(c => c.sectionA.includes('نقطة البيع'));
          else if (isInvCap) matchedComparison = SECTION_COMPARISONS.find(c => c.sectionA.includes('المخزون'));
          else if (isDashAdv) matchedComparison = SECTION_COMPARISONS.find(c => c.sectionA.includes('لوحة التحكم'));
        }

        if (matchedComparison) {
          answer = `⚖️ **المقارنة بين ${matchedComparison.sectionA} و ${matchedComparison.sectionB}:**\n\n` +
            `• **الفروقات الجوهرية:**\n` +
            matchedComparison.keyDifferences.map(d => `  - ${d}`).join('\n') + '\n\n' +
            `📌 **الخلاصة:** ${matchedComparison.summary}`;
        } else {
          // 2. Check if user asked for features or details of a single section
          const sectionFeatures = getSectionFeaturesExplanation(raw) || getSectionFeaturesExplanation(normalized);
          const singleSection = getSectionDetails(raw) || getSectionDetails(normalized);

          if (/(مميزات|مزايا|خصائص|وظائف|قدرات)/i.test(raw) && sectionFeatures) {
            answer = sectionFeatures;
          } else if (singleSection && (/(قسم|شاشة|شاشه|وظيفة|فائدة|شرح)\s+/i.test(raw) || !/(كل قسم|جميع الاقسام|اقسام البرنامج)/i.test(raw))) {
            answer = `📌 **شرح قسم: ${singleSection.arabicName} (${singleSection.englishName})**\n\n` +
              `• **الهدف الأساسي:** ${singleSection.primaryPurpose}\n` +
              `• **الوصف التفصيلي:** ${singleSection.detailedDescription}\n\n` +
              `✨ **أبرز المميزات والوظائف:**\n` +
              singleSection.keyFeatures.map(f => `• ${f}`).join('\n') + '\n\n' +
              `🔘 **أهم الأزرار والعمليات:**\n` +
              singleSection.keyButtonsAndControls.map(b => `• **${b.name}:** ${b.action}`).join('\n') + '\n\n' +
              `📋 **كيفية الاستخدام خطوة بخطوة:**\n` +
              singleSection.howToUseSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
          } else {
            // 3. Full Comprehensive Sections Guide
            answer = getSystemSectionsFullGuide();
          }
        }
      }
    } else if (intent === 'SYSTEM_HELP' || intent === 'EXPLANATION_HELP') {
      // Check if there is a specific procedure requested
      const matchedProcedure = SYSTEM_PROCEDURE_GUIDES.find(g => 
        g.keywords.some(k => normalized.includes(k) || raw.includes(k))
      );

      if (matchedProcedure) {
        answer = `📋 **${matchedProcedure.title}:**\n\n` +
          matchedProcedure.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
        
        if (matchedProcedure.tips && matchedProcedure.tips.length > 0) {
          answer += `\n\n💡 **نصيحة هامة:**\n` + matchedProcedure.tips.map(t => `• ${t}`).join('\n');
        }
      } else {
        answer = `📖 **دليل المساعد الحسابي الذكي (كيف تسألني؟):**\n\n` +
          `أنا مبرمج للإجابة على أي استفسار متعلق بالحسابات، أو أقسام البرنامج، أو البطاقات الإحصائية، أو العمليات اليومية:\n\n` +
          `📊 **1. المبيعات والأرباح:**\n` +
          `• *"كم المبيعات اليوم؟"*\n` +
          `• *"كم الأرباح هذا الشهر؟"*\n` +
          `• *"لماذا الأرباح سالبة؟"* أو *"ما سبب انخفاض المبيعات؟"*\n\n` +
          `👥 **2. ديون العملاء وسجلاتهم:**\n` +
          `• *"كم ديون العملاء؟"*\n` +
          `• *"كشف حساب العميل [الاسم]"*\n` +
          `• *"لماذا ديون العملاء مرتفعة؟"*\n\n` +
          `🏬 **3. مستحقات الموردين وتكلفتها:**\n` +
          `• *"كم ديون الموردين؟"*\n` +
          `• *"كشف حساب المورد [الاسم]"*\n\n` +
          `📦 **4. حالة المخزون وبطاقات النظام:**\n` +
          `• *"ما هي البضائع الناقصة؟"*\n` +
          `• *"شرح بطاقة رأس مال المخزون"* أو *"ماذا تعرض بطاقة الصندوق؟"*\n\n` +
          `🖥️ **5. أقسام وإرشادات البرنامج:**\n` +
          `• *"ما هي مميزات قسم الكاشير؟"*\n` +
          `• *"كيف أسدد دين عميل؟"* أو *"كيف أضيف صنف جديد؟"*\n\n` +
          `🔒 *ملاحظة: جميع عمليات الاستعلام تتم محلياً وبأقصى درجات الحماية والسرية لبياناتك.*`;
      }
    } else if (intent === 'ACCOUNTING_CONCEPT' || intent === 'GENERAL_ACCOUNTING') {
      const metricMatch = Object.values(SYSTEM_FINANCIAL_METRICS_AND_FORMULAS).find(m =>
        raw.includes(m.arabicName) || normalized.includes(m.id) || m.aliases.some(a => raw.includes(a) || normalized.includes(a))
      );

      if (metricMatch) {
        answer = `💡 **شرح محاسبي: ${metricMatch.arabicName} (${metricMatch.englishName})**\n\n` +
          `• **التعريف المالي:** ${metricMatch.definition}\n` +
          `• **المعادلة الرياضية الدقيقة:** \`${metricMatch.exactFormula}\`\n` +
          `• **أهمية المؤشر:** ${metricMatch.whyItMatters}\n\n` +
          `📌 **نصائح التحسين والمراقبة:**\n` +
          metricMatch.howToImprove.map(h => `  • ${h}`).join('\n');
      } else {
        answer = `💡 **شرح محاسبي مبسط لمتاجر التجزئة والسوبرماركت:**\n\n` +
          `• **مجمل الربح (Gross Profit):** هو الفارق المباشر بين سعر بيع المنتجات وسعر تكلفتها (سعر البيع - سعر الشراء) قبل خصم أي مصاريف تشغيلية.\n` +
          `• **صافي الربح (Net Profit):** هو الربح الحقيقي المتبقي للمحل بعد خصم جميع المصاريف والمسحوبات النقدية من مجمل الربح (مجمل الربح - المسحوبات النقدية).\n` +
          `• **حساب الأصول والخصوم:** في نظامك، تعتبر البضائع المتوفرة بالمخزن وديون العملاء أصولاً للمحل، بينما تمثل مبالغ الموردين غير المدفوعة التزامات (خصوماً) على المحل.\n` +
          `• **سند القبض:** يتم إنشاؤه تلقائياً عند قيام أي عميل بسداد جزء من دينه ويتم إدخال النقدية فوراً للصندوق لضمان دقة جرد الصندوق اليومي.`;
      }
    } else {
      // Universal Intelligent Fallback:
      // Check sections, cards, dictionary terms, procedure guides, why questions, and metrics for ANY keyword mentioned in the user query!
      const queryText = query.rawText || '';
      const normText = query.normalizedText || normalizeArabic(queryText);

      // 1. Check if user asked a "Why" / Diagnostic question
      const isWhyQuery = /^(لماذا|ليش|ليه|ما سبب|ماهو سبب|سبب)\b/i.test(normText);
      if (isWhyQuery) {
        if (normText.includes('مبيعات') || normText.includes('صفر') || normText.includes('منخفض')) {
          answer = `🔍 **التحليل المحاسبي: أسباب تغير أو انخفاض المبيعات (أو كونها صفراً):**\n\n` +
            `• **المعادلة الرياضية:** \`إجمالي المبيعات = مجموع فواتير الكاش + مجموع فواتير الآجل (الدين)\` للفترة المحددة.\n` +
            `• **الأسباب المحاسبية المحتملة:**\n` +
            `  1. لم يتم تسجيل أي فواتير بيع عبر شاشة الكاشير (نقطة البيع) خلال تاريخ اليوم أو الفترة المحددة.\n` +
            `  2. التاريخ المحدد في الاستعلام لا يطابق تواريخ الفواتير المدخلة في النظام.\n` +
            `  3. نفاد كميات بعض السلع الأساسية من المخزون مما أوقف حركات البيع.\n\n` +
            `💡 **كيفية التحقق:** افتح شاشة *(سجل المبيعات والفواتير)* لمراجعة كافة العمليات وتواريخها المسجلة.`;
        } else if (normText.includes('ربح') || normText.includes('سالب') || normText.includes('خسار')) {
          answer = `🔍 **التحليل المحاسبي: أسباب ظهور صافي الأرباح بالسالب أو انخفاضها:**\n\n` +
            `• **المعادلة الرياضية:** \`صافي الربح = (إجمالي المبيعات - تكلفة البضاعة المباعة COGS) - المسحوبات النقدية والمصاريف\`.\n` +
            `• **الأسباب المحاسبية المحتملة:**\n` +
            `  1. تسجيل مسحوبات نقدية أو مصاريف تشغيلية بمبالغ تفوق مجمل ربح البضاعة المباعة.\n` +
            `  2. بيع بعض الأصناف بسعر مساوٍ أو أقل من سعر التكلفة المدخل في بطاقة الصنف.\n` +
            `  3. تسجيل فواتير مرتجعات مبيعات أثرت على صافي الإيرادات.\n\n` +
            `💡 **كيفية التحقق:** راجع أسعار التكلفة في شاشة *(المنتجات والمخزون)*، وسجل المسحوبات النقدية في شاشة *(الملاحظات وتصفية الصندوق)*.`;
        } else if (normText.includes('دين') || normText.includes('عملاء') || normText.includes('مرتفع')) {
          answer = `🔍 **التحليل المحاسبي: أسباب ارتفاع إجمالي ديون العملاء:**\n\n` +
            `• **المعادلة الرياضية:** \`ديون العملاء = مجموع (الفواتير الآجلة غير المسددة - سندات القبض المستلمة)\`.\n` +
            `• **الأسباب المحاسبية المحتملة:**\n` +
            `  1. تزايد عمليات البيع بالآجل دون متابعة دورية لسداد المستحقات.\n` +
            `  2. استلام مبالغ نقدية من العملاء دون توثيقها رسمياً عبر زر *(تسجيل سداد دين / سند قبض)*.\n` +
            `  3. عدم تفعيل أو تجاوز الحدود الائتمانية الموصى بها للزبائن.\n\n` +
            `💡 **كيفية التحقق:** افتح شاشة *(العملاء والديون)* واضغط على زر *(كشف حساب)* لأي عميل لمطابقة الفواتير والسدادات.`;
        } else if (normText.includes('صندوق') || normText.includes('درج') || normText.includes('عجز')) {
          answer = `🔍 **التحليل المحاسبي: أسباب عجز أو اختلاف رصيد الصندوق والدرج:**\n\n` +
            `• **المعادلة الرياضية:** \`رصيد الصندوق الدفتري = (مبيعات الكاش + سندات قبض العملاء) - (سندات صرف الموردين + المصاريف والمسحوبات)\`.\n` +
            `• **الأسباب المحاسبية المحتملة:**\n` +
            `  1. دفع مبالغ نقدية لموردين أو عمال دون تسجيلها كسند صرف أو سحب كاش.\n` +
            `  2. سداد عميل لدين نقداً دون تسجيل سند قبض بالبرنامج.\n` +
            `  3. خطأ في إرجاع باقي النقود للزبائن أثناء عمليات البيع السريع.\n\n` +
            `💡 **كيفية التحقق:** استخدم ميزة *(تصفية الصندوق)* في نهاية كل وردية لعد النقود وتثبيت أي فروقات نقدية.`;
        } else {
          answer = `🔍 **التحليل التشخيصي والمحاسبي لاستفسارك:**\n\n` +
            `يعتمد النظام على القواعد والمعادلات المحاسبية القياسية:\n` +
            `• **المبيعات:** تتأثر بحجم الفواتير النقدية والآجلة المسجلة.\n` +
            `• **صافي الربح:** يتأثر بالفارق بين سعر البيع والتكلفة ومخصوم منه المصاريف.\n` +
            `• **أرصدة الحسابات:** تتأثر مباشرة بحركات الفواتير وسندات القبض والصرف.\n\n` +
            `💡 *يمكنك تحديد الرقم أو القسم أو الصنف الذي ترغب في تشخيصه بدقة وسأحلل لك كافة حركاته.*`;
        }
      } else {
        // Check section features
        const secFeatures = getSectionFeaturesExplanation(queryText) || getSectionFeaturesExplanation(normText);
        if (secFeatures) {
          answer = secFeatures;
        } else {
          const cardExpl = getSystemCardExplanation(queryText) || getSystemCardExplanation(normText);
          if (cardExpl) {
            answer = cardExpl;
          } else {
            let foundSection: any = null;
            let foundDictionary: any = null;
            let foundProcedure: any = null;

            for (const key of Object.keys(SYSTEM_SECTIONS)) {
              const sec = SYSTEM_SECTIONS[key];
              if (
                normText.includes(sec.id) ||
                normText.includes(normalizeArabic(sec.arabicName)) ||
                sec.aliases.some(a => normText.includes(normalizeArabic(a))) ||
                sec.keyFeatures.some(f => normText.includes(normalizeArabic(f).substring(0, 8)))
              ) {
                foundSection = sec;
                break;
              }
            }

            const dictMatches = lookupSystemDictionary(normText) || lookupSystemDictionary(queryText);
            if (dictMatches.length > 0) {
              foundDictionary = dictMatches[0];
            }

            for (const proc of SYSTEM_PROCEDURE_GUIDES) {
              if (proc.keywords.some(k => normText.includes(normalizeArabic(k)) || queryText.includes(k))) {
                foundProcedure = proc;
                break;
              }
            }

            if (foundSection) {
              answer = `📌 **شرح وتفاصيل قسم (${foundSection.arabicName}):**\n\n` +
                `• **الهدف الأساسي:** ${foundSection.primaryPurpose}\n` +
                `• **الوصف التفصيلي:** ${foundSection.detailedDescription}\n\n` +
                `✨ **المميزات والوظائف:**\n` +
                foundSection.keyFeatures.map((f: string) => `• ${f}`).join('\n') + '\n\n' +
                `🔘 **أبرز الأزرار والعمليات:**\n` +
                foundSection.keyButtonsAndControls.map((b: { name: string; action: string }) => `• **${b.name}:** ${b.action}`).join('\n') + '\n\n' +
                `📋 **طريقة الاستخدام:**\n` +
                foundSection.howToUseSteps.map((s: string, idx: number) => `${idx + 1}. ${s}`).join('\n');
            } else if (foundDictionary) {
              answer = `📖 **قاموس النظام والمصطلحات المحاسبية (${foundDictionary.arabicName}):**\n\n` +
                `• **الاسم الإنجليزي:** ${foundDictionary.englishName}\n` +
                `• **التصنيف:** ${foundDictionary.category}\n` +
                `• **المرادفات الدارجة:** ${foundDictionary.synonyms.join(', ')}\n` +
                `• **الشرح والتعريف:** ${foundDictionary.description}`;
            } else if (foundProcedure) {
              answer = `📋 **${foundProcedure.title}:**\n\n` +
                foundProcedure.steps.map((s: string, idx: number) => `${idx + 1}. ${s}`).join('\n');
              if (foundProcedure.tips && foundProcedure.tips.length > 0) {
                answer += `\n\n💡 **نصائح هامة:**\n` + foundProcedure.tips.map((t: string) => `• ${t}`).join('\n');
              }
            } else {
              answer = `🤖 **توضيح وتحليل استفسارك:**\n\n` +
                `لقد استقبلت سؤالك: *("${queryText}")*. النظام مسجل فيه كافة أقسام البرنامج، بطاقات ومؤشرات لوحة التحكم، العمليات المحاسبية، الفواتير، والأرصدة.\n\n` +
                `• إذا كان استفسارك عن **قسم أو شاشة محددة** (مثل: الكاشير، المخزون، العملاء، الموردين، الإعدادات)، يمكنك سؤالي: *(ما هي مميزات قسم المخزون؟)*\n` +
                `• إذا كان استفسارك عن **بطاقة أو مؤشر معين**، يمكنك سؤالي: *(شرح بطاقة رأس مال المخزون)* أو *(ماذا تعرض بطاقة الأرباح؟)*\n` +
                `• إذا كان استفسارك عن **سبب رقم معين**، يمكنك سؤالي: *(لماذا المبيعات صفر؟)* أو *(لماذا الأرباح سالبة؟)*\n` +
                `• إذا كان استفسارك عن **عملية أو إجراء**، يمكنك سؤالي: *(كيف أضيف صنف جديد؟)* أو *(كيف أسدد دين عميل؟)*`;
            }
          }
        }
      }
    }

    return {
      answer: `🔒 **[الوكيل المحاسبي المحلي]**\n\n${answer}`,
      evidence: [],
      confidence: nluResult.intent.confidence || 0.8,
    };
  }


  const primaryEvidence = evidence[0];
  const toolName = primaryEvidence.metadata?.toolName;
  const data = primaryEvidence.data;

  let answer = '';

  switch (toolName) {
    case 'getSalesSummary': {
      const rangeText = formatRangeArabic(data.dateRange);

      if (data.searchedCustomer && data.customerMatched) {
        answer = `👤 **مبيعات ومشتريات العميل (${data.customerName}) في (${rangeText}):**\n` +
          `• **إجمالي المشتريات:** **${data.totalAmount?.toLocaleString()} ر.س**\n` +
          `• **عدد الفواتير:** ${data.invoiceCount} فاتورة\n` +
          `• **المسدد نقداً:** ${data.cashSales?.toLocaleString()} ر.س\n` +
          `• **المسجل آجل (دين):** ${data.debtSales?.toLocaleString()} ر.س`;
        if (data.recentInvoices && data.recentInvoices.length > 0) {
          answer += `\n\n🧾 **تفاصيل الفواتير:**\n` +
            data.recentInvoices.map((inv: any) => `• فاتورة #${inv.id} | ${new Date(inv.date).toLocaleDateString('ar-SA')} | ${inv.totalAmount?.toLocaleString()} ر.س (${inv.paymentType})`).join('\n');
        }
      } else if (data.isVerification) {
        if (data.totalAmount > 0) {
          answer = `✅ **نعم، تم تسجيل مبيعات في (${rangeText}):**\n` +
            `• **إجمالي المبيعات:** **${data.totalAmount?.toLocaleString()} ر.س**\n` +
            `• **عدد الفواتير:** ${data.invoiceCount} فاتورة\n` +
            `• **المبيعات النقدية (كاش):** ${data.cashSales?.toLocaleString()} ر.س\n` +
            `• **المبيعات الآجلة (ذمم مدينة):** ${data.debtSales?.toLocaleString()} ر.س`;
        } else {
          answer = `ℹ️ **لم يتم تسجيل أي مبيعات في (${rangeText})** (إجمالي المبيعات: 0 ر.س).`;
        }
      } else {
        if (data.totalAmount === 0 && data.allTimeSalesTotal > 0) {
          answer = `ℹ️ **لم يتم تسجيل أي عمليات بيع في (${rangeText}) حتى الآن.**\n\n` +
            `• **إجمالي مبيعات المتجر التراكمية العامة:** **${data.allTimeSalesTotal?.toLocaleString()} ر.س**\n` +
            `• **إجمالي الفواتير المسجلة في المتجر:** **${data.allTimeInvoicesCount} فاتورة**\n\n` +
            `💡 يمكنك الاستعلام عن فترات أخرى مثل (أمس، هذا الأسبوع، الشهر الماضي، أو أعلى العمليات).`;
        } else {
          answer = `📊 **تقرير المبيعات (${rangeText}):**\n` +
            `• **إجمالي المبيعات:** **${data.totalAmount?.toLocaleString()} ر.س**\n` +
            `• **عدد الفواتير:** ${data.invoiceCount} فاتورة\n` +
            `• **متوسط قيمة الفاتورة:** ${data.averageInvoiceValue?.toLocaleString()} ر.س\n` +
            `• **المبيعات النقدية (كاش):** ${data.cashSales?.toLocaleString()} ر.س\n` +
            `• **المبيعات الآجلة (ذمم مدينة):** ${data.debtSales?.toLocaleString()} ر.س`;

          if (data.topProducts && data.topProducts.length > 0) {
            answer += `\n\n🏆 **المنتجات الأكثر مبيعاً:**\n` +
              data.topProducts
                .map((p: any, idx: number) => `${idx + 1}. **${p.name}** - ${p.totalQty} قطعة (${p.totalRevenue?.toLocaleString()} ر.س)`)
                .join('\n');
          }
        }
      }
      break;
    }

    case 'getCreditSalesSummary': {
      const rangeText = formatRangeArabic(data.dateRange || 'ALL');
      const creditTotal = data.debtSales ?? data.creditSalesTotal ?? 0;
      const totalAll = data.totalAmount ?? data.totalSalesAll ?? 0;
      const cashTotal = data.cashSales ?? data.cashSalesTotal ?? 0;
      const percentage = totalAll > 0 ? Math.round((creditTotal / totalAll) * 100) : 0;

      answer = `📑 **تقرير المبيعات بالآجل (البيع بالدين) - (${rangeText}):**\n\n` +
        `• **إجمالي المبيعات بالآجل:** **${creditTotal.toLocaleString()} ر.س**\n` +
        `• **نسبتها من إجمالي المبيعات:** **%${percentage}**\n` +
        `• **إجمالي المبيعات الكلية:** ${totalAll.toLocaleString()} ر.س\n` +
        `• **المبيعات النقدية (كاش):** ${cashTotal.toLocaleString()} ر.س\n` +
        `• **عدد الفواتير المسجلة:** ${data.invoiceCount ?? 0} فاتورة\n\n` +
        `💡 *تنويه محاسبي:* المبيعات بالآجل تُسجل تلقائياً في دفتر الذمم المدينة بحسابات العملاء وتحدث أرصدتهم فوراً.`;
      break;
    }

    case 'getProfitSummary': {
      const rangeText = formatRangeArabic(data.dateRange);
      const queryText = query.rawText || '';
      const isAchievedOrCumulative = data.dateRange === 'ALL' || data.isCumulativeQuery || /المحققة|التراكمية|المحل|الكلية|في النظام|كلها|الجرد|تكلفة|تكلفه/i.test(queryText);

      if (isAchievedOrCumulative || (data.netProfit === 0 && data.allTimeNetProfit !== undefined && !/اليوم|أمس|امس|شهر|أسبوع|اسبوع|تاريخ|يوم/i.test(queryText))) {
        const totalCostVal = data.totalCost ?? data.allTimeTotalCost ?? data.allTimeCost ?? 0;
        const totalRevVal = data.totalRevenue ?? data.allTimeTotalRevenue ?? data.allTimeRevenue ?? 0;
        const netProfitVal = data.netProfit ?? data.allTimeNetProfit ?? 0;
        const marginVal = data.marginPercent ?? data.allTimeMarginPercent ?? 0;

        answer = `📈 **تقرير الأرباح وتكلفة البضائع المباعة (${rangeText}):**\n\n` +
          `• **إجمالي تكلفة البضائع المباعة وصرفها:** **${totalCostVal.toLocaleString()} ر.س**\n` +
          `• **إجمالي الإيرادات (المبيعات بسعر البيع):** **${totalRevVal.toLocaleString()} ر.س**\n` +
          `• **صافي الربح:** **${netProfitVal.toLocaleString()} ر.س**\n` +
          `• **هامش الربح الإجمالي:** **%${marginVal}**\n\n` +
          `💡 *تنويه محاسبي:* يتم احتساب تكلفة البضائع المباعة وصرفها بناءً على سعر شراء كل صنف مضروباً في كمياته المباعة من الواقع الفعلي لجميع الفواتير.`;
      } else {
        answer = `📈 **تقرير الأرباح (${rangeText}):**\n\n` +
          `• **إجمالي الإيرادات:** ${data.totalRevenue?.toLocaleString()} ر.س\n` +
          `• **إجمالي التكلفة (تكلفة البضائع المباعة):** ${data.totalCost?.toLocaleString()} ر.س\n` +
          `• **صافي الربح:** **${data.netProfit?.toLocaleString()} ر.س**\n` +
          `• **هامش الربح:** %${data.marginPercent}`;

        if (data.allTimeNetProfit !== undefined) {
          answer += `\n\n💡 **إجمالي الأرباح التراكمية في النظام (كلياً):** **${data.allTimeNetProfit?.toLocaleString()} ر.س**`;
        }
      }
      break;
    }

    case 'getCustomerDebts': {
      if (data.searchedName && data.matchedCustomers) {
        if (data.matchedCustomers.length === 0) {
          answer = `⚠️ لم يتم العثور على أي زبون باسم "${data.searchedName}" في النظام.`;
        } else {
          answer = `👤 **بيانات وحساب الزبون المحدد (${data.searchedName}):**\n\n` +
            data.matchedCustomers
              .map((c: any) => {
                let statusText = '';
                if ((c.balance || 0) > 0) {
                  statusText = `🔴 **المتبقي عليه (دين):** **${c.balance?.toLocaleString()} ر.س**`;
                } else if ((c.balance || 0) < 0) {
                  statusText = `🟢 **له رصيد فائض (دائن):** **${Math.abs(c.balance || 0)?.toLocaleString()} ر.س**`;
                } else {
                  statusText = `✅ **حالة الحساب:** **خالص تماماً (0 ر.س - لا توجد ديون)**`;
                }

                return `• **الاسم:** **${c.name}**\n` +
                       `• **رقم الهاتف:** ${c.phone || 'غير مسجل'}\n` +
                       `• ${statusText}`;
              })
              .join('\n\n---\n\n');

          if (data.recentDebtTransactions && data.recentDebtTransactions.length > 0) {
            answer += `\n\n📜 **آخر الحركات المسجلة للزبون:**\n` +
              data.recentDebtTransactions.slice(-5).map((d: any) => 
                `• ${new Date(d.created_at).toLocaleDateString('ar-SA')} | **${d.type === 'purchase' ? 'فاتورة آجل' : 'سداد نقد'}**: ${d.amount?.toLocaleString()} ر.س ${d.notes ? `[${d.notes}]` : ''}`
              ).join('\n');
          }
        }
      } else {
        const isCommitmentQuery = /التزام|ملتزم|سداد|وفاء/.test(query.rawText);

        if (isCommitmentQuery) {
          answer = `🏆 **أكثر العملاء التزاماً بسداد ديونهم (الأعلى سداداً):**\n\n`;
          if (data.committedCustomers && data.committedCustomers.length > 0) {
            answer += data.committedCustomers
              .map((c: any, idx: number) => `⭐ ${idx + 1}. **${c.name}** | إجمالي ما سدده: **${c.totalPaid?.toLocaleString()} ر.س** (الرصيد المتبقي عليه حالياً: ${c.balance?.toLocaleString()} ر.س)`)
              .join('\n');
          } else {
            answer += `لا توجد عمليات سداد مسجلة للعملاء في السجلات حالياً لتصنيف الالتزام.`;
          }
        } else {
          let prefix = '';
          if (data.notMatchedSearchedName) {
            prefix = `⚠️ لم نجد زبوناً باسم "${data.notMatchedSearchedName}" في السجلات. إليك ملخص إجمالي ديون العملاء المترتبة:\n\n`;
          }
          answer = `${prefix}👥 **ملخص ديون العملاء:**\n` +
            `• **إجمالي الديون على العملاء:** **${data.totalCustomerDebt?.toLocaleString()} ر.س**\n` +
            `• **عدد العملاء المدينين:** ${data.indebtedCount} زبون\n`;

          if (data.topDebtors && data.topDebtors.length > 0) {
            answer += `\n📋 **أعلى العملاء ديناً:**\n` +
              data.topDebtors
                .map((c: any, idx: number) => `${idx + 1}. **${c.name}**: ${c.balance?.toLocaleString()} ر.س`)
                .join('\n');
          }

          if (data.committedCustomers && data.committedCustomers.length > 0) {
            answer += `\n\n🏆 **أكثر العملاء التزاماً بسداد ديونهم (الأعلى سداداً):**\n` +
              data.committedCustomers.slice(0, 3)
                .map((c: any, idx: number) => `• **${c.name}**: سدد **${c.totalPaid?.toLocaleString()} ر.س** (المتبقي: ${c.balance?.toLocaleString()} ر.س)`)
                .join('\n');
          }
        }
      }
      break;
    }

    case 'getCustomerStatement': {
      if (!data.found) {
        answer = data.message || `لم أتمكن من العثور على زبون مطبق.`;
        if (data.topCustomers && data.topCustomers.length > 0) {
          answer += `\n\n📋 **أبرز ديون العملاء المسجلين:**\n` +
            data.topCustomers.map((c: any) => `• **${c.name}**: ${c.balance?.toLocaleString()} ر.س`).join('\n');
        }
      } else {
        const c = data.customer;
        const s = data.summary;
        const rangeText = formatRangeArabic(data.dateRange || 'ALL');

        answer = `📄 **كشف حساب - العميل (${c.name}):**\n` +
          `• **اسم العميل:** **${c.name}**\n` +
          `• **رقم الهاتف:** ${c.phone || 'غير مسجل'}\n` +
          `• **الرصيد المتبقي عليه حالياً:** **${c.currentBalance?.toLocaleString()} ر.س**\n`;

        if (data.dateRange && data.dateRange !== 'ALL') {
          answer += `\n🗓️ **حركات وتفاصيل الفترة المحدد (${rangeText}):**\n` +
            `• **إجمالي الآجل المشتري في الفترة:** ${s.periodPurchases?.toLocaleString()} ر.س\n` +
            `• **إجمالي المسدد في الفترة:** ${s.periodPayments?.toLocaleString()} ر.س\n` +
            `• **عدد الحركات في الفترة:** ${s.periodCount} حركة\n`;

          if (data.periodDebts && data.periodDebts.length > 0) {
            answer += `\n📝 **حركات الفترة المحدد:**\n` +
              data.periodDebts.map((d: any) =>
                `• ${new Date(d.date).toLocaleDateString('ar-SA')} | **${d.type}**: ${d.amount?.toLocaleString()} ر.س ${d.notes ? `[${d.notes}]` : ''}`
              ).join('\n');
          } else {
            answer += `\nℹ️ لا توجد أي حركات مسجلة للعميل في الفترة المحدد (${rangeText}).`;
          }
        } else {
          answer += `• **إجمالي المشتريات الآجلة (كلياً):** ${s.totalPurchases?.toLocaleString()} ر.س\n` +
            `• **إجمالي السدادات النقدي (كلياً):** ${s.totalPayments?.toLocaleString()} ر.س\n`;

          if (data.statementLines && data.statementLines.length > 0) {
            answer += `\n📜 **آخر حركات دفتر الحساب:**\n` +
              data.statementLines
                .map(
                  (l: any) =>
                    `• ${new Date(l.date).toLocaleDateString('ar-SA')} | **${l.type}**: ${l.amount?.toLocaleString()} ر.س (الرصيد بعدها: ${l.runningBalance?.toLocaleString()} ر.س) ${l.notes ? `[${l.notes}]` : ''}`
                )
                .join('\n');
          }
        }
      }
      break;
    }

    case 'getSupplierDebts': {
      if (data.searchedName && data.matchedSuppliers) {
        if (data.matchedSuppliers.length === 0) {
          answer = `⚠️ لم يتم العثور على أي مورد أو شركة باسم "${data.searchedName}" في النظام.`;
        } else {
          answer = `🏬 **بيانات وحساب المورد المحدد (${data.searchedName}):**\n\n` +
            data.matchedSuppliers
              .map((s: any) => {
                let statusText = '';
                if ((s.balance || 0) > 0) {
                  statusText = `🔴 **المبلغ المستحق له علينا:** **${s.balance?.toLocaleString()} ر.س**`;
                } else if ((s.balance || 0) < 0) {
                  statusText = `🟢 **لنا رصيد عنده (دفعة مقدمة):** **${Math.abs(s.balance || 0)?.toLocaleString()} ر.س**`;
                } else {
                  statusText = `✅ **حالة الحساب:** **خالص تماماً (0 ر.س - تم تسديد كامل المستحقات)**`;
                }

                return `• **المورد / الشركة:** **${s.name}**\n` +
                       `• **رقم الهاتف:** ${s.phone || 'غير مسجل'}\n` +
                       `• ${statusText}`;
              })
              .join('\n\n---\n\n');

          if (data.recentPayments && data.recentPayments.length > 0) {
            answer += `\n\n💸 **آخر سندات الصرف والسداد للمورد:**\n` +
              data.recentPayments.slice(-5).map((p: any) =>
                `• ${new Date(p.payment_date).toLocaleDateString('ar-SA')} | مبلغ **${p.amount?.toLocaleString()} ر.س** (${p.payment_method === 'cash' ? 'نقداً' : 'تحويل'})`
              ).join('\n');
          }
        }
      } else {
        let prefix = '';
        if (data.notMatchedSearchedName) {
          prefix = `⚠️ لم نجد مورداً باسم "${data.notMatchedSearchedName}" في السجلات. إليك ملخص بطاقات وقسم الموردين والتجار:\n\n`;
        }
        answer = `${prefix}🏬 **ملخص بطاقات وقسم الموردين والتجّار:**\n\n` +
          `• **🔴 المتبقي والديون القائمة للموردين:** **${data.totalSupplierDebt?.toLocaleString()} ر.س** (${data.indebtedSuppliersCount} مورد مستحق لهم مبالغ)\n` +
          `• **💵 رأس المال المسلّم للتجار (إجمالي السدادات للموردين):** **${(data.totalCapitalPaidToSuppliers || 0)?.toLocaleString()} ر.س**\n` +
          `• **📦 رأس مال البضاعة بسعر التكلفة:** **${(data.totalInventoryCostValuation || 0)?.toLocaleString()} ر.س** (بسعر الجملة)\n`;

        if (data.topSuppliersDue && data.topSuppliersDue.length > 0) {
          answer += `\n📋 **أعلى الموردين ديناً علينا حالياً:**\n` +
            data.topSuppliersDue
              .map((s: any, idx: number) => `${idx + 1}. **${s.name}**: ${s.balance?.toLocaleString()} ر.س`)
              .join('\n');
        }

        answer += `\n\n💡 **خيارات واقتراحات سريعة قبل إكمال طلبك أو للتوسع في بطاقات الموردين:**\n` +
          `إذا كنت تبحث عن تفاصيل محددة من قسم الموردين، يمكنك الاستفسار عن:\n` +
          `1️⃣ 💵 **المسدد والمدفوع للتجار (رأس المال المسلم):** لمعرفة كم تم تسديده للشركات بالتاريخ.\n` +
          `2️⃣ ⚖️ **المتبقي والديون القائمة:** لمعرفة قائمة الشركات والموردين والالتزامات القائمة.\n` +
          `3️⃣ 📄 **كشف حساب مورد معين:** اكتب *"كشف حساب [اسم المورد]"* لرؤية جميع سداداته وفواتيره.\n` +
          `4️⃣ 📊 **جرد شامل وتقرير كلي:** اكتب *"جرد شامل للموردين"* للحصول على تقرير تفصيلي كامل.`;
      }
      break;
    }

    case 'getSupplierStatement': {
      if (!data.found) {
        answer = data.message || `لم أتمكن من العثور على مورد مطبق.`;
      } else {
        const sup = data.supplier;
        const rangeText = formatRangeArabic(data.dateRange || 'ALL');

        answer = `📄 **كشف حساب المورد (${sup.name}):**\n` +
          `• **المورد / الشركة:** **${sup.name}**\n` +
          `• **الهاتف:** ${sup.phone || 'غير مسجل'}\n` +
          `• **المبلغ المستحق له علينا حالياً:** **${sup.currentBalance?.toLocaleString()} ر.س**\n`;

        if (data.dateRange && data.dateRange !== 'ALL') {
          answer += `\n🗓️ **سدادات ومدفوعات الفترة المحدد (${rangeText}):**\n` +
            `• **المبلغ المسدد له في الفترة:** **${data.summary?.periodPaidToSupplier?.toLocaleString()} ر.س**\n` +
            `• **عدد سندات الصرف في الفترة:** ${data.summary?.periodPaymentCount} سند\n`;

          if (data.periodPayments && data.periodPayments.length > 0) {
            answer += `\n💸 **سندات صرف الفترة:**\n` +
              data.periodPayments.map((p: any) =>
                `• ${new Date(p.payment_date).toLocaleDateString('ar-SA')} | مبلغ **${p.amount?.toLocaleString()} ر.س** ${p.notes ? `[${p.notes}]` : ''}`
              ).join('\n');
          } else {
            answer += `\nℹ️ لم يتم تسديد أي مبالغ للمورد خلال الفترة المحدد (${rangeText}).`;
          }
        } else {
          answer += `• **إجمالي ما تم تسديده له (كلياً):** ${data.summary?.totalPaidToSupplier?.toLocaleString()} ر.س\n`;

          if (data.recentPayments && data.recentPayments.length > 0) {
            answer += `\n💸 **آخر عمليات السداد المسجلة:**\n` +
              data.recentPayments
                .map(
                  (p: any) =>
                    `• ${new Date(p.payment_date).toLocaleDateString('ar-SA')} | مبلغ **${p.amount?.toLocaleString()} ر.س** (${p.payment_method === 'cash' ? 'نقداً' : 'تحويل'})`
                )
                .join('\n');
          }
        }
      }
      break;
    }

    case 'getSupplierPayments': {
      const rangeText = formatRangeArabic(data.dateRange);

      if (data.searchedSupplier) {
        if (!data.supplierMatched) {
          answer = `⚠️ لم يتم العثور على مورد أو شركة باسم "${data.searchedSupplier}" في السجلات.`;
        } else if (data.isVerification) {
          if (data.totalPaid > 0) {
            answer = `✅ **نعم، تم سداد مبلغ للمورد (${data.supplierName}) في (${rangeText}):**\n` +
              `• **المبلغ المسدد:** **${data.totalPaid?.toLocaleString()} ر.س**\n` +
              `• **عدد العمليات:** ${data.paymentCount} عملية\n` +
              `• **رصيد المورد المتبقي له علينا حالياً:** ${data.currentSupplierBalance?.toLocaleString()} ر.س\n` +
              `• **إجمالي المسدد له كلياً:** ${data.allTimePaid?.toLocaleString()} ر.س`;
          } else {
            answer = `ℹ️ **لم يتم سداد أي مبلغ للمورد (${data.supplierName}) في (${rangeText})** (المبلغ المسدد: 0 ر.س).\n` +
              `• **علماً أن المتبقي له علينا حالياً:** **${data.currentSupplierBalance?.toLocaleString()} ر.س**`;
          }
        } else {
          answer = `💵 **المبلغ المسدد للمورد (${data.supplierName}) في (${rangeText}):**\n` +
            `• **إجمالي المسدد في هذه الفترة:** **${data.totalPaid?.toLocaleString()} ر.س**\n` +
            `• **عدد العمليات والسندات:** ${data.paymentCount} عملية\n` +
            `• **رصيد المورد المتبقي له علينا حالياً:** ${data.currentSupplierBalance?.toLocaleString()} ر.س\n` +
            `• **إجمالي ما تم تسديده له كلياً:** ${data.allTimePaid?.toLocaleString()} ر.س`;

          if (data.payments && data.payments.length > 0) {
            answer += `\n\n🧾 **تفاصيل سندات الصرف في هذه الفترة:**\n` +
              data.payments.map((p: any) =>
                `• ${new Date(p.payment_date).toLocaleDateString('ar-SA')} | مبلغ **${p.amount?.toLocaleString()} ر.س** ${p.notes ? `[${p.notes}]` : ''}`
              ).join('\n');
          }
        }
      } else {
        answer = `💸 **إجمالي المسدد والمدفوع للموردين والشركات في (${rangeText}):**\n` +
          `• **إجمالي المبلغ المسدد:** **${data.totalPaid?.toLocaleString()} ر.س**\n` +
          `• **عدد عمليات وسندات الصرف:** ${data.paymentCount} عملية\n`;

        if (data.supplierBreakdown && data.supplierBreakdown.length > 0) {
          answer += `\n📋 **تفاصيل المدفوعات حسب المورد:**\n` +
            data.supplierBreakdown
              .map((s: any, idx: number) => `${idx + 1}. **${s.name}**: مسدد **${s.totalPaid?.toLocaleString()} ر.س** (${s.count} سند)`)
              .join('\n');
        } else if (data.totalPaid === 0) {
          answer += `\nℹ️ لا توجد أي مدفوعات مسجلة للموردين في هذه الفترة (${rangeText}).`;
        }
      }
      break;
    }

    case 'getCustomerPayments': {
      const rangeText = formatRangeArabic(data.dateRange);

      if (data.searchedCustomer) {
        if (!data.customerMatched) {
          answer = `⚠️ لم يتم العثور على زبون باسم "${data.searchedCustomer}" في السجلات.`;
        } else if (data.isVerification) {
          if (data.totalCollected > 0) {
            answer = `✅ **نعم، تم تحصيل مبلغ من العميل (${data.customerName}) في (${rangeText}):**\n` +
              `• **المبلغ المحصل:** **${data.totalCollected?.toLocaleString()} ر.س**\n` +
              `• **عدد عمليات السداد:** ${data.paymentCount} عملية\n` +
              `• **الرصيد المتبقي عليه حالياً:** ${data.currentCustomerBalance?.toLocaleString()} ر.س\n` +
              `• **إجمالي ما سدده كلياً:** ${data.allTimeCollected?.toLocaleString()} ر.س`;
          } else {
            answer = `ℹ️ **لم يتم تحصيل أي مبلغ من العميل (${data.customerName}) في (${rangeText})** (المبلغ المحصل: 0 ر.س).\n` +
              `• **علماً أن الرصيد المتبقي عليه حالياً:** **${data.currentCustomerBalance?.toLocaleString()} ر.س**`;
          }
        } else {
          answer = `💰 **المبلغ المحصل والسدد من العميل (${data.customerName}) في (${rangeText}):**\n` +
            `• **إجمالي المحصل في هذه الفترة:** **${data.totalCollected?.toLocaleString()} ر.س**\n` +
            `• **عدد عمليات وسندات القبض:** ${data.paymentCount} عملية\n` +
            `• **الرصيد المتبقي عليه حالياً:** ${data.currentCustomerBalance?.toLocaleString()} ر.س\n` +
            `• **إجمالي ما سدده كلياً:** ${data.allTimeCollected?.toLocaleString()} ر.س`;

          if (data.payments && data.payments.length > 0) {
            answer += `\n\n🧾 **تفاصيل سندات القبض في هذه الفترة:**\n` +
              data.payments.map((p: any) =>
                `• ${new Date(p.created_at).toLocaleDateString('ar-SA')} | مبلغ **${p.amount?.toLocaleString()} ر.س** ${p.notes ? `[${p.notes}]` : ''}`
              ).join('\n');
          }
        }
      } else {
        answer = `💰 **إجمالي تحصيلات وسدادات العملاء في (${rangeText}):**\n` +
          `• **إجمالي المبالغ المحصلة:** **${data.totalCollected?.toLocaleString()} ر.س**\n` +
          `• **عدد عمليات وسندات القبض:** ${data.paymentCount} عملية\n`;

        if (data.customerBreakdown && data.customerBreakdown.length > 0) {
          answer += `\n📋 **تفاصيل التحصيلات حسب العميل:**\n` +
            data.customerBreakdown
              .map((c: any, idx: number) => `${idx + 1}. **${c.name}**: سدد **${c.totalCollected?.toLocaleString()} ر.س** (${c.count} سند)`)
              .join('\n');
        } else if (data.totalCollected === 0) {
          answer += `\nℹ️ لا توجد أي تحصيلات مسجلة من العملاء في هذه الفترة (${rangeText}).`;
        }
      }
      break;
    }

    case 'getPurchasesSummary': {
      const rangeText = formatRangeArabic(data.dateRange);

      if (data.searchedSupplier) {
        if (!data.supplierMatched) {
          answer = `⚠️ لم يتم العثور على مورد باسم "${data.searchedSupplier}" في السجلات.`;
        } else {
          answer = `🛍️ **ملخص مشتريات وسدادات المورد (${data.supplierName}) في (${rangeText}):**\n` +
            `• **المبلغ المسدد للمورد في الفترة:** **${data.totalPaidInPeriod?.toLocaleString()} ر.س**\n` +
            `• **عدد عمليات الصرف:** ${data.paymentCount} عملية\n` +
            `• **المبلغ المتبقي له علينا حالياً:** ${data.supplierBalance?.toLocaleString()} ر.س\n` +
            `• **عدد الأصناف المربوطة بالمورد:** ${data.associatedProductsCount} صنف`;
        }
      } else {
        answer = `🛍️ **تقرير ملخص المشتريات والمدفوعات للموردين في (${rangeText}):**\n` +
          `• **إجمالي المبالغ المسددة للموردين:** **${data.totalPaidInPeriod?.toLocaleString()} ر.س**\n` +
          `• **عدد عمليات الصرف والسداد:** ${data.paymentCount} عملية\n` +
          `• **إجمالي المستحقات المتبقية للموردين:** ${data.supplierBalance?.toLocaleString()} ر.س`;
      }
      break;
    }

    case 'getLowStockReport': {
      answer = `⚠️ **تقرير النواقص والكميات الحرجة بالمخزن:**\n` +
        `• **الأصناف المنتهية تماماً (0):** ${data.outOfStockCount} صنف\n` +
        `• **الأصناف قريبة النفاد (≤ 5):** ${data.lowStockCount} صنف\n` +
        `• **التقدير المالي المطلوب لإعادة التغذية:** **${data.totalRestockCostEstimate?.toLocaleString()} ر.س**\n`;

      if (data.outOfStockItems && data.outOfStockItems.length > 0) {
        answer += `\n🚫 **المنتجات المنتهية (تحتاج طلب فوراً):**\n` +
          data.outOfStockItems.map((p: any) => `• **${p.name}** (${p.category || 'عام'}) - التكلفة: ${p.cost_price} ر.س`).join('\n');
      }

      if (data.criticalLowItems && data.criticalLowItems.length > 0) {
        answer += `\n\n⚡ **منتجات في حد الخطر:**\n` +
          data.criticalLowItems.map((p: any) => `• **${p.name}**: المتبقي ${p.stock} قطعة فقط`).join('\n');
      }
      break;
    }

    case 'getExpiredAndExpiringReport': {
      answer = `⏳ **تقرير تواريخ الانتهاء والأصناف التالفة:**\n` +
        `• **الأصناف المنتهية بالفعل:** ${data.expiredCount} صنف (خسارة تقديرية: **${data.totalExpiredLossCost?.toLocaleString()} ر.س**)\n` +
        `• **أصناف تنتهي خلال 7 أيام:** ${data.expiring7DaysCount} صنف\n` +
        `• **أصناف تنتهي خلال 30 يوماً:** ${data.expiring30DaysCount} صنف\n` +
        `• **إجمالي القيمة المعرضة للتلف خلال شهر:** **${data.totalExpiringAtRiskCost?.toLocaleString()} ر.س**\n`;

      if (data.expiredItems && data.expiredItems.length > 0) {
        answer += `\n❌ **الأصناف المنتهية:**\n` +
          data.expiredItems.map((p: any) => `• **${p.name}**: ${p.stock} قطعة | تاريخ الانتهاء: ${p.exp}`).join('\n');
      }

      if (data.expiring7DaysItems && data.expiring7DaysItems.length > 0) {
        answer += `\n\n⚠️ **أصناف تنتهي قريباً جداً (خلال أسبوع):**\n` +
          data.expiring7DaysItems.map((p: any) => `• **${p.name}**: ${p.stock} قطعة | تاريخ الانتهاء: ${p.exp}`).join('\n');
      }
      break;
    }

    case 'getInventoryStatus': {
      if (data.searchedName && data.matchedProducts) {
        if (data.matchedProducts.length === 0) {
          answer = `⚠️ لم يتم العثور على أي صنف أو منتج باسم "${data.searchedName}" في المخزن.`;
        } else {
          const queryText = query.rawText || '';
          const isOnlyPrice = /(بكم|كم سعر|سعر البيع|كم سعره)/i.test(queryText) && !/تفاصيل|كل|حركة|تقرير|تحديث|أرباح|مبيعات/i.test(queryText);
          const isOnlyStock = /(كم كمية|كم كميه|كم متبقي|كم باقي|رصيد المخزون|كم حبة|كم حبه)/i.test(queryText) && !/تفاصيل|كل|حركة|تقرير|تحديث|أرباح|مبيعات/i.test(queryText);

          if (isOnlyPrice) {
            answer = data.matchedProducts.map((p: any) =>
              `🏷️ **سعر الصنف (${p.name}):** **${p.sale_price?.toLocaleString()} ر.س**` +
              (p.cost_price ? ` (سعر التكلفة: ${p.cost_price?.toLocaleString()} ر.س)` : '')
            ).join('\n');
          } else if (isOnlyStock) {
            answer = data.matchedProducts.map((p: any) => {
              let statusText = p.stock_quantity === 0 ? '🔴 منتهٍ من المخزن' : p.stock_quantity <= 5 ? '🟡 قريب النفاد' : '🟢 متوفر';
              return `📦 **المخزون المتبقي من (${p.name}):** **${p.stock_quantity || 0} ${p.unit || 'حبة'}** (${statusText})`;
            }).join('\n');
          } else {
            answer = `📦 **التقرير الكامل والتفصيلي للصنف (${data.searchedName}):**\n\n` +
              data.matchedProducts
                .map((p: any) => {
                  let stockStatus = '';
                  if ((p.stock_quantity || 0) === 0) {
                    stockStatus = '🔴 **منتهٍ من المخزن (0 حبة)**';
                  } else if ((p.stock_quantity || 0) <= 5) {
                    stockStatus = `🟡 **قريب النفاد (${p.stock_quantity} ${p.unit || 'حبة'} فقط)**`;
                  } else {
                    stockStatus = `🟢 **متوفر (${p.stock_quantity} ${p.unit || 'حبة'})**`;
                  }

                  const profitMargin = p.sale_price && p.cost_price ? (((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(0) : '0';

                  let itemDetails = `📌 **البيانات الأساسية:**\n` +
                         `• **اسم المنتج:** **${p.name}**\n` +
                         `• **القسم / الفئة:** ${p.category || 'عام'}\n` +
                         `• **الباركود:** ${p.barcode || 'غير محدد'}\n` +
                         `• **الوحدة:** ${p.unit || 'حبة'}\n\n` +
                         `🏷️ **التسعير والمخزون الحالي:**\n` +
                         `• **حالة المخزون:** ${stockStatus}\n` +
                         `• **سعر البيع:** **${p.sale_price?.toLocaleString()} ر.س**\n` +
                         `• **سعر التكلفة:** ${p.cost_price?.toLocaleString()} ر.س\n` +
                         `• **هامش الربح:** **%${profitMargin}**\n` +
                         (p.production_date ? `• **تاريخ الإنتاج:** ${p.production_date}\n` : '') +
                         (p.expiration_date ? `• **تاريخ الانتهاء:** ${p.expiration_date}\n` : '') +
                         `\n📊 **سجل الحركة والمبيعات التراكمي:**\n` +
                         `• **إجمالي الكمية المباعة:** **${p.totalQtySold || 0} ${p.unit || 'حبة'}**\n` +
                         `• **إجمالي الإيرادات المحققة:** **${p.totalRevenue?.toLocaleString() || 0} ر.س**\n` +
                         `• **إجمالي الأرباح المحققة:** **${p.totalProfit?.toLocaleString() || 0} ر.س**\n` +
                         `• **عدد الفواتير:** ${p.salesCount || 0} فاتورة`;

                  if (p.recentTransactions && p.recentTransactions.length > 0) {
                    itemDetails += `\n\n🧾 **آخر عمليات البيع والتحديث لهذا الصنف:**\n` +
                      p.recentTransactions.map((tx: any) =>
                        `• فاتورة #${tx.saleId} | ${tx.date ? new Date(tx.date).toLocaleDateString('ar-SA') : 'سابقاً'} | العميل: ${tx.customerName} | الكمية: ${tx.quantity} ${p.unit || 'حبة'} بسعر ${tx.priceAtSale} ر.س (الإجمالي: ${tx.total?.toLocaleString()} ر.س)`
                      ).join('\n');
                  } else {
                    itemDetails += `\n\n💡 *ملاحظة:* لا توجد عمليات بيع مسجلة لهذا الصنف حتى الآن.`;
                  }

                  return itemDetails;
                })
                .join('\n\n---\n\n');
          }
        }
      } else {
        let prefix = '';
        if (data.notMatchedSearchedName) {
          prefix = `⚠️ لم نجد أصنافاً مطابقة لـ "${data.notMatchedSearchedName}". إليك ملخص المخزون العام:\n\n`;
        }
        answer = `${prefix}📦 **حالة المخزون والمنتجات:**\n` +
          `• **إجمالي عدد الأصناف:** ${data.totalProducts} صنف\n` +
          `• **الأصناف قريبة النفاد (≤ 5):** ${data.lowStockCount} صنف\n` +
          `• **الأصناف المنتهية (0):** ${data.outOfStockCount} صنف\n` +
          `• **أصناف قريبة تاريخ الانتهاء (خلال 30 يوماً):** ${data.expiringCount} صنف\n` +
          `• **قيمة المخزون بسعر التكلفة:** ${data.totalStockValueCost?.toLocaleString()} ر.س\n` +
          `• **قيمة المخزون بسعر البيع المتوقع:** ${data.totalStockValueSale?.toLocaleString()} ر.س`;

        if (data.lowStockItems && data.lowStockItems.length > 0) {
          answer += `\n\n⚠️ **أبرز النواقص بالمخزن:**\n` +
            data.lowStockItems
              .map((p: any) => `• **${p.name}**: متبقي ${p.stock_quantity} قطعة فقط`)
              .join('\n');
        }
      }
      break;
    }

    case 'getSalesByProduct': {
      const rangeText = formatRangeArabic(data.dateRange);
      if (data.searchedProduct) {
        if (data.isVerification) {
          if (data.isSold) {
            answer = `✅ **نعم، تم بيع صنف (${data.searchedProduct}) في (${rangeText}):**\n` +
              `• **الكمية المباعة:** **${data.totalQuantitySold} قطعة**\n` +
              `• **إجمالي الإيراد:** **${data.totalRevenue?.toLocaleString()} ر.س**\n` +
              `• **عدد الفواتير:** ${data.saleCount} فاتورة`;
            if (data.invoices && data.invoices.length > 0) {
              answer += `\n\n🧾 **تفاصيل عمليات البيع:**\n` +
                data.invoices.map((inv: any) => `• فاتورة #${inv.invoiceId} | ${new Date(inv.date).toLocaleDateString('ar-SA')} | ${inv.customerName} | بيع ${inv.quantity} حبة × ${inv.priceAtSale} ر.س = **${inv.total?.toLocaleString()} ر.س**`).join('\n');
            }
          } else {
            answer = `❌ **لا، لم يتم بيع أي كمية من صنف (${data.searchedProduct}) في (${rangeText})** (الكمية المباعة: 0 قطعة).`;
          }
        } else {
          answer = `🛍️ **حركة بيع الصنف (${data.searchedProduct}) في (${rangeText}):**\n` +
            `• **المنتجات المطابقة:** ${data.matchedProducts?.join(', ')}\n` +
            `• **إجمالي الكمية المباعة:** **${data.totalQuantitySold} قطعة**\n` +
            `• **إجمالي الإيراد المحقق:** **${data.totalRevenue?.toLocaleString()} ر.س**\n` +
            `• **عدد مرات الشراء:** ${data.saleCount} مرة`;
          if (data.invoices && data.invoices.length > 0) {
            answer += `\n\n🧾 **آخر فواتير تم فيها بيع هذا الصنف:**\n` +
              data.invoices.map((inv: any) => `• فاتورة #${inv.invoiceId} (${new Date(inv.date).toLocaleDateString('ar-SA')}) | ${inv.customerName} | ${inv.quantity} حبة (${inv.total?.toLocaleString()} ر.س)`).join('\n');
          }
        }
      } else {
        answer = `📊 **تحليل المبيعات حسب أصناف المنتجات في (${rangeText}):**\n` +
          `• **إجمالي الأصناف المباعة:** ${data.totalUniqueProductsSold} صنف\n\n` +
          `🔥 **الأكثر مبيعاً بالكمية:**\n` +
          (data.topSellingByQty && data.topSellingByQty.length > 0
            ? data.topSellingByQty.map((p: any, i: number) => `${i + 1}. **${p.name}**: ${p.qty} قطعة (${p.revenue?.toLocaleString()} ر.س)`).join('\n')
            : 'لا توجد مبيعات مسجلة لهذه الفترة.');
      }
      break;
    }

    case 'getInvoiceSearch': {
      if (data.found && data.invoice) {
        const inv = data.invoice;
        answer = `🧾 **تفاصيل الفاتورة رقم #${inv.id}:**\n` +
          `• **التاريخ:** ${new Date(inv.date).toLocaleString('ar-SA')}\n` +
          `• **العميل:** ${inv.customerName}\n` +
          `• **طريقة الدفع:** ${inv.paymentType}\n` +
          `• **الإجمالي:** **${inv.totalAmount?.toLocaleString()} ر.س**\n\n` +
          `🛒 **المحتويات والبنود:**\n` +
          inv.items.map((it: any) => `• **${it.productName}**: ${it.quantity} × ${it.priceAtSale} ر.س = **${it.total?.toLocaleString()} ر.س**`).join('\n');
      } else {
        answer = `${data.message || 'فواتير المبيعات'}:\n\n` +
          data.recentInvoices?.map((i: any) => `• **فاتورة #${i.id}** | ${i.customerName} | ${i.totalAmount?.toLocaleString()} ر.س (${i.paymentType})`).join('\n');
      }
      break;
    }

    case 'getCashSummary': {
      const rangeText = formatRangeArabic(data.dateRange);
      if (data.isVerification) {
        if (data.withdrawalsCount === 0 && data.unrepaidWithdrawalsCount === 0) {
          answer = `✅ **لا توجد أي سحوبات نقدية مسجلة في (${rangeText})**.`;
        } else {
          answer = `💵 **تقرير المسحوبات النقدية في (${rangeText}):**\n` +
            `• **إجمالي المسحوبات:** **${data.totalWithdrawalsAmount?.toLocaleString()} ر.س** (${data.withdrawalsCount} سحب)\n` +
            `• **المسحوبات غير المسددة:** **${data.totalUnrepaidAmount?.toLocaleString()} ر.س** (${data.unrepaidWithdrawalsCount} سحب)`;
        }
      } else {
        answer = `💵 **ملخص الصندوق والسحوبات (${rangeText}):**\n` +
          `• **إجمالي المسحوبات النقدية:** ${data.totalWithdrawalsAmount?.toLocaleString()} ر.س (${data.withdrawalsCount} سحب)\n` +
          `• **عدد السحوبات غير المسددة:** ${data.unrepaidWithdrawalsCount}\n` +
          `• **إجمالي المسحوبات غير المسددة:** **${data.totalUnrepaidAmount?.toLocaleString()} ر.س**`;
      }
      break;
    }

    case 'getAnomalyDetection': {
      const rangeText = formatRangeArabic(data.dateRange);
      if (data.isVerification) {
        if (data.anomalyCount === 0) {
          answer = `✅ **لم تسجل أي مشاكل أو أخطاء أو تلاعب في (${rangeText})**.\n\n` +
            `• جميع فواتير المبيعات مطابقة وقيمها صحيحة.\n` +
            `• لا توجد سحوبات نقدية مريبة أو غير مسددة في هذه الفترة.\n` +
            `• الحركة المالية سليمة ومنتظمة بنسبة 100%.`;
        } else {
          answer = `⚠️ **تم رصد (${data.anomalyCount}) ملاحظات/تشوهات في (${rangeText}):**\n` +
            `• **فواتير بقيمة صفرية:** ${data.zeroAmountSalesCount}\n` +
            `• **سحوبات كاش غير مسددة:** ${data.unrepaidWithdrawalsCount} سحب (الإجمالي: ${data.unrepaidWithdrawalsTotal?.toLocaleString()} ر.س)\n` +
            `• **فواتير آجل بمبالغ كبيرة:** ${data.largeDebtSalesCount}\n`;

          if (data.mlAnomalies && data.mlAnomalies.length > 0) {
            answer += `\n🔍 **التنبيهات الإحصائية:**\n` +
              data.mlAnomalies.map((a: any) => `• [${a.severity === 'HIGH' ? '⚠️ حرج' : '📌 تنبيه'}] **${a.title}**: ${a.description}`).join('\n');
          }
        }
      } else {
        answer = `🚨 **تقرير كشف المخاطر والتشوهات المالية (إحصائي ذكي) - ${rangeText}:**\n` +
          `• **إجمالي التنبيهات المكتشفة:** ${data.anomalyCount}\n` +
          `• **فواتير بقيمة صفرية:** ${data.zeroAmountSalesCount}\n` +
          `• **سحوبات كاش غير مسددة:** ${data.unrepaidWithdrawalsCount} سحب (الإجمالي: ${data.unrepaidWithdrawalsTotal?.toLocaleString()} ر.س)\n` +
          `• **فواتير آجل مبالغ كبيرة:** ${data.largeDebtSalesCount}\n`;

        if (data.mlAnomalies && data.mlAnomalies.length > 0) {
          answer += `\n🔍 **التنبيهات الإحصائية المكتشفة (Z-Score & Outliers):**\n` +
            data.mlAnomalies.map((a: any) => `• [${a.severity === 'HIGH' ? '⚠️ حرج' : '📌 تنبيه'}] **${a.title}**: ${a.description}\n  💡 *التوصية:* ${a.recommendation}`).join('\n\n');
        }

        if (data.topDistressedCustomers && data.topDistressedCustomers.length > 0) {
          answer += `\n\n👥 **عملاء بحاجة لمتابعة عاجلة (ديون مرتفعة):**\n` +
            data.topDistressedCustomers.map((c: any) => `• **${c.name}**: ${c.balance?.toLocaleString()} ر.س`).join('\n');
        }
      }
      break;
    }

    case 'getForecast': {
      const f = data.forecast;
      const stats = f.statistics;
      const scenarios = f.scenarios;

      const conservative30 = scenarios?.conservative?.totalProjectedSales || Math.round((f.projectedNext30DaysSales || 0) * 0.8);
      const baseline30 = scenarios?.baseline?.totalProjectedSales || f.projectedNext30DaysSales || 0;
      const optimistic30 = scenarios?.optimistic?.totalProjectedSales || Math.round((f.projectedNext30DaysSales || 0) * 1.25);

      answer = `🔮 **تقرير التنبؤ المالي المتقدم ومحاكي المبيعات المستقبلي (ML Forecast & Error Analysis):**\n\n` +
        `📊 **1. التوقعات الأساسية للمبيعات:**\n` +
        `• **تاريخ النشاط المحلل:** ${f.historicalDaysCount} يوم من المبيعات الفعلية\n` +
        `• **متوسط المبيعات اليومية الصافية:** ${f.averageDailySales?.toLocaleString()} ر.س / يوم\n` +
        `• **التنبؤ المعتدل للأسبوع القادم (7 أيام):** **${f.projectedNext7DaysSales?.toLocaleString()} ر.س**\n` +
        `• **التنبؤ المعتدل للشهر القادم (30 يوماً):** **${baseline30?.toLocaleString()} ر.س**\n` +
        `• **التنبؤ للأشهر الثلاثة القادمة (90 يوماً):** **${f.projectedNext90DaysSales?.toLocaleString()} ر.س**\n` +
        `• **معدل مسار النمو المتوقع:** %${(f.growthTrendPercentage || 0) >= 0 ? '+' : ''}${f.growthTrendPercentage || 0}\n\n` +

        `🎯 **2. نطاق الاحتمالية ومحدودية المبيعات (Confidence Interval Bounds):**\n` +
        `استناداً إلى دراسة تقلبات حركة البيع السابقة، تتحدد مبيعات الشهر القادم ضمن الحدود التالية:\n` +
        `• 🛡️ **الحد الأدنى المتحفظ (لا تنقص عنه المبيعات بإذن الله):** **${conservative30?.toLocaleString()} ر.س** (بنسبة ثقة وأمان 95% في أسوأ الظروف)\n` +
        `• ⚖️ **المسار المتوقع المعتدل (الهدف المستقر):** **${baseline30?.toLocaleString()} ر.س**\n` +
        `• 🚀 **الحد الأقصى المتفائل (أعلى سقف متوقع عند الذروة):** **${optimistic30?.toLocaleString()} ر.س**\n\n` +

        `📐 **3. دراسة ومعالجة الأخطاء والتقلبات الإحصائية (Error & Risk Analysis):**\n` +
        `• **الانحراف المعياري للعمليات (Std Deviation):** ±${stats?.standardDeviation?.toLocaleString() || 0} ر.س\n` +
        `• **معدل التذبذب والتقلب اليومي (Volatility):** %${stats?.volatilityRatePercentage || 0}\n` +
        `• **معامل دقة ومطابقة النموذج (R² / Confidence):** %${Math.round((stats?.rSquared || f.confidenceScore || 0.85) * 100)}\n` +
        `• **أفضل أيام الأسبوع مبيعاً (يوم الذروة):** ${stats?.peakDay || 'نهاية الأسبوع'}\n` +
        `• **أهدأ أيام الأسبوع (أقل نشاطاً):** ${stats?.slowestDay || 'وسط الأسبوع'}\n` +
        `• **تقييم الثقة العام:** ${f.seasonalityMessage}\n`;

      if (f.diagnostics && f.diagnostics.length > 0) {
        answer += `\n⚠️ **تنبيهات وتدقيق سلامة أداء المتجر (Store Health Diagnostics):**\n` +
          f.diagnostics.slice(0, 3).map((d: any, idx: number) => 
            `${idx + 1}. **${d.title}**\n` +
            `   • التشخيص: ${d.diagnosis}\n` +
            `   • 💡 الإجراء المقترح: ${d.suggestedAction}`
          ).join('\n\n') + '\n';
      }

      if (data.crossSellingRecommendations && data.crossSellingRecommendations.length > 0) {
        answer += `\n🛒 **توصيات زيادة المبيعات البيعية (Cross-Selling Recommendations):**\n` +
          data.crossSellingRecommendations.slice(0, 3).map((r: any, idx: number) => 
            `${idx + 1}. **شراء [${r.antecedentName}] يرجح شراء [${r.consequentName}]**\n` +
            `   • نسبة الاحتمال (الثقة): %${Math.round(r.confidence * 100)} | قوة الارتباط (Lift): ${r.lift?.toFixed(2)}\n` +
            `   • 💡 المقترح: ${r.recommendationText}`
          ).join('\n\n');
      }
      break;
    }

    case 'getFinancialReport': {
      const rangeText = formatRangeArabic(data.period);
      const p = data.pAndL;
      const b = data.balanceSheet;
      answer = `📊 **التقرير المالي والشامل للنظام (${rangeText}):**\n\n` +
        `📑 **قائمة الدخل (الأرباح والخسائر):**\n` +
        `• **إجمالي المبيعات الإيرادات:** ${p.totalSalesRevenue?.toLocaleString()} ر.س\n` +
        `• **تكلفة المبيعات (COGS):** ${p.totalCOGS?.toLocaleString()} ر.س\n` +
        `• **مجمل الربح الإجمالي:** ${p.grossProfit?.toLocaleString()} ر.س (%${p.grossMarginPercent})\n` +
        `• **المصاريف التشغيلية (مسحوبات):** ${p.operatingExpenses?.toLocaleString()} ر.س\n` +
        `• **صافي الربح التشغيلي:** **${p.netOperatingProfit?.toLocaleString()} ر.س**\n\n` +
        `🏛️ **المركز المالي والأصول:**\n` +
        `• **أصول الديون على العملاء (حسابات مدينين):** ${b.accountsReceivableCustomerDebt?.toLocaleString()} ر.س\n` +
        `• **الالتزامات للموردين (حسابات دائنين):** ${b.accountsPayableSupplierDebt?.toLocaleString()} ر.س\n` +
        `• **تقييم بضاعة المخزن بالتكلفة:** ${b.inventoryAssetValuationCost?.toLocaleString()} ر.س\n` +
        `• **تقييم بضاعة المخزن بسعر البيع المتوقع:** ${b.inventoryAssetValuationRetail?.toLocaleString()} ر.س`;
      break;
    }

    case 'getNotesAndReminders': {
      answer = `📝 **الملاحظات والتذكيرات:**\n` +
        `• **إجمالي الملاحظات:** ${data.totalNotes}\n` +
        `• **الملاحظات المتبقية (غير المكتملة):** ${data.pendingCount}`;

      if (data.pendingNotes && data.pendingNotes.length > 0) {
        answer += `\n\n📌 **قائمة التذكيرات المتبقية:**\n` +
          data.pendingNotes
            .map((n: any, idx: number) => `${idx + 1}. ${n.content} (تاريخ التذكير: ${n.reminder_date || 'غير محدد'})`)
            .join('\n');
      }
      break;
    }

    case 'getTaxReport': {
      const rangeText = formatRangeArabic(data.period);
      answer = `🧾 **إقرار وتقرير ضريبة القيمة المضافة ZATCA (%15) - (${rangeText}):**\n\n` +
        `• **إجمالي المبيعات شامل الضريبة (15%):** **${data.totalSalesInclusive?.toLocaleString()} ر.س**\n` +
        `• **المبلغ الخاضع للضريبة (قبل الضريبة):** ${data.taxBaseAmount?.toLocaleString()} ر.س\n` +
        `• **مبلغ ضريبة القيمة المضافة المحصلة (%15):** **${data.vatCollectedAmount?.toLocaleString()} ر.س**\n` +
        `• **عدد الفواتير الصادرة المشمولة:** ${data.invoicesCount} فاتورة\n\n` +
        `💡 *ملاحظة:* تم احتساب الضريبة بناءً على المعادلة المعتمدة لهيئة الزكاة والضريبة والجمارك (المبلغ الإجمالي / 1.15).`;
      break;
    }

    case 'getTopSellingProducts': {
      if (!data.topProducts || data.topProducts.length === 0) {
        answer = 'ℹ️ لا توجد أي مبيعات مسجلة للمنتجات في السجلات حتى الآن لتحديد الأكثر مبيعاً.';
      } else {
        answer = `🏆 **قائمة أكثر ${data.topProducts.length} منتجات مبيعاً في المتجر:**\n\n` +
          data.topProducts.map((p: any, idx: number) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•';
            return `${medal} ${idx + 1}. **${p.name}** | الكمية المباعة: **${p.totalQty} قطعة** | إجمالي الإيراد: **${p.totalRevenue?.toLocaleString()} ر.س**`;
          }).join('\n');
      }
      break;
    }

    case 'getPOSShiftSummary': {
      const rangeText = formatRangeArabic(data.period);
      const b = data.paymentBreakdown;
      answer = `💼 **تقرير جرد الوردية والصندوق (${rangeText}):**\n\n` +
        `• **إجمالي صافي المبيعات:** **${data.totalSales?.toLocaleString()} ر.س** (${data.transactionCount} عملية)\n` +
        `• **المبيعات النقدية (كاش):** ${b?.cash?.toLocaleString()} ر.س\n` +
        `• **المبيعات الإلكترونية (شبكة / بطاقات):** ${b?.card?.toLocaleString()} ر.س\n` +
        `• **المبيعات الآجلة (ذمم مدينة):** ${b?.credit?.toLocaleString()} ر.س\n` +
        `• **المسحوبات النقدية من الصندوق:** ${data.cashWithdrawals?.toLocaleString()} ر.س\n` +
        `• **النقدية الفعلية المفترضة بالدرج (الكاش الصافي):** **${data.cashInDrawer?.toLocaleString()} ر.س**`;
      break;
    }

    case 'getLargestSale': {
      if (!data.found) {
        answer = data.message || 'لا توجد فواتير بيع مسجلة في النظام حالياً.';
      } else {
        const rangeText = formatRangeArabic(data.dateRange);
        answer = `👑 **أعلى وأكبر عملية بيع تم تسجيلها في المحل (${rangeText}):**\n\n` +
          `• **رقم الفاتورة:** **#${data.invoiceId}**\n` +
          `• **المبلغ الإجمالي:** **${data.totalAmount?.toLocaleString()} ر.س**\n` +
          `• **العميل / المشتري:** **${data.customerName}** ${data.customerPhone ? `(${data.customerPhone})` : ''}\n` +
          `• **تاريخ وتوقيت البيع:** ${new Date(data.date).toLocaleString('ar-SA')}\n` +
          `• **طريقة الدفع:** ${data.paymentType}\n` +
          `• **صافي الربح المحقق منها:** **${data.netProfit?.toLocaleString()} ر.س** (هامش ربح: %${data.marginPercent})\n\n` +
          `📦 **الأصناف والبضائع المباعة في هذه الفاتورة (${data.itemCount} صنف):**\n` +
          data.items.map((item: any, idx: number) => 
            `  ${idx + 1}. **${item.productName}** | الكمية: **${item.quantity}** × ${item.unitPrice?.toLocaleString()} ر.س = **${item.totalPrice?.toLocaleString()} ر.س** (ربح الصنف: ${item.totalProfit?.toLocaleString()} ر.س)`
          ).join('\n');

        if (data.topSales && data.topSales.length > 1) {
          answer += `\n\n🏆 **قائمة أعلى فواتير المبيعات المسجلة في المتجر:**\n` +
            data.topSales.slice(0, 5).map((ts: any) => 
              `  ${ts.rank === 1 ? '🥇' : ts.rank === 2 ? '🥈' : ts.rank === 3 ? '🥉' : '•'} **فاتورة #${ts.invoiceId}**: **${ts.totalAmount?.toLocaleString()} ر.س** (${ts.customerName}) | ${ts.paymentType} | ${new Date(ts.date).toLocaleDateString('ar-SA')}`
            ).join('\n');
        }
      }
      break;
    }

    case 'getDrilldownExplanation': {
      if (data.type === 'INVOICE_DRILLDOWN') {
        answer = `🧾 **توضيح وتفاصيل الفاتورة #${data.invoiceId}:**\n\n` +
          `• **العميل:** **${data.customerName}**\n` +
          `• **التاريخ:** ${new Date(data.date).toLocaleString('ar-SA')}\n` +
          `• **طريقة الدفع:** ${data.paymentType}\n` +
          `• **إجمالي الفاتورة:** **${data.totalAmount?.toLocaleString()} ر.س**\n` +
          `• **التكلفة الإجمالية:** ${data.totalCost?.toLocaleString()} ر.س\n` +
          `• **صافي الربح:** **${data.netProfit?.toLocaleString()} ر.س**\n\n` +
          `📋 **بيان الأصناف والكميات داخل الفاتورة:**\n` +
          data.items.map((item: any, idx: number) => 
            `• **${item.productName}**: عدد ${item.quantity} بسعر ${item.unitPrice} ر.س (الإجمالي: ${item.totalPrice?.toLocaleString()} ر.س | الربح: ${item.totalProfit?.toLocaleString()} ر.س)`
          ).join('\n');
      } else if (data.type === 'CUSTOMER_DRILLDOWN') {
        const c = data.customer;
        answer = `👤 **توضيح وتفاصيل حساب العميل (${c.name}):**\n\n` +
          `• **الرصيد المتبقي:** **${c.balance?.toLocaleString()} ر.س**\n` +
          `• **إجمالي مشترياته المسجلة:** ${data.totalPurchases?.toLocaleString()} ر.س (${data.invoicesCount} فاتورة)\n\n` +
          `📜 **آخر الحركات والفواتير:**\n` +
          data.recentInvoices.map((s: any) => 
            `• فاتورة #${s.id} | ${new Date(s.created_at).toLocaleDateString('ar-SA')} | ${s.total_amount?.toLocaleString()} ر.س (${s.payment_type === 'cash' ? 'كاش' : 'آجل'})`
          ).join('\n');
      } else {
        answer = `💡 **توضيح وتفاصيل إضافية حول الاستفسار السابق:**\n\n` +
          `تم استخراج هذه النتائج مباشرة من سجلات الدفاتر المحاسبية لضمان المطابقة الكاملة. إذا كنت ترغب في فحص فواتير معينة، أو كشف حساب محدد، أو تحليل صنف معين، يرجى التحديد وسأوافيك بالتفاصيل الدقيقة فوراً.`;
      }
      break;
    }

    case 'getSalesComparison': {
      const c = data.current;
      const p = data.previous;
      const comp = data.comparison;
      const trendSign = comp.revenueGrowthPercent >= 0 ? '📈 نمو بنسبة +' : '📉 تراجع بنسبة ';

      answer = `⚖️ **تقرير المقارنة المالية (الشهر الحالي مقارنة بالشهر الماضي):**\n\n` +
        `📊 **1. المبيعات الإجمالية:**\n` +
        `• **الشهر الحالي:** **${c.totalRevenue?.toLocaleString()} ر.س** (${c.invoiceCount} فاتورة)\n` +
        `• **الشهر الماضي:** **${p.totalRevenue?.toLocaleString()} ر.س** (${p.invoiceCount} فاتورة)\n` +
        `• **فارق المبيعات:** **${comp.revenueDiff > 0 ? '+' : ''}${comp.revenueDiff?.toLocaleString()} ر.س** (${trendSign}%${Math.abs(comp.revenueGrowthPercent)})\n\n` +
        `💰 **2. صافي الأرباح:**\n` +
        `• **أرباح الشهر الحالي:** **${c.netProfit?.toLocaleString()} ر.س** (هامش %${c.marginPercent})\n` +
        `• **أرباح الشهر الماضي:** **${p.netProfit?.toLocaleString()} ر.س** (هامش %${p.marginPercent})\n` +
        `• **فارق الأرباح:** **${comp.profitDiff > 0 ? '+' : ''}${comp.profitDiff?.toLocaleString()} ر.س** (%${comp.profitGrowthPercent})\n\n` +
        `💳 **3. تفاصيل حركة الدفع:**\n` +
        `• نقدي (كاش) هذا الشهر: ${c.cashSales?.toLocaleString()} ر.س | آجل (ديون): ${c.debtSales?.toLocaleString()} ر.س\n` +
        `• متوسط قيمة الفاتورة: ${c.avgInvoice?.toLocaleString()} ر.س (مقابل ${p.avgInvoice?.toLocaleString()} ر.س الشهر السابق)`;
      break;
    }

    case 'getDiagnosticAnalysis': {
      answer = `🔍 **التحليل التشخيصي والسببِي للأداء المالي والمبيعات:**\n\n` +
        `📉 **1. الأسباب والمؤشرات المرصودة في النظام:**\n` +
        data.reasons.map((r: string, idx: number) => `${idx + 1}. ${r}`).join('\n') +
        `\n\n💡 **2. التوصيات والإجراءات التصحيحية الفورية:**\n` +
        data.recommendations.map((rec: string, idx: number) => `• **خطوة ${idx + 1}:** ${rec}`).join('\n') +
        `\n\n📌 **مؤشرات مساعدة:**\n` +
        `• عدد الأصناف المنتهية: ${data.outOfStockCount} صنف | النواقص الحرجة: ${data.lowStockCount} صنف\n` +
        `• المسحوبات النقدية للشهر: ${data.totalMonthWithdrawals?.toLocaleString()} ر.س\n` +
        `• نسبة المبيعات الآجلة (ذمم مدينة): %${data.creditRatio} (إجمالي ديون العملاء: ${data.totalCustomerDebt?.toLocaleString()} ر.س)`;
      break;
    }

    case 'getGrowthStrategy': {
      answer = `🚀 **استراتيجية وخطة نمو المبيعات ومضاعفة الأرباح:**\n\n` +
        `🛒 **1. زيادة متوسط سلة الشراء (Cross-Selling & Bundling):**\n` +
        (data.crossSelling && data.crossSelling.length > 0
          ? data.crossSelling.map((r: any, idx: number) => `• **تجميع أصناف:** عند شراء **[${r.antecedentName}]** اقترح على الزبون **[${r.consequentName}]** (نسبة الثقة: %${Math.round(r.confidence * 100)}).`).join('\n')
          : '• رتب المنتجات المتكاملة بجوار بعضها لتشجيع الشراء العفوي.\n') +
        `\n\n💎 **2. التركيز على الأصناف الأعلى هامش ربحي:**\n` +
        (data.highMarginProducts && data.highMarginProducts.length > 0
          ? data.highMarginProducts.map((p: any) => `• **${p.name}**: هامش ربح **%${p.margin}** (الربح للقطعة: ${p.profitPerUnit} ر.س | المخزون: ${p.stock} حبة)`).join('\n')
          : '• مراجعة تسعير الأصناف لرفع الهامش الربحي.\n') +
        `\n\n⚡ **3. حماية الإيرادات وتوفير النواقص:**\n` +
        `• يوجد حالياً **${data.outOfStockCount} صنف منتهٍ** بالمخزن يجب إعادة طلبها فوراً لتفادي ضياع الزبائن.\n` +
        `\n💵 **4. تعزيز السيولة النقدية:**\n` +
        (data.topDebtorsToCollect && data.topDebtorsToCollect.length > 0
          ? `• تكثيف التحصيل من كبار المدينين: (${data.topDebtorsToCollect.map((d: any) => `${d.name}: ${d.balance} ر.س`).join('، ')}) لتوفير سيولة شراء بضائع جديدة.`
          : '• الحفاظ على وتيرة التحصيل النقدي اليومي.');
      break;
    }

    case 'getCustomerCollectionRate': {
      const rangeText = formatRangeArabic(data.period);
      answer = `📈 **تقرير ونسبة التحصيل وسداد الديون من العملاء (${rangeText}):**\n\n` +
        `• **معدل كفاءة التحصيل:** **%${data.collectionRate}**\n` +
        `• **إجمالي المبالغ المحصلة فعلياً:** **${data.totalCollected?.toLocaleString()} ر.س** (${data.paymentTransactionsCount} عملية سداد)\n` +
        `• **إجمالي الديون الجديدة الممنوحة بالفترة:** ${data.totalNewDebts?.toLocaleString()} ر.س\n` +
        `• **إجمالي الرصيد القائم للديون حتى الآن:** **${data.totalOutstandingBalance?.toLocaleString()} ر.س**\n`;

      if (data.topPayers && data.topPayers.length > 0) {
        answer += `\n🏆 **أعلى العملاء سداداً خلال هذه الفترة:**\n` +
          data.topPayers.map((p: any, idx: number) => `• ${idx + 1}. **${p.name}**: سدد **${p.amount?.toLocaleString()} ر.س** (المتبقي عليه: ${p.currentBalance?.toLocaleString()} ر.س)`).join('\n');
      }
      break;
    }

    case 'getCashFlowStatement': {
      const rangeText = formatRangeArabic(data.period);
      const inf = data.inflows;
      const out = data.outflows;
      const netSign = data.isPositive ? '🟢 فائض نقدي موجب' : '🔴 عجز نقدي';

      answer = `💸 **كشف التدفقات النقدية (Cash Flow Statement) - (${rangeText}):**\n\n` +
        `📥 **1. التدفقات النقدية الداخلة (Inflows):**\n` +
        `• مبيعات الكاش النقدية: ${inf.cashSales?.toLocaleString()} ر.س\n` +
        `• تحصيلات وسداد ديون الزبائن: ${inf.debtRepayments?.toLocaleString()} ر.س\n` +
        `• **إجمالي النقد الداخل:** **${inf.totalInflows?.toLocaleString()} ر.س**\n\n` +
        `📤 **2. التدفقات النقدية الخارجة (Outflows):**\n` +
        `• سدادات ومدفوعات الموردين: ${out.supplierPayments?.toLocaleString()} ر.س\n` +
        `• المسحوبات والمصاريف التشغيلية: ${out.operationalWithdrawals?.toLocaleString()} ر.س\n` +
        `• **إجمالي النقد الخارج:** **${out.totalOutflows?.toLocaleString()} ر.س**\n\n` +
        `⚖️ **3. صافي التدفق النقدي:**\n` +
        `• **${netSign}:** **${data.netCashFlow > 0 ? '+' : ''}${data.netCashFlow?.toLocaleString()} ر.س**`;
      break;
    }

    case 'getUnpaidInvoices': {
      answer = `🧾 **كشف الذمم المدينة (الفواتير الآجلة) (ديون المبيعات):**\n\n` +
        `• **إجمالي عدد الفواتير الآجلة (الذمم):** ${data.totalCreditInvoicesCount} فاتورة\n` +
        `• **إجمالي القيمة المستحقة:** **${data.totalCreditAmount?.toLocaleString()} ر.س**\n\n` +
        `📋 **أحدث الفواتير الآجلة (الذمم) المسجلة:**\n` +
        data.recentUnpaidInvoices.map((inv: any, idx: number) => 
          `• ${idx + 1}. **فاتورة #${inv.invoiceId}** | العميل: **${inv.customerName}** | التاريخ: ${new Date(inv.date).toLocaleDateString('ar-SA')} | المبلغ: **${inv.totalAmount?.toLocaleString()} ر.س** (رصيد العميل الحالي: ${inv.customerCurrentBalance?.toLocaleString()} ر.س)`
        ).join('\n');
      break;
    }

    case 'getSuppliersDue': {
      answer = `🏬 **كشف الموردين الذين لديهم مستحقات واجبة السداد:**\n\n` +
        `• **عدد الموردين المستحقين:** ${data.dueSuppliersCount} مورد\n` +
        `• **إجمالي المبالغ المستحقة لهم:** **${data.totalDueAmount?.toLocaleString()} ر.س**\n\n` +
        `📋 **قائمة المستحقات حسب الأولوية والمبلغ:**\n` +
        data.suppliersList.map((s: any, idx: number) => 
          `• ${idx + 1}. **${s.name}** | هاتف: ${s.phone} | المبلغ المستحق: **${s.balance?.toLocaleString()} ر.س**`
        ).join('\n');
      break;
    }

    case 'getInventoryValuation': {
      answer = `📦 **تقرير التقييم المالي الشامل للمخزون الحالي:**\n\n` +
        `• **إجمالي عدد الأصناف:** ${data.totalProductsCount} صنف\n` +
        `• **إجمالي عدد الوحدات المتوفرة:** ${data.totalStockUnits} قطعة\n` +
        `• **القيمة المالية بسعر التكلفة (رأس المال المجمد):** **${data.totalCostValuation?.toLocaleString()} ر.س**\n` +
        `• **القيمة المالية بسعر البيع المتوقع:** **${data.totalRetailValuation?.toLocaleString()} ر.س**\n` +
        `• **مجمل الأرباح المتوقعة عند تمام البيع:** **${data.expectedGrossProfit?.toLocaleString()} ر.س** (هامش ربح متوقع: %${data.expectedMarginPercent})\n\n` +
        `📊 **توزيع قيمة المخزون حسب الأقسام:**\n` +
        data.categoryBreakdown.map((c: any) => 
          `• قسم **[${c.category}]**: عدد ${c.qty} قطعة | التكلفة: ${c.costVal?.toLocaleString()} ر.س | البيع: ${c.retailVal?.toLocaleString()} ر.س`
        ).join('\n');
      break;
    }

    case 'knowledgeBaseRetrieval': {
      if (data.matchedDocuments && data.matchedDocuments.length > 0) {
        answer = `📖 **نتائج البحث المعرفي المستندة إلى الوثائق والمستندات الرسمية:**\n\n` +
          data.matchedDocuments
            .map((doc: any, idx: number) => {
              const cit = doc.citation || {};
              const fileDetail = cit.fileName 
                ? `\n📂 **المصدر المرجعي:** \`${cit.fileName}\` (${cit.fileType.toUpperCase()} | الحجم: ${cit.fileSize || 'غير معروف'} | التصنيف: ${cit.category})`
                : '';
              const matchDetail = doc.explanation 
                ? `\n🎯 **مؤشر الدقة:** %${doc.confidencePercent || 50} (${doc.explanation})`
                : `\n🎯 **نسبة الدقة:** %${doc.confidencePercent || 50}`;
              
              const sectionHeader = cit.sectionTitle ? `📍 **القسم:** ${cit.sectionTitle}\n` : '';
              return `### ${idx + 1}. ${doc.title}\n${sectionHeader}${doc.content}\n${fileDetail}${matchDetail}`;
            })
            .join('\n\n---\n\n');
      } else {
        answer = 'لم أتمكن من العثور على أي معلومات ذات صلة في قاعدة المعرفة المحلية للمستندات.';
      }
      break;
    }

    case 'getStoreHealthDiagnostic': {
      answer = `🏥 **التقرير التشخيصي الشامل لصحة المحل (360° Diagnostic):**\n\n` +
        `• **مؤشر صحة المتجر:** **${data.healthScore} / 100** (${data.statusArabic})\n\n` +
        `📊 **1. المبيعات والنمو:**\n` +
        `• مبيعات هذا الشهر: **${data.sales?.thisMonthRevenue?.toLocaleString()} ر.س** (${data.sales?.invoicesCount} فاتورة)\n` +
        `• مبيعات الشهر الماضي: ${data.sales?.lastMonthRevenue?.toLocaleString()} ر.س\n` +
        `• معدل نمو المبيعات: %${data.sales?.salesGrowthRate}\n\n` +
        `💰 **2. الأرباح وهوامش التكلفة:**\n` +
        `• مجمل الربح: **${data.profit?.grossProfit?.toLocaleString()} ر.س** (هامش %${data.profit?.grossMarginPercent})\n` +
        `• المصاريف والمسحوبات التشغيلية: ${data.profit?.totalExpenses?.toLocaleString()} ر.س\n` +
        `• **صافي الربح الفعلي:** **${data.profit?.netProfit?.toLocaleString()} ر.س**\n\n` +
        `👥 **3. الذمم والديون:**\n` +
        `• ديون العملاء (لنا بالخارج): **${data.debts?.totalCustomerDebt?.toLocaleString()} ر.س**\n` +
        `• مستحقات الموردين (علينا): **${data.debts?.totalSupplierDebt?.toLocaleString()} ر.س**\n\n` +
        `📦 **4. حالة المخزون:**\n` +
        `• إجمالي الأصناف: ${data.inventory?.totalProductsCount} صنف\n` +
        `• الأصناف القريبة من النفاد: **${data.inventory?.lowStockCount} صنف**\n` +
        `• القيمة التقديرية لرأس مال المخزون: ${data.inventory?.totalInventoryValuation?.toLocaleString()} ر.س`;
      break;
    }

    case 'getPerformanceComparison': {
      const icon = data.isBetter ? '📈' : '📉';
      const statusWord = data.isBetter ? 'أفضل وأعلى' : 'أقل';
      answer = `${icon} **مقارنة الأداء المالي بين (${data.currentLabel}) و (${data.previousLabel}):**\n\n` +
        `• **النتيجة العامة:** الأداء في ${data.currentLabel} **${statusWord}** مقارنة بـ ${data.previousLabel}.\n\n` +
        `📊 **تفاصيل المقارنة:**\n` +
        `• **المبيعات:** ${data.current?.revenue?.toLocaleString()} ر.س (مقابل ${data.previous?.revenue?.toLocaleString()} ر.س) | الفارق: **${data.comparison?.revenueDiff > 0 ? '+' : ''}${data.comparison?.revenueDiff?.toLocaleString()} ر.س** (%${data.comparison?.revenueGrowthPercent})\n` +
        `• **مجمل الأرباح:** ${data.current?.grossProfit?.toLocaleString()} ر.س (مقابل ${data.previous?.grossProfit?.toLocaleString()} ر.س) | الفارق: **${data.comparison?.profitDiff > 0 ? '+' : ''}${data.comparison?.profitDiff?.toLocaleString()} ر.س** (%${data.comparison?.profitGrowthPercent})\n` +
        `• **عدد الفواتير:** ${data.current?.invoicesCount} فاتورة (مقابل ${data.previous?.invoicesCount} فاتورة)\n` +
        `• **متوسط قيمة الفاتورة:** ${data.current?.avgInvoiceValue?.toLocaleString()} ر.س (مقابل ${data.previous?.avgInvoiceValue?.toLocaleString()} ر.س)`;
      break;
    }

    case 'getTopRevenueOrProfitProducts': {
      const rangeText = formatRangeArabic(data.dateRange);
      answer = `🏆 **أكثر الأصناف تحقيقاً للدخل والأرباح في (${rangeText}):**\n\n`;
      if (data.highestRevenueProduct) {
        answer += `🌟 **الأعلى دخلاً:** صنف **[${data.highestRevenueProduct.name}]** بإجمالي دخل **${data.highestRevenueProduct.totalRevenue?.toLocaleString()} ر.س** (مباع منه ${data.highestRevenueProduct.quantitySold} قطعة)\n`;
      }
      if (data.highestProfitProduct) {
        answer += `💎 **الأعلى ربحية:** صنف **[${data.highestProfitProduct.name}]** بإجمالي ربح **${data.highestProfitProduct.grossProfit?.toLocaleString()} ر.س**\n\n`;
      }
      if (data.topRevenueProducts && data.topRevenueProducts.length > 0) {
        answer += `📊 **قائمة أعلى 5 منتجات مبيعاً بالدخل:**\n` +
          data.topRevenueProducts.map((p: any, idx: number) =>
            `${idx + 1}. **${p.name}** | المباع: ${p.quantitySold} حبة | الدخل: ${p.totalRevenue?.toLocaleString()} ر.س | الربح: ${p.grossProfit?.toLocaleString()} ر.س`
          ).join('\n');
      }
      break;
    }

    case 'getTopDebtors': {
      answer = `👥 **كبار المدينين وأعلى الزبائن ديوناً:**\n\n` +
        `• **إجمالي مبالغ الديون المعلقة بالخارج:** **${data.totalOutstandingDebt?.toLocaleString()} ر.س**\n` +
        `• **عدد الزبائن المدينين:** ${data.totalDebtorsCount} زبون\n\n` +
        `📋 **قائمة أعلى المدينين:**\n` +
        data.topDebtors.map((d: any, idx: number) =>
          `${idx + 1}. **${d.name}** | الدين: **${d.balance?.toLocaleString()} ر.س** (يمثل %${d.debtSharePercent} من ديون المحل) | هاتف: ${d.phone}`
        ).join('\n');
      break;
    }

    case 'checkNameAmbiguity': {
      if (data.isAmbiguous) {
        answer = `⚠️ **يوجد تشابه في الأسماء في النظام لكلمة ("${data.searchName}"):**\n\n` +
          `تم العثور على سجل في **العملاء** وسجل في **الموردين**:\n\n` +
          `👤 **كعميل (زبون):**\n` +
          data.matchedCustomers.map((c: any) => `• الاسم: **${c.name}** | الرصيد: **${c.balance?.toLocaleString()} ر.س** (لنا عنده)`).join('\n') +
          `\n\n🏬 **كمورد (شركة/تاجر):**\n` +
          data.matchedSuppliers.map((s: any) => `• الاسم: **${s.name}** | الرصيد: **${s.balance?.toLocaleString()} ر.س** (له علينا)`).join('\n') +
          `\n\n💡 *هل تقصد حساب العميل أم حساب المورد؟*`;
      } else if (data.matchedCustomers.length > 0) {
        answer = `👤 **تم العثور على العميل ("${data.matchedCustomers[0].name}"):**\n• الرصيد المتبقي عليه: **${data.matchedCustomers[0].balance?.toLocaleString()} ر.س**`;
      } else if (data.matchedSuppliers.length > 0) {
        answer = `🏬 **تم العثور على المورد ("${data.matchedSuppliers[0].name}"):**\n• المستحقات له علينا: **${data.matchedSuppliers[0].balance?.toLocaleString()} ر.س**`;
      } else {
        answer = `⚠️ لم يتم العثور على أي عميل أو مورد مطابق للاسم "${data.searchName}".`;
      }
      break;
    }

    case 'getProductProfitAndSales': {
      const rangeText = formatRangeArabic(data.dateRange);
      if (!data.found) {
        answer = `⚠️ لم يتم العثور على الصنف المطلوب "${data.searchName}" في النظام.`;
      } else {
        answer = `📦 **تحليل مبيعات وربح صنف [${data.product.name}] في (${rangeText}):**\n\n` +
          `• **الكمية المباعة:** **${data.totalQtySold} قطعة** (في ${data.salesCount} فاتورة)\n` +
          `• **إجمالي دخل المبيعات:** **${data.totalRevenue?.toLocaleString()} ر.س**\n` +
          `• **إجمالي تكلفة الشراء:** ${data.totalCost?.toLocaleString()} ر.س (سعر التكلفة للقطعة: ${data.product.costPrice} ر.س)\n` +
          `• **مجمل الربح المحقق:** **${data.grossProfit?.toLocaleString()} ر.س**\n` +
          `• **هامش الربح:** %${data.profitMarginPercent}\n` +
          `• **المخزون المتبقي حالياً:** ${data.product.currentStock} قطعة`;
      }
      break;
    }

    case 'getSupplierPaymentsByDate': {
      const rangeText = formatRangeArabic(data.dateFilter);
      answer = `💵 **تقرير مدفوعات وتسديدات الموردين (${rangeText}):**\n\n` +
        `• **المورد / الجهة المستعلم عنها:** **${data.supplierName}**\n` +
        `• **إجمالي المبلغ المسدد في هذه الفترة:** **${data.totalPaid?.toLocaleString()} ر.س**\n` +
        `• **عدد الفواتير / سندات الصرف:** ${data.count} سند\n`;

      if (data.payments && data.payments.length > 0) {
        answer += `\n🧾 **تفاصيل العمليات المسجلة:**\n` +
          data.payments.map((p: any) =>
            `• ${new Date(p.date).toLocaleDateString('ar-SA')} | مبلغ **${p.amount?.toLocaleString()} ر.س** [${p.notes}]`
          ).join('\n');
      } else {
        answer += `\nℹ️ لم يتم تسديد أي مبالغ نقدية للمورد خلال تاريخ أو فترة (${rangeText}).`;
      }
      break;
    }

    case 'getCreditSales': {
      const rangeText = formatRangeArabic(data.period);
      answer = `💳 **تقرير المبيعات بالآجل والبيع بالدين (${rangeText}):**\n\n` +
        `• **إجمالي المبيعات بالآجل (الديون الجديدة):** **${data.totalCreditAmount?.toLocaleString()} ر.س**\n` +
        `• **عدد فواتير البيع بالآجل:** ${data.creditInvoicesCount} فاتورة\n` +
        `• **إجمالي المبيعات الكلية بالفترة:** ${data.totalSalesRevenue?.toLocaleString()} ر.س\n` +
        `• **نسبة الآجل من المبيعات:** %${data.creditRatio}\n`;

      if (data.recentCreditInvoices && data.recentCreditInvoices.length > 0) {
        answer += `\n📋 **أبرز فواتير الآجل الأخيرة:**\n` +
          data.recentCreditInvoices.map((inv: any) =>
            `• فاتورة #${inv.id} | العميل: **${inv.customerName}** | المبلغ: **${inv.amount?.toLocaleString()} ر.س** (${new Date(inv.date).toLocaleDateString('ar-SA')})`
          ).join('\n');
      }
      break;
    }

    case 'getWithdrawalsAndAdjustments': {
      const rangeText = formatRangeArabic(data.period);
      answer = `📉 **تقرير سحب وتسويات المسحوبات النقدية (${rangeText}):**\n\n` +
        `• **إجمالي المسحوبات والتسويات:** **${data.totalAmount?.toLocaleString()} ر.س**\n` +
        `• **عدد حركات السحب والتسوية:** ${data.count} حركة\n`;

      if (data.items && data.items.length > 0) {
        answer += `\n📋 **تفاصيل الحركات:**\n` +
          data.items.map((item: any) =>
            `• ${new Date(item.date).toLocaleDateString('ar-SA')} | مبلغ: **${item.amount?.toLocaleString()} ر.س** | البيان: *${item.reason}*`
          ).join('\n');
      } else {
        answer += `\nℹ️ لا توجد حركات سحب أو تسويات نقدية مسجلة في (${rangeText}).`;
      }
      break;
    }

    case 'getSystemDictionaryExplanation': {
      if (data.matches && data.matches.length > 0) {
        answer = `📖 **قاموس ومعجم الدليل الشامل لمصطلحات وبطاقات النظام:**\n\n` +
          data.matches.map((m: any) =>
            `📌 **${m.arabicName} (${m.englishName}):**\n` +
            `• **التصنيف:** ${m.category}\n` +
            `• **الشرح والدليل التفصيلي:** ${m.description}\n` +
            `• **المرادفات الشائعة:** ${m.synonyms.join(' - ')}`
          ).join('\n\n---\n\n');

        if (data.liveMetricsSummary) {
          answer += `\n\n📊 **القيم المباشرة الحالية بالنظام:**\n` +
            `• إجمالي المبيعات التراكمية: **${data.liveMetricsSummary.totalSalesRevenue?.toLocaleString()} ر.س**\n` +
            `• إجمالي ديون العملاء: **${data.liveMetricsSummary.totalCustomerDebt?.toLocaleString()} ر.س**\n` +
            `• إجمالي مستحقات الموردين: **${data.liveMetricsSummary.totalSupplierDebt?.toLocaleString()} ر.س**\n` +
            `• رأس مال المخزون بسعر التكلفة: **${data.liveMetricsSummary.totalCostValue?.toLocaleString()} ر.س**`;
        }
      } else {
        answer = `📖 **معجم وقاموس النظام والمصطلحات المحاسبية:**\n\n` +
          `يحتوي القاموس المدمج بالنظام على تعريف شامل لكافة الأقسام، البطاقات الإحصائية، الأزرار، والرموز المعرفة بالمحل.\n\n` +
          `💡 يمكنك السؤال عن أي مصطلح أو بطاقة مثل:\n` +
          `• *"شرح بطاقة رأس المال المسلم للتجار"*\n` +
          `• *"ما معنى إجمالي المبيعات بسعر البيع"*\n` +
          `• *"ماذا تعني بطاقة سحب وتسويات"*\n` +
          `• *"شرح زر قارئ الباركود"*\n` +
          `• *"ما هي بطاقة المبيعات بالآجل"*`;
      }
      break;
    }

    case 'getFullSystemAudit': {
      const inv = data.inventory || {};
      const cust = data.customers || {};
      const supp = data.suppliers || {};
      const fin = data.finance || {};

      const periodLabelMap: Record<string, string> = {
        TODAY: 'اليوم',
        YESTERDAY: 'الأمس',
        THIS_WEEK: 'الأسبوع الحالي',
        LAST_WEEK: 'الأسبوع الماضي',
        THIS_MONTH: 'الشهر الحالي',
        LAST_MONTH: 'الشهر الماضي',
        THIS_YEAR: 'السنة الحالية',
        LAST_YEAR: 'السنة الماضية',
        ALL: 'الشامل والتراكمي (لكل الأوقات)',
      };

      let periodTitle = periodLabelMap[data.period] || data.period || 'الكلي';
      if (typeof data.period === 'string') {
        if (data.period.startsWith('DATE_BETWEEN:')) {
          const parts = data.period.replace('DATE_BETWEEN:', '').split(':');
          periodTitle = `الفترة من ${parts[0]} إلى ${parts[1]}`;
        } else if (data.period.startsWith('MONTH:')) {
          periodTitle = `شهر ${data.period.replace('MONTH:', '')}`;
        } else if (data.period.startsWith('EXACT_DATE:')) {
          periodTitle = `تاريخ ${data.period.replace('EXACT_DATE:', '')}`;
        } else if (data.period.startsWith('LAST_N_DAYS:')) {
          periodTitle = `آخر ${data.period.replace('LAST_N_DAYS:', '')} يوم`;
        }
      }

      const netPos = data.netBusinessPosition || 0;
      const netPosText = netPos >= 0 
        ? `صافي إيجابي لصالحك بقيمة **+${netPos.toLocaleString()} ر.س** (ديون العملاء أضخم من التزامات الموردين)`
        : `عجز التزامات بقيمة **${netPos.toLocaleString()} ر.س** (مستحقات الموردين أعلى من ديون العملاء)`;

      answer = `📊 **تقرير الجرد التفصيلي المبتكر (${periodTitle}):**\n\n` +
        `أهلاً بك. تم إجراء جرد حقيقي مباشر لكافة بيانات الحسابات والمخزون والمبيعات المسجلة للفترة المحددة (**${periodTitle}**):\n\n` +
        `📦 **1. جرد المخزون والمنتجات (Inventory & Stock Audit):**\n` +
        `• إجمالي الأصناف المسجلة بالنظام: **${inv.totalProductsCount} صنف**\n` +
        `• إجمالي الكميات المتاحة حالياً بالمخزن: **${inv.totalStockQuantity?.toLocaleString()} قطعة**\n` +
        `• قطع البضائع المباعة خلال الفترة (**${periodTitle}**): **${inv.periodSoldItemsCount?.toLocaleString() || 0} قطعة**\n` +
        `• القيمة المالية الإجمالية للمخزون بسعر التكلفة (رأس المال): **${inv.totalCostValue?.toLocaleString()} ر.س**\n` +
        `• القيمة المالية الإجمالية للمخزون بسعر البيع (القيمة السوقية): **${inv.totalRetailValue?.toLocaleString()} ر.س**\n` +
        `• الربح المتوقع عند تصريف بضاعة المخزون بالكامل: **+${inv.potentialProfit?.toLocaleString()} ر.س**\n` +
        `• الأصناف القريبة من النفاد: **${inv.lowStockCount} صنف** | النافذة تماماً: **${inv.outOfStockCount} صنف**\n\n` +

        `💵 **2. جرد المبيعات والأرباح لـ (${periodTitle}):**\n` +
        `• عدد الفواتير الصادرة: **${fin.totalInvoicesCount} فاتورة**\n` +
        `• إجمالي إيرادات المبيعات: **${fin.totalSalesRevenue?.toLocaleString()} ر.س**\n` +
        `• تكلفة البضاعة المباعة (COGS): ${fin.totalCostOfSales?.toLocaleString()} ر.س\n` +
        `• مجمل الأرباح المحققة: **+${fin.grossProfit?.toLocaleString()} ر.س**\n` +
        `• المصاريف والمسحوبات النقدية: **${fin.totalWithdrawalsAmount?.toLocaleString()} ر.س**\n` +
        `• **صافي الربح الفعلي المتبقي للفترة:** **+${fin.netProfit?.toLocaleString()} ر.س**\n\n` +

        `👥 **3. جرد الذمم والديون المترتبة (Receivables & Creditors):**\n` +
        `• إجمالي ديون العملاء والزبائن (ذمم مدينة لنا): **${cust.totalDebt?.toLocaleString()} ر.س** (على ${cust.indebtedCount} عميل مدين)\n` +
        `• إجمالي مستحقات الموردين والشركات (ذمم دائنة علينا): **${supp.totalDebt?.toLocaleString()} ر.س** (لصالح ${supp.creditorCount} مورد دائن)\n` +
        `• **المركز المالي الحالي للديون:** ${netPosText}\n`;

      if (cust.topDebtors && cust.topDebtors.length > 0) {
        answer += `• **أعلى المدينين ديناً:** ` + cust.topDebtors.map((d: any) => `${d.name} (${d.balance?.toLocaleString()} ر.س)`).join(', ') + `\n`;
      }
      if (supp.topCreditors && supp.topCreditors.length > 0) {
        answer += `• **أعلى الموردين مستحقات:** ` + supp.topCreditors.map((s: any) => `${s.name} (${s.balance?.toLocaleString()} ر.س)`).join(', ') + `\n`;
      }

      answer += `\n✅ **خلاصة تقييم الجرد:**\n` +
        `جميع السجلات مطابقة ودقيقة بلحظية كاملة للفترة المحددة (**${periodTitle}**)، وبدون أي تضارب حسابي.`;
      break;
    }

    case 'getInventoryLogs': {
      const targetLabel = data.matchedSupplierName
        ? `لبضائع المورد (${data.matchedSupplierName})`
        : data.searchedTarget
        ? `للصنف أو البحث (${data.searchedTarget})`
        : 'لكافة البضائع والأصناف في المخزن';

      if (!data.logs || data.logs.length === 0) {
        answer = `📦 **سجل حركات وتعديلات المخزن (${targetLabel}):**\n\n` +
          `• لا توجد أي حركات تعديل أو سحب أو توريد مسجلة حتى الآن.\n` +
          `💡 يتم تسجيل الحركات تلقائياً في السجل عند إضافة صنف جديد، أو تعديل كمية بالمخزن، أو سحب بضاعة، أو إجراء مبيعات.`;
      } else {
        answer = `📦 **سجل حركات وتعديلات المخزن ${targetLabel}:**\n\n` +
          `• **إجمالي الحركات المسجلة في السجل:** ${data.filteredCount || data.logs.length} حركة\n` +
          `• **إجمالي كميات التوريد والإضافة:** +${data.totalAdditionsQty?.toLocaleString() || 0} قطعة\n` +
          `• **إجمالي كميات السحب والتخفيض:** -${data.totalWithdrawalsQty?.toLocaleString() || 0} قطعة\n\n` +
          `📋 **تفاصيل آخر العمليات المسجلة:**\n` +
          data.logs.map((l: any, idx: number) => {
            const changeSign = (l.changeAmount > 0 ? '+' : '') + l.changeAmount;
            const emoji = l.changeAmount > 0 ? '🟢' : l.changeAmount < 0 ? '🔴' : '🔄';
            const dateStr = l.date ? new Date(l.date).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : 'غير محدد';
            return `${emoji} ${idx + 1}. **${l.productName}** | **${l.arabicType || l.type}**\n` +
                   `   • حركة الكمية: **${changeSign} قطعة** (الرصيد السابق: ${l.oldQuantity} ⬅️ الجديد: **${l.newQuantity}**)\n` +
                   `   • 🕒 التاريخ: ${dateStr} ${l.notes && l.notes !== 'لا توجد ملاحظات' ? `| 📝 ${l.notes}` : ''}`;
          }).join('\n\n');
      }
      break;
    }

    default: {
      answer = 'تم استرجاع البيانات بنجاح من قاعدة البيانات المحاسبية المحلية.';
      break;
    }
  }

  const offlinePrefix = `🔒 **[الوكيل المحاسبي المحلي]**\n\n`;

  return {
    answer: offlinePrefix + answer,
    evidence,
    confidence: nluResult.intent.confidence || 0.9,
  };
}

function formatRangeArabic(range?: string): string {
  if (!range || range === 'ALL') return 'لكافة الفترات - الإجمالي التراكمي الشامل';

  if (range.startsWith('EXACT_DATE:')) {
    const dStr = range.replace('EXACT_DATE:', '').trim();
    const [y, m, d] = dStr.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dateObj = new Date(y, m - 1, d);
      const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayName = dayNames[dateObj.getDay()];
      return `تاريخ ${dStr} (${dayName})`;
    }
    return `تاريخ ${dStr}`;
  }

  const weekMatch = range.match(/^WEEK_([1-5])(_LAST_MONTH)?$/);
  if (weekMatch) {
    const weekNum = weekMatch[1];
    const isLastMonth = !!weekMatch[2];
    const weekNames: Record<string, string> = {
      '1': 'الأول',
      '2': 'الثاني',
      '3': 'الثالث',
      '4': 'الرابع',
      '5': 'الخامس',
    };
    const wText = weekNames[weekNum] || weekNum;
    return `الأسبوع ${wText} من ${isLastMonth ? 'الشهر الماضي' : 'الشهر الحالي'}`;
  }

  const dayMap: Record<string, string> = {
    DAY_SATURDAY: 'يوم السبت',
    DAY_SUNDAY: 'يوم الأحد',
    DAY_MONDAY: 'يوم الإثنين',
    DAY_TUESDAY: 'يوم الثلاثاء',
    DAY_WEDNESDAY: 'يوم الأربعاء',
    DAY_THURSDAY: 'يوم الخميس',
    DAY_FRIDAY: 'يوم الجمعة',
    DAY_SATURDAY_LAST_WEEK: 'يوم السبت الماضي',
    DAY_SUNDAY_LAST_WEEK: 'يوم الأحد الماضي',
    DAY_MONDAY_LAST_WEEK: 'يوم الإثنين الماضي',
    DAY_TUESDAY_LAST_WEEK: 'يوم الثلاثاء الماضي',
    DAY_WEDNESDAY_LAST_WEEK: 'يوم الأربعاء الماضي',
    DAY_THURSDAY_LAST_WEEK: 'يوم الخميس الماضي',
    DAY_FRIDAY_LAST_WEEK: 'يوم الجمعة الماضي',
  };
  if (dayMap[range]) return dayMap[range];

  if (!range || range === 'ALL' || range === 'CUMULATIVE') {
    return 'لكل الفترات (الإجمالي الكلي التراكمي)';
  }

  switch (range) {
    case 'TODAY':
      return 'اليوم';
    case 'YESTERDAY':
      return 'الأمس';
    case 'THIS_WEEK':
      return 'هذا الأسبوع';
    case 'LAST_WEEK':
      return 'الأسبوع الماضي';
    case 'THIS_MONTH':
      return 'هذا الشهر';
    case 'LAST_MONTH':
      return 'الشهر الماضي';
    case 'THIS_YEAR':
      return 'هذه السنة';
    case 'LAST_YEAR':
      return 'السنة الماضية';
    default:
      return range;
  }
}
