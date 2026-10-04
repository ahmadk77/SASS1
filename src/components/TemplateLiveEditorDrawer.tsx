import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  Palette, 
  Phone, 
  ListPlus, 
  Settings2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Image as ImageIcon,
  Save,
  Layers,
  ChevronDown,
  ChevronUp,
  Upload,
  Eye,
  EyeOff,
  CreditCard,
  CheckCircle2,
  X
} from 'lucide-react';
import PaymentCheckoutModal from './PaymentCheckoutModal';
import { checkFeatureLock, fetchSystemSettings } from '../lib/systemSettingsClient';
import { fetchUserSubscriptionsFromFirestore, saveEditedTemplate } from '../lib/activityLogger';
import { getSubscriptionPlans, getPlanTitleById, getPlanAmountById } from '../lib/subscriptionPlans';
import { auth } from '../lib/firebase';

export interface TemplateLiveEditorProps {
  templateId: number;
  customizations: any;
  workspaceId: number;
  onChange: (updatedCustomizations: any) => void;
  onSaveStatus?: (msg: string) => void;
  onSubscribeSuccess?: () => void;
  onSaveComplete?: (content: any) => Promise<void> | void;
  onSubscribeClick?: () => void;
}

const TEMPLATE_NAMES: Record<number, string> = {
  1: 'قالب المطعم الإيطالي والفاخر',
  2: 'قالب برجر ستيشن للوجبات السريعة',
  3: 'قالب بيتزا ووجبات عائلية',
  4: 'قالب كافيه وقهوة كلاسيك',
  5: 'قالب محمص وقهوة مختصة',
  6: 'قالب بوتيك الحلويات والآيس كريم',
  7: 'قالب العقارات والفلل الفاخرة',
  8: 'قالب الشقق والمجمعات السكنية',
  9: 'قالب المركز والمكتب العقاري',
  10: 'قالب شركات المقاولات والبناء',
  11: 'قالب الاستشارات والتصميم المعماري',
  12: 'قالب التصميم الداخلي والتجديد',
  13: 'قالب أزياء وبوتيك فاخر',
  14: 'متجر الأجهزة الإلكترونية والذكية',
  15: 'متجر العناية بالبشرة والجسم'
};

const COLOR_PRESETS = [
  { name: 'ذهبي فاخر', hex: '#d4af37' },
  { name: 'أزرق ملكي', hex: '#0284c7' },
  { name: 'زمردي راقي', hex: '#008060' },
  { name: 'عنابي دافئ', hex: '#e11d48' },
  { name: 'بنفسجي ملكي', hex: '#8b5cf6' },
  { name: 'عنبري دافئ', hex: '#d97706' },
  { name: 'فحمي عصري', hex: '#1e293b' }
];

const STOCK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200',
  'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=1200',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200'
];

const STOCK_HERO_CATEGORIES = [
  {
    name: '🍽️ مطاعم وكافيهات',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200',
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1200',
    ]
  },
  {
    name: '🏢 عقارات وفلل فاخرة',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200',
    ]
  },
  {
    name: '🏗️ مقاولات وبناء وترميم',
    images: [
      'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=1200',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200',
    ]
  },
  {
    name: '💼 شركات وأعمال',
    images: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200',
    ]
  }
];

