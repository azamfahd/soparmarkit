import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Search, 
  Printer, 
  Plus, 
  Package, 
  Menu, 
  RefreshCcw, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface ProductsViewProps {
  setActiveTab: (tab: string) => void;
  handleDownloadInventoryPDF: () => void;
  setScannerMode: (mode: any) => void;
  setShowAddProduct: (show: boolean) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  categoryIcons: Record<string, React.ReactNode>;
  setIsCategorySidebarOpen: (open: boolean) => void;
  inventoryCategory: string;
  setInventoryCategory: (cat: string) => void;
  products: any[];
  fetchProductHistory: (product: any) => void;
  formatPrice: (price: number) => string;
  setUpdatingStockProduct: (product: any) => void;
  verifyAdminPermission: (action: string, onSuccess: () => void, label: string) => void;
  setEditingProduct: (product: any) => void;
  handleDeleteProduct: (id: number) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  setActiveTab,
  handleDownloadInventoryPDF,
  setScannerMode,
  setShowAddProduct,
      categories,
  categoryCounts,
  categoryIcons,
  setIsCategorySidebarOpen,
  inventoryCategory,
  setInventoryCategory,
  products,
  fetchProductHistory,
  formatPrice,
  setUpdatingStockProduct,
  verifyAdminPermission,
  setEditingProduct,
  handleDeleteProduct,
}) => {
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');

  return (
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
          <Button variant="outline" className="flex items-center gap-2" onClick={() => { setScannerMode('manual'); setShowAddProduct(true); }}>
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
          .map((p, idx) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            let expiryBadge = null;
            if (p.expiration_date) {
              const expDate = new Date(p.expiration_date);
              if (expDate < today) {
                expiryBadge = <div className="absolute top-2 left-2 bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-200 shadow-sm animate-pulse">منتهي الصلاحية</div>;
              } else if (expDate <= thirtyDays) {
                expiryBadge = <div className="absolute top-2 left-2 bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-200 shadow-sm">قريب الانتهاء</div>;
              }
            }
            return (
              <Card key={`inv-product-${p.id ?? 'no-id'}-${idx}`} className="group hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden p-0" onClick={() => fetchProductHistory(p)}>
                <div className={`absolute top-0 right-0 w-1 h-full ${p.stock_quantity <= 5 ? 'bg-red-500' : p.stock_quantity <= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {expiryBadge}
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
                          handleDeleteProduct(p.id!);
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
            );
          })}
      </div>
    </motion.div>
  );
};

export default ProductsView;
