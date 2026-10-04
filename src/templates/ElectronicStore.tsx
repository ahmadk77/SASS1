import React, { useState, useRef } from 'react';
import { ShoppingCart, Search, Menu, Heart, ArrowRight, X, User, Truck, CheckCircle2, ShieldCheck, Sparkles, LogOut, MessageCircle, Shield, FileText, Upload, ChevronLeft, ChevronRight, Star, Cpu, Smartphone, Laptop, Headphones, Gamepad2, Battery, Check, Trash2, Zap, Camera, AlertTriangle, Tag, Percent } from 'lucide-react';
import { loginWithGoogle, logout, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SupportWidget from '../components/SupportWidget';

interface ElectronicProduct {
  id: string | number;
  title: string;
  price: number | string;
  originalPrice?: number | string;
  storageStocks?: Record<string, number> | string;
  storageDetails?: Record<string, string> | string;
  colorStocks?: Record<string, number> | string;
  colorImages?: Record<string, string> | string;
  primaryImage?: string;
  image?: string;
  images?: string[] | string;
  secondaryImage?: string;
  category: string;
  colors?: string[] | string;
  storageOptions?: string[] | string;
  description?: string;
  stock?: number;
  inventoryStatus?: string;
  isUnlimitedStock?: boolean;
  unlimitedStock?: boolean;
  specs?: { cpu?: string; battery?: string; screen?: string };
}

interface ElectronicTemplateProps {
  tenantName: string;
  content: any;
  tenant: any;
  setContent?: (content: any) => void;
}

const normalizeArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
  if (typeof val === 'object') return Object.keys(val).map(v => String(v).trim()).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
      if (typeof parsed === 'object') return Object.keys(parsed).map(v => String(v).trim()).filter(Boolean);
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
  'التيتانيوم الطبيعي': '#b0a89d', 'التيتانيوم الأسود': '#333333', 'فضي معدني': '#d1d5db',
  'رمادي فلكي': '#4b5563', 'أبيض ناصع': '#ffffff', 'أسود مطفي': '#111827',
  'أحمر': '#ef4444', 'أسود': '#000000', 'أبيض': '#ffffff', 'أزرق': '#3b82f6',
  'كحلي': '#1e3a8a', 'أخضر': '#22c55e', 'ذهبي': '#ffd700', 'فضي': '#c0c0c0',
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
  return null;
};

const parsePriceNumber = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const str = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(str) || 0;
};

const formatPrice = (val: any): string => {
  if (val === undefined || val === null || val === '') return '0.00 ريال';
  const str = String(val).trim();
  if (str.includes('ريال') || str.includes('SAR')) return str;
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  return `${num.toLocaleString()} ريال`;
};

