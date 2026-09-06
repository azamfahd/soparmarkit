import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface AddNoteModalProps {
  showAddNote: boolean;
  setShowAddNote: (val: boolean) => void;
  editingNoteId: number | null;
  setEditingNoteId: (val: number | null) => void;
  notes: any[];
  handleAddNote: (note: any, resetForm: () => void) => void;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  showAddNote,
  setShowAddNote,
  editingNoteId,
  setEditingNoteId,
  notes,
  handleAddNote,
}) => {

  const [newNote, setNewNote] = useState({ title: '', content: '', reminder_date: '', priority: 'normal' as 'normal' | 'high' | 'info' | 'warning' });

  useEffect(() => {
    if (editingNoteId && notes) {
      const note = notes.find((n: any) => n.id === editingNoteId);
      if (note) {
        setNewNote({
          title: note.title,
          content: note.content,
          reminder_date: note.reminder_date || '',
          priority: note.priority || 'normal',
        });
      }
    } else {
      setNewNote({ title: '', content: '', reminder_date: '', priority: 'normal' });
    }
  }, [editingNoteId, notes]);

  const handleSave = () => {
    handleAddNote(newNote, () => {
      setNewNote({ title: '', content: '', reminder_date: '', priority: 'normal' });
    });
  };

  if (!showAddNote) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
      >
        <div className="flex justify-between items-center mb-2 text-right">
          <h3 className="font-extrabold text-lg text-slate-800">{editingNoteId ? '✏️ تعديل الملاحظة اليومية' : '📝 إضافة ملاحظة جديدة'}</h3>
          <button onClick={() => { setShowAddNote(false); setEditingNoteId(null); setNewNote({ title: '', content: '', reminder_date: '', priority: 'normal' }); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="space-y-4 text-right">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">نوع وأولوية الملاحظة</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'normal', label: '🟢 ملاحظة عامة', color: 'border-slate-200 text-slate-700 bg-slate-50/50', activeColor: 'ring-2 ring-emerald-500 bg-emerald-50/30 border-emerald-300' },
                { key: 'high', label: '🔴 عاجل وهام', color: 'border-red-200 text-red-700 bg-red-50/30', activeColor: 'ring-2 ring-red-500 bg-red-50 border-red-300' },
                { key: 'info', label: '🔵 حسابات وكاش', color: 'border-blue-200 text-blue-700 bg-blue-50/30', activeColor: 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' },
                { key: 'warning', label: '🟡 نواقص بضاعة', color: 'border-amber-200 text-amber-700 bg-amber-50/30', activeColor: 'ring-2 ring-amber-500 bg-amber-50 border-amber-300' }
              ].map((item, idx) => {
                const isSelected = newNote.priority === item.key;
                return (
                  <button
                    key={`add-note-prio-${item.key}-${idx}`}
                    type="button"
                    onClick={() => setNewNote({ ...newNote, priority: item.key as any })}
                    className={`p-2.5 rounded-xl border text-xs font-black text-center transition-all cursor-pointer ${
                      isSelected ? item.activeColor : `${item.color} opacity-75 border-dashed hover:opacity-100`
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">عنوان الملاحظة</label>
            <input type="text" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs font-bold outline-none" placeholder="مثال: تسليم الوردية، سداد فاتورة كهرباء" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">تفاصيل الملاحظة والبيان</label>
            <textarea value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs font-medium outline-none min-h-[110px]" placeholder="اكتب المبالغ، الأسماء، التنبيهات أو التفاصيل..."></textarea>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">تاريخ التذكير (اختياري)</label>
            <input type="date" value={newNote.reminder_date} onChange={e => setNewNote({...newNote, reminder_date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs font-bold outline-none" />
          </div>
          <Button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md mt-2" onClick={handleSave}>
            {editingNoteId ? '💾 حفظ التعديلات' : '💾 حفظ الملاحظة بالصندوق'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
