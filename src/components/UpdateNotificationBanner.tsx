import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Download, X, ShieldCheck } from 'lucide-react';

interface UpdateNotificationBannerProps {
  show: boolean;
  onUpdateNow: () => void;
  onDismiss: () => void;
  onDownloadAPK: () => void;
  updateMessage?: string;
  versionName?: string;
  isNativeAndroid?: boolean;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  show,
  onUpdateNow,
  onDismiss,
  onDownloadAPK,
  updateMessage,
  versionName,
  isNativeAndroid = false,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="app-update-notification-banner-motion"
          id="app-update-notification-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[95] bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-right space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {versionName && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-black">
                      v{versionName}
                    </span>
                  )}
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase">
                    جديد
                  </span>
                  <h4 className="font-extrabold text-xs text-white">
                    يتوفر إصدار وتحديث جديد للنظام!
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-200/90 font-medium mt-0.5">
                  {updateMessage || "تم نشر ميزات وتحسينات جديدة. اضغط للتحديث فوراً أو تنزيل حزمة APK المباشرة."}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Data Safety Notice */}
          <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 flex items-center justify-end gap-1.5 text-[10px] text-emerald-200">
            <span>التحديث آمن ويثبت فوق النسخة الحالية مع الحفاظ التام على بياناتك وفواتيرك.</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>

          {/* Action Buttons: Direct In-Place Update is the Primary Action */}
          <div className="flex flex-col gap-2 pt-0.5">
            <button
              id="refresh-update-btn"
              onClick={onUpdateNow}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              title="تحديث النظام مباشرة بالتحديث الجديد الصادر من المستودع دون إعادة تحميل البرنامج من الصفر"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تثبيت وتطبيق التحديث الجديد فوراً 🚀</span>
            </button>

            <div className="flex items-center justify-between text-[11px] pt-0.5 px-1">
              <button
                id="download-apk-update-btn"
                onClick={onDownloadAPK}
                className="text-emerald-300 hover:text-emerald-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="تنزيل حزمة APK كاملة للأندرويد من مستودع GitHub"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>تحميل حزمة APK للأندرويد (تثبيت مستقل)</span>
              </button>

              <a
                href="https://github.com/azamfahd/soparmarkit/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-200 transition-colors font-mono text-[10px]"
              >
                صفحة المستودع ↗
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
