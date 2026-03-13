import React from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Wallet,
  Package,
  ChevronLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id?: number;
  name: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  category: string;
}

interface POSProps {
  products: Product[];
  cart: any[];
  setCart: (cart: any[]) => void;
  addToCart: (product: Product, quantity?: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  formatPrice: (price: number) => string;
  onCheckout: () => void;
  selectedCustomer: number | null;
  setSelectedCustomer: (id: number | null) => void;
  customers: any[];
  paymentType: 'cash' | 'debt';
  setPaymentType: (type: 'cash' | 'debt') => void;
}

const POS: React.FC<POSProps> = ({ 
  products, 
  cart, 
  setCart, 
  addToCart, 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  categories, 
  formatPrice,
  onCheckout,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  paymentType,
  setPaymentType
}) => {
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'الكل' || p.category === selectedCategory)
  );

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.max_stock));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)]">
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Search & Categories */}
        <div className="space-y-4">
          <div className="flex items-center bg-white border border-slate-100 rounded-3xl px-6 py-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث عن منتج أو امسح الباركود..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-lg w-full px-4 text-slate-700"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                    : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {filteredProducts.map((product, idx) => (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              onClick={() => addToCart(product)}
              disabled={product.stock_quantity <= 0}
              className={`group relative bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-right flex flex-col gap-2 ${
                product.stock_quantity <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''
              }`}
            >
              <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                <Package className="w-12 h-12" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                <p className="text-emerald-600 font-black text-lg">{formatPrice(product.sale_price)}</p>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                  المخزون: {product.stock_quantity}
                </span>
                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-white rounded-[40px] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">السلة</h3>
          </div>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
            {cart.length} عناصر
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.product_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl group"
              >
                <div className="flex-1">
                  <h5 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h5>
                  <p className="text-emerald-600 font-bold text-xs">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-100">
                  <button 
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-700 text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.product_id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-12">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p className="font-bold">السلة فارغة</p>
            </div>
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>المجموع الفرعي</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-slate-800 text-xl font-black">
              <span>الإجمالي</span>
              <span className="text-emerald-600">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button 
                onClick={() => setPaymentType('cash')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
                  paymentType === 'cash' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <Wallet className="w-5 h-5" />
                نقداً
              </button>
              <button 
                onClick={() => setPaymentType('debt')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${
                  paymentType === 'debt' 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-100' 
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                دين
              </button>
            </div>

            {paymentType === 'debt' && (
              <select 
                value={selectedCustomer || ''}
                onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                className="w-full bg-white border-slate-200 rounded-2xl py-3 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">اختر العميل...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <button 
              onClick={onCheckout}
              disabled={cart.length === 0 || (paymentType === 'debt' && !selectedCustomer)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إتمام العملية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
