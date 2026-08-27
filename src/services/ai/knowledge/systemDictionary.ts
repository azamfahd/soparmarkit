/**
 * Comprehensive System & Accounting Domain Dictionary.
 * Maps Database Tables, Fields, Operations, UI Elements, Synonyms, Dialects, and Associated Tools.
 */

export interface DictionaryEntry {
  term: string;
  category: 'TABLE' | 'FIELD' | 'SECTION' | 'CONCEPT' | 'OPERATION' | 'METRIC';
  arabicName: string;
  englishName: string;
  synonyms: string[];
  dialects: {
    yemeni?: string[];
    gulf?: string[];
    egyptian?: string[];
  };
  commonTypos: string[];
  associatedIntent: string;
  associatedTool?: string;
  description: string;
}

export const SYSTEM_DICTIONARY: DictionaryEntry[] = [
  {
    term: 'sales',
    category: 'TABLE',
    arabicName: 'جدول المبيعات والفواتير',
    englishName: 'Sales Invoices Table',
    synonyms: ['فواتير', 'مبيعات', 'فواتير البيع', 'العمليات', 'ايصالات'],
    dialects: {
      yemeni: ['بيع', 'بيعات', 'حساب البيع', 'دخل اليوميه', 'زلط البيع', 'حق اليوم'],
      gulf: ['مبيعات', 'فواتير', 'دخل المحل', 'ايرادات'],
      egyptian: ['ايراد', 'فواتير', 'حساب البيع']
    },
    commonTypos: ['مبيعاات', 'المبيعاات', 'فواتيير', 'مبيعت'],
    associatedIntent: 'SALES_SUMMARY',
    associatedTool: 'querySalesSummary',
    description: 'يخزن كل فاتورة بيع بما فيها الإجمالي، الخصم، طريقة الدفع، والوقت.'
  },
  {
    term: 'products',
    category: 'TABLE',
    arabicName: 'جدول الأصناف والمخزون',
    englishName: 'Products & Inventory Table',
    synonyms: ['السلع', 'البضائع', 'الأصناف', 'المخزون', 'المستودع', 'المنتجات'],
    dialects: {
      yemeni: ['بضايع', 'اغراض', 'حبات', 'كراتين', 'مواد', 'بضاعة المخزن'],
      gulf: ['ايتمات', 'سلع', 'اغراض', 'المخزون'],
      egyptian: ['بضاعة', 'اصناف', 'المنتجات']
    },
    commonTypos: ['المخزوون', 'المنتجاات', 'الاصنااف', 'الاصناف'],
    associatedIntent: 'PRODUCT_SEARCH',
    associatedTool: 'queryProductDetails',
    description: 'يخزن بيانات السلع وأسعار التكلفة والبيع وكميات المخزون وتواريخ الصلاحية.'
  },
  {
    term: 'customers',
    category: 'TABLE',
    arabicName: 'جدول العملاء والذمم المدينة',
    englishName: 'Customers Ledger Table',
    synonyms: ['الزبائن', 'العملاء', 'المدينين', 'أصحاب الديون', 'الذمم'],
    dialects: {
      yemeni: ['الزباين', 'زبائن الدفتر', 'اهل الديون', 'اللي نطلبهم زلط', 'الاجل'],
      gulf: ['العملاء', 'الزبائن', 'اهل الحساب', 'المديونية'],
      egyptian: ['الزباين', 'العملاء', 'اللي عليهم فلوس']
    },
    commonTypos: ['العملا', 'الزبايين', 'الديوون', 'العملاء'],
    associatedIntent: 'CUSTOMER_BALANCE',
    associatedTool: 'queryCustomerBalance',
    description: 'يخزن بيانات العملاء وأرقامهم وإجمالي رصيد الديون المستحقة عليهم.'
  },
  {
    term: 'suppliers',
    category: 'TABLE',
    arabicName: 'جدول الموردين والشركات الموزعة',
    englishName: 'Suppliers Ledger Table',
    synonyms: ['الموردين', 'الشركات', 'الموزعين', 'المندوبين', 'تجار الجملة'],
    dialects: {
      yemeni: ['مندوب الشركة', 'اصحاب البضاعة', 'الموردين حقنا', 'اللي يطلبونا بيس', 'حق الشركات'],
      gulf: ['الموردين', 'الشركات الموزعة', 'الموزع'],
      egyptian: ['الموردين', 'التجار', 'شركات التوزيع']
    },
    commonTypos: ['المورديين', 'المورردين', 'الشركاات'],
    associatedIntent: 'SUPPLIER_BALANCE',
    associatedTool: 'querySupplierBalance',
    description: 'يخزن بيانات الموردين والمبالغ المستحقة لهم على المتجر.'
  },
  {
    term: 'profit',
    category: 'METRIC',
    arabicName: 'الأرباح وصافي المكاسب',
    englishName: 'Net & Gross Profit',
    synonyms: ['المكاسب', 'الربح', 'صافي الدخل', 'الفائدة', 'مجمل الربح', 'صافي الربح'],
    dialects: {
      yemeni: ['الفوايد', 'المكسب', 'كم طلع لنا', 'صافي المحل', 'ربح اليوم'],
      gulf: ['الربح الصافي', 'المردود', 'الفائدة'],
      egyptian: ['المكسب', 'الارباح', 'صافي الدخل']
    },
    commonTypos: ['الارباح', 'الاررباح', 'المكاسسب', 'الربح'],
    associatedIntent: 'PROFIT_SUMMARY',
    associatedTool: 'queryProfitSummary',
    description: 'الربح المحقق = إجمالي المبيعات - تكلفة البضاعة المباعة - المصاريف والمسحوبات.'
  },
  {
    term: 'low_stock',
    category: 'METRIC',
    arabicName: 'النواقص والكميات الحرجة',
    englishName: 'Low Stock Alert',
    synonyms: ['البضاعة الناقصة', 'الأصناف القريبة من النفاد', 'عجز المخزون', 'النواقص'],
    dialects: {
      yemeni: ['ايش عاد به ناقص', 'ايش بيخلص', 'بضاعة بتكمل', 'ما بش منه', 'ايش باقيله قليل'],
      gulf: ['اللي قرب يخلص', 'النواقص', 'المخزون الناقص'],
      egyptian: ['اللي قرب يخلص', 'البضاعة الناقصة', 'النواقص']
    },
    commonTypos: ['النوااقص', 'الناقص', 'النواقصص'],
    associatedIntent: 'LOW_STOCK',
    associatedTool: 'queryLowStockProducts',
    description: 'الأصناف التي انخفضت كميتها في المخزن عن 5 قطع وتحتاج إعادة طلب.'
  },
  {
    term: 'cash_drawer',
    category: 'SECTION',
    arabicName: 'مطابقة الصندوق والدرج',
    englishName: 'Cash Drawer Reconciliation',
    synonyms: ['الخزينة', 'صندوق النقدية', 'الدرج', 'تصفية الصندوق', 'مطابقة الصندوق'],
    dialects: {
      yemeni: ['فلوس الدرج', 'زلط الصندوق', 'مطابقة الوردية', 'نقدية اليومية'],
      gulf: ['حق الدرج', 'كاش الصندوق', 'الخزينة'],
      egyptian: ['فلوس الدرج', 'الخزنة', 'كاش الوردية']
    },
    commonTypos: ['الصنددوق', 'الدررج', 'الخزينه'],
    associatedIntent: 'CASH_BALANCE',
    associatedTool: 'queryCashDrawerBalance',
    description: 'النقدية الفعلية بالدرج ومطابقتها مع المبيعات الكاش وسندات القبض.'
  },
  {
    term: 'customer_payment',
    category: 'OPERATION',
    arabicName: 'سند قبض وتسديد دين عميل',
    englishName: 'Customer Payment Receipt',
    synonyms: ['تسديد دين', 'سند قبض', 'سداد عميل', 'قبض نقدية'],
    dialects: {
      yemeni: ['سدد زلط', 'دفع اللي عليه', 'قبضنا منه', 'نزل من حسابه'],
      gulf: ['سداد دين', 'تسديد دفعة', 'سند قبض'],
      egyptian: ['سداد حساب', 'سند قبض', 'دفع فلوس']
    },
    commonTypos: ['سندد قبض', 'تسديدد'],
    associatedIntent: 'CUSTOMER_BALANCE',
    associatedTool: 'queryCustomerBalance',
    description: 'عملية تحصيل مالي تخفض دين العميل وتزيد كاش الصندوق فوراً.'
  },
  {
    term: 'supplier_payment',
    category: 'OPERATION',
    arabicName: 'سند صرف ودفع للمورد',
    englishName: 'Supplier Payment Voucher',
    synonyms: ['سند صرف', 'تسديد مورد', 'دفعة للمورد', 'صرف كاش'],
    dialects: {
      yemeni: ['سددنا المورد', 'صرفنا للشركة', 'اعطينا المندوب'],
      gulf: ['سداد مورد', 'دفعة للشركة', 'سند صرف'],
      egyptian: ['صرف للمورد', 'سداد فاتورة التوريد']
    },
    commonTypos: ['سندد صرف', 'تسديدد مورد'],
    associatedIntent: 'SUPPLIER_BALANCE',
    associatedTool: 'querySupplierBalance',
    description: 'عملية سداد نقدية للمورد تخفض التزامات المحل وتخصم من الصندوق.'
  },
  {
    term: 'cash_withdrawal',
    category: 'OPERATION',
    arabicName: 'سحب نقدي ومصروفات نقدية',
    englishName: 'Cash Withdrawal & Expense',
    synonyms: ['سحب نقدي', 'مصروفات', 'مسحوبات شخصية', 'مصاريف المحل'],
    dialects: {
      yemeni: ['سحب زلط', 'مصاريف الدرج', 'خرجنا بيس', 'شلينا من الدرج'],
      gulf: ['سحب كاش', 'مصاريف نقدية', 'مسحوبات'],
      egyptian: ['سحب كاش', 'مصاريف المحل', 'مسحوبات']
    },
    commonTypos: ['سحبب نقدي', 'مصرووف'],
    associatedIntent: 'CASH_BALANCE',
    associatedTool: 'queryCashDrawerBalance',
    description: 'تسجيل أي مبلغ مسحوب من الدرج للمصاريف أو للمالك مما يقلل صافي الربح.'
  },
  {
    term: 'inventory_valuation',
    category: 'METRIC',
    arabicName: 'رأس مال المخزون وتقييم البضاعة',
    englishName: 'Inventory Capital & Valuation',
    synonyms: ['تقييم المخزون', 'رأس المال', 'بضاعة المحل', 'قيمة الجرد', 'بضاعة المخزن'],
    dialects: {
      yemeni: ['راس مال المحل', 'بكم البضاعة كلها', 'كم معنا زلط في البضاعة'],
      gulf: ['قيمة المخزون', 'رأس المال في البضاعة'],
      egyptian: ['بضاعة المحل بكام', 'تقييم المخزن']
    },
    commonTypos: ['راس المال', 'تقييم المخزوون'],
    associatedIntent: 'INVENTORY_VALUATION',
    associatedTool: 'queryInventoryValuation',
    description: 'إجمالي القيمة المالية للبضاعة المتوفرة بالتكلفة والبيع ومجمل الأرباح المتوقعة.'
  },
  {
    term: 'anomaly_detection',
    category: 'CONCEPT',
    arabicName: 'كشف الشذوذ والتشخيص المحاسبي',
    englishName: 'Financial Anomaly Detection',
    synonyms: ['كشف الأخطاء', 'التشخيص المالي', 'الشذوذ المالي', 'فحص الحسابات'],
    dialects: {
      yemeni: ['ايش فيه غلط', 'فحص الحسابات', 'كشف الاخطاء'],
      gulf: ['تشخيص الحسابات', 'كشف الأخطاء المالية'],
      egyptian: ['فحص المشاكل', 'كشف الغلطات']
    },
    commonTypos: ['كشف الشذوذذ', 'التشخيصص'],
    associatedIntent: 'ANOMALY_DETECTION',
    associatedTool: 'queryFinancialAnomalies',
    description: 'خوارزميات ذكية ترصد الأسعار السالبة، والكميات الحرجة، وتجاوز الحدود الائتمانية.'
  },
  {
    term: 'sales_forecast',
    category: 'CONCEPT',
    arabicName: 'التنبؤ بالمبيعات المستقبلية',
    englishName: 'Sales Forecasting Engine',
    synonyms: ['توقع المبيعات', 'المبيعات المستقبلية', 'تنبؤ الأداء', 'تقدير المبيعات'],
    dialects: {
      yemeni: ['كم با نبيع', 'توقع بيع بكرة', 'حساب المستقبل'],
      gulf: ['توقع المبيعات القادمة', 'تقدير الإيراد'],
      egyptian: ['توقعات المبيعات']
    },
    commonTypos: ['تنبؤؤ', 'توقع المبيعاات'],
    associatedIntent: 'SALES_FORECAST',
    associatedTool: 'querySalesForecast',
    description: 'نموذج إحصائي محلي للتنبؤ بحجم مبيعات الأيام والأسابيع القادمة.'
  },
  {
    term: 'system_cards',
    category: 'CONCEPT',
    arabicName: 'بطاقات ومؤشرات لوحة التحكم',
    englishName: 'System Cards & Widgets',
    synonyms: ['البطاقات', 'كروت النظام', 'المؤشرات', 'مربعات البيانات'],
    dialects: {
      yemeni: ['كروت اللوحة', 'بطايق الشاشة', 'المربعات اللي فوق'],
      gulf: ['كروت الداشبورد', 'البطاقات الإحصائية'],
      egyptian: ['كروت النظام', 'البطاقات']
    },
    commonTypos: ['البطاقاات', 'كرووت'],
    associatedIntent: 'SYSTEM_DICTIONARY_EXPLANATION',
    description: 'بطاقات لوحة التحكم التفاعلية التي تعرض المبيعات والأرباح ورأس المال والديون.'
  },
  {
    term: 'capital_paid_to_suppliers',
    category: 'METRIC',
    arabicName: 'رأس المال المسلّم للتجار والموردين',
    englishName: 'Capital Paid to Suppliers',
    synonyms: ['رأس المال المسلم للتجار', 'راس المال المسلم للتجار', 'تسديدات التجار', 'مدفوعات الموردين', 'سداد الشركات الموردة', 'بطاقة رأس المال المسلم للتجار'],
    dialects: {
      yemeni: ['الزلط اللي دفعناها للشركات', 'تسديدات الموردين', 'حق التجار اللي دفعناه'],
      gulf: ['مدفوعات الموردين', 'سداد حسابات الشركات'],
      egyptian: ['الفلوس المسددة للموردين', 'فلوس التجار']
    },
    commonTypos: ['راس المال المسلم', 'راس المال المسلم للتجارر', 'رأس المال الموردين'],
    associatedIntent: 'SYSTEM_DICTIONARY_EXPLANATION',
    associatedTool: 'querySupplierBalance',
    description: 'بطاقة إحصائية تعرض إجمالي المبالغ والسيولة النقدية التي تم سدادها وتوريدها للموردين وتجار الجملة لشراء البضائع وتخفيض الالتزامات والديون المسجلة للشركات الموردة.'
  },
  {
    term: 'retail_price_sales',
    category: 'METRIC',
    arabicName: 'إجمالي المبيعات بسعر البيع (القيمة السوقية)',
    englishName: 'Gross Sales at Retail Price',
    synonyms: ['إجمالي المبيعات بسعر البيع', 'اجمالي المبيعات بسعر البيع', 'القيمة السوقية للمبيعات', 'مبيعات بسعر المفرق', 'بطاقة إجمالي المبيعات بسعر البيع'],
    dialects: {
      yemeni: ['المبيعات بسعر البيع للمستهلك', 'اجمالي القيمة بسعر المفرق'],
      gulf: ['قيمة المبيعات الإجمالية بسعر التجزئة'],
      egyptian: ['إجمالي البيع بسعر القطاعي']
    },
    commonTypos: ['اجمالي المبيعات بسعر البيع', 'المبيعات بسعر البييع'],
    associatedIntent: 'SYSTEM_DICTIONARY_EXPLANATION',
    associatedTool: 'querySalesSummary',
    description: 'بطاقة تعرض القيمة الإجمالية لكافة المبيعات المحققة محسوبة بأسعار البيع النهائية للمستهلك قبل خصم تكلفة الشراء أو المصاريف التشغيلية.'
  },
  {
    term: 'credit_sales_card',
    category: 'METRIC',
    arabicName: 'بطاقة المبيعات بالآجل والبيع بالدين',
    englishName: 'Credit Sales Card',
    synonyms: ['المبيعات بالآجل', 'المبيعات بالاجل', 'بطاقة المبيعات بالآجل', 'بيع بالدين', 'ديون المبيعات', 'حجم شغل الآجل'],
    dialects: {
      yemeni: ['شغل الاجل', 'بيعات الدفتر', 'كم باعت المنشاة بالاجل'],
      gulf: ['المبيعات الآجلة', 'البيع على الحساب'],
      egyptian: ['البيع بالآجل', 'المبيعات بالشكك']
    },
    commonTypos: ['المبيعات بالاجل', 'المبيعاات بالآجل'],
    associatedIntent: 'CREDIT_SALES_QUERY',
    associatedTool: 'querySalesSummary',
    description: 'بطاقة تقيس حجم وقيمة البضائع التي تم بيعها بالآجل (بالدين للزبائن) خلال الدورة المحاسبية دون استلام نقدية فورية.'
  },
  {
    term: 'withdrawals_and_adjustments_card',
    category: 'METRIC',
    arabicName: 'بطاقة سحب وتسويات المسحوبات النقدية',
    englishName: 'Withdrawals & Adjustments Card',
    synonyms: ['سحب وتسويات', 'سحب وتسوية', 'بطاقة سحب وتسويات', 'المسحوبات والتسويات', 'تسوية الصندوق', 'نقص الدرج والمسحوبات'],
    dialects: {
      yemeni: ['المسحوبات من الدرج', 'تصفية وتسويات', 'عجز وزيادة الدرج'],
      gulf: ['سحب وتسويات كاش', 'تسويات الخزينة'],
      egyptian: ['مسحوبات الخزنة والتسويات']
    },
    commonTypos: ['سحب وتسوياتت', 'المسحوبات وتسويات'],
    associatedIntent: 'WITHDRAWALS_AND_ADJUSTMENTS_QUERY',
    associatedTool: 'queryCashDrawerBalance',
    description: 'بطاقة توضح إجمالي العمليات المالية المتعلقة بالسحب النقدي الشخصي للمالك، المصروفات الجانبية، أو تسويات فروقات الصندوق بين الدفتري والفعلي.'
  },
  {
    term: 'net_profit_card',
    category: 'METRIC',
    arabicName: 'بطاقة صافي الربح والمكسب الصافي',
    englishName: 'Net Profit Metric Card',
    synonyms: ['صافي الربح', 'الربح الصافي', 'صافي المحل', 'المكسب الصافي', 'بطاقة صافي الربح', 'الصافي المالي'],
    dialects: {
      yemeni: ['صافي فائدة المحل', 'المكسب بعد المصاريف'],
      gulf: ['صافي الأرباح النهائبة'],
      egyptian: ['الربح الصافي بعد المصاريف']
    },
    commonTypos: ['صاافي الربح', 'صافي الارباح'],
    associatedIntent: 'PROFIT_SUMMARY',
    associatedTool: 'queryProfitSummary',
    description: 'بطاقة تعرض الربح الصافي المتبقي بعد خصم تكلفة الشراء والمصاريف التشغيلية والمسحوبات من الإيرادات الإجمالية.'
  },
  {
    term: 'cost_price_capital_card',
    category: 'METRIC',
    arabicName: 'بطاقة رأس مال البضاعة بسعر التكلفة',
    englishName: 'Inventory Cost Price Capital Card',
    synonyms: ['رأس مال البضاعة بسعر التكلفة', 'راس مال التكلفة', 'تكلفة المخزون', 'بضاعة بسعر الجملة', 'بطاقة رأس مال التكلفة'],
    dialects: {
      yemeni: ['راس مال البضاعة جملة', 'الزلط المستثمرة في المخزن'],
      gulf: ['قيمة المخزون بالتكلفة'],
      egyptian: ['رأس مال البضاعة جملة']
    },
    commonTypos: ['راس مال التكلفة', 'راس مال البضاعة'],
    associatedIntent: 'INVENTORY_VALUATION',
    associatedTool: 'queryInventoryValuation',
    description: 'بطاقة تعكس القيمة المالية الأصلية للبضائع المتوفرة بالمخزن مقيمة بأسعار شراء الجملة من الموردين.'
  },
  {
    term: 'debtor_customers_card',
    category: 'METRIC',
    arabicName: 'بطاقة ديون العملاء الإجمالية',
    englishName: 'Debtor Customers Total Card',
    synonyms: ['ديون العملاء', 'مستحقات على الزباين', 'بطاقة ديون العملاء', 'زلط الدفتر', 'ديون الزبائن'],
    dialects: {
      yemeni: ['ديون الدفتر', 'اللي نطلبهم زلط', 'مستحقات الزباين'],
      gulf: ['مديونيات العملاء', 'ذمم العملاء'],
      egyptian: ['ديون الزباين', 'اللي على الناس']
    },
    commonTypos: ['ديوون العملاء', 'ديون الزبائن'],
    associatedIntent: 'CUSTOMER_BALANCE',
    associatedTool: 'queryCustomerBalance',
    description: 'بطاقة توضح المجموع الكلي لكافة الديون والمبالغ المالية المستحقة على الذمم والعملاء والزبائن في المتجر.'
  },
  {
    term: 'creditor_suppliers_card',
    category: 'METRIC',
    arabicName: 'بطاقة مستحقات الموردين والشركات',
    englishName: 'Creditor Suppliers Total Card',
    synonyms: ['مستحقات الموردين', 'ديون الشركات', 'بطاقة مستحقات الموردين', 'حق الشركات الموردة'],
    dialects: {
      yemeni: ['حق الشركات اللي علينا', 'ديون تجار الجملة'],
      gulf: ['التزامات الموردين', 'مستحقات الشركات'],
      egyptian: ['فلوس التجار اللي علينا']
    },
    commonTypos: ['مستحقاات الموردين', 'ديون الموردين'],
    associatedIntent: 'SUPPLIER_BALANCE',
    associatedTool: 'querySupplierBalance',
    description: 'بطاقة تعرض مجموع الالتزامات والديون المستحقة لشركات التوريد والموزعين مقابل فواتير شراء سابقة.'
  },
  {
    term: 'pos_cashier_section',
    category: 'SECTION',
    arabicName: 'شاشة نقطة البيع والكاشير السريع (POS)',
    englishName: 'Point of Sale (POS) Cashier Section',
    synonyms: ['نقطة البيع', 'شاشة الكاشير', 'شاشة البيع', 'شاشة POS', 'قسم الكاشير'],
    dialects: {
      yemeni: ['شاشة البيع السريع', 'مكينة الكاشير'],
      gulf: ['شاشة البيع الكاشير'],
      egyptian: ['شاشة البيع']
    },
    commonTypos: ['نقطة البييع', 'شاشة الكاشيرر'],
    associatedIntent: 'SYSTEM_SECTIONS_GUIDE',
    description: 'القسم المخصص لإصدار فواتير البيع الفورية واستخدام الباركود، واختيار طرق الدفع وطباعة الإيصال للزبون.'
  },
  {
    term: 'barcode_scanner_button',
    category: 'OPERATION',
    arabicName: 'زر وقارئ الباركود التلقائي',
    englishName: 'Barcode Scanner Tool & Button',
    synonyms: ['زر الباركود', 'قارئ الباركود', 'مسح الباركود', 'سكانر الباركود'],
    dialects: {
      yemeni: ['قارئ الباركود', 'سكانر الصنف'],
      gulf: ['ماسح الباركود'],
      egyptian: ['قارئ الباركود']
    },
    commonTypos: ['قارئ الباركودد', 'زر الباركود'],
    associatedIntent: 'SYSTEM_DICTIONARY_EXPLANATION',
    description: 'أداة تتيح قراءة رمز الباركود للمنتج وجلب اسمه وسعره وتكلفته تلقائياً وتثبيته بالفاتورة أو البحث عنه.'
  },
  {
    term: 'print_invoice_button',
    category: 'OPERATION',
    arabicName: 'زر طباعة وحفظ الفاتورة حرارياً',
    englishName: 'Print & Save Invoice Action Button',
    synonyms: ['زر طباعة الفاتورة', 'طباعة الفاتورة', 'حفظ وطباعة', 'إنهاء الفاتورة'],
    dialects: {
      yemeni: ['طباعة الفاتورة', 'قطع الفاتورة', 'اخراج الإيصال'],
      gulf: ['طباعة الفاتورة'],
      egyptian: ['طباعة الفاتورة']
    },
    commonTypos: ['زر طباعة الفاتورة', 'طباعة الفاتورة'],
    associatedIntent: 'SYSTEM_DICTIONARY_EXPLANATION',
    description: 'أمر تشغيلي يرحل الفاتورة للسيستم، وحدث كميات المخزون، ورصيد الصندوق أو العميل، ويرسل أمر الطباعة لطباعة الفاتورة.'
  },
  {
    term: 'import_smart_card',
    category: 'SECTION',
    arabicName: 'قسم وميزة الاستيراد الذكي للفواتير المطبوعة',
    englishName: 'Smart AI Invoice Import System',
    synonyms: ['الاستيراد الذكي', 'قراءة الفواتير', 'رفع الفاتورة المطبوعة', 'استيراد فواتير الموردين'],
    dialects: {
      yemeni: ['رفع فاتورة المورد', 'مسح الفاتورة الورقية'],
      gulf: ['استيراد الفواتير الذكي'],
      egyptian: ['رفع الفواتير المطبوعة']
    },
    commonTypos: ['الاستيراد الذكيي', 'رفع الفاتورة'],
    associatedIntent: 'SYSTEM_DICTIONARY_EXPLANATION',
    description: 'قسم ذكي يعتمد على الذكاء الاصطناعي لقراءة صور وفواتير الموردين المطبوعة وتفريغ بنودها وأسعارها وتحديث مخزون المحل تلقائياً.'
  }
];


export function lookupSystemDictionary(query: string): DictionaryEntry[] {
  const norm = query.toLowerCase().trim();
  const matched = SYSTEM_DICTIONARY.filter(entry => {
    if (norm.includes(entry.term) || norm.includes(entry.arabicName) || norm.includes(entry.englishName.toLowerCase())) return true;
    if (entry.synonyms.some(s => norm.includes(s.toLowerCase()) || s.toLowerCase().includes(norm))) return true;
    if (entry.commonTypos.some(t => norm.includes(t.toLowerCase()))) return true;
    if (entry.dialects.yemeni?.some(y => norm.includes(y.toLowerCase()))) return true;
    if (entry.dialects.gulf?.some(g => norm.includes(g.toLowerCase()))) return true;
    return false;
  });

  if (matched.length > 0) return matched;

  // Fallback word token matching for dictionary terms
  const tokens = norm.split(/\s+/).filter(t => t.length >= 3);
  return SYSTEM_DICTIONARY.filter(entry => {
    const entryText = `${entry.arabicName} ${entry.synonyms.join(' ')} ${entry.description}`.toLowerCase();
    return tokens.some(tok => entryText.includes(tok));
  });
}

