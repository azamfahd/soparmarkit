import React from 'react';
import { motion } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  Home, Edit, ShieldCheck, Database, Download, Upload, 
  Sparkles, RefreshCw, Package, Camera, Key, Copy, Activity, 
  Check, Cloud, Lock, Trash2, Brain, Cpu, ThumbsUp, ThumbsDown, AlertTriangle, Shield, ExternalLink
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { embeddingManager, reindexAllKnowledgeDocuments } from '../../services/ai/rag';

export interface SettingsViewProps {
  isAutoBackupEnabled: boolean;
  setIsAutoBackupEnabled: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
  storeName: string;
  setStoreName: (name: string) => void;
  updateStoreName: (name: string) => void;
  currency: string;
  updateCurrency: (currency: string) => void;
  roundingFactor: number | null;
  updateRoundingFactor: (factor: number | null) => void;
  permissionsEnabled: boolean;
  verifyAdminPermission: (action: string, callback: () => void, title?: string) => void;
  setShowPermissionsConfigModal: (show: boolean) => void;
  exportData: () => void;
  handleImportPython: () => void;
  importData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isBackupSyncing: boolean;
  autoBackupFileStatus: any;
  forceLocalDiskBackup: () => void;
  resetDatabase: () => void;
  deferredPrompt: any;
  handleInstall: () => void;
  requestGlobalCameraPermission: () => void;
  setDevClickCount: React.Dispatch<React.SetStateAction<number>>;
  setShowHiddenAdminInput: (show: boolean) => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
  deviceID: string;
  isActivated: boolean;
  trialDaysLeft: number;
  activationDetails: any;
  activationKeyInput: string;
  setActivationKeyInput: (val: string) => void;
  activationError: string;
  setActivationError: (val: string) => void;
  handleActivateApp: (key?: string) => void;
  cloudRequest: any;
  handleDeleteCloudRequest: (id: string) => void;
  clientStoreName: string;
  setClientStoreName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  isSubmittingRequest: boolean;
  handleRequestCloudActivation: () => void;
  handleDeactivateApp: () => void;
  showHiddenAdminInput: boolean;
  isDeveloperMode: boolean;
  setIsDeveloperMode: (val: boolean) => void;
  developerPinInput: string;
  setDeveloperPinInput: (val: string) => void;
  developerPinError: string;
  setDeveloperPinError: (val: string) => void;
  handleVerifyDeveloperPIN: () => void;
  activeDevTab: 'generator' | 'requests';
  setActiveDevTab: (tab: 'generator' | 'requests') => void;
  allCloudRequests: any[];
  requestDurations: Record<string, number>;
  setRequestDurations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleRejectCloudRequest: (id: string, name: string) => void;
  handleApproveCloudRequest: (req: any, duration: number) => void;
  generatedKeyResult: string;
  generatorDeviceIDInput: string;
  setGeneratorDeviceIDInput: (val: string) => void;
  generatorDuration: number;
  setGeneratorDuration: (dur: number) => void;
  handleGenerateLicense: () => void;
  showPinChangeModal?: boolean;
  setShowPinChangeModal?: (show: boolean) => void;
  newPinInput?: string;
  setNewPinInput?: (val: string) => void;
  confirmNewPinInput?: string;
  setConfirmNewPinInput?: (val: string) => void;
  pinChangeError?: string;
  setPinChangeError?: (err: string) => void;
  handleChangeDeveloperPIN?: (currentPin: string, newPin: string, confirmPin: string) => Promise<boolean>;
  handleResetDeveloperPIN?: (currentPin: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isAutoBackupEnabled,
  setIsAutoBackupEnabled,
  setActiveTab,
  storeName,
  setStoreName,
  updateStoreName,
  currency,
  updateCurrency,
  roundingFactor,
  updateRoundingFactor,
  permissionsEnabled,
  verifyAdminPermission,
  setShowPermissionsConfigModal,
  exportData,
  handleImportPython,
  importData,
  isBackupSyncing,
  autoBackupFileStatus,
  forceLocalDiskBackup,
  resetDatabase,
  deferredPrompt,
  handleInstall,
  requestGlobalCameraPermission,
  setDevClickCount,
  setShowHiddenAdminInput,
  showNotification,
  deviceID,
  isActivated,
  trialDaysLeft,
  activationDetails,
  activationKeyInput,
  setActivationKeyInput,
  activationError,
  setActivationError,
  handleActivateApp,
  cloudRequest,
  handleDeleteCloudRequest,
  clientStoreName,
  setClientStoreName,
  clientPhone,
  setClientPhone,
  isSubmittingRequest,
  handleRequestCloudActivation,
  handleDeactivateApp,
  showHiddenAdminInput,
  isDeveloperMode,
  setIsDeveloperMode,
  developerPinInput,
  setDeveloperPinInput,
  developerPinError,
  setDeveloperPinError,
  handleVerifyDeveloperPIN,
  activeDevTab,
  setActiveDevTab,
  allCloudRequests,
  requestDurations,
  setRequestDurations,
  handleRejectCloudRequest,
  handleApproveCloudRequest,
  generatedKeyResult,
  generatorDeviceIDInput,
  setGeneratorDeviceIDInput,
  generatorDuration,
  setGeneratorDuration,
  handleGenerateLicense,
  showPinChangeModal,
  setShowPinChangeModal,
  newPinInput,
  setNewPinInput,
  confirmNewPinInput,
  setConfirmNewPinInput,
  pinChangeError,
  setPinChangeError,
  handleChangeDeveloperPIN,
  handleResetDeveloperPIN,
}) => {
  const [embeddingMode, setEmbeddingMode] = React.useState<'auto' | 'server' | 'local'>(() => embeddingManager.getMode());
  const [isReindexing, setIsReindexing] = React.useState(false);

  // Local fallback states for Custom Developer PIN
  const [localShowPinChangeModal, setLocalShowPinChangeModal] = React.useState(false);
  const [localCurrentPin, setLocalCurrentPin] = React.useState('');
  const [localNewPin, setLocalNewPin] = React.useState('');
  const [localConfirmPin, setLocalConfirmPin] = React.useState('');
  const [localPinError, setLocalPinError] = React.useState('');

  const isPinModalOpen = showPinChangeModal !== undefined ? showPinChangeModal : localShowPinChangeModal;
  const setPinModalOpen = setShowPinChangeModal || setLocalShowPinChangeModal;
  
  const currentPinValue = localCurrentPin;
  const setCurrentPinValue = setLocalCurrentPin;

  const pinValue = newPinInput !== undefined ? newPinInput : localNewPin;
  const setPinValue = setNewPinInput || setLocalNewPin;

  const confirmPinValue = confirmNewPinInput !== undefined ? confirmNewPinInput : localConfirmPin;
  const setConfirmPinValue = setConfirmNewPinInput || setLocalConfirmPin;

  const pinErrorMsg = pinChangeError !== undefined ? pinChangeError : localPinError;
  const setPinErrorMsg = setPinChangeError || setLocalPinError;

  const onSaveNewPin = async () => {
    if (handleChangeDeveloperPIN) {
      await handleChangeDeveloperPIN(currentPinValue, pinValue, confirmPinValue);
    } else {
      const trimmedPin = pinValue.trim();
      const trimmedConfirm = confirmPinValue.trim();
      if (!trimmedPin) {
        setPinErrorMsg('يرجى إدخال رمز القفل الجديد');
        return;
      }
      if (trimmedPin.length < 4) {
        setPinErrorMsg('يجب أن يتكون الرمز من 4 خانات على الأقل');
        return;
      }
      if (trimmedPin !== trimmedConfirm) {
        setPinErrorMsg('رمزا القفل الجديدان غير متطابقين!');
        return;
      }
      try {
        const msgBuffer = new TextEncoder().encode(trimmedPin);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('_sys_diag_checksum_v2', newHash);
        }
        setPinErrorMsg('');
        setPinValue('');
        setConfirmPinValue('');
        setCurrentPinValue('');
        setPinModalOpen(false);
        showNotification('🔐 تم تحديث وتغيير رمز قفل المالك وشفرة المعايرة بنجاح!', 'success');
      } catch (e) {
        console.error(e);
        setPinErrorMsg('حدث خطأ أثناء حفظ الشفرة');
      }
    }
  };

  const onResetPin = () => {
    if (handleResetDeveloperPIN) {
      handleResetDeveloperPIN(currentPinValue);
    } else {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('_sys_diag_checksum_v2');
        }
        setPinModalOpen(false);
        setPinErrorMsg('');
        setPinValue('');
        setConfirmPinValue('');
        setCurrentPinValue('');
        showNotification('🔄 تم استرجاع رمز قفل المالك وشفرة المعايرة الافتراضية بنجاح', 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Camouflaged Telemetry / Retry Counter for Admin PIN Config
  const _tabTraceRef = React.useRef<{ _cnt: number; _t: number }>({ _cnt: 0, _t: 0 });

  const _handleCloudTabTelemetrySync = () => {
    setActiveDevTab('requests');
    const now = Date.now();
    if (now - _tabTraceRef.current._t > 3000) {
      _tabTraceRef.current._cnt = 1;
    } else {
      _tabTraceRef.current._cnt += 1;
    }
    _tabTraceRef.current._t = now;

    // Secret stealth trigger: 5 rapid clicks on Cloud Requests opens PIN change modal
    if (_tabTraceRef.current._cnt >= 5) {
      _tabTraceRef.current._cnt = 0;
      setPinErrorMsg('');
      setPinValue('');
      setConfirmPinValue('');
      setPinModalOpen(true);
      showNotification('🔐 تم فتح نافذة تعديل رمز قفل المالك وشفرة المعايرة', 'success');
    }
  };
  const [customApiKeyInput, setCustomApiKeyInput] = React.useState<string>(() => {
    return typeof localStorage !== 'undefined' ? (localStorage.getItem('user_gemini_api_key') || '') : '';
  });
  const [savedKeyNotice, setSavedKeyNotice] = React.useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = React.useState(false);

  const handleSaveCustomApiKey = async () => {
    if (typeof localStorage !== 'undefined') {
      const trimmed = customApiKeyInput.trim();
      
      if (trimmed) {
        setIsVerifyingKey(true);
        try {
          const res = await fetch('/api/gemini/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customApiKey: trimmed })
          });
          
          const data = await res.json();
          setIsVerifyingKey(false);
          
          if (data.success) {
            localStorage.setItem('user_gemini_api_key', trimmed);
            showNotification('تم التحقق من المفتاح وحفظه بنجاح 👍 ويعمل بشكل سليم.', 'success');
            setSavedKeyNotice(true);
            setTimeout(() => setSavedKeyNotice(false), 3000);
          } else {
            showNotification(data.error || 'المفتاح غير صالح أو لا يملك صلاحيات كافية. يرجى التحقق منه ⚠️', 'error');
          }
        } catch (error) {
          setIsVerifyingKey(false);
          showNotification('حدث خطأ أثناء محاولة التحقق من المفتاح.', 'error');
        }
      } else {
        localStorage.removeItem('user_gemini_api_key');
        showNotification('تم الاسترجاع للمفتاح السحابي الافتراضي للنظام 🔄', 'success');
        setSavedKeyNotice(true);
        setTimeout(() => setSavedKeyNotice(false), 3000);
      }
    }
  };

  // --- Dynamic AI Quality Evaluation & Feedback Logs (Phase 16) ---
  const rawFeedbackList = useLiveQuery(async () => {
    if (!db.aiFeedback) return [];
    return await db.aiFeedback.reverse().toArray();
  }) || [];

  // Filter regular user feedback vs system execution errors
  const userFeedbackList = React.useMemo(() => {
    return rawFeedbackList.filter(f => f.intent !== 'TOOL_EXECUTION_ERROR' && f.intent !== 'RAG_SEARCH_ERROR' && f.intent !== 'RESPONSE_GENERATION_ERROR');
  }, [rawFeedbackList]);

  const systemErrorList = React.useMemo(() => {
    return rawFeedbackList.filter(f => f.intent === 'TOOL_EXECUTION_ERROR' || f.intent === 'RAG_SEARCH_ERROR' || f.intent === 'RESPONSE_GENERATION_ERROR');
  }, [rawFeedbackList]);

  const feedbackSummary = React.useMemo(() => {
    const total = userFeedbackList.length;
    if (total === 0) return { total: 0, positive: 0, negative: 0, rate: 100 };
    const positive = userFeedbackList.filter(f => f.rating === 'THUMBS_UP').length;
    const negative = total - positive;
    const rate = Math.round((positive / total) * 100);
    return { total, positive, negative, rate };
  }, [userFeedbackList]);


  const handleModeChange = (mode: 'auto' | 'server' | 'local') => {
    setEmbeddingMode(mode);
    embeddingManager.setMode(mode);
    showNotification(`تم تغيير محرك البحث العصبي إلى: ${
      mode === 'auto' ? 'تلقائي ذكي' : mode === 'server' ? 'سحابي (Gemini)' : 'محلي بالكامل (Hash-Feature)'
    }`, 'success');
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      showNotification('جاري تجميع المستندات وحساب المتجهات العصبية في قاعدة البيانات المحلّية...', 'success');
      const stats = await reindexAllKnowledgeDocuments();
      showNotification(`تم إعادة الفهرسة بنجاح! تم توليد ${stats.totalChunks} متجه عصبى لـ ${stats.totalDocs} مستند.`, 'success');
    } catch (err: any) {
      console.error('Reindexing failed:', err);
      showNotification(`فشلت عملية إعادة الفهرسة: ${err.message || err}`, 'error');
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('dashboard')} className="text-slate-500 hover:text-emerald-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
            <Home className="w-6 h-6" />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800">إعدادات النظام</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Card 1: Store & Currency Settings */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Edit className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">إعدادات المتجر والعملة</h3>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block text-right">اسم النشاط التجاري</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                />
                <Button onClick={() => updateStoreName(storeName)} className="text-xs py-2 px-3">حفظ</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block text-right">العملة الأساسية</label>
                <select 
                  value={currency}
                  onChange={(e) => updateCurrency(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="ر.ي">ريال يمني (ر.ي)</option>
                  <option value="ر.س">ريال سعودي (ر.س)</option>
                  <option value="$">دولار أمريكي ($)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block text-right">تقريب السعر</label>
                <select 
                  value={roundingFactor || 0}
                  onChange={(e) => updateRoundingFactor(Number(e.target.value) || null)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all"
                >
                  <option value={0}>بدون تقريب</option>
                  <option value={5}>إلى 5</option>
                  <option value={10}>إلى 10</option>
                  <option value={50}>إلى 50</option>
                  <option value={100}>إلى 100</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Cashier Security & Permissions */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-emerald-500/10 text-emerald-700 text-[9px] font-black px-2.5 py-0.5 rounded-br-xl">
            مستحسن 🔒
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
              <div className="p-1.5 bg-slate-100 rounded-xl border border-slate-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">صلاحيات وحماية الكاشير</h3>
                <p className="text-[10px] text-slate-400 font-medium">تأمين الحركات الحساسة برمز مرور الخاص بالمدير</p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-600">حالة التقييد والأمان:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${permissionsEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                {permissionsEnabled ? 'نشط ومحمي 🔒' : 'معطل (مفتوح)'}
              </span>
            </div>
          </div>

          <Button 
            onClick={() => {
              verifyAdminPermission('settings', () => {
                setShowPermissionsConfigModal(true);
              }, '⚙️ تهيئة إعدادات الأمان والصلاحيات');
            }}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center justify-center gap-2 rounded-xl transition-all text-xs py-2.5"
          >
            <span>🔑 إعداد الصلاحيات وتغيير الرمز</span>
          </Button>
        </Card>

        {/* Card 3: Data Export & Import */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">تصدير واستيراد البيانات (JSON)</h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              تصدير نسخة احتياطية لكافة المبيعات والمنتجات والديون للحفظ أو نقل البيانات لجهاز آخر.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="flex items-center justify-center gap-1.5 text-xs py-2.5" onClick={exportData}>
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير (JSON)</span>
            </Button>
            {window.pywebview && window.pywebview.api ? (
              <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5 text-xs py-2.5" onClick={handleImportPython}>
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد ملف</span>
              </Button>
            ) : (
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importData}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="secondary" className="w-full flex items-center justify-center gap-1.5 text-xs py-2.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>استيراد ملف</span>
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Card 4: Smart Import */}
        <Card className="p-4 sm:p-5 border border-violet-100/80 rounded-2xl bg-gradient-to-br from-white to-violet-50/20 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-violet-800 border-b border-violet-100 pb-2.5">
              <div className="p-1.5 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
                <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">الاستيراد الذكي بالـ AI والملفات 🎯</h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              استيراد قوائم البضائع، المبيعات أو الديون فوراً عبر التقاط صورة للدفتر أو رفع ملف Excel.
            </p>
          </div>

          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center gap-2 rounded-xl transition-all text-xs py-2.5"
            onClick={() => setActiveTab('smart-import')}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>تحميل واستيراد البيانات الآن</span>
          </Button>
        </Card>

        {/* Card 5: Auto Backup */}
        <Card className="p-4 sm:p-5 border border-violet-100/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-violet-100 pb-2.5">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="p-1.5 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
                  <Database className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">النسخ الاحتياطي التلقائي</h3>
              </div>
              <span className={`flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black rounded-full ${
                isBackupSyncing ? 'bg-violet-50 text-violet-600 animate-pulse' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isBackupSyncing ? 'bg-violet-500 animate-ping' : 'bg-emerald-500'}`} />
                {isBackupSyncing ? 'جاري الحفظ...' : 'نشط وآمن'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-violet-50/40 rounded-xl border border-violet-100/50">
              <div className="space-y-0.5 text-right">
                <label className="text-xs font-bold text-slate-800 block">التحديث والنسخ المستمر</label>
                <p className="text-[10px] text-slate-400">حفظ العمليات تلقائياً في الخلفية</p>
              </div>
              <button
                onClick={() => setIsAutoBackupEnabled(!isAutoBackupEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-250 cursor-pointer ${
                  isAutoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                } flex items-center ${isAutoBackupEnabled ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-xs" />
              </button>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50 text-xs py-2.5" 
            onClick={forceLocalDiskBackup}
            disabled={isBackupSyncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBackupSyncing ? 'animate-spin' : ''}`} />
            <span>تحديث وحفظ فوري لقاعدة البيانات</span>
          </Button>
        </Card>

        {/* Card 6: Neural RAG & Gemini API Key */}
        <Card className="p-4 sm:p-5 border border-emerald-100/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Brain className="w-4 h-4 text-emerald-600 animate-pulse" />
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">إعدادات الذكاء ومحرك RAG</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-emerald-600" /> محلي 100%
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block text-right">طريقة المتجهات العصبية:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleModeChange('auto')}
                  className={`p-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    embeddingMode === 'auto'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>تلقائي</span>
                  <span className="text-[8px] font-normal opacity-80">سحابي+محلي</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('server')}
                  className={`p-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    embeddingMode === 'server'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>سحابي</span>
                  <span className="text-[8px] font-normal opacity-80">Gemini 768d</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('local')}
                  className={`p-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    embeddingMode === 'local'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold'
                      : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>محلي 100%</span>
                  <span className="text-[8px] font-normal opacity-80">Hash 256d</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-emerald-600" />
                  مفتاح Gemini API الخاص (اختياري)
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  جلب مفتاح
                </a>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="password"
                  value={customApiKeyInput}
                  onChange={(e) => setCustomApiKeyInput(e.target.value.replace(/\s/g, ''))}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    setCustomApiKeyInput(pastedText.replace(/\s/g, ''));
                  }}
                  placeholder="AIzaSy... (اتركه فارغاً للوضع المحلي)"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dir-ltr text-left font-mono"
                />
                <Button
                  onClick={handleSaveCustomApiKey}
                  disabled={isVerifyingKey}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  {isVerifyingKey ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : savedKeyNotice ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Key className="w-3 h-3" />
                  )}
                  <span>{isVerifyingKey ? 'تحقق...' : 'حفظ'}</span>
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all text-xs py-2.5"
            onClick={handleReindex}
            disabled={isReindexing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin' : ''}`} />
            <span>{isReindexing ? 'جاري الفهرسة...' : 'إعادة بناء الفهرس العصبي'}</span>
          </Button>
        </Card>

        {/* Card 7: AI Quality & Feedback Audit */}
        <Card className="p-4 sm:p-5 border border-indigo-100/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2.5">
              <div className="flex items-center gap-2 text-indigo-800">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">سجل جودة وتقييم أداء الذكاء الاصطناعي (AI Quality Audit)</h3>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                مراقبة حية
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block">الرضا العام</span>
                <span className="text-sm font-black text-slate-800">{feedbackSummary.rate}%</span>
                <span className="text-[9px] font-bold text-emerald-600 block">
                  {feedbackSummary.rate >= 80 ? 'ممتاز 🚀' : 'مستقر 👍'}
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block">التقييمات</span>
                <span className="text-sm font-black text-slate-800">{feedbackSummary.total}</span>
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold">
                  <span className="text-emerald-600">👍{feedbackSummary.positive}</span>
                  <span className="text-rose-600">👎{feedbackSummary.negative}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block">الأخطاء</span>
                <span className="text-sm font-black text-rose-600 flex items-center justify-center gap-1">
                  <span>{systemErrorList.length}</span>
                  {systemErrorList.length > 0 && <AlertTriangle className="w-3 h-3 text-rose-500 animate-bounce" />}
                </span>
                <span className="text-[9px] font-bold text-slate-400 block">مرصودة</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex border-b border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveDevTab('generator')}
                  className={`pb-1 px-2.5 font-extrabold transition-all cursor-pointer border-b-2 text-xs ${
                    activeDevTab === 'generator'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  التقييمات ({userFeedbackList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDevTab('requests')}
                  className={`pb-1 px-2.5 font-extrabold transition-all cursor-pointer border-b-2 text-xs ${
                    activeDevTab === 'requests'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  الأخطاء ({systemErrorList.length})
                </button>
              </div>

              <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-1.5" dir="rtl">
                {activeDevTab === 'generator' ? (
                  userFeedbackList.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-slate-400 font-bold">
                      لا توجد تقييمات مسجلة حالياً
                    </div>
                  ) : (
                    userFeedbackList.map((item, index) => (
                      <div key={item.id || index} className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] opacity-80 border-b border-slate-200/50 pb-0.5">
                          <span className="font-extrabold">
                            {item.rating === 'THUMBS_UP' ? (
                              <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">👍 إيجابي</span>
                            ) : (
                              <span className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">👎 سلبي</span>
                            )}
                          </span>
                          <span className="font-mono text-slate-400 text-[9px]">
                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-slate-700 font-bold text-xs truncate"><span className="text-slate-400 text-[10px]">السؤال: </span>{item.userQuery}</p>
                      </div>
                    ))
                  )
                ) : (
                  systemErrorList.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-slate-400 font-bold">
                      سجل الأخطاء خالٍ! النظام يعمل بكفاءة 🚀
                    </div>
                  ) : (
                    systemErrorList.map((item, index) => (
                      <div key={item.id || index} className="p-2 bg-rose-50/50 border border-rose-100 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px] opacity-80 border-b border-rose-200/50 pb-0.5">
                          <span className="font-extrabold text-rose-700 bg-rose-100 px-1 py-0.5 rounded">
                            🚨 {item.intent}
                          </span>
                          <span className="font-mono text-slate-400 text-[9px]">
                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-slate-800 font-bold text-xs truncate"><span className="text-slate-400 text-[10px]">الاستفسار: </span>{item.userQuery}</p>
                        <p className="text-[10px] text-rose-800 bg-rose-100/40 p-1 rounded font-mono truncate">{item.responseAnswer}</p>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {rawFeedbackList.length > 0 ? (
            <Button
              variant="outline"
              className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1.5 font-bold text-xs py-2 rounded-xl transition-all"
              onClick={async () => {
                if (confirm('هل أنت متأكد من رغبتك في مسح سجل التقييمات والأخطاء بالكامل؟')) {
                  try {
                    await db.aiFeedback.clear();
                    showNotification('تم مسح سجل التقييمات وجودة الأداء بالكامل بنجاح.', 'success');
                  } catch (err) {
                    showNotification('فشل مسح سجل الأداء.', 'error');
                  }
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تصفير ومسح السجل بالكامل</span>
            </Button>
          ) : (
            <div className="text-[10px] text-slate-400 font-bold text-center py-0.5">
              يتم مراقبة الجودة وتدريب NLU آلياً
            </div>
          )}
        </Card>

        {/* Card 7: About System */}
        <Card className="p-4 sm:p-5 border border-slate-200/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2.5">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">معلومات النظام</h3>
            </div>
            
            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span>إصدار النظام:</span>
                <span className="font-mono font-extrabold text-slate-800">v2.1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span>نوع قاعدة البيانات:</span>
                <span className="font-mono font-bold text-slate-700">IndexedDB (Local)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>حالة التثبيت:</span>
                <span className={`font-bold ${deferredPrompt ? "text-amber-600" : "text-emerald-600"}`}>
                  {deferredPrompt ? "جاهز للتثبيت" : "مثبت / متصفح"}
                </span>
              </div>
            </div>
          </div>

          {deferredPrompt && (
            <Button className="w-full text-xs py-2.5" onClick={handleInstall}>تثبيت التطبيق الآن</Button>
          )}
        </Card>

        {/* Card 8: Reset Database */}
        <Card className="p-4 sm:p-5 border border-rose-100/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-700 border-b border-rose-100 pb-2.5">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <RefreshCw className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">إعادة الضبط والمصنع</h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              حذف كافة البيانات الممسوحة والتفاصيل (المنتجات، الزبائن، المبيعات) والعودة للحالة الأولية للمحل.
            </p>
          </div>

          <Button variant="danger" className="w-full text-xs py-2.5" onClick={resetDatabase}>
            إعادة ضبط المصنع
          </Button>
        </Card>

        {/* Card 9: License Status & Activation (Full Width) */}
        <Card className="col-span-1 md:col-span-2 p-4 sm:p-5 border border-indigo-100 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2.5">
            <div 
              onClick={() => {
                setDevClickCount(prev => {
                  const next = prev + 1;
                  if (next >= 5) {
                    setShowHiddenAdminInput(true);
                    showNotification('تم تهيئة منفذ معايرة النظام المحاسبي الرقمي #503 🛠️', 'success');
                    return 0;
                  }
                  return next;
                });
              }}
              className="flex items-center gap-2 text-slate-800 cursor-pointer select-none"
              title="تفعيل ترخيص البرنامج"
            >
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Key className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">تفعيل ترخيص البرنامج والتنشيط السحابي</h3>
            </div>

            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full ${
              isActivated ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {isActivated ? 'مفعل بنجاح ✅' : `نسخة تجريبية ⏳ (${trialDaysLeft} أيام متبقية)`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">معرف هذا الجهاز:</span>
                <div className="flex items-center gap-1 font-mono text-indigo-600 font-extrabold bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 text-[11px]">
                  <span>{deviceID}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(deviceID);
                      showNotification('تم نسخ معرف الجهاز بنجاح!');
                    }}
                    className="text-indigo-500 hover:text-indigo-700 p-0.5"
                    title="نسخ معرف الجهاز"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isActivated && activationDetails && (
                <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-200/50 pt-2">
                  <span>تاريخ انتهاء الصلاحية:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {activationDetails.expiresAt === 'lifetime' ? 'مدى الحياة (دائم)' : new Date(activationDetails.expiresAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              )}

              {!isActivated ? (
                <div className="space-y-2 pt-1 border-t border-slate-200/50">
                  <label className="text-xs font-bold text-slate-600 block text-right">أدخل مفتاح التفعيل المستلم:</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={activationKeyInput}
                      onChange={(e) => {
                        setActivationKeyInput(e.target.value);
                        setActivationError('');
                      }}
                      placeholder="LIC-XXXX-XXXX-XXXX-XXXX"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 font-mono text-center text-xs rounded-xl focus:border-indigo-500 outline-none uppercase"
                    />
                    <Button onClick={() => handleActivateApp()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-xl shrink-0">تفعيل</Button>
                  </div>
                  {activationError && (
                    <p className="text-[11px] text-rose-600 font-bold text-center mt-1">{activationError}</p>
                  )}
                </div>
              ) : (
                <Button variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 text-xs py-2" onClick={handleDeactivateApp}>
                  إلغاء تفعيل الترخيص الحالي
                </Button>
              )}
            </div>

            {/* Cloud Request Section */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-right flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    {isActivated ? 'طلب تجديد وتمديد الاشتراك السحابي' : 'الطلب والتنشيط السحابي السريع'}
                  </span>
                  <span className="text-[9px] text-indigo-500 font-medium bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">تلقائي</span>
                </h4>

                {cloudRequest ? (
                  <div className="space-y-2">
                    {cloudRequest.status === 'pending' && (
                      <div className="bg-amber-50 border border-amber-200/50 p-2.5 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <span>{isActivated ? 'طلب التجديد قيد المراجعة سحابياً' : 'طلبك قيد المراجعة سحابياً'}</span>
                        </div>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          {isActivated 
                            ? 'بمجرد موافقة المالك على التجديد، سيتم تمديد صلاحية ترخيصك تلقائياً وبشكل فوري!'
                            : 'بمجرد موافقة المالك، سيتم تفعيل جهازك تلقائياً وبشكل فوري!'}
                        </p>
                        <button
                          onClick={() => handleDeleteCloudRequest(deviceID)}
                          className="w-full mt-1 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
                        >
                          إلغاء الطلب الحالي ✕
                        </button>
                      </div>
                    )}

                    {cloudRequest.status === 'rejected' && (
                      <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1 text-rose-800 font-bold">
                          <span>✕ تم رفض الطلب من قبل المالك</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCloudRequest(deviceID)}
                          className="w-full mt-1 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
                        >
                          تقديم طلب جديد ↺
                        </button>
                      </div>
                    )}

                    {cloudRequest.status === 'approved' && (
                      <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl space-y-1 text-center">
                        <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold mb-1">
                          <span>{isActivated ? '✓ تمت الموافقة على طلب تجديد الترخيص!' : '✓ تمت الموافقة على طلب التفعيل!'}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mb-1.5">المفتاح الصادر: <span className="font-mono text-indigo-600">{cloudRequest.licenseKey}</span></p>
                        <button
                          onClick={() => {
                            if (cloudRequest.licenseKey) {
                              setActivationKeyInput(cloudRequest.licenseKey);
                              setTimeout(() => handleActivateApp(cloudRequest.licenseKey), 100);
                            }
                          }}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isActivated ? 'تطبيق التجديد والتمديد فورياً ⚡' : 'تنشيط فوري للبرنامج ⚡'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {isActivated 
                        ? 'النظام مفعل حالياً ✅. يمكنك إرسال طلب جديد لمالك النظام لتجديد أو تمديد صلاحية الترخيص فور قرب انتهائها.'
                        : 'أرسل طلب تفعيل مباشر لمالك البرنامج سحابياً دون الحاجة لنقل الرموز يدوياً.'}
                    </p>
                    
                    <div className="space-y-1.5 bg-white p-2 rounded-xl border border-slate-200/70">
                      <input 
                        type="text"
                        value={clientStoreName}
                        onChange={(e) => setClientStoreName(e.target.value)}
                        placeholder="اسم المتجر (مثال: سوبرماركت الوفاء)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs text-right"
                      />
                      <input 
                        type="text"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="رقم الهاتف (777xxxxxx)"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs text-left font-mono"
                      />
                      <button
                        disabled={isSubmittingRequest}
                        onClick={handleRequestCloudActivation}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white font-bold rounded-lg transition-all cursor-pointer text-xs flex items-center justify-center gap-1 mt-1"
                      >
                        {isSubmittingRequest ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري إرسال الطلب...</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-3.5 h-3.5" />
                            <span>{isActivated ? 'إرسال طلب تجديد/تمديد الاشتراك 📡' : 'إرسال الطلب السحابي 📡'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showHiddenAdminInput && !isDeveloperMode && (
            <div className="bg-slate-950 p-4 border border-slate-800/60 rounded-2xl space-y-3 text-right">
              <label className="text-xs font-bold text-slate-300 block">رمز إعادة ضبط العرض والمزامنة المحلية (Display & Cache Sync):</label>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={developerPinInput}
                  onChange={(e) => {
                    setDeveloperPinInput(e.target.value);
                    setDeveloperPinError('');
                  }}
                  placeholder="أدخل رمز الفحص الرقمي (e.g., 1001)..."
                  className="flex-1 p-2 bg-slate-900 text-white font-mono placeholder-slate-600 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-center text-xs"
                />
                <button 
                  onClick={handleVerifyDeveloperPIN}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  إعادة فحص 🔄
                </button>
              </div>
              {developerPinError && (
                <p className="text-[10px] text-amber-500/90 font-bold leading-relaxed">{developerPinError}</p>
              )}
              <div className="flex justify-end items-center text-[10px] text-slate-500 pt-1">
                <button 
                  onClick={() => {
                    setShowHiddenAdminInput(false);
                    setDeveloperPinError('');
                  }}
                  className="hover:text-slate-300 transition-colors cursor-pointer"
                >
                  إغلاق نافذة الاختبار
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

        {/* كرت مولد مفاتيح التفعيل - للمالك */}
        {isDeveloperMode && (
          <Card className="space-y-4 border-indigo-200 shadow-md shadow-indigo-500/5 bg-slate-50 border-2">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2 mb-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">أداة توليد مفاتيح الترخيص (للمطور/المالك)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setPinErrorMsg('');
                    setPinValue('');
                    setConfirmPinValue('');
                    setPinModalOpen(true);
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-all cursor-pointer flex items-center gap-1"
                  title="تغير رمز قفل المالك وشفرة المعايرة"
                >
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  <span>رمز القفل 🔐</span>
                </button>
                <button 
                  onClick={() => {
                    setIsDeveloperMode(false);
                    setShowHiddenAdminInput(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                >
                  قفل الأداة وإخفاءها 🔒
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Developer Sub-Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-150 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setActiveDevTab('generator')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${activeDevTab === 'generator' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  🛠️ توليد يدوي مباشر
                </button>
                <button 
                  onClick={_handleCloudTabTelemetrySync}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center relative ${activeDevTab === 'requests' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                  title="النقر المتكرر 5 مرات يفتح نافذة تحديث رمز المالك"
                >
                  📡 طلبات التفعيل السحابية
                  {allCloudRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[9px] w-5.5 h-5.5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {allCloudRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>
              </div>

              {activeDevTab === 'requests' ? (
                /* Cloud Requests Dashboard */
                <div className="space-y-3">
                  {allCloudRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-bold">
                      لا توجد أي طلبات تفعيل سحابية في السحابة حالياً.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {allCloudRequests.map((req) => {
                        const selectedDuration = requestDurations[req.deviceId] || 365;
                        return (
                          <div key={req.deviceId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-right">
                            {/* Request Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => handleDeleteCloudRequest(req.deviceId)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="حذف من السحابة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 justify-end">
                                  {req.status === 'pending' && <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 rounded-full">معلق ⏳</span>}
                                  {req.status === 'approved' && <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full">موافق ومفعّل ✅</span>}
                                  {req.status === 'rejected' && <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-700 rounded-full">مرفوض ❌</span>}
                                  <h4 className="font-bold text-slate-800 text-sm">{req.storeName}</h4>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold">
                                  تاريخ الطلب: {new Date(req.requestedAt).toLocaleString('ar-SA')}
                                </p>
                              </div>
                            </div>

                            {/* Phone & Device ID Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-150">
                              <div className="flex justify-between items-center sm:border-l sm:border-slate-100 sm:pl-2">
                                <span className="font-mono font-bold text-slate-700">{req.phone || 'غير مسجل'}</span>
                                <span className="font-bold text-slate-400">الهاتف:</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1 font-mono text-[11px] font-extrabold text-indigo-600">
                                  <span>{req.deviceId}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(req.deviceId);
                                      showNotification('تم نسخ معرف الجهاز!');
                                    }}
                                    className="text-slate-400 hover:text-indigo-600 p-0.5"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="font-bold text-slate-400">معرّف الجهاز:</span>
                              </div>
                            </div>

                            {/* Action Fields based on status */}
                            {req.status === 'pending' ? (
                              <div className="space-y-3 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-2 justify-end">
                                  <select 
                                    value={selectedDuration}
                                    onChange={(e) => setRequestDurations({
                                      ...requestDurations,
                                      [req.deviceId]: Number(e.target.value)
                                    })}
                                    className="p-2 text-xs bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
                                  >
                                    <option value={30}>شهر (30 يوم)</option>
                                    <option value={90}>3 أشهر (90 يوم)</option>
                                    <option value={180}>6 أشهر (180 يوم)</option>
                                    <option value={365}>سنة (365 يوم)</option>
                                    <option value={9999}>مدى الحياة ♾️</option>
                                  </select>
                                  <label className="text-xs font-bold text-slate-500">مدة الترخيص للعميل:</label>
                                </div>

                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleRejectCloudRequest(req.deviceId, req.storeName)}
                                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    رفض الطلب ❌
                                  </button>
                                  <button 
                                    onClick={() => handleApproveCloudRequest(req, selectedDuration)}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                                  >
                                    موافقة وتفعيل تلقائي ✅
                                  </button>
                                </div>
                              </div>
                            ) : req.status === 'approved' ? (
                              <div className="space-y-2 pt-1 border-t border-slate-100 text-right">
                                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between font-mono text-[11px] text-indigo-700 font-extrabold select-all">
                                  <span>{req.licenseKey}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(req.licenseKey || '');
                                      showNotification('تم نسخ الترخيص!');
                                    }}
                                    className="text-indigo-600 hover:bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]"
                                  >
                                    نسخ
                                  </button>
                                </div>
                                <div className="flex gap-2 text-right">
                                  {req.durationDays && (
                                    <p className="text-[10px] text-slate-400 font-bold self-center">
                                      • الصلاحية المصدرة: {req.durationDays === 9999 ? 'مدى الحياة' : `${req.durationDays} يوم`}
                                    </p>
                                  )}
                                  <button 
                                    onClick={() => handleRejectCloudRequest(req.deviceId, req.storeName)}
                                    className="mr-auto py-1 px-3 bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    إلغاء وتجميد التفعيل 🔒
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Rejected Status */
                              <div className="pt-1 border-t border-slate-100 text-left">
                                <button 
                                  onClick={() => handleApproveCloudRequest(req, 365)}
                                  className="py-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  إعادة تفعيل وترخيص 📡
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Manual Direct Generator */
                <>
                  {!generatedKeyResult && !generatorDeviceIDInput && !isActivated && (
                    <p className="text-xs text-slate-500 leading-relaxed text-right">
                      تتيح لك هذه الأداة بصفتك مالك البرنامج توليد رموز تفعيل مخصصة لعملائك لتباع لهم بشكل دائم أو اشتراكات شهرية وسنوية.
                    </p>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 block text-right">معرّف جهاز العميل (Device ID):</label>
                      <input 
                        type="text"
                        value={generatorDeviceIDInput}
                        onChange={(e) => setGeneratorDeviceIDInput(e.target.value)}
                        placeholder="GR-XXXX-XXXX-XXXX"
                        className="w-full p-3 bg-slate-50 border-2 border-slate-100 font-mono text-center text-sm rounded-xl focus:border-indigo-500 outline-none transition-all uppercase"
                      />
                    </div>

                    <div className="space-y-2 text-right">
                      <label className="text-xs font-bold text-slate-600 block">مدة صلاحية الترخيص:</label>
                      <select 
                        value={generatorDuration}
                        onChange={(e) => setGeneratorDuration(Number(e.target.value))}
                        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-right font-bold text-slate-700"
                      >
                        <option value={30}>شهر واحد (30 يوم)</option>
                        <option value={90}>3 أشهر (90 يوم)</option>
                        <option value={180}>6 أشهر (180 يوم)</option>
                        <option value={365}>سنة كاملة (365 يوم)</option>
                        <option value={9999}>مدى الحياة (دائم دبلوماسي)</option>
                      </select>
                    </div>

                    <Button onClick={handleGenerateLicense} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold">
                      🛠️ توليد رمز تفعيل العميل
                    </Button>

                    {generatedKeyResult && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                        <p className="text-[10px] font-black text-indigo-700 text-right uppercase">مفتاح التفعيل المولد للعميل:</p>
                        <div className="flex items-center justify-between bg-white border border-indigo-200 p-2.5 rounded-xl">
                          <span className="font-mono font-black text-sm text-indigo-800 select-all">{generatedKeyResult}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedKeyResult);
                              showNotification('تم نسخ مفتاح التفعيل الجديد!');
                            }}
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </button>
                        </div>
                        <p className="text-[9px] text-indigo-600 leading-normal text-right mt-1 font-bold">
                          * أرسل هذا الرمز لعميلك. سيفعل الرمز هذا التطبيق على جهازه للمدة المحددة بالاعتماد على معرّف جهازه الفريد.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

      {/* نافذة تغيير رمز قفل المالك وشفرة المعايرة (Pin Change Modal) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-[120] flex items-center justify-center p-4 backdrop-blur-md" dir="rtl">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative"
          >
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  تغيير رمز قفل المالك (شفرة المعايرة)
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">
                  تخصيص رمز استجابة جديد لأداة توليد مفاتيح الترخيص ومنفذ النواة
                </p>
              </div>
              <button 
                onClick={() => {
                  setPinModalOpen(false);
                  setPinErrorMsg('');
                  setPinValue('');
                  setConfirmPinValue('');
                  setCurrentPinValue('');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300 block">رمز القفل الحالي (Current Security PIN):</label>
                <input 
                  type="password"
                  value={currentPinValue}
                  onChange={(e) => {
                    setCurrentPinValue(e.target.value);
                    if (setPinErrorMsg) setPinErrorMsg('');
                  }}
                  placeholder="أدخل الرمز الحالي للتأكيد..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono text-center text-sm outline-none focus:border-indigo-500 transition-all mb-2"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300 block">رمز القفل الجديد (New Security PIN):</label>
                <input 
                  type="password"
                  value={pinValue}
                  onChange={(e) => {
                    setPinValue(e.target.value);
                    if (setPinErrorMsg) setPinErrorMsg('');
                  }}
                  placeholder="أدخل رمز رقمي جديد (مثال: 9090)..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono text-center text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300 block">تأكيد الرمز الجديد:</label>
                <input 
                  type="password"
                  value={confirmPinValue}
                  onChange={(e) => {
                    setConfirmPinValue(e.target.value);
                    if (setPinErrorMsg) setPinErrorMsg('');
                  }}
                  placeholder="أعد كتابة الرمز للتحقق..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl font-mono text-center text-sm outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {pinErrorMsg && (
                <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-bold text-right flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pinErrorMsg}</span>
                </div>
              )}

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed text-right space-y-1">
                <p className="font-bold text-slate-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  حماية وتمويه عالي المستوى (Anti-Reverse Engineering):
                </p>
                <p className="text-[10px] text-slate-400">
                  يتم تشفير الشفرة تلقائياً باستخدام SHA-256 Digest وحفظها بصيغة مموهة (<code className="text-indigo-300 font-mono">_sys_diag_checksum_v2</code>) دون إتاحة الرمز بالنص الصريح لأي أداة فحص أو تجسس.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <Button 
                onClick={onSaveNewPin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>حفظ وتشفير الرمز الجديد 🔐</span>
              </Button>
              
              <div className="flex gap-2">
                <button 
                  onClick={onResetPin}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  استرجاع الرمز الافتراضي 🔄
                </button>
                <button 
                  onClick={() => {
                    setPinModalOpen(false);
                    setPinErrorMsg('');
                    setPinValue('');
                    setConfirmPinValue('');
                    setCurrentPinValue('');
                  }}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl text-[11px] font-bold transition-all border border-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SettingsView;
