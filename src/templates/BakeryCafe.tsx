import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, X, Plus, Minus, Clock, MapPin, Phone, Check, 
  Sparkles, ShieldCheck, Heart, Search, Gift, Flame, Utensils, Coffee
} from 'lucide-react';
import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export interface BakeryItem {
  id?: number | string;
  name: string;
  nameEn?: string;
  description: string;
  price: string;
  category: string;
  image: string;
  badge?: string;
  calories?: string;
  prepTime?: string;
  heatingOptions?: string[];
  packagingOptions?: string[];
  extraOptions?: string[];
}

export interface CartItem {
  cartId: string;
  product: BakeryItem;
  quantity: number;
  heatingPreference?: string;
  packagingPreference?: string;
  selectedExtra?: string;
  specialNotes?: string;
  itemTotalPrice: number;
}

export default function BakeryCafe({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<BakeryItem | null>(null);

  // Customization modal state
  const [selectedHeating, setSelectedHeating] = useState<string>('تسخين طازج دافئ 🔥');
  const [selectedPackaging, setSelectedPackaging] = useState<string>('كيس المخبوزات الورقي 🛍️');
  const [selectedExtra, setSelectedExtra] = useState<string>('بدون إضافات');
  const [quantity, setQuantity] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery' | 'preorder'>('pickup');
  const [address, setAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const primaryColor = content?.primaryColor || '#d97706'; // Warm Amber Honey
  const secondaryColor = content?.secondaryColor || '#fffdf8'; // Warm Ivory Cream
  const textColor = content?.textColor || '#29150b'; // Deep Mahogany Wood
  const fontFamily = content?.fontFamily || 'Cairo';
  const metaTitle = content?.metaTitle || `${content?.businessName || tenant?.name || 'صـبـاحُـك'} | مخبز ومقهى المخبوزات الفرنسية الطازجة`;
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'رائحة الخبز الطازج، ولمسة الزبدة الفرنسية، مع فنجان قهوة يوقظ حواسك كل صباح.';

  const defaultMenu: BakeryItem[] = [
    {
      id: 1,
      name: 'كرواسون الزبدة الفاخر (Butter Croissant)',
      nameEn: 'French Butter Croissant',
      description: 'كرواسون فرنسي هش غني بالزبدة الطبيعية الفرنسية مع طبقات مقرمشة ولذيذة تتفتت باليد',
      price: '18 ريال',
      category: 'المخبوزات والكرواسون',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800',
      badge: 'الأكثر مبيعاً 🥐',
      calories: '280 سعرة',
      heatingOptions: ['تسخين طازج دافئ 🔥', 'بدون تسخين (درجة حرارة الغرفة)', 'تسخين خفيف'],
      packagingOptions: ['كيس المخبوزات الورقي 🛍️', 'صندوق هدايا كرتوني فاخر 🎁'],
      extraOptions: ['بدون إضافات', 'مربى فراولة طبيعي 🍓 (+3 ريال)', 'زبدة فرنسية إضافية 🧈 (+2 ريال)', 'صوص نوتيلا بلجيكي 🍫 (+4 ريال)']
    },
    {
      id: 2,
      name: 'تارت الفراولة والتوت مع الكاسترد',
      nameEn: 'Fresh Strawberry Berry Tart',
      description: 'عجينة البوبكيك الهشة المقرمشة محشوة بكاسترد الفانيليا الطبيعية ومزينة بقطع الفراولة والتوت العضوي الطازج',
      price: '28 ريال',
      category: 'التارت والحلويات',
      image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=800',
      badge: 'طازج يومياً 🍓',
      calories: '320 سعرة',
      heatingOptions: ['يقدم بارداً ❄️'],
      packagingOptions: ['صندوق التارت المحمي 🎁', 'كيس ورقي قياسي 🛍️'],
      extraOptions: ['بدون إضافات', 'صلصة التوت العليق 🫐 (+3 ريال)']
    },
    {
      id: 3,
      name: 'خبز الساوردو الطبيعي (Artisan Sourdough)',
      nameEn: 'Artisan Country Sourdough',
      description: 'خبز تخمير طبيعي يدوياً مدة 36 ساعة بفرن الحجر التقليدي، قشرة مقرمشة ولب طري متماسك',
      price: '25 ريال',
      category: 'الخبز الحرفي والساوردو',
      image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=800',
      badge: 'تخمير 36 ساعة 🥖',
      calories: '220 سعرة / شريحة',
      heatingOptions: ['كامل بدون تقطيع', 'مقطع شرائح جاهزة للساندويتش', 'محمص طازج'],
      packagingOptions: ['كيس قماش كلاسيكي للخبز 🧺', 'كيس ورقي محمي 🛍️'],
      extraOptions: ['بدون إضافات', 'زبدة فرنسية مملحة 🧈 (+5 ريال)', 'زيت زيتون مع أعشاب 🌿 (+6 ريال)']
    },
    {
      id: 4,
      name: 'صندوق الجمعات والمشاركات (Morning Bakery Box)',
      nameEn: 'Sharing Breakfast Bakery Box',
      description: 'تشكيلة فاخرة تحتوي على 8 قطع متنوعة (2 كرواسون زبدة، 2 شوكولاتة، 2 بكان، 2 دانش فواكه) مع أظرف المربى',
      price: '110 ريال',
      category: 'صناديق الجمعات والصباح',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800',
      badge: 'مثالي للجمعات 🎁',
      heatingOptions: ['جميع القطع مسخنة دافئة 🔥', 'درجة حرارة الغرفة'],
      packagingOptions: ['صندوق تقديم خشبي فاخر 📦', 'صندوق كرتوني ملون 🎁'],
      extraOptions: ['شريط إهداء مجاني 🎀', 'كارت معايدة مخصص 💌']
    },
    {
      id: 5,
      name: 'دانيش البكان والكراميل (Pecan Caramel Danish)',
      nameEn: 'Pecan Salted Caramel Danish',
      description: 'طبقات المخبوزات الذهبية المحشوة بقطع جوز البكان الأمريكي المكرمل مع رشة ملح بحري ناعم',
      price: '22 ريال',
      category: 'المخبوزات والكرواسون',
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800',
      badge: 'نكهة فاخرة 🌰',
      calories: '340 سعرة',
      heatingOptions: ['تسخين طازج دافئ 🔥', 'بدون تسخين'],
      packagingOptions: ['كيس المخبوزات الورقي 🛍️', 'علبة هدايا فردية 🎁']
    },
    {
      id: 6,
      name: 'لاتيه الفانيليا الدافئ (Madagascar Vanilla Latte)',
      nameEn: 'Madagascar Vanilla Latte',
      description: 'جرعتين من اسبريسو القهوة المختصة مع حليب مبخر ونكهة فانيليا مدغشقر الطبيعية المستخلصة يدوياً',
      price: '22 ريال',
      category: 'القهوة والمشروبات',
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800',
      badge: 'قوام كريمي ☕',
      heatingOptions: ['ساخن جداً ☕', 'دافئ متوازن', 'بارد مع ثلج 🧊'],
      packagingOptions: ['كوب المخبز الحراري 🥤']
    }
  ];

  const menuItems: BakeryItem[] = Array.isArray(content?.menuItems)
    ? content.menuItems
    : (Array.isArray(content?.items) ? content.items : defaultMenu);

  const categories = ['الكل', ...Array.from(new Set(menuItems.map((item: BakeryItem) => item.category || 'أخرى')))];

  const filteredMenu = menuItems.filter((item: BakeryItem) => {
    const matchesCat = activeCategory === 'الكل' || (item.category || 'أخرى') === activeCategory;
    const matchesSearch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.nameEn && item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenProductModal = (product: BakeryItem) => {
    setSelectedProduct(product);
    setSelectedHeating(product.heatingOptions?.[0] || 'تسخين طازج دافئ 🔥');
    setSelectedPackaging(product.packagingOptions?.[0] || 'كيس المخبوزات الورقي 🛍️');
    setSelectedExtra(product.extraOptions?.[0] || 'بدون إضافات');
    setQuantity(1);
    setSpecialNotes('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const numericPrice = parseFloat(selectedProduct.price.replace(/[^0-9.]/g, '')) || 0;
    
    // Add extra price if selected
    let extraCost = 0;
    if (selectedExtra.includes('+3')) extraCost = 3;
    else if (selectedExtra.includes('+2')) extraCost = 2;
    else if (selectedExtra.includes('+4')) extraCost = 4;
    else if (selectedExtra.includes('+5')) extraCost = 5;
    else if (selectedExtra.includes('+6')) extraCost = 6;

    const unitPrice = numericPrice + extraCost;
    const itemTotalPrice = unitPrice * quantity;

    const newCartItem: CartItem = {
      cartId: `${selectedProduct.id || Date.now()}-${Date.now()}`,
      product: selectedProduct,
      quantity,
      heatingPreference: selectedHeating,
      packagingPreference: selectedPackaging,
      selectedExtra,
      specialNotes,
      itemTotalPrice
    };

    setCart(prev => [...prev, newCartItem]);
    setSelectedProduct(null);
    showToast(`تمت إضافة (${selectedProduct.name}) إلى سلتك 🥐✨`);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleUpdateCartQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const unitPrice = item.itemTotalPrice / item.quantity;
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
    if (orderType === 'delivery' && !address.trim()) {
      alert('يرجى إدخال عنوان التوصيل بالتفصيل');
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
        if (item.heatingPreference) details += `\n   - التسخين: ${item.heatingPreference}`;
        if (item.packagingPreference) details += `\n   - التغليف: ${item.packagingPreference}`;
        if (item.selectedExtra && item.selectedExtra !== 'بدون إضافات') details += `\n   - الإضافة: ${item.selectedExtra}`;
        if (item.specialNotes) details += `\n   - ملاحظات خاصة: ${item.specialNotes}`;
        return details;
      }).join('\n\n');

      const messageHeader = `*طلب جديد من مخبز ومقهى المخبوزات الطازجة 🥐☕*\n\n` +
        `*الاسم:* ${customerName}\n` +
        `*رقم الجوال:* ${customerPhone}\n` +
        `*نوع الاستلام:* ${orderType === 'delivery' ? `توصيل سريع 🚗 (${address})` : orderType === 'preorder' ? 'طلبية مسبقة ومحجوزة 🎁' : 'استلام مباشر من الفرع 🥖'}\n\n` +
        `*تفاصيل الطلب:*\n${orderSummaryText}\n\n` +
        `*المجموع الكلي:* ${cartTotalAmount} ريال\n\n` +
        `شكراً لتواصلكم معنا!`;

      // 1. Submit lead
      await submitLead(tenant?.id || 'demo', {
        name: customerName,
        phone: customerPhone,
        notes: `طلب مخبوزات وحلويات بقيمة ${cartTotalAmount} ريال - ${orderType}`,
        type: 'bakery_cafe_order'
      });

      // 2. Open WhatsApp
      const targetPhone = content?.whatsappNumber || content?.phoneNumber || '966501234567';
      handleWhatsAppAction(targetPhone, messageHeader);

      showToast('تم اعتماد طلبك! جاري تحويلك إلى الواتساب للتجهيز المباشر 🥐');
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
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@500;700;800&display=swap" rel="stylesheet" />
      </Helmet>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-50 bg-[#d97706] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 font-black text-sm"
          >
            <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="min-h-screen selection:bg-amber-500 selection:text-white font-sans relative" 
        dir="rtl" 
        style={{ 
          backgroundColor: secondaryColor, 
          fontFamily: `"${fontFamily}", "Cairo", sans-serif`, 
          color: textColor 
        }}
      >
        
        {/* Top Header Notice */}
        <div className="bg-[#3e1f12] text-amber-200 py-2 px-4 text-center text-xs font-bold tracking-wide flex justify-center items-center gap-2">
          <span>🥖 مخبوزات طازجة يومياً تخرج من أفراننا بدءاً من السادسة صباحاً</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">نغلق عند نفاذ الكمية اليومية!</span>
        </div>

        {/* Navigation Bar */}
        <nav className="sticky top-0 z-40 bg-[#fffdf8]/90 backdrop-blur-md border-b border-amber-900/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            
            {/* Logo & Brand */}
            <div 
              className="text-xl sm:text-2xl font-black tracking-tight cursor-pointer flex items-center gap-3" 
              onClick={() => scrollTo('hero')}
            >
              {(content?.logoUrl || content?.logo) ? (
                <img src={content?.logoUrl || content?.logo} alt="Logo" className="h-10 w-10 object-contain rounded-xl bg-amber-100/50 p-1 border border-amber-200" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-600/20 text-xl">
                  🥐
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-[#29150b] text-lg sm:text-2xl tracking-tight" style={{ color: textColor }}>
                  {content?.businessName || tenant?.name || 'صـبـاحُـك'}
                </span>
                <span className="text-[10px] text-amber-700 font-bold tracking-wider uppercase">
                  BAKERY & PASTRY CAFE
                </span>
              </div>
            </div>

            {/* Direct Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-amber-950/80">
              <button onClick={() => scrollTo('story')} className="hover:text-amber-600 transition-colors">قصة المخبز</button>
              <button onClick={() => scrollTo('menu')} className="hover:text-amber-600 transition-colors">قائمة المخبوزات</button>
              <button onClick={() => scrollTo('visit')} className="hover:text-amber-600 transition-colors">موقعنا وفروعنا</button>
            </div>

            {/* Cart Trigger Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer font-black text-xs"
              >
                <ShoppingBag className="w-5 h-5 text-amber-100" />
                <span>سلة المخبوزات</span>
                {cart.length > 0 && (
                  <span className="bg-white text-amber-700 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {cart.reduce((total, i) => total + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        {content?.showHero !== false && (
          <header id="hero" className="pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-[#fef8ed] via-[#fffdf8] to-[#fef3c7] rounded-[2.5rem] p-6 sm:p-12 md:p-16 border border-amber-200/60 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
              
              {/* Decorative Glow */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl pointer-events-none"></div>

              {/* Text Content */}
              <div className="flex-1 text-center md:text-right space-y-6 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold text-xs">
                  <span>{content?.slogan || '🌞 مخبوزات فرنسية طازجة بعجين الساوردو والزبدة الفاخرة'}</span>
                </div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5 }}
                  className="text-3xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight text-[#29150b]"
                >
                  {content?.heroTitle || 'ابدأ يومك بحب ومخبوزات دافئة.'}
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="text-amber-950/80 text-base sm:text-lg font-bold leading-relaxed max-w-xl"
                >
                  {content?.heroSubtitle || 'رائحة الخبز الطازج، ولمسة الزبدة الفرنسية المورقة، مع فنجان قهوة يوقظ حواسك ورائحة الكرواسون الدافئة.'}
                </motion.p>

                {/* Features badges */}
                <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3 text-xs font-bold text-amber-900">
                  <div className="flex items-center gap-1.5 bg-white/80 px-3.5 py-2 rounded-xl border border-amber-200 shadow-sm">
                    <Check className="w-4 h-4 text-amber-600" />
                    <span>خبز ساوردو تخمير 36 ساعة</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 px-3.5 py-2 rounded-xl border border-amber-200 shadow-sm">
                    <Check className="w-4 h-4 text-amber-600" />
                    <span>زبدة فرنسية مستوردة 🧈</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 px-3.5 py-2 rounded-xl border border-amber-200 shadow-sm">
                    <Check className="w-4 h-4 text-amber-600" />
                    <span>تجهيز وحجز مسبق للجمعات</span>
                  </div>
                </div>

                {/* Hero CTA Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="pt-3 flex flex-wrap gap-4 justify-center md:justify-start"
                >
                  <button 
                    onClick={() => scrollTo('menu')}
                    className="px-8 py-4 rounded-2xl font-black text-white bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <span>🥐 تصفح منيو المخبوزات والصباح</span>
                  </button>
                </motion.div>
              </div>

              {/* Image Showcase */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6 }}
                className="flex-1 w-full max-w-md relative z-10"
              >
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white group">
                  <img 
                    src={content?.heroImage || "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800"} 
                    alt="Fresh Bakery & Croissants" 
                    className="w-full h-[320px] sm:h-[380px] object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-amber-800 font-black text-xs px-4 py-2 rounded-2xl shadow-lg border border-amber-200 flex items-center gap-2">
                    <span className="text-xl">🥐</span>
                    <span>طازج ومحمص من الفرن الآن</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </header>
        )}

        {/* Story & Philosophy */}
        {content?.showAbout !== false && content?.showFeatures !== false && (
          <section id="story" className="py-16 bg-[#fef8ed] border-y border-amber-200/50">
            <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
              <span className="text-amber-700 font-bold text-xs tracking-widest uppercase bg-amber-200/60 px-4 py-1.5 rounded-full border border-amber-300">
                حرفة المخبوزات الفرنسية 🥖✨
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#29150b]">
                {content?.aboutTitle || 'نخبز بكل حب وشفافية من الصباح الباكر'}
              </h2>
              <p className="text-amber-950/80 text-sm sm:text-base leading-relaxed font-medium max-w-2xl mx-auto">
                {content?.aboutText || 'نعتمد في خَبز منتجاتنا على الطريقة الفرنسية الكلاسيكية، باستخدام الدقيق العضوي الفاخر والزبدة النيرماندية النظيفة، لضمان قوام مورق وطعم ينبض بالحياة مع كل قضم.'}
              </p>
            </div>
          </section>
        )}

        {/* Menu Section */}
        {content?.showMenu !== false && content?.showProducts !== false && (
          <section id="menu" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-amber-700 font-bold text-xs tracking-widest uppercase bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                قائمة المنتجات الطازجة 🍰🥐
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#29150b]">
                اختر مخبوزاتك المفضلة وسنقوم بتدفئتها لك
              </h2>
              <p className="text-amber-900/70 text-xs sm:text-sm font-medium">
                اضغط على أي صنف لتحديد طريقة التسخين والتغليف وإضافات المربى أو القهوة المرافقة!
              </p>
            </div>

            {/* Search & Categories */}
            <div className="space-y-6 mb-12">
              <div className="max-w-md mx-auto relative">
                <Search className="w-5 h-5 absolute right-4 top-3.5 text-amber-700/50" />
                <input
                  type="text"
                  placeholder="ابحث عن كرواسون، تارت، ساوردو، بكان، لاتيه..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border border-amber-200 bg-white text-amber-950 text-sm font-bold shadow-sm focus:outline-none focus:border-amber-600 transition-all placeholder:text-amber-800/40"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-4 top-3.5 text-amber-700 hover:text-amber-900 text-xs font-bold"
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
                        ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/10 scale-105' 
                        : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    {cat as string}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            {filteredMenu.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-amber-200 p-8">
                <span className="text-4xl block mb-2">🥐</span>
                <h3 className="text-amber-950 font-bold text-lg">لم نجد مخبوزات بهذا الاسم</h3>
                <p className="text-amber-800/60 text-xs mt-1">جرب البحث بكلمة أخرى أو اختر قسماً آخر</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenu.map((item: BakeryItem, idx: number) => (
                  <motion.div 
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }} 
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="bg-white rounded-3xl overflow-hidden border border-amber-200/80 hover:border-amber-400 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group p-5"
                  >
                    <div>
                      {/* Image Container */}
                      <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 relative bg-amber-50 flex items-center justify-center">
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800'} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        
                        {item.badge && (
                          <div className="absolute top-3 right-3 bg-amber-600 text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-md">
                            {item.badge}
                          </div>
                        )}

                        <div className="absolute bottom-3 left-3 bg-white/95 text-amber-900 font-black text-sm px-3 py-1 rounded-xl shadow-md border border-amber-200">
                          {item.price}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2 mb-4">
                        <h3 className="text-lg font-black text-amber-950 group-hover:text-amber-600 transition-colors">
                          {item.name}
                        </h3>

                        <p className="text-amber-900/70 text-xs font-medium leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        {item.calories && (
                          <p className="text-[11px] font-bold text-amber-700 pt-1">
                            🔥 {item.calories}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Add to Cart Trigger */}
                    <div>
                      <button
                        onClick={() => handleOpenProductModal(item)}
                        className="w-full py-3 bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-900 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-200 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تحديد الخيارات وإضافة للسلة</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Location & Visiting Info */}
        {content?.showContact !== false && content?.showFooter !== false && (
          <footer id="visit" className="bg-[#3e1f12] text-amber-100 py-16 border-t border-amber-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-3 gap-10">
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg">
                    🥐
                  </div>
                  <h3 className="font-black text-xl text-amber-300">
                    {content?.businessName || tenant?.name || 'صـبـاحُـك'}
                  </h3>
                </div>
                <p className="text-amber-200/80 text-xs font-medium leading-relaxed">
                  {content?.heroSubtitle || 'مخبز فرنسي متألق يقدم أشهى أنواع الكرواسون، والساوردو، والتارت الطازج يومياً.'}
                </p>
              </div>

              <div className="space-y-2 text-xs font-medium text-amber-200/90">
                <h4 className="text-white font-black text-sm mb-3">ساعات العمل والخبز الطازج</h4>
                <p className="flex items-center gap-2">⏰ الدفعة الأولى من الخبز: ٦:٠٠ صباحاً</p>
                <p className="flex items-center gap-2">⏰ الدفعة الثانية الدافئة: ٤:٠٠ عصراً</p>
                <p className="text-amber-400 font-bold pt-1">يومياً حتى السادسة مساءً أو نفاذ الكمية</p>
              </div>

              <div className="space-y-2 text-xs font-medium text-amber-200/90">
                <h4 className="text-white font-black text-sm mb-3">الفرع وخدمة التوصيل</h4>
                <p className="flex items-center gap-2">📍 {content?.address || 'الرياض - حي الياسمين - طريق أنس بن مالك'}</p>
                {content?.phoneNumber && <p className="flex items-center gap-2 dir-ltr text-right">📞 {content?.phoneNumber}</p>}
                {content?.whatsappNumber && <p className="flex items-center gap-2 dir-ltr text-right text-emerald-300">📱 {content?.whatsappNumber}</p>}
                <div className="pt-2">
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#29150b] font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    اطلب السلة الآن 🥖
                  </button>
                </div>
              </div>

            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-amber-900/60 text-center text-amber-300/50 text-xs font-bold">
              جميع الحقوق محفوظة &copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'صـبـاحُـك'}.
            </div>
          </footer>
        )}

        {/* ITEM CUSTOMIZATION MODAL */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-200 flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="relative h-48 bg-amber-100">
                  <img 
                    src={selectedProduct.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800'} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover" 
                  />
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/80 text-amber-950 flex items-center justify-center hover:bg-white cursor-pointer shadow-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 bg-amber-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md">
                    {selectedProduct.price}
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1 font-bold text-amber-950">
                  <div>
                    <h3 className="font-black text-xl text-amber-950">{selectedProduct.name}</h3>
                    <p className="text-amber-900/70 text-xs font-medium leading-relaxed mt-1">{selectedProduct.description}</p>
                  </div>

                  {/* Heating Preference */}
                  {selectedProduct.heatingOptions && selectedProduct.heatingOptions.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-amber-100">
                      <label className="block text-xs font-black text-amber-800">
                        درجة التسخين والتقديم 🥐
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProduct.heatingOptions.map((h, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedHeating(h)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                              selectedHeating === h 
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                                : 'bg-amber-50/50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Packaging Preference */}
                  {selectedProduct.packagingOptions && selectedProduct.packagingOptions.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-amber-100">
                      <label className="block text-xs font-black text-amber-800">
                        نوع التغليف والتنسيق 🎁
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProduct.packagingOptions.map((pkg, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedPackaging(pkg)}
                            className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                              selectedPackaging === pkg 
                                ? 'bg-amber-600/20 text-amber-800 border-amber-500 font-black' 
                                : 'bg-amber-50/30 text-amber-900 border-amber-200'
                            }`}
                          >
                            {pkg}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra Sauces/Dips */}
                  {selectedProduct.extraOptions && selectedProduct.extraOptions.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-amber-100">
                      <label className="block text-xs font-black text-amber-800">
                        إضافات المربى والصلصات الجانبية 🧈
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProduct.extraOptions.map((ext, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedExtra(ext)}
                            className={`p-2 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                              selectedExtra === ext 
                                ? 'bg-amber-600/20 text-amber-900 border-amber-500 font-black' 
                                : 'bg-amber-50/30 text-amber-900 border-amber-200'
                            }`}
                          >
                            {ext}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Notes */}
                  <div className="pt-3 border-t border-amber-100">
                    <label className="block text-xs font-black text-amber-900 mb-1">
                      ملاحظات خاصة للخباز:
                    </label>
                    <input 
                      type="text" 
                      placeholder="اكتب أي ملاحظة تخص طلبك..."
                      value={specialNotes}
                      onChange={e => setSpecialNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs outline-none focus:border-amber-600 bg-amber-50/30 text-amber-950"
                    />
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center justify-between pt-3 border-t border-amber-100">
                    <span className="text-xs font-black text-amber-900">الكمية:</span>
                    <div className="flex items-center gap-3 bg-amber-100/60 p-1.5 rounded-xl border border-amber-200">
                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 bg-white text-amber-900 rounded-lg flex items-center justify-center font-bold hover:bg-amber-200 cursor-pointer shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-black text-sm px-2 text-amber-950">{quantity}</span>
                      <button 
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 bg-white text-amber-900 rounded-lg flex items-center justify-center font-bold hover:bg-amber-200 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <span className="block text-[10px] text-amber-700 font-bold">الإجمالي:</span>
                    <span className="text-lg font-black text-amber-900">
                      {((parseFloat(selectedProduct.price.replace(/[^0-9.]/g, '')) || 0) + (selectedExtra.includes('+3') ? 3 : selectedExtra.includes('+2') ? 2 : selectedExtra.includes('+4') ? 4 : selectedExtra.includes('+5') ? 5 : selectedExtra.includes('+6') ? 6 : 0)) * quantity} ريال
                    </span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>إضافة لسلة المخبوزات</span>
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
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              />

              <motion.div 
                initial={{ x: '-100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '-100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
                className="fixed top-0 left-0 h-full w-full sm:w-[480px] bg-white z-[70] shadow-2xl flex flex-col font-sans text-amber-950 border-r border-amber-200"
              >
                {/* Header */}
                <div className="p-5 border-b border-amber-200 flex justify-between items-center bg-[#3e1f12] text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥐</span>
                    <h3 className="text-lg font-black text-white">سلة المخبوزات والطلبات</h3>
                    <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                      {cart.reduce((total, i) => total + i.quantity, 0)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-5 bg-[#fffdf8] space-y-4 font-bold">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3 text-3xl">
                        🥐
                      </div>
                      <h4 className="text-lg font-black text-amber-950">سلتك فارغة</h4>
                      <p className="text-amber-800/60 text-xs mt-1">تصفح قائمة المخبوزات وأضف الكرواسون والتارت المفضلة لديك ليتم إعدادها لك!</p>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="mt-5 px-6 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-amber-700 transition-all cursor-pointer"
                      >
                        تصفح منيو المخبوزات
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.cartId} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm flex gap-3">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-amber-100" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h5 className="font-black text-xs text-amber-950 truncate">{item.product.name}</h5>
                                <button 
                                  onClick={() => handleRemoveFromCart(item.cartId)}
                                  className="text-amber-400 hover:text-red-500 p-1 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="text-[10px] text-amber-800/80 space-y-0.5 mt-1 font-medium">
                                {item.heatingPreference && <div>• التسخين: {item.heatingPreference}</div>}
                                {item.packagingPreference && <div>• التغليف: {item.packagingPreference}</div>}
                                {item.selectedExtra && item.selectedExtra !== 'بدون إضافات' && <div>• الإضافة: {item.selectedExtra}</div>}
                              </div>

                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-50">
                                <div className="flex items-center gap-2 bg-amber-100/60 px-2 py-1 rounded-lg border border-amber-200">
                                  <button 
                                    onClick={() => handleUpdateCartQuantity(item.cartId, -1)}
                                    className="w-5 h-5 bg-white text-amber-900 rounded flex items-center justify-center text-xs font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-black text-amber-950">{item.quantity}</span>
                                  <button 
                                    onClick={() => handleUpdateCartQuantity(item.cartId, 1)}
                                    className="w-5 h-5 bg-white text-amber-900 rounded flex items-center justify-center text-xs font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="font-black text-xs text-amber-900">{item.itemTotalPrice} ريال</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Customer Checkout Form */}
                      <form onSubmit={handleFinalCheckout} className="mt-6 pt-5 border-t border-amber-200 space-y-4">
                        <h4 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                          <span>بيانات الاستلام والتأكيد 🥖</span>
                        </h4>

                        {/* Order Type */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderType('pickup')}
                            className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                              orderType === 'pickup' 
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                                : 'bg-white text-amber-900 border-amber-200'
                            }`}
                          >
                            استلام من الفرع 🥖
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('delivery')}
                            className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                              orderType === 'delivery' 
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                                : 'bg-white text-amber-900 border-amber-200'
                            }`}
                          >
                            توصيل سريع 🚗
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('preorder')}
                            className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                              orderType === 'preorder' 
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                                : 'bg-white text-amber-900 border-amber-200'
                            }`}
                          >
                            طلب مسبق 🎁
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-amber-900 mb-1">الاسم الكريم:</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="اكتب اسمك الكامل..."
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full px-3 me-0 py-2 rounded-xl border border-amber-200 text-xs font-bold bg-white focus:outline-none focus:border-amber-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-amber-900 mb-1">رقم الجوال (واتساب):</label>
                          <input 
                            type="tel" 
                            required 
                            placeholder="050XXXXXXX"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs font-bold bg-white focus:outline-none focus:border-amber-600 dir-ltr text-right"
                          />
                        </div>

                        {orderType === 'delivery' && (
                          <div>
                            <label className="block text-xs font-bold text-amber-900 mb-1">عنوان التوصيل بالتفصيل:</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="اسم الحي، الشارع، الشقة..."
                              value={address}
                              onChange={e => setAddress(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs font-bold bg-white focus:outline-none focus:border-amber-600"
                            />
                          </div>
                        )}

                        <div className="pt-3 border-t border-amber-200 flex justify-between items-center">
                          <span className="font-bold text-xs text-amber-900">المجموع الكلي:</span>
                          <span className="font-black text-xl text-amber-900">{cartTotalAmount} ريال</span>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingOrder}
                          className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSubmittingOrder ? (
                            <span>جاري التجهيز...</span>
                          ) : (
                            <>
                              <span>إرسال الطلب عبر الواتساب</span>
                              <span className="text-base">💬</span>
                            </>
                          )}
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
