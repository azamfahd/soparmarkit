import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Sparkles, 
  HardDrive, 
  Zap, 
  Check, 
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { getApkDownloadUrl } from '../services/updateService';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallPWA: () => void;
  isStandalone?: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPWA,
  isStandalone = false
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownloadAPK = () => {
    setDownloadStarted(true);
    const downloadUrl = getApkDownloadUrl();
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = 'app-release.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 5000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="install-app-modal-root-container" id="install-app-modal-container" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            id="install-app-modal-card"
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-2xl text-right z-10 space-y-5"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
              <button
                id="close-install-modal-btn"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    تطبيق أصلي ومستقل
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                    <span>تثبيت النظام المحاسبي الذكي</span>
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  </h2>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  اختر الطريقة المناسبة لتثبيت البرنامج على جهازك للعمل بدون متصفح وبسرعة فائقة.
                </p>
              </div>
            </div>

            {/* Standalone Status Indicator if already inside standalone */}
            {isStandalone && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">أنت تستخدم التطبيق المثبت على جهازك حالياً ومحمي بالكامل!</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono">APK Active</span>
              </div>
            )}

            {/* Main Options */}
            <div className="space-y-3.5">
              
              {/* Option 1: Native APK (Primary Recommended) */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-850 to-slate-900 border-2 border-emerald-500/60 shadow-lg shadow-emerald-950/40 space-y-3">
                <div className="absolute -top-2.5 left-4 bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3" />
                  <span>الخيار الأساسي والموصى به</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-extrabold text-sm text-slate-100 flex items-center justify-end gap-1.5">
                      <span>تطبيق أندرويد المستقل (ملف APK الحقيقي)</span>
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                      يعمل كتطبيق أندرويد حقيقي مثبت بذاكرة الهاتف بدون أشرطة متصفح، مع تخزين آمن دائم وتحديثات تلقائية متزامنة.
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>يعمل 100% بدون إنترنت</span>
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>تخزين دائم بذاكرة الجهاز</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>تحديثات تلقائية سحابية</span>
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>تطبيق أندرويد مستقل (Full Screen)</span>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                {/* Download Button */}
                <button
                  id="download-apk-action-btn"
                  onClick={handleDownloadAPK}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-650 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {downloadStarted ? (
                    <>
                      <FileCheck className="w-4 h-4 animate-bounce" />
                      <span>جاري تحميل ملف smart_account.apk...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>تحميل وتثبيت ملف APK (smart_account.apk) 🚀</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Quick PWA Web App (Secondary) */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-extrabold text-xs text-slate-200">
                      تثبيت كـ تطبيق ويب فوري (PWA)
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      تثبيت خفيف وسريع بنقرة زر واحدة عبر المتصفح بدون تحميل ملفات خارجية.
                    </p>
                  </div>
                </div>

                <button
                  id="install-pwa-action-btn"
                  onClick={() => {
                    onInstallPWA();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-750 hover:bg-slate-700 active:scale-[0.98] text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-650 hover:border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>تثبيت PWA السريع للتجربة</span>
                </button>
              </div>

            </div>

            {/* Note / Help */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-2.5 text-[10px] text-slate-400">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <p className="leading-normal">
                عند تثبيت ملف الـ APK، سيبقى التطبيق مرتبطاً بالسيرفر وسيتلقى أي تحسينات أو إضافات جديدة فور توفرها تلقائياً.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
