import fs from 'fs';
import path from 'path';

export interface SystemSettings {
  lockEditMode: boolean;       // إغلاق الدخول لبيئة التعديل
  lockSubscriptions: boolean;  // إغلاق الاشتراك
  lockSaveEdits: boolean;      // إغلاق حفظ التعديلات
  lockTemplatePreview: boolean; // إغلاق الدخول لمعاينة القوالب
  customNoticeMessage?: string; // رسالة إشعار الإغلاق

  // Promotional Banner / Special Offer Modal Settings
  promoBannerEnabled?: boolean;     // إظهار/إخفاء البوب أب
  promoBannerTitle?: string;       // عنوان العرض
  promoBannerBadge?: string;       // شارة العرض
  promoBannerMessage?: string;     // تفاصيل العرض
  promoBannerSubtext?: string;     // نص توضيحي
  promoBannerBtnText?: string;     // نص الزر
  promoBannerBtnLink?: string;     // رابط أو إجابة الزر
  promoBannerTheme?: 'red' | 'purple' | 'amber' | 'emerald'; // لون الثيم
}

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'system_settings.json');

const DEFAULT_SETTINGS: SystemSettings = {
  lockEditMode: false,
  lockSubscriptions: false,
  lockSaveEdits: false,
  lockTemplatePreview: false,
  customNoticeMessage: 'هذه الخدمة مغلقة حالياً من قبل الإدارة',
  
  // Promotional Offer Defaults
  promoBannerEnabled: true,
  promoBannerTitle: 'عرض خاص وحصري 🔥',
  promoBannerBadge: 'لفترة محدودة ⚡',
  promoBannerMessage: 'اشتراك في أي قالب بـ $30 فقط! 🚀',
  promoBannerSubtext: 'احصل على موقع إلكتروني احترافي متكامل مع لوحة تحكم ودومين خاص وبدون أي مصاريف إضافية.',
  promoBannerBtnText: 'اختر قالبك واشترك بـ $30 الآن 🎯',
  promoBannerBtnLink: '#templates',
  promoBannerTheme: 'red'
};

let inMemorySettings: SystemSettings = { ...DEFAULT_SETTINGS };

// Load settings from disk on module import
try {
  if (fs.existsSync(SETTINGS_FILE_PATH)) {
    const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
    inMemorySettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } else {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  }
} catch (e) {
  console.error('Failed to initialize system settings file:', e);
}

export function getSystemSettings(): SystemSettings {
  return { ...inMemorySettings };
}

export function updateSystemSettings(newSettings: Partial<SystemSettings>): SystemSettings {
  inMemorySettings = {
    ...inMemorySettings,
    ...newSettings
  };

  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(inMemorySettings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save system settings to disk:', e);
  }

  return { ...inMemorySettings };
}
