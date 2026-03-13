import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  Plus,
  Printer,
  Download
} from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
  onAddClick?: () => void;
  onPrintClick?: () => void;
  onExportClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title, onAddClick, onPrintClick, onExportClick }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-2 mr-4">
          {onAddClick && (
            <button 
              onClick={onAddClick}
              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
              title="إضافة جديد"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          {onPrintClick && (
            <button 
              onClick={onPrintClick}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
              title="طباعة"
            >
              <Printer className="w-5 h-5" />
            </button>
          )}
          {onExportClick && (
            <button 
              onClick={onExportClick}
              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
              title="تصدير"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden lg:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 w-64 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث سريع..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full px-2 text-slate-600"
          />
        </div>

        {/* Notifications & Profile */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
