import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'نقطة البيع', icon: ShoppingCart },
    { id: 'inventory', label: 'المخزون', icon: Package },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        className={`fixed top-0 right-0 bottom-0 w-72 bg-white border-l border-slate-100 z-50 lg:translate-x-0 lg:static lg:block transition-transform duration-300 ease-in-out`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">بقالة بلس</h1>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-1">الإصدار الحالي</p>
            <p className="text-sm font-bold text-slate-600">v1.2.0 (Manus Enhanced)</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
