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

interface TemplateUpdateEmailProps {
  userName?: string;
  templateName?: string;
  templateDescription?: string;
  previewUrl?: string;
}

export const TemplateUpdateEmail = ({
  userName = 'عميلنا العزيز',
  templateName = 'قالب جديد متميز',
  templateDescription = 'تم إطلاق قالب جديد مصمم بأعلى معايير الجودة ومناسب لمختلف الأنشطة التجارية.',
  previewUrl = 'https://bunyan.website/templates',
}: TemplateUpdateEmailProps) => {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>🎉 قالب جديد متوفر الآن على منصة بنيان: {templateName}</Preview>
      <Tailwind>
        <Body className="bg-slate-950 text-slate-100 font-sans p-4">
          <Container className="mx-auto my-8 p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl shadow-2xl dir-rtl text-right">
            {/* Header / Logo */}
            <Section className="text-center mb-8 pb-6 border-b border-slate-800">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', direction: 'ltr' }}>
                <svg width="44" height="44" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                  <defs>
                    <linearGradient id="tplBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0066FF" />
                      <stop offset="1" stopColor="#002999" />
                    </linearGradient>
                    <linearGradient id="tplTop" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="1" stopColor="#E2E8F0" />
                    </linearGradient>
                  </defs>
                  <rect width="120" height="120" rx="30" fill="url(#tplBg)" />
                  <g transform="translate(0, 18)">
                    <path d="M60 52 L90 67 L60 82 L30 67 Z" fill="url(#tplTop)" />
                  </g>
                </svg>
                <div style={{ textAlign: 'left', lineHeight: '1' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.5px', fontFamily: 'Arial, sans-serif' }}>
                    BUNYAN
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#3B82F6', letterSpacing: '3px', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>
                    TEMPLATES
                  </div>
                </div>
              </div>
            </Section>

            {/* Title Section */}
            <Section className="text-center mb-8 pb-4">
              <Heading className="text-2xl font-black text-white mb-3">
                🎨 إطلاق قالب جديد: {templateName}
              </Heading>
              <Text className="text-slate-300 text-base leading-relaxed">
                مرحباً {userName}، يسعدنا أن نعلن لك عن توفر قالب جديد في مكتبة تصاميم بنيان!
              </Text>
            </Section>

            {/* Template Description Box */}
            <Section className="mb-8 bg-slate-950/70 p-6 rounded-xl border border-slate-800">
              <Heading className="text-base font-bold text-blue-400 mb-2 text-right">
                ✨ مميزات القالب الجديد:
              </Heading>
              <Text className="text-slate-200 text-sm leading-relaxed mb-4">
                {templateDescription}
              </Text>
              <Text className="text-slate-400 text-xs leading-relaxed">
                يمكنك معاينة القالب فوراً وتطبيقه على متجرك أو موقعك بنقرة زر واحدة.
              </Text>
            </Section>

            {/* Action Button */}
            <Section className="text-center my-8">
              <Button
                href={previewUrl}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-base block text-center shadow-lg"
              >
                معاينة واستخدام القالب الجديد 🚀
              </Button>
            </Section>

            {/* Footer */}
            <Section className="mt-8 border-t border-slate-800 pt-6 text-center">
              <Text className="text-slate-500 text-xs">
                تصلك هذه الرسالة لأنك مشترك في منصة بنيان. إذا كنت ترغب في عدم تلقي تحديثات القوالب، يمكنك تعديل تفضيلات الإشعارات من لوحة التحكم.
              </Text>
              <Text className="text-slate-600 text-xs mt-2">
                © منصة بنيان - جميع الحقوق محفوظة
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TemplateUpdateEmail;
