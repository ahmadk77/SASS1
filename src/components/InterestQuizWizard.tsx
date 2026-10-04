import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  UtensilsCrossed, 
  Coffee, 
  Building2, 
  HardHat, 
  LayoutGrid, 
  TrendingUp, 
  Calendar, 
  Palette, 
  Layers, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft,
  Sliders,
  Check,
  Laptop,
  Sparkles
} from 'lucide-react';

export interface QuizAnswers {
  category: string;
  categoryLabel: string;
  goal: string;
  goalLabel: string;
  style: string;
  styleLabel: string;
}

interface InterestQuizWizardProps {
  appLang: 'ar' | 'en';
  onComplete: (answers: QuizAnswers) => void;
  onSkip: () => void;
  matchedCount: number;
}

export default function InterestQuizWizard({
  appLang,
  onComplete,
  onSkip,
  matchedCount
}: InterestQuizWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedGoalLabel, setSelectedGoalLabel] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedStyleLabel, setSelectedStyleLabel] = useState<string>('');

  const isArabic = appLang === 'ar';

  // Question 1: Category with Lucide Icons
  const categories = [
    { id: 'ecommerce', labelAr: 'جميع المتاجر الإلكترونية', labelEn: 'All E-Commerce Stores', icon: ShoppingBag, descAr: 'استعراض كافة المتاجر الإلكترونية بكل الأقسام (أجهزة، أزياء، عناية)', descEn: 'Explore all e-commerce stores across all categories' },
    { id: 'electronics', labelAr: 'متجر الأجهزة الإلكترونية والتقنية', labelEn: 'Electronics & Tech Store', icon: Laptop, descAr: 'هواتف، حواسيب، وإلكترونيات مع سلة تسوق ومساعد ذكي', descEn: 'Smartphones, laptops & tech with smart assistant' },
    { id: 'fashion', labelAr: 'أزياء وموضة وبوتيك فاخر', labelEn: 'Haute Couture & Fashion Store', icon: ShoppingBag, descAr: 'متجر أزياء وإكسسوارات مع عربة تسوق وتتبع الطلب', descEn: 'Fashion store & accessories with cart and order tracking' },
    { id: 'beauty', labelAr: 'متجر العناية بالبشرة والجَمال', labelEn: 'Beauty & Skincare Store', icon: Sparkles, descAr: 'منتجات العناية بالبشرة والجسم مع سلة تسوق وتتبع', descEn: 'Skincare & beauty products with cart and tracking' },
    { id: 'restaurants', labelAr: 'مطاعم وتوصيل مأكولات', labelEn: 'Restaurants & Food Service', icon: UtensilsCrossed, descAr: 'منيو إلكتروني، حجز طاولات واستقبال الطلبات', descEn: 'Digital menu, table booking & orders' },
    { id: 'cafes', labelAr: 'مقاهي وقهوة مختصة', labelEn: 'Cafes & Specialty Coffee', icon: Coffee, descAr: 'استعراض الأصناف والمشروبات والمخبوزات', descEn: 'Showcase coffee blends, bakery & drinks' },
    { id: 'realestate', labelAr: 'عقارات وتسويق عقاري', labelEn: 'Real Estate & Properties', icon: Building2, descAr: 'تسويق العقارات والمشاريع الاستثمارية', descEn: 'Market properties & investment projects' },
    { id: 'contractors', labelAr: 'مقاولات وبناء وتصميم', labelEn: 'Contractors & Construction', icon: HardHat, descAr: 'عرض المشاريع الإنشائية والتصميم والتنفيذ', descEn: 'Showcase construction & design projects' },
    { id: 'all', labelAr: 'تصفح كافة المجالات والقوالب', labelEn: 'Explore All Categories', icon: LayoutGrid, descAr: 'عرض جميع القوالب المتاحة بالمنصة', descEn: 'Browse all available templates' }
  ];

  // Question 2: Goal
  const goals = [
    { id: 'sales', labelAr: 'زيادة المبيعات والبيع أونلاين', labelEn: 'Increase Online Sales', icon: TrendingUp, descAr: 'تحصيل المبيعات واستقبال الطلبات إلكترونياً', descEn: 'Direct payments & online order processing' },
    { id: 'bookings', labelAr: 'استقبال الحجوزات والتواصل', labelEn: 'Bookings & Customer Leads', icon: Calendar, descAr: 'جدولة المواعيد ونماذج التواصل المباشر', descEn: 'Schedule appointments & smart inquiries' },
    { id: 'showcase', labelAr: 'استعراض الأعمال والتصميم', labelEn: 'Portfolio & Brand Identity', icon: Palette, descAr: 'إبراز الخبرات والمشاريع بهوية احترافية', descEn: 'Showcase expertise & projects professionally' },
    { id: 'management', labelAr: 'إدارة وتخصيص مرن للمحتوى', labelEn: 'Content Management & Control', icon: Layers, descAr: 'تحديث المحتوى والمنتجات بسهولة ومرونة', descEn: 'Manage products & content with ease' }
  ];

  // Question 3: Style
  const styles = [
    { id: 'modern', labelAr: 'عصري وحديث', labelEn: 'Modern & Clean', descAr: 'تصميم أنيق متناسق يعكس الحداثة والوضوح', descEn: 'Sleek design with clean modern visuals' },
    { id: 'luxury', labelAr: 'فاخر وراقي', labelEn: 'Luxury & Executive', descAr: 'طابع فخم يعبر عن الجودة والتمبّز العالي', descEn: 'Prestige aesthetic reflecting high quality' },
    { id: 'minimal', labelAr: 'بسيط وسريع', labelEn: 'Minimal & Direct', descAr: 'تركيز على السرعة وسهولة التصفح المباشر', descEn: 'Focused on speed & clean user flow' },
    { id: 'rich', labelAr: 'متكامل ومتعدد الأقسام', labelEn: 'Comprehensive & Structured', descAr: 'مساحات واسعة لتفاصيل الخدمات والمنتجات', descEn: 'Structured sections for full business details' }
  ];

  const handleSelectCategory = (catId: string, label: string) => {
    setSelectedCategory(catId);
    setSelectedCategoryLabel(label);

    if (catId === 'all') {
      onComplete({
        category: 'all',
        categoryLabel: isArabic ? 'جميع المجالات' : 'All Categories',
        goal: 'all',
        goalLabel: isArabic ? 'جميع الأهداف' : 'All Goals',
        style: 'all',
        styleLabel: isArabic ? 'جميع الأنماط' : 'All Styles'
      });
      return;
    }

    setStep(2);
  };

  const handleSelectGoal = (goalId: string, label: string) => {
    setSelectedGoal(goalId);
    setSelectedGoalLabel(label);
    setStep(3);
  };

  const handleSelectStyle = (styleId: string, label: string) => {
    setSelectedStyle(styleId);
    setSelectedStyleLabel(label);
    setStep(4);
  };

  const handleRevealTemplates = () => {
    onComplete({
      category: selectedCategory,
      categoryLabel: selectedCategoryLabel,
      goal: selectedGoal,
      goalLabel: selectedGoalLabel,
      style: selectedStyle,
      styleLabel: selectedStyleLabel
    });
  };

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="w-full max-w-2xl mx-auto my-6 sm:my-8 px-2 sm:px-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm relative"
      >
        {/* Wizard Header */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Sliders size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-0.5">
                {step <= 3 ? (isArabic ? `الخطوة 0${step} من 03` : `Step 0${step} of 03`) : (isArabic ? 'جاهز' : 'Complete')}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {step <= 3 
                  ? (isArabic ? 'تحديد خيارات القالب المناسب' : 'Find Your Ideal Template')
                  : (isArabic ? 'تم اختيار التفضيلات بنجاح' : 'Preferences Saved')}
              </h3>
            </div>
          </div>

          <button
            onClick={onSkip}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <span>{isArabic ? 'تخطي وعرض الكل' : 'Skip to All'}</span>
          </button>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="bg-slate-900 h-full rounded-full"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: isArabic ? 15 : -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isArabic ? -15 : 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-4">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                  {isArabic ? 'اختر مجال مشروعك التجاري:' : 'Select your primary business category:'}
                </h4>
              </div>

              {/* Stacked Clean List */}
              <div className="grid grid-cols-1 gap-2.5">
                {categories.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectCategory(item.id, isArabic ? item.labelAr : item.labelEn)}
                      className="w-full p-3.5 bg-slate-50/60 hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-200/90 hover:border-slate-900 rounded-xl transition-all duration-200 group cursor-pointer flex items-center justify-between gap-3 text-right"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white group-hover:bg-slate-800 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-slate-700 flex items-center justify-center shrink-0 transition-colors">
                          <IconComp size={18} />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs sm:text-sm mb-0.5">
                            {isArabic ? item.labelAr : item.labelEn}
                          </h5>
                          <p className="text-[11px] text-slate-500 group-hover:text-slate-300 leading-tight truncate">
                            {isArabic ? item.descAr : item.descEn}
                          </p>
                        </div>
                      </div>

                      <div className="text-slate-400 group-hover:text-white transition-colors shrink-0">
                        {isArabic ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: GOAL */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: isArabic ? 15 : -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isArabic ? -15 : 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {isArabic ? 'اختر الهدف الرئيسي من الموقع:' : 'Select your primary website goal:'}
                </h4>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                >
                  {isArabic ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
                  <span>{isArabic ? 'السابق' : 'Back'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {goals.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectGoal(item.id, isArabic ? item.labelAr : item.labelEn)}
                      className="w-full p-3.5 bg-slate-50/60 hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-200/90 hover:border-slate-900 rounded-xl transition-all duration-200 group cursor-pointer flex items-center justify-between gap-3 text-right"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white group-hover:bg-slate-800 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-slate-700 flex items-center justify-center shrink-0 transition-colors">
                          <IconComp size={18} />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs sm:text-sm mb-0.5">
                            {isArabic ? item.labelAr : item.labelEn}
                          </h5>
                          <p className="text-[11px] text-slate-500 group-hover:text-slate-300 leading-tight">
                            {isArabic ? item.descAr : item.descEn}
                          </p>
                        </div>
                      </div>

                      <div className="text-slate-400 group-hover:text-white transition-colors shrink-0">
                        {isArabic ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: STYLE */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: isArabic ? 15 : -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isArabic ? -15 : 15 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {isArabic ? 'اختر الطابع والأسلوب البصري:' : 'Select preferred visual aesthetic:'}
                </h4>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                >
                  {isArabic ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
                  <span>{isArabic ? 'السابق' : 'Back'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {styles.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectStyle(item.id, isArabic ? item.labelAr : item.labelEn)}
                    className="w-full p-3.5 bg-slate-50/60 hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-200/90 hover:border-slate-900 rounded-xl transition-all duration-200 group cursor-pointer flex items-center justify-between gap-3 text-right"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white group-hover:bg-slate-800 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-slate-700 flex items-center justify-center shrink-0 transition-colors">
                        <Check size={16} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs sm:text-sm mb-0.5">
                          {isArabic ? item.labelAr : item.labelEn}
                        </h5>
                        <p className="text-[11px] text-slate-500 group-hover:text-slate-300 leading-tight">
                          {isArabic ? item.descAr : item.descEn}
                        </p>
                      </div>
                    </div>

                    <div className="text-slate-400 group-hover:text-white transition-colors shrink-0">
                      {isArabic ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUMMARY & REVEAL */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="py-2 text-center"
            >
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CheckCircle2 size={24} />
              </div>

              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                {isArabic ? 'تم حفظ التفضيلات' : 'Preferences Summary'}
              </h4>

              <p className="text-slate-500 text-xs max-w-sm mx-auto mb-5">
                {isArabic 
                  ? 'سيتم عرض القوالب المتوافقة مع اختياراتك مباشرة:' 
                  : 'Templates will be filtered according to your selections:'}
              </p>

              <div className="flex flex-col gap-2 max-w-sm mx-auto mb-6 text-right">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-500">{isArabic ? 'المجال:' : 'Category:'}</span>
                  <span className="font-bold text-slate-900">{selectedCategoryLabel}</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-500">{isArabic ? 'الهدف:' : 'Goal:'}</span>
                  <span className="font-bold text-slate-900">{selectedGoalLabel}</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-500">{isArabic ? 'النمط:' : 'Style:'}</span>
                  <span className="font-bold text-slate-900">{selectedStyleLabel}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
                <button
                  onClick={handleRevealTemplates}
                  className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isArabic ? 'استعراض القوالب' : 'View Matching Templates'}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
                >
                  {isArabic ? 'تعديل' : 'Edit'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
