import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Key, 
  Info, 
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface CloudSyncSectionProps {
  deviceID?: string;
  isActivated?: boolean;
  trialDaysLeft?: number;
  activationDetails?: any;
  handleRequestCloudActivation?: (customDuration?: number, isRenewal?: boolean) => void;
  isSubmittingRequest?: boolean;
  setActiveTab?: (tab: string) => void;
}

export const CloudSyncSection: React.FC<CloudSyncSectionProps> = ({
  deviceID,
  isActivated,
  trialDaysLeft,
  activationDetails,
  handleRequestCloudActivation,
  isSubmittingRequest,
  setActiveTab
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Primary Local-First Statement Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/5 border border-blue-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-slate-800">التطبيق محلي 100% (Offline-First)</h3>
                <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                  ميزة اختيارية
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                جميع بيانات محلك، فواتيرك، حسابات الزبائن والموردين، وملفات Excel تُحفظ محلياً على جهازك فقط. 
                الاتصال بالإنترنت اختياري تماماً ولا يؤثر إطلاقاً على سير عمل التطبيق أو صلاحياته.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-2xs">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">متصل بالإنترنت</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500">غير متصل (أوفلاين - يعمل 100%)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Grid: Local vs Optional Cloud */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Local Architecture */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-700 border-b border-emerald-100 pb-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Laptop className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-800">التشغيل المحلي الدائم (الافتراضي)</h4>
              <p className="text-[11px] text-slate-400">يعمل بدون إنترنت مدى الحياة</p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>حفظ فوري للمبيعات والفواتير في ذاكرة IndexedDB المحلية فائقة السرعة.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>مزامنة مباشرة مع ملفات Excel المحفوظة على القرص الصلب للحاسوب.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>خصوصية كاملة 100%، أرقامك وأرباحك لا تغادر جهازك أبداً.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>تصدير واسترجاع نسخ احتياطية كاملة (JSON و Excel) دون الحاجة للشبكة.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Optional Cloud Sync & Licensing */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2.5 text-indigo-700">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Cloud className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-800">الربط والمزامنة السحابية (اختياري)</h4>
                <p className="text-[11px] text-slate-400">للربط بين عدة أجهزة أو تفعيل التراخيص</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              ميزة إضافية
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">معرف جهازك الحالي (Device ID):</span>
                <span className="font-mono text-[10px] text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-100">{deviceID || 'LOCAL-DEVICE'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">حالة التفعيل:</span>
                <span className={`font-black ${isActivated ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isActivated ? '● مفعل ومسجل' : trialDaysLeft !== undefined ? `فترة تجريبية (${trialDaysLeft} يوم)` : 'غير مفعل'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              إذا رغبت في مزامنة فواتيرك بين الهاتف والحاسوب أو إرسال نسخة سحابية مشفرة لمدير المتجر، يمكنك طلب الربط السحابي الاختياري.
            </p>

            {setActiveTab && (
              <Button
                onClick={() => setActiveTab('settings')}
                variant="outline"
                className="w-full text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 py-2 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>إدارة التراخيص والمطور في الإعدادات</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
