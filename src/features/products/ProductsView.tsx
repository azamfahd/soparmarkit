import React, { useState, useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Search, 
  FileText, 
  Plus, 
  Package, 
  Menu, 
  RefreshCcw, 
  Edit, 
  Trash2,
  MinusCircle
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
  setWithdrawingStockProduct: (product: any) => void;
  verifyAdminPermission: (action: string, onSuccess: () => void, label: string) => void;
  setEditingProduct: (product: any) => void;
  handleDeleteProduct: (id: number) => void;
}

const ProductsViewComponent: React.FC<ProductsViewProps> = ({
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
  setWithdrawingStockProduct,
  verifyAdminPermission,
  setEditingProduct,
  handleDeleteProduct,
}) => {
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    const term = inventorySearchTerm.trim().toLowerCase();
    return products.filter(p => {
      const matchCat = inventoryCategory === 'الكل' || p.category === inventoryCategory;
      if (!matchCat) return false;
      if (!term) return true;
      return p.name?.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term)) || String(p.sale_price).includes(term);
    });
  }, [products, inventoryCategory, inventorySearchTerm]);

  return (
    <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
            <Home className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold">إدارة الأصناف</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="primary" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap" 
            onClick={() => { setScannerMode('manual'); setShowAddProduct(true); }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>إضافة منتج</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap" 
            onClick={handleDownloadInventoryPDF}
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>تقرير PDF</span>
          </Button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="ابحث عن منتج..." 
          className="w-full py-2 px-3 pr-9 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs sm:text-sm font-medium"
          value={inventorySearchTerm}
          onChange={(e) => setInventorySearchTerm(e.target.value)}
        />
      </div>

      {/* شريط الأقسام الذكي واللوحة الجانبية في إدارة الأصناف */}
      <div className="flex items-center justify-between gap-2 mb-2 bg-slate-100/40 p-2 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1 text-slate-700">
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-black">أقسام المخزن</span>
          <span className="text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded-md font-bold text-slate-600">
            {categories.length - 1} نشط
          </span>
        </div>
        <button 
          type="button"
          onClick={() => setIsCategorySidebarOpen(true)}
          className="flex items-center gap-1 text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
        >
          <Menu className="w-3 h-3" />
          <span>تصفح الأقسام</span>
        </button>
      </div>

      {/* الشريط الأفقي الافتراضي للأقسام السريعة */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2.5 no-scrollbar">
        {categories.map((cat, idx) => {
          const itemsCount = categoryCounts[cat] || 0;
          return (
            <button
              type="button"
              key={`inv-cat-${cat}-${idx}`}
              onClick={() => setInventoryCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
                inventoryCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-xs font-bold scale-[1.01]' 
                  : 'bg-white text-slate-650 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {categoryIcons[cat] || <Package className="w-3.5 h-3.5" />}
              <span>{cat}</span>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                inventoryCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {itemsCount}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {filteredProducts.map((p, idx) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            let expiryBadge = null;
            if (p.expiration_date) {
              const expDate = new Date(p.expiration_date);
              if (expDate < today) {
                expiryBadge = <div className="absolute top-1.5 left-1.5 bg-red-100 text-red-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-red-200 shadow-2xs animate-pulse">منتهي الصلاحية</div>;
              } else if (expDate <= thirtyDays) {
                expiryBadge = <div className="absolute top-1.5 left-1.5 bg-amber-100 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">قريب الانتهاء</div>;
              }
            }
            return (
              <Card key={`inv-product-${p.id ?? 'no-id'}-${idx}`} className="group hover:border-emerald-300 transition-all cursor-pointer relative overflow-hidden p-0 flex flex-col justify-between shadow-2xs hover:shadow-xs rounded-xl" onClick={() => fetchProductHistory(p)}>
                <div className={`absolute top-0 right-0 w-1 h-full ${p.stock_quantity <= 5 ? 'bg-red-500' : p.stock_quantity <= 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {expiryBadge}
                <div className="p-2.5 space-y-2 flex-1">
                  <div className="flex justify-between items-start gap-1.5">
                    <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors line-clamp-1" title={p.name}>{p.name}</p>
                    <div className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${p.stock_quantity <= 5 ? 'bg-red-50 text-red-600' : p.stock_quantity <= 20 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {p.stock_quantity} {p.unit || ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <div className="text-center border-l border-slate-200/80 last:border-0 pl-0.5">
                      <p className="text-[8px] text-slate-400 font-bold mb-0.5">التكلفة</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate">{p.cost_price}</p>
                    </div>
                    <div className="text-center border-l border-slate-200/80 last:border-0 px-0.5">
                      <p className="text-[8px] text-slate-500 font-bold mb-0.5">إج.التكلفة</p>
                      <p className="text-[10px] font-bold text-slate-800 truncate">{formatPrice(p.cost_price * p.stock_quantity)}</p>
                    </div>
                    <div className="text-center border-l border-slate-200/80 last:border-0 px-0.5">
                      <p className="text-[8px] text-emerald-600 font-bold mb-0.5">البيع</p>
                      <p className="text-[10px] font-bold text-emerald-700 truncate">{p.sale_price}</p>
                    </div>
                    <div className="text-center pr-0.5">
                      <p className="text-[8px] text-indigo-400 font-bold mb-0.5">التصنيف</p>
                      <p className="text-[9px] font-bold text-indigo-700 truncate" title={p.category}>{p.category}</p>
                    </div>
                  </div>
                </div>

                <div className="px-2.5 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="text-[9px] font-bold text-slate-400">إجراءات سريعة</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setUpdatingStockProduct(p);
                      }} 
                      title="تحديث المخزون"
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        p.stock_quantity <= 5 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 
                        p.stock_quantity <= 20 ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 
                        'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <RefreshCcw className="w-3 h-3" />
                      <span>تحديث</span>
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setWithdrawingStockProduct(p);
                      }} 
                      title="سحب من المخزن / تسوية نقصان"
                      className="px-1.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <MinusCircle className="w-3 h-3" />
                      <span>سحب</span>
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        verifyAdminPermission('edit_product', () => setEditingProduct(p), '✏️ صلاحية تعديل صنف');
                      }} 
                      title="تعديل الصنف"
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer bg-white border border-slate-200/60 shadow-2xs"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        verifyAdminPermission('edit_product', () => {
                          handleDeleteProduct(p.id!);
                        }, '🗑️ صلاحية حذف صنف');
                      }} 
                      title="حذف الصنف"
                      className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer bg-white border border-slate-200/60 shadow-2xs"
                    >
                      <Trash2 className="w-3 h-3" />
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

export const ProductsView = memo(ProductsViewComponent);
export default ProductsView;
