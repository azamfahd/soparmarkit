import { UserQuery, NLUResult, Evidence, AgentResponse } from '../types';

/**
 * Formats structured Evidence into a clear, professional Arabic response.
 */
export async function generateResponse(
  query: UserQuery,
  nluResult: NLUResult,
  evidence: Evidence[],
  memoryContext: any
): Promise<AgentResponse> {
  let onlineFallbackReason: string | null = null;

  // Check the AI / RAG engine mode setting from localStorage ('local', 'server', 'auto')
  const aiEngineMode = typeof localStorage !== 'undefined'
    ? (localStorage.getItem('grocery_ai_embedding_mode') || 'local')
    : 'local';

  // Retrieve custom API key provided manually by user in Settings (Privacy & Security First)
  const customApiKey = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('user_gemini_api_key') || localStorage.getItem('gemini_api_key') || undefined)
    : undefined;

  // Only invoke Online Gemini AI Cloud API if mode is NOT 'local' (i.e. 'server' or 'auto') AND online
  if (aiEngineMode !== 'local' && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      // Extract the RAG matched documents
      const ragEvidence = evidence?.find(e => e.source === 'RAG');
      const ragContext = ragEvidence?.data?.matchedDocuments || [];

      // Extract local database evidence
      const accountingEvidence = evidence?.filter(e => e.source !== 'RAG') || [];

      // Retrieve message history
      const historyItems = memoryContext?.history || [];
      const history = historyItems
        .map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content,
        }))
        .slice(-8); // Keep last 8 turns for high prompt efficiency

      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query.rawText,
          history,
          ragContext,
          evidence: accountingEvidence,
          customApiKey,
          dbSummary: {
            intentName: nluResult.intent.name,
            timestamp: new Date().toLocaleString('ar-SA'),
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.text) {
          const modelBadge = result.modelUsed ? ` - نموذج ${result.modelUsed}` : '';
          const formattedAnswer = `🌐 **[إجابة سحابية بمفتاحك الخاص - Gemini AI${modelBadge}]**\n\n${result.text}`;
          return {
            answer: formattedAnswer,
            evidence: evidence || [],
            confidence: nluResult.intent.confidence || 0.95,
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        onlineFallbackReason = errJson?.error || `رمز الاستجابة السحابية HTTP ${response.status}`;
        console.warn('Online assistant API error:', onlineFallbackReason);
      }
    } catch (err: any) {
      onlineFallbackReason = err?.message || 'فشل الاتصال بالشبكة للسيرفر';
      console.warn('Online Gemini generation failed; switching to local offline template engine:', err);
    }
  }

  if (!evidence || evidence.length === 0) {
    const intent = nluResult.intent.name;
    let answer = 'لم أتمكن من العثور على بيانات مطابقة لاستفسارك في سجلات النظام.';
    
    if (intent === 'GREETING_SMALLTALK') {
      answer = `👋 **مرحباً بك في نظام المخزن الذكي المحاسبي!**\n\n` +
        `أنا **مستشارك الحسابي الذكي** المدمج بالكامل داخل النظام. يسعدني مساعدتك في استخراج التقارير المالية، مراقبة المخزون، وتتبع ديون العملاء والموردين بدقة متناهية.\n\n` +
        `💡 *يمكنك سؤالي مباشرة عن مبيعات اليوم، البضائع الناقصة، أو كشف حساب أي زبون أو مورد.*`;
    } else if (intent === 'SYSTEM_HELP' || intent === 'EXPLANATION_HELP') {
      answer = `📖 **دليل المساعد الحسابي الذكي (كيف تسألني؟):**\n\n` +
        `أنا مبرمج لمساعدتك في إدارة وتدقيق حسابات البقالة والمخزن الخاص بك. إليك أمثلة على الأسئلة التي يمكنني الإجابة عليها فورياً وبدقة محاسبية كاملة:\n\n` +
        `📊 **1. المبيعات والأرباح:**\n` +
        `• *"كم المبيعات اليوم؟"*\n` +
        `• *"كم الأرباح هذا الشهر؟"*\n` +
        `• *"تقرير المبيعات الكلي"* \n\n` +
        `👥 **2. ديون العملاء وسجلاتهم:**\n` +
        `• *"كم ديون العملاء؟"*\n` +
        `• *"كشف حساب العميل [الاسم]"*\n` +
        `• *"من هم أكثر العملاء ديناً؟"*\n\n` +
        `🏬 **3. مستحقات الموردين وتكلفتها:**\n` +
        `• *"كم ديون الموردين؟"*\n` +
        `• *"كشف حساب المورد [الاسم]"*\n\n` +
        `📦 **4. حالة المخزون وتواريخ الانتهاء:**\n` +
        `• *"ما هي البضائع الناقصة؟"*\n` +
        `• *"ما هي المنتجات المنتهية الصلاحية؟"*\n` +
        `• *"تفاصيل صنف [الاسم]"*\n\n` +
        `🔮 **5. التنبؤات والذكاء المالي:**\n` +
        `• *"توقعات المبيعات للشهر القادم"* \n` +
        `• *"كشف التشوهات المالية والأخطاء"* \n\n` +
        `🔒 *ملاحظة: جميع عمليات الاستعلام تتم محلياً وبأقصى درجات الحماية والسرية لبياناتك.*`;
    } else if (intent === 'ACCOUNTING_CONCEPT' || intent === 'GENERAL_ACCOUNTING') {
      answer = `💡 **شرح محاسبي مبسط لمتاجر التجزئة والسوبرماركت:**\n\n` +
        `• **مجمل الربح (Gross Profit):** هو الفارق المباشر بين سعر بيع المنتجات وسعر تكلفتها (سعر البيع - سعر الشراء) قبل خصم أي مصاريف تشغيلية.\n` +
        `• **صافي الربح (Net Profit):** هو الربح الحقيقي المتبقي للمحل بعد خصم جميع المصاريف والمسحوبات النقدية من مجمل الربح (مجمل الربح - المسحوبات النقدية).\n` +
        `• **حساب الأصول والخصوم:** في نظامك، تعتبر البضائع المتوفرة بالمخزن وديون العملاء أصولاً للمحل، بينما تمثل مبالغ الموردين غير المدفوعة التزامات (خصوماً) على المحل.\n` +
        `• **سند القبض:** يتم إنشاؤه تلقائياً عند قيام أي عميل بسداد جزء من دينه ويتم إدخال النقدية فوراً للصندوق لضمان دقة جرد الصندوق اليومي.`;
    }

    let offlinePrefix = '';
    if (onlineFallbackReason) {
      offlinePrefix = `⚠️ **[تنبيه الانتقال للمساعد المحلي]** تعذر الاتصال بسحابة Gemini AI (${onlineFallbackReason}). تم الانتقال تلقائياً إلى **المحرك المحاسبي المحلي**.\n\n`;
    } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
      offlinePrefix = `📴 **[المساعد المحاسبي المحلي - بدون إنترنت]**\n\n`;
    } else {
      offlinePrefix = `🔒 **[المساعد المحاسبي المحلي - وضع الخصوصية والأمان 100%]**\n\n`;
    }

    return {
      answer: offlinePrefix + answer,
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
      answer = `📊 **تقرير المبيعات (${rangeText}):**\n` +
        `• **إجمالي المبيعات:** ${data.totalAmount?.toLocaleString()} ر.س\n` +
        `• **عدد الفواتير:** ${data.invoiceCount} فاتورة\n` +
        `• **متوسط قيمة الفاتورة:** ${data.averageInvoiceValue?.toLocaleString()} ر.س\n` +
        `• **المبيعات النقدية (كاش):** ${data.cashSales?.toLocaleString()} ر.س\n` +
        `• **المبيعات الآجلة (ديون):** ${data.debtSales?.toLocaleString()} ر.س`;

      if (data.topProducts && data.topProducts.length > 0) {
        answer += `\n\n🏆 **المنتجات الأكثر مبيعاً:**\n` +
          data.topProducts
            .map((p: any, idx: number) => `${idx + 1}. **${p.name}** - ${p.totalQty} قطعة (${p.totalRevenue?.toLocaleString()} ر.س)`)
            .join('\n');
      }
      break;
    }

    case 'getProfitSummary': {
      const rangeText = formatRangeArabic(data.dateRange);
      answer = `📈 **تقرير الأرباح (${rangeText}):**\n` +
        `• **إجمالي الإيرادات:** ${data.totalRevenue?.toLocaleString()} ر.س\n` +
        `• **إجمالي التكلفة:** ${data.totalCost?.toLocaleString()} ر.س\n` +
        `• **صافي الربح:** **${data.netProfit?.toLocaleString()} ر.س**\n` +
        `• **هامش الربح:** %${data.marginPercent}`;
      break;
    }

    case 'getCustomerDebts': {
      if (data.searchedName && data.matchedCustomers) {
        if (data.matchedCustomers.length === 0) {
          answer = `لم يتم العثور على زبون باسم "${data.searchedName}".`;
        } else {
          answer = `👤 **كشف حساب الزبون (${data.searchedName}):**\n` +
            data.matchedCustomers
              .map((c: any) => `• **${c.name}**: المتبقي عليه **${c.balance?.toLocaleString()} ر.س** (هاتف: ${c.phone || 'غير مسجل'})`)
              .join('\n');
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
        answer = `📄 **كشف حساب مفصل - العملاء:**\n` +
          `• **الاسم:** **${c.name}**\n` +
          `• **الهاتف:** ${c.phone || 'غير مسجل'}\n` +
          `• **الرصيد الحالي المتبقي عليه:** **${c.currentBalance?.toLocaleString()} ر.س**\n` +
          `• **إجمالي الآجل (المشتريات):** ${s.totalPurchases?.toLocaleString()} ر.س\n` +
          `• **إجمالي السدادات النقدي:** ${s.totalPayments?.toLocaleString()} ر.س\n`;

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
      break;
    }

    case 'getSupplierDebts': {
      if (data.searchedName && data.matchedSuppliers) {
        if (data.matchedSuppliers.length === 0) {
          answer = `لم يتم العثور على مورد باسم "${data.searchedName}".`;
        } else {
          answer = `🏬 **كشف حساب المورد (${data.searchedName}):**\n` +
            data.matchedSuppliers
              .map((s: any) => `• **${s.name}**: المستحق له **${s.balance?.toLocaleString()} ر.س** (هاتف: ${s.phone || 'غير مسجل'})`)
              .join('\n');
        }
      } else {
        let prefix = '';
        if (data.notMatchedSearchedName) {
          prefix = `⚠️ لم نجد مورداً باسم "${data.notMatchedSearchedName}" في السجلات. إليك ملخص إجمالي مستحقات الموردين:\n\n`;
        }
        answer = `${prefix}🏬 **ملخص ديون الموردين:**\n` +
          `• **إجمالي المستحقات للموردين:** **${data.totalSupplierDebt?.toLocaleString()} ر.س**\n` +
          `• **عدد الموردين المستحق لهم مبالغ:** ${data.indebtedSuppliersCount} مورد\n`;

        if (data.topSuppliersDue && data.topSuppliersDue.length > 0) {
          answer += `\n📋 **أعلى الموردين ديناً علينا:**\n` +
            data.topSuppliersDue
              .map((s: any, idx: number) => `${idx + 1}. **${s.name}**: ${s.balance?.toLocaleString()} ر.س`)
              .join('\n');
        }
      }
      break;
    }

    case 'getSupplierStatement': {
      if (!data.found) {
        answer = data.message || `لم أتمكن من العثور على مورد مطبق.`;
      } else {
        const sup = data.supplier;
        answer = `📄 **كشف حساب مفصل - الموردين:**\n` +
          `• **المورد / الشركة:** **${sup.name}**\n` +
          `• **الهاتف:** ${sup.phone || 'غير مسجل'}\n` +
          `• **المبلغ المستحق له حالياً:** **${sup.currentBalance?.toLocaleString()} ر.س**\n` +
          `• **إجمالي ما تم تسديده له:** ${data.summary?.totalPaidToSupplier?.toLocaleString()} ر.س\n`;

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
          answer = `لم يتم العثور على صنف باسم "${data.searchedName}".`;
        } else {
          answer = `📦 **تفاصيل المنتج (${data.searchedName}):**\n` +
            data.matchedProducts
              .map(
                (p: any) =>
                  `• **${p.name}**: الكمية المتبقية **${p.stock_quantity}** | سعر البيع: ${p.sale_price} ر.س | سعر التكلفة: ${p.cost_price} ر.س`
              )
              .join('\n');
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
      if (data.searchedProduct) {
        answer = `🛍️ **حركة بيع الصنف (${data.searchedProduct}):**\n` +
          `• **المنتجات المطابقة:** ${data.matchedProducts?.join(', ')}\n` +
          `• **إجمالي الكمية المباعة:** **${data.totalQuantitySold} قطعة**\n` +
          `• **إجمالي الإيراد المحقق:** **${data.totalRevenue?.toLocaleString()} ر.س**\n` +
          `• **عدد مرات الشراء:** ${data.saleCount} مرة`;
      } else {
        answer = `📊 **تحليل المبيعات حسب أصناف المنتجات:**\n` +
          `• **إجمالي المنتجات المباعة:** ${data.totalUniqueProductsSold} صنف\n\n` +
          `🔥 **الأكثر مبيعاً بالكمية:**\n` +
          data.topSellingByQty?.map((p: any, i: number) => `${i + 1}. **${p.name}**: ${p.qty} قطعة (${p.revenue?.toLocaleString()} ر.س)`).join('\n');
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
      answer = `💵 **ملخص الصندوق والسحوبات:**\n` +
        `• **عدد السحوبات غير المسددة:** ${data.unrepaidWithdrawalsCount}\n` +
        `• **إجمالي المسحوبات غير المسددة:** **${data.totalUnrepaidAmount?.toLocaleString()} ر.س**`;
      break;
    }

    case 'getAnomalyDetection': {
      answer = `🚨 **تقرير كشف المخاطر والتشوهات المالية (إحصائي ذكي):**\n` +
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
      break;
    }

    case 'getForecast': {
      const f = data.forecast;
      answer = `🔮 **تقرير التنبؤ والتحليلات المستقبلية الإحصائية (ML Forecast):**\n` +
        `• **سجل المبيعات التاريخية المحللة:** ${f.historicalDaysCount} يوم\n` +
        `• **متوسط المبيعات اليومية الصافية:** ${f.averageDailySales?.toLocaleString()} ر.س\n` +
        `• **التنبؤ بالمبيعات للأسبوع القادم (7 أيام):** **${f.projectedNext7DaysSales?.toLocaleString()} ر.س**\n` +
        `• **التنبؤ بالمبيعات للشهر القادم (30 يوماً):** **${f.projectedNext30DaysSales?.toLocaleString()} ر.س**\n` +
        `• **معدل النمو المتوقع للمبيعات:** %${f.growthTrendPercentage}\n` +
        `• **مؤشر دقة التنبؤ الثنائي (Confidence):** %${Math.round(f.confidenceScore * 100)}\n` +
        `• **ملاحظة الاتجاه العام:** ${f.seasonalityMessage}\n`;

      if (data.crossSellingRecommendations && data.crossSellingRecommendations.length > 0) {
        answer += `\n🛒 **توصيات زيادة المبيعات البيعية (Cross-Selling Recommendations):**\n` +
          data.crossSellingRecommendations.map((r: any, idx: number) => 
            `${idx + 1}. **شراء [${r.antecedentName}] يرجح شراء [${r.consequentName}]**\n` +
            `   • نسبة الاحتمال (الثقة): %${Math.round(r.confidence * 100)} | قوة الارتباط (Lift): ${r.lift?.toFixed(2)}\n` +
            `   • 💡 *المقترح:* ${r.recommendationText}`
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

    default: {
      answer = 'تم استرجاع البيانات بنجاح من قاعدة البيانات المحاسبية المحلية.';
      break;
    }
  }

  let offlinePrefix = '';
  if (onlineFallbackReason) {
    offlinePrefix = `⚠️ **[تنبيه الانتقال للمساعد المحلي]** تعذر الاتصال بسحابة Gemini AI (${onlineFallbackReason}). تم الانتقال تلقائياً إلى **المحرك المحاسبي المحلي**.\n\n`;
  } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
    offlinePrefix = `📴 **[المساعد المحاسبي المحلي - بدون إنترنت]**\n\n`;
  } else {
    offlinePrefix = `🔒 **[المساعد المحاسبي المحلي - وضع الخصوصية والأمان 100%]**\n\n`;
  }

  return {
    answer: offlinePrefix + answer,
    evidence,
    confidence: nluResult.intent.confidence || 0.9,
  };
}

function formatRangeArabic(range?: string): string {
  switch (range) {
    case 'TODAY':
      return 'اليوم';
    case 'YESTERDAY':
      return 'الأمس';
    case 'THIS_WEEK':
      return 'هذا الأسبوع';
    case 'THIS_MONTH':
      return 'هذا الشهر';
    case 'LAST_MONTH':
      return 'الشهر الماضي';
    case 'THIS_YEAR':
      return 'هذه السنة';
    default:
      return 'الكلي';
  }
}
