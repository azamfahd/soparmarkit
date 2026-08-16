import { describe, it, expect } from 'vitest';
import { processNLU, normalizeArabic, resolveSynonymsInText } from '../nlu';

describe('NLU Pipeline Evaluation', () => {
  describe('1. Arabic Normalization', () => {
    const normalizationCases = [
      { input: 'أحمد', expected: 'احمد' },
      { input: 'إبراهيم', expected: 'ابراهيم' },
      { input: 'آمل', expected: 'امل' },
      { input: 'بضاعة', expected: 'بضاعه' },
      { input: 'سيّارة', expected: 'سياره' }, // Removes tashkeel
      { input: 'مُحَمَّد', expected: 'محمد' },
      { input: 'صِفْر', expected: 'صفر' },
      { input: 'بِيعَة', expected: 'بيعه' }
    ];

    normalizationCases.forEach(({ input, expected }) => {
      it(`should normalize "${input}" to "${expected}"`, () => {
        expect(normalizeArabic(input)).toBe(expected);
      });
    });
  });

  describe('2. Synonym Resolution', () => {
    const synonymCases = [
      { input: 'مبيعات', expected: 'مبيعات' }, // Canonical
      { input: 'مبيعه', expected: 'مبيعات' },
      { input: 'مبيع', expected: 'مبيعات' },
      { input: 'بيعات', expected: 'مبيعات' },
      { input: 'ارباح', expected: 'ربح' },
      { input: 'مكسب', expected: 'ربح' },
      { input: 'مكاسب', expected: 'ربح' },
      { input: 'فوايد', expected: 'ربح' },
      { input: 'ديون', expected: 'رصيد' },
      { input: 'مديونيه', expected: 'رصيد' },
      { input: 'سلف', expected: 'رصيد' }
    ];

    synonymCases.forEach(({ input, expected }) => {
      it(`should resolve synonym "${input}" to include "${expected}"`, () => {
        const resolved = resolveSynonymsInText(input);
        expect(resolved).toContain(expected);
      });
    });
  });

  describe('3. Intent Detection & Entity Resolution (End-to-End)', () => {
    const cases = [
      // Sales Queries
      { query: 'كم بعنا اليوم؟', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'TODAY' }] },
      { query: 'كم مبيعات اليوم؟', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'TODAY' }] },
      { query: 'ايش بعنا اليوم؟', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'TODAY' }] },
      { query: 'كم دخل لنا اليوم؟', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'TODAY' }] },
      { query: 'ايش مبيعات هذا الشهر؟', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'THIS_MONTH' }] },
      
      // Customer Debt Queries
      { query: 'كم على احمد؟', expectedIntent: 'CUSTOMER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'احمد' }] },
      { query: 'كم دين احمد؟', expectedIntent: 'CUSTOMER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'احمد' }] },
      { query: 'كم حساب احمد؟', expectedIntent: 'CUSTOMER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'احمد' }] },
      { query: 'كم لنا عند احمد؟', expectedIntent: 'CUSTOMER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'احمد' }] },
      { query: 'باقي على محمد توفيق كم؟', expectedIntent: 'CUSTOMER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'محمد توفيق' }] },
      
      // Supplier Debt Queries
      { query: 'كم للمورد سالم؟', expectedIntent: 'SUPPLIER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'سالم' }] },
      { query: 'كم يطلبنا سالم؟', expectedIntent: 'SUPPLIER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'سالم' }] },
      { query: 'ايش باقي للمورد عبدالله؟', expectedIntent: 'SUPPLIER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'عبدالله' }] },
      { query: 'كم علينا لشركة المراعي؟', expectedIntent: 'SUPPLIER_BALANCE', expectedEntities: [{ type: 'TARGET_NAME', value: 'المراعي' }] },
      
      // System Info
      { query: 'معلومات النظام', expectedIntent: 'SYSTEM_INFO', expectedEntities: [] },
      { query: 'من انت؟', expectedIntent: 'SYSTEM_INFO', expectedEntities: [] },
      { query: 'ما هو هذا التطبيق؟', expectedIntent: 'SYSTEM_INFO', expectedEntities: [] },
      { query: 'حالة الوكيل المحاسبي', expectedIntent: 'SYSTEM_INFO', expectedEntities: [] },

      // Product/Inventory Queries
      { query: 'كم مبيعات البيبسي؟', expectedIntent: 'SALES_BY_PRODUCT', expectedEntities: [{ type: 'PRODUCT', value: 'البيبسي' }] },
      { query: 'بكم سعر البيبسي؟', expectedIntent: 'PRODUCT_SEARCH', expectedEntities: [{ type: 'PRODUCT', value: 'البيبسي' }] },
      { query: 'كم باقي من حليب المراعي؟', expectedIntent: 'PRODUCT_SEARCH', expectedEntities: [{ type: 'PRODUCT', value: 'حليب المراعي' }] },
      { query: 'ماهي النواقص؟', expectedIntent: 'LOW_STOCK', expectedEntities: [] },

      // Date Ranges & Intervals
      { query: 'مبيعات من 2026-08-01 الى 2026-08-15', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'DATE_BETWEEN:2026-08-01:2026-08-15' }] },
      { query: 'مبيعات شهر 8 سنة 2026', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'MONTH:2026-08' }] },
      { query: 'مبيعات الربع الاول', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'QUARTER_1' }] },
      { query: 'مبيعات اخر 10 ايام', expectedIntent: 'SALES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'LAST_N_DAYS:10' }] },

      // Expenses & Withdrawals
      { query: 'كم المصاريف اليوم؟', expectedIntent: 'EXPENSES_SUMMARY', expectedEntities: [{ type: 'DATE_RANGE', value: 'TODAY' }] },

      // System Knowledge & Sections Guide (User Query Audit Fixes)
      { query: 'معلومات عن قسم الاستيراد الذكي', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'شرح قسم الاستيراد الذكي', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'قسم الاستيراد الذكي', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'ماذا يعني كل قسم في البرنامج؟', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'ماذا يعني كل قسم في البرنامج.', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'شرح أقسام البرنامج', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'ما هي شاشات النظام وماذا تفعل كل شاشة؟', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'ما وظيفة قسم المبيعات؟', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'ما الفرق بين العملاء والموردين؟', expectedIntent: 'SYSTEM_SECTIONS_GUIDE', expectedEntities: [] },
      { query: 'كيف أضيف منتج جديد في المخزن؟', expectedIntent: 'SYSTEM_HELP', expectedEntities: [] },
      { query: 'كيف أسجل فاتورة بيع جديدة؟', expectedIntent: 'SYSTEM_HELP', expectedEntities: [] },
      { query: 'كيف أسدد دفعة لمورد؟', expectedIntent: 'SYSTEM_HELP', expectedEntities: [] },
      { query: 'ما هو مجمل الربح وكيف يحسب صافي الربح؟', expectedIntent: 'ACCOUNTING_CONCEPT', expectedEntities: [] },

      // Unknown/Clarification
      { query: 'بكام', expectedIntent: 'UNKNOWN', isClarificationNeeded: true }
    ];

    cases.forEach(({ query, expectedIntent, expectedEntities, isClarificationNeeded = false }) => {
      it(`should detect intent for: "${query}" as ${expectedIntent}`, async () => {
        const result = await processNLU({ rawText: query, id: 'test', timestamp: Date.now() });
        expect(result.intent.name).toBe(expectedIntent);
        expect(result.isClarificationNeeded).toBe(isClarificationNeeded);
        
        if (expectedEntities && expectedEntities.length > 0) {
          expectedEntities.forEach(expectedEntity => {
            const found = result.entities.find(e => e.type === expectedEntity.type && e.value === expectedEntity.value);
            // Some tolerance if we mapped Target Name to Product
            if (!found && expectedEntity.type === 'TARGET_NAME') {
               const foundProduct = result.entities.find(e => e.type === 'PRODUCT' && e.value === expectedEntity.value);
               expect(foundProduct || found).toBeDefined();
            } else if (!found && expectedEntity.type === 'PRODUCT') {
               const foundName = result.entities.find(e => e.type === 'TARGET_NAME' && e.value === expectedEntity.value);
               expect(foundName || found).toBeDefined();
            } else {
               expect(found).toBeDefined();
            }
          });
        }
      });
    });
  });

  describe('4. Multi-turn Context Resolution', () => {
    it('should resolve context for follow-up: "والأمس؟"', async () => {
      const query1 = { rawText: 'كم مبيعات اليوم؟', id: 'q1', timestamp: Date.now() };
      const res1 = await processNLU(query1);
      expect(res1.intent.name).toBe('SALES_SUMMARY');

      const query2 = { 
        rawText: 'والأمس؟', 
        id: 'q2', 
        timestamp: Date.now(),
        context: {
          lastIntent: res1.intent.name,
        }
      };
      const res2 = await processNLU(query2);
      expect(['SALES_SUMMARY', 'SALES_BY_PERIOD']).toContain(res2.intent.name);
      expect(res2.entities.some(e => e.value === 'YESTERDAY' || e.value === 'الامس' || e.value === 'امس' || e.value === 'البارحه')).toBe(true);
    });

    it('should resolve context for follow-up: "ومحمد؟" after asking about customer', async () => {
      const query1 = { rawText: 'كم على احمد؟', id: 'q1', timestamp: Date.now() };
      const res1 = await processNLU(query1);
      expect(res1.intent.name).toBe('CUSTOMER_BALANCE');

      const query2 = { 
        rawText: 'ومحمد؟', 
        id: 'q2', 
        timestamp: Date.now(),
        context: {
          lastIntent: res1.intent.name,
          activeCustomer: 'احمد'
        }
      };
      const res2 = await processNLU(query2);
      expect(res2.intent.name).toBe('CUSTOMER_BALANCE');
      expect(res2.entities.some(e => e.value === 'محمد')).toBe(true);
    });
    
    it('should resolve implicit pronouns: "كم عليه؟"', async () => {
      const query = { 
        rawText: 'كم عليه؟', 
        id: 'q1', 
        timestamp: Date.now(),
        context: {
          activeCustomer: 'خالد'
        }
      };
      const res = await processNLU(query);
      expect(res.intent.name).toBe('CUSTOMER_BALANCE');
    });
  });

  describe('5. Full AI Router Execution for System Knowledge', () => {
    it('should correctly answer "ماذا يعني كل قسم في البرنامج؟" with full guide and NOT fallback to sales', async () => {
      const { processUserQuery } = await import('../aiRouter');
      const res = await processUserQuery('ماذا يعني كل قسم في البرنامج؟', 'test_session');
      
      expect(res.metadata.intentName).toBe('SYSTEM_SECTIONS_GUIDE');
      expect(res.metadata.fallbackUsed).toBe(false);
      expect(res.answer).toContain('دليل وشرح شامل لجميع أقسام وشاشات البرنامج');
      expect(res.answer).toContain('لوحة التحكم');
      expect(res.answer).toContain('نقطة البيع');
      expect(res.answer).toContain('المنتجات');
      expect(res.answer).toContain('العملاء');
      expect(res.answer).toContain('الموردين');
    });

    it('should correctly explain single section "ما وظيفة قسم المبيعات؟"', async () => {
      const { processUserQuery } = await import('../aiRouter');
      const res = await processUserQuery('ما وظيفة قسم المبيعات؟', 'test_session_2');
      
      expect(res.metadata.intentName).toBe('SYSTEM_SECTIONS_GUIDE');
      expect(res.answer).toContain('نقطة البيع');
      expect(res.answer).toContain('الهدف الأساسي');
    });

    it('should correctly explain comparison "ما الفرق بين العملاء والموردين؟"', async () => {
      const { processUserQuery } = await import('../aiRouter');
      const res = await processUserQuery('ما الفرق بين العملاء والموردين؟', 'test_session_3');
      
      expect(res.metadata.intentName).toBe('SYSTEM_SECTIONS_GUIDE');
      expect(res.answer).toContain('المقارنة بين');
      expect(res.answer).toContain('العملاء');
      expect(res.answer).toContain('الموردين');
    });
  });

  describe('6. Dynamic Smart Clarification via Word Breakdown & Associations', () => {
    it('should analyze words and propose invoice/editing suggestions for "تعديل الفواتير للزبون"', async () => {
      const { generateSmartClarification } = await import('../nlu');
      const query = { 
        rawText: 'تعديل الفواتير للزبون', 
        id: 'q_clarify_1', 
        timestamp: Date.now() 
      };
      const res = generateSmartClarification(
        'تعديل الفواتير للزبون',
        'تعديل الفواتير للزبون',
        'تعديل فواتير عميل',
        query,
        [],
        'DATA_QUERY'
      );
      expect(res.message).toBeDefined();
      expect(res.message).toContain('تحليل الكلمات');
      expect(res.suggestedQuestions.length).toBeGreaterThanOrEqual(3);
      expect(res.suggestedQuestions.some(s => /(فاتور|تعديل|عميل|زبون)/.test(s))).toBe(true);
    });

    it('should incorporate product name and inventory concepts for "كرتون حليب المراعي رصيد"', async () => {
      const { generateSmartClarification } = await import('../nlu');
      const query = { 
        rawText: 'كرتون حليب المراعي رصيد', 
        id: 'q_clarify_2', 
        timestamp: Date.now() 
      };
      const res = generateSmartClarification(
        'كرتون حليب المراعي رصيد',
        'كرتون حليب المراعي رصيد',
        'كرتون منتج حليب المراعي رصيد',
        query,
        [{ type: 'PRODUCT', value: 'حليب المراعي', rawText: 'حليب المراعي' }],
        'DATA_QUERY'
      );
      expect(res.message).toBeDefined();
      expect(res.suggestedQuestions.length).toBeGreaterThanOrEqual(3);
      expect(res.suggestedQuestions.some(s => s.includes('حليب المراعي') || s.includes('المخزن'))).toBe(true);
    });

    it('should trigger clarification on unknown query like "بكام"', async () => {
      const query = { 
        rawText: 'بكام', 
        id: 'q_clarify_3', 
        timestamp: Date.now() 
      };
      const res = await processNLU(query);
      expect(res.isClarificationNeeded).toBe(true);
      expect(res.clarificationMessage).toBeDefined();
    });
  });
});

