import React, { useState, useEffect } from 'react';
import { Shield, FileText, Smartphone, HelpCircle, X } from 'lucide-react';
import SupportWidget from './SupportWidget';

export default function SiteFooter({ content, tenant, templateId }: { content: any, tenant: any, templateId?: number }) {
  const tId = Number(templateId || tenant?.templateId || 1);
  const isEcommerce = tId === 13 || tId === 14 || tId === 15;
  const hasLinks = content?.privacyPolicyText || content?.termsText || content?.iosAppUrl || content?.androidAppUrl;
  
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  // Prevent scrolling when modal is open
  useEffect(() => {
    const openPrivacy = () => setActiveModal('privacy');
    const openTerms = () => setActiveModal('terms');
    window.addEventListener('open-privacy', openPrivacy);
    window.addEventListener('open-terms', openTerms);
    return () => {
      window.removeEventListener('open-privacy', openPrivacy);
      window.removeEventListener('open-terms', openTerms);
    };
  }, []);

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeModal]);
  
  return (
    <>
      <footer className="bg-gray-50 border-t border-gray-200 py-12" dir="rtl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
              {true && (
                <button 
                  onClick={() => setActiveModal('privacy')}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-indigo-600 gap-2 cursor-pointer"
                >
                  <Shield size={24} />
                  <span className="text-[10px] font-bold">سياسة الخصوصية</span>
                </button>
              )}
              {true && (
                <button 
                  onClick={() => setActiveModal('terms')}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-indigo-600 gap-2 cursor-pointer"
                >
                  <FileText size={24} />
                  <span className="text-[10px] font-bold">شروط الخدمة</span>
                </button>
              )}
              
              {isEcommerce && (
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget'))}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-indigo-600 gap-2 cursor-pointer"
                >
                  <HelpCircle size={24} />
                  <span className="text-[10px] font-bold">طلب مساعدة</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {content?.iosAppUrl && (
                <a 
                  href={content.iosAppUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Smartphone size={20} />
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] opacity-80 uppercase leading-tight">Download on the</span>
                    <span className="text-xs font-bold leading-tight">App Store</span>
                  </div>
                </a>
              )}
              {content?.androidAppUrl && (
                <a 
                  href={content.androidAppUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Smartphone size={20} />
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] opacity-80 uppercase leading-tight">GET IT ON</span>
                    <span className="text-xs font-bold leading-tight">Google Play</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
      
      {/* Modals for Privacy / Terms */}
      {activeModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[190] animate-in fade-in duration-300" onClick={() => setActiveModal(null)} />
          <div className="fixed top-0 bottom-0 right-0 w-full md:w-[450px] z-[200] bg-white flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300" dir="rtl">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm sticky top-0">
            <h2 className="text-lg font-bold text-gray-900">
              {activeModal === 'privacy' ? 'سياسة الخصوصية' : 'شروط الخدمة'}
            </h2>
            <button 
              onClick={() => setActiveModal(null)} 
              className="p-2 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full shadow-sm border border-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-12">
            <div className="max-w-3xl mx-auto whitespace-pre-wrap text-sm md:text-base text-gray-700 leading-relaxed font-medium">
              {activeModal === 'privacy' ? (content?.privacyPolicyText || `سياسة الخصوصية:

نحن نهتم بخصوصيتك. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية معلوماتك الشخصية عند استخدامك لموقعنا.

1. جمع المعلومات:
نقوم بجمع المعلومات التي تقدمها لنا مباشرة، مثل عند إنشاء حساب، أو تقديم طلب، أو التواصل معنا.

2. استخدام المعلومات:
نستخدم معلوماتك لتحسين خدماتنا، وتخصيص تجربتك، ومعالجة طلباتك، والتواصل معك بخصوص التحديثات والعروض.

3. حماية المعلومات:
نحن نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو الإفصاح.

4. مشاركة المعلومات:
لا نقوم ببيع أو تأجير معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك مع شركاء موثوقين فقط لتقديم الخدمات لك.

5. حقوقك:
يحق لك الوصول إلى معلوماتك الشخصية وتصحيحها أو حذفها في أي وقت.

لأي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر نموذج طلب المساعدة.`) : (content?.termsText || `شروط الخدمة:

مرحباً بك في موقعنا. باستخدامك لهذا الموقع، فإنك توافق على الامتثال للشروط والأحكام التالية:

1. قبول الشروط:
يُعد استخدامك للموقع موافقة صريحة على هذه الشروط. إذا كنت لا توافق عليها، يرجى التوقف عن استخدام الموقع.

2. استخدام الموقع:
يجب استخدام الموقع لأغراض قانونية فقط. يُمنع استخدام الموقع بأي طريقة قد تتسبب في ضرر للموقع أو تعطيل وصول الآخرين إليه.

3. الملكية الفكرية:
جميع المحتويات المتوفرة على الموقع، بما في ذلك النصوص والرسومات والشعارات، هي ملكية حصرية لنا ومحمية بموجب قوانين حقوق الطبع والنشر.

4. المنتجات والخدمات:
نسعى لتقديم معلومات دقيقة حول منتجاتنا وخدماتنا. ومع ذلك، نحتفظ بالحق في تعديل الأسعار أو إيقاف أي منتج في أي وقت دون إشعار مسبق.

5. إخلاء المسؤولية:
نحن لا نتحمل المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام أو عدم القدرة على استخدام الموقع.

6. التعديلات:
نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم نشر التغييرات على هذه الصفحة، ويُعتبر استمرارك في استخدام الموقع موافقة على الشروط المعدلة.`)}
            </div>
          </div>
        </div>
        </>
      )}
      
      {isEcommerce && (
        <SupportWidget tenant={tenant} primaryColor={content?.primaryColor || '#000000'} />
      )}
    </>
  );
}
