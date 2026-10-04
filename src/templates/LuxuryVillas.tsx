import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { CardImageSlider } from '../components/CardImageSlider';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export default function LuxuryVillas({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('للبيع');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const primaryColor = content?.primaryColor || '#d4af37'; // Gold
  const secondaryColor = content?.secondaryColor || '#111111'; // Dark
  const textColor = content?.textColor || '#f8f8f8';
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'عقارات فاخرة';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'نخبة العقارات والقصور الفاخرة';

  const defaultProperties = [
    { id: 1, title: 'فيلا ملكية بتصميم كلاسيكي', location: 'حي الملقا، الرياض', price: '١٥,٠٠٠,٠٠٠ ريال', type: 'للبيع', beds: 6, baths: 8, area: '1200', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000' },
    { id: 2, title: 'قصر بانورامي مع مسبح خاص', location: 'حي حطين، الرياض', price: '٢٥,٥٠٠,٠٠٠ ريال', type: 'للبيع', beds: 8, baths: 10, area: '2500', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000' },
    { id: 3, title: 'فيلا مودرن ذكية', location: 'الياسمين، الرياض', price: '٣٥٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', beds: 5, baths: 6, area: '800', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000' },
    { id: 4, title: 'قصر عصري بإطلالة', location: 'الدرعية، الرياض', price: '٤٥,٠٠٠,٠٠٠ ريال', type: 'للبيع', beds: 10, baths: 12, area: '3500', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000' },
  ];

  const properties = Array.isArray(content?.properties)
    ? content.properties
    : (Array.isArray(content?.items) ? content.items : (tenant ? [] : defaultProperties));
  const categories = ['للبيع', 'للإيجار'];
  const filteredProperties = properties.filter((p:any) => p.type === activeCategory);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      
      <div className="min-h-screen selection:bg-[#d4af37] selection:text-black font-serif" dir="rtl" style={{ backgroundColor: secondaryColor, fontFamily: `"${fontFamily}", serif`, color: textColor }}>
        
        {/* Navigation */}
        <nav className="sticky top-0 z-40 transition-all duration-500 bg-[#111111]/90 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div className="text-2xl font-bold tracking-widest cursor-pointer" onClick={() => scrollTo('hero')} style={{ color: primaryColor }}>
              {content?.businessName || tenant?.name || 'VILLA BEYOND'}
            </div>
            <div className="hidden md:flex gap-10 text-sm tracking-widest uppercase font-medium text-gray-300">
              <button onClick={() => scrollTo('about')} className="hover:text-white transition-colors">عن الشركة</button>
              <button onClick={() => scrollTo('properties')} className="hover:text-white transition-colors">عقاراتنا الحصرية</button>
              <button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors">تواصل معنا</button>
            </div>
            <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.')} className="hidden md:block px-6 py-2 border rounded-sm text-sm tracking-widest transition-all hover:bg-white hover:text-black" style={{ borderColor: 'white', color: 'white' }}>
              حدد موعداً
            </button>
          </div>
        </nav>

        {/* Hero */}
        {content?.showHero !== false && (
        <header id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000" alt="Luxury Villa" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </motion.div>
          <div className="relative z-10 text-center max-w-5xl px-6">
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
              className="text-sm md:text-base font-bold tracking-[0.5em] uppercase mb-6" style={{ color: primaryColor }}
            >
              {content?.slogan || 'الاستثناء في عالم العقار'}
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
              className="text-5xl md:text-8xl font-black mb-8 leading-[1.2] text-white"
            >
              {content?.heroTitle || 'حيث الفخامة تلتقي بنمط الحياة'}
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="w-24 h-1 mx-auto mb-8" style={{ backgroundColor: primaryColor }}></motion.div>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }}
              className="text-xl text-gray-300 font-light tracking-wide mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              {content?.heroSubtitle || 'نقدم لكم مجموعة حصرية من القصور والفلل الفاخرة التي تعيد تعريف معنى الرقي والتميز.'}
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9 }}
              onClick={() => scrollTo('properties')}
              className="px-12 py-5 bg-white text-black text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
            >
              استعرض المحفظة العقارية
            </motion.button>
          </div>
        </header>
        )}

        {/* Properties Grid */}
        {content?.showProperties !== false && content?.showProducts !== false && content?.showMenu !== false && (
        <section id="properties" className="py-32 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">العقارات الحصرية</h2>
                <p className="text-gray-400 text-lg">انتقاء دقيق لأرقى العقارات في المنطقة</p>
              </div>
              
              <div className="flex gap-4">
                {categories.map((cat, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-8 py-3 text-sm font-bold tracking-wider uppercase border transition-all ${activeCategory === cat ? 'bg-white text-black border-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {filteredProperties.map((prop: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className="group cursor-pointer block"
                  onClick={() => setSelectedProperty(prop)}
                >
                  <div className="mb-6">
                    <CardImageSlider
                      images={prop.images}
                      mainImage={prop.image}
                      title={prop.title}
                      price={prop.price}
                      aspectRatio="aspect-[4/3]"
                      badgeBg="bg-black/80 text-white border-white/20"
                    />
                  </div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#d4af37] transition-colors">{prop.title}</h3>
                      <p className="text-gray-400 flex items-center gap-2 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {prop.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-800 pt-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        {prop.beds} غرف
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        {prop.baths} حمامات
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        {prop.area} م²
                      </div>
                    </div>
                    
                    <span className="text-[#d4af37] font-bold text-xs flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                      <span>عرض التفاصيل</span>
                      <span>&larr;</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Contact Footer */}
        {content?.showContact !== false && content?.showFooter !== false && (
        <footer id="contact" className="bg-[#0a0a0a] py-24 border-t border-gray-900 text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-black text-white mb-6">نحن هنا لخدمتك</h2>
            <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">تواصل مع خبرائنا العقاريين لمساعدتك في العثور على عقار أحلامك وتجربة خدماتنا الاستثنائية.</p>
            <div className="flex justify-center gap-6">
              <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.')} className="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                اتصل بنا
              </button>
              <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.')} className="px-10 py-4 border border-white text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                راسلنا 
              </button>
            </div>
            <div className="mt-24 text-gray-600 text-sm tracking-widest">
              &copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'VILLA BEYOND'}. جميع الحقوق محفوظة.
            </div>
          </div>
        </footer>
        )}

        {/* Property Details Modal */}
        <AnimatePresence>
          {selectedProperty && (() => {
            const gallery = (selectedProperty.images && Array.isArray(selectedProperty.images) && selectedProperty.images.length > 0)
              ? selectedProperty.images
              : [
                  selectedProperty.image,
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
                  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000',
                  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1000'
                ];
            const currentImg = gallery[activeImageIdx % gallery.length] || selectedProperty.image;

            return (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                ></motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-[#111] text-white rounded-3xl overflow-hidden z-[70] shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-gray-800"
                >
                  {/* Right Side (In RTL): Image Gallery Slider */}
                  <div className="w-full md:w-1/2 shrink-0 flex flex-col bg-black border-b md:border-b-0 md:border-l border-gray-800">
                    <div className="relative h-64 md:h-80 lg:h-[380px] bg-black">
                      <img src={currentImg} alt={selectedProperty.title} className="w-full h-full object-cover" />
                      <button onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }} className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-2.5 rounded-full backdrop-blur-md transition-colors z-20 md:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-1 rounded-full border border-white/20">
                        الصورة {activeImageIdx + 1} من {gallery.length}
                      </div>
                      {gallery.length > 1 && (
                        <>
                          <button onClick={() => setActiveImageIdx((prev) => (prev - 1 + gallery.length) % gallery.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-9 h-9 rounded-full flex items-center justify-center text-lg z-10">‹</button>
                          <button onClick={() => setActiveImageIdx((prev) => (prev + 1) % gallery.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white w-9 h-9 rounded-full flex items-center justify-center text-lg z-10">›</button>
                        </>
                      )}
                    </div>
                    {/* Thumbnails */}
                    {gallery.length > 1 && (
                      <div className="flex gap-2 p-3 bg-black/80 overflow-x-auto shrink-0 border-t border-gray-900">
                        {gallery.map((imgUrl: string, idx: number) => (
                          <button key={idx} onClick={() => setActiveImageIdx(idx)} className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${activeImageIdx === idx ? 'border-[#d4af37] scale-105' : 'border-gray-800 opacity-60 hover:opacity-100'}`}>
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Left Side (In RTL): Details & Text Information */}
                  <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest block mb-1">عقار فاخر</span>
                          <h2 className="text-2xl font-bold text-white mb-2">{selectedProperty.title}</h2>
                          <p className="text-gray-400 text-sm flex items-center gap-1.5">
                            📍 {selectedProperty.location}
                          </p>
                        </div>
                        <button onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }} className="hidden md:flex bg-gray-800 text-gray-300 hover:text-white p-2 rounded-full">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <div className="text-2xl font-black text-[#d4af37] mb-6">{selectedProperty.price}</div>

                      {/* Real Estate Specs */}
                      <div className="grid grid-cols-3 gap-3 mb-6 bg-black/40 p-3 rounded-xl border border-gray-800 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{selectedProperty.beds}</div>
                          <div className="text-[11px] text-gray-400">غرف نوم</div>
                        </div>
                        <div className="border-x border-gray-800">
                          <div className="text-lg font-bold text-white">{selectedProperty.baths}</div>
                          <div className="text-[11px] text-gray-400">حمامات</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">{selectedProperty.area} م²</div>
                          <div className="text-[11px] text-gray-400">المساحة</div>
                        </div>
                      </div>

                      <div className="mb-6 p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <h4 className="text-xs font-bold text-[#d4af37] mb-1">المواصفات والتفاصيل الكاملة:</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{selectedProperty.description || 'فيلا فاخرة بتصميم معماري استثنائي، تتضمن مجالس واسعة، حديقة خاصة، ومسبح مغلق بأعلى المعايير.'}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', `مرحباً، أود الاستفسار عن المعاينة وحجز العقار: (${selectedProperty.title}).`)} 
                      className="w-full py-4 bg-[#d4af37] text-black font-bold rounded-xl hover:bg-[#c29f2f] transition-colors"
                    >
                      طلب معاينة وحجز العقار
                    </button>
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

      </div>
    </>
  );
}
