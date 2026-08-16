/**
 * Accounting Schema Graph & Domain Relations Engine
 * 
 * Maps the local accounting data model, relational graph between entities,
 * schema fields, and verified arithmetic calculation formulas.
 */

export interface SchemaField {
  name: string;
  arabicLabel: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  description: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: { table: string; field: string };
  isCalculated?: boolean;
  calculationFormula?: string;
}

export interface SchemaTable {
  id: string;
  tableName: string;
  arabicTitle: string;
  description: string;
  primaryKey: string;
  fields: SchemaField[];
  relations: {
    targetTable: string;
    relationType: '1:N' | 'N:1' | '1:1' | 'N:M';
    foreignKey: string;
    description: string;
  }[];
}

export interface AccountingConcept {
  id: string;
  arabicName: string;
  englishName: string;
  definition: string;
  formulaArabic: string;
  formulaCode: string;
  sourceTables: string[];
  accountingCategory: 'REVENUE' | 'PROFIT' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'EXPENSE' | 'INVENTORY' | 'CASH_FLOW';
  examples: string[];
}

export interface RelationalPath {
  sourceEntity: string;
  targetEntity: string;
  path: string[];
  description: string;
  joinCondition: string;
}

/**
 * 1. Definitive Local Database Schema & Field Graph
 */
