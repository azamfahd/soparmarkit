import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { 
  X, Maximize2, Minimize2, Calculator, Sparkles, Plus, Trash2, 
  CheckSquare, Square, Palette, FileText, BookOpen, Wallet, 
  Home, ClipboardList, Bold, Italic, List, Hash, Calendar, 
  Check, ArrowRight, CornerDownLeft, Divide, Percent, DollarSign,
  Info, Pin, ChevronDown, Clock, AlertCircle, Bookmark, Layers,
  Copy, RotateCcw, Save
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { NoteChecklistItem } from '../../db';

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
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcMode, setCalcMode] = useState<'accounting' | 'scientific'>('accounting');
  const [showChecklistSection, setShowChecklistSection] = useState(false);
  const [calcCopied, setCalcCopied] = useState(false);
  const [isBoldActive, setIsBoldActive] = useState(false);

  // Note State
  const [noteState, setNoteState] = useState<{
    title: string;
    content: string;
    reminder_date: string;
    priority: 'normal' | 'high' | 'info' | 'warning';
    category: 'cashier' | 'external_account' | 'living_expenses' | 'personal_diary' | 'todo';
    color_tag: string;
    calculated_total: number;
    checklist: NoteChecklistItem[];
    is_pinned: boolean;
  }>({
    title: '',
    content: '',
    reminder_date: '',
    priority: 'normal',
    category: 'cashier',
    color_tag: 'emerald',
    calculated_total: 0,
    checklist: [],
    is_pinned: false
  });

  const [newChecklistText, setNewChecklistText] = useState('');
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const templatesDropdownRef = useRef<HTMLDivElement>(null);

  // Advanced Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcEquation, setCalcEquation] = useState('');
  const [calcMemory, setCalcMemory] = useState(0);
  const [isNewNumber, setIsNewNumber] = useState(false);

  useEffect(() => {
    if (editingNoteId && notes) {
      const note = notes.find((n: any) => n.id === editingNoteId);
      if (note) {
        setNoteState({
          title: note.title || '',
          content: note.content || '',
          reminder_date: note.reminder_date || '',
          priority: note.priority || 'normal',
          category: note.category || 'cashier',
          color_tag: note.color_tag || 'emerald',
          calculated_total: note.calculated_total || 0,
          checklist: Array.isArray(note.checklist) ? note.checklist : [],
          is_pinned: Boolean(note.is_pinned)
        });
        if (Array.isArray(note.checklist) && note.checklist.length > 0) {
          setShowChecklistSection(true);
        }
      }
    } else {
      setNoteState({
        title: '',
        content: '',
        reminder_date: '',
        priority: 'normal',
        category: 'cashier',
        color_tag: 'emerald',
        calculated_total: 0,
        checklist: [],
        is_pinned: false
      });
      setIsFullScreen(true);
      setShowCalculator(false);
      setShowChecklistSection(false);
    }
  }, [editingNoteId, notes, showAddNote]);

  // --- Advanced Calculator Logic Powered by Mathjs ---
  const handleCalcNumber = (num: string) => {
    if (isNewNumber) {
      if (calcEquation.endsWith('=')) {
        setCalcEquation('');
      }
      setCalcDisplay(num);
      setIsNewNumber(false);
    } else {
      setCalcDisplay(prev => prev === '0' || prev === 'Error' ? num : prev + num);
    }
  };

  const handleCalcDecimal = () => {
    if (isNewNumber) {
      if (calcEquation.endsWith('=')) {
        setCalcEquation('');
      }
      setCalcDisplay('0.');
      setIsNewNumber(false);
    } else if (!calcDisplay.includes('.')) {
      setCalcDisplay(prev => prev + '.');
    }
  };

  const handleCalcOp = (op: string) => {
    if (calcEquation.endsWith('=')) {
      setCalcEquation(calcDisplay + ' ' + op + ' ');
    } else {
      setCalcEquation(prev => prev + calcDisplay + ' ' + op + ' ');
    }
    setIsNewNumber(true);
  };

  const handleCalcEquals = () => {
    try {
      let rawExpr = calcEquation.endsWith('=') ? calcDisplay : (calcEquation + (isNewNumber ? '' : calcDisplay)).trim();
      if (!rawExpr) rawExpr = calcDisplay;

      // Automatically close unclosed parentheses before evaluating
      const openCount = (rawExpr.match(/\(/g) || []).length;
      const closeCount = (rawExpr.match(/\)/g) || []).length;
      if (openCount > closeCount) {
        rawExpr += ')'.repeat(openCount - closeCount);
      }

      let fullExpr = rawExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/–/g, '-');

      const result = math.evaluate(fullExpr);
      if (typeof result === 'number') {
        const rounded = Math.round(result * 100000) / 100000;
        setCalcDisplay(String(rounded));
        setCalcEquation(`${rawExpr} =`);
      } else if (result !== undefined && result !== null) {
        setCalcDisplay(result.toString());
        setCalcEquation(`${rawExpr} =`);
      } else {
        setCalcDisplay('0');
        setCalcEquation('');
      }
      setIsNewNumber(true);
    } catch {
      setCalcDisplay('Error');
    }
  };

  const handleCalcOpenParen = () => {
    if (calcEquation.endsWith('=')) {
      setCalcEquation('(');
      setCalcDisplay('0');
    } else if (!isNewNumber && calcDisplay !== '0' && calcDisplay !== 'Error') {
      setCalcEquation(prev => prev + calcDisplay + ' × (');
      setCalcDisplay('0');
    } else {
      setCalcEquation(prev => prev + '(');
    }
    setIsNewNumber(true);
  };

  const handleCalcCloseParen = () => {
    if (calcEquation.endsWith('=')) return;
    const currentVal = (!isNewNumber && calcDisplay !== '0' && calcDisplay !== 'Error') ? calcDisplay : '';
    setCalcEquation(prev => prev + currentVal + ') ');
    setIsNewNumber(true);
  };

  // Fraction converter & divider (بسط ومقام a/b)
  const handleCalcToFraction = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num !== 0) {
        const frac: any = math.fraction(num);
        if (Number(frac.d) !== 1) {
          const sign = frac.s < 0 ? '-' : '';
          const fracStr = `${sign}${frac.n}/${frac.d}`;
          setCalcDisplay(fracStr);
          setCalcEquation(`${num} = ${fracStr}`);
        } else {
          handleCalcOp('÷');
        }
        setIsNewNumber(true);
      } else {
        handleCalcOp('÷');
      }
    } catch {
      handleCalcOp('÷');
    }
  };

  // Live Equation / Expression display for real-time visual feedback
  const getLiveEquationDisplay = () => {
    if (calcEquation.endsWith('=')) {
      return calcEquation;
    }
    if (calcEquation) {
      if (!isNewNumber && calcDisplay !== '0' && calcDisplay !== 'Error') {
        return `${calcEquation}${calcDisplay}`;
      }
      return calcEquation;
    }
    if (calcDisplay !== '0' && calcDisplay !== 'Error') {
      return calcDisplay;
    }
    return 'جاهزة';
  };

  const handleCalcClearEntry = () => {
    setCalcDisplay('0');
  };

  const handleCalcAllClear = () => {
    setCalcDisplay('0');
    setCalcEquation('');
  };

  const handleCalcBackspace = () => {
    setCalcDisplay(prev => (prev.length > 1 && prev !== 'Error') ? prev.slice(0, -1) : '0');
  };

  const handleCalcToggleSign = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      setCalcDisplay(String(-num));
    }
  };

  const handleCalcPercentage = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      setCalcDisplay(String(num / 100));
    }
  };

  // Accounting Specific: VAT +15%
  const handleCalcAddTax15 = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      const withTax = Math.round(num * 1.15 * 100) / 100;
      setCalcEquation(`${num} + 15% ض.ق.م = `);
      setCalcDisplay(String(withTax));
      setIsNewNumber(true);
    }
  };

  // Accounting Specific: Remove VAT -15%
  const handleCalcRemoveTax15 = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      const base = Math.round((num / 1.15) * 100) / 100;
      setCalcEquation(`${num} - 15% ض.ق.م = `);
      setCalcDisplay(String(base));
      setIsNewNumber(true);
    }
  };

  // Accounting Specific: Tax portion only
  const handleCalcTaxOnly15 = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) {
      const taxAmount = Math.round(num * 0.15 * 100) / 100;
      setCalcEquation(`ضريبة 15% من ${num} = `);
      setCalcDisplay(String(taxAmount));
      setIsNewNumber(true);
    }
  };

  // --- Scientific Specific Functions using MathJS ---
  // Square Root √x
  const handleCalcSqrt = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num >= 0) {
        const res = math.sqrt(num);
        const val = typeof res === 'number' ? Math.round(res * 100000) / 100000 : res.toString();
        setCalcEquation(`√(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      } else {
        setCalcDisplay('Error');
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Cube Root ∛x
  const handleCalcCbrt = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.cbrt(num);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`∛(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Power (x ^ y)
  const handleCalcPowerY = () => {
    setCalcEquation(prev => prev + calcDisplay + ' ^ ');
    setIsNewNumber(true);
  };

  // Square (x²)
  const handleCalcSquare = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.pow(num, 2);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`sqr(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Cube (x³)
  const handleCalcCube = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.pow(num, 3);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`cube(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // 10^x
  const handleCalcExp10 = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.pow(10, num);
        setCalcEquation(`10^(${num}) = `);
        setCalcDisplay(String(res));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // e^x
  const handleCalcExpE = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.exp(num);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`e^(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Natural Logarithm ln(x)
  const handleCalcLn = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num > 0) {
        const res = math.log(num);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`ln(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      } else {
        setCalcDisplay('Error');
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Base 10 Logarithm log10(x)
  const handleCalcLog10 = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num > 0) {
        const res = math.log10(num);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`log10(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      } else {
        setCalcDisplay('Error');
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Trigonometry: sin, cos, tan
  const handleCalcSin = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.sin(num);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`sin(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  const handleCalcCos = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.cos(num);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`cos(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  const handleCalcTan = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.tan(num);
        const val = Math.round(Number(res) * 100000) / 100000;
        setCalcEquation(`tan(${num}) = `);
        setCalcDisplay(String(val));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Factorial n!
  const handleCalcFactorial = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num) && num >= 0 && Number.isInteger(num) && num <= 100) {
        const res = math.factorial(num);
        setCalcEquation(`fact(${num}) = `);
        setCalcDisplay(String(res));
        setIsNewNumber(true);
      } else {
        setCalcDisplay('Error');
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Absolute value |x|
  const handleCalcAbs = () => {
    try {
      const num = Number(calcDisplay);
      if (!isNaN(num)) {
        const res = math.abs(num);
        setCalcEquation(`abs(${num}) = `);
        setCalcDisplay(String(res));
        setIsNewNumber(true);
      }
    } catch {
      setCalcDisplay('Error');
    }
  };

  // Reciprocal 1/x
  const handleCalcReciprocal = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num) && num !== 0) {
      const res = Math.round((1 / num) * 100000) / 100000;
      setCalcEquation(`1/(${num}) = `);
      setCalcDisplay(String(res));
      setIsNewNumber(true);
    }
  };

  // Memory functions
  const handleCalcMemoryClear = () => setCalcMemory(0);
  const handleCalcMemoryRecall = () => {
    setCalcDisplay(String(calcMemory));
    setIsNewNumber(true);
  };
  const handleCalcMemoryAdd = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) setCalcMemory(prev => prev + num);
  };
  const handleCalcMemorySub = () => {
    const num = Number(calcDisplay);
    if (!isNaN(num)) setCalcMemory(prev => prev - num);
  };

  // Insert calculator result directly into note text
  const handleInsertCalcResult = () => {
    const formatted = `${calcDisplay} ريال`;
    setNoteState(prev => ({
      ...prev,
      content: prev.content ? `${prev.content} ${formatted}` : formatted
    }));
  };

  const handleCopyCalcResult = () => {
    navigator.clipboard.writeText(calcDisplay);
    setCalcCopied(true);
    setTimeout(() => setCalcCopied(false), 2000);
  };

  // Auto Sum Numbers inside the text
  const handleAutoSumContentNumbers = () => {
    const matches = noteState.content.match(/\d+(?:\.\d+)?/g);
    if (matches && matches.length > 0) {
      const total = matches.reduce((acc, curr) => acc + parseFloat(curr), 0);
      const rounded = Math.round(total * 100) / 100;
      setNoteState(prev => ({
        ...prev,
        calculated_total: rounded,
        content: prev.content.includes('الإجمالي المحسوب:')
          ? prev.content
          : `${prev.content}\n\nالإجمالي المحسوب: ${rounded.toLocaleString('ar-SA')} ريال`
      }));
    }
  };

  // Format Helper for Textarea - Smart Cursor & Formatting
  const handleApplyFormatting = (type: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteState.content.substring(start, end);
    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        if (selectedText) {
          replacement = `**${selectedText}**`;
          cursorOffset = replacement.length;
        } else {
          replacement = '****';
          cursorOffset = 2; // Position cursor inside **|**
        }
        break;

      case 'list':
        if (selectedText) {
          replacement = `\n• ${selectedText}`;
          cursorOffset = replacement.length;
        } else {
          replacement = '\n• ';
          cursorOffset = replacement.length;
        }
        break;

      case 'divider':
        replacement = '\n----------------------------------------\n';
        cursorOffset = replacement.length;
        break;

      case 'highlight':
        if (selectedText) {
          replacement = `📌 [${selectedText}]`;
          cursorOffset = replacement.length;
        } else {
          replacement = '📌 []';
          cursorOffset = 4; // Position cursor inside 📌 [|]
        }
        break;

      default:
        return;
    }

    const newContent = noteState.content.substring(0, start) + replacement + noteState.content.substring(end);
    setNoteState(prev => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  // High-Quality Professional Template Loader
  const handleApplyTemplate = (type: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-SA');
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    let tTitle = '';
    let tContent = '';
    let tCategory: typeof noteState.category = 'cashier';
    let tChecklist: NoteChecklistItem[] = [];

    switch (type) {
      case 'cashier_shift':
        tTitle = `تسليم وردية الصندوق - ${dateStr}`;
        tContent = `🏦 تقرير تسليم وردية الصندوق اليومي:\n----------------------------------------\n📅 التاريخ والوقت: ${dateStr} - ${timeStr}\n💵 العهدة الافتتاحية بالدرج: 0.00 ريال\n💰 إجمالي المبيعات النقدية: 0.00 ريال\n💳 مبيعات الشبكة / التحويلات: 0.00 ريال\n📉 المصروفات النثرية والمسحوبات: 0.00 ريال\n\n📌 ملخص الصندوق والنقدية:\n• النقدية الفعلية المسلمة: 0.00 ريال\n• فارق الوردية (عجز / زيادة): 0.00 ريال\n\n📝 ملاحظات موظف الصندوق:\n`;
        tCategory = 'cashier';
        tChecklist = [
          { id: '1', text: 'مطابقة تقرير الشبكة (POS) مع البنك', done: false },
          { id: '2', text: 'عد النقدية وتجنيب عهدة الوردية القادمة', done: false },
          { id: '3', text: 'تجهيز المبلغ للإيداع وتوقيع المستلم', done: false },
        ];
        break;

      case 'external_deal':
        tTitle = `حساب ومعاملة خارجية - ${dateStr}`;
        tContent = `💼 بيان معاملة وحساب خارجي:\n----------------------------------------\n👤 اسم العميل / الجهة: \n📞 رقم الجوال / المرجع: \n📅 موعد الاستحقاق والسداد: \n\n📊 التفاصيل المالية:\n• إجمالي المبلغ المتفق عليه: 0.00 ريال\n• الدفعة الأولى المقبوضة: 0.00 ريال\n• المتبقي المترتب بالحساب: 0.00 ريال\n\n📄 بنود وشروط الاتفاقية:\n• \n`;
        tCategory = 'external_account';
        tChecklist = [
          { id: '1', text: 'توقيع وتوثيق عقد المعاملة', done: false },
          { id: '2', text: 'تحصيل الدفعة المقدمة وإصدار سند', done: false },
          { id: '3', text: 'جدولة باقى المستحقات والمتابعة', done: false },
        ];
        break;

      case 'living_expenses':
        tTitle = `جدول المصاريف والنفقات المعيشية - ${dateStr}`;
        tContent = `🏠 ميزانية ونفقات المعيشة:\n----------------------------------------\n📌 جدول المصروفات الرئيسية:\n• إيجار / فواتير الخدمة (كهرباء/ماء): 0.00 ريال\n• مشتريات السوبرماركت والمنزل: 0.00 ريال\n• الوقود، الصيانة والنقل: 0.00 ريال\n• مصاريف شخصية ومتفرقة: 0.00 ريال\n\n💡 ملاحظات ترشيد الميزانية:\n`;
        tCategory = 'living_expenses';
        tChecklist = [
          { id: '1', text: 'سداد الفواتير الحكومية والشهرية', done: false },
          { id: '2', text: 'تأمين احتياجات المطبخ والمنزل', done: false },
          { id: '3', text: 'رصد المتبقي في الادخار', done: false },
        ];
        break;

      case 'diary_idea':
        tTitle = `مذكرات وخواطر يومية - ${dateStr}`;
        tContent = `📖 تدوين خواطر وأفكار يومية:\n----------------------------------------\n⏰ الوقت: ${timeStr}\n🌟 فكرة / إنجاز اليوم:\n\n💬 الخاطرة أو التدوين الحر:\n\n🎯 دروس وتوصيات للغد:\n`;
        tCategory = 'personal_diary';
        break;

      case 'todo_list':
        tTitle = `قائمة المهام والمتابعات اليومية - ${dateStr}`;
        tContent = `📋 قائمة متابعة الأعمال والمهام:\n----------------------------------------\n🎯 أهداف اليوم الأساسية:\n• \n\n📌 المتابعات الهامة:\n• \n`;
        tCategory = 'todo';
        tChecklist = [
          { id: '1', text: 'مراجعة الحسابات والتسويات اليومية', done: false },
          { id: '2', text: 'التواصل مع الموردين ومتابعة الطلبات', done: false },
          { id: '3', text: 'أخذ نسخة احتياطية وآمنة للبيانات', done: false },
        ];
        break;

      default:
        return;
    }

    setNoteState(prev => ({
      ...prev,
      title: tTitle,
      content: tContent,
      category: tCategory,
      checklist: tChecklist.length > 0 ? tChecklist : prev.checklist
    }));
    if (tChecklist.length > 0) setShowChecklistSection(true);
  };

  // Checklist Actions
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistText.trim(),
      done: false
    };
    setNoteState(prev => ({ ...prev, checklist: [...prev.checklist, newItem] }));
    setNewChecklistText('');
  };

  const handleToggleCheckItem = (id: string) => {
    setNoteState(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === id ? { ...item, done: !item.done } : item)
    }));
  };

  const handleRemoveCheckItem = (id: string) => {
    setNoteState(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  const handleSave = () => {
    if (!noteState.title.trim() && !noteState.content.trim()) return;

    // Recalculate numbers if total is 0
    let finalTotal = noteState.calculated_total;
    if (finalTotal === 0) {
      const matches = noteState.content.match(/\d+(?:\.\d+)?/g);
      if (matches && matches.length > 0) {
        finalTotal = Math.round(matches.reduce((acc, curr) => acc + parseFloat(curr), 0) * 100) / 100;
      }
    }

    const noteData = {
      title: noteState.title.trim() || 'ملاحظة بدون عنوان',
      content: noteState.content.trim(),
      reminder_date: noteState.reminder_date || null,
      priority: noteState.priority,
      category: noteState.category,
      color_tag: noteState.color_tag,
      calculated_total: finalTotal,
      checklist: noteState.checklist,
      is_pinned: noteState.is_pinned,
      is_completed: false
    };

    handleAddNote(noteData, () => {
      setShowAddNote(false);
      setEditingNoteId(null);
      setNoteState({
        title: '',
        content: '',
        reminder_date: '',
        priority: 'normal',
        category: 'cashier',
        color_tag: 'emerald',
        calculated_total: 0,
        checklist: [],
        is_pinned: false
      });
      setShowCalculator(false);
      setShowChecklistSection(false);
    });
  };

  if (!showAddNote) return null;

  // Category Configuration
  const categoriesList = [
    { key: 'cashier', label: '🏦 وردية الصندوق', color: 'emerald' },
    { key: 'external_account', label: '💼 حسابات خارجية', color: 'sky' },
    { key: 'living_expenses', label: '🏠 مصاريف معيشة', color: 'purple' },
    { key: 'personal_diary', label: '📖 مذكرات وخواطر', color: 'amber' },
    { key: 'todo', label: '📋 قائمة مهام', color: 'rose' }
  ];

  // Color themes
  const colorPalette = [
    { id: 'emerald', bg: 'bg-emerald-500', name: 'زمردي' },
    { id: 'sky', bg: 'bg-sky-500', name: 'سماوي' },
    { id: 'purple', bg: 'bg-purple-500', name: 'بنفسجي' },
    { id: 'amber', bg: 'bg-amber-500', name: 'عنبري' },
    { id: 'rose', bg: 'bg-rose-500', name: 'وردي' },
    { id: 'slate', bg: 'bg-slate-700', name: 'كلاسيكي' },
  ];

  return (
    <div className={`fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center ${
      isFullScreen ? 'p-0' : 'p-2 sm:p-4'
    }`}>
      {/* Outer Modal Container with Gorgeous Gold Trim */}
      <div 
        className={`bg-white text-right shadow-2xl flex flex-col overflow-hidden border-2 border-amber-400/90 shadow-amber-500/20 ring-1 ring-amber-300/50 relative ${
          isFullScreen 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-5xl h-[94vh] max-h-[950px] rounded-3xl'
        }`}
      >
        {/* TOP COMPACT HEADER & UNIFIED TOOLBAR */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-amber-500/40 shrink-0 select-none">
          
          {/* Main Line */}
          <div className="px-3 py-2 sm:px-4 flex items-center justify-between gap-2">
            
            {/* Window Controls & Quick Save (Left in RTL) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isFullScreen ? 'تصغير' : 'ملء الشاشة'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                type="button"
                onClick={() => { setShowAddNote(false); setEditingNoteId(null); }} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500/30 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Fast Direct Save Button in Header (Always Available Anytime!) */}
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0 ml-1"
                title="حفظ الملاحظة فوراً"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{editingNoteId ? 'حفظ التعديل' : 'حفظ'}</span>
              </button>
            </div>

            {/* Middle: Integrated Compact Tools Strip (Distinct Golden Capsule Scrollbar Track) */}
            <div className="bg-slate-900/95 border border-amber-400/40 px-2 py-0.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner shadow-slate-950/80 backdrop-blur-xs">
              
              {/* Category Dropdown */}
              <select
                value={noteState.category}
                onChange={e => {
                  const cat = categoriesList.find(c => c.key === e.target.value);
                  setNoteState(prev => ({ 
                    ...prev, 
                    category: e.target.value as any,
                    color_tag: cat ? cat.color : prev.color_tag 
                  }));
                }}
                className="h-7 bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/40 rounded-xl px-2.5 py-0.5 text-[11px] font-black outline-none cursor-pointer shrink-0 transition-colors"
              >
                {categoriesList.map(c => (
                  <option key={c.key} value={c.key} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Calculator Toggle Button */}
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  showCalculator
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                }`}
                title="فتح / إغلاق الآلة الحاسبة"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-300" />
                <span>آلة حاسبة</span>
              </button>

              {/* Pin Note Button */}
              <button
                type="button"
                onClick={() => setNoteState(prev => ({ ...prev, is_pinned: !prev.is_pinned }))}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  noteState.is_pinned 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                    : 'bg-slate-800 text-slate-300 hover:text-slate-100 border-slate-700'
                }`}
                title={noteState.is_pinned ? 'مثبتة في الأعلى' : 'تثبيت الملاحظة'}
              >
                <Pin className={`w-3.5 h-3.5 ${noteState.is_pinned ? 'fill-amber-400 rotate-45 text-amber-300' : ''}`} />
                <span>{noteState.is_pinned ? 'مثبتة' : 'تثبيت'}</span>
              </button>

              {/* Checklist Toggle */}
              <button
                type="button"
                onClick={() => setShowChecklistSection(!showChecklistSection)}
                className={`h-7 px-2.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer border shrink-0 ${
                  showChecklistSection || noteState.checklist.length > 0
                    ? 'bg-indigo-900/60 text-indigo-300 border-indigo-700'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
                title="قائمة مهام Checklist"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>مهام</span>
                {noteState.checklist.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[9px] font-black">
                    {noteState.checklist.length}
                  </span>
                )}
              </button>

              {/* FIXED TOP CALCULATED TOTAL PILL */}
              {noteState.calculated_total > 0 && (
                <div className="h-7 px-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-[11px] font-mono font-black flex items-center gap-1 shrink-0 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{noteState.calculated_total.toLocaleString('ar-SA')} ريال</span>
                </div>
              )}

            </div>

            {/* Right: Note Status */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-black text-amber-300 hidden md:inline">
                {editingNoteId ? '✏️ تعديل' : '📝 تدوين وملاحظات'}
              </span>
              <div className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/40"></div>
            </div>

          </div>

          {/* Sub Toolbar */}
          <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              {/* Enhanced Bold B Button */}
              <button
                type="button"
                onClick={() => {
                  setIsBoldActive(!isBoldActive);
                  handleApplyFormatting('bold');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isBoldActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                }`}
                title="تنسيق خط عريض واضح (**نص**)"
              >
                <Bold className="w-3.5 h-3.5" />
                <span className="font-black text-xs">خط عريض B</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyFormatting('list')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black border border-slate-700 cursor-pointer"
                title="إدراج نقطة تعداد"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleApplyFormatting('divider')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black border border-slate-700 cursor-pointer"
                title="إدراج فاصل خطي"
              >
                <Divide className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleApplyFormatting('highlight')}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-black border border-amber-500/30 cursor-pointer"
                title="إدراج شارة تنبيه"
              >
                🟡 تنبيه
              </button>

              {/* Character Counter directly next to Alert button */}
              <div 
                className="px-2 py-1 rounded-lg bg-slate-800 text-amber-300 text-[11px] font-black border border-slate-700 flex items-center gap-1 select-none"
                title="عدد الأحرف المكتوبة"
              >
                <span>{noteState.content.length}</span>
                <span>حرف</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={noteState.priority}
                onChange={e => setNoteState(prev => ({ ...prev, priority: e.target.value as any }))}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] font-bold outline-none cursor-pointer"
              >
                <option value="normal">🟢 عادية</option>
                <option value="high">🔴 عاجلة</option>
                <option value="info">🔵 حسابات</option>
                <option value="warning">🟡 تنبيه</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-1 rounded-lg border border-slate-700">
                {colorPalette.map(color => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setNoteState(prev => ({ ...prev, color_tag: color.id }))}
                    className={`w-3.5 h-3.5 rounded-full ${color.bg} transition-transform cursor-pointer ${
                      noteState.color_tag === color.id ? 'ring-2 ring-amber-400 scale-125' : 'opacity-60 hover:opacity-100'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                <input
                  type="date"
                  value={noteState.reminder_date}
                  onChange={e => setNoteState(prev => ({ ...prev, reminder_date: e.target.value }))}
                  className="bg-transparent text-slate-200 text-[10px] font-bold outline-none cursor-pointer"
                  title="تاريخ التذكير"
                />
              </div>
            </div>
          </div>
        </div>

        {/* VERTICAL SPLIT-VIEW: TOP (COMPACT SLIM CALCULATOR) & BOTTOM (FIXED-SIZE GOLDEN WRITING CANVAS) */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-100/80 p-3 sm:p-5 overflow-y-auto no-scrollbar relative space-y-3.5">
          
          {/* TOP SECTION: DOCKED COMPACT CALCULATOR (Scientific Digital Screen & Formula) */}
          {showCalculator && (
            <div className="bg-slate-900 border-2 border-amber-400/80 rounded-2xl shrink-0 select-none overflow-hidden shadow-md my-1 p-1.5 sm:p-2.5 space-y-1">
              <div className="space-y-1">
                
                {/* Scientific LCD Display & Control Bar */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 bg-slate-950 p-1 px-2.5 rounded-xl border border-slate-800">
                  
                  {/* Left: Compact Mode Tabs, Copy & Insert Buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCalcMode('accounting')}
                        className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 ${
                          calcMode === 'accounting' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        💼 <span>محاسبية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcMode('scientific')}
                        className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 ${
                          calcMode === 'scientific' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🔬 <span>علمية</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCalcResult}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="نسخ الناتج إلى الحافظة"
                    >
                      {calcCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{calcCopied ? 'تم' : 'نسخ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInsertCalcResult}
                      className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] sm:text-[11px] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                      title="إدراج الناتج في الملاحظة مباشرة"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إدراج ✍️</span>
                    </button>
                  </div>

                  {/* Right: Gorgeous Glowing Scientific LCD Screen */}
                  <div className="w-full sm:w-64 text-right px-3 py-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl border-2 border-emerald-500/40 shadow-inner shadow-emerald-950/50 select-none">
                    <div className="flex items-center justify-between text-[10px] text-amber-300/90 font-mono leading-none pb-0.5 mb-0.5 border-b border-slate-800/80">
                      <span className="text-[9px] text-amber-400 font-bold">{calcMemory !== 0 ? `[M = ${calcMemory.toLocaleString('ar-SA')}]` : ''}</span>
                      <span className="truncate max-w-[180px] dir-ltr text-left font-mono font-bold tracking-wider text-amber-300 drop-shadow-xs">
                        {getLiveEquationDisplay()}
                      </span>
                    </div>
                    <div className="font-mono text-base sm:text-lg font-black text-emerald-400 dir-ltr text-right tracking-tight truncate leading-tight drop-shadow-[0_0_6px_rgba(52,211,153,0.35)]">
                      {calcDisplay}
                    </div>
                  </div>

                </div>

                {/* Keypad Row: Functions on Right + 4-Col Standard Numpad on Left (LTR) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 items-center">
                  
                  {/* Functions, Memory & Specialized Modes (col-span-7) */}
                  <div className="md:col-span-7 space-y-0.5">
                    {/* Memory & Clear strip */}
                    <div className="grid grid-cols-8 gap-0.5 text-center text-[9px] sm:text-[10px] font-bold">
                      <button type="button" onClick={handleCalcMemoryClear} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer" title="مسح الذاكرة">MC</button>
                      <button type="button" onClick={handleCalcMemoryRecall} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer" title="استرجاع الذاكرة">MR</button>
                      <button type="button" onClick={handleCalcMemoryAdd} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer" title="إضافة للذاكرة">M+</button>
                      <button type="button" onClick={handleCalcMemorySub} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer" title="طرح من الذاكرة">M-</button>
                      <button type="button" onClick={handleCalcAllClear} className="py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-black transition-colors cursor-pointer" title="مسح شامل">AC</button>
                      <button type="button" onClick={handleCalcClearEntry} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-black transition-colors cursor-pointer" title="مسح الإدخال">C</button>
                      <button type="button" onClick={handleCalcBackspace} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer font-bold" title="حذف خانة">⌫</button>
                      <button type="button" onClick={handleCalcToggleSign} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer font-bold" title="عكس الإشارة">±</button>
                    </div>

                    {/* Specialized Accounting Strip with Tax, Parentheses, and Fractions a/b */}
                    {calcMode === 'accounting' ? (
                      <div className="grid grid-cols-8 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                        <button type="button" onClick={handleCalcAddTax15} className="py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors cursor-pointer" title="+15% ضريبة">+15%</button>
                        <button type="button" onClick={handleCalcRemoveTax15} className="py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/60 transition-colors cursor-pointer" title="-15% ضريبة">-15%</button>
                        <button type="button" onClick={handleCalcTaxOnly15} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer" title="قيمة الضريبة فقط">الضريبة</button>
                        <button type="button" onClick={handleCalcPercentage} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors cursor-pointer font-bold" title="نسبة مئوية">%</button>
                        <button type="button" onClick={handleCalcOpenParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer font-black text-xs" title="قوس فتح">(</button>
                        <button type="button" onClick={handleCalcCloseParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer font-black text-xs" title="قوس إغلاق">)</button>
                        <button type="button" onClick={handleCalcToFraction} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-amber-300 border border-indigo-700/60 transition-colors cursor-pointer font-black text-[10px]" title="بسط ومقام (كسر a/b)">a/b</button>
                        <button type="button" onClick={() => handleCalcNumber('00')} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-bold" title="صفران">00</button>
                      </div>
                    ) : (
                      /* Advanced Scientific Functions with MathJS */
                      <div className="space-y-0.5">
                        {/* Row 1: Sqrt, Power, Logs, Constants, Fraction */}
                        <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                          <button type="button" onClick={handleCalcSqrt} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="جذر تربيعي">√x</button>
                          <button type="button" onClick={handleCalcPowerY} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-amber-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="قوة وأس x^y">xʸ</button>
                          <button type="button" onClick={handleCalcSquare} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="تربيع x²">x²</button>
                          <button type="button" onClick={handleCalcLn} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="اللوغاريتم الطبيعي">ln</button>
                          <button type="button" onClick={handleCalcLog10} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="اللوغاريتم العشري">log₁₀</button>
                          <button type="button" onClick={handleCalcToFraction} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-amber-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="بسط ومقام (كسور a/b)">a/b</button>
                        </div>
                        {/* Row 2: Cube Root, Exp, Trigonometry, Factorial */}
                        <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                          <button type="button" onClick={handleCalcCbrt} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="جذر تكعيبي">∛x</button>
                          <button type="button" onClick={handleCalcExp10} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="10^x">10ˣ</button>
                          <button type="button" onClick={handleCalcExpE} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="e^x">eˣ</button>
                          <button type="button" onClick={handleCalcSin} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer font-bold" title="جيب sin">sin</button>
                          <button type="button" onClick={handleCalcCos} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer font-bold" title="جيب تمام cos">cos</button>
                          <button type="button" onClick={handleCalcTan} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer font-bold" title="ظل tan">tan</button>
                        </div>
                        {/* Row 3: Factorial, Abs, Brackets, Reciprocal */}
                        <div className="grid grid-cols-6 gap-0.5 text-center text-[9px] sm:text-[10px] font-black">
                          <button type="button" onClick={handleCalcFactorial} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-emerald-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="مضروب n!">n!</button>
                          <button type="button" onClick={handleCalcAbs} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="قيمة مطلقة |x|">|x|</button>
                          <button type="button" onClick={handleCalcReciprocal} className="py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer font-bold" title="مقلوب 1/x">1/x</button>
                          <button type="button" onClick={() => handleCalcNumber(`${Math.E}`)} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer font-bold" title="ثابت أويلر e">e</button>
                          <button type="button" onClick={handleCalcOpenParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer font-black text-xs" title="قوس فتح">(</button>
                          <button type="button" onClick={handleCalcCloseParen} className="py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer font-black text-xs" title="قوس إغلاق">)</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Official Standard 4-Column Numpad (col-span-5) */}
                  <div className="md:col-span-5 grid grid-cols-4 gap-0.5 text-center font-bold text-xs" dir="ltr">
                    {/* Row 1: 7, 8, 9, ÷ */}
                    <button type="button" onClick={() => handleCalcNumber('7')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">7</button>
                    <button type="button" onClick={() => handleCalcNumber('8')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">8</button>
                    <button type="button" onClick={() => handleCalcNumber('9')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">9</button>
                    <button type="button" onClick={() => handleCalcOp('÷')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 transition-colors cursor-pointer font-black text-base">÷</button>

                    {/* Row 2: 4, 5, 6, × */}
                    <button type="button" onClick={() => handleCalcNumber('4')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">4</button>
                    <button type="button" onClick={() => handleCalcNumber('5')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">5</button>
                    <button type="button" onClick={() => handleCalcNumber('6')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">6</button>
                    <button type="button" onClick={() => handleCalcOp('×')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 transition-colors cursor-pointer font-black text-base">×</button>

                    {/* Row 3: 1, 2, 3, - */}
                    <button type="button" onClick={() => handleCalcNumber('1')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">1</button>
                    <button type="button" onClick={() => handleCalcNumber('2')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">2</button>
                    <button type="button" onClick={() => handleCalcNumber('3')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">3</button>
                    <button type="button" onClick={() => handleCalcOp('-')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 transition-colors cursor-pointer font-black text-base">-</button>

                    {/* Row 4: 0, ., =, + */}
                    <button type="button" onClick={() => handleCalcNumber('0')} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">0</button>
                    <button type="button" onClick={handleCalcDecimal} className="py-1 sm:py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer font-black text-sm">.</button>
                    <button type="button" onClick={handleCalcEquals} className="py-1 sm:py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-colors cursor-pointer font-black text-base shadow-xs">=</button>
                    <button type="button" onClick={() => handleCalcOp('+')} className="py-1 sm:py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600 transition-colors cursor-pointer font-black text-base">+</button>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* BOTTOM SECTION: MAIN NOTE WRITING CANVAS (Rock-Solid Fixed Size & Gorgeous Golden Frame) */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            
            {/* Note Title Input with Golden Border (Fixed Size & Styling) */}
            <div className="bg-white rounded-2xl border-2 border-amber-400/90 p-2.5 sm:px-4 shadow-sm focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/30 shrink-0 transition-all">
              <input
                type="text"
                value={noteState.title}
                onChange={e => setNoteState(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان الملاحظة أو اسم الحساب / اليومية..."
                className="w-full text-sm sm:text-base font-black text-slate-800 outline-none placeholder:text-slate-400 bg-transparent text-right"
              />
            </div>

            {/* Large Stable Note Content Textarea with Golden Border (100% Fixed & Guaranteed Spacious Size) */}
            <div className="flex-1 min-h-[280px] sm:min-h-[340px] bg-white rounded-3xl border-2 border-amber-400/90 shadow-md shadow-amber-500/5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/30 overflow-hidden flex flex-col transition-all">
              <textarea
                ref={contentTextareaRef}
                value={noteState.content}
                onChange={e => setNoteState(prev => ({ ...prev, content: e.target.value }))}
                placeholder="اكتب تفاصيل اليومية، الحسابات، الأرقام، المذكرات أو التنبيهات بكل حرية وسلاسة..."
                className={`w-full h-full p-4 sm:p-5 text-sm sm:text-base text-slate-900 outline-none leading-relaxed resize-none bg-transparent text-right overflow-y-auto placeholder:text-slate-400 placeholder:font-normal ${
                  isBoldActive ? 'font-black tracking-wide' : 'font-bold'
                }`}
              />
            </div>

            {/* Collapsible Checklist Section */}
            {showChecklistSection && (
              <div className="bg-white rounded-2xl border-2 border-amber-300/80 p-2.5 shadow-sm space-y-1.5 max-h-36 overflow-y-auto no-scrollbar shrink-0">
                <div className="flex items-center justify-between border-b border-amber-100 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowChecklistSection(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    إخفاء
                  </button>
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>قائمة مهام ({noteState.checklist.filter(c => c.done).length}/{noteState.checklist.length}):</span>
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {noteState.checklist.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveCheckItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div 
                        onClick={() => handleToggleCheckItem(item.id)}
                        className="flex items-center gap-2 cursor-pointer select-none flex-1 justify-end"
                      >
                        <span className={`text-xs font-bold ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {item.text}
                        </span>
                        {item.done ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>إضافة</span>
                  </button>
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                    placeholder="أضف مهمة للشطب (اضغط Enter)..."
                    className="w-full p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
