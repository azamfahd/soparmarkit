import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from '../ui/Button';

export interface PermissionsConfigModalProps {
  showPermissionsConfigModal: boolean;
  setShowPermissionsConfigModal: (val: boolean) => void;
  permissionsEnabled: boolean;
  updatePermissionsEnabled: (val: boolean) => Promise<void>;
  protectedActions: Record<string, boolean>;
  updateProtectedActions: (val: Record<string, boolean>) => Promise<void>;
  adminPin: string;
  updateAdminPin: (val: string) => Promise<void>;
  showNotification: (msg: string, type?: string) => void;
}

export const PermissionsConfigModal: React.FC<PermissionsConfigModalProps> = ({
  showPermissionsConfigModal,
  setShowPermissionsConfigModal,
  permissionsEnabled,
  updatePermissionsEnabled,
  protectedActions,
  updateProtectedActions,
  adminPin,
  updateAdminPin,
  showNotification,
}) => {
  if (!showPermissionsConfigModal) return null;

  const [isUnlocked, setIsUnlocked] = React.useState(!adminPin);
  const [verifyPinInput, setVerifyPinInput] = React.useState('');
  const [verifyError, setVerifyError] = React.useState('');

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
      showNotification('🔓 تم التحقق من الهوية بنجاح وفك قفل إدارة الصلاحيات!', 'success');
    } else {
      setVerifyError('❌ رمز الأمان المدخل غير صحيح! يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div key="modal-permissions-config" className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.92, opacity: 0, y: 30 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.92, opacity: 0, y: 30 }}
        className="bg-white text-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-slate-100 text-right flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center relative shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-black">إدارة أمان النظام والصلاحيات للمدير</h3>
              <p className="text-[10px] text-slate-400">تخصيص مستويات حماية العمليات وتعيين الرمز</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPermissionsConfigModal(false)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {!isUnlocked ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-750 rounded-full flex items-center justify-center mx-auto text-2xl border border-slate-200 shadow-inner">
                🔒
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">التحقق من الهوية مطلوب</h4>
                <p className="text-[11px] text-slate-450 leading-relaxed px-4">
                  تم تعيين رمز أمان للمدير مسبقاً. للوصول إلى الصلاحيات وتعديل الإعدادات الحساسة، يرجى إدخال رمز الأمان الحالي أولاً.
                </p>
              </div>

              <div className="space-y-2 max-w-xs mx-auto pt-2">
                <input 
                  type="password"
                  maxLength={8}
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
                  placeholder="أدخل رمز أمان المدير الحالي..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-slate-450"
                />
                {verifyError && (
                  <p className="text-[10px] text-rose-600 font-extrabold">{verifyError}</p>
                )}
                
                <Button 
                  onClick={handleVerifyCurrentPin}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-2.5 text-xs rounded-xl transition-all cursor-pointer"
                >
                  تأكيد الرمز وفك القفل 🔓
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Option toggle */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/80 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black block text-slate-800">تفعيل التحقق من صلاحيات المدير:</span>
                    <span className="text-[10px] text-slate-450 block">حظر العمليات المحددة ومطالبة الكاشير برمز الحماية للمتابعة</span>
                  </div>
                  <button
                    onClick={() => updatePermissionsEnabled(!permissionsEnabled)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer ${permissionsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${permissionsEnabled ? '-translate-x-5.5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* List of actions to protect */}
              {permissionsEnabled && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-450 pr-1">حدد الإجراءات التي تتطلب إدخال رمز الأمان من الكاشير:</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'delete_sale', label: 'إلغاء وعكس مبيعات الفاتورة (المرتجع)', desc: 'يمنع الكاشير من حذف أو تصفير أي فاتورة بيع مسجلة' },
                      { key: 'edit_product', label: 'تعديل وحذف الأصناف بالمخازن', desc: 'تعديل الأسعار أو الكميات أو حذف الصنف نهائياً' },
                      { key: 'cash_withdrawal', label: 'مسحوبات الصندوق وسحب الكاش', desc: 'تسجيل مسحوبات نقدية أو عهد أو سلفة للموظفين' },
                      { key: 'settlement', label: 'تصفية الصندوق وتسوية الوردية', desc: 'إجراء مطابقة النقدية المادية وإغلاق الحساب اليومي' },
                      { key: 'supplier_payment', label: 'تسديد الموردين والمدفوعات', desc: 'تسجيل الدفعات المالية للموردين أو سداد الذمم المستحقة' },
                      { key: 'smart_import', label: 'الاستيراد الذكي بالذكاء الاصطناعي', desc: 'استيراد البيانات وفواتير الشراء تلقائياً باستخدام الذكاء الاصطناعي' },
                      { key: 'analytics', label: 'الوصول لقسم التحليلات وPower BI', desc: 'رؤية صافي الأرباح وإحصاءات المبيعات وسرعة دوران السلع' },
                      { key: 'settings', label: 'الوصول لإعدادات النظام العامة', desc: 'تصدير البيانات، تغيير العملة، إعدادات التقريب' }
                    ].map((action, idx) => (
                      <label 
                        key={`perm-action-${action.key}-${idx}`} 
                        className="flex items-start gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-150/70 rounded-2xl cursor-pointer transition-colors shadow-2xs"
                      >
                        <input 
                          type="checkbox" 
                          checked={protectedActions[action.key] || false}
                          onChange={(e) => {
                            const updated = { ...protectedActions, [action.key]: e.target.checked };
                            updateProtectedActions(updated);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 text-right">
                          <span className="text-xs font-extrabold text-slate-800 block">{action.label}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{action.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Change PIN section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/80 space-y-3.5">
                <div>
                  <span className="text-xs font-black text-slate-800 block">تحديث رمز أمان المدير:</span>
                  <p className="text-[10px] text-slate-450 block mt-0.5">الرمز الحالي المستخدم هو: <span className="font-mono text-slate-700 font-extrabold bg-slate-200/60 px-1.5 py-0.5 rounded">{adminPin ? '••••' : 'لم يتم التعيين بعد'}</span></p>
                </div>
                <div className="space-y-1.5">
                  <input 
                    type="password" 
                    maxLength={8}
                    placeholder="أدخل الرمز الجديد المكون من 4 أرقام على الأقل" 
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-black font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                    id="new-admin-pin-input"
                  />
                  <Button 
                    onClick={() => {
                      const inputEl = document.getElementById('new-admin-pin-input') as HTMLInputElement;
                      if (inputEl && inputEl.value) {
                        if (inputEl.value.length < 4) {
                          showNotification('يجب أن يتكون الرمز الجديد من 4 أرقام على الأقل', 'error');
                          return;
                        }
                        updateAdminPin(inputEl.value);
                        showNotification('🔑 تم تحديث رمز مرور المدير بنجاح!');
                        inputEl.value = '';
                      } else {
                        showNotification('الرجاء إدخال الرمز الجديد أولاً', 'error');
                      }
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-2 text-xs rounded-xl transition-all cursor-pointer"
                  >
                    حفظ رمز المرور الجديد 🔐
                  </Button>
                  
                  {adminPin && (
                    <button 
                      type="button"
                      onClick={async () => {
                        await updateAdminPin('');
                        await updatePermissionsEnabled(false);
                        showNotification('🔓 تم إيقاف نظام الحماية وإلغاء رمز أمان المدير بالكامل!', 'success');
                        const inputEl = document.getElementById('new-admin-pin-input') as HTMLInputElement;
                        if (inputEl) inputEl.value = '';
                      }}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-extrabold py-2.5 text-xs rounded-xl border border-rose-200 transition-all cursor-pointer text-center"
                    >
                      تعطيل وإيقاف رمز الأمان الحسابي 🔓
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <Button 
            onClick={() => setShowPermissionsConfigModal(false)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer"
          >
            إغلاق وحفظ الإعدادات
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
