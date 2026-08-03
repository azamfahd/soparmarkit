import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QrCode } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EditProductModalProps {
  editingProduct: any;
  setEditingProduct: React.Dispatch<React.SetStateAction<any>>;
  setScannerMode: React.Dispatch<React.SetStateAction<any>>;
  setIsScannerOpen: (open: boolean) => void;
  suppliers: any[];
  handleEditProduct: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  editingProduct,
  setEditingProduct,
  setScannerMode,
  setIsScannerOpen,
  suppliers,
  handleEditProduct,
}) => {
  if (!editingProduct) return null;

  const [editCostStr, setEditCostStr] = useState(String(editingProduct.cost || ''));
  const [editSaleStr, setEditSaleStr] = useState(String(editingProduct.price || ''));
  const [editProfitPercent, setEditProfitPercent] = useState<string>('');

  useEffect(() => {
    if (editingProduct) {
      setEditCostStr(String(editingProduct.cost || ''));
      setEditSaleStr(String(editingProduct.price || ''));
      const cost = Number(editingProduct.cost);
      const sale = Number(editingProduct.price);
      if (cost > 0 && sale > 0) {
        setEditProfitPercent(Math.round(((sale - cost) / cost) * 100).toString());
      } else {
        setEditProfitPercent('');
      }
    }
  }, [editingProduct.id]); // trigger only on product change

  useEffect(() => {
    (window as any).onBarcodeScanned = (code: string) => {
      setEditingProduct((prev: any) => prev ? { ...prev, barcode: code } : null);
    };
    return () => {
      delete (window as any).onBarcodeScanned;
    };
  }, [setEditingProduct]);

  const handleEditCostChange = (costStr: string) => {
    setEditCostStr(costStr);
    const cost = Number(costStr);
    let finalSale = editSaleStr;
    if (!isNaN(cost) && editProfitPercent) {
      const pct = Number(editProfitPercent);
      const profitAmt = cost * (pct / 100);
      finalSale = (cost + profitAmt).toString();
      setEditSaleStr(finalSale);
    }
    setEditingProduct({ ...editingProduct, cost: costStr, price: finalSale });
  };

  const handleEditProfitPercentChange = (pctStr: string) => {
    setEditProfitPercent(pctStr);
    const pct = Number(pctStr);
    const cost = Number(editCostStr);
    if (!isNaN(pct) && !isNaN(cost) && cost > 0) {
      const profitAmt = cost * (pct / 100);
      const finalSale = (cost + profitAmt).toString();
      setEditSaleStr(finalSale);
      setEditingProduct({ ...editingProduct, price: finalSale });
    }
  };

  const handleEditSaleChange = (saleStr: string) => {
    setEditSaleStr(saleStr);
    const sale = Number(saleStr);
    const cost = Number(editCostStr);
    setEditingProduct({ ...editingProduct, price: saleStr });
    if (!isNaN(sale) && !isNaN(cost) && cost > 0) {
      const pct = ((sale - cost) / cost) * 100;
      setEditProfitPercent(Math.round(pct).toString());
    } else {
      setEditProfitPercent('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <h3 className="text-xl font-bold">تعديل صنف: {editingProduct.name}</h3>
        <input 
          placeholder="اسم المنتج" 
          className="w-full p-3 bg-slate-100 rounded-xl" 
          value={editingProduct.name} 
          onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
        />
        <div className="flex gap-2">
          <input 
            placeholder="رقم الباركود (اختياري)" 
            className="flex-1 p-3 bg-slate-100 rounded-xl text-left font-mono" 
            value={editingProduct.barcode || ''} 
            onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} 
          />
          <button 
            type="button"
            onClick={() => { setScannerMode('edit-product'); setIsScannerOpen(true); }}
            className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold text-xs"
            title="مسح من الكاميرا"
          >
            <QrCode className="w-4 h-4" />
            <span>مسح</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">سعر التكلفة</label>
            <input 
              type="number" 
              placeholder="التكلفة" 
              className="w-full p-2.5 bg-slate-100 rounded-xl text-center text-sm font-semibold" 
              value={editCostStr} 
              onChange={e => handleEditCostChange(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">نسبة الربح %</label>
            <input 
              type="number" 
              placeholder="%" 
              className="w-full p-2.5 bg-indigo-50 text-indigo-700 placeholder-indigo-300 rounded-xl text-center text-sm font-bold border border-indigo-100 focus:outline-none focus:ring-1 focus:ring-indigo-400" 
              value={editProfitPercent} 
              onChange={e => handleEditProfitPercentChange(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">سعر البيع</label>
            <input 
              type="number" 
              placeholder="البيع" 
              className="w-full p-2.5 bg-emerald-50 text-emerald-700 placeholder-emerald-300 rounded-xl text-center text-sm font-bold border border-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-400" 
              value={editSaleStr} 
              onChange={e => handleEditSaleChange(e.target.value)} 
            />
          </div>
        </div>
        <input 
          type="number" 
          placeholder="الكمية المتوفرة" 
          className="w-full p-3 bg-slate-100 rounded-xl" 
          value={editingProduct.stock_quantity} 
          onChange={e => setEditingProduct({...editingProduct, stock_quantity: Number(e.target.value)})} 
        />
        <input 
          list="categories-list"
          placeholder="الفئة" 
          className="w-full p-3 bg-slate-100 rounded-xl" 
          value={editingProduct.category} 
          onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} 
        />
        <input 
          list="units-list"
          placeholder="الوحدة (مثال: حبة، كرتون، كيلو) - اختياري" 
          className="w-full p-3 bg-slate-100 rounded-xl" 
          value={editingProduct.unit || ''} 
          onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} 
        />
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold block text-right pr-1">المورد</label>
          <select 
            className="w-full p-3 bg-slate-100 rounded-xl text-sm"
            value={editingProduct.supplier_id || ''}
            onChange={e => setEditingProduct({...editingProduct, supplier_id: e.target.value ? Number(e.target.value) : undefined} as any)}
          >
            <option value="">اختار المورد (اختياري)</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-slate-500 font-bold px-1">تاريخ الإنتاج (اختياري)</label>
            <input 
              type="date" 
              className="w-full p-3 bg-slate-100 rounded-xl" 
              value={editingProduct.production_date || ''} 
              onChange={e => setEditingProduct({...editingProduct, production_date: e.target.value})} 
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] text-slate-500 font-bold px-1">تاريخ الانتهاء (اختياري)</label>
            <input 
              type="date" 
              className="w-full p-3 bg-slate-100 rounded-xl" 
              value={editingProduct.expiration_date || ''} 
              onChange={e => setEditingProduct({...editingProduct, expiration_date: e.target.value})} 
            />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button className="flex-1" onClick={handleEditProduct}>تحديث</Button>
          <Button variant="secondary" onClick={() => setEditingProduct(null)}>إلغاء</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProductModal;