export const ACCOUNTING_SCHEMA_GRAPH: Record<string, SchemaTable> = {
  products: {
    id: 'products',
    tableName: 'products',
    arabicTitle: 'جدول المنتجات والأصناف',
    description: 'يخزن بيانات جميع السلع والمنتجات بالمخزن، أسعار التكلفة والبيع، المخزون المتوفر، وتواريخ الصلاحية.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'رقم المعرف', type: 'number', isPrimary: true, description: 'معرف تلقائي فريد للصنف' },
      { name: 'name', arabicLabel: 'اسم المنتج', type: 'string', description: 'الاسم التجاري للصنف أو السلعة' },
      { name: 'cost_price', arabicLabel: 'سعر التكلفة (الشراء)', type: 'number', description: 'سعر شراء الحبة من المورد' },
      { name: 'sale_price', arabicLabel: 'سعر البيع للجمهور', type: 'number', description: 'سعر بيع الحبة للزبون في الكاشير' },
      { name: 'stock_quantity', arabicLabel: 'الكمية المتوفرة', type: 'number', description: 'عدد الحبات أو الكراتين الحالية في المستودع والرف' },
      { name: 'category', arabicLabel: 'الفئة / القسم', type: 'string', description: 'تصنيف الصنف (ألبان، معلبات، مشروبات، منظفات...)' },
      { name: 'barcode', arabicLabel: 'الباركود', type: 'string', description: 'الرمز الشريطي الدولي للمنتج' },
      { name: 'unit', arabicLabel: 'الوحدة', type: 'string', description: 'وحدة القياس (حبة، كرتون، كيلو، باكت)' },
      { name: 'supplier_id', arabicLabel: 'معرف المورد', type: 'number', isForeign: true, references: { table: 'suppliers', field: 'id' }, description: 'المورد الرئيسي الذي يتم شراء الصنف منه' },
      { name: 'expiration_date', arabicLabel: 'تاريخ الانتهاء', type: 'date', description: 'تاريخ انتهاء صلاحية الصنف الغذائي' }
    ],
    relations: [
      { targetTable: 'suppliers', relationType: 'N:1', foreignKey: 'supplier_id', description: 'كل منتج يتبع مورداً رئيسياً' },
      { targetTable: 'saleItems', relationType: '1:N', foreignKey: 'product_id', description: 'المنتج يظهر في عدة بنود فواتير مبيعات' },
      { targetTable: 'inventoryLogs', relationType: '1:N', foreignKey: 'product_id', description: 'المنتج تسجل عليه حركات تسوية وتوالف' }
    ]
  },

  customers: {
    id: 'customers',
    tableName: 'customers',
    arabicTitle: 'جدول العملاء والزبائن',
    description: 'يخزن بيانات الزبائن الذين يتعاملون بالآجل (الديون) ورصيد كل عميل.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'رقم المعرف', type: 'number', isPrimary: true, description: 'معرف فريد للعميل' },
      { name: 'name', arabicLabel: 'اسم العميل', type: 'string', description: 'الاسم الكامل للزبون' },
      { name: 'phone', arabicLabel: 'رقم الهاتف', type: 'string', description: 'رقم اتصال للتواصل والمطالبات' },
      { name: 'balance', arabicLabel: 'الرصيد المتبقي (الذمة)', type: 'number', isCalculated: true, calculationFormula: 'إجمالي المشتريات الآجلة - إجمالي السدادات', description: 'المبلغ المستحق على العميل لصالح المحل (دين موجب)' }
    ],
    relations: [
      { targetTable: 'sales', relationType: '1:N', foreignKey: 'customer_id', description: 'العميل تصدر له فواتير مبيعات (نقدية أو آجلة)' },
      { targetTable: 'debts', relationType: '1:N', foreignKey: 'customer_id', description: 'العميل تسجل عليه حركات دين وسندات سداد' }
    ]
  },

  suppliers: {
    id: 'suppliers',
    tableName: 'suppliers',
    arabicTitle: 'جدول الموردين وشركات التوريد',
    description: 'يخزن بيانات الموزعين وتجار الجملة والشركات ومستحقاتهم المالية على المحل.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'رقم المعرف', type: 'number', isPrimary: true, description: 'معرف فريد للمورد' },
      { name: 'name', arabicLabel: 'اسم المورد / الشركة', type: 'string', description: 'اسم التاجر أو شركة التوزيع' },
      { name: 'phone', arabicLabel: 'رقم الهاتف', type: 'string', description: 'رقم اتصال المندوب' },
      { name: 'balance', arabicLabel: 'المستحق له (الالتزام)', type: 'number', isCalculated: true, calculationFormula: 'إجمالي الفواتير الآجلة الواردة - إجمالي الدفعات المسددة للمورد', description: 'المبلغ المستحق للمورد علينا' }
    ],
    relations: [
      { targetTable: 'products', relationType: '1:N', foreignKey: 'supplier_id', description: 'المورد يزود المحل بمجموعة منتجات' },
      { targetTable: 'supplierPayments', relationType: '1:N', foreignKey: 'supplier_id', description: 'المورد تسجل له سندات دفع ومسحوبات نقدية' }
    ]
  },

  sales: {
    id: 'sales',
    tableName: 'sales',
    arabicTitle: 'جدول فواتير المبيعات',
    description: 'يخزن رأس كل فاتورة بيع صادرة من الكاشير.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'رقم الفاتورة', type: 'number', isPrimary: true, description: 'رقم الفاتورة المتسلسل' },
      { name: 'customer_id', arabicLabel: 'معرف العميل', type: 'number', isForeign: true, references: { table: 'customers', field: 'id' }, description: 'معرف العميل (null للمبيعات النقدية العامة)' },
      { name: 'total_amount', arabicLabel: 'إجمالي الفاتورة', type: 'number', description: 'المبلغ الإجمالي للفاتورة' },
      { name: 'payment_type', arabicLabel: 'طريقة الدفع', type: 'enum', description: 'نقدي (cash) أو آجل/دين (debt)' },
      { name: 'created_at', arabicLabel: 'تاريخ ووقت الفاتورة', type: 'date', description: 'توقيت إجراء عملية البيع في النظام' },
      { name: 'notes', arabicLabel: 'ملاحظات', type: 'string', description: 'أي ملاحظات إضافية على الفاتورة' }
    ],
    relations: [
      { targetTable: 'customers', relationType: 'N:1', foreignKey: 'customer_id', description: 'الفاتورة قد تنسب لعميل محدد' },
      { targetTable: 'saleItems', relationType: '1:N', foreignKey: 'sale_id', description: 'الفاتورة تتضمن عدة أصناف مباعة' }
    ]
  },

  saleItems: {
    id: 'saleItems',
    tableName: 'saleItems',
    arabicTitle: 'جدول بنود الفواتير (تفاصيل الأصناف المباعة)',
    description: 'يخزن كل صنف وكميته وسعر بيعه الفعلي داخل كل فاتورة بيع.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'معرف البند', type: 'number', isPrimary: true, description: 'معرف فريد لبند الفاتورة' },
      { name: 'sale_id', arabicLabel: 'رقم الفاتورة', type: 'number', isForeign: true, references: { table: 'sales', field: 'id' }, description: 'رقم الفاتورة الأم' },
      { name: 'product_id', arabicLabel: 'معرف المنتج', type: 'number', isForeign: true, references: { table: 'products', field: 'id' }, description: 'الصنف المباع' },
      { name: 'quantity', arabicLabel: 'الكمية المباعة', type: 'number', description: 'عدد الوحدات المباعة في هذه العملية' },
      { name: 'price_at_sale', arabicLabel: 'سعر البيع الفعلي', type: 'number', description: 'سعر بيع الوحدة المسجل وقت تحرير الفاتورة' }
    ],
    relations: [
      { targetTable: 'sales', relationType: 'N:1', foreignKey: 'sale_id', description: 'البند ينتمي لفاتورة بيع محددة' },
      { targetTable: 'products', relationType: 'N:1', foreignKey: 'product_id', description: 'البند يمثل منتجاً معيناً' }
    ]
  },

  debts: {
    id: 'debts',
    tableName: 'debts',
    arabicTitle: 'جدول حركات ديون وسدادات العملاء',
    description: 'دفتر أستاذ الديون - يسجل المشتريات الآجلة وسندات القبض (السداد) لكل زبون.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'معرف الحركة', type: 'number', isPrimary: true, description: 'معرف فريد لحركة الدين' },
      { name: 'customer_id', arabicLabel: 'معرف العميل', type: 'number', isForeign: true, references: { table: 'customers', field: 'id' }, description: 'العميل صاحب الحساب' },
      { name: 'sale_id', arabicLabel: 'رقم الفاتورة المرتبطة', type: 'number', isForeign: true, references: { table: 'sales', field: 'id' }, description: 'الفاتورة الآجلة التي نشأ عنها الدين (إن وجدت)' },
      { name: 'amount', arabicLabel: 'مبلغ الحركة', type: 'number', description: 'قيمة الشراء أو قيمة السداد' },
      { name: 'type', arabicLabel: 'نوع الحركة', type: 'enum', description: 'شراء آجل (purchase) يرفع الدين، أو سداد نقدي (payment) يخفض الدين' },
      { name: 'created_at', arabicLabel: 'تاريخ الحركة', type: 'date', description: 'توقيت قيد الحركة' }
    ],
    relations: [
      { targetTable: 'customers', relationType: 'N:1', foreignKey: 'customer_id', description: 'الحركة تخص عميلاً محدداً' }
    ]
  },

  cashWithdrawals: {
    id: 'cashWithdrawals',
    tableName: 'cashWithdrawals',
    arabicTitle: 'جدول المسحوبات والمصاريف النقدية',
    description: 'يسجل أي سحب كاش من درج الكاشير سواء لمصاريف تشغيلية (إيجار، كهرباء، عمال) أو مسحوبات شخصية.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'معرف السحب', type: 'number', isPrimary: true, description: 'معرف السحب' },
      { name: 'amount', arabicLabel: 'المبلغ المسحوب', type: 'number', description: 'قيمة النقدية الخارجة من الصندوق' },
      { name: 'by_whom', arabicLabel: 'المستلم / المنفذ', type: 'string', description: 'اسم الشخص المستلم للنقدية' },
      { name: 'reason', arabicLabel: 'سبب الصرف', type: 'string', description: 'بيان الصرف (مصروف كهرباء، غداء، سحب شخصي، صيانة)' },
      { name: 'created_at', arabicLabel: 'تاريخ السحب', type: 'date', description: 'توقيت خروج النقدية من الدرج' },
      { name: 'is_repaid', arabicLabel: 'هل تم إرجاع المبلغ؟', type: 'boolean', description: 'true إذا كانت سلفة وتم إرجاعها للصندوق، false إذا كان مصروفا نهائيا' }
    ],
    relations: []
  },

  salesSettlements: {
    id: 'salesSettlements',
    tableName: 'salesSettlements',
    arabicTitle: 'جدول تسويات إقفال الصندوق والورديات',
    description: 'يسجل إقفال الصندوق اليومي ومقارنة مبيعات الكاش مع النقدية المسلمة فعلياً وكشف أي عجز أو فائض.',
    primaryKey: 'id',
    fields: [
      { name: 'id', arabicLabel: 'معرف التسوية', type: 'number', isPrimary: true, description: 'معرف حركة الإقفال' },
      { name: 'total_sales', arabicLabel: 'إجمالي المبيعات المحسوبة', type: 'number', description: 'المبيعات النظامية للوردية' },
      { name: 'delivered_amount', arabicLabel: 'النقدية الفعلية المسلمة', type: 'number', description: 'المبلغ الموجود في الدرج بعد العد اليدوي' },
      { name: 'difference', arabicLabel: 'الفارق (عجز / زيادة)', type: 'number', description: 'الصافي الفعلي - المتوقع (سالب يعني عجز، موجب يعني زيادة)' },
      { name: 'cash_withdrawals', arabicLabel: 'المسحوبات النقدية أثناء الوردية', type: 'number', description: 'إجمالي السحوبات النثرية المخصومة' },
      { name: 'created_at', arabicLabel: 'تاريخ الإقفال والتسوية', type: 'date', description: 'تاريخ ووقت إقفال الوردية' }
    ],
    relations: []
  }
};

