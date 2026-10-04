import React, { useState } from 'react';
import { getSubscriptionPlans } from '../lib/subscriptionPlans';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  LayoutTemplate,
  Smartphone, 
  Settings, 
  Zap, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Building, 
  Utensils, 
  Coffee, 
  Home, 
  HardHat, 
  Flame, 
  Layers, 
  Store, 
  Clock, 
  Star, 
  Check, 
  Palette,
  Eye,
  ShieldCheck,
  Compass,
  Sliders,
  CheckSquare,
  Award,
  ArrowRight,
  PhoneCall
} from 'lucide-react';

interface TemplateOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
  onRequestSite: (templateId: string | number) => void;
}

export interface TemplateDetails {
  id: number;
  name: string;
  badge: string;
  categoryLabel: string;
  targetAudience: string;
  detailedDescription: string;
  themeStyle: {
    bgGradient: string;
    modalBg: string;
    borderAccent: string;
    badgeBg: string;
    badgeText: string;
    accentColor: string;
    buttonGradient: string;
    previewBoxBg: string;
  };
  highlights: { title: string; desc: string; icon: React.ReactNode }[];
  includedSections: string[];
}

export const TEMPLATE_DETAILS_MAP: Record<number, TemplateDetails> = {
  1: {
    id: 1,
    name: 'قالب المطعم الإيطالي والفاخر',
    badge: 'فخامة ملكية 👑',
    categoryLabel: 'مطاعم وتغذية',
    targetAudience: 'المطاعم الفاخرة، المأكولات الإيطالية والفرنسية، مطاعم الوجبات الراقية',
    detailedDescription: 'تصميم ملكي أنيق بلمسات فاخرة مخصص للمطاعم التي تقدم تجربة طعام استثنائية. يتيح للعملاء تصفح قائمة الطعام بوضوح وحجز الطاولات مسبقاً بطريقة الكترونية سلسة.',
    themeStyle: {
      bgGradient: 'from-rose-950 via-slate-900 to-amber-950',
      modalBg: 'bg-slate-950 text-slate-100',
      borderAccent: 'border-amber-500/40',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-300 border-amber-500/30',
      accentColor: 'text-amber-400',
      buttonGradient: 'from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700',
      previewBoxBg: 'bg-rose-950/40 border-amber-500/30'
    },
    highlights: [
      { title: 'قائمة طعام تفاعلية (Menu)', desc: 'قوائم أطباق مقسمة حسب المقبلات، الأطباق الرئيسية، والحلويات مع الأسعار والصور.', icon: <Utensils className="w-5 h-5 text-amber-400" /> },
      { title: 'نظام حجز طاولات راقٍ', desc: 'نموذج حجز إلكتروني منظم لتسهيل استقبال حجوزات الزبائن وتنسيق المناسبات.', icon: <Clock className="w-5 h-5 text-rose-400" /> },
      { title: 'عرض الموقع وساعات العمل', desc: 'خريطة تفاعلية وساعات الدوام للوصول السريع إلى موقع المطعم.', icon: <Store className="w-5 h-5 text-amber-300" /> },
      { title: 'توصيات الشيف الفاخرة', desc: 'قسم يستعرض أطباق الشيف الأكثر طلباً وتقييمات زوار المطعم.', icon: <Star className="w-5 h-5 text-amber-400" /> }
    ],
    includedSections: ['الرئيسية الملكية', 'قائمة الأطباق (Menu)', 'حجز طاولة أونلاين', 'توصيات الشيف', 'آراء النقد والطعام', 'الموقع وساعات العمل']
  },
  2: {
    id: 2,
    name: 'قالب برجر ستيشن للوجبات السريعة',
    badge: 'طاقة وعروض ⚡️',
    categoryLabel: 'مطاعم وسناكات',
    targetAudience: 'مطاعم البرجر، الوجبات السريعة، محلات الشاورما والتيك أواي',
    detailedDescription: 'قالب ديناميكي وجذاب بألوان مشهية يركز على استعراض السندويشات والوجبات السريعة مع إتاحة أزرار الطلب السريع والخصومات اللحظية.',
    themeStyle: {
      bgGradient: 'from-orange-950 via-slate-900 to-amber-950',
      modalBg: 'bg-zinc-950 text-white',
      borderAccent: 'border-orange-500/50',
      badgeBg: 'bg-orange-500/20',
      badgeText: 'text-orange-400 border-orange-500/40',
      accentColor: 'text-orange-400',
      buttonGradient: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
      previewBoxBg: 'bg-orange-950/30 border-orange-500/40'
    },
    highlights: [
      { title: 'كروت وجبات جذابة', desc: 'استعراض مكونات البرجر والصوصات بوضوح مع تحديد الإضافات.', icon: <Flame className="w-5 h-5 text-orange-400" /> },
      { title: 'بنرات عروض يومية', desc: 'مساحات إعلانية بارزة للخصومات والوجبات الأكثر مبيعاً.', icon: <Sparkles className="w-5 h-5 text-amber-400" /> },
      { title: 'طلب سريع ومباشر', desc: 'أزرار تحويل فورية للطلب عبر الواتساب أو سلة التوصيل.', icon: <Zap className="w-5 h-5 text-yellow-400" /> },
      { title: 'فروع وتغطية التوصيل', desc: 'عرض مناطق التوصيل المتاحة وأوقات الاستلام.', icon: <Store className="w-5 h-5 text-emerald-400" /> }
    ],
    includedSections: ['هيرو العروض السريعة', 'قائمة البرجر والوجبات', 'الخصومات الحصرية', 'الطلب المباشر السريع', 'الفروع ومناطق التوصيل']
  },
  3: {
    id: 3,
    name: 'قالب بيتزا ووجبات عائلية',
    badge: 'أجواء عائلية 🍕',
    categoryLabel: 'مطاعم وتوصيل',
    targetAudience: 'مطاعم البيتزا، الوجبات العائلية الضخمة، المأكولات الإيطالية السريعة',
    detailedDescription: 'واجهة مخصصة لمطاعم البيتزا والوجبات المشتركة، تتيح اختيار أحجام البيتزا وإضافة الجبن والمكونات الإضافية بكل سهولة.',
    themeStyle: {
      bgGradient: 'from-red-950 via-stone-900 to-emerald-950',
      modalBg: 'bg-stone-950 text-amber-50',
      borderAccent: 'border-red-500/40',
      badgeBg: 'bg-red-500/20',
      badgeText: 'text-red-400 border-red-500/40',
      accentColor: 'text-red-400',
      buttonGradient: 'from-red-600 to-emerald-600 hover:from-red-700 hover:to-emerald-700',
      previewBoxBg: 'bg-red-950/30 border-red-500/30'
    },
    highlights: [
      { title: 'محدد أحجام البيتزا', desc: 'تحديد الحجم (صغير، وسط، كبير، عائلي) مع حساب السعر التلقائي.', icon: <Utensils className="w-5 h-5 text-red-400" /> },
      { title: 'قسم المقبلات والمشروبات', desc: 'عرض أصناف البطاطس، الأصابع المقرمشة، والعصائر المنعشة.', icon: <Layers className="w-5 h-5 text-amber-400" /> },
      { title: 'توصيل سريع وساخن', desc: 'توضيح وقت التحضير والتوصيل المنزلي السريع.', icon: <Zap className="w-5 h-5 text-emerald-400" /> },
      { title: 'توافق تام مع الجوال', desc: 'تجربة تصفح واستعراض سلسة جداً على كافة الهواتف.', icon: <Smartphone className="w-5 h-5 text-blue-400" /> }
    ],
    includedSections: ['العروض العائلية', 'قائمة البيتزا والمقبلات', 'أداة اختيار الحجم', 'نموذج الطلب والتوصيل السريع']
  },
  4: {
    id: 4,
    name: 'قالب كافيه وقهوة كلاسيك',
    badge: 'أجواء دافئة ☕️',
    categoryLabel: 'مقاهي وحلويات',
    targetAudience: 'الكافيهات الكلاسيكية، المقاهي الهادئة، مقاهي القراءة والعمل',
    detailedDescription: 'تصميم راقٍ بألوان القهوة الدافئة يوفر جو من الهدوء والاسترخاء، ممتاز لإبراز مشروبات القهوة والمخبوزات الطازجة.',
    themeStyle: {
      bgGradient: 'from-amber-950 via-amber-900 to-stone-950',
      modalBg: 'bg-stone-900 text-amber-100',
      borderAccent: 'border-amber-700/50',
      badgeBg: 'bg-amber-800/30',
      badgeText: 'text-amber-300 border-amber-600/40',
      accentColor: 'text-amber-400',
      buttonGradient: 'from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950',
      previewBoxBg: 'bg-amber-950/60 border-amber-700/40'
    },
    highlights: [
      { title: 'منيو القهوة والمخبوزات', desc: 'قائمة مرتبة تستعرض المشروبات الساخنة والباردة والكيك الطازج.', icon: <Coffee className="w-5 h-5 text-amber-400" /> },
      { title: 'معرض جلسات الكافيه', desc: 'صور عالية الجودة تبرز الديكور الداخلي وأجواء المكان الدافئة.', icon: <Layout className="w-5 h-5 text-amber-300" /> },
      { title: 'مواعيد الدوام والموقع', desc: 'توضيح ساعات العمل الرسمية وأيام العطل والخرائط.', icon: <Clock className="w-5 h-5 text-emerald-400" /> },
      { title: 'الفعاليات والأمسيات', desc: 'قسم يستعرض الأنشطة والأجواء الموسيقية داخل المقهى.', icon: <Sparkles className="w-5 h-5 text-amber-200" /> }
    ],
    includedSections: ['واجهة المقهى الدافئة', 'منيو القهوة والحلويات', 'معرض الجلسات والجو العام', 'ساعات الدوام والموقع']
  },
  5: {
    id: 5,
    name: 'قالب محمص وقهوة مختصة',
    badge: 'خبراء القهوة 🌟',
    categoryLabel: 'مقاهي ومحامص',
    targetAudience: 'مقاهي القهوة المختصة، المحامص المحلية، بائعي حبوب القهوة والأدوات',
    detailedDescription: 'واجهة مودرن احترافية موجهة لعشاق القهوة المختصة، تركز على تفاصيل حبوب البن، إيحاءات الطعم، وطرق التحضير المتنوعة.',
    themeStyle: {
      bgGradient: 'from-stone-950 via-neutral-900 to-stone-900',
      modalBg: 'bg-stone-950 text-stone-200',
      borderAccent: 'border-amber-600/40',
      badgeBg: 'bg-stone-800/80',
      badgeText: 'text-amber-400 border-amber-600/30',
      accentColor: 'text-amber-500',
      buttonGradient: 'from-amber-600 to-stone-800 hover:from-amber-700 hover:to-stone-900',
      previewBoxBg: 'bg-stone-900 border-amber-600/30'
    },
    highlights: [
      { title: 'بطاقة إيحاءات البن', desc: 'تفاصيل دقيقة عن نوع المحصول، الارتفاع، ودرجة التحميص.', icon: <Coffee className="w-5 h-5 text-amber-500" /> },
      { title: 'متجر أدوات التحضير', desc: 'قسم لبيع أكياس البن ومستلزمات الـ V60 والاسبريسو.', icon: <Store className="w-5 h-5 text-amber-400" /> },
      { title: 'إرشادات التحضير المثالي', desc: 'نصائح لضبط معايير الطحن والماء لتحضير كوب مميز.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
      { title: 'تصميم داكن فاخر', desc: 'ألوان كلاسيكية داكنة تبرز جودة البن والمنتجات.', icon: <Palette className="w-5 h-5 text-purple-400" /> }
    ],
    includedSections: ['محاصيل البن المتاحة', 'بطاقة إيحاءات النكهات', 'أدوات التحضير اليدوي', 'قصتنا والمحمص', 'متجر البن']
  },
  6: {
    id: 6,
    name: 'قالب بوتيك الحلويات والآيس كريم',
    badge: 'طعم مبهج 🍰',
    categoryLabel: 'حلويات ومخبوزات',
    targetAudience: 'متاجر الحلويات والكيك، صالونات الشوكولاتة، محلات الآيس كريم والوافل',
    detailedDescription: 'قالب مبهج يفتح النفس بألوان حيوية مخصص لعرض كعكات المناسبات، أطباق الوافل، الكريب، والحلويات الشرقية والغربية.',
    themeStyle: {
      bgGradient: 'from-pink-900 via-slate-900 to-rose-950',
      modalBg: 'bg-slate-950 text-pink-50',
      borderAccent: 'border-pink-500/40',
      badgeBg: 'bg-pink-500/20',
      badgeText: 'text-pink-300 border-pink-500/30',
      accentColor: 'text-pink-400',
      buttonGradient: 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
      previewBoxBg: 'bg-pink-950/30 border-pink-500/30'
    },
    highlights: [
      { title: 'معرض كعكات المناسبات', desc: 'صور مكبرة وواضحة لكيكات الأعراس وأعياد الميلاد.', icon: <Sparkles className="w-5 h-5 text-pink-400" /> },
      { title: 'طلب كيك خاص', desc: 'نموذج استقبال طلبات التصاميم المخصصة للمناسبات.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
      { title: 'أصناف الآيس كريم والوافل', desc: 'قوائم متنوعة بالنكهات والصوصات والإضافات.', icon: <Flame className="w-5 h-5 text-amber-400" /> },
      { title: 'توصيل مبرد آمن', desc: 'إتاحة خيارات طلب التوصيل المبرد للحلويات.', icon: <Zap className="w-5 h-5 text-blue-400" /> }
    ],
    includedSections: ['كيك المناسبات الفاخر', 'قسم الحلويات والغزل', 'الآيس كريم والوافل', 'طلب تصميم كيك خاص', 'التواصل']
  },
  7: {
    id: 7,
    name: 'قالب العقارات والفلل الفاخرة',
    badge: 'فخامة واستثمار 🏰',
    categoryLabel: 'عقارات واستثمار',
    targetAudience: 'شركات التطوير العقاري، تسويق الفلل والقصور، العقارات الاستثمارية',
    detailedDescription: 'تصميم فخم يعكس الرقي والرفاهية، مخصص لتسويق الفلل والقصور السكنية والمشاريع الاستثمارية الكبرى.',
    themeStyle: {
      bgGradient: 'from-slate-950 via-emerald-950 to-slate-950',
      modalBg: 'bg-slate-950 text-emerald-50',
      borderAccent: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300 border-emerald-500/30',
      accentColor: 'text-emerald-400',
      buttonGradient: 'from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800',
      previewBoxBg: 'bg-emerald-950/40 border-emerald-500/30'
    },
    highlights: [
      { title: 'بطاقات مواصفات القصور', desc: 'إبراز المساحة، عدد الأجنحة، والموقع الجغرافي والسعر.', icon: <Building className="w-5 h-5 text-emerald-400" /> },
      { title: 'معرض صور وفيديوهات HD', desc: 'استعراض مرئي دقيق للتصاميم الداخلية والخارجية.', icon: <Eye className="w-5 h-5 text-blue-400" /> },
      { title: 'حجز معاينة ميدانية', desc: 'نموذج مباشر لتنسيق زيارة الموقع مع الوكيل العقاري.', icon: <Clock className="w-5 h-5 text-amber-400" /> },
      { title: 'المخططات والمرافق السكنية', desc: 'عرض المخطط الهندسي والخدمات المجاورة للمشروع.', icon: <Home className="w-5 h-5 text-emerald-300" /> }
    ],
    includedSections: ['الفلل والقصور المعروضة', 'مواصفات العقار الفاخر', 'المعرض المرئي HD', 'حجز معاينة ميدانية', 'عن المطور']
  },
  8: {
    id: 8,
    name: 'قالب الشقق والمجمعات السكنية',
    badge: 'فلترة وحجز 🏢',
    categoryLabel: 'عقارات وتأجير',
    targetAudience: 'المكاتب العقارية، المجمعات السكنية، شركات إدارة العقارات المؤجرة',
    detailedDescription: 'واجهة عملية وبسيطة تمكن الزوار من البحث في قائمة الشقق المتاحة للبيع أو للإيجار والتواصل المباشر مع الوكيل.',
    themeStyle: {
      bgGradient: 'from-slate-950 via-blue-950 to-indigo-950',
      modalBg: 'bg-slate-950 text-blue-50',
      borderAccent: 'border-blue-500/40',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-300 border-blue-500/30',
      accentColor: 'text-blue-400',
      buttonGradient: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
      previewBoxBg: 'bg-blue-950/40 border-blue-500/30'
    },
    highlights: [
      { title: 'تصفية وبحث مرن', desc: 'فلترة الشقق حسب عدد الغرف، الحي السكني، والميزانية.', icon: <Layers className="w-5 h-5 text-blue-400" /> },
      { title: 'تفاصيل الخدمات المتاحة', desc: 'توضيح وجود المصعد، المواقف، والتكييف والمواصفات.', icon: <Building className="w-5 h-5 text-indigo-400" /> },
      { title: 'تواصل سريع مع الوكيل', desc: 'زر محادثة مباشرة عبر الواتساب للاستفسار والحجز.', icon: <Zap className="w-5 h-5 text-emerald-400" /> },
      { title: 'حاسبة دفعات تقديرية', desc: 'توضيح جدول الدفعات والإيجار السنوي أو الشهري.', icon: <CheckCircle2 className="w-5 h-5 text-amber-400" /> }
    ],
    includedSections: ['قائمة الشقق المتاحة', 'فلاتر البحث والأسعار', 'تفاصيل الوحدات السكنية', 'تواصل مباشر مع الوكيل']
  },
  9: {
    id: 9,
    name: 'قالب المركز والمكتب العقاري الرسمي',
    badge: 'اعتماد وتثمين 📊',
    categoryLabel: 'عقارات واستشارات',
    targetAudience: 'المكاتب العقارية الرسمية، شركات التثمين والاستشارات، إدارة الأملاك',
    detailedDescription: 'قالب مؤسسي رصين يعزز ثقة العملاء في خدمات المكتب العقاري ويوضح المشاريع المستقبلية والاستشارات المتاحة.',
    themeStyle: {
      bgGradient: 'from-slate-950 via-sky-950 to-slate-900',
      modalBg: 'bg-slate-950 text-slate-100',
      borderAccent: 'border-sky-500/40',
      badgeBg: 'bg-sky-500/20',
      badgeText: 'text-sky-300 border-sky-500/30',
      accentColor: 'text-sky-400',
      buttonGradient: 'from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800',
      previewBoxBg: 'bg-sky-950/30 border-sky-500/30'
    },
    highlights: [
      { title: 'عرض خدمات المكتب الرسمية', desc: 'تغطية التثمين العقاري، إدارة الأملاك، والتسويق.', icon: <ShieldCheck className="w-5 h-5 text-sky-400" /> },
      { title: 'سجل المشاريع والشركاء', desc: 'إبراز المشاريع الناجحة والشركاء الاستراتيجيين.', icon: <Building className="w-5 h-5 text-emerald-400" /> },
      { title: 'نموذج طلب تثمين معتمد', desc: 'استقبال طلبات تسعير وعرض العقارات للبيع.', icon: <CheckCircle2 className="w-5 h-5 text-purple-400" /> },
      { title: 'أخبار وتحليلات السوق', desc: 'قسم يغطي التحديثات والمؤشرات العقارية.', icon: <Layers className="w-5 h-5 text-amber-400" /> }
    ],
    includedSections: ['خدماتنا العقارية الرسمية', 'المشاريع المنجزة', 'طلب تثمين ومعاينة', 'مؤشرات السوق', 'اتصل بنا']
  },
  10: {
    id: 10,
    name: 'قالب شركات المقاولات والبناء العام',
    badge: 'بناء وموثوقية 🏗️',
    categoryLabel: 'مقاولات وبناء',
    targetAudience: 'شركات البناء، مقاولي العظم والتشطيب، شركات البنية التحتية',
    detailedDescription: 'قالب مهني قوي يعكس الخبرة والملاءة المالية لشركات المقاولات والبناء، مع تركيز على المشاريع الكبرى المنفذة.',
    themeStyle: {
      bgGradient: 'from-stone-950 via-amber-950 to-slate-950',
      modalBg: 'bg-stone-950 text-stone-100',
      borderAccent: 'border-yellow-500/50',
      badgeBg: 'bg-yellow-500/20',
      badgeText: 'text-yellow-400 border-yellow-500/40',
      accentColor: 'text-yellow-400',
      buttonGradient: 'from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black',
      previewBoxBg: 'bg-amber-950/30 border-yellow-500/40'
    },
    highlights: [
      { title: 'معرض المشاريع المنفذة', desc: 'عرض صور مواقع العمل والمباني المشيدة باحترافية.', icon: <HardHat className="w-5 h-5 text-yellow-400" /> },
      { title: 'خدمات البناء والتشطيب', desc: 'شرح مراحل العظم، التشطيب الكامل، وتسليم المفتاح.', icon: <Building className="w-5 h-5 text-blue-400" /> },
      { title: 'طلب عرض سعر (Quotation)', desc: 'نموذج دراسة مشروع واستقبال المخططات للتسعير.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
      { title: 'شهادات الاعتماد والتصنيف', desc: 'إبراز معايير السلامة والجودة والاعتمادات الرسمية.', icon: <ShieldCheck className="w-5 h-5 text-yellow-300" /> }
    ],
    includedSections: ['المشاريع الإنشائية السابقة', 'خدمات البناء والتشطيب', 'نموذج طلب عرض سعر', 'شهادات الجودة والتصنيف']
  },
  11: {
    id: 11,
    name: 'قالب الاستشارات والتصميم المعماري',
    badge: 'إبداع مخططات 📐',
    categoryLabel: 'هندسة وديكور',
    targetAudience: 'مكاتب الهندسة المعمارية، مصممي الواجهات، استوديوهات التخطيط',
    detailedDescription: 'تصميم عصري وفني يبرز الأفكار المبتكرة للمخططات المعمارية والتصاميم ثلاثية الأبعاد قبل التنفيذ.',
    themeStyle: {
      bgGradient: 'from-indigo-950 via-slate-900 to-cyan-950',
      modalBg: 'bg-slate-950 text-cyan-50',
      borderAccent: 'border-cyan-500/40',
      badgeBg: 'bg-cyan-500/20',
      badgeText: 'text-cyan-300 border-cyan-500/30',
      accentColor: 'text-cyan-400',
      buttonGradient: 'from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700',
      previewBoxBg: 'bg-cyan-950/30 border-cyan-500/30'
    },
    highlights: [
      { title: 'معرض نماذج 3D والواجهات', desc: 'عرض واجهات ومخططات هندسية حديثة وعصرية.', icon: <Layout className="w-5 h-5 text-cyan-400" /> },
      { title: 'رحلة المخطط المعماري', desc: 'توضيح خطوات العمل من الفكرة والتصاميم حتى الترخيص.', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
      { title: 'طاقم الاستشاريين', desc: 'تعريف بفريق المهندسين والخبرات المعمارية.', icon: <HardHat className="w-5 h-5 text-blue-400" /> },
      { title: 'حجز جلسة استشارة', desc: 'نموذج حجز موعد استشارة هندسية أونلاين.', icon: <Clock className="w-5 h-5 text-emerald-400" /> }
    ],
    includedSections: ['ألبوم التصاميم والمعمار 3D', 'خدمات المخططات التنسيقية', 'رحلة المخطط الهندسي', 'حجز جلسة استشارة']
  },
  12: {
    id: 12,
    name: 'قالب التصميم الداخلي والتجديد',
    badge: 'تحول المكان ✨',
    categoryLabel: 'ديكور وتأثيث',
    targetAudience: 'مصممي الديكور الداخلي، شركات تجديد المنازل، مهندسي التأثيث',
    detailedDescription: 'قالب أنيق وجذاب يعرض أفكار الديكور المودرن والكلاسيك مع إبراز تحولات المكان المقارنة (قبل وبعد).',
    themeStyle: {
      bgGradient: 'from-teal-950 via-slate-900 to-rose-950',
      modalBg: 'bg-slate-950 text-teal-50',
      borderAccent: 'border-teal-500/40',
      badgeBg: 'bg-teal-500/20',
      badgeText: 'text-teal-300 border-teal-500/30',
      accentColor: 'text-teal-400',
      buttonGradient: 'from-teal-600 to-rose-600 hover:from-teal-700 hover:to-rose-700',
      previewBoxBg: 'bg-teal-950/30 border-teal-500/30'
    },
    highlights: [
      { title: 'مقارنة قبل وبعد (Before & After)', desc: 'خاصية تفاعلية لعرض التغيير الجذري في المكان بعد التجديد.', icon: <Palette className="w-5 h-5 text-teal-400" /> },
      { title: 'كاثالوج أنماط الديكور', desc: 'أفكار ملهمة لتصميم الصالات، الغرف، والمطابخ.', icon: <Layout className="w-5 h-5 text-rose-400" /> },
      { title: 'باقات توزيع الإضاءة والفرش', desc: 'عرض خطط الاستغلال الأمثل للمساحات والأثاث.', icon: <Sparkles className="w-5 h-5 text-amber-400" /> },
      { title: 'طلب استشارة ديكور', desc: 'نموذج التواصل لتنفيذ أفكار الديكور المخصصة.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> }
    ],
    includedSections: ['معرض Before & After للتجديد', 'أنماط الديكور والمطبخ', 'باقات التأثيث والإضاءة', 'طلب تصميمك الخاص']
  },
  13: {
    id: 13,
    name: 'قالب أزياء وبوتيك فاخر (Haute Couture)',
    badge: 'أناقة وعلامة راقية ✨',
    categoryLabel: 'أزياء وموضة',
    targetAudience: 'المتاجر الراقية، بوتيكات الأزياء، مصممي الفساتين والإكسسوارات',
    detailedDescription: 'متجر إلكتروني راقي للأزياء الفاخرة والإكسسوارات مع اختيار الألوان والمقاسات، عربة تسوق ذكية، وتتبع حالات الطلب بدقة.',
    themeStyle: {
      bgGradient: 'from-purple-950 via-slate-900 to-rose-950',
      modalBg: 'bg-slate-950 text-purple-50',
      borderAccent: 'border-purple-500/40',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-300 border-purple-500/30',
      accentColor: 'text-purple-400',
      buttonGradient: 'from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700',
      previewBoxBg: 'bg-purple-950/30 border-purple-500/30'
    },
    highlights: [
      { title: 'اختيار المقاسات والألوان', desc: 'لوحة خيارات سهلة لتحديد اللون والمقاس المناسب.', icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
      { title: 'عربة تسوق ذكية', desc: 'إدارة المنتجات وإتمام الشراء بسلاسة.', icon: <Store className="w-5 h-5 text-rose-400" /> },
      { title: 'تتبع حالة الطلب', desc: 'تتبع مراحل تجهيز الطلب وشحنه للعميل.', icon: <Clock className="w-5 h-5 text-amber-400" /> },
      { title: 'معرض الألبسة و Lookbook', desc: 'صور جذابة وعالية الدقة لتشكيلات الأزياء.', icon: <Eye className="w-5 h-5 text-purple-300" /> }
    ],
    includedSections: ['الواجهة البوتيكية الملكية', 'تشكيلة الأزياء الجديدة', 'خيارات الألوان والمقاسات', 'عربة التسوق وتتبع الطلب']
  },
  14: {
    id: 14,
    name: 'متجر الأجهزة الإلكترونية والتقنية',
    badge: 'تكنولوجيا متطورة ⚡️',
    categoryLabel: 'إلكترونيات وتقنية',
    targetAudience: 'متاجر الجوالات، الحواسيب المحمولة، الإلكترونيات والأجهزة الذكية',
    detailedDescription: 'متجر إلكتروني متكامل ومتطور لأحدث الهواتف الذكية، الحواسيب المحمولة، والإلكترونيات مع خيارات السعة، الألوان، ومساعد ذكي.',
    themeStyle: {
      bgGradient: 'from-blue-950 via-slate-900 to-indigo-950',
      modalBg: 'bg-slate-950 text-blue-50',
      borderAccent: 'border-blue-500/40',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-300 border-blue-500/30',
      accentColor: 'text-blue-400',
      buttonGradient: 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
      previewBoxBg: 'bg-blue-950/30 border-blue-500/30'
    },
    highlights: [
      { title: 'خيارات السعة والألوان', desc: 'اختيار الذاكرة وسعة التخزين بسهولة.', icon: <Zap className="w-5 h-5 text-blue-400" /> },
      { title: 'مساعد تقني ذكي', desc: 'إجابة سريعة على مواصفات الأجهزة.', icon: <Sparkles className="w-5 h-5 text-indigo-400" /> },
      { title: 'مقارنة المواصفات والضمان', desc: 'عرض تفاصيل الضمان وسرعة الشحن.', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
      { title: 'عربة وسلة متطورة', desc: 'إضافة المنتجات وإتمام الطلب الفوري.', icon: <Store className="w-5 h-5 text-amber-400" /> }
    ],
    includedSections: ['أحدث الأجهزة والهواتف', 'مواصفات وسعات التخزين', 'المساعد الذكي للتقنية', 'سلة الشراء وضمان الجودة']
  },
  15: {
    id: 15,
    name: 'متجر العناية بالبشرة والجسم',
    badge: 'جمال طبيعي ونقاء 🌿',
    categoryLabel: 'عناية وجمال',
    targetAudience: 'متاجر مستحضرات التجميل، منتجات العناية الطبيعية، مراكز التجميل والعطور',
    detailedDescription: 'متجر جمالي متكامل لمنتجات العناية بالبشرة والجسم، مع ميزات التسوق السريع، إضافة للمفضلة، وتتبع حالة الطلبات والمنتجات الطبيعية.',
    themeStyle: {
      bgGradient: 'from-emerald-950 via-slate-900 to-teal-950',
      modalBg: 'bg-slate-950 text-emerald-50',
      borderAccent: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300 border-emerald-500/30',
      accentColor: 'text-emerald-400',
      buttonGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
      previewBoxBg: 'bg-emerald-950/30 border-emerald-500/30'
    },
    highlights: [
      { title: 'تصنيف المنتجات حسب نوع البشرة', desc: 'تسهيل وصول العملاء للمنتج المناسب.', icon: <Sparkles className="w-5 h-5 text-emerald-400" /> },
      { title: 'قائمة المفضلة السريعة', desc: 'حفظ المنتجات المفضلة للرجوع إليها لاحقاً.', icon: <Star className="w-5 h-5 text-amber-400" /> },
      { title: 'مكونات طبيعية 100%', desc: 'إبراز الفوائد والشهادات الطبيعية.', icon: <CheckCircle2 className="w-5 h-5 text-teal-400" /> },
      { title: 'تتبع وتنبيهات الطلب', desc: 'متابعة حالة شحن المنتجات بدقة.', icon: <Clock className="w-5 h-5 text-blue-400" /> }
    ],
    includedSections: ['مجموعات العناية بالبشرة', 'المنتجات الطبيعية والمفضلة', 'تفاصيل الاستخدام والفوائد', 'عربة التسوق والطلب']
  },
  16: {
    id: 16,
    name: 'قالب عيادة الأسنان المتقدمة',
    badge: 'رعاية صحية رفيعة 🦷',
    categoryLabel: 'صحة وعيادات',
    targetAudience: 'عيادات الأسنان، المراكز الطبية التخصصية، عيادات التجميل الطبي',
    detailedDescription: 'قالب طبي احترافي لعيادات ومراكز طب الأسنان يتيح للمرضى حجز المواعيد إلكترونياً، استعراض الخدمات الطبية، والتعرف على الفريق الطبي المتخصص.',
    themeStyle: {
      bgGradient: 'from-cyan-950 via-slate-900 to-blue-950',
      modalBg: 'bg-slate-950 text-cyan-50',
      borderAccent: 'border-cyan-500/40',
      badgeBg: 'bg-cyan-500/20',
      badgeText: 'text-cyan-300 border-cyan-500/30',
      accentColor: 'text-cyan-400',
      buttonGradient: 'from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700',
      previewBoxBg: 'bg-cyan-950/30 border-cyan-500/30'
    },
    highlights: [
      { title: 'حجز المواعيد أونلاين', desc: 'نظام سهل لاختيار الموعد والطبيب المناسب.', icon: <Clock className="w-5 h-5 text-cyan-400" /> },
      { title: 'استعراض الخدمات الطبية', desc: 'تفاصيل تقويم الأسنان، التبييض، والزراعة.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
      { title: 'فريق الأطباء الاستشاريين', desc: 'نبذة عن خبرات الأطباء والشهادات.', icon: <HardHat className="w-5 h-5 text-blue-400" /> },
      { title: 'آراء المرضى والابتسامة', desc: 'تقييمات وتجارب المرضى السابقين.', icon: <Star className="w-5 h-5 text-amber-400" /> }
    ],
    includedSections: ['حجز موعد عيادة أونلاين', 'الخدمات الطبية والتجميلية', 'الفريق الطبي الاستشاري', 'آراء المرضى ومعرض الحالات']
  }
};

export default function TemplateOverviewModal({ isOpen, onClose, template, onRequestSite }: TemplateOverviewModalProps) {
  const [activeTab12, setActiveTab12] = useState<'after' | 'before'>('after');
  const [selectedPizzaSize, setSelectedPizzaSize] = useState<'m' | 'l' | 'family'>('l');
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  if (!template) return null;
  const appLang = (localStorage.getItem('app_lang') as 'ar' | 'en') || 'ar';

  const templateIdNum = Number(template.id) || 1;
  const details = TEMPLATE_DETAILS_MAP[templateIdNum] || TEMPLATE_DETAILS_MAP[1];

  const displayName = appLang === 'en' ? (template.name || details.name) : details.name;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
          dir={appLang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Backdrop with category-based gradient blur */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className={`relative w-full max-w-3xl rounded-[2.5rem] border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${details.themeStyle.modalBg} ${details.themeStyle.borderAccent}`}
          >
            {/* Top Bar with Unique Color Accents */}
            <div className={`px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r ${details.themeStyle.bgGradient} ${details.themeStyle.borderAccent}`}>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${details.themeStyle.badgeBg} ${details.themeStyle.badgeText}`}>
                  {details.categoryLabel}
                </span>
                <span className={`px-3 py-1 bg-slate-900/80 text-white border border-slate-700/80 rounded-full text-xs font-extrabold flex items-center gap-1`}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{details.badge}</span>
                </span>
              </div>
              <button 
                onClick={onClose}
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-300 p-2 rounded-full border border-slate-700 transition-all cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 md:p-8 overflow-y-auto space-y-7">
              {/* Main Banner / Thumbnail & Header */}
              <div className={`flex flex-col md:flex-row gap-6 items-start p-6 rounded-3xl border ${details.themeStyle.previewBoxBg}`}>
                <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden border border-slate-700 shadow-xl relative group">
                  <img src={template.image} alt={displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-md">
                    #0{templateIdNum}
                  </span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                    {displayName}
                  </h2>
                  <div className={`text-xs font-extrabold px-3 py-1 rounded-xl inline-block border ${details.themeStyle.badgeBg} ${details.themeStyle.badgeText}`}>
                    🎯 مناسب لـ: {details.targetAudience}
                  </div>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                    {details.detailedDescription}
                  </p>
                </div>
              </div>

              {/* UNIQUE INTERACTIVE FEATURE DEMO CARD FOR EACH TEMPLATE */}
              {templateIdNum === 1 && (
                <div className="p-5 bg-gradient-to-r from-rose-950/60 to-amber-950/60 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4" /> معيانة واجهة قائمة الطعام الفاخرة (Menu Preview)
                    </span>
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold">
                      حجز طاولة أونلاين
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-amber-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-900/50 border border-amber-500/30 flex items-center justify-center text-lg">🍝</div>
                      <div>
                        <div className="font-extrabold text-amber-200">طبق فيتوتشيني ألفريدو بالكمأة (Fettuccine Truffle)</div>
                        <div className="text-slate-400 text-[11px]">مع صوص الكريمة الإيطالية الطازجة وجبن البارميزان</div>
                      </div>
                    </div>
                    <div className="text-left font-black text-amber-400 text-sm">8.50 د.أ</div>
                  </div>
                </div>
              )}

              {templateIdNum === 2 && (
                <div className="p-5 bg-gradient-to-r from-orange-950/80 to-amber-950/80 border border-orange-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" /> العروض اللحظية للوجبات السريعة (Fast Deal Banner)
                    </span>
                    <span className="text-[11px] bg-orange-500 text-slate-950 px-2.5 py-0.5 rounded-lg font-black animate-pulse">
                      خصم 35% 🔥
                    </span>
                  </div>
                  <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-orange-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-900/60 border border-orange-500/40 flex items-center justify-center text-lg">🍔</div>
                      <div>
                        <div className="font-extrabold text-white">وجبة كينج برجر دبل + بطاطس + كولا</div>
                        <div className="text-orange-300 text-[11px]">جاهزة للتوصيل السريع خلال 20 دقيقة</div>
                      </div>
                    </div>
                    <button className="bg-orange-500 hover:bg-orange-600 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs transition-all">
                      اطلب الآن
                    </button>
                  </div>
                </div>
              )}

              {templateIdNum === 3 && (
                <div className="p-5 bg-gradient-to-r from-red-950/70 to-emerald-950/70 border border-red-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-400 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4" /> محدد حجم البيتزا التفاعلي (Interactive Size Selector)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">توصيل عائلي ساخن 🛵</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { key: 'm', label: 'وسط 12 بوصة', price: '6.00 د.أ' },
                      { key: 'l', label: 'كبير 14 بوصة', price: '8.50 د.أ' },
                      { key: 'family', label: 'عائلي ضخم 16 بوصة', price: '11.00 د.أ' }
                    ].map(s => (
                      <button 
                        key={s.key}
                        onClick={() => setSelectedPizzaSize(s.key as any)}
                        className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                          selectedPizzaSize === s.key 
                            ? 'bg-red-600 text-white border-red-400 shadow-md' 
                            : 'bg-stone-900 text-slate-300 border-stone-800 hover:border-red-500/30'
                        }`}
                      >
                        <div>{s.label}</div>
                        <div className="text-[11px] opacity-90">{s.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {templateIdNum === 4 && (
                <div className="p-5 bg-gradient-to-r from-amber-950/80 to-stone-900 border border-amber-700/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4" /> مشروبات المقهى الدافئة والمخبوزات
                    </span>
                    <span className="text-[11px] text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-md border border-amber-700/50">
                      افتتاح صباحي 7:00 ص
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-stone-950/80 rounded-xl border border-amber-800/40 space-y-1">
                      <div className="font-extrabold text-amber-200">اسبريسو كابتشينو برغوة كلاسيكية</div>
                      <div className="text-slate-400 text-[11px]">حبوب بن محمصة بعناية</div>
                    </div>
                    <div className="p-3 bg-stone-950/80 rounded-xl border border-amber-800/40 space-y-1">
                      <div className="font-extrabold text-amber-200">كرواسون زبدة طازج يومياً</div>
                      <div className="text-slate-400 text-[11px]">مخبوز طازج في المقهى</div>
                    </div>
                  </div>
                </div>
              )}

              {templateIdNum === 5 && (
                <div className="p-5 bg-stone-900 border border-amber-600/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Coffee className="w-4 h-4" /> بطاقة مواصفات البن المختص (Specialty Bean Specs)
                    </span>
                    <span className="text-[11px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md border border-amber-600/30 font-extrabold">
                      تقييم: 88.5/100 ⭐️
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-stone-950 rounded-lg border border-amber-600/20 text-center">
                      <div className="text-slate-400">المحصول</div>
                      <div className="font-bold text-amber-200">اثيوبيا يورجاتشيف</div>
                    </div>
                    <div className="p-2 bg-stone-950 rounded-lg border border-amber-600/20 text-center">
                      <div className="text-slate-400">الإيحاءات</div>
                      <div className="font-bold text-amber-200">خوخ • ياسمين • عسل</div>
                    </div>
                    <div className="p-2 bg-stone-950 rounded-lg border border-amber-600/20 text-center">
                      <div className="text-slate-400">الارتفاع</div>
                      <div className="font-bold text-amber-200">1,950 متر</div>
                    </div>
                    <div className="p-2 bg-stone-950 rounded-lg border border-amber-600/20 text-center">
                      <div className="text-slate-400">المعالجة</div>
                      <div className="font-bold text-amber-200">مجففة لا هوائياً</div>
                    </div>
                  </div>
                </div>
              )}

              {templateIdNum === 6 && (
                <div className="p-5 bg-gradient-to-r from-pink-950/60 to-purple-950/60 border border-pink-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-pink-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> نموذج طلب كيك مخصص للمناسبات (Custom Cake Form)
                    </span>
                    <span className="text-[11px] text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full font-bold">
                      أعراس وأعياد ميلاد 🎉
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-pink-500/30 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-pink-200">اختر نكهتك المفضل:</div>
                      <div className="flex gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 bg-pink-900/60 text-pink-200 rounded-md border border-pink-500/30">فانيلا ورد</span>
                        <span className="px-2 py-0.5 bg-pink-900/60 text-pink-200 rounded-md border border-pink-500/30">شوكولاتة فادج</span>
                        <span className="px-2 py-0.5 bg-pink-900/60 text-pink-200 rounded-md border border-pink-500/30">ريد فيلفيت</span>
                      </div>
                    </div>
                    <span className="text-xs text-pink-300 font-bold">تجهيز خلال 24س</span>
                  </div>
                </div>
              )}

              {templateIdNum === 7 && (
                <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                      <Home className="w-4 h-4" /> مواصفات القصر العقاري (Luxury Property Specs)
                    </span>
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/30 font-bold">
                      شامل فيديو HD 🎥
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-950 rounded-lg border border-emerald-500/20 text-center">
                      <div className="text-slate-400">المساحة</div>
                      <div className="font-bold text-emerald-200">850 م² بناء</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-lg border border-emerald-500/20 text-center">
                      <div className="text-slate-400">الغرف والأسرة</div>
                      <div className="font-bold text-emerald-200">6 غرف نوم ماستر</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-lg border border-emerald-500/20 text-center">
                      <div className="text-slate-400">المرافق</div>
                      <div className="font-bold text-emerald-200">مسبح خاص + حديقة</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded-lg border border-emerald-500/20 text-center">
                      <div className="text-slate-400">نظام المنزل</div>
                      <div className="font-bold text-emerald-200">Smart Home كامل</div>
                    </div>
                  </div>
                </div>
              )}

              {templateIdNum === 8 && (
                <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950/80 border border-blue-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                      <Building className="w-4 h-4" /> فلاتر الشقق المتاحة للبيع والإيجار (Search Filter)
                    </span>
                    <span className="text-[11px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-500/30 font-bold">
                      حاسبة إيجار شهرية
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-blue-500/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-blue-200">شقة مودرن 3 غرف نوم - حي الهدوء</div>
                      <div className="text-slate-400 text-[11px]">مطبخ راكب • تكييف مركزي • كراج مغلق</div>
                    </div>
                    <div className="text-left font-black text-blue-400">450 د.أ / شهرياً</div>
                  </div>
                </div>
              )}

              {templateIdNum === 9 && (
                <div className="p-5 bg-gradient-to-r from-slate-900 to-sky-950/80 border border-sky-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> اعتماد خدمات التثمين العقاري الرسمية
                    </span>
                    <span className="text-[11px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-lg border border-sky-500/30 font-bold">
                      ترخيص رقم #8492
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-sky-500/30 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sky-200">تقرير تثمين عقاري معتمد للمؤسسات والبنوك</div>
                      <div className="text-slate-400 text-[11px]">دراسة الملاءة المالية والقيمة السوقية الدقيقة</div>
                    </div>
                    <button className="bg-sky-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs">
                      اطلب تقرير
                    </button>
                  </div>
                </div>
              )}

              {templateIdNum === 10 && (
                <div className="p-5 bg-gradient-to-r from-stone-900 to-amber-950/80 border border-yellow-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-yellow-400 flex items-center gap-1.5">
                      <HardHat className="w-4 h-4" /> دراسة وتسعير مشاريع المقاولات والبناء
                    </span>
                    <span className="text-[11px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-lg border border-yellow-500/40 font-bold">
                      عرض سعر خلال 48س
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 bg-stone-950 rounded-lg border border-yellow-500/20">
                      <div className="text-slate-400">بناء عظم</div>
                      <div className="font-bold text-yellow-300">خرسانة وحديد معتمد</div>
                    </div>
                    <div className="p-2 bg-stone-950 rounded-lg border border-yellow-500/20">
                      <div className="text-slate-400">تشطيب كامل</div>
                      <div className="font-bold text-yellow-300">ديكورات وسيراميك</div>
                    </div>
                    <div className="p-2 bg-stone-950 rounded-lg border border-yellow-500/20">
                      <div className="text-slate-400">تسليم مفتاح</div>
                      <div className="font-bold text-yellow-300">ضمان 10 سنوات</div>
                    </div>
                  </div>
                </div>
              )}

              {templateIdNum === 11 && (
                <div className="p-5 bg-gradient-to-r from-slate-900 to-cyan-950/80 border border-cyan-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" /> استعراض المخطط الهندي والتصميم ثلاثي الأبعاد 3D
                    </span>
                    <span className="text-[11px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-lg border border-cyan-500/30 font-bold">
                      نموذج CAD تفاعلي
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-cyan-200">واجهة مودرن مع استغلال زوايا الإضاءة الطبيعية</div>
                      <div className="text-slate-400 text-[11px]">مخططات كهرباء، سباكة، ودراسة أحمال كاملة</div>
                    </div>
                    <span className="text-xs text-cyan-300 font-bold">جلسة زوم 3D</span>
                  </div>
                </div>
              )}

              {templateIdNum === 12 && (
                <div className="p-5 bg-gradient-to-r from-teal-950/80 to-rose-950/80 border border-teal-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-teal-300 flex items-center gap-1.5">
                      <Palette className="w-4 h-4" /> استعراض قبل وبعد التعديل (Before & After Slider)
                    </span>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-teal-500/30 text-[11px]">
                      <button 
                        onClick={() => setActiveTab12('after')}
                        className={`px-2.5 py-0.5 rounded-md font-bold transition-all ${activeTab12 === 'after' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                      >
                        بعد التجديد ✨
                      </button>
                      <button 
                        onClick={() => setActiveTab12('before')}
                        className={`px-2.5 py-0.5 rounded-md font-bold transition-all ${activeTab12 === 'before' ? 'bg-rose-900 text-rose-200' : 'text-slate-400'}`}
                      >
                        قبل التعديل 🏚️
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-teal-500/30 text-xs">
                    {activeTab12 === 'after' ? (
                      <div className="text-teal-200 font-bold flex items-center justify-between">
                        <span>إضاءة مخفية مودرن + أثاث بديل الخشب رخامي فاخر</span>
                        <span className="text-xs text-emerald-400">تحول كلي 100%</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 font-medium">
                        مساحة قديمة مع إضاءة خافتة وديكورات تقليدية سابقة
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Unique Key Highlights Grid */}
              <div className="space-y-3">
                <h3 className="text-sm md:text-base font-black flex items-center gap-2">
                  <Sparkles className={`w-5 h-5 ${details.themeStyle.accentColor}`} />
                  <span>المميزات التخصصية لهذا القالب:</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {details.highlights.map((feat, idx) => (
                    <div key={idx} className={`bg-slate-900/80 border hover:border-slate-600 rounded-2xl p-4 flex items-start gap-3.5 shadow-md transition-all ${details.themeStyle.borderAccent}`}>
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-slate-950 border ${details.themeStyle.borderAccent}`}>
                        {feat.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs md:text-sm">{feat.title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed font-medium">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Included Sections Badges */}
              <div className="space-y-3 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-black flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>الأقسام الجاهزة المضمنة داخل القالب:</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {details.includedSections.map((sec, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{sec}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Guarantee Bar */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <span>
                  يشمل لوحة تحكم كاملة باللغة العربية للتحكم بالمنتجات، الأسعار، الصور، والطلبات بكل يسر وسهولة بدون أي خبرة برمجية.
                </span>
              </div>

              {/* Action Buttons Footer */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col text-center sm:text-right">
                  <span className="text-slate-400 font-bold text-xs">تكلفة القالب والتفعيل (خطة مجانية وباقات المنصة):</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400">
                    متاح بالخطة المجانية والباقات المتاحة 🌟
                  </span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-center">
                  <button 
                    onClick={() => setIsPlansModalOpen(true)}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer border border-blue-500/30 flex items-center gap-1.5"
                  >
                    <span>عرض الباقات 🏷️</span>
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-8 py-3 rounded-xl transition-all cursor-pointer border border-slate-700"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Plans Modal inside Template Overview */}
      {isPlansModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md" dir="rtl">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">باقات المنصة الرسمية</span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">اختر الباقة المناسبة للدخول لمعاينة القالب ({displayName}) وتعديله</h3>
              </div>
              <button 
                onClick={() => setIsPlansModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {getSubscriptionPlans().map((plan, idx) => (
                <div key={`overview-plan-${plan.id}-${idx}`} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${plan.popular ? 'bg-blue-950/40 border-blue-500/50 shadow-lg ring-2 ring-blue-500/20' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="space-y-3">
                    {plan.popular && <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">الأكثر طلباً واحترافية</span>}
                    <h4 className="font-black text-white text-sm sm:text-base">{plan.name}</h4>
                    <div className="text-xl font-black text-blue-400">{plan.price} <span className="text-xs font-medium text-slate-400">/ {plan.duration}</span></div>
                    <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                      {plan.features.map((f, i) => (
                        <li key={`overview-feat-${plan.id}-${i}`} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.setItem('selectedPlanId', plan.id);
                      localStorage.setItem('selected_plan_checkout', JSON.stringify(plan));
                      setIsPlansModalOpen(false);
                      onClose();
                      onRequestSite(template.id);
                    }}
                    className="mt-5 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                  >
                    تحديد الباقة والدخول للمعاينة والتعديل 🎨
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">سيتم نقل للمعاينة والتعديل فوراً، ويمكنك تعديل القالب بالكامل ثم الضغط على "اشتراك" داخل المحرر.</span>
              <button 
                onClick={() => setIsPlansModalOpen(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
