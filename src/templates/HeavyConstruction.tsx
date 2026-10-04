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

export default function HeavyConstruction({ tenant, content }: TemplateProps) {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const primaryColor = content?.primaryColor || '#eab308'; // Yellow 500
  const secondaryColor = content?.secondaryColor || '#111827'; // Gray 900
  const textColor = content?.textColor || '#f3f4f6'; // Gray 100
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'مجموعة المقاولات الثقيلة';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'نبني المستقبل بأساسات صلبة.';

  const defaultProjects = [
    { title: 'برج الأفق', category: 'مشاريع تجارية', image: 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=800' },
    { title: 'مجمع السكني', category: 'مشاريع سكنية', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800' },
    { title: 'جسر الوادي', category: 'بنية تحتية', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800' },
    { title: 'مصنع الحديد', category: 'مشاريع صناعية', image: 'https://images.unsplash.com/photo-1533280181515-38b81309f485?q=80&w=800' },
  ];

  const projects = Array.isArray(content?.projects)
    ? content.projects
    : (Array.isArray(content?.items) ? content.items : (tenant ? [] : defaultProjects));

  const defaultServices = [
    { title: 'البنية التحتية', description: 'تنفيذ مشاريع البنية التحتية للطرق والجسور بأعلى المعايير.', icon: '🏗️' },
    { title: 'المقاولات العامة', description: 'إدارة وتشييد المباني التجارية والسكنية والمرافق الحكومية.', icon: '🏢' },
    { title: 'الأعمال الكهروميكانيكية', description: 'تصميم وتنفيذ شبكات الكهرباء والتكييف والصرف الصحي.', icon: '⚡' },
  ];

  const services = Array.isArray(content?.services)
    ? content.services
    : (tenant ? [] : defaultServices);

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
      
      <div className="min-h-screen font-sans selection:bg-yellow-500 selection:text-black" dir="rtl" style={{ backgroundColor: secondaryColor, fontFamily: `"${fontFamily}", sans-serif`, color: textColor }}>
        
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-[#111827]/95 backdrop-blur-md border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div className="text-2xl font-black tracking-tight cursor-pointer flex items-center gap-2 uppercase" onClick={() => scrollTo('hero')} style={{ color: primaryColor }}>
              <div className="w-8 h-8 bg-yellow-500 text-black flex items-center justify-center font-black rounded-sm transform -skew-x-12">HC</div>
              {content?.businessName || tenant?.name || 'BUILD.CO'}
            </div>
            <div className="hidden md:flex gap-8 font-bold text-gray-300">
              <button onClick={() => scrollTo('services')} className="hover:text-yellow-500 transition-colors">خدماتنا</button>
              <button onClick={() => scrollTo('projects')} className="hover:text-yellow-500 transition-colors">سابقة الأعمال</button>
            </div>
            <button onClick={handleAction} className="bg-yellow-500 text-black px-6 py-2 rounded-sm font-black transform -skew-x-12 hover:bg-yellow-400 transition-colors">
              <span className="block transform skew-x-12">اطلب عرض سعر</span>
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        {content?.showHero !== false && (
        <header id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={content?.heroBgUrl || content?.heroBg || "https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=2000"} 
              alt="Construction Site" 
              className="w-full h-full object-cover filter grayscale-[40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
              <div className="w-20 h-2 bg-yellow-500 mb-8"></div>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight uppercase">
                {content?.heroTitle || 'نبني المستقبل بأساسات صلبة.'}
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl font-medium leading-relaxed">
                {content?.heroSubtitle || 'شريكك الموثوق في المشاريع الإنشائية الكبرى. التزام بالوقت، وجودة لا تضاهى، وقوة تتحمل الزمن.'}
              </p>
              <div className="flex gap-4">
                <button onClick={handleAction} className="px-8 py-4 bg-yellow-500 text-black font-black text-lg transform -skew-x-12 hover:bg-yellow-400 transition-colors">
                  <span className="block transform skew-x-12">ابدأ مشروعك معنا</span>
                </button>
                <button onClick={() => scrollTo('projects')} className="px-8 py-4 bg-transparent border-2 border-gray-500 text-white font-bold text-lg transform -skew-x-12 hover:border-yellow-500 hover:text-yellow-500 transition-colors">
                  <span className="block transform skew-x-12">تصفح مشاريعنا</span>
                </button>
              </div>
            </motion.div>
          </div>
        </header>
        )}

        {/* Services Section */}
        {content?.showServices !== false && content?.showMenu !== false && (
        <section id="services" className="py-24 px-6 relative z-10 bg-[#111827] border-y border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-wider">خدماتنا</h2>
              <div className="w-16 h-1 bg-yellow-500 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                  className="bg-[#1f2937] p-8 border-b-4 border-yellow-500 hover:-translate-y-2 transition-transform"
                >
                  <div className="text-4xl mb-6">{service.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-medium">{service.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Projects Section */}
        {content?.showProjects !== false && content?.showGallery !== false && (
        <section id="projects" className="py-24 px-6 relative z-10 bg-[#0b0f19]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-wider">سابقة الأعمال</h2>
                <div className="w-16 h-1 bg-yellow-500"></div>
              </div>
              <button onClick={handleAction} className="text-yellow-500 font-bold hover:text-yellow-400 flex items-center gap-2">
                عرض جميع المشاريع <span className="text-xl">&larr;</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {projects.map((project: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                  className="group relative bg-[#111827] cursor-pointer rounded-lg border border-gray-800 overflow-hidden"
                  onClick={() => setSelectedProject(project)}
                >
                  <CardImageSlider
                    images={project.images}
                    mainImage={project.image}
                    title={project.title}
                    category={project.category}
                    aspectRatio="h-72"
                    badgeBg="bg-yellow-500 text-black font-black border-yellow-400"
                  />
                  
                  <div className="p-6 flex justify-between items-end bg-[#111827]">
                    <div>
                      <span className="text-yellow-500 font-bold text-xs mb-1 block">{project.category}</span>
                      <h3 className="text-2xl font-black text-white">{project.title}</h3>
                      {project.location && <p className="text-xs text-gray-400 mt-1">📍 {project.location}</p>}
                    </div>
                    <span className="bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-black shrink-0">
                      عرض التفاصيل &larr;
                    </span>
                  </div>
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
                  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000',
                  'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=1000',
                  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1000'
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
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-[#1f2937] text-white rounded-2xl shadow-2xl z-[70] flex flex-col md:flex-row overflow-hidden max-h-[90vh] border border-gray-700"
                >
                  {/* Right Side (In RTL): Image Gallery Slider */}
                  <div className="w-full md:w-1/2 shrink-0 flex flex-col bg-black border-b md:border-b-0 md:border-l border-gray-800">
                    <div className="relative h-64 md:h-80 lg:h-[380px] bg-black">
                      <img src={currentImg} alt={selectedProject.title} className="w-full h-full object-cover" />
                      
                      <button onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }} className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-2 rounded-full backdrop-blur-md transition-colors z-20 md:hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-yellow-400 px-3 py-1 rounded-full text-xs font-mono border border-yellow-500/30 z-10">
                        الصورة {activeImageIdx + 1} من {gallery.length}
                      </div>

                      {gallery.length > 1 && (
                        <>
                          <button 
                            onClick={() => setActiveImageIdx((prev) => (prev - 1 + gallery.length) % gallery.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-yellow-500 text-black font-black w-9 h-9 rounded-full flex items-center justify-center text-xl shadow-lg transition-all hover:scale-110 z-10"
                          >
                            ‹
                          </button>
                          <button 
                            onClick={() => setActiveImageIdx((prev) => (prev + 1) % gallery.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-yellow-500 text-black font-black w-9 h-9 rounded-full flex items-center justify-center text-xl shadow-lg transition-all hover:scale-110 z-10"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    {/* Gallery Thumbnails */}
                    {gallery.length > 1 && (
                      <div className="flex gap-2 p-3 bg-[#111827] overflow-x-auto shrink-0 border-t border-gray-800">
                        {gallery.map((imgUrl: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`relative w-16 h-12 rounded overflow-hidden shrink-0 border-2 transition-all ${
                              activeImageIdx === idx ? 'border-yellow-500 scale-105' : 'border-gray-700 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Left Side (In RTL): Details, Scope & Action */}
                  <div className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="inline-block bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-black uppercase mb-2 border border-yellow-500/30">{selectedProject.category}</span>
                          <h2 className="text-2xl font-black text-white">{selectedProject.title}</h2>
                        </div>
                        <button onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }} className="hidden md:flex bg-gray-800 text-gray-300 hover:text-white p-2 rounded-full">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 my-5">
                        {selectedProject.location && (
                          <div className="bg-[#111827] p-3 rounded-xl border border-gray-800">
                            <div className="text-xs text-gray-400 font-bold mb-1">📍 الموقع</div>
                            <div className="text-sm font-bold text-white">{selectedProject.location}</div>
                          </div>
                        )}
                        {selectedProject.area && (
                          <div className="bg-[#111827] p-3 rounded-xl border border-gray-800">
                            <div className="text-xs text-gray-400 font-bold mb-1">📐 المساحة</div>
                            <div className="text-sm font-bold text-white">{selectedProject.area} م²</div>
                          </div>
                        )}
                        <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 col-span-2">
                          <div className="text-xs text-gray-400 font-bold mb-1">🛠️ نوع التنفيذ والخدمة</div>
                          <div className="text-sm font-bold text-yellow-400">مقاولات عامة وتشييد إنشائي</div>
                        </div>
                      </div>

                      <div className="mb-6 p-4 bg-[#111827] rounded-xl border border-gray-800">
                        <h4 className="font-bold text-yellow-400 text-sm mb-2">وصف ونطاق المشروع:</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedProject.description || 'تم تنفيذ هذا المشروع بأعلى معايير الإتقان والسلامة الإنشائية، متضمناً الأعمال الخرسانية والهيكلية والتشطيبات الكهروميكانيكية العالية الجودة.'}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', `مرحباً، أود الاستفسار عن تفاصيل تنفيذ مشروع مشابه لـ: (${selectedProject.title}).`)} 
                      className="w-full py-4 bg-yellow-500 text-black font-black text-base rounded-xl hover:bg-yellow-400 transition-colors shadow-lg"
                    >
                      اطلب استشارة ومشروعاً مشابهاً
                    </button>
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* Footer / CTA */}
        {content?.showFooter !== false && content?.showContact !== false && (
        <footer className="bg-yellow-500 py-20 px-6 text-black text-center relative overflow-hidden">
          {/* Industrial pattern background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
          
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase">هل لديك مشروع قادم؟</h2>
            <p className="text-xl font-bold mb-10 opacity-80">نحن مستعدون لتحويل مخططاتك إلى واقع ملموس بأعلى معايير الجودة.</p>
            <button onClick={handleAction} className="px-10 py-5 bg-[#111827] text-white font-black text-lg transform -skew-x-12 hover:bg-black transition-colors shadow-2xl">
              <span className="block transform skew-x-12">اطلب عرض سعر مجاني</span>
            </button>
            <div className="mt-16 text-sm font-bold opacity-70">
              &copy; {new Date().getFullYear()} {content?.businessName || tenant?.name || 'BUILD.CO'}. جميع الحقوق محفوظة.
            </div>
          </div>
        </footer>
        )}

      </div>
    </>
  );
}
