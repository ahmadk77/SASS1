import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Tailwind,
  Preview,
} from '@react-email/components';

interface WelcomeEmailProps {
  ownerName?: string;
  dashboardUrl?: string;
}

export const WelcomeEmail = ({
  ownerName = 'عميلنا العزيز',
  dashboardUrl = 'https://bunyan.website/dashboard',
}: WelcomeEmailProps) => {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>أهلاً بك في منصة بنيان - مساحتك وسندك الرقمي متكامل الآن! 🎉</Preview>
      <Tailwind>
        <Body className="bg-slate-950 text-slate-100 font-sans p-4">
          <Container className="mx-auto my-8 p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl shadow-2xl dir-rtl text-right">
            {/* Official Logo Header */}
            <Section className="text-center mb-8 pb-6 border-b border-slate-800">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', direction: 'ltr' }}>
                <svg width="48" height="48" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                  <defs>
                    <linearGradient id="welcBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0066FF" />
                      <stop offset="1" stopColor="#002999" />
                    </linearGradient>
                    <linearGradient id="welcTop" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="1" stopColor="#E2E8F0" />
                    </linearGradient>
                    <linearGradient id="welcLeft" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#CBD5E1" />
                      <stop offset="1" stopColor="#94A3B8" />
                    </linearGradient>
                    <linearGradient id="welcRight" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#E2E8F0" />
                      <stop offset="1" stopColor="#CBD5E1" />
                    </linearGradient>
                  </defs>
                  <rect width="120" height="120" rx="30" fill="url(#welcBg)" />
                  <g transform="translate(0, 18)">
                    <path d="M60 52 L90 67 L60 82 L30 67 Z" fill="url(#welcTop)" />
                    <path d="M30 67 L60 82 L60 94 L30 79 Z" fill="url(#welcLeft)" />
                    <path d="M60 82 L90 67 L90 79 L60 94 Z" fill="url(#welcRight)" />
                  </g>
                  <g transform="translate(0, 3)">
                    <path d="M60 38 L84 50 L60 62 L36 50 Z" fill="url(#welcTop)" />
                    <path d="M36 50 L60 62 L60 71 L36 59 Z" fill="url(#welcLeft)" />
                    <path d="M60 62 L84 50 L84 59 L60 71 Z" fill="url(#welcRight)" />
                  </g>
                  <g transform="translate(0, -9)">
                    <path d="M60 26 L74 33 L60 40 L46 33 Z" fill="url(#welcTop)" />
                    <path d="M46 33 L60 40 L60 46 L46 39 Z" fill="url(#welcLeft)" />
                    <path d="M60 40 L74 33 L74 39 L60 46 Z" fill="url(#welcRight)" />
                  </g>
                </svg>
                <div style={{ textAlign: 'left', lineHeight: '1' }}>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.5px', fontFamily: 'Arial, sans-serif' }}>
                    BUNYAN
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#3B82F6', letterSpacing: '3px', marginTop: '3px', fontFamily: 'Arial, sans-serif' }}>
                    COMMERCE
                  </div>
                </div>
              </div>
            </Section>

            {/* Title Section */}
            <Section className="text-center mb-8 pb-4">
              <Heading className="text-3xl font-black text-white mb-3">
                أهلاً بك في منصة بنيان، شريكك الرقمي للنجاح 🚀
              </Heading>
              <Text className="text-slate-300 text-base leading-relaxed">
                مرحباً {ownerName}، يسعدنا انضمامك إلينا! 🎉
              </Text>
              <Text className="text-slate-300 text-sm leading-relaxed mt-4">
                الآن يمكنك إعداد مساحة عملك الرقمية في دقائق، وإدارة مواردك بكل سهولة، وتوسيع نطاق أعمالك، كل ذلك من مكان واحد.
              </Text>
            </Section>

            {/* Platform Services Overview */}
            <Section className="mb-8 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
              <Heading className="text-lg font-bold text-blue-400 mb-4 text-right">
                ✨ ماذا تقدم لك منصة بنيان؟
              </Heading>
              <Text className="text-slate-200 text-sm mb-3 leading-relaxed">
                🚀 <strong>متاجر ومواقع متكاملة:</strong> إمكانية إنشاء وتخصيص موقعك أو متجرك الإلكتروني فوراً وبدون الحاجة لخبرة برمجية.
              </Text>
              <Text className="text-slate-200 text-sm mb-3 leading-relaxed">
                📊 <strong>لوحة تحكم ذكية:</strong> متابعة الطلبات، إدارة المنتجات، وتحليل الأداء بسهولة ومن مكان واحد.
              </Text>
              <Text className="text-slate-200 text-sm mb-3 leading-relaxed">
                💳 <strong>وسائل دفع ودومين خاص:</strong> ربط سلس مع PayPal والبطاقات، مع خيار إضافة دومينك الخاص (Custom Domain).
              </Text>
              <Text className="text-slate-200 text-sm leading-relaxed">
                🎁 <strong>تجربة مجانية كاملة:</strong> 3 أيام تجربة مجانية لاستكشاف كافة أدوات ومميزات المنصة بدون أي التزام.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section className="text-center my-8">
              <Button
                href={dashboardUrl}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-base block text-center shadow-lg"
              >
                الدخول إلى لوحة التحكم الآن 🚀
              </Button>
            </Section>

            {/* Footer */}
            <Section className="mt-8 border-t border-slate-800 pt-6 text-center">
              <Text className="text-slate-500 text-xs">
                إذا كان لديك أي استفسارات أو احتجت لأي مساعدة، يمكنك الرد على هذه الرسالة مباشرة وسيقوم فريق الدعم بمساعدتك.
              </Text>
              <Text className="text-slate-600 text-xs mt-2">
                © جميع الحقوق محفوظة - منصة بنيان الرقمية
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
