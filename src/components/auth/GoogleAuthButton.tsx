import React, { useState, useEffect, useRef } from 'react';
import { 
  signInWithGoogle, 
  signOutGoogle, 
  subscribeToAuth, 
  isSuperOwner,
  OWNER_EMAIL 
} from '../../services/firebase';
import { 
  Crown, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  ChevronDown,
  ChevronLeft,
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  AlertCircle, 
  KeyRound 
} from 'lucide-react';
import type { User } from 'firebase/auth';

interface GoogleAuthButtonProps {
  onOpenOwnerModal?: () => void;
  onRequireOwnerVerification?: () => void;
  onOwnerAuthChanged?: (isOwner: boolean, user: User | null) => void;
  showNotification?: (msg: string, type?: 'success' | 'error') => void;
  variant?: 'header' | 'card' | 'sidebar';
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onOpenOwnerModal,
  onRequireOwnerVerification,
  onOwnerAuthChanged,
  showNotification,
  variant = 'header'
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showMenu]);

  useEffect(() => {
    const unsub = subscribeToAuth((user, ownerFlag) => {
      setCurrentUser(user);
      setIsOwner(ownerFlag);
      if (onOwnerAuthChanged) {
        onOwnerAuthChanged(ownerFlag, user);
      }
    });
    return () => unsub();
  }, []);

  const handleOpenOwnerDashboard = () => {
    setShowMenu(false);
    const is2fa = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('owner_2fa_verified') === 'true';
    if (!is2fa && onRequireOwnerVerification) {
      onRequireOwnerVerification();
    } else if (onOpenOwnerModal) {
      onOpenOwnerModal();
    }
  };

  const handleSignIn = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showNotification?.('⚠️ لا يوجد اتصال بالإنترنت حالياً للمصادقة عبر Google. يمكنك الاستمرار في العمل بالوضع المحلي أوفلاين أو استخدام رمز أمان المالك.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { user, isOwner: ownerResult } = await signInWithGoogle();
      setCurrentUser(user);
      setIsOwner(ownerResult);
      if (ownerResult) {
        const is2fa = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('owner_2fa_verified') === 'true';
        if (!is2fa && onRequireOwnerVerification) {
          onRequireOwnerVerification();
        } else {
          showNotification?.(`👑 مرحباً بك يا أستاذ عزام! تم التحقق من حساب المالك (${OWNER_EMAIL}) وفتح كافة الصلاحيات السحابية فوراً.`, 'success');
        }
      } else {
        showNotification?.(`✅ تم تسجيل الدخول بنجاح بحساب Google: ${user.displayName || user.email}`, 'success');
      }
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        showNotification?.('تم إلغاء نافذة تسجيل الدخول.', 'error');
      } else if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        const domain = err?.unauthorizedDomain || (typeof window !== 'undefined' ? window.location.hostname : '');
        setUnauthorizedDomain(domain);
        showNotification?.(`تنبيه: النطاق (${domain}) غير مصرح به في Firebase Console.`, 'error');
      } else if (err?.message?.includes('missing initial state') || err?.message?.includes('storage-partitioned')) {
        showNotification?.('💡 تم حظر ملفات تعريف الارتباط في المتصفح. يمكنك الضغط على "دخول المالك برمز الأمان" أدناه للدخول الفوري.', 'error');
        if (onRequireOwnerVerification) {
          onRequireOwnerVerification();
        }
      } else {
        showNotification?.(err?.message || 'تعذر تسجيل الدخول بحساب Google حالياً، يمكنك استخدام رمز أمان المالك.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyDomainToClipboard = () => {
    if (unauthorizedDomain) {
      navigator.clipboard.writeText(unauthorizedDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
      showNotification?.('تم نسخ النطاق بنجاح! الصقه الآن في Firebase Console.', 'success');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogle();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('owner_2fa_verified');
      }
      setCurrentUser(null);
      setIsOwner(false);
      setShowMenu(false);
      showNotification?.('تم تسجيل الخروج من حساب Google بنجاح.', 'success');
    } catch (err: any) {
      showNotification?.(err?.message || 'حدث خطأ أثناء تسجيل الخروج', 'error');
    }
  };

  // Google SVG Logo Icon
  const GoogleGLogo = () => (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );

  // Unauthorized Domain Assistance Modal
  const renderUnauthorizedModal = () => {
    if (!unauthorizedDomain) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">إضافة النطاق إلى Firebase Console 🔑</h3>
                <p className="text-xs text-slate-500 font-medium">خطوة بسيطة لمرة واحدة للموافقة على تسجيل الدخول</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUnauthorizedDomain(null)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-2 leading-relaxed">
            <p className="font-bold">
              تمنع Google تسجيل الدخول حالياً لأن هذا النطاق غير مدرج في قائمة النطاقات المسموح بها في مشروع Firebase الخاص بك.
            </p>
            <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-amber-300 font-mono text-xs text-slate-800 select-all">
              <span className="truncate">{unauthorizedDomain}</span>
              <button
                type="button"
                onClick={copyDomainToClipboard}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-sans font-bold text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? 'تم النسخ' : 'نسخ النطاق'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-bold text-slate-800">طريقة الإضافة في دقيقة واحدة:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pr-1">
              <li>افتح إعدادات مشروعك في <span className="font-bold">Firebase Console</span>.</li>
              <li>اذهب إلى <span className="font-bold text-indigo-700">Authentication</span> ⬅️ <span className="font-bold">Settings</span> ⬅️ <span className="font-bold">Authorized domains</span>.</li>
              <li>اضغط على زر <span className="font-bold text-emerald-700">Add domain</span> والصق النطاق المنسوخ أعلاه.</li>
            </ol>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="https://console.firebase.google.com/project/smart-account20/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح إعدادات Firebase Console</span>
            </a>

            {onRequireOwnerVerification && (
              <button
                type="button"
                onClick={() => {
                  setUnauthorizedDomain(null);
                  onRequireOwnerVerification();
                }}
                className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>دخول المالك السريع بالرمز (PIN)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Variant: Card in Settings
  if (variant === 'card') {
    return (
      <>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                <GoogleGLogo />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                  <span>المتابعة عبر حساب Google</span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">اختياري</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  توثيق حسابك ومزامنة صلاحيات النظام السحابية
                </p>
              </div>
            </div>

            {currentUser && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isOwner 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {isOwner ? <Crown className="w-3 h-3 text-amber-600" /> : <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                <span>{isOwner ? 'المالك المعتمد 👑' : 'مستخدم موثق'}</span>
              </span>
            )}
          </div>

          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>خروج</span>
                </button>
                <div className="flex items-center gap-2.5 text-right">
                  <div>
                    <h5 className="text-xs font-black text-slate-800 flex items-center justify-end gap-1">
                      <span>{currentUser.displayName || 'مستخدم Google'}</span>
                      {isOwner && <Crown className="w-3 h-3 text-amber-500" />}
                    </h5>
                    <p className="text-[10px] font-mono text-slate-500 dir-ltr text-right">{currentUser.email}</p>
                  </div>
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="User Avatar" 
                      className="w-9 h-9 rounded-full border-2 border-indigo-200 shadow-2xs object-cover" 
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
              </div>

              {isOwner && onOpenOwnerModal && (
                <button
                  type="button"
                  onClick={handleOpenOwnerDashboard}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white rounded-xl font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:opacity-95"
                >
                  <Crown className="w-4 h-4 text-amber-200" />
                  <span>فتح لوحة تحكم وإدارة المالك الشاملة 👑</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <GoogleGLogo />
              <span>{loading ? 'جاري فتح تسجيل الدخول...' : 'المتابعة والتسجيل بحساب Google الآن'}</span>
            </button>
          )}
        </div>
        {renderUnauthorizedModal()}
      </>
    );
  }

  // Variant: Header (compact pill)
  return (
    <div ref={menuRef} className="relative">
      {currentUser ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowMenu(prev => !prev)}
            className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl transition-all cursor-pointer shadow-2xs border ${
              isOwner 
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900 hover:from-amber-100 hover:to-orange-100' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title={isOwner ? 'حساب المالك والمطور الرئيسي - اضغط للخيارات' : currentUser.email || 'حسابك'}
          >
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Avatar" 
                className={`w-6 h-6 rounded-full object-cover border ${isOwner ? 'border-amber-400' : 'border-slate-300'}`} 
              />
            ) : (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isOwner ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                {isOwner ? '👑' : (currentUser.displayName?.[0] || 'G')}
              </div>
            )}
            <span className="hidden sm:inline text-[11px] font-black max-w-[110px] truncate">
              {isOwner ? '👑 عزام فهد' : (currentUser.displayName?.split(' ')[0] || 'حسابي')}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {showMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2.5 z-50 text-right space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
              {isOwner ? (
                /* Owner Dropdown Header */
                <div className="p-2.5 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-slate-50 rounded-xl border border-amber-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      Super Owner 👑
                    </span>
                    <p className="text-xs font-black text-slate-900 truncate">
                      {currentUser.displayName || 'الأستاذ عزام فهد'}
                    </p>
                  </div>
                  <p className="text-[10px] text-amber-900/80 font-mono truncate dir-ltr text-right">
                    {currentUser.email}
                  </p>
                </div>
              ) : (
                /* Regular User Dropdown Header */
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      مستخدم موثق 🟢
                    </span>
                    <p className="text-xs font-black text-slate-800 truncate">
                      {currentUser.displayName || 'مستخدم المتجر'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate dir-ltr text-right">
                    {currentUser.email}
                  </p>
                </div>
              )}

              {/* Owner Action: Launch Master Control Hub */}
              {isOwner && onOpenOwnerModal && (
                <button
                  type="button"
                  onClick={handleOpenOwnerDashboard}
                  className="w-full text-right p-2.5 text-xs font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-slate-950" />
                    <span>لوحة تحكم وإدارة المالك 🚀</span>
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-950" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleSignOut();
                }}
                className="w-full text-right p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج من الحساب</span>
                </div>
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 rounded-xl border border-slate-200/90 shadow-2xs font-extrabold text-[11px] transition-all cursor-pointer"
          title="تسجيل الدخول الاختياري بحساب Google"
        >
          <GoogleGLogo />
          <span className="hidden sm:inline">دخول Google</span>
        </button>
      )}
      {renderUnauthorizedModal()}
    </div>
  );
};
