import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Search, 
  Scan, 
  X, 
  Plus, 
  Package, 
  Menu, 
  AlertCircle, 
  Printer, 
  Download, 
  UserPlus, 
  Trash2,
  Users,
  User,
  Check,
  Phone,
  Wallet,
  MapPin
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface PosViewProps {
  setActiveTab: (tab: string) => void;
  setScannerMode: (mode: any) => void;
  setIsScannerOpen: (open: boolean) => void;
  scannedProductInfo: any;
  setScannedProductInfo: (info: any) => void;
  formatPrice: (price: number) => string;
  addToCart: (product: any) => void;
  showNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  categoryIcons: Record<string, React.ReactNode>;
  setIsCategorySidebarOpen: (open: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  products: any[];
  fetchProductHistory: (product: any) => void;
  cart: any[];
  setCart: (cart: any[]) => void;
  isCartExpanded: boolean;
  setIsCartExpanded: (open: boolean) => void;
  handlePrintCart: () => void;
  handleDownloadCartPDF: () => void;
  selectedCustomer: number | null;
  setSelectedCustomer: (id: number | null) => void;
  customers: any[];
  setShowAddCustomer: (show: boolean) => void;
  paymentType: 'cash' | 'debt';
  setPaymentType: (type: 'cash' | 'debt') => void;
  saleNotes: string;
  setSaleNotes: (notes: string) => void;
  paidAmountInput: string;
  setPaidAmountInput: (val: string) => void;
  currency: string;
  removeFromCart: (productId: number) => void;
  handleCheckout: () => void;
  db: any;
}

const PosViewComponent: React.FC<PosViewProps> = ({
  setActiveTab,
      setScannerMode,
  setIsScannerOpen,
  scannedProductInfo,
  setScannedProductInfo,
  formatPrice,
  addToCart,
  showNotification,
  categories,
  categoryCounts,
  categoryIcons,
  setIsCategorySidebarOpen,
  selectedCategory,
  setSelectedCategory,
  products,
  fetchProductHistory,
  cart,
  setCart,
  isCartExpanded,
  setIsCartExpanded,
  handlePrintCart,
  handleDownloadCartPDF,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  setShowAddCustomer,
  paymentType,
  setPaymentType,
  saleNotes,
  setSaleNotes,
  paidAmountInput,
  setPaidAmountInput,
  currency,
  removeFromCart,
  handleCheckout,
  db,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'debtors' | 'cleared'>('all');

  // Handle hardware back button to close customer search sheet first
  useEffect(() => {
    const handleBack = (e: Event) => {
      if (isCustomerSearchOpen) {
        setIsCustomerSearchOpen(false);
        e.preventDefault();
      }
    };
    window.addEventListener('smartpos:backpress', handleBack);
    return () => window.removeEventListener('smartpos:backpress', handleBack);
  }, [isCustomerSearchOpen]);

  const normalizeArabic = (text: string) => {
    if (!text) return '';
    return text
      .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .toLowerCase()
      .trim();
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (customerFilter === 'debtors' && !(c.balance > 0)) return false;
      if (customerFilter === 'cleared' && c.balance > 0) return false;
      
      if (!customerSearchTerm.trim()) return true;
      const q = normalizeArabic(customerSearchTerm);
      const nameMatch = normalizeArabic(c.name || '').includes(q);
      const phoneMatch = (c.phone || '').includes(customerSearchTerm.trim());
      const notesMatch = normalizeArabic(c.notes || '').includes(q);
      const addressMatch = normalizeArabic(c.address || '').includes(q);
      return nameMatch || phoneMatch || notesMatch || addressMatch;
    });
  }, [customers, customerFilter, customerSearchTerm]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter(p => {
      const matchCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      if (!matchCategory) return false;
      if (!term) return true;
      return p.name?.toLowerCase().includes(term) || String(p.sale_price).includes(term) || (p.barcode && p.barcode.includes(term));
    });
  }, [products, selectedCategory, searchTerm]);

  return (
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
            key="pos-scanned-product-banner"
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
        {filteredProducts.map((p, idx) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
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
          <div key="pos-cart-modal-backdrop" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-extrabold text-slate-900">سلة المبيعات</h2>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {cart.length} صنف
                  </span>
                  {cart.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={handlePrintCart}
                        className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-white rounded-md transition-all cursor-pointer shadow-2xs"
                        title="طباعة السلة"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={handleDownloadCartPDF}
                        className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-white rounded-md transition-all cursor-pointer shadow-2xs"
                        title="تحميل PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setIsCartExpanded(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Compact Customer & Payment Bar */}
              <div className="p-3 bg-slate-100/80 border-b border-slate-200/60 flex flex-wrap gap-2 items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <div className="relative flex-1">
                    <select 
                      className={`w-full p-2 ${selectedCustomer ? 'pl-7 bg-emerald-50/60 border-emerald-300 text-emerald-950 font-black' : 'bg-white border-slate-200 text-slate-800 font-bold'} rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-colors`}
                      value={selectedCustomer || ''}
                      onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
                    >
                      <option value="">👤 زبون نقدي عام</option>
                      {customers.map((c, idx) => (
                        <option key={`customer-option-${c.id ?? 'no-id'}-${idx}`} value={c.id}>
                          👤 {c.name} {c.balance > 0 ? `(عليه: ${formatPrice(c.balance)})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                        title="إلغاء تحديد العميل (الرجوع لزبون نقدي عام)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* زر البحث السريع عن عميل */}
                  <button 
                    type="button"
                    onClick={() => {
                      setCustomerSearchTerm('');
                      setIsCustomerSearchOpen(true);
                    }}
                    className="h-8 px-2.5 flex items-center justify-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 rounded-xl transition-all shrink-0 shadow-2xs font-bold text-xs cursor-pointer active:scale-95"
                    title="بحث سريع عن عميل بالاسم أو الهاتف"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">بحث عميل</span>
                  </button>

                  {/* زر إضافة زبون جديد */}
                  <button 
                    type="button"
                    onClick={() => { setIsCartExpanded(false); setShowAddCustomer(true); }}
                    className="h-8 w-8 flex items-center justify-center bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shrink-0 shadow-2xs cursor-pointer active:scale-95"
                    title="إضافة زبون جديد"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shrink-0 w-32">
                  <button 
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`flex-1 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${paymentType === 'cash' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    نقداً
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setPaymentType('debt');
                      setCustomerSearchTerm('');
                      setIsCustomerSearchOpen(true);
                    }}
                    className={`flex-1 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${paymentType === 'debt' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                    title="البيع بالدَّيْن (يفتح قائمة البحث عن عميل مباشرة)"
                  >
                    دَيْن
                  </button>
                </div>
              </div>
              
              {/* Single Scrollable Body containing Items first, then Payment & Notes Settings */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/70">
                {/* 1. Cart Items List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">محتويات السلة</span>
                    <span className="text-[11px] font-bold text-slate-400">
                      الإجمالي: <strong className="font-mono text-emerald-700">{formatPrice(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</strong>
                    </span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-600">السلة فارغة حالياً</p>
                      <p className="text-[10px] text-slate-400 mt-1">اضغط على المنتجات لإضافتها إلى السلة والبدء بالبيع</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => {
                      const itemQuantity = Number(item.quantity) || 0;
                      const integerPart = Math.floor(itemQuantity);
                      const fractionalPart = parseFloat((itemQuantity % 1).toFixed(2));

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
                          className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-1.5 text-right relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0 pr-1">
                              <p className="font-extrabold text-slate-800 text-xs sm:text-sm truncate" title={item.name}>{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{formatPrice(item.price)} {item.unit ? `/ ${item.unit}` : ''}</p>
                            </div>
                            <div className="text-left shrink-0">
                              <p className="text-[9px] text-slate-400 font-bold leading-none mb-0.5">المجموع</p>
                              <p className="text-xs sm:text-sm font-black font-mono text-emerald-700 leading-none">
                                {formatPrice(subtotal)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shrink-0">
                              <button 
                                type="button"
                                onClick={() => {
                                  const currentVal = Number(item.quantity) || 0;
                                  const val = Math.max(0, currentVal - 1);
                                  setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: parseFloat(val.toFixed(2)) } : c));
                                }}
                                className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 text-slate-700 font-black text-sm transition-all cursor-pointer"
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
                                    showNotification(`تنبيه: الكمية تتجاوز المخزون (${item.max_stock})`, 'error');
                                    setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: item.max_stock } : c));
                                    return;
                                  }
                                  setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: val } : c));
                                }}
                                className="w-10 h-7 text-center bg-white border-x border-slate-200 text-xs font-extrabold font-mono outline-none"
                                placeholder="0"
                              />

                              <button 
                                type="button"
                                onClick={() => {
                                  const currentVal = Number(item.quantity) || 0;
                                  const val = currentVal + 1;
                                  if (val > item.max_stock) {
                                    showNotification('لا يمكن تجاوز المخزون', 'error');
                                    return;
                                  }
                                  setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: parseFloat(val.toFixed(2)) } : c));
                                }}
                                className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 text-slate-700 font-black text-sm transition-all cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <select
                                value={selectedFraction}
                                onChange={(e) => {
                                  const fractionVal = parseFloat(e.target.value);
                                  const baseQty = item.base_quantity || item.quantity;
                                  
                                  if (item.quantity !== baseQty && fractionVal !== 1) {
                                    showNotification('يجب اختيار كامل الكمية قبل اختيار كسر', 'error');
                                    return;
                                  }

                                  if (fractionVal === 1) {
                                      setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: baseQty } : c));
                                      return;
                                  }

                                  let finalQty = baseQty * fractionVal;
                                  if (finalQty > item.max_stock) {
                                    showNotification(`تجاوز المخزون (${item.max_stock})`, 'error');
                                    finalQty = item.max_stock;
                                  }
                                  setCart(cart.map(c => c.product_id === item.product_id ? { ...c, quantity: parseFloat(finalQty.toFixed(2)) } : c));
                                }}
                                className="h-7 px-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="1">كامل</option>
                                <option value="0.5">نصف</option>
                                <option value="0.33">ثلث</option>
                                <option value="0.25">ربع</option>
                                <option value="0.75">ثلاثة أرباع</option>
                              </select>
                              
                              <button 
                                onClick={() => removeFromCart(item.product_id)}
                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 2. Customer Balance, Paid Amount & Payment Breakdown Card */}
                {cart.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block px-1">تفاصيل التسديد والمالية</span>

                    {/* Active Customer Balance Info */}
                    {(() => {
                      const activeCustomerInfo = customers.find(c => c.id === selectedCustomer);
                      if (!activeCustomerInfo) return null;
                      return (
                        <div className={`p-2.5 rounded-xl border flex justify-between items-center text-xs font-bold ${
                          activeCustomerInfo.balance > 0 
                            ? 'bg-red-50 border-red-200 text-red-900' 
                            : activeCustomerInfo.balance < 0 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          <span>حساب الزبون الحالي:</span>
                          <span className="font-extrabold font-mono">
                            {activeCustomerInfo.balance > 0 
                              ? `عليه دَيْن: ${formatPrice(activeCustomerInfo.balance)}` 
                              : activeCustomerInfo.balance < 0 
                                ? `له رصيد دائن: ${formatPrice(Math.abs(activeCustomerInfo.balance))}` 
                                : 'حسابه خالِص'
                            }
                          </span>
                        </div>
                      );
                    })()}

                    {/* Paid Amount Input & Quick Buttons */}
                    {(() => {
                      const totalCartAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      const userPaidVal = paidAmountInput !== '' && !isNaN(parseFloat(paidAmountInput)) 
                        ? Math.max(0, parseFloat(paidAmountInput)) 
                        : (paymentType === 'cash' ? totalCartAmount : 0);
                      const diff = totalCartAmount - userPaidVal;

                      return (
                        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                              💵 <span>المبلغ المدفوع الآن</span>
                              <span className="text-[10px] text-slate-400 font-normal">(دفع جزئي أو زائد)</span>
                            </label>
                          </div>

                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <input 
                                type="number"
                                step="any"
                                min="0"
                                placeholder={paymentType === 'cash' ? `الافتراضي: ${formatPrice(totalCartAmount)}` : `الافتراضي: 0 ${currency}`}
                                value={paidAmountInput}
                                onChange={(e) => setPaidAmountInput(e.target.value)}
                                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs sm:text-sm font-black font-mono outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                              />
                              {paidAmountInput !== '' && (
                                <button 
                                  type="button"
                                  onClick={() => setPaidAmountInput('')}
                                  className="absolute left-1.5 top-2 text-[9px] text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded-md font-bold transition-all cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              )}
                            </div>

                            {/* Quick Action Chips */}
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPaidAmountInput(String(totalCartAmount))}
                                className="px-2 py-1.5 text-[10px] font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                                title="تسديد كامل المبلغ"
                              >
                                كامل
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaidAmountInput(String(Math.round(totalCartAmount / 2)))}
                                className="px-2 py-1.5 text-[10px] font-black bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                                title="تسديد نصف المبلغ"
                              >
                                نصف
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaidAmountInput('0')}
                                className="px-2 py-1.5 text-[10px] font-black bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                                title="آجل بالكامل"
                              >
                                0 (آجل)
                              </button>
                            </div>
                          </div>

                          {/* Live Status Pill */}
                          {userPaidVal <= 0 ? (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-900 flex justify-between items-center">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                <span>🔴 آجل بالكامل (دَيْنٌ 100%)</span>
                              </span>
                              <span>المتبقي: <strong className="font-mono text-red-700">{formatPrice(totalCartAmount)}</strong></span>
                            </div>
                          ) : userPaidVal < totalCartAmount ? (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex justify-between items-center">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span>🟡 دفع جزئي (سدد {formatPrice(userPaidVal)})</span>
                              </span>
                              <span>المتبقي دَيْن: <strong className="font-mono text-red-700">{formatPrice(diff)}</strong></span>
                            </div>
                          ) : userPaidVal === totalCartAmount ? (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex justify-between items-center">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                <span>🟢 مدفوع بالكامل</span>
                              </span>
                              <span>المتبقي: <strong className="font-mono text-emerald-700">0 {currency}</strong></span>
                            </div>
                          ) : (
                            <div className="p-2 bg-yellow-100 border border-yellow-300 rounded-xl text-xs font-black text-yellow-950 flex justify-between items-center">
                              <span className="flex items-center gap-1.5">
                                <span>⭐ دفع زائد (فائض {formatPrice(userPaidVal - totalCartAmount)})</span>
                              </span>
                              <span className="underline">رصيد دائن للعميل</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Order Notes */}
                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">ملاحظة للطلب (اختياري)</label>
                      <input 
                        type="text"
                        value={saleNotes}
                        onChange={(e) => setSaleNotes(e.target.value)}
                        placeholder="أدخل أية ملاحظة خاصة بهذه الفاتورة..."
                        className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Bottom Checkout Footer */}
              <div className="p-3.5 bg-white border-t border-slate-200/80 shrink-0 space-y-2">
                {cart.length > 0 && (() => {
                  const totalCartAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const userPaidVal = paidAmountInput !== '' && !isNaN(parseFloat(paidAmountInput)) 
                    ? Math.max(0, parseFloat(paidAmountInput)) 
                    : (paymentType === 'cash' ? totalCartAmount : 0);
                  const remaining = totalCartAmount - userPaidVal;

                  return (
                    <div className="flex justify-between items-center px-1 text-xs font-bold text-slate-600">
                      <span>إجمالي الفاتورة: <strong className="font-mono text-slate-900 text-sm">{formatPrice(totalCartAmount)}</strong></span>
                      {remaining > 0 ? (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">المتبقي دَيْن: <strong className="font-mono">{formatPrice(remaining)}</strong></span>
                      ) : remaining < 0 ? (
                        <span className="text-yellow-900 bg-yellow-100 px-2 py-0.5 rounded-md border border-yellow-300">الفائض: <strong className="font-mono">{formatPrice(Math.abs(remaining))}</strong></span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">مسدد بالكامل</span>
                      )}
                    </div>
                  );
                })()}

                <Button 
                  className="w-full py-3.5 text-base sm:text-lg rounded-2xl font-extrabold shadow-lg shadow-emerald-500/20 active:scale-98 transition-all" 
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

      {/* نافذة البحث السريع عن عميل في سلة البيع */}
      <AnimatePresence>
        {isCustomerSearchOpen && (
          <div 
            key="modal-quick-customer-search" 
            className="fixed inset-0 bg-slate-950/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCustomerSearchOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ترويسة النافذة */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">البحث السريع عن عميل</h3>
                    <p className="text-[11px] text-slate-300 font-medium">اختر عميلاً لتسجيل الفاتورة باسمه أو متابعة ديونه</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCustomerSearchOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* شريط البحث وتصفيات الفرز السريعة */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 space-y-2.5 shrink-0">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="اكتب اسم العميل، رقم الهاتف، أو الملاحظات..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="w-full py-2.5 pr-9 pl-9 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 shadow-2xs transition-all"
                  />
                  {customerSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchTerm('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* أزرار الفلترة السريعة */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={() => setCustomerFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      customerFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    الكل ({customers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerFilter('debtors')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      customerFilter === 'debtors'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    <Wallet className="w-3 h-3" />
                    عليهم ديون ({customers.filter(c => c.balance > 0).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerFilter('cleared')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      customerFilter === 'cleared'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    حساب خالص ({customers.filter(c => c.balance <= 0).length})
                  </button>
                </div>
              </div>

              {/* قائمة العملاء */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50">
                {/* خيار زبون نقدي عام */}
                <div 
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsCustomerSearchOpen(false);
                    showNotification('تم تحديد: زبون نقدي عام', 'info');
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedCustomer === null
                      ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                      👤
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">زبون نقدي عام</h4>
                      <p className="text-[10px] text-slate-500 font-medium">مبيعات فورية نقدية بدون تسجيل على حساب عميل</p>
                    </div>
                  </div>
                  {selectedCustomer === null && (
                    <span className="text-[11px] font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Check className="w-3 h-3" /> محدد
                    </span>
                  )}
                </div>

                {/* عرض نتائج العملاء */}
                {filteredCustomers.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-700">لا يوجد عميل مطابق للبحث</p>
                      {customerSearchTerm && (
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">"{customerSearchTerm}"</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerSearchOpen(false);
                        setIsCartExpanded(false);
                        setShowAddCustomer(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      إضافة عميل جديد الآن
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c, idx) => {
                    const isSelected = selectedCustomer === c.id;
                    const hasDebt = (c.balance || 0) > 0;
                    const hasCredit = (c.balance || 0) < 0;

                    return (
                      <div
                        key={`quick-cust-card-${c.id ?? 'noid'}-${idx}`}
                        onClick={() => {
                          setSelectedCustomer(c.id);
                          setIsCustomerSearchOpen(false);
                          showNotification(`تم تحديد العميل: ${c.name}`, 'info');
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : hasDebt
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.name ? c.name.charAt(0).toUpperCase() : 'ع'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{c.name}</h4>
                              {isSelected && (
                                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> محدد
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              {c.phone && (
                                <span className="flex items-center gap-1 font-mono text-[11px]">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  {c.phone}
                                </span>
                              )}
                              {c.address && (
                                <span className="hidden sm:inline text-slate-400 truncate max-w-[140px]">
                                  📍 {c.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-left shrink-0">
                          {hasDebt ? (
                            <div className="text-right sm:text-left">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] sm:text-xs font-black font-mono">
                                دَيْن: {formatPrice(c.balance)}
                              </span>
                            </div>
                          ) : hasCredit ? (
                            <div className="text-right sm:text-left">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] sm:text-xs font-black font-mono">
                                له: {formatPrice(Math.abs(c.balance))}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                              خالِص
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ذيل النافذة */}
              <div className="p-3 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-bold text-slate-500">
                  عدد النتائج: <strong className="text-slate-800">{filteredCustomers.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerSearchOpen(false);
                    setIsCartExpanded(false);
                    setShowAddCustomer(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>إضافة عميل جديد</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const PosView = memo(PosViewComponent);
export default PosView;
