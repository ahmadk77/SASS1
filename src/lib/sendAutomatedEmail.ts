import React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail.tsx';
import { SubscriptionReminderEmail } from '../emails/SubscriptionReminderEmail.tsx';
import { SubscriptionReceiptEmail } from '../emails/SubscriptionReceiptEmail.tsx';
import { TemplateUpdateEmail } from '../emails/TemplateUpdateEmail.tsx';

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY || '';
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not defined. Email functionality will be disabled.');
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: any;
  from?: string;
}

export const sendAutomatedEmail = async ({
  to,
  subject,
  react,
  from,
}: SendEmailOptions) => {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('Skipping email send because RESEND_API_KEY is not configured');
      return { success: false, error: 'لم يتم إعداد RESEND_API_KEY في النظام' };
    }

    const recipient = Array.isArray(to) ? to[0] : to;
    if (!recipient || typeof recipient !== 'string' || !recipient.includes('@')) {
      console.warn('Invalid recipient email provided:', to);
      return { success: false, error: 'عنوان البريد الإلكتروني غير صالح' };
    }

    // Determine clean sender address and test owner email
    const defaultFrom = 'support@bunyan.website';
    const sender = from || process.env.RESEND_FROM_EMAIL || defaultFrom;
    const ownerEmail = process.env.RESEND_OWNER_EMAIL || 'ahmadalriqib@gmail.com';

    // Convert React element to clean HTML string
    let htmlContent = '';
    try {
      htmlContent = await render(react);
    } catch (renderErr) {
      console.warn('Failed to render React email component, fallback to raw react element:', renderErr);
    }

    const payload: any = {
      from: sender,
      to: recipient,
      subject: subject,
      reply_to: 'support@bunyan.website',
      headers: {
        'List-Unsubscribe': '<mailto:support@bunyan.website>',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'Feedback-ID': 'bunyan-commerce:transactional',
      },
    };

    if (htmlContent) {
      payload.html = htmlContent;
    } else {
      payload.react = react;
    }

    let result = await resend.emails.send(payload);

    // If initial send failed due to temporary issues, retry once with default sender
    if (result.error && sender !== defaultFrom) {
      console.warn(`Resend failed with sender ${sender}. Retrying with default ${defaultFrom}...`, result.error);
      payload.from = defaultFrom;
      result = await resend.emails.send(payload);
    }

    const resendErr: any = (result as any)?.error;
    if (resendErr) {
      console.warn('Resend email API returned error:', resendErr);
      const msg = resendErr?.message || (typeof resendErr === 'object' ? JSON.stringify(resendErr) : String(resendErr));
      let friendlyError = msg;
      if (msg.includes('testing email') || msg.includes('validation_error') || msg.includes('domain') || msg.includes('verify') || resendErr?.name === 'validation_error') {
        friendlyError = 'في بيئة الاختبار (Resend Free)، يسمح الإرسال فقط لإيميل المالك المعتمد (ahmadalriqib@gmail.com). لإرسال الإيميلات للعملاء مباشرة، يلزم توثيق النطاق الخاص بك (Domain) in منصة Resend.';
      }
      return { success: false, error: friendlyError };
    }

    const successMsg = `تم إرسال البريد الإلكتروني بنجاح إلى ${recipient}`;

    console.log(successMsg, result.data);
    return { 
      success: true, 
      data: result.data,
      notice: ''
    };
  } catch (error: any) {
    console.warn('Error sending email exception:', error);
    const msg = error?.message || String(error);
    let friendlyError = msg;
    if (msg.includes('testing email') || msg.includes('validation_error') || msg.includes('domain') || msg.includes('verify')) {
      friendlyError = 'في بيئة الاختبار (Resend Free)، يسمح الإرسال فقط لإيميل المالك المعتمد (ahmadalriqib@gmail.com). لإرسال الإيميلات للعملاء مباشرة، يلزم توثيق النطاق الخاص بك (Domain) في منصة Resend.';
    }
    return { success: false, error: friendlyError };
  }
};

export const sendWelcomeEmail = async (to: string, ownerName: string, dashboardUrl: string) => {
  return sendAutomatedEmail({
    to,
    subject: 'أهلاً وسهلاً بك في منصة بنيان المتكاملة! 🚀',
    react: React.createElement(WelcomeEmail, { ownerName, dashboardUrl }),
  });
};

export const sendSubscriptionReminder = async (to: string, tenantName: string, renewalDate: string, renewalUrl: string) => {
  return sendAutomatedEmail({
    to,
    subject: 'تنبيه هام: اشتراكك في منصة بنيان يقترب من الانتهاء ⚠️',
    react: React.createElement(SubscriptionReminderEmail, { tenantName, renewalDate, renewalUrl }),
  });
};

export const sendSubscriptionReceiptEmail = async (to: string, tenantName: string, planName: string, renewalDate: string, dashboardUrl: string) => {
  return sendAutomatedEmail({
    to,
    subject: 'تم تفعيل اشتراكك بنجاح ✅ - منصة بنيان',
    react: React.createElement(SubscriptionReceiptEmail, { tenantName, planName, renewalDate, dashboardUrl }),
  });
};

export const sendTemplateUpdateEmail = async (to: string, userName: string, templateName: string, templateDescription?: string, previewUrl?: string) => {
  return sendAutomatedEmail({
    to,
    subject: `🎉 تم إطلاق قالب جديد في منصة بنيان: ${templateName}`,
    react: React.createElement(TemplateUpdateEmail, { userName, templateName, templateDescription, previewUrl }),
  });
};
