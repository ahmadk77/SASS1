import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, X, Plus, Minus, Clock, MapPin, Phone, Flame, Utensils, 
  CheckCircle2, Star, Search, Sparkles, Send, ShieldCheck, Bike, Tag, FastForward
} from 'lucide-react';
import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export interface FastFoodItem {
  id?: number | string;
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  badge?: string;
  prepTime?: string;
  calories?: string;
  spicyOptions?: string[];
  saucesOptions?: string[];
  sidesOptions?: string[];
  drinksOptions?: string[];
}

export interface CartItem {
  cartId: string;
  product: FastFoodItem;
  quantity: number;
  spiceLevel?: string;
  sauces?: string[];
  sides?: string[];
  drink?: string;
  notes?: string;
  itemTotalPrice: number;
}

export default function FastFoodDelivery({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FastFoodItem | null>(null);

  // Customization modal state
  const [spiceLevel, setSpiceLevel] = useState<string>('عادي (Original)');
  const [selectedSauces, setSelectedSauces] = useState<string[]>(['جبنة شيدر ذائبة']);
  const [selectedSides, setSelectedSides] = useState<string[]>(['بطاطس مقلية متبلة']);
  const [selectedDrink, setSelectedDrink] = useState<string>('بيبسي بارد');
  const [quantity, setQuantity] = useState<number>(1);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Customer Checkout Form inside Drawer
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dinein'>('delivery');
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const primaryColor = content?.primaryColor || '#dc2626'; // Energetic Red
  const fontFamily = content?.fontFamily || 'Tajawal';

  const defaultMenuItems: FastFoodItem[] = [
    {
      id: 1,
      name: 'دبل تشيز برجر فاخر',
      description: 'شريحتين لحم أنجوس مشوي على اللهب، جبنة شيدر مضاعفة، صوص ستيشن السري، بصل مكرمل ومخلل طازج',
      price: '38 ريال',
      category: 'برجر لحم',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400',
      badge: 'الأكثر طلباً 🍔',
      prepTime: '12 دقيقة',
      calories: '720 سعرة'
    },
    {
      id: 2,
      name: 'كريسبي تشيكن سوبريم',
      description: 'صدر دجاج مقرمش ذهبي مع جبن الشيدر الذائب، خس طازج، صوص الرانش المتبل وشرائح الخبز المحمص',
      price: '32 ريال',
      category: 'دجاج مقرمش',
      image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=400',
      badge: 'مقرمش حار 🔥',
      prepTime: '10 دقائق',
      calories: '610 سعرة'
    },
    {
      id: 3,
      name: 'وجبة الكومبو العائلية (12 قطعة)',
      description: '١٢ قطعة دجاج مقرمش ذهبي + ٢ بطاطس عائلي + لتر بيبسي + ٤ صوصات مشكلة + سلطة كولسلو كبيرة',
      price: '99 ريال',
      category: 'وجبات عائلية',
      image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?q=80&w=400',
      badge: 'توفير عائلي 👨‍👩‍👧',
      prepTime: '18 دقيقة',
      calories: '1850 سعرة'
    },
    {
      id: 4,
      name: 'بيتزا بيبروني الإيطالية',
      description: 'عجينة طازجة محشوة الأطراف بالجبن، صلصة طماطم إيطالية معتقة، جبن موزاريلا وشرائح بيبروني',
      price: '45 ريال',
      category: 'بيتزا',
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400',
      badge: 'جبن ذائب 🍕',
      prepTime: '15 دقيقة',
      calories: '890 سعرة'
    },
    {
      id: 5,
      name: 'بطاطس هالابينو وتجيز غرقانة',
      description: 'بطاطس مقلية مقرمشة مغطاة بكمية سخية من صوص الجبن الساخن، قطع الهالابينو الطازجة',
      price: '22 ريال',
      category: 'أطباق جانبية',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=400',
      prepTime: '8 دقائق',
      calories: '390 سعرة'
    },
    {
      id: 6,
      name: 'مشروب موهيتو التوت البري',
      description: 'مشروب غازي منعش مع حبات التوت البري الطازجة وورق النعناع والثلج المجروش',
      price: '18 ريال',
      category: 'مشروبات',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400',
      prepTime: '5 دقائق',
      calories: '140 سعرة'
    }
  ];

  const menuItems: FastFoodItem[] = Array.isArray(content?.menuItems)
    ? content.menuItems
    : (Array.isArray(content?.items) ? content.items : defaultMenuItems);

  const categories = ['الكل', ...Array.from(new Set(menuItems.map((i: any) => i.category || 'أخرى')))];

  const filteredMenu = menuItems.filter((item: any) => {
    const matchesCat = activeCategory === 'الكل' || (item.category || 'أخرى') === activeCategory;
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenProduct = (product: FastFoodItem) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSpecialNotes('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const numericPrice = parseFloat(selectedProduct.price.replace(/[^\d.]/g, '')) || 35;
    const itemTotal = numericPrice * quantity;

    const newCartItem: CartItem = {
      cartId: `${selectedProduct.name}-${Date.now()}`,
      product: selectedProduct,
      quantity,
      spiceLevel,
      sauces: selectedSauces,
      sides: selectedSides,
      drink: selectedDrink,
      notes: specialNotes,
      itemTotalPrice: itemTotal
    };

    setCart([...cart, newCartItem]);
    setSelectedProduct(null);
    showToast(`تم إضافة ${selectedProduct.name} للسلة 🍔`);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.itemTotalPrice, 0);

  const handleFinalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Immediately update UI
    setIsSubmittingOrder(false);
    setIsCartOpen(false);
    setCart([]);
    showToast('تم إرسال طلبك السريع بنجاح! جاري التجهيز 🚀');

    // Send lead in background
    submitLead(
      tenant?.id || 'fast-food-station',
      {
        customerName,
        customerPhone,
        details: {
          orderType,
          address: orderType === 'delivery' ? address : undefined,
          tableNumber: orderType === 'dinein' ? tableNumber : undefined,
          items: cart,
          total: cartTotalAmount
        }
      },
      'orders'
    ).catch(err => console.error(err));
  };

  return (
    <>
      <Helmet>
        <title>{content?.businessName || tenant?.name || 'برجر وبيتزا ستيشن'}</title>
        <link href={`https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;700;900&display=swap`} rel="stylesheet" />
      </Helmet>

      <div className="min-h-screen bg-[#fafafa] text-zinc-900 selection:bg-red-500 selection:text-white" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
        
        {/* Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-20 left-1/2 z-50 bg-red-600 text-white px-5 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2"
            >
              <Sparkles size={16} />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimal Navigation */}
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">
            <div className="text-lg font-black tracking-tight cursor-pointer flex items-center gap-2" onClick={() => scrollTo('hero')} style={{ color: primaryColor }}>
              {(content?.logoUrl || content?.logo) ? (
                <img src={content?.logoUrl || content?.logo} alt="Logo" className="h-8 w-8 object-cover rounded-xl border border-red-500/20" />
              ) : (
                <Flame size={20} className="text-red-600 animate-pulse" />
              )}
              <span>{content?.businessName || tenant?.name || 'Burger & Pizza Station'}</span>
            </div>

            <div className="hidden md:flex gap-6 text-xs uppercase tracking-wider font-semibold text-zinc-600">
              <button onClick={() => scrollTo('menu')} className="hover:text-red-600 transition-colors">قائمة الوجبات</button>
              <button onClick={() => scrollTo('features')} className="hover:text-red-600 transition-colors">مميزاتنا</button>
              <button onClick={() => scrollTo('location')} className="hover:text-red-600 transition-colors">الفروع والتوصيل</button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition-all font-bold flex items-center gap-2 text-xs shadow-md cursor-pointer"
              >
                <ShoppingBag size={16} />
                <span>السلة</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shadow">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Compact Clean Hero */}
        {content?.showHero !== false && (
        <header id="hero" className="py-16 md:py-20 px-6 bg-gradient-to-b from-red-50/50 to-white border-b border-zinc-200">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold tracking-wide">
              <Bike size={14} />
              <span>{content?.badgeText || 'توصيل سريع خلال 30 دقيقة أينما كنت'}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900" style={{ color: primaryColor }}>
              {content?.heroTitle || 'ألذ وجبات البرجر والبيتزا الطازجة بضغطة زر'}
            </h1>
            <p className="text-zinc-600 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
              {content?.heroSubtitle || 'نستخدم أفضل لحوم الأنجوس الطازجة ومكونات البيتزا الإيطالية الأصلية لنضمن لك وجبة متكاملة ولذيذة.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => scrollTo('menu')}
                className="px-6 py-2.5 rounded-xl font-bold text-xs tracking-wider transition-all shadow-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                تصفح قائمة الوجبات
              </button>
            </div>
          </div>
        </header>
        )}

        {/* Menu Section */}
        {content?.showGallery !== false && (
        <section id="menu" className="py-14 px-6 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-zinc-200 pb-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-red-600 font-bold">المنيو السريع</span>
              <h2 className="text-2xl md:text-3xl font-black text-zinc-900 mt-1">الأطباق والوجبات العائلية</h2>
            </div>

            {/* Categories filter */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-200/70 p-1.5 rounded-xl">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat as string)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeCategory === cat ? 'bg-red-600 text-white shadow' : 'text-zinc-700 hover:text-zinc-950'}`}
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
                className="bg-white border border-zinc-200/80 rounded-2xl p-4 flex gap-4 items-center hover:border-red-300 transition-all group shadow-sm"
              >
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover shrink-0 border border-zinc-100 group-hover:scale-105 transition-transform" />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm text-zinc-900 truncate group-hover:text-red-600 transition-colors">{item.name}</h3>
                      <span className="text-xs font-black text-red-600 shrink-0 px-2 py-0.5 rounded-md bg-red-50 border border-red-100">{item.price}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-light">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100">
                    <span className="text-[10px] text-slate-400 bg-zinc-100 px-2 py-0.5 rounded">{item.category}</span>
                    <button
                      onClick={() => handleOpenProduct(item)}
                      className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
        <footer id="location" className="bg-slate-900 text-zinc-300 py-14 px-6 mt-10">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center md:text-right">
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest font-bold text-red-400">خدمة التوصيل</h4>
              <p className="text-xs text-slate-400 leading-relaxed">نغطي كافة أحياء المدينة مع ضمان وصول الوجبة ساخنة وفي أسرع وقت.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest font-bold text-red-400">ساعات العمل</h4>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{content?.businessHours || 'يومياً: من 12:00 ظهراً وحتى 3:00 فجراً'}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-widest font-bold text-red-400">للتواصل السريع</h4>
              <p className="text-xs text-white font-mono" dir="ltr">{content?.phoneNumber || '+966 11 555 6666'}</p>
              {content?.whatsappNumber && (
                <p className="text-xs text-emerald-400 font-mono" dir="ltr">واتساب: {content?.whatsappNumber}</p>
              )}
            </div>
          </div>
          <div className="max-w-5xl mx-auto mt-10 pt-5 border-t border-slate-800 text-center text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'برجر وبيتزا ستيشن'}. جميع الحقوق محفوظة.
          </div>
        </footer>
        )}

        {/* Product Customization Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-lg w-full p-6 text-right relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 left-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 p-2 rounded-full transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-zinc-100">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-2xl object-cover border border-zinc-100" />
                  <div>
                    <h3 className="font-bold text-base text-zinc-900">{selectedProduct.name}</h3>
                    <p className="text-red-600 font-black text-sm mt-0.5">{selectedProduct.price}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <p className="text-zinc-600 leading-relaxed font-light">{selectedProduct.description}</p>

                  {/* Quantity */}
                  <div>
                    <label className="block font-bold text-zinc-700 mb-2">الكمية</label>
                    <div className="flex items-center gap-3 bg-zinc-100 p-2 rounded-xl w-fit">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="bg-white hover:bg-zinc-200 text-zinc-800 p-1.5 rounded-lg transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-sm px-3 text-zinc-900">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="bg-white hover:bg-zinc-200 text-zinc-800 p-1.5 rounded-lg transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">ملاحظات على الطلب</label>
                    <input 
                      type="text"
                      placeholder="مثال: بدون بصل، زيادة صوص..."
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer mt-4"
                  >
                    إضافة للسلة وتأكيد الاختيار
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cart & Checkout Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="bg-white border-l border-zinc-200 w-full max-w-md h-full flex flex-col p-6 shadow-2xl overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-red-600" />
                    <span>سلة الطلبات السريعة</span>
                  </h3>
                  <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-zinc-900 p-1.5 rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">
                      السلة فارغة. تصفح الوجبات وأضف ما تحب.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.cartId} className="bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-xs text-zinc-900">{item.product.name}</h4>
                          <p className="text-[11px] text-red-600 font-bold mt-0.5">الكمية: {item.quantity} | {item.itemTotalPrice} ريال</p>
                          {item.notes && <p className="text-[10px] text-zinc-500 mt-1">ملاحظة: {item.notes}</p>}
                        </div>
                        <button 
                          onClick={() => handleRemoveFromCart(item.cartId)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <form onSubmit={handleFinalCheckout} className="pt-4 border-t border-zinc-100 space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold text-zinc-900 mb-2">
                      <span>المجموع الكلي:</span>
                      <span className="text-red-600 text-base">{cartTotalAmount} ريال</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">نوع الاستلام</label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setOrderType('delivery')}
                          className={`py-2 rounded-xl font-medium border ${orderType === 'delivery' ? 'bg-red-600 text-white border-red-600 font-bold' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
                        >
                          توصيل
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('pickup')}
                          className={`py-2 rounded-xl font-medium border ${orderType === 'pickup' ? 'bg-red-600 text-white border-red-600 font-bold' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
                        >
                          استلام بالفرع
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('dinein')}
                          className={`py-2 rounded-xl font-medium border ${orderType === 'dinein' ? 'bg-red-600 text-white border-red-600 font-bold' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
                        >
                          محلي
                        </button>
                      </div>
                    </div>

                    {orderType === 'delivery' && (
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">عنوان التوصيل بالتفصيل *</label>
                        <input
                          type="text"
                          required
                          placeholder="المدينة، الحي، الشارع..."
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none focus:border-red-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">اسم العميل *</label>
                      <input
                        type="text"
                        required
                        placeholder="أدخل اسمك الكريم"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">رقم الجوال *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0501234567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none focus:border-red-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer mt-2"
                    >
                      {isSubmittingOrder ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب 🚀'}
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
