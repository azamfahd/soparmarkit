import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, X, Sparkles, ShieldCheck } from 'lucide-react';

interface BrowserInstallBannerProps {
  show: boolean;
  onOpenInstallModal: () => void;
  onDismiss: () => void;
}

export const BrowserInstallBanner: React.FC<BrowserInstallBannerProps> = ({
  show,
  onOpenInstallModal,
  onDismiss
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="browser-install-prompt-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[88] bg-slate-900/95 text-white border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-right space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">
                    تجربة أصلية
                  </span>
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1">
                    <span>ثبّت تطبيق المحاسبي الذكي على جهازك</span>
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                  استمتع بعمل مستمر بدون إنترنت وشاشة كاملة وسرعة فائقة بتثبيت التطبيق كـ APK أو PWA.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-4.5 h-4.5 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Quick Features */}
          <div className="flex items-center justify-end gap-3 text-[10px] text-emerald-300 font-bold border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1">
              <span>تحديثات تلقائية سحابية</span>
              <Sparkles className="w-3 h-3 text-emerald-400" />
            </span>
            <span className="flex items-center gap-1">
              <span>تخزين دائم بذاكرة الهاتف</span>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </span>
          </div>

          {/* CTA Action */}
          <button
            id="open-install-options-btn"
            onClick={onOpenInstallModal}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-650 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تثبيت البرنامج الآن (APK / PWA) 🚀</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
