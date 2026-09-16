import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Lock, ShieldAlert, KeyRound } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PinVerificationModalProps {
  pinModal: {
    isOpen: boolean;
    title: string;
    description: string;
    inputVal: string;
    error: string;
    onSuccess: () => void;
    actionType: string;
  };
  setPinModal: React.Dispatch<React.SetStateAction<any>>;
  verifyPinMatches: (pin: string, adminPin: string) => Promise<boolean>;
  adminPin: string;
  updateAdminPin: (pin: string) => Promise<void>;
  updatePermissionsEnabled: (enabled: boolean) => Promise<void>;
  showNotification: (msg: string, type?: string) => void;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  pinModal,
  setPinModal,
  verifyPinMatches,
  adminPin,
  updateAdminPin,
  updatePermissionsEnabled,
  showNotification,
}) => {
  if (!pinModal.isOpen) return null;

  const handleAppendChar = (char: string) => {
    setPinModal((p: any) => {
      const newVal = p.inputVal + char;
      if (newVal.length > 32) return p;
      
      if (p.actionType !== 'setup_first') {
        verifyPinMatches(newVal, adminPin).then(isMatch => {
          if (isMatch) {
            setTimeout(() => {
              const successCb = p.onSuccess;
              setPinModal((prev: any) => ({ ...prev, isOpen: false }));
              successCb();
            }, 50);
          }
        });
      }
      return { ...p, inputVal: newVal, error: '' };
    });
  };

  const handleBackspace = () => {
    setPinModal((p: any) => ({ ...p, inputVal: p.inputVal.slice(0, -1), error: '' }));
  };

  const handleClear = () => {
    setPinModal((p: any) => ({ ...p, inputVal: '', error: '' }));
  };

  const handleConfirm = () => {
    if (pinModal.actionType === 'setup_first') {
      if (pinModal.inputVal.length < 4) {
        setPinModal((p: any) => ({ ...p, error: 'يجب أن تكون كلمة السر أو الرمز من 4 خانات على الأقل' }));
        return;
      }
      updateAdminPin(pinModal.inputVal);
      updatePermissionsEnabled(true);
      showNotification('🔑 تم تعيين رمز أمان المدير وتفعيل نظام الحماية بنجاح!', 'success');
      const successCb = pinModal.onSuccess;
      setPinModal((p: any) => ({ ...p, isOpen: false }));
      successCb();
    } else {
      verifyPinMatches(pinModal.inputVal, adminPin).then(isMatch => {
        if (isMatch) {
          const successCb = pinModal.onSuccess;
          setPinModal((p: any) => ({ ...p, isOpen: false }));
          successCb();
        } else {
          setPinModal((p: any) => ({ ...p, error: '❌ رمز المرور غير صحيح! يرجى المحاولة مرة أخرى.' }));
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.92, opacity: 0, y: 15 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-slate-900 border border-slate-800 text-white w-full max-w-sm rounded-[2rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] text-center space-y-4 relative overflow-hidden"
      >
        {/* Top Header line */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-black text-slate-400">تأمين حركات المدير</span>
          </div>
          <button 
            onClick={() => setPinModal((p: any) => ({ ...p, isOpen: false }))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Desc */}
        <div className="space-y-1.5 pt-1">
          <div className="w-13 h-13 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-emerald-500/20 shadow-inner">
            🔐
          </div>
          <h3 className="text-base font-black text-slate-100">{pinModal.title}</h3>
          <p className="text-[11px] text-slate-400 px-3 leading-relaxed">{pinModal.description}</p>
        </div>

        {/* Display Input Container */}
        <div className="space-y-2">
          <div className={`bg-slate-950 p-2 rounded-2xl border flex items-center justify-center relative overflow-hidden h-14 transition-colors ${
            pinModal.error ? 'border-red-500/60 bg-red-950/20' : 'border-slate-800'
          }`}>
            <input
              type="password"
              maxLength={32}
              value={pinModal.inputVal}
              onChange={(e) => {
                setPinModal((p: any) => ({ ...p, inputVal: e.target.value, error: '' }));
                if (pinModal.actionType !== 'setup_first') {
                  verifyPinMatches(e.target.value, adminPin).then(isMatch => {
                    if (isMatch) {
                      setTimeout(() => {
                        const successCb = pinModal.onSuccess;
                        setPinModal((prev: any) => ({ ...prev, isOpen: false }));
                        successCb();
                      }, 50);
                    }
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
              placeholder="الرجاء إدخال كلمة السر أو الرمز..."
              className="w-full bg-transparent text-center font-black font-mono text-emerald-400 tracking-wider focus:outline-none px-4 text-base sm:text-lg placeholder:text-slate-600 placeholder:text-xs dir-ltr"
            />
          </div>

          {pinModal.error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-red-400 font-extrabold"
            >
              {pinModal.error}
            </motion.p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-1" dir="ltr">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={`pin-num-btn-${num}`}
              type="button"
              onClick={() => handleAppendChar(String(num))}
              className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 rounded-full flex items-center justify-center text-lg font-black transition-all cursor-pointer border border-slate-700/50 hover:scale-105 active:scale-95 text-slate-100"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="w-14 h-14 bg-red-950/40 hover:bg-red-900/50 text-red-400 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer border border-red-900/30"
          >
            مسح
          </button>
          <button
            type="button"
            onClick={() => handleAppendChar('0')}
            className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 rounded-full flex items-center justify-center text-lg font-black transition-all cursor-pointer border border-slate-700/50 hover:scale-105 active:scale-95 text-slate-100"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-14 h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer border border-slate-700/50"
          >
            ←
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button 
            onClick={handleConfirm}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl cursor-pointer text-xs transition-all shadow-md hover:shadow-emerald-500/20"
          >
            {pinModal.actionType === 'setup_first' ? 'تأكيد وحفظ الرمز الجديد ✨' : 'تأكيد رمز المرور والمتابعة 🔓'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
