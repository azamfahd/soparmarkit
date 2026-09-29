import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Eye, EyeOff, Crown, X, KeyRound, AlertTriangle } from 'lucide-react';
import { verifyOwnerSecurityPIN } from '../../utils/licensing';
import type { User } from 'firebase/auth';

interface OwnerSecurityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

export const OwnerSecurityVerificationModal: React.FC<OwnerSecurityVerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  showNotification
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg('يرجى كتابة رمز الأمان السري للمالك');
      return;
    }
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const isValid = await verifyOwnerSecurityPIN(pinInput.trim());
      if (isValid) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('owner_2fa_verified', 'true');
        }
        showNotification('👑 تم تأكيد هوية المالك بنجاح! تم فتح الصلاحيات ولوحة التحكم الكاملة.', 'success');
        onSuccess();
        onClose();
        setPinInput('');
      } else {
        setErrorMsg('رمز الأمان السري غير صحيح. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء التحقق، يرجى المحاولة لاحقاً');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-amber-500/40 overflow-hidden text-right z-10 p-6 space-y-5"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Golden Badge & Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                <Lock className="w-8 h-8 text-amber-100" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-amber-400 rounded-full text-slate-950 border-2 border-white shadow">
                <Crown className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                طبقة الأمان والتحقق الثنائي (2FA للمالك)
              </span>
              <h3 className="font-black text-lg text-slate-900">
                تأكيد هوية مالك النظام
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                مرحباً بك يا أستاذ عزام! تم التحقق من حسابك السحابي. لحماية وإدارة الصلاحيات القصوى، يرجى إدخال رمز الأمان السري للمالك للمتابعة:
              </p>
            </div>
          </div>

          {/* Owner Account Card */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>حساب معتمد 🟢</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-xs font-black text-slate-800">{currentUser?.displayName || 'عزام فهد'}</p>
                <p className="text-[10px] font-mono text-slate-500 dir-ltr text-right">{currentUser?.email || 'azamfahd25@gmail.com'}</p>
              </div>
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-amber-400 object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                  👑
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1.5">
                <span>رمز الأمان السري (Master Security PIN):</span>
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              </label>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  autoFocus
                  maxLength={12}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="أدخل رمز المالك السري..."
                  className="w-full py-3 px-11 bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-2xl font-mono text-center text-sm font-black text-slate-900 outline-none transition-all tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                />

                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  title={showPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center justify-end gap-1.5 animate-shake">
                  <span>{errorMsg}</span>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:opacity-95 active:scale-[0.99] text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>{isVerifying ? 'جاري التحقق...' : 'تأكيد الرمز وفتح لوحة المالك الشاملة 👑'}</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
