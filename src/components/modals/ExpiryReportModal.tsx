import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  AlertOctagon, 
  PackageX, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  Search, 
  RefreshCcw, 
  Edit3, 
  Clock,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { downloadWorkbook } from '../../utils/fileSaver';

export interface ExpiryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  formatPrice: (price: number) => string;
  onEditProduct?: (product: any) => void;
  onUpdateStock?: (product: any) => void;
  initialTab?: 'critical7' | 'expired' | 'lowStock' | 'allExpiring';
}

export const ExpiryReportModal: React.FC<ExpiryReportModalProps> = ({
  isOpen,
  onClose,
  products,
  formatPrice,
  onEditProduct,
  onUpdateStock,
  initialTab = 'critical7',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'critical7' | 'expired' | 'lowStock' | 'allExpiring'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Helper to compute expiry details
  const getProductExpiryInfo = (product: any) => {
    if (!product.expiration_date) {
      return { hasDate: false, days: null, isExpired: false, isCritical7: false, isExpiring30: false };
    }
    const exp = new Date(product.expiration_date);
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

  const getProductStockInfo = (product: any) => {
    const min = typeof product.min_stock === 'number' && product.min_stock > 0 ? product.min_stock : 5;
    const isLow = product.stock_quantity <= min;
    const isOut = product.stock_quantity <= 0;
    return { min, isLow, isOut };
  };

  // Grouped products
  const { critical7Items, expiredItems, lowStockItems, allExpiringItems } = useMemo(() => {
    const critical7: any[] = [];
    const expired: any[] = [];
    const lowStock: any[] = [];
    const allExpiring: any[] = [];

    products.forEach(p => {
      const exp = getProductExpiryInfo(p);
      const stk = getProductStockInfo(p);

      if (exp.isCritical7) {
        critical7.push({ ...p, expiryInfo: exp, stockInfo: stk });
      }
      if (exp.isExpired) {
        expired.push({ ...p, expiryInfo: exp, stockInfo: stk });
      }
      if (exp.hasDate && (exp.isExpired || exp.isCritical7 || exp.isExpiring30)) {
        allExpiring.push({ ...p, expiryInfo: exp, stockInfo: stk });
      }
      if (stk.isLow) {
        lowStock.push({ ...p, expiryInfo: exp, stockInfo: stk });
      }
    });

    // Sort by remaining days ascending
    critical7.sort((a, b) => (a.expiryInfo.days ?? 0) - (b.expiryInfo.days ?? 0));
    expired.sort((a, b) => (a.expiryInfo.days ?? 0) - (b.expiryInfo.days ?? 0));
    allExpiring.sort((a, b) => (a.expiryInfo.days ?? 0) - (b.expiryInfo.days ?? 0));
    lowStock.sort((a, b) => a.stock_quantity - b.stock_quantity);

    return {
      critical7Items: critical7,
      expiredItems: expired,
      lowStockItems: lowStock,
      allExpiringItems: allExpiring
    };
  }, [products]);

  // Current list based on active tab
  const activeList = useMemo(() => {
    let list: any[] = [];
    if (activeSubTab === 'critical7') list = critical7Items;
    else if (activeSubTab === 'expired') list = expiredItems;
    else if (activeSubTab === 'lowStock') list = lowStockItems;
    else if (activeSubTab === 'allExpiring') list = allExpiringItems;

    if (!searchTerm.trim()) return list;
    const q = searchTerm.trim().toLowerCase();
    return list.filter(item => 
      item.name?.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  }, [activeSubTab, critical7Items, expiredItems, lowStockItems, allExpiringItems, searchTerm]);

  // Metrics for active list
  const metrics = useMemo(() => {
    const count = activeList.length;
    const totalUnits = activeList.reduce((sum, i) => sum + (Number(i.stock_quantity) || 0), 0);
    const totalCost = activeList.reduce((sum, i) => sum + ((Number(i.cost_price) || 0) * (Number(i.stock_quantity) || 0)), 0);
    const totalRetail = activeList.reduce((sum, i) => sum + ((Number(i.sale_price) || 0) * (Number(i.stock_quantity) || 0)), 0);
    return { count, totalUnits, totalCost, totalRetail };
  }, [activeList]);

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const wb = XLSX.utils.book_new();

      const tabTitleMap = {
        critical7: 'المنتجات_قريبة_الانتهاء_أقل_من_7_أيام',
        expired: 'المنتجات_منتهية_الصلاحية',
        lowStock: 'المنتجات_قريبة_النفاذ',
        allExpiring: 'سجل_تنبيهات_الصلاحية_الشامل'
      };

      const rows = activeList.map((item, idx) => {
        const exp = item.expiryInfo || getProductExpiryInfo(item);
        const daysText = exp.days === null 
          ? 'غير محدد' 
          : exp.days < 0 
            ? `منتهي منذ ${Math.abs(exp.days)} يوم` 
            : exp.days === 0 
              ? 'ينتهي اليوم!' 
              : `باقي ${exp.days} يوم`;

        return {
          'م': idx + 1,
          'اسم المنتج': item.name,
          'الباركود': item.barcode || '-',
          'التصنيف': item.category || 'عام',
          'الكمية في المخزن': item.stock_quantity,
          'الوحدة': item.unit || 'حبة',
          'تاريخ الصلاحية': item.expiration_date || '-',
          'حالة الصلاحية / الأيام المتبقية': daysText,
          'سعر التكلفة': item.cost_price,
          'سعر البيع': item.sale_price,
          'إجمالي قيمة التكلفة المعرضة': (item.cost_price || 0) * (item.stock_quantity || 0),
          'الحد الأدنى للطلب': item.min_stock || 5
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!dir'] = 'rtl';
      XLSX.utils.book_append_sheet(wb, ws, tabTitleMap[activeSubTab] || 'تقرير_الصلاحية');

      const dateStr = new Date().toISOString().split('T')[0];
      await downloadWorkbook(wb, `تقرير_صلاحية_المخزون_${activeSubTab}_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF / Print
  const handlePrintPDF = () => {
    const tabNameArabic = 
      activeSubTab === 'critical7' ? 'المنتجات التي أوشكت صلاحيتها على الانتهاء (أقل من 7 أيام)' :
      activeSubTab === 'expired' ? 'المنتجات منتهية الصلاحية' :
      activeSubTab === 'lowStock' ? 'المنتجات التي تقترب من النفاذ (المخزون الحرج)' :
      'تقرير تنبيهات صلاحية المخزون الشامل';

    const element = document.createElement('div');
    element.innerHTML = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b;">
        <div style="text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 6px; font-size: 20px; color: #0f172a;">${tabNameArabic}</h2>
          <p style="margin: 0; font-size: 11px; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleString('ar-SA')} | إجمالي الأصناف: ${activeList.length}</p>
        </div>

        <div style="display: flex; gap: 15px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="flex: 1; text-align: center;">
            <span style="font-size: 10px; color: #64748b; display: block;">عدد الأصناف</span>
            <strong style="font-size: 14px; color: #0f172a;">${metrics.count}</strong>
          </div>
          <div style="flex: 1; text-align: center;">
            <span style="font-size: 10px; color: #64748b; display: block;">إجمالي القطع المتبقية</span>
            <strong style="font-size: 14px; color: #0f172a;">${metrics.totalUnits}</strong>
          </div>
          <div style="flex: 1; text-align: center;">
            <span style="font-size: 10px; color: #b91c1c; display: block;">إجمالي قيمة التكلفة المعرضة للخسارة</span>
            <strong style="font-size: 14px; color: #b91c1c;">${formatPrice(metrics.totalCost)}</strong>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #e2e8f0; color: #334155;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; width: 35px;">#</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">اسم المنتج</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">القسم</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">الكمية</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">تاريخ الصلاحية</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">الأيام المتبقية</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">التكلفة الإجمالية</th>
            </tr>
          </thead>
          <tbody>
            ${activeList.map((item, idx) => {
              const exp = item.expiryInfo || getProductExpiryInfo(item);
              const daysText = exp.days === null 
                ? '-' 
                : exp.days < 0 
                  ? `منتهي (${Math.abs(exp.days)} يوم)` 
                  : exp.days === 0 
                    ? 'اليوم!' 
                    : `${exp.days} يوم`;
              const isCrit = exp.isCritical7 || exp.isExpired;
              const rowBg = isCrit ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');

              return `
                <tr style="background: ${rowBg};">
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-weight: bold; color: ${isCrit ? '#b91c1c' : '#1e293b'};">${item.name}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: right;">${item.category || '-'}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">${item.stock_quantity} ${item.unit || ''}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${item.expiration_date || '-'}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold; color: ${isCrit ? '#dc2626' : '#d97706'};">${daysText}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">${formatPrice((item.cost_price || 0) * (item.stock_quantity || 0))}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    const opt = {
      margin: 0.3,
      filename: `تقرير_صلاحية_المخزون_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    (html2pdf as any)().set(opt as any).from(element).save();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-right"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <span>تقرير الصلاحية والمخزون الحرج</span>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                    رصد استباقي ذكي
                  </span>
                </h3>
                <p className="text-xs text-rose-100 font-medium mt-0.5">
                  كشف فوري للأصناف التي تقترب من الانتهاء أو النفاذ لحماية رأس المال
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {/* Tab 1: Critical < 7 Days */}
              <button
                onClick={() => setActiveSubTab('critical7')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === 'critical7'
                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-red-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>أقل من 7 أيام (حرج)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                  activeSubTab === 'critical7' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  {critical7Items.length}
                </span>
              </button>

              {/* Tab 2: Expired */}
              <button
                onClick={() => setActiveSubTab('expired')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === 'expired'
                    ? 'bg-rose-800 text-white shadow-sm ring-2 ring-rose-700/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-rose-400'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-300" />
                <span>منتهية الصلاحية</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                  activeSubTab === 'expired' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                  {expiredItems.length}
                </span>
              </button>

              {/* Tab 3: Low Stock / Depletion */}
              <button
                onClick={() => setActiveSubTab('lowStock')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === 'lowStock'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300'
                }`}
              >
                <PackageX className="w-3.5 h-3.5 text-amber-200" />
                <span>أوشكت على النفاذ</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                  activeSubTab === 'lowStock' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {lowStockItems.length}
                </span>
              </button>

              {/* Tab 4: All Expiring (< 30 days) */}
              <button
                onClick={() => setActiveSubTab('allExpiring')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeSubTab === 'allExpiring'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>جميع تواريخ الصلاحية</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                  activeSubTab === 'allExpiring' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {allExpiringItems.length}
                </span>
              </button>
            </div>

            {/* Print & Excel Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                disabled={isExporting || activeList.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="تصدير إلى جدول Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>إكسل</span>
              </button>
              <button
                onClick={handlePrintPDF}
                disabled={activeList.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="تصدير تقرير رسمي PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-100/60 border-b border-slate-200">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">عدد الأصناف بالتقرير</span>
              <div className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <span>{metrics.count}</span>
                <span className="text-[10px] font-bold text-slate-400">صنف</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">إجمالي القطع المتبقية</span>
              <div className="text-base font-black text-indigo-700 flex items-center gap-1.5">
                <span>{metrics.totalUnits}</span>
                <span className="text-[10px] font-bold text-slate-400">قطعة</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-2xl border border-red-200 shadow-2xs text-right bg-red-50/30">
              <span className="text-[10px] font-bold text-red-500 block mb-0.5">رأس المال المعرض للمخاطرة (تكلفة)</span>
              <div className="text-base font-black text-red-700">
                {formatPrice(metrics.totalCost)}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-0.5">القيمة البيعية المتوقعة</span>
              <div className="text-base font-black text-emerald-700">
                {formatPrice(metrics.totalRetail)}
              </div>
            </div>
          </div>

          {/* Search Bar inside Modal */}
          <div className="px-5 py-2.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الباركود، أو القسم داخل هذا التقرير..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full py-1.5 px-3 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Content Table / List */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeList.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 stroke-[1.5]" />
                <p className="font-black text-sm text-slate-600">
                  {searchTerm ? 'لا توجد أصناف تطابق نتائج البحث' : 'ممتاز! لا توجد أصناف مسجلة تحت هذا التنبيه حالياً'}
                </p>
                <p className="text-xs text-slate-400">
                  كافة المنتجات مستقرة وصالحة، استمر في متابعة المخزون بشكل دوري
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeList.map((item, idx) => {
                  const exp = item.expiryInfo || getProductExpiryInfo(item);
                  const isCritical = exp.isCritical7 || exp.isExpired;

                  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                  let badgeText = 'غير محدد';

                  if (exp.isExpired) {
                    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
                    badgeText = `🛑 منتهي الصلاحية (${Math.abs(exp.days ?? 0)} يوم)`;
                  } else if (exp.isCritical7) {
                    badgeColor = 'bg-red-500 text-white border-red-600 shadow-2xs font-black animate-pulse';
                    badgeText = `🚨 ينتهي خلال ${exp.days === 0 ? 'اليوم!' : exp.days === 1 ? 'يوم واحد!' : `${exp.days} أيام!`} (حرج)`;
                  } else if (exp.isExpiring30) {
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                    badgeText = `⚠️ ينتهي خلال ${exp.days} يوم`;
                  }

                  const totalCostItem = (item.cost_price || 0) * (item.stock_quantity || 0);

                  return (
                    <div
                      key={`report-item-${item.id}-${idx}`}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCritical
                          ? 'bg-gradient-to-r from-red-50/90 to-white border-red-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Product Name and Details */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-slate-900">
                            {item.name}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-bold">
                            {item.category || 'عام'}
                          </span>
                          {item.barcode && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              #{item.barcode}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1 font-bold">
                            <span className="text-slate-400">الكمية بالمخزن:</span>
                            <span className={`font-black ${item.stock_quantity <= (item.min_stock || 5) ? 'text-red-600' : 'text-slate-800'}`}>
                              {item.stock_quantity} {item.unit || ''}
                            </span>
                          </span>

                          {item.expiration_date && (
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">تاريخ الصلاحية:</span>
                              <span className="font-mono font-bold text-slate-700">{item.expiration_date}</span>
                            </span>
                          )}

                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">سعر التكلفة:</span>
                            <span className="font-mono font-bold text-slate-700">{formatPrice(item.cost_price)}</span>
                          </span>

                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">إجمالي التكلفة المعرضة:</span>
                            <span className="font-mono font-black text-red-600">{formatPrice(totalCostItem)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {onUpdateStock && (
                          <button
                            onClick={() => {
                              onUpdateStock(item);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            title="تحديث أو جرد الكمية"
                          >
                            <RefreshCcw className="w-3 h-3" />
                            <span>تحديث</span>
                          </button>
                        )}
                        {onEditProduct && (
                          <button
                            onClick={() => {
                              onEditProduct(item);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            title="تعديل تاريخ الصلاحية أو بيانات الصنف"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>يتم احتساب الأيام المتبقية آلياً بناءً على تاريخ اليوم</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExpiryReportModal;