export const STOCK_LOGOS = [
  {
    category: '🍽️ مطاعم وكافيهات',
    items: [
      { name: 'مطعم فاخر ورئيسي', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=300' },
      { name: 'كافيه وقهوة مختصة', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=300' },
      { name: 'الشيف المتميز', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=300' },
      { name: 'مخبز وحلويات', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300' },
      { name: 'بيتزا إيطالية', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300' },
      { name: 'برجر ووجبات سريعة', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300' }
    ]
  },
  {
    category: '🏢 عقارات ومقاولات',
    items: [
      { name: 'أبراج ومعمار حديث', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300' },
      { name: 'القصر العقاري', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300' },
      { name: 'الهندسة والبناء', url: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=300' },
      { name: 'فيلا فاخرة', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=300' },
      { name: 'تصميم وترميم', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=300' }
    ]
  },
  {
    category: '💎 بوتيكات وفخامة',
    items: [
      { name: 'تاج الملكة للبوتيك', url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=300' },
      { name: 'أزياء وموضة', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=300' },
      { name: 'عطور وساعات', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300' },
      { name: 'مجوهرات وماس', url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=300' }
    ]
  },
  {
    category: '⚡ شركات وخدمات عامة',
    items: [
      { name: 'تقنية وبرمجيات', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=300' },
      { name: 'أعمال واستشارات', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=300' },
      { name: 'تسويق وإعلام', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=300' }
    ]
  }
];

export const TemplateLiveEditorDrawer: React.FC<TemplateLiveEditorProps> = ({
  templateId,
  customizations,
  workspaceId,
  onChange,
  onSaveStatus,
  onSubscribeSuccess,
  onSaveComplete,
  onSubscribeClick
}) => {
  const userId = auth.currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : 'usr_default');
  const userEmail = auth.currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : undefined);
  
  const [fetchedSubs, setFetchedSubs] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadSubs = async () => {
      try {
        const firestoreSubs = await fetchUserSubscriptionsFromFirestore(userId, userEmail);
        let backendSubs: any[] = [];
        try {
          const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
          const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const impersonateId = urlParams?.get('impersonateTenantId') || (typeof window !== 'undefined' ? localStorage.getItem('impersonatedTenantId') : null);
          const url = impersonateId ? `/api/tenant/subscriptions?impersonateTenantId=${impersonateId}` : '/api/tenant/subscriptions';
          
          const res = await fetch(url, {
            headers: { 
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              ...(impersonateId ? { 'x-impersonate-tenant-id': impersonateId } : {})
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.subscriptions)) backendSubs = data.subscriptions;
          }
        } catch (e) {}

        if (isMounted) {
          const map = new Map<string, any>();
          [...firestoreSubs, ...backendSubs].forEach((sub: any) => {
            const key = String(sub.id || sub.templateId || sub.tenantId || Math.random());
            map.set(key, {
              ...sub,
              renewalDate: sub.renewalDate || sub.endDate,
              planTitle: sub.planTitle || (sub.plan === 'starter' || sub.plan === 'free' ? 'الباقة التجريبية' : sub.plan === 'yearly' || sub.plan === 'pro_yearly' ? 'الباقة السنوية' : 'الباقة الشهرية'),
              status: sub.status || 'active'
            });
          });
          setFetchedSubs(Array.from(map.values()));
        }
      } catch (err) {}
    };
    loadSubs();
    return () => { isMounted = false; };
  }, [userId, userEmail, templateId, workspaceId]);

  const allSubs: any[] = [...fetchedSubs];
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('waas_subscriptions_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) allSubs.push(...parsed);
            else if (parsed) allSubs.push(parsed);
          } catch (e) {}
        }
      }
    }
  }
  const tplName = TEMPLATE_NAMES[templateId] || '';
  const nowTime = Date.now();
  let activeSub = allSubs.find((s: any) => {
    const isStatusActive = (s.status === 'active' || s.status === 'trialing' || s.status === 'trial');
    if (!isStatusActive) return false;

    const subRenewal = s.renewalDate || s.endDate;
    if (subRenewal && new Date(subRenewal).getTime() <= nowTime) return false;

    const matchesTemplateId = templateId && String(s.templateId) === String(templateId);
    const matchesTemplateName = tplName && s.templateName && s.templateName.trim() === tplName.trim();
    const matchesTenantId = workspaceId && (String(s.tenantId) === String(workspaceId) || String(s.id) === String(workspaceId));

    return matchesTemplateId || matchesTemplateName || matchesTenantId;
  }) || null;

  const remainingDays = (() => {
    const renewal = activeSub?.renewalDate || activeSub?.endDate;
    if (!activeSub || !renewal) return 30;
    const diff = new Date(renewal).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();
  const [activeTab, setActiveTab] = useState<'branding' | 'styling' | 'images' | 'sections' | 'contact' | 'items' | 'options'>('branding');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditorPlansModalOpen, setIsEditorPlansModalOpen] = useState(false);
  const [showEditorSubBanner, setShowEditorSubBanner] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    const p = localStorage.getItem('selectedPlanId');
    if (p) return p;
    try {
      const raw = localStorage.getItem('selected_plan_checkout');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id) return parsed.id;
      }
    } catch (e) {}
    return 'starter';
  });
  const [toast, setToast] = useState('');

  useEffect(() => {
    const storedPlan = localStorage.getItem('selectedPlanId');
    if (storedPlan) {
      setSelectedPlanId(storedPlan);
    } else {
      try {
        const raw = localStorage.getItem('selected_plan_checkout');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id) setSelectedPlanId(parsed.id);
        }
      } catch (e) {}
    }
  }, [isEditorPlansModalOpen]);

  const content = customizations || {};

  const handleImageUpload = (file: File | undefined, callback: (base64Url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const autoSaveTimer = useRef<any>(null);

  const handleUpdateFields = (fields: Record<string, any>) => {
    const updated = {
      ...(customizations || content),
      ...fields
    };
    onChange(updated);
    if (onSaveStatus) onSaveStatus('جاري الحفظ تلقائياً... ');

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
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
          body: JSON.stringify({ content: updated, impersonateTenantId: impersonateId })
        });

        // Save to edited_templates in LocalStorage & Firestore
        const tplName = TEMPLATE_NAMES[templateId] || `قالب رقم ${templateId}`;
        const docId = workspaceId ? String(workspaceId) : `${userId}_template_${templateId}`;
        await saveEditedTemplate(userId, userEmail || 'client@waas.com', templateId, tplName, updated, docId);

        if (onSaveStatus) onSaveStatus('saved');
      } catch (e) {
        console.error('Auto save error:', e);
      }
    }, 800);
  };

  const handleUpdateField = (key: string, value: any) => {
    handleUpdateFields({ [key]: value });
  };

  // Label names according to template category
  const isRestaurant = [1, 2, 3, 4, 5, 6].includes(templateId);
  const isRealEstate = [7, 8, 9].includes(templateId);
  const isContractor = [10, 11, 12].includes(templateId);
  const isBoutique = templateId === 13;
  const isPerfume = templateId === 99; // Deprecated
  const isElectronics = templateId === 14;

  const itemsList = Array.isArray(content.items) && content.items.length > 0 
    ? content.items 
    : (Array.isArray(content.products) && content.products.length > 0 ? content.products : []);

  const handleAddItem = () => {
    let newItem: any = {};
    if (isRestaurant) {
      newItem = {
        id: Date.now(),
        name: 'طبق جديد',
        description: 'وصف الطبق والمكونات الرئيسية هنا',
        price: '٥٠ ريال',
        category: 'الأطباق الرئيسية',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
        prepTime: '15 دقيقة',
        calories: '650 سعرة',
        badge: 'مميز ⭐'
      };
    } else if (isRealEstate) {
      newItem = {
        id: Date.now(),
        title: 'عقار متميز جديد',
        price: '١,٥٠٠,٠٠٠ ريال',
        location: 'حي الملقا، الرياض',
        beds: 4,
        baths: 4,
        area: '350',
        type: 'للبيع',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'
      };
    } else if (isPerfume) {
      newItem = {
        id: Date.now(),
        name: 'عطر فاخر جديد',
        description: 'نفحات عطرية مميزة وثبات عالي',
        price: '٣٥٠ ريال',
        category: 'عطور شرقية',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800',
        sizes: ['50ml', '100ml']
      };
    } else if (isElectronics) {
      newItem = {
        id: Date.now(),
        name: 'منتج إلكتروني جديد',
        description: 'أحدث الأجهزة الأصلية بضمان معتمد',
        price: '2999',
        category: 'الهواتف الذكية والأجهزة',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800',
        sizes: ['256GB', '512GB', '1TB'],
        colors: ['أسود', 'فضي']
      };
    } else if (isBoutique) {
      newItem = {
        id: Date.now(),
        name: 'منتج بوتيك جديد',
        description: 'تصميم أنيق وجودة عالية',
        price: '290',
        category: 'ساعات وإكسسوارات',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800',
        sizes: ['S', 'M', 'L', 'XL']
      };
    } else {
      newItem = {
        id: Date.now(),
        title: 'مشروع / خدمة جديدة',
        category: 'خدماتنا',
        description: 'تفاصيل الخدمة أو المشروع المنفذ',
        image: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=800',
        icon: '🏗️'
      };
    }

    const updatedItems = [newItem, ...itemsList];
    handleUpdateField('items', updatedItems);
    setEditingItemIndex(0);
  };

  const handleUpdateItem = (index: number, fieldKey: string, val: any) => {
    const updated = itemsList.map((item: any, idx: number) => {
      if (idx === index) {
        return { ...item, [fieldKey]: val };
      }
      return item;
    });
    handleUpdateField('items', updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = itemsList.filter((_: any, idx: number) => idx !== index);
    handleUpdateField('items', updated);
    if (editingItemIndex === index) setEditingItemIndex(null);
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden mb-6 transition-all text-right dir-rtl">
      
      {/* Drawer Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 md:px-5 md:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-white font-extrabold text-xs md:text-sm flex items-center gap-1.5 flex-wrap">
              <span>أدوات التعديل:</span>
              <span className="text-amber-400 font-black">{TEMPLATE_NAMES[templateId] || `قالب رقم ${templateId}`}</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                مباشر ⚡
              </span>
            </h3>
            <p className="text-slate-400 text-[10px] md:text-[11px] mt-0.5">عدّل النصوص والألوان والصور والمنتجات وتظهر فوراً على القالب.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={async () => {
              const fresh = await fetchSystemSettings(true);
              if (fresh.lockSaveEdits) {
                const msg = fresh.customNoticeMessage || 'مغلق الآن - حفظ التعديلات مغلق حالياً من قبل الإدارة';
                setToast(msg);
                setTimeout(() => setToast(''), 4000);
                return;
              }
              const lockCheck = checkFeatureLock('saveEdits');
              if (lockCheck.isLocked) {
                setToast(lockCheck.noticeMessage || 'مغلق الآن - حفظ التعديلات مغلق حالياً من قبل الإدارة');
                setTimeout(() => setToast(''), 4000);
                return;
              }

              const payloadContent = customizations || content;
              if (workspaceId) {
                const parsedId = typeof workspaceId === 'number' ? workspaceId : parseInt(String(workspaceId), 10);
                if (!isNaN(parsedId) && parsedId > 0 && parsedId <= 2147483647) {
                  fetch(`/api/workspaces/${parsedId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customizations: payloadContent })
                  }).catch(err => console.error('Save failed:', err));
                }
              }

              // Also update live tenant website content in database so changes appear immediately on the live site
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
                  body: JSON.stringify({ content: payloadContent, impersonateTenantId: impersonateId })
                });
              } catch (liveErr) {
                console.warn('Live content update notice:', liveErr);
              }

              // Save to edited_templates in LocalStorage & Firestore
              try {
                const tplName = TEMPLATE_NAMES[templateId] || `قالب رقم ${templateId}`;
                const docId = workspaceId ? String(workspaceId) : `${userId}_template_${templateId}`;
                await saveEditedTemplate(userId, userEmail || 'client@waas.com', templateId, tplName, payloadContent, docId);
              } catch (saveErr) {
                console.warn('saveEditedTemplate notice:', saveErr);
              }

              // Notify parent onChange to sync
              onChange(payloadContent);
              if (onSaveComplete) {
                await onSaveComplete(payloadContent);
              }
              setToast('🎉 تم حفظ ونشر التعديلات بنجاح على موقعك الحي!');
              setTimeout(() => setToast(''), 3000);
              if (onSaveStatus) onSaveStatus('saved');
            }}
            className="flex-1 sm:flex-none px-3.5 py-2.5 md:px-4 md:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] shrink-0"
            title="حفظ التعديلات الحالية للقالب في قائمة القوالب المعدلة"
          >
            <Save size={15} />
            <span>💾 حفظ التعديلات</span>
          </button>

          {activeSub && showEditorSubBanner ? (
            <div className="hidden md:flex items-center gap-1.5 md:gap-2 bg-emerald-950/95 border border-emerald-500/60 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl text-emerald-300 text-xs font-black shrink-0 shadow-sm relative">
              <CreditCard size={14} className="text-emerald-400 shrink-0" />
              <div className="flex flex-col text-right">
                <span className="text-white text-[11px] font-extrabold">{activeSub.planTitle || 'باقة نشطة'}</span>
                <span className="text-[10px] text-emerald-200">⏳ {remainingDays} يوم</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange(content);
                  setIsEditorPlansModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all shadow-sm shrink-0"
              >
                تجديد 🔄
              </button>
              <button
                type="button"
                onClick={() => setShowEditorSubBanner(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/60 transition-colors ml-0.5"
                title="إغلاق الإشعار"
              >
                <X size={14} />
              </button>
            </div>
          ) : activeSub && !showEditorSubBanner ? (
            <button
              onClick={() => setShowEditorSubBanner(true)}
              className="md:hidden bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1"
              title="إظهار تفاصيل الباقة"
            >
              <CreditCard size={13} />
              <span>الباقة ({remainingDays}يوم)</span>
            </button>
          ) : !activeSub ? (
            <button
              onClick={() => {
                onChange(content);
                const currentSelected = localStorage.getItem('selectedPlanId') || 'starter';
                setSelectedPlanId(currentSelected);
                if (onSubscribeClick) {
                  onSubscribeClick();
                } else {
                  setIsEditorPlansModalOpen(true);
                }
              }}
              className="flex-1 sm:flex-none px-3.5 py-2.5 md:px-4 md:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] shrink-0"
            >
              <CreditCard size={15} />
              <span>اشتراك 💳</span>
            </button>
          ) : null}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer min-h-[44px] min-w-[44px] shrink-0"
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            <span className="hidden sm:inline">{isCollapsed ? 'توسيع' : 'طَي'}</span>
          </button>
        </div>
      </div>

      {/* Main Controls Body */}
      {!isCollapsed && (
        <div className="p-3 md:p-6 space-y-5">
          
          {/* Tabs Nav Header - Smooth Horizontal Scroll */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none whitespace-nowrap pt-1">
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeTab === 'branding'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Type size={15} />
              <span>🏷️ النصوص والهوية</span>
            </button>

            <button
              onClick={() => setActiveTab('styling')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeTab === 'styling'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette size={15} />
              <span> الألوان والخطوط</span>
            </button>

            <button
              onClick={() => setActiveTab('images')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeTab === 'images'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon size={15} />
              <span>🖼️ الصور والخلفيات</span>
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeTab === 'sections'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers size={15} />
              <span>🧩 الأقسام</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeTab === 'contact'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Phone size={15} />
              <span>📞 التواصل</span>
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeTab === 'items'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ListPlus size={15} />
              <span>
                {isRestaurant && '🍽️ المنيو'}
                {isRealEstate && '🏢 العقارات'}
                {isContractor && '🏗️ المشاريع'}
                {!isRestaurant && !isRealEstate && !isContractor && '📋 العناصر'}
              </span>
              <span className="bg-slate-950 px-1.5 py-0.5 rounded-md text-[10px] text-emerald-400 font-mono">
                {itemsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('options')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeTab === 'options'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings2 size={15} />
              <span>⚙️ الخيارات والطلبات</span>
            </button>
          </div>

          {/* TAB 1: BRANDING & ALL TEMPLATE TEXTS */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-2">
                <h4 className="text-xs font-bold text-emerald-400">✏️ تعديل كامل نصوص وعناوين القالب كلمة بكلمة:</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">يمكنك تغيير أي عنوان، نص فرعي، فقرة، أو زر يظهر في القالب فوراً.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم النشاط / المطعم / الشركة *</label>
                  <input
                    type="text"
                    value={content.businessName ?? content.siteName ?? content.storeName ?? content.clinicName ?? content.name ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateFields({
                        businessName: val,
                        siteName: val,
                        storeName: val,
                        clinicName: val,
                        name: val
                      });
                    }}
                    placeholder="مثال: مطعم القصر الفاخر"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الشعار الوصفي الرئيسي (Slogan)</label>
                  <input
                    type="text"
                    value={content.slogan ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateFields({
                        slogan: val
                      });
                    }}
                    placeholder="مثال: العيادة رقم #1 في طب الأسنان التجميلي"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الهيرو الرئيسي (Hero Title)</label>
                  <input
                    type="text"
                    value={content.heroTitle ?? content.title ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateFields({
                        heroTitle: val,
                        title: val,
                        heading: val
                      });
                    }}
                    placeholder="مثال: مرحباً بك في مطعم القصر الفاخر"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">العنوان الفرعي للهيرو (Hero Subtitle)</label>
                  <input
                    type="text"
                    value={content.heroSubtitle ?? content.subtitle ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleUpdateFields({
                        heroSubtitle: val,
                        subtitle: val
                      });
                    }}
                    placeholder="مثال: استمتع بأشهر الأطباق والعصائر الطازجة"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان قسم المنيو / المنتجات / العقارات</label>
                  <input
                    type="text"
                    value={content.menuTitle || ''}
                    onChange={(e) => handleUpdateField('menuTitle', e.target.value)}
                    placeholder="مثال: قائمة الأطباق الرئيسية / العقارات الممتازة"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">وصف قسم المنيو / المنتجات</label>
                  <input
                    type="text"
                    value={content.menuSubtitle || ''}
                    onChange={(e) => handleUpdateField('menuSubtitle', e.target.value)}
                    placeholder="مثال: تم إعدادها بأجود المكونات الطازجة يومياً"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان قسم "عن الشركة / القصة"</label>
                  <input
                    type="text"
                    value={content.aboutTitle || ''}
                    onChange={(e) => handleUpdateField('aboutTitle', e.target.value)}
                    placeholder="مثال: من نحن / قصتنا"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نص الشرح في قسم "عن الشركة"</label>
                  <input
                    type="text"
                    value={content.aboutText || ''}
                    onChange={(e) => handleUpdateField('aboutText', e.target.value)}
                    placeholder="مثال: نقدم لكم أرقـى الخدمات منذ ٢٠١٥..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان قسم الاتصال والتواصل</label>
                  <input
                    type="text"
                    value={content.contactTitle || ''}
                    onChange={(e) => handleUpdateField('contactTitle', e.target.value)}
                    placeholder="مثال: تواصل معنا / تواصل مع فريق المبيعات"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نص زر الواتساب / الطلب</label>
                  <input
                    type="text"
                    value={content.whatsappBtnText || ''}
                    onChange={(e) => handleUpdateField('whatsappBtnText', e.target.value)}
                    placeholder="مثال: اطلب الآن عبر الواتساب"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="md:col-span-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={15} />
                      <span>معرض الشعارات واللوجوهات الاحترافية الجاهزة:</span>
                    </label>
                    <span className="text-[10px] text-slate-400">اختر شعاراً جاهزاً بنقرة واحدة</span>
                  </div>

                  <div className="space-y-3">
                    {STOCK_LOGOS.map((group, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 block">{group.category}:</span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {group.items.map((item, i) => {
                            const currentLogo = content.logoUrl !== undefined ? content.logoUrl : content.logo;
                            const isSelected = currentLogo === item.url;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  handleUpdateField('logoUrl', item.url);
                                  handleUpdateField('logo', item.url);
                                }}
                                className={`p-1.5 rounded-xl border bg-slate-900 transition-all flex flex-col items-center gap-1 group cursor-pointer ${
                                  isSelected 
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-lg bg-emerald-950/30' 
                                    : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                                }`}
                                title={item.name}
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 p-0.5 border border-slate-800 flex items-center justify-center">
                                  <img src={item.url} alt={item.name} className="w-full h-full object-cover rounded" />
                                </div>
                                <span className="text-[9px] text-slate-300 font-bold truncate max-w-full group-hover:text-white">
                                  {item.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">أو أدخل رابط لوجو خاص (Logo Image URL):</label>
                      <input
                        type="text"
                        value={content.logoUrl !== undefined ? content.logoUrl : (content.logo || '')}
                        onChange={(e) => {
                          handleUpdateField('logoUrl', e.target.value);
                          handleUpdateField('logo', e.target.value);
                        }}
                        placeholder="https://example.com/my-logo.png"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                    
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all shrink-0 mt-4">
                      <Upload size={14} />
                      <span>رفع لوجو من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleImageUpload(file, (url) => {
                            handleUpdateField('logoUrl', url);
                            handleUpdateField('logo', url);
                          });
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نص التذييل وحقوق النشر (Footer)</label>
                  <input
                    type="text"
                    value={content.footerText || ''}
                    onChange={(e) => handleUpdateField('footerText', e.target.value)}
                    placeholder="مثال: جميع الحقوق محفوظة © ٢٠٢٥"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Stock Hero Background Selector */}
                <div className="md:col-span-2 mt-2">
                  <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                    <span>صورة الغلاف / الهيرو الرئيسية (Hero Background):</span>
                    <span className="text-slate-400 text-[11px]">اختر صورة من المكتبة أو أدخل رابطك الخاص</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                    {STOCK_HERO_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleUpdateField('heroBgUrl', img)}
                        className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all cursor-pointer ${
                          content.heroBgUrl === img ? 'border-emerald-500 scale-105 shadow-lg' : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="Hero" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={content.heroBgUrl || ''}
                    onChange={(e) => handleUpdateField('heroBgUrl', e.target.value)}
                    placeholder="أو أدخل رابط صورة غلاف مخصصة..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY, FONT SIZES & COLORS */}
          {activeTab === 'styling' && (
            <div className="space-y-6">
              
              {/* FONT COLORS SECTION */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Palette size={16} />
                  <span> ألوان الخطوط والعناصر بالقالب:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Primary Accent Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">اللون الرئيسي والأزرار (Primary)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={content.primaryColor || '#008060'}
                        onChange={(e) => handleUpdateField('primaryColor', e.target.value)}
                        className="w-10 h-9 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={content.primaryColor || '#008060'}
                        onChange={(e) => handleUpdateField('primaryColor', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Heading Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">لون العناوين الرئيسية (Headings Color)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={content.headingColor || '#ffffff'}
                        onChange={(e) => handleUpdateField('headingColor', e.target.value)}
                        className="w-10 h-9 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={content.headingColor || '#ffffff'}
                        onChange={(e) => handleUpdateField('headingColor', e.target.value)}
                        placeholder="#ffffff"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Body Text Color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">لون الخط والفقرات (Body Text Color)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={content.bodyTextColor || '#e2e8f0'}
                        onChange={(e) => handleUpdateField('bodyTextColor', e.target.value)}
                        className="w-10 h-9 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={content.bodyTextColor || '#e2e8f0'}
                        onChange={(e) => handleUpdateField('bodyTextColor', e.target.value)}
                        placeholder="#e2e8f0"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Presets bar */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2">اختر طاقم ألوان جاهز للقالب:</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => handleUpdateField('primaryColor', preset.hex)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 border transition-all cursor-pointer ${
                          content.primaryColor === preset.hex ? 'border-white ring-2 ring-emerald-500' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* FONT SIZES & TYPOGRAPHY SECTION */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <Type size={16} />
                  <span>🔤 خط الصفحة وأحجام النصوص (Font Sizes & Family):</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">نوع الخط العربي (Font Family):</label>
                    <select
                      value={content.fontFamily || 'Cairo'}
                      onChange={(e) => handleUpdateField('fontFamily', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="Cairo">خط القاهرة (Cairo) - عصري وبارز</option>
                      <option value="Tajawal">خط تجول (Tajawal) - أنيق ومتناسق</option>
                      <option value="Almarai">خط المراعي (Almarai) - رسمي وواضح</option>
                      <option value="Amiri">خط أميري (Amiri) - كلاسيكي فاخر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">حجم عناوين القالب (Titles Font Size):</label>
                    <select
                      value={content.titleFontSize || 'medium'}
                      onChange={(e) => handleUpdateField('titleFontSize', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="small">صغير (28px)</option>
                      <option value="medium">متوسط متناسق (36px)</option>
                      <option value="large">كبير وبارز (48px)</option>
                      <option value="xlarge">ضخم جداً (64px)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5">حجم نصوص الفقرات (Body Font Size):</label>
                    <select
                      value={content.bodyFontSize || 'medium'}
                      onChange={(e) => handleUpdateField('bodyFontSize', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="small">صغير (13px)</option>
                      <option value="medium">قياسي (15px)</option>
                      <option value="large">كبير (18px)</option>
                      <option value="xlarge">ضخم (20px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SPACING */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">📐 النمط والتباعد بين الأقسام:</label>
                  <select
                    value={content.spacing || 'normal'}
                    onChange={(e) => handleUpdateField('spacing', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="normal">متوازن ومثالي (تلقائي)</option>
                    <option value="compact">مدمج ومتقارب (Compact)</option>
                    <option value="spacious">متباعد ومريح (Spacious)</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: IMAGES & BACKGROUNDS MANAGER */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <ImageIcon size={16} />
                  <span>🖼️ صورة الغلاف الرئيسية (Hero Background Image):</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  يمكنك رفع صورة غلاف من استوديو الجهاز/الهاتف مباشرة، أو اختيار صورة من المكتبة الجاهزة أدناه، أو اللصق رابط URL.
                </p>

                {/* Current Hero Background Preview & Input */}
                <div className="flex flex-col sm:flex-row gap-3 items-start bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {content.heroBgUrl || content.heroBg ? (
                    <img 
                      src={content.heroBgUrl || content.heroBg} 
                      alt="Hero Cover" 
                      className="w-28 h-20 object-cover rounded-xl border border-slate-700 shadow-md shrink-0" 
                    />
                  ) : (
                    <div className="w-28 h-20 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-[10px] shrink-0">
                      غلاف افتراضي
                    </div>
                  )}

                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-[11px] font-bold text-slate-300">رفع صورة غلاف من الجهاز/المعرض:</label>
                      <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all">
                        <Upload size={14} />
                        <span>اختر صورة من المعرض</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImageUpload(file, (url) => {
                              handleUpdateField('heroBgUrl', url);
                              handleUpdateField('heroBg', url);
                            });
                          }}
                        />
                      </label>
                    </div>

                    <label className="block text-[10px] font-bold text-slate-400">أو أدخل رابط صورة خارجي (URL):</label>
                    <input
                      type="text"
                      value={content.heroBgUrl || content.heroBg || ''}
                      onChange={(e) => {
                        handleUpdateField('heroBgUrl', e.target.value);
                        handleUpdateField('heroBg', e.target.value);
                      }}
                      placeholder="https://example.com/hero-image.jpg"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-left outline-none focus:border-emerald-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Categories of Stock Images */}
                <div className="space-y-4 pt-2">
                  <label className="block text-xs font-bold text-slate-200">أو اختر صورة غلاف فاخرة من المكتبة الجاهزة:</label>
                  {STOCK_HERO_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <span className="text-[11px] font-bold text-emerald-400 block">{cat.name}</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {cat.images.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              handleUpdateField('heroBgUrl', img);
                              handleUpdateField('heroBg', img);
                            }}
                            className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all cursor-pointer group ${
                              (content.heroBgUrl === img || content.heroBg === img) 
                                ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-[1.02]' 
                                : 'border-slate-800 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {(content.heroBgUrl === img || content.heroBg === img) && (
                              <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                                <span className="bg-emerald-500 text-white rounded-full p-1"><Check size={14} /></span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOGO & ABOUT SECTION IMAGES */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <ImageIcon size={16} />
                  <span>شعار النشاط (اللوجو) وصورة قسم "عن الشركة":</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300">الشعار أو اللوجو (Logo)</label>
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-700 transition-all">
                        <Upload size={13} />
                        <span>من المعرض</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImageUpload(file, (url) => {
                              handleUpdateField('logoUrl', url);
                              handleUpdateField('logo', url);
                            });
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={content.logoUrl !== undefined ? content.logoUrl : (content.logo || '')}
                      onChange={(e) => {
                        handleUpdateField('logoUrl', e.target.value);
                        handleUpdateField('logo', e.target.value);
                      }}
                      placeholder="رابط اللوجو أو رفعه مباشرة..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300">صورة قسم "من نحن / قصتنا"</label>
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-700 transition-all">
                        <Upload size={13} />
                        <span>من المعرض</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImageUpload(file, (url) => {
                              handleUpdateField('aboutImageUrl', url);
                              handleUpdateField('aboutImage', url);
                            });
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={content.aboutImageUrl || content.aboutImage || ''}
                      onChange={(e) => {
                        handleUpdateField('aboutImageUrl', e.target.value);
                        handleUpdateField('aboutImage', e.target.value);
                      }}
                      placeholder="رابط صورة من نحن أو رفعها مباشرة..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* ITEMS & PRODUCTS IMAGES QUICK EDIT */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <ListPlus size={16} />
                    <span>تغيير صور الأصناف والعقارات من المعرض ({itemsList.length}):</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('items')}
                    className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg hover:bg-emerald-500/20"
                  >
                    إدارة قائمة العناصر بالكامل ✏️
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {itemsList.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200'} 
                            alt={item.name || item.title} 
                            className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0" 
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{item.name || item.title || `عنصر ${idx + 1}`}</p>
                            <span className="text-[10px] text-emerald-400 font-bold">{item.price || item.category || ''}</span>
                          </div>
                        </div>

                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold p-2 rounded-lg border border-slate-700 shrink-0" title="رفع صورة من المعرض">
                          <Upload size={14} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleImageUpload(file, (url) => {
                                handleUpdateItem(idx, 'image', url);
                              });
                            }}
                          />
                        </label>
                      </div>

                      <input
                        type="text"
                        value={item.image || ''}
                        onChange={(e) => handleUpdateItem(idx, 'image', e.target.value)}
                        placeholder="رابط الصورة https://..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono text-left outline-none focus:border-emerald-500"
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3.5: SECTIONS MANAGER (HIDE / DELETE SECTIONS) */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2 mb-1">
                  <Layers size={16} />
                  <span>🧩 التحكم بأقسام القالب (حذف أو إخفاء أي قسم):</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  يمكنك تخصيص وحذف وإخفاء أي قسم لا تحتاجه في صفحة موقعك بنقرة زر واحدة فوراً.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. HERO SECTION */}
                <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  content.showHero !== false 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                }`}>
                  <div>
                    <h5 className="font-bold text-xs flex items-center gap-2">
                      <span> قسم الغلاف الرئيسي (Hero Header)</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">الصورة الرئيسية والعنوان الكبير وأزرار الطلب.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateField('showHero', content.showHero === false ? true : false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      content.showHero !== false 
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {content.showHero !== false ? (
                      <>
                        <Trash2 size={13} />
                        <span>حذف / إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>إعادة إظهار</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. ABOUT / PHILOSOPHY SECTION */}
                <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  (content.showAbout !== false && content.showFeatures !== false) 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                }`}>
                  <div>
                    <h5 className="font-bold text-xs flex items-center gap-2">
                      <span>📖 قسم "عن النشاط / قصتنا" (About)</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">نبذة عن المؤسسة أو المطعم والفلسفة والقصة.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const isShown = content.showAbout !== false && content.showFeatures !== false;
                      handleUpdateField('showAbout', !isShown);
                      handleUpdateField('showFeatures', !isShown);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      (content.showAbout !== false && content.showFeatures !== false)
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {(content.showAbout !== false && content.showFeatures !== false) ? (
                      <>
                        <Trash2 size={13} />
                        <span>حذف / إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>إعادة إظهار</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. MENU / PRODUCTS / ITEMS SECTION */}
                <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  (content.showMenu !== false && content.showProducts !== false && content.showGallery !== false && content.showServices !== false && content.showProperties !== false && content.showProjects !== false) 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                }`}>
                  <div>
                    <h5 className="font-bold text-xs flex items-center gap-2">
                      <span>
                        {isRestaurant && '🍽️ قسم الأطباق والمنيو (Menu)'}
                        {isRealEstate && '🏢 قسم العقارات والوحدات (Properties)'}
                        {isContractor && '🏗️ قسم الخدمات والمشاريع (Services)'}
                        {!isRestaurant && !isRealEstate && !isContractor && '📋 قسم المنتجات والخدمات'}
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">قسم عرض الأصناف مع الأسعار والصور.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const isShown = content.showMenu !== false && content.showProducts !== false && content.showGallery !== false && content.showServices !== false && content.showProperties !== false && content.showProjects !== false;
                      const newState = !isShown;
                      handleUpdateField('showMenu', newState);
                      handleUpdateField('showProducts', newState);
                      handleUpdateField('showGallery', newState);
                      handleUpdateField('showServices', newState);
                      handleUpdateField('showProperties', newState);
                      handleUpdateField('showProjects', newState);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      (content.showMenu !== false && content.showProducts !== false && content.showGallery !== false && content.showServices !== false && content.showProperties !== false && content.showProjects !== false)
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {(content.showMenu !== false && content.showProducts !== false && content.showGallery !== false && content.showServices !== false && content.showProperties !== false && content.showProjects !== false) ? (
                      <>
                        <Trash2 size={13} />
                        <span>حذف / إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>إعادة إظهار</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 4. STATS & FEATURES */}
                <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  content.showStats !== false 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                }`}>
                  <div>
                    <h5 className="font-bold text-xs flex items-center gap-2">
                      <span>📊 قسم الأرقام والإحصائيات (Stats)</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">أرقام النجاح والخبرة والمشاريع المنجزة.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateField('showStats', content.showStats === false ? true : false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      content.showStats !== false 
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {content.showStats !== false ? (
                      <>
                        <Trash2 size={13} />
                        <span>حذف / إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>إعادة إظهار</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 5. REVIEWS / TESTIMONIALS */}
                <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  content.showReviews !== false 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                }`}>
                  <div>
                    <h5 className="font-bold text-xs flex items-center gap-2">
                      <span>⭐ قسم آراء العملاء والتقييمات (Reviews)</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">تقييمات وتوصيات العملاء السابقين.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateField('showReviews', content.showReviews === false ? true : false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      content.showReviews !== false 
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {content.showReviews !== false ? (
                      <>
                        <Trash2 size={13} />
                        <span>حذف / إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>إعادة إظهار</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 6. CONTACT & LOCATION / FOOTER */}
                <div className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  content.showContact !== false 
                    ? 'bg-slate-900 border-slate-700 text-white' 
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                }`}>
                  <div>
                    <h5 className="font-bold text-xs flex items-center gap-2">
                      <span>📍 قسم التواصل والموقع والهامش (Contact & Footer)</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">معلومات الاتصال، الخريطة، والهامش السفلي.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateField('showContact', content.showContact === false ? true : false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      content.showContact !== false 
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    }`}
                  >
                    {content.showContact !== false ? (
                      <>
                        <Trash2 size={13} />
                        <span>حذف / إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>إعادة إظهار</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">📱 رقم الواتساب المباشر للطلبات (Direct WhatsApp) *</label>
                <input
                  type="text"
                  value={content.whatsappNumber !== undefined ? content.whatsappNumber : (content.whatsapp || '')}
                  onChange={(e) => {
                    handleUpdateField('whatsappNumber', e.target.value);
                    handleUpdateField('whatsapp', e.target.value);
                  }}
                  placeholder="مثال: 966500000000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                  dir="ltr"
                />
                <p className="text-[10px] text-slate-400 mt-1">تصل عليه جميع طلبات العملاء والاستفسارات المباشرة عبر الواتساب.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">📞 رقم الاتصال المباشر (Phone Call)</label>
                <input
                  type="text"
                  value={content.phoneNumber !== undefined ? content.phoneNumber : (content.phone || '')}
                  onChange={(e) => {
                    handleUpdateField('phoneNumber', e.target.value);
                    handleUpdateField('phone', e.target.value);
                  }}
                  placeholder="مثال: 0500000000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">📍 موقع أو عنوان الفرع الرئيسي (Address)</label>
                <input
                  type="text"
                  value={content.address !== undefined ? content.address : (content.location || '')}
                  onChange={(e) => {
                    handleUpdateField('address', e.target.value);
                    handleUpdateField('location', e.target.value);
                  }}
                  placeholder="مثال: طريق الملك فهد، حي الملقا، الرياض، المملكة العربية السعودية"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Added Links */}
              <div className="md:col-span-2 border-t border-slate-800 pt-4 mt-2 space-y-4">
                <h5 className="text-xs font-bold text-emerald-400">🔗 روابط الصفحات والسياسات (تظهر أسفل الموقع)</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1">نص سياسة الخصوصية (يفتح كصفحة)</label>
                    <textarea
                      rows={4}
                      value={content.privacyPolicyText || ''}
                      onChange={(e) => handleUpdateField('privacyPolicyText', e.target.value)}
                      placeholder="اكتب سياسة الخصوصية هنا..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium text-right"
                      dir="rtl"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1">نص شروط الخدمة (يفتح كصفحة)</label>
                    <textarea
                      rows={4}
                      value={content.termsText || ''}
                      onChange={(e) => handleUpdateField('termsText', e.target.value)}
                      placeholder="اكتب شروط الخدمة هنا..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-medium text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">رابط تطبيق iOS (App Store)</label>
                    <input
                      type="text"
                      value={content.iosAppUrl || ''}
                      onChange={(e) => handleUpdateField('iosAppUrl', e.target.value)}
                      placeholder="https://apps.apple.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">رابط تطبيق Android (Google Play)</label>
                    <input
                      type="text"
                      value={content.androidAppUrl || ''}
                      onChange={(e) => handleUpdateField('androidAppUrl', e.target.value)}
                      placeholder="https://play.google.com/..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ITEMS LIST EDITOR */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {isRestaurant && 'قائمة الأطباق والأصناف المتاحة'}
                    {isRealEstate && 'قائمة الوحدات والعقارات المعروضة'}
                    {isContractor && 'قائمة الخدمات والمشاريع المنفذة'}
                    {isBoutique && 'قائمة منتجات البوتيك والمتجر الإلكتروني'}
                    {isPerfume && 'قائمة العطور والمنتجات العطرية الفاخرة'}
                    {isElectronics && 'قائمة الإلكترونيات والأجهزة الذكية'}
                    {!isRestaurant && !isRealEstate && !isContractor && !isBoutique && !isPerfume && !isElectronics && 'قائمة العناصر والخدمات'}
                  </h4>
                  <p className="text-[11px] text-slate-400">يمكنك تعديل أي عنصر أو إضافة عناصر جديدة للقالب فوراً.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus size={16} />
                  <span>
                    {isBoutique && 'إضافة منتج جديد'}
                    {isPerfume && 'إضافة عطر جديد'}
                    {isElectronics && 'إضافة منتج إلكتروني'}
                    {!isBoutique && !isPerfume && !isElectronics && 'إضافة عنصر جديد'}
                  </span>
                </button>
              </div>

              {/* List of current items */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {itemsList.length === 0 ? (
                  <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
                    لا يوجد عناصر حالياً بالقالب. انقر على "إضافة عنصر جديد" للبدء.
                  </div>
                ) : (
                  itemsList.map((item: any, idx: number) => {
                    const isEditing = editingItemIndex === idx;
                    const itemTitle = item.name || item.title || `عنصر ${idx + 1}`;

                    return (
                      <div 
                        key={item.id || idx}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200'} 
                              alt="thumb" 
                              className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0" 
                            />
                            <div>
                              <h5 className="font-bold text-xs text-white">{itemTitle}</h5>
                              <p className="text-[11px] text-emerald-400 font-bold mt-0.5">{item.price || 'بدون سعر'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingItemIndex(isEditing ? null : idx)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            >
                              {isEditing ? 'إغلاق' : 'تعديل التفاصيل ✏️'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(idx)}
                              className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 p-2 rounded-lg transition-all"
                              title="حذف العنصر"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Item Form */}
                        {isEditing && (
                          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">الاسم / العنوان *</label>
                              <input
                                type="text"
                                value={item.name !== undefined ? item.name : (item.title || '')}
                                onChange={(e) => {
                                  handleUpdateItem(idx, 'name', e.target.value);
                                  handleUpdateItem(idx, 'title', e.target.value);
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">السعر (Price)</label>
                              <input
                                type="text"
                                value={item.price || ''}
                                onChange={(e) => handleUpdateItem(idx, 'price', e.target.value)}
                                placeholder="مثال: ١٢٠ ريال"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">التصنيف / القسم (Category)</label>
                              <input
                                type="text"
                                value={item.category || ''}
                                onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                                placeholder="مثال: الأطباق الرئيسية / فلل فاخرة"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] font-bold text-slate-400">صورة العنصر (Image)</label>
                                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700 transition-all">
                                  <Upload size={12} />
                                  <span>من المعرض</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      handleImageUpload(file, (url) => {
                                        handleUpdateItem(idx, 'image', url);
                                      });
                                    }}
                                  />
                                </label>
                              </div>
                              <input
                                type="text"
                                value={item.image || ''}
                                onChange={(e) => handleUpdateItem(idx, 'image', e.target.value)}
                                placeholder="رابط الصورة أو رفعها مباشرة..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                                dir="ltr"
                              />
                            </div>

                            {/* Restaurant Specific Fields */}
                            {isRestaurant && (
                              <div className="md:col-span-2 space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 mb-1">📝 وصف الطبق والمكونات (Description)</label>
                                  <textarea
                                    value={item.description || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                    placeholder="وصف مكونات الطبق..."
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1">⏱️ وقت التحضير</label>
                                    <input
                                      type="text"
                                      value={item.prepTime || ''}
                                      onChange={(e) => handleUpdateItem(idx, 'prepTime', e.target.value)}
                                      placeholder="مثال: 15 دقيقة"
                                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-400 mb-1">🔥 الشارة (Badge)</label>
                                    <input
                                      type="text"
                                      value={item.badge || ''}
                                      onChange={(e) => handleUpdateItem(idx, 'badge', e.target.value)}
                                      placeholder="مثال: الأكثر طلباً 🍔"
                                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Real Estate & Contractor Specific Fields */}
                            {(isRealEstate || isContractor) && (
                              <>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 mb-1">📍 الموقع / المدينة (Location)</label>
                                  <input
                                    type="text"
                                    value={item.location || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'location', e.target.value)}
                                    placeholder="مثال: حي الملقا، الرياض"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 mb-1">📐 المساحة (Area - م²)</label>
                                  <input
                                    type="text"
                                    value={item.area || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'area', e.target.value)}
                                    placeholder="مثال: 450"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                  />
                                </div>

                                {isRealEstate && (
                                  <>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-400 mb-1">🛏️ عدد غرف النوم (Beds)</label>
                                      <input
                                        type="number"
                                        value={item.beds || ''}
                                        onChange={(e) => handleUpdateItem(idx, 'beds', parseInt(e.target.value) || 0)}
                                        placeholder="مثال: 4"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-400 mb-1">🚿 عدد الحمامات (Baths)</label>
                                      <input
                                        type="number"
                                        value={item.baths || ''}
                                        onChange={(e) => handleUpdateItem(idx, 'baths', parseInt(e.target.value) || 0)}
                                        placeholder="مثال: 5"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                      />
                                    </div>
                                  </>
                                )}
                              </>
                            )}

                            {/* Perfume Specific Fields */}
                            {isPerfume && (
                              <div className="md:col-span-2 space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 mb-1">📝 وصف العطر والمكونات (Description)</label>
                                  <textarea
                                    value={item.description || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                    placeholder="مثال: نفحات خشبية مع العود والمسك لثبات يدوم طويلاً"
                                    rows={2}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">🏺 أحجام وعبوات العطر (مثل 50ml, 100ml مفصولة بفواصل)</label>
                                  <input
                                    type="text"
                                    value={Array.isArray(item.sizes) ? item.sizes.join(', ') : (item.sizes || '50ml, 100ml')}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
                                      handleUpdateItem(idx, 'sizes', arr);
                                    }}
                                    placeholder="50ml, 100ml, 200ml"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Boutique Specific Fields */}
                            {isBoutique && (
                              <div className="md:col-span-2 space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 mb-1">📝 وصف المنتج والمميزات (Description)</label>
                                  <textarea
                                    value={item.description || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                    placeholder="مثال: تصميم راقي ومريح يناسب جميع الإطلالات اليومية"
                                    rows={2}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">👕 المقاسات المتاحة (مثل S, M, L, XL مفصولة بفواصل)</label>
                                  <input
                                    type="text"
                                    value={Array.isArray(item.sizes) ? item.sizes.join(', ') : (item.sizes || 'S, M, L, XL')}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
                                      handleUpdateItem(idx, 'sizes', arr);
                                    }}
                                    placeholder="S, M, L, XL"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Electronics Specific Fields */}
                            {isElectronics && (
                              <div className="md:col-span-2 space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 mb-1">📝 المواصفات التقنية والضمان (Description)</label>
                                  <textarea
                                    value={item.description || ''}
                                    onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                    placeholder="مثال: معالج فائق الأداء، ضمان وكيل معتمد لمدة سنتين"
                                    rows={2}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">💾 السعات أو خيارات الإصدار (مثل 256GB, 512GB, 1TB)</label>
                                  <input
                                    type="text"
                                    value={Array.isArray(item.sizes) ? item.sizes.join(', ') : (item.sizes || '256GB, 512GB, 1TB')}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
                                      handleUpdateItem(idx, 'sizes', arr);
                                    }}
                                    placeholder="128GB, 256GB, 512GB"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                                    dir="ltr"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-amber-400 mb-1">🎨 الألوان المتاحة (مثل أسود، فضي مفصولة بفواصل)</label>
                                  <input
                                    type="text"
                                    value={Array.isArray(item.colors) ? item.colors.join('، ') : (item.colors || 'أسود، فضي')}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const arr = raw.split(/[،,]/).map(s => s.trim()).filter(Boolean);
                                      handleUpdateItem(idx, 'colors', arr);
                                    }}
                                    placeholder="أسود، فضي، ذهبي"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 text-right"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Multi-Image Gallery Input */}
                            <div className="md:col-span-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-emerald-400">📸 معرض صور العقار / المشروع (معرض صور متعدد)</label>
                                <label className="cursor-pointer bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/30 transition-all">
                                  <Upload size={12} />
                                  <span>إضافة صورة للمعرض</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      handleImageUpload(file, (url) => {
                                        const currentGallery = Array.isArray(item.images) ? [...item.images] : (item.image ? [item.image] : []);
                                        const newGallery = [...currentGallery, url];
                                        handleUpdateItem(idx, 'images', newGallery);
                                        if (!item.image) handleUpdateItem(idx, 'image', url);
                                      });
                                    }}
                                  />
                                </label>
                              </div>

                              <p className="text-[10px] text-slate-400">يمكنك وضع عدة روابط صور تفصل بينها فاصلة (,) أو استخدام زر الإضافة بالأعلى لتصفح صور العقار يمين ويسار:</p>

                              <input
                                type="text"
                                value={Array.isArray(item.images) ? item.images.join(', ') : (item.images || item.image || '')}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
                                  handleUpdateItem(idx, 'images', arr);
                                  if (arr.length > 0 && !item.image) {
                                    handleUpdateItem(idx, 'image', arr[0]);
                                  }
                                }}
                                placeholder="رابط صورة 1, رابط صورة 2, رابط صورة 3..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                                dir="ltr"
                              />

                              {/* Gallery Thumbnails Preview */}
                              {((Array.isArray(item.images) && item.images.length > 0) || item.image) && (
                                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                  {(Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image]).map((imgUrl: string, imgIdx: number) => (
                                    <div key={imgIdx} className="relative group shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-700">
                                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const currentArr = Array.isArray(item.images) ? [...item.images] : [item.image];
                                          const filtered = currentArr.filter((_, i) => i !== imgIdx);
                                          handleUpdateItem(idx, 'images', filtered);
                                          if (filtered.length > 0) handleUpdateItem(idx, 'image', filtered[0]);
                                        }}
                                        className="absolute inset-0 bg-rose-950/80 text-rose-300 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-400 mb-1">الوصف التفصيلي والمواصفات الكاملة (Description & Specs)</label>
                              <textarea
                                value={item.description || ''}
                                onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                placeholder="اكتب التفاصيل والمواصفات الكاملة للعقار أو المشروع هنا..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 min-h-[70px]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: OPTIONS */}
          {activeTab === 'options' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">إيقاف استقبال الطلبات والمبيعات مؤقتاً</h4>
                  <p className="text-[11px] text-slate-400">عند تفعيله، يتم عرض القائمة أو الخدمات للعرض فقط دون خيار إضافة للطلب.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!content.disableOrdering}
                  onChange={(e) => handleUpdateField('disableOrdering', e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">إيقاف خدمة التوصيل مؤقتاً</h4>
                  <p className="text-[11px] text-slate-400">يظهر تنبيه للعميل أن الطلبات متوفرة فقط للاستلام من الفرع.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!content.disableDelivery}
                  onChange={(e) => handleUpdateField('disableDelivery', e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Editor Plans Selection Modal */}
      {isEditorPlansModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">باقاتنا الجديدة والاشتراكات</span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">تفعيل قوالب وتعديلات متجرك</h3>
                <p className="text-xs text-slate-400 mt-0.5">تم تحديد الباقة التي اخترتها قبل دخول المعاينة تلقائياً 🌟</p>
              </div>
              <button 
                onClick={() => setIsEditorPlansModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {getSubscriptionPlans().map((plan, idx) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div key={`drawer-plan-${plan.id}-${idx}`} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20' : plan.popular ? 'bg-blue-950/40 border-blue-500/50 shadow-lg ring-2 ring-blue-500/20' : 'bg-slate-950 border-slate-800'}`}>
                    {isSelected && (
                      <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow">
                        الباقة المختارة تلقائياً 🌟
                      </span>
                    )}
                    <div className="space-y-3">
                      {plan.popular && !isSelected && <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الأكثر طلباً واحترافية</span>}
                      <h4 className="font-black text-white text-sm sm:text-base">{plan.name}</h4>
                      <div className="text-xl font-black text-blue-400">{plan.price} <span className="text-xs font-medium text-slate-400">/ {plan.duration}</span></div>
                      <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                        {plan.features.map((f, i) => (
                          <li key={`drawer-feat-${plan.id}-${i}`} className="flex items-center gap-2">
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
                        setIsEditorPlansModalOpen(false);
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
        tenantName={content.siteName || content.businessName || (isBoutique ? 'بوتيك الأزياء الراقية' : isElectronics ? 'متجر الأجهزة الإلكترونية' : 'موقعي الخاص')}
        planName={getPlanTitleById(selectedPlanId)}
        amount={getPlanAmountById(selectedPlanId)}
        templateId={templateId}
        onSuccess={(details) => {
          const isTrial = selectedPlanId === 'starter';
          const endDate = isTrial 
            ? new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
          const subObj = {
            plan: details.plan || selectedPlanId,
            type: isTrial ? 'free_trial_3days' : 'yearly',
            price: details.price || getPlanAmountById(selectedPlanId),
            startDate: new Date().toISOString(),
            endDate,
            status: 'active'
          };
          localStorage.setItem('app_subscription', JSON.stringify(subObj));
          setToast(isTrial 
            ? '✨ تم تفعيل التجربة المجانية (3 أيام) بنجاح. ستنتهي تلقائياً بعد 3 أيام.'
            : `تم الدفع بنجاح عبر ${details.provider}! تم تفعيل الاشتراك والتعديلات الحالية. جاري الانتقال للقائمة الرئيسية... 🎉`
          );
          setTimeout(() => {
            setToast('');
            if (onSubscribeSuccess) {
              onSubscribeSuccess();
            }
          }, 2500);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 z-50 animate-bounce border border-emerald-500/50">
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default TemplateLiveEditorDrawer;
