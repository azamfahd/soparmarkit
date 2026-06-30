import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { ConnectionStatus } from './components/ConnectionStatus';
import BarcodeScanner from './components/BarcodeScanner';
import SmartAnalytics from './components/SmartAnalytics';
import SmartImport from './components/SmartImport';
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
  CartesianGrid
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
// (Local type definitions removed as they conflict with db.ts imports)

interface Summary {
  totalSales: number;
  totalCostOfSales: number;
  totalDebts: number;
  lowStock: number;
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

const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={`glass-card p-4 ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }: any) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-slate-200 text-slate-700 hover:bg-slate-300",
    outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };
  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Local DB Queries using Dexie
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const supplierPayments = useLiveQuery(() => db.supplierPayments.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.orderBy('created_at').reverse().limit(50).toArray()) || [];
  
  // Queries for comprehensive sales details reports
  const allSalesForDetails = useLiveQuery(() => db.sales.toArray()) || [];
  const allSaleItemsForDetails = useLiveQuery(() => db.saleItems.toArray()) || [];
  
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

  const [showInventoryDetailsModal, setShowInventoryDetailsModal] = useState(false);
  const [showSupplierSummaryModal, setShowSupplierSummaryModal] = useState(false);
  const [showSalesSummaryModal, setShowSalesSummaryModal] = useState(false);
  const [showProfitSummaryModal, setShowProfitSummaryModal] = useState(false);
  const [showMonthlySalesDetailsModal, setShowMonthlySalesDetailsModal] = useState(false);
  const [salesDetailsTab, setSalesDetailsTab] = useState<'days' | 'weeks' | 'months'>('days');

  // Customer Adjustments
  const [showCustomerAdjustmentModal, setShowCustomerAdjustmentModal] = useState<Customer | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add_debt' | 'add_credit' | 'note'>('note');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'cash' | 'debt'>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [expandedSaleItems, setExpandedSaleItems] = useState<any[]>([]);

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
  const [newProduct, setNewProduct] = useState({ name: '', cost: '', sale: '', stock: '', category: '', barcode: '', unit: '', supplier_id: undefined as number | undefined });

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'pos' | 'add-product' | 'edit-product'>('pos');
  const [scannedProductInfo, setScannedProductInfo] = useState<Product | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', initialDebt: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [inventoryCategory, setInventoryCategory] = useState('الكل');
  const [showPaymentModal, setShowPaymentModal] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState<Customer | null>(null);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', initialBalance: '' });
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDetails, setShowSupplierDetails] = useState<Supplier | null>(null);
  const [supplierDetailsTab, setSupplierDetailsTab] = useState<'payments' | 'products'>('payments');
  const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState<Supplier | null>(null);
  const [selectedSupplierPayment, setSelectedSupplierPayment] = useState<any | null>(null);
  const [supplierPaymentAmount, setSupplierPaymentAmount] = useState('');
  const [supplierPaymentNotes, setSupplierPaymentNotes] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updatingStockProduct, setUpdatingStockProduct] = useState<Product | null>(null);
  const [updatingStockAmount, setUpdatingStockAmount] = useState<string>('');
  const [updatingStockNotes, setUpdatingStockNotes] = useState<string>('');
  const [updatingStockType, setUpdatingStockType] = useState<'add' | 'subtract'>('add');
  const [updateSupplierBalance, setUpdateSupplierBalance] = useState<boolean>(true);

  // --- Licensing & Subscription States ---
  const [deviceID, setDeviceID] = useState<string>('');
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [activationDetails, setActivationDetails] = useState<{ licenseKey: string; expiresAt: string; activatedAt: string } | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(7);
  const [isInTrial, setIsInTrial] = useState<boolean>(true);
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
  
  // Cloud Licensing States
  const [clientStoreName, setClientStoreName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [cloudRequest, setCloudRequest] = useState<ActivationRequest | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [allCloudRequests, setAllCloudRequests] = useState<ActivationRequest[]>([]);
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [requestDurations, setRequestDurations] = useState<Record<string, number>>({});

  const [addProfitPercent, setAddProfitPercent] = useState<string>('');
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
  const [trendMode, setTrendMode] = useState<'daily' | 'monthly'>('daily');
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [storeName, setStoreName] = useState('النظام المحاسبي');
  const [currency, setCurrency] = useState('ر.ي');
  const [roundingFactor, setRoundingFactor] = useState<number | null>(null);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const appSettings = useLiveQuery(() => db.settings.toArray()) || [];
  const notes = useLiveQuery(() => db.notes.orderBy('created_at').reverse().toArray()) || [];
  const salesSettlements = useLiveQuery(() => db.salesSettlements ? db.salesSettlements.orderBy('created_at').reverse().toArray() : Promise.resolve([])) || [];

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', reminder_date: '', priority: 'normal' as 'normal' | 'high' | 'info' | 'warning' });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [noteFilter, setNoteFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('all');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  // States for Reconciling Sales / تصفية المبيعات
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [deliveredSettleAmount, setDeliveredSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  // States for Drawer Cash Withdrawals / مسحوبات الصندوق (السلفيات والنفقات)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawByWhom, setWithdrawByWhom] = useState('أمين الصندوق');

  // States for Security and Permissions / إدارة الصلاحيات والأمان للمدير
  const [permissionsEnabled, setPermissionsEnabled] = useState(false);
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

  const allCashWithdrawals = useLiveQuery(() => 
    db.cashWithdrawals ? db.cashWithdrawals.orderBy('created_at').reverse().toArray() : Promise.resolve([])
  ) || [];

  const lastSettleDate = salesSettlements[0]?.created_at || null;

  const currentCycleSales = useLiveQuery(async () => {
    const allSales = await db.sales.toArray();
    if (lastSettleDate) {
      return allSales.filter(s => s.created_at > lastSettleDate);
    }
    return allSales;
  }, [lastSettleDate]) || [];

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
    const allSales = await db.sales.toArray();
    return allSales.filter(s => s.payment_type === 'cash').reduce((sum, s) => sum + s.total_amount, 0);
  }) || 0;

  // 3. Customer debt payments (تسديدات الديون)
  const allTimeDebtPaymentsTotal = useLiveQuery(async () => {
    const allDebts = await db.debts.toArray();
    return allDebts.filter(d => d.type === 'payment').reduce((sum, d) => sum + d.amount, 0);
  }) || 0;

  // 4. Current cycle customer debt payments
  const currentCycleDebtPayments = useLiveQuery(async () => {
    const allDebts = await db.debts.toArray();
    const payments = allDebts.filter(d => d.type === 'payment');
    if (lastSettleDate) {
      return payments.filter(d => d.created_at > lastSettleDate);
    }
    return payments;
  }, [lastSettleDate]) || [];

  const currentCycleDebtPaymentsTotal = React.useMemo(() => {
    return currentCycleDebtPayments.reduce((sum, d) => sum + d.amount, 0);
  }, [currentCycleDebtPayments]);

  const currentCycleSupplierPayments = useLiveQuery(async () => {
    const allSPayments = await db.supplierPayments.toArray();
    if (lastSettleDate) {
      return allSPayments.filter(p => !p.payment_date || p.payment_date > lastSettleDate);
    }
    return allSPayments;
  }, [lastSettleDate]) || [];

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
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(backupTimer);
  }, [products, customers, sales, appSettings, notes]);

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
    const nameSetting = appSettings.find(s => s.key === 'storeName');
    if (nameSetting) {
      setStoreName(nameSetting.value);
      setClientStoreName(nameSetting.value);
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
      if (diffDays >= 7) {
        showNotification('تنبيه: لم تقم بأخذ نسخة احتياطية منذ أكثر من أسبوع!', 'error');
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
    const pinSetting = appSettings.find(s => s.key === 'adminPin');
    if (pinSetting) {
      setAdminPin(pinSetting.value);
    }
    const protectedSetting = appSettings.find(s => s.key === 'protectedActions');
    if (protectedSetting) {
      setProtectedActions(protectedSetting.value);
    }
  }, [appSettings]);

  // Licensing & Subscription Checks
  useEffect(() => {
    if (appSettings.length === 0) return;

    const initLicensing = async () => {
      // 1. Check or generate Device ID
      let currentDeviceID = '';
      const deviceIdSetting = appSettings.find(s => s.key === 'deviceID');
      if (deviceIdSetting) {
        currentDeviceID = deviceIdSetting.value;
        setDeviceID(deviceIdSetting.value);
      } else {
        const newID = generateDeviceID();
        await db.settings.add({ key: 'deviceID', value: newID });
        currentDeviceID = newID;
        setDeviceID(newID);
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

      // 3. Check Activation status
      const activationSetting = appSettings.find(s => s.key === 'activationDetails');
      if (activationSetting && activationSetting.value) {
        const details = activationSetting.value;
        setActivationDetails(details);
        
        // Validate the activation details
        const validation = verifyLicenseKey(currentDeviceID, details.licenseKey);
        if (validation.isValid) {
          if (details.expiresAt === 'lifetime') {
            setIsActivated(true);
          } else {
            const expDate = new Date(details.expiresAt);
            if (now < expDate) {
              setIsActivated(true);
            } else {
              setIsActivated(false); // Expired
            }
          }
        } else {
          setIsActivated(false); // Tampered/invalid key
        }
      } else {
        setIsActivated(false);
      }
    };

    initLicensing();
  }, [appSettings]);

  // 1. Subscribe to client's own activation status in the Cloud
  useEffect(() => {
    if (!deviceID) return;
    
    const unsubscribe = subscribeToDeviceActivation(deviceID, (request) => {
      setCloudRequest(request);
      
      // Auto-activation on the fly when approved
      if (request && request.status === 'approved' && request.licenseKey) {
        const currentKey = activationDetails?.licenseKey;
        if (currentKey !== request.licenseKey) {
          handleActivateApp(request.licenseKey);
        }
      }
    });
    
    return () => unsubscribe();
  }, [deviceID, activationDetails]);

  // 2. Subscribe to all cloud activation requests when Developer Mode is active
  useEffect(() => {
    if (!isDeveloperMode) return;
    
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

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Licensing & Activation Handlers ---
  const handleActivateApp = async (keyToUse?: string) => {
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
      expiresAt
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

  const handleVerifyDeveloperPIN = async () => {
    const pin = developerPinInput.trim();
    if (pin === 'a775715333' || pin.toUpperCase() === 'A775715333') {
      setIsDeveloperMode(true);
      setDeveloperPinError('');
      setDeveloperPinInput('');
      showNotification('تم التحقق من هوية المالك بنجاح 🔓', 'success');

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
      setDeveloperPinError('رمز المطور السري غير صحيح!');
    }
  };

  const handleDeactivateApp = async () => {
    if (confirm('هل أنت متأكد من إلغاء تفعيل هذا الترخيص؟ سيتم إخراجك للنسخة التجريبية.')) {
      const existing = await db.settings.where('key').equals('activationDetails').first();
      if (existing) {
        await db.settings.delete(existing.id!);
      }
      setActivationDetails(null);
      setIsActivated(false);
      showNotification('تم إلغاء تفعيل الترخيص الحالي بنجاح', 'success');
    }
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

  const handleRejectCloudRequest = async (deviceId: string) => {
    try {
      await rejectRequestInCloud(deviceId);
      showNotification('تم رفض طلب التفعيل بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء رفض الطلب', 'error');
    }
  };

  const handleDeleteCloudRequest = async (deviceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب بالكامل من السحابة؟')) {
      try {
        await deleteRequestFromCloud(deviceId);
        showNotification('تم حذف طلب التفعيل من السحابة', 'success');
      } catch (e) {
        console.error(e);
        showNotification('حدث خطأ أثناء حذف الطلب', 'error');
      }
    }
  };

  const handleGenerateLicense = () => {
    if (!generatorDeviceIDInput) {
      alert('الرجاء إدخال معرف جهاز العميل أولاً!');
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
      fetchSummary();
      fetchDailySales();
    };
    init();
  }, []); // Empty dependency array ensures this runs only once on mount

  const categories: string[] = ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];

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

  const fetchSummary = async () => {
    // Local DB logic
    const allSales = await db.sales.toArray();
    const allCustomers = await db.customers.toArray();
    const lowStockCount = await db.products.where('stock_quantity').below(5).count();
    
    const totalSales = allSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalDebts = allCustomers.reduce((sum, c) => sum + c.balance, 0);

    // Profit calculation
    const allSaleItems = await db.saleItems.toArray();
    const allProducts = await db.products.toArray();
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

     const summaryData = {
       totalSales,
       totalCostOfSales: totalSupplierBalances,
       totalDebts,
       lowStock: lowStockCount,
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
    setSummary(summaryData);
    localStorage.setItem('cached_summary', JSON.stringify(summaryData));
  };

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

  const fetchDailySales = async () => {
    // Local DB logic
    const allSales = await db.sales.toArray();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dailyData = last7Days.map(date => {
      const dayTotal = allSales
        .filter(s => s.created_at.startsWith(date))
        .reduce((sum, s) => sum + s.total_amount, 0);
      return { date, total: dayTotal };
    });

    setDailySales(dailyData);

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).reverse();

    const monthlyData = last6Months.map(month => {
      const monthTotal = allSales
        .filter(s => s.created_at.startsWith(month))
        .reduce((sum, s) => sum + s.total_amount, 0);
      return { date: month, total: monthTotal };
    });

    setMonthlySalesTrend(monthlyData);

    // Calculate Top Products
    const allSaleItems = await db.saleItems.toArray();
    const allProducts = await db.products.toArray();
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    
    // Aggregate by product_id
    const productSalesCount: Record<number, { count: number, revenue: number }> = {};
    allSaleItems.forEach(item => {
      if (!productSalesCount[item.product_id]) {
        productSalesCount[item.product_id] = { count: 0, revenue: 0 };
      }
      productSalesCount[item.product_id].count += item.quantity;
      productSalesCount[item.product_id].revenue += (item.quantity * item.price_at_sale);
    });

    const top = Object.entries(productSalesCount)
      .map(([id, data]) => ({
        product: productMap.get(Number(id)),
        count: data.count,
        revenue: data.revenue
      }))
      .filter(item => item.product) // filter out deleted products
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
      
    setTopProducts(top);
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
    
    const saleIds = customerSales.map(s => s.id!);
    const allItems = await db.saleItems.where('sale_id').anyOf(saleIds).toArray();
    const allProducts = await db.products.toArray();
    const productMap = new Map(allProducts.map(p => [p.id, p]));

    const salesWithItems = customerSales.map(s => ({
      ...s,
      items: JSON.stringify(allItems
        .filter(si => si.sale_id === s.id)
        .map(si => ({
          name: productMap.get(si.product_id)?.name || 'منتج محذوف',
          quantity: si.quantity,
          price: si.price_at_sale,
          unit: productMap.get(si.product_id)?.unit || ''
        })))
    }));

    const debts = await db.debts
      .where('customer_id')
      .equals(customer.id!)
      .reverse()
      .toArray();

    setCustomerHistory({ sales: salesWithItems, debts });
    setShowCustomerDetails(customer);
  };

  const handlePayment = async () => {
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
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const handleCustomerAdjustmentSubmit = async () => {
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
    setAdjustmentAmount('');
    setAdjustmentNotes('');
    setAdjustmentType('note');
  };

  const handleSaveSettlement = async () => {
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
      setDeliveredSettleAmount('');
      setSettleNotes('');
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

  const handleSaveWithdrawal = async () => {
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
      setWithdrawAmount('');
      setWithdrawReason('');
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

  const handleAddNote = async () => {
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
      setNewNote({ title: '', content: '', reminder_date: '', priority: 'normal' });
      setEditingNoteId(null);
      setShowAddNote(false);
    } catch (err) {
      console.error('Failed to save note: ', err);
      showNotification('حدث خطأ أثناء حفظ الملاحظة', 'error');
    }
  };

  const handleEditNoteAction = (note: any) => {
    setNewNote({
      title: note.title,
      content: note.content,
      reminder_date: note.reminder_date || '',
      priority: note.priority || 'normal'
    });
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

  const handleAddCostChange = (costStr: string) => {
    const cost = parseFloat(costStr);
    setNewProduct(prev => {
      const pct = parseFloat(addProfitPercent);
      const sale = parseFloat(prev.sale);
      let nextProduct = { ...prev, cost: costStr };

      if (!isNaN(cost) && cost > 0) {
        if (addLastModified === 'percent' && !isNaN(pct)) {
          let computedSale = 0;
          if (pct < 100) {
            computedSale = cost / (1 - pct / 100);
          } else {
            computedSale = cost * (1 + pct / 100);
          }
          nextProduct.sale = formatCalculatedValue(applyCurrencyRounding(computedSale));
        } else if (!isNaN(sale) && sale > 0) {
          const computedPct = ((sale - cost) / sale) * 100;
          setAddProfitPercent(formatCalculatedValue(computedPct));
        }
      }
      return nextProduct;
    });
    setAddLastModified('cost');
  };

  const handleAddProfitPercentChange = (pctStr: string) => {
    setAddProfitPercent(pctStr);
    const pct = parseFloat(pctStr);
    setNewProduct(prev => {
      const cost = parseFloat(prev.cost);
      const sale = parseFloat(prev.sale);
      let nextProduct = { ...prev };

      if (!isNaN(pct)) {
        if (addLastModified === 'cost' && !isNaN(cost) && cost > 0) {
          let computedSale = 0;
          if (pct < 100) {
            computedSale = cost / (1 - pct / 100);
          } else {
            computedSale = cost * (1 + pct / 100);
          }
          nextProduct.sale = formatCalculatedValue(applyCurrencyRounding(computedSale));
        } else if (!isNaN(sale) && sale > 0) {
          nextProduct.cost = formatCalculatedValue(sale * (1 - pct / 100));
        }
      }
      return nextProduct;
    });
    setAddLastModified('percent');
  };

  const handleAddSaleChange = (saleStr: string) => {
    const sale = parseFloat(saleStr);
    setNewProduct(prev => {
      const pct = parseFloat(addProfitPercent);
      const cost = parseFloat(prev.cost);
      let nextProduct = { ...prev, sale: saleStr };

      if (!isNaN(sale) && sale > 0) {
        if (addLastModified === 'percent' && !isNaN(pct)) {
          nextProduct.cost = formatCalculatedValue(sale * (1 - pct / 100));
        } else if (!isNaN(cost) && cost > 0) {
          const computedPct = ((sale - cost) / sale) * 100;
          setAddProfitPercent(formatCalculatedValue(computedPct));
        }
      }
      return nextProduct;
    });
    setAddLastModified('sale');
  };

  const handleEditCostChange = (costStr: string) => {
    setEditCostStr(costStr);
    if (!editingProduct) return;

    const cost = parseFloat(costStr);
    let computedSalePrice = editingProduct.sale_price;
    let computedPercent = editProfitPercent;

    if (!isNaN(cost) && cost > 0) {
      const pct = parseFloat(editProfitPercent);
      const sale = parseFloat(editSaleStr);

      if (editLastModified === 'percent' && !isNaN(pct)) {
        let computedSale = 0;
        if (pct < 100) {
          computedSale = cost / (1 - pct / 100);
        } else {
          computedSale = cost * (1 + pct / 100);
        }
        computedSalePrice = applyCurrencyRounding(computedSale);
        setEditSaleStr(formatCalculatedValue(computedSalePrice));
      } else if (!isNaN(sale) && sale > 0) {
        const computedPct = ((sale - cost) / sale) * 100;
        computedPercent = formatCalculatedValue(computedPct);
        setEditProfitPercent(computedPercent);
      }
    }

    setEditingProduct(prev => prev ? { 
      ...prev, 
      cost_price: isNaN(cost) ? 0 : cost, 
      sale_price: computedSalePrice 
    } : null);
    setEditLastModified('cost');
  };

  const handleEditProfitPercentChange = (pctStr: string) => {
    setEditProfitPercent(pctStr);
    if (!editingProduct) return;

    const pct = parseFloat(pctStr);
    let cost = parseFloat(editCostStr);
    let salePrice = parseFloat(editSaleStr);

    if (isNaN(pct)) return;

    if (editLastModified === 'cost' && !isNaN(cost) && cost > 0) {
      let computedSale = 0;
      if (pct < 100) {
        computedSale = cost / (1 - pct / 100);
      } else {
        computedSale = cost * (1 + pct / 100);
      }
      salePrice = applyCurrencyRounding(computedSale);
      setEditSaleStr(formatCalculatedValue(salePrice));
    } else if (!isNaN(salePrice) && salePrice > 0) {
      cost = salePrice * (1 - pct / 100);
      setEditCostStr(formatCalculatedValue(cost));
    }

    setEditingProduct(prev => prev ? { 
      ...prev, 
      cost_price: isNaN(cost) ? prev.cost_price : cost, 
      sale_price: isNaN(salePrice) ? prev.sale_price : salePrice 
    } : null);
    setEditLastModified('percent');
  };

  const handleEditSaleChange = (saleStr: string) => {
    setEditSaleStr(saleStr);
    if (!editingProduct) return;

    const sale = parseFloat(saleStr);
    let cost = parseFloat(editCostStr);
    let pctStr = editProfitPercent;

    if (!isNaN(sale) && sale > 0) {
      if (editLastModified === 'percent' && !isNaN(parseFloat(editProfitPercent)) && editProfitPercent !== '') {
        const pct = parseFloat(editProfitPercent);
        cost = sale * (1 - pct / 100);
        setEditCostStr(formatCalculatedValue(cost));
      } else if (!isNaN(cost) && cost > 0) {
        pctStr = formatCalculatedValue(((sale - cost) / sale) * 100);
        setEditProfitPercent(pctStr);
      }
    }

    setEditingProduct(prev => prev ? { 
      ...prev, 
      cost_price: isNaN(cost) ? prev.cost_price : cost, 
      sale_price: isNaN(sale) ? 0 : sale 
    } : null);
    setEditLastModified('sale');
  };

  const handleAddProduct = async () => {
    const stock = Number(newProduct.stock);
    const productData: any = {
      name: newProduct.name,
      cost_price: Number(newProduct.cost),
      sale_price: Number(newProduct.sale),
      stock_quantity: stock,
      category: newProduct.category,
      barcode: newProduct.barcode.trim() || undefined,
      unit: newProduct.unit.trim() || undefined,
      supplier_id: newProduct.supplier_id
    };

    try {
      // Add to local DB
      const productId = await db.products.add(productData);
      await db.inventoryLogs.add({
        product_id: productId as number,
        change_amount: stock,
        reason: 'initial',
        created_at: new Date().toISOString()
      });
      
      showNotification('تم إضافة المنتج بنجاح');
    } catch (err) {
      console.error("Failed to add product:", err);
      showNotification('خطأ في إضافة المنتج', 'error');
    }

    setShowAddProduct(false);
    setAddProfitPercent('');
    setNewProduct({ name: '', cost: '', sale: '', stock: '', category: '', barcode: '', unit: '', supplier_id: undefined });
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

      await db.transaction('rw', db.products, db.inventoryLogs, db.suppliers, async () => {
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

        // Update supplier balance
        if (dbProduct.supplier_id && dbProduct.cost_price > 0) {
          const supplier = await db.suppliers.get(dbProduct.supplier_id);
          if (supplier) {
            let balanceChange = 0;
            if (updatingStockType === 'add') {
              balanceChange = changeAmount * dbProduct.cost_price; // changeAmount is positive
            } else if (updatingStockType === 'subtract' && updateSupplierBalance) {
              balanceChange = changeAmount * dbProduct.cost_price; // changeAmount is negative, so this deducts
            }
            
            if (balanceChange !== 0) {
              await db.suppliers.update(supplier.id!, {
                balance: (supplier.balance || 0) + balanceChange
              });
            }
          }
        }
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

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.id) return;
    
    try {
      // Update local DB
      const oldProduct = await db.products.get(editingProduct.id);
      if (oldProduct) {
        const diff = editingProduct.stock_quantity - oldProduct.stock_quantity;
        await db.products.update(editingProduct.id, editingProduct);
        if (diff !== 0) {
          await db.inventoryLogs.add({
            product_id: editingProduct.id,
            change_amount: diff,
            reason: 'manual_update',
            created_at: new Date().toISOString()
          });
        }
      }

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
    const existing = await db.settings.where('key').equals('adminPin').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: newPin });
    } else {
      await db.settings.add({ key: 'adminPin', value: newPin });
    }
    setAdminPin(newPin);
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
          if (p.actionType !== 'setup_first' && newVal === adminPin) {
            setTimeout(() => {
              const successCb = p.onSuccess;
              setPinModal(prev => ({ ...prev, isOpen: false }));
              successCb();
            }, 30);
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
          if (pinModal.inputVal === adminPin) {
            const successCb = pinModal.onSuccess;
            setPinModal(p => ({ ...p, isOpen: false }));
            successCb();
          } else {
            setPinModal(p => ({ ...p, error: '❌ رمز المرور غير صحيح! الرجاء المحاولة مرة أخرى.' }));
          }
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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storeName}_بيانات_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    // Update last backup date
    const now = new Date().toISOString();
    const existing = await db.settings.where('key').equals('lastBackupDate').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: now });
    } else {
      await db.settings.add({ key: 'lastBackupDate', value: now });
    }
    setLastBackupDate(now);
    
    showNotification('تم تصدير نسخة احتياطية بنجاح');
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
          await db.settings.filter(s => s.key !== 'isFirstRun').delete();
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
                    const items = JSON.parse(entry.items);
                    itemsHtml = `<div style="font-size: 0.85em; color: #555; margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">
                      ${items.map((item: any) => `${item.name} (${item.quantity} ${item.unit || ''} × ${item.price})`).join('<br/>')}
                    </div>`;
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
    const message = `مرحباً ${customer.name}، هذا كشف حسابك من ${storeName}:\nالرصيد المتبقي: ${customer.balance} ${currency}\nللمزيد من التفاصيل يرجى مراجعة المحل.`;
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
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
                  title = 'فاتورة مشتريات #' + entry.id;
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

  const [supplierHistory, setSupplierHistory] = useState<{ payments: any[], products: any[] }>({ payments: [], products: [] });

  const fetchSupplierHistory = async (supplier: any) => {
    const payments = await db.supplierPayments.where('supplier_id').equals(supplier.id).toArray();
    const prods = await db.products.where('supplier_id').equals(supplier.id).toArray();
    setSupplierHistory({ payments, products: prods });
    setShowSupplierDetails(supplier);
  };

  const handleAddSupplier = async () => {
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
      setNewSupplier({ name: '', phone: '', initialBalance: '' });
      showNotification('تم إضافة المورد بنجاح');
    } catch (err) {
      console.error("Failed to add supplier:", err);
      showNotification('خطأ في إضافة المورد', 'error');
    }
  };

  const handleSupplierPayment = async () => {
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
      setSupplierPaymentAmount('');
      setSupplierPaymentNotes('');
      if (showSupplierDetails && showSupplierDetails.id === showSupplierPaymentModal.id) {
        fetchSupplierHistory(showSupplierPaymentModal);
      }
      fetchSummary();
    } catch (err) {
      console.error("Failed to record supplier payment:", err);
      showNotification('خطأ في تسجيل الدفعة', 'error');
    }
  };

  const handleAddCustomer = async () => {
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
      setNewCustomer({ name: '', phone: '', initialDebt: '' });
      setSelectedCustomer(customerId as number);
      // Re-trigger cart preview if it was closed
      setIsCartExpanded(true);
      showNotification('تم إضافة الزبون بنجاح');
    } catch (err) {
      console.error("Failed to add customer:", err);
      showNotification('خطأ في إضافة الزبون', 'error');
    }
  };

  const handleBarcodeScan = (code: string) => {
    if (confirmAction) {
      return; // Ignore any background camera scans while a dialog is active
    }
    if (scannerMode === 'add-product') {
      setNewProduct(prev => ({ ...prev, barcode: code }));
      showNotification(`تم قراءة الباركود: ${code}`);
    } else if (scannerMode === 'edit-product') {
      if (editingProduct) {
        setEditingProduct(prev => prev ? { ...prev, barcode: code } : null);
        showNotification(`تم تسجيل الباركود: ${code}`);
      }
    } else if (scannerMode === 'pos') {
      const trimmedCode = code.trim();
      const product = products.find(p => p.barcode && p.barcode.trim() === trimmedCode);
      if (product) {
        if (product.stock_quantity <= 0) {
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
          addToCart(product);
          setScannedProductInfo(product);
          showNotification(`تمت إضافة "${product.name}" إلى السلة`);
        }
      } else {
        setIsScannerOpen(false); // Close the scanner to stop background feed and focus product creation
        showNotification(`الرمز ${code} غير مرتبط بأي منتج`, 'error');
        setConfirmAction({
          title: 'منتج غير مسجل',
          message: `لم يتم العثور على الباركود (${code}) في المخزون. هل ترغب في تسجيل صنف جديد بهذا الباركود الآن؟`,
          onConfirm: () => {
            setConfirmAction(null);
            setNewProduct({ name: '', cost: '', sale: '', stock: '', category: '', barcode: code, unit: '', supplier_id: undefined });
            setShowAddProduct(true);
          }
        });
      }
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock_quantity <= 0) {
      showNotification('عذراً، هذا المنتج غير متوفر في المخزون', 'error');
      return;
    }

    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity + quantity > product.stock_quantity) {
        showNotification('لا يمكن إضافة كمية أكبر من المتوفر في المخزون', 'error');
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      ));
    } else {
      if (quantity > product.stock_quantity) {
        showNotification('لا يمكن إضافة كمية أكبر من المتوفر في المخزون', 'error');
        return;
      }
      setCart([...cart, { product_id: product.id, name: product.name, price: product.sale_price, quantity: quantity, max_stock: product.stock_quantity, unit: product.unit }]);
    }
  };

  const updateCartQuantity = (productId: number, delta: number) => {
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
    fetchSummary();
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
                  <div className="flex items-center gap-2 text-rose-400">
                    <X className="w-5 h-5" />
                    <h4 className="text-sm font-black">تم رفض طلب تفعيل جهازك ❌</h4>
                  </div>
                  <p className="text-xs text-rose-200/80 leading-relaxed font-bold">
                    للأسف، تم رفض طلب التفعيل الرقمي لجهازك من قبل إدارة البرنامج. يرجى التواصل مع المدير المباشر لمعرفة السبب أو التقديم مجدداً.
                  </p>
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
              {/* Custom Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button 
                  onClick={() => setIsManualInput(true)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${isManualInput ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  🔑 إدخال مفتاح يدوي
                </button>
                <button 
                  onClick={() => setIsManualInput(false)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${!isManualInput ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  📡 طلب تفعيل سحابي رقمي
                </button>
              </div>

              {!isManualInput ? (
                /* Cloud request form */
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
              ) : (
                /* Manual Key form */
                <div className="space-y-3">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-bold text-slate-300">أدخل مفتاح التفعيل المستلم:</label>
                    <input 
                      type="text" 
                      value={activationKeyInput}
                      onChange={(e) => {
                        setActivationKeyInput(e.target.value);
                        setActivationError('');
                      }}
                      placeholder="LIC-XXXX-XXXX-XXXX-XXXX"
                      className="w-full p-3 bg-slate-950 text-white font-mono placeholder-slate-600 rounded-xl border-2 border-slate-800 focus:border-indigo-500 outline-none text-center tracking-widest text-sm transition-all uppercase"
                    />
                  </div>

                  {activationError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-500 font-bold bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 text-center">
                      {activationError}
                    </motion.div>
                  )}

                  <button 
                    onClick={() => handleActivateApp()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>تفعيل وإطلاق البرنامج الآن 🔑</span>
                  </button>
                </div>
              )}
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
              <div className="bg-slate-950/80 p-4 border border-indigo-950 rounded-2xl space-y-3 mt-1 text-right">
                <label className="text-xs font-bold text-indigo-300 block">رمز الإدارة السري (Master PIN):</label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={developerPinInput}
                    onChange={(e) => {
                      setDeveloperPinInput(e.target.value);
                      setDeveloperPinError('');
                    }}
                    placeholder="••••••"
                    className="flex-1 p-2 bg-slate-900 text-white font-mono placeholder-slate-700 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-center text-sm"
                  />
                  <button 
                    onClick={handleVerifyDeveloperPIN}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    دخول 🔓
                  </button>
                </div>
                {developerPinError && (
                  <p className="text-[10px] text-rose-500 font-bold">{developerPinError}</p>
                )}
                <button 
                  onClick={() => {
                    setShowAdminLogin(false);
                    setDeveloperPinError('');
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 block mx-auto mt-1"
                >
                  إلغاء وتراجع
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="text-[11px] text-slate-500 hover:text-indigo-400 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <span>🛠️ تسجيل دخول الإدارة والمالك</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: isSidebarOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
            <p className="text-[10px] font-black text-slate-450 mr-2 mb-1.5 tracking-wide">الرئيسية والتحليل</p>
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
            <p className="text-[10px] font-black text-slate-450 mr-2 mb-1.5 tracking-wide">العمليات والبيع</p>
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
            <p className="text-[10px] font-black text-slate-455 mr-2 mb-1.5 tracking-wide">إحصاءات السلع والحلفاء</p>
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
            <p className="text-[10px] font-black text-slate-450 mr-2 mb-1.5 tracking-wide">الإدارة المالية والذكاء</p>
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
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-2 pr-1">النظام وأمان البيانات</p>
          
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
          <h1 className="text-xl font-bold text-emerald-700">{storeName}</h1>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-emerald-600 w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-10">
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
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
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
                    className="p-1.5 sm:p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1.5 hover:border-amber-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[9px] sm:text-[10px] text-slate-700">احتياطية</span>
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

                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-2xl bg-red-50 border border-red-100 shadow-sm cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setActiveTab('customers')}>
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

              <Card className="p-6 h-80 rounded-3xl shadow-sm border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">تحليل المبيعات</h3>
                  <div className="flex bg-slate-100 p-1 rounded-full gap-1">
                    <button 
                      onClick={() => setTrendMode('daily')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${trendMode === 'daily' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      آخر 7 أيام
                    </button>
                    <button 
                      onClick={() => setTrendMode('monthly')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${trendMode === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      آخر 6 أشهر
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendMode === 'daily' ? dailySales : monthlySalesTrend}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(val) => {
                          if (trendMode === 'daily') {
                            return new Date(val).toLocaleDateString('ar-SA', { weekday: 'short' });
                          } else {
                            const [y, m] = val.split('-');
                            return `${m}/${y.slice(2)}`;
                          }
                        }}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        labelFormatter={(val) => {
                          if (trendMode === 'daily') {
                            return new Date(val).toLocaleDateString('ar-SA', { dateStyle: 'full' });
                          }
                          return `شهر ${val}`;
                        }}
                        formatter={(value: number) => [formatPrice(value), 'المبيعات']}
                      />
                      <Bar dataKey="total" fill="url(#colorTotal)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {topProducts.length > 0 && (
                <Card className="p-5 rounded-3xl shadow-sm border border-slate-100/60 bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-emerald-500" />
                       الأصناف الأكثر مبيعاً
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topProducts.map((item, index) => (
                      <div key={`top-product-${item.product?.id ?? 'no-id'}-${index}`} className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-sm bg-white border ${index === 0 ? 'border-amber-200 text-amber-500' : index === 1 ? 'border-slate-200 text-slate-500' : index === 2 ? 'border-orange-200 text-orange-500' : 'border-slate-100 text-slate-400'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition-colors">{item.product.name}</p>
                            <p className="text-[10px] text-slate-400">{item.product.category}</p>
                          </div>
                        </div>
                        <div className="text-left bg-slate-50 group-hover:bg-white px-2.5 py-1.5 rounded-xl border border-slate-100 transition-colors">
                          <p className="font-bold text-emerald-600 text-xs">{item.count} وحدة</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-0.5">{formatPrice(item.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'pos' && (
            <motion.div 
              key="pos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                  <Home className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold">نقطة البيع</h2>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم أو السعر..." 
                    className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => { setScannerMode('pos'); setIsScannerOpen(true); }}
                  className="px-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                  title="مسح باركود المنتج بالكاميرا"
                >
                  <Scan className="w-5 h-5" />
                  <span className="hidden sm:inline">قارئ الباركود</span>
                </button>
              </div>

              <AnimatePresence>
                {scannedProductInfo && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-4 mb-4 relative"
                  >
                    <button 
                      onClick={() => setScannedProductInfo(null)}
                      className="absolute left-3 top-3 p-1 hover:bg-emerald-100 text-emerald-600 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold flex-shrink-0 animate-pulse">
                        <Scan className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">تم العثور وعرض المواصفات</p>
                        <h4 className="font-extrabold text-slate-800 text-normal mt-0.5">{scannedProductInfo.name}</h4>
                        <div className="grid grid-cols-3 gap-2 mt-2 bg-white/60 p-2 rounded-2xl border border-emerald-100/50">
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold">سعر البيع</p>
                            <p className="text-xs font-extrabold text-emerald-600">{formatPrice(scannedProductInfo.sale_price)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold">المخزون المتوفر</p>
                            <p className={`text-xs font-extrabold ${scannedProductInfo.stock_quantity <= 5 ? 'text-red-500' : 'text-slate-700'}`}>
                              {scannedProductInfo.stock_quantity} سلع
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold">الفئة</p>
                            <p className="text-xs font-bold text-slate-600 truncate">{scannedProductInfo.category}</p>
                          </div>
                        </div>

                        {scannedProductInfo.stock_quantity <= 0 && (
                          <div className="mt-3 pt-2 border-t border-emerald-100/40">
                            <button
                              onClick={async () => {
                                try {
                                  await db.products.update(scannedProductInfo.id!, { stock_quantity: 5 });
                                  const updated = await db.products.get(scannedProductInfo.id!);
                                  if (updated) {
                                    setScannedProductInfo(updated);
                                    addToCart(updated);
                                    showNotification(`تم زيادة مخزون "${updated.name}" بـ 5 قطع تلقائياً وإضافته للسلة!`, 'success');
                                  }
                                } catch (err) {
                                  console.error("Failed auto stock addition:", err);
                                  showNotification('خطأ في معالجة الإضافة التلقائية للمخزون', 'error');
                                }
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              السلعة نافذة! هل ترغب بإضافة 5 قطع للمخزون وإضافتها للسلة تلقائياً؟
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* شريط الأقسام الذكي واللوحة الجانبية */}
              <div className="flex items-center justify-between gap-2 mb-2 bg-slate-100/40 p-2 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1 text-slate-700">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black">أقسام المتجر</span>
                  <span className="text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded-md font-bold text-slate-600">
                    {categories.length - 1} نشط
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCategorySidebarOpen(true)}
                  className="flex items-center gap-1 text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                >
                  <Menu className="w-3 h-3" />
                  <span>تصفح الأقسام بالتفصيل</span>
                </button>
              </div>

              {/* الشريط الأفقي الافتراضي للأقسام السريعة */}
              <div className="flex gap-2 overflow-x-auto pb-1.5 mb-3 no-scrollbar">
                {categories.map((cat, idx) => {
                  const itemsCount = categoryCounts[cat] || 0;
                  return (
                    <button
                      type="button"
                      key={`pos-cat-${cat}-${idx}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 font-bold scale-[1.02]' 
                          : 'bg-white text-slate-600 border border-slate-200/60 hover:border-slate-350'
                      }`}
                    >
                      {categoryIcons[cat] || <Package className="w-3.5 h-3.5" />}
                      <span>{cat}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                        selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-55/70 text-slate-500'
                      }`}>
                        {itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1 pb-4">
                {products
                  .filter(p => p.name.includes(searchTerm))
                  .filter(p => selectedCategory === 'الكل' || p.category === selectedCategory)
                  .map((p, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={`pos-product-${p.id ?? 'no-id'}-${idx}`} 
                    className={`relative p-3 rounded-3xl border-2 transition-all cursor-pointer active:scale-95 ${p.stock_quantity <= 0 ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md'}`}
                    onClick={() => p.stock_quantity > 0 && addToCart(p)}
                  >
                    <div className="aspect-square bg-slate-100 rounded-2xl mb-3 flex items-center justify-center text-slate-400">
                      {categoryIcons[p.category || ''] || <Package className="w-8 h-8 opacity-20" />}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-emerald-600 font-bold">{formatPrice(p.sale_price)}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-bold ${p.stock_quantity <= 0 ? 'bg-red-100 text-red-600' : p.stock_quantity < 5 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                          {p.stock_quantity <= 0 ? 'نفذ' : `${p.stock_quantity} ${p.unit || ''}`}
                        </span>
                      </div>
                    </div>

                    {p.stock_quantity > 0 && (
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                          <Plus className="w-3 h-3" />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); fetchProductHistory(p); }}
                          className="bg-white/90 backdrop-blur-sm text-slate-400 p-1 rounded-full shadow-sm hover:text-blue-500 transition-colors"
                        >
                          <AlertCircle className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-40">
                  <Button 
                    className="w-full py-4 text-lg rounded-3xl shadow-2xl shadow-emerald-200 flex justify-between items-center px-6"
                    onClick={() => setIsCartExpanded(true)}
                  >
                    <span>عرض السلة ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span className="font-bold">{formatPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                  </Button>
                </div>
              )}

              <AnimatePresence>
                {isCartExpanded && (
                  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h2 className="text-xl font-extrabold text-slate-900">السلة</h2>
                        <button onClick={() => setIsCartExpanded(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                          <X className="w-5 h-5 text-slate-500" />
                        </button>
                      </div>
                      
                      <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">الزبون</label>
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none"
                              value={selectedCustomer || ''}
                              onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
                            >
                              <option value="">زبون نقدي</option>
                              {customers.map((c, idx) => (
                                <option key={`customer-option-${c.id ?? 'no-id'}-${idx}`} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button 
                              onClick={() => { setIsCartExpanded(false); setShowAddCustomer(true); }}
                              className="w-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shrink-0"
                              title="إضافة زبون جديد"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">الدفع</label>
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button 
                              onClick={() => setPaymentType('cash')}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentType === 'cash' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}
                            >
                              نقداً
                            </button>
                            <button 
                              onClick={() => setPaymentType('debt')}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paymentType === 'debt' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}
                            >
                              دين
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const activeCustomerInfo = customers.find(c => c.id === selectedCustomer);
                          if (!activeCustomerInfo) return null;
                          return (
                            <div className={`col-span-2 p-3 rounded-xl border flex justify-between items-center text-xs ${
                              activeCustomerInfo.balance > 0 
                                ? 'bg-red-50 border-red-100 text-red-800' 
                                : activeCustomerInfo.balance < 0 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-extrabold animate-pulse' 
                                  : 'bg-slate-50 border-slate-100 text-slate-500'
                            }`}>
                              <span className="font-bold">حالة حساب هذا الزبون:</span>
                              <span className="font-black font-mono">
                                {activeCustomerInfo.balance > 0 
                                  ? `شراء بالدين (عليه متبقي): ${formatPrice(activeCustomerInfo.balance)}` 
                                  : activeCustomerInfo.balance < 0 
                                    ? `لديه رصيد مقدّم متوفر: ${formatPrice(Math.abs(activeCustomerInfo.balance))}` 
                                    : 'حسابه مسوّى وخالص تماماً'
                                }
                              </span>
                            </div>
                          );
                        })()}

                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">ملاحظة للطلب (اختياري)</label>
                          <textarea 
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                            placeholder="أضف أية ملاحظات إضافية هنا..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none resize-none h-20"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {cart.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-sm font-bold">السلة فارغة حالياً</p>
                            <p className="text-[10px] text-slate-400 mt-1">اضغط على المنتجات لإضافتها إلى السلة والبدء بالبيع</p>
                          </div>
                        ) : (
                          cart.map((item, idx) => {
                            const itemQuantity = Number(item.quantity) || 0;
                            const integerPart = Math.floor(itemQuantity);
                            const fractionalPart = parseFloat((itemQuantity % 1).toFixed(2));

                            // Determine selected fraction value
                            let selectedFraction = '0';
                            if (Math.abs(fractionalPart - 0.5) < 0.05) {
                              selectedFraction = '0.5';
                            } else if (Math.abs(fractionalPart - 0.33) < 0.05 || Math.abs(fractionalPart - 0.3) < 0.05) {
                              selectedFraction = '0.33';
                            } else if (Math.abs(fractionalPart - 0.25) < 0.05) {
                              selectedFraction = '0.25';
                            } else if (Math.abs(fractionalPart - 0.75) < 0.05) {
                              selectedFraction = '0.75';
                            }

                            const subtotal = item.price * itemQuantity;

                            return (
                              <div 
                                key={`cart-item-${item.product_id ?? 'no-id'}-${idx}`} 
                                className="bg-white p-3 rounded-2xl border border-slate-150/70 hover:border-slate-200 shadow-xs transition-all flex flex-col gap-3 text-right"
                              >
                                {/* الصف الأول: اسم المنتج والتحكم بالحذف وسعر الوحدة */}
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-0.5">
                                    <p className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug">{item.name}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                      <span>سعر الوحدة:</span>
                                      <span className="font-mono text-slate-600">{formatPrice(item.price)}</span>
                                      {item.unit && (
                                        <span className="bg-slate-100 text-slate-500 px-1 rounded-md text-[9px] font-bold">
                                          {item.unit}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button 
                                    onClick={() => removeFromCart(item.product_id)}
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                                    title="حذف من السلة"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* الصف الثاني: التحكم بالكمية يدوي وتحديد الكسر والمجموع */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                  {/* أداة التحكم بالكمية والادخال اليدوي */}
                                  <div className="flex items-center gap-1">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const currentVal = Number(item.quantity) || 0;
                                        const val = Math.max(0, currentVal - 1);
                                        setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: parseFloat(val.toFixed(2)) } : c));
                                      }}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm transition-all active:scale-95 cursor-pointer"
                                      title="إنقاص الكمية بـ 1"
                                    >
                                      -
                                    </button>
                                    
                                    <input 
                                      type="number"
                                      step="any"
                                      min="0"
                                      value={item.quantity === 0 ? '' : item.quantity}
                                      onChange={(e) => {
                                        const rawVal = e.target.value;
                                        if (rawVal === '') {
                                          setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: 0 } : c));
                                          return;
                                        }
                                        const val = parseFloat(rawVal);
                                        if (isNaN(val)) return;
                                        if (val < 0) return;
                                        if (val > item.max_stock) {
                                          showNotification(`تنبيه: الكمية تتجاوز المتوفر بالمخزن (${item.max_stock})`, 'error');
                                          setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: item.max_stock } : c));
                                          return;
                                        }
                                        setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: val } : c));
                                      }}
                                      className="w-14 h-7 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none"
                                      placeholder="0"
                                    />

                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const currentVal = Number(item.quantity) || 0;
                                        const val = currentVal + 1;
                                        if (val > item.max_stock) {
                                          showNotification('لا يمكن تجاوز الكمية المتوفرة في المخزن', 'error');
                                          return;
                                        }
                                        setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: parseFloat(val.toFixed(2)) } : c));
                                      }}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm transition-all active:scale-95 cursor-pointer"
                                      title="زيادة الكمية بـ 1"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* القائمة المنسدلة للكسر (نصف، ثلث، ربع) */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400">الكسر:</span>
                                    <select
                                      value={selectedFraction}
                                      onChange={(e) => {
                                        const fractionVal = parseFloat(e.target.value);
                                        const currentInt = Math.floor(Number(item.quantity) || 0);
                                        let finalQty = currentInt + fractionVal;
                                        if (finalQty > item.max_stock) {
                                          showNotification(`تجاوزت الحد الأقصى للمخزون (${item.max_stock})`, 'error');
                                          finalQty = item.max_stock;
                                        }
                                        setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: parseFloat(finalQty.toFixed(2)) } : c));
                                      }}
                                      className="p-1 pr-5 pl-1 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-black text-slate-700 focus:border-emerald-500 outline-none cursor-pointer"
                                    >
                                      <option value="0">كامل (1.0)</option>
                                      <option value="0.5">نصف (0.50)</option>
                                      <option value="0.33">ثلث (0.33)</option>
                                      <option value="0.25">ربع (0.25)</option>
                                      <option value="0.75">ثلاثة أرباع (0.75)</option>
                                    </select>
                                  </div>

                                  {/* المجموع للسلعة */}
                                  <div className="text-left shrink-0">
                                    <p className="text-[9px] text-slate-400 font-bold">المجموع</p>
                                    <p className="text-xs font-black font-mono text-emerald-600 leading-none mt-0.5">
                                      {formatPrice(subtotal)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="p-4 bg-white border-t border-slate-100">
                        <Button 
                          className="w-full py-4 text-lg rounded-2xl font-extrabold shadow-lg shadow-emerald-500/20" 
                          onClick={() => { handleCheckout(); setIsCartExpanded(false); }}
                          disabled={cart.length === 0 || (paymentType === 'debt' && !selectedCustomer)}
                        >
                          إتمام العملية ({formatPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))})
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <Home className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-bold">إدارة الأصناف</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadInventoryPDF}>
                    <Printer className="w-4 h-4" /> تقرير PDF
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowAddProduct(true)}>
                    <Plus className="w-4 h-4" /> إضافة صنف
                  </Button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث عن منتج..." 
                  className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={inventorySearchTerm}
                  onChange={(e) => setInventorySearchTerm(e.target.value)}
                />
              </div>

              {/* شريط الأقسام الذكي واللوحة الجانبية في إدارة الأصناف */}
              <div className="flex items-center justify-between gap-2 mb-2 bg-slate-100/40 p-2 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1 text-slate-700">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black">أقسام المخزن</span>
                  <span className="text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded-md font-bold text-slate-600">
                    {categories.length - 1} نشط
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCategorySidebarOpen(true)}
                  className="flex items-center gap-1 text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                >
                  <Menu className="w-3 h-3" />
                  <span>تصفح الأقسام بالتفصيل</span>
                </button>
              </div>

              {/* الشريط الأفقي الافتراضي للأقسام السريعة */}
              <div className="flex gap-2 overflow-x-auto pb-1.5 mb-3 no-scrollbar">
                {categories.map((cat, idx) => {
                  const itemsCount = categoryCounts[cat] || 0;
                  return (
                    <button
                      type="button"
                      key={`inv-cat-${cat}-${idx}`}
                      onClick={() => setInventoryCategory(cat)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        inventoryCategory === cat 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 font-bold scale-[1.02]' 
                          : 'bg-white text-slate-650 border border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      {categoryIcons[cat] || <Package className="w-3.5 h-3.5" />}
                      <span>{cat}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                        inventoryCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-55/70 text-slate-500'
                      }`}>
                        {itemsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products
                  .filter(p => (inventoryCategory === 'الكل' || p.category === inventoryCategory) && p.name.includes(inventorySearchTerm))
                  .map((p, idx) => (
                  <Card key={`inv-product-${p.id ?? 'no-id'}-${idx}`} className="group hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden p-0" onClick={() => fetchProductHistory(p)}>
                    <div className={`absolute top-0 right-0 w-1 h-full ${p.stock_quantity <= 5 ? 'bg-red-500' : p.stock_quantity <= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="p-3 pl-4 pr-4 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">{p.name}</p>
                          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${p.stock_quantity <= 5 ? 'bg-red-50 text-red-600' : p.stock_quantity <= 20 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {p.stock_quantity} {p.unit || ''}
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-center w-full border-l border-slate-200 last:border-0 pl-1">
                            <p className="text-[9px] text-slate-400 font-bold mb-0.5">التكلفة</p>
                            <p className="text-[11px] font-bold text-slate-700">{p.cost_price}</p>
                          </div>
                          <div className="text-center w-full border-l border-slate-200 last:border-0 px-1">
                            <p className="text-[9px] text-slate-500 font-bold mb-0.5">إج.التكلفة</p>
                            <p className="text-[11px] font-bold text-slate-800">{formatPrice(p.cost_price * p.stock_quantity)}</p>
                          </div>
                          <div className="text-center w-full border-l border-slate-200 last:border-0 px-1">
                            <p className="text-[9px] text-emerald-600 font-bold mb-0.5">البيع</p>
                            <p className="text-[11px] font-bold text-emerald-700">{p.sale_price}</p>
                          </div>
                          <div className="text-center w-full pr-1">
                            <p className="text-[9px] text-indigo-400 font-bold mb-0.5">تصنيف</p>
                            <p className="text-[10px] font-bold text-indigo-700 truncate w-12 mx-auto" title={p.category}>{p.category}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 transition-opacity mr-2 pr-2 border-r border-slate-100">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setUpdatingStockProduct(p);
                          }} 
                          title="تحديث المخزون"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            p.stock_quantity <= 5 ? 'text-red-600 hover:bg-red-50' : 
                            p.stock_quantity <= 20 ? 'text-amber-600 hover:bg-amber-50' : 
                            'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            verifyAdminPermission('edit_product', () => setEditingProduct(p), '✏️ صلاحية تعديل صنف');
                          }} 
                          title="تعديل الصنف"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            verifyAdminPermission('edit_product', () => {
                              if (window.confirm('هل أنت متأكد من حذف هذا الصنف من المخازن؟')) handleDeleteProduct(p.id!);
                            }, '🗑️ صلاحية حذف صنف');
                          }} 
                          title="حذف الصنف"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <Home className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-bold">الزبائن والديون</h2>
                </div>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowAddCustomer(true)}>
                  <UserPlus className="w-4 h-4" /> زبون جديد
                </Button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث عن زبون..." 
                  className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {customers
                  .filter(c => c.name.includes(customerSearchTerm))
                  .map((c, idx) => (
                    <Card 
                      key={`customer-card-${c.id ?? 'no-id'}-${idx}`} 
                      className="flex justify-between items-center cursor-pointer active:bg-slate-50 p-4 border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-xs"
                      onClick={() => fetchCustomerHistory(c)}
                    >
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-sm text-slate-500">{c.phone}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 font-bold">
                            {c.balance > 0 ? 'الرصيد المستحق (دين)' : c.balance < 0 ? 'رصيد دائن (دفعة مقدمة)' : 'الرصيد خالص'}
                          </p>
                          <p className={`font-bold text-sm ${c.balance > 0 ? 'text-red-500' : c.balance < 0 ? 'text-emerald-600 font-black' : 'text-slate-500'}`}>
                            {c.balance < 0 ? formatPrice(Math.abs(c.balance)) : formatPrice(c.balance)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowPaymentModal(c); }}
                            className={`font-semibold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              c.balance > 0 
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {c.balance > 0 ? 'سداد متبقي' : 'إيداع مقدم'}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); if (confirm('حذف الزبون؟')) handleDeleteCustomer(c.id!); }}
                            className="text-red-400 hover:text-red-600 p-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* عنوان الصفحة مع زر الرجوع للواجهة الرئيسية */}
              <div className="flex items-center gap-2 pb-2">
                <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer" title="الرجوع للواجهة الرئيسية">
                  <Home className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-extrabold text-slate-800">الملاحظات وتصفية مبيعات الصندوق</h3>
              </div>

              {/* قسم الملاحظات والمهام اليومية (أعلى الصفحة الآن) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/80 p-4 rounded-3xl border border-slate-150/60">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h2 className="text-lg font-black text-slate-800">سجل المهام والملاحظات واليوميات بالصندوق</h2>
                      <p className="text-[10px] text-slate-400 font-bold">تسجيل وتدوين التنبيهات، المعاملات، النواقص، والتسليم اليومي لوردية الصندوق</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center gap-2 w-full sm:w-auto text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white font-extrabold text-xs py-2.5 rounded-2xl cursor-pointer" 
                    onClick={() => { setEditingNoteId(null); setNewNote({ title: '', content: '', reminder_date: '', priority: 'normal' }); setShowAddNote(true); }}
                  >
                    <Plus className="w-4 h-4" /> إضافة مهمة / ملاحظة جديدة
                  </Button>
                </div>

                {/* أزرار الفلترة وشريط البحث */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-1 text-right">
                  <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-150/50 w-fit">
                    {[
                      { key: 'all', label: 'الكل', count: notes.length },
                      { key: 'pending', label: 'المعلقة 📝', count: notes.filter(n => !n.is_completed).length },
                      { key: 'completed', label: 'المكتملة ✓', count: notes.filter(n => n.is_completed).length },
                      { key: 'high', label: 'عاجلة وهامة 🚨', count: notes.filter(n => (n.priority || 'normal') === 'high').length }
                    ].map(pill => (
                      <button
                        key={pill.key}
                        onClick={() => setNoteFilter(pill.key as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          noteFilter === pill.key
                            ? 'bg-white text-emerald-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                        }`}
                      >
                        <span>{pill.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                          noteFilter === pill.key ? 'bg-emerald-550/15 text-emerald-700' : 'bg-slate-200/80 text-slate-600'
                        }`}>
                          {pill.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="البحث في العنوان أو محتوى الملاحظات..."
                      value={noteSearchQuery}
                      onChange={(e) => setNoteSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 text-slate-700 font-extrabold transition-all placeholder:text-slate-400 text-right"
                    />
                    {noteSearchQuery && (
                      <button 
                        onClick={() => setNoteSearchQuery('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-350 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* عرض الملاحظات */}
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mb-3">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">لا يوجد ملاحظات أو مهام</h3>
                    <p className="text-slate-400 text-xs">قم بإضافة ملاحظاتك ومهامك اليومية هنا لتذكرها لاحقاً</p>
                  </div>
                ) : (
                  (() => {
                    const filteredNotes = notes.filter(note => {
                      if (noteFilter === 'pending') {
                        if (note.is_completed) return false;
                      } else if (noteFilter === 'completed') {
                        if (!note.is_completed) return false;
                      } else if (noteFilter === 'high') {
                        if ((note.priority || 'normal') !== 'high') return false;
                      }
                      
                      if (noteSearchQuery.trim()) {
                        const q = noteSearchQuery.toLowerCase();
                        return (note.title || '').toLowerCase().includes(q) || (note.content || '').toLowerCase().includes(q);
                      }
                      return true;
                    });

                    if (filteredNotes.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-3xl border border-slate-100/80 shadow-xs">
                          <Search className="w-8 h-8 text-slate-300 mb-2" />
                          <h4 className="text-sm font-bold text-slate-700">لا توجد ملاحظات تطابق بحثك أو تصنيفك</h4>
                          <p className="text-slate-400 text-[10px] mt-0.5">يرجى تعديل الفلتر أو محرك البحث لرؤية النتائج الأخرى</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredNotes.map(note => {
                          const priority = note.priority || 'normal';
                          let pConfig = {
                            badgeBg: 'bg-slate-100 text-slate-600 border border-slate-200/50',
                            borderColor: 'border-r-4 border-r-slate-400',
                            label: '🟢 ملاحظة عامة',
                            bgHover: 'hover:border-slate-300'
                          };
                          if (priority === 'high') {
                            pConfig = {
                              badgeBg: 'bg-red-50 text-red-700 border border-red-100',
                              borderColor: 'border-r-4 border-r-red-500',
                              label: '🔴 عاجل وهام',
                              bgHover: 'hover:border-red-200 hover:shadow-red-50/[0.04]'
                            };
                          } else if (priority === 'info') {
                            pConfig = {
                              badgeBg: 'bg-blue-50 text-blue-700 border border-blue-100',
                              borderColor: 'border-r-4 border-r-blue-500',
                              label: '🔵 حسابات وكاش',
                              bgHover: 'hover:border-blue-200 hover:shadow-blue-50/[0.04]'
                            };
                          } else if (priority === 'warning') {
                            pConfig = {
                              badgeBg: 'bg-amber-50 text-amber-700 border border-amber-100',
                              borderColor: 'border-r-4 border-r-amber-500',
                              label: '🟡 نواقص بضاعة',
                              bgHover: 'hover:border-amber-200 hover:shadow-amber-50/[0.04]'
                            };
                          }

                          return (
                            <Card 
                              key={note.id} 
                              onClick={() => setSelectedNote(note)}
                              className={`relative overflow-hidden group hover:shadow-sm transition-all border border-slate-150/70 bg-white p-4 rounded-2xl flex flex-col justify-between cursor-pointer ${pConfig.borderColor} ${pConfig.bgHover} ${note.is_completed ? 'opacity-70 bg-slate-50/40' : ''}`}
                            >
                              <div className="space-y-3">
                                {/* رأس الكارد */}
                                <div className="flex justify-between items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${pConfig.badgeBg}`}>
                                    {pConfig.label}
                                  </span>
                                  
                                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                    <button 
                                      onClick={() => handleToggleNoteCompletion(note)}
                                      className={`p-1 rounded-lg transition-colors cursor-pointer ${note.is_completed ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                      title={note.is_completed ? "تأشير كغير مكتملة" : "تأشير كمكتملة وسليمة"}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleEditNoteAction(note)} 
                                      className="text-slate-400 hover:text-emerald-600 transition-colors p-1 hover:bg-slate-150 rounded-lg cursor-pointer"
                                      title="تعديل"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteNote(note.id!)} 
                                      className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-slate-150 rounded-lg cursor-pointer"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* العنوان والتفاصيل */}
                                <div className="space-y-1.5 text-right">
                                  <h3 className={`font-black text-sm tracking-tight text-slate-800 leading-snug line-clamp-1 ${note.is_completed ? 'line-through text-slate-400' : ''}`}>
                                    {note.title}
                                  </h3>
                                  <p className="text-slate-500 text-[11px] font-semibold whitespace-pre-wrap break-words leading-relaxed line-clamp-3 text-right">
                                    {note.content}
                                  </p>
                                </div>
                              </div>

                              {/* التواريخ في ذيل الكارد */}
                              <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-[9px] font-black text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDateWithDay(note.created_at)}
                                </span>
                                {note.reminder_date ? (
                                  <span className={`px-1.5 py-0.5 rounded-md font-bold ${note.is_completed ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                    تنبيه: {formatDateWithDay(note.reminder_date)}
                                  </span>
                                ) : (
                                  <span className="text-[8px] opacity-65 text-slate-350">عرض التفاصيل ←</span>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* خط فاصل أنيق ومميز */}
              <div className="border-t border-slate-200/80 my-2"></div>

              {/* قسم مسحوبات الصندوق (السلفيات ومصروفات الكاش) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-150/65 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      💸 مسحوبات وسُلفيات الصندوق الكاش (الدورة الحالية)
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      تسجيل أي مبالغ يسحبها ماسك الصندوق/الموظف للتسديد لاحقاً أو كأتعاب قبل إغلاق الفترة
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      verifyAdminPermission('cash_withdrawal', () => {
                        setWithdrawAmount('');
                        setWithdrawReason('');
                        setWithdrawByWhom('أمين الصندوق');
                        setShowWithdrawModal(true);
                      }, '💸 تسجيل مسحوبات كاش');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] sm:text-xs py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer shadow-xs w-full sm:w-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> تسجيل سحب/سلفة جديدة
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold">إجمالي المسحوبات (الدورة الحالية)</span>
                      <span className="text-xs font-black font-mono text-slate-700">{formatPrice(currentCycleWithdrawalsTotal)}</span>
                    </div>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black">المسحوبات الكلية</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex justify-between items-center ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <span className={`text-[9px] block font-bold ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'text-amber-600' : 'text-slate-400'}`}>المسحوبات غير المسددة (مستحقة للدرج)</span>
                      <span className={`text-xs font-black font-mono ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'text-amber-800' : 'text-slate-500'}`}>{formatPrice(currentCycleUnpaidWithdrawalsTotal)}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'bg-amber-100 text-amber-750 font-black animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                      {currentCycleUnpaidWithdrawalsTotal > 0 ? 'مستحق السداد للدرج ⚠️' : 'خالٍ من العجز والذمم ✅'}
                    </span>
                  </div>
                </div>

                {currentCycleWithdrawals.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-100 rounded-2xl text-[11px] text-slate-400 font-medium bg-slate-50/10">
                    لا توجد أي مسحوبات شخصية أو سلفيات نقدية مسجلة في الدورة الصندوقية الحالية حتى الآن.
                  </div>
                ) : (
                  <div className="border border-slate-150/50 rounded-2xl overflow-hidden shadow-xs bg-white">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                            <th className="p-3.5 text-center">تاريخ وساعة السحب</th>
                            <th className="p-3.5">المستلم / المسؤول</th>
                            <th className="p-3.5">السبب والبيان التوضيحي</th>
                            <th className="p-3.5">المبلغ المسحوب</th>
                            <th className="p-3.5 text-center">حالة السداد للدرج</th>
                            <th className="p-3.5 text-left">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150/60">
                          {currentCycleWithdrawals.map((w, idx) => {
                            return (
                              <tr 
                                key={w.id || idx} 
                                className={`transition-all ${
                                  w.is_repaid 
                                    ? 'bg-slate-50/40 text-slate-500 hover:bg-slate-50' 
                                    : 'bg-white hover:bg-rose-50/[0.04]'
                                }`}
                              >
                                <td className="p-3.5 text-center font-bold text-[10px] text-slate-500 whitespace-nowrap">
                                  {formatDateTimeWithDay(w.created_at)}
                                </td>
                                <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                                  {w.by_whom}
                                </td>
                                <td className="p-3.5 text-slate-650 max-w-[200px] break-words">
                                  <div>
                                    <p className="font-semibold text-slate-700">{w.reason}</p>
                                    {w.is_repaid && w.repay_date && (
                                      <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                        ✓ تم الإرجاع: {formatDateTimeWithDay(w.repay_date)}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5 font-black text-indigo-600 font-mono text-[13px] whitespace-nowrap">
                                  {formatPrice(w.amount)}
                                </td>
                                <td className="p-3.5 text-center whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                                    w.is_repaid 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${w.is_repaid ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                                    {w.is_repaid ? 'تم السداد والصحة' : 'مطلوب للتسديد فوراً'}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                    <button
                                      onClick={() => handleRepayWithdrawal(w.id!)}
                                      className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                        w.is_repaid 
                                          ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700' 
                                          : 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                      title={w.is_repaid ? "تأشير كغير مسدد" : "تأكيد سداد وإرجاع الكاش للصندوق"}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{w.is_repaid ? "تراجع" : "تأكيد إرجاع"}</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWithdrawal(w.id!)}
                                      className="p-1.5 bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                                      title="حذف المسحوبة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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

              {/* تصفية مبيعات المتجر ومطابقة الصندوق (أسفل الملاحظات والمسحوبات الآن) */}
              <div className="bg-gradient-to-l from-violet-600 to-indigo-600 text-white rounded-3xl p-5 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 animate-pulse text-violet-200" />
                      <h3 className="text-lg font-bold">تسوية وتصفية مبيعات الصندوق</h3>
                    </div>
                    <p className="text-violet-100 text-xs">
                      {lastSettleDate 
                        ? `الدورة الحالية منذ: ${formatDateTimeWithDay(lastSettleDate)}` 
                        : 'الدورة الأولى: لم يتم إجراء تصفية مبيعات سابقة بعد'}
                    </p>
                  </div>
                  <Button 
                    className="bg-white text-violet-700 hover:bg-violet-50 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold py-2.5 px-4 shadow-sm w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer"
                    onClick={() => {
                      verifyAdminPermission('settlement', () => {
                        setDeliveredSettleAmount(String(activeOutstandingCash || ''));
                        setSettleNotes('');
                        setShowSettleModal(true);
                      }, '⚖️ تصفية الصندوق وتسوية الوردية');
                    }}
                  >
                    ⚖️ إجراء تصفية وتدوير لليوم الصندوقي
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5 space-y-0.5">
                    <p className="text-white/70 text-[10px] font-bold">المبيعات المتوقعة (كاش)</p>
                    <p className="font-bold text-sm sm:text-base font-mono text-white">{formatPrice(currentCycleCashTotal)}</p>
                    <span className="text-[9px] text-white/60 block font-mono leading-tight">نقدي: {formatPrice(currentCycleCashSales)} + تسديد: {formatPrice(currentCycleDebtPaymentsTotal)}</span>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
                    <p className="text-white/70 text-[10px] font-bold">عجز مرحل من سابق</p>
                    <p className="font-bold text-sm sm:text-base font-mono text-rose-200">{formatPrice(carriedForwardDeficit)}</p>
                  </div>
                  <div className="bg-white/15 rounded-2xl p-3 border border-white/10 md:scale-[1.03] shadow-md ring-1 ring-white/20 bg-indigo-500/30 relative">
                    <p className="text-yellow-250 text-[10px] font-extrabold text-cyan-205">🎯 المستهدف الكلي للتسوية</p>
                    <p className="font-extrabold text-sm sm:text-base font-mono text-yellow-200">{formatPrice(activeOutstandingCash)}</p>
                    {currentCycleSupplierPaymentsTotal > 0 && (
                      <span className="text-[8px] text-white/50 block leading-tight font-bold">تتضمن خصم {formatPrice(currentCycleSupplierPaymentsTotal)}<br/>دفعات للموردين بالدورة</span>
                    )}
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5 col-span-2 sm:col-span-1">
                    <p className="text-white/70 text-[10px] font-bold">مبيعات لم تسدد بعد</p>
                    <p className="font-bold text-sm sm:text-base font-mono text-amber-200">{formatPrice(currentCycleDebtTotal)}</p>
                  </div>
                </div>

                {currentCycleUnpaidWithdrawalsTotal > 0 && (
                  <div className="bg-black/15 border border-white/10 rounded-2xl p-3 text-[10px] sm:text-xs space-y-1 text-white">
                    <div className="flex justify-between items-center font-bold">
                      <span className="flex items-center gap-1">💸 مسحوبات معلقة السداد (سلف) بالدورة:</span>
                      <span className="font-mono text-rose-300 font-extrabold">-{formatPrice(currentCycleUnpaidWithdrawalsTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-1.5 font-black text-yellow-200">
                      <span>السيولة النقدية المتوقع جردها بداخل الصندوق:</span>
                      <span className="font-mono text-xs sm:text-sm">{formatPrice(Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* سجل مطابقات الصندوق والتسويات السابقة */}
              {salesSettlements.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 px-1">
                    💼 سجل التسويات ومطابقات الصندوق السابقة ({salesSettlements.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {salesSettlements.map((settlement) => {
                      const isDeficit = settlement.difference < 0;
                      const isExcess = settlement.difference > 0;
                      return (
                        <Card key={settlement.id} className="border border-slate-100 hover:border-violet-100 transition-all p-4 relative flex flex-col justify-between bg-white shadow-xs rounded-2xl">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  #{settlement.id} تسوية مبيعات
                                </span>
                                <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                                  {formatDateTimeWithDay(settlement.created_at)}
                                </p>
                              </div>
                              <button 
                                onClick={() => handleDeleteSettlement(settlement.id!)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                                title="حذف سجل التصفية"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-slate-50/60 p-2 rounded-xl text-center border border-slate-100/50">
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold">المستهدف (كاش)</p>
                                <p className="text-xs font-bold font-mono text-slate-700">{formatPrice(settlement.total_sales)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold">المسلم فعلياً</p>
                                <p className="text-xs font-bold font-mono text-slate-800">{formatPrice(settlement.delivered_amount)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-400 font-bold">حالة الصندوق</p>
                                <p className={`text-xs font-bold font-mono ${isDeficit ? 'text-red-650 font-semibold' : isExcess ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}`}>
                                  {settlement.difference === 0 ? 'مطابق ✅' : formatPrice(settlement.difference)}
                                </p>
                              </div>
                            </div>

                            {settlement.cash_withdrawals !== undefined && settlement.cash_withdrawals > 0 && (
                              <div className="bg-amber-50/70 border border-amber-200/50 text-amber-900 p-2.5 rounded-xl text-[10px] sm:text-xs font-bold flex justify-between items-center shrink-0">
                                <span className="opacity-90 font-black">💸 مسحوبات الصندوق (سلفيات مقيدة للتسديد):</span>
                                <span className="font-mono text-xs font-black">{formatPrice(settlement.cash_withdrawals)}</span>
                              </div>
                            )}

                            {settlement.notes && (
                              <div className="text-xs bg-slate-100/50 text-slate-600 p-2 rounded-xl border border-slate-200/20 italic">
                                📝 {settlement.notes}
                              </div>
                            )}

                            {isDeficit && (
                              <div className="bg-red-50/70 text-red-800 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-red-105/40">
                                <AlertCircle className="w-3.5 h-3.5 text-red-550" />
                                <span>عجز مالي متبقي بقيمة: {formatPrice(Math.abs(settlement.difference))}</span>
                              </div>
                            )}
                            {isExcess && (
                              <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-emerald-100/60">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>زيادة في الصندوق بقيمة: {formatPrice(settlement.difference)}</span>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'suppliers' && (
            <motion.div 
              key="suppliers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <Home className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight text-right">إدارة الموردين والشركات</h2>
                </div>
                <Button variant="outline" className="flex items-center gap-2 rounded-2xl" onClick={() => setShowAddSupplier(true)}>
                  <Plus className="w-4 h-4" /> إضافة مورد جديد
                </Button>
              </div>

              <div className="bg-amber-100/30 border border-amber-100 p-3 rounded-2xl mb-4">
                 <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                   💡 هنا يمكنك تصفية حسابات الموردين بالتكلفة. عند بيع أي منتج مرتبط بمورد، يتم إضافة "سعر التكلفة" تلقائياً لرصيد المورد المستحق.
                 </p>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-3.5 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث عن مورد بالاسم..." 
                  className="w-full p-3.5 pr-11 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all text-right"
                  value={supplierSearchTerm}
                  onChange={(e) => setSupplierSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {suppliers
                  .filter(s => s.name.includes(supplierSearchTerm))
                  .map((s, idx) => (
                  <Card 
                    key={`supplier-card-list-${s.id ?? 'no-id'}-${idx}`} 
                    className="hover:border-amber-200 transition-all cursor-pointer p-0 overflow-hidden bg-white border border-slate-100/60 shadow-xs" 
                    onClick={() => fetchSupplierHistory(s)}
                  >
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-xs border border-amber-100/50">
                          {s.name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-slate-800">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-bold">{s.phone || 'لم يسجل رقم هاتف'}</p>
                        </div>
                      </div>
                      <div className="text-left bg-slate-50/70 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100/60 transition-colors hover:bg-slate-100/70">
                        <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">المستحق للمورد (بالتكلفة)</p>
                        <p className={`font-mono font-black text-sm ${s.balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                          {formatPrice(s.balance)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {suppliers.filter(s => s.name.includes(supplierSearchTerm)).length === 0 && (
                  <div className="text-center py-20">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">لم يتم العثور على موردين.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowAddSupplier(true)}>أضف موردك الأول الآن</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'smart-import' && (
            <motion.div key="smart-import" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <SmartImport 
                storeName={storeName}
                onGoBack={() => setActiveTab('dashboard')}
                onImported={() => {
                  setTimeout(() => {
                    exportData();
                  }, 800);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <Home className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800">إعدادات النظام</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Edit className="w-5 h-5" />
                    <h3 className="font-bold">إعدادات المتجر</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">اسم النشاط التجاري</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all"
                      />
                      <Button onClick={() => updateStoreName(storeName)}>حفظ</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">العملة</label>
                    <div className="flex gap-2">
                      <select 
                        value={currency}
                        onChange={(e) => updateCurrency(e.target.value)}
                        className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="ر.ي">ريال يمني (ر.ي)</option>
                        <option value="ر.س">ريال سعودي (ر.س)</option>
                        <option value="$">دولار أمريكي ($)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">تقريب سعر البيع (إلى أقرب)</label>
                    <div className="flex gap-2">
                      <select 
                        value={roundingFactor || 0}
                        onChange={(e) => updateRoundingFactor(Number(e.target.value) || null)}
                        className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value={0}>بدون تقريب</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card className="space-y-4 border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-emerald-500/10 text-emerald-700 text-[9px] font-extrabold px-2.5 py-1 rounded-br-2xl">
                    مستحسن 🔒
                  </div>
                  <div className="flex items-center gap-2 text-slate-800 mb-1">
                    <div className="p-2 bg-slate-100 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base">نظام حماية وإدارة صلاحيات الكاشير</h3>
                      <p className="text-[10px] text-slate-400">تأمين العمليات الحساسة بررمز مرور خاص بالمدير</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">حالة نظام الحماية والتقييد:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${permissionsEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-slate-100 text-slate-500'}`}>
                      {permissionsEnabled ? 'نشط ومحمي 🔒' : 'معطل (مفتوح بالكامل)'}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button 
                      onClick={() => {
                        verifyAdminPermission('settings', () => {
                          setShowPermissionsConfigModal(true);
                        }, '⚙️ تهيئة إعدادات الأمان والصلاحيات');
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold flex items-center justify-center gap-2 rounded-xl transition-all shadow-xs cursor-pointer text-xs py-3"
                    >
                      <span>🔑 إعداد الصلاحيات وتغيير الرمز</span>
                    </Button>
                  </div>
                </Card>

                <Card className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Database className="w-5 h-5" />
                    <h3 className="font-bold">تصدير واستيراد البيانات (JSON)</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="flex items-center justify-center gap-2" onClick={exportData}>
                      <Download className="w-4 h-4" />
                      تصدير نسخة احتياطية (JSON)
                    </Button>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={importData}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        استيراد نسخة احتياطية
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="space-y-4 border-violet-100 bg-gradient-to-br from-white to-violet-50/20 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-violet-750">
                    <div className="p-1.5 bg-violet-50 text-violet-605 rounded-xl border border-violet-100/50">
                      <Sparkles className="w-5 h-5 text-violet-605 animate-pulse" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800">الاستيراد الذكي بالـ AI والملفات 🎯</h3>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    هل تمتلك مبيعات، ديون زبائن، أو قوائم بضائع مكتوبة على الدفتر أو في ملفات إكسل؟ قم بالتقاط صورة أو كتابة النص وسيتولى الذكاء الاصطناعي معالجتها وفكها فوراً.
                  </p>
                  <Button 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center gap-2 rounded-xl transition-all"
                    onClick={() => setActiveTab('smart-import')}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    تحميل واستيراد البيانات الآن
                  </Button>
                </Card>

                <Card className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-violet-700">
                      <Database className="w-5 h-5" />
                      <h3 className="font-bold">النسخ الاحتياطي التلقائي (قاعدة بيانات النظام)</h3>
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-full ${
                      isBackupSyncing 
                        ? 'bg-violet-50 text-violet-600 animate-pulse' 
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isBackupSyncing ? 'bg-violet-500 animate-ping' : 'bg-emerald-500'}`} />
                      {isBackupSyncing ? 'جاري الحفظ للتلقائي...' : 'آمن ومحدث تلقائياً'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-500 leading-relaxed">
                    يقوم النظام بحفظ كافة البيانات حياً بشكل مباشر على جهازك المستضيف في ملف نظام آمن يحمل اسم <code className="bg-slate-50 text-violet-600 font-mono px-1 rounded font-bold">قاعدة بيانات النظام.json</code> عند أي حركة بيع أو تعديل.
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>حالة الملف التلقائي:</span>
                      <span className="font-bold text-slate-800">{autoBackupFileStatus?.exists ? 'موجود ونشط ونشط حياً' : 'موجود (متصل بالأجهزة)'}</span>
                    </div>
                    {autoBackupFileStatus?.exists && (
                      <>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>حجم قاعدة البيانات التلقائية:</span>
                          <span className="font-mono text-slate-800 font-bold">
                            {(autoBackupFileStatus.size ? autoBackupFileStatus.size / 1024 : 1.2).toFixed(2)} KB
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>تاريخ آخر حفظ وتحديث تلقائي:</span>
                          <span className="text-slate-800 font-bold font-mono">
                            {autoBackupFileStatus.lastModified ? new Date(autoBackupFileStatus.lastModified).toLocaleTimeString('ar-SA') : 'الآن'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 text-violet-600 border-violet-200 hover:bg-violet-50" 
                    onClick={forceLocalDiskBackup}
                    disabled={isBackupSyncing}
                  >
                    <RefreshCw className={`w-4 h-4 ${isBackupSyncing ? 'animate-spin' : ''}`} />
                    تحديث وحفظ مع قاعدة بيانات النظام بشكل فوري
                  </Button>
                </Card>


                <Card className="space-y-4 border-red-100">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <RefreshCw className="w-5 h-5" />
                    <h3 className="font-bold">إعادة الضبط</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    سيؤدي هذا الإجراء إلى حذف جميع البيانات المسجلة (المنتجات، الزبائن، المبيعات) والعودة للحالة الأولية.
                  </p>
                  <Button variant="danger" className="w-full" onClick={resetDatabase}>
                    إعادة ضبط المصنع
                  </Button>
                </Card>

                <Card className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Package className="w-5 h-5" />
                    <h3 className="font-bold">حول النظام</h3>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>إصدار النظام:</span>
                      <span className="font-mono">v2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>نوع قاعدة البيانات:</span>
                      <span className="font-mono">IndexedDB (Local)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>حالة التثبيت:</span>
                      <span className={deferredPrompt ? "text-amber-600" : "text-emerald-600"}>
                        {deferredPrompt ? "جاهز للتثبيت" : "مثبت / يعمل عبر المتصفح"}
                      </span>
                    </div>
                  </div>
                  {deferredPrompt && (
                    <Button className="w-full" onClick={handleInstall}>تثبيت التطبيق الآن</Button>
                  )}
                </Card>

                <Card className="space-y-4 border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Camera className="w-5 h-5" />
                    <h3 className="font-bold">الصلاحيات والكاميرا</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    استخدم هذا الزر لطلب صلاحية الوصول إلى الكاميرا إذا كنت تواجه مشكلة في تشغيل الماسح الضوئي.
                  </p>
                  <Button variant="outline" className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={requestGlobalCameraPermission}>
                    السماح بالوصول للكاميرا
                  </Button>
                </Card>

                {/* كرت حالة الاشتراك وتفعيل الترخيص */}
                <Card className="space-y-4 border-slate-200">
                  <div 
                    onClick={() => {
                      setDevClickCount(prev => {
                        const next = prev + 1;
                        if (next >= 5) {
                          setShowHiddenAdminInput(true);
                          showNotification('تم إظهار بوابة المالك السرية 🔓، الرجاء إدخال الرمز لتأكيد هويتك.', 'success');
                          return 0;
                        }
                        return next;
                      });
                    }}
                    className="flex items-center gap-2 text-indigo-700 mb-2 cursor-pointer select-none"
                    title="تفعيل ترخيص البرنامج"
                  >
                    <Key className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <h3 className="font-bold text-slate-800">تفعيل ترخيص البرنامج</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2 text-right">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">معرف هذا الجهاز:</span>
                        <div className="flex items-center gap-2 font-mono text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          <span>{deviceID}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(deviceID);
                              showNotification('تم نسخ معرف الجهاز بنجاح!');
                            }}
                            className="text-indigo-500 hover:text-indigo-700 p-0.5 hover:bg-indigo-100/50 rounded transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold">حالة التفعيل:</span>
                        {isActivated ? (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full">مفعل بنجاح ✅</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 rounded-full">نسخة تجريبية ⏳ ({trialDaysLeft} أيام متبقية)</span>
                        )}
                      </div>

                      {isActivated && activationDetails && (
                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                          <span>تاريخ انتهاء الصلاحية:</span>
                          <span className="font-mono font-bold text-slate-700">
                            {activationDetails.expiresAt === 'lifetime' ? 'مدى الحياة (دائم)' : new Date(activationDetails.expiresAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isActivated ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 block text-right">أدخل مفتاح التفعيل المستلم:</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={activationKeyInput}
                            onChange={(e) => {
                              setActivationKeyInput(e.target.value);
                              setActivationError('');
                            }}
                            placeholder="LIC-XXXX-XXXX-XXXX-XXXX"
                            className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 font-mono text-center text-sm rounded-xl focus:border-indigo-500 outline-none transition-all uppercase"
                          />
                          <Button onClick={() => handleActivateApp()} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">تفعيل</Button>
                        </div>
                        {activationError && (
                          <p className="text-[11px] text-rose-600 font-bold text-center mt-1">{activationError}</p>
                        )}
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleDeactivateApp}>
                        إلغاء تفعيل الترخيص الحالي
                      </Button>
                    )}

                    {showHiddenAdminInput && !isDeveloperMode && (
                      <div className="bg-slate-950 p-4 border border-indigo-950 rounded-2xl space-y-3 mt-4 text-right">
                        <label className="text-xs font-bold text-indigo-300 block">بوابة المالك - أدخل الرمز السري لجهازك:</label>
                        <div className="flex gap-2">
                          <input 
                            type="password"
                            value={developerPinInput}
                            onChange={(e) => {
                              setDeveloperPinInput(e.target.value);
                              setDeveloperPinError('');
                            }}
                            placeholder="••••••"
                            className="flex-1 p-2 bg-slate-900 text-white font-mono placeholder-slate-700 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-center text-sm"
                          />
                          <button 
                            onClick={handleVerifyDeveloperPIN}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            تأكيد 🔑
                          </button>
                        </div>
                        {developerPinError && (
                          <p className="text-[10px] text-rose-500 font-bold">{developerPinError}</p>
                        )}
                        <button 
                          onClick={() => {
                            setShowHiddenAdminInput(false);
                            setDeveloperPinError('');
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-300 block mx-auto mt-1"
                        >
                          إغلاق البوابة
                        </button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* كرت مولد مفاتيح التفعيل - للمالك */}
                {isDeveloperMode && (
                  <Card className="space-y-4 border-indigo-200 shadow-md shadow-indigo-500/5 bg-slate-50 border-2">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2 mb-2">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800">أداة توليد مفاتيح الترخيص (للمطور/المالك)</h3>
                      </div>
                      <button 
                        onClick={() => {
                          setIsDeveloperMode(false);
                          setShowHiddenAdminInput(false);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                      >
                        قفل الأداة وإخفاءها 🔒
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Developer Sub-Tabs */}
                      <div className="grid grid-cols-2 p-1 bg-slate-150 rounded-xl border border-slate-200">
                        <button 
                          onClick={() => setActiveDevTab('generator')}
                          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${activeDevTab === 'generator' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          🛠️ توليد يدوي مباشر
                        </button>
                        <button 
                          onClick={() => setActiveDevTab('requests')}
                          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center relative ${activeDevTab === 'requests' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          📡 طلبات التفعيل السحابية
                          {allCloudRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[9px] w-5.5 h-5.5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                              {allCloudRequests.filter(r => r.status === 'pending').length}
                            </span>
                          )}
                        </button>
                      </div>

                      {activeDevTab === 'requests' ? (
                        /* Cloud Requests Dashboard */
                        <div className="space-y-3">
                          {allCloudRequests.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-bold">
                              لا توجد أي طلبات تفعيل سحابية في السحابة حالياً.
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                              {allCloudRequests.map((req) => {
                                const selectedDuration = requestDurations[req.deviceId] || 365;
                                return (
                                  <div key={req.deviceId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-right">
                                    {/* Request Header */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <button 
                                          onClick={() => handleDeleteCloudRequest(req.deviceId)}
                                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                          title="حذف من السحابة"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-2 justify-end">
                                          {req.status === 'pending' && <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 rounded-full">معلق ⏳</span>}
                                          {req.status === 'approved' && <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full">موافق ومفعّل ✅</span>}
                                          {req.status === 'rejected' && <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-700 rounded-full">مرفوض ❌</span>}
                                          <h4 className="font-bold text-slate-800 text-sm">{req.storeName}</h4>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold">
                                          تاريخ الطلب: {new Date(req.requestedAt).toLocaleString('ar-SA')}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Phone & Device ID Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-150">
                                      <div className="flex justify-between items-center sm:border-l sm:border-slate-100 sm:pl-2">
                                        <span className="font-mono font-bold text-slate-700">{req.phone || 'غير مسجل'}</span>
                                        <span className="font-bold text-slate-400">الهاتف:</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1 font-mono text-[11px] font-extrabold text-indigo-600">
                                          <span>{req.deviceId}</span>
                                          <button 
                                            onClick={() => {
                                              navigator.clipboard.writeText(req.deviceId);
                                              showNotification('تم نسخ معرف الجهاز!');
                                            }}
                                            className="text-slate-400 hover:text-indigo-600 p-0.5"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <span className="font-bold text-slate-400">معرّف الجهاز:</span>
                                      </div>
                                    </div>

                                    {/* Action Fields based on status */}
                                    {req.status === 'pending' ? (
                                      <div className="space-y-3 pt-1 border-t border-slate-100">
                                        <div className="flex items-center gap-2 justify-end">
                                          <select 
                                            value={selectedDuration}
                                            onChange={(e) => setRequestDurations({
                                              ...requestDurations,
                                              [req.deviceId]: Number(e.target.value)
                                            })}
                                            className="p-2 text-xs bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
                                          >
                                            <option value={30}>شهر (30 يوم)</option>
                                            <option value={90}>3 أشهر (90 يوم)</option>
                                            <option value={180}>6 أشهر (180 يوم)</option>
                                            <option value={365}>سنة (365 يوم)</option>
                                            <option value={9999}>مدى الحياة ♾️</option>
                                          </select>
                                          <label className="text-xs font-bold text-slate-500">مدة الترخيص للعميل:</label>
                                        </div>

                                        <div className="flex gap-2">
                                          <button 
                                            onClick={() => handleRejectCloudRequest(req.deviceId)}
                                            className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                          >
                                            رفض الطلب ❌
                                          </button>
                                          <button 
                                            onClick={() => handleApproveCloudRequest(req, selectedDuration)}
                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                                          >
                                            موافقة وتفعيل تلقائي ✅
                                          </button>
                                        </div>
                                      </div>
                                    ) : req.status === 'approved' ? (
                                      <div className="space-y-2 pt-1 border-t border-slate-100 text-right">
                                        <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between font-mono text-[11px] text-indigo-700 font-extrabold select-all">
                                          <span>{req.licenseKey}</span>
                                          <button 
                                            onClick={() => {
                                              navigator.clipboard.writeText(req.licenseKey || '');
                                              showNotification('تم نسخ الترخيص!');
                                            }}
                                            className="text-indigo-600 hover:bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]"
                                          >
                                            نسخ
                                          </button>
                                        </div>
                                        <div className="flex gap-2 text-right">
                                          {req.durationDays && (
                                            <p className="text-[10px] text-slate-400 font-bold self-center">
                                              • الصلاحية المصدرة: {req.durationDays === 9999 ? 'مدى الحياة' : `${req.durationDays} يوم`}
                                            </p>
                                          )}
                                          <button 
                                            onClick={() => handleRejectCloudRequest(req.deviceId)}
                                            className="mr-auto py-1 px-3 bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                          >
                                            إلغاء وتجميد التفعيل 🔒
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Rejected Status */
                                      <div className="pt-1 border-t border-slate-100 text-left">
                                        <button 
                                          onClick={() => handleApproveCloudRequest(req, 365)}
                                          className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                        >
                                          إعادة تفعيل وترخيص 📡
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Manual Direct Generator */
                        <>
                          {!generatedKeyResult && !generatorDeviceIDInput && !isActivated && (
                            <p className="text-xs text-slate-500 leading-relaxed text-right">
                              تتيح لك هذه الأداة بصفتك مالك البرنامج توليد رموز تفعيل مخصصة لعملائك لتباع لهم بشكل دائم أو اشتراكات شهرية وسنوية.
                            </p>
                          )}

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-600 block text-right">معرّف جهاز العميل (Device ID):</label>
                              <input 
                                type="text"
                                value={generatorDeviceIDInput}
                                onChange={(e) => setGeneratorDeviceIDInput(e.target.value)}
                                placeholder="GR-XXXX-XXXX-XXXX"
                                className="w-full p-3 bg-slate-50 border-2 border-slate-100 font-mono text-center text-sm rounded-xl focus:border-indigo-500 outline-none transition-all uppercase"
                              />
                            </div>

                            <div className="space-y-2 text-right">
                              <label className="text-xs font-bold text-slate-600 block">مدة صلاحية الترخيص:</label>
                              <select 
                                value={generatorDuration}
                                onChange={(e) => setGeneratorDuration(Number(e.target.value))}
                                className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-right font-bold text-slate-700"
                              >
                                <option value={30}>شهر واحد (30 يوم)</option>
                                <option value={90}>3 أشهر (90 يوم)</option>
                                <option value={180}>6 أشهر (180 يوم)</option>
                                <option value={365}>سنة كاملة (365 يوم)</option>
                                <option value={9999}>مدى الحياة (دائم دبلوماسي)</option>
                              </select>
                            </div>

                            <Button onClick={handleGenerateLicense} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold">
                              🛠️ توليد رمز تفعيل العميل
                            </Button>

                            {generatedKeyResult && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black text-indigo-700 text-right uppercase">مفتاح التفعيل المولد للعميل:</p>
                                <div className="flex items-center justify-between bg-white border border-indigo-200 p-2.5 rounded-xl">
                                  <span className="font-mono font-black text-sm text-indigo-800 select-all">{generatedKeyResult}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(generatedKeyResult);
                                      showNotification('تم نسخ مفتاح التفعيل الجديد!');
                                    }}
                                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>نسخ</span>
                                  </button>
                                </div>
                                <p className="text-[9px] text-indigo-600 leading-normal text-right mt-1 font-bold">
                                  * أرسل هذا الرمز لعميلك. سيفعل الرمز هذا التطبيق على جهازه للمدة المحددة بالاعتماد على معرّف جهازه الفريد.
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'analytics' && (
            <SmartAnalytics 
              currency={currency} 
              formatPrice={formatPrice} 
              onGoBack={() => setActiveTab('dashboard')} 
            />
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                    <Home className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-bold">سجل المبيعات</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="بحث برقم الطلب، الزبون، أو الملاحظة..." 
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <select 
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">كل الطلبات</option>
                    <option value="cash">نقدي (كاش)</option>
                    <option value="debt">آجل (دين)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {enrichedSales
                  .filter(s => {
                    const matchesSearch = s.customer_name?.includes(historySearchTerm) || 
                                          s.notes?.includes(historySearchTerm) || 
                                          String(s.id).includes(historySearchTerm);
                    const matchesFilter = historyFilter === 'all' || s.payment_type === historyFilter;
                    return matchesSearch && matchesFilter;
                  })
                  .map((s, idx) => (
                  <div key={`sale-card-${s.id ?? 'no-id'}-${idx}`} className={`relative group ${expandedSaleId === s.id ? 'z-30' : 'z-10'} transition-all duration-200`}>
                    <div className="absolute left-6 top-6 bottom-[-1.5rem] w-0.5 bg-slate-100 -z-10 group-last:hidden" />
                    <Card className={`overflow-hidden border transition-all duration-300 ${expandedSaleId === s.id ? 'border-emerald-400 bg-white shadow-xl scale-[1.01]' : 'border-slate-100/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:border-emerald-200 bg-white'}`}>
                      <div 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 cursor-pointer ${expandedSaleId === s.id ? 'bg-slate-50/50' : 'bg-white'}`}
                        onClick={() => handleExpandSale(s.id!)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border-[3px] border-white shadow-sm transition-transform group-hover:scale-110 ${s.payment_type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {s.payment_type === 'cash' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-slate-800">{s.customer_name}</p>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold leading-none">#{s.id}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              {formatDateTimeWithDay(s.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0 pl-1">
                          {s.notes && (
                            <div className="hidden sm:flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg" title={s.notes}>
                              <FileText className="w-3 h-3" />
                              <p className="text-[10px] max-w-[100px] truncate">{s.notes}</p>
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-bold text-sm text-emerald-700">{formatPrice(s.total_amount)}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-400">{s.payment_type === 'cash' ? 'دفع نقدي' : 'آجل (دين)'}</p>
                          </div>
                          
                          <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 sm:border-r border-slate-200 sm:pr-3 sm:mr-1 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); printReceipt(s); }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="طباعة"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                verifyAdminPermission('delete_sale', () => handleRefundSale(s.id!), '🔄 إلغاء وعكس مبيعات الفاتورة');
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="إلغاء العملية"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <ChevronLeft className={`w-4 h-4 text-slate-400 transition-transform ${expandedSaleId === s.id ? 'rotate-[270deg]' : 'rotate-180'}`} />
                          </div>
                        </div>
                        {/* Mobile Notes */}
                        {s.notes && (
                          <div className="sm:hidden mt-2 flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1.5 rounded-lg w-full">
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            <p className="text-[10px] line-clamp-1">{s.notes}</p>
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {expandedSaleId === s.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 bg-slate-50/80"
                          >
                            <div className="p-3 space-y-1.5">
                              {expandedSaleItems.length > 0 ? (
                                <>
                                  <div className="grid grid-cols-4 gap-3 px-3 py-1.5 object-cover bg-slate-200/50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <div className="col-span-2">المنتج</div>
                                    <div className="text-center">الكمية</div>
                                    <div className="text-left">الإجمالي</div>
                                  </div>
                                  {expandedSaleItems.map((item, idx) => (
                                    <div key={`expanded-sale-item-${item.product_id}-${idx}`} className="grid grid-cols-4 gap-3 px-3 py-1.5 border-b border-slate-200/50 last:border-0 text-xs items-center hover:bg-white rounded-lg transition-colors">
                                      <div className="col-span-2 font-bold text-slate-700">{item.product_name}</div>
                                      <div className="text-center font-bold bg-white px-2 py-0.5 mx-auto rounded-md flex items-center justify-center border border-slate-100 min-w-[1.75rem] text-[11px] whitespace-nowrap">{item.quantity} {item.product_unit || ''}</div>
                                      <div className="text-left font-bold text-emerald-600">{formatPrice(item.price_at_sale * item.quantity)}</div>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="text-center py-6 flex flex-col items-center justify-center gap-2">
                                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-xs text-slate-500 font-bold">جاري تحميل الأصناف...</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              key="modal-notification"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-0 left-4 right-4 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md mx-auto ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
            >
              {notification.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
              <p className="font-bold">{notification.message}</p>
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
                  <Button className="flex-1" variant="secondary" onClick={() => setConfirmAction(null)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showAddProduct && (
            <div key="modal-add-product" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold">إضافة صنف جديد</h3>
                <input placeholder="اسم المنتج" className="w-full p-3 bg-slate-100 rounded-xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <div className="flex gap-2">
                  <input 
                    placeholder="رقم الباركود (اختياري)" 
                    className="flex-1 p-3 bg-slate-100 rounded-xl text-left font-mono" 
                    value={newProduct.barcode || ''} 
                    onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => { setScannerMode('add-product'); setIsScannerOpen(true); }}
                    className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold text-xs"
                    title="مسح من الكاميرا"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>مسح</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">سعر التكلفة</label>
                    <input 
                      type="number" 
                      placeholder="التكلفة" 
                      className="w-full p-2.5 bg-slate-100 rounded-xl text-center text-sm font-semibold" 
                      value={newProduct.cost} 
                      onChange={e => handleAddCostChange(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">نسبة الربح %</label>
                    <input 
                      type="number" 
                      placeholder="%" 
                      className="w-full p-2.5 bg-indigo-50 text-indigo-700 placeholder-indigo-300 rounded-xl text-center text-sm font-bold border border-indigo-100 focus:outline-none focus:ring-1 focus:ring-indigo-400" 
                      value={addProfitPercent} 
                      onChange={e => handleAddProfitPercentChange(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">سعر البيع</label>
                    <input 
                      type="number" 
                      placeholder="البيع" 
                      className="w-full p-2.5 bg-emerald-50 text-emerald-700 placeholder-emerald-300 rounded-xl text-center text-sm font-bold border border-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-400" 
                      value={newProduct.sale} 
                      onChange={e => handleAddSaleChange(e.target.value)} 
                    />
                  </div>
                </div>
                <input type="number" placeholder="الكمية المتوفرة" className="w-full p-3 bg-slate-100 rounded-xl" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                <input 
                  list="categories-list"
                  placeholder="الفئة (مثال: ألبان)" 
                  className="w-full p-3 bg-slate-100 rounded-xl" 
                  value={newProduct.category} 
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                />
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">المورد</label>
                  <select 
                    className="w-full p-3 bg-slate-100 rounded-xl text-sm"
                    value={newProduct.supplier_id || ''}
                    onChange={e => setNewProduct({...newProduct, supplier_id: e.target.value ? Number(e.target.value) : undefined} as any)}
                  >
                    <option value="">اختار المورد (اختياري)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <datalist id="categories-list">
                  {categories.filter(c => c !== 'الكل').map((c, idx) => <option key={`cat-opt-${c}-${idx}`} value={c} />)}
                </datalist>
                <input 
                  list="units-list"
                  placeholder="الوحدة (مثال: حبة، كرتون، كيلو) - اختياري" 
                  className="w-full p-3 bg-slate-100 rounded-xl" 
                  value={newProduct.unit} 
                  onChange={e => setNewProduct({...newProduct, unit: e.target.value})} 
                />
                <datalist id="units-list">
                  <option value="حبة" />
                  <option value="كرتون" />
                  <option value="كيلو" />
                  <option value="كيس" />
                  <option value="شد" />
                  <option value="علبة" />
                  <option value="جرام" />
                  <option value="متر" />
                </datalist>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleAddProduct}>حفظ</Button>
                  <Button variant="secondary" onClick={() => setShowAddProduct(false)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
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
            <div key="modal-editing-product" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold">تعديل صنف: {editingProduct.name}</h3>
                <input placeholder="اسم المنتج" className="w-full p-3 bg-slate-100 rounded-xl" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <div className="flex gap-2">
                  <input 
                    placeholder="رقم الباركود (اختياري)" 
                    className="flex-1 p-3 bg-slate-100 rounded-xl text-left font-mono" 
                    value={editingProduct.barcode || ''} 
                    onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => { setScannerMode('edit-product'); setIsScannerOpen(true); }}
                    className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold text-xs"
                    title="مسح من الكاميرا"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>مسح</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">سعر التكلفة</label>
                    <input 
                      type="number" 
                      placeholder="التكلفة" 
                      className="w-full p-2.5 bg-slate-100 rounded-xl text-center text-sm font-semibold" 
                      value={editCostStr} 
                      onChange={e => handleEditCostChange(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">نسبة الربح %</label>
                    <input 
                      type="number" 
                      placeholder="%" 
                      className="w-full p-2.5 bg-indigo-50 text-indigo-700 placeholder-indigo-300 rounded-xl text-center text-sm font-bold border border-indigo-100 focus:outline-none focus:ring-1 focus:ring-indigo-400" 
                      value={editProfitPercent} 
                      onChange={e => handleEditProfitPercentChange(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">سعر البيع</label>
                    <input 
                      type="number" 
                      placeholder="البيع" 
                      className="w-full p-2.5 bg-emerald-50 text-emerald-700 placeholder-emerald-300 rounded-xl text-center text-sm font-bold border border-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-400" 
                      value={editSaleStr} 
                      onChange={e => handleEditSaleChange(e.target.value)} 
                    />
                  </div>
                </div>
                <input type="number" placeholder="الكمية المتوفرة" className="w-full p-3 bg-slate-100 rounded-xl" value={editingProduct.stock_quantity} onChange={e => setEditingProduct({...editingProduct, stock_quantity: Number(e.target.value)})} />
                <input 
                  list="categories-list"
                  placeholder="الفئة" 
                  className="w-full p-3 bg-slate-100 rounded-xl" 
                  value={editingProduct.category} 
                  onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} 
                />
                <input 
                  list="units-list"
                  placeholder="الوحدة (مثال: حبة، كرتون، كيلو) - اختياري" 
                  className="w-full p-3 bg-slate-100 rounded-xl" 
                  value={editingProduct.unit || ''} 
                  onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} 
                />
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">المورد</label>
                  <select 
                    className="w-full p-3 bg-slate-100 rounded-xl text-sm"
                    value={editingProduct.supplier_id || ''}
                    onChange={e => setEditingProduct({...editingProduct, supplier_id: e.target.value ? Number(e.target.value) : undefined} as any)}
                  >
                    <option value="">اختار المورد (اختياري)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleEditProduct}>تحديث</Button>
                  <Button variant="secondary" onClick={() => setEditingProduct(null)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showAddSupplier && (
            <div key="modal-add-supplier" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold text-slate-800">إضافة مورد جديد</h3>
                <div className="space-y-1 text-right">
                  <label className="text-xs text-slate-500 font-bold block pr-1">اسم المورد :</label>
                  <input placeholder="اسم المورد أو الشركة" className="w-full p-3 bg-slate-100 rounded-xl font-bold" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-xs text-slate-500 font-bold block pr-1">رقم الهاتف :</label>
                  <input placeholder="رقم الهاتف للتواصل" className="w-full p-3 bg-slate-100 rounded-xl" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-xs text-slate-500 font-bold block pr-1">الرصيد المستحق الحالي للمورد :</label>
                  <input placeholder="0.00" type="number" className="w-full p-3 bg-slate-100 rounded-xl font-mono" value={newSupplier.initialBalance} onChange={e => setNewSupplier({...newSupplier, initialBalance: e.target.value})} />
                  <p className="text-[10px] text-slate-400 block pr-1">المبلغ الذي تدين به حالياً لهذا المورد قبل بدء التسجيل.</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleAddSupplier}>حفظ المورد</Button>
                  <Button variant="secondary" onClick={() => setShowAddSupplier(false)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showSupplierDetails && (
            <div key="modal-supplier-details" className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end p-0 whitespace-normal backdrop-blur-sm">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-slate-50 w-full rounded-t-3xl sm:max-w-2xl sm:mx-auto max-h-[95vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="bg-white p-6 border-b border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                        <Briefcase className="text-amber-600 w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h3 className="text-2xl font-bold text-slate-800 leading-tight">{showSupplierDetails.name}</h3>
                        <p className="text-slate-500 text-sm">
                          رقم الهاتف: {showSupplierDetails.phone || 'بدون هاتف'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowSupplierDetails(null)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 rotate-180 text-slate-400" />
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-right">
                      <p className="text-[10px] text-amber-600 font-bold uppercase mb-1">المستحق الحالي (المتبقي)</p>
                      <p className="text-lg font-bold text-amber-900">{formatPrice(showSupplierDetails.balance)}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-right">
                      <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">عدد المنتجات الموردة</p>
                      <p className="text-lg font-bold text-blue-900">{(supplierHistory.products || []).length} صنف</p>
                    </div>
                  </div>

                  {/* Tab Selectors */}
                  <div className="flex gap-2 mt-4 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setSupplierDetailsTab('payments')}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                        supplierDetailsTab === 'payments'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      سجل الدفعات المقبوضة
                    </button>
                    <button
                      onClick={() => setSupplierDetailsTab('products')}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                        supplierDetailsTab === 'products'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      سجل المنتجات الموردة
                    </button>
                  </div>
                </div>

                {/* Ledger Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-right" dir="rtl">
                  {supplierDetailsTab === 'payments' ? (
                    <div className="space-y-3">
                      {(!supplierHistory.payments || supplierHistory.payments.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Wallet className="text-slate-300 w-6 h-6" />
                          </div>
                          <p className="text-slate-400 text-sm">لا توجد دفعات مالية مسجلة لهذا المورد</p>
                        </div>
                      ) : (
                        supplierHistory.payments.map((pay, idx) => (
                          <div 
                            key={`supp-payment-${pay.id ?? idx}`} 
                            onClick={() => setSelectedSupplierPayment({ ...pay, supplier_name: showSupplierDetails.name })}
                            className="bg-white p-4 rounded-2xl border-r-4 border-r-emerald-500 shadow-xs flex flex-col gap-2 cursor-pointer hover:bg-slate-50/80 active:scale-[0.99] transition-all"
                          >
                            <div className="flex justify-between items-center gap-2">
                              {/* Date and neat notes preview badge if notes exist */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-400 font-mono">
                                  {pay.payment_date ? formatDateWithDay(pay.payment_date) : ''}
                                </span>
                                {pay.notes && (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full font-bold max-w-[130px] sm:max-w-[220px] truncate" title={pay.notes}>
                                    <FileText className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{pay.notes}</span>
                                  </span>
                                )}
                              </div>
                              
                              <span className="font-extrabold text-emerald-700 font-mono text-base whitespace-nowrap">
                                {formatPrice(pay.amount)}
                              </span>
                            </div>
                            {pay.notes ? (
                              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 line-clamp-1 hover:line-clamp-none transition-all">
                                {pay.notes}
                              </p>
                            ) : (
                              <span className="text-[10px] text-slate-400 mt-1 italic">اضغط لمشاهدة تفاصيل السند...</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(!supplierHistory.products || supplierHistory.products.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Package className="text-slate-300 w-6 h-6" />
                          </div>
                          <p className="text-slate-400 text-sm">لا توجد منتجات مسجلة تتبع هذا المورد</p>
                        </div>
                      ) : (
                        supplierHistory.products.map((prod, idx) => (
                          <div key={`supp-prod-${prod.id ?? idx}`} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="font-extrabold text-slate-800 text-sm">{prod.name}</p>
                              <div className="flex gap-2 text-[10px] text-slate-400">
                                <span>سعر الشراء: <strong className="text-slate-600 font-mono">{formatPrice(prod.cost_price)}</strong></span>
                                <span>•</span>
                                <span>سعر البيع: <strong className="text-emerald-600 font-mono">{formatPrice(prod.sale_price)}</strong></span>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">
                              الكمية: {prod.stock_quantity}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <Button 
                    className="w-full py-4 rounded-2xl shadow-lg shadow-amber-100 cursor-pointer text-center font-bold"
                    onClick={() => {
                      verifyAdminPermission('supplier_payment', () => {
                        setShowSupplierPaymentModal(showSupplierDetails);
                        setShowSupplierDetails(null);
                      }, '💸 تسديد دفعة مالية للمورد');
                    }}
                  >
                    تسديد دفعة مالية للمورد
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {showSupplierSummaryModal && (
            <div key="modal-supplier-summary" className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-50 w-full max-w-3xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-md shadow-amber-500/10">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800">مستحقات الموردين وتفاصيل رأس المال</h3>
                      <p className="text-xs text-slate-500 font-bold">ملخص مالي للمستحقات، الدفعات المسلمة للتجار، وأرصدتهم</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSupplierSummaryModal(false)} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-5">
                  
                  {/* --- Section 1: Financial Summary General Cards --- */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      الملخص المالي العام للموردين
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">المطلوب قبل السداد</span>
                        <p className="text-xs text-indigo-700/80 font-bold mt-2">إجمالي مستحقات الموردين</p>
                        <p className="text-xl font-black font-mono text-indigo-900">{formatPrice(summary.totalOriginalSupplierCost ?? 0)}</p>
                        <p className="text-[9px] text-indigo-600 font-bold leading-tight pt-1">المستحقات الكليّة لجميع التجار قبل أي مدفوعات</p>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">المبالغ المسلمة</span>
                        <p className="text-xs text-emerald-700/80 font-bold mt-2">رأس المال المسلّم للتجار</p>
                        <p className="text-xl font-black font-mono text-emerald-900">{formatPrice(summary.totalSupplierPayments ?? 0)}</p>
                        <p className="text-[9px] text-emerald-600 font-bold leading-tight pt-1">إجمالي الدفعات المسددة والمسجلة للموردين</p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">المطلوب حالياً</span>
                        <p className="text-xs text-amber-700/80 font-bold mt-2">المستحق الحالي المتبقي</p>
                        <p className="text-xl font-black font-mono text-amber-900">{formatPrice(summary.totalCostOfSales ?? 0)}</p>
                        <p className="text-[9px] text-amber-600 font-bold leading-tight pt-1">صافي الديون المعلقة في حسابات التجار</p>
                      </div>
                    </div>
                  </div>

                  {/* --- Section 2 & 3: Side-by-Side Bento Grid --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Right Bento Column: Suppliers Balances */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-4 flex flex-col justify-between shadow-xs space-y-3">
                      <div>
                        <div className="flex justify-between items-center pr-2 border-r-4 border-blue-500 pb-0.5 mb-2">
                          <h4 className="text-xs font-black text-slate-800">أرصدة التجار المتبقية</h4>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            {suppliers.length} موردين
                          </span>
                        </div>
                        
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {suppliers.length > 0 ? (
                            suppliers.map(s => (
                              <div 
                                key={s.id} 
                                onClick={() => {
                                  setShowSupplierSummaryModal(false);
                                  fetchSupplierHistory(s);
                                }}
                                className="bg-slate-50 p-2.5 rounded-xl shadow-xs border border-slate-100 flex justify-between items-center hover:bg-slate-100/80 cursor-pointer transition-all active:scale-[0.98]"
                              >
                                <div className="space-y-0.5 text-right">
                                  <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                    {s.name}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block pr-3">{s.phone || 'بدون رقم هاتف'}</span>
                                </div>
                                <span className="font-extrabold text-amber-800 font-mono text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                  {formatPrice(s.balance)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-slate-400 py-6 italic text-[11px] font-bold">لا يوجد موردين مسجلين حالياً.</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 text-center">
                        * إضغط على إسم التاجر المورد لمراجعة تفاصيل كشف الحساب الكلي.
                      </div>
                    </div>

                    {/* Left Bento Column: Payment Logs */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-4 flex flex-col justify-between shadow-xs space-y-3">
                      <div>
                        <div className="flex justify-between items-center pr-2 border-r-4 border-violet-500 pb-0.5 mb-2">
                          <h4 className="text-xs font-black text-slate-800">تفاصيل وسجل الدفعات السابقة</h4>
                          <span className="text-[9px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                            {enrichedSupplierPayments.length} سداد
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {enrichedSupplierPayments.length > 0 ? (
                            enrichedSupplierPayments.map(p => (
                              <div 
                                key={p.id} 
                                onClick={() => setSelectedSupplierPayment(p)}
                                className="bg-slate-50 p-2.5 rounded-xl shadow-xs border border-slate-100 flex justify-between items-center hover:bg-violet-50/50 cursor-pointer transition-all active:scale-[0.98] gap-3"
                              >
                                <div className="space-y-1 text-right flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 leading-tight">
                                    <span className="font-extrabold text-slate-800 text-xs">
                                      دفعة سداد لـ <span className="text-violet-700">{p.supplier_name}</span>
                                    </span>
                                    {p.notes && (
                                      <span className="inline-flex items-center gap-1 text-[9px] bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded-full font-bold max-w-[120px] truncate" title={p.notes}>
                                        <FileText className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{p.notes}</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-400 block font-mono">
                                    {formatDateWithDay(p.payment_date)}
                                  </span>
                                </div>
                                <span className="font-extrabold text-emerald-800 font-mono text-xs bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 whitespace-nowrap shrink-0">
                                  {formatPrice(p.amount)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-slate-400 py-6 italic text-[11px] font-bold">لا توجد دفعات أو سدادات مسجلة سلفاً.</p>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 text-center">
                        * إضغط على الدفعة لعرض تفاصيلها وملاحظاتها المسجلة بوضوح.
                      </div>
                    </div>

                  </div>

                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all" onClick={() => setShowSupplierSummaryModal(false)}>إغلاق النافذة</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showInventoryDetailsModal && (
            <div key="modal-inventory-details" className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-50 w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/10">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800">تفاصيل رأس المال وتكاليف المخزون</h3>
                      <p className="text-xs text-slate-500 font-bold">ملخص مالي دقيق مبني على سعر التكلفة (سعر الشراء الفعلي)</p>
                    </div>
                  </div>
                  <button onClick={() => setShowInventoryDetailsModal(false)} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  
                  {/* --- Section 1: Overview (Cost price focus) --- */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      تحليل تكاليف رأس المال (سعر التكلفة)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <p className="text-[10px] text-indigo-700 font-extrabold">رأس المال الكلي</p>
                        <p className="text-lg font-black font-mono text-indigo-900 mt-1">{formatPrice(summary.totalOriginalInventoryCost ?? 0)}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                          إجمالي كلفة جميع البضائع المسجلة بالمحل (الحالية + المباعة)
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <p className="text-[10px] text-emerald-700 font-extrabold">كلفة البضائع المتبقية</p>
                        <p className="text-lg font-black font-mono text-emerald-900 mt-1">{formatPrice(summary.totalInventoryCost ?? 0)}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                          رأس المال المعلق بالمحل ويمثل البضاعة المتواجدة حالياً بالرفوف
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <p className="text-[10px] text-blue-700 font-extrabold">رأس المال المسترد</p>
                        <p className="text-lg font-black font-mono text-blue-900 mt-1">{formatPrice(summary.totalCostOfSoldItems ?? 0)}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                          قيمة كلفة شراء البضائع التي تم بيعها وخرجت من ذمة المحل
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* --- Section 2: Stock Quantities & Rates --- */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                      القطع والمخزون الفعلي ومعدل التصفية
                    </h4>
                    
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xs space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            القطع المتبقية بالرفوف:
                          </span>
                          <span className="font-extrabold text-slate-800 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200">
                            {(summary.totalStockQuantity ?? 0)} قطعة
                          </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                            <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                            القطع المباعة للعملاء:
                          </span>
                          <span className="font-extrabold text-slate-800 font-mono text-sm bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200">
                            {(summary.totalItemsSold ?? 0)} قطعة
                          </span>
                        </div>
                      </div>

                      {/* Styled Progress Bar representing liquidation progress */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-black">معدل تصفية المخزون (النسبة المباعة)</span>
                          <span className="font-black text-sm text-emerald-800 font-mono">
                            {((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0)) > 0 
                              ? `${(((summary.totalItemsSold ?? 0) / ((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0))) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </span>
                        </div>
                        
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className="h-full bg-gradient-to-l from-emerald-500 to-indigo-500 rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0)) > 0 
                                ? (((summary.totalItemsSold ?? 0) / ((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0))) * 100).toFixed(1)
                                : 0}%` 
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>طريق الاسترداد الكامل</span>
                          <span>مجموع قطع البضائع الكليّة: {((summary.totalItemsSold ?? 0) + (summary.totalStockQuantity ?? 0))} قطعة</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all" onClick={() => setShowInventoryDetailsModal(false)}>إغلاق النافذة</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showSalesSummaryModal && (
            <div key="modal-sales-summary" className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-50 w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-white"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-md shadow-blue-500/10">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800">تفاصيل وتحليل المبيعات</h3>
                      <p className="text-xs text-slate-500 font-bold">تحليل كامل لعمليات البيع المحققة وتوقعات المبيعات المتبقية بالمتجر</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSalesSummaryModal(false)} className="p-2.5 hover:bg-slate-200/50 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  
                  {/* --- Section 1: Sales / Projections (Sale price focus) --- */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      تحليل المبيعات (بسعر البيع الكلي)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <p className="text-[10px] text-blue-700 font-extrabold">المبيعات المحققة بالفعل</p>
                        <p className="text-lg font-black font-mono text-blue-900 mt-1">{formatPrice(summary.totalSales ?? 0)}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                          قيمة ما تم تسييله وبيعه واستلامه نقداً أو كديون محتسبة للعملاء
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <p className="text-[10px] text-amber-700 font-extrabold">مبيعات المتبقي المتوقعة</p>
                        <p className="text-lg font-black font-mono text-amber-900 mt-1">{formatPrice(summary.totalSaleValueOfRemainingInventory ?? 0)}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                          العائد البيعي المقدر للبضائع المعروضة حالياً عند بيعها بالكامل
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/50 border border-fuchsia-200 p-4 rounded-2xl space-y-1 shadow-xs hover:shadow-sm transition-all text-right">
                        <p className="text-[10px] text-fuchsia-700 font-extrabold">القيمة البيعية الكليّة</p>
                        <p className="text-lg font-black font-mono text-fuchsia-900 mt-1">{formatPrice(summary.totalOriginalInventorySaleValue ?? 0)}</p>
                        <p className="text-[9px] text-slate-500 font-bold leading-tight pt-1">
                          مجموع قيمة البضائع (المباعة والمتبقية معاً) بأسعار البيع الكلية
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all" onClick={() => setShowSalesSummaryModal(false)}>إغلاق النافذة</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showProfitSummaryModal && (
            <div key="modal-profit-summary" className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 text-white w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-slate-800"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/20 animate-pulse">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">تفاصيل وتحليل الأرباح</h3>
                      <p className="text-xs text-slate-400 font-bold">تحليل دقيق لصافي أرباح المتجر المحققة فعلياً والتوقعات المستقبلية</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProfitSummaryModal(false)} className="p-2.5 hover:bg-slate-800 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* --- Section: Profit Projections --- */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1.5 justify-start">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      تحليل الأرباح الاستثمارية الصافية
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1 hover:border-emerald-500/30 hover:bg-slate-850 transition-all text-right">
                        <p className="text-[10px] text-emerald-400 font-extrabold">صافي الأرباح المحققة</p>
                        <p className="text-xl font-black font-mono text-emerald-350">{formatPrice(summary.totalProfit ?? 0)}</p>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight pt-1">
                          الأرباح الحقيقية المجناة والداخلة فعلياً في الصندوق بعد خصم رأس المال (التكلفة)
                        </p>
                      </div>

                      <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-1 hover:border-rose-500/30 hover:bg-slate-850 transition-all text-right">
                        <p className="text-[10px] text-rose-400 font-extrabold">الربح المتوقع للمخزون المتبقي</p>
                        <p className="text-xl font-black font-mono text-rose-300">{formatPrice(summary.expectedRemainingProfit ?? 0)}</p>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight pt-1">
                          هامش الأرباح المنتظر والتقديري عند تصريف كل القطع المتبقية بالرفوف
                        </p>
                      </div>

                      {/* Highlight summary banner with sleek premium design */}
                      <div className="sm:col-span-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/40 p-5 rounded-[2rem] flex justify-between items-center transition-all shadow-md text-right relative overflow-hidden">
                        <div className="absolute -left-4 -bottom-4 opacity-10">
                          <Sparkles className="w-32 h-32 text-emerald-400" />
                        </div>
                        <div className="relative z-10 space-y-1">
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-black px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs">إسقاط بيعي متوقع</span>
                          <p className="text-xs text-slate-200 font-black pt-2">إجمالي الأرباح الكلية المتوقعة</p>
                          <p className="text-[9px] text-slate-400 font-bold">المجموع المقدر (الأرباح المحققة جراء البيع + ربح المتبقي) بعد نفاذ البضاعة</p>
                        </div>
                        <div className="relative z-10 text-left">
                          <p className="text-[10px] text-emerald-400 font-bold">الربح الإجمالي المرتقب</p>
                          <p className="text-2xl font-black font-mono text-emerald-400">
                            {formatPrice((summary.totalProfit ?? 0) + (summary.expectedRemainingProfit ?? 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <Button className="w-full py-3 rounded-2xl text-sm font-extrabold shadow-md bg-emerald-600 text-white hover:bg-emerald-500 transition-colors" onClick={() => setShowProfitSummaryModal(false)}>إغلاق النافذة</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showMonthlySalesDetailsModal && (
            <div key="modal-monthly-sales-details" className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white text-slate-800 w-full max-w-2xl rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto border border-slate-100"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md shadow-indigo-500/20">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">سجل وتحليلات المبيعات التفصيلية</h3>
                      <p className="text-xs text-slate-500 font-bold">مراجعة شاملة لمبيعات الأيام والأسابيع والأشهر والمنتجات الأكثر طلباً</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMonthlySalesDetailsModal(false)} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Main Stats Aggregation */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي مبيعات المتجر</span>
                    <span className="text-base font-black text-slate-800 font-mono">
                      {formatPrice(salesDetailsStats.days.reduce((sum, d) => sum + d.total, 0))}
                    </span>
                  </div>
                  <div className="text-right border-r border-slate-200/60 pr-3">
                    <span className="text-[10px] text-slate-400 font-bold block">القطع المباعة الكلية</span>
                    <span className="text-base font-black text-indigo-700 font-mono">
                      {salesDetailsStats.days.reduce((sum, d) => sum + d.itemsCount, 0)} قطعة
                    </span>
                  </div>
                  <div className="text-right border-r border-slate-200/60 pr-3">
                    <span className="text-[10px] text-slate-400 font-bold block">إجمالي الفواتير</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {salesDetailsStats.days.reduce((sum, d) => sum + d.count, 0)} عملية
                    </span>
                  </div>
                </div>

                {/* Tab select Buttons */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => setSalesDetailsTab('days')}
                    className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === 'days' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    مبيعات الأيام
                  </button>
                  <button
                    onClick={() => setSalesDetailsTab('weeks')}
                    className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === 'weeks' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    مبيعات الأسابيع
                  </button>
                  <button
                    onClick={() => setSalesDetailsTab('months')}
                    className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === 'months' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    مبيعات الأشهر
                  </button>
                  <button
                    onClick={() => setSalesDetailsTab('products_breakdown' as any)}
                    className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 ${salesDetailsTab === ('products_breakdown' as any) ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    المنتجات المباعة
                  </button>
                </div>

                {/* Content Area */}
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {salesDetailsTab === 'days' && (
                    <div className="space-y-2">
                      {salesDetailsStats.days.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد مبيعات مسجلة حتى الآن.</p>
                      ) : (
                        salesDetailsStats.days.map((item, idx) => (
                          <div key={`day-detail-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-800 font-mono">{item.label}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                  {item.count} فواتير
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                كمية القطع المباعة اليوم: <strong className="text-slate-600">{item.itemsCount} قطعة</strong>
                              </span>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-black text-sm text-slate-800">{formatPrice(item.total)}</span>
                              <div className="flex items-center gap-2 text-[9px] font-bold">
                                <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-red-500 font-mono">دين: {formatPrice(item.debt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {salesDetailsTab === 'weeks' && (
                    <div className="space-y-2 font-sans">
                      {salesDetailsStats.weeks.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد مبيعات مسجلة حتى الآن.</p>
                      ) : (
                        salesDetailsStats.weeks.map((item, idx) => (
                          <div key={`week-detail-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-800">{item.label}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                  {item.count} فواتير
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                إجمالي القطع المباعة بالأسبوع: <strong className="text-slate-600">{item.itemsCount} قطعة</strong>
                              </span>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-black text-sm text-indigo-700">{formatPrice(item.total)}</span>
                              <div className="flex items-center gap-2 text-[9px] font-bold">
                                <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-red-500 font-mono">دين: {formatPrice(item.debt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {salesDetailsTab === 'months' && (
                    <div className="space-y-2 font-sans">
                      {salesDetailsStats.months.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد مبيعات مسجلة حتى الآن.</p>
                      ) : (
                        salesDetailsStats.months.map((item, idx) => (
                          <div key={`month-detail-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-800">{item.label}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                  {item.count} فواتير
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                إجمالي القطع المباعة بالترميز الشهري: <strong className="text-slate-600">{item.itemsCount} قطعة</strong>
                              </span>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-black text-sm text-indigo-800">{formatPrice(item.total)}</span>
                              <div className="flex items-center gap-2 text-[9px] font-bold">
                                <span className="text-emerald-600 font-mono">نقداً: {formatPrice(item.cash)}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-red-500 font-mono">دين: {formatPrice(item.debt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {salesDetailsTab === ('products_breakdown' as any) && (
                    <div className="space-y-2">
                      {salesDetailsStats.productStats.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8 font-bold">لا توجد منتجات مباعة ومسجلة بعد.</p>
                      ) : (
                        salesDetailsStats.productStats.map((item, idx) => (
                          <div key={`prod-stat-${idx}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-xs transition-all">
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <div>
                                <span className="font-extrabold text-xs text-slate-800 block leading-tight">{item.name}</span>
                                <span className="text-[9px] font-bold text-slate-400 block mt-0.5 bg-slate-100 px-2 py-0.5 rounded-full w-max">
                                  تصنيف: {item.category}
                                </span>
                              </div>
                              <div className="text-left font-sans">
                                <span className="text-xs font-black text-indigo-700 font-mono block">{formatPrice(item.revenue)}</span>
                                <span className="text-[9px] font-bold text-slate-400 block">العائد المبيعات</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pt-1 border-t border-slate-100 mt-2">
                              <span>الكمية المباعة: <strong className="text-slate-700 font-mono text-xs">{item.soldQty} قطعة</strong></span>
                              <span>تكرر في: <strong className="text-slate-700 font-mono text-xs">{item.transactions} عمليات</strong></span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Footer closed button */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button className="w-full py-3.5 rounded-2xl text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-md" onClick={() => setShowMonthlySalesDetailsModal(false)}>
                    إغلاق التقارير الشاملة
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {showSupplierPaymentModal && (
            <div key="modal-supplier-payment" className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-amber-100 p-3 rounded-2xl">
                    <Wallet className="w-6 h-6 text-amber-600" />
                  </div>
                  <button onClick={() => setShowSupplierPaymentModal(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-slate-800">تسديد مبلغ للمورد</h3>
                  <p className="text-sm text-slate-500 font-bold">تسجيل دفعة نقدية لتصفية حساب {showSupplierPaymentModal.name}</p>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                  <p className="text-[10px] text-amber-600 font-bold uppercase mb-1">إجمالي المستحق حالياً</p>
                  <p className="text-xl font-black font-mono text-amber-900">{formatPrice(showSupplierPaymentModal.balance)}</p>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block pr-1">المبلغ المراد تسديده :</label>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={supplierPaymentAmount}
                        onChange={(e) => setSupplierPaymentAmount(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl text-center text-2xl font-black text-emerald-700 focus:border-emerald-500 outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block pr-1">ملاحظات (اختياري) :</label>
                      <textarea 
                        placeholder="اكتب تفاصيل الدفعة أو رقم السند..." 
                        value={supplierPaymentNotes}
                        onChange={(e) => setSupplierPaymentNotes(e.target.value)}
                        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl h-20 text-sm outline-none focus:border-emerald-500 resize-none transition-all"
                      />
                   </div>
                   <Button className="w-full py-4 rounded-2xl text-lg font-black shadow-lg shadow-emerald-500/20" onClick={handleSupplierPayment}>تأكيد التسديد وحفظ</Button>
                </div>
              </motion.div>
            </div>
          )}

          {selectedSupplierPayment && (
            <div key="modal-selected-supplier-payment" className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl relative text-right"
                dir="rtl"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <button onClick={() => setSelectedSupplierPayment(null)} className="p-2.5 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-xl font-black text-slate-800">تفاصيل دفعة سداد المورد</h3>
                  <p className="text-xs text-slate-400 font-bold">مراجعة كاملة لبيانات وملاحظات الدفعة المالية للمورد بالتفصيل</p>
                </div>

                {/* Details Content */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 text-right">
                    <span className="text-[11px] font-bold text-slate-400 block">اسم التاجر المورد</span>
                    <span className="text-xs font-extrabold text-slate-800">{selectedSupplierPayment.supplier_name}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 text-right">
                    <span className="text-[11px] font-bold text-slate-400 block">تاريخ الدفعة والوقت</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      {selectedSupplierPayment.payment_date ? formatDateTimeWithDay(selectedSupplierPayment.payment_date) : 'غير متوفر'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/60 text-right">
                    <span className="text-[11px] font-bold text-slate-400 block">المبلغ المدفوع</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {formatPrice(selectedSupplierPayment.amount)}
                    </span>
                  </div>

                  <div className="pt-1 text-right">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">الملاحظات والبيان المسجل</span>
                    {selectedSupplierPayment.notes ? (
                      <p className="text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-sans shadow-2xs whitespace-pre-line">
                        {selectedSupplierPayment.notes}
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-400 bg-white p-3 rounded-xl border border-slate-200">
                        لا توجد ملاحظات مسجلة لهذه الدفعة.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer close button */}
                <Button className="w-full py-3.5 rounded-2xl text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-md" onClick={() => setSelectedSupplierPayment(null)}>
                  إغلاق التفاصيل
                </Button>
              </motion.div>
            </div>
          )}

          {showAddNote && (
            <div key="modal-add-note" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <div className="flex justify-between items-center mb-2 text-right">
                  <h3 className="font-extrabold text-lg text-slate-800">{editingNoteId ? '✏️ تعديل الملاحظة اليومية' : '📝 إضافة ملاحظة جديدة'}</h3>
                  <button onClick={() => { setShowAddNote(false); setEditingNoteId(null); setNewNote({ title: '', content: '', reminder_date: '', priority: 'normal' }); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="space-y-4 text-right">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">نوع وأولوية الملاحظة</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'normal', label: '🟢 ملاحظة عامة', color: 'border-slate-200 text-slate-700 bg-slate-50/50', activeColor: 'ring-2 ring-emerald-500 bg-emerald-50/30 border-emerald-300' },
                        { key: 'high', label: '🔴 عاجل وهام', color: 'border-red-200 text-red-700 bg-red-50/30', activeColor: 'ring-2 ring-red-500 bg-red-50 border-red-300' },
                        { key: 'info', label: '🔵 حسابات وكاش', color: 'border-blue-200 text-blue-700 bg-blue-50/30', activeColor: 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' },
                        { key: 'warning', label: '🟡 نواقص بضاعة', color: 'border-amber-200 text-amber-700 bg-amber-50/30', activeColor: 'ring-2 ring-amber-500 bg-amber-50 border-amber-300' }
                      ].map(item => {
                        const isSelected = newNote.priority === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setNewNote({ ...newNote, priority: item.key as any })}
                            className={`p-2.5 rounded-xl border text-xs font-black text-center transition-all cursor-pointer ${
                              isSelected ? item.activeColor : `${item.color} opacity-75 border-dashed hover:opacity-100`
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">عنوان الملاحظة</label>
                    <input type="text" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs font-bold outline-none" placeholder="مثال: تسليم الوردية، سداد فاتورة كهرباء" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">تفاصيل الملاحظة والبيان</label>
                    <textarea value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs font-medium outline-none min-h-[110px]" placeholder="اكتب المبالغ، الأسماء، التنبيهات أو التفاصيل..."></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">تاريخ التذكير (اختياري)</label>
                    <input type="date" value={newNote.reminder_date} onChange={e => setNewNote({...newNote, reminder_date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs font-bold outline-none" />
                  </div>
                  <Button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md mt-2" onClick={handleAddNote}>
                    {editingNoteId ? '💾 حفظ التعديلات' : '💾 حفظ الملاحظة بالصندوق'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {selectedNote && (
            <div key="modal-view-note" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 text-right shadow-xl"
              >
                {/* رأس المودال مع تفاصيل الحالة */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      (selectedNote.priority || 'normal') === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                      (selectedNote.priority || 'normal') === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      (selectedNote.priority || 'normal') === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {(selectedNote.priority || 'normal') === 'high' ? '🔴 عاجل وهام' :
                       (selectedNote.priority || 'normal') === 'info' ? '🔵 حسابات وكاش' :
                       (selectedNote.priority || 'normal') === 'warning' ? '🟡 نواقص بضاعة' :
                       '🟢 ملاحظة عامة'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      selectedNote.is_completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {selectedNote.is_completed ? '✓ مكتملة' : '📝 معلقة'}
                    </span>
                  </div>
                  <button onClick={() => setSelectedNote(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                {/* المحتوى الفعلي للملاحظة */}
                <div className="space-y-3">
                  <div>
                    <h2 className={`text-base font-black text-slate-800 leading-snug ${selectedNote.is_completed ? 'line-through text-slate-400' : ''}`}>
                      {selectedNote.title}
                    </h2>
                    <div className="flex flex-col gap-1 mt-2 text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        تاريخ الإنشاء: {formatDateWithDay(selectedNote.created_at)}
                      </span>
                      {selectedNote.reminder_date && (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md w-fit">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          تذكير: {formatDateWithDay(selectedNote.reminder_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* التفاصيل الكلية */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-150/50 leading-relaxed text-slate-700 text-xs whitespace-pre-wrap break-words max-h-[220px] overflow-y-auto custom-scrollbar font-bold">
                    {selectedNote.content || <span className="italic text-slate-400">لا توجد تفاصيل إضافية مكتوبة...</span>}
                  </div>
                </div>

                {/* أزرار الإجراءات والتحكم بالتفاصيل */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => handleCopyNoteContent(selectedNote.content)}
                  >
                    <Copy className="w-3.5 h-3.5" /> نسخ النص
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl ${
                      selectedNote.is_completed 
                        ? 'text-slate-600 border-slate-200 hover:bg-slate-50' 
                        : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                    onClick={() => handleToggleNoteCompletion(selectedNote)}
                  >
                    <Check className="w-3.5 h-3.5" /> 
                    {selectedNote.is_completed ? 'تفعيل معلقة' : 'إكمال الملاحظة'}
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => { setSelectedNote(null); handleEditNoteAction(selectedNote); }}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> تعديل
                  </Button>

                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl text-red-650 border-red-200 hover:bg-red-50"
                    onClick={() => { handleDeleteNote(selectedNote.id!); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> حذف
                  </Button>
                </div>
                
                <Button className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl text-xs font-black shadow-md" onClick={() => setSelectedNote(null)}>
                  إغلاق التفاصيل
                </Button>
              </motion.div>
            </div>
          )}

          {showAddCustomer && (
            <div key="modal-add-customer" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold text-slate-800">إضافة زبون جديد</h3>
                
                <div className="space-y-1 text-right">
                  <label className="text-xs text-slate-500 font-bold block pr-1">اسم الزبون :</label>
                  <input placeholder="اسم الزبون الكامل" className="w-full p-3 bg-slate-100 rounded-xl" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                </div>
                
                <div className="space-y-1 text-right">
                  <label className="text-xs text-slate-500 font-bold block pr-1">رقم الهاتف :</label>
                  <input placeholder="رقم الهاتف (اختياري)" className="w-full p-3 bg-slate-100 rounded-xl" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs text-slate-500 font-bold block pr-1">الدين السابق المستحق (إن وجد) :</label>
                  <input 
                    placeholder="رصيد دين سابق متبقي على الزبون" 
                    type="number" 
                    className="w-full p-3 bg-slate-100 rounded-xl" 
                    value={newCustomer.initialDebt} 
                    onChange={e => setNewCustomer({...newCustomer, initialDebt: e.target.value})} 
                  />
                  <p className="text-[10px] text-slate-400 block pr-1">استخدم هذا الحقل لتسجيل المبالغ والديون القديمة والمستحقة على الزبون قبل بدء استخدامه للبرنامج.</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleAddCustomer}>حفظ البيانات</Button>
                  <Button variant="secondary" onClick={() => setShowAddCustomer(false)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showPaymentModal && (
            <div key="modal-payment" className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 text-right flex flex-col max-h-[85vh]"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => { setShowPaymentModal(null); setPaymentAmount(''); setPaymentNotes(''); }}
                    className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">
                        {showPaymentModal.balance > 0 ? 'تسوية مديونية زبون' : 'إيداع دفعة مقدمة (شحن رصيد)'}
                      </h3>
                      <p className="text-indigo-100 text-[10px] mt-1 opacity-80">
                        {showPaymentModal.balance > 0 ? 'تحصيل المبالغ وتحديث الأرصدة' : 'شحن رصيد الزبون لاستعماله في مشترياته اللاحقة'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
                  {/* Customer Info Card - More Compact */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-tight">الزبون</p>
                      <p className="text-slate-800 font-black text-sm truncate">{showPaymentModal.name}</p>
                    </div>
                    {showPaymentModal.balance > 0 ? (
                      <div className="flex-1 bg-red-50 p-3.5 rounded-2xl border border-red-100">
                        <p className="text-[10px] text-red-600 font-bold mb-1 uppercase tracking-tight">الرصيد المستحق (دين)</p>
                        <p className="text-red-700 font-black text-sm font-mono leading-tight">{formatPrice(showPaymentModal.balance)}</p>
                      </div>
                    ) : (
                      <div className="flex-1 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] text-emerald-600 font-bold mb-1 uppercase tracking-tight">
                          {showPaymentModal.balance < 0 ? 'رصيد دائن حالي (مقدّم)' : 'رصيد الحساب الحالي'}
                        </p>
                        <p className="text-emerald-700 font-black text-sm font-mono leading-tight">
                          {showPaymentModal.balance < 0 ? formatPrice(Math.abs(showPaymentModal.balance)) : '0 ر.س'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Input Area */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 flex items-center gap-2 pr-1 flex-row-reverse justify-end">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{showPaymentModal.balance > 0 ? 'المبلغ المسدد الآن:' : 'مبلغ الإيداع المقدم الآن:'}</span>
                      </label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl font-mono focus:outline-none focus:ring-4 focus:ring-indigo-50 pl-16 text-slate-800 border-2 border-slate-100 transition-all focus:bg-white focus:border-indigo-300 shadow-sm text-center" 
                          value={paymentAmount} 
                          onChange={e => setPaymentAmount(e.target.value)} 
                          autoFocus
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl text-xs">{currency}</span>
                      </div>
                    </div>

                    {showPaymentModal.balance > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount(String(showPaymentModal.balance));
                            setPaymentNotes('تصفير كامل الحساب وتصفية المديونية');
                          }}
                          className="py-3 px-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all font-bold text-[12px] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> تصفير كامل
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount(String(Math.ceil(showPaymentModal.balance / 2)));
                            setPaymentNotes('سداد نصف الرصيد المتبقي');
                          }}
                          className="py-3 px-3 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all font-bold text-[12px] border-2 border-slate-100 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> سداد (٥٠٪)
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount('50');
                            setPaymentNotes('إيداع سلفة / دفعة مقدّمة بقيمة 50');
                          }}
                          className="py-3 px-2 bg-emerald-50 text-emerald-750 hover:bg-emerald-100 rounded-xl transition-all font-extrabold text-[12px] border border-emerald-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                        >
                          +50 {currency}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount('100');
                            setPaymentNotes('إيداع سلفة / دفعة مقدّمة بقيمة 100');
                          }}
                          className="py-3 px-2 bg-emerald-50 text-emerald-750 hover:bg-emerald-100 rounded-xl transition-all font-extrabold text-[12px] border border-emerald-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                        >
                          +100 {currency}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAmount('200');
                            setPaymentNotes('إيداع سلفة / دفعة مقدّمة بقيمة 200');
                          }}
                          className="py-3 px-2 bg-emerald-50 text-emerald-750 hover:bg-emerald-100 rounded-xl transition-all font-extrabold text-[12px] border border-emerald-150 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                        >
                          +200 {currency}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600 pr-1">البيان / ملاحظات:</label>
                    <textarea 
                      placeholder="اكتب أي ملاحظات هنا..." 
                      className="w-full p-4 bg-slate-50 rounded-2xl text-xs text-slate-700 focus:outline-none border-2 border-slate-100 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all min-h-[80px] resize-none" 
                      value={paymentNotes} 
                      onChange={e => setPaymentNotes(e.target.value)} 
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-100 rounded-2xl transition-all active:scale-[0.98] cursor-pointer" 
                      onClick={handlePayment}
                      disabled={!paymentAmount || Number(paymentAmount) <= 0}
                    >
                      {showPaymentModal.balance > 0 ? 'حفظ السداد وتحديث الحساب' : 'تأكيد شحن الحساب المقدم'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800 cursor-pointer"
                      onClick={() => { setShowPaymentModal(null); setPaymentAmount(''); setPaymentNotes(''); }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {showCustomerAdjustmentModal && (
            <div key="modal-customer-adjustment" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl relative text-right border border-slate-100"
                dir="rtl"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                      <Settings2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 leading-tight">تعديل حساب الزبون</h3>
                      <p className="text-sm font-bold text-slate-500">إضافة تعديلات أو ملاحظات استثنائية</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setShowCustomerAdjustmentModal(null); setAdjustmentAmount(''); setAdjustmentNotes(''); setAdjustmentType('note'); }}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/60 shadow-inner flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase block mb-1">الزبون الحالي</p>
                      <p className="text-slate-800 font-black text-sm truncate">{showCustomerAdjustmentModal.name}</p>
                    </div>
                    <div className="text-left bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                        {showCustomerAdjustmentModal.balance > 0 ? 'عليه دين' : showCustomerAdjustmentModal.balance < 0 ? 'له رصيد' : 'رصيد مصفر'}
                      </p>
                      <p className="text-indigo-700 font-black text-sm font-mono leading-tight">{formatPrice(Math.abs(showCustomerAdjustmentModal.balance))}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2">نوع العملية / التعديل</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustmentType('note')}
                        className={`py-3 px-2 rounded-2xl border transition-all text-xs font-bold ${adjustmentType === 'note' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        ملاحظة عامة
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustmentType('add_debt')}
                        className={`py-3 px-2 rounded-2xl border transition-all text-xs font-bold ${adjustmentType === 'add_debt' ? 'bg-red-50 border-red-200 text-red-700 shadow-sm ring-1 ring-red-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        زيادة المُديونية
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustmentType('add_credit')}
                        className={`py-3 px-2 rounded-2xl border transition-all text-xs font-bold ${adjustmentType === 'add_credit' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm ring-1 ring-emerald-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        إضافة دائن / دفعة
                      </button>
                    </div>
                  </div>

                  {adjustmentType !== 'note' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <label className="block text-sm font-extrabold text-slate-700">المبلغ</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 font-bold">{currency}</span>
                        </div>
                        <input
                          type="number"
                          value={adjustmentAmount}
                          onChange={(e) => setAdjustmentAmount(e.target.value)}
                          className="w-full pr-14 pl-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-black focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left shadow-inner"
                          placeholder="0.00"
                          dir="ltr"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-extrabold text-slate-700">ملاحظة أو بيان للعملية</label>
                    <textarea
                      value={adjustmentNotes}
                      onChange={(e) => setAdjustmentNotes(e.target.value)}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
                      placeholder="اكتب هنا (مثال: نقود باقية سابقة، تسوية، تصحيح رصيد، إلخ)"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-slate-100">
                    <Button 
                      variant="primary" 
                      className={`flex-1 py-4 rounded-2xl text-white font-extrabold cursor-pointer shadow-lg ${adjustmentType === 'add_debt' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : adjustmentType === 'add_credit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                      onClick={handleCustomerAdjustmentSubmit}
                    >
                      حفظ التعديل في السجل
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold hover:bg-white hover:text-slate-800 cursor-pointer"
                      onClick={() => { setShowCustomerAdjustmentModal(null); setAdjustmentAmount(''); setAdjustmentNotes(''); setAdjustmentType('note'); }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {showSettleModal && (
            <div key="modal-settle" className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 text-right flex flex-col max-h-[92vh]"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                  
                  {/* Close Button */}
                  <button 
                    onClick={() => { setShowSettleModal(false); setDeliveredSettleAmount(''); setSettleNotes(''); }}
                    className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20 rotate-3">
                      <Database className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">تصفية نقدية الصندوق</h3>
                      <p className="text-violet-100 text-[10px] mt-1 opacity-80">مطابقة المبيعات والديون المحصلة</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
                  {/* Alert - More Compact */}
                  <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-3 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed font-bold">
                      مطابقة النقدية الفعلية مع المسجل تلقائياً، والترحيل الفوري للعجز.
                    </p>
                  </div>

                  {/* Detailed Summary Card */}
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-indigo-100">
                        <span className="text-[9px] text-slate-500 font-black block mb-1">مبيعات نقد</span>
                        <span className="font-black text-slate-800 font-mono text-xs">{formatPrice(currentCycleCashSales)}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-emerald-100">
                        <span className="text-[9px] text-emerald-600 font-black block mb-1">تحصيل ديون</span>
                        <span className="font-black text-emerald-700 font-mono text-xs">+{formatPrice(currentCycleDebtPaymentsTotal)}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:border-amber-100">
                        <span className="text-[9px] text-amber-600 font-black block mb-1">مبيعات لم تسدد بعد</span>
                        <span className="font-black text-amber-700 font-mono text-xs">{formatPrice(currentCycleDebtTotal)}</span>
                      </div>
                      <div className={`p-3 rounded-xl border shadow-sm transition-all ${carriedForwardDeficit > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200/60'}`}>
                        <span className={`text-[9px] font-black block mb-1 ${carriedForwardDeficit > 0 ? 'text-rose-600' : 'text-slate-400'}`}>عجز سابق</span>
                        <span className={`font-black font-mono text-xs ${carriedForwardDeficit > 0 ? 'text-rose-700' : 'text-slate-500'}`}>{formatPrice(carriedForwardDeficit)}</span>
                      </div>
                    </div>

                    {currentCycleUnpaidWithdrawalsTotal > 0 && (
                      <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-2xl flex justify-between items-center text-[10px] sm:text-xs text-amber-900 font-bold shrink-0">
                        <span>💸 مسحوبات وسلفيات الصندوق معلقة السداد:</span>
                        <span className="font-mono text-xs text-rose-700 font-black">-{formatPrice(currentCycleUnpaidWithdrawalsTotal)}</span>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-50 space-y-2.5 text-white">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black opacity-85">المستهدف الكلي للتسوية</span>
                          <span className="text-[9px] font-medium opacity-70">إجمالي السيولة المقيدة</span>
                          {currentCycleSupplierPaymentsTotal > 0 && (
                            <span className="text-[8px] font-bold text-violet-200 block pt-1 bg-violet-800/30 w-fit px-1.5 py-0.5 rounded-lg mt-1 border border-violet-500/30">خصم لموردين: {formatPrice(currentCycleSupplierPaymentsTotal)}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold font-mono">{formatPrice(activeOutstandingCash)}</span>
                      </div>
                      
                      {currentCycleUnpaidWithdrawalsTotal > 0 && (
                        <div className="flex justify-between items-center border-t border-white/10 pt-2.5">
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black opacity-90 text-amber-200">السيولة النقدية المتوقع جردها بالصندوق</span>
                            <span className="text-[9px] font-medium opacity-75 text-violet-100">المبلغ الفعلي المطلوب تسليمه كاش</span>
                          </div>
                          <span className="text-base font-black font-mono text-yellow-200">{formatPrice(Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal))}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interaction Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-600 flex items-center gap-1.5 pr-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
                        المبلغ المسلم فعلياً:
                      </label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl font-mono focus:outline-none focus:ring-4 focus:ring-violet-50 pl-16 text-slate-800 transition-all focus:bg-white focus:border-violet-300 shadow-sm" 
                          value={deliveredSettleAmount} 
                          onChange={e => setDeliveredSettleAmount(e.target.value)} 
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-violet-600 text-xs bg-violet-50 px-2.5 py-1 rounded-xl">{currency}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const expectedPhysical = Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal);
                          setDeliveredSettleAmount(String(expectedPhysical));
                          setSettleNotes('مطابقة تامة ومسلمة بالكامل حسب الجرد الفعلي');
                        }}
                        className="py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all font-black text-[11px] shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> تصفية كاملة للجرد
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const expectedPhysical = Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal);
                          setDeliveredSettleAmount(String(Math.ceil(expectedPhysical / 2)));
                          setSettleNotes('تصفية نصف مبلغ الجرد المستحق');
                        }}
                        className="py-3 bg-white text-slate-700 rounded-xl border-2 border-slate-100 hover:bg-slate-50 transition-all font-black text-[11px] flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> تصفية نصف المتبقي
                      </button>
                    </div>

                    {/* Result Analysis - More Compact */}
                    {(() => {
                      const deliveredVal = Number(deliveredSettleAmount) || 0;
                      const expectedPhysical = Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal);
                      const diff = deliveredVal - expectedPhysical;
                      return (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                          <div className={`p-3 rounded-xl ${diff < 0 ? 'bg-rose-50/70 text-rose-700 border border-rose-100' : diff > 0 ? 'bg-amber-50/70 text-amber-700 border border-amber-100' : 'bg-emerald-50/70 text-emerald-700 border border-emerald-100'} text-[11px] leading-relaxed font-bold text-center`}>
                             {diff < 0 ? (
                               <span>🚨 عجز جرد فعلي (بخلاف المسحوبات): عجز بمقدار <span className="font-extrabold underline">{formatPrice(Math.abs(diff))}</span> سيرحل للدورة القادمة كعجز مالي بالصندوق.</span>
                             ) : diff > 0 ? (
                               <span>⚠️ زيادة بالصندوق: تم رصد زيادة بمقدار <span className="font-extrabold underline">{formatPrice(diff)}</span> عن المطلوب.</span>
                             ) : (
                               <span>✅ ممتاز: النقد مطابق تماماً لجرد الصندوق الفعلي المتوقع! (ولا يزال هناك {formatPrice(currentCycleUnpaidWithdrawalsTotal)} ذمم شخصية منفصلة).</span>
                             )}
                          </div>
                        </div>
                      );
                    })()}

                    <input 
                      type="text" 
                      placeholder="ملاحظات إضافية (اختياري)..." 
                      className="w-full p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 border-2 border-slate-100 focus:outline-none focus:ring-4 focus:ring-violet-50 transition-all shadow-sm" 
                      value={settleNotes} 
                      onChange={e => setSettleNotes(e.target.value)} 
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      className="flex-[2] py-4 bg-violet-600 hover:bg-violet-700 text-white font-black text-base shadow-xl shadow-violet-50 rounded-2xl transition-all active:scale-[0.98]" 
                      onClick={handleSaveSettlement}
                      disabled={deliveredSettleAmount === '' || Number(deliveredSettleAmount) < 0}
                    >
                      اعتماد التصفية
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800"
                      onClick={() => { setShowSettleModal(false); setDeliveredSettleAmount(''); setSettleNotes(''); }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {showCustomerDetails && (
            <div key="modal-customer-details" className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-slate-50 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl flex flex-col h-[95vh] sm:h-[85vh] overflow-hidden"
              >
                {/* Header Section */}
                <div className="bg-white p-6 border-b border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <Users className="text-emerald-600 w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 leading-tight">{showCustomerDetails.name}</h3>
                        <p className="text-slate-500 flex items-center gap-1 text-sm">
                          <TrendingUp className="w-3 h-3" /> {showCustomerDetails.phone}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowCustomerDetails(null)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 rotate-180 text-slate-400" />
                    </button>
                  </div>

                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                      <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">إجمالي المشتريات</p>
                      <p className="text-lg font-bold text-blue-900">{formatPrice(customerStats.totalPurchased)}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1">تم تسديده</p>
                      <p className="text-lg font-bold text-emerald-900">{formatPrice(customerStats.totalPaid)}</p>
                    </div>
                    {showCustomerDetails.balance > 0 ? (
                      <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                        <p className="text-[10px] text-red-600 font-bold uppercase mb-1">المتبقي (دين)</p>
                        <p className="text-lg font-bold text-red-900">{formatPrice(showCustomerDetails.balance)}</p>
                      </div>
                    ) : showCustomerDetails.balance < 0 ? (
                      <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-150">
                        <p className="text-[10px] text-emerald-700 font-bold uppercase mb-1">الرصيد الدائن (مقدم)</p>
                        <p className="text-lg font-bold text-emerald-800">{formatPrice(Math.abs(showCustomerDetails.balance))}</p>
                      </div>
                    ) : (
                      <div className="bg-slate-100/60 p-3 rounded-2xl border border-slate-200">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">رصيد الزبون</p>
                        <p className="text-md sm:text-lg font-black text-slate-600 mt-1">خالص تماماً</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ledger Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  <div className="flex justify-between items-center px-2">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" /> كشف الحساب التفصيلي
                    </h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => printStatement(showCustomerDetails)}
                        className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
                      >
                        <Printer className="w-3 h-3" /> طباعة
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(showCustomerDetails)}
                        className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      <button 
                        onClick={() => handleShareWhatsApp(showCustomerDetails)}
                        className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-emerald-100 shadow-sm transition-all"
                      >
                        <Upload className="w-3 h-3" /> واتساب
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {ledgerEntries.length === 0 && (
                      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="text-slate-300 w-6 h-6" />
                        </div>
                        <p className="text-slate-400 text-sm">لا توجد عمليات مسجلة لهذا الزبون</p>
                      </div>
                    )}
                    
                    {ledgerEntries.map((entry, idx) => {
                      let typeLabel = '';
                      let badgeColor = '';
                      let iconColor = '';
                      let amountPrefix = '';
                      let amountText = '';
                      let showItems = false;
                      let noteText = '';
                      
                      if (entry.entryType === 'sale') {
                        typeLabel = 'فاتورة شراء';
                        badgeColor = 'bg-red-50 text-red-600';
                        amountPrefix = '+';
                        amountText = formatPrice(entry.total_amount);
                        iconColor = 'border-r-red-400';
                        showItems = true;
                        noteText = entry.notes || '';
                      } else {
                        if (entry.amount === 0) {
                          typeLabel = 'ملاحظة حساب';
                          badgeColor = 'bg-slate-100 text-slate-600';
                          amountPrefix = '';
                          amountText = '0 ر.س';
                          iconColor = 'border-r-slate-400';
                          noteText = entry.notes || 'ملاحظة عامة';
                        } else if (entry.type === 'purchase') {
                          typeLabel = 'زيادة مديونية';
                          badgeColor = 'bg-amber-50 text-amber-600';
                          amountPrefix = '+';
                          amountText = formatPrice(entry.amount);
                          iconColor = 'border-r-amber-400';
                          noteText = entry.notes || 'تعديل بالزيادة';
                        } else {
                          typeLabel = 'دفعة مالية';
                          badgeColor = 'bg-emerald-50 text-emerald-600';
                          amountPrefix = '-';
                          amountText = formatPrice(entry.amount);
                          iconColor = 'border-r-emerald-400';
                          noteText = entry.notes || '';
                        }
                      }
                      
                      return (
                        <div 
                          key={`ledger-${entry.entryType}-${entry.id ?? 'no-id'}-${idx}`} 
                          className={`bg-white p-4 rounded-2xl border-r-4 shadow-sm transition-all hover:shadow-md ${iconColor}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeColor}`}>
                                {typeLabel}
                              </span>
                              <p className="text-xs text-slate-400 mt-1">{formatDateTimeWithDay(entry.created_at)}</p>
                            </div>
                            <p className="text-lg font-bold font-mono flex items-center gap-1" dir="ltr">
                              <span className="text-slate-400 text-sm font-sans">{amountPrefix}</span>
                              {amountText}
                            </p>
                          </div>
                          
                          {noteText && (
                            <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2 rounded-xl border border-slate-100/60 font-medium leading-relaxed flex gap-1.5 items-start">
                              <span>📝</span> <span>{noteText}</span>
                            </div>
                          )}
                          
                          {showItems && (
                            <div className="mt-3 pt-3 border-t border-slate-50">
                              <div className="space-y-1">
                                {JSON.parse(entry.items || '[]').map((item: any, i: number) => (
                                  <div key={`ledger-sub-${item.product_id ?? i}-${i}`} className="flex justify-between text-xs text-slate-600">
                                    <span>{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                                    <span>{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex justify-end">
                                <button 
                                  onClick={() => printReceipt(entry)}
                                  className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline"
                                >
                                  <Printer className="w-3 h-3" /> طباعة الفاتورة
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                  <Button 
                    variant="primary" 
                    className="flex-1 py-4 rounded-2xl shadow-lg shadow-emerald-100 cursor-pointer"
                    onClick={() => {
                      setShowCustomerDetails(null);
                      setShowPaymentModal(showCustomerDetails);
                    }}
                  >
                    {showCustomerDetails.balance > 0 ? 'تسجيل سداد دفعة مديونية' : 'إيداع دفعة مقدمة في الرصيد'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-14 shrink-0 rounded-2xl flex items-center justify-center border border-slate-200 bg-slate-50 hover:bg-slate-100 shadow-sm"
                    onClick={() => {
                      setShowCustomerDetails(null);
                      setShowCustomerAdjustmentModal(showCustomerDetails);
                    }}
                    title="تعديل الحساب أو ملاحظات"
                  >
                    <Plus className="w-5 h-5 text-slate-600" />
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* PIN Verification Modal / واجهة التحقق من رمز أمان المدير */}
          {pinModal.isOpen && (
            <div key="modal-pin" className="fixed inset-0 bg-black/75 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="bg-slate-900 border border-slate-800 text-white w-full max-w-sm rounded-[2rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-center space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs font-black text-slate-500 tracking-wider">نظام صلاحيات المدير</span>
                  <button 
                    onClick={() => setPinModal(p => ({ ...p, isOpen: false }))}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl border border-emerald-500/20 shadow-inner">
                    🔐
                  </div>
                  <h3 className="text-base font-black text-slate-100">{pinModal.title}</h3>
                  <p className="text-[11px] text-slate-400 px-2 leading-relaxed">{pinModal.description}</p>
                </div>

                {/* Display Dots / دوائر الرمز فائقة الاستجابة */}
                <div className="space-y-2">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center gap-3 relative overflow-hidden h-14">
                    {pinModal.inputVal ? (
                      <div className="flex gap-2.5">
                        {Array.from(pinModal.inputVal).map((_, idx) => (
                          <div 
                            key={idx} 
                            className="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)] transform scale-100 transition-transform duration-75"
                          ></div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs font-bold">الرجاء إدخال الرمز المكون من 4 أرقام</span>
                    )}
                  </div>
                  {pinModal.error && (
                    <p className="text-[11px] text-red-450 font-extrabold animate-pulse">{pinModal.error}</p>
                  )}
                </div>

                {/* Numeric Keypad / لوحة أرقام تفاعلية */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPinModal(p => {
                          const newVal = p.inputVal + num;
                          if (newVal.length > 8) return p;
                          
                          // Instant auto-unlock upon correct PIN match (seamlessly fast)
                          if (p.actionType !== 'setup_first' && newVal === adminPin) {
                            setTimeout(() => {
                              const successCb = p.onSuccess;
                              setPinModal(prev => ({ ...prev, isOpen: false }));
                              successCb();
                            }, 30);
                          }
                          return { ...p, inputVal: newVal, error: '' };
                        });
                      }}
                      className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 rounded-full flex items-center justify-center text-lg font-black transition-all cursor-pointer border border-slate-700/50 hover:scale-105 active:scale-95"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setPinModal(p => ({ ...p, inputVal: '', error: '' }));
                    }}
                    className="w-14 h-14 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer border border-red-900/30"
                  >
                    مسح
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinModal(p => {
                        const newVal = p.inputVal + '0';
                        if (newVal.length > 8) return p;
                        
                        // Instant auto-unlock upon correct PIN match
                        if (p.actionType !== 'setup_first' && newVal === adminPin) {
                          setTimeout(() => {
                            const successCb = p.onSuccess;
                            setPinModal(prev => ({ ...prev, isOpen: false }));
                            successCb();
                          }, 30);
                        }
                        return { ...p, inputVal: newVal, error: '' };
                      });
                    }}
                    className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 rounded-full flex items-center justify-center text-lg font-black transition-all cursor-pointer border border-slate-700/50 hover:scale-105"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinModal(p => ({ ...p, inputVal: p.inputVal.slice(0, -1), error: '' }));
                    }}
                    className="w-14 h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer border border-slate-700/50"
                  >
                    ←
                  </button>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => {
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
                        if (pinModal.inputVal === adminPin) {
                          const successCb = pinModal.onSuccess;
                          setPinModal(p => ({ ...p, isOpen: false }));
                          successCb();
                        } else {
                          setPinModal(p => ({ ...p, error: '❌ رمز المرور غير صحيح! الرجاء المحاولة مرة أخرى.' }));
                        }
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 text-white font-extrabold py-3.5 rounded-2xl cursor-pointer text-xs transition-all shadow-md hover:shadow-emerald-500/25"
                  >
                    {pinModal.actionType === 'setup_first' ? 'تأكيد وحفظ الرمز الجديد ✨' : 'تأكيد رمز المرور والمتابعة 🔓'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Permissions Configuration Modal / واجهة لوحة تهيئة الصلاحيات وإدارة الأمان */}
          {showPermissionsConfigModal && (
            <div key="modal-permissions-config" className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.92, opacity: 0, y: 30 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.92, opacity: 0, y: 30 }}
                className="bg-white text-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-slate-100 text-right flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="bg-slate-900 p-5 text-white flex justify-between items-center relative shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-800 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black">إدارة أمان النظام والصلاحيات للمدير</h3>
                      <p className="text-[10px] text-slate-400">تخصيص مستويات حماية العمليات وتعيين الرمز</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPermissionsConfigModal(false)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
                  {/* Option toggle */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-black block text-slate-800">تفعيل التحقق من صلاحيات المدير:</span>
                        <span className="text-[10px] text-slate-450 block">حظر العمليات المحددة ومطالبة الكاشير برمز الحماية للمتابعة</span>
                      </div>
                      <button
                        onClick={() => updatePermissionsEnabled(!permissionsEnabled)}
                        className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${permissionsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${permissionsEnabled ? '-translate-x-5.5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* List of actions to protect */}
                  {permissionsEnabled && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-450 pr-1">حدد الإجراءات التي تتطلب إدخال رمز الأمان من الكاشير:</p>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: 'delete_sale', label: 'إلغاء وعكس مبيعات الفاتورة (المرتجع)', desc: 'يمنع الكاشير من حذف أو تصفير أي فاتورة بيع مسجلة' },
                          { key: 'edit_product', label: 'تعديل وحذف الأصناف بالمخازن', desc: 'تعديل الأسعار أو الكميات أو حذف الصنف نهائياً' },
                          { key: 'cash_withdrawal', label: 'مسحوبات الصندوق وسحب الكاش', desc: 'تسجيل مسحوبات نقدية أو عهد أو سلفة للموظفين' },
                          { key: 'settlement', label: 'تصفية الصندوق وتسوية الوردية', desc: 'إجراء مطابقة النقدية المادية وإغلاق الحساب اليومي' },
                          { key: 'supplier_payment', label: 'تسديد الموردين والمدفوعات', desc: 'تسجيل الدفعات المالية للموردين أو سداد الذمم المستحقة' },
                          { key: 'smart_import', label: 'الاستيراد الذكي بالذكاء الاصطناعي', desc: 'استيراد البيانات وفواتير الشراء تلقائياً باستخدام الذكاء الاصطناعي' },
                          { key: 'analytics', label: 'الوصول لقسم التحليلات وPower BI', desc: 'رؤية صافي الأرباح وإحصاءات المبيعات وسرعة دوران السلع' },
                          { key: 'settings', label: 'الوصول لإعدادات النظام العامة', desc: 'تصدير البيانات، تغيير العملة، إعدادات التقريب' }
                        ].map((action) => (
                          <label 
                            key={action.key} 
                            className="flex items-start gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-150/70 rounded-2xl cursor-pointer transition-colors shadow-2xs"
                          >
                            <input 
                              type="checkbox" 
                              checked={protectedActions[action.key] || false}
                              onChange={(e) => {
                                const updated = { ...protectedActions, [action.key]: e.target.checked };
                                updateProtectedActions(updated);
                              }}
                              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1 text-right">
                              <span className="text-xs font-extrabold text-slate-800 block">{action.label}</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">{action.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Change PIN section */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/80 space-y-3.5">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">تحديث رمز أمان المدير:</span>
                      <p className="text-[10px] text-slate-450 block mt-0.5">الرمز الحالي المستخدم هو: <span className="font-mono text-slate-700 font-extrabold bg-slate-200/60 px-1.5 py-0.5 rounded">{adminPin ? '••••' : 'لم يتم التعيين بعد'}</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <input 
                        type="password" 
                        maxLength={8}
                        placeholder="أدخل الرمز الجديد المكون من 4 أرقام على الأقل" 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                        id="new-admin-pin-input"
                      />
                      <Button 
                        onClick={() => {
                          const inputEl = document.getElementById('new-admin-pin-input') as HTMLInputElement;
                          if (inputEl && inputEl.value) {
                            if (inputEl.value.length < 4) {
                              showNotification('يجب أن يتكون الرمز الجديد من 4 أرقام على الأقل', 'error');
                              return;
                            }
                            updateAdminPin(inputEl.value);
                            showNotification('🔑 تم تحديث رمز مرور المدير بنجاح!');
                            inputEl.value = '';
                          } else {
                            showNotification('الرجاء إدخال الرمز الجديد أولاً', 'error');
                          }
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-2 text-xs rounded-xl transition-all cursor-pointer"
                      >
                        حفظ رمز المرور الجديد 🔐
                      </Button>
                      
                      {adminPin && (
                        <button 
                          type="button"
                          onClick={async () => {
                            await updateAdminPin('');
                            await updatePermissionsEnabled(false);
                            showNotification('🔓 تم إيقاف نظام الحماية وإلغاء رمز أمان المدير بالكامل!', 'success');
                            const inputEl = document.getElementById('new-admin-pin-input') as HTMLInputElement;
                            if (inputEl) inputEl.value = '';
                          }}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-extrabold py-2.5 text-xs rounded-xl border border-rose-200 transition-all cursor-pointer text-center"
                        >
                          تعطيل وإيقاف رمز الأمان الحسابي 🔓
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                  <Button 
                    onClick={() => setShowPermissionsConfigModal(false)}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    إغلاق وحفظ الإعدادات
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {showWithdrawModal && (
            <div key="modal-withdraw" className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-100 text-right flex flex-col max-h-[92vh]"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  
                  {/* Close button inside modal */}
                  <button 
                    onClick={() => { setShowWithdrawModal(false); }}
                    className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20 rotate-3">
                      <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">تسجيل مسحوبات / سلف نقدية</h3>
                      <p className="text-indigo-100 text-[10px] mt-1 opacity-80">أوامر الصرف الشخصية والعهد المؤقتة للتسديد</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    <div className="space-y-1.5 font-sans">
                      <label className="text-[11px] font-black text-slate-500 block pr-1">المبلغ المطلوب سحبه (كاش):</label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg font-mono focus:outline-none focus:ring-4 focus:ring-indigo-50 pl-16 text-slate-800 text-right transition-all focus:bg-white focus:border-indigo-300 shadow-xs" 
                          value={withdrawAmount} 
                          onChange={e => setWithdrawAmount(e.target.value)} 
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-xs bg-indigo-50 px-2.5 py-1 rounded-xl">{currency}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-sans">
                      <label className="text-[11px] font-black text-slate-500 block pr-1">المستلم / الشخص المسؤول (لسحب الشطب):</label>
                      <input 
                        type="text" 
                        placeholder="مثال: أحمد أمين الصندوق، أو مالك الحساب..." 
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all focus:bg-white focus:border-indigo-300 shadow-xs text-right" 
                        value={withdrawByWhom} 
                        onChange={e => setWithdrawByWhom(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-1.5 font-sans">
                      <label className="text-[11px] font-black text-slate-500 block pr-1">البيان / سبب السحب الشخصي:</label>
                      <textarea
                        rows={2}
                        placeholder="مثال: سلفة نقدية طارئة، أو تغطية مصروف بضائع عاجل..." 
                        className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all focus:bg-white focus:border-indigo-300 shadow-xs text-right" 
                        value={withdrawReason} 
                        onChange={e => setWithdrawReason(e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 text-right">
                    <Button 
                      className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-50 rounded-2xl transition-all active:scale-[0.98]" 
                      onClick={handleSaveWithdrawal}
                      disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || !withdrawReason.trim()}
                    >
                      تسجيل وسحب من الصندوق
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800"
                      onClick={() => { setShowWithdrawModal(false); }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
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
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation removed and replaced by Sidebar */}
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
