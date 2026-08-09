import React, { useState, useMemo } from 'react';
import { Product, Customer, Sale, SaleItem, Debt, CashWithdrawal } from '../db';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Legend,
  LabelList,
  ReferenceLine
} from 'recharts';
import { 
  Network, 
  TrendingUp, 
  ShoppingBag, 
  ShieldAlert, 
  DollarSign, 
  Layers, 
  Info, 
  Sparkles,
  PieChart,
  ArrowRight,
  Zap,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VisualModelsExtensionProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  saleItems: SaleItem[];
  debts: Debt[];
  withdrawals: CashWithdrawal[];
  formatPrice: (price: number) => string;
}

export default function VisualModelsExtension({
  products,
  customers,
  sales,
  saleItems,
  debts,
  withdrawals,
  formatPrice,
}: VisualModelsExtensionProps) {
  const [activeVisualTab, setActiveVisualTab] = useState<'market_basket' | 'profit_scatter' | 'debt_matrix' | 'waterfall'>('market_basket');
  const [selectedProductNode, setSelectedProductNode] = useState<number | null>(null);

  // --- 1. MARKET BASKET NETWORK CALCULATION ---
  const marketBasketNetwork = useMemo(() => {
    if (sales.length === 0 || saleItems.length === 0) return { nodes: [], links: [] };

    // Group items by sale_id
    const itemsBySale = new Map<number, number[]>();
    saleItems.forEach(item => {
      const existing = itemsBySale.get(item.sale_id) || [];
      if (!existing.includes(item.product_id)) {
        existing.push(item.product_id);
      }
      itemsBySale.set(item.sale_id, existing);
    });

    const coOccurrence = new Map<string, number>();
    const productFrequency = new Map<number, number>();

    itemsBySale.forEach((pIds) => {
      pIds.forEach((pId) => {
        productFrequency.set(pId, (productFrequency.get(pId) || 0) + 1);
      });

      for (let i = 0; i < pIds.length; i++) {
        for (let j = i + 1; j < pIds.length; j++) {
          const pairKey = [pIds[i], pIds[j]].sort((a, b) => a - b).join('-');
          coOccurrence.set(pairKey, (coOccurrence.get(pairKey) || 0) + 1);
        }
      }
    });

    // Top products as nodes
    const topProducts = [...products]
      .sort((a, b) => (productFrequency.get(b.id!) || 0) - (productFrequency.get(a.id!) || 0))
      .slice(0, 10);

    const topProductIds = new Set(topProducts.map(p => p.id!));

    const links: { source: number; target: number; weight: number; confidence: number; sourceName: string; targetName: string }[] = [];

    coOccurrence.forEach((count, key) => {
      const [idA, idB] = key.split('-').map(Number);
      if (topProductIds.has(idA) && topProductIds.has(idB) && count >= 1) {
        const prodA = products.find(p => p.id === idA);
        const prodB = products.find(p => p.id === idB);

        const freqA = productFrequency.get(idA) || 1;
        const confidence = (count / freqA) * 100;

        if (prodA && prodB) {
          links.push({
            source: idA,
            target: idB,
            weight: count,
            confidence: Math.round(confidence),
            sourceName: prodA.name,
            targetName: prodB.name,
          });
        }
      }
    });

    return {
      nodes: topProducts.map(p => ({
        id: p.id!,
        name: p.name,
        frequency: productFrequency.get(p.id!) || 0,
        price: p.sale_price,
        stock: p.stock_quantity,
      })),
      links: links.sort((a, b) => b.weight - a.weight),
    };
  }, [sales, saleItems, products]);

  // --- 2. PROFIT SCATTER DATA CALCULATION ---
  const profitScatterData = useMemo(() => {
    const data = products.map(p => {
      const margin = p.sale_price > 0 ? ((p.sale_price - p.cost_price) / p.sale_price) * 100 : 0;
      const itemsForP = saleItems.filter(item => item.product_id === p.id);
      const totalSold = itemsForP.reduce((sum, item) => sum + item.quantity, 0);

      return {
        id: p.id!,
        name: p.name,
        displayName: (totalSold >= 3 || margin >= 35) ? p.name : '',
        price: p.sale_price,
        cost: p.cost_price,
        margin: Math.round(margin),
        totalSold,
        stock: p.stock_quantity,
        color: p.stock_quantity <= 0 ? '#ef4444' : p.stock_quantity <= 5 ? '#f59e0b' : '#10b981',
      };
    }).filter(p => p.price > 0);

    // If too many items are labeled, let's only label the top 5 by sales or margin to keep it clean
    const labeledCount = data.filter(d => d.displayName).length;
    if (labeledCount > 6) {
      const thresholdSold = [...data].sort((a, b) => b.totalSold - a.totalSold)[5]?.totalSold || 3;
      data.forEach(d => {
        if (d.totalSold < thresholdSold) d.displayName = '';
      });
    }
    return data;
  }, [products, saleItems]);

  // --- 3. CUSTOMER DEBT MATRIX CALCULATION ---
  const customerDebtMatrix = useMemo(() => {
    const now = Date.now();
    const data = customers
      .filter(c => c.balance > 0)
      .map(c => {
        const custDebts = debts.filter(d => d.customer_id === c.id);
        let oldestDays = 1;
        if (custDebts.length > 0) {
          const oldestTime = Math.min(...custDebts.map(d => new Date(d.created_at).getTime()));
          oldestDays = Math.max(1, Math.round((now - oldestTime) / (1000 * 3600 * 24)));
        }

        const riskScore = Math.min(100, Math.round((c.balance / 1000) * 40 + (oldestDays / 30) * 60));

        return {
          id: c.id!,
          name: c.name,
          displayName: (riskScore >= 45 || c.balance >= 800) ? c.name : '',
          balance: c.balance,
          debtAgeDays: oldestDays,
          riskScore,
          status: riskScore >= 70 ? 'عالي الخطورة' : riskScore >= 40 ? 'متوسط' : 'منخفض',
          color: riskScore >= 70 ? '#ef4444' : riskScore >= 40 ? '#f59e0b' : '#10b981',
        };
      });
    return data;
  }, [customers, debts]);

  // Calculate average debt threshold dynamically
  const avgDebtThreshold = useMemo(() => {
    if (customerDebtMatrix.length === 0) return 500;
    const total = customerDebtMatrix.reduce((sum, c) => sum + c.balance, 0);
    return Math.round(total / customerDebtMatrix.length);
  }, [customerDebtMatrix]);

  // --- 4. WATERFALL CASHFLOW CALCULATION ---
  const waterfallData = useMemo(() => {
    const totalSalesRev = sales.reduce((sum, s) => sum + s.total_amount, 0);
    
    // Total COGS estimation
    let totalCogs = 0;
    saleItems.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      totalCogs += item.quantity * (prod ? prod.cost_price : 0);
    });

    const grossProfit = Math.max(0, totalSalesRev - totalCogs);
    const totalExpenses = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    return [
      { name: 'الإيرادات', shortName: 'الإيرادات', bottom: 0, value: totalSalesRev, displayVal: totalSalesRev, fill: '#3b82f6' },
      { name: 'تكلفة المبيعات', shortName: 'التكلفة', bottom: grossProfit, value: totalSalesRev - grossProfit, displayVal: -totalCogs, fill: '#ef4444' },
      { name: 'مجمل الربح', shortName: 'المجمل', bottom: 0, value: grossProfit, displayVal: grossProfit, fill: '#10b981' },
      { name: 'المصاريف والمسحوبات', shortName: 'المصاريف', bottom: Math.max(0, netProfit), value: Math.max(0, grossProfit - netProfit), displayVal: -totalExpenses, fill: '#f59e0b' },
      { name: 'صافي الربح', shortName: 'الصافي', bottom: 0, value: Math.max(0, netProfit), displayVal: netProfit, fill: netProfit >= 0 ? '#059669' : '#dc2626' },
    ];
  }, [sales, saleItems, products, withdrawals]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-base sm:text-lg">
            <PieChart className="w-5 h-5" />
            <span>النماذج البصرية التفاعلية التوسيعية (Extended Visual Analytics)</span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            تحليل بصرى عميق للترابط بين المنتجات، مصفوفة المخاطر المالية، وشلال التدفق النقدي.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex overflow-x-auto scrollbar-none gap-1 bg-slate-100 p-1 rounded-xl max-w-full">
          <button
            onClick={() => setActiveVisualTab('market_basket')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeVisualTab === 'market_basket'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>شبكة سلة الشراء</span>
          </button>

          <button
            onClick={() => setActiveVisualTab('profit_scatter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeVisualTab === 'profit_scatter'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ربحية وهامش الأصناف</span>
          </button>

          <button
            onClick={() => setActiveVisualTab('debt_matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeVisualTab === 'debt_matrix'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>مصفوفة ديون العملاء</span>
          </button>

          <button
            onClick={() => setActiveVisualTab('waterfall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeVisualTab === 'waterfall'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>شلال التدفق المالي</span>
          </button>
        </div>
      </div>

      {/* Visual Content Sections */}
      <AnimatePresence mode="wait">
        {/* TAB 1: MARKET BASKET NETWORK */}
        {activeVisualTab === 'market_basket' && (
          <motion.div
            key="market_basket"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-indigo-50/60 border border-indigo-100 p-3 sm:p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 space-y-1">
                <span className="font-bold block text-sm text-indigo-950">
                  شبكة علاقات المنتجات المبيعة معاً (Market Basket Network Graph)
                </span>
                <p>
                  تعرض هذه الشبكة البصرية المنتجات الأكثر شراءً مع بعضها في نفس الفاتورة. انقر على أي منتج لعرض المنتجات المقترنة به ونسبة الاحتمالية (Confidence).
                </p>
              </div>
            </div>

            {marketBasketNetwork.nodes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                لا توجد بيانات مبيعات كافية لبناء شبكة علاقات الأصناف.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Visual Network Canvas */}
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-4 sm:p-6 text-white relative min-h-[340px] flex flex-col justify-between overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Zap className="w-4 h-4 text-amber-400" /> Visual Node Network
                    </span>
                    <span>10 أصناف رئيسية</span>
                  </div>

                  {/* Fully Vector Responsive Canvas */}
                  <div className="my-auto relative w-full flex items-center justify-center py-2">
                    <div className="relative w-full max-w-[420px] aspect-[4/2.6] shrink-0">
                      <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {marketBasketNetwork.links.map((link, idx) => {
                          const nodeIndexA = marketBasketNetwork.nodes.findIndex(n => n.id === link.source);
                          const nodeIndexB = marketBasketNetwork.nodes.findIndex(n => n.id === link.target);
                          if (nodeIndexA === -1 || nodeIndexB === -1) return null;

                          const totalNodes = marketBasketNetwork.nodes.length;
                          const angleA = (nodeIndexA / totalNodes) * 2 * Math.PI;
                          const angleB = (nodeIndexB / totalNodes) * 2 * Math.PI;

                          const x1 = 200 + 120 * Math.cos(angleA);
                          const y1 = 130 + 85 * Math.sin(angleA);
                          const x2 = 200 + 120 * Math.cos(angleB);
                          const y2 = 130 + 85 * Math.sin(angleB);

                          const isHighlighted = selectedProductNode === link.source || selectedProductNode === link.target;

                          return (
                            <line
                              key={idx}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={isHighlighted ? '#fbbf24' : '#475569'}
                              strokeWidth={isHighlighted ? 3 : Math.min(4, Math.max(1, link.weight))}
                              strokeDasharray={isHighlighted ? 'none' : '4 4'}
                              opacity={isHighlighted ? 1 : 0.4}
                            />
                          );
                        })}
                      </svg>

                      {/* Vector Percentage Positioned Node Buttons */}
                      {marketBasketNetwork.nodes.map((node, idx) => {
                        const totalNodes = marketBasketNetwork.nodes.length;
                        const angle = (idx / totalNodes) * 2 * Math.PI;
                        const leftPct = ((200 + 120 * Math.cos(angle)) / 400) * 100;
                        const topPct = ((130 + 85 * Math.sin(angle)) / 260) * 100;

                        const isSelected = selectedProductNode === node.id;

                        return (
                          <button
                            key={node.id}
                            onClick={() => setSelectedProductNode(isSelected ? null : node.id)}
                            style={{ 
                              left: `${leftPct}%`, 
                              top: `${topPct}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                            className={`absolute px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-lg flex items-center gap-1 sm:gap-1.5 z-10 border whitespace-nowrap ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-300 scale-110 ring-4 ring-amber-400/30'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-400 shrink-0"></span>
                            <span className="truncate max-w-[65px] sm:max-w-[85px]">{node.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-center text-[11px] sm:text-xs text-slate-400 mt-2">
                    انقر على أي صنف لإظهار المنتجات الأكثر شراءً معه مع نسب الاقتران.
                  </div>
                </div>

                {/* Node Details & Recommendations */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-indigo-600" />
                      <span>
                        {selectedProductNode
                          ? `الارتباطات المباشرة للصنف: ${marketBasketNetwork.nodes.find(n => n.id === selectedProductNode)?.name}`
                          : 'أبرز الاقترانات المكتشفة في المبيعات'}
                      </span>
                    </h4>

                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {marketBasketNetwork.links
                        .filter(l => !selectedProductNode || l.source === selectedProductNode || l.target === selectedProductNode)
                        .slice(0, 6)
                        .map((link, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span className="text-indigo-700">{link.sourceName}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-emerald-700">{link.targetName}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500 text-[11px]">
                              <span>شُرعت معاً {link.weight} مرات</span>
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono font-bold">
                                نسبة الاقتران: %{link.confidence}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
                    <span className="font-bold block text-amber-950">💡 توصية العرض التجاري (Cross-Selling):</span>
                    <p>
                      ضع المنتجات المقترنة ببعضها في نفس الرف بالمتجر أو قدم خصم حزمة عند شراء الصنفين معاً لزيادة متوسط الفاتورة.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: PROFIT SCATTER BUBBLE */}
        {activeVisualTab === 'profit_scatter' && (
          <motion.div
            key="profit_scatter"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-emerald-50/60 border border-emerald-100 p-3 sm:p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <span className="font-bold block text-sm text-emerald-950">
                  مصفوفة فقاعات الربحية وسرعة الدوران (Product Profitability Bubble Matrix)
                </span>
                <p>
                  توضح هذه المصفوفة العلاقة بين **سعر البيع** (المحور الأفقية) و **هامش الربح %** (المحور الرأسي)، مع التعبير عن **حجم المبيعات** بحجم الفقاعة.
                </p>
              </div>
            </div>

            <div className="h-[300px] sm:h-[360px] w-full bg-slate-50 p-2 sm:p-4 rounded-2xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 25, right: 15, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    dataKey="price" 
                    name="سعر البيع" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="margin" 
                    name="هامش الربح" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `%${val}`}
                  />
                  <ZAxis type="number" dataKey="totalSold" range={[80, 450]} name="الكمية المبيعة" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-bold text-amber-400">{data.name}</p>
                          <p>سعر البيع: {formatPrice(data.price)}</p>
                          <p>تكلفة الصنف: {formatPrice(data.cost)}</p>
                          <p>هامش الربح: %{data.margin}</p>
                          <p>المبيعات الإجمالية: {data.totalSold} قطعة</p>
                          <p>المخزون الحالي: {data.stock} قطعة</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={profitScatterData}>
                    {profitScatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="displayName" position="top" style={{ fontSize: '10px', fill: '#334155', fontWeight: 'bold' }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> مخزون جيد</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> مخزون منخفض (≤ 5)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> منتهٍ من المخزون</span>
              </div>
              <span className="font-medium text-slate-500">💡 حجم الفقاعة يُعبر عن كمية المبيعات الكلية.</span>
            </div>
          </motion.div>
        )}

        {/* TAB 3: CUSTOMER DEBT RISK MATRIX */}
        {activeVisualTab === 'debt_matrix' && (
          <motion.div
            key="debt_matrix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-amber-50/60 border border-amber-100 p-3 sm:p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <span className="font-bold block text-sm text-amber-950">
                  مصفوفة قياس مخاطر ائتمان ديون العملاء (Customer Credit Risk Matrix)
                </span>
                <p>
                  تقوم هذه الميزة بتحليل الرصيد المستحق لكل عميل مقترناً بعمر الدين بالأيام للتعرف المباشر على العملاء الأكثر خطورة.
                </p>
              </div>
            </div>

            {customerDebtMatrix.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                لا توجد ديون معلقة على العملاء حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[300px] sm:h-[360px] bg-slate-50 p-2 sm:p-4 rounded-2xl border border-slate-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 25, right: 15, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        dataKey="debtAgeDays" 
                        name="عمر الدين" 
                        stroke="#64748b" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val) => `${val} يوم`}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="balance" 
                        name="حجم الدين" 
                        stroke="#64748b" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val) => `${val}`}
                      />
                      <ZAxis type="number" dataKey="riskScore" range={[90, 350]} name="مؤشر الخطورة" />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ payload }) => {
                          if (!payload || payload.length === 0) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                              <p className="font-bold text-amber-400">{data.name}</p>
                              <p>رصيد الدين: {formatPrice(data.balance)}</p>
                              <p>عمر الدين: {data.debtAgeDays} يوم</p>
                              <p>درجة الخطورة: {data.riskScore} / 100 ({data.status})</p>
                            </div>
                          );
                        }}
                      />
                      
                      {/* Visual Dynamic Reference Lines for Risk Quadrants */}
                      <ReferenceLine x={30} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '30 يوماً', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                      <ReferenceLine y={avgDebtThreshold} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `متوسط الدين (${formatPrice(avgDebtThreshold)})`, fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />

                      <Scatter data={customerDebtMatrix}>
                        {customerDebtMatrix.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="displayName" position="top" style={{ fontSize: '10px', fill: '#ef4444', fontWeight: 'bold' }} />
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>العملاء الأشد خطورة (High Risk Debtors)</span>
                  </h4>

                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {customerDebtMatrix
                      .sort((a, b) => b.riskScore - a.riskScore)
                      .map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <span className="text-slate-500 text-[11px]">{c.debtAgeDays} يوماً متأخراً</span>
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-slate-900 block">{formatPrice(c.balance)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.riskScore >= 70 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              درجة: {c.riskScore}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: WATERFALL CASHFLOW */}
        {activeVisualTab === 'waterfall' && (
          <motion.div
            key="waterfall"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-blue-50/60 border border-blue-100 p-3 sm:p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <span className="font-bold block text-sm text-blue-950">
                  شلال التدفق المالي والأرباح (Financial Cashflow Waterfall)
                </span>
                <p>
                  يعرض مخطط الشلال كيفية تحول **إجمالي الإيرادات** إلى **صافي أرباح كاش** بعد استقطاع تكاليف المبيعات والمصاريف. الأعمدة الحمراء والبرتقالية عائمة وتمثل الاستقطاعات المالية.
                </p>
              </div>
            </div>

            <div className="h-[300px] sm:h-[360px] w-full bg-slate-50 p-2 sm:p-4 rounded-2xl border border-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData} margin={{ top: 25, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }} 
                    interval={0}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `${val}`} />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => {
                      const displayVal = props.payload.displayVal;
                      return [`${formatPrice(Number(displayVal))}`, 'المبلغ الأصلي'];
                    }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  {/* Floating stacked bar implementation */}
                  <Bar dataKey="bottom" stackId="a" fill="transparent" />
                  <Bar dataKey="value" stackId="a" radius={[6, 6, 6, 6]}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList 
                      dataKey="displayVal" 
                      position="top" 
                      formatter={(val: any) => formatPrice(Number(val))}
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#1e293b' }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Explanatory Waterfall Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] sm:text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span> الإيرادات</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span> تكلفة المبيعات (-)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span> مجمل الربح</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span> المصاريف (-)</div>
              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span> صافي الربح</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
