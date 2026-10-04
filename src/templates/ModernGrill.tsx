import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, X, Plus, Minus, Calendar, Clock, Users, Phone, MapPin, 
  Flame, Utensils, CheckCircle2, Sparkles, Send, MessageCircle
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
  donenessOptions?: string[];
  saucesOptions?: string[];
  sidesOptions?: string[];
}

export interface CartItem {
  cartId: string;
  product: MenuItem;
  quantity: number;
  doneness?: string;
  sauces?: string[];
  sides?: string[];
  notes?: string;
  itemTotalPrice: number;
}

export default function ModernGrill({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  
  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  
  // Customization modal state
  const [doneness, setDoneness] = useState<string>('متوسط الطهي (Medium)');
  const [selectedSauces, setSelectedSauces] = useState<string[]>(['صلصة الباربيكيو المدخنة']);
  const [selectedSides, setSelectedSides] = useState<string[]>(['بطاطس ودجز معتقة']);
  const [quantity, setQuantity] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Table Reservation Modal
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    name: '',
    phone: '',
    guests: '2',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    notes: ''
  });
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Checkout Form inside Drawer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'dinein' | 'pickup'>('dinein');
  const [tableNumber, setTableNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const primaryColor = content?.primaryColor || '#d97706'; // Flame Amber
  const fontFamily = content?.fontFamily || 'Tajawal';

  const defaultMenuItems: MenuItem[] = [
    {
      id: 1,
      name: 'أضلاع بقري مدخنة (Ribs)',
      description: 'أضلاع بقري بلاك أنجوس مدخنة بالحطب لمدة ١٢ ساعة مع صلصة الباربيكيو الخاصة وسلطة الكولسلو',
      price: '١٤٥ ريال',
      category: 'اللحوم المدخنة',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400',
      badge: 'الأكثر طلباً 🔥',
      prepTime: '25 دقيقة',
      calories: '780 سعرة'
    },
    {
      id: 2,
      name: 'ستيك ريب آي معتق (Ribeye Steak)',
      description: '٣٥٠ جرام من ستيك الريب آي الفاخر مشوي على لهب الفحم الطبيعي مع زبدة الأعشاب والمشروم',
      price: '١٨٥ ريال',
      category: 'ستيك فاخر',
      image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=400',
      badge: 'توصية الشيف 👨‍🍳',
      prepTime: '20 دقيقة',
      calories: '650 سعرة'
    },
    {
      id: 3,
      name: 'مشاوي مشكلة فاخرة (1 كيلو)',
      description: 'مشكل كباب لحم، كباب دجاج، أوشال غنم، وأوصال شيش طاووق مع الخبز المحمص والبيواز',
      price: '٢٢٠ ريال',
      category: 'مشويات مشكلة',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400',
      badge: 'عائلي 👨‍👩‍👧',
      prepTime: '30 دقيقة',
      calories: '1100 سعرة'
    },
    {
      id: 4,
      name: 'بريسكت ساندوتش بريوش',
      description: 'شرائح البريسكت المدخن المحشوة في خبز البريوش الطري مع الجبن الذائب والبصل المكرمل',
      price: '٦٨ ريال',
      category: 'ساندوتشات',
      image: 'https://images.unsplash.com/photo-1627308595229-7830b5c91f15?q=80&w=400',
      badge: 'جديد ✨',
      prepTime: '15 دقيقة',
      calories: '590 سعرة'
    },
    {
      id: 5,
      name: 'أجنحة دجاج بافلو مدخنة',
      description: '١٠ قطع من أجنحة الدجاج الطازجة المشوية والمغطاة بصلصة البافلو مع صوص الرانش النقي',
      price: '٤٨ ريال',
      category: 'مقبلات وسلطات',
      image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?q=80&w=400',
      prepTime: '15 دقيقة',
      calories: '420 سعرة'
    },
    {
      id: 6,
      name: 'سلطة السيزر مع الدجاج',
      description: 'خس روماني طازج مع قطع صدر الدجاج المشوي على الفحم، الخبز المحمص وجبن البارميزان',
      price: '٤٢ ريال',
      category: 'مقبلات وسلطات',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400',
      prepTime: '10 دقائق',
      calories: '310 سعرة'
    },
    {
      id: 7,
      name: 'كيك الشوكولاتة الذائبة',
      description: 'كيك شوكولاتة ساخن بقلب شوكولاتة بلجيكية ذائبة يقدم مع آيس كريم الفانيليا الطبيعية',
      price: '٣٨ ريال',
      category: 'مشروبات وحلويات',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400',
      prepTime: '12 دقيقة',
      calories: '480 سعرة'
    },
    {
      id: 8,
      name: 'موهيتو التوت والنعناع',
      description: 'عصير موهيتو منعش بالتوت المشكل والنعناع الطازج مع لمسة ثلج مجروش',
      price: '٢٤ ريال',
      category: 'مشروبات وحلويات',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400',
      prepTime: '5 دقائق',
      calories: '140 سعرة'
    }
  ];

  const menuItems: MenuItem[] = Array.isArray(content?.menuItems)
    ? content.menuItems
    : (Array.isArray(content?.items) ? content.items : defaultMenuItems);

  // Extract categories dynamically
  const categories = ['الكل', ...Array.from(new Set(menuItems.map((i: any) => i.category || 'أخرى')))];

  const filteredMenu = activeCategory === 'الكل' 
    ? menuItems 
    : menuItems.filter((i: any) => (i.category || 'أخرى') === activeCategory);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenProduct = (product: MenuItem) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSpecialNotes('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const numericPrice = parseFloat(selectedProduct.price.replace(/[^\d.]/g, '')) || 50;
    const itemTotal = numericPrice * quantity;

    const newCartItem: CartItem = {
      cartId: `${selectedProduct.name}-${Date.now()}`,
      product: selectedProduct,
      quantity,
      doneness,
      sauces: selectedSauces,
      sides: selectedSides,
      notes: specialNotes,
      itemTotalPrice: itemTotal
    };

    setCart([...cart, newCartItem]);
    setSelectedProduct(null);
    showToast(`تم إضافة ${selectedProduct.name} إلى السلة 🍔`);
  };

  const handleRemoveCartItem = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Immediately update UI
    setIsSubmittingOrder(false);
    setIsCartOpen(false);
    setCart([]);
    showToast('تم إرسال طلبك بنجاح! جاري تحضير وجبتك 🚀');

    // Send lead in background
    submitLead(
      tenant?.id || 'grill-station',
      {
        customerName,
        customerPhone,
        details: {
          orderType,
          tableNumber: orderType === 'dinein' ? tableNumber : undefined,
          address: orderType === 'delivery' ? address : undefined,
          items: cart,
          total: totalCartPrice
        }
      },
      'orders'
    ).catch(err => console.error(err));
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitLead(
        tenant?.id || 'grill-station',
        {
          customerName: reservationForm.name,
          customerPhone: reservationForm.phone,
          details: reservationForm
        },
        'leads'
      );
    } catch (err) {
      console.error(err);
    }
    setReservationSuccess(true);
    setTimeout(() => {
      setReservationSuccess(false);
      setIsReservationOpen(false);
      setReservationForm({ name: '', phone: '', guests: '2', date: new Date().toISOString().split('T')[0], time: '20:00', notes: '' });
      showToast('تم تأكيد حجز الطاولة بنجاح! سنتواصل معك قريباً 🛎️');
    }, 2500);
  };

  return (
    <>
      <Helmet>
        <title>{content?.businessName || tenant?.name || 'محطة المشويات واللحوم المدخنة'}</title>
        <link href={`https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700&display=swap`} rel="stylesheet" />
      </Helmet>

      <div className="min-h-screen bg-[#111111] text-zinc-100 selection:bg-#ea580c selection:text-black" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
        
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }} 
              animate={{ opacity: 1, y: 0, x: '-50%' }} 
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-20 left-1/2 z-50 bg-#ea580c text-zinc-950 px-5 py-2.5 rounded-none shadow-xl font-bold text-xs flex items-center gap-2 border border-#ea580c"
            >
              <Sparkles size={16} />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimal Navigation */}
        <nav className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-zinc-800/80">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">
            <div className="text-lg font-bold tracking-tight cursor-pointer flex items-center gap-2.5 font-sans uppercase tracking-tighter" onClick={() => scrollTo('hero')} style={{ color: primaryColor }}>
              {(content?.logoUrl || content?.logo) ? (
                <img src={content?.logoUrl || content?.logo} alt="Logo" className="h-8 w-8 object-cover rounded-none border border-#ea580c/30" />
              ) : (
                <Flame size={20} className="text-#ea580c animate-pulse" />
              )}
              <span>{content?.businessName || tenant?.name || 'Fire & Smoke Grill'}</span>
            </div>

            <div className="hidden md:flex gap-6 text-xs uppercase tracking-wider text-zinc-400 font-medium">
              <button onClick={() => scrollTo('menu')} className="hover:text-white transition-colors">قائمة المشويات</button>
              <button onClick={() => scrollTo('about')} className="hover:text-white transition-colors">عن المحطة</button>
              <button onClick={() => scrollTo('location')} className="hover:text-white transition-colors">الموقع والأوقات</button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsReservationOpen(true)}
                className="text-xs px-3.5 py-2 rounded-none font-medium tracking-wide transition-all border border-zinc-700 hover:border-zinc-500 text-zinc-200"
              >
                حجز طاولة
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-#ea580c text-zinc-950 p-2.5 rounded-none hover:bg-#ea580c transition-all font-bold flex items-center gap-2 text-xs shadow-md cursor-pointer"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">السلة</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shadow">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Compact, Clean Hero */}
        {content?.showHero !== false && (
        <header id="hero" className="py-16 md:py-20 px-6 bg-gradient-to-b from-zinc-900/80 to-[#0f0f11] border-b border-zinc-800/60">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-#ea580c/10 border border-#ea580c/25 text-#ea580c text-[11px] font-medium tracking-wide">
              <Flame size={13} />
              <span>{content?.slogan || content?.badgeText || 'شواء أصيل على الحطب والحرارة المباشرة'}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-sans uppercase tracking-tighter tracking-tight" style={{ color: primaryColor }}>
              {content?.heroTitle || 'لحوم طازجة مدخنة ببطء ومذاق لا يُقاوم'}
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
              {content?.heroSubtitle || 'نقدم أشهى شرائح الستيك، الأضلاع المدخنة، والبرجر المشوي على الفحم الطبيعي يومياً.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => scrollTo('menu')}
                className="px-6 py-2.5 rounded-none font-bold text-xs tracking-wider transition-all shadow-md bg-#ea580c text-zinc-950 hover:bg-#ea580c cursor-pointer"
              >
                اطلب الآن
              </button>
              <button
                onClick={() => setIsReservationOpen(true)}
                className="px-6 py-2.5 rounded-none font-medium text-xs tracking-wider transition-all border border-zinc-700 hover:border-zinc-500 text-zinc-200 cursor-pointer"
              >
                احجز طاولتك
              </button>
            </div>
          </div>
        </header>
        )}

        {/* About Philosophy */}
        {content?.showFeatures !== false && (
        <section id="about" className="py-14 px-6 bg-[#141417] border-b border-zinc-800/80">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-sans uppercase tracking-tighter font-bold" style={{ color: primaryColor }}>سر النكهة المدخنة</h2>
            <div className="w-12 h-0.5 mx-auto bg-#ea580c/40"></div>
            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-light">
              نستخدم حطب البلوط الطبيعي ومدخنات أصلية لطهي اللحوم ببطء لأكثر من 12 ساعة، ليذوب اللحم في الفم وتستمتع بمذاق الشواء الأجود على الإطلاق.
            </p>
          </div>
        </section>
        )}

        {/* Menu Section */}
        {content?.showGallery !== false && (
        <section id="menu" className="py-14 px-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-zinc-800 pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-#ea580c font-semibold">القائمة وأطباق الشواء</span>
              <h2 className="text-2xl md:text-3xl font-sans uppercase tracking-tighter font-bold mt-1" style={{ color: primaryColor }}>اختر وجبتك المفضلة</h2>
            </div>

            {/* Categories filter */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-900 p-1.5 rounded-none border border-zinc-800">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat as string)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeCategory === cat ? 'bg-#ea580c text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  {cat as string}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {filteredMenu.map((item: any, idx: number) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-none p-4 flex gap-4 items-center hover:border-#ea580c/40 transition-all group shadow-sm"
              >
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-none object-cover shrink-0 border border-zinc-800 group-hover:scale-105 transition-transform" />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-sans uppercase tracking-tighter font-bold text-sm text-zinc-100 truncate group-hover:text-#ea580c transition-colors">{item.name}</h3>
                      <span className="text-xs font-black text-#ea580c shrink-0 px-2 py-0.5 rounded-md bg-#ea580c/10 border border-#ea580c/20">{item.price}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-light">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{item.category}</span>
                    <button
                      onClick={() => handleOpenProduct(item)}
                      className="bg-#ea580c/10 hover:bg-#ea580c text-#ea580c hover:text-zinc-950 border border-#ea580c/30 px-3 py-1.5 rounded-none text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>اطلب الآن</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        )}

        {/* Location & Footer */}
        {content?.showContact !== false && (
        <footer id="location" className="bg-[#131316] border-t border-zinc-800/80 py-14 px-6 mt-10">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center md:text-right">
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest font-bold text-#ea580c">العنوان</h4>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{content?.address || 'طريق الأمير محمد بن عبدالعزيز، الرياض\nالمملكة العربية السعودية'}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest font-bold text-#ea580c">ساعات العمل</h4>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{content?.businessHours || 'يومياً: من 1:00 ظهراً وحتى 2:00 بعد منتصف الليل'}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest font-bold text-#ea580c">للحجز والطلبات</h4>
              <p className="text-xs text-zinc-300 font-mono" dir="ltr">{content?.phoneNumber || '+966 11 444 5555'}</p>
              {content?.whatsappNumber && (
                <p className="text-xs text-emerald-400 font-mono" dir="ltr">واتساب: {content?.whatsappNumber}</p>
              )}
            </div>
          </div>
          <div className="max-w-5xl mx-auto mt-10 pt-5 border-t border-zinc-900 text-center text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'محطة المشويات واللحوم المدخنة'}. جميع الحقوق محفوظة.
          </div>
        </footer>
        )}

        {/* Product Customization & Ordering Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-none max-w-lg w-full p-6 text-right relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 left-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-full transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-zinc-800">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-none object-cover border border-zinc-800" />
                  <div>
                    <h3 className="font-sans uppercase tracking-tighter font-bold text-base text-white">{selectedProduct.name}</h3>
                    <p className="text-#ea580c font-black text-sm mt-0.5">{selectedProduct.price}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <p className="text-zinc-400 leading-relaxed font-light">{selectedProduct.description}</p>

                  {/* Quantity */}
                  <div>
                    <label className="block font-bold text-zinc-300 mb-2">الكمية</label>
                    <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-none border border-zinc-800 w-fit">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-1.5 rounded-lg transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-sm px-3 text-white">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-1.5 rounded-lg transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">ملاحظات خاصة على الوجبة</label>
                    <input 
                      type="text"
                      placeholder="مثال: بدون بصل، زيادة صوص..."
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-white outline-none focus:border-#ea580c"
                    />
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3.5 bg-#ea580c hover:bg-#ea580c text-zinc-950 font-bold rounded-none shadow-lg transition-all cursor-pointer mt-4"
                  >
                    إضافة إلى السلة وطلب الوجبة
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cart & Checkout Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="bg-zinc-900 border-l border-zinc-800 w-full max-w-md h-full flex flex-col p-6 shadow-2xl overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <h3 className="font-sans uppercase tracking-tighter font-bold text-base text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-#ea580c" />
                    <span>سلة الطلبات والمشويات</span>
                  </h3>
                  <button onClick={() => setIsCartOpen(false)} className="text-zinc-400 hover:text-white p-1.5 rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 text-zinc-500 text-xs">
                      السلة فارغة حالياً. تصفح قائمة المشويات وأضف ما يعجبك.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.cartId} className="bg-zinc-950 border border-zinc-800/80 p-3.5 rounded-none flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-xs text-white">{item.product.name}</h4>
                          <p className="text-[11px] text-#ea580c font-bold mt-0.5">الكمية: {item.quantity} | {item.itemTotalPrice} ريال</p>
                          {item.notes && <p className="text-[10px] text-zinc-500 mt-1">ملاحظة: {item.notes}</p>}
                        </div>
                        <button 
                          onClick={() => handleRemoveCartItem(item.cartId)}
                          className="text-rose-400 hover:bg-rose-950/40 p-2 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <form onSubmit={handleCheckoutSubmit} className="pt-4 border-t border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold text-white mb-2">
                      <span>المجموع الكلي:</span>
                      <span className="text-#ea580c text-base">{totalCartPrice} ريال</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">نوع الطلب</label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setOrderType('dinein')}
                          className={`py-2 rounded-none font-medium border ${orderType === 'dinein' ? 'bg-#ea580c text-zinc-950 border-#ea580c font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                        >
                          محلي بالطاولة
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('pickup')}
                          className={`py-2 rounded-none font-medium border ${orderType === 'pickup' ? 'bg-#ea580c text-zinc-950 border-#ea580c font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                        >
                          استلام سفري
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('delivery')}
                          className={`py-2 rounded-none font-medium border ${orderType === 'delivery' ? 'bg-#ea580c text-zinc-950 border-#ea580c font-bold' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}
                        >
                          توصيل منزلي
                        </button>
                      </div>
                    </div>

                    {orderType === 'dinein' && (
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1">رقم الطاولة *</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: طاولة رقم 4"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-white outline-none focus:border-#ea580c"
                        />
                      </div>
                    )}

                    {orderType === 'delivery' && (
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1">عنوان التوصيل بالتفصيل *</label>
                        <input
                          type="text"
                          required
                          placeholder="المدينة، الحي، الشارع..."
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-white outline-none focus:border-#ea580c"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">اسم العميل *</label>
                      <input
                        type="text"
                        required
                        placeholder="أدخل اسمك الكريم"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-white outline-none focus:border-#ea580c"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">رقم الهاتف *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0501234567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-none px-3 py-2 text-xs text-white outline-none focus:border-#ea580c"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3.5 bg-#ea580c hover:bg-#ea580c text-zinc-950 font-bold rounded-none text-xs shadow-lg transition-all cursor-pointer mt-2"
                    >
                      {isSubmittingOrder ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب 🚀'}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Table Reservation Modal */}
        <AnimatePresence>
          {isReservationOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-none max-w-md w-full p-6 text-right relative shadow-2xl"
              >
                <button onClick={() => setIsReservationOpen(false)} className="absolute top-4 left-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-full">
                  <X size={16} />
                </button>

                <h3 className="font-sans uppercase tracking-tighter font-bold text-base text-white mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-#ea580c" />
                  <span>حجز طولة في مطعم المشويات</span>
                </h3>

                {reservationSuccess ? (
                  <div className="text-center py-8 space-y-3">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
                    <h4 className="font-bold text-sm text-white">تم استلام طلب الحجز بنجاح!</h4>
                    <p className="text-zinc-400 text-xs">سيتواصل معك فريق الاستقبال لتأكيد الطاولة في الموعد.</p>
                  </div>
                ) : (
                  <form onSubmit={handleReservationSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">الاسم الكريم *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="أدخل اسمك"
                        value={reservationForm.name}
                        onChange={e => setReservationForm({ ...reservationForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-800 rounded-none bg-zinc-950 text-white outline-none focus:border-#ea580c"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">رقم الهاتف *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="0501234567"
                        value={reservationForm.phone}
                        onChange={e => setReservationForm({ ...reservationForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-800 rounded-none bg-zinc-950 text-white outline-none focus:border-#ea580c"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">عدد الأشخاص</label>
                        <select 
                          value={reservationForm.guests}
                          onChange={e => setReservationForm({ ...reservationForm, guests: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-800 rounded-none bg-zinc-950 text-white outline-none font-bold"
                        >
                          <option value="1">شخص واحد</option>
                          <option value="2">شخصين (2)</option>
                          <option value="4">عائلة (4)</option>
                          <option value="6">مجموعة (6)</option>
                          <option value="8">مجموعة كبيرة (8+)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">الوقت</label>
                        <input 
                          type="time" 
                          value={reservationForm.time}
                          onChange={e => setReservationForm({ ...reservationForm, time: e.target.value })}
                          className="w-full px-3 py-2 border border-zinc-800 rounded-none bg-zinc-950 text-white outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-300 mb-1">تاريخ الحجز</label>
                      <input 
                        type="date" 
                        value={reservationForm.date}
                        onChange={e => setReservationForm({ ...reservationForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-800 rounded-none bg-zinc-950 text-white outline-none font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-#ea580c hover:bg-#ea580c text-zinc-950 font-bold rounded-none shadow-lg transition-all cursor-pointer mt-2"
                    >
                      تأكيد حجز الطاولة
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