/**
 * 2. Standardized Mathematical Accounting Concepts & Verified Formulas
 */
export const ACCOUNTING_CONCEPTS: Record<string, AccountingConcept> = {
  GROSS_PROFIT: {
    id: 'GROSS_PROFIT',
    arabicName: 'مجمل الربح',
    englishName: 'Gross Profit',
    definition: 'الفارق المباشر بين إجمالي المبيعات وتكلفة البضاعة المباعة قبل خصم أي مصاريف تشغيلية.',
    formulaArabic: 'مجمل الربح = إجمالي إيراد المبيعات - إجمالي تكلفة البضاعة المباعة (COGS)',
    formulaCode: 'Sum(item.quantity * item.price_at_sale) - Sum(item.quantity * product.cost_price)',
    sourceTables: ['sales', 'saleItems', 'products'],
    accountingCategory: 'PROFIT',
    examples: ['كم ربحنا اليوم؟', 'ما هو مجمل الربح هذا الشهر؟', 'كم أرباح البقالة الإجمالية؟']
  },

  NET_PROFIT: {
    id: 'NET_PROFIT',
    arabicName: 'صافي الربح',
    englishName: 'Net Profit',
    definition: 'الربح النهائي الحقيقي بعد خصم جميع المصاريف والمسحوبات النقدية والتوالف من مجمل الربح.',
    formulaArabic: 'صافي الربح = مجمل الربح - (المسحوبات النقدية والمصاريف التشغيلية غير المرجعة + خسائر التوالف)',
    formulaCode: 'GrossProfit - Sum(cashWithdrawals.filter(!is_repaid).amount)',
    sourceTables: ['sales', 'saleItems', 'products', 'cashWithdrawals', 'inventoryLogs'],
    accountingCategory: 'PROFIT',
    examples: ['كم صافي الربح الحقيقي؟', 'ما هو صافي دخل المحل بعد المصاريف؟']
  },

  PROFIT_MARGIN_PERCENT: {
    id: 'PROFIT_MARGIN_PERCENT',
    arabicName: 'هامش الربح المئوي',
    englishName: 'Profit Margin Percentage',
    definition: 'نسبة مجمل الربح إلى إجمالي المبيعات، وتوضح كفاءة تسعير المنتجات.',
    formulaArabic: 'هامش الربح (%) = (مجمل الربح ÷ إجمالي المبيعات) × 100',
    formulaCode: '(grossProfit / totalSales) * 100',
    sourceTables: ['sales', 'saleItems', 'products'],
    accountingCategory: 'PROFIT',
    examples: ['ما هي نسبة الربحية؟', 'كم هامش ربح المحل هذا الشهر؟']
  },

  CUSTOMER_BALANCE: {
    id: 'CUSTOMER_BALANCE',
    arabicName: 'رصيد العميل (الذمة المدينة)',
    englishName: 'Accounts Receivable',
    definition: 'إجمالي المبالغ المستحقة على الزبون لصالح المتجر من المبيعات الآجلة بعد خصم سدادته.',
    formulaArabic: 'رصيد العميل = إجمالي فواتير الآجل - إجمالي سندات القبض المسددة',
    formulaCode: 'Sum(debts.filter(type == "purchase").amount) - Sum(debts.filter(type == "payment").amount)',
    sourceTables: ['customers', 'debts', 'sales'],
    accountingCategory: 'ASSET',
    examples: ['كم حساب الزبون أحمد؟', 'كم نطلب فهد؟', 'كم متبقي على محمد؟']
  },

  SUPPLIER_BALANCE: {
    id: 'SUPPLIER_BALANCE',
    arabicName: 'مستحقات المورد (الذمة الدائنة)',
    englishName: 'Accounts Payable',
    definition: 'إجمالي المبالغ المستحقة لشركات التوريد وتجار الجملة علينا مقابل البضائع المستلمة بعد خصم الدفعات.',
    formulaArabic: 'رصيد المورد = المشتريات الآجلة من المورد - إجمالي الدفعات المسددة للمورد',
    formulaCode: 'supplier.balance (or Sum(purchases) - Sum(supplierPayments.amount))',
    sourceTables: ['suppliers', 'supplierPayments'],
    accountingCategory: 'LIABILITY',
    examples: ['كم علينا لشركة المراعي؟', 'كم ديون الموردين؟', 'كم يطلبنا التاجر خالد؟']
  },

  INVENTORY_VALUATION: {
    id: 'INVENTORY_VALUATION',
    arabicName: 'تقييم المخزون (رأس مال البضاعة)',
    englishName: 'Inventory Valuation at Cost',
    definition: 'القيمة المالية الإجمالية للبضائع والسلع الموجودة في المخزن محسوبة بسعر التكلفة (الشراء).',
    formulaArabic: 'قيمة المخزون بسعر التكلفة = مجموع (الكمية المتوفرة × سعر التكلفة)',
    formulaCode: 'Sum(product.stock_quantity * product.cost_price)',
    sourceTables: ['products'],
    accountingCategory: 'INVENTORY',
    examples: ['كم رأس مال البضاعة في المحل؟', 'ما هي القيمة المالية للمخزون؟']
  },

  CASH_DRAWER_EXPECTED: {
    id: 'CASH_DRAWER_EXPECTED',
    arabicName: 'النقدية المتوقعة في الصندوق (الدرج)',
    englishName: 'Expected Cash Drawer Balance',
    definition: 'النقدية التي يجب أن تتواجد فعلياً في درج الكاشير قبل التسوية.',
    formulaArabic: 'النقدية المتوقعة = إجمالي المبيعات النقدية (الكاش) + سدادات ديون العملاء النقدية - المسحوبات النقدية - دفعات الموردين النقدية',
    formulaCode: 'totalCashSales + totalCashDebtPayments - totalCashWithdrawals - totalCashSupplierPayments',
    sourceTables: ['sales', 'debts', 'cashWithdrawals', 'supplierPayments'],
    accountingCategory: 'CASH_FLOW',
    examples: ['كم المفروض في الصندوق الآن؟', 'كم فلوس الكاش في الدرج؟', 'جرد الصندوق اليومي']
  },

  STORE_HEALTH_SCORE: {
    id: 'STORE_HEALTH_SCORE',
    arabicName: 'مؤشر الصحة المالية للمتجر (360°)',
    englishName: 'Store Health Index',
    definition: 'تقييم شامل ومتعدد الأبعاد يجمع بين نمو المبيعات، استقرار هوامش الربح، سرعة تحصيل الديون، وتوفر السيولة، وتغطية المخزون.',
    formulaArabic: 'مؤشر مركب من 5 معايير: (نمو المبيعات 25% + هامش الربح 25% + معدل تحصيل الديون 20% + سلامة الصندوق 15% + جودة المخزون 15%)',
    formulaCode: 'WeightedScore(growth, margin, collectionRate, cashHealth, stockHealth)',
    sourceTables: ['sales', 'saleItems', 'customers', 'debts', 'products', 'cashWithdrawals'],
    accountingCategory: 'EQUITY',
    examples: ['كيف وضع المحل؟', 'هل الشغل هذا الشهر أفضل؟', 'تقييم صحة المحل المالية']
  }
};

