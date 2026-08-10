import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { ConnectionStatus } from './components/ConnectionStatus';
import BarcodeScanner from './components/BarcodeScanner';
import SmartAnalytics from './components/SmartAnalytics';
import SmartImport from './components/SmartImport';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { DashboardView } from './features/dashboard/DashboardView';
import { PosView } from './features/pos/PosView';
import { SettingsView } from './features/settings/SettingsView';
import { ProductsView } from './features/products/ProductsView';
import { CustomersView } from './features/customers/CustomersView';
import { NotesView } from './features/notes/NotesView';
import { SuppliersView } from './features/suppliers/SuppliersView';
import { HistoryView } from './features/history/HistoryView';
import { AddProductModal } from './components/modals/AddProductModal';
import { EditProductModal } from './components/modals/EditProductModal';
import { AddSupplierModal } from './components/modals/AddSupplierModal';
import { SupplierDetailsModal } from './components/modals/SupplierDetailsModal';
import { SupplierSummaryModal } from './components/modals/SupplierSummaryModal';
import { InventoryDetailsModal } from './components/modals/InventoryDetailsModal';
import { SalesSummaryModal } from './components/modals/SalesSummaryModal';
import { ProfitSummaryModal } from './components/modals/ProfitSummaryModal';
import { MonthlySalesDetailsModal } from './components/modals/MonthlySalesDetailsModal';
import { SupplierPaymentModal } from './components/modals/SupplierPaymentModal';
import { SupplierPaymentDetailsModal } from './components/modals/SupplierPaymentDetailsModal';
import { AddNoteModal } from './components/modals/AddNoteModal';
import { NoteDetailsModal } from './components/modals/NoteDetailsModal';
import { AddCustomerModal } from './components/modals/AddCustomerModal';
import { CustomerPaymentModal } from './components/modals/CustomerPaymentModal';
import { CustomerAdjustmentModal } from './components/modals/CustomerAdjustmentModal';
import { SettleModal } from './components/modals/SettleModal';
import { CustomerDetailsModal } from './components/modals/CustomerDetailsModal';
import { PinVerificationModal } from './components/modals/PinVerificationModal';
import { PermissionsConfigModal } from './components/modals/PermissionsConfigModal';
import { WithdrawModal } from './components/modals/WithdrawModal';
import { Scan, QrCode } from 'lucide-react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Search, 
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Trash2,
  UserPlus,
  Edit,
  RotateCcw,
  Printer,
  Download,
  Upload,
  Database,
  RefreshCw,
  Settings,
  Settings2,
  Cloud,
  ShieldCheck,
  FileText,
  Briefcase,
  Wallet,
  Droplet,
  Milk,
  Sparkles,
  Coffee,
  Leaf,
  Apple,
  Beef,
  Croissant,
  Menu,
  X,
  PieChart,
  BarChart3,
  Camera,
  Home,
  BookOpen,
  Edit2,
  Copy,
  Check,
  Calendar,
  Bookmark,
  Info,
  AlertTriangle,
  Minus,
  PackagePlus,
  PackageMinus,
  Activity,
  TrendingDown,
  Clock,
  RefreshCcw,
  Lock,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList
} from 'recharts';
import { db, seedDatabase, Product, Customer, Sale, Supplier } from './db';
import { generateDeviceID, generateLicenseKey, verifyLicenseKey } from './utils/licensing';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  submitActivationRequest, 
  getActivationRequest, 
  subscribeToDeviceActivation, 
  subscribeToAllActivationRequests, 
  approveRequestInCloud, 
  rejectRequestInCloud, 
  deleteRequestFromCloud,
  type ActivationRequest
} from './services/firebase';

// --- Types ---
declare global {
  interface Window {
    pywebview?: {
      api: {
        select_file: () => Promise<string | null>;
        save_file: (filename: string, content: string) => Promise<boolean>;
      }
    }
  }
}

// (Local type definitions removed as they conflict with db.ts imports)

interface Summary {
  totalSales: number;
  totalCostOfSales: number;
  totalDebts: number;
  lowStock: number;
  expiringStock: number;
  totalProfit: number;
  totalInventoryCost: number;
  monthlySales: number;
  todaySales: number;
  weeklySales: number;
  totalCostOfSoldItems: number;
  totalOriginalInventoryCost: number;
  totalSaleValueOfRemainingInventory: number;
  totalOriginalInventorySaleValue: number;
  expectedRemainingProfit: number;
  totalStockQuantity: number;
  totalItemsSold: number;
  totalSupplierPayments: number;
  totalOriginalSupplierCost: number;
}

