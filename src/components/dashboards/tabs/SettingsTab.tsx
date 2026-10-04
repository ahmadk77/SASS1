import React, { useState, useEffect } from 'react';
import TemplateLiveEditorDrawer from '../../TemplateLiveEditorDrawer';
import TemplateRenderer from '../../TemplateRenderer';
import ShopifyThemeEditor from '../../ShopifyThemeEditor';
import { Sparkles, Globe, AlertTriangle, Trash2, X, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { fetchUserSubscriptionsFromFirestore } from '../../../lib/activityLogger';

interface SettingsTabProps {
  templateId: number;
  content: any;
  setContent: (content: any) => void;
  tenant: any;
  setTenant: (tenant: any) => void;
  isSaving: boolean;
  handleUpdateContent: (quiet?: boolean, overrideContent?: any) => Promise<void>;
  handleResetHeroImage: () => void;
  isRestaurant: boolean;
  setActiveTab: (tab: string) => void;
  showToast: (msg: string) => void;
}

export default function SettingsTab({
  templateId,
  content,
  setContent,
  tenant,
  setTenant,
  isSaving,
  handleUpdateContent,
  handleResetHeroImage,
  isRestaurant,
  setActiveTab,
  showToast
}: SettingsTabProps) {
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadSubs() {
      try {
        const userId = tenant?.userId || auth.currentUser?.uid || 'usr_default';
        const userEmail = tenant?.email || auth.currentUser?.email;
        const subs = await fetchUserSubscriptionsFromFirestore(userId, userEmail);
        setSubscriptionsList(subs);
      } catch (e) {
        console.error('Error loading subscriptions in settings tab:', e);
      }
    }
    loadSubs();
  }, [tenant]);

  const nowTime = Date.now();
  const activeSub = subscriptionsList.find(
    s => String(s.templateId) === String(templateId) &&
         s.status === 'active' &&
         (!s.renewalDate || new Date(s.renewalDate).getTime() > nowTime)
  ) || null;

  const activeRemainingDays = activeSub?.renewalDate ? Math.max(0, Math.ceil((new Date(activeSub.renewalDate).getTime() - nowTime) / (1000 * 60 * 60 * 24))) : 365;

  const confirmResetSiteData = async () => {
    setIsResettingData(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const impersonateId = new URLSearchParams(window.location.search).get('impersonateTenantId');
      const res = await fetch('/api/tenant/reset-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
          ...(impersonateId ? { 'x-impersonate-tenant-id': impersonateId } : {})
        }
      });
      if (res.ok) {
        showToast('🎉 تم تصفير بيانات الموقع بنجاح وإعادته لحالة البدء والنظافة المطلقة!');
        setShowResetConfirmModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || '⚠️ حدث خطأ أثناء تصفير بيانات الموقع');
      }
    } catch(e) { 
      console.error(e);
      showToast('⚠️ تعذر الاتصال بالسيرفر أثناء تصفير البيانات');
    } finally {
      setIsResettingData(false);
    }
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Active Subscription & Renewal Banner */}
      {activeSub && (
        <div className="bg-emerald-950/90 border-2 border-emerald-500/60 rounded-3xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base md:text-lg text-white">
                  ✅ اشتراكك نشط ومجّدد في المتجر ({activeRemainingDays > 0 ? `متبقي ${activeRemainingDays} يوم` : 'مفعل'})
                </h3>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  نشط ومحدث أونلاين
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-1">
                الباقة الحالية: <strong className="text-white">{activeSub.planTitle || activeSub.plan || 'باقة احترافية'}</strong> — تاريخ التجديد والانتهایء: {activeSub.renewalDate ? new Date(activeSub.renewalDate).toLocaleDateString('ar-EG') : 'دائم'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/80 px-3.5 py-2 rounded-xl border border-emerald-700/50">
              {activeSub.price || 'مفعل'}
            </div>
            <button
              type="button"
              onClick={() => {
                const event = new CustomEvent('open-plans-modal', { detail: { templateId } });
                window.dispatchEvent(event);
                showToast('🚀 يرجى اختيار الباقة الجديدة لتجديد الاشتراك وتحديث المتجر بنجاح!');
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>تجديد / تغيير الباقة 🔄</span>
            </button>
          </div>
        </div>
      )}

      <div className="w-full">
        <TemplateLiveEditorDrawer
          templateId={templateId}
          customizations={content}
          workspaceId={tenant?.id}
          onChange={(updatedCustomizations) => {
            setContent(updatedCustomizations);
          }}
          onSaveComplete={async (updatedCustomizations) => {
            setContent(updatedCustomizations);
            try {
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
              const impersonateId = localStorage.getItem('impersonatedTenantId');
              const url = impersonateId ? `/api/tenant/content?impersonateTenantId=${impersonateId}` : '/api/tenant/content';
              await fetch(url, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ content: updatedCustomizations, impersonateTenantId: impersonateId })
              });
            } catch (err) {
              console.warn('Direct save error:', err);
            }
            await handleUpdateContent(false, updatedCustomizations);
            showToast('🎉 تم حفظ ونشر التعديلات بنجاح على موقعك!');
          }}
          onSubscribeSuccess={() => {
            setActiveTab('dashboard');
          }}
        />
      </div>

      {/* Live Editable Template Preview matching exact preview page */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <span>معاينة حية وتعديل مباشر على موقعك (انقر على أي عنصر للتعديل الفوري)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleUpdateContent(false)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
        <TemplateRenderer 
          templateId={templateId} 
          content={content}
          tenant={{ subdomain: tenant?.subdomain || 'mysite' }}
          onUpdateContent={async (updatedContent) => {
            setContent(updatedContent);
            try {
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
              const impersonateId = localStorage.getItem('impersonatedTenantId');
              const url = impersonateId ? `/api/tenant/content?impersonateTenantId=${impersonateId}` : '/api/tenant/content';
              await fetch(url, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ content: updatedContent, impersonateTenantId: impersonateId })
              });
            } catch (err) {
              console.warn('Auto save failed:', err);
            }
            await handleUpdateContent(false, updatedContent);
          }}
          isEditable={true}
        />
      </div>

      <ShopifyThemeEditor
        content={content}
        setContent={setContent}
        templateId={templateId}
        tenant={tenant}
        onSave={() => handleUpdateContent(false)}
        isSaving={isSaving}
        onResetHeroImage={handleResetHeroImage}
        isRestaurant={isRestaurant}
      />

      {/* Domain Configuration */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
          <Globe className="text-emerald-500" size={18} />
          <span>إعدادات الدومين المخصص (Custom Domain)</span>
        </h3>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={tenant?.customDomain || ''} 
            onChange={e => setTenant({...tenant, customDomain: e.target.value})} 
            placeholder="example.com" 
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-xs dir-ltr" 
          />
          <button 
            type="button"
            onClick={async () => {
              try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/tenant/custom-domain', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ customDomain: tenant?.customDomain })
                });
                if (res.ok) {
                  showToast('تم تحديث الدومين بنجاح 🌐');
                }
              } catch(e) { 
                console.error(e); 
                showToast('خطأ في تحديث الدومين');
              }
            }} 
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md text-xs shrink-0 cursor-pointer"
          >
            تحديث الدومين
          </button>
        </div>
      </div>

      {/* Reset Data for Delivery */}
      <div className="bg-rose-50 rounded-3xl p-6 border border-rose-200 shadow-sm space-y-3">
        <h3 className="font-black text-base text-rose-800 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span>تصفير وتسليم الموقع (Reset & Deliver)</span>
        </h3>
        <p className="text-rose-600 text-xs font-medium">هذا الإجراء سيقوم بحذف كافة الطلبات، الزوار، وتفريغ قائمة المنتجات ليصبح الموقع جاهزاً للتسليم كنسخة جديدة (نظيفة).</p>
        <div className="pt-2">
          <button 
            type="button"
            onClick={() => setShowResetConfirmModal(true)} 
            className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md text-xs cursor-pointer flex items-center gap-2"
          >
            <Trash2 size={15} />
            <span>تصفير بيانات الموقع بالكامل</span>
          </button>
        </div>
      </div>

      {/* Platform Native Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-right">
            <button 
              type="button"
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">تأكيد تصفير بيانات الموقع بالكامل</h3>
                <p className="text-xs text-rose-400 font-medium mt-0.5">إجراء تنظيف وتسليم الموقع بالكامل</p>
              </div>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200 leading-relaxed mb-6 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                تحذير: لا يمكن التراجع عن هذه الخطوة!
              </p>
              <p>سيتم حذف كافة الطلبات المسجلة، سجلات الزوار، وتجهيز الموقع للتسليم كنسخة نظيفة تماماً.</p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmResetSiteData}
                disabled={isResettingData}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isResettingData ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>تأكيد التصفير والمسح</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

