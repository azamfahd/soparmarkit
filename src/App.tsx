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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { api } from './services/api';

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
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalSales: 0, totalDebts: 0, lowStock: 0, totalProfit: 0 });
  const [dailySales, setDailySales] = useState<any[]>([]);
  
  // UI States
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
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [storeName, setStoreName] = useState('بقالة السعادة');
  const [currency, setCurrency] = useState('ر.ي');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, customersData, salesData, summaryData, dailyData] = await Promise.all([
        api.products.getAll(),
        api.customers.getAll(),
        api.sales.getAll(),
        api.reports.getSummary(),
        api.reports.getDailySales()
      ]);
      setProducts(productsData);
      setCustomers(customersData);
      setSales(salesData);
      setSummary(summaryData);
      setDailySales(dailyData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showNotification('فشل الاتصال بالخادم. تأكد من تشغيل البرنامج.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Refresh data when online
    window.addEventListener('online', fetchData);
    return () => window.removeEventListener('online', fetchData);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const formatPrice = (price: number) => `${price} ${currency}`;

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

  const handleAddProduct = async () => {
    const productData = {
      name: newProduct.name,
      cost_price: Number(newProduct.cost),
      sale_price: Number(newProduct.sale),
      stock_quantity: Number(newProduct.stock),
      category: newProduct.category
    };

    try {
      await api.products.add(productData);
      showNotification('تم إضافة المنتج بنجاح');
      fetchData();
      setShowAddProduct(false);
      setNewProduct({ name: '', cost: '', sale: '', stock: '', category: '' });
    } catch (err) {
      showNotification('فشل إضافة المنتج', 'error');
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editingProduct.id) return;
    try {
      await api.products.update(editingProduct.id, editingProduct);
      showNotification('تم تحديث المنتج بنجاح');
      fetchData();
      setEditingProduct(null);
    } catch (err) {
      showNotification('فشل تحديث المنتج', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    setConfirmAction({
      title: 'حذف منتج',
      message: 'هل أنت متأكد من حذف هذا المنتج؟',
      onConfirm: async () => {
        try {
          await api.products.delete(id);
          showNotification('تم حذف المنتج');
          fetchData();
        } catch (err) {
          showNotification('فشل حذف المنتج', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleAddCustomer = async () => {
    try {
      await api.customers.add({
        name: newCustomer.name,
        phone: newCustomer.phone
      });
      showNotification('تم إضافة الزبون بنجاح');
      fetchData();
      setShowAddCustomer(false);
      setNewCustomer({ name: '', phone: '' });
    } catch (err) {
      showNotification('فشل إضافة الزبون', 'error');
    }
  };

  const handlePayment = async () => {
    if (!showPaymentModal || !showPaymentModal.id) return;
    try {
      await api.customers.pay(showPaymentModal.id, Number(paymentAmount));
      showNotification('تم تسجيل الدفعة بنجاح');
      fetchData();
      setShowPaymentModal(null);
      setPaymentAmount('');
    } catch (err) {
      showNotification('فشل تسجيل الدفعة', 'error');
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
      setCart([...cart, { product_id: product.id, name: product.name, price: product.sale_price, quantity: quantity, max_stock: product.stock_quantity }]);
    }
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
      fetchData();
      setCart([]);
      setSelectedCustomer(null);
      setPaymentType('cash');
    } catch (err) {
      showNotification('فشل إتمام العملية', 'error');
    }
  };

  // Filtered Data
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (selectedCategory === 'الكل' || p.category === selectedCategory)
  );

  const inventoryProducts = products.filter(p => 
    p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) && 
    (inventoryCategory === 'الكل' || p.category === inventoryCategory)
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
    c.phone.includes(customerSearchTerm)
  );

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
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
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
            { id: 'pos', icon: ShoppingCart, label: 'نقطة البيع' },
            { id: 'inventory', icon: Package, label: 'المخزون' },
            { id: 'customers', icon: Users, label: 'الزبائن والديون' },
            { id: 'sales', icon: FileText, label: 'سجل المبيعات' },
            { id: 'settings', icon: Settings, label: 'الإعدادات' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {deferredPrompt && (
          <div className="p-4 border-t border-slate-50">
            <Button onClick={handleInstall} className="w-full flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              تثبيت التطبيق
            </Button>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white shadow-sm rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
              <Menu className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {activeTab === 'dashboard' && 'لوحة التحكم'}
                {activeTab === 'pos' && 'نقطة البيع'}
                {activeTab === 'inventory' && 'إدارة المخزون'}
                {activeTab === 'customers' && 'الزبائن والديون'}
                {activeTab === 'sales' && 'سجل المبيعات'}
                {activeTab === 'settings' && 'الإعدادات'}
              </h1>
              <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <ConnectionStatus />
        </header>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-r-4 border-emerald-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">إجمالي المبيعات</p>
                      <h3 className="text-2xl font-bold text-slate-800">{formatPrice(summary.totalSales)}</h3>
                    </div>
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
                <Card className="border-r-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">إجمالي الديون</p>
                      <h3 className="text-2xl font-bold text-slate-800">{formatPrice(summary.totalDebts)}</h3>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
                <Card className="border-r-4 border-amber-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">نقص المخزون</p>
                      <h3 className="text-2xl font-bold text-slate-800">{summary.lowStock} منتجات</h3>
                    </div>
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
                <Card className="border-r-4 border-purple-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">صافي الأرباح</p>
                      <h3 className="text-2xl font-bold text-slate-800">{formatPrice(summary.totalProfit)}</h3>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <h3 className="font-bold text-slate-800 mb-6">مبيعات آخر 7 أيام</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailySales}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card>
                  <h3 className="font-bold text-slate-800 mb-4">أحدث المبيعات</h3>
                  <div className="space-y-4">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div>
                          <p className="font-semibold text-slate-800">#{sale.id}</p>
                          <p className="text-xs text-slate-500">{new Date(sale.created_at).toLocaleTimeString('ar-SA')}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-emerald-600">{formatPrice(sale.total_amount)}</p>
                          <p className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 inline-block">
                            {sale.payment_type === 'cash' ? 'كاش' : 'دين'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'pos' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="ابحث عن منتج..."
                      className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl whitespace-nowrap flex items-center gap-2 transition-all ${
                          selectedCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {categoryIcons[cat] || <Package className="w-4 h-4" />}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-200 transition-colors">
                        <Package className="w-12 h-12" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1 truncate">{product.name}</h4>
                      <p className="text-emerald-600 font-bold">{formatPrice(product.sale_price)}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${product.stock_quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                          المخزون: {product.stock_quantity}
                        </span>
                        <Plus className="w-5 h-5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-6 flex flex-col h-[calc(100vh-180px)]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      السلة ({cart.length})
                    </h3>
                    <button onClick={() => setCart([])} className="text-red-500 text-sm hover:underline">تفريغ</button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-1">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <ShoppingCart className="w-12 h-12 mb-2" />
                        <p>السلة فارغة</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.product_id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                            <p className="text-xs text-emerald-600">{formatPrice(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white rounded-lg border border-slate-200">
                              <button onClick={() => {
                                const newQty = item.quantity - 1;
                                if (newQty <= 0) {
                                  setCart(cart.filter(i => i.product_id !== item.product_id));
                                } else {
                                  setCart(cart.map(i => i.product_id === item.product_id ? { ...i, quantity: newQty } : i));
                                }
                              }} className="p-1 hover:text-emerald-600">-</button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                              <button onClick={() => {
                                if (item.quantity < item.max_stock) {
                                  setCart(cart.map(i => i.product_id === item.product_id ? { ...i, quantity: item.quantity + 1 } : i));
                                } else {
                                  showNotification('تجاوزت الكمية المتاحة', 'error');
                                }
                              }} className="p-1 hover:text-emerald-600">+</button>
                            </div>
                            <button onClick={() => setCart(cart.filter(i => i.product_id !== item.product_id))} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500">الزبون</label>
                      <select 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        value={selectedCustomer || ''}
                        onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
                      >
                        <option value="">زبون نقدي</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.balance})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPaymentType('cash')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentType === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >كاش</button>
                      <button 
                        onClick={() => setPaymentType('debt')}
                        disabled={!selectedCustomer}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentType === 'debt' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 disabled:opacity-50'}`}
                      >دين</button>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">الإجمالي:</span>
                      <span className="text-2xl font-black text-emerald-600">
                        {formatPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                      </span>
                    </div>

                    <Button 
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                      className="w-full py-4 text-lg shadow-lg shadow-emerald-100"
                    >
                      إتمام العملية
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ابحث في المخزون..."
                    className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                    value={inventorySearchTerm}
                    onChange={(e) => setInventorySearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  إضافة منتج جديد
                </Button>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm">
                        <th className="p-4 font-bold">المنتج</th>
                        <th className="p-4 font-bold">التصنيف</th>
                        <th className="p-4 font-bold">سعر التكلفة</th>
                        <th className="p-4 font-bold">سعر البيع</th>
                        <th className="p-4 font-bold">المخزون</th>
                        <th className="p-4 font-bold">الربح المتوقع</th>
                        <th className="p-4 font-bold">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryProducts.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-semibold text-slate-800">{product.name}</td>
                          <td className="p-4 text-slate-500">{product.category}</td>
                          <td className="p-4 text-slate-600">{formatPrice(product.cost_price)}</td>
                          <td className="p-4 text-emerald-600 font-bold">{formatPrice(product.sale_price)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${product.stock_quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="p-4 text-purple-600 font-bold">{formatPrice(product.sale_price - product.cost_price)}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button onClick={() => setEditingProduct(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ابحث عن زبون..."
                    className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => setShowAddCustomer(true)} className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  إضافة زبون جديد
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map(customer => (
                  <Card key={customer.id} className="group hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-slate-100 p-3 rounded-2xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-slate-400 mb-1">الرصيد الحالي</p>
                        <h4 className={`text-xl font-black ${customer.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {formatPrice(customer.balance)}
                        </h4>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{customer.name}</h3>
                    <p className="text-slate-500 text-sm mb-6">{customer.phone || 'بدون رقم هاتف'}</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowPaymentModal(customer)} variant="outline" className="flex-1 text-xs">تسديد مبلغ</Button>
                      <Button onClick={async () => {
                        const history = await api.customers.getHistory(customer.id!);
                        setCustomerHistory(history);
                        setShowCustomerDetails(customer);
                      }} variant="secondary" className="flex-1 text-xs">التفاصيل</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm">
                        <th className="p-4 font-bold">رقم العملية</th>
                        <th className="p-4 font-bold">التاريخ</th>
                        <th className="p-4 font-bold">الزبون</th>
                        <th className="p-4 font-bold">المبلغ</th>
                        <th className="p-4 font-bold">طريقة الدفع</th>
                        <th className="p-4 font-bold">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">#{sale.id}</td>
                          <td className="p-4 text-slate-500">{new Date(sale.created_at).toLocaleString('ar-SA')}</td>
                          <td className="p-4 text-slate-700">{sale.customer_name || 'زبون نقدي'}</td>
                          <td className="p-4 text-emerald-600 font-bold">{formatPrice(sale.total_amount)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${sale.payment_type === 'cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                              {sale.payment_type === 'cash' ? 'كاش' : 'دين'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
              <Card>
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  إعدادات المتجر
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم المتجر</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">العملة</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    />
                  </div>
                  <Button className="w-full py-3">حفظ الإعدادات</Button>
                </div>
              </Card>

              <Card className="border-red-100">
                <h3 className="font-bold text-red-600 mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  إدارة البيانات
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    تصدير نسخة احتياطية
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    استيراد بيانات
                  </Button>
                  <Button variant="danger" className="sm:col-span-2 flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    إعادة ضبط المصنع
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">إضافة منتج جديد</h3>
                <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input type="text" placeholder="اسم المنتج" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="سعر التكلفة" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: e.target.value})} />
                  <input type="number" placeholder="سعر البيع" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newProduct.sale} onChange={e => setNewProduct({...newProduct, sale: e.target.value})} />
                </div>
                <input type="number" placeholder="الكمية المتوفرة" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                  <option value="">اختر التصنيف</option>
                  <option value="مواد غذائية">مواد غذائية</option>
                  <option value="زيوت">زيوت</option>
                  <option value="ألبان">ألبان</option>
                  <option value="منظفات">منظفات</option>
                  <option value="مشروبات">مشروبات</option>
                </select>
                <Button onClick={handleAddProduct} className="w-full py-3">إضافة المنتج</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">تعديل منتج</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input type="text" placeholder="اسم المنتج" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="سعر التكلفة" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={editingProduct.cost_price} onChange={e => setEditingProduct({...editingProduct, cost_price: Number(e.target.value)})} />
                  <input type="number" placeholder="سعر البيع" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={editingProduct.sale_price} onChange={e => setEditingProduct({...editingProduct, sale_price: Number(e.target.value)})} />
                </div>
                <input type="number" placeholder="الكمية المتوفرة" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={editingProduct.stock_quantity} onChange={e => setEditingProduct({...editingProduct, stock_quantity: Number(e.target.value)})} />
                <Button onClick={handleEditProduct} className="w-full py-3">تحديث البيانات</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">إضافة زبون جديد</h3>
                <button onClick={() => setShowAddCustomer(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input type="text" placeholder="اسم الزبون" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                <input type="text" placeholder="رقم الهاتف" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                <Button onClick={handleAddCustomer} className="w-full py-3">إضافة الزبون</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">تسديد مبلغ - {showPaymentModal.name}</h3>
                <button onClick={() => setShowPaymentModal(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 p-4 rounded-2xl text-center">
                  <p className="text-red-500 text-sm mb-1">الرصيد المتبقي</p>
                  <h4 className="text-2xl font-black text-red-600">{formatPrice(showPaymentModal.balance)}</h4>
                </div>
                <input 
                  type="number" 
                  placeholder="المبلغ المدفوع" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                />
                <Button onClick={handlePayment} className="w-full py-4 text-lg">تأكيد الدفع</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Customer Details Modal */}
        {showCustomerDetails && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{showCustomerDetails.name}</h3>
                  <p className="text-slate-500 text-sm">{showCustomerDetails.phone}</p>
                </div>
                <button onClick={() => setShowCustomerDetails(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl">
                    <p className="text-emerald-600 text-xs mb-1">إجمالي المشتريات</p>
                    <h4 className="text-xl font-bold text-emerald-700">
                      {formatPrice(customerHistory.sales.reduce((sum, s) => sum + s.total_amount, 0))}
                    </h4>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl">
                    <p className="text-red-600 text-xs mb-1">الرصيد الحالي</p>
                    <h4 className="text-xl font-bold text-red-700">{formatPrice(showCustomerDetails.balance)}</h4>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 border-b pb-2">سجل العمليات</h4>
                <div className="space-y-3">
                  {[...customerHistory.sales.map(s => ({...s, type: 'sale'})), ...customerHistory.debts.filter(d => d.type === 'payment').map(d => ({...d, type: 'payment'}))]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-sm">{entry.type === 'sale' ? 'فاتورة مشتريات' : 'تسديد مبلغ'}</p>
                          <p className="text-[10px] text-slate-400">{new Date(entry.created_at).toLocaleString('ar-SA')}</p>
                        </div>
                        <p className={`font-bold ${entry.type === 'sale' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {entry.type === 'sale' ? `+ ${entry.total_amount}` : `- ${entry.amount}`}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
              <div className="p-4 border-t bg-slate-50 flex gap-2">
                <Button onClick={() => { setShowPaymentModal(showCustomerDetails); setShowCustomerDetails(null); }} className="flex-1">تسديد مبلغ</Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  كشف حساب
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Notifications */}
        {notification && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl z-[100] flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{notification.message}</span>
          </motion.div>
        )}

        {/* Confirm Dialog */}
        {confirmAction && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmAction.title}</h3>
              <p className="text-slate-500 mb-6">{confirmAction.message}</p>
              <div className="flex gap-3">
                <Button onClick={() => setConfirmAction(null)} variant="secondary" className="flex-1">إلغاء</Button>
                <Button onClick={confirmAction.onConfirm} variant="danger" className="flex-1">تأكيد</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center md:hidden z-40">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'pos', icon: ShoppingCart },
          { id: 'inventory', icon: Package },
          { id: 'customers', icon: Users },
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
