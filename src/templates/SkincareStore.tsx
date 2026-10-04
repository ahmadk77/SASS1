import React, { useState, useRef } from 'react';
import { ShoppingCart, Search, Menu, Heart, ArrowRight, X, User, Truck, CheckCircle2, ShieldCheck, Sparkles, LogOut, MessageCircle, Shield, FileText, Upload, ChevronLeft, ChevronRight, Star, Tag, Percent, Droplets, Sun, Moon, Check, Trash2, Zap, Camera, AlertTriangle, Headphones, PhoneCall, Mail, Phone, Clock } from 'lucide-react';
import { loginWithGoogle, logout, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SupportWidget from '../components/SupportWidget';

interface SkincareProduct {
  id: string | number;
  title: string;
  price: number | string;
  originalPrice?: number | string;
  category: string;
  skinType?: string;
  primaryImage?: string;
  secondaryImage?: string;
  description?: string;
  stock?: number;
  inventoryStatus?: string;
  isUnlimitedStock?: boolean;
  ingredients?: string[];
  specs?: Record<string, string>;
}

interface SkincareTemplateProps {
  tenantName: string;
  content: any;
  tenant: any;
  setContent?: (content: any) => void;
}

const baseCategories = ['العناية بالبشرة', 'العناية بالجسم', 'مستحضرات التجميل', 'عطور', 'أدوات العناية'];
const skinTypesList = ['جميع أنواع البشرة', 'البشرة الجافة', 'البشرة الدهنية', 'البشرة المختلطة', 'البشرة الحساسة'];

const defaultProducts: SkincareProduct[] = [
  {
    id: 1,
    title: 'سيروم حمض الهيالورونيك النقي',
    price: 140,
    originalPrice: 180,
    category: 'العناية بالبشرة',
    skinType: 'جميع أنواع البشرة',
    primaryImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800',
    secondaryImage: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=800',
    description: 'سيروم مكثف لترطيب عميق واستعادة نضارة البشرة وتقليل مظهر الخطوط الدقيقة بفضل الجزيئات دقيقة التغلغل.',
    stock: 50,
    isUnlimitedStock: false,
    inventoryStatus: 'متوفر',
    ingredients: ['حمض الهيالورونيك', 'فيتامين ب5', 'مستخلص الألوفيرا'],
    specs: { 'الحجم': '30 مل', 'الاستخدام': 'صباحاً ومساءً', 'بلد المنشأ': 'كوريا الجنوبية' }
  },
  {
    id: 2,
    title: 'لوشن ترطيب الجسم الغني بزبدة الشيا',
    price: 95,
    originalPrice: 120,
    category: 'العناية بالجسم',
    skinType: 'البشرة الجافة',
    primaryImage: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800',
    description: 'لوشن حريري مغذٍ يمنح جسمك ترطيباً يدوم حتى 48 ساعة مع عطر مستخلص الزهور الطبيعية.',
    stock: 35,
    isUnlimitedStock: false,
    inventoryStatus: 'متوفر',
    ingredients: ['زبدة الشيا العضوية', 'زيت اللوز الحلو', 'فيتامين E'],
    specs: { 'الحجم': '250 مل', 'الملمس': 'كريمي خفيف غير دهني' }
  },
  {
    id: 3,
    title: 'غسول رغوي لطيف للبشرة الحساسة',
    price: 110,
    category: 'العناية بالبشرة',
    skinType: 'البشرة الحساسة',
    primaryImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800',
    description: 'ينظف الشوائب والزيوت الزائدة بعمق دون التسبب في جفاف الجلد أو تهيجه.',
    stock: 80,
    isUnlimitedStock: false,
    inventoryStatus: 'متوفر',
    ingredients: ['مستخلص البابونج', 'الجلسرين النباتي', 'آلانتوين'],
    specs: { 'الحجم': '150 مل', 'الرغوة': 'ناعمة وخالية من الصابون' }
  },
  {
    id: 4,
    title: 'مقشر الجسم بالسكر والقهوة العضوية',
    price: 130,
    originalPrice: 160,
    category: 'العناية بالجسم',
    skinType: 'جميع أنواع البشرة',
    primaryImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800',
    description: 'مقشر طبيعي ينشط الدورة الدموية، يزيل الخلايا الميتة ويترك البشرة ناعمة كالحرير.',
    stock: 20,
    isUnlimitedStock: false,
    inventoryStatus: 'متوفر',
    ingredients: ['حبوب القهوة المطحونة', 'سكر القصب العضوي', 'زيت جوز الهند'],
    specs: { 'الوزن': '250 جم', 'الاستخدام': 'مرتين أسبوعياً' }
  },
  {
    id: 5,
    title: 'كريم مرطب واقي الشمس SPF 50+',
    price: 155,
    category: 'العناية بالبشرة',
    skinType: 'جميع أنواع البشرة',
    primaryImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800',
    description: 'حماية فائقة واسعة المدى ضد أشعة الشمس الضارة UVA وUVB مع تركيبة خفيفة لا تترك أثراً أبيض.',
    stock: 60,
    isUnlimitedStock: false,
    inventoryStatus: 'متوفر',
    ingredients: ['أكسيد الزنك الطبيعي', 'نياسيناميد', 'مستخلص الشاي الأخضر'],
    specs: { 'الحجم': '50 مل', 'الحماية': 'SPF 50+ PA++++' }
  },
  {
    id: 6,
    title: 'مجموعة العناية المسائية المتكاملة',
    price: 320,
    originalPrice: 400,
    category: 'العناية بالبشرة',
    skinType: 'جميع أنواع البشرة',
    primaryImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=800',
    description: 'مجموعة فاخرة تضم غسول، سيروم ليلي تجديدي، وكريم مرطب لإشراقة صباحية مذهلة.',
    stock: 15,
    isUnlimitedStock: false,
    inventoryStatus: 'متوفر',
    ingredients: ['ريتينول نقي', 'ببتيدات', 'حمض الهيالورونيك'],
    specs: { 'المحتويات': '3 قطع أساسية', 'النتائج': 'ظاهرة خلال أسبوعين' }
  }
];

export default function SkincareStoreTemplate({ tenantName, content, tenant, setContent }: SkincareTemplateProps) {
  const storeName = content?.businessName || tenantName || 'متجر العناية والجمال';
  const storeCurrency = content?.currencySymbol || content?.currency || 'ريال';
  const heroTitle = content?.heroTitle || 'اكتشفي جمالك الطبيعي';
  const heroSubtitle = content?.heroSubtitle || 'أفضل منتجات العناية بالبشرة والجسم بمكونات طبيعية 100% لبشرة مشرقة وصحية.';
  const heroImage = content?.heroImage || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedSkinType, setSelectedSkinType] = useState('الكل');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activeModalProduct, setActiveModalProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(true);
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'support' | null>(null);
  
  // Checkout & Orders
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [lastSubmittedOrderId, setLastSubmittedOrderId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [feedbackInput, setFeedbackInput] = useState<{id: string, text: string}>({ id: '', text: '' });
  const [customerAddress, setCustomerAddress] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingTab, setTrackingTab] = useState<'current' | 'previous'>('current');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Routine Quiz State
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({ skinType: '', concern: '' });

  // Support State
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [supportCategory, setSupportCategory] = useState('استفسار عن طلب');

  React.useEffect(() => {
    if (isCartOpen || isFavoritesOpen || isTrackingOpen || activeModalProduct || isCheckoutOpen || activePolicy || quizOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen, isFavoritesOpen, isTrackingOpen, activeModalProduct, isCheckoutOpen, activePolicy, quizOpen]);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setCustomerName(u.displayName || '');
        // Record store login in DB
        try {
          await fetch('/api/public/websites/' + (tenant?.subdomain || tenant?.id || 'demo') + '/store-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: u.email,
              name: u.displayName,
              photoUrl: u.photoURL,
              favorites: favorites.map((f: any) => f.id || f)
            })
          });
          // Fetch user orders from DB
          const res = await fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/user-orders?email=${encodeURIComponent(u.email || '')}`);
          if (res.ok) {
            const data = await res.json();
            if (data.orders && Array.isArray(data.orders)) {
              setUserOrders(data.orders);
            }
          }
        } catch (err) {
          console.error('Error logging store user:', err);
        }
      }
    });
    return () => unsub();
  }, [tenant?.subdomain, tenant?.id]);

  const fetchLiveOrders = async () => {
    if (user?.email) {
      try {
        const res = await fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/user-orders?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            setUserOrders(data.orders);
          }
        }
      } catch (err) {
        console.error('Error fetching live user orders:', err);
      }
    } else {
      const saved = localStorage.getItem('skincare_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        const orderIds = parsed.map((o: any) => o.id).filter(Boolean);
        if (orderIds.length > 0) {
          fetch(`/api/public/websites/${tenant?.subdomain || 'demo'}/orders/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIds })
          })
          .then(res => res.json())
          .then(data => {
             if (data.orders && data.orders.length > 0) {
               setUserOrders(data.orders);
               localStorage.setItem('skincare_orders', JSON.stringify(data.orders));
             }
          })
          .catch(e => console.warn('Failed to sync guest orders', e));
        }
      }
    }
  };

  React.useEffect(() => {
    fetchLiveOrders();
    let interval: any;
    if (isTrackingOpen) {
      interval = setInterval(fetchLiveOrders, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.email, tenant?.subdomain, tenant?.id, isTrackingOpen]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('skincare_orders');
      if (saved && (!userOrders || userOrders.length === 0)) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setUserOrders(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load skincare orders:', e);
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const u = await loginWithGoogle();
      if (u) {
        setUser(u);
        setCustomerName(u.displayName || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Promo code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponBanner, setCouponBanner] = useState<{ show: boolean; msg: string; type: 'success' | 'error' } | null>(null);

  const getAllImages = (p: any): string[] => {
    const imgs: string[] = [];
    if (p.primaryImage) imgs.push(p.primaryImage);
    if (p.image && !imgs.includes(p.image)) imgs.push(p.image);
    if (p.secondaryImage && !imgs.includes(p.secondaryImage)) imgs.push(p.secondaryImage);
    if (Array.isArray(p.images)) {
      p.images.forEach((img: string) => {
        if (img && !imgs.includes(img)) imgs.push(img);
      });
    }
    if (imgs.length === 0) imgs.push('https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800');
    return imgs;
  };

  const [modalActiveImage, setModalActiveImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const [productReviews, setProductReviews] = useState<any[]>([
    { id: 1, customerName: 'سارة خالد', rating: 5, comment: 'منتج ممتاز جداً ونتيجة واضحة خلال أيام.', date: 'قبل يومين' },
    { id: 2, customerName: 'منى الأحمد', rating: 5, comment: 'ترطيب عالي وملمس خفيف على البشرة.', date: 'قبل أسبوع' }
  ]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewPhoto, setNewReviewPhoto] = useState('');

  const handleImageScroll = () => {
    if (!imageScrollRef.current) return;
    const scrollLeft = imageScrollRef.current.scrollLeft;
    const width = imageScrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    if (!isNaN(index) && index >= 0) {
      setActiveImageIndex(index);
    }
  };

  const handleOpenProductModal = (product: any) => {
    setActiveModalProduct(product);
    setActiveImageIndex(0);
    setQuantity(1);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim() || !newReviewName.trim()) {
      showToast('الرجاء إدخال الاسم وتقييمك');
      return;
    }
    const review = {
      id: Date.now(),
      customerName: newReviewName,
      rating: newReviewRating,
      comment: newReviewText,
      image: newReviewPhoto || null,
      date: 'الآن'
    };
    setProductReviews([review, ...productReviews]);
    setNewReviewText('');
    setNewReviewName('');
    setNewReviewPhoto('');
    showToast('تم إضافة تقييمك بنجاح!');
  };

  const rawProductsList = (Array.isArray(content?.items) && content.items.length > 0)
    ? content.items
    : ((Array.isArray(content?.products) && content.products.length > 0) ? content.products : defaultProducts);

  const rawProducts = rawProductsList.map((p: any) => {
    const stockVal = p.stock !== undefined ? Number(p.stock) : (p.isUnlimitedStock || p.unlimitedStock ? 9999 : 20);
    const isOut = stockVal <= 0 || p.inventoryStatus === 'نفذت الكمية' || p.inventoryStatus === 'غير متوفر' || p.inventoryStatus === 'نفد من المخزون';
    return {
      ...p,
      stock: stockVal,
      inventoryStatus: isOut ? 'نفذت الكمية' : (stockVal <= 5 ? 'كمية محدودة' : 'متوفر'),
    };
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatPrice = (val: any): string => {
    if (val === undefined || val === null || val === '') return `0 ${storeCurrency}`;
    const str = String(val).trim();
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return str;
    return `${num.toLocaleString()} ${storeCurrency}`;
  };

  const subtotal = cart.reduce((sum, item) => {
    const p = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
    return sum + p * (item.quantity || 1);
  }, 0);

  const configuredShippingFee = content?.shippingFee !== undefined
    ? Number(content.shippingFee)
    : (content?.deliveryFee !== undefined ? Number(content.deliveryFee) : 15);

  const deliveryFee = subtotal > 0 ? configuredShippingFee : 0;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || promoCodeInput || '').trim().toUpperCase();
    if (!code) return;

    const promoCodesList = Array.isArray(content?.promoCodes) && content.promoCodes.length > 0
      ? content.promoCodes
      : Array.isArray(content?.coupons) && content.coupons.length > 0
      ? content.coupons
      : [
          { code: 'SKIN10', discountPercent: 10 },
          { code: 'SAVE15', discountPercent: 15 },
          { code: 'PROMO20', discountPercent: 20 },
          { code: 'OFF10', discountPercent: 10 }
        ];

    const found = promoCodesList.find((c: any) => (c.code || c.name || '').toString().toUpperCase() === code);
    if (!found) {
      setCouponBanner({ show: true, msg: `❌ كود الخصم "${code}" غير صحيح أو غير فعال حالياً.`, type: 'error' });
      showToast(`كود الخصم "${code}" غير صحيح أو غير فعال`);
      return;
    }

    if (found) {
      const minOrders = Number(found.minPriorOrders) || 0;
      if (minOrders > 0 && userOrders.length < minOrders) {
        setCouponBanner({ show: true, msg: `⚠️ يلزم إكمال ${minOrders} طلبات سابقة لاستخدام هذا الكود (لديك ${userOrders.length} طلبات).`, type: 'error' });
        showToast(`⚠️ يلزم إكمال ${minOrders} طلبات سابقة لاستخدام هذا الكود`);
        return;
      }

      const maxUses = Number(found.maxUsesPerUser) || 0;
      if (maxUses > 0) {
        const userUsesCount = userOrders.filter((o: any) => 
          String(o.promoCode || o.details?.promoCode || '').toUpperCase() === code
        ).length;
        if (userUsesCount >= maxUses) {
          setCouponBanner({ show: true, msg: `⚠️ تم استنفاد الحد الأقصى لاستخدام الكود (${maxUses} مرات).`, type: 'error' });
          showToast(`⚠️ تم استنفاد الحد الأقصى لاستخدام الكود (${maxUses} مرات)`);
          return;
        }
      }

      const minCart = Number(found.minCartAmount) || 0;
      if (minCart > 0 && subtotal < minCart) {
        setCouponBanner({ show: true, msg: `⚠️ الحد الأدنى لقيمة السلة لهذا الكود هو ${minCart} ${storeCurrency} (قيمة السلة: ${subtotal} ${storeCurrency}).`, type: 'error' });
        showToast(`⚠️ الحد الأدنى لقيمة السلة هو ${minCart} ${storeCurrency}`);
        return;
      }

      const maxCart = Number(found.maxCartAmount) || 0;
      if (maxCart > 0 && subtotal > maxCart) {
        setCouponBanner({ show: true, msg: `⚠️ الحد الأقصى لقيمة السلة لهذا الكود هو ${maxCart} ${storeCurrency}.`, type: 'error' });
        showToast(`⚠️ الحد الأقصى لقيمة السلة هو ${maxCart} ${storeCurrency}`);
        return;
      }
    }

    const discountPercent = Number(found.discountPercent || found.discount || 10);
    setAppliedCoupon({ code: found.code || code, discountPercent });
    setCouponBanner({ show: true, msg: `🎉 تمت إضافة نسبة خصم ${discountPercent}% بنجاح! (كود الخصم: ${found.code || code})`, type: 'success' });
    showToast(`تم تطبيق كود الخصم (${found.code || code}) بنجاح! خصم ${discountPercent}%`);
    setPromoCodeInput('');
  };

  const addToCart = (product: any, qty = 1) => {
    const productStock = product.stock !== undefined ? Number(product.stock) : (product.isUnlimitedStock ? 9999 : 20);
    const isOut = productStock <= 0 || product.inventoryStatus === 'نفذت الكمية' || product.inventoryStatus === 'غير متوفر' || product.inventoryStatus === 'نفد من المخزون';

    if (isOut) {
      showToast(`⚠️ هذا المنتج ("${product.title || product.name}") نفذت كميته من المخزون!`);
      return;
    }

    const currentInCart = cart.find(item => item.id === product.id)?.quantity || 0;
    if (currentInCart + qty > productStock) {
      showToast(`⚠️ عذراً، الكمية المتاحة في المخزون لهذا المنتج هي ${productStock} قطع فقط!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, stock: productStock, quantity: qty }];
    });
    showToast(`تمت إضافة "${product.title || product.name}" إلى سلة التسوق`);
  };

  const toggleFavorite = (product: any) => {
    setFavorites(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast('تمت الإزالة من المفضلة');
        return prev.filter(item => item.id !== product.id);
      } else {
        showToast('تمت الإضافة للمفضلة');
        return [...prev, product];
      }
    });
  };

  const handleCancelCustomerOrder = (orderId: string | number) => {
    setConfirmModal({
      isOpen: true,
      title: 'إلغاء الطلب ⚠️',
      message: 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم إيقاف تجهيز الطلب نهائياً.',
      confirmText: 'نعم، إلغاء الطلب',
      cancelText: 'تراجع والاحتفاظ بالطلب',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await fetch(`/api/public/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user?.email })
          });

          setUserOrders(prev => prev.map(o => String(o.id) === String(orderId) ? { ...o, status: 'customer_cancelled', details: { ...o.details, cancelledBy: 'customer' } } : o));

          try {
            const saved = localStorage.getItem('skincare_orders');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const updatedLocal = parsed.map((o: any) => String(o.id) === String(orderId) ? { ...o, status: 'customer_cancelled' } : o);
                localStorage.setItem('skincare_orders', JSON.stringify(updatedLocal));
              }
            }
          } catch (e) {}

          showToast('تم إلغاء الطلب بنجاح');
        } catch (err) {
          console.error('Failed to cancel order:', err);
          showToast('حدث خطأ أثناء إلغاء الطلب');
        }
      }
    });
  };

    const handleFeedbackSubmit = async (orderId: string, phone: string, text: string, cleared: boolean) => {
    try {
      const res = await fetch(`/api/public/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || user?.phoneNumber || '0000', feedback: text, cleared })
      });
      if (res.ok) {
        if (user) {
           const res2 = await fetch(`/api/public/websites/${tenant?.subdomain || 'demo'}/user-orders?email=${encodeURIComponent(user.email || '')}`);
           if (res2.ok) {
             const data = await res2.json();
             setUserOrders(data.orders || []);
           }
        }
        setFeedbackInput({ id: '', text: '' });
      }
    } catch(e) { console.error(e); }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    let activeUser = user;
    if (!activeUser) {
      showToast('عفواً، يجب تسجيل الدخول أو إنشاء حساب لإتمام الطلب');
      try {
        const u = await loginWithGoogle();
        if (!u) {
          showToast('تسجيل الدخول مطلوب لإتمام الطلب');
          return;
        }
        activeUser = u;
        setUser(u);
        if (!customerName) setCustomerName(u.displayName || '');
      } catch (err) {
        showToast('فشل تسجيل الدخول، يرجى المحاولة مرة أخرى');
        return;
      }
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      showToast('الرجاء إدخال بيانات التوصيل كاملة');
      return;
    }
    const orderId = 'SKN-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      id: orderId,
      templateId: 15,
      storeType: 'skincare',
      storeName: storeName || 'متجر العناية والجمال',
      date: new Date().toLocaleDateString('ar-SA'),
      createdAt: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discountAmount,
      promoCode: appliedCoupon ? appliedCoupon.code : null,
      discountPercent: appliedCoupon ? appliedCoupon.discountPercent : 0,
      shippingFee: deliveryFee,
      total: finalTotal,
      status: 'قيد المراجعة والتجهيز',
      customer: { name: customerName, phone: customerPhone, address: customerAddress }
    };

    const updated = [newOrder, ...userOrders];
    setUserOrders(updated);

    try {
      localStorage.setItem('skincare_orders', JSON.stringify(updated));
      if (tenant?.subdomain) {
        localStorage.setItem(`skincare_orders_${tenant?.subdomain}`, JSON.stringify(updated));
      }
      const existingGlobal = JSON.parse(localStorage.getItem('orders') || '[]');
      localStorage.setItem('orders', JSON.stringify([newOrder, ...existingGlobal]));
    } catch (err) {
      console.error('Error saving order:', err);
    }

    // Deduct stock in content items/products if setContent is available
    if (setContent) {
      const currentItems = (Array.isArray(content?.items) && content.items.length > 0)
        ? content.items
        : ((Array.isArray(content?.products) && content.products.length > 0) ? content.products : defaultProducts);

      const updatedItems = currentItems.map((prod: any) => {
        const cartItem = cart.find((c: any) => String(c.id) === String(prod.id) || c.title === prod.title || c.name === prod.title);
        if (!cartItem) return prod;
        const currentStock = prod.stock !== undefined ? Number(prod.stock) : 20;
        const qtyDeducted = cartItem.quantity || 1;
        const finalStock = Math.max(0, currentStock - qtyDeducted);
        return {
          ...prod,
          stock: finalStock,
          inventoryStatus: finalStock <= 0 ? 'نفذت الكمية' : (finalStock <= 5 ? 'كمية محدودة' : 'متوفر')
        };
      });

      setContent({
        ...content,
        items: updatedItems,
        products: updatedItems
      });
    }

    // 1. Immediately display success and update local state
    window.dispatchEvent(new CustomEvent('SKINCARE_NEW_ORDER', { detail: newOrder }));
    setLastSubmittedOrderId(orderId);
    setCheckoutComplete(true);
    setCart([]);
    showToast('تم إرسال طلبك بنجاح!');

    // 2. Submit order to server database asynchronously in background
    fetch('/api/public/websites/' + (tenant?.subdomain || tenant?.id || 'demo') + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerPhone,
        customerEmail: activeUser?.email || null,
        type: 'skincare_order',
        details: {
          address: customerAddress,
          paymentMethod: 'cash_on_delivery',
          items: cart,
          promoCode: appliedCoupon ? appliedCoupon.code : null,
          discountPercent: appliedCoupon ? appliedCoupon.discountPercent : 0,
          discountAmount,
          shippingFee: deliveryFee,
          subtotal,
          finalTotal,
          total: finalTotal
        },
        items: cart,
        totalPrice: String(finalTotal)
      })
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const savedOrder = data.inserted?.[0] || data.order;
        if (savedOrder && savedOrder.id && savedOrder.id !== newOrder.id) {
          setUserOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, id: savedOrder.id } : o));
        }
      }
    }).catch(err => console.error('Error submitting order to server:', err));
  };

  const filteredProducts = rawProducts.filter((p: any) => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchesSkin = selectedSkinType === 'الكل' || p.skinType === selectedSkinType || !p.skinType;
    return matchesSearch && matchesCategory && matchesSkin;
  });

  return (
    <div className="min-h-screen bg-rose-50/30 text-slate-800 font-sans selection:bg-rose-200 selection:text-rose-900" dir="rtl">
      
      {/* Top Announcement Bar */}
      {content?.announcementEnabled !== false && isAnnouncementOpen && (
        <div 
          className={`py-2 px-3 sm:py-2.5 sm:px-4 text-center overflow-hidden text-[11px] sm:text-xs relative flex items-center justify-between ${
            content?.announcementAnimation === 'pulse' ? 'animate-pulse' : 
            content?.announcementAnimation === 'bounce' ? 'animate-bounce' : ''
          }`}
          style={{
            backgroundColor: content?.announcementBgColor || '#be123c',
            color: content?.announcementTextColor || '#ffffff',
            fontWeight: content?.announcementIsBold !== false ? '900' : '500',
          }}
        >
          <div className="flex-1 text-center">
            {content?.announcementAnimation === 'marquee-right' || content?.announcementAnimation === 'marquee-left' ? (
              <marquee direction={content?.announcementAnimation === 'marquee-right' ? 'left' : 'right'} scrollamount="12" scrolldelay="1" className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
                <span className="inline-flex items-center gap-12">
                  <span>{content?.announcementText || '🌸 شحن مجاني لكافة الطلبات فوق 200 ريال + هدايا مجانية مع كل طلب'}</span>
                  <span>{content?.announcementText || '🌸 شحن مجاني لكافة الطلبات فوق 200 ريال + هدايا مجانية مع كل طلب'}</span>
                </span>
              </marquee>
            ) : (
              <div className="text-[11px] sm:text-xs flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 leading-snug sm:leading-relaxed px-1">
                <span>{content?.announcementText || '🌸 شحن مجاني لكافة الطلبات فوق 200 ريال + هدايا مجانية مع كل طلب'}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsAnnouncementOpen(false)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white shrink-0 mr-2 text-xs font-bold cursor-pointer"
            title="إخفاء الشريط"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium flex items-center gap-3 animate-bounce border border-slate-700/50">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-rose-50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedCategory('الكل'); setSearchQuery(''); }}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">{storeName}</h1>
                <p className="text-xs text-rose-600 font-medium">عناية طبيعية متكاملة</p>
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => { setSelectedCategory('الكل'); setSelectedSkinType('الكل'); }} className="hover:text-rose-600 transition-colors">الرئيسية</button>
            <button onClick={() => setSelectedCategory('العناية بالبشرة')} className="hover:text-rose-600 transition-colors">العناية بالبشرة</button>
            <button onClick={() => setSelectedCategory('العناية بالجسم')} className="hover:text-rose-600 transition-colors">العناية بالجسم</button>
            <button onClick={() => setQuizOpen(true)} className="flex items-center gap-1.5 text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors">
              <Sparkles className="w-4 h-4" />
              <span>اختبري بشرتك</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <button 
                onClick={() => { logout(); setUser(null); setCustomerName(''); }}
                className="hidden lg:flex relative p-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors items-center gap-1.5 px-3"
                title="تسجيل خروج"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[100px]">{user.displayName || 'حسابي'}</span>
              </button>
            ) : (
              <button 
                onClick={handleGoogleLogin}
                className="hidden lg:flex relative p-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors items-center gap-1.5 px-3"
                title="تسجيل الدخول باستخدام جوجل"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-bold">تسجيل الدخول</span>
              </button>
            )}
            <button 
              onClick={() => setIsTrackingOpen(true)}
              className="hidden sm:flex relative p-2 sm:p-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors items-center gap-1.5 px-2 sm:px-3"
              title="تتبع الطلبات"
            >
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-xs font-bold">طلباتي</span>
              {userOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-rose-600 text-white text-[10px] sm:text-[11px] rounded-full flex items-center justify-center font-bold">
                  {userOrders.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsFavoritesOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
              title="المفضلة"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-rose-600 text-white text-[10px] sm:text-[11px] rounded-full flex items-center justify-center font-bold">
                  {favorites.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 shadow-sm"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs font-bold">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden flex justify-end" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-3/4 max-w-xs bg-white h-full shadow-2xl flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-rose-100 p-6 pb-4">
              <h3 className="font-bold text-base text-slate-900">القائمة</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-black"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 flex-1 space-y-6">
              <div>
                <button 
                  onClick={() => { setQuizOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-700 py-3 rounded-2xl font-bold text-xs mb-4"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>اكتشفي روتينك المخصص</span>
                </button>

                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase px-2">تصفح الأقسام</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory('الكل'); setIsMobileMenuOpen(false); }}
                    className={`w-full text-right py-2.5 px-4 rounded-xl text-xs font-semibold ${selectedCategory === 'الكل' ? 'bg-rose-50 text-rose-700' : 'hover:bg-slate-50 text-slate-700'}`}
                  >
                    جميع الأقسام
                  </button>
                  {baseCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right py-2.5 px-4 rounded-xl text-xs font-semibold ${selectedCategory === cat ? 'bg-rose-50 text-rose-700' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-1">
                 <button onClick={() => { setIsMobileMenuOpen(false); setIsTrackingOpen(true); }} className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <div className="flex items-center gap-3">
                      <Truck size={16} className="text-rose-500" /> تتبع الطلبات
                    </div>
                    {userOrders.length > 0 && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{userOrders.length}</span>}
                 </button>
                 <button onClick={() => { setIsMobileMenuOpen(false); setIsFavoritesOpen(true); }} className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <div className="flex items-center gap-3">
                      <Heart size={16} className="text-rose-500" /> المفضلة
                    </div>
                    {favorites.length > 0 && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{favorites.length}</span>}
                 </button>
                 <button onClick={() => { setIsMobileMenuOpen(false); setActivePolicy('support'); }} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <Headphones size={16} /> الدعم الفني
                 </button>
                 <button onClick={() => { setIsMobileMenuOpen(false); setActivePolicy('privacy'); }} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <Shield size={16} /> سياسة الخصوصية
                 </button>
                 <button onClick={() => { setIsMobileMenuOpen(false); setActivePolicy('terms'); }} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <FileText size={16} /> شروط الاستخدام
                 </button>
              </div>

              {/* User Profile / Login Area in Sidebar */}
              <div className="mt-auto border-t border-rose-100 pt-4 pb-2">
                 {user ? (
                   <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                     <div className="flex items-center gap-3">
                       {user.photoURL ? (
                         <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                       ) : (
                         <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                           {user.displayName?.charAt(0) || 'U'}
                         </div>
                       )}
                       <div>
                         <div className="font-bold text-slate-900 text-sm line-clamp-1">{user.displayName}</div>
                         <div className="text-[10px] text-slate-500 line-clamp-1">{user.email}</div>
                       </div>
                     </div>
                     <button onClick={() => { setIsMobileMenuOpen(false); logout(); setUser(null); setCustomerName(''); }} className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-rose-100 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                        <LogOut size={14} /> تسجيل خروج
                     </button>
                   </div>
                 ) : (
                   <div className="bg-slate-50 rounded-2xl p-4 text-center space-y-3">
                     <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                       <User size={24} />
                     </div>
                     <h4 className="font-bold text-slate-900 text-sm">أهلاً بك في متجرنا</h4>
                     <p className="text-[10px] text-slate-500">سجل دخولك لتتمكن من تتبع طلباتك وحفظ منتجاتك المفضلة.</p>
                     <button onClick={() => { setIsMobileMenuOpen(false); handleGoogleLogin(); }} className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm">
                        <User size={14} /> تسجيل الدخول باستخدام جوجل
                     </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-100/60 via-pink-50/30 to-white py-10 sm:py-16 border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 sm:space-y-6 text-right">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-rose-100 text-rose-700 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> منتجات طبيعية 100% معتمدة
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                onClick={() => {
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-rose-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg shadow-rose-600/25 hover:bg-rose-700 transition-all flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <span>تسوقي المنتجات الآن</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setQuizOpen(true)}
                className="bg-white border border-rose-200 text-rose-700 px-8 py-4 rounded-2xl font-bold hover:bg-rose-50 transition-all text-sm cursor-pointer shadow-xs"
              >
                اكتشفي روتينك المخصص
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-300/30 to-pink-300/30 rounded-3xl blur-2xl -z-10"></div>
            <img 
              src={heroImage} 
              alt="Skincare Hero" 
              className="rounded-3xl shadow-2xl object-cover w-full h-[250px] sm:h-[460px] border-4 border-white"
            />
          </div>
        </div>
      </section>

      {/* Main Products Section */}
      <main id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search & Filters */}
        <div className="space-y-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحثي عن سيروم، غسول، مرطب..."
                className="w-full bg-white border border-rose-100 rounded-2xl pr-12 pl-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Categories Bar */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              <button
                onClick={() => setSelectedCategory('الكل')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'الكل' 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' 
                    : 'bg-white text-slate-600 hover:bg-rose-50 border border-rose-100'
                }`}
              >
                جميع الأقسام
              </button>
              {baseCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' 
                      : 'bg-white text-slate-600 hover:bg-rose-50 border border-rose-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-500 ml-2 whitespace-nowrap">نوع البشرة:</span>
            {skinTypesList.map(st => (
              <button
                key={st}
                onClick={() => setSelectedSkinType(st)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSkinType === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-rose-100 p-8 shadow-xs">
            <Sparkles className="w-12 h-12 text-rose-300 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">لا توجد منتجات مطابقة لبحثك</h3>
            <p className="text-sm text-slate-500 mb-6">جربي تغيير كلمات البحث أو اختيار قسم آخر.</p>
            <button 
              onClick={() => { setSelectedCategory('الكل'); setSelectedSkinType('الكل'); setSearchQuery(''); }}
              className="bg-rose-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product: any) => {
              const isFav = favorites.some(f => f.id === product.id);
              const priceNum = parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;
              const origNum = product.originalPrice ? parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, '')) : null;
              const discountPercent = origNum && origNum > priceNum ? Math.round(((origNum - priceNum) / origNum) * 100) : null;
              const isOut = product.stock <= 0 || product.inventoryStatus === 'نفذت الكمية';
              const isLow = !isOut && product.stock <= 5;

              return (
                <div 
                  key={product.id}
                  className={`bg-white rounded-2xl sm:rounded-3xl border border-rose-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative ${isOut ? 'opacity-85' : ''}`}
                >
                  {/* Badge & Favorite */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex flex-col gap-2">
                    <button 
                      onClick={() => toggleFavorite(product)}
                      className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl backdrop-blur-md transition-all ${
                        isFav ? 'bg-rose-600 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'
                      } shadow-sm`}
                    >
                      <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {isOut ? (
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-red-600 text-white text-[9px] sm:text-[11px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
                      نفذت الكمية ❌
                    </div>
                  ) : discountPercent ? (
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-rose-600 text-white text-[9px] sm:text-[11px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
                      خصم {discountPercent}%
                    </div>
                  ) : null}

                  {/* Image Container */}
                  <div 
                    className="relative h-40 sm:h-64 overflow-hidden bg-rose-50/50 cursor-pointer"
                    onClick={() => handleOpenProductModal(product)}
                  >
                    <img 
                      src={product.primaryImage || product.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800'} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-[9px] sm:text-xs text-rose-600 font-semibold">
                        <span className="line-clamp-1">{product.category}</span>
                        {product.skinType && <span className="bg-rose-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg hidden sm:block">{product.skinType}</span>}
                      </div>
                      <h3 
                        onClick={() => handleOpenProductModal(product)}
                        className="font-bold text-slate-900 text-xs sm:text-base line-clamp-2 cursor-pointer hover:text-rose-600 transition-colors leading-tight"
                      >
                        {product.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Stock Status Indicator */}
                      <div className="pt-1">
                        {isOut ? (
                          <span className="inline-block text-[9px] sm:text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md font-bold">
                            ❌ غير متوفر بالمخزون
                          </span>
                        ) : isLow ? (
                          <span className="inline-block text-[9px] sm:text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold animate-pulse">
                            ⚠️ متبقي {product.stock} قطع فقط!
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] sm:text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                            ✓ متوفر ({product.stock} قطعة)
                          </span>
                        )}
                      </div>

                      {/* Ingredients tags */}
                      {product.ingredients && product.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1">
                          {product.ingredients.slice(0, 2).map((ing: string, idx: number) => (
                            <span key={idx} className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded-md font-medium">
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm sm:text-lg font-extrabold text-slate-900">{formatPrice(product.price)}</div>
                        {origNum && (
                          <div className="text-[9px] sm:text-xs text-slate-400 line-through">{formatPrice(origNum)}</div>
                        )}
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        disabled={isOut}
                        className={`w-full sm:w-auto px-2 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 sm:gap-2 ${
                          isOut 
                            ? 'bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="sm:inline">{isOut ? 'غير متوفر' : 'إضافة'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Routine Creator / Skincare Quiz Modal */}
      {quizOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-rose-100">
            <button 
              onClick={() => { setQuizOpen(false); setQuizStep(1); }}
              className="absolute top-6 left-6 p-2 rounded-full text-slate-400 hover:bg-rose-50 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-8">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">مستشار البشرة الذكي</h2>
              <p className="text-xs text-slate-500">أجيب باختصار لنقترح عليك الروتين المثالي لبشرتك</p>
            </div>

            {quizStep === 1 && (
              <div className="space-y-6">
                <h3 className="font-bold text-sm text-slate-800">1. ما هو نوع بشرتك الأساسي؟</h3>
                <div className="grid grid-cols-1 gap-3">
                  {skinTypesList.map(st => (
                    <button
                      key={st}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, skinType: st }))}
                      className={`p-4 rounded-2xl border text-right text-sm font-semibold transition-all ${
                        quizAnswers.skinType === st 
                          ? 'border-rose-600 bg-rose-50 text-rose-900' 
                          : 'border-slate-200 hover:border-rose-300 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  disabled={!quizAnswers.skinType}
                  onClick={() => setQuizStep(2)}
                  className="w-full bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-rose-600/25 hover:bg-rose-700 transition-colors"
                >
                  التالي
                </button>
              </div>
            )}

            {quizStep === 2 && (
              <div className="space-y-6">
                <h3 className="font-bold text-sm text-slate-800">2. ما هي المشكلة الأساسية التي ترغبين في حلها؟</h3>
                <div className="grid grid-cols-1 gap-3">
                  {['الجفاف وفقدان الترطيب', 'البحبوب والشوائب', 'الخطوط الدقيقة وعلامات التقدم في العمر', 'البهتان وفقدان النضارة'].map(c => (
                    <button
                      key={c}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, concern: c }))}
                      className={`p-4 rounded-2xl border text-right text-sm font-semibold transition-all ${
                        quizAnswers.concern === c 
                          ? 'border-rose-600 bg-rose-50 text-rose-900' 
                          : 'border-slate-200 hover:border-rose-300 text-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setQuizStep(1)}
                    className="w-1/3 bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    السابق
                  </button>
                  <button
                    disabled={!quizAnswers.concern}
                    onClick={() => setQuizStep(3)}
                    className="w-2/3 bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-rose-600/25 hover:bg-rose-700 transition-colors"
                  >
                    اعرضي الروتين المخصص
                  </button>
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-4">
                  <h3 className="font-bold text-base text-rose-900">روتينك المقترح (بشرة {quizAnswers.skinType})</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    بناءً على اختيارك ({quizAnswers.concern})، ننصحك باستخدام سيروم حمض الهيالورونيك صباحاً وغسول لطيف مع مرطب عميق لضمان نتائج مذهلة ونضارة طبيعية.
                  </p>
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        setQuizOpen(false);
                        setQuizStep(1);
                        setSelectedSkinType(quizAnswers.skinType);
                        showToast('تم تصفية المنتجات لتناسب بشرتك!');
                      }}
                      className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-rose-700 transition-colors"
                    >
                      تسوقي المنتجات المناسبة
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto animate-in fade-in">
          <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-12 relative flex-1">
            <button
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2.5 sm:p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition-colors z-50 shadow-md border border-slate-200"
              title="إغلاق"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 items-start relative pt-10 sm:pt-12 lg:pt-0">
              {/* Left Column: Image Carousel & Thumbnails */}
              <div className="w-full lg:w-1/2 flex flex-col items-center justify-start lg:sticky lg:top-8 bg-white z-20 pb-4 lg:pb-6 border-b border-slate-100 lg:border-none">
                <div className="relative w-full">
                  <div
                    ref={imageScrollRef}
                    onScroll={handleImageScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {getAllImages(activeModalProduct).map((imgUrl, i) => (
                      <div key={i} className="w-full flex-none snap-center flex justify-center items-center p-1 sm:p-2">
                        <div className="w-full max-w-sm sm:max-w-md aspect-square rounded-3xl bg-rose-50/50 border border-rose-100 overflow-hidden shadow-md relative group flex items-center justify-center p-4 sm:p-6">
                          <img
                            src={imgUrl}
                            alt={`${activeModalProduct.title} - صورة ${i + 1}`}
                            className="max-h-[280px] sm:max-h-[360px] w-auto h-auto object-contain transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {getAllImages(activeModalProduct).length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-full z-10">
                      {activeImageIndex + 1} / {getAllImages(activeModalProduct).length}
                    </div>
                  )}
                </div>

                {getAllImages(activeModalProduct).length > 1 && (
                  <div className="hidden lg:flex justify-center gap-3 overflow-x-auto mt-6 pb-2 w-full">
                    {getAllImages(activeModalProduct).map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        onClick={() => {
                          setActiveImageIndex(i);
                          if (imageScrollRef.current) {
                            const container = imageScrollRef.current;
                            const child = container.children[i] as HTMLElement;
                            if (child) {
                              container.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
                            }
                          }
                        }}
                        className={`w-14 h-14 shrink-0 rounded-xl border-2 cursor-pointer object-cover bg-white transition-all ${
                          activeImageIndex === i ? 'border-rose-600 shadow-md' : 'border-transparent hover:border-rose-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Product Details & Actions */}
              <div className="w-full lg:w-1/2 flex flex-col px-2 lg:px-0 pb-12 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                      {activeModalProduct.category}
                    </span>
                    {activeModalProduct.skinType && (
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">{activeModalProduct.skinType}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{activeModalProduct.title}</h2>
                  <div className="text-2xl font-extrabold text-rose-600">{formatPrice(activeModalProduct.price)}</div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{activeModalProduct.description}</p>
                  
                  {/* Stock Status Banner in Modal */}
                  <div className="pt-2">
                    {activeModalProduct.stock <= 0 || activeModalProduct.inventoryStatus === 'نفذت الكمية' ? (
                      <div className="bg-red-50 text-red-700 border border-red-200 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
                        <span>❌ نفذت الكمية من المخزون حالياً</span>
                      </div>
                    ) : activeModalProduct.stock <= 5 ? (
                      <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse">
                        <span>⚠️ متبقي {activeModalProduct.stock} قطع فقط في المخزون! سارعي بالطلب</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
                        <span>✓ متوفر في المخزون ({activeModalProduct.stock} قطعة)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ingredients */}
                {activeModalProduct.ingredients && activeModalProduct.ingredients.length > 0 && (
                  <div className="space-y-2 bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-rose-600" /> المكونات الفعالة الرئيسية:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeModalProduct.ingredients.map((ing: string, i: number) => (
                        <span key={i} className="text-xs bg-white text-rose-800 px-3 py-1 rounded-xl font-semibold shadow-xs border border-rose-100">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs */}
                {activeModalProduct.specs && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(activeModalProduct.specs).map(([k, v]: [string, any]) => (
                      <div key={k} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">{k}</span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-slate-200 rounded-2xl p-1 bg-slate-50">
                      <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-xl transition-colors"
                      >-</button>
                      <span className="w-12 text-center font-bold text-sm text-slate-900">{quantity}</span>
                      <button 
                        onClick={() => {
                          const stock = activeModalProduct.stock !== undefined ? Number(activeModalProduct.stock) : 20;
                          if (quantity >= stock) {
                            showToast(`⚠️ الكمية المتاحة بالمخزون هي ${stock} قطعة فقط!`);
                            return;
                          }
                          setQuantity(q => q + 1);
                        }}
                        disabled={activeModalProduct.stock <= 0 || quantity >= (activeModalProduct.stock || 0)}
                        className={`w-9 h-9 flex items-center justify-center font-bold rounded-xl transition-colors ${
                          activeModalProduct.stock <= 0 || quantity >= (activeModalProduct.stock || 0)
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-white'
                        }`}
                      >+</button>
                    </div>
                    <button 
                      onClick={() => {
                        addToCart(activeModalProduct, quantity);
                        setActiveModalProduct(null);
                        setQuantity(1);
                      }}
                      disabled={activeModalProduct.stock <= 0 || activeModalProduct.inventoryStatus === 'نفذت الكمية'}
                      className={`flex-1 py-4 rounded-2xl font-bold text-sm shadow-lg transition-colors flex items-center justify-center gap-2 ${
                        activeModalProduct.stock <= 0 || activeModalProduct.inventoryStatus === 'نفذت الكمية'
                          ? 'bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed'
                          : 'bg-rose-600 text-white shadow-rose-600/25 hover:bg-rose-700 cursor-pointer'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>{activeModalProduct.stock <= 0 ? 'غير متوفر بالمخزون ❌' : 'إضافة للسلة'}</span>
                    </button>
                  </div>
                </div>

                {/* Customer Reviews Section */}
                <div className="pt-8 border-t border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>تقييمات العملاء ({productReviews.length})</span>
                    </h3>
                  </div>

                  {/* Add Review Form */}
                  <form onSubmit={handleAddReview} className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-xs text-slate-800">أضف تقييمك للمنتج</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="اسمك الكريم" 
                        value={newReviewName}
                        onChange={e => setNewReviewName(e.target.value)}
                        required
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2">
                        <span className="text-xs text-slate-500">التقييم:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star}
                              size={18}
                              className={`cursor-pointer ${star <= newReviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                              onClick={() => setNewReviewRating(star)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <textarea 
                      placeholder="اكتب تجربتك مع المنتج..."
                      value={newReviewText}
                      onChange={e => setNewReviewText(e.target.value)}
                      rows={3}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    ></textarea>
                    <div className="flex items-center justify-between gap-4">
                      <input 
                        type="url" 
                        placeholder="رابط صورة التجربة (اختياري، مثلاً من Unsplash)"
                        value={newReviewPhoto}
                        onChange={e => setNewReviewPhoto(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button 
                        type="submit"
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shrink-0"
                      >
                        إرسال التقييم
                      </button>
                    </div>
                  </form>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {productReviews.map((rev: any) => (
                      <div key={rev.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                              {rev.customerName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{rev.customerName}</div>
                              <div className="text-[10px] text-slate-400">{rev.date}</div>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={14} className="text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                        {rev.image && (
                          <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                            <img src={rev.image} alt="Review attachment" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-rose-600" />
                <h2 className="font-bold text-base text-slate-900">سلة التسوق</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">سلة التسوق فارغة</p>
                  <p className="text-xs text-slate-400">أضيفي منتجاتك المفضلة لتجهيز طلبك</p>
                </div>
              ) : (
                cart.map(item => {
                  const itemStock = item.stock !== undefined ? Number(item.stock) : 20;
                  const isStockExceeded = item.quantity > itemStock;
                  return (
                    <div key={item.id} className={`flex gap-4 p-4 rounded-2xl border ${isStockExceeded ? 'border-red-300 bg-red-50/40' : 'border-slate-100 bg-rose-50/20'} items-center`}>
                      <img src={item.primaryImage || item.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800'} alt={item.title} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                        <div className="text-xs font-extrabold text-rose-600 mt-1">{formatPrice(item.price)}</div>
                        
                        {/* Quantity Controls in Cart */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-200 bg-white rounded-lg p-0.5">
                            <button
                              onClick={() => {
                                setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
                              }}
                              className="w-5 h-5 flex items-center justify-center font-bold text-xs text-slate-600 hover:bg-slate-100 rounded"
                            >-</button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => {
                                if (item.quantity >= itemStock) {
                                  showToast(`⚠️ الكمية المتاحة في المخزون لهذا المنتج هي ${itemStock} قطع فقط!`);
                                  return;
                                }
                                setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
                              }}
                              disabled={item.quantity >= itemStock}
                              className={`w-5 h-5 flex items-center justify-center font-bold text-xs rounded ${
                                item.quantity >= itemStock ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >+</button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">(المتوفر: {itemStock})</span>
                        </div>

                        {isStockExceeded && (
                          <div className="text-[10px] font-bold text-red-600 mt-1">
                            ⚠️ الكمية تتجاوز المتوفر بالمخزون ({itemStock})
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                        className="p-2 text-slate-400 hover:text-rose-600"
                        title="حذف من السلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {/* Promo Code Input */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-600" />
                    <span>هل لديك كود خصم؟</span>
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold text-rose-800">
                      <span>كود ({appliedCoupon.code}) - خصم {appliedCoupon.discountPercent}%</span>
                      <button onClick={() => setAppliedCoupon(null)} className="text-rose-600 hover:underline text-[11px]">حذف</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                        placeholder="أدخل كود الخصم (مثال: SKIN10)..."
                        className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold uppercase outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        تطبيق
                      </button>
                    </div>
                  )}
                </div>

                {couponBanner && couponBanner.show && (
                  <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between ${
                    couponBanner.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    <span>{couponBanner.msg}</span>
                    <button onClick={() => setCouponBanner(null)} className="p-0.5 hover:opacity-75">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex justify-between text-xs text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-rose-600 font-bold">
                    <span>خصم ({appliedCoupon.code}):</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>رسوم التوصيل:</span>
                  <span className="font-bold text-slate-900">{deliveryFee === 0 ? <span className="text-emerald-600">مجاني</span> : formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-rose-600">{formatPrice(finalTotal)}</span>
                </div>

                <button 
                  onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                  className="w-full bg-rose-600 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-rose-600/25 hover:bg-rose-700 transition-colors"
                >
                  إتمام الطلب والدفع
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favorites Drawer */}
      {isFavoritesOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                <h2 className="font-bold text-base text-slate-900">المفضلة</h2>
              </div>
              <button onClick={() => setIsFavoritesOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {favorites.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">لا توجد منتجات في المفضلة</p>
                </div>
              ) : (
                favorites.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsFavoritesOpen(false);
                      handleOpenProductModal(item);
                    }}
                    className="flex gap-3 p-3.5 rounded-2xl border border-rose-100 bg-rose-50/30 items-center hover:bg-rose-50/70 hover:border-rose-200 transition-all cursor-pointer group relative"
                  >
                    <img src={item.primaryImage || item.image} alt={item.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-rose-700 transition-colors">{item.title}</h4>
                      <div className="text-xs font-extrabold text-rose-600 mt-1">{formatPrice(item.price)}</div>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">انقر لعرض تفاصيل المنتج 👁️</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item);
                        }}
                        className="p-2 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs"
                        title="إلغاء من المفضلة"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        إضافة للسلة
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button 
              onClick={() => { setIsCheckoutOpen(false); setCheckoutComplete(false); }}
              className="absolute top-6 left-6 p-2 rounded-full text-slate-400 hover:bg-rose-50 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {checkoutComplete ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">تم استلام طلبك بنجاح!</h3>
                <p className="text-xs text-slate-500">رقم الطلب: <span className="font-mono font-bold text-slate-800">{lastSubmittedOrderId}</span></p>
                <button 
                  onClick={() => { setIsCheckoutOpen(false); setCheckoutComplete(false); }}
                  className="bg-rose-600 text-white px-8 py-3 rounded-2xl text-xs font-bold hover:bg-rose-700 transition-colors"
                >
                  متابعة التسوق
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <h3 className="font-bold text-base text-slate-900 mb-2">معلومات التوصيل</h3>
                <div className="space-y-3 text-right">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">الاسم الكامل</label>
                    <input 
                      type="text" 
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="سارة أحمد"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">رقم الجوال</label>
                    <input 
                      type="tel" 
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="0501234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">عنوان التوصيل (المدينة، الحي، الشارع)</label>
                    <textarea 
                      required
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder="الرياض، حي الياسمين، شارع الإزهار"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">الإجمالي: <strong className="text-slate-900 text-sm">{formatPrice(finalTotal)}</strong></span>
                  <button 
                    type="submit"
                    className="bg-rose-600 text-white px-8 py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-rose-600/25 hover:bg-rose-700 transition-colors"
                  >
                    تأكيد الطلب
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">{storeName}</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              وجهتك الأولى لكل ما تحتاجه البشرة والجسم من منتجات أصلية ومضمونة 100% لإطلالة ساحرة ومشرقة كل يوم.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setSelectedCategory('الكل')} className="hover:text-white transition-colors">جميع المنتجات</button></li>
              <li><button onClick={() => setQuizOpen(true)} className="hover:text-white transition-colors">مستشار البشرة الذكي</button></li>
              <li><button onClick={() => setIsTrackingOpen(true)} className="hover:text-white transition-colors">تتبع الطلبات</button></li>
              <li><button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors">سياسة الخصوصية</button></li>
              <li><button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors">شروط الاستخدام</button></li>
              <li><button onClick={() => setActivePolicy('support')} className="hover:text-white transition-colors">الدعم الفني</button></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">خدمة العملاء</h4>
            <p className="text-xs text-slate-400">نحن هنا لخدمتكم طوال أيام الأسبوع على مدار الساعة عبر الواتساب وخدمة العملاء.</p>
            <div className="text-xs font-bold text-rose-400">الدعم الفني: support@skincare.store</div>
            <button onClick={() => setActivePolicy('support')} className="mt-2 inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
              <Headphones size={14} /> تواصل مع الدعم الفني
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          جميع الحقوق محفوظة © 2026 - {storeName}
        </div>
      </footer>

      {/* Policy Modals */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                {activePolicy === 'privacy' && <><Shield className="w-5 h-5 text-rose-600" /> سياسة الخصوصية</>}
                {activePolicy === 'terms' && <><FileText className="w-5 h-5 text-rose-600" /> شروط الاستخدام</>}
                {activePolicy === 'support' && <><Headphones className="w-5 h-5 text-rose-600" /> قسم الدعم الفني وخدمة العملاء</>}
              </h3>
              <button onClick={() => setActivePolicy(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
              {activePolicy === 'privacy' ? (
                <>
                  <p>نحن في {storeName} نولي اهتماماً بالغاً بخصوصية بيانات عملائنا وحمايتها وفق أعلى المعايير الأمنية.</p>
                  <p>تستخدم بيانات الاتصال والشحن حصرياً لإتمام طلبات الشراء وتوصيل المنتجات إليكم بأمان وسرعة فائقة، ولا يتم مشاركتها مع أي جهة خارجية.</p>
                </>
              ) : activePolicy === 'terms' ? (
                <>
                  <p>باستخدامك لمتجرنا، فإنك توافق على الالتزام بكافة الشروط والأحكام الخاصة بالبيع، العناية بالبشرة، والضمان.</p>
                  <p>جميع المنتجات المعروضة أصلية ومضمونة 100% ومصنوعة بمكونات طبيعية آمنة.</p>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Working hours banner */}
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                        <Headphones size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">فريق خدمة العملاء متواجد لخدمتكم</h4>
                        <p className="text-xs text-rose-700 font-medium">السبت إلى الخميس: من 9:00 صباحاً وحتى 10:00 مساءً</p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full">متاح الآن</span>
                  </div>

                  {/* Direct Contact Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <a 
                      href="https://wa.me/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 p-4 rounded-2xl transition-all flex flex-col items-center text-center space-y-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <MessageCircle size={20} />
                      </div>
                      <div className="font-bold text-slate-900 text-xs">واتساب فوري</div>
                      <span className="text-[10px] text-slate-500 font-medium">استجابة خلال دقائق</span>
                    </a>

                    <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                        <PhoneCall size={20} />
                      </div>
                      <div className="font-bold text-slate-900 text-xs">الهاتف الموحد</div>
                      <span className="text-[10px] text-rose-600 font-bold" dir="ltr">920012345</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                        <Mail size={20} />
                      </div>
                      <div className="font-bold text-slate-900 text-xs">البريد الإلكتروني</div>
                      <span className="text-[10px] text-slate-600 font-medium">support@skincare.store</span>
                    </div>
                  </div>

                  {/* FAQ Accordion */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">الأسئلة الشائعة</h4>
                    <div className="space-y-2">
                      {[
                        { q: 'كم تستغرق مدة التوصيل والشحن؟', a: 'يتم توصيل الطلبات خلال 2 إلى 3 أيام عمل داخل المدن الرئيسية، و3 إلى 5 أيام باقي المناطق.' },
                        { q: 'هل جميع منتجات العناية أصلية 100%؟', a: 'نعم، جميع منتجاتنا مستوردة مباشرة من الوكلاء الرسميين للعلامات التجارية العالمية ومضمونة 100%.' },
                        { q: 'كيف يمكنني اختيار الروتين المناسب لبشرتي؟', a: 'يمكنك بسهولة استخدام "مستشار البشرة الذكي" المتاح في المتجر لتشخيص نوع بشرتك والحصول على توصيات مخصصة.' },
                        { q: 'ما هي طرق الدفع المتاحة؟', a: 'نقبل الدفع عند الاستلام، بطاقات مدى، البطاقات الائتمانية (فيزا/ماستركارد)، وخدمة Apple Pay.' }
                      ].map((faq, fIdx) => (
                        <div key={fIdx} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <button 
                            onClick={() => setOpenFaqIdx(openFaqIdx === fIdx ? null : fIdx)}
                            className="w-full flex items-center justify-between p-3.5 text-right font-bold text-xs text-slate-800 hover:bg-slate-50 transition-colors"
                          >
                            <span>{faq.q}</span>
                            <span className="text-rose-600 font-black text-sm">{openFaqIdx === fIdx ? '−' : '+'}</span>
                          </button>
                          {openFaqIdx === fIdx && (
                            <div className="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5 bg-slate-50/50">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Support Ticket Section */}
                  <div className="bg-rose-50/80 border border-rose-200 p-5 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <MessageCircle size={24} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">نظام تذاكر الدعم الفني والمحادثة المباشرة 💬</h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      يمكنك فتح تذكرة دعم جديدة لمتابعة طلبك، الاستفسار عن المنتجات، أو التواصل المباشر مع فريق الإدارة والموظفين بمرونة كاملة.
                    </p>
                    <button 
                      type="button"
                      onClick={() => {
                        setActivePolicy(null);
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('open-support-widget'));
                        }, 100);
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      <Headphones size={16} />
                      <span>فتح تذكرة مساعدة ومحادثة الموظفين الآن</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">سجل وتتبع طلباتي</h3>
                  <p className="text-xs text-slate-500 font-medium">تابع حالة مشترياتك ومنتجات العناية</p>
                </div>
              </div>
              <button onClick={() => setIsTrackingOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1">
              {userOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Truck size={48} className="mx-auto mb-4 opacity-50 text-rose-400" />
                  <h4 className="font-bold text-slate-700 text-lg mb-1">لا توجد طلبات سابقة</h4>
                  <p className="text-sm">لم تقم بإجراء أي طلبات من متجرنا حتى الآن.</p>
                </div>
              ) : (
                <>
                  <div className="flex bg-slate-200 p-1 rounded-xl mb-4 text-xs font-bold">
                    <button onClick={() => setTrackingTab('current')} className={`flex-1 py-2 rounded-lg transition-all ${trackingTab === 'current' ? 'bg-white shadow text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}>طلباتي الحالية</button>
                    <button onClick={() => setTrackingTab('previous')} className={`flex-1 py-2 rounded-lg transition-all ${trackingTab === 'previous' ? 'bg-white shadow text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}>الطلبات السابقة</button>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">الطلبات المسجلة هنا هي للقراءة وتتبع الحالة فقط.</p>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const isOrderCancelled = (st: string) => ['cancelled', 'customer_cancelled', 'ملغي', 'ملغي بواسطة العميل'].includes(st);
                      const isOrderCompleted = (st: string) => ['completed', 'تم التسليم'].includes(st);

                      const filteredOrders = userOrders.filter(ord => {
                        const cancelled = isOrderCancelled(ord.status);
                        const completed = isOrderCompleted(ord.status);
                        if (trackingTab === 'current') {
                          return !completed && !cancelled;
                        } else {
                          return completed || cancelled;
                        }
                      });

                      if (filteredOrders.length === 0) {
                        return <div className="text-center py-10 text-slate-400 text-xs font-bold">لا توجد طلبات في هذا القسم</div>;
                      }

                      return filteredOrders.map((ord, i) => {
                        const cancelled = isOrderCancelled(ord.status);
                        const completed = isOrderCompleted(ord.status);
                        const isCustomerCancelled = ord.status === 'customer_cancelled' || ord.details?.cancelledBy === 'customer';

                        return (
                          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                              <div>
                                <p className="text-[10px] text-slate-500 mb-1">رقم الطلب: {ord.id}</p>
                                <p className="text-xs font-bold text-slate-800">{ord.date || (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('ar-SA') : '')}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                cancelled 
                                  ? 'bg-rose-100 text-rose-800 border-rose-200 font-black' 
                                  : completed 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {cancelled 
                                  ? (isCustomerCancelled ? '❌ ملغي بواسطة العميل' : '❌ ملغي من الإدارة') 
                                  : (ord.status || 'قيد المراجعة والتجهيز')}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {ord.items && ord.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl">
                                  {(item.primaryImage || item.image) && <img src={item.primaryImage || item.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-white border border-slate-200" />}
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</p>
                                    <p className="text-[10px] text-slate-500">الكمية: {item.quantity || 1}</p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-xs font-bold">{formatPrice(item.price)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Cancellation Alert or Interactive Status Timeline */}
                            {cancelled ? (
                              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mt-3 text-right space-y-1.5 animate-fadeIn">
                                <div className="flex items-center gap-2 font-black text-rose-800 text-xs">
                                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>
                                    {isCustomerCancelled
                                      ? 'تم إلغاء هذا الطلب بناءً على طلبك'
                                      : 'تم إلغاء هذا الطلب بواسطة إدارة المتجر'}
                                  </span>
                                </div>
                                <p className="text-xs text-rose-700 leading-relaxed font-medium">
                                  {isCustomerCancelled
                                    ? 'تمت عملية إلغاء الطلب بنجاح ولن يتم تجهيزه أو شحنه.'
                                    : 'نعتذر منك، تم إلغاء هذا الطلب من قِبل إدارة المتجر. إذا كان لديك أي استفسار يسعدنا تواصلك معنا.'}
                                </p>
                              </div>
                            ) : (
                              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 mt-3 space-y-3">
                                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                  <span>حالة الطلب التفاعلية:</span>
                                  <span className="text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full font-black text-[10px]">{ord.status || 'قيد المراجعة والتجهيز'}</span>
                                </div>
                                
                                {(() => {
                                  const statusLower = (ord.status || '').toLowerCase();
                                  const isOnTheWay = statusLower.includes('مندوب') || statusLower.includes('طريق') || statusLower === 'on_the_way';
                                  const isPrepared = statusLower === 'confirmed' || statusLower === 'preparing' || statusLower.includes('تجهيز') || isOnTheWay || completed;

                                  const steps = [
                                     { label: 'تأكيد الطلب', active: true, icon: CheckCircle2 },
                                     { label: 'قيد التجهيز', active: isPrepared || isOnTheWay || completed, icon: Sparkles },
                                     { label: 'مع المندوب', active: isOnTheWay || completed, icon: Truck },
                                     { label: 'تم التسليم', active: completed, icon: Star }
                                   ];

                                   return (
                                     <div className="space-y-4">
                                       <div className="flex items-center justify-between relative px-2 py-3">
                                         {steps.map((st, sIdx) => {
                                           const StepIcon = st.icon;
                                           return (
                                             <div key={sIdx} className="flex flex-col items-center relative z-10 flex-1">
                                               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                 st.active 
                                                   ? 'bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-100' 
                                                   : 'bg-white border-2 border-slate-300 text-slate-400'
                                               }`}>
                                                 <StepIcon size={14} />
                                               </div>
                                               <span className={`text-[10px] font-bold text-center whitespace-nowrap ${st.active ? 'text-slate-900 font-black' : 'text-slate-400'}`}>
                                                 {st.label}
                                               </span>
                                             </div>
                                           );
                                         })}
                                       </div>
                                     </div>
                                   );
                                 })()}

                               {/* Feedback Form */}
                               {(ord.status === 'completed' || ord.status === 'on_the_way') && !ord.details?.feedback && !ord.details?.customerCleared && (
                                 <div className="mt-4 border-t border-slate-200 pt-4">
                                   <p className="text-xs font-bold text-slate-800 mb-3 text-center">📦 هل قمت باستلام طلبك؟ شاركنا ملاحظاتك أو قم بتأكيد الاستلام!</p>
                                   {feedbackInput.id === ord.id ? (
                                     <div className="flex flex-col gap-2">
                                       <textarea 
                                         value={feedbackInput.text}
                                         onChange={(e) => setFeedbackInput({ id: ord.id, text: e.target.value })}
                                         placeholder="اكتب ملاحظاتك هنا (يمكنك تضمين رابط صورة إذا أردت)..."
                                         className="w-full text-xs p-3 rounded-xl border border-slate-300 outline-none focus:border-rose-500"
                                         rows={3}
                                       ></textarea>
                                       <div className="flex gap-2">
                                         <button onClick={() => handleFeedbackSubmit(ord.id, ord.customerPhone, feedbackInput.text, false)} className="flex-1 bg-rose-600 text-white text-xs py-2 rounded-xl font-bold hover:bg-rose-700">إرسال الملاحظة</button>
                                         <button onClick={() => setFeedbackInput({ id: "", text: "" })} className="flex-1 bg-slate-200 text-slate-700 text-xs py-2 rounded-xl font-bold hover:bg-slate-300">إلغاء</button>
                                       </div>
                                     </div>
                                   ) : (
                                     <div className="flex gap-2">
                                       <button onClick={() => setFeedbackInput({ id: ord.id, text: "" })} className="flex-1 border border-slate-300 bg-white text-slate-700 text-[11px] py-2 rounded-xl font-bold hover:bg-slate-50">نعم، لدي ملاحظة</button>
                                       <button onClick={() => handleFeedbackSubmit(ord.id, ord.customerPhone, "", true)} className="flex-1 bg-slate-100 text-slate-600 text-[11px] py-2 rounded-xl font-bold hover:bg-slate-200">تأكيد الاستلام كاملة</button>
                                     </div>
                                   )}
                                 </div>
                               )}
                               
                               {ord.details?.feedback && (
                                 <div className="mt-3 bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs">
                                   <div className="font-bold text-slate-700 mb-1">ملاحظتك:</div>
                                   <div className="text-slate-600">"{ord.details.feedback}"</div>
                                 </div>
                               )}
                               
                               {ord.details?.customerCleared && (
                                 <div className="mt-3 bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                                   <Sparkles size={14} className="shrink-0" />
                                   <span className="font-bold">شكراً لتأكيد الاستلام! نتمنى لك تجربة رائعة.</span>
                                 </div>
                               )}
                               </div>
                             )}
                           </div>
                         );
                       });
                     })()}
                   </div>
                 </>
               )}
             </div>
           </div>
         </div>
       )}
      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {confirmModal.confirmText || 'تأكيد'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {confirmModal.cancelText || 'إلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket & Live Chat Widget */}
      <SupportWidget tenant={tenant} primaryColor="#e11d48" />
    </div>
  );
}
