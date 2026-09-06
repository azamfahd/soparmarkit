import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  category: string;
  barcode?: string;
  unit?: string;
  supplier_id?: number;
  production_date?: string;
  expiration_date?: string;
}

export interface Supplier {
  id?: number;
  name: string;
  phone: string;
  balance: number;
  notes?: string;
}

export interface SupplierPayment {
  id?: number;
  supplier_id: number;
  amount: number;
  payment_date: string;
  notes?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  balance: number;
  notes?: string;
}

export interface Sale {
  id?: number;
  customer_id: number | null;
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  payment_type: 'cash' | 'debt';
  created_at: string;
  notes?: string;
  previous_balance?: number;
  new_balance?: number;
}

export interface SaleItem {
  id?: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price_at_sale: number;
}

export interface Debt {
  id?: number;
  customer_id: number;
  sale_id?: number;
  amount: number;
  type: 'purchase' | 'payment';
  created_at: string;
  notes?: string;
  previous_balance?: number;
  new_balance?: number;
}

export interface InventoryLog {
  id?: number;
  product_id: number;
  product_name?: string;
  old_quantity?: number;
  new_quantity?: number;
  change_amount: number;
  reason: string;
  type?: string;
  notes?: string;
  created_at: string;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: any;
}

export interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  created_at: string;
  reminder_date?: string | null;
  is_completed?: boolean;
  priority?: 'normal' | 'high' | 'info' | 'warning';
}

export interface SalesSettlement {
  id?: number;
  total_sales: number;
  delivered_amount: number;
  difference: number;
  created_at: string;
  notes?: string;
  cash_withdrawals?: number; // Added to store withdrawals of the cycle
}

export interface CashWithdrawal {
  id?: number;
  amount: number;
  by_whom: string;
  reason: string;
  created_at: string;
  is_repaid: boolean; // false if still due to be repaid by cashier, true if repaid
  repay_date?: string;
}

export interface Expense {
  id?: number;
  title: string;
  category: string; // e.g. rent, electricity, salaries, maintenance, supplies, transport, other
  amount: number;
  date: string;
  payment_method?: 'cash' | 'bank' | 'other';
  notes?: string;
  created_at: string;
}

export interface AIConversationRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIMessageRecord {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  intent?: string;
  evidence?: any;
  processingStages?: any;
  reasoningSummary?: string;
}

export interface KnowledgeDocumentRecord {
  id?: number;
  title: string;
  category: string;
  content: string;
  tags?: string[];
  embedding?: number[];
  fileName?: string;
  fileType?: 'TXT' | 'CSV' | 'JSON' | 'PDF' | 'DOCX' | 'MANUAL';
  fileSize?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentChunkRecord {
  id?: number;
  documentId: number;
  chunkIndex: number;
  sectionTitle?: string;
  content: string;
  cleanContent: string;
  wordCount: number;
  tags?: string[];
  embedding?: number[];
  createdAt: number;
}

export interface AIFeedbackRecord {
  id?: number;
  messageId: string;
  userQuery: string;
  responseAnswer: string;
  rating: 'THUMBS_UP' | 'THUMBS_DOWN';
  userComment?: string;
  intent?: string;
  timestamp: number;
}

export interface AITrainingRecord {
  id?: number;
  query: string;
  expectedIntent: string;
  expectedEntities?: string; // JSON string array of Entity
  notes?: string;
  createdAt: number;
}

export class GroceryDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  debts!: Table<Debt>;
  inventoryLogs!: Table<InventoryLog>;
  settings!: Table<AppSettings>;
  sync_queue!: Table<SyncQueueItem>;
  notes!: Table<Note>;
  salesSettlements!: Table<SalesSettlement>;
  cashWithdrawals!: Table<CashWithdrawal>;
  suppliers!: Table<Supplier>;
  supplierPayments!: Table<SupplierPayment>;
  aiConversations!: Table<AIConversationRecord>;
  aiMessages!: Table<AIMessageRecord>;
  knowledgeDocuments!: Table<KnowledgeDocumentRecord>;
  documentChunks!: Table<DocumentChunkRecord>;
  aiFeedback!: Table<AIFeedbackRecord>;
  aiTrainingData!: Table<AITrainingRecord>;
  expenses!: Table<Expense>;

