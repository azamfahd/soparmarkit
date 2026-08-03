import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, QrCode } from 'lucide-react';
import { Button } from '../ui/Button';

export interface AddProductModalProps {
  showAddProduct: boolean;
  setShowAddProduct: (show: boolean) => void;
    scannerMode: any;
  setScannerMode: React.Dispatch<React.SetStateAction<any>>;
  setIsScannerOpen: (open: boolean) => void;
  suppliers: any[];
  handleAddProduct: (product: any, resetForm: () => void) => void;
  setActiveTab: (tab: string) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  showAddProduct,
  setShowAddProduct,
    scannerMode,
  setScannerMode,
  setIsScannerOpen,
  suppliers,
  handleAddProduct,
  setActiveTab
}) => {

  const [newProduct, setNewProduct] = useState({ name: '', cost: '', sale: '', stock: '', category: '', barcode: '', unit: '', supplier_id: undefined as number | undefined, production_date: '', expiration_date: '' });
  const [addProfitPercent, setAddProfitPercent] = useState<string>('');

  useEffect(() => {
    (window as any).onBarcodeScanned = (code: string) => {
      setNewProduct(prev => ({ ...prev, barcode: code }));
    };
    return () => {
      delete (window as any).onBarcodeScanned;
    };
  }, []);

  const handleAddCostChange = (costStr: string) => {
    const cost = Number(costStr);
    if (!isNaN(cost) && addProfitPercent) {
      const pct = Number(addProfitPercent);
      const profitAmt = cost * (pct / 100);
      setNewProduct(prev => ({ ...prev, cost: costStr, sale: (cost + profitAmt).toString() }));
    } else {
      setNewProduct(prev => ({ ...prev, cost: costStr }));
    }
  };

  const handleAddProfitPercentChange = (pctStr: string) => {
    setAddProfitPercent(pctStr);
    const pct = Number(pctStr);
    const cost = Number(newProduct.cost);
    if (!isNaN(pct) && !isNaN(cost) && cost > 0) {
      const profitAmt = cost * (pct / 100);
      setNewProduct(prev => ({ ...prev, sale: (cost + profitAmt).toString() }));
    }
  };

  const handleAddSaleChange = (saleStr: string) => {
    const sale = Number(saleStr);
    const cost = Number(newProduct.cost);
    setNewProduct(prev => ({ ...prev, sale: saleStr }));
    if (!isNaN(sale) && !isNaN(cost) && cost > 0) {
      const pct = ((sale - cost) / cost) * 100;
      setAddProfitPercent(Math.round(pct).toString());
    } else {
      setAddProfitPercent('');
    }
  };

  const handleSave = async () => {
    handleAddProduct(newProduct, () => {
      setNewProduct({ name: '', cost: '', sale: '', stock: '', category: '', barcode: '', unit: '', supplier_id: undefined, production_date: '', expiration_date: '' });
      setAddProfitPercent('');
    });
  };

  if (!showAddProduct) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-extrabold text-slate-800">إضافة صنف جديد</h3>
          <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 pr-1">اسم المنتج</label>
            <input 
              placeholder="أدخل اسم المنتج" 
              className="w-full p-3.5 bg-yellow-50 border border-slate-100 rounded-2xl focus:border-emerald-500 outline-none transition-colors" 
              value={newProduct.name} 
              onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 pr-1">رقم الباركود</label>
            <div className="flex gap-2">
              <input 
                placeholder="أدخل أو امسح الباركود" 
                className="flex-1 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-left font-mono focus:border-emerald-500 outline-none transition-colors" 
                value={newProduct.barcode || ''} 
                onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} 
              />
              <button 
                type="button"
                onClick={() => { setScannerMode('add-product'); setIsScannerOpen(true); }}
                className="px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-sm"
                title="مسح من الكاميرا"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500">التكلفة</label>
              <input 
                type="number" 
                className="w-full p-3 bg-yellow-50 border border-slate-100 rounded-xl text-center text-sm font-semibold focus:border-slate-300 outline-none" 
                value={newProduct.cost} 
                onChange={e => handleAddCostChange(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500">الربح %</label>
              <input 
                type="number" 
                className="w-full p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400" 
                value={addProfitPercent} 
                onChange={e => handleAddProfitPercentChange(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500">سعر البيع</label>
              <input 
                type="number" 
                className="w-full p-3 bg-yellow-50 border border-emerald-100 text-emerald-700 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400" 
                value={newProduct.sale} 
                onChange={e => handleAddSaleChange(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 pr-1">الكمية المتوفرة</label>
                <input type="number" className="w-full p-3.5 bg-yellow-50 border border-slate-100 rounded-2xl focus:border-emerald-500 outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 pr-1">الفئة</label>
                <input 
                  list="categories-list"
                  className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-emerald-500 outline-none" 
                  value={newProduct.category} 
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 pr-1">المورد</label>
            <select 
              className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:border-emerald-500 outline-none"
              value={newProduct.supplier_id || ''}
              onChange={e => setNewProduct({...newProduct, supplier_id: e.target.value ? Number(e.target.value) : undefined} as any)}
            >
              <option value="">اختار المورد (اختياري)</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 pr-1">الوحدة</label>
            <input 
              list="units-list"
              className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-emerald-500 outline-none" 
              value={newProduct.unit} 
              onChange={e => setNewProduct({...newProduct, unit: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500">تاريخ الإنتاج</label>
              <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={newProduct.production_date} onChange={e => setNewProduct({...newProduct, production_date: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500">تاريخ الانتهاء</label>
              <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={newProduct.expiration_date} onChange={e => setNewProduct({...newProduct, expiration_date: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-2xl py-3.5" onClick={() => {
            setShowAddProduct(false);
            if (scannerMode === 'pos' || scannerMode === 'add-product') {
              setIsScannerOpen(true);
              setActiveTab('pos');
            }
          }}>إلغاء</Button>
          <Button className="flex-1 rounded-2xl py-3.5 shadow-lg shadow-emerald-500/20" onClick={handleSave}>حفظ المنتج</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddProductModal;
