import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
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

  return (
    <div key="modal-pin" className="fixed inset-0 bg-black/75 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className="bg-slate-900 border border-slate-800 text-white w-full max-w-sm rounded-[2rem] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] text-center space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-xs font-black text-slate-500 tracking-wider">نظام صلاحيات المدير</span>
          <button 
            onClick={() => setPinModal((p: any) => ({ ...p, isOpen: false }))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl border border-emerald-500/20 shadow-inner">
            🔐
          </div>
          <h3 className="text-base font-black text-slate-100">{pinModal.title}</h3>
          <p className="text-[11px] text-slate-400 px-2 leading-relaxed">{pinModal.description}</p>
        </div>

        {/* Display Dots */}
        <div className="space-y-2">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-center gap-3 relative overflow-hidden h-14">
            {pinModal.inputVal ? (
              <div className="flex gap-2.5">
                {Array.from(pinModal.inputVal).map((_, idx) => (
                  <div 
                    key={`pin-dot-${idx}`} 
                    className="w-3.5 h-3.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.9)] transform scale-100 transition-transform duration-75"
                  ></div>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 text-xs font-bold">الرجاء إدخال الرمز المكون من 4 أرقام</span>
            )}
          </div>
          {pinModal.error && (
            <p className="text-[11px] text-red-450 font-extrabold animate-pulse">{pinModal.error}</p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setPinModal((p: any) => {
                  const newVal = p.inputVal + num;
                  if (newVal.length > 8) return p;
                  
                  if (p.actionType !== 'setup_first') {
                    verifyPinMatches(newVal, adminPin).then(isMatch => {
                      if (isMatch) {
                        setTimeout(() => {
                          const successCb = p.onSuccess;
                          setPinModal((prev: any) => ({ ...prev, isOpen: false }));
                          successCb();
                        }, 30);
                      }
                    });
                  }
                  return { ...p, inputVal: newVal, error: '' };
                });
              }}
              className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 rounded-full flex items-center justify-center text-lg font-black transition-all cursor-pointer border border-slate-700/50 hover:scale-105 active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPinModal((p: any) => ({ ...p, inputVal: '', error: '' }));
            }}
            className="w-14 h-14 bg-red-950/30 hover:bg-red-900/40 text-red-400 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer border border-red-900/30"
          >
            مسح
          </button>
          <button
            type="button"
            onClick={() => {
              setPinModal((p: any) => {
                const newVal = p.inputVal + '0';
                if (newVal.length > 8) return p;
                
                if (p.actionType !== 'setup_first') {
                  verifyPinMatches(newVal, adminPin).then(isMatch => {
                    if (isMatch) {
                      setTimeout(() => {
                        const successCb = p.onSuccess;
                        setPinModal((prev: any) => ({ ...prev, isOpen: false }));
                        successCb();
                      }, 30);
                    }
                  });
                }
                return { ...p, inputVal: newVal, error: '' };
              });
            }}
            className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 rounded-full flex items-center justify-center text-lg font-black transition-all cursor-pointer border border-slate-700/50 hover:scale-105"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => {
              setPinModal((p: any) => ({ ...p, inputVal: p.inputVal.slice(0, -1), error: '' }));
            }}
            className="w-14 h-14 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer border border-slate-700/50"
          >
            ←
          </button>
        </div>

        <div className="pt-2">
          <Button 
            onClick={() => {
              if (pinModal.actionType === 'setup_first') {
                if (pinModal.inputVal.length < 4) {
                  setPinModal((p: any) => ({ ...p, error: 'يجب أن يكون الرمز من 4 أرقام على الأقل' }));
                  return;
                }
                updateAdminPin(pinModal.inputVal);
                updatePermissionsEnabled(true);
                showNotification('🔑 تم تعيين رمز أمان المدير وتفعيل نظام الحماية بنجاح!');
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
                    setPinModal((p: any) => ({ ...p, error: '❌ رمز المرور غير صحيح! الرجاء المحاولة مرة أخرى.' }));
                  }
                });
              }
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 text-white font-extrabold py-3.5 rounded-2xl cursor-pointer text-xs transition-all shadow-md hover:shadow-emerald-500/25"
          >
            {pinModal.actionType === 'setup_first' ? 'تأكيد وحفظ الرمز الجديد ✨' : 'تأكيد رمز المرور والمتابعة 🔓'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
