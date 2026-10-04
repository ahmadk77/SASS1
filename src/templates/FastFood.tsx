import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export default function FastFood({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const primaryColor = content?.primaryColor || '#ff3b30'; // Vibrant Red
  const secondaryColor = content?.secondaryColor || '#ffcc00'; // energetic yellow
  const textColor = content?.textColor || '#1c1c1e';
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'وجبات سريعة';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'أسرع ديليفري وألذ طعم';

  const defaultMenuItems = [
    { name: 'مونستر برجر دبل', description: 'شريحتين لحم أنجوس، جبنة شيدر، صوص سري، خس، مخلل', price: '٤٥ ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600' },
    { name: 'فاير كرسبي تشيكن', description: 'صدر دجاج مقرمش حار جداً، صوص الرانش، هالبينو، وجبن', price: '٣٢ ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=600' },
    { name: 'كلاسيك برجر', description: 'لحم بقري صافي مع الجبن والطماطم والخس الكرسبي', price: '٢٥ ريال', category: 'برجر', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=600' },
    { name: 'فرايز بالجبنة واللحم', description: 'بطاطس ذهبية مغطاة بصوص الجبن الذائب وقطع اللحم المقدد', price: '٢٢ ريال', category: 'مقبلات', image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=600' },
    { name: 'أجنحة البافلو', description: '٨ قطع من أجنحة الدجاج الحارة مع صوص الرانش', price: '٢٨ ريال', category: 'مقبلات', image: 'https://images.unsplash.com/photo-1524114664604-cd8133cd67ad?auto=format&fit=crop&q=80&w=600' },
    { name: 'ميلك شيك شوكولاتة', description: 'آيس كريم الشوكولاتة الغني المخفوق مع الحليب الطازج', price: '١٨ ريال', category: 'مشروبات', image: 'https://images.unsplash.com/photo-1572490122747-3968b75bf699?auto=format&fit=crop&q=80&w=600' }
  ];

  const menuItems: any[] = Array.isArray(content?.menuItems)
    ? content.menuItems
    : (Array.isArray(content?.items) ? content.items : (tenant ? [] : defaultMenuItems));
  const categories = ['الكل', ...Array.from(new Set(menuItems.map((item:any) => item.category || 'أخرى')))];
  const filteredMenu = activeCategory === 'الكل' ? menuItems : menuItems.filter((item:any) => (item.category || 'أخرى') === activeCategory);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const parsePrice = (priceStr: string | number) => {
    const num = parseInt(priceStr.toString().replace(/[^\d]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const addToCart = (item: any) => {
    setCart([...cart, item]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((total, item) => total + parsePrice(item.price), 0);

  const handleCheckout = () => {
    window.dispatchEvent(new CustomEvent('OPEN_ORDER_MODAL', { 
      detail: { 
        type: 'food_order', 
        totalPrice: `${cartTotal} ريال`, 
        items: cart 
      } 
    }));
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <div className="min-h-screen bg-yellow-50 overflow-hidden relative selection:bg-red-500 selection:text-white" dir="rtl" style={{ fontFamily: `"${fontFamily}", sans-serif`, color: textColor }}>
        
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-40 pointer-events-none z-0" style={{ backgroundColor: secondaryColor }}></div>
        <div className="absolute bottom-[20%] left-[-10%] w-[30vw] h-[30vw] rounded-full blur-[80px] opacity-30 pointer-events-none z-0" style={{ backgroundColor: primaryColor }}></div>

        {/* Header */}
        <header className="fixed top-0 w-full z-50 pt-4 px-4 md:px-6">
          <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/50 px-4 md:px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')}>
              {(content?.logoUrl || content?.logo) ? (
                <img src={content?.logoUrl || content?.logo} alt="Logo" className="h-10 md:h-12 object-contain transform -rotate-6" />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg transform -rotate-6" style={{ backgroundColor: primaryColor }}>
                  B
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-black italic tracking-tight" style={{ color: primaryColor }}>
                {content?.businessName || tenant?.name || 'برجر ستيشن'}
              </h1>
            </div>
            <ul className="hidden lg:flex gap-8 font-bold text-slate-700">
              <li onClick={() => scrollTo('hero')} className="hover:text-[#ff3b30] cursor-pointer transition">الرئيسية</li>
              <li onClick={() => scrollTo('menu')} className="hover:text-[#ff3b30] cursor-pointer transition">المنيو</li>
              <li onClick={() => scrollTo('offers')} className="hover:text-[#ff3b30] cursor-pointer transition">العروض</li>
              <li onClick={() => scrollTo('footer')} className="hover:text-[#ff3b30] cursor-pointer transition">فروعنا</li>
            </ul>
            <div className="flex gap-3 items-center">
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" /></svg>
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md">{cart.length}</span>}
              </button>
              <button 
                onClick={() => scrollTo('menu')}
                className="hidden sm:block px-6 py-2.5 rounded-full font-black text-white shadow-[0_5px_15px_rgba(255,59,48,0.3)] transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                اطلب الآن
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        {content?.showHero !== false && (
        <section id="hero" className="relative pt-32 pb-24 px-6 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
              <div className="inline-block px-4 py-2 rounded-full font-bold text-sm mb-6 shadow-sm" style={{ backgroundColor: secondaryColor, color: '#b27300' }}>
                {content?.slogan || '🔥 الأسرع ديليفري في المدينة'}
              </div>
              <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight text-slate-900">
                {content?.heroTitle || content?.title || (
                  <>طعم <span style={{ color: primaryColor }} className="italic drop-shadow-sm">يفجر</span><br/> حواسك!</>
                )}
              </h2>
              <p className="text-xl sm:text-2xl mb-10 font-bold text-slate-600 max-w-lg leading-relaxed">
                {content?.heroSubtitle || 'برجر محضر بشغف من لحم الأنجوس الطازج يومياً. جربه الآن واستمتع بالقرمشة.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => scrollTo('menu')}
                  className="px-8 sm:px-10 py-4 sm:py-5 rounded-full font-black text-white text-lg sm:text-xl shadow-[0_15px_30px_rgba(255,59,48,0.3)] transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(255,59,48,0.4)] flex items-center justify-center gap-3"
                  style={{ backgroundColor: primaryColor }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  تصفح المنيو واطلب
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative hidden sm:block"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.2 }}
            >
              {/* Floating Elements */}
              <motion.img animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} src="https://cdn-icons-png.flaticon.com/512/1155/1155255.png" className="absolute top-10 right-10 w-16 h-16 sm:w-20 sm:h-20 drop-shadow-2xl z-20" alt="Fries" />
              <motion.img animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} src="https://cdn-icons-png.flaticon.com/512/324/324119.png" className="absolute bottom-10 left-10 w-20 h-20 sm:w-24 sm:h-24 drop-shadow-2xl z-20" alt="Drink" />
              
              <div className="absolute inset-0 bg-gradient-to-tr from-[#ffb100] to-[#ff4b2b] rounded-full blur-3xl opacity-40 transform scale-90 animate-pulse z-0"></div>
              <img 
                src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop" 
                alt="Delicious Burger" 
                className="relative z-10 w-full h-auto rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] transform -rotate-3 hover:rotate-0 transition-transform duration-700 border-[8px] sm:border-[12px] border-white object-cover aspect-square"
              />
            </motion.div>
          </div>
        </section>
        )}

        {/* Menu Grid */}
        {content?.showMenu !== false && content?.showProducts !== false && content?.showGallery !== false && (
        <section id="menu" className="py-24 sm:py-32 px-4 sm:px-6 bg-white relative z-20 shadow-[0_-20px_60px_rgba(0,0,0,0.05)] rounded-t-[3rem] sm:rounded-t-[4rem]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 sm:mb-16 gap-6 text-center md:text-right">
              <div>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-slate-900">قائمة <span style={{ color: primaryColor }} className="italic">الدمار</span></h3>
                <p className="text-xl sm:text-2xl text-slate-500 font-bold">وجبات تشبع جوعك وتعدل مزاجك</p>
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex overflow-x-auto pb-4 mb-10 gap-3 justify-start md:justify-center hide-scrollbar">
              {categories.map((cat, idx) => (
                <button 
                  key={`ff-cat-${cat}-${idx}`}
                  onClick={() => setActiveCategory(cat as string)}
                  className={`shrink-0 px-6 sm:px-8 py-3 rounded-full font-bold text-base sm:text-lg transition-all duration-300 shadow-sm ${activeCategory === cat ? 'text-white scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  style={activeCategory === cat ? { backgroundColor: primaryColor } : {}}
                >
                  {cat as string}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {filteredMenu.map((item: any, idx: number) => (
                <motion.div 
                  key={`ff-item-${item.id || item.name || idx}`} 
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
                  className="bg-yellow-50/50 rounded-[2rem] sm:rounded-[2.5rem] border-4 border-transparent hover:border-[#ffb100] hover:bg-yellow-50 transition-all duration-300 transform hover:-translate-y-2 group overflow-hidden shadow-md hover:shadow-2xl flex flex-col"
                >
                  <div className="w-full aspect-square overflow-hidden relative p-2 sm:p-3 flex items-center justify-center">
                    <img src={item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600'} alt={item.name} className="w-full h-full object-cover rounded-[1.5rem] sm:rounded-[2rem] transform group-hover:scale-105 transition-transform duration-500 shadow-sm" />
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full font-black text-lg sm:text-xl shadow-lg" style={{ color: primaryColor }}>
                      {item.price}
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col flex-1">
                    <h4 className="text-2xl sm:text-3xl font-black mb-3 text-slate-800 group-hover:text-[#ff3b30] transition-colors leading-tight">{item.name}</h4>
                    <p className="text-slate-600 mb-6 font-medium text-base sm:text-lg leading-relaxed flex-1">{item.description}</p>
                    <button 
                      onClick={() => addToCart(item)}
                      className="w-full py-4 rounded-2xl font-black text-lg transition-all bg-white text-slate-800 border-2 border-slate-200 hover:border-transparent group-hover:bg-[#ff3b30] group-hover:text-white shadow-sm group-hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      إضافة للطلب
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* CTA Banner */}
        {content?.showStats !== false && (
        <section id="offers" className="py-24 px-6 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">جيعان؟ <br/>لا تفكر مرتين!</h2>
            <button onClick={() => scrollTo('menu')} className="px-12 py-5 rounded-full font-black text-xl sm:text-2xl text-slate-900 bg-white shadow-2xl hover:scale-105 transition-transform active:scale-95">
              اطلب الآن ويوصلك حار
            </button>
          </div>
        </section>
        )}

        {/* Footer */}
        {content?.showContact !== false && content?.showFooter !== false && (
        <footer id="footer" className="py-16 bg-slate-900 text-center text-slate-400 font-medium px-6">
          <p className="text-3xl font-black text-white italic mb-6 flex items-center justify-center gap-3">
            {(content?.logoUrl || content?.logo) && (
              <img src={content?.logoUrl || content?.logo} alt="Logo" className="h-10 object-contain transform -rotate-6" />
            )}
            {content?.businessName || tenant?.name || 'برجر ستيشن'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-8 text-slate-300">
            <p>📍 {content?.address || 'فروعنا: الرياض، جدة، الدمام'}</p>
            {content?.phoneNumber && <p dir="ltr">📞 {content?.phoneNumber}</p>}
            {!content?.phoneNumber && <p dir="ltr">📞 للطلبات: 920000000</p>}
          </div>
          <p className="text-sm opacity-60">&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لـ {content?.businessName || tenant?.name || 'برجر ستيشن'}.</p>
        </footer>
        )}

        {/* Cart Drawer */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"></motion.div>
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 h-full w-full sm:w-96 bg-white z-[70] shadow-2xl border-r border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-2xl font-black text-slate-800">سلة الطلبات <span role="img" aria-label="cart">🛒</span></h3>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white hover:bg-slate-200 rounded-full transition-colors shadow-sm text-slate-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      <p className="text-xl font-bold">السلة فاضية!</p>
                      <p className="text-sm mt-2">وش تنتظر؟ المنيو يناديك 🍔</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div key={`ff-cart-${item.cartId || item.id || idx}`} className="flex gap-4 items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-tight mb-1">{item.name}</h4>
                            <p className="font-black text-sm" style={{ color: primaryColor }}>{item.price}</p>
                          </div>
                          <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold text-slate-500">الإجمالي:</span>
                    <span className="text-3xl font-black text-slate-800">{cartTotal} ريال</span>
                  </div>
                  <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full py-4 text-center font-black text-xl text-white rounded-2xl shadow-[0_10px_20px_rgba(255,59,48,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-1 active:translate-y-0" style={{ backgroundColor: primaryColor }}>
                    إتمام الطلب 
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
