import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  X, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  FileJson
} from 'lucide-react';
import { Button } from '../ui/Button';
import { decryptBackupData, EncryptedBackupContainer } from '../../services/security/encryptedBackup';

export interface DecryptBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  encryptedContainer: EncryptedBackupContainer | null;
  onSuccessDecrypted: (decryptedData: any) => void;
}

export const DecryptBackupModal: React.FC<DecryptBackupModalProps> = ({
  isOpen,
  onClose,
  encryptedContainer,
  onSuccessDecrypted
}) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !encryptedContainer) return null;

  const handleDecrypt = async () => {
    setError('');

    if (!pin.trim()) {
      setError('الرجاء إدخال رمز الأمان أو كلمة المرور لفك التشفير.');
      return;
    }

    try {
      setIsDecrypting(true);
      const res = await decryptBackupData(encryptedContainer, pin.trim());

      if (res.success && res.data) {
        onSuccessDecrypted(res.data);
        onClose();
      } else {
        setError(res.error || 'رمز المرور غير صحيح! تعذر فك تشفير الملف.');
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء محاولة فك التشفير.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const formattedDate = encryptedContainer.createdAt
    ? new Date(encryptedContainer.createdAt).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'غير محدد';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-150 w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-indigo-50/30 to-emerald-50/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-200">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                  الملف محمي ومشفر برمز سري
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  أدخل الرمز لفتح واسترجاع بيانات المتجر
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
          <div className="p-5 space-y-4">
            {/* File info card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">اسم المتجر / المصدر:</span>
                <span className="font-bold text-slate-900">{encryptedContainer.storeName || 'المتجر'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">تاريخ التشفير:</span>
                <span className="font-mono text-[11px] text-slate-800">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">مستوى التشفير:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  AES-256-GCM
                </span>
              </div>

              {encryptedContainer.hint && (
                <div className="pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-amber-800 font-medium">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <b>تلميح الرمز:</b> {encryptedContainer.hint}
                  </span>
                </div>
              )}
            </div>

            {/* PIN Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">
                أدخل رمز القفل / كلمة المرور:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDecrypt();
                  }}
                  autoFocus
                  placeholder="أدخل رمز الحماية..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={isDecrypting}
              className="text-slate-600 hover:text-slate-900 font-bold px-4 py-2 rounded-xl hover:bg-slate-200/60 transition-colors text-xs cursor-pointer"
            >
              إلغاء
            </button>

            <Button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs shadow-md shadow-amber-200 cursor-pointer"
            >
              {isDecrypting ? (
                <span>جاري فك التشفير...</span>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>فك التشفير والاسترجاع 🔓</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
