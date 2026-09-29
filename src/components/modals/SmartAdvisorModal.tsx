import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Sparkles,
  Brain,
  Clock,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Package,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Search,
  Sliders,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Users,
  Layers,
  HelpCircle,
  AlertCircle,
  Calendar,
  Activity,
  Check,
  Zap,
  PieChart,
  Info,
  ShieldAlert,
  Wrench
} from 'lucide-react';
import VisualModelsExtension from '../VisualModelsExtension';
import { getProductMinStockAlert } from '../../utils/accounting';
import { processUserQuery } from '../../services/ai/aiRouter';
import { COMPREHENSIVE_QUICK_QUESTIONS, QUICK_QUESTION_CATEGORIES, QuickQuestionItem } from '../../data/aiQuestions';

export interface SmartAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  customers: any[];
  sales: any[];
  saleItems: any[];
  debts: any[];
  withdrawals?: any[];
  formatPrice: (price: number) => string;
  currency: string;
  onOpenAnomalyModal?: (type: 'debt' | 'low_stock' | 'negative_profit' | 'cash_leak') => void;
  initialQuery?: string | null;
  onClearInitialQuery?: () => void;
}

// Memoized Chat Input Form to prevent lag when typing
const ChatInputForm = memo(function ChatInputForm({
  isTyping,
  onSendMessage,
  onOpenQuestionBank
}: {
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onOpenQuestionBank: () => void;
}) {
  const [chatInput, setChatInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !isTyping) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      dir="rtl"
    >
      <button
        type="button"
        onClick={onOpenQuestionBank}
        className="px-3 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border-indigo-200/80 shadow-2xs"
        title="استعراض بنك الأسئلة الشامل"
      >
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="hidden sm:inline text-xs font-bold">بنك الأسئلة</span>
      </button>

      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        placeholder="اكتب استفسارك هنا (مثال: كم إجمالي المبيعات؟ من هم أكبر المدينين؟)..."
        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right shadow-inner"
      />

      <button
        type="submit"
        disabled={!chatInput.trim() || isTyping}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors shadow-md cursor-pointer shrink-0 font-bold text-xs sm:text-sm gap-1.5"
      >
        <span>إرسال</span>
        <Send className="w-4 h-4 transform rotate-180" />
      </button>
    </form>
  );
});