  constructor() {
    super('GroceryDB');
    this.version(4).stores({
      products: '++id, name, category, stock_quantity',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp'
    });
    this.version(5).stores({
      products: '++id, name, category, stock_quantity, barcode',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp'
    });
    this.version(6).stores({
      products: '++id, name, category, stock_quantity, barcode',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed'
    });
    this.version(7).stores({
      products: '++id, name, category, stock_quantity, barcode',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at'
    });
    this.version(8).stores({
      products: '++id, name, category, stock_quantity, barcode',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid'
    });
    this.version(9).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date'
    });
    this.version(10).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id, expiration_date',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date'
    });
    this.version(11).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id, expiration_date',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date',
      aiConversations: 'id, createdAt, updatedAt',
      aiMessages: 'id, conversationId, timestamp, role'
    });
    this.version(12).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id, expiration_date',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date',
      aiConversations: 'id, createdAt, updatedAt',
      aiMessages: 'id, conversationId, timestamp, role',
      knowledgeDocuments: '++id, title, category, *tags, createdAt'
    });
    this.version(13).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id, expiration_date',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date',
      aiConversations: 'id, createdAt, updatedAt',
      aiMessages: 'id, conversationId, timestamp, role',
      knowledgeDocuments: '++id, title, category, *tags, createdAt',
      aiFeedback: '++id, messageId, rating, timestamp'
    });
    this.version(15).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id, expiration_date',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date',
      aiConversations: 'id, createdAt, updatedAt',
      aiMessages: 'id, conversationId, timestamp, role',
      knowledgeDocuments: '++id, title, category, *tags, createdAt',
      documentChunks: '++id, documentId, chunkIndex, *tags, createdAt',
      aiFeedback: '++id, messageId, rating, timestamp',
      aiTrainingData: '++id, query, expectedIntent, expectedEntities'
    });
    this.version(16).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id, expiration_date',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at, payment_type',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at, type',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date',
      aiConversations: 'id, createdAt, updatedAt',
      aiMessages: 'id, conversationId, timestamp, role',
      knowledgeDocuments: '++id, title, category, *tags, createdAt',
      documentChunks: '++id, documentId, chunkIndex, *tags, createdAt',
      aiFeedback: '++id, messageId, rating, timestamp',
      aiTrainingData: '++id, query, expectedIntent, expectedEntities'
    });
    this.version(17).stores({
      products: '++id, name, category, stock_quantity, barcode, supplier_id, expiration_date',
      customers: '++id, name, phone',
      sales: '++id, customer_id, created_at, payment_type',
      saleItems: '++id, sale_id, product_id',
      debts: '++id, customer_id, sale_id, created_at, type',
      inventoryLogs: '++id, product_id, created_at',
      settings: '++id, key',
      sync_queue: '++id, table, timestamp',
      notes: '++id, created_at, reminder_date, is_completed',
      salesSettlements: '++id, created_at',
      cashWithdrawals: '++id, created_at, is_repaid',
      suppliers: '++id, name, phone',
      supplierPayments: '++id, supplier_id, payment_date',
      aiConversations: 'id, createdAt, updatedAt',
      aiMessages: 'id, conversationId, timestamp, role',
      knowledgeDocuments: '++id, title, category, *tags, createdAt',
      documentChunks: '++id, documentId, chunkIndex, *tags, createdAt',
      aiFeedback: '++id, messageId, rating, timestamp',
      aiTrainingData: '++id, query, expectedIntent, expectedEntities',
      expenses: '++id, category, date, created_at'
    });
  }
}

export const db = new GroceryDatabase();

