import React from 'react';
import { motion } from 'motion/react';
import { Calendar, AlertTriangle, Copy, Check, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface NoteDetailsModalProps {
  selectedNote: any;
  setSelectedNote: (val: any) => void;
  formatDateWithDay: (dateStr: string) => string;
  handleCopyNoteContent: (content: string) => void;
  handleToggleNoteCompletion: (note: any) => void;
  handleEditNoteAction: (note: any) => void;
  handleDeleteNote: (id: number) => void;
}

export const NoteDetailsModal: React.FC<NoteDetailsModalProps> = ({
  selectedNote,
  setSelectedNote,
  formatDateWithDay,
  handleCopyNoteContent,
  handleToggleNoteCompletion,
  handleEditNoteAction,
  handleDeleteNote,
}) => {
  if (!selectedNote) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 text-right shadow-xl"
      >
        {/* رأس المودال مع تفاصيل الحالة */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
              (selectedNote.priority || 'normal') === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
              (selectedNote.priority || 'normal') === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
              (selectedNote.priority || 'normal') === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
              'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {(selectedNote.priority || 'normal') === 'high' ? '🔴 عاجل وهام' :
               (selectedNote.priority || 'normal') === 'info' ? '🔵 حسابات وكاش' :
               (selectedNote.priority || 'normal') === 'warning' ? '🟡 نواقص بضاعة' :
               '🟢 ملاحظة عامة'}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
              selectedNote.is_completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {selectedNote.is_completed ? '✓ مكتملة' : '📝 معلقة'}
            </span>
          </div>
          <button onClick={() => setSelectedNote(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {/* المحتوى الفعلي للملاحظة */}
        <div className="space-y-3">
          <div>
            <h2 className={`text-base font-black text-slate-800 leading-snug ${selectedNote.is_completed ? 'line-through text-slate-400' : ''}`}>
              {selectedNote.title}
            </h2>
            <div className="flex flex-col gap-1 mt-2 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                تاريخ الإنشاء: {formatDateWithDay(selectedNote.created_at)}
              </span>
              {selectedNote.reminder_date && (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md w-fit">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  تذكير: {formatDateWithDay(selectedNote.reminder_date)}
                </span>
              )}
            </div>
          </div>

          {/* التفاصيل الكلية */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-150/50 leading-relaxed text-slate-700 text-xs whitespace-pre-wrap break-words max-h-[220px] overflow-y-auto custom-scrollbar font-bold">
            {selectedNote.content || <span className="italic text-slate-400">لا توجد تفاصيل إضافية مكتوبة...</span>}
          </div>
        </div>

        {/* أزرار الإجراءات والتحكم بالتفاصيل */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            onClick={() => handleCopyNoteContent(selectedNote.content)}
          >
            <Copy className="w-3.5 h-3.5" /> نسخ النص
          </Button>
          
          <Button 
            variant="outline" 
            className={`flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl ${
              selectedNote.is_completed 
                ? 'text-slate-600 border-slate-200 hover:bg-slate-50' 
                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
            onClick={() => handleToggleNoteCompletion(selectedNote)}
          >
            <Check className="w-3.5 h-3.5" /> 
            {selectedNote.is_completed ? 'تفعيل معلقة' : 'إكمال الملاحظة'}
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => { setSelectedNote(null); handleEditNoteAction(selectedNote); }}
          >
            <Edit2 className="w-3.5 h-3.5" /> تعديل
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-1 text-[11px] font-bold py-2 rounded-xl text-red-650 border-red-200 hover:bg-red-50"
            onClick={() => { handleDeleteNote(selectedNote.id!); }}
          >
            <Trash2 className="w-3.5 h-3.5" /> حذف
          </Button>
        </div>
        
        <Button className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl text-xs font-black shadow-md" onClick={() => setSelectedNote(null)}>
          إغلاق التفاصيل
        </Button>
      </motion.div>
    </div>
  );
};