/**
 * 3. Relational Entity Knowledge Graph
 * Defines how entities connect and how multi-table questions can be answered.
 */
export const RELATIONAL_PATHS: RelationalPath[] = [
  {
    sourceEntity: 'Customer',
    targetEntity: 'Debts',
    path: ['customers.id', 'debts.customer_id'],
    description: 'يربط العميل بجميع حركات دينه المباشرة وسندات القبض',
    joinCondition: 'debts.customer_id == customers.id'
  },
  {
    sourceEntity: 'Customer',
    targetEntity: 'Sales',
    path: ['customers.id', 'sales.customer_id'],
    description: 'يربط العميل بجميع الفواتير الصادرة باسمه',
    joinCondition: 'sales.customer_id == customers.id'
  },
  {
    sourceEntity: 'Sale',
    targetEntity: 'SaleItems',
    path: ['sales.id', 'saleItems.sale_id'],
    description: 'يربط رأس الفاتورة ببنود الأصناف المباعة بالتفصيل',
    joinCondition: 'saleItems.sale_id == sales.id'
  },
  {
    sourceEntity: 'SaleItem',
    targetEntity: 'Product',
    path: ['saleItems.product_id', 'products.id'],
    description: 'يربط بند البيع ببيانات المنتج الأصلية لحساب تكلفة الصنف والربح المحقق منه',
    joinCondition: 'products.id == saleItems.product_id'
  },
  {
    sourceEntity: 'Supplier',
    targetEntity: 'Products',
    path: ['suppliers.id', 'products.supplier_id'],
    description: 'يربط شركة التوريد بجميع الأصناف التي توردها للمحل',
    joinCondition: 'products.supplier_id == suppliers.id'
  },
  {
    sourceEntity: 'Supplier',
    targetEntity: 'SupplierPayments',
    path: ['suppliers.id', 'supplierPayments.supplier_id'],
    description: 'يربط المورد بسندات الصرف والدفعات النقدية المسددة له',
    joinCondition: 'supplierPayments.supplier_id == suppliers.id'
  }
];

/**
 * Helper: Find accounting formula or concept by query or name
 */
export function getAccountingConcept(conceptIdOrName: string): AccountingConcept | undefined {
  if (ACCOUNTING_CONCEPTS[conceptIdOrName]) return ACCOUNTING_CONCEPTS[conceptIdOrName];
  const normalized = conceptIdOrName.toLowerCase();
  return Object.values(ACCOUNTING_CONCEPTS).find(
    c => c.arabicName.includes(normalized) || c.englishName.toLowerCase().includes(normalized)
  );
}

/**
 * Helper: Retrieve schema table details
 */
export function getSchemaTable(tableName: string): SchemaTable | undefined {
  return ACCOUNTING_SCHEMA_GRAPH[tableName];
}
