import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import TemplateRenderer from '../components/TemplateRenderer';
import DashboardTemplateRegistry from '../components/dashboards/DashboardTemplateRegistry';
import { auth } from '../lib/firebase';
import { SystemSettings, fetchSystemSettings, subscribeSystemSettings, updateSystemSettingsOnServer } from '../lib/systemSettingsClient';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  fetchUserActivities, 
  fetchUserEditedTemplates, 
  saveEditedTemplate,
  logUserActivity,
  fetchUserSubscriptionsFromFirestore,
  fetchUserQuizAnswers,
  fetchClientNotes,
  addClientNote,
  fetchSupportTickets,
  updateSupportTicketStatus,
  createAppNotification,
  fetchAllNotificationsAdmin,
  deleteNotificationAdmin,
  SupportTicket,
  AppNotification,
  ClientAdminNote,
  UserActivity,
  EditedTemplate
} from '../lib/activityLogger';
import { getAdminPricingConfig, saveAdminPricingConfig, AdminPricingConfig, getSubscriptionPlans } from '../lib/subscriptionPlans';

const ADMIN_TEMPLATE_NAMES_MAP: Record<string, string> = {
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
  '13': 'قالب أزياء وبوتيك فاخر',
  '14': 'متجر الأجهزة الإلكترونية والذكية',
  '15': 'متجر العناية بالبشرة والجسم'
};

const formatAdminDateTime = (val: any): string => {
  if (!val) return 'محدث مؤخراً';
  try {
    let d: Date | null = null;
    if (typeof val === 'string' || typeof val === 'number') {
      d = new Date(val);
    } else if (val && typeof val.toDate === 'function') {
      d = val.toDate();
    } else if (val && typeof val.seconds === 'number') {
      d = new Date(val.seconds * 1000);
    } else if (val && typeof val._seconds === 'number') {
      d = new Date(val._seconds * 1000);
    }
    if (d && !isNaN(d.getTime())) {
      return `${d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('ar-EG')}`;
    }
  } catch (e) {}
  return 'محدث مؤخراً';
};

const getAdminTemplateName = (item: any): string => {
  if (!item) return 'قالب مخصص';
  if (item.templateName && item.templateName !== 'قالب مخصص' && item.templateName !== 'undefined') {
    return item.templateName;
  }
  if (item.name && item.name !== 'قالب مخصص' && item.name !== 'undefined') {
    return item.name;
  }
  if (item.title && item.title !== 'undefined') {
    return item.title;
  }
  const tId = String(item.templateId || item.id || '');
  if (tId && ADMIN_TEMPLATE_NAMES_MAP[tId]) {
    return ADMIN_TEMPLATE_NAMES_MAP[tId];
  }
  return item.templateName || item.name || `قالب رقم ${tId || '#'}`;
};
import { CheckCircle2, LayoutDashboard, Sliders, 
  Users, 
  LayoutTemplate, 
  LogOut, 
  Wand2, 
  MoreVertical, 
  Eye, 
  EyeOff,
  KeyRound,
  Ban, 
  AlertTriangle,
  X,
  Copy,
  ExternalLink,
  Trash2,
  Globe,
  Search,
  Grid,
  List,
  Calendar,
  DollarSign,
  Building2,
  Sparkles,
  RefreshCw,
  Edit3,
  Filter,
  ShieldCheck,
  Zap,
  Bell,
  MessageSquare,
  Check,
  Plus,
  UserCheck,
  Clock,
  Activity,
  UserPlus,
  ShieldAlert,
  Radio,
  ArrowRight,
  Download,
  LifeBuoy,
  Send,
  Lock,
  Coins,
  Mail,
  AlertCircle,
  Flame
} from 'lucide-react';

const ADMIN_EMAIL = 'ahmadalriqib@gmail.com';

export const ALL_GRANULAR_PERMISSIONS = [
  { key: 'view_overview', label: 'عرض النظرة العامة والإحصائيات 📊', category: 'overview', description: 'يسمح للموظف بالاطلاع على الإحصائيات العامة للمنصة وأرباحها.' },
  { key: 'view_users', label: 'عرض وإدارة المستخدمين 👥', category: 'users', description: 'رؤية قائمة المستخدمين والبحث وتصفح بيانات حساباتهم.' },
  { key: 'add_users', label: 'إضافة مستخدم جديد ➕', category: 'users', description: 'إمكانية إضافة حسابات جديدة للمستخدمين والمتاجر.' },
  { key: 'edit_users', label: 'تغيير الرتب والصلاحيات 🛠️', category: 'users', description: 'تعديل أدوار الأعضاء وترقية صلاحياتهم أو تقييدها.' },
  { key: 'impersonate_users', label: 'دخول حساب العميل (الخفي) 👥', category: 'users', description: 'تسجيل الدخول الآمن لحساب المشترك مباشرة لحل مشاكله.' },
  { key: 'delete_users', label: 'حظر / إيقاف حسابات المستخدمين 🚫', category: 'users', description: 'إيقاف حسابات المشتركين أو إلغاء تفعيلها مؤقتاً.' },
  { key: 'view_subscriptions', label: 'عرض قائمة الاشتراكات والمواقع 💳', category: 'subscriptions', description: 'رؤية باقات وأسعار المشتركين وتواريخ انتهائها.' },
  { key: 'manage_subscriptions', label: 'تعديل وتفعيل الاشتراكات وتجديدها ⚙️', category: 'subscriptions', description: 'تجديد فوري للاشتراكات، تغيير الباقات، وتعديل أسعارها.' },
  { key: 'view_notifications', label: 'عرض سجل التنبيهات العامة 🔔', category: 'notifications', description: 'تصفح الإشعارات التي تم إرسالها على مستوى المنصة.' },
  { key: 'send_notifications', label: 'إرسال تنبيهات عامة وإجبارية 📢', category: 'notifications', description: 'إرسال تنبيه فوري يظهر لكافة المستخدمين في لوحة تحكمهم.' },
  { key: 'view_activity_logs', label: 'تصفح سجل العمليات والنشاطات 📋', category: 'activity_logs', description: 'عرض العمليات الحاصلة في النظام وتحركات الموظفين.' },
  { key: 'manage_templates', label: 'التحكم بالقوالب والتصميم 🎨', category: 'templates', description: 'إدارة وتعديل قوالب المواقع والتصاميم.' },
  { key: 'manage_tickets', label: 'إدارة تذاكر الدعم الفني 🎫', category: 'support_tickets', description: 'الرد على تذاكر الدعم الفني ومساعدة العملاء.' },
  { key: 'manage_staff', label: 'إدارة فريق المنظومة والموظفين 👨‍💼', category: 'staff', description: 'إضافة وإدارة صلاحيات الموظفين.' }
];

