import React from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingCart, 
  Scan, 
  Package, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Briefcase, 
  Download, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  Database, 
  AlertCircle, 
  ChevronLeft 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, LabelList } from 'recharts';
import { Card } from '../../components/ui/Card';

interface DashboardViewProps {
  summary: {
    todaySales: number;
    monthlySales: number;
    totalSales: number;
    totalProfit: number;
    totalInventoryCost: number;
    totalCostOfSales: number;
    totalDebts: number;
    lowStock: number;
    expiringStock: number;
  };
  formatPrice: (price: number) => string;
  setActiveTab: (tab: string) => void;
  setScannerMode: (mode: any) => void;
  setIsScannerOpen: (open: boolean) => void;
  exportData: () => void;
  isBackupOverdue?: boolean;
  verifyAdminPermission: (action: string, callback: () => void, title: string) => void;
  setSalesDetailsTab: (tab: 'days' | 'weeks' | 'months') => void;
  setShowMonthlySalesDetailsModal: (show: boolean) => void;
  setShowSalesSummaryModal: (show: boolean) => void;
  setShowProfitSummaryModal: (show: boolean) => void;
  setShowInventoryDetailsModal: (show: boolean) => void;
  setShowSupplierSummaryModal: (show: boolean) => void;
  trendMode: 'daily' | 'monthly' | 'yearly';
  setTrendMode: (mode: 'daily' | 'monthly' | 'yearly') => void;
  dailySales: any[];
  monthlySalesTrend: any[];
  yearlySalesTrend: any[];
  topProducts: any[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  formatPrice,
  setActiveTab,
  setScannerMode,
  setIsScannerOpen,
  exportData,
  isBackupOverdue,
  verifyAdminPermission,
  setSalesDetailsTab,
  setShowMonthlySalesDetailsModal,
  setShowSalesSummaryModal,
  setShowProfitSummaryModal,
  setShowInventoryDetailsModal,
  setShowSupplierSummaryModal,
  trendMode,
  setTrendMode,
  dailySales,
  monthlySalesTrend,
  yearlySalesTrend,
  topProducts,
}) => {
  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">الوصول السريع</h2>
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 w-full">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('pos')} 
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-emerald-200 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-[9px] sm:text-[10px] text-slate-700">بيع جديد</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab('pos');
              setScannerMode('pos');
              setIsScannerOpen(true);
            }} 
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-violet-200 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
              <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-[9px] sm:text-[10px] text-slate-700">الماسح</span>
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('products')} 
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-[9px] sm:text-[10px] text-slate-700">المخزون</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('customers')} 
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-[9px] sm:text-[10px] text-slate-700 text-center">الزبائن</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('notes')} 
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-pink-200 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-pink-50 rounded-lg flex items-center justify-center group-hover:bg-pink-500 transition-colors">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-[9px] sm:text-[10px] text-slate-700 text-center">الصندوق</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('history')} 
            className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-slate-800 transition-colors">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-[9px] sm:text-[10px] text-slate-700">التقارير</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              verifyAdminPermission('analytics', () => {
                setActiveTab('analytics');
              }, '📊 صلاحية التقارير والتحليلات');
            }} 
            className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-indigo-300 hover:bg-indigo-100/50 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-extrabold text-[9px] sm:text-[10px] text-indigo-700 text-center">التحليل</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('suppliers')} 
            className="p-1.5 sm:p-2 rounded-xl bg-amber-50 border border-amber-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-amber-300 hover:bg-amber-100/50 hover:shadow-md transition-all group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 rounded-lg flex items-center justify-center group-hover:bg-amber-600 transition-colors">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-extrabold text-[9px] sm:text-[10px] text-amber-700 text-center">الموردين</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={exportData} 
            className={`p-1.5 sm:p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group cursor-pointer ${
              isBackupOverdue 
                ? 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white border border-red-400/90 shadow-[0_0_16px_rgba(239,68,68,0.7)] animate-pulse hover:from-red-500 hover:to-rose-500' 
                : 'bg-white border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-md'
            }`}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${
              isBackupOverdue ? 'bg-white/20 text-white' : 'bg-amber-50 group-hover:bg-amber-500'
            }`}>
              <Download className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                isBackupOverdue ? 'text-white animate-bounce' : 'text-amber-600 group-hover:text-white transition-colors'
              }`} />
            </div>
            <span className={`font-extrabold text-[9px] sm:text-[10px] ${
              isBackupOverdue ? 'text-white' : 'text-slate-700'
            }`}>
              {isBackupOverdue ? 'احتياطية ⚠️' : 'احتياطية'}
            </span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              verifyAdminPermission('smart_import', () => {
                setActiveTab('smart-import');
              }, '✨ صلاحية الاستيراد الذكي (AI)');
            }} 
            className="p-1.5 sm:p-2 rounded-xl bg-violet-50/40 border border-violet-100/60 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-violet-300 hover:bg-violet-100/40 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-700 transition-colors">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-extrabold text-[9px] sm:text-[10px] text-violet-705 text-center">استيراد ذكي</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }} 
          className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-100/50 border border-emerald-400/20 col-span-2 md:col-span-1 cursor-pointer hover:shadow-lg transition-all duration-300"
          onClick={() => {
            setSalesDetailsTab('days');
            setShowMonthlySalesDetailsModal(true);
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <ShoppingCart className="w-4 h-4 opacity-80" />
            <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md text-emerald-100">اليوم 🛈</span>
          </div>
          <p className="text-[10px] opacity-80 mt-1">المبيعات اليومية</p>
          <p className="text-xl font-bold">{formatPrice(summary.todaySales)}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all duration-300"
          onClick={() => {
            setSalesDetailsTab('months');
            setShowMonthlySalesDetailsModal(true);
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">الشهر 🛈</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">مبيعات الشهر بسعر البيع</p>
          <p className="text-lg font-bold text-slate-800">{formatPrice(summary.monthlySales)}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
          onClick={() => setShowSalesSummaryModal(true)}
        >
          <div className="flex justify-between items-start mb-1">
            <ShoppingCart className="w-4 h-4 text-blue-500" />
            <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">الكلي 🛈</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">إجمالي المبيعات بسعر البيع</p>
          <p className="text-lg font-bold text-slate-800">{formatPrice(summary.totalSales)}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          className="p-3 rounded-2xl bg-slate-800 text-white shadow-sm cursor-pointer hover:bg-slate-700/80 hover:border-emerald-500/50 border border-transparent hover:shadow-md transition-all duration-300"
          onClick={() => setShowProfitSummaryModal(true)}
        >
          <div className="flex justify-between items-start mb-1">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded-md text-emerald-300">تفاصيل 🛈</span>
          </div>
          <p className="text-[10px] text-slate-200 mt-1">صافي الأرباح المحققة</p>
          <p className="text-lg font-bold text-white">{formatPrice(summary.totalProfit)}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all"
          onClick={() => setShowInventoryDetailsModal(true)}
        >
          <div className="flex justify-between items-start mb-1">
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md">تفاصيل كاملة 🛈</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">تكلفة المخزون</p>
          <p className="text-lg font-bold text-slate-800">{formatPrice(summary.totalInventoryCost)}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          className="p-3 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100/50 hover:border-amber-300 transition-all"
          onClick={() => setShowSupplierSummaryModal(true)}
        >
          <div className="flex justify-between items-start mb-1">
            <Briefcase className="w-4 h-4 text-amber-600" />
            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">تسوية 🛈</span>
          </div>
          <p className="text-[10px] text-amber-600/70 mt-1">مستحق المورد (بالتكلفة)</p>
          <p className="text-lg font-bold text-amber-900">{formatPrice(summary.totalCostOfSales)}</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }} 
          className="p-3 rounded-2xl bg-red-50 border border-red-100 shadow-sm cursor-pointer hover:bg-red-100 transition-colors" 
          onClick={() => setActiveTab('customers')}
        >
          <div className="flex justify-between items-start mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-[9px] font-bold bg-white text-red-500 px-1.5 py-0.5 rounded-md shadow-sm">تراكمي</span>
          </div>
          <p className="text-[10px] text-red-400 mt-1">إجمالي الديون</p>
          <p className="text-lg font-bold text-red-700">{formatPrice(summary.totalDebts)}</p>
        </motion.div>
      </div>

      {summary.lowStock > 0 && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-red-50 p-4 rounded-3xl border border-red-100 flex items-center justify-between gap-4 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => setActiveTab('products')}
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-2xl">
              <AlertCircle className="text-red-600 w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-red-900">نواقص المخزون</p>
              <p className="text-sm text-red-600">لديك {summary.lowStock} منتجات قاربت على النفاد، اضغط هنا للمراجعة.</p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-red-400" />
        </motion.div>
      )}

      {summary.expiringStock > 0 && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setActiveTab('products')}
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-2xl">
              <AlertCircle className="text-amber-600 w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-amber-900">تنبيه الصلاحية</p>
              <p className="text-sm text-amber-700">لديك {summary.expiringStock} منتجات قاربت صلاحيتها على الانتهاء، اضغط هنا للمراجعة.</p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-amber-400" />
        </motion.div>
      )}

      <Card className="p-6 h-96 rounded-3xl shadow-sm border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/10 flex flex-col relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-4 relative z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl shadow-2xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-black text-sm text-slate-800 tracking-tight">تحليل ومتابعة المبيعات</h3>
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                تحديث فوري مباشر
              </div>
            </div>
            {(() => {
              const chartData = trendMode === 'daily' ? dailySales : trendMode === 'monthly' ? monthlySalesTrend : yearlySalesTrend;
              const totalInPeriod = chartData.reduce((sum: number, d: any) => sum + (d.total || 0), 0);
              const maxVal = Math.max(...chartData.map((d: any) => d.total || 0), 0);
              return (
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 mt-1">
                  <div>إجمالي مبيعات الفترة: <span className="text-slate-700 font-extrabold">{formatPrice(totalInPeriod)}</span></div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div>أعلى قيمة: <span className="text-indigo-600 font-extrabold">{formatPrice(maxVal)}</span></div>
                </div>
              );
            })()}
          </div>

          <div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-full gap-1 border border-slate-200/60 shadow-2xs self-start sm:self-auto">
            <button 
              onClick={() => setTrendMode('daily')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all duration-300 ${trendMode === 'daily' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800'}`}
            >
              الأيام (7 أيام)
            </button>
            <button 
              onClick={() => setTrendMode('monthly')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all duration-300 ${trendMode === 'monthly' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800'}`}
            >
              الأشهر (12)
            </button>
            <button 
              onClick={() => setTrendMode('yearly')}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all duration-300 ${trendMode === 'yearly' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-800'}`}
            >
              السنوات
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="flex-1 min-h-0 relative z-10">
          {(() => {
            const chartData = trendMode === 'daily' ? dailySales : trendMode === 'monthly' ? monthlySalesTrend : yearlySalesTrend;
            const maxVal = Math.max(...chartData.map((d: any) => d.total || 0), 1);
            return (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                      <stop offset="60%" stopColor="#059669" stopOpacity={0.75}/>
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorMid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95}/>
                      <stop offset="60%" stopColor="#8b5cf6" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.15}/>
                    </linearGradient>
                    <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.85}/>
                      <stop offset="60%" stopColor="#cbd5e1" stopOpacity={0.5}/>
                      <stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" strokeOpacity={0.8} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
                    tickFormatter={(val) => {
                      if (trendMode === 'daily') {
                        return new Date(val).toLocaleDateString('ar-SA', { weekday: 'short' });
                      } else if (trendMode === 'monthly') {
                        const [y, m] = val.split('-');
                        return `${m}/${y.slice(2)}`;
                      } else {
                        return `سنة ${val}`;
                      }
                    }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.04)', radius: 12 }}
                    contentStyle={{ 
                      direction: 'rtl',
                      textAlign: 'right',
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 20px 25px -5px rgb(99 102 241 / 0.1)', 
                      padding: '12px 16px',
                      backgroundColor: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '11px'
                    }}
                    labelFormatter={(val) => {
                      if (trendMode === 'daily') {
                        return new Date(val).toLocaleDateString('ar-SA', { dateStyle: 'full' });
                      } else if (trendMode === 'monthly') {
                        return `شهر ${val}`;
                      } else {
                        return `سنة ${val}`;
                      }
                    }}
                    formatter={(value: number) => [formatPrice(value), 'إجمالي المبيعات']}
                  />
                  <Bar 
                    dataKey="total" 
                    radius={[10, 10, 4, 4]} 
                    barSize={trendMode === 'monthly' ? 22 : 30}
                    animationDuration={250}
                  >
                    {chartData.map((entry: any, index: number) => {
                      const ratio = (entry.total || 0) / maxVal;
                      let gradientId = 'colorLow';
                      if (ratio >= 0.7) {
                        gradientId = 'colorHigh';
                      } else if (ratio >= 0.3) {
                        gradientId = 'colorMid';
                      }
                      return <Cell key={`cell-${index}`} fill={`url(#${gradientId})`} />;
                    })}
                    <LabelList
                      dataKey="total"
                      position="top"
                      offset={6}
                      style={{
                        fontSize: trendMode === 'monthly' ? '8px' : '9px',
                        fontWeight: '800',
                        fill: '#475569'
                      }}
                      formatter={(val: any) => {
                        const num = Number(val || 0);
                        if (num <= 0) return '';
                        return formatPrice(num);
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </Card>

      {topProducts.length > 0 && (
        <Card className="p-4 rounded-2xl shadow-xs border border-slate-100 bg-gradient-to-br from-white to-slate-50/40">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-slate-800">الأصناف الأكثر مبيعاً ونسبة المساهمة</h3>
                <p className="text-[9px] text-slate-400">المنتجات الخمسة الأعلى أداءً وتحقيقاً للإيرادات بالكامل</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-indigo-50/70 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-indigo-100 self-start sm:self-auto">
              تحديث فوري نشط
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {(() => {
              const maxRevenue = Math.max(...topProducts.map(t => t.revenue || 1));
              return topProducts.map((item, index) => {
                const contributionPercent = Math.round((item.revenue / maxRevenue) * 100);
                const isLowStock = item.product?.stock_quantity <= 5;
                const indexBadges = [
                  { label: '🏆 الأول', bg: 'bg-amber-100 text-amber-700 border-amber-200' },
                  { label: '🥈 الثاني', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
                  { label: '🥉 الثالث', bg: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { label: '🏅 الرابع', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                  { label: '🏅 الخامس', bg: 'bg-slate-50 text-slate-600 border-slate-200' },
                ];
                const badgeStyle = indexBadges[index] || { label: `${index + 1}`, bg: 'bg-slate-50 text-slate-600 border-slate-200' };

                return (
                  <div 
                    key={`top-product-${item.product?.id ?? 'no-id'}-${index}`} 
                    className="group bg-white hover:bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-150 hover:shadow-2xs transition-all duration-300 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`px-2 py-1 shrink-0 rounded-lg text-[9px] font-black border ${badgeStyle.bg} shadow-3xs flex items-center justify-center`}>
                        {badgeStyle.label}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[11px] text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{item.product?.name || 'منتج غير معروف'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px]">
                          <span className="text-slate-400 font-semibold truncate">{item.product?.category || 'بدون تصنيف'}</span>
                          <span className="text-slate-300">•</span>
                          {isLowStock ? (
                            <span className="text-rose-600 font-black animate-pulse">مخزون حرج: {item.product?.stock_quantity}</span>
                          ) : (
                            <span className="text-slate-400 font-bold">المخزون: {item.product?.stock_quantity}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-left">
                      <div className="flex flex-col items-end">
                        <span className="font-extrabold text-indigo-600 text-[10px] bg-indigo-50/70 px-1.5 py-0.5 rounded-md">
                          {item.count} وحدة
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">
                          {formatPrice(item.revenue)}
                        </span>
                      </div>
                      
                      {/* Subtly show contribution strength as an accent indicator */}
                      <div className="w-1.5 h-8 bg-slate-100 rounded-full overflow-hidden shrink-0 flex flex-col justify-end">
                        <div 
                          className={`w-full rounded-full ${
                            index === 0 ? 'bg-amber-400' :
                            index === 1 ? 'bg-indigo-400' :
                            'bg-violet-500'
                          }`}
                          style={{ height: `${contributionPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default DashboardView;
