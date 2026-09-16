import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square, 
  ShoppingBag, 
  Wallet, 
  Settings, 
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface PermissionsConfigModalProps {
  showPermissionsConfigModal: boolean;
  setShowPermissionsConfigModal: (val: boolean) => void;
  permissionsEnabled: boolean;
  updatePermissionsEnabled: (val: boolean) => Promise<void>;
  appLockEnabled?: boolean;
  updateAppLockEnabled?: (val: boolean) => Promise<void>;
  protectedActions: Record<string, boolean>;
  updateProtectedActions: (val: Record<string, boolean>) => Promise<void>;
  adminPin: string;
  updateAdminPin: (val: string) => Promise<void>;
  showNotification: (msg: string, type?: string) => void;
  isPreUnlocked?: boolean;
}

export const ALL_ACTION_DEFINITIONS = [
  // 1. المبيعات وحماية شاشة الكاشير
  {
    category: 'pos',
    categoryTitle: '🛒 المبيعات وحماية الكاشير',
    items: [
      { key: 'delete_sale', label: 'إلغاء وعكس مبيعات الفاتورة (المرتجع)', desc: 'منع الكاشير من حذف أو إلغاء أو عكس الفواتير المسجلة إلا برمز المدير' },
      { key: 'debt_sale', label: 'البيع بالآجل / الدَّيْن للزبائن', desc: 'اشتراط موافقة المدير عند إجراء بيع بالآجل أو تسجيل دين على الزبون' },
      { key: 'discount_application', label: 'تطبيقات الخصم وتغيير أسعار الكاشير', desc: 'حماية إدخال خصم استثنائي أو تعديل أسعار البيع أثناء الفاتورة' }
    ]
  },
  // 2. المالية والصندوق
  {
    category: 'finance',
    categoryTitle: '💰 المالية والصندوق',
    items: [
      { key: 'cash_withdrawal', label: 'مسحوبات الصندوق والسحبيات والعهد', desc: 'تأمين تسجيل السحبيات الشخصية أو السلف أو المنصرفات الكاش' },
      { key: 'settlement', label: 'تصفية الصندوق وتسوية الوردية', desc: 'إجراء الجرد المادي وإغلاق الوردية ومطابقة النقدية' },
      { key: 'supplier_payment', label: 'تسديد الموردين والمدفوعات', desc: 'تسجيل الدفعات المالية للموردين وسداد الذمم المستحقة' },
      { key: 'customer_adjustment', label: 'تعديل وتسوية مديونيات الزبائن', desc: 'زيادة أو خصم أو تسوية أرصدة الديون للزبائن يدوياً' }
    ]
  },
  // 3. المخزون والإدارة
  {
    category: 'admin',
    categoryTitle: '⚙️ المخزون وإدارة النظام',
    items: [
      { key: 'edit_product', label: 'تعديل الأصناف وحذف المنتجات', desc: 'تعديل أسعار الشراء والبيع أو حذف السلع والكميات من المخزن' },
      { key: 'smart_import', label: 'الاستيراد الذكي بالذكاء الاصطناعي', desc: 'استيراد البيانات وفواتير الشراء تلقائياً باستخدام الذكاء الاصطناعي' },
      { key: 'analytics', label: 'الوصول للتقارير وصافي الأرباح', desc: 'رؤية الأرباح الحقيقية وإحصاءات المبيعات ورأس المال' },
      { key: 'settings', label: 'إعدادات النظام والنسخ الاحتياطي', desc: 'الوصول لإعدادات النظام العامة وتغيير العملة وتصدير النسخ' },
      { key: 'reset_database', label: 'تصفير وإعادة ضبط البيانات', desc: 'حماية تصفية ومسح بيانات قاعدة البيانات بالكامل' }
    ]
  },
  // 4. الواجهة الرئيسية والإحصائيات
  {
    category: 'dashboard_ui',
    categoryTitle: '🖥️ حماية وتخصيص الواجهة الرئيسية للإحصائيات',
    items: [
      { key: 'hide_dashboard_stats', label: 'إخفاء بطاقات الإحصائيات والأرقام المالية بالصفحة الرئيسية', desc: 'حجب وإخفاء أرقام المبيعات اليومية، أرباح الشهر، تكلفة المخزون والديون في الشاشة الرئيسية' },
      { key: 'hide_dashboard_charts', label: 'إخفاء المخططات والرسوم البيانية بالصفحة الرئيسية', desc: 'حجب إحصائيات ورسوم متابعة حركة المبيعات بالصفحة الرئيسية' },
      { key: 'hide_dashboard_alerts', label: 'إخفاء شريط تنبيهات النواقص وتواريخ الانتهاء بالصفحة الرئيسية', desc: 'حجب التنبيهات المباشرة لنواقص المخزون والسلع القريبة من الانتهاء في الشاشة الرئيسية' },
      { key: 'hide_dashboard_top_products', label: 'إخفاء الأصناف الأكثر مبيعاً ونسبة المساهمة بالصفحة الرئيسية', desc: 'حجب قائمة المنتجات الخمسة الأعلى أداءً وتحقيقاً للإيرادات بالكامل' }
    ]
  }
];