// Seed initial data if empty
export async function seedDatabase() {
  const isFirstRun = await db.settings.where('key').equals('isFirstRun').first();
  if (!isFirstRun) {
    await db.products.bulkAdd([
      { name: "أرز بسمتي 5كج", cost_price: 30, sale_price: 45, stock_quantity: 20, category: "مواد غذائية" },
      { name: "زيت طبخ 1.5لتر", cost_price: 12, sale_price: 18, stock_quantity: 15, category: "زيوت" },
      { name: "حليب طويل الأجل", cost_price: 3, sale_price: 5, stock_quantity: 4, category: "ألبان" },
      { name: "سكر ناعم 2كج", cost_price: 8, sale_price: 12, stock_quantity: 25, category: "مواد غذائية" },
      { name: "مكرونة 400جم", cost_price: 2, sale_price: 3.5, stock_quantity: 50, category: "مواد غذائية" },
      { name: "صابون يدين", cost_price: 5, sale_price: 8, stock_quantity: 12, category: "منظفات" },
      { name: "شاي أحمر 100 كيس", cost_price: 10, sale_price: 15, stock_quantity: 30, category: "مشروبات" },
      { name: "قهوة عربية 500جم", cost_price: 25, sale_price: 40, stock_quantity: 10, category: "مشروبات" },
      { name: "دقيق فاخر 1كج", cost_price: 4, sale_price: 6, stock_quantity: 40, category: "مواد غذائية" },
      { name: "صلصة طماطم", cost_price: 1.5, sale_price: 2.5, stock_quantity: 60, category: "مواد غذائية" }
    ]);

    await db.customers.bulkAdd([
      { name: "أحمد محمد", phone: "0501234567", balance: 150 },
      { name: "سارة علي", phone: "0557654321", balance: 0 },
      { name: "خالد عبدالله", phone: "0561112223", balance: 45 }
    ]);

    if (db.knowledgeDocuments) {
      const count = await db.knowledgeDocuments.count();
      if (count === 0) {
        const now = Date.now();
        await db.knowledgeDocuments.bulkAdd([
          {
            title: 'كيفية إضافة منتج جديد إلى النظام',
            category: 'دليل استخدام',
            content: 'لإضافة منتج جديد، اذهب إلى قائمة المنتجات والمخزون، اضغط على زر "إضافة منتج جديد"، ادخل الاسم، سعر التكلفة، سعر البيع، الكمية، والباركود ثم اضغط حفظ.',
            tags: ['إضافة', 'منتج', 'مخزون', 'طريقة'],
            createdAt: now,
            updatedAt: now,
          },
          {
            title: 'كيفية تسديد دين أو تسجيل دين لزبون',
            category: 'دليل استخدام',
            content: 'لتسجيل دين، اختر الدفع الآجل (دين) عند إتمام الفاتورة واختيار الزبون. لتسديد الدين، افتح قائمة العملاء، اختر الزبون المطلوب، واضغط "تسديد مبلغ" وادخل القيمة.',
            tags: ['دين', 'عملاء', 'زبون', 'تسديد'],
            createdAt: now,
            updatedAt: now,
          },
          {
            title: 'طريقة طباعة الفواتير وكشوفات الحساب',
            category: 'دليل استخدام',
            content: 'يمكنك طباعة الفاتورة فور إتمام البيع عبر زر الطباعة، أو تصدير كشف حساب زبون أو مورد إلى ملف PDF بضغط زر "تصدير كشف حساب".',
            tags: ['طباعة', 'فاتورة', 'كشف حساب', 'PDF'],
            createdAt: now,
            updatedAt: now,
          },
          {
            title: 'سياسة إرجاع واستبدال البضائع',
            category: 'سياسة',
            content: 'يمكن للعميل إرجاع البضائع السليمة خلال 3 أيام من تاريخ الشراء بشرط وجود الفاتورة الأصلية وأن تكون السلعة في حالتها الأصلية.',
            tags: ['إرجاع', 'استبدال', 'سياسة', 'فاتورة'],
            createdAt: now,
            updatedAt: now,
          },
        ]);
      }
    }
    
    await db.settings.add({ key: 'isFirstRun', value: false });
  }
}