export default function ElectronicStoreTemplate({ tenantName, content, tenant, setContent }: ElectronicTemplateProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [activeModalProduct, setActiveModalProduct] = useState<any | null>(null);
  const [modalActiveImage, setModalActiveImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(true);
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [lastSubmittedOrderId, setLastSubmittedOrderId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingTab, setTrackingTab] = useState<'current' | 'previous'>('current');
  const [feedbackInput, setFeedbackInput] = useState<{id: string, text: string}>({ id: '', text: '' });
  const [cartError, setCartError] = useState<{ id: string, msg: string } | null>(null);

  // 🏷️ Promo Code & Shipping State
  const storeName = content?.businessName || content?.siteName || tenantName || 'متجر الأجهزة الإلكترونية';
  const headerSubtitle = content?.subtitle || content?.headerSubtitle || 'عالمك الذكي للتقنية الحديثة';
  const heroTitle = content?.heroTitle || 'أحدث الأجهزة الذكية والتقنيات العصرية';
  const heroSubtitle = content?.heroSubtitle || content?.heroDescription || 'اكتشف تشكيلة واسعة من الهواتف الذكية، الحواسيب المحمولة الفائقة، ومنظومات المنزل الذكي بضمان مصنعي معتمد وأسعار تنافسية.';
  const heroImage = content?.heroImage || content?.bannerImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800';
  const badgeText = content?.badgeText || content?.heroBadge || 'إصدارات 2026 الأصلية';
  const footerText = content?.footerText || content?.aboutText || 'وجهتك الأولى لأحدث التقنيات والهواتف الذكية والأجهزة المنزلية الذكية بضمان معتمد وأفضل الأسعار.';
  const storeCurrency = content?.currencySymbol || content?.currency || 'ريال';
  const formatPrice = (val: any): string => {
    if (val === undefined || val === null || val === '') return `0 ${storeCurrency}`;
    const str = String(val).trim();
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return str;
    return `${num.toLocaleString()} ${storeCurrency}`;
  };

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

    // Validate rules if defined in store promo code
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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  // Customer Reviews & Photo Submissions State
  const [reviews, setReviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('tenant_product_reviews');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'rev-1',
        productId: '1',
        customerName: 'أحمد عبدالله',
        rating: 5,
        comment: 'الجهاز ممتاز جداً وسرعة التوصيل كانت مبهرة. شكراً لكم.',
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'rev-2',
        productId: '1',
        customerName: 'فهد المطيري',
        rating: 5,
        comment: 'وصل المنتج بالتغليف الأصلي والجودة لا يعلى عليها.',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'rev-3',
        productId: '2',
        customerName: 'سارة خالد',
        rating: 5,
        comment: 'اللون جميل جداً والأداء بطل، أنصح فيه.',
        image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ];
  });
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
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

  React.useEffect(() => {
    if (isCartOpen || isFavoritesOpen || isTrackingOpen || activeModalProduct || isCheckoutOpen || activePolicy) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen, isFavoritesOpen, isTrackingOpen, activeModalProduct, isCheckoutOpen, activePolicy]);



  const fetchUserOrdersData = async (u: any) => {
    if (u) {
      try {
        const res = await fetch(`/api/public/websites/${tenant?.subdomain || 'demo'}/user-orders?email=${encodeURIComponent(u.email || '')}`);
        if (res.ok) {
          const data = await res.json();
          setUserOrders(data.orders || []);
        } else {
          const saved = localStorage.getItem(`orders_electronics_${tenant?.subdomain || 'elec_demo'}_${u.uid}`);
          if (saved) setUserOrders(JSON.parse(saved));
        }
      } catch (e) {
        const saved = localStorage.getItem(`orders_electronics_${tenant?.subdomain || 'elec_demo'}_${u.uid}`);
        if (saved) setUserOrders(JSON.parse(saved));
      }
    } else {
      const saved = localStorage.getItem(`orders_electronics_${tenant?.subdomain || 'elec_demo'}_guest`);
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
               localStorage.setItem(`orders_electronics_${tenant?.subdomain || 'elec_demo'}_guest`, JSON.stringify(data.orders));
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
            body: JSON.stringify({ email: u.email, name: u.displayName, photoUrl: u.photoURL })
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData.favorites && Array.isArray(loginData.favorites)) {
              setFavorites(loginData.favorites);
            }
          }
        } catch (e) {}

        fetchUserOrdersData(u);
      } else {
        fetchUserOrdersData(u);
      }
    });
    return () => unsub();
  }, [tenant, isTrackingOpen]);

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

  const handleFeedbackSubmit = async (orderId: string, phone: string, text: string, cleared: boolean) => {
    // 1. Immediately update local orders so order transitions instantly to completed / previous orders
    const updatedOrders = userOrders.map((o: any) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'completed',
          stockDeducted: true,
          details: {
            ...(o.details || {}),
            cleared: true,
            customerCleared: true,
            feedback: text
          }
        };
      }
      return o;
    });

    setUserOrders(updatedOrders);
    setFeedbackInput({ id: '', text: '' });
    showToast('تم تأكيد استلام الطلب وتسجيل ملاحظاتك بنجاح!');

    try {
      const storageKey = `orders_electronic_${tenant?.subdomain || 'electronic_demo'}_${user?.uid || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
    } catch (e) {}

    // Deduct stock locally if needed
    if (setContent) {
      try {
        const targetOrder = userOrders.find((o: any) => o.id === orderId);
        if (targetOrder && !targetOrder.stockDeducted) {
          const updatedRawProducts = rawProducts.map((p: any) => {
            const cartItemsForProduct = (targetOrder.items || []).filter((ci: any) => String(ci.product?.id || ci.id) === String(p.id) || ci.title === p.title);
            if (cartItemsForProduct.length > 0) {
              let updatedP = { ...p };
              cartItemsForProduct.forEach((ci: any) => {
                const qty = ci.quantity || 1;
                if (updatedP.stock !== undefined && !updatedP.isUnlimitedStock) {
                  updatedP.stock = Math.max(0, Number(updatedP.stock) - qty);
                }
                if (ci.color) {
                  let cStocks = normalizeObject(updatedP.colorStocks);
                  if (cStocks[ci.color] !== undefined) {
                    cStocks[ci.color] = Math.max(0, Number(cStocks[ci.color]) - qty);
                    updatedP.colorStocks = cStocks;
                  }
                }
                if (ci.storage) {
                  let sStocks = normalizeObject(updatedP.storageStocks);
                  if (sStocks[ci.storage] !== undefined) {
                    sStocks[ci.storage] = Math.max(0, Number(sStocks[ci.storage]) - qty);
                    updatedP.storageStocks = sStocks;
                  }
                }
              });
              if (updatedP.stock !== undefined && updatedP.stock <= 0 && !updatedP.isUnlimitedStock) {
                updatedP.inventoryStatus = 'نفد من المخزون';
              }
              return updatedP;
            }
            return p;
          });

          const newContent = { ...content };
          if (newContent.products) {
             newContent.products = updatedRawProducts;
          } else if (newContent.items) {
             newContent.items = updatedRawProducts;
          } else {
             newContent.items = updatedRawProducts;
          }
          setContent(newContent);
        }
      } catch (e) {
        console.error('Failed to update inventory on feedback:', e);
      }
    }

    // 2. Perform server API call in background
    try {
      fetch(`/api/public/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || user?.phoneNumber || '0000', feedback: text, cleared: true })
      }).catch(err => console.warn('Background feedback sync error:', err));
    } catch(e) { console.error(e); }
  };

  const defaultProducts = [
    {
      id: 1,
      title: 'آيفون 16 برو ماكس - 256 جيجابايت',
      price: 5399,
      originalPrice: 5899,
      category: 'الهواتف الذكية',
      primaryImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800',
      secondaryImage: 'https://images.unsplash.com/photo-1695048065051-ccb8c2d5e27a?q=80&w=800',
      colors: ['التيتانيوم الطبيعي', 'التيتانيوم الأسود', 'فضي معدني'],
      colorImages: {
        'التيتانيوم الطبيعي': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800',
        'التيتانيوم الأسود': 'https://images.unsplash.com/photo-1695048065051-ccb8c2d5e27a?q=80&w=800'
      },
      storageOptions: ['256GB', '512GB', '1TB'],
      description: 'شاشة Super Retina XDR مقاس 6.9 بوصة، معالج A18 Pro الخارق، ونظام كاميرات احترافي بدقة 48 ميجابكسل.',
      specs: { cpu: 'معالج A18 Pro', battery: '33 ساعة تشغيل', screen: '6.9 إنش OLED' }
    },
    {
      id: 2,
      title: 'ماك بوك برو 16 إنش - M3 Max',
      price: 11499,
      originalPrice: 12499,
      category: 'الحواسيب',
      primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800',
      secondaryImage: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=800',
      colors: ['رمادي فلكي', 'فضي معدني'],
      colorImages: {
        'رمادي فلكي': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800'
      },
      storageOptions: ['512GB SSD', '1TB SSD', '2TB SSD'],
      description: 'أداء استثنائي للمحترفين والمصممين، ذاكرة موحدة 36 جيجابايت، وعمر بطارية يصل إلى 22 ساعة.',
      specs: { cpu: 'شريحة M3 Max', battery: '22 ساعة عمل', screen: 'Liquid Retina XDR' }
    },
    {
      id: 3,
      title: 'سماعات سوني WH-1000XM5 لاسلكية',
      price: 1399,
      originalPrice: 1699,
      category: 'الصوتيات',
      primaryImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800',
      colors: ['أسود مطفي', 'أبيض ناصع'],
      colorImages: {
        'أسود مطفي': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800'
      },
      storageOptions: ['قياسي'],
      description: 'تقنية رائدة لإلغاء الضوضاء النشطة مع معالجين، صوت نقي عالي الدقة، وراحة فائقة.',
      specs: { cpu: 'معالج HD QN1', battery: '30 ساعة تشغيل', screen: 'صوت محيطي 360' }
    },
    {
      id: 4,
      title: 'منصة ألعاب بلايستيشن 5 برو',
      price: 3299,
      category: 'الألعاب',
      primaryImage: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800',
      colors: ['أبيض ناصع'],
      storageOptions: ['2TB SSD'],
      description: 'أقوى تجربة ألعاب بدقة 4K مع تتبع أشعة متطور وسرعة فائقة بفضل سعة تخزين 2 تيرابايت.',
      specs: { cpu: 'AMD Zen 2 8-core', battery: 'يدعم DualSense Edge', screen: 'دعم 4K 120Hz' }
    },
    {
      id: 5,
      title: 'كاميرا كانون EOS R6 Mark II',
      price: 8999,
      category: 'الكاميرات',
      primaryImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800',
      colors: ['أسود مطفي'],
      storageOptions: ['هيكل فقط', 'مع عدسة 24-105مم'],
      description: 'أداء تصوير فوتوغرافي وفيديو احترافي بدقة 4K 60p مع تركيز تلقائي ذكي بالذكاء الاصطناعي.',
      specs: { cpu: 'DIGIC X', battery: '760 لقطة للشحنة', screen: 'مستشعر 24.2 MP' }
    },
    {
      id: 6,
      title: 'تلفزيون إل جي OLED C4 65 إنش 4K',
      price: 6999,
      originalPrice: 7999,
      category: 'المنزل الذكي',
      primaryImage: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800',
      colors: ['أسود مطفي'],
      storageOptions: ['65 إنش', '55 إنش', '77 إنش'],
      description: 'درجات أسود حقيقية وتباين لا نهائي، معالج α9 AI Gen7، ودعم كامل لألعاب 144Hz.',
      specs: { cpu: 'α9 AI Gen7', battery: 'طاقة ذكية موفرة', screen: 'OLED evo 4K' }
    }
  ];

  const isFashionProduct = (p: any) => {
    if (!p) return false;
    const cat = String(p.category || '').trim();
    const title = String(p.title || p.name || '').trim();
    const fashionCategories = ['فساتين', 'حقائب', 'إكسسوارات', 'أحذية', 'ملابس رسمية', 'عباءات فاخرة', 'أزياء راقية', 'بدلات'];
    const fashionRegex = /فستان|معطف|حقيبة|بدلة|عباءة|تنورة|قميص حريري|حذاء كعب/i;
    return fashionCategories.includes(cat) || fashionRegex.test(title);
  };

  const rawList = Array.isArray(content?.items)
    ? content.items 
    : (Array.isArray(content?.products) 
      ? content.products 
      : defaultProducts);

  const validElectronics = Array.isArray(rawList) ? rawList.filter((p: any) => !isFashionProduct(p)) : [];
  const rawProducts = (Array.isArray(content?.items) || Array.isArray(content?.products))
    ? (validElectronics.length > 0 ? validElectronics : rawList)
    : defaultProducts;

  const products = rawProducts.map((p: any) => ({
    ...p,
    title: p.title || p.name,
    storageOptions: p.storageOptions || p.sizes,
    colors: p.colors || (p.sizes ? ['أسود', 'أبيض'] : undefined)
  }));

  const dynamicCategories = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
  const baseCategories = ['الهواتف الذكية', 'الحواسيب', 'الصوتيات', 'الألعاب', 'الكاميرات', 'المنزل الذكي'];
  const mergedCategories = Array.from(new Set([...baseCategories, ...dynamicCategories as string[]]));
  const categories = ['الكل', ...mergedCategories];

  const filteredProducts = products.filter((p: any) => {
    const matchesCat = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleFavorite = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    let newFavorites: any[];
    const isFav = favorites.some((f: any) => String(f.id) === String(product.id));
    
    if (isFav) {
      newFavorites = favorites.filter((f: any) => String(f.id) !== String(product.id));
      showToast('تم إزالة المنتج من المفضلة');
    } else {
      newFavorites = [...favorites, product];
      showToast('تمت إضافة المنتج للمفضلة');
    }
    
    setFavorites(newFavorites);
    
    if (user && user.email) {
      fetch('/api/public/websites/' + (tenant?.subdomain || 'demo') + '/store-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.displayName, photoUrl: user.photoURL, favorites: newFavorites })
      }).catch(console.error);
    }
  };

  const openModal = (product: any) => {
    setActiveModalProduct(product);
    setActiveImageIndex(0);
    const cols = normalizeArray(product.colors || product.colorStocks);
    const initialColor = cols[0] || 'افتراضي';
    setSelectedColor(initialColor);
    const storages = normalizeArray((product.storageOptions || product.sizes) || (product.storageStocks || product.sizeStocks));
    setSelectedStorage(storages[0] || 'قياسي');
    setQuantity(1);

    const cImgs = normalizeObject(product.colorImages);
    if (cImgs[initialColor]) {
      setModalActiveImage(cImgs[initialColor]);
    } else {
      setModalActiveImage(product.primaryImage || product.image || null);
    }
  };

  const getAllImages = (product: any) => {
    if (!product) return [];
    return Array.from(new Set([
      product.primaryImage || product.image,
      product.secondaryImage,
      ...Object.values(normalizeObject(product.colorImages))
    ])).filter(Boolean) as string[];
  };

  const handleSelectColor = (col: string) => {
    setSelectedColor(col);
    if (activeModalProduct) {
      const cImgs = normalizeObject(activeModalProduct.colorImages);
      const targetImg = cImgs[col] || activeModalProduct.primaryImage || activeModalProduct.image;
      setModalActiveImage(targetImg);
      
      const allImgs = getAllImages(activeModalProduct);
      const idx = allImgs.indexOf(targetImg);
      if (idx !== -1) {
        setActiveImageIndex(idx);
        if (imageScrollRef.current) {
          const container = imageScrollRef.current;
          const child = container.children[idx] as HTMLElement;
          if (child) {
            container.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
          }
        }
      }
    }
  };

  const handleImageScroll = () => {
    if (imageScrollRef.current) {
      const container = imageScrollRef.current;
      const scrollPosition = container.scrollLeft;
      const width = container.clientWidth;
      // In RTL, scrollLeft might be negative or decreasing. But wait, in RTL, we might need a different calculation depending on browser.
      // Usually, it's easier to use Math.abs or find the child closest to the container's center.
      let closestIdx = 0;
      let minDistance = Infinity;
      const containerCenter = scrollPosition + width / 2;
      
      Array.from(container.children).forEach((child: any, idx) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(containerCenter - childCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });
      
      if (closestIdx !== activeImageIndex) {
        setActiveImageIndex(closestIdx);
        const allImgs = getAllImages(activeModalProduct);
        if (allImgs[closestIdx]) {
          setModalActiveImage(allImgs[closestIdx]);
        }
      }
    }
  };

  const getVariantStock = (product: any, color?: string, storage?: string) => {
    if (!product) return null;

    // Retrieve live product reference from state
    const liveProduct = rawProducts.find((p: any) => 
      String(p.id) === String(product.id) || 
      (p.title && product.title && String(p.title).trim() === String(product.title).trim()) ||
      (p.name && product.name && String(p.name).trim() === String(product.name).trim())
    ) || product;

    if (liveProduct.isUnlimitedStock) return null;

    let maxAvail = Infinity;
    let hasVariantStock = false;

    if (color && color !== 'افتراضي') {
      const cStocks = normalizeObject(liveProduct.colorStocks);
      if (cStocks[color] !== undefined && cStocks[color] !== '') {
        maxAvail = Math.min(maxAvail, Number(cStocks[color]));
        hasVariantStock = true;
      }
    }
    if (storage && storage !== 'قياسي') {
      const sStocks = normalizeObject((liveProduct.storageStocks || liveProduct.sizeStocks));
      if (sStocks[storage] !== undefined && sStocks[storage] !== '') {
        maxAvail = Math.min(maxAvail, Number(sStocks[storage]));
        hasVariantStock = true;
      }
    }

    if (!hasVariantStock) {
      if (liveProduct.stock !== undefined && liveProduct.stock !== '' && liveProduct.stock !== null) {
        const numStock = Number(liveProduct.stock);
        if (!isNaN(numStock)) {
          maxAvail = numStock;
        }
      }
    }

    return maxAvail === Infinity ? null : maxAvail;
  };

  const getAvailableStock = (product: any, color: string, storage: string) => {
    if (!product || product.isUnlimitedStock) return Infinity;
    const st = getVariantStock(product, color, storage);
    return st === null ? 999 : st;
  };

  const addToCart = (product: any, color?: string, storage?: string, qty = 1) => {
    const itemColor = color || selectedColor || 'افتراضي';
    const itemStorage = storage || selectedStorage || 'قياسي';
    const cartItemId = `${product.id}-${itemColor}-${itemStorage}`;
    
    const maxStock = getAvailableStock(product, itemColor, itemStorage);
    let stockError = false;
    
    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      const currentQty = existing ? existing.quantity : 0;
      
      if (currentQty + qty > maxStock) {
        stockError = true;
        return prev; // Do not add
      }
      
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, {
        cartItemId,
        product,
        color: itemColor,
        storage: itemStorage,
        quantity: qty,
        price: parsePriceNumber(product.price)
      }];
    });

    if (stockError) {
      // Find suggestions
      let suggestions: string[] = [];
      const colorsList = normalizeArray(product.colors || product.colorStocks);
      const storageList = normalizeArray((product.storageOptions || product.sizes) || (product.storageStocks || product.sizeStocks));

      if (colorsList.length > 0) {
        for (const c of colorsList) {
          if (c !== itemColor) {
            const cStock = getAvailableStock(product, c, itemStorage);
            if (cStock > 0 && cStock !== 999) {
              suggestions.push(`متوفر (${cStock}) باللون ${c}`);
            }
          }
        }
      }
      if (storageList.length > 0) {
        for (const s of storageList) {
          if (s !== itemStorage) {
            const sStock = getAvailableStock(product, itemColor, s);
            if (sStock > 0 && sStock !== 999) {
              suggestions.push(`متوفر (${sStock}) بسعة ${s}`);
            }
          }
        }
      }

      const altText = suggestions.length > 0 ? ` - البدائل المتاحة: ${suggestions.join('، ')}` : '';
      showToast(`عذراً، لا يمكنك إضافة أعلى من الكمية المتاحة! الكمية المتاحة بالمخزون لهذا الخيار هي (${maxStock}) فقط.` + altText);
    } else {
      showToast(`تمت إضافة "${product.title}" إلى سلة التسوق`);
      setActiveModalProduct(null);
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const handleRemoveFromCartWithConfirm = (cartItemId: string, itemTitle?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'إشعار المنصة: تأكيد الحذف 🗑️',
      message: `هل أنت متأكد من رغبتك في حذف "${itemTitle || 'هذا المنتج'}" من سلة التسوق؟`,
      confirmText: 'نعم، احذف المنتج',
      cancelText: 'إلغاء والتراجع',
      type: 'danger',
      onConfirm: () => {
        removeFromCart(cartItemId);
        showToast('تم حذف المنتج من السلة');
        setConfirmModal(null);
      }
    });
  };

  const handleClearCartWithConfirm = () => {
    if (cart.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'إشعار المنصة: تفريغ سلة التسوق 🧹',
      message: 'هل أنت متأكد من مسح وتفريغ جميع المنتجات الموجودة بالسلة؟',
      confirmText: 'نعم، مسح الكل',
      cancelText: 'إلغاء والتراجع',
      type: 'danger',
      onConfirm: () => {
        setCart([]);
        showToast('تم تفريغ سلة التسوق بالكامل');
        setConfirmModal(null);
      }
    });
  };

  const handleCancelOrderWithConfirm = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'إشعار المنصة: إلغاء الطلب ❌',
      message: `هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم تغيير الحالة إلى ملغى.`,
      confirmText: 'نعم، تأكيد الإلغاء',
      cancelText: 'لا، الاحتفاظ بالطلب',
      type: 'danger',
      onConfirm: async () => {
        setUserOrders(prev => {
          const updated = prev.map(o => String(o.id) === String(orderId) ? { ...o, status: 'customer_cancelled', details: { ...o.details, cancelledBy: 'customer' } } : o);
          try {
            const storageKey = user?.uid 
              ? `orders_electronics_${tenant?.subdomain || 'elec_demo'}_${user.uid}`
              : `orders_electronics_${tenant?.subdomain || 'elec_demo'}_guest`;
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

        showToast(`تم إلغاء الطلب بنجاح`);
        setConfirmModal(null);
      }
    });
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    let stockError = false;
    let maxS = 0;
    
    setCart(prev => prev.map(i => {
      if (i.cartItemId === cartItemId) {
        const newQ = i.quantity + delta;
        
        if (delta > 0) {
          const maxStock = getAvailableStock(i.product, i.color, i.storage);
          maxS = maxStock;
          if (newQ > maxStock) {
            stockError = true;
            return i; // Don't increase
          }
        }
        
        return newQ > 0 ? { ...i, quantity: newQ } : null;
      }
      return i;
    }).filter(Boolean));
    
    if (stockError) {
      setCartError({
        id: cartItemId,
        msg: `عذراً، وصل المنتج للحد الأقصى المتاح بالمخزون وهو (${maxS}) قطع فقط.`
      });
      setTimeout(() => setCartError(null), 5000);

      setTimeout(() => {
        // We need the product info to make suggestions
        const item = cart.find(i => i.cartItemId === cartItemId);
        let suggestions: string[] = [];
        if (item && item.product) {
           const product = item.product;
           const colorsList = normalizeArray(product.colors || product.colorStocks);
           const storageList = normalizeArray((product.storageOptions || product.sizes) || (product.storageStocks || product.sizeStocks));

           if (colorsList.length > 0) {
             for (const c of colorsList) {
                if (c !== item.color) {
                   const cStock = getAvailableStock(product, c, item.storage);
                   if (cStock > 0 && cStock !== 999) {
                     suggestions.push(`متوفر (${cStock}) باللون ${c}`);
                   }
                }
             }
           }
           if (storageList.length > 0) {
             for (const s of storageList) {
                if (s !== item.storage) {
                   const sStock = getAvailableStock(product, item.color, s);
                   if (sStock > 0 && sStock !== 999) {
                     suggestions.push(`متوفر (${sStock}) بسعة ${s}`);
                   }
                }
             }
           }
        }
        const altText = suggestions.length > 0 ? ` - البدائل المتاحة: ${suggestions.join('، ')}` : '';
        showToast(`⚠️ عذراً، لا يمكنك إضافة أعلى من الكمية المتاحة! الكمية المتاحة بالمخزون هي (${maxS}) فقط.` + altText);
      }, 0);
    }
  };

  const cartTotalPrice = cart.reduce((sum, item) => {
    const p = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
    return sum + (p * item.quantity);
  }, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      showToast('يرجى تعبئة كافة بيانات الشحن والتوصيل');
      return;
    }

    let activeUser = user;
    if (!activeUser) {
      showToast('عفواً، يجب تسجيل الدخول أولاً لإتمام الطلب وتتبعه');
      try {
        const u = await loginWithGoogle();
        if (u) {
          activeUser = u;
          setUser(u);
          if (!customerName) setCustomerName(u.displayName || '');
        } else {
          showToast('عفواً، تسجيل الدخول مطلوب لإتمام الطلب');
          return;
        }
      } catch (err) {
        showToast('عفواً، تسجيل الدخول مطلوب لإتمام الطلب');
        return;
      }
    }
    
    // Check stock for all items
    let hasOutOfStock = false;
    for (const item of cart) {
      const maxStock = getAvailableStock(item.product, item.color, item.storage);
      if (item.quantity > maxStock) {
        hasOutOfStock = true;
        break;
      }
    }
    if (hasOutOfStock) {
      showToast('عذراً، بعض المنتجات في السلة غير متوفرة بالكمية المطلوبة. يرجى تعديل السلة.');
      setIsCheckoutOpen(false);
      setIsCartOpen(true);
      return;
    }

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setLastSubmittedOrderId(orderId);

    const formattedItems = cart.map((ci: any) => ({
      id: ci.product?.id || ci.id,
      productId: ci.product?.id || ci.id,
      name: ci.product?.title || ci.product?.name || 'منتج إلكتروني',
      title: ci.product?.title || ci.product?.name || 'منتج إلكتروني',
      quantity: ci.quantity || 1,
      price: formatPrice(ci.price),
      color: ci.color || 'افتراضي',
      storage: ci.storage || 'قياسي',
      selectedColor: ci.color || 'افتراضي',
      selectedStorage: ci.storage || 'قياسي',
      product: ci.product
    }));

    // Perform immediate local stock deduction for live feedback
    if (setContent) {
      try {
        const updatedProducts = rawProducts.map((p: any) => {
          const cartItemsForP = cart.filter((ci: any) => String(ci.product?.id || ci.id) === String(p.id) || ci.product?.title === p.title || ci.product?.name === p.name);
          if (cartItemsForP.length > 0) {
            let updatedP = { ...p };
            cartItemsForP.forEach((ci: any) => {
              const qty = ci.quantity || 1;
              if (updatedP.stock !== undefined && !updatedP.isUnlimitedStock) {
                updatedP.stock = Math.max(0, Number(updatedP.stock) - qty);
              }
              if (ci.color) {
                let cStocks = normalizeObject(updatedP.colorStocks);
                if (cStocks[ci.color] !== undefined && cStocks[ci.color] !== '') {
                  cStocks[ci.color] = Math.max(0, Number(cStocks[ci.color]) - qty).toString();
                  updatedP.colorStocks = cStocks;
                }
              }
              if (ci.storage) {
                let sStocks = normalizeObject(updatedP.storageStocks || updatedP.sizeStocks);
                if (sStocks[ci.storage] !== undefined && sStocks[ci.storage] !== '') {
                  sStocks[ci.storage] = Math.max(0, Number(sStocks[ci.storage]) - qty).toString();
                  if (updatedP.storageStocks) updatedP.storageStocks = sStocks;
                  if (updatedP.sizeStocks) updatedP.sizeStocks = sStocks;
                }
              }
            });
            if (updatedP.stock !== undefined && updatedP.stock <= 0 && !updatedP.isUnlimitedStock) {
              updatedP.inventoryStatus = 'نفد من المخزون';
            }
            return updatedP;
          }
          return p;
        });
        const newContent = { ...content, items: updatedProducts, products: updatedProducts };
        setContent(newContent);
      } catch (e) {
        console.error('Failed local stock deduction:', e);
      }
    }
    
    const discountAmt = appliedCoupon ? Math.round((cartTotalPrice * appliedCoupon.discountPercent) / 100) : 0;
    const finalTotalAmt = Math.max(0, cartTotalPrice - discountAmt) + shippingFee;

    const newOrder = {
      id: orderId,
      date: new Date().toISOString(),
      items: formattedItems,
      subtotal: formatPrice(cartTotalPrice),
      discountAmount: formatPrice(discountAmt),
      discountPercent: appliedCoupon ? appliedCoupon.discountPercent : 0,
      promoCode: appliedCoupon ? appliedCoupon.code : null,
      shippingFee: formatPrice(shippingFee),
      totalPrice: formatPrice(finalTotalAmt),
      total: formatPrice(finalTotalAmt),
      currency: 'SAR',
      customerName,
      customerPhone,
      customerEmail: activeUser?.email || `${customerPhone}@guest.local`,
      type: 'electronics_order',
      details: { 
        address: customerAddress, 
        paymentMethod: 'الدفع عند الاستلام',
        notes: `عنوان التوصيل: ${customerAddress}${appliedCoupon ? ` (كود الخصم: ${appliedCoupon.code})` : ''}`,
        promoCode: appliedCoupon ? appliedCoupon.code : null,
        discountPercent: appliedCoupon ? appliedCoupon.discountPercent : 0,
        discountAmount: discountAmt,
        shippingFee: shippingFee,
        subtotal: cartTotalPrice
      },
      status: 'pending'
    };

    // 1. Immediately update local orders, clear cart, and show success dialog
    const updatedUserOrders = [newOrder, ...userOrders];
    setUserOrders(updatedUserOrders);
    setCart([]);
    setCheckoutComplete(true);
    showToast('تم إرسال طلبك بنجاح!');

    try {
      const storageKey = activeUser?.uid 
        ? `orders_electronics_${tenant?.subdomain || 'elec_demo'}_${activeUser.uid}`
        : `orders_electronics_${tenant?.subdomain || 'elec_demo'}_guest`;
      localStorage.setItem(storageKey, JSON.stringify(updatedUserOrders));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }

    // 2. Perform background server sync
    fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).then(async res => {
      if (res.ok) {
        const data = await res.json();
        const savedOrder = data.inserted?.[0] || data.order;
        if (savedOrder && savedOrder.id && savedOrder.id !== newOrder.id) {
          setUserOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, id: savedOrder.id } : o));
        }
      }
    }).catch(err => {
      console.warn('Server sync error, saved locally:', err);
    });
    showToast('تم إرسال طلبك بنجاح!');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl z-[9999] animate-bounce flex items-center gap-2 border border-slate-700/50">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      {content?.announcementEnabled !== false && isAnnouncementOpen && (
        <div 
          className={`py-2 px-3 sm:py-2.5 sm:px-4 text-center overflow-hidden text-[11px] sm:text-xs relative flex items-center justify-between ${
            content?.announcementAnimation === 'pulse' ? 'animate-pulse' : 
            content?.announcementAnimation === 'bounce' ? 'animate-bounce' : ''
          }`}
          style={{
            backgroundColor: content?.announcementBgColor || '#0f172a',
            color: content?.announcementTextColor || '#ffffff',
            fontWeight: content?.announcementIsBold !== false ? '900' : '500',
          }}
        >
          <div className="flex-1 text-center">
            {content?.announcementAnimation === 'marquee-right' || content?.announcementAnimation === 'marquee-left' ? (
              <marquee direction={content?.announcementAnimation === 'marquee-right' ? 'left' : 'right'} scrollamount="12" scrolldelay="1" className="text-[11px] sm:text-xs font-bold whitespace-nowrap">
                <span className="inline-flex items-center gap-12">
                  <span className="inline-flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                    <span>{content?.announcementText || '🔥 شحن مجاني لكافة المدن للطلبات فوق 300 ريال + ضمان معتمد لمدة سنتين'}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                    <span>{content?.announcementText || '🔥 شحن مجاني لكافة المدن للطلبات فوق 300 ريال + ضمان معتمد لمدة سنتين'}</span>
                  </span>
                </span>
              </marquee>
            ) : (
              <div className="text-[11px] sm:text-xs flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 leading-snug sm:leading-relaxed px-1">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{content?.announcementText || '🔥 شحن مجاني لكافة المدن للطلبات فوق 300 ريال + ضمان معتمد لمدة سنتين'}</span>
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

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button className="md:hidden p-1.5 sm:p-2 text-slate-700 shrink-0" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Cpu className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-black tracking-tight text-slate-900 truncate max-w-[130px] sm:max-w-none">
                {storeName}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[130px] sm:max-w-none">{headerSubtitle}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن هاتف، لابتوب، سماعة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full pr-10 pl-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!user ? (
              <button 
                onClick={handleGoogleLogin} 
                className="hidden sm:flex bg-black text-white px-3 md:px-4 py-2 rounded-full text-xs font-bold hover:bg-zinc-800 transition-colors items-center gap-2"
              >
                <User size={14} /> تسجيل
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-full py-1 px-2 pr-1 border border-slate-200">
                <img src={user.photoURL || ''} alt="" className="w-7 h-7 rounded-full object-cover" />
                <span className="text-xs font-bold truncate max-w-[80px] text-slate-700">{user.displayName?.split(' ')[0]}</span>
                <button 
                  onClick={() => setIsTrackingOpen(true)}
                  className="text-xs font-bold text-indigo-600 px-2 py-1 hover:bg-indigo-50 rounded-full transition-colors"
                >
                  طلباتي
                </button>
                <button
                  onClick={async () => { await logout(); setUser(null); setUserOrders([]); }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="تسجيل الخروج"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
            
            <button
              onClick={() => setIsTrackingOpen(true)}
              className="sm:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-all flex items-center"
              aria-label="تتبع الطلب"
            >
              <Truck size={16} />
            </button>
            
            {/* Support / Help Button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget'))}
              className="hidden md:flex p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full transition-all items-center gap-1.5 px-3 text-xs font-bold border border-indigo-200 cursor-pointer"
              title="المساعدة والدعم الفني"
            >
              <MessageCircle size={16} />
              <span>المساعدة</span>
            </button>

            <button
              onClick={() => setIsFavoritesOpen(true)}
              className="relative p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-all flex items-center"
              aria-label="المفضلة"
            >
              <Heart size={16} className={favorites.length > 0 ? "text-rose-500 fill-rose-500" : ""} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-all flex items-center gap-1.5 px-2.5 sm:px-4"
              aria-label="سلة التسوق"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <span className="hidden sm:inline text-xs font-bold">السلة</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-indigo-600 text-white text-[10px] sm:text-[11px] font-bold rounded-full flex items-center justify-center shadow">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden flex justify-end" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-3/4 max-w-xs bg-white h-full shadow-2xl flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 p-6 pb-4">
              <h3 className="font-bold text-base">القائمة</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 hover:text-black"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 flex-1 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase px-2">تصفح الأقسام</h4>
                <div className="space-y-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setIsMobileMenuOpen(false); }}
                      className={`w-full text-right py-2.5 px-4 rounded-xl text-xs font-semibold ${selectedCategory === cat ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 space-y-1">
                 <button onClick={() => { setIsMobileMenuOpen(false); setIsFavoritesOpen(true); }} className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <div className="flex items-center gap-3">
                      <Heart size={16} className="text-rose-500" /> المفضلة
                    </div>
                    {favorites.length > 0 && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{favorites.length}</span>}
                 </button>
                 <button onClick={() => { setIsMobileMenuOpen(false); setActivePolicy('privacy'); }} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <Shield size={16} /> سياسة الخصوصية
                 </button>
                 <button onClick={() => { setIsMobileMenuOpen(false); setActivePolicy('terms'); }} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700">
                    <FileText size={16} /> شروط الاستخدام
                 </button>
                 <button onClick={() => { setIsMobileMenuOpen(false); window.dispatchEvent(new CustomEvent('open-support-widget')); }} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 cursor-pointer font-bold">
                    <MessageCircle size={16} /> قسم المساعدة والدعم الفني
                 </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
               {user ? (
                 <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-3 px-2">
                     {user.photoURL ? (
                       <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
                     ) : (
                       <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                         {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || 'مستخدم'}</p>
                       <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                     </div>
                   </div>
                   <button onClick={async () => { await logout(); setUser(null); setUserOrders([]); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors">
                     <LogOut size={16} /> تسجيل الخروج
                   </button>
                 </div>
               ) : (
                 <button onClick={() => { handleGoogleLogin(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                   <User size={16} /> تسجيل الدخول
                 </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {badgeText}
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {heroTitle}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#products" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all">
                تسوق المنتجات الآن
              </a>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-tr from-indigo-800 to-slate-800 p-2 flex items-center justify-center">
              <img
                src={heroImage}
                alt={storeName}
                className="w-full h-full object-cover rounded-2xl opacity-90 hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Unified Search & Promo Code Bar (Replaces Features Bar) */}
      <section className="bg-slate-900 text-white border-b border-indigo-950 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Live Search Input */}
          <div className="relative w-full md:w-1/2">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن قطعة أو منتج إلكتروني (مثل: آيفون، ماك بوك، سماعة)..."
              className="w-full bg-slate-800/90 border border-slate-700 focus:border-indigo-500 text-white text-xs sm:text-sm rounded-2xl pr-12 pl-4 py-3.5 outline-none font-medium placeholder-slate-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Discount Code Input */}
          <div className="relative w-full md:w-1/2 flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                placeholder="أدخل كود الخصم هنا (مثال: SALE20)..."
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-pink-500 text-white text-xs sm:text-sm rounded-2xl pr-11 pl-4 py-3.5 outline-none font-bold uppercase placeholder-slate-400 tracking-wider transition-all shadow-inner"
              />
            </div>
            <button
              type="button"
              onClick={() => handleApplyCoupon()}
              className="px-5 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0"
            >
              <Percent size={15} />
              <span>تطبيق الخصم</span>
            </button>
          </div>
        </div>

        {/* Coupon Banner / Applied Coupon Display */}
        {appliedCoupon && (
          <div className="max-w-7xl mx-auto mt-4 p-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-300 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>🎉 تمت إضافة نسبة خصم {appliedCoupon.discountPercent}% على طلبك القادم! (كود الخصم: <span className="font-mono text-white underline">{appliedCoupon.code}</span>)</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer font-bold shrink-0"
            >
              إلغاء الخصم
            </button>
          </div>
        )}

        {/* Notification Toast for Code Verification */}
        {couponBanner && couponBanner.show && (
          <div className={`max-w-7xl mx-auto mt-3 p-3.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center justify-between shadow-lg animate-in fade-in ${
            couponBanner.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/50'
              : 'bg-rose-900/90 text-rose-200 border-rose-500/50'
          }`}>
            <span>{couponBanner.msg}</span>
            <button onClick={() => setCouponBanner(null)} className="p-1 hover:opacity-75">
              <X size={16} />
            </button>
          </div>
        )}
      </section>

      {/* Main Content & Products Grid */}
      <main id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product: any) => {
            const priceNum = parsePriceNumber(product.price);
            const origNum = parsePriceNumber(product.originalPrice);
            const isOutOfStock = product.inventoryStatus === 'نفد من المخزون' || (product.stock !== undefined && product.stock <= 0 && !product.isUnlimitedStock);
            const isLowStock = !isOutOfStock && product.stock !== undefined && product.stock > 0 && product.stock < 4 && !product.isUnlimitedStock;

            return (
              <div
                key={product.id}
                onClick={() => openModal(product)}
                className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
              >
                <div className="relative overflow-hidden bg-slate-50/80 aspect-square w-full flex justify-center items-center p-3 sm:p-4 rounded-t-2xl">
                  <img
                    src={product.primaryImage || product.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800'}
                    alt={product.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-sm"
                  />
                  {origNum > priceNum && !isOutOfStock && (
                    <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 sm:px-2.5 sm:py-1 rounded-full shadow">
                      خصم خاص
                    </span>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-lg border border-slate-700">نفد من المخزون</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => toggleFavorite(e, product)}
                    className="absolute top-3 left-3 p-1.5 sm:p-2 bg-white/80 hover:bg-white backdrop-blur rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-all z-10"
                  >
                    <Heart size={16} className={favorites.some((f: any) => String(f.id) === String(product.id)) ? 'fill-rose-500 text-rose-500' : ''} />
                  </button>
                </div>

                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] sm:text-[11px] font-semibold text-indigo-600">{product.category}</span>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-base mt-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                    {isLowStock && (
                      <p className="text-[10px] font-bold text-rose-500 mt-2 flex items-center gap-1">
                        < Zap className="w-3 h-3" />
                        تبقى {product.stock} قطع فقط!
                      </p>
                    )}
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-2 sm:gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">{formatPrice(product.price)}</span>
                      {origNum > priceNum && (
                        <span className="text-[10px] sm:text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(product); }}
                      disabled={isOutOfStock}
                      className={`w-full xl:w-auto justify-center px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${isOutOfStock ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{isOutOfStock ? 'غير متوفر' : 'اختر المواصفات'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

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
                        <div className="w-full max-w-sm sm:max-w-md aspect-square rounded-3xl bg-slate-100 border border-slate-200/80 overflow-hidden shadow-md relative group flex items-center justify-center p-4 sm:p-6">
                          <img
                            src={imgUrl}
                            alt={`${activeModalProduct.title} - صورة ${i + 1}`}
                            className="max-h-[280px] sm:max-h-[360px] w-auto h-auto object-contain transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Indicator 1 / 3 */}
                  {getAllImages(activeModalProduct).length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-full z-10">
                      {activeImageIndex + 1} / {getAllImages(activeModalProduct).length}
                    </div>
                  )}
                </div>

                {/* Hide thumbnails on mobile if we have the swipeable gallery, or show them only on desktop? Let's just remove them and keep the indicator on mobile. 
                    Actually, it's fine to keep thumbnails on desktop. Let's show thumbnails on lg screens. */}
                {(activeModalProduct.secondaryImage || Object.keys(normalizeObject(activeModalProduct.colorImages)).length > 0) && (
                  <div className="hidden lg:flex justify-center gap-3 overflow-x-auto mt-8 pb-4 w-full">
                    {getAllImages(activeModalProduct).map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        onClick={() => {
                          setModalActiveImage(imgUrl);
                          setActiveImageIndex(i);
                          if (imageScrollRef.current) {
                            const container = imageScrollRef.current;
                            const child = container.children[i] as HTMLElement;
                            if (child) {
                              container.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
                            }
                          }
                        }}
                        className={`w-12 h-12 shrink-0 rounded-lg border-2 cursor-pointer object-cover bg-white transition-all ${
                          activeImageIndex === i
                            ? 'border-indigo-600'
                            : 'border-transparent hover:border-indigo-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full lg:w-1/2 flex flex-col px-2 lg:px-0 pb-12">
                <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-indigo-600">{activeModalProduct.category}</span>
                    <button
                      onClick={(e) => toggleFavorite(e, activeModalProduct)}
                      className="p-2 bg-slate-50 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-all"
                    >
                      <Heart size={20} className={favorites.some((f: any) => String(f.id) === String(activeModalProduct.id)) ? 'fill-rose-500 text-rose-500' : ''} />
                    </button>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{activeModalProduct.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{activeModalProduct.description}</p>
                </div>

                {/* Colors */}
                {normalizeArray(activeModalProduct.colors || activeModalProduct.colorStocks).length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">اختر اللون:</label>
                    <div className="flex flex-wrap gap-2">
                      {normalizeArray(activeModalProduct.colors || activeModalProduct.colorStocks).map((col: string) => {
                        const stockVal = getVariantStock(activeModalProduct, col, selectedStorage || undefined);
                        const isVariantOutOfStock = stockVal !== null && stockVal <= 0;
                        const hasStockCount = stockVal !== null && stockVal !== Infinity;
                        return (
                          <button
                            key={col}
                            onClick={() => { if (!isVariantOutOfStock) handleSelectColor(col); }}
                            disabled={isVariantOutOfStock}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                              isVariantOutOfStock 
                                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-75 line-through' 
                                : selectedColor === col 
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className={isVariantOutOfStock ? 'line-through decoration-red-500 decoration-2' : ''}>{col}</span>
                            {isVariantOutOfStock ? (
                              <span className="text-[9px] text-rose-500 font-bold leading-none">غير متوفر</span>
                            ) : (hasStockCount && stockVal < 4) ? (
                              <span className="text-[9px] text-rose-600 font-extrabold leading-none">متبقي {stockVal}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Storage Options */}
                {normalizeArray((activeModalProduct.storageOptions || activeModalProduct.sizes) || (activeModalProduct.storageStocks || activeModalProduct.sizeStocks)).length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">اختر السعة / الخيار:</label>
                    <div className="flex flex-wrap gap-2">
                      {normalizeArray((activeModalProduct.storageOptions || activeModalProduct.sizes) || (activeModalProduct.storageStocks || activeModalProduct.sizeStocks)).map((opt: string) => {
                        const stockVal = getVariantStock(activeModalProduct, selectedColor || undefined, opt);
                        const isVariantOutOfStock = stockVal !== null && stockVal <= 0;
                        const hasStockCount = stockVal !== null && stockVal !== Infinity;
                        return (
                          <button
                            key={opt}
                            onClick={() => { if (!isVariantOutOfStock) setSelectedStorage(opt); }}
                            disabled={isVariantOutOfStock}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                              isVariantOutOfStock 
                                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-75 line-through' 
                                : selectedStorage === opt 
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className={isVariantOutOfStock ? 'line-through decoration-red-500 decoration-2' : ''}>{opt}</span>
                            {isVariantOutOfStock ? (
                              <span className="text-[9px] text-rose-500 font-bold leading-none">غير متوفر</span>
                            ) : (hasStockCount && stockVal < 4) ? (
                              <span className="text-[9px] text-rose-600 font-extrabold leading-none">متبقي {stockVal}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Variant Stock Banner */}
                {(() => {
                  const currentVariantStock = getVariantStock(activeModalProduct, selectedColor, selectedStorage);
                  if (currentVariantStock !== null && currentVariantStock !== Infinity && currentVariantStock < 4) {
                    return (
                      <div className="p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border bg-rose-50 text-rose-600 border-rose-200">
                        <Zap className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>
                          {currentVariantStock <= 0 
                            ? 'الخيار المحدد غير متوفر بالمخزون حالياً.' 
                            : `تحذير: متبقي ${currentVariantStock} قطع فقط من هذا الخيار!`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Specs */}
                {activeModalProduct.specs && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                    {activeModalProduct.specs.cpu && <div className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-indigo-600" /> {activeModalProduct.specs.cpu}</div>}
                    {activeModalProduct.specs.battery && <div className="flex items-center gap-1"><Battery className="w-3.5 h-3.5 text-indigo-600" /> {activeModalProduct.specs.battery}</div>}
                  </div>
                )}

                {(() => {
                  const isOutOfStock = activeModalProduct.inventoryStatus === 'نفد من المخزون' || (activeModalProduct.stock !== undefined && activeModalProduct.stock <= 0 && !activeModalProduct.isUnlimitedStock);
                  const isLowStock = !isOutOfStock && activeModalProduct.stock !== undefined && activeModalProduct.stock > 0 && activeModalProduct.stock < 4 && !activeModalProduct.isUnlimitedStock;
                  return (
                    <div className="pt-4 border-t border-slate-200">
                      {isLowStock && (
                        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span>أسرع! تبقى {activeModalProduct.stock} قطع فقط في المخزون.</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[11px] text-slate-400 block">السعر الإجمالي</span>
                          <span className="text-xl font-extrabold text-slate-900">{formatPrice(activeModalProduct.price)}</span>
                        </div>
                        <button
                          onClick={() => addToCart(activeModalProduct, selectedColor, selectedStorage, quantity)}
                          disabled={isOutOfStock}
                          className={`w-full sm:w-auto px-6 py-3 font-bold rounded-xl text-sm shadow-lg transition-all flex justify-center items-center gap-2 ${isOutOfStock ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'}`}
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>{isOutOfStock ? 'غير متوفر في المخزون' : 'إضافة للسلة'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
              {/* 🌟 Customer Reviews & Photo Submissions Section */}
              <div className="mt-16 pt-12 border-t border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <span>تقييمات وآراء العملاء بالمنتج</span>
                    <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 font-extrabold">
                      {reviews.filter((r: any) => String(r.productId) === String(activeModalProduct.id)).length} تقييم
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    تجارب حقيقية وصور مباشرة للمنتج من العملاء بعد الاستلام
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl shrink-0">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }, (_, i) => {
                      const proRev = reviews.filter((r: any) => String(r.productId) === String(activeModalProduct.id));
                      const avgRating = proRev.length > 0 ? (proRev.reduce((acc: number, cur: any) => acc + (Number(cur.rating) || 5), 0) / proRev.length) : 5;
                      return (
                        <Star key={i} size={24} fill={i < Math.round(avgRating) ? 'currentColor' : 'none'} className={i < Math.round(avgRating) ? 'text-amber-400' : 'text-amber-200'} />
                      )
                    })}
                  </div>
                  <span className="text-base font-black text-amber-900">
                    {(() => {
                      const proRev = reviews.filter((r: any) => String(r.productId) === String(activeModalProduct.id));
                      return proRev.length > 0 ? (proRev.reduce((acc: number, cur: any) => acc + (Number(cur.rating) || 5), 0) / proRev.length).toFixed(1) : "5.0";
                    })()} / 5
                  </span>
                </div>
              </div>

              {/* Review Submission Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 lg:p-8 mb-10 shadow-sm">
                <h4 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>أضف تقييمك ورأيك عن المنتج بعد الاستلام:</span>
                </h4>
                <p className="text-sm text-slate-500 mb-6 font-medium">شارِك تجربتك وصورة للمنتج لما وصلك لمساعدة باقي العملاء</p>
                
                {reviewSuccessMsg && (
                  <div className="p-4 mb-6 bg-emerald-600 text-white text-sm font-bold rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in">
                    <Check size={20} />
                    <span>شكراً لك! تم إضافة تقييمك ورأيك بنجاح وظهر ضمن تقييمات المنتج.</span>
                  </div>
                )}
                
                <form onSubmit={(e) => handleAddReview(e, activeModalProduct.id)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">تقييمك بالنجوم:</label>
                      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="p-1 cursor-pointer transition-transform hover:scale-125"
                          >
                            <Star size={24} fill={star <= newReviewRating ? '#f59e0b' : 'none'} className={star <= newReviewRating ? 'text-amber-500' : 'text-slate-300'} />
                          </button>
                        ))}
                        <span className="text-sm font-bold text-slate-600 mr-2">({newReviewRating} من 5)</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">اسمك الكريم:</label>
                      <input
                        type="text"
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        placeholder="مثال: أحمد علي"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">تفاصيل رأيك وتجربتك مع المنتج:</label>
                    <textarea
                      rows={4}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="اكتب تعليقك ورأيك عن جودة الجهاز، الأداء، سرعة التوصيل..."
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-900 font-medium focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">إرفاق صورة للمنتج بعد الاستلام (اختياري):</label>
                    <div className="flex items-center gap-4">
                      <label className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                        <Upload size={18} className="text-slate-600" />
                        <span>📸 اختيار صورة للمنتج لما وصلك</span>
                        <input type="file" onChange={handleReviewPhotoUpload} accept="image/*" className="hidden" />
                      </label>
                      {newReviewImage && (
                        <div className="relative inline-block">
                          <img src={newReviewImage} alt="المعاينة" className="h-16 w-16 object-cover rounded-xl border-2 border-slate-900 shadow-sm" />
                          <button
                            type="button"
                            onClick={() => setNewReviewImage(null)}
                            className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-slate-900/20">
                    نشر التقييم
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.filter((r: any) => String(r.productId) === String(activeModalProduct.id)).length > 0 ? (
                  reviews.filter((r: any) => String(r.productId) === String(activeModalProduct.id)).map((rev: any, idx: number) => (
                    <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">
                            {rev.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              {rev.customerName}
                              <CheckCircle2 size={14} className="text-emerald-500" />
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{new Date(rev.createdAt).toLocaleDateString('ar-SA')}</p>
                          </div>
                        </div>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={14} fill={i < rev.rating ? 'currentColor' : 'none'} className={i < rev.rating ? 'text-amber-400' : 'text-slate-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium mb-4">{rev.comment}</p>
                      {rev.image && (
                        <div className="mt-3">
                          <img 
                            src={rev.image} 
                            alt="صورة المنتج من العميل" 
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => setReviewPhotoPreviewModal(rev.image)}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100">
                    <MessageCircle size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium text-sm">لا توجد تقييمات لهذا المنتج حتى الآن. كن أول من يشاركنا رأيه!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )}

      {/* Lightbox Preview Modal for Customer Review Photos */}
      {reviewPhotoPreviewModal && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setReviewPhotoPreviewModal(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            onClick={() => setReviewPhotoPreviewModal(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={reviewPhotoPreviewModal} 
            alt="تكبير صورة التقييم" 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-bold text-lg text-slate-900">سلة التسوق ({cart.reduce((s, i) => s + i.quantity, 0)})</h2>
                </div>
                <div className="flex items-center gap-2">
                  {cart.length > 0 && (
                    <button 
                      onClick={handleClearCartWithConfirm}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      title="تفريغ السلة بالكامل"
                    >
                      <Trash2 size={13} />
                      <span>تفريغ السلة</span>
                    </button>
                  )}
                  <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <p className="text-slate-600 font-medium">سلة التسوق فارغة</p>
                    <p className="text-xs text-slate-400">اختر أجهزتك المفضلة وابدأ التسوق الآن</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const maxStock = getAvailableStock(item.product, item.color, item.storage);
                    const isMaxStockReached = item.quantity >= maxStock && maxStock !== 999 && maxStock !== Infinity;
                    const isOutOfStock = item.quantity > maxStock && maxStock !== 999 && maxStock !== Infinity;
                    
                    let suggestionMsg = '';
                    if (isOutOfStock || isMaxStockReached) {
                      const product = item.product;
                      const colorsList = normalizeArray(product.colors || product.colorStocks);
                      const storageList = normalizeArray((product.storageOptions || product.sizes) || (product.storageStocks || product.sizeStocks));

                      let alts: string[] = [];
                      for (const c of colorsList) {
                         if (c !== item.color) {
                            const cStock = getAvailableStock(product, c, item.storage);
                            if (cStock > 0 && cStock !== 999) {
                              alts.push(`متوفر (${cStock}) باللون ${c}`);
                            }
                         }
                      }
                      for (const s of storageList) {
                         if (s !== item.storage) {
                            const sStock = getAvailableStock(product, item.color, s);
                            if (sStock > 0 && sStock !== 999) {
                              alts.push(`متوفر (${sStock}) بسعة ${s}`);
                            }
                         }
                      }
                      if (alts.length > 0) {
                        suggestionMsg = `البدائل المتاحة: ${alts.join('، ')}`;
                      }
                    }

                    return (
                    <div key={item.cartItemId} className={`flex gap-4 items-start p-3.5 rounded-2xl border transition-all ${
                      isOutOfStock 
                        ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300' 
                        : isMaxStockReached 
                          ? 'bg-amber-50/70 border-amber-200' 
                          : 'bg-slate-50 border-slate-200'
                    }`}>
                      <img src={item.product.primaryImage || item.product.image} alt={item.product.title} className="w-16 h-16 object-contain bg-white rounded-xl p-1 border flex-shrink-0 shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{item.product.title}</h4>
                          <button 
                            onClick={() => handleRemoveFromCartWithConfirm(item.cartItemId, item.product?.title)} 
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                            title="حذف المنتج من السلة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className={`text-[11px] mt-0.5 font-medium ${isOutOfStock ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                          {item.color} / {item.storage}
                        </div>

                        {/* Explicit Stock Warning Badges */}
                        {isOutOfStock ? (
                          <div className="text-[11px] text-rose-700 mt-2 font-extrabold leading-relaxed bg-rose-100/90 p-2 rounded-xl border border-rose-200 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>عذراً! الكمية المطلوبة ({item.quantity}) تتجاوز المخزون المتاح ({maxStock} قطع فقط).</span>
                            </div>
                            {suggestionMsg && <span className="text-[10px] text-emerald-700 font-bold">{suggestionMsg}</span>}
                          </div>
                        ) : isMaxStockReached ? (
                          <div className="text-[10.5px] text-amber-800 mt-2 font-bold bg-amber-100/90 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>وصلت للحد الأقصى المتاح بالمخزون لهذه المواصفات ({maxStock} قطع).</span>
                          </div>
                        ) : null}

                        {cartError?.id === item.cartItemId && (
                          <div className="text-[10.5px] text-rose-700 mt-1.5 font-bold leading-relaxed bg-rose-100 p-2 rounded-xl border border-rose-200 animate-pulse flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{cartError.msg}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-1 border-t border-slate-200/60">
                          <p className="text-xs text-indigo-600 font-extrabold">{formatPrice(item.price)}</p>
                          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
                            <button 
                              onClick={() => updateCartQty(item.cartItemId, -1)} 
                              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black hover:bg-slate-200 active:scale-95 transition-all"
                            >
                              -
                            </button>
                            <span className={`text-xs font-black px-2 ${isOutOfStock ? 'text-rose-600' : 'text-slate-800'}`}>
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateCartQty(item.cartItemId, 1)} 
                              disabled={isMaxStockReached}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                                isMaxStockReached 
                                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
                              }`}
                              title={isMaxStockReached ? `المخزون المتاح ${maxStock} قطع فقط` : 'زيادة الكمية'}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})
                )}
              </div>

              {cart.length > 0 && (() => {
                const discountAmount = appliedCoupon ? Math.round((cartTotalPrice * appliedCoupon.discountPercent) / 100) : 0;
                const finalTotal = Math.max(0, cartTotalPrice - discountAmount) + shippingFee;

                return (
                <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                  {/* Promo Code Input in Cart */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-pink-600" />
                      <span>هل لديك كود خصم؟</span>
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800">
                        <span>كود ({appliedCoupon.code}) - خصم {appliedCoupon.discountPercent}%</span>
                        <button onClick={handleRemoveCoupon} className="text-rose-600 hover:underline text-[11px]">حذف</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder="أدخل الكود..."
                          className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold uppercase outline-none focus:border-pink-500"
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

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>المجموع الفرعي</span>
                      <span className="font-bold">{formatPrice(cartTotalPrice)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>الخصم ({appliedCoupon.discountPercent}%)</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>رسوم الشحن والتوصيل</span>
                      <span className="font-bold text-slate-900">
                        {shippingFee === 0 ? <span className="text-emerald-600">مجاني</span> : formatPrice(shippingFee)}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex justify-between text-base font-extrabold text-slate-900">
                      <span>الإجمالي النهائي</span>
                      <span className="text-indigo-600">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-center block text-xs sm:text-sm"
                  >
                    إتمام الطلب والدفع
                  </button>
                </div>
              );})()}
            </div>
          </div>
        </div>
      )}

      {/* Favorites Drawer */}
      {isFavoritesOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsFavoritesOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <h2 className="font-bold text-lg text-slate-900">المفضلة ({favorites.length})</h2>
                </div>
                <button onClick={() => setIsFavoritesOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {favorites.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                      <Heart className="w-8 h-8" />
                    </div>
                    <p className="text-slate-600 font-medium">قائمة المفضلة فارغة</p>
                    <p className="text-xs text-slate-400">أضف منتجاتك المفضلة هنا للرجوع إليها لاحقاً</p>
                  </div>
                ) : (
                  favorites.map((product) => {
                    return (
                      <div
                        key={product.id}
                        onClick={() => { setIsFavoritesOpen(false); openModal(product); }}
                        className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all cursor-pointer group"
                      >
                        <div className="w-20 h-20 bg-slate-50 rounded-lg p-2 flex items-center justify-center shrink-0">
                          <img 
                            src={product.primaryImage || product.image} 
                            alt={product.title} 
                            className="w-full h-full object-contain mix-blend-multiply" 
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{product.title}</h4>
                              <button 
                                onClick={(e) => toggleFavorite(e, product)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-1">{product.category}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-extrabold text-sm text-slate-900">{formatPrice(product.price)}</span>
                            <button 
                              onClick={() => { setIsFavoritesOpen(false); openModal(product); }}
                              className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
                            >
                              عرض التفاصيل
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="font-bold text-lg text-slate-900">إتمام الشراء والدفع</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutComplete ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-xl text-slate-900">تم استلام طلبك بنجاح!</h4>
                {lastSubmittedOrderId && (
                  <p className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 py-1.5 px-3 rounded-lg inline-block">
                    رقم الطلب #{lastSubmittedOrderId}
                  </p>
                )}
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  شكراً لك {customerName}! تم حفظ طلبك بنجاح في حسابك، وجاري مراجعته وتجهيزه للشحن. يمكنك متابعة حالته في قسم "طلباتي".
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => { setCheckoutComplete(false); setIsCheckoutOpen(false); }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                  >
                    العودة للمتجر
                  </button>
                  <button
                    onClick={() => { setCheckoutComplete(false); setIsCheckoutOpen(false); setIsTrackingOpen(true); }}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    متابعة طلباتي
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الاسم الكامل</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="أدخل اسمك الكريم"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">رقم الجوال</label>
                  <input
                    required
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عنوان التوصيل (المدينة والشارع)</label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="المدينة، الحي، الشارع، رقم البناية"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                  ></textarea>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">طريقة الدفع</label>
                  <select className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs">
                    <option>الدفع عند الاستلام</option>
                    <option>بطاقة ائتمانية / مدى / Apple Pay</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs"
                >
                  تأكيد الطلب ودفع ({formatPrice(cartTotalPrice)})
                </button>
              </form>
            )}
          </div>
        </div>
      )}


      {/* Tracking Modal */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-6 border-b border-[#e5e5e5] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">سجل وتتبع طلباتي</h3>
                  <p className="text-xs text-slate-500 font-medium">تابع حالة مشترياتك من الأجهزة الإلكترونية</p>
                </div>
              </div>
              <button onClick={() => setIsTrackingOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1">
              {!user ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">يرجى تسجيل الدخول بحساب جوجل</h4>
                  <p className="text-sm text-slate-500">لعرض طلباتك المحفوظة وتتبع حالتها، يرجى تسجيل الدخول.</p>
                  <button onClick={handleGoogleLogin} className="bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all mt-4 inline-flex items-center gap-2">
                     <User size={18} /> تسجيل الدخول للتتبع
                  </button>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Truck size={48} className="mx-auto mb-4 opacity-50" />
                  <h4 className="font-bold text-slate-700 text-lg mb-1">لا توجد طلبات سابقة</h4>
                  <p className="text-sm">لم تقم بإجراء أي طلبات من حسابك حتى الآن.</p>
                </div>
              ) : (
                <>
                  <div className="flex bg-slate-200 p-1 rounded-xl mb-4 text-xs font-bold">
                    <button onClick={() => setTrackingTab('current')} className={`flex-1 py-2 rounded-lg transition-all ${trackingTab === 'current' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>طلباتي الحالية</button>
                    <button onClick={() => setTrackingTab('previous')} className={`flex-1 py-2 rounded-lg transition-all ${trackingTab === 'previous' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>الطلبات السابقة</button>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">الطلبات المسجلة هنا هي للقراءة وتتبع الحالة فقط، ولا يمكن التعديل عليها أو إضافتها للسلة مجدداً.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {userOrders.filter(ord => {
  const isCompletedAndCleared = (ord.status === 'completed' || ord.status === 'تم التسليم') && ord.details?.customerCleared;
  const isTerminalStatus = ['cancelled', 'customer_cancelled'].includes(ord.status) || isCompletedAndCleared;
  return trackingTab === 'current' ? !isTerminalStatus : isTerminalStatus;
}).length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs font-bold">لا توجد طلبات في هذا القسم</div>
                    ) : (
                      userOrders.filter(ord => {
  const isCompletedAndCleared = (ord.status === 'completed' || ord.status === 'تم التسليم') && ord.details?.customerCleared;
  const isTerminalStatus = ['cancelled', 'customer_cancelled'].includes(ord.status) || isCompletedAndCleared;
  return trackingTab === 'current' ? !isTerminalStatus : isTerminalStatus;
}).map((ord, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100">
                                <div>
                                  <p className="text-[10px] text-slate-500 mb-1">رقم الطلب: {ord.id}</p>
                                  <p className="text-xs font-bold text-slate-800">{new Date(ord.createdAt || ord.date).toLocaleString('ar-SA')}</p>
                                </div>
                                {(ord.status === 'deleted' || ord.deletedAt != null) ? (
                                  <div className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-black border border-rose-200 shadow-sm flex items-center gap-1">
                                    <span>❌ لم يتم قبول طلبك</span>
                                  </div>
                                ) : (
                                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                    {ord.status === 'completed' ? 'تم التسليم' :
                                     ord.status === 'on_the_way' ? 'مع المندوب' :
                                     ord.status === 'preparing' ? 'قيد التجهيز' :
                                     ord.status === 'confirmed' ? 'مؤكد' :
                                     (ord.status === 'cancelled' || ord.status === 'customer_cancelled') ? 'ملغي' :
                                     ord.status || 'قيد المعالجة (Pending)'}
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2 mb-3">
                                {ord.items && ord.items.map((item: any, idx: number) => {
                                  const title = item.product?.title || item.title;
                                  const image = item.product?.primaryImage || item.product?.image || item.image || item.primaryImage || '';
                                  const storage = item.storage || item.selectedStorage;
                                  const color = item.color || item.selectedColor;
                                  
                                  return (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl">
                                      {image && <img src={image} alt="" className="w-10 h-10 object-cover rounded-lg bg-white border border-slate-200" />}
                                      <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{title}</p>
                                         <p className="text-[10px] text-slate-500">
                                           {storage && `السعة: ${storage}`}
                                           {storage && color && " | "}
                                           {color && `اللون: ${color}`}
                                         </p>
                                       </div>
                                       <div className="text-left">
                                         <p className="text-xs font-bold">{formatPrice(item.price)}</p>
                                         <p className="text-[10px] text-slate-500">الكمية: {item.quantity || 1}</p>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                               {(ord.status === 'deleted' || ord.deletedAt != null) ? (
                                 <div className="mt-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-1.5 animate-fadeIn">
                                   <div className="text-xs font-black text-rose-800 flex items-center justify-center gap-1.5">
                                     <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                                     <span>لم يتم قبول طلبك من قِبل المتجر</span>
                                   </div>
                                   <p className="text-[11px] text-rose-600 font-medium leading-relaxed">
                                     نعتذر منك، لم يتم قبول هذا الطلب من إدارة المتجر. وفي حال قام المتجر باستعادة طلبك لاحقاً، سيعود مسار التتبع للظهور تلقائياً.
                                   </p>
                                 </div>
                               ) : (
                        <div className="pt-4 mt-2">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 font-bold">
                            <span className={['pending', 'confirmed', 'preparing', 'on_the_way', 'completed'].includes(ord.status) || ord.status?.includes('قيد المعالجة') ? "text-indigo-600" : ""}>✓ تم الاستلام</span>
                            <span className={['confirmed', 'preparing', 'on_the_way', 'completed'].includes(ord.status) ? "text-indigo-600" : ""}>⚙️ قيد التجهيز</span>
                            <span className={['on_the_way', 'completed'].includes(ord.status) ? "text-indigo-600" : ""}>🚚 جاري الشحن</span>
                            <span className={['completed'].includes(ord.status) ? "text-indigo-600" : ""}>⭐ تم التسليم</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
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
                      )}

                      {/* Courier Details */}
                      {['on_the_way', 'completed'].includes(ord.status) && ord.details?.courierName && (
                        <div className="mt-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col gap-1.5 text-xs">
                          <div className="font-bold text-indigo-800 flex items-center gap-1.5"><Truck size={14} /> بيانات المندوب</div>
                          <div className="text-indigo-600">الاسم: <span className="font-bold">{ord.details.courierName}</span></div>
                          {ord.details.courierPhone && <div className="text-indigo-600">الهاتف: <span className="font-bold font-mono">{ord.details.courierPhone}</span></div>}
                          {ord.details.expectedDelivery && <div className="text-indigo-600">متوقع التوصيل: <span className="font-bold">{ord.details.expectedDelivery}</span></div>}
                        </div>
                      )}
                      
                      {/* Feedback Form */}
                      {(ord.status === 'completed' || ord.status === 'on_the_way') && !ord.details?.feedback && !ord.details?.customerCleared && (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <p className="text-xs font-bold text-slate-800 mb-3 text-center">🎉 هل قمت باستلام طلبك؟ شاركنا ملاحظاتك أو قم بتأكيد الاستلام!</p>
                          {feedbackInput.id === ord.id ? (
                            <div className="flex flex-col gap-2">
                              <textarea 
                                value={feedbackInput.text}
                                onChange={(e) => setFeedbackInput({ id: ord.id, text: e.target.value })}
                                placeholder="اكتب ملاحظاتك هنا (يمكنك تضمين رابط صورة إذا أردت)..."
                                className="w-full text-xs p-3 rounded-xl border border-slate-300 outline-none focus:border-indigo-500"
                                rows={3}
                              ></textarea>
                              <div className="flex gap-2">
                                <button onClick={() => handleFeedbackSubmit(ord.id, ord.customerPhone, feedbackInput.text, false)} className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-xl font-bold hover:bg-indigo-700">إرسال الملاحظة</button>
                                <button onClick={() => setFeedbackInput({ id: "", text: "" })} className="flex-1 bg-slate-200 text-slate-700 text-xs py-2 rounded-xl font-bold hover:bg-slate-300">إلغاء</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => setFeedbackInput({ id: ord.id, text: "" })} className="flex-1 border border-slate-300 bg-white text-slate-700 text-[11px] py-2 rounded-xl font-bold hover:bg-slate-50">نعم، لدي ملاحظة</button>
                              <button onClick={() => handleFeedbackSubmit(ord.id, ord.customerPhone, "", true)} className="flex-1 bg-slate-100 text-slate-600 text-[11px] py-2 rounded-xl font-bold hover:bg-slate-200">لا يوجد مشاكل، تأكيد</button>
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
                    </div>
                  )))}
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Policy Modals */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="font-bold text-lg text-slate-900">
                {activePolicy === 'privacy' ? 'سياسة الخصوصية' : 'شروط الاستخدام'}
              </h3>
              <button onClick={() => setActivePolicy(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
              {activePolicy === 'privacy' ? (
                <>
                  <p>نحن في متجر الأجهزة الإلكترونية نولي اهتماماً بالغاً بخصوصية بيانات عملائنا وحمايتها وفق أعلى المعايير الأمنية.</p>
                  <p>تستخدم بيانات الاتصال والشحن حصرياً لإتمام طلبات الشراء وتوصيل الأجهزة إليكم بأمان وسرعة فائقة، ولا يتم مشاركتها مع أي جهة خارجية.</p>
                </>
              ) : (
                <>
                  <p>باستخدامك لمتجرنا الإلكتروني، فإنك توافق على الالتزام بكافة الشروط والأحكام الخاصة بالبيع، الضمان، والاستبدال.</p>
                  <p>جميع المنتجات المعروضة أصلية ومضمونة من الوكيل الرسمي المعتمد لمدة سنتين كاملتين.</p>
                </>
              )}
            </div>
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActivePolicy(null)} className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Cpu className="w-6 h-6 text-indigo-500" />
              <span>{storeName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {footerText}
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-3">الأقسام الرئيسية</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#products" className="hover:text-white transition-colors">الهواتف الذكية</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">الحواسيب المحمولة</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">الصوتيات والسماعات</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">منصات الألعاب</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-3">خدمة العملاء</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget'))} 
                  className="hover:text-white transition-colors text-right flex items-center gap-1.5 text-indigo-400 font-bold cursor-pointer"
                >
                  <MessageCircle size={14} /> قسم المساعدة والدعم الفني
                </button>
              </li>
              <li><button onClick={() => setActivePolicy('terms')} className="hover:text-white transition-colors text-right cursor-pointer">سياسة الضمان والاستبدال</button></li>
              <li><button onClick={() => setActivePolicy('privacy')} className="hover:text-white transition-colors text-right cursor-pointer">سياسة الخصوصية</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-3">النشرة البريدية</h4>
            <p className="text-xs text-slate-400 mb-3">اشترك لتصلك أحدث العروض والخصومات الحصرية.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="بريدك الإلكتروني" className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1" />
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all">اشتراك</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          جميع الحقوق محفوظة © 2026 - {tenantName || 'متجر الأجهزة الإلكترونية'}.
        </div>
      </footer>

      {/* Platform Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-scaleUp">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => confirmModal.onConfirm()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {confirmModal.confirmText}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                {confirmModal.cancelText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Support Button */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget'))}
        className="fixed bottom-6 left-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 border border-indigo-400/30 cursor-pointer"
        title="قسم المساعدة والدعم الفني"
      >
        <MessageCircle size={20} />
        <span className="hidden sm:inline">قسم المساعدة والدعم</span>
      </button>

      {/* Support Ticket & Live Chat Widget */}
      <SupportWidget tenant={tenant} primaryColor={content?.primaryColor || "#2563eb"} />
    </div>
  );
}
