import React, { useState, useRef } from 'react';
import { ShoppingBag, Search, Menu, Heart, ArrowRight, X, User, Truck, CheckCircle2, ShieldCheck, Sparkles, LogOut, MessageCircle, Shield, FileText, Upload, ChevronLeft, ChevronRight, Star, Camera, ThumbsUp, Check, Tag, Percent, AlertTriangle } from 'lucide-react';
import { loginWithGoogle, logout, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SupportWidget from '../components/SupportWidget';

interface FashionProduct {
  id: string | number;
  title: string;
  price: number | string;
  originalPrice?: number | string;
  sizeStocks?: Record<string, number> | string;
  sizeDetails?: Record<string, string> | string;
  colorStocks?: Record<string, number> | string;
  colorImages?: Record<string, string> | string;
  primaryImage?: string;
  image?: string;
  images?: string[] | string;
  secondaryImage?: string;
  category: string;
  colors?: string[] | string;
  sizes?: string[] | string;
  description?: string;
  stock?: number;
  inventoryStatus?: string;
  isUnlimitedStock?: boolean;
  unlimitedStock?: boolean;
}

interface FashionTemplateProps {
  tenantName: string;
  content: any;
  tenant: any;
  setContent?: (content: any) => void;
}

const normalizeArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
    } catch (e) {}
    return val.split(/[,،]/).map(v => v.trim()).filter(Boolean);
  }
  return [];
};

const normalizeObject = (val: any): Record<string, any> => {
  if (!val) return {};
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return {};
};

const arabicColorsMap: Record<string, string> = {
  'أحمر': '#ef4444', 'أسود': '#000000', 'أبيض': '#ffffff', 'أزرق': '#3b82f6',
  'كحلي': '#1e3a8a', 'أخضر': '#22c55e', 'أصفر': '#eab308', 'وردي': '#ec4899',
  'زهري': '#ec4899', 'بني': '#78350f', 'برتقالي': '#f97316', 'رمادي': '#6b7280',
  'سكني': '#6b7280', 'بنفسجي': '#a855f7', 'بيج': '#f5f5dc', 'ذهبي': '#ffd700',
  'فضي': '#c0c0c0', 'عنابي': '#800000', 'خمري': '#800000', 'زيتي': '#4d7c0f',
};

const hexToArabicMap: Record<string, string> = {};
Object.entries(arabicColorsMap).forEach(([ar, hex]) => {
  hexToArabicMap[hex.toLowerCase()] = ar;
});

const getColorImage = (colorImgMap: Record<string, any>, colorName: string): string | null => {
  if (!colorImgMap || !colorName) return null;
  const colStr = String(colorName).trim();
  if (!colStr) return null;

  if (colorImgMap[colStr]) return String(colorImgMap[colStr]);

  const keys = Object.keys(colorImgMap);
  const foundKey = keys.find(k => String(k).trim().toLowerCase() === colStr.toLowerCase());
  if (foundKey && colorImgMap[foundKey]) return String(colorImgMap[foundKey]);

  const colLower = colStr.toLowerCase();
  const hexEquiv = arabicColorsMap[colStr];
  if (hexEquiv) {
    const hk = keys.find(k => String(k).trim().toLowerCase() === hexEquiv.toLowerCase());
    if (hk && colorImgMap[hk]) return String(colorImgMap[hk]);
  }

  const arEquiv = hexToArabicMap[colLower];
  if (arEquiv) {
    const ak = keys.find(k => String(k).trim() === arEquiv);
    if (ak && colorImgMap[ak]) return String(colorImgMap[ak]);
  }

  return null;
};

const parsePriceNumber = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const str = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(str) || 0;
};

const formatPrice = (val: any): string => {
  if (val === undefined || val === null || val === '') return '0.00 JOD';
  const str = String(val).trim();
  if (str.includes('JOD') || str.includes('د.أ')) return str;
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  return `${num.toFixed(2)} JOD`;
};

const getOriginalPriceVal = (p: any): string | null => {
  if (!p) return null;
  const orig = p.originalPrice ?? p.original_price ?? p.priceBeforeDiscount ?? p.comparePrice;
  if (orig === undefined || orig === null) return null;
  const origStr = String(orig).trim();
  if (!origStr || origStr === '0' || origStr === '0 JOD' || origStr === '0 د.أ') return null;

  const currentNum = parsePriceNumber(p.price);
  const origNum = parsePriceNumber(origStr);

  if (origNum <= currentNum || origNum === 0) return null;
  return origStr;
};

