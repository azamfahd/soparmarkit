import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Crown, ShieldCheck, RefreshCw, Upload, Smartphone, 
  Users, CheckCircle2, Clock, Trash2, Copy, AlertTriangle, 
  ExternalLink, Key, Sparkles, LogOut, Activity, Lock,
  KeyRound, UserCheck, BarChart3, Radio, Check, Eye, EyeOff
} from 'lucide-react';
import { 
  updateLatestAppVersion, 
  testCloudConnection, 
  subscribeToAllUserProfiles,
  CLOUD_PROJECT_ID,
  OWNER_EMAIL,
  type ActivationRequest,
  type AppVersionConfig,
  type UserProfile
} from '../../services/firebase';
import { generateLicenseKey, hashPINString, verifyOwnerSecurityPIN } from '../../utils/licensing';
import type { User } from 'firebase/auth';

interface OwnerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allCloudRequests: ActivationRequest[];
  onApproveRequest: (req: ActivationRequest, durationDays: number) => void;
  onRejectRequest: (deviceId: string, storeName: string) => void;
  onDeleteRequest: (deviceId: string) => void;
  onSignOut: () => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
  onVersionPublished?: (config: AppVersionConfig) => void;
}

export const OwnerDashboardModal: React.FC<OwnerDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allCloudRequests,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,
  onSignOut,
  showNotification,
  onVersionPublished
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'generator' | 'updates' | 'security' | 'system'>('overview');
  
  // Cloud Users State
  const [cloudUsers, setCloudUsers] = useState<UserProfile[]>([]);

  // Updates State
  const [newVersionInput, setNewVersionInput] = useState('1.0.6');
  const [apkUrlInput, setApkUrlInput] = useState('https://github.com/azamfahd/soparmarkit/releases/latest/download/app-release.apk');
  const [updateMessageInput, setUpdateMessageInput] = useState('يتوفر تحديث جديد يحتوي على تحسينات واسعة بالسرعة والأداء واستقرار أسرع للتطبيق.');
  const [isMandatory, setIsMandatory] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Generator State
  const [genDeviceId, setGenDeviceId] = useState('');
  const [genDuration, setGenDuration] = useState(365);
  const [generatedKey, setGeneratedKey] = useState('');

  // Diagnostic State
  const [diagResult, setDiagResult] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Custom durations per request
  const [requestDurations, setRequestDurations] = useState<Record<string, number>>({});

  // Security / PIN Change State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToAllUserProfiles((users) => {
        setCloudUsers(users);
      });
      return () => unsub();
    }
  }, [isOpen]);

  const pendingRequests = allCloudRequests.filter(r => r.status === 'pending');
  const approvedRequests = allCloudRequests.filter(r => r.status === 'approved');

  const handlePublish = async () => {
    if (!newVersionInput.trim()) {
      showNotification('يرجى تحديد رقم الإصدار', 'error');
      return;
    }
    setIsPublishing(true);
    try {
      const config: Omit<AppVersionConfig, 'updatedAt'> = {
        latestVersion: newVersionInput.trim(),
        apkUrl: apkUrlInput.trim(),
        updateMessage: updateMessageInput.trim(),
        mandatory: isMandatory
      };
      await updateLatestAppVersion(config);
      const fullConfig: AppVersionConfig = {
        ...config,
        updatedAt: new Date().toISOString()
      };
      onVersionPublished?.(fullConfig);
      showNotification(`🎉 تم نشر التحديث v${newVersionInput.trim()} في السحابة بنجاح! وسيتلقى جميع مستخدمي التطبيق والـ APK التنبيه فوراً.`, 'success');
    } catch (err: any) {
      showNotification(err?.message || 'حدث خطأ أثناء نشر التحديث', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerate = () => {
    if (!genDeviceId.trim()) {
      showNotification('يرجى إدخال معرّف الجهاز', 'error');
      return;
    }
    const key = generateLicenseKey(genDeviceId.trim(), genDuration);
    setGeneratedKey(key);
    showNotification('تم توليد مفتاح الترخيص بنجاح!', 'success');
  };

  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      const fb = await testCloudConnection();
      setDiagResult(fb);
      if (fb.success) {
        showNotification(`✅ اتصال السحابة ممتاز (${fb.latencyMs}ms)`, 'success');
      } else {
        showNotification('⚠️ تعذر الاتصال بالسحابة', 'error');
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    if (!currentPinInput.trim() || !newPinInput.trim() || !confirmPinInput.trim()) {
      setPinChangeMsg({ text: 'يرجى ملء جميع حقول الرمز السري', type: 'error' });
      return;
    }

    if (newPinInput.trim().length < 4) {
      setPinChangeMsg({ text: 'يجب أن يتكون الرمز الجديد من 4 خانات على الأقل', type: 'error' });
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinChangeMsg({ text: 'رمز القفل الجديد وتأكيده غير متطابقين!', type: 'error' });
      return;
    }

    setIsChangingPin(true);
    try {
      const isCurrentValid = await verifyOwnerSecurityPIN(currentPinInput.trim());
      if (!isCurrentValid) {
        setPinChangeMsg({ text: 'الرمز السري الحالي غير صحيح!', type: 'error' });
        setIsChangingPin(false);
        return;
      }

      const newHash = await hashPINString(newPinInput.trim());
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('_sys_diag_checksum_v2', newHash);
      }

      setPinChangeMsg({ text: '✅ تم تغيير وتحديث رمز قفل المالك بنجاح!', type: 'success' });
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      showNotification('🔐 تم تغيير رمز قفل المالك السري بنجاح!', 'success');
    } catch (err: any) {
      setPinChangeMsg({ text: 'حدث خطأ أثناء تشفير وحفظ الرمز الجديد', type: 'error' });
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleLockAndClose = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('owner_2fa_verified');
    }
    showNotification('🔒 تم قفل لوحة تحكم المالك وتأمين الجلسة بنجاح.', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 15 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-2 border-amber-500/40 overflow-hidden text-right z-10 my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-4 sm:p-5 border-b border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLockAndClose}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                title="قفل لوحة المالك وتأمين الجلسة"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>قفل الأداة وإخفاؤها 🔒</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>المالك والمطور الرئيسي</span>
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-white">
                    {currentUser?.displayName || 'عصام فهد'}
                  </h3>
                </div>
                <p className="text-[11px] font-mono text-amber-200/80 dir-ltr text-right mt-0.5">
                  {currentUser?.email || OWNER_EMAIL}
                </p>
              </div>

              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Owner" 
                  className="w-11 h-11 rounded-2xl border-2 border-amber-400 shadow-lg object-cover" 
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center font-black text-lg">
                  👑
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-2 p-2.5 bg-slate-900 text-white border-b border-slate-800 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-indigo-300 font-bold block">مستخدمو Google</span>
              <span className="text-sm sm:text-base font-black text-indigo-400">{cloudUsers.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-amber-300 font-bold block">طلبات معلقة</span>
              <span className="text-sm sm:text-base font-black text-amber-400">{pendingRequests.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-emerald-300 font-bold block">أجهزة مفعلة</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">{approvedRequests.length}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-300 font-bold block">مشروع Firebase</span>
              <span className="text-[11px] font-mono font-black text-amber-300 truncate block mt-0.5">{CLOUD_PROJECT_ID}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: '📊 نظرة عامة ومستخدمين' },
              { id: 'requests', label: '📡 طلبات التفعيل', count: pendingRequests.length },
              { id: 'generator', label: '🛠️ توليد ترخيص' },
              { id: 'updates', label: '🚀 نشر التحديثات' },
              { id: 'security', label: '🔐 رمز القفل والأمان' },
              { id: 'system', label: '⚡ حالة السحابة' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white text-[9px] rounded-full font-mono animate-pulse">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 max-h-[58vh] overflow-y-auto no-scrollbar space-y-4">
            
            {/* Tab 0: Overview & Cloud Users */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200 text-right space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="p-1.5 rounded-xl bg-indigo-600 text-white"><Users className="w-4 h-4" /></span>
                      <span className="text-[11px] font-bold text-indigo-900">المستخدمين المسجلين</span>
                    </div>
                    <p className="text-xl font-black text-indigo-950 font-mono pt-1">{cloudUsers.length} مستخدم</p>
                    <p className="text-[10px] text-indigo-600 font-medium">سجلوا دخولهم عبر Google</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 text-right space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="p-1.5 rounded-xl bg-amber-600 text-white"><Radio className="w-4 h-4" /></span>
                      <span className="text-[11px] font-bold text-amber-900">طلبات الأجهزة</span>
                    </div>
                    <p className="text-xl font-black text-amber-950 font-mono pt-1">{allCloudRequests.length} جهاز</p>
                    <p className="text-[10px] text-amber-700 font-medium">{pendingRequests.length} طلب ينتظر موافقتك</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200 text-right space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="p-1.5 rounded-xl bg-emerald-600 text-white"><ShieldCheck className="w-4 h-4" /></span>
                      <span className="text-[11px] font-bold text-emerald-900">الأجهزة المرخصة</span>
                    </div>
                    <p className="text-xl font-black text-emerald-950 font-mono pt-1">{approvedRequests.length} رخصة</p>
                    <p className="text-[10px] text-emerald-700 font-medium">تعمل بكفاءة وتراخيص رسمية</p>
                  </div>
                </div>

                {/* Cloud Users Table */}
                <div className="space-y-2 text-right">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500 font-bold">إجمالي: {cloudUsers.length}</span>
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>قائمة المستخدمين الموثقين عبر السحابة:</span>
                    </h4>
                  </div>

                  {cloudUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      لم يقم أي مستخدم عادي بتسجيل الدخول عبر Google حتى الآن، ستظهر بياناتهم هنا فور دخولهم.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cloudUsers.map((u, i) => (
                        <div 
                          key={`user-profile-${u.uid || i}`}
                          className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between text-right"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              u.isOwner ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {u.isOwner ? '👑 المالك' : '🟢 مستخدم'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-SA') : 'الآن'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div>
                              <p className="text-xs font-black text-slate-800 flex items-center justify-end gap-1">
                                <span>{u.displayName || 'مستخدم بدون اسم'}</span>
                                {u.isOwner && <Crown className="w-3 h-3 text-amber-500" />}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500 dir-ltr text-right">{u.email}</p>
                            </div>
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {u.displayName?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 1: Requests */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {allCloudRequests.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا توجد أي طلبات تفعيل سحابية في السحابة حالياً.
                  </div>
                ) : (
                  allCloudRequests.map((req, idx) => {
                    const selectedDuration = requestDurations[req.deviceId] || req.requestedDuration || 365;
                    return (
                      <div 
                        key={`modal-req-${req.deviceId}-${idx}`}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 text-right ${
                          req.status === 'pending'
                            ? 'bg-amber-50/70 border-amber-200'
                            : req.status === 'approved'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onDeleteRequest(req.deviceId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف الطلب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {req.status === 'pending' ? 'معلق ⏳' : req.status === 'approved' ? 'مفعّل ✅' : 'مرفوض ❌'}
                            </span>
                            <h4 className="font-black text-slate-800 text-xs sm:text-sm">{req.storeName}</h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-150">
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">الهاتف:</span>
                            <span className="font-mono font-bold text-slate-700">{req.phone || 'غير مسجل'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">معرف الجهاز:</span>
                            <span className="font-mono font-bold text-indigo-600 truncate block dir-ltr text-right">{req.deviceId}</span>
                          </div>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-1">
                            <select
                              value={selectedDuration}
                              onChange={(e) => setRequestDurations(prev => ({ ...prev, [req.deviceId]: Number(e.target.value) }))}
                              className="text-xs bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-700 outline-none"
                            >
                              <option value={30}>30 يوم (شهر)</option>
                              <option value={90}>90 يوم (3 أشهر)</option>
                              <option value={180}>180 يوم (6 أشهر)</option>
                              <option value={365}>365 يوم (سنة كاملة)</option>
                              <option value={9999}>ترخيص دائم (مدى الحياة)</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => onApproveRequest(req, selectedDuration)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>موافقة وتفعيل فوري ✅</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRejectRequest(req.deviceId, req.storeName)}
                              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                            >
                              رفض
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Generator */}
            {activeTab === 'generator' && (
              <div className="space-y-3.5 text-right">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-bold">
                  توليد كود ترخيص رقمي مستقل ومباشر لأي هاتف أو جهاز عميل دون الحاجة لطلب مسبق.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">معرف الجهاز (Device ID):</label>
                  <input
                    type="text"
                    value={genDeviceId}
                    onChange={(e) => setGenDeviceId(e.target.value.toUpperCase())}
                    placeholder="GR-XXXX-XXXX-XXXX"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-xs font-black text-indigo-700 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">مدة الترخيص:</label>
                  <select
                    value={genDuration}
                    onChange={(e) => setGenDuration(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value={30}>30 يوم (تجريبي / شهر)</option>
                    <option value={90}>90 يوم (3 أشهر)</option>
                    <option value={180}>180 يوم (6 أشهر)</option>
                    <option value={365}>365 يوم (سنة كاملة)</option>
                    <option value={9999}>ترخيص دائم (مدى الحياة ♾️)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Key className="w-4 h-4" />
                  <span>توليد مفتاح الترخيص الآن 🔑</span>
                </button>

                {generatedKey && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                    <span className="text-[10px] font-bold text-emerald-800 block">المفتاح الصادر:</span>
                    <span className="font-mono font-black text-xs text-emerald-700 select-all block">{generatedKey}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        showNotification('تم نسخ المفتاح إلى الحافظة!');
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      نسخ المفتاح 📋
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Updates */}
            {activeTab === 'updates' && (
              <div className="space-y-3.5 text-right">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-bold">
                  عند نشر التحديث، سيرسل النظام تنبيهاً فورياً لكل مستخدمي الـ APK والمتصفح.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رقم الإصدار الجديد (Version Tag):</label>
                  <input
                    type="text"
                    value={newVersionInput}
                    onChange={(e) => setNewVersionInput(e.target.value)}
                    placeholder="1.0.6"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-xs font-extrabold text-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رابط الـ APK المباشر:</label>
                  <input
                    type="text"
                    value={apkUrlInput}
                    onChange={(e) => setApkUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 dir-ltr text-left outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رسالة التنبيه للعملاء:</label>
                  <textarea
                    rows={3}
                    value={updateMessageInput}
                    onChange={(e) => setUpdateMessageInput(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">تحديث إجباري ⚠️</span>
                </label>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-indigo-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isPublishing ? 'جاري النشر للسحابة...' : 'نشر التحديث وإرسال التنبيه لكافة المستخدمين الآن 🚀'}</span>
                </button>
              </div>
            )}

            {/* Tab 4: Security & PIN Management */}
            {activeTab === 'security' && (
              <div className="space-y-4 text-right">
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                      مشفّر بـ SHA-256 🔒
                    </span>
                    <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>إدارة رمز القفل السري للمالك:</span>
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    هذا الرمز هو مفتاحك السري للتحقق الثنائي (2FA) ولدخول لوحة المالك. يمكنك تغييره هنا بأي رمز تختاره، وسيتم تشفيره فوراً ولا يستطيع أي شخص الاطلاع عليه.
                  </p>
                </div>

                <form onSubmit={handleChangePin} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رمز القفل الحالي للمالك:</label>
                    <div className="relative">
                      <input
                        type={showPins ? 'text' : 'password'}
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder="أدخل الرمز الحالي..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">رمز القفل الجديد:</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="الرمز الجديد..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">تأكيد الرمز الجديد:</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="أعد إدخال الرمز الجديد..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPins(!showPins)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPins ? 'إخفاء الرموز' : 'إظهار الرموز'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isChangingPin}
                      className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      {isChangingPin ? 'جاري الحفظ...' : 'حفظ وتشفير الرمز الجديد 💾'}
                    </button>
                  </div>

                  {pinChangeMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                      pinChangeMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {pinChangeMsg.text}
                    </div>
                  )}
                </form>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleLockAndClose}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>قفل الجلسة الآن 🔒</span>
                  </button>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">قفل لوحة المالك فوراً:</p>
                    <p className="text-[10px] text-slate-500">يتطلب إدخال الرمز مجدداً عند الفتح</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: System Status */}
            {activeTab === 'system' && (
              <div className="space-y-3 text-right">
                <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-mono text-emerald-400 font-bold">{CLOUD_PROJECT_ID}</span>
                    <span className="text-slate-400">مشروع Firebase الشخصي:</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-mono text-indigo-300 font-bold">active & real-time</span>
                    <span className="text-slate-400">حالة الربط السحابي:</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-amber-300 font-bold">{currentUser?.email || OWNER_EMAIL}</span>
                    <span className="text-slate-400">المالك المصرح:</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runDiagnostics}
                  disabled={isDiagnosing}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-black text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Activity className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>{isDiagnosing ? 'جاري فحص الاتصال...' : 'فحص الاستجابة الحية الآن ⚡'}</span>
                </button>

                {diagResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800">
                    قاعدة Firebase متصلة وسريعة الاستجابة: {diagResult.latencyMs}ms ✅
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج من حساب Google</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLockAndClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-amber-300 font-black text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>قفل 🔒</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs rounded-xl transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
