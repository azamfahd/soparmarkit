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
  X,
  Database,
  Wallet
} from 'lucide-react';

interface SmartAnalyticsProps {
  currency: string;
  formatPrice: (price: number) => string;
  onGoBack: () => void;
}

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
  const [activeExplorerTab, setActiveExplorerTab] = useState<'daily' | 'customers' | 'products'>('daily');

  // --- Accordion collapse states ---
  const [isOverviewOpen, setIsOverviewOpen] = useState(true);
  const [isTrendsAndLiquidityOpen, setIsTrendsAndLiquidityOpen] = useState(true);
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
  const salesSettlements = useLiveQuery(() => db.salesSettlements?.toArray() || Promise.resolve([])) || [];
  const cashWithdrawals = useLiveQuery(() => db.cashWithdrawals?.toArray() || Promise.resolve([])) || [];
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

    return list;
  }, [performanceKPIs, products, formatPrice, topProductsChart]);

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
              <option value="debtors">مبيعات الديون والحساب الآجل</option>
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
                        <ResponsiveContainer width="100%" height="95%">
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
                            <YAxis stroke="#94a3b8" fontSize={9} fontWeight="extrabold" tickLine={false} />
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
                        <ResponsiveContainer width="100%" height="95%">
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
                            <YAxis stroke="#94a3b8" fontSize={9} fontWeight="extrabold" tickLine={false} />
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
                        <option value="revenue_mix">توزيع المبيعات (كاش/آجل)</option>
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
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          {liquidityDonutType === 'revenue_mix' ? (
                            <Pie
                              data={[
                                { name: 'بيوع نقدية (كاش)', value: performanceKPIs.cashSalesTotal },
                                { name: 'مبيعات ديون (آجل)', value: performanceKPIs.debtSalesTotal }
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
                            مبيعات بالآجل (الديون):
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
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-black w-full sm:w-auto">
            <button
              onClick={() => setActiveExplorerTab('daily')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeExplorerTab === 'daily' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📆 السجل اليومي</span>
            </button>
            <button
              onClick={() => setActiveExplorerTab('customers')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeExplorerTab === 'customers' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👤 ذمم العملاء</span>
            </button>
            <button
              onClick={() => setActiveExplorerTab('products')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeExplorerTab === 'products' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🏆 الرفوف والسلع</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeExplorerTab === 'daily' && (
              <motion.div
                key="daily_panel"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Search / Filters on table */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="ابحث بالتاريخ كـ (05 / 06 / 2026)..."
                      value={dailySearchKey}
                      onChange={(e) => setDailySearchKey(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-700 leading-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500/35 shadow-153 px-3 py-1 scale-95 transition-all"
                    />
                  </div>
                  {searchedDailySales.length > 0 && (
                    <span className="text-[10px] font-black bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-full shrink-0">
                      إجمالي الأيام تحت التصفية: {searchedDailySales.length} يوماً مسجلاً
                    </span>
                  )}
                </div>

                {searchedDailySales.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا توجد أي حركات يومية مسجلة للتواريخ الحالية أو مدخلات البحث.
                  </div>
                ) : (
                  <div className="border border-slate-150/55 rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                            <th className="p-4">تاريخ الحركة</th>
                            <th className="p-4 text-center">الفواتير المصدرة</th>
                            <th className="p-4">كاش وشبكة (فوري)</th>
                            <th className="p-4">آجل (ديون وذمم)</th>
                            <th className="p-4">المبيعات الإجمالية</th>
                            <th className="p-4 text-amber-700">التكلفة (للمورد)</th>
                            <th className="p-4 text-emerald-800">الأرباح الصافية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {searchedDailySales.map((day, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-black text-slate-800 font-mono text-[13px] whitespace-nowrap">
                                {day.dateStr}
                              </td>
                              <td className="p-4 text-center font-bold text-slate-600">
                                {day.count} مبيعات
                              </td>
                              <td className="p-4 font-bold text-slate-650 font-mono">
                                {formatPrice(day.cashAmount)}
                              </td>
                              <td className="p-4 font-bold text-amber-600 font-mono">
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
              </motion.div>
            )}

            {activeExplorerTab === 'customers' && (
              <motion.div
                key="customers_panel"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="ابحث باسم وسجل العميل..."
                      value={customerSearchKey}
                      onChange={(e) => setCustomerSearchKey(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-700 leading-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500/35 shadow-2xs transition-all"
                    />
                  </div>
                  {searchedCustomerSales.length > 0 && (
                    <span className="text-[10px] font-black bg-emerald-50 border border-emerald-150 text-emerald-700 px-3 py-1 rounded-full shrink-0">
                      أشخاص مسجلين بالحسابات: {searchedCustomerSales.length} شخص
                    </span>
                  )}
                </div>

                {searchedCustomerSales.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا تتوفر مبيعات أو أشخاص مسجلين مطابقة للبحث الحالي.
                  </div>
                ) : (
                  <div className="border border-slate-150/55 rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                            <th className="p-4">اسم الشخص / العميل بالدفتر</th>
                            <th className="p-4 text-center">الفواتير المنفذة</th>
                            <th className="p-4">نقد مسدد (كاش)</th>
                            <th className="p-4">ذمم آجلة (دين)</th>
                            <th className="p-4">مجموع مشترياته الكلية</th>
                            <th className="p-4 text-rose-700">الرصيد الحالي المتبقي بالذمة</th>
                            <th className="p-4 text-center">حالة الحساب المالي</th>
                            <th className="p-4">مساهمة المشتريات (%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {searchedCustomerSales.map((cust, idx) => {
                            const pct = performanceKPIs.salesTotal > 0 
                              ? (cust.totalAmount / performanceKPIs.salesTotal) * 100 
                              : 0;

                            return (
                              <tr key={cust.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-black text-slate-800 whitespace-nowrap">
                                  {cust.name}
                                </td>
                                <td className="p-4 text-center font-bold text-slate-600 font-mono">
                                  {cust.count} فواتير
                                </td>
                                <td className="p-4 font-bold text-slate-600 font-mono whitespace-nowrap">
                                  {formatPrice(cust.cashAmount)}
                                </td>
                                <td className="p-4 font-bold text-amber-700 font-mono whitespace-nowrap">
                                  {formatPrice(cust.debtAmount)}
                                </td>
                                <td className="p-4 font-black text-indigo-600 font-mono text-[13px] whitespace-nowrap">
                                  {formatPrice(cust.totalAmount)}
                                </td>
                                <td className={`p-4 font-black font-mono text-[13.5px] whitespace-nowrap ${cust.balance > 0 ? 'text-rose-700 bg-rose-50/40 font-extrabold' : 'text-slate-600'}`}>
                                  {formatPrice(cust.balance)}
                                </td>
                                <td className="p-4 text-center whitespace-nowrap">
                                  {cust.balance > 0 ? (
                                    <span className="bg-rose-50 border border-rose-100 text-rose-700 leading-none text-[10px] font-black px-2.5 py-1 rounded-full">
                                      ⚠️ بالذمة: عجز مالي بقيمة المعلقة
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 leading-none text-[10px] font-black px-2.5 py-1 rounded-full">
                                      ✅ خالٍ من العجز والذمم ومسدد
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2 min-w-[90px]">
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 font-mono">{pct.toFixed(0)}%</span>
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
              </motion.div>
            )}

            {activeExplorerTab === 'products' && (
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
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsChart} layout="vertical" margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
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
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Accordion List 6: AI Intelligent Insights & Guidance */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setIsInsightsOpen(!isInsightsOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer text-right"
        >
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
            <span>🤖 الذكاء التحليلي والتوصيات الحسابية الموجهة (Robotic Advisor System)</span>
          </div>
          {isInsightsOpen ? <ChevronUp className="w-4.5 h-4.5 text-slate-500" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-500" />}
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
                  {/* Bubble light design decor */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>

                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                      <h3 className="text-sm font-extrabold text-white">موجز تقرير الذكاء والحلول المالية الذكية</h3>
                    </div>
                    <span className="text-[9px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold">بموجب الدورة والفلترة الحالية</span>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 animate-none">
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