export const PermissionsConfigModal: React.FC<PermissionsConfigModalProps> = ({
  showPermissionsConfigModal,
  setShowPermissionsConfigModal,
  permissionsEnabled,
  updatePermissionsEnabled,
  appLockEnabled = false,
  updateAppLockEnabled,
  protectedActions,
  updateProtectedActions,
  adminPin,
  updateAdminPin,
  showNotification,
  isPreUnlocked = false
}) => {
  if (!showPermissionsConfigModal) return null;

  // Track unlock state
  const [isUnlocked, setIsUnlocked] = useState(isPreUnlocked || !adminPin);
  const [verifyPinInput, setVerifyPinInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Track new PIN setup/change state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');

  useEffect(() => {
    if (isPreUnlocked || !adminPin) {
      setIsUnlocked(true);
    }
  }, [isPreUnlocked, adminPin]);

  const verifyPinMatches = async (inputPin: string, storedPinHashOrPlain: string): Promise<boolean> => {
    if (!storedPinHashOrPlain) return false;
    const isSHA256 = typeof storedPinHashOrPlain === 'string' && /^[a-f0-9]{64}$/i.test(storedPinHashOrPlain);
    if (isSHA256) {
      const msgBuffer = new TextEncoder().encode(inputPin.trim());
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return inputHash === storedPinHashOrPlain;
    }
    return inputPin.trim() === storedPinHashOrPlain.trim();
  };

  const handleVerifyCurrentPin = async () => {
    if (!verifyPinInput.trim()) {
      setVerifyError('الرجاء إدخال الرمز الحالي أولاً');
      return;
    }
    const isCorrect = await verifyPinMatches(verifyPinInput, adminPin);
    if (isCorrect) {
      setIsUnlocked(true);
      setVerifyError('');
      showNotification('🔓 تم التحقق من الهوية بنجاح وفك قفل لوحة الصلاحيات!', 'success');
    } else {
      setVerifyError('❌ رمز الأمان المدخل غير صحيح! يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSaveNewPin = async () => {
    setPinChangeError('');
    if (!newPin || !newPin.trim()) {
      setPinChangeError('الرجاء إدخال الرمز / كلمة السر الجديدة');
      return;
    }
    if (newPin.trim().length < 2) {
      setPinChangeError('يجب أن تتكون كلمة السر من 2 أحرف/أرقام على الأقل');
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeError('رمز المرور وتأكيده غير متطابقين');
      return;
    }

    await updateAdminPin(newPin.trim());
    if (!permissionsEnabled) {
      await updatePermissionsEnabled(true);
    }
    setNewPin('');
    setConfirmPin('');
    showNotification('🔑 تم حذف الرمز القديم وحفظ كلمة سر المدير الجديدة بنجاح!', 'success');
  };

  const handleSelectAll = (select: boolean) => {
    const updated = { ...protectedActions };
    ALL_ACTION_DEFINITIONS.forEach(cat => {
      cat.items.forEach(item => {
        updated[item.key] = select;
      });
    });
    updateProtectedActions(updated);
    showNotification(select ? 'تم تفعيل الحماية لجميع الإجراءات 🔒' : 'تم إلغاء تحديد كافة الإجراءات 🔓');
  };

  const totalProtectedCount = Object.values(protectedActions).filter(Boolean).length;
  const totalAvailableCount = ALL_ACTION_DEFINITIONS.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.94, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="bg-white text-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-slate-100 text-right flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex justify-between items-center relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-2xl border border-slate-700">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black">إدارة أمان النظام وصلاحيات الكاشير</h3>
                {permissionsEnabled ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                    محمي ومقيد 🔒
                  </span>
                ) : (
                  <span className="bg-slate-700 text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                    مفتوح (معطل) 🔓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">تحديد العمليات التي تطلب رمز مرور المدير وحمايتها</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPermissionsConfigModal(false)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {!isUnlocked ? (
            /* Lock Screen */
            <div className="space-y-4 py-6 text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-750 rounded-full flex items-center justify-center mx-auto text-3xl border border-slate-200 shadow-inner">
                🔒
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-800">التحقق من رمز المدير مطلوب</h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  تم تفعيل نظام حماية الكاشير مسبقاً. للوصول لتعديل الصلاحيات وتعيين الأمان، يرجى إدخال رمز المدير الحالي.
                </p>
              </div>

              <div className="space-y-3 max-w-xs mx-auto pt-2">
                <input 
                  type="password"
                  maxLength={32}
                  value={verifyPinInput}
                  onChange={(e) => {
                    setVerifyPinInput(e.target.value);
                    if (verifyError) setVerifyError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyCurrentPin();
                    }
                  }}
                  placeholder="أدخل الرمز السرّي أو كلمة السر..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
                {verifyError && (
                  <p className="text-xs text-rose-600 font-extrabold">{verifyError}</p>
                )}
                
                <Button 
                  onClick={handleVerifyCurrentPin}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3 text-xs rounded-2xl transition-all cursor-pointer shadow-md"
                >
                  تأكيد الرمز وفك القفل 🔓
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Master System Security Toggle */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${permissionsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {permissionsEnabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-xs font-black block text-slate-800">تفعيل نظام أمان وتأمين الكاشير:</span>
                      <span className="text-[10px] text-slate-500 block">مطالبة الكاشير برمز المرور قبل تنفيذ أي حركة حساسة</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePermissionsEnabled(!permissionsEnabled)}
                    className={`w-13 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${permissionsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${permissionsEnabled ? '-translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {permissionsEnabled && (
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black block text-slate-800">قفل الشاشة عند الفتح (تسجيل الدخول) 🔒</span>
                      <span className="text-[10px] text-slate-500 block">إظهار واجهة تسجيل الدخول القفلية فور تشغيل البرنامج</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (updateAppLockEnabled) {
                          updateAppLockEnabled(!appLockEnabled);
                        }
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        appLockEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${
                        appLockEnabled ? '-translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Protected Actions Checklist */}
              {permissionsEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">تخصيص الحركات والإجراءات المحمية</h4>
                      <p className="text-[10px] text-slate-400">محمية حالياً: <span className="font-bold text-emerald-600">{totalProtectedCount}</span> من <span className="font-bold">{totalAvailableCount}</span> إجراء</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(true)}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckSquare className="w-3 h-3" />
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(false)}
                        className="text-[10px] font-black text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Square className="w-3 h-3" />
                        إلغاء الكل
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {ALL_ACTION_DEFINITIONS.map((catGroup) => (
                      <div key={`cat-group-${catGroup.category}`} className="space-y-2">
                        <h5 className="text-[11px] font-black text-slate-600 bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/60 flex items-center gap-1.5">
                          {catGroup.categoryTitle}
                        </h5>

                        <div className="grid grid-cols-1 gap-2">
                          {catGroup.items.map((item) => {
                            const isChecked = protectedActions[item.key] || false;
                            return (
                              <label
                                key={`perm-${item.key}`}
                                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs' 
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const updated = { ...protectedActions, [item.key]: e.target.checked };
                                    updateProtectedActions(updated);
                                  }}
                                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                />
                                <div className="flex-1 text-right">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`text-xs font-black block ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                                      {item.label}
                                    </span>
                                    {isChecked && (
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-0.5 shrink-0 shadow-2xs">
                                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                                        <span>محمي 🔒</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug">
                                    {item.desc}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PIN Management Section */}
              {permissionsEnabled && (
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                    <KeyRound className="w-4 h-4 text-slate-700" />
                    <div>
                      <h4 className="text-xs font-black text-slate-800">إدارة وتغيير رمز أمان المدير</h4>
                      <p className="text-[10px] text-slate-500">
                        الحالة: <span className="font-extrabold text-slate-700">{adminPin ? 'رمز المرور نشط 🔒' : 'لم يتم تعيين رمز بعد ⚠️'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 block">الرمز / كلمة السر الجديدة (أحرف وأرقام):</label>
                        <div className="relative">
                          <input 
                            type={showPasswordText ? "text" : "password"} 
                            maxLength={32}
                            value={newPin}
                            onChange={(e) => {
                              setNewPin(e.target.value);
                              if (pinChangeError) setPinChangeError('');
                            }}
                            placeholder="أدخل كلمة السر أو الرمز..." 
                            className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-center text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-slate-700 dir-ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordText(!showPasswordText)}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 block">تأكيد كلمة السر الجديدة:</label>
                        <input 
                          type={showPasswordText ? "text" : "password"} 
                          maxLength={32}
                          value={confirmPin}
                          onChange={(e) => {
                            setConfirmPin(e.target.value);
                            if (pinChangeError) setPinChangeError('');
                          }}
                          placeholder="إعادة إدخال الرمز أو كلمة السر..." 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-slate-700 dir-ltr"
                        />
                      </div>
                    </div>

                    {pinChangeError && (
                      <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200 text-[10px] font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{pinChangeError}</span>
                      </div>
                    )}

                    <Button 
                      onClick={handleSaveNewPin}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-2.5 text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      حفظ وتأكيد رمز المرور الجديد 🔐
                    </Button>
                    
                    {adminPin && (
                      <button 
                        type="button"
                        onClick={async () => {
                          await updateAdminPin('');
                          await updatePermissionsEnabled(false);
                          showNotification('🔓 تم إيقاف نظام الحماية وإلغاء رمز المدير بالكامل', 'info');
                          setNewPin('');
                          setConfirmPin('');
                        }}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-extrabold py-2 text-xs rounded-xl border border-rose-200 transition-all cursor-pointer text-center"
                      >
                        تعطيل نظام الأمان وإلغاء الرمز 🔓
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <Button 
            onClick={() => setShowPermissionsConfigModal(false)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-black px-6 py-2.5 rounded-xl cursor-pointer"
          >
            إغلاق وحفظ 
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
