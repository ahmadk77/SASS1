import { handleWhatsAppAction } from '../lib/whatsapp';
import { submitLead } from '../lib/leads';
import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface TemplateProps {
  content: any;
  tenant: any;
}

export default function RestaurantTemplate({ tenant, content }: TemplateProps) {
  const primaryColor = content?.primaryColor || '#e11d48';
  const secondaryColor = content?.secondaryColor || '#f43f5e';
  const textColor = content?.textColor || '#1c1917';
  const fontFamily = content?.fontFamily || 'Cairo';
  const metaTitle = content?.metaTitle || content?.businessName || tenant.name;
  const metaDescription = content?.metaDescription || content?.heroSubtitle || '';
  
  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        {content?.logoUrl && <meta property="og:image" content={content?.logoUrl} />}
        
        {/* Google Fonts Injection */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={`https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;500;700&display=swap`} rel="stylesheet" />
      </Helmet>

      <div 
        className="min-h-screen bg-stone-50" 
        dir="rtl"
        style={{ fontFamily: `"${fontFamily}", sans-serif`, color: textColor }}
      >
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {content?.logoUrl && (
                <img src={content?.logoUrl} alt="Logo" className="h-10 object-contain" />
              )}
              <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                {content?.businessName || tenant.name}
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6 font-medium">
              <a href="#home" className="opacity-80 hover:opacity-100 transition">الرئيسية</a>
              <a href="#menu" className="opacity-80 hover:opacity-100 transition">قائمة الطعام</a>
              <a href="#contact" className="opacity-80 hover:opacity-100 transition">تواصل معنا</a>
            </nav>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          {content?.showHero !== false && (
          <section 
            id="home"
            className="relative py-24 px-4 flex items-center justify-center text-center overflow-hidden"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="absolute inset-0 bg-black/10 z-0"></div>
            <div className="relative z-10 max-w-3xl text-white">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {content?.heroTitle || 'مرحباً بك في مطعمنا'}
              </h2>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                {content?.heroSubtitle || 'أفضل تجربة طعام تنتظرك'}
              </p>
              <a 
                href="#menu" 
                className="inline-block bg-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105"
                style={{ color: primaryColor }}
              >
                استعرض القائمة
              </a>
            </div>
          </section>
          )}

          {/* Menu Section */}
          {content?.showMenu !== false && content?.showProducts !== false && content?.showGallery !== false && (
          <section id="menu" className="py-20 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: primaryColor }}>قائمة الطعام</h2>
                <div className="h-1 w-24 mx-auto rounded" style={{ backgroundColor: secondaryColor }}></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {content?.menuItems && content?.menuItems.length > 0 ? (
                  content?.menuItems.map((item, idx) => (
                    <article key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold">{item.name}</h3>
                          <span className="font-bold text-lg" style={{ color: secondaryColor }}>{item.price}</span>
                        </div>
                        <p className="opacity-80">{item.description}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-center col-span-full opacity-60">القائمة فارغة حالياً</p>
                )}
              </div>
            </div>
          </section>
          )}
        </main>

        {/* Footer */}
        {content?.showContact !== false && content?.showFooter !== false && (
        <footer id="contact" className="bg-stone-900 text-stone-400 py-12 px-4 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {content?.logoUrl && (
              <img src={content?.logoUrl} alt="Logo" className="h-12 object-contain mb-4" />
            )}
            <h2 className="text-2xl font-bold text-white mb-4">{content?.businessName || tenant.name}</h2>
            
            <div className="mb-8 space-y-2">
              <p className="whitespace-pre-wrap">{content?.address || 'المملكة العربية السعودية'}</p>
              <p className="whitespace-pre-wrap">{content?.businessHours || 'تواصل معنا عبر الهاتف أو قم بزيارتنا في فروعنا.'}</p>
              {content?.phoneNumber && <p dir="ltr">{content?.phoneNumber}</p>}
              {content?.whatsappNumber && <p dir="ltr" className="text-green-500">واتساب: {content?.whatsappNumber}</p>}
            </div>

            <div className="border-t border-stone-800 w-full pt-6 text-sm">
              &copy; {new Date().getFullYear()} {content?.businessName || tenant.name}. جميع الحقوق محفوظة.
            </div>
          </div>
        </footer>
        )}
      </div>
    </>
  );
}
