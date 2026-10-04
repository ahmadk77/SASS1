import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, ShoppingBag, X, Plus, Minus, Clock, MapPin, Phone, Check, 
  Flame, Sparkles, Send, ShieldCheck, Compass, Droplet, Tag, CheckCircle2, Search, SlidersHorizontal
} from 'lucide-react';
import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export interface CoffeeItem {
  id?: number | string;
  name: string;
  nameEn?: string;
  description: string;
  price: string;
  category: string;
  image: string;
  origin?: string; // e.g. إثيوبيا يرقاتشيف / Ethiopia Yirgacheffe
  process?: string; // e.g. مجففة لا هوائياً / Natural Anaerobic
  roastLevel?: string; // e.g. حمصة خفيفة V60 / Light Roast
  notes?: string[]; // e.g. ['ياسمين', 'خوخ', 'عسل']
  badge?: string;
  prepTime?: string;
  grindOptions?: string[];
  sizeOptions?: string[];
}

export interface CartItem {
  cartId: string;
  product: CoffeeItem;
  quantity: number;
  grindType?: string; // طحنة V60, اسبريسو, حبوب كاملة
  size?: string; // سنجل, دبل, 250 جرام, 1 كيلو
  specialNotes?: string;
  itemTotalPrice: number;
}

export default function SpecialtyCoffee({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CoffeeItem | null>(null);

  // Customization modal state
  const [selectedGrind, setSelectedGrind] = useState<string>('طحنة V60 (فلتر)');
  const [selectedSize, setSelectedSize] = useState<string>('كوب قياسي (Standard)');
  const [quantity, setQuantity] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | 'shipping'>('pickup');
  const [address, setAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const primaryColor = content?.primaryColor || '#d97706'; // Amber / Espresso Warm Gold
  const secondaryColor = content?.secondaryColor || '#09090b'; // Deep Dark Zinc
  const textColor = content?.textColor || '#f4f4f5';
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'V60 Specialty Coffee & Roastery';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'قهوة مختصة مقطرة بعناية وحبوب بن طازجة محمصة محلياً بحرفية عالية';

  const defaultMenu: CoffeeItem[] = [
    {
      id: 1,
      name: 'إثيوبيا يرقاتشيف (V60)',
      nameEn: 'Ethiopia Yirgacheffe V60',
      description: 'حبوب معالجة مجففة ذات إيحاءات زهرية فاخرة بنوتات الياسمين، البرتقال والحلاوة العسلية العالية',
      price: '26 ريال',
      category: 'قهوة مقطرة V60',
      image: 'https://images.unsplash.com/photo-1495474472201-4148ff78b276?q=80&w=800',
      origin: 'إثيوبيا - منطقة يرقاتشيف',
      process: 'مجففة طبيعياً (Natural)',
      roastLevel: 'حمصة خفيفة (Light Roast)',
      notes: ['ياسمين 🌸', 'خوخ 🍑', 'عسل 🍯'],
      badge: 'الأكثر مبيعاً 🏆',
      prepTime: '4 دقائق',
      grindOptions: ['طحنة V60 (فلتر)', 'حبوب كاملة (Whole Bean)', 'طحنة كيمكس'],
      sizeOptions: ['كوب V60 ساخن', 'كوب V60 بارد مع ثلج', 'ظرف بن 250 جرام']
    },
    {
      id: 2,
      name: 'كولومبيا وسيلة - خمرية آنايروبيك',
      nameEn: 'Colombia Huila Anaerobic',
      description: 'معالجة تخمير لا هوائي لمدة 72 ساعة، نكهة معقدة فاخرة بنوتات الكرز الأسود والشوكولاتة الداكنة',
      price: '29 ريال',
      category: 'قهوة مقطرة V60',
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=800',
      origin: 'كولومبيا - منطقة هويلا',
      process: 'تخمير لا هوائي (Anaerobic)',
      roastLevel: 'حمصة خفيفة-متوسطة',
      notes: ['كرز أسود 🍒', 'شوكولاتة 🍫', 'كراميل 🍯'],
      badge: 'محصول حاصد جوائز 🥇',
      prepTime: '5 دقائق',
      grindOptions: ['طحنة V60 (فلتر)', 'طحنة كيمكس', 'حبوب كاملة'],
      sizeOptions: ['كوب V60 ساخن', 'كوب V60 بارد مع ثلج', 'ظرف بن 250 جرام']
    },
    {
      id: 3,
      name: 'فلات وايت اسبريسو مزدوج',
      nameEn: 'Signature Flat White',
      description: 'جرعتين من اسبريسو المحصول الكولومبي مع حليب مبخر بقوام ميكروفوم مخملي كريمي',
      price: '20 ريال',
      category: 'بار الاسبريسو',
      image: 'https://images.unsplash.com/photo-1577968897966-3d4133400030?q=80&w=800',
      origin: 'خليط محمصة الدار',
      process: 'غسيل كامل (Washed)',
      roastLevel: 'حمصة متوسطة (Medium)',
      notes: ['حليب مكرمل 🥛', 'مكسرات محمصة 🥜'],
      badge: 'توازن مثالي ☕',
      prepTime: '3 دقائق',
      grindOptions: ['مشروب جاهز (Ready to Drink)'],
      sizeOptions: ['كوب قياسي (8oz)', 'كوب مضاعف (12oz)']
    },
    {
      id: 4,
      name: 'كولد برو منقوع 24 ساعة',
      nameEn: '24h Steeped Cold Brew',
      description: 'قهوة مستخلصة بالماء البارد لمدة 24 ساعة كاملة، حموضة منخفضة جداً مع قوام غني ونكهات شوكولاتة ناعمة',
      price: '24 ريال',
      category: 'القهوة الباردة',
      image: 'https://images.unsplash.com/photo-1461023058943-0708e5223eeb?q=80&w=800',
      origin: 'السلفادور ودومينيكان',
      process: 'تنقيع بارد بطيء',
      roastLevel: 'حمصة متوسطة',
      notes: ['فانيلا 🍦', 'كاكاو 🍫', 'تمر 🌴'],
      badge: 'منعش جداً ❄️',
      prepTime: 'جاهز مباشرة',
      grindOptions: ['مشروب بارد مع ثلج', 'قارورة زجاجية 300 مل للرحلات'],
      sizeOptions: ['كوب 12oz', 'قارورة 300ml']
    },
    {
      id: 5,
      name: 'ظرف محاصيل كوستاريكا تارازو (250g)',
      nameEn: 'Costa Rica Tarrazu Beans 250g',
      description: 'كيس بن طازج من أفضل مزارع كوستاريكا. حمصة حديثة ومناسبة جداً لمشروبات الفلتر والاسبريسو المنزلية',
      price: '65 ريال',
      category: 'مبيعات حزم البن',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800',
      origin: 'كوستاريكا - وادي تارازو',
      process: 'عسلي أصفر (Yellow Honey)',
      roastLevel: 'حمصة مختصة خفيفة',
      notes: ['تفاح أحمر 🍎', 'عسل نقي 🍯', 'حمضيات هادئة 🍋'],
      badge: 'حمصة جديدة 📦',
      grindOptions: ['حبوب كاملة (Whole Beans)', 'طحنة V60', 'طحنة اسبريسو', 'طحنة فرنش بريس'],
      sizeOptions: ['كيس 250 جرام', 'كيس 1 كيلو جرام']
    },
    {
      id: 6,
      name: 'كيكة البكان بالكراميل المملح',
      nameEn: 'Salted Caramel Pecan Cake',
      description: 'قطعة كيك هشة محشوة بقطع جوز البكان الأمريكي المكرمل مع رشة ملح بحري تتناغم تماماً مع القهوة المقطرة',
      price: '28 ريال',
      category: 'الحلويات المرافقة',
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800',
      notes: ['بكان مكرمل 🌰', 'كراميل 🍯'],
      badge: 'طازجة يومياً 🍰',
      prepTime: '2 دقيقة'
    }
  ];

  const menuItems: CoffeeItem[] = Array.isArray(content?.menuItems)
    ? content.menuItems
    : (Array.isArray(content?.items) ? content.items : defaultMenu);

  const categories = ['الكل', ...Array.from(new Set(menuItems.map((item: CoffeeItem) => item.category || 'أخرى')))];

  const filteredMenu = menuItems.filter((item: CoffeeItem) => {
    const matchesCat = activeCategory === 'الكل' || (item.category || 'أخرى') === activeCategory;
    const matchesSearch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.nameEn && item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.origin && item.origin.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleOpenProductModal = (product: CoffeeItem) => {
    setSelectedProduct(product);
    setSelectedGrind(product.grindOptions?.[0] || 'طحنة V60 (فلتر)');
    setSelectedSize(product.sizeOptions?.[0] || 'كوب قياسي');
    setQuantity(1);
    setSpecialNotes('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const numericPrice = parseFloat(selectedProduct.price.replace(/[^0-9.]/g, '')) || 0;
    const itemTotalPrice = numericPrice * quantity;

    const newCartItem: CartItem = {
      cartId: `${selectedProduct.id || Date.now()}-${Date.now()}`,
      product: selectedProduct,
      quantity,
      grindType: selectedGrind,
      size: selectedSize,
      specialNotes,
      itemTotalPrice
    };

    setCart(prev => [...prev, newCartItem]);
    setSelectedProduct(null);
    showToast(`تمت إضافة (${selectedProduct.name}) إلى سلتك ☕✨`);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleUpdateCartQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const unitPrice = parseFloat(item.product.price.replace(/[^0-9.]/g, '')) || 0;
        return {
          ...item,
          quantity: newQty,
          itemTotalPrice: unitPrice * newQty
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);

  const handleFinalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('يرجى كتابة الاسم ورقم الجوال لإكمال الطلب');
      return;
    }
    if ((orderType === 'delivery' || orderType === 'shipping') && !address.trim()) {
      alert('يرجى إدخال عنوان التوصيل / الشحن بالتفصيل');
      return;
    }
    if (cart.length === 0) {
      alert('السلة فارغة حالياً!');
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const orderSummaryText = cart.map((item, idx) => {
        let details = `${idx + 1}. ${item.product.name} (x${item.quantity}) - ${item.itemTotalPrice} ريال`;
        if (item.grindType) details += `\n   - الطحنة / الإعداد: ${item.grindType}`;
        if (item.size) details += `\n   - الحجم / العبوة: ${item.size}`;
        if (item.specialNotes) details += `\n   - ملاحظات خاصة: ${item.specialNotes}`;
        return details;
      }).join('\n\n');

      const messageHeader = `*طلب جديد من محمصة ومقهى القهوة المختصة ☕📦*\n\n` +
        `*الاسم:* ${customerName}\n` +
        `*رقم الجوال:* ${customerPhone}\n` +
        `*طريقة الاستلام:* ${orderType === 'delivery' ? `توصيل سريع 🚗 (${address})` : orderType === 'shipping' ? `شحن محاصيل للبيت 📦 (${address})` : 'استلام مباشر من الروستري ☕'}\n\n` +
        `*تفاصيل الطلب:*\n${orderSummaryText}\n\n` +
        `*المجموع الكلي:* ${cartTotalAmount} ريال\n\n` +
        `شكراً لتواصلكم معنا!`;

      // 1. Submit lead
      await submitLead(tenant?.id || 'demo', {
        name: customerName,
        phone: customerPhone,
        notes: `طلب قهوة وبن بقيمة ${cartTotalAmount} ريال - ${orderType}`,
        type: 'specialty_coffee_order'
      });

      // 2. Open WhatsApp
      const targetPhone = content?.whatsappNumber || content?.phoneNumber || '966501234567';
      handleWhatsAppAction(targetPhone, messageHeader);

      showToast('تم اعتماد طلبك! جاري فتح الواتساب للتأكيد والتجهيز ☕');
      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      console.error(err);
      showToast('تم تحويلك إلى الواتساب لإرسال الطلب.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Cairo:wght@700;800;900&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-50 bg-amber-600 text-zinc-950 px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-400 flex items-center gap-3 font-black text-sm"
          >
            <Sparkles className="w-5 h-5 text-zinc-950 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="min-h-screen selection:bg-amber-500 selection:text-zinc-950 font-sans relative" 
        dir="rtl" 
        style={{ 
          backgroundColor: secondaryColor, 
          fontFamily: `"${fontFamily}", "Tajawal", sans-serif`, 
          color: textColor 
        }}
      >
        
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            
            {/* Logo & Brand */}
            <div 
              className="text-xl sm:text-2xl font-black tracking-widest cursor-pointer flex items-center gap-3" 
              onClick={() => scrollTo('hero')}
            >
              {(content?.logoUrl || content?.logo) ? (
                <img src={content?.logoUrl || content?.logo} alt="Logo" className="h-10 w-10 object-contain rounded-xl bg-zinc-900 p-1 border border-amber-500/30" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20">
                  <Coffee className="w-6 h-6" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-zinc-100 text-lg sm:text-xl tracking-wider uppercase">
                  {content?.businessName || tenant?.name || 'V60 ROASTERY'}
                </span>
                <span className="text-[10px] text-amber-500 font-bold tracking-widest uppercase">
                  SPECIALTY COFFEE & BEANS
                </span>
              </div>
            </div>

            {/* Direct Links */}
            <div className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <button onClick={() => scrollTo('philosophy')} className="hover:text-amber-400 transition-colors">الفلسفة والتحميص</button>
              <button onClick={() => scrollTo('menu')} className="hover:text-amber-400 transition-colors">قائمة القهوة والمحاصيل</button>
              <button onClick={() => scrollTo('location')} className="hover:text-amber-400 transition-colors">الفرع والتواصل</button>
            </div>

            {/* Cart Trigger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer font-black text-xs"
              >
                <ShoppingBag className="w-5 h-5 text-zinc-950" />
                <span>سلة القهوة</span>
                {cart.length > 0 && (
                  <span className="bg-zinc-950 text-amber-400 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-amber-400">
                    {cart.reduce((total, i) => total + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        {content?.showHero !== false && (
          <header id="hero" className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-[2.5rem] p-6 sm:p-12 md:p-16 border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
              
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Text Content */}
              <div className="flex-1 text-center md:text-right z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs tracking-widest uppercase">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{content?.slogan || 'محمصة مختصة - تحميص طازج أسبوعياً'}</span>
                </div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5 }}
                  className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight text-zinc-100 tracking-tight uppercase"
                >
                  {content?.heroTitle || 'فن التقطير وسحر حبوب البن المختصة.'}
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="text-zinc-400 text-sm sm:text-base font-bold leading-relaxed max-w-xl"
                >
                  {content?.heroSubtitle || 'نستخلص القهوة بنسب دقيقة وحسابات ميزان متوازنة لإبراز الإيحاءات الطبيعية للحبوب الإثيوبية والكولومبية.'}
                </motion.p>

                {/* Badges */}
                <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3 text-xs font-bold text-zinc-300">
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>محاصيل فردية (Single Origin)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>معالجة مجففة ولتاهوائية</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3.5 py-2 rounded-xl border border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>شحن محاصيل طازجة للبيت</span>
                  </div>
                </div>

                {/* Hero Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="pt-2 flex flex-wrap gap-4 justify-center md:justify-start"
                >
                  <button 
                    onClick={() => scrollTo('menu')}
                    className="px-8 py-4 rounded-2xl font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <Coffee className="w-5 h-5" />
                    <span>استكشف المنيو والمحاصيل</span>
                  </button>
                </motion.div>
              </div>

              {/* Image Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6 }}
                className="flex-1 w-full max-w-md relative z-10"
              >
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-800 group">
                  <img 
                    src={content?.heroImage || "https://images.unsplash.com/photo-1495474472201-4148ff78b276?q=80&w=800"} 
                    alt="Specialty V60 Coffee" 
                    className="w-full h-[320px] sm:h-[380px] object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-110" 
                  />
                  <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md text-amber-400 font-black text-xs px-3.5 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 shadow-lg">
                    <Droplet className="w-4 h-4 text-amber-400" />
                    <span>استخلاص دقيق V60 ☕</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </header>
        )}

        {/* Philosophy Section */}
        {content?.showAbout !== false && content?.showFeatures !== false && (
          <section id="philosophy" className="py-20 bg-zinc-900/60 border-y border-zinc-800">
            <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
              <span className="text-amber-500 font-bold text-xs tracking-widest uppercase bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                فلسفة التحميص والتقطير ☕🌱
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-100">
                {content?.aboutTitle || 'شفافية كاملة من المزرعة إلى الكوب'}
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
                {content?.aboutText || 'نؤمن أن القهوة ليست مجرد مشروب، بل تجربة علمية وفنية. نختار محاصيل البن المرتفعة بعناية، ونحمصها بدرجات محددة لإبراز نوتات الفواكه والزهور دون مرارة زائدة.'}
              </p>
            </div>
          </section>
        )}

        {/* Interactive Menu Section */}
        {content?.showMenu !== false && content?.showProducts !== false && (
          <section id="menu" className="py-20 bg-zinc-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              
              {/* Section Header */}
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                <span className="text-amber-400 font-bold text-xs tracking-widest uppercase">
                  قائمة المشروبات ومحاصيل البن 📦☕
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-zinc-100 uppercase">
                  اختر مشروبك أو كيس البن للمنزل
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm font-medium">
                  انقر على أي كيس بن أو مشروب لتحديد نوع الطحنة، درجة الحجم، والطلب فوراً.
                </p>
              </div>

              {/* Search & Categories */}
              <div className="space-y-6 mb-12">
                <div className="max-w-md mx-auto relative">
                  <Search className="w-5 h-5 absolute right-4 top-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="ابحث عن إثيوبيا، V60، فلات وايت، كولد برو..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 text-sm font-bold shadow-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute left-4 top-3.5 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                    >
                      مسح
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {categories.map((cat, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveCategory(cat as string)}
                      className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer border ${
                        activeCategory === cat 
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-lg shadow-amber-500/10 scale-105' 
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-amber-500/50 hover:text-zinc-200'
                      }`}
                    >
                      {cat as string}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Grid */}
              {filteredMenu.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8">
                  <Coffee className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-zinc-300 font-bold text-lg">لم نجد محاصيل بهذا الاسم</h3>
                  <p className="text-zinc-500 text-xs mt-1">جرب البحث بكلمة أخرى أو اختر قسماً آخر</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMenu.map((item: CoffeeItem, idx: number) => (
                    <motion.div 
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 20 }} 
                      whileInView={{ opacity: 1, y: 0 }} 
                      viewport={{ once: true }} 
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="bg-zinc-900/80 rounded-3xl overflow-hidden border border-zinc-800 hover:border-amber-500/50 shadow-xl transition-all duration-300 flex flex-col justify-between group p-5"
                    >
                      <div>
                        {/* Image */}
                        <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 relative bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1495474472201-4148ff78b276?q=80&w=800'} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105" 
                          />
                          
                          {item.badge && (
                            <div className="absolute top-3 right-3 bg-amber-500 text-zinc-950 text-[11px] font-black px-3 py-1 rounded-xl shadow-md">
                              {item.badge}
                            </div>
                          )}

                          <div className="absolute bottom-3 left-3 bg-zinc-950/90 text-amber-400 border border-amber-500/30 font-black text-sm px-3 py-1 rounded-xl shadow-md">
                            {item.price}
                          </div>
                        </div>

                        {/* Title & Origin */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-lg font-black text-zinc-100 group-hover:text-amber-400 transition-colors">
                              {item.name}
                            </h3>
                          </div>

                          {item.origin && (
                            <p className="text-amber-500/90 text-xs font-bold flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5" />
                              <span>{item.origin}</span>
                            </p>
                          )}

                          <p className="text-zinc-400 text-xs font-medium leading-relaxed line-clamp-2">
                            {item.description}
                          </p>

                          {/* Notes badges */}
                          {item.notes && item.notes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {item.notes.map((note, i) => (
                                <span key={i} className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700">
                                  {note}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Button */}
                      <div>
                        <button
                          onClick={() => handleOpenProductModal(item)}
                          className="w-full py-3 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30 active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>تحديد الطحنة والطلب</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer & Contact */}
        {content?.showContact !== false && content?.showFooter !== false && (
          <footer id="location" className="bg-zinc-950 text-zinc-200 py-16 border-t border-zinc-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-3 gap-10">
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-xl text-amber-400 uppercase tracking-wider">
                    {content?.businessName || tenant?.name || 'V60 ROASTERY'}
                  </h3>
                </div>
                <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                  {content?.heroSubtitle || 'محمصة ومقهى قهوة مختصة متخصصة في المحاصيل الفردية النادرة والتقطير الدقيق.'}
                </p>
              </div>

              <div className="space-y-2 text-xs font-medium text-zinc-400">
                <h4 className="text-zinc-100 font-black text-sm mb-3 uppercase tracking-wider">عنوان الفرع</h4>
                <p className="flex items-center gap-2">📍 {content?.address || 'الرياض - حي الملقا - طريق الملك فهد'}</p>
                {content?.phoneNumber && <p className="flex items-center gap-2 dir-ltr text-right">📞 {content?.phoneNumber}</p>}
                {content?.whatsappNumber && <p className="flex items-center gap-2 dir-ltr text-right text-emerald-400">📱 {content?.whatsappNumber}</p>}
              </div>

              <div className="space-y-2 text-xs font-medium text-zinc-400">
                <h4 className="text-zinc-100 font-black text-sm mb-3 uppercase tracking-wider">أوقات العمل والشحن</h4>
                <p className="text-zinc-400">الفرع مفتوح يومياً من ٦:٣٠ صباحاً وحتى ١١:٠٠ مساءً.</p>
                <p className="text-zinc-400">شحن حبوب البن للمنازل متوفر لجميع المناطق خلال ٢٤ - ٤٨ ساعة.</p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    اطلب القهوة الآن ☕
                  </button>
                </div>
              </div>

            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-zinc-900 text-center text-zinc-600 text-xs font-bold">
              جميع الحقوق محفوظة &copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'V60 ROASTERY'}.
            </div>
          </footer>
        )}

        {/* COFFEE CUSTOMIZATION MODAL */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-zinc-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="relative h-48 bg-zinc-950">
                  <img 
                    src={selectedProduct.image || 'https://images.unsplash.com/photo-1495474472201-4148ff78b276?q=80&w=800'} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover filter contrast-105" 
                  />
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full bg-zinc-950/80 text-zinc-300 flex items-center justify-center hover:bg-zinc-950 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 bg-amber-500 text-zinc-950 font-black text-xs px-3 py-1 rounded-xl shadow-md">
                    {selectedProduct.price}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1 font-bold text-zinc-200">
                  <div>
                    <h3 className="font-black text-xl text-zinc-100">{selectedProduct.name}</h3>
                    {selectedProduct.origin && <p className="text-amber-500 text-xs mt-0.5">📍 {selectedProduct.origin}</p>}
                    <p className="text-zinc-400 text-xs font-normal leading-relaxed mt-2">{selectedProduct.description}</p>
                  </div>

                  {/* Grind Options */}
                  {selectedProduct.grindOptions && selectedProduct.grindOptions.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-zinc-800">
                      <label className="block text-xs font-black text-amber-400">
                        درجة الطحنة / الإعداد المفضل ☕
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.grindOptions.map((g, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedGrind(g)}
                            className={`p-2.5 rounded-xl border text-xs font-black text-right transition-all cursor-pointer ${
                              selectedGrind === g 
                                ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md' 
                                : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-850'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Options */}
                  {selectedProduct.sizeOptions && selectedProduct.sizeOptions.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-zinc-800">
                      <label className="block text-xs font-black text-amber-400">
                        الحجم / العبوة المطلوبة 📦
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.sizeOptions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedSize(s)}
                            className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                              selectedSize === s 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500 font-black' 
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Notes */}
                  <div className="pt-3 border-t border-zinc-800">
                    <label className="block text-xs font-black text-zinc-300 mb-1">
                      ملاحظات خاصة (مثال: بدون ثلج، تحضير كيمكس، إلخ):
                    </label>
                    <input 
                      type="text" 
                      placeholder="اكتب أي تعليمات خاصة للبارستا..."
                      value={specialNotes}
                      onChange={e => setSpecialNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-800 rounded-xl text-xs outline-none focus:border-amber-500 bg-zinc-950 text-zinc-100"
                    />
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <span className="text-xs font-black text-zinc-300">الكمية:</span>
                    <div className="flex items-center gap-3 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 bg-zinc-800 text-zinc-200 rounded-lg flex items-center justify-center font-bold hover:bg-zinc-700 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-black text-sm px-2 text-zinc-100">{quantity}</span>
                      <button 
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 bg-zinc-800 text-zinc-200 rounded-lg flex items-center justify-center font-bold hover:bg-zinc-700 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <span className="block text-[10px] text-zinc-500 font-bold">الإجمالي:</span>
                    <span className="text-lg font-black text-amber-400">
                      {(parseFloat(selectedProduct.price.replace(/[^0-9.]/g, '')) || 0) * quantity} ريال
                    </span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>إضافة للسلة</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CART & CHECKOUT DRAWER */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsCartOpen(false)} 
                className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[60]"
              />

              <motion.div 
                initial={{ x: '-100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '-100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
                className="fixed top-0 left-0 h-full w-full sm:w-[480px] bg-zinc-900 z-[70] shadow-2xl flex flex-col font-sans text-zinc-100 border-r border-zinc-800"
              >
                {/* Header */}
                <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 text-white">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-black text-white">سلة القهوة والمحاصيل</h3>
                    <span className="bg-amber-500 text-zinc-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                      {cart.reduce((total, i) => total + i.quantity, 0)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-5 bg-zinc-900 space-y-4 font-bold">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mb-3 border border-amber-500/20">
                        <Coffee className="w-10 h-10" />
                      </div>
                      <h4 className="text-lg font-black text-zinc-100">سلتك فارغة</h4>
                      <p className="text-zinc-500 text-xs mt-1">تصفح المنيو وأضف مشروبك المفضل أو كيس البن ليتم تحضيره لك!</p>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="mt-5 px-6 py-2.5 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black shadow-md hover:bg-amber-400 transition-all cursor-pointer"
                      >
                        تصفح قائمة القهوة
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.cartId} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 shadow-sm flex gap-3">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h5 className="font-black text-xs text-zinc-100 truncate">{item.product.name}</h5>
                                <button 
                                  onClick={() => handleRemoveFromCart(item.cartId)}
                                  className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="text-[10px] text-zinc-400 space-y-0.5 mt-1 font-medium">
                                {item.grindType && <div>• الإعداد: {item.grindType}</div>}
                                {item.size && <div>• العبوة: {item.size}</div>}
                              </div>

                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-900">
                                <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                                  <button 
                                    onClick={() => handleUpdateCartQuantity(item.cartId, -1)}
                                    className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center text-xs font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-black text-zinc-100">{item.quantity}</span>
                                  <button 
                                    onClick={() => handleUpdateCartQuantity(item.cartId, 1)}
                                    className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center text-xs font-bold"
                                  >
                                    +
                                  </button>
                                </div>

                                <span className="text-xs font-black text-amber-400">
                                  {item.itemTotalPrice} ريال
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Checkout Form */}
                      <form onSubmit={handleFinalCheckout} className="pt-4 border-t border-zinc-800 space-y-3">
                        <h4 className="font-black text-xs text-zinc-200 uppercase">بيانات الطلب والتجهيز ☕</h4>

                        {/* Order Type Toggle */}
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl text-xs font-black border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setOrderType('pickup')}
                            className={`py-2 rounded-lg transition-all ${orderType === 'pickup' ? 'bg-amber-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            استلام الفرع
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('delivery')}
                            className={`py-2 rounded-lg transition-all ${orderType === 'delivery' ? 'bg-amber-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            توصيل سريع
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('shipping')}
                            className={`py-2 rounded-lg transition-all ${orderType === 'shipping' ? 'bg-amber-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            شحن بن للبيت
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1">الاسم الكريم *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="مثال: عبدالمجيد العتيبي"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1">رقم الجوال للتواصل *</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="050xxxxxxx"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-amber-500 dir-ltr text-right"
                          />
                        </div>

                        {(orderType === 'delivery' || orderType === 'shipping') && (
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                              {orderType === 'shipping' ? 'عنوان شحن محاصيل البن (المدينة، الحي، الشارع) *' : 'عنوان التوصيل المباشر *'}
                            </label>
                            <input 
                              type="text" 
                              required
                              placeholder="مثال: الرياض - حي الصحافة - شارع الأناقة"
                              value={address}
                              onChange={e => setAddress(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 outline-none focus:border-amber-500"
                            />
                          </div>
                        )}

                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-400">المجموع النهائي:</span>
                          <span className="text-lg font-black text-amber-400">{cartTotalAmount} ريال</span>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingOrder}
                          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                        >
                          <Send className="w-4 h-4" />
                          <span>إرسال الطلب واعتماده بالواتساب</span>
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
