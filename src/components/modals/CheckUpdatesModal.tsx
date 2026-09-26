import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Github, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  PackageCheck,
  Calendar,
  Smartphone
} from 'lucide-react';
import { 
  checkAppUpdates, 
  downloadDirectAPK, 
  installDownloadedAPK,
  applyOTAUpdate, 
  UPDATE_SAFETY_NOTICE,
  GITHUB_REPO,
  type UpdateCheckResult 
} from '../../services/updateService';

interface CheckUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateDetected?: (result: UpdateCheckResult) => void;
}

export const CheckUpdatesModal: React.FC<CheckUpdatesModalProps> = ({
  isOpen,
  onClose,
  onUpdateDetected,
}) => {
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alreadyUpToDateNotice, setAlreadyUpToDateNotice] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    setErrorMsg(null);
    setAlreadyUpToDateNotice(false);
    try {
      const res = await checkAppUpdates();
      setCheckResult(res);
      if (res.hasUpdate && onUpdateDetected) {
        onUpdateDetected(res);
      }
    } catch (err: any) {
      console.warn('[CheckUpdatesModal] Error checking updates:', err);
      setErrorMsg('تعذر الاتصال بمستودع GitHub حالياً. يرجى التأكد من الاتصال بالشبكة والمحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAPKClick = async (force = false) => {
    if (!force && checkResult && !checkResult.hasUpdate) {
      setAlreadyUpToDateNotice(true);
      return;
    }
    await installDownloadedAPK(checkResult?.updateUrl);
  };

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-right z-10 my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 border-b border-emerald-500/30 flex items-start justify-between gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-right space-y-1">
              <div className="flex items-center justify-end gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  <span>تحديث APK الفوري</span>
                </span>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2 justify-end">
                  <span>مركز تحديثات التطبيق (APK)</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                فحص مباشر للتطبيق وتنزيل حزمة الـ APK الصادرة بدون وسيط لحفظ بياناتك.
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">
            {/* Loading State */}
            {loading && (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800">جاري فحص الإصدارات والتحديثات...</h4>
                  <p className="text-xs text-slate-500 dir-ltr font-mono">
                    api.github.com/repos/{GITHUB_REPO}/releases/latest
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!loading && errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-right">
                <div className="flex items-center gap-2 justify-end text-rose-700 font-bold text-xs">
                  <span>حدث خطأ أثناء فحص التحديثات</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                </div>
                <p className="text-xs text-rose-600 leading-relaxed">
                  {errorMsg}
                </p>
                <button
                  onClick={runCheck}
                  className="mt-2 text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                >
                  إعادة المحاولة الآن 🔄
                </button>
              </div>
            )}

            {/* Result Display */}
            {!loading && checkResult && (
              <div className="space-y-4">
                {/* Current vs Latest Version Card */}
                <div className={`p-4 rounded-2xl border text-right space-y-3 transition-all ${
                  checkResult.hasUpdate
                    ? 'bg-gradient-to-l from-amber-500/10 via-amber-500/5 to-transparent border-amber-300/80'
                    : 'bg-emerald-50/60 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                      checkResult.hasUpdate
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {checkResult.hasUpdate ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>تحديث جديد متوفر! 🎉</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>التطبيق محدث لأحدث إصدار</span>
                        </>
                      )}
                    </span>

                    <span className="text-[10px] text-slate-500 font-medium">
                      المصدر: {checkResult.source === 'FIREBASE' ? 'سحابة Firebase المباشرة' : checkResult.source === 'GITHUB' ? 'سيرفر GitHub الرسمي' : 'الملف المحلي'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 dir-rtl text-right">
                    <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">الإصدار المثبت حالياً:</span>
                      <span className="text-sm font-mono font-black text-slate-800">v{checkResult.currentVersion}</span>
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">أحدث إصدار توفر للـ APK:</span>
                      <span className={`text-sm font-mono font-black ${
                        checkResult.hasUpdate ? 'text-emerald-600 font-extrabold' : 'text-slate-800'
                      }`}>
                        v{checkResult.latestVersion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Release Notes Card */}
                {checkResult.releaseNotes && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      {checkResult.publishedAt && (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 dir-ltr">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(checkResult.publishedAt).toLocaleDateString('ar-EG')}
                        </span>
                      )}
                      <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 justify-end">
                        <span>تفاصيل وملاحظات التحديث الجديد:</span>
                        <PackageCheck className="w-4 h-4 text-emerald-600" />
                      </h4>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-150 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap max-h-40 overflow-y-auto no-scrollbar">
                      {checkResult.releaseNotes}
                    </div>
                  </div>
                )}

                {/* Already Up To Date Alert Banner */}
                {alreadyUpToDateNotice && checkResult && !checkResult.hasUpdate && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-emerald-50 border-2 border-emerald-400/80 rounded-2xl text-right space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-end gap-2 font-extrabold text-xs text-emerald-900">
                      <span>التطبيق مثبت لديك ومحدث بأحدث إصدار بالفعل (v{checkResult.currentVersion})!</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium leading-relaxed pr-7">
                      النسخة الموجودة في جهازك هي أحدث إصدار متاح، والبرنامج متوافق تماماً بدون الحاجة إلى إعادات التنزيل.
                    </p>
                    <div className="flex justify-start pr-7 pt-1">
                      <button
                        onClick={() => handleDownloadAPKClick(true)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                      >
                        تنزيل ملف الـ APK مجدداً على أي حال 📥
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Safety Guarantee */}
                <div className="p-3 bg-emerald-950 text-emerald-100 rounded-2xl border border-emerald-500/40 flex items-center justify-end gap-2 text-xs">
                  <span className="text-right leading-tight">
                    {UPDATE_SAFETY_NOTICE}
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>

                {/* Download / Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {checkResult.hasUpdate ? (
                    <button
                      onClick={() => applyOTAUpdate(checkResult.latestVersion, checkResult.latestVersionCode)}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>تثبيت وتطبيق التحديث الجديد فوراً 🚀</span>
                    </button>
                  ) : (
                    <div className="w-full py-3 px-4 bg-slate-100 text-slate-800 border border-slate-200 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>التطبيق متوافق وبأحدث إصدار (v{checkResult.currentVersion})</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownloadAPKClick(false)}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-emerald-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="تحميل ملف APK مستقل لتثبيته يدوياً على أجهزة الأندرويد"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>حزمة APK للأندرويد</span>
                    </button>

                    <button
                      onClick={runCheck}
                      disabled={loading}
                      className="py-2.5 px-3 bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                      <span>إعادة الفحص الآن</span>
                    </button>
                  </div>

                  <a
                    href="https://github.com/azamfahd/soparmarkit/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 pt-1 transition-colors"
                  >
                    <span>صفحة الإصدارات في المستودع الرسمية</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
