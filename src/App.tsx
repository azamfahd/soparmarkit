import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
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
  FileText,
  Droplet,
  Milk,
  Sparkles,
  Coffee,
  Leaf,
  Apple,
  Beef,
  Croissant,
  Menu,
  X
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
import { remoteApi as api } from './services/apiService';
import { syncService } from './services/syncService';
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

  const [summary, setSummary] = useState<Summary>({ totalSales: 0, totalDebts: 0, lowStock: 0, totalProfit: 0 });
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'debt'>('cash');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', cost: '', sale: '', stock: '', category: '' });
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
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [storeName, setStoreName] = useState('بقالة السعادة');
  const [currency, setCurrency] = useState('ر.ي');
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  const appSettings = useLiveQuery(() => db.settings.toArray()) || [];

  useEffect(() => {
    const nameSetting = appSettings.find(s => s.key === 'storeName');
    if (nameSetting) {
      setStoreName(nameSetting.value);
    }
    const currencySetting = appSettings.find(s => s.key === 'currency');
    if (currencySetting) {
      setCurrency(currencySetting.value);
    }
  }, [appSettings]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    
    const handleOnline = () => {
      syncService.processQueue();
      showNotification('تم استعادة الاتصال، جاري مزامنة البيانات...');
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
  }, [products, customers, sales]);

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
    try {
      const summary = await api.reports.getSummary();
      setSummary(summary);
    } catch (err) {
      if (err instanceof Error && err.message !== "Supabase is not configured.") {
        console.error("Failed to fetch summary:", err);
      }
      // Fallback to local DB if API fails
      const allSales = await db.sales.toArray();
      const allCustomers = await db.customers.toArray();
      const lowStockCount = await db.products.where('stock_quantity').below(5).count();
      
      const totalSales = allSales.reduce((sum, s) => sum + s.total_amount, 0);
      const totalDebts = allCustomers.reduce((sum, c) => sum + c.balance, 0);

      // Profit calculation
      const allSaleItems = await db.saleItems.toArray();
      const allProducts = await db.products.toArray();
      const productMap = new Map(allProducts.map(p => [p.id, p]));
      
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
        totalProfit
      });
    }
  };

  const fetchDailySales = async () => {
    try {
      const data = await api.reports.getDailySales();
      setDailySales(data);
    } catch (err) {
      if (err instanceof Error && err.message !== "Supabase is not configured.") {
        console.error("Failed to fetch daily sales:", err);
      }
      // Fallback to local DB if API fails
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
    }
  };

  const fetchProductHistory = async (product: Product) => {
    try {
      const history = await api.products.getHistory(product.id!);
      setProductHistory(history);
    } catch (err) {
      console.error("Failed to fetch product history:", err);
      // Fallback to local DB if API fails
      const history = await db.inventoryLogs
        .where('product_id')
        .equals(product.id!)
        .reverse()
        .limit(50)
        .toArray();
      setProductHistory(history);
    }
    setShowProductDetails(product);
  };

  const fetchCustomerHistory = async (customer: Customer) => {
    try {
      const data = await api.customers.getHistory(customer.id!);
      setCustomerHistory(data);
    } catch (err) {
      console.error("Failed to fetch customer history:", err);
      // Fallback to local DB if API fails
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
            price: si.price_at_sale
          })))
      }));

      const debts = await db.debts
        .where('customer_id')
        .equals(customer.id!)
        .reverse()
        .toArray();

      setCustomerHistory({ sales: salesWithItems, debts });
    }
    setShowCustomerDetails(customer);
  };

  const handlePayment = async () => {
    if (!showPaymentModal || !showPaymentModal.id) return;
    const amount = Number(paymentAmount);
    
    try {
      // 1. Update local DB
      await db.transaction('rw', [db.customers, db.debts], async () => {
        await db.customers.update(showPaymentModal.id!, {
          balance: showPaymentModal.balance - amount
        });
        await db.debts.add({
          customer_id: showPaymentModal.id!,
          amount: amount,
          type: 'payment',
          created_at: new Date().toISOString()
        });
      });
      
      // 2. Sync to Supabase
      await api.customers.pay(showPaymentModal.id, amount);
      
      showNotification('تم تسجيل الدفعة بنجاح');
    } catch (err) {
      console.error("Failed to process payment:", err);
      showNotification('خطأ في تسجيل الدفعة', 'error');
    }

    setShowPaymentModal(null);
    setPaymentAmount('');
  };

  const handleAddProduct = async () => {
    const stock = Number(newProduct.stock);
    const productData = {
      name: newProduct.name,
      cost_price: Number(newProduct.cost),
      sale_price: Number(newProduct.sale),
      stock_quantity: stock,
      category: newProduct.category
    };

    try {
      // 1. Add to local DB
      const productId = await db.products.add(productData);
      await db.inventoryLogs.add({
        product_id: productId as number,
        change_amount: stock,
        reason: 'initial',
        created_at: new Date().toISOString()
      });
      
      // 2. Sync to Supabase
      await api.products.add({ ...productData, id: productId });
      
      showNotification('تم إضافة المنتج بنجاح');
    } catch (err) {
      console.error("Failed to add product:", err);
      showNotification('خطأ في إضافة المنتج', 'error');
    }

    setShowAddProduct(false);
    setNewProduct({ name: '', cost: '', sale: '', stock: '', category: '' });
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.id) return;
    
    try {
      // 1. Update local DB
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

      // 2. Sync to Supabase
      await api.products.update(editingProduct.id, editingProduct);
      
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
          // 1. Delete from local DB
          await db.products.delete(id);
          
          // 2. Sync to Supabase
          await api.products.delete(id);
          
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
          // 1. Delete from local DB
          await db.customers.delete(id);
          
          // 2. Sync to Supabase
          await api.customers.delete(id);
          
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
          // 1. Update local DB
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
          
          // 2. Sync to Supabase
          await api.sales.delete(id);
          
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
      showNotification('تم تحديث اسم البقالة');
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
      showNotification('تم تحديث اسم البقالة (محلياً)');
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
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storeName}_بيانات_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showNotification('تم تصدير نسخة احتياطية بنجاح');
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await db.transaction('rw', [db.products, db.customers, db.sales, db.saleItems, db.debts, db.inventoryLogs, db.settings], async () => {
          await db.products.clear();
          await db.customers.clear();
          await db.sales.clear();
          await db.saleItems.clear();
          await db.debts.clear();
          await db.inventoryLogs.clear();
          await db.settings.clear();

          if (data.products) await db.products.bulkAdd(data.products);
          if (data.customers) await db.customers.bulkAdd(data.customers);
          if (data.sales) await db.sales.bulkAdd(data.sales);
          if (data.saleItems) await db.saleItems.bulkAdd(data.saleItems);
          if (data.debts) await db.debts.bulkAdd(data.debts);
          if (data.inventoryLogs) await db.inventoryLogs.bulkAdd(data.inventoryLogs);
          if (data.settings) await db.settings.bulkAdd(data.settings);
        });
        showNotification('تم استيراد البيانات بنجاح');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showNotification('خطأ في استيراد البيانات', 'error');
      }
    };
    reader.readAsText(file);
  };

  const resetDatabase = async () => {
    setConfirmAction({
      title: 'إعادة ضبط البرنامج',
      message: 'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذه الخطوة وسيتم حذف كل المنتجات والزبائن والمبيعات.',
      onConfirm: async () => {
        await db.transaction('rw', [db.products, db.customers, db.sales, db.saleItems, db.debts, db.inventoryLogs, db.settings], async () => {
          await db.products.clear();
          await db.customers.clear();
          await db.sales.clear();
          await db.saleItems.clear();
          await db.debts.clear();
          await db.inventoryLogs.clear();
          await db.settings.clear();
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
          <p>طريقة الدفع: ${sale.payment_type === 'cash' ? 'كاش' : 'دين'}</p>
          <div class="footer">شكراً لزيارتكم!</div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      // 1. Add to local DB
      const customerId = await db.customers.add(customerData);
      
      // 2. Sync to Supabase
      await api.customers.add({ ...customerData, id: customerId });
      
      setShowAddCustomer(false);
      setNewCustomer({ name: '', phone: '' });
      showNotification('تم إضافة الزبون بنجاح');
    } catch (err) {
      console.error("Failed to add customer:", err);
      showNotification('خطأ في إضافة الزبون', 'error');
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
      setCart([...cart, { product_id: product.id, name: product.name, price: product.sale_price, quantity: quantity, max_stock: product.stock_quantity }]);
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
      await api.sales.add(saleData);
      showNotification('تمت العملية بنجاح');
    } catch (err) {
      console.error("Failed to checkout:", err);
      // Fallback to local DB
      await db.transaction('rw', [db.sales, db.saleItems, db.products, db.inventoryLogs, db.customers, db.debts], async () => {
        const saleId = await db.sales.add({
          customer_id: selectedCustomer,
          total_amount: total,
          payment_type: paymentType,
          created_at: new Date().toISOString()
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
      showNotification('تمت العملية بنجاح (محلياً)');
    }

    setCart([]);
    setSelectedCustomer(null);
    setPaymentType('cash');
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
            <span className="text-sm font-bold">نسخة احتياطية</span>
          </button>
          
          {deferredPrompt && (
            <button onClick={handleInstall} className="w-full flex items-center gap-3 p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all mt-2">
              <Download className="w-5 h-5" />
              <span className="text-sm font-bold">تثبيت التطبيق</span>
            </button>
          )}
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
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-100">
                  <div className="flex justify-between items-start mb-2">
                    <ShoppingCart className="w-5 h-5 opacity-80" />
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">اليوم</span>
                  </div>
                  <p className="text-xs opacity-80">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold">{formatPrice(summary.totalSales)}</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <TrendingUp className="w-5 h-5 opacity-80" />
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">صافي</span>
                  </div>
                  <p className="text-xs opacity-80">الأرباح المتوقعة</p>
                  <p className="text-2xl font-bold">{formatPrice(summary.totalProfit)}</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs text-slate-400">إجمالي الديون</p>
                  <p className="text-2xl font-bold text-slate-800">{formatPrice(summary.totalDebts)}</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                  </div>
                  <p className="text-xs text-slate-400">قاعدة الزبائن</p>
                  <p className="text-2xl font-bold text-slate-800">{customers.length} <span className="text-xs font-normal text-slate-400">فرد</span></p>
                </motion.div>
              </div>

              {summary.lowStock > 0 && (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-red-50 p-4 rounded-3xl border border-red-100 flex items-center gap-4"
                >
                  <div className="bg-red-100 p-3 rounded-2xl">
                    <AlertCircle className="text-red-600 w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-red-900">تنبيه المخزون</p>
                    <p className="text-sm text-red-600">لديك {summary.lowStock} منتجات قاربت على النفاد. يرجى مراجعة المخزون.</p>
                  </div>
                </motion.div>
              )}

              <Card className="p-6 h-72 rounded-3xl shadow-sm border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">تحليل المبيعات الأسبوعي</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] text-slate-400">المبيعات</span>
                    </div>
                  </div>
                </div>
                <div className="h-48 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySales}>
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
                        tickFormatter={(val) => new Date(val).toLocaleDateString('ar-SA', { weekday: 'short' })}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        labelFormatter={(val) => new Date(val).toLocaleDateString('ar-SA', { dateStyle: 'full' })}
                      />
                      <Bar dataKey="total" fill="url(#colorTotal)" radius={[6, 6, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800">العمليات السريعة</h2>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('pos')} 
                    className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-emerald-200 transition-all group"
                  >
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                      <ShoppingCart className="text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-slate-700">بيع جديد</span>
                  </motion.button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('products')} 
                    className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-blue-200 transition-all group"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                      <Package className="text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-slate-700">المخزون</span>
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={exportData} 
                    className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-amber-200 transition-all group"
                  >
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                      <Download className="text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-slate-700">نسخة احتياطية</span>
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('history')} 
                    className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3 hover:border-slate-300 transition-all group"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                      <FileText className="text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-bold text-slate-700">التقارير</span>
                  </motion.button>
                </div>
              </div>
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
                <button onClick={() => setActiveTab('dashboard')}><ChevronLeft className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold">نقطة البيع</h2>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث عن منتج..." 
                  className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
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
                  .map(p => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={p.id} 
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
                          {p.stock_quantity <= 0 ? 'نفذ' : p.stock_quantity}
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
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white space-y-4">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">السلة</h2>
                          <button onClick={() => setIsCartExpanded(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="w-6 h-6 text-slate-500" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">الزبون</label>
                            <select 
                              className="w-full p-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              value={selectedCustomer || ''}
                              onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
                            >
                              <option value="">زبون نقدي</option>
                              {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400">طريقة الدفع</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                              <button 
                                onClick={() => setPaymentType('cash')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'cash' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                كاش
                              </button>
                              <button 
                                onClick={() => setPaymentType('debt')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'debt' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                دين
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/50">
                        {cart.map(item => (
                          <div key={item.product_id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center transition-all hover:border-emerald-100">
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                              <div className="flex items-center gap-6 mt-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-600 font-extrabold text-lg">{formatPrice(item.price)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                    <button 
                                      onClick={() => {
                                        const val = Math.max(0, item.quantity - 0.25);
                                        setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: val } : c));
                                      }}
                                      className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                                    >-</button>
                                    <input 
                                      type="number"
                                      step="0.25"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val) && val >= 0) {
                                          setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: val } : c));
                                        }
                                      }}
                                      className="w-16 p-2 text-center text-slate-700 font-bold outline-none bg-transparent"
                                    />
                                    <button 
                                      onClick={() => {
                                        const val = item.quantity + 0.25;
                                        setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: val } : c));
                                      }}
                                      className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold transition-colors"
                                    >+</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="font-extrabold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                              <button 
                                onClick={() => removeFromCart(item.product_id)}
                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <Button 
                          className="w-full py-5 text-lg rounded-2xl font-extrabold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all" 
                          onClick={() => { handleCheckout(); setIsCartExpanded(false); }}
                          disabled={paymentType === 'debt' && !selectedCustomer}
                        >
                          تأكيد العملية ({formatPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))})
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
                <h2 className="text-xl font-bold">إدارة الأصناف</h2>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowAddProduct(true)}>
                  <Plus className="w-4 h-4" /> إضافة صنف
                </Button>
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
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setInventoryCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${inventoryCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {products
                  .filter(p => (inventoryCategory === 'الكل' || p.category === inventoryCategory) && p.name.includes(inventorySearchTerm))
                  .map(p => (
                  <Card key={p.id} className="flex justify-between items-center group">
                    <div className="flex-1 cursor-pointer" onClick={() => fetchProductHistory(p)}>
                      <p className="font-bold hover:text-blue-600 transition-colors">{p.name}</p>
                      <p className="text-xs text-slate-400">التكلفة: {p.cost_price} | البيع: {p.sale_price} | {p.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock_quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {p.stock_quantity} قطعة
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
                <h2 className="text-xl font-bold">الزبائن والديون</h2>
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
                  .map(c => (
                  <Card 
                    key={c.id} 
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

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800">إعدادات النظام</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Edit className="w-5 h-5" />
                    <h3 className="font-bold">إعدادات المتجر</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">اسم البقالة</label>
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
                    <h3 className="font-bold">البيانات والنسخ الاحتياطي</h3>
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
              </div>
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">سجل المبيعات</h2>
              <div className="space-y-2">
                {enrichedSales.map(s => (
                  <Card key={s.id} className="flex justify-between items-center border-r-4 border-emerald-500 group">
                    <div className="flex-1">
                      <p className="font-bold">{s.customer_name}</p>
                      <p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleString('ar-SA')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="font-bold text-emerald-700">{formatPrice(s.total_amount)}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{s.payment_type === 'cash' ? 'كاش' : 'دين'}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => printReceipt(s)}
                          className="p-2 text-slate-400 hover:text-emerald-600"
                          title="طباعة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRefundSale(s.id)}
                          className="p-2 text-red-400 hover:text-red-600"
                          title="إلغاء العملية"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {notification && (
            <motion.div 
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
            <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
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
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold">إضافة صنف جديد</h3>
                <input placeholder="اسم المنتج" className="w-full p-3 bg-slate-100 rounded-xl" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
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
                  {categories.filter(c => c !== 'الكل').map(c => <option key={c} value={c} />)}
                </datalist>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleAddProduct}>حفظ</Button>
                  <Button variant="secondary" onClick={() => setShowAddProduct(false)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showProductDetails && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-slate-50 w-full max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                <div className="bg-white p-6 border-b border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{showProductDetails.name}</h3>
                      <p className="text-slate-500 text-sm">{showProductDetails.category}</p>
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

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm px-2">سجل حركة المخزون</h4>
                  {productHistory.map((log, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          {log.reason === 'sale' ? 'عملية بيع' : 
                           log.reason === 'refund' ? 'إرجاع مبيعات' : 
                           log.reason === 'manual_update' ? 'تحديث يدوي' : 'رصيد أول المدة'}
                        </p>
                        <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString('ar-SA')}</p>
                      </div>
                      <p className={`font-bold ${log.change_amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white border-t border-slate-100">
                  <Button variant="secondary" className="w-full" onClick={() => setShowProductDetails(null)}>إغلاق</Button>
                </div>
              </motion.div>
            </div>
          )}

          {editingProduct && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold">تعديل صنف: {editingProduct.name}</h3>
                <input placeholder="اسم المنتج" className="w-full p-3 bg-slate-100 rounded-xl" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
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
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handleEditProduct}>تحديث</Button>
                  <Button variant="secondary" onClick={() => setEditingProduct(null)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showAddCustomer && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
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
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-xl font-bold">تسديد دين: {showPaymentModal.name}</h3>
                <p className="text-sm text-slate-500">الرصيد الحالي: {formatPrice(showPaymentModal.balance)}</p>
                <input 
                  type="number" 
                  placeholder="المبلغ المدفوع" 
                  className="w-full p-3 bg-slate-100 rounded-xl" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                />
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={handlePayment}>تأكيد الدفع</Button>
                  <Button variant="secondary" onClick={() => setShowPaymentModal(null)}>إلغاء</Button>
                </div>
              </motion.div>
            </div>
          )}

          {showCustomerDetails && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                    <button 
                      onClick={() => printStatement(showCustomerDetails)}
                      className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
                    >
                      <Printer className="w-3 h-3" /> طباعة/حفظ كـ PDF
                    </button>
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
                        key={idx} 
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
                        
                        {entry.entryType === 'sale' && (
                          <div className="mt-3 pt-3 border-t border-slate-50">
                            <div className="space-y-1">
                              {JSON.parse(entry.items).map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs text-slate-600">
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
