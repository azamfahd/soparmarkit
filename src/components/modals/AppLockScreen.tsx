import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, ShieldCheck, KeyRound, AlertCircle, Clock, Store, Eye, EyeOff } from 'lucide-react';

export interface AppLockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  storeName: string;
  adminPin: string;
  appLockPin: string;
  verifyPinMatches: (inputPin: string, storedPin: string) => Promise<boolean>;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  isLocked,
  onUnlock,
  storeName = 'برنامج المبيعات',
  adminPin,
  appLockPin,
  verifyPinMatches,
}) => {
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showPinText, setShowPinText] = useState(false);

  // Live Digital Clock
  useEffect(() => {
    if (!isLocked) return;
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  // Keyboard events listener for typing PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLocked) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        appendChar(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleConfirmUnlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, inputPin, appLockPin, adminPin]);

  const targetPin = appLockPin || adminPin;

  const appendChar = (char: string) => {
    if (inputPin.length >= 32) return;
    const newVal = inputPin + char;
    setInputPin(newVal);
    setErrorMsg('');
  };

  const handleBackspace = () => {
    setInputPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setInputPin('');
    setErrorMsg('');
  };

  const checkPinMatch = async (candidatePin: string) => {
    if (!candidatePin.trim()) return;
    setIsVerifying(true);
    try {
      // 1. Try checking candidate against appLockPin
      let isMatch = appLockPin ? await verifyPinMatches(candidatePin, appLockPin) : false;
      // 2. Fallback checking against adminPin
      if (!isMatch && adminPin) {
        isMatch = await verifyPinMatches(candidatePin, adminPin);
      }
      // 3. Fallback default emergency PIN "1234" or "0000" if no PIN is set
      if (!isMatch && !appLockPin && !adminPin && (candidatePin.trim() === '1234' || candidatePin.trim() === '0000')) {
        isMatch = true;
      }

      if (isMatch) {
        setInputPin('');
        setErrorMsg('');
        setIsVerifying(false);
        onUnlock();
      } else {
        setErrorMsg('❌ كلمة السر / الرمز غير صحيح! يرجى المحاولة مرة أخرى.');
        setIsVerifying(false);
      }
    } catch (err) {
      setIsVerifying(false);
      setErrorMsg('حدث خطأ أثناء التحقق من الرمز');
    }
  };

  const handleConfirmUnlock = () => {
    if (!inputPin.trim()) {
      setErrorMsg('الرجاء إدخال رمز الأمان للفتح');
      return;
    }
    checkPinMatch(inputPin);
  };

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          key="app-lock-screen-modal"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[999] bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 overflow-y-auto select-none dir-rtl font-sans"
        >
          {/* Background ambient lighting effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Top Header & Digital Clock */}
          <div className="w-full max-w-md flex justify-between items-center pt-2 relative z-10 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
                <Store className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100">{storeName}</h2>
                <span className="text-[10px] text-slate-400 font-bold block">نظام المبيعات وحماية البيانات 🔐</span>
              </div>
            </div>

            <div className="text-left dir-ltr">
              <div className="text-sm font-black font-mono text-emerald-400 tracking-wider">{timeStr}</div>
              <div className="text-[10px] text-slate-400 font-bold dir-rtl">{dateStr}</div>
            </div>
          </div>

          {/* Center Main Lock Card */}
          <div className="w-full max-w-sm my-auto py-6 space-y-5 text-center relative z-10">
            {/* Lock Icon Badge */}
            <div className="relative inline-block">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
              </motion.div>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-slate-950 rounded-xl shadow-md border border-slate-900">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Title & Prompt */}
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-100">برنامج المبيعات محمي ومقفل 🔒</h1>
              <p className="text-xs text-slate-400 px-4 leading-relaxed font-bold">
                الرجاء إدخال رمز أمان المدير للفتح والوصول للنظام
              </p>
            </div>

            {/* Input Display & Typing Field */}
            <div className="space-y-2">
              <div className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex items-center justify-center h-14 shadow-inner overflow-hidden">
                <input
                  type={showPinText ? 'text' : 'password'}
                  maxLength={32}
                  value={inputPin}
                  onChange={(e) => {
                    setInputPin(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmUnlock();
                    }
                  }}
                  placeholder="أدخل الرمز السرّي أو كلمة السر..."
                  className="w-full bg-transparent text-center font-black font-mono text-emerald-400 tracking-wider focus:outline-none px-8 text-base sm:text-lg placeholder:text-slate-600 placeholder:text-xs dir-ltr"
                />

                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="absolute left-3 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  title={showPinText ? 'إخفاء' : 'إظهار'}
                >
                  {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-900/50"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[270px] mx-auto pt-1" dir="ltr">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={`lock-key-${num}`}
                  type="button"
                  onClick={() => appendChar(String(num))}
                  className="w-16 h-14 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 rounded-2xl text-lg font-black text-slate-100 flex items-center justify-center transition-all cursor-pointer border border-slate-800/80 shadow-md hover:border-slate-700 active:scale-95"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="w-16 h-14 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 rounded-2xl text-xs font-black flex items-center justify-center transition-all cursor-pointer border border-rose-900/40 active:scale-95"
              >
                مسح
              </button>

              <button
                type="button"
                onClick={() => appendChar('0')}
                className="w-16 h-14 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 rounded-2xl text-lg font-black text-slate-100 flex items-center justify-center transition-all cursor-pointer border border-slate-800/80 shadow-md hover:border-slate-700 active:scale-95"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="w-16 h-14 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-2xl text-sm font-bold flex items-center justify-center transition-all cursor-pointer border border-slate-800/80 active:scale-95"
              >
                ←
              </button>
            </div>

            {/* Manual Unlock / Confirm Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleConfirmUnlock}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-black py-3.5 rounded-2xl text-xs transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                <Unlock className="w-4 h-4" />
                <span>فتح وتأكيد تسجيل الدخول 🔓</span>
              </button>
            </div>

            {!appLockPin && !adminPin && (
              <p className="text-[10px] text-amber-400/90 font-bold pt-1 bg-amber-950/30 p-2 rounded-xl border border-amber-900/40">
                💡 الرمز التجريبي الافتراضي لفتح الشاشة هو: <span className="font-mono font-black text-white px-1.5 py-0.5 bg-slate-900 rounded">1234</span>
              </p>
            )}
          </div>

          {/* Bottom Footer */}
          <div className="w-full max-w-md text-center border-t border-slate-900 pt-3 text-[10px] text-slate-500 font-bold relative z-10 flex justify-between items-center">
            <span>نظام حماية المتجر والتأمين الإلكتروني 🔒</span>
            <span className="font-mono text-slate-600">v2.5 Protected</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
