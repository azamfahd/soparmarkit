import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, QrCode, Package, Tag, DollarSign, Percent, Layers, Box, Truck, Calendar, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export interface EditProductModalProps {
  editingProduct: any;
  setEditingProduct: React.Dispatch<React.SetStateAction<any>>;
  setScannerMode: React.Dispatch<React.SetStateAction<any>>;
  setIsScannerOpen: (open: boolean) => void;
  suppliers: any[];
  handleEditProduct: () => void;
  roundingFactor?: number | null;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  editingProduct,
  setEditingProduct,
  setScannerMode,
  setIsScannerOpen,
  suppliers,
  handleEditProduct,
  roundingFactor,
}) => {
  if (!editingProduct) return null;

  const [editCostStr, setEditCostStr] = useState(String(editingProduct.cost_price ?? editingProduct.cost ?? ''));
  const [editSaleStr, setEditSaleStr] = useState(String(editingProduct.sale_price ?? editingProduct.price ?? ''));
  const [editProfitPercent, setEditProfitPercent] = useState<string>('');
  const [editProfitAmount, setEditProfitAmount] = useState<string>('');
  const [lastChanged, setLastChanged] = useState<'cost' | 'sale'>('sale');

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

  useEffect(() => {
    if (editingProduct) {
      const c = editingProduct.cost_price ?? editingProduct.cost ?? 0;
      const s = editingProduct.sale_price ?? editingProduct.price ?? 0;
      const cost = Number(c) || 0;
      const sale = Number(s) || 0;
      
      setEditCostStr(cost ? cost.toString() : '');
      setEditSaleStr(sale ? sale.toString() : '');
      
      if (cost > 0 && sale > 0) {
        const amt = sale - cost;
        const pct = (amt / sale) * 100;
        setEditProfitAmount(formatCalc(amt));
        setEditProfitPercent(formatCalc(pct));
      } else {
        setEditProfitAmount('');
        setEditProfitPercent('');
      }
      setLastChanged('sale');
    }
  }, [editingProduct?.id]);

  useEffect(() => {
    (window as any).onBarcodeScanned = (code: string) => {
      setEditingProduct((prev: any) => (prev ? { ...prev, barcode: code } : null));
      setIsScannerOpen(false);
    };
    return () => {
      delete (window as any).onBarcodeScanned;
    };
  }, [setEditingProduct, setIsScannerOpen]);

  const handleCostChange = (costStr: string) => {
    setLastChanged('cost');
    setEditCostStr(costStr);
    const cost = parseFloat(costStr);
    const pct = parseFloat(editProfitPercent);
    const amt = parseFloat(editProfitAmount);
    const sale = parseFloat(editSaleStr);

    let newSaleStr = editSaleStr;
    let newPctStr = editProfitPercent;
    let newAmtStr = editProfitAmount;

    if (!isNaN(cost) && cost >= 0) {
      if (!isNaN(pct) && pct > 0 && pct < 100 && editProfitPercent !== '') {
        const rawSale = cost / (1 - pct / 100);
        const roundedSale = applyRounding(rawSale);
        const calculatedAmt = roundedSale - cost;
        newSaleStr = formatCalc(roundedSale);
        newAmtStr = formatCalc(calculatedAmt);
      } else if (!isNaN(amt) && amt > 0 && editProfitAmount !== '') {
        const rawSale = cost + amt;
        const roundedSale = applyRounding(rawSale);
        const calculatedPct = roundedSale > 0 ? ((roundedSale - cost) / roundedSale) * 100 : 0;
        newSaleStr = formatCalc(roundedSale);
        newPctStr = formatCalc(calculatedPct);
      } else if (!isNaN(sale) && sale >= 0 && editSaleStr !== '') {
        const calculatedAmt = sale - cost;
        const calculatedPct = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        newAmtStr = formatCalc(calculatedAmt);
        newPctStr = formatCalc(calculatedPct);
      }
    }

    setEditProfitPercent(newPctStr);
    setEditProfitAmount(newAmtStr);
    setEditSaleStr(newSaleStr);

    setEditingProduct((prev: any) => ({
      ...prev,
      cost_price: Number(costStr) || 0,
      cost: costStr,
      sale_price: Number(newSaleStr) || 0,
      price: newSaleStr,
    }));
  };

  const handleProfitPercentChange = (pctStr: string) => {
    setEditProfitPercent(pctStr);
    const pct = parseFloat(pctStr);
    const cost = parseFloat(editCostStr);
    const sale = parseFloat(editSaleStr);

    let newCostStr = editCostStr;
    let newSaleStr = editSaleStr;
    let newAmtStr = editProfitAmount;

    if (!isNaN(pct)) {
      const isSaleAnchor = lastChanged === 'sale' || (!isNaN(sale) && sale > 0 && (isNaN(cost) || editCostStr === ''));

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

    setEditProfitAmount(newAmtStr);
    setEditCostStr(newCostStr);
    setEditSaleStr(newSaleStr);

    setEditingProduct((prev: any) => ({
      ...prev,
      cost_price: Number(newCostStr) || 0,
      cost: newCostStr,
      sale_price: Number(newSaleStr) || 0,
      price: newSaleStr,
    }));
  };

  const handleProfitAmountChange = (amtStr: string) => {
    setEditProfitAmount(amtStr);
    const amt = parseFloat(amtStr);
    const cost = parseFloat(editCostStr);
    const sale = parseFloat(editSaleStr);

    let newCostStr = editCostStr;
    let newSaleStr = editSaleStr;
    let newPctStr = editProfitPercent;

    if (!isNaN(amt)) {
      const isSaleAnchor = lastChanged === 'sale' || (!isNaN(sale) && sale > 0 && (isNaN(cost) || editCostStr === ''));

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

    setEditProfitPercent(newPctStr);
    setEditCostStr(newCostStr);
    setEditSaleStr(newSaleStr);

    setEditingProduct((prev: any) => ({
      ...prev,
      cost_price: Number(newCostStr) || 0,
      cost: newCostStr,
      sale_price: Number(newSaleStr) || 0,
      price: newSaleStr,
    }));
  };

  const handleSaleChange = (saleStr: string) => {
    setLastChanged('sale');
    setEditSaleStr(saleStr);
    const sale = parseFloat(saleStr);
    const cost = parseFloat(editCostStr);
    const pct = parseFloat(editProfitPercent);
    const amt = parseFloat(editProfitAmount);

    let newCostStr = editCostStr;
    let newPctStr = editProfitPercent;
    let newAmtStr = editProfitAmount;

    if (!isNaN(sale) && sale >= 0) {
      if (!isNaN(cost) && cost >= 0 && editCostStr !== '') {
        const calculatedAmt = sale - cost;
        const calculatedPct = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        newAmtStr = formatCalc(calculatedAmt);
        newPctStr = formatCalc(calculatedPct);
      } else if (!isNaN(pct) && pct < 100 && editProfitPercent !== '') {
        const calculatedCost = sale * (1 - pct / 100);
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedAmt = sale - roundedCost;
        newCostStr = formatCalc(roundedCost);
        newAmtStr = formatCalc(calculatedAmt);
      } else if (!isNaN(amt) && editProfitAmount !== '') {
        const calculatedCost = sale - amt;
        const roundedCost = Math.round((calculatedCost + Number.EPSILON) * 100) / 100;
        const calculatedPct = sale > 0 ? ((sale - roundedCost) / sale) * 100 : 0;
        newCostStr = formatCalc(roundedCost);
        newPctStr = formatCalc(calculatedPct);
      }
    }

    setEditProfitPercent(newPctStr);
    setEditProfitAmount(newAmtStr);
    setEditCostStr(newCostStr);

    setEditingProduct((prev: any) => ({
      ...prev,
      cost_price: Number(newCostStr) || 0,
      cost: newCostStr,
      sale_price: Number(saleStr) || 0,
      price: saleStr,
    }));
  };

  const applyPresetProfitPercent = (pctValue: number) => {
    handleProfitPercentChange(pctValue.toString());
  };

  const costVal = parseFloat(editCostStr) || 0;
  const saleVal = parseFloat(editSaleStr) || 0;
  const profitMarginVal = saleVal - costVal;
  const profitPercentVal = parseFloat(editProfitPercent) || (saleVal > 0 ? (profitMarginVal / saleVal) * 100 : 0);
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
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-teal-500" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">تعديل بيانات المنتج</h3>
              <p className="text-[11px] text-slate-300 font-bold">{editingProduct.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditingProduct(null)}
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
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              اسم المنتج <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              placeholder="اسم المنتج"
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 outline-none transition-all text-sm shadow-sm"
              value={editingProduct.name || ''}
              onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
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
                placeholder="رقم الباركود"
                className="flex-1 p-3.5 bg-white border border-slate-200 rounded-2xl text-left font-mono font-bold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm shadow-sm dir-ltr"
                value={editingProduct.barcode || ''}
                onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
              />
              <button
                type="button"
                onClick={() => {
                  setScannerMode('edit-product');
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
              {presetPcts.map((pct, idx) => (
                <button
                  key={`preset-edit-${pct}-${idx}`}
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
                  value={editCostStr}
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
                  value={editProfitPercent}
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
                  value={editProfitAmount}
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
                  value={editSaleStr}
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
                value={editingProduct.stock_quantity ?? ''}
                onChange={e =>
                  setEditingProduct({
                    ...editingProduct,
                    stock_quantity: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 pr-1">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                الفئة / التصنيف
              </label>
              <input
                list="categories-list"
                placeholder="الفئة"
                className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm shadow-sm"
                value={editingProduct.category || ''}
                onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
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
              {commonUnits.map((u, idx) => (
                <button
                  key={`edit-prod-unit-${u}-${idx}`}
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, unit: u })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    editingProduct.unit === u
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <input
              list="units-list"
              placeholder="وحدة القياس"
              className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-blue-500 outline-none text-xs shadow-sm"
              value={editingProduct.unit || ''}
              onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })}
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
              value={editingProduct.supplier_id || ''}
              onChange={e =>
                setEditingProduct({
                  ...editingProduct,
                  supplier_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">-- بدون مورد --</option>
              {suppliers.map((s, idx) => (
                <option key={`edit-prod-supp-${s.id ?? 'noid'}-${idx}`} value={s.id}>
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
                value={editingProduct.production_date || ''}
                onChange={e => setEditingProduct({ ...editingProduct, production_date: e.target.value })}
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
                value={editingProduct.expiration_date || ''}
                onChange={e => setEditingProduct({ ...editingProduct, expiration_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={handleEditProduct}
            className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>حفظ وتحديث المنتج</span>
          </button>
          <button
            type="button"
            onClick={() => setEditingProduct(null)}
            className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProductModal;
