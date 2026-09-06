export interface QuickQuestionItem {
  id: string;
  category: 'system_knowledge' | 'profit_sales' | 'sales_profits' | 'inventory_stock' | 'customers_debts' | 'debts_customers' | 'suppliers_purchases' | 'cash_expenses' | 'reports_forecasts';
  question: string;
  shortTitle: string;
  description: string;
  icon: string;
  badge: string;
  themeColor: 'sky' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple' | 'teal';
}

export const QUICK_QUESTION_CATEGORIES = [
  { id: 'all', name: 'الكل ✨', icon: '✨' },
  { id: 'system_knowledge', name: 'أقسام وشاشات النظام 🧭', icon: '🧭' },
  { id: 'profit_sales', name: 'الأرباح والمبيعات 📈', icon: '📈' },
  { id: 'debts_customers', name: 'الديون والعملاء 👥', icon: '👥' },
  { id: 'inventory_stock', name: 'المخزون والنواقص 📦', icon: '📦' },
  { id: 'suppliers_purchases', name: 'الموردين والمشتريات 🏬', icon: '🏬' },
  { id: 'cash_expenses', name: 'الصندوق والمصاريف 💵', icon: '💵' },
  { id: 'reports_forecasts', name: 'التقارير والتوقعات 🔮', icon: '🔮' },
];

