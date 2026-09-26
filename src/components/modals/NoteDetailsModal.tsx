import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, AlertTriangle, Copy, Check, Edit2, Trash2, X, 
  Maximize2, Minimize2, CheckSquare, Square, Sparkles, Printer,
  Wallet, Home, BookOpen, ClipboardList, Pin, Clock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { db } from '../../db';

export interface NoteDetailsModalProps {
  selectedNote: any;
  setSelectedNote: (val: any) => void;
  formatDateWithDay: (dateStr: string) => string;
  handleCopyNoteContent: (content: string) => void;
  handleToggleNoteCompletion: (note: any) => void;
  handleEditNoteAction: (note: any) => void;
  handleDeleteNote: (id: number) => void;
  formatPrice?: (price: number) => string;
}

export const renderFormattedNoteText = (text: string) => {
  if (!text) return <span className="italic text-slate-400">لا توجد تفاصيل إضافية مكتوبة...</span>;
  const parts = text.split(/(\*\*[^*]+\*\*|📌\s*\[[^\]]+\]|----------------------------------------)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2);
      return <strong key={i} className="font-extrabold text-slate-950 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300/60 shadow-2xs my-0.5 inline-block">{inner}</strong>;
    }
    if (part.startsWith('📌') && part.includes('[') && part.endsWith(']')) {
      const inner = part.replace(/^📌\s*\[/, '').replace(/\]$/, '');
      return (
        <span key={i} className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-950 font-extrabold px-2 py-0.5 rounded-xl border border-amber-400/60 my-1 shadow-2xs">
          <span className="text-amber-600">📌</span>
          <span>{inner}</span>
        </span>
      );
    }
    if (part === '----------------------------------------') {
      return <hr key={i} className="my-2.5 border-amber-300/80" />;
    }
    return <span key={i}>{part}</span>;
  });
};

