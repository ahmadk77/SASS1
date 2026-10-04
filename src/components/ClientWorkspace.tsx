import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Sparkles, 
  Edit3, 
  LayoutTemplate,
  Layers, 
  Heart, 
  Settings, 
  ChevronLeft, 
  Check, 
  ExternalLink, 
  Plus, 
  Save, 
  Layout, 
  User, 
  LogOut,
  ShieldCheck,
  Smartphone,
  Monitor,
  AlertTriangle,
  X,
  Wand2,
  HelpCircle,
  Store,
  Shield,
  CreditCard,
  CheckCircle,
  CheckCircle2,
  Eye,
  Trash2,
  Menu,
  RefreshCw
} from 'lucide-react';
import { logout, db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  logUserActivity, 
  saveEditedTemplate, 
  fetchUserEditedTemplates, 
  createSubscriptionInFirestore, 
  fetchUserSubscriptionsFromFirestore,
  deleteEditedTemplateInFirestore,
  deleteSubscriptionInFirestore,
  cancelSubscriptionInFirestore,
  EditedTemplate 
} from '../lib/activityLogger';
import InlineVisualEditor from './InlineVisualEditor';
import TemplateRenderer from './TemplateRenderer';
import TemplateLiveEditorDrawer from './TemplateLiveEditorDrawer';
import PaymentCheckoutModal from './PaymentCheckoutModal';
import { PaymentGatewayIssueModal } from './PaymentGatewayIssueModal';
import { fetchSystemSettings, checkFeatureLock } from '../lib/systemSettingsClient';
import { getSubscriptionPlans, getPlanTitleById, getPlanAmountById } from '../lib/subscriptionPlans';

interface ClientWorkspaceProps {
  initialWorkspace?: any;
  user?: any;
  onExitWorkspace?: () => void;
}

const TEMPLATE_NAMES: Record<string, string> = {
  '1': 'قالب المطعم الإيطالي والفاخر',
  '2': 'قالب برجر ستيشن للوجبات السريعة',
  '3': 'قالب بيتزا ووجبات عائلية',
  '4': 'قالب كافيه وقهوة كلاسيك',
  '5': 'قالب محمص وقهوة مختصة',
  '6': 'قالب بوتيك الحلويات والآيس كريم',
  '7': 'قالب العقارات والفلل الفاخرة',
  '8': 'قالب الشقق والمجمعات السكنية',
  '9': 'قالب المركز والمكتب العقاري',
  '10': 'قالب شركات المقاولات والبناء',
  '11': 'قالب الاستشارات والتصميم المعماري',
  '12': 'قالب التصميم الداخلي والتجديد',
  '13': 'قالب المتجر الإلكتروني والبوتيك'
};

