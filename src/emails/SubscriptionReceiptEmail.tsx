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
  Row,
  Column,
} from '@react-email/components';

interface SubscriptionReceiptEmailProps {
  tenantName?: string;
  planName?: string;
  renewalDate?: string;
  dashboardUrl?: string;
}

export const SubscriptionReceiptEmail = ({
  tenantName = 'عيادة الحياة',
  planName = 'الباقة الاحترافية',
  renewalDate = '2027-08-05',
  dashboardUrl = 'https://bunyan.website/dashboard',
}: SubscriptionReceiptEmailProps) => {
  return (
    <Html dir="rtl" lang="ar">
      <Head />
      <Preview>تم تفعيل اشتراكك بنجاح في منصة بنيان ✅</Preview>
      <Tailwind>
        <Body className="bg-slate-950 text-slate-100 font-sans p-4">
          <Container className="mx-auto my-8 p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl shadow-2xl dir-rtl text-right">
            {/* Official Logo Header */}
            <Section className="text-center mb-8 pb-6 border-b border-slate-800">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', direction: 'ltr' }}>
                <svg width="48" height="48" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                  <defs>
                    <linearGradient id="recBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0066FF" />
                      <stop offset="1" stopColor="#002999" />
                    </linearGradient>
                    <linearGradient id="recTop" x1="0" y1="0" x2="1" y2="1">
                      <stop stopColor="#FFFFFF" />
                      <stop offset="1" stopColor="#E2E8F0" />
                    </linearGradient>
                    <linearGradient id="recLeft" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#CBD5E1" />
                      <stop offset="1" stopColor="#94A3B8" />
                    </linearGradient>
                    <linearGradient id="recRight" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#E2E8F0" />
                      <stop offset="1" stopColor="#CBD5E1" />
                    </linearGradient>
                  </defs>
                  <rect width="120" height="120" rx="30" fill="url(#recBg)" />
                  <g transform="translate(0, 18)">
                    <path d="M60 52 L90 67 L60 82 L30 67 Z" fill="url(#recTop)" />
                    <path d="M30 67 L60 82 L60 94 L30 79 Z" fill="url(#recLeft)" />
                    <path d="M60 82 L90 67 L90 79 L60 94 Z" fill="url(#recRight)" />
                  </g>
                  <g transform="translate(0, 3)">
                    <path d="M60 38 L84 50 L60 62 L36 50 Z" fill="url(#recTop)" />
                    <path d="M36 50 L60 62 L60 71 L36 59 Z" fill="url(#recLeft)" />
                    <path d="M60 62 L84 50 L84 59 L60 71 Z" fill="url(#recRight)" />
                  </g>
                  <g transform="translate(0, -9)">
                    <path d="M60 26 L74 33 L60 40 L46 33 Z" fill="url(#recTop)" />
                    <path d="M46 33 L60 40 L60 46 L46 39 Z" fill="url(#recLeft)" />
                    <path d="M60 40 L74 33 L74 39 L60 46 Z" fill="url(#recRight)" />
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

            {/* Header */}
            <Section className="text-center mb-8 pb-4">
              <Heading className="text-3xl font-black text-white mb-3">
                تم تفعيل اشتراكك بنجاح ✅
              </Heading>
              <Text className="text-slate-300 text-base leading-relaxed">
                شكراً لثقتك في منصة بنيان. إليك تفاصيل اشتراكك ومساحتك الرقمية:
              </Text>
            </Section>

            {/* Receipt / Summary Card */}
            <Section className="mb-8 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
              <Section className="mb-6">
                <Row>
                  <Column>
                    <Text className="text-slate-400 text-xs font-bold mb-1">اسم الموقع / العيادة</Text>
                    <Text className="text-white text-base font-bold m-0">{tenantName}</Text>
                  </Column>
                  <Column>
                    <Text className="text-slate-400 text-xs font-bold mb-1">نوع الباقة</Text>
                    <Text className="text-white text-base font-bold m-0">{planName}</Text>
                  </Column>
                </Row>
              </Section>
              
              <Section>
                <Row>
                  <Column>
                    <Text className="text-slate-400 text-xs font-bold mb-1">حالة الاشتراك</Text>
                    <Text className="text-emerald-400 text-base font-bold m-0">فعّال (Active)</Text>
                  </Column>
                  <Column>
                    <Text className="text-slate-400 text-xs font-bold mb-1">تاريخ التجديد القادم</Text>
                    <Text className="text-white text-base font-bold m-0" dir="ltr">{renewalDate}</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            {/* CTA Button */}
            <Section className="text-center my-8">
              <Button
                href={dashboardUrl}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-base block text-center shadow-lg"
              >
                الذهاب إلى لوحة التحكم
              </Button>
            </Section>

            {/* Footer */}
            <Section className="mt-8 border-t border-slate-800 pt-6 text-center">
              <Text className="text-slate-500 text-xs">
                إذا كان لديك أي استفسارات حول اشتراكك، يمكنك الرد على هذه الرسالة أو التواصل مع فريق الدعم.
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

export default SubscriptionReceiptEmail;