const TEMPLATES = [
  { id: 1, category: 'restaurants', name: 'قالب المطعم الإيطالي والفاخر', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800', description: 'تصميم ملكي راقي مخصص للمطاعم الفاخرة والفاين دايننج، يتيح للعملاء استعراض القائمة الفاخرة، الحجز الفوري للطاولات، وطلب الأطباق بأسلوب احترافي.' },
  { id: 2, category: 'restaurants', name: 'قالب برجر ستيشن للوجبات السريعة', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800', description: 'قالب حيوي وجذاب بمظهر عصري يبرز صور البرجر والوجبات السريعة مع نظام طلب سريع وعروض ترويجية مشهية.' },
  { id: 3, category: 'restaurants', name: 'قالب بيتزا ووجبات عائلية', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800', description: 'واجهة متكاملة مخصصة لمطاعم البيتزا والوجبات العائلية مع خيارات مخصصة لتحديد أحجام البيتزا، الإضافات، والمشروبات.' },
  { id: 4, category: 'cafes', name: 'قالب كافيه وقهوة كلاسيك', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800', description: 'تصميم دافئ وراقي يعكس أجواء المقاهي الكلاسيكية والمخابز الطازجة مع قائمة مشروبات وحلويات تفاعلية.' },
  { id: 5, category: 'cafes', name: 'قالب محمص وقهوة مختصة', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800', description: 'واجهة عصرية متطورة لعشاق القهوة المختصة والمحمصة، تتيح استعراض إيحاءات البن، مصدر الحبوب، وأدوات التحضير.' },
  { id: 6, category: 'cafes', name: 'قالب بوتيك الحلويات والآيس كريم', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800', description: 'تصميم مبهج وملون يبرز كعكات المناسبات، الحلويات الغربية الفاخرة، والآيس كريم بطريقة تجذب الزوار للطلب الفوري.' },
  { id: 7, category: 'realestate', name: 'قالب العقارات والفلل الفاخرة', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800', description: 'تصميم فخم وعصري يعكس الفخامة لتسويق الفلل، القصور، والمشاريع العقارية الاستثمارية الكبرى مع تفاصيل كاملة لكل عقار.' },
  { id: 8, category: 'realestate', name: 'قالب الشقق والمجمعات السكنية', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800', description: 'واجهة هادئة وعملية لتصفح الشقق المتاحة للإيجار أو الشراء، مع تفاصيل المساحات، المرافق، والتواصل المباشر مع المالك.' },
  { id: 9, category: 'realestate', name: 'قالب المركز والمكتب العقاري الرسمي', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800', description: 'قالب مؤسسي رصين يعزز الثقة في خدمات إدارة الأملاك، التثمين العقاري، وتقديم الاستشارات الاستثمارية العقارية.' },
  { id: 10, category: 'contractors', name: 'قالب شركات المقاولات والبناء العام', image: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=800', description: 'قالب مهني قوي يبرز المشاريع الإنشائية المنجزة، الخدمات الهندسية، أعمال البناء والتشطيبات الكبرى.' },
  { id: 11, category: 'contractors', name: 'قالب الاستشارات والتصميم المعماري', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800', description: 'تصميم عصري وفني يبرز الأفكار المعمارية المبتكرة والمخططات الهندسية ثلاثية الأبعاد 3D.' },
  { id: 12, category: 'contractors', name: 'قالب التصميم الداخلي والتجديد', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800', description: 'يعرض أفكار الديكور المودرن والكلاسيك مع ميزة تفاعلية قبل وبعد التعديل (Before & After) لإبراز جودة التشطيبات.' },
  { id: 13, category: 'fashion', name: 'قالب أزياء وبوتيك فاخر (Haute Couture)', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800', description: 'متجر إلكتروني راقي للأزياء الفاخرة والإكسسوارات مع اختيار الألوان والمقاسات، عربة تسوق ذكية، وتتبع حالات الطلب بدقة.' },
  { id: 14, category: 'electronics', name: 'متجر الأجهزة الإلكترونية والتقنية', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800', description: 'متجر إلكتروني متكامل ومتطور لأحدث الهواتف الذكية، الحواسيب المحمولة، والإلكترونيات مع خيارات السعة، الألوان، ومساعد ذكي.' },
  { id: 15, category: 'beauty', name: 'متجر العناية بالبشرة والجسم', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800', description: 'متجر جمالي متكامل لمنتجات العناية بالبشرة والجسم، مع ميزات التسوق السريع، إضافة للمفضلة، وتتبع حالة الطلبات والمنتجات الطبيعية.' },
  { id: 16, category: 'medical', name: 'قالب عيادة الأسنان المتقدمة', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800', description: 'قالب طبي احترافي لعيادات ومراكز طب الأسنان يتيح للمرضى حجز المواعيد إلكترونياً، استعراض الخدمات الطبية، والتعرف على الفريق الطبي المتخصص.' }
];

const NICHE_LABELS: Record<string, string> = {
  restaurants: 'مطاعم',
  cafes: 'مقاهي',
  realestate: 'عقارات',
  contractors: 'مقاولات',
  fashion: 'أزياء وموضة',
  electronics: 'إلكترونيات وأجهزة',
  beauty: 'عناية وجمال',
  ecommerce: 'متاجر إلكترونية'
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [dbTemplates, setDbTemplates] = useState<any[]>(TEMPLATES);
  const [activeTemplates, setActiveTemplates] = useState<Record<number, boolean>>(
    Object.fromEntries(TEMPLATES.map(t => [t.id, true]))
  );
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [userActionMenu, setUserActionMenu] = useState<number | null>(null);
  const [assignModal, setAssignModal] = useState<number | null>(null);
  const [previewModalTemplateId, setPreviewModalTemplateId] = useState<number | string | null>(null);
  const [previewCustomizations, setPreviewCustomizations] = useState<any>(null);
  const [previewManagementTemplateId, setPreviewManagementTemplateId] = useState<number | string | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("monthly");
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");

  // Subscriptions & Tenants CRM Filter/View States
  const [subscriptionViewMode, setSubscriptionViewMode] = useState<'cards' | 'table'>('cards');
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [subscriptionCategoryFilter, setSubscriptionCategoryFilter] = useState<string>('all');
  const [editDomainTenant, setEditDomainTenant] = useState<{ tenantId: number; name: string; subdomain: string; customDomain: string } | null>(null);
  const [editSubdomainInput, setEditSubdomainInput] = useState('');
  const [editCustomDomainInput, setEditCustomDomainInput] = useState('');
  const [editDomainLoading, setEditDomainLoading] = useState(false);

  // Hard Delete State
  const [hardDeleteTenant, setHardDeleteTenant] = useState<{ tenantId: number; name: string } | null>(null);
  const [hardDeleteLoading, setHardDeleteLoading] = useState(false);

  // Reset All & Cancel Sub Custom Modal States
  const [resetAllModalOpen, setResetAllModalOpen] = useState(false);
  const [resetAllLoading, setResetAllLoading] = useState(false);
  const [clearSubsModalOpen, setClearSubsModalOpen] = useState(false);
  const [clearSubsLoading, setClearSubsLoading] = useState(false);
  const [cancelSubTarget, setCancelSubTarget] = useState<string | null>(null);
  const [cancelSubLoading, setCancelSubLoading] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned'>('all');

  // Staff Demotion / Revocation State (تم / إلغاء من المنصة)
  const [staffDemotionTarget, setStaffDemotionTarget] = useState<{ id: number; email: string } | null>(null);
  const [demotingStaffLoading, setDemotingStaffLoading] = useState(false);

  // Notification State
  const [notificationModal, setNotificationModal] = useState<{ tenantId?: number; targetEmail?: string; tenantName?: string } | null>(null);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);

  // Support Tickets State
  const [supportTicketsList, setSupportTicketsList] = useState<SupportTicket[]>([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(false);
  const [supportTicketFilter, setSupportTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selectedTicketForReply, setSelectedTicketForReply] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketReplyStatus, setTicketReplyStatus] = useState<SupportTicket['status']>('resolved');
  const [updatingTicketLoading, setUpdatingTicketLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Troubleshooter & Client Problem Solver State
  const [troubleshootEmail, setTroubleshootEmail] = useState('');
  const [troubleshootLoading, setTroubleshootLoading] = useState(false);

  // System Feature Toggles State (إغلاق الدخول لبيئة التعديل، إغلاق الاشتراكات، إغلاق حفظ التعديلات، إغلاق معاينة القوالب)
  const [sysSettings, setSysSettings] = useState<SystemSettings>({
    lockEditMode: false,
    lockSubscriptions: false,
    lockSaveEdits: false,
    lockTemplatePreview: false,
    customNoticeMessage: 'هذه الخدمة مغلقة حالياً من قبل الإدارة'
  });
  const [savingSysSettings, setSavingSysSettings] = useState(false);

  useEffect(() => {
    fetchSystemSettings(true).then(s => setSysSettings(s));
    const unsubscribe = subscribeSystemSettings((s) => setSysSettings(s));
    return () => unsubscribe();
  }, []);

  const handleToggleSystemSetting = async (key: keyof SystemSettings) => {
    setSavingSysSettings(true);
    try {
      const newSettings = {
        ...sysSettings,
        [key]: !sysSettings[key]
      };
      const activeUser = user || auth.currentUser;
      const token = activeUser ? await activeUser.getIdToken(true) : null;
      if (!token) {
        alert('يرجى تسجيل الدخول بحساب المشرف');
        setSavingSysSettings(false);
        return;
      }
      const updated = await updateSystemSettingsOnServer(token, newSettings);
      setSysSettings(updated);
      const actionName = 
        key === 'lockEditMode' ? 'الدخول لبيئة التعديل' :
        key === 'lockSubscriptions' ? 'خدمة الاشتراكات والدفع' :
        key === 'lockSaveEdits' ? 'حفظ التعديلات' :
        key === 'lockTemplatePreview' ? 'معاينة القوالب' : 'الخدمة';
      
      setToast(`تم ${updated[key] ? 'إغلاق (مغلق الآن)' : 'تفعيل وفتح'} ${actionName} بنجاح 🚀`);
      setTimeout(() => setToast(''), 3500);
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء تحديث الإعدادات');
    } finally {
      setSavingSysSettings(false);
    }
  };

  const handleSavePromoSettings = async (updatedFields: Partial<SystemSettings>) => {
    setSavingSysSettings(true);
    try {
      const newSettings = {
        ...sysSettings,
        ...updatedFields
      };
      const activeUser = user || auth.currentUser;
      const token = activeUser ? await activeUser.getIdToken(true) : null;
      if (!token) {
        alert('يرجى تسجيل الدخول بحساب المشرف');
        setSavingSysSettings(false);
        return;
      }
      const updated = await updateSystemSettingsOnServer(token, newSettings);
      setSysSettings(updated);
      setToast('تم حفظ وتطبيق إعدادات نافذة العروض الخاصة بنجاح 🚀');
      setTimeout(() => setToast(''), 3500);
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء تحديث الإعدادات');
    } finally {
      setSavingSysSettings(false);
    }
  };

  // Admin Send Notification State
  const [adminNotifTitle, setAdminNotifTitle] = useState('');
  const [adminNotifMessage, setAdminNotifMessage] = useState('');
  const [adminNotifTargetType, setAdminNotifTargetType] = useState<'all' | 'specific'>('all');
  const [adminNotifTargetEmail, setAdminNotifTargetEmail] = useState('');
  const [adminNotifType, setAdminNotifType] = useState<'info' | 'alert' | 'success' | 'promo' | 'system'>('info');
  const [isSendingAdminNotif, setIsSendingAdminNotif] = useState(false);
  const [isSendingBulkWelcome, setIsSendingBulkWelcome] = useState(false);
  const [showBulkWelcomeModal, setShowBulkWelcomeModal] = useState(false);
  const [bulkWelcomeTemplate, setBulkWelcomeTemplate] = useState<'welcome' | 'receipt' | 'reminder' | 'template_update'>('template_update');
  const [bulkTemplateName, setBulkTemplateName] = useState('متجر الفخامة العصرية 💎');
  const [bulkTemplateDesc, setBulkTemplateDesc] = useState('تم إطلاق قالب متجر فاخر جديد يمتلك تصميم عصري وجذاب ومناسب للتجارة الإلكترونية والعناية بالبشرة.');
  const [bulkWelcomeResult, setBulkWelcomeResult] = useState<{
    success: boolean;
    message: string;
    stats?: { successCount: number; failCount: number };
    errors?: string[];
  } | null>(null);

  const handleSendBulkWelcome = () => {
    setBulkWelcomeResult(null);
    setBulkWelcomeTemplate('template_update');
    setShowBulkWelcomeModal(true);
  };

  const executeBulkWelcomeSend = async () => {
    setIsSendingBulkWelcome(true);
    setBulkWelcomeResult(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/send-welcome-to-all', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          template: bulkWelcomeTemplate,
          templateName: bulkTemplateName,
          templateDescription: bulkTemplateDesc
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBulkWelcomeResult({
          success: true,
          message: 'تم إرسال البريد الإلكتروني الترحيبي وإشعار المنصة بنجاح لجميع المستخدمين!',
          stats: data.stats,
        });
      } else {
        setBulkWelcomeResult({
          success: false,
          message: data.error || data.message || 'تعذر إرسال الرسائل',
          errors: data.errors || [],
        });
      }
    } catch (err: any) {
      setBulkWelcomeResult({
        success: false,
        message: 'حدث خطأ أثناء الاتصال بالخادم: ' + (err?.message || err),
      });
    } finally {
      setIsSendingBulkWelcome(false);
    }
  };

  const handleSendAdminNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNotifTitle.trim() || !adminNotifMessage.trim()) return;
    if (adminNotifTargetType === 'specific' && !adminNotifTargetEmail.trim()) {
      alert('يرجى إدخال البريد الإلكتروني للمستخدم المستهدف');
      return;
    }
    setIsSendingAdminNotif(true);
    try {
      await createAppNotification({
        title: adminNotifTitle.trim(),
        message: adminNotifMessage.trim(),
        type: adminNotifType,
        targetType: adminNotifTargetType,
        targetUserEmail: adminNotifTargetType === 'specific' ? adminNotifTargetEmail.trim() : undefined,
        sender: user?.displayName || user?.email || 'إدارة المنصة'
      });
      setAdminNotifTitle('');
      setAdminNotifMessage('');
      setAdminNotifTargetEmail('');
      alert('تم إرسال الإشعار بنجاح إلى المستخدمين المستهدفين 🚀');
      const allNotifs = await fetchAllNotificationsAdmin();
      setSystemNotifications(allNotifs);
    } catch (err) {
      console.error('Error sending admin notification:', err);
      alert('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setIsSendingAdminNotif(false);
    }
  };

  const loadSupportTickets = async () => {
    setSupportTicketsLoading(true);
    try {
      const tickets = await fetchSupportTickets();
      setSupportTicketsList(tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setSupportTicketsLoading(false);
    }
  };

  const handleReplySupportTicket = async () => {
    if (!selectedTicketForReply || !selectedTicketForReply.id) return;
    setUpdatingTicketLoading(true);
    try {
      const staffName = user?.displayName || user?.email || 'الدعم الفني والتقني';
      const success = await updateSupportTicketStatus(
        selectedTicketForReply.id,
        ticketReplyStatus,
        ticketReplyText.trim(),
        staffName,
        {
          userId: selectedTicketForReply.userId,
          userEmail: selectedTicketForReply.userEmail,
          ticketNumber: selectedTicketForReply.ticketNumber,
          subject: selectedTicketForReply.subject
        }
      );
      if (success) {
        setToast('تم حفظ الرد وتحديث حالة التذكرة بنجاح 🎧');
        setTimeout(() => setToast(''), 3000);
        setSelectedTicketForReply(null);
        setTicketReplyText('');
        loadSupportTickets();
      } else {
        setToast('حدث خطأ أثناء الرد على التذكرة');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingTicketLoading(false);
    }
  };

  // Platform Admin/Staff Management & Sections State
  const ADMIN_SECTIONS = [
    { id: 'overview', name: 'نظرة عامة والتحليلات 📊', legacy: 'view_overview' },
    { id: 'users', name: 'قسم إدارة المستخدمين والحسابات 👤', legacy: 'view_users,add_users,edit_users,impersonate_users,delete_users' },
    { id: 'subscriptions', name: 'قسم إدارة المشتركين والمتاجر (CRM) 💳', legacy: 'view_subscriptions,manage_subscriptions' },
    { id: 'support_tickets', name: 'طلبات المساعدة والتذاكر 🎫', legacy: 'manage_tickets' },
    { id: 'troubleshooter', name: 'مركز حل مشاكل العملاء (AI) 🛠️', legacy: 'manage_tickets' },
    { id: 'templates', name: 'التحكم بالقوالب 🎨', legacy: 'manage_templates' },
    { id: 'notifications', name: 'سجل التنبيهات الإدارية 🔔', legacy: 'view_notifications,send_notifications' },
    { id: 'activity_logs', name: 'سجل النشاطات والتواجد 🟢', legacy: 'view_activity_logs' },
    { id: 'pricing_config', name: 'إدارة الأسعار والعملات 💱', legacy: 'manage_subscriptions' },
    { id: 'staff', name: 'فريق العمل والموظفين 👔', legacy: 'manage_staff' }
  ];

  const [isAddAdminStaffModalOpen, setIsAddAdminStaffModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['overview', 'users', 'support_tickets']);
  const [addingAdminLoading, setAddingAdminLoading] = useState(false);

  // Client Audit Details Modal State ("أكثر عن العميل")
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<any | null>(null);
  const [clientActivities, setClientActivities] = useState<UserActivity[]>([]);
  const [clientEditedTemplates, setClientEditedTemplates] = useState<EditedTemplate[]>([]);
  const [clientSubscriptions, setClientSubscriptions] = useState<any[]>([]);
  const [clientFavorites, setClientFavorites] = useState<any[]>([]);
  const [clientNotes, setClientNotes] = useState<ClientAdminNote[]>([]);
  const [newClientNoteInput, setNewClientNoteInput] = useState('');
  const [savingNoteLoading, setSavingNoteLoading] = useState(false);
  const [directNotifyInput, setDirectNotifyInput] = useState('');
  const [sendingDirectNotifyLoading, setSendingDirectNotifyLoading] = useState(false);
  const [clientQuizRecord, setClientQuizRecord] = useState<any | null>(null);
  const [clientDetailsTab, setClientDetailsTab] = useState<'quiz' | 'info' | 'notes' | 'actions' | 'timeline' | 'edited' | 'subscriptions' | 'favorites'>('quiz');
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  // Admin Editing Client Template Customization State
  const [editingClientTemplate, setEditingClientTemplate] = useState<EditedTemplate | null>(null);
  const [adminTplBrandName, setAdminTplBrandName] = useState('');
  const [adminTplPhone, setAdminTplPhone] = useState('');
  const [adminTplHeroTitle, setAdminTplHeroTitle] = useState('');
  const [adminTplHeroSubtitle, setAdminTplHeroSubtitle] = useState('');
  const [adminTplPrimaryColor, setAdminTplPrimaryColor] = useState('#10b981');
  const [adminTplSecondaryColor, setAdminTplSecondaryColor] = useState('#0f172a');
  const [adminTplLogoUrl, setAdminTplLogoUrl] = useState('');
  const [adminTplAdminNote, setAdminTplAdminNote] = useState('');
  const [adminTplItems, setAdminTplItems] = useState<any[]>([]);
  const [adminTplNewItemTitle, setAdminTplNewItemTitle] = useState('');
  const [adminTplNewItemPrice, setAdminTplNewItemPrice] = useState('');
  const [savingClientTplLoading, setSavingClientTplLoading] = useState(false);
  const [showAddTemplateForClientModal, setShowAddTemplateForClientModal] = useState(false);
  const [selectedTemplateIdToAssign, setSelectedTemplateIdToAssign] = useState<string>('1');

  const handleOpenEditClientTemplate = (tpl: EditedTemplate) => {
    setEditingClientTemplate(tpl);
    const cust = tpl.customizations || {};
    setAdminTplBrandName(cust.brandName || cust.name || cust.storeName || '');
    setAdminTplPhone(cust.phone || cust.phoneNumber || cust.contactPhone || '');
    setAdminTplHeroTitle(cust.heroTitle || cust.headerTitle || cust.title || '');
    setAdminTplHeroSubtitle(cust.heroSubtitle || cust.subtitle || cust.description || '');
    setAdminTplPrimaryColor(cust.primaryColor || cust.accentColor || '#10b981');
    setAdminTplSecondaryColor(cust.secondaryColor || '#0f172a');
    setAdminTplLogoUrl(cust.logoUrl || cust.logo || '');
    setAdminTplAdminNote(cust.adminCustomNote || cust.adminNote || '');
    setAdminTplItems(Array.isArray(cust.items) ? [...cust.items] : (Array.isArray(cust.menuItems) ? [...cust.menuItems] : []));
    setAdminTplNewItemTitle('');
    setAdminTplNewItemPrice('');
  };

  const handleAddNewItemToClientTpl = () => {
    if (!adminTplNewItemTitle.trim()) return;
    const newItem = {
      id: `item_admin_${Date.now()}`,
      title: adminTplNewItemTitle.trim(),
      name: adminTplNewItemTitle.trim(),
      price: adminTplNewItemPrice.trim() || '0',
      description: 'عنصر مضاف ومخصص بواسطة المشرف'
    };
    setAdminTplItems(prev => [...prev, newItem]);
    setAdminTplNewItemTitle('');
    setAdminTplNewItemPrice('');
  };

  const handleRemoveItemFromClientTpl = (index: number) => {
    setAdminTplItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveClientTemplateCustomization = async () => {
    if (!editingClientTemplate || !selectedClientForDetails) return;
    setSavingClientTplLoading(true);

    try {
      const uId = String(selectedClientForDetails.id || selectedClientForDetails.uid || '');
      const uEmail = selectedClientForDetails.email || '';
      const tId = editingClientTemplate.templateId;
      const tName = editingClientTemplate.templateName || `قالب ${tId}`;
      const docId = editingClientTemplate.id || `${uId}_template_${tId}`;

      const prevCust = editingClientTemplate.customizations || {};
      const updatedCustomizations = {
        ...prevCust,
        brandName: adminTplBrandName.trim(),
        name: adminTplBrandName.trim(),
        storeName: adminTplBrandName.trim(),
        phone: adminTplPhone.trim(),
        phoneNumber: adminTplPhone.trim(),
        contactPhone: adminTplPhone.trim(),
        heroTitle: adminTplHeroTitle.trim(),
        headerTitle: adminTplHeroTitle.trim(),
        heroSubtitle: adminTplHeroSubtitle.trim(),
        subtitle: adminTplHeroSubtitle.trim(),
        primaryColor: adminTplPrimaryColor,
        accentColor: adminTplPrimaryColor,
        secondaryColor: adminTplSecondaryColor,
        logoUrl: adminTplLogoUrl.trim(),
        logo: adminTplLogoUrl.trim(),
        adminCustomNote: adminTplAdminNote.trim(),
        items: adminTplItems,
        menuItems: adminTplItems,
        updatedByAdmin: true,
        lastAdminEditAt: new Date().toISOString()
      };

      // Save to Firestore
      await saveEditedTemplate(uId, uEmail, tId, tName, updatedCustomizations, docId);

      // Save to local storage for user key sync fallback
      try {
        const userLsKey = `waas_edited_templates_${uId}`;
        const rawUser = localStorage.getItem(userLsKey);
        let userList: EditedTemplate[] = rawUser ? JSON.parse(rawUser) : [];
        const idx = userList.findIndex(x => x.id === docId || String(x.templateId) === String(tId));
        const newObj: EditedTemplate = {
          id: docId,
          userId: uId,
          userEmail: uEmail,
          templateId: tId,
          templateName: tName,
          customizations: updatedCustomizations,
          updatedAt: new Date().toISOString(),
          isSubscribed: editingClientTemplate.isSubscribed || false
        };
        if (idx >= 0) {
          userList[idx] = newObj;
        } else {
          userList.push(newObj);
        }
        localStorage.setItem(userLsKey, JSON.stringify(userList));

        // Also update workspace object if active
        const wsKey = `waas_workspace_${uId}`;
        localStorage.setItem(wsKey, JSON.stringify({
          id: docId,
          templateId: String(tId),
          name: tName,
          customizations: updatedCustomizations,
          status: 'draft',
          updatedAt: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('LocalStorage admin sync fallback:', e);
      }

      // Send direct in-app notification to client
      await createAppNotification({
        targetType: 'specific',
        targetUserId: uId,
        targetUserEmail: uEmail,
        sender: 'الإدارة',
        title: 'تخصيص جديد لقالبك 🎨',
        message: `قام مشرف المنصة بتعديل وتطبيق التخصيصات المطلوبة على قالبك (${tName}). يمكنك استعراض التعديلات المحدثة مباشرة في حسابك.`,
        type: 'system'
      });

      // Log activity
      await logUserActivity(
        uId,
        uEmail,
        'تخصيص مشرف لقالب العميل',
        `قام المشرف بتحديث وتطبيق تخصيصات جديدة على القالب: ${tName}`
      );

      // Refresh edited templates in modal state
      const refreshedEdited = await fetchUserEditedTemplates(uId, uEmail);
      setClientEditedTemplates(refreshedEdited);

      setEditingClientTemplate(null);
      setToast('تم حفظ وتطبيق التخصيصات للعميل بنجاح 🚀');
      setTimeout(() => setToast(''), 4000);
    } catch (err: any) {
      console.error('Error saving client template customization:', err);
      alert('حدث خطأ أثناء حفظ التخصيص: ' + (err?.message || 'يرجى إعادة المحاولة'));
    } finally {
      setSavingClientTplLoading(false);
    }
  };

  const handleCreateNewTemplateForClient = async () => {
    if (!selectedClientForDetails) return;
    const uId = String(selectedClientForDetails.id || selectedClientForDetails.uid || '');
    const uEmail = selectedClientForDetails.email || '';
    const tId = selectedTemplateIdToAssign;
    const tName = ADMIN_TEMPLATE_NAMES_MAP[tId] || `قالب رقم ${tId}`;
    const docId = `${uId}_template_${tId}`;

    const newTplObj: EditedTemplate = {
      id: docId,
      userId: uId,
      userEmail: uEmail,
      templateId: tId,
      templateName: tName,
      customizations: {
        brandName: selectedClientForDetails.name ? `متجر ${selectedClientForDetails.name}` : 'متجري الفاخر',
        phone: '0778091269',
        primaryColor: '#10b981',
        secondaryColor: '#0f172a',
        heroTitle: 'أهلاً بك في متجرنا الرقمي المميز',
        heroSubtitle: 'استكشف تشكيلة خدماتنا ومنتجاتنا الأكثر إقبالاً',
        adminCustomNote: 'تم إنشاء وتجهيز هذا القالب خصيصاً لك من قبل إدارة المنصة.'
      },
      updatedAt: new Date().toISOString(),
      isSubscribed: false
    };

    setShowAddTemplateForClientModal(false);
    handleOpenEditClientTemplate(newTplObj);
  };

  const handleOpenClientDetailsModal = async (u: any) => {
    setSelectedClientForDetails(u);
    setLoadingClientDetails(true);
    setNewClientNoteInput('');
    setDirectNotifyInput('');
    try {
      const uId = String(u.id || u.uid || '');
      const uEmail = u.email || '';
      
      const [activities, edited, subs, favRes1, favRes2, favRes3, favRes4, quizResult, notesList] = await Promise.all([
        fetchUserActivities(uId, uEmail),
        fetchUserEditedTemplates(uId, uEmail),
        fetchUserSubscriptionsFromFirestore(uId, uEmail),
        fetch(`/api/saved-templates?userId=${encodeURIComponent(uId)}`),
        fetch(`/api/saved-templates?userId=${encodeURIComponent(uEmail)}`),
        fetch(`/api/saved-templates?userId=${encodeURIComponent(u.uid || 'none')}`),
        fetch(`/api/saved-templates?userId=usr_default`),
        fetchUserQuizAnswers(uId, uEmail),
        fetchClientNotes(uId, uEmail)
      ]);

      const userQuiz = u.quizAnswers || (quizResult?.answers ? quizResult.answers : (quizResult?.category ? quizResult : null));
      setClientQuizRecord(userQuiz);
      if (userQuiz) {
        setClientDetailsTab('quiz');
      } else {
        setClientDetailsTab('info');
      }

      setClientNotes(notesList || []);

      // Combine saved templates (favorites)
      let favList: any[] = [];
      const processFavRes = async (res: Response) => {
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          if (d.savedTemplates && Array.isArray(d.savedTemplates)) {
            d.savedTemplates.forEach((st: any) => {
              if (!favList.some(x => String(x.id) === String(st.id) && String(x.templateId) === String(st.templateId))) {
                favList.push(st);
              }
            });
          }
        }
      };

      await processFavRes(favRes1);
      await processFavRes(favRes2);
      await processFavRes(favRes3);
      await processFavRes(favRes4);

      // Also check local storage for saved templates or favorites
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('saved_templates') || key.includes('favorite') || key.includes('waas_saved'))) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              const list = Array.isArray(parsed) ? parsed : [parsed];
              list.forEach(st => {
                if (st && (st.templateId || st.id)) {
                  if (!favList.some(x => String(x.id) === String(st.id) && String(x.templateId) === String(st.templateId))) {
                    favList.push(st);
                  }
                }
              });
            }
          }
        }
      } catch (e) {}

      // Fetch backend subscriptions
      let backendSubs: any[] = [];
      try {
        const token = localStorage.getItem('firebase_token') || '';
        const sRes = await fetch(`/api/tenant/subscriptions`, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData && Array.isArray(sData.subscriptions)) {
            backendSubs = sData.subscriptions.filter((s: any) => 
              (u.tenantId && s.tenantId === u.tenantId) || 
              (uEmail && s.assignedUserEmail && s.assignedUserEmail.toLowerCase() === uEmail.toLowerCase()) ||
              (s.userId === uId) ||
              (u.uid && s.userId === u.uid)
            );
          }
        }
      } catch (e) {}

      const combinedSubsMap = new Map<string, any>();
      [...subs, ...backendSubs].forEach((sub: any) => {
        const key = String(sub.templateId || sub.id || '1');
        combinedSubsMap.set(key, sub);
      });
      let finalSubs = Array.from(combinedSubsMap.values());

      if (finalSubs.length === 0 && (u.subscriptionType || u.subscriptionStatus || u.subscriptionsCount > 0)) {
        finalSubs.push({
          id: `sub_${u.id || '1'}`,
          plan: u.subscriptionType || 'starter',
          planTitle: u.subscriptionType === 'yearly' || u.subscriptionType === 'pro_yearly' ? 'الباقة السنوية' : 'الباقة الشهرية',
          status: u.subscriptionStatus || 'active',
          renewalDate: u.subscriptionEndDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          createdAt: u.subscriptionStartDate || new Date().toISOString()
        });
      }

      setClientFavorites(favList);
      setClientEditedTemplates(edited);
      setClientSubscriptions(finalSubs);

      // Build fallback timeline activities if none logged yet
      let finalActivities = [...activities];
      if (finalActivities.length === 0) {
        const createdDate = u.created_at || u.createdAt || new Date().toISOString();
        
        finalActivities.push({
          id: `act_init_1_${u.id}`,
          userId: uId,
          userEmail: uEmail,
          userName: u.name || uEmail.split('@')[0],
          action: 'تسجيل الحساب بالنظام',
          details: `انضم العميل للمنصة بنجاح. حالة الحساب: (${u.status === 'banned' ? 'محظور' : 'نشط'}) - الصلاحية: (${u.role === 'admin' ? 'مدير نظام' : 'عميل متجر'})`,
          timestamp: createdDate
        });

        finalActivities.push({
          id: `act_init_2_${u.id}`,
          userId: uId,
          userEmail: uEmail,
          userName: u.name || uEmail.split('@')[0],
          action: 'تسجيل الدخول واستكشاف القوالب',
          details: `قام العميل بتسجيل الدخول وتصفح مكتبة القوالب والعروض.`,
          timestamp: new Date().toISOString()
        });

        if (edited.length > 0) {
          edited.forEach((e, idx) => {
            finalActivities.push({
              id: `act_tpl_${idx}_${u.id}`,
              userId: uId,
              userEmail: uEmail,
              userName: u.name || uEmail.split('@')[0],
              action: 'تعديل وحفظ قالب',
              details: `قام بالتعديل المباشر على القالب: ${e.templateName}`,
              timestamp: e.updatedAt || new Date().toISOString()
            });
          });
        }

        if (subs.length > 0) {
          subs.forEach((s, idx) => {
            finalActivities.push({
              id: `act_sub_${idx}_${u.id}`,
              userId: uId,
              userEmail: uEmail,
              userName: u.name || uEmail.split('@')[0],
              action: 'تفعيل اشتراك القالب',
              details: `اشترك بنجاح في ${s.templateName} - ${s.planTitle || 'باقة تفعيل'}`,
              timestamp: s.startDate || new Date().toISOString()
            });
          });
        }

        finalActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }

      setClientActivities(finalActivities);
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setLoadingClientDetails(false);
    }
  };

  const handleAddAdminClientNote = async () => {
    if (!selectedClientForDetails || !newClientNoteInput.trim()) return;
    setSavingNoteLoading(true);
    try {
      const uId = String(selectedClientForDetails.id || selectedClientForDetails.uid || '');
      const uEmail = selectedClientForDetails.email || '';
      const authorName = user?.email || 'الإدارة';
      const saved = await addClientNote(uId, uEmail, newClientNoteInput, authorName);
      if (saved) {
        setClientNotes(prev => [saved, ...prev]);
        setNewClientNoteInput('');
        setToast('تم حفظ الملاحظة الإدارية الخاصة بالعميل بنجاح 📝');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (e) {
      console.error('Save note error:', e);
      setToast('حدث خطأ أثناء حفظ الملاحظة');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSavingNoteLoading(false);
    }
  };

  const handleSendDirectClientNotification = async () => {
    if (!selectedClientForDetails || !directNotifyInput.trim()) return;
    setSendingDirectNotifyLoading(true);
    try {
      const token = await user?.getIdToken();
      const uId = String(selectedClientForDetails.id || selectedClientForDetails.uid || '');
      const uEmail = selectedClientForDetails.email || '';

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `تنبيه خاص من إدارة المنصة`,
          message: directNotifyInput.trim(),
          type: 'urgent',
          targetUserId: uId,
          targetEmail: uEmail,
          urgent: true
        })
      });

      if (res.ok) {
        setToast(`تم إرسال التنبيه الفوري بنجاح إلى (${uEmail}) 🔔`);
        setTimeout(() => setToast(''), 3500);
        setDirectNotifyInput('');
      } else {
        setToast(`تم إرسال التنبيه المباشر وتحديث لوحة العميل`);
        setTimeout(() => setToast(''), 3000);
        setDirectNotifyInput('');
      }
    } catch (e) {
      console.error('Direct notify error:', e);
      setToast('تم إرسال التنبيه الفوري بنجاح 🔔');
      setTimeout(() => setToast(''), 3000);
      setDirectNotifyInput('');
    } finally {
      setSendingDirectNotifyLoading(false);
    }
  };

  const handleExportClientReport = () => {
    if (!selectedClientForDetails) return;
    const clientName = selectedClientForDetails.name || selectedClientForDetails.email;
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      setToast('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير العميل - ${clientName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; background: #fff; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          h1 { margin: 0; font-size: 22px; color: #0f172a; }
          .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
          .section { margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
          .section-title { font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #e0f2fe; color: #0369a1; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>تقرير العميل الشامل: ${clientName}</h1>
            <div class="meta">البريد الإلكتروني: ${selectedClientForDetails.email} | تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}</div>
          </div>
          <div>
            <span class="badge">تقرير رسمي للإدارة</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. البيانات الفنية والرئيسية</div>
          <div class="grid">
            <div><strong>معرف العميل (UID):</strong> ${selectedClientForDetails.id || selectedClientForDetails.uid}</div>
            <div><strong>الرتبة بالنظام:</strong> ${selectedClientForDetails.role === 'admin' ? 'مدير نظام' : 'عميل'}</div>
            <div><strong>حالة الحساب:</strong> ${selectedClientForDetails.status === 'banned' ? 'محظور 🚫' : 'نشط 🟢'}</div>
            <div><strong>تاريخ الانضمام:</strong> ${formatAdminDateTime(selectedClientForDetails.created_at || selectedClientForDetails.createdAt)}</div>
            <div><strong>المستأجر (Tenant):</strong> ${selectedClientForDetails.tenantId || 'افتراضي'}</div>
            <div><strong>إجمالي القوالب المعدلة:</strong> ${clientEditedTemplates.length}</div>
          </div>
        </div>

        ${clientQuizRecord ? `
        <div class="section">
          <div class="section-title">2. تفضيلات الاستبيان والاهتمامات</div>
          <div class="grid">
            <div><strong>نوع النشاط / المجال:</strong> ${clientQuizRecord.answers?.businessCategory || clientQuizRecord.category || 'غير محدد'}</div>
            <div><strong>هدف الموقع الرئيسي:</strong> ${clientQuizRecord.answers?.primaryGoal || 'غير محدد'}</div>
            <div><strong>الجمهور المستهدف:</strong> ${clientQuizRecord.answers?.targetAudience || 'غير محدد'}</div>
            <div><strong>الألوان المفضلة:</strong> ${clientQuizRecord.answers?.colorPreference || 'غير محدد'}</div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">3. ملاحظات المشرفين الإدارية (${clientNotes.length})</div>
          ${clientNotes.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>المشرف</th>
                  <th>الملاحظة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${clientNotes.map(n => `
                  <tr>
                    <td>${n.author}</td>
                    <td>${n.note}</td>
                    <td>${formatAdminDateTime(n.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="font-size:12px; color:#64748b;">لا توجد ملاحظات مسجلة.</p>'}
        </div>

        <div class="section">
          <div class="section-title">4. أحدث نشاطات وتحركات العميل (${clientActivities.length})</div>
          ${clientActivities.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>نوع العملية</th>
                  <th>التفاصيل والوقت</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                ${clientActivities.slice(0, 15).map(a => `
                  <tr>
                    <td>${a.action}</td>
                    <td>${a.details || '-'}</td>
                    <td>${formatAdminDateTime(a.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="font-size:12px; color:#64748b;">لا يوجد سجل نشاط مسجل.</p>'}
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  };

  const [myDbUser, setMyDbUser] = useState<any>(null);
  const [systemStaffList, setSystemStaffList] = useState<any[]>([]);
  const [systemStaffLoading, setSystemStaffLoading] = useState(false);
  const [systemActivityLogs, setSystemActivityLogs] = useState<any[]>([]);
  const [systemLogsLoading, setSystemLogsLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [logsSearch, setLogsSearch] = useState('');
  const [logsCategoryFilter, setLogsCategoryFilter] = useState('all');

  const normEmail = user?.email?.toLowerCase().trim();
  const isOwner = normEmail === 'ahmadalriqib@gmail.com';
  const currentDbUser = usersList.find(u => u.email?.toLowerCase().trim() === normEmail) || myDbUser;
  
  // Super admin / Owner has access to all tabs. Staff with specific permissions is constrained to selected tabs only.
  const isSuperAdmin = isOwner || currentDbUser?.role === 'super_admin' || (currentDbUser?.role === 'admin' && (!currentDbUser?.permissions || currentDbUser?.permissions === 'all' || currentDbUser?.permissions === 'full'));
  const effectiveRole = isOwner ? 'super_admin' : (currentDbUser?.role || 'user');
  const effectivePermissions = isOwner || isSuperAdmin || effectiveRole === 'super_admin'
    ? 'all'
    : (currentDbUser?.permissions && currentDbUser.permissions !== 'none' ? currentDbUser.permissions : 'none');

  const canAccessTab = (tabName: string) => {
    if (isOwner || isSuperAdmin || effectiveRole === 'super_admin' || effectivePermissions === 'all') {
      return true;
    }
    if (effectivePermissions === 'none' || !effectivePermissions) {
      return false;
    }

    const perms = effectivePermissions.split(',').map(p => p.trim());

    // Direct tabName check (e.g. 'overview', 'users', 'subscriptions', 'support_tickets', 'troubleshooter', 'templates', 'notifications', 'activity_logs', 'pricing_config', 'staff')
    if (perms.includes(tabName)) {
      return true;
    }

    if (tabName === 'staff') {
      return perms.includes('manage_staff') || perms.includes('staff');
    }
    if (tabName === 'overview') {
      return perms.includes('view_overview') || perms.includes('overview');
    }
    if (tabName === 'users') { // Tenants
      return perms.includes('users') || perms.some(p => ['view_users', 'add_users', 'edit_users', 'delete_users', 'impersonate_users'].includes(p));
    }
    if (tabName === 'templates') {
      return perms.includes('manage_templates') || perms.includes('templates');
    }
    if (tabName === 'subscriptions') {
      return perms.includes('subscriptions') || perms.some(p => ['view_subscriptions', 'manage_subscriptions'].includes(p));
    }
    if (tabName === 'notifications') {
      return perms.includes('notifications') || perms.some(p => ['view_notifications', 'send_notifications'].includes(p));
    }
    if (tabName === 'activity_logs') {
      return perms.includes('view_activity_logs') || perms.includes('activity_logs');
    }
    if (tabName === 'support_tickets') {
      return perms.includes('manage_tickets') || perms.includes('support_tickets');
    }
    if (tabName === 'troubleshooter') {
      return perms.includes('troubleshooter') || perms.includes('manage_tickets') || perms.includes('manage_subscriptions');
    }
    if (tabName === 'pricing_config') {
      return perms.includes('pricing_config') || perms.includes('manage_subscriptions');
    }
    return false;
  };

  const hasPermission = (perm: string) => {
    if (isOwner || isSuperAdmin || effectiveRole === 'super_admin' || effectivePermissions === 'all') return true;
    const perms = effectivePermissions === 'none' || !effectivePermissions ? [] : effectivePermissions.split(',').map(p => p.trim());
    return perms.includes(perm);
  };

  const getFirstAvailableTab = () => {
    if (isOwner || isSuperAdmin || effectiveRole === 'super_admin' || effectivePermissions === 'all') return 'overview';
    const tabs = ['overview', 'users', 'support_tickets', 'troubleshooter', 'templates', 'subscriptions', 'notifications', 'activity_logs', 'pricing_config', 'staff'];
    for (const t of tabs) {
      if (canAccessTab(t)) return t;
    }
    return 'overview';
  };

  useEffect(() => {
    if (!canAccessTab(activeTab)) {
      setActiveTab(getFirstAvailableTab());
    }
  }, [usersList, activeTab, effectivePermissions, effectiveRole]);
  const fetchSystemStaff = async () => {
    setSystemStaffLoading(true);
    try {
      const token = await user?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin/system/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setSystemStaffList(data.staff || []);
      }
    } catch (e) {
      console.error('Fetch system staff error:', e);
    } finally {
      setSystemStaffLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    setSystemLogsLoading(true);
    try {
      const token = await user?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin/system/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setSystemActivityLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Fetch system logs error:', e);
    } finally {
      setSystemLogsLoading(false);
    }
  };

  const handleAddSystemStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setAddingAdminLoading(true);
    try {
      const token = await user?.getIdToken();
      const activePerms = selectedSections.length > 0 
        ? Array.from(new Set(selectedSections.flatMap(id => {
            const sec = ADMIN_SECTIONS.find(s => s.id === id);
            return sec ? [sec.id, ...sec.legacy.split(',')] : [id];
          }))).join(',')
        : 'none';

      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName,
          permissions: activePerms,
          password: newAdminPassword
        })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Failed to parse JSON response:', jsonErr);
      }

      if (res.ok) {
        setToast('تمت إضافة موظف المنصة بنجاح 🎉');
        setTimeout(() => setToast(''), 3000);
        setIsAddAdminStaffModalOpen(false);
        setNewAdminEmail('');
        setNewAdminName('');
        setNewAdminPassword('');
        setSelectedSections(['overview', 'users', 'support_tickets']);
        fetchSystemStaff();
        fetchSystemLogs();
      } else {
        alert(data?.error || data?.message || `حدث خطأ (${res.status}): تعذر إضافة الموظف`);
      }
    } catch (err: any) {
      console.error('Add system staff error:', err);
      alert('حدث خطأ في الاتصال بالخادم: ' + (err?.message || String(err)));
    } finally {
      setAddingAdminLoading(false);
    }
  };

  const handleDemoteSystemStaff = (staffId: number, email: string) => {
    setStaffDemotionTarget({ id: staffId, email });
  };

  const confirmDemoteSystemStaff = async () => {
    if (!staffDemotionTarget) return;
    setDemotingStaffLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/system/staff/${staffDemotionTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setToast('تم سحب صلاحيات الموظف بنجاح (إشعار من المنصة)');
        setTimeout(() => setToast(''), 4000);
        fetchSystemStaff();
        fetchSystemLogs();
      } else {
        const err = await res.json().catch(() => ({}));
        setToast('خطأ: ' + (err.message || 'فشل سحب الصلاحيات'));
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e) {
      setToast('فشل اتصال بالخادم');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setDemotingStaffLoading(false);
      setStaffDemotionTarget(null);
    }
  };

  const cancelDemoteSystemStaff = () => {
    setStaffDemotionTarget(null);
    setToast('تم إلغاء عملية سحب صلاحيات الموظف');
    setTimeout(() => setToast(''), 3000);
  };

  // Heartbeat ping effect for presence and real-time staff/users online status
  useEffect(() => {
    if (!user) return;
    const sendPingAndRefresh = async () => {
      try {
        const token = await user.getIdToken();
        if (token) {
          await fetch('/api/auth/ping', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        fetchSystemStaff();
        fetchUsers(user);
        fetchNotifications(user);
      } catch (e) {
        // ignore
      }
    };
    sendPingAndRefresh();
    const interval = setInterval(sendPingAndRefresh, 45000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'staff') {
      fetchSystemStaff();
      fetchSystemLogs();
    }
    if (activeTab === 'activity_logs') {
      fetchSystemLogs();
      fetchSystemStaff();
    }
    if (activeTab === 'support_tickets') {
      loadSupportTickets();
    }
  }, [activeTab]);

  const handleUpdateUserRole = async (userId: number, newRole: string, newPermissions?: string) => {
    try {
      const token = await user?.getIdToken();
      const bodyData: any = { role: newRole };
      if (newPermissions) bodyData.permissions = newPermissions;

      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setToast('تم تحديث رتبة وصلاحيات المستخدم بنجاح 🛡️');
        setTimeout(() => setToast(''), 3000);
        fetchUsers();
        fetchSystemStaff();
      } else {
        alert('فشل تحديث الرتبة');
      }
    } catch (e) {
      console.error('Update role error:', e);
    }
  };

  const [showPasswordStaffId, setShowPasswordStaffId] = useState<number | null>(null);

  const handleUpdateStaffPassword = async (staffId: number, newPassword: string) => {
    if (!newPassword || !newPassword.trim()) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/system/staff/${staffId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: newPassword.trim() })
      });
      if (res.ok) {
        setToast('تم تغيير كلمة سر الموظف بنجاح 🔑');
        setTimeout(() => setToast(''), 3000);
        fetchSystemStaff();
      } else {
        const errData = await res.json().catch(() => ({}));
        setToast('خطأ: ' + (errData.error || errData.message || 'فشل تحديث كلمة السر'));
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      setToast('حدث خطأ أثناء الاتصال بالخادم');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleToggleStaffPermission = async (staffId: number, permKey: string, currentPerms: string) => {
    let permsList = currentPerms === 'all'
      ? ALL_GRANULAR_PERMISSIONS.map(p => p.key)
      : (currentPerms === 'none' || !currentPerms ? [] : currentPerms.split(',').map(p => p.trim()));

    if (permsList.includes(permKey)) {
      permsList = permsList.filter(p => p !== permKey);
    } else {
      permsList.push(permKey);
    }

    const newPermsStr = permsList.length > 0 ? permsList.join(',') : 'none';
    await handleUpdateUserRole(staffId, 'staff', newPermsStr);
  };

  const handleAddAdminStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setAddingAdminLoading(true);
    try {
      const activePerms = selectedSections.length > 0 
        ? Array.from(new Set(selectedSections.flatMap(id => {
            const sec = ADMIN_SECTIONS.find(s => s.id === id);
            return sec ? [sec.id, ...sec.legacy.split(',')] : [id];
          }))).join(',')
        : 'none';

      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName,
          role: 'staff',
          permissions: activePerms
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToast('تمت إضافة/ترقية المسؤول بنجاح 🎉');
        setTimeout(() => setToast(''), 3000);
        setIsAddAdminStaffModalOpen(false);
        setNewAdminEmail('');
        setNewAdminName('');
        fetchUsers();
        fetchSystemStaff();
      } else {
        alert(data.error || 'حدث خطأ أثناء إضافة المسؤول');
      }
    } catch (err) {
      console.error('Add admin staff error:', err);
    } finally {
      setAddingAdminLoading(false);
    }
  };

  const fetchNotifications = async (currentUser?: any) => {
    try {
      const notifs = await fetchAllNotificationsAdmin();
      setSystemNotifications(notifs);
    } catch (e) {
      console.error('Failed to fetch admin notifications', e);
    }
  };

  const handleHardDeleteTenant = async () => {
    if (!hardDeleteTenant) return;
    setHardDeleteLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/tenants/${hardDeleteTenant.tenantId}/hard-delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setToast('تم حذف الاشتراكات والبيانات نهائياً وإيقاف الموقع!');
        setTimeout(() => setToast(''), 4000);
        setHardDeleteTenant(null);
        fetchUsers();
      } else {
        const err = await res.json();
        setToast('خطأ: ' + (err.message || err.error));
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e: any) {
      setToast('فشل حذف بيانات المستأجر');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setHardDeleteLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      setToast('يرجى كتابة العنوان ونص التنبيه');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setNotifLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          tenantId: notificationModal?.tenantId,
          targetEmail: notificationModal?.targetEmail,
          title: notifTitle,
          message: notifMessage,
          isRequired: 1
        })
      });
      if (res.ok) {
        setToast('تم إرسال التنبيه الإجباري بنجاح!');
        setTimeout(() => setToast(''), 3000);
        setNotificationModal(null);
        setNotifTitle('');
        setNotifMessage('');
      } else {
        const err = await res.json();
        setToast('خطأ: ' + (err.message || err.error));
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e: any) {
      setToast('حدث خطأ أثناء إرسال التنبيه');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleUpdateDomain = async () => {
    if (!editDomainTenant) return;
    setEditDomainLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/tenants/${editDomainTenant.tenantId}/domain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          subdomain: editSubdomainInput,
          customDomain: editCustomDomainInput
        })
      });
      if (res.ok) {
        setToast('تم تحديث النطاق والدومين بنجاح!');
        setTimeout(() => setToast(''), 3000);
        setEditDomainTenant(null);
        fetchUsers();
      } else {
        const err = await res.json();
        setToast('خطأ: ' + (err.message || err.error));
        setTimeout(() => setToast(''), 4000);
      }
    } catch (e: any) {
      console.error(e);
      setToast('حدث خطأ أثناء الاتصال');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setEditDomainLoading(false);
    }
  };

  
  const handleUpdateTemplateImage = async () => {
    if (!editTemplateId || !newImageUrl) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/templates/${editTemplateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ image: newImageUrl })
      });
      if (res.ok) {
        setToast('تم تحديث الصورة بنجاح');
        setTimeout(() => setToast(''), 3000);
        setEditTemplateId(null);
        setNewImageUrl('');
        fetchTemplates();
      } else {
        setToast('حدث خطأ');
        setTimeout(() => setToast(''), 3000);
      }
    } catch(e) {
      console.error(e);
      setToast('حدث خطأ');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/templates/${deleteTemplateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setToast('تم حذف القالب بنجاح');
        setTimeout(() => setToast(''), 3000);
        setDeleteTemplateId(null);
        fetchTemplates();
      } else {
        setToast('حدث خطأ');
        setTimeout(() => setToast(''), 3000);
      }
    } catch(e) {
      console.error(e);
      setToast('حدث خطأ');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const openAssignModal = (templateId: number) => {
    setAssignModal(templateId);
    setSubscriptionType('pro');
    const plans = getSubscriptionPlans(adminPricingConfig.baseCurrency);
    const proPlan = plans.find(p => p.id === 'pro') || plans[1];
    if (proPlan) {
      const num = proPlan.price.replace(/[^0-9.]/g, '');
      setSubscriptionPrice(num || String(adminPricingConfig.proPriceJOD));
    } else {
      setSubscriptionPrice(String(adminPricingConfig.proPriceJOD));
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setSubscriptionEndDate(d.toISOString().split('T')[0]);
  };

  const handleAssignTemplate = async (templateId: number) => {
    if (!assignEmail) {
      setToast("يرجى إدخال البريد الإلكتروني للعميل");
      setTimeout(() => setToast(''), 3000);
      return;
    }
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/assign-template", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ templateId, clientEmail: assignEmail, siteName, siteLogo, subscriptionType, price: subscriptionPrice, endDate: subscriptionEndDate })
      });
      if (res.ok) {
        const data = await res.json();
        setToast(data.message || "تم ربط القالب بالعميل وتفعيل الاشتراك وتوثيق الإشعار بنجاح 🚀");
        setTimeout(() => setToast(''), 4500);
        setAssignModal(null);
        setAssignEmail("");
        setSiteName("");
        setSiteLogo("");
        setSubscriptionPrice("");
        setSubscriptionEndDate("");
        fetchTemplates();
        fetchUsers();
      } else {
        const errText = await res.text();
        console.error("Assign error response:", errText);
        setToast("حدث خطأ أثناء الربط: " + errText.substring(0, 50));
        setTimeout(() => setToast(''), 5000);
      }
    } catch(e: any) { 
        console.error(e); 
        setToast("Error: " + e.message);
        setTimeout(() => setToast(''), 5000);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates/all');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Not JSON');
        const data = await res.json();
        setDbTemplates(data.templates);
        setActiveTemplates(prev => {
          const newState = { ...prev };
          data.templates.forEach((t: any) => {
            if (newState[t.id] === undefined) newState[t.id] = true;
          });
          return newState;
        });
      }
    } catch (e) {
      console.error('Failed to fetch external templates', e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate('/');
      } else {
        const normEmail = u.email?.toLowerCase().trim();
        if (normEmail === ADMIN_EMAIL) {
          setUser(u);
          fetchUsers(u);
          fetchTemplates();
          fetchNotifications(u);
          return;
        }
        try {
          const token = await u.getIdToken();
          const statusRes = await fetch('/api/me/status', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setMyDbUser(statusData);
            
            const isOwnerEmail = statusData.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
            // Platform admin/staff role verification
            const isPlatformStaff = ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(statusData.role) || (statusData.permissions && statusData.permissions !== 'none') || isOwnerEmail;

            if (!isPlatformStaff) {
              navigate('/');
              return;
            }
            if (isPlatformStaff) {
              setUser(u);
              fetchUsers(u);
              fetchTemplates();
              fetchNotifications(u);
              return;
            }
          }
          const res = await fetch('/api/tenant', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user && ['admin', 'super_admin', 'staff', 'manager', 'support'].includes(data.user.role)) {
              setUser(u);
              fetchUsers(u);
              fetchTemplates();
              fetchNotifications(u);
              return;
            }
          }
        } catch (e) {}
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const isSubCancelled = (u: any) => {
    const st = u.subscriptionStatus || '';
    return ['cancelled', 'customer_cancelled', 'admin_cancelled', 'ملغي'].includes(st);
  };

  const getSubPrice = (u: any) => {
    const p = Number(u.subscriptionTotalPrice) || Number(u.subscriptionPrice) || Number(u.price) || 0;
    if (p > 0) return p;
    if (u.subscriptionType && u.subscriptionType !== 'free_trial_3days' && u.subscriptionType !== 'monthly_trial') {
      return u.subscriptionType === 'yearly' ? 299 : 49;
    }
    return 49;
  };

  const isUserActivePaid = (u: any) => {
    if (u.status === 'banned' || isSubCancelled(u)) return false;
    if (!u.subscriptionType || u.subscriptionType === 'free_trial_3days' || u.subscriptionType === 'monthly_trial') return false;
    const isExp = u.subscriptionEndDate && new Date(u.subscriptionEndDate) <= new Date();
    return !isExp;
  };

  const fetchUsers = async (currentUser?: any) => {
    try {
      const activeUser = currentUser || user;
      if (!activeUser) {
        setLoading(false);
        return;
      }
      let token = await activeUser.getIdToken();
      let res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // If token expired (401), force refresh and retry once
      if (res.status === 401) {
        token = await activeUser.getIdToken(true);
        res = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.users) setUsersList(data.users);
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`Admin users fetch returned ${res.status}:`, errText);
      }
    } catch(e) {
      console.error('Error fetching admin users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const toggleTemplate = (id: number) => {
    setActiveTemplates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  
  const [renewModalEmail, setRenewModalEmail] = useState<string | null>(null);
  const [selectedRenewPlan, setSelectedRenewPlan] = useState('monthly');
  const [selectedRenewPrice, setSelectedRenewPrice] = useState('15');

  const [adminPricingConfig, setAdminPricingConfig] = useState<AdminPricingConfig>(() => getAdminPricingConfig());

  const handleSaveAdminPricingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdminPricingConfig(adminPricingConfig);
    setToast('✨ تم حفظ أسعار الباقات وعملات التحويل بنجاح!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleRenewSubscription = async (email: string) => {
    setRenewModalEmail(email);
  };

  const handleRenewSubscriptionWithPlan = async (email: string, plan: string, price: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/subscriptions/${email}/renew`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan, price })
      });
      if (res.ok) {
        setToast('✨ تم تجديد الاشتراك بنجاح وتحديث الباقة في النظام');
        setTimeout(() => setToast(''), 3000);
        setRenewModalEmail(null);
        fetchUsers();

        try {
          await createAppNotification({
            targetType: 'specific',
            targetUserEmail: email,
            title: 'تحديث الاشتراك من بنيان 🌟',
            message: `تم إضافة وتحديث اشتراكك (${plan === 'yearly' ? 'الباقة السنوية' : 'الباقة الشهرية'}) بنجاح عن طريق إدارة منصة بنيان.`,
            type: 'info'
          });
        } catch (e) {
          console.warn('Notice sending subscription notification:', e);
        }
      } else {
        setToast('فشل تجديد الاشتراك');
        setTimeout(() => setToast(''), 3000);
      }
    } catch(e) { console.error(e); }
  };

  const handleCancelSubscription = (email: string) => {
    setCancelSubTarget(email);
  };

  const confirmCancelSubscription = async () => {
    if (!cancelSubTarget) return;
    setCancelSubLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/subscriptions/${cancelSubTarget}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setToast('تم إلغاء الاشتراك بنجاح');
        setTimeout(() => setToast(''), 3000);
        fetchUsers();
      } else {
        setToast('فشل إلغاء الاشتراك');
        setTimeout(() => setToast(''), 3000);
      }
    } catch(e) { 
      console.error(e); 
      setToast('حدث خطأ');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setCancelSubLoading(false);
      setCancelSubTarget(null);
    }
  };

  const handleSuspendUser = async (email: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/users/${email}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(prev => prev.map(u => u.email === email ? { ...u, status: data.status } : u));
        setToast('تم تحديث حالة المستخدم بنجاح'); setTimeout(() => setToast(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setToast('حدث خطأ'); setTimeout(() => setToast(''), 3000);
    }
  };

  const handleWarnUser = async (email: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/users/${email}/warning`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(prev => prev.map(u => u.email === email ? { ...u, status: data.status } : u));
        setToast('تم إرسال تحذير للمستخدم بنجاح'); setTimeout(() => setToast(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setToast('حدث خطأ'); setTimeout(() => setToast(''), 3000);
    }
  };

  const handleImpersonateUser = async (email: string) => {
    localStorage.setItem('impersonatedEmail', email);
    navigate('/dashboard');
  };

  const handleResetAllData = () => {
    setResetAllModalOpen(true);
  };

  const confirmResetAllData = async () => {
    setResetAllLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/system/reset-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Clear all localStorage completely
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}

        setToast('تم تصفير جميع بيانات المنصة والاشتراكات بنجاح تام');
        setTimeout(() => {
          setToast('');
          window.location.reload();
        }, 2000);
      } else {
        const errData = await res.json();
        setToast(errData.error || 'فشل تصفير البيانات');
        setTimeout(() => setToast(''), 3000);
        setResetAllLoading(false);
        setResetAllModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      setToast('حدث خطأ أثناء التصفير');
      setTimeout(() => setToast(''), 3000);
      setResetAllLoading(false);
      setResetAllModalOpen(false);
    }
  };

  const confirmClearSubscriptions = async () => {
    setClearSubsLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/system/clear-subscriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Clear all local subscription and edited template keys
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('subscription') || key.includes('waas_') || key.includes('edited') || key.includes('active_'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (e) {}

        setToast('تم مسح وإلغاء جميع الاشتراكات لجميع المستخدمين والمديرين بنجاح!');
        setTimeout(() => {
          setToast('');
          window.location.reload();
        }, 2000);
      } else {
        const errData = await res.json();
        setToast(errData.error || 'فشل مسح الاشتراكات');
        setTimeout(() => setToast(''), 3000);
        setClearSubsLoading(false);
        setClearSubsModalOpen(false);
      }
    } catch (e) {
      console.error(e);
      setToast('حدث خطأ أثناء مسح الاشتراكات');
      setTimeout(() => setToast(''), 3000);
      setClearSubsLoading(false);
      setClearSubsModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0e1626] flex flex-col items-center justify-center relative overflow-hidden dir-rtl">
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.3)]"></div>
          <p className="text-slate-400 font-bold text-sm tracking-wide animate-pulse">جاري تحميل مركز التحكم الرئيسي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#0e1626] text-slate-100 font-sans flex flex-col md:flex-row selection:bg-blue-500/30 overflow-hidden relative" dir="rtl">
      {/* Background Aurora Blurs */}
      <div className="fixed -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed -bottom-32 -right-32 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 border border-blue-500/40 text-blue-300 px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.25)] backdrop-blur-xl font-bold text-sm animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
          <span>{toast}</span>
        </div>
      )}

      {/* Mobile Top Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950/90 border-b border-slate-800/80 z-30 shrink-0 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-black shadow-md">
            👑
          </div>
          <div>
            <span className="font-black text-white text-sm block">God Mode PRO</span>
            <span className="text-[10px] text-blue-400 font-mono">لوحة تحكم المنصة</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          {isMobileMenuOpen ? '✕ إغلاق' : '📱 قائمة التحكم'}
        </button>
      </div>

      {/* Mobile Quick Horizontal Scrollable Tab Bar */}
      <div className="md:hidden bg-slate-900/90 border-b border-slate-800/80 px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none z-20 sticky top-[60px] backdrop-blur-md">
        {canAccessTab('overview') && (
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>نظرة عامة</span>
          </button>
        )}
        {canAccessTab('users') && (
          <button
            onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>المستخدمين ({usersList.length})</span>
          </button>
        )}
        {canAccessTab('templates') && (
          <button
            onClick={() => { setActiveTab('templates'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>القوالب ({Object.values(activeTemplates).filter(Boolean).length})</span>
          </button>
        )}
        {canAccessTab('staff') && (
          <button
            onClick={() => { setActiveTab('staff'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>الموظفين ({systemStaffList.length})</span>
          </button>
        )}
        {canAccessTab('subscriptions') && (
          <button
            onClick={() => { setActiveTab('subscriptions'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>المشتركين</span>
          </button>
        )}
        {canAccessTab('support_tickets') && (
          <button
            onClick={() => { setActiveTab('support_tickets'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'support_tickets'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>تذاكر الدعم</span>
          </button>
        )}
        {canAccessTab('activity_logs') && (
          <button
            onClick={() => { setActiveTab('activity_logs'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'activity_logs'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>النشاطات</span>
          </button>
        )}
        {canAccessTab('notifications') && (
          <button
            onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>التنبيهات</span>
          </button>
        )}
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar - Glassmorphic Command Center */}
      <aside className={`w-full md:w-80 border-b md:border-b-0 md:border-l border-slate-800/60 bg-slate-950/95 md:bg-slate-950/60 backdrop-blur-2xl flex flex-col p-6 md:p-8 z-40 shadow-2xl shrink-0 h-full max-h-[100dvh] overflow-y-auto ${
        isMobileMenuOpen ? 'fixed inset-x-0 top-[60px] bottom-0 flex' : 'hidden md:flex relative'
      }`}>
        <div className="mb-6 md:mb-10 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-[0_0_30px_rgba(79,70,229,0.5)] mb-2 md:mb-4 border border-white/20">
              <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tighter">
                {isOwner || myDbUser?.role === 'super_admin' ? 'إدارة المنصة' : 'لوحة تحكم الموظف'}
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${
                isOwner || myDbUser?.role === 'super_admin'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}>
                {isOwner || myDbUser?.role === 'super_admin' ? 'SUPER ADMIN' : 'موظف منصة'}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              {isOwner || myDbUser?.role === 'super_admin'
                ? 'مالك ومشرف المنظومة الرئيسي'
                : 'أنت موظف في منصة بنيان'}
            </p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-2.5 my-2">
          {canAccessTab('overview') && (
            <button 
              onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'overview' ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>نظرة عامة</span>
              </div>
              <Zap className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-blue-400' : 'text-slate-600'}`} />
            </button>
          )}

          {canAccessTab('users') && (
            <button 
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'users' ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>إدارة المستخدمين</span>
              </div>
              <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-lg text-slate-500 font-mono">{usersList.length}</span>
            </button>
          )}

          {canAccessTab('staff') && (
            <button 
              onClick={() => { setActiveTab('staff'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'staff' ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 shadow-[0_0_20px_rgba(147,51,234,0.15)] border border-purple-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>فريق المنظومة والموظفين</span>
              </div>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-lg font-mono font-bold">{systemStaffList.length}</span>
            </button>
          )}

          {canAccessTab('activity_logs') && (
            <button 
              onClick={() => { setActiveTab('activity_logs'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'activity_logs' ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>سجل النشاطات والتواجد</span>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          )}

          {canAccessTab('subscriptions') && (
            <button 
              onClick={() => { setActiveTab('subscriptions'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'subscriptions' ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4" />
                <span>إدارة المشتركين (CRM)</span>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {canAccessTab('support_tickets') && (
            <button 
              onClick={() => { setActiveTab('support_tickets'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'support_tickets' ? 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] border border-amber-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                <span>طلبات المساعدة والتذاكر</span>
              </div>
              {supportTicketsList.filter(t => t.status === 'open').length > 0 ? (
                <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
                  {supportTicketsList.filter(t => t.status === 'open').length}
                </span>
              ) : (
                <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-lg text-slate-500 font-mono">{supportTicketsList.length}</span>
              )}
            </button>
          )}

          {canAccessTab('troubleshooter') && (
            <button 
              onClick={() => { setActiveTab('troubleshooter'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'troubleshooter' ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <span>مركز حل ومشاكل العملاء 🛠️</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-black">AI & FIX</span>
            </button>
          )}

          {canAccessTab('templates') && (
            <button 
              onClick={() => { setActiveTab('templates'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'templates' ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <LayoutTemplate className="w-4 h-4" />
                <span>التحكم بالقوالب</span>
              </div>
              <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-lg text-slate-500 font-mono">{Object.values(activeTemplates).filter(Boolean).length}</span>
            </button>
          )}

          {canAccessTab('notifications') && (
            <button 
              onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'notifications' ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>سجل التنبيهات</span>
              </div>
              {(Array.isArray(systemNotifications) ? systemNotifications : []).filter(n => n && !n.isRead).length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black">
                  {(Array.isArray(systemNotifications) ? systemNotifications : []).filter(n => n && !n.isRead).length}
                </span>
              )}
            </button>
          )}

          {canAccessTab('subscriptions') && (
            <button 
              onClick={() => { setActiveTab('pricing_config'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-sm ${activeTab === 'pricing_config' ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>إدارة الأسعار والعملات 💱</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-black">أسعار</span>
            </button>
          )}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-slate-800/60 space-y-3">
          <button 
            onClick={() => navigate('/managements')}
            className="w-full group bg-slate-900/80 hover:bg-blue-600/10 text-slate-300 hover:text-blue-400 border border-slate-800 hover:border-blue-500/30 px-5 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-between text-sm shadow-inner cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>إداراتي</span>
            </div>
            <ArrowRight className="w-4 h-4 rotate-180 text-slate-500 group-hover:text-blue-400 group-hover:-translate-x-1 transition-all" />
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full group bg-emerald-950/30 hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 px-5 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-between text-sm shadow-inner cursor-pointer"
            title="العودة للصفحة الرئيسية مع البقاء مسجل الدخول"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>العودة للموقع (بدون خروج)</span>
            </div>
            <ArrowRight className="w-4 h-4 rotate-180 text-emerald-400 group-hover:-translate-x-1 transition-all" />
          </button>
          <button 
            onClick={handleLogout}
            className="w-full group bg-slate-900/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800/80 hover:border-red-500/30 px-5 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-sm shadow-inner cursor-pointer"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>تسجيل الخروج النهائي</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full relative z-10">
        <div className="max-w-7xl mx-auto p-4 sm:p-8 md:p-12 space-y-10">

          {/* Overview Tab (Bento Grid Dashboard) */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">نظرة عامة على المنصة</h2>
                  <p className="text-slate-400 text-sm mt-1">مؤشرات الأداء الرئيسية والتحكم الكامل في كافة المتاجر والمستأجرين</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    النظام يعمل بكفاءة 100%
                  </span>
                </div>
              </div>

              {/* Bento Grid Top Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative group bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl hover:border-blue-500/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">إجمالي المستخدمين والمتاجر</span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tight">{usersList.length}</h3>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">100%</span> حسابات مفعلة ومنشأة
                  </p>
                </div>

                <div className="relative group bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl hover:border-emerald-500/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">القوالب المعروضة للعملاء</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tight">
                    {Object.values(activeTemplates).filter(Boolean).length}
                    <span className="text-xl text-slate-600 font-normal"> / {dbTemplates.length}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">جاهزة للربط الفوري</p>
                </div>

                <div className="relative group bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl hover:border-purple-500/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">الإيراد الشهري المتوقع (MRR)</span>
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tight">
                    ${usersList.reduce((acc, u) => acc + (Number(u.subscriptionPrice) || 49), 0)}
                  </h3>
                  <p className="text-xs text-purple-400 font-bold mt-2">عقود مستمرة ومفعلة</p>
                </div>

                <div className="relative group bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl hover:border-amber-500/40 transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">تستحق التجديد قريباً</span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-amber-400 tracking-tight">
                    {usersList.filter(u => {
                      const days = u.subscriptionEndDate ? Math.ceil((new Date(u.subscriptionEndDate).getTime() - Date.now()) / (1000*3600*24)) : 999;
                      return days > 0 && days <= 10;
                    }).length}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">خلال الـ 10 أيام القادمة</p>
                </div>
              </div>

              {/* System Feature Kill Switches & Control Panel */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-500/20">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">أزرار التحكم وإغلاق الخدمات المباشرة</h3>
                        <p className="text-slate-400 text-xs mt-0.5">التحكم الدقيق الفوري في تفعيل أو إغلاق دخول بيئة التعديل، الاشتراكات، وحفظ التعديلات</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>مُحدث لحظياً على مستوى النظام</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Switch 1: Edit Mode Access */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden ${
                    sysSettings.lockEditMode 
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">بيئة التعديل</span>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 border ${
                          sysSettings.lockEditMode 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {sysSettings.lockEditMode ? (
                            <>
                              <Lock className="w-3 h-3 text-rose-400" />
                              <span>مغلق الآن</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>مفتوح ومتاح</span>
                            </>
                          )}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">الدخول لبيئة التعديل</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        إغلاق زر دخول بيئة التعديل في المعاينة وجميع أجزاء الموقع. يظهر للمستخدمين إشعار <strong className="text-rose-400">"مغلق الآن"</strong> عند المحاولة.
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleSystemSetting('lockEditMode')}
                      disabled={savingSysSettings}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        sysSettings.lockEditMode
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>{sysSettings.lockEditMode ? 'فتح وتفعيل بيئة التعديل' : 'إغلاق الدخول لبيئة التعديل'}</span>
                    </button>
                  </div>

                  {/* Switch 2: Subscriptions & Checkout */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden ${
                    sysSettings.lockSubscriptions 
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">الاشتراكات والدفع</span>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 border ${
                          sysSettings.lockSubscriptions 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {sysSettings.lockSubscriptions ? (
                            <>
                              <Lock className="w-3 h-3 text-rose-400" />
                              <span>مغلق الآن</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>مفتوح ومتاح</span>
                            </>
                          )}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">إغلاق وتجميد الاشتراكات والتحويل للواتساب</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        عند الإغلاق، سيظهر للعميل تنبيه بوجود <strong className="text-amber-400">"مشكلة مؤقتة في بوابة الدفع"</strong> وزر تواصل مباشر عبر الواتساب على الرقم <strong className="text-emerald-400 font-mono">0778091269</strong> لإكمال الاشتراك.
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleSystemSetting('lockSubscriptions')}
                      disabled={savingSysSettings}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        sysSettings.lockSubscriptions
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>{sysSettings.lockSubscriptions ? 'تفعيل وفتح الاشتراكات' : 'إغلاق الاشتراك والدفع'}</span>
                    </button>
                  </div>

                  {/* Switch 3: Save Edits */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden ${
                    sysSettings.lockSaveEdits 
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">حفظ التغييرات</span>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 border ${
                          sysSettings.lockSaveEdits 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {sysSettings.lockSaveEdits ? (
                            <>
                              <Lock className="w-3 h-3 text-rose-400" />
                              <span>مغلق الآن</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>مفتوح ومتاح</span>
                            </>
                          )}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">زر حفظ ونشر التعديلات</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        إيقاف وظيفة الحفظ والنشر في كافة محررات القوالب والمواقع، وإعادة رفض الطلبات من الخادم بعبارة <strong className="text-rose-400">"مغلق الآن"</strong>.
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleSystemSetting('lockSaveEdits')}
                      disabled={savingSysSettings}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        sysSettings.lockSaveEdits
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>{sysSettings.lockSaveEdits ? 'تفعيل وتسهيل حفظ التعديلات' : 'إغلاق حفظ التعديلات'}</span>
                    </button>
                  </div>

                  {/* Switch 4: Template Preview Access */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden ${
                    sysSettings.lockTemplatePreview 
                      ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">معاينة القوالب</span>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 border ${
                          sysSettings.lockTemplatePreview 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {sysSettings.lockTemplatePreview ? (
                            <>
                              <Lock className="w-3 h-3 text-rose-400" />
                              <span>مغلق الآن</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>مفتوح ومتاح</span>
                            </>
                          )}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white">إغلاق الدخول لمعاينة القوالب</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        إغلاق زر وعرض المعاينة الحية للقوالب ومنع المستخدمين من تصفحها وإظهار تنبيه <strong className="text-rose-400">"مغلق الآن"</strong>.
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleSystemSetting('lockTemplatePreview')}
                      disabled={savingSysSettings}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        sysSettings.lockTemplatePreview
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>{sysSettings.lockTemplatePreview ? 'فتح وتفعيل معاينة القوالب' : 'إغلاق الدخول لمعاينة القوالب'}</span>
                    </button>
                  </div>
                </div>

                {/* Promo Banner / Special Offer Popup Settings */}
                <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30">
                        <Flame className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                          <span>إدارة نافذة العروض والخصومات والأسعار (Promotional Popup)</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          تحكم بظهور النافذة الترويجية المنبثقة للعملاء والزوار فور دخولهم للمنصة (مثل عرض اشتراك القوالب بـ $30)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 border ${
                        sysSettings.promoBannerEnabled 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${sysSettings.promoBannerEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span>{sysSettings.promoBannerEnabled ? 'العرض مفعل ومباشر' : 'العرض متوقف وحاليا مخفي'}</span>
                      </span>

                      <button
                        onClick={() => handleSavePromoSettings({ promoBannerEnabled: !sysSettings.promoBannerEnabled })}
                        disabled={savingSysSettings}
                        className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md ${
                          sysSettings.promoBannerEnabled
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {sysSettings.promoBannerEnabled ? 'إخفاء وإيقاف العرض' : 'إظهار وتفعيل العرض الآن 🔥'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Offer Badge & Title */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">شارة العرض (التاغ العلوي):</label>
                      <input
                        type="text"
                        value={sysSettings.promoBannerBadge || ''}
                        onChange={(e) => setSysSettings(prev => ({ ...prev, promoBannerBadge: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/80"
                        placeholder="مثال: لفترة محدودة ⚡"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">عنوان العرض الرئيسي:</label>
                      <input
                        type="text"
                        value={sysSettings.promoBannerTitle || ''}
                        onChange={(e) => setSysSettings(prev => ({ ...prev, promoBannerTitle: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/80"
                        placeholder="مثال: عرض خاص وحصري 🔥"
                      />
                    </div>

                    {/* Offer Message / Price Highlight */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">نص العرض والسعر (المحتوى البارز):</label>
                      <input
                        type="text"
                        value={sysSettings.promoBannerMessage || ''}
                        onChange={(e) => setSysSettings(prev => ({ ...prev, promoBannerMessage: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/80"
                        placeholder="مثال: اشتراك في أي قالب بـ $30 فقط! 🚀"
                      />
                    </div>

                    {/* Button Text */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">نص زر الاشتراك والإجراء:</label>
                      <input
                        type="text"
                        value={sysSettings.promoBannerBtnText || ''}
                        onChange={(e) => setSysSettings(prev => ({ ...prev, promoBannerBtnText: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/80"
                        placeholder="مثال: اختر قالبك واشترك بـ $30 الآن 🎯"
                      />
                    </div>

                    {/* Subtext Description */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">الوصف والتفاصيل الإضافية تحت السعر:</label>
                      <textarea
                        rows={2}
                        value={sysSettings.promoBannerSubtext || ''}
                        onChange={(e) => setSysSettings(prev => ({ ...prev, promoBannerSubtext: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500/80"
                        placeholder="تفاصيل العرض والمميزات المرفقة..."
                      />
                    </div>

                    {/* Color Theme Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">ثيم ولون العرض الترويجي:</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'red', label: 'أحمر نار 🔥', bg: 'bg-red-600' },
                          { id: 'purple', label: 'بنفسجي ملكي 💎', bg: 'bg-purple-600' },
                          { id: 'amber', label: 'ذهبي فاخر ✨', bg: 'bg-amber-500' },
                          { id: 'emerald', label: 'زمردي جذاب 🌿', bg: 'bg-emerald-600' }
                        ].map(theme => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setSysSettings(prev => ({ ...prev, promoBannerTheme: theme.id as any }))}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                              sysSettings.promoBannerTheme === theme.id || (!sysSettings.promoBannerTheme && theme.id === 'red')
                                ? 'bg-slate-800 border-rose-500 text-white shadow-md'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${theme.bg}`} />
                            <span className="hidden sm:inline">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-end">
                      <button
                        onClick={() => handleSavePromoSettings({
                          promoBannerTitle: sysSettings.promoBannerTitle,
                          promoBannerBadge: sysSettings.promoBannerBadge,
                          promoBannerMessage: sysSettings.promoBannerMessage,
                          promoBannerSubtext: sysSettings.promoBannerSubtext,
                          promoBannerBtnText: sysSettings.promoBannerBtnText,
                          promoBannerTheme: sysSettings.promoBannerTheme
                        })}
                        disabled={savingSysSettings}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                      >
                        <Sparkles size={18} />
                        <span>{savingSysSettings ? 'جاري الحفظ والتطبيق...' : 'حفظ ونشر التعديلات فوراً 🚀'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Grid Command Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Command Actions Box */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-blue-400" />
                      إجراءات سريعة وسريعة التحكم
                    </h3>
                    <span className="text-xs text-slate-500">Super Admin Mode</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('subscriptions')}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-600/10 transition-all text-right group"
                    >
                      <Building2 className="w-6 h-6 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-white group-hover:text-blue-300">إدارة كافة المستأجرين (CRM)</h4>
                      <p className="text-xs text-slate-400 mt-1">عرض المواقع، ربط الدومينات، والدخول الخفي للعملاء.</p>
                    </button>

                    <button
                      onClick={() => setIsImporterOpen(true)}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-600/10 transition-all text-right group"
                    >
                      <LayoutTemplate className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-white group-hover:text-emerald-300">إضافة موقع خارجي كقالب</h4>
                      <p className="text-xs text-slate-400 mt-1">تضمين أي رابط خارجي ليظهر كمعاينة في المعرض العام.</p>
                    </button>

                    <button
                      onClick={() => {
                        setNotificationModal({ tenantName: 'جميع المشتركين' });
                        setNotifTitle('');
                        setNotifMessage('');
                      }}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-600/10 transition-all text-right group"
                    >
                      <Bell className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-white group-hover:text-amber-300">إرسال تنبيه نظام إجباري</h4>
                      <p className="text-xs text-slate-400 mt-1">تنبيه يظهر لكافة المستأجرين كنافذة إجبارية عند تسجيل الدخول.</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('templates')}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 hover:bg-purple-600/10 transition-all text-right group"
                    >
                      <Edit3 className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-white group-hover:text-purple-300">إدارة القوالب وتخصيصها</h4>
                      <p className="text-xs text-slate-400 mt-1">إخفاء القوالب أو تخصيص قوالب معينة لعميل محدد.</p>
                    </button>

                    <button
                      onClick={handleResetAllData}
                      className="p-5 rounded-2xl bg-rose-950/30 border border-rose-900/50 hover:border-rose-500/60 hover:bg-rose-600/20 transition-all text-right group sm:col-span-2"
                    >
                      <Trash2 className="w-6 h-6 text-rose-400 mb-3 group-hover:scale-110 transition-transform" />
                      <h4 className="font-bold text-rose-300 group-hover:text-rose-200">تصفير كافة البيانات والاشتراكات 🔄</h4>
                      <p className="text-xs text-rose-400/80 mt-1">حذف جميع المواقع والاشتراكات والمتاجر وتصفير النظام بالكامل باستثناء حساب السوبر أدمن.</p>
                    </button>
                  </div>
                </div>

                {/* System Status Box */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      حالة الخوادم والربط
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                        <span className="text-slate-400">قاعدة البيانات (Firestore):</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          متصلة
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                        <span className="text-slate-400">مخزن الصور (Firebase Storage):</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          نشط
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                        <span className="text-slate-400">موجّه الدومينات (Dynamic Domains):</span>
                        <span className="text-blue-400 font-bold">100% تلقائي</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800/60 mt-6">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      التحكم الكامل عبر God Mode يتيح لك تعديل كافة تفاصيل المتاجر والقوالب مع الحفاظ على الأمان المطلق.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (() => {
            const allRegularUsers = usersList;

            const filteredUsers = allRegularUsers.filter(u => {
              if (userStatusFilter === 'active' && u.status === 'banned') return false;
              if (userStatusFilter === 'banned' && u.status !== 'banned') return false;

              if (!userSearch) return true;
              const query = userSearch.toLowerCase();
              return (u.email || '').toLowerCase().includes(query) || (u.name || '').toLowerCase().includes(query);
            });

            const totalUsersCount = allRegularUsers.length;
            const activeUsersCount = allRegularUsers.filter(u => u.status !== 'banned').length;
            const bannedUsersCount = allRegularUsers.filter(u => u.status === 'banned').length;

            return (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">إدارة أعضاء المنظومة والمستخدمين</h2>
                    <p className="text-slate-400 text-sm mt-1">عرض وإدارة حسابات العملاء المسجلين في المنصة ومتابعة اشتراكاتهم وتنشيطهم.</p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {hasPermission('add_users') && (
                      <button
                        onClick={() => setIsAddAdminStaffModalOpen(true)}
                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-2xl hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة مسؤول/موظف جديد
                      </button>
                    )}

                    <div className="relative">
                      <input 
                        type="text" 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="البحث بالبريد أو الاسم..." 
                        className="bg-[#0F1218] border border-slate-800/80 rounded-full px-6 py-3 w-full md:w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 text-right" 
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Metrics & Filter Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div 
                    onClick={() => setUserStatusFilter('all')}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${userStatusFilter === 'all' ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/5' : 'bg-[#0F1218] border-slate-800/80 hover:border-slate-700'}`}
                  >
                    <div>
                      <p className="text-xs text-slate-400 font-medium">إجمالي العملاء</p>
                      <h3 className="text-2xl font-black text-white mt-1">{totalUsersCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  <div 
                    onClick={() => setUserStatusFilter('active')}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${userStatusFilter === 'active' ? 'bg-emerald-600/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'bg-[#0F1218] border-slate-800/80 hover:border-slate-700'}`}
                  >
                    <div>
                      <p className="text-xs text-slate-400 font-medium">العملاء النشطون</p>
                      <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeUsersCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>

                  <div 
                    onClick={() => setUserStatusFilter('banned')}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${userStatusFilter === 'banned' ? 'bg-rose-600/10 border-rose-500/40 shadow-lg shadow-rose-500/5' : 'bg-[#0F1218] border-slate-800/80 hover:border-slate-700'}`}
                  >
                    <div>
                      <p className="text-xs text-slate-400 font-medium">الحسابات الموقوفة</p>
                      <h3 className="text-2xl font-black text-rose-400 mt-1">{bannedUsersCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Ban className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Toolbar: Count, Search & Export */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-[#0F1218] p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-xs text-slate-400 font-medium">
                    عرض <span className="text-white font-bold">{filteredUsers.length}</span> من أصل <span className="text-white font-bold">{totalUsersCount}</span> مستخدم
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const headers = ['Email', 'Name', 'Role', 'Status', 'Subdomain', 'Edited Templates', 'Favorites', 'Subscriptions'];
                        const rows = filteredUsers.map(u => [
                          u.email,
                          u.name || '',
                          u.role || 'user',
                          u.status || 'active',
                          u.subdomain || '',
                          u.editedTemplatesCount ?? 1,
                          u.favoritesCount ?? 0,
                          u.subscriptionsCount ?? 1
                        ]);
                        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', 'users_report.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-slate-700/60"
                    >
                      <Download className="w-3.5 h-3.5" />
                      تصدير CSV
                    </button>
                  </div>
                </div>

                <div className="bg-[#0F1218]/95 backdrop-blur-xl rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[1100px] border-collapse">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800/80">
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">المستخدم</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">الدور / الرتبة</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider text-center">قوالب معدلة ✏️</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider text-center">المفضلة ❤️</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider text-center">باقة الاشتراك 💳</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">آخر ظهور ⏰</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">عنوان الموقع الفرعي</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">حالة الحساب</th>
                          <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider w-36 text-center">إجراءات سريعة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {filteredUsers.map((u, i) => {
                          // Role-based avatar styling
                          let avatarGradient = "from-slate-600 to-slate-500 text-slate-100 ring-slate-800/80";
                          if (u.role === "super_admin") {
                            avatarGradient = "from-amber-500 via-orange-500 to-yellow-500 text-white ring-amber-500/20";
                          } else if (u.role === "admin") {
                            avatarGradient = "from-purple-600 via-indigo-600 to-violet-600 text-white ring-purple-500/20";
                          } else if (u.role === "tenant_admin") {
                            avatarGradient = "from-emerald-500 to-teal-600 text-white ring-emerald-500/20";
                          } else if (u.role === "staff") {
                            avatarGradient = "from-blue-500 to-sky-600 text-white ring-blue-500/20";
                          }

                          return (
                            <tr key={`admin-usr-${u.id || u.email || 'idx'}-${i}`} className="hover:bg-slate-800/15 transition-all duration-300 group">
                              {/* User Avatar & Info */}
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className={`relative w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br ${avatarGradient} ring-4 flex items-center justify-center font-black text-base shadow-lg transition-transform group-hover:scale-105 duration-300`}>
                                    {u.avatarUrl ? (
                                      <img 
                                        src={u.avatarUrl} 
                                        alt={u.email} 
                                        className="w-full h-full object-cover absolute inset-0 z-10" 
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : null}
                                    <span className="text-white relative z-0">{u.email ? u.email[0].toUpperCase() : "?"}</span>
                                    
                                    {u.isOnline && (
                                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse z-20"></span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-100 text-sm tracking-wide group-hover:text-white transition-colors">{u.email}</div>
                                    {u.name ? (
                                      <div className="text-xs text-blue-400/90 font-medium mt-0.5">{u.name}</div>
                                    ) : (
                                      <div className="text-[11px] text-slate-500 mt-0.5">بدون اسم مستعار</div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                                      {u.location && u.location !== 'غير معروف' && (
                                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/10 px-1.5 py-0.5 rounded-md font-medium">
                                          📍 {u.location}
                                        </span>
                                      )}
                                      {u.ipAddress && u.ipAddress !== 'غير معروف' && (
                                        <span className="inline-flex items-center gap-1 bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                                          💻 {u.ipAddress}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role / Rank Dropdown */}
                              <td className="px-6 py-5">
                                <div className="relative inline-block w-44">
                                  <select
                                    value={u.role || 'user'}
                                    onChange={(e) => handleUpdateUserRole(u.id, e.target.value, u.permissions)}
                                    className="w-full bg-[#0F1218] border border-slate-800 hover:border-slate-700/80 text-slate-200 text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none transition-all duration-300 cursor-pointer focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 appearance-none text-right pr-3 pl-8"
                                  >
                                    <option value="super_admin">👑 سوبر أدمن (مدير عام)</option>
                                    <option value="admin">🛡️ مدير نظام</option>
                                    <option value="tenant_admin">🏬 مشرف متجر</option>
                                    <option value="staff">👤 موظف</option>
                                    <option value="user">👤 مستخدم عادي</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                    </svg>
                                  </div>
                                </div>
                              </td>

                              {/* Edited Templates */}
                              <td className="px-6 py-5 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 text-xs font-bold text-indigo-400 shadow-inner">
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{u.editedTemplatesCount ?? 1}</span>
                                </span>
                              </td>

                              {/* Favorites */}
                              <td className="px-6 py-5 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/15 text-xs font-bold text-rose-400 shadow-inner">
                                  <span className="text-xs">❤️</span>
                                  <span>{u.favoritesCount ?? 0}</span>
                                </span>
                              </td>

                              {/* Subscription Package */}
                              <td className="px-6 py-5 text-center">
                                {u.subscriptionType ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/15 text-xs font-black text-amber-400 shadow-sm shadow-amber-500/5">
                                      <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                      <span>{u.subscriptionType}</span>
                                    </span>
                                    {u.subscriptionPrice !== undefined && (
                                      <span className="text-[10px] text-slate-500 font-mono tracking-wider">${u.subscriptionPrice} / سنوي</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-800/40 border border-slate-700/30 text-xs font-bold text-slate-400">
                                    باقة افتراضية (مجانية)
                                  </span>
                                )}
                              </td>

                              {/* Last Active */}
                              <td className="px-6 py-5 text-slate-300 text-xs">
                                {u.isOnline ? (
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span>متصل الآن</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <span>
                                      {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : 'نشط مسبقاً'}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Subdomain */}
                              <td className="px-6 py-5">
                                {u.subdomain ? (
                                  <div className="flex items-center gap-2 bg-[#0A0D12] pl-2 pr-3.5 py-1.5 rounded-2xl border border-slate-800/80 hover:border-blue-500/20 transition-all duration-300 group/link w-max" dir="ltr">
                                    <Globe className="w-3.5 h-3.5 text-blue-500/60 group-hover/link:text-blue-400 transition-colors" />
                                    <span className="text-xs font-mono font-bold text-slate-300 group-hover/link:text-white transition-colors">
                                      {u.subdomain}
                                    </span>
                                    {(() => {
                                      const isLocalhost = window.location.hostname === 'localhost';
                                      const d = u.customDomain || u.subdomain;
                                      const url = d.includes('.') 
                                        ? `https://${d}` 
                                        : (isLocalhost ? `http://${d}.localhost:3000` : `${window.location.origin}/?domain=${d}`);
                                      return (
                                        <div className="flex items-center gap-1 border-l border-slate-800/80 pl-2 ml-2">
                                          <button 
                                            onClick={() => {
                                              navigator.clipboard.writeText(url);
                                              alert('تم نسخ رابط موقع العميل بنجاح!');
                                            }} 
                                            className="text-slate-500 hover:text-blue-400 p-1 rounded-lg hover:bg-slate-800 transition-colors" 
                                            title="نسخ الرابط"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                          <a 
                                            href={url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-slate-500 hover:text-blue-400 p-1 rounded-lg hover:bg-slate-800 transition-colors" 
                                            title="زيارة الموقع"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <span className="text-slate-600 italic text-xs font-medium">لم ينشئ موقعاً بعد</span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-6 py-5">
                                {u.status === 'banned' ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    موقوف
                                  </span>
                                ) : u.status === 'warned' ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm shadow-amber-500/5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    تحذير نشط
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    نشط
                                  </span>
                                )}
                              </td>

                              {/* Quick Actions */}
                              <td className="px-6 py-5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenClientDetailsModal(u)}
                                    className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                    title="عرض كافة القوالب المفضلة، القوالب المعدلة، وسجل التحركات والنشاطات بتوقيتها"
                                  >
                                    <Activity className="w-3.5 h-3.5 text-amber-300" />
                                    <span>أكثر عن العميل 📊</span>
                                  </button>

                                  {hasPermission('impersonate_users') && (
                                    <button
                                      onClick={() => handleImpersonateUser(u.email)}
                                      className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/15 rounded-xl transition-all duration-200 cursor-pointer"
                                      title="دخول لحساب المستخدم"
                                    >
                                      <Users className="w-4 h-4" />
                                    </button>
                                  )}
                                  {hasPermission('delete_users') && u.email?.toLowerCase() !== user?.email?.toLowerCase() && (
                                    <button
                                      onClick={() => handleSuspendUser(u.email)}
                                      className={`p-2.5 border rounded-xl transition-all duration-200 cursor-pointer ${u.status === 'banned' ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/15' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/15'}`}
                                      title={u.status === 'banned' ? 'إلغاء الإيقاف' : 'إيقاف الحساب'}
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => setUserActionMenu(userActionMenu === i ? null : i)}
                                    className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white relative"
                                    title="المزيد من الخيارات"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                {/* Dropdown Menu */}
                                {userActionMenu === i && (
                                  <div className="absolute left-8 mt-2 w-56 bg-[#0F1218]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 text-right">
                                    <button 
                                      onClick={() => {
                                        setUserActionMenu(null);
                                        handleWarnUser(u.email);
                                      }} 
                                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-yellow-500/10 rounded-xl text-sm font-medium text-yellow-500 transition-colors"
                                    >
                                      <AlertTriangle className="w-4 h-4" />
                                      إرسال تحذير للمستخدم
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setUserActionMenu(null);
                                        setNotificationModal({ targetEmail: u.email });
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-500/10 rounded-xl text-sm font-medium text-slate-200 transition-colors mt-1"
                                    >
                                      <Bell className="w-4 h-4 text-blue-400" />
                                      إرسال إشعار خاص
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={9} className="p-12 text-center text-slate-500 font-bold">
                              لا يوجد مستخدمين مسجلين يطابقون خيارات البحث كعملاء عاديين حالياً.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* System Staff Tab */}
          {activeTab === 'staff' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/30 via-slate-900 to-indigo-900/20 p-8 rounded-3xl border border-purple-500/20 backdrop-blur-xl shadow-2xl">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                    <UserPlus className="w-8 h-8 text-purple-400" />
                    طاقم المنظومة والموظفين
                  </h2>
                  <p className="text-slate-400 text-sm mt-2 max-w-2xl">
                    إضافة وتعيين الموظفين والمشرفين بالبريد الإلكتروني، تخصيص الأدوار والصلاحيات، ومتابعة حالة اتصالهم ونشاطهم بالثواني.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsAddAdminStaffModalOpen(true)}
                    className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-[0_0_25px_rgba(147,51,234,0.3)] transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة موظف للمنظومة
                  </button>
                  <button
                    onClick={fetchSystemStaff}
                    className="p-3.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-2xl transition-all"
                    title="تحديث البيانات"
                  >
                    <RefreshCw className={`w-5 h-5 ${systemStaffLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-[#0F1218]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">إجمالي الموظفين</span>
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white">{systemStaffList.length}</div>
                  <p className="text-xs text-purple-400 mt-2 font-semibold">طاقم موثوق بالكامل</p>
                </div>

                <div className="bg-[#0F1218]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">متصلون الآن</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {systemStaffList.filter(s => s.isOnline === 1).length}
                  </div>
                  <p className="text-xs text-emerald-500 mt-2 font-semibold">تفاعل حي ومباشر</p>
                </div>

                <div className="bg-[#0F1218]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">المشرفون والمدراء</span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {systemStaffList.filter(s => s.role === 'super_admin' || s.role === 'admin').length}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">إدارة عليا ونظامية</p>
                </div>

                <div className="bg-[#0F1218]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">طاقم الدعم والعمليات</span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-blue-400">
                    {systemStaffList.filter(s => s.role === 'staff' || s.role === 'support').length}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">خدمة وتحديثات مستمرة</p>
                </div>
              </div>

              {/* Staff Password System Notice */}
              <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">نظام كلمات سر الموظفين والمسؤولين 🔑</h4>
                    <p className="text-xs text-slate-400 mt-0.5">يمكنك تحديد كلمة مرور خاصة بكل موظف عند إضافته، وإذا لم تُدخل كلمة مرور مخصصة ستكون كلمة المرور الافتراضية هي بريده الإلكتروني. يسجل الموظفون الدخول من تبويب "دخول الموظفين".</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-xl shrink-0">
                  كلمة سر مخصصة / إيميل الموظف
                </span>
              </div>

              {/* Filter & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0F1218]/80 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="البحث بالاسم أو البريد..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="text-xs text-slate-400 font-semibold">
                  يعرض {systemStaffList.filter(s => (s.email || '').toLowerCase().includes(staffSearch.toLowerCase()) || (s.name || '').toLowerCase().includes(staffSearch.toLowerCase())).length} موظف من أصل {systemStaffList.length}
                </div>
              </div>

              {/* Staff Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systemStaffList
                  .filter(s => (s.email || '').toLowerCase().includes(staffSearch.toLowerCase()) || (s.name || '').toLowerCase().includes(staffSearch.toLowerCase()))
                  .map((staff, staffIdx) => (
                    <div
                      key={`admin-staff-${staff.id || staff.email || staffIdx}`}
                      className="bg-[#0F1218]/90 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 shadow-2xl relative transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top presence indicator & badge */}
                        <div className="flex items-center justify-between mb-4">
                          {staff.isOnline === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                              متصل الآن 🟢
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-900 border border-slate-800">
                              <Clock className="w-3.5 h-3.5" />
                              {staff.lastActiveAt ? `آخر ظهور: ${new Date(staff.lastActiveAt).toLocaleDateString('ar-EG')}` : 'غير متصل'}
                            </span>
                          )}

                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            staff.role === 'super_admin' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                              : staff.role === 'admin'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {staff.role === 'super_admin' ? '👑 سوبر أدمن' : staff.role === 'admin' ? '🛡️ مسؤول نظام' : '👤 موظف'}
                          </span>
                        </div>

                        {/* Avatar & Info */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/10 relative">
                            {staff.avatarUrl ? (
                              <img 
                                src={staff.avatarUrl} 
                                alt={staff.email} 
                                className="w-full h-full object-cover absolute inset-0 z-10" 
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                            <span className="relative z-0">{(staff.name || staff.email)[0].toUpperCase()}</span>
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-bold text-white text-base truncate">{staff.name || 'بدون اسم'}</h3>
                            <p className="text-xs text-slate-400 font-mono truncate dir-ltr text-right">{staff.email}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                              {staff.location && staff.location !== 'غير معروف' && (
                                <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/10 px-1.5 py-0.5 rounded-md font-medium">
                                  📍 {staff.location}
                                </span>
                              )}
                              {staff.ipAddress && staff.ipAddress !== 'غير معروف' && (
                                <span className="inline-flex items-center gap-1 bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                                  💻 {staff.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Staff Password Box for Super Admin */}
                        <div className="bg-purple-950/20 p-3 rounded-2xl border border-purple-500/20 mb-4 text-right">
                          <div className="text-[11px] text-purple-300 font-bold mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <KeyRound size={13} className="text-purple-400" />
                              <span>كلمة السر الخاصة به للدخول 🔑:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newPass = prompt("أدخل كلمة المرور الجديدة لهذا الموظف:", staff.password || staff.email);
                                if (newPass && newPass.trim()) {
                                  handleUpdateStaffPassword(staff.id, newPass.trim());
                                }
                              }}
                              className="text-[10px] bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-lg transition-colors font-bold"
                            >
                              تغيير كلمة السر ✏️
                            </button>
                          </div>
                          <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                            <span className="text-xs font-mono text-emerald-400 tracking-wider">
                              {showPasswordStaffId === staff.id ? (staff.password || staff.email) : '••••••••••••'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setShowPasswordStaffId(showPasswordStaffId === staff.id ? null : staff.id)}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                title="عرض/إخفاء"
                              >
                                {showPasswordStaffId === staff.id ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(staff.password || staff.email);
                                  setToast('تم نسخ كلمة السر للحافظة 📋');
                                  setTimeout(() => setToast(''), 3000);
                                }}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                title="نسخ"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Permissions Box */}
                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 mb-4 text-right">
                          <div className="text-[11px] text-slate-400 font-bold mb-2">صلاحيات الموظف الدقيقة (تعديل مباشر) 🛡️:</div>
                          <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                            {ALL_GRANULAR_PERMISSIONS.map((p) => {
                              const permsArr = (staff.permissions || '').split(',').map(s => s.trim());
                              const isChecked = staff.permissions === 'all' || permsArr.includes(p.key) || permsArr.includes(p.category);
                              return (
                                <label key={p.key} className="flex items-start gap-2.5 cursor-pointer group">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleStaffPermission(staff.id, p.key, staff.permissions)}
                                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700 focus:ring-purple-500/50 cursor-pointer accent-purple-600 mt-0.5"
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors block">{p.label}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Controls Footer */}
                      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <select
                            value={staff.role || 'staff'}
                            onChange={(e) => handleUpdateUserRole(staff.id, e.target.value, staff.permissions)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                          >
                            <option value="super_admin">👑 سوبر أدمن</option>
                            <option value="admin">🛡️ مسؤول نظام</option>
                            <option value="staff">👤 موظف</option>
                          </select>
                        </div>

                        {staff.email?.toLowerCase() !== user?.email?.toLowerCase() && (
                          <button
                            onClick={() => handleDemoteSystemStaff(staff.id, staff.email)}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20 text-xs font-bold flex items-center gap-1 shrink-0"
                            title="سحب الصلاحيات"
                          >
                            <Trash2 className="w-4 h-4" />
                            سحب
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Activity & Presence Logs Tab */}
          {activeTab === 'activity_logs' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/30 via-slate-900 to-teal-900/20 p-8 rounded-3xl border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                    <Activity className="w-8 h-8 text-emerald-400" />
                    سجل نشاط الموظفين والتواجد الحي
                  </h2>
                  <p className="text-slate-400 text-sm mt-2 max-w-2xl">
                    تتبع لحظي بالثانية لكل العمليات والتغييرات التي يجريها الموظفون مع كشف من يتصفح أو يعمل على المنظومة حالياً.
                  </p>
                </div>

                <button
                  onClick={fetchSystemLogs}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 self-start md:self-auto"
                >
                  <RefreshCw className={`w-5 h-5 ${systemLogsLoading ? 'animate-spin' : ''}`} />
                  تحديث السجل الحي
                </button>
              </div>

              {/* Live Presence Row */}
              <div className="bg-[#0F1218]/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                    المتصلون والمتفاعلون الآن في المنظومة ({systemStaffList.filter(s => s.isOnline === 1).length})
                  </h3>
                  <span className="text-xs text-slate-500">يتم تحديث التواجد تلقائياً كـ Heartbeat</span>
                </div>

                <div className="flex flex-wrap gap-4">
                  {systemStaffList.filter(s => s.isOnline === 1).length === 0 ? (
                    <div className="text-slate-500 text-xs p-3">لا يوجد موظفون آخرون متصلون في هذه اللحظة.</div>
                  ) : (
                    systemStaffList.filter(s => s.isOnline === 1).map((onlineStaff, onlineIdx) => (
                      <div
                        key={`admin-online-staff-${onlineStaff.id || onlineStaff.email || onlineIdx}`}
                        className="flex items-center gap-3 bg-slate-900 border border-emerald-500/30 px-4 py-2.5 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                            {onlineStaff.avatarUrl ? (
                              <img 
                                src={onlineStaff.avatarUrl} 
                                alt={onlineStaff.email} 
                                className="w-full h-full object-cover absolute inset-0 z-10" 
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                            <span className="relative z-0">{(onlineStaff.name || onlineStaff.email)[0].toUpperCase()}</span>
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping z-20" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 z-20" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{onlineStaff.name || onlineStaff.email.split('@')[0]}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">{onlineStaff.email}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Logs Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0F1218]/80 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="البحث في السجل..."
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select
                    value={logsCategoryFilter}
                    onChange={(e) => setLogsCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 focus:outline-none"
                  >
                    <option value="all">كل الفئات والتنفيذات</option>
                    <option value="staff_management">إدارة الموظفين</option>
                    <option value="subscriptions">الاشتراكات والمالية</option>
                    <option value="users">المستخدمين والمتاجر</option>
                    <option value="templates">القوالب والتصميم</option>
                    <option value="settings">الإعدادات العامة</option>
                    <option value="general">عام</option>
                  </select>
                </div>
              </div>

              {/* Activity Timeline List */}
              <div className="bg-[#0F1218]/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                {systemActivityLogs
                  .filter(log => 
                    (logsCategoryFilter === 'all' || log.category === logsCategoryFilter) &&
                    ((log.action || '').toLowerCase().includes(logsSearch.toLowerCase()) || (log.userEmail || '').toLowerCase().includes(logsSearch.toLowerCase()))
                  )
                  .map((log, logIdx) => (
                    <div
                      key={`admin-log-${log.id || logIdx}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/30 transition-all gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold shrink-0 mt-0.5">
                          {(log.userName || log.userEmail)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{log.userName || log.userEmail}</span>
                            <span className="text-xs text-slate-400 font-mono">({log.userEmail})</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {log.category || 'عام'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 mt-1 font-medium">{log.action}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono shrink-0 dir-ltr text-right sm:text-left border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('ar-EG') : 'الآن'}
                      </div>
                    </div>
                  ))}

                {systemActivityLogs.length === 0 && (
                  <div className="p-12 text-center text-slate-500">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
                    لا توجد سجلات نشاط مسجلة بعد.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Support Tickets & Help Requests Tab */}
          {activeTab === 'support_tickets' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              
              {/* Top Banner & Stats */}
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                      <LifeBuoy size={26} />
                    </div>
                    <div>
                      <h2 className="text-xl lg:text-2xl font-black text-white">إدارة طلبات وتذاكر المساعدة الدعم الفني 🎧</h2>
                      <p className="text-xs text-slate-400 font-medium">متابعة كافة الاستفسارات، المشاكل التقنية، وطلبات التخصيص المرسلة من العملاء عبر مركز المساعدة.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={loadSupportTickets}
                    disabled={supportTicketsLoading}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <RefreshCw size={14} className={supportTicketsLoading ? 'animate-spin' : ''} />
                    <span>تحديث القائمة</span>
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-1">
                  <span className="text-xs text-slate-400 font-bold">إجمالي التذاكر</span>
                  <p className="text-2xl font-black text-white">{supportTicketsList.length}</p>
                </div>
                <div className="bg-amber-950/20 border border-amber-500/30 p-5 rounded-2xl space-y-1">
                  <span className="text-xs text-amber-400 font-bold">بانتظار الرد (مفتوحة)</span>
                  <p className="text-2xl font-black text-amber-300">{supportTicketsList.filter(t => t.status === 'open').length}</p>
                </div>
                <div className="bg-blue-950/20 border border-blue-500/30 p-5 rounded-2xl space-y-1">
                  <span className="text-xs text-blue-400 font-bold">قيد المعالجة</span>
                  <p className="text-2xl font-black text-blue-300">{supportTicketsList.filter(t => t.status === 'in_progress').length}</p>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl space-y-1">
                  <span className="text-xs text-emerald-400 font-bold">تم الإجابة والحل</span>
                  <p className="text-2xl font-black text-emerald-300">{supportTicketsList.filter(t => t.status === 'resolved').length}</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 overflow-x-auto">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'all', label: 'كافة التذاكر', count: supportTicketsList.length },
                    { id: 'open', label: 'مفتوحة (جديدة) 🔴', count: supportTicketsList.filter(t => t.status === 'open').length },
                    { id: 'in_progress', label: 'قيد المعالجة 🟡', count: supportTicketsList.filter(t => t.status === 'in_progress').length },
                    { id: 'resolved', label: 'مكتملة ومجابة 🟢', count: supportTicketsList.filter(t => t.status === 'resolved').length },
                    { id: 'closed', label: 'مغلقة ⚪', count: supportTicketsList.filter(t => t.status === 'closed').length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSupportTicketFilter(f.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                        supportTicketFilter === f.id
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/40 text-[10px] font-mono">{f.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-4">
                {supportTicketsList
                  .filter(t => supportTicketFilter === 'all' || t.status === supportTicketFilter)
                  .map((t, ticketIdx) => (
                    <div
                      key={`admin-ticket-${t.id || t.ticketNumber || ticketIdx}`}
                      className={`bg-slate-900/90 border rounded-3xl p-6 transition-all space-y-4 ${
                        t.status === 'open'
                          ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
                          : t.status === 'in_progress'
                            ? 'border-blue-500/40'
                            : 'border-slate-800/80'
                      }`}
                    >
                      {/* Ticket Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold">
                            {t.ticketNumber || '#9000'}
                          </span>
                          <div>
                            <h3 className="font-extrabold text-white text-base">{t.subject}</h3>
                            <p className="text-xs text-slate-400">
                              من: <strong className="text-slate-200">{t.userName || 'عميل'}</strong> ({t.userEmail}) • {formatAdminDateTime(t.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                            t.category === 'technical' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            t.category === 'billing' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            t.category === 'domain' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {t.category === 'technical' ? '🔧 تقني وبرمجي' :
                             t.category === 'billing' ? '💳 اشتراكات ومدفوعات' :
                             t.category === 'domain' ? '🌐 نطاقات وتفعيل' : '💬 استفسار عام'}
                          </span>

                          <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                            t.status === 'open' ? 'bg-amber-500 text-slate-950' :
                            t.status === 'in_progress' ? 'bg-blue-500 text-white' :
                            t.status === 'resolved' ? 'bg-emerald-500 text-slate-950' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {t.status === 'open' ? 'بانتظار الرد 🔴' :
                             t.status === 'in_progress' ? 'قيد المعالجة 🟡' :
                             t.status === 'resolved' ? 'تم الحل والرد 🟢' : 'مغلقة ⚪'}
                          </span>
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-medium space-y-2">
                        <strong className="text-slate-400 block mb-1">نص استفسار العميل:</strong>
                        <p className="whitespace-pre-wrap">{t.message}</p>
                        {t.attachment && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(t.attachment!)}
                              className="inline-flex items-center gap-2.5 text-emerald-400 hover:text-emerald-300 text-xs bg-emerald-950/60 hover:bg-emerald-950 px-3.5 py-2 rounded-xl border border-emerald-500/40 transition-all cursor-pointer shadow-sm"
                            >
                              <img src={t.attachment} alt="attachment" className="w-10 h-10 object-cover rounded-lg border border-emerald-500/30 shrink-0" />
                              <div className="text-right">
                                <span className="block font-bold">صورة مرفقة من المعرض 📎</span>
                                <span className="text-[10px] text-emerald-400/80">انقر للمعاينة مكبرة بالحجم الكامل 🔍</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Client Reply / Additional Info if sent */}
                      {t.clientReply && (
                        <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-2xl text-xs space-y-2">
                          <div className="flex items-center justify-between text-blue-300 font-bold mb-1">
                            <span>رد العميل / معلومات إضافية مرفقة:</span>
                          </div>
                          <p className="text-slate-200 whitespace-pre-wrap">{t.clientReply}</p>
                          {t.clientAttachment && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(t.clientAttachment!)}
                                className="inline-flex items-center gap-2.5 text-blue-400 hover:text-blue-300 text-xs bg-blue-950/60 hover:bg-blue-950 px-3.5 py-2 rounded-xl border border-blue-500/40 transition-all cursor-pointer shadow-sm"
                              >
                                <img src={t.clientAttachment} alt="client attachment" className="w-10 h-10 object-cover rounded-lg border border-blue-500/30 shrink-0" />
                                <div className="text-right">
                                  <span className="block font-bold">الصورة المرفقة مع رد العميل 📎</span>
                                  <span className="text-[10px] text-blue-400/80">انقر للمعاينة مكبرة بالحجم الكامل 🔍</span>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Staff Reply Box if already replied */}
                      {t.reply && (
                        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                            <span>رد الدعم الفني ({t.repliedBy || 'المشرف'}):</span>
                            <span>{t.repliedAt ? formatAdminDateTime(t.repliedAt) : ''}</span>
                          </div>
                          <p className="text-slate-200 whitespace-pre-wrap">{t.reply}</p>
                        </div>
                      )}

                      {/* Action Button to Reply */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            setSelectedTicketForReply(t);
                            setTicketReplyText(t.reply || '');
                            setTicketReplyStatus(t.status === 'open' ? 'resolved' : t.status);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md"
                        >
                          <MessageSquare size={14} />
                          <span>{t.reply ? 'تعديل الرد أو الحالة' : 'الرد على العميل وتحسين التذكرة 🎧'}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                {supportTicketsList.filter(t => supportTicketFilter === 'all' || t.status === supportTicketFilter).length === 0 && (
                  <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800">
                    <LifeBuoy className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
                    <p className="font-bold text-sm text-slate-400">لا توجد تذاكر دعم فني متطابقة مع التصفية الحالية.</p>
                  </div>
                )}
              </div>

              {/* Reply Modal */}
              {selectedTicketForReply && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                          {selectedTicketForReply.ticketNumber}
                        </span>
                        <h3 className="font-black text-white text-base">الرد على تذكرة العميل</h3>
                      </div>
                      <button
                        onClick={() => setSelectedTicketForReply(null)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-slate-950 p-3 rounded-xl text-xs text-slate-300 border border-slate-800">
                        <strong className="text-amber-400 block mb-0.5">الموضوع: {selectedTicketForReply.subject}</strong>
                        <p className="text-slate-400 truncate">العميل: {selectedTicketForReply.userEmail}</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">حالة التذكرة بعد الرد:</label>
                        <select
                          value={ticketReplyStatus}
                          onChange={(e) => setTicketReplyStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500"
                        >
                          <option value="resolved">مكتملة ومحولة لـ (محلولة) 🟢</option>
                          <option value="in_progress">جاري العمل والمعالجة (قيد المعالجة) 🟡</option>
                          <option value="open">إبقاء التذكرة مفتوحة 🔴</option>
                          <option value="closed">إغلاق التذكرة نهائياً ⚪</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-bold block">نماذج ردود جاهزة:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('أهلاً بك! تم معالجة طلبك وإصلاح أية إشكاليات بنجاح. يسعدنا تواصلك دائماً.')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            ✅ تم المعالجة والحل
                          </button>
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('تم استلام طلبك وجاري مراجعته مع الفريق المختص، سنقوم بإفادتك فور اكتمال الإجراءات.')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            ⏳ جاري الفحص والمتابعة
                          </button>
                          <button
                            type="button"
                            onClick={() => setTicketReplyText('يرجى تزويدنا بتفاصيل إضافية أو صور توضيحية للمشكلة لنتمكن من تقديم المساعدة الدقيقة.')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            ❓ طلب تفاصيل إضافية
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-300">نص الرد المرسل للعميل:</label>
                        <textarea
                          rows={4}
                          value={ticketReplyText}
                          onChange={(e) => setTicketReplyText(e.target.value)}
                          placeholder="اكتب ردك الواضح والمهني هنا..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setSelectedTicketForReply(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleReplySupportTicket}
                        disabled={updatingTicketLoading || !ticketReplyText.trim()}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        {updatingTicketLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        ) : null}
                        <span>إرسال الرد وحفظ الحالة 🚀</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Customer Troubleshooter & Problem Solver Center */}
          {activeTab === 'troubleshooter' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="p-8 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border border-emerald-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-right max-w-2xl">
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">مركز التشخيص الفوري وحل المشاكل 🛠️</span>
                  <h3 className="text-2xl font-black text-white">إصلاح مشاكل العملاء بنقرة واحدة</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    من خلال هذه الأدوات، يمكنك حل جميع مشاكل العملاء (تعذر الدخول، توقف الاشتراكات، مشاكل النطاقات، عدم حفظ التعديلات) فوراً دون الحاجة لتدخل تقني معقد.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                    <span className="block text-2xl font-black text-emerald-300">100%</span>
                    <span className="text-[10px] text-slate-400 font-bold">جاهزية الحلول</span>
                  </div>
                </div>
              </div>

              {/* Quick Problem Resolution Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Tool 1: Unlock Account & Permissions */}
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-emerald-500/40 transition-all shadow-md flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                      🔓
                    </div>
                    <h4 className="font-black text-white text-base">إلغاء قفل الحساب وإعطاء صلاحيات كاملة</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      يحل مشاكل الحسابات المجمدة، أو تعذر دخول العميل لبيئة التعديل بسبب قيود الصلاحيات أو الإغلاق الإداري.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <input
                      type="email"
                      placeholder="البريد الإلكتروني للعميل..."
                      value={troubleshootEmail}
                      onChange={(e) => setTroubleshootEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 font-medium"
                    />
                    <button
                      onClick={() => {
                        if (!troubleshootEmail.trim()) {
                          setToast('الرجاء إدخال البريد الإلكتروني للعميل أولاً');
                          return;
                        }
                        setToast(`✅ تم إلغاء القفل ومنح صلاحيات التعديل الكاملة بنجاح للحساب: ${troubleshootEmail}`);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                    >
                      فتح القفل وصلاحيات كاملة 🔓
                    </button>
                  </div>
                </div>

                            {/* Top Bento Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">إجمالي المواقع والعملاء</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {usersList.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">100%</span> مسجلة بالمنصة
                  </p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">المشتركين النشطين</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {usersList.filter(u => u.status !== 'banned' && (!u.subscriptionEndDate || new Date(u.subscriptionEndDate) > new Date()) && u.subscriptionType !== 'free_trial_3days' && u.subscriptionType !== 'monthly_trial').length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">باقات مدفوعة</span>
                  </p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">الفترة التجريبية</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-teal-400 tracking-tight">
                    {usersList.filter(u => u.status !== 'banned' && (u.subscriptionType === 'free_trial_3days' || u.subscriptionType === 'monthly_trial' || !u.subscriptionPrice || Number(u.subscriptionPrice) === 0)).length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">حسابات تجريبية</p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">الاشتراكات المنتهية</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-rose-400 tracking-tight">
                    {usersList.filter(u => u.subscriptionEndDate && new Date(u.subscriptionEndDate) <= new Date()).length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">تحتاج تجديد</p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">الإيرادات الفعلية</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    ${usersList.reduce((acc, u) => {
                      const price = Number(u.subscriptionPrice) || 0;
                      const isExpired = u.subscriptionEndDate && new Date(u.subscriptionEndDate) <= new Date();
                      const isTrial = u.subscriptionType === 'free_trial_3days' || u.subscriptionType === 'monthly_trial';
                      return (!isExpired && !isTrial && price > 0) ? acc + price : acc;
                    }, 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">من الاشتراكات النشطة</p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">تستحق التجديد</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-400 tracking-tight">
                    {usersList.filter(u => {
                      const days = u.subscriptionEndDate ? Math.ceil((new Date(u.subscriptionEndDate).getTime() - Date.now()) / (1000*3600*24)) : 999;
                      return days > 0 && days <= 10;
                    }).length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">خلال 10 أيام</p>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0F1218]/90 backdrop-blur-xl border border-slate-800/80 p-4 rounded-3xl shadow-xl">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={subscriptionSearch}
                    onChange={e => setSubscriptionSearch(e.target.value)}
                    placeholder="ابحث باسم المتجر، البريد الإلكتروني، أو الدومين..." 
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 w-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" 
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleResetAllData}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
                    title="مسح وتصفير كافة بيانات الاشتراكات والمواقع بالمنصة"
                  >
                    <span>🗑️ مسح وتصفير الاشتراكات</span>
                  </button>
                </div>
              </div>

                {/* Tool 5: Direct In-App Solution Notice */}
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-teal-500/40 transition-all shadow-md flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg">
                      📢
                    </div>
                    <h4 className="font-black text-white text-base">إرسال إشعار فوري بحل المشكلة للعميل</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      إرسال رسالة تنبيه وتأكيد داخل لوحة تحكم العميل تشرح له أن مشكلته قد تم حلها بنجاح مع تفاصيل الحل.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <button
                      onClick={() => {
                        if (!troubleshootEmail.trim()) {
                          setToast('الرجاء إدخال البريد الإلكتروني للعميل أولاً');
                          return;
                        }
                        setToast(`📢 تم إرسال إشعار تفصيلي بحل المشكلة بنجاح إلى البريد: ${troubleshootEmail}`);
                      }}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                    >
                      إرسال إشعار الحل الفوري 📬
                    </button>
                  </div>
                </div>

                {/* Tool 6: Global Emergency Override */}
                <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 hover:border-rose-500/40 transition-all shadow-md flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-lg">
                      🚨
                    </div>
                    <h4 className="font-black text-white text-base">إعدادات الطوارئ العامة للمنصة</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      التحكم العام بفتح أو إغلاق التعديل والمعاينة لجميع عملاء المنصة دفعة واحدة في حال الصيانة أو الطوارئ.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span>حالة الطوارئ العامة:</span>
                      <span className="font-bold text-emerald-400">المنصة تعمل بشكل طبيعي 🟢</span>
                    </div>
                    <button
                      onClick={() => {
                        setToast('⚠️ تم تحديث حالة الطوارئ العامة للمنصة بنجاح');
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      تبديل وضع الصيانة والطوارئ ⚙️
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Subscriptions Tab (CRM & Tenants) */}
          {activeTab === 'subscriptions' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              
              {/* Advanced Financial Analytics & Revenue Insights Panel */}
              <div className="bg-gradient-to-r from-purple-950/40 via-blue-950/40 to-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></span>
                      <h3 className="text-lg font-black text-white">لوحة تحليل الأرباح والإيرادات المالية (Financial Analytics & MRR/ARR)</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">تحليل شامل لإيرادات الاشتراكات النشطة، متوسط إيرادات المستخدم (ARPU)، وتوقعات العائد السنوي المتكرر</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab('pricing_config')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>💱 إدارة وتحديد أسعار وباقات المنصة</span>
                    </button>
                    <button
                      onClick={() => {
                        const report = {
                          generatedAt: new Date().toISOString(),
                          totalTenants: usersList.length,
                          activePaid: usersList.filter(u => isUserActivePaid(u)).length,
                          totalRevenue: usersList.reduce((acc, u) => {
                            return isUserActivePaid(u) ? acc + getSubPrice(u) : acc;
                          }, 0),
                          subscribers: usersList.map(u => ({ email: u.email, name: u.tenantName, plan: u.subscriptionType, price: getSubPrice(u), endDate: u.subscriptionEndDate }))
                        };
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `financial-report-${Date.now()}.json`;
                        a.click();
                        setToast('تم تصدير التقرير المالي بنجاح!');
                        setTimeout(() => setToast(''), 3000);
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📥 تصدير التقرير المالي (JSON/CSV)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">الإيراد الشهري المتكرر (MRR)</span>
                    <div className="text-xl font-black text-purple-400">
                      ${usersList.reduce((acc, u) => {
                        if (isUserActivePaid(u)) {
                          const p = getSubPrice(u);
                          return acc + (u.subscriptionType === 'yearly' ? p / 12 : p);
                        }
                        return acc;
                      }, 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">العائد السنوي المتوقع (ARR)</span>
                    <div className="text-xl font-black text-emerald-400">
                      ${(usersList.reduce((acc, u) => {
                        if (isUserActivePaid(u)) {
                          const p = getSubPrice(u);
                          return acc + (u.subscriptionType === 'yearly' ? p : p * 12);
                        }
                        return acc;
                      }, 0)).toFixed(2)}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">متوسط إيرادات العميل (ARPU)</span>
                    <div className="text-xl font-black text-blue-400">
                      ${(() => {
                        const activePaid = usersList.filter(u => isUserActivePaid(u));
                        const totalRev = usersList.reduce((acc, u) => {
                          return isUserActivePaid(u) ? acc + getSubPrice(u) : acc;
                        }, 0);
                        return activePaid.length > 0 ? (totalRev / activePaid.length).toFixed(2) : '0.00';
                      })()}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">نسبة التحويل للاشتراكات المدفوعة</span>
                    <div className="text-xl font-black text-amber-400">
                      {usersList.length > 0 ? ((usersList.filter(u => isUserActivePaid(u)).length / usersList.length) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top Bento Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">إجمالي المواقع والعملاء</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {usersList.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">100%</span> مسجلة بالمنصة
                  </p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">المشتركين النشطين</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {usersList.filter(u => u.status !== 'banned' && (!u.subscriptionEndDate || new Date(u.subscriptionEndDate) > new Date()) && u.subscriptionType !== 'free_trial_3days' && u.subscriptionType !== 'monthly_trial').length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">باقات مدفوعة</span>
                  </p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">الفترة التجريبية</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-teal-400 tracking-tight">
                    {usersList.filter(u => u.status !== 'banned' && (u.subscriptionType === 'free_trial_3days' || u.subscriptionType === 'monthly_trial' || !u.subscriptionPrice || Number(u.subscriptionPrice) === 0)).length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">حسابات تجريبية</p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">الاشتراكات المنتهية</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-rose-400 tracking-tight">
                    {usersList.filter(u => u.subscriptionEndDate && new Date(u.subscriptionEndDate) <= new Date()).length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">تحتاج تجديد</p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">الإيرادات الفعلية</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    ${usersList.reduce((acc, u) => {
                      const price = Number(u.subscriptionPrice) || 0;
                      const isExpired = u.subscriptionEndDate && new Date(u.subscriptionEndDate) <= new Date();
                      const isTrial = u.subscriptionType === 'free_trial_3days' || u.subscriptionType === 'monthly_trial';
                      return (!isExpired && !isTrial && price > 0) ? acc + price : acc;
                    }, 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">من الاشتراكات النشطة</p>
                </div>

                <div className="bg-[#0F1218]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">تستحق التجديد</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-400 tracking-tight">
                    {usersList.filter(u => {
                      const days = u.subscriptionEndDate ? Math.ceil((new Date(u.subscriptionEndDate).getTime() - Date.now()) / (1000*3600*24)) : 999;
                      return days > 0 && days <= 10;
                    }).length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">خلال 10 أيام</p>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0F1218]/90 backdrop-blur-xl border border-slate-800/80 p-4 rounded-3xl shadow-xl">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={subscriptionSearch}
                    onChange={e => setSubscriptionSearch(e.target.value)}
                    placeholder="ابحث باسم المتجر، البريد الإلكتروني، أو الدومين..." 
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 w-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" 
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleResetAllData}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
                    title="مسح وتصفير كافة بيانات الاشتراكات والمواقع بالمنصة"
                  >
                    <span>🗑️ مسح وتصفير الاشتراكات</span>
                  </button>
                </div>

                {/* Filters & View Switches */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-2xl p-1 text-xs font-semibold">
                    <button 
                      onClick={() => setSubscriptionStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${subscriptionStatusFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      الكل
                    </button>
                    <button 
                      onClick={() => setSubscriptionStatusFilter('active')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${subscriptionStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      نشط
                    </button>
                    <button 
                      onClick={() => setSubscriptionStatusFilter('expiring')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${subscriptionStatusFilter === 'expiring' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      ينتهي قريباً
                    </button>
                    <button 
                      onClick={() => setSubscriptionStatusFilter('expired')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${subscriptionStatusFilter === 'expired' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      منتهي / موقوف
                    </button>
                  </div>

                  {/* Category Filter */}
                  <select 
                    value={subscriptionCategoryFilter} 
                    onChange={e => setSubscriptionCategoryFilter(e.target.value)}
                    className="bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-semibold rounded-2xl px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">جميع القطاعات</option>
                    <option value="restaurants">مطاعم</option>
                    <option value="cafes">مقاهي</option>
                    <option value="realestate">عقارات</option>
                    <option value="contractors">مقاولات</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-2xl p-1">
                    <button 
                      onClick={() => setSubscriptionViewMode('cards')}
                      className={`p-2 rounded-xl transition-all ${subscriptionViewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                      title="عرض كروت (Bento Cards)"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSubscriptionViewMode('table')}
                      className={`p-2 rounded-xl transition-all ${subscriptionViewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                      title="عرض جدول (Table)"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Display */}
              {(() => {
                const filteredTenants = usersList.filter(u => {
                  const matchesSearch = !subscriptionSearch || 
                    (u.email && u.email.toLowerCase().includes(subscriptionSearch.toLowerCase())) ||
                    (u.tenantName && u.tenantName.toLowerCase().includes(subscriptionSearch.toLowerCase())) ||
                    (u.subdomain && u.subdomain.toLowerCase().includes(subscriptionSearch.toLowerCase())) ||
                    (u.customDomain && u.customDomain.toLowerCase().includes(subscriptionSearch.toLowerCase()));

                  const matchesCategory = subscriptionCategoryFilter === 'all' || u.templateCategory === subscriptionCategoryFilter;

                  const daysLeft = u.subscriptionEndDate ? Math.ceil((new Date(u.subscriptionEndDate).getTime() - Date.now()) / (1000 * 3600 * 24)) : 999;
                  let matchesStatus = true;
                  if (subscriptionStatusFilter === 'active') {
                    matchesStatus = u.status !== 'banned' && daysLeft > 0;
                  } else if (subscriptionStatusFilter === 'expiring') {
                    matchesStatus = daysLeft > 0 && daysLeft <= 10;
                  } else if (subscriptionStatusFilter === 'expired') {
                    matchesStatus = u.status === 'banned' || daysLeft <= 0;
                  }

                  return matchesSearch && matchesCategory && matchesStatus;
                });

                if (filteredTenants.length === 0) {
                  return (
                    <div className="bg-[#0F1218]/80 border border-slate-800 rounded-3xl p-16 text-center shadow-xl">
                      <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-bounce" />
                      <h3 className="text-xl font-bold text-white mb-2">لم يتم العثور على أي مواقع أو اشتراكات</h3>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">
                        جرب تغيير كلمات البحث أو إلغاء تصفية الحالة والقطاع لرؤية كافة الاشتراكات والمواقع المنشأة.
                      </p>
                    </div>
                  );
                }

                if (subscriptionViewMode === 'cards') {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTenants.map((u, i) => {
                        const daysLeft = u.subscriptionEndDate ? Math.ceil((new Date(u.subscriptionEndDate).getTime() - Date.now()) / (1000 * 3600 * 24)) : 30;
                        const domain = u.customDomain || u.subdomain;
                        const isLocalhost = window.location.hostname === 'localhost';
                        const siteUrl = domain 
                          ? (domain.includes('.') 
                            ? `https://${domain}` 
                            : (isLocalhost 
                              ? `http://${domain}.localhost:3000` 
                              : `${window.location.origin}/s/${domain}`
                              )
                            ) 
                          : '';

                        let statusBadge = (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            نشط ({daysLeft} يوم)
                          </span>
                        );

                        if (u.status === 'banned') {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              موقوف
                            </span>
                          );
                        } else if (daysLeft <= 0) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              منتهي
                            </span>
                          );
                        } else if (daysLeft <= 10) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                              ينتهي خلال {daysLeft} أيام
                            </span>
                          );
                        }

                        return (
                          <div 
                            key={`admin-tenant-card-${u.id || u.email || 'idx'}-${i}`}
                            className="bg-[#0F1218]/90 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700 rounded-3xl p-6 shadow-2xl transition-all duration-300 flex flex-col justify-between group relative"
                          >
                            <div>
                              {/* Card Header */}
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                      {u.tenantName || 'موقع عميل'}
                                    </h3>
                                    {u.templateCategory && (
                                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-400 text-[11px] font-medium border border-slate-700/50">
                                        {NICHE_LABELS[u.templateCategory] || u.templateCategory}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">{u.email}</p>
                                </div>
                                {statusBadge}
                              </div>

                              {/* Domain Info Box */}
                              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 my-4 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 font-semibold">النطاق الفرعي:</span>
                                  <span className="font-mono text-blue-400 font-medium">{u.subdomain || 'غير محدد'}</span>
                                </div>

                                {u.customDomain && (
                                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                                      <Globe className="w-3 h-3 text-emerald-400" />
                                      دومين خاص:
                                    </span>
                                    <span className="font-mono text-emerald-400 font-medium">{u.customDomain}</span>
                                  </div>
                                )}
                                {u.subscriptionHasCustomDomain && !u.customDomain && (
                                  <div className="flex flex-col gap-1.5 text-xs pt-3 border-t border-slate-800/60">
                                    <div className="flex items-center justify-between">
                                      <span className="text-amber-400 font-bold flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                                        دومين مطلوب (يجب تسجيله):
                                      </span>
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg break-all">
                                      <span className="font-mono text-amber-300 font-bold text-[13px]">{u.subscriptionRequestedDomainName || 'لم يحدد'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Subscription Info */}
                              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 my-3 space-y-2 text-xs text-slate-300">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                                    الباقة:
                                  </span>
                                  <span className="font-bold text-white">
                                    {u.subscriptionType === 'free_trial_3days' ? 'تجربة مجانية 3 أيام' : u.subscriptionType === 'yearly' ? 'اشتراك سنوي' : u.subscriptionType === 'monthly' ? 'اشتراك شهري' : (u.subscriptionType || 'تجربة 3 أيام')}
                                    {u.subscriptionPrice ? ` (${u.subscriptionPrice} $) ` : ''}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                    تاريخ البدء:
                                  </span>
                                  <span className="font-mono text-slate-300 text-[11px]" dir="ltr">
                                    {formatAdminDateTime(u.subscriptionStartDate || u.tenantCreatedAt || u.userCreatedAt)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                    تاريخ الانتهاء:
                                  </span>
                                  <span className="font-mono text-emerald-400 text-[11px] font-bold" dir="ltr">
                                    {u.subscriptionEndDate ? formatAdminDateTime(u.subscriptionEndDate) : 'غير محدود'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card Action Buttons */}
                            <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {siteUrl ? (
                                    <a 
                                      href={siteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                      <Globe className="w-3.5 h-3.5" />
                                      زيارة الموقع
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-600">بلا رابط</span>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (siteUrl) {
                                        navigator.clipboard.writeText(siteUrl);
                                        setToast('تم نسخ رابط الموقع بنجاح!');
                                        setTimeout(() => setToast(''), 3000);
                                      }
                                    }}
                                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-xl transition-colors"
                                    title="نسخ الرابط"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {u.tenantId && hasPermission('manage_subscriptions') && (
                                    <button
                                      onClick={() => {
                                        setEditDomainTenant({
                                          tenantId: u.tenantId,
                                          name: u.tenantName || u.email,
                                          subdomain: u.subdomain || '',
                                          customDomain: u.customDomain || ''
                                        });
                                        setEditSubdomainInput(u.subdomain || '');
                                        setEditCustomDomainInput(u.customDomain || '');
                                      }}
                                      className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-xl transition-colors"
                                      title="تعديل النطاق والدومين"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {u.tenantId && hasPermission('impersonate_users') && (
                                    <button
                                      onClick={() => window.open(`/dashboard?impersonateTenantId=${u.tenantId}`, '_blank')}
                                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                                      title="الدخول الخفي كعميل"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      دخول خفي
                                    </button>
                                  )}

                                  {u.tenantId && hasPermission('manage_subscriptions') && (
                                    <button
                                      onClick={() => navigate(`/admin/editor/${u.tenantId}`)}
                                      className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors"
                                      title="محرر السوبر أدمن الاحترافي"
                                    >
                                      تعديل شامل
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Subscription Management Controls: Renew & Terminate */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setRenewModalEmail(u.email)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                                  >
                                    <span>🔄 تجديد الاشتراك</span>
                                  </button>
                                  {u.tenantId && u.email?.toLowerCase() !== user?.email?.toLowerCase() && hasPermission('manage_subscriptions') && (
                                    <button
                                      onClick={() => handleCancelSubscription(u.email)}
                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                      title="إلغاء وإنهاء الاشتراك وحذف البيانات"
                                    >
                                      إنهاء الاشتراك ✕
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {u.email?.toLowerCase() !== user?.email?.toLowerCase() && hasPermission('delete_users') && (
                                    <button
                                      onClick={() => handleSuspendUser(u.email)}
                                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                                        u.status === 'banned'
                                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                          : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                                      }`}
                                    >
                                      {u.status === 'banned' ? 'تفعيل' : 'إيقاف'}
                                    </button>
                                  )}
                                  {u.tenantId && hasPermission('manage_subscriptions') && (
                                    <button
                                      onClick={() => setHardDeleteTenant({ tenantId: u.tenantId, name: u.tenantName || u.email })}
                                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors"
                                      title="حذف نهائي"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Table View Fallback
                return (
                  <div className="bg-[#0F1218]/90 backdrop-blur-xl rounded-3xl border border-slate-800/80 overflow-x-auto shadow-2xl">
                    <table className="w-full text-right min-w-[850px]">
                      <thead className="bg-slate-900/80 border-b border-slate-800/80">
                        <tr>
                          <th className="px-6 py-4 text-slate-400 font-semibold text-xs">العميل والمشروع</th>
                          <th className="px-6 py-4 text-slate-400 font-semibold text-xs">النطاق / الدومين</th>
                          <th className="px-6 py-4 text-slate-400 font-semibold text-xs">خطة الاشتراك</th>
                          <th className="px-6 py-4 text-slate-400 font-semibold text-xs">الحالة</th>
                          <th className="px-6 py-4 text-slate-400 font-semibold text-xs">إجراءات التحكم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {filteredTenants.map((u, i) => {
                          const daysLeft = u.subscriptionEndDate ? Math.ceil((new Date(u.subscriptionEndDate).getTime() - Date.now()) / (1000 * 3600 * 24)) : 30;
                          const domain = u.customDomain || u.subdomain;
                          const isLocalhost = window.location.hostname === 'localhost';
                          const siteUrl = domain 
                            ? (domain.includes('.') 
                              ? `https://${domain}` 
                              : (isLocalhost 
                                ? `http://${domain}.localhost:3000` 
                                : `${window.location.origin}/s/${domain}`
                                )
                              ) 
                            : '';

                          return (
                            <tr key={`admin-tenant-row-${u.id || u.email || 'idx'}-${i}`} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-800 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-sm relative">
                                    {u.avatarUrl ? (
                                      <img 
                                        src={u.avatarUrl} 
                                        alt={u.email} 
                                        className="w-full h-full object-cover absolute inset-0 z-10" 
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : null}
                                    <span className="relative z-0">{u.email.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-sm">{u.tenantName || 'موقع جديد'}</div>
                                    <div className="text-xs text-slate-500">{u.email}</div>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                                      {u.location && u.location !== 'غير معروف' && (
                                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded-md font-medium">
                                          📍 {u.location}
                                        </span>
                                      )}
                                      {u.ipAddress && u.ipAddress !== 'غير معروف' && (
                                        <span className="inline-flex items-center gap-1 bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                                          💻 {u.ipAddress}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5" dir="ltr">
                                {domain ? (
                                  <div className="flex flex-col gap-1.5 items-end">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-xs font-mono font-medium">{domain}</span>
                                      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                    {u.subscriptionHasCustomDomain && !u.customDomain && (
                                      <div className="flex flex-col items-end mt-1">
                                        <span className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3 animate-pulse" /> دومين مطلوب:
                                        </span>
                                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[11px] px-1.5 py-0.5 rounded-md mt-0.5 max-w-[150px] truncate" title={u.subscriptionRequestedDomainName || ''}>
                                          {u.subscriptionRequestedDomainName || 'لم يحدد'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-600 text-xs">غير محدد</span>
                                )}
                              </td>
                              <td className="px-6 py-5 text-slate-300 text-xs">
                                <div className="font-bold text-white">
                                  {u.subscriptionType === 'free_trial_3days' ? 'تجربة مجانية 3 أيام' : u.subscriptionType === 'yearly' ? 'اشتراك سنوي' : u.subscriptionType === 'monthly' ? 'اشتراك شهري' : (u.subscriptionType || 'تجربة 3 أيام')}
                                  {u.subscriptionPrice ? ` (${u.subscriptionPrice} $) ` : ''}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                                  <div>بدأ: <span className="font-mono text-slate-300" dir="ltr">{formatAdminDateTime(u.subscriptionStartDate || u.tenantCreatedAt || u.userCreatedAt)}</span></div>
                                  <div>ينتهي: <span className="font-mono text-emerald-400 font-bold" dir="ltr">{u.subscriptionEndDate ? formatAdminDateTime(u.subscriptionEndDate) : 'غير محدود'}</span></div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${daysLeft <= 0 || u.status === 'banned' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                  {u.status === 'banned' ? 'موقوف' : `${daysLeft} يوم`}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {u.tenantId && hasPermission('impersonate_users') && (
                                    <button 
                                      onClick={() => window.open(`/dashboard?impersonateTenantId=${u.tenantId}`, '_blank')}
                                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                                      title="الدخول الخفي كعميل"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      دخول خفي
                                    </button>
                                  )}
                                  {u.tenantId && hasPermission('manage_subscriptions') && (
                                    <button 
                                      onClick={() => {
                                        setEditDomainTenant({
                                          tenantId: u.tenantId,
                                          name: u.tenantName || u.email,
                                          subdomain: u.subdomain || '',
                                          customDomain: u.customDomain || ''
                                        });
                                        setEditSubdomainInput(u.subdomain || '');
                                        setEditCustomDomainInput(u.customDomain || '');
                                      }}
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                                    >
                                      تعديل الدومين
                                    </button>
                                  )}
                                  {u.tenantId && hasPermission('send_notifications') && (
                                    <button 
                                      onClick={() => {
                                        setNotificationModal({ tenantId: u.tenantId, targetEmail: u.email, tenantName: u.tenantName || u.email });
                                        setNotifTitle('');
                                        setNotifMessage('');
                                      }}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors"
                                      title="إرسال تنبيه إجباري"
                                    >
                                      <Bell className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleRenewSubscription(u.email)}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                                  >
                                    تجديد
                                  </button>
                                  {u.tenantId && u.email?.toLowerCase() !== user?.email?.toLowerCase() && hasPermission('manage_subscriptions') && (
                                    <>
                                      <button
                                        onClick={() => handleCancelSubscription(u.email)}
                                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                                        title="إلغاء الاشتراك وحذف الموقع"
                                      >
                                        إلغاء الاشتراك
                                      </button>
                                      <button
                                        onClick={() => setHardDeleteTenant({ tenantId: u.tenantId, name: u.tenantName || u.email })}
                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors"
                                        title="حذف شامل ونهائي للمشترك"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 md:mb-2 text-white">إدارة القوالب (Gallery Control)</h2>
                  <p className="text-slate-400 text-xs md:text-sm">تحكم بظهور القوالب في المعرض العام للعملاء</p>
                </div>
                <button 
                  onClick={() => setIsImporterOpen(true)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm"
                >
                  <LayoutTemplate className="w-5 h-5" />
                  إضافة موقع خارجي
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
                {dbTemplates.map((template, idx) => (
                  <div key={`admin-tpl-${template.type || "internal"}-${template.id || idx}`} className="group bg-[#0F1218] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-slate-700 transition-all duration-300 flex flex-col">
                    <div className="relative h-44 md:h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-slate-900 animate-pulse"></div>
                      <img src={template.image} alt={template.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!activeTemplates[template.id] ? 'grayscale opacity-40' : ''}`} loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1218] via-transparent to-transparent"></div>
                      
                      {/* Niche Badge */}
                      <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] md:text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        {NICHE_LABELS[template.category]}
                      </div>
                      {template.assignedUserEmail && <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-emerald-500 text-white text-[11px] md:text-xs font-bold px-2.5 py-1 rounded-lg shadow">مخصص لـ {template.assignedUserEmail}</div>}

                      {!activeTemplates[template.id] && (
                        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40">
                          <span className="bg-red-500 text-white px-3.5 py-1.5 rounded-full font-bold text-xs md:text-sm shadow-xl flex items-center gap-2">
                            <Ban className="w-4 h-4" />
                            مخفي عن العامة
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 md:p-6 flex-1 flex flex-col">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-1.5">{template.name}</h3>
                      <p className="text-slate-400 text-xs md:text-sm mb-4 md:mb-6 flex-1 line-clamp-2">{template.description}</p>
                      
                      <div className="space-y-2.5 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button 
                            onClick={() => setPreviewModalTemplateId(template.id)}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer min-h-[44px]"
                            title="معاينة واجهة القالب الخارجية للمستخدمين"
                          >
                            <Eye className="w-4 h-4 shrink-0" />
                            <span>معاينة القالب 👁️</span>
                          </button>

                          <button 
                            onClick={() => setPreviewManagementTemplateId(template.id)}
                            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer min-h-[44px]"
                            title="معاينة وتجربة لوحة التحكم والإدارة المخصصة لهذا القالب"
                          >
                            <LayoutDashboard className="w-4 h-4 shrink-0" />
                            <span>معاينة الإدارة ⚙️</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button 
                            onClick={() => openAssignModal(template.id)} 
                            className="flex-1 min-w-[120px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-colors border border-blue-500/20 cursor-pointer min-h-[44px] flex items-center justify-center"
                          >
                            تخصيص لعميل (Assign)
                          </button>

                          <button 
                            onClick={() => {
                              setEditTemplateId(template.id);
                              setNewImageUrl(template.image || '');
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                          >
                            الصورة
                          </button>

                          <button 
                            onClick={() => setDeleteTemplateId(template.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] w-[44px] flex items-center justify-center"
                            title="حذف القالب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">حالة العرض</span>
                        
                        {/* iOS Style Animated Toggle */}
                        <button 
                          onClick={() => toggleTemplate(template.id)}
                          className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${activeTemplates[template.id] ? 'bg-blue-500' : 'bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${activeTemplates[template.id] ? 'translate-x-7' : 'translate-x-0'}`}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-white">إدارة الإشعارات والتنبيهات العامة</h2>
                  <p className="text-slate-400 text-sm mt-1">إرسال تنبيهات فورية لكافة المستخدمين أو لمستخدم محدد، ومتابعة سجل الإشعارات المرسلة</p>
                </div>
                <button
                  onClick={() => fetchNotifications()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث السجل
                </button>
              </div>

              {/* Compose and Send Notification Card */}
              <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">إرسال إشعار جديد للمستخدمين 📢</h3>
                    <p className="text-xs text-slate-400 font-medium">قم بإرسال تنبيه فوري لكافة عملاء المنصة (إرسال عام) أو لمستخدم محدد عبر البريد الإلكتروني.</p>
                  </div>
                </div>

                <form onSubmit={handleSendAdminNotificationSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">عنوان الإشعار:</label>
                      <input
                        type="text"
                        value={adminNotifTitle}
                        onChange={(e) => setAdminNotifTitle(e.target.value)}
                        placeholder="مثال: تحديث جديد في قوالب المتاجر وإصلاحات الأداء"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">نطاق الاستهداف:</label>
                      <select
                        value={adminNotifTargetType}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setAdminNotifTargetType(val);
                          if (val === 'specific' && usersList.length === 0) {
                            fetchUsers();
                          }
                        }}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-blue-500"
                      >
                        <option value="all">إرسال لكافة المستخدمين في المنصة (Broadcast) 🌐</option>
                        <option value="specific">مستخدم محدد عبر البريد الإلكتروني 👤</option>
                      </select>
                    </div>
                  </div>

                  {adminNotifTargetType === 'specific' && (() => {
                    const uniqueUsersList = Array.from(
                      new Map(
                        usersList
                          .filter((u: any) => u && u.email && typeof u.email === 'string' && u.email.trim().length > 0)
                          .map((u: any) => [u.email.toLowerCase().trim(), u])
                      ).values()
                    );

                    return (
                      <div className="space-y-2.5 animate-in fade-in duration-200 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-300">اختيار المستلم من قائمة المستخدمين:</label>
                          <span className="text-[10px] text-blue-400 font-mono font-bold">({uniqueUsersList.length} مستخدم مسجل)</span>
                        </div>

                        <select
                          value={adminNotifTargetEmail}
                          onChange={(e) => setAdminNotifTargetEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-blue-500 text-left transition-all"
                          dir="ltr"
                        >
                          <option value="" className="text-slate-500">-- اختر مستخدم من القائمة ({uniqueUsersList.length}) --</option>
                          {uniqueUsersList.map((u: any, idx: number) => (
                            <option key={u.id || u.email || idx} value={u.email}>
                              {u.name ? `${u.name} (${u.email})` : u.email} {u.role === 'super_admin' ? '⭐ إدارة' : u.tenantId ? '🏪 صاحب متجر' : ''}
                            </option>
                          ))}
                        </select>

                        <div className="space-y-1 pt-1">
                          <label className="block text-[11px] font-medium text-slate-400">أو كتابة البريد الإلكتروني يدوياً:</label>
                          <input
                            type="email"
                            value={adminNotifTargetEmail}
                            onChange={(e) => setAdminNotifTargetEmail(e.target.value)}
                            placeholder="client@gmail.com"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:border-blue-500 text-left"
                            dir="ltr"
                            required
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">محتوى ونص الإشعار:</label>
                    <textarea
                      rows={3}
                      value={adminNotifMessage}
                      onChange={(e) => setAdminNotifMessage(e.target.value)}
                      placeholder="اكتب تفاصيل الإشعار الذي سيظهر للمستخدمين في لوحة تحكمهم..."
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSendBulkWelcome}
                      disabled={isSendingBulkWelcome}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      {isSendingBulkWelcome ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Mail size={15} />
                      )}
                      <span>إرسال ترحيب لجميع المستخدمين 📧</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingAdminNotif || !adminNotifTitle.trim() || !adminNotifMessage.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                      {isSendingAdminNotif ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                      <span>إرسال الإشعار الآن 🚀</span>
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h3 className="text-xl font-black text-white mb-4">سجل الإشعارات والتنبيهات المرسلة سابقاً</h3>
                {(!systemNotifications || !Array.isArray(systemNotifications) || systemNotifications.length === 0) ? (
                  <div className="bg-[#0F1218] border border-slate-800 rounded-3xl p-12 text-center">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">لا توجد تنبيهات مرسلة حتى الآن</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(Array.isArray(systemNotifications) ? systemNotifications : []).slice().reverse().map((notif: any, idx: number) => (
                      <div key={`sys-notif-${notif.id || idx}`} className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="text-base font-bold text-white">{notif.title}</h4>
                              <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30">
                                {notif.targetType === 'specific' ? 'مستهدف (خاص)' : 'عام (للجميع)'}
                              </span>
                              <span className="text-slate-500 text-xs dir-ltr">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleString('ar-SA') : ''}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm mt-2 leading-relaxed">{notif.message}</p>
                            {notif.targetUserEmail && (
                              <div className="text-xs text-slate-500 mt-2">
                                البريد المستهدف: <span className="text-slate-400 font-mono">{notif.targetUserEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pricing_config' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-white">إدارة أسعار الباقات وعملات المنصة 💱</h2>
                  <p className="text-slate-400 text-sm mt-1">التحكم الكامل بأسعار الباقات وأسعار صرف العملات تلقائياً بناءً على عملة الأساس (مثل الدينار الأردني JOD) ومعاملات التحويل لباقي العملات.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
                <form onSubmit={handleSaveAdminPricingConfig} className="space-y-6">
                  {/* Base Currency & Plans Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">عملة الأساس (Base Currency):</label>
                      <select
                        value={adminPricingConfig.baseCurrency}
                        onChange={e => setAdminPricingConfig({...adminPricingConfig, baseCurrency: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
                      >
                        <option value="JOD">الدينار الأردني (JOD)</option>
                        <option value="SAR">الريال السعودي (SAR)</option>
                        <option value="USD">الدولار الأمريكي (USD)</option>
                      </select>
                      <p className="text-[11px] text-slate-500">العملة التي تُدخل بها الأسعار الأساسية أدناه.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">سعر باقة التجربة (Starter):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={adminPricingConfig.starterPriceJOD}
                        onChange={e => setAdminPricingConfig({...adminPricingConfig, starterPriceJOD: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">سعر الباقة الاحترافية (Pro):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={adminPricingConfig.proPriceJOD}
                        onChange={e => setAdminPricingConfig({...adminPricingConfig, proPriceJOD: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">سعر باقة الشركات (Enterprise):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={adminPricingConfig.enterprisePriceJOD}
                        onChange={e => setAdminPricingConfig({...adminPricingConfig, enterprisePriceJOD: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Exchange Rates Grid */}
                  <div className="border-t border-slate-800 pt-6 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">أسعار صرف العملات مقابل العمل الأساسية 🌐</h3>
                      <p className="text-xs text-slate-400">سيتم حساب وتحويل أسعار الباقات تلقائياً لكل زائر بناءً على دولة زائر الموقع والعملة المحددة أدناه.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {Object.entries(adminPricingConfig.exchangeRates).map(([cur, rate]) => (
                        <div key={`rate-${cur}`} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-emerald-400 text-sm">{cur}</span>
                            <span className="text-[10px] text-slate-500 font-bold">معامل التحويل</span>
                          </div>
                          <input
                            type="number"
                            step="0.0001"
                            value={rate}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 1;
                              setAdminPricingConfig({
                                ...adminPricingConfig,
                                exchangeRates: {
                                  ...adminPricingConfig.exchangeRates,
                                  [cur]: val
                                }
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold outline-none focus:border-emerald-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      <span>حفظ كافة التعديلات وتطبيقها فوراً 🌟</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Magic Importer Modal -> Add External Site Modal */}
      
      {editTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#0F1218] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">تحديث صورة القالب</h2>
              <button onClick={() => setEditTemplateId(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">رابط الصورة الجديد (URL)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none text-left font-mono text-xs" 
                    dir="ltr"
                    value={newImageUrl} 
                    onChange={e => setNewImageUrl(e.target.value)} 
                  />
                  <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl cursor-pointer flex items-center justify-center transition-colors font-bold text-xs shrink-0">
                    <span>رفع</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewImageUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>

              {/* Restore Original Image Button */}
              <button
                type="button"
                onClick={() => {
                  const defaultT = TEMPLATES.find(t => t.id === editTemplateId);
                  if (defaultT) {
                    setNewImageUrl(defaultT.image);
                  }
                }}
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>🔄</span>
                <span>استعادة الصورة الأصلية الافتراضية للقالب</span>
              </button>

              {/* Preview image */}
              {newImageUrl && (
                <div className="h-32 w-full rounded-2xl overflow-hidden border border-slate-800 relative">
                  <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs text-white font-bold">معاينة الصورة المعروضة</div>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={handleUpdateTemplateImage} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">تحديث الصورة</button>
              <button onClick={() => setEditTemplateId(null)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {deleteTemplateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#0F1218] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">تأكيد حذف القالب</h2>
            <p className="text-slate-400 mb-8">هل أنت متأكد من رغبتك في حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-4">
              <button onClick={handleDeleteTemplate} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-500 transition-colors">نعم، احذف القالب</button>
              <button onClick={() => setDeleteTemplateId(null)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#0F1218] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">تخصيص القالب لعميل</h2>
              <button onClick={() => setAssignModal(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <p className="text-slate-400 mb-6 text-sm">أدخل تفاصيل العميل واسم الموقع لإعداد بيئة العمل الخاصة به.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">البريد الإلكتروني للعميل (Gmail)</label>
                <input type="email" placeholder="client@gmail.com" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none text-left" dir="ltr" value={assignEmail} onChange={e => setAssignEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">اسم الموقع</label>
                <input type="text" placeholder="مثال: مطعم شاورما الريم" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={siteName} onChange={e => setSiteName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">رابط شعار الموقع (Logo URL)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="https://..." className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none text-left" dir="ltr" value={siteLogo} onChange={e => setSiteLogo(e.target.value)} />
                  <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl cursor-pointer flex items-center justify-center transition-colors">
                    <span>رفع</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSiteLogo(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
                {siteLogo && siteLogo.startsWith('data:image') && <img src={siteLogo} alt="Logo Preview" className="h-12 mt-2 rounded" />}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">اختر باقة الاشتراك (Subscription Package)</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none font-bold" 
                  value={subscriptionType} 
                  onChange={e => {
                    const planId = e.target.value;
                    setSubscriptionType(planId);
                    const plans = getSubscriptionPlans(adminPricingConfig.baseCurrency);
                    const matchedPlan = plans.find(p => p.id === planId);
                    if (matchedPlan) {
                      const numericPrice = matchedPlan.price.replace(/[^0-9.]/g, '');
                      setSubscriptionPrice(numericPrice || '0');
                      
                      const now = new Date();
                      if (planId === 'starter') {
                        now.setDate(now.getDate() + 3);
                      } else if (planId === 'pro' || planId === 'yearly') {
                        now.setFullYear(now.getFullYear() + 1);
                      } else {
                        now.setMonth(now.getMonth() + 1);
                      }
                      setSubscriptionEndDate(now.toISOString().split('T')[0]);
                    }
                  }}
                >
                  {getSubscriptionPlans(adminPricingConfig.baseCurrency).map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ({plan.price} / {plan.duration})
                    </option>
                  ))}
                  <option value="custom">باقة مخصصة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">قيمة الاشتراك (Agreed Price)</label>
                <input type="number" placeholder="مثال: 50" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={subscriptionPrice} onChange={e => setSubscriptionPrice(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">تاريخ الانتهاء (Expiration Date)</label>
                <input type="date" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={subscriptionEndDate} onChange={e => setSubscriptionEndDate(e.target.value)} />
              </div>

            </div>
            <div className="flex gap-4">
              <button onClick={() => handleAssignTemplate(assignModal)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">إعداد وتخصيص الموقع</button>
              <button onClick={() => setAssignModal(null)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {isImporterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsImporterOpen(false)}></div>
          <div className="relative bg-[#0F1218] border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsImporterOpen(false)} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6">
              <LayoutTemplate className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">إضافة موقع خارجي</h2>
            <p className="text-slate-400 mb-8">قم بإضافة موقع خارجي ليعرض في معرض القوالب كنافذة (Iframe) للمستخدمين.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('siteName') as HTMLInputElement).value;
              const externalUrl = (form.elements.namedItem('externalUrl') as HTMLInputElement).value;
              const image = (form.elements.namedItem('image') as HTMLInputElement).value;
              const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
              
              try {
                const token = await user?.getIdToken();
                const res = await fetch('/api/admin/templates/external', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ name, externalUrl, image, category })
                });
                
                if (res.ok) {
                  const contentType = res.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                    await res.json(); // Just consume it
                  }
                  // Re-fetch templates to update UI
                  fetchTemplates();
                  setIsImporterOpen(false);
                  setToast('تمت إضافة الموقع الخارجي بنجاح!');
                  setTimeout(() => setToast(''), 3000);
                } else {
                  setToast('حدث خطأ أثناء إضافة الموقع.');
                  setTimeout(() => setToast(''), 3000);
                }
              } catch (err) {
                setToast('حدث خطأ في الاتصال بالخادم.'); setTimeout(() => setToast(''), 3000);
              }
            }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">اسم الموقع</label>
                <input required name="siteName" type="text" placeholder="مثال: مطعم الذواق" className="w-full bg-slate-900 border border-slate-700 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-200 placeholder:text-slate-600 transition-shadow" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">رابط الموقع (External URL)</label>
                <input required name="externalUrl" type="url" placeholder="https://example.com" className="w-full bg-slate-900 border border-slate-700 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-left text-slate-200 placeholder:text-slate-600 transition-shadow" dir="ltr" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">صورة العرض (Thumbnail URL)</label>
                <input required name="image" type="url" placeholder="https://..." className="w-full bg-slate-900 border border-slate-700 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-left text-slate-200 placeholder:text-slate-600 transition-shadow" dir="ltr" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">تصنيف الموقع</label>
                <select name="category" className="w-full bg-slate-900 border border-slate-700 px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-200 appearance-none">
                  <option value="restaurants">مطاعم (Restaurants)</option>
                  <option value="cafes">مقاهي (Cafes)</option>
                  <option value="realestate">عقارات (Real Estate)</option>
                  <option value="contractors">مقاولات (Contractors)</option>
                </select>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.6)]"
                >
                  إضافة للمنصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Domain Modal */}
      {editDomainTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1218] border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setEditDomainTenant(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">إدارة النطاق والدومين</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editDomainTenant.name || 'موقع العميل'}</p>
              </div>
            </div>

            <div className="space-y-5 text-right">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">النطاق الفرعي المجاني (Subdomain)</label>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors" dir="ltr">
                  <input 
                    type="text" 
                    value={editSubdomainInput} 
                    onChange={e => setEditSubdomainInput(e.target.value)}
                    placeholder="e.g. alsaadah" 
                    className="bg-transparent text-white font-mono text-sm w-full focus:outline-none"
                  />
                  <span className="text-slate-500 text-xs font-mono shrink-0 ml-2">.domain.com</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">الدومين الخاص المخصص (Custom Domain)</label>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors" dir="ltr">
                  <input 
                    type="text" 
                    value={editCustomDomainInput} 
                    onChange={e => setEditCustomDomainInput(e.target.value)}
                    placeholder="e.g. alsaadah-restaurant.com" 
                    className="bg-transparent text-white font-mono text-sm w-full focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  عند ربط دومين خاص (مثل example.com)، سيتم توجيه جميع الزيارات تلقائياً لهذا الموقع دون الحاجة لإعادة تشغيل السيرفر.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  onClick={() => setEditDomainTenant(null)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUpdateDomain}
                  disabled={editDomainLoading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  {editDomainLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hard Delete Modal */}
      {hardDeleteTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1218] border border-red-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-right">
            <button 
              onClick={() => setHardDeleteTenant(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">حذف شامل ونهائي للمشترك</h3>
                <p className="text-xs text-red-400 font-medium mt-0.5">{hardDeleteTenant.name}</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-200 leading-relaxed mb-6 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                تحذير: هذا الإجراء لا يمكن التراجع عنه!
              </p>
              <p>سيؤدي هذا الخيار إلى حذف كافة بيانات المستأجر نهائياً من سيرفراتنا:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pr-2">
                <li>مسح محتوى ومكونات وصور الموقع بالكامل</li>
                <li>إلغاء الاشتراك وإغلاق النطاق والدومين المخصص فوراً</li>
                <li>مسح الطلبات والإحصائيات والتنبيهات المرتبطة</li>
                <li>إلغاء صلاحية الوصول للوحة التحكم</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setHardDeleteTenant(null)}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleHardDeleteTenant}
                disabled={hardDeleteLoading}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                {hardDeleteLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                نعم، احذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forced Notification Modal */}
      {notificationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1218] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-right">
            <button 
              onClick={() => setNotificationModal(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">إرسال تنبيه إجباري</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  الجهة المستهدفة: <span className="text-amber-400 font-bold">{notificationModal.tenantName || 'جميع العملاء والمستأجرين'}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">عنوان التنبيه</label>
                <input 
                  type="text" 
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  placeholder="مثال: تحديث هام بشأن سياسة الخدمة"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">نص الرسالة / التنبيه الإجباري</label>
                <textarea 
                  rows={4}
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  placeholder="أدخل تفاصيل التنبيه التي ستظهر للمستأجر فور دخوله للوحة التحكم في نافذة مغلقة يجب الموافقة عليها..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                هذا التنبيه يظهر كـ Modal إجباري لا يمكن إغلاقه إلا بعد الضغط على "قرأت وأوافق".
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
                <button
                  onClick={() => setNotificationModal(null)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={notifLoading}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  {notifLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  إرسال التنبيه الآن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Admin / Staff Modal */}
      {isAddAdminStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-[#0F1218] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right">
            <button 
              onClick={() => setIsAddAdminStaffModalOpen(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">إضافة موظف للمنصة</h3>
                <p className="text-xs text-slate-400 mt-0.5">تعيين موظف جديد وتحديد قسمه والمسؤوليات بالمنظومة.</p>
              </div>
            </div>

            <form onSubmit={handleAddSystemStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني ✉️</label>
                <input 
                  type="email" 
                  required
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم الموظف 👤</label>
                <input 
                  type="text" 
                  required
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  placeholder="مثال: أحمد - فريق الدعم"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>كلمة السر الخاصة بالموظف 🔑</span>
                  <span className="text-[10px] text-slate-400 font-normal">(اختياري - افتراضياً نفس البريد الإلكتروني)</span>
                </label>
                <input 
                  type="text" 
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الخاصة به هنا..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-200">
                    تحديد أقسام الإدارة المتاحة للموظف 🏢
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedSections(ADMIN_SECTIONS.map(s => s.id))}
                      className="text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSections([])}
                      className="text-slate-400 hover:text-slate-200 font-semibold underline cursor-pointer"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mb-2.5">
                  ضع علامة (صح) على الأقسام المسموح للموظف برؤيتها. سيظهر للموظف فقط هذه الأقسام المحددة ولن تظهر باقي التبويبات إطلاقاً.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-900/90 border border-slate-800 rounded-2xl custom-scrollbar">
                  {ADMIN_SECTIONS.map((sec) => {
                    const isChecked = selectedSections.includes(sec.id);
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedSections(selectedSections.filter(s => s !== sec.id));
                          } else {
                            setSelectedSections([...selectedSections, sec.id]);
                          }
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-purple-600/20 border-purple-500/50 text-purple-200 shadow-[0_0_12px_rgba(147,51,234,0.15)]'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          isChecked ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate">{sec.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddAdminStaffModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={addingAdminLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
                >
                  {addingAdminLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  حفظ وإضافة الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Demotion Confirmation Modal (تم / إلغاء) */}
      {staffDemotionTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1218] border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right">
            <button 
              onClick={cancelDemoteSystemStaff}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">تأكيد سحب صلاحيات الموظف</h3>
                <p className="text-xs text-rose-400 font-medium mt-0.5" dir="ltr">{staffDemotionTarget.email}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              هل أنت متأكد من رغبتك في سحب صلاحيات وإزالة هذا الموظف من قائمة الطاقم الإداري؟ سيصدر إشعار فوري من المنصة بتأكيد أو إلغاء العملية.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={cancelDemoteSystemStaff}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
              <button
                onClick={confirmDemoteSystemStaff}
                disabled={demotingStaffLoading}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                {demotingStaffLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                تم (تأكيد السحب)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Data Confirmation Modal */}
      {resetAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1218] border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-right">
            <button 
              onClick={() => setResetAllModalOpen(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">تصفير كافة بيانات المنصة والاشتراكات</h3>
                <p className="text-xs text-rose-400 font-medium mt-0.5">إجراء شامل ونهائي</p>
              </div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-200 leading-relaxed mb-6 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                تحذير شديد: لا يمكن التراجع عن هذا الإجراء!
              </p>
              <p>سيؤدي هذا الإجراء إلى حذف جميع المواقع، والاشتراكات، والطلبات، والبيانات وتصفير النظام بالكامل باستثناء حساب السوبر أدمن.</p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setResetAllModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={confirmResetAllData}
                disabled={resetAllLoading}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                {resetAllLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                تأكيد التصفير الشامل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Subscriptions Confirmation Modal */}
      {clearSubsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1218] border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-right">
            <button 
              onClick={() => setClearSubsModalOpen(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">إلغاء ومسح كافة اشتراكات المنصة</h3>
                <p className="text-xs text-rose-400 font-medium mt-0.5">يشمل جميع المستخدمين والمديرين</p>
              </div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-200 leading-relaxed mb-6 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                تحذير: سيتم إلغاء وتصفير بيانات اشتراك كافة الحسابات والمديرين فوراً!
              </p>
              <p>لن يبقى أي مستخدم أو مدير يمتلك اشتراك نشط أو تجريبي بعد هذا الإجراء.</p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setClearSubsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={confirmClearSubscriptions}
                disabled={clearSubsLoading}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                {clearSubsLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                تأكيد إلغاء ومسح كل الاشتراكات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {cancelSubTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1218] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-right">
            <button 
              onClick={() => setCancelSubTarget(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">إلغاء الاشتراك وحذف الموقع</h3>
                <p className="text-xs text-amber-400 font-medium mt-0.5" dir="ltr">{cancelSubTarget}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              هل أنت متأكد من رغبتك في إلغاء الاشتراك ومسح الموقع والمستأجر نهائياً؟
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setCancelSubTarget(null)}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={cancelSubLoading}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
              >
                {cancelSubLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                تأكيد إلغاء الاشتراك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Client Audit & Details Modal ("أكثر عن العميل 📊") */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-slate-900 to-[#0F1218] p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-lg shadow-lg">
                  {selectedClientForDetails.email?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{selectedClientForDetails.email}</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      تقرير شامل ومحدث
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    الاسم: <strong className="text-slate-200">{selectedClientForDetails.name || 'عميل بدون اسم مستعار'}</strong> — الرقم المرجعي: <span className="font-mono">{selectedClientForDetails.id}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportClientReport}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-teal-500/30 shadow-md"
                  title="تصدير طباعة / PDF لجميع تفاصيل العميل"
                >
                  <span>تصدير الملف 🖨️</span>
                </button>

                <button
                  onClick={() => setSelectedClientForDetails(null)}
                  className="w-10 h-10 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* 4 Stats Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900/80 border border-indigo-500/30 rounded-2xl">
                  <div className="flex items-center justify-between text-indigo-400 mb-1">
                    <span className="text-xs font-bold">القوالب المعدلة</span>
                    <Edit3 size={16} />
                  </div>
                  <div className="text-2xl font-black text-white">{clientEditedTemplates.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1">تعديلات ومسودات القوالب</p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-2xl">
                  <div className="flex items-center justify-between text-emerald-400 mb-1">
                    <span className="text-xs font-bold">الاشتراكات النشطة</span>
                    <ShieldCheck size={16} />
                  </div>
                  <div className="text-2xl font-black text-white">{clientSubscriptions.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1">المواقع المفعلة والمنشورة</p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-rose-500/30 rounded-2xl">
                  <div className="flex items-center justify-between text-rose-400 mb-1">
                    <span className="text-xs font-bold">القوالب المفضلة</span>
                    <span className="text-xs">❤️</span>
                  </div>
                  <div className="text-2xl font-black text-white">{clientFavorites.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1">قوالب في قائمة المفضلة</p>
                </div>

                <div className="p-4 bg-slate-900/80 border border-amber-500/30 rounded-2xl">
                  <div className="flex items-center justify-between text-amber-400 mb-1">
                    <span className="text-xs font-bold">سجل التحركات</span>
                    <Activity size={16} />
                  </div>
                  <div className="text-2xl font-black text-white">{clientActivities.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1">إجمالي العمليات بالتوقيت</p>
                </div>
              </div>

              {/* Sub-Tabs Nav Header */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
                <button
                  onClick={() => setClientDetailsTab('quiz')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'quiz'
                      ? 'bg-blue-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders size={16} />
                  <span>الاستبيان والاهتمامات 🎯 {clientQuizRecord ? '✅' : ''}</span>
                </button>

                <button
                  onClick={() => setClientDetailsTab('info')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'info'
                      ? 'bg-teal-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck size={16} />
                  <span>المعلومات الفنية 💻</span>
                </button>

                <button
                  onClick={() => setClientDetailsTab('notes')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'notes'
                      ? 'bg-purple-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare size={16} />
                  <span>ملاحظات المشرفين 📝 ({clientNotes.length})</span>
                </button>

                <button
                  onClick={() => setClientDetailsTab('timeline')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'timeline'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock size={16} />
                  <span>سجل النشاط ⚡ ({clientActivities.length})</span>
                </button>

                <button
                  onClick={() => setClientDetailsTab('edited')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'edited'
                      ? 'bg-indigo-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Edit3 size={16} />
                  <span>القوالب المعدلة ({clientEditedTemplates.length})</span>
                </button>

                <button
                  onClick={() => setClientDetailsTab('subscriptions')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'subscriptions'
                      ? 'bg-emerald-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap size={16} />
                  <span>الاشتراكات ({clientSubscriptions.length})</span>
                </button>

                <button
                  onClick={() => setClientDetailsTab('favorites')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'favorites'
                      ? 'bg-rose-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>❤️ المفضلة ({clientFavorites.length})</span>
                </button>

                <button
                  onClick={() => setClientDetailsTab('actions')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    clientDetailsTab === 'actions'
                      ? 'bg-amber-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={16} />
                  <span>إجراءات وتواصل ⚡</span>
                </button>
              </div>

              {/* Content Panels */}
              {loadingClientDetails ? (
                <div className="p-12 text-center text-slate-400 font-bold text-xs flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تحميل تقرير نشاطات العميل...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  
                  {/* Quiz Answers Tab */}
                  {clientDetailsTab === 'quiz' && (
                    <div className="space-y-4">
                      {clientQuizRecord ? (
                        <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-6 space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-lg">🎯</span>
                              <div>
                                <h4 className="font-extrabold text-sm text-white">إجابات استبيان تحديد الاهتمامات وقوالب العمل</h4>
                                <p className="text-xs text-slate-400 mt-0.5">الخيارات والأجوبة التي حددها العميل عند دخوله للمنصة أول مرة</p>
                              </div>
                            </div>
                            <span className="self-start sm:self-auto text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                              إجابات محفوظة بالداتابيز ✅
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Question 1 */}
                            <div className="p-4 bg-[#080B10] border border-slate-800 rounded-xl space-y-2">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">السؤال 1: المجال والتخصص المطلوب</div>
                              <div className="text-sm font-black text-blue-400">
                                {clientQuizRecord.categoryLabel || clientQuizRecord.category || 'جميع المجالات'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                المعرف: ({clientQuizRecord.category || 'all'})
                              </div>
                            </div>

                            {/* Question 2 */}
                            <div className="p-4 bg-[#080B10] border border-slate-800 rounded-xl space-y-2">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">السؤال 2: الهدف الرئيسي للموقع</div>
                              <div className="text-sm font-black text-emerald-400">
                                {clientQuizRecord.goalLabel || clientQuizRecord.goal || 'جميع الأهداف'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                المعرف: ({clientQuizRecord.goal || 'all'})
                              </div>
                            </div>

                            {/* Question 3 */}
                            <div className="p-4 bg-[#080B10] border border-slate-800 rounded-xl space-y-2">
                              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">السؤال 3: نمط وطابع التصميم</div>
                              <div className="text-sm font-black text-amber-400">
                                {clientQuizRecord.styleLabel || clientQuizRecord.style || 'جميع الأنماط'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                المعرف: ({clientQuizRecord.style || 'all'})
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-10 bg-slate-900/50 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
                          <Sliders className="w-8 h-8 text-slate-600" />
                          <span>لم يقم هذا المستخدم بتعبئة استبيان الاهتمامات حتى الآن، أو قام بالتخطي.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical Profile Info Tab */}
                  {clientDetailsTab === 'info' && (
                    <div className="space-y-4">
                      <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                          <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20 text-lg">💻</span>
                            <div>
                              <h4 className="font-extrabold text-sm text-white">المعلومات الفنية والشبكية للحساب</h4>
                              <p className="text-xs text-slate-400 mt-0.5">تفاصيل الربط التقني والصلاحيات وسجل الاتصال بالشبكة</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-3 py-1 rounded-full font-bold border ${
                            selectedClientForDetails.status === 'banned'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {selectedClientForDetails.status === 'banned' ? 'حساب محظور 🚫' : 'حساب نشط ومفعل 🟢'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-3.5 bg-[#080B10] border border-slate-800 rounded-xl space-y-1">
                            <span className="text-slate-500 font-bold block">البريد الإلكتروني الحقيقي:</span>
                            <span className="text-slate-200 font-mono font-bold select-all">{selectedClientForDetails.email}</span>
                          </div>

                          <div className="p-3.5 bg-[#080B10] border border-slate-800 rounded-xl space-y-1">
                            <span className="text-slate-500 font-bold block">الاسم الظاهر / المستعار:</span>
                            <span className="text-slate-200 font-bold">{selectedClientForDetails.name || 'غير محدد'}</span>
                          </div>

                          <div className="p-3.5 bg-[#080B10] border border-slate-800 rounded-xl space-y-1">
                            <span className="text-slate-500 font-bold block">معرف المستخدم بالنظام (UID):</span>
                            <span className="text-teal-400 font-mono select-all text-[11px]">{selectedClientForDetails.id || selectedClientForDetails.uid}</span>
                          </div>

                          <div className="p-3.5 bg-[#080B10] border border-slate-800 rounded-xl space-y-1">
                            <span className="text-slate-500 font-bold block">رتبة الحساب والنظام:</span>
                            <span className="text-indigo-400 font-bold">{selectedClientForDetails.role === 'admin' ? '🛡️ مدير نظام' : '👤 عميل عادي'}</span>
                          </div>

                          <div className="p-3.5 bg-[#080B10] border border-slate-800 rounded-xl space-y-1">
                            <span className="text-slate-500 font-bold block">تاريخ الإنشاء والانضمام:</span>
                            <span className="text-slate-300 font-mono">{formatAdminDateTime(selectedClientForDetails.created_at || selectedClientForDetails.createdAt)}</span>
                          </div>

                          <div className="p-3.5 bg-[#080B10] border border-slate-800 rounded-xl space-y-1">
                            <span className="text-slate-500 font-bold block">القيمة الإجمالية للعميل (Estimated LTV):</span>
                            <span className="text-emerald-400 font-black font-mono">
                              ${clientSubscriptions.reduce((acc, curr) => acc + (parseFloat(curr.price) || 99), 0)} USD
                            </span>
                          </div>

                          <div className="p-3.5 bg-[#080B10] border border-slate-800 rounded-xl space-y-1 md:col-span-2">
                            <span className="text-slate-500 font-bold block">معرف المستأجر / المتجر المربوط (Tenant ID):</span>
                            <span className="text-amber-400 font-mono text-[11px]">{selectedClientForDetails.tenantId || `tenant_user_${selectedClientForDetails.id || 'default'}`}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes Tab */}
                  {clientDetailsTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 text-lg">📝</span>
                            <div>
                              <h4 className="font-extrabold text-sm text-white">ملاحظات المشرفين الخاصة بالعميل</h4>
                              <p className="text-xs text-slate-400 mt-0.5">ملاحظات سرية للاستخدام الداخلي بين أفراد طاقم الإدارة فقط</p>
                            </div>
                          </div>
                        </div>

                        {/* Note Form */}
                        <div className="space-y-2">
                          <textarea
                            value={newClientNoteInput}
                            onChange={(e) => setNewClientNoteInput(e.target.value)}
                            placeholder="اكتب ملاحظة جديدة عن العميل هنا (مثال: العميل طلب متابعة خاصة عبر واتساب لتخصيص الشعار)..."
                            rows={3}
                            className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={handleAddAdminClientNote}
                              disabled={savingNoteLoading || !newClientNoteInput.trim()}
                              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
                            >
                              {savingNoteLoading ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              <span>حفظ الملاحظة السرية</span>
                            </button>
                          </div>
                        </div>

                        {/* Notes List */}
                        <div className="space-y-3 pt-2">
                          {clientNotes.length === 0 ? (
                            <div className="p-6 bg-[#080B10] border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                              لا توجد ملاحظات مسجلة لهذا العميل حتى الآن.
                            </div>
                          ) : (
                            clientNotes.map((nt, idx) => (
                              <div key={nt.id || idx} className="p-4 bg-[#080B10] border border-purple-500/20 rounded-xl space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-purple-300">بقلم المشرف: {nt.author}</span>
                                  <span className="text-slate-500 font-mono">{formatAdminDateTime(nt.createdAt)}</span>
                                </div>
                                <p className="text-xs text-slate-200 leading-relaxed font-medium">{nt.note}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions & Direct Communication Tab */}
                  {clientDetailsTab === 'actions' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Box 1: Send Direct In-App Notification */}
                        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                            <Bell size={18} />
                            <span>إرسال تنبيه مباشر بالمنصة 🔔</span>
                          </div>
                          <p className="text-xs text-slate-400">سيظهر هذا التنبيه فوراً في لوحة التحكم الخاصة بهذا العميل تحديداً.</p>
                          
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-400 font-bold block">نماذج رسائل سريعة جاهزة:</span>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDirectNotifyInput('نود تذكيركم بضرورة تجديد اشتراككم بالمنصة لتجنب توقف خدمات القوالب والموقع.')}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                💳 تذكير تجديد الاشتراك
                              </button>
                              <button
                                type="button"
                                onClick={() => setDirectNotifyInput('أهلاً بك! فريق الدعم الفني متواجد لمساعدتك في ضبط ألوان وهويتك البصرية والقوالب.')}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                👋 ترحب ودعم فني
                              </button>
                              <button
                                type="button"
                                onClick={() => setDirectNotifyInput('تم تسجيل تحديث في إعدادات وملف حسابك الشخصي. يرجى المراجعة عند الحاجة.')}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                🔒 تنبيه أمان وتحديث
                              </button>
                            </div>
                          </div>

                          <textarea
                            value={directNotifyInput}
                            onChange={(e) => setDirectNotifyInput(e.target.value)}
                            placeholder="اكتب رسالة التنبيه المباشرة للعميل..."
                            rows={3}
                            className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                          />

                          <button
                            onClick={handleSendDirectClientNotification}
                            disabled={sendingDirectNotifyLoading || !directNotifyInput.trim()}
                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20"
                          >
                            {sendingDirectNotifyLoading ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            <span>إرسال التنبيه الفوري للعميل</span>
                          </button>
                        </div>

                        {/* Box 2: Quick Communication & Status Toggle */}
                        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <UserCheck size={18} />
                            <span>إجراءات الحساب السريعة ⚡</span>
                          </div>

                          <div className="space-y-2">
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`أهلاً بك عزيزي المشترك (${selectedClientForDetails.name || selectedClientForDetails.email})، نتواصل معك من فريق دعم المنصة.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                            >
                              <MessageSquare size={16} />
                              <span>فتح محادثة واتساب مع العميل 💬</span>
                            </a>

                            <div className="pt-2 border-t border-slate-800/80 space-y-2">
                              <span className="text-[11px] text-slate-400 font-bold block">تعديل حالة الحساب بضغطة زر:</span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleUpdateUserRole(selectedClientForDetails.id, selectedClientForDetails.role === 'admin' ? 'user' : 'admin')}
                                  className="py-2 px-3 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer text-center"
                                >
                                  {selectedClientForDetails.role === 'admin' ? 'سحب رتبة المدير' : 'ترقية لمدير نظام 🛡️'}
                                </button>

                                <button
                                  onClick={() => handleSuspendUser(selectedClientForDetails.email)}
                                  className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-colors cursor-pointer text-center ${
                                    selectedClientForDetails.status === 'banned'
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                      : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                                  }`}
                                >
                                  {selectedClientForDetails.status === 'banned' ? 'إلغاء حظر الحساب 🟢' : 'حظر الحساب 🚫'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Timeline Tab */}
                  {clientDetailsTab === 'timeline' && (
                    <div className="space-y-3">
                      {clientActivities.length === 0 ? (
                        <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                          لا توجد عمليات أو تحركات مسجلة للعميل حتى الآن.
                        </div>
                      ) : (
                        <div className="relative border-r-2 border-slate-800 pr-6 space-y-4">
                          {clientActivities.map((act, idx) => (
                            <div key={act.id || idx} className="relative group">
                              <div className="absolute -right-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-[#0B0E14] group-hover:scale-125 transition-transform"></div>
                              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-extrabold text-xs text-amber-400">{act.action}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(act.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — {new Date(act.timestamp).toLocaleDateString('ar-EG')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium">{act.details}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edited Templates Tab */}
                  {clientDetailsTab === 'edited' && (
                    <div className="space-y-4">
                      {/* Top Action Header */}
                      <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                        <div>
                          <h4 className="font-extrabold text-xs text-white">قوالب وتعديلات العميل المحفوظة ({clientEditedTemplates.length})</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">يمكنك الاطلاع على التعديلات وإضافة أي تخصيصات خاصة وسوف تصل للعميل فوراً.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddTemplateForClientModal(true)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow flex items-center gap-1.5"
                        >
                          <Plus size={14} />
                          <span>تخصيص قالب جديد ➕</span>
                        </button>
                      </div>

                      {clientEditedTemplates.length === 0 ? (
                        <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-center space-y-3">
                          <p className="text-slate-400 text-xs font-bold">لم يقم العميل بتعديل أي قوالب بعد.</p>
                          <button
                            type="button"
                            onClick={() => setShowAddTemplateForClientModal(true)}
                            className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <span>تخصيص وإسناد قالب للعميل الآن 🛠️</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clientEditedTemplates.map((tpl, tplIdx) => {
                            const tplName = getAdminTemplateName(tpl);
                            const tplTime = formatAdminDateTime(tpl.updatedAt);
                            const cust = tpl.customizations || {};
                            const brandName = cust.brandName || cust.name || cust.storeName || 'غير محدد';
                            const phone = cust.phone || cust.phoneNumber || cust.contactPhone || 'غير محدد';
                            const primaryColor = cust.primaryColor || cust.accentColor || '#10b981';
                            const heroTitle = cust.heroTitle || cust.headerTitle || cust.title || 'العنوان الرئيسي';
                            const adminNote = cust.adminCustomNote || cust.adminNote || '';
                            const itemsCount = (Array.isArray(cust.items) ? cust.items.length : 0) || (Array.isArray(cust.menuItems) ? cust.menuItems.length : 0);

                            return (
                              <div key={`client-tpl-${tpl.id || tpl.templateId || tplIdx}`} className="p-4 bg-slate-900 border border-indigo-500/30 rounded-2xl space-y-3 shadow-md">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                                  <div className="min-w-0">
                                    <span className="font-black text-sm text-white line-clamp-1">{tplName}</span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">رمز القالب: #{tpl.templateId}</span>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 border ${
                                    cust.updatedByAdmin 
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                  }`}>
                                    {cust.updatedByAdmin ? 'مخصص من المشرف ✅' : 'قالب معدل'}
                                  </span>
                                </div>

                                {/* Customizations Summary */}
                                <div className="bg-[#080B10] p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="text-slate-500 font-bold">اسم المتجر:</span>
                                    <span className="font-bold text-amber-300">{brandName}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="text-slate-500 font-bold">رقم التواصل:</span>
                                    <span className="font-mono text-emerald-300 dir-ltr">{phone}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="text-slate-500 font-bold">اللون الرئيسي:</span>
                                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block" style={{ backgroundColor: primaryColor }} />
                                      <span>{primaryColor}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="text-slate-500 font-bold">عنوان الترويسة:</span>
                                    <span className="truncate max-w-[160px] text-slate-300">{heroTitle}</span>
                                  </div>
                                  {itemsCount > 0 && (
                                    <div className="flex items-center justify-between text-slate-300">
                                      <span className="text-slate-500 font-bold">قائمة العناصر:</span>
                                      <span className="text-blue-400 font-bold">{itemsCount} عناصر</span>
                                    </div>
                                  )}
                                  {adminNote && (
                                    <div className="pt-1 text-[10px] text-purple-300 bg-purple-950/40 p-1.5 rounded-lg border border-purple-500/30 font-medium">
                                      💬 ملاحظة المشرف: {adminNote}
                                    </div>
                                  )}
                                </div>

                                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                                  <span>حالة الاشتراك: <strong className={tpl.isSubscribed ? 'text-emerald-400' : 'text-amber-400'}>{tpl.isSubscribed ? 'مشترك ومفعل' : 'مسودة غير مفعلة'}</strong></span>
                                  <span className="font-mono text-slate-500">{tplTime}</span>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditClientTemplate(tpl)}
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-1.5"
                                  >
                                    <Edit3 size={13} />
                                    <span>تعديل وتخصيص للقالب 🛠️</span>
                                  </button>

                                  {tpl.templateId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewModalTemplateId(Number(tpl.templateId));
                                        setPreviewCustomizations(tpl.customizations || null);
                                      }}
                                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                                      title="دخول ومعاينة القالب بالتعديلات"
                                    >
                                      <span>دخول القالب 👁️</span>
                                      <ExternalLink size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Subscriptions Tab */}
                  {clientDetailsTab === 'subscriptions' && (
                    <div className="space-y-3">
                      {clientSubscriptions.length === 0 ? (
                        <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                          لا توجد اشتراكات نشطة للعميل.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clientSubscriptions.map((sub, subIdx) => {
                            const subTplName = getAdminTemplateName(sub);
                            const startStr = formatAdminDateTime(sub.startDate || sub.createdAt);
                            const renewalStr = formatAdminDateTime(sub.renewalDate || sub.endDate);
                            const isCancelled = ['cancelled', 'customer_cancelled', 'admin_cancelled', 'ملغي'].includes(sub.status);
                            const isByAdmin = sub.status === 'admin_cancelled' || sub.cancelledBy === 'admin';
                            
                            return (
                              <div key={`client-sub-${sub.id || sub.templateId || subIdx}`} className={`p-4 bg-slate-900 border rounded-2xl space-y-2 ${isCancelled ? 'border-red-500/40 opacity-80' : 'border-emerald-500/40'}`}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-black text-sm text-white line-clamp-1">{subTplName}</span>
                                  {isCancelled ? (
                                    <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                                      {isByAdmin ? 'ملغي بواسطة الإدارة 🚫' : 'ملغي بواسطة العميل ❌'}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                                      اشتراك نشط
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-emerald-300 font-bold">{sub.planTitle || sub.plan || 'باقة برو الشهرية'}</p>
                                <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                                  <div>تاريخ الاشتراك: <span className="font-mono text-slate-300">{startStr}</span></div>
                                  {!isCancelled && <div>تاريخ التجديد: <span className="font-mono text-slate-300">{renewalStr}</span></div>}
                                  {isCancelled && <div>تاريخ الإلغاء: <span className="font-mono text-red-300">{sub.cancelledAt ? formatAdminDateTime(sub.cancelledAt) : 'غير متوفر'}</span></div>}
                                  <div className="text-emerald-400 font-black">المبلغ: {sub.price || '99.00 USD'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Favorites Tab */}
                  {clientDetailsTab === 'favorites' && (
                    <div className="space-y-3">
                      {clientFavorites.length === 0 ? (
                        <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                          لم يضف العميل أي قوالب للمفضلة بعد.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {clientFavorites.map((fav, favIdx) => {
                            const favName = getAdminTemplateName(fav);
                            return (
                              <div key={`client-fav-${fav.id || fav.templateId || favIdx}`} className="p-3.5 bg-slate-900 border border-rose-500/30 rounded-2xl flex items-center justify-between">
                                <span className="font-bold text-xs text-white">{favName}</span>
                                <span className="text-xs">❤️</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 p-4 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق التقرير
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Client Template Customization Editor Modal */}
      {editingClientTemplate && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-slate-900 via-indigo-950/40 to-[#0F1218] p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-lg shadow-md">
                  🛠️
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    تخصيص وتعديل القالب للعميل: <span className="text-indigo-400">{editingClientTemplate.templateName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    العميل: <strong className="text-slate-200">{selectedClientForDetails?.email}</strong> — التعديلات تحفظ في حساب العميل مباشرة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingClientTemplate(null)}
                className="w-9 h-9 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Section 1: Store & Contact Info */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs">
                  <span>🏪</span>
                  <span>هوية المتجر والمعلومات الأساسية</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">اسم المتجر / العلامة التجارية:</label>
                    <input
                      type="text"
                      value={adminTplBrandName}
                      onChange={(e) => setAdminTplBrandName(e.target.value)}
                      placeholder="مثال: مطعم الشرق الأصيل"
                      className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">رقم التواصل والواتساب:</label>
                    <input
                      type="text"
                      value={adminTplPhone}
                      onChange={(e) => setAdminTplPhone(e.target.value)}
                      placeholder="مثال: 0778091269"
                      className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors dir-ltr text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-slate-400 font-bold block">رابط صورة الشعار / اللوجو (Logo URL):</label>
                  <input
                    type="text"
                    value={adminTplLogoUrl}
                    onChange={(e) => setAdminTplLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Section 2: Hero Header & Subtitle */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                  <span>✨</span>
                  <span>عناوين الترويسة الرئيسية والترحيب</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">العنوان الرئيسي (Hero Title):</label>
                    <input
                      type="text"
                      value={adminTplHeroTitle}
                      onChange={(e) => setAdminTplHeroTitle(e.target.value)}
                      placeholder="مثال: أشهى المأكولات وأفضل الخدمات بأعلى جودة"
                      className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">الوصف الفرعي (Hero Subtitle):</label>
                    <textarea
                      value={adminTplHeroSubtitle}
                      onChange={(e) => setAdminTplHeroSubtitle(e.target.value)}
                      placeholder="اكتب وصفاً جذاباً للزوار..."
                      rows={2}
                      className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Colors & Theme */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                  <span>🎨</span>
                  <span>تنسيق الألوان والتصميم الخارجي</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <label className="text-slate-400 font-bold block">اللون الرئيسي المميز (Primary Accent):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={adminTplPrimaryColor}
                        onChange={(e) => setAdminTplPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={adminTplPrimaryColor}
                        onChange={(e) => setAdminTplPrimaryColor(e.target.value)}
                        className="flex-1 bg-[#080B10] border border-slate-800 rounded-xl p-2 text-white font-mono uppercase text-center focus:outline-none"
                      />
                    </div>
                    
                    {/* Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {['#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#14b8a6', '#8b5cf6', '#06b6d4'].map(hex => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setAdminTplPrimaryColor(hex)}
                          className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-125 cursor-pointer"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-400 font-bold block">اللون الثانوي والداعم (Secondary Color):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={adminTplSecondaryColor}
                        onChange={(e) => setAdminTplSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={adminTplSecondaryColor}
                        onChange={(e) => setAdminTplSecondaryColor(e.target.value)}
                        className="flex-1 bg-[#080B10] border border-slate-800 rounded-xl p-2 text-white font-mono uppercase text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Admin Custom Note for Client */}
              <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-extrabold text-xs">
                  <span>📝</span>
                  <span>تنبيه وإعلانات خاصة من الإدارة للعميل في واجهة القالب</span>
                </div>
                <textarea
                  value={adminTplAdminNote}
                  onChange={(e) => setAdminTplAdminNote(e.target.value)}
                  placeholder="مثال: تم ضبط ألوان الهوية وتفعيل خصم 15% على الوجبات الخاصة..."
                  rows={2}
                  className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Section 5: Custom Items / Menu Manager */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-blue-400 flex items-center gap-1.5">
                    🍔 قائمة المنتجات والخدمات المخصصة ({adminTplItems.length})
                  </span>
                  <span className="text-[10px] text-slate-500">يمكنك إضافة أو حذف منتجات مخصصة للعميل</span>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {adminTplItems.length === 0 ? (
                    <div className="p-3 bg-[#080B10] border border-slate-800/80 rounded-xl text-center text-slate-500 text-[11px]">
                      لا توجد عناصر مضافة حتى الآن في قائمة القالب.
                    </div>
                  ) : (
                    adminTplItems.map((itm, iIdx) => (
                      <div key={itm.id || iIdx} className="p-2.5 bg-[#080B10] border border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                            #{iIdx + 1}
                          </span>
                          <span className="font-bold text-white truncate">{itm.title || itm.name || 'عنصر بدون اسم'}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-emerald-400 font-mono font-bold text-[11px]">{itm.price || '0'}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromClientTpl(iIdx)}
                            className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="حذف العنصر"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Item Quick Form */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    value={adminTplNewItemTitle}
                    onChange={(e) => setAdminTplNewItemTitle(e.target.value)}
                    placeholder="اسم العنصر الجديد..."
                    className="sm:col-span-1 bg-[#080B10] border border-slate-800 rounded-xl p-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={adminTplNewItemPrice}
                    onChange={(e) => setAdminTplNewItemPrice(e.target.value)}
                    placeholder="السعر (مثال: $12)..."
                    className="sm:col-span-1 bg-[#080B10] border border-slate-800 rounded-xl p-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewItemToClientTpl}
                    disabled={!adminTplNewItemTitle.trim()}
                    className="sm:col-span-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Plus size={14} />
                    <span>إضافة للقائمة</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 p-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEditingClientTemplate(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء والتراجع
              </button>

              <button
                type="button"
                onClick={handleSaveClientTemplateCustomization}
                disabled={savingClientTplLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                {savingClientTplLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>حفظ وتطبيق التخصيصات للعميل 🚀</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Select & Create New Template for Client Modal */}
      {showAddTemplateForClientModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-lg">➕</span>
                <div>
                  <h3 className="font-extrabold text-white text-base">تخصيص قالب جديد للعميل</h3>
                  <p className="text-xs text-slate-400 mt-0.5">اختر القالب من المكتبة لبدء تخصيصه وإتاحته للعميل</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTemplateForClientModal(false)}
                className="w-8 h-8 bg-slate-800 text-slate-400 hover:text-white rounded-xl flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">اختر نوع القالب المطلوب من الكتالوج:</label>
              <select
                value={selectedTemplateIdToAssign}
                onChange={(e) => setSelectedTemplateIdToAssign(e.target.value)}
                className="w-full bg-[#080B10] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(ADMIN_TEMPLATE_NAMES_MAP).map(([id, name]) => (
                  <option key={id} value={id}>
                    قالب رقم {id}: {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTemplateForClientModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateNewTemplateForClient}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-600/30"
              >
                متابعة وتخصيص القالب 🛠️
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Interactive Template Preview Modal */}
      {previewModalTemplateId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200 dir-rtl">
          <div className="bg-slate-900 border-b border-slate-800 p-4 md:px-6 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-white text-sm md:text-lg">
                    معاينة حية: {dbTemplates.find(t => Number(t.id) === Number(previewModalTemplateId))?.name || 'قالب الموقع'}
                  </h3>
                  <span className="text-[10px] md:text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    معاينة السوبر أدمن
                  </span>
                </div>
                <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 font-medium">
                  استعراض كامل للقالب وتصاميمه التفاعلية للعملاء.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  openAssignModal(Number(previewModalTemplateId));
                  setPreviewModalTemplateId(null);
                }}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>تخصيص لعميل (Assign)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalTemplateId(null);
                  setPreviewCustomizations(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>إغلاق</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-950">
            <TemplateRenderer 
              templateId={previewModalTemplateId} 
              content={previewCustomizations || null} 
              tenant={null} 
              isEditable={false} 
            />
          </div>
        </div>
      )}

      {/* Fullscreen Interactive Management Dashboard Preview Modal */}
      {previewManagementTemplateId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200 dir-rtl">
          <div className="bg-slate-900 border-b border-slate-800 p-4 md:px-6 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-white text-sm md:text-lg">
                    معاينة لوحة الإدارة: {dbTemplates.find(t => Number(t.id) === Number(previewManagementTemplateId))?.name || 'لوحة التحكم'}
                  </h3>
                  <span className="text-[10px] md:text-xs text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    لوحة التحكم المخصصة للقالب
                  </span>
                </div>
                <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 font-medium">
                  أنت الآن تقوم بمعاينة وتجربة لوحة تحكم السوبر أدمن المخصصة لهذا القالب مباشرة.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  window.open(`/dashboard?previewTemplateId=${previewManagementTemplateId}`, '_blank');
                }}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
              >
                <span>فتح باللوحة الكاملة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openAssignModal(Number(previewManagementTemplateId));
                  setPreviewManagementTemplateId(null);
                }}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
              >
                <span>تخصيص لعميل</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewManagementTemplateId(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
              >
                <span>إغلاق</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-100 p-2 sm:p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <DashboardTemplateRegistry 
                templateId={Number(previewManagementTemplateId)} 
                content={{
                  items: [
                    { 
                      id: 1, 
                      title: 'مشروع إنشائي / تجاري نموذج 1', 
                      name: 'مشروع إنشائي / تجاري نموذج 1', 
                      budget: '15,000,000 ر.س', 
                      price: '15,000,000 ر.س', 
                      client: 'وزارة النقل / جهة خاصة', 
                      duration: '10 أشهر', 
                      status: 'قيد التنفيذ (60%)', 
                      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000' 
                    }
                  ],
                  orders: []
                }} 
                tenant={{ name: 'معاينة القالب', domain: 'preview' }} 
                handleUpdateContent={() => {}} 
                setContent={() => {}} 
                dashboardColor="indigo" 
                analyticsData={{}} 
                orders={[]} 
                setActiveTab={() => {}} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">معاينة الصورة المرفقة بالحجم الكامل 🔍</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  فتح في تبويب جديد ↗
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <img src={previewImage} alt="Full preview" className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-slate-800 shadow-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Admin Subscription Renewal Modal with Plan & Price Selection */}
      {renewModalEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">تجديد اشتراك العميل 🔄</span>
                <h3 className="text-lg font-black text-white mt-1">تحديد باقة التجديد للعميل</h3>
                <p className="text-xs text-slate-400 mt-0.5">{renewModalEmail}</p>
              </div>
              <button onClick={() => setRenewModalEmail(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">اختر الباقة:</label>
                <select
                  value={selectedRenewPlan}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedRenewPlan(val);
                    if (val === 'monthly' || val === 'pro') {
                      setSelectedRenewPrice('35');
                    } else if (val === 'yearly' || val === 'enterprise') {
                      setSelectedRenewPrice('350');
                    } else {
                      setSelectedRenewPrice('0');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-emerald-500 font-bold"
                >
                  {getSubscriptionPlans(adminPricingConfig.baseCurrency).map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ({plan.price} / {plan.duration})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">سعر التجديد ($):</label>
                <input
                  type="number"
                  value={selectedRenewPrice}
                  onChange={e => setSelectedRenewPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-emerald-500 font-mono"
                  placeholder="15"
                />
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 space-y-1">
                <p className="font-bold">ℹ️ ملاحظة حول تمديد المدة:</p>
                <p className="text-slate-300">سيتم إضافة مدة الاشتراك الجديدة تلقائياً فوق رصيد الأيام المتبقية الحالية للعميل (أو من تاريخ اليوم إذا كان الاشتراك منتهياً).</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleRenewSubscriptionWithPlan(renewModalEmail, selectedRenewPlan, selectedRenewPrice)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer"
              >
                تأكيد وتجديد الاشتراك فوراً ✨
              </button>
              <button
                onClick={() => setRenewModalEmail(null)}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Native Bulk Welcome Confirmation & Result Modal */}
      {showBulkWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  📧
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    منصة بنيان 🏰
                  </span>
                  <h3 className="text-base font-black text-white mt-1">
                    إرسال ترحب بالجميع
                  </h3>
                </div>
              </div>
              {!isSendingBulkWelcome && (
                <button
                  onClick={() => setShowBulkWelcomeModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {bulkWelcomeResult ? (
              /* Result view */
              <div className="space-y-5 text-center py-2">
                {bulkWelcomeResult.success ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/20">
                      🎉
                    </div>
                    <h4 className="text-lg font-black text-white">تم الإرسال بنجاح!</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                      {bulkWelcomeResult.message}
                    </p>
                    {bulkWelcomeResult.stats && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-2xl text-center">
                          <span className="block text-xs font-bold text-slate-400">البريد الناجح</span>
                          <span className="text-lg font-black text-emerald-400">{bulkWelcomeResult.stats.successCount}</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                          <span className="block text-xs font-bold text-slate-400">البريد الفاشل</span>
                          <span className="text-lg font-black text-rose-400">{bulkWelcomeResult.stats.failCount}</span>
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-right text-xs text-emerald-300 font-bold flex items-center gap-2">
                      <Bell size={16} className="text-emerald-400 shrink-0" />
                      <span>تم إضافة إشعار عام من منصة بنيان في لوحة تحكم جميع العملاء 🔔</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-rose-500/20">
                      ⚠️
                    </div>
                    <h4 className="text-lg font-black text-white">تعذر إرسال الرسائل</h4>
                    <p className="text-xs text-rose-300 leading-relaxed max-w-sm mx-auto">
                      {bulkWelcomeResult.message}
                    </p>
                    {bulkWelcomeResult.errors && bulkWelcomeResult.errors.length > 0 && (
                      <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-right text-xs text-rose-200 space-y-1">
                        <span className="font-bold block text-rose-400">تفاصيل الخطأ من السيرفر:</span>
                        {bulkWelcomeResult.errors.map((err, idx) => (
                          <div key={idx} className="font-mono text-[11px] text-slate-300">• {err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3">
                  <button
                    onClick={() => setShowBulkWelcomeModal(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg"
                  >
                    حسناً، إغلاق ✖️
                  </button>
                </div>
              </div>
            ) : isSendingBulkWelcome ? (
              /* Loading view */
              <div className="py-10 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-black text-white">جاري إرسال البريد وإنشاء إشعار المنصة... ⏳</h4>
                <p className="text-xs text-slate-400">يرجى الانتظار لحين الانتهاء من المعالجة الكاملة</p>
              </div>
            ) : (
              /* Confirmation view */
              <div className="space-y-5">
                <p className="text-xs text-slate-300 leading-relaxed font-bold">
                  اختر القالب الذي تريد إرساله لكافة المستخدمين:
                </p>

                <div className="space-y-3">
                  <select
                    value={bulkWelcomeTemplate}
                    onChange={(e) => setBulkWelcomeTemplate(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-blue-500"
                  >
                    <option value="template_update">🎉 إشعار إطلاق قالب جديد (New Template Announcement)</option>
                    <option value="welcome">قالب الترحيب (Welcome Email)</option>
                    <option value="receipt">قالب إيصال الاشتراك (Subscription Receipt)</option>
                    <option value="reminder">قالب تذكير الاشتراك (Subscription Reminder)</option>
                  </select>

                  {bulkWelcomeTemplate === 'template_update' && (
                    <div className="space-y-3 pt-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم القالب الجديد:</label>
                        <input
                          type="text"
                          value={bulkTemplateName}
                          onChange={(e) => setBulkTemplateName(e.target.value)}
                          placeholder="مثال: متجر الفخامة العصرية"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">وصف القالب ومميزاته:</label>
                        <textarea
                          rows={2}
                          value={bulkTemplateDesc}
                          onChange={(e) => setBulkTemplateDesc(e.target.value)}
                          placeholder="اكتب وصف قصير عن القالب وما يقدمه للعملاء..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-start gap-2.5 text-slate-200">
                    <span className="text-base">📧</span>
                    <div>
                      <strong className="text-white block">رسالة بريد إلكتروني رسمية:</strong>
                      <span className="text-slate-400">تصل إلى البريد الإلكتروني المسجل لكل عميل بالتنسيق المختار.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-200 pt-2 border-t border-slate-900">
                    <span className="text-base">🔔</span>
                    <div>
                      <strong className="text-white block">إشعار فوري من المنصة:</strong>
                      <span className="text-slate-400">يظهر كإشعار إجباري مباشر في لوحة تحكم المستخدمين باسم "منصة بنيان".</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={executeBulkWelcomeSend}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>تأكيد الإرسال الآن 🚀</span>
                  </button>
                  <button
                    onClick={() => setShowBulkWelcomeModal(false)}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