export const ClientWorkspace: React.FC<ClientWorkspaceProps> = ({
  initialWorkspace,
  user = { name: 'عميل المنصة', email: 'client@waas.com', id: 'usr_default' },
  onExitWorkspace,
}) => {
  const [workspace, setWorkspace] = useState<any>(initialWorkspace || {
    id: 1,
    name: 'المطعم الفاخر',
    domain: 'my-brand.mysite.com',
    status: 'draft',
    templateId: '1',
    customizations: {
      siteName: 'المطعم الفاخر',
      heroTitle: 'أشهى المأكولات وأرقى الأجواء',
      heroSubtitle: 'تجربة طعام لا تُنسى بأيدي أفضل الطهاة.',
      primaryColor: '#0f172a'
    }
  });

  const currentTplId = Number(workspace.templateId || 1);
  const isStoreWorkspace = currentTplId === 13 || currentTplId === 14 || currentTplId === 15;

  const [activeSidebarTab, setActiveSidebarTab] = useState<'edited_templates' | 'subscriptions' | 'favorites' | 'settings' | 'help'>('edited_templates');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [mobileEditView, setMobileEditView] = useState<'editor' | 'preview'>('editor');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(localStorage.getItem('selectedPlanId') || 'pro');
  const [isNoEditsConfirmModalOpen, setIsNoEditsConfirmModalOpen] = useState(false);
  const [hasUserModified, setHasUserModified] = useState(false);
  const [targetSubscriptionTemplate, setTargetSubscriptionTemplate] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [isGatewayIssueOpen, setIsGatewayIssueOpen] = useState(false);
  const [gatewayIssueMsg, setGatewayIssueMsg] = useState('');
  const [gatewayIssueTplName, setGatewayIssueTplName] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Keep workspace in sync when initialWorkspace changes and scroll to top
  useEffect(() => {
    if (initialWorkspace) {
      setWorkspace(initialWorkspace);
      setHasUserModified(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [initialWorkspace]);

  useEffect(() => {
    if (!isStoreWorkspace && activeSidebarTab === 'help') {
      setActiveSidebarTab('edited_templates');
    }
  }, [isStoreWorkspace, activeSidebarTab]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  // Unified Handler for Edit Mode Attempt
  const handleAttemptEnterEditMode = async () => {
    if (editMode) {
      setEditMode(false);
      return;
    }
    const fresh = await fetchSystemSettings(true);
    if (fresh.lockEditMode) {
      const msg = fresh.customNoticeMessage || 'مغلق الآن - الدخول لبيئة التعديل مغلق حالياً من قبل الإدارة';
      setLockedNotice(msg);
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }
    const userEmail = auth.currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : null);
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    const lockCheck = checkFeatureLock('editMode', userEmail, userRole);
    if (lockCheck.isLocked) {
      setLockedNotice(lockCheck.noticeMessage || 'مغلق الآن - الدخول لبيئة التعديل مغلق حالياً من قبل الإدارة');
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }
    setEditMode(true);
    setIsSidebarOpen(true);
  };

  // Unified Handler for Subscription Attempt
  const handleSubscribeClick = async (targetItem?: any) => {
    const fresh = await fetchSystemSettings(true);
    const tplName = targetItem?.templateName || targetItem?.name || targetItem?.customizations?.brandName || workspace?.name || workspace?.customizations?.brandName || '';
    if (fresh.lockSubscriptions) {
      setGatewayIssueMsg(fresh.customNoticeMessage || '');
      setGatewayIssueTplName(tplName);
      setIsGatewayIssueOpen(true);
      return;
    }

    if (isCurrentSubscribed && !targetItem) {
      setIsPlansModalOpen(true);
      return;
    }

    let currentCustomizations = workspace.customizations;
    let tplId = String(workspace.templateId || '1');

    if (targetItem) {
      setTargetSubscriptionTemplate(targetItem);
      currentCustomizations = targetItem.customizations;
      tplId = String(targetItem.templateId);
      setWorkspace({
        id: targetItem.id,
        templateId: tplId,
        name: targetItem.templateName,
        customizations: currentCustomizations,
        status: 'draft'
      });
    }

    const isSavedInEditedList = editedTemplatesList.some(
      item => String(item.templateId) === tplId
    );

    const isModified = hasUserModified || isSavedInEditedList;

    if (!isModified && !isCurrentSubscribed) {
      setIsNoEditsConfirmModalOpen(true);
    } else {
      if (workspace.id) {
        const parsedId = typeof workspace.id === 'number' ? workspace.id : parseInt(String(workspace.id), 10);
        if (!isNaN(parsedId) && parsedId > 0 && parsedId <= 2147483647) {
          fetch(`/api/workspaces/${parsedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customizations: workspace.customizations })
          }).catch(err => console.error('Save failed:', err));
        }
      }
      setIsPlansModalOpen(true);
    }
  };

  const normEmail = user?.email?.toLowerCase().trim();
  const isOwnerOrAdmin = normEmail === 'ahmadalriqib@gmail.com';

  // State Datasets
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([]);
  const [editedTemplatesList, setEditedTemplatesList] = useState<EditedTemplate[]>([]);
  const [activeSubscriptionsList, setActiveSubscriptionsList] = useState<any[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<any[]>([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [showSubBanner, setShowSubBanner] = useState(true);

  // Check if current workspace / template is subscribed or edited
  const nowTime = Date.now();
  const activeSubscriptionDetails = activeSubscriptionsList.find(
    sub => {
      const isStatusActive = (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'trial');
      if (!isStatusActive) return false;

      const subRenewal = sub.renewalDate || sub.endDate;
      if (subRenewal && new Date(subRenewal).getTime() <= nowTime) return false;

      const matchesTemplateId = workspace.templateId && String(sub.templateId) === String(workspace.templateId);
      const matchesTemplateName = workspace.name && sub.templateName && sub.templateName.trim() === workspace.name.trim();
      const matchesSiteName = workspace.name && sub.siteName && sub.siteName.trim() === workspace.name.trim();
      const matchesTenantId = workspace.id && (String(sub.tenantId) === String(workspace.id) || String(sub.id) === String(workspace.id));

      return matchesTemplateId || matchesTemplateName || matchesSiteName || matchesTenantId;
    }
  ) || null;

  const isCurrentSubscribed = Boolean(activeSubscriptionDetails);

  const isCurrentSavedInEdited = editedTemplatesList.some(
    item => String(item.templateId) === String(workspace.templateId)
  );

  const activeRemainingDays = (() => {
    const subRenewal = activeSubscriptionDetails?.renewalDate || activeSubscriptionDetails?.endDate;
    if (!activeSubscriptionDetails || !subRenewal) return 30; // fallback default
    const diff = new Date(subRenewal).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  // Persistence logic - Sync to Firebase & LocalStorage
  const syncToFirebase = async (customizations: any) => {
    const fresh = await fetchSystemSettings(true);
    if (fresh.lockSaveEdits) {
      const msg = fresh.customNoticeMessage || 'مغلق الآن - حفظ التعديلات مغلق حالياً من قبل الإدارة';
      setLockedNotice(msg);
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }

    const userId = user?.id || 'usr_default';
    const userEmail = user?.email || 'client@waas.com';
    
    setHasUserModified(true);
    setIsSyncingFirebase(true);
    try {
      const currentTplId = workspace.templateId || '1';
      const tplName = TEMPLATE_NAMES[String(currentTplId)] || workspace.name || `قالب رقم ${currentTplId}`;
      const wsDocId = workspace.id ? String(workspace.id) : `${userId}_ws_${currentTplId}_${tplName.replace(/\s+/g, '_')}`;

      // 1. Save to edited_templates in Firestore & LocalStorage
      const savedData = await saveEditedTemplate(
        userId,
        userEmail,
        currentTplId,
        workspace.name || tplName,
        customizations,
        wsDocId
      );

      // Immediately update local React state for instant UI reflection
      setEditedTemplatesList(prev => {
        const filtered = prev.filter(item => item.id !== wsDocId && !(String(item.templateId) === String(currentTplId) && item.templateName === tplName));
        return [savedData, ...filtered];
      });

      // 2. Also save to workspaces collection in Firestore (optional / resilient)
      try {
        const wsId = workspace.id ? String(workspace.id) : `ws_${userId}_${currentTplId}`;
        const workspaceRef = doc(db, 'workspaces', wsId);
        await setDoc(workspaceRef, {
          userId,
          userEmail,
          customizations,
          updatedAt: serverTimestamp(),
          workspaceId: wsId,
          templateId: currentTplId,
          name: tplName
        }, { merge: true });
      } catch (firestoreErr: any) {
        const errMsg = firestoreErr?.message || String(firestoreErr);
        if (firestoreErr?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
          console.info('Workspace Firestore sync notice: permissions restricted, saved locally.');
        } else {
          console.warn('Workspace Firestore sync notice:', errMsg);
        }
      }

      // 3. Sync live tenant content to database endpoint
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
          body: JSON.stringify({ content: customizations, impersonateTenantId: impersonateId })
        });
      } catch (tenantErr) {
        console.warn('Tenant content sync notice:', tenantErr);
      }

      // Refresh data
      await refreshUserData();
      console.log('Successfully synced edited template to LocalStorage & Firebase');
    } catch (err) {
      console.error('Sync process notice:', err);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Settings form state
  const [siteName, setSiteName] = useState(workspace?.name || '');
  const [customDomain, setCustomDomain] = useState(workspace?.domain || '');
  const [seoTitle, setSeoTitle] = useState(workspace?.settings?.seoTitle || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load client data from Firestore & PostgreSQL
  const refreshUserData = async () => {
    try {
      setLoadingBackend(true);
      const userId = user?.id || 'usr_default';
      const userEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : '');

      const [edited, firestoreSubs, favRes] = await Promise.all([
        fetchUserEditedTemplates(userId, userEmail),
        fetchUserSubscriptionsFromFirestore(userId, userEmail),
        fetch(`/api/saved-templates?userId=${encodeURIComponent(userId)}`)
      ]);

      let backendSubs: any[] = [];
      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
        const res = await fetch('/api/tenant/subscriptions', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.subscriptions)) {
            backendSubs = data.subscriptions;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch backend subscriptions:', err);
      }

      const deletedSet = new Set<string>();
      try {
        const rawDel1 = localStorage.getItem(`waas_deleted_subscriptions_${userId}`);
        if (rawDel1) JSON.parse(rawDel1).forEach((d: string) => deletedSet.add(String(d)));
        const rawDel2 = localStorage.getItem('waas_deleted_subscriptions_usr_default');
        if (rawDel2) JSON.parse(rawDel2).forEach((d: string) => deletedSet.add(String(d)));
      } catch (e) {}

      const isSubDeleted = (id?: string, tplId?: any) => {
        if (id && deletedSet.has(String(id))) return true;
        if (tplId !== undefined && tplId !== null && deletedSet.has(String(tplId))) return true;
        return false;
      };

      const combinedSubsMap = new Map<string, any>();
      [...firestoreSubs, ...backendSubs].forEach((sub: any) => {
        if (sub.status === 'cancelled' || sub.status === 'customer_cancelled' || sub.status === 'admin_cancelled' || sub.status === 'deleted') return;
        if (isSubDeleted(sub.id, sub.templateId)) return;
        const key = String(sub.id || sub.templateId || sub.tenantId || Math.random());
        const planName = sub.planTitle || (sub.plan === 'starter' || sub.plan === 'free' ? 'الباقة التجريبية' : sub.plan === 'yearly' || sub.plan === 'pro_yearly' ? 'الباقة السنوية' : 'الباقة الشهرية');
        const normalizedSub = {
          ...sub,
          renewalDate: sub.renewalDate || sub.endDate,
          planTitle: planName,
          status: sub.status || 'active'
        };
        combinedSubsMap.set(key, normalizedSub);
      });

      setEditedTemplatesList(edited);
      setActiveSubscriptionsList(Array.from(combinedSubsMap.values()));

      if (favRes.ok) {
        const favData = await favRes.json();
        setFavoriteTemplates(favData.savedTemplates || []);
      }
    } catch (e) {
      console.error('Error refreshing client data:', e);
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [user?.id]);

  // Handle saving site settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasUserModified(true);
    try {
      const updatedWs = {
        ...workspace,
        name: siteName,
        domain: customDomain,
        settings: {
          ...workspace.settings,
          seoTitle
        }
      };
      setWorkspace(updatedWs);

      if (workspace.id) {
        await fetch(`/api/workspaces/${workspace.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: siteName,
            domain: customDomain,
            settings: { seoTitle }
          })
        });
      }

      // Log activity
      await logUserActivity(
        user?.id || 'usr_default',
        user?.email || 'client@waas.com',
        'تحديث الإعدادات',
        `قام بتغيير اسم الموقع إلى "${siteName}" والدومين المخصص إلى "${customDomain}"`
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  // Handle toggle status (Draft / Publish)
  const handleTogglePublish = async () => {
    const fresh = await fetchSystemSettings(true);
    if (fresh.lockSaveEdits) {
      const msg = fresh.customNoticeMessage || 'مغلق الآن - حفظ التعديلات مغلق حالياً من قبل الإدارة';
      setLockedNotice(msg);
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }

    const newStatus = workspace.status === 'published' ? 'draft' : 'published';
    const updatedWs = { ...workspace, status: newStatus };
    setWorkspace(updatedWs);

    if (workspace.id) {
      await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 dir-rtl text-slate-100 font-sans flex flex-col overflow-x-hidden">
      
      {/* Locked Notice Banner */}
      {lockedNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-500 text-rose-200 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-bold text-sm">{lockedNotice}</span>
        </div>
      )}

      {/* Top Workspace Bar */}
      <header className="h-16 bg-slate-950/95 border-b border-slate-800/80 px-3 md:px-6 flex items-center justify-between z-40 sticky top-0 backdrop-blur-md gap-2">
        
        {/* Right Info & Sidebar Toggle */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="فتح/إغلاق القائمة"
          >
            <Menu size={18} className="text-emerald-400" />
            <span className="hidden sm:inline">القائمة</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="max-w-[130px] sm:max-w-[200px] truncate">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-xs md:text-sm text-white truncate">{workspace.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold shrink-0 ${
                workspace.status === 'published' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {workspace.status === 'published' ? 'منشور' : 'مسودة'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono dir-ltr text-right truncate">{workspace.domain || 'mysite.com'}</p>
          </div>
        </div>

        {/* Center Device Viewport Controls */}
        <div className="hidden sm:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setDevicePreview('desktop')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition-all ${
              devicePreview === 'desktop' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="عرض كمبيوتر"
          >
            <Monitor size={14} /> <span className="hidden md:inline">سطح المكتب</span>
          </button>
          <button
            onClick={() => setDevicePreview('mobile')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition-all ${
              devicePreview === 'mobile' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="عرض هاتف"
          >
            <Smartphone size={14} /> <span className="hidden md:inline">الهاتف</span>
          </button>
        </div>

        {/* Left Actions & PRIMARY CUSTOMIZATION BUTTON */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          
          {/* Prominent Customization Button */}
          <button
            onClick={handleAttemptEnterEditMode}
            className={`px-2.5 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 md:gap-2 cursor-pointer ${
              editMode 
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700' 
                : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
            }`}
          >
            <Edit3 size={15} />
            <span className="hidden sm:inline">{editMode ? 'إغلاق بيئة التعديل' : 'دخول بيئة التعديل'}</span>
            <span className="sm:hidden">{editMode ? 'إغلاق' : 'تعديل'}</span>
          </button>

          <button
            onClick={handleTogglePublish}
            className={`hidden lg:flex px-3 py-2 rounded-xl font-bold text-xs transition-all border ${
              workspace.status === 'published'
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-emerald-600/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80'
            }`}
          >
            {workspace.status === 'published' ? 'مسودة' : 'نشر'}
          </button>

          {isCurrentSubscribed && showSubBanner ? (
            <div className="hidden md:flex items-center gap-1.5 md:gap-2 bg-emerald-950/95 border border-emerald-500/60 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl text-emerald-300 text-xs font-black shrink-0 shadow-sm relative">
              <CreditCard size={14} className="text-emerald-400 shrink-0" />
              <div className="flex flex-col text-right">
                <span className="text-white text-[11px] font-extrabold">{activeSubscriptionDetails?.planTitle || activeSubscriptionDetails?.plan || 'باقة نشطة'}</span>
                <span className="text-[10px] text-emerald-200">⏳ {activeRemainingDays} يوم</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPlansModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all shadow-sm shrink-0"
              >
                تجديد 🔄
              </button>
              <button
                type="button"
                onClick={() => setShowSubBanner(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition-colors ml-0.5"
                title="إغلاق الإشعار"
              >
                <X size={14} />
              </button>
            </div>
          ) : isCurrentSubscribed && !showSubBanner ? (
            <button
              onClick={() => setShowSubBanner(true)}
              className="md:hidden bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1"
              title="إظهار تفاصيل الباقة"
            >
              <CreditCard size={13} />
              <span>الباقة ({activeRemainingDays}يوم)</span>
            </button>
          ) : !isCurrentSubscribed ? (
            <button
              onClick={() => handleSubscribeClick()}
              className="px-2.5 py-1.5 md:px-4 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard size={15} /> <span>اشتراك</span>
            </button>
          ) : null}

          {onExitWorkspace && (
            <button
              onClick={onExitWorkspace}
              className="p-1.5 md:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="خروج من بيئة العمل"
            >
              <X size={18} />
            </button>
          )}

        </div>

      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Mobile Backdrop Overlay when sidebar is open */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          />
        )}

        {/* Floating Interactive Sidebar Panel */}
        {isSidebarOpen && (
          <aside className="fixed md:relative top-16 md:top-0 right-0 bottom-0 z-50 md:z-30 w-80 max-w-[85vw] bg-slate-950/95 border-l border-slate-800/80 p-4 md:p-5 flex flex-col justify-between backdrop-blur-xl shadow-2xl transition-all overflow-y-auto">
            
            <div className="space-y-5">
              
              {/* Mobile Sidebar Close Header */}
              <div className="flex items-center justify-between md:hidden pb-3 border-b border-slate-800">
                <span className="font-extrabold text-xs text-slate-200">لوحة التحكم والقوائم</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Profile Summary */}
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-base">
                  {user?.name?.[0] || 'ع'}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-white truncate">{user?.name || 'عميل متميز'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email || 'client@waas.com'}</div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setActiveSidebarTab('edited_templates');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeSidebarTab === 'edited_templates' 
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 font-black' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wand2 size={18} className="text-amber-400" />
                    <span>القوالب التي عدلت عليها</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 text-amber-300 font-mono font-bold">
                    {editedTemplatesList.length}
                  </span>
                </button>

                {/* Direct Store / Site Management Access (Only if user has store/subscription/edits or admin) */}
                {(isOwnerOrAdmin || activeSubscriptionsList.length > 0 || editedTemplatesList.length > 0 || workspace?.status === 'published') && (
                  <div className="space-y-2 pt-1 pb-1">
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/50 cursor-pointer shadow-md"
                    >
                      <Store size={18} className="text-purple-400" />
                      <span>دخول لوحة تحكم الموقع / المتجر</span>
                    </button>

                    {/* Admin Access if owner or admin */}
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => window.location.href = '/admin'}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/50 cursor-pointer shadow-md"
                      >
                        <Shield size={18} className="text-rose-400" />
                        <span>دخول لوحة التحكم (السوبر ادمن)</span>
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setActiveSidebarTab('subscriptions');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeSidebarTab === 'subscriptions' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-black' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <span>اشتراكاتي والمنشورات</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 text-emerald-300 font-mono font-bold">
                    {activeSubscriptionsList.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveSidebarTab('favorites');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeSidebarTab === 'favorites' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart size={18} />
                    <span>القوالب المفضلة</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/60 font-mono">
                    {favoriteTemplates.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveSidebarTab('settings');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeSidebarTab === 'settings' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Settings size={18} />
                  <span>إعدادات الموقع</span>
                </button>

                {isStoreWorkspace && (
                  <button
                    onClick={() => {
                      setActiveSidebarTab('help');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                      activeSidebarTab === 'help' 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <HelpCircle size={18} />
                    <span>المساعدة والدعم الفني</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Edited Templates */}
              {activeSidebarTab === 'edited_templates' && (
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider">قوالبك التي قمت بتعديلها (مسودات محليّة)</div>
                  {editedTemplatesList.length === 0 ? (
                    <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-slate-500 text-xs">
                      لا توجد قوالب معدلة حالياً. اختر قالباً وعدله وسيتم حفظه هنا تلقائياً!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {editedTemplatesList.map(item => (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border text-right transition-all bg-slate-900/90 ${
                            String(workspace.templateId) === String(item.templateId)
                              ? 'border-amber-500/80 ring-1 ring-amber-500/30'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white truncate">{item.templateName}</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                              معدل (مسودة)
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2">
                            تاريخ التعديل: {new Date(item.updatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.updatedAt).toLocaleDateString('ar-EG')}
                          </p>
                          <div className="space-y-1.5 pt-1">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setWorkspace({
                                    id: item.id,
                                    templateId: String(item.templateId),
                                    name: item.templateName,
                                    customizations: item.customizations,
                                    status: 'draft'
                                  });
                                  setToast(`تم تحميل التعديلات الخاصة بقالب ${item.templateName} ✏️`);
                                  setTimeout(() => setToast(''), 2000);
                                }}
                                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[10px] text-center transition-colors cursor-pointer"
                              >
                                تعديل وملاحظة ✏️
                              </button>

                              <button
                                onClick={() => handleSubscribeClick(item)}
                                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] text-center shadow transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <CreditCard size={12} />
                                <span>اشترك الآن 💳</span>
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'حذف القالب المعدل 🗑️',
                                  message: `هل أنت متأكد من رغبتك في حذف القالب المعدل (${item.templateName})؟ سيتم مسح جميع التعديلات.`,
                                  confirmText: 'نعم، حذف القالب',
                                  cancelText: 'تراجع',
                                  onConfirm: async () => {
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    const userId = user?.id || 'usr_default';
                                    setToast('تم حذف القالب المعدل بنجاح 🗑️');
                                    setTimeout(() => setToast(''), 3000);
                                    setEditedTemplatesList(prev => prev.filter(e => e.id !== item.id && String(e.templateId) !== String(item.templateId)));
                                    await deleteEditedTemplateInFirestore(item.id, userId, item.templateId, user?.email, item.templateName);
                                  }
                                });
                              }}
                              className="w-full py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 rounded-xl font-bold text-[10px] text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <X size={12} /> <span>حذف القالب المعدل 🗑️</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Subscriptions */}
              {activeSidebarTab === 'subscriptions' && (
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider">اشتراكاتك النشطة والمنشورة أونلاين</div>
                  {activeSubscriptionsList.length === 0 ? (
                    <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-slate-500 text-xs">
                      لا توجد اشتراكات نشطة بعد. قم باختيار قالب واشترك لتفعيله ورؤيته هنا!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {activeSubscriptionsList.map(sub => {
                        const isCancelled = ['cancelled', 'customer_cancelled', 'admin_cancelled', 'ملغي'].includes(sub.status);
                        const isByAdmin = sub.status === 'admin_cancelled' || sub.cancelledBy === 'admin';
                        return (
                          <div key={sub.id} className={`p-3.5 bg-slate-900 border rounded-2xl space-y-1.5 ${isCancelled ? 'border-red-500/40 opacity-80' : 'border-emerald-500/40'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-xs text-white">{sub.templateName}</span>
                              {isCancelled ? (
                                <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <X size={10} /> {isByAdmin ? 'ملغي بواسطة الإدارة 🚫' : 'ملغي بواسطة العميل ❌'}
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <CheckCircle size={10} /> نشط ومعتمد
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] font-bold ${isCancelled ? 'text-red-300' : 'text-emerald-300'}`}>{sub.planTitle || 'اشتراك نشط'}</p>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                              <span>تاريخ التجديد: {sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                              <span className={`font-black ${isCancelled ? 'text-red-400' : 'text-emerald-400'}`}>{sub.price || '0.00'}</span>
                            </div>
                            <div className="flex gap-1.5 mt-1">
                              {!isCancelled && (
                                <button
                                  onClick={() => {
                                    setWorkspace({
                                      id: sub.id,
                                      templateId: String(sub.templateId),
                                      name: sub.templateName,
                                      customizations: sub.customizations || workspace.customizations,
                                      status: 'published'
                                    });
                                    setToast(`تم فتح موقعك النشط: ${sub.templateName} 🌐`);
                                    setTimeout(() => setToast(''), 2000);
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-[10px] text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Eye size={12} />
                                  <span>معاينة الموقع 🌐</span>
                                </button>
                              )}
                              {!isCancelled && (
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'إلغاء الاشتراك ⚠️',
                                      message: `هل أنت متأكد من رغبتك في إلغاء هذا الاشتراك (${sub.templateName})؟ سيتم تسجيل أن الإلغاء تم من قِبلك كعميل.`,
                                      confirmText: 'نعم، إلغاء الاشتراك',
                                      cancelText: 'تراجع والاحتفاظ بالاشتراك',
                                      onConfirm: async () => {
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                        const userId = user?.id || 'usr_default';
                                        setToast('تم إلغاء الاشتراك بنجاح 🗑️');
                                        setTimeout(() => setToast(''), 3500);
                                        setActiveSubscriptionsList(prev => prev.filter(s => s.id !== sub.id));
                                        await cancelSubscriptionInFirestore(sub.id, userId, sub.templateId, user?.email, sub.templateName, 'customer');
                                      }
                                    });
                                  }}
                                  className="py-1.5 px-3 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 rounded-xl font-bold text-[10px] text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
                                  title="إلغاء الاشتراك"
                                >
                                  <Trash2 size={12} />
                                  <span>إلغاء الاشتراك 🗑️</span>
                                </button>
                              )}
                              {isCancelled && (
                                <div className="w-full space-y-1.5">
                                  <div className="w-full text-center py-1.5 text-[10px] text-red-400 font-bold bg-red-950/40 border border-red-500/20 rounded-xl">
                                    {sub.cancelledBy === 'admin' ? '🚫 تم إلغاء الاشتراك من قِبَل الإدارة' : '❌ تم إلغاء الاشتراك من قِبَلك (تعديلات قالبك محفوظة)'}
                                  </div>
                                  {isByAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveSidebarTab('help');
                                      }}
                                      className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl font-black text-[11px] text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <span>🎫 فتح تذكرة دعم فني</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Favorite Templates */}
              {activeSidebarTab === 'favorites' && (
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider">قوالبك المفضلة للتنقل السريع</div>
                  {favoriteTemplates.length === 0 ? (
                    <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-slate-500 text-xs">
                      لم تقم بحفظ أي قوالب مفضلة بعد.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {favoriteTemplates.map(fav => (
                        <div key={fav.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate">{fav.templateName}</span>
                          <button className="text-emerald-400 font-bold text-[10px] hover:underline">
                            معاينة
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Site Settings */}
              {activeSidebarTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-4 pt-2 text-right text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">اسم الموقع</label>
                    <input 
                      type="text" 
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">عنوان محركات البحث (SEO)</label>
                    <input 
                      type="text" 
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> <span>حفظ الإعدادات</span>
                  </button>

                  {saveSuccess && (
                    <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-center text-emerald-300 font-bold text-[11px]">
                      تم حفظ إعدادات الموقع بنجاح 
                    </div>
                  )}
                </form>
              )}

              {/* Tab 4: Help & Support */}
              {isStoreWorkspace && activeSidebarTab === 'help' && (
                <div className="space-y-3 pt-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider">المساعدة والدعم المباشر</div>
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 text-slate-300">
                    <p className="font-bold text-white">طريقة استخدام بيئة التعديل:</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      1. انقر على أي نص أو صورة داخل الصفحة لتعديله مباشرة.<br/>
                      2. استخدم زر "إضافة التعديلات واللمسات" للتحكم بالألوان والأقسام.<br/>
                      3. اضغط زر "حفظ التعديلات" ليتم حفظ موقعك بنجاح.
                    </p>
                  </div>
                  <a
                    href="https://wa.me/962778091269"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600/30"
                  >
                    💬 تواصل مع الدعم الفني واتساب (0778091269)
                  </a>
                </div>
              )}

            </div>

            {/* Sidebar Bottom Banner & Logout */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Globe size={16} />
                <span>العودة للرئيسية (بدون تسجيل خروج)</span>
              </button>

              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'مسح كامل ذاكرة البيانات 🧹',
                    message: 'هل أنت متأكد من مسح كافة بيانات الذاكرة المؤقتة والتخزين المحلي؟ سيتم إعادة توجيهك للصفحة الرئيسية.',
                    confirmText: 'نعم، مسح البيانات',
                    cancelText: 'تراجع',
                    onConfirm: () => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/';
                    }
                  });
                }}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>🧹 مسح كامل لذاكرة البيانات</span>
              </button>

              <button
                onClick={async () => {
                  await logout();
                  if (onExitWorkspace) onExitWorkspace();
                  window.location.href = '/';
                }}
                className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                <span>تسجيل الخروج</span>
              </button>

              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold justify-center">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>محمي بنظام WaaS SaaS Platform</span>
              </div>
            </div>

          </aside>
        )}

        {/* Main Canvas Container Viewport */}
        <main className="flex-1 bg-slate-900 p-2 sm:p-4 md:p-8 overflow-y-auto flex flex-col items-center relative">
          
          {/* Mobile Screen Switcher Bar for Smartphone Users */}
          {editMode && (
            <div className="md:hidden w-full bg-slate-950/95 border border-slate-800/90 p-2 mb-3 sticky top-0 z-30 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setMobileEditView('editor')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileEditView === 'editor'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 font-black'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Edit3 size={15} />
                  <span>أدوات التعديل ⚙️</span>
                </button>
                <button
                  onClick={() => setMobileEditView('preview')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileEditView === 'preview'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-black'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Eye size={15} />
                  <span>المعاينة الحية 👁️</span>
                </button>
              </div>

              {/* Mobile Device View Switcher when viewing preview */}
              {mobileEditView === 'preview' && (
                <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-400">نمط المعاينة:</span>
                  <button
                    onClick={() => setDevicePreview('desktop')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      devicePreview === 'desktop' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor size={13} />
                    <span>عرض كامل</span>
                  </button>
                  <button
                    onClick={() => setDevicePreview('mobile')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      devicePreview === 'mobile' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>إطار جوال</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Live Template Customization Control Drawer when Edit Mode is active */}
          {editMode && (
            <div className={`w-full max-w-6xl ${
              mobileEditView === 'editor' ? 'block' : 'hidden md:block'
            }`}>
              <TemplateLiveEditorDrawer
                templateId={parseInt(workspace.templateId || '1', 10)}
                customizations={workspace.customizations}
                workspaceId={workspace.id}
                onChange={(updatedCustomizations) => {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    customizations: updatedCustomizations
                  }));

                  // Auto save to server backend quietly
                  if (workspace.id) {
                    const parsedId = typeof workspace.id === 'number' ? workspace.id : parseInt(String(workspace.id), 10);
                    if (!isNaN(parsedId) && parsedId > 0 && parsedId <= 2147483647) {
                      fetch(`/api/workspaces/${parsedId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ customizations: updatedCustomizations })
                      }).catch(err => console.error('Save failed:', err));
                    }
                  }
                }}
                onSubscribeSuccess={() => {
                  if (onExitWorkspace) onExitWorkspace();
                }}
                onSaveComplete={async (savedCustomizations) => {
                  const dataToSave = savedCustomizations || workspace.customizations;
                  await syncToFirebase(dataToSave);
                  await refreshUserData();
                  setEditMode(false);
                  setToast('🎉 تم حفظ التعديلات بنجاح! أصبحت متاحة الآن في قائمة "القوالب التي عدلت عليها".');
                  setTimeout(() => setToast(''), 3000);
                }}
              />
            </div>
          )}

          <div className={`w-full transition-all duration-300 space-y-4 ${
            editMode && mobileEditView === 'editor' ? 'hidden md:block' : 'block'
          } ${
            devicePreview === 'mobile' ? 'max-w-md my-2 md:my-4 shadow-2xl rounded-[28px] md:rounded-[40px] border-4 md:border-8 border-slate-800 overflow-hidden bg-white p-1 md:p-2 mx-auto' : 'max-w-6xl'
          }`}>
            
            {/* Status Banner based on Subscription / Edited state */}
            {isCurrentSubscribed ? (
              activeRemainingDays <= 7 ? (
                <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/95 to-red-950/90 border-2 border-amber-500/80 rounded-2xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle size={24} className="animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm md:text-base text-amber-200">
                          ⚠️ تحذير الاشتراك: متبقي {activeRemainingDays} أيام فقط على انتهاء الاشتراك!
                        </h3>
                        <span className="text-[10px] bg-red-500/40 text-red-200 border border-red-500/50 px-2 py-0.5 rounded-full font-bold">
                          تجديد عاجل مطلوب
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/90 mt-0.5">
                        ينتهي بتاريخ {activeSubscriptionDetails?.renewalDate ? new Date(activeSubscriptionDetails.renewalDate).toLocaleDateString('ar-EG') : ''}. يرجى التجديد الآن لضمان استمرار عمل موقعك وتجنب إيقاف الخدمة.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleSubscribeClick()}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>تجديد الاشتراك الآن ⚡</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-950/80 border-2 border-emerald-500/60 rounded-2xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm md:text-base text-white">
                          ✅ اشتراكك نشط ومجّدد في هذا القالب ({activeRemainingDays > 0 ? `متبقي ${activeRemainingDays} يوم` : 'مفعل'})
                        </h3>
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          نشط ومحدث أونلاين
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        الباقة الحالية: <strong className="text-white">{activeSubscriptionDetails?.planTitle || 'باقة نشطة'}</strong> — تاريخ التجديد والانتهاء: {activeSubscriptionDetails?.renewalDate ? new Date(activeSubscriptionDetails.renewalDate).toLocaleDateString('ar-EG') : 'دائم'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-700/50">
                      {activeSubscriptionDetails?.price || 'مفعل'}
                    </div>
                    <button
                      onClick={() => handleSubscribeClick()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>تجديد / تغيير الباقة 🔄</span>
                    </button>
                  </div>
                </div>
              )
            ) : isCurrentSavedInEdited ? (
              <div className="bg-amber-950/80 border-2 border-amber-500/60 rounded-2xl p-4 text-white flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base text-amber-100">
                      💾 تعديلاتك لهذا القالب محفوظة في قائمة "القوالب التي عدلت عليها"!
                    </h3>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      اشترك الآن لتنشيط القالب ونشر موقعك مباشرة أونلاين، أو انقر عودة للتعديل لإضافة تحسينات أخرى.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleAttemptEnterEditMode}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                  >
                    <Wand2 size={15} />
                    <span>عودة للتعديل </span>
                  </button>
                  <button
                    onClick={() => handleSubscribeClick()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CreditCard size={16} />
                    <span>اشترك الآن وفعّل الموقع 💳</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* The EXACT SELECTED TEMPLATE is ALWAYS rendered here so the user edits their exact selected template live! */}
            <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative w-full">
              <TemplateRenderer 
                templateId={parseInt(workspace.templateId || '1', 10)} 
                content={workspace.customizations}
                tenant={{ subdomain: workspace.domain || 'mysite' }}
                onUpdateContent={(updatedContent) => {
                  console.log('Update content from TemplateRenderer:', updatedContent);
                  
                  if (!updatedContent || Object.keys(updatedContent).length === 0) {
                    console.warn('Attempted to save empty content, ignoring.');
                    return;
                  }

                  setHasUserModified(true);
                  setWorkspace((prev: any) => ({ ...prev, customizations: updatedContent }));
                  if (workspace.id) {
                    const parsedId = typeof workspace.id === 'number' ? workspace.id : parseInt(String(workspace.id), 10);
                    if (!isNaN(parsedId) && parsedId > 0 && parsedId <= 2147483647) {
                      fetch(`/api/workspaces/${parsedId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ customizations: updatedContent })
                      }).catch(err => console.error('Save failed:', err));
                    }
                  }
                  syncToFirebase(updatedContent);
                }}
                isEditable={editMode}
              />
            </div>

          </div>

          {/* Floating Action Button to Enter Editing Environment when in Preview Mode */}
          {!editMode && (
            <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[90vw]">
              <button
                onClick={handleAttemptEnterEditMode}
                className="group relative px-6 py-3 md:px-8 md:py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm shadow-2xl hover:scale-102 active:scale-98 transition-all duration-300 flex items-center gap-3 border border-slate-700 cursor-pointer backdrop-blur-md"
              >
                <LayoutTemplate size={18} className="text-slate-300 shrink-0" />
                <span className="whitespace-nowrap">دخول بيئة التعديل</span>
              </button>
            </div>
          )}

        </main>

      </div>

      {/* No Edits Confirmation Modal */}
      {isNoEditsConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 dir-rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-right space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Header Icon & Text */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <AlertTriangle size={30} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg md:text-xl font-black text-white">
                  هل أنت تأكد من الاشتراك بدون أي تعديل؟
                </h3>
                <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                  لم تقم بإجراء أي تعديلات على نصوص القالب أو ألوانه أو صوره بعد. هل ترغب بالاستمرار في الاشتراك بالنسخة الافتراضية كما هي، أم تفضل دخول بيئة التعديل وتخصيصه أولاً؟
                </p>
              </div>
            </div>

            {/* Note Badge */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-300 font-medium">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              <span>ملاحظة: يمكنك دائماً التعديل على موقعك وتحديث كافة بياناته بعد إتمام عملية الاشتراك في أي وقت.</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setIsNoEditsConfirmModalOpen(false);
                  handleAttemptEnterEditMode();
                }}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wand2 size={16} />
                <span>دخول بيئة التعديل أولاً </span>
              </button>

              <button
                onClick={() => {
                  setIsNoEditsConfirmModalOpen(false);
                  if (workspace.id) {
                    const parsedId = typeof workspace.id === 'number' ? workspace.id : parseInt(String(workspace.id), 10);
                    if (!isNaN(parsedId) && parsedId > 0 && parsedId <= 2147483647) {
                      fetch(`/api/workspaces/${parsedId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ customizations: workspace.customizations })
                      }).catch(err => console.error('Save failed:', err));
                    }
                  }
                  setIsPaymentModalOpen(true);
                }}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
              >
                <CreditCard size={16} />
                <span>الاشتراك بدون أي تعديل 💳</span>
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => setIsNoEditsConfirmModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
              title="إغلاق"
            >
              <X size={18} />
            </button>

          </div>
        </div>
      )}

      {/* Plans Selection Modal for Subscription / Renewal */}
      {isPlansModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">باقاتنا والاشتراكات المتوفرة</span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">اختر باقة التجديد أو الاشتراك المناسبة</h3>
                <p className="text-xs text-slate-400 mt-0.5">حدد الباقة التي تفضلها لتفعيل أو تجديد موقعك الفوري 🌟</p>
              </div>
              <button 
                onClick={() => setIsPlansModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {getSubscriptionPlans().map((plan, idx) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div key={`client-plan-modal-${plan.id}-${idx}`} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20' : plan.popular ? 'bg-blue-950/40 border-blue-500/50 shadow-lg ring-2 ring-blue-500/20' : 'bg-slate-950 border-slate-800'}`}>
                    {isSelected && (
                      <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow">
                        الباقة المختارة 🌟
                      </span>
                    )}
                    <div className="space-y-3">
                      {plan.popular && !isSelected && <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الأكثر طلباً واحترافية</span>}
                      <h4 className="font-black text-white text-sm sm:text-base">{plan.name}</h4>
                      <div className="text-xl font-black text-blue-400">{plan.price} <span className="text-xs font-medium text-slate-400">/ {plan.duration}</span></div>
                      <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                        {plan.features.map((f, i) => (
                          <li key={`client-feat-${plan.id}-${i}`} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button 
                      onClick={() => {
                        localStorage.setItem('selectedPlanId', plan.id);
                        setSelectedPlanId(plan.id);
                        setIsPlansModalOpen(false);
                        setIsPaymentModalOpen(true);
                      }}
                      className={`mt-5 w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${isSelected ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/40' : plan.id === 'starter' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                    >
                      {isSelected 
                        ? 'تأكيد واختيار هذه الباقة ✨'
                        : 'اختيار والمتابعة إلى بوابة الدفع 💳'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tenantName={workspace?.name || 'موقعي الخاص'}
        planName={getPlanTitleById(localStorage.getItem('selectedPlanId') || undefined)}
        amount={getPlanAmountById(localStorage.getItem('selectedPlanId') || undefined)}
        templateId={workspace?.templateId}
        onSuccess={async (details) => {
          try {
            const userId = user?.id || 'usr_default';
            const userEmail = user?.email || 'client@waas.com';
            const currentTplId = workspace.templateId || '1';
            const tplName = TEMPLATE_NAMES[String(currentTplId)] || workspace.name || `قالب رقم ${currentTplId}`;

            const oldSub = activeSubscriptionsList.find(s => String(s.templateId) === String(currentTplId));
            const oldPlanTitle = oldSub?.planTitle || oldSub?.plan || 'اشتراك سابق';

            // If customDomain was specified during checkout, update it
            if (details.customDomain) {
              setCustomDomain(details.customDomain);
              setWorkspace(prev => ({ ...prev, domain: details.customDomain }));
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
              await fetch('/api/tenant/custom-domain', {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ customDomain: details.customDomain })
              }).catch(e => console.error('Domain update error:', e));
            }

            // Create subscription record in Firestore, LocalStorage & Activity log
            const updatedCustomizations = {
              ...workspace.customizations,
              ...(details.storeName ? { businessName: details.storeName, heroTitle: details.storeName } : {})
            };
            if (details.storeName) {
              setWorkspace(prev => ({ ...prev, name: details.storeName, customizations: updatedCustomizations }));
            }
            const newSub = await createSubscriptionInFirestore(
              userId,
              userEmail,
              currentTplId,
              workspace.name || tplName,
              details.billingCycle,
              details.price,
              updatedCustomizations
            );

            const newPlanTitle = newSub.planTitle || details.billingCycle;
            setToast(`✨ تم تجديد الاشتراك بنجاح! تم تغيير وتحديث الباقة من (${oldPlanTitle}) إلى (${newPlanTitle}) وتمديد مدة الاشتراك بنجاح 🚀`);
            setTimeout(() => setToast(''), 5000);

            // Update local React states immediately
            setActiveSubscriptionsList(prev => [newSub, ...prev.filter(s => String(s.templateId) !== String(currentTplId))]);
            setEditedTemplatesList(prev => prev.filter(item => String(item.templateId) !== String(currentTplId)));
            setActiveSidebarTab('subscriptions');


            await refreshUserData();
            setToast(`🎉 تم الاشتراك بنجاح بـ (${details.plan})! تحول القالب إلى قائمة الاشتراكات والمنشورات بنجاح.`);
            setTimeout(() => setToast(''), 3000);
          } catch (err) {
            console.error('Error handling subscription success:', err);
            setToast('تم الدفع والتفعيل بنجاح! ');
            setTimeout(() => setToast(''), 2500);
          }
        }}
      />

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-800 text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{confirmModal.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
              >
                {confirmModal.confirmText || 'تأكيد'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
              >
                {confirmModal.cancelText || 'تراجع'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-black text-sm shadow-2xl flex items-center gap-3 z-[99999] animate-bounce border-2 border-emerald-500/80 pointer-events-none">
          <span className="w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping"></span>
          <span className="text-emerald-300">{toast}</span>
        </div>
      )}

      {/* Payment Gateway Issue Modal */}
      <PaymentGatewayIssueModal
        isOpen={isGatewayIssueOpen}
        onClose={() => setIsGatewayIssueOpen(false)}
        customMessage={gatewayIssueMsg}
        templateName={gatewayIssueTplName}
      />

    </div>
  );
};

export default ClientWorkspace;
