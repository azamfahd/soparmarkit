import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from '../hooks/useLiveQuery';
import { db } from '../db';
import { processUserQuery } from '../services/ai/aiRouter';
import { preloadTrainingData } from '../services/ai/engine/trainingManager';
import VisualModelsExtension from './VisualModelsExtension';
import { SmartAdvisorModal } from './modals/SmartAdvisorModal';
import { DailyLogModal } from './modals/DailyLogModal';
import { CustomerReceivablesModal } from './modals/CustomerReceivablesModal';
import { AnomalyReviewModal } from './modals/AnomalyReviewModal';
import { motion, AnimatePresence } from 'motion/react';
import html2pdf from 'html2pdf.js';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Award, 
  ArrowLeft, 
  Calendar, 
  Sparkles,
  BarChart3,
  Percent,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  FileText,
  Filter,
  X,
  Database,
  Wallet,
  Send,
  MessageSquare,
  Globe,
  WifiOff,
  Brain,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Shield,
  Lock,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Package,
  Briefcase,
  Phone,
  Building2,
  Truck,
  CreditCard,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Tag,
  History,
  PackagePlus,
  PackageMinus,
  ArrowUpDown,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

// Arabic translation and formatting helper for inventory log reasons
const getInventoryLogReasonArabic = (reason?: string, changeAmount?: number, notes?: string): string => {
  if (!reason) return 'تعديل مخزني';
  const r = reason.trim().toLowerCase();
  
  if (r === 'manual_update') {
    if (changeAmount !== undefined && changeAmount < 0) return 'سحب يدوي من المخزن';
    if (changeAmount !== undefined && changeAmount > 0) return 'توريد / إضافة كمية يدوية';
    return 'تعديل وتحديث بيانات الصنف';
  }
  if (r === 'manual_withdraw' || r === 'withdraw') return 'سحب كمية من المخزن';
  if (r === 'initial' || r === 'initial_stock') return 'رصيد افتتاحي للمخزون';
  if (r === 'new_product') return 'إضافة صنف جديد ورصيد تأسيسي';
  if (r === 'edit_product' || r === 'update_product') return 'تعديل بيانات وأسعار الصنف';
  if (r === 'delete_product') return 'حذف الصنف من النظام';
  if (r === 'sale') return 'فاتورة مبيعات';
  if (r === 'refund' || r === 'return') return 'مرتجع مبيعات';
  if (r === 'adjustment') return 'تسوية جردية';
  if (r === 'damage') return 'توالف وخسائر مخزنية';

  return reason;
};

interface SmartAnalyticsProps {
  currency: string;
  formatPrice: (price: number) => string;
  onGoBack: () => void;
}

interface QuickQuestionItem {
  id: string;
  category: 'profit_sales' | 'debts_customers' | 'inventory_stock' | 'suppliers_purchases' | 'cash_expenses' | 'reports_forecasts' | 'system_knowledge';
  question: string;
  shortTitle: string;
  description: string;
  icon: string;
  badge: string;
  themeColor: 'emerald' | 'rose' | 'amber' | 'sky' | 'indigo' | 'purple' | 'teal';
}

const QUICK_QUESTION_CATEGORIES = [
  { id: 'all', name: 'الكل ✨', icon: '✨' },
  { id: 'system_knowledge', name: 'أقسام وشاشات النظام 🧭', icon: '🧭' },
  { id: 'profit_sales', name: 'الأرباح والمبيعات 📈', icon: '📈' },
  { id: 'debts_customers', name: 'الديون والعملاء 👥', icon: '👥' },
  { id: 'inventory_stock', name: 'المخزون والنواقص 📦', icon: '📦' },
  { id: 'suppliers_purchases', name: 'الموردين والمشتريات 🏬', icon: '🏬' },
  { id: 'cash_expenses', name: 'الصندوق والمصاريف 💵', icon: '💵' },
  { id: 'reports_forecasts', name: 'التقارير والتوقعات 🔮', icon: '🔮' },
];

