import React from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle,
  Filter,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Product {
  id?: number;
  name: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  category: string;
}

interface InventoryProps {
  products: Product[];
  categories: string[];
  inventorySearchTerm: string;
  setInventorySearchTerm: (term: string) => void;
  inventoryCategory: string;
  setInventoryCategory: (cat: string) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  formatPrice: (price: number) => string;
}

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  categories, 
  inventorySearchTerm, 
  setInventorySearchTerm, 
  inventoryCategory, 
  setInventoryCategory,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  formatPrice
}) => {
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) &&
    (inventoryCategory === 'الكل' || p.category === inventoryCategory)
  );

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 w-full md:w-96 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث عن منتج..." 
            value={inventorySearchTerm}
            onChange={(e) => setInventorySearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full px-2 text-slate-600"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 flex-1 md:w-48">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={inventoryCategory}
              onChange={(e) => setInventoryCategory(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full px-2 text-slate-600"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <button 
            onClick={onAddProduct}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة منتج</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-bold text-slate-500">المنتج</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">الفئة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">سعر التكلفة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">سعر البيع</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">المخزون</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product, idx) => (
                <motion.tr 
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                        <Package className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-700">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                      {product.category || 'غير مصنف'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{formatPrice(product.cost_price)}</td>
                  <td className="px-6 py-4 text-emerald-600 font-bold">{formatPrice(product.sale_price)}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${product.stock_quantity <= 5 ? 'text-red-500' : 'text-slate-700'}`}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {product.stock_quantity <= 5 ? (
                      <div className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg w-fit">
                        <AlertCircle className="w-3 h-3" />
                        منخفض
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                        متوفر
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEditProduct(product)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => product.id && onDeleteProduct(product.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">لا توجد نتائج</h3>
            <p className="text-slate-400">لم نجد أي منتجات تطابق بحثك</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