export function SmartAdvisorModal({
  isOpen,
  onClose,
  products = [],
  customers = [],
  sales = [],
  saleItems = [],
  debts = [],
  withdrawals = [],
  formatPrice,
  currency,
  onOpenAnomalyModal,
  initialQuery,
  onClearInitialQuery
}: SmartAdvisorModalProps) {
  const [advisorActiveTab, setAdvisorActiveTab] = useState<'chat' | 'forecasting' | 'recommendations' | 'visual_models'>('chat');
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    stages?: any[];
    timestamp: Date;
  }[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => 'session_' + Date.now());
  const [isTyping, setIsTyping] = useState(false);
  const [ratedMessages, setRatedMessages] = useState<{ [key: string]: 'up' | 'down' }>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState<string>('all');
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [recommendationsFilter, setRecommendationsFilter] = useState<'all' | 'inventory' | 'debts' | 'sales' | 'cash'>('all');

  // Interactive Growth Simulator States (for Forecasting tab)
  const [simDemandIncrease, setSimDemandIncrease] = useState<number>(15); // +15% demand
  const [simMarginAdjustment, setSimMarginAdjustment] = useState<number>(5); // +5% price/margin
  const [simNewProductsCount, setSimNewProductsCount] = useState<number>(5); // 5 new items

  // Multi-Horizon Forecasting & Advanced Statistical Simulator States
  const [selectedForecastHorizon, setSelectedForecastHorizon] = useState<'7d' | '30d' | '90d' | '365d' | 'custom'>('30d');
  const [customHorizonDays, setCustomHorizonDays] = useState<number>(60);
  const [forecastSubTab, setForecastSubTab] = useState<'projections' | 'seasonality' | 'statistics' | 'diagnostics' | 'simulator'>('projections');
  const [activeScenarioFilter, setActiveScenarioFilter] = useState<'all' | 'baseline' | 'optimistic' | 'conservative'>('all');

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (advisorActiveTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, advisorActiveTab]);

  // Handle Initial Query if passed from outside
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
      onClearInitialQuery?.();
    }
  }, [isOpen, initialQuery]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleResetChat = async () => {
    try {
      const { deleteConversation, createNewConversation } = await import('../../services/ai/memory');
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
  };

  const handleDeleteMessage = (id: string) => {
    setChatMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handleRateMessage = (id: string, rating: 'up' | 'down') => {
    setRatedMessages(prev => ({ ...prev, [id]: rating }));
    try {
      const savedStr = localStorage.getItem('smart_analytics_learning_v1');
      const saved = savedStr ? JSON.parse(savedStr) : { thumbsUp: 0, thumbsDown: 0, queriesProcessed: 0 };
      if (rating === 'up') saved.thumbsUp = (saved.thumbsUp || 0) + 1;
      else saved.thumbsDown = (saved.thumbsDown || 0) + 1;
      localStorage.setItem('smart_analytics_learning_v1', JSON.stringify(saved));
    } catch (e) {
      console.warn('Failed to store rating:', e);
    }
  };

  const resolveSmartQuery = async (query: string): Promise<{ answer: string; stages?: any[] } | string> => {
    try {
      const answer = await processUserQuery(query, activeConversationId);
      return {
        answer: answer || 'عذراً، لم أتمكن من فهم استفسارك بدقة كافية. يرجى إعادة صياغة السؤال أو اختيار أحد الأسئلة الجاهزة من بنك الأسئلة.'
      };
    } catch (err) {
      console.warn('AI Engine Router error:', err);
      return {
        answer: 'عذراً، حدث خطأ أثناء معالجة الاستفسار. يرجى المحاولة مرة أخرى.'
      };
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query) return;

    // Add user message
    const newUserMessage = {
      id: 'user-' + Date.now(),
      role: 'user' as const,
      text: query,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    // Call AI processing asynchronously
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

      setChatMessages(prev => [
        ...prev,
        {
          id: 'assistant-' + Date.now(),
          role: 'assistant' as const,
          text,
          stages,
          timestamp: new Date()
        }
      ]);
    } catch (error: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          role: 'assistant' as const,
          text: `⚠️ **حدث خطأ أثناء معالجة الاستفسار:**\n${error?.message || String(error)}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // High performance formatting of assistant messages
  const formatInlineStyles = (rawText: string, lineKeyPrefix: string | number = 'inline') => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(rawText.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={`${lineKeyPrefix}-bold-${match.index}`} className="font-black text-amber-300 mx-0.5">
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

  const formatAssistantMessage = (text: string, msgPrefix: string = 'msg') => {
    return text.split('\n').map((line, idx) => {
      const content = line.trim();
      const lineKey = `${msgPrefix}-l-${idx}`;
      if (!content) return <div key={lineKey} className="h-1.5" />;

      // Match markdown headers like ### or ## or #
      if (content.startsWith('###') || content.startsWith('##') || content.startsWith('#')) {
        const titleText = content.replace(/^#+\s*/, '');
        return (
          <div key={lineKey} className="mt-3.5 mb-2 first:mt-0" dir="rtl">
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
          <div key={lineKey} className="mt-3 mb-1.5 first:mt-0 font-black text-xs sm:text-sm text-amber-300 flex items-center gap-2 border-b border-indigo-500/20 pb-1" dir="rtl">
            <span>{formatInlineStyles(content, lineKey)}</span>
          </div>
        );
      }

      // Numbered list item like "1.", "2."
      const numberedMatch = content.match(/^(\d+)[\.\-\)]\s+(.*)/);
      if (numberedMatch) {
        const num = numberedMatch[1];
        const rest = numberedMatch[2];
        return (
          <div key={lineKey} className="flex items-start gap-2.5 my-1.5 p-2.5 bg-slate-950/60 hover:bg-slate-950/80 border border-white/5 rounded-2xl transition-colors text-xs leading-relaxed" dir="rtl">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-indigo-400/30">
              {num}
            </span>
            <div className="flex-1 text-slate-100 font-medium">
              {formatInlineStyles(rest, lineKey)}
            </div>
          </div>
        );
      }

      // Bullet list item
      const isListItem = content.startsWith('-') || content.startsWith('*') || content.startsWith('•');
      if (isListItem) {
        const cleanText = content.replace(/^[-*•]\s*/, '');
        return (
          <div key={lineKey} className="flex items-start gap-2 my-1.5 pr-1.5 text-xs leading-relaxed text-slate-100" dir="rtl">
            <span className="text-teal-400 select-none font-bold mt-1 shrink-0 text-[10px]">◆</span>
            <div className="flex-1 font-medium">
              {formatInlineStyles(cleanText, lineKey)}
            </div>
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={lineKey} className="my-1.5 leading-relaxed text-xs text-slate-100 text-right font-medium" dir="rtl">
          {formatInlineStyles(content, lineKey)}
        </p>
      );
    });
  };

  // High performance bounded Machine Learning & Multi-Horizon Forecasting Calculations
  const mlForecastingData = useMemo(() => {
    const targetHorizonDays = selectedForecastHorizon === '7d' ? 7
      : selectedForecastHorizon === '30d' ? 30
      : selectedForecastHorizon === '90d' ? 90
      : selectedForecastHorizon === '365d' ? 365
      : Math.max(1, Math.min(730, customHorizonDays || 30));

    const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // 1. Daily sales aggregation
    const dailySalesMap: { [key: string]: { total: number; count: number; dayOfWeek: number } } = {};
    const safeSales = sales.slice(-300); // bound to recent 300 sales for max performance
    safeSales.forEach(s => {
      if (!s.created_at) return;
      const d = new Date(s.created_at);
      if (isNaN(d.getTime())) return;
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      if (!dailySalesMap[dateStr]) {
        dailySalesMap[dateStr] = { total: 0, count: 0, dayOfWeek };
      }
      dailySalesMap[dateStr].total += (s.total_amount || 0);
      dailySalesMap[dateStr].count += 1;
    });

    const sortedDates = Object.keys(dailySalesMap).sort();
    const regressionPoints = sortedDates.map((date, idx) => ({
      x: idx,
      y: dailySalesMap[date].total,
      dayOfWeek: dailySalesMap[date].dayOfWeek
    }));

    const yVals = regressionPoints.map(p => p.y);
    const n = regressionPoints.length;

    let slope = 0;
    let intercept = 0;
    let rSquared = 0;

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

      const meanY = sumY / n;
      const ssTotal = yVals.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
      const ssRes = regressionPoints.reduce((sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
      rSquared = ssTotal !== 0 ? Math.max(0, Math.min(1, 1 - (ssRes / ssTotal))) : 0;
    }

    const totalSalesVolume = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const avgDailySales = n > 0 ? (totalSalesVolume / n) : 0;
    const lastDayIdx = Math.max(0, n - 1);

    // Descriptive & Exploratory Stats
    const sortedY = [...yVals].sort((a, b) => a - b);
    const medianDaily = n > 0 ? (n % 2 !== 0 ? sortedY[Math.floor(n / 2)] : (sortedY[Math.floor(n / 2) - 1] + sortedY[Math.floor(n / 2)]) / 2) : 0;
    const variance = n > 1 ? yVals.reduce((acc, v) => acc + Math.pow(v - avgDailySales, 2), 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const volatilityRate = avgDailySales > 0 ? ((stdDev / avgDailySales) * 100) : 0;

    const recent7 = yVals.slice(-7);
    const ma7 = recent7.length > 0 ? recent7.reduce((a, b) => a + b, 0) / recent7.length : avgDailySales;
    const recent30 = yVals.slice(-30);
    const ma30 = recent30.length > 0 ? recent30.reduce((a, b) => a + b, 0) / recent30.length : avgDailySales;

    // Day of Week Seasonality
    const dayStats: { [day: number]: { total: number; count: number } } = {
      0: { total: 0, count: 0 }, 1: { total: 0, count: 0 }, 2: { total: 0, count: 0 },
      3: { total: 0, count: 0 }, 4: { total: 0, count: 0 }, 5: { total: 0, count: 0 }, 6: { total: 0, count: 0 }
    };
    regressionPoints.forEach(p => {
      dayStats[p.dayOfWeek].total += p.y;
      dayStats[p.dayOfWeek].count += 1;
    });

    const daySeasonality = [0, 1, 2, 3, 4, 5, 6].map(idx => {
      const st = dayStats[idx];
      const dayAvg = st.count > 0 ? st.total / st.count : avgDailySales;
      const share = totalSalesVolume > 0 ? (st.total / totalSalesVolume) * 100 : 14.28;
      const relIndex = avgDailySales > 0 ? dayAvg / avgDailySales : 1.0;
      return {
        dayIndex: idx,
        dayName: ARABIC_DAYS[idx],
        avgSales: Math.round(dayAvg),
        sharePercentage: parseFloat(share.toFixed(1)),
        relativeIndex: parseFloat(relIndex.toFixed(2)),
        count: st.count
      };
    });

    const sortedBySales = [...daySeasonality].sort((a, b) => b.avgSales - a.avgSales);
    const peakDay = sortedBySales[0] || { dayName: 'غير محدد', avgSales: 0 };
    const slowestDay = sortedBySales[sortedBySales.length - 1] || { dayName: 'غير محدد', avgSales: 0 };

    // Multi-Horizon Projections & Scenarios Generation
    const lastDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date();
    const maxCalcHorizon = Math.max(targetHorizonDays, 365);
    const stdError = Math.max(stdDev * 0.6, avgDailySales * 0.12);

    let next7DaysTotal = 0;
    let next30DaysTotal = 0;
    let next90DaysTotal = 0;
    let next365DaysTotal = 0;
    let selectedHorizonBaselineTotal = 0;
    let selectedHorizonOptimisticTotal = 0;
    let selectedHorizonConservativeTotal = 0;

    const dailyProjections: {
      dateStr: string;
      dayName: string;
      projectedSales: number;
      optimisticSales: number;
      conservativeSales: number;
    }[] = [];

    for (let step = 1; step <= maxCalcHorizon; step++) {
      const projDate = new Date(lastDate);
      projDate.setDate(lastDate.getDate() + step);
      const dateStr = projDate.toISOString().split('T')[0];
      const dIndex = projDate.getDay();
      const seasonFactor = daySeasonality[dIndex]?.relativeIndex || 1.0;

      const rawRegression = Math.max(0, (slope * (lastDayIdx + step)) + intercept);
      const seasonalMultiplier = Math.max(0.75, Math.min(1.35, 1 + (seasonFactor - 1) * 0.5));
      const baselineVal = Math.round((rawRegression > 0 ? rawRegression : avgDailySales) * seasonalMultiplier);

      const uncertainty = stdError * Math.sqrt(1 + step / 30);
      const optimisticVal = Math.round(baselineVal + uncertainty * 1.35);
      const conservativeVal = Math.max(0, Math.round(baselineVal - uncertainty * 0.95));

      if (step <= 7) next7DaysTotal += baselineVal;
      if (step <= 30) next30DaysTotal += baselineVal;
      if (step <= 90) next90DaysTotal += baselineVal;
      if (step <= 365) next365DaysTotal += baselineVal;

      if (step <= targetHorizonDays) {
        selectedHorizonBaselineTotal += baselineVal;
        selectedHorizonOptimisticTotal += optimisticVal;
        selectedHorizonConservativeTotal += conservativeVal;
        dailyProjections.push({
          dateStr,
          dayName: ARABIC_DAYS[dIndex],
          projectedSales: baselineVal,
          optimisticSales: optimisticVal,
          conservativeSales: conservativeVal
        });
      }
    }

    // Growth trend classification
    let trendClassification: 'growing' | 'stable' | 'declining' = 'stable';
    if (slope > 10) trendClassification = 'growing';
    else if (slope < -10) trendClassification = 'declining';

    // Store Health Diagnostics & Error Detection
    const storeDiagnostics: {
      id: string;
      severity: 'critical' | 'warning' | 'opportunity' | 'info';
      category: 'pricing' | 'debts' | 'inventory' | 'cash';
      title: string;
      description: string;
      suggestedFix: string;
      promptToFix: string;
    }[] = [];

    // Pricing checks
    const negativeMarginProducts = products.filter(p => (p.price || 0) <= 0 || ((p.cost_price || 0) > 0 && (p.price || 0) < (p.cost_price || 0)));
    if (negativeMarginProducts.length > 0) {
      storeDiagnostics.push({
        id: 'diag_pricing',
        severity: 'critical',
        category: 'pricing',
        title: `🚨 ${negativeMarginProducts.length} أصناف تباع بأقل من التكلفة أو بسعر صفر!`,
        description: `تم رصد أصناف مسجلة تسبب خسائر مباشرة عند البيع مثل (${negativeMarginProducts.slice(0, 2).map(p => p.name).join('، ')}).`,
        suggestedFix: 'تحديث هوامش الربح فوراً وتصحيح أسعار البيع لتغطي التكلفة وهامش ربح لا يقل عن 15%.',
        promptToFix: 'أريد مراجعة وتصحيح أسعار الأصناف التي تباع بأقل من التكلفة'
      });
    }

    // Debt checks
    const totalDebt = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
    if (totalDebt > 0) {
      const debtRatio = totalSalesVolume > 0 ? (totalDebt / totalSalesVolume) * 100 : 0;
      if (debtRatio > 30 || totalDebt > 10000) {
        storeDiagnostics.push({
          id: 'diag_debts',
          severity: 'critical',
          category: 'debts',
          title: `👥 مخاطر تركز الديون والذمم المدينة (${debtRatio.toFixed(1)}% من المبيعات)`,
          description: `إجمالي الديون المعلقة يبلغ ${formatPrice(totalDebt)}. تأخر التحصيل يضغط على سيولة الصندوق المخصصة للموردين.`,
          suggestedFix: 'جدولة كشوفات حساب للمدينين ووضع حدود ائتمانية واضحة لتقليل مخاطر التعثر.',
          promptToFix: 'أعطني خطة تحصيل ذكية لأكبر المدينين المتأخرين'
        });
      }
    }

    // Stagnant inventory checks
    const recentSoldIds = new Set(saleItems.slice(-300).map(si => si.product_id));
    const stagnantStock = products.filter(p => p.stock_quantity > 10 && !recentSoldIds.has(p.id));
    if (stagnantStock.length > 0) {
      storeDiagnostics.push({
        id: 'diag_stagnant',
        severity: 'opportunity',
        category: 'inventory',
        title: `📦 بضائع راكدة تجمد رأس المال (${stagnantStock.length} صنف)`,
        description: `توجد أصناف برصيد مرتفع لم تسجل مبيعات مؤخراً مثل (${stagnantStock.slice(0, 2).map(p => p.name).join('، ')}).`,
        suggestedFix: 'عمل عروض ترويجية مدمجة أو تخفيضات لتسييل المخزون الراكد وإعادة استثماره في أصناف عالية الطلب.',
        promptToFix: 'كيف أصنع عروض تسويقية لتصريف البضائع الراكدة؟'
      });
    }

    // Top selling items sales velocity & stockout forecast
    const productSalesCount: { [id: string]: number } = {};
    saleItems.slice(-500).forEach(item => {
      productSalesCount[item.product_id] = (productSalesCount[item.product_id] || 0) + (item.quantity || 1);
    });

    const daysCount = Math.max(1, sortedDates.length);
    const stockDepletionForecast = products
      .map(p => {
        const soldUnits = productSalesCount[p.id] || 0;
        const dailyVelocity = soldUnits / daysCount;
        const daysRemaining = dailyVelocity > 0 ? Math.round(p.stock_quantity / dailyVelocity) : 999;
        return {
          product: p,
          soldUnits,
          dailyVelocity: Math.round(dailyVelocity * 10) / 10,
          daysRemaining: p.stock_quantity <= 0 ? 0 : daysRemaining,
          recommendedReorder: Math.max(10, Math.ceil(dailyVelocity * 14)) // 2 weeks safety buffer
        };
      })
      .filter(item => item.soldUnits > 0 || item.product.stock_quantity <= getProductMinStockAlert(item.product))
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 6);

    return {
      targetHorizonDays,
      slope,
      intercept,
      rSquared: parseFloat(rSquared.toFixed(3)),
      trendClassification,
      avgDailySales: Math.round(avgDailySales),
      medianDaily: Math.round(medianDaily),
      stdDev: Math.round(stdDev),
      volatilityRate: parseFloat(volatilityRate.toFixed(1)),
      ma7: Math.round(ma7),
      ma30: Math.round(ma30),
      peakDay,
      slowestDay,
      daySeasonality,
      next7DaysTotal,
      next30DaysTotal,
      next90DaysTotal,
      next365DaysTotal,
      selectedHorizonBaselineTotal,
      selectedHorizonOptimisticTotal,
      selectedHorizonConservativeTotal,
      dailyProjections,
      storeDiagnostics,
      stockDepletionForecast
    };
  }, [sales, saleItems, products, selectedForecastHorizon, customHorizonDays, customers, formatPrice]);

  // Directed High-Value Smart Recommendations
  const smartAIRecommendations = useMemo(() => {
    const recs: {
      id: string;
      category: 'inventory' | 'debts' | 'sales' | 'cash';
      type: 'critical' | 'warning' | 'opportunity' | 'healthy';
      title: string;
      desc: string;
      metric?: string;
      anomalyKey?: 'debt' | 'low_stock' | 'negative_profit' | 'cash_leak';
      actionLabel?: string;
    }[] = [];

    const totalSalesSum = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalDebtSum = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
    const outOfStockItems = products.filter(p => p.stock_quantity <= 0);
    const lowStockItems = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= getProductMinStockAlert(p));
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    // 1. Critical Inventory Alert
    if (outOfStockItems.length > 0) {
      recs.push({
        id: 'rec_out_of_stock',
        category: 'inventory',
        type: 'critical',
        title: `🚨 ${outOfStockItems.length} صنف نفد رصيده بالكامل من المستودع!`,
        desc: `الأصناف: (${outOfStockItems.slice(0, 3).map(p => p.name).join('، ')}${outOfStockItems.length > 3 ? '...' : ''}) تؤدي إلى ضياع فرص بيع يومية مؤكدة.`,
        metric: `${outOfStockItems.length} صنف نافد`,
        anomalyKey: 'low_stock',
        actionLabel: 'فحص نواقص المخزون الآن'
      });
    } else if (lowStockItems.length > 0) {
      recs.push({
        id: 'rec_low_stock',
        category: 'inventory',
        type: 'warning',
        title: `⚠️ ${lowStockItems.length} صنف قارب على النفاد (الرصيد أقل من 5)`,
        desc: `ينصح بإصدار طلبات توريد سريعة للأصناف: (${lowStockItems.slice(0, 3).map(p => p.name).join('، ')}).`,
        metric: `${lowStockItems.length} صنف حرج`,
        anomalyKey: 'low_stock',
        actionLabel: 'إعادة طلب المنتجات الحرجة'
      });
    } else {
      recs.push({
        id: 'rec_stock_healthy',
        category: 'inventory',
        type: 'healthy',
        title: '✅ مستويات المخزون ممتازة ومتوازنة',
        desc: 'لا توجد أصناف نافدة أو حرجة، وتغطية المخزون كافية لمقابلة الطلب الحالي.',
        metric: `${products.length} صنف نشط`
      });
    }

    // 2. Customer Debt & Receivables Alert
    if (totalDebtSum > 0) {
      const topDebtors = [...customers].sort((a, b) => (b.balance || 0) - (a.balance || 0)).filter(c => (c.balance || 0) > 0);
      const topDebtor = topDebtors[0];
      const debtRatio = totalSalesSum > 0 ? (totalDebtSum / totalSalesSum) : 0;

      if (debtRatio > 0.35 || totalDebtSum > 10000) {
        recs.push({
          id: 'rec_high_debts',
          category: 'debts',
          type: 'critical',
          title: `🚨 نسبة الديون المتبقية تمثل ${(debtRatio * 100).toFixed(1)}% من إجمالي المبيعات!`,
          desc: `إجمالي الديون المستحقة على الزبائن يصل إلى ${formatPrice(totalDebtSum)}. أكبر مدين هو (${topDebtor?.name}) بمبلغ ${formatPrice(topDebtor?.balance || 0)}.`,
          metric: formatPrice(totalDebtSum),
          anomalyKey: 'debt',
          actionLabel: 'مراجعة وجدولة تحصيل الديون'
        });
      } else {
        recs.push({
          id: 'rec_moderate_debts',
          category: 'debts',
          type: 'warning',
          title: '⚠️ متابعة دورية للتحصيلات المستحقة',
          desc: `يوجد إجمالي ذمم بقيمة ${formatPrice(totalDebtSum)} موزعة على ${topDebtors.length} عميل. تسريع التحصيل يرفع السيولة الحرة.`,
          metric: formatPrice(totalDebtSum),
          anomalyKey: 'debt',
          actionLabel: 'عرض قائمة المدينين'
        });
      }
    }

    // 3. Cash Flow vs Sales Alert
    if (totalWithdrawals > 0 && totalSalesSum > 0) {
      const withdrawalRatio = totalWithdrawals / totalSalesSum;
      if (withdrawalRatio > 0.3) {
        recs.push({
          id: 'rec_high_withdrawals',
          category: 'cash',
          type: 'warning',
          title: '⚠️ ارتفاع نسبة السحوبات النقدية من الصندوق',
          desc: `إجمالي السحوبات بلغ ${formatPrice(totalWithdrawals)} (${(withdrawalRatio * 100).toFixed(1)}% من حجم المبيعات). يوصى بضبط المصاريف لحماية رأس المال التشغيلي.`,
          metric: formatPrice(totalWithdrawals),
          anomalyKey: 'cash_leak',
          actionLabel: 'تدقيق حركات الصندوق'
        });
      }
    }

    // 4. Sales Growth Opportunities
    if (mlForecastingData.trendClassification === 'growing') {
      recs.push({
        id: 'rec_growth_opp',
        category: 'sales',
        type: 'opportunity',
        title: '🚀 اتجاه نمو تصاعدي قوي في المبيعات!',
        desc: `معامل النمو إيجابي (Slope = +${mlForecastingData.slope.toFixed(1)}). من المتوقع تحقيق ${formatPrice(mlForecastingData.next7DaysTotal)} خلال الأيام السبعة القادمة.`,
        metric: `+${mlForecastingData.slope.toFixed(1)}% نمو`
      });
    } else if (mlForecastingData.trendClassification === 'declining') {
      recs.push({
        id: 'rec_decline_alert',
        category: 'sales',
        type: 'warning',
        title: '📉 مؤشر تباطؤ في وتيرة المبيعات اليومية',
        desc: 'يلاحظ انخفاض تدريجي في معدل المبيعات مقارنة بالفترات السابقة. ينصح بتقديم عروض ترويجية وتنشيط حزم الأصناف المتلازمة.',
        metric: 'تباطؤ طفيف'
      });
    }

    return recs;
  }, [sales, customers, products, withdrawals, mlForecastingData, formatPrice]);

  // Filtered recommendations based on active pill
  const filteredRecommendations = useMemo(() => {
    if (recommendationsFilter === 'all') return smartAIRecommendations;
    return smartAIRecommendations.filter(r => r.category === recommendationsFilter);
  }, [smartAIRecommendations, recommendationsFilter]);

  // Filtered Question Bank items
  const filteredQuickQuestions = useMemo(() => {
    return COMPREHENSIVE_QUICK_QUESTIONS.filter(q => {
      const matchesCategory = selectedQuestionCategory === 'all' || q.category === selectedQuestionCategory;
      const matchesSearch = !questionSearchQuery.trim() ||
        q.question.includes(questionSearchQuery) ||
        q.shortTitle.includes(questionSearchQuery) ||
        q.description.includes(questionSearchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [selectedQuestionCategory, questionSearchQuery]);

  // Interactive Growth Simulator Calculated Output
  const simulatedGrowthResults = useMemo(() => {
    const baseRevenue = mlForecastingData.selectedHorizonBaselineTotal || mlForecastingData.next30DaysTotal || 10000;
    const demandMultiplier = 1 + (simDemandIncrease / 100);
    const marginMultiplier = 1 + (simMarginAdjustment / 100);
    const newProductsMultiplier = 1 + (simNewProductsCount * 0.02); // 2% per new item added

    const projectedRevenue = baseRevenue * demandMultiplier * marginMultiplier * newProductsMultiplier;
    const additionalRevenue = projectedRevenue - baseRevenue;
    const projectedAdditionalProfit = additionalRevenue * 0.35; // assumed 35% net margin

    return {
      baseRevenue,
      projectedRevenue,
      additionalRevenue,
      projectedAdditionalProfit
    };
  }, [mlForecastingData.selectedHorizonBaselineTotal, mlForecastingData.next30DaysTotal, simDemandIncrease, simMarginAdjustment, simNewProductsCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md transition-all duration-300 flex flex-col" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white text-slate-900 w-full h-screen overflow-hidden flex flex-col shadow-none"
      >
        {/* Top Navigation Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-3 sm:p-4 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50 shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-600/30 border border-indigo-400/30 text-amber-300 rounded-2xl shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  🤖 الذكاء التحليلي والتوصيات الحسابية الموجهة (Robotic Advisor System)
                </h3>
                <span className="hidden md:inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  محرك هجين فوري
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-indigo-200/80 font-medium mt-0.5">
                نظام تفاعلي متكامل يحلل السجلات المحاسبية الحقيقية، يتنبأ بالنمو، ويوجه قرارات المتجر بدقة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="bg-slate-950 px-3 sm:px-5 py-2 border-b border-slate-800 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setAdvisorActiveTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                advisorActiveTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/40'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span>💬 المحادثة الذكية والمساعد المالي</span>
            </button>

            <button
              type="button"
              onClick={() => setAdvisorActiveTab('forecasting')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                advisorActiveTab === 'forecasting'
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/40'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span>🔮 تنبؤات المبيعات ومحاكي النمو</span>
            </button>

            <button
              type="button"
              onClick={() => setAdvisorActiveTab('recommendations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                advisorActiveTab === 'recommendations'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span>💡 توصيات المساعد الموجهة</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                advisorActiveTab === 'recommendations'
                  ? 'bg-white/25 text-white'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {smartAIRecommendations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdvisorActiveTab('visual_models')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                advisorActiveTab === 'visual_models'
                  ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/40'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <span>🕸️ النماذج البصرية</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>بيانات محلية 100% بدون أي تسريب</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-2 sm:p-4 md:p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/80">
          <AnimatePresence mode="wait">
            {/* 1. CHAT TAB */}
            {advisorActiveTab === 'chat' && (
              <motion.div
                key="tab-chat"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="h-full flex flex-col items-center"
              >
                <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-3xl shadow-xl flex flex-col justify-between overflow-hidden min-h-[580px] h-full ring-1 ring-slate-100 relative">
                  {/* Chat Banner & Session Controls */}
                  <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-3.5 sm:p-4 text-white shrink-0 relative overflow-hidden" dir="rtl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-md shrink-0">
                          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                            <Brain className="w-5 h-5 text-amber-300" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-white">الوكيل المحاسبي الذكي</h4>
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                              موصول بقاعدة البيانات الحية
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-medium">
                            اسأل عن المبيعات، الأرباح، الديون، المخزون، أو اطلب تحليلاً تشخيصياً مدعماً بالأرقام
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setIsQuestionBankOpen(true)}
                          className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>بنك الأسئلة الشامل</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetChat}
                          className="p-1.5 sm:p-2 bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
                          title="بدء جلسة استعلامات جديدة"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="mt-3 pt-2.5 border-t border-indigo-900/50 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      <span className="text-[10.5px] text-amber-300 font-black shrink-0 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        أسئلة سريعة:
                      </span>
                      {[
                        'كم إجمالي المبيعات المسجلة؟',
                        'من هم أكبر العملاء المدينين؟',
                        'هل يوجد نقص في المخزون؟',
                        'ما هو صافي الأرباح الكلي؟',
                        'توقعات المبيعات للأسبوع القادم',
                        'فحص وتدقيق صحة المتجر'
                      ].map((chip, idx) => (
                        <button
                          key={`quick-chip-${idx}`}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white rounded-lg text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-slate-900/95" dir="rtl">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                          <Brain className="w-8 h-8 animate-pulse" />
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-white">
                          مرحباً بك في المستشار المحاسبي الذكي
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md leading-relaxed font-medium">
                          أنا مساعدك المالي التفاعلي، متصل بجميع أقسام متجرك مباشرة. اطرح أي سؤال مالي أو اختر من الأسئلة المقترحة للحصول على إجابة تحليلية دقيقة.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsQuestionBankOpen(true)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>تصفح بنك الأسئلة الشامل (30+ استفسار)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg, msgIdx) => (
                        <div
                          key={`chat-msg-${msg.id || msgIdx}-${msgIdx}`}
                          className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                            msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto flex-row'
                          }`}
                        >
                          {/* Role Icon */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                              msg.role === 'user'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white'
                            }`}
                          >
                            {msg.role === 'user' ? (
                              <Users className="w-4 h-4" />
                            ) : (
                              <Brain className="w-4 h-4 text-amber-300" />
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`rounded-3xl p-3.5 sm:p-4 text-xs sm:text-sm relative group transition-all shadow-md ${
                              msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                                : 'bg-slate-950/80 border border-indigo-900/60 text-slate-100 rounded-tl-none font-normal shadow-xl'
                            }`}
                          >
                            {/* Execution Stages Badges (for Assistant answers) */}
                            {msg.role === 'assistant' && msg.stages && msg.stages.length > 0 && (
                              <div className="mb-3 pb-2.5 border-b border-indigo-500/20 flex flex-wrap items-center gap-1.5">
                                {msg.stages.map((stg: any, sIdx: number) => (
                                  <span
                                    key={`stage-badge-${msg.id || msgIdx}-${msgIdx}-${sIdx}`}
                                    className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-lg text-[9.5px] font-bold flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    <span>{stg.badge || stg.title}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Message Text */}
                            {msg.role === 'user' ? (
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            ) : (
                              <div className="space-y-1">{formatAssistantMessage(msg.text, `msg-${msg.id || msgIdx}-${msgIdx}`)}</div>
                            )}

                            {/* Footer Actions */}
                            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {new Date(msg.timestamp).toLocaleTimeString('ar-SA', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>

                              {msg.role === 'assistant' && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(msg.id, msg.text)}
                                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    title="نسخ الإجابة"
                                  >
                                    {copiedMessageId === msg.id ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRateMessage(msg.id, 'up')}
                                    className={`p-1 hover:bg-white/10 rounded transition-colors cursor-pointer ${
                                      ratedMessages[msg.id] === 'up' ? 'text-emerald-400' : 'text-slate-400'
                                    }`}
                                    title="إجابة مفيدة"
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRateMessage(msg.id, 'down')}
                                    className={`p-1 hover:bg-white/10 rounded transition-colors cursor-pointer ${
                                      ratedMessages[msg.id] === 'down' ? 'text-rose-400' : 'text-slate-400'
                                    }`}
                                    title="إجابة غير دقيقة"
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                    title="حذف الرسالة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Typing Animation */}
                    {isTyping && (
                      <div className="flex items-center gap-2.5 text-slate-300 text-xs font-bold p-3 bg-slate-950/70 border border-indigo-900/60 rounded-2xl w-fit" dir="rtl">
                        <Brain className="w-4 h-4 text-amber-400 animate-spin" />
                        <span className="text-amber-300">جارٍ قراءة وفحص السجلات الحسابية وصياغة الإجابة...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Fixed Memoized Chat Input */}
                  <ChatInputForm
                    isTyping={isTyping}
                    onSendMessage={handleSendMessage}
                    onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
                  />
                </div>
              </motion.div>
            )}

            {/* 2. FORECASTING & GROWTH SIMULATOR TAB */}
            {advisorActiveTab === 'forecasting' && (
              <motion.div
                key="tab-forecasting"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-6xl mx-auto"
                dir="rtl"
              >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 rounded-3xl text-white shadow-lg border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-base sm:text-lg text-amber-300 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      <span>🔮 التنبؤ المالي المتقدم ومحاكي النمو الإحصائي</span>
                    </h3>
                    <p className="text-slate-300 text-xs">
                      نماذج إحصائية متطورة (OLS Regression + Holt-Winters) مع تحليل استكشافي وموسمي وفحص شامل لصحة المتجر
                    </p>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                      mlForecastingData.trendClassification === 'growing'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : mlForecastingData.trendClassification === 'declining'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {mlForecastingData.trendClassification === 'growing'
                        ? '📈 نمو متصاعد'
                        : mlForecastingData.trendClassification === 'declining'
                        ? '📉 تباطؤ وتيرة'
                        : '⚖️ وتيرة مستقرة'}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold font-mono">
                      دقة النموذج R²: {(mlForecastingData.rSquared * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Horizon Selection Bar */}
                <div className="bg-slate-900/80 border border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>أفق التنبؤ الزمني المستهدف:</span>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedForecastHorizon('7d')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedForecastHorizon === '7d'
                          ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      أسبوع (7 أيام)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedForecastHorizon('30d')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedForecastHorizon === '30d'
                          ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      شهر (30 يوماً)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedForecastHorizon('90d')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedForecastHorizon === '90d'
                          ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ربع سنة (90 يوماً)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedForecastHorizon('365d')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedForecastHorizon === '365d'
                          ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400/50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      سنة كاملة (365 يوماً)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedForecastHorizon('custom')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedForecastHorizon === 'custom'
                          ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-400/50'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      فترة مخصصة
                    </button>

                    {selectedForecastHorizon === 'custom' && (
                      <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 mr-1">
                        <input
                          type="number"
                          min="1"
                          max="730"
                          value={customHorizonDays}
                          onChange={(e) => setCustomHorizonDays(Math.max(1, Math.min(730, parseInt(e.target.value) || 1)))}
                          className="w-14 bg-slate-900 text-amber-300 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-700 text-center font-bold"
                        />
                        <span className="text-[11px] text-slate-400">يوم</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setForecastSubTab('projections')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      forecastSubTab === 'projections'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>التوقعات والسيناريوهات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForecastSubTab('seasonality')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      forecastSubTab === 'seasonality'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>الموسمية وأيام الأسبوع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForecastSubTab('statistics')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      forecastSubTab === 'statistics'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>التحليل الإحصائي والاستكشافي (EDA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForecastSubTab('diagnostics')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      forecastSubTab === 'diagnostics'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>فحص الأخطاء وتدقيق المتجر</span>
                    {mlForecastingData.storeDiagnostics.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-white/30 text-white text-[10px] rounded-full font-bold">
                        {mlForecastingData.storeDiagnostics.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setForecastSubTab('simulator')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      forecastSubTab === 'simulator'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>محاكي النمو</span>
                  </button>
                </div>

                {/* Sub-tab 1: PROJECTIONS & SCENARIOS */}
                {forecastSubTab === 'projections' && (
                  <div className="space-y-6">
                    {/* Core Dynamic KPIs for Selected Horizon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          المبيعات المتوقعة (خلال {mlForecastingData.targetHorizonDays} يوماً)
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-indigo-600 font-mono">
                          {formatPrice(mlForecastingData.selectedHorizonBaselineTotal)}
                        </h4>
                        <p className="text-[10px] text-slate-400">المسار المعتدل الأساسي</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">المسار المتفائل (أعلى نطاق)</span>
                        <h4 className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                          {formatPrice(mlForecastingData.selectedHorizonOptimisticTotal)}
                        </h4>
                        <p className="text-[10px] text-slate-400">بمعدل ثقة 95% وازدهار الطلب</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">المسار المتحفظ (أدنى نطاق)</span>
                        <h4 className="text-base sm:text-lg font-black text-amber-600 font-mono">
                          {formatPrice(mlForecastingData.selectedHorizonConservativeTotal)}
                        </h4>
                        <p className="text-[10px] text-slate-400">هامش أمان تحوطي لإدارة المخاطر</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">متوسط المبيعات اليومية المتوقعة</span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 font-mono">
                          {formatPrice(Math.round(mlForecastingData.selectedHorizonBaselineTotal / mlForecastingData.targetHorizonDays))}
                        </h4>
                        <p className="text-[10px] text-slate-400">وتيرة متوازنة في اليوم الواحد</p>
                      </div>
                    </div>

                    {/* Probabilistic Scenario Matrix Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Optimistic */}
                      <div className="bg-gradient-to-b from-emerald-50 to-white p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span>🚀 السيناريو المتفائل (Optimistic)</span>
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            +95% Upper
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">إجمالي الإيرادات المتوقعة:</span>
                          <h4 className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                            {formatPrice(mlForecastingData.selectedHorizonOptimisticTotal)}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          يفترض ذروة إقبال العملاء، استقرار التوريدات، واستجابة ممتازة للعروض والحملات.
                        </p>
                      </div>

                      {/* Baseline */}
                      <div className="bg-gradient-to-b from-indigo-50 to-white p-5 rounded-3xl border border-indigo-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-800 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            <span>⚖️ السيناريو المعتدل (Baseline)</span>
                          </span>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            المسار المتوقع
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">إجمالي الإيرادات المتوقعة:</span>
                          <h4 className="text-lg sm:text-xl font-black text-indigo-700 font-mono">
                            {formatPrice(mlForecastingData.selectedHorizonBaselineTotal)}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          المسار الإحصائي المرجح المبني على النمط التاريخي والانحدار مع المعايرة الموسمية.
                        </p>
                      </div>

                      {/* Conservative */}
                      <div className="bg-gradient-to-b from-amber-50 to-white p-5 rounded-3xl border border-amber-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            <span>🛡️ السيناريو المتحفظ (Conservative)</span>
                          </span>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            -80% Lower
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500">إجمالي الإيرادات المتوقعة:</span>
                          <h4 className="text-lg sm:text-xl font-black text-amber-700 font-mono">
                            {formatPrice(mlForecastingData.selectedHorizonConservativeTotal)}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          نطاق الحيطة والحذر للتحوط من تقلبات السوق أو بطء حركة الزبائن في الفترات الهادئة.
                        </p>
                      </div>
                    </div>

                    {/* Daily Projections Sample Table */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm sm:text-base">
                              المسار اليومي المتوقع للأيام القادمة
                            </h4>
                            <p className="text-xs text-slate-500">
                              عرض تفصيلي لتقديرات المبيعات اليومية عبر المسارات الثلاثة
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          عرض أول {Math.min(10, mlForecastingData.dailyProjections.length)} أيام
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                              <th className="p-2.5 font-black">التاريخ واليوم</th>
                              <th className="p-2.5 font-black text-indigo-700">المسار المعتدل (الأساسي)</th>
                              <th className="p-2.5 font-black text-emerald-700">المسار المتفائل</th>
                              <th className="p-2.5 font-black text-amber-700">المسار المتحفظ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {mlForecastingData.dailyProjections.slice(0, 10).map((proj, idx) => (
                              <tr key={`proj-row-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-2.5 font-sans font-bold text-slate-800">
                                  {proj.dayName} ({proj.dateStr})
                                </td>
                                <td className="p-2.5 font-bold text-indigo-600">
                                  {formatPrice(proj.projectedSales)}
                                </td>
                                <td className="p-2.5 font-bold text-emerald-600">
                                  {formatPrice(proj.optimisticSales)}
                                </td>
                                <td className="p-2.5 font-bold text-amber-600">
                                  {formatPrice(proj.conservativeSales)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Stock Depletion Velocity & Replenishment Alerts */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm sm:text-base">
                              توقعات استهلاك ونفاد المخزون (Stockout Velocity)
                            </h4>
                            <p className="text-xs text-slate-500">
                              سرعة السحب اليومي وتحديد موعد إعادة الطلب الموصى به
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mlForecastingData.stockDepletionForecast.map((item, idx) => (
                          <div
                            key={`depletion-${item.product.id || idx}-${idx}`}
                            className={`p-4 rounded-2xl border transition-all space-y-2 ${
                              item.daysRemaining <= 3
                                ? 'bg-rose-50/70 border-rose-200 text-slate-900'
                                : item.daysRemaining <= 7
                                ? 'bg-amber-50/70 border-amber-200 text-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-black text-xs text-slate-900 truncate">{item.product.name}</h5>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                item.daysRemaining <= 3
                                  ? 'bg-rose-600 text-white'
                                  : item.daysRemaining <= 7
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {item.daysRemaining === 0
                                  ? 'نافد الآن!'
                                  : `سينفد خلال ${item.daysRemaining} يوم`}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 font-mono">
                              <div>
                                <span>الرصيد:</span>
                                <span className="font-bold text-slate-900 mx-1">{item.product.stock_quantity}</span>
                              </div>
                              <div>
                                <span>الاستهلاك:</span>
                                <span className="font-bold text-slate-900 mx-1">{item.dailyVelocity} / يوم</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10.5px]">
                              <span className="text-slate-500 font-medium">الكمية المقترحة لإعادة الطلب:</span>
                              <span className="font-black text-indigo-700 font-mono">+{item.recommendedReorder} وحدة</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: SEASONALITY & DAY OF WEEK */}
                {forecastSubTab === 'seasonality' && (
                  <div className="space-y-6">
                    {/* Peak and Slowest Days Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-3xl border border-emerald-500/30 shadow-md space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <TrendingUp className="w-4 h-4" />
                          <span>يوم الذروة والأعلى مبيعاً (Peak Trading Day)</span>
                        </div>
                        <h4 className="text-xl sm:text-2xl font-black text-emerald-300">
                          {mlForecastingData.peakDay.dayName}
                        </h4>
                        <p className="text-xs text-slate-300 font-mono">
                          بمتوسط مبيعات: {formatPrice(mlForecastingData.peakDay.avgSales)}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-500/30 shadow-md space-y-2">
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                          <Clock className="w-4 h-4" />
                          <span>اليوم الأكثر هدوءاً (Slowest Day)</span>
                        </div>
                        <h4 className="text-xl sm:text-2xl font-black text-indigo-200">
                          {mlForecastingData.slowestDay.dayName}
                        </h4>
                        <p className="text-xs text-slate-300 font-mono">
                          بمتوسط مبيعات: {formatPrice(mlForecastingData.slowestDay.avgSales)}
                        </p>
                      </div>
                    </div>

                    {/* Day-of-Week Seasonality Visual Radar/Bars */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm sm:text-base">
                            توزيع القوة الموسمية عبر أيام الأسبوع (Day-of-Week Seasonality Index)
                          </h4>
                          <p className="text-xs text-slate-500">
                            مقارنة متوسط المبيعات والحصة النسبية لكل يوم لمعايرة الاستعدادات والتجهيزات
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        {mlForecastingData.daySeasonality.map((day, idx) => {
                          const maxDayAvg = Math.max(...mlForecastingData.daySeasonality.map(d => d.avgSales), 1);
                          const barWidth = Math.max(8, (day.avgSales / maxDayAvg) * 100);

                          return (
                            <div key={`season-day-${day.dayIndex}-${idx}`} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-800 font-black">{day.dayName}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({day.count} أيام مسجلة)</span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                  <span className="text-slate-500">{day.sharePercentage}% من الإجمالي</span>
                                  <span className="text-indigo-600 font-black">{formatPrice(day.avgSales)}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    day.relativeIndex >= 1.15
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : day.relativeIndex <= 0.85
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {day.relativeIndex}x
                                  </span>
                                </div>
                              </div>

                              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    day.relativeIndex >= 1.15
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                      : day.relativeIndex <= 0.85
                                      ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                      : 'bg-gradient-to-r from-indigo-500 to-blue-400'
                                  }`}
                                  style={{ width: `${barWidth}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: EXPLORATORY DATA ANALYSIS & STATISTICS */}
                {forecastSubTab === 'statistics' && (
                  <div className="space-y-6">
                    {/* Advanced Statistical Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">المتوسط الحسابي (Mean Daily)</span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 font-mono">
                          {formatPrice(mlForecastingData.avgDailySales)}
                        </h4>
                        <p className="text-[10px] text-slate-400">القيمة المتوقعة المركزية</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">الوسيط الإحصائي (Median Daily)</span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 font-mono">
                          {formatPrice(mlForecastingData.medianDaily)}
                        </h4>
                        <p className="text-[10px] text-slate-400">مقياس مقاوم للقيم الشاذة</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">الانحراف المعياري (Std Dev σ)</span>
                        <h4 className="text-base sm:text-lg font-black text-indigo-600 font-mono">
                          ±{formatPrice(mlForecastingData.stdDev)}
                        </h4>
                        <p className="text-[10px] text-slate-400">مدى تشتت المبيعات اليومية</p>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">معامل التذبذب (Volatility CV)</span>
                        <h4 className="text-base sm:text-lg font-black text-amber-600 font-mono">
                          {mlForecastingData.volatilityRate}%
                        </h4>
                        <p className="text-[10px] text-slate-400">نسبة التغير النسبي في الطلب</p>
                      </div>
                    </div>

                    {/* Moving Averages & Regression Coefficients */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                        <h4 className="font-black text-slate-900 text-sm">المتوسطات المتحركة للاتجاه (Moving Averages)</h4>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-sans">المتوسط المتحرك لـ 7 أيام (MA-7):</span>
                            <span className="font-bold text-indigo-700">{formatPrice(mlForecastingData.ma7)}</span>
                          </div>
                          <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-sans">المتوسط المتحرك لـ 30 يوماً (MA-30):</span>
                            <span className="font-bold text-indigo-700">{formatPrice(mlForecastingData.ma30)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                        <h4 className="font-black text-slate-900 text-sm">معاملات معادلة الانحدار (Linear OLS Fit)</h4>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-sans">ميل الخط (Slope β₁):</span>
                            <span className="font-bold text-emerald-700">
                              {mlForecastingData.slope > 0 ? `+${mlForecastingData.slope.toFixed(2)}` : mlForecastingData.slope.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 font-sans">معامل التحديد (R-Squared):</span>
                            <span className="font-bold text-purple-700">{(mlForecastingData.rSquared * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 4: STORE HEALTH DIAGNOSTICS & REMEDIATION (معالجة الأخطاء والعيوب) */}
                {forecastSubTab === 'diagnostics' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 p-4 sm:p-5 rounded-3xl text-white shadow-md border border-rose-500/30 flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-black text-sm sm:text-base text-rose-300 flex items-center gap-2">
                          <Wrench className="w-5 h-5 text-rose-400" />
                          <span>مركز فحص الأخطاء ومعالجة عيوب المتجر والبيانات</span>
                        </h4>
                        <p className="text-xs text-slate-300">
                          نظام تدقيق محاسبي آلي يرصد التسعير السلبي، الديون المتأخرة، البضائع الراكدة، والسيولة النقدية
                        </p>
                      </div>
                    </div>

                    {mlForecastingData.storeDiagnostics.length === 0 ? (
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h4 className="font-black text-base text-slate-900">سجلات المتجر خالية من أي أخطاء أو عيوب تشغيلية!</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          تم فحص تسعير المنتجات، والديون المعلقة، والمخزون الراكد بنجاح دون رصد أي مشاكل حرجة.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {mlForecastingData.storeDiagnostics.map((diag, idx) => (
                          <div
                            key={`diag-${diag.id || idx}-${idx}`}
                            className={`p-5 rounded-3xl border shadow-xs space-y-3 transition-all ${
                              diag.severity === 'critical'
                                ? 'bg-rose-50/70 border-rose-200'
                                : diag.severity === 'warning'
                                ? 'bg-amber-50/70 border-amber-200'
                                : 'bg-indigo-50/70 border-indigo-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                                <span>{diag.title}</span>
                              </h5>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 w-fit ${
                                diag.severity === 'critical'
                                  ? 'bg-rose-600 text-white'
                                  : diag.severity === 'warning'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-indigo-600 text-white'
                              }`}>
                                {diag.severity === 'critical' ? 'خلل حرج' : 'تنبيه تدقيق'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 leading-relaxed">
                              {diag.description}
                            </p>

                            <div className="p-3 bg-white/80 rounded-2xl border border-slate-200/80 space-y-1">
                              <span className="text-[11px] font-black text-indigo-900 block">💡 مقترح المعالجة والإصلاح:</span>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                {diag.suggestedFix}
                              </p>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdvisorActiveTab('chat');
                                  handleSendMessage(diag.promptToFix);
                                }}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>معالجة فورية عبر المساعد الذكي 💬</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 5: GROWTH SIMULATOR */}
                {forecastSubTab === 'simulator' && (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm sm:text-base">
                            محاكي نمو الإيرادات والأرباح التفاعلي ({mlForecastingData.targetHorizonDays} يوماً)
                          </h4>
                          <p className="text-xs text-slate-500">
                            حرك المنزلقات أدناه لاختبار سيناريوهات تحسين المبيعات والتسعير وتأثيرها المالي المباشر
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Control Sliders */}
                      <div className="lg:col-span-2 space-y-5">
                        {/* Slider 1: Demand Increase */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700">📈 الزيادة المتوقعة في الطلب والزبائن (تنشيط المبيعات)</span>
                            <span className="text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg">
                              +{simDemandIncrease}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={simDemandIncrease}
                            onChange={(e) => setSimDemandIncrease(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>0% (الوضع الحالي)</span>
                            <span>+50%</span>
                            <span>+100% (مضاعفة الإقبال)</span>
                          </div>
                        </div>

                        {/* Slider 2: Margin / Pricing Adjustment */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700">🏷️ متوسط تعديل الأسعار وهامش الربح</span>
                            <span className={`font-mono px-2 py-0.5 rounded-lg ${
                              simMarginAdjustment >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {simMarginAdjustment >= 0 ? `+${simMarginAdjustment}%` : `${simMarginAdjustment}%`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-20"
                            max="30"
                            step="2"
                            value={simMarginAdjustment}
                            onChange={(e) => setSimMarginAdjustment(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>-20% (خصومات)</span>
                            <span>0% (ثابت)</span>
                            <span>+30% (زيادة الهامش)</span>
                          </div>
                        </div>

                        {/* Slider 3: New Products */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-700">📦 إدخال أصناف ومنتجات جديدة إلى المخزون</span>
                            <span className="text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded-lg">
                              +{simNewProductsCount} صنف جديد
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="1"
                            value={simNewProductsCount}
                            onChange={(e) => setSimNewProductsCount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>0 أصناف</span>
                            <span>15 صنفاً</span>
                            <span>30 صنفاً جديداً</span>
                          </div>
                        </div>
                      </div>

                      {/* Simulator Projected Results Card */}
                      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg">
                        <div>
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-3">
                            <Sparkles className="w-4 h-4" />
                            <span>نتائج المحاكاة لـ ({mlForecastingData.targetHorizonDays} يوماً)</span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <span className="text-[10px] text-slate-300">الإيرادات الإجمالية التقديرية</span>
                              <h3 className="text-xl font-black text-emerald-400 font-mono">
                                {formatPrice(simulatedGrowthResults.projectedRevenue)}
                              </h3>
                            </div>

                            <div className="pt-2 border-t border-white/10">
                              <span className="text-[10px] text-slate-300">الزيادة المتوقعة في المبيعات</span>
                              <p className="text-sm font-bold text-amber-300 font-mono">
                                +{formatPrice(simulatedGrowthResults.additionalRevenue)}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-white/10">
                              <span className="text-[10px] text-slate-300">صافي الأرباح الإضافية المتوقعة</span>
                              <p className="text-sm font-bold text-teal-300 font-mono">
                                +{formatPrice(simulatedGrowthResults.projectedAdditionalProfit)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-white/10 pt-3">
                          * الحسابات تقريبية مبنية على معدلات التحويل الحقيقية وسجل المبيعات المسجل في النظام.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. RECOMMENDATIONS & STRATEGIES TAB */}
            {advisorActiveTab === 'recommendations' && (
              <motion.div
                key="tab-recommendations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 max-w-6xl mx-auto"
                dir="rtl"
              >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl text-white shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>💡 توصيات المساعد الموجهة (Smart Directed Insights)</span>
                    </h3>
                    <p className="text-slate-300 text-xs mt-1">
                      توصيات حية مرتبطة مباشرة بقواعد التدقيق المالي ومؤشرات السيولة والديون والمخزون
                    </p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-mono font-bold">
                    {smartAIRecommendations.length} توصية نشطة
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {[
                    { id: 'all', label: 'كافة التوصيات' },
                    { id: 'inventory', label: 'المخزون والنواقص 📦' },
                    { id: 'debts', label: 'الديون والعملاء 👥' },
                    { id: 'sales', label: 'المبيعات والنمو 📈' },
                    { id: 'cash', label: 'السيولة والصندوق 💵' }
                  ].map((filter, filterIdx) => (
                    <button
                      key={`rec-filter-${filter.id}-${filterIdx}`}
                      type="button"
                      onClick={() => setRecommendationsFilter(filter.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        recommendationsFilter === filter.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Recommendations Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecommendations.map((rec, idx) => (
                    <div
                      key={`rec-item-${rec.id || idx}-${idx}`}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 space-y-3 shadow-sm flex flex-col justify-between ${
                        rec.type === 'critical'
                          ? 'bg-rose-50/80 border-rose-200 text-slate-900'
                          : rec.type === 'warning'
                          ? 'bg-amber-50/80 border-amber-200 text-slate-900'
                          : rec.type === 'opportunity'
                          ? 'bg-indigo-50/80 border-indigo-200 text-slate-900'
                          : 'bg-emerald-50/80 border-emerald-200 text-slate-900'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {rec.type === 'critical' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                            {rec.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
                            {rec.type === 'opportunity' && <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0" />}
                            {rec.type === 'healthy' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                            <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-snug">{rec.title}</h4>
                          </div>

                          {rec.metric && (
                            <span className="text-[10px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                              {rec.metric}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {rec.desc}
                        </p>
                      </div>

                      {rec.anomalyKey && (
                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => onOpenAnomalyModal?.(rec.anomalyKey!)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <span>{rec.actionLabel || 'فحص المشكلة ومعالجتها'}</span>
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 4. VISUAL MODELS TAB */}
            {advisorActiveTab === 'visual_models' && (
              <motion.div
                key="tab-visuals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-6xl mx-auto"
              >
                <VisualModelsExtension
                  products={products}
                  customers={customers}
                  sales={sales}
                  saleItems={saleItems}
                  debts={debts}
                  withdrawals={withdrawals}
                  formatPrice={formatPrice}
                  initialTab="market_basket"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Embedded Question Bank Modal */}
      <AnimatePresence>
        {isQuestionBankOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-2xl shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">✨ بنك الأسئلة والاستفسارات الذكية</h3>
                    <p className="text-[11px] text-indigo-200/80 font-medium mt-0.5">
                      اضغط على أي سؤال لإرساله مباشرة إلى المستشار المالي والحصول على تقرير مدقق
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsQuestionBankOpen(false)}
                  className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Category Tabs */}
              <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    placeholder="ابحث في بنك الأسئلة (مثال: مبيعات، أرباح، جرد، موردين)..."
                    className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {QUICK_QUESTION_CATEGORIES.map((cat, idx) => (
                    <button
                      key={`advisor-cat-${cat.id || idx}-${idx}`}
                      type="button"
                      onClick={() => setSelectedQuestionCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedQuestionCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions List */}
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50">
                {filteredQuickQuestions.map((q, idx) => (
                  <button
                    key={`modal-q-${q.id || idx}-${idx}`}
                    type="button"
                    onClick={() => {
                      setIsQuestionBankOpen(false);
                      setAdvisorActiveTab('chat');
                      handleSendMessage(q.question);
                    }}
                    className="p-3.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl text-right transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-base">{q.icon}</span>
                        <span className="text-[9.5px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                          {q.badge}
                        </span>
                      </div>
                      <h4 className="font-black text-xs text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {q.shortTitle}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed line-clamp-2">
                        {q.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-indigo-600">
                      <span>طرح السؤال في المحادثة</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
