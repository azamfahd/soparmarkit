import { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { generateDeviceID, generateLicenseKey, verifyLicenseKey } from '../utils/licensing';
import { 
  submitActivationRequest, 
  subscribeToDeviceActivation, 
  subscribeToAllActivationRequests, 
  approveRequestInCloud, 
  rejectRequestInCloud, 
  deleteRequestFromCloud,
  ActivationRequest 
} from '../services/firebase';

export interface LicensingState {
  deviceID: string;
  isActivated: boolean;
  activationDetails: { licenseKey: string; expiresAt: string; activatedAt: string; isCloud?: boolean } | null;
  trialDaysLeft: number;
  isInTrial: boolean;
  activationDaysLeft: number | null;
  isLicensingLoading: boolean;
  activationModalOpen: boolean;
  setActivationModalOpen: (open: boolean) => void;
  activationKeyInput: string;
  setActivationKeyInput: (val: string) => void;
  activationError: string;
  setActivationError: (err: string) => void;
  generatorDeviceIDInput: string;
  setGeneratorDeviceIDInput: (val: string) => void;
  generatorDuration: number;
  setGeneratorDuration: (dur: number) => void;
  generatedKeyResult: string;
  setGeneratedKeyResult: (res: string) => void;
  isDeveloperMode: boolean;
  setIsDeveloperMode: (dev: boolean) => void;
  developerPinInput: string;
  setDeveloperPinInput: (pin: string) => void;
  developerPinError: string;
  setDeveloperPinError: (err: string) => void;
  activeDevTab: 'generator' | 'requests';
  setActiveDevTab: (tab: 'generator' | 'requests') => void;
  devClickCount: number;
  setDevClickCount: React.Dispatch<React.SetStateAction<number>>;
  showHiddenAdminInput: boolean;
  setShowHiddenAdminInput: (show: boolean) => void;
  diagnosticAttempts: number;
  isDiagnosticLocked: boolean;
  clientStoreName: string;
  setClientStoreName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  cloudRequest: ActivationRequest | null;
  isSubmittingRequest: boolean;
  allCloudRequests: ActivationRequest[];
  showAdminLogin: boolean;
  setShowAdminLogin: (show: boolean) => void;
  requestDurations: Record<string, number>;
  setRequestDurations: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  
  // Handlers
  handleActivateApp: (keyToUse?: string, isCloud?: boolean) => Promise<void>;
  handleDeactivateApp: (setConfirmAction: any, showNotification: any) => Promise<void>;
  handleRequestCloudActivation: (showNotification: any) => Promise<void>;
  handleApproveCloudRequest: (req: ActivationRequest, duration: number, showNotification: any) => Promise<void>;
  handleRejectCloudRequest: (deviceId: string, storeName: string, setRejectingDevice: any, setRejectReasonText: any) => void;
  confirmRejectCloudRequest: (rejectingDevice: any, rejectReasonText: string, setRejectingDevice: any, setRejectReasonText: any, showNotification: any) => Promise<void>;
  handleDeleteCloudRequest: (deviceId: string, setConfirmAction: any, showNotification: any) => Promise<void>;
  handleGenerateLicense: (showNotification: any) => void;
  handleVerifyDeveloperPIN: (showNotification: any) => Promise<void>;
}

export function useLicensing(appSettingsRaw: any[] | undefined): LicensingState {
  const appSettings = appSettingsRaw || [];
  
  const [deviceID, setDeviceID] = useState<string>('');
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [activationDetails, setActivationDetails] = useState<{ licenseKey: string; expiresAt: string; activatedAt: string; isCloud?: boolean } | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(7);
  const [isInTrial, setIsInTrial] = useState<boolean>(true);
  const [activationDaysLeft, setActivationDaysLeft] = useState<number | null>(null);
  const [isLicensingLoading, setIsLicensingLoading] = useState<boolean>(true);
  const [activationModalOpen, setActivationModalOpen] = useState<boolean>(false);
  const [activationKeyInput, setActivationKeyInput] = useState<string>('');
  const [activationError, setActivationError] = useState<string>('');
  
  const [generatorDeviceIDInput, setGeneratorDeviceIDInput] = useState<string>('');
  const [generatorDuration, setGeneratorDuration] = useState<number>(30);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string>('');
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);
  const [developerPinInput, setDeveloperPinInput] = useState<string>('');
  const [developerPinError, setDeveloperPinError] = useState<string>('');
  const [activeDevTab, setActiveDevTab] = useState<'generator' | 'requests'>('requests');
  const [devClickCount, setDevClickCount] = useState<number>(0);
  const [showHiddenAdminInput, setShowHiddenAdminInput] = useState<boolean>(false);
  const [diagnosticAttempts, setDiagnosticAttempts] = useState<number>(0);
  const [isDiagnosticLocked, setIsDiagnosticLocked] = useState<boolean>(false);

  const [clientStoreName, setClientStoreName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [cloudRequest, setCloudRequest] = useState<ActivationRequest | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);
  const [allCloudRequests, setAllCloudRequests] = useState<ActivationRequest[]>([]);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [requestDurations, setRequestDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    if (appSettingsRaw === undefined) return;

    const initLicensing = async () => {
      let currentDeviceID = '';
      const deviceIdSetting = appSettings.find(s => s.key === 'deviceID');
      if (deviceIdSetting) {
        currentDeviceID = deviceIdSetting.value;
        setDeviceID(deviceIdSetting.value);
      } else {
        const newID = generateDeviceID();
        await db.settings.add({ key: 'deviceID', value: newID });
        currentDeviceID = newID;
        setDeviceID(newID);
      }

      let installDate: Date;
      const installSetting = appSettings.find(s => s.key === 'firstInstallDate');
      if (installSetting) {
        installDate = new Date(installSetting.value);
      } else {
        const nowStr = new Date().toISOString();
        await db.settings.add({ key: 'firstInstallDate', value: nowStr });
        installDate = new Date(nowStr);
      }

      const now = new Date();
      const trialMs = 7 * 24 * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - installDate.getTime();
      const daysLeft = Math.max(0, Math.ceil((trialMs - elapsedMs) / (1000 * 60 * 60 * 24)));
      setTrialDaysLeft(daysLeft);
      setIsInTrial(elapsedMs < trialMs);

      const activationSetting = appSettings.find(s => s.key === 'activationDetails');
      if (activationSetting && activationSetting.value) {
        const details = activationSetting.value;
        setActivationDetails(details);
        
        const validation = verifyLicenseKey(currentDeviceID, details.licenseKey);
        if (validation.isValid) {
          if (details.expiresAt === 'lifetime') {
            setIsActivated(true);
            setActivationDaysLeft(null);
          } else {
            const expDate = new Date(details.expiresAt);
            if (now < expDate) {
              setIsActivated(true);
              const msLeft = expDate.getTime() - now.getTime();
              const dLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
              setActivationDaysLeft(dLeft);
            } else {
              setIsActivated(false);
              setActivationDaysLeft(0);
            }
          }
        } else {
          setIsActivated(false);
          setActivationDaysLeft(null);
        }
      } else {
        setIsActivated(false);
        setActivationDaysLeft(null);
      }
      setIsLicensingLoading(false);
    };

    initLicensing();
  }, [appSettingsRaw]);

  useEffect(() => {
    if (!deviceID) return;
    
    // Skip subscribing if offline to ensure 100% resilient offline operation
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const unsubscribe = subscribeToDeviceActivation(deviceID, (request) => {
      if (!request) {
        // Missing request or offline snapshot -> Keep local activation state untouched!
        setCloudRequest(null);
        return;
      }

      setCloudRequest(request);
      
      // Auto-deactivation ONLY if explicitly rejected by owner while connected
      if (request.status === 'rejected') {
        performSilentDeactivation();
      }
      
      // Auto-activation on the fly when approved
      if (request.status === 'approved' && request.licenseKey) {
        const currentKey = activationDetails?.licenseKey;
        if (currentKey !== request.licenseKey) {
          handleActivateApp(request.licenseKey, true);
        }
      }
    });
    
    return () => unsubscribe();
  }, [deviceID, activationDetails]);

  useEffect(() => {
    if (!isDeveloperMode) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    
    const unsubscribe = subscribeToAllActivationRequests((requests) => {
      setAllCloudRequests(requests);
    });
    
    return () => unsubscribe();
  }, [isDeveloperMode]);

  const performSilentDeactivation = async () => {
    try {
      const existing = await db.settings.where('key').equals('activationDetails').first();
      if (existing) {
        await db.settings.delete(existing.id!);
      }
      setActivationDetails(null);
      setIsActivated(false);
      setActivationDaysLeft(null);
    } catch (err) {
      console.error("Failed to perform silent deactivation:", err);
    }
  };

  const handleActivateApp = async (keyToUse?: string, isCloud: boolean = false) => {
    const key = keyToUse || activationKeyInput;
    if (!key) {
      setActivationError('الرجاء إدخال مفتاح التفعيل');
      return;
    }

    const validation = verifyLicenseKey(deviceID, key);
    if (!validation.isValid) {
      setActivationError('مفتاح التفعيل غير صحيح أو غير متوافق مع معرف جهازك!');
      return;
    }

    let expiresAt = '';
    const now = new Date();
    if (validation.durationDays >= 9999) {
      expiresAt = 'lifetime';
    } else {
      const expDate = new Date(now.getTime() + validation.durationDays * 24 * 60 * 60 * 1000);
      expiresAt = expDate.toISOString();
    }

    const details = {
      licenseKey: key,
      activatedAt: now.toISOString(),
      expiresAt,
      isCloud: !!isCloud || !!cloudRequest
    };

    const existing = await db.settings.where('key').equals('activationDetails').first();
    if (existing) {
      await db.settings.update(existing.id!, { value: details });
    } else {
      await db.settings.add({ key: 'activationDetails', value: details });
    }

    setActivationDetails(details);
    setIsActivated(true);
    setActivationError('');
    setActivationKeyInput('');
  };

  const handleDeactivateApp = async (setConfirmAction: any, showNotification: any) => {
    setConfirmAction({
      title: 'إلغاء تفعيل الترخيص',
      message: '⚠️ تنبيه هام: هل أنت متأكد من إلغاء تفعيل هذا الترخيص؟ سيتم إخراجك للنسخة التجريبية ولا يمكنك استخدام الميزات المدفوعة إلا بتفعيل جديد.',
      onConfirm: async () => {
        try {
          const existing = await db.settings.where('key').equals('activationDetails').first();
          if (existing) {
            await db.settings.delete(existing.id!);
          }
          setActivationDetails(null);
          setIsActivated(false);
          setActivationDaysLeft(null);
          showNotification('تم إلغاء تفعيل الترخيص الحالي بنجاح', 'success');
        } catch (err) {
          console.error("Failed to deactivate license:", err);
          showNotification('حدث خطأ أثناء إلغاء التفعيل', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleRequestCloudActivation = async (showNotification: any) => {
    if (!clientStoreName.trim()) {
      showNotification('يرجى إدخال اسم المتجر أولاً!', 'error');
      return;
    }
    
    setIsSubmittingRequest(true);
    try {
      await submitActivationRequest(deviceID, clientStoreName, clientPhone);
      showNotification('تم إرسال طلب التفعيل الرقمي بنجاح وهو قيد المراجعة الآن!', 'success');
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء إرسال الطلب، يرجى التحقق من اتصالك بالإنترنت والتحميل مجدداً', 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const hashPIN = async (pin: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleVerifyDeveloperPIN = async (showNotification: any) => {
    // Remove the lock check to maintain the camouflage indefinitely
    // if (isDiagnosticLocked) { ... }

    const pin = developerPinInput.trim();
    if (!pin) return;

    await sleep(2000);

    const pinHash = await hashPIN(pin);
    const customChecksum = typeof localStorage !== 'undefined' ? localStorage.getItem('_sys_diag_checksum_v2') : null;

    const correctHashLower = '260d09dc568bb75d644b8b37b1121cad026a6f0ca10ea41963dd0ee9d43d7b11';
    const correctHashUpper = '0d46e9b09bcdf3be2987d5756defd65b4344b55f281f62b950c738ae67b843e4';

    const isValid = customChecksum 
      ? (pinHash === customChecksum)
      : (pinHash === correctHashLower || pinHash === correctHashUpper || pin === '8080');

    if (isValid) {
      setIsDeveloperMode(true);
      setDeveloperPinError('');
      setDeveloperPinInput('');
      setDiagnosticAttempts(0);
      showNotification('🔓 تم تفعيل بروتوكول التشخيص الكامل والتحقق من النواة بنجاح!', 'success');

      if (!isActivated && deviceID) {
        const key = generateLicenseKey(deviceID, 9999);
        const details = {
          licenseKey: key,
          expiresAt: 'lifetime',
          activatedAt: new Date().toISOString()
        };
        const existing = await db.settings.where('key').equals('activationDetails').first();
        if (existing) {
          await db.settings.update(existing.id!, { value: details });
        } else {
          await db.settings.add({ key: 'activationDetails', value: details });
        }
        setActivationDetails(details);
        setIsActivated(true);
        showNotification('تم تفعيل جهاز المالك بنجاح مدى الحياة ♾️', 'success');
      }
    } else {
      // Camouflage: act like it succeeded in syncing a cache, without throwing any error
      setDeveloperPinError('');
      setDeveloperPinInput('');
      showNotification('✅ تمت مزامنة ذاكرة العرض المحلية واسترداد البيانات بنجاح!', 'success');
    }
  };

  const handleApproveCloudRequest = async (req: ActivationRequest, duration: number, showNotification: any) => {
    try {
      const key = generateLicenseKey(req.deviceId, duration);
      await approveRequestInCloud(req.deviceId, duration, key);
      showNotification(`تمت الموافقة وتوليد الترخيص لـ ${req.storeName} بنجاح!`, 'success');
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء الموافقة على الطلب في السحابة', 'error');
    }
  };

  const handleRejectCloudRequest = (deviceId: string, storeName: string, setRejectingDevice: any, setRejectReasonText: any) => {
    setRejectingDevice({ deviceId, storeName });
    setRejectReasonText('انتهت صلاحية الاشتراك والمشغل لم يقم بالتجديد.');
  };

  const confirmRejectCloudRequest = async (rejectingDevice: any, rejectReasonText: string, setRejectingDevice: any, setRejectReasonText: any, showNotification: any) => {
    if (!rejectingDevice) return;
    try {
      await rejectRequestInCloud(rejectingDevice.deviceId, rejectReasonText || 'تم إلغاء تفعيل الترخيص من قبل الإدارة لسبب غير محدد');
      showNotification(`تم تجميد وإلغاء ترخيص ${rejectingDevice.storeName} بنجاح`, 'success');
      setRejectingDevice(null);
      setRejectReasonText('');
    } catch (e) {
      console.error(e);
      showNotification('حدث خطأ أثناء إلغاء الترخيص', 'error');
    }
  };

  const handleDeleteCloudRequest = async (deviceId: string, setConfirmAction: any, showNotification: any) => {
    setConfirmAction({
      title: 'حذف طلب تفعيل من السحابة',
      message: 'هل أنت متأكد من حذف هذا الطلب بالكامل من السحابة؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        try {
          await deleteRequestFromCloud(deviceId);
          showNotification('تم حذف طلب التفعيل من السحابة', 'success');
        } catch (e) {
          console.error(e);
          showNotification('حدث خطأ أثناء حذف الطلب', 'error');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleGenerateLicense = (showNotification: any) => {
    if (!generatorDeviceIDInput) {
      showNotification('الرجاء إدخال معرف جهاز العميل أولاً!', 'error');
      return;
    }
    const key = generateLicenseKey(generatorDeviceIDInput, generatorDuration);
    setGeneratedKeyResult(key);
    showNotification('تم توليد مفتاح التفعيل بنجاح!', 'success');
  };

  return {
    deviceID,
    isActivated,
    activationDetails,
    trialDaysLeft,
    isInTrial,
    activationDaysLeft,
    isLicensingLoading,
    activationModalOpen,
    setActivationModalOpen,
    activationKeyInput,
    setActivationKeyInput,
    activationError,
    setActivationError,
    generatorDeviceIDInput,
    setGeneratorDeviceIDInput,
    generatorDuration,
    setGeneratorDuration,
    generatedKeyResult,
    setGeneratedKeyResult,
    isDeveloperMode,
    setIsDeveloperMode,
    developerPinInput,
    setDeveloperPinInput,
    developerPinError,
    setDeveloperPinError,
    activeDevTab,
    setActiveDevTab,
    devClickCount,
    setDevClickCount,
    showHiddenAdminInput,
    setShowHiddenAdminInput,
    diagnosticAttempts,
    isDiagnosticLocked,
    clientStoreName,
    setClientStoreName,
    clientPhone,
    setClientPhone,
    cloudRequest,
    isSubmittingRequest,
    allCloudRequests,
    showAdminLogin,
    setShowAdminLogin,
    requestDurations,
    setRequestDurations,

    handleActivateApp,
    handleDeactivateApp,
    handleRequestCloudActivation,
    handleApproveCloudRequest,
    handleRejectCloudRequest,
    confirmRejectCloudRequest,
    handleDeleteCloudRequest,
    handleGenerateLicense,
    handleVerifyDeveloperPIN
  };
}