// --- Components ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInventoryDetailsModal, setShowInventoryDetailsModal] = useState(false);
  const [showSupplierSummaryModal, setShowSupplierSummaryModal] = useState(false);
  const [showSalesSummaryModal, setShowSalesSummaryModal] = useState(false);
  const [showProfitSummaryModal, setShowProfitSummaryModal] = useState(false);
  const [showMonthlySalesDetailsModal, setShowMonthlySalesDetailsModal] = useState(false);
  
  // Local DB Queries using Dexie
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const supplierPayments = useLiveQuery(() => db.supplierPayments.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.orderBy('created_at').reverse().limit(50).toArray()) || [];
  
  // Queries for comprehensive sales details reports (only fetched when needed on dashboard or reports)
  const allSalesForDetails = useLiveQuery(async () => {
    const isNeeded = activeTab === 'dashboard' || 
                     showSalesSummaryModal || 
                     showProfitSummaryModal || 
                     showInventoryDetailsModal || 
                     showMonthlySalesDetailsModal || 
                     showSupplierSummaryModal;
    if (!isNeeded) return [];
    return db.sales.toArray();
  }, [activeTab, showSalesSummaryModal, showProfitSummaryModal, showInventoryDetailsModal, showMonthlySalesDetailsModal, showSupplierSummaryModal]) || [];

  const allSaleItemsForDetails = useLiveQuery(async () => {
    const isNeeded = activeTab === 'dashboard' || 
                     showSalesSummaryModal || 
                     showProfitSummaryModal || 
                     showInventoryDetailsModal || 
                     showMonthlySalesDetailsModal || 
                     showSupplierSummaryModal;
    if (!isNeeded) return [];
    return db.saleItems.toArray();
  }, [activeTab, showSalesSummaryModal, showProfitSummaryModal, showInventoryDetailsModal, showMonthlySalesDetailsModal, showSupplierSummaryModal]) || [];

  // Live Query for Summary Data
  const liveSummary = useLiveQuery(async () => {
    const isNeeded = activeTab === 'dashboard' || 
                     showSalesSummaryModal || 
                     showProfitSummaryModal || 
                     showInventoryDetailsModal || 
                     showMonthlySalesDetailsModal || 
                     showSupplierSummaryModal;
    if (!isNeeded) return null;

    const allSales = await db.sales.toArray();
    const allCustomers = await db.customers.toArray();
    const lowStockCount = await db.products.where('stock_quantity').below(5).count();
    
    const todayForExpiry = new Date();
    todayForExpiry.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(todayForExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const allProducts = await db.products.toArray();
    let expiringStockCount = 0;
    allProducts.forEach(p => {
      if (p.expiration_date) {
        const expDate = new Date(p.expiration_date);
        if (expDate <= thirtyDaysFromNow) {
          expiringStockCount++;
        }
      }
    });
    
    const totalSales = allSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalDebts = allCustomers.reduce((sum, c) => sum + c.balance, 0);

    const allSaleItems = await db.saleItems.toArray();
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    
    let totalInventoryCost = 0;
    let totalStockQuantity = 0;
    let totalSaleValueOfRemainingInventory = 0;
    allProducts.forEach(p => {
      totalInventoryCost += (p.cost_price * p.stock_quantity);
      totalStockQuantity += p.stock_quantity;
      totalSaleValueOfRemainingInventory += (p.sale_price * p.stock_quantity);
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay()); // Start of week (Sunday)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todaySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;

    allSales.forEach(s => {
      const d = new Date(s.created_at);
      if (d >= startOfDay) todaySales += s.total_amount;
      if (d >= startOfWeek) weeklySales += s.total_amount;
      if (d >= startOfMonth) monthlySales += s.total_amount;
    });

    const totalProfit = allSaleItems.reduce((sum, item) => {
      const product = productMap.get(item.product_id);
      if (product) {
        return sum + (item.price_at_sale - product.cost_price) * item.quantity;
      }
      return sum;
    }, 0);

    const totalCostOfSoldItems = allSaleItems.reduce((sum, item) => {
      const product = productMap.get(item.product_id);
      if (product) {
        return sum + (product.cost_price * item.quantity);
      }
      return sum;
    }, 0);

    const totalItemsSold = allSaleItems.reduce((sum, item) => sum + item.quantity, 0);

    const totalOriginalInventoryCost = totalInventoryCost + totalCostOfSoldItems;
    const totalOriginalInventorySaleValue = totalSaleValueOfRemainingInventory + totalSales;
    const expectedRemainingProfit = totalSaleValueOfRemainingInventory - totalInventoryCost;

    const totalSupplierBalances = (await db.suppliers.toArray()).reduce((sum, s) => sum + (s.balance || 0), 0);
    const allSupplierPayments = await db.supplierPayments.toArray();
    const totalSupplierPayments = allSupplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOriginalSupplierCost = totalSupplierBalances + totalSupplierPayments;

    return {
      totalSales,
      totalCostOfSales: totalSupplierBalances,
      totalDebts,
      lowStock: lowStockCount,
      expiringStock: expiringStockCount,
      totalProfit,
      totalInventoryCost,
      monthlySales,
      todaySales,
      weeklySales,
      totalCostOfSoldItems,
      totalOriginalInventoryCost,
      totalSaleValueOfRemainingInventory,
      totalOriginalInventorySaleValue,
      expectedRemainingProfit,
      totalStockQuantity,
      totalItemsSold,
      totalSupplierPayments,
      totalOriginalSupplierCost
    };
  }, [activeTab, showSalesSummaryModal, showProfitSummaryModal, showInventoryDetailsModal, showMonthlySalesDetailsModal, showSupplierSummaryModal]);

  // Live Query for charts and trends
  const liveTrends = useLiveQuery(async () => {
    const isNeeded = activeTab === 'dashboard' || 
                     showSalesSummaryModal || 
                     showProfitSummaryModal || 
                     showInventoryDetailsModal || 
                     showMonthlySalesDetailsModal || 
                     showSupplierSummaryModal;
    if (!isNeeded) return null;

    const allSales = await db.sales.toArray();
    const allSaleItems = await db.saleItems.toArray();
    const allProducts = await db.products.toArray();
    const productMap = new Map(allProducts.map(p => [p.id, p]));

    // --- Daily Sales (Last 7 Days) ---
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dailySalesData = last7Days.map(date => {
      const dayTotal = allSales
        .filter(s => s.created_at.startsWith(date))
        .reduce((sum, s) => sum + s.total_amount, 0);
      return { date, total: dayTotal };
    });

    // --- Monthly Sales (Last 12 Months) ---
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).reverse();

    const monthlySalesData = last12Months.map(month => {
      const monthTotal = allSales
        .filter(s => s.created_at && s.created_at.startsWith(month))
        .reduce((sum, s) => sum + s.total_amount, 0);
      return { date: month, total: monthTotal };
    });

    // --- Yearly Sales Trend ---
    const yearsSet = new Set<string>();
    const currentYearStr = new Date().getFullYear().toString();
    yearsSet.add(currentYearStr);

    allSales.forEach(s => {
      if (s.created_at) {
        const yr = s.created_at.substring(0, 4);
        if (yr && yr.length === 4) {
          yearsSet.add(yr);
        }
      }
    });

    const sortedYears = Array.from(yearsSet).sort();
    const yearlySalesData = sortedYears.map(year => {
      const yearTotal = allSales
        .filter(s => s.created_at && s.created_at.startsWith(year))
        .reduce((sum, s) => sum + s.total_amount, 0);
      return { date: year, total: yearTotal };
    });

    // --- Top Products ---
    const productSalesCount: Record<number, { count: number, revenue: number }> = {};
    allSaleItems.forEach(item => {
      if (!productSalesCount[item.product_id]) {
        productSalesCount[item.product_id] = { count: 0, revenue: 0 };
      }
      productSalesCount[item.product_id].count += item.quantity;
      productSalesCount[item.product_id].revenue += (item.quantity * item.price_at_sale);
    });

    const topProductsData = Object.entries(productSalesCount)
      .map(([id, data]) => ({
        product: productMap.get(Number(id)),
        count: data.count,
        revenue: data.revenue
      }))
      .filter(item => item.product)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      dailySales: dailySalesData,
      monthlySalesTrend: monthlySalesData,
      yearlySalesTrend: yearlySalesData,
      topProducts: topProductsData
    };
  }, [activeTab, showSalesSummaryModal, showProfitSummaryModal, showInventoryDetailsModal, showMonthlySalesDetailsModal, showSupplierSummaryModal]);
  
  const salesDetailsStats = React.useMemo(() => {
    if (!allSalesForDetails.length) {
      return { days: [], weeks: [], months: [], productStats: [] };
    }

    // Map sale items by sale_id
    const itemsBySaleId = new Map<number, any[]>();
    allSaleItemsForDetails.forEach(item => {
      const list = itemsBySaleId.get(item.sale_id) || [];
      list.push(item);
      itemsBySaleId.set(item.sale_id, list);
    });

    // Map products for fast name/category lookups
    const prodMap = new Map<number, any>();
    products.forEach(p => {
      if (p.id !== undefined) prodMap.set(p.id, p);
    });

    const dayGroups: { [key: string]: { total: number; count: number; itemsCount: number; cash: number; debt: number } } = {};
    const weekGroups: { [key: string]: { total: number; count: number; itemsCount: number; cash: number; debt: number } } = {};
    const monthGroups: { [key: string]: { total: number; count: number; itemsCount: number; cash: number; debt: number } } = {};

    // For products breakdown
    const productSalesMap = new Map<number, { id: number; name: string; category: string; soldQty: number; revenue: number; transactions: number }>();

    allSalesForDetails.forEach(sale => {
      if (!sale.created_at) return;
      const date = new Date(sale.created_at);
      if (isNaN(date.getTime())) return;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dayKey = `${yyyy}-${mm}-${dd}`;

      // Calculate Sunday as day 0
      const dayOffset = date.getDay();
      const startOfWeekDate = new Date(date);
      startOfWeekDate.setDate(date.getDate() - dayOffset);
      const wY = startOfWeekDate.getFullYear();
      const wM = String(startOfWeekDate.getMonth() + 1).padStart(2, '0');
      const wD = String(startOfWeekDate.getDate()).padStart(2, '0');
      const weekKey = `${wY}-${wM}-${wD}`;

      const monthKey = `${yyyy}-${mm}`;

      // Sum quantities of items
      const saleId = sale.id;
      const items = saleId !== undefined ? (itemsBySaleId.get(saleId) || []) : [];
      const itemsCount = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

      // Group Day
      if (!dayGroups[dayKey]) dayGroups[dayKey] = { total: 0, count: 0, itemsCount: 0, cash: 0, debt: 0 };
      dayGroups[dayKey].total += sale.total_amount || 0;
      dayGroups[dayKey].count += 1;
      dayGroups[dayKey].itemsCount += itemsCount;
      if (sale.payment_type === 'cash') dayGroups[dayKey].cash += sale.total_amount || 0;
      else dayGroups[dayKey].debt += sale.total_amount || 0;

      // Group Week
      if (!weekGroups[weekKey]) weekGroups[weekKey] = { total: 0, count: 0, itemsCount: 0, cash: 0, debt: 0 };
      weekGroups[weekKey].total += sale.total_amount || 0;
      weekGroups[weekKey].count += 1;
      weekGroups[weekKey].itemsCount += itemsCount;
      if (sale.payment_type === 'cash') weekGroups[weekKey].cash += sale.total_amount || 0;
      else weekGroups[weekKey].debt += sale.total_amount || 0;

      // Group Month
      if (!monthGroups[monthKey]) monthGroups[monthKey] = { total: 0, count: 0, itemsCount: 0, cash: 0, debt: 0 };
      monthGroups[monthKey].total += sale.total_amount || 0;
      monthGroups[monthKey].count += 1;
      monthGroups[monthKey].itemsCount += itemsCount;
      if (sale.payment_type === 'cash') monthGroups[monthKey].cash += sale.total_amount || 0;
      else monthGroups[monthKey].debt += sale.total_amount || 0;

      // Product sales breakdown
      items.forEach(item => {
        const prod = prodMap.get(item.product_id);
        const prodName = prod ? prod.name : `منتج ${item.product_id}`;
        const prodCat = prod ? (prod.category || 'عام') : 'عام';
        
        const existing = productSalesMap.get(item.product_id) || {
          id: item.product_id,
          name: prodName,
          category: prodCat,
          soldQty: 0,
          revenue: 0,
          transactions: 0
        };

        existing.soldQty += item.quantity || 0;
        existing.revenue += (item.price_at_sale || 0) * (item.quantity || 0);
        existing.transactions += 1;
        productSalesMap.set(item.product_id, existing);
      });
    });

    const daysList = Object.keys(dayGroups).sort((a,b) => b.localeCompare(a)).map(key => ({
      label: key,
      ...dayGroups[key]
    }));

    const weeksList = Object.keys(weekGroups).sort((a,b) => b.localeCompare(a)).map(key => {
      const start = new Date(key);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const formattedRange = `إسبوع ${start.toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric' })} - ${end.toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric' })}`;
      return {
        label: formattedRange,
        rawDate: key,
        ...weekGroups[key]
      };
    });

    const monthsList = Object.keys(monthGroups).sort((a,b) => b.localeCompare(a)).map(key => {
      const [y, m] = key.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      const niceLabel = d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
      return {
        label: niceLabel,
        rawKey: key,
        ...monthGroups[key]
      };
    });

    const productStatsList = Array.from(productSalesMap.values()).sort((a,b) => b.soldQty - a.soldQty);

    return {
      days: daysList,
      weeks: weeksList,
      months: monthsList,
      productStats: productStatsList
    };
  }, [allSalesForDetails, allSaleItemsForDetails, products]);

  const enrichedSales = React.useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    return sales.map(s => ({
      ...s,
      customer_name: s.customer_id ? customerMap.get(s.customer_id) : 'زبون نقدي'
    }));
  }, [sales, customers]);

  const enrichedSupplierPayments = React.useMemo(() => {
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
    return [...supplierPayments]
      .map(p => ({
        ...p,
        supplier_name: supplierMap.get(p.supplier_id) || 'مورد مجهول'
      }))
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [supplierPayments, suppliers]);

  const [summary, setSummary] = useState<Summary>(() => {
    const cached = localStorage.getItem('cached_summary');
    return cached ? JSON.parse(cached) : {
      totalSales: 0,
      totalCostOfSales: 0,
      totalDebts: 0,
      lowStock: 0,
      expiringStock: 0,
      totalProfit: 0,
      totalInventoryCost: 0,
      monthlySales: 0,
      todaySales: 0,
      weeklySales: 0,
      totalCostOfSoldItems: 0,
      totalOriginalInventoryCost: 0,
      totalSaleValueOfRemainingInventory: 0,
      totalOriginalInventorySaleValue: 0,
      expectedRemainingProfit: 0,
      totalStockQuantity: 0,
      totalItemsSold: 0,
      totalSupplierPayments: 0,
      totalOriginalSupplierCost: 0
    };
  });

  const [selectedCostDetailType, setSelectedCostDetailType] = useState<'total' | 'remaining' | 'sold' | null>('remaining');
  const [costDetailSearchTerm, setCostDetailSearchTerm] = useState('');
  const [salesDetailsTab, setSalesDetailsTab] = useState<'days' | 'weeks' | 'months'>('days');

  // Customer Adjustments
  const [showCustomerAdjustmentModal, setShowCustomerAdjustmentModal] = useState<Customer | null>(null);
      
    const [historyFilter, setHistoryFilter] = useState<'all' | 'cash' | 'debt'>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [expandedSaleItems, setExpandedSaleItems] = useState<any[]>([]);

  const costDetailsList = React.useMemo(() => {
    const soldStatsMap = new Map<number, { soldQty: number; revenue: number }>();
    salesDetailsStats.productStats.forEach(stat => {
      if (stat.id !== undefined) {
        soldStatsMap.set(stat.id, { soldQty: stat.soldQty, revenue: stat.revenue });
      }
    });

    return products.map(p => {
      const soldInfo = p.id !== undefined ? soldStatsMap.get(p.id) : undefined;
      const soldQty = soldInfo?.soldQty || 0;
      const soldRevenue = soldInfo?.revenue || 0;
      const remainingQty = p.stock_quantity;
      const totalQty = remainingQty + soldQty;

      return {
        id: p.id,
        name: p.name,
        category: p.category || 'عام',
        costPrice: p.cost_price,
        salePrice: p.sale_price,
        remainingQty,
        remainingCost: remainingQty * p.cost_price,
        soldQty,
        soldCost: soldQty * p.cost_price,
        soldRevenue,
        totalQty,
        totalCost: totalQty * p.cost_price,
      };
    });
  }, [products, salesDetailsStats.productStats]);

  const filteredCostDetailsList = React.useMemo(() => {
    if (!selectedCostDetailType) return [];
    
    let items = costDetailsList;
    if (costDetailSearchTerm.trim()) {
      const q = costDetailSearchTerm.toLowerCase();
      items = items.filter(it => 
        it.name.toLowerCase().includes(q) || 
        it.category.toLowerCase().includes(q)
      );
    }

    if (selectedCostDetailType === 'remaining') {
      return items
        .filter(it => it.remainingQty > 0)
        .sort((a, b) => b.remainingCost - a.remainingCost);
    } else if (selectedCostDetailType === 'sold') {
      return items
        .filter(it => it.soldQty > 0)
        .sort((a, b) => b.soldCost - a.soldCost);
    } else {
      return items
        .filter(it => it.totalQty > 0)
        .sort((a, b) => b.totalCost - a.totalCost);
    }
  }, [costDetailsList, selectedCostDetailType, costDetailSearchTerm]);

  const handleExpandSale = async (saleId: number) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }
    const items = await db.saleItems.where('sale_id').equals(saleId).toArray();
    const allProducts = await db.products.toArray();
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    setExpandedSaleItems(items.map(item => {
      const prod = productMap.get(item.product_id);
      return {
        ...item,
        product_name: prod ? prod.name : 'منتج محذوف',
        product_unit: prod ? (prod.unit || '') : ''
      };
    }));
    setExpandedSaleId(saleId);
  };

  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash');
  const [saleNotes, setSaleNotes] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'pos' | 'add-product' | 'edit-product' | 'manual'>('pos');
  const [scannedProductInfo, setScannedProductInfo] = useState<Product | null>(null);
          const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [inventoryCategory, setInventoryCategory] = useState('الكل');
  const [showPaymentModal, setShowPaymentModal] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState<Customer | null>(null);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
      const [showSupplierDetails, setShowSupplierDetails] = useState<Supplier | null>(null);
  const [supplierDetailsTab, setSupplierDetailsTab] = useState<'summary' | 'logs' | 'products' | 'payments' | 'sales' | 'stock_qty'>('products');
  const [supplierLogFilter, setSupplierLogFilter] = useState<'all' | 'initial' | 'additions' | 'sales'>('all');
  const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState<Supplier | null>(null);
  const [selectedSupplierPayment, setSelectedSupplierPayment] = useState<any | null>(null);
      const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updatingStockProduct, setUpdatingStockProduct] = useState<Product | null>(null);
  const [updatingStockAmount, setUpdatingStockAmount] = useState<string>('');
  const [updatingStockNotes, setUpdatingStockNotes] = useState<string>('');
  const [updatingStockType, setUpdatingStockType] = useState<'add' | 'subtract'>('add');
  const [updateSupplierBalance, setUpdateSupplierBalance] = useState<boolean>(true);

  // --- Licensing & Subscription States ---
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState<boolean>(() => {
    const cached = localStorage.getItem('isAutoBackupEnabled');
    return cached === null ? true : cached === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isAutoBackupEnabled', String(isAutoBackupEnabled));
  }, [isAutoBackupEnabled]);

  const [deviceID, setDeviceID] = useState<string>(() => {
    return localStorage.getItem('cache_deviceID') || '';
  });
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    return localStorage.getItem('cache_isActivated') === 'true';
  });
  const [activationDetails, setActivationDetails] = useState<{ licenseKey: string; expiresAt: string; activatedAt: string; isCloud?: boolean } | null>(() => {
    const cached = localStorage.getItem('cache_activationDetails');
    return cached ? JSON.parse(cached) : null;
  });
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(() => {
    const cached = localStorage.getItem('cache_trialDaysLeft');
    return cached ? parseInt(cached, 10) : 7;
  });
  const [isInTrial, setIsInTrial] = useState<boolean>(() => {
    return localStorage.getItem('cache_isInTrial') !== 'false';
  });
  const [activationDaysLeft, setActivationDaysLeft] = useState<number | null>(() => {
    const cached = localStorage.getItem('cache_activationDaysLeft');
    return cached ? (cached === 'null' ? null : parseInt(cached, 10)) : null;
  });
  const [isLicensingLoading, setIsLicensingLoading] = useState<boolean>(false);
  
  // Failsafe timeout for IndexedDB hanging
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLicensingLoading) {
        console.warn('IndexedDB loading timed out. Forcing app to load.');
        setIsLicensingLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [isLicensingLoading]);
  const backupWarningShownRef = useRef<boolean>(false);
  const [activationModalOpen, setActivationModalOpen] = useState<boolean>(false);
  const [activationKeyInput, setActivationKeyInput] = useState<string>('');
  const [activationError, setActivationError] = useState<string>('');
  // Admin key generator states
  const [generatorDeviceIDInput, setGeneratorDeviceIDInput] = useState<string>('');
  const [generatorDuration, setGeneratorDuration] = useState<number>(30); // days
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string>('');
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);
  const [developerPinInput, setDeveloperPinInput] = useState<string>('');
  const [developerPinError, setDeveloperPinError] = useState<string>('');
  const [activeDevTab, setActiveDevTab] = useState<'generator' | 'requests'>('requests');
  const [devClickCount, setDevClickCount] = useState<number>(0);
  const [showHiddenAdminInput, setShowHiddenAdminInput] = useState<boolean>(false);
  const [diagnosticAttempts, setDiagnosticAttempts] = useState<number>(0);
  const [isDiagnosticLocked, setIsDiagnosticLocked] = useState<boolean>(false);
  
  // Custom Developer Security PIN States
  const [showPinChangeModal, setShowPinChangeModal] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState<string>('');
  const [pinChangeError, setPinChangeError] = useState<string>('');
  
  // Cloud Licensing States
  const [clientStoreName, setClientStoreName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [cloudRequest, setCloudRequest] = useState<ActivationRequest | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [allCloudRequests, setAllCloudRequests] = useState<ActivationRequest[]>([]);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [requestDurations, setRequestDurations] = useState<Record<string, number>>({});

    const [editProfitPercent, setEditProfitPercent] = useState<string>('');
  const [editCostStr, setEditCostStr] = useState<string>('');
  const [editSaleStr, setEditSaleStr] = useState<string>('');
  const [addLastModified, setAddLastModified] = useState<'cost' | 'sale' | 'percent'>('sale');
  const [editLastModified, setEditLastModified] = useState<'cost' | 'sale' | 'percent'>('sale');

  useEffect(() => {
    if (editingProduct) {
      setEditCostStr(editingProduct.cost_price === 0 ? '' : editingProduct.cost_price.toString());
      setEditSaleStr(editingProduct.sale_price === 0 ? '' : editingProduct.sale_price.toString());
      if (editingProduct.cost_price > 0 && editingProduct.sale_price > 0) {
        const pct = Math.round(((editingProduct.sale_price - editingProduct.cost_price) / editingProduct.sale_price) * 100);
        setEditProfitPercent(pct.toString());
      } else {
        setEditProfitPercent('');
      }
      setEditLastModified('sale');
    } else {
      setEditCostStr('');
      setEditSaleStr('');
      setEditProfitPercent('');
      setEditLastModified('sale');
    }
  }, [editingProduct?.id]);
  const [customerHistory, setCustomerHistory] = useState<{ sales: any[], debts: any[] }>({ sales: [], debts: [] });
  const [productHistory, setProductHistory] = useState<any[]>([]);
  const [inventoryHistoryFilter, setInventoryHistoryFilter] = useState<'all' | 'sales' | 'refunds' | 'updates'>('all');
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [monthlySalesTrend, setMonthlySalesTrend] = useState<any[]>([]);
  const [yearlySalesTrend, setYearlySalesTrend] = useState<any[]>([]);
  const [trendMode, setTrendMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // Synchronize live Dexie queries with state reactively for instant zero-latency updates
  useEffect(() => {
    if (liveSummary) {
      setSummary(liveSummary);
      localStorage.setItem('cached_summary', JSON.stringify(liveSummary));
    }
  }, [liveSummary]);

  useEffect(() => {
    if (liveTrends) {
      setDailySales(liveTrends.dailySales);
      setMonthlySalesTrend(liveTrends.monthlySalesTrend);
      setYearlySalesTrend(liveTrends.yearlySalesTrend);
      setTopProducts(liveTrends.topProducts);
    }
  }, [liveTrends]);
      const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [storeName, setStoreName] = useState('النظام المحاسبي');
  const [storePhone, setStorePhone] = useState('');
  const [currency, setCurrency] = useState('ر.ي');
  const [roundingFactor, setRoundingFactor] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const notificationTimeoutRef = useRef<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void, onCancel?: () => void } | null>(null);
  const [rejectingDevice, setRejectingDevice] = useState<{ deviceId: string; storeName: string } | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');

  const appSettingsRaw = useLiveQuery(() => db.settings.toArray());
  const appSettings = appSettingsRaw || [];
  const notes = useLiveQuery(() => db.notes.orderBy('created_at').reverse().toArray()) || [];
  const salesSettlements = useLiveQuery(() => db.salesSettlements ? db.salesSettlements.orderBy('created_at').reverse().toArray() : Promise.resolve([])) || [];

  const [showAddNote, setShowAddNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [noteFilter, setNoteFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('all');
  
  // States for Reconciling Sales / تصفية المبيعات
  const [showSettleModal, setShowSettleModal] = useState(false);
    
  // States for Drawer Cash Withdrawals / مسحوبات الصندوق (السلفيات والنفقات)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
      const [withdrawByWhom, setWithdrawByWhom] = useState('أمين الصندوق');

  // States for Security and Permissions / إدارة الصلاحيات والأمان للمدير
  const [permissionsEnabled, setPermissionsEnabled] = useState(false);
  const [autoLookupBarcode, setAutoLookupBarcode] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [protectedActions, setProtectedActions] = useState<Record<string, boolean>>({
    analytics: true,
    settings: true,
    delete_sale: true,
    edit_product: true,
    cash_withdrawal: true,
    settlement: true,
    supplier_payment: true,
    smart_import: true
  });

  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    actionType: string;
    onSuccess: () => void;
    title: string;
    description: string;
    inputVal: string;
    error: string;
  }>({
    isOpen: false,
    actionType: '',
    onSuccess: () => {},
    title: '',
    description: '',
    inputVal: '',
    error: ''
  });

  const [showPermissionsConfigModal, setShowPermissionsConfigModal] = useState(false);

  const allCashWithdrawals = useLiveQuery(() => {
    const isNeeded = activeTab === 'notes' || showSettleModal;
    if (!isNeeded) return Promise.resolve([]);
    return db.cashWithdrawals ? db.cashWithdrawals.orderBy('created_at').reverse().toArray() : Promise.resolve([]);
  }, [activeTab, showSettleModal]) || [];

  const lastSettleDate = salesSettlements[0]?.created_at || null;

  const currentCycleSales = useLiveQuery(async () => {
    const isNeeded = activeTab === 'notes' || showSettleModal;
    if (!isNeeded) return [];
    const allSales = await db.sales.toArray();
    if (lastSettleDate) {
      return allSales.filter(s => s.created_at > lastSettleDate);
    }
    return allSales;
  }, [lastSettleDate, activeTab, showSettleModal]) || [];

  const currentCycleWithdrawals = React.useMemo(() => {
    if (!lastSettleDate) return allCashWithdrawals;
    return allCashWithdrawals.filter(w => w.created_at > lastSettleDate);
  }, [allCashWithdrawals, lastSettleDate]);

  const currentCycleWithdrawalsTotal = React.useMemo(() => {
    return currentCycleWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  }, [currentCycleWithdrawals]);

  const currentCycleUnpaidWithdrawalsTotal = React.useMemo(() => {
    return currentCycleWithdrawals.filter(w => !w.is_repaid).reduce((sum, w) => sum + w.amount, 0);
  }, [currentCycleWithdrawals]);

  const allUnpaidWithdrawalsTotal = React.useMemo(() => {
    return allCashWithdrawals.filter(w => !w.is_repaid).reduce((sum, w) => sum + w.amount, 0);
  }, [allCashWithdrawals]);

  // 1. Current cycle cash sales (direct cash sales)
  const currentCycleCashSales = React.useMemo(() => {
    return currentCycleSales.filter(s => s.payment_type === 'cash').reduce((sum, s) => sum + s.total_amount, 0);
  }, [currentCycleSales]);

  // 2. All-time cash sales (direct cash sales)
  const allTimeCashSalesTotal = useLiveQuery(async () => {
    const isNeeded = activeTab === 'notes' || showSettleModal;
    if (!isNeeded) return 0;
    const allSales = await db.sales.toArray();
    return allSales.filter(s => s.payment_type === 'cash').reduce((sum, s) => sum + s.total_amount, 0);
  }, [activeTab, showSettleModal]) || 0;

  // 3. Customer debt payments (تسديدات الديون)
  const allTimeDebtPaymentsTotal = useLiveQuery(async () => {
    const isNeeded = activeTab === 'notes' || showSettleModal;
    if (!isNeeded) return 0;
    const allDebts = await db.debts.toArray();
    return allDebts.filter(d => d.type === 'payment').reduce((sum, d) => sum + d.amount, 0);
  }, [activeTab, showSettleModal]) || 0;

  // 4. Current cycle customer debt payments
  const currentCycleDebtPayments = useLiveQuery(async () => {
    const isNeeded = activeTab === 'notes' || showSettleModal;
    if (!isNeeded) return [];
    const allDebts = await db.debts.toArray();
    const payments = allDebts.filter(d => d.type === 'payment');
    if (lastSettleDate) {
      return payments.filter(d => d.created_at > lastSettleDate);
    }
    return payments;
  }, [lastSettleDate, activeTab, showSettleModal]) || [];

  const currentCycleDebtPaymentsTotal = React.useMemo(() => {
    return currentCycleDebtPayments.reduce((sum, d) => sum + d.amount, 0);
  }, [currentCycleDebtPayments]);

  const currentCycleSupplierPayments = useLiveQuery(async () => {
    const isNeeded = activeTab === 'notes' || showSettleModal;
    if (!isNeeded) return [];
    const allSPayments = await db.supplierPayments.toArray();
    if (lastSettleDate) {
      return allSPayments.filter(p => !p.payment_date || p.payment_date > lastSettleDate);
    }
    return allSPayments;
  }, [lastSettleDate, activeTab, showSettleModal]) || [];

  const currentCycleSupplierPaymentsTotal = React.useMemo(() => {
    return currentCycleSupplierPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [currentCycleSupplierPayments]);

  // 5. Total cash actually received both from direct cash sales and customer debt payments
  const allTimeReceivedCash = React.useMemo(() => {
    return allTimeCashSalesTotal + allTimeDebtPaymentsTotal;
  }, [allTimeCashSalesTotal, allTimeDebtPaymentsTotal]);

  const currentCycleCashTotal = React.useMemo(() => {
    return currentCycleCashSales + currentCycleDebtPaymentsTotal;
  }, [currentCycleCashSales, currentCycleDebtPaymentsTotal]);

  const currentCycleDebtTotal = React.useMemo(() => {
    return currentCycleSales.filter(s => s.payment_type === 'debt').reduce((sum, s) => sum + s.total_amount, 0);
  }, [currentCycleSales]);

  const currentCycleGrandTotal = React.useMemo(() => {
    return currentCycleSales.reduce((sum, s) => sum + s.total_amount, 0);
  }, [currentCycleSales]);

  const allTimeDeliveredTotal = React.useMemo(() => {
    return salesSettlements.reduce((sum, s) => sum + s.delivered_amount, 0);
  }, [salesSettlements]);

  const allTimeSupplierPaymentsTotal = React.useMemo(() => {
    return supplierPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [supplierPayments]);

  const activeOutstandingCash = React.useMemo(() => {
    return allTimeReceivedCash - allTimeDeliveredTotal - allTimeSupplierPaymentsTotal;
  }, [allTimeReceivedCash, allTimeDeliveredTotal, allTimeSupplierPaymentsTotal]);

  const carriedForwardDeficit = React.useMemo(() => {
    return Math.max(0, activeOutstandingCash - currentCycleCashTotal);
  }, [activeOutstandingCash, currentCycleCashTotal]);

  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // Automated background backup to file system (قاعدة بيانات النظام)
  const [autoBackupFileStatus, setAutoBackupFileStatus] = useState<{ exists: boolean, lastModified?: string, size?: number, path?: string } | null>(null);
  const [isBackupSyncing, setIsBackupSyncing] = useState(false);

  const fetchBackupStatus = async () => {
    try {
      const res = await fetch('/api/backup/status');
      if (res.ok) {
        const data = await res.json();
        setAutoBackupFileStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch backup file status:', err);
    }
  };

  useEffect(() => {
    fetchBackupStatus();
  }, []);

  // Debounced auto backup to disk on operations
  useEffect(() => {
    if (!isAutoBackupEnabled) return;
    if (products.length === 0 && customers.length === 0 && sales.length === 0) return;

    const backupTimer = setTimeout(async () => {
      try {
        setIsBackupSyncing(true);
        const data = {
          products,
          customers,
          sales,
          saleItems: await db.saleItems.toArray(),
          debts: await db.debts.toArray(),
          inventoryLogs: await db.inventoryLogs.toArray(),
          settings: appSettings,
          notes,
        };
        const response = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          fetchBackupStatus();
          // Update last backup date in app
          const nowStr = new Date().toISOString();
          setLastBackupDate(nowStr);
        }
      } catch (err) {
        console.warn('Auto backup to disk failed:', err);
      } finally {
        setIsBackupSyncing(false);
      }
    }, 8000); // 8 seconds debounce of idle time prevents freezes during active typing/selling

    return () => clearTimeout(backupTimer);
  }, [products, customers, sales, appSettings, notes, isAutoBackupEnabled]);

  useEffect(() => {
    const checkReminders = () => {
      if (!notes || notes.length === 0) return;
      const now = new Date();
      notes.forEach(note => {
        if (note.reminder_date && !note.is_completed) {
          const reminderDate = new Date(note.reminder_date);
          if (now >= reminderDate) {
            showNotification(`تذكير بملاحظة: ${note.title}`);
            db.notes.update(note.id!, { is_completed: true });
          }
        }
      });
    };
    checkReminders();
    const interval = setInterval(checkReminders, 1000 * 60 * 60); // Check every hour
    return () => clearInterval(interval);
  }, [notes]);

  useEffect(() => {
    if (appSettingsRaw === undefined) return;

    const nameSetting = appSettings.find(s => s.key === 'storeName');
    if (nameSetting) {
      setStoreName(nameSetting.value);
      setClientStoreName(nameSetting.value);
    }
    const phoneSetting = appSettings.find(s => s.key === 'storePhone' || s.key === 'phone');
    if (phoneSetting) {
      setStorePhone(phoneSetting.value);
    }
    const currencySetting = appSettings.find(s => s.key === 'currency');
    if (currencySetting) {
      setCurrency(currencySetting.value);
    }
    const backupSetting = appSettings.find(s => s.key === 'lastBackupDate');
    if (backupSetting) {
      setLastBackupDate(backupSetting.value);
      
      // Check if backup is older than 7 days
      const lastBackup = new Date(backupSetting.value);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 7 && !backupWarningShownRef.current) {
        showNotification('تنبيه: لم تقم بأخذ نسخة احتياطية منذ أكثر من أسبوع!', 'error');
        backupWarningShownRef.current = true;
      }
    }
    const roundingSetting = appSettings.find(s => s.key === 'roundingFactor');
    if (roundingSetting) {
      setRoundingFactor(roundingSetting.value);
    }
    const permSetting = appSettings.find(s => s.key === 'permissionsEnabled');
    if (permSetting) {
      setPermissionsEnabled(permSetting.value);
    }
    const autoLookupSetting = appSettings.find(s => s.key === 'autoLookupBarcode');
    if (autoLookupSetting) {
      setAutoLookupBarcode(autoLookupSetting.value);
    }
    const pinSetting = appSettings.find(s => s.key === 'adminPin');
    if (pinSetting) {
      if (pinSetting.value && !isSHA256(pinSetting.value)) {
        // Automatically migrate plaintext PIN to secure SHA-256 hash
        hashPIN(pinSetting.value).then(hashed => {
          db.settings.where('key').equals('adminPin').first().then(existing => {
            if (existing) {
              db.settings.update(existing.id!, { value: hashed });
            }
          });
          setAdminPin(hashed);
        });
      } else {
        setAdminPin(pinSetting.value);
      }
    }
    const protectedSetting = appSettings.find(s => s.key === 'protectedActions');
    if (protectedSetting) {
      setProtectedActions(protectedSetting.value);
    }
  }, [appSettingsRaw]);

  // Licensing & Subscription Checks
  useEffect(() => {
    if (appSettingsRaw === undefined) return;

    const initLicensing = async () => {
      // 1. Check or generate Device ID
      let currentDeviceID = '';
      const deviceIdSetting = appSettings.find(s => s.key === 'deviceID');
      if (deviceIdSetting) {
        currentDeviceID = deviceIdSetting.value;
        setDeviceID(deviceIdSetting.value);
        localStorage.setItem('cache_deviceID', deviceIdSetting.value);
      } else {
        const newID = generateDeviceID();
        await db.settings.add({ key: 'deviceID', value: newID });
        currentDeviceID = newID;
        setDeviceID(newID);
        localStorage.setItem('cache_deviceID', newID);
      }

      // 2. Check first install date for Free Trial
      let installDate: Date;
      const installSetting = appSettings.find(s => s.key === 'firstInstallDate');
      if (installSetting) {
        installDate = new Date(installSetting.value);
      } else {
        const nowStr = new Date().toISOString();
        await db.settings.add({ key: 'firstInstallDate', value: nowStr });
        installDate = new Date(nowStr);
      }

      // Calculate trial days remaining (7 days trial)
      const now = new Date();
      const trialMs = 7 * 24 * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - installDate.getTime();
      const daysLeft = Math.max(0, Math.ceil((trialMs - elapsedMs) / (1000 * 60 * 60 * 24)));
      setTrialDaysLeft(daysLeft);
      setIsInTrial(elapsedMs < trialMs);
      localStorage.setItem('cache_trialDaysLeft', String(daysLeft));
      localStorage.setItem('cache_isInTrial', String(elapsedMs < trialMs));

      // 3. Check Activation status
      const activationSetting = appSettings.find(s => s.key === 'activationDetails');
      if (activationSetting && activationSetting.value) {
        const details = activationSetting.value;
        setActivationDetails(details);
        localStorage.setItem('cache_activationDetails', JSON.stringify(details));
        
        // Validate the activation details
        const validation = verifyLicenseKey(currentDeviceID, details.licenseKey);
        if (validation.isValid) {
          if (details.expiresAt === 'lifetime') {
            setIsActivated(true);
            setActivationDaysLeft(null);
            localStorage.setItem('cache_isActivated', 'true');
            localStorage.setItem('cache_activationDaysLeft', 'null');
          } else {
            const expDate = new Date(details.expiresAt);
            if (now < expDate) {
              setIsActivated(true);
              const msLeft = expDate.getTime() - now.getTime();
              const dLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
              setActivationDaysLeft(dLeft);
              localStorage.setItem('cache_isActivated', 'true');
              localStorage.setItem('cache_activationDaysLeft', String(dLeft));
            } else {
              setIsActivated(false); // Expired
              setActivationDaysLeft(0);
              localStorage.setItem('cache_isActivated', 'false');
              localStorage.setItem('cache_activationDaysLeft', '0');
            }
          }
        } else {
          setIsActivated(false); // Tampered/invalid key
          setActivationDaysLeft(null);
          localStorage.setItem('cache_isActivated', 'false');
          localStorage.setItem('cache_activationDaysLeft', 'null');
        }
      } else {
        setIsActivated(false);
        setActivationDaysLeft(null);
        localStorage.setItem('cache_isActivated', 'false');
        localStorage.setItem('cache_activationDaysLeft', 'null');
      }
      setIsLicensingLoading(false);
    };

    initLicensing();
  }, [appSettingsRaw]);

  // 1. Subscribe to client's own activation status in the Cloud
  useEffect(() => {
    if (!deviceID) return;
    
    // Skip subscribing if offline to ensure 100% resilient offline operation
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    
    const unsubscribe = subscribeToDeviceActivation(deviceID, (request) => {
      if (!request) {
        // Missing request or offline snapshot -> Keep local activation state untouched!
        setCloudRequest(null);
        return;
      }

      setCloudRequest(request);
      
      // Auto-deactivation ONLY if explicitly rejected by owner while connected
      if (request.status === 'rejected') {
        performSilentDeactivation();
      }
      
      // Auto-activation on the fly when approved
      if (request.status === 'approved' && request.licenseKey) {
        const currentKey = activationDetails?.licenseKey;
        if (currentKey !== request.licenseKey) {
          handleActivateApp(request.licenseKey, true); // true marks it as cloud-activated!
        }
      }
    });
    
    return () => unsubscribe();
  }, [deviceID, activationDetails]);

  // 2. Subscribe to all cloud activation requests when Developer Mode is active
  useEffect(() => {
    if (!isDeveloperMode) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    
    const unsubscribe = subscribeToAllActivationRequests((requests) => {
      setAllCloudRequests(requests);
    });
    
    return () => unsubscribe();
  }, [isDeveloperMode]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    
    const handleOnline = () => {
      showNotification('تم استعادة الاتصال');
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const lastAlert = localStorage.getItem('last_expiration_alert_date');

    if (lastAlert !== today) {
      const expiringSoon = products.filter(p => {
          if (!p.expiration_date) return false;
          const expDate = new Date(p.expiration_date);
          const diffDays = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 30; // 30 days window
      });

      if (expiringSoon.length > 0) {
        showNotification(`تنبيه: يوجد ${expiringSoon.length} منتجات تقترب صلاحيتها من الانتهاء!`, 'error');
        localStorage.setItem('last_expiration_alert_date', today);
      }
    }
  }, [products]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const showNotification = (
    message: string, 
    type: 'success' | 'error' = 'success', 
    action?: { label: string; onClick: () => void }
  ) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type, action });
    const duration = action ? 6000 : 3000;
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, duration);
  };

  // --- Licensing & Activation Handlers ---
  const performSilentDeactivation = async () => {
    try {
      const existing = await db.settings.where('key').equals('activationDetails').first();
      if (existing) {
        await db.settings.delete(existing.id!);
      }
      setActivationDetails(null);
      setIsActivated(false);
      setActivationDaysLeft(null);
      showNotification('تنبيه: تم إلغاء أو تجميد هذا الترخيص سحابياً من قبل المالك 🔒', 'error');
    } catch (err) {
      console.error("Failed to perform silent deactivation:", err);
    }
  };

  const handleActivateApp = async (keyToUse?: string, isCloud: boolean = false) => {
    const key = keyToUse || activationKeyInput;
    if (!key) {
      setActivationError('الرجاء إدخال مفتاح التفعيل');
      return;
    }

    const validation = verifyLicenseKey(deviceID, key);
    if (!validation.isValid) {
      setActivationError('مفتاح التفعيل غير صحيح أو غير متوافق مع معرف جهازك!');
      return;
    }

    // Determine expiration date
    let expiresAt = '';
    const now = new Date();
    if (validation.durationDays >= 9999) {
      expiresAt = 'lifetime';
    } else {
      const expDate = new Date(now.getTime() + validation.durationDays * 24 * 60 * 60 * 1000);
      expiresAt = expDate.toISOString();
    }

    const details = {
      licenseKey: key,
      activatedAt: now.toISOString(),
      expiresAt,
      isCloud: !!isCloud || !!cloudRequest
    };

    const existing = await db.settings.where('key').equals('activationDetails').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: details });
    } else {
      await db.settings.add({ key: 'activationDetails', value: details });
    }

    setActivationDetails(details);
    setIsActivated(true);
    setActivationError('');
    setActivationKeyInput('');
    showNotification('تم تفعيل البرنامج بنجاح! شكراً لاشتراككم.', 'success');
  };

  const handleRequestCloudActivation = async () => {
    if (!clientStoreName.trim()) {
      showNotification('يرجى إدخال اسم المتجر أولاً!', 'error');
      return;
    }
    
    setIsSubmittingRequest(true);
    try {
      await submitActivationRequest(deviceID, clientStoreName, clientPhone);
      showNotification('تم إرسال طلب التفعيل الرقمي بنجاح وهو قيد المراجعة الآن!', 'success');
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء إرسال الطلب، يرجى التحقق من اتصالك بالإنترنت والتحميل مجدداً', 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const hashPIN = async (pin: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const isSHA256 = (str: string): boolean => {
    return typeof str === 'string' && /^[a-f0-9]{64}$/i.test(str);
  };

  const verifyPinMatches = async (input: string, storedHashOrPlain: string): Promise<boolean> => {
    if (!storedHashOrPlain) return false;
    if (isSHA256(storedHashOrPlain)) {
      const inputHash = await hashPIN(input);
      return inputHash === storedHashOrPlain;
    }
    return input === storedHashOrPlain;
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleVerifyDeveloperPIN = async () => {
    // Remove the lock check to maintain the camouflage indefinitely
    // if (isDiagnosticLocked) { ... }

    const pin = developerPinInput.trim();
    if (!pin) return;

    // Slow down validation intentionally (2 seconds) to fully eliminate high-speed brute force scripts
    await sleep(2000);

    const pinHash = await hashPIN(pin);
    const customChecksum = typeof localStorage !== 'undefined' ? localStorage.getItem('_sys_diag_checksum_v2') : null;

    const correctHashLower = '260d09dc568bb75d644b8b37b1121cad026a6f0ca10ea41963dd0ee9d43d7b11';
    const correctHashUpper = '0d46e9b09bcdf3be2987d5756defd65b4344b55f281f62b950c738ae67b843e4';

    const isValid = customChecksum 
      ? (pinHash === customChecksum)
      : (pinHash === correctHashLower || pinHash === correctHashUpper || pin === '8080');

    if (isValid) {
      setIsDeveloperMode(true);
      setDeveloperPinError('');
      setDeveloperPinInput('');
      setDiagnosticAttempts(0);
      showNotification('🔓 تم تفعيل بروتوكول التشخيص الكامل والتحقق من النواة بنجاح!', 'success');

      // إذا كان البرنامج غير مفعل حالياً، نقوم بتفعيله كجهاز للمطور مدى الحياة
      if (!isActivated && deviceID) {
        const key = generateLicenseKey(deviceID, 9999); // 9999 يعني مدى الحياة
        const details = {
          licenseKey: key,
          expiresAt: 'lifetime',
          activatedAt: new Date().toISOString()
        };
        const existing = await db.settings.where('key').equals('activationDetails').first();
        if (existing) {
          await db.settings.update(existing.id!, { value: details });
        } else {
          await db.settings.add({ key: 'activationDetails', value: details });
        }
        setActivationDetails(details);
        setIsActivated(true);
        showNotification('تم تفعيل جهاز المالك بنجاح مدى الحياة ♾️', 'success');
      }
    } else {
      // Camouflage: act like it succeeded in syncing a cache, without throwing any error
      setDeveloperPinError('');
      setDeveloperPinInput('');
      showNotification('✅ تمت مزامنة ذاكرة العرض المحلية واسترداد البيانات بنجاح!', 'success');
    }
  };

  const handleChangeDeveloperPIN = async (currentPin: string, newPin: string, confirmPin: string): Promise<boolean> => {
    const customChecksum = typeof localStorage !== 'undefined' ? localStorage.getItem('_sys_diag_checksum_v2') : null;
    const currentPinHash = await hashPIN(currentPin.trim());
    const correctHashLower = '260d09dc568bb75d644b8b37b1121cad026a6f0ca10ea41963dd0ee9d43d7b11';
    const correctHashUpper = '0d46e9b09bcdf3be2987d5756defd65b4344b55f281f62b950c738ae67b843e4';
    
    const isCurrentValid = customChecksum 
      ? (currentPinHash === customChecksum)
      : (currentPinHash === correctHashLower || currentPinHash === correctHashUpper || currentPin.trim() === '8080');

    if (!isCurrentValid) {
      setPinChangeError('الرمز الحالي غير صحيح. لا يمكنك التعديل.');
      return false;
    }

    const trimmedPin = newPin.trim();
    const trimmedConfirm = confirmPin.trim();

    if (!trimmedPin) {
      setPinChangeError('يرجى إدخال رمز القفل الجديد');
      return false;
    }
    if (trimmedPin.length < 4) {
      setPinChangeError('يجب أن يتكون الرمز من 4 خانات على الأقل');
      return false;
    }
    if (trimmedPin !== trimmedConfirm) {
      setPinChangeError('رمزا القفل الجديدان غير متطابقين!');
      return false;
    }

    try {
      const newHash = await hashPIN(trimmedPin);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('_sys_diag_checksum_v2', newHash);
      }
      setPinChangeError('');
      setNewPinInput('');
      setConfirmNewPinInput('');
      setShowPinChangeModal(false);
      showNotification('🔐 تم تحديث وتغيير رمز قفل المالك وشفرة المعايرة بنجاح!', 'success');
      return true;
    } catch (err) {
      console.error(err);
      setPinChangeError('حدث خطأ أثناء تشفير وحفظ الشفرة الجديدة');
      return false;
    }
  };

  const handleResetDeveloperPIN = async (currentPin: string) => {
    const customChecksum = typeof localStorage !== 'undefined' ? localStorage.getItem('_sys_diag_checksum_v2') : null;
    const currentPinHash = await hashPIN(currentPin.trim());
    const correctHashLower = '260d09dc568bb75d644b8b37b1121cad026a6f0ca10ea41963dd0ee9d43d7b11';
    const correctHashUpper = '0d46e9b09bcdf3be2987d5756defd65b4344b55f281f62b950c738ae67b843e4';
    
    const isCurrentValid = customChecksum 
      ? (currentPinHash === customChecksum)
      : (currentPinHash === correctHashLower || currentPinHash === correctHashUpper || currentPin.trim() === '8080');

    if (!isCurrentValid) {
      setPinChangeError('الرمز الحالي غير صحيح للقيام بالاستعادة');
      return;
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('_sys_diag_checksum_v2');
      }
      setShowPinChangeModal(false);
      setPinChangeError('');
      setNewPinInput('');
      setConfirmNewPinInput('');
      showNotification('🔄 تم استرجاع رمز قفل المالك وشفرة المعايرة الافتراضية بنجاح', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivateApp = async () => {
    setConfirmAction({
      title: 'إلغاء تفعيل الترخيص',
      message: '⚠️ تنبيه هام: هل أنت متأكد من إلغاء تفعيل هذا الترخيص؟ سيتم إخراجك للنسخة التجريبية ولا يمكنك استخدام الميزات المدفوعة إلا بتفعيل جديد.',
      onConfirm: async () => {
        try {
          const existing = await db.settings.where('key').equals('activationDetails').first();
          if (existing) {
            await db.settings.delete(existing.id!);
          }
          setActivationDetails(null);
          setIsActivated(false);
          setActivationDaysLeft(null);
          showNotification('تم إلغاء تفعيل الترخيص الحالي بنجاح', 'success');
        } catch (err) {
          console.error("Failed to deactivate license:", err);
          showNotification('حدث خطأ أثناء إلغاء التفعيل', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleApproveCloudRequest = async (req: ActivationRequest, duration: number) => {
    try {
      const key = generateLicenseKey(req.deviceId, duration);
      await approveRequestInCloud(req.deviceId, duration, key);
      showNotification(`تمت الموافقة وتوليد الترخيص لـ ${req.storeName} بنجاح!`, 'success');
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء الموافقة على الطلب في السحابة', 'error');
    }
  };

  const handleRejectCloudRequest = (deviceId: string, storeName: string) => {
    setRejectingDevice({ deviceId, storeName });
    setRejectReasonText('انتهت صلاحية الاشتراك والمشغل لم يقم بالتجديد.');
  };

  const confirmRejectCloudRequest = async () => {
    if (!rejectingDevice) return;
    try {
      await rejectRequestInCloud(rejectingDevice.deviceId, rejectReasonText || 'تم إلغاء تفعيل الترخيص من قبل الإدارة لسبب غير محدد');
      showNotification(`تم تجميد وإلغاء ترخيص ${rejectingDevice.storeName} بنجاح`, 'success');
      setRejectingDevice(null);
      setRejectReasonText('');
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء إلغاء الترخيص', 'error');
    }
  };

  const handleDeleteCloudRequest = async (deviceId: string) => {
    setConfirmAction({
      title: 'حذف طلب تفعيل من السحابة',
      message: 'هل أنت متأكد من حذف هذا الطلب بالكامل من السحابة؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        try {
          await deleteRequestFromCloud(deviceId);
          showNotification('تم حذف طلب التفعيل من السحابة', 'success');
        } catch (e) {
          console.error(e);
          showNotification('حدث خطأ أثناء حذف الطلب', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleGenerateLicense = () => {
    if (!generatorDeviceIDInput) {
      showNotification('الرجاء إدخال معرف جهاز العميل أولاً!', 'error');
      return;
    }
    const key = generateLicenseKey(generatorDeviceIDInput, generatorDuration);
    setGeneratedKeyResult(key);
    showNotification('تم توليد مفتاح التفعيل بنجاح!', 'success');
  };

  const applyCurrencyRounding = (price: number): number => {
    if (roundingFactor && roundingFactor > 0) {
      return Math.ceil(price / roundingFactor) * roundingFactor;
    }
    return Number(price.toFixed(2));
  };

  const formatPrice = (price: number) => {
    const val = typeof price === 'number' && !isNaN(price) ? price : 0;
    const roundedPrice = applyCurrencyRounding(val);
    return `${roundedPrice.toLocaleString('en-US')} ${currency}`;
  };

  const formatDateTimeWithDay = (dateInput: string | Date | number | undefined | null) => {
    if (!dateInput) return '';
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return '';
    
    const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = daysOfWeek[dateObj.getDay()];
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    
    return `${dayName}، ${year}/${month}/${day} - ${formattedTime}`;
  };

  const formatDateWithDay = (dateInput: string | Date | number | undefined | null) => {
    if (!dateInput) return '';
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return '';
    
    const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = daysOfWeek[dateObj.getDay()];
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${dayName}، ${year}/${month}/${day}`;
  };

  const getProductBadgeStyles = (name: string) => {
    const colors = [
      { bg: 'bg-indigo-50/70 text-indigo-700 border-indigo-100', dot: 'bg-indigo-500' },
      { bg: 'bg-emerald-50/70 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
      { bg: 'bg-blue-50/70 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
      { bg: 'bg-amber-50/70 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
      { bg: 'bg-rose-50/70 text-rose-700 border-rose-100', dot: 'bg-rose-500' },
      { bg: 'bg-purple-50/70 text-purple-700 border-purple-100', dot: 'bg-purple-500' },
      { bg: 'bg-teal-50/70 text-teal-700 border-teal-100', dot: 'bg-teal-500' },
      { bg: 'bg-cyan-50/70 text-cyan-700 border-cyan-100', dot: 'bg-cyan-500' },
      { bg: 'bg-orange-50/70 text-orange-700 border-orange-100', dot: 'bg-orange-500' },
      { bg: 'bg-violet-50/70 text-violet-700 border-violet-100', dot: 'bg-violet-500' },
      { bg: 'bg-pink-50/70 text-pink-700 border-pink-100', dot: 'bg-pink-500' },
    ];
    
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const customerStats = React.useMemo(() => {
    if (!showCustomerDetails) return { totalPurchased: 0, totalPaid: 0 };
    const totalPurchased = customerHistory.sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalPaid = customerHistory.debts.filter(d => d.type === 'payment').reduce((sum, d) => sum + d.amount, 0);
    return { totalPurchased, totalPaid };
  }, [customerHistory, showCustomerDetails]);

  const ledgerEntries = React.useMemo(() => {
    const entries = [
      ...customerHistory.sales.map(s => ({ ...s, entryType: 'sale' })),
      ...customerHistory.debts.filter(d => !d.sale_id).map(d => ({ ...d, entryType: 'debt_entry' }))
    ];
    return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [customerHistory]);

  useEffect(() => {
    const init = async () => {
      await seedDatabase();
    };
    init();
  }, []); // Empty dependency array ensures this runs only once on mount

  const categories: string[] = React.useMemo(() => ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))], [products]);

  const categoryIcons: Record<string, React.ReactNode> = {
    'الكل': <Package className="w-4 h-4" />,
    'مواد غذائية': <ShoppingCart className="w-4 h-4" />,
    'زيوت': <Droplet className="w-4 h-4" />,
    'ألبان': <Milk className="w-4 h-4" />,
    'منظفات': <Sparkles className="w-4 h-4" />,
    'مشروبات': <Coffee className="w-4 h-4" />,
    'خضروات': <Leaf className="w-4 h-4" />,
    'فواكه': <Apple className="w-4 h-4" />,
    'لحوم': <Beef className="w-4 h-4" />,
    'خبز': <Croissant className="w-4 h-4" />,
  };

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'عام';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    // For 'الكل', count all products
    counts['الكل'] = products.length;
    return counts;
  }, [products]);

  const handleDeleteSupplier = async (id: number) => {
    setConfirmAction({
      title: 'حذف مورد',
      message: 'هل أنت متأكد من حذف هذا المورد؟ سيتم مسح بيانات المورد وسجل مدفوعاته، ولكن المنتجات المرتبطة به ستبقى في النظام بدون مورد.',
      onConfirm: async () => {
        try {
          await db.transaction('rw', [db.suppliers, db.supplierPayments, db.products], async () => {
            await db.supplierPayments.where('supplier_id').equals(id).delete();
            await db.suppliers.delete(id);
            // Optional: Unlink products from this supplier
            await db.products.where('supplier_id').equals(id).modify({ supplier_id: undefined });
          });
          setShowSupplierDetails(null);
          showNotification('تم حذف المورد بنجاح');
        } catch (err) {
          console.error("Failed to delete supplier:", err);
          showNotification('خطأ في حذف المورد', 'error');
        }
      }
    });
  };

  const fetchProductHistory = async (product: Product) => {
    const history = await db.inventoryLogs
      .where('product_id')
      .equals(product.id!)
      .reverse()
      .limit(50)
      .toArray();
    setProductHistory(history);
    setShowProductDetails(product);
  };

  const fetchCustomerHistory = async (customer: Customer) => {
    const customerSales = await db.sales
      .where('customer_id')
      .equals(customer.id!)
      .reverse()
      .toArray();
    
    const saleIds = customerSales.map(s => s.id!).filter(Boolean);
    const allItems = saleIds.length > 0
      ? await db.saleItems.where('sale_id').anyOf(saleIds).toArray()
      : [];

    const productIds = Array.from(new Set(allItems.map(si => si.product_id).filter(Boolean)));
    const relevantProducts = productIds.length > 0
      ? await db.products.where('id').anyOf(productIds).toArray()
      : [];
    const productMap = new Map(relevantProducts.map(p => [p.id, p]));

    const itemsBySaleId = new Map<number, any[]>();
    allItems.forEach(si => {
      const list = itemsBySaleId.get(si.sale_id) || [];
      list.push(si);
      itemsBySaleId.set(si.sale_id, list);
    });

    const salesWithItems = customerSales.map(s => {
      const sItems = itemsBySaleId.get(s.id!) || [];
      return {
        ...s,
        items: JSON.stringify(sItems.map(si => ({
          name: productMap.get(si.product_id)?.name || 'منتج محذوف',
          quantity: si.quantity,
          price: si.price_at_sale,
          unit: productMap.get(si.product_id)?.unit || ''
        })))
      };
    });

    const debts = await db.debts
      .where('customer_id')
      .equals(customer.id!)
      .reverse()
      .toArray();

    setCustomerHistory({ sales: salesWithItems, debts });
    setShowCustomerDetails(customer);
  };

  const handlePayment = async (data: any, resetForm: () => void) => {
    const { paymentAmount, paymentNotes } = data;
    if (!showPaymentModal || !showPaymentModal.id) return;
    const amount = Number(paymentAmount);
    
    try {
      let updatedCustomer: Customer | undefined;
      // Update local DB
      await db.transaction('rw', [db.customers, db.debts], async () => {
        const targetCustomer = await db.customers.get(showPaymentModal.id!);
        if (targetCustomer) {
          const newBalance = targetCustomer.balance - amount;
          await db.customers.update(showPaymentModal.id!, {
            balance: newBalance
          });
          updatedCustomer = { ...targetCustomer, balance: newBalance };
        }
        await db.debts.add({
          customer_id: showPaymentModal.id!,
          amount: amount,
          type: 'payment',
          created_at: new Date().toISOString(),
          notes: paymentNotes.trim() || undefined
        });
      });
      
      const oldBalance = showPaymentModal.balance;
      const isCleared = updatedCustomer && oldBalance > 0 && updatedCustomer.balance === 0;
      const isCreditIncreased = updatedCustomer && updatedCustomer.balance < 0;

      let notifMsg = 'تم تسجيل العملية وتحديث حساب الزبون بنجاح';
      if (isCleared) {
        notifMsg = 'تم تصفية رصيد الزبون بالكامل وتسوية الدين بنجاح!';
      } else if (isCreditIncreased) {
        if (oldBalance <= 0) {
          notifMsg = `تم إيداع الدفعة المقدمة بنجاح! الرصيد المتوفر حالياً للزبون: ${formatPrice(Math.abs(updatedCustomer.balance))}`;
        } else {
          notifMsg = `تم سداد كامل الدين وتسجيل رصيد إضافي مقدّم بقيمة: ${formatPrice(Math.abs(updatedCustomer.balance))}`;
        }
      } else {
        notifMsg = `تم استلام الدفعة بنجاح! المتبقي المستحق على الزبون: ${formatPrice(updatedCustomer?.balance || 0)}`;
      }
      showNotification(notifMsg, 'success');
      
      if (updatedCustomer) {
        if (showCustomerDetails && showCustomerDetails.id === updatedCustomer.id) {
          await fetchCustomerHistory(updatedCustomer);
        }
      }
    } catch (err) {
      console.error("Failed to process payment:", err);
      showNotification('خطأ في تسجيل الدفعة', 'error');
    }

    setShowPaymentModal(null);
          };

  const handleCustomerAdjustmentSubmit = async (data: any, resetForm: () => void) => {
    const { adjustmentType, adjustmentAmount, adjustmentNotes } = data;
    if (!showCustomerAdjustmentModal || !showCustomerAdjustmentModal.id) return;
    const amount = Number(adjustmentAmount) || 0;
    
    try {
      let updatedCustomer: Customer | undefined;
      // Update local DB
      await db.transaction('rw', [db.customers, db.debts], async () => {
        const targetCustomer = await db.customers.get(showCustomerAdjustmentModal.id!);
        if (targetCustomer) {
          let newBalance = targetCustomer.balance;
          if (adjustmentType === 'add_debt') {
             newBalance += amount;
          } else if (adjustmentType === 'add_credit') {
             newBalance -= amount;
          }
          await db.customers.update(showCustomerAdjustmentModal.id!, {
            balance: newBalance
          });
          updatedCustomer = { ...targetCustomer, balance: newBalance };
        }
        await db.debts.add({
          customer_id: showCustomerAdjustmentModal.id!,
          amount: adjustmentType === 'note' ? 0 : amount,
          type: adjustmentType === 'add_debt' ? 'purchase' : 'payment',
          created_at: new Date().toISOString(),
          notes: adjustmentNotes.trim() || undefined
        });
      });
      
      showNotification('تم حفظ التعديل بنجاح', 'success');
      
      if (updatedCustomer) {
        if (showCustomerDetails && showCustomerDetails.id === updatedCustomer.id) {
          await fetchCustomerHistory(updatedCustomer);
        }
      }
    } catch (err) {
      console.error("Failed to process adjustment:", err);
      showNotification('خطأ في حفظ التعديل', 'error');
    }

    setShowCustomerAdjustmentModal(null);
              };

  const handleSaveSettlement = async (data: any, resetForm: () => void) => {
    const { deliveredSettleAmount, settleNotes } = data;
    const delivered = Number(deliveredSettleAmount);
    if (isNaN(delivered) || delivered < 0) {
      showNotification('الرجاء إدخال مبلغ مسلم صحيح لتسوية المبيعات', 'error');
      return;
    }
    
    try {
      if (!db.salesSettlements) {
        showNotification('قاعدة البيانات غير مهيأة بعد للتسويات', 'error');
        return;
      }
      const targetToSettle = activeOutstandingCash;
      const expectedPhysicalValue = Math.max(0, targetToSettle - currentCycleUnpaidWithdrawalsTotal);
      await db.salesSettlements.add({
        total_sales: targetToSettle,
        delivered_amount: delivered,
        difference: delivered - expectedPhysicalValue, // الفارق الفعلي للجرد بالصندوق
        created_at: new Date().toISOString(),
        notes: settleNotes.trim() || undefined,
        cash_withdrawals: currentCycleUnpaidWithdrawalsTotal // تدوين سحبيات العجز/السحبيات الشخصية في الدورة
      });
      showNotification('تم حفظ تصفية المبيعات ومطابقة الصندوق بنجاح!');
      setShowSettleModal(false);
                } catch (err) {
      console.error('Failed to save settlement:', err);
      showNotification('خطأ في حفظ تصفية المبيعات', 'error');
    }
  };

  const handleDeleteSettlement = async (id: number) => {
    setConfirmAction({
      title: 'حذف سجل تصفية',
      message: 'هل أنت متأكد من حذف سجل هذه التصفية؟ القيام بذلك سيعيد دمج المبيعات التي كانت ضمنها إلى دورة التصفية الحالية.',
      onConfirm: async () => {
        try {
          if (db.salesSettlements) {
            await db.salesSettlements.delete(id);
            showNotification('تم حذف سجل التصفية بنجاح وإعادة دمج العمليات');
          }
        } catch (err) {
          console.error('Failed to delete settlement:', err);
          showNotification('فشل حذف سجل التصفية', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleSaveWithdrawal = async (data: any, resetForm: () => void) => {
    const { withdrawAmount, withdrawReason, withdrawByWhom } = data;
    const amount = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      showNotification('الرجاء إدخال مبلغ سحب صحيح', 'error');
      return;
    }
    if (!withdrawReason.trim()) {
      showNotification('الرجاء إدخال سبب/بيان السحب', 'error');
      return;
    }
    try {
      if (!db.cashWithdrawals) {
        showNotification('قاعدة البيانات غير مهيأة بعد للمسحوبات', 'error');
        return;
      }
      await db.cashWithdrawals.add({
        amount,
        by_whom: withdrawByWhom.trim() || 'أمين الصندوق',
        reason: withdrawReason.trim(),
        created_at: new Date().toISOString(),
        is_repaid: false,
      });
      showNotification('تم تسجيل مسحوبات الصندوق (السلفة/المنصرف الكاش) بنجاح!');
      setShowWithdrawModal(false);
                  setWithdrawByWhom('أمين الصندوق');
    } catch (err) {
      console.error('Failed to save withdrawal:', err);
      showNotification('فشل في تسجيل عملية السحب', 'error');
    }
  };

  const handleRepayWithdrawal = async (id: number) => {
    try {
      if (!db.cashWithdrawals) return;
      const w = await db.cashWithdrawals.get(id);
      if (w) {
        const nextState = !w.is_repaid;
        await db.cashWithdrawals.update(id, {
          is_repaid: nextState,
          repay_date: nextState ? new Date().toISOString() : undefined
        });
        showNotification(
          nextState 
            ? 'تم تأكيد السداد وإرجاع المبلغ للصندوق بنجاح! تم شطب السلفة.' 
            : 'تم تراجع السداد، والمبلغ مطلوب سداده مجدداً.'
        );
      }
    } catch (err) {
      console.error('Failed to update repayment status:', err);
      showNotification('حدث خطأ أثناء تعديل حالة السداد', 'error');
    }
  };

  const handleDeleteWithdrawal = async (id: number) => {
    setConfirmAction({
      title: 'حذف سحب نقدي',
      message: 'هل أنت متأكد من رغبتك في حذف سجل السحب النقدي هذا من الصندوق؟',
      onConfirm: async () => {
        try {
          if (db.cashWithdrawals) {
            await db.cashWithdrawals.delete(id);
            showNotification('تم حذف سجل السحب بنجاح');
          }
        } catch (err) {
          console.error('Failed to delete withdrawal:', err);
          showNotification('فشل حذف سجل السحب', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleAddNote = async (newNote: any, resetForm: () => void) => {
    if (!newNote.title.trim()) {
      showNotification('يرجى إدخال عنوان الملاحظة', 'error');
      return;
    }
    try {
      if (editingNoteId) {
        await db.notes.update(editingNoteId, {
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          reminder_date: newNote.reminder_date || null,
          priority: newNote.priority || 'normal'
        });
        showNotification('تم تحديث الملاحظة بنجاح');
      } else {
        await db.notes.add({
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          reminder_date: newNote.reminder_date || null,
          created_at: new Date().toISOString(),
          is_completed: false,
          priority: newNote.priority || 'normal'
        });
        showNotification('تم حفظ الملاحظة بنجاح');
      }
      resetForm();
      setEditingNoteId(null);
      setShowAddNote(false);
    } catch (err) {
      console.error('Failed to save note: ', err);
      showNotification('حدث خطأ أثناء حفظ الملاحظة', 'error');
    }
  };

  const handleEditNoteAction = (note: any) => {
    setEditingNoteId(note.id);
    setShowAddNote(true);
  };

  const handleDeleteNote = (id: number) => {
    setConfirmAction({
      title: 'حذف الملاحظة',
      message: 'هل أنت متأكد من رغبتك في حذف هذه الملاحظة نهائياً؟',
      onConfirm: async () => {
        try {
          await db.notes.delete(id);
          showNotification('تم حذف الملاحظة بنجاح');
          if (selectedNote && selectedNote.id === id) {
            setSelectedNote(null);
          }
        } catch (err) {
          console.error("Failed to delete note:", err);
          showNotification('حدث خطأ أثناء الحذف', 'error');
        }
      }
    });
  };

  const handleToggleNoteCompletion = async (note: any) => {
    try {
      const updatedStatus = !note.is_completed;
      await db.notes.update(note.id!, { is_completed: updatedStatus });
      showNotification(updatedStatus ? 'تم إكمال المهمة بنجاح ✓' : 'تم تفعيل المهمة كغير مكتملة 📝');
      if (selectedNote && selectedNote.id === note.id) {
        setSelectedNote({ ...selectedNote, is_completed: updatedStatus });
      }
    } catch (err) {
      console.error("Failed to toggle note completion:", err);
      showNotification('حدث خطأ أثناء تحديث حالة الملاحظة', 'error');
    }
  };

  const handleCopyNoteContent = (content: string) => {
    try {
      navigator.clipboard.writeText(content);
      showNotification('تم نسخ محتوى الملاحظة بنجاح 📋');
    } catch (err) {
      console.error("Failed to copy note content: ", err);
      showNotification('فشل في نسخ النص', 'error');
    }
  };

  const formatCalculatedValue = (val: number): string => {
    if (isNaN(val) || !isFinite(val)) return '';
    return Number(val.toFixed(2)).toString();
  };

  
  const handleUpdateStock = async () => {
    if (!updatingStockProduct || !updatingStockProduct.id || !updatingStockAmount || isNaN(Number(updatingStockAmount))) return;
    
    const amount = Number(updatingStockAmount);
    if (amount <= 0) {
      showNotification('يجب إدخال كمية صحيحة أكبر من الصفر', 'error');
      return;
    }

    try {
      const dbProduct = await db.products.get(updatingStockProduct.id);
      if (!dbProduct) return;

      const changeAmount = updatingStockType === 'add' ? amount : -amount;
      const newStock = dbProduct.stock_quantity + changeAmount;

      if (newStock < 0) {
        showNotification('الكمية المراد سحبها أكبر من المخزون المتوفر', 'error');
        return;
      }

      await db.transaction('rw', [db.products, db.inventoryLogs], async () => {
        // Update product stock
        await db.products.update(dbProduct.id!, { stock_quantity: newStock });

        // Add inventory log
        await db.inventoryLogs.add({
          product_id: dbProduct.id!,
          change_amount: changeAmount,
          reason: 'manual_update',
          notes: updatingStockNotes || (updatingStockType === 'add' ? 'إضافة مخزون يدوية' : 'سحب/تسوية مخزون يدوية'),
          created_at: new Date().toISOString()
        });
      });
      
      showNotification('تم تحديث المخزون بنجاح', 'success');
      setUpdatingStockProduct(null);
      setUpdatingStockAmount('');
      setUpdatingStockNotes('');
      setUpdatingStockType('add');
      setUpdateSupplierBalance(true);
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء تحديث المخزون', 'error');
    }
  };

  const handleAddProduct = async (product: any, resetForm: () => void) => {
    if (!product.name || !product.name.trim()) {
      showNotification('يجب إدخال اسم المنتج', 'error');
      return;
    }
    const cost_price = Number(product.cost) || 0;
    const sale_price = Number(product.sale) || 0;
    const stock_quantity = Number(product.stock) || 0;

    if (sale_price < 0 || cost_price < 0 || stock_quantity < 0) {
      showNotification('يرجى إدخال قيم صحيحة وموجبة', 'error');
      return;
    }

    try {
      await db.transaction('rw', [db.products, db.inventoryLogs], async () => {
        const productId = await db.products.add({
          name: product.name.trim(),
          category: product.category?.trim() || 'عام',
          barcode: product.barcode?.trim() || undefined,
          cost_price,
          sale_price,
          stock_quantity,
          unit: product.unit?.trim() || 'حبة',
          supplier_id: product.supplier_id || undefined,
          production_date: product.production_date || undefined,
          expiration_date: product.expiration_date || undefined
        });

        // Add to inventory log
        await db.inventoryLogs.add({
          product_id: productId as number,
          change_amount: stock_quantity,
          reason: 'new_product',
          notes: 'إدخال صنف جديد لأول مرة في النظام',
          created_at: new Date().toISOString()
        });
      });

      showNotification('تم إضافة المنتج بنجاح', 'success');
      setShowAddProduct(false);
      resetForm();
    } catch (err) {
      console.error("Failed to add product:", err);
      showNotification('خطأ في إضافة المنتج', 'error');
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.id) return;
    if (!editingProduct.name || !editingProduct.name.trim()) {
      showNotification('يجب إدخال اسم المنتج', 'error');
      return;
    }
    if (editingProduct.sale_price === undefined || editingProduct.sale_price === null || isNaN(Number(editingProduct.sale_price))) {
      showNotification('يجب إدخال سعر البيع بشكل صحيح', 'error');
      return;
    }
    if (editingProduct.stock_quantity === undefined || editingProduct.stock_quantity === null || isNaN(Number(editingProduct.stock_quantity))) {
      showNotification('يجب إدخال الكمية بشكل صحيح', 'error');
      return;
    }
    
    try {
      await db.transaction('rw', [db.products, db.inventoryLogs], async () => {
        // Update local DB
        const oldProduct = await db.products.get(editingProduct.id!);
        if (oldProduct) {
          const diff = editingProduct.stock_quantity - oldProduct.stock_quantity;
          await db.products.update(editingProduct.id!, editingProduct);
          
          if (diff !== 0) {
            await db.inventoryLogs.add({
              product_id: editingProduct.id!,
              change_amount: diff,
              reason: 'manual_update',
              created_at: new Date().toISOString()
            });
          }
        }
      });

      showNotification('تم تحديث المنتج بنجاح');
    } catch (err) {
      console.error("Failed to update product:", err);
      showNotification('خطأ في تحديث المنتج', 'error');
    }

    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: number) => {
    setConfirmAction({
      title: 'حذف منتج',
      message: 'هل أنت متأكد من حذف هذا المنتج؟',
      onConfirm: async () => {
        try {
          // Delete from local DB
          await db.products.delete(id);
          
          showNotification('تم حذف المنتج');
        } catch (err) {
          console.error("Failed to delete product:", err);
          showNotification('خطأ في حذف المنتج', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleDeleteCustomer = async (id: number) => {
    setConfirmAction({
      title: 'حذف زبون',
      message: 'هل أنت متأكد من حذف هذا الزبون؟',
      onConfirm: async () => {
        try {
          // Delete from local DB
          await db.customers.delete(id);
          
          showNotification('تم حذف الزبون');
        } catch (err) {
          console.error("Failed to delete customer:", err);
          showNotification('خطأ في حذف الزبون', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleRefundSale = async (id: number) => {
    setConfirmAction({
      title: 'إلغاء عملية بيع',
      message: 'هل أنت متأكد من إلغاء هذه العملية؟ سيتم استعادة المخزون وعكس الديون.',
      onConfirm: async () => {
        try {
          // Update local DB
          await db.transaction('rw', [db.sales, db.saleItems, db.products, db.inventoryLogs, db.customers, db.debts, db.suppliers], async () => {
            const sale = await db.sales.get(id);
            if (!sale) return;

            const items = await db.saleItems.where('sale_id').equals(id).toArray();
            for (const item of items) {
              const product = await db.products.get(item.product_id);
              if (product) {
                await db.products.update(item.product_id, {
                  stock_quantity: product.stock_quantity + item.quantity
                });
                await db.inventoryLogs.add({
                  product_id: item.product_id,
                  change_amount: item.quantity,
                  reason: 'refund',
                  created_at: new Date().toISOString()
                });

                // Reverse supplier balance change if product has a supplier
                if (product.supplier_id) {
                  const supplier = await db.suppliers.get(product.supplier_id);
                  if (supplier) {
                    await db.suppliers.update(product.supplier_id, {
                      balance: supplier.balance - (product.cost_price * item.quantity)
                    });
                  }
                }
              }
            }

            if (sale.payment_type === 'debt' && sale.customer_id) {
              const customer = await db.customers.get(sale.customer_id);
              if (customer) {
                await db.customers.update(sale.customer_id, {
                  balance: customer.balance - sale.total_amount
                });
                await db.debts.where('sale_id').equals(id).delete();
              }
            }

            await db.saleItems.where('sale_id').equals(id).delete();
            await db.sales.delete(id);
          });
          
          showNotification('تم إلغاء العملية واستعادة المخزون');
        } catch (err) {
          console.error("Failed to refund sale:", err);
          showNotification('خطأ في إلغاء العملية', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const updateStoreName = async (newName: string) => {
    try {
      // Assuming a backend endpoint for settings exists or we can just update locally
      // For now, let's just update locally and maybe add a backend call if needed
      await db.settings.where('key').equals('storeName').modify({ value: newName });
      setStoreName(newName);
      showNotification('تم تحديث اسم النشاط التجاري');
    } catch (err) {
      console.error("Failed to update store name:", err);
      // Fallback to local DB
      const existing = await db.settings.where('key').equals('storeName').first();
      if (existing) {
        await db.settings.update(existing.id!, { value: newName });
      } else {
        await db.settings.add({ key: 'storeName', value: newName });
      }
      setStoreName(newName);
      showNotification('تم تحديث اسم النشاط التجاري (محلياً)');
    }
  };

  const updateCurrency = async (newCurrency: string) => {
    const existing = await db.settings.where('key').equals('currency').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: newCurrency });
    } else {
      await db.settings.add({ key: 'currency', value: newCurrency });
    }
    setCurrency(newCurrency);

    showNotification('تم تحديث العملة');
  };

  const updateRoundingFactor = async (factor: number | null, silent: boolean = false) => {
    const existing = await db.settings.where('key').equals('roundingFactor').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: factor });
    } else {
      await db.settings.add({ key: 'roundingFactor', value: factor });
    }
    setRoundingFactor(factor);
    if (!silent) showNotification('تم تحديث إعدادات التقريب');
  };

  const updatePermissionsEnabled = async (enabled: boolean) => {
    const existing = await db.settings.where('key').equals('permissionsEnabled').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: enabled });
    } else {
      await db.settings.add({ key: 'permissionsEnabled', value: enabled });
    }
    setPermissionsEnabled(enabled);
  };

  const updateAdminPin = async (newPin: string) => {
    let pinToStore = '';
    if (newPin) {
      pinToStore = await hashPIN(newPin);
    }
    const existing = await db.settings.where('key').equals('adminPin').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: pinToStore });
    } else {
      await db.settings.add({ key: 'adminPin', value: pinToStore });
    }
    setAdminPin(pinToStore);
  };

  const updateProtectedActions = async (actions: Record<string, boolean>) => {
    const existing = await db.settings.where('key').equals('protectedActions').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: actions });
    } else {
      await db.settings.add({ key: 'protectedActions', value: actions });
    }
    setProtectedActions(actions);
  };

  const verifyAdminPermission = (actionType: string, onSuccess: () => void, title = 'التحقق من صلاحية المدير') => {
    if (!permissionsEnabled || !protectedActions[actionType]) {
      onSuccess();
      return;
    }

    if (!adminPin) {
      setPinModal({
        isOpen: true,
        actionType: 'setup_first',
        onSuccess: onSuccess,
        title: '🔑 إنشاء رمز حماية المدير (لأول مرة)',
        description: 'الرجاء تعيين رمز مرور رقمي خاص بالمدير لحماية الإجراءات الحساسة والنظام. يرجى حفظ هذا الرمز جيداً.',
        inputVal: '',
        error: ''
      });
      return;
    }

    let actionDesc = 'الرجاء إدخال رمز الأمان للمتابعة';
    if (actionType === 'analytics') actionDesc = 'رؤية الأرباح والتقارير المالية والتحليلات الذكية';
    else if (actionType === 'settings') actionDesc = 'الوصول لإعدادات النظام والنسخ الاحتياطي وإعادة الضبط';
    else if (actionType === 'delete_sale') actionDesc = 'تأكيد صلاحية حذف أو تعديل فاتورة بيع من السجل';
    else if (actionType === 'edit_product') actionDesc = 'تأكيد صلاحية تعديل أسعار المنتجات أو حذف السلع من المخزن';
    else if (actionType === 'cash_withdrawal') actionDesc = 'الموافقة على سحب مبلغ كاش أو سلفة من الصندوق';
    else if (actionType === 'settlement') actionDesc = 'صلاحية تصفية وردية الكاش وتسوية المبيعات اليومية';
    else if (actionType === 'supplier_payment') actionDesc = 'تسجيل دفعة مالية جديدة للمورد أو تسوية حسابه المالي';
    else if (actionType === 'smart_import') actionDesc = 'الوصول لأداة الاستيراد الذكية لرفع أو استيراد البيانات بالفاتورة والباركود';

    setPinModal({
      isOpen: true,
      actionType: actionType,
      onSuccess: onSuccess,
      title: title,
      description: actionDesc,
      inputVal: '',
      error: ''
    });
  };

  // High-performance physical keyboard PIN input listener
  useEffect(() => {
    if (!pinModal.isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPinModal(p => {
          const newVal = p.inputVal + e.key;
          if (newVal.length > 8) return p;
          
          // Instant auto-unlock upon correct PIN match
          if (p.actionType !== 'setup_first') {
            verifyPinMatches(newVal, adminPin).then(isMatch => {
              if (isMatch) {
                setTimeout(() => {
                  const successCb = p.onSuccess;
                  setPinModal(prev => ({ ...prev, isOpen: false }));
                  successCb();
                }, 30);
              }
            });
          }
          return { ...p, inputVal: newVal, error: '' };
        });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPinModal(p => ({ ...p, inputVal: p.inputVal.slice(0, -1), error: '' }));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pinModal.actionType === 'setup_first') {
          if (pinModal.inputVal.length < 4) {
            setPinModal(p => ({ ...p, error: 'يجب أن يكون الرمز من 4 أرقام على الأقل' }));
            return;
          }
          updateAdminPin(pinModal.inputVal);
          updatePermissionsEnabled(true);
          showNotification('🔑 تم تعيين رمز أمان المدير وتفعيل نظام الحماية بنجاح!');
          const successCb = pinModal.onSuccess;
          setPinModal(p => ({ ...p, isOpen: false }));
          successCb();
        } else {
          verifyPinMatches(pinModal.inputVal, adminPin).then(isMatch => {
            if (isMatch) {
              const successCb = pinModal.onSuccess;
              setPinModal(p => ({ ...p, isOpen: false }));
              successCb();
            } else {
              setPinModal(p => ({ ...p, error: '❌ رمز المرور غير صحيح! الرجاء المحاولة مرة أخرى.' }));
            }
          });
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPinModal(p => ({ ...p, isOpen: false }));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pinModal.isOpen, pinModal.inputVal, pinModal.actionType, pinModal.onSuccess, adminPin]);

  const exportData = async () => {
    const data = {
      products: await db.products.toArray(),
      customers: await db.customers.toArray(),
      suppliers: await db.suppliers.toArray(),
      supplierPayments: await db.supplierPayments.toArray(),
      sales: await db.sales.toArray(),
      saleItems: await db.saleItems.toArray(),
      debts: await db.debts.toArray(),
      inventoryLogs: await db.inventoryLogs.toArray(),
      settings: await db.settings.toArray(),
      notes: await db.notes.toArray(),
    };
    const jsonString = JSON.stringify(data, null, 2);
    const fileName = `${storeName}_بيانات_${new Date().toISOString().split('T')[0]}.json`;

    if (window.pywebview && window.pywebview.api) {
      try {
        const success = await window.pywebview.api.save_file(fileName, jsonString);
        if (success) {
          showNotification('تم حفظ النسخة الاحتياطية بنجاح عبر النظام');
        } else {
          showNotification('تم إلغاء حفظ الملف أو فشلت العملية', 'error');
          return;
        }
      } catch (err) {
        console.error("Pywebview save failed:", err);
      }
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    }
    
    // Update last backup date
    const now = new Date().toISOString();
    const existing = await db.settings.where('key').equals('lastBackupDate').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: now });
    } else {
      await db.settings.add({ key: 'lastBackupDate', value: now });
    }
    setLastBackupDate(now);
    
    if (!(window.pywebview && window.pywebview.api)) {
      showNotification('تم تصدير نسخة احتياطية بنجاح');
    }
  };

  const handleImportPython = async () => {
    if (window.pywebview && window.pywebview.api) {
      try {
        const content = await window.pywebview.api.select_file();
        if (!content) {
          showNotification('تم إلغاء استيراد الملف', 'error');
          return;
        }
        
        let data;
        try {
          data = JSON.parse(content);
        } catch (e) {
          showNotification('الملف ليس بتنسيق JSON صحيح', 'error');
          return;
        }

        await db.transaction('rw', [db.products, db.customers, db.suppliers, db.supplierPayments, db.sales, db.saleItems, db.debts, db.inventoryLogs, db.settings, db.notes], async () => {
          await db.products.clear();
          await db.customers.clear();
          await db.suppliers.clear();
          await db.supplierPayments.clear();
          await db.sales.clear();
          await db.saleItems.clear();
          await db.debts.clear();
          await db.inventoryLogs.clear();
          await db.settings.clear();
          await db.notes.clear();

          if (data.products) await db.products.bulkAdd(data.products);
          if (data.customers) await db.customers.bulkAdd(data.customers);
          if (data.suppliers) await db.suppliers.bulkAdd(data.suppliers);
          if (data.supplierPayments) await db.supplierPayments.bulkAdd(data.supplierPayments);
          if (data.sales) await db.sales.bulkAdd(data.sales);
          if (data.saleItems) await db.saleItems.bulkAdd(data.saleItems);
          if (data.debts) await db.debts.bulkAdd(data.debts);
          if (data.inventoryLogs) await db.inventoryLogs.bulkAdd(data.inventoryLogs);
          if (data.settings) await db.settings.bulkAdd(data.settings);
          if (data.notes) await db.notes.bulkAdd(data.notes);
        });
        showNotification('تم استيراد البيانات بنجاح');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        console.error("Pywebview import failed:", err);
        showNotification('خطأ في استيراد البيانات', 'error');
      }
    }
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await db.transaction('rw', [db.products, db.customers, db.suppliers, db.supplierPayments, db.sales, db.saleItems, db.debts, db.inventoryLogs, db.settings, db.notes], async () => {
          await db.products.clear();
          await db.customers.clear();
          await db.suppliers.clear();
          await db.supplierPayments.clear();
          await db.sales.clear();
          await db.saleItems.clear();
          await db.debts.clear();
          await db.inventoryLogs.clear();
          await db.settings.clear();
          await db.notes.clear();

          if (data.products) await db.products.bulkAdd(data.products);
          if (data.customers) await db.customers.bulkAdd(data.customers);
          if (data.suppliers) await db.suppliers.bulkAdd(data.suppliers);
          if (data.supplierPayments) await db.supplierPayments.bulkAdd(data.supplierPayments);
          if (data.sales) await db.sales.bulkAdd(data.sales);
          if (data.saleItems) await db.saleItems.bulkAdd(data.saleItems);
          if (data.debts) await db.debts.bulkAdd(data.debts);
          if (data.inventoryLogs) await db.inventoryLogs.bulkAdd(data.inventoryLogs);
          if (data.settings) await db.settings.bulkAdd(data.settings);
          if (data.notes) await db.notes.bulkAdd(data.notes);
        });
        showNotification('تم استيراد البيانات بنجاح');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showNotification('خطأ في استيراد البيانات', 'error');
      }
    };
    reader.readAsText(file);
  };

  const forceLocalDiskBackup = async () => {
    try {
      setIsBackupSyncing(true);
      const data = {
        products,
        customers,
        suppliers,
        supplierPayments: await db.supplierPayments.toArray(),
        sales,
        saleItems: await db.saleItems.toArray(),
        debts: await db.debts.toArray(),
        inventoryLogs: await db.inventoryLogs.toArray(),
        settings: appSettings,
        notes,
      };
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetchBackupStatus();
        showNotification('تم تحديث وحفظ قاعدة بيانات النظام التلقائية على القرص بنجاح!');
      } else {
        showNotification('فشل تحديث قاعدة البيانات التلقائية', 'error');
      }
    } catch (err: any) {
      showNotification('خطأ في إرسال النسخة الاحتياطية للقرص', 'error');
    } finally {
      setIsBackupSyncing(false);
    }
  };


  const resetDatabase = async () => {
    setConfirmAction({
      title: 'إعادة ضبط البرنامج',
      message: 'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذه الخطوة وسيتم حذف كل المنتجات والزبائن والمبيعات.',
      onConfirm: async () => {
        await db.transaction('rw', [db.products, db.customers, db.suppliers, db.supplierPayments, db.sales, db.saleItems, db.debts, db.inventoryLogs, db.settings, db.notes], async () => {
          await db.products.clear();
          await db.customers.clear();
          await db.suppliers.clear();
          await db.supplierPayments.clear();
          await db.sales.clear();
          await db.saleItems.clear();
          await db.debts.clear();
          await db.inventoryLogs.clear();
          await db.notes.clear();
          await db.settings.filter(s => s.key !== 'isFirstRun' && s.key !== 'storeName' && s.key !== 'adminPin').delete();
        });
        showNotification('تم تصفير البرنامج بنجاح');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  };

  const printReceipt = (sale: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة بيع</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: right; }
            .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 40px; font-size: 0.8em; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${storeName}</h1>
            <p>رقم الفاتورة: #${sale.id}</p>
            <p>التاريخ: ${formatDateTimeWithDay(sale.created_at)}</p>
          </div>
          <p>الزبون: ${sale.customer_name || 'زبون نقدي'}</p>
          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price}</td>
                  <td>${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">الإجمالي: ${sale.total_amount} ${currency}</div>
          <p style="margin-bottom: 5px;">طريقة الدفع: ${sale.payment_type === 'cash' ? 'كاش' : 'دين'}</p>
          ${sale.notes ? `<p style="margin-top: 5px; font-size: 12px; color: #555;">ملاحظات: ${sale.notes}</p>` : ''}
          <div class="footer" style="margin-top: 20px;">شكراً لزيارتكم!</div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = (customer: Customer) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 30px;">
        <div style="text-align: center; border-bottom: 3px double #000; margin-bottom: 30px; padding-bottom: 10px;">
          <h1>${storeName} - كشف حساب</h1>
          <p>تاريخ الإصدار: ${formatDateTimeWithDay(new Date())}</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div><strong>الزبون:</strong> ${customer.name}</div>
          <div><strong>الهاتف:</strong> ${customer.phone}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f2f2f2;">
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">التاريخ</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">البيان</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">مدين (+)</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">دائن (-)</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerEntries.map(entry => {
              let itemsHtml = '';
              let title = '';
              let debit = '-';
              let credit = '-';

              if (entry.entryType === 'sale') {
                if (entry.items) {
                  try {
                    const items = typeof entry.items === 'string' ? JSON.parse(entry.items) : entry.items;
                    if (Array.isArray(items)) {
                      itemsHtml = `<div style="font-size: 0.85em; color: #555; margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">
                        ${items.map((item: any) => `${item.name} (${item.quantity} ${item.unit || ''} × ${item.price})`).join('<br/>')}
                      </div>`;
                    }
                  } catch (e) {
                    itemsHtml = '<div style="font-size: 0.8em; color: red;">خطأ في عرض المنتجات</div>';
                  }
                }
                title = 'فاتورة مشتريات #' + entry.id + itemsHtml;
                debit = entry.total_amount;
              } else {
                if (entry.amount === 0) {
                  title = entry.notes || 'ملاحظة عامة';
                } else if (entry.type === 'purchase') {
                  title = entry.notes ? `زيادة مديونية: ${entry.notes}` : 'زيادة مديونية';
                  debit = entry.amount;
                } else {
                  title = entry.notes ? `دفعة: ${entry.notes}` : 'تسديد مبلغ';
                  credit = entry.amount;
                }
              }

              return `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${formatDateWithDay(entry.created_at)}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${title}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${debit}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${credit}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; float: left; width: 250px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;"><span>إجمالي المشتريات:</span> <span>${customerStats.totalPurchased} ${currency}</span></div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;"><span>إجمالي المدفوعات:</span> <span>${customerStats.totalPaid} ${currency}</span></div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px;"><span>الرصيد المتبقي:</span> <span>${customer.balance} ${currency}</span></div>
        </div>
      </div>
    `;
    
    const opt = {
      margin: 0.5,
      filename: `كشف_حساب_${customer.name}.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        ignoreElements: (element: HTMLElement) => {
          return element.tagName === 'STYLE' || element.tagName === 'LINK';
        }
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadInventoryPDF = async () => {
    const allProducts = await db.products.toArray();
    const element = document.createElement('div');
    element.innerHTML = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 30px;">
        <div style="text-align: center; border-bottom: 3px double #000; margin-bottom: 30px; padding-bottom: 10px;">
          <h1>${storeName} - تقرير المخزون</h1>
          <p>تاريخ الإصدار: ${formatDateTimeWithDay(new Date())}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f2f2f2;">
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">المنتج</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">التصنيف</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">سعر التكلفة</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">سعر البيع</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">الكمية</th>
            </tr>
          </thead>
          <tbody>
            ${allProducts.map(p => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${p.name}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${p.category}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${p.cost_price} ${currency}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${p.sale_price} ${currency}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">${p.stock_quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    const opt = {
      margin: 0.5,
      filename: `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        ignoreElements: (element: HTMLElement) => {
          return element.tagName === 'STYLE' || element.tagName === 'LINK';
        }
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleShareWhatsApp = (customer: Customer) => {
    const statusText = customer.balance > 0
      ? `🔴 *المبلغ المتبقي المستحق:* ${formatPrice(customer.balance)}`
      : customer.balance < 0
      ? `🟢 *رصيد دائن مقدّم متوفر:* ${formatPrice(Math.abs(customer.balance))}`
      : `✅ *الحساب خالص تماماً (0 ${currency})*`;

    const message = `🧾 *كشف حساب رسمي - ${storeName}*
👤 *العميل المكرم:* ${customer.name}
📱 *رقم الهاتف:* ${customer.phone || 'غير مسجل'}
----------------------------------
📌 ${statusText}

شاكرين لكم حسن تعاونكم ودائمين في خدمتكم 🌹
📞 للتواصل مع المتجر: ${storePhone || 'عبر هذا الرقم'}`;

    const phoneNum = customer.phone ? customer.phone.replace(/\D/g, '') : '';
    const whatsappUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const printStatement = (customer: Customer) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>كشف حساب زبون</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            .header { text-align: center; border-bottom: 3px double #000; margin-bottom: 30px; padding-bottom: 10px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: right; }
            th { background: #f2f2f2; }
            .summary { margin-top: 30px; float: left; width: 250px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .total-debt { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${storeName} - كشف حساب</h1>
            <p>تاريخ الإصدار: ${formatDateTimeWithDay(new Date())}</p>
          </div>
          <div class="info">
            <div><strong>الزبون:</strong> ${customer.name}</div>
            <div><strong>الهاتف:</strong> ${customer.phone}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>البيان</th>
                <th>مدين (+)</th>
                <th>دائن (-)</th>
              </tr>
            </thead>
            <tbody>
              ${ledgerEntries.map(entry => {
                let title = '';
                let debit: string | number = '-';
                let credit: string | number = '-';

                if (entry.entryType === 'sale') {
                  let itemNames = '';
                  if (entry.items) {
                    try {
                      const parsed = typeof entry.items === 'string' ? JSON.parse(entry.items) : entry.items;
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        itemNames = parsed.map((i: any) => `${i.name}${i.quantity > 1 ? ` (×${i.quantity})` : ''}`).join('، ');
                      }
                    } catch (e) {}
                  }
                  title = 'فاتورة مشتريات #' + entry.id + (itemNames ? `<br/><small style="color:#555;font-size:11px;">(الأصناف: ${itemNames})</small>` : '');
                  debit = entry.total_amount;
                } else {
                  if (entry.amount === 0) {
                    title = entry.notes || 'ملاحظة عامة';
                  } else if (entry.type === 'purchase') {
                    title = entry.notes ? `زيادة مديونية: ${entry.notes}` : 'زيادة مديونية';
                    debit = entry.amount;
                  } else {
                    title = entry.notes ? `دفعة: ${entry.notes}` : 'تسديد مبلغ';
                    credit = entry.amount;
                  }
                }

                return `
                  <tr>
                    <td>${formatDateWithDay(entry.created_at)}</td>
                    <td>${title}</td>
                    <td>${debit}</td>
                    <td>${credit}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>إجمالي المشتريات:</span> <span>${customerStats.totalPurchased} ${currency}</span></div>
            <div class="summary-row"><span>إجمالي المدفوعات:</span> <span>${customerStats.totalPaid} ${currency}</span></div>
            <div class="summary-row total-debt"><span>الرصيد المتبقي:</span> <span>${customer.balance} ${currency}</span></div>
          </div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [supplierHistory, setSupplierHistory] = useState<{
    payments: any[];
    products: any[];
    inventoryLogs: any[];
    stats: {
      totalSoldQuantity: number;
      totalSoldValue: number;
      totalReceivedQuantity: number;
      totalReceivedValue: number;
      currentInventoryValue: number;
      currentInventoryStock: number;
      totalPayments: number;
    }
  }>({
    payments: [],
    products: [],
    inventoryLogs: [],
    stats: {
      totalSoldQuantity: 0,
      totalSoldValue: 0,
      totalReceivedQuantity: 0,
      totalReceivedValue: 0,
      currentInventoryValue: 0,
      currentInventoryStock: 0,
      totalPayments: 0
    }
  });

  const fetchSupplierHistory = async (supplier: any) => {
    const payments = await db.supplierPayments.where('supplier_id').equals(supplier.id).toArray();
    const prods = await db.products.where('supplier_id').equals(supplier.id).toArray();
    
    const productIds = prods.map(p => p.id).filter(Boolean) as number[];
    let logs: any[] = [];
    if (productIds.length > 0) {
      logs = await db.inventoryLogs.where('product_id').anyOf(productIds).toArray();
    }

    // Attach product name and details to logs
    const logsWithProductInfo = logs.map(log => {
      const product = prods.find(p => p.id === log.product_id);
      return {
        ...log,
        product_name: product ? product.name : 'منتج غير معروف',
        cost_price: product ? product.cost_price : 0
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate advanced statistics
    const currentInventoryStock = prods.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
    const currentInventoryValue = prods.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0);
    
    // Total payments made
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Sold items calculation (all negative logs with reason = 'sale')
    const soldLogs = logs.filter(l => l.reason === 'sale');
    const canceledLogs = logs.filter(l => l.reason === 'sale_cancel');
    const totalSoldQuantity = soldLogs.reduce((sum, l) => sum + Math.abs(l.change_amount), 0) - canceledLogs.reduce((sum, l) => sum + l.change_amount, 0);
    
    // Calculate total cost value of sold items
    const totalSoldValue = soldLogs.reduce((sum, l) => {
      const product = prods.find(p => p.id === l.product_id);
      const cost = product ? product.cost_price : 0;
      return sum + (Math.abs(l.change_amount) * cost);
    }, 0) - canceledLogs.reduce((sum, l) => {
      const product = prods.find(p => p.id === l.product_id);
      const cost = product ? product.cost_price : 0;
      return sum + (l.change_amount * cost);
    }, 0);

    // Total supplied historically
    const totalReceivedQuantity = logs.filter(l => l.change_amount > 0 && l.reason !== 'sale_cancel').reduce((sum, l) => sum + l.change_amount, 0);
    const totalReceivedValue = logs.filter(l => l.change_amount > 0 && l.reason !== 'sale_cancel').reduce((sum, l) => {
      const product = prods.find(p => p.id === l.product_id);
      const cost = product ? product.cost_price : 0;
      return sum + (l.change_amount * cost);
    }, 0);

    setSupplierHistory({
      payments,
      products: prods,
      inventoryLogs: logsWithProductInfo,
      stats: {
        totalSoldQuantity: Math.max(0, totalSoldQuantity),
        totalSoldValue: Math.max(0, totalSoldValue),
        totalReceivedQuantity,
        totalReceivedValue,
        currentInventoryValue,
        currentInventoryStock,
        totalPayments
      }
    });
    
    setShowSupplierDetails(supplier);
  };

  const handleAddSupplier = async (newSupplier: any, resetForm: () => void) => {
    if (!newSupplier.name) {
      showNotification('يرجى إدخال اسم المورد', 'error');
      return;
    }
    try {
      await db.suppliers.add({
        name: newSupplier.name,
        phone: newSupplier.phone,
        balance: Number(newSupplier.initialBalance) || 0
      });
      setShowAddSupplier(false);
      resetForm();
      showNotification('تم إضافة المورد بنجاح');
    } catch (err) {
      console.error("Failed to add supplier:", err);
      showNotification('خطأ في إضافة المورد', 'error');
    }
  };

  const handleSupplierPayment = async (data: any, resetForm: () => void) => {
    const { supplierPaymentAmount, supplierPaymentNotes } = data;
    if (!showSupplierPaymentModal || !supplierPaymentAmount) return;
    const amount = Number(supplierPaymentAmount);
    
    try {
      await db.transaction('rw', [db.suppliers, db.supplierPayments], async () => {
        await db.supplierPayments.add({
          supplier_id: showSupplierPaymentModal.id!,
          amount,
          payment_date: new Date().toISOString(),
          notes: supplierPaymentNotes
        });
        
        await db.suppliers.update(showSupplierPaymentModal.id!, {
          balance: showSupplierPaymentModal.balance - amount
        });
      });
      
      showNotification('تم تسجيل الدفعة بنجاح');
      setShowSupplierPaymentModal(null);
                  if (showSupplierDetails && showSupplierDetails.id === showSupplierPaymentModal.id) {
        fetchSupplierHistory(showSupplierPaymentModal);
      }
    } catch (err) {
      console.error("Failed to record supplier payment:", err);
      showNotification('خطأ في تسجيل الدفعة', 'error');
    }
  };

  const handleAddCustomer = async (newCustomer: any, resetForm: () => void) => {
    if (!newCustomer.name.trim()) {
      showNotification('يرجى إدخال اسم الزبون', 'error');
      return;
    }
    
    const initialDebtVal = parseFloat(newCustomer.initialDebt) || 0;
    
    const customerData = {
      name: newCustomer.name,
      phone: newCustomer.phone,
      balance: initialDebtVal
    };
    
    try {
      // Add to local DB
      const customerId = await db.customers.add(customerData);
      
      // If there is an initial debt, record it in debts log table
      if (initialDebtVal > 0) {
        await db.debts.add({
          customer_id: customerId as number,
          amount: initialDebtVal,
          type: 'purchase',
          created_at: new Date().toISOString(),
          notes: 'رصيد دين سابق عند إضافة وإدخال الزبون لأول مرة'
        });
      }
      
      setShowAddCustomer(false);
      resetForm();
      setSelectedCustomer(customerId as number);
      // Re-trigger cart preview if it was closed
      setIsCartExpanded(true);
      showNotification('تم إضافة الزبون بنجاح');
    } catch (err) {
      console.error("Failed to add customer:", err);
      showNotification('خطأ في إضافة الزبون', 'error');
    }
  };

  const handleBarcodeScan = (code: string, playBeep?: () => void) => {
    if (confirmAction) {
      return; // Ignore any background camera scans while a dialog is active
    }
    if (scannerMode === 'add-product') {
      playBeep?.();
      if ((window as any).onBarcodeScanned) {
        (window as any).onBarcodeScanned(code);
      }
      showNotification(`تم قراءة الباركود: ${code}`);
    } else if (scannerMode === 'edit-product') {
      playBeep?.();
      if ((window as any).onBarcodeScanned) {
        (window as any).onBarcodeScanned(code);
      }
      showNotification(`تم تسجيل الباركود: ${code}`);
    } else if (scannerMode === 'pos') {
      const trimmedCode = code.trim();
      const product = products.find(p => p.barcode && p.barcode.trim() === trimmedCode);
      if (product) {
        if (product.stock_quantity <= 0) {
          playBeep?.();
          setIsScannerOpen(false); // Close the scanner to stop background feed and focus user guidance
          showNotification(`تنبيه: المنتج "${product.name}" غير متوفر في المخزون`, 'error');
          setScannedProductInfo(product);
          setConfirmAction({
            title: 'تعبئة المخزون تلقائياً؟',
            message: `المنتج "${product.name}" غير متوفر حالياً في المخزون. هل ترغب في إضافة 5 قطع للمخزون وإدخاله في سلة المشتريات تلقائياً؟`,
            onConfirm: async () => {
              try {
                await db.products.update(product.id!, { stock_quantity: 5 });
                const updated = await db.products.get(product.id!);
                if (updated) {
                  setScannedProductInfo(updated);
                  addToCart(updated);
                  showNotification(`تم زيادة مخزون "${updated.name}" بـ 5 قطع وإضافته للسلة بنجاح!`, 'success');
                }
              } catch (err) {
                console.error("Failed auto stock addition via scanner dialog:", err);
                showNotification('خطأ في معالجة الإضافة التلقائية للمخزون', 'error');
              }
              setConfirmAction(null);
            }
          });
        } else {
          // التحقق مما إذا كان المنتج مضافاً مسبقاً في السلة لتجنب تكرار الإضافة التلقائية للكمية
          const isAlreadyInCart = cart.some(item => item.product_id === product.id);
          if (isAlreadyInCart) {
            setScannedProductInfo(product);
            showNotification(
              `المنتج "${product.name}" موجود ومضاف مسبقاً للسلة`,
              'success',
              {
                label: 'تكرار الكمية +1 🔁',
                onClick: () => {
                  setConfirmAction({
                    title: 'تأكيد تكرار الكمية',
                    message: `هل أنت متأكد من رغبتك في زيادة كمية "${product.name}" بمقدار 1 قطعة إضافية؟`,
                    onConfirm: () => {
                      setCart(prevCart => {
                        const existing = prevCart.find(item => item.product_id === product.id);
                        if (existing) {
                          if (existing.quantity + 1 > product.stock_quantity) {
                            showNotification('لا يمكن إضافة كمية أكبر من المتوفر في المخزون', 'error');
                            return prevCart;
                          }
                          return prevCart.map(item =>
                            item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                          );
                        }
                        return prevCart;
                      });
                      setConfirmAction(null);
                      showNotification(`تم زيادة كمية "${product.name}" بمقدار 1 بنجاح`, 'success');
                    }
                  });
                }
              }
            );
          } else {
            playBeep?.();
            addToCart(product);
            setScannedProductInfo(product);
            showNotification(`تمت إضافة "${product.name}" إلى السلة`);
          }
        }
      } else {
        playBeep?.();
        setIsScannerOpen(false); // Close the scanner to stop background feed and focus product creation
        
        showNotification(`الرمز ${code} غير مرتبط بأي منتج`, 'error');
        setConfirmAction({
          title: 'منتج غير مسجل',
          message: `لم يتم العثور على الباركود (${code}) في المخزون. هل ترغب في تسجيل صنف جديد بهذا الباركود الآن؟`,
          onConfirm: () => {
            setConfirmAction(null);
            setScannerMode('add-product');
                        setShowAddProduct(true);
            setActiveTab('inventory');
          },
          onCancel: () => {
            if (scannerMode === 'pos') {
              setIsScannerOpen(true);
            }
          }
        });
      }
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    if (product.stock_quantity <= 0) {
      showNotification('عذراً، هذا المنتج غير متوفر في المخزون', 'error');
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity + quantity > product.stock_quantity) {
          showNotification('لا يمكن إضافة كمية أكبر من المتوفر في المخزون', 'error');
          return prevCart;
        }
        return prevCart.map(item => 
          item.product_id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        if (quantity > product.stock_quantity) {
          showNotification('لا يمكن إضافة كمية أكبر من المتوفر في المخزون', 'error');
          return prevCart;
        }
        return [...prevCart, { product_id: product.id, name: product.name, price: product.sale_price, quantity: quantity, base_quantity: quantity, max_stock: product.stock_quantity, unit: product.unit }];
      }
    });
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.max_stock) {
          showNotification('لا يمكن تجاوز الكمية المتوفرة', 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const generateCartHTML = () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const dateStr = formatDateTimeWithDay(new Date());
    let customerStr = '';
    if (selectedCustomer) {
      const cust = customers.find(c => c.id === selectedCustomer);
      if (cust) customerStr = `<div style="margin-bottom: 10px; font-size: 12px;"><strong>الزبون:</strong> ${cust.name}</div>`;
    }

    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; color: #000; width: 100%; max-width: 400px; margin: 0 auto; background: #fff;">
        <div style="text-align: center; border-bottom: 2px dashed #000; margin-bottom: 15px; padding-bottom: 10px;">
          <h2 style="margin: 0 0 5px 0;">${storeName}</h2>
          <div style="font-size: 12px; margin-bottom: 5px; font-weight: bold;">فاتورة مبدئية / سلة مشتريات</div>
          <div style="font-size: 11px;">تاريخ: ${dateStr}</div>
        </div>
        ${customerStr}
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="padding: 5px 0; text-align: right;">الصنف</th>
              <th style="padding: 5px 0; text-align: center;">الكمية</th>
              <th style="padding: 5px 0; text-align: left;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(item => `
              <tr>
                <td style="padding: 5px 0; text-align: right;">${item.name}</td>
                <td style="padding: 5px 0; text-align: center; font-family: monospace;">${item.quantity}</td>
                <td style="padding: 5px 0; text-align: left; font-family: monospace;">${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="border-top: 2px dashed #000; margin-top: 15px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
          <span>الإجمالي:</span>
          <span style="font-family: monospace;">${formatPrice(total)}</span>
        </div>
      </div>
    `;
  };

  const handlePrintCart = () => {
    if (cart.length === 0) return showNotification('السلة فارغة', 'error');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة السلة - ${storeName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${generateCartHTML()}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadCartPDF = () => {
    if (cart.length === 0) return showNotification('السلة فارغة', 'error');
    const element = document.createElement('div');
    element.innerHTML = generateCartHTML();
    
    const opt = {
      margin: 5,
      filename: `cart_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
    };
    
    html2pdf().set(opt as any).from(element).save();
  };

  const handleCheckout = async () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const saleData = {
      customer_id: selectedCustomer,
      items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity, price: item.price })),
      payment_type: paymentType,
      total_amount: total
    };

    try {
      await db.transaction('rw', [db.sales, db.saleItems, db.products, db.inventoryLogs, db.customers, db.debts, db.suppliers], async () => {
        const saleId = await db.sales.add({
          customer_id: selectedCustomer,
          total_amount: total,
          payment_type: paymentType,
          created_at: new Date().toISOString(),
          notes: saleNotes
        });

        for (const item of cart) {
          await db.saleItems.add({
            sale_id: saleId as number,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_sale: item.price
          });

          const product = await db.products.get(item.product_id);
          if (product) {
            await db.products.update(item.product_id, {
              stock_quantity: product.stock_quantity - item.quantity
            });
            await db.inventoryLogs.add({
              product_id: item.product_id,
              change_amount: -item.quantity,
              reason: 'sale',
              created_at: new Date().toISOString()
            });

            // Update supplier balance if product has a supplier
            if (product.supplier_id) {
              const supplier = await db.suppliers.get(product.supplier_id);
              if (supplier) {
                await db.suppliers.update(product.supplier_id, {
                  balance: supplier.balance + (product.cost_price * item.quantity)
                });
              }
            }
          }
        }

        if (paymentType === 'debt' && selectedCustomer) {
          const customer = await db.customers.get(selectedCustomer);
          if (customer) {
            await db.customers.update(selectedCustomer, {
              balance: customer.balance + total
            });
            await db.debts.add({
              customer_id: selectedCustomer,
              sale_id: saleId as number,
              amount: total,
              type: 'purchase',
              created_at: new Date().toISOString()
            });
          }
        }
      });
      showNotification('تمت العملية بنجاح');
    } catch (err) {
      console.error("Failed to checkout:", err);
      showNotification('خطأ في إتمام العملية', 'error');
    }

    setCart([]);
    setSelectedCustomer(null);
    setPaymentType('cash');
    setSaleNotes('');
  };

  const requestGlobalCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        showNotification('تم منح صلاحية الكاميرا بنجاح!');
      }
    } catch (err: any) {
      console.error("Camera permission error:", err);
      if (err.name === 'NotAllowedError') {
        showNotification('تم رفض الصلاحية مسبقاً. للحل: اذهب لإعدادات الهاتف -> التطبيقات -> تطبيقك (أو المتصفح) -> الأذونات، وفعل الكاميرا.', 'error');
      } else {
        showNotification('تعذر الوصول للكاميرا أو الجهاز لا يدعم ذلك.', 'error');
      }
    }
  };

  // --- Beautiful Activation Lock Screen ---
  if (!isActivated && !isInTrial) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans relative overflow-hidden" dir="rtl">
        {/* Ambient Decorative Gradients */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-5">
          {/* Logo & Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <Lock className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{storeName || 'نظام المبيعات الذكي'}</h1>
            <p className="text-xs text-slate-400 font-bold">نظام نقاط البيع وإدارة المخازن المتكامل</p>
          </div>

          {/* Expired Notification */}
          <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-4 flex gap-3 text-right">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-rose-400">انتهت الفترة التجريبية المجانية</h4>
              <p className="text-xs text-rose-200/80 leading-relaxed font-bold">
                لقد انتهت فترة الـ 7 أيام التجريبية الممنوحة لجهازك. يرجى تفعيل البرنامج للمتابعة والوصول إلى بياناتك بأمان.
              </p>
            </div>
          </div>

          {/* Device ID Card */}
          <div className="bg-slate-950 border border-slate-800/60 rounded-2xl p-4 space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">معرّف الجهاز الفريد (Device ID)</p>
            <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800/50">
              <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wider select-all">{deviceID}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(deviceID);
                  showNotification('تم نسخ معرف الجهاز بنجاح!');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700/60 rounded-lg transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ</span>
              </button>
            </div>
          </div>

          {/* Request Status Checker & Forms */}
          {cloudRequest ? (
            <div className="space-y-4">
              {cloudRequest.status === 'pending' && (
                <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-4 space-y-3 text-right">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <h4 className="text-sm font-black text-amber-400">طلبك معلق وقيد المراجعة ⏳</h4>
                  </div>
                  <div className="text-xs text-amber-200/80 space-y-1 font-bold leading-normal">
                    <p>• تم إرسال طلب التفعيل لاسم المتجر: <span className="text-white font-extrabold">{cloudRequest.storeName}</span></p>
                    <p>• حالة الطلب الآن: بانتظار موافقة مالك البرنامج وتفعيل جهازك.</p>
                    <p className="text-amber-400/90 text-[11px] mt-2 bg-amber-950/60 p-2 rounded-xl border border-amber-900/30">
                      💡 عندما يقوم مالك البرنامج بالموافقة على طلبك من لوحة التحكم السحابية الخاصة به، سيتم تفعيل جهازك وفتح البرنامج تلقائياً بالكامل في نفس اللحظة! لا داعي لإغلاق هذه الصفحة.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteCloudRequest(deviceID)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700/50 cursor-pointer"
                  >
                    إلغاء الطلب الحالي أو تعديله 🗑️
                  </button>
                </div>
              )}

              {cloudRequest.status === 'rejected' && (
                <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-4 space-y-3 text-right">
                  <div className="flex items-center gap-2 text-rose-400 border-b border-rose-900/30 pb-2">
                    <X className="w-5 h-5 animate-pulse" />
                    <h4 className="text-sm font-black">تم إلغاء أو تجميد ترخيص جهازك 🔒</h4>
                  </div>
                  {cloudRequest.rejectReason ? (
                    <div className="space-y-1 bg-rose-950/80 border border-rose-900/40 p-3 rounded-xl">
                      <p className="text-[10px] text-rose-400 font-black">السبب المذكور من الإدارة:</p>
                      <p className="text-xs text-rose-200 leading-relaxed font-bold">⚠️ {cloudRequest.rejectReason}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-200/80 leading-relaxed font-bold">
                      للأسف، تم تجميد أو إلغاء تفعيل هذا الترخيص من قبل إدارة البرنامج سحابياً. يرجى مراجعة المسؤول أو تجديد اشتراكك للوصول الآمن لبياناتك.
                    </p>
                  )}
                  <p className="text-[10px] text-rose-300 font-medium">إذا قمت بحل المشكلة مع الإدارة، يمكنك إعادة التقديم أدناه.</p>
                  <button 
                    onClick={() => handleDeleteCloudRequest(deviceID)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/15 cursor-pointer"
                  >
                    إعادة تقديم طلب تفعيل جديد 📡
                  </button>
                </div>
              )}

              {cloudRequest.status === 'approved' && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-2xl p-4 space-y-3 text-right">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 animate-bounce" />
                    <h4 className="text-sm font-black">تهانينا! تمت الموافقة بنجاح 🎉</h4>
                  </div>
                  <p className="text-xs text-emerald-200/80 leading-relaxed font-bold">
                    تم إصدار ترخيص معتمد لجهازك سحابياً. يقوم النظام الآن بفتح وتنشيط البرنامج تلقائياً...
                  </p>
                  <div className="p-2.5 bg-slate-950 rounded-xl font-mono text-center text-[11px] text-emerald-400 border border-emerald-900/40">
                    {cloudRequest.licenseKey}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cloud request form is shown directly, completely hiding the manual entry option for security */}
              <div className="space-y-3 text-right">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">اسم المتجر / النشاط التجاري:</label>
                  <input 
                    type="text"
                    value={clientStoreName}
                    onChange={(e) => setClientStoreName(e.target.value)}
                    placeholder="مثال: سوبرماركت الوفاء"
                    className="w-full p-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:border-emerald-500 outline-none text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">رقم الهاتف (للتواصل):</label>
                  <input 
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="مثال: 777xxxxxx"
                    className="w-full p-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:border-emerald-500 outline-none text-sm font-mono transition-all text-left"
                  />
                </div>

                <button 
                  disabled={isSubmittingRequest}
                  onClick={handleRequestCloudActivation}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-55 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmittingRequest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال طلب التفعيل...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      <span>إرسال طلب التفعيل السحابي 📡</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Instructions / Contact Footer */}
          <div className="pt-2 border-t border-slate-800/60 text-center space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
              للاستفسار السريع أو الشراء المباشر لنسخة مرخصة، يرجى النقر للاتصال بمالك البرنامج أو مطوره عبر الواتساب:
            </p>
            <div className="flex gap-2 justify-center">
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`أهلاً، أود الحصول على ترخيص معتمد لبرنامج المبيعات لجهازي ذو الرقم الفريد: ${deviceID}`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-650 hover:bg-emerald-600 rounded-xl text-white text-xs font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>طلب التفعيل الفوري (واتساب) 💬</span>
              </a>
            </div>
          </div>

          {/* Admin / Owner Portal Bypass */}
          <div className="pt-2.5 border-t border-slate-800/40 text-center">
            {showAdminLogin ? (
              <div className="bg-slate-950/80 p-4 border border-slate-800/60 rounded-2xl space-y-3 mt-1 text-right">
                <label className="text-xs font-bold text-slate-300 block">كود منفذ المعايرة والتشخيص الذاتي (Port Sync Code):</label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={developerPinInput}
                    onChange={(e) => {
                      setDeveloperPinInput(e.target.value);
                      setDeveloperPinError('');
                    }}
                    placeholder="أدخل رمز الاستجابة للنبضة (Sync Pulse Code)..."
                    className="flex-1 p-2 bg-slate-900 text-white font-mono placeholder-slate-600 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-center text-xs"
                  />
                  <button 
                    onClick={handleVerifyDeveloperPIN}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    مزامنة ⚙️
                  </button>
                </div>
                {developerPinError && (
                  <p className="text-[10px] text-amber-500/90 font-bold leading-relaxed">{developerPinError}</p>
                )}
                <button 
                  onClick={() => {
                    setShowAdminLogin(false);
                    setDeveloperPinError('');
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 block mx-auto mt-1"
                >
                  إغلاق منفذ التشخيص
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="text-[11px] text-slate-500 hover:text-slate-400 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <span>⚙️ تهيئة واجهة معايرة الاتصال (Diag Port)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Overlay and Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl border-l border-slate-100 flex flex-col"
            >
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{storeName}</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
          {/* المجموعة الأولى: التحليلات والمتابعة */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-450 mr-2 mb-1.5">الرئيسية والتحليل</p>
            <SidebarButton 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
              icon={<LayoutDashboard />} 
              label="الرئيسية" 
            />
            <SidebarButton 
              active={activeTab === 'analytics'} 
              onClick={() => {
                verifyAdminPermission('analytics', () => {
                  setActiveTab('analytics');
                  setIsSidebarOpen(false);
                }, '📊 صلاحية التقارير والتحليلات');
              }} 
              icon={<BarChart3 />} 
              label="التحليل البصري الذكي Power BI" 
              badge="تقارير"
              badgeColor="emerald"
            />
          </div>

          {/* المجموعة الثانية: الكاونتر والمبيعات */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-450 mr-2 mb-1.5">العمليات والبيع</p>
            <SidebarButton 
              active={activeTab === 'pos'} 
              onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }} 
              icon={<ShoppingCart />} 
              label="نقطة البيع (الكاشير)" 
              badge={cart.length > 0 ? `${cart.reduce((sum, item) => sum + (item.cartQty || 1), 0)} قطع` : undefined}
              badgeColor="amber"
            />
            <SidebarButton 
              active={activeTab === 'history'} 
              onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} 
              icon={<TrendingUp />} 
              label="سجل المبيعات اليومية" 
            />
          </div>

          {/* المجموعة الثالثة: قواعد البيانات والسلع */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-455 mr-2 mb-1.5">إحصاءات السلع والحلفاء</p>
            <SidebarButton 
              active={activeTab === 'products'} 
              onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }} 
              icon={<Package />} 
              label="إدارة المخزون" 
              badge={summary.lowStock > 0 ? `${summary.lowStock} تنبيه` : undefined}
              badgeColor="red"
            />
            <SidebarButton 
              active={activeTab === 'customers'} 
              onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }} 
              icon={<Users />} 
              label="الزبائن والديون" 
              badge={customers.filter(c => c.balance > 0).length > 0 ? `${customers.filter(c => c.balance > 0).length} مدين` : undefined}
              badgeColor="red"
            />
            <SidebarButton 
              active={activeTab === 'suppliers'} 
              onClick={() => { setActiveTab('suppliers'); setIsSidebarOpen(false); }} 
              icon={<Briefcase />} 
              label="الموردين والتسويات" 
              badge={suppliers.length > 0 ? `${suppliers.length} مورد` : undefined}
              badgeColor="violet"
            />
          </div>

          {/* المجموعة الرابعة: المحاسبة الذكية والمهام */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-450 mr-2 mb-1.5">الإدارة المالية والذكاء</p>
            <SidebarButton 
              active={activeTab === 'notes'} 
              onClick={() => { setActiveTab('notes'); setIsSidebarOpen(false); }} 
              icon={<BookOpen />} 
              label="تصفية الصندوق والملاحظات" 
              badge={notes.filter(n => !n.is_completed).length > 0 ? `${notes.filter(n => !n.is_completed).length} مهام` : undefined}
              badgeColor="amber"
            />
            <SidebarButton 
              active={activeTab === 'smart-import'} 
              onClick={() => {
                verifyAdminPermission('smart_import', () => {
                  setActiveTab('smart-import');
                  setIsSidebarOpen(false);
                }, '✨ صلاحية الاستيراد الذكي (AI)');
              }} 
              icon={<Sparkles className="animate-pulse text-violet-500" />} 
              label="الاستيراد الذكي (AI) ✨" 
              badge="محاسب ذكي"
              badgeColor="violet"
            />
          </div>

        </nav>

        <div className="p-3 border-t border-slate-150/40 bg-slate-50/40 rounded-b-3xl">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase mb-2 pr-1">النظام وأمان البيانات</p>
          
          <div className="grid grid-cols-2 gap-1.5">
            {/* زر الإعدادات العامة */}
            <button 
              onClick={() => {
                verifyAdminPermission('settings', () => {
                  setActiveTab('settings');
                  setIsSidebarOpen(false);
                }, '⚙️ صلاحية إعدادات النظام');
              }}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-right cursor-pointer group ${
                activeTab === 'settings' 
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60 hover:border-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all shrink-0 ${
                activeTab === 'settings' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
              }`}>
                <Settings className={`w-3.5 h-3.5 ${activeTab === 'settings' ? 'rotate-45' : 'group-hover:rotate-45 transition-transform duration-350'}`} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black block truncate leading-tight">الإعدادات</span>
              </div>
            </button>

            {/* زر نسخة احتياطية */}
            <button 
              onClick={exportData} 
              className="flex items-center gap-2 p-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 rounded-xl transition-all text-right cursor-pointer group"
            >
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-all shrink-0">
                <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-slate-700 block truncate leading-tight">النسخ الاحتياطي</span>
              </div>
            </button>
          </div>
          
          {deferredPrompt && (
            <button onClick={handleInstall} className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all mt-2 cursor-pointer">
              <Download className="w-3 h-3" />
              <span className="text-[9px] font-black">تثبيت التطبيق السريع</span>
            </button>
          )}
          
          <div className="mt-2 p-1.5 bg-slate-100/50 border border-slate-200/20 rounded-lg flex items-center justify-center gap-1">
            <AlertCircle className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <p className="text-[8px] text-slate-400 font-medium leading-none text-center">
              يمكن تثبيت التطبيق يدوياً من قائمة المتصفح.
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  )}
</AnimatePresence>

      {/* لوحة الأقسام التفصيلية الجانبية المرنة */}
      <AnimatePresence>
        {isCategorySidebarOpen && (
          <>
            {/* الخلفية المظلمة */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategorySidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
            />

            {/* ورقة الأقسام الجانبية */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-80 sm:w-85 bg-slate-50 z-[90] shadow-2xl border-l border-slate-100 flex flex-col text-right"
            >
              {/* هيدر اللوحة */}
              <div className="p-5 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-sm">
                    <Package className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-800">أقسام وتصنيفات المتجر</h3>
                    <p className="text-[10px] text-slate-400 font-bold">جميع أقسام السلع النشطة مع الإحصائيات</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCategorySidebarOpen(false)} 
                  className="p-1.5 hover:bg-slate-100 hover:text-rose-500 text-slate-400 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* محتوى الأقسام المرتب احترافياً */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                
                {/* ملخص إحصاءات الأقسام */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ملخص البيانات والرفوف</p>
                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">إجمالي السلع</p>
                      <p className="text-sm font-black text-slate-700">{products.length}</p>
                    </div>
                    <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold">عدد الأقسام</p>
                      <p className="text-sm font-black text-slate-700">{categories.length - 1}</p>
                    </div>
                  </div>
                </div>

                {/* قائمة الأقسام مع البحث السريع والتصفية والفلترة الفورية */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 mr-1.5">اختر القسم لفلترة النتائج فوراً:</p>
                  
                  <div className="space-y-2.5">
                    {categories.map((cat, idx) => {
                      const itemsCount = categoryCounts[cat] || 0;
                      const isSelected = (activeTab === 'pos' && selectedCategory === cat) || (activeTab === 'products' && inventoryCategory === cat);
                      
                      return (
                        <motion.button
                          whileHover={{ x: -2 }}
                          key={`drawer-cat-${cat}-${idx}`}
                          onClick={() => {
                            if (activeTab === 'pos') {
                              setSelectedCategory(cat);
                            } else {
                              setInventoryCategory(cat);
                            }
                            setIsCategorySidebarOpen(false);
                            showNotification(`تصفية المنتجات حسب قسم "${cat}"`, 'success');
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-205 cursor-pointer border ${
                            isSelected 
                              ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-500/10 font-bold' 
                              : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {categoryIcons[cat] || <Package className="w-3.5 h-3.5" />}
                            </span>
                            <span className="text-xs font-bold">{cat}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.55">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {itemsCount} قطعة
                            </span>
                            <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${
                              isSelected ? 'text-white' : 'text-slate-300'
                            }`} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ذيل ورقة الأقسام الجانبية */}
              <div className="p-4 bg-white border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  يمكنك إضافة أقسام جديدة ببساطة عن طريق كتابة اسم القسم المطلوب في مربع "تصنيف السلعة" عند إضافتها أو تعديلها.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-emerald-700">{storeName}</h1>
            {isBackupSyncing && (
              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
                تحديث...
              </span>
            )}
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-emerald-600 w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-10">
        {false ? null : (
          <>
            {/* 1. Free Trial Banner */}
            {!isActivated && isInTrial && (
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm text-right">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-amber-800">أنت تستخدم النسخة التجريبية المجانية ⏳</p>
                    <p className="text-[10px] text-amber-700 font-bold">متبقي لديك {trialDaysLeft} أيام تجريبية مجانية للبرنامج على هذا الجهاز.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('settings');
                    showNotification('يرجى إدخال مفتاح التفعيل في كرت الاشتراك بالأسفل');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-600/10"
                >
                  تفعيل البرنامج الآن
                </button>
              </div>
            )}

            {/* 2. Expiring Subscription Banner */}
            {isActivated && activationDaysLeft !== null && activationDaysLeft <= 7 && (
              <div className="mb-6 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm text-right animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-rose-800">تنبيه: اقترب انتهاء صلاحية تفعيل النظام ⚠️</p>
                    <p className="text-[10px] text-rose-700 font-bold">متبقي لديك {activationDaysLeft} أيام فقط على انتهاء التفعيل الحالي.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('settings');
                    showNotification('يرجى إدخال مفتاح التفعيل الجديد لتجديد اشتراككم');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md shadow-rose-600/10"
                >
                  تجديد التفعيل الآن
                </button>
              </div>
            )}
          </>
        )}

        {deferredPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-emerald-600 p-4 rounded-3xl text-white flex items-center justify-between shadow-lg shadow-emerald-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">تثبيت التطبيق</p>
                <p className="text-xs opacity-90">احصل على وصول أسرع من شاشتك الرئيسية</p>
              </div>
            </div>
            <Button onClick={handleInstall} className="bg-white text-emerald-700 hover:bg-emerald-50">تثبيت</Button>
          </motion.div>
        )}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'dashboard' ? 1 : 0, y: activeTab === 'dashboard' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'dashboard' ? 'block' : 'hidden'}
          >
            <DashboardView
              summary={summary}
              formatPrice={formatPrice}
              setActiveTab={setActiveTab}
              setScannerMode={setScannerMode}
              setIsScannerOpen={setIsScannerOpen}
              exportData={exportData}
              verifyAdminPermission={verifyAdminPermission}
              setSalesDetailsTab={setSalesDetailsTab}
              setShowMonthlySalesDetailsModal={setShowMonthlySalesDetailsModal}
              setShowSalesSummaryModal={setShowSalesSummaryModal}
              setShowProfitSummaryModal={setShowProfitSummaryModal}
              setShowInventoryDetailsModal={setShowInventoryDetailsModal}
              setShowSupplierSummaryModal={setShowSupplierSummaryModal}
              trendMode={trendMode}
              setTrendMode={setTrendMode}
              dailySales={dailySales}
              monthlySalesTrend={monthlySalesTrend}
              yearlySalesTrend={yearlySalesTrend}
              topProducts={topProducts}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'pos' ? 1 : 0, y: activeTab === 'pos' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'pos' ? 'block' : 'hidden'}
          >
            <PosView
              setActiveTab={setActiveTab}
              setScannerMode={setScannerMode}
              setIsScannerOpen={setIsScannerOpen}
              scannedProductInfo={scannedProductInfo}
              setScannedProductInfo={setScannedProductInfo}
              formatPrice={formatPrice}
              addToCart={addToCart}
              showNotification={showNotification}
              categories={categories}
              categoryCounts={categoryCounts}
              categoryIcons={categoryIcons}
              setIsCategorySidebarOpen={setIsCategorySidebarOpen}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              products={products}
              fetchProductHistory={fetchProductHistory}
              cart={cart}
              setCart={setCart}
              isCartExpanded={isCartExpanded}
              setIsCartExpanded={setIsCartExpanded}
              handlePrintCart={handlePrintCart}
              handleDownloadCartPDF={handleDownloadCartPDF}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              customers={customers}
              setShowAddCustomer={setShowAddCustomer}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              saleNotes={saleNotes}
              setSaleNotes={setSaleNotes}
              removeFromCart={removeFromCart}
              handleCheckout={handleCheckout}
              db={db}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'products' ? 1 : 0, y: activeTab === 'products' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'products' ? 'block' : 'hidden'}
          >
            <ProductsView
              setActiveTab={setActiveTab}
              handleDownloadInventoryPDF={handleDownloadInventoryPDF}
              setScannerMode={setScannerMode}
              setShowAddProduct={setShowAddProduct}
              categories={categories}
              categoryCounts={categoryCounts}
              categoryIcons={categoryIcons}
              setIsCategorySidebarOpen={setIsCategorySidebarOpen}
              inventoryCategory={inventoryCategory}
              setInventoryCategory={setInventoryCategory}
              products={products}
              fetchProductHistory={fetchProductHistory}
              formatPrice={formatPrice}
              setUpdatingStockProduct={setUpdatingStockProduct}
              verifyAdminPermission={verifyAdminPermission}
              setEditingProduct={setEditingProduct}
              handleDeleteProduct={handleDeleteProduct}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'customers' ? 1 : 0, y: activeTab === 'customers' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'customers' ? 'block' : 'hidden'}
          >
            <CustomersView
              setActiveTab={setActiveTab}
              setShowAddCustomer={setShowAddCustomer}
              customers={customers}
              fetchCustomerHistory={fetchCustomerHistory}
              formatPrice={formatPrice}
              setShowPaymentModal={setShowPaymentModal}
              handleDeleteCustomer={handleDeleteCustomer}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'notes' ? 1 : 0, y: activeTab === 'notes' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'notes' ? 'block' : 'hidden'}
          >
            <NotesView
              setActiveTab={setActiveTab}
              setEditingNoteId={setEditingNoteId}
              setShowAddNote={setShowAddNote}
              notes={notes}
              noteFilter={noteFilter}
              setNoteFilter={setNoteFilter}
              setSelectedNote={setSelectedNote}
              handleToggleNoteCompletion={handleToggleNoteCompletion}
              handleEditNoteAction={handleEditNoteAction}
              handleDeleteNote={handleDeleteNote}
              formatDateWithDay={formatDateWithDay}
              verifyAdminPermission={verifyAdminPermission}
              setShowWithdrawModal={setShowWithdrawModal}
              currentCycleWithdrawalsTotal={currentCycleWithdrawalsTotal}
              currentCycleUnpaidWithdrawalsTotal={currentCycleUnpaidWithdrawalsTotal}
              currentCycleWithdrawals={currentCycleWithdrawals}
              formatPrice={formatPrice}
              formatDateTimeWithDay={formatDateTimeWithDay}
              handleRepayWithdrawal={handleRepayWithdrawal}
              handleDeleteWithdrawal={handleDeleteWithdrawal}
              lastSettleDate={lastSettleDate}
              setShowSettleModal={setShowSettleModal}
              activeOutstandingCash={activeOutstandingCash}
              currentCycleCashTotal={currentCycleCashTotal}
              currentCycleCashSales={currentCycleCashSales}
              currentCycleDebtPaymentsTotal={currentCycleDebtPaymentsTotal}
              carriedForwardDeficit={carriedForwardDeficit}
              currentCycleSupplierPaymentsTotal={currentCycleSupplierPaymentsTotal}
              currentCycleDebtTotal={currentCycleDebtTotal}
              salesSettlements={salesSettlements}
              handleDeleteSettlement={handleDeleteSettlement}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'suppliers' ? 1 : 0, y: activeTab === 'suppliers' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'suppliers' ? 'block' : 'hidden'}
          >
            <SuppliersView
              setActiveTab={setActiveTab}
              setShowAddSupplier={setShowAddSupplier}
              suppliers={suppliers}
              fetchSupplierHistory={fetchSupplierHistory}
              formatPrice={formatPrice}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'smart-import' ? 1 : 0, y: activeTab === 'smart-import' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'smart-import' ? 'block' : 'hidden'}
          >
            <div className="space-y-6">
              <SmartImport 
                storeName={storeName}
                onGoBack={() => setActiveTab('dashboard')}
                onImported={() => {
                  setTimeout(() => {
                    exportData();
                  }, 800);
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'settings' ? 1 : 0, y: activeTab === 'settings' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'settings' ? 'block' : 'hidden'}
          >
            <SettingsView
              isAutoBackupEnabled={isAutoBackupEnabled}
              setIsAutoBackupEnabled={setIsAutoBackupEnabled}
              setActiveTab={setActiveTab}
              storeName={storeName}
              setStoreName={setStoreName}
              updateStoreName={updateStoreName}
              currency={currency}
              updateCurrency={updateCurrency}
              roundingFactor={roundingFactor}
              updateRoundingFactor={updateRoundingFactor}
              permissionsEnabled={permissionsEnabled}
              verifyAdminPermission={verifyAdminPermission}
              setShowPermissionsConfigModal={setShowPermissionsConfigModal}
              exportData={exportData}
              handleImportPython={handleImportPython}
              importData={importData}
              isBackupSyncing={isBackupSyncing}
              autoBackupFileStatus={autoBackupFileStatus}
              forceLocalDiskBackup={forceLocalDiskBackup}
              resetDatabase={resetDatabase}
              deferredPrompt={deferredPrompt}
              handleInstall={handleInstall}
              requestGlobalCameraPermission={requestGlobalCameraPermission}
              setDevClickCount={setDevClickCount}
              setShowHiddenAdminInput={setShowHiddenAdminInput}
              showNotification={showNotification}
              deviceID={deviceID}
              isActivated={isActivated}
              trialDaysLeft={trialDaysLeft}
              activationDetails={activationDetails}
              activationKeyInput={activationKeyInput}
              setActivationKeyInput={setActivationKeyInput}
              activationError={activationError}
              setActivationError={setActivationError}
              handleActivateApp={handleActivateApp}
              cloudRequest={cloudRequest}
              handleDeleteCloudRequest={handleDeleteCloudRequest}
              clientStoreName={clientStoreName}
              setClientStoreName={setClientStoreName}
              clientPhone={clientPhone}
              setClientPhone={setClientPhone}
              isSubmittingRequest={isSubmittingRequest}
              handleRequestCloudActivation={handleRequestCloudActivation}
              handleDeactivateApp={handleDeactivateApp}
              showHiddenAdminInput={showHiddenAdminInput}
              isDeveloperMode={isDeveloperMode}
              setIsDeveloperMode={setIsDeveloperMode}
              developerPinInput={developerPinInput}
              setDeveloperPinInput={setDeveloperPinInput}
              developerPinError={developerPinError}
              setDeveloperPinError={setDeveloperPinError}
              handleVerifyDeveloperPIN={handleVerifyDeveloperPIN}
              activeDevTab={activeDevTab}
              setActiveDevTab={setActiveDevTab}
              allCloudRequests={allCloudRequests}
              requestDurations={requestDurations}
              setRequestDurations={setRequestDurations}
              handleRejectCloudRequest={handleRejectCloudRequest}
              handleApproveCloudRequest={handleApproveCloudRequest}
              generatedKeyResult={generatedKeyResult}
              generatorDeviceIDInput={generatorDeviceIDInput}
              setGeneratorDeviceIDInput={setGeneratorDeviceIDInput}
              generatorDuration={generatorDuration}
              setGeneratorDuration={setGeneratorDuration}
              handleGenerateLicense={handleGenerateLicense}
              showPinChangeModal={showPinChangeModal}
              setShowPinChangeModal={setShowPinChangeModal}
              newPinInput={newPinInput}
              setNewPinInput={setNewPinInput}
              confirmNewPinInput={confirmNewPinInput}
              setConfirmNewPinInput={setConfirmNewPinInput}
              pinChangeError={pinChangeError}
              setPinChangeError={setPinChangeError}
              handleChangeDeveloperPIN={handleChangeDeveloperPIN}
              handleResetDeveloperPIN={handleResetDeveloperPIN}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'analytics' ? 1 : 0, y: activeTab === 'analytics' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'analytics' ? 'block' : 'hidden'}
          >
            <SmartAnalytics 
              currency={currency} 
              formatPrice={formatPrice} 
              onGoBack={() => setActiveTab('dashboard')} 
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: activeTab === 'history' ? 1 : 0, y: activeTab === 'history' ? 0 : 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={activeTab === 'history' ? 'block' : 'hidden'}
          >
            <HistoryView
              setActiveTab={setActiveTab}
              enrichedSales={enrichedSales}
              historyFilter={historyFilter}
              setHistoryFilter={setHistoryFilter}
              expandedSaleId={expandedSaleId}
              handleExpandSale={handleExpandSale}
              expandedSaleItems={expandedSaleItems}
              printReceipt={printReceipt}
              verifyAdminPermission={verifyAdminPermission}
              handleRefundSale={handleRefundSale}
              formatDateTimeWithDay={formatDateTimeWithDay}
              formatPrice={formatPrice}
            />
          </motion.div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              key="modal-notification"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 left-4 right-4 z-[100] p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-md mx-auto transition-all ${
                notification.type === 'success' 
                  ? 'bg-slate-900 border border-slate-800 text-white' 
                  : 'bg-red-600 text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="text-emerald-400 shrink-0 w-5 h-5" />
                ) : (
                  <AlertCircle className="shrink-0 w-5 h-5 text-white" />
                )}
                <p className="font-bold text-sm leading-relaxed">{notification.message}</p>
              </div>
              {notification.action && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    notification.action?.onClick();
                    setNotification(null);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] self-end sm:self-auto shrink-0 flex items-center gap-1 border border-emerald-400/20 cursor-pointer"
                >
                  {notification.action.label}
                </button>
              )}
            </motion.div>
          )}

          {confirmAction && (
            <div key="modal-confirm" className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-slate-800">{confirmAction.title}</h3>
                <p className="text-slate-500">{confirmAction.message}</p>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" variant="danger" onClick={confirmAction.onConfirm}>تأكيد</Button>
                  <Button className="flex-1" variant="secondary" onClick={() => {
                    if (confirmAction.onCancel) confirmAction.onCancel();
                    setConfirmAction(null);
                  }}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {rejectingDevice && (
            <div key="modal-reject-reason" className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-xs">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl text-right"
                dir="rtl"
              >
                <div className="flex items-center gap-2 justify-start border-b border-slate-100 pb-3">
                  <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">تجميد ترخيص العميل وحظر البرنامج 🔒</h3>
                    <p className="text-[11px] text-slate-400 font-bold">اسم المتجر: {rejectingDevice.storeName}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-500 block">اختر سبب تجميد التفعيل السريع:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'انتهت فترة الاشتراك التجريبي أو السنوي للبرنامج ولم يتم التجديد.',
                      'تم تجميد الترخيص مؤقتاً لعدم سداد المستحقات المالية.',
                      'مخالفة بنود الاستخدام ومحاولة تشغيل الترخيص على جهاز آخر.',
                      'بناءً على طلب مباشر من صاحب المتجر لإيقاف أو نقل الخدمة.',
                    ].map((reason, index) => (
                      <button
                        key={`reject-reason-${index}`}
                        type="button"
                        onClick={() => setRejectReasonText(reason)}
                        className={`p-2.5 text-xs text-right rounded-xl border font-bold transition-all ${
                          rejectReasonText === reason 
                            ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs' 
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/50'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-extrabold text-slate-500 block">أو اكتب نصاً مخصصاً يظهر للعميل:</label>
                    <textarea
                      value={rejectReasonText}
                      onChange={(e) => setRejectReasonText(e.target.value)}
                      placeholder="اكتب هنا سبب إيقاف التفعيل بالتفصيل..."
                      rows={3}
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-rose-300 focus:bg-white font-medium text-slate-700 transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                  <button 
                    onClick={confirmRejectCloudRequest}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/10 cursor-pointer"
                  >
                    تأكيد إلغاء التفعيل وحظر الجهاز 🚫
                  </button>
                  <button 
                    onClick={() => {
                      setRejectingDevice(null);
                      setRejectReasonText('');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    تراجع وإلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showAddProduct && (
            <AddProductModal
              key="modal-add-product"
              showAddProduct={showAddProduct}
              setShowAddProduct={setShowAddProduct}
              scannerMode={scannerMode}
              setScannerMode={setScannerMode}
              setIsScannerOpen={setIsScannerOpen}
              suppliers={suppliers}
              handleAddProduct={handleAddProduct}
              setActiveTab={setActiveTab}
            />
          )}

          {showProductDetails && (
            <div key="modal-product-details" className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-slate-50 w-full max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                <div className="bg-white p-6 border-b border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{showProductDetails.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-slate-500 text-xs bg-slate-100 px-2.5 py-0.5 rounded-lg font-bold">{showProductDetails.category}</span>
                        {showProductDetails.barcode && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100/50 font-mono px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold">
                            <QrCode className="w-3 h-3" />
                            <span>{showProductDetails.barcode}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setShowProductDetails(null)} className="p-2 hover:bg-slate-100 rounded-full">
                      <ChevronLeft className="w-6 h-6 rotate-180 text-slate-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">التكلفة</p>
                      <p className="font-bold text-slate-700">{showProductDetails.cost_price}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">البيع</p>
                      <p className="font-bold text-emerald-700">{showProductDetails.sale_price}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] text-blue-600 font-bold uppercase">المخزون</p>
                      <p className="font-bold text-blue-700">{showProductDetails.stock_quantity}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-slate-50 relative">
                  <div className="sticky top-0 bg-slate-50/95 backdrop-blur-md z-20 px-6 py-4 border-b border-slate-200 shadow-sm flex justify-between items-center">
                    <h4 className="font-black text-slate-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      سجل حركة المخزون بالتفصيل
                    </h4>
                  </div>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3 p-6 pb-2">
                    {/* الوارد الجديد */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <PackagePlus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-600 font-bold mb-0.5">وارد وتزويد جديد</p>
                        <p className="text-lg font-black text-emerald-700 font-mono">
                          {productHistory.reduce((sum, log) => sum + ((log.change_amount > 0 && log.reason !== 'refund') ? log.change_amount : 0), 0)}
                        </p>
                      </div>
                    </div>

                    {/* المرتجعات */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-indigo-600 font-bold mb-0.5">بضاعة مرتجعة</p>
                        <p className="text-lg font-black text-indigo-700 font-mono">
                          {productHistory.reduce((sum, log) => sum + ((log.change_amount > 0 && log.reason === 'refund') ? log.change_amount : 0), 0)}
                        </p>
                      </div>
                    </div>

                    {/* المبيعات */}
                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-rose-600 font-bold mb-0.5">إجمالي المبيعات</p>
                        <p className="text-lg font-black text-rose-700 font-mono">
                          {productHistory.reduce((sum, log) => sum + ((log.change_amount < 0 && log.reason === 'sale') ? Math.abs(log.change_amount) : 0), 0)}
                        </p>
                      </div>
                    </div>

                    {/* التوالف والتسويات */}
                    <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <Minus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-orange-600 font-bold mb-0.5">سحب وتسويات (نقص)</p>
                        <p className="text-lg font-black text-orange-700 font-mono">
                          {productHistory.reduce((sum, log) => sum + ((log.change_amount < 0 && log.reason !== 'sale') ? Math.abs(log.change_amount) : 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="px-6 py-2">
                    <div className="flex bg-slate-200/50 p-1 rounded-xl">
                      <button 
                        onClick={() => setInventoryHistoryFilter('all')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${inventoryHistoryFilter === 'all' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200/50'}`}
                      >الكل</button>
                      <button 
                        onClick={() => setInventoryHistoryFilter('sales')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${inventoryHistoryFilter === 'sales' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200/50'}`}
                      >مبيعات</button>
                      <button 
                        onClick={() => setInventoryHistoryFilter('refunds')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${inventoryHistoryFilter === 'refunds' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200/50'}`}
                      >إرجاع</button>
                      <button 
                        onClick={() => setInventoryHistoryFilter('updates')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${inventoryHistoryFilter === 'updates' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200/50'}`}
                      >تحديثات</button>
                    </div>
                  </div>

                  <div className="p-6 relative pt-2">
                    <div className="absolute top-2 bottom-0 right-10 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />
                    <div className="space-y-6">
                      {productHistory.filter(log => {
                        if (inventoryHistoryFilter === 'all') return true;
                        if (inventoryHistoryFilter === 'sales') return log.reason === 'sale';
                        if (inventoryHistoryFilter === 'refunds') return log.reason === 'refund';
                        if (inventoryHistoryFilter === 'updates') return log.reason === 'manual_update' || log.reason === 'initial_stock' || log.reason === 'new_product';
                        return true;
                      }).length > 0 ? productHistory.filter(log => {
                        if (inventoryHistoryFilter === 'all') return true;
                        if (inventoryHistoryFilter === 'sales') return log.reason === 'sale';
                        if (inventoryHistoryFilter === 'refunds') return log.reason === 'refund';
                        if (inventoryHistoryFilter === 'updates') return log.reason === 'manual_update' || log.reason === 'initial_stock' || log.reason === 'new_product';
                        return true;
                      }).map((log, idx) => (
                        <div key={`product-log-${log.id ?? 'no-id'}-${idx}`} className="relative flex items-start gap-4 group">
                          <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center z-10 shadow-sm border-[3px] border-slate-50 transition-transform group-hover:scale-110
                            ${log.reason === 'sale' ? 'bg-rose-100 text-rose-600' : 
                              log.reason === 'refund' ? 'bg-indigo-100 text-indigo-600' : 
                              log.reason === 'manual_update' ? (log.change_amount > 0 ? 'bg-teal-100 text-teal-600' : 'bg-orange-100 text-orange-600') : 'bg-emerald-100 text-emerald-600'}`}
                          >
                            {log.reason === 'sale' ? <ShoppingCart className="w-5 h-5" /> : 
                             log.reason === 'refund' ? <RotateCcw className="w-5 h-5" /> : 
                             log.reason === 'manual_update' ? (log.change_amount > 0 ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />) : <PackagePlus className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-100/80 hover:border-slate-300 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                  {log.reason === 'sale' ? 'فاتورة مبيعات' : 
                                   log.reason === 'refund' ? 'إرجاع بضاعة' : 
                                   log.reason === 'manual_update' ? (log.change_amount > 0 ? 'تحديث أو إضافة بضاعة' : 'سحب أو تسوية نُقصان') : 'إضافة بضاعة جديدة'}
                                </p>
                                <p className="text-[11px] text-slate-500 font-bold mt-1 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 opacity-70" />
                                  <span dir="ltr">{formatDateTimeWithDay(log.created_at)}</span>
                                </p>
                              </div>
                              <div className={`px-3 py-1.5 rounded-xl text-sm font-black font-mono shadow-sm border ${log.change_amount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                <span className="opacity-70 text-[10px] ml-1.5 font-sans">{log.change_amount > 0 ? 'إضافة' : 'سحب'}</span>
                                <span dir="ltr">{log.change_amount > 0 ? '+' : ''}{log.change_amount}</span>
                              </div>
                            </div>
                            {log.notes && (
                              <div className="mt-3 bg-slate-50/80 p-3 rounded-2xl flex items-start gap-2.5 border border-slate-100">
                                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                                  {log.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 border-dashed">
                          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-bold">لا توجد حركات مسجلة لهذا المنتج بعد.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white border-t border-slate-100">
                  <Button variant="secondary" className="w-full" onClick={() => setShowProductDetails(null)}>إغلاق</Button>
                </div>
              </motion.div>
            </div>
          )}

          {updatingStockProduct && (
            <div key="modal-updating-stock" className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-white w-full max-w-sm rounded-[2rem] p-6 space-y-6 shadow-2xl relative"
                dir="rtl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <RefreshCcw className="w-5 h-5 text-indigo-600" />
                      تحديث المخزون
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-1">{updatingStockProduct.name}</p>
                  </div>
                  <button onClick={() => setUpdatingStockProduct(null)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">المخزون الحالي</p>
                    <p className="text-2xl font-black text-slate-700 font-mono">{updatingStockProduct.stock_quantity}</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="text-center">
                    <p className="text-[10px] text-indigo-400 font-bold mb-1">بعد التحديث</p>
                    <p className={`text-2xl font-black font-mono ${updatingStockType === 'add' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {updatingStockAmount ? (updatingStockProduct.stock_quantity + (updatingStockType === 'add' ? Number(updatingStockAmount) : -Number(updatingStockAmount))) : updatingStockProduct.stock_quantity}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">نوع التحديث</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setUpdatingStockType('add')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${updatingStockType === 'add' ? 'bg-white shadow-sm text-emerald-700 border border-emerald-100' : 'text-slate-500 hover:bg-slate-200/50'}`}
                      >
                        إضافة (+)
                      </button>
                      <button 
                        onClick={() => setUpdatingStockType('subtract')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${updatingStockType === 'subtract' ? 'bg-white shadow-sm text-red-700 border border-red-100' : 'text-slate-500 hover:bg-slate-200/50'}`}
                      >
                        سحب (-)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">الكمية المراد {updatingStockType === 'add' ? 'إضافتها' : 'سحبها'}</label>
                    <input 
                      type="number" 
                      className={`w-full p-4 rounded-xl border-2 bg-slate-50 text-xl font-black font-mono text-center focus:outline-none transition-all ${updatingStockType === 'add' ? 'border-emerald-200 focus:border-emerald-500 text-emerald-700' : 'border-red-200 focus:border-red-500 text-red-700'}`}
                      value={updatingStockAmount}
                      onChange={e => setUpdatingStockAmount(e.target.value)}
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">ملاحظات / سبب التحديث</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none"
                      value={updatingStockNotes}
                      onChange={e => setUpdatingStockNotes(e.target.value)}
                      placeholder={updatingStockType === 'add' ? "مثال: بضاعة جديدة، جرد..." : "مثال: تالف، مفقود، جرد..."}
                    />
                  </div>

                  {updatingStockType === 'subtract' && updatingStockProduct.supplier_id && updatingStockProduct.cost_price > 0 && (
                    <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={updateSupplierBalance} 
                        onChange={(e) => setUpdateSupplierBalance(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-slate-700">خصم التكلفة من حساب المورد (إرجاع أو تصحيح)</span>
                    </label>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 py-4 text-sm shadow-md" onClick={handleUpdateStock}>حفظ التحديث</Button>
                  <Button variant="secondary" className="py-4 px-6 text-sm" onClick={() => setUpdatingStockProduct(null)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {editingProduct && (
            <EditProductModal
              key="modal-edit-product"
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              setScannerMode={setScannerMode}
              setIsScannerOpen={setIsScannerOpen}
              suppliers={suppliers}
              handleEditProduct={handleEditProduct}
            />
          )}

          {showAddSupplier && (
            <AddSupplierModal
              key="modal-add-supplier"
              showAddSupplier={showAddSupplier}
              setShowAddSupplier={setShowAddSupplier}
              handleAddSupplier={handleAddSupplier}
            />
          )}

          {showSupplierDetails && (
            <SupplierDetailsModal
              key="modal-supplier-details"
              showSupplierDetails={showSupplierDetails}
              setShowSupplierDetails={setShowSupplierDetails}
              supplierDetailsTab={supplierDetailsTab}
              setSupplierDetailsTab={setSupplierDetailsTab}
              supplierHistory={supplierHistory}
              formatPrice={formatPrice}
              getProductBadgeStyles={getProductBadgeStyles}
              formatDateWithDay={formatDateWithDay}
              setSelectedSupplierPayment={setSelectedSupplierPayment}
              verifyAdminPermission={verifyAdminPermission}
              setShowSupplierPaymentModal={setShowSupplierPaymentModal}
            />
          )}


          {showSupplierSummaryModal && (
            <SupplierSummaryModal
              key="modal-supplier-summary"
              showSupplierSummaryModal={showSupplierSummaryModal}
              setShowSupplierSummaryModal={setShowSupplierSummaryModal}
              summary={summary}
              suppliers={suppliers}
              enrichedSupplierPayments={enrichedSupplierPayments}
              formatPrice={formatPrice}
              formatDateWithDay={formatDateWithDay}
              fetchSupplierHistory={fetchSupplierHistory}
              setSelectedSupplierPayment={setSelectedSupplierPayment}
            />
          )}

          {showInventoryDetailsModal && (
            <InventoryDetailsModal
              key="modal-inventory-details"
              showInventoryDetailsModal={showInventoryDetailsModal}
              setShowInventoryDetailsModal={setShowInventoryDetailsModal}
              summary={summary}
              selectedCostDetailType={selectedCostDetailType}
              setSelectedCostDetailType={setSelectedCostDetailType}
              costDetailSearchTerm={costDetailSearchTerm}
              setCostDetailSearchTerm={setCostDetailSearchTerm}
              filteredCostDetailsList={filteredCostDetailsList}
              formatPrice={formatPrice}
            />
          )}

          {showSalesSummaryModal && (
            <SalesSummaryModal
              key="modal-sales-summary"
              showSalesSummaryModal={showSalesSummaryModal}
              setShowSalesSummaryModal={setShowSalesSummaryModal}
              summary={summary}
              formatPrice={formatPrice}
            />
          )}

          {showProfitSummaryModal && (
            <ProfitSummaryModal
              key="modal-profit-summary"
              showProfitSummaryModal={showProfitSummaryModal}
              setShowProfitSummaryModal={setShowProfitSummaryModal}
              summary={summary}
              formatPrice={formatPrice}
            />
          )}

          {showMonthlySalesDetailsModal && (
            <MonthlySalesDetailsModal
              key="modal-monthly-sales-details"
              showMonthlySalesDetailsModal={showMonthlySalesDetailsModal}
              setShowMonthlySalesDetailsModal={setShowMonthlySalesDetailsModal}
              salesDetailsStats={salesDetailsStats}
              salesDetailsTab={salesDetailsTab}
              setSalesDetailsTab={setSalesDetailsTab}
              formatPrice={formatPrice}
            />
          )}

          {showSupplierPaymentModal && (
            <SupplierPaymentModal
              key="modal-supplier-payment"
              showSupplierPaymentModal={showSupplierPaymentModal}
              setShowSupplierPaymentModal={setShowSupplierPaymentModal}
              handleSupplierPayment={handleSupplierPayment}
              formatPrice={formatPrice}
            />
          )}

          {selectedSupplierPayment && (
            <SupplierPaymentDetailsModal
              key="modal-supplier-payment-details"
              selectedSupplierPayment={selectedSupplierPayment}
              setSelectedSupplierPayment={setSelectedSupplierPayment}
              formatPrice={formatPrice}
              formatDateTimeWithDay={formatDateTimeWithDay}
            />
          )}

          {showAddNote && (
            <AddNoteModal
              key="modal-add-note"
              showAddNote={showAddNote}
              setShowAddNote={setShowAddNote}
              editingNoteId={editingNoteId}
              setEditingNoteId={setEditingNoteId}
              notes={notes}
              handleAddNote={handleAddNote}
            />
          )}

          {selectedNote && (
            <NoteDetailsModal
              key="modal-note-details"
              selectedNote={selectedNote}
              setSelectedNote={setSelectedNote}
              formatDateWithDay={formatDateWithDay}
              handleCopyNoteContent={handleCopyNoteContent}
              handleToggleNoteCompletion={handleToggleNoteCompletion}
              handleEditNoteAction={handleEditNoteAction}
              handleDeleteNote={handleDeleteNote}
            />
          )}

          {showAddCustomer && (
            <AddCustomerModal
              key="modal-add-customer"
              showAddCustomer={showAddCustomer}
              setShowAddCustomer={setShowAddCustomer}
              handleAddCustomer={handleAddCustomer}
            />
          )}

          {showPaymentModal && (
            <CustomerPaymentModal
              key="modal-customer-payment"
              showPaymentModal={showPaymentModal}
              setShowPaymentModal={setShowPaymentModal}
              handlePayment={handlePayment}
              formatPrice={formatPrice}
              currency={currency}
            />
          )}

          {showCustomerAdjustmentModal && (
            <CustomerAdjustmentModal
              key="modal-customer-adjustment"
              showCustomerAdjustmentModal={showCustomerAdjustmentModal}
              setShowCustomerAdjustmentModal={setShowCustomerAdjustmentModal}
              handleCustomerAdjustmentSubmit={handleCustomerAdjustmentSubmit}
              formatPrice={formatPrice}
              currency={currency}
            />
          )}

          {showSettleModal && (
            <SettleModal
              key="modal-settle"
              showSettleModal={showSettleModal}
              setShowSettleModal={setShowSettleModal}
              currentCycleCashSales={currentCycleCashSales}
              currentCycleDebtPaymentsTotal={currentCycleDebtPaymentsTotal}
              currentCycleDebtTotal={currentCycleDebtTotal}
              carriedForwardDeficit={carriedForwardDeficit}
              currentCycleUnpaidWithdrawalsTotal={currentCycleUnpaidWithdrawalsTotal}
              activeOutstandingCash={activeOutstandingCash}
              currentCycleSupplierPaymentsTotal={currentCycleSupplierPaymentsTotal}
              handleSaveSettlement={handleSaveSettlement}
              formatPrice={formatPrice}
              currency={currency}
            />
          )}

          {showCustomerDetails && (
            <CustomerDetailsModal
              key="modal-customer-details"
              showCustomerDetails={showCustomerDetails}
              setShowCustomerDetails={setShowCustomerDetails}
              customerStats={customerStats}
              ledgerEntries={ledgerEntries}
              printStatement={printStatement}
              handleDownloadPDF={handleDownloadPDF}
              handleShareWhatsApp={handleShareWhatsApp}
              printReceipt={printReceipt}
              formatPrice={formatPrice}
              formatDateTimeWithDay={formatDateTimeWithDay}
              setShowPaymentModal={setShowPaymentModal}
              setShowCustomerAdjustmentModal={setShowCustomerAdjustmentModal}
              storeName={storeName}
              storePhone={storePhone}
              currency={currency}
            />
          )}

          {/* PIN Verification Modal / واجهة التحقق من رمز أمان المدير */}
          {pinModal.isOpen && (
            <PinVerificationModal
              key="modal-pin-verification"
              pinModal={pinModal}
              setPinModal={setPinModal}
              verifyPinMatches={verifyPinMatches}
              adminPin={adminPin}
              updateAdminPin={updateAdminPin}
              updatePermissionsEnabled={updatePermissionsEnabled}
              showNotification={showNotification}
            />
          )}

          {/* Permissions Configuration Modal / واجهة لوحة تهيئة الصلاحيات وإدارة الأمان */}
          {showPermissionsConfigModal && (
            <PermissionsConfigModal
              key="modal-permissions-config"
              showPermissionsConfigModal={showPermissionsConfigModal}
              setShowPermissionsConfigModal={setShowPermissionsConfigModal}
              permissionsEnabled={permissionsEnabled}
              updatePermissionsEnabled={updatePermissionsEnabled}
              protectedActions={protectedActions}
              updateProtectedActions={updateProtectedActions}
              adminPin={adminPin}
              updateAdminPin={updateAdminPin}
              showNotification={showNotification}
            />
          )}

          {showWithdrawModal && (
            <WithdrawModal
              key="modal-withdraw"
              showWithdrawModal={showWithdrawModal}
              setShowWithdrawModal={setShowWithdrawModal}
              handleSaveWithdrawal={handleSaveWithdrawal}
              currency={currency}
            />
          )}

          {isScannerOpen && (
            <BarcodeScanner 
              key="modal-barcode-scanner"
              onScan={handleBarcodeScan}
              onClose={() => setIsScannerOpen(false)}
              title={
                scannerMode === 'pos' ? "قراءة باركود السلعة للمبيعات" : 
                scannerMode === 'add-product' ? "مسح باركود لمنتج جديد" : "تحديث باركود المنتج"
              }
              autoClose={scannerMode !== 'pos'}
              scannerMode={scannerMode}
              cart={cart}
              onUpdateCartQuantity={updateCartQuantity}
              onRemoveFromCart={removeFromCart}
              onCheckout={handleCheckout}
              onPrintCart={handlePrintCart}
              onDownloadCart={handleDownloadCartPDF}
              formatPrice={formatPrice}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              customers={customers}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const SidebarButton = ({ active, onClick, icon, label, badge, badgeColor = 'emerald' }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer text-right group ${
      active 
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 font-bold translate-x-[-1px]' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100/50'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`}>
        {icon}
      </span>
      <span className="text-[11px] sm:text-xs font-bold leading-none">{label}</span>
    </div>
    {badge && (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
        active 
          ? 'bg-white/20 text-white' 
          : badgeColor === 'red' 
            ? 'bg-red-50 text-red-650 border border-red-100' 
            : badgeColor === 'amber'
              ? 'bg-amber-50 text-amber-650 border border-amber-100'
              : badgeColor === 'violet'
                ? 'bg-violet-50 text-violet-650 border border-violet-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
      }`}>
        {badge}
      </span>
    )}
  </button>
);
