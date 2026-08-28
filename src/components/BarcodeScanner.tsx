import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  X, Camera, RefreshCw, Sparkles, Volume2, VolumeX, Zap, ZapOff, 
  ShoppingCart, Plus, Minus, Trash2, Check, CreditCard, DollarSign, User, AlertTriangle, Printer, Download, Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { type Customer } from '../db';

interface BarcodeScannerProps {
  onScan: (barcode: string, playBeep?: () => void) => void;
  onClose: () => void;
  title?: string;
  autoClose?: boolean;
  scannerMode?: 'pos' | 'add-product' | 'edit-product' | 'manual';
  cart?: { product_id: number; name: string; price: number; quantity: number; max_stock: number; unit?: string }[];
  onUpdateCartQuantity?: (productId: number, delta: number) => void;
  onRemoveFromCart?: (productId: number) => void;
  onCheckout?: () => Promise<void>;
  onPrintCart?: () => void;
  onDownloadCart?: () => void;
  formatPrice?: (price: number) => string;
  paymentType?: 'cash' | 'debt';
  setPaymentType?: (type: 'cash' | 'debt') => void;
  selectedCustomer?: number | null;
  setSelectedCustomer?: (id: number | null) => void;
  customers?: Customer[];
}

export default function BarcodeScanner({ 
  onScan, 
  onClose, 
  title = "ماسح الباركود", 
  autoClose = true,
  scannerMode = 'pos',
  cart = [],
  onUpdateCartQuantity,
  onRemoveFromCart,
  onCheckout,
  onPrintCart,
  onDownloadCart,
  formatPrice = (p) => `${p} ر.ي`,
  paymentType = 'cash',
  setPaymentType,
  selectedCustomer = null,
  setSelectedCustomer,
  customers = []
}: BarcodeScannerProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerActive, setScannerActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualBarcode, setManualBarcode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCode = useRef<string>('');
  const lastScannedTime = useRef<number>(0);

  // Keep latest onScan callback in ref to prevent stale closures when called by third party camera engine
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Custom states for continuous autofocus, motion stabilization, and tap-to-focus feedback
  const [focusRing, setFocusRing] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const focusIntervalRef = useRef<any>(null);

  const scanContainerId = "barcode-scanner-reader";

  // Force active camera track autofocus and optical stabilization constraints
  const triggerAutofocus = async () => {
    try {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        // @ts-ignore
        const activeTrack = html5QrcodeRef.current.getActiveTrack();
        if (activeTrack) {
          const capabilities = activeTrack.getCapabilities();
          const constraints: any = {};
          
          // Force continuous autofocus if supported
          if (capabilities && capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            constraints.focusMode = 'continuous';
          }
          // Force optical/digital image stabilization if supported
          if (capabilities && capabilities.imageStabilizationMode) {
            if (capabilities.imageStabilizationMode.includes('on')) {
              constraints.imageStabilizationMode = 'on';
            } else if (capabilities.imageStabilizationMode.includes('standard')) {
              constraints.imageStabilizationMode = 'standard';
            }
          }
          
          if (Object.keys(constraints).length > 0) {
            await activeTrack.applyConstraints({
              advanced: [constraints]
            });
            console.log("Successfully locked focus & stabilization constraints:", constraints);
          } else {
            // Fallback for devices/browsers with limited constraint inspection
            await activeTrack.applyConstraints({
              // @ts-ignore
              focusMode: 'continuous'
            });
          }
        }
      }
    } catch (e) {
      console.warn("Failed to apply camera focus constraints:", e);
    }
  };

  const handleTapToFocus = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scannerActive) return;
    
    // Calculate click coordinates relative to the viewfinder box
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setFocusRing({ x, y, visible: true });
    
    // Explicitly command a hardware focus search sweep
    triggerAutofocus();
    
    // Automatically fade out focus indicator
    setTimeout(() => {
      setFocusRing(prev => ({ ...prev, visible: false }));
    }, 1000);
  };

  // Web Audio API Beep Sound Effect
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (navigator.vibrate) {
        navigator.vibrate([50]);
      }
      let ctx = audioCtxRef.current;
      if (!ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        ctx = new AudioCtx();
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime); // Crisp retail scanner chirp
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12); // quick 120ms fade
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
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
            setErrorMsg("تم رفض الصلاحية مسبقاً. يرجى الذهاب إلى إعدادات الكاميرا في متصفحك والسماح بالوصول ثم إعادة المحاولة.");
            return;
          }
        }
      } catch (err) {
        console.warn("Permissions API check skipped or unsupported:", err);
      }

      try {
        const devices = await Html5Qrcode.getCameras().catch((e) => {
          console.warn("Html5Qrcode.getCameras failed or denied:", e);
          return [];
        });
        if (!isMounted) return;
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('خلفية')
          );
          const chosenCam = backCam || devices[0];
          setSelectedCameraId(chosenCam.id);
          
          await startScanning(chosenCam.id);
        } else {
          await startScanning({ facingMode: "environment" });
        }
      } catch (err: any) {
        if (!isMounted) return;
        const errName = err?.name || 'CameraError';
        const errStr = err?.message || String(err);
        console.error("Camera initialization failure:", errName, errStr, err);
        
        let userMessage = "يمكنك منح صلاحية الكاميرا أو كتابة الباركود يدوياً أو رفع صورة الباركود.";
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errStr.toLowerCase().includes('permission denied')) {
          userMessage = "تم رفض إذن الكاميرا من المتصفح. يمكنك السماح بالوصول للكاميرا من إعدادات الموقع، أو استخدام الإدخال اليدوي/رفع الصورة.";
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          userMessage = "لم يتم العثور على كاميرا في جهازك. يمكنك استخدام الباركود اليدوي أو رفع صورة الباركود.";
        }
        
        setErrorMsg(userMessage);
      }
    };

    const initTimer = setTimeout(initializeScanner, 10);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      stopScanning();
    };
  }, []);

  const requestPermissionDirectly = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        } catch (e) {
          // Fallback to basic video constraint if environment facingMode fails
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setErrorMsg(""); // Clear error
          
          const devices = await Html5Qrcode.getCameras().catch(() => []);
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
        setErrorMsg("المتصفح لا يدعم الوصول المباشر للكاميرا بدون اتصال آمن HTTPS.");
      }
    } catch (err: any) {
      const errName = err?.name || 'PermissionDenied';
      const errStr = err?.message || String(err);
      console.error("Direct permission request failed:", errName, errStr, err);
      setErrorMsg("الوصول للكاميرا مرفوض حالياً من المتصفح. يمكنك استخدام الإدخال اليدوي أو رفع صورة الباركود.");
    }
  };

  const startScanning = async (cameraIdOrConfig: string | { facingMode: string }) => {
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

      // Hardware level video constraints to minimize blur from movement, force focus
      const optimizedConstraints = {
        facingMode: { ideal: "environment" },
        // High frame rate (30fps) reduces exposure duration per frame, substantially reducing motion blur
        frameRate: { ideal: 30 },
        // Optimal HD resolution strikes the perfect balance between crisp details and decoding speed (reducing lag)
        width: { ideal: 1280 },
        height: { ideal: 720 },
        // @ts-ignore
        focusMode: "continuous"
      };

      const config = {
        fps: 30, // Optimized 30 frames per second decoding scanrate for lightning speed
        qrbox: (viewFinderWidth: number, viewFinderHeight: number) => {
          const scannerWidth = Math.max(Math.min(viewFinderWidth * 0.9, 440), 220);
          const scannerHeight = Math.max(Math.min(viewFinderHeight * 0.55, 200), 90);
          return { width: scannerWidth, height: scannerHeight };
        },
        aspectRatio: 1.333333,
        // Integrate focus and stabilization constraints into camera configuration
        videoConstraints: {
          ...optimizedConstraints,
          deviceId: typeof cameraIdOrConfig === 'string' ? { ideal: cameraIdOrConfig } : undefined
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Native hardware-accelerated Barcode engine (much faster & sharper)
        },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39
        ]
      };

      // Ensure proper object-based fallback parameter injection
      let finalCameraIdOrConfig: any = cameraIdOrConfig;
      if (typeof cameraIdOrConfig === 'object') {
        finalCameraIdOrConfig = {
          ...cameraIdOrConfig,
          ...optimizedConstraints
        };
      }

      await scanner.start(
        finalCameraIdOrConfig,
        config,
        (decodedText) => {
          const now = Date.now();
          if (decodedText === lastScannedCode.current && (now - lastScannedTime.current) < 1200) {
            return; // Prevent duplicate immediate scans
          }
          lastScannedCode.current = decodedText;
          lastScannedTime.current = now;
          
          if (scannerMode !== 'pos') {
            playBeep();
          }
          setFlashActive(true);
          setTimeout(() => setFlashActive(false), 300);

          onScanRef.current(decodedText, playBeep);
          if (autoClose) {
            stopScanning();
            onClose();
          }
        },
        () => {} // ignore frame errors
      );

      setScannerActive(true);

      // Trigger continuous focus sweep immediately once stream boots up
      setTimeout(async () => {
        await triggerAutofocus();
        
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
          console.warn("Torch capabilities check skipped:", e);
        }
      }, 800);

      // Auto-Focus Watchdog: Periodically re-triggers active continuous focus sweep every 2.5 seconds,
      // actively preventing the camera from getting locked into a blurry state if the phone is moved.
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
      focusIntervalRef.current = setInterval(() => {
        triggerAutofocus();
      }, 2500);

    } catch (err: any) {
      const errName = err?.name || (typeof err === 'string' ? err : 'CameraError');
      const errStr = err?.message || (typeof err === 'string' ? err : String(err));
      console.error("Failed to start scanner:", errName, errStr, err);
      
      if (typeof cameraIdOrConfig === 'string') {
        try {
          await startScanning({ facingMode: "environment" });
          return;
        } catch (e) {
          console.error("Camera fallback failed:", e);
        }
      }
      
      let userMessage = "تعذر بدء تشغيل الكاميرا. يمكنك كتابة الباركود يدوياً أو رفع صورة تحتوي على الباركود.";
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errStr.toLowerCase().includes('permission denied')) {
        userMessage = "تم رفض إذن الكاميرا من قبل المتصفح. يمكنك السماح بالإذن في إعدادات المتصفح، أو استخدام رفع الصورة/الإدخال اليدوي.";
      }
      
      setErrorMsg(userMessage);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let scanner = html5QrcodeRef.current;
      let tempScannerCreated = false;
      if (!scanner) {
        scanner = new Html5Qrcode(scanContainerId);
        tempScannerCreated = true;
      }
      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        if (scannerMode !== 'pos') {
          playBeep();
        }
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 300);

        onScanRef.current(decodedText, playBeep);
        if (autoClose) {
          stopScanning();
          onClose();
        }
      }
      if (tempScannerCreated) {
        try {
          await scanner.clear();
        } catch (e) {}
      }
    } catch (err: any) {
      console.error("Failed to read barcode from image:", err);
      alert("تعذر قراءة الباركود من الصورة المرفقة. يرجى التأكد من وضوح الباركود في الصورة والمحاولة مجدداً.");
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  const stopScanning = async () => {
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }
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
      } catch (e) {}
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
      console.error("Failed to toggle flashlight:", err);
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
      if (scannerMode !== 'pos') {
        playBeep();
      }
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 300);

      onScan(manualBarcode.trim(), playBeep);
      setManualBarcode('');
      if (autoClose) {
        stopScanning();
        onClose();
      }
    }
  };

  const handleScannerCheckout = async () => {
    if (cart.length === 0 || !onCheckout) return;
    setIsSubmitting(true);
    try {
      await onCheckout();
      playBeep(); // Happy double beep on checkout
      setTimeout(playBeep, 80);
      onClose(); // Close the scanner since the sale is complete
    } catch (err) {
      console.error("Failed scanner checkout:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-50 flex items-center justify-center p-2 sm:p-4 select-none dir-rtl">
      {/* Dynamic continuous precision scanline styles */}
      <style>{`
        @keyframes precisionScan {
          0% { top: 6%; }
          50% { top: 94%; }
          100% { top: 6%; }
        }
        .animate-precision-laser {
          animation: precisionScan 2s ease-in-out infinite;
        }
      `}</style>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <h3 className="font-black text-white text-base mr-1">{title}</h3>
              {scannerMode === 'pos' && (
                <p className="text-[10px] text-slate-400 font-bold mr-1">الوضع المستمر للمبيعات السريعة</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {scannerMode === 'pos' && onPrintCart && onDownloadCart && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={onPrintCart}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-all"
                  title="طباعة"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button 
                  onClick={onDownloadCart}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-all"
                  title="تحميل"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
            {hasTorch && (
              <button 
                onClick={toggleTorch} 
                className={`p-2.5 rounded-xl transition-all ${torchOn ? 'text-amber-400 bg-amber-500/15 border border-amber-500/20' : 'text-slate-400 bg-slate-800 hover:bg-slate-700'}`}
                title={torchOn ? "إيقاف الفلاش" : "تشغيل الفلاش للإضاءة"}
              >
                {torchOn ? <Zap className="w-4 h-4 fill-amber-400" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className={`p-2.5 rounded-xl transition-all ${soundEnabled ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/20' : 'text-slate-400 bg-slate-800 hover:bg-slate-700'}`}
              title={soundEnabled ? "كتم صوت المسح" : "تشغيل صوت المسح"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => { stopScanning().then(onClose); }} 
              className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Scanner & POS Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Main Visual Terminal Grid (Camera + Info Summary) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Viewfinder Left Column (8 cols on desktop, full on mobile) */}
            <div className={`${scannerMode === 'pos' ? 'md:col-span-7' : 'md:col-span-12'} space-y-3`}>
              <div 
                onClick={handleTapToFocus}
                className={`relative cursor-pointer aspect-[4/3] w-full rounded-2xl bg-black border overflow-hidden flex items-center justify-center transition-all duration-300 ${
                  flashActive 
                    ? 'border-emerald-400 ring-8 ring-emerald-500/30 scale-[0.99] shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'border-slate-800'
                }`}
                title="اضغط على الكاميرا للتركيز التلقائي السريع"
              >
                {/* The Scanner Reader Target Element */}
                <div id={scanContainerId} className="w-full h-full object-cover"></div>

                {/* Interactive Touch-to-Focus visual indicator */}
                {focusRing.visible && (
                  <div 
                    className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
                    style={{ left: focusRing.x, top: focusRing.y }}
                  >
                    <div className="w-14 h-14 border-2 border-dashed border-emerald-400 rounded-full animate-ping opacity-75 absolute" />
                    <div className="w-8 h-8 border-2 border-emerald-400 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                  </div>
                )}

                {/* Glowing Laser Scan Reticle Overlay */}
                {scannerActive && !errorMsg && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Visual Target Area Frame */}
                    <div className="w-[85%] h-[50%] max-w-[400px] max-h-[180px] border-2 border-dashed border-emerald-400/30 rounded-2xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(9,15,29,0.65)]">
                      {/* High Quality Tech Corner brackets */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-[3.5px] border-r-[3.5px] border-emerald-400 rounded-tr-lg" />
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-[3.5px] border-l-[3.5px] border-emerald-400 rounded-tl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-[3.5px] border-r-[3.5px] border-emerald-400 rounded-br-lg" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-[3.5px] border-l-[3.5px] border-emerald-400 rounded-bl-lg" />
                      
                      {/* Glowing Laser line */}
                      <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_2px_rgba(52,211,153,0.95)] animate-precision-laser" />
                    </div>

                    <span className="absolute bottom-3 text-[10px] font-black text-emerald-300 bg-slate-900/90 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-xs">
                      ضع الباركود بداخل المربع
                    </span>
                  </div>
                )}

                {/* Camera activation loading state */}
                {!scannerActive && !errorMsg && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <SpinnerLoading />
                    <p className="text-xs font-bold text-slate-400">جاري تشغيل كاميرا جهازك فائقة الدقة...</p>
                  </div>
                )}

                {errorMsg && (
                  <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center gap-3 overflow-y-auto z-10">
                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
                      <Camera className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-extrabold text-amber-200 max-w-[320px] leading-relaxed">
                      {errorMsg}
                    </p>
                    <div className="flex flex-col gap-2 mt-2 w-full max-w-[260px]">
                      <button 
                        type="button"
                        onClick={requestPermissionDirectly}
                        className="text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        طلب إذن الكاميرا مجدداً
                      </button>
                      
                      <label className="text-xs font-black text-slate-200 bg-slate-800 hover:bg-slate-700 py-2.5 px-4 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2">
                        <span>📷 رفع / التقاط صورة باركود</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>

                      <button 
                        type="button"
                        onClick={() => cameras.length > 0 ? startScanning(selectedCameraId) : startScanning({ facingMode: "environment" })}
                        className="text-xs font-bold text-slate-400 hover:text-white bg-transparent py-1.5 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        إعادة محاولة تشغيل الكاميرا
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera selecting list (Only if multiple cameras are available) */}
              {cameras.length > 1 && (
                <div className="flex items-center gap-2 bg-slate-950/30 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">العدسة الحالية:</span>
                  <div className="relative flex-1">
                    <select 
                      value={selectedCameraId} 
                      onChange={handleCameraChange}
                      className="w-full py-1.5 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] font-bold outline-none cursor-pointer text-right appearance-none pl-7"
                    >
                      {cameras.map((device, index) => (
                        <option key={`scancam-${device.id}-${index}`} value={device.id}>
                          {device.label || `كاميرا خلفية رقم ${index + 1}`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <RefreshCw className="w-3 h-3 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Added Products Sidebar Column (Only in POS mode) */}
            {scannerMode === 'pos' && (
              <div className="md:col-span-5 bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2 flex-1 flex flex-col min-h-[180px]">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-black text-slate-200">🛒 المنتجات المضافة ({cartItemCount})</h4>
                    </div>
                  </div>

                  {/* Scrollable list inside the sidebar */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 max-h-[200px] sm:max-h-[240px] pr-1">
                    {cart.length > 0 ? (
                      cart.map((item, idx) => (
                        <motion.div 
                          key={`scanned-cart-item-${item.product_id}-${idx}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="py-2.5 flex flex-col gap-1 text-right"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-xs font-black text-white truncate max-w-[120px]">{item.name}</span>
                            <span className="text-xs font-black text-emerald-400 font-mono shrink-0">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold">
                              {item.quantity} × {formatPrice(item.price)}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {/* Minus */}
                              <button
                                type="button"
                                onClick={() => onUpdateCartQuantity?.(item.product_id, -1)}
                                className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors active:scale-90 cursor-pointer text-[10px]"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              
                              {/* Plus */}
                              <button
                                type="button"
                                onClick={() => onUpdateCartQuantity?.(item.product_id, 1)}
                                className="w-5 h-5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center transition-colors active:scale-90 cursor-pointer text-[10px]"
                              >
                                <Plus className="w-3 h-3" />
                              </button>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => onRemoveFromCart?.(item.product_id)}
                                className="p-1 text-slate-500 hover:text-rose-500 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="إزالة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 mt-4">
                        <ShoppingCart className="w-6 h-6 text-slate-700 animate-pulse" />
                        <p className="text-[10px] text-slate-500 font-bold">السلة فارغة حالياً</p>
                        <p className="text-[9px] text-slate-600">امسح الباركود لإضافة سلع</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkout Quick Settings Inside Scanner Sidebar */}
                <div className="pt-2.5 border-t border-slate-800/80 space-y-2 shrink-0">
                  <p className="text-[9px] font-black text-slate-400">⚙️ خيارات الدفع السريع:</p>
                  
                  {/* Payment Type Cash/Debt */}
                  {setPaymentType && (
                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950/80 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setPaymentType('cash')}
                        className={`py-1.5 px-2 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          paymentType === 'cash' 
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <DollarSign className="w-2.5 h-2.5" />
                        نقدي (كاش)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentType('debt');
                          setCustomerSearchTerm('');
                          setIsCustomerSearchOpen(true);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[9px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          paymentType === 'debt' 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="البيع بالدَّيْن (يفتح قائمة البحث عن عميل مباشرة)"
                      >
                        <CreditCard className="w-2.5 h-2.5" />
                        دين (آجل)
                      </button>
                    </div>
                  )}

                  {/* Customer Selector for Debt */}
                  {paymentType === 'debt' && setSelectedCustomer && customers.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="relative flex-1">
                        <select
                          value={selectedCustomer || ''}
                          onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : null)}
                          className="w-full py-1 px-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-[9px] font-bold outline-none cursor-pointer pr-5 text-right appearance-none"
                        >
                          <option value="">-- اختر العميل --</option>
                          {customers.map((c, idx) => (
                            <option key={`sc-cust-${c.id ?? 'noid'}-${idx}`} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <User className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-500 pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearchTerm('');
                          setIsCustomerSearchOpen(true);
                        }}
                        className="py-1 px-1.5 bg-sky-950/70 hover:bg-sky-900 border border-sky-800/80 rounded-lg text-sky-300 hover:text-white transition-colors cursor-pointer text-[9px] font-bold flex items-center gap-0.5"
                        title="بحث سريع عن عميل"
                      >
                        <Search className="w-2.5 h-2.5" />
                        <span>بحث</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual Barcode Input Form Backup & File Upload */}
          <div className="flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleManualSubmit} className="flex-1 flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
              <input 
                type="text" 
                placeholder="اكتب رقم باركود السلعة يدوياً أو استخدم قارئ USB..." 
                className="flex-1 py-2 px-3 bg-transparent text-white text-xs font-bold placeholder-slate-500 outline-none pr-2 text-left font-mono"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!manualBarcode.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:bg-slate-800 text-white rounded-lg text-[11px] font-black transition-all cursor-pointer whitespace-nowrap"
              >
                إضافة ➕
              </button>
            </form>

            <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0" title="رفع صورة تحتوي على باركود لمسحها">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>صورة باركود 📷</span>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Explanatory Technology Card Banner at the bottom (Only in POS mode) */}
          {scannerMode === 'pos' && (
            <div className="bg-gradient-to-r from-indigo-950/30 via-slate-900 to-indigo-950/30 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                  <h4 className="text-xs font-black">تقنية مسح المنتجات المستمر والذكي ⚡</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  وجه كاميرا جهازك لملصقات المنتجات واحدة تلو الأخرى وسيقوم النظام تلقائياً بإضافتها وتحديث كمياتها في لوحة المنتجات المضافة بالجانب الأيسر فوراً مع إصدار صوت كاشير رائع.
                </p>
              </div>
              <div className="text-[10px] text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-bold shrink-0 self-start sm:self-center">
                ● النظام متصل وبانتظار المسح المباشر
              </div>
            </div>
          )}
        </div>

        {/* Grand Sticky Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Total display inside scanner (Only in POS mode) */}
          {scannerMode === 'pos' && (
            <div className="text-right w-full sm:w-auto">
              <p className="text-[9px] font-black text-slate-400 uppercase">إجمالي سلة الفاتورة:</p>
              <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">{formatPrice(cartTotal)}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
            {scannerMode === 'pos' && cart.length > 0 && (
              <>
                <button 
                  onClick={onPrintCart}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="طباعة سلة المشتريات / الفاتورة المبدئية"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button 
                  onClick={onDownloadCart}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="تحميل السلة بصيغة PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}

            <button 
              onClick={() => stopScanning().then(onClose)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none"
            >
              إغلاق النافذة
            </button>
            
            {/* Instant checkout direct shortcut button from within scanner */}
            {scannerMode === 'pos' && onCheckout && (
              <button 
                onClick={handleScannerCheckout}
                disabled={cart.length === 0 || isSubmitting || (paymentType === 'debt' && !selectedCustomer)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-600/15 flex items-center justify-center gap-1.5 flex-[2] sm:flex-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerLoading />
                    <span>جاري ترحيل الفاتورة...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4.5 h-4.5" />
                    <span>حفظ عملية البيع والفاتورة</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Customer Search Modal for Barcode Scanner */}
        <AnimatePresence>
          {isCustomerSearchOpen && setSelectedCustomer && (
            <div 
              className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsCustomerSearchOpen(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] shadow-2xl text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <h4 className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-sky-400" />
                    <span>البحث عن عميل للفاتورة</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCustomerSearchOpen(false)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-950/60 border-b border-slate-800">
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="ابحث باسم العميل أو رقم الهاتف..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className="w-full py-2 pr-8 pl-8 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                    {customerSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearchTerm('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                  {customers
                    .filter(c => {
                      if (!customerSearchTerm.trim()) return true;
                      const q = customerSearchTerm.trim().toLowerCase();
                      return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
                    })
                    .map((c, idx) => {
                      const isSelected = selectedCustomer === c.id;
                      return (
                        <div
                          key={`scan-cust-${c.id ?? 'noid'}-${idx}`}
                          onClick={() => {
                            setSelectedCustomer(c.id);
                            setIsCustomerSearchOpen(false);
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-600/80 text-white'
                              : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                              {c.name ? c.name.charAt(0) : 'ع'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{c.name}</p>
                              {c.phone && <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>}
                            </div>
                          </div>
                          <div className="text-left">
                            {c.balance > 0 ? (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800/60 px-1.5 py-0.5 rounded-md">
                                دين: {formatPrice ? formatPrice(c.balance) : c.balance}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">خالص</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SpinnerLoading() {
  return (
    <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
