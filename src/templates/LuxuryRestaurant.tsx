import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, X, Plus, Minus, Clock, MapPin, Phone, Utensils, 
  CheckCircle2, Star, Search, Sparkles, Send, Calendar, Users, Crown, Award, ChevronRight
} from 'lucide-react';
import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export interface MenuItem {
  id?: number | string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  badge?: string;
  prepTime?: string;
  calories?: string;
  isChefSpecial?: boolean;
  winePairing?: string;
  allergens?: string[];
}

export interface CartItem {
  cartId: string;
  product: MenuItem;
  quantity: number;
  doneness?: string;
  beveragePairing?: string;
  notes?: string;
  itemTotalPrice: number;
}

export default function LuxuryRestaurant({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  // Customization Modal State
  const [doneness, setDoneness] = useState<string>('طهي متوسط (Medium)');
  const [beveragePairing, setBeveragePairing] = useState<string>('عصير العنب الفوار الخالي من الكحول');
  const [quantity, setQuantity] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Table Reservation Modal
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '20:00',
    guests: '2',
    occasion: 'عشاء عمل / مناسبة خاصة',
    notes: ''
  });
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);

  // Customer Checkout Form inside Cart Drawer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'dinein' | 'reservation' | 'delivery'>('dinein');
  const [tableNumber, setTableNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const primaryColor = content?.primaryColor || '#cfb53b'; // Royal Gold
  const fontFamily = content?.fontFamily || 'Cairo';

  const defaultMenuItems: MenuItem[] = [
    {
      id: 1,
      name: 'ستيك واجيو A5 بالكمأة السوداء',
      description: 'قطع لحم واجيو ياباني معتقة بعناية، مقدمة مع صلصة الكمأة السوداء والبطاطس المهروسة بالزبدة الفاخرة',
      price: '280 ريال',
      category: 'الأطباق الرئيسية',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
      badge: 'توصية الشيف 👑',
      prepTime: '20 دقيقة',
      calories: '780 سعرة',
      isChefSpecial: true,
      winePairing: 'مشروب العنب الأحمر الخالي من الكحول'
    },
    {
      id: 2,
      name: 'أستاكوزا ثرميدور الملكية',
      description: 'لحم أستاكوزا طازج مطهو بصلصة الكريمة الغنية، الشالوت، والجبن السويسري الذهبي مع بهارات الشيف الخاصة',
      price: '340 ريال',
      category: 'الأطباق الرئيسية',
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800',
      badge: 'مأكولات بحرية فاخرة 🦞',
      prepTime: '25 دقيقة',
      calories: '620 سعرة',
      isChefSpecial: true
    },
    {
      id: 3,
      name: 'باستا الروبيان بالكمأة والبارميجانو',
      description: 'باستا طازجة محضرة يدوياً مع روبيان جامبو، كريمة الكمأة البيضاء وجبن البارميجانو المعتق 24 شهراً',
      price: '165 ريال',
      category: 'الأطباق الرئيسية',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800',
      badge: 'طازج يومياً 🍝',
      prepTime: '15 دقيقة',
      calories: '590 سعرة'
    },
    {
      id: 4,
      name: 'كافيار أوسيترا مع التوست الذهبي',
      description: 'كافيار فاخر يُقدم على طبقة ثلجية مع كريب التوست الذهبي الكلاسيكي والكريمة الحامضة الخفيفة',
      price: '450 ريال',
      category: 'المقبلات الفاخرة',
      image: 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?q=80&w=800',
      badge: 'طبق حصري ✨',
      prepTime: '10 دقائق',
      calories: '220 سعرة'
    },
    {
      id: 5,
      name: 'شوربة السلطعون بالزعفران الملكي',
      description: 'شوربة كريمية غنية بقطع السلطعون الطازج ونكهة الزعفران الإيراني الأصيل مع لمسة من زيت الأعشاب',
      price: '85 ريال',
      category: 'المقبلات الفاخرة',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800',
      prepTime: '12 دقيقة',
      calories: '310 سعرة'
    },
    {
      id: 6,
      name: 'حلى المِلفيه بفرنسا وبودرة الذهب',
      description: 'طبقات رقائق المِلفيه المقرمشة المحشوة بكريمة الفانيليا النواة ومزينة بلمسات من ورق الذهب الخالص',
      price: '95 ريال',
      category: 'الحلويات الفاخرة',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800',
      badge: 'لمسة ختامية 🍰',
      prepTime: '10 دقائق',
      calories: '450 سعرة'
    }
  ];

  const menuItems: MenuItem[] = Array.isArray(content?.menuItems)
    ? content.menuItems
    : (Array.isArray(content?.items) ? content.items : defaultMenuItems);
  const categories = ['الكل', ...Array.from(new Set(menuItems.map(item => item.category || 'أخرى')))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'الكل' || item.category === activeCategory;
    const name = item.name || '';
    const desc = item.description || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const parsePriceNum = (priceStr: string | number) => {
    const num = parseInt(priceStr.toString().replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const openCustomization = (item: MenuItem) => {
    setSelectedProduct(item);
    setDoneness('طهي متوسط (Medium)');
    setBeveragePairing('عصير العنب الفوار الخالي من الكحول');
    setQuantity(1);
    setSpecialNotes('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const basePrice = parsePriceNum(selectedProduct.price);
    const itemTotalPrice = basePrice * quantity;

    const cartItem: CartItem = {
      cartId: `${selectedProduct.id || selectedProduct.name}-${Date.now()}`,
      product: selectedProduct,
      quantity,
      doneness,
      beveragePairing,
      notes: specialNotes,
      itemTotalPrice
    };

    setCart([...cart, cartItem]);
    setSelectedProduct(null);
    showToast(`تم إغناء طلبك بـ "${selectedProduct.name}" بنجاح ✨`);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateCartQty = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const unitPrice = parsePriceNum(item.product.price);
        return {
          ...item,
          quantity: newQty,
          itemTotalPrice: unitPrice * newQty
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationForm.name || !reservationForm.phone || !reservationForm.date) {
      showToast('يرجى ملء جميع البيانات الأساسية لحجز الطاولة.');
      return;
    }
    setIsSubmittingReservation(true);

    const message = `✨ طلب حجز طاولة ملكية جديدة:
👤 الاسم: ${reservationForm.name}
📱 الهاتف: ${reservationForm.phone}
📅 التاريخ: ${reservationForm.date}
⏰ الوقت: ${reservationForm.time}
👥 عدد الضيوف: ${reservationForm.guests} شخص
🍷 المناسبة: ${reservationForm.occasion}
📝 ملاحظات: ${reservationForm.notes || 'لا يوجد'}`;

    await submitLead(
      tenant?.id || 1,
      reservationForm,
      'leads'
    );

    handleWhatsAppAction(
      content?.whatsappNumber || tenant?.whatsapp || '+966500000000',
      message
    );

    setIsSubmittingReservation(false);
    setIsReservationOpen(false);
    showToast('تم إرسال طلب حجز الطاولة بنجاح! سنتواصل معك لتأكيد الحجز.');
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      showToast('يرجى إدخال الاسم ورقم الجوال لتأكيد الطلب.');
      return;
    }
    setIsSubmittingOrder(true);

    const itemsListText = cart.map((item, idx) => `
${idx + 1}. ${item.product.name} (x${item.quantity})
   السعر: ${item.itemTotalPrice} ريال
   درجة الطهي: ${item.doneness}
   المشروب المرافق: ${item.beveragePairing}
   ${item.notes ? `ملاحظات: ${item.notes}` : ''}`).join('\n');

    const orderText = `👑 طلب مأكولات فاخرة جديد:
👤 العميل: ${customerName}
📱 الجوال: ${customerPhone}
نوع الخدمة: ${orderType === 'dinein' ? `داخل المطعم (طاولة ${tableNumber || 'غير محددة'})` : 'توصيل فاخر'}
${orderType === 'delivery' ? `📍 العنوان: ${address}` : ''}

🛒 تفاصيل الطلب:
${itemsListText}

💰 المجموع الكلي: ${cartSubtotal} ريال`;

    await submitLead(
      tenant?.id || 1,
      { customerName, customerPhone, orderType, cart, cartSubtotal },
      'orders'
    );

    handleWhatsAppAction(
      content?.whatsappNumber || tenant?.whatsapp || '+966500000000',
      orderText
    );

    setIsSubmittingOrder(false);
    setCart([]);
    setIsCartOpen(false);
    showToast('تم تقديم طلبك الفاخر بنجاح ✨');
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>{content?.metaTitle || content?.businessName || tenant?.name || 'المطعم الملكي الفاخر'}</title>
        <meta name="description" content={content?.metaDescription || 'تجربة تذوق استثنائية تجمع بين أرقى النكهات العالمية والفخامة العصرية'} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-[#cfb53b] selection:text-black" dir="rtl" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-20 left-1/2 z-50 bg-[#cfb53b] text-black px-6 py-3 rounded-xs shadow-2xl font-bold text-xs flex items-center gap-2 border border-amber-300"
            >
              <Sparkles size={16} />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#cfb53b]/20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')}>
              <div className="w-9 h-9 rounded-full border border-[#cfb53b] flex items-center justify-center bg-[#cfb53b]/10 text-[#cfb53b]">
                <Crown size={18} />
              </div>
              <span className="text-xl font-serif font-light tracking-widest text-[#cfb53b]">
                {content?.businessName || tenant?.name || 'LE GOURMET ROYAL'}
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8 text-xs font-light tracking-widest text-zinc-300 uppercase">
              <button onClick={() => scrollTo('hero')} className="hover:text-[#cfb53b] transition">الرئيسية</button>
              <button onClick={() => scrollTo('menu')} className="hover:text-[#cfb53b] transition">القائمة الملكية</button>
              <button onClick={() => scrollTo('about')} className="hover:text-[#cfb53b] transition">عن المطعم</button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsReservationOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 text-xs font-medium tracking-wider text-[#cfb53b] border border-[#cfb53b]/50 px-4 py-2 hover:bg-[#cfb53b] hover:text-black transition duration-300"
              >
                <Calendar size={14} />
                <span>حجز طاولة</span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 bg-zinc-900 border border-zinc-800 text-[#cfb53b] hover:border-[#cfb53b] transition cursor-pointer"
              >
                <ShoppingBag size={18} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#cfb53b] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-zinc-950 border-b border-zinc-900">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600')] bg-cover bg-center opacity-30 scale-105 animate-pulse duration-[10000ms]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 text-[#cfb53b] border border-[#cfb53b]/30 bg-[#cfb53b]/5 px-4 py-1.5 text-xs tracking-[0.2em] uppercase mb-6">
                <Crown size={14} />
                <span>{content?.slogan || 'FINE DINING & ROYAL GASTRONOMY'}</span>
              </div>

              <h1 className="text-4xl md:text-7xl font-serif font-light text-zinc-100 tracking-wide leading-tight mb-6">
                {content?.heroTitle || 'تجربة عشاء استثنائية تليق بذوقك الرفيع'}
              </h1>

              <p className="text-zinc-400 text-sm md:text-lg max-w-2xl mx-auto font-light leading-relaxed mb-10">
                {content?.heroSubtitle || 'نقدم لك تشكيلة راقية من أشهى أطباق الواجيو، البحرية الفاخرة، والحلويات المصنوعة بإتقان على أيدي أشهر الطهاة العالميّين.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsReservationOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#cfb53b] text-black font-semibold text-xs tracking-widest uppercase px-8 py-4 hover:bg-[#e2c74d] transition duration-300 shadow-xl shadow-[#cfb53b]/10 cursor-pointer"
                >
                  <Calendar size={16} />
                  <span>حجز طاولة ملكية</span>
                </button>

                <button
                  onClick={() => scrollTo('menu')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border border-zinc-700 text-zinc-300 hover:text-[#cfb53b] hover:border-[#cfb53b] font-light text-xs tracking-widest uppercase px-8 py-4 transition duration-300 cursor-pointer"
                >
                  <Utensils size={16} />
                  <span>استعراض القائمة الفاخرة</span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Menu Section */}
        <section id="menu" className="py-20 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#cfb53b] text-xs font-sans tracking-[0.25em] uppercase block mb-2">ROYAL MENU</span>
            <h2 className="text-3xl md:text-5xl font-serif font-light text-zinc-100 tracking-wide mb-4">
              القائمة الملكية المصممة بعناية
            </h2>
            <p className="text-zinc-500 text-xs md:text-sm font-light leading-relaxed">
              تذوق أطباقنا المعدة بأجود المكونات المستوردة خصيصاً لتمنحك رحلة طهي لا تُنسى.
            </p>
          </div>

          {/* Categories & Search */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 mb-12 pb-6 border-b border-zinc-900">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 text-xs tracking-widest uppercase border transition duration-300 whitespace-nowrap cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#cfb53b] text-black border-[#cfb53b] font-bold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في المكونات والأطباق..."
                className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 pr-9 pl-4 py-2.5 focus:outline-none focus:border-[#cfb53b] transition"
              />
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-zinc-950 border border-zinc-800/80 hover:border-[#cfb53b]/50 transition duration-500 flex flex-col justify-between overflow-hidden group shadow-xl"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                    />
                    {item.badge && (
                      <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-[#cfb53b] text-[10px] tracking-wider uppercase px-3 py-1 border border-[#cfb53b]/30">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="text-xl font-serif font-light text-zinc-100 group-hover:text-[#cfb53b] transition">
                        {item.name}
                      </h3>
                      <span className="text-xl font-mono font-light text-[#cfb53b] shrink-0">
                        {item.price}
                      </span>
                    </div>

                    <p className="text-zinc-400 text-xs font-light leading-relaxed line-clamp-3 mb-4">
                      {item.description}
                    </p>

                    {item.winePairing && (
                      <p className="text-[11px] text-[#cfb53b]/80 italic mb-4">
                        🍷 المشروب المقترح: {item.winePairing}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-zinc-900">
                  <span className="text-[11px] text-zinc-500 font-light">
                    ⏱️ وقت التحضير: {item.prepTime || '15 دقيقة'}
                  </span>

                  <button
                    onClick={() => openCustomization(item)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#cfb53b] hover:text-[#e2c74d] tracking-wider uppercase border-b border-[#cfb53b] pb-0.5 transition cursor-pointer font-medium"
                  >
                    <span>طلب الطبق</span>
                    <ChevronRight size={14} className="rotate-180" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-900 bg-zinc-950 py-12 text-center text-xs text-zinc-500 font-light">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-[#cfb53b]">
              <Crown size={16} />
              <span className="font-serif text-sm tracking-widest">{content?.businessName || tenant?.name || 'LE GOURMET ROYAL'}</span>
            </div>
            <p>© {new Date().getFullYear()} جميع الحقوق محفوظة • تجربة طهي ملكية استثنائية.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsReservationOpen(true)} className="hover:text-[#cfb53b] transition">حجز طاولة</button>
              <span>•</span>
              <button onClick={() => scrollTo('menu')} className="hover:text-[#cfb53b] transition">القائمة</button>
            </div>
          </div>
        </footer>

        {/* Customization Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-950 border border-[#cfb53b]/40 max-w-lg w-full p-6 md:p-8 shadow-2xl relative text-right"
              >
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 left-4 text-zinc-500 hover:text-zinc-200 transition"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-2 text-[#cfb53b] text-xs font-serif tracking-widest mb-2">
                  <Crown size={14} />
                  <span>تخصيص طبقك الملكي</span>
                </div>

                <h3 className="text-2xl font-serif text-zinc-100 font-light mb-1">{selectedProduct.name}</h3>
                <p className="text-[#cfb53b] font-mono text-xl mb-4">{selectedProduct.price}</p>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mb-6">{selectedProduct.description}</p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-zinc-300 block mb-2 font-medium">تفضيل درجة الطهي (Doneness):</label>
                    <select
                      value={doneness}
                      onChange={(e) => setDoneness(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-3 focus:outline-none focus:border-[#cfb53b]"
                    >
                      <option value="طهي خفيف (Rare)">طهي خفيف (Rare)</option>
                      <option value="متوسط الخفة (Medium Rare)">متوسط الخفة (Medium Rare)</option>
                      <option value="طهي متوسط (Medium)">طهي متوسط (Medium)</option>
                      <option value="مكتمل الطهي (Well Done)">مكتمل الطهي (Well Done)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-300 block mb-2 font-medium">المشروب الفاخر المرافق:</label>
                    <select
                      value={beveragePairing}
                      onChange={(e) => setBeveragePairing(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-3 focus:outline-none focus:border-[#cfb53b]"
                    >
                      <option value="عصير العنب الفوار الخالي من الكحول">عصير العنب الفوار الخالي من الكحول</option>
                      <option value="مياه سان بيليجرينو الفوارة">مياه سان بيليجرينو الفوارة</option>
                      <option value="موهيتو الخوخ والنعناع الملكي">موهيتو الخوخ والنعناع الملكي</option>
                      <option value="بدون مشروب">بدون مشروب مرافق</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-300 block mb-2 font-medium">ملاحظات الشيف الخاصة:</label>
                    <textarea
                      rows={2}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="أية ملاحظات خاصة بالحساسية أو طريقة التقديم..."
                      className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 p-3 focus:outline-none focus:border-[#cfb53b]"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-300 font-medium">الكمية:</span>
                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-zinc-400 hover:text-white p-1">
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold text-[#cfb53b] w-6 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="text-zinc-400 hover:text-white p-1">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-[#cfb53b] text-black font-semibold text-xs tracking-widest uppercase py-3.5 hover:bg-[#e2c74d] transition cursor-pointer"
                >
                  إضافة إلى سلة الطلبات الملكية
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Table Reservation Modal */}
        <AnimatePresence>
          {isReservationOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-zinc-950 border border-[#cfb53b]/40 max-w-md w-full p-6 md:p-8 shadow-2xl relative text-right"
              >
                <button
                  onClick={() => setIsReservationOpen(false)}
                  className="absolute top-4 left-4 text-zinc-500 hover:text-zinc-200 transition"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-2 text-[#cfb53b] text-xs font-serif tracking-widest mb-2">
                  <Calendar size={14} />
                  <span>حجز طاولة خاصة</span>
                </div>

                <h3 className="text-2xl font-serif text-zinc-100 font-light mb-6">احجز طاولتك الفاخرة</h3>

                <form onSubmit={handleReservationSubmit} className="space-y-4 font-sans text-xs">
                  <div>
                    <label className="block text-zinc-300 mb-1">الاسم الكامل:</label>
                    <input
                      type="text"
                      required
                      value={reservationForm.name}
                      onChange={(e) => setReservationForm({ ...reservationForm, name: e.target.value })}
                      placeholder="أدخل اسمك الكريم"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 focus:outline-none focus:border-[#cfb53b]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 mb-1">رقم الجوال:</label>
                    <input
                      type="tel"
                      required
                      value={reservationForm.phone}
                      onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                      placeholder="05XXXXXXXX"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 focus:outline-none focus:border-[#cfb53b]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-300 mb-1">التاريخ:</label>
                      <input
                        type="date"
                        required
                        value={reservationForm.date}
                        onChange={(e) => setReservationForm({ ...reservationForm, date: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 focus:outline-none focus:border-[#cfb53b]"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 mb-1">الوقت:</label>
                      <input
                        type="time"
                        value={reservationForm.time}
                        onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 focus:outline-none focus:border-[#cfb53b]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-300 mb-1">عدد الضيوف:</label>
                      <select
                        value={reservationForm.guests}
                        onChange={(e) => setReservationForm({ ...reservationForm, guests: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 focus:outline-none focus:border-[#cfb53b]"
                      >
                        <option value="1">شخص واحد</option>
                        <option value="2">شخصين (2)</option>
                        <option value="4">4 أشخاص</option>
                        <option value="6">6 أشخاص</option>
                        <option value="8+">مجموعة كبيرة (8+)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-300 mb-1">نوع المناسبة:</label>
                      <select
                        value={reservationForm.occasion}
                        onChange={(e) => setReservationForm({ ...reservationForm, occasion: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 focus:outline-none focus:border-[#cfb53b]"
                      >
                        <option value="عشاء عمل">عشاء عمل</option>
                        <option value="ذكرى زواج">ذكرى زواج</option>
                        <option value="حفل ميلاد">حفل ميلاد</option>
                        <option value="جلسة عائلية">جلسة عائلية</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReservation}
                    className="w-full bg-[#cfb53b] text-black font-semibold text-xs tracking-widest uppercase py-3.5 hover:bg-[#e2c74d] transition cursor-pointer mt-4"
                  >
                    {isSubmittingReservation ? 'جاري إرسال الطلب...' : 'تأكيد طلب حجز الطاولة'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cart Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 max-w-md w-full bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto"
              >
                <div>
                  <div className="flex justify-between items-center pb-6 border-b border-zinc-900">
                    <div className="flex items-center gap-2 text-[#cfb53b]">
                      <ShoppingBag size={20} />
                      <h3 className="font-serif text-lg tracking-wider">سلة الطلبات الملكية</h3>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-white">
                      <X size={20} />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500 text-xs font-light">
                      <Utensils size={36} className="mx-auto mb-3 stroke-[1]" />
                      <p>سلة طلباتك فارغة حالياً.</p>
                      <button
                        onClick={() => { setIsCartOpen(false); scrollTo('menu'); }}
                        className="mt-4 text-[#cfb53b] border-b border-[#cfb53b] pb-0.5"
                      >
                        استعرض القائمة الفاخرة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 py-6">
                      {cart.map((item) => (
                        <div key={item.cartId} className="bg-zinc-900 border border-zinc-800 p-4 text-xs font-sans">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-serif text-zinc-100 text-sm">{item.product.name}</h4>
                            <span className="text-[#cfb53b] font-mono">{item.itemTotalPrice} ريال</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mb-2">
                            الطهي: {item.doneness} • المشروب: {item.beveragePairing}
                          </p>

                          <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateCartQty(item.cartId, -1)} className="text-zinc-400 hover:text-white">
                                <Minus size={12} />
                              </button>
                              <span className="text-zinc-200 font-bold px-1">{item.quantity}</span>
                              <button onClick={() => updateCartQty(item.cartId, 1)} className="text-zinc-400 hover:text-white">
                                <Plus size={12} />
                              </button>
                            </div>

                            <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 text-[11px] hover:underline">
                              إزالة
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <form onSubmit={handleOrderSubmit} className="pt-6 border-t border-zinc-900 space-y-4 text-xs font-sans">
                    <div className="flex justify-between items-center text-sm font-serif">
                      <span className="text-zinc-400">المجموع الكلي:</span>
                      <span className="text-[#cfb53b] font-mono text-xl">{cartSubtotal} ريال</span>
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">الاسم الكريم:</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="اسم العميل"
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2.5 focus:outline-none focus:border-[#cfb53b]"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1">رقم التواصل:</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="05XXXXXXXX"
                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2.5 focus:outline-none focus:border-[#cfb53b]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full bg-[#cfb53b] text-black font-semibold uppercase tracking-widest py-3 hover:bg-[#e2c74d] transition cursor-pointer"
                    >
                      {isSubmittingOrder ? 'جاري التقديم...' : 'تأكيد وإرسال الطلب الملكي'}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