export default function FashionTemplate({ tenantName, content, tenant, setContent }: FashionTemplateProps) {
  const isElectronicsText = (txt?: string) => {
    if (!txt) return false;
    return txt.includes('الأجهزة الإلكترونية') || txt.includes('الأجهزة الذكية') || txt.includes('عالمك الذكي') || txt.includes('التقنيات العصرية');
  };

  const storeTitle = (() => {
    if (tenantName && !isElectronicsText(tenantName)) return tenantName;
    if (content?.businessName && !isElectronicsText(content.businessName)) return content.businessName;
    return 'بوتيك الأزياء الراقية';
  })();

  const heroTitleText = (() => {
    if (content?.heroTitle && !isElectronicsText(content.heroTitle)) return content.heroTitle;
    return 'تصاميم تعكس ذوقك الرفيع';
  })();

  const heroSubtitleText = (() => {
    if (content?.heroSubtitle && !isElectronicsText(content.heroSubtitle)) return content.heroSubtitle;
    return 'استكشف أحدث تشكيلات الموضة الفاخرة مع تجربة تسوق استثنائية';
  })();
  
  const baseProducts = [
    {
      id: 1,
      title: 'معطف صيفي حريري فاخر',
      price: '145.00',
      originalPrice: '200.00',
      primaryImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      secondaryImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      category: 'أزياء راقية',
      colors: ['#1a1a1a', '#d4d4d8', '#78716c'],
      colorImages: {
        '#1a1a1a': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000',
        '#d4d4d8': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000'
      },
      sizes: ['S', 'M', 'L', 'XL'],
      sizeStocks: { 'S': 2, 'M': 0, 'L': 15, 'XL': 3 },
      description: 'مصنوع من أجود خامات الحرير الطبيعي بتصميم عصري راقٍ يناسب الأمسيات الفاخرة.'
    },
    {
      id: 2,
      title: 'فستان سهرة كلاسيكي طويل',
      price: '210.00',
      originalPrice: '350.00',
      primaryImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop',
      secondaryImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      category: 'فساتين',
      colors: ['#000000', '#7f1d1d', '#312e81'],
      colorImages: {
        '#7f1d1d': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000'
      },
      sizes: ['XS', 'S', 'M', 'L'],
      sizeStocks: { 'XS': 0, 'S': 1, 'M': 5, 'L': 10 },
      description: 'قصة انسيابية ساحرة تبرز جمال التفاصيل مع تطريز دقيق.'
    },
    {
      id: 3,
      title: 'بدلة رسمية عصرية نسائية',
      price: '180.00',
      primaryImage: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=1000&auto=format&fit=crop',
      secondaryImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
      category: 'بدلات',
      colors: ['#27272a', '#e4e4e7', '#1e3a8a'],
      sizes: ['S', 'M', 'L'],
      sizeStocks: { 'S': 5, 'M': 5, 'L': 5 },
      description: 'تصميم احترافي راقٍ يعكس القوة والثقة بلمسة أنثوية فريدة.'
    },
    {
      id: 4,
      title: 'حقيبة جلدية فاخرة',
      price: '95.00',
      originalPrice: '150.00',
      primaryImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop',
      secondaryImage: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1000&auto=format&fit=crop',
      category: 'إكسسوارات',
      colors: ['#451a03', '#000000', '#d97706'],
      sizes: ['One Size'],
      sizeStocks: { 'One Size': 1 },
      description: 'جلد طبيعي فاخر مع إكسسوارات مطلية بالذهب الخالص.'
    },
    {
      id: 5,
      title: 'فستان مخملي أنيق',
      price: '185.00',
      originalPrice: '300.00',
      primaryImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
      secondaryImage: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1000&auto=format&fit=crop',
      category: 'فساتين',
      colors: ['أحمر', 'أسود', 'كحلي'],
      colorStocks: { 'أحمر': 0, 'أسود': 3, 'كحلي': 5 },
      colorImages: {
        'أحمر': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
        'أسود': 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1000&auto=format&fit=crop'
      },
      sizes: ['S', 'M', 'L'],
      sizeStocks: { 'S': 3, 'M': 0, 'L': 5 },
      description: 'تصميم أنيق ومميز يناسب جميع المناسبات الخاصة.'
    }
  ];

  const isElectronicsProduct = (p: any) => {
    if (!p) return false;
    const cat = String(p.category || '').trim();
    const title = String(p.title || p.name || '').trim();
    const electronicsCategories = ['الهواتف الذكية', 'الحواسيب', 'الصوتيات', 'الأجهزة اللوحية', 'الساعات الذكية', 'الكاميرات', 'المنزل الذكي', 'الألعاب'];
    const electronicsRegex = /آيفون|ماك بوك|إيربودز|آيباد|تلفزيون|ساعة آبل|بلايستيشن|سامسونج|شاشة|سماعة|كاميرا|لاب توب/i;
    return electronicsCategories.includes(cat) || electronicsRegex.test(title);
  };

  const sanitizeFashionProducts = (rawList: any[]) => {
    if (!Array.isArray(rawList)) return [];
    return rawList.filter((p: any) => !isElectronicsProduct(p));
  };

  const defaultFashionItems = baseProducts.map((bp, i) => ({
    ...bp,
    id: bp.id || i + 1,
  }));

  const [products, setProducts] = useState<FashionProduct[]>(() => {
    if (Array.isArray(content?.products)) return sanitizeFashionProducts(content.products);
    if (Array.isArray(content?.items)) return sanitizeFashionProducts(content.items);
    return defaultFashionItems;
  });

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  React.useEffect(() => {
    if (Array.isArray(content?.products)) {
      setProducts(sanitizeFashionProducts(content.products));
    } else if (Array.isArray(content?.items)) {
      setProducts(sanitizeFashionProducts(content.items));
    }
  }, [content]);
const [cart, setCart] = useState<Array<FashionProduct & { quantity: number; selectedSize: string; selectedColor: string }>>([]);
  const [favorites, setFavorites] = useState<(string | number)[]>(() => {
    try {
      const saved = localStorage.getItem(`tenant_favorites_${tenant?.subdomain || 'demo'}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(`tenant_favorites_${tenant?.subdomain || 'demo'}`, JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites, tenant]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string | number, string>>({});
  const [selectedColors, setSelectedColors] = useState<Record<string | number, string>>({});
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingTab, setTrackingTab] = useState<'current'|'previous'>('current');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<FashionProduct | null>(null);
  const [modalActiveImage, setModalActiveImage] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<{id: string, text: string}>({id: "", text: ""});
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [productListPage, setProductListPage] = useState(1);
  const productsPerPage = 8;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 🏷️ Promo Code & Shipping State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(() => {
    try {
      const saved = localStorage.getItem(`applied_coupon_${tenant?.subdomain || 'demo'}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [couponBanner, setCouponBanner] = useState<{ show: boolean; msg: string; type: 'success' | 'error' } | null>(null);

  const storeCurrency = content?.currencySymbol || content?.currency || 'د.أ';
  const formatPrice = (val: any): string => {
    if (val === undefined || val === null || val === '') return `0.00 ${storeCurrency}`;
    const str = String(val).trim();
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return str;
    return `${num.toFixed(2)} ${storeCurrency}`;
  };

  const shippingFee = content?.shippingFee !== undefined ? Number(content.shippingFee) : 15;

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || promoCodeInput || '').trim().toUpperCase();
    if (!code) return;

    const storePromoCodes = Array.isArray(content?.promoCodes) ? content.promoCodes : [];
    const foundStoreCode = storePromoCodes.find((c: any) => String(c.code).trim().toUpperCase() === code);

    const defaultCodes: Record<string, number> = {
      'WELCOME10': 10,
      'SALE20': 20,
      'SAVE15': 15,
      'VIP30': 30,
      'DISCOUNT': 10
    };

    let discount = 0;
    if (foundStoreCode) {
      discount = Number(foundStoreCode.discountPercent) || 10;
    } else if (defaultCodes[code]) {
      discount = defaultCodes[code];
    } else {
      setCouponBanner({
        show: true,
        msg: `❌ كود الخصم "${code}" غير صحيح أو غير فعال حالياً.`,
        type: 'error'
      });
      showToast(`كود الخصم "${code}" غير صحيح`);
      return;
    }

    if (foundStoreCode) {
      const minOrders = Number(foundStoreCode.minPriorOrders) || 0;
      if (minOrders > 0 && userOrders.length < minOrders) {
        setCouponBanner({
          show: true,
          msg: `⚠️ يجب أن يكون لديك على الأقل ${minOrders} طلبات سابقة لاستخدام هذا الكود (لديك ${userOrders.length} طلبات).`,
          type: 'error'
        });
        showToast(`⚠️ يلزم إكمال ${minOrders} طلبات سابقة لاستخدام هذا الكود`);
        return;
      }

      const maxUses = Number(foundStoreCode.maxUsesPerUser) || 0;
      if (maxUses > 0) {
        const userUsesCount = userOrders.filter((o: any) => 
          String(o.promoCode || o.details?.promoCode || '').toUpperCase() === code
        ).length;
        if (userUsesCount >= maxUses) {
          setCouponBanner({
            show: true,
            msg: `⚠️ لقد تجاوزت الحد الأقصى لاستخدام هذا الكود (${maxUses} مرات).`,
            type: 'error'
          });
          showToast(`⚠️ تم استنفاد الحد الأقصى لاستخدام الكود (${maxUses} مرات)`);
          return;
        }
      }

      const minCart = Number(foundStoreCode.minCartAmount) || 0;
      if (minCart > 0 && cartTotalPrice < minCart) {
        setCouponBanner({
          show: true,
          msg: `⚠️ الحد الأدنى لقيمة السلة لهذا الكود هو ${minCart} ${storeCurrency} (قيمة السلة: ${cartTotalPrice} ${storeCurrency}).`,
          type: 'error'
        });
        showToast(`⚠️ الحد الأدنى لقيمة السلة هو ${minCart} ${storeCurrency}`);
        return;
      }

      const maxCart = Number(foundStoreCode.maxCartAmount) || 0;
      if (maxCart > 0 && cartTotalPrice > maxCart) {
        setCouponBanner({
          show: true,
          msg: `⚠️ الحد الأقصى لقيمة السلة لهذا الكود هو ${maxCart} ${storeCurrency}.`,
          type: 'error'
        });
        showToast(`⚠️ الحد الأقصى لقيمة السلة هو ${maxCart} ${storeCurrency}`);
        return;
      }
    }

    if (discount > 0) {
      const couponObj = { code, discountPercent: discount };
      setAppliedCoupon(couponObj);
      try {
        localStorage.setItem(`applied_coupon_${tenant?.subdomain || 'demo'}`, JSON.stringify(couponObj));
      } catch (e) {}

      setCouponBanner({
        show: true,
        msg: `🎉 تمت إضافة نسبة خصم ${discount}% بنجاح! (كود الخصم: ${code})`,
        type: 'success'
      });
      showToast(`تم تطبيق كود الخصم (${code}) بنجاح! خصم ${discount}%`);
      setPromoCodeInput('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(`applied_coupon_${tenant?.subdomain || 'demo'}`);
    } catch (e) {}
    showToast('تم إزالة كود الخصم');
  };

  // 🌟 Customer Reviews & Photo Submissions State
  const [reviews, setReviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('tenant_product_reviews');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'rev-1',
        productId: '1',
        customerName: 'سارة خالد',
        rating: 5,
        comment: 'القطعة رائعة جداً والقماش ممتاز والتوصيل كان سريع خلال 24 ساعة! شكراً لكم.',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'rev-2',
        productId: '1',
        customerName: 'محمد العبدالله',
        rating: 5,
        comment: 'وصل المنتج بنفس الوصف والمقاس مضبوط تماماً، والتغليف راقي جداً.',
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'rev-3',
        productId: '2',
        customerName: 'رنا المحمود',
        rating: 5,
        comment: 'جودة خرافية واللون على الطبيعة أجمل بكثير من الصور!',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];
  });

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewImage, setNewReviewImage] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const [reviewPhotoPreviewModal, setReviewPhotoPreviewModal] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem('tenant_product_reviews', JSON.stringify(reviews));
    } catch (e) {}
  }, [reviews]);

  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewReviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddReview = (e: React.FormEvent, productId: string | number) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;
    const reviewObj = {
      id: `rev-${Date.now()}`,
      productId: String(productId),
      customerName: newReviewName.trim() || customerName || 'عميل مجهول',
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      image: newReviewImage || undefined,
      createdAt: new Date().toISOString()
    };
    setReviews(prev => [reviewObj, ...prev]);
    setNewReviewComment('');
    setNewReviewName('');
    setNewReviewImage(null);
    setReviewSuccessMsg(true);
    setTimeout(() => setReviewSuccessMsg(false), 4000);
  };

  // User auth state
  const [user, setUser] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  React.useEffect(() => {
    if (selectedProductForModal || isCartOpen || isCheckoutOpen || isSearchOpen || isTrackingOpen || isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProductForModal, isCartOpen, isCheckoutOpen, isSearchOpen, isTrackingOpen, isMobileMenuOpen]);

  const fetchUserOrdersData = async (u: any) => {
    if (u) {
      try {
        const res = await fetch(`/api/public/websites/${tenant?.subdomain || 'demo'}/user-orders?email=${encodeURIComponent(u.email || '')}`);
        if (res.ok) {
          const data = await res.json();
          setUserOrders(data.orders || []);
        } else {
          const saved = localStorage.getItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}_${u.uid}`);
          if (saved) setUserOrders(JSON.parse(saved));
        }
      } catch (e) {
        const saved = localStorage.getItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}_${u.uid}`);
        if (saved) setUserOrders(JSON.parse(saved));
      }
    } else {
      const saved = localStorage.getItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}_guest`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserOrders(parsed);
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
               localStorage.setItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}_guest`, JSON.stringify(data.orders));
             }
          })
          .catch(e => console.warn('Failed to sync guest orders', e));
        }
      }
    }
  };

  React.useEffect(() => {
    let interval: any;
    if (isTrackingOpen) {
      interval = setInterval(() => {
        fetchUserOrdersData(user);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTrackingOpen, user, tenant]);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setCustomerName(u.displayName || '');
        try {
          const loginRes = await fetch('/api/public/websites/' + (tenant?.subdomain || 'demo') + '/store-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: u.email, name: u.displayName, photoUrl: u.photoURL, favorites })
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData.favorites && Array.isArray(loginData.favorites)) {
              setFavorites(loginData.favorites);
            }
          }
        } catch (e) {}
        
        try {
          const res = await fetch(`/api/public/websites/${tenant?.subdomain || 'demo'}/user-orders?email=${encodeURIComponent(u.email || '')}`);
          if (res.ok) {
            const data = await res.json();
            setUserOrders(data.orders || []);
          } else {
            // fallback
            const saved = localStorage.getItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}_${u.uid}`);
            if (saved) {
              try { setUserOrders(JSON.parse(saved)); } catch(e) {}
            }
          }
        } catch(err) {
          const saved = localStorage.getItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}_${u.uid}`);
          if (saved) {
            try { setUserOrders(JSON.parse(saved)); } catch(e) {}
          }
        }
      }
    });
    return () => unsub();
  }, [tenant, isTrackingOpen]); // Also refetch when tracking opens

  React.useEffect(() => {
    if (user && user.email) {
      try {
        fetch('/api/public/websites/' + (tenant?.subdomain || 'demo') + '/store-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, name: user.displayName, photoUrl: user.photoURL, favorites })
        }).catch(console.error);
      } catch (e) {}
    }
  }, [favorites, user, tenant]);

  
  const handleFeedbackSubmit = async (orderId: string, phone: string, text: string, cleared: boolean) => {
    // 1. Optimistically update local orders state immediately
    setUserOrders(prevOrders => {
      const updated = prevOrders.map((o: any) => {
        if (String(o.id) === String(orderId)) {
          return {
            ...o,
            status: 'completed',
            stockDeducted: true,
            details: {
              ...(o.details || {}),
              cleared,
              customerCleared: true,
              feedback: text
            }
          };
        }
        return o;
      });
      try {
        const storageKey = user?.uid 
          ? `orders_fashion_${tenant?.subdomain || 'fashion_demo'}_${user.uid}`
          : `orders_fashion_${tenant?.subdomain || 'fashion_demo'}_guest`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setFeedbackInput({ id: '', text: '' });

    // 2. Optimistically update product stock if needed
    const targetOrder = userOrders.find((o: any) => String(o.id) === String(orderId));
    if (targetOrder && !targetOrder.stockDeducted) {
      setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(prod => {
          const cartItemsForProd = (targetOrder.items || []).filter((c: any) => String(c.id) === String(prod.id) || c.title === prod.title);
          if (cartItemsForProd.length === 0) return prod;

          let totalQtyDeducted = 0;
          const newSizeStocks = { ...(prod.sizeStocks || {}) };
          const newColorStocks = { ...(prod.colorStocks || {}) };

          cartItemsForProd.forEach((item: any) => {
            const qty = item.quantity || 1;
            totalQtyDeducted += qty;
            if (item.selectedSize && newSizeStocks[item.selectedSize] !== undefined) {
              newSizeStocks[item.selectedSize] = Math.max(0, newSizeStocks[item.selectedSize] - qty);
            }
            if (item.selectedColor && newColorStocks[item.selectedColor] !== undefined) {
              newColorStocks[item.selectedColor] = Math.max(0, newColorStocks[item.selectedColor] - qty);
            }
          });

          const currentStock = prod.stock !== undefined ? Number(prod.stock) : 20;
          const finalStock = Math.max(0, currentStock - totalQtyDeducted);

          return {
            ...prod,
            stock: finalStock,
            sizeStocks: newSizeStocks,
            colorStocks: newColorStocks,
            inventoryStatus: finalStock <= 0 ? 'نفد من المخزون' : prod.inventoryStatus
          };
        });

        if (setContent) {
          setContent({ ...content, items: updatedProducts });
        }
        return updatedProducts;
      });
    }

    // 3. Send feedback to backend in background
    try {
      fetch(`/api/public/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, feedback: text, cleared })
      }).catch(console.error);
    } catch(e) { console.error(e); }
  };

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

  const toggleFavorite = (e: React.MouseEvent, productId: string | number) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const handleSelectSize = (productId: string | number, size: string) => setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  
  const handleSelectColor = (productId: string | number, color: string) => {
    const colStr = String(color).trim();
    setSelectedColors(prev => ({ ...prev, [productId]: colStr }));
    const p = (selectedProductForModal && String(selectedProductForModal.id) === String(productId))
      ? selectedProductForModal 
      : products.find(prod => String(prod.id) === String(productId));

    if (p) {
      const colorImgMap = normalizeObject(p.colorImages);
      const colImg = getColorImage(colorImgMap, colStr);
      if (colImg) {
        setModalActiveImage(colImg);
      } else if (selectedProductForModal && String(selectedProductForModal.id) === String(productId)) {
        setModalActiveImage(p.primaryImage || p.image || null);
      }
    }
  };

  const [cartStockWarning, setCartStockWarning] = useState<string | null>(null);

  const addToCart = (e: React.MouseEvent, product: FashionProduct) => {
    e.stopPropagation();
    const pSizes = normalizeArray(product.sizes);
    const pColors = normalizeArray(product.colors);
    const sizeToCart = selectedSizes[product.id] || pSizes[0] || 'M';
    const colorToCart = selectedColors[product.id] || pColors[0] || '#000000';

    const isUnlimited = !!(product.isUnlimitedStock || product.unlimitedStock || Number(product.stock) >= 999999);

    if (!isUnlimited) {
      const sizeStocksMap = normalizeObject(product.sizeStocks);
      const colorStocksMap = normalizeObject(product.colorStocks);

      const availableSizeStock = sizeToCart && sizeStocksMap[sizeToCart] !== undefined ? Number(sizeStocksMap[sizeToCart]) : undefined;
      const availableColorStock = colorToCart && colorStocksMap[colorToCart] !== undefined ? Number(colorStocksMap[colorToCart]) : undefined;
      const availableTotalStock = product.stock !== undefined ? Number(product.stock) : undefined;

      let maxAllowed = 99;
      if (availableSizeStock !== undefined) maxAllowed = Math.min(maxAllowed, availableSizeStock);
      if (availableColorStock !== undefined) maxAllowed = Math.min(maxAllowed, availableColorStock);
      if (availableTotalStock !== undefined) maxAllowed = Math.min(maxAllowed, availableTotalStock);

      if (maxAllowed <= 0 || product.inventoryStatus === 'نفد من المخزون') {
        alert('عذراً، هذه القطعة بهذا المقاس/اللون نفدت من المخزون حالياً!');
        return;
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === sizeToCart && item.selectedColor === colorToCart);
      if (existing) {
        if (!isUnlimited) {
          const sizeStocksMap = normalizeObject(product.sizeStocks);
          const colorStocksMap = normalizeObject(product.colorStocks);
          const availableSizeStock = sizeToCart && sizeStocksMap[sizeToCart] !== undefined ? Number(sizeStocksMap[sizeToCart]) : undefined;
          const availableColorStock = colorToCart && colorStocksMap[colorToCart] !== undefined ? Number(colorStocksMap[colorToCart]) : undefined;
          const availableTotalStock = product.stock !== undefined ? Number(product.stock) : undefined;

          let maxAllowed = 99;
          if (availableSizeStock !== undefined) maxAllowed = Math.min(maxAllowed, availableSizeStock);
          if (availableColorStock !== undefined) maxAllowed = Math.min(maxAllowed, availableColorStock);
          if (availableTotalStock !== undefined) maxAllowed = Math.min(maxAllowed, availableTotalStock);

          if (existing.quantity >= maxAllowed) {
            setCartStockWarning(`عذراً، المخزون المتوفر لهذه القطعة (${sizeToCart}) هو ${maxAllowed} قطعة فقط.`);
            return prev;
          }
        }
        setCartStockWarning(null);
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      setCartStockWarning(null);
      return [...prev, { ...product, quantity: 1, selectedSize: sizeToCart, selectedColor: colorToCart }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const item = prev[index];
      if (!item) return prev;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        setCartStockWarning(null);
        return prev.filter((_, i) => i !== index);
      }

      const isUnlimited = !!(item.isUnlimitedStock || item.unlimitedStock || Number(item.stock) >= 999999);

      if (delta > 0 && !isUnlimited) {
        const sizeStocksMap = normalizeObject(item.sizeStocks);
        const colorStocksMap = normalizeObject(item.colorStocks);

        const availableSizeStock = item.selectedSize && sizeStocksMap[item.selectedSize] !== undefined ? Number(sizeStocksMap[item.selectedSize]) : undefined;
        const availableColorStock = item.selectedColor && colorStocksMap[item.selectedColor] !== undefined ? Number(colorStocksMap[item.selectedColor]) : undefined;
        const availableTotalStock = item.stock !== undefined ? Number(item.stock) : undefined;

        let maxAllowed = 99;
        if (availableSizeStock !== undefined) maxAllowed = Math.min(maxAllowed, availableSizeStock);
        if (availableColorStock !== undefined) maxAllowed = Math.min(maxAllowed, availableColorStock);
        if (availableTotalStock !== undefined) maxAllowed = Math.min(maxAllowed, availableTotalStock);

        if (newQty > maxAllowed) {
          setCartStockWarning(`⚠️ المخزون لا يكفي! الكمية المتوفرة لـ (${item.title} - مقاس ${item.selectedSize || 'العادي'}) هي ${maxAllowed} قطعة فقط.`);
          return prev;
        }
      }

      setCartStockWarning(null);
      return prev.map((it, i) => i === index ? { ...it, quantity: newQty } : it);
    });
  };

  const availableCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const categoriesToShow = availableCategories.length > 0 ? availableCategories.slice(0, 4) : ['مجموعة 2026', 'الأزياء الراقية', 'حقائب', 'إكسسوارات'];

  const cartTotalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotalPrice = cart.reduce((total, item) => {
    const p = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
    return total + (p * item.quantity);
  }, 0);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = showFavoritesOnly ? favorites.includes(product.id) : true;
    return matchesSearch && matchesFav;
  });

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const currentProductPage = Math.min(productListPage, totalProductPages);
  const paginatedProducts = filteredProducts.slice((currentProductPage - 1) * productsPerPage, currentProductPage * productsPerPage);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert('يرجى إكمال الاسم، رقم الهاتف، وعنوان الشحن.');
      return;
    }

    let activeUser = user;
    if (!activeUser) {
      alert('عفواً، يجب تسجيل الدخول أو إنشاء حساب أولاً لإتمام الطلب وتتبعه.');
      try {
        const u = await loginWithGoogle();
        if (u) {
          activeUser = u;
          setUser(u);
          if (!customerName) setCustomerName(u.displayName || '');
        } else {
          return;
        }
      } catch (err) {
        return;
      }
    }

    const discountAmt = appliedCoupon ? Math.round((cartTotalPrice * appliedCoupon.discountPercent) / 100) : 0;
    const finalTotalAmt = Math.max(0, cartTotalPrice - discountAmt) + shippingFee;

    const newOrder = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString(),
      items: cart,
      subtotal: cartTotalPrice,
      discountAmount: discountAmt,
      discountPercent: appliedCoupon ? appliedCoupon.discountPercent : 0,
      promoCode: appliedCoupon ? appliedCoupon.code : null,
      shippingFee: shippingFee,
      totalPrice: finalTotalAmt,
      total: finalTotalAmt,
      currency: 'JOD',
      customerName,
      customerPhone,
      customerAddress,
      customerEmail: activeUser?.email || `${customerPhone}@guest.local`,
      status: 'قيد المعالجة (Pending)',
      details: {
        address: customerAddress,
        notes: `عنوان التوصيل: ${customerAddress}${appliedCoupon ? ` (كود الخصم: ${appliedCoupon.code})` : ''}`,
        promoCode: appliedCoupon ? appliedCoupon.code : null,
        discountPercent: appliedCoupon ? appliedCoupon.discountPercent : 0,
        discountAmount: discountAmt,
        shippingFee: shippingFee,
        subtotal: cartTotalPrice
      }
    };

    // Optimistically update local state & UI instantly
    const updatedUserOrders = [newOrder, ...userOrders];
    setUserOrders(updatedUserOrders);
    try {
      localStorage.setItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}_${user?.uid || 'guest'}`, JSON.stringify(updatedUserOrders));
      const generalOrders = JSON.parse(localStorage.getItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}`) || '[]');
      localStorage.setItem(`orders_fashion_${tenant?.subdomain || 'fashion_demo'}`, JSON.stringify([newOrder, ...generalOrders]));
    } catch (e) {
      console.warn('localStorage quota exceeded:', e);
    }

    setOrderSuccess(`تم إرسال طلبك بنجاح! رقم الطلب: ${newOrder.id}`);
    setCart([]);
    setIsCheckoutOpen(false);
    setTimeout(() => {
      setOrderSuccess(null);
      setIsTrackingOpen(true);
    }, 1800);

    // Sync order with backend asynchronously in background
    fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const savedOrder = data.inserted?.[0] || data.order;
        if (savedOrder && savedOrder.id && savedOrder.id !== newOrder.id) {
          setUserOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, id: savedOrder.id } : o));
        }
      }
    }).catch(err => console.warn('Server sync error, saved locally:', err));
  };

  const handleCancelOrderWithConfirm = (orderId: string | number) => {
    setConfirmModal({
      isOpen: true,
      title: 'إلغاء الطلب ⚠️',
      message: 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم تحويل حالة الطلب إلى ملغي ولن يتم تجهيزه.',
      confirmText: 'نعم، إلغاء الطلب',
      cancelText: 'تراجع والاحتفاظ بالطلب',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setUserOrders(prev => {
          const updated = prev.map(o => String(o.id) === String(orderId) ? { ...o, status: 'cancelled' } : o);
          try {
            const storageKey = user?.uid 
              ? `orders_fashion_${tenant?.subdomain || 'fashion_demo'}_${user.uid}`
              : `orders_fashion_${tenant?.subdomain || 'fashion_demo'}_guest`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        try {
          await fetch(`/api/public/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {}

        setOrderSuccess('تم إلغاء الطلب بنجاح');
        setTimeout(() => {
          setOrderSuccess(null);
        }, 3000);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-[#1a1a1a] selection:bg-[#9ca3af] selection:text-white relative font-sans" dir="rtl">
      
      {/* Top Announcement Bar */}
      {content?.announcementEnabled !== false && isAnnouncementOpen && (
        <div 
          className={`py-2 px-3 sm:py-2.5 sm:px-4 text-center overflow-hidden text-[11px] sm:text-xs relative flex items-center justify-between ${
            content?.announcementAnimation === 'pulse' ? 'animate-pulse' : 
            content?.announcementAnimation === 'bounce' ? 'animate-bounce' : ''
          }`}
          style={{
            backgroundColor: content?.announcementBgColor || '#111827',
            color: content?.announcementTextColor || '#ffffff',
            fontWeight: content?.announcementIsBold !== false ? '900' : '500',
          }}
        >
          <div className="flex-1 text-center">
            {content?.announcementAnimation === 'marquee-right' || content?.announcementAnimation === 'marquee-left' ? (
              <marquee direction={content?.announcementAnimation === 'marquee-right' ? 'left' : 'right'} scrollamount="12" scrolldelay="1" className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
                <span className="inline-flex items-center gap-12">
                  <span>{content?.announcementText || '✨ خصم خاص على تشكيلة الموسم الجديد + توصيل مجاني للطلبات فوق 50 د.أ'}</span>
                  <span>{content?.announcementText || '✨ خصم خاص على تشكيلة الموسم الجديد + توصيل مجاني للطلبات فوق 50 د.أ'}</span>
                </span>
              </marquee>
            ) : (
              <div className="text-[11px] sm:text-xs flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 leading-snug sm:leading-relaxed px-1">
                <span>{content?.announcementText || '✨ خصم خاص على تشكيلة الموسم الجديد + توصيل مجاني للطلبات فوق 50 د.أ'}</span>
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

      <header className="sticky top-0 z-50 bg-[#F8F8F5]/90 backdrop-blur-lg border-b border-[#e5e5e5]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
            <button 
              className="lg:hidden hover:opacity-60 transition-opacity"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu strokeWidth={1} size={24} />
            </button>
            
            {/* Mobile Title */}
            <h1 className="text-xl md:text-2xl font-serif italic tracking-wide text-right lg:hidden line-clamp-1 truncate pr-2">
              {storeTitle}
            </h1>
            
            <nav className="hidden lg:flex gap-8 text-[11px] font-medium uppercase tracking-[0.15em] text-[#4a4a4a]">
              {categoriesToShow.map((cat, i) => (
                <a key={i} href="#products" onClick={() => setSearchQuery(cat)} className="hover:text-black transition-colors">{cat}</a>
              ))}
              <button onClick={() => setIsTrackingOpen(true)} className="hover:text-black transition-colors font-bold text-indigo-900">📦 تتبع طلباتك</button>
            </nav>
          </div>
          
          <h1 className="hidden lg:block text-2xl md:text-3xl font-serif italic tracking-wide text-center shrink-0 px-2 line-clamp-1 max-w-[140px] md:max-w-none">
            {storeTitle}
          </h1>
          
          <div className="flex items-center justify-end gap-3 md:gap-5 flex-1">
            {isSearchOpen ? (
              <div className="flex items-center border-b border-black pb-1 animate-in fade-in slide-in-from-right-4 duration-300">
                <input
                  type="text"
                  placeholder="ابحث عن قطعة..."
                  className="bg-transparent outline-none text-xs w-20 md:w-32 placeholder-[#999] text-black font-sans"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button 
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} 
                  className="text-gray-400 hover:text-black ml-2 transition-colors"
                >
                  <X strokeWidth={1} size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsSearchOpen(true)} className="hover:opacity-60 transition-opacity">
                <Search strokeWidth={1} size={20} />
              </button>
            )}

            <button className="relative hover:opacity-60 transition-opacity">
              <Heart strokeWidth={1} size={20} className={favorites.length > 0 ? "fill-red-900 text-red-900" : ""} />
              {favorites.length > 0 && <span className="absolute -bottom-1 -right-2 bg-red-900 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{favorites.length}</span>}
            </button>

            <button onClick={() => setIsCartOpen(true)} className="relative hover:opacity-60 transition-opacity">
              <ShoppingBag strokeWidth={1} size={20} />
              {cartTotalItems > 0 && <span className="absolute -bottom-1 -right-2 bg-black text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{cartTotalItems}</span>}
            </button>

            {user ? (
              <div className="flex items-center gap-2 bg-white px-2 md:px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-xs font-bold hidden md:inline">{user.displayName?.split(' ')[0]}</span>
                <button onClick={() => logout()} title="تسجيل الخروج" className="text-gray-400 hover:text-red-600 mr-1"><LogOut size={14} /></button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleLogin} 
                className="bg-black text-white px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm"
              >
                <User size={14} /> <span className="hidden md:inline">تسجيل جوجل</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#000]">
          <img 
            src={content?.heroBgUrl || content?.heroBg || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"} 
            alt="Hero Fashion" 
            className="w-full h-full object-cover opacity-70 object-top"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#F8F8F5]"></div>
        
        <div className="relative z-10 text-center mt-20 flex flex-col items-center px-4">
          <span className="text-[12px] uppercase tracking-[0.3em] font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {heroSubtitleText}
          </span>
          <h2 className="text-4xl md:text-7xl font-serif text-white tracking-wide mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] max-w-4xl leading-tight font-black">
            {heroTitleText}
          </h2>
          <a 
            href="#products"
            className="group flex items-center gap-3 border border-white text-white px-8 py-4 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500 backdrop-blur-sm shadow-xl font-bold"
          >
            تسوقي المجموعة <ArrowRight size={16} className="group-hover:-translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Unified Search & Promo Code Bar */}
      <section className="bg-[#fcfcfc] border-b border-[#eaeaea] py-8 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Live Search Input */}
          <div className="relative w-full md:w-1/2">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحثي عن قطعة (مثال: فستان، حقيبة، حذاء)..."
              className="w-full bg-white border border-gray-200 focus:border-black text-black text-sm rounded-none pr-12 pl-4 py-4 outline-none font-medium placeholder-gray-400 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Discount Code Input */}
          <div className="relative w-full md:w-1/2 flex items-center gap-3">
            <div className="relative flex-1">
              <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-700" />
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                placeholder="أدخلي كود الخصم (مثال: SALE20)..."
                className="w-full bg-white border border-gray-200 focus:border-amber-700 text-black text-sm rounded-none pr-11 pl-4 py-4 outline-none font-bold uppercase placeholder-gray-400 tracking-wider transition-all shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => handleApplyCoupon()}
              className="px-6 py-4 bg-black hover:bg-neutral-800 text-white text-sm font-bold rounded-none shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0"
            >
              <Percent size={15} />
              <span>تطبيق الخصم</span>
            </button>
          </div>
        </div>

        {/* Coupon Banner / Applied Coupon Display */}
        {appliedCoupon && (
          <div className="max-w-[1600px] mx-auto mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-none flex items-center justify-between text-sm font-bold text-emerald-800 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>🎉 تمت إضافة نسبة خصم {appliedCoupon.discountPercent}% على طلبك القادم! (كود الخصم: <span className="font-mono text-black underline">{appliedCoupon.code}</span>)</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs text-rose-700 hover:text-rose-900 bg-rose-100/50 hover:bg-rose-100 px-4 py-2 rounded-none transition-colors cursor-pointer font-bold shrink-0"
            >
              إلغاء الخصم
            </button>
          </div>
        )}

        {/* Notification Toast for Code Verification */}
        {couponBanner && couponBanner.show && (
          <div className={`max-w-[1600px] mx-auto mt-4 p-4 rounded-none border text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in ${
            couponBanner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span>{couponBanner.msg}</span>
            <button onClick={() => setCouponBanner(null)} className="p-1 hover:opacity-75">
              <X size={16} />
            </button>
          </div>
        )}
      </section>

      <main id="products" className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16">
        <div className="flex justify-between items-end mb-12 border-b border-[#e5e5e5] pb-4">
          <div>
            <h3 className="text-2xl font-serif italic mb-1">
              {searchQuery ? "نتائج البحث" : "وصل حديثاً"}
            </h3>
            <p className="text-xs text-gray-500">أحدث تصاميم الأزياء الراقية المختارة بعناية.</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-gray-500">{filteredProducts.length} قطعة متاحة</span>
        </div>

        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-12">
              {paginatedProducts.map((product) => {
              const isFavorite = favorites.includes(product.id);
              const pColors = normalizeArray(product.colors);
              const pSizes = normalizeArray(product.sizes);
              const currentSize = selectedSizes[product.id] || pSizes[0] || 'M';
              const currentColor = selectedColors[product.id] || pColors[0] || '';

              const colorImgMap = normalizeObject(product.colorImages);
              const sizeStocksMap = normalizeObject(product.sizeStocks);
              const colorStocksMap = normalizeObject(product.colorStocks);

              const activeColorImg = getColorImage(colorImgMap, currentColor);
              const cardImage = activeColorImg || product.primaryImage || product.image;

              const origPriceVal = getOriginalPriceVal(product);

              const hasLowStockInVariants = 
                Object.values(sizeStocksMap).some((v: any) => { const n = Number(v); return !isNaN(n) && n > 0 && n <= 5; }) || 
                Object.values(colorStocksMap).some((v: any) => { const n = Number(v); return !isNaN(n) && n > 0 && n <= 5; });

              const prodStock = product.stock !== undefined ? Number(product.stock) : undefined;
              const isProdOutOfStock = prodStock !== undefined ? prodStock <= 0 : product.inventoryStatus === 'نفد من المخزون';
              const isProdLowStock = ((prodStock !== undefined && prodStock > 0 && prodStock <= 5) || hasLowStockInVariants) && !isProdOutOfStock;

              return (
                <div key={product.id} className="group flex flex-col cursor-pointer" onClick={() => { 
                  setSelectedProductForModal(product); 
                  const colorImgMapModal = normalizeObject(product.colorImages);
                  const initImg = getColorImage(colorImgMapModal, currentColor);
                  setModalActiveImage(initImg || null);
                }}>
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f4f4f2] mb-3 shadow-xs rounded-2xl border border-gray-100 flex items-center justify-center">
                    <img 
                      src={cardImage} 
                      alt={product.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${product.secondaryImage && !activeColorImg ? 'group-hover:opacity-0' : ''} ${isProdOutOfStock ? 'blur-[1px] opacity-60' : ''}`}
                    />
                    {product.secondaryImage && !activeColorImg && !isProdOutOfStock && (
                      <img 
                        src={product.secondaryImage} 
                        alt={`${product.title} on model`}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out opacity-0 scale-95 group-hover:scale-100 group-hover:opacity-100"
                      />
                    )}

                    {/* Stock Badges */}
                    {isProdOutOfStock ? (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px] z-20 flex items-center justify-center p-2">
                        <span className="bg-black/90 text-white font-black text-[11px] px-3.5 py-1.5 rounded-full shadow-lg border border-white/20">انتهت الكمية</span>
                      </div>
                    ) : isProdLowStock ? (
                      <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                        متبقي قطع قليلة! سارع في الطلب
                      </div>
                    ) : origPriceVal ? (
                      <div className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                        تخفيض
                      </div>
                    ) : null}
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(e, product.id); }}
                      className="absolute bottom-2 left-2 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition-all duration-300 shadow-sm"
                    >
                      <Heart size={12} className={`transition-colors ${isFavorite ? 'fill-red-900 text-red-900' : 'text-[#1a1a1a]'}`} />
                    </button>
                    
                    {!isProdOutOfStock && (
                      <div className="absolute bottom-0 left-0 w-full p-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                        <div className="w-full bg-[#1a1a1a] text-white py-2 text-center text-[9px] uppercase tracking-[0.1em] shadow-lg font-bold rounded-md">
                          عرض التفاصيل والمقاسات
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center gap-1 px-1">
                    <h3 className="text-[11px] font-bold text-gray-900 tracking-wide line-clamp-1">{product.title}</h3>
                    
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[13px] font-black text-slate-900">
                        {formatPrice(product.price)}
                      </span>
                      {origPriceVal && (
                        <span className="text-[11px] font-bold text-gray-400 line-through decoration-red-500">
                          {formatPrice(origPriceVal)}
                        </span>
                      )}
                    </div>

                    {/* Color swatches under card */}
                    {pColors.length > 0 && (
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        {pColors.map((col, cIdx) => {
                          const colStr = String(col).trim();
                          const isColActive = currentColor === colStr;
                          
                          const arabicColors: Record<string, string> = {
                            'أحمر': '#ef4444', 'أسود': '#000000', 'أبيض': '#ffffff', 'أزرق': '#3b82f6',
                            'كحلي': '#1e3a8a', 'أخضر': '#22c55e', 'أصفر': '#eab308', 'وردي': '#ec4899',
                            'زهري': '#ec4899', 'بني': '#78350f', 'برتقالي': '#f97316', 'رمادي': '#6b7280',
                            'سكني': '#6b7280', 'بنفسجي': '#a855f7', 'بيج': '#f5f5dc', 'ذهبي': '#ffd700',
                            'فضي': '#c0c0c0', 'عنابي': '#800000', 'خمري': '#800000', 'زيتي': '#4d7c0f',
                          };
                          const mappedColor = arabicColors[colStr] || colStr;
                          const isHex = typeof mappedColor === 'string' && (mappedColor.startsWith('#') || (/^[a-zA-Z]+$/.test(mappedColor) && mappedColor.length <= 15));

                          return (
                            <button
                              key={cIdx}
                              title={colStr}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectColor(product.id, colStr);
                              }}
                              className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                                isColActive ? 'ring-2 ring-black ring-offset-1 scale-110 border-black' : 'border-gray-300 opacity-70 hover:opacity-100'
                              }`}
                              style={isHex ? { backgroundColor: mappedColor } : { backgroundColor: '#e5e7eb' }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>

            {/* 📄 شريط التنقل بين صفحات المعروضات */}
            {totalProductPages > 1 && (
              <div className="mt-16 pt-8 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-bold text-gray-500">
                  عرض الصفحة <span className="text-slate-900 font-black">{currentProductPage}</span> من أصل <span className="text-slate-900 font-black">{totalProductPages}</span> صفحات ({filteredProducts.length} قطعة)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentProductPage === 1}
                    onClick={() => setProductListPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    ← الصفحة السابقة
                  </button>

                  <div className="flex items-center gap-1.5 px-2">
                    {Array.from({ length: totalProductPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProductListPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          p === currentProductPage 
                            ? 'bg-slate-900 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentProductPage === totalProductPages}
                    onClick={() => setProductListPage(p => Math.min(totalProductPages, p + 1))}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    الصفحة التالية →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 font-serif italic text-lg">لم يتم العثور على قطع تطابق بحثك.</p>
          </div>
        )}
      </main>

      {selectedProductForModal && (() => {
        const modalColors = normalizeArray(selectedProductForModal.colors);
        const modalSizes = normalizeArray(selectedProductForModal.sizes);
        const colorImgMap = normalizeObject(selectedProductForModal.colorImages);
        const colorStocksMap = normalizeObject(selectedProductForModal.colorStocks);
        const sizeStocksMap = normalizeObject(selectedProductForModal.sizeStocks);
        const sizeDetailsMap = normalizeObject(selectedProductForModal.sizeDetails);

        const isUnlimitedStock = !!(selectedProductForModal.isUnlimitedStock || selectedProductForModal.unlimitedStock || Number(selectedProductForModal.stock) >= 999999);

        const currentColor = selectedColors[selectedProductForModal.id] || modalColors[0] || '';
        const currentSize = selectedSizes[selectedProductForModal.id] || modalSizes[0] || '';

        const colorImageForCurrent = getColorImage(colorImgMap, currentColor);
        const baseImg = colorImageForCurrent || selectedProductForModal.primaryImage || selectedProductForModal.image;
        
        const allImages = new Set<string>();
        if (baseImg) allImages.add(String(baseImg));
        if (selectedProductForModal.primaryImage) allImages.add(String(selectedProductForModal.primaryImage));
        if (selectedProductForModal.image) allImages.add(String(selectedProductForModal.image));
        if (selectedProductForModal.secondaryImage) allImages.add(String(selectedProductForModal.secondaryImage));
        if (Array.isArray(selectedProductForModal.images)) {
          selectedProductForModal.images.forEach(img => { if (img) allImages.add(String(img)); });
        } else if (typeof selectedProductForModal.images === 'string') {
          try {
            const parsedImgs = JSON.parse(selectedProductForModal.images);
            if (Array.isArray(parsedImgs)) {
              parsedImgs.forEach(img => { if (img) allImages.add(String(img)); });
            }
          } catch (e) {}
        }
        if (colorImgMap) {
          Object.values(colorImgMap).forEach((img: any) => {
            if (img) {
              const url = String(img).trim();
              if (url) allImages.add(url);
            }
          });
        }
        
        const imagesArr = Array.from(allImages).filter(Boolean);
        const displayImage = modalActiveImage || baseImg || imagesArr[0];
        const activeIndex = imagesArr.indexOf(displayImage);

        const handlePrevImage = () => {
          const prevIdx = (activeIndex - 1 + imagesArr.length) % imagesArr.length;
          setModalActiveImage(imagesArr[prevIdx]);
        };

        const handleNextImage = () => {
          const nextIdx = (activeIndex + 1) % imagesArr.length;
          setModalActiveImage(imagesArr[nextIdx]);
        };

        const sStock = isUnlimitedStock ? 999999 : (currentSize ? (sizeStocksMap[currentSize] !== undefined ? Number(sizeStocksMap[currentSize]) : undefined) : undefined);
        const isSizeOutOfStock = !isUnlimitedStock && sStock !== undefined && sStock <= 0;

        const cStock = isUnlimitedStock ? 999999 : (currentColor ? (colorStocksMap[currentColor] !== undefined ? Number(colorStocksMap[currentColor]) : undefined) : undefined);
        const isColorOutOfStock = !isUnlimitedStock && cStock !== undefined && cStock <= 0;

        const stock = isUnlimitedStock ? 999999 : (selectedProductForModal.stock !== undefined ? Number(selectedProductForModal.stock) : undefined);
        const isOverallLowStock = !isUnlimitedStock && stock !== undefined && stock > 0 && stock <= 5;
        const isOverallOutOfStock = !isUnlimitedStock && (stock !== undefined 
          ? stock <= 0 
          : selectedProductForModal.inventoryStatus === 'نفد من المخزون');

        const isOutOfStock = !isUnlimitedStock && (isSizeOutOfStock || isColorOutOfStock || isOverallOutOfStock);
        const isLowStock = !isUnlimitedStock && ((!currentSize && !currentColor && isOverallLowStock) || 
                           (currentSize && sStock !== undefined && sStock <= 5 && sStock > 0) || 
                           (currentColor && cStock !== undefined && cStock <= 5 && cStock > 0));

        const reviewsForCurrentProduct = reviews.filter(r => String(r.productId) === String(selectedProductForModal.id));
        const avgRating = reviewsForCurrentProduct.length > 0 
          ? reviewsForCurrentProduct.reduce((acc, curr) => acc + Number(curr.rating || 5), 0) / reviewsForCurrentProduct.length 
          : 5;

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            dir="rtl"
          >
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto p-6 sm:p-10 border border-slate-100">
              {/* Clean Close X Button */}
              <button 
                type="button"
                onClick={() => setSelectedProductForModal(null)} 
                className="absolute top-5 right-5 z-20 w-10 h-10 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer"
                title="إغلاق"
              >
                <X size={20} />
              </button>

              {/* Main Content Container */}
              <div className="max-w-5xl mx-auto pt-2">
              {/* Product Hero Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start mb-16">
                
                {/* Left Column: Image Gallery (In normal flow, so scrolling down scrolls image up off screen!) */}
                <div className="bg-[#f9f9f8] rounded-3xl p-4 sm:p-6 border border-slate-100 flex flex-col items-center shadow-2xs">
                  <div 
                    className="relative w-full aspect-square max-h-[420px] flex items-center justify-center p-2 overflow-hidden my-auto cursor-grab active:cursor-grabbing select-none"
                    onTouchStart={(e) => { touchStartX.current = e.targetTouches[0].clientX; }}
                    onTouchMove={(e) => { touchEndX.current = e.targetTouches[0].clientX; }}
                    onTouchEnd={() => {
                      if (!touchStartX.current || !touchEndX.current) return;
                      const dist = touchStartX.current - touchEndX.current;
                      if (dist > 40) handleNextImage();
                      else if (dist < -40) handlePrevImage();
                      touchStartX.current = null;
                      touchEndX.current = null;
                    }}
                  >
                    <img 
                      src={displayImage} 
                      alt={selectedProductForModal.title}
                      className={`w-full h-full object-contain rounded-2xl transition-all duration-300 ${isOverallOutOfStock ? 'blur-[1.5px] opacity-60' : ''}`}
                    />

                    {/* Out of stock product overlay */}
                    {isOverallOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px] z-20 flex items-center justify-center p-2 rounded-2xl">
                        <span className="bg-black/90 text-white font-black text-sm px-5 py-2.5 rounded-full shadow-2xl border border-white/20">انتهت الكمية</span>
                      </div>
                    )}
                    
                    {imagesArr.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-black shadow-md transition-all cursor-pointer z-10"
                          title="الصورة السابقة"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-black shadow-md transition-all cursor-pointer z-10"
                          title="الصورة التالية"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </div>

                  {imagesArr.length > 1 && (
                    <div className="flex gap-2.5 p-3 w-full overflow-x-auto justify-center mt-4 border-t border-slate-200/60">
                      {imagesArr.map((img, idx) => (
                        <button 
                          key={idx} 
                          type="button"
                          onClick={() => setModalActiveImage(img)}
                          className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${displayImage === img ? 'border-slate-900 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Product Options & Purchase Info */}
                <div className="flex flex-col justify-start">
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">{selectedProductForModal.category}</div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 mb-3">{selectedProductForModal.title}</h1>
                  
                  {/* Rating Summary Header */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={18} fill={i < Math.round(avgRating) ? 'currentColor' : 'none'} className={i < Math.round(avgRating) ? 'text-amber-400' : 'text-slate-200'} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">({reviewsForCurrentProduct.length} تقييم ومراجعة من العملاء)</span>
                  </div>

                  <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="text-3xl font-black text-slate-900">
                      {formatPrice(selectedProductForModal.price)}
                    </div>
                    {(() => {
                      const modalOrigPrice = getOriginalPriceVal(selectedProductForModal);
                      return modalOrigPrice ? (
                        <div className="text-lg font-bold text-gray-400 line-through decoration-red-500">
                          {formatPrice(modalOrigPrice)}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  
                  {selectedProductForModal.description && (
                    <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                      <h4 className="text-xs font-bold text-slate-900 mb-1.5">وصف المنتج:</h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {selectedProductForModal.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-6 mb-8">
                    {modalColors.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-3">اللون</h4>
                        <div className="flex flex-wrap gap-2.5">
                          {modalColors.map((color, index) => {
                            const cStk = colorStocksMap[color] !== undefined ? Number(colorStocksMap[color]) : undefined;
                            const isColorBtnOutOfStock = cStk !== undefined && cStk <= 0;
                            const isColorBtnLowStock = cStk !== undefined && cStk > 0 && cStk <= 5;
                            
                            const arabicColors: Record<string, string> = {
                              'أحمر': '#ef4444', 'أسود': '#000000', 'أبيض': '#ffffff', 'أزرق': '#3b82f6',
                              'كحلي': '#1e3a8a', 'أخضر': '#22c55e', 'أصفر': '#eab308', 'وردي': '#ec4899',
                              'زهري': '#ec4899', 'بني': '#78350f', 'برتقالي': '#f97316', 'رمادي': '#6b7280',
                              'سكني': '#6b7280', 'بنفسجي': '#a855f7', 'بيج': '#f5f5dc', 'ذهبي': '#ffd700',
                              'فضي': '#c0c0c0', 'عنابي': '#800000', 'خمري': '#800000', 'زيتي': '#4d7c0f',
                            };
                            const colorStr = String(color).trim();
                            const mappedColor = arabicColors[colorStr] || colorStr;
                            const isHex = typeof mappedColor === 'string' && (mappedColor.startsWith('#') || (/^[a-zA-Z]+$/.test(mappedColor) && mappedColor.length <= 15));
                            const hasCustomImg = !!getColorImage(colorImgMap, colorStr);

                            return (
                              <div key={index} className="flex flex-col gap-1 items-center">
                                <button 
                                  disabled={isColorBtnOutOfStock}
                                  title={colorStr}
                                  onClick={() => handleSelectColor(selectedProductForModal.id, colorStr)}
                                  className={`transition-all border flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden ${
                                    currentColor === colorStr 
                                      ? 'border-black bg-black text-white font-black shadow-sm ring-2 ring-black/20 ring-offset-1' 
                                      : 'border-gray-200 bg-white text-gray-800 font-bold hover:border-gray-400'
                                  } ${isColorBtnOutOfStock ? 'opacity-40 cursor-not-allowed' : ''} px-3.5 py-2 text-xs rounded-xl`}
                                >
                                  {isHex && (
                                    <span 
                                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 inline-block" 
                                      style={{ backgroundColor: mappedColor }}
                                    />
                                  )}
                                  <span>{colorStr}</span>
                                  {hasCustomImg && (
                                    <span className="text-[10px] opacity-80" title="صورة مخصصة لهذا اللون">🖼️</span>
                                  )}

                                  {/* Black strikethrough line over unavailable color option */}
                                  {isColorBtnOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-full h-[2px] bg-black rotate-[-20deg] transform scale-110"></div>
                                    </div>
                                  )}
                                </button>
                                {isColorBtnLowStock && <span className="text-[9px] text-red-500 font-bold whitespace-nowrap">متبقي {cStk}</span>}
                                {isColorBtnOutOfStock && <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">نفذت</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {modalSizes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-3">المقاس</h4>
                        <div className="flex flex-wrap gap-2">
                          {modalSizes.map((size, index) => {
                            const sizeStr = String(size).trim();
                            const sStk = sizeStocksMap[sizeStr] !== undefined ? Number(sizeStocksMap[sizeStr]) : undefined;
                            const isBtnOutOfStock = sStk !== undefined && sStk <= 0;
                            const isBtnLowStock = sStk !== undefined && sStk > 0 && sStk <= 5;
                            return (
                              <div key={index} className="flex flex-col gap-1 items-center">
                                <button 
                                  disabled={isBtnOutOfStock}
                                  onClick={() => handleSelectSize(selectedProductForModal.id, sizeStr)}
                                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors relative overflow-hidden ${
                                    currentSize === sizeStr ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                                  } ${isBtnOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <span>{sizeStr}</span>

                                  {/* Red strikethrough line over unavailable size option */}
                                  {isBtnOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-full h-[2px] bg-red-600 rotate-[-20deg] transform scale-110"></div>
                                    </div>
                                  )}
                                </button>
                                {isBtnLowStock && <span className="text-[9px] text-red-500 font-bold">متبقي {sStk}</span>}
                                {isBtnOutOfStock && <span className="text-[9px] text-gray-400 font-bold">نفذت</span>}
                              </div>
                            );
                          })}
                        </div>

                        {currentSize && sizeDetailsMap[currentSize] && (
                          <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 flex items-start gap-2 shadow-2xs">
                            <span className="text-base shrink-0">📏</span>
                            <div>
                              <span className="font-extrabold text-slate-900 block mb-0.5">تفاصيل وملاءمة مقاس ({currentSize}):</span>
                              <p className="font-bold text-slate-700 leading-relaxed">{sizeDetailsMap[currentSize]}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {isLowStock && !isOutOfStock && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-extrabold text-center animate-pulse">
                        {`متبقي ${currentSize && sStock !== undefined ? sStock : (currentColor && cStock !== undefined ? cStock : stock)} فقط! سارع في الطلب`}
                      </div>
                    )}
                    <button 
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        addToCart(e, selectedProductForModal);
                        setSelectedProductForModal(null);
                      }}
                      className={`w-full py-4 text-xs uppercase tracking-[0.15em] transition-colors shadow-lg font-bold rounded-xl cursor-pointer ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#1a1a1a] text-white hover:bg-black'}`}
                    >
                      {isOutOfStock ? 'انتهت الكمية' : 'إضافة إلى حقيبة التسوق'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 🌟 Customer Reviews & Photo Submissions Section */}
              <div className="mt-12 pt-10 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span>تقييمات وآراء العملاء بالمنتج</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 font-extrabold">
                        {reviewsForCurrentProduct.length} تقييم
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      تجارب حقيقية وصور مباشرة للمنتج من العملاء بعد الاستلام
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl shrink-0">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={20} fill={i < Math.round(avgRating) ? 'currentColor' : 'none'} className={i < Math.round(avgRating) ? 'text-amber-400' : 'text-amber-200'} />
                      ))}
                    </div>
                    <span className="text-sm font-black text-amber-900">{avgRating.toFixed(1)} / 5</span>
                  </div>
                </div>

                {/* Review Submission Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-10 shadow-2xs">
                  <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <span>أضف تقييمك ورأيك عن المنتج بعد الاستلام:</span>
                  </h4>
                  <p className="text-xs text-slate-500 mb-4 font-medium">شارِك تجربتك وصورة للمنتج لما وصلك لمساعدة باقي العملاء</p>

                  {reviewSuccessMsg && (
                    <div className="p-3 mb-4 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in">
                      <Check size={16} />
                      <span>شكراً لك! تم إضافة تقييمك ورأيك بنجاح وظهر ضمن تقييمات المنتج.</span>
                    </div>
                  )}

                  <form onSubmit={(e) => handleAddReview(e, selectedProductForModal.id)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">تقييمك بالنجوم:</label>
                        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewRating(star)}
                              className="p-1 cursor-pointer transition-transform hover:scale-125"
                            >
                              <Star size={22} fill={star <= newReviewRating ? '#f59e0b' : 'none'} className={star <= newReviewRating ? 'text-amber-500' : 'text-slate-300'} />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-slate-600 mr-2">({newReviewRating} من 5)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">اسمك الكريم:</label>
                        <input
                          type="text"
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          placeholder="مثال: أحمد علي"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تفاصيل رأيك وتجربتك مع المنتج:</label>
                      <textarea
                        rows={3}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="اكتب تعليقك ورأيك عن جودة القماش، المقاس، سرعة التوصيل..."
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-medium focus:border-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">إرفاق صورة للمنتج بعد الاستلام (اختياري):</label>
                      <div className="flex items-center gap-3">
                        <label className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs">
                          <Camera size={16} className="text-slate-600" />
                          <span>📸 اختيار صورة للمنتج لما وصلك</span>
                          <input type="file" onChange={handleReviewPhotoUpload} accept="image/*" className="hidden" />
                        </label>

                        {newReviewImage && (
                          <div className="relative inline-block">
                            <img src={newReviewImage} alt="المعاينة" className="h-12 w-12 object-cover rounded-xl border-2 border-slate-900 shadow-xs" />
                            <button
                              type="button"
                              onClick={() => setNewReviewImage(null)}
                              className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>إرسال التقييم والمراجعة</span>
                      <CheckCircle2 size={16} />
                    </button>
                  </form>
                </div>

                {/* Display Existing Reviews */}
                <div className="space-y-4">
                  {reviewsForCurrentProduct.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                      لا توجد تقييمات لهذا المنتج بعد. كن أول من يشارك رأيه وصورة للمنتج!
                    </div>
                  ) : (
                    reviewsForCurrentProduct.map((rev) => (
                      <div key={rev.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                              {rev.customerName ? rev.customerName.charAt(0) : 'ع'}
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900">{rev.customerName || 'عميل مجهول'}</h5>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.createdAt).toLocaleDateString('ar-JO')}
                              </span>
                            </div>
                          </div>

                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} size={14} fill={i < rev.rating ? 'currentColor' : 'none'} className={i < rev.rating ? 'text-amber-400' : 'text-slate-200'} />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">
                          {rev.comment}
                        </p>

                        {rev.image && (
                          <div className="mt-3">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">📸 صورة المنتج عند الاستلام من العميل:</span>
                            <button
                              type="button"
                              onClick={() => setReviewPhotoPreviewModal(rev.image)}
                              className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs group cursor-pointer text-right inline-block"
                            >
                              <img src={rev.image} alt="صورة العميل" className="h-32 w-auto max-w-[200px] object-cover rounded-xl group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                🔍 اضغط للتكبير
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      })()}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="h-20 px-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold">حقيبة التسوق ({cartTotalItems})</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartStockWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-pulse">
                    <span>{cartStockWarning}</span>
                    <button onClick={() => setCartStockWarning(null)} className="text-amber-700 hover:text-amber-950 text-base font-bold shrink-0">✕</button>
                  </div>
                )}

                {cart.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">حقيبة التسوق فارغة حالياً</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 items-center">
                      <img src={((item.selectedColor && item.colorImages?.[item.selectedColor]) || item.primaryImage || item.image)} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs mb-1 truncate">{item.title}</h4>
                        <p className="text-[10px] text-gray-500 mb-1">المقاس: {item.selectedSize || 'عادي'} | السعر: {formatPrice(item.price)}</p>
                        
                        {/* Quantity increment / decrement buttons */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] font-bold text-gray-600">الكمية:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button 
                              onClick={() => updateCartQuantity(idx, -1)}
                              className="w-7 h-7 flex items-center justify-center font-black text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-sm"
                              title="إنقاص الكمية"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-gray-900 bg-gray-50/50 py-1">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(idx, 1)}
                              className="w-7 h-7 flex items-center justify-center font-black text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-sm"
                              title="زيادة الكمية"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setCartStockWarning(null);
                          setCart(cart.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 hover:text-red-700 p-2 cursor-pointer transition-colors"
                        title="حذف المنتج من السلة"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (() => {
                const discountAmount = appliedCoupon ? Math.round((cartTotalPrice * appliedCoupon.discountPercent) / 100) : 0;
                const finalTotal = Math.max(0, cartTotalPrice - discountAmount) + shippingFee;

                return (
                <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
                  {/* Promo Code Input in Cart */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2 mb-2 shadow-sm">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      <span>هل لديك كود خصم؟</span>
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-bold text-emerald-800">
                        <span>كود ({appliedCoupon.code}) - خصم {appliedCoupon.discountPercent}%</span>
                        <button onClick={handleRemoveCoupon} className="text-rose-600 hover:underline text-[11px]">حذف</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder="أدخلي الكود..."
                          className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold uppercase outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors"
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

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>المجموع الفرعي:</span>
                      <span className="font-bold">{formatPrice(cartTotalPrice)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>الخصم ({appliedCoupon.discountPercent}%):</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>رسوم الشحن والتوصيل:</span>
                      <span className="font-bold text-black">
                        {shippingFee === 0 ? <span className="text-emerald-600">مجاني</span> : formatPrice(shippingFee)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-sm font-bold text-black">
                      <span>الإجمالي النهائي:</span>
                      <span className="text-lg font-serif">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-black text-white py-4 text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors font-bold rounded-xl shadow-lg mt-2"
                  >
                    إتمام الشراء والدفع الآمن
                  </button>
                </div>
              );})()}
            </div>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-bold text-lg font-serif">إتمام الطلب وتحديد عنوان الشحن</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
            </div>

            {!user && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-900 mb-1">سجل دخولك بحساب جوجل لحفظ الطلب في حسابك</p>
                  <p className="text-[10px] text-indigo-700">لتتمكن من تتبع حالة الطلب في أي وقت.</p>
                </div>
                <button onClick={handleGoogleLogin} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold">
                  تسجيل جوجل
                </button>
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل *</label>
                <input 
                  type="text" 
                  required 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-black font-medium"
                  placeholder="أدخل اسمك الكريم"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف الجوال *</label>
                <input 
                  type="tel" 
                  required 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-black font-mono"
                  placeholder="+962 7xxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عنوان الشحن التفصيلي (المدينة، الشارع، المبنى) *</label>
                <textarea 
                  required 
                  rows={3} 
                  value={customerAddress} 
                  onChange={(e) => setCustomerAddress(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-black font-medium"
                  placeholder="المدينة، الحي، اسم الشارع، رقم الطابق أو الشقة"
                ></textarea>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl space-y-2 border">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>عدد القطع:</span>
                  <span className="font-bold">{cartTotalItems} قطعة</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-black border-t pt-2">
                  <span>الإجمالي النهائي للدفع:</span>
                  <span className="font-serif">{cartTotalPrice.toFixed(2)} JOD</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-black text-white py-4 rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors shadow-lg"
              >
                تأكيد وإرسال الطلب (الدفع عند الاستلام)
              </button>
            </form>
          </div>
        </div>
      )}

      
      {/* Mobile Menu Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-sm bg-[#F8F8F5] h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="p-6 flex justify-between items-center border-b border-[#e5e5e5]">
              <h2 className="text-xl font-serif italic tracking-wide">{storeTitle}</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-black">
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">الأقسام</div>
                {categoriesToShow.map((cat, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setSearchQuery(cat);
                      setIsMobileMenuOpen(false);
                      window.location.hash = '#products';
                    }} 
                    className="block w-full text-right text-lg font-bold text-[#1a1a1a] border-b border-gray-100 pb-3 hover:text-indigo-600 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="pt-6 space-y-4">
                <button 
                  onClick={() => { setIsTrackingOpen(true); setIsMobileMenuOpen(false); }} 
                  className="flex items-center gap-3 w-full p-4 bg-indigo-50 text-indigo-900 rounded-xl font-bold transition-colors"
                >
                  <ShieldCheck size={20} />
                  <span>تتبع طلباتك</span>
                </button>
                
                <button 
                  onClick={() => { 
                    setShowFavoritesOnly(!showFavoritesOnly);
                    setIsMobileMenuOpen(false);
                    window.location.hash = '#products';
                  }} 
                  className={`flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-colors ${showFavoritesOnly ? 'bg-red-50 text-red-900' : 'bg-gray-50 text-gray-700'}`}
                >
                  <Heart size={20} className={showFavoritesOnly ? "fill-red-900" : ""} />
                  <span>{showFavoritesOnly ? 'عرض جميع المنتجات' : 'عرض المفضلة فقط'}</span>
                </button>
                
                <div className="border-t border-[#e5e5e5] pt-4 mt-4">
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">الدعم والسياسات</div>
                  
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      window.dispatchEvent(new CustomEvent('open-support-widget'));
                    }} 
                    className="flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-colors hover:bg-gray-50 text-gray-700"
                  >
                    <MessageCircle size={20} />
                    <span>طلب مساعدة</span>
                  </button>
                  
                  {true && (
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('open-privacy'));
                      }} 
                      className="flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-colors hover:bg-gray-50 text-gray-700"
                    >
                      <Shield size={20} />
                      <span>سياسة الخصوصية</span>
                    </button>
                  )}
                  
                  {true && (
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('open-terms'));
                      }} 
                      className="flex items-center gap-3 w-full p-4 rounded-xl font-bold transition-colors hover:bg-gray-50 text-gray-700"
                    >
                      <FileText size={20} />
                      <span>شروط الخدمة</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#e5e5e5] bg-white">
              {!user ? (
                <button onClick={handleGoogleLogin} className="w-full bg-black text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                  <User size={18} /> تسجيل الدخول للتتبع
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{user.displayName}</span>
                      <span className="text-[10px] text-gray-500">{user.email}</span>
                    </div>
                  </div>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg">
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isTrackingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-serif">سجل وتتبع طلباتك</h3>
                  <p className="text-xs text-gray-500">متابعة حالة التوصيل والتجهيز خطوة بخطوة.</p>
                </div>
              </div>
              <button onClick={() => setIsTrackingOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
            </div>

            {!user ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-sm text-gray-600">يرجى تسجيل الدخول بحساب جوجل لعرض طلباتك المحفوظة.</p>
                <button onClick={handleGoogleLogin} className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold">
                  تسجيل الدخول بحساب جوجل
                </button>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">لا توجد طلبات سابقة مسجلة لحسابك حتى الآن.</p>
              </div>
            ) : (
              <>
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4 text-xs font-bold">
                  <button onClick={() => setTrackingTab('current')} className={`flex-1 py-2 rounded-lg transition-all ${trackingTab === 'current' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}>طلباتي الحالية</button>
                  <button onClick={() => setTrackingTab('previous')} className={`flex-1 py-2 rounded-lg transition-all ${trackingTab === 'previous' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}>الطلبات السابقة</button>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">الطلبات المسجلة هنا هي للقراءة وتتبع الحالة فقط، ولا يمكن التعديل عليها أو إضافتها للسلة مجدداً.</p>
                </div>
                <div className="space-y-4">
                  {userOrders.filter(ord => trackingTab === 'current' ? !['completed', 'cancelled', 'customer_cancelled', 'تم التسليم'].includes(ord.status) : ['completed', 'cancelled', 'customer_cancelled', 'تم التسليم'].includes(ord.status)).length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs font-bold">لا توجد طلبات في هذا القسم</div>
                  ) : (
                    userOrders.filter(ord => trackingTab === 'current' ? !['completed', 'cancelled', 'customer_cancelled', 'تم التسليم'].includes(ord.status) : ['completed', 'cancelled', 'customer_cancelled', 'تم التسليم'].includes(ord.status)).map((ord, i) => (
                    <div key={i} className="border border-gray-200 rounded-2xl p-5 bg-gray-50 space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <div>
                          <span className="font-bold text-sm text-black">رقم الطلب: {ord.id}</span>
                          <span className="text-[10px] text-gray-400 block">{new Date(ord.createdAt || ord.date).toLocaleString('ar-JO')}</span>
                        </div>
                        {(ord.status === 'deleted' || ord.deletedAt != null) ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">
                            ❌ لم يتم قبول طلبك
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                            {ord.status || 'قيد المعالجة'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {ord.items?.map((item: any, idx: number) => {
                          const image = (item.selectedColor && item.colorImages?.[item.selectedColor]) || item.primaryImage || item.image || item.product?.primaryImage || item.product?.image;
                          const title = item.title || item.product?.title;
                          
                          return (
                            <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                              {image && <img src={image} alt="" className="w-12 h-14 object-cover rounded-md" />}
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-800 line-clamp-1">{title}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {item.selectedSize && `المقاس: ${item.selectedSize}`}
                                  {item.selectedSize && item.selectedColor && ' | '}
                                  {item.selectedColor && `اللون: ${item.selectedColor}`}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-gray-900">{formatPrice(item.price)}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">الكمية: {item.quantity}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Financial Breakdown: Subtotal, Promo Code, Discount, Shipping */}
                      <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs space-y-2 font-medium my-2">
                        {(ord.subtotal || ord.details?.subtotal) && (
                          <div className="flex justify-between text-gray-500">
                            <span>المجموع الفرعي:</span>
                            <span className="font-bold text-gray-700">{formatPrice(ord.subtotal || ord.details?.subtotal)}</span>
                          </div>
                        )}
                        {(ord.promoCode || ord.details?.promoCode) && (
                          <div className="flex justify-between items-center text-pink-700 font-bold bg-pink-50 p-2 rounded-lg border border-pink-100">
                            <span>كود الخصم المستعمل:</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-pink-200 text-xs">
                              🏷️ {ord.promoCode || ord.details?.promoCode}
                            </span>
                          </div>
                        )}
                        {(ord.discountAmount || ord.discountPercent || ord.details?.discountAmount) ? (
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>قيمة الخصم المقتطعة:</span>
                            <span>- {formatPrice(ord.discountAmount || ord.details?.discountAmount || 0)}</span>
                          </div>
                        ) : null}
                        {(ord.shippingFee !== undefined || ord.details?.shippingFee !== undefined) && (
                          <div className="flex justify-between text-gray-500">
                            <span>رسوم الشحن والتوصيل:</span>
                            <span className="font-bold text-gray-700">{formatPrice(ord.shippingFee ?? ord.details?.shippingFee ?? 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs font-black text-black">
                          <span>الإجمالي النهائي المستحق:</span>
                          <span className="font-serif text-sm text-indigo-900">{formatPrice(ord.totalPrice || ord.total || ord.details?.finalTotal || ord.details?.total || 0)}</span>
                        </div>
                      </div>

                    <div className="pt-3">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-bold">
                        <span className={['pending', 'confirmed', 'preparing', 'on_the_way', 'completed'].includes(ord.status) || ord.status?.includes('قيد المعالجة') ? "text-indigo-600" : ""}>✓ تم الاستلام</span>
                        <span className={['confirmed', 'preparing', 'on_the_way', 'completed'].includes(ord.status) ? "text-indigo-600" : ""}>⚙️ قيد التجهيز</span>
                        <span className={['on_the_way', 'completed'].includes(ord.status) ? "text-indigo-600" : ""}>🚚 جاري الشحن</span>
                        <span className={['completed'].includes(ord.status) ? "text-indigo-600" : ""}>⭐ تم التسليم</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden relative">
                        <div className={`bg-indigo-600 h-full rounded-full transition-all duration-1000 ${
                          ord.status === 'completed' ? 'w-full' :
                          ord.status === 'on_the_way' ? 'w-3/4' :
                          (ord.status === 'preparing' || ord.status === 'confirmed') ? 'w-1/2' :
                          'w-1/4'
                        }`}></div>
                      </div>
                      
                      {(ord.status === 'cancelled' || ord.status === 'customer_cancelled' || ord.status === 'ملغي') ? (
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mt-3 text-right space-y-1.5 animate-fadeIn">
                          <div className="flex items-center gap-2 font-black text-rose-800 text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              {ord.status === 'customer_cancelled' || ord.details?.cancelledBy === 'customer'
                                ? 'تم إلغاء هذا الطلب بناءً على طلبك'
                                : 'تم إلغاء هذا الطلب بواسطة إدارة المتجر'}
                            </span>
                          </div>
                          <p className="text-xs text-rose-700 leading-relaxed font-medium">
                            {ord.status === 'customer_cancelled' || ord.details?.cancelledBy === 'customer'
                              ? 'تمت عملية إلغاء الطلب بنجاح ولن يتم تجهيزه أو شحنه.'
                              : 'نعتذر منك، تم إلغاء هذا الطلب من قِبل إدارة المتجر. إذا كان لديك أي استفسار يسعدنا تواصلك معنا.'}
                          </p>
                        </div>
                      ) : ord.status !== 'completed' && ord.status !== 'تم التسليم' && (
                        <div className="mt-3 space-y-2">
                          <button
                            onClick={() => handleCancelOrderWithConfirm(ord.id)}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X size={14} />
                            <span>إلغاء الطلب</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Courier Details */}
                    {['on_the_way', 'completed'].includes(ord.status) && ord.details?.courierName && (
                      <div className="mt-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col gap-1 text-xs">
                        <div className="font-bold text-indigo-800 flex items-center gap-1.5"><Truck size={14} /> بيانات المندوب</div>
                        <div className="text-indigo-600">الاسم: <span className="font-bold">{ord.details.courierName}</span></div>
                        {ord.details.courierPhone && <div className="text-indigo-600">الهاتف: <span className="font-bold font-mono">{ord.details.courierPhone}</span></div>}
                        {ord.details.expectedDelivery && <div className="text-indigo-600">متوقع التوصيل: <span className="font-bold">{ord.details.expectedDelivery}</span></div>}
                      </div>
                    )}

                    {/* Feedback Form */}
                    {(ord.status === 'completed' || ord.status === 'on_the_way') && !ord.details?.feedback && !ord.details?.customerCleared && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-xs font-bold text-gray-800 mb-3 text-center">🎉 هل قمت باستلام طلبك؟ شاركنا ملاحظاتك أو قم بتأكيد الاستلام!</p>
                        {feedbackInput.id === ord.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea 
                              value={feedbackInput.text}
                              onChange={(e) => setFeedbackInput({ id: ord.id, text: e.target.value })}
                              placeholder="اكتب ملاحظاتك هنا (يمكنك تضمين رابط صورة إذا أردت)..."
                              className="w-full text-xs p-3 rounded-xl border border-gray-300 outline-none"
                              rows={3}
                            ></textarea>
                            <div className="flex gap-2">
                              <button onClick={() => handleFeedbackSubmit(ord.id, ord.customerPhone, feedbackInput.text, false)} className="flex-1 bg-black text-white text-xs py-2 rounded-xl font-bold">إرسال الملاحظة</button>
                              <button onClick={() => setFeedbackInput({ id: "", text: "" })} className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 rounded-xl font-bold">إلغاء</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => setFeedbackInput({ id: ord.id, text: "" })} className="flex-1 border border-gray-300 bg-white text-gray-700 text-[11px] py-2 rounded-xl font-bold hover:bg-gray-50">نعم، لدي ملاحظة</button>
                            <button onClick={() => handleFeedbackSubmit(ord.id, ord.customerPhone, "", true)} className="flex-1 bg-gray-100 text-gray-600 text-[11px] py-2 rounded-xl font-bold hover:bg-gray-200">تأكيد الاستلام كاملة</button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {ord.details?.feedback && (
                      <div className="mt-3 bg-gray-100 p-3 rounded-xl border border-gray-200 text-xs">
                        <div className="font-bold text-gray-700 mb-1">ملاحظتك:</div>
                        <div className="text-gray-600">"{ord.details.feedback}"</div>
                      </div>
                    )}

                  </div>
                )))}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal for Customer Review Photos */}
      {reviewPhotoPreviewModal && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-xs z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setReviewPhotoPreviewModal(null)}
          dir="rtl"
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-200">
                📸 صورة المنتج المرفقة من العميل عند الاستلام
              </span>
              <button
                type="button"
                onClick={() => setReviewPhotoPreviewModal(null)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X size={16} />
                <span>إغلاق المعاينة</span>
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img 
                src={reviewPhotoPreviewModal} 
                alt="صورة المنتج من العميل" 
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl" 
              />
            </div>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <CheckCircle2 size={20} />
          <span>{orderSuccess}</span>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                className="w-full py-3 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
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
      <SupportWidget tenant={tenant} primaryColor={content?.primaryColor || "#000000"} />
    </div>
  );
}
