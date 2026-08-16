import { db, KnowledgeDocumentRecord } from '../../../db';
import {
  processAndStoreDocument,
  ProcessedDocumentResult,
  deleteDocumentChunksFromDB,
  reindexAllKnowledgeDocuments,
  chunkTextSemantically,
  storeDocumentChunksInDB,
} from '../rag/documentProcessor';
import { readAndParseUploadedFile } from './fileParsers';
import { normalizeArabic } from '../nlu/arabicNormalizer';

export interface KnowledgeStoreStats {
  totalDocuments: number;
  totalChunks: number;
  categories: { name: string; count: number }[];
  fileTypes: { type: string; count: number }[];
  lastUpdated: number;
}

/**
 * Ensures the knowledge store contains a rich set of supermarket accounting & policy guides.
 */
export async function seedExtendedKnowledgeBase(): Promise<void> {
  if (!db.knowledgeDocuments) return;

  const count = await db.knowledgeDocuments.count();
  if (count >= 11) return; // Already seeded with rich documents

  const now = Date.now();

  const defaultDocs: Omit<KnowledgeDocumentRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: 'كيفية إضافة منتج جديد وتحديث الأصناف',
      category: 'دليل استخدام',
      content:
        'لإضافة صنف جديد إلى المخزن، انتقل إلى صفحة المنتجات والمخزون، واضغط على زر "إضافة منتج جديد". قم بملء اسم الصنف، الفئة (مثل مواد غذائية، زيوت، ألبان، منظفات)، سعر التكلفة، سعر البيع، الكمية الابتدائية، والباركود إن وجد. كما ينصح بتحديد تاريخ الانتهاء للأصناف الغذائية لتلقي تنبيهات القرب من النفاد أو الانتهاء تلقائياً.',
      tags: ['منتج', 'إضافة', 'مخزون', 'أسعار', 'بارادود', 'تاريخ انتهاء'],
      fileType: 'MANUAL',
    },
    {
      title: 'إدارة ديون العملاء وكشوفات الحساب',
      category: 'أنظمة محاسبية',
      content:
        'عند البيع الآجل لزبون، يتم اختيار طريقة الدفع "دين" وتحديد اسم العميل. يقوم النظام تلقائياً بترحيل المبلغ إلى رصيد الزبون. لتسديد مبلغ من الدين، افتح قائمة العملاء، اختر العميل، ثم اضغط "تسديد دين" وادخل المبلغ المسدد ونوعه (نقدي أو تحويل). يمكنك طباعة كشف حساب مفصل يوضح إجمالي المشتريات، إجمالي السدادات، والرصيد المتبقي عليه.',
      tags: ['دين', 'عملاء', 'تسديد', 'كشف حساب', 'آجل'],
      fileType: 'MANUAL',
    },
    {
      title: 'مستحقات الموردين ومتابعة شركات التوريد',
      category: 'أنظمة محاسبية',
      content:
        'يتيح النظام تسديد مستحقات شركات التوريد والموزعين وتسجيل المشتريات الآجلة. من قائمة الموردين، يمكنك مشاهدة رصيد كل مورد (المبالغ المستحقة له علينا)، وتسجيل دفعة جديدة عبر زر "تسديد دفعة للمورد". كما يمكنك ربط المنتجات بموردها الرئيسي لسهولة إعادة الطلب عند انخفاض المخزون.',
      tags: ['موردين', 'مشتريات', 'مستحقات', 'شركات', 'سداد'],
      fileType: 'MANUAL',
    },
    {
      title: 'سياسة إرجاع واستبدال البضائع والسلع',
      category: 'سياسات وقوانين',
      content:
        'تسمح السوبرماركت بإرجاع البضائع والسلع الجافة والتالفة خلال 3 أيام من تاريخ الشراء بشرط إبراز الفاتورة الأصلية. المنتجات المبردة والطازجة (مثل الألبان والمخبوزات) لا تُرجع إلا في حال وجود عيب مصنعي في نفس يوم الشراء. يتم خصم قيمة الترجيع من صندوق المبيعات اليومي أو إضافة القيمة ككريديت لحساب العميل.',
      tags: ['إرجاع', 'استبدال', 'سياسة', 'فاتورة', 'ضمان'],
      fileType: 'MANUAL',
    },
    {
      title: 'إجراءات الجرد الدوري ومعالجة التوالف',
      category: 'إجراءات عمل',
      content:
        'يتم إجراء جرد شهري للمخزن لمطابقة الكميات الفعلية مع الكميات المسجلة بالنظام. في حال وجود عجز أو تلف، يتم تسجيليها عبر خيار "تعديل مخزون / تسجيل توالف" مع بيان السبب (تلف، انتهاء صلاحية، كسر). يتم احتساب التوالف كخسارة تشغيلية تؤثر مباشرة على التقرير المالي وصافي الأرباح.',
      tags: ['جرد', 'توالف', 'مخزون', 'عجز', 'أرباح'],
      fileType: 'MANUAL',
    },
    {
      title: 'تسوية الصندوق اليومي والمسحوبات النقدية',
      category: 'إجراءات عمل',
      content:
        'في نهاية كل وردية عمل، يتم إجراء "تسوية مبيعات" للتحقق من تطابق النقدية بالصندوق مع إجمالي المبيعات الكاش المخصوم منها السحوبات. المسحوبات الشخصية أو النثرية للكاشير يجب تسجيلها فوراً في خيار "سحب كاش" مع توضيح المستفيد والسبب، لضمان دقة التقرير المالي وعدم وجود عجز غير مبرر.',
      tags: ['صندوق', 'تسوية', 'مسحوبات', 'كاش', 'وردية'],
      fileType: 'MANUAL',
    },
    {
      title: 'طريقة قراءة التقرير المالي والأرباح والخسائر',
      category: 'أنظمة محاسبية',
      content:
        'يتكون التقرير المالي من قسمين أساسيين:\n1. قائمة الدخل: تحسب إجمالي المبيعات مطروحاً منها تكلفة البضاعة المباعة (COGS) لإعطاء مجمل الربح، ثم يطرح منها المصاريف والمسحوبات للحصول على صافي الربح.\n2. قائمة المركز المالي: تعرض قيمة أصول الديون لدى العملاء، قيمة المخزون الحالي بالتكلفة، والتزامات الموردين.',
      tags: ['تقرير مالي', 'أرباح', 'خسائر', 'مركز مالي', 'تكلفة'],
      fileType: 'MANUAL',
    },
    {
      title: 'دليل استخدام مساعد الذكاء الاصطناعي',
      category: 'دليل استخدام',
      content:
        'يمكنك الاستفسار من المساعد الذكي بأي صيغة باللغة العربية أو اللهجة المحلية، مثل:\n• "كم مبيعات اليوم وأرباح الأسبوع؟"\n• "من هم العملاء الذين عليهم ديون مرتفعة؟"\n• "ما هي المنتجات القريبة من الانتهاء أو النفاد؟"\n• "أعطني كشف حساب الزبون أحمد"\n• "ما هي سياسة الترجيع في المحل؟"',
      tags: ['مساعد ذكي', 'ذكاء اصطناعي', 'أسئلة', 'شرح'],
      fileType: 'MANUAL',
    },
    {
      title: 'امتثال ضريبة القيمة المضافة 15% وتطبيقات الفوترة الإلكترونية',
      category: 'أنظمة محاسبية',
      content:
        'تخضع كافة المبيعات للضريبة القياسية المحددة بـ 15%. يتم احتساب الضريبة تلقائياً في كل فاتورة بيع وتضاف إلى الإجمالي. تشتمل الفاتورة الضريبية المبسطة على الرقم الضريبي للمنشأة، الختم المشفّر، وتاريخ وساعة الشراء، وتفاصيل ضريبة المخرجات المجمعة التي تُورّد لهيئة الزكاة والضريبة والجمارك.',
      tags: ['ضريبة', 'القيمة المضافة', 'زكاة', 'ZATCA', 'فوترة إلكترونية', '15%'],
      fileType: 'MANUAL',
    },
    {
      title: 'سياسة الحدود الائتمانية وإدارة الديون المعدومة',
      category: 'سياسات وقوانين',
      content:
        'يتم تحديد حد ائتماني أقصى لكل عميل يتعامل بالآجل (مثلاً 5000 ريال). يمنع النظام إصدار أي فاتورة جديدة بالآجل إذا تجاوز رصيد العميل الحد الأقصى المسموح به إلا بعد سداد جزء من المستحقات. تُصنف الديون التي يتأخر سدادها لأكثر من 90 يوماً كـ "ديون مشكوك في تحصيلها" وتتطلب متابعة هاتفية أو قانونية.',
      tags: ['حد ائتماني', 'ديون', 'عملاء', 'ائتمان', 'سداد', 'تأخير'],
      fileType: 'MANUAL',
    },
    {
      title: 'إدارة المخزون بطيء الحركة والمنتجات الراكدة',
      category: 'إجراءات عمل',
      content:
        'يُعرب المنتج عن كونه "راكد" إذا لم تُسجل عليه أي حركة بيع خلال 30 يوماً متتالية. ينصح النظام بالقيام بتخفيضات أو عروض ترويجية (مثل اشتري واحد واحصل على الثاني مجاناً) لسرعة تدوير رأس المال ومنع تلف البضائع في المستودع.',
      tags: ['مخزون راكد', 'بطيء الحركة', 'عروض', 'تخفيضات', 'تدوير رأس المال'],
      fileType: 'MANUAL',
    },
    {
      title: 'القاموس المحاسبي الشامل والمصطلحات المالية في نقاط البيع',
      category: 'أنظمة محاسبية',
      content:
        'القاموس المحاسبي المعتمد للمتجر:\n' +
        '1. مبيعات نقدية (Cash Sales): مبيعات تُدفع فوراً وتدخل مباشرة إلى صندوق النقدية اليومي.\n' +
        '2. مبيعات آجلة / ذمم مدينة (Credit/Debt Sales): مبيعات تسجل كدين على العميل في حسابه ولا تدخل في النقدية الفورية حتى يتم سدادها.\n' +
        '3. تكلفة البضاعة المباعة (COGS): التكلفة الإجمالية لشراء المنتجات التي تم بيعها خلال الفترة = مجموع (الكمية المباعة × سعر تكلفة الشراء للقطعة).\n' +
        '4. مجمل الربح (Gross Profit): الدخل المتبقي من المبيعات بعد خصم تكلفة البضاعة المباعة = إجمالي المبيعات - تكلفة البضاعة المباعة.\n' +
        '5. صافي الربح (Net Profit): الربح النهائي بعد خصم كافة المصاريف التشغيلية والمسحوبات النقدية = مجمل الربح - المصاريف والمسحوبات غير المردودة.\n' +
        '6. هامش الربح (Profit Margin %): النسبة المئوية للربح مقارنة بالإيرادات = (مجمل الربح ÷ إجمالي المبيعات) × 100.\n' +
        '7. سند قبض / سداد عميل (Customer Payment): معاملة تحصيل نقدية تخفض رصيد دين العميل وتزيد رصيد الصندوق.\n' +
        '8. سند صرف / دفعة لمورد (Supplier Payment): معاملة سداد نقدية من الصندوق تخفض ديون ومستحقات المورد وتخفض رصيد الصندوق.',
      tags: ['قاموس محاسبي', 'مصطلحات', 'COGS', 'مجمل ربح', 'صافي ربح', 'هامش ربح', 'ذمم', 'سند قبض', 'سند صرف'],
      fileType: 'MANUAL',
    },
    {
      title: 'المعادلات الرياضية والمالية المعتمدة في النظام',
      category: 'أنظمة محاسبية',
      content:
        'المعادلات والقواعد الحسابية الدقيقة المعتمدة في التقارير:\n' +
        '• إجمالي المبيعات = المبيعات النقدية + المبيعات الآجلة.\n' +
        '• رصيد الصندوق الفعلي = المبيعات النقدية + سندات قبض العملاء - دفعات الموردين النقدية - المصاريف والمسحوبات النقدية.\n' +
        '• رصيد دين العميل = مجموع فواتيره الآجلة - مجموع سندات السداد المقبوضة منه.\n' +
        '• مستحقات المورد = مجموع فواتير الشراء الآجلة منه - مجموع الدفعات المسددة له.\n' +
        '• القيمة المالية للمخزون بالتكلفة = مجموع (الكمية المتبقية في المخزن لكل صنف × سعر تكلفة الصنف).\n' +
        '• معدل دوران المخزون = تكلفة البضاعة المباعة ÷ متوسط قيمة المخزون.',
      tags: ['معادلات محاسبية', 'قواعد مالية', 'حساب الصندوق', 'حساب الدين', 'جرد المخزون', 'قيمة المخزون'],
      fileType: 'MANUAL',
    },
    {
      title: 'مخطط البيانات والعلاقات بين الجداول (Accounting Schema Graph)',
      category: 'أنظمة محاسبية',
      content:
        'الهيكل العلائقي لبيانات المحاسبة في النظام:\n' +
        '• جدول الفواتير (Sales) يرتبط بجدول تفاصيل الفاتورة (SaleItems) عبر المعرف `sale_id`.\n' +
        '• جدول تفاصيل الفاتورة (SaleItems) يرتبط بجدول الأصناف (Products) عبر `product_id` لمعرفة سعر التكلفة وحساب الربح.\n' +
        '• فواتير الدين ترتبط بالعملاء (Customers) عبر `customer_id` وتزيد في حقل `balance` للعميل.\n' +
        '• سندات قبض العملاء (CustomerPayments) ترتبط بالعميل `customer_id` وتخفض رصيده `balance`.\n' +
        '• المشتريات ومستحقات الموردين (Suppliers) تخزن التزامات المحل في `balance` المورد، وتخفض بسندات الصرف (SupplierPayments).\n' +
        '• المسحوبات النقدية (CashWithdrawals) تؤثر على صافي الربح وجرد الصندوق.',
      tags: ['مخطط البيانات', 'علاقات الجداول', 'schema', 'saleItems', 'customers', 'suppliers', 'products'],
      fileType: 'MANUAL',
    },
    {
      title: 'دليل وشرح شامل لجميع أقسام وشاشات البرنامج',
      category: 'دليل استخدام',
      content:
        'يتضمن البرنامج 9 أقسام ووحدات وظيفية رئيسية:\n' +
        '1. لوحة التحكم (Dashboard): تعرض مؤشرات الأداء اللحظية، مبيعات اليوم والشهر، صافي الأرباح، تقييم بضاعة المخزن، وموجز ديون العملاء والموردين والنواقص الحرجة.\n' +
        '2. نقطة البيع والكاشير (POS): شاشة البيع السريع وإصدار الفواتير، تدعم مسح الباركود، خيارات الدفع نقداً أو بالآجل (دين)، وحساب الخصم والطباعة الفورية.\n' +
        '3. المنتجات والمخزون (Products): إدارة البضائع، إضافة وتعديل الأصناف، ضبط أسعار التكلفة والبيع، متابعة الكميات، وتنبيهات انتهاء الصلاحية والنواقص.\n' +
        '4. العملاء والديون (Customers): سجل الزبائن ومتابعة الأرصدة المدينة، إصدار كشوفات الحساب التفصيلية، وتسجيل سندات القبض النقدية.\n' +
        '5. الموردين والشركات (Suppliers): متابعة الشركات الموردة، تسجيل المشتريات والالتزامات المستحقة، وتسجيل دفعات وسندات الصرف للموردين.\n' +
        '6. سجل المبيعات والفواتير (History): أرشيف الفواتير السابقة، مراجعة بنود وتفاصيل كل فاتورة، فلترة العمليات، وإدارة المرتجعات.\n' +
        '7. الملاحظات والتذكيرات (Notes): دفتر الملاحظات والمهام والتنبيهات الإدارية ومواعيد السداد.\n' +
        '8. المستشار المحاسبي الذكي (Smart Analytics): الوكيل الذكي للتحليل المالي والمحاسبي، يقدم استشارات، مقارنات، كشف الأخطاء وتوقع المبيعات محلياً 100%.\n' +
        '9. الإعدادات والأمان (Settings): النسخ الاحتياطي، ترخيص البرنامج، ربط الأجهزة، وضبط صلاحيات المستخدمين ورمز PIN.',
      tags: ['أقسام البرنامج', 'شاشات النظام', 'لوحة التحكم', 'الكاشير', 'المخزون', 'العملاء', 'الموردين', 'السجل', 'المستشار الذكي', 'الإعدادات'],
      fileType: 'MANUAL',
    },
  ];

  for (const doc of defaultDocs) {
    const existing = await db.knowledgeDocuments.where('title').equals(doc.title).first();
    if (!existing) {
      const newId = await db.knowledgeDocuments.add({
        ...doc,
        createdAt: now,
        updatedAt: now,
      });
      const chunks = chunkTextSemantically(doc.content, doc.title, 200, 40);
      await storeDocumentChunksInDB(newId, chunks, doc.tags || []);
    }
  }

  // Ensure all seeded documents have chunks
  if (db.documentChunks) {
    const chunkCount = await db.documentChunks.count();
    if (chunkCount === 0) {
      await reindexAllKnowledgeDocuments();
    }
  }
}

