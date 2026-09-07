import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export default function SplashScreen({ onFinish, minDuration = 1800 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const phases = [
    'جاري تهيئة محرك الحسابات والمخزون...',
    'جاري فحص قواعد البيانات والتشفير المحلي...',
    'النظام جاهز للعمل بكامل الكفاءة'
  ];

  useEffect(() => {
    // Phase transitions for dynamic feel
    const phaseTimer1 = setTimeout(() => setLoadingPhase(1), minDuration * 0.35);
    const phaseTimer2 = setTimeout(() => setLoadingPhase(2), minDuration * 0.75);

    // End timer
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
    }, minDuration);

    return () => {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(exitTimer);
    };
  }, [minDuration]);

  const handleSkip = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {isVisible && (
        <motion.div
          key="app-splash-screen-root"
          id="app-splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleSkip}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-950 p-6 select-none cursor-pointer overflow-hidden"
          style={{ direction: 'rtl' }}
        >
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />
          </div>

          {/* Main Hero Branding Centerpiece */}
          <div className="flex flex-col items-center text-center max-w-sm px-4">
            {/* App Icon with Golden Glow Aura */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              {/* Outer Pulsing Aura */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.7, 0.35] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-tr from-amber-500/30 via-amber-400/20 to-amber-300/10 blur-xl"
              />

              {/* Single High-Definition Golden Emblem Container */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 p-2.5 shadow-2xl shadow-black/80 flex items-center justify-center overflow-hidden backdrop-blur-md">
                <img
                  src="/icon.png"
                  alt="شعار النظام المحاسبي الذكي"
                  className="w-full h-full object-contain rounded-2xl drop-shadow-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                  }}
                />
              </div>

              {/* Micro Subtle Sparkle Badge */}
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute -top-1.5 -right-1.5 p-1.5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-200"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950 stroke-slate-950" />
              </motion.div>
            </motion.div>

            {/* App Title */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2"
            >
              النظام المحاسبي الذكي
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-xs sm:text-sm font-medium text-slate-400 mb-6 leading-relaxed"
            >
              إدارة متكاملة للمبيعات والمخزون وسندات القبض والديون
            </motion.p>

            {/* Sleek Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="w-48 sm:w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner"
            >
              <motion.div
                initial={{ width: '10%' }}
                animate={{ width: loadingPhase === 0 ? '45%' : loadingPhase === 1 ? '85%' : '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-l from-amber-400 to-amber-600 rounded-full shadow-sm shadow-amber-400/50"
              />
            </motion.div>

            {/* Dynamic Status Text */}
            <div className="h-6 flex items-center justify-center mt-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`splash-status-phase-${loadingPhase}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] font-medium text-amber-300/80 tracking-wide"
                >
                  {phases[loadingPhase]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 text-center"
          >
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-mono">v1.0.3</span>
              <span>•</span>
              <span>إصدار احترافي مستقل</span>
            </div>
            <span className="text-[10px] text-slate-600">انقر في أي مكان للتخطي الفوري</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

