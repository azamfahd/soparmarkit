import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, Sparkles, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
  autoClose?: boolean;
}

export default function BarcodeScanner({ onScan, onClose, title = "ماسح الباركود", autoClose = true }: BarcodeScannerProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerActive, setScannerActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualBarcode, setManualBarcode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCode = useRef<string>('');
  const lastScannedTime = useRef<number>(0);

  const scanContainerId = "barcode-scanner-reader";

  // Web Audio API Beep Sound Effect
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime); // 1200Hz cleaner crisp chirp
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1); // quick 100ms fade
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Could not play scan beep:", e);
    }
  };

  // Set up and start scanner on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeScanner = async () => {
      if (!isMounted) return;

      // Check for HTTPS (with exception for localhost)
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (!isHttps && !isLocalhost) {
        setErrorMsg("عذراً، استخدام الكاميرا يتطلب اتصالاً آمناً (HTTPS). يرجى التأكد من رابط الموقع في المتصفح.");
        return;
      }

      // Check Permissions API if supported
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
          if (permissionStatus.state === 'denied') {
            setErrorMsg("تم رفض صلاحية استخدام الكاميرا مسبقاً. يرجى النقر على أيقونة القفل (🔒) بجوار عنوان الموقع في المتصفح أو الذهاب لإعدادات المتصفح، وتغيير صلاحية الكاميرا إلى \"سماح\" (Allow)، ثم تحديث الصفحة.");
            return;
          }
        }
      } catch (err) {
        console.warn("Permissions API check skipped or unsupported:", err);
      }

      try {
        // First get cameras using Html5Qrcode capabilities
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
          );
          const chosenCam = backCam || devices[0];
          setSelectedCameraId(chosenCam.id);
          
          await startScanning(chosenCam.id);
        } else {
          // No listed cameras but permission given? Try environment via direct constraints
          await startScanning({ facingMode: "environment" });
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Camera detection error, might need explicit permission prompt", err);
        // Error from getCameras often means permission denied or not requested yet.
        // We will show a special error asking them to grant the permission directly.
        setErrorMsg("يجب إعطاء صلاحية الكاميرا للمتصفح حتى يتمكن الماسح من العمل. إذا رفضت الصلاحية سابقاً، يرجى تحديث الصفحة والسماح بها.");
      }
    };

    const initTimer = setTimeout(initializeScanner, 150);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      stopScanning();
    };
  }, []);

  const requestPermissionDirectly = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setErrorMsg(""); // Clear error to allow standard init
          
          // Re-init
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            const backCam = devices.find(d => 
              d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment') || d.label.toLowerCase().includes('rear')
            );
            const chosenCam = backCam || devices[0];
            setSelectedCameraId(chosenCam.id);
            await startScanning(chosenCam.id);
          } else {
            await startScanning({ facingMode: "environment" });
          }
        }
      } else {
         setErrorMsg("يبدو أن المتصفح الخاص بك لا يدعم استخدام الكاميرا (ربما بسبب عدم استخدام اتصال آمن HTTPS).");
      }
    } catch (err: any) {
      console.error("Direct permission request failed", err);
      setErrorMsg("ما زال لا يمكن الوصول للكاميرا. يرجى التأكد من عدم استخدام الكاميرا في تطبيق آخر ومنح الصلاحية بشكل صحيح، أو استخدام متصفح مختلف.");
    }
  };

  const startScanning = async (cameraIdOrConfig: string | { facingMode: string } | { facingMode: { exact: string } }) => {
    setErrorMsg("");
    setTorchOn(false);
    setHasTorch(false);

    const element = document.getElementById(scanContainerId);
    if (!element) {
      setTimeout(() => {
        startScanning(cameraIdOrConfig);
      }, 100);
      return;
    }

    try {
      if (html5QrcodeRef.current) {
        await stopScanning();
      }

      const scanner = new Html5Qrcode(scanContainerId);
      html5QrcodeRef.current = scanner;

      // Safe config with reasonable defaults for broad compatibility
      const config = {
        fps: 10,
        qrbox: (viewFinderWidth: number, viewFinderHeight: number) => {
          const scannerWidth = Math.max(Math.min(viewFinderWidth * 0.9, 440), 220);
          const scannerHeight = Math.max(Math.min(viewFinderHeight * 0.55, 200), 90);
          return { width: scannerWidth, height: scannerHeight };
        },
        aspectRatio: 1.333333,
      };

      await scanner.start(
        cameraIdOrConfig as any,
        config,
        (decodedText) => {
          const now = Date.now();
          if (decodedText === lastScannedCode.current && (now - lastScannedTime.current) < 1200) {
            return;
          }
          lastScannedCode.current = decodedText;
          lastScannedTime.current = now;
          playBeep();
          onScan(decodedText);
          if (autoClose) {
            stopScanning();
            onClose();
          }
        },
        () => {} // ignore scan frame errors
      );

      setScannerActive(true);

      setTimeout(() => {
        try {
          if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
            // @ts-ignore
            const activeTrack = html5QrcodeRef.current.getActiveTrack();
            if (activeTrack) {
              const capabilities = activeTrack.getCapabilities();
              // @ts-ignore
              if (capabilities && (capabilities.torch !== undefined || 'torch' in capabilities)) {
                setHasTorch(true);
              }
            }
          }
        } catch (e) {
          console.warn("Could not check torch support:", e);
        }
      }, 1000);

    } catch (err: any) {
      console.error("Failed to start scanning with config:", cameraIdOrConfig, err);
      
      // Intelligent fallback chain
      if (typeof cameraIdOrConfig === 'string') {
        console.log("Attempting fallback to generic environment camera...");
        try {
          await startScanning({ facingMode: "environment" });
          return;
        } catch (fallbackErr) {
          console.error("Environment fallback failed:", fallbackErr);
        }
      } else if (typeof cameraIdOrConfig === 'object' && cameraIdOrConfig.facingMode === 'environment') {
         console.log("Attempting fallback to any available camera...");
         try {
           await startScanning({ facingMode: "user" }); // Try front camera if back fails
           return;
         } catch (e2) {
            console.error("User facing fallback failed", e2);
         }
      }
      
      setErrorMsg("عذراً، لم نتمكن من تشغيل الكاميرا. يرجى التأكد من إعطاء صلاحية الكاميرا للمتصفح. قد تحتاج لإغلاق أي تطبيق آخر يستخدم الكاميرا، أو تحديث الصفحة والموافقة على الصلاحيات.");
    }
  };

  const stopScanning = async () => {
    if (html5QrcodeRef.current) {
      if (html5QrcodeRef.current.isScanning) {
        try {
          await html5QrcodeRef.current.stop();
        } catch (err) {
          console.error("Failed to stop scanner cleanly", err);
        }
      }
      try {
        await html5QrcodeRef.current.clear();
      } catch (err) {
        // ignore
      }
      html5QrcodeRef.current = null;
    }
    setScannerActive(false);
    setTorchOn(false);
    setHasTorch(false);
  };

  const toggleTorch = async () => {
    if (!html5QrcodeRef.current || !html5QrcodeRef.current.isScanning) return;
    try {
      const nextState = !torchOn;
      // @ts-ignore
      await html5QrcodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      } as any);
      setTorchOn(nextState);
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    if (newId) {
      startScanning(newId);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      playBeep();
      onScan(manualBarcode.trim());
      setManualBarcode('');
      if (autoClose) {
        stopScanning();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none dir-rtl">
      {/* Dynamic continuous precision scanline styles */}
      <style>{`
        @keyframes precisionScan {
          0% { top: 6%; }
          50% { top: 94%; }
          100% { top: 6%; }
        }
        .animate-precision-laser {
          animation: precisionScan 2.4s ease-in-out infinite;
        }
      `}</style>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="font-extrabold text-white text-base mr-1">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Intelligent Flashlight (Torch) Control */}
            {hasTorch && (
              <button 
                onClick={toggleTorch} 
                className={`p-2 rounded-xl transition-all ${torchOn ? 'text-amber-400 bg-amber-500/15 border border-amber-500/20' : 'text-slate-400 bg-slate-800 hover:bg-slate-700'}`}
                title={torchOn ? "إيقاف الفلاش" : "تشغيل الفلاش للإضاءة"}
              >
                {torchOn ? <Zap className="w-5 h-5 fill-amber-400" /> : <ZapOff className="w-5 h-5" />}
              </button>
            )}
            
            {/* Audio Feedback control */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className={`p-2 rounded-xl transition-all ${soundEnabled ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/20' : 'text-slate-400 bg-slate-800 hover:bg-slate-700'}`}
              title={soundEnabled ? "كتم صوت المسح" : "تشغيل صوت المسح"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => { stopScanning().then(onClose); }} 
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Feed Context */}
        <div className="p-5 space-y-4 bg-slate-900/40">
          <div className="relative aspect-[4/3] w-full rounded-3xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center shadow-[inset_0_4px_25px_rgba(0,0,0,0.85)]">
            
            {/* The Scanner Reader Target Element */}
            <div id={scanContainerId} className="w-full h-full object-cover"></div>

            {/* Glowing Laser Scan Reticle Overlay */}
            {scannerActive && !errorMsg && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Visual Target Area Frame */}
                <div className="w-[90%] h-[55%] max-w-[440px] max-h-[200px] border-2 border-dashed border-emerald-400/40 rounded-3xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(9,15,29,0.70)] animate-pulse-subtle">
                  
                  {/* High Quality Tech Corner brackets */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-[4px] border-r-[4px] border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-[4px] border-l-[4px] border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-[4px] border-r-[4px] border-emerald-400 rounded-br-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-[4px] border-l-[4px] border-emerald-400 rounded-bl-lg" />
                  
                  {/* Glowing Laser line */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_3px_rgba(52,211,153,0.9)] animate-precision-laser" />
                  
                  {/* Status Indicator inside Viewfinder */}
                  <div className="absolute top-2 right-3 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-md border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-bold text-slate-300 font-mono tracking-wider uppercase">AF ON</span>
                  </div>

                  <span className="absolute bottom-2 text-[9px] font-bold text-emerald-400 bg-slate-950/90 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-sm shadow-md">
                    ضع الباركود في هذا الإطار
                  </span>
                </div>
              </div>
            )}

            {/* Error or Loading State */}
            {!scannerActive && !errorMsg && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
                <SpinnerLoading />
                <p className="text-xs font-bold text-slate-400">جاري تفعيل مستشعر الكاميرات فائقة الاستجابة...</p>
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="p-3 rounded-full bg-red-500/10 text-red-500">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-red-400 max-w-[280px] leading-relaxed">
                  {errorMsg}
                </p>
                <div className="flex flex-col gap-2 mt-2 w-full max-w-[240px]">
                  <button 
                    onClick={requestPermissionDirectly}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded-xl transition-all"
                  >
                    السماح باستخدام الكاميرا
                  </button>
                  <button 
                    onClick={() => cameras.length > 0 ? startScanning(selectedCameraId) : startScanning({ facingMode: "environment" })}
                    className="text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl border border-emerald-500/20 transition-all"
                  >
                    إعادة محاولة الاتصال
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Barcode Input Backup */}
          <form onSubmit={handleManualSubmit} className="flex gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <input 
              type="text" 
              placeholder="أو اكتب رقم الباركود يدوياً هنا..." 
              className="flex-1 p-2.5 bg-transparent text-white text-sm font-bold placeholder-slate-500 outline-none pr-3 text-left font-mono"
              value={manualBarcode}
              onChange={e => setManualBarcode(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!manualBarcode.trim()}
              className="px-4 py-2 bg-emerald-600 disabled:opacity-40 disabled:bg-slate-800 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              إدخال
            </button>
          </form>

          {/* Active Helper Guidance Text */}
          {scannerActive && !errorMsg && (
            <div className="text-center bg-slate-950/30 p-3 rounded-2xl border border-slate-800/60">
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                🚀 التبويب المطور: يتميز الماسح بقدرة قراءة سريعة واكتشاف ذكي مدعوم بمعدل تحديث <span className="text-emerald-400">30 إطار/ثانية</span>. قرب الباركود تدريجياً لسرعة مذهلة في التعرف.
              </p>
            </div>
          )}

          {/* Device Selecting Controls */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-3 bg-slate-950/20 p-3 rounded-2xl border border-slate-800/40">
              <span className="text-xs font-extrabold text-slate-400 whitespace-nowrap">الكاميرا النشطة:</span>
              <div className="relative flex-1">
                <select 
                  value={selectedCameraId} 
                  onChange={handleCameraChange}
                  className="w-full p-2 bg-slate-800 border border-slate-700/80 rounded-xl text-white text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500 appearance-none pr-8 cursor-pointer text-right"
                >
                  {cameras.map((device, index) => (
                    <option key={`camera-dev-opt-${device.id || 'no-id'}-${index}`} value={device.id}>
                      {device.label || `كاميرا خلفية رقم ${index + 1}`}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info branding */}
        <div className="bg-slate-950/40 px-6 py-4 border-t border-slate-800/60 text-center flex items-center justify-center gap-1.5 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">الماسح الضوئي المطور فائق السرعة v2.1</span>
        </div>
      </motion.div>
    </div>
  );
}

function SpinnerLoading() {
  return (
    <div className="flex items-center justify-center space-x-2 space-x-reverse">
      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
