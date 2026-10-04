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

interface SubscriptionReminderEmailProps {
  tenantName?: string;
  renewalDate?: string;
  renewalUrl?: string;
}

export const SubscriptionReminderEmail = ({
  tenantName = 'عميلنا العزيز',
  renewalDate = 'خلال 3 أيام',
  renewalUrl = 'https://bunyan.website/billing',
}: SubscriptionReminderEmailProps) => {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>تنبيه هام: اشتراكك في المنصة سينتهي قريباً ⚠️</Preview>
      <Tailwind>
        <Body className="bg-slate-950 text-slate-100 font-sans p-4">
          <Container className="mx-auto my-8 p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl shadow-2xl dir-rtl text-right">
            {/* Official Logo Header */}
            <Section className="text-center mb-6 pb-6 border-b border-slate-800">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', direction: 'ltr' }}>
                <svg width="44" height="44" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                  <defs>
                    <linearGradient id="remBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0066FF" />
                      <stop offset="1" stopColor="#002999" />
                    </linearGradient>
                    <linearGradient id="remTop" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="1" stopColor="#E2E8F0" />
                    </linearGradient>
                    <linearGradient id="remLeft" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#CBD5E1" />
                      <stop offset="1" stopColor="#94A3B8" />
                    </linearGradient>
                    <linearGradient id="remRight" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#E2E8F0" />
                      <stop offset="1" stopColor="#CBD5E1" />
                    </linearGradient>
                  </defs>
                  <rect width="120" height="120" rx="30" fill="url(#remBg)" />
                  <g transform="translate(0, 18)">
                    <path d="M60 52 L90 67 L60 82 L30 67 Z" fill="url(#remTop)" />
                    <path d="M30 67 L60 82 L60 94 L30 79 Z" fill="url(#remLeft)" />
                    <path d="M60 82 L90 67 L90 79 L60 94 Z" fill="url(#remRight)" />
                  </g>
                  <g transform="translate(0, 3)">
                    <path d="M60 38 L84 50 L60 62 L36 50 Z" fill="url(#remTop)" />
                    <path d="M36 50 L60 62 L60 71 L36 59 Z" fill="url(#remLeft)" />
                    <path d="M60 62 L84 50 L84 59 L60 71 Z" fill="url(#remRight)" />
                  </g>
                  <g transform="translate(0, -9)">
                    <path d="M60 26 L74 33 L60 40 L46 33 Z" fill="url(#remTop)" />
                    <path d="M46 33 L60 40 L60 46 L46 39 Z" fill="url(#remLeft)" />
                    <path d="M60 40 L74 33 L74 39 L60 46 Z" fill="url(#remRight)" />
                  </g>
                </svg>
                <div style={{ textAlign: 'left', lineHeight: '1' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.5px', fontFamily: 'Arial, sans-serif' }}>
                    BUNYAN
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#3B82F6', letterSpacing: '3px', marginTop: '3px', fontFamily: 'Arial, sans-serif' }}>
                    COMMERCE
                  </div>
                </div>
              </div>
            </Section>

            <Section className="text-center mb-6 pb-2">
              <Heading className="text-2xl font-black text-amber-400 mb-3">
                تنبيه هام: اقتراب انتهاء الاشتراك ⚠️
              </Heading>
              <Text className="text-slate-200 text-base leading-relaxed">
                مرحباً {tenantName}،
              </Text>
              <Text className="text-slate-300 text-sm leading-relaxed mt-2">
                نود إعلامك بأن اشتراكك الحالي في المنصة قارب على الانتهاء بتاريخ: <strong className="text-amber-300" dir="ltr">{renewalDate}</strong>.
              </Text>
            </Section>

            <Section className="bg-amber-950/40 border border-amber-800/60 p-5 rounded-xl mb-6">
              <Text className="text-amber-200 text-xs font-bold leading-relaxed m-0 text-center">
                🛡️ لتجنب توقف الموقع أو تعليق وصولك للوحة التحكم وإدارة المتاجر، يرجى تفعيل التجديد قبل موعد الانتهاء.
              </Text>
            </Section>

            <Section className="text-center my-8">
              <Button
                href={renewalUrl}
                className="bg-amber-600 text-slate-950 font-black px-8 py-4 rounded-xl text-base block text-center shadow-lg"
              >
                تجديد الاشتراك الآن 🚀
              </Button>
            </Section>

            <Section className="mt-8 border-t border-slate-800 pt-6 text-center">
              <Text className="text-slate-500 text-xs">
                في حال قمت بتجديد الاشتراك مؤخراً، يرجى تجاهل هذه الرسالة.
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

export default SubscriptionReminderEmail;