export const NoteDetailsModal: React.FC<NoteDetailsModalProps> = ({
  selectedNote,
  setSelectedNote,
  formatDateWithDay,
  handleCopyNoteContent,
  handleToggleNoteCompletion,
  handleEditNoteAction,
  handleDeleteNote,
  formatPrice = (p) => `${p} ريال`
}) => {
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!selectedNote) return null;

  const handleToggleCheckItem = async (itemId: string) => {
    if (!selectedNote.id || !Array.isArray(selectedNote.checklist)) return;
    const updatedList = selectedNote.checklist.map((item: any) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    try {
      await db.notes.update(selectedNote.id, { checklist: updatedList });
      setSelectedNote({ ...selectedNote, checklist: updatedList });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    handleCopyNoteContent(selectedNote.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintNote = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = selectedNote.title || 'ملاحظة يومية';
    const content = selectedNote.content || '';
    const date = formatDateWithDay(selectedNote.created_at);
    const total = selectedNote.calculated_total ? `الإجمالي المحسوب: ${selectedNote.calculated_total.toLocaleString('ar-SA')} ريال` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 25px; direction: rtl; text-align: right; color: #1e293b; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; }
          .date { font-size: 12px; color: #64748b; margin-top: 4px; }
          .content { font-size: 14px; white-space: pre-wrap; line-height: 1.8; color: #334155; }
          .total { margin-top: 20px; padding: 12px; background: #fef3c7; border: 1px solid #f59e0b; font-weight: bold; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="date">📅 تاريخ التدوين: ${date}</div>
        </div>
        <div class="content">${content}</div>
        ${total ? `<div class="total">${total}</div>` : ''}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const categoryLabels: Record<string, { label: string; badge: string }> = {
    cashier: { label: '🏦 وردية الصندوق', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    external_account: { label: '💼 حسابات خارجية', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
    living_expenses: { label: '🏠 مصاريف معيشة', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    personal_diary: { label: '📖 مذكرات وخواطر', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    todo: { label: '📋 قائمة مهام', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
  };

  const catInfo = categoryLabels[selectedNote.category || 'cashier'] || categoryLabels.cashier;

  return (
    <div className={`fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center ${
      isFullScreen ? 'p-0' : 'p-2 sm:p-4'
    }`}>
      <div 
        className={`bg-white text-right shadow-2xl flex flex-col overflow-hidden border-2 border-amber-400/90 shadow-amber-500/20 ring-1 ring-amber-300/50 ${
          isFullScreen 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-4xl h-[90vh] max-h-[850px] rounded-3xl'
        }`}
      >
        {/* COMPACT TOP TOOLBAR & HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-amber-500/40 p-3 sm:px-4 flex items-center justify-between gap-2 shrink-0">
          
          {/* Controls left */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullScreen ? 'تصغير' : 'ملء الشاشة'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setSelectedNote(null)} 
              className="p-1.5 hover:bg-rose-500/30 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Buttons in Top Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-colors"
              title="نسخ محتوى الملاحظة"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintNote}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="طباعة الملاحظة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedNote(null); handleEditNoteAction(selectedNote); }}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-xs border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-colors"
              title="تعديل الملاحظة"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleNoteCompletion(selectedNote)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 transition-colors cursor-pointer border ${
                selectedNote.is_completed
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{selectedNote.is_completed ? 'مكتملة ✓' : 'تأشير منجز'}</span>
            </button>
          </div>

          {/* Badges Right */}
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${catInfo.badge}`}>
              {catInfo.label}
            </span>
            {selectedNote.is_pinned && (
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40" title="مثبتة في الأعلى">
                <Pin className="w-3 h-3 fill-amber-400" />
              </span>
            )}
          </div>

        </div>

        {/* MAIN DISPLAY AREA (Golden Frame) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/70 no-scrollbar flex flex-col">
          
          {/* Note Title & Meta with Golden Border */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-amber-400/80 shadow-sm space-y-2">
            <h2 className={`text-base sm:text-xl font-black text-slate-800 leading-snug ${selectedNote.is_completed ? 'line-through text-slate-400' : ''}`}>
              {selectedNote.title || 'بدون عنوان'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-bold border-t border-amber-100 pt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                تاريخ الإنشاء: {formatDateWithDay(selectedNote.created_at)}
              </span>
              {selectedNote.reminder_date && (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <Clock className="w-3.5 h-3.5" />
                  تذكير: {formatDateWithDay(selectedNote.reminder_date)}
                </span>
              )}
            </div>
          </div>

          {/* Calculated Total Highlight (If any) */}
          {selectedNote.calculated_total > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-emerald-50 to-emerald-100/70 border-2 border-amber-400/80 rounded-2xl flex items-center justify-between shrink-0 shadow-sm">
              <span className="font-mono font-black text-base sm:text-lg text-emerald-950">
                {selectedNote.calculated_total.toLocaleString('ar-SA')} ريال
              </span>
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>الإجمالي المالي المقيد بالملاحظة:</span>
              </span>
            </div>
          )}

          {/* Full Note Text Canvas with Golden Border */}
          <div className="flex-1 min-h-[250px] bg-white p-4 sm:p-6 rounded-3xl border-2 border-amber-400/90 leading-relaxed text-slate-800 text-xs sm:text-sm md:text-base whitespace-pre-wrap break-words font-medium shadow-sm overflow-y-auto">
            {renderFormattedNoteText(selectedNote.content)}
          </div>

          {/* Checklist Items Interactive */}
          {Array.isArray(selectedNote.checklist) && selectedNote.checklist.length > 0 && (
            <div className="space-y-2 p-3.5 bg-white rounded-3xl border-2 border-amber-300/80 shadow-sm shrink-0">
              <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                <span className="text-[10px] text-slate-400 font-bold">
                  {selectedNote.checklist.filter((c: any) => c.done).length} من {selectedNote.checklist.length} منجز
                </span>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>قائمة بنود المهام والشطب (Checklist):</span>
                </h4>
              </div>

              <div className="space-y-1.5">
                {selectedNote.checklist.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCheckItem(item.id)}
                    className="p-2 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors select-none text-xs"
                  >
                    <span className="text-[10px] text-slate-400 font-bold">{item.done ? 'منجز ✓' : 'معلق'}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.text}
                      </span>
                      {item.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
