import { submitLead } from '../lib/leads';
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { handleWhatsAppAction } from '../lib/whatsapp';
import { CardImageSlider } from '../components/CardImageSlider';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export default function ModernArchitecture({ tenant, content }: TemplateProps) {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const primaryColor = content?.primaryColor || '#171717'; // Neutral 900
  const secondaryColor = content?.secondaryColor || '#ffffff'; // White
  const textColor = content?.textColor || '#404040'; // Neutral 700
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'ستوديو العمارة الحديثة';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'تصاميم معمارية تعيد صياغة المساحات.';

  const defaultProjects = [
    { title: 'فيلا أمالا', category: 'سكني', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000' },
    { title: 'مقر شركة آفاق', category: 'تجاري', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000' },
    { title: 'متحف الضوء', category: 'ثقافي', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000' },
    { title: 'شاليه الرمال', category: 'ضيافة', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000' },
  ];

  const projects = Array.isArray(content?.projects)
    ? content.projects
    : (Array.isArray(content?.items) ? content.items : (tenant ? [] : defaultProjects));

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود الاستفسار عن خدماتكم.');
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      
      <div className="min-h-screen font-sans selection:bg-black selection:text-white" dir="rtl" style={{ backgroundColor: secondaryColor, fontFamily: `"${fontFamily}", sans-serif`, color: textColor }}>
        
        {/* Navigation */}
        <nav className="absolute w-full z-40 top-0 bg-transparent">
          <div className="max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
            <div className="text-xl font-bold tracking-[0.2em] cursor-pointer" onClick={() => scrollTo('hero')} style={{ color: primaryColor }}>
              {content?.businessName || tenant?.name || 'STUDIO.ARCH'}
            </div>
            <div className="hidden md:flex gap-12 text-xs font-bold tracking-[0.1em] uppercase text-gray-500">
              <button onClick={() => scrollTo('philosophy')} className="hover:text-black transition-colors">الفلسفة</button>
              <button onClick={() => scrollTo('projects')} className="hover:text-black transition-colors">المشاريع</button>
              <button onClick={handleAction} className="hover:text-black transition-colors">تواصل</button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        {content?.showHero !== false && (
        <header id="hero" className="relative min-h-[90vh] flex items-center px-8">
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="lg:col-span-5 z-10 pt-20 lg:pt-0">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] text-black tracking-tight">
                {content?.heroTitle || 'نصمم الفراغ، لنلهم الحياة.'}
              </h1>
              <p className="text-lg text-gray-500 mb-12 leading-relaxed max-w-md font-light">
                {content?.heroSubtitle || 'نحن استوديو تصميم معماري يركز على خلق مساحات وظيفية تتسم بالبساطة والأناقة المستدامة.'}
              </p>
              <button onClick={handleAction} className="pb-2 border-b-2 border-black text-black font-bold uppercase tracking-widest text-sm hover:text-gray-500 hover:border-gray-500 transition-colors">
                اطلب استشارة معمارية
              </button>
            </motion.div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.3 }} className="lg:col-span-7 relative h-[60vh] lg:h-[80vh]">
               <img 
                  src={content?.heroBgUrl || content?.heroBg || "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200"} 
                  alt="Modern Architecture" 
                  className="w-full h-full object-cover filter brightness-95"
               />
               {/* Minimalist decorative element */}
               <div className="absolute -bottom-8 -left-8 w-64 h-64 border border-gray-200 -z-10 hidden lg:block"></div>
            </motion.div>
          </div>
        </header>
        )}

        {/* Philosophy / Services */}
        {content?.showAbout !== false && content?.showFeatures !== false && (
        <section id="philosophy" className="py-32 px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800" alt="Interior" className="w-full aspect-[3/4] object-cover shadow-2xl" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-8">خدماتنا وفلسفتنا</h2>
              <p className="text-3xl leading-snug text-black font-light mb-12">
                "التصميم الجيد هو أقل قدر ممكن من التصميم. نحن نزيل العناصر غير الضرورية لتبقى المساحة نقية ومعبرة."
              </p>
              <div className="space-y-6">
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-bold text-black mb-2">التصميم المعماري</h3>
                  <p className="text-gray-500 font-light">تصميم واجهات وكتل معمارية تتناغم مع البيئة المحيطة.</p>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-bold text-black mb-2">التصميم الداخلي</h3>
                  <p className="text-gray-500 font-light">خلق فراغات داخلية تعزز جودة الحياة والإنتاجية.</p>
                </div>
                <div className="border-t border-gray-200 pt-6 border-b pb-6">
                  <h3 className="text-xl font-bold text-black mb-2">تنسيق المواقع (Landscape)</h3>
                  <p className="text-gray-500 font-light">تصميم الحدائق والمساحات الخارجية كامتداد طبيعي للمبنى.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        )}

        {/* Projects Masonry/Grid */}
        {content?.showProjects !== false && content?.showGallery !== false && content?.showMenu !== false && (
        <section id="projects" className="py-32 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <h2 className="text-4xl font-bold text-black tracking-tight">مشاريع مختارة</h2>
              <button onClick={handleAction} className="hidden md:block pb-1 border-b border-gray-300 text-gray-500 text-sm hover:text-black hover:border-black transition-colors">
                عرض الكتالوج الكامل
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-16">
              {projects.map((project: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
                  className={`group cursor-pointer ${idx % 2 !== 0 ? 'md:mt-32' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="mb-6">
                    <CardImageSlider
                      images={project.images}
                      mainImage={project.image}
                      title={project.title}
                      category={project.category}
                      aspectRatio="aspect-[4/5]"
                      className="rounded-none"
                      badgeBg="bg-black text-white border-white/20"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-black">{project.title}</h3>
                  <p className="text-gray-500 text-sm font-light tracking-wide">{project.category}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Project Modal */}
        <AnimatePresence>
          {selectedProject && (() => {
            const gallery = (selectedProject.images && Array.isArray(selectedProject.images) && selectedProject.images.length > 0)
              ? selectedProject.images
              : [
                  selectedProject.image,
                  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000',
                  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000',
                  'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000'
                ];
            const currentImg = gallery[activeImageIdx % gallery.length] || selectedProject.image;

            return (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                ></motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white text-black shadow-2xl z-[70] flex flex-col md:flex-row overflow-hidden max-h-[90vh] border border-black"
                >
                  {/* Right Side (In RTL): Image Gallery Slider */}
                  <div className="w-full md:w-1/2 shrink-0 flex flex-col bg-black border-b md:border-b-0 md:border-l border-gray-900">
                    <div className="relative h-64 md:h-80 lg:h-[380px] bg-black">
                      <img src={currentImg} alt={selectedProject.title} className="w-full h-full object-cover" />
                      
                      <button onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }} className="absolute top-4 right-4 bg-black text-white p-2.5 backdrop-blur-md transition-colors z-20 md:hidden hover:bg-gray-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      <div className="absolute bottom-4 left-4 bg-black text-white px-3 py-1 text-xs font-mono border border-white/20 z-10">
                        الصورة {activeImageIdx + 1} من {gallery.length}
                      </div>

                      {gallery.length > 1 && (
                        <>
                          <button 
                            onClick={() => setActiveImageIdx((prev) => (prev - 1 + gallery.length) % gallery.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-800 transition-all z-10"
                          >
                            ‹
                          </button>
                          <button 
                            onClick={() => setActiveImageIdx((prev) => (prev + 1) % gallery.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black text-white w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-800 transition-all z-10"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    {gallery.length > 1 && (
                      <div className="flex gap-2 p-3 bg-black overflow-x-auto shrink-0 border-t border-gray-900">
                        {gallery.map((imgUrl: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`relative w-16 h-12 overflow-hidden shrink-0 border transition-all ${
                              activeImageIdx === idx ? 'border-white scale-105' : 'border-gray-800 opacity-50 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Left Side (In RTL): Details, Vision & Action */}
                  <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2 block">{selectedProject.category}</span>
                          <h2 className="text-2xl md:text-3xl font-bold text-black">{selectedProject.title}</h2>
                        </div>
                        <button onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }} className="hidden md:flex bg-gray-100 hover:bg-gray-200 text-black p-2 rounded-full">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <div className="mb-8 border-t border-b border-gray-200 py-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">رؤية وفلسفة المشروع الإنشائي المعماري:</h4>
                        <p className="text-gray-700 leading-relaxed font-light text-sm">
                          {selectedProject.description || 'تصميم معماري يعتمد الفلسفة المودرن النظيفة، مع تركيز استثنائي على تدفق الإضاءة الطبيعية واستغلال الفراغات بمرونة عالية مع أرقى الخامات التشييدية.'}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', `مرحباً، أود طلب استشارة هندسية لمشروع مشابه لـ: (${selectedProject.title}).`)} 
                      className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors"
                    >
                      طلب استشارة هندسية للمشروع
                    </button>
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* Footer */}
        {content?.showContact !== false && content?.showFooter !== false && (
        <footer className="bg-black text-white py-24 px-8 mt-20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold mb-8 leading-tight">لنتحدث عن<br />مشروعك القادم.</h2>
              <button onClick={handleAction} className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors">
                اطلب عرض سعر
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm font-light text-gray-400">
              <div>
                <h4 className="font-bold text-white uppercase tracking-widest mb-6">الرياض</h4>
                <p className="mb-2">طريق الملك فهد، العليا</p>
                <p className="mb-2">المملكة العربية السعودية</p>
                <p className="mt-6 hover:text-white cursor-pointer transition-colors">Riyadh@studioarch.com</p>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-widest mb-6">تواصل اجتماعي</h4>
                <p className="mb-2 hover:text-white cursor-pointer transition-colors">Instagram</p>
                <p className="mb-2 hover:text-white cursor-pointer transition-colors">Behance</p>
                <p className="mb-2 hover:text-white cursor-pointer transition-colors">LinkedIn</p>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/20 text-xs font-bold tracking-widest text-gray-500 uppercase flex justify-between">
            <span>&copy; {new Date().getFullYear()} STUDIO.ARCH</span>
            <span>Riyadh, KSA</span>
          </div>
        </footer>
        )}

      </div>
    </>
  );
}
