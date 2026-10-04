import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CreditCard, Wallet, ChevronDown } from 'lucide-react';

export default function PricingSection() {
  const appLang = (localStorage.getItem('app_lang') as 'ar' | 'en') || 'ar';
  const [showPaymentGateways, setShowPaymentGateways] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'cards' | 'wallets' | 'global'>('all');

  const gateways = [
    {
      id: 'stripe',
      type: 'cards',
      title: 'Stripe Secure Checkout',
      badge: 'Visa / Mastercard / Apple Pay',
      desc: appLang === 'en' ? 'Global secure payment gateway with Visa, Mastercard & Apple Pay.' : 'بوابة الدفع الآمنة العالمية عبر فيزا، ماستركارد وأبل باي.',
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      iconBg: 'bg-indigo-600 text-white',
      tag: 'معتمد وآمن 100%'
    },
    {
      id: 'paypal',
      type: 'global',
      title: 'PayPal Secure Checkout',
      badge: 'الدفع الدولي',
      desc: appLang === 'en' ? 'Global payment gateway supporting USD/EUR subscriptions worldwide.' : 'الدفع الدولي السريع عبر حساب باي بال أو بطاقات الائتمان العالمية.',
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      iconBg: 'bg-blue-600 text-white',
      tag: 'حماية المشتري العالمية'
    },
    {
      id: 'wallets',
      type: 'wallets',
      title: 'المحافظ الذكية (زين كاش وأورانج)',
      badge: 'المحافظ الإلكترونية',
      desc: appLang === 'en' ? 'Instant mobile wallet payments for regional subscriptions.' : 'ادفع بسهولة وسرعة من خلال محافظ الهواتف الذكية المحلية.',
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      iconBg: 'bg-amber-500 text-white',
      tag: 'تفعيل فوري خلال ثوانٍ'
    },
    {
      id: 'card',
      type: 'cards',
      title: 'البطاقات البنكية المباشرة',
      badge: 'Visa / MasterCard',
      desc: appLang === 'en' ? 'Secure direct credit card processing with PCI-DSS encryption.' : 'معالجة مشفرة آمنة لبطاقات فيزا وماستركارد ومختلف البطاقات.',
      bg: 'bg-purple-50 border-purple-200 text-purple-800',
      iconBg: 'bg-purple-600 text-white',
      tag: 'تشفير 256-bit SSL'
    }
  ];

  const filteredGateways = gateways.filter(g => activeTab === 'all' || g.type === activeTab);

  const handleToggle = () => {
    const nextState = !showPaymentGateways;
    setShowPaymentGateways(nextState);

    if (nextState) {
      setTimeout(() => {
        const el = document.getElementById('payment-gateways-showcase');
        if (el) {
          const yOffset = -80; // Smooth offset so header isn't cut off
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 120);
    }
  };

  return (
    <div id="pricing" className="w-full max-w-7xl mx-auto pt-10 sm:pt-16 px-3 sm:px-4 pb-12 sm:pb-16" dir={appLang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-bold mb-3 border border-slate-800 shadow-xs">
          <ShieldCheck size={15} className="text-emerald-400" />
          <span>{appLang === 'en' ? 'Secure Payment Gateways & Subscriptions' : 'بوابات الدفع الآمنة ونظام الاشتراكات الفورية'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-4 leading-tight">
          {appLang === 'en' ? 'Flexible Payment Methods & Instant Activation' : 'طرق دفع متعددة وتفعيل فوري للاشتراكات'}
        </h2>
        <p className="text-slate-600 text-xs sm:text-base md:text-lg max-w-3xl mx-auto leading-relaxed px-2">
          {appLang === 'en' 
            ? 'Customize your template in the editor, click "Save & Pay", and instantly choose your preferred payment gateway to activate your subscription directly in your account and admin panel.'
            : 'قم بتخصيص قالبك حسب رغبتك في محرر الموقع، ثم انقر على "حفظ واشتراك مدفوع"، واختر بوابة الدفع المفضلة لديك ليتم تفعيل اشتراكك وقالبك فوراً في حسابك ولوحة الإدارة.'
          }
        </p>

        {/* Toggle Button for Payment Methods */}
        <div className="mt-6 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleToggle}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer border border-slate-800"
          >
            <Wallet size={18} className="text-emerald-400" />
            <span>
              {showPaymentGateways 
                ? (appLang === 'en' ? 'Hide Payment Gateways' : 'إخفاء طرق الدفع') 
                : (appLang === 'en' ? 'Show Payment Methods' : 'عرض طرق الدفع المتاحة')}
            </span>
            <motion.div
              animate={{ rotate: showPaymentGateways ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ChevronDown size={18} className="text-slate-300" />
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Expandable Payment Gateways Section with Smooth Framer Motion Animation */}
      <AnimatePresence initial={false}>
        {showPaymentGateways && (
          <motion.div
            id="payment-gateways-showcase"
            key="payment-gateways-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="pt-2"
            >
              {/* Filter Tabs */}
              <div className="flex justify-center gap-1.5 sm:gap-2 mb-6 flex-wrap px-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeTab === 'all' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {appLang === 'en' ? 'All Methods' : 'جميع طرق الدفع'}
                </button>
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeTab === 'cards' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {appLang === 'en' ? 'Cards & Mada' : 'بطاقات البنوك ومدى'}
                </button>
                <button
                  onClick={() => setActiveTab('wallets')}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeTab === 'wallets' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {appLang === 'en' ? 'Digital Wallets' : 'المحافظ الرقمية'}
                </button>
                <button
                  onClick={() => setActiveTab('global')}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    activeTab === 'global' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {appLang === 'en' ? 'International' : 'الدفع الدولي'}
                </button>
              </div>

              {/* Payment Gateways Showcase Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                {filteredGateways.map((gw, index) => (
                  <motion.div 
                    key={gw.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-xs ${gw.iconBg} shadow-xs`}>
                          {gw.id === 'tap' && 'TAP'}
                          {gw.id === 'paypal' && 'PP'}
                          {gw.id === 'wallets' && <Wallet size={20} />}
                          {gw.id === 'card' && <CreditCard size={20} />}
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {gw.badge}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">{gw.title}</h3>
                      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                        {gw.desc}
                      </p>
                    </div>

                    <div className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border ${gw.bg}`}>
                      <ShieldCheck size={16} />
                      <span>{gw.tag}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow Explanation Banner */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <h3 className="text-xl sm:text-3xl font-black mb-3 sm:mb-4">كيف يعمل نظام التخصيص والدفع والاشتراك؟</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center mb-2.5 sm:mb-3">1</span>
              <h4 className="font-bold text-xs sm:text-sm mb-1">اختر وقصص قالبك</h4>
              <p className="text-xs text-slate-300 leading-relaxed">ادخل على محرر القالب وأضف منتجاتك وصورك وألوانك بحرية.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center mb-2.5 sm:mb-3">2</span>
              <h4 className="font-bold text-xs sm:text-sm mb-1">حفظ واشتراك مدفوع</h4>
              <p className="text-xs text-slate-300 leading-relaxed">انقر على زر الحفظ والدفع واختر بوابة الدفع المفضلة لدفع رسوم الاشتراك.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10">
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center mb-2.5 sm:mb-3">3</span>
              <h4 className="font-bold text-xs sm:text-sm mb-1">تفعيل فوري ومباشر</h4>
              <p className="text-xs text-slate-300 leading-relaxed">يظهر الاشتراك في حسابك بالقائمة الجانبية وفي لوحة الإدارة تلقائياً دون إعادة تحميل.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
