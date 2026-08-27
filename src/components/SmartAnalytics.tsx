import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from '../hooks/useLiveQuery';
import { db } from '../db';
import { processUserQuery } from '../services/ai/aiRouter';
import { preloadTrainingData } from '../services/ai/engine/trainingManager';
import VisualModelsExtension from './VisualModelsExtension';
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
  Maximize2
} from 'lucide-react';

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
            <div key={i} className="bg-slate-900/95 border border-indigo-900/40 rounded-xl p-2.5 space-y-1.5 shadow-xs">
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

export default function SmartAnalytics({ currency, formatPrice, onGoBack }: SmartAnalyticsProps) {
  // --- State for filter controls ---
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'month' | 'all'>('30days');
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
  const [dailySearchKey, setDailySearchKey] = useState('');
  const [customerSearchKey, setCustomerSearchKey] = useState('');

  // --- Subscribing to live DB data ---
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const debts = useLiveQuery(() => db.debts.toArray()) || [];
  const salesSettlements = useLiveQuery(() => db.salesSettlements?.toArray() || Promise.resolve([])) || [];
  const cashWithdrawals = useLiveQuery(() => db.cashWithdrawals?.toArray() || Promise.resolve([])) || [];
  const storeNameSetting = useLiveQuery(() => db.settings.where('key').equals('storeName').first());
  
  const storeName = storeNameSetting?.value || 'المخزن الذكي';

  // --- AI Smart Assistant State (100% Offline Local Machine Learning Engine) ---
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string; stages?: any[]; timestamp: Date }[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => 'session_' + Date.now());
  const [isTyping, setIsTyping] = useState(false);
  const [ratedMessages, setRatedMessages] = useState<{[key: string]: 'up' | 'down'}>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
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
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleResetChat = async () => {
    try {
      const { deleteConversation, createNewConversation } = await import('../services/ai/memory');
      if (activeConversationId) {
        await deleteConversation(activeConversationId);
      }
      const newId = await createNewConversation();
      setActiveConversationId(newId);
    } catch (err) {
      console.warn('Failed to clear conversation session memory:', err);
      setActiveConversationId('session_' + Date.now());
    }
    setChatMessages([]);
    setRatedMessages({});
    setChatInput('');
  };

  const handleDeleteMessage = (id: string) => {
    setChatMessages(prev => prev.filter(msg => msg.id !== id));
  };

  // --- Local Machine Learning state & calculations ---
  const [learningRefreshKey, setLearningRefreshKey] = useState(0);

  const mlLearningData = useMemo(() => {
    // 1. Math Model: Linear Regression forecasting for sales
    const dailySalesMap: { [key: string]: number } = {};
    sales.forEach(s => {
      if (!s.created_at) return;
      const d = new Date(s.created_at);
      if (isNaN(d.getTime())) return;
      const dateStr = d.toISOString().split('T')[0];
      dailySalesMap[dateStr] = (dailySalesMap[dateStr] || 0) + s.total_amount;
    });

    const sortedDates = Object.keys(dailySalesMap).sort();
    const regressionPoints = sortedDates.map((date, idx) => ({
      x: idx,
      y: dailySalesMap[date]
    }));

    let slope = 0;
    let intercept = 0;
    const n = regressionPoints.length;
    if (n >= 2) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      regressionPoints.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
      });
      const denominator = (n * sumXX) - (sumX * sumX);
      if (denominator !== 0) {
        slope = ((n * sumXY) - (sumX * sumY)) / denominator;
        intercept = (sumY - (slope * sumX)) / n;
      }
    }

    // Determine growth trend classification
    let trendClassification: 'growing' | 'stable' | 'declining' = 'stable';
    if (slope > 10) trendClassification = 'growing';
    else if (slope < -10) trendClassification = 'declining';

    // 2. Market Basket Association Rule Mining (Product Correlations)
    const basketMap: { [key: string]: string[] } = {};
    saleItems.forEach(item => {
      if (!basketMap[item.sale_id]) {
        basketMap[item.sale_id] = [];
      }
      const prod = products.find(p => p.id === item.product_id);
      if (prod && !basketMap[item.sale_id].includes(prod.name)) {
        basketMap[item.sale_id].push(prod.name);
      }
    });

    const coOccurrencePairs: { [key: string]: number } = {};
    const singleProductCounts: { [key: string]: number } = {};

    Object.values(basketMap).forEach(items => {
      items.forEach(it => {
        singleProductCounts[it] = (singleProductCounts[it] || 0) + 1;
      });
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pairKey = [items[i], items[j]].sort().join(' 🤝 ');
          coOccurrencePairs[pairKey] = (coOccurrencePairs[pairKey] || 0) + 1;
        }
      }
    });

    const associatedPairs = Object.entries(coOccurrencePairs)
      .map(([pair, count]) => {
        const [p1, p2] = pair.split(' 🤝 ');
        const support = count;
        const confidenceP1ToP2 = support / (singleProductCounts[p1] || 1);
        const confidenceP2ToP1 = support / (singleProductCounts[p2] || 1);
        const maxConfidence = Math.max(confidenceP1ToP2, confidenceP2ToP1);
        return { pair, count, maxConfidence };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 3. User feedback & learned metrics from localStorage
    const savedStateStr = localStorage.getItem('smart_analytics_learning_v1');
    const savedState = savedStateStr ? JSON.parse(savedStateStr) : {
      thumbsUp: 0,
      thumbsDown: 0,
      queriesProcessed: 0,
      mostQueriedCategory: 'sales',
      categoryScores: { sales: 0, inventory: 0, debt: 0, cash: 0, advice: 0 }
    };

    // Calculate Store Health Score dynamically
    const totalSalesSum = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalDebtSum = customers.reduce((sum, c) => sum + c.balance, 0);
    const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;
    
    let storeHealthScore = 100;
    if (totalSalesSum > 0) {
      const debtRatio = totalDebtSum / totalSalesSum;
      if (debtRatio > 0.4) storeHealthScore -= 20;
      else if (debtRatio > 0.2) storeHealthScore -= 10;
    }
    if (products.length > 0) {
      const outOfStockRatio = outOfStockCount / products.length;
      if (outOfStockRatio > 0.3) storeHealthScore -= 20;
      else if (outOfStockRatio > 0.1) storeHealthScore -= 10;
    }
    storeHealthScore = Math.max(50, storeHealthScore);

    return {
      slope,
      trendClassification,
      associatedPairs,
      savedState,
      storeHealthScore
    };
  }, [sales, saleItems, products, customers, learningRefreshKey]);

  const recordQueryCategory = (category: 'sales' | 'inventory' | 'debt' | 'cash' | 'advice') => {
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

  const resolveSmartQuery = async (query: string): Promise<{ answer: string; stages?: any[] } | string> => {
    try {
      const aiResponse = await processUserQuery(query, activeConversationId);
      if (aiResponse && aiResponse.answer && aiResponse.confidence >= 0.2) {
        return {
          answer: aiResponse.answer,
          stages: aiResponse.processingStages
        };
      } else {
        return { answer: 'عذراً، لم أتمكن من فهم طلبك بدقة كافية. يرجى توضيح سؤالك.' };
      }
    } catch (err) {
      console.warn('AI Engine Router error:', err);
      return { answer: 'عذراً، أواجه مشكلة في معالجة طلبك محلياً.' };
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    if (!textToSend) {
      setChatInput('');
    }

    // Add user message
    const newUserMessage = {
      id: 'user-' + Date.now(),
      role: 'user' as const,
      text: query,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    // Hybrid Execution Engine (Online Gemini 2.5 Flash Cloud RAG + 100% Offline Local Engine Fallback)
    setTimeout(async () => {
      try {
        const responseObj = await resolveSmartQuery(query);
        const text = typeof responseObj === 'string' ? responseObj : responseObj.answer;
        const defaultStages = [
          {
            stageNumber: 1,
            title: 'فهم القصد وتفكيك الاستعلام (NLU)',
            description: 'تحليل الاستعلام واستخراج القصد الرئيسي محلياً',
            status: 'completed',
            badge: 'NLU محلي',
            details: `• النص المدخل: "${query}"`
          },
          {
            stageNumber: 2,
            title: 'استرجاع البيانات الحقيقية والسياق (DB)',
            description: 'سحب السجلات والبيانات المسجلة من IndexedDB',
            status: 'completed',
            badge: 'IndexedDB',
            details: '• تم استرداد كافة القوائم المالية والمبيعات.'
          },
          {
            stageNumber: 3,
            title: 'التحليل الذكي وتطابق الأرقام (Audit)',
            description: 'حساب المؤشرات ورصد الأسباب والفوارق التشخيصية',
            status: 'completed',
            badge: 'تدقيق ذكي',
            details: '• تم إجراء عملية المطابقة الحسابية بنجاح.'
          },
          {
            stageNumber: 4,
            title: 'صياغة الإجابة المباشرة الموثوقة (Synthesis)',
            description: 'إخراج التقرير الفوري وتوصيات الحلول',
            status: 'completed',
            badge: 'جاهز',
            details: 'تم إخراج الإجابة النهائية.'
          }
        ];
        const stages = typeof responseObj === 'object' && responseObj.stages && responseObj.stages.length > 0
          ? responseObj.stages
          : defaultStages;

        setChatMessages(prev => [...prev, {
          id: 'assistant-' + Date.now(),
          role: 'assistant' as const,
          text,
          stages,
          timestamp: new Date()
        }]);
      } catch (error: any) {
        setChatMessages(prev => [...prev, {
          id: 'error-' + Date.now(),
          role: 'assistant' as const,
          text: `⚠️ **حدث خطأ أثناء معالجة الاستفسار:**\n${error.message || String(error)}`,
          timestamp: new Date()
        }]);
      } finally {
        setIsTyping(false);
      }
    }, 250);
  };

  const formatInlineStyles = (rawText: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(rawText.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-black text-amber-300 mx-0.5">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < rawText.length) {
      parts.push(rawText.substring(lastIndex));
    }
    return parts.length > 0 ? parts : rawText;
  };

  const formatAssistantMessage = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line.trim();
      if (!content) return <div key={idx} className="h-2" />;

      // Match markdown headers like ### or ## or #
      if (content.startsWith('###') || content.startsWith('##') || content.startsWith('#')) {
        const titleText = content.replace(/^#+\s*/, '');
        return (
          <div key={idx} className="mt-3.5 mb-2 first:mt-0" dir="rtl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 via-indigo-500/15 to-transparent border-r-4 border-amber-400 rounded-xl text-amber-300 font-black text-xs sm:text-sm shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
              <span>{titleText}</span>
            </div>
          </div>
        );
      }

      // Check for prominent header lines with emojis
      if (/^(🔒|📊|🏬|📋|✨|💡|🩺|⚠️|✅|📦|👥|💵|🧠|🔮|🛡️|🚨|📌|🎯|🏆|🏷️|🔄)\s+/.test(content)) {
        return (
          <div key={idx} className="mt-3 mb-1.5 first:mt-0 font-black text-xs sm:text-sm text-amber-300 flex items-center gap-2 border-b border-indigo-500/20 pb-1" dir="rtl">
            <span>{formatInlineStyles(content)}</span>
          </div>
        );
      }

      // Check if it is a numbered list item like "1.", "2."
      const numberedMatch = content.match(/^(\d+)[\.\-\)]\s+(.*)/);
      if (numberedMatch) {
        const num = numberedMatch[1];
        const rest = numberedMatch[2];
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1.5 p-2.5 bg-slate-950/60 hover:bg-slate-950/80 border border-white/5 rounded-2xl transition-colors text-xs leading-relaxed" dir="rtl">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-indigo-400/30">
              {num}
            </span>
            <div className="flex-1 text-slate-100 font-medium">
              {formatInlineStyles(rest)}
            </div>
          </div>
        );
      }

      // Check if it is a bullet list item (- , * , •)
      const isListItem = content.startsWith('-') || content.startsWith('*') || content.startsWith('•');
      if (isListItem) {
        let cleanText = content.replace(/^[-*•]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 my-1.5 pr-1.5 text-xs leading-relaxed text-slate-100" dir="rtl">
            <span className="text-teal-400 select-none font-bold mt-1 shrink-0 text-[10px]">◆</span>
            <div className="flex-1 font-medium">
              {formatInlineStyles(cleanText)}
            </div>
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={idx} className="my-1.5 leading-relaxed text-xs text-slate-100 text-right font-medium" dir="rtl">
          {formatInlineStyles(content)}
        </p>
      );
    });
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
  const smartAIRecommendations = useMemo(() => {
    const list: Array<{ 
      id: number; 
      type: 'success' | 'warning' | 'info'; 
      title: string; 
      desc: string; 
      actionLabel?: string;
      anomalyKey?: 'withdrawals' | 'odd_hours_sales' | 'pricing';
    }> = [];

    // 1. Profit Margin alert
    const margin = performanceKPIs.profitMarginPercent;
    if (margin > 0) {
      if (margin < 15) {
        list.push({
          id: 1,
          type: 'warning',
          title: 'تدني هامش الربح الإجمالي للمحل',
          desc: `هامش الربح المسجل حالياً هو ${margin.toFixed(1)}% وهو منخفض. ينصح بمراجعة فواتير شراء السلع وتعديل أسعار بيع الفئات الأقل ربحاً لضمان تغطية التكاليف التشغيلية.`
        });
      } else if (margin >= 25) {
        list.push({
          id: 1,
          type: 'success',
          title: 'هامش أرباح ممتاز ومستدام',
          desc: `متوسط جودة وتسعير بضائعك تولد هامش ربح ${margin.toFixed(1)}% وهو ممتاز ومطابق لمعايير الأسواق الناجحة.`
        });
      } else {
        list.push({
          id: 1,
          type: 'info',
          title: 'هامش الربح مستقر وضمن الحدود الطبيعية',
          desc: `يسجل المحل هامش ربح يقارب ${margin.toFixed(1)}%. استمر في تحسين تسعير المبيعات الموسمية لزيادة العوائد.`
        });
      }
    }

    // 2. Debt versus Liquidity Warning
    const totalSales = performanceKPIs.salesTotal;
    const debtSales = performanceKPIs.debtSalesTotal;
    if (totalSales > 0) {
      const debtRatio = (debtSales / totalSales) * 100;
      if (debtRatio > 35) {
        list.push({
          id: 2,
          type: 'warning',
          title: 'ارتفاع في مبيعات الديون والذمم (البيع الآجل)',
          desc: `البيع الآجل يمثل ${debtRatio.toFixed(1)}% من مجمل المبيعات. قد تسبب هذه النسبة نقصاً في السيولة الكاش الصالحة للجرد الفوري. ينصح بكبح حدود الديون وطلب تسديدات للزبائن الممتنعين.`
        });
      } else if (debtRatio < 10) {
        list.push({
          id: 2,
          type: 'success',
          title: 'سيولة مالية فائقة الدقة بالصندوق',
          desc: `تشكل البيوع النقدية (الكاش والبطاقات الفورية) أكثر من ${(100 - debtRatio).toFixed(1)}% من المبيعات وهو ما يحافظ على حركة الصندوق وسهولة شراء مخزون بديل بشكل مستدام.`
        });
      }
    }

    // 3. Low stock critical visual forecast
    const lowStockCount = products.filter(p => p.stock_quantity <= 5).length;
    if (lowStockCount > 0) {
      list.push({
        id: 3,
        type: 'warning',
        title: `هناك سلع ومواد موشكة على النفاد بالمستودع`,
        desc: `يوجد حالياً عدد ${lowStockCount} منتج تقل كمية مخزونهم عن 5 قطع في الرف وممنوع انقطاعهم. يرجى المسارعة في توريد قطع بديلة لتفادي فقدان الزبائن.`
      });
    }

    // 4. Cash Settle discrepancies alert
    if (performanceKPIs.totalDeficitAmount > 0) {
      list.push({
        id: 4,
        type: 'warning',
        title: 'رصد فجوة وتناقضات كاش بصندوق الدرج الرئيسي',
        desc: `سجلت المطابقات الأخيرة عجزاً تراكمياً مقداره ${formatPrice(performanceKPIs.totalDeficitAmount)}. يرجى تفعيل تتبع سلفة ومسحوبات أمناء الصناديق بدقة ومطابقة الفواتير أولاً بأول.`
      });
    } else {
      list.push({
        id: 4,
        type: 'success',
        title: 'امتثال وانضباط تام في صندوق النقد كاش',
        desc: 'لم يتم رصد أي فجوات عجز نقدية ملموسة في مطابقات الفترة السابقة. جرد الدرج متطابق تماماً ويعزز ثبات أرباحك الصافية.'
      });
    }

    // 5. Expiry Date Alerts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    let expiredStock = 0;
    let expiringStock = 0;
    
    products.forEach(p => {
      if ((p as any).expiration_date) {
        const expDate = new Date((p as any).expiration_date);
        if (expDate < today) expiredStock++;
        else if (expDate <= thirtyDays) expiringStock++;
      }
    });

    if (expiredStock > 0) {
      list.push({
        id: 5,
        type: 'warning',
        title: 'عاجل: توجد منتجات منتهية الصلاحية',
        desc: `تحذير هام! هناك ${expiredStock} منتج في المستودع انتهت صلاحيتهم الفعّالة. يجب استبعادهم فوراً من الرفوف لمنع بيعها للزبائن بالخطأ.`
      });
    } else if (expiringStock > 0) {
      list.push({
        id: 5,
        type: 'info',
        title: 'منتجات قاربت على الانتهاء',
        desc: `يوجد ${expiringStock} منتجات ستنتهي صلاحيتها خلال الـ 30 يوماً القادمة. يُنصح بعمل عروض ترويجية فورية أو خصومات (التصفية) لتسريع بيعها قبل خسارتها.`
      });
    }

    // 6. Least selling products optimization
    if (topProductsChart.length > 5) {
      // Products with least revenue
      const sortedByLeastRevenue = [...topProductsChart].sort((a, b) => a.revenue - b.revenue);
      const leastSelling = sortedByLeastRevenue.slice(0, 3).map(p => p.name).join('، ');
      
      list.push({
        id: 6,
        type: 'info',
        title: 'توصيات لإنعاش المنتجات الأقل مبيعاً',
        desc: `لاحظ النظام ضعف حركة البيع للمنتجات: (${leastSelling}). كإجراء تصحيحي، اقرنها كباقات مع السلع الأكثر مبيعاً أو قدم عروض (اشتر واحد والثاني بنصف السعر) لتسريع دوران المخزون وتحريك رأس المال المعطل.`
      });
    }

    // 7. System Tracking & Velocity
    const velocity = performanceKPIs.salesTotal / Math.max(performanceKPIs.transactionsCount, 1);
    if (velocity > 100) {
       list.push({
        id: 7,
        type: 'success',
        title: 'مؤشر ممتاز لمتوسط سلة المشتريات للزبائن',
        desc: `حركة النظام توضح أن متوسط سلة المشتريات للفاتورة الواحدة يبلغ ${formatPrice(velocity)}. هذا يعكس قوة شرائية ممتازة. فكر في إرساء برنامج نقاط ولاء للاحتفاظ بهؤلاء الزبائن المميزين.`
       });
    } else if (velocity > 0 && velocity < 15) {
       list.push({
        id: 7,
        type: 'info',
        title: 'ضعف في حجم سلة الزبون الشرائية',
        desc: `متوسط إنفاق الزبون في الفاتورة الواحدة هو ${formatPrice(velocity)}. لتحسين المبيعات، درب الكاشير على اقتراح منتجات مكملة (البيع المتقاطع) قبل الدفع.`
       });
    }

    // 8. Advanced Pricing and Low Profit Margin Stock Check
    if (!resolvedAnomalies.includes('pricing')) {
      const lowMarginProducts = products.filter(p => {
        const margin = p.sale_price - p.cost_price;
        return p.cost_price > 0 && (margin <= 0 || (margin / p.sale_price) < 0.1);
      });
      if (lowMarginProducts.length > 0) {
        const negativeProfit = lowMarginProducts.filter(p => p.sale_price < p.cost_price);
        const thinMargin = lowMarginProducts.filter(p => p.sale_price >= p.cost_price);
        
        let descText = '';
        if (negativeProfit.length > 0) {
          descText += `⚠️ رصد عدد ${negativeProfit.length} منتج مسعر بالخسارة (سعر البيع أقل من التكلفة): (${negativeProfit.slice(0, 3).map(p => p.name).join('، ')}). هذا يعني خسارة مؤكدة عند كل حركة بيع! `;
        }
        if (thinMargin.length > 0) {
          descText += `📉 رصد عدد ${thinMargin.length} منتج بهامش ربح ضئيل جداً أقل من 10%: (${thinMargin.slice(0, 3).map(p => p.name).join('، ')}). هذه الفئة تؤثر سلباً على متوسط ربحية المتجر ولا تغطي الأعباء التشغيلية.`;
        }
        list.push({
          id: 8,
          type: 'warning',
          title: '⚠️ كشف ثغرة تسعيرية في المخزون المضاف حديثاً',
          desc: descText,
          actionLabel: 'فحص وتعديل التسعير',
          anomalyKey: 'pricing'
        });
      }
    }

    // 9. Suspicious Cash Withdrawals Detection
    if (!resolvedAnomalies.includes('withdrawals')) {
      const suspiciousWithdrawals = cashWithdrawals.filter(w => {
        const isLarge = w.amount > 500;
        const reasonLower = (w.reason || '').toLowerCase();
        const isUnrecordedReason = !w.reason || w.reason.trim() === '' || reasonLower.includes('اخرى') || reasonLower.includes('سحب') || reasonLower.includes('بدون');
        const isAlreadyApproved = (w.reason || '').includes('تمت المطابقة والاعتماد');
        if (isAlreadyApproved) return false;
        return isLarge || isUnrecordedReason;
      });
      if (suspiciousWithdrawals.length > 0) {
        const largeWithdrawals = suspiciousWithdrawals.filter(w => w.amount > 500);
        const vagueWithdrawals = suspiciousWithdrawals.filter(w => !w.amount || w.amount <= 500);
        
        let descText = `رصد النظام عدد ${suspiciousWithdrawals.length} حركة سحب نقدي تستحق المراجعة والتدقيق: `;
        if (largeWithdrawals.length > 0) {
          descText += `💸 سحبيات مبالغ كبيرة تزيد عن 500 ريال بقيمة إجمالية ${formatPrice(largeWithdrawals.reduce((s, w) => s + w.amount, 0))}. `;
        }
        if (vagueWithdrawals.length > 0) {
          descText += `❓ سحبيات بدون سبب واضح ومفصل أو مسجلة تحت بنود مبهمة. `;
        }
        descText += `يوصى بمطابقتها مع سندات الصرف المعتمدة لضمان عدم تسرب الكاش.`;
        
        list.push({
          id: 9,
          type: 'warning',
          title: '🚨 تتبع مالي: مسحوبات نقدية (سحبيات) غير اعتيادية',
          desc: descText,
          actionLabel: 'تدقيق واعتماد السحبيات',
          anomalyKey: 'withdrawals'
        });
      }
    }

    // 10. Unexpected System Changes & Odd-Hour Operations
    if (!resolvedAnomalies.includes('odd_hours_sales')) {
      const anomalousSales = sales.filter(s => {
        const isReviewed = (s.notes || '').includes('تمت مراجعة');
        if (isReviewed) return false;
        const d = new Date(s.created_at);
        const hours = d.getHours();
        const isOddHour = hours >= 0 && hours < 5; // Midnight to 5 AM
        const isZeroAmount = s.total_amount <= 0;
        return isOddHour || isZeroAmount;
      });
      if (anomalousSales.length > 0) {
        const oddHourSales = anomalousSales.filter(s => {
          const h = new Date(s.created_at).getHours();
          return h >= 0 && h < 5;
        });
        const zeroAmountSales = anomalousSales.filter(s => s.total_amount <= 0);
        
        let descText = `تم رصد حركات غير متوقعة في نظام الفواتير: `;
        if (oddHourSales.length > 0) {
          descText += `🌙 عدد ${oddHourSales.length} عملية بيع تمت في ساعات متأخرة جداً بين منتصف الليل و5 صباحاً. `;
        }
        if (zeroAmountSales.length > 0) {
          descText += `💸 عدد ${zeroAmountSales.length} فاتورة مسجلة بقيمة صفرية أو سالبة. `;
        }
        descText += `يرجى مراجعة كاميرات المراقبة أو مطابقتها مع نوبات عمل الموظفين للتأكد من عدم وجود تلاعب.`;
        
        list.push({
          id: 10,
          type: 'warning',
          title: '⚠️ رصد حركات تشغيلية غير متوقعة في النظام',
          desc: descText,
          actionLabel: 'مراجعة وتأكيد الفواتير',
          anomalyKey: 'odd_hours_sales'
        });
      }
    }

    return list;
  }, [performanceKPIs, products, formatPrice, topProductsChart, cashWithdrawals, sales, salesSettlements, resolvedAnomalies]);

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
            ].map((p) => (
              <button
                key={p.id}
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
              {availableMonthsList.map(([monthKey, formattedName]) => (
                <option key={monthKey} value={monthKey}>{formattedName} ({monthKey})</option>
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
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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
              {customers.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name} {c.balance > 0 ? `(آجل: ${formatPrice(c.balance)})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Structured Grouped Metrics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel A: Operational & Sales Summary */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-black text-slate-800">
                لوحة الأداء التشغيلي وأعمال البيع والربحية
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">مؤشرات حية</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Sales Card */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400">إجمالي المبيعات المحققة</span>
              <div className="my-2 text-lg sm:text-xl font-black text-slate-800 font-mono">
                {formatPrice(performanceKPIs.salesTotal)}
              </div>
              <div className="text-[9px] font-bold text-slate-500">
                الحجم: <span className="font-extrabold text-indigo-600">{performanceKPIs.transactionsCount} عمليات</span>
              </div>
            </div>

            {/* Total Profit Card */}
            <div className="bg-emerald-50/30 border border-emerald-100/40 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-emerald-700">الأرباح التقريبية الصافية</span>
              <div className="my-2 text-lg sm:text-xl font-black text-emerald-700 font-mono">
                {formatPrice(performanceKPIs.profitTotal)}
              </div>
              <div className="text-[9px] font-bold text-emerald-800">
                معدل الهامش: <span className="font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">{performanceKPIs.profitMarginPercent.toFixed(1)}%</span>
              </div>
            </div>

            {/* Goods Cost Card */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400">قيمة السلع بسعر التكلفة (للمورد)</span>
              <div className="my-2 text-base sm:text-lg font-black text-slate-700 font-mono">
                {formatPrice(performanceKPIs.costTotal)}
              </div>
              <p className="text-[9px] text-slate-400 leading-none">مستحقات الشراء وتكلفة الرفوف</p>
            </div>

            {/* Average Order Value (AOV) Card */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400">متوسط قيمة الفاتورة المصدرة</span>
              <div className="my-2 text-base sm:text-lg font-black text-slate-700 font-mono">
                {formatPrice(performanceKPIs.avgOrderValue)}
              </div>
              <p className="text-[9px] text-slate-400 leading-none">معدل البيع لكل زبون بالعملية</p>
            </div>
          </div>
        </div>

        {/* Panel B: Drawer Cash & Liquidity Dynamics */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Wallet className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-black text-slate-800">
                حركة كاش الصندوق وحسابات السيولة والأرصدة الفورية
              </h3>
            </div>
            <span className="text-[10px] text-emerald-600 font-black">جرد وخزينة المبيعات</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Absolute Cash in Drawer */}
            <div className="bg-indigo-50/40 border border-indigo-100/40 p-4 rounded-2xl flex flex-col justify-between col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-700 flex items-center gap-1">
                  💸 نقدية صندوق الدرج الملموسة والجاهزة للجرد (Cash in Drawer)
                </span>
                <span className="text-[8px] bg-indigo-100 text-indigo-800 font-black rounded-sm px-1 leading-none uppercase">فعلي وحي</span>
              </div>
              <div className="my-2.5 text-xl sm:text-2xl font-black text-indigo-900 font-mono">
                {formatPrice(performanceKPIs.absoluteActualCashInDrawer)}
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                * يمثل الكاش المسلم بالدرج فعلياً. يعادل (كاش مبيعات + مدفوعات ديون) مطروحاً منه التسويات للملك والمسحوبات الشخصية.
              </p>
            </div>

            {/* Total Period Receipts */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400">مقبوضات نقداً (كاش + تحصيلات)</span>
              <div className="my-1 text-sm font-black text-slate-800 font-mono">
                {formatPrice(performanceKPIs.receivedCashInPeriod)}
              </div>
              <p className="text-[9px] text-slate-400">إجمالي النقدية الواردة الصندوق</p>
            </div>

            {/* Settlements to owner */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400">مصفى للدرج والمالك مسبقاً</span>
              <div className="my-1 text-sm font-black text-slate-800 font-mono">
                {formatPrice(performanceKPIs.totalSettledAmount)}
              </div>
              <p className="text-[9px] text-slate-400">التصفيات الفعلية المرحّلة</p>
            </div>

            {/* Personal Withdrawals */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400">نفقات ومسحوبات وسلفيات</span>
              <div className="my-1 text-sm font-black text-rose-700 font-mono">
                -{formatPrice(performanceKPIs.totalWithdrawals)}
              </div>
              <p className="text-[9px] text-slate-400">الذمم والسلفيات غير المسددة</p>
            </div>

            {/* Drawer accuracy score */}
            <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-black text-slate-400">دقة مطابقة عجز الصندوق</span>
              <div className="my-1 text-sm font-black text-slate-800 font-mono flex items-center gap-1">
                <span className={performanceKPIs.boxMatchingScore >= 95 ? 'text-emerald-600' : 'text-amber-600'}>
                  {performanceKPIs.boxMatchingScore.toFixed(0)}%
                </span>
                {performanceKPIs.totalDeficitAmount > 0 && (
                  <span className="text-[9px] font-black text-rose-600">(فجوة: {formatPrice(performanceKPIs.totalDeficitAmount)})</span>
                )}
              </div>
              <p className="text-[9px] text-slate-400">مدى مطابقة حساب الدرج</p>
            </div>
          </div>
        </div>

      </div>


      {/* BI Analytics Visualizer - Charts Workspace */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsTrendsAndLiquidityOpen(!isTrendsAndLiquidityOpen)}
          className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-right"
        >
          <div className="flex items-center gap-2 font-black text-sm text-slate-800 animate-none">
            <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
            <span>📈 شاشات التحليل البصري التفاعلي وحركة التدفق المالي العميقة (BI Graphics Dashboard)</span>
          </div>
          {isTrendsAndLiquidityOpen ? <ChevronUp className="w-4.5 h-4.5 text-slate-500" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-500" />}
        </button>

        <AnimatePresence initial={false}>
          {isTrendsAndLiquidityOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Trend Chart */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-slate-755 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-500" />
                        <span>منحنيات تتبع الأداء الحركي والمالي بالدورة</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">اختر الشهر من القائمة السريعة أدناه لتفحّص تفاصيل وأرباح ذلك الشهر تحديداً</p>
                    </div>

                    {/* Chart Tab Selectors */}
                    <div className="flex bg-slate-100 px-1 py-1 rounded-2xl text-[10px] font-black font-sans">
                      <button
                        onClick={() => setTrendChartType('sales_profit')}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          trendChartType === 'sales_profit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        📈 المبيعات والأرباح
                      </button>
                      <button
                        onClick={() => setTrendChartType('cash_flow')}
                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          trendChartType === 'cash_flow' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        💸 التدفق النقدي كاش
                      </button>
                    </div>
                  </div>

                  {/* Quick Month Selectors Pills */}
                  {availableMonthsList.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                      <span className="text-[10px] font-extrabold text-slate-400 shrink-0">تحويل سريع للشهر:</span>
                      <button
                        onClick={() => setSelectedMonth('all')}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer shrink-0 ${
                          selectedMonth === 'all' 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        الكل ({availableMonthsList.length} أشهر)
                      </button>
                      {availableMonthsList.map(([mKey, mName]) => (
                        <button
                          key={mKey}
                          onClick={() => setSelectedMonth(mKey)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer shrink-0 ${
                            selectedMonth === mKey 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400/40' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {mName}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Render Area/Line Charts */}
                  <div className="h-64 sm:h-72 w-full bg-slate-50/40 rounded-2xl p-2 border border-slate-100 flex flex-col justify-between">
                    {trendChartType === 'sales_profit' ? (
                      salesAndProfitTrendChart.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          لا تتوفر حركة ملموسة للتواريخ الحالية في نطاق الفئات المحددة.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="95%" minWidth={0} minHeight={0}>
                          <AreaChart data={salesAndProfitTrendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSalesNew" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.20}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                              </linearGradient>
                              <linearGradient id="colorProfitNew" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.20}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={9} fontWeight="extrabold" tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={9} fontWeight="extrabold" tickLine={false} tickFormatter={(v) => typeof v === 'number' ? formatPrice(Math.round(v)) : v} />
                            <Tooltip 
                              contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px', fontWeight: 'bold' }} 
                              formatter={(value: any, name: any) => [formatPrice(Math.round(value)), name === 'totalAmount' ? 'المبيعات الشهرية' : 'أرباح الشهر الصافية']}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="totalAmount" name="totalAmount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesNew)" animationDuration={250} />
                            <Area type="monotone" dataKey="profit" name="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfitNew)" animationDuration={250} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      unifiedCashflowTimeline.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          لا تتوفر حركات مالية كحصد مبيعات، سحب نقد، أو تسوية جرد بالتاريخ الحالي.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="95%" minWidth={0} minHeight={0}>
                          <AreaChart data={unifiedCashflowTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorMoneyIn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.16}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                              </linearGradient>
                              <linearGradient id="colorMoneyOut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.12}/>
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={9} fontWeight="extrabold" tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={9} fontWeight="extrabold" tickLine={false} tickFormatter={(v) => typeof v === 'number' ? formatPrice(Math.round(v)) : v} />
                            <Tooltip 
                              contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px', fontWeight: 'bold' }} 
                              formatter={(value: any, name: any) => [
                                formatPrice(Math.round(value)), 
                                name === 'moneyIn' ? 'المقبوضات (كاش مبيعات + تحصيل)' : name === 'moneyOut' ? 'المدفوعات (نفقات ومسحوبات وتصفية)' : 'صافي نمو الصندوق باليوم'
                              ]}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="moneyIn" name="moneyIn" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMoneyIn)" animationDuration={250} />
                            <Area type="monotone" dataKey="moneyOut" name="moneyOut" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorMoneyOut)" animationDuration={250} />
                            <Line type="monotone" dataKey="netRegisterChange" name="netRegisterChange" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} animationDuration={250} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )
                    )}
                  </div>

                  {/* Featured Selected Month Detailed Highlights Card */}
                  {selectedMonth !== 'all' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-500/30 space-y-3 mt-3"
                    >
                      <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                            <Calendar className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-white">
                              بطاقة تفاصيل وتحليل شهر: {availableMonthsList.find(([k]) => k === selectedMonth)?.[1] || selectedMonth}
                            </h4>
                            <p className="text-[10px] text-indigo-200">بيانات دقيقة تم تخصيص كافة مؤشرات المنظومة بناءً عليها</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedMonth('all')}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer border border-white/10 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>إلغاء التحديد (كل الأشهر)</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-right">
                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                          <span className="text-[10px] text-slate-300 font-bold block">مبيعات الشهر</span>
                          <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                            {formatPrice(performanceKPIs.salesTotal)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">عدد الفواتير: {performanceKPIs.transactionsCount}</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                          <span className="text-[10px] text-slate-300 font-bold block">أرباح الشهر الصافية</span>
                          <span className="text-sm font-black text-emerald-300 font-mono mt-0.5 block">
                            {formatPrice(performanceKPIs.profitTotal)}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-medium">الهامش: {performanceKPIs.profitMarginPercent.toFixed(1)}%</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                          <span className="text-[10px] text-slate-300 font-bold block">تكلفة شراء الموردين</span>
                          <span className="text-sm font-black text-amber-300 font-mono mt-0.5 block">
                            {formatPrice(performanceKPIs.costTotal)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">قيمة التأسيس</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                          <span className="text-[10px] text-slate-300 font-bold block">مقبوضات كاش / ديون</span>
                          <div className="flex items-center gap-1 text-xs font-mono font-black mt-0.5">
                            <span className="text-emerald-400">{formatPrice(performanceKPIs.cashSalesTotal)}</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-amber-400">{formatPrice(performanceKPIs.debtSalesTotal)}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">نقدي مقابل آجل</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Donut Chart Representation for business balances */}
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                  <div className="flex flex-col gap-2 border-b border-slate-150 pb-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-755">توازن وموجات الدفع والسيولة</h3>
                      
                      <select 
                        value={liquidityDonutType}
                        onChange={(e) => setLiquidityDonutType(e.target.value as any)}
                        className="bg-white border border-slate-200 py-1 px-1.5 rounded-lg text-[9px] font-black focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="revenue_mix">توزيع المبيعات (كاش/ذمم)</option>
                        <option value="liquidity_allocation">توزيع السيولة بالمنظومة</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400">بنية توزيع المال والسيولة لتأكيد ترابط وتوازن الصندوق</p>
                  </div>

                  {/* Render dynamic interactive Pie Charts */}
                  <div className="h-40 w-full flex items-center justify-center relative">
                    {performanceKPIs.salesTotal === 0 ? (
                      <span className="text-xs text-slate-400">لا تتوفر بيانات حية</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <RechartsPieChart>
                          {liquidityDonutType === 'revenue_mix' ? (
                            <Pie
                              data={[
                                { name: 'بيوع نقدية (كاش)', value: performanceKPIs.cashSalesTotal },
                                { name: 'ذمم مدينة (آجل)', value: performanceKPIs.debtSalesTotal }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={60}
                              paddingAngle={4}
                              dataKey="value"
                              animationDuration={250}
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                            </Pie>
                          ) : (
                            <Pie
                              data={[
                                { name: 'المتوفر كاش بالصندوق', value: performanceKPIs.absoluteActualCashInDrawer },
                                { name: 'المسحوبات المعلقة', value: performanceKPIs.totalWithdrawals },
                                { name: 'المستلم التصفية', value: performanceKPIs.totalSettledAmount },
                                { name: 'غير محصل (ذمم العملاء)', value: performanceKPIs.debtSalesTotal }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={60}
                              paddingAngle={4}
                              dataKey="value"
                              animationDuration={250}
                            >
                              <Cell fill="#3b82f6" />
                              <Cell fill="#f43f5e" />
                              <Cell fill="#8b5cf6" />
                              <Cell fill="#d97706" />
                            </Pie>
                          )}
                          <Tooltip 
                            contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', fontSize: '10px' }}
                            formatter={(value: any) => formatPrice(value)} 
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    )}
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[7px] text-slate-400 font-extrabold uppercase">إجمالي المحرك</span>
                      <span className="text-[11px] font-black font-mono text-slate-700">
                        {liquidityDonutType === 'revenue_mix' 
                          ? formatPrice(performanceKPIs.salesTotal) 
                          : formatPrice(performanceKPIs.absoluteActualCashInDrawer + performanceKPIs.totalWithdrawals + performanceKPIs.totalSettledAmount + performanceKPIs.debtSalesTotal)
                        }
                      </span>
                    </div>
                  </div>

                  {/* Legends and breakdowns */}
                  <div className="space-y-1.5 border-t border-slate-150 pt-2 text-[11px]">
                    {liquidityDonutType === 'revenue_mix' ? (
                      <>
                        <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-xl leading-none">
                          <span className="flex items-center gap-1.5 font-bold text-slate-600">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                            المقبوض المباشر (كاش):
                          </span>
                          <span className="font-extrabold text-emerald-800 font-mono">
                            {formatPrice(performanceKPIs.cashSalesTotal)} ({((performanceKPIs.cashSalesTotal / (performanceKPIs.salesTotal || 1)) * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-xl leading-none">
                          <span className="flex items-center gap-1.5 font-bold text-slate-600">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                            ذمم مدينة (آجل):
                          </span>
                          <span className="font-extrabold text-amber-800 font-mono">
                            {formatPrice(performanceKPIs.debtSalesTotal)} ({((performanceKPIs.debtSalesTotal / (performanceKPIs.salesTotal || 1)) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                        <div className="bg-white p-1.5 border border-slate-100 rounded-lg flex flex-col">
                          <span className="text-blue-500">🔵 كاش الصندوق:</span>
                          <span className="font-mono text-slate-800 text-[10px] sm:text-xs">{formatPrice(performanceKPIs.absoluteActualCashInDrawer)}</span>
                        </div>
                        <div className="bg-white p-1.5 border border-slate-100 rounded-lg flex flex-col">
                          <span className="text-rose-500">🔴 مسحوبات ونفقات:</span>
                          <span className="font-mono text-slate-800 text-[10px] sm:text-xs">{formatPrice(performanceKPIs.totalWithdrawals)}</span>
                        </div>
                        <div className="bg-white p-1.5 border border-slate-100 rounded-lg flex flex-col">
                          <span className="text-purple-500">🟣 كاش مصفى مسلّم:</span>
                          <span className="font-mono text-slate-800 text-[10px] sm:text-xs">{formatPrice(performanceKPIs.totalSettledAmount)}</span>
                        </div>
                        <div className="bg-white p-1.5 border border-slate-100 rounded-lg flex flex-col">
                          <span className="text-amber-600">🟠 ديون بالذمة:</span>
                          <span className="font-mono text-slate-800 text-[10px] sm:text-xs">{formatPrice(performanceKPIs.debtSalesTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
              
              {/* Note on automatic feeds to provide ultimate clarity */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 text-[11px] sm:text-xs text-slate-500 flex items-center gap-2 font-medium">
                <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  <strong>مؤشرات تفاعلية شاملة:</strong> الرسوم البيانية بالأعلى مترابطة بشكل حي وتلقائي مع كشوفات حساب الذمم، صندوق سلفيات وسحبيات الموظفين، وتسويات الجرد اليومي بالدرج لتمنحك رؤية فورية دقيقة لنمو راس المال.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accordion List 3: The Ultimate Tabbed Ledger Explorer */}
      <div className="bg-white border border-slate-150/60 rounded-3xl overflow-hidden shadow-sm">
        {/* Ledger Header with Tab Switcher */}
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-indigo-500" />
              <span>مركز تتبع سجلات الحركة والمحاسبة المتكامل (Ledger Explorer Dashboard)</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              اختر التبويب بالأسفل لعرض الدفتر اليومي الصافي، حسابات وأرصدة العملاء، أو تتبع ريادة مبيعات السلع والرفوف في مكان واحد
            </p>
          </div>

          {/* Core Tab Switches */}
          <div className="flex gap-2 text-xs font-black w-full sm:w-auto">
            <button
              onClick={() => setShowDailyLogModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📆 السجل اليومي</span>
            </button>
            <button
              onClick={() => setShowCustomerReceivablesModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <Users className="w-3.5 h-3.5" />
              <span>👤 ذمم العملاء</span>
            </button>
             <button
               className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer bg-white text-indigo-600 shadow-sm font-black"
             >
               <Layers className="w-3.5 h-3.5" />
               <span>🏆 الرفوف والسلع</span>
             </button>
          </div>

        </div>

        {/* Tab Content Panels */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key="products_panel"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Horizontal Top Rated products bar list */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-700">ترتيب مساهمة السلع الفردية</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">المنتجات الخمسة الأولى المحققة لأعلى عائد مالي وأرباح</p>
                </div>

                <div className="h-64 w-full bg-white rounded-2xl p-2 border border-slate-100">
                  {topProductsChart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      لم يتم تسجيل أي بضائع مباعة بالتصفية المحددة.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={topProductsChart} layout="vertical" margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickFormatter={(v) => typeof v === 'number' ? formatPrice(Math.round(v)) : v} />
                        <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} fontWeight="extrabold" width={110} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '16px', fontSize: '11px' }}
                          formatter={(value: any, name: any) => [formatPrice(value), name === 'revenue' ? 'المبيعات' : 'الأرباح']}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Bar dataKey="revenue" name="revenue" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={9} animationDuration={250} />
                        <Bar dataKey="profit" name="profit" fill="#10b981" radius={[0, 8, 8, 0]} barSize={9} animationDuration={250} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Ranked category shelving share list */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-700">نسبة مساهمة السلع حسب تصنيفات الرفوف</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">قوة ومبيعات فئات المخزن وتأثيرها على العوائد المالية الكلية</p>
                </div>

                <div className="space-y-2 max-h-[256px] overflow-y-auto custom-scrollbar pr-1">
                  {categorySalesChart.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                      لا توجد فئات رفوف مباعة ملموسة تحت تاريخ التصفية.
                    </div>
                  ) : (
                    categorySalesChart.map((cat, idx) => {
                      const totalSalesForPercentage = performanceKPIs.salesTotal || 1;
                      const percentage = ((cat.sales / totalSalesForPercentage) * 100);
                      
                      return (
                        <div key={idx} className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-right">
                          <div className="space-y-1 w-full">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-xs text-slate-800">{cat.name}</span>
                              <span className="font-extrabold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                الصافي: {formatPrice(cat.profit)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full" 
                                  style={{ width: `${Math.min(100, percentage)}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] font-mono font-black text-slate-500 shrink-0">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 font-bold">
                              مجموع مبيعات الرف: <span className="font-mono text-slate-600 font-black">{formatPrice(cat.sales)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

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

      {/* Modal: Smart Advisor & Robotic Advisor System Modal */}
      <AnimatePresence>
        {isSmartAdvisorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md transition-all duration-300" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/98 backdrop-blur-2xl text-slate-900 rounded-3xl shadow-2xl w-full max-w-7xl 2xl:max-w-[1550px] overflow-hidden flex flex-col max-h-[95vh] h-[92vh] border border-slate-200/90 ring-1 ring-black/10"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 text-amber-300 rounded-2xl shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">🤖 الذكاء التحليلي والتوصيات الحسابية الموجهة (Robotic Advisor System)</h3>
                    <p className="text-[11px] text-indigo-200/80 font-medium mt-0.5">
                      مستشار ذكي محلي آمن 100% يحلل الأداء المالي، التوقعات المستقبلية، ويجيب على كافة استفساراتك المحاسبية فوراً
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSmartAdvisorModalOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 border border-white/15 hover:border-rose-500/40 text-slate-200 hover:text-white transition-all text-xs font-bold cursor-pointer shadow-xs active:scale-95 shrink-0"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">إغلاق</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-3 sm:p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/80">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 h-full">
                  {/* Primary Column 1: AI Smart Assistant Interactive Chatbot Container (الوكيل المحاسبي الذكي) */}
                  <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl shadow-lg flex flex-col justify-between overflow-hidden min-h-[580px] h-full ring-1 ring-slate-100">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-3.5 text-white shrink-0 relative overflow-hidden" dir="rtl">
                      <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 text-amber-300 rounded-xl shrink-0">
                            <Brain className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs sm:text-sm font-black text-white">الوكيل المحاسبي الذكي</h3>
                              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-400/30">
                                <Shield className="w-2.5 h-2.5 text-emerald-400" /> محلي وآمن 100%
                              </span>
                            </div>
                            <p className="text-[10px] text-indigo-200/80 font-medium mt-0.5">
                              مستشارك المالي المستقل، يعمل بالكامل داخل جهازك لضمان سرية بياناتك
                            </p>
                          </div>
                        </div>

                        {/* Header Compact Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setIsStagesModalOpen(true)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-200 hover:text-white bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/30 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs"
                            title="استعراض مراحل التحليل والتفكير الذكي"
                          >
                            <Brain className="w-3 h-3 text-indigo-300" />
                            <span>مراحل التحليل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsQuestionBankModalOpen(true)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-200 hover:text-white bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/30 rounded-lg transition-all cursor-pointer shrink-0 shadow-2xs"
                            title="استعراض بنك الأسئلة الشامل"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>بنك الأسئلة</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleResetChat}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-rose-500/80 border border-white/10 rounded-lg transition-all cursor-pointer shrink-0"
                            title="إعادة البدء ومسح المحادثة"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>بدء جديد (مسح)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-900/60 via-slate-950/70 to-slate-950 text-slate-100" dir="rtl">
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center my-auto text-center py-6 px-2 sm:px-6 w-full max-w-2xl mx-auto">
                          {/* Animated Icon Avatar */}
                          <div className="relative mb-3.5">
                            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 rounded-3xl p-0.5 shadow-xl shadow-indigo-500/25 flex items-center justify-center">
                              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                                <Brain className="w-8 h-8 text-amber-300 animate-pulse" />
                              </div>
                            </div>
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                            </span>
                          </div>
                          
                          {/* Title & Badge Header */}
                          <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-center">
                            <h4 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight">
                              مرحباً بك في الوكيل المحاسبي الذكي
                            </h4>
                            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-bold flex items-center gap-1">
                              <Shield className="w-3 h-3 text-emerald-400" />
                              مؤمن ومحلي 100%
                            </span>
                          </div>

                          {/* Subtitle Description */}
                          <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed mb-6 font-medium text-center">
                            مستشارك المالي والتقني الفوري لتحليل الأرباح، ديون العملاء، نواقص المخزون، مستحقات الموردين، ودليل كامل لجميع شاشات وأقسام النظام.
                          </p>
                          
                          {/* Starter Quick Chips Container */}
                          <div className="w-full bg-slate-900/70 border border-slate-800/90 rounded-3xl p-3.5 sm:p-4.5 shadow-xl backdrop-blur-sm">
                            <div className="flex items-center justify-between gap-2 mb-3 px-1 border-b border-slate-800/80 pb-2.5">
                              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                                <span>استفسارات محاسبية وتقنية مقترحة:</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsQuestionBankModalOpen(true)}
                                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                              >
                                <span>عرض بنك الأسئلة الشامل</span>
                                <span className="font-mono bg-amber-400/20 px-1.5 py-0.2 rounded-full text-[10px]">({COMPREHENSIVE_QUICK_QUESTIONS.length})</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-right">
                              {/* 1. Daily Profits */}
                              <button
                                type="button"
                                onClick={() => handleSendMessage('ماهو صافي أرباح اليوم؟')}
                                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-xs text-right"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    💰
                                  </div>
                                  <div className="flex flex-col min-w-0 text-right">
                                    <span className="text-xs font-black text-white group-hover:text-emerald-300 truncate transition-colors">
                                      صافي أرباح اليوم
                                    </span>
                                    <span className="text-[10px] text-slate-400 group-hover:text-emerald-400/90 font-medium truncate mt-0.5">
                                      حساب دقيق لليوم الحالي
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-[-2px] transition-all shrink-0 mr-1">
                                  ←
                                </span>
                              </button>

                              {/* 2. Smart Import */}
                              <button
                                type="button"
                                onClick={() => handleSendMessage('معلومات عن قسم الاستيراد الذكي')}
                                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-xs text-right"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    📥
                                  </div>
                                  <div className="flex flex-col min-w-0 text-right">
                                    <span className="text-xs font-black text-white group-hover:text-sky-300 truncate transition-colors">
                                      قسم الاستيراد الذكي
                                    </span>
                                    <span className="text-[10px] text-slate-400 group-hover:text-sky-400/90 font-medium truncate mt-0.5">
                                      استيراد الفواتير وإكسل والكاميرا
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-slate-600 group-hover:text-sky-400 group-hover:translate-x-[-2px] transition-all shrink-0 mr-1">
                                  ←
                                </span>
                              </button>

                              {/* 3. Major Debtors */}
                              <button
                                type="button"
                                onClick={() => handleSendMessage('من هم أكثر العملاء ديناً (كبار المدينين)؟')}
                                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-xs text-right"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    🚨
                                  </div>
                                  <div className="flex flex-col min-w-0 text-right">
                                    <span className="text-xs font-black text-white group-hover:text-rose-300 truncate transition-colors">
                                      كبار المدينين بالدفتر
                                    </span>
                                    <span className="text-[10px] text-slate-400 group-hover:text-rose-400/90 font-medium truncate mt-0.5">
                                      أعلى الذمم المعلقة
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-slate-600 group-hover:text-rose-400 group-hover:translate-x-[-2px] transition-all shrink-0 mr-1">
                                  ←
                                </span>
                              </button>

                              {/* 4. Critical Stock Shortages */}
                              <button
                                type="button"
                                onClick={() => handleSendMessage('ما هي البضاعة الناقصة التي قاربت على النفاد؟')}
                                className="group flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-xs text-right"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                                    📦
                                  </div>
                                  <div className="flex flex-col min-w-0 text-right">
                                    <span className="text-xs font-black text-white group-hover:text-amber-300 truncate transition-colors">
                                      نواقص المخزون الحرجة
                                    </span>
                                    <span className="text-[10px] text-slate-400 group-hover:text-amber-400/90 font-medium truncate mt-0.5">
                                      الأصناف تحت حد الطلب
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-slate-600 group-hover:text-amber-400 group-hover:translate-x-[-2px] transition-all shrink-0 mr-1">
                                  ←
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => {
                          const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                          const queryText = prevMsg && prevMsg.role === 'user' ? prevMsg.text : '';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[92%] sm:max-w-[88%] rounded-3xl p-3.5 sm:p-5 text-xs sm:text-sm shadow-xl transition-all ${
                                msg.role === 'user'
                                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white self-start rounded-tr-none border border-indigo-400/20 shadow-indigo-600/10'
                                  : msg.id.startsWith('error')
                                    ? 'bg-rose-950/95 border border-rose-800 text-rose-100 self-end rounded-tl-none shadow-rose-950/40'
                                    : 'bg-slate-900/95 border border-indigo-500/20 text-slate-100 self-end rounded-tl-none shadow-slate-950/50 ring-1 ring-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] opacity-80 mb-2 font-black border-b border-inherit pb-1.5">
                                <span className="flex items-center gap-2 text-xs">
                                  {msg.role === 'user' ? (
                                    <span className="flex items-center gap-1.5 text-indigo-100 font-black">
                                      👤 سؤالك
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5 text-amber-300 font-black">
                                      <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                      المستشار الذكي
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-[9.5px] opacity-70">
                                    {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                                    title="حذف هذه الرسالة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed">
                                {msg.role === 'user' ? msg.text : formatAssistantMessage(msg.text)}
                              </div>
                              {msg.role === 'assistant' && (
                                <div className="flex justify-between items-center gap-2 mt-3 pt-2 border-t border-slate-800 text-right flex-wrap">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleCopyText(msg.id, msg.text)}
                                      className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-[10.5px] flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-all bg-white/5 border border-white/5"
                                      title="نسخ التقرير بالكامل"
                                    >
                                      {copiedMessageId === msg.id ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          <span className="text-emerald-400 font-black">تم النسخ</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="font-bold">نسخ الإجابة</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  {msg.id !== 'welcome' && (
                                    ratedMessages[msg.id] ? (
                                      <span className="text-[10px] text-emerald-400 font-black px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                        {ratedMessages[msg.id] === 'up' ? 'تم التقييم بمفيد 👍' : 'تم تدوين الملاحظة 👎'}
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9.5px] text-slate-400 ml-1">هل الإجابة دقيقة؟</span>
                                        <button
                                          onClick={() => {
                                            handleFeedback(msg.id, true, queryText, msg.text);
                                            setRatedMessages(prev => ({ ...prev, [msg.id]: 'up' }));
                                          }}
                                          className="p-1.5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-emerald-500/30"
                                          title="مفيد ودقيق"
                                        >
                                          <ThumbsUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleFeedback(msg.id, false, queryText, msg.text);
                                            setRatedMessages(prev => ({ ...prev, [msg.id]: 'down' }));
                                          }}
                                          className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                                          title="غير دقيق"
                                        >
                                          <ThumbsDown className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                      {isTyping && (
                        <div className="bg-slate-900 border border-indigo-500/30 text-slate-200 max-w-[45%] rounded-3xl p-3 text-xs self-end rounded-tl-none flex items-center gap-2.5 shadow-md">
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>
                          <span className="text-[11px] font-black text-indigo-300">جاري التدقيق والتحليل المحاسبي...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Permanent Chat Input Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-1.5 sm:gap-2 shrink-0"
                      dir="rtl"
                    >
                      <button
                        type="button"
                        onClick={() => setIsQuestionBankModalOpen(true)}
                        className="px-2 sm:px-2.5 py-2 sm:py-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all cursor-pointer shrink-0 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border-indigo-200/80 shadow-2xs"
                        title="استعراض بنك الأسئلة الشامل"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span className="hidden sm:inline text-[11px]">بنك الأسئلة</span>
                      </button>

                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="اكتب استفسارك هنا (مثال: كم المبيعات؟ من هم المدينون؟)..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right shadow-inner"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isTyping}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center transition-colors shadow-md cursor-pointer shrink-0 font-bold text-xs sm:text-sm gap-1 sm:gap-1.5"
                      >
                        <span>إرسال</span>
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform rotate-180" />
                      </button>
                    </form>
                  </div>

                  {/* Secondary Column 2: Robotic Advisor Report (توصيات المساعد الموجهة) */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg text-white overflow-hidden relative flex flex-col justify-between min-h-[580px] h-full">
                    <div className="flex flex-col h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                      <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2.5 shrink-0" dir="rtl">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                          <h3 className="text-xs sm:text-sm font-extrabold text-white">توصيات المساعد الموجهة</h3>
                        </div>
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold">بموجب البيانات</span>
                      </div>

                      <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-1 flex-1" dir="rtl">
                        {smartAIRecommendations.map((insight) => (
                          <div 
                            key={insight.id} 
                            className={`p-3 rounded-2xl border transition-all duration-200 ${
                              insight.type === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' 
                                : insight.type === 'warning'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-100'
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {insight.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                {insight.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                {insight.type === 'info' && <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                                <span className="font-extrabold text-xs truncate">{insight.title}</span>
                              </div>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-90 pr-5">
                              {insight.desc}
                            </p>
                            {insight.anomalyKey && (
                              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAnomalyModalType(insight.anomalyKey || null)}
                                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  <span>{insight.actionLabel || 'فحص وتدقيق المشكلة'}</span>
                                  <ArrowLeft className="w-3 h-3 rotate-180" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolveAnomaly(insight.anomalyKey!)}
                                  className="text-[9px] text-amber-200/80 hover:text-amber-100 hover:underline font-bold cursor-pointer"
                                >
                                  تم التحقق (إخفاء)
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
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
                  {QUICK_QUESTION_CATEGORIES.map(cat => {
                    const isSelected = selectedQuickCategory === cat.id;
                    const count = cat.id === 'all' 
                      ? COMPREHENSIVE_QUICK_QUESTIONS.length 
                      : COMPREHENSIVE_QUICK_QUESTIONS.filter(q => q.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
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
                    .map(q => {
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
                          key={q.id}
                          type="button"
                          onClick={() => {
                            handleSendMessage(q.question);
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
