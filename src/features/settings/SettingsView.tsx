import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, Edit, ShieldCheck, Database, Download, Upload, 
  Sparkles, RefreshCw, Package, Camera, Key, Copy, Activity, 
  Check, Cloud, Lock, Trash2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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
}) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <Edit className="w-5 h-5" />
            <h3 className="font-bold">إعدادات المتجر</h3>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">اسم النشاط التجاري</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all"
              />
              <Button onClick={() => updateStoreName(storeName)}>حفظ</Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">العملة</label>
            <div className="flex gap-2">
              <select 
                value={currency}
                onChange={(e) => updateCurrency(e.target.value)}
                className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all"
              >
                <option value="ر.ي">ريال يمني (ر.ي)</option>
                <option value="ر.س">ريال سعودي (ر.س)</option>
                <option value="$">دولار أمريكي ($)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">تقريب سعر البيع (إلى أقرب)</label>
            <div className="flex gap-2">
              <select 
                value={roundingFactor || 0}
                onChange={(e) => updateRoundingFactor(Number(e.target.value) || null)}
                className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 outline-none transition-all"
              >
                <option value={0}>بدون تقريب</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4 border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-emerald-500/10 text-emerald-700 text-[9px] font-extrabold px-2.5 py-1 rounded-br-2xl">
            مستحسن 🔒
          </div>
          <div className="flex items-center gap-2 text-slate-800 mb-1">
            <div className="p-2 bg-slate-100 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">نظام حماية وإدارة صلاحيات الكاشير</h3>
              <p className="text-[10px] text-slate-400">تأمين العمليات الحساسة بررمز مرور خاص بالمدير</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-600">حالة نظام الحماية والتقييد:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${permissionsEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-150' : 'bg-slate-100 text-slate-500'}`}>
              {permissionsEnabled ? 'نشط ومحمي 🔒' : 'معطل (مفتوح بالكامل)'}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <Button 
              onClick={() => {
                verifyAdminPermission('settings', () => {
                  setShowPermissionsConfigModal(true);
                }, '⚙️ تهيئة إعدادات الأمان والصلاحيات');
              }}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold flex items-center justify-center gap-2 rounded-xl transition-all shadow-xs cursor-pointer text-xs py-3"
            >
              <span>🔑 إعداد الصلاحيات وتغيير الرمز</span>
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <Database className="w-5 h-5" />
            <h3 className="font-bold">تصدير واستيراد البيانات (JSON)</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" className="flex items-center justify-center gap-2" onClick={exportData}>
              <Download className="w-4 h-4" />
              تصدير نسخة احتياطية (JSON)
            </Button>
            {window.pywebview && window.pywebview.api ? (
              <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={handleImportPython}>
                <Upload className="w-4 h-4" />
                استيراد نسخة احتياطية (عبر النظام)
              </Button>
            ) : (
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importData}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  استيراد نسخة احتياطية
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4 border-violet-100 bg-gradient-to-br from-white to-violet-50/20 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 text-violet-750">
            <div className="p-1.5 bg-violet-50 text-violet-605 rounded-xl border border-violet-100/50">
              <Sparkles className="w-5 h-5 text-violet-605 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800">الاستيراد الذكي بالـ AI والملفات 🎯</h3>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed font-semibold">
            هل تمتلك مبيعات، ديون زبائن، أو قوائم بضائع مكتوبة على الدفتر أو في ملفات إكسل؟ قم بالتقاط صورة أو كتابة النص وسيتولى الذكاء الاصطناعي معالجتها وفكها فوراً.
          </p>
          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center gap-2 rounded-xl transition-all"
            onClick={() => setActiveTab('smart-import')}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            تحميل واستيراد البيانات الآن
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-700">
              <Database className="w-5 h-5" />
              <h3 className="font-bold">النسخ الاحتياطي التلقائي (قاعدة بيانات النظام)</h3>
            </div>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-full ${
              isBackupSyncing 
                ? 'bg-violet-50 text-violet-600 animate-pulse' 
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackupSyncing ? 'bg-violet-500 animate-ping' : 'bg-emerald-500'}`} />
              {isBackupSyncing ? 'جاري الحفظ للتلقائي...' : 'آمن ومحدث تلقائياً'}
            </span>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed">
            يقوم النظام بحفظ كافة البيانات حياً بشكل مباشر على جهازك المستضيف في ملف نظام آمن يحمل اسم <code className="bg-slate-50 text-violet-600 font-mono px-1 rounded font-bold">قاعدة بيانات النظام.json</code> عند أي حركة بيع أو تعديل.
          </p>

          <div className="flex items-center justify-between p-3.5 bg-violet-50/40 rounded-2xl border border-violet-100/50">
            <div className="space-y-0.5 text-right">
              <label className="text-xs font-black text-slate-800 block">التحديث والنسخ الاحتياطي التلقائي المستمر</label>
              <p className="text-[10px] text-slate-500 font-bold leading-normal">يقوم بحفظ العمليات ومزامنتها حياً في الخلفية بدون تدخلك</p>
            </div>
            <button
              onClick={() => setIsAutoBackupEnabled(!isAutoBackupEnabled)}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-250 cursor-pointer ${
                isAutoBackupEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              } flex items-center ${isAutoBackupEnabled ? 'justify-end' : 'justify-start'}`}
            >
              <motion.div 
                layout
                className="w-4 h-4 bg-white rounded-full shadow-xs" 
              />
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>حالة الملف التلقائي:</span>
              <span className="font-bold text-slate-800">{autoBackupFileStatus?.exists ? 'موجود ونشط ونشط حياً' : 'موجود (متصل بالأجهزة)'}</span>
            </div>
            {autoBackupFileStatus?.exists && (
              <>
                <div className="flex justify-between items-center text-slate-600">
                  <span>حجم قاعدة البيانات التلقائية:</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {(autoBackupFileStatus.size ? autoBackupFileStatus.size / 1024 : 1.2).toFixed(2)} KB
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>تاريخ آخر حفظ وتحديث تلقائي:</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {autoBackupFileStatus.lastModified ? new Date(autoBackupFileStatus.lastModified).toLocaleTimeString('ar-SA') : 'الآن'}
                  </span>
                </div>
              </>
            )}
          </div>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 text-violet-600 border-violet-200 hover:bg-violet-50" 
            onClick={forceLocalDiskBackup}
            disabled={isBackupSyncing}
          >
            <RefreshCw className={`w-4 h-4 ${isBackupSyncing ? 'animate-spin' : ''}`} />
            تحديث وحفظ مع قاعدة بيانات النظام بشكل فوري
          </Button>
        </Card>

        <Card className="space-y-4 border-red-100">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <RefreshCw className="w-5 h-5" />
            <h3 className="font-bold">إعادة الضبط</h3>
          </div>
          <p className="text-sm text-slate-500">
            سيؤدي هذا الإجراء إلى حذف جميع البيانات المسجلة (المنتجات، الزبائن، المبيعات) والعودة للحالة الأولية.
          </p>
          <Button variant="danger" className="w-full" onClick={resetDatabase}>
            إعادة ضبط المصنع
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <Package className="w-5 h-5" />
            <h3 className="font-bold">حول النظام</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>إصدار النظام:</span>
              <span className="font-mono">v2.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>نوع قاعدة البيانات:</span>
              <span className="font-mono">IndexedDB (Local)</span>
            </div>
            <div className="flex justify-between">
              <span>حالة التثبيت:</span>
              <span className={deferredPrompt ? "text-amber-600" : "text-emerald-600"}>
                {deferredPrompt ? "جاهز للتثبيت" : "مثبت / يعمل عبر المتصفح"}
              </span>
            </div>
          </div>
          {deferredPrompt && (
            <Button className="w-full" onClick={handleInstall}>تثبيت التطبيق الآن</Button>
          )}
        </Card>

        <Card className="space-y-4 border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-bold">الصلاحيات والكاميرا</h3>
          </div>
          <p className="text-sm text-slate-500">
            استخدم هذا الزر لطلب صلاحية الوصول إلى الكاميرا إذا كنت تواجه مشكلة في تشغيل الماسح الضوئي.
          </p>
          <Button variant="outline" className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={requestGlobalCameraPermission}>
            السماح بالوصول للكاميرا
          </Button>
        </Card>

        {/* كرت حالة الاشتراك وتفعيل الترخيص */}
        <Card className="space-y-4 border-slate-200">
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
            className="flex items-center gap-2 text-indigo-700 mb-2 cursor-pointer select-none"
            title="تفعيل ترخيص البرنامج"
          >
            <Key className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="font-bold text-slate-800">تفعيل ترخيص البرنامج</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2 text-right">
              <div className="flex justify-between items-center">
                <span className="font-bold">معرف هذا الجهاز:</span>
                <div className="flex items-center gap-2 font-mono text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  <span>{deviceID}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(deviceID);
                      showNotification('تم نسخ معرف الجهاز بنجاح!');
                    }}
                    className="text-indigo-500 hover:text-indigo-700 p-0.5 hover:bg-indigo-100/50 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-bold">حالة التفعيل:</span>
                {isActivated ? (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full">مفعل بنجاح ✅</span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 rounded-full">نسخة تجريبية ⏳ ({trialDaysLeft} أيام متبقية)</span>
                )}
              </div>

              {isActivated && activationDetails && (
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>تاريخ انتهاء الصلاحية:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {activationDetails.expiresAt === 'lifetime' ? 'مدى الحياة (دائم)' : new Date(activationDetails.expiresAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              )}
            </div>

            {!isActivated ? (
              <div className="space-y-4">
                <div className="space-y-2">
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
                      className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 font-mono text-center text-sm rounded-xl focus:border-indigo-500 outline-none transition-all uppercase"
                    />
                    <Button onClick={() => handleActivateApp()} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">تفعيل</Button>
                  </div>
                  {activationError && (
                    <p className="text-[11px] text-rose-600 font-bold text-center mt-1">{activationError}</p>
                  )}
                </div>

                {/* Cloud Request Section */}
                <div className="border-t border-slate-100 pt-3 text-right">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                      الطلب والتنشيط السحابي السريع
                    </span>
                    <span className="text-[9px] text-indigo-500 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">تلقائي</span>
                  </h4>

                  {cloudRequest ? (
                    <div className="space-y-2 text-right text-xs">
                      {cloudRequest.status === 'pending' && (
                        <div className="bg-amber-50 border border-amber-200/50 p-3 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span>طلبك قيد المراجعة سحابياً</span>
                          </div>
                          <p className="text-[10px] text-amber-700 leading-relaxed">
                            بمجرد موافقة المالك من لوحة التحكم الخاصة به، سيتم تفعيل جهازك تلقائياً وبشكل فوري دون الحاجة لإدخال المفتاح يدوياً!
                          </p>
                          <button
                            onClick={() => handleDeleteCloudRequest(deviceID)}
                            className="w-full mt-1 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg transition-colors cursor-pointer text-center text-[10px]"
                          >
                            إلغاء الطلب الحالي ✕
                          </button>
                        </div>
                      )}

                      {cloudRequest.status === 'rejected' && (
                        <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl space-y-2">
                          <div className="flex items-center gap-1 text-rose-800 font-bold">
                            <span>✕ تم رفض الطلب من قبل المالك</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCloudRequest(deviceID)}
                            className="w-full mt-1 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg transition-colors cursor-pointer text-center text-[10px]"
                          >
                            تقديم طلب جديد ↺
                          </button>
                        </div>
                      )}

                      {cloudRequest.status === 'approved' && (
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl space-y-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold mb-1">
                            <span>✓ تمت الموافقة على طلبك!</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mb-2">المفتاح الصادر: <span className="font-mono text-indigo-600">{cloudRequest.licenseKey}</span></p>
                          <button
                            onClick={() => {
                              if (cloudRequest.licenseKey) {
                                setActivationKeyInput(cloudRequest.licenseKey);
                                setTimeout(() => handleActivateApp(cloudRequest.licenseKey), 100);
                              }
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تنشيط فوري للبرنامج ⚡</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-right text-xs">
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        أرسل طلب تفعيل مباشر لمالك البرنامج سحابياً ليقوم بتفعيل جهازك دون الحاجة لنقل الرموز يدوياً.
                      </p>
                      
                      <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-600">اسم المتجر/النشاط:</span>
                          <input 
                            type="text"
                            value={clientStoreName}
                            onChange={(e) => setClientStoreName(e.target.value)}
                            placeholder="سوبرماركت الوفاء"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs focus:border-indigo-500 transition-all text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-600">رقم هاتف للتواصل:</span>
                          <input 
                            type="text"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="777xxxxxx"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs focus:border-indigo-500 transition-all text-left font-mono"
                          />
                        </div>
                        <button
                          disabled={isSubmittingRequest}
                          onClick={handleRequestCloudActivation}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white font-bold rounded-lg transition-all cursor-pointer text-[11px] flex items-center justify-center gap-1 mt-1"
                        >
                          {isSubmittingRequest ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري إرسال الطلب...</span>
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3.5 h-3.5" />
                              <span>إرسال الطلب السحابي 📡</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleDeactivateApp}>
                إلغاء تفعيل الترخيص الحالي
              </Button>
            )}

            {showHiddenAdminInput && !isDeveloperMode && (
              <div className="bg-slate-950 p-4 border border-slate-800/60 rounded-2xl space-y-3 mt-4 text-right">
                <label className="text-xs font-bold text-slate-300 block">منفذ معايرة النظام المحاسبي (Diagnostic Port Code):</label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={developerPinInput}
                    onChange={(e) => {
                      setDeveloperPinInput(e.target.value);
                      setDeveloperPinError('');
                    }}
                    placeholder="أدخل رمز الاستجابة الرقمي (e.g., 8080)..."
                    className="flex-1 p-2 bg-slate-900 text-white font-mono placeholder-slate-600 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none text-center text-xs"
                  />
                  <button 
                    onClick={handleVerifyDeveloperPIN}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    مزامنة 🛠️
                  </button>
                </div>
                {developerPinError && (
                  <p className="text-[10px] text-amber-500/90 font-bold leading-relaxed">{developerPinError}</p>
                )}
                <button 
                  onClick={() => {
                    setShowHiddenAdminInput(false);
                    setDeveloperPinError('');
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 block mx-auto mt-1"
                >
                  إغلاق نافذة المعايرة
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* كرت مولد مفاتيح التفعيل - للمالك */}
        {isDeveloperMode && (
          <Card className="space-y-4 border-indigo-200 shadow-md shadow-indigo-500/5 bg-slate-50 border-2">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2 mb-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">أداة توليد مفاتيح الترخيص (للمطور/المالك)</h3>
              </div>
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
                  onClick={() => setActiveDevTab('requests')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center relative ${activeDevTab === 'requests' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
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
      </div>
    </motion.div>
  );
};

export default SettingsView;
