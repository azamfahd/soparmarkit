import React, { useState, useEffect } from 'react';
import { 
  signInWithGoogle, 
  signOutGoogle, 
  subscribeToAuth, 
  isSuperOwner,
  OWNER_EMAIL 
} from '../../services/firebase';
import { Crown, LogIn, LogOut, ShieldCheck, UserCheck, Sparkles, ChevronDown } from 'lucide-react';
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
          showNotification?.(`👑 مرحباً بك يا أستاذ عصام! تم التحقق من حساب المالك (${OWNER_EMAIL}) وفتح كافة الصلاحيات السحابية فوراً.`, 'success');
        }
      } else {
        showNotification?.(`✅ تم تسجيل الدخول بنجاح بحساب Google: ${user.displayName || user.email}`, 'success');
      }
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        showNotification?.('تم إلغاء نافذة تسجيل الدخول.', 'error');
      } else if (err?.code === 'auth/unauthorized-domain') {
        showNotification?.('تنبيه: يجب إضافة هذا النطاق في Authorized Domains في Firebase Console.', 'error');
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

  // Variant: Card in Settings
  if (variant === 'card') {
    return (
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
    );
  }

  // Variant: Header (compact pill)
  return (
    <div className="relative">
      {currentUser ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (isOwner) {
                handleOpenOwnerDashboard();
              } else {
                setShowMenu(prev => !prev);
              }
            }}
            className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl transition-all cursor-pointer shadow-2xs border ${
              isOwner 
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900 hover:from-amber-100 hover:to-orange-100' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title={isOwner ? 'حساب المالك الرئيسي - اضغط لفتح لوحة التحكم' : currentUser.email || 'حسابك'}
          >
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Avatar" 
                className="w-6 h-6 rounded-full border border-amber-400 object-cover" 
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                {currentUser.displayName?.[0] || 'G'}
              </div>
            )}
            <span className="hidden sm:inline text-[11px] font-black max-w-[100px] truncate">
              {isOwner ? '👑 المالك' : (currentUser.displayName?.split(' ')[0] || 'حسابي')}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {showMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-right space-y-2">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-black text-slate-800 truncate">{currentUser.displayName}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate dir-ltr text-right">{currentUser.email}</p>
              </div>

              {isOwner && onOpenOwnerModal && (
                <button
                  type="button"
                  onClick={handleOpenOwnerDashboard}
                  className="w-full text-right p-2 text-xs font-black text-amber-900 hover:bg-amber-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>لوحة إدارة المالك 👑</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-right p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
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
    </div>
  );
};
