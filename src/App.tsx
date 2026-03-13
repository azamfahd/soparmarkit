import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings as SettingsIcon,
  Plus, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  Printer,
  Download,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/api';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Customers from './pages/Customers';

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

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false }: any) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100",
    secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    outline: "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100"
  };
  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [customerHistory, setCustomerHistory] = useState<{ sales: any[], debts: any[] }>({ sales: [], debts: [] });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [currency, setCurrency] = useState('ر.ي');
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    window.addEventListener('online', fetchData);
    return () => window.removeEventListener('online', fetchData);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatPrice = (price: number) => `${price} ${currency}`;
  const categories: string[] = ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];

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
      items: cart,
      payment_type: paymentType,
      total_amount: total
    };

    try {
      await api.sales.create(saleData);
      showNotification('تمت عملية البيع بنجاح');
      setCart([]);
      setSelectedCustomer(null);
      setPaymentType('cash');
      fetchData();
    } catch (err) {
      showNotification('فشل إتمام عملية البيع', 'error');
    }
  };

  const fetchCustomerHistory = async (id: number) => {
    try {
      const history = await api.customers.getHistory(id);
      setCustomerHistory(history);
    } catch (err) {
      showNotification('فشل جلب سجل الزبون', 'error');
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard summary={summary} dailySales={dailySales} currency={currency} />;
      case 'inventory':
        return (
          <Inventory 
            products={products} 
            categories={categories} 
            inventorySearchTerm={inventorySearchTerm}
            setInventorySearchTerm={setInventorySearchTerm}
            inventoryCategory={inventoryCategory}
            setInventoryCategory={setInventoryCategory}
            onAddProduct={() => setShowAddProduct(true)}
            onEditProduct={setEditingProduct}
            onDeleteProduct={handleDeleteProduct}
            formatPrice={formatPrice}
          />
        );
      case 'pos':
        return (
          <POS 
            products={products}
            cart={cart}
            setCart={setCart}
            addToCart={addToCart}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            formatPrice={formatPrice}
            onCheckout={handleCheckout}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            customers={customers}
            paymentType={paymentType}
            setPaymentType={setPaymentType}
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers}
            customerSearchTerm={customerSearchTerm}
            setCustomerSearchTerm={setCustomerSearchTerm}
            onAddCustomer={() => setShowAddCustomer(true)}
            onShowDetails={(c) => { setShowCustomerDetails(c); fetchCustomerHistory(c.id!); }}
            onShowPayment={setShowPaymentModal}
            formatPrice={formatPrice}
          />
        );
      case 'settings':
        return (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 max-w-2xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-8">إعدادات المتجر</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 px-1">اسم المتجر</label>
                <input 
                  type="text" 
                  value="بقالة السعادة" 
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 px-1">العملة</label>
                <input 
                  type="text" 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <Button className="w-full">حفظ الإعدادات</Button>
            </div>
          </div>
        );
      default:
        return <Dashboard summary={summary} dailySales={dailySales} currency={currency} />;
    }
  };

  const getTabTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'لوحة التحكم',
      pos: 'نقطة البيع',
      inventory: 'المخزون',
      customers: 'العملاء',
      settings: 'الإعدادات'
    };
    return titles[activeTab] || 'الرئيسية';
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-['Cairo']" dir="rtl">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          onMenuClick={() => setIsSidebarOpen(true)} 
          title={getTabTitle()}
          onAddClick={activeTab === 'inventory' ? () => setShowAddProduct(true) : activeTab === 'customers' ? () => setShowAddCustomer(true) : undefined}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">إضافة منتج جديد</h3>
                <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-50 rounded-xl"><X /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="اسم المنتج" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="سعر التكلفة" type="number" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: e.target.value})} />
                  <input placeholder="سعر البيع" type="number" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={newProduct.sale} onChange={e => setNewProduct({...newProduct, sale: e.target.value})} />
                </div>
                <input placeholder="الكمية المتوفرة" type="number" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                <input placeholder="الفئة (مثال: مواد غذائية)" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                <Button onClick={handleAddProduct} className="w-full mt-4">إضافة المنتج</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">تعديل المنتج</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-50 rounded-xl"><X /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="اسم المنتج" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="سعر التكلفة" type="number" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={editingProduct.cost_price} onChange={e => setEditingProduct({...editingProduct, cost_price: Number(e.target.value)})} />
                  <input placeholder="سعر البيع" type="number" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={editingProduct.sale_price} onChange={e => setEditingProduct({...editingProduct, sale_price: Number(e.target.value)})} />
                </div>
                <input placeholder="الكمية المتوفرة" type="number" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={editingProduct.stock_quantity} onChange={e => setEditingProduct({...editingProduct, stock_quantity: Number(e.target.value)})} />
                <input placeholder="الفئة" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
                <Button onClick={handleEditProduct} className="w-full mt-4">تحديث المنتج</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">إضافة عميل جديد</h3>
                <button onClick={() => setShowAddCustomer(false)} className="p-2 hover:bg-slate-50 rounded-xl"><X /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="اسم العميل" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                <input placeholder="رقم الهاتف" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                <Button onClick={handleAddCustomer} className="w-full mt-4">إضافة العميل</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">تسديد مبلغ</h3>
                <button onClick={() => setShowPaymentModal(null)} className="p-2 hover:bg-slate-50 rounded-xl"><X /></button>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl mb-6">
                <p className="text-red-600 text-sm font-bold mb-1">الرصيد الحالي للعميل {showPaymentModal.name}</p>
                <h4 className="text-2xl font-black text-red-700">{formatPrice(showPaymentModal.balance)}</h4>
              </div>
              <div className="space-y-4">
                <input placeholder="المبلغ المراد تسديده" type="number" className="w-full bg-slate-50 border-slate-100 rounded-2xl py-3 px-4 text-xl font-bold" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                <Button onClick={handlePayment} className="w-full mt-4">تأكيد الدفع</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Customer Details Modal */}
        {showCustomerDetails && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{showCustomerDetails.name}</h3>
                  <p className="text-slate-500 font-medium">{showCustomerDetails.phone}</p>
                </div>
                <button onClick={() => setShowCustomerDetails(null)} className="p-2 hover:bg-white rounded-xl shadow-sm"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-6 rounded-3xl">
                    <p className="text-emerald-600 text-sm font-bold mb-1">إجمالي المشتريات</p>
                    <h4 className="text-2xl font-black text-emerald-700">
                      {formatPrice(customerHistory.sales.reduce((sum, s) => sum + s.total_amount, 0))}
                    </h4>
                  </div>
                  <div className="bg-red-50 p-6 rounded-3xl">
                    <p className="text-red-600 text-sm font-bold mb-1">الرصيد الحالي</p>
                    <h4 className="text-2xl font-black text-red-700">{formatPrice(showCustomerDetails.balance)}</h4>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-400" />
                    سجل العمليات
                  </h4>
                  <div className="space-y-3">
                    {[...customerHistory.sales.map(s => ({...s, type: 'sale'})), ...customerHistory.debts.filter(d => d.type === 'payment').map(d => ({...d, type: 'payment'}))]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((entry, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                            <p className="font-bold text-slate-700">{entry.type === 'sale' ? 'فاتورة مشتريات' : 'تسديد مبلغ'}</p>
                            <p className="text-xs text-slate-400 font-medium">{new Date(entry.created_at).toLocaleString('ar-SA')}</p>
                          </div>
                          <p className={`text-lg font-black ${entry.type === 'sale' ? 'text-red-500' : 'text-emerald-600'}`}>
                            {entry.type === 'sale' ? `+ ${entry.total_amount}` : `- ${entry.amount}`}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t bg-slate-50/50 flex gap-4">
                <Button onClick={() => { setShowPaymentModal(showCustomerDetails); setShowCustomerDetails(null); }} className="flex-1">تسديد مبلغ</Button>
                <Button variant="secondary" className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  كشف حساب
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Notifications */}
        {notification && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-[24px] shadow-2xl z-[200] flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-black text-lg">{notification.message}</span>
          </motion.div>
        )}

        {/* Confirm Dialog */}
        {confirmAction && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{confirmAction.title}</h3>
              <p className="text-slate-500 font-medium mb-8">{confirmAction.message}</p>
              <div className="flex gap-4">
                <Button onClick={() => setConfirmAction(null)} variant="secondary" className="flex-1">إلغاء</Button>
                <Button onClick={confirmAction.onConfirm} variant="danger" className="flex-1">تأكيد</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
