import React, { useEffect, useState } from 'react';
import { auth, logout, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  LayoutDashboard, 
  PenTool, 
  Settings, 
  LogOut, 
  ExternalLink, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  MessageCircle, 
  User,
    
  Phone, 
  Mail, 
  FileText, 
  Layers, 
  Globe,
  X,
  XCircle,
  Check,
  Bell,
  Upload,
  Users,
  UserPlus,
  Shield,
  Sparkles,
  CreditCard,
  Utensils,
  Truck,
  Zap,
  Clock,
  Home,
  Building,
  Activity,
  Tag,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { QRCodeModal } from '../components/QRCodeModal';
import CouponsAndShippingManager from '../components/dashboards/managers/CouponsAndShippingManager';
import TemplateRenderer from '../components/TemplateRenderer';
import ShopifyThemeEditor from '../components/ShopifyThemeEditor';
import TemplateLiveEditorDrawer from '../components/TemplateLiveEditorDrawer';
import OrderSystem from '../components/OrderSystem';
import CmsManager from '../components/CmsManager';
import AuditLogsViewer from '../components/AuditLogsViewer';
import PaymentCheckoutModal from '../components/PaymentCheckoutModal';
import { getPlanTitleById, getPlanAmountById } from '../lib/subscriptionPlans';
import DashboardTemplateRegistry from '../components/dashboards/DashboardTemplateRegistry';
import OrdersTab from '../components/dashboards/tabs/OrdersTab';
import CustomersTab from '../components/dashboards/tabs/CustomersTab';
import SupportTicketsTab from '../components/dashboards/tabs/SupportTicketsTab';
import ContentTab from '../components/dashboards/tabs/ContentTab';
import StaffTab from '../components/dashboards/tabs/StaffTab';
import SettingsTab from '../components/dashboards/tabs/SettingsTab';
import CouriersTab from '../components/dashboards/tabs/CouriersTab';
import { getDefaultItemsForTemplate, getDefaultHeroForTemplate, migrateContentOnTemplateSwitch } from '../lib/defaultData';

import DentalClinicManager from '../components/dashboards/managers/DentalClinicManager';
import ElectronicStoreManager from '../components/dashboards/managers/ElectronicStoreManager';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [content, setContent] = useState<any>({});
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);

  const ALL_TEMPLATES = [
    { id: 1, name: 'مطعم فاخر وإيطالي', icon: '🍽️', category: 'مطاعم وكافيهات' },
    { id: 2, name: 'مطعم مشويات وستيك', icon: '🥩', category: 'مطاعم وكافيهات' },
    { id: 3, name: 'وجبات سريعة وبرجر', icon: '🍔', category: 'مطاعم وكافيهات' },
    { id: 4, name: 'كافيه هادئ وروقان', icon: '☕', category: 'مطاعم وكافيهات' },
    { id: 5, name: 'قهوة مختصة ومحمصة', icon: '☕🌱', category: 'مطاعم وكافيهات' },
    { id: 6, name: 'مخبز وحلويات فرنسية', icon: '🥐🍰', category: 'مطاعم وكافيهات' },
    { id: 7, name: 'معرض الفلل والقصور', icon: '🏰💎', category: 'عقارات ومقاولات' },
    { id: 8, name: 'شقق ومجمعات سكنية', icon: '🏢🔑', category: 'عقارات ومقاولات' },
    { id: 9, name: 'مكاتب ومحلات تجارية', icon: '🏬✨', category: 'عقارات ومقاولات' },
    { id: 10, name: 'شركات مقاولات وبناء', icon: '🏗️🧱', category: 'عقارات ومقاولات' },
    { id: 11, name: 'تصميم معماري وديكور', icon: '📐🎨', category: 'عقارات ومقاولات' },
    { id: 12, name: 'ترميم وتجديد منازل', icon: '🛠️🏡', category: 'عقارات ومقاولات' },
    { id: 13, name: 'متجر أزياء فاخرة وبوتيك', icon: '👗✨', category: 'متاجر إلكترونية' },
    { id: 14, name: 'متجر أجهزة إلكترونية وتقنية', icon: '📱💻', category: 'متاجر إلكترونية' },
    { id: 15, name: 'متجر عناية بالبشرة وتجميل', icon: '🌸✨', category: 'متاجر إلكترونية' },
  ];
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState('');
  const [userStatus, setUserStatus] = useState<string>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ idOrIndex: number | string | null }>({ idOrIndex: null });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState<any>({});
  
  // Custom Categories, Dynamic Sizes & Colors for E-commerce / Boutique
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'الهواتف الذكية', 'الحواسيب', 'الصوتيات', 'الألعاب', 'الكاميرات', 'المنزل الذكي', 'الساعات الذكية', 'الملحقات', 'فساتين', 'عبايات', 'أطقم كاجوال', 'حقائب', 'أحذية', 'عطور ومكياج', 'إكسسوارات', 'ملابس سهرة'
  ]);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');

  const [customSizesList, setCustomSizesList] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState<string>('');

  const [colorsList, setColorsList] = useState<string[]>([
    'أسود', 'فضي', 'رمادي', 'أبيض', 'أزرق', 'أحمر', 'ذهبي', 'كحلي', 'عنابي', 'بيج', 'أوف وايت', 'زيتي', 'وردي', 'كافيه', 'تيفاني'
  ]);
  const [customColorInput, setCustomColorInput] = useState<string>('');
  
  // Real orders from database
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSubTab, setOrderSubTab] = useState<'active' | 'completed'>('active');

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isSubscriptionInactive, setIsSubscriptionInactive] = useState(false);
  const [onboardData, setOnboardData] = useState({ tenantName: '', subdomain: '' });
  const [onboardingError, setOnboardingError] = useState('');

  const [forcedNotification, setForcedNotification] = useState<any>(null);

  // Multi-site and image read states
  const [userSites, setUserSites] = useState<any[]>([]);
  const [showSiteSwitcherModal, setShowSiteSwitcherModal] = useState<boolean>(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState<boolean>(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState<boolean>(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('staff');
  const [currentUserPermissions, setCurrentUserPermissions] = useState<string>('');
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const searchParams = new URLSearchParams(window.location.search);
  const impersonateTenantId = searchParams.get('impersonateTenantId');
  const isOwnerOrAdmin = auth.currentUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com' || impersonateTenantId !== null || currentUserRole === 'admin' || currentUserRole === 'super_admin' || currentUserRole === 'manager' || currentUserRole === 'staff';
  const isTrueOwner = auth.currentUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';

  // 1. Sanitize Inputs
  const roleStr = String(currentUserRole || '').toLowerCase().trim();
  const permsStr = String(currentUserPermissions || '').toLowerCase().trim();

  // 2. Strict Access Control (Prevent null/undefined bypass)
  const currentUserEmail = auth.currentUser?.email?.toLowerCase().trim();
  const tenantAssignedEmail = tenant?.assignedUserEmail?.toLowerCase().trim();
  const isEmailMatch = Boolean(currentUserEmail && tenantAssignedEmail && currentUserEmail === tenantAssignedEmail);
  const isUserIdMatch = Boolean(tenant?.userId && currentUserId && Number(tenant.userId) === Number(currentUserId));
  const isActualOwner = Boolean(
    isTrueOwner ||
    isUserIdMatch ||
    isEmailMatch ||
    roleStr === 'tenant_admin' ||
    roleStr === 'owner' ||
    roleStr === 'super_admin' ||
    roleStr === 'admin'
  );

  // 3. Restrict Admin bypass (Strict exact matching)
  const hasFullAccess = Boolean(isActualOwner || roleStr === 'super_admin' || roleStr === 'admin' || permsStr === 'all' || permsStr === 'full_access');

  // 4. Strict explicit module checks
  const canSeeDashboard = hasFullAccess || permsStr.includes('dashboard') || permsStr.includes('home');
  const canSeeOrders = hasFullAccess || permsStr.includes('orders');
  const canSeeContent = hasFullAccess || permsStr.includes('content') || permsStr.includes('catalog');
  const canSeeCouriers = hasFullAccess || permsStr.includes('couriers');
  const currentTplId = Number(previewTemplateId !== null ? previewTemplateId : (templateId !== null && templateId !== undefined ? templateId : 13));
  const isStoreTemplate = currentTplId === 13 || currentTplId === 14 || currentTplId === 15;
  const canSeeSupport = (hasFullAccess || permsStr.includes('support')) && isStoreTemplate;
  const canSeeCustomers = hasFullAccess || permsStr.includes('customers');
  const canSeeSettings = hasFullAccess || permsStr.includes('settings');
  const canSeeCoupons = hasFullAccess || permsStr.includes('coupons') || permsStr.includes('discounts') || canSeeSettings || canSeeContent;
  const canSeeStaff = hasFullAccess || permsStr.includes('staff') || permsStr.includes('users');
  const canSeeCms = hasFullAccess || permsStr.includes('cms');
  const canSeeAudit = hasFullAccess || permsStr.includes('audit');

  // 5. SECURITY AUDIT LOG - DO NOT REMOVE
  console.log("🔒 RBAC SECURITY AUDIT:", { roleStr, permsStr, isActualOwner, hasFullAccess, currentUserId });

  const isCurrentTabAllowed = 
    (activeTab === 'dashboard' && canSeeDashboard) ||
    (activeTab === 'orders' && canSeeOrders) ||
    (activeTab === 'content' && canSeeContent) ||
    (activeTab === 'coupons' && canSeeCoupons) ||
    (activeTab === 'couriers' && canSeeCouriers) ||
    (activeTab === 'support' && canSeeSupport) ||
    (activeTab === 'customers' && canSeeCustomers) ||
    (activeTab === 'settings' && canSeeSettings) ||
    (activeTab === 'staff' && canSeeStaff) ||
    (activeTab === 'cms' && canSeeCms) ||
    (activeTab === 'audit' && canSeeAudit);

  const safeSetActiveTab = (tab: string) => {
    let isAllowed = false;
    if (tab === 'dashboard') isAllowed = canSeeDashboard;
    else if (tab === 'orders') isAllowed = canSeeOrders;
    else if (tab === 'content') isAllowed = canSeeContent;
    else if (tab === 'coupons') isAllowed = canSeeCoupons;
    else if (tab === 'couriers') isAllowed = canSeeCouriers;
    else if (tab === 'support') isAllowed = canSeeSupport;
    else if (tab === 'customers') isAllowed = canSeeCustomers;
    else if (tab === 'settings') isAllowed = canSeeSettings;
    else if (tab === 'staff') isAllowed = canSeeStaff;
    else if (tab === 'cms') isAllowed = canSeeCms;
    else if (tab === 'audit') isAllowed = canSeeAudit;
    else isAllowed = hasFullAccess;

    if (!isAllowed) {
      showToast('⛔ غير مصرح لك بالوصول لهذا القسم!');
      alert('⛔ غير مصرح لك بالوصول لهذا القسم! تم تقييد وصول الموظف من قبل صاحب المتجر.');
      return;
    }
    setActiveTab(tab);
    setIsMobileMenuExpanded(false);
  };

  const fetchUserSites = async (token: string) => {
    try {
      const url = impersonateTenantId 
        ? `/api/tenant/my-sites?impersonateTenantId=${impersonateTenantId}` 
        : '/api/tenant/my-sites';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sites) {
          setUserSites(data.sites);
        }
      }
    } catch (e) {
      console.error('Error fetching user sites:', e);
    }
  };

  const handleImageFileRead = (e: React.ChangeEvent<HTMLInputElement>, onRead: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onRead(event.target.result as string);
        showToast('تم رفع واختيار الصورة بنجاح 📷');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleImagesFileRead = (e: React.ChangeEvent<HTMLInputElement>, onRead: (urls: string[]) => void) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    const newUrls: string[] = [];
    let processed = 0;
    files.forEach((file: File) => {
      if (file.size > 8 * 1024 * 1024) {
        alert(`الصورة ${file.name} حجمها كبير جداً، يرجى اختيار صور أقل من 8 ميجابايت.`);
        processed++;
        if (processed === files.length && newUrls.length > 0) onRead(newUrls);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newUrls.push(reader.result);
        }
        processed++;
        if (processed === files.length) {
          onRead(newUrls);
          showToast(`تم رفع ${newUrls.length} صور للمعرض بنجاح 📷✨`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
      } else {
        await checkStatusAndFetchData(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Staff Management States
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('staff');
  const [newStaffPermissions, setNewStaffPermissions] = useState('orders_only');
  const [addingStaffLoading, setAddingStaffLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchAnalytics();
    }
    if (activeTab === 'orders') {
      fetchOrders();
    }
    if (activeTab === 'staff') {
      fetchStaff();
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentUserRole === 'staff' || (!hasFullAccess && currentUserRole !== 'super_admin' && !isTrueOwner)) {
      const isTabAllowed = 
        (activeTab === 'dashboard' && canSeeDashboard) ||
        (activeTab === 'orders' && canSeeOrders) ||
        (activeTab === 'content' && canSeeContent) ||
        (activeTab === 'couriers' && canSeeCouriers) ||
        (activeTab === 'support' && canSeeSupport) ||
        (activeTab === 'customers' && canSeeCustomers) ||
        (activeTab === 'settings' && canSeeSettings) ||
        (activeTab === 'staff' && canSeeStaff) ||
        (activeTab === 'cms' && canSeeCms) ||
        (activeTab === 'audit' && canSeeAudit);

      if (!isTabAllowed) {
        if (canSeeDashboard) setActiveTab('dashboard');
        else if (canSeeOrders) setActiveTab('orders');
        else if (canSeeContent) setActiveTab('content');
        else if (canSeeCouriers) setActiveTab('couriers');
        else if (canSeeCustomers) setActiveTab('customers');
        else if (canSeeSupport) setActiveTab('support');
        else if (canSeeSettings) setActiveTab('settings');
        else if (canSeeStaff) setActiveTab('staff');
        else if (canSeeCms) setActiveTab('cms');
        else if (canSeeAudit) setActiveTab('audit');
      }
    }
  }, [activeTab, currentUserRole, hasFullAccess, canSeeDashboard, canSeeOrders, canSeeContent, canSeeCouriers, canSeeSupport, canSeeCustomers, canSeeSettings, canSeeStaff, canSeeCms, canSeeAudit]);

  const fetchStaff = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const headers: any = { 'Authorization': `Bearer ${token}` };
      if (impersonateTenantId) headers['x-impersonate-tenant-id'] = impersonateTenantId;
      const url = impersonateTenantId ? `/api/tenant/staff?impersonateTenantId=${impersonateTenantId}` : '/api/tenant/staff';
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (e) {
      console.error('Fetch staff error:', e);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail) return;
    setAddingStaffLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const headers: any = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (impersonateTenantId) headers['x-impersonate-tenant-id'] = impersonateTenantId;

      const res = await fetch('/api/tenant/staff', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: newStaffEmail,
          name: newStaffName,
          role: newStaffRole,
          permissions: newStaffPermissions,
          impersonateTenantId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('تمت إضافة/دعوة الموظف بنجاح 🎉');
        setIsAddStaffModalOpen(false);
        setNewStaffEmail('');
        setNewStaffName('');
        setNewStaffRole('staff');
        setNewStaffPermissions('all');
        fetchStaff();
      } else {
        alert(data.error || 'حدث خطأ أثناء إضافة الموظف');
      }
    } catch (err) {
      console.error('Add staff error:', err);
      alert('حدث خطأ بالاتصال بالسيرفر');
    } finally {
      setAddingStaffLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!confirm('هل أنت تأكد من إزالة هذا الموظف من المتجر؟')) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const headers: any = { 'Authorization': `Bearer ${token}` };
      if (impersonateTenantId) headers['x-impersonate-tenant-id'] = impersonateTenantId;
      const url = impersonateTenantId ? `/api/tenant/staff/${staffId}?impersonateTenantId=${impersonateTenantId}` : `/api/tenant/staff/${staffId}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        showToast('تمت إزالة الموظف بنجاح');
        fetchStaff();
      } else {
        alert('فشلت إزالة الموظف');
      }
    } catch (e) {
      console.error('Delete staff error:', e);
    }
  };

  const checkNotifications = async (token: string, impId?: string | null) => {
    try {
      const url = impId ? `/api/tenant/notifications?impersonateTenantId=${impId}` : '/api/tenant/notifications';
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) } });
      if (res.ok) {
        const data = await res.json();
        // Ignore order, appointment, support ticket notifications from being treated as blocking modal alerts
        const unreadRequired = (data.notifications || []).find((n: any) => {
          if (n.isRead !== 0 || n.isRequired !== 1) return false;
          const title = (n.title || '').toLowerCase();
          const message = (n.message || '').toLowerCase();
          if (
            title.includes('طلب جديد') || title.includes('حجز') || title.includes('موعد') || title.includes('مساعدة') || title.includes('رسالة') || title.includes('order') ||
            message.includes('طلب جديد') || message.includes('حجز') || message.includes('موعد')
          ) {
            return false;
          }
          return true;
        });
        if (unreadRequired) {
          setForcedNotification(unreadRequired);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledgeNotification = async () => {
    if (!forcedNotification) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const url = impersonateTenantId 
        ? `/api/tenant/notifications/${forcedNotification.id}/read?impersonateTenantId=${impersonateTenantId}` 
        : `/api/tenant/notifications/${forcedNotification.id}/read`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      setForcedNotification(null);
      showToast('تمت الموافقة وقراءة التنبيه الإجباري بنجاح');
    } catch (e) {
      console.error(e);
      setForcedNotification(null);
    }
  };

  const handleRestoreOriginalImage = (itemId: number, index: number) => {
    const defaults = getDefaultItemsForTemplate(templateId || 1);
    const defaultItem = defaults.find((d: any) => d.id === itemId) || defaults[index % defaults.length];
    if (defaultItem && defaultItem.image) {
      handleUpdateItem(itemId, 'image', defaultItem.image);
      showToast('تم استعادة صورة القالب الأصلية بنجاح');
    }
  };

  const handleRestoreOriginalHeroImage = () => {
    const defaultHero = getDefaultHeroForTemplate(templateId || 1);
    setContent({
      ...content,
      heroImage: defaultHero,
      heroBgUrl: defaultHero
    });
    showToast('تم استعادة خلفية البانر الرئيسية الأصلية للقالب بنجاح');
  };

  const fetchAnalytics = async (authToken?: string) => {
    setLoadingAnalytics(true);
    try {
      const token = authToken || await auth.currentUser?.getIdToken();
      if (!token) return;
      const url = impersonateTenantId ? `/api/tenant/analytics?impersonateTenantId=${impersonateTenantId}` : '/api/tenant/analytics';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.warn('Notice fetching analytics:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const checkStatusAndFetchData = async (user: any) => {
    try {
      const token = await user.getIdToken();

      // Trigger and await backend database sync
      await fetch('/api/user/ping', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      }).catch((err) => {
        console.error("SYNC_ERROR:", err);
      });

      // Check user status
      const authRes = await fetch('/api/me/status', {
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      const authData = await authRes.json();
      setUserStatus(authData.status);
      if (authData.status === 'banned') {
        alert('تم إيقاف حسابك من قبل الإدارة.');
        await logout();
        navigate('/');
        return;
      }
      
      const tenantUrl = impersonateTenantId ? `/api/tenant?impersonateTenantId=${impersonateTenantId}` : '/api/tenant';
      const res = await fetch(tenantUrl, {
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || { role: data.role, permissions: data.permissions, id: data.id };
        if (userObj && userObj.id) {
          setCurrentUserId(userObj.id);
        }
        const userEmailClean = auth.currentUser?.email?.toLowerCase().trim();
        const isAssignedEmail = Boolean(data.tenant && userEmailClean && data.tenant.assignedUserEmail?.toLowerCase().trim() === userEmailClean);
        const isStoreOwnerUser = isTrueOwner || impersonateTenantId !== null || (data.tenant && userObj && data.tenant.userId === userObj.id) || isAssignedEmail || userObj.role === 'super_admin' || userObj.role === 'admin' || userObj.role === 'tenant_admin' || userObj.role === 'owner';
        
        const role = userObj.role || (isStoreOwnerUser ? 'tenant_admin' : 'staff');
        const perms = userObj.permissions !== undefined && userObj.permissions !== null
          ? userObj.permissions
          : (isStoreOwnerUser ? 'all' : 'none');

        setCurrentUserRole(role);
        setCurrentUserPermissions(perms);

        const pLower = (perms || '').toLowerCase();
        const isFull = isStoreOwnerUser || pLower === 'all' || pLower.includes('all');
        if (!isFull) {
          if (pLower.includes('orders') || pLower.includes('orders_only')) setActiveTab('orders');
          else if (pLower.includes('content') || pLower.includes('content_only')) setActiveTab('content');
          else if (pLower.includes('couriers')) setActiveTab('couriers');
          else if (pLower.includes('customers')) setActiveTab('customers');
          else if (pLower.includes('support')) setActiveTab('support');
          else if (pLower.includes('settings') || pLower.includes('settings_only')) setActiveTab('settings');
          else if (pLower.includes('staff')) setActiveTab('staff');
          else if (pLower.includes('cms')) setActiveTab('cms');
          else if (pLower.includes('audit')) setActiveTab('audit');
        }
        if (data.tenant) {
          setTenant(data.tenant);
          setSubscription(data.subscription);
          
          let currentTplId = data.templateId ? Number(data.templateId) : null;
          // Clean up any stale selectedTemplateId in localStorage so it never overrides an existing active tenant template on refresh
          localStorage.removeItem('selectedTemplateId');
          setTemplateId(currentTplId);
          
          let tenantContent = data.content || {};
          if (!tenantContent.items) {
            tenantContent.items = [];
          }
          setContent(tenantContent);
          
          // Fetch orders, analytics and user sites
          await fetchOrders(token);
          await fetchAnalytics(token);
          await checkNotifications(token, impersonateTenantId);
          await fetchUserSites(token);
        } else {
          if (data.error === 'Subscription inactive') {
            setIsSubscriptionInactive(true);
          } else {
            setIsOnboarding(true);
          }
        }
      } else {
        if (res.status === 403) {
          setIsSubscriptionInactive(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (authToken?: string) => {
    try {
      const token = authToken || await auth.currentUser?.getIdToken();
      if (!token) return;
      const url = impersonateTenantId 
        ? `/api/tenant/orders?includeDeleted=true&impersonateTenantId=${impersonateTenantId}` 
        : '/api/tenant/orders?includeDeleted=true';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort orders by id descending
        const sorted = (data.orders || []).sort((a: any, b: any) => b.id - a.id);
        setOrders(prev => {
          if (prev.length > 0 && sorted.length > prev.length) {
            const diff = sorted.length - prev.length;
            showToast(`وصل ${diff === 1 ? 'طلب جديد 🛍️' : `${diff} طلبات جديدة 🛍️`}`);
          }
          return sorted;
        });
      }
    } catch (e) {
      console.warn('Notice fetching orders:', e);
    }
  };

  // Real-time polling for orders and notifications every 6 seconds
  useEffect(() => {
    if (!tenant || loading) return;
    const interval = setInterval(() => {
      fetchOrders();
      auth.currentUser?.getIdToken().then(tok => {
        if (tok) checkNotifications(tok, impersonateTenantId);
      }).catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, [tenant?.id, impersonateTenantId, loading]);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string, details?: any) => {
    const targetOrder = orders.find(o => Number(o.id) === Number(orderId));
    const isCompleted = newStatus === 'completed' || newStatus === 'مكتمل' || newStatus === 'تم التسليم';

    let updatedContent = { ...content };
    const skipAdminStockDeduction = false;
    if (isCompleted && targetOrder && !(targetOrder.details as any)?.stockDeducted && !skipAdminStockDeduction) {
      const orderItems = targetOrder.items || targetOrder.details?.items || [];
      const prodList = updatedContent.items || updatedContent.products || [];
      if (orderItems.length > 0 && prodList.length > 0) {
        const updatedItems = prodList.map((prod: any) => {
          const matchingCartItems = orderItems.filter((ci: any) => String(ci.id || ci.product?.id) === String(prod.id) || ci.title === prod.title || ci.name === prod.title);
          if (matchingCartItems.length === 0) return prod;

          let totalQtyDeducted = 0;
          const newSizeStocks = { ...(prod.sizeStocks || {}) };
          const newColorStocks = { ...(prod.colorStocks || {}) };
          const newStorageStocks = { ...(prod.storageStocks || {}) };

          matchingCartItems.forEach((ci: any) => {
            const qty = ci.quantity || 1;
            totalQtyDeducted += qty;
            
            const storageKey = ci.selectedStorage || ci.storage || ci.selectedSize || ci.size;
            if (storageKey && storageKey !== 'قياسي') {
              if (newStorageStocks[storageKey] !== undefined) {
                newStorageStocks[storageKey] = Math.max(0, Number(newStorageStocks[storageKey]) - qty).toString();
              }
              if (newSizeStocks[storageKey] !== undefined) {
                newSizeStocks[storageKey] = Math.max(0, Number(newSizeStocks[storageKey]) - qty).toString();
              }
            }

            const colorKey = ci.selectedColor || ci.color;
            if (colorKey && colorKey !== 'افتراضي') {
              if (newColorStocks[colorKey] !== undefined) {
                newColorStocks[colorKey] = Math.max(0, Number(newColorStocks[colorKey]) - qty).toString();
              }
            }
          });

          const currentStock = prod.stock !== undefined ? Number(prod.stock) : 25;
          const finalStock = Math.max(0, currentStock - totalQtyDeducted);

          return {
            ...prod,
            stock: finalStock,
            sizeStocks: newSizeStocks,
            colorStocks: newColorStocks,
            storageStocks: newStorageStocks,
            inventoryStatus: finalStock <= 0 ? 'نفد من المخزون' : (finalStock <= 5 ? 'قطعة أخيرة' : 'متوفر')
          };
        });

        updatedContent.products = updatedItems;
        updatedContent.items = updatedItems;
        setContent(updatedContent);

        try {
          const token = await auth.currentUser?.getIdToken();
          await fetch('/api/tenant/content', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
            body: JSON.stringify({ content: updatedContent })
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    setOrders(prev => prev.map(o => Number(o.id) === Number(orderId) ? { 
      ...o, 
      status: newStatus, 
      details: details ? { ...o.details, ...details, stockDeducted: (isCompleted && !skipAdminStockDeduction) ? true : ((o.details as any)?.stockDeducted || false), ...(isCompleted && !skipAdminStockDeduction ? { cleared: true } : {}) } : (isCompleted && !skipAdminStockDeduction ? { ...o.details, stockDeducted: true, cleared: true } : { ...o.details, stockDeducted: (o.details as any)?.stockDeducted || false }) 
    } : o));

    showToast(isCompleted ? '✅ تم اكتمال الطلب وتحديث المخزون بنجاح!' : 'تم تحديث حالة الطلب بنجاح');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenant/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
        body: JSON.stringify({ 
          status: newStatus, 
          details: details ? { ...targetOrder?.details, ...details, stockDeducted: (isCompleted && !skipAdminStockDeduction) ? true : ((targetOrder?.details as any)?.stockDeducted || false), ...(isCompleted && !skipAdminStockDeduction ? { cleared: true } : {}) } : (isCompleted && !skipAdminStockDeduction ? { ...targetOrder?.details, stockDeducted: true, cleared: true } : { ...targetOrder?.details, stockDeducted: (targetOrder?.details as any)?.stockDeducted || false }) 
        })
      });
      if (!res.ok) { const text = await res.text(); console.error('Order update failed:', res.status, text); fetchOrders(); }
    } catch (e) {
      console.error(e);
      showToast('خطأ في تحديث الحالة');
      fetchOrders();
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    setOrders(prev => prev.map(o => o.id === Number(orderId) ? { ...o, deletedAt: new Date().toISOString(), status: 'deleted' } : o));
    showToast('تم نقل الطلب إلى سلة المحذوفات 🗑️');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenant/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      if (!res.ok) { const text = await res.text(); console.error('Order update failed:', res.status, text); fetchOrders(); }
    } catch (e) {
      console.error(e);
      showToast('خطأ في حذف الطلب');
      fetchOrders();
    }
  };

  const handleRestoreOrder = async (orderId: number) => {
    setOrders(prev => prev.map(o => o.id === Number(orderId) ? { ...o, deletedAt: null, status: 'pending' } : o));
    showToast('تم استعادة الطلب بنجاح إلى القائمة النشطة 🔄');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenant/orders/${orderId}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      if (!res.ok) { const text = await res.text(); console.error('Order update failed:', res.status, text); fetchOrders(); }
    } catch (e) {
      console.error(e);
      showToast('خطأ في استعادة الطلب');
      fetchOrders();
    }
  };

  const handlePermanentDeleteOrder = async (orderId: number) => {
    setOrders(prev => prev.filter(o => o.id !== Number(orderId)));
    showToast('تم حذف الطلب نهائياً 🗑️');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenant/orders/${orderId}?force=true`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) }
      });
      if (!res.ok) { const text = await res.text(); console.error('Order update failed:', res.status, text); fetchOrders(); }
    } catch (e) {
      console.error(e);
      showToast('خطأ في حذف الطلب');
      fetchOrders();
    }
  };

  const initialContentLoaded = React.useRef(false);
  const debounceTimer = React.useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initialContentLoaded.current) {
      if (Object.keys(content).length > 0) {
        initialContentLoaded.current = true;
      }
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
       handleUpdateContent(true);
    }, 1500);

    return () => clearTimeout(debounceTimer.current);
  }, [content]);

  const handleUpdateContent = async (silent = false, overrideContent?: any) => {
    if (!silent) setIsSaving(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
      const url = impersonateTenantId 
        ? `/api/tenant/content?impersonateTenantId=${impersonateTenantId}` 
        : '/api/tenant/content';
      const payloadContent = overrideContent || content;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
        body: JSON.stringify({ content: payloadContent, impersonateTenantId })
      });
      if (res.ok) {
        if (!silent) showToast('تم حفظ جميع التغييرات بنجاح ونشرها حياً على موقعك! ');
        const newName = payloadContent.businessName || payloadContent.siteName;
        if (newName && tenant && tenant.name !== newName) {
          setTenant({ ...tenant, name: newName });
        }
      } else {
        if (!silent) showToast('حدث خطأ أثناء الحفظ');
      }
    } catch (e) {
      console.error(e);
      if (!silent) showToast('حدث خطأ أثناء الحفظ');
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  const handleResetHeroImage = () => {
    const defaultHero = getDefaultHeroForTemplate(templateId);
    setContent((prev: any) => ({
      ...prev,
      heroBgUrl: defaultHero
    }));
    showToast('تمت استعادة صورة البانر الأصلية للقالب 🔄');
  };

  const handleLogout = async () => {
    localStorage.removeItem('impersonatedEmail');
    await logout();
    navigate('/');
  };


  const handleOnboard = async () => {
    setOnboardingError('');
    if (!onboardData.tenantName.trim() || !onboardData.subdomain.trim()) {
      setOnboardingError('الرجاء تعبئة جميع الحقول');
      return;
    }
    // Basic subdomain validation (lowercase, alphanumeric, dashes)
    if (!/^[a-z0-9-]+$/.test(onboardData.subdomain)) {
      setOnboardingError('الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة، أرقام، وشرطات (-) فقط');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const tplId = localStorage.getItem('selectedTemplateId');
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: tplId,
          tenantName: onboardData.tenantName,
          subdomain: onboardData.subdomain
        })
      });

      if (res.ok) {
        localStorage.removeItem('selectedTemplateId');
        window.location.reload();
      } else {
        const err = await res.json();
        setOnboardingError(err.error || err.details || 'حدث خطأ أثناء الإنشاء');
        setLoading(false);
      }
    } catch (e: any) {
      setOnboardingError('تعذر الاتصال بالخادم');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans" dir="rtl">
        <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-black text-xl tracking-wide">جاري تجهيز لوحة التحكم الشاملة...</div>
        <p className="text-slate-500 text-sm mt-2 font-mono">يرجى الانتظار ثواني معدودة</p>
      </div>
    );
  }

  if (isSubscriptionInactive) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans p-6" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Decorative red glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"  />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-white mb-4">انتهى اشتراكك أو تم إيقافه مؤقتاً</h2>
          <p className="text-slate-400 mb-8 leading-relaxed text-sm md:text-base">
            لوحة التحكم الشاملة وموقعك الإلكتروني متوقفان حالياً بسبب عدم نشاط الاشتراك. الرجاء التواصل مع الإدارة للتجديد أو تفعيل الحساب.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => {
                const message = encodeURIComponent(`مرحباً، أود تجديد اشتراكي في منصة بنيان Bunyan`);
                window.open(`https://wa.me/0778091269?text=${message}`, '_blank');
              }}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.514 2.266 2.265 3.51 5.272 3.51 8.474-.004 6.658-5.34 11.996-11.951 11.996-2.005-.001-3.973-.503-5.722-1.46L0 24zm6.21-3.818c1.648.978 3.256 1.492 4.802 1.493 5.378 0 9.757-4.374 9.76-9.751.002-2.605-1.01-5.053-2.85-6.897C16.141 3.183 13.699 2.17 11.096 2.17 5.719 2.17 1.34 6.545 1.337 11.924c0 1.62.433 3.206 1.252 4.601l-.157.574-.836 3.056 3.125-.819.546-.154z"  />
              </svg>
              تواصل عبر الواتساب للتجديد
            </button>
            
            <button 
              onClick={handleLogout}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant || isOnboarding) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans p-6" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-2xl font-black text-white mb-2 text-center">إنشاء متجرك أو موقعك الإلكتروني</h2>
          <p className="text-slate-400 text-sm mb-6 text-center">أدخل اسم المتجر والرابط المخصص لبدء استخدام لوحة التحكم</p>

          {onboardingError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold text-center">
              {onboardingError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المتجر أو المؤسسة</label>
              <input
                type="text"
                value={onboardData.tenantName}
                onChange={e => setOnboardData({ ...onboardData, tenantName: e.target.value })}
                placeholder="مثال: مطعم الذواق"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
               />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">الرابط المخصص (Subdomain)</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-blue-500">
                <input
                  type="text"
                  value={onboardData.subdomain}
                  onChange={e => setOnboardData({ ...onboardData, subdomain: e.target.value.toLowerCase().trim() })}
                  placeholder="my-store"
                  className="w-full bg-transparent px-4 py-3 text-sm text-white focus:outline-none font-mono text-left"
                  dir="ltr"
                 />
                <span className="px-3 text-xs text-slate-500 font-mono bg-slate-900/80 py-3 border-r border-slate-800">.waas.app</span>
              </div>
            </div>

            <button
              onClick={handleOnboard}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25 transition-all text-sm cursor-pointer mt-4"
            >
              {loading ? 'جاري الإنشاء...' : 'بدء تشغيل المتجر وإدارة اللوحة '}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors text-center font-bold"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine business template types
  const effectiveTemplateId = previewTemplateId !== null ? previewTemplateId : (templateId !== null && templateId !== undefined ? Number(templateId) : 13);
  const tId = Number(effectiveTemplateId);
  
  // Calculate effective content so preview mode correctly updates default texts
  const effectiveContent = previewTemplateId !== null ? migrateContentOnTemplateSwitch(content, previewTemplateId) : content;

  const isLuxuryRestaurant = tId === 1;
  const isModernGrill = tId === 2;
  const isFastFoodDelivery = tId === 3;
  const isCozyCafe = tId === 4;
  const isSpecialtyCoffee = tId === 5;
  const isBakeryCafe = tId === 6;
  const isLuxuryVillas = tId === 7;
  const isModernApartments = tId === 8;
  const isCommercialAgency = tId === 9;
  const isHeavyConstruction = tId === 10;
  const isModernArchitecture = tId === 11;
  const isHomeRenovation = tId === 12;
  const isBoutique = tId === 13;
  const isElectronicsStore = tId === 14;
  const isSkincareStore = tId === 15;
  const isDentalClinic = tId === 16;
  const isPerfumeStore = tId === 99; // Deprecated

  const isRestaurant = tId >= 1 && tId <= 6;
  const isRealEstate = tId >= 7 && tId <= 9;
  const isConstruction = tId >= 10 && tId <= 12;
  const isEcommerce = tId === 13 || tId === 14 || tId === 15;
  const isMedical = tId === 16;

  const dashboardColor = content?.primaryColor || (
    isLuxuryRestaurant ? '#b8860b' :
    isModernGrill ? '#ea580c' :
    isFastFoodDelivery ? '#dc2626' :
    isCozyCafe ? '#C5A880' :
    isSpecialtyCoffee ? '#d97706' :
    isBakeryCafe ? '#f43f5e' :
    isLuxuryVillas ? '#d4af37' :
    isModernApartments ? '#0284c7' :
    isCommercialAgency ? '#7c3aed' :
    isHeavyConstruction ? '#d97706' :
    isModernArchitecture ? '#8b5cf6' :
    isHomeRenovation ? '#059669' :
    isPerfumeStore ? '#d97706' :
    isElectronicsStore ? '#0284c7' :
    isSkincareStore ? '#059669' :
    isDentalClinic ? '#0284c7' :
    '#ec4899'
  );
  const fontFamilyClass = content?.fontFamily === 'Cairo' ? 'font-cairo' : content?.fontFamily === 'Almarai' ? 'font-almarai' : 'font-sans';

  const getBusinessTypeName = () => {
    if (isLuxuryRestaurant) return 'المطعم الإيطالي والفاخر 🍽️👑';
    if (isModernGrill) return 'مطعم المشويات والستيك العصري 🥩🔥';
    if (isFastFoodDelivery) return 'متجر الوجبات السريعة والتوصيل 🍔⚡';
    if (isCozyCafe) return 'مقهى الروق والسكينة الهادئ ☕✨';
    if (isSpecialtyCoffee) return 'محمصة ومقهى القهوة المختصة ☕🌱';
    if (isBakeryCafe) return 'مخبز ومقهى المخبوزات والحلويات الفرنسية 🥐🍰';
    if (isLuxuryVillas) return 'معرض الفلل والقصور العقارية الفاخرة 🏰💎';
    if (isModernApartments) return 'معرض الشقق والمجمعات السكنية المودرن 🏢🔑';
    if (isCommercialAgency) return 'وكالة العقارات والأنشطة التجارية والمكاتب 🏬✨';
    if (isHeavyConstruction) return 'شركة المقاولات والإنشاءات الثقيلة 🏗️🧱';
    if (isModernArchitecture) return 'استوديو التصميم المعماري والديكور الداخلي 📐🎨';
    if (isHomeRenovation) return 'شركة ترميم وتجديد المنازل والمباني 🛠️🏡';
    if (isBoutique) return 'بوتيك الأزياء والموضة الراقية 👗✨';
    if (isPerfumeStore) return 'متجر العطور والبخور الفاخرة 🌸✨';
    if (isElectronicsStore) return 'متجر الإلكترونيات والهواتف الذكية 📱💻';
    if (isSkincareStore) return 'متجر العناية بالبشرة والجمال 🧴✨';
    return 'موقع أعمال';
  };

  // Content items (Meal catalog, property catalog, or projects/services)
  const contentItems = content.items || [];

  const handleAddItem = () => {
    setEditingItemIndex(null);
    let newItem: any = { id: Date.now(), image: '' };
    
    if (isLuxuryRestaurant) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '',
        calories: '480',
        prepTime: '20 دقيقة',
        category: 'أطباق رئيسية ملكية',
        description: '',
        ingredients: 'لحم أنجوس فاخر، صلصة الكمأة السوداء، طماطم مجففة وصنوبر محمص',
        allergens: ['حلال', 'يحتوي مكسرات'],
        isChefSpecial: true,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600',
        images: []
      };
    } else if (isModernGrill) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '120',
        calories: '750',
        prepTime: '25 دقيقة',
        category: 'قطع الستيك الفاخرة',
        cutType: 'ريب آي (Ribeye)',
        doneness: 'متوسط الطهي (Medium)',
        sauces: 'صلصة الفلفل الأسود + صلصة المشروم',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600',
        images: []
      };
    } else if (isFastFoodDelivery) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '38',
        originalPrice: '52',
        calories: '650',
        deliveryTime: '15-25 دقيقة',
        category: 'عروض الكومبو السريعة',
        description: '',
        addons: 'بطاطس مقرمشة حجم كبير + مشروب غازي سعة 500مل + صوص الشيدر الدافئ',
        tags: ['توصيل مجاني 🛵', 'عرض ساخن 🔥', 'الأكثر مبيعاً 👑'],
        comboType: 'وجبة كومبو كاملة',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
        images: []
      };
    } else if (isCozyCafe) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '24',
        category: 'مشروبات القهوة الساخنة',
        temperature: 'ساخن 🔥',
        sweetness: '50% معتدل',
        milkType: 'حليب الشوفان',
        prepTime: '10 دقائق',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600',
        images: []
      };
    } else if (isSpecialtyCoffee) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '65',
        category: 'محاصيل بن مختصة',
        origin: 'إثيوبيا - يرجاجيف',
        roastLevel: 'تحميص متوسط (Medium Roast)',
        process: 'مجففة طبيعياً (Natural)',
        notes: 'ياسمين، شوكولاتة داكنة، توت علق، كراميل',
        weight: '250 جرام',
        stock: 25,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=600',
        images: []
      };
    } else if (isBakeryCafe) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '18',
        category: 'المخبوزات والكرواسون',
        isFreshDaily: true,
        allergens: ['يحتوي جلوتين 🌾', 'يحتوي حليب 🥛'],
        calories: '320',
        prepTime: '15 دقيقة',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600',
        images: []
      };
    } else if (isLuxuryVillas) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        price: '3,800,000 ر.س',
        location: 'حي الياسمين، الرياض',
        type: 'للبيع',
        beds: 5,
        baths: 6,
        area: '650 م²',
        category: 'فلل وقصور فاخرة',
        description: 'فيلا مودرن فاخرة بتصميم معماري فريد، تشطيبات سوبر ديلوكس مع مسبح وغرفة سائق.',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600',
        images: []
      };
    } else if (isModernApartments) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        price: '850,000 ر.س',
        location: 'حي الملقا، الرياض',
        type: 'للبيع',
        beds: 3,
        baths: 3,
        area: '185 م²',
        floor: 'الدور الثالث',
        category: 'شقق ومجمعات مودرن',
        description: 'شقة سكنية فاخرة بمجمع مغلق ذكي مع موقف خاص وبلكونة مطلة.',
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600',
        images: []
      };
    } else if (isCommercialAgency) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        price: '180,000 ر.س / سنوياً',
        location: 'طريق الملك فهد، الرياض',
        type: 'للإيجار',
        propertyType: 'معرض تجاري بلقطة حيوية',
        area: '320 م²',
        suitableFor: 'كافيه، متجر، مقر شركة، معرض ملابس',
        category: 'معارض ومكاتب تجارية',
        description: 'معرض تجاري بواجهة زجاجية عريضة على طريق حيوي ومواقف متوفرة.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600',
        images: []
      };
    } else if (isHeavyConstruction) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        client: 'مجموعة الأفق العقارية',
        budget: '950,000 ر.س',
        duration: '10 أشهر',
        category: 'إنشاءات هيكلية ومقاولات عامة',
        status: 'قيد التنفيذ (60%)',
        description: 'تشييد برج تجاري سكني متكامل مع أعمال الخرسانة المسلحة وتمديدات الكهروميكانيك.',
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f248e?q=80&w=600',
        images: []
      };
    } else if (isModernArchitecture) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        style: 'مودرن نيومينيماليست',
        scope: 'فيلا سكنية فاخرة 3 أدوار',
        area: '520 م²',
        year: '2025',
        category: 'تصميم معماري وديكور داخلي',
        description: 'دراسة المعالجات المعمارية وتخطيط الفراغات مع التوزيع الضوئي والمسطحات الخضراء.',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600',
        images: []
      };
    } else if (isHomeRenovation) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        renovationScope: 'ترميم وإعادة تصميم المطبخ والحمامات بالكامل',
        costRange: '45,000 - 65,000 ر.س',
        executionTime: '18 يوم عمل',
        category: 'تجديد وترميم منازل',
        description: 'تغيير التأسيسات السباكة والكهرباء، تركبيات البورسلان الإسباني والإضاءات المخفية.',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600',
        images: []
      };
    } else if (isBoutique) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '',
        originalPrice: '',
        description: '',
        category: 'فساتين',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600',
        images: [],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['أسود', 'أبيض', 'بيج'],
        stock: 15,
        fabric: 'حرير فاخر'
      };
    } else if (isPerfumeStore) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '',
        originalPrice: '',
        description: '',
        category: 'عطور شرقية',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=600',
        images: [],
        sizes: ['50ml', '100ml', '200ml'],
        colors: ['عنبر معتق', 'مسك ناصع'],
        stock: 20
      };
    } else if (isElectronicsStore) {
      newItem = {
        ...newItem,
        name: '',
        title: '',
        price: '',
        originalPrice: '',
        description: '',
        category: 'الهواتف الذكية',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
        images: [],
        sizes: ['128GB', '256GB', '512GB'],
        colors: ['أسود تيتانيوم', 'فضي ناصع'],
        stock: 10
      };
    } else if (isRestaurant) {
      newItem = {
        ...newItem,
        name: '',
        price: '',
        description: '',
        category: '',
        image: ''
      };
    } else if (isRealEstate) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        price: '3,800,000 ر.س',
        location: 'حي الياسمين، الرياض',
        type: 'للبيع',
        beds: 5,
        baths: 6,
        area: '650 م²',
        category: 'فلل وقصور فاخرة',
        description: 'فيلا مودرن فاخرة بتصميم معماري فريد، تشطيبات سوبر ديلوكس مع مسبح وغرفة سائق.',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600',
        images: []
      };
    } else if (isConstruction) {
      newItem = {
        ...newItem,
        title: '',
        name: '',
        client: 'مجموعة الأفق العقارية',
        budget: '950,000 ر.س',
        duration: '10 أشهر',
        category: 'إنشاءات هيكلية ومقاولات عامة',
        status: 'قيد التنفيذ (60%)',
        description: 'تشييد برج تجاري سكني متكامل مع أعمال الخرسانة المسلحة وتمديدات الكهروميكانيك.',
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f248e?q=80&w=600',
        images: []
      };
    }

    setNewItemForm(newItem);
    setIsAddModalOpen(true);
  };

  const handleEditItem = (itemOrIndex: any, indexParam?: number) => {
    let index = indexParam;
    let item = itemOrIndex;
    if (typeof itemOrIndex === 'number') {
      index = itemOrIndex;
      item = contentItems[index] || {};
    } else if (index === undefined) {
      index = contentItems.findIndex((it: any) => it.id === item.id);
      if (index === -1) index = 0;
    }
    setEditingItemIndex(index ?? null);
    setNewItemForm({
      ...item,
      name: item?.name || item?.title || '',
      title: item?.title || item?.name || '',
      price: item?.price || '',
      originalPrice: item?.originalPrice || '',
      description: item?.description || '',
      category: item?.category || 'عام',
      image: item?.image || '',
      images: Array.isArray(item?.images) ? item.images : (typeof item?.images === 'string' ? item.images.split('\n').map((s: string) => s.trim()).filter(Boolean) : []),
      sizes: Array.isArray(item?.sizes) ? item.sizes : (typeof item?.sizes === 'string' ? item.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL']),
      enableSizes: item?.enableSizes !== undefined ? item.enableSizes : (Array.isArray(item?.sizes) ? item.sizes.length > 0 : true),
      colors: Array.isArray(item?.colors) ? item.colors : (typeof item?.colors === 'string' ? item.colors.split(',').map((s: string) => s.trim()).filter(Boolean) : ['أسود', 'أبيض']),
      calories: item?.calories || '650',
      prepTime: item?.prepTime || '20 دقيقة',
      deliveryTime: item?.deliveryTime || '15-25 دقيقة',
      ingredients: item?.ingredients || '',
      addons: item?.addons || '',
      tags: Array.isArray(item?.tags) ? item.tags : (typeof item?.tags === 'string' ? item.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : ['توصيل مجاني 🛵', 'الأكثر مبيعاً 👑']),
      comboType: item?.comboType || 'وجبة كومبو كاملة',
      allergens: Array.isArray(item?.allergens) ? item.allergens : (typeof item?.allergens === 'string' ? item.allergens.split(',').map((s: string) => s.trim()).filter(Boolean) : ['حلال']),
      isChefSpecial: item?.isChefSpecial !== undefined ? item.isChefSpecial : true,
      stock: item?.stock !== undefined ? item.stock : 10,
      fabric: item?.fabric || '',
      location: item?.location || 'الرياض',
      type: item?.type || 'للبيع',
      beds: item?.beds || 5,
      baths: item?.baths || 6,
      area: item?.area || '600 م²',
      floor: item?.floor || 'الدور الثاني',
      propertyType: item?.propertyType || 'معرض تجاري',
      suitableFor: item?.suitableFor || 'جميع الأنشطة',
      client: item?.client || 'مشروع خاص',
      budget: item?.budget || '500,000 ر.س',
      duration: item?.duration || '6 أشهر',
      status: item?.status || 'مكتمل 100%',
      cutType: item?.cutType || 'ريب آي (Ribeye)',
      doneness: item?.doneness || 'متوسط الطهي (Medium)',
      sauces: item?.sauces || 'صلصة الفلفل الأسود',
      temperature: item?.temperature || 'ساخن 🔥',
      sweetness: item?.sweetness || '50% معتدل',
      milkType: item?.milkType || 'حليب كامل الدسم',
      origin: item?.origin || 'إثيوبيا - يرجاجيف',
      roastLevel: item?.roastLevel || 'تحميص متوسط',
      process: item?.process || 'مجففة طبيعياً',
      notes: item?.notes || 'ياسمين، شوكولاتة',
      weight: item?.weight || '250 جرام',
      isFreshDaily: item?.isFreshDaily !== undefined ? item.isFreshDaily : true,
      style: item?.style || 'مودرن نيومينيماليست',
      scope: item?.scope || 'فيلا سكنية',
      year: item?.year || '2025',
      renovationScope: item?.renovationScope || 'ترميم وإعادة تصميم المطبخ والحمامات',
      costRange: item?.costRange || '45,000 ر.س',
      executionTime: item?.executionTime || '18 يوم عمل'
    });
    setIsAddModalOpen(true);
  };

  const handleAddCustomCategory = () => {
    if (!customCategoryInput.trim()) return;
    const newCat = customCategoryInput.trim();
    if (!categoriesList.includes(newCat)) {
      setCategoriesList(prev => [...prev, newCat]);
    }
    handleSelectCategory(newCat);
    setCustomCategoryInput('');
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const newSz = customSizeInput.trim();
    if (!customSizesList.includes(newSz)) {
      setCustomSizesList(prev => [...prev, newSz]);
    }
    handleToggleSizeInForm(newSz);
    setCustomSizeInput('');
  };

  const handleAddCustomColor = () => {
    if (!customColorInput.trim()) return;
    const newClr = customColorInput.trim();
    if (!colorsList.includes(newClr)) {
      setColorsList(prev => [...prev, newClr]);
    }
    handleToggleColorInForm(newClr);
    setCustomColorInput('');
  };

  const handleSelectCategory = (cat: string) => {
    const isAccessory = cat.includes('عطور') || cat.includes('مكياج') || cat.includes('إكسسوارات') || cat.includes('حقائب') || cat.includes('ساعات');
    setNewItemForm(prev => ({
      ...prev,
      category: cat,
      enableSizes: prev.enableSizes !== undefined ? prev.enableSizes : !isAccessory
    }));
  };

  const handleToggleTagInForm = (tag: string) => {
    const currentTags = Array.isArray(newItemForm.tags) ? newItemForm.tags : [];
    if (currentTags.includes(tag)) {
      setNewItemForm({ ...newItemForm, tags: currentTags.filter((t: string) => t !== tag) });
    } else {
      setNewItemForm({ ...newItemForm, tags: [...currentTags, tag] });
    }
  };

  const handleToggleAllergenInForm = (allergen: string) => {
    const currentAllergens = Array.isArray(newItemForm.allergens) ? newItemForm.allergens : [];
    if (currentAllergens.includes(allergen)) {
      setNewItemForm({ ...newItemForm, allergens: currentAllergens.filter((a: string) => a !== allergen) });
    } else {
      setNewItemForm({ ...newItemForm, allergens: [...currentAllergens, allergen] });
    }
  };

  const handleToggleSizeInForm = (size: string) => {
    const currentSizes = Array.isArray(newItemForm.sizes) ? newItemForm.sizes : [];
    if (currentSizes.includes(size)) {
      setNewItemForm({ ...newItemForm, sizes: currentSizes.filter((s: string) => s !== size) });
    } else {
      setNewItemForm({ ...newItemForm, sizes: [...currentSizes, size] });
    }
  };

  const handleToggleColorInForm = (colorName: string) => {
    const currentColors = Array.isArray(newItemForm.colors) ? newItemForm.colors : [];
    if (currentColors.includes(colorName)) {
      setNewItemForm({ ...newItemForm, colors: currentColors.filter((c: string) => c !== colorName) });
    } else {
      setNewItemForm({ ...newItemForm, colors: [...currentColors, colorName] });
    }
  };

  const saveNewItem = async () => {
    let updatedItems = [];
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      updatedItems = [...contentItems];
      updatedItems[editingItemIndex] = newItemForm;
    } else {
      updatedItems = [newItemForm, ...contentItems];
    }
    const newContent = { 
      ...content, 
      items: updatedItems 
    };
    setContent(newContent);
    setIsAddModalOpen(false);
    setEditingItemIndex(null);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/tenant/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
        body: JSON.stringify({ content: newContent })
      });
      showToast(editingItemIndex !== null ? 'تم تحديث بيانات المنتج بنجاح 🎉' : 'تمت إضافة المنتج بنجاح 🎉');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء الحفظ');
    }
  };
  
  const handleUpdateItem = (id: number, field: string, value: any) => {
    const updatedItems = contentItems.map((item: any) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });

    setContent({ 
      ...content, 
      items: updatedItems
    });
  };
  
  const handleDeleteItem = async (idOrIndex: number | string) => {
    setDeleteConfirm({ idOrIndex });
  };

  const confirmDelete = async () => {
    const idOrIndex = deleteConfirm.idOrIndex;
    setDeleteConfirm({ idOrIndex: null });
    if (idOrIndex === null) return;
    const updatedItems = contentItems.filter((item: any, idx: number) => {
      if (item.id !== undefined && String(item.id) === String(idOrIndex)) return false;
      if (idx === idOrIndex) return false;
      return true;
    });
    const newContent = { 
      ...content, 
      items: updatedItems
    };
    setContent(newContent);
        
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/tenant/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
        body: JSON.stringify({ content: newContent })
      });
      showToast('تم حذف المنتج بنجاح 🗑️');
    } catch (e) {
      console.error(e);
      showToast('تم الحذف بنجاح محلياً');
    }
  };

  const handleImageUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت');
      return;
    }

    try {
      showToast('جاري رفع الصورة...');
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const storagePath = `tenants/${tenant?.id || 'general'}/images/${fileName}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      handleUpdateItem(id, 'image', downloadURL);
      showToast('تم رفع الصورة بنجاح!');
    } catch (error) {
      console.error('Error uploading image to Firebase Storage:', error);
      showToast('حدث خطأ أثناء الرفع');
    }
  };

  // Helper to open WhatsApp to chat with customers
  const openWhatsApp = (phone: string, customerName: string) => {
    const businessName = content?.businessName || tenant?.name || 'موقعنا';
    let cleanPhone = (phone || '').trim().replace(/[^\d]/g, '');

    // Strip leading 00 if present (e.g. 0096277... -> 96277...)
    if (cleanPhone.startsWith('00')) {
      cleanPhone = cleanPhone.substring(2);
    }

    // If starts with single 0 (local number entered without country code)
    if (cleanPhone.startsWith('0')) {
      const defaultPrefix = content?.countryCode || (content?.currency === 'JOD' ? '962' : content?.currency === 'EGP' ? '20' : content?.currency === 'AED' ? '971' : '966');
      cleanPhone = defaultPrefix + cleanPhone.substring(1);
    }

    let message = `مرحباً ${customerName}، يسعدنا تواصلك معنا بخصوص طلبك عبر موقعنا (${businessName})...`;

    if (isLuxuryRestaurant) {
      message = `مرحباً ${customerName} 🍽️🍷، تم استلام طلب الحجز والوجبة الفاخرة من مطعم (${businessName})! يسعدنا تجهيز طاولتك وتأكيد تفاصيل الضيافة...`;
    } else if (isModernGrill) {
      message = `مرحباً ${customerName} 🥩🔥، تم استلام طلب المشويات والستيك من مطعم (${businessName})! جاري تجهيز وشواء أطباقك المميزة على الجمر...`;
    } else if (isFastFoodDelivery) {
      message = `مرحباً ${customerName} 🍔⚡، تم استلام وجبتك بمتجر (${businessName})! هي الآن قيد التحضير والتوصيل المباشر 🛵...`;
    } else if (isCozyCafe) {
      message = `مرحباً ${customerName} ☕✨، تم استلام طلب المشروبات والحلويات الهادئة من كافيه (${businessName})! جاري تحضير كوبك بكل حب...`;
    } else if (isSpecialtyCoffee) {
      message = `مرحباً ${customerName} ☕🌱، تم استلام طلب القهوة والمحاصيل من محمصة (${businessName})! جاري تجهيز وتقطير القهوة / شحن البن لك...`;
    } else if (isBakeryCafe) {
      message = `مرحباً ${customerName} 🥐🍰، تم استلام طلب المخبوزات والحلويات من مخبز (${businessName})! جاري تجهيز وتدفئة الطلبية لك بفرننا الدافئ...`;
    } else if (isLuxuryVillas) {
      message = `مرحباً ${customerName} 🏰💎، تم استلام طلبك واستفسارك العقاري بخصوص معاينة القصر/الفيلا الفاخرة عبر موقع (${businessName})! جاري تحويل الطلب لمستشارك العقاري الخاص...`;
    } else if (isModernApartments) {
      message = `مرحباً ${customerName} 🏢🔑، تم استلام استفسارك بخصوص معاينة وتأجير/شراء الشقة المودرن عبر موقع (${businessName})! جاري التواصل بك لمعاينة الشقة...`;
    } else if (isCommercialAgency) {
      message = `مرحباً ${customerName} 🏬✨، تم استلام طلب المعاينة والاستثمار التجاري والمكاتب عبر (${businessName})! مستشارك التجاري يتواصل معك فوراً...`;
    } else if (isHeavyConstruction) {
      message = `مرحباً ${customerName} 🏗️🧱، تم استلام طلب تسعير وتثمين المقاولات والإنشاءات عبر (${businessName})! المهندس المسؤول سيتواصل معك لتسليم الدراسة...`;
    } else if (isModernArchitecture) {
      message = `مرحباً ${customerName} 📐🎨، تم استلام طلب استشارة التصميم المعماري والديكور عبر (${businessName})! مهندس الديكور بانتظار تواصلك لإطلاعه على المخطط...`;
    } else if (isHomeRenovation) {
      message = `مرحباً ${customerName} 🛠️🏡، تم استلام طلب معاينة الترميم وتجديد المنزل عبر (${businessName})! فريق المعاينة يحدد معك الموعد الميداني...`;
    } else if (isBoutique) {
      message = `مرحباً ${customerName} 👗✨، تم استلام طلبك وحجز الأزياء والتشكيلة الراعية عبر بوتيك (${businessName})! جاري تجهيز وتغليف طلبك بكل فخامة...`;
    } else if (isElectronicsStore) {
      message = `مرحباً ${customerName} 📱💻، تم استلام طلبك للأجهزة الإلكترونية عبر (${businessName})! جاري تجهيز طلبك بكل عناية...`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Helper to render dynamic trends graph in SVG
  const renderTrendGraph = () => {
    const trends = analyticsData?.dailyTrends || [];
    if (trends.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-bold">
          لا يوجد تفاعل مسجل بعد لتوليد منحنى الزيارات
        </div>
      );
    }

    const maxVal = Math.max(...trends.map((t: any) => Math.max(t.visits || 0, t.clicks || 0)), 5);
    const height = 180;
    const width = 500;
    const padding = 20;

    const pointsVisits = trends.map((t: any, idx: number) => {
      const x = padding + (idx / Math.max(trends.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((t.visits || 0) / maxVal) * (height - padding * 2);
      return { x, y };
    });

    const pointsClicks = trends.map((t: any, idx: number) => {
      const x = padding + (idx / Math.max(trends.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((t.clicks || 0) / maxVal) * (height - padding * 2);
      return { x, y };
    });

    const buildPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    };

    const buildClosedPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return '';
      const first = points[0];
      const last = points[points.length - 1];
      return `M ${first.x} ${height - padding} L ${first.x} ${first.y} ` + 
             points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + 
             ` L ${last.x} ${height - padding} Z`;
    };

    return (
      <div className="w-full flex flex-col justify-between">
        <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"  />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"  />
              </linearGradient>
              <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dashboardColor} stopOpacity="0.2"  />
                <stop offset="100%" stopColor={dashboardColor} stopOpacity="0.0"  />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1"  />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f1f5f9" strokeWidth="1"  />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1"  />

            {/* Filled Areas */}
            {pointsVisits.length > 1 && (
              <path d={buildClosedPath(pointsVisits)} fill="url(#visitsGrad)"  />
            )}
            {pointsClicks.length > 1 && (
              <path d={buildClosedPath(pointsClicks)} fill="url(#clicksGrad)"  />
            )}

            {/* Lines */}
            {pointsVisits.length > 1 && (
              <path d={buildPath(pointsVisits)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"  />
            )}
            {pointsClicks.length > 1 && (
              <path d={buildPath(pointsClicks)} fill="none" stroke={dashboardColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"  />
            )}

            {/* Nodes on points */}
            {pointsVisits.map((p, i) => (
              <circle key={`v-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#10b981" strokeWidth="2"  />
            ))}
            {pointsClicks.map((p, i) => (
              <circle key={`c-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke={dashboardColor} strokeWidth="2"  />
            ))}
          </svg>
        </div>
        
        {/* X Axis Labels */}
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 mt-2">
          {trends.map((t: any, i: number) => {
            if (trends.length > 7 && i !== 0 && i !== trends.length - 1 && i !== Math.floor(trends.length / 2)) {
              return null;
            }
            const d = new Date(t.date);
            const formatted = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
            return <span key={i}>{formatted}</span>;
          })}
        </div>
      </div>
    );
  };

  const renderPreviewStatusBar = () => {
    if (!isTrueOwner || previewTemplateId === null) return null;
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-3xl w-[95%] bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 md:p-5 shadow-2xl shadow-amber-900/20 border-2 border-amber-500/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300" dir="rtl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-amber-500/20 animate-pulse">
            👁️
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-amber-400">وضع المعاينة الحية للوحة الإدارة:</span>
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-0.5 rounded-full shadow-sm">
                {ALL_TEMPLATES.find(t => t.id === tId)?.name}
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1 font-medium">
              أنت تستعرض لوحة تحكم هذا القالب. اضغط تثبيت ليتم تطبيقه على الموقع رسمياً.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => {
              setPreviewTemplateId(null);
              showToast('تم إلغاء المعاينة والعودة للقالب الأصلي للموقع 🔄');
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-sm"
          >
            إلغاء ✕
          </button>
          {previewTemplateId !== templateId && (
            <button
              onClick={async () => {
                try {
                  const token = await auth.currentUser?.getIdToken();
                  const res = await fetch('/api/tenant/template', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
                    body: JSON.stringify({ templateId: previewTemplateId, impersonateTenantId })
                  });
                  if (res.ok) {
                    setTemplateId(previewTemplateId);
                    setPreviewTemplateId(null);
                    checkStatusAndFetchData(auth.currentUser);
                    showToast(`تم تثبيت القالب ${ALL_TEMPLATES.find(t=>t.id===previewTemplateId)?.name} رسمياً للموقع 🎉`);
                  }
                } catch(e) {
                  console.error(e);
                }
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <span>تثبيت 💾</span>
            </button>
          )}
        </div>
      </div>
    );
  };



  if (tenant?.templateId === 16 || tenant?.templateCategory === 'medical' || tId === 16) {
    return (
      <>
        {renderPreviewStatusBar()}
        <DentalClinicManager 
        tenant={tenant}
        content={effectiveContent}
        handleUpdateContent={handleUpdateContent}
        setContent={setContent}
        templateId={tId}
        renderStaffTab={() => (
          <StaffTab
            staffList={staffList}
            fetchStaff={fetchStaff}
            handleAddStaff={handleAddStaff}
            handleDeleteStaff={handleDeleteStaff}
            addingStaffLoading={addingStaffLoading}
            newStaffName={newStaffName}
            setNewStaffName={setNewStaffName}
            newStaffEmail={newStaffEmail}
            setNewStaffEmail={setNewStaffEmail}
            newStaffRole={newStaffRole}
            setNewStaffRole={setNewStaffRole}
            newStaffPermissions={newStaffPermissions}
            setNewStaffPermissions={setNewStaffPermissions}
          />
        )}
        renderSettingsTab={() => (
          <SettingsTab
            templateId={templateId}
            content={content}
            setContent={setContent}
            tenant={tenant}
            setTenant={setTenant}
            handleUpdateContent={handleUpdateContent}
            handleResetHeroImage={handleResetHeroImage}
            isSaving={isSaving}
            isRestaurant={isRestaurant}
            setActiveTab={safeSetActiveTab}
            showToast={showToast}
          />
        )}
        renderOrdersTab={() => (
          <OrdersTab
            orders={orders}
            setOrders={setOrders}
            fetchOrders={fetchOrders}
            handleUpdateOrderStatus={handleUpdateOrderStatus}
            showToast={showToast}
            isCozyCafe={isCozyCafe}
            templateId={templateId}
          />
        )}
        onOpenSite={() => {
          const siteUrl = tenant.customDomain 
            ? `https://${tenant.customDomain}`
            : `${window.location.origin}/s/${tenant.subdomain}`;
          window.open(siteUrl, '_blank');
        }}
        onReturnHome={() => {
          navigate(currentUserRole === 'super_admin' ? '/admin' : '/managements');
        }}
        onLogout={handleLogout}
      />
      </>
    );
  }

  return (
    <div className={`min-h-[100dvh] ${isCozyCafe ? 'bg-[#FCFAF7]' : 'bg-slate-50'} flex flex-col ${fontFamilyClass} text-slate-900 overflow-hidden relative`} dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700;900&family=Almarai:wght@400;700;800&display=swap');
        .font-cairo { font-family: 'Cairo', sans-serif; }
        .font-almarai { font-family: 'Almarai', sans-serif; }
        .font-sans { font-family: 'Tajawal', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-200 to-transparent rounded-full blur-3xl opacity-50 z-0"></div>

      {/* Stealth Impersonation Mode Banner */}
      {impersonateTenantId && (isTrueOwner || currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
        <div className="bg-slate-900 border-b border-slate-700 text-slate-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl z-50">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs uppercase tracking-wider animate-pulse">
              Stealth Mode 👁️
            </span>
            <p className="text-xs md:text-sm font-bold">
              أنت مسجل كـ <span className="text-emerald-400 font-black">Super Admin</span> في وضع الدخول الخفي واستعراض لوحة العميل: <span className="underline decoration-emerald-400">{tenant?.name}</span> ({tenant?.subdomain})
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md hover:scale-105"
          >
            العودة للوحة السوبر أدمن ↩
          </button>
        </div>
      )}

      {/* Forced Notification Blocking Modal */}
      {forcedNotification && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30 shadow-lg shadow-rose-500/10">
              <Bell className="w-8 h-8 animate-bounce"  />
            </div>
            
            <div>
              <div className="inline-block bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black px-3 py-1 rounded-full mb-3">
                تنبيه إجباري مهم جداً من إدارة المنصة
              </div>
              <h2 className="text-2xl font-black text-white">{forcedNotification.title}</h2>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 whitespace-pre-line text-right">
                {forcedNotification.message}
              </p>
            </div>

            <button
              onClick={handleAcknowledgeNotification}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-base rounded-2xl shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              قرأت وأوافق على التنبيه والإرشادات أعلاه ✓
            </button>
          </div>
        </div>
      )}

      {userStatus === 'warned' && (
        <div className="bg-red-50 text-red-600 px-6 py-4 flex items-center justify-between shrink-0 border-b border-red-100 relative z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"  /></svg>
            </div>
            <span className="font-bold">تنبيه: اشتراكك ينتهي قريباً، يرجى التجديد لتجنب إيقاف الموقع</span>
          </div>
          <button onClick={() => setUserStatus('active')} className="text-red-500 hover:text-red-700">
            <X size={20}  />
          </button>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden p-2 md:p-6 gap-6 relative z-10">
        
        {/* Sidebar - Shopify Polaris Style */}
        <div className={`w-full md:w-72 ${isCozyCafe ? 'bg-[#1E120A] text-[#FAF6F0]' : 'bg-[#1a1c1e] text-slate-200'} flex flex-col shrink-0 rounded-2xl shadow-xl border ${isCozyCafe ? 'border-[#332115]' : 'border-slate-800'} overflow-hidden relative`}>
          
          {/* Store Brand Header */}
          <div className="p-5 pb-4 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#008060] text-white flex items-center justify-center font-black shadow-md text-lg shrink-0">
                {content?.businessName ? content?.businessName.substring(0, 1) : '🛒'}
              </div>
              <div className="min-w-0 text-right">
                <h1 className="font-bold text-sm text-white truncate">
                  {content?.businessName || tenant?.name || (isBoutique ? 'بوتيك الأزياء الراقية' : isElectronicsStore ? 'متجر الأجهزة الإلكترونية' : isSkincareStore ? 'متجر العناية بالبشرة' : 'متجري الخاص')}
                </h1>
                <span className={`text-[11px] font-bold flex items-center gap-1 ${isActualOwner ? 'text-emerald-400' : 'text-blue-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isActualOwner ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                  <span>{isActualOwner ? `أنت صاحب موقع ${tenant?.name || content?.businessName || 'المتجر'} 👑` : `أنت موظف في موقع ${tenant?.name || content?.businessName || 'المتجر'} 🛡️`}</span>
                </span>
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuExpanded(!isMobileMenuExpanded)}
              className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center border border-slate-700"
              title="قائمة التحكم"
            >
              {isMobileMenuExpanded ? (
                <span className="text-xs font-black px-1 text-rose-400">❌ إغلاق</span>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-black px-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>📱 القائمة</span>
                </div>
              )}
            </button>
          </div>
          
          <nav className={`${isMobileMenuExpanded ? 'flex' : 'hidden md:flex'} flex-col flex-1 px-3 py-4 space-y-1 overflow-y-auto`}>
            <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
              الرئيسية والقوائم
            </div>

            {canSeeDashboard && (
            <button 
              onClick={() => safeSetActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'dashboard' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <LayoutDashboard size={18} className="shrink-0" />
                <span className="truncate">الرئيسية والإحصائيات 📊</span>
              </div>
            </button>
            )}
            
            {canSeeOrders && (
            <button 
              onClick={() => safeSetActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'orders' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShoppingBag size={18} className="shrink-0"  />
                <span className="truncate">
                  {isLuxuryRestaurant ? 'طلبات وحجوزات الطاولات 🍽️🍷' :
                   isModernGrill ? 'طلبات المشويات والستيك 🥩🔥' :
                   isFastFoodDelivery ? 'طلبات التوصيل السريع 🍔🛵' :
                   isCozyCafe ? 'طلبات القهوة والحلويات ☕✨' :
                   isSpecialtyCoffee ? 'طلبات البن والمحاصيل ☕🌱' :
                   isBakeryCafe ? 'طلبات المخبوزات والكرواسون 🥐🍰' :
                   isLuxuryVillas ? 'طلبات معاينة الفلل والقصور 🏰💎' :
                   isModernApartments ? 'طلبات حجز ومعاينة الشقق 🏢🔑' :
                   isCommercialAgency ? 'طلبات المعارض والمكاتب 🏬✨' :
                   isHeavyConstruction ? 'طلبات تسعيرات المقاولات 🏗️🧱' :
                   isModernArchitecture ? 'طلبات استشارات التصميم 📐🎨' :
                   isHomeRenovation ? 'طلبات معاينة الترميم 🛠️🏡' :
                   isElectronicsStore ? 'طلبات الأجهزة والإلكترونيات 📱💻' :
                   isSkincareStore ? 'طلبات العناية بالبشرة والجمال 🧴✨' :
                   'طلبات الأزياء وبوتيك الموضة 👗✨'}
                </span>
              </div>
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${activeTab === 'orders' ? 'bg-white text-[#008060]' : 'bg-rose-500 text-white'}`}>
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
            )}

            {(isEcommerce && canSeeCouriers) && (
            <button 
              onClick={() => safeSetActiveTab('couriers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'couriers' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Truck size={18}  />
                <span>إدارة المناديب 🚚</span>
              </div>
            </button>
            )}

            {canSeeContent && (
            <button 
              onClick={() => safeSetActiveTab('content')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'content' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <PenTool size={18} className="shrink-0"  />
                <span className="truncate">
                  {isLuxuryRestaurant ? 'منيو الأطباق والأطعمة الفاخرة 🍽️🍷' :
                   isModernGrill ? 'منيو المشويات وقطع الستيك 🥩🔥' :
                   isFastFoodDelivery ? 'منيو الوجبات السريعة والكومبو 🍔🍟' :
                   isCozyCafe ? 'منيو القهوة والحلويات ☕🍰' :
                   isRealEstate ? 'معرض العقارات والفلل الفاخرة 🏡✨' :
                   isConstruction ? 'مشاريع المقاولات والبناء 🏗️' :
                   'كتالوج المنتجات والمعروضات 📦'}
                </span>
              </div>
            </button>
            )}

            {/* Coupons & Shipping Fee Button */}
            {canSeeCoupons && (
            <button 
              onClick={() => safeSetActiveTab('coupons')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'coupons' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Tag size={18} className="shrink-0" />
                <span className="truncate">كوبونات الخصم ورسوم الشحن 🏷️</span>
              </div>
            </button>
            )}

            {/* Support Tickets Button */}
            {canSeeSupport && (
            <button 
              onClick={() => safeSetActiveTab('support')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'support' 
                  ? 'bg-[' + dashboardColor + '] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              style={activeTab === 'support' ? { backgroundColor: dashboardColor } : {}}
            >
              <div className="flex items-center gap-3 min-w-0">
                <MessageCircle size={18} className="shrink-0" />
                <span className="truncate">الدعم الفني والرسائل 💬</span>
              </div>
            </button>
            )}

            {/* Customers Tab Button */}
            {canSeeCustomers && (
            <button 
              onClick={() => safeSetActiveTab('customers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'customers' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users size={18} className="shrink-0" />
                <span className="truncate">قائمة العملاء 👥</span>
              </div>
            </button>
            )}

            {canSeeStaff && (
            <button 
              onClick={() => safeSetActiveTab('staff')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'staff' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Shield size={18} className="shrink-0" />
                <span className="truncate">فريق العمل والمشرفين 🛡️</span>
              </div>
            </button>
            )}

            {canSeeSettings && (
            <button 
              onClick={() => safeSetActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'settings' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Settings size={18} className="shrink-0"  />
                <span className="truncate">المتجر الإلكتروني (Online Store Theme)</span>
              </div>
            </button>
            )}

            {canSeeAudit && (
            <button 
              onClick={() => safeSetActiveTab('audit')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-xs ${
                activeTab === 'audit' 
                  ? 'bg-[#008060] text-white shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Activity size={18} className="shrink-0"  />
                <span className="truncate">سجل نشاطات المشرفين والعمليات 📋</span>
              </div>
            </button>
            )}

          </nav>

          <div className={`${isMobileMenuExpanded ? 'block' : 'hidden md:block'} p-3 border-t border-slate-800/80 bg-slate-950/40 mt-auto space-y-2`}>
            <button onClick={() => window.open(`/?domain=${tenant?.customDomain || tenant?.subdomain || tenant?.id || ''}`, '_blank')} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700/80">
              <ExternalLink size={15} />
              <span>معاينة المتجر 🌐</span>
            </button>
            <button onClick={() => setShowQRCodeModal(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-blue-300 bg-blue-950/40 hover:bg-blue-900/60 transition-all border border-blue-800/60 cursor-pointer shadow-sm">
              <QrCode size={15} className="text-blue-400" />
              <span>رمز QR للموقع 📱</span>
            </button>
            <button onClick={() => setShowClearCacheModal(true)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[11px] text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 transition-all border border-amber-800/50 cursor-pointer">
              <span>🧹 مسح ذاكرة البيانات</span>
            </button>
            {(isOwnerOrAdmin || userSites.length > 1) && (
              <button onClick={() => window.location.href = '/managements'} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/50 hover:bg-emerald-900/40 transition-all">
                <Sparkles size={15} />
                <span>إدارة جميع المواقع 👑</span>
              </button>
            )}
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-bold transition-colors text-xs text-rose-400 hover:bg-rose-500/10">
              <LogOut size={15} />
              <span>تسجيل الخروج 🚪</span>
            </button>
          </div>
        </div>

        {/* Main Content Area - Shopify Polaris Container */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${isCozyCafe ? 'bg-[#FCFAF7]/95 shadow-md border-[#EADBC8]' : 'bg-slate-50 border-slate-200'} rounded-2xl border relative`}>
          {/* Dynamic Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Super Admin Template Active Preview Status Bar */}
              {isTrueOwner && previewTemplateId !== null && (
                <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 md:p-5 shadow-2xl border-2 border-amber-500/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-amber-500/20 animate-pulse">
                      👁️
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-amber-400">وضع المعاينة الحية للوحة الإدارة:</span>
                        <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-0.5 rounded-full shadow-sm">
                          {ALL_TEMPLATES.find(t => t.id === tId)?.name}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mt-1 font-medium">
                        أنت الآن تستعرض وتجرب لوحة تحكم هذا القالب. يمكنك العودة وإلغاء المعاينة أو تبديل القالب من قسم إدارة القوالب أدناه.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => {
                        setPreviewTemplateId(null);
                        showToast('تم إلغاء المعاينة والعودة للقالب الأصلي للموقع 🔄');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-sm"
                    >
                      إلغاء المعاينة ✕
                    </button>

                    {previewTemplateId !== templateId && (
                      <button
                        onClick={async () => {
                          try {
                            const token = await auth.currentUser?.getIdToken();
                            const res = await fetch('/api/tenant/template', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
                              body: JSON.stringify({ templateId: previewTemplateId })
                            });
                            if (res.ok) {
                              setTemplateId(previewTemplateId);
                              setPreviewTemplateId(null);
                              checkStatusAndFetchData(auth.currentUser);
                              showToast(`تم تثبيت القالب ${ALL_TEMPLATES.find(t=>t.id===previewTemplateId)?.name} رسمياً للموقع 🎉`);
                            }
                          } catch(e) {
                            console.error(e);
                          }
                        }}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>تثبيت للموقع 💾</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Dashboard Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                    {activeTab === 'dashboard' && (
                      isLuxuryRestaurant ? 'بوابة الإدارة التنفيذية | المطعم الفاخر والحجوزات 🍽️🍷' :
                      isModernGrill ? 'بوابة إدارة مطعم المشويات والستيك هاوس 🥩🔥' :
                      isFastFoodDelivery ? 'بوابة الإدارة السريعة | متجر الوجبات 🍔' :
                      isHeavyConstruction ? 'منسق مشاريع البناء والإنشاءات والمعدات 🏗️' :
                      isModernArchitecture ? 'منسق معرض التصاميم المعمارية والديكور 📐' :
                      isHomeRenovation ? 'منسق مشاريع وخدمات الترميم والصيانة 🛠️' :
                      isBoutique ? 'لوحة تحكم بوتيك الأزياء والموضة 👗' :
                      isPerfumeStore ? 'لوحة تحكم متجر العطور والبخور الملكية 🌸' :
                      isElectronicsStore ? 'لوحة تحكم متجر الإلكترونيات والهواتف 📱' :
                      isSkincareStore ? 'لوحة تحكم متجر العناية بالبشرة والجمال 🧴' :
                      'لوحة تحكم المتجر الإلكتروني والمبيعات 🛒'
                    )}
                    {activeTab === 'content' && (
                      isBoutique ? 'إدارة كتالوج ومنتجات بوتيك الأزياء 👗' :
                      isPerfumeStore ? 'إدارة كتالوج العطور والبخور 🌸' :
                      isElectronicsStore ? 'إدارة كتالوج الأجهزة والإلكترونيات 📱' :
                      isSkincareStore ? 'إدارة منتجات ومستحضرات التجميل 🧴' :
                      isLuxuryRestaurant ? 'إدارة أصناف وأطباق المنيو 🍽️' :
                      isFastFoodDelivery ? 'إدارة وجبات التوصيل والوجبات السريعة 🍔' :
                      'إدارة كتالوج المنتجات والمعروضات 📦'
                    )}
                    {activeTab === 'orders' && (
                      isLuxuryRestaurant ? 'قائمة طلبات الوجبات وحجوزات الطاولات الحية 🍽️' :
                      isModernGrill ? 'طلبات المشويات والستيك الواردة 🥩' :
                      isFastFoodDelivery ? 'طلبات التوصيل السريع الحية 🍔🛵' :
                      isCozyCafe ? 'قائمة الطلبات وحجوزات الطاولات الهادئة ☕' :
                      isSpecialtyCoffee ? 'قائمة طلبات القهوة وحزم المحاصيل الحية ☕' :
                      isBakeryCafe ? 'طلبات الكرواسون والمخبوزات والطلبيات المسبقة 🥐' :
                      isLuxuryVillas ? 'طلبات المعاينة والحجوزات العقارية الحية 🏰' :
                      isModernApartments ? 'استفسارات وحجوزات الشقق المودرن 🏢' :
                      isCommercialAgency ? 'طلبات استئجار وشراء المعارض والمكاتب 🏬' :
                      isHeavyConstruction ? 'طلب تسعيرات ودراسات المقاولات 🏗️' :
                      isModernArchitecture ? 'استفسارات وطلبات استشارات التصميم 📐' :
                      isHomeRenovation ? 'طلبات معاينة وتخمين الترميم 🛠️' :
                      isBoutique ? 'طلبات وحجوزات أزياء البوتيك 👗' :
                      isPerfumeStore ? 'طلبات العطور والبخور الملكية الواردة 🌸' :
                      isElectronicsStore ? 'طلبات الإلكترونيات والأجهزة الواردة 📱' :
                      isSkincareStore ? 'طلبات العناية بالبشرة والجمال الواردة 🧴' :
                      'قائمة الطلبات والمبيعات الواردة 🛒'
                    )}
                    {activeTab === 'support' && ('طلبات المساعدة والدعم الفني 💬')}
                    {activeTab === 'customers' && ('سجلات دخول وتفاعل العملاء 👥')}
                    {activeTab === 'settings' && (
                      isLuxuryRestaurant ? 'تعديل هوية وإعدادات المطعم الفاخر والمنيو ⚙️' :
                      isModernGrill ? 'تعديل هوية وإعدادات مطعم المشويات والستيك ⚙️' :
                      isFastFoodDelivery ? 'تعديل هوية وإعدادات التوصيل والمنيو السريع ⚙️' :
                      isCozyCafe ? 'تصميم وهوية مقهى السكينة والهدوء ⚙️' :
                      isSpecialtyCoffee ? 'تعديل هوية وإعدادات الروستري والتقطير ⚙️' :
                      isBakeryCafe ? 'تعديل هوية وإعدادات المخبز والفرن ⚙️' :
                      isLuxuryVillas ? 'تعديل هوية وإعدادات المعرض والقصور العقارية ⚙️' :
                      isModernApartments ? 'تعديل هوية وإعدادات مجمع الشقق السكنية ⚙️' :
                      isCommercialAgency ? 'تعديل هوية وإعدادات وكالة المكاتب والمعارض ⚙️' :
                      isHeavyConstruction ? 'تعديل هوية وإعدادات شركة المقاولات ⚙️' :
                      isModernArchitecture ? 'تعديل هوية وإعدادات استوديو التصميم ⚙️' :
                      isHomeRenovation ? 'تعديل هوية وإعدادات شركة الترميم ⚙️' :
                      isBoutique ? 'تعديل هوية وإعدادات بوتيك الأزياء ⚙️' :
                      isPerfumeStore ? 'تعديل هوية وإعدادات متجر العطور ⚙️' :
                      isElectronicsStore ? 'تعديل هوية وإعدادات متجر الإلكترونيات ⚙️' :
                      isSkincareStore ? 'تعديل هوية وإعدادات متجر العناية بالبشرة ⚙️' :
                      'تعديل هوية وإعدادات المتجر والموقع ⚙️'
                    )}
                  </h2>
                  <p className="text-slate-500 text-sm mt-2 font-medium">تحديث حي ومباشر للمحتوى والمعلومات من وإلى الموقع.</p>
                </div>
              </div>

              {/* Permission guard for current tab */}
              {!isCurrentTabAllowed ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-rose-200/80 shadow-lg max-w-lg mx-auto my-16">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-black shadow-inner">⛔</div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">غير مصرح لك بالوصول لهذا القسم</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">ليس لديك الصلاحيات الكافية للوصول إلى هذا القسم. يرجى التواصل مع مدير المتجر للحصول على التفرغ والصلاحية.</p>
                  <button 
                    onClick={() => {
                      if (canSeeDashboard) setActiveTab('dashboard');
                      else if (canSeeOrders) setActiveTab('orders');
                      else if (canSeeContent) setActiveTab('content');
                      else if (canSeeCouriers) setActiveTab('couriers');
                      else if (canSeeCustomers) setActiveTab('customers');
                      else if (canSeeSupport) setActiveTab('support');
                      else if (canSeeSettings) setActiveTab('settings');
                      else if (canSeeStaff) setActiveTab('staff');
                    }}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    العودة للقسم المتاح
                  </button>
                </div>
              ) : (
                <>

              {/* Dashboard Tab - Fully Decoupled Modular Registry */}
              {activeTab === 'dashboard' && canSeeDashboard && (
                <DashboardTemplateRegistry
                  templateId={tId}
                  content={effectiveContent}
                  setContent={setContent}
                  analyticsData={analyticsData}
                  orders={orders}
                  tenant={tenant}
                  handleAddItem={handleAddItem}
                  handleEditItem={handleEditItem}
                  handleDeleteItem={handleDeleteItem}
                  handleUpdateItem={handleUpdateItem}
                  handleUpdateContent={handleUpdateContent}
                  dashboardColor={dashboardColor}
                  setActiveTab={safeSetActiveTab}
                 />
              )}

              {/* Content Management Tab */}
              {activeTab === 'content' && canSeeContent && (
                <ContentTab
                  templateId={tId}
                  content={effectiveContent}
                  dashboardColor={dashboardColor}
                  handleAddItem={handleAddItem}
                  handleEditItem={(idx) => {
                    const item = contentItems[idx];
                    if (item) handleEditItem(item, idx);
                  }}
                  handleDeleteItem={handleDeleteItem}
                  handleUpdateItem={handleUpdateItem}
                  showToast={showToast}
                  isLuxuryRestaurant={isLuxuryRestaurant}
                  isFastFoodDelivery={isFastFoodDelivery}
                  isBoutique={isBoutique}
                  isPerfumeStore={isPerfumeStore}
                  isElectronicsStore={isElectronicsStore}
                  isRealEstate={isRealEstate}
                  isConstruction={isConstruction}
                  isEcommerce={isEcommerce}
                  setContent={setContent}
                  handleUpdateContent={handleUpdateContent}
                 />
              )}

              
              {/* Couriers Tab */}
              {activeTab === 'couriers' && canSeeCouriers && (
                <CouriersTab
                  content={content}
                  setContent={setContent}
                  handleUpdateContent={handleUpdateContent}
                  dashboardColor={dashboardColor}
                 />
              )}

              {/* Orders tab */}
              {activeTab === 'orders' && canSeeOrders && (
                <OrdersTab
                  orders={orders}
                  tenant={tenant}
                  content={content}
                  templateId={templateId}
                  dashboardColor={dashboardColor}
                  fetchOrders={fetchOrders}
                  handleUpdateOrderStatus={handleUpdateOrderStatus}
                  handleDeleteOrder={handleDeleteOrder}
                  handleRestoreOrder={handleRestoreOrder}
                  handlePermanentDeleteOrder={handlePermanentDeleteOrder}
                 />
              )}

              

                            {/* Support tab */}
              {activeTab === 'support' && canSeeSupport && (
                <SupportTicketsTab
                  tenant={tenant}
                  dashboardColor={dashboardColor}
                 />
              )}
              
              {/* Customers tab */}
              {activeTab === 'customers' && canSeeCustomers && (
                <CustomersTab
                  tenant={tenant}
                  dashboardColor={dashboardColor}
                 />
              )}

              {/* Coupons & Shipping Fee Tab */}
              {activeTab === 'coupons' && canSeeCoupons && (
                <CouponsAndShippingManager
                  content={content}
                  setContent={setContent}
                  handleUpdateContent={handleUpdateContent}
                  showToast={showToast}
                 />
              )}
              
              {/* Settings Tab */}


              {activeTab === 'settings' && canSeeSettings && (
                <SettingsTab
                  templateId={templateId}
                  content={content}
                  setContent={setContent}
                  tenant={tenant}
                  setTenant={setTenant}
                  handleUpdateContent={handleUpdateContent}
                  handleResetHeroImage={handleResetHeroImage}
                  isSaving={isSaving}
                  isRestaurant={isRestaurant}
                  setActiveTab={safeSetActiveTab}
                  showToast={showToast}
                 />
              )}

              {/* CMS Pages & Posts Manager */}
              {activeTab === 'cms' && canSeeCms && <CmsManager />}

              {/* Audit Logs Viewer */}
              {activeTab === 'audit' && canSeeAudit && <AuditLogsViewer />}
              </>
)}

              {/* Legacy Settings (Hidden) */}
              {false && activeTab === 'settings' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-10">
                  
                  {/* Restaurant & Cafe Specific Operational Settings */}
                  {isRestaurant && (
                    <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <h3 className="font-black text-lg text-rose-400 flex items-center gap-2">
                            <span>🍽️</span> إعدادات التشغيل والطلبات (خاصة بالمطاعم والمقاهي)
                          </h3>
                          <p className="text-slate-400 text-xs mt-1">التحكم الفوري في إتاحة خيارات الطلب المباشر والتوصيل للعملاء.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Toggle Disable Ordering */}
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-white">إيقاف الطلبات والمبيعات (المنيو للعرض فقط)</div>
                            <div className="text-slate-400 text-xs mt-0.5">عند التفعيل، سيتم إخفاء سلة الشراء وزر الطلب وإبراز شارة "المنيو للعرض فقط".</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-4">
                            <input 
                              type="checkbox" 
                              checked={!!content?.disableOrdering} 
                              onChange={e => setContent({ ...content, disableOrdering: e.target.checked })}
                              className="sr-only peer"
                             />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>
                        </div>

                        {/* Toggle Disable Delivery */}
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-white">تعليق خدمة التوصيل</div>
                            <div className="text-slate-400 text-xs mt-0.5">عند التفعيل، سيظهر تنبيه بارز في أصل الصفحة يفيد بتوقف التوصيل حالياً.</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-4">
                            <input 
                              type="checkbox" 
                              checked={!!content?.disableDelivery} 
                              onChange={e => setContent({ ...content, disableDelivery: e.target.checked })}
                              className="sr-only peer"
                             />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                          </label>
                        </div>

                        {/* Delivery Message Input */}
                        {content?.disableDelivery && (
                          <div className="md:col-span-2 bg-slate-900 border border-slate-700 p-4 rounded-xl">
                            <label className="block text-xs font-bold text-slate-200 mb-2">رسالة توضيحية للعميل عند تعليق التوصيل</label>
                            <input 
                              type="text" 
                              value={content?.deliveryMessage || ''} 
                              onChange={e => setContent({ ...content, deliveryMessage: e.target.value })} 
                              placeholder="مثال: خدمة التوصيل تبدأ يومياً الساعة 04:00 عصراً"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-slate-500 font-medium"
                             />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* General Business Info */}
                  <div>
                    <h3 className="font-black text-lg text-slate-800 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                      <Globe className="text-rose-500"  />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">اسم المنشأة / العلامة التجارية</label>
                        <input 
                          type="text" 
                          value={content?.businessName || ''} 
                          onChange={e => setContent({...content, businessName: e.target.value, siteName: e.target.value})} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 text-slate-800 font-bold" 
                          placeholder="مثال: شاورما ومشاوي النخبة" 
                         />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">شعار المنشأة (Logo - رابط أو اختيار من المعرض)</label>
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                          <input 
                            type="text" 
                            value={content?.logoUrl || content?.logo || ''} 
                            onChange={e => setContent({...content, logoUrl: e.target.value, logo: e.target.value})} 
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 text-slate-700 font-mono text-xs" 
                            placeholder="https://..." 
                           />
                          <label className="cursor-pointer px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow shrink-0">
                            <Upload size={15}  />
                            <span>اختيار من المعرض 📱</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => handleImageFileRead(e, dataUrl => setContent({...content, logoUrl: dataUrl, logo: dataUrl}))} 
                             />
                          </label>
                          {(content?.logoUrl || content?.logo) && (
                            <div className="w-12 h-12 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow shrink-0 flex items-center justify-center">
                              <img src={content?.logoUrl || content?.logo} alt="Logo preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer"  />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2">العنوان والوصف الرئيسي للبانر (Hero Title)</label>
                          <input 
                            type="text" 
                            value={content?.heroTitle || ''} 
                            onChange={e => setContent({...content, heroTitle: e.target.value})} 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 font-bold" 
                            placeholder="مثال: الطعم الأصيل الذي تستحقه!" 
                           />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2">الوصف الفرعي للبانر (Hero Subtitle)</label>
                          <textarea 
                            value={content?.heroSubtitle || ''} 
                            onChange={e => setContent({...content, heroSubtitle: e.target.value})} 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 text-slate-600 text-xs resize-none" 
                            placeholder="اكتب وصفاً فرعياً جذاباً للبانر الرئيسي..."
                            rows={2}
                           />
                        </div>

                        {/* Hero Image Background Link + Gallery Picker + Restore Default Button */}
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="block text-xs font-bold text-slate-700">صورة خلفية القسم الرئيسي للبانر (Hero Background Image)</label>
                            <button
                              type="button"
                              onClick={handleRestoreOriginalHeroImage}
                              className="text-xs font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                            >
                              <span>🔄</span>
                              <span>استعادة خلفية القالب الأصلية</span>
                            </button>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <input 
                              type="text" 
                              value={content?.heroImage || content?.heroBgUrl || ''} 
                              onChange={e => setContent({...content, heroImage: e.target.value, heroBgUrl: e.target.value})} 
                              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-white text-slate-700 font-mono text-xs" 
                              placeholder="https://..." 
                              dir="ltr"
                             />
                            <label className="cursor-pointer px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow shrink-0">
                              <Upload size={15}  />
                              <span>اختيار خلفية من المعرض 🖼️</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={e => handleImageFileRead(e, dataUrl => setContent({...content, heroImage: dataUrl, heroBgUrl: dataUrl}))} 
                               />
                            </label>
                            {(content?.heroImage || content?.heroBgUrl) && (
                              <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-200 shadow shrink-0">
                                <img src={content?.heroImage || content?.heroBgUrl} alt="Hero preview" className="w-full h-full object-cover"  />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operation & WhatsApp Contacts */}
                  <div className="pt-8 border-t border-slate-100">
                    <h3 className="font-black text-lg text-slate-800 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                      <Phone className="text-rose-500"  />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">رقم الهاتف العام للمنشأة (للاتصال المباشر)</label>
                        <input 
                          type="text" 
                          value={content?.phoneNumber || ''} 
                          onChange={e => setContent({...content, phoneNumber: e.target.value})} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 text-slate-700 font-mono" 
                          placeholder="0500000000" 
                          dir="ltr"
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">رقم الواتساب لاستلام الطلبات (مهم جداً للربط السريع)</label>
                        <input 
                          type="text" 
                          value={content?.whatsappNumber || ''} 
                          onChange={e => setContent({...content, whatsappNumber: e.target.value})} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 text-slate-700 font-mono" 
                          placeholder="+966500000000" 
                          dir="ltr"
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">ساعات العمل اليومية</label>
                        <input 
                          type="text" 
                          value={content?.businessHours || ''} 
                          onChange={e => setContent({...content, businessHours: e.target.value})} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50" 
                          placeholder="مثال: يومياً من 12:00 ظهراً إلى 12:00 منتصف الليل" 
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">العنوان الجغرافي للمحل / الشركة</label>
                        <input 
                          type="text" 
                          value={content?.address || ''} 
                          onChange={e => setContent({...content, address: e.target.value})} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50" 
                          placeholder="مثال: الرياض، حي الياسمين، طريق الملك عبدالعزيز" 
                         />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-2">رابط خرائط جوجل للموقع (Google Maps Link)</label>
                        <input 
                          type="text" 
                          value={content?.googleMapsUrl || ''} 
                          onChange={e => setContent({...content, googleMapsUrl: e.target.value})} 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 text-slate-700 font-mono text-xs" 
                          placeholder="https://maps.google.com/..." 
                          dir="ltr"
                         />
                      </div>
                    </div>
                  </div>

                  {/* Visual Theme Protection Notice for Tenant */}
                  <div className="pt-8 border-t border-slate-100">
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
                          <span>🔒</span>
                          <span>إدارة الهوية البصرية والتنسيق البصري (محمية ومحسّنة)</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                          حفاظاً على هوية العلامة التجارية وأناقة القالب واستقراره البرمجي على جميع الشاشات، يتم ضبط الألوان الأساسية ونمط الخطوط والهيكل العام حصرية من قبل السوبر أدمن والإدارة الفنية.
                        </p>
                      </div>

                      {impersonateTenantId && (isTrueOwner || currentUserRole === 'super_admin' || currentUserRole === 'admin') ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/editor/${tenant.id}`)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition-all shadow-lg hover:scale-105 shrink-0 flex items-center gap-2"
                        >
                          <span>⚡</span>
                          <span>فتح محرر السوبر أدمن الشامل (God-Mode Editor)</span>
                        </button>
                      ) : (
                        <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-bold text-center shrink-0">
                          يرجى التواصل مع الدعم الفني لتعديل ألوان القالب
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Domain Settings */}
                  <div className="pt-8 border-t border-slate-100">
                    <h3 className="font-black text-lg text-slate-800 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                      <Globe className="text-rose-500"  />
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">الدومين المخصص المربوط بالموقع (Custom Domain)</label>
                      <input 
                        type="text" 
                        value={tenant?.customDomain || ''} 
                        onChange={e => setTenant({...tenant, customDomain: e.target.value})} 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 mb-2 text-slate-700 font-mono" 
                        placeholder="www.yourdomain.com" 
                        dir="ltr"
                       />
                      <p className="text-xs text-slate-500 mb-4">يرجى التأكد من ربط الدومين بنجاح وتوجيهه إلى السيرفر الخاص بنا قبل الحفظ.</p>
                      
                      <button onClick={async () => {
                        try {
                          const token = await auth.currentUser?.getIdToken();
                          const res = await fetch('/api/tenant/custom-domain', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
                            body: JSON.stringify({ customDomain: tenant?.customDomain })
                          });
                          if (res.ok) {
                            showToast('تم تحديث الدومين بنجاح');
                          }
                        } catch(e) { 
                          console.error(e); 
                          showToast('خطأ في تحديث الدومين');
                        }
                      }} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md text-sm">
                        تحديث الدومين المخصص
                      </button>
                    </div>
                  </div>

                  {/* Prominent Save All Changes Section */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/80 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center md:text-right">
                      <h4 className="font-black text-white text-lg flex items-center gap-2 justify-center md:justify-start">
                        <CheckCircle2 size={22} className="text-emerald-400"  />
                        جاهز لنشر وتطبيق التحديثات؟
                      </h4>
                      <p className="text-slate-300 text-xs md:text-sm">
                        اضغط على زر حفظ التغييرات لتطبيق خيارات التشغيل (إيقاف الطلبات/التوصيل) والهوية فوراً على موقعك المباشر.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateContent(false)}
                      disabled={isSaving}
                      style={{ backgroundColor: dashboardColor }}
                      className="w-full md:w-auto px-10 py-4 rounded-2xl font-black text-white text-base shadow-2xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0 cursor-pointer"
                    >
                      <CheckCircle2 size={20}  />
                      <span>{isSaving ? 'جاري الحفظ والتطبيق...' : 'حفظ جميع التغييرات الآن'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Staff & Team Management Tab */}
              {activeTab === 'staff' && canSeeStaff && (
                <StaffTab
                  staffList={staffList}
                  fetchStaff={fetchStaff}
                  handleAddStaff={handleAddStaff}
                  handleDeleteStaff={handleDeleteStaff}
                  addingStaffLoading={addingStaffLoading}
                  newStaffName={newStaffName}
                  setNewStaffName={setNewStaffName}
                  newStaffEmail={newStaffEmail}
                  setNewStaffEmail={setNewStaffEmail}
                  newStaffRole={newStaffRole}
                  setNewStaffRole={setNewStaffRole}
                  newStaffPermissions={newStaffPermissions}
                  setNewStaffPermissions={setNewStaffPermissions}
                 />
              )}

            </div>
          </div>
        </div>

      </div>

            {/* Modal Confirm Delete */}
      {deleteConfirm.idOrIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-right space-y-6">
            <h3 className="text-xl font-black text-slate-800">حذف العنصر</h3>
            <p className="text-slate-600 text-sm">هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ idOrIndex: null })}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors shadow-md"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Staff */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 text-right space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-indigo-600"  />
                إضافة موظف جديد لمتجرك
              </h3>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5"  />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد الموظف"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للموظف</label>
                <input
                  type="email"
                  required
                  placeholder="employee@example.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-left"
                  dir="ltr"
                 />
                <p className="text-[11px] text-slate-400 mt-1">عند تسجيل الموظف بهذا الإيميل سيتم تحويله تلقائياً للوحة التحكم الخاصة بك.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدور (Role)</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="staff">موظف عادي (Staff)</option>
                  <option value="tenant_admin">مشرف متجر (Tenant Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصلاحيات المتاحة للموظف</label>
                <select
                  value={newStaffPermissions}
                  onChange={(e) => setNewStaffPermissions(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="all">⚡ وصول شامل لكل الأقسام والإعدادات</option>
                  <option value="orders_only">📦 إدارة الطلبات والحجوزات فقط</option>
                  <option value="content_only">📝 تعديل المحتوى والمنتجات والمنيو فقط</option>
                  <option value="settings_only">⚙️ التحكم بالإعدادات والهوية فقط</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={addingStaffLoading}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {addingStaffLoading ? 'جاري الإضافة...' : 'حفظ وإضافة الموظف'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-black text-slate-800 text-lg">
                  {isLuxuryRestaurant
                    ? (editingItemIndex !== null ? 'تعديل بيانات الطبق الفاخر 🍽️' : 'إضافة طبق ملكي جديد للمنيو 🍽️👑')
                    : isFastFoodDelivery
                    ? (editingItemIndex !== null ? 'تعديل وجبة التوصيل السريع 🍔' : 'إضافة وجبة / عرض توصيل جديد 🍔⚡')
                    : isEcommerce 
                    ? (editingItemIndex !== null 
                        ? (isElectronicsStore ? 'تعديل منتج إلكتروني 📱' : isSkincareStore ? 'تعديل مستحضر العناية بالبشرة 🧴' : 'تعديل بيانات منتج البوتيك 👗') 
                        : (isElectronicsStore ? 'إضافة منتج إلكتروني جديد 📱' : isSkincareStore ? 'إضافة مستحضر عناية جديد 🧴' : 'إضافة منتج بوتيك جديد 👗'))
                    : (editingItemIndex !== null ? 'تعديل العنصر' : 'إضافة عنصر جديد')
                  }
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isLuxuryRestaurant
                    ? 'تحديد اسم الطبق، الكورس، السعرات الحرارية، المكونات ومسببات الحساسية.'
                    : isFastFoodDelivery
                    ? 'تحديد اسم الوجبة، الكومبو، السعر والعروض، وقت التوصيل وإضافات العرض السريع.'
                    : isEcommerce 
                    ? (isElectronicsStore ? 'قم بتعيين تفاصيل الجهاز، السعات، الألوان والمخزون.' : isSkincareStore ? 'قم بتعيين اسم المستحضر، نوع البشرة، المكونات، السعر والمخزون.' : 'قم بتعيين تفاصيل القطعة، صور المعرض، المقاسات، الألوان والمخزون.')
                    : 'أدخل البيانات المطلوبة للعنصر لتظهر فوراً في موقعك.'}
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-rose-500 bg-white shadow-sm p-2 rounded-full transition-colors cursor-pointer">
                <X size={20}  />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isLuxuryRestaurant ? 'اسم الطبق الفاخر *' : isFastFoodDelivery ? 'اسم وجبة التوصيل / الكومبو *' : isEcommerce ? (isElectronicsStore ? 'اسم الجهاز / المنتج *' : isSkincareStore ? 'اسم مستحضر العناية *' : 'اسم القطعة / المنتج *') : 'اسم العنصر (مثال: وجبة، منتج)'}
                </label>
                <input 
                  type="text" 
                  value={newItemForm.name || newItemForm.title || ''}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold"
                  placeholder={isLuxuryRestaurant ? "مثال: ستيك فيليه بلاك أنجوس بصلصة الكمأة السوداء" : isFastFoodDelivery ? "مثال: بيج أنجوس برجر كومبو عائلي مع البطاطس وصوص الشيدر" : isEcommerce ? (isElectronicsStore ? "مثال: آيفون 16 برو" : "مثال: فستان سهرة حرير بكسرات مطرزة") : "أدخل الاسم"}
                 />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">القسم / التصنيف</label>
                <input 
                  type="text" 
                  value={newItemForm.category || ''}
                  onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold mb-2"
                  placeholder={isLuxuryRestaurant ? "مثال: أطباق رئيسية ملكية، مقبلات فاخرة" : isFastFoodDelivery ? "مثال: عروض الكومبو السريعة، برجر وساندويتشات" : "مثال: فساتين، عبايات، إكسسوارات"}
                 />
                {isLuxuryRestaurant && (
                  <div className="flex flex-wrap gap-1.5">
                    {['أطباق رئيسية ملكية', 'مقبلات فاخرة', 'شوربات وحساء', 'سلطات موسمية', 'حلويات الشيف الخاصة', 'كوكتيلات ومشروبات فاخرة', 'قائمة الأطفال الخاصة'].map((cat, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setNewItemForm({ ...newItemForm, category: cat })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          newItemForm.category === cat 
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                {isFastFoodDelivery && (
                  <div className="flex flex-wrap gap-1.5">
                    {['عروض الكومبو السريعة', 'برجر وساندويتشات', 'وجبات عائلية', 'مقبلات وبطاطس', 'حلويات ومشروبات', 'صوصات جانبية'].map((cat, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setNewItemForm({ ...newItemForm, category: cat })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          newItemForm.category === cat 
                            ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
                {isEcommerce && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {categoriesList.map((cat, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            newItemForm.category === cat 
                              ? 'bg-pink-600 text-white border-pink-600 shadow-sm' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Custom Category Adder */}
                    <div className="flex gap-2 pt-1">
                      <input 
                        type="text" 
                        placeholder="أو اكتب قسم / تصنيف جديد (مثال: نظارات، أطفال، عطور سفر)..."
                        value={customCategoryInput}
                        onChange={e => setCustomCategoryInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCategory();
                          }
                        }}
                       />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        + إضافة قسم
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Discount / Stock / Calories / PrepTime */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">السعر الحالي (ر.س) *</label>
                  <input 
                    type="text" 
                    value={newItemForm.price || ''}
                    onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-black text-amber-600"
                    placeholder="180"
                   />
                </div>
                {isLuxuryRestaurant && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">السعرات الحرارية (كوكال)</label>
                      <input 
                        type="text" 
                        value={newItemForm.calories || ''}
                        onChange={e => setNewItemForm({ ...newItemForm, calories: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold"
                        placeholder="480"
                       />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">وقت التحضير المتوقع</label>
                      <input 
                        type="text" 
                        value={newItemForm.prepTime || ''}
                        onChange={e => setNewItemForm({ ...newItemForm, prepTime: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold"
                        placeholder="20 دقيقة"
                       />
                    </div>
                  </>
)}
                {isFastFoodDelivery && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">السعر قبل الخصم (اختياري)</label>
                      <input 
                        type="text" 
                        value={newItemForm.originalPrice || ''}
                        onChange={e => setNewItemForm({ ...newItemForm, originalPrice: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 text-sm text-slate-400 line-through"
                        placeholder="52"
                       />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">وقت التوصيل المتوقع</label>
                      <input 
                        type="text" 
                        value={newItemForm.deliveryTime || ''}
                        onChange={e => setNewItemForm({ ...newItemForm, deliveryTime: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 text-sm font-bold"
                        placeholder="15-25 دقيقة"
                       />
                    </div>
                  </>
)}
                {isEcommerce && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">السعر قبل الخصم (اختياري)</label>
                      <input 
                        type="text" 
                        value={newItemForm.originalPrice || ''}
                        onChange={e => setNewItemForm({ ...newItemForm, originalPrice: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-slate-50 text-sm text-slate-400 line-through"
                        placeholder="350"
                       />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">{isElectronicsStore ? 'كمية المخزون (وحدة/جهاز)' : 'كمية المخزون (قطعة)'}</label>
                      <input 
                        type="number" 
                        value={newItemForm.stock !== undefined ? newItemForm.stock : 10}
                        onChange={e => setNewItemForm({ ...newItemForm, stock: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-slate-50 text-sm font-bold text-center"
                        placeholder="10"
                       />
                    </div>
                  </>
)}
              </div>

              {/* Real Estate Specific Controls */}
              {isRealEstate && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-amber-900">تفاصيل ومواصفات العقار الإضافية 🏰</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الموقع الجغرافي (المدينة، الحي)</label>
                        <input 
                          type="text" 
                          value={newItemForm.location || ''}
                          onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
                          placeholder="مثال: حي الملقا، الرياض"
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">حالة العرض (للبيع / للإيجار)</label>
                        <input 
                          type="text" 
                          value={newItemForm.type || ''}
                          onChange={e => setNewItemForm({ ...newItemForm, type: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
                          placeholder="مثال: للبيع أو للإيجار السنوي"
                         />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">غرف النوم</label>
                        <input 
                          type="number" 
                          value={newItemForm.beds || 5}
                          onChange={e => setNewItemForm({ ...newItemForm, beds: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold text-center"
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">دورات المياه</label>
                        <input 
                          type="number" 
                          value={newItemForm.baths || 6}
                          onChange={e => setNewItemForm({ ...newItemForm, baths: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold text-center"
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">المساحة الإجمالية</label>
                        <input 
                          type="text" 
                          value={newItemForm.area || ''}
                          onChange={e => setNewItemForm({ ...newItemForm, area: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold text-center"
                          placeholder="مثال: 650 م²"
                         />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Construction Specific Controls */}
              {isConstruction && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-blue-900">تفاصيل ونطاق المشروع الهندسي 🏗️</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">العميل / الجهة المالكة</label>
                        <input 
                          type="text" 
                          value={newItemForm.client || ''}
                          onChange={e => setNewItemForm({ ...newItemForm, client: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
                          placeholder="مثال: شركة الأفق العقارية"
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">التكلفة / الميزانية التقديرية</label>
                        <input 
                          type="text" 
                          value={newItemForm.budget || ''}
                          onChange={e => setNewItemForm({ ...newItemForm, budget: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold text-amber-600"
                          placeholder="مثال: 850,000 ر.س"
                         />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">المدة الزمنية للتنفيذ</label>
                        <input 
                          type="text" 
                          value={newItemForm.duration || ''}
                          onChange={e => setNewItemForm({ ...newItemForm, duration: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
                          placeholder="مثال: 8 أشهر"
                         />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">الحالة / نسبة الإنجاز</label>
                        <input 
                          type="text" 
                          value={newItemForm.status || ''}
                          onChange={e => setNewItemForm({ ...newItemForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
                          placeholder="مثال: مكتمل 100% أو قيد التنفيذ (70%)"
                         />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fast Food Delivery Specific Controls */}
              {isFastFoodDelivery && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* Tags / Badges Selection */}
                  <div className="p-4 bg-red-50/60 border border-red-100 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-black text-slate-800">شارات العروض والتمييز السريع ⚡</label>
                      <span className="text-[11px] text-red-700 font-bold">
                        المحدد: {Array.isArray(newItemForm.tags) && newItemForm.tags.length > 0 ? newItemForm.tags.join(', ') : 'بدون شارات'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['توصيل مجاني 🛵', 'عرض ساخن 🔥', 'الأكثر مبيعاً 👑', 'وجبة كومبو 🍟', 'حار جداً 🌶️', 'حجم عائلي 👨‍👩‍👧‍👦'].map((tag, tIdx) => {
                        const isSelected = Array.isArray(newItemForm.tags) && newItemForm.tags.includes(tag);
                        return (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => handleToggleTagInForm(tag)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                                : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                            }`}
                          >
                            {tag} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Addons / Combo components textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">المحتويات والإضافات للوجبة (الكومبو)</label>
                    <textarea 
                      value={newItemForm.addons || ''}
                      onChange={e => setNewItemForm({ ...newItemForm, addons: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-slate-50 text-xs leading-relaxed resize-none h-20 font-medium"
                      placeholder="مثال: بطاطس مقرمشة حجم عائلي + كوكاكولا باردة سعة 1 لتر + صوص شيدر دافئ وصوص باربكيو"
                     />
                  </div>
                </div>
              )}

              {/* Luxury Restaurant Specific Controls */}
              {isLuxuryRestaurant && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {/* Chef Special Badge Toggle */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-black text-slate-800">توقيع الشيف (Signature Dish) ⭐</label>
                      <p className="text-[11px] text-slate-500">تمييز هذا الطبق كإبداع خاص وشديد التوصية في واجهة المنيو.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewItemForm({ ...newItemForm, isChefSpecial: !newItemForm.isChefSpecial })}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        newItemForm.isChefSpecial 
                          ? 'bg-amber-500 text-slate-950 shadow-md' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {newItemForm.isChefSpecial ? '⭐ طبق مميز مُفعّل' : 'غير مُفعّل'}
                    </button>
                  </div>

                  {/* Dietary & Allergens Selection */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-black text-slate-800">الخيارات الغذائية ومسببات الحساسية 🌾</label>
                      <span className="text-[11px] text-amber-700 font-bold">
                        المحدد: {Array.isArray(newItemForm.allergens) && newItemForm.allergens.length > 0 ? newItemForm.allergens.join(', ') : 'بدون مسببات'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['حلال 🥩', 'خالي من الجلوتين 🌾', 'خالي من اللكتوز 🥛', 'نباتي 🥗', 'يحتوي مكسرات 🥜', 'مأكولات بحرية 🐟'].map((alg, algIdx) => {
                        const isSelected = Array.isArray(newItemForm.allergens) && newItemForm.allergens.includes(alg);
                        return (
                          <button
                            key={algIdx}
                            type="button"
                            onClick={() => handleToggleAllergenInForm(alg)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                                : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            {alg} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ingredients list textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">المكونات الفاخرة المضافة للطبق</label>
                    <textarea 
                      value={newItemForm.ingredients || ''}
                      onChange={e => setNewItemForm({ ...newItemForm, ingredients: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-xs leading-relaxed resize-none h-20 font-medium"
                      placeholder="مثال: قطعتين من لحم بلاك أنجوس الفاخر مع صلصة الكمأة السوداء، صنوبر محمص وطماطم مجففة بأعشاب روزماري"
                     />
                  </div>
                </div>
              )}

              {/* Dynamic Sizes Selection & Toggle for Boutique / E-commerce */}
              {isEcommerce && (() => {
                const currentCategory = newItemForm.category || '';
                const isShoeCategory = currentCategory.includes('أحذية') || currentCategory.includes('شوز') || currentCategory.includes('جزم') || currentCategory.includes('صنادل') || currentCategory.includes('سنيكرز');
                const isAccessoryCategory = currentCategory.includes('عطور') || currentCategory.includes('مكياج') || currentCategory.includes('إكسسوارات') || currentCategory.includes('حقائب') || currentCategory.includes('ساعات');

                const suggestedSizes = isElectronicsStore 
                  ? ['128GB', '256GB', '512GB', '1TB', '2TB', '8GB RAM', '16GB RAM', '32GB RAM']
                  : (isShoeCategory 
                  ? ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']
                  : isAccessoryCategory
                  ? ['ون سايز / قياسي', '100ml', '50ml', 'حجم صغير', 'حجم وسط', 'حجم كبير']
                  : ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '52', '54', '56']);

                const allAvailableSizes = Array.from(new Set([...suggestedSizes, ...customSizesList]));
                const isSizesEnabled = newItemForm.enableSizes !== false;

                return (
                  <div className="p-4 bg-pink-50/40 border border-pink-100 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-pink-100/80">
                      <div>
                        <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <span>{isElectronicsStore ? 'السعات التخزينية والخيارات المتاحة 💾' : 'المقاسات والنمر المتاحة للقطعة 📏'}</span>
                          {isShoeCategory && (
                            <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              👟 نمر أحذية
                            </span>
                          )}
                          {isAccessoryCategory && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              ✨ أحجام وإكسسوارات
                            </span>
                          )}
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {isElectronicsStore ? 'يمكنك تفعيل خيار السعات أو إيقافه للأجهزة ذات السعة الموحدة، واختيار سعات أو كتابتها يدوياً.' : 'يمكنك تفعيل خيار المقاسات أو إيقافه للقطع ذات المقاس الموحد، واختيار مقاسات أو كتابتها يدوياً.'}
                        </p>
                      </div>

                      {/* Toggle sizes/storage switch */}
                      <button
                        type="button"
                        onClick={() => setNewItemForm((prev: any) => ({ ...prev, enableSizes: !isSizesEnabled }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          isSizesEnabled 
                            ? 'bg-pink-600 text-white shadow-sm' 
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {isSizesEnabled ? (isElectronicsStore ? '✓ السعات مفعّلة' : '✓ المقاسات مفعّلة') : (isElectronicsStore ? '✕ السعات معطّلة (قياسي)' : '✕ المقاسات معطّلة (قياسي)')}
                      </button>
                    </div>

                    {isSizesEnabled ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-700">{isElectronicsStore ? 'السعات المختارة:' : 'المقاسات المختارة:'}</span>
                          <span className="text-pink-700 font-black">
                            {Array.isArray(newItemForm.sizes) && newItemForm.sizes.length > 0 
                              ? newItemForm.sizes.join(' • ') 
                              : (isElectronicsStore ? 'لم يتم تحديد سعات بعد (انقر على الخيارات بالأسفل لتحديدها)' : 'لم يتم تحديد مقاسات بعد (انقر على المقاسات بالأسفل لتحديدها)')}
                          </span>
                        </div>

                        {/* Preset & Custom Sizes Chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {allAvailableSizes.map((sz, szIdx) => {
                            const isSelected = Array.isArray(newItemForm.sizes) && newItemForm.sizes.includes(sz);
                            return (
                              <button
                                key={szIdx}
                                type="button"
                                onClick={() => handleToggleSizeInForm(sz)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm' 
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300'
                                }`}
                              >
                                {sz} {isSelected && '✓'}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Size Adder ("بقدر اضيف يدوي اذا مش موجودة") */}
                        <div className="pt-2 border-t border-pink-100/60">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            إضافة مقاس جديد يدوي لم يوجد بالقائمة ✍️
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder={isElectronicsStore ? "اكتب السعة (مثال: 128GB, 16GB RAM)..." : "اكتب المقاس (مثال: 48, 75ml, Size 42, 40x30 cm)..."}
                              value={customSizeInput}
                              onChange={e => setCustomSizeInput(e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomSize();
                                }
                              }}
                             />
                            <button
                              type="button"
                              onClick={handleAddCustomSize}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                            >
                              {isElectronicsStore ? '+ إضافة السعة' : '+ إضافة المقاس'}
                            </button>
                          </div>
                        </div>

                        {Array.isArray(newItemForm.sizes) && newItemForm.sizes.length > 0 && (
                          <div className="pt-4 border-t border-slate-200 space-y-3">
                            <h4 className="text-xs font-bold text-slate-700">{isElectronicsStore ? 'كمية المخزون لكل سعة' : 'كمية المخزون لكل مقاس'}</h4>
                            {newItemForm.sizes.map((sz: string) => (
                              <div key={sz} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200">
                                <span className="text-xs font-bold text-slate-800">{sz}</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="الكمية"
                                  value={newItemForm.sizeStocks?.[sz] ?? ''}
                                  onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, sizeStocks: { ...(prev.sizeStocks || {}), [sz]: parseInt(e.target.value) || 0 } }))}
                                  className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-pink-500 text-center font-bold"
                                 />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100/90 rounded-xl text-center text-xs text-slate-600 font-bold border border-slate-200/60">
                        {isElectronicsStore ? '🔒 خيار تحديد السعات موقوف لهذا الجهاز. سيظهر في المتجر بسعة قياسية موحدة بدون مطالبة الزبون باختيار سعة.' : '🔒 خيار تحديد المقاسات موقوف لهذه القطعة. ستظهر في المتجر كمقاس قياسي موحد بدون مطالبة الزبون باختيار مقاس.'}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Dynamic Colors Selection for Boutique / E-commerce */}
              {isEcommerce && (
                <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-purple-100/80">
                    <div>
                      <label className="block text-xs font-black text-slate-800">الألوان المتاحة للمنتج 🎨</label>
                      <p className="text-[11px] text-slate-500 mt-0.5">اختر الألوان المتاحة أو أضف لوناً جديداً بالاسم والدرجة.</p>
                    </div>
                    <span className="text-[11px] text-purple-700 font-bold bg-purple-100/80 px-2.5 py-1 rounded-lg shrink-0">
                      المحدد: {Array.isArray(newItemForm.colors) && newItemForm.colors.length > 0 ? newItemForm.colors.join(' • ') : 'جميع الألوان'}
                    </span>
                  </div>

                  {/* Colors Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {colorsList.map((clr, clrIdx) => {
                      const isSelected = Array.isArray(newItemForm.colors) && newItemForm.colors.includes(clr);
                      return (
                        <button
                          key={clrIdx}
                          type="button"
                          onClick={() => handleToggleColorInForm(clr)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-purple-700 text-white border-purple-700 shadow-sm' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          {clr} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Color Adder ("الالوان بقدر اضيفها") */}
                  <div className="pt-2 border-t border-purple-100/60">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      إضافة لون جديد يدوي لم يوجد بالقائمة 🎨
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="اكتب اسم اللون (مثال: تيفاني، لؤلؤي، بني خشب، كاكاو)..."
                        value={customColorInput}
                        onChange={e => setCustomColorInput(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomColor();
                          }
                        }}
                       />
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        + إضافة اللون
                      </button>
                    </div>
                  </div>
                  
                  {Array.isArray(newItemForm.colors) && newItemForm.colors.length > 0 && (
                    <div className="pt-4 border-t border-purple-100/60 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700">تخصيص الصورة والمخزون لكل لون</h4>
                      {newItemForm.colors.map((clr: string) => (
                        <div key={clr} className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800">{clr}</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="المخزون"
                              value={newItemForm.colorStocks?.[clr] ?? ''}
                              onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, colorStocks: { ...(prev.colorStocks || {}), [clr]: parseInt(e.target.value) || 0 } }))}
                              className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 text-center font-bold"
                             />
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <input
                              type="text"
                              placeholder="رابط الصورة المخصصة للون"
                              value={newItemForm.colorImages?.[clr] ?? ''}
                              onChange={(e) => setNewItemForm((prev: any) => ({ ...prev, colorImages: { ...(prev.colorImages || {}), [clr]: e.target.value } }))}
                              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                              dir="ltr"
                             />
                            {newItemForm.colorImages?.[clr] && (
                              <img src={newItemForm.colorImages[clr]} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" alt={clr}  />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Main Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">الصورة الرئيسية للمنتج</label>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input 
                    type="text" 
                    value={newItemForm.image || ''}
                    onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-slate-50 text-xs font-mono text-left"
                    placeholder="https://..."
                    dir="ltr"
                   />
                  <label className="cursor-pointer px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow">
                    <Upload size={14}  />
                    <span>رفع من المعرض 📱</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleImageFileRead(e, dataUrl => setNewItemForm({ ...newItemForm, image: dataUrl }))} 
                     />
                  </label>
                </div>
                {newItemForm.image && (
                  <div className="mt-2.5 w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={newItemForm.image} alt="Main preview" className="w-full h-full object-cover"  />
                  </div>
                )}
              </div>

              {/* Multiple Gallery Images with Reordering & Deletion */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>معرض صور المنتج / العقار الإضافية 📸</span>
                      <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {Array.isArray(newItemForm.images) ? newItemForm.images.length : 0} صور
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      يمكنك رفع عدة صور دفعة واحدة، وإعادة ترتيب تسلسل الصور أو حذف أي صورة قبل الحفظ والاعتماد.
                    </p>
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-black text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 shadow">
                    <Upload size={14}  />
                    <span>رفع عدة صور دفعة واحدة 📱</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleMultipleImagesFileRead(e, urls => {
                        const currentImages = Array.isArray(newItemForm.images) ? newItemForm.images : [];
                        setNewItemForm({ ...newItemForm, images: [...currentImages, ...urls] });
                      })} 
                     />
                  </label>
                </div>

                {/* Existing gallery thumbnails list with Reordering & Delete */}
                {Array.isArray(newItemForm.images) && newItemForm.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {newItemForm.images.map((imgUrl: string, imgIdx: number) => {
                      const isMainCover = newItemForm.image === imgUrl;
                      return (
                        <div key={imgIdx} className={`relative group rounded-2xl overflow-hidden border bg-white shadow-sm flex flex-col transition-all ${isMainCover ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200'}`}>
                          <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                            <img src={imgUrl} alt={`Gallery image ${imgIdx + 1}`} className="w-full h-full object-cover"  />
                            <span className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                              #{imgIdx + 1}
                            </span>
                            {isMainCover && (
                              <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow">
                                الغلاف الرئيسي ⭐
                              </span>
                            )}
                          </div>

                          {/* Controls bar: Reorder Left/Right, Set as Cover, Delete */}
                          <div className="p-1.5 bg-slate-900/90 text-white flex items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={imgIdx === 0}
                                onClick={() => {
                                  const current = [...newItemForm.images];
                                  const temp = current[imgIdx];
                                  current[imgIdx] = current[imgIdx - 1];
                                  current[imgIdx - 1] = temp;
                                  setNewItemForm({ ...newItemForm, images: current });
                                }}
                                className="p-1 hover:bg-white/20 rounded disabled:opacity-20 cursor-pointer"
                                title="تحريك للخلف"
                              >
                                ◀
                              </button>
                              <button
                                type="button"
                                disabled={imgIdx === newItemForm.images.length - 1}
                                onClick={() => {
                                  const current = [...newItemForm.images];
                                  const temp = current[imgIdx];
                                  current[imgIdx] = current[imgIdx + 1];
                                  current[imgIdx + 1] = temp;
                                  setNewItemForm({ ...newItemForm, images: current });
                                }}
                                className="p-1 hover:bg-white/20 rounded disabled:opacity-20 cursor-pointer"
                                title="تحريك للأمام"
                              >
                                ▶
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setNewItemForm({ ...newItemForm, image: imgUrl })}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer shrink-0"
                            >
                              غلاف
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = newItemForm.images.filter((_: any, i: number) => i !== imgIdx);
                                setNewItemForm({ ...newItemForm, images: updated });
                              }}
                              className="p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded transition-colors cursor-pointer"
                              title="حذف الصورة"
                            >
                              <X size={12}  />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl text-xs">
                    لم تقم برفع صور إضافية بعد. يمكنك رفع عدة صور لمعاينتها وإعادة ترتيبها قبل النشر.
                  </div>
                )}
              </div>

              {/* Description & Fabric */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{isElectronicsStore ? 'المواصفات والوصف' : 'الوصف / المكونات وتفاصيل القماش'}</label>
                <textarea 
                  value={newItemForm.description || ''}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-slate-50 text-sm resize-none h-24"
                  placeholder={isElectronicsStore ? 'اكتب تفاصيل ومواصفات الجهاز أو المنتج' : 'اكتب تفاصيل القماش، القَصّة، الإرشادات أو الوصف العام للقطعة'}
                 />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                type="button"
                onClick={saveNewItem}
                style={{ backgroundColor: dashboardColor }}
                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
              >
                <Check size={18}  />
                {editingItemIndex !== null ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Site Switcher & All Templates Modal */}
      {showSiteSwitcherModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative my-8">
            <button 
              onClick={() => setShowSiteSwitcherModal(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20}  />
            </button>

            <div className="text-center space-y-2 mb-8">
              <div className="inline-flex p-3.5 bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg mb-1">
                <Globe size={30}  />
              </div>
              <h3 className="text-2xl font-black text-slate-900">إدارة مواقعك ومتاجرك</h3>
              <p className="text-slate-500 text-xs md:text-sm font-medium">
                اختر الموقع المطلوب للتحكم ببياناته وإعداداته:
              </p>
            </div>

            {/* Sites List */}
            {userSites && userSites.length > 0 && (
              <div className="mb-8 space-y-3">
                <h4 className="font-black text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <span>🏬</span>
                  <span>المواقع والامتدادات المربوطة بحسابك:</span>
                </h4>
                <div className="space-y-2.5 max-h-56 overflow-y-auto p-1">
                  {userSites.map((site: any, idx: number) => (
                    <div 
                      key={`dash-user-site-${site?.id || site?.subdomain || idx}`}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        tenant?.id === site?.id 
                          ? 'border-rose-500 bg-rose-50/50 shadow-md ring-2 ring-rose-500/20' 
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center shrink-0 shadow-sm text-sm">
                          {site?.name ? site.name.substring(0, 1) : '🏪'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{site?.name}</h4>
                          <p className="text-xs text-slate-500 font-mono truncate">{site?.customDomain || `${site?.subdomain || site?.id || 'demo'}.bunyan.website`}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          window.location.href = `/dashboard?impersonateTenantId=${site.id}`;
                        }}
                        className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all shrink-0 ${
                          tenant?.id === site.id 
                            ? 'bg-rose-600 text-white' 
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {tenant?.id === site.id ? 'النشط حالياً ✓' : 'دخول للتحكم '}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Templates Quick Switcher & Previewer - Admin/Owner Only */}
            {isTrueOwner && (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <span>👑</span>
                    <span>معاينة وتطبيق جميع إدارات القوالب (السوبر أدمن):</span>
                  </h4>
                  {previewTemplateId !== null && (
                    <button
                      onClick={() => {
                        setPreviewTemplateId(null);
                        setShowSiteSwitcherModal(false);
                        showToast('تم إلغاء المعاينة والعودة للقالب الأصلي');
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      إلغاء المعاينة الحالية
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {ALL_TEMPLATES.map((tpl, tplIdx) => {
                    const isCurrentlyActive = Number(templateId) === Number(tpl.id);
                    const isCurrentlyPreviewed = Number(tId) === Number(tpl.id) && previewTemplateId !== null;

                    return (
                      <div
                        key={`dash-tpl-${tpl.id || tplIdx}`}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                          isCurrentlyActive
                            ? 'border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                            : isCurrentlyPreviewed
                            ? 'border-amber-500 bg-amber-50/60 shadow-md ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl shrink-0 p-1.5 bg-white rounded-lg border border-slate-200">{tpl.icon}</span>
                            <div className="min-w-0">
                              <h5 className="font-black text-xs text-slate-900 truncate">{tpl.name}</h5>
                              <span className="text-[10px] text-slate-500 font-medium">{tpl.category}</span>
                            </div>
                          </div>
                          {isCurrentlyActive && (
                            <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
                              مُثبت ✓
                            </span>
                          )}
                          {isCurrentlyPreviewed && (
                            <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                              معاينة 👁️
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60">
                          <button
                            onClick={() => {
                              setPreviewTemplateId(tpl.id);
                              setShowSiteSwitcherModal(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              showToast(`جاري معاينة لوحة تحكم: ${tpl.name} 👁️`);
                            }}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                              isCurrentlyPreviewed
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                          >
                            <span>معاينة الإدارة</span>
                            <span>👁️</span>
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                const token = await auth.currentUser?.getIdToken();
                                const res = await fetch('/api/tenant/template', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(impersonateTenantId ? { 'x-impersonate-tenant-id': impersonateTenantId } : {}) },
                                  body: JSON.stringify({ templateId: tpl.id })
                                });
                                if (res.ok) {
                                  setTemplateId(tpl.id);
                                  setPreviewTemplateId(null);
                                  setShowSiteSwitcherModal(false);
                                  checkStatusAndFetchData(auth.currentUser);
                                  showToast(`تم تطبيق قالب: ${tpl.name} بنجاح 🎉`);
                                }
                              } catch(e) {
                                console.error(e);
                              }
                            }}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                              isCurrentlyActive
                                ? 'bg-emerald-600 text-white font-black opacity-80 cursor-default'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            <span>تثبيت للموقع</span>
                            <span>💾</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </div>
      )}

      {/* Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tenantName={tenant?.name || content?.businessName || (isBoutique ? 'بوتيك الأزياء الراقية' : isElectronicsStore ? 'متجر الأجهزة الإلكترونية' : 'متجري الخاص')}
        planName={getPlanTitleById(localStorage.getItem('selectedPlanId') || undefined)}
        amount={getPlanAmountById(localStorage.getItem('selectedPlanId') || undefined)}
        templateId={tenant?.templateId || 1}
        onSuccess={(details) => {
          handleUpdateContent(true);
          setSubscription((prev: any) => ({ ...prev, status: 'active', plan: details.plan }));
          showToast(`تم الدفع بنجاح عبر ${details.provider}! تم تفعيل اشتراك القالب والتعديلات. جاري الانتقال للقائمة الرئيسية... 🎉`);
          setTimeout(() => {
            setActiveTab('dashboard');
          }, 2000);
        }}
       />

      {/* Platform Native Clear Cache Confirmation Modal */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right">
            <button 
              type="button"
              onClick={() => setShowClearCacheModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">مسح ذاكرة البيانات المؤقتة</h3>
                <p className="text-xs text-amber-400 font-medium mt-0.5">تصفير التخزين المحلي والجلسات</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              هل أنت متأكد من مسح كافة بيانات الذاكرة المؤقتة والتخزين المحلي؟ سيتم إعادة تحميل المنصة فوراً بعد الإجراء.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  showToast('🧹 تم مسح الذاكرة بنجاح! جاري إعادة التحميل...');
                  setShowClearCacheModal(false);
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 800);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد مسح الذاكرة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400"  />
          <span className="text-sm">{toast}</span>
        </div>
      )}

      {/* QR Code Generator Modal */}
      <QRCodeModal
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
        siteName={tenant?.name || 'المتجر'}
        subdomain={tenant?.subdomain}
        customDomain={tenant?.customDomain}
      />
    </div>
  );
}