/**
 * Import and process an uploaded document file.
 */
export async function importKnowledgeDocumentFile(file: File): Promise<ProcessedDocumentResult> {
  const parsed = await readAndParseUploadedFile(file);
  return await processAndStoreDocument(
    parsed.title,
    parsed.category,
    parsed.content,
    parsed.tags
  );
}

/**
 * Gets all stored knowledge base documents.
 */
export async function getKnowledgeDocuments(): Promise<KnowledgeDocumentRecord[]> {
  if (!db.knowledgeDocuments) return [];
  await seedExtendedKnowledgeBase();
  return await db.knowledgeDocuments.toArray();
}

/**
 * Deletes a document by ID.
 */
export async function deleteKnowledgeDocument(id: number): Promise<void> {
  if (db.knowledgeDocuments) {
    await db.knowledgeDocuments.delete(id);
    await deleteDocumentChunksFromDB(id);
  }
}

/**
 * Exports all knowledge base documents into a downloadable JSON backup payload.
 */
export async function exportKnowledgeStoreJSON(): Promise<string> {
  const docs = await getKnowledgeDocuments();
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      documentsCount: docs.length,
      documents: docs,
    },
    null,
    2
  );
}

/**
 * Restores knowledge base documents from a JSON backup string.
 */
export async function importKnowledgeStoreJSON(jsonString: string): Promise<number> {
  if (!db.knowledgeDocuments) return 0;

  const data = JSON.parse(jsonString);
  const docs: KnowledgeDocumentRecord[] = Array.isArray(data) ? data : data.documents || [];

  let importedCount = 0;
  const now = Date.now();

  for (const d of docs) {
    if (d.title && d.content) {
      const newId = await db.knowledgeDocuments.add({
        title: d.title,
        category: d.category || 'عام',
        content: d.content,
        tags: d.tags || [],
        fileName: d.fileName,
        fileType: d.fileType || 'MANUAL',
        fileSize: d.fileSize,
        createdAt: d.createdAt || now,
        updatedAt: now,
      });
      const chunks = chunkTextSemantically(d.content, d.title, 200, 40);
      await storeDocumentChunksInDB(newId, chunks, d.tags || []);
      importedCount++;
    }
  }

  return importedCount;
}

/**
 * Retrieves aggregate statistical breakdown of knowledge base.
 */
export async function getKnowledgeBaseStats(): Promise<KnowledgeStoreStats> {
  const docs = await getKnowledgeDocuments();
  const catMap: Record<string, number> = {};
  const typeMap: Record<string, number> = {};

  let lastUpdated = 0;
  let totalChunks = 0;

  if (db.documentChunks) {
    totalChunks = await db.documentChunks.count();
  }

  docs.forEach(d => {
    catMap[d.category] = (catMap[d.category] || 0) + 1;
    const typeKey = d.fileType || 'MANUAL';
    typeMap[typeKey] = (typeMap[typeKey] || 0) + 1;
    if (d.updatedAt > lastUpdated) lastUpdated = d.updatedAt;
  });

  return {
    totalDocuments: docs.length,
    totalChunks,
    categories: Object.entries(catMap).map(([name, count]) => ({ name, count })),
    fileTypes: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    lastUpdated,
  };
}
