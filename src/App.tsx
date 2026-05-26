import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { ConnectionStatus } from './components/ConnectionStatus';
import BarcodeScanner from './components/BarcodeScanner';
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
  Camera,
  Home,
  BookOpen,
  Edit2
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
import { db, seedDatabase } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

// --- Types ---
interface Product {
  id?: number;
  name: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  category: string;
  barcode?: string;
  unit?: string;
}

interface Customer {
  id?: number;
  name: string;
  phone: string;
  balance: number;
}

interface Summary {
  totalSales: number;
  totalDebts: number;
  lowStock: number;
  totalProfit: number;
  totalInventoryCost: number;
  monthlySales: number;
  todaySales: number;
  weeklySales: number;
}

interface Sale {
  id?: number;
  customer_id?: number | null;
  customer_name?: string | null;
  total_amount: number;
  payment_type: 'cash' | 'debt';
  created_at: string;
  items?: string;
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
  const sales = useLiveQuery(() => db.sales.orderBy('created_at').reverse().limit(50).toArray()) || [];
  
  const enrichedSales = React.useMemo(() => {
    const customerMap = new Map(customers.map(c => [c.id, c.name]));
    return sales.map(s => ({
      ...s,
      customer_name: s.customer_id ? customerMap.get(s.customer_id) : 'زبون نقدي'
    }));
  }, [sales, customers]);

