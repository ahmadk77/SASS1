import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Layers, Sliders, CreditCard, Rocket, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface ClientWorkflowSectionProps {
  appLang: 'ar' | 'en';
}

export const ClientWorkflowSection: React.FC<ClientWorkflowSectionProps> = ({ appLang }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'step1',
      titleAr: '1. اختيار القالب أو الخدمة المناسبة',
      titleEn: '1. Choose the Right Template or Service',
      descAr: 'يتصفح العميل مكتبة قوالب بنيان المتنوعة (عقارات، مطاعم، مقاولات، متاجر)، ويختار التصميم الأنسب له بنقرة واحدة.',
      descEn: 'The client browses Bunyan’s diverse template library (real estate, restaurants, contractors, stores) and selects the ideal design in one click.',
      icon: <Layers className="w-6 h-6 text-blue-600" />,
      badgeAr: 'الانطلاقة السريعة',
      badgeEn: 'Quick Start',
      featuresAr: [
        'قوالب مصممة خصيصاً لكل قطاع',
        'معاينة حية فورية قبل الاختيار',
        'دعم كامل للغة العربية والإنجليزية'
      ],
      featuresEn: [
        'Sector-specific tailored templates',
        'Instant live preview before selection',
        'Full Arabic & English support'
      ]
    },
    {
      id: 'step2',
      titleAr: '2. التخصيص السهل بدون كود',
      titleEn: '2. Easy No-Code Customization',
      descAr: 'يستطيع العميل تعديل النصوص، الصور، الألوان، الأسعار، وإضافة الأقسام بسهولة تامة من خلال محرر مرئي مباشر وبدون أي خبرة برمجية.',
      descEn: 'The client easily customizes texts, images, colors, pricing, and adds sections instantly through a live visual editor with zero coding experience.',
      icon: <Sliders className="w-6 h-6 text-emerald-600" />,
      badgeAr: 'تحكم كامل',
      badgeEn: 'Full Control',
      featuresAr: [
        'تعديل فوري للنصوص والصور',
        'إدارة الأقسام والمنتجات والعقارات',
        'تحديث الهوية البصرية وشعار العلامة'
      ],
      featuresEn: [
        'Instant text & image editing',
        'Manage sections, products & properties',
        'Update branding and store logos'
      ]
    },
    {
      id: 'step3',
      titleAr: '3. ربط وسائل الدفع والطلبات',
      titleEn: '3. Integrate Payments & Orders',
      descAr: 'يقوم العميل بربط بوابات الدفع الإلكترونية (مثل مدى، أبل باي، بطاقات ائتمانية) وتفعيل نظام استقبال الطلبات أو حجوزات العقارات فوراً.',
      descEn: 'The client connects secure payment gateways (Mada, Apple Pay, Credit Cards) and activates the instant ordering or property booking system.',
      icon: <CreditCard className="w-6 h-6 text-indigo-600" />,
      badgeAr: 'جاهزية تجارية',
      badgeEn: 'Commerce Ready',
      featuresAr: [
        'ربط آمن ببوابات الدفع المحلية والعالمية',
        'إشعارات فورية بالطلبات الجديدة',
        'لوحة تحكم مركزية لمتابعة المبيعات'
      ],
      featuresEn: [
        'Secure local & global payment gateways',
        'Instant notifications for new orders',
        'Centralized sales tracking dashboard'
      ]
    },
    {
      id: 'step4',
      titleAr: '4. إطلاق المنصة واستقبال العملاء',
      titleEn: '4. Launch & Welcome Customers',
      descAr: 'خلال دقائق معدودة، تكون منصة العميل الخاصة جاهزة بالكامل على رابطه الخاص لاستقبال زملائه وعملائه وبدء تحقيق الأرباح.',
      descEn: 'Within minutes, the client’s custom platform is fully live on their own domain/link, ready to welcome customers and generate revenue.',
      icon: <Rocket className="w-6 h-6 text-amber-600" />,
      badgeAr: 'النجاح والنمو',
      badgeEn: 'Success & Growth',
      featuresAr: [
        'نطاق خاص أو رابط جاهز للعمل',
        'تقارير وإحصائيات دقيقة للأداء',
        'دعم فني مستمر لتطوير ونمو المشروع'
      ],
      featuresEn: [
        'Custom domain or ready-to-use link',
        'Accurate performance reports & analytics',
        'Ongoing support to scale the business'
      ]
    }
  ];

  return (
    <section className="w-full py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Active Step Detailed Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-12 shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            {/* Decorative background blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  {steps[activeStep].icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 px-3 py-1 rounded-full bg-blue-50">
                    {appLang === 'en' ? steps[activeStep].badgeEn : steps[activeStep].badgeAr}
                  </span>
                  <span className="text-sm font-black text-slate-400">
                    {appLang === 'en' ? `Step ${activeStep + 1} of 4` : `الخطوة ${activeStep + 1} من 4`}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4">
                  {appLang === 'en' ? steps[activeStep].titleEn : steps[activeStep].titleAr}
                </h3>
                <p className="text-slate-600 text-base sm:text-xl leading-relaxed">
                  {appLang === 'en' ? steps[activeStep].descEn : steps[activeStep].descAr}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
                  {appLang === 'en' ? 'What you get in this step:' : 'ماذا يضمن لك في هذه الخطوة:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(appLang === 'en' ? steps[activeStep].featuresEn : steps[activeStep].featuresAr).map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-slate-800">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation arrows inside card */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
              <button
                onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1))}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer"
              >
                {appLang === 'ar' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                <span>{appLang === 'en' ? 'Previous' : 'السابق'}</span>
              </button>
              <div className="flex gap-2">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${activeStep === idx ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-200'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0))}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>{appLang === 'en' ? 'Next' : 'التالي'}</span>
                {appLang === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};

export default ClientWorkflowSection;
