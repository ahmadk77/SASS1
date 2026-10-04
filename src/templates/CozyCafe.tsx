import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Music, Heart, Sparkles, MapPin, Clock, Phone, BookOpen, Coffee, Play, Pause, Menu, X } from 'lucide-react';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export default function CozyCafe({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('القهوة الساخنة');
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Table booking state
  const [reserveForm, setReserveForm] = useState({
    name: '',
    phone: '',
    tableType: 'ركن القراءة الهادئ المعزول',
    guests: '1',
    time: '',
    notes: ''
  });

  const primaryColor = content?.primaryColor || '#C5A880'; // Champagne Gold
  const secondaryColor = content?.secondaryColor || '#0E0E0B'; // Obsidian Black
  const textColor = content?.textColor || '#FAF6F0'; // Cream/Off-white
  const fontFamily = content?.fontFamily || 'Amiri';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'مقهى السكينة والهدوء';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'ملاذك الهادئ لكوب قهوة مثالي وتجربة استرخاء فريدة';

  const defaultMenu = [
    { name: 'اسبريسو سنغل جين', description: 'حبوب البن الإثيوبية المحمصة بعناية فائقة، نكهة غنية كلاسيكية', price: '١٤ ريال', category: 'القهوة الساخنة', image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=800', isSpecial: true },
    { name: 'كابتشينو كلاسيك باللافندر', description: 'رغوة مخملية غنية بلمسة من زهور اللافندر العطرية المهدئة للأعصاب', price: '١٨ ريال', category: 'القهوة الساخنة', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=800' },
    { name: 'سبانيش لاتيه بارد ومقطر', description: 'مزيج بارد متوازن من الحليب المبخر والقهوة المقطرة الباردة لمدة ٢٤ ساعة', price: '٢٢ ريال', category: 'القهوة الباردة', image: 'https://images.unsplash.com/photo-1461023058943-0708e5223eeb?q=80&w=800', isSpecial: true },
    { name: 'كولد برو روز جولد', description: 'قهوة باردة مستخلصة بماء الورد العضوي وقطع الثلج المنقاة', price: '٢٤ ريال', category: 'القهوة الباردة', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800' },
    { name: 'تارت الليمون والنعناع الدافئ', description: 'عجينة البسكويت الهشة محشوة بكريمة الليمون الحامض وأوراق النعناع الطازجة', price: '٢٦ ريال', category: 'الحلويات الراقية', image: 'https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=800' },
    { name: 'كعكة الزعفران الفاخرة', description: 'مغمورة بحليب الزعفران الساخن وقطع الورد المجفف الطبيعي', price: '٣٢ ريال', category: 'الحلويات الراقية', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800', isSpecial: true },
    { name: 'كرواسون اللوز البلجيكي', description: 'مخبوز طازجاً كل صباح بحشوة اللوز اللذيذة ومغطى برقائق اللوز المقرمشة', price: '١٦ ريال', category: 'مخبوزات دافئة', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800' }
  ];

  const menuItems: any[] = Array.isArray(content?.menuItems)
    ? content.menuItems
    : (Array.isArray(content?.items) ? content.items : (tenant ? [] : defaultMenu));
  const categories = Array.from(new Set(menuItems.map((item:any) => item.category || 'أخرى'))) as string[];
  const currentCategory = categories.includes(activeCategory) ? activeCategory : (categories[0] || 'أخرى');
  
  const filteredMenu = menuItems.filter((item:any) => (item.category || 'أخرى') === currentCategory);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveForm.name || !reserveForm.phone) {
      alert('يرجى كتابة الاسم ورقم الهاتف على الأقل');
      return;
    }
    setIsReserving(true);
    try {
      const isSuccess = await submitLead(tenant?.id || 'cozy-cafe', {
        ...reserveForm,
        type: 'table_reservation',
        businessName: content?.businessName || tenant?.name || 'مقهى السكينة'
      });
      if (isSuccess) {
        setReservationSuccess('تم استلام حجزك الفاخر بنجاح! سنقوم بالتأكيد والتواصل معك فوراً لتجهيز جلستك الهادئة ومشروبك المفضل بانتظارك.');
        setReserveForm({ name: '', phone: '', tableType: 'ركن القراءة الهادئ المعزول', guests: '1', time: '', notes: '' });
      } else {
        alert('حدث خطأ أثناء إرسال الحجز، يرجى المحاولة لاحقاً.');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      
      <div 
        className="min-h-screen selection:bg-[#C5A880] selection:text-black" 
        dir="rtl" 
        style={{ 
          backgroundColor: secondaryColor, 
          fontFamily: `"${fontFamily}", "Amiri", serif`, 
          color: textColor 
        }}
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-[#0E0E0B]/95 backdrop-blur-xl border-b border-[#C5A880]/20 shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 md:px-6 md:py-4 flex justify-between items-center">
            <div className="text-xl md:text-2xl font-bold cursor-pointer tracking-widest flex items-center gap-2.5 transition-colors hover:opacity-90" onClick={() => scrollTo('hero')} style={{ color: primaryColor }}>
              {(content?.logoUrl || content?.logo) ? (
                <img src={content?.logoUrl || content?.logo} alt="Logo" className="h-8 md:h-10 object-contain" />
              ) : (
                <span className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#C5A880]/40 flex items-center justify-center text-xs md:text-sm font-sans shrink-0" style={{ color: primaryColor }}>☕</span>
              )}
              <span className="font-serif italic truncate max-w-[180px] sm:max-w-none">{content?.businessName || tenant?.name || 'مقهى السكينة'}</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex gap-8 text-sm font-sans font-medium text-slate-300">
              <button onClick={() => scrollTo('about')} className="hover:text-[#C5A880] transition-colors relative group py-1">
                قصتنا
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#C5A880] transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollTo('menu')} className="hover:text-[#C5A880] transition-colors relative group py-1">
                المنيو الفاخر
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#C5A880] transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollTo('reserve')} className="hover:text-[#C5A880] transition-colors relative group py-1">
                حجز جلسة
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#C5A880] transition-all group-hover:w-full"></span>
              </button>
              <button onClick={() => scrollTo('visit')} className="hover:text-[#C5A880] transition-colors relative group py-1">
                زيارتنا
                <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-[#C5A880] transition-all group-hover:w-full"></span>
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/20 text-[#C5A880] hover:bg-[#C5A880]/20 transition-all cursor-pointer"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-[#C5A880]/15 bg-[#0E0E0B] px-6 py-4 flex flex-col gap-3 font-sans text-sm font-medium text-slate-200"
              >
                <button 
                  onClick={() => { scrollTo('about'); setMobileMenuOpen(false); }} 
                  className="text-right py-2 hover:text-[#C5A880] border-b border-white/5 transition-colors"
                >
                  قصتنا
                </button>
                <button 
                  onClick={() => { scrollTo('menu'); setMobileMenuOpen(false); }} 
                  className="text-right py-2 hover:text-[#C5A880] border-b border-white/5 transition-colors"
                >
                  المنيو الفاخر
                </button>
                <button 
                  onClick={() => { scrollTo('reserve'); setMobileMenuOpen(false); }} 
                  className="text-right py-2 hover:text-[#C5A880] border-b border-white/5 transition-colors"
                >
                  حجز جلسة
                </button>
                <button 
                  onClick={() => { scrollTo('visit'); setMobileMenuOpen(false); }} 
                  className="text-right py-2 hover:text-[#C5A880] transition-colors"
                >
                  زيارتنا
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        {content?.showHero !== false && (
        <header id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
          {/* Subtle slow zooming background image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000" 
              alt="Cafe Interior" 
              className="w-full h-full object-cover opacity-35 scale-105 animate-[pulse_10s_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0B] via-[#0E0E0B]/70 to-transparent"></div>
          </div>
          
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C5A880]/10 border border-[#C5A880]/20 mb-6">
                <Sparkles size={14} style={{ color: primaryColor }} />
                <span className="text-xs font-sans font-bold tracking-wider uppercase text-slate-300">{content?.slogan || 'ملاذ عشاق الهدوء والروقان'}</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-serif font-black mb-6 leading-tight text-white tracking-wide">
                {content?.heroTitle || 'رواق، هدوء، ورشفة من السعادة'}
              </h1>
              <p className="text-lg md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto font-sans leading-relaxed font-light">
                {content?.heroSubtitle || 'استمتع بأكواب من القهوة المختصة المحضرة بكل شغف، في زوايا دافئة مصممة لتهدئة ذهنك وتحفيز إلهامك.'}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                  onClick={() => scrollTo('menu')}
                  className="px-10 py-4 font-sans font-bold tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95 text-black"
                  style={{ backgroundColor: primaryColor }}
                >
                  اطلب الآن وتصفح المنيو
                </button>
                <button 
                  onClick={() => scrollTo('reserve')}
                  className="px-8 py-4 font-sans font-bold tracking-widest uppercase bg-transparent border border-[#C5A880]/40 text-white hover:bg-white/5 hover:border-[#C5A880] transition-all hover:scale-105"
                >
                  احجز طاولتك الفخمة
                </button>
              </div>
            </motion.div>
          </div>

        </header>
        )}

        {/* About / Vibe Section */}
        {content?.showAbout !== false && content?.showFeatures !== false && (
        <section id="about" className="py-32 px-6 relative overflow-hidden bg-[#0A0A08]">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A880]/5 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-20 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: 40 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 1 }}
              className="flex-1 space-y-6"
            >
              <span className="text-xs font-sans font-bold tracking-widest text-[#C5A880] uppercase block">الهدوء، الديكور الخشبي، والبن الفاخر</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
                {content?.aboutTitle || 'قصتنا مع صناعة المزاج الراقي'}
              </h2>
              <p className="text-lg leading-relaxed text-slate-300 font-sans font-light">
                {content?.aboutText || 'في زوايا مقهانا، نؤمن بأن فنجان القهوة ليس مجرد جرعة كافيين يومية، بل هو طقس متكامل للاستجمام والسلام الداخلي. نختار أجود أنواع حبوب البن المحمصة بدرجات دقيقة لتمنحك رائحة ونكهة تغمر حواسك بالهدوء.'}
              </p>
              <p className="text-base text-slate-400 font-sans font-light leading-relaxed">
                لقد قمنا بتصميم المقاعد والإضاءة والركن الهادئ بعناية لتكون كالفضاء الراقي الذي يعزل صخب العالم بالخارج. سواء كنت تبحث عن مكان لإنجاز عملك، أو الاستماع إلى كتابك المفضل، أو ببساطة تبادل أطراف الحديث العذب مع من تحب.
              </p>
              
              <div className="pt-6 grid grid-cols-2 gap-6 border-t border-[#C5A880]/15">
                <div>
                  <span className="text-3xl font-serif font-black text-white">١٠٠٪</span>
                  <p className="text-xs text-slate-400 font-sans mt-1">بن مقطر ومختص ممتاز</p>
                </div>
                <div>
                  <span className="text-3xl font-serif font-black text-white">جلسات مريحة</span>
                  <p className="text-xs text-slate-400 font-sans mt-1">معزولة تماماً مع مقابس وخصوصية تامة</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }} 
              transition={{ duration: 1 }}
              className="flex-1 relative"
            >
              <div className="absolute inset-0 bg-[#C5A880]/10 rounded-[3rem] blur-xl transform rotate-6"></div>
              <img 
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=800" 
                alt="Coffee Brewing" 
                className="rounded-[3rem] shadow-2xl border-2 border-[#C5A880]/20 object-cover w-full h-[450px] relative z-10" 
              />
            </motion.div>
          </div>
        </section>
        )}

        {/* Menu Section */}
        {content?.showMenu !== false && content?.showProducts !== false && content?.showGallery !== false && (
        <section id="menu" className="py-32 px-6 bg-[#0E0E0B] border-y border-[#C5A880]/10 relative">
          <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
              <span className="text-xs font-sans font-bold tracking-widest text-[#C5A880] uppercase block">أصناف مختارة بعناية للمزاج الراقي</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">قائمة المشروبات والحلويات</h2>
              <p className="text-slate-400 font-sans font-light">نكهات نادرة، كلاسيكية ومبتكرة تحضر لك بحب وشغف.</p>
            </div>

            {/* Categorizations Tab bar */}
            <div className="flex justify-center gap-4 mb-20 border-b border-white/5 pb-4 overflow-x-auto hide-scrollbar">
              {categories.map((cat, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveCategory(cat as string)}
                  className={`px-6 py-3 font-sans font-bold text-sm transition-all whitespace-nowrap rounded-2xl ${currentCategory === cat ? 'bg-[#C5A880] text-black shadow-lg shadow-[#C5A880]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  {cat as string}
                </button>
              ))}
            </div>

            {/* Menu List */}
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              {filteredMenu.map((item: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: idx * 0.05, duration: 0.6 }}
                  key={idx} 
                  className="bg-[#12120E] p-6 rounded-[2rem] border border-white/5 hover:border-[#C5A880]/30 transition-all flex gap-5 group items-center relative overflow-hidden"
                >
                  {item.isSpecial && (
                    <div className="absolute top-0 left-0 bg-[#C5A880] text-black text-[10px] font-sans font-bold px-3 py-1 rounded-br-2xl">
                      صنع بحب ✨
                    </div>
                  )}
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'} 
                    alt={item.name} 
                    className="w-24 h-24 object-cover rounded-full shadow-md border-2 border-white/5 group-hover:scale-105 transition-transform" 
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-baseline border-b border-dashed border-white/10 pb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#C5A880] transition-colors">{item.name}</h3>
                      <span className="font-bold text-lg" style={{ color: primaryColor }}>{item.price}</span>
                    </div>
                    <p className="text-slate-400 font-sans font-light text-xs leading-relaxed max-w-[280px]">{item.description}</p>
                    
                    {/* Golden Add To Cart order button */}
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('ADD_TO_CART', { detail: item }));
                      }}
                      className="mt-2 text-[10px] font-sans font-bold py-1.5 px-3.5 bg-[#C5A880]/15 hover:bg-[#C5A880] hover:text-black text-[#C5A880] rounded-full transition-all flex items-center gap-1.5 border border-[#C5A880]/30 shadow-sm"
                    >
                      <span>طلب الآن وتوصيل ☕</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Quiet Reservation Section */}
        {content?.showServices !== false && (
        <section id="reserve" className="py-32 px-6 bg-[#0A0A08] relative">
          <div className="absolute inset-0 bg-[radial-gradient(#C5A880_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-10"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="bg-[#12120E] border border-[#C5A880]/20 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
                <span className="text-xs font-sans font-bold tracking-widest text-[#C5A880] block uppercase">احجز طاولتك أو ركنك الخاص</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">احجز جلسة هادئة ومريحة</h2>
                <p className="text-slate-400 font-sans text-xs">اختر ركن القراءة، أو طاولة العمل الفردية، أو الجلسات المغلقة الفخمة.</p>
              </div>

              {reservationSuccess ? (
                <div className="bg-[#C5A880]/10 border border-[#C5A880]/30 p-8 rounded-2xl text-center space-y-4">
                  <div className="w-16 h-16 bg-[#C5A880] text-black rounded-full flex items-center justify-center mx-auto text-xl font-bold">✨</div>
                  <h4 className="text-xl font-serif font-bold text-white">مرحباً بك في عالم الهدوء!</h4>
                  <p className="text-slate-300 font-sans text-sm leading-relaxed">{reservationSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleBookTable} className="space-y-6 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">الاسم الكريم</label>
                      <input 
                        type="text" 
                        required
                        value={reserveForm.name}
                        onChange={e => setReserveForm({...reserveForm, name: e.target.value})}
                        className="w-full bg-[#161612] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C5A880] outline-none text-sm transition-all"
                        placeholder="الاسم الثنائي"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">رقم الجوال لتأكيد الحجز</label>
                      <input 
                        type="text" 
                        required
                        value={reserveForm.phone}
                        onChange={e => setReserveForm({...reserveForm, phone: e.target.value})}
                        className="w-full bg-[#161612] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C5A880] outline-none text-sm transition-all text-right"
                        placeholder="050xxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">نوع الجلسة المطلوبة</label>
                      <select 
                        value={reserveForm.tableType}
                        onChange={e => setReserveForm({...reserveForm, tableType: e.target.value})}
                        className="w-full bg-[#161612] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C5A880] outline-none text-xs transition-all"
                      >
                        <option value="ركن القراءة الهادئ المعزول">ركن القراءة الهادئ المعزول 📚</option>
                        <option value="طاولة عمل فردية ومقابس كهربائية">طاولة عمل فردية ومقابس 💻</option>
                        <option value="طاولة لـ شخصين مع إضاءة خافتة">طاولة لشخصين كلاسيك 🕯️</option>
                        <option value="جلسة فخمة مغلقة للاجتماعات">جلسة اجتماعات مغلقة فاخرة 💼</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">عدد الزوار</label>
                      <select 
                        value={reserveForm.guests}
                        onChange={e => setReserveForm({...reserveForm, guests: e.target.value})}
                        className="w-full bg-[#161612] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C5A880] outline-none text-xs transition-all"
                      >
                        <option value="1">شخص واحد</option>
                        <option value="2">شخصين</option>
                        <option value="3-4">٣ إلى ٤ أشخاص</option>
                        <option value="5+">جلسة جماعية (أكثر من ٥)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">تاريخ ووقت الحضور</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={reserveForm.time}
                        onChange={e => setReserveForm({...reserveForm, time: e.target.value})}
                        className="w-full bg-[#161612] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C5A880] outline-none text-xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">ملاحظات إضافية (مثل: تحضير مشروب مسبق، نوع إضاءة)</label>
                    <textarea 
                      value={reserveForm.notes}
                      onChange={e => setReserveForm({...reserveForm, notes: e.target.value})}
                      className="w-full bg-[#161612] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#C5A880] outline-none text-xs transition-all resize-none h-20"
                      placeholder="أي طلبات لتجهيز جلستك الهادئة بامتياز..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isReserving}
                    className="w-full py-4 bg-[#C5A880] hover:bg-[#B3966D] text-black rounded-xl font-bold transition-all shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{isReserving ? 'جاري تجهيز الحجز...' : 'تأكيد الحجز الفاخر وإرسال للإدارة ✨'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
        )}

        {/* Visit & Contact Footer */}
        {content?.showContact !== false && content?.showFooter !== false && (
        <footer id="visit" className="bg-[#070705] border-t border-white/5 text-[#FAF6F0] py-24 px-6 text-center relative">
          <div className="max-w-5xl mx-auto space-y-16">
            
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-serif font-bold mb-4" style={{ color: primaryColor }}>أين تجدون السكينة؟</h2>
              <p className="text-slate-400 font-sans text-xs font-light">موقعنا مصمم ليسهل عليك الوصول بعيداً عن زحام المدينة.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 text-sm font-sans font-light">
              <div className="bg-[#0E0E0B] p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="w-10 h-10 bg-[#C5A880]/15 rounded-full flex items-center justify-center mx-auto text-[#C5A880]"><MapPin size={18} /></div>
                <h4 className="font-bold text-base text-white">الموقع</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{content?.address || 'شارع الضباب، حي السليمانية، الرياض، المملكة العربية السعودية'}</p>
              </div>
              <div className="bg-[#0E0E0B] p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="w-10 h-10 bg-[#C5A880]/15 rounded-full flex items-center justify-center mx-auto text-[#C5A880]"><Clock size={18} /></div>
                <h4 className="font-bold text-base text-white">ساعات العمل</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{content?.businessHours || 'يومياً: ٨ صباحاً - ١ منتصف الليل\nالجمعة: ٣ عصراً - ٢ صباحاً'}</p>
              </div>
              <div className="bg-[#0E0E0B] p-8 rounded-3xl border border-white/5 space-y-4">
                <div className="w-10 h-10 bg-[#C5A880]/15 rounded-full flex items-center justify-center mx-auto text-[#C5A880]"><Phone size={18} /></div>
                <h4 className="font-bold text-base text-white">تواصل معنا</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{content?.phoneNumber || '050 777 1234'}<br />{content?.whatsappNumber && `واتساب: ${content.whatsappNumber}`}</p>
              </div>
            </div>

            <div className="pt-12 border-t border-white/5 text-slate-500 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>&copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'مقهى السكينة'}. جميع الحقوق محفوظة.</div>
              <div className="flex gap-6">
                <a href="#about" className="hover:text-white transition-colors">عن المقهى</a>
                <a href="#menu" className="hover:text-white transition-colors">قائمة النكهات</a>
                <a href="#reserve" className="hover:text-white transition-colors">حجز الطاولات</a>
              </div>
            </div>
          </div>
        </footer>
        )}

      </div>
    </>
  );
}