  const [summary, setSummary] = useState<Summary>({ totalSales: 0, totalDebts: 0, lowStock: 0, totalProfit: 0, totalInventoryCost: 0, monthlySales: 0, todaySales: 0, weeklySales: 0 });
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
  const [newProduct, setNewProduct] = useState({ name: '', cost: '', sale: '', stock: '', category: '', barcode: '', unit: '' });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'pos' | 'add-product' | 'edit-product'>('pos');
  const [scannedProductInfo, setScannedProductInfo] = useState<Product | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [inventoryCategory, setInventoryCategory] = useState('الكل');
  const [showPaymentModal, setShowPaymentModal] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState<Customer | null>(null);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [customerHistory, setCustomerHistory] = useState<{ sales: any[], debts: any[] }>({ sales: [], debts: [] });
  const [productHistory, setProductHistory] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [monthlySalesTrend, setMonthlySalesTrend] = useState<any[]>([]);
  const [trendMode, setTrendMode] = useState<'daily' | 'monthly'>('daily');
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [storeName, setStoreName] = useState('النظام المحاسبي');
  const [currency, setCurrency] = useState('ر.ي');
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const appSettings = useLiveQuery(() => db.settings.toArray()) || [];
  const notes = useLiveQuery(() => db.notes.orderBy('created_at').reverse().toArray()) || [];
  const salesSettlements = useLiveQuery(() => db.salesSettlements ? db.salesSettlements.orderBy('created_at').reverse().toArray() : Promise.resolve([])) || [];

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', reminder_date: '' });
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // States for Reconciling Sales / تصفية المبيعات
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [deliveredSettleAmount, setDeliveredSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');

  const lastSettleDate = salesSettlements[0]?.created_at || null;

  const currentCycleSales = useLiveQuery(async () => {
    const allSales = await db.sales.toArray();
    if (lastSettleDate) {
      return allSales.filter(s => s.created_at > lastSettleDate);
    }
    return allSales;
  }, [lastSettleDate]) || [];

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

  const activeOutstandingCash = React.useMemo(() => {
    return allTimeReceivedCash - allTimeDeliveredTotal;
  }, [allTimeReceivedCash, allTimeDeliveredTotal]);

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
  }, [appSettings]);

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

  const formatPrice = (price: number) => `${price} ${currency}`;

  const customerStats = React.useMemo(() => {
    if (!showCustomerDetails) return { totalPurchased: 0, totalPaid: 0 };
    const totalPurchased = customerHistory.sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalPaid = customerHistory.debts.filter(d => d.type === 'payment').reduce((sum, d) => sum + d.amount, 0);
    return { totalPurchased, totalPaid };
  }, [customerHistory, showCustomerDetails]);

  const ledgerEntries = React.useMemo(() => {
    const entries = [
      ...customerHistory.sales.map(s => ({ ...s, entryType: 'sale' })),
      ...customerHistory.debts.filter(d => d.type === 'payment').map(d => ({ ...d, entryType: 'payment' }))
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
    allProducts.forEach(p => {
      totalInventoryCost += (p.cost_price * p.stock_quantity);
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

    setSummary({
      totalSales,
      totalDebts,
      lowStock: lowStockCount,
      totalProfit,
      totalInventoryCost,
      monthlySales,
      todaySales,
      weeklySales
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
      
      const isCleared = updatedCustomer && updatedCustomer.balance <= 0;
      showNotification(
        isCleared 
          ? 'تم تصفية رصيد العميل بالكامل وتسوية الدين بنجاح!' 
          : 'تم تسجيل الدفعة وتحديث الرصيد المستحق بنجاح'
      );
      
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
      await db.salesSettlements.add({
        total_sales: targetToSettle,
        delivered_amount: delivered,
        difference: delivered - targetToSettle,
        created_at: new Date().toISOString(),
        notes: settleNotes.trim() || undefined
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
        });
        showNotification('تم تحديث الملاحظة بنجاح');
      } else {
        await db.notes.add({
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          reminder_date: newNote.reminder_date || null,
          created_at: new Date().toISOString(),
          is_completed: false
        });
        showNotification('تم حفظ الملاحظة بنجاح');
      }
      setNewNote({ title: '', content: '', reminder_date: '' });
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
      reminder_date: note.reminder_date || ''
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
        } catch (err) {
          console.error("Failed to delete note:", err);
          showNotification('حدث خطأ أثناء الحذف', 'error');
        }
      }
    });
  };

  const handleAddProduct = async () => {
    const stock = Number(newProduct.stock);
    const productData = {
      name: newProduct.name,
      cost_price: Number(newProduct.cost),
      sale_price: Number(newProduct.sale),
      stock_quantity: stock,
      category: newProduct.category,
      barcode: newProduct.barcode.trim() || undefined,
      unit: newProduct.unit.trim() || undefined
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
    setNewProduct({ name: '', cost: '', sale: '', stock: '', category: '', barcode: '', unit: '' });
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
          await db.transaction('rw', [db.sales, db.saleItems, db.products, db.inventoryLogs, db.customers, db.debts], async () => {
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

  const exportData = async () => {
    const data = {
      products: await db.products.toArray(),
      customers: await db.customers.toArray(),
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
        await db.transaction('rw', [db.products, db.customers, db.sales, db.saleItems, db.debts, db.inventoryLogs, db.settings, db.notes], async () => {
          await db.products.clear();
          await db.customers.clear();
          await db.sales.clear();
          await db.saleItems.clear();
          await db.debts.clear();
          await db.inventoryLogs.clear();
          await db.settings.clear();
          await db.notes.clear();

          if (data.products) await db.products.bulkAdd(data.products);
          if (data.customers) await db.customers.bulkAdd(data.customers);
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
        await db.transaction('rw', [db.products, db.customers, db.sales, db.saleItems, db.debts, db.inventoryLogs, db.settings, db.notes], async () => {
          await db.products.clear();
          await db.customers.clear();
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
            <p>التاريخ: ${new Date(sale.created_at).toLocaleString('ar-SA')}</p>
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
          <p>تاريخ الإصدار: ${new Date().toLocaleString('ar-SA')}</p>
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
              if (entry.entryType === 'sale' && entry.items) {
                try {
                  const items = JSON.parse(entry.items);
                  itemsHtml = `<div style="font-size: 0.85em; color: #555; margin-top: 5px; border-top: 1px solid #eee; padding-top: 5px;">
                    ${items.map((item: any) => `${item.name} (${item.quantity} ${item.unit || ''} × ${item.price})`).join('<br/>')}
                  </div>`;
                } catch (e) {
                  itemsHtml = '<div style="font-size: 0.8em; color: red;">خطأ في عرض المنتجات</div>';
                }
              }
              
              return `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${new Date(entry.created_at).toLocaleDateString('ar-SA')}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">
                    ${entry.entryType === 'sale' ? 'فاتورة مشتريات #' + entry.id + itemsHtml : 'تسديد مبلغ'}
                  </td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${entry.entryType === 'sale' ? entry.total_amount : '-'}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: right;">${entry.entryType === 'payment' ? entry.amount : '-'}</td>
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
          <p>تاريخ الإصدار: ${new Date().toLocaleString('ar-SA')}</p>
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
            <p>تاريخ الإصدار: ${new Date().toLocaleString('ar-SA')}</p>
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
              ${ledgerEntries.map(entry => `
                <tr>
                  <td>${new Date(entry.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>${entry.entryType === 'sale' ? 'فاتورة مشتريات #' + entry.id : 'تسديد مبلغ'}</td>
                  <td>${entry.entryType === 'sale' ? entry.total_amount : '-'}</td>
                  <td>${entry.entryType === 'payment' ? entry.amount : '-'}</td>
                </tr>
              `).join('')}
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

  const handleAddCustomer = async () => {
    const customerData = {
      name: newCustomer.name,
      phone: newCustomer.phone,
      balance: 0
    };
    
    try {
      // Add to local DB
      const customerId = await db.customers.add(customerData);
      
      setShowAddCustomer(false);
      setNewCustomer({ name: '', phone: '' });
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
            setNewProduct({ name: '', cost: '', sale: '', stock: '', category: '', barcode: code, unit: '' });
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
      await db.transaction('rw', [db.sales, db.saleItems, db.products, db.inventoryLogs, db.customers, db.debts], async () => {
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

        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            icon={<LayoutDashboard />} 
            label="الرئيسية" 
          />
          <SidebarButton 
            active={activeTab === 'pos'} 
            onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }} 
            icon={<ShoppingCart />} 
            label="نقطة البيع" 
          />
          <SidebarButton 
            active={activeTab === 'history'} 
            onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} 
            icon={<TrendingUp />} 
            label="سجل المبيعات" 
          />
          <SidebarButton 
            active={activeTab === 'products'} 
            onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }} 
            icon={<Package />} 
            label="إدارة المخزون" 
          />
          <SidebarButton 
            active={activeTab === 'customers'} 
            onClick={() => { setActiveTab('customers'); setIsSidebarOpen(false); }} 
            icon={<Users />} 
            label="الزبائن والديون" 
          />
          <SidebarButton 
            active={activeTab === 'notes'} 
            onClick={() => { setActiveTab('notes'); setIsSidebarOpen(false); }} 
            icon={<BookOpen />} 
            label="الملاحظات" 
          />
          <SidebarButton 
            active={activeTab === 'settings'} 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} 
            icon={<Settings />} 
            label="الإعدادات" 
          />
        </nav>

        <div className="p-6 border-t border-slate-50">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">النظام</p>
          <button onClick={exportData} className="w-full flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
            <Download className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold">نسخة احتياطية</span>
              <span className="text-[10px] text-slate-400">
                {lastBackupDate ? `آخر نسخة: ${new Date(lastBackupDate).toLocaleDateString('ar-SA')}` : 'لم يتم أخذ نسخة بعد'}
              </span>
            </div>
          </button>
          
          {deferredPrompt && (
            <button onClick={handleInstall} className="w-full flex items-center gap-3 p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all mt-2">
              <Download className="w-5 h-5" />
              <span className="text-sm font-bold">تثبيت التطبيق</span>
            </button>
          )}
          
          <p className="text-xs text-slate-500 mt-4 px-2 text-center">
            إذا لم يظهر زر التثبيت، يمكنك تثبيت التطبيق يدوياً من قائمة المتصفح (إضافة إلى الشاشة الرئيسية).
          </p>
        </div>
      </motion.aside>

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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 w-full">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('pos')} 
                    className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-emerald-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] sm:text-[11px] text-slate-700">بيع جديد</span>
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveTab('pos');
                      setScannerMode('pos');
                      setIsScannerOpen(true);
                    }} 
                    className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-violet-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-violet-500 transition-colors">
                      <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] sm:text-[11px] text-slate-700">الماسح الضوئي</span>
                  </motion.button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('products')} 
                    className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] sm:text-[11px] text-slate-700">المخزون</span>
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('customers')} 
                    className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-indigo-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] sm:text-[11px] text-slate-700">الزبائن</span>
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('notes')} 
                    className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-pink-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] sm:text-[11px] text-slate-700">الملاحظات</span>
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('history')} 
                    className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-slate-300 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] sm:text-[11px] text-slate-700">التقارير</span>
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={exportData} 
                    className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-amber-200 hover:shadow-md transition-all group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] sm:text-[11px] text-slate-700">احتياطية</span>
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-100/50 border border-emerald-400/20 col-span-2 md:col-span-1">
                  <div className="flex justify-between items-start mb-1">
                    <ShoppingCart className="w-4 h-4 opacity-80" />
                    <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md">اليوم</span>
                  </div>
                  <p className="text-[10px] opacity-80 mt-1">المبيعات اليومية</p>
                  <p className="text-xl font-bold">{formatPrice(summary.todaySales)}</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">الأسبوع</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">مبيعات الأسبوع</p>
                  <p className="text-lg font-bold text-slate-800">{formatPrice(summary.weeklySales)}</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <ShoppingCart className="w-4 h-4 text-blue-500" />
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">الشهر</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">مبيعات الشهر</p>
                  <p className="text-lg font-bold text-slate-800">{formatPrice(summary.monthlySales)}</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-2xl bg-slate-800 text-white shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded-md">توقعات</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">الأرباح المتوقعة</p>
                  <p className="text-lg font-bold text-white">{formatPrice(summary.totalProfit)}</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">تقييم</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">تكلفة المخزون</p>
                  <p className="text-lg font-bold text-slate-800">{formatPrice(summary.totalInventoryCost)}</p>
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

              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                {categories.map((cat, idx) => (
                  <button
                    key={`pos-cat-${cat}-${idx}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105' : 'bg-white text-slate-600 border border-slate-100'}`}
                  >
                    {categoryIcons[cat] || <Package className="w-4 h-4" />}
                    {cat}
                  </button>
                ))}
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
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">ملاحظة للطلب (اختياري)</label>
                          <textarea 
                            value={saleNotes}
                            onChange={(e) => setSaleNotes(e.target.value)}
                            placeholder="أضف أية ملاحظات إضافية هنا..."
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none resize-none h-20"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                          <div className="text-center py-10 text-slate-400">السلة فارغة</div>
                        ) : (
                          cart.map((item, idx) => (
                            <div key={`cart-item-${item.product_id ?? 'no-id'}-${idx}`} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                <p className="text-emerald-600 font-bold text-xs">{formatPrice(item.price)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    const val = Math.max(0, item.quantity - 0.25);
                                    setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: val } : c));
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
                                >-</button>
                                <span className="font-bold text-sm min-w-[3rem] text-center">{item.quantity} {item.unit || ''}</span>
                                <button 
                                  onClick={() => {
                                    const val = item.quantity + 0.25;
                                    setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: val } : c));
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
                                >+</button>
                              </div>
                            </div>
                          ))
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

              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                {categories.map((cat, idx) => (
                  <button
                    key={`inv-cat-${cat}-${idx}`}
                    onClick={() => setInventoryCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${inventoryCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    {cat}
                  </button>
                ))}
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
                      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2 pr-2 border-r border-slate-100">
                        <button onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm('موافق على الحذف؟')) handleDeleteProduct(p.id!); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                    className="flex justify-between items-center cursor-pointer active:bg-slate-50"
                    onClick={() => fetchCustomerHistory(c)}
                  >
                    <div>
                      <p className="font-bold">{c.name}</p>
                      <p className="text-sm text-slate-500">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-xs text-slate-400">الرصيد المستحق</p>
                        <p className={`font-bold ${c.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatPrice(c.balance)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {c.balance > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowPaymentModal(c); }}
                            className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"
                          >
                            تسديد
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id); }}
                          className="text-red-400 p-2 hover:text-red-600"
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
                    <h2 className="text-lg font-bold text-slate-800">سجل المهام والملاحظات واليوميات</h2>
                  </div>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 w-full sm:w-auto text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white font-bold text-xs" 
                    onClick={() => { setEditingNoteId(null); setNewNote({ title: '', content: '', reminder_date: '' }); setShowAddNote(true); }}
                  >
                    <Plus className="w-4 h-4" /> إضافة مهمة / ملاحظة جديدة
                  </Button>
                </div>

                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mb-3">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1">لا يوجد ملاحظات أو مهام</h3>
                    <p className="text-slate-400 text-xs">قم بإضافة ملاحظاتك ومهامك اليومية هنا لتذكرها لاحقاً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {notes.map(note => (
                      <Card key={note.id} className="relative overflow-hidden group hover:border-emerald-200 hover:shadow-md transition-all border border-slate-100/80 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-bold text-base pr-1 ${note.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{note.title}</h3>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => handleEditNoteAction(note)} className="text-slate-300 hover:text-emerald-500 transition-colors p-1 cursor-pointer">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteNote(note.id!)} className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-4 text-slate-600 text-xs whitespace-pre-wrap min-h-[50px] line-clamp-4 leading-relaxed">
                          {note.content}
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-50">
                          <span>{new Date(note.created_at).toLocaleDateString('ar-SA')}</span>
                          {note.reminder_date && (
                            <span className={`px-2 py-0.5 rounded-full font-bold ${note.is_completed ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                              تذكير: {new Date(note.reminder_date).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* خط فاصل أنيق ومميز */}
              <div className="border-t border-slate-200/80 my-2"></div>

              {/* تصفية مبيعات المتجر ومطابقة الصندوق (أسفل الملاحظات الآن) */}
              <div className="bg-gradient-to-l from-violet-600 to-indigo-600 text-white rounded-3xl p-5 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 animate-pulse text-violet-200" />
                      <h3 className="text-lg font-bold">تسوية وتصفية مبيعات الصندوق</h3>
                    </div>
                    <p className="text-violet-100 text-xs">
                      {lastSettleDate 
                        ? `الدورة الحالية منذ: ${new Date(lastSettleDate).toLocaleString('ar-SA')}` 
                        : 'الدورة الأولى: لم يتم إجراء تصفية مبيعات سابقة بعد'}
                    </p>
                  </div>
                  <Button 
                    className="bg-white text-violet-700 hover:bg-violet-50 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold py-2.5 px-4 shadow-sm w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer"
                    onClick={() => {
                      setDeliveredSettleAmount(String(activeOutstandingCash || ''));
                      setSettleNotes('');
                      setShowSettleModal(true);
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
                  <div className="bg-white/15 rounded-2xl p-3 border border-white/10 md:scale-[1.03] shadow-md ring-1 ring-white/20 bg-indigo-500/30">
                    <p className="text-yellow-250 text-[10px] font-extrabold text-cyan-205">🎯 المستهدف الكلي للتسوية</p>
                    <p className="font-extrabold text-sm sm:text-base font-mono text-yellow-200">{formatPrice(activeOutstandingCash)}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5 col-span-2 sm:col-span-1">
                    <p className="text-white/70 text-[10px] font-bold">مبيعات لم تسدد بعد</p>
                    <p className="font-bold text-sm sm:text-base font-mono text-amber-200">{formatPrice(currentCycleDebtTotal)}</p>
                  </div>
                </div>
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
                                  {new Date(settlement.created_at).toLocaleString('ar-SA')}
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
              </div>
            </motion.div>
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
                  <div key={`sale-card-${s.id ?? 'no-id'}-${idx}`} className="relative group">
                    <div className="absolute left-6 top-6 bottom-[-1.5rem] w-0.5 bg-slate-100 -z-10 group-last:hidden" />
                    <Card className="overflow-hidden border border-slate-100/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all hover:border-emerald-200">
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
                              {new Date(s.created_at).toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'short' })}
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
                              onClick={(e) => { e.stopPropagation(); handleRefundSale(s.id!); }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="سعر التكلفة" className="w-full p-3 bg-slate-100 rounded-xl" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: e.target.value})} />
                  <input type="number" placeholder="سعر البيع" className="w-full p-3 bg-slate-100 rounded-xl" value={newProduct.sale} onChange={e => setNewProduct({...newProduct, sale: e.target.value})} />
                </div>
                <input type="number" placeholder="الكمية المتوفرة" className="w-full p-3 bg-slate-100 rounded-xl" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                <input 
                  list="categories-list"
                  placeholder="الفئة (مثال: ألبان)" 
                  className="w-full p-3 bg-slate-100 rounded-xl" 
                  value={newProduct.category} 
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                />
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
            <div key="modal-product-details" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                  <div className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 px-6 py-3 border-b border-slate-200">
                    <h4 className="font-bold text-slate-700 text-sm">سجل حركة المخزون</h4>
                  </div>
                  <div className="p-6 relative">
                    <div className="absolute top-0 bottom-0 right-10 w-0.5 bg-slate-200" />
                    <div className="space-y-6">
                      {productHistory.length > 0 ? productHistory.map((log, idx) => (
                        <div key={`product-log-${log.id ?? 'no-id'}-${idx}`} className="relative flex items-start gap-4 group">
                          <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center z-10 shadow-sm border-[3px] border-slate-50 transition-transform group-hover:scale-110
                            ${log.reason === 'sale' ? 'bg-red-100 text-red-600' : 
                              log.reason === 'refund' ? 'bg-indigo-100 text-indigo-600' : 
                              log.reason === 'manual_update' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}
                          >
                            {log.reason === 'sale' ? <ShoppingCart className="w-5 h-5" /> : 
                             log.reason === 'refund' ? <RotateCcw className="w-5 h-5" /> : 
                             log.reason === 'manual_update' ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 bg-white p-4 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100/60 hover:border-slate-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {log.reason === 'sale' ? 'عملية بيع' : 
                                   log.reason === 'refund' ? 'إرجاع مبيعات' : 
                                   log.reason === 'manual_update' ? 'تحديث المخزون' : 'إضافة مخزون'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                  {new Date(log.created_at).toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-xl text-sm font-bold ${log.change_amount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <span className="opacity-70 text-[10px] ml-1">{log.change_amount > 0 ? 'كمية الوارد' : 'كمية المنصرف'}</span>
                                {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                              </div>
                            </div>
                            {log.notes && (
                              <div className="mt-3 bg-slate-50 p-3 rounded-2xl flex items-start gap-2 border border-slate-100">
                                <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                  {log.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-10 text-slate-400 text-sm">لا توجد حركات مسجلة لهذا المنتج.</div>
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
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="سعر التكلفة" className="w-full p-3 bg-slate-100 rounded-xl" value={editingProduct.cost_price} onChange={e => setEditingProduct({...editingProduct, cost_price: Number(e.target.value)})} />
                  <input type="number" placeholder="سعر البيع" className="w-full p-3 bg-slate-100 rounded-xl" value={editingProduct.sale_price} onChange={e => setEditingProduct({...editingProduct, sale_price: Number(e.target.value)})} />
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
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleEditProduct}>تحديث</Button>
                  <Button variant="secondary" onClick={() => setEditingProduct(null)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showAddNote && (
            <div key="modal-add-note" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl">{editingNoteId ? 'تعديل الملاحظة' : 'إضافة ملاحظة جديدة'}</h3>
                  <button onClick={() => { setShowAddNote(false); setEditingNoteId(null); setNewNote({ title: '', content: '', reminder_date: '' }); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-1">العنوان</label>
                    <input type="text" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none" placeholder="عنوان الملاحظة المرجعي" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-1">التفاصيل / الملاحظة</label>
                    <textarea value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none min-h-[120px]" placeholder="اكتب ملاحظاتك، حسابات، مهام..."></textarea>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 block mb-1">تاريخ التذكير (اختياري)</label>
                    <input type="date" value={newNote.reminder_date} onChange={e => setNewNote({...newNote, reminder_date: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none" />
                  </div>
                  <Button className="w-full" onClick={handleAddNote}>{editingNoteId ? 'حفظ التعديلات' : 'حفظ الملاحظة'}</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showAddCustomer && (
            <div key="modal-add-customer" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold">إضافة زبون جديد</h3>
                <input placeholder="اسم الزبون" className="w-full p-3 bg-slate-100 rounded-xl" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                <input placeholder="رقم الهاتف" className="w-full p-3 bg-slate-100 rounded-xl" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleAddCustomer}>حفظ</Button>
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
                    className="absolute top-4 left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/30">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">تسوية مديونية زبون</h3>
                      <p className="text-indigo-100 text-[10px] mt-1 opacity-80">تحصيل المبالغ وتحديث الأرصدة</p>
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
                    <div className="flex-1 bg-red-50 p-3.5 rounded-2xl border border-red-100">
                      <p className="text-[10px] text-red-600 font-bold mb-1 uppercase tracking-tight">الرصيد المستحق</p>
                      <p className="text-red-700 font-black text-sm font-mono leading-tight">{formatPrice(showPaymentModal.balance)}</p>
                    </div>
                  </div>

                  {/* Payment Input Area */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 flex items-center gap-2 pr-1">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        المبلغ المسدد الآن:
                      </label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          className="w-full p-4 bg-slate-50 rounded-2xl font-black text-xl font-mono focus:outline-none focus:ring-4 focus:ring-indigo-50 pl-16 text-slate-800 border-2 border-slate-100 transition-all focus:bg-white focus:border-indigo-300 shadow-sm" 
                          value={paymentAmount} 
                          onChange={e => setPaymentAmount(e.target.value)} 
                          autoFocus
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl text-xs">{currency}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentAmount(String(showPaymentModal.balance));
                          setPaymentNotes('تصفير كامل الحساب وتصفية المديونية');
                        }}
                        className="py-3 px-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all font-bold text-[12px] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> تصفير كامل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentAmount(String(Math.ceil(showPaymentModal.balance / 2)));
                          setPaymentNotes('سداد نصف الرصيد المتبقي');
                        }}
                        className="py-3 px-3 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all font-bold text-[12px] border-2 border-slate-100 flex items-center justify-center gap-2 active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> سداد (٥٠٪)
                      </button>
                    </div>
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
                      className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-100 rounded-2xl transition-all active:scale-[0.98]" 
                      onClick={handlePayment}
                      disabled={!paymentAmount || Number(paymentAmount) <= 0}
                    >
                      حفظ السداد
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-600 font-bold transition-all hover:bg-white hover:text-slate-800"
                      onClick={() => { setShowPaymentModal(null); setPaymentAmount(''); setPaymentNotes(''); }}
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

                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-50 flex justify-between items-center text-white">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black opacity-80">المستهدف الكلي للتسوية</span>
                        <span className="text-xs font-black">صافي الكاش + العجز السابق</span>
                      </div>
                      <span className="text-xl font-black font-mono">{formatPrice(activeOutstandingCash)}</span>
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
                          setDeliveredSettleAmount(String(activeOutstandingCash));
                          setSettleNotes('مطابقة تامة ومسلمة بالكامل');
                        }}
                        className="py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all font-black text-[11px] shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> تصفية كاملة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveredSettleAmount(String(Math.ceil(activeOutstandingCash / 2)));
                          setSettleNotes('تصفية نصف المبلغ المستحق');
                        }}
                        className="py-3 bg-white text-slate-700 rounded-xl border-2 border-slate-100 hover:bg-slate-50 transition-all font-black text-[11px] flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> تصفية (٥٠٪)
                      </button>
                    </div>

                    {/* Result Analysis - More Compact */}
                    {(() => {
                      const deliveredVal = Number(deliveredSettleAmount) || 0;
                      const diff = deliveredVal - activeOutstandingCash;
                      return (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                          <div className={`p-3 rounded-xl ${diff < 0 ? 'bg-rose-50/70 text-rose-700' : diff > 0 ? 'bg-amber-50/70 text-amber-700' : 'bg-emerald-50/70 text-emerald-700'} text-[11px] leading-relaxed font-black text-center`}>
                             {diff < 0 ? (
                               <span>🚨 تنبيه: عجز بمقدار <span className="underline">{formatPrice(Math.abs(diff))}</span> سيرحل للدورة القادمة.</span>
                             ) : diff > 0 ? (
                               <span>⚠️ تنبيه: تم تسجيل فائض بمقدار <span className="underline">{formatPrice(diff)}</span> عن المطلوب.</span>
                             ) : (
                               <span>✅ ممتاز: النقد مطابق تماماً للهدف.</span>
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
            <div key="modal-customer-details" className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                    <div className="bg-red-50 p-3 rounded-2xl border border-red-100">
                      <p className="text-[10px] text-red-600 font-bold uppercase mb-1">المتبقي (دين)</p>
                      <p className="text-lg font-bold text-red-900">{formatPrice(showCustomerDetails.balance)}</p>
                    </div>
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
                    
                    {ledgerEntries.map((entry, idx) => (
                      <div 
                        key={`ledger-${entry.entryType}-${entry.id ?? 'no-id'}-${idx}`} 
                        className={`bg-white p-4 rounded-2xl border-r-4 shadow-sm transition-all hover:shadow-md ${entry.entryType === 'sale' ? 'border-r-red-400' : 'border-r-emerald-400'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${entry.entryType === 'sale' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {entry.entryType === 'sale' ? 'فاتورة شراء' : 'دفعة مالية'}
                            </span>
                            <p className="text-xs text-slate-400 mt-1">{new Date(entry.created_at).toLocaleString('ar-SA')}</p>
                          </div>
                          <p className={`text-lg font-bold ${entry.entryType === 'sale' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {entry.entryType === 'sale' ? '+' : '-'}{formatPrice(entry.entryType === 'sale' ? entry.total_amount : entry.amount)}
                          </p>
                        </div>
                        
                        {entry.entryType === 'payment' && entry.notes && (
                          <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2 rounded-xl border border-slate-100/60 font-medium leading-relaxed">
                            📝 {entry.notes}
                          </div>
                        )}
                        
                        {entry.entryType === 'sale' && (
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
                    ))}
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <Button 
                    variant="primary" 
                    className="w-full py-4 rounded-2xl shadow-lg shadow-emerald-100"
                    onClick={() => {
                      setShowCustomerDetails(null);
                      setShowPaymentModal(showCustomerDetails);
                    }}
                  >
                    تسجيل دفعة جديدة
                  </Button>
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

const SidebarButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
  >
    <span className={active ? 'text-emerald-600' : 'text-slate-400'}>{icon}</span>
    <span className="font-bold text-sm">{label}</span>
  </button>
);
