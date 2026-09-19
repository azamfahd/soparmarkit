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
  MinusCircle,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Clock,
  Calendar,
  PackageX,
  ClipboardList,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExpiryReportModal } from '../../components/modals/ExpiryReportModal';

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
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical7' | 'expired' | 'lowStock' | 'expiring30'>('all');
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showSmartAlertsModal, setShowSmartAlertsModal] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState<'critical7' | 'expired' | 'lowStock' | 'allExpiring'>('critical7');

  // Helper to calculate expiry info for a product
  const getProductExpiry = (p: any) => {
    if (!p.expiration_date) {
      return { hasDate: false, days: null, isExpired: false, isCritical7: false, isExpiring30: false };
    }
    const exp = new Date(p.expiration_date);
    if (isNaN(exp.getTime())) {
      return { hasDate: false, days: null, isExpired: false, isCritical7: false, isExpiring30: false };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      hasDate: true,
      days,
      isExpired: days < 0,
      isCritical7: days >= 0 && days <= 7,
      isExpiring30: days > 7 && days <= 30
    };
  };

  // Pre-calculate stats for the visual alert dashboard
  const alertStats = useMemo(() => {
    const critical7: any[] = [];
    const expired: any[] = [];
    const expiring30: any[] = [];
    const lowStock: any[] = [];

    products.forEach(p => {
      const exp = getProductExpiry(p);
      if (exp.isCritical7) critical7.push(p);
      if (exp.isExpired) expired.push(p);
      if (exp.isExpiring30) expiring30.push(p);

      const min = typeof p.min_stock === 'number' && p.min_stock > 0 ? p.min_stock : 5;
      if (p.stock_quantity <= min) lowStock.push(p);
    });

    return {
      critical7,
      expired,
      expiring30,
      lowStock,
      totalAlerts: critical7.length + expired.length + lowStock.length
    };
  }, [products]);

  // Filter products by search term, category, and alertFilter
  const filteredProducts = useMemo(() => {
    const term = inventorySearchTerm.trim().toLowerCase();

    return products.filter(p => {
      // 1. Category match
      const matchCat = inventoryCategory === 'الكل' || p.category === inventoryCategory;
      if (!matchCat) return false;

      // 2. Alert filter match
      if (alertFilter === 'critical7') {
        const exp = getProductExpiry(p);
        if (!exp.isCritical7) return false;
      } else if (alertFilter === 'expired') {
        const exp = getProductExpiry(p);
        if (!exp.isExpired) return false;
      } else if (alertFilter === 'lowStock') {
        const min = typeof p.min_stock === 'number' && p.min_stock > 0 ? p.min_stock : 5;
        if (p.stock_quantity > min) return false;
      } else if (alertFilter === 'expiring30') {
        const exp = getProductExpiry(p);
        if (!exp.isExpiring30 && !exp.isCritical7 && !exp.isExpired) return false;
      }

      // 3. Search term match
      if (!term) return true;
      return (
        p.name?.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.includes(term)) ||
        String(p.sale_price).includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    });
  }, [products, inventoryCategory, alertFilter, inventorySearchTerm]);

  const openReportModal = (tab: 'critical7' | 'expired' | 'lowStock' | 'allExpiring') => {
    setInitialModalTab(tab);
    setShowExpiryModal(true);
  };

  return (
    <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <Home className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>إدارة المخزون والأصناف</span>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                {products.length} صنف مسجل
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="primary" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap" 
            onClick={() => { setScannerMode('manual'); setShowAddProduct(true); }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>إضافة منتج</span>
          </Button>

          {/* زر تقرير الصلاحية والنواقص الخاص */}
          <Button
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 hover:border-rose-300 bg-rose-50/80 hover:bg-rose-100 text-rose-700 rounded-lg font-black text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            onClick={() => openReportModal('critical7')}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>تقرير الصلاحية الخاص</span>
            {(alertStats.critical7.length > 0 || alertStats.expired.length > 0) && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {alertStats.critical7.length + alertStats.expired.length}
              </span>
            )}
          </Button>

          {/* زر لوحة تنبيهات المخزون الذكية الصغير بجانب زر تقرير الصلاحية */}
          <Button
            variant="outline"
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg font-black text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap ${
              alertStats.totalAlerts > 0
                ? 'border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-900'
                : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700'
            }`}
            onClick={() => setShowSmartAlertsModal(true)}
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
            <span>لوحة التنبيهات الذكية</span>
            {alertStats.totalAlerts > 0 ? (
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {alertStats.totalAlerts}
              </span>
            ) : (
              <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                ✓
              </span>
            )}
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap" 
            onClick={handleDownloadInventoryPDF}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>تقرير المخزن PDF</span>
          </Button>
        </div>
      </div>

      {/* شريط حالة التصفية النشطة (يظهر فقط عند تفعيل تصفية من التنبيهات) */}
      {alertFilter !== 'all' && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-50 via-rose-50/60 to-white border border-amber-200/90 rounded-xl text-xs font-bold text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Filter className="w-3 h-3" />
            </div>
            <span>تصفية نشطة:</span>
            <span className="bg-amber-100 border border-amber-300/80 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-black">
              {alertFilter === 'critical7' && '🚨 أوشكت على الانتهاء (أقل من 7 أيام)'}
              {alertFilter === 'expired' && '⚠️ منتهية الصلاحية'}
              {alertFilter === 'lowStock' && '📦 أوشكت على النفاذ (المخزون الحرج)'}
              {alertFilter === 'expiring30' && '🗓️ تنتهي خلال شهر'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              (تم حصر {filteredProducts.length} صنف من أصل {products.length})
            </span>
          </div>
          <button
            onClick={() => setAlertFilter('all')}
            className="flex items-center gap-1 text-[11px] font-black text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-100/80 border border-rose-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>إلغاء التصفية وعرض الكل</span>
          </button>
        </div>
      )}

      {/* حقل البحث بالمنتجات */}
      <div className="relative mb-2">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="ابحث باسم المنتج، الباركود، أو السعر..." 
          className="w-full py-2 px-3 pr-9 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs sm:text-sm font-medium"
          value={inventorySearchTerm}
          onChange={(e) => setInventorySearchTerm(e.target.value)}
        />
        {inventorySearchTerm && (
          <button
            onClick={() => setInventorySearchTerm('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
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

      {/* ========================================================================= */}
      {/* شبكة عرض بطاقات المنتجات مع التلوين الأحمر للمنتجات قريبة الانتهاء (< 7 أيام) */}
      {/* ========================================================================= */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
          <Package className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
          <p className="font-bold text-sm text-slate-600">لا توجد منتجات تطابق معايير التصفية والبحث</p>
          {alertFilter !== 'all' && (
            <button
              onClick={() => setAlertFilter('all')}
              className="text-xs font-black text-emerald-600 hover:underline cursor-pointer"
            >
              عرض جميع الأصناف
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filteredProducts.map((p, idx) => {
            const exp = getProductExpiry(p);
            const minStock = typeof p.min_stock === 'number' && p.min_stock > 0 ? p.min_stock : 5;
            const isNearDepletion = p.stock_quantity <= minStock;
            const isOutOfStock = p.stock_quantity <= 0;

            // تحديد ما إذا كان المنتج يقترب من الانتهاء (أقل من 7 أيام)
            const isCritical7Days = exp.isCritical7;
            const isExpired = exp.isExpired;

            // شارة الصلاحية العلوية
            let expiryBadge = null;
            if (isExpired) {
              expiryBadge = (
                <div className="absolute top-1.5 left-1.5 z-10 bg-red-600 text-white text-[8.5px] font-black px-2 py-0.5 rounded-full border border-red-700 shadow-2xs flex items-center gap-1 animate-pulse">
                  <AlertOctagon className="w-2.5 h-2.5" />
                  <span>منتهي الصلاحية ({Math.abs(exp.days ?? 0)} يوم)</span>
                </div>
              );
            } else if (isCritical7Days) {
              // تلوين صريح باللون الأحمر للمنتجات التي تنتهي خلال أقل من 7 أيام!
              expiryBadge = (
                <div className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[8.5px] font-black px-2 py-0.5 rounded-full border border-red-600 shadow-xs flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-200" />
                  <span>
                    ⚠️ ينتهي خلال {exp.days === 0 ? 'اليوم!' : exp.days === 1 ? 'يوم واحد!' : `${exp.days} أيام!`}
                  </span>
                </div>
              );
            } else if (exp.isExpiring30) {
              expiryBadge = (
                <div className="absolute top-1.5 left-1.5 z-10 bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                  قريب الانتهاء ({exp.days} يوم)
                </div>
              );
            }

            // فئات التلوين للبطاقة: أحمر صارخ إذا كانت الصلاحية < 7 أيام أو منتهية
            const cardBorderClass = (isCritical7Days || isExpired)
              ? 'border-2 border-red-500 bg-gradient-to-b from-red-50/70 via-white to-white shadow-sm shadow-red-500/10 ring-1 ring-red-400/30'
              : isNearDepletion
                ? 'border border-amber-300 bg-amber-50/20 hover:border-amber-400'
                : 'border border-slate-200 hover:border-emerald-300 bg-white';

            const rightStripeClass = (isCritical7Days || isExpired)
              ? 'bg-red-600'
              : p.stock_quantity <= 5 
                ? 'bg-red-500' 
                : p.stock_quantity <= 20 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500';

            return (
              <Card 
                key={`inv-product-${p.id ?? 'no-id'}-${idx}`} 
                className={`group transition-all cursor-pointer relative overflow-hidden p-0 flex flex-col justify-between shadow-2xs hover:shadow-xs rounded-xl ${cardBorderClass}`} 
                onClick={() => fetchProductHistory(p)}
              >
                {/* شريط الإشارة الجانبي */}
                <div className={`absolute top-0 right-0 w-1.5 h-full ${rightStripeClass}`} />
                {expiryBadge}

                <div className="p-2.5 space-y-2 flex-1 pt-6">
                  {/* عنوان المنتج ومؤشر النفاذ */}
                  <div className="flex justify-between items-start gap-1.5">
                    <p 
                      className={`font-black text-xs sm:text-sm line-clamp-1 transition-colors ${
                        (isCritical7Days || isExpired) ? 'text-red-900 group-hover:text-red-700' : 'text-slate-800 group-hover:text-emerald-700'
                      }`} 
                      title={p.name}
                    >
                      {p.name}
                    </p>
                    
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      <div className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        isOutOfStock 
                          ? 'bg-red-600 text-white animate-pulse'
                          : isNearDepletion 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : p.stock_quantity <= 20 
                              ? 'bg-amber-50 text-amber-600' 
                              : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {p.stock_quantity} {p.unit || ''}
                      </div>
                      {isNearDepletion && (
                        <span className="text-[8px] font-black text-red-600">
                          {isOutOfStock ? 'نفد المخزون!' : '⚠️ أوشك على النفاذ'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* إشعار تاريخ الصلاحية داخل البطاقة بالتلوين الأحمر الصريح */}
                  {p.expiration_date && (
                    <div className={`flex items-center justify-between text-[9.5px] px-2 py-1 rounded-lg font-bold border ${
                      (isCritical7Days || isExpired)
                        ? 'bg-red-100 text-red-800 border-red-200 shadow-2xs'
                        : 'bg-slate-100/80 text-slate-600 border-slate-200/70'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Clock className={`w-3 h-3 ${(isCritical7Days || isExpired) ? 'text-red-600' : 'text-slate-400'}`} />
                        <span>تاريخ الصلاحية:</span>
                      </span>
                      <span className="font-mono font-black">
                        {p.expiration_date}
                      </span>
                    </div>
                  )}

                  {/* تفاصيل الأسعار والتصنيف */}
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

                {/* شريط الإجراءات السريعة في أسفل البطاقة */}
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
                        (isCritical7Days || isExpired) ? 'bg-red-100 text-red-700 hover:bg-red-200' :
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
                      title="تعديل الصنف وتاريخ الصلاحية"
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
      )}

      {/* النافذة المنبثقة للتقرير الخاص بالصلاحية والمخزون الحرج */}
      <ExpiryReportModal
        isOpen={showExpiryModal}
        onClose={() => setShowExpiryModal(false)}
        products={products}
        formatPrice={formatPrice}
        initialTab={initialModalTab}
        onEditProduct={(prod) => {
          verifyAdminPermission('edit_product', () => setEditingProduct(prod), '✏️ صلاحية تعديل صنف');
        }}
        onUpdateStock={(prod) => setUpdatingStockProduct(prod)}
      />

      {/* النافذة المنبثقة الذكية للوحة تنبيهات المخزون */}
      {showSmartAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 text-white shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
                  <ClipboardList className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                    <span>لوحة تنبيهات المخزون الذكية</span>
                    {alertStats.totalAlerts > 0 ? (
                      <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                        {alertStats.totalAlerts} تنبيه نشط
                      </span>
                    ) : (
                      <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        المخزون مستقر
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-amber-100 font-medium">مراقبة فورية للصلاحية والنفاذ والحدود الدنيا للأصناف</p>
                </div>
              </div>

              <button
                onClick={() => setShowSmartAlertsModal(false)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* بطاقات الإشعار المباشرة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. بطاقة إشعار الصلاحية الحرجة */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  alertStats.critical7.length > 0 || alertStats.expired.length > 0
                    ? 'bg-gradient-to-b from-red-50 to-rose-50/50 border-red-200 shadow-2xs'
                    : 'bg-emerald-50/40 border-emerald-200/60'
                }`}>
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      alertStats.critical7.length > 0 || alertStats.expired.length > 0
                        ? 'bg-red-600 text-white shadow-xs animate-pulse'
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {alertStats.critical7.length > 0 || alertStats.expired.length > 0 ? (
                        <AlertTriangle className="w-5 h-5 text-amber-200" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-slate-800">
                          الصلاحية الحرجة (أقل من 7 أيام)
                        </h4>
                        {alertStats.critical7.length > 0 && (
                          <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded-full font-black">
                            {alertStats.critical7.length} حرج
                          </span>
                        )}
                        {alertStats.expired.length > 0 && (
                          <span className="text-[10px] bg-rose-900 text-white px-1.5 py-0.2 rounded-full font-black">
                            {alertStats.expired.length} منتهي
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                        {alertStats.critical7.length > 0 || alertStats.expired.length > 0 ? (
                          <span>
                            يوجد <strong className="text-red-700 font-black">{alertStats.critical7.length} صنف</strong> يقترب تاريخ صلاحيته من الانتهاء، بالإضافة إلى <strong className="text-rose-900 font-black">{alertStats.expired.length} منتهي</strong>.
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">
                            جميع المنتجات صالحة ومستقرة تماماً.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-red-200/60 flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setAlertFilter(alertFilter === 'critical7' ? 'all' : 'critical7');
                        setShowSmartAlertsModal(false);
                      }}
                      className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                        alertFilter === 'critical7'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white hover:bg-red-100 text-red-700 border border-red-300'
                      }`}
                    >
                      {alertFilter === 'critical7' ? '✓ جاري حصرها بالقائمة' : 'تصفية وحصر بالقائمة'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSmartAlertsModal(false);
                        openReportModal('critical7');
                      }}
                      className="text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>عرض التقرير الخاص</span>
                    </button>
                  </div>
                </div>

                {/* 2. بطاقة تذكير تقريب نفاذ المنتج */}
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  alertStats.lowStock.length > 0
                    ? 'bg-gradient-to-b from-amber-50 to-orange-50/50 border-amber-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      alertStats.lowStock.length > 0
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-300 text-slate-700'
                    }`}>
                      <PackageX className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-slate-800">
                          نفاذ الكمية (المخزون الحرج)
                        </h4>
                        {alertStats.lowStock.length > 0 && (
                          <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full font-black">
                            {alertStats.lowStock.length} نواقص
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                        {alertStats.lowStock.length > 0 ? (
                          <span>
                            يوجد <strong className="text-amber-800 font-black">{alertStats.lowStock.length} صنف</strong> وصل أو هبط عن الحد الأدنى للطلب بالمخزن.
                          </span>
                        ) : (
                          <span className="text-slate-600 font-bold">
                            الكميات كافية وتتجاوز الحدود الدنيا لكافة الأصناف.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-amber-200/60 flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setAlertFilter(alertFilter === 'lowStock' ? 'all' : 'lowStock');
                        setShowSmartAlertsModal(false);
                      }}
                      className={`text-[11px] font-black px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                        alertFilter === 'lowStock'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {alertFilter === 'lowStock' ? '✓ جاري حصر النواقص' : 'تصفية النواقص بالقائمة'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSmartAlertsModal(false);
                        openReportModal('lowStock');
                      }}
                      className="text-[11px] font-black px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>تقرير النواقص</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* أزرار التصفية السريعة للقائمة */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>تصفية سريعة لقائمة المخزون الرئيسية:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setAlertFilter('all');
                      setShowSmartAlertsModal(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      alertFilter === 'all'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    عرض الكل ({products.length})
                  </button>
                  <button
                    onClick={() => {
                      setAlertFilter('critical7');
                      setShowSmartAlertsModal(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      alertFilter === 'critical7'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
                    }`}
                  >
                    <span>أقل من 7 أيام ({alertStats.critical7.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setAlertFilter('expired');
                      setShowSmartAlertsModal(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      alertFilter === 'expired'
                        ? 'bg-rose-900 text-white shadow-xs'
                        : 'bg-white text-rose-900 border border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span>منتهية الصلاحية ({alertStats.expired.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setAlertFilter('lowStock');
                      setShowSmartAlertsModal(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      alertFilter === 'lowStock'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>نواقص المخزون ({alertStats.lowStock.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setAlertFilter('expiring30');
                      setShowSmartAlertsModal(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      alertFilter === 'expiring30'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <span>تنتهي خلال شهر ({alertStats.expiring30.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowSmartAlertsModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                إغلاق النافذة
              </button>

              <button
                onClick={() => {
                  setShowSmartAlertsModal(false);
                  openReportModal('critical7');
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>فتح التقرير المفصل الشامل 📋</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const ProductsView = memo(ProductsViewComponent);
export default ProductsView;