const COMPREHENSIVE_QUICK_QUESTIONS: QuickQuestionItem[] = [
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

// Interactive Multi-Stage Processing Visualization Widget
const MessageStagesWidget = ({ stages }: { stages: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!stages || stages.length === 0) return null;

  return (
    <div className="mt-3 mb-1 bg-gradient-to-br from-slate-950/90 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-2.5 text-right shadow-md backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between text-[11px] font-black text-indigo-200 hover:text-white transition-colors cursor-pointer py-1 px-2"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-500/25 border border-indigo-400/30 text-amber-300 rounded-lg shrink-0 shadow-2xs">
            <Brain className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="font-extrabold text-xs">مراحل التدقيق والتفكير المحاسبي ({stages.length} مراحل)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-black">
            مكتمل 100%
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-300' : 'text-slate-400'}`} />
        </div>
      </button>

      {isOpen && (
        <div className="mt-2.5 pt-2.5 border-t border-indigo-500/20 space-y-2 text-[10px]">
          {stages.map((stg: any, i: number) => (
            <div key={`stage-item-${stg.stageNumber || i}-${i}`} className="bg-slate-900/95 border border-indigo-900/40 rounded-xl p-2.5 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-black text-amber-300 flex items-center gap-1.5 text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  المرحلة {stg.stageNumber}: {stg.title}
                </span>
                {stg.badge && (
                  <span className="text-[9px] bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-700/50 font-mono font-black">
                    {stg.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed">{stg.description}</p>
              {stg.details && (
                <div className="bg-slate-950/90 p-2 rounded-lg text-[9.5px] font-mono text-indigo-200 border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                  {stg.details}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};




export default function SmartAnalytics
({ currency, formatPrice, onGoBack }: SmartAnalyticsProps) {
  // --- State for filter controls ---
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'month' | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');

  // --- Interactive tabs inside Trends and Liquidity section ---
  const [trendChartType, setTrendChartType] = useState<'sales_profit' | 'cash_flow'>('sales_profit');
  const [liquidityDonutType, setLiquidityDonutType] = useState<'revenue_mix' | 'liquidity_allocation'>('revenue_mix');

  // --- Interactive Ledger explorer category ---
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);
  const [showCustomerReceivablesModal, setShowCustomerReceivablesModal] = useState(false);

  // --- Accordion collapse states & Modals ---
  const [isOverviewOpen, setIsOverviewOpen] = useState(true);
  const [isTrendsAndLiquidityOpen, setIsTrendsAndLiquidityOpen] = useState(true);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('all');
  const [quickQuestionFilter, setQuickQuestionFilter] = useState<string>('');
  const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [isSmartAdvisorModalOpen, setIsSmartAdvisorModalOpen] = useState(false);
  const [advisorInitialQuery, setAdvisorInitialQuery] = useState<string | null>(null);
  const [learningRefreshKey, setLearningRefreshKey] = useState(0);
  const [anomalyModalType, setAnomalyModalType] = useState<'withdrawals' | 'odd_hours_sales' | 'pricing' | null>(null);
  const [resolvedAnomalies, setResolvedAnomalies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smart_resolved_anomalies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleResolveAnomaly = (key: string) => {
    setResolvedAnomalies(prev => {
      const next = Array.from(new Set([...prev, key]));
      try {
        localStorage.setItem('smart_resolved_anomalies', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // --- Search keys within lists ---
  const [activeHubTab, setActiveHubTab] = useState<'all' | 'sales' | 'inventory' | 'customers' | 'cashflow' | 'suppliers'>('all');
  const [dailySearchKey, setDailySearchKey] = useState('');
  const [customerSearchKey, setCustomerSearchKey] = useState('');
  const [supplierSearchKey, setSupplierSearchKey] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all'); // 'all' or supplier.id
  const [supplierFilterType, setSupplierFilterType] = useState<'all' | 'due' | 'settled'>('all');
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState<any | null>(null);
  const [supplierDetailsTab, setSupplierDetailsTab] = useState<'overview' | 'products' | 'inventory_logs' | 'payments'>('overview');
  const [supplierProductSearch, setSupplierProductSearch] = useState('');
  const [supplierLogSearch, setSupplierLogSearch] = useState('');
  const [supplierLogTypeFilter, setSupplierLogTypeFilter] = useState<'all' | 'additions' | 'withdrawals' | 'updates'>('all');

  // --- Subscribing to live DB data ---
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const debts = useLiveQuery(() => db.debts.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers?.toArray() || Promise.resolve([])) || [];
  const supplierPayments = useLiveQuery(() => db.supplierPayments?.toArray() || Promise.resolve([])) || [];
  const salesSettlements = useLiveQuery(() => db.salesSettlements?.toArray() || Promise.resolve([])) || [];
  const cashWithdrawals = useLiveQuery(() => db.cashWithdrawals?.toArray() || Promise.resolve([])) || [];
  const inventoryLogs = useLiveQuery(() => db.inventoryLogs?.toArray() || Promise.resolve([])) || [];
  const storeNameSetting = useLiveQuery(() => db.settings.where('key').equals('storeName').first());
  
  const storeName = storeNameSetting?.value || 'المخزن الذكي';

  // --- AI Smart Assistant State (100% Offline Local Machine Learning Engine) ---
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    preloadTrainingData();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);const recordQueryCategory = (category: 'sales' | 'inventory' | 'debt' | 'cash' | 'advice') => {
    const savedStateStr = localStorage.getItem('smart_analytics_learning_v1');
    const state = savedStateStr ? JSON.parse(savedStateStr) : {
      thumbsUp: 0,
      thumbsDown: 0,
      queriesProcessed: 0,
      mostQueriedCategory: 'sales',
      categoryScores: { sales: 0, inventory: 0, debt: 0, cash: 0, advice: 0 }
    };

    state.queriesProcessed = (state.queriesProcessed || 0) + 1;
    if (!state.categoryScores) {
      state.categoryScores = { sales: 0, inventory: 0, debt: 0, cash: 0, advice: 0 };
    }
    state.categoryScores[category] = (state.categoryScores[category] || 0) + 1;

    // Determine highest scored category
    let bestCat = 'sales';
    let maxScore = -1;
    Object.entries(state.categoryScores).forEach(([cat, val]) => {
      if ((val as number) > maxScore) {
        maxScore = val as number;
        bestCat = cat;
      }
    });
    state.mostQueriedCategory = bestCat;

    localStorage.setItem('smart_analytics_learning_v1', JSON.stringify(state));
    setLearningRefreshKey(prev => prev + 1);
  };

  const handleFeedback = async (msgId: string, isPositive: boolean, userQueryText: string, answerText: string) => {
    const savedStateStr = localStorage.getItem('smart_analytics_learning_v1');
    const state = savedStateStr ? JSON.parse(savedStateStr) : {
      thumbsUp: 0,
      thumbsDown: 0,
      queriesProcessed: 0,
      mostQueriedCategory: 'sales',
      categoryScores: { sales: 0, inventory: 0, debt: 0, cash: 0, advice: 0 }
    };

    if (isPositive) {
      state.thumbsUp = (state.thumbsUp || 0) + 1;
    } else {
      state.thumbsDown = (state.thumbsDown || 0) + 1;
    }

    localStorage.setItem('smart_analytics_learning_v1', JSON.stringify(state));
    setLearningRefreshKey(prev => prev + 1);

    try {
      const { submitAIFeedback } = await import('../services/ai/feedback');
      await submitAIFeedback({
        messageId: msgId,
        userQuery: userQueryText || 'استعلام مباشر من المحادثة',
        responseAnswer: answerText,
        rating: isPositive ? 'THUMBS_UP' : 'THUMBS_DOWN',
        intent: 'CONVERSATION_CHAT'
      });
    } catch (err) {
      console.warn('Failed to save AI feedback to database:', err);
    }
  };

  

  // Map products of shop for easy retrieval
  const productMap = useMemo(() => {
    const map = new Map<number, typeof products[0]>();
    products.forEach(p => {
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  // List of unique categories for filters
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // List of unique months available in sales data
  const availableMonthsList = useMemo(() => {
    const monthMap = new Map<string, string>();
    sales.forEach(s => {
      if (s.created_at) {
        const monthKey = s.created_at.substring(0, 7); // 'YYYY-MM'
        if (monthKey && monthKey.length === 7) {
          const [y, m] = monthKey.split('-');
          const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
          const formatted = dateObj.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
          monthMap.set(monthKey, formatted);
        }
      }
    });
    return Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sales]);

  // Sub-filter calculation helper
  const filteredSalesData = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - 7);
    const startOf30Days = new Date(startOfDay);
    startOf30Days.setDate(startOfDay.getDate() - 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter sales based on Date Range or Specific Selected Month
    const matchingSales = sales.filter(s => {
      if (selectedMonth !== 'all') {
        return s.created_at && s.created_at.startsWith(selectedMonth);
      }
      const d = new Date(s.created_at);
      if (dateFilter === 'today') return d >= startOfDay;
      if (dateFilter === '7days') return d >= startOfWeek;
      if (dateFilter === '30days') return d >= startOf30Days;
      if (dateFilter === 'month') return d >= startOfMonth;
      return true; // all
    });

    // Sub-Filter matching customers if specified
    return matchingSales.filter(s => {
      if (selectedCustomer === 'all') return true;
      if (selectedCustomer === 'debtors') return s.payment_type === 'debt';
      if (selectedCustomer === 'cash') return s.payment_type === 'cash';
      return String(s.customer_id) === selectedCustomer;
    });
  }, [sales, dateFilter, selectedMonth, selectedCustomer]);

  // Filtered sale items helper
  const filteredSaleItemsData = useMemo(() => {
    const salesIds = new Set(filteredSalesData.map(s => s.id));
    return saleItems.filter(item => {
      const matchSale = salesIds.has(item.sale_id);
      if (!matchSale) return false;
      
      if (selectedProductCategory === 'all') return true;
      const product = productMap.get(item.product_id);
      return product?.category === selectedProductCategory;
    });
  }, [saleItems, filteredSalesData, selectedProductCategory, productMap]);

  // --- Dynamic calculations of High-level business KPIs ---
  const performanceKPIs = useMemo(() => {
    let salesTotal = 0;
    let costTotal = 0;
    let profitTotal = 0;
    let cashSalesTotal = 0;
    let debtSalesTotal = 0;
    let itemsCountTotal = 0;

    // We can compute numbers directly from matching sales
    filteredSalesData.forEach(sale => {
      salesTotal += sale.total_amount;
      if (sale.payment_type === 'cash') {
        cashSalesTotal += sale.total_amount;
      } else {
        debtSalesTotal += sale.total_amount;
      }
    });

    // Calculate actual cost & profit per sale item
    filteredSaleItemsData.forEach(item => {
      const product = productMap.get(item.product_id);
      itemsCountTotal += item.quantity;
      if (product) {
        const itemCost = product.cost_price * item.quantity;
        const itemProfit = (item.price_at_sale - product.cost_price) * item.quantity;
        costTotal += itemCost;
        profitTotal += itemProfit;
      } else {
        // Fallback average profit margin (25%) if product was deleted
        const fallbackCost = item.price_at_sale * item.quantity * 0.75;
        costTotal += fallbackCost;
        profitTotal += item.price_at_sale * item.quantity * 0.25;
      }
    });

    // Profit margin calculation %
    const profitMarginPercent = salesTotal > 0 ? (profitTotal / salesTotal) * 100 : 0;
    
    // Average order value
    const avgOrderValue = filteredSalesData.length > 0 ? salesTotal / filteredSalesData.length : 0;

    // Debt Recovery KPI calculation
    let totalPurchasedDebts = 0;
    let totalCollectedPayments = 0;

    debts.forEach(d => {
      const dDate = new Date(d.created_at);
      const isWithinDate = (() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') return dDate >= startOfDay;
        if (dateFilter === '7days') {
          const w = new Date(startOfDay); w.setDate(startOfDay.getDate() - 7);
          return dDate >= w;
        }
        if (dateFilter === '30days') {
          const m = new Date(startOfDay); m.setDate(startOfDay.getDate() - 30);
          return dDate >= m;
        }
        if (dateFilter === 'month') {
          const m = new Date(now.getFullYear(), now.getMonth(), 1);
          return dDate >= m;
        }
        return true;
      })();

      if (isWithinDate) {
        if (d.type === 'purchase') totalPurchasedDebts += d.amount;
        if (d.type === 'payment') totalCollectedPayments += d.amount;
      }
    });

    const debtRecoveryRate = totalPurchasedDebts > 0 
      ? Math.min(100, (totalCollectedPayments / totalPurchasedDebts) * 100) 
      : 100;

    // All-time totals to calculate the absolute current cash in drawer
    let allTimeCashSales = 0;
    sales.forEach(s => {
      if (s.payment_type === 'cash') allTimeCashSales += s.total_amount;
    });
    
    let allTimeDebtPayments = 0;
    debts.forEach(d => {
      if (d.type === 'payment') allTimeDebtPayments += d.amount;
    });
    
    let allTimeDelivered = 0;
    salesSettlements.forEach(s => {
      allTimeDelivered += s.delivered_amount;
    });
    
    let allTimeUnpaidWithdrawals = 0;
    cashWithdrawals.forEach(w => {
      if (!w.is_repaid) allTimeUnpaidWithdrawals += w.amount;
    });

    const absoluteActualCashInDrawer = Math.max(0, (allTimeCashSales + allTimeDebtPayments) - allTimeDelivered - allTimeUnpaidWithdrawals);

    // Period specific calculations for settlements and deficits
    let exactSettlementsCount = 0;
    let totalSettlements = 0;
    let totalDeficitAmount = 0;
    let totalSettledAmount = 0;

    salesSettlements.forEach(s => {
      const sDate = new Date(s.created_at);
      const isWithinDate = (() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') return sDate >= startOfDay;
        if (dateFilter === '7days') {
          const w = new Date(startOfDay); w.setDate(startOfDay.getDate() - 7);
          return sDate >= w;
        }
        if (dateFilter === '30days') {
          const m = new Date(startOfDay); m.setDate(startOfDay.getDate() - 30);
          return sDate >= m;
        }
        if (dateFilter === 'month') {
          const m = new Date(now.getFullYear(), now.getMonth(), 1);
          return sDate >= m;
        }
        return true;
      })();

      if (isWithinDate) {
        totalSettledAmount += s.delivered_amount;
        totalSettlements++;
        if (s.difference === 0) {
          exactSettlementsCount++;
        } else if (s.difference < 0) {
          totalDeficitAmount += Math.abs(s.difference);
        }
      }
    });

    // Withdrawal calculation
    let totalWithdrawals = 0;
    cashWithdrawals.forEach(w => {
      const wDate = new Date(w.created_at);
      const isWithinDate = (() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') return wDate >= startOfDay;
        if (dateFilter === '7days') {
          const w = new Date(startOfDay); w.setDate(startOfDay.getDate() - 7);
          return wDate >= w;
        }
        if (dateFilter === '30days') {
          const m = new Date(startOfDay); m.setDate(startOfDay.getDate() - 30);
          return wDate >= m;
        }
        if (dateFilter === 'month') {
          const m = new Date(now.getFullYear(), now.getMonth(), 1);
          return wDate >= m;
        }
        return true;
      })();
      if (isWithinDate) totalWithdrawals += w.amount;
    });

    const boxMatchingScore = totalSettlements > 0 
      ? (exactSettlementsCount / totalSettlements) * 100 
      : 100;

    return {
      salesTotal,
      costTotal,
      profitTotal,
      profitMarginPercent,
      cashSalesTotal,
      debtSalesTotal,
      itemsCountTotal,
      avgOrderValue,
      totalPurchasedDebts,
      totalCollectedPayments,
      debtRecoveryRate,
      boxMatchingScore,
      totalDeficitAmount,
      totalWithdrawals,
      absoluteActualCashInDrawer,
      totalSettledAmount,
      receivedCashInPeriod: cashSalesTotal + totalCollectedPayments,
      transactionsCount: filteredSalesData.length
    };
  }, [filteredSalesData, filteredSaleItemsData, debts, salesSettlements, cashWithdrawals, sales, dateFilter, productMap]);

  // --- Real-time Daily Sales Tabular Aggregation ---
  const dailySalesBreakdown = useMemo(() => {
    const dailyMap: { [key: string]: { dateStr: string, rawDate: Date, totalAmount: number, cashAmount: number, debtAmount: number, profit: number, cost: number, count: number } } = {};
    
    filteredSalesData.forEach(sale => {
      const d = new Date(sale.created_at);
      const dayKey = d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          dateStr: dayKey,
          rawDate: d,
          totalAmount: 0,
          cashAmount: 0,
          debtAmount: 0,
          profit: 0,
          cost: 0,
          count: 0
        };
      }
      
      dailyMap[dayKey].totalAmount += sale.total_amount;
      if (sale.payment_type === 'cash') {
        dailyMap[dayKey].cashAmount += sale.total_amount;
      } else {
        dailyMap[dayKey].debtAmount += sale.total_amount;
      }
      dailyMap[dayKey].count += 1;
    });

    // Compute detailed profit for each day
    filteredSaleItemsData.forEach(item => {
      const sale = filteredSalesData.find(s => s.id === item.sale_id);
      if (sale) {
        const d = new Date(sale.created_at);
        const dayKey = d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
        
        const product = productMap.get(item.product_id);
        const itemProfit = product 
          ? (item.price_at_sale - product.cost_price) * item.quantity
          : item.price_at_sale * item.quantity * 0.25;

        const itemCost = product
          ? product.cost_price * item.quantity
          : item.price_at_sale * item.quantity * 0.75;
        
        if (dailyMap[dayKey]) {
          dailyMap[dayKey].profit += itemProfit;
          dailyMap[dayKey].cost += itemCost;
        }
      }
    });

    return Object.values(dailyMap).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [filteredSalesData, filteredSaleItemsData, productMap]);

  // --- Interactive Customer/Person Specific Sales Breakdown ---
  const customerSalesBreakdown = useMemo(() => {
    const customerMap: { [key: string]: { id: string, name: string, totalAmount: number, cashAmount: number, debtAmount: number, profit: number, count: number, balance: number } } = {};
    
    filteredSalesData.forEach(sale => {
      let cId = sale.customer_id ? String(sale.customer_id) : 'cash_only';
      let cName = 'زبون نقدي عام (بدون حساب)';
      let cBalance = 0;
      
      if (sale.customer_id) {
        const matchingCust = customers.find(c => c.id === sale.customer_id);
        if (matchingCust) {
          cName = matchingCust.name;
          cBalance = matchingCust.balance;
        } else {
          cName = `عميل ممسوح (معرف #${sale.customer_id})`;
        }
      }

      if (!customerMap[cId]) {
        customerMap[cId] = {
          id: cId,
          name: cName,
          totalAmount: 0,
          cashAmount: 0,
          debtAmount: 0,
          profit: 0,
          count: 0,
          balance: cBalance
        };
      }

      customerMap[cId].totalAmount += sale.total_amount;
      if (sale.payment_type === 'cash') {
        customerMap[cId].cashAmount += sale.total_amount;
      } else {
        customerMap[cId].debtAmount += sale.total_amount;
      }
      customerMap[cId].count += 1;
    });

    // Extract profits per customer
    filteredSaleItemsData.forEach(item => {
      const sale = filteredSalesData.find(s => s.id === item.sale_id);
      if (sale) {
        let cId = sale.customer_id ? String(sale.customer_id) : 'cash_only';
        const product = productMap.get(item.product_id);
        const profit = product 
          ? (item.price_at_sale - product.cost_price) * item.quantity
          : item.price_at_sale * item.quantity * 0.25;
        
        if (customerMap[cId]) {
          customerMap[cId].profit += profit;
        }
      }
    });

    return Object.values(customerMap).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredSalesData, filteredSaleItemsData, customers, productMap]);

  // --- Filtering Arrays base on dynamic search keys ---
  const searchedDailySales = useMemo(() => {
    if (!dailySearchKey) return dailySalesBreakdown;
    return dailySalesBreakdown.filter(day => day.dateStr.includes(dailySearchKey));
  }, [dailySalesBreakdown, dailySearchKey]);

  const searchedCustomerSales = useMemo(() => {
    if (!customerSearchKey) return customerSalesBreakdown;
    return customerSalesBreakdown.filter(cust => cust.name.toLowerCase().includes(customerSearchKey.toLowerCase()));
  }, [customerSalesBreakdown, customerSearchKey]);

  // --- Inventory & Stock Real-time Statistics ---
  const inventoryStats = useMemo(() => {
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringSoonCount = 0;

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    products.forEach(p => {
      const qty = p.stock_quantity || 0;
      const cost = p.cost_price || 0;
      const sale = p.sale_price || 0;

      totalStockUnits += qty;
      totalCostValuation += qty * cost;
      totalRetailValuation += qty * sale;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= 5) {
        lowStockCount++;
      }

      if (p.expiration_date) {
        const expTime = new Date(p.expiration_date).getTime();
        if (expTime > now && expTime - now <= thirtyDaysMs) {
          expiringSoonCount++;
        }
      }
    });

    const potentialProfit = Math.max(0, totalRetailValuation - totalCostValuation);
    const potentialMargin = totalRetailValuation > 0 ? (potentialProfit / totalRetailValuation) * 100 : 0;

    return {
      totalCostValuation,
      totalRetailValuation,
      potentialProfit,
      potentialMargin,
      totalStockUnits,
      totalProductsCount: products.length,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount
    };
  }, [products]);

  // --- Suppliers & Payables Comprehensive Analytics ---
  const supplierAnalytics = useMemo(() => {
    let totalSuppliersDebt = 0;
    let totalSuppliersPaid = 0;
    let suppliersWithDebtCount = 0;

    suppliers.forEach(s => {
      const bal = s.balance || 0;
      if (bal > 0) {
        totalSuppliersDebt += bal;
        suppliersWithDebtCount++;
      }
    });

    supplierPayments.forEach(p => {
      totalSuppliersPaid += (p.amount || 0);
    });

    // Compute for every supplier
    const supplierList = suppliers.map(s => {
      const supplierProducts = products.filter(p => p.supplier_id === s.id);
      const supplierProductIds = new Set(supplierProducts.map(p => p.id));
      const supplierStock = supplierProducts.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
      const supplierInventoryCostValue = supplierProducts.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0);
      const supplierInventoryRetailValue = supplierProducts.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.sale_price || 0)), 0);
      
      const payments = supplierPayments.filter(p => p.supplier_id === s.id);
      const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
      
      let totalSoldQuantity = 0;
      let totalSoldValue = 0;
      let totalSoldCostValue = 0;
      saleItems.forEach(item => {
        if (supplierProductIds.has(item.product_id)) {
          totalSoldQuantity += item.quantity;
          totalSoldValue += item.price_at_sale * item.quantity;
          const prod = productMap.get(item.product_id);
          const unitCost = prod ? prod.cost_price : (item.price_at_sale * 0.75);
          totalSoldCostValue += unitCost * item.quantity;
        }
      });

      // Supplier inventory updates and movements (excluding single retail sales transactions as requested)
      const supplierLogs = inventoryLogs
        .filter(log => {
          if (!supplierProductIds.has(log.product_id)) return false;
          const r = (log.reason || '').toLowerCase();
          const t = (log.type || '').toLowerCase();
          if (r === 'sale' || r === 'بيع' || r === 'مبيعات' || t === 'sale') return false;
          return true;
        })
        .map(log => {
          const prod = productMap.get(log.product_id);
          return {
            ...log,
            productName: log.product_name || prod?.name || `منتج #${log.product_id}`,
            barcode: prod?.barcode || '',
            category: prod?.category || 'عام',
            costPrice: prod?.cost_price || 0,
            salePrice: prod?.sale_price || 0,
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Total supplier capital entitlement = current stock at cost + sold items at cost
      const totalInventoryAndSoldCost = supplierInventoryCostValue + totalSoldCostValue;
      
      // Total required before payments = Balance + Total Paid
      const totalRequiredBeforeSettlement = (s.balance || 0) + totalPaid;

      const lastPayment = payments.length > 0 
        ? payments.slice().sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
        : null;

      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        balance: s.balance || 0,
        productsCount: supplierProducts.length,
        products: supplierProducts,
        inventoryStock: supplierStock,
        inventoryCostValue: supplierInventoryCostValue,
        inventoryRetailValue: supplierInventoryRetailValue,
        totalSoldCostValue,
        totalInventoryAndSoldCost,
        totalRequiredBeforeSettlement,
        payments: payments.slice().sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
        totalPaid,
        lastPaymentDate: lastPayment ? lastPayment.payment_date : null,
        totalSoldQuantity,
        totalSoldValue,
        inventoryLogs: supplierLogs
      };
    }).sort((a, b) => (b.balance || 0) - (a.balance || 0));

    // Global Aggregate
    const totalInventoryCostAll = supplierList.reduce((acc, s) => acc + s.inventoryCostValue, 0);
    const totalSoldCostAll = supplierList.reduce((acc, s) => acc + s.totalSoldCostValue, 0);
    const totalInventoryAndSoldCostAll = totalInventoryCostAll + totalSoldCostAll;
    const totalRequiredBeforeSettlementAll = totalSuppliersDebt + totalSuppliersPaid;

    // Selected supplier view
    const selectedSupplierObj = selectedSupplierFilter === 'all' 
      ? null 
      : supplierList.find(s => String(s.id) === String(selectedSupplierFilter)) || null;

    const activeViewMetrics = selectedSupplierObj ? {
      name: selectedSupplierObj.name,
      isSpecific: true,
      currentBalance: selectedSupplierObj.balance,
      totalPaid: selectedSupplierObj.totalPaid,
      totalRequiredBeforeSettlement: selectedSupplierObj.totalRequiredBeforeSettlement,
      inventoryCostValue: selectedSupplierObj.inventoryCostValue,
      soldCostValue: selectedSupplierObj.totalSoldCostValue,
      totalInventoryAndSoldCost: selectedSupplierObj.totalInventoryAndSoldCost,
      productsCount: selectedSupplierObj.productsCount,
      paymentsCount: selectedSupplierObj.payments.length
    } : {
      name: 'جميع الموردين',
      isSpecific: false,
      currentBalance: totalSuppliersDebt,
      totalPaid: totalSuppliersPaid,
      totalRequiredBeforeSettlement: totalRequiredBeforeSettlementAll,
      inventoryCostValue: totalInventoryCostAll,
      soldCostValue: totalSoldCostAll,
      totalInventoryAndSoldCost: totalInventoryAndSoldCostAll,
      productsCount: products.filter(p => p.supplier_id != null).length,
      paymentsCount: supplierPayments.length
    };

    return {
      totalSuppliersDebt,
      totalSuppliersPaid,
      suppliersWithDebtCount,
      totalSuppliersCount: suppliers.length,
      supplierList,
      totalInventoryCostAll,
      totalSoldCostAll,
      totalInventoryAndSoldCostAll,
      totalRequiredBeforeSettlementAll,
      activeViewMetrics,
      selectedSupplierObj
    };
  }, [suppliers, products, supplierPayments, saleItems, productMap, selectedSupplierFilter, inventoryLogs]);

  // Filtered Suppliers for directory search and category
  const filteredSupplierList = useMemo(() => {
    return supplierAnalytics.supplierList.filter(s => {
      const matchSearch = !supplierSearchKey.trim() || 
        s.name.toLowerCase().includes(supplierSearchKey.toLowerCase()) || 
        (s.phone && s.phone.includes(supplierSearchKey));
      
      if (!matchSearch) return false;

      if (supplierFilterType === 'due') return s.balance > 0;
      if (supplierFilterType === 'settled') return s.balance <= 0;
      return true;
    });
  }, [supplierAnalytics.supplierList, supplierSearchKey, supplierFilterType]);

  // Active supplier details for modal
  const activeSupplierDetails = useMemo(() => {
    if (!selectedSupplierForDetails) return null;
    return supplierAnalytics.supplierList.find(s => s.id === selectedSupplierForDetails.id) || selectedSupplierForDetails;
  }, [selectedSupplierForDetails, supplierAnalytics.supplierList]);

  // Filtered supplier inventory logs
  const filteredSupplierLogs = useMemo(() => {
    if (!activeSupplierDetails) return [];
    const logs = activeSupplierDetails.inventoryLogs || [];
    return logs.filter((log: any) => {
      const arabicReason = getInventoryLogReasonArabic(log.reason, log.change_amount, log.notes);
      
      // Search filter
      const matchesSearch = !supplierLogSearch.trim() || 
        (log.productName && log.productName.toLowerCase().includes(supplierLogSearch.toLowerCase())) ||
        (arabicReason && arabicReason.toLowerCase().includes(supplierLogSearch.toLowerCase())) ||
        (log.reason && log.reason.toLowerCase().includes(supplierLogSearch.toLowerCase())) ||
        (log.notes && log.notes.toLowerCase().includes(supplierLogSearch.toLowerCase())) ||
        (log.barcode && log.barcode.includes(supplierLogSearch));

      if (!matchesSearch) return false;

      // Type filter
      const change = log.change_amount || 0;
      const isInitial = log.reason && (log.reason.includes('افتتاحي') || log.reason.includes('إضافة أولى') || log.reason.includes('جديد') || log.reason === 'initial_stock' || log.reason === 'new_product' || log.reason === 'initial');
      
      if (supplierLogTypeFilter === 'additions') {
        return change > 0;
      }
      if (supplierLogTypeFilter === 'withdrawals') {
        return change < 0 || log.reason === 'manual_withdraw';
      }
      if (supplierLogTypeFilter === 'updates') {
        return change === 0 || isInitial || (log.reason && (log.reason.includes('تحديث') || log.reason.includes('تعديل') || log.reason === 'manual_update' || log.reason === 'edit_product'));
      }
      return true;
    });
  }, [activeSupplierDetails, supplierLogSearch, supplierLogTypeFilter]);

  // --- Customers & Debts Overview Analytics ---
  const customerAnalytics = useMemo(() => {
    let totalCustomerDebts = 0;
    let debtorsCount = 0;

    customers.forEach(c => {
      const bal = c.balance || 0;
      if (bal > 0) {
        totalCustomerDebts += bal;
        debtorsCount++;
      }
    });

    return {
      totalCustomerDebts,
      debtorsCount,
      totalCustomersCount: customers.length
    };
  }, [customers]);

  // --- Chart 1: Sales and Profits Trend (Grouped by Month uniquely to prevent duplication like 03/26, 05/26, 07/26) ---
  const salesAndProfitTrendChart = useMemo(() => {
    const monthlyMap: { [key: string]: { dateStr: string, rawDate: Date, totalAmount: number, profit: number, count: number } } = {};

    filteredSalesData.forEach(sale => {
      const d = new Date(sale.created_at);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const displayMonth = `${String(month).padStart(2, '0')}/${String(year).slice(2)}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          dateStr: displayMonth,
          rawDate: new Date(year, month - 1, 1),
          totalAmount: 0,
          profit: 0,
          count: 0
        };
      }

      monthlyMap[monthKey].totalAmount += sale.total_amount;
      monthlyMap[monthKey].count += 1;
    });

    // Compute detailed profit for each month
    filteredSaleItemsData.forEach(item => {
      const sale = filteredSalesData.find(s => s.id === item.sale_id);
      if (sale) {
        const d = new Date(sale.created_at);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;

        const product = productMap.get(item.product_id);
        const itemProfit = product 
          ? (item.price_at_sale - product.cost_price) * item.quantity
          : item.price_at_sale * item.quantity * 0.25;

        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].profit += itemProfit;
        }
      }
    });

    const sorted = Object.values(monthlyMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    return sorted.slice(-12);
  }, [filteredSalesData, filteredSaleItemsData, productMap]);

  // --- Chart 1B: Live Integrated Cashflow (Receipts vs Outlays Timeline) ---
  const unifiedCashflowTimeline = useMemo(() => {
    const dailyMap: { 
      [key: string]: { 
        dateStr: string; 
        rawDate: Date; 
        moneyIn: number; // Cash sales + debt payments (Money added to drawer)
        moneyOut: number; // Self-withdrawals + settlements (Money removed from drawer)
        netRegisterChange: number; 
      } 
    } = {};

    const addToMap = (dateStr: string, rawDate: Date, inVal: number, outVal: number) => {
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          dateStr,
          rawDate,
          moneyIn: 0,
          moneyOut: 0,
          netRegisterChange: 0
        };
      }
      dailyMap[dateStr].moneyIn += inVal;
      dailyMap[dateStr].moneyOut += outVal;
      dailyMap[dateStr].netRegisterChange = dailyMap[dateStr].moneyIn - dailyMap[dateStr].moneyOut;
    };

    // 1. Physical Direct Cash Sales
    sales.forEach(s => {
      if (s.payment_type === 'cash') {
        const d = new Date(s.created_at);
        const dayKey = d.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
        addToMap(dayKey, d, s.total_amount, 0);
      }
    });

    // 2. Debts Payments Received (Customer paid back debt)
    debts.forEach(d => {
      if (d.type === 'payment') {
        const date = new Date(d.created_at);
        const dayKey = date.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
        addToMap(dayKey, date, d.amount, 0);
      }
    });

    // 3. Cash Withdrawals / Expenses (Outflow)
    cashWithdrawals.forEach(w => {
      const date = new Date(w.created_at);
      const dayKey = date.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
      addToMap(dayKey, date, 0, w.amount);
    });

    // 4. Sales Settlements (Manual handovers to the owner / business manager)
    salesSettlements.forEach(s => {
      const date = new Date(s.created_at);
      const dayKey = date.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
      addToMap(dayKey, date, 0, s.delivered_amount);
    });

    // Sort chronologically and apply date range mapping
    const sorted = Object.values(dailyMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - 7);
    const startOf30Days = new Date(startOfDay);
    startOf30Days.setDate(startOfDay.getDate() - 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sorted.filter(day => {
      const d = day.rawDate;
      if (dateFilter === 'today') return d >= startOfDay;
      if (dateFilter === '7days') return d >= startOfWeek;
      if (dateFilter === '30days') return d >= startOf30Days;
      if (dateFilter === 'month') return d >= startOfMonth;
      return true;
    }).slice(-12); // Present last 12 active days
  }, [sales, debts, cashWithdrawals, salesSettlements, dateFilter]);

  // --- Chart 2: Top Selling Products with Revenue & Profit Contributions ---
  const topProductsChart = useMemo(() => {
    const itemTotals: { [key: number]: { id: number, name: string, quantity: number, revenue: number, profit: number } } = {};

    filteredSaleItemsData.forEach(item => {
      const product = productMap.get(item.product_id);
      const name = product ? product.name : `منتج ممسوح ID: ${item.product_id}`;
      const profit = product 
        ? (item.price_at_sale - product.cost_price) * item.quantity
        : item.price_at_sale * item.quantity * 0.25;

      if (!itemTotals[item.product_id]) {
        itemTotals[item.product_id] = {
          id: item.product_id,
          name,
          quantity: 0,
          revenue: 0,
          profit: 0
        };
      }
      itemTotals[item.product_id].quantity += item.quantity;
      itemTotals[item.product_id].revenue += item.price_at_sale * item.quantity;
      itemTotals[item.product_id].profit += profit;
    });

    return Object.values(itemTotals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Pick top 5 products
  }, [filteredSaleItemsData, productMap]);

  // --- Chart 3: Sales Distribution by Categories ---
  const categorySalesChart = useMemo(() => {
    const catTotals: { [key: string]: { name: string, sales: number, profit: number } } = {};

    filteredSaleItemsData.forEach(item => {
      const product = productMap.get(item.product_id);
      const cat = product ? (product.category || 'عام') : 'عام';
      const profit = product 
        ? (item.price_at_sale - product.cost_price) * item.quantity
        : item.price_at_sale * item.quantity * 0.25;

      if (!catTotals[cat]) {
        catTotals[cat] = { name: cat, sales: 0, profit: 0 };
      }
      catTotals[cat].sales += item.price_at_sale * item.quantity;
      catTotals[cat].profit += profit;
    });

    return Object.values(catTotals).sort((a, b) => b.sales - a.sales);
  }, [filteredSaleItemsData, productMap]);

  // --- Automatic AI Insights Generation ---
  

  // --- Dynamic Professional PDF Report Generation ---
  const handleExportPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 35px; background: #ffffff; color: #0f172a; line-height: 1.6;">
        
        <!-- Header banner -->
        <div style="text-align: center; border-bottom: 3px double #6366f1; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0 0 5px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">تقرير تحليلي مالي متكامل للعمليات</h1>
          <h2 style="color: #475569; margin: 0 0 10px 0; font-size: 18px;">${storeName}</h2>
          <div style="font-size: 11px; color: #64748b; font-weight: bold; margin-top: 5px;">
            تاريخ إصدار التقرير: ${new Date().toLocaleString('ar-SA')} | نطاق البحث: ${
              dateFilter === 'today' ? 'اليوم الحالي' : 
              dateFilter === '7days' ? 'آخر 7 أيام' : 
              dateFilter === '30days' ? 'آخر 30 يوم' : 
              dateFilter === 'month' ? 'الشهر الجاري' : 'جميع السجلات المتوفرة'
            }
          </div>
        </div>

        <!-- Metric Scorecards (Grid layout) -->
        <div style="display: table; width: 100%; border-spacing: 12px; margin-bottom: 30px;">
          <div style="display: table-row;">
            
            <div style="display: table-cell; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: center; width: 25%;">
              <div style="font-size: 10px; color: #64748b; font-weight: 800; margin-bottom: 5px;">صافي القيمة الكلية للمبيعات</div>
              <div style="font-size: 16px; color: #4338ca; font-weight: 900; font-family: Courier, monospace;">${formatPrice(performanceKPIs.salesTotal)}</div>
              <div style="font-size: 9px; color: #94a3b8; font-weight: bold; margin-top: 4px;">فواتير الفترة: ${performanceKPIs.transactionsCount}</div>
            </div>

            <div style="display: table-cell; background: #edfcf2; border: 1px solid #bbf7d0; padding: 15px; border-radius: 12px; text-align: center; width: 25%;">
              <div style="font-size: 10px; color: #166534; font-weight: 800; margin-bottom: 5px;">أرباح مبيعات تقريبية</div>
              <div style="font-size: 16px; color: #15803d; font-weight: 900; font-family: Courier, monospace;">${formatPrice(performanceKPIs.profitTotal)}</div>
              <div style="font-size: 9px; color: #16a34a; font-weight: bold; margin-top: 4px;">صافي الهامش: ${performanceKPIs.profitMarginPercent.toFixed(1)}%</div>
            </div>

            <div style="display: table-cell; background: #faf5ff; border: 1px solid #f3e8ff; padding: 15px; border-radius: 12px; text-align: center; width: 25%;">
              <div style="font-size: 10px; color: #6b21a8; font-weight: 800; margin-bottom: 5px;">معدل سداد الذمم الجديدة</div>
              <div style="font-size: 16px; color: #7e22ce; font-weight: 900; font-family: Courier, monospace;">${performanceKPIs.debtRecoveryRate.toFixed(1)}%</div>
              <div style="font-size: 9px; color: #a855f7; font-weight: bold; margin-top: 4px;">التسديدات: ${formatPrice(performanceKPIs.totalCollectedPayments)}</div>
            </div>

            <div style="display: table-cell; background: #f0f9ff; border: 1px solid #e0f2fe; padding: 15px; border-radius: 12px; text-align: center; width: 25%;">
              <div style="font-size: 10px; color: #075985; font-weight: 800; margin-bottom: 5px;">مطابقة وتكامل الصندوق</div>
              <div style="font-size: 16px; color: #0369a1; font-weight: 900; font-family: Courier, monospace;">${performanceKPIs.boxMatchingScore.toFixed(0)}%</div>
              <div style="font-size: 9px; color: #3b82f6; font-weight: bold; margin-top: 4px;">إجمالي الفجوة: ${formatPrice(performanceKPIs.totalDeficitAmount)}</div>
            </div>

          </div>
        </div>

        <div style="page-break-inside: avoid; margin-bottom: 30px;">
          <!-- Liquidity Profile -->
          <div style="background: #fdfbf7; border: 1px solid #fef3c7; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #b45309; font-weight: 900;">💳 تحليل تدفقات السيولة والنقد</h3>
            <div style="display: table; width: 100%;">
              <div style="display: table-row;">
                <div style="display: table-cell; width: 50%; font-size: 12px; padding: 5px;">
                  <b>المبيعات النقدية المصفاة (كاش):</b> ${formatPrice(performanceKPIs.cashSalesTotal)} (${((performanceKPIs.cashSalesTotal / (performanceKPIs.salesTotal || 1)) * 100).toFixed(0)}%)
                </div>
                <div style="display: table-cell; width: 50%; font-size: 12px; padding: 5px;">
                  <b>مبيعات الديون والبيوع الآجلة:</b> ${formatPrice(performanceKPIs.debtSalesTotal)} (${((performanceKPIs.debtSalesTotal / (performanceKPIs.salesTotal || 1)) * 100).toFixed(0)}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 1: Daily Breakdown Table -->
        <div style="page-break-inside: avoid; margin-bottom: 35px;">
          <h3 style="font-size: 14px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; color: #1e293b; margin-top: 0; margin-bottom: 12px; font-weight: 900;">📆 سجل حركة المبيعات اليومية التفصيلية</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 20%;">اليوم والتاريخ</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 12%;">عدد العمليات</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 18%;">النقد الفوري (كاش)</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 14%;">الآجل (ديون)</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 14%;">الإجمالي</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 14%;">التكلفة (للمورد)</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 14%;">الأرباح</th>
              </tr>
            </thead>
            <tbody>
              ${(dailySalesBreakdown || []).map(d => `
                <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #1e293b;">${d.dateStr}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${d.count}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">${formatPrice(d.cashAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">${formatPrice(d.debtAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 900; color: #4f46e5;">${formatPrice(d.totalAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 900; color: #b45309;">${formatPrice(d.cost)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 900; color: #16a34a;">${formatPrice(d.profit)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="page-break-before: always;"></div>

        <!-- Section 2: Person/Customer Breakdown Table -->
        <div style="margin-bottom: 35px;">
          <h3 style="font-size: 14px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; color: #1e293b; margin-top: 0; margin-bottom: 12px; font-weight: 900;">👥 كشوفات حساب ومبيعات الأشخاص والعملاء</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 28%;">اسم الشخص / العميل</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 10%;">الفواتير</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 14%;">الأداء النقدي</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 14%;">المديونية الآجلة</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 16%;">إجمالي الشراء</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 18%;">الرصيد المتبقي (الذمة)</th>
              </tr>
            </thead>
            <tbody>
              ${(customerSalesBreakdown || []).map(c => `
                <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #0f172a;">${c.name}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${c.count}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">${formatPrice(c.cashAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">${formatPrice(c.debtAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: 900; color: #4f46e5;">${formatPrice(c.totalAmount)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: ${c.balance > 0 ? '#dc2626' : '#1e293b'}">${formatPrice(c.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 3: High Performing items -->
        <div style="page-break-inside: avoid; margin-bottom: 35px;">
          <h3 style="font-size: 14px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; color: #1e293b; margin-top: 0; margin-bottom: 12px; font-weight: 900;">🏆 السلع والمنتجات الخمسة الأعلى تحقيقاً للمبيعات والأرباح</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 44%;">المنتج</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; width: 16%;">الكمية المباعة</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 22%;">المبيعات الكلية</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; width: 18%;">الأرباح الصافية</th>
              </tr>
            </thead>
            <tbody>
              ${(topProductsChart || []).map(p => `
                <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #1e293b;">${p.name}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${p.quantity}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #4f46e5;">${formatPrice(p.revenue)}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; color: #16a34a;">${formatPrice(p.profit)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Signatures and closing footer -->
        <div style="margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0;">يخضع هذا التقرير لجرد الأنظمة الحسابية الحية للمتجر، تم نسخه الكترونياً ومعالجته بذكاء مالي.</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; color: #4f46e5;">${storeName} الحسابي</p>
        </div>

      </div>
    `;

    const opt = {
      margin: 0.3,
      filename: `تقرير_المبيعات_التراكمي_الذكي_BI.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-right pb-10 font-sans"
    >
      {/* Upper Title Section / Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-3.5 z-10">
          <button 
            onClick={onGoBack} 
            className="p-3 bg-white/5 hover:bg-white/10 text-white hover:text-indigo-300 rounded-2xl transition-all cursor-pointer border border-white/10 active:scale-95 animate-none"
            title="العودة للوحة الجرد الحركي الرئيسية"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              📊 مركز التحليلات والذكاء المحاسبي المتكامل
              <span className="text-[10px] sm:text-xs font-black bg-indigo-500/20 border border-indigo-400/25 text-indigo-300 rounded-full py-0.5 px-3">
                Live BI Graphics
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
              شاشات إحصائية حية لتقييم كفاءة عمليات البيع، صحة خزينة الدرج، ومطابقة الرصيد الفعلي بالذمة والديون
            </p>
          </div>
        </div>

        {/* Date Filters + Global Report Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto z-10">
          <div className="flex flex-wrap items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
            {[
              { id: 'today', label: 'اليوم' },
              { id: '7days', label: '٧ أيام' },
              { id: '30days', label: '٣٠ يوماً' },
              { id: 'month', label: 'الشهر الجاري' },
              { id: 'all', label: 'الكل' }
            ].map((p, idx) => (
              <button
                key={`analytics-period-btn-${p.id}-${idx}`}
                onClick={() => setDateFilter(p.id as any)}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  dateFilter === p.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsSmartAdvisorModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl shadow-lg transition-all duration-200 cursor-pointer border-t border-white/20 active:scale-95"
            title="الوصول وعرض المساعد الذكي والتحليلات الموجهة"
          >
            <Brain className="w-4 h-4 animate-pulse" />
            <span>المساعد الذكي</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-2xl shadow-lg transition-all duration-200 cursor-pointer border-t border-white/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>تصدير ملف مالي (PDF)</span>
          </button>
        </div>
      </div>

      {/* Integrated Live Segmental Filters */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
          <Filter className="w-4.5 h-4.5 text-indigo-500" />
          <h3 className="text-xs font-black text-slate-800">
            تخصيص البيانات والتحليل البصري (Multi-Pivot Filters)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 block">📆 الشهر المحدد (تصفية بالشهر)</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-2xl font-black text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden cursor-pointer"
            >
              <option value="all">كل الأشهر (عرض إجمالي للعام)</option>
              {availableMonthsList.map(([monthKey, formattedName], idx) => (
                <option key={`month-filter-${monthKey}-${idx}`} value={monthKey}>{formattedName} ({monthKey})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 block">فئات المنتجات والسلع</span>
            <select 
              value={selectedProductCategory} 
              onChange={(e) => setSelectedProductCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-2xl font-black text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden cursor-pointer"
            >
              <option value="all">كل الفئات والسلع الحسابية</option>
              {categoriesList.map((cat, idx) => (
                <option key={`cat-filter-${cat}-${idx}`} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 block">حالة العميل أو طريقة الدفع</span>
            <select 
              value={selectedCustomer} 
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-2xl font-black text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden cursor-pointer"
            >
              <option value="all">أجهزة الدفع، الديون، وكل العملاء</option>
              <option value="cash">المقبوض النقدي كاش وشبكة (فوري)</option>
              <option value="debtors">الذمم المدينة (ديون العملاء)</option>
              {customers.map((c, idx) => (
                <option key={`cust-filter-${c.id ?? 'noid'}-${idx}`} value={String(c.id)}>{c.name} {c.balance > 0 ? `(آجل: ${formatPrice(c.balance)})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Jump / Domain Navigation Tab Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-1.5 shadow-md flex items-center gap-1.5 overflow-x-auto custom-scrollbar border border-slate-800">
        <button 
          type="button"
          onClick={() => setActiveHubTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'all' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>الكل (شبكة متناسقة)</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveHubTab('sales')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'sales' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/5'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>المبيعات والأرباح</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveHubTab('inventory')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'inventory' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/5'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span>المخزون والرفوف</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveHubTab('customers')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'customers' 
              ? 'bg-amber-600 text-white shadow-sm' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>العملاء والديون</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveHubTab('cashflow')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'cashflow' 
              ? 'bg-sky-600 text-white shadow-sm' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/5'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-sky-400" />
          <span>الصندوق والسيولة</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveHubTab('suppliers')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeHubTab === 'suppliers' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>الموردين والمستحقات 🏬</span>
        </button>
      </div>

      {/* Analytics Hubs Container - Responsive Grid Layout */}
      <div className={activeHubTab === 'all' ? 'grid grid-cols-1 xl:grid-cols-2 gap-5 items-start' : 'space-y-5'}>
        
        {/* SECTION 1: 📈 قسم المبيعات والأرباح (Sales & Profitability Hub) */}
        {(activeHubTab === 'all' || activeHubTab === 'sales') && (
          <section className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-800">
                      قسم المبيعات والأرباح
                    </h3>
                    <span className="text-[9.5px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                      Sales Hub
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">الإيرادات، الأرباح الصافية، وتكلفة بضاعة البيع</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowDailyLogModal(true)}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-indigo-100"
                >
                  <Calendar className="w-3 h-3" />
                  <span>السجل اليومي 📆</span>
                </button>
              </div>
            </div>

            {/* 4 Metric Cards for Sales (Compact 2x2 or 4-col) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: Total Sales */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">إجمالي المبيعات</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-slate-800 font-mono">
                  {formatPrice(performanceKPIs.salesTotal)}
                </div>
                <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                  <span>العمليات: <strong className="text-indigo-600">{performanceKPIs.transactionsCount}</strong></span>
                  <span className="text-[9px] bg-slate-200/60 px-1 py-0.2 rounded">مكتمل</span>
                </div>
              </div>

              {/* Card 2: Net Profits */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-emerald-800">الأرباح الصافية</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-emerald-700 font-mono">
                  {formatPrice(performanceKPIs.profitTotal)}
                </div>
                <div className="text-[10px] font-bold text-emerald-800 flex items-center justify-between">
                  <span>الهامش:</span>
                  <span className="bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded text-[9.5px]">
                    {performanceKPIs.profitMarginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Card 3: Goods Cost */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">تكلفة المشتريات المباعة</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-slate-700 font-mono">
                  {formatPrice(performanceKPIs.costTotal)}
                </div>
                <p className="text-[9.5px] text-slate-400">سعر التأسيس للموردين</p>
              </div>

              {/* Card 4: Average Order Value */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">متوسط الفاتورة (AOV)</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-slate-700 font-mono">
                  {formatPrice(performanceKPIs.avgOrderValue)}
                </div>
                <p className="text-[9.5px] text-slate-400">معدل البيع للعملية</p>
              </div>
            </div>

            {/* Visual Trend Chart */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>منحنى نمو المبيعات وصافي الأرباح</span>
                  </h4>
                </div>

                {/* Quick Month Selector */}
                {availableMonthsList.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setSelectedMonth('all')}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer shrink-0 ${
                        selectedMonth === 'all' 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      الكل
                    </button>
                    {availableMonthsList.map(([mKey, mName], idx) => (
                      <button
                        type="button"
                        key={`sales-month-pill-${mKey}-${idx}`}
                        onClick={() => setSelectedMonth(mKey)}
                        className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer shrink-0 ${
                          selectedMonth === mKey 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-52 w-full bg-white rounded-xl p-2 border border-slate-100">
                {salesAndProfitTrendChart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    لا تتوفر حركة مبيعات مسجلة في النطاق الزمني المحدد.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={salesAndProfitTrendChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSalesSection" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.20}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorProfitSection" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.20}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={(v) => typeof v === 'number' ? formatPrice(Math.round(v)) : v} />
                      <Tooltip 
                        contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '10px', fontWeight: 'bold' }} 
                        formatter={(value: any, name: any) => [formatPrice(Math.round(value)), name === 'totalAmount' ? 'المبيعات' : 'صافي الأرباح']}
                      />
                      <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '9.5px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="totalAmount" name="totalAmount" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSalesSection)" animationDuration={200} />
                      <Area type="monotone" dataKey="profit" name="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfitSection)" animationDuration={200} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: 💵 قسم الصندوق وحركة النقدية والسيولة (Cash Flow Hub) */}
        {(activeHubTab === 'all' || activeHubTab === 'cashflow') && (
          <section className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-800">
                      قسم الصندوق وحركة النقدية
                    </h3>
                    <span className="text-[9.5px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold border border-sky-100">
                      Cash Flow Hub
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">نقدية الدرج، المسحوبات، والمبالغ المصفاة للمالك</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                <span>مطابقة الدرج:</span>
                <span className={`font-mono font-black ${performanceKPIs.boxMatchingScore >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {performanceKPIs.boxMatchingScore.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* 4 Metric Cards for Cash Flow (Compact) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: Actual Cash in Drawer */}
              <div className="bg-sky-50/60 border border-sky-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-sky-900">نقدية الدرج الفعلية</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-sky-900 font-mono">
                  {formatPrice(performanceKPIs.absoluteActualCashInDrawer)}
                </div>
                <p className="text-[9.5px] text-sky-700 font-medium">جاهز للجرد الفوري</p>
              </div>

              {/* Card 2: Received Cash in Period */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">إجمالي المقبوضات</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-slate-800 font-mono">
                  {formatPrice(performanceKPIs.receivedCashInPeriod)}
                </div>
                <p className="text-[9.5px] text-slate-400">مبيعات + سداد ديون</p>
              </div>

              {/* Card 3: Settlements to Owner */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">المصفى للمالك</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-purple-700 font-mono">
                  {formatPrice(performanceKPIs.totalSettledAmount)}
                </div>
                <p className="text-[9.5px] text-slate-400">التصفيات المسلّمة</p>
              </div>

              {/* Card 4: Withdrawals and Expenses */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">نفقات ومسحوبات</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-rose-700 font-mono">
                  -{formatPrice(performanceKPIs.totalWithdrawals)}
                </div>
                <p className="text-[9.5px] text-slate-400">مصاريف مسجلة</p>
              </div>
            </div>

            {/* Cashflow Timeline Chart & Donut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">التدفق النقدي والنمو اليومي</h4>
                <div className="h-44 w-full bg-white rounded-xl p-1.5 border border-slate-100">
                  {unifiedCashflowTimeline.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      لا تتوفر حركات مالية مسجلة.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={unifiedCashflowTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMoneyInSec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.16}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorMoneyOutSec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.12}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} tickFormatter={(v) => typeof v === 'number' ? formatPrice(Math.round(v)) : v} />
                        <Tooltip 
                          contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '10px' }} 
                          formatter={(value: any, name: any) => [
                            formatPrice(Math.round(value)), 
                            name === 'moneyIn' ? 'المقبوضات' : 'المدفوعات'
                          ]}
                        />
                        <Area type="monotone" dataKey="moneyIn" name="moneyIn" stroke="#2563eb" strokeWidth={1.8} fillOpacity={1} fill="url(#colorMoneyInSec)" animationDuration={200} />
                        <Area type="monotone" dataKey="moneyOut" name="moneyOut" stroke="#dc2626" strokeWidth={1.8} fillOpacity={1} fill="url(#colorMoneyOutSec)" animationDuration={200} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Liquidity Donut Allocation */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-bold text-slate-700">توزيع السيولة بالمنظومة</h4>
                <div className="h-32 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'كاش الدرج', value: performanceKPIs.absoluteActualCashInDrawer },
                          { name: 'المسحوبات', value: performanceKPIs.totalWithdrawals },
                          { name: 'المصفى للمالك', value: performanceKPIs.totalSettledAmount },
                          { name: 'ذمم العملاء', value: performanceKPIs.debtSalesTotal }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={52}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={200}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f43f5e" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#d97706" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '10px', fontSize: '9.5px' }}
                        formatter={(value: any) => formatPrice(value)} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[8.5px] font-bold">
                  <div className="bg-white p-1 border border-slate-100 rounded flex justify-between">
                    <span className="text-blue-500">🔵 كاش:</span>
                    <span className="font-mono text-slate-700">{formatPrice(performanceKPIs.absoluteActualCashInDrawer)}</span>
                  </div>
                  <div className="bg-white p-1 border border-slate-100 rounded flex justify-between">
                    <span className="text-rose-500">🔴 سحب:</span>
                    <span className="font-mono text-slate-700">{formatPrice(performanceKPIs.totalWithdrawals)}</span>
                  </div>
                  <div className="bg-white p-1 border border-slate-100 rounded flex justify-between">
                    <span className="text-purple-500">🟣 مصفى:</span>
                    <span className="font-mono text-slate-700">{formatPrice(performanceKPIs.totalSettledAmount)}</span>
                  </div>
                  <div className="bg-white p-1 border border-slate-100 rounded flex justify-between">
                    <span className="text-amber-600">🟠 آجل:</span>
                    <span className="font-mono text-slate-700">{formatPrice(performanceKPIs.debtSalesTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: 📦 قسم المخزون والمنتجات وحركة الرفوف (Inventory Hub) */}
        {(activeHubTab === 'all' || activeHubTab === 'inventory') && (
          <section className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-800">
                      قسم المخزون والرفوف
                    </h3>
                    <span className="text-[9.5px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                      Inventory Hub
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">رأس مال المخزون، النواقص، والأصناف المباعة</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                <span>القيمة بالبيع:</span>
                <span className="font-mono text-emerald-700 font-black">{formatPrice(inventoryStats.totalRetailValuation)}</span>
              </div>
            </div>

            {/* 4 Metric Cards for Inventory (Compact) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: Inventory Cost Valuation */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">رأس مال المخزون (بالتكلفة)</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-slate-800 font-mono">
                  {formatPrice(inventoryStats.totalCostValuation)}
                </div>
                <div className="text-[10px] font-bold text-emerald-700">
                  أرباح متوقعة: <span className="font-mono font-black">{formatPrice(inventoryStats.potentialProfit)}</span>
                </div>
              </div>

              {/* Card 2: Total Items & Stock Units */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">الأصناف والقطع</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-indigo-700 font-mono">
                  {inventoryStats.totalProductsCount} <span className="text-xs font-bold text-slate-500 font-sans">صنف</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500">
                  إجمالي القطع: <span className="font-mono font-bold text-slate-700">{inventoryStats.totalStockUnits}</span>
                </div>
              </div>

              {/* Card 3: Out of Stock & Low Stock Alert */}
              <div className={`p-3 rounded-xl flex flex-col justify-between border ${
                inventoryStats.outOfStockCount > 0 || inventoryStats.lowStockCount > 0 
                  ? 'bg-rose-50/50 border-rose-100' 
                  : 'bg-slate-50/70 border-slate-100'
              }`}>
                <span className={`text-[11px] font-bold ${inventoryStats.outOfStockCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                  النواقص والحد الأدنى
                </span>
                <div className="my-1.5 text-base sm:text-lg font-black text-rose-700 font-mono">
                  {inventoryStats.outOfStockCount} <span className="text-xs font-bold font-sans">منتهية</span>
                </div>
                <div className="text-[10px] font-bold text-amber-700">
                  قارب على النفاد: <span className="font-mono font-bold">{inventoryStats.lowStockCount} صنف</span>
                </div>
              </div>

              {/* Card 4: Expiry Alerts */}
              <div className={`p-3 rounded-xl flex flex-col justify-between border ${
                inventoryStats.expiringSoonCount > 0 
                  ? 'bg-amber-50/50 border-amber-100' 
                  : 'bg-slate-50/70 border-slate-100'
              }`}>
                <span className={`text-[11px] font-bold ${inventoryStats.expiringSoonCount > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
                  تنبيه الصلاحية
                </span>
                <div className="my-1.5 text-base sm:text-lg font-black text-amber-800 font-mono">
                  {inventoryStats.expiringSoonCount} <span className="text-xs font-bold font-sans">صنف</span>
                </div>
                <p className="text-[9.5px] text-slate-400">خلال 30 يوماً</p>
              </div>
            </div>

            {/* 2 Sub-panels: Top Products + Shelf Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Top Selling Products */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">أعلى السلع عائداً مالياً</h4>
                <div className="h-44 w-full bg-white rounded-xl p-1.5 border border-slate-100">
                  {topProductsChart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      لم يتم تسجيل مبيعات للأصناف.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={topProductsChart} layout="vertical" margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={8} fontWeight="bold" tickFormatter={(v) => typeof v === 'number' ? formatPrice(Math.round(v)) : v} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={8} fontWeight="bold" width={80} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '10px', fontSize: '9.5px' }}
                          formatter={(value: any, name: any) => [formatPrice(value), name === 'revenue' ? 'المبيعات' : 'الأرباح']}
                        />
                        <Bar dataKey="revenue" name="revenue" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={7} animationDuration={200} />
                        <Bar dataKey="profit" name="profit" fill="#10b981" radius={[0, 6, 6, 0]} barSize={7} animationDuration={200} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Shelving Category Share */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-700">مبيعات تصنيفات الرفوف</h4>
                <div className="space-y-1.5 max-h-[176px] overflow-y-auto custom-scrollbar pr-1">
                  {categorySalesChart.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      لا توجد فئات رفوف مباعة.
                    </div>
                  ) : (
                    categorySalesChart.map((cat, idx) => {
                      const totalSalesForPercentage = performanceKPIs.salesTotal || 1;
                      const percentage = ((cat.sales / totalSalesForPercentage) * 100);
                      
                      return (
                        <div key={`cat-sales-chart-${cat.name || 'cat'}-${idx}`} className="p-2 bg-white rounded-xl border border-slate-100 space-y-1 text-right">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-extrabold text-slate-800">{cat.name}</span>
                            <span className="font-mono font-bold text-emerald-700">{formatPrice(cat.sales)}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, percentage)}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: 👥 قسم العملاء والذمم المدينة (Receivables Hub) */}
        {(activeHubTab === 'all' || activeHubTab === 'customers') && (
          <section className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-800">
                      قسم العملاء والديون والذمم
                    </h3>
                    <span className="text-[9.5px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                      Receivables Hub
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">أرصدة الزبائن، معدلات التحصيل، والديون القائمة</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCustomerReceivablesModal(true)}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-amber-200"
                >
                  <Users className="w-3 h-3" />
                  <span>كشف حساب الذمم 👤</span>
                </button>
              </div>
            </div>

            {/* 4 Metric Cards for Customers (Compact) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: Total Outstanding Debts */}
              <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-rose-800">إجمالي ديون العملاء</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-rose-700 font-mono">
                  {formatPrice(customerAnalytics.totalCustomerDebts)}
                </div>
                <div className="text-[10px] font-bold text-rose-700">
                  المدينين: <span className="font-mono font-black">{customerAnalytics.debtorsCount} زبون</span>
                </div>
              </div>

              {/* Card 2: Debt Recovery Rate */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">معدل تحصيل الديون</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-purple-700 font-mono">
                  {performanceKPIs.debtRecoveryRate.toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold text-slate-500">
                  نسبة التحصيل
                </div>
              </div>

              {/* Card 3: Period Debt Sales */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">المبيعات الآجلة</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-amber-700 font-mono">
                  {formatPrice(performanceKPIs.debtSalesTotal)}
                </div>
                <p className="text-[9.5px] text-slate-400">ديون جديدة بالفترة</p>
              </div>

              {/* Card 4: Collected Cash from Debts */}
              <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500">المقبوض نقداً من السداد</span>
                <div className="my-1.5 text-base sm:text-lg font-black text-emerald-700 font-mono">
                  {formatPrice(performanceKPIs.totalCollectedPayments)}
                </div>
                <p className="text-[9.5px] text-slate-400">تحصيلات الفترة</p>
              </div>
            </div>

            {/* Mini Preview Table of Customers */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-700">نشاط العملاء والديون</h4>
                <div className="relative w-full sm:w-48">
                  <Search className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="ابحث بالاسم..."
                    value={customerSearchKey}
                    onChange={(e) => setCustomerSearchKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pr-7 pl-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[10px]">
                      <th className="p-2 rounded-r-lg">العميل</th>
                      <th className="p-2 text-center">العمليات</th>
                      <th className="p-2">الشراء</th>
                      <th className="p-2 text-left rounded-l-lg">الرصيد المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {searchedCustomerSales.slice(0, 4).map((c, idx) => (
                      <tr key={`cust-row-${c.id ?? 'noid'}-${idx}`} className="hover:bg-white transition-colors">
                        <td className="p-2 font-bold text-slate-800">{c.name}</td>
                        <td className="p-2 text-center font-mono">{c.count}</td>
                        <td className="p-2 font-mono font-bold text-indigo-700">{formatPrice(c.totalAmount)}</td>
                        <td className="p-2 text-left font-mono font-bold">
                          {c.balance > 0 ? (
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                              {formatPrice(c.balance)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                              خالص
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: 🏬 قسم الموردين والمشتريات والمستحقات (Suppliers Hub) */}
        {(activeHubTab === 'all' || activeHubTab === 'suppliers') && (
          <section className={`bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 ${activeHubTab === 'all' ? 'xl:col-span-2' : ''}`}>
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-black text-slate-800">
                      مستحقات الموردين وتفاصيل رأس المال
                    </h3>
                    <span className="text-[9.5px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                      {supplierAnalytics.activeViewMetrics.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    متابعة رأس المال والمستحقات، المسدد والمطلوب، وقيمة بضاعة المورد بالمخزن والمباعة
                  </p>
                </div>
              </div>

              {/* Supplier Selection Button / Dropdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-amber-50/60 border border-amber-200 p-1 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-900 px-1.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-700" />
                    <span>المورد:</span>
                  </span>
                  <select
                    value={selectedSupplierFilter}
                    onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                    className="bg-white border border-amber-300 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs"
                  >
                    <option value="all">🌐 جميع الموردين ({supplierAnalytics.totalSuppliersCount})</option>
                    {supplierAnalytics.supplierList.map((sup, idx) => (
                      <option key={`sup-select-${sup.id ?? 'noid'}-${idx}`} value={String(sup.id)}>
                        {sup.name} {sup.balance > 0 ? `(مستحق: ${formatPrice(sup.balance)})` : '(خالص)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Status Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSupplierFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                      supplierFilterType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierFilterType('due')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                      supplierFilterType === 'due' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    مستحق ({supplierAnalytics.suppliersWithDebtCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierFilterType('settled')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                      supplierFilterType === 'settled' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    مسدد
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Metric Cards for Selected Supplier / All Suppliers */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Card 1: المطلوب قبل السداد (إجمالي مستحقات الموردين / رأس المال الكلي قبل الدفعات) */}
              <div className="bg-slate-50/90 border border-slate-200 p-3 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-0.5">
                    <span>المطلوب قبل السداد</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">قبل الدفع</span>
                  </div>
                  <div className="my-1 text-base sm:text-lg font-black text-slate-800 font-mono">
                    {formatPrice(supplierAnalytics.activeViewMetrics.totalRequiredBeforeSettlement)}
                  </div>
                </div>
                <p className="text-[9.5px] text-slate-500 font-medium">
                  {supplierAnalytics.activeViewMetrics.isSpecific 
                    ? `المستحقات الكليّة للمورد (${supplierAnalytics.activeViewMetrics.name}) قبل أي مدفوعات` 
                    : 'المستحقات الكليّة لجميع التجار قبل أي مدفوعات'}
                </p>
              </div>

              {/* Card 2: المبالغ المسلمة (رأس المال المسلّم للتجار) */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl flex flex-col justify-between hover:border-emerald-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 mb-0.5">
                    <span>المبالغ المسلمة</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">مدفوع</span>
                  </div>
                  <div className="my-1 text-base sm:text-lg font-black text-emerald-700 font-mono">
                    {formatPrice(supplierAnalytics.activeViewMetrics.totalPaid)}
                  </div>
                </div>
                <p className="text-[9.5px] text-emerald-800 font-medium">
                  {supplierAnalytics.activeViewMetrics.isSpecific 
                    ? `رأس المال المسلّم للمورد (${supplierAnalytics.activeViewMetrics.paymentsCount} دفعة مسجلة)`
                    : 'إجمالي الدفعات المسددة والمسجلة للموردين'}
                </p>
              </div>

              {/* Card 3: المطلوب حالياً (المستحق الحالي المتبقي) */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex flex-col justify-between hover:border-amber-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-0.5">
                    <span>المطلوب حالياً</span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono font-bold">المتبقي</span>
                  </div>
                  <div className="my-1 text-base sm:text-lg font-black text-amber-900 font-mono">
                    {formatPrice(supplierAnalytics.activeViewMetrics.currentBalance)}
                  </div>
                </div>
                <p className="text-[9.5px] text-amber-800 font-medium">
                  {supplierAnalytics.activeViewMetrics.isSpecific
                    ? (supplierAnalytics.activeViewMetrics.currentBalance > 0 ? 'المستحق الحالي المتبقي لهذا المورد' : 'الحساب خالص بالكامل')
                    : `مستحقات معلقة على ${supplierAnalytics.suppliersWithDebtCount} مورد`}
                </p>
              </div>

              {/* Card 4: مستحق المورد الكلي (الموجود في المخزون + المباع بالتكلفة) */}
              <div className="bg-indigo-50/60 border border-indigo-200/80 p-3 rounded-xl flex flex-col justify-between hover:border-indigo-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 mb-0.5">
                    <span>مستحق البضائع الكلي</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono font-bold">مخزون + مباع</span>
                  </div>
                  <div className="my-1 text-base sm:text-lg font-black text-indigo-700 font-mono">
                    {formatPrice(supplierAnalytics.activeViewMetrics.totalInventoryAndSoldCost)}
                  </div>
                </div>
                <div className="text-[9px] text-indigo-900 flex justify-between items-center font-mono">
                  <span>المخزون: {formatPrice(supplierAnalytics.activeViewMetrics.inventoryCostValue)}</span>
                  <span>•</span>
                  <span>المباع: {formatPrice(supplierAnalytics.activeViewMetrics.soldCostValue)}</span>
                </div>
              </div>
            </div>

            {/* Quick Supplier Quick Filter Bar */}
            {supplierAnalytics.totalSuppliersCount > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
                <span className="text-[10px] font-bold text-slate-500 shrink-0">تبديل سريع:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSupplierFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedSupplierFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل
                </button>
                {supplierAnalytics.supplierList.map((sup, idx) => {
                  const isSelected = selectedSupplierFilter === String(sup.id);
                  return (
                    <button
                      key={`sup-quick-btn-${sup.id ?? 'noid'}-${idx}`}
                      type="button"
                      onClick={() => setSelectedSupplierFilter(String(sup.id))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-900'
                      }`}
                    >
                      <span>{sup.name}</span>
                      {sup.balance > 0 && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'}`}>
                          {formatPrice(sup.balance)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Suppliers Interactive Grid / Directory */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>دليل الموردين (انقر على أي مورد لعرض كشفه التفصيلي)</span>
                  </h4>
                </div>

                {/* Search Bar for Suppliers */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="ابحث بالاسم أو الهاتف..."
                    value={supplierSearchKey}
                    onChange={(e) => setSupplierSearchKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pr-7 pl-7 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {supplierSearchKey && (
                    <button
                      type="button"
                      onClick={() => setSupplierSearchKey('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {filteredSupplierList.length === 0 ? (
                <div className="bg-white rounded-xl p-6 border border-slate-100 text-center space-y-1.5">
                  <Building2 className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">لا يوجد موردين مطابقين لمعايير البحث الحالية.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredSupplierList.map((sup, idx) => {
                    const hasBalance = sup.balance > 0;
                    return (
                      <div
                        key={`supplier-card-${sup.id || idx}-${idx}`}
                        onClick={() => {
                          setSelectedSupplierForDetails(sup);
                          setSupplierDetailsTab('overview');
                          setSupplierProductSearch('');
                        }}
                        className="bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-xs rounded-xl p-3 transition-all duration-150 cursor-pointer flex flex-col justify-between group text-right"
                      >
                        <div>
                          {/* Top Supplier Name & Badge */}
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-100 transition-colors">
                                <Building2 className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-slate-800 leading-tight group-hover:text-amber-800 transition-colors">
                                  {sup.name}
                                </h5>
                                <p className="text-[9.5px] text-slate-400 flex items-center gap-1 font-mono">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{sup.phone || 'بدون هاتف'}</span>
                                </p>
                              </div>
                            </div>

                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 border ${
                              hasBalance 
                                ? 'bg-amber-50 text-amber-900 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {hasBalance ? 'مستحق' : 'مسدد'}
                            </span>
                          </div>

                          {/* Main Balance Display */}
                          <div className="bg-slate-50 rounded-lg p-2 my-1.5 border border-slate-100 flex justify-between items-center">
                            <span className="text-[9.5px] font-bold text-slate-500">الرصيد المتبقي له:</span>
                            <span className={`text-xs font-black font-mono ${hasBalance ? 'text-amber-900' : 'text-emerald-700'}`}>
                              {formatPrice(sup.balance)}
                            </span>
                          </div>

                          {/* Supplier Sub-metrics */}
                          <div className="grid grid-cols-2 gap-1 text-[9.5px] text-slate-600 mb-1.5">
                            <div className="bg-slate-50/80 p-1 rounded">
                              <span className="text-[8.5px] text-slate-400 block">الأصناف:</span>
                              <span className="font-bold text-slate-800 font-mono">{sup.productsCount} صنف</span>
                            </div>
                            <div className="bg-slate-50/80 p-1 rounded">
                              <span className="text-[8.5px] text-slate-400 block">قيمة المخزون:</span>
                              <span className="font-bold text-slate-800 font-mono">{formatPrice(sup.inventoryCostValue)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9.5px] font-bold text-amber-800">
                          <span>عرض الكشف التفصيلي</span>
                          <div className="flex items-center gap-0.5 text-amber-700 group-hover:translate-x-[-2px] transition-transform">
                            <span>فحص</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {/* MODAL: Comprehensive Supplier Analytics Details Modal */}
      <AnimatePresence>
        {activeSupplierDetails && (
          <div key="modal-supplier-analytics-details" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-2xl shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {activeSupplierDetails.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        activeSupplierDetails.balance > 0 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      }`}>
                        {activeSupplierDetails.balance > 0 ? `مستحق: ${formatPrice(activeSupplierDetails.balance)}` : 'خالص / مسدد'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/80 mt-0.5 flex items-center gap-2">
                      <span>الهاتف: {activeSupplierDetails.phone || 'بدون هاتف'}</span>
                      <span>•</span>
                      <span>الأصناف المربوطة: {activeSupplierDetails.productsCount} صنف</span>
                      <span>•</span>
                      <span>حركات التحديث: {activeSupplierDetails.inventoryLogs?.length || 0} عملية</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSupplierForDetails(null)}
                  className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Interactive Tabs */}
              <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setSupplierDetailsTab('overview')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      supplierDetailsTab === 'overview' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>الموجز المالي</span>
                  </button>
                  <button
                    onClick={() => setSupplierDetailsTab('products')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      supplierDetailsTab === 'products' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>المنتجات والبضائع ({activeSupplierDetails.productsCount})</span>
                  </button>
                  <button
                    onClick={() => setSupplierDetailsTab('inventory_logs')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      supplierDetailsTab === 'inventory_logs' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>حركات وتحديثات البضاعة ({activeSupplierDetails.inventoryLogs?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setSupplierDetailsTab('payments')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      supplierDetailsTab === 'payments' 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>الدفعات ({activeSupplierDetails.payments.length})</span>
                  </button>
                </div>

                <span className="text-[11px] font-bold text-slate-400 hidden md:inline">
                  كشف حساب تحليلي فوري
                </span>
              </div>

              {/* Modal Body Content */}
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {/* TAB 1: OVERVIEW */}
                {supplierDetailsTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Primary Highlight Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-right">
                        <span className="text-[11px] font-bold text-amber-800 block">الرصيد المستحق للتسليم</span>
                        <div className="text-xl font-black text-amber-900 font-mono my-1">
                          {formatPrice(activeSupplierDetails.balance)}
                        </div>
                        <p className="text-[10px] text-amber-700">الذمة الدائنة القائمة</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-right">
                        <span className="text-[11px] font-bold text-slate-500 block">قيمة المخزون الحالي بسعر التكلفة</span>
                        <div className="text-xl font-black text-slate-800 font-mono my-1">
                          {formatPrice(activeSupplierDetails.inventoryCostValue)}
                        </div>
                        <p className="text-[10px] text-slate-500">القيمة بسعر البيع: {formatPrice(activeSupplierDetails.inventoryRetailValue)}</p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-right">
                        <span className="text-[11px] font-bold text-emerald-800 block">إجمالي المسدد للمورد تاريخياً</span>
                        <div className="text-xl font-black text-emerald-700 font-mono my-1">
                          {formatPrice(activeSupplierDetails.totalPaid)}
                        </div>
                        <p className="text-[10px] text-emerald-700">عدد الدفعات المسجلة: {activeSupplierDetails.payments.length}</p>
                      </div>
                    </div>

                    {/* Operational Performance Highlights */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800">مؤشرات أداء مبيعات بضائع هذا المورد</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block">إجمالي مبيعات منتجاته</span>
                          <span className="text-sm font-black text-indigo-600 font-mono mt-0.5 block">
                            {formatPrice(activeSupplierDetails.totalSoldValue)}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block">القطع المباعة للعملاء</span>
                          <span className="text-sm font-black text-slate-800 font-mono mt-0.5 block">
                            {activeSupplierDetails.totalSoldQuantity} قطعة
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block">القطع المتوفرة بالرف</span>
                          <span className="text-sm font-black text-slate-800 font-mono mt-0.5 block">
                            {activeSupplierDetails.inventoryStock} قطعة
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block">آخر دفعة مسددة</span>
                          <span className="text-xs font-bold text-slate-700 font-mono mt-0.5 block truncate">
                            {activeSupplierDetails.lastPaymentDate ? new Date(activeSupplierDetails.lastPaymentDate).toLocaleDateString('ar-SA') : 'لا يوجد'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRODUCTS */}
                {supplierDetailsTab === 'products' && (
                  <div className="space-y-3.5">
                    {/* Quick Link Banner to Inventory Logs */}
                    <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-200/60 rounded-xl text-amber-800 shrink-0">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-amber-950 font-bold">سجل التوريدات وتحديثات المخزون والسحب</p>
                          <p className="text-[11px] text-amber-800/90">يحتوي على تفاصيل زيادة الكميات، التعديلات، والسحب من المخزن ({activeSupplierDetails.inventoryLogs?.length || 0} حركة)</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSupplierDetailsTab('inventory_logs')}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <span>عرض سجل الحركات</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="ابحث في منتجات المورد..."
                          value={supplierProductSearch}
                          onChange={(e) => setSupplierProductSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-bold">
                        {activeSupplierDetails.products.length} صنف مسجل
                      </span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-2xl">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-3">اسم المنتج / الصنف</th>
                            <th className="p-3">الباركود</th>
                            <th className="p-3">التصنيف</th>
                            <th className="p-3">سعر التكلفة</th>
                            <th className="p-3">سعر البيع</th>
                            <th className="p-3">المخزون الحالي</th>
                            <th className="p-3">قيمة المخزون</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeSupplierDetails.products
                            .filter((p: any) => !supplierProductSearch.trim() || p.name.toLowerCase().includes(supplierProductSearch.toLowerCase()) || (p.barcode && p.barcode.includes(supplierProductSearch)))
                            .map((p: any, idx: number) => {
                              const stockQty = p.stock_quantity || 0;
                              const stockValue = stockQty * (p.cost_price || 0);
                              return (
                                <tr key={`sup-prod-${p.id || idx}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-bold text-slate-800">{p.name}</td>
                                  <td className="p-3 font-mono text-slate-500 text-[11px]">{p.barcode || '—'}</td>
                                  <td className="p-3 text-slate-600">{p.category || 'عام'}</td>
                                  <td className="p-3 font-mono text-amber-800 font-bold">{formatPrice(p.cost_price || 0)}</td>
                                  <td className="p-3 font-mono text-emerald-700 font-bold">{formatPrice(p.sale_price || 0)}</td>
                                  <td className="p-3 font-mono font-bold">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                                      stockQty <= 0 ? 'bg-rose-100 text-rose-800' : stockQty <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {stockQty} وحدة
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-slate-800">{formatPrice(stockValue)}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: INVENTORY LOGS (حركات وتحديثات البضاعة والسحب) */}
                {supplierDetailsTab === 'inventory_logs' && (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-right">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-800">إجمالي كميات التوريد والإضافة</span>
                          <PackagePlus className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-xl font-black text-emerald-700 font-mono my-1">
                          +{activeSupplierDetails.inventoryLogs?.filter((l: any) => (l.change_amount || 0) > 0).reduce((acc: number, l: any) => acc + (l.change_amount || 0), 0) || 0} قطعة
                        </div>
                        <p className="text-[10px] text-emerald-600">بضائع جديدة وتوريدات واردة للمخزن</p>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-right">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-rose-800">إجمالي كميات السحب والتوالف</span>
                          <PackageMinus className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="text-xl font-black text-rose-700 font-mono my-1">
                          {activeSupplierDetails.inventoryLogs?.filter((l: any) => (l.change_amount || 0) < 0).reduce((acc: number, l: any) => acc + (l.change_amount || 0), 0) || 0} قطعة
                        </div>
                        <p className="text-[10px] text-rose-600">سحب من المخزن أو تالف معتمد</p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-right">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-800">إجمالي عمليات التحديث</span>
                          <History className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-xl font-black text-blue-700 font-mono my-1">
                          {activeSupplierDetails.inventoryLogs?.length || 0} حركة
                        </div>
                        <p className="text-[10px] text-blue-600">سجل كامل للتوريد والسحب والتعديل (بدون مبيعات التجزئة)</p>
                      </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="ابحث باسم المنتج، السبب، الملاحظة..."
                          value={supplierLogSearch}
                          onChange={(e) => setSupplierLogSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                        <button
                          type="button"
                          onClick={() => setSupplierLogTypeFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            supplierLogTypeFilter === 'all'
                              ? 'bg-slate-800 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          الكل ({activeSupplierDetails.inventoryLogs?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSupplierLogTypeFilter('additions')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            supplierLogTypeFilter === 'additions'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          🟢 توريد وإضافة ({activeSupplierDetails.inventoryLogs?.filter((l: any) => (l.change_amount || 0) > 0).length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSupplierLogTypeFilter('withdrawals')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            supplierLogTypeFilter === 'withdrawals'
                              ? 'bg-rose-600 text-white'
                              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                          }`}
                        >
                          🔴 سحب وتوالف ({activeSupplierDetails.inventoryLogs?.filter((l: any) => (l.change_amount || 0) < 0).length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSupplierLogTypeFilter('updates')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            supplierLogTypeFilter === 'updates'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                          }`}
                        >
                          🔵 تحديثات وتعديلات ({activeSupplierDetails.inventoryLogs?.filter((l: any) => (l.change_amount || 0) === 0 || (l.reason && (l.reason.includes('تحديث') || l.reason.includes('تعديل') || l.reason === 'manual_update' || l.reason === 'edit_product' || l.reason === 'initial_stock' || l.reason === 'new_product'))).length || 0})
                        </button>
                      </div>
                    </div>

                    {/* Logs Table */}
                    {filteredSupplierLogs.length === 0 ? (
                      <div className="bg-slate-50 rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-100">
                        لا توجد حركات تحديث أو توريد أو سحب مسجلة لبضائع هذا المورد مطابقة للبحث المحدد.
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-2xl">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <th className="p-3">التاريخ والوقت</th>
                              <th className="p-3">المنتج / الصنف</th>
                              <th className="p-3 text-center">نوع الحركة</th>
                              <th className="p-3 text-center">الكمية والتغيير</th>
                              <th className="p-3">البيان والسبب / تفاصيل التعديل</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSupplierLogs.map((log: any, idx: number) => {
                              const change = log.change_amount || 0;
                              const isInitial = log.reason && (log.reason.includes('افتتاحي') || log.reason.includes('إضافة أولى') || log.reason.includes('جديد') || log.reason === 'initial_stock' || log.reason === 'new_product' || log.reason === 'initial');
                              const isAddition = change > 0 && !isInitial;
                              const isWithdrawal = change < 0 || log.reason === 'manual_withdraw';
                              const arabicReason = getInventoryLogReasonArabic(log.reason, log.change_amount, log.notes);

                              return (
                                <tr key={`sup-log-${log.id || idx}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                                    <div>{new Date(log.created_at).toLocaleDateString('ar-SA')}</div>
                                    <div className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                                  </td>
                                  <td className="p-3 font-bold text-slate-800">
                                    <div>{log.productName}</div>
                                    <div className="text-[10px] text-slate-400 font-normal font-mono">{log.barcode ? `باركود: ${log.barcode}` : (log.category || 'عام')}</div>
                                  </td>
                                  <td className="p-3 text-center whitespace-nowrap">
                                    {isInitial ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                        <Package className="w-3 h-3" />
                                        <span>رصيد افتتاحي / صنف جديد</span>
                                      </span>
                                    ) : isAddition ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <PackagePlus className="w-3 h-3" />
                                        <span>توريد / زيادة كمية</span>
                                      </span>
                                    ) : isWithdrawal ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        <PackageMinus className="w-3 h-3" />
                                        <span>سحب من المخزن / تالف</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                        <RefreshCw className="w-3 h-3" />
                                        <span>تحديث بيانات / أسعار</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center whitespace-nowrap font-mono">
                                    {log.old_quantity !== undefined && log.new_quantity !== undefined ? (
                                      <div className="flex items-center justify-center gap-1.5 text-xs">
                                        <span className="text-slate-400">{log.old_quantity}</span>
                                        <span className="text-slate-300">➔</span>
                                        <span className="font-bold text-slate-800">{log.new_quantity}</span>
                                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                          isAddition ? 'text-emerald-700 bg-emerald-50' : isWithdrawal ? 'text-rose-700 bg-rose-50' : isInitial ? 'text-purple-700 bg-purple-50' : 'text-slate-600 bg-slate-100'
                                        }`}>
                                          ({isAddition ? `+${change}` : change})
                                        </span>
                                      </div>
                                    ) : (
                                      <span className={`font-bold ${isAddition ? 'text-emerald-600' : isWithdrawal ? 'text-rose-600' : 'text-slate-700'}`}>
                                        {isAddition ? `+${change}` : change} وحدة
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-700 max-w-xs">
                                    <div className="font-bold text-slate-800">{arabicReason}</div>
                                    {log.notes && log.notes !== log.reason && log.notes !== 'manual_update' && log.notes !== 'edit_product' && (
                                      <div className="text-[11px] text-slate-500 mt-0.5 whitespace-pre-wrap">{log.notes}</div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PAYMENTS */}
                {supplierDetailsTab === 'payments' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800">سجل الدفعات المالية المسلمة للمورد</h4>
                      <span className="text-xs font-bold text-emerald-700">
                        إجمالي المسدد: {formatPrice(activeSupplierDetails.totalPaid)}
                      </span>
                    </div>

                    {activeSupplierDetails.payments.length === 0 ? (
                      <div className="bg-slate-50 rounded-2xl p-8 text-center text-xs text-slate-400">
                        لم يتم تسجيل أي دفعات مالية مسددة لهذا المورد حتى الآن.
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-2xl">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <th className="p-3">تاريخ الدفعة</th>
                              <th className="p-3">المبلغ المسدد</th>
                              <th className="p-3">البيان والملاحظات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeSupplierDetails.payments.map((pmt: any, idx: number) => (
                              <tr key={`sup-pmt-${pmt.id || idx}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-mono text-slate-700">
                                  {new Date(pmt.payment_date).toLocaleDateString('ar-SA')} {new Date(pmt.payment_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3 font-mono font-bold text-emerald-700 text-sm">
                                  {formatPrice(pmt.amount)}
                                </td>
                                <td className="p-3 text-slate-600">
                                  {pmt.notes || 'تسديد دفعة حساب'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  الرصيد المتبقي: <strong className="font-mono text-amber-900">{formatPrice(activeSupplierDetails.balance)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSupplierForDetails(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visual Models Extension Component (Market Basket, Profit Scatter, Credit Risk, Cashflow Waterfall) */}
      <VisualModelsExtension 
        products={products}
        customers={customers}
        sales={sales}
        saleItems={saleItems}
        debts={debts}
        withdrawals={cashWithdrawals}
        formatPrice={formatPrice}
      />

      <SmartAdvisorModal
        isOpen={isSmartAdvisorModalOpen}
        onClose={() => setIsSmartAdvisorModalOpen(false)}
        products={products}
        customers={customers}
        sales={sales}
        saleItems={saleItems}
        debts={debts}
        withdrawals={cashWithdrawals}
        formatPrice={formatPrice}
        currency={currency}
        onOpenAnomalyModal={(type) => setAnomalyModalType(type as any)}
        initialQuery={advisorInitialQuery}
        onClearInitialQuery={() => setAdvisorInitialQuery(null)}
      />
{/* Floating Action Button - Opens Full Smart Advisor Directly (hidden when modal is open) */}
      {!isSmartAdvisorModalOpen && (
        <button
          type="button"
          onClick={() => setIsSmartAdvisorModalOpen(true)}
          className="fixed bottom-6 right-4 sm:right-8 w-15 h-15 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 z-50 border-4 border-slate-900 group bg-gradient-to-tr from-indigo-600 via-indigo-600 to-amber-500 text-white hover:scale-110 shadow-indigo-600/50 hover:shadow-indigo-500/70"
          title="فتح المساعد الذكي"
        >
          <div className="relative flex items-center justify-center">
            <Brain className="w-7 h-7 text-white drop-shadow-md animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
            </span>
          </div>
        </button>
      )}

      {/* Modal 1: Stages Analysis Modal */}
      <AnimatePresence>
        {isStagesModalOpen && (
          <div key="modal-stages-analysis" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 text-amber-300 rounded-2xl shrink-0">
                    <Brain className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>🔍 مراحل التحليل والتفكير الذكي</span>
                      <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-400/30 font-bold">
                        4 مراحل
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      محرك التفكير الاستشاري المسلسل الذي يمر به المستشار للوصول لإجابة محاسبية دقيقة 100%
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsStagesModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
                {/* Visual Pipeline Bar */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 flex flex-col items-center">
                    <span className="text-[10px] font-black text-indigo-400 mb-0.5">مرحلة 1</span>
                    <span className="text-[11px] font-bold">فهم النية</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 flex flex-col items-center">
                    <span className="text-[10px] font-black text-amber-400 mb-0.5">مرحلة 2</span>
                    <span className="text-[11px] font-bold">جلب البيانات</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200 flex flex-col items-center">
                    <span className="text-[10px] font-black text-rose-400 mb-0.5">مرحلة 3</span>
                    <span className="text-[11px] font-bold">التدقيق المالي</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 flex flex-col items-center">
                    <span className="text-[10px] font-black text-emerald-400 mb-0.5">مرحلة 4</span>
                    <span className="text-[11px] font-bold">الصياغة والتوجيه</span>
                  </div>
                </div>

                {/* Detailed Stage Steps */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-indigo-900/50 flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 font-bold text-xs">
                      1
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-indigo-300 text-xs">مرحلة الفهم والنية (NLU Intent Engine)</h4>
                        <span className="text-[9px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-700/50">اكتمال</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        تحليل النص العربي المدخل، استخراج المفاهيم المحاسبية (مثل: المبيعات، المصروفات، أرصدة العملاء، المخزون، أو صافي الأرباح)، وتحديد المعلمات الزمانية المحددة.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-amber-900/50 flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-amber-300 text-xs">مرحلة جلب وتكشيف قاعدة البيانات المحليه (DB Indexing)</h4>
                        <span className="text-[9px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-md border border-amber-700/50">مستمر</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        الاستعلام المباشر والسريع من جداول السجل اليومي، المستودعات، والمدينين المسجلة محلية بدون إرسال أي أرقام حساسة لجهات خارجية.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-rose-900/50 flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 font-bold text-xs">
                      3
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-rose-300 text-xs">مرحلة التدقيق ومطابقة المعادلات (Audit & Balance Guard)</h4>
                        <span className="text-[9px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded-md border border-rose-700/50">صرامة دقيقة</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        التحقق من توازن المعادلة المحاسبية الأساسية (الأصول = الالتزامات + حقوق الملكية) ومنع حدوث أي تخمينات عشوائية عبر الحسابات.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-emerald-900/50 flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 font-bold text-xs">
                      4
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-emerald-300 text-xs">مرحلة الصياغة والتوصيات المحاسبية (Executive Synthesis)</h4>
                        <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-700/50">جاهز للتنفيذ</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        تحويل النتائج المالية المعقدة إلى تقرير استشاري واضح ومدعم بأرقام ونسب دقيقة وتوصيات تشغيلية مباشرة لإدارة محلك.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10.5px] text-slate-400">نظام تحليل تحاوري محلي آمن 100%</span>
                <button
                  type="button"
                  onClick={() => setIsStagesModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  فهمت ذلك
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Question Bank Modal */}
      <AnimatePresence>
        {isQuestionBankModalOpen && (
          <div key="modal-question-bank" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-2xl shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white">✨ بنك الأسئلة والاستفسارات الذكية</h3>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                        {COMPREHENSIVE_QUICK_QUESTIONS.length} سؤال متوفر
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-200/80 font-medium mt-0.5">
                      اختر أي سؤال بضغطة واحدة للحصول على تقرير محاسبي فوري وتحليل متعمق
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuestionBankModalOpen(false)}
                  className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Tabs & Search Bar Header */}
              <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={quickQuestionFilter}
                    onChange={(e) => setQuickQuestionFilter(e.target.value)}
                    placeholder="ابحث في الأسئلة (مثال: الأرباح، الديون، الأكثر مبيعاً، الخسائر)..."
                    className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-8 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                  />
                  {quickQuestionFilter && (
                    <button
                      type="button"
                      onClick={() => setQuickQuestionFilter('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Buttons Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {QUICK_QUESTION_CATEGORIES.map((cat, idx) => {
                    const isSelected = selectedQuickCategory === cat.id;
                    const count = cat.id === 'all' 
                      ? COMPREHENSIVE_QUICK_QUESTIONS.length 
                      : COMPREHENSIVE_QUICK_QUESTIONS.filter(q => q.category === cat.id).length;
                    return (
                      <button
                        key={`quick-cat-btn-${cat.id || idx}-${idx}`}
                        type="button"
                        onClick={() => setSelectedQuickCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 border shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Questions Cards Grid */}
              <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {COMPREHENSIVE_QUICK_QUESTIONS
                    .filter(q => {
                      const matchCat = selectedQuickCategory === 'all' || q.category === selectedQuickCategory;
                      const matchSearch = !quickQuestionFilter.trim() || 
                        q.question.includes(quickQuestionFilter.trim()) || 
                        q.shortTitle.includes(quickQuestionFilter.trim()) || 
                        q.description.includes(quickQuestionFilter.trim());
                      return matchCat && matchSearch;
                    })
                    .map((q, idx) => {
                      const colorMap = {
                        emerald: 'bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200/90 hover:border-emerald-300',
                        rose: 'bg-rose-50/80 hover:bg-rose-100/90 text-rose-950 border-rose-200/90 hover:border-rose-300',
                        amber: 'bg-amber-50/80 hover:bg-amber-100/90 text-amber-950 border-amber-200/90 hover:border-amber-300',
                        sky: 'bg-sky-50/80 hover:bg-sky-100/90 text-sky-950 border-sky-200/90 hover:border-sky-300',
                        indigo: 'bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-950 border-indigo-200/90 hover:border-indigo-300',
                        purple: 'bg-purple-50/80 hover:bg-purple-100/90 text-purple-950 border-purple-200/90 hover:border-purple-300',
                      };
                      const badgeColorMap = {
                        emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        rose: 'bg-rose-100 text-rose-800 border-rose-200',
                        amber: 'bg-amber-100 text-amber-800 border-amber-200',
                        sky: 'bg-sky-100 text-sky-800 border-sky-200',
                        indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                        purple: 'bg-purple-100 text-purple-800 border-purple-200',
                      };

                      return (
                        <button
                          key={`quick-q-btn-${q.id || idx}-${idx}`}
                          type="button"
                          onClick={() => {
                            setAdvisorInitialQuery(q.question);
                            setIsSmartAdvisorModalOpen(true);
                            setIsQuestionBankModalOpen(false);
                          }}
                          className={`flex flex-col justify-between p-3 rounded-2xl border text-right cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${colorMap[q.themeColor]}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-2">
                              <span className="text-xl">{q.icon}</span>
                              <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md border ${badgeColorMap[q.themeColor]}`}>
                                {q.badge}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 mb-1 leading-snug">{q.shortTitle}</h4>
                            <p className="text-[10.5px] text-slate-600 leading-relaxed line-clamp-2">
                              {q.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-900/10 flex items-center justify-between text-[10px] font-bold text-indigo-700">
                            <span>طرح السؤال الآن</span>
                            <span>←</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                  انقر على أي سؤال لإطلاقه فوراً في الشات الذكي
                </span>
                <button
                  type="button"
                  onClick={() => setIsQuestionBankModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DailyLogModal
        showDailyLogModal={showDailyLogModal}
        setShowDailyLogModal={setShowDailyLogModal}
        dailySalesBreakdown={dailySalesBreakdown}
        formatPrice={formatPrice}
      />
      <CustomerReceivablesModal
        showCustomerReceivablesModal={showCustomerReceivablesModal}
        setShowCustomerReceivablesModal={setShowCustomerReceivablesModal}
        customerSalesBreakdown={customerSalesBreakdown}
        formatPrice={formatPrice}
        totalSales={performanceKPIs.salesTotal}
      />

      <AnomalyReviewModal
        isOpen={anomalyModalType !== null}
        onClose={() => setAnomalyModalType(null)}
        anomalyType={anomalyModalType}
        cashWithdrawals={cashWithdrawals}
        sales={sales}
        products={products}
        formatPrice={formatPrice}
        currency={currency}
        onResolveAnomaly={handleResolveAnomaly}
      />

    </motion.div>
  );
}
