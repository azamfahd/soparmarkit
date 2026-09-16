import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  X, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { 
  exportEncryptedJsonBackup, 
  exportProtectedExcelBackup, 
  exportProtectedWordDocument 
} from '../../services/security/encryptedBackup';

export interface SecureBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  adminPin?: string;
  onSuccessNotification: (msg: string, type?: 'success' | 'error') => void;
}

export type SecureExportFormat = 'json' | 'excel' | 'doc';

export const SecureBackupModal: React.FC<SecureBackupModalProps> = ({
  isOpen,
  onClose,
  storeName,
  adminPin,
  onSuccessNotification
}) => {
  const [format, setFormat] = useState<SecureExportFormat>('json');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hint, setHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUseAdminPin = () => {
    // If adminPin exists, we can suggest setting it or using a standard manager PIN
    if (adminPin) {
      // If adminPin is stored as hash, we just prompt the user or let them enter a quick 4-digit code
      setPin('1234');
      setConfirmPin('1234');
      setHint('رمز المدير الافتراضي');
      setError('');
    } else {
      setPin('1234');
      setConfirmPin('1234');
      setHint('1234');
      setError('');
    }
  };

  const handleExport = async () => {
    setError('');

    if (!pin.trim()) {
      setError('يرجى إدخال رمز الأمان أو كلمة المرور لحماية النسخة الاحتياطية.');
      return;
    }

    if (pin.length < 4) {
      setError('يجب أن يتكون رمز الحماية من 4 خانات على الأقل (أرقام أو حروف).');
      return;
    }

    if (pin !== confirmPin) {
      setError('رمزا الحماية غير متطابقين! يرجى التأكد من كتابة نفس الرمز.');
      return;
    }

    try {
      setIsExporting(true);

      if (format === 'json') {
        const res = await exportEncryptedJsonBackup(pin, {
          storeName,
          hint: hint.trim() || undefined
        });
        if (res.success) {
          onSuccessNotification(`🔒 تم تصدير النسخة الاحتياطية المشفرة بنجاح (${res.fileName})`, 'success');
          onClose();
        } else {
          setError('فشل حفظ الملف على الجهاز.');
        }
      } else if (format === 'excel') {
        const res = await exportProtectedExcelBackup(pin, {
          storeName,
          hint: hint.trim() || undefined
        });
        if (res.success) {
          onSuccessNotification(`📊 تم تصدير مصنف الإكسل المحمي برمز بنجاح (${res.fileName})`, 'success');
          onClose();
        } else {
          setError('فشل حفظ ملف الإكسل.');
        }
      } else if (format === 'doc') {
        const res = await exportProtectedWordDocument(pin, {
          storeName,
          hint: hint.trim() || undefined
        });
        if (res.success) {
          onSuccessNotification(`📄 تم تصدير مستند Word المالي المحمي بنجاح (${res.fileName})`, 'success');
          onClose();
        } else {
          setError('فشل حفظ مستند Word.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تشفير وتصدير الملف');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-150 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-indigo-50/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  تأمين وتشفير النسخة الاحتياطية برمز سري
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    AES-256
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  احمِ بيانات متجرك ومبيعاتك من السرقة والاطلاع غير المصرح به
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
            {/* Format Selection Tabs */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">
                1. اختر نوع وصيغة الملف المراد تأمينه وتصديره:
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* JSON */}
                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    format === 'json'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <FileJson className={`w-5 h-5 ${format === 'json' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    {format === 'json' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">قاعدة بيانات (JSON)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">تشفير عسكري كامل AES</div>
                  </div>
                </button>

                {/* Excel */}
                <button
                  type="button"
                  onClick={() => setFormat('excel')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    format === 'excel'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <FileSpreadsheet className={`w-5 h-5 ${format === 'excel' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    {format === 'excel' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">إكسل محمي (Excel)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">قفل شيتات وحماية</div>
                  </div>
                </button>

                {/* Word */}
                <button
                  type="button"
                  onClick={() => setFormat('doc')}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    format === 'doc'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <FileText className={`w-5 h-5 ${format === 'doc' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    {format === 'doc' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800">مستند Word / تقرير</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">مختوم ومؤمن رقمياً</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Password & Security Code Setup */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>2. تعيين رمز القفل والحماية (PIN / كلمة المرور):</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseAdminPin}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>تعيين رمز سريع (1234)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PIN Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">رمز القفل السري:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="مثلاً 4 أو 6 أرقام..."
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm PIN Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">تأكيد الرمز السري:</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="أعد كتابة نفس الرمز..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Hint */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>تلميح للرمز (اختياري - لمساعدتك إذا نسيته لاحقاً):</span>
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="مثال: رقم هاتف المحل، سنة التأسيس..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Security Explanation Note */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-emerald-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-[11.5px]">كيف يعمل التشفير؟</p>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  يتم تشفير كافة سجلات المبيعات والعملاء والمخزون باستخدام معيار <b>AES-256-GCM</b> المعتمد عالمياً. لن يستطيع أي شخص فتح أو استرجاع هذا الملف دون إدخال الرمز السري الذي تحدده هنا.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="text-slate-600 hover:text-slate-900 font-bold px-4 py-2 rounded-xl hover:bg-slate-200/60 transition-colors text-xs cursor-pointer"
            >
              إلغاء
            </button>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-200 cursor-pointer"
            >
              {isExporting ? (
                <span>جاري التشفير والتصدير...</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تأمين وتصدير الملف الآن 🔒</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
