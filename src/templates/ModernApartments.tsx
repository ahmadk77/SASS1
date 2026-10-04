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

export default function ModernApartments({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('للبيع');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const primaryColor = content?.primaryColor || '#2563eb'; // Bright Blue
  const secondaryColor = content?.secondaryColor || '#ffffff'; // White
  const textColor = content?.textColor || '#0f172a'; // Slate 900
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'شقق عصرية';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'شقق سكنية عصرية تلبي تطلعاتك';

  const defaultProperties = [
    { id: 1, title: 'شقة فاخرة بإطلالة بانورامية', location: 'المركز المالي، الرياض', price: '٢,٥٠٠,٠٠٠ ريال', type: 'للبيع', beds: 3, baths: 3, area: '210', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000' },
    { id: 2, title: 'شقة مودرن بتصميم ذكي', location: 'المعذر، الرياض', price: '١٢٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', beds: 2, baths: 2, area: '140', image: 'https://images.unsplash.com/photo-1502672260266-1c1e52504427?q=80&w=1000' },
    { id: 3, title: 'بنتهاوس مع تراس واسع', location: 'حي العليا، الرياض', price: '٤,٢٠٠,٠٠٠ ريال', type: 'للبيع', beds: 4, baths: 5, area: '350', image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1000' },
    { id: 4, title: 'ستوديو أنيق مؤثث بالكامل', location: 'حي النرجس، الرياض', price: '٥٥,٠٠٠ ريال / سنوياً', type: 'للإيجار', beds: 1, baths: 1, area: '70', image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000' },
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
      
      <div className="min-h-screen selection:bg-blue-500 selection:text-white font-sans bg-slate-50" dir="rtl" style={{ fontFamily: `"${fontFamily}", sans-serif`, color: textColor }}>
        
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-black tracking-tight cursor-pointer flex items-center gap-2" onClick={() => scrollTo('hero')}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <span style={{ color: primaryColor }}>{content?.businessName || tenant?.name || 'UrbanNest'}</span>
            </div>
            <div className="hidden md:flex gap-8 font-bold text-slate-600">
              <button onClick={() => scrollTo('properties')} className="hover:text-blue-600 transition-colors">عقاراتنا</button>
              <button onClick={() => scrollTo('services')} className="hover:text-blue-600 transition-colors">خدماتنا</button>
            </div>
            <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.')} className="px-6 py-2.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: primaryColor }}>
              تواصل معنا
            </button>
          </div>
        </nav>

        {/* Hero */}
        {content?.showHero !== false && (
        <header id="hero" className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 font-bold text-sm mb-6 border border-blue-100">
                {content?.slogan || '✨ ابحث عن مساحتك المثالية'}
              </span>
              <h1 className="text-5xl md:text-7xl font-black mb-6 text-slate-900 leading-[1.15]">
                {content?.heroTitle || content?.title || (
                  <>
                    الحياة العصرية <br />
                    تبدأ من <span style={{ color: primaryColor }}>هنا.</span>
                  </>
                )}
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
                {content?.heroSubtitle || 'نقدم لك أحدث الشقق السكنية الفاخرة والمساحات العصرية التي تناسب نمط حياتك الحضري السريع والمتجدد.'}
              </p>
              
              <div className="flex gap-4">
                <button onClick={() => scrollTo('properties')} className="px-8 py-4 rounded-xl font-bold text-white shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:-translate-y-1 transition-all" style={{ backgroundColor: primaryColor }}>
                  تصفح الشقق
                </button>
                <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.')} className="px-8 py-4 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:-translate-y-1 transition-all">
                  عرض الخريطة
                </button>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-100 rounded-[3rem] rotate-3 scale-105"></div>
            <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800" alt="Modern Apartment" className="relative rounded-[3rem] shadow-2xl w-full object-cover h-[500px]" />
            
            {/* Floating Stats */}
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">+500</div>
                <div className="text-sm font-bold text-slate-500">شقة متاحة</div>
              </div>
            </div>
          </motion.div>
        </header>
        )}

        {/* Properties Section */}
        {content?.showProperties !== false && content?.showProducts !== false && content?.showMenu !== false && (
        <section id="properties" className="py-24 bg-white relative z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-right">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-4">أحدث الشقق</h2>
                <p className="text-slate-500 text-lg">مساحات مصممة لراحتك</p>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {categories.map((cat, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-8 py-3 rounded-lg font-bold text-sm transition-all ${activeCategory === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((prop: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }}
                  onClick={() => setSelectedProperty(prop)}
                  className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                >
                  <CardImageSlider
                    images={prop.images}
                    mainImage={prop.image}
                    title={prop.title}
                    price={prop.price}
                    aspectRatio="h-64"
                    className="rounded-t-3xl rounded-b-none"
                    badgeBg="bg-white/95 text-blue-600 border-slate-200"
                  />
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">{prop.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {prop.location}
                    </p>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        {prop.beds} 
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        {prop.baths}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        {prop.area} م²
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Footer */}
        {content?.showContact !== false && content?.showFooter !== false && (
        <footer className="bg-slate-900 py-16 text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-black text-white mb-6">هل تبحث عن شقة الأحلام؟</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">فريقنا مستعد لمساعدتك في إيجاد أفضل الخيارات السكنية التي تلبي احتياجاتك.</p>
            <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.')} className="px-8 py-4 rounded-xl font-bold text-white hover:-translate-y-1 transition-all" style={{ backgroundColor: primaryColor }}>
              تواصل مع فريق المبيعات
            </button>
            <div className="mt-16 pt-8 border-t border-slate-800 text-slate-500 font-medium text-sm">
              &copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'UrbanNest'}. جميع الحقوق محفوظة.
            </div>
          </div>
        </footer>
        )}

        {/* Property Modal */}
        <AnimatePresence>
          {selectedProperty && (() => {
            const gallery = (selectedProperty.images && Array.isArray(selectedProperty.images) && selectedProperty.images.length > 0)
              ? selectedProperty.images
              : [
                  selectedProperty.image,
                  'https://images.unsplash.com/photo-1502672260266-1c1e52504427?q=80&w=1000',
                  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000',
                  'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1000'
                ];
            const currentImg = gallery[activeImageIdx % gallery.length] || selectedProperty.image;

            return (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
                ></motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-3xl overflow-hidden z-[70] shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-slate-200"
                >
                  {/* Right Side (In RTL): Image Gallery Slider */}
                  <div className="w-full md:w-1/2 shrink-0 flex flex-col bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800">
                    <div className="relative h-64 md:h-80 lg:h-[380px] bg-slate-900">
                      <img src={currentImg} alt={selectedProperty.title} className="w-full h-full object-cover transition-all duration-300" />
                      
                      <button onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }} className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full backdrop-blur-md shadow-sm transition-colors z-20 md:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      {/* Image index badge */}
                      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono border border-white/20 z-10">
                        الصورة {activeImageIdx + 1} من {gallery.length}
                      </div>

                      {/* Controls */}
                      {gallery.length > 1 && (
                        <>
                          <button 
                            onClick={() => setActiveImageIdx((prev) => (prev - 1 + gallery.length) % gallery.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center text-xl backdrop-blur-md transition-all z-10"
                          >
                            ‹
                          </button>
                          <button 
                            onClick={() => setActiveImageIdx((prev) => (prev + 1) % gallery.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center text-xl backdrop-blur-md transition-all z-10"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail gallery strip */}
                    {gallery.length > 1 && (
                      <div className="flex gap-2 p-3 bg-slate-950 overflow-x-auto shrink-0 border-t border-slate-800">
                        {gallery.map((imgUrl: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                              activeImageIdx === idx ? 'border-blue-500 scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Left Side (In RTL): Details, Specs & Booking */}
                  <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2.5 py-1 rounded-md mb-2 inline-block border border-blue-100">شقة مودرن</span>
                          <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedProperty.title}</h2>
                          <p className="text-slate-500 flex items-center gap-1.5 font-medium text-sm">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {selectedProperty.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg md:text-xl font-black text-blue-600 whitespace-nowrap bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">{selectedProperty.price}</div>
                          <button onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }} className="hidden md:flex bg-slate-100 text-slate-500 hover:text-slate-800 p-2 rounded-full">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 my-5">
                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <div className="text-lg font-black text-slate-900">{selectedProperty.beds}</div>
                          <div className="text-xs font-bold text-slate-500">غرف نوم</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <div className="text-lg font-black text-slate-900">{selectedProperty.baths}</div>
                          <div className="text-xs font-bold text-slate-500">حمامات</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <div className="text-lg font-black text-slate-900">{selectedProperty.area}</div>
                          <div className="text-xs font-bold text-slate-500">متر مربع</div>
                        </div>
                      </div>

                      <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">وصف العقار والمواصفات:</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">{selectedProperty.description || 'شقة سكنية فاخرة بتشطيبات مودرن ممتازة، إطلالة بانورامية، موقف خاص، وموقع حيوي قريب من كل الخدمات.'}</p>
                      </div>
                    </div>
                    
                    <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', `مرحباً، أود الاستفسار عن تفاصيل ومعاينة العقار: (${selectedProperty.title}).`)} className="w-full py-4 rounded-xl font-bold text-white hover:opacity-90 transition-opacity shadow-lg" style={{ backgroundColor: primaryColor }}>
                      طلب حجز موعد للمعاينة والاستفسار
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
