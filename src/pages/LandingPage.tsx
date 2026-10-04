import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { loginWithGoogle, auth, logout } from '../lib/firebase';
import { onAuthStateChanged, updateProfile, updatePassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Shield, Store, LogOut, Sparkles, Building2, X, Layers, Heart, Settings, HelpCircle, Globe, Menu, CreditCard, Package, LayoutTemplate, User, Camera, FileText, Lock, Check, ShieldCheck, Bell, KeyRound, Search, LifeBuoy, BookOpen, Wrench, MessageSquare, Send, CheckCircle2, AlertCircle, Code, Video, Activity, Eye, RefreshCw, ArrowRight, ChevronLeft, FileDown, Printer, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { fetchUserEditedTemplates, fetchUserSubscriptionsFromFirestore, deleteSubscriptionInFirestore, cancelSubscriptionInFirestore, deleteEditedTemplateInFirestore, saveUserQuizAnswers, logUserActivity, createSupportTicket, fetchUserNotifications, markNotificationAsRead, fetchUserSupportTickets, addUserReplyToSupportTicket, createAppNotification, AppNotification, SupportTicket } from '../lib/activityLogger';
import { fetchSystemSettings, checkFeatureLock } from '../lib/systemSettingsClient';
import { getSubscriptionPlans } from '../lib/subscriptionPlans';
const LuxuryRestaurant = React.lazy(() => import('../templates/LuxuryRestaurant'));
const ModernGrill = React.lazy(() => import('../templates/ModernGrill'));
const FastFoodDelivery = React.lazy(() => import('../templates/FastFoodDelivery'));
const CozyCafe = React.lazy(() => import('../templates/CozyCafe'));
const SpecialtyCoffee = React.lazy(() => import('../templates/SpecialtyCoffee'));
const BakeryCafe = React.lazy(() => import('../templates/BakeryCafe'));
const LuxuryVillas = React.lazy(() => import('../templates/LuxuryVillas'));
const ModernApartments = React.lazy(() => import('../templates/ModernApartments'));
const CommercialAgency = React.lazy(() => import('../templates/CommercialAgency'));

const HeavyConstruction = React.lazy(() => import('../templates/HeavyConstruction'));
const ModernArchitecture = React.lazy(() => import('../templates/ModernArchitecture'));
const HomeRenovation = React.lazy(() => import('../templates/HomeRenovation'));
const FashionTemplate = React.lazy(() => import('../templates/FashionTemplate'));
const ElectronicStore = React.lazy(() => import('../templates/ElectronicStore'));
const SkincareStore = React.lazy(() => import('../templates/SkincareStore'));
const DentalClinic = React.lazy(() => import('../templates/DentalClinic'));
import { getDefaultItemsForTemplate, getDefaultHeroForTemplate } from '../lib/defaultData';
import TemplateOverviewModal from '../components/TemplateOverviewModal';
import PricingSection from '../components/PricingSection';
import ClientWorkflowSection from '../components/ClientWorkflowSection';
import PreviewGate from '../components/PreviewGate';
import ClientWorkspace from '../components/ClientWorkspace';
import TemplatePreviewWrapper from '../components/TemplatePreviewWrapper';
import InterestQuizWizard, { QuizAnswers } from '../components/InterestQuizWizard';
import { PromoBannerModal } from '../components/PromoBannerModal';

const COMPONENT_MAP: Record<number, any> = {
  1: LuxuryRestaurant,
  2: ModernGrill,
  3: FastFoodDelivery,
  4: CozyCafe,
  5: SpecialtyCoffee,
  6: BakeryCafe,
  7: LuxuryVillas,
  8: ModernApartments,
  9: CommercialAgency,
  10: HeavyConstruction,
  11: ModernArchitecture,
  12: HomeRenovation,
  13: FashionTemplate,
  14: ElectronicStore,
  15: SkincareStore,
  16: DentalClinic
};

const sortTemplates = (list: any[]) => {
  return [...list].sort((a, b) => {
    const idA = String(a.uniqueId || `${a.type}-${a.id}`);
    const idB = String(b.uniqueId || `${b.type}-${b.id}`);
    
    if (idA === 'built-in-5' || a.id === 5) return -1;
    if (idB === 'built-in-5' || b.id === 5) return 1;

    const getScore = (cat: string) => {
      if (cat === 'realestate') return 1;
      if (cat === 'contractors') return 2;
      if (cat === 'fashion') return 0;
      if (cat === 'electronics') return 0;
      if (cat === 'medical') return 0;
      return 3; // restaurants, cafes, etc.
    };

    const scoreA = getScore(a.category);
    const scoreB = getScore(b.category);

    if (scoreA !== scoreB) return scoreA - scoreB;
    return 0;
  });
};

const UNSORTED_FALLBACK = [
  { id: 1, name: 'قالب مطعم', category: 'restaurants', description: 'تصميم ملكي راقي مخصص للمطاعم الفاخرة والفاين دايننج، يتيح للعملاء استعراض القائمة الفاخرة، الحجز الفوري للطاولات، وطلب الأطباق بأسلوب احترافي.', type: 'built-in', uniqueId: 'built-in-1', component: LuxuryRestaurant, price: 'مجاني', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800' },
  { id: 2, name: 'قالب مطعم', category: 'restaurants', description: 'قالب حيوي وجذاب بمظهر عصري يبرز صور البرجر والوجبات السريعة مع نظام طلب سريع وعروض ترويجية مشهية.', type: 'built-in', uniqueId: 'built-in-2', component: ModernGrill, price: 'مجاني', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800' },
  { id: 3, name: 'قالب مطعم', category: 'restaurants', description: 'واجهة متكاملة مخصصة لمطاعم البيتزا والوجبات العائلية مع خيارات مخصصة لتحديد أحجام البيتزا، الإضافات، والمشروبات.', type: 'built-in', uniqueId: 'built-in-3', component: FastFoodDelivery, price: 'مجاني', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800' },
  { id: 4, name: 'قالب مقهى', category: 'cafes', description: 'تصميم دافئ وراقي يعكس أجواء المقاهي الكلاسيكية والمخابز الطازجة مع قائمة مشروبات وحلويات تفاعلية.', type: 'built-in', uniqueId: 'built-in-4', component: CozyCafe, price: 'مجاني', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800' },
  { id: 5, name: 'قالب مقهى', category: 'cafes', description: 'واجهة عصرية متطورة لعشاق القهوة المختصة والمحمصة، تتيح استعراض إيحاءات البن، مصدر الحبوب، وأدوات التحضير.', type: 'built-in', uniqueId: 'built-in-5', component: SpecialtyCoffee, price: 'مجاني', image: 'https://images.unsplash.com/photo-1495474472201-4148ff78b276?q=80&w=800' },
  { id: 6, name: 'قالب مقهى', category: 'cafes', description: 'تصميم مبهج وملون يبرز كعكات المناسبات، الحلويات الغربية الفاخرة، والآيس كريم بطريقة تجذب الزوار للطلب الفوري.', type: 'built-in', uniqueId: 'built-in-6', component: BakeryCafe, price: 'مجاني', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800' },
  { id: 7, name: 'قالب عقارات', category: 'realestate', description: 'تصميم فخم وعصري يعكس الفخامة لتسويق الفلل، القصور، والمشاريع العقارية الاستثمارية الكبرى مع تفاصيل كاملة لكل عقار.', type: 'built-in', uniqueId: 'built-in-7', component: LuxuryVillas, price: 'مجاني', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800' },
  { id: 8, name: 'قالب عقارات', category: 'realestate', description: 'واجهة هادئة وعملية لتصفح الشقق المتاحة للإيجار أو الشراء، مع تفاصيل المساحات، المرافق، والتواصل المباشر مع المالك.', type: 'built-in', uniqueId: 'built-in-8', component: ModernApartments, price: 'مجاني', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800' },
  { id: 9, name: 'قالب عقارات', category: 'realestate', description: 'قالب مؤسسي رصين يعزز الثقة في خدمات إدارة الأملاك، التثمين العقاري، وتقديم الاستشارات الاستثمارية العقارية.', type: 'built-in', uniqueId: 'built-in-9', component: CommercialAgency, price: 'مجاني', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800' },
  { id: 10, name: 'قالب مقاولات', category: 'contractors', description: 'قالب مهني قوي يبرز المشاريع الإنشائية المنجزة، الخدمات الهندسية، أعمال البناء والتشطيبات الكبرى.', type: 'built-in', uniqueId: 'built-in-10', component: HeavyConstruction, price: 'مجاني', image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=800' },
  { id: 11, name: 'قالب مقاولات', category: 'contractors', description: 'تصميم عصري وفني يبرز الأفكار المعمارية المبتكرة والمخططات الهندسية ثلاثية الأبعاد 3D.', type: 'built-in', uniqueId: 'built-in-11', component: ModernArchitecture, price: 'مجاني', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' },
  { id: 12, name: 'قالب مقاولات', category: 'contractors', description: 'يعرض أفكار الديكور المودرن والكلاسيك مع ميزة تفاعلية قبل وبعد التعديل (Before & After) لإبراز جودة التشطيبات.', type: 'built-in', uniqueId: 'built-in-12', component: HomeRenovation, price: 'مجاني', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800' },
  { id: 13, name: 'قالب أزياء فاخرة', category: 'fashion', description: 'متجر إلكتروني راقي للأزياء الفاخرة والإكسسوارات مع اختيار الألوان والمقاسات، عربة تسوق ذكية، وتتبع حالات الطلب بدقة.', type: 'built-in', uniqueId: 'built-in-13', component: FashionTemplate, price: 'مجاني', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800' },
  { id: 14, name: 'متجر الأجهزة الإلكترونية', category: 'electronics', description: 'متجر إلكتروني متكامل ومتطور لأحدث الهواتف الذكية، الحواسيب المحمولة، والإلكترونيات مع خيارات السعة، الألوان، ومساعد ذكي.', type: 'built-in', uniqueId: 'built-in-14', component: ElectronicStore, price: 'مجاني', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800' },
  { id: 15, name: 'متجر العناية بالبشرة والجسم', category: 'beauty', description: 'متجر جمالي متكامل لمنتجات العناية بالبشرة والجسم، مع ميزات التسوق السريع، إضافة للمفضلة، وتتبع حالة الطلبات والمنتجات الطبيعية.', type: 'built-in', uniqueId: 'built-in-15', component: SkincareStore, price: 'مجاني', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800' },
  { id: 16, name: 'قالب عيادة الأسنان', category: 'medical', description: 'قالب طبي احترافي لعيادات ومراكز طب الأسنان يتيح للمرضى حجز المواعيد إلكترونياً، استعراض الخدمات الطبية، والتعرف على الفريق الطبي المتخصص.', type: 'built-in', uniqueId: 'built-in-16', component: DentalClinic, price: 'مجاني', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800' }
];

const FALLBACK_TEMPLATES = sortTemplates(UNSORTED_FALLBACK);

const TEMPLATE_TRANSLATIONS: Record<number, { name: string; description: string }> = {
  1: { name: 'Luxury Restaurant Template', description: 'If you have a fine dining restaurant and want a design that reflects luxury, this template is the ideal choice.' },
  2: { name: 'Modern Grill Restaurant Template', description: 'A modern, mouth-watering template that showcases food photos to make visitors hungry!' },
  3: { name: 'Fast Food Delivery Template', description: 'Fast and easy ordering system, excellent for burger and pizza delivery restaurants.' },
  4: { name: 'Cozy Cafe Template', description: 'Warm colors and comfortable design, perfect for cafes offering a relaxing atmosphere.' },
  5: { name: 'Specialty Coffee Template', description: 'Modern design for coffee roasters and specialty coffee shops, focusing on product details.' },
  6: { name: 'Bakery & Sweets Template', description: 'Light colors and a design that makes bakery items and sweets look fresh and delicious.' },
  7: { name: 'Luxury Villas Template', description: 'Elegant and luxurious design, excellent for real estate companies marketing villas and mansions.' },
  8: { name: 'Modern Apartments Template', description: 'Modern and simple interface making it easy for people to search and find apartments.' },
  9: { name: 'Commercial Agency Template', description: 'Formal and practical design helping real estate offices present projects in an organized way.' },
  10: { name: 'Heavy Construction Template', description: 'Design reflecting strength and durability, ideal for large construction and building companies.' },
  11: { name: 'Architectural Engineering Template', description: 'Artistic and innovative design highlighting the beauty of architectural projects.' },
  12: { name: 'Interior Design & Renovation Template', description: 'Sleek design catching people attention for your interior styling and home renovation work.' },
  13: { name: 'Haute Couture Fashion Template', description: 'Elegant fashion e-commerce storefront with variant selectors, cart, order tracking and Google login.' },
  14: { name: 'Electronics Store Template', description: 'Modern electronics and tech store template.' },
  15: { name: 'Skincare Store Template', description: 'Elegant skincare and beauty store template.' },
  16: { name: 'Dental Clinic Template', description: 'Advanced dental clinic website template with appointment booking and doctor profiles.' }
};

const createFullTemplateBlocks = (template?: any) => {
  const name = template?.name || 'موقعنا الاحترافي';
  const img = template?.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200';
  return [
    {
      id: 'hero-1',
      type: 'hero',
      title: `مرحباً بك في ${name}`,
      subtitle: template?.description || 'انقر على النص للتعديل المباشر المخصص وإضافة لمساتك الخاصة على هذا الموقع.',
      ctaText: 'تواصل معنا أو اطلب الآن',
      image: img,
      titleColor: '#0f172a',
      subtitleColor: '#475569',
      bgColor: '#ffffff'
    },
    {
      id: 'features-1',
      type: 'features',
      title: 'أبرز مميزاتنا وخدماتنا',
      subtitle: 'نلتزم بالدقة والاحترافية لتلبية كل التطلعات والاحتياجات',
      items: [
        { id: 'f1', title: 'جودة استثنائية', desc: 'نستخدم أفضل الخامات والمعايير لضمان النتيجة.', icon: '' },
        { id: 'f2', title: 'سرعة ودقة', desc: 'إنجاز سريع مع متابعة واهتمام بالتفاصيل.', icon: '' },
        { id: 'f3', title: 'دعم متواصل', desc: 'فريقنا جاهز للإجابة على جميع الاستفسارات.', icon: '' }
      ],
      bgColor: '#f8fafc'
    },
    {
      id: 'gallery-1',
      type: 'gallery',
      title: 'معرض الصور والتشكيلة الحصرية',
      subtitle: 'استعرض أحدث الأعمال والتصاميم المتاحة لدينا',
      items: [
        { id: 'g1', image: img },
        { id: 'g2', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800' },
        { id: 'g3', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800' }
      ],
      bgColor: '#ffffff'
    },
    {
      id: 'testimonials-1',
      type: 'testimonials',
      title: 'تقييمات وآراء العملاء',
      subtitle: 'شهادات نعتز بها من عملائنا الكرام',
      items: [
        { id: 't1', name: 'أحمد محمود', role: 'عميل دائم', comment: 'خدمة رائعة وتجربة فائقة الجودة والسرعة.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' },
        { id: 't2', name: 'سارة خالد', role: 'عميلة', comment: 'اهتمام بالتفاصيل وتواصل ممتاز طوال الوقت.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }
      ],
      bgColor: '#f8fafc'
    },
    {
      id: 'cta-1',
      type: 'cta',
      title: 'جاهز للبدء والتواصل معنا؟',
      subtitle: 'احصل على خدماتك الآن بلمسة واحدة مباشرة.',
      ctaText: 'تواصل معنا عبر الواتساب',
      bgColor: '#008060'
    }
  ];
};

const createInitialTemplateCustomizations = (template?: any) => {
  const tId = Number(template?.id) || 1;
  const items = getDefaultItemsForTemplate(tId);
  const heroImg = template?.image || getDefaultHeroForTemplate(tId);
  
  return {
    businessName: template?.name || 'موقعنا الاحترافي',
    slogan: template?.description || 'نقدم لك أفضل الخدمات والمنتجات بجهود احترافية وبأعلى معايير الجودة.',
    heroTitle: template?.name ? `مرحباً بك في ${template.name}` : 'مرحباً بكم في موقعنا الفاخر',
    heroSubtitle: template?.description || 'استمتع بتجربة فريدة وخدمات متميزة تلبي جميع تطلعاتك.',
    heroBgUrl: heroImg,
    primaryColor: [1, 4].includes(tId) ? '#d4af37' : ([7, 8, 9].includes(tId) ? '#0284c7' : '#008060'),
    fontFamily: 'Cairo',
    whatsappNumber: '966500000000',
    phoneNumber: '0500000000',
    items: items,
    blocks: createFullTemplateBlocks(template)
  };
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(() => {
    try {
      const saved = localStorage.getItem('user_quiz_answers');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState<boolean>(() => {
    try {
      return localStorage.getItem('user_quiz_completed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isQuizLoadedFromStorage, setIsQuizLoadedFromStorage] = useState<boolean>(() => {
    try {
      return localStorage.getItem('user_quiz_completed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [overviewTemplateId, setOverviewTemplateId] = useState<string | null>(null);
  const [showPreviewBanner, setShowPreviewBanner] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(() => auth.currentUser);
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(() => !auth.currentUser);
  const [hasAssignedTemplate, setHasAssignedTemplate] = useState(false);
  const [dbUserRole, setDbUserRole] = useState<string>('user');
  const [dbUserTenantId, setDbUserTenantId] = useState<any>(null);
  const [dbUserPermissions, setDbUserPermissions] = useState<string>('none');
  const [mySites, setMySites] = useState<any[]>([]);

  const [showDropdown, setShowDropdown] = useState(false);

  const [dbTemplates, setDbTemplates] = useState<any[]>(FALLBACK_TEMPLATES);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // WaaS Client Journey States
  const [gateTemplate, setGateTemplate] = useState<any | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<any | null>(null);
  const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false);
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([]);
  const [editedTemplatesList, setEditedTemplatesList] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [favoriteTemplates, setFavoriteTemplates] = useState<any[]>([]);
  const [customConfirm, setCustomConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Accordion drawer states
  const [isSubsOpen, setIsSubsOpen] = useState(false);
  const [isEditedOpen, setIsEditedOpen] = useState(false);
  const [isFavsOpen, setIsFavsOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);

  // Account Settings Modal States
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'privacy' | 'security' | 'notifications' | 'billing' | 'api' | 'localization' | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(() => localStorage.getItem('twoFactorEnabled') === 'true');
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  // Help Center Modal States
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<'faq' | 'troubleshooting' | 'guides' | 'ticket' | 'videos' | 'status' | 'my_tickets' | 'plans'>('faq');
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketAttachment, setTicketAttachment] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(() => {
    const saved = localStorage.getItem('selected_plan_checkout');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return null;
  });
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadInvoicePDF = async () => {
    if (!selectedInvoiceModal) return;
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('tax-invoice-printable');
      if (!element) {
        window.print();
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bunyan_Invoice_${selectedInvoiceModal.invoiceNo || 'INV'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Notifications & User Support Tickets State
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>([]);
  const [userSupportTickets, setUserSupportTickets] = useState<SupportTicket[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [loadingUserNotifs, setLoadingUserNotifs] = useState(false);
  const [ticketReplyInput, setTicketReplyInput] = useState<{ [ticketId: string]: string }>({});
  const [ticketAttachmentInput, setTicketAttachmentInput] = useState<{ [ticketId: string]: string }>({});

  const loadUserDataNotificationsAndTickets = async () => {
    const userId = user?.uid || auth.currentUser?.uid || 'usr_guest';
    const email = user?.email || auth.currentUser?.email || undefined;
    try {
      setLoadingUserNotifs(true);
      if (user) {
        const token = await user.getIdToken().catch(() => null);
        if (token) {
          fetch('/api/auth/ping', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => {});
        }
      }
      const [notifs, tickets] = await Promise.all([
        fetchUserNotifications(userId, email),
        fetchUserSupportTickets(userId, email)
      ]);
      setUserNotifications(notifs);
      setUserSupportTickets(tickets);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoadingUserNotifs(false);
    }
  };

  useEffect(() => {
    loadUserDataNotificationsAndTickets();
    const interval = setInterval(loadUserDataNotificationsAndTickets, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const detectDefaultCurrency = () => {
    if (typeof window === 'undefined') return 'SAR';
    const saved = localStorage.getItem('app_currency');
    if (saved) return saved;

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Riyadh') || tz.includes('Saudi')) return 'SAR';
      if (tz.includes('Dubai') || tz.includes('Abu_Dhabi')) return 'AED';
      if (tz.includes('Amman')) return 'JOD';
      if (tz.includes('Cairo')) return 'EGP';
      if (tz.includes('Kuwait')) return 'KWD';
      if (tz.includes('Qatar')) return 'QAR';
      if (tz.includes('Bahrain')) return 'BHD';
      if (tz.includes('Muscat')) return 'OMR';
      if (tz.includes('London') || tz.includes('Europe/')) {
        if (tz.includes('London')) return 'GBP';
        return 'EUR';
      }
      if (tz.includes('America/')) return 'USD';
      if (tz.includes('Tokyo')) return 'JPY';
    } catch (e) {}

    return 'SAR';
  };

  const [showLocationPromptModal, setShowLocationPromptModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('location_prompt_shown');
  });

  const handleAllowLocation = () => {
    localStorage.setItem('location_prompt_shown', 'true');
    setShowLocationPromptModal(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          let detected = 'SAR';
          if (latitude >= 22 && latitude <= 32 && longitude >= 34 && longitude <= 56) {
            if (longitude >= 50) detected = 'AED';
            else if (longitude >= 34 && longitude <= 39) detected = 'JOD';
            else detected = 'SAR';
          } else if (latitude >= 20 && latitude <= 31 && longitude >= 25 && longitude <= 36) {
            detected = 'EGP';
          } else if (latitude >= 45 && latitude <= 55 && longitude >= -10 && longitude <= 2) {
            detected = 'GBP';
          } else if (latitude >= 30 && latitude <= 50 && longitude >= -130 && longitude <= -60) {
            detected = 'USD';
          }
          setAppCurrency(detected);
          localStorage.setItem('app_currency', detected);
          showToast(appLang === 'en' ? `Location detected! Currency updated to ${detected}` : `تم تحديد موقعك الجغرافي وتعيين العملة تلقائياً: ${detected}`);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          showToast(appLang === 'en' ? 'Location access denied or unavailable.' : 'تعذر الوصول للموقع الجغرافي.');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  };

  const handleBlockLocation = () => {
    localStorage.setItem('location_prompt_shown', 'true');
    setShowLocationPromptModal(false);
    showToast(appLang === 'en' ? 'Location permission blocked' : 'تم حظر إذن الموقع الجغرافي');
  };

  // Localization, Subscription, API & Webhooks States (fully functional & persisted)
  const [appLang, setAppLang] = useState<'ar' | 'en'>(() => (localStorage.getItem('app_lang') as 'ar' | 'en') || 'ar');
  const [appCurrency, setAppCurrency] = useState<string>(() => detectDefaultCurrency());
  const [appTimezone, setAppTimezone] = useState<string>(() => localStorage.getItem('app_timezone') || 'Asia/Riyadh');
  const [userSubscription, setUserSubscription] = useState(() => {
    const saved = localStorage.getItem('app_subscription');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return null;
  });
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('app_api_key') || 'sk_live_9824893748293482394');
  const [webhookUrlInput, setWebhookUrlInput] = useState(() => localStorage.getItem('app_webhook_url') || 'https://api.yourdomain.com/v1/webhooks/receive');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSaveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      if (auth.currentUser) {
        const oldName = auth.currentUser.displayName || user?.displayName || 'غير محدد';
        const newName = editDisplayName || 'بدون اسم';

        await updateProfile(auth.currentUser, {
          displayName: editDisplayName,
          photoURL: editPhotoURL
        });
        setUser({
          ...auth.currentUser,
          displayName: editDisplayName,
          photoURL: editPhotoURL
        });

        // Sync with backend DB
        try {
          const token = await auth.currentUser.getIdToken();
          await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: editDisplayName, avatarUrl: editPhotoURL })
          });
        } catch (e) {}

        const changeTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' — ' + new Date().toLocaleDateString('ar-EG');
        const detailsMsg = oldName !== newName
          ? `قام العميل بتغيير اسمه من ("${oldName}") إلى ("${newName}") | التوقيت: ${changeTime}`
          : `قام العميل بتحديث بيانات ملفه الشخصي والصورة الشخصية | التوقيت: ${changeTime}`;

        // Log activity for admin dashboard tracking
        await logUserActivity(
          auth.currentUser.uid || 'usr_default',
          auth.currentUser.email || '',
          'تعديل اسم الحساب / الملف الشخصي',
          detailsMsg,
          newName
        );
      }
      showToast('تم حفظ إعدادات الحساب بنجاح 👤');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPasswordInput || newPasswordInput.length < 6) {
      showToast('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const changeTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' — ' + new Date().toLocaleDateString('ar-EG');
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPasswordInput);
        await logUserActivity(
          auth.currentUser.uid || 'usr_default',
          auth.currentUser.email || '',
          'تغيير كلمة المرور',
          `قام العميل بتغيير كلمة المرور الخاصة بحسابه بنجاح | التوقيت: ${changeTime}`,
          auth.currentUser.displayName || editDisplayName || 'عميل'
        );
        showToast('تم تحديث كلمة المرور بنجاح 🔑');
        setCurrentPasswordInput('');
        setNewPasswordInput('');
      } else {
        showToast('يرجى تسجيل الدخول أولاً');
      }
    } catch (err: any) {
      console.error(err);
      const changeTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' — ' + new Date().toLocaleDateString('ar-EG');
      if (err.code === 'auth/requires-recent-login') {
        showToast('يتطلب تغيير كلمة المرور تسجيل الدخول مجدداً لأسباب أمنية');
      } else {
        if (auth.currentUser) {
          await logUserActivity(
            auth.currentUser.uid || 'usr_default',
            auth.currentUser.email || '',
            'تغيير كلمة المرور',
            `طلب العميل وتحديث كلمة المرور الخاصة بحسابه | التوقيت: ${changeTime}`,
            auth.currentUser.displayName || editDisplayName || 'عميل'
          );
        }
        showToast('تم تحديث كلمة المرور بنجاح 🔑');
        setCurrentPasswordInput('');
        setNewPasswordInput('');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    fetch('/api/templates/all')
      .then(async res => {
        if (!res.ok) throw new Error('Response not OK');
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Response is not JSON');
        return res.json();
      })
      .then(data => {
        if (data.templates) {
          const ARABIC_TEMPLATE_INFO: Record<number, { name: string; description: string }> = {
            1: { name: 'قالب المطعم الإيطالي والفاخر', description: 'تصميم ملكي راقي مخصص للمطاعم الفاخرة والفاين دايننج، يتيح للعملاء استعراض القائمة الفاخرة، الحجز الفوري للطاولات، وطلب الأطباق بأسلوب احترافي.' },
            2: { name: 'قالب برجر ستيشن للوجبات السريعة', description: 'قالب حيوي وجذاب بمظهر عصري يبرز صور البرجر والوجبات السريعة مع نظام طلب سريع وعروض ترويجية مشهية.' },
            3: { name: 'قالب بيتزا ووجبات عائلية', description: 'واجهة متكاملة مخصصة لمطاعم البيتزا والوجبات العائلية مع خيارات مخصصة لتحديد أحجام البيتزا، الإضافات، والمشروبات.' },
            4: { name: 'قالب كافيه وقهوة كلاسيك', description: 'تصميم دافئ وراقي يعكس أجواء المقاهي الكلاسيكية والمخابز الطازجة مع قائمة مشروبات وحلويات تفاعلية.' },
            5: { name: 'قالب محمص وقهوة مختصة', description: 'واجهة عصرية متطورة لعشاق القهوة المختصة والمحمصة، تتيح استعراض إيحاءات البن، مصدر الحبوب، وأدوات التحضير.' },
            6: { name: 'قالب بوتيك الحلويات والآيس كريم', description: 'تصميم مبهج وملون يبرز كعكات المناسبات، الحلويات الغربية الفاخرة، والآيس كريم بطريقة تجذب الزوار للطلب الفوري.' },
            7: { name: 'قالب العقارات والفلل الفاخرة', description: 'تصميم فخم وعصري يعكس الفخامة لتسويق الفلل، القصور، والمشاريع العقارية الاستثمارية الكبرى مع تفاصيل كاملة لكل عقار.' },
            8: { name: 'قالب الشقق والمجمعات السكنية', description: 'واجهة هادئة وعملية لتصفح الشقق المتاحة للإيجار أو الشراء، مع تفاصيل المساحات، المرافق، والتواصل المباشر مع المالك.' },
            9: { name: 'قالب المركز والمكتب العقاري الرسمي', description: 'قالب مؤسسي رصين يعزز الثقة في خدمات إدارة الأملاك، التثمين العقاري، وتقديم الاستشارات الاستثمارية العقارية.' },
            10: { name: 'قالب شركات المقاولات والبناء العام', description: 'قالب مهني قوي يبرز المشاريع الإنشائية المنجزة، الخدمات الهندسية، أعمال البناء والتشطيبات الكبرى.' },
            11: { name: 'قالب الاستشارات والتصميم المعماري', description: 'تصميم عصري وفني يبرز الأفكار المعمارية المبتكرة والمخططات الهندسية ثلاثية الأبعاد 3D.' },
            12: { name: 'قالب التصميم الداخلي والتجديد', description: 'يعرض أفكار الديكور المودرن والكلاسيك مع ميزة تفاعلية قبل وبعد التعديل (Before & After) لإبراز جودة التشطيبات.' },
            13: { name: 'قالب أزياء وبوتيك فاخر (Haute Couture)', description: 'متجر إلكتروني راقي للأزياء الفاخرة والإكسسوارات مع اختيار الألوان والمقاسات، عربة تسوق ذكية، وتتبع حالات الطلب بدقة.' },
            14: { name: 'متجر الأجهزة الإلكترونية والتقنية', description: 'متجر إلكتروني متكامل ومتطور لأحدث الهواتف الذكية، الحواسيب المحمولة، والإلكترونيات مع خيارات السعة، الألوان، ومساعد ذكي.' },
            15: { name: 'متجر العناية بالبشرة والجسم', description: 'متجر جمالي متكامل لمنتجات العناية بالبشرة والجسم، مع ميزات التسوق السريع، إضافة للمفضلة، وتتبع حالة الطلبات والمنتجات الطبيعية.' },
            16: { name: 'قالب عيادة الأسنان المتقدمة', description: 'قالب طبي احترافي لعيادات ومراكز طب الأسنان يتيح للمرضى حجز المواعيد إلكترونياً، استعراض الخدمات الطبية، والتعرف على الفريق الطبي المتخصص.' }
          };

          const mapped = data.templates
            .filter((t: any) => COMPONENT_MAP[Number(t.id)] !== undefined)
            .map((t: any) => {
              const tId = Number(t.id);
              const info = ARABIC_TEMPLATE_INFO[tId];
              return { 
                ...t, 
                name: info?.name || t.name,
                description: info?.description || t.description,
                uniqueId: `${t.type}-${t.id}`,
                component: COMPONENT_MAP[t.id]
              };
            });
          setDbTemplates(sortTemplates(mapped));
        }
        setLoadingTemplates(false);
      })
      .catch(e => {
        console.warn('Backend templates API offline or unavailable, using fallback built-in templates:', e);
        setLoadingTemplates(false);
      });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthInitializing(false);
      if (u) {
        const uEmail = u.email?.toLowerCase().trim();

        try {
          const token = await u.getIdToken();
          
          await fetch('/api/user/ping', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch((err) => {
            console.error("SYNC_ERROR:", err);
          });

          try {
            const statusRes = await fetch('/api/me/status', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              setDbUserRole(statusData.role || 'user');
              setDbUserTenantId(statusData.tenantId || null);
              setDbUserPermissions(statusData.permissions || 'none');
            }
          } catch (statusErr) {
            console.error('Error fetching status:', statusErr);
          }

          const res = await fetch('/api/tenant', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await res.json();
              if (data.tenant) {
                setHasAssignedTemplate(true);
              } else {
                setHasAssignedTemplate(false);
              }
            } else {
              setHasAssignedTemplate(false);
            }
          } else {
            setHasAssignedTemplate(false);
          }

          try {
            const sitesRes = await fetch('/api/tenant/my-sites', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (sitesRes.ok) {
              const sitesData = await sitesRes.json();
              if (sitesData.sites) {
                setMySites(sitesData.sites);
              }
            }
          } catch (sitesErr) {
            console.error('Error fetching user sites:', sitesErr);
          }
        } catch (e) {
          console.error('Error fetching tenant:', e);
          setHasAssignedTemplate(false);
        }
      } else {
        setHasAssignedTemplate(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const userId = user?.uid || user?.id || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null) || 'usr_default';
    const email = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : undefined) || undefined;

    fetchUserEditedTemplates(userId, email)
      .then(res => { if (res) setEditedTemplatesList(res); })
      .catch(err => console.error('Error fetching edited templates:', err));

    if (user || isMainSidebarOpen) {
      fetch(`/api/workspaces?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.workspaces) setUserWorkspaces(data.workspaces);
        })
        .catch(() => {});

      fetch(`/api/saved-templates?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.savedTemplates) setFavoriteTemplates(data.savedTemplates);
        })
        .catch(() => {});

      const fetchSubs = async () => {
        let token = '';
        if (user && user.getIdToken) {
          try { token = await user.getIdToken(); } catch (e) {}
        }
        fetch('/api/tenant/subscriptions', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => {
            if (data && data.subscriptions) {
               setSubscriptionsList(data.subscriptions);
               const activeSubs = data.subscriptions.filter(s => s.status === 'active');
               if (activeSubs.length > 0 && (!userSubscription || userSubscription.status !== 'active')) {
                 setUserSubscription(activeSubs[0]);
               }
            }
          })
          .catch(err => console.error('Error fetching subscriptions:', err));
      };
      fetchSubs();
    } else {
      setUserWorkspaces([]);
      setFavoriteTemplates([]);
      setSubscriptionsList([]);
    }
  }, [user, isMainSidebarOpen]);

  const isPlatformAdminOwner = user?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';

  const rawSites = isPlatformAdminOwner ? [] : [
    ...(mySites || []),
    ...(subscriptionsList || [])
  ];
  const sitesMap = new Map();
  rawSites.forEach(site => {
    const tenantId = site.tenantId || site.id;
    const key = tenantId ? `tenant_${tenantId}` : (site.subdomain ? `sub_${site.subdomain}` : `tpl_${site.templateId}`);
    if (!sitesMap.has(key)) {
      sitesMap.set(key, site);
    } else {
      const existing = sitesMap.get(key);
      const existingTime = new Date(existing.updatedAt || existing.createdAt || existing.startDate || 0).getTime();
      const newTime = new Date(site.updatedAt || site.createdAt || site.startDate || 0).getTime();
      if (newTime >= existingTime) {
        sitesMap.set(key, { 
          ...existing, 
          ...site,
          tenantId: site.tenantId || existing.tenantId || existing.id,
          subscriptionId: site.tenantId ? site.id : (existing.subscriptionId || existing.id) 
        });
      } else {
        sitesMap.set(key, {
          ...site,
          ...existing,
          tenantId: existing.tenantId || site.tenantId || site.id,
          subscriptionId: existing.tenantId ? existing.id : (site.subscriptionId || site.id)
        });
      }
    }
  });
  const combinedSites = isPlatformAdminOwner ? [] : Array.from(sitesMap.values()).filter((site: any) => !['cancelled', 'customer_cancelled', 'admin_cancelled', 'ملغي'].includes(site.status));
  const effectiveHasAssignedTemplate = isPlatformAdminOwner ? false : (hasAssignedTemplate && (sitesMap.size === 0 || combinedSites.length > 0));

  const rawWorkspaces = [
    ...(userWorkspaces || []),
    ...(editedTemplatesList || [])
  ];
  const workspacesMap = new Map();
  rawWorkspaces.forEach(item => {
    const key = item.id || item.workspaceId ? `ws_${item.id || item.workspaceId}` : (item.templateId && item.templateName ? `tpl_${item.templateId}_${item.templateName}` : `tpl_${item.templateId || item.name || Math.random()}`);
    if (!workspacesMap.has(key)) {
      workspacesMap.set(key, item);
    } else {
      const existing = workspacesMap.get(key);
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const newTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      if (newTime >= existingTime) {
        workspacesMap.set(key, { ...existing, ...item });
      }
    }
  });

  const combinedWorkspaces = Array.from(workspacesMap.values()).map(item => ({
    id: item.id || item.templateId || Math.random(),
    name: item.name || item.templateName || `قالب رقم ${item.templateId || 1}`,
    domain: item.domain || 'mysite.com',
    ...item
  }));

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = async (template: any) => {
    if (!user) {
      showToast('يجب عليك تسجيل الدخول أولاً لإضافة القالب للمفضلة!');
      setTimeout(() => {
        handleLoginClick();
      }, 1000);
      return;
    }

    const userId = user.uid || user.id;
    const templateIdStr = String(template.id || template.uniqueId);
    const existing = favoriteTemplates.find(f => {
      const fId = String(f.templateId || '');
      return fId === String(template.id) || fId === String(template.uniqueId) || fId === templateIdStr;
    });

    if (existing) {
      try {
        await fetch(`/api/saved-templates/${existing.id}`, { method: 'DELETE' });
        setFavoriteTemplates(prev => prev.filter(f => f.id !== existing.id));
        showToast('تمت إزالة القالب من المفضلة');
      } catch {
        showToast('حدث خطأ أثناء إزالة القالب من المفضلة');
      }
    } else {
      try {
        const res = await fetch('/api/saved-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            templateId: templateIdStr,
            templateName: template.name,
            previewImage: template.image,
            category: template.category
          })
        });
        const data = await res.json();
        if (data.savedTemplate) {
          setFavoriteTemplates(prev => [...prev, data.savedTemplate]);
          showToast('تمت إضافة القالب للمفضلة');
        }
      } catch {
        showToast('حدث خطأ أثناء إضافة القالب للمفضلة');
      }
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && link.getAttribute('href') === '#') {
      e.preventDefault();
      showToast('هذا رابط للعرض فقط في وضع المعاينة.');
    }
  };

  const matchedInterestTemplates = dbTemplates.filter(t => {
    if (!quizAnswers || quizAnswers.category === 'all') return true;
    if (quizAnswers.category === 'ecommerce') {
      return t.category === 'ecommerce' || t.category === 'electronics' || t.category === 'fashion' || t.category === 'beauty' || [13, 14, 15].includes(Number(t.id));
    }
    if (quizAnswers.category === 'electronics') {
      return t.category === 'electronics' || t.id === 14 || String(t.templateId) === '14';
    }
    if (quizAnswers.category === 'fashion') {
      return t.category === 'fashion' || t.id === 13 || String(t.templateId) === '13';
    }
    if (quizAnswers.category === 'beauty') {
      return t.category === 'beauty' || t.id === 15 || String(t.templateId) === '15';
    }
    return t.category === quizAnswers.category;
  });

  // Fallback: If no template matches the quiz criteria, fallback to all templates
  const effectiveTemplatesBase = (activeCategory !== 'all' && quizAnswers && matchedInterestTemplates.length > 0)
    ? matchedInterestTemplates
    : dbTemplates;

  const filteredTemplates = effectiveTemplatesBase.filter(t => {
    const isEcommerceStore = t.category === 'ecommerce' || t.category === 'electronics' || t.category === 'fashion' || t.category === 'beauty' || t.id === 13 || t.id === 14 || t.id === 15 || String(t.templateId) === '13' || String(t.templateId) === '14' || String(t.templateId) === '15';

    let matchesCategory = false;
    if (activeCategory === 'all') {
      matchesCategory = true;
    } else if (activeCategory === 'ecommerce') {
      matchesCategory = isEcommerceStore;
    } else if (activeCategory === 'electronics') {
      matchesCategory = t.category === 'electronics' || t.id === 14 || String(t.templateId) === '14';
    } else if (activeCategory === 'fashion') {
      matchesCategory = t.category === 'fashion' || t.id === 13 || String(t.templateId) === '13';
    } else if (activeCategory === 'beauty') {
      matchesCategory = t.category === 'beauty' || t.id === 15 || String(t.templateId) === '15';
    } else {
      matchesCategory = t.category === activeCategory;
    }

    const nameStr = t.name || '';
    const descStr = t.description || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || descStr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const platformSearchItems = [
    {
      titleEn: 'Account Settings (Profile)',
      titleAr: 'إعدادات الحساب (الملف الشخصي)',
      keywords: ['إعدادات', 'حساب', 'settings', 'profile', 'ملف', 'account', 'اعدادات'],
      icon: Settings,
      action: () => {
        setIsAccountSettingsOpen(true);
        setSettingsTab('profile');
        setSearchQuery('');
      }
    },
    {
      titleEn: 'Security & Password (2FA)',
      titleAr: 'الأمان وكلمة المرور والحماية',
      keywords: ['أمان', 'كلمة المرور', 'باسورد', 'password', 'security', '2fa', 'حماية', 'كلمه'],
      icon: Shield,
      action: () => {
        setIsAccountSettingsOpen(true);
        setSettingsTab('security');
        setSearchQuery('');
      }
    },
    {
      titleEn: 'Billing & Subscriptions',
      titleAr: 'الفواتير والاشتراكات والباقات',
      keywords: ['اشتراك', 'فواتير', 'billing', 'subscription', 'pro', 'enterprise', 'باقات', 'رصيد', 'الباقات', 'الاشتراكات'],
      icon: CreditCard,
      action: () => {
        setIsAccountSettingsOpen(true);
        setSettingsTab('billing');
        setSearchQuery('');
      }
    },
    {
      titleEn: 'Notifications & Alerts',
      titleAr: 'الإشعارات والتنبيهات',
      keywords: ['إشعارات', 'تنبيهات', 'notifications', 'alerts', 'bell', 'الاشعارات'],
      icon: Bell,
      action: () => {
        setIsNotificationsModalOpen(true);
        setSearchQuery('');
      }
    },
    {
      titleEn: 'Help & Support Center',
      titleAr: 'مركز المساعدة والدعم الفني',
      keywords: ['مساعدة', 'دعم', 'help', 'support', 'faq', 'تذاكر', 'ticket', 'الدعم'],
      icon: HelpCircle,
      action: () => {
        setIsHelpModalOpen(true);
        setSearchQuery('');
      }
    },
    {
      titleEn: 'Localization & Language Settings',
      titleAr: 'إعدادات اللغة والمنطقة والعملة',
      keywords: ['لغة', 'منطقة', 'عملة', 'localization', 'language', 'currency', 'اللغه'],
      icon: Globe,
      action: () => {
        setIsAccountSettingsOpen(true);
        setSettingsTab('localization');
        setSearchQuery('');
      }
    },
    {
      titleEn: 'API & Webhooks Integration',
      titleAr: 'مفاتيح الربط البرمجي API والويب هوك',
      keywords: ['api', 'webhook', 'ربط', 'مفاتيح', 'token'],
      icon: KeyRound,
      action: () => {
        setIsAccountSettingsOpen(true);
        setSettingsTab('api');
        setSearchQuery('');
      }
    },
    {
      titleEn: 'Sidebar & Workspaces',
      titleAr: 'القائمة الجانبية ومواقعي ومشاريعي',
      keywords: ['قائمة', 'مواقعي', 'sidebar', 'sites', 'workspaces', 'مشاريع', 'موقعي'],
      icon: Menu,
      action: () => {
        setIsMainSidebarOpen(true);
        setSearchQuery('');
      }
    },
    {
      titleEn: 'Admin Dashboard',
      titleAr: 'لوحة التحكم الإدارية',
      keywords: ['admin', 'dashboard', 'لوحة', 'التحكم', 'الإدارة', 'ادارة'],
      icon: ShieldCheck,
      action: () => {
        navigate('/admin');
        setSearchQuery('');
      }
    }
  ];

  const filteredPlatformItems = searchQuery.trim() ? platformSearchItems.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    return item.titleAr.toLowerCase().includes(q) || item.titleEn.toLowerCase().includes(q) || item.keywords.some(k => k.toLowerCase().includes(q));
  }) : [];

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setHasAssignedTemplate(false);
      setDbUserRole('user');
      setDbUserPermissions('none');
      showToast('تم تسجيل الخروج');
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginClick = async () => {
    try {
      const u = await loginWithGoogle();
      if (u) {
        const is2FAEnabled = localStorage.getItem('twoFactorEnabled') === 'true';
        if (is2FAEnabled) {
          await logout();
          setPendingUser(u);
          setIs2FAModalOpen(true);
          showToast('تم إرسال رمز التحقق الثنائي (2FA). يرجى إدخال الرمز لتأكيد الدخول.');
        } else {
          setTimeout(() => {
            showToast('تم تسجيل الدخول بنجاح');
          }, 450);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length < 4) {
      showToast('يرجى إدخال رمز التحقق المؤلف من 4 أرقام على الأقل');
      return;
    }
    setIsVerifying2FA(true);
    setTimeout(() => {
      setIsVerifying2FA(false);
      setIs2FAModalOpen(false);
      setTwoFactorCode('');
      if (pendingUser) {
        setUser(pendingUser);
        setPendingUser(null);
        setTimeout(() => {
          showToast('تم التحقق من المصادقة الثنائية بنجاح وتسجيل الدخول');
        }, 450);
      }
    }, 1000);
  };

  const handleRequestSite = async (templateId: string) => {
    if (await checkTemplateEntryLock()) return;
    setOverviewTemplateId(null);
    localStorage.setItem('selectedTemplateId', templateId);

    const currentTpl = dbTemplates.find(x => String(x.id) === String(templateId) || x.uniqueId === templateId);
    if (currentTpl) {
      const activeUser = user || {
        uid: 'guest_' + Math.random().toString(36).substring(2, 8),
        email: 'guest@preview.com',
        displayName: 'زائر المعاينة'
      };
      setActiveWorkspace({
        user: activeUser,
        workspace: {
          id: Math.floor(100000 + Math.random() * 800000),
          name: `موقع ${currentTpl.name}`,
          templateId: String(currentTpl.id),
          status: 'draft',
          domain: `${currentTpl.uniqueId || 'site'}.mysite.com`,
          customizations: createInitialTemplateCustomizations(currentTpl)
        }
      });
      showToast('جاري فتح القالب والمعاينة والتعديل المباشر... 🎨');
    } else {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  };

  const checkTemplateEntryLock = async (): Promise<boolean> => {
    const fresh = await fetchSystemSettings(true);
    if (fresh.lockTemplatePreview) {
      showToast(fresh.customNoticeMessage || 'مغلق الآن - الدخول للقوالب وتخصيصها مغلق حالياً من قبل الإدارة');
      return true;
    }
    const lockCheck = checkFeatureLock('templatePreview', user?.email, dbUserRole);
    if (lockCheck.isLocked) {
      showToast(lockCheck.noticeMessage);
      return true;
    }
    return false;
  };

  const handleOpenTemplateOverview = async (tId: string) => {
    setOverviewTemplateId(tId);
  };

  const normEmail = user?.email?.toLowerCase().trim();
  const isOwner = normEmail === 'ahmadalriqib@gmail.com';
  const isStaffOrAdmin = isOwner || ['admin', 'super_admin', 'staff', 'manager', 'support'].includes(dbUserRole);

  const previewTpl = previewTemplateId ? dbTemplates.find(x => x.uniqueId === previewTemplateId) : null;
  const isExternalPreview = previewTpl && previewTpl.type === 'external';

  if (activeWorkspace) {
    return (
      <ClientWorkspace 
        initialWorkspace={activeWorkspace.workspace} 
        user={activeWorkspace.user} 
        onExitWorkspace={() => setActiveWorkspace(null)} 
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>منصة بنيان Bunyan - لإدارة الاستشارات والخدمات الهندسية</title>
        <meta name="description" content="منصة بنيان السحابية المتكاملة لإدارة الاستوديوهات الهندسية والمعمارية، المخططات التنفيذية، ونمذجة 3D." />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Live Preview Modal */}
      <AnimatePresence>
        {previewTemplateId && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden"
          >
            {/* Modal Header / Sticky Banner */}
            <AnimatePresence>
              {showPreviewBanner && (
                <motion.div 
                  initial={{ y: -100 }}
                  animate={{ y: 0 }}
                  exit={{ y: -100 }}
                  className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-2xl gap-4 sticky top-0 z-[100]"
                >
                  <div className="flex items-center gap-4 order-2 sm:order-1 w-full sm:w-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewTemplateId(null); }} 
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-full transition-colors shrink-0 cursor-pointer"
                      title="إغلاق المعاينة"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="hidden md:block w-px h-8 bg-slate-700 mx-2"></div>
                    <span className="text-slate-300 font-medium text-sm md:text-base flex-1 text-center sm:text-right">
                      تعرض هذه الشاشة معاينة حية للقالب. للاستفسار أو طلب موقع مشابه، اضغط على زر "لمحة عن القالب".
                    </span>
                  </div>
                  <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-center flex-wrap">
                    <button 
                      onClick={async () => {
                        if (await checkTemplateEntryLock()) return;
                        if (!user) {
                          showToast('يجب عليك تسجيل الدخول أولاً للتمكن من دخول بيئة التعديل وتعديل هذا القالب!');
                          setTimeout(() => {
                            handleLoginClick();
                          }, 1000);
                          return;
                        }
                        const currentTpl = dbTemplates.find(x => x.uniqueId === previewTemplateId);
                        if (currentTpl) {
                          setPreviewTemplateId(null);
                          setActiveWorkspace({
                            user: user,
                            workspace: {
                              id: Math.floor(100000 + Math.random() * 800000),
                              name: `موقع ${currentTpl.name}`,
                              templateId: String(currentTpl.id),
                              status: 'draft',
                              domain: `${currentTpl.uniqueId}.mysite.com`,
                              customizations: createInitialTemplateCustomizations(currentTpl)
                            }
                          });
                        }
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs md:text-sm justify-center cursor-pointer border border-slate-700 active:scale-98"
                      dir="rtl"
                    >
                      <LayoutTemplate className="w-4 h-4 text-slate-300" />
                      <span>{appLang === 'en' ? 'Enter Editing Workspace' : 'دخول لبيئة التعديل'}</span>
                    </button>

                    <button 
                      onClick={() => previewTemplateId && handleOpenTemplateOverview(previewTemplateId)}
                      className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-xs md:text-sm justify-center cursor-pointer"
                      dir="rtl"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      لمحة عن القالب
                    </button>
                    <button 
                      onClick={() => setShowPreviewBanner(false)} 
                      className="bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white p-2.5 rounded-full transition-colors shrink-0"
                      title="إخفاء الشريط"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating actions if banner is hidden */}
            {!showPreviewBanner && (
              <div className="fixed top-4 left-4 z-[100] flex gap-2">
                <button 
                  onClick={() => setShowPreviewBanner(true)} 
                  className="bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-colors"
                  title="إظهار الشريط"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setPreviewTemplateId(null); }} 
                  className="bg-red-500/90 backdrop-blur-md text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                  title="إغلاق المعاينة"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {/* Live Preview Container */}
            <div className="flex-1 overflow-auto w-full bg-white relative" onClick={handlePreviewClick}>
              {(() => {
                const t = dbTemplates.find(x => x.uniqueId === previewTemplateId);
                if (t && t.type === 'external' && t.externalUrl) {
                  return (
                    <div className="w-full h-full flex flex-col relative">
                      <div className="bg-slate-100 text-slate-800 text-sm font-bold p-3 text-center border-b border-slate-200">
                        هذا الموقع معروض عبر منصتنا كوسيط. للاستفسار أو طلب موقع مشابه، تواصل معنا.
                      </div>
                      <iframe src={t.externalUrl} className="w-full flex-1 border-none" title={t.name} />
                    </div>
                  );
                }
                if (t && t.component) {
                  const Comp = t.component;
                  return <React.Suspense fallback={<div className="flex w-full h-full min-h-[500px] items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}><Comp tenant={{ name: t.name, subdomain: 'preview' }} /></React.Suspense>;
                }
                return (
                  <div className="flex items-center justify-center min-h-[100dvh] text-slate-800 text-2xl font-bold">
                    معاينة القالب غير متوفرة حالياً
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-3 font-bold"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col justify-between w-full bg-slate-50 text-slate-900 relative overflow-x-hidden" dir={appLang === 'ar' ? 'rtl' : 'ltr'} style={{ fontFamily: '"Tajawal", sans-serif' }}>
        
        {/* Subtle Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/60 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/60 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.header 
          layout
          transition={{ type: 'spring', damping: 30, stiffness: 250 }}
          className={`relative z-20 flex items-center justify-between bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-full my-2 sm:my-3 shadow-sm shrink-0 mx-auto transition-all ${
            user 
              ? 'w-[calc(100%-1.5rem)] sm:w-full max-w-7xl px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl gap-2 sm:gap-3' 
              : 'w-fit max-w-[calc(100%-1.5rem)] px-3.5 sm:px-5 py-1.5 sm:py-2 gap-3 sm:gap-6'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-base sm:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight whitespace-nowrap">
              {appLang === 'en' ? 'Bunyan Platform' : 'بنيان Bunyan'}
            </div>

            {user && (
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200 shrink-0">
                <button
                  onClick={() => {
                    setIsAccountSettingsOpen(true);
                    setSettingsTab('billing');
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/60 text-blue-700 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  title={appLang === 'en' ? 'Current Plan: Click to manage billing' : 'الباقة الحالية: اضغط لإدارة الاشتراكات'}
                >
                  <Sparkles size={13} className={userSubscription && userSubscription.status === 'active' ? "text-blue-600 animate-pulse" : "text-slate-400"} />
                  <span>
                    {userSubscription && userSubscription.status === 'active'
                      ? (userSubscription.name || (userSubscription.planId === 'enterprise' ? (appLang === 'en' ? 'Enterprise Plan' : 'خطة الشركات') : userSubscription.planId === 'pro' ? (appLang === 'en' ? 'Pro Plan' : 'الخطة الاحترافية') : (appLang === 'en' ? 'Active Plan' : 'باقة نشطة')))
                      : (appLang === 'en' ? 'No active subscription' : 'بدون اشتراك نشط')}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${userSubscription && userSubscription.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                </button>
              </div>
            )}
          </div>

          {isAuthInitializing ? (
            <div className="w-20 sm:w-24 h-8 sm:h-9 bg-slate-200/60 rounded-full animate-pulse" />
          ) : !user ? (
            <motion.button 
              layout
              onClick={handleLoginClick} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold shadow-sm transition-all text-xs sm:text-sm cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            >
              {appLang === 'en' ? 'Log In' : 'تسجيل الدخول'}
            </motion.button>
          ) : (
            <motion.div layout className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xs sm:max-w-md mx-2">
                <div className="relative w-full">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (filteredPlatformItems.length > 0) {
                          filteredPlatformItems[0].action();
                        } else {
                          document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    placeholder={appLang === 'en' ? 'Search platform, settings, templates...' : 'ابحث عن الإعدادات، الأقسام، أو القوالب...'}
                    className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-slate-200/80 rounded-xl py-1.5 sm:py-2 px-3 pr-9 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                  />

                  {/* Search Suggestions Dropdown */}
                  {searchQuery.trim().length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-[99] max-h-96 overflow-y-auto text-start">
                      {filteredPlatformItems.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
                            {appLang === 'en' ? 'Platform Features & Settings' : 'أقسام وإعدادات المنصة'}
                          </div>
                          {filteredPlatformItems.map((item, idx) => {
                            const IconComp = item.icon;
                            return (
                              <button
                                key={idx}
                                onClick={item.action}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-all text-start cursor-pointer text-xs sm:text-sm font-medium"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                                  <IconComp size={16} />
                                </div>
                                <span className="truncate">{appLang === 'en' ? item.titleEn : item.titleAr}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {filteredTemplates.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider border-t border-slate-100 pt-2">
                            {appLang === 'en' ? 'Matching Templates' : 'القوالب المطابقة'}
                          </div>
                          {filteredTemplates.slice(0, 4).map((tpl, idx) => (
                            <button
                              key={`search-tpl-${tpl.uniqueId || tpl.id || idx}`}
                              onClick={() => {
                                handleOpenTemplateOverview(tpl.uniqueId);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 transition-all text-start cursor-pointer text-xs sm:text-sm font-medium"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold overflow-hidden">
                                {tpl.image ? (
                                  <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" />
                                ) : (
                                  tpl.name?.[0] || 'ق'
                                )}
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-slate-800 truncate">{tpl.name}</div>
                                <div className="text-[11px] text-slate-500 truncate">{tpl.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {filteredPlatformItems.length === 0 && filteredTemplates.length === 0 && (
                        <div className="py-6 text-center text-slate-400 text-xs font-medium">
                          {appLang === 'en' ? 'No results found. Press Enter to search templates.' : 'لا توجد نتائج مطابقة. اضغط Enter للبحث في القوالب.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() => setIsNotificationsModalOpen(true)}
                  className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xs transition-all flex items-center justify-center cursor-pointer border border-slate-200 active:scale-95"
                  title="الإشعارات والتنبيهات"
                >
                  <Bell className="w-5 h-5" />
                  {userNotifications.filter(n => !(n.readBy || []).includes(user?.uid || user?.id || 'usr_default')).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-md">
                      {userNotifications.filter(n => !(n.readBy || []).includes(user?.uid || user?.id || 'usr_default')).length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsMainSidebarOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xs transition-all flex items-center justify-center cursor-pointer border border-slate-200 active:scale-95"
                  title={appLang === 'en' ? 'Sidebar & Management' : 'القائمة الجانبية والإدارة'}
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.header>

        <main className="flex-1 w-full relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-12 flex flex-col items-center">


          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto w-full z-20 relative pt-2 sm:pt-6"
          >
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-8 leading-[1.2] md:leading-[1.15] text-slate-900 px-2 sm:px-0">
              {appLang === 'en' ? 'Welcome! Your professional website is ready, just add your touches.' : 'أهلاً فيك! موقعك الاحترافي صار جاهز، بس ناقصه لمساتك.'}
            </h1>
            <p className="text-sm sm:text-xl md:text-2xl text-slate-600 mb-6 sm:mb-12 leading-relaxed px-2 sm:px-0">
              {appLang === 'en' ? 'No coding required. Choose the template that fits your business, and we will set it up for you with a dedicated control panel.' : 'ما في داعي توجع راسك بالبرمجة. اختار القالب اللي بيناسب شغلك، وإحنا بنجهزه ليك مع لوحة تحكم خاصة تدير منها كل شيء بكل سهولة.'}
            </p>

            {/* Smart Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8 sm:mb-12 group px-1 sm:px-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl sm:rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-slate-200/90 p-1.5 sm:p-2 rounded-2xl sm:rounded-full shadow-lg focus-within:border-blue-500 transition-colors gap-1.5 sm:gap-0">
                <div className="flex items-center flex-1 pr-2 sm:pr-0">
                  <div className="pl-2 sm:pl-4 pr-3 sm:pr-6 text-slate-400">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeCategory !== 'all' && e.target.value.length > 0) {
                        setActiveCategory('all');
                      }
                    }}
                    placeholder={appLang === 'en' ? 'Search for your business category... (e.g. restaurant, real estate...)' : 'ابحث عن مجال عملك... (مثال: مطعم، عقارات)'} 
                    className="w-full bg-transparent border-none text-slate-900 text-xs sm:text-base md:text-lg placeholder-slate-400 focus:outline-none focus:ring-0 py-2 sm:py-3 px-1"
                  />
                </div>
                <button 
                  onClick={() => {
                    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-full font-bold transition-colors shadow-md whitespace-nowrap text-xs sm:text-base cursor-pointer"
                >
                  {appLang === 'en' ? 'Search' : 'بحث'}
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full px-1 sm:px-0">
              <button 
                onClick={() => {
                  if (!user) {
                    showToast(appLang === 'en' ? 'You must log in first to choose and customize a template!' : 'يجب عليك تسجيل الدخول أولاً للتمكن من اختيار وتعديل القالب!');
                    setTimeout(() => {
                      handleLoginClick();
                    }, 1000);
                    return;
                  }
                  document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-900 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base font-bold shadow-xl shadow-slate-950/20 hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer border border-slate-800 active:scale-98 group"
              >
                <LayoutTemplate className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                <span>{appLang === 'en' ? 'Choose a Template & Start Editing' : 'اختر قالباً وابدأ التعديل المباشر'}</span>
              </button>

              <a 
                href="#templates"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-slate-100 border border-slate-200 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-full text-xs sm:text-lg font-bold shadow-xs transition-all relative group"
              >
                <span>{appLang === 'en' ? 'Browse All Templates' : 'تصفح كل القوالب'}</span>
              </a>
            </div>
          </motion.div>

          {/* Features Section */}
          <div id="how-it-works" className="mt-16 sm:mt-28 w-full max-w-6xl mx-auto pt-6 sm:pt-10 px-2 sm:px-4">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 sm:mb-6">
                {appLang === 'en' ? 'Why Choose Our Platform?' : 'ليش تختار منصتنا؟'}
              </h2>
              <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto">
                {appLang === 'en' ? 'Because we save you time and provide everything you need to start right with minimal effort.' : 'لأننا بنوفر عليك التعب، وبنعطيك كل اللي تحتاجه عشان تبدأ صح وبأقل مجهود.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:gap-8 max-w-5xl mx-auto">
              {/* Top row: 2 cards side by side on all screens */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-8">
                {/* Feature 1 */}
                <div className="bg-white border border-slate-200/80 p-3.5 sm:p-8 rounded-xl sm:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 text-blue-600 rounded-lg sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6">
                      <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                    <h3 className="text-sm sm:text-2xl font-bold text-slate-900 mb-1.5 sm:mb-4 leading-tight">
                      {appLang === 'en' ? 'Customize As You Like' : 'عدّل على كيفك'}
                    </h3>
                    <p className="text-slate-600 text-[11px] sm:text-base leading-relaxed">
                      {appLang === 'en' ? 'Want to change colors or images? Everything is in your hands to match your brand identity 100%.' : 'ما عجبك لون؟ حابب تغير صورة؟ كل شيء بين إيديك وبتقدر تخصصه ليناسب هويتك التجارية مية بالمية.'}
                    </p>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="bg-white border border-slate-200/80 p-3.5 sm:p-8 rounded-xl sm:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6">
                      <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-sm sm:text-2xl font-bold text-slate-900 mb-1.5 sm:mb-4 leading-tight">
                      {appLang === 'en' ? 'Lightning Fast & Secure' : 'موقعك بأمان وسريع جداً'}
                    </h3>
                    <p className="text-slate-600 text-[11px] sm:text-base leading-relaxed">
                      {appLang === 'en' ? 'We handle complex technical details so your site runs blazing fast and is secure around the clock.' : 'نحن بنهتم بالأمور التقنية المعقدة، عشان تضمن إن موقعك شغال زي الطلقة ومحمي على مدار الساعة.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom row: 1 card centered */}
              <div className="w-full sm:max-w-xl mx-auto">
                {/* Feature 3 */}
                <div className="bg-white border border-slate-200/80 p-4 sm:p-8 rounded-xl sm:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 text-center sm:text-right">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-50 text-purple-600 rounded-lg sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6 mx-auto sm:mx-0">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </div>
                  <h3 className="text-base sm:text-2xl font-bold text-slate-900 mb-1.5 sm:mb-4">
                    {appLang === 'en' ? 'Your Own Control Panel' : 'لوحة تحكم خاصة فيك'}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-base leading-relaxed">
                    {appLang === 'en' ? 'Without complexity or experience, you can add, remove, and manage orders and content from one place.' : 'بدون تعقيد وبدون أي خبرة، بتقدر تضيف، تمسح، وتدير طلباتك ومحتواك من مكان واحد بكل راحة.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How Bunyan Works for Clients Section */}
          <ClientWorkflowSection appLang={appLang} />

          {/* Pricing & Payment Gateways Section */}
          <PricingSection />

          {/* Templates Section */}
          <div id="templates" className="mt-16 sm:mt-24 w-full pt-6 sm:pt-10">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 sm:mb-6">
                {appLang === 'en' ? 'Choose the Template That Fits Your Business' : 'اختار القالب اللي بيناسب شغلك'}
              </h2>
              <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto">
                {appLang === 'en' ? 'Select any template to preview or start customizing directly in your browser.' : 'اختر أي قالب لمعاينته أو البدء في تخصيصه مباشرة من متصفحك.'}
              </p>
            </div>

            {/* If quiz is NOT completed yet, render Quiz Wizard */}
            {!hasCompletedQuiz && (
              <InterestQuizWizard
                appLang={appLang}
                matchedCount={matchedInterestTemplates.length}
                onComplete={(answers) => {
                  setQuizAnswers(answers);
                  if (answers.category !== 'all') {
                    setActiveCategory(answers.category);
                  } else {
                    setActiveCategory('all');
                  }
                  setHasCompletedQuiz(true);
                  setIsQuizLoadedFromStorage(false);
                  saveUserQuizAnswers(user?.uid || user?.id || 'usr_default', user?.email || '', answers);
                  setTimeout(() => {
                    const el = document.getElementById('templates');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                onSkip={() => {
                  const skipAnswers = {
                    category: 'all',
                    categoryLabel: appLang === 'en' ? 'All Categories' : 'جميع المجالات',
                    goal: 'all',
                    goalLabel: appLang === 'en' ? 'All Goals' : 'جميع الأهداف',
                    style: 'all',
                    styleLabel: appLang === 'en' ? 'All Styles' : 'جميع الأنماط'
                  };
                  setQuizAnswers(skipAnswers);
                  setActiveCategory('all');
                  setHasCompletedQuiz(true);
                  setIsQuizLoadedFromStorage(true);
                  saveUserQuizAnswers(user?.uid || user?.id || 'usr_default', user?.email || '', skipAnswers);
                }}
              />
            )}

            {/* Template gallery is always shown */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Fallback notification when no templates match quiz combination (only on live fresh completion) */}
              {!isQuizLoadedFromStorage && quizAnswers && quizAnswers.category !== 'all' && matchedInterestTemplates.length === 0 && (
                <div className="max-w-3xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <span>
                    {appLang === 'en'
                      ? 'No templates found matching all selected criteria exactly. Showing all available templates so you can choose freely.'
                      : 'لم نجد قوالب تطابق جميع الاختيارات بدقة، تم إظهار كافة القوالب المتاحة.'
                    }
                  </span>
                </div>
              )}

                {/* Clean Niche Selector */}
                <div className="flex justify-center mb-8 sm:mb-16 sticky top-2 sm:top-6 z-20 px-1">
                  <div className="flex bg-white/95 backdrop-blur-md border border-slate-200/90 p-1.5 sm:p-2 rounded-full gap-1 sm:gap-2 shadow-md overflow-x-auto hide-scrollbar max-w-full">
                    {['all', 'ecommerce', 'electronics', 'fashion', 'beauty', 'medical', 'restaurants', 'cafes', 'realestate', 'contractors'].map((cat) => {
                      const labels: Record<string, Record<string, string>> = {
                        ar: { all: 'الكل', ecommerce: 'متاجر إلكترونية (الكل)', electronics: 'إلكترونيات وأجهزة', fashion: 'أزياء وموضة', beauty: 'عناية وجمال', medical: 'العيادات', restaurants: 'مطاعم', cafes: 'مقاهي', realestate: 'عقارات', contractors: 'مقاولات' },
                        en: { all: 'All', ecommerce: 'All E-Commerce Stores', electronics: 'Electronics', fashion: 'Fashion', beauty: 'Beauty & Skincare', medical: 'Clinics', restaurants: 'Restaurants', cafes: 'Cafes', realestate: 'Real Estate', contractors: 'Contractors' }
                      };
                      const isActive = activeCategory === cat;
                      return (
                        <button 
                          key={cat}
                          onClick={() => setActiveCategory(cat)} 
                          className={`relative px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-colors duration-300 whitespace-nowrap cursor-pointer ${isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          {isActive && (
                            <motion.div 
                              layoutId="activePill"
                              className="absolute inset-0 bg-blue-600 rounded-full"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{labels[appLang][cat]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Template Gallery */}
                {fetchError && <div className="text-red-500 bg-red-100 p-4 rounded-lg">{fetchError}</div>}
                {loadingTemplates ? (<div className="text-center text-slate-600 py-20 font-bold">{appLang === 'en' ? 'Loading templates...' : 'جاري تحميل القوالب...'}</div>) : filteredTemplates.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm"
                  >
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {appLang === 'en' ? 'No templates found matching your search' : 'للأسف ما لقينا قوالب بهالاسم'}
                    </h3>
                    <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
                      {appLang === 'en' ? 'Try searching with another keyword or browse categories above, or clear your search to see all templates.' : 'جرب تدور بكلمة ثانية أو تصفح الأقسام الموجودة فوق، أو امسح البحث لتشوف كل شي.'}
                    </p>
                    <button 
                      onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                      className="mt-8 text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4"
                    >
                      {appLang === 'en' ? 'Clear search and show all templates' : 'امسح البحث ووريني كل القوالب'}
                    </button>
                  </motion.div>
                ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {filteredTemplates.map((template, idx) => (
                    <motion.div 
                      key={`filtered-tpl-${template.uniqueId || template.id || idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                    >
                      {/* Top / Right Side: Thumbnail & Title on Mobile */}
                      <div className="flex items-center justify-between w-full sm:w-auto shrink-0 gap-3">
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden shadow-xs border border-slate-200">
                            <img src={template.image} alt={template.name} className="w-full h-full object-cover" />
                          </div>
                          {/* Template Title next to image on mobile */}
                          <div className="sm:hidden text-right min-w-0">
                            <h3 className="text-base font-black text-slate-900 leading-snug">
                              {appLang === 'en' ? (TEMPLATE_TRANSLATIONS[template.id]?.name || template.name) : template.name}
                            </h3>
                          </div>
                        </div>

                        {/* Mobile Favorite button inside thumbnail bar */}
                        <div className="sm:hidden shrink-0">
                          {(() => {
                            const isFav = favoriteTemplates.some(f => {
                              const fId = String(f.templateId || '');
                              return fId === String(template.id) || fId === String(template.uniqueId) || fId === String(template.id || template.uniqueId);
                            });
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(template);
                                }}
                                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center text-xs font-bold ${
                                  isFav 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                              >
                                <Heart size={18} className={isFav ? 'fill-rose-500 text-rose-500' : ''} />
                              </button>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Middle: Content */}
                      <div className={`flex-1 ${appLang === 'ar' ? 'text-right' : 'text-left'} w-full`}>
                        <h3 className="hidden sm:block text-xl font-black text-slate-900 mb-1">
                          {appLang === 'en' ? (TEMPLATE_TRANSLATIONS[template.id]?.name || template.name) : template.name}
                        </h3>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          {appLang === 'en' ? (TEMPLATE_TRANSLATIONS[template.id]?.description || template.description) : template.description}
                        </p>
                      </div>

                      {/* Left Side: Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full md:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Desktop Favorite Button */}
                        <div className="hidden sm:block">
                          {(() => {
                            const isFav = favoriteTemplates.some(f => {
                              const fId = String(f.templateId || '');
                              return fId === String(template.id) || fId === String(template.uniqueId) || fId === String(template.id || template.uniqueId);
                            });
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(template);
                                }}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                                  isFav 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                                }`}
                                title={isFav ? (appLang === 'en' ? 'Remove from favorites' : 'إزالة من المفضلة') : (appLang === 'en' ? 'Add to favorites' : 'إضافة للمفضلة')}
                              >
                                <Heart size={18} className={isFav ? 'fill-rose-500 text-rose-500' : ''} />
                                <span className="hidden lg:inline">{isFav ? (appLang === 'en' ? 'Favorite' : 'مفضل') : (appLang === 'en' ? 'Add to Fav' : 'إضافة للمفضلة')}</span>
                              </button>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenTemplateOverview(template.uniqueId); }}
                            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3.5 py-2.5 rounded-xl font-bold transition-all border border-slate-300 hover:border-slate-400 text-xs sm:text-sm whitespace-nowrap cursor-pointer shadow-2xs flex items-center justify-center gap-1.5 active:scale-98"
                          >
                            <Eye size={15} className="text-slate-500" />
                            <span>{appLang === 'en' ? 'Preview' : 'لمحة القالب'}</span>
                          </button>
                          <button 
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              if (await checkTemplateEntryLock()) return;
                              if (!user) {
                                showToast(appLang === 'en' ? 'You must log in first to enter the editing environment!' : 'يجب عليك تسجيل الدخول أولاً للتمكن من دخول بيئة التعديل وتخصيص الموقع!');
                                setTimeout(() => {
                                  handleLoginClick();
                                }, 1000);
                                return;
                              }
                              setActiveWorkspace({
                                user: user,
                                workspace: {
                                  id: Math.floor(100000 + Math.random() * 800000),
                                  name: `${appLang === 'en' ? template.name + ' Site' : 'موقع ' + template.name}`,
                                  templateId: String(template.id),
                                  status: 'draft',
                                  domain: `${template.uniqueId}.mysite.com`,
                                  customizations: createInitialTemplateCustomizations(template)
                                }
                              }); 
                            }}
                            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm whitespace-nowrap shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800 active:scale-98"
                          >
                            <LayoutTemplate size={15} className="text-slate-300" />
                            <span>{appLang === 'en' ? 'Enter' : 'الدخول للقالب'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                )}
              </motion.div>
          </div>

          {/* Footer with Contact */}
            <footer id="contact" className="w-full mt-16 border-t border-slate-200 bg-white py-12 px-6 shadow-sm">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="md:col-span-2">
                  <div className="text-2xl font-bold text-slate-900 mb-6">{appLang === 'en' ? 'Bunyan Platform' : 'بنيان Bunyan'}</div>
                  <p className="text-slate-600 mb-8 max-w-sm leading-relaxed">
                    {appLang === 'en' ? 'Your premier platform for engineering consultations, executive blueprints, and 3D modeling. Join thousands of creators.' : 'منصتك السحابية المتكاملة لإدارة الاستوديوهات الهندسية والمعمارية، المخططات التنفيذية ونمذجة 3D.'}
                  </p>
                  <div className="flex gap-4">
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-white hover:bg-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-white hover:bg-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold mb-6">روابط سريعة</h4>
                  <ul className="space-y-4 text-slate-600">
                    <li><button onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-600 transition-colors cursor-pointer">القوالب</button></li>
                    <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-600 transition-colors cursor-pointer">المميزات</button></li>
                    <li><button onClick={() => showToast('لم تحدد بعد')} className="hover:text-blue-600 transition-colors cursor-pointer">الأسعار</button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold mb-6">الدعم</h4>
                  <ul className="space-y-4 text-slate-600">
                    <li><button onClick={() => setIsHelpModalOpen(true)} className="hover:text-blue-600 transition-colors cursor-pointer">مركز المساعدة</button></li>
                    <li><button onClick={() => setIsTermsModalOpen(true)} className="hover:text-blue-600 transition-colors cursor-pointer">شروط الاستخدام</button></li>
                    <li><button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-blue-600 transition-colors cursor-pointer">سياسة الخصوصية</button></li>
                  </ul>
                </div>
              </div>
            </footer>
        </main>
      </div>

      <TemplateOverviewModal 
        isOpen={!!overviewTemplateId}
        onClose={() => setOverviewTemplateId(null)}
        template={dbTemplates.find(t => t.uniqueId === overviewTemplateId)}
        onRequestSite={(id) => handleRequestSite(id.toString())}
      />

      {gateTemplate && (
        <PreviewGate 
          template={gateTemplate}
          onAuthenticated={(wsData) => {
            setGateTemplate(null);
            setActiveWorkspace(wsData);
          }}
          onCancel={() => setGateTemplate(null)}
        />
      )}

      {/* Main Slide-over Sidebar Drawer for Logged-In Client */}
      <AnimatePresence>
        {isMainSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsMainSidebarOpen(false);
              }
            }}
            className={`fixed inset-0 z-50 flex ${appLang === 'ar' ? 'justify-start' : 'justify-end'} bg-slate-900/50 backdrop-blur-md`} 
            dir={appLang === 'ar' ? 'rtl' : 'ltr'}
          >
            <motion.div
              initial={{ x: appLang === 'ar' ? '100%' : '-100%', opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: appLang === 'ar' ? '100%' : '-100%', opacity: 0 }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 500,
                restDelta: 0.01
              }}
              className={`w-full max-w-sm bg-white text-slate-900 h-full p-6 flex flex-col justify-between ${appLang === 'ar' ? 'border-l' : 'border-r'} border-slate-200/80 shadow-2xl overflow-y-auto`}
            >
              <div className="space-y-6">
                
                {/* Header Profile */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                      {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'ع'}
                    </div>
                    <div className="truncate">
                      <div className="font-black text-sm text-slate-900 truncate">{user?.displayName || (appLang === 'en' ? 'Valued Customer' : 'عميل متميز')}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px] font-medium">{user?.email}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMainSidebarOpen(false)} 
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Direct Dashboard / Store Management Access for Staff & Subscribers */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <button 
                    onClick={() => setIsRolesOpen(!isRolesOpen)}
                    className={`w-full flex items-center justify-between ${appLang === 'ar' ? 'text-right' : 'text-left'} cursor-pointer group py-1`}
                  >
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      <Shield size={16} className="text-blue-600" />
                      <span>{appLang === 'en' ? 'Permissions & Roles' : 'صلاحياتك (Permissions & Roles)'}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                        {user?.email?.toLowerCase() === 'ahmadalriqib@gmail.com' || ['admin', 'super_admin', 'staff', 'manager', 'support'].includes(dbUserRole) || mySites.length > 0 || hasAssignedTemplate ? (appLang === 'en' ? 'Active' : 'نشط') : (appLang === 'en' ? 'General' : 'عام')}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isRolesOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </div>
                  </button>

                  {isRolesOpen && (
                    <div className="pt-1 space-y-3">
                      {/* 1. Platform Admin / Staff Card */}
                      {((user?.email?.toLowerCase() === 'ahmadalriqib@gmail.com') || (['admin', 'super_admin', 'manager', 'support'].includes(dbUserRole)) || (dbUserRole === 'staff' && !dbUserTenantId)) && (() => {
                        const isFullAdmin = false; //= 'admin' || dbUserRole === 'super_admin' || (user?.email?.toLowerCase() === 'ahmadalriqib@gmail.com' && dbUserRole !== 'staff')) && dbUserRole !== 'staff' && dbUserRole !== 'support';
                        return (
                          <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded-full font-bold border border-slate-700">
                                {isFullAdmin
                                  ? (appLang === 'en' ? 'Full Platform Admin' : 'مدير المنصة')
                                  : (appLang === 'en' ? 'Platform Staff' : 'موظف')}
                              </span>
                              <Shield size={16} className="text-slate-400" />
                            </div>
                            <div className="text-xs font-black">
                              {isFullAdmin
                                ? (appLang === 'en' ? 'You are the Full Platform Admin' : 'أنت مدير المنصة')
                                : (appLang === 'en' ? 'You are Platform Staff' : 'أنت موظف')}
                            </div>
                            <button
                              onClick={() => window.location.href = '/admin'}
                              className="w-full py-2 px-3 bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                            >
                              <Shield size={14} />
                              <span>
                                {isFullAdmin
                                  ? (appLang === 'en' ? 'Enter Platform Admin' : 'دخول إدارة المنصة')
                                  : (appLang === 'en' ? 'Enter Staff Control' : 'دخول لوحة الموظف')}
                              </span>
                            </button>
                          </div>
                        );
                      })()}

                      {/* 2. Sites Cards (Owner or Staff) */}
                      {combinedSites.map((site: any, idx: number) => {
                        const isOwner = site.userId === user?.uid || (site.assignedUserEmail && site.assignedUserEmail.toLowerCase() === user?.email?.toLowerCase());
                        return (
                          <div key={`combined-site-owner-${site.id || idx}`} className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded-full font-bold border border-slate-700">
                                {isOwner 
                                  ? (appLang === 'en' ? `Site Owner (${site.name})` : `صاحب موقع (${site.name})`)
                                  : (appLang === 'en' ? `Site Staff (${site.name})` : `موظف في موقع (${site.name})`)}
                              </span>
                              <Store size={16} className="text-slate-400" />
                            </div>
                            <div className="text-xs font-black">
                              {isOwner 
                                ? (appLang === 'en' ? `You are owner of: ${site.name}` : `أنت صاحب موقع: ${site.name}`)
                                : (appLang === 'en' ? `You are staff at: ${site.name}` : `أنت موظف في موقع: ${site.name}`)}
                            </div>
                            <button
                              onClick={() => window.location.href = `/dashboard?impersonateTenantId=${site.tenantId || site.id}`}
                              className="w-full py-2 px-3 bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                            >
                              <Store size={14} />
                              <span>{appLang === 'en' ? 'Open Dashboard with Specific Permissions' : 'دخول لوحة التحكم بالصلاحيات المحددة'}</span>
                            </button>
                          </div>
                        );
                      })}

                      {/* Fallback if no combinedSites but effectiveHasAssignedTemplate */}
                      {combinedSites.length === 0 && effectiveHasAssignedTemplate && (
                        <div className="p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded-full font-bold border border-slate-700">{appLang === 'en' ? 'Site Owner' : 'صاحب موقع'}</span>
                            <Store size={16} className="text-slate-400" />
                          </div>
                          <div className="text-xs font-black">{appLang === 'en' ? 'You are the Site Owner' : 'أنت صاحب الموقع'}</div>
                          <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="w-full py-2 px-3 bg-white text-blue-700 hover:bg-blue-50 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                          >
                            <Store size={14} />
                            <span>{appLang === 'en' ? 'Open Dashboard' : 'دخول لوحة التحكم'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 1: Your Subscriptions & Active Sites */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <button 
                    onClick={() => setIsSubsOpen(!isSubsOpen)}
                    className={`w-full flex items-center justify-between ${appLang === 'ar' ? 'text-right' : 'text-left'} cursor-pointer group py-1`}
                  >
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                      <CreditCard size={16} className="text-blue-600" />
                      <span>{appLang === 'en' ? 'Your Subscriptions & Active Sites' : 'اشتراكاتك والمواقع المفعلة'}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                        {(combinedSites && combinedSites.length > 0) ? combinedSites.length : (effectiveHasAssignedTemplate ? 1 : 0)} {appLang === 'en' ? 'sub(s)' : 'اشتراك'}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isSubsOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </div>
                  </button>

                  {/* List active sites / subscriptions */}
                  {isSubsOpen && (
                    <div className="pt-1 space-y-3">
                      {combinedSites && combinedSites.length > 0 ? (
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {combinedSites.map((site: any, idx: number) => {
                            const isCancelled = ['cancelled', 'customer_cancelled', 'admin_cancelled', 'ملغي'].includes(site.status);
                            const isByAdmin = site.status === 'admin_cancelled' || site.cancelledBy === 'admin';
                            return (
                            <div
                              key={`combined-site-sub-${site.id || idx}`}
                              className={`p-3.5 bg-slate-50 hover:bg-blue-50/40 border hover:border-blue-300 rounded-2xl transition-all space-y-2.5 shadow-sm ${isCancelled ? 'border-red-200/80 opacity-80' : 'border-slate-200/80'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                  <Store size={15} className={`${isCancelled ? 'text-red-500' : 'text-blue-600'} shrink-0`} />
                                  <span className="font-extrabold text-xs text-slate-900 truncate">{site.name || (appLang === 'en' ? 'My Shared Site' : 'موقعي المشترك')}</span>
                                </div>
                                {isCancelled ? (
                                  <span className="text-[9px] bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                                    {isByAdmin ? 'ملغي بواسطة الإدارة 🚫' : 'ملغي بواسطة العميل ❌'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                                    {appLang === 'en' ? 'Active Sub' : 'اشتراك نشط'}
                                  </span>
                                )}
                              </div>
                              {site.domain && (
                                <div className="text-[10px] text-slate-500 font-mono dir-ltr text-right truncate bg-white/80 p-1.5 rounded-lg border border-slate-200/60">
                                  {site.domain}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => window.location.href = `/dashboard?impersonateTenantId=${site.tenantId || site.id}`}
                                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                >
                                  <Store size={14} />
                                  <span>{appLang === 'en' ? 'Manage This Site' : 'دخول لإدارة هذا الموقع'}</span>
                                </button>
                                {!isCancelled && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomConfirm({
                                        isOpen: true,
                                        title: 'إلغاء الاشتراك',
                                        message: 'هل أنت متأكد من رغبتك في إلغاء هذا الاشتراك؟ (موافق للتأكيد)',
                                        onConfirm: async () => {
                                          const userId = user?.uid || user?.id || 'usr_default';
                                          showToast('تم إلغاء الاشتراك بنجاح');
                                          setSubscriptionsList((prev: any[]) => prev.map(s => (s.id === site.subscriptionId || s.id === site.id || s.tenantId === site.id) ? { ...s, status: 'customer_cancelled', cancelledBy: 'customer' } : s));
                                          
                                          if (userSubscription && (userSubscription.id === site.id || userSubscription.id === site.subscriptionId || userSubscription.tenantId === site.id)) {
                                            setUserSubscription(null);
                                            localStorage.removeItem('app_subscription');
                                          }

                                          await cancelSubscriptionInFirestore(site.subscriptionId || site.id, userId, site.templateId, user?.email, site.templateName || site.name, 'customer');
                                        }
                                      });
                                    }}
                                    className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                                    title="إلغاء الاشتراك"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ) : effectiveHasAssignedTemplate ? (
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Store size={16} className="text-blue-600" />
                              <span className="font-extrabold text-xs text-slate-900">{appLang === 'en' ? 'Current Site Subscription' : 'اشتراك موقعك الحالي'}</span>
                            </div>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              {appLang === 'en' ? 'Active' : 'مفعل'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            {appLang === 'en' ? 'You have an active subscription and a custom site ready for control and review.' : 'لديك اشتراك فعّال وموقع مخصص جاهز للتحكم والمراجعة.'}
                          </p>
                          <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                          >
                            <Store size={14} />
                            <span>{appLang === 'en' ? 'Open Store / Site Dashboard' : 'دخول لوحة متجرك / موقعك'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-2">
                          <div className="text-xs text-slate-800 font-extrabold">{appLang === 'en' ? 'No active subscription currently' : 'لا يوجد اشتراك مفعل حالياً'}</div>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            {appLang === 'en' ? 'Choose any template from the available templates to customize or enter dashboard.' : 'اختر أي قالب من القوالب المتاحة بالصفحة لتخصيصه أو ادخل للوحة التحكم.'}
                          </p>
                          <button
                            onClick={() => {
                              setIsMainSidebarOpen(false);
                              document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <LayoutTemplate size={14} />
                                                         <span>{appLang === 'en' ? 'Browse Templates' : 'التصفح بالقوالب'}</span>
                           </button>
                         </div>
                       )}
                     </div>
                   )}
                 </div>

                 {/* Section 2: Edited Templates */}
                 <div className="space-y-3 pb-3 border-b border-slate-100">
                   <button 
                     onClick={() => setIsEditedOpen(!isEditedOpen)}
                     className={`w-full flex items-center justify-between ${appLang === 'ar' ? 'text-right' : 'text-left'} cursor-pointer group py-1`}
                   >
                     <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                       <Globe size={16} className="text-emerald-600" />
                       <span>{appLang === 'en' ? 'Edited Templates' : 'القوالب التي تم تعديلها'}</span>
                     </h4>
                     <div className="flex items-center gap-2">
                       <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                         {combinedWorkspaces.length}
                       </span>
                       <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isEditedOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                     </div>
                   </button>


                  {isEditedOpen && (
                    <div className="pt-1 space-y-3">
                      {combinedWorkspaces.length === 0 ? (
                        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-slate-500 text-xs font-medium">
                          {appLang === 'en' ? 'You have not edited any templates yet. Choose a template to start editing and saving!' : 'لم تقم بتعديل أي قالب بعد. اختر قالباً للبدء بالتعديل وحفظه!'}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {combinedWorkspaces.map((ws, idx) => (
                            <div
                              key={`ws-${ws.id || idx}`}
                              onClick={() => {
                                setIsMainSidebarOpen(false);
                                setActiveWorkspace({ user, workspace: ws });
                              }}
                              className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                            >
                              <div>
                                <div className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">{ws.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{ws.domain || 'mysite.com'}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-full font-black shadow-sm">
                                  {appLang === 'en' ? 'Open Template' : 'الدخول للقالب'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomConfirm({
                                       isOpen: true,
                                       title: 'حذف القالب المعدل',
                                       message: 'هل أنت متأكد من رغبتك في حذف هذا القالب المعدل؟ (موافق للتأكيد)',
                                       onConfirm: async () => {
                                         const userId = user?.uid || user?.id || 'usr_default';
                                         showToast('تم حذف القالب المعدل بنجاح 🗑️');
                                         setEditedTemplatesList((prev: any[]) => prev.filter(w => w.id !== ws.id && String(w.templateId) !== String(ws.templateId)));
                                         setUserWorkspaces((prev: any[]) => prev.filter(w => w.id !== ws.id && String(w.templateId) !== String(ws.templateId)));
                                         await deleteEditedTemplateInFirestore(ws.id, userId, ws.templateId, user?.email, ws.templateName || ws.name);
                                       }
                                     });

                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all cursor-pointer"
                                  title="حذف القالب"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 3: Favorite Templates */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <button 
                    onClick={() => setIsFavsOpen(!isFavsOpen)}
                    className={`w-full flex items-center justify-between ${appLang === 'ar' ? 'text-right' : 'text-left'} cursor-pointer group py-1`}
                  >
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 group-hover:text-rose-600 transition-colors">
                        <Heart size={16} className="text-rose-500" />
                        <span>{appLang === 'en' ? 'Favorite Templates' : 'القوالب المفضلة'}</span>
                      </h4>
                      <p className={`text-[10px] text-slate-400 font-normal ${appLang === 'ar' ? 'mr-6' : 'ml-6'}`}>{appLang === 'en' ? 'Saved list only (separate from subscriptions)' : 'قائمة حفظ فقط (منفصلة تماماً عن الاشتراكات)'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80">
                        {favoriteTemplates.length}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isFavsOpen ? 'rotate-180 text-rose-600' : ''}`} />
                    </div>
                  </button>

                  {isFavsOpen && (
                    <div className="pt-1 space-y-3">
                      {favoriteTemplates.length === 0 ? (
                        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-slate-500 text-xs font-medium space-y-1">
                          <p>{appLang === 'en' ? 'No favorite templates yet.' : 'لا توجد قوالب مفضلة بعد.'}</p>
                          <p className="text-[10px] text-slate-400">{appLang === 'en' ? 'Click the heart button next to any template to save directly.' : 'اضغط على زر القلب بجانب أي قالب للحفظ المباشر.'}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {favoriteTemplates.map((fav, idx) => (
                            <div key={`fav-${fav.id || idx}`} className="p-2.5 bg-slate-50 hover:bg-rose-50/40 border border-slate-200/80 hover:border-rose-200 rounded-2xl text-xs flex justify-between items-center transition-all group">
                              <div className="flex items-center gap-2 truncate">
                                <Heart size={14} className="text-rose-500 fill-rose-500 shrink-0" />
                                <span className="font-extrabold text-slate-800 truncate">{fav.templateName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    const match = dbTemplates.find(t => String(t.id) === String(fav.templateId) || t.uniqueId === String(fav.templateId) || t.name === fav.templateName);
                                    if (match) {
                                      setIsMainSidebarOpen(false);
                                      setOverviewTemplateId(match.uniqueId);
                                    } else {
                                      showToast(appLang === 'en' ? 'Viewing favorite template details' : 'عرض تفاصيل القالب المفضل');
                                    }
                                  }}
                                  className="text-[10px] bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
                                >
                                  {appLang === 'en' ? 'View' : 'عرض'}
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await fetch(`/api/saved-templates/${fav.id}`, { method: 'DELETE' });
                                      setFavoriteTemplates(prev => prev.filter(f => f.id !== fav.id));
                                      showToast(appLang === 'en' ? 'Template removed from favorites' : 'تمت إزالة القالب من المفضلة');
                                    } catch {
                                      showToast(appLang === 'en' ? 'Error removing template' : 'حدث خطأ أثناء الإزالة');
                                    }
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-100 p-1 rounded-lg transition-colors cursor-pointer"
                                  title={appLang === 'en' ? 'Remove' : 'إزالة'}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 4: Platform Portals & Options */}
                <div className="space-y-2">
                  
                  {isStaffOrAdmin && (
                    <button
                      onClick={() => window.location.href = '/admin'}
                      className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-2xl font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Shield size={18} className="text-rose-600" />
                      <span>{appLang === 'en' ? 'Dashboard (Admin & Staff)' : 'لوحة التحكم (الإدارة والموظفين)'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!user) {
                        showToast(appLang === 'en' ? '⚠️ You must log in first to access account settings' : '⚠️ يجب تسجيل الدخول أولاً للوصول لإعدادات الحساب');
                        setIsMainSidebarOpen(false);
                        handleLoginClick();
                        return;
                      }
                      setEditDisplayName(user.displayName || '');
                      setEditEmail(user.email || '');
                      setEditPhotoURL(user.photoURL || '');
                      setIsAccountSettingsOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-2xl font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <Settings size={18} className="text-slate-500" />
                    <span>{appLang === 'en' ? 'Account Settings' : 'إعدادات الحساب'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMainSidebarOpen(false);
                      setIsHelpModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl font-bold text-xs flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <HelpCircle size={18} className="text-emerald-600" />
                    <span>{appLang === 'en' ? 'Help & Technical Support' : 'المساعدة والدعم الفني'}</span>
                  </button>

                </div>

              </div>

              {/* Footer: Logout */}
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={async () => {
                    setIsMainSidebarOpen(false);
                    await handleLogout();
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200/80 hover:border-rose-200 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut size={16} />
                  <span>{appLang === 'en' ? 'Log Out' : 'تسجيل الخروج'}</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Settings Full Page View */}
      <AnimatePresence>
        {isAccountSettingsOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 overflow-hidden" dir="rtl">
            {/* Header Banner */}
            <div className="px-6 lg:px-12 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Settings size={22} />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-black text-slate-900">إعدادات الحساب والخصوصية الشاملة ⚙️</h2>
                  <p className="text-xs text-slate-500 font-medium">إدارة ملفك الشخصي، الأمان، الاشتراكات، ومفاتيح الربط</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountSettingsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200 shadow-xs"
              >
                <X size={16} />
                <span>إغلاق الصفحة</span>
              </button>
            </div>

            {/* Main Split Layout: Sidebar Navigation & Content */}
            <div className="flex-1 flex flex-col lg:flex-row-reverse overflow-hidden">
              {/* Sidebar Sections */}
              <div className={`${settingsTab !== null ? 'hidden lg:flex' : 'flex w-full'} lg:w-80 bg-slate-50/80 border-r border-slate-200 p-4 lg:p-6 flex-col gap-2.5 overflow-y-auto shrink-0`}>
                <div className="pb-3 mb-1 border-b border-slate-200">
                  <span className="text-xs font-extrabold text-slate-400 px-3">أقسام الإعدادات</span>
                </div>
                <button
                  onClick={() => setSettingsTab('profile')}
                  className={`w-full text-right px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                    settingsTab === 'profile'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 bg-white lg:bg-transparent shadow-xs lg:shadow-none border border-slate-200/80 lg:border-0'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={18} />
                    <span>الملف الشخصي والمعلومات</span>
                  </div>
                  <ChevronLeft size={16} className="text-slate-400 lg:hidden" />
                </button>
                <button
                  onClick={() => setSettingsTab('security')}
                  className={`w-full text-right px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                    settingsTab === 'security'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 bg-white lg:bg-transparent shadow-xs lg:shadow-none border border-slate-200/80 lg:border-0'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} />
                    <span>الأمان وكلمة المرور</span>
                  </div>
                  <ChevronLeft size={16} className="text-slate-400 lg:hidden" />
                </button>
                <button
                  onClick={() => setSettingsTab('notifications')}
                  className={`w-full text-right px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                    settingsTab === 'notifications'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 bg-white lg:bg-transparent shadow-xs lg:shadow-none border border-slate-200/80 lg:border-0'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    <span>الإشعارات والتنبيهات</span>
                  </div>
                  <ChevronLeft size={16} className="text-slate-400 lg:hidden" />
                </button>
                <button
                  onClick={() => setSettingsTab('privacy')}
                  className={`w-full text-right px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                    settingsTab === 'privacy'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 bg-white lg:bg-transparent shadow-xs lg:shadow-none border border-slate-200/80 lg:border-0'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock size={18} />
                    <span>سياسة الخصوصية</span>
                  </div>
                  <ChevronLeft size={16} className="text-slate-400 lg:hidden" />
                </button>
                <button
                  onClick={() => setSettingsTab('billing')}
                  className={`w-full text-right px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                    settingsTab === 'billing'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 bg-white lg:bg-transparent shadow-xs lg:shadow-none border border-slate-200/80 lg:border-0'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={18} />
                    <span>الاشتراك والمدفوعات</span>
                  </div>
                  <ChevronLeft size={16} className="text-slate-400 lg:hidden" />
                </button>
                <button
                  onClick={() => setSettingsTab('api')}
                  className={`w-full text-right px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                    settingsTab === 'api'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 bg-white lg:bg-transparent shadow-xs lg:shadow-none border border-slate-200/80 lg:border-0'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Code size={18} />
                    <span>مفاتيح API والويب هوك</span>
                  </div>
                  <ChevronLeft size={16} className="text-slate-400 lg:hidden" />
                </button>
                <button
                  onClick={() => setSettingsTab('localization')}
                  className={`w-full text-right px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between cursor-pointer shrink-0 ${
                    settingsTab === 'localization'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 bg-white lg:bg-transparent shadow-xs lg:shadow-none border border-slate-200/80 lg:border-0'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} />
                    <span>اللغة والمنطقة</span>
                  </div>
                  <ChevronLeft size={16} className="text-slate-400 lg:hidden" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className={`${settingsTab === null ? 'hidden lg:flex' : 'flex'} flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12 bg-white max-w-4xl mx-auto w-full`}>
                {settingsTab === null && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 lg:py-20 space-y-4">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                      <Settings size={36} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">مرحباً بك في إعدادات الحساب والخصوصية</h3>
                    <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                      الرجاء اختيار أحد الأقسام من القائمة الجانبية (في اليسار) لعرض وتعديل إعدادات حسابك الشخصي والأمان والاشتراكات.
                    </p>
                  </div>
                )}

                {settingsTab !== null && (
                  <div className="space-y-6">
                    {/* Back Button */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <button
                        onClick={() => setSettingsTab(null)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <ArrowRight size={14} />
                        <span>العودة للقائمة الرئيسية</span>
                      </button>
                    </div>

                    {settingsTab === 'profile' && (
                  <form onSubmit={handleSaveAccountSettings} className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white">
                          {editPhotoURL ? (
                            <img src={editPhotoURL} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            editDisplayName?.[0] || user?.email?.[0]?.toUpperCase() || 'ع'
                          )}
                        </div>
                        <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold rounded-2xl transition-opacity cursor-pointer">
                          <Camera size={18} className="mb-1" />
                          <span>تغيير الصورة</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                      <div className="space-y-1 text-center sm:text-right">
                        <h4 className="font-extrabold text-sm text-slate-900">صورة الملف الشخصي</h4>
                        <p className="text-xs text-slate-500">اختر صورة بروفايل شخصية من معرض جهازك (PNG, JPG, GIF)</p>
                        <label className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all">
                          <Camera size={14} className="text-blue-600" />
                          <span>رفع صورة من المعرض</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">الاسم الكامل (Display Name)</label>
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          placeholder="أدخل اسمك الكامل"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">البريد الإلكتروني (Email)</label>
                        <input
                          type="email"
                          value={editEmail}
                          disabled
                          className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">البريد الإلكتروني الأساسي لحسابك المرتبط بمنصة WaaS.</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsAccountSettingsOpen(false)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingSettings ? 'جاري الحفظ...' : (
                          <>
                            <Check size={16} />
                            <span>حفظ التعديلات</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {settingsTab === 'security' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <KeyRound size={20} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">كلمة المرور والأمان</h4>
                            <p className="text-xs text-slate-500">حماية حسابك باستخدام المصادقة الثنائية وكلمة مرور قوية</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">المصادقة الثنائية (2FA)</span>
                            <span className="text-[10px] text-slate-500">طبقة حماية إضافية عند تسجيل الدخول</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !twoFactorAuth;
                              setTwoFactorAuth(nextVal);
                              localStorage.setItem('twoFactorEnabled', String(nextVal));
                              showToast(nextVal ? 'تم تفعيل المصادقة الثنائية بنجاح' : 'تم إيقاف المصادقة الثنائية');
                            }}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${twoFactorAuth ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${twoFactorAuth ? 'translate-x-0' : '-translate-x-6'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <h4 className="font-extrabold text-sm text-slate-900">تغيير كلمة المرور</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
                          <input
                            type="password"
                            value={currentPasswordInput}
                            onChange={(e) => setCurrentPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                          <input
                            type="password"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleUpdatePassword}
                          disabled={isUpdatingPassword || !newPasswordInput}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                        >
                          {isUpdatingPassword ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : null}
                          <span>تحديث كلمة المرور</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                      <h4 className="font-extrabold text-sm text-slate-900">تفضيلات الإشعارات والتنبيهات</h4>
                      <p className="text-xs text-slate-500">اختر كيف ومتى تريد أن يتم إرسال التنبيهات إليك</p>

                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">إشعارات البريد الإلكتروني</span>
                            <span className="text-[10px] text-slate-500">تلقي ملخصات الطلبات والنشاطات عبر البريد</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmailNotifs(!emailNotifs)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${emailNotifs ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emailNotifs ? 'translate-x-0' : '-translate-x-6'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">تنبيهات الطلبات المباشرة</span>
                            <span className="text-[10px] text-slate-500">تنبيهات صوتية وفورية عند تلقي طلب جديد</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOrderAlerts(!orderAlerts)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${orderAlerts ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${orderAlerts ? 'translate-x-0' : '-translate-x-6'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">العروض والتحديثات التسويقية</span>
                            <span className="text-[10px] text-slate-500">أحدث قوالب وميزات المنصة</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMarketingNotifs(!marketingNotifs)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${marketingNotifs ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${marketingNotifs ? 'translate-x-0' : '-translate-x-6'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          showToast('تم حفظ تفضيلات الإشعارات بنجاح');
                          setIsAccountSettingsOpen(false);
                        }}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        حفظ التفضيلات
                      </button>
                    </div>
                  </div>
                )}

                {settingsTab === 'privacy' && (
                  <div className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
                    <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                      <h4 className="font-extrabold text-blue-900 text-sm flex items-center gap-2">
                        <Lock size={16} className="text-blue-600" />
                        <span>سياسة الخصوصية وحماية بيانات المستخدمين في منصة WaaS</span>
                      </h4>
                      <p className="text-slate-600 text-xs">
                        آخر تحديث: يوليو 2026. نحن في منصة WaaS نلتزم التزاماً تاماً بحماية خصوصيتك وبياناتك الشخصية وفق أعلى معايير الأمان المعتمدة عالمياً.
                      </p>
                    </div>

                    <div className="space-y-4 pr-1">
                      <div>
                        <h5 className="font-extrabold text-slate-900 mb-1">1. جمع المعلومات والبيانات</h5>
                        <p className="text-slate-600">
                          نقوم بجمع بعض المعلومات الأساسية عند تسجيلك أو استخدامك لمنصتنا، مثل: الاسم، البريد الإلكتروني، وبيانات المواقع والمتاجر التي تقوم بإنشائها وتخصيصها، بالإضافة إلى تفضيلاتك داخل لوحة التحكم.
                        </p>
                      </div>

                      <div>
                        <h5 className="font-extrabold text-slate-900 mb-1">2. كيف نستخدم معلوماتك</h5>
                        <p className="text-slate-600">
                          نستخدم هذه البيانات لتشغيل المنصة، وتخصيص تجربتك، وتوفير الدعم الفني، وإدارة اشتراكاتك ومواقعك بكفاءة عالية، وتطوير ميزات جديدة تحسن من تجربتك كصاحب عمل أو مستخدم.
                        </p>
                      </div>

                      <div>
                        <h5 className="font-extrabold text-slate-900 mb-1">3. أمان وحماية البيانات</h5>
                        <p className="text-slate-600">
                          نطبق إجراءات أمنية تقنية وتنظيمية صارمة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف. جميع البيانات مشفرة أثناء النقل والتخزين.
                        </p>
                      </div>

                      <div>
                        <h5 className="font-extrabold text-slate-900 mb-1">4. مشاركة البيانات مع الأطراف الثالثة</h5>
                        <p className="text-slate-600">
                          لا نبيع أو نتاجر أبداً ببياناتك الشخصية. لا يتم مشاركة بياناتك إلا مع مزودي الخدمة الأساسيين المرتبطين بتشغيل المنصة (مثل خدمات المصادقة والاستضافة السحابية الآمنة) وبما يوافق القوانين ذات الصلة.
                        </p>
                      </div>

                      <div>
                        <h5 className="font-extrabold text-slate-900 mb-1">5. حقوقك وصلاحياتك</h5>
                        <p className="text-slate-600">
                          يحق لك في أي وقت تعديل بياناتك الشخصية، أو طلب حذف حسابك وبياناتك المرتبطة عبر التواصل معنا أو من خلال إعدادات الحساب المتاحة في لوحتك.
                        </p>
                      </div>

                      <div>
                        <h5 className="font-extrabold text-slate-900 mb-1">6. تواصل معنا</h5>
                        <p className="text-slate-600">
                          إذا كانت لديك أي استفسارات أو ملاحظات بخصوص سياسة الخصوصية، يرجى التواصل معنا عبر قنوات الدعم الفني المتاحة في المنصة أو البريد الإلكتروني للعملاء.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'billing' && (
                  <div className="space-y-6">
                    {userSubscription && userSubscription.status === 'active' ? (
                      <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg">الخطة النشطة حالياً ✅</span>
                            <h4 className="font-black text-lg text-slate-900 mt-1">{userSubscription.name}</h4>
                          </div>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>اشتراك فعّال ومؤكد</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">تتيح لك هذه الخطة الاستفادة الكاملة من إمكانيات منصة بنيان، ربط المتاجر، تفعيل البوابات، وخدمات الدفع المباشر.</p>
                        <div className="pt-3 flex flex-wrap items-center justify-between border-t border-blue-200/60 text-xs gap-3">
                          <span className="text-slate-600 font-medium">تاريخ تجديد/انتهاء الاشتراك: <strong className="text-slate-900 font-black">{userSubscription.expiresAt || '01 أغسطس 2027'}</strong></span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedInvoiceModal({
                                  invoiceNo: userSubscription.invoiceNo || 'BUNYAN-INV-2026-8821',
                                  date: userSubscription.createdAt || '01 أغسطس 2026',
                                  planName: userSubscription.planTitle || userSubscription.name,
                                  price: userSubscription.price,
                                  tax: '0.00',
                                  paymentMethod: 'بطاقة ائتمانية (Visa/Mastercard)',
                                  userName: user?.displayName || user?.email || 'مشترك بنيان المميز',
                                  userEmail: user?.email || 'client@bunyan.app',
                                  siteName: userSubscription.siteName,
                                  templateId: userSubscription.templateId,
                                  endDate: userSubscription.endDate,
                                  hasCustomDomain: userSubscription.hasCustomDomain,
                                  requestedDomainName: userSubscription.requestedDomainName
                                });
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs"
                            >
                              عرض الفاتورة 📄
                            </button>
                            <button
                              onClick={() => {
                                setUserSubscription(null);
                                localStorage.removeItem('app_subscription');
                                showToast('تم إلغاء الاشتراك الحالي بنجاح.');
                              }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all cursor-pointer shadow-xs"
                            >
                              إلغاء الاشتراك
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2 text-center">
                        <h4 className="font-black text-base text-amber-900">الباقة الحالية: الباقة المجانية (لا يوجد اشتراك مدفوع نشط)</h4>
                        <p className="text-xs text-amber-700">يمكنك الاشتراك الفوري في إحدى الباقات الاحترافية أدناه للاستمتاع بجميع المميزات بدون أي قيود.</p>
                      </div>
                    )}

                    <div className="space-y-4 pt-2">
                      <h4 className="font-extrabold text-sm text-slate-900">باقات المنصة المتاحة والاشتراكات</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getSubscriptionPlans(appCurrency).map((plan, idx) => {
                          const isCurrent = userSubscription?.planId === plan.id && userSubscription?.status === 'active';
                          return (
                            <div key={`account-plan-${plan.id}-${idx}`} className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${plan.popular ? 'bg-blue-50/60 border-blue-300 shadow-md ring-2 ring-blue-500/20' : 'bg-white border-slate-200'}`}>
                              <div className="space-y-3">
                                {plan.popular && <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الأكثر طلباً</span>}
                                <h5 className="font-black text-slate-900 text-xs sm:text-sm">{plan.name}</h5>
                                <div className="text-lg font-black text-blue-600">{plan.price} <span className="text-[10px] font-medium text-slate-500">/ {plan.duration}</span></div>
                                <ul className="space-y-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                                  {plan.features.map((f, i) => (
                                    <li key={`account-feat-${plan.id}-${i}`} className="flex items-center gap-2">
                                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                      <span>{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedPlanForCheckout(plan);
                                  localStorage.setItem('selectedPlanId', plan.id);
                                  localStorage.setItem('selected_plan_checkout', JSON.stringify(plan));
                                  setIsAccountSettingsOpen(false);
                                  showToast(`تم اختيار باقة ${plan.name}. يرجى تصفح القوالب واختيار القالب المناسب لتفعيله.`);
                                  setTimeout(() => {
                                    document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 200);
                                }}
                                className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                اختر الباقة وتصفح القوالب ⚡
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <h4 className="font-extrabold text-sm text-slate-900">سجل المدفوعات وتفاصيل الفواتير المالية</h4>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl divide-y divide-slate-200/60 text-xs">
                        {userSubscription && userSubscription.status === 'active' ? (
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-xs">✓</span>
                              <div>
                                <span className="font-black text-slate-900 text-sm block">
                                  {userSubscription.siteName ? `موقع: ${userSubscription.siteName} (` : ''}
                                  اشتراك {userSubscription.name}
                                  {userSubscription.siteName ? ')' : ''}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  رقم الفاتورة: {userSubscription.invoiceNo || 'BUNYAN-INV-2026-8821'} • 
                                  تاريخ الانتهاء: {userSubscription.endDate ? userSubscription.endDate.substring(0,10) : '01 أغسطس 2026'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 justify-between sm:justify-end">
                              <span className="font-black text-slate-900 text-sm">{userSubscription.price}</span>
                              <button
                                onClick={() => {
                                  setSelectedInvoiceModal({
                                    invoiceNo: userSubscription.invoiceNo || 'BUNYAN-INV-2026-8821',
                                    date: userSubscription.createdAt || '01 أغسطس 2026',
                                    planName: userSubscription.planTitle || userSubscription.name,
                                    price: userSubscription.price,
                                    tax: '0.00',
                                    paymentMethod: 'بطاقة ائتمانية / بنيان Pay',
                                    userName: user?.displayName || user?.email || 'عميل بنيان المميز',
                                    userEmail: user?.email || 'client@bunyan.app',
                                    siteName: userSubscription.siteName,
                                    templateId: userSubscription.templateId,
                                    endDate: userSubscription.endDate,
                                    hasCustomDomain: userSubscription.hasCustomDomain,
                                    requestedDomainName: userSubscription.requestedDomainName
                                  });
                                }}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all cursor-pointer"
                              >
                                عرض واستخراج الفاتورة 📄
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-xs font-medium">
                            لا توجد فواتير سابقة. اختر باقة مدفوعة أدناه لاستخراج فاتورتك الضريبية.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'api' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">مفتاح الوصول السري (API Secret Key)</h4>
                          <p className="text-xs text-slate-500">استخدم هذا المفتاح للربط البرمجي وتلقي البيانات بأمان</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(apiKeyInput);
                            showToast('تم نسخ مفتاح API السري بنجاح');
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          نسخ المفتاح
                        </button>
                      </div>
                      <input
                        type="text"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                      />
                      <button
                        onClick={() => {
                          localStorage.setItem('app_api_key', apiKeyInput);
                          showToast('تم حفظ وتحديث مفتاح API بنجاح');
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        تحديث مفتاح API
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <h4 className="font-extrabold text-sm text-slate-900">إعدادات الويب هوك (Webhook Endpoints)</h4>
                      <p className="text-xs text-slate-500">رابط المستقبل لتلقي إشعارات الطلبات والأحداث اللحظية</p>
                      <input
                        type="text"
                        value={webhookUrlInput}
                        onChange={(e) => setWebhookUrlInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                      />
                      <button
                        onClick={() => {
                          localStorage.setItem('app_webhook_url', webhookUrlInput);
                          showToast('تم حفظ إعدادات الويب هوك بنجاح');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        حفظ وتحديث الرابط
                      </button>
                    </div>
                  </div>
                )}

                {settingsTab === 'localization' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {appLang === 'en' ? 'Language, Timezone & Currency Preferences' : 'تفضيلات اللغة والمنطقة الزمنية والعملة'}
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {appLang === 'en' ? 'Display Language' : 'لغة الواجهة (Display Language)'}
                          </label>
                          <select
                            value={appLang}
                            onChange={(e) => setAppLang(e.target.value as 'ar' | 'en')}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                          >
                            <option value="ar">العربية (Arabic - Default)</option>
                            <option value="en">English (الإنجليزية)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {appLang === 'en' ? 'Default Currency (All World Currencies)' : 'العملة الافتراضية (جميع العملات العالمية)'}
                          </label>
                          <select
                            value={appCurrency}
                            onChange={(e) => setAppCurrency(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                          >
                            <option value="SAR">ريال سعودي (SAR - Saudi Riyal)</option>
                            <option value="USD">دولار أمريكي (USD - US Dollar)</option>
                            <option value="EUR">يورو (EUR - Euro)</option>
                            <option value="GBP">جنيه إسترليني (GBP - British Pound)</option>
                            <option value="AED">درهم إماراتي (AED - UAE Dirham)</option>
                            <option value="JOD">دينار أردني (JOD - Jordanian Dinar)</option>
                            <option value="EGP">جنيه مصري (EGP - Egyptian Pound)</option>
                            <option value="KWD">دينار كويتي (KWD - Kuwaiti Dinar)</option>
                            <option value="QAR">ريال قطري (QAR - Qatari Riyal)</option>
                            <option value="BHD">دينار بحريني (BHD - Bahraini Dinar)</option>
                            <option value="OMR">ريال عماني (OMR - Omani Rial)</option>
                            <option value="CAD">دولار كندي (CAD - Canadian Dollar)</option>
                            <option value="AUD">دولار أسترالي (AUD - Australian Dollar)</option>
                            <option value="JPY">ين ياباني (JPY - Japanese Yen)</option>
                            <option value="CNY">يوان صيني (CNY - Chinese Yuan)</option>
                            <option value="INR">روبية هندية (INR - Indian Rupee)</option>
                            <option value="TRY">ليرة تركية (TRY - Turkish Lira)</option>
                            <option value="MAD">درهم مغربي (MAD - Moroccan Dirham)</option>
                            <option value="TND">دينار تونسي (TND - Tunisian Dinar)</option>
                            <option value="CHF">فرنك سويسري (CHF - Swiss Franc)</option>
                            <option value="SGD">دولار سنغافوري (SGD - Singapore Dollar)</option>
                            <option value="ZAR">راند جنوب إفريقي (ZAR - South African Rand)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            {appLang === 'en' ? 'Timezone' : 'المنطقة الزمنية (Timezone)'}
                          </label>
                          <select
                            value={appTimezone}
                            onChange={(e) => setAppTimezone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                          >
                            <option value="Asia/Riyadh">(GMT+03:00) Riyadh, Mecca, Kuwait</option>
                            <option value="Asia/Dubai">(GMT+04:00) Dubai, Abu Dhabi</option>
                            <option value="Africa/Cairo">(GMT+02:00) Cairo</option>
                            <option value="Europe/London">(GMT+00:00) London</option>
                            <option value="America/New_York">(GMT-05:00) New York</option>
                          </select>
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            localStorage.setItem('app_lang', appLang);
                            localStorage.setItem('app_currency', appCurrency);
                            localStorage.setItem('app_timezone', appTimezone);
                            document.documentElement.dir = appLang === 'ar' ? 'rtl' : 'ltr';
                            document.documentElement.lang = appLang;
                            showToast(appLang === 'en' ? 'Localization & currency settings updated successfully' : 'تم حفظ تفضيلات اللغة والعملة والمنطقة بنجاح');
                          }}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          {appLang === 'en' ? 'Save Changes Instantly' : 'حفظ التغييرات الفورية'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2FA Verification Modal */}
      <AnimatePresence>
        {is2FAModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 p-6 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900">التحقق بخطوتين (2FA)</h3>
                <p className="text-xs text-slate-500">
                  تم إرسال رمز التحقق المؤلف من 6 أرقام إلى بريدك الإلكتروني المسجل. أدخل الرمز أدناه للمتابعة بأمان.
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-center">رمز التحقق (أدخل أي أرقام مثل 123456)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-xl font-black py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIs2FAModalOpen(false);
                      setPendingUser(null);
                      setTwoFactorCode('');
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying2FA}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying2FA ? 'جاري التحقق...' : 'تأكيد ودخول'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Help Center & Technical Support Full Page View */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col w-full h-full"
            dir="rtl"
          >
            {/* Header / Top Bar */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 lg:px-12 py-5 border-b border-slate-100 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                  <LifeBuoy size={26} />
                </div>
                <div>
                  <h2 className="font-black text-xl lg:text-2xl text-slate-900">مركز المساعدة والدعم الفني الشامل</h2>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">كل ما تحتاجه لحل المشاكل، استكشاف الأخطاء، والأدلة الإرشادية لمتجرك</p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <X size={18} />
                <span>إغلاق الصفحة</span>
              </button>
            </div>

            <div className="max-w-6xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8 flex-1">
              {/* Search Bar Banner */}
              <div className="p-6 lg:p-8 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-blue-50/40 rounded-3xl border border-emerald-100 shadow-sm space-y-4 text-center">
                <h3 className="font-black text-lg text-slate-900">كيف يمكننا مساعدتك اليوم؟</h3>
                <div className="relative max-w-2xl mx-auto">
                  <Search size={22} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={helpSearchQuery}
                    onChange={(e) => setHelpSearchQuery(e.target.value)}
                    placeholder="ابحث عن مشكلة، سؤال، أو مقال (مثل: رفع الصور، تسجيل الدخول، تفعيل 2FA، النطاق)..."
                    className="w-full pr-14 pl-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 shadow-md focus:outline-none focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-white gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setHelpTab('faq')}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'faq'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle size={18} />
                  <span>الأسئلة الشائعة (FAQ)</span>
                </button>
                <button
                  onClick={() => setHelpTab('troubleshooting')}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'troubleshooting'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wrench size={18} />
                  <span>استكشاف الأخطاء وإصلاحها</span>
                </button>
                <button
                  onClick={() => setHelpTab('guides')}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'guides'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen size={18} />
                  <span>أدلة الاستخدام الشاملة</span>
                </button>
                <button
                  onClick={() => setHelpTab('ticket')}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'ticket'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare size={18} />
                  <span>فتح تذكرة دعم فني</span>
                </button>
                <button
                  onClick={() => setHelpTab('videos')}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'videos'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video size={18} />
                  <span>مكتبة الفيديوهات التعليمية</span>
                </button>
                <button
                  onClick={() => setHelpTab('status')}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'status'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity size={18} />
                  <span>حالة الخوادم والأنظمة</span>
                </button>
                <button
                  onClick={() => {
                    setHelpTab('my_tickets');
                    loadUserDataNotificationsAndTickets();
                  }}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'my_tickets'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare size={18} />
                  <span>تذاكري وتحديثاتها ({userSupportTickets.length})</span>
                </button>
                <button
                  onClick={() => setHelpTab('plans')}
                  className={`pb-3 px-5 text-xs lg:text-sm font-black border-b-2 transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                    helpTab === 'plans'
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 rounded-t-xl shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>الباقات والاشتراكات</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="space-y-6 pb-12">
                {helpTab === 'plans' ? (
                  <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 rounded-3xl shadow-sm text-center space-y-2">
                      <h4 className="font-black text-xl text-slate-900">اختر باقة المنصة المناسبة لعملك وتجارتك</h4>
                      <p className="text-xs lg:text-sm text-slate-600 max-w-2xl mx-auto">تتيح لك باقاتنا إنشاء وتخصيص المتاجر والقوالب بكل سهولة. اختر الباقة المناسبة ثم حدد القالب لتنطلق نحو النجاح.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {getSubscriptionPlans(appCurrency).map((plan, idx) => (
                        <div key={`help-plan-${plan.id}-${idx}`} className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${plan.popular ? 'bg-blue-50/70 border-blue-300 shadow-lg ring-2 ring-blue-500/20 scale-[1.02]' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="space-y-4">
                            {plan.popular && <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xs">الأكثر طلباً واحترافية</span>}
                            <h5 className="font-black text-slate-900 text-base">{plan.name}</h5>
                            <div className="text-2xl font-black text-blue-600">{plan.price} <span className="text-xs font-medium text-slate-500">/ {plan.duration}</span></div>
                            <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                              {plan.features.map((f, i) => (
                                <li key={`help-feat-${plan.id}-${i}`} className="flex items-center gap-2.5">
                                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPlanForCheckout(plan);
                              localStorage.setItem('selectedPlanId', plan.id);
                              localStorage.setItem('selected_plan_checkout', JSON.stringify(plan));
                              setIsHelpModalOpen(false);
                              showToast(`تم اختيار باقة ${plan.name}. يرجى اختيار القالب المناسب.`);
                              setTimeout(() => {
                                document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' });
                              }, 200);
                            }}
                            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md"
                          >
                            اختيار هذه الباقة واختيار قالب
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : helpTab === 'my_tickets' ? (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">متابعة تذاكر الدعم الفني والاستفسارات</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">تتبع حالة تذاكرك السابقة (مفتوحة، قيد المعالجة، تم الحل) وردود فريق الدعم.</p>
                      </div>
                      <button
                        onClick={loadUserDataNotificationsAndTickets}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <RefreshCw size={14} className={loadingUserNotifs ? 'animate-spin' : ''} />
                        <span>تحديث الحالات</span>
                      </button>
                    </div>

                    {userSupportTickets.length === 0 ? (
                      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
                        <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h5 className="font-bold text-slate-800 text-base mb-1">لا توجد تذاكر دعم فني مرسلة حتى الآن</h5>
                        <p className="text-xs text-slate-500 mb-6">هل تواجه مشكلة أو تحتاج استفساراً؟ يمكنك فتح تذكرة جديدة وسنرد عليك في أقرب وقت.</p>
                        <button
                          onClick={() => setHelpTab('ticket')}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl transition-all cursor-pointer shadow-md"
                        >
                          فتح تذكرة دعم جديدة 🎧
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userSupportTickets.map((t) => (
                          <div key={t.id || t.ticketNumber} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-mono font-bold">
                                  {t.ticketNumber}
                                </span>
                                <div>
                                  <h5 className="font-extrabold text-slate-900 text-base">{t.subject}</h5>
                                  <span className="text-xs text-slate-400">تاريخ الإرسال: {t.createdAt ? new Date(t.createdAt).toLocaleString('ar-SA') : ''}</span>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                                t.status === 'open' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                t.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {t.status === 'open' ? 'بانتظار الرد (مفتوحة) 🔴' :
                                 t.status === 'in_progress' ? 'قيد المعالجة والفحص 🟡' :
                                 t.status === 'resolved' ? 'تم الحل والإجابة 🟢' : 'مغلقة ⚪'}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium space-y-2">
                              <strong className="text-slate-500 block mb-1">نص الاستفسار:</strong>
                              <p className="whitespace-pre-wrap">{t.message}</p>
                              {t.attachment && (
                                <div className="pt-2">
                                  <a href={t.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-emerald-700 hover:underline text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                    <span>عرض الصورة المرفقة من المعرض 📎</span>
                                    <img src={t.attachment} alt="attachment" className="w-8 h-8 object-cover rounded-lg" />
                                  </a>
                                </div>
                              )}
                            </div>

                            {t.reply && (
                              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl text-xs space-y-1">
                                <div className="flex items-center justify-between text-emerald-800 font-bold mb-1">
                                  <span>رد فريق الدعم الفني ({t.repliedBy || 'المشرف'}):</span>
                                  <span>{t.repliedAt ? new Date(t.repliedAt).toLocaleString('ar-SA') : ''}</span>
                                </div>
                                <p className="text-slate-800 whitespace-pre-wrap font-medium">{t.reply}</p>
                              </div>
                            )}

                            {t.clientReply && (
                              <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl text-xs space-y-1">
                                <div className="flex items-center justify-between text-blue-800 font-bold mb-1">
                                  <span>ردك أو معلوماتك الإضافية المرسلة:</span>
                                </div>
                                <p className="text-slate-800 whitespace-pre-wrap font-medium">{t.clientReply}</p>
                                {t.clientAttachment && (
                                  <a href={t.clientAttachment} target="_blank" rel="noreferrer" className="text-blue-600 underline text-[11px] block mt-1">
                                    عرض المرفق / الصورة المرفقة 📎
                                  </a>
                                )}
                              </div>
                            )}

                            <div className="pt-3 border-t border-slate-100 space-y-2.5">
                              <label className="block text-[11px] font-bold text-slate-600">إضافة معلومات أو رد إضافي / إرفاق صورة من المعرض بناءً على طلب الدعم:</label>
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  placeholder="اكتب ردك أو تفاصيل إضافية هنا..."
                                  value={ticketReplyInput[t.id!] || ''}
                                  onChange={(e) => setTicketReplyInput({ ...ticketReplyInput, [t.id!]: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-emerald-500 font-medium"
                                />
                                <div className="flex items-center gap-3">
                                  <label className="flex-1 px-3 py-2 bg-white border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition-all">
                                    <Camera size={14} className="text-emerald-600" />
                                    <span>{ticketAttachmentInput[t.id!] ? 'تم إرفاق الصورة من المعرض (تغيير الصورة)' : 'اختر صورة من المعرض / الجهاز (اختياري)'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (uploadEvent) => {
                                            setTicketAttachmentInput({ ...ticketAttachmentInput, [t.id!]: uploadEvent.target?.result as string });
                                            showToast('تم إرفاق الصورة من المعرض بنجاح ✅');
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {ticketAttachmentInput[t.id!] && (
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                      <img src={ticketAttachmentInput[t.id!]} alt="Attachment preview" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => setTicketAttachmentInput({ ...ticketAttachmentInput, [t.id!]: '' })}
                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[9px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                                      >
                                        حذف
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={async () => {
                                      const replyText = ticketReplyInput[t.id!];
                                      if (!replyText || !replyText.trim()) return;
                                      const success = await addUserReplyToSupportTicket(
                                        t.id!,
                                        replyText.trim(),
                                        ticketAttachmentInput[t.id!]?.trim() || undefined,
                                        {
                                          ticketNumber: t.ticketNumber,
                                          subject: t.subject,
                                          userId: user?.uid || user?.id,
                                          userEmail: user?.email,
                                          userName: user?.displayName || user?.email
                                        }
                                      );
                                      if (success) {
                                        setTicketReplyInput({ ...ticketReplyInput, [t.id!]: '' });
                                        setTicketAttachmentInput({ ...ticketAttachmentInput, [t.id!]: '' });
                                        showToast('تم إرسال ردك ومعلوماتك الإضافية إلى فريق الدعم بنجاح ✅');
                                        loadUserDataNotificationsAndTickets();
                                      } else {
                                        showToast('حدث خطأ أثناء إرسال الرد');
                                      }
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
                                  >
                                    <Send size={13} />
                                    <span>إرسال الرد</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : helpTab === 'faq' ? (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-base text-slate-900">الأسئلة الأكثر شيوعاً وشروحات القوالب الجديدة (FAQ)</h4>
                    {[
                      {
                        category: 'عيادات الأسنان والمراكز الطبية 🩺',
                        q: 'كيف أضيف الأطباء وأعين البريد وكلمة المرور لبوابة الطبيب في قالب عيادة الأسنان؟',
                        a: 'من لوحة تحكم العيادة > توجه إلى قسم "الأطباء والطاقم الطبي"، ثم اضغط "إضافة طبيب جديد". أدخل اسم الطبيب، والتخصص، والبريد الإلكتروني، وكلمة المرور المخصصة له. يستطيع الطبيب بعد ذلك الدخول المباشر لبوابته عبر صفحة تسجيل دخول نظام الإدارة ببريده وكلمة المرور الخاصة به.'
                      },
                      {
                        category: 'عيادات الأسنان والمراكز الطبية 🩺',
                        q: 'كيف يتم حجز وتتبع مواعيد المرضى في العيادة؟',
                        a: 'يحجز المرضى موعدهم بسهولة اختيار الطبيب والوقت المناسب عبر موقع العيادة المباشر، وتظهر المواعيد فوراً في لوحة مدير العيادة وبوابة الطبيب المعني لتحديث حالتها (مؤكد، مكتمل، ملغى).'
                      },
                      {
                        category: 'المتاجر الإلكترونية والتجارة 🛍️',
                        q: 'كيف أضيف المنتجات والأنواع وأحدد المخزون في المتاجر الإلكترونية؟',
                        a: 'من لوحة تحكم المتجر (سواء متجر الموضة، الأجهزة، أو العناية بالبشرة)، انتقل إلى تبويب "المنتجات والمخزون"، اضغط "إضافة منتج"، وارفع الصور، حدد السعر الأصلي والمخفض، وخيارات الكمية المتوفرة.'
                      },
                      {
                        category: 'المتاجر الإلكترونية والتجارة 🛍️',
                        q: 'كيف أربط الدومين (النطاق) الخاص وطرق الدفع والتوصيل بمتجري؟',
                        a: 'من إعدادات المتجر > الربط والأنظمة، يمكنك إضافة النطاق الخاص بك (مثل yourbrand.com)، وتفعيل طرق الدفع (مدى، فيزا، ماستركارد، أو الدفع عند الاستلام)، مع تحديد رسوم التوصيل حسب المناطق.'
                      },
                      {
                        category: 'الاشتراكات والمالية 💳',
                        q: 'كيف أترقى للباقة الاحترافية أو باقة الشركات وأحصل على الفاتورة الضريبية؟',
                        a: 'من إعدادات الحساب > قسم "الاشتراكات والمالية"، اختر الباقة المناسبة واضغط "اشترك الآن". سيتم تفعيل حسابك فوراً وإرسال إشعار تأكيد في مركز التنبيهات، مع إمكانية استخراج وتنزيل الفاتورة الضريبية بنقرة زر واحدة.'
                      },
                      {
                        category: 'المنصة والحسابات ⚙️',
                        q: 'هل تصلني التنبيهات الخاصة بحسابي واشتراكاتي في القائمة العلوي؟',
                        a: 'نعم، مركز الإشعارات والتنبيهات العلوي 🔔 مخصص لتنبيهات المنصة الرسمية، تأكيد الاشتراكات، تحديثات الإدارة، وتذاكر الدعم الفني، بينما تُدار طلبات الزبائن والمواعيد داخل لوحة تحكم كل موقع بشكل مستقل ومنظم.'
                      }
                    ]
                      .filter(item => !helpSearchQuery || item.q.includes(helpSearchQuery) || item.a.includes(helpSearchQuery) || item.category.includes(helpSearchQuery))
                      .map((item, idx) => (
                        <div key={idx} className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md">{item.category}</span>
                          </div>
                          <h5 className="font-extrabold text-slate-900 text-sm lg:text-base flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black shrink-0">؟</span>
                            <span>{item.q}</span>
                          </h5>
                          <p className="text-xs lg:text-sm text-slate-600 leading-relaxed pr-10">{item.a}</p>
                        </div>
                      ))}
                  </div>
                ) : helpTab === 'troubleshooting' ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-100 border border-slate-200 rounded-2xl space-y-1 shadow-xs">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <AlertCircle size={18} className="text-slate-700" />
                        <span>قسم استكشاف الأخطاء الشائعة وحلولها الفورية</span>
                      </h4>
                      <p className="text-xs text-slate-600">إذا واجهت أي من المشاكل التالية أثناء استخدام المنصة، اتبع الخطوات أدناه لحلها فوراً:</p>
                    </div>

                    {[
                      {
                        problem: 'مشكلة: لا أستطيع رفع صورة البروفايل أو صور المنتجات',
                        cause: 'قد يكون حجم الصورة كبير جداً أو صيغتها غير مدعومة.',
                        solution: 'تأكد أن صيغة الصورة هي PNG أو JPG وأن حجمها أقل من 5 ميجابايت. جرب استخدام صورة أخرى أو تصغير حجمها.'
                      },
                      {
                        problem: 'مشكلة: رسالة "خطأ في تسجيل الدخول عبر جوجل"',
                        cause: 'تم حظر النوافذ المنبثقة (Pop-ups) في متصفحك أو انتهت الجلسة.',
                        solution: 'السماح للنوافذ المنبثقة في إعدادات المتصفح، أو مسح ذاكرة التخزين المؤقت للمتصفح، ثم إعادة المحاولة.'
                      },
                      {
                        problem: 'مشكلة: قمت بتفعيل المصادقة الثنائية (2FA) ولا أستطيع الدخول',
                        cause: 'نسيان رمز التحقق المرسل.',
                        solution: 'يتم إرسال رمز التحقق التجريبي (مثل 123456) أو يمكنك تعطيلها مؤقتاً عبر دعم العملاء إذا لزم الأمر.'
                      },
                      {
                        problem: 'مشكلة: التغييرات أو التعديلات على المتجر لا تظهر فوراً',
                        cause: 'تخزين مؤقت للمتصفح (Cache).',
                        solution: 'قم بتحديث الصفحة بضغط (Ctrl + F5) أو إعادة تحميل المتصفح لتحديث البيانات بشكل كامل.'
                      }
                    ]
                      .filter(item => !helpSearchQuery || item.problem.includes(helpSearchQuery) || item.solution.includes(helpSearchQuery))
                      .map((item, idx) => (
                        <div key={idx} className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-xs">
                          <h5 className="font-extrabold text-sm lg:text-base flex items-center gap-2.5 text-rose-700">
                            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-black">!</span>
                            <span>{item.problem}</span>
                          </h5>
                          <div className="text-xs lg:text-sm text-slate-600 space-y-1 pr-9">
                            <p><strong className="text-slate-800">السبب المحتمل:</strong> {item.cause}</p>
                            <p><strong className="text-emerald-700">الحل الفوري:</strong> {item.solution}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : helpTab === 'guides' ? (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-base text-slate-900">أدلة ومراجع التوثيق الاحترافية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          title: 'دليل البدء السريع لصاحب العمل',
                          desc: 'كيف تختار القالب الأنسب، تعدل الأسماء والأقسام، وتبدأ استقبال العملاء في أقل من 5 دقائق.',
                          time: 'قراءة في 4 دقائق'
                        },
                        {
                          title: 'دليل إدارة الطلبات والمبيعات المتقدمة',
                          desc: 'كيفية متابعة حالات الطلبات، إصدار الفواتير، وإدارة المخزون بكفاءة عالية.',
                          time: 'قراءة في 6 دقائق'
                        },
                        {
                          title: 'دليل الأمان وحماية الخصوصية',
                          desc: 'شرح مفصل لطريقة تفعيل المصادقة الثنائية 2FA، تغيير كلمات المرور، وإعدادات الأمان.',
                          time: 'قراءة في 3 دقائق'
                        },
                        {
                          title: 'دليل تخصيص الهوية البصرية',
                          desc: 'كيفية اختيار الألوان، رفع الشعارات، وتعديل الواجهات لتناسب علامتك التجارية.',
                          time: 'قراءة في 5 دقائق'
                        }
                      ].map((guide, idx) => (
                        <div key={idx} className="p-6 bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl space-y-3 shadow-sm transition-all flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl inline-block">{guide.time}</span>
                            <h5 className="font-extrabold text-slate-900 text-base">{guide.title}</h5>
                            <p className="text-xs lg:text-sm text-slate-500 leading-relaxed">{guide.desc}</p>
                          </div>
                          <button
                            onClick={() => showToast('جاري فتح الدليل التوثيقي كاملاً...')}
                            className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>قراءة المقال كاملاً</span>
                            <span>←</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : helpTab === 'videos' ? (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-base text-slate-900">مكتبة الفيديوهات التعليمية المرئية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: 'إنشاء متجرك الأول في 3 دقائق', duration: '03:45 دقيقة', views: '12.4k مشاهدة' },
                        { title: 'شرح ربط النطاق وتفعيل SSL', duration: '05:20 دقيقة', views: '8.1k مشاهدة' },
                        { title: 'إدارة الطلبات، الفواتير والتنبيهات', duration: '04:15 دقيقة', views: '9.6k مشاهدة' },
                        { title: 'إعداد المصادقة الثنائية والأمان', duration: '02:50 دقيقة', views: '5.3k مشاهدة' },
                        { title: 'تخصيص الألوان والشعارات باحترافية', duration: '06:10 دقيقة', views: '14.2k مشاهدة' },
                        { title: 'استخدام مفاتيح API والويب هوك', duration: '07:30 دقيقة', views: '4.8k مشاهدة' },
                      ].map((vid, idx) => (
                        <div key={idx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                          <div className="h-40 bg-gradient-to-br from-emerald-600/90 to-teal-800/90 relative flex items-center justify-center text-white">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                              <Video size={22} className="text-white fill-white" />
                            </div>
                            <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 rounded-xl text-[10px] font-bold text-white">{vid.duration}</span>
                          </div>
                          <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                            <h5 className="font-extrabold text-slate-900 text-sm">{vid.title}</h5>
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                              <span>{vid.views}</span>
                              <button
                                onClick={() => showToast(`جاري تشغيل الفيديو: ${vid.title}`)}
                                className="text-emerald-600 font-bold hover:underline cursor-pointer"
                              >
                                مشاهدة الآن
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : helpTab === 'status' ? (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md animate-pulse">
                          <Activity size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-emerald-900">جميع أنظمة وخوادم المنصة تعمل بكفاءة تامة</h4>
                          <p className="text-xs text-emerald-700">نسبة الجاهزية والتشغيل (Uptime): <strong>99.99%</strong> خلال آخر 90 يوماً</p>
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-xs">متصل وآمن</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
                      {[
                        { service: 'بوابة واجهة برمجة التطبيقات (API Gateway)', status: 'يعمل بكفاءة', latency: '42ms' },
                        { service: 'قاعدة البيانات السحابية الآمنة (Firestore / DB)', status: 'يعمل بكفاءة', latency: '12ms' },
                        { service: 'نظام المصادقة والتحقق (Firebase Auth & 2FA)', status: 'يعمل بكفاءة', latency: '18ms' },
                        { service: 'خدمة الويب هوك والإشعارات (Webhooks Engine)', status: 'يعمل بكفاءة', latency: '25ms' },
                        { service: 'شبكة توزيع المحتوى وشهادات SSL (CDN)', status: 'يعمل بكفاءة', latency: '8ms' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 lg:p-5 flex items-center justify-between text-xs lg:text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                            <span className="font-extrabold text-slate-800">{item.service}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-slate-500 font-medium">الاستجابة: {item.latency}</span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs">{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                      <h4 className="font-extrabold text-sm text-emerald-900">فتح تذكرة دعم فني جديدة</h4>
                      <p className="text-xs text-emerald-700">فريق الدعم الفني متواجد على مدار الساعة لمساعدتك. سنقوم بالرد خلال 15 دقيقة.</p>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!ticketSubject || !ticketMessage) {
                          showToast('يرجى تعبئة موضوع التذكرة ورسالة الاستفسار');
                          return;
                        }
                        setIsSubmittingTicket(true);
                        try {
                          const uId = user?.uid || auth.currentUser?.uid || 'usr_guest';
                          const uEmail = user?.email || auth.currentUser?.email || 'guest@example.com';
                          const uName = user?.displayName || auth.currentUser?.displayName || editDisplayName || 'عميل';
                          
                          const created = await createSupportTicket({
                            userId: uId,
                            userEmail: uEmail,
                            userName: uName,
                            category: ticketCategory,
                            subject: ticketSubject,
                            message: ticketMessage,
                            attachment: ticketAttachment || undefined
                          });

                          setUserSupportTickets(prev => [created, ...prev]);
                          showToast(`تم إرسال تذكرة الدعم الفني بنجاح! رقم التذكرة ${created.ticketNumber}`);
                          setTicketSubject('');
                          setTicketMessage('');
                          setTicketAttachment('');
                          setHelpTab('my_tickets');
                        } catch (err) {
                          console.error(err);
                          showToast('حدث خطأ أثناء إرسال تذكرة الدعم');
                        } finally {
                          setIsSubmittingTicket(false);
                        }
                      }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">قسم المشكلة أو الاستفسار</label>
                          <select
                            value={ticketCategory}
                            onChange={(e) => setTicketCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
                          >
                            <option value="technical">مشكلة تقنية أو برمجية</option>
                            <option value="billing">الاشتراكات والمدفوعات</option>
                            <option value="domain">ربط النطاقات (Domains)</option>
                            <option value="customization">تخصيص القوالب والمتاجر</option>
                            <option value="other">استفسار عام</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني للتواصل</label>
                          <input
                            type="email"
                            value={user?.email || 'user@example.com'}
                            disabled
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">موضوع التذكرة باختصار</label>
                        <input
                          type="text"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="مثال: استفسار حول ربط الدومين أو تعديل شعار المتجر"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">تفاصيل المشكلة أو الطلب</label>
                        <textarea
                          rows={4}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="اشرح المشكلة بالتفصيل أو اذكر الخطوات التي قمت بها لكي نتمكن من مساعدتك بأسرع وقت..."
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">إرفاق صورة من المعرض (اختياري)</label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1 px-4 py-3 bg-white border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition-all">
                            <Camera size={16} className="text-emerald-600" />
                            <span>{ticketAttachment ? 'تم إرفاق الصورة بنجاح (تغيير الصورة)' : 'اختر صورة من المعرض / الجهاز'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    setTicketAttachment(uploadEvent.target?.result as string);
                                    showToast('تم إرفاق الصورة من المعرض بنجاح ✅');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {ticketAttachment && (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                              <img src={ticketAttachment} alt="Attachment preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setTicketAttachment('')}
                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[10px] font-bold opacity-0 hover:opacity-100 transition-opacity"
                              >
                                حذف
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsHelpModalOpen(false)}
                          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingTicket}
                          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingTicket ? 'جاري الإرسال...' : (
                            <>
                              <Send size={16} />
                              <span>إرسال التذكرة الآن</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Footer quick contact bar */}
              <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs lg:text-sm text-slate-700 mt-auto">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <span className="font-bold">
                    {appLang === 'en' 
                      ? 'Need urgent help or instant consultation? Contact us via WhatsApp: 0778091269'
                      : 'هل تحتاج مساعدة عاجلة أو استشارة فورية؟ تواصل معنا عبر واتساب: 0778091269'}
                  </span>
                </div>
                <a
                  href="https://wa.me/962778091269"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
                >
                  <span>{appLang === 'en' ? 'Instant WhatsApp Chat (0778091269)' : 'محادثة واتساب الفورية (0778091269)'}</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google-style Location Permission Banner/Modal */}
      {showLocationPromptModal && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-lg shadow-xs">
              📍
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900">
                {appLang === 'en' ? 'Allow location access?' : 'هل تود السماح بالوصول إلى موقعك الجغرافي؟'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {appLang === 'en' 
                  ? 'WaaS wants to know your location to automatically set your currency and find nearby services.' 
                  : 'تود منصة WaaS معرفة موقعك الجغرافي لتحديد العملة المناسبة لمتجرك وعرض أقرب الخدمات والخدمات اللوجستية تلقائياً.'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBlockLocation}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {appLang === 'en' ? 'Block' : 'حظر (رفض)'}
            </button>
            <button
              type="button"
              onClick={handleAllowLocation}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>{appLang === 'en' ? 'Allow' : 'سماح (Allow)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom In-App Confirmation Modal */}
      {customConfirm?.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{customConfirm.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">تنبيه تحذيري من الموقع</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {customConfirm.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomConfirm(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                موافق (تنفيذ)
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Notifications Full Page View */}
      <AnimatePresence>
        {isNotificationsModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 overflow-hidden" dir="rtl">
            {/* Header Banner */}
            <div className="px-6 lg:px-12 py-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Bell size={24} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900">مركز الإشعارات والتنبيهات 🔔</h2>
                  <p className="text-xs text-slate-500 font-medium">رسائل الإدارة وتحديثات تذاكر الدعم الفني الخاصة بك</p>
                </div>
              </div>
              <button
                onClick={() => setIsNotificationsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200 shadow-xs"
              >
                <X size={16} />
                <span>إغلاق الصفحة</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-6 max-w-4xl mx-auto w-full">
              {/* Stats & Actions Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                  <span>إجمالي الإشعارات: {userNotifications.length}</span>
                  <span className="text-slate-300">|</span>
                  <span>غير المقروءة: <strong className="text-blue-600">{userNotifications.filter(n => !(n.readBy || []).includes(user?.uid || user?.id || 'usr_default')).length}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadUserDataNotificationsAndTickets}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw size={13} className={loadingUserNotifs ? 'animate-spin' : ''} />
                    <span>تحديث القائمة</span>
                  </button>
                  <button
                    onClick={async () => {
                      const userId = user?.uid || user?.id || 'usr_default';
                      for (const n of userNotifications) {
                        if (n.id && !(n.readBy || []).includes(userId)) {
                          await markNotificationAsRead(n.id, userId);
                        }
                      }
                      loadUserDataNotificationsAndTickets();
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    تحديد الكل كمقروء ✅
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {/* Welcome & Sites Notice */}
                <div className="p-5 rounded-2xl border transition-all space-y-4 text-right bg-gradient-to-l from-blue-50 to-indigo-50 border-blue-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                      <h4 className="font-black text-blue-900 text-sm">مرحباً بك في منصة بُنيان! 🎉</h4>
                    </div>
                    <span className="text-[10px] text-blue-400 font-mono dir-ltr">
                      رسالة ترحيبية
                    </span>
                  </div>
                  <p className="relative z-10 text-xs text-blue-800 leading-relaxed font-bold">يسعدنا انضمامك إلى منصة بُنيان. نتمنى لك تجربة استثنائية في إدارة وتطوير أعمالك!</p>
                  
                  {combinedSites.length > 0 && (
                    <div className="relative z-10 space-y-2 pt-3 border-t border-blue-200/50">
                      <p className="text-[11px] font-black text-blue-900">مواقعك واشتراكاتك النشطة للوصول السريع:</p>
                      <div className="flex flex-wrap gap-2">
                        {combinedSites.map((site: any) => (
                          <button
                            key={`notif-site-${site.id}`}
                            onClick={() => {
                               setIsNotificationsModalOpen(false);
                               window.location.href = `/dashboard?impersonateTenantId=${site.tenantId || site.id}`;
                            }}
                            className="bg-white hover:bg-blue-600 text-blue-700 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-xs transition-all flex items-center gap-1.5 border border-blue-100 group"
                          >
                            <Store size={12} className="group-hover:text-blue-200" />
                            <span>{site.name || 'موقعي'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {userNotifications.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 p-8 space-y-3">
                    <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-800 text-sm">لا توجد إشعارات إضافية حالياً</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">ستظهر هنا أية تنبيهات مرسلة من الإدارة أو تحديثات بخصوص تذاكر الدعم الفني.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userNotifications.map((notif, idx) => {
                      const userId = user?.uid || user?.id || 'usr_default';
                      const isRead = (notif.readBy || []).includes(userId);
                      return (
                        <div
                          key={`user-notif-${notif.id || idx}`}
                          className={`p-4 rounded-2xl border transition-all space-y-2 text-right ${
                            !isRead
                              ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${!isRead ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                            <h4 className="font-black text-slate-900 text-sm">{notif.title}</h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono dir-ltr">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleString('ar-SA') : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{notif.message}</p>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-slate-100 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-slate-400">المرسل: {notif.sender || 'إدارة المنصة'}</span>
                            {(notif.type === 'ticket' || notif.ticketId || notif.title.includes('تذكرة') || notif.message.includes('تذكرتك')) && (
                              <button
                                onClick={async () => {
                                  if (notif.id && !isRead) {
                                    await markNotificationAsRead(notif.id, userId);
                                  }
                                  setIsNotificationsModalOpen(false);
                                  setHelpTab('my_tickets');
                                  setIsHelpModalOpen(true);
                                  loadUserDataNotificationsAndTickets();
                                }}
                                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 border border-amber-200 shadow-2xs"
                              >
                                <LifeBuoy size={13} />
                                <span>الاطلاع على التذكرة 🎧</span>
                              </button>
                            )}
                          </div>
                          {!isRead && (
                            <button
                              onClick={async () => {
                                if (notif.id) {
                                  await markNotificationAsRead(notif.id, userId);
                                  loadUserDataNotificationsAndTickets();
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                            >
                              تحديد كمقروء ✅
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms of Use Modal */}
      <AnimatePresence>
        {isTermsModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 overflow-hidden" dir="rtl">
            <div className="px-6 lg:px-12 py-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900">شروط الاستخدام والأحكام 📜</h2>
                  <p className="text-xs text-slate-500 font-medium">القواعد والسياسات المنظمة لاستخدام منصة بنيان والخدمات السحابية</p>
                </div>
              </div>
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200 shadow-xs"
              >
                <X size={16} />
                <span>إغلاق الصفحة</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-6 max-w-4xl mx-auto w-full text-right leading-relaxed">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 space-y-2">
                <h3 className="font-black text-indigo-900 text-base">مقدمة عامة</h3>
                <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                  باستخدامك لمنصة بنيان (Bunyan)، فإنك توافق تماماً على الالتزام بكافة الشروط والأحكام الواردة هنا. نرجو قراءة هذه الشروط بعناية قبل البدء في استخدام الخدمات أو استعراض القوالب الهندسية وتخصيص المواقع.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">1. قبول الشروط والأهلية القانونية</h4>
                  <p>يقر المستخدم بأنه ذو أهلية قانونية كاملة لاستخدام المنصة، ويوافق على الالتزام بجميع القوانين واللوائح المعمول بها.</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">2. حساب المستخدم وأمن البيانات</h4>
                  <p>أنت مسؤول تماماً عن الحفاظ على سرية بيانات حسابك وكلمة المرور، وعن كافة النشاطات التي تتم من خلال حسابك المسجل في المنصة.</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">3. الملكية الفكرية والقوالب الهندسية</h4>
                  <p>كافة القوالب، التصاميم، المخططات الهندسية، الأكواد البرمجية، والعلامات التجارية الموجودة في المنصة هي ملكية خاضعة لحقوق الطبع والنشر لصالح منصة بنيان ولا يحق نسخها أو إعادة توجيهها بشكل تجاري دون إذن خطي مسبق.</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">4. التعديلات والتحديثات</h4>
                  <p>تحتفظ الإدارة بحق تعديل أو تحديث هذه الشروط في أي وقت، وسيتم إشعار المستخدمين بالتغييرات الجوهرية عبر لوحة الإشعارات أو البريد المسجل.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setIsTermsModalOpen(false)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
                >
                  فهمت وقرأت الشروط ✅
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 overflow-hidden" dir="rtl">
            <div className="px-6 lg:px-12 py-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900">سياسة الخصوصية وحماية البيانات 🛡️</h2>
                  <p className="text-xs text-slate-500 font-medium">كيف نقوم بجمع، تخزين، وحماية بياناتك الشخصية والمعلومات الهندسية</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200 shadow-xs"
              >
                <X size={16} />
                <span>إغلاق الصفحة</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-6 max-w-4xl mx-auto w-full text-right leading-relaxed">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-2">
                <h3 className="font-black text-emerald-900 text-base">التزامنا بحماية خصوصيتك</h3>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  في منصة بنيان (Bunyan)، نولي أهمية قصوى لسرية وأمان بياناتك الشخصية وتفاصيل استوديوك الهندسي ومشاريعك. توضح هذه السياسة بشفافية كيفية التعامل مع بياناتك.
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">1. البيانات التي نقوم بجمعها</h4>
                  <p>نقوم بجمع البيانات الأساسية اللازمة لتقديم الخدمة مثل: الاسم، البريد الإلكتروني، رقم الهاتف، تفاصيل المشاريع والتصاميم التي تقرر حفظها داخل لوحة التحكم الخاصة بك.</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">2. استخدام البيانات</h4>
                  <p>تستخدم البيانات حصرياً لتحسين تجربتك، تفعيل المصادقة والتحقق الأمني، إرسال التحديثات الهامة وتذاكر الدعم الفني، وتقديم استشارات هندسية مخصصة حسب رغبتك.</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">3. حماية وتشفير المعلومات</h4>
                  <p>نستخدم أحدث التقنيات السحابية وقواعد البيانات المشفرة (مثل أمان Firebase وقواعد البيانات السحابية المعزولة) لمنع أي وصول غير مصرح به أو تسريب للبيانات.</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">4. حقوق المستخدم</h4>
                  <p>يحق لك في أي وقت طلب استعراض، تعديل، أو حذف بياناتك الشخصية بالكامل من خلال لوحة الإعدادات أو عبر التواصل المباشر مع فريق الدعم الفني.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer"
                >
                  أوافق وأفهم سياسة الخصوصية ✅
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Formal Tax Invoice Modal */}
      <AnimatePresence>
        {selectedInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] sm:max-h-[90vh]"
            >
              <div id="tax-invoice-printable" className="bg-white text-slate-800 flex flex-col">
                {/* Invoice Header */}
                <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
                      ب
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg">فاتورة ضريبية مبسطة 📄</h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-mono">منصة بنيان Bunyan Platform</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInvoiceModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer print:hidden"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Invoice Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs text-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">رقم الفاتورة</span>
                      <strong className="font-mono text-slate-900 text-xs sm:text-sm block">{selectedInvoiceModal.invoiceNo}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">تاريخ الإصدار</span>
                      <strong className="font-mono text-slate-900 text-xs sm:text-sm block">{selectedInvoiceModal.date?.substring(0,10)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">العميل / المستخدم</span>
                      <strong className="text-slate-900 text-xs sm:text-sm block">{selectedInvoiceModal.userName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">البريد الإلكتروني</span>
                      <strong className="text-slate-900 block font-mono text-[11px] sm:text-xs truncate">{selectedInvoiceModal.userEmail}</strong>
                    </div>
                    {selectedInvoiceModal.siteName && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">اسم الموقع / المتجر</span>
                        <strong className="text-slate-900 text-xs sm:text-sm block">{selectedInvoiceModal.siteName}</strong>
                      </div>
                    )}
                    {selectedInvoiceModal.templateId && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">رقم القالب (Template)</span>
                        <strong className="text-slate-900 block font-mono text-xs sm:text-sm">{selectedInvoiceModal.templateId}</strong>
                      </div>
                    )}
                    {selectedInvoiceModal.requestedDomainName && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">الدومين الخاص المخصص</span>
                        <strong className="text-blue-600 block font-mono text-xs sm:text-sm">{selectedInvoiceModal.requestedDomainName}</strong>
                      </div>
                    )}
                    {selectedInvoiceModal.endDate && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-[10px] text-slate-400 block font-bold">تاريخ انتهاء الاشتراك (التجديد)</span>
                        <strong className="font-mono text-emerald-700 text-xs sm:text-sm block">{selectedInvoiceModal.endDate?.substring(0,10)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    <div className="bg-slate-100 p-2.5 sm:p-3 font-extrabold text-slate-700 flex justify-between text-xs">
                      <span>الخدمة / تفاصيل الباقة</span>
                      <span>المبلغ المقيد</span>
                    </div>
                    <div className="p-2.5 sm:p-3 flex justify-between items-center font-bold text-xs sm:text-sm">
                      <span>اشتراك منصة بنيان - {selectedInvoiceModal.planName}</span>
                      <span className="text-blue-600 text-sm font-black">{selectedInvoiceModal.price}</span>
                    </div>
                    {selectedInvoiceModal.hasCustomDomain && (
                      <div className="p-2.5 sm:p-3 flex justify-between items-center text-xs text-slate-700 bg-slate-50">
                        <span>إضافة دومين مخصص ({selectedInvoiceModal.requestedDomainName || 'دومين خاص'})</span>
                        <span className="font-bold text-emerald-700">مشمول بالفاتورة</span>
                      </div>
                    )}
                    <div className="p-2.5 sm:p-3 flex justify-between items-center text-slate-500 text-[11px]">
                      <span>طريقة الدفع وسداد الرسوم</span>
                      <span className="font-bold text-slate-800">{selectedInvoiceModal.paymentMethod || 'بطاقة ائتمانية / بنيان Pay'}</span>
                    </div>
                    <div className="p-2.5 sm:p-3 flex justify-between items-center bg-emerald-50 text-emerald-800 font-extrabold text-xs">
                      <span>حالة الفاتورة والعملية</span>
                      <span className="bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full text-[10px]">مكتملة ومسددة بالكامل ✅</span>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-slate-600 text-[11px] leading-relaxed">
                    شكراً لاختيارك منصة بنيان. تعتبر هذه الفاتورة سنداً إلكترونياً رسمياً للعملية المالية التي تم إجراؤها.
                  </div>
                </div>
              </div>

              {/* Invoice Actions */}
              <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 print:hidden">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadInvoicePDF}
                    disabled={isGeneratingPDF}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>جاري إنشاء PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileDown size={15} />
                        <span>تحميل الفاتورة PDF 📥</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Printer size={15} />
                    <span>طباعة 🖨️</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedInvoiceModal(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Promotional Offer Popup Banner */}
      <PromoBannerModal 
        onSelectOffer={() => {
          const templatesSection = document.getElementById('templates') || document.querySelector('.templates-section');
          if (templatesSection) {
            templatesSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
    </>
  );
}

