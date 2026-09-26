import React from 'react';
import { motion } from 'motion/react';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { db } from '../../db';
import { 
  Home, Edit, ShieldCheck, Database, Download, Upload, 
  Sparkles, RefreshCw, Package, Camera, Key, Copy, Activity, 
  Check, Cloud, Lock, Trash2, Brain, Cpu, ThumbsUp, ThumbsDown, AlertTriangle, Shield, ExternalLink, Bell, Clock,
  Wifi, CheckCircle2, XCircle, Crown, Radio, Users, Send, KeyRound
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  updateLatestAppVersion, 
  testCloudConnection, 
  CLOUD_PROJECT_ID, 
  CLOUD_DATABASE_ID, 
  type AppVersionConfig,
  subscribeToAuth,
  isSuperOwner,
  type User
} from '../../services/firebase';
import { FileSpreadsheet } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  isFileSystemAccessSupported,
  linkLocalExcelFile,
  unlinkExcelFile,
  getLinkedExcelHandle,
  syncBidirectionalExcel,
  downloadExcelBackupManual,
  importExcelBackupManual
} from '../../services/excelSync';
import { subscribeToAppVersion } from '../../services/firebase';
import { embeddingManager } from '../../services/ai/rag/embeddings';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

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
  appLockEnabled?: boolean;
  updateAppLockEnabled?: (val: boolean) => Promise<void>;
  onLockScreenNow?: () => void;
  protectedActions?: Record<string, boolean>;
  setIsPermissionsPreUnlocked?: (val: boolean) => void;
  verifyAdminPermission: (action: string, callback: () => void, title?: string) => void;
  setShowPermissionsConfigModal: (show: boolean) => void;
  exportData: () => void;
  isBackupOverdue?: boolean;
  lastBackupDate?: string | null;
  backupAlertInterval?: string;
  updateBackupAlertInterval?: (interval: string) => void;
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
  storePhone: string;
  setStorePhone: (phone: string) => void;
  isSubmittingRequest: boolean;
  handleRequestCloudActivation: (customDuration?: number, isRenewal?: boolean) => void;
  handleDeactivateApp: () => void;
  showHiddenAdminInput: boolean;
  isDeveloperMode: boolean;
  setIsDeveloperMode: (val: boolean) => void;
  developerPinInput: string;
  setDeveloperPinInput: (val: string) => void;
  developerPinError: string;
  setDeveloperPinError: (val: string) => void;
  handleVerifyDeveloperPIN: () => void;
  activeDevTab: 'generator' | 'requests' | 'updates';
  setActiveDevTab: (tab: 'generator' | 'requests' | 'updates') => void;
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
  onOpenExcelSyncCenter?: () => void;
  onOpenSecureExport?: () => void;
  onOpenCheckUpdatesModal?: () => void;
  onTriggerTestBanner?: () => void;
  currentAppVersion?: string;
  latestCloudVersion?: string;
  onVersionPublished?: (config: AppVersionConfig) => void;
  onApplyUpdateNow?: () => void;
  onOpenOwnerModal?: () => void;
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
  appLockEnabled = false,
  updateAppLockEnabled,
  onLockScreenNow,
  protectedActions = {},
  setIsPermissionsPreUnlocked,
  verifyAdminPermission,
  setShowPermissionsConfigModal,
  exportData,
  isBackupOverdue,
  lastBackupDate,
  backupAlertInterval = '7',
  updateBackupAlertInterval,
  handleImportPython,
  importData,
  isBackupSyncing,
  onOpenExcelSyncCenter,
  onOpenSecureExport,
  onOpenCheckUpdatesModal,
  onTriggerTestBanner,
  currentAppVersion,
  latestCloudVersion,
  onVersionPublished,
  onApplyUpdateNow,
  onOpenOwnerModal,
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
  storePhone,
  setStorePhone,
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
  const [showEditInfo, setShowEditInfo] = React.useState(false);
  const [userRequestedDuration, setUserRequestedDuration] = React.useState(365);
  const [currentAuthUser, setCurrentAuthUser] = React.useState<User | null>(null);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = React.useState<boolean>(false);

  React.useEffect(() => {
    const unsub = subscribeToAuth((user, isOwner) => {
      setCurrentAuthUser(user);
      setIsOwnerLoggedIn(isOwner);
      if (isOwner) {
        setIsDeveloperMode(true);
      }
    });
    return () => unsub();
  }, [setIsDeveloperMode]);

  // App Update Publisher states for Owner / Developer
  const [liveRemoteConfig, setLiveRemoteConfig] = React.useState<AppVersionConfig | null>(null);
  const [devVersionInput, setDevVersionInput] = React.useState('1.0.6');
  const [devApkUrlInput, setDevApkUrlInput] = React.useState('https://github.com/azamfahd/soparmarkit/releases/latest/download/app-release.apk');
  const [devUpdateMsgInput, setDevUpdateMsgInput] = React.useState('يتوفر تحديث جديد يحتوي على تحسينات واسعة بالسرعة والأداء واستقرار أسرع للتطبيق.');
  const [devIsMandatory, setDevIsMandatory] = React.useState(false);
  const [isPublishingUpdate, setIsPublishingUpdate] = React.useState(false);

  React.useEffect(() => {
    if (!isDeveloperMode) return;
    const unsubscribe = subscribeToAppVersion((config) => {
      if (config) {
        setLiveRemoteConfig(config);
        setDevVersionInput(config.latestVersion || '1.0.6');
        if (config.apkUrl) setDevApkUrlInput(config.apkUrl);
        if (config.updateMessage) setDevUpdateMsgInput(config.updateMessage);
        setDevIsMandatory(Boolean(config.mandatory));
      }
    });
    return () => unsubscribe();
  }, [isDeveloperMode]);

  const handlePublishAppUpdate = async () => {
    if (!devVersionInput.trim()) {
      showNotification('يرجى تحديد رقم الإصدار الجديد', 'error');
      return;
    }
    if (!devApkUrlInput.trim()) {
      showNotification('يرجى تحديد رابط تنزيل ملف الـ APK', 'error');
      return;
    }
    setIsPublishingUpdate(true);
    try {
      const newVersionConfig: Omit<AppVersionConfig, 'updatedAt'> = {
        latestVersion: devVersionInput.trim(),
        apkUrl: devApkUrlInput.trim(),
        updateMessage: devUpdateMsgInput.trim() || 'يتوفر تحديث جديد للتطبيق.',
        mandatory: devIsMandatory
      };
      await updateLatestAppVersion(newVersionConfig);
      const fullConfig: AppVersionConfig = {
        ...newVersionConfig,
        updatedAt: new Date().toISOString()
      };
      setLiveRemoteConfig(fullConfig);
      if (onVersionPublished) {
        onVersionPublished(fullConfig);
      }
      showNotification(`🎉 تم نشر التحديث v${devVersionInput.trim()} في السحابة بنجاح! وسيتلقى جميع مستخدمي التطبيق والـ APK التنبيه فوراً.`, 'success');
    } catch (err) {
      console.error('Failed to publish app update:', err);
      showNotification('حدث خطأ أثناء نشر التحديث، يرجى الاتصال بالإنترنت والتحقق مجدداً', 'error');
    } finally {
      setIsPublishingUpdate(false);
    }
  };

  // Live Cloud & Update Diagnostics
  const [isDiagnosing, setIsDiagnosing] = React.useState(false);
  const [diagResult, setDiagResult] = React.useState<{
    networkOk: boolean;
    firebaseOk: boolean;
    firebaseLatency: number;
    githubOk: boolean;
    githubLatency: number;
    lastTested: string;
    versionInCloud?: string;
  } | null>(null);

  const runCloudDiagnostics = async () => {
    setIsDiagnosing(true);
    const networkOk = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // 1. Firebase Firestore Test
    const fbTest = await testCloudConnection();
    
    // 2. GitHub Releases API Test
    let ghOk = false;
    let ghLatency = 0;
    const ghStart = Date.now();
    try {
      const ghRes = await fetch('https://api.github.com/repos/azamfahd/soparmarkit/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        cache: 'no-store'
      });
      ghLatency = Date.now() - ghStart;
      ghOk = ghRes.ok;
    } catch {
      ghLatency = Date.now() - ghStart;
      ghOk = false;
    }

    setDiagResult({
      networkOk,
      firebaseOk: fbTest.success,
      firebaseLatency: fbTest.latencyMs,
      githubOk: ghOk,
      githubLatency: ghLatency,
      lastTested: new Date().toLocaleTimeString('ar-SA'),
      versionInCloud: fbTest.latestConfig?.latestVersion
    });
    setIsDiagnosing(false);
    if (fbTest.success) {
      showNotification('✅ تم فحص الاتصال بالسحابة ومستودع التحديثات بنجاح', 'success');
    } else {
      showNotification('⚠️ تعذر الاتصال بالسحابة، يرجى فحص الشبكة', 'error');
    }
  };

  const rawFeedbackList = useLiveQuery(() => db.aiFeedback ? db.aiFeedback.reverse().toArray() : Promise.resolve([])) || [];
  const userFeedbackList = rawFeedbackList.filter(f => !f.intent?.includes('ERROR') && !f.responseAnswer?.startsWith('Error:'));
  const systemErrorList = rawFeedbackList.filter(f => f.intent?.includes('ERROR') || f.responseAnswer?.startsWith('Error:'));

  const feedbackSummary = React.useMemo(() => {
    const total = userFeedbackList.length;
    const positive = userFeedbackList.filter(f => f.rating === 'THUMBS_UP').length;
    const negative = total - positive;
    const rate = total > 0 ? Math.round((positive / total) * 100) : 100;
    return { total, positive, negative, rate };
  }, [userFeedbackList]);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const { reindexAllKnowledgeDocuments } = await import('../../services/ai/rag/documentProcessor');
      const stats = await reindexAllKnowledgeDocuments();
      showNotification(`🧠 تم إعادة بناء الفهرس العصبي بنجاح! تمت فهرسة ${stats.totalDocs} مستنداً و ${stats.totalChunks} جزءاً معرفياً.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'فشل إعادة بناء الفهرس العصبي', 'error');
    } finally {
      setIsReindexing(false);
    }
  };

  const isNativeApp = React.useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        if (Capacitor.isNativePlatform() || (window as any).Capacitor?.isNativePlatform()) {
          return true;
        }
        if (window.location.protocol.includes('capacitor') || window.location.protocol.includes('ionic')) {
          return true;
        }
        const ua = navigator.userAgent || '';
        if (ua.includes('Android') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  const isPwaApp = React.useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

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

  // Excel Live-Sync States & Operations
  const [excelStatus, setExcelStatus] = React.useState<{
    isLinked: boolean;
    fileName: string | null;
    lastSync: string | null;
    isSyncing: boolean;
  }>({
    isLinked: false,
    fileName: null,
    lastSync: null,
    isSyncing: false
  });

  React.useEffect(() => {
    const checkExcelLink = async () => {
      try {
        const handle = await getLinkedExcelHandle();
        const storedName = await db.settings.where('key').equals('excel_file_name').first();
        const storedLastSync = await db.settings.where('key').equals('excel_last_sync').first();
        setExcelStatus({
          isLinked: !!handle,
          fileName: handle ? handle.name : (storedName?.value || null),
          lastSync: storedLastSync?.value || null,
          isSyncing: false
        });
      } catch (e) {
        console.error('Error reading Excel link settings:', e);
      }
    };
    checkExcelLink();
  }, []);

  const handleLinkExcel = async () => {
    try {
      const result = await linkLocalExcelFile();
      if (result) {
        setExcelStatus(prev => ({
          ...prev,
          isLinked: true,
          fileName: result.name,
          lastSync: new Date().toISOString()
        }));
        showNotification(`✅ تم ربط ملف الإكسل [${result.name}] بنجاح وجاري المزامنة الأولى...`, 'success');
        
        // Trigger first sync
        setExcelStatus(prev => ({ ...prev, isSyncing: true }));
        const stats = await syncBidirectionalExcel();
        const lastSyncTime = new Date().toISOString();
        setExcelStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSync: lastSyncTime
        }));
        showNotification(`🔄 تمت المزامنة الثنائية الأولى! تم استيراد ${stats.addedProducts} صنف و ${stats.addedCustomers} عميل و تحديث ${stats.updatedProducts} منتج.`, 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'فشل ربط ملف الإكسل', 'error');
    }
  };

  const handleUnlinkExcel = async () => {
    try {
      await unlinkExcelFile();
      setExcelStatus({
        isLinked: false,
        fileName: null,
        lastSync: null,
        isSyncing: false
      });
      showNotification('🚫 تم فك ارتباط ملف الإكسل بنجاح.', 'success');
    } catch (err: any) {
      showNotification('فشل إلغاء ربط ملف الإكسل', 'error');
    }
  };

  const handleSyncExcel = async () => {
    setExcelStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const stats = await syncBidirectionalExcel();
      const lastSyncTime = new Date().toISOString();
      setExcelStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: lastSyncTime
      }));
      showNotification(`🔄 تمت المزامنة بنجاح! تم استيراد: ${stats.addedProducts} أصناف جديدة، وتحديث: ${stats.updatedProducts} صنف، وإضافة: ${stats.addedCustomers} عملاء.`, 'success');
    } catch (err: any) {
      setExcelStatus(prev => ({ ...prev, isSyncing: false }));
      showNotification(err.message || 'خطأ أثناء المزامنة مع ملف الإكسل', 'error');
    }
  };

  const handleImportExcelManual = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const stats = await importExcelBackupManual(file);
      setExcelStatus(prev => ({ ...prev, isSyncing: false }));
      showNotification(`📥 تم استيراد البيانات يدوياً بنجاح! تم إضافة ${stats.addedProducts} صنف و ${stats.addedCustomers} عميل.`, 'success');
      e.target.value = '';
    } catch (err: any) {
      setExcelStatus(prev => ({ ...prev, isSyncing: false }));
      showNotification(err.message || 'خطأ أثناء الاستيراد اليدوي', 'error');
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

      {/* 👑 بطاقة الإدارة السحابية والتحكم الشامل للمالك (Super Owner Master Control Hub) */}
      {(isOwnerLoggedIn || (currentAuthUser && isSuperOwner(currentAuthUser.email))) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-400/60 shadow-xl shadow-amber-500/10 text-white space-y-4 relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Owner Badge & Profile */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                {currentAuthUser?.photoURL ? (
                  <img 
                    src={currentAuthUser.photoURL} 
                    alt="Owner" 
                    className="w-12 h-12 rounded-2xl border-2 border-amber-400 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center border-2 border-amber-300 shadow-md">
                    👑
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-0.5 rounded-full text-[10px]">
                  <Crown className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    {currentAuthUser?.displayName || 'الأستاذ عصام (مالك النظام)'}
                  </h3>
                  <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3" />
                    <span>المالك المعتمد 👑</span>
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5 dir-ltr text-right">
                  {currentAuthUser?.email || 'azamfahd25@gmail.com'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/40 flex items-center gap-1.5 dir-ltr shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Connected</span>
              </span>
              {onOpenOwnerModal && (
                <button
                  type="button"
                  onClick={onOpenOwnerModal}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>لوحة التحكم الشاملة 🚀</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Management Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
            <button
              type="button"
              onClick={() => {
                setIsDeveloperMode(true);
                setActiveDevTab('generator');
                showNotification('تم فتح أداة توليد التراخيص الفورية 🔑', 'success');
              }}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 transition-all text-right cursor-pointer group"
            >
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 w-fit mb-1.5 group-hover:scale-110 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
              <h4 className="font-black text-xs text-white">توليد التراخيص</h4>
              <p className="text-[10px] text-slate-400">إنشاء مفاتيح فورية للأجهزة</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDeveloperMode(true);
                setActiveDevTab('requests');
                showNotification('تم فتح إدارة طلبات الأجهزة والمتاجر 📱', 'success');
              }}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-400/50 transition-all text-right cursor-pointer group relative"
            >
              {allCloudRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute top-2 left-2 bg-rose-500 text-white font-black text-[9px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                  {allCloudRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
              <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-1.5 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-black text-xs text-white">طلبات الأجهزة</h4>
              <p className="text-[10px] text-slate-400">تفعيل وتمديد المتاجر عن بُعد</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDeveloperMode(true);
                setActiveDevTab('updates');
                showNotification('تم فتح مركز بث ونشر التحديثات 🚀', 'success');
              }}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-400/50 transition-all text-right cursor-pointer group"
            >
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-1.5 group-hover:scale-110 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
              <h4 className="font-black text-xs text-white">بث التحديثات</h4>
              <p className="text-[10px] text-slate-400">إرسال الإصدارات لـ APK والويب</p>
            </button>

            <button
              type="button"
              onClick={runCloudDiagnostics}
              disabled={isDiagnosing}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-400/50 transition-all text-right cursor-pointer group"
            >
              <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-400 w-fit mb-1.5 group-hover:scale-110 transition-transform">
                <Activity className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
              </div>
              <h4 className="font-black text-xs text-white">فحص السحابة</h4>
              <p className="text-[10px] text-slate-400">قياس سرعة واستقرار الاتصال</p>
            </button>
          </div>
        </motion.div>
      )}

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

        {/* Card 2: System Security & Cashier Permissions */}
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
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">أمان النظام وصلاحيات الكاشير</h3>
                <p className="text-[10px] text-slate-400 font-medium">قفل فتح البرنامج وتأمين الحركات الحساسة برمز مرور المدير</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-600">قفل البرنامج عند الفتح:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${appLockEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {appLockEnabled ? 'مفعّل 🔒' : 'معطل 🔓'}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-600">حماية وصلاحيات الكاشير:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${permissionsEnabled ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {permissionsEnabled ? 'مفعّلة 🛡️' : 'معطلة (مفتوح)'}
                </span>
              </div>

              {permissionsEnabled && (
                <div className="text-[10px] text-slate-500 font-bold bg-slate-50/70 px-2.5 py-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span>الإجراءات المحمية بالرمز:</span>
                  <span className="font-mono text-indigo-700 font-black">
                    {Object.values(protectedActions).filter(Boolean).length} إجراء
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-1">
            <Button 
              onClick={() => {
                verifyAdminPermission('security_settings', () => {
                  if (setIsPermissionsPreUnlocked) setIsPermissionsPreUnlocked(true);
                  setShowPermissionsConfigModal(true);
                }, '⚙️ تهيئة إعدادات الأمان والصلاحيات');
              }}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center justify-center gap-2 rounded-xl transition-all text-xs py-2.5 cursor-pointer shadow-2xs"
            >
              <span>🔑 إعداد الأمان والصلاحيات والرمز</span>
            </Button>
          </div>
        </Card>

        {/* Card 3: Unified Data & Import Hub Banner */}
        <Card className={`p-4 sm:p-5 border rounded-2xl bg-gradient-to-br from-white via-indigo-50/25 to-teal-50/20 transition-all space-y-3 flex flex-col justify-between ${
          isBackupOverdue 
            ? 'border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
            : 'border-indigo-100/80 shadow-2xs hover:shadow-xs'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100/60 pb-2.5">
              <div className="flex items-center gap-2 text-indigo-900">
                <div className={`p-1.5 rounded-xl border ${
                  isBackupOverdue ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  <Database className={`w-4 h-4 ${isBackupOverdue ? 'text-red-600' : 'text-indigo-600'}`} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">مركز إدارة البيانات والاستيراد الذكي</h3>
                  <p className="text-[10px] text-slate-400 font-bold">النسخ الاحتياطي (JSON)، ملفات Excel، وقاعدة البيانات</p>
                </div>
              </div>
              {isBackupOverdue ? (
                <span className="text-[10px] font-black text-red-600 bg-red-100/90 px-2 py-0.5 rounded-full border border-red-300 animate-pulse">
                  نسخة مطلوبة ⚠️
                </span>
              ) : (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  محلي 100% ⚡
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              تم تجميع وتنظيم كافة عمليات استيراد وتصدير البيانات (JSON)، مزامنة ملفات Excel الحية، الاستيراد الذكي (AI/OCR)، والنسخ الاحتياطي التلقائي داخل <span className="font-bold text-indigo-600">قسم الاستيراد وقاعدة البيانات</span> لتسهيل إدارتها دون تشتت.
            </p>

            {lastBackupDate && (
              <p className="text-[10px] font-bold text-slate-400">
                آخر نسخة احتياطية: <span className="text-slate-600 font-mono">{new Date(lastBackupDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            )}

            {/* Quick backup alert config */}
            <div className="pt-2 border-t border-indigo-100/50 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1 text-[10px]">
                <Bell className="w-3 h-3 text-amber-500" />
                تنبيه النسخ الدوري:
              </span>
              <span className="text-[10px] font-black text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-2xs">
                {backupAlertInterval === '7' ? 'أسبوعياً' : backupAlertInterval === '14' ? 'كل أسبوعين' : backupAlertInterval === '30' ? 'شهرياً' : backupAlertInterval === '60' ? 'كل شهرين' : 'معطل'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <Button 
              onClick={() => setActiveTab('smart-import')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all text-xs py-2.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>فتح مركز الاستيراد والبيانات</span>
            </Button>
            {onOpenSecureExport ? (
              <Button 
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all text-xs py-2.5 cursor-pointer"
                onClick={onOpenSecureExport}
              >
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>تصدير مؤمن بكلمة سر 🔒</span>
              </Button>
            ) : (
              <Button 
                variant={isBackupOverdue ? "danger" : "outline"} 
                className={`flex items-center justify-center gap-1.5 text-xs py-2.5 cursor-pointer ${
                  isBackupOverdue 
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold shadow-[0_0_16px_rgba(239,68,68,0.65)] border-red-400 animate-pulse' 
                    : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                }`} 
                onClick={exportData}
              >
                <Download className={`w-3.5 h-3.5 ${isBackupOverdue ? 'text-white animate-bounce' : 'text-indigo-600'}`} />
                <span>{isBackupOverdue ? 'تصدير نسخة فورية ⚠️' : 'تصدير نسخة سريعة'}</span>
              </Button>
            )}
          </div>
        </Card>

        {/* Card 6: Decentralized Local Intelligence Engine */}
        <Card className="p-4 sm:p-5 border border-emerald-100/80 rounded-2xl bg-white shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100/60 pb-3">
              <div className="flex items-center gap-2.5 text-slate-800">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 rounded-xl border border-emerald-200/50 shadow-inner">
                  <Brain className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">نظام الذكاء المستقل (الوكيل المحلي)</h3>
                  <p className="text-[9px] font-bold text-emerald-600 mt-0.5">RAG & Machine Learning</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/60 border border-emerald-200 shadow-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-600" /> خصوصية تامة
              </span>
            </div>

            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-800 block text-right flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> الوكيل المحاسبي الذكي وتنقيب البيانات
              </span>
              <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium">
                يعمل الوكيل الذكي وخوارزميات استرجاع المعرفة (RAG) والتعلم الآلي (ML) بآلية لامركزية بالكامل داخل جهازك. لا يتم إرسال أي بيانات إلى خوادم خارجية، مما يضمن حماية وسرية مطلقة لبياناتك المالية، وبدون الحاجة للاتصال بالإنترنت.
              </p>
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
                      <div key={`feedback-item-${item.id ?? index}-${index}`} className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
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
                      <div key={`error-item-${item.id ?? index}-${index}`} className="p-2 bg-rose-50/50 border border-rose-100 rounded-xl text-xs space-y-1">
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

        {/* Card: Google Cloud & Owner Account */}
        <GoogleAuthButton
          variant="card"
          onOpenOwnerModal={onOpenOwnerModal}
          onOwnerAuthChanged={(isOwnerAuth) => {
            if (isOwnerAuth) {
              setIsDeveloperMode(true);
            }
          }}
          showNotification={showNotification}
        />

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
                <span>إصدار النظام الحالي:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-slate-800">v{currentAppVersion || '1.0.4'}</span>
                  {latestCloudVersion && latestCloudVersion !== (currentAppVersion || '1.0.4') && (
                    <button
                      type="button"
                      onClick={onOpenCheckUpdatesModal}
                      className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                      title="اضغط لمعاينة وتثبيت التحديث"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                      <span>يتوفر تحديث v{latestCloudVersion}</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>نوع قاعدة البيانات:</span>
                <span className="font-bold text-slate-700">
                  {isNativeApp ? "التخزين المحلي" : "IndexedDB (Local)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>بيئة التشغيل:</span>
                <span className="font-bold text-slate-800">
                  {isNativeApp 
                    ? "تطبيق أندرويد (APK)" 
                    : isPwaApp 
                      ? "تطبيق ويب مثبت (PWA)" 
                      : "متصفح الويب (Online/Offline)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>حالة التثبيت:</span>
                <span className={`font-bold ${isNativeApp ? "text-emerald-600" : (deferredPrompt ? "text-amber-600" : "text-emerald-600")}`}>
                  {isNativeApp 
                    ? "مثبت كتطبيق أصلي" 
                    : (deferredPrompt ? "جاهز للتثبيت" : (isPwaApp ? "مثبت PWA" : "متصفح"))}
                </span>
              </div>

              {/* System Permissions Matrix */}
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>أذونات وصلاحيات الجهاز:</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    مدمجة ونشطة
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>الكاميرا والماسح</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>الصور والملفات</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>الإشعارات الفورية</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>طابعات البلوتوث</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>الموقع والملحقات</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-100">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>الميكروفون والتسجيل</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).SmartPosNative?.openAppSettings) {
                  (window as any).SmartPosNative.openAppSettings();
                } else {
                  showNotification('لإدارة الأذونات: اضغط مطولاً على أيقونة التطبيق في شاشة الهاتف واختر (معلومات التطبيق ℹ️) ثم (الأذونات)', 'success');
                }
              }}
              className="w-full text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>إدارة الأذونات في إعدادات الهاتف</span>
            </button>

            {!isNativeApp && deferredPrompt && (
              <Button className="w-full text-xs py-2.5" onClick={handleInstall}>تثبيت التطبيق الآن</Button>
            )}
          </div>
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
                        ? 'النظام مفعل حالياً ✅. يمكنك طلب تجديد وتمديد الترخيص بضغطة زر واحدة دون الحاجة لإعادة كتابة بياناتك.'
                        : (storeName || cloudRequest)
                          ? 'يمكنك إرسال طلب تجديد أو تفعيل سحابي للمدير مباشرة بالبيانات المسجلة.'
                          : 'أرسل طلب تفعيل مباشر لمالك البرنامج سحابياً دون الحاجة لنقل الرموز يدوياً.'}
                    </p>
                    
                    {(storeName || cloudRequest || isActivated) ? (
                      /* Streamlined Renewal Form using saved Store Name & Phone */
                      <div className="space-y-2.5 bg-indigo-50/80 p-3 rounded-xl border border-indigo-150 text-right">
                        <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                          <button 
                            type="button"
                            onClick={() => setShowEditInfo(!showEditInfo)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                          >
                            {showEditInfo ? 'إلغاء التعديل' : 'تعديل البيانات ✏️'}
                          </button>
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 block">
                              المتجر المسجل: <span className="text-indigo-700 font-black">{storeName || 'غير مسجل'}</span>
                            </span>
                            {storePhone && <span className="text-[11px] font-mono text-slate-500 font-bold block">{storePhone}</span>}
                          </div>
                        </div>

                        {showEditInfo && (
                          <div className="space-y-1.5 pt-1 border-b border-indigo-100 pb-2">
                            <input 
                              type="text"
                              value={storeName}
                              onChange={(e) => setStoreName(e.target.value)}
                              placeholder="اسم المتجر (مثال: سوبرماركت الوفاء)"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs text-right"
                            />
                            <input 
                              type="text"
                              value={storePhone}
                              onChange={(e) => setStorePhone(e.target.value)}
                              placeholder="رقم الهاتف (777xxxxxx)"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs text-left font-mono"
                            />
                          </div>
                        )}

                        {/* Renewal Duration Selector */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <select 
                            value={userRequestedDuration}
                            onChange={(e) => setUserRequestedDuration(Number(e.target.value))}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                          >
                            <option value={30}>شهر (30 يوم)</option>
                            <option value={90}>3 أشهر (90 يوم)</option>
                            <option value={180}>6 أشهر (180 يوم)</option>
                            <option value={365}>سنة (365 يوم - افتراضي)</option>
                            <option value={9999}>مدى الحياة ♾️</option>
                          </select>
                          <label className="text-xs font-bold text-slate-600">مدة التجديد المطلوبة (اختياري):</label>
                        </div>

                        <button
                          disabled={isSubmittingRequest}
                          onClick={() => handleRequestCloudActivation(userRequestedDuration, true)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white font-bold rounded-lg transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isSubmittingRequest ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري إرسال طلب التجديد...</span>
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3.5 h-3.5" />
                              <span>طلب تجديد وتمديد الاشتراك من المدير 📡</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Initial Request Form for First-Time Users */
                      <div className="space-y-1.5 bg-white p-2 rounded-xl border border-slate-200/70">
                        <input 
                          type="text"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder="اسم المتجر (مثال: سوبرماركت الوفاء)"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs text-right"
                        />
                        <input 
                          type="text"
                          value={storePhone}
                          onChange={(e) => setStorePhone(e.target.value)}
                          placeholder="رقم الهاتف (777xxxxxx)"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs text-left font-mono"
                        />
                        <button
                          disabled={isSubmittingRequest}
                          onClick={() => handleRequestCloudActivation(365, false)}
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
                              <span>إرسال الطلب السحابي للمدير 📡</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2 mb-2">
              <div className="flex items-center gap-2 text-indigo-700 flex-wrap">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">أداة توليد مفاتيح الترخيص (للمطور/المالك)</h3>
                <span className="text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300/60 flex items-center gap-1 dir-ltr">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Firebase: {CLOUD_PROJECT_ID}
                </span>
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
              <div className="grid grid-cols-3 p-1 bg-slate-150 rounded-xl border border-slate-200 gap-1">
                <button 
                  onClick={() => setActiveDevTab('generator')}
                  className={`py-2 text-[11px] sm:text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center ${activeDevTab === 'generator' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  🛠️ ترخيص جديد
                </button>
                <button 
                  onClick={_handleCloudTabTelemetrySync}
                  className={`py-2 text-[11px] sm:text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center relative ${activeDevTab === 'requests' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                  title="النقر المتكرر 5 مرات يفتح نافذة تحديث رمز المالك"
                >
                  📡 الطلبات
                  {allCloudRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[9px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {allCloudRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveDevTab('updates')}
                  className={`py-2 text-[11px] sm:text-xs font-extrabold rounded-lg transition-all cursor-pointer text-center ${activeDevTab === 'updates' ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20' : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 font-black'}`}
                >
                  🚀 نشر التحديثات
                </button>
              </div>

              {activeDevTab === 'updates' ? (
                /* App Updates Publisher for Owner / Developer */
                <div className="space-y-4 text-right" dir="rtl">
                  {/* Current Published Status Badge */}
                  <div className="p-3.5 bg-indigo-50 border border-indigo-150 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-indigo-150/80 pb-2">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        مباشر بالسحابة
                      </span>
                      <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>بيانات التحديث المتاحة للعملاء حالياً:</span>
                      </h4>
                    </div>
                    
                    {liveRemoteConfig ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex justify-between items-center shadow-2xs">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100/60">
                            v{liveRemoteConfig.latestVersion}
                          </span>
                          <span className="text-slate-500 font-bold text-[11px]">رقم الإصدار:</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex justify-between items-center shadow-2xs">
                          <span className={`font-black text-[11px] px-2 py-0.5 rounded-md ${liveRemoteConfig.mandatory ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {liveRemoteConfig.mandatory ? 'إجباري ⚠️' : 'اختياري 🟢'}
                          </span>
                          <span className="text-slate-500 font-bold text-[11px]">نوع التحديث:</span>
                        </div>
                        <div className="col-span-1 sm:col-span-2 bg-white p-2.5 rounded-xl border border-indigo-100 space-y-1 shadow-2xs">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="text-slate-400 font-bold text-[10px]">
                              تاريخ النشر: {liveRemoteConfig.updatedAt ? new Date(liveRemoteConfig.updatedAt).toLocaleString('ar-SA') : 'غير محدد'}
                            </span>
                            <span className="text-slate-500 font-black text-[11px]">رسالة التنبيه الموجهة للعملاء:</span>
                          </div>
                          <p className="text-slate-700 text-xs font-bold leading-relaxed pt-0.5">{liveRemoteConfig.updateMessage}</p>
                        </div>
                        <div className="col-span-1 sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-indigo-100/60">
                          <span className="text-[10px] text-slate-500 font-bold">
                            هذا الجهاز يعمل حالياً بالإصدار: <strong className="font-mono text-slate-800">v{currentAppVersion || '1.0.4'}</strong>
                          </span>
                          {liveRemoteConfig.latestVersion !== (currentAppVersion || '1.0.4') && (
                            <button
                              type="button"
                              onClick={() => {
                                if (liveRemoteConfig?.latestVersion) {
                                  if (typeof localStorage !== 'undefined') {
                                    localStorage.setItem('app_installed_version_str', liveRemoteConfig.latestVersion);
                                  }
                                  showNotification(`✅ تم مزامنة هذا الجهاز مع الإصدار الجديد v${liveRemoteConfig.latestVersion} بنجاح!`, 'success');
                                  window.location.reload();
                                }
                              }}
                              className="text-[10px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <RefreshCw className="w-3 h-3 text-indigo-200" />
                              <span>مزامنة وتطبيق هذا التحديث على هذا الجهاز الآن ⚡</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-500 font-bold">
                        جاري جلب معلومات التحديث الحالية من سحابة Firebase...
                      </div>
                    )}
                  </div>

                  {/* Cloud & Updates Live Diagnostics */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <button
                        type="button"
                        onClick={runCloudDiagnostics}
                        disabled={isDiagnosing}
                        className="text-xs font-black bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                        <span>{isDiagnosing ? 'جاري الفحص...' : 'فحص الاتصال الحي الآن ⚡'}</span>
                      </button>
                      <div className="text-right">
                        <h4 className="text-xs font-black text-white flex items-center justify-end gap-1.5">
                          <span>لوحة فحص الاتصال والتحديثات الحية (APK & Cloud)</span>
                          <Activity className="w-4 h-4 text-emerald-400" />
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          تأكد من اتصال النظام السحابي واستقبال مستخدمي الـ APK للتنبيهات
                        </p>
                      </div>
                    </div>

                    {/* Connected Cloud Target Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">قاعدة البيانات:</span>
                        <span className="font-mono text-indigo-300 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60 dir-ltr">{CLOUD_DATABASE_ID}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">مشروع Firebase:</span>
                        <span className="font-mono text-emerald-300 font-extrabold bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/60 dir-ltr flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          {CLOUD_PROJECT_ID}
                        </span>
                      </div>
                    </div>

                    {diagResult ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${diagResult.networkOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {diagResult.networkOk ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                            <span>{diagResult.networkOk ? 'متصل' : 'مقطوع'}</span>
                          </span>
                          <span className="text-slate-400 font-bold text-[10px]">شبكة الإنترنت:</span>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${diagResult.firebaseOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {diagResult.firebaseOk ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                            <span>{diagResult.firebaseOk ? `${diagResult.firebaseLatency}ms` : 'فشل'}</span>
                          </span>
                          <span className="text-slate-400 font-bold text-[10px]">قاعدة Firebase:</span>
                        </div>

                        <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between">
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${diagResult.githubOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {diagResult.githubOk ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                            <span>{diagResult.githubOk ? `${diagResult.githubLatency}ms` : 'مستودع'}</span>
                          </span>
                          <span className="text-slate-400 font-bold text-[10px]">تحديثات GitHub:</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 text-center font-medium">
                        اضغط على "فحص الاتصال الحي الآن" لاختبار اتصال قاعدة البيانات وسرعة استجابة السحابة فورياً.
                      </p>
                    )}

                    {/* Quick Simulation & Verification Tools */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                      {onTriggerTestBanner && (
                        <button
                          type="button"
                          onClick={onTriggerTestBanner}
                          className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="إظهار راية التحديث على هذا الجهاز كتجربة واقعية"
                        >
                          <Bell className="w-3.5 h-3.5 text-emerald-200" />
                          <span>معاينة ظهور إشعار التحديث للعملاء 🔔</span>
                        </button>
                      )}

                      {onOpenCheckUpdatesModal && (
                        <button
                          type="button"
                          onClick={onOpenCheckUpdatesModal}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          <span>فتح مركز فحص وتنزيل حزمة APK 📱</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form to Publish New Update */}
                  <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>نشر إصدار وتحديث جديد (سيظهر فوراً لكل مستخدمي الـ APK)</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        عند حفظ ونشر التحديث، سيرسل النظام تنبيهاً فورياً لكافة الأجهزة للتنزيل أو التحديث التلقائي.
                      </p>
                    </div>

                    {/* Target Version Tag */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400 ml-1">اختصارات:</span>
                          {['1.0.6', '1.1.0', '2.0.0'].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setDevVersionInput(v)}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 px-2 py-0.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <label className="text-xs font-extrabold text-slate-700">رقم الإصدار الجديد (Version Tag):</label>
                      </div>
                      <input
                        type="text"
                        value={devVersionInput}
                        onChange={(e) => setDevVersionInput(e.target.value)}
                        placeholder="مثال: 1.0.6"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-xs font-extrabold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    {/* APK Link Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setDevApkUrlInput("https://github.com/azamfahd/soparmarkit/releases/latest/download/app-release.apk")}
                          className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-indigo-600" />
                          <span>تعبئة رابط GitHub الرئيسي</span>
                        </button>
                        <label className="text-xs font-extrabold text-slate-700">رابط تنزيل ملف الـ APK المباشر:</label>
                      </div>
                      <input
                        type="text"
                        value={devApkUrlInput}
                        onChange={(e) => setDevApkUrlInput(e.target.value)}
                        placeholder="https://github.com/azamfahd/soparmarkit/releases/..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all dir-ltr text-left"
                      />
                    </div>

                    {/* Notification Message */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-700 block">رسالة تنبيه المستخدمين والتحسينات المضافة:</label>
                      <textarea
                        value={devUpdateMsgInput}
                        onChange={(e) => setDevUpdateMsgInput(e.target.value)}
                        rows={3}
                        placeholder="اكتب نص الرسالة والتنبيه الذي يظهر لمستخدمي البرنامج..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none"
                      />
                      {/* Templates */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {[
                          "يتوفر تحديث جديد يحتوي على تحسينات واسعة بالسرعة والأداء واستقرار أسرع للتطبيق.",
                          "إصدار جديد يتضمن ميزات إضافية وتحديثات هامة في المبيعات وتصدير الملفات.",
                          "تحديث صيانة واستقرار شامل وتسهيل مشاركة وتقارير الـ APK."
                        ].map((msgTemplate, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDevUpdateMsgInput(msgTemplate)}
                            className="text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-2 py-1 rounded-lg border border-slate-200 font-bold transition-colors cursor-pointer text-right"
                          >
                            📝 قالب {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mandatory Toggle */}
                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={devIsMandatory}
                        onChange={(e) => setDevIsMandatory(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span className="text-xs font-extrabold text-slate-700">تحديث إجباري ⚠️ (يلزم المستخدمين بالتحديث فوراً)</span>
                    </label>

                    {/* Publish Action Button */}
                    <Button
                      onClick={handlePublishAppUpdate}
                      disabled={isPublishingUpdate}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {isPublishingUpdate ? (
                        <span>جاري الحفظ وإرسال التحديث للسحابة...</span>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
                          <span>نشر التحديث وإرسال التنبيه لكافة المستخدمين الآن 🚀</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : activeDevTab === 'requests' ? (
                /* Cloud Requests Dashboard */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 font-bold">
                    <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 dir-ltr flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {CLOUD_PROJECT_ID}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                      <span>قاعدة السحابة المتصلة لاستقبال الطلبات:</span>
                    </span>
                  </div>
                  {allCloudRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        تنبيه للمدير: يوجد {allCloudRequests.filter(r => r.status === 'pending').length} طلب تفعيل/تجديد بانتظار الموافقة!
                      </span>
                    </div>
                  )}

                  {allCloudRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-bold">
                      لا توجد أي طلبات تفعيل سحابية في السحابة حالياً.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {allCloudRequests.map((req, reqIdx) => {
                        const isRenewal = req.requestType === 'renewal';
                        const selectedDuration = requestDurations[req.deviceId] || req.requestedDuration || 365;
                        return (
                          <div key={`cloud-req-${req.deviceId || 'nodev'}-${req.id || ''}-${reqIdx}`} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-right">
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
                                <div className="flex items-center gap-2 justify-end flex-wrap">
                                  {isRenewal ? (
                                    <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1">
                                      🔄 طلب تجديد
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                                      🆕 طلب جديد
                                    </span>
                                  )}
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

                            {/* Show Requested Duration Badge if present */}
                            {req.requestedDuration && req.status === 'pending' && (
                              <div className="text-[11px] text-indigo-700 font-extrabold bg-indigo-50/90 px-3 py-1.5 rounded-xl border border-indigo-150 flex items-center justify-between">
                                <span className="font-black">{req.requestedDuration === 9999 ? 'مدى الحياة ♾️' : `${req.requestedDuration} يوم (${Math.round(req.requestedDuration / 30)} أشهر)`}</span>
                                <span className="text-slate-500 font-bold">المدة المطلوبة من العميل:</span>
                              </div>
                            )}

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
                                  <label className="text-xs font-bold text-slate-500">مدة الترخيص المعتمدة:</label>
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
                                    {isRenewal ? 'تأكيد وتفعيل التجديد ✅' : 'موافقة وتفعيل تلقائي ✅'}
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
