import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, QrCode, Package, Tag, DollarSign, Percent, Layers, Box, Truck, Calendar, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export interface AddProductModalProps {
  showAddProduct: boolean;
  setShowAddProduct: (show: boolean) => void;
  scannerMode: any;
  setScannerMode: React.Dispatch<React.SetStateAction<any>>;
  setIsScannerOpen: (open: boolean) => void;
  suppliers: any[];
  handleAddProduct: (product: any, resetForm: () => void) => void;
  setActiveTab: (tab: string) => void;
  initialBarcode?: string;
  roundingFactor?: number | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  showAddProduct,
  setShowAddProduct,
  scannerMode,
  setScannerMode,
  setIsScannerOpen,
  suppliers,
  handleAddProduct,
  setActiveTab,
  initialBarcode,
  roundingFactor,
}) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    cost: '',
    sale: '',
    stock: '',
    category: '',
    barcode: '',
    unit: 'حبة',
    supplier_id: undefined as number | undefined,
    production_date: '',
    expiration_date: '',
  });

  const [addProfitPercent, setAddProfitPercent] = useState<string>('');
  const [addProfitAmount, setAddProfitAmount] = useState<string>('');
  const [lastChanged, setLastChanged] = useState<'cost' | 'sale'>('cost');

  // Set initial barcode if opened from scanner prompt or prop
  useEffect(() => {
    if (initialBarcode) {
      setNewProduct(prev => ({ ...prev, barcode: initialBarcode }));
    }
  }, [initialBarcode]);

  // Set up live window barcode scan callback
  useEffect(() => {
    (window as any).onBarcodeScanned = (code: string) => {
      setNewProduct(prev => ({ ...prev, barcode: code }));
      setIsScannerOpen(false);
    };
    return () => {
      delete (window as any).onBarcodeScanned;
    };
  }, [setIsScannerOpen]);

  const formatCalc = (num: number): string => {
    if (isNaN(num) || !isFinite(num)) return '';
    const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
    return rounded.toString();
  };

  const applyRounding = (val: number): number => {
    if (isNaN(val) || !isFinite(val)) return 0;
    if (roundingFactor && roundingFactor > 0) {
      return Math.round(val / roundingFactor) * roundingFactor;
    }
    return Math.round((val + Number.EPSILON) * 100) / 100;
  };

  const handleCostChange = (costStr: string) => {
    setLastChanged('cost');
    const cost = parseFloat(costStr);
    const pct = parseFloat(addProfitPercent);
    const amt = parseFloat(addProfitAmount);
    const sale = parseFloat(newProduct.sale);

    let newSaleStr = newProduct.sale;
    let newPctStr = addProfitPercent;
    let newAmtStr = addProfitAmount;

    if (!isNaN(cost) && cost >= 0) {
      if (!isNaN(pct) && pct > 0 && pct < 100 && addProfitPercent !== '') {
        const rawSale = cost / (1 - pct / 100);
        const roundedSale = applyRounding(rawSale);
        const calculatedAmt = roundedSale - cost;
        newSaleStr = formatCalc(roundedSale);
        newAmtStr = formatCalc(calculatedAmt);
      } else if (!isNaN(amt) && amt > 0 && addProfitAmount !== '') {
        const rawSale = cost + amt;
        const roundedSale = applyRounding(rawSale);
        const calculatedPct = roundedSale > 0 ? ((roundedSale - cost) / roundedSale) * 100 : 0;
        newSaleStr = formatCalc(roundedSale);
        newPctStr = formatCalc(calculatedPct);
      } else if (!isNaN(sale) && sale >= 0 && newProduct.sale !== '') {
        const calculatedAmt = sale - cost;
        const calculatedPct = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        newAmtStr = formatCalc(calculatedAmt);
        newPctStr = formatCalc(calculatedPct);
      }
    }

    setAddProfitPercent(newPctStr);
    setAddProfitAmount(newAmtStr);
    setNewProduct(prev => ({ ...prev, cost: costStr, sale: newSaleStr }));
  };

  const handleProfitPercentChange = (pctStr: string) => {
    const pct = parseFloat(pctStr);
    const cost = parseFloat(newProduct.cost);
    const sale = parseFloat(newProduct.sale);

    let newCostStr = newProduct.cost;
    let newSaleStr = newProduct.sale;
    let newAmtStr = addProfitAmount;

    if (!isNaN(pct)) {
      const isSaleAnchor = lastChanged === 'sale' || (!isNaN(sale) && sale > 0 && (isNaN(cost) || newProduct.cost === ''));

      if (isSaleAnchor && !isNaN(sale) && sale > 0) {
        const calculatedCost = sale * (1 - pct / 100);
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedAmt = sale - roundedCost;
        newCostStr = formatCalc(roundedCost);
        newAmtStr = formatCalc(calculatedAmt);
      } else if (!isNaN(cost) && cost >= 0) {
        if (pct < 100) {
          const rawSale = cost / (1 - pct / 100);
          const roundedSale = applyRounding(rawSale);
          const calculatedAmt = roundedSale - cost;
          newSaleStr = formatCalc(roundedSale);
          newAmtStr = formatCalc(calculatedAmt);
        }
      } else if (!isNaN(sale) && sale > 0) {
        const calculatedCost = sale * (1 - pct / 100);
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedAmt = sale - roundedCost;
        newCostStr = formatCalc(roundedCost);
        newAmtStr = formatCalc(calculatedAmt);
      }
    }

    setAddProfitPercent(pctStr);
    setAddProfitAmount(newAmtStr);
    setNewProduct(prev => ({ ...prev, cost: newCostStr, sale: newSaleStr }));
  };

  const handleProfitAmountChange = (amtStr: string) => {
    const amt = parseFloat(amtStr);
    const cost = parseFloat(newProduct.cost);
    const sale = parseFloat(newProduct.sale);

    let newCostStr = newProduct.cost;
    let newSaleStr = newProduct.sale;
    let newPctStr = addProfitPercent;

    if (!isNaN(amt)) {
      const isSaleAnchor = lastChanged === 'sale' || (!isNaN(sale) && sale > 0 && (isNaN(cost) || newProduct.cost === ''));

      if (isSaleAnchor && !isNaN(sale) && sale > 0) {
        const calculatedCost = sale - amt;
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedPct = sale > 0 ? ((sale - roundedCost) / sale) * 100 : 0;
        newCostStr = formatCalc(roundedCost);
        newPctStr = formatCalc(calculatedPct);
      } else if (!isNaN(cost) && cost >= 0) {
        const rawSale = cost + amt;
        const roundedSale = applyRounding(rawSale);
        const calculatedPct = roundedSale > 0 ? ((roundedSale - cost) / roundedSale) * 100 : 0;
        newSaleStr = formatCalc(roundedSale);
        newPctStr = formatCalc(calculatedPct);
      } else if (!isNaN(sale) && sale > 0) {
        const calculatedCost = sale - amt;
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedPct = sale > 0 ? ((sale - roundedCost) / sale) * 100 : 0;
        newCostStr = formatCalc(roundedCost);
        newPctStr = formatCalc(calculatedPct);
      }
    }

    setAddProfitAmount(amtStr);
    setAddProfitPercent(newPctStr);
    setNewProduct(prev => ({ ...prev, cost: newCostStr, sale: newSaleStr }));
  };

  const handleSaleChange = (saleStr: string) => {
    setLastChanged('sale');
    const sale = parseFloat(saleStr);
    const cost = parseFloat(newProduct.cost);
    const pct = parseFloat(addProfitPercent);
    const amt = parseFloat(addProfitAmount);

    let newCostStr = newProduct.cost;
    let newPctStr = addProfitPercent;
    let newAmtStr = addProfitAmount;

    if (!isNaN(sale) && sale >= 0) {
      if (!isNaN(cost) && cost >= 0 && newProduct.cost !== '') {
        const calculatedAmt = sale - cost;
        const calculatedPct = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        newAmtStr = formatCalc(calculatedAmt);
        newPctStr = formatCalc(calculatedPct);
      } else if (!isNaN(pct) && pct < 100 && addProfitPercent !== '') {
        const calculatedCost = sale * (1 - pct / 100);
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedAmt = sale - roundedCost;
        newCostStr = formatCalc(roundedCost);
        newAmtStr = formatCalc(calculatedAmt);
      } else if (!isNaN(amt) && addProfitAmount !== '') {
        const calculatedCost = sale - amt;
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedPct = sale > 0 ? ((sale - roundedCost) / sale) * 100 : 0;
        newCostStr = formatCalc(roundedCost);
        newPctStr = formatCalc(calculatedPct);
      }
    }

    setAddProfitPercent(newPctStr);
    setAddProfitAmount(newAmtStr);
    setNewProduct(prev => ({ ...prev, cost: newCostStr, sale: saleStr }));
  };

  const applyPresetProfitPercent = (pctValue: number) => {
    handleProfitPercentChange(pctValue.toString());
  };

  const handleSave = async () => {
    handleAddProduct(newProduct, () => {
      setNewProduct({
        name: '',
        cost: '',
        sale: '',
        stock: '',
        category: '',
        barcode: '',
        unit: 'حبة',
        supplier_id: undefined,
        production_date: '',
        expiration_date: '',
      });
      setAddProfitPercent('');
      setAddProfitAmount('');
      setLastChanged('sale');
    });
  };

  if (!showAddProduct) return null;

  const costVal = parseFloat(newProduct.cost) || 0;
  const saleVal = parseFloat(newProduct.sale) || 0;
  const profitMarginVal = saleVal - costVal;
  const profitPercentVal = parseFloat(addProfitPercent) || (saleVal > 0 ? (profitMarginVal / saleVal) * 100 : 0);
  const commonUnits = ['حبة', 'كيلو', 'كرتون', 'علبة', 'متر', 'طقم', 'درزن'];
  const presetPcts = [5, 10, 15, 20, 25, 30, 50];

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">إضافة صنف جديد للمخزن</h3>
              <p className="text-[11px] text-slate-300 font-bold">أدخل بيانات المنتج وسعره بدقة لتسهيل البيع والمخزون</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddProduct(false)}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto bg-slate-50/50">
          {/* Item Name */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 pr-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              اسم المنتج <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              placeholder="مثال: زيت عافية 1.5 لتر / أرز الشعلان 5 كجم"
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm"
              value={newProduct.name}
              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              autoFocus
            />
          </div>

          {/* Barcode Section */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 pr-1">
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              رقم الباركود (رمز السلعة)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="أدخل الباركود أو استخدم الماسح"
                className="flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl text-left font-mono font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm shadow-sm dir-ltr"
                value={newProduct.barcode || ''}
                onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })}
              />
              <button
                type="button"
                onClick={() => {
                  setScannerMode('add-product');
                  setIsScannerOpen(true);
                }}
                className="px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-xs shadow-sm active:scale-95 cursor-pointer shrink-0"
                title="مسح الكاميرا"
              >
                <QrCode className="w-4 h-4" />
                <span>مسح</span>
              </button>
            </div>
          </div>

          {/* Pricing & Profit Calculator Section */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                حاسبة الأسعار والأرباح المباشرة
              </span>
              {costVal > 0 && saleVal > 0 && (
                <span
                  className={`text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                    profitMarginVal >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {profitMarginVal >= 0 ? <Sparkles className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3 text-rose-500" />}
                  <span>
                    {profitMarginVal >= 0 ? `الربح: ${profitMarginVal.toFixed(2)} (${profitPercentVal.toFixed(1)}%)` : `خسارة: ${Math.abs(profitMarginVal).toFixed(2)}`}
                  </span>
                </span>
              )}
            </div>

            {/* Presets Row for Profit % */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-1">نسب ربح سريعة:</span>
              {presetPcts.map(pct => (
                <button
                  key={`preset-${pct}`}
                  type="button"
                  onClick={() => applyPresetProfitPercent(pct)}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  +{pct}%
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Cost Price */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 block text-right">سعر التكلفة</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="w-full p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-center text-xs font-black text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                  value={newProduct.cost}
                  onChange={e => handleCostChange(e.target.value)}
                />
              </div>

              {/* Profit % */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-700 block text-right flex items-center justify-between">
                  <span>النسبة %</span>
                  <Percent className="w-2.5 h-2.5 text-indigo-500" />
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="%"
                  className="w-full p-2.5 bg-indigo-50/60 border border-indigo-200/80 text-indigo-900 rounded-xl text-center text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-mono"
                  value={addProfitPercent}
                  onChange={e => handleProfitPercentChange(e.target.value)}
                />
              </div>

              {/* Profit Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-teal-700 block text-right flex items-center justify-between">
                  <span>مبلغ الربح</span>
                  <TrendingUp className="w-2.5 h-2.5 text-teal-500" />
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="w-full p-2.5 bg-teal-50/60 border border-teal-200/80 text-teal-900 rounded-xl text-center text-xs font-black focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all font-mono"
                  value={addProfitAmount}
                  onChange={e => handleProfitAmountChange(e.target.value)}
                />
              </div>

              {/* Sale Price */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-700 block text-right">سعر البيع</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  className="w-full p-2.5 bg-emerald-50/60 border border-emerald-200/80 text-emerald-900 rounded-xl text-center text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                  value={newProduct.sale}
                  onChange={e => handleSaleChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quantity & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 pr-1">
                <Box className="w-3.5 h-3.5 text-blue-600" />
                الكمية المتوفرة
              </label>
              <input
                type="number"
                placeholder="العدد بالمخزون"
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-center font-mono font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm shadow-sm"
                value={newProduct.stock}
                onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 pr-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                الفئة / التصنيف
              </label>
              <input
                list="categories-list"
                placeholder="اختر أو اكتب الفئة"
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm shadow-sm"
                value={newProduct.category}
                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
              />
            </div>
          </div>

          {/* Unit & Quick Selection */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-700 pr-1">وحدة القياس</label>
              <span className="text-[10px] text-slate-400 font-bold">اختيارات سريعة:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {commonUnits.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setNewProduct({ ...newProduct, unit: u })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    newProduct.unit === u
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <input
              list="units-list"
              placeholder="وحدة القياس (مثال: حبة، كرتون، كيلو)"
              className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-emerald-500 outline-none text-xs shadow-sm"
              value={newProduct.unit}
              onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
            />
          </div>

          {/* Supplier Select */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 pr-1">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              المورد (اختياري)
            </label>
            <select
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm focus:border-slate-400 outline-none shadow-sm cursor-pointer"
              value={newProduct.supplier_id || ''}
              onChange={e =>
                setNewProduct({
                  ...newProduct,
                  supplier_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">-- اختار المورد --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 pr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                تاريخ الإنتاج
              </label>
              <input
                type="date"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-slate-400"
                value={newProduct.production_date}
                onChange={e => setNewProduct({ ...newProduct, production_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 pr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                تاريخ الانتهاء
              </label>
              <input
                type="date"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-slate-400"
                value={newProduct.expiration_date}
                onChange={e => setNewProduct({ ...newProduct, expiration_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>حفظ المنتج بالتغييرات</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddProduct(false);
              if (scannerMode === 'pos' || scannerMode === 'add-product') {
                setIsScannerOpen(true);
                setActiveTab('pos');
              }
            }}
            className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddProductModal;
