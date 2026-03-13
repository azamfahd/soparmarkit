import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';

interface DashboardProps {
  summary: {
    totalSales: number;
    totalDebts: number;
    lowStock: number;
    totalProfit: number;
  };
  dailySales: any[];
  currency: string;
}

const Dashboard: React.FC<DashboardProps> = ({ summary, dailySales, currency }) => {
  const formatPrice = (price: number) => `${price} ${currency}`;

  const stats = [
    { 
      label: 'إجمالي المبيعات', 
      value: formatPrice(summary.totalSales), 
      icon: ShoppingCart, 
      color: 'bg-emerald-500', 
      trend: '+12%', 
      trendType: 'up' 
    },
    { 
      label: 'إجمالي الديون', 
      value: formatPrice(summary.totalDebts), 
      icon: Users, 
      color: 'bg-red-500', 
      trend: '+5%', 
      trendType: 'up' 
    },
    { 
      label: 'نقص المخزون', 
      value: summary.lowStock, 
      icon: AlertCircle, 
      color: 'bg-amber-500', 
      trend: '-2', 
      trendType: 'down' 
    },
    { 
      label: 'صافي الربح', 
      value: formatPrice(summary.totalProfit), 
      icon: TrendingUp, 
      color: 'bg-blue-500', 
      trend: '+8%', 
      trendType: 'up' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg shadow-${stat.color.split('-')[1]}-100`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                stat.trendType === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">تحليل المبيعات</h3>
              <p className="text-slate-400 text-sm">أداء المبيعات خلال الأيام الماضية</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-2 focus:ring-2 focus:ring-emerald-500/20">
              <option>آخر 7 أيام</option>
              <option>آخر 30 يوم</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Inventory Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">توزيع المخزون</h3>
              <p className="text-slate-400 text-sm">نظرة عامة على الفئات</p>
            </div>
            <button className="text-emerald-600 text-sm font-bold hover:underline">عرض الكل</button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
