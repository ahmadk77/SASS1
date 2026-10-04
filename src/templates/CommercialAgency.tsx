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

export default function CommercialAgency({ tenant, content }: TemplateProps) {
  const [activeCategory, setActiveCategory] = useState('للبيع');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const primaryColor = content?.primaryColor || '#0f172a'; // Deep Navy / Corporate Blue
  const secondaryColor = content?.secondaryColor || '#f8fafc'; // Light gray
  const textColor = content?.textColor || '#334155'; 
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'الوكالة العقارية التجارية';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'شريكك الموثوق في الاستثمارات العقارية';

  const defaultProperties = [
    { id: 1, title: 'مبنى تجاري كامل', location: 'طريق الملك فهد، الرياض', price: '٤٥,٠٠٠,٠٠٠ ريال', type: 'للبيع', category: 'تجاري', area: '4500', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800' },
    { id: 2, title: 'مكتب مساحة مفتوحة', location: 'العليا، الرياض', price: '٢٥٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', category: 'مكاتب', area: '300', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800' },
    { id: 3, title: 'معرض تجاري واجهة شارعين', location: 'طريق التخصصي، الرياض', price: '٣,٢٠٠,٠٠٠ ريال', type: 'للبيع', category: 'معارض', area: '550', image: 'https://images.unsplash.com/photo-1582657233895-0f37a3f150c0?q=80&w=800' },
    { id: 4, title: 'مساحة عمل مشتركة مجهزة', location: 'المركز المالي، الرياض', price: '٤٠٠,٠٠٠ ريال / سنوياً', type: 'للإيجار', category: 'مكاتب', area: '600', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=800' },
    { id: 5, title: 'أرض تجارية خام', location: 'شمال الرياض', price: '١٢,٠٠٠,٠٠٠ ريال', type: 'للبيع', category: 'أراضي', area: '10000', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800' },
  ];

  const properties = Array.isArray(content?.properties)
    ? content.properties
    : (Array.isArray(content?.items) ? content.items : (tenant ? [] : defaultProperties));
  
  const filteredProperties = properties.filter((p:any) => {
    const matchesTab = p.type === activeCategory;
    const matchesSearch = p.title.includes(searchQuery) || p.location.includes(searchQuery) || p.category.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      
      <div className="min-h-screen font-sans selection:bg-slate-800 selection:text-white" dir="rtl" style={{ backgroundColor: secondaryColor, fontFamily: `"${fontFamily}", sans-serif`, color: textColor }}>
        
        {/* Topbar */}
        <div className="bg-slate-900 text-slate-300 text-sm py-2 px-6 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex gap-6">
              <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> +966 92 000 0000</span>
              <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> info@corporate-estate.com</span>
            </div>
            <div className="flex gap-4 font-medium">
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-white">نبذة عنا</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-white">وظائف</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-white">المركز الإعلامي</a>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="text-2xl font-black tracking-tight flex items-center gap-3" style={{ color: primaryColor }}>
              <div className="w-10 h-10 bg-slate-900 text-white rounded flex items-center justify-center font-serif text-xl">C</div>
              {content?.businessName || tenant?.name || 'كوربوريت للعقارات'}
            </div>
            <div className="hidden md:flex gap-8 font-bold text-slate-700">
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-slate-900">الرئيسية</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-slate-900">العقارات التجارية</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-slate-900">إدارة الأملاك</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-slate-900">الاستشارات</a>
            </div>
            <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.')} className="bg-slate-900 text-white px-6 py-2.5 rounded font-bold hover:bg-slate-800 transition-colors">
              أضف عقارك
            </button>
          </div>
        </nav>

        {/* Hero with Search */}
        {content?.showHero !== false && (
        <header className="relative bg-slate-900 pt-20 pb-32 px-6">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000" alt="Corporate" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
            >
              {content?.heroTitle || content?.title || 'الوجهة الأولى للاستثمارات العقارية التجارية'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-xl text-slate-300 mb-12"
            >
              {content?.heroSubtitle || content?.subtitle || content?.slogan || 'نقدم حلولاً عقارية متكاملة للشركات والمستثمرين لضمان أعلى عوائد ممكنة.'}
            </motion.p>
            
            {/* Search Box */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white p-4 rounded-xl shadow-2xl"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setActiveCategory('للبيع')} className={`flex-1 px-6 py-3 font-bold rounded-md transition-colors ${activeCategory === 'للبيع' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>للبيع</button>
                  <button onClick={() => setActiveCategory('للإيجار')} className={`flex-1 px-6 py-3 font-bold rounded-md transition-colors ${activeCategory === 'للإيجار' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>للإيجار</button>
                </div>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="ابحث عن مكاتب، معارض، أراضي..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-medium"
                  />
                </div>
                <button onClick={() => alert('تم تطبيق فلاتر البحث')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                  بحث
                </button>
              </div>
            </motion.div>
          </div>
        </header>
        )}

        {/* Listings */}
        {content?.showProperties !== false && content?.showProducts !== false && content?.showMenu !== false && (
        <section className="py-20 px-6 max-w-7xl mx-auto -mt-16 relative z-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.length > 0 ? filteredProperties.map((prop: any, idx: number) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => setSelectedProperty(prop)}
              >
                <CardImageSlider
                  images={prop.images}
                  mainImage={prop.image}
                  title={prop.title}
                  price={prop.price}
                  category={prop.category}
                  aspectRatio="h-56"
                  className="rounded-t-xl rounded-b-none"
                  badgeBg="bg-slate-900 text-white border-slate-700"
                />
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-2 leading-tight">{prop.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {prop.location}
                  </p>
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-slate-600 font-medium text-sm">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      {prop.area} م²
                    </span>
                    <span className="text-blue-600 font-bold">التفاصيل &larr;</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-20 bg-white rounded-xl border border-slate-200">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">لا توجد نتائج مطابقة لبحثك</h3>
                <p className="text-slate-500">جرب البحث بكلمات أخرى أو تغيير نوع العقار</p>
              </div>
            )}
          </div>
        </section>
        )}

        {/* Footer */}
        {content?.showContact !== false && content?.showFooter !== false && (
        <footer className="bg-slate-950 text-slate-400 py-16">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-white text-slate-900 rounded flex items-center justify-center font-serif text-lg">C</div>
                كوربوريت العقارية
              </div>
              <p className="mb-6 max-w-sm leading-relaxed">الشركة الرائدة في مجال تقديم الاستشارات وخدمات الوساطة للعقارات التجارية والمكاتب للشركات والمؤسسات.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-white transition-colors">عن الشركة</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-white transition-colors">خدماتنا</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.'); }} className="hover:text-white transition-colors">اتصل بنا</a></li>
              </ul>
            </div>
          </div>
        </footer>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedProperty && (() => {
            const gallery = (selectedProperty.images && Array.isArray(selectedProperty.images) && selectedProperty.images.length > 0)
              ? selectedProperty.images
              : [
                  selectedProperty.image,
                  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000',
                  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000',
                  'https://images.unsplash.com/photo-1582657233895-0f37a3f150c0?q=80&w=1000'
                ];
            const currentImg = gallery[activeImageIdx % gallery.length] || selectedProperty.image;

            return (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }}
                  className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60]"
                ></motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-2xl shadow-2xl z-[70] flex flex-col md:flex-row overflow-hidden max-h-[90vh] border border-slate-200"
                >
                  {/* Right Side (In RTL): Image Gallery Slider */}
                  <div className="w-full md:w-1/2 shrink-0 flex flex-col bg-slate-900 border-b md:border-b-0 md:border-l border-slate-800">
                    <div className="relative h-64 md:h-80 lg:h-[380px] bg-slate-900">
                      <img src={currentImg} alt={selectedProperty.title} className="w-full h-full object-cover" />
                      
                      <button onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }} className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md shadow-sm transition-colors z-20 md:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono border border-white/20 z-10">
                        الصورة {activeImageIdx + 1} من {gallery.length}
                      </div>

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

                    {gallery.length > 1 && (
                      <div className="flex gap-2 p-3 bg-slate-950 overflow-x-auto shrink-0 border-t border-slate-800">
                        {gallery.map((imgUrl: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`relative w-16 h-12 rounded overflow-hidden shrink-0 border-2 transition-all ${
                              activeImageIdx === idx ? 'border-blue-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
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
                          <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold mb-2">{selectedProperty.category}</span>
                          <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedProperty.title}</h2>
                          <p className="text-slate-500 text-sm flex items-center gap-1.5">
                            📍 {selectedProperty.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">{selectedProperty.price}</div>
                          <button onClick={() => { setSelectedProperty(null); setActiveImageIdx(0); }} className="hidden md:flex text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between mb-5">
                        <span className="text-slate-600 font-bold text-sm">المساحة الإجمالية:</span>
                        <span className="text-slate-900 font-black text-base">{selectedProperty.area} م²</span>
                      </div>

                      <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">تفاصيل ومواصفات العقار التجاري:</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">{selectedProperty.description || 'عقار تجاري استثماري ذو واجهة حيوية، مناسب لجميع الأنشطة والمقرات التجارية والشركات.'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', `مرحباً، أود الاستفسار عن العقار التجاري: (${selectedProperty.title}).`)} className="flex-1 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow">
                        طلب لمعاينة العقار
                      </button>
                      <button onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', `مرحباً، أود التواصل مع المستشار المسؤول عن: (${selectedProperty.title}).`)} className="flex-1 py-3.5 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                        تواصل مع الوكيل
                      </button>
                    </div>
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
