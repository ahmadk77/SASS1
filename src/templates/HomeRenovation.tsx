import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';
import { CardImageSlider } from '../components/CardImageSlider';
import { Sparkles, Wrench, Ruler, Upload, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export default function HomeRenovation({ tenant, content }: TemplateProps) {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [blueprintUploaded, setBlueprintUploaded] = useState(false);

  const secondaryColor = content?.secondaryColor || '#ffffff';
  const textColor = content?.textColor || '#334155';
  const fontFamily = content?.fontFamily || 'Tajawal';
  const metaTitle = content?.metaTitle || content?.businessName || tenant?.name || 'شركة التصميم الداخلي والتشطيب الفاخر';
  const metaDescription = content?.metaDescription || content?.heroSubtitle || 'نبتكر أروع التصاميم الداخلية وننفذ التشطيبات بأعلى معايير الجودة العالمية.';

  const defaultProjects = [
    { title: 'تجديد صالة فيلا الياسمين', category: 'فلل سكنية', style: 'مودرن فاخر', areaSqm: '240 م²', budget: '85,000 ر.س', description: 'تحويل صالة الاستقبال إلى مساحة مودرن متكاملة بإضاءات مخفية وأرضيات رخامية.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800', images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'] },
    { title: 'تشطيب مكاتب شركة التقنية', category: 'مكاتب تجارية', style: 'مستقبلي / زجاجي', areaSqm: '500 م²', budget: '210,000 ر.س', description: 'تصميم وتشطيب داخلي متكامل لطابق المكاتب الإدارية مع غرف اجتماعات ذكية.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800', images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800'] },
    { title: 'تنسيق شقة البنتهاوس الفاخرة', category: 'شقق فارهة', style: 'نيوكلاسيك', areaSqm: '180 م²', budget: '65,000 ر.س', description: 'ديكورات جدارية فخمة، أسقف منخفضة بالإضاءة المخفية، وأثاث مخصص.', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800'] },
  ];

  const projects = Array.isArray(content?.projects) ? content.projects : (Array.isArray(content?.items) ? content.items : defaultProjects);

  const categories = ['all', 'فلل سكنية', 'مكاتب تجارية', 'شقق فارهة'];

  const filteredProjects = projects.filter((item: any) => {
    if (selectedCategory === 'all') return true;
    return (item.category || '').includes(selectedCategory);
  });

  const finishingPackages = [
    { name: 'باقة الديلوكس (Deluxe)', price: '380 ر.س / م²', desc: 'تشطيب داخلي أساسي راقٍ مع أرضيات بورسلين ودهانات فاخرة وإضاءة LED.', features: ['أرضيات بورسلين إسباني', 'تأسيس الكهرباء والإضاءة', 'دهانات جدارية متطورة', 'ضمان 5 سنوات'] },
    { name: 'باقة التنفيذ التنفيذي (Executive Fit-Out)', price: '650 ر.س / م²', desc: 'تصميم داخلي ثلاثي الأبعاد مع ديكورات خشبية وجدارية فاخرة وأسقف معلقة.', features: ['تصاميم 3D احترافية', 'ديكورات خشبية وجبسية', 'تكييف مخفي وتأسيس ذكي', 'إشراف هندسي يومي'] },
    { name: 'باقة تسليم المفتاح (Turnkey Services)', price: '950 ر.س / م²', desc: 'حل متكامل ومطلق يشمل التصميم، التشطيب، الأثاث المفصل، الديكورات والإكسسوارات.', features: ['التصميم والتنفيذ الشامل', 'أثاث مفصل خصيصاً', 'أجهزة ذكية متكاملة', 'تنظيف وتسليم فوري'] }
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    handleWhatsAppAction(content?.phoneNumber || '+966500000000', 'مرحباً، أود حجز استشارة تصميم داخلي وتشطيب.');
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      
      <div className="min-h-screen font-sans selection:bg-amber-500 selection:text-white" dir="rtl" style={{ backgroundColor: secondaryColor, fontFamily: `"${fontFamily}", sans-serif`, color: textColor }}>
        
        {/* Top bar */}
        <div className="bg-slate-950 text-slate-300 py-2.5 px-6 text-xs font-bold hidden md:block border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex gap-6 items-center">
              <span className="flex items-center gap-1.5"><Phone size={14} className="text-amber-400" /> 050 000 0000</span>
              <span className="flex items-center gap-1.5"><Mail size={14} className="text-amber-400" /> design@decorfinishing.com</span>
            </div>
            <span className="text-amber-300 flex items-center gap-1.5"><MapPin size={14} /> الرياض • جدة • الخبر</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('hero')}>
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Sparkles size={20} />
              </div>
              {content?.businessName || tenant?.name || 'ديكور وفنون التشطيب'}
            </div>
            <div className="hidden md:flex gap-8 font-bold text-slate-700 text-sm">
              <button onClick={() => scrollTo('services')} className="hover:text-amber-600 transition-colors">باقات التشطيب</button>
              <button onClick={() => scrollTo('projects')} className="hover:text-amber-600 transition-colors">معرض المشاريع</button>
              <button onClick={() => scrollTo('consultation')} className="hover:text-amber-600 transition-colors">حجز استشارة ومخطط</button>
            </div>
            <button onClick={handleAction} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-colors">
              اطلب عرض سعر
            </button>
          </div>
        </nav>

        {/* Hero */}
        {content?.showHero !== false && (
        <header id="hero" className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000')] bg-cover mix-blend-overlay"></div>
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 font-black rounded-full text-xs mb-6 border border-amber-500/30">
                <Sparkles size={14} /> {content?.slogan || 'الابتكار والفخامة في التصميم الداخلي والتشطيب'}
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                {content?.heroTitle || 'نحول مساحاتك إلى تحف فنية تنطق بالرقي.'}
              </h1>
              <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed">
                {content?.heroSubtitle || 'نقدم خدمات التصميم الداخلي، الديكور، والتشطيب المتكامل للفلل والمكاتب والشقق الفاخرة بأعلى معايير الجودة والهندسة الإنشائية المعاصرة.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => scrollTo('consultation')} className="px-8 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl hover:bg-amber-400 transition-all text-center text-sm">
                  رفع مخطط المشروع وحجز استشارة
                </button>
                <button onClick={() => scrollTo('projects')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 transition-all text-center text-sm">
                  استعرض أعمالنا
                </button>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[460px] border border-white/10">
                <img src={content?.heroBgUrl || content?.heroBg || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000"} alt="Luxury Interior" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md text-amber-300 px-4 py-2 rounded-2xl font-bold shadow text-xs border border-amber-500/30 flex items-center gap-2">
                  <Wrench size={14} /> تنفيذ وتشطيب تسليم مفتاح
                </div>
              </div>
            </motion.div>
          </div>
        </header>
        )}

        {/* Finishing Packages Section */}
        {content?.showServices !== false && (
        <section id="services" className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-black text-amber-600 bg-amber-50 px-3.5 py-1.5 rounded-full inline-block mb-3">باقاتنا الهندسية</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">باقات التشطيب والتصميم الداخلي</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-sm">أسعار واضحة ومدروسة لكل متر مربع تضمن أعلى مستويات الإتقان والمواد العالمية</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {finishingPackages.map((pkg, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-8 border shadow-sm hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{pkg.name}</h3>
                    <div className="text-2xl font-black text-amber-600 mb-4">{pkg.price}</div>
                    <p className="text-slate-600 text-xs mb-6 leading-relaxed">{pkg.desc}</p>
                    
                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button onClick={handleAction} className="w-full py-3.5 bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-white font-black rounded-xl text-xs transition-colors shadow">
                    اطلب هذه الباقة
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Portfolio / Completed Projects */}
        {content?.showProjects !== false && (
        <section id="projects" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
              <div>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-3.5 py-1.5 rounded-full inline-block mb-3">معرض الأعمال</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900">مشاريعنا المنفذة</h2>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'جميع المشاريع' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {filteredProjects.map((project: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border hover:shadow-xl transition-all cursor-pointer flex flex-col"
                  onClick={() => setSelectedProject(project)}
                >
                  <CardImageSlider
                    images={project.images}
                    mainImage={project.image}
                    title={project.title}
                    aspectRatio="h-64"
                    className="rounded-t-3xl rounded-b-none"
                    badgeBg="bg-slate-900 text-white border-slate-700"
                  />
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">{project.category || 'فلل سكنية'}</span>
                        <span className="text-[11px] font-bold text-slate-500">{project.areaSqm || '250 م²'}</span>
                      </div>
                      <h3 className="font-black text-lg text-slate-900 mb-1">{project.title}</h3>
                      <p className="text-slate-500 text-xs line-clamp-2">{project.description}</p>
                    </div>

                    <div className="pt-3 border-t flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>الطراز: {project.style || 'مودرن'}</span>
                      <span className="text-amber-700">{project.budget || 'ميزانية خاصة'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Project Details Modal */}
        <AnimatePresence>
          {selectedProject && (() => {
            const gallery = (selectedProject.images && Array.isArray(selectedProject.images) && selectedProject.images.length > 0)
              ? selectedProject.images
              : [selectedProject.image, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'];
            const currentImg = gallery[activeImageIdx % gallery.length] || selectedProject.image;

            return (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }}
                  className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60]"
                ></motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-3xl overflow-hidden z-[70] shadow-2xl flex flex-col md:flex-row max-h-[90vh] border"
                >
                  <div className="w-full md:w-1/2 shrink-0 flex flex-col bg-slate-900">
                    <div className="relative h-64 md:h-96">
                      <img src={currentImg} alt={selectedProject.title} className="w-full h-full object-cover" />
                      <button onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }} className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full md:hidden">✕</button>
                    </div>
                    {gallery.length > 1 && (
                      <div className="flex gap-2 p-3 bg-slate-950 overflow-x-auto">
                        {gallery.map((imgUrl: string, idx: number) => (
                          <button key={idx} onClick={() => setActiveImageIdx(idx)} className={`w-16 h-12 rounded-lg overflow-hidden border-2 ${activeImageIdx === idx ? 'border-amber-400' : 'border-slate-800 opacity-60'}`}>
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex-1 overflow-y-auto flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-2 inline-block">{selectedProject.category}</span>
                          <h2 className="text-2xl font-black text-slate-900">{selectedProject.title}</h2>
                        </div>
                        <button onClick={() => { setSelectedProject(null); setActiveImageIdx(0); }} className="hidden md:flex text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">✕</button>
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed mb-6">{selectedProject.description}</p>

                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border">
                        <div>
                          <span className="text-[11px] text-slate-400 block">المساحة الإجمالية</span>
                          <span className="font-black text-sm text-slate-800">{selectedProject.areaSqm || '300 م²'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block">التكلفة التقديرية</span>
                          <span className="font-black text-sm text-amber-700">{selectedProject.budget || 'حسب المساحة'}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleWhatsAppAction(content?.phoneNumber || '+966500000000', `مرحباً، أود استشارة تصميم وتشطيب مشابه لمشروع: (${selectedProject.title}).`)} 
                      className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs transition-colors shadow-lg"
                    >
                      اطلب استشارة لهذا التصميم عبر الواتساب
                    </button>
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* Consultation & Blueprint Upload Section */}
        {content?.showContact !== false && (
        <section id="consultation" className="py-24 px-6 bg-slate-950 text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10 bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-800 shadow-2xl">
            <div className="text-center mb-10">
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-3.5 py-1.5 rounded-full inline-block mb-3">حجز استشارة هندسية ومخطط</span>
              <h2 className="text-3xl font-black mb-4">ارفع مخطط مشروعك أو اطلب معاينة ميدانية</h2>
              <p className="text-slate-400 text-xs md:text-sm">شاركنا مخططك أو تفاصيل المساحة وسيقدم لك مهندسونا مقترحاً مبدئياً وعرض سعر مخصص.</p>
            </div>
            
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const data = Object.fromEntries(formData);
              
              if (tenant) {
                const success = await submitLead((tenant as any)?.id || (tenant as any)?.subdomain || 'unknown', {
                  ...data,
                  source: 'blueprint_consultation'
                }, 'leads');
                if (success) {
                  alert('تم إرسال طلب الاستشارة ومخططك بنجاح! سيتواصل معك المهندس المختص خلال ساعات.');
                  (e.target as HTMLFormElement).reset();
                  setBlueprintUploaded(false);
                } else {
                  alert('حدث خطأ. الرجاء المحاولة مرة أخرى.');
                }
              }
            }}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">الاسم الكريم</label>
                  <input type="text" name="name" required className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-amber-500" placeholder="أدخل اسمك" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">رقم الجوال</label>
                  <input type="tel" name="phone" required className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-amber-500" placeholder="05X XXX XXXX" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">نوع العقار</label>
                  <select name="propertyType" className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-amber-500">
                    <option>فيلا سكنية</option>
                    <option>مكتب إداري / تجاري</option>
                    <option>شقة فاخرة</option>
                    <option>مطعم أو مقهى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">المساحة التقديرية (بالمتر المربع Sqm)</label>
                  <input type="text" name="area" placeholder="مثال: 350 م²" className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-950/50">
                <input 
                  type="file" 
                  id="blueprint-upload" 
                  className="hidden" 
                  onChange={() => setBlueprintUploaded(true)} 
                />
                <label htmlFor="blueprint-upload" className="cursor-pointer flex flex-col items-center justify-center">
                  <Upload size={32} className="text-amber-400 mb-2" />
                  <span className="text-xs font-bold text-white mb-1">
                    {blueprintUploaded ? '✓ تم إرفاق المخطط / ملف الكروكي بنجاح' : 'اضغط هنا لرفع مخطط المشروع أو صورة المساحة (PDF, DWG, PNG)'}
                  </span>
                  <span className="text-[10px] text-slate-400">اختياري - يساعد المهندسين في تقديم دراسة دقيقة</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">ملاحظات إضافية وتطلعات التصميم</label>
                <textarea rows={3} name="notes" placeholder="اكتب طموحاتك في الديكور، الألوان المفضلة، أو التعديلات المطلوبة..." className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-amber-500"></textarea>
              </div>

              <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-colors shadow-xl cursor-pointer">
                إرسال المخطط وطلب الاستشارة الهندسية
              </button>
            </form>
          </div>
        </section>
        )}

        {/* Footer */}
        {content?.showFooter !== false && (
        <footer className="bg-slate-950 text-slate-400 py-12 text-center border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xl font-black text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Sparkles size={16} />
              </div>
              {content?.businessName || tenant?.name || 'شركة التصميم والتشطيب الفاخر'}
            </div>
            <div className="text-xs font-bold text-slate-500">
              &copy; {new Date().getFullYear()} جميع الحقوق محفوظة. تنفيذ وتصميم داخلي بمعايير عالمية.
            </div>
          </div>
        </footer>
        )}

      </div>
    </>
  );
}
