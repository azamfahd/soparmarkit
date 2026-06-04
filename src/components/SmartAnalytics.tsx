import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
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
  Database
} from 'lucide-react';

interface SmartAnalyticsProps {
  currency: string;
  formatPrice: (price: number) => string;
  onGoBack: () => void;
}

export default function SmartAnalytics({ currency, formatPrice, onGoBack }: SmartAnalyticsProps) {
  // --- State for filter controls ---
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'month' | 'all'>('30days');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');

  // --- Accordion collapse states ---
  const [isOverviewOpen, setIsOverviewOpen] = useState(true);
  const [isTrendsAndLiquidityOpen, setIsTrendsAndLiquidityOpen] = useState(true);
  const [isDailySalesOpen, setIsDailySalesOpen] = useState(false);
  const [isCustomerSalesOpen, setIsCustomerSalesOpen] = useState(false);
  const [isCategoryPerformanceOpen, setIsCategoryPerformanceOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);

  // --- Search keys within lists ---
  const [dailySearchKey, setDailySearchKey] = useState('');
  const [customerSearchKey, setCustomerSearchKey] = useState('');

  // --- Subscribing to live DB data ---
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const debts = useLiveQuery(() => db.debts.toArray()) || [];
  const salesSettlements = useLiveQuery(() => db.salesSettlements.toArray()) || [];
  const storeNameSetting = useLiveQuery(() => db.settings.where('key').equals('storeName').first());
  
  const storeName = storeNameSetting?.value || 'المخزن الذكي';

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

  // Sub-filter calculation helper
  const filteredSalesData = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - 7);
    const startOf30Days = new Date(startOfDay);
    startOf30Days.setDate(startOfDay.getDate() - 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter sales based on Date Range
    const matchingSales = sales.filter(s => {
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
  }, [sales, dateFilter, selectedCustomer]);

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

    // Drawer Settle discrepancy rate
    let exactSettlementsCount = 0;
    let totalSettlements = 0;
    let totalDeficitAmount = 0;

    salesSettlements.forEach(s => {
      totalSettlements++;
      if (s.difference === 0) {
        exactSettlementsCount++;
      } else if (s.difference < 0) {
        totalDeficitAmount += Math.abs(s.difference);
      }
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
      transactionsCount: filteredSalesData.length
    };
  }, [filteredSalesData, filteredSaleItemsData, debts, salesSettlements, dateFilter, productMap]);

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

  // --- Chart 1: Sales and Profits Trend (By Date / Day of the week) ---
  const salesAndProfitTrendChart = useMemo(() => {
    // Generate beautiful sequential operational days chart line
    return [...dailySalesBreakdown].reverse().slice(-12); 
  }, [dailySalesBreakdown]);

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
    const list: Array<{ id: number, type: 'success' | 'warning' | 'info', title: string, desc: string }> = [];

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

    return list;
  }, [performanceKPIs, products, formatPrice]);

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
      className="space-y-6 text-right pb-10"
    >
      {/* Header section with BI Title, Filter, and Export */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onGoBack} 
            className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer text-slate-500 hover:text-indigo-600 border border-slate-100"
            title="العودة للوحة الرئيسية"
          >
            <ArrowLeft className="w-5 h-5 animate-pulse" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              📊 لوحة تحليلات البيع الرقمي الذكي <span className="text-[10px] sm:text-xs font-black bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full py-0.5 px-3">مستوحى من Microsoft Power BI</span>
            </h2>
            <p className="text-xs text-slate-450 mt-1">خرائط بصرية حيوية ومؤشرات تفاعلية لمراقبة صحة الصندوق وتتبع الذمم المالية المترتبة</p>
          </div>
        </div>

        {/* Date Filter Selection and PDF Export Trigger Row */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Quick Date Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                dateFilter === 'today' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                dateFilter === '7days' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setDateFilter('30days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                dateFilter === '30days' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                dateFilter === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              الشهر الحالي
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                dateFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white/40'
              }`}
            >
              الكل
            </button>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-t border-white/20"
          >
            <Download className="w-4 h-4 animate-bounce" />
            <span>تصدير PDF (ملف BDF)</span>
          </button>
        </div>
      </div>

      {/* Accordion List 1: Pivot Filters (collapsible & tidy) */}
      <div className="bg-slate-50 border border-slate-150/60 rounded-3xl overflow-hidden shadow-xs">
        <button 
          onClick={() => setIsOverviewOpen(!isOverviewOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-100/60 hover:bg-slate-100 transition-colors pointer-cursor text-right"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>🎛️ مصافي ومحاور التحليل المحورية (Filters Profile Tracker)</span>
          </div>
          {isOverviewOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        <AnimatePresence initial={false}>
          {isOverviewOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-150"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500"> تصفية الفئات السلعية الكلية</label>
                  <select 
                    value={selectedProductCategory} 
                    onChange={(e) => setSelectedProductCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-xs text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">كل المبيعات والسلع المتنوعة</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">حساب العميل أو طريقة وتدفقات السداد</label>
                  <select 
                    value={selectedCustomer} 
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-xs text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">كل العملاء والذمم والبيوع النقدية</option>
                    <option value="cash">البيوع النقدية (كاش وشبكة) فقط</option>
                    <option value="debtors">مبيعات الديون والحساب الآجل</option>
                    {customers.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.name} {c.balance > 0 ? `(آجل: ${formatPrice(c.balance)})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KPI Dashboard Cards Grid (Quick Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex justify-between items-start transition-all hover:scale-[1.01]">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">صافي المبيعات الكلية</span>
            <span className="text-2xl font-black font-mono tracking-tight text-slate-800 block">
              {formatPrice(performanceKPIs.salesTotal)}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>إجمالي الفواتير: {performanceKPIs.transactionsCount} فواتير</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex justify-between items-start transition-all hover:scale-[1.01]">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">الأرباح التقريبية الصافية</span>
            <span className="text-2xl font-black font-mono tracking-tight text-emerald-800 block">
              {formatPrice(performanceKPIs.profitTotal)}
            </span>
            <div className="flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                هامش صافي الأرباح: {performanceKPIs.profitMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Cost Basis Metric */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex justify-between items-start transition-all hover:scale-[1.01]">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">قيمة المبيعات بسعر التكلفة (تسوية التاجر)</span>
            <span className="text-2xl font-black font-mono tracking-tight text-amber-800 block">
              {formatPrice(performanceKPIs.costTotal || (performanceKPIs.salesTotal - (performanceKPIs.profitTotal || 0)))}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md leading-tight">
                هذا هو المبلغ الذي يجب تسليمه للتاجر تعويضاً عن البضاعة المباعة (دون الأرباح).
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex justify-between items-start transition-all hover:scale-[1.01]">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">معدل تحصيل السداد الآجل</span>
            <span className="text-2xl font-black font-mono tracking-tight text-purple-800 block">
              {performanceKPIs.debtRecoveryRate.toFixed(1)}%
            </span>
            <div className="flex flex-col text-[10px] text-slate-400 gap-0.5 font-semibold">
              <span className="text-purple-600">تسديدات محصّلة: {formatPrice(performanceKPIs.totalCollectedPayments)}</span>
              <span>مبيعات آجلة: {formatPrice(performanceKPIs.totalPurchasedDebts)}</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex justify-between items-start transition-all hover:scale-[1.01]">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">نزاهة وانضباط الصندوق</span>
            <span className={`text-2xl font-black font-mono tracking-tight block ${performanceKPIs.boxMatchingScore >= 90 ? 'text-blue-800' : 'text-amber-800'}`}>
              {performanceKPIs.boxMatchingScore.toFixed(0)}%
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
              {performanceKPIs.totalDeficitAmount > 0 ? (
                <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 leading-none">
                  ⚠️ إجمالي العجز المسجل: {formatPrice(performanceKPIs.totalDeficitAmount)}
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md leading-none">
                  ✓ الصندوق متطابق بالكامل ومحصن
                </span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Accordion List 2: Charts and Liquidity balances (Collapsible to save huge space) */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsTrendsAndLiquidityOpen(!isTrendsAndLiquidityOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors pointer-cursor text-right"
        >
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>📈 توجه الحركة التراكمية وسيناريوهات التدفق المالي التفاعلي (Live Analytics Graphics)</span>
          </div>
          {isTrendsAndLiquidityOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
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
                {/* Area Chart */}
                <div className="lg:col-span-2 space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500">منحنيات البيع والتراكم المالي للأرباح الكلية بالتواريخ</h3>
                    <p className="text-[10px] text-slate-400">مراقبة الفروق المباشرة بين قيمة البيع وتكلفة شراء السلع</p>
                  </div>
                  
                  <div className="h-60 sm:h-64 w-full bg-slate-50/50 rounded-2xl p-2 border border-slate-100/60">
                    {salesAndProfitTrendChart.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        لا تتوفر حركة ملموسة للتواريخ الحالية في نطاق الفئات المحددة.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesAndProfitTrendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="dateStr" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                          <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                          <Tooltip 
                            contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px', fontWeight: 'bold' }} 
                            formatter={(value: any, name: any) => [formatPrice(Math.round(value)), name === 'totalAmount' ? 'المبيعات اليومية' : 'هامش أرباح اليوم']}
                          />
                          <Area type="monotone" dataKey="totalAmount" name="totalAmount" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                          <Area type="monotone" dataKey="profit" name="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Donut Liquidity representation */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500"> توازن وموجات الدفع السيولية</h3>
                    <p className="text-[10px] text-slate-400">مقارنة السيولة الكاش الفورية والذمم والديون الملزمة</p>
                  </div>

                  <div className="h-40 w-full flex items-center justify-center relative">
                    {performanceKPIs.salesTotal === 0 ? (
                      <span className="text-xs text-slate-400">لا تتوفر مبيعات</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: 'كاش وتوصيل نقد', value: performanceKPIs.cashSalesTotal },
                              { name: 'ذمم وديون آجلة', value: performanceKPIs.debtSalesTotal }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                          </Pie>
                          <Tooltip formatter={(value: any) => formatPrice(value)} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    )}
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase">إجمالي المبيعات</span>
                      <span className="text-xs font-black font-mono text-slate-700">{formatPrice(performanceKPIs.salesTotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-150 pt-3 text-xs">
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-xs">
                      <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                        المقاومة النقدية الصافية (الكاش):
                      </span>
                      <span className="font-bold text-emerald-800 font-mono">{formatPrice(performanceKPIs.cashSalesTotal)} ({((performanceKPIs.cashSalesTotal / (performanceKPIs.salesTotal || 1)) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-xs">
                      <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                        مبيعات الذمم والديون:
                      </span>
                      <span className="font-bold text-amber-800 font-mono">{formatPrice(performanceKPIs.debtSalesTotal)} ({((performanceKPIs.debtSalesTotal / (performanceKPIs.salesTotal || 1)) * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accordion List 3: Daily Sales Table ("جدول المبيعات اليومية التفصيلية لكل يوم") */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsDailySalesOpen(!isDailySalesOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors pointer-cursor text-right"
        >
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>📆 جدول حركة المبيعات التفصيلية لجميع الأيام (Daily Sales Balance Sheet)</span>
            {searchedDailySales.length > 0 && (
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {searchedDailySales.length} أيام مسجلة
              </span>
            )}
          </div>
          {isDailySalesOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        <AnimatePresence initial={false}>
          {isDailySalesOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-5 space-y-4">
                {/* Search Day Filter */}
                <div className="relative max-w-sm">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث بالتاريخ كـ (02 / 06 / 2026)..."
                    value={dailySearchKey}
                    onChange={(e) => setDailySearchKey(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-2xl pr-10 pl-4 py-2 text-xs font-bold text-slate-700 leading-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 grow shadow-2xs transition-all"
                  />
                </div>

                {/* Table structure */}
                {searchedDailySales.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    لا توجد أي سجلات يومية مطابقة لمدخلات البحث الحالي.
                  </div>
                ) : (
                  <div className="border border-slate-150/50 rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                            <th className="p-4">اليوم وتاريخ الحركة الحسابية</th>
                            <th className="p-4 text-center">عدد فواتير البيع</th>
                            <th className="p-4">المبيعات النقدية (كاش)</th>
                            <th className="p-4">المبيعات الآجلة (ديون)</th>
                            <th className="p-4">صافي إجمالي المبيعات</th>
                            <th className="p-4 text-amber-700">المبيعات بالتكلفة (للمورد)</th>
                            <th className="p-4 text-emerald-800">الأرباح التقريبية لليوم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {searchedDailySales.map((day, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-black text-slate-800 font-mono text-[13px] whitespace-nowrap">
                                {day.dateStr}
                              </td>
                              <td className="p-4 text-center font-bold text-slate-700">
                                {day.count} فواتير
                              </td>
                              <td className="p-4 font-semibold text-slate-600 font-mono">
                                {formatPrice(day.cashAmount)}
                              </td>
                              <td className="p-4 font-semibold text-amber-700 font-mono">
                                {formatPrice(day.debtAmount)}
                              </td>
                              <td className="p-4 font-black text-indigo-600 font-mono text-[13px] whitespace-nowrap">
                                {formatPrice(day.totalAmount)}
                              </td>
                              <td className="p-4 font-black text-amber-700 font-mono whitespace-nowrap">
                                <span className="bg-amber-50 px-2 py-1 rounded-lg">
                                  {formatPrice(day.cost)}
                                </span>
                              </td>
                              <td className="p-4 font-extrabold text-emerald-700 font-mono whitespace-nowrap">
                                <span className="bg-emerald-50 px-2 py-1 rounded-lg">
                                  {formatPrice(day.profit)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accordion List 4: Customer / Person Specific Sales ("جدول التحليل التفصيلي لكل شخص و عميل للديون والمبيعات") */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsCustomerSalesOpen(!isCustomerSalesOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors pointer-cursor text-right"
        >
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>👥 كشوفات مبيعات وحركة حساب الأشخاص والعملاء بالتفصيل (Individual Sales Ledger)</span>
            {searchedCustomerSales.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                {searchedCustomerSales.length} شخص مسجل
              </span>
            )}
          </div>
          {isCustomerSalesOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        <AnimatePresence initial={false}>
          {isCustomerSalesOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-5 space-y-4">
                {/* Search Customer Input */}
                <div className="relative max-w-sm">
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث باسم الشخص أو العميل هنا..."
                    value={customerSearchKey}
                    onChange={(e) => setCustomerSearchKey(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-2xl pr-10 pl-4 py-2 text-xs font-bold text-slate-700 leading-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 grow shadow-2xs transition-all"
                  />
                </div>

                {/* Customers Table wrapper */}
                {searchedCustomerSales.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    لا تتوفر مبيعات لأي أشخاص مطابقة للبحث تحت هذه الفلترة الحالية.
                  </div>
                ) : (
                  <div className="border border-slate-150/50 rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                            <th className="p-4">الشخص / اسم العميل بالمتجر</th>
                            <th className="p-4 text-center">الفواتير المنفذة</th>
                            <th className="p-4">إجمالي السداد كاش</th>
                            <th className="p-4">ذمم آجلة (دين)</th>
                            <th className="p-4 font-bold text-slate-700">مجموع المشتريات مبيعات</th>
                            <th className="p-4 text-purple-800">الرصيد الحالي المتبقي بالذمة</th>
                            <th className="p-4">حصة المساهمة (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {searchedCustomerSales.map((cust, idx) => {
                            const pct = performanceKPIs.salesTotal > 0 
                              ? (cust.totalAmount / performanceKPIs.salesTotal) * 100 
                              : 0;

                            return (
                              <tr key={cust.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-bold text-slate-800 whitespace-nowrap">
                                  {cust.name}
                                </td>
                                <td className="p-4 text-center font-semibold text-slate-700 font-mono">
                                  {cust.count} فواتير
                                </td>
                                <td className="p-4 text-slate-600 font-mono whitespace-nowrap">
                                  {formatPrice(cust.cashAmount)}
                                </td>
                                <td className="p-4 text-amber-700 font-mono whitespace-nowrap">
                                  {formatPrice(cust.debtAmount)}
                                </td>
                                <td className="p-4 font-black text-indigo-600 text-[13px] font-mono whitespace-nowrap">
                                  {formatPrice(cust.totalAmount)}
                                </td>
                                <td className={`p-4 font-black font-mono text-[13px] whitespace-nowrap ${cust.balance > 0 ? 'text-rose-600 bg-rose-50/40' : 'text-slate-650'}`}>
                                  {formatPrice(cust.balance)}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  {/* Sleek inline progress bar share */}
                                  <div className="flex items-center gap-2 min-w-[100px]">
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 font-mono">{pct.toFixed(0)}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accordion List 5: Category and Products Performance (interactive layout) */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsCategoryPerformanceOpen(!isCategoryPerformanceOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors pointer-cursor text-right"
        >
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>🏆 ريادة السلع والأصناف الأكثر مبيعاً وأرباحاً (Product & Class Leadership Charts)</span>
          </div>
          {isCategoryPerformanceOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        <AnimatePresence initial={false}>
          {isCategoryPerformanceOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Rated products bar lists */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500">المنتجات الخمسة الأولى المحققة لأعلى عائد ربحي</h3>
                    <p className="text-[10px] text-slate-400">قيمة المبيعات الإجمالية مقارنة بهوامش الأرباح المحققة</p>
                  </div>

                  <div className="h-60 sm:h-64 w-full bg-slate-50/50 rounded-2xl p-2 border border-slate-100/60">
                    {topProductsChart.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        لم يتم تسجيل أي منتجات مباعة في هذا النطاق.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsChart} layout="vertical" margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} fontWeight="bold" width={100} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '16px', fontSize: '11px' }}
                            formatter={(value: any) => [formatPrice(value), 'العائد المالي']}
                          />
                          <Bar dataKey="revenue" name="revenue" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={10} />
                          <Bar dataKey="profit" name="profit" fill="#10b981" radius={[0, 8, 8, 0]} barSize={10} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Ranked category breakdowns list */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500">ترتيب مساهمة السلع حسب تصنيفات الرفوف</h3>
                    <p className="text-[10px] text-slate-400">قائمة الأصناف الحسابية مساهمة في تعزيز مبيعات المتجر</p>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                    {categorySalesChart.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">
                        لا توجد فئات للبيع حالياً.
                      </div>
                    ) : (
                      categorySalesChart.map((cat, idx) => {
                        const totalSalesForPercentage = performanceKPIs.salesTotal || 1;
                        const percentage = ((cat.sales / totalSalesForPercentage) * 100);
                        
                        return (
                          <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/60 flex items-center justify-between gap-3 text-right">
                            <div className="space-y-1 w-full">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-slate-800">{cat.name}</span>
                                <span className="font-extrabold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                  ربح: {formatPrice(cat.profit)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500 rounded-full" 
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-500 shrink-0">
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                              
                              <p className="text-[10px] text-slate-400">
                                مجموع مبيعات فواتير: <span className="font-mono text-slate-650 font-bold">{formatPrice(cat.sales)}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accordion List 6: AI Intelligent Insights & Guidance */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsInsightsOpen(!isInsightsOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors pointer-cursor text-right"
        >
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>🤖 الذكاء التحليلي والتوصيات الحسابية الموجهة (Robotic Advisor System)</span>
          </div>
          {isInsightsOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        <AnimatePresence initial={false}>
          {isInsightsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-5">
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md text-white overflow-hidden relative">
                  {/* Subtle bubble light design decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>

                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                      <h3 className="text-sm font-extrabold">موجز تقرير الذكاء والحلول المالية الذكية</h3>
                    </div>
                    <span className="text-[9px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold">بذات الدورة الحالية</span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {smartAIRecommendations.map((insight) => (
                      <div 
                        key={insight.id} 
                        className={`p-4 rounded-2xl border transition-all duration-200 ${
                          insight.type === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' 
                            : insight.type === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-100'
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                          {insight.type === 'info' && <Clock className="w-4 h-4 text-indigo-400 shrink-0" />}
                          <span className="font-extrabold text-xs sm:text-sm">{insight.title}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs leading-relaxed opacity-90 pr-6">
                          {insight.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