export const COMPREHENSIVE_QUICK_QUESTIONS: QuickQuestionItem[] = [
  // 0. أقسام وشاشات النظام
  {
    id: 'import_section_guide',
    category: 'system_knowledge',
    question: 'معلومات عن قسم الاستيراد الذكي',
    shortTitle: 'قسم الاستيراد الذكي',
    description: 'شرح استيراد الفواتير والأصناف والعملاء من إكسل، PDF، وصور الكاميرا',
    icon: '📥',
    badge: 'استيراد',
    themeColor: 'sky'
  },
  {
    id: 'system_all_sections',
    category: 'system_knowledge',
    question: 'ماذا يعني كل قسم في البرنامج؟',
    shortTitle: 'دليل كافة أقسام النظام',
    description: 'شرح شامل وموجز لجميع شاشات وأقسام وبطاقات المحل وإمكانياتها',
    icon: '🗺️',
    badge: 'دليل شامل',
    themeColor: 'purple'
  },
  {
    id: 'pos_section_guide',
    category: 'system_knowledge',
    question: 'ما هي مميزات قسم نقطة البيع والكاشير؟',
    shortTitle: 'قسم نقطة البيع (POS)',
    description: 'إصدار الفواتير، الباركود السريع، الخصومات والطباعة الحرارية',
    icon: '⚡',
    badge: 'كاشير',
    themeColor: 'emerald'
  },
  {
    id: 'diff_customer_supplier',
    category: 'system_knowledge',
    question: 'ما الفرق بين كشف حساب العميل والمورد؟',
    shortTitle: 'الفرق بين العملاء والموردين',
    description: 'توضيح الذمم المدينة للعملاء مقابل الالتزامات الدائنة للموردين',
    icon: '⚖️',
    badge: 'مقارنة',
    themeColor: 'teal'
  },

  // 1. الأرباح والمبيعات
  {
    id: 'profit_today',
    category: 'profit_sales',
    question: 'ماهو صافي أرباح اليوم؟',
    shortTitle: 'صافي أرباح اليوم',
    description: 'حساب الإيرادات والأرباح الصافية لليوم الحالي بدقة',
    icon: '💰',
    badge: 'يومي',
    themeColor: 'emerald'
  },
  {
    id: 'sales_month',
    category: 'profit_sales',
    question: 'أعطني تقرير مبيعات هذا الشهر',
    shortTitle: 'مبيعات هذا الشهر',
    description: 'إجمالي المبيعات، عدد الفواتير، ونشاط المبيعات',
    icon: '📅',
    badge: 'شهري',
    themeColor: 'emerald'
  },
  {
    id: 'top_selling',
    category: 'profit_sales',
    question: 'ما هي المنتجات الأكثر مبيعاً والأعلى ربحاً؟',
    shortTitle: 'أفضل المنتجات مبيعاً',
    description: 'ترتيب الأصناف بحسب المبيعات ومساهمتها بالربح',
    icon: '🏆',
    badge: 'أصناف',
    themeColor: 'emerald'
  },
  {
    id: 'sales_comparison',
    category: 'profit_sales',
    question: 'مقارنة مبيعات هذا الشهر بالشهر الماضي',
    shortTitle: 'مقارنة أداء المبيعات',
    description: 'نسبة النمو والتغير في المبيعات بين الفترات',
    icon: '📊',
    badge: 'مقارنة',
    themeColor: 'emerald'
  },
  {
    id: 'profit_decline_reason',
    category: 'profit_sales',
    question: 'لماذا انخفضت الأرباح والمبيعات؟',
    shortTitle: 'تشخيص أسباب الأرباح',
    description: 'تحليل الأسباب المؤثرة على هامش الربح والنشاط',
    icon: '🧐',
    badge: 'تشخيص',
    themeColor: 'emerald'
  },

  // 2. الديون والعملاء
  {
    id: 'top_debtors',
    category: 'debts_customers',
    question: 'من هم أكثر العملاء ديناً (كبار المدينين)؟',
    shortTitle: 'كبار المدينين بالدفتر',
    description: 'كشف بأعلى المديونيات المعلقة وأسماء الزبائن وأرصدتهم',
    icon: '🚨',
    badge: 'تنبيه',
    themeColor: 'rose'
  },
  {
    id: 'total_customer_debts',
    category: 'debts_customers',
    question: 'كم إجمالي الديون المستحقة بالذمة على العملاء؟',
    shortTitle: 'إجمالي ديون الزبائن',
    description: 'حجم المبالغ الآجلة الكلية المطلوب تحصيلها',
    icon: '📑',
    badge: 'ذمم',
    themeColor: 'rose'
  },
  {
    id: 'unpaid_invoices',
    category: 'debts_customers',
    question: 'كشف الذمم المدينة (الفواتير الآجلة)',
    shortTitle: 'الفواتير غير المسددة',
    description: 'استعراض الفواتير المعلقة وتواريخ استحقاقها',
    icon: '⏳',
    badge: 'فواتير',
    themeColor: 'rose'
  },
  {
    id: 'collection_rate',
    category: 'debts_customers',
    question: 'ما هي نسبة السداد والتحصيل من الزبائن هذا الشهر؟',
    shortTitle: 'معدل سداد الديون',
    description: 'متابعة نسبة الكاش المحصل من إجمالي الديون',
    icon: '✅',
    badge: 'تحصيل',
    themeColor: 'rose'
  },

  // 3. المخزون والنواقص
  {
    id: 'low_stock_report',
    category: 'inventory_stock',
    question: 'ما هي البضاعة الناقصة التي قاربت على النفاد؟',
    shortTitle: 'النواقص والحد الأدنى',
    description: 'قائمة الأصناف التي قاربت على النفاد للطلب الفوري',
    icon: '⚠️',
    badge: 'عاجل',
    themeColor: 'amber'
  },
  {
    id: 'expired_products',
    category: 'inventory_stock',
    question: 'هل توجد منتجات منتهية الصلاحية أو قريبة الانتهاء؟',
    shortTitle: 'تواريخ الصلاحية',
    description: 'كشف المنتجات التالفة أو القريبة من تاريخ الانتهاء',
    icon: '⏰',
    badge: 'صلاحية',
    themeColor: 'amber'
  },
  {
    id: 'slow_moving',
    category: 'inventory_stock',
    question: 'ما هي المنتجات الراكدة بطيئة الحركة؟',
    shortTitle: 'الأصناف الراكدة',
    description: 'بضائع لم تسجل حركة مبيعات لتصفيتها',
    icon: '💤',
    badge: 'تصفية',
    themeColor: 'amber'
  },
  {
    id: 'inventory_valuation',
    category: 'inventory_stock',
    question: 'كم إجمالي القيمة المالية للمخزون الحالي؟',
    shortTitle: 'تقييم رأس مال المخزون',
    description: 'حساب رأس المال المجمد في البضاعة بأسعار التكلفة',
    icon: '🏷️',
    badge: 'تقييم',
    themeColor: 'amber'
  },

  // 4. الموردين والمشتريات
  {
    id: 'total_supplier_debts',
    category: 'suppliers_purchases',
    question: 'كم إجمالي المبالغ والديون المستحقة للموردين؟',
    shortTitle: 'مستحقات الموردين',
    description: 'إجمالي المبالغ الواجب دفعها لشركات التوريد',
    icon: '🏢',
    badge: 'موردين',
    themeColor: 'sky'
  },
  {
    id: 'due_suppliers_list',
    category: 'suppliers_purchases',
    question: 'من هم الموردين الذين لديهم مستحقات واجبة السداد؟',
    shortTitle: 'قائمة الموردين الدائنين',
    description: 'تفصيل حسابات كل شركة ومبالغ الفواتير المعلقة',
    icon: '📋',
    badge: 'التزامات',
    themeColor: 'sky'
  },
  {
    id: 'monthly_purchases',
    category: 'suppliers_purchases',
    question: 'ملخص فواتير المشتريات خلال هذا الشهر',
    shortTitle: 'مشتريات الشهر',
    description: 'حجم التوريدات والبضائع المشتراة وتكلفتها',
    icon: '🚛',
    badge: 'شراء',
    themeColor: 'sky'
  },

  // 5. الصندوق والمصاريف
  {
    id: 'cash_reconciliation',
    category: 'cash_expenses',
    question: 'أعطني تقرير مطابقة الصندوق ورصيد النقدية الحالي',
    shortTitle: 'مطابقة الصندوق والدرج',
    description: 'مقارنة النقد الفعلي بالصندوق مع حركة المبيعات والمصروفات',
    icon: '🏦',
    badge: 'كاش',
    themeColor: 'indigo'
  },
  {
    id: 'monthly_expenses',
    category: 'cash_expenses',
    question: 'كم مجموع المصاريف والمسحوبات التشغيلية؟',
    shortTitle: 'المصاريف والمسحوبات',
    description: 'إجمالي النفقات وفواتير الكهرباء والإيجار ومسحوبات المالك',
    icon: '💸',
    badge: 'نفقات',
    themeColor: 'indigo'
  },
  {
    id: 'cash_flow_summary',
    category: 'cash_expenses',
    question: 'ملخص حركة التدفقات النقدية الداخلة والخارجة',
    shortTitle: 'حركة التدفق النقدي',
    description: 'صافي السيولة النقدية وتفاصيل المبالغ الداخلة والخارجة',
    icon: '🔄',
    badge: 'سيولة',
    themeColor: 'indigo'
  },

  // 6. التقارير والتوقعات الذكية
  {
    id: 'sales_forecast',
    category: 'reports_forecasts',
    question: 'ما هي توقعات المبيعات للشهر القادم؟',
    shortTitle: 'توقعات الشهر القادم',
    description: 'تنبؤ ذكي يعتمد على الأداء التاريخي لتقدير الإيرادات',
    icon: '📈',
    badge: 'تنبؤ ذكي',
    themeColor: 'purple'
  },
  {
    id: 'anomaly_audit',
    category: 'reports_forecasts',
    question: 'هل توجد أي عمليات أو فواتير مشبوهة أو غير اعتيادية؟',
    shortTitle: 'التدقيق والرقابة الذكية',
    description: 'فحص الحركات لكشف الخصومات المرتفعة أو التعديلات المريبة',
    icon: '🛡️',
    badge: 'حماية',
    themeColor: 'purple'
  },
  {
    id: 'financial_health_report',
    category: 'reports_forecasts',
    question: 'أعطني التقرير المالي الشامل وتقييم صحة المحل',
    shortTitle: 'التقرير المالي الشامل',
    description: 'تشخيص متكامل للنشاط المالي ومؤشرات السيولة والربحية',
    icon: '🩺',
    badge: 'شامل',
    themeColor: 'purple'
  },
  {
    id: 'growth_tips',
    category: 'reports_forecasts',
    question: 'كيف أزيد مبيعاتي وأرباح المحل؟',
    shortTitle: 'نصائح زيادة الأرباح',
    description: 'استراتيجيات عملية لرفع متوسط قيمة الفاتورة وتحسين الهامش',
    icon: '🚀',
    badge: 'توصيات',
    themeColor: 'purple'
  }
];


