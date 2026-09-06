import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  BookOpen, 
  Plus, 
  Search, 
  X, 
  Calendar, 
  Check, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Database, 
  AlertCircle 
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface NotesViewProps {
  setActiveTab: (tab: string) => void;
  setEditingNoteId: (id: number | null) => void;
  setShowAddNote: (show: boolean) => void;
  notes: any[];
  noteFilter: 'all' | 'pending' | 'completed' | 'high';
  setNoteFilter: (filter: 'all' | 'pending' | 'completed' | 'high') => void;
  setSelectedNote: (note: any) => void;
  handleToggleNoteCompletion: (note: any) => void;
  handleEditNoteAction: (note: any) => void;
  handleDeleteNote: (id: number) => void;
  formatDateWithDay: (date: any) => string;
  verifyAdminPermission: (action: string, onSuccess: () => void, label: string) => void;
  setShowWithdrawModal: (show: boolean) => void;
  currentCycleWithdrawalsTotal: number;
  currentCycleUnpaidWithdrawalsTotal: number;
  currentCycleWithdrawals: any[];
  formatPrice: (price: number) => string;
  formatDateTimeWithDay: (date: any) => string;
  handleRepayWithdrawal: (id: number) => void;
  handleDeleteWithdrawal: (id: number) => void;
  lastSettleDate: any;
  setShowSettleModal: (show: boolean) => void;
  activeOutstandingCash: number;
  currentCycleCashTotal: number;
  currentCycleCashSales: number;
  currentCycleDebtPaymentsTotal: number;
  carriedForwardDeficit: number;
  currentCycleSupplierPaymentsTotal: number;
  currentCycleDebtTotal: number;
  salesSettlements: any[];
  handleDeleteSettlement: (id: number) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  setActiveTab,
  setEditingNoteId,
  setShowAddNote,
  notes,
  noteFilter,
  setNoteFilter,
  setSelectedNote,
  handleToggleNoteCompletion,
  handleEditNoteAction,
  handleDeleteNote,
  formatDateWithDay,
  verifyAdminPermission,
  setShowWithdrawModal,
  currentCycleWithdrawalsTotal,
  currentCycleUnpaidWithdrawalsTotal,
  currentCycleWithdrawals,
  formatPrice,
  formatDateTimeWithDay,
  handleRepayWithdrawal,
  handleDeleteWithdrawal,
  lastSettleDate,
  setShowSettleModal,
  activeOutstandingCash,
  currentCycleCashTotal,
  currentCycleCashSales,
  currentCycleDebtPaymentsTotal,
  carriedForwardDeficit,
  currentCycleSupplierPaymentsTotal,
  currentCycleDebtTotal,
  salesSettlements,
  handleDeleteSettlement,
}) => {
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [viewSection, setViewSection] = useState<'all' | 'notes' | 'withdrawals' | 'settlement'>('all');

  return (
    <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* عنوان الصفحة مع زر الرجوع للواجهة الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-150/60">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer" title="الرجوع للواجهة الرئيسية">
            <Home className="w-6 h-6" />
          </button>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">الملاحظات، المسحوبات وتصفية الصندوق</h3>
            <p className="text-[10px] text-slate-400 font-bold">إدارة منظمة ومفصولة للملاحظات اليومية ومسحوبات وسُلفيات الدرج المؤقتة</p>
          </div>
        </div>

        {/* أزرار التنقل السريع بين الأقسام */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
          <button
            onClick={() => setViewSection('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewSection === 'all' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            عرض الكل
          </button>
          <button
            onClick={() => setViewSection('notes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewSection === 'notes' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            الملاحظات ({notes.filter(n => !n.is_completed).length})
          </button>
          <button
            onClick={() => setViewSection('withdrawals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewSection === 'withdrawals' ? 'bg-white text-indigo-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            مسحوبات الدرج ({currentCycleWithdrawals.length})
          </button>
          <button
            onClick={() => setViewSection('settlement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewSection === 'settlement' ? 'bg-white text-violet-800 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تسوية الصندوق
          </button>
        </div>
      </div>

      {/* قسم الملاحظات والمهام اليومية */}
      {(viewSection === 'all' || viewSection === 'notes') && (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/80 p-4 rounded-3xl border border-slate-150/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-black text-slate-800">سجل المهام والملاحظات واليوميات بالصندوق</h2>
              <p className="text-[10px] text-slate-400 font-bold">تسجيل وتدوين التنبيهات، المعاملات، النواقص، والتسليم اليومي لوردية الصندوق</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white font-extrabold text-xs py-2.5 rounded-2xl cursor-pointer" 
            onClick={() => { setEditingNoteId(null); setShowAddNote(true); }}
          >
            <Plus className="w-4 h-4" /> إضافة مهمة / ملاحظة جديدة
          </Button>
        </div>

        {/* أزرار الفلترة وشريط البحث */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-1 text-right">
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-150/50 w-fit">
            {[
              { key: 'all', label: 'الكل', count: notes.length },
              { key: 'pending', label: 'المعلقة 📝', count: notes.filter(n => !n.is_completed).length },
              { key: 'completed', label: 'المكتملة ✓', count: notes.filter(n => n.is_completed).length },
              { key: 'high', label: 'عاجلة وهامة 🚨', count: notes.filter(n => (n.priority || 'normal') === 'high').length }
            ].map((pill, idx) => (
              <button
                key={`note-filter-pill-${pill.key}-${idx}`}
                onClick={() => setNoteFilter(pill.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  noteFilter === pill.key
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  noteFilter === pill.key ? 'bg-emerald-550/15 text-emerald-700' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="البحث في العنوان أو محتوى الملاحظات..."
              value={noteSearchQuery}
              onChange={(e) => setNoteSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 text-slate-700 font-extrabold transition-all placeholder:text-slate-400 text-right"
            />
            {noteSearchQuery && (
              <button 
                onClick={() => setNoteSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-350 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* عرض الملاحظات */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full mb-3">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">لا يوجد ملاحظات أو مهام</h3>
            <p className="text-slate-400 text-xs">قم بإضافة ملاحظاتك ومهامك اليومية هنا لتذكرها لاحقاً</p>
          </div>
        ) : (
          (() => {
            const filteredNotes = notes.filter(note => {
              if (noteFilter === 'pending') {
                if (note.is_completed) return false;
              } else if (noteFilter === 'completed') {
                if (!note.is_completed) return false;
              } else if (noteFilter === 'high') {
                if ((note.priority || 'normal') !== 'high') return false;
              }
              
              if (noteSearchQuery.trim()) {
                const q = noteSearchQuery.toLowerCase();
                return (note.title || '').toLowerCase().includes(q) || (note.content || '').toLowerCase().includes(q);
              }
              return true;
            });

            if (filteredNotes.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-3xl border border-slate-100/80 shadow-xs">
                  <Search className="w-8 h-8 text-slate-300 mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">لا توجد ملاحظات تطابق بحثك أو تصنيفك</h4>
                  <p className="text-slate-400 text-[10px] mt-0.5">يرجى تعديل الفلتر أو محرك البحث لرؤية النتائج الأخرى</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredNotes.map((note, idx) => {
                  const priority = note.priority || 'normal';
                  let pConfig = {
                    badgeBg: 'bg-slate-100 text-slate-600 border border-slate-200/50',
                    borderColor: 'border-r-4 border-r-slate-400',
                    label: '🟢 ملاحظة عامة',
                    bgHover: 'hover:border-slate-300'
                  };
                  if (priority === 'high') {
                    pConfig = {
                      badgeBg: 'bg-red-50 text-red-700 border border-red-100',
                      borderColor: 'border-r-4 border-r-red-500',
                      label: '🔴 عاجل وهام',
                      bgHover: 'hover:border-red-200 hover:shadow-red-50/[0.04]'
                    };
                  } else if (priority === 'info') {
                    pConfig = {
                      badgeBg: 'bg-blue-50 text-blue-700 border border-blue-100',
                      borderColor: 'border-r-4 border-r-blue-500',
                      label: '🔵 حسابات وكاش',
                      bgHover: 'hover:border-blue-200 hover:shadow-blue-50/[0.04]'
                    };
                  } else if (priority === 'warning') {
                    pConfig = {
                      badgeBg: 'bg-amber-50 text-amber-700 border border-amber-100',
                      borderColor: 'border-r-4 border-r-amber-500',
                      label: '🟡 نواقص بضاعة',
                      bgHover: 'hover:border-amber-200 hover:shadow-amber-50/[0.04]'
                    };
                  }

                  return (
                    <Card 
                      key={`note-card-${note.id ?? 'noid'}-${idx}`} 
                      onClick={() => setSelectedNote(note)}
                      className={`relative overflow-hidden group hover:shadow-sm transition-all border border-slate-150/70 bg-white p-4 rounded-2xl flex flex-col justify-between cursor-pointer ${pConfig.borderColor} ${pConfig.bgHover} ${note.is_completed ? 'opacity-70 bg-slate-50/40' : ''}`}
                    >
                      <div className="space-y-3">
                        {/* رأس الكارد */}
                        <div className="flex justify-between items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${pConfig.badgeBg}`}>
                            {pConfig.label}
                          </span>
                          
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => handleToggleNoteCompletion(note)}
                              className={`p-1 rounded-lg transition-colors cursor-pointer ${note.is_completed ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                              title={note.is_completed ? "تأشير كغير مكتملة" : "تأشير كمكتملة وسليمة"}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleEditNoteAction(note)} 
                              className="text-slate-400 hover:text-emerald-600 transition-colors p-1 hover:bg-slate-150 rounded-lg cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteNote(note.id!)} 
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-slate-150 rounded-lg cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* العنوان والتفاصيل */}
                        <div className="space-y-1.5 text-right">
                          <h3 className={`font-black text-sm tracking-tight text-slate-800 leading-snug line-clamp-1 ${note.is_completed ? 'line-through text-slate-400' : ''}`}>
                            {note.title}
                          </h3>
                          <p className="text-slate-500 text-[11px] font-semibold whitespace-pre-wrap break-words leading-relaxed line-clamp-3 text-right">
                            {note.content}
                          </p>
                        </div>
                      </div>

                      {/* التواريخ في ذيل الكارد */}
                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-[9px] font-black text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateWithDay(note.created_at)}
                        </span>
                        {note.reminder_date ? (
                          <span className={`px-1.5 py-0.5 rounded-md font-bold ${note.is_completed ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            تنبيه: {formatDateWithDay(note.reminder_date)}
                          </span>
                        ) : (
                          <span className="text-[8px] opacity-65 text-slate-350">عرض التفاصيل ←</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
      )}

      {/* قسم مسحوبات الصندوق والسلف النقدية المؤقتة */}
      {(viewSection === 'all' || viewSection === 'withdrawals') && (
      <div className="bg-white rounded-2xl p-4 border border-slate-150/65 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                💸 مسحوبات وسُلفيات الصندوق الكاش (الدورة الحالية)
              </h3>
              <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                سلفيات مؤقتة تسدد للدرج
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              مبالغ يسحبها ماسك الصندوق/الموظف للتسديد لاحقاً أو كأتعاب قبل إغلاق الفترة (تختلف عن المصروفات التشغيلية للمحل)
            </p>
          </div>
          <Button 
            onClick={() => {
              verifyAdminPermission('cash_withdrawal', () => {
                setShowWithdrawModal(true);
              }, '💸 تسجيل مسحوبات كاش');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] sm:text-xs py-2 px-3 rounded-xl flex items-center gap-1 cursor-pointer shadow-xs w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" /> تسجيل سحب/سلفة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
            <div>
              <span className="text-[9px] text-slate-400 block font-bold">إجمالي المسحوبات (الدورة الحالية)</span>
              <span className="text-xs font-black font-mono text-slate-700">{formatPrice(currentCycleWithdrawalsTotal)}</span>
            </div>
            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black">المسحوبات الكلية</span>
          </div>
          <div className={`p-2.5 rounded-xl border flex justify-between items-center ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
            <div>
              <span className={`text-[9px] block font-bold ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'text-amber-600' : 'text-slate-400'}`}>المسحوبات غير المسددة (مستحقة للدرج)</span>
              <span className={`text-xs font-black font-mono ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'text-amber-800' : 'text-slate-500'}`}>{formatPrice(currentCycleUnpaidWithdrawalsTotal)}</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${currentCycleUnpaidWithdrawalsTotal > 0 ? 'bg-amber-100 text-amber-750 font-black animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
              {currentCycleUnpaidWithdrawalsTotal > 0 ? 'مستحق السداد للدرج ⚠️' : 'خالٍ من العجز والذمم ✅'}
            </span>
          </div>
        </div>

        {currentCycleWithdrawals.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-100 rounded-2xl text-[11px] text-slate-400 font-medium bg-slate-50/10">
            لا توجد أي مسحوبات شخصية أو سلفيات نقدية مسجلة في الدورة الصندوقية الحالية حتى الآن.
          </div>
        ) : (
          <div className="border border-slate-150/50 rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 text-center">تاريخ وساعة السحب</th>
                    <th className="p-3.5">المستلم / المسؤول</th>
                    <th className="p-3.5">السبب والبيان التوضيحي</th>
                    <th className="p-3.5">المبلغ المسحوب</th>
                    <th className="p-3.5 text-center">حالة السداد للدرج</th>
                    <th className="p-3.5 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/60">
                  {currentCycleWithdrawals.map((w, idx) => {
                    return (
                      <tr 
                        key={`cycle-withdrawal-${w.id ?? 'noid'}-${idx}`} 
                        className={`transition-all ${
                          w.is_repaid 
                            ? 'bg-slate-50/40 text-slate-500 hover:bg-slate-50' 
                            : 'bg-white hover:bg-rose-50/[0.04]'
                        }`}
                      >
                        <td className="p-3.5 text-center font-bold text-[10px] text-slate-500 whitespace-nowrap">
                          {formatDateTimeWithDay(w.created_at)}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                          {w.by_whom}
                        </td>
                        <td className="p-3.5 text-slate-650 max-w-[200px] break-words">
                          <div>
                            <p className="font-semibold text-slate-700">{w.reason}</p>
                            {w.is_repaid && w.repay_date && (
                              <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                ✓ تم الإرجاع: {formatDateTimeWithDay(w.repay_date)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-black text-indigo-600 font-mono text-[13px] whitespace-nowrap">
                          {formatPrice(w.amount)}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            w.is_repaid 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${w.is_repaid ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                            {w.is_repaid ? 'تم السداد والصحة' : 'مطلوب للتسديد فوراً'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleRepayWithdrawal(w.id!)}
                              className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                w.is_repaid 
                                  ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700' 
                                  : 'bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                              }`}
                              title={w.is_repaid ? "تأشير كغير مسدد" : "تأكيد سداد وإرجاع الكاش للصندوق"}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{w.is_repaid ? "تراجع" : "تأكيد إرجاع"}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteWithdrawal(w.id!)}
                              className="p-1.5 bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                              title="حذف المسحوبة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      )}

      {/* تصفية مبيعات المتجر ومطابقة الصندوق */}
      {(viewSection === 'all' || viewSection === 'settlement') && (
      <>
      <div className="bg-gradient-to-l from-violet-600 to-indigo-600 text-white rounded-3xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 animate-pulse text-violet-200" />
              <h3 className="text-lg font-bold">تسوية وتصفية مبيعات الصندوق</h3>
            </div>
            <p className="text-violet-100 text-xs">
              {lastSettleDate 
                ? `الدورة الحالية منذ: ${formatDateTimeWithDay(lastSettleDate)}` 
                : 'الدورة الأولى: لم يتم إجراء تصفية مبيعات سابقة بعد'}
            </p>
          </div>
          <Button 
            className="bg-white text-violet-700 hover:bg-violet-50 hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold py-2.5 px-4 shadow-sm w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer"
            onClick={() => {
              verifyAdminPermission('settlement', () => {
                setShowSettleModal(true);
              }, '⚖️ تصفية الصندوق وتسوية الوردية');
            }}
          >
            ⚖️ إجراء تصفية وتدوير لليوم الصندوقي
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/5 space-y-0.5">
            <p className="text-white/70 text-[10px] font-bold">المبيعات المتوقعة (كاش)</p>
            <p className="font-bold text-sm sm:text-base font-mono text-white">{formatPrice(currentCycleCashTotal)}</p>
            <span className="text-[9px] text-white/60 block font-mono leading-tight">نقدي: {formatPrice(currentCycleCashSales)} + تسديد: {formatPrice(currentCycleDebtPaymentsTotal)}</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
            <p className="text-white/70 text-[10px] font-bold">عجز مرحل من سابق</p>
            <p className="font-bold text-sm sm:text-base font-mono text-rose-200">{formatPrice(carriedForwardDeficit)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 border border-white/10 md:scale-[1.03] shadow-md ring-1 ring-white/20 bg-indigo-500/30 relative">
            <p className="text-yellow-250 text-[10px] font-extrabold text-cyan-205">🎯 المستهدف الكلي للتسوية</p>
            <p className="font-extrabold text-sm sm:text-base font-mono text-yellow-200">{formatPrice(activeOutstandingCash)}</p>
            {currentCycleSupplierPaymentsTotal > 0 && (
              <span className="text-[8px] text-white/50 block leading-tight font-bold">تتضمن خصم {formatPrice(currentCycleSupplierPaymentsTotal)}<br/>دفعات للموردين بالدورة</span>
            )}
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/5 col-span-2 sm:col-span-1">
            <p className="text-white/70 text-[10px] font-bold">كم باعت المنشأة بالآجل في هذه الدورة</p>
            <p className="font-bold text-sm sm:text-base font-mono text-amber-200">{formatPrice(currentCycleDebtTotal)}</p>
          </div>
        </div>

        {currentCycleUnpaidWithdrawalsTotal > 0 && (
          <div className="bg-black/15 border border-white/10 rounded-2xl p-3 text-[10px] sm:text-xs space-y-1 text-white">
            <div className="flex justify-between items-center font-bold">
              <span className="flex items-center gap-1">💸 مسحوبات معلقة السداد (سلف) بالدورة:</span>
              <span className="font-mono text-rose-300 font-extrabold">-{formatPrice(currentCycleUnpaidWithdrawalsTotal)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-1.5 font-black text-yellow-200">
              <span>السيولة النقدية المتوقع جردها بداخل الصندوق:</span>
              <span className="font-mono text-xs sm:text-sm">{formatPrice(Math.max(0, activeOutstandingCash - currentCycleUnpaidWithdrawalsTotal))}</span>
            </div>
          </div>
        )}
      </div>

      {/* سجل مطابقات الصندوق والتسويات السابقة */}
      {salesSettlements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 px-1">
            💼 سجل التسويات ومطابقات الصندوق السابقة ({salesSettlements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {salesSettlements.map((settlement, idx) => {
              const isDeficit = settlement.difference < 0;
              const isExcess = settlement.difference > 0;
              return (
                <Card key={`settlement-card-${settlement.id ?? 'noid'}-${idx}`} className="border border-slate-100 hover:border-violet-100 transition-all p-4 relative flex flex-col justify-between bg-white shadow-xs rounded-2xl">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          #{settlement.id} تسوية مبيعات
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                          {formatDateTimeWithDay(settlement.created_at)}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteSettlement(settlement.id!)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                        title="حذف سجل التصفية"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50/60 p-2 rounded-xl text-center border border-slate-100/50">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">المستهدف (كاش)</p>
                        <p className="text-xs font-bold font-mono text-slate-700">{formatPrice(settlement.total_sales)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">المسلم فعلياً</p>
                        <p className="text-xs font-bold font-mono text-slate-800">{formatPrice(settlement.delivered_amount)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold">حالة الصندوق</p>
                        <p className={`text-xs font-bold font-mono ${isDeficit ? 'text-red-650 font-semibold' : isExcess ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}`}>
                          {settlement.difference === 0 ? 'مطابق ✅' : formatPrice(settlement.difference)}
                        </p>
                      </div>
                    </div>

                    {settlement.cash_withdrawals !== undefined && settlement.cash_withdrawals > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200/50 text-amber-900 p-2.5 rounded-xl text-[10px] sm:text-xs font-bold flex justify-between items-center shrink-0">
                        <span className="opacity-90 font-black">💸 مسحوبات الصندوق (سلفيات مقيدة للتسديد):</span>
                        <span className="font-mono text-xs font-black">{formatPrice(settlement.cash_withdrawals)}</span>
                      </div>
                    )}

                    {settlement.notes && (
                      <div className="text-xs bg-slate-100/50 text-slate-600 p-2 rounded-xl border border-slate-200/20 italic">
                        📝 {settlement.notes}
                      </div>
                    )}

                    {isDeficit && (
                      <div className="bg-red-50/70 text-red-800 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-red-105/40">
                        <AlertCircle className="w-3.5 h-3.5 text-red-550" />
                        <span>عجز مالي متبقي بقيمة: {formatPrice(Math.abs(settlement.difference))}</span>
                      </div>
                    )}
                    {isExcess && (
                      <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-emerald-100/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>زيادة في الصندوق بقيمة: {formatPrice(settlement.difference)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      </>
      )}
    </motion.div>
  );
};

export default NotesView;
