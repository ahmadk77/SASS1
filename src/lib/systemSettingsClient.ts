// Poll system settings periodically (every 30 seconds) and on window focus if online
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      fetchSystemSettings(false).catch(() => {});
    }
  }, 30000);

  window.addEventListener('focus', () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      fetchSystemSettings(false).catch(() => {});
    }
  });
}

export interface SystemSettings {
  lockEditMode: boolean;       // إغلاق الدخول لبيئة التعديل
  lockSubscriptions: boolean;  // إغلاق الاشتراك
  lockSaveEdits: boolean;      // إغلاق حفظ التعديلات
  lockTemplatePreview: boolean; // إغلاق الدخول لمعاينة القوالب
  customNoticeMessage?: string;

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

const DEFAULT_SETTINGS: SystemSettings = {
  lockEditMode: false,
  lockSubscriptions: false,
  lockSaveEdits: false,
  lockTemplatePreview: false,
  customNoticeMessage: 'هذه الخدمة مغلقة حالياً من قبل الإدارة',

  promoBannerEnabled: true,
  promoBannerTitle: 'عرض خاص وحصري 🔥',
  promoBannerBadge: 'لفترة محدودة ⚡',
  promoBannerMessage: 'اشتراك في أي قالب بـ $30 فقط! 🚀',
  promoBannerSubtext: 'احصل على موقع إلكتروني احترافي متكامل مع لوحة تحكم ودومين خاص وبدون أي مصاريف إضافية.',
  promoBannerBtnText: 'اختر قالبك واشترك بـ $30 الآن 🎯',
  promoBannerBtnLink: '#templates',
  promoBannerTheme: 'red'
};

function parseSettingsData(data: any): SystemSettings {
  return {
    lockEditMode: Boolean(data.lockEditMode),
    lockSubscriptions: Boolean(data.lockSubscriptions),
    lockSaveEdits: Boolean(data.lockSaveEdits),
    lockTemplatePreview: Boolean(data.lockTemplatePreview),
    customNoticeMessage: data.customNoticeMessage || DEFAULT_SETTINGS.customNoticeMessage,

    promoBannerEnabled: data.promoBannerEnabled !== undefined ? Boolean(data.promoBannerEnabled) : DEFAULT_SETTINGS.promoBannerEnabled,
    promoBannerTitle: data.promoBannerTitle || DEFAULT_SETTINGS.promoBannerTitle,
    promoBannerBadge: data.promoBannerBadge || DEFAULT_SETTINGS.promoBannerBadge,
    promoBannerMessage: data.promoBannerMessage || DEFAULT_SETTINGS.promoBannerMessage,
    promoBannerSubtext: data.promoBannerSubtext || DEFAULT_SETTINGS.promoBannerSubtext,
    promoBannerBtnText: data.promoBannerBtnText || DEFAULT_SETTINGS.promoBannerBtnText,
    promoBannerBtnLink: data.promoBannerBtnLink || DEFAULT_SETTINGS.promoBannerBtnLink,
    promoBannerTheme: data.promoBannerTheme || DEFAULT_SETTINGS.promoBannerTheme
  };
}

let cachedSettings: SystemSettings = { ...DEFAULT_SETTINGS };

// Load from localStorage if available
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('system_settings_cache');
    if (saved) {
      cachedSettings = parseSettingsData(JSON.parse(saved));
    }
  } catch (e) {}
}

let lastFetchedAt = 0;
const CACHE_TTL_MS = 10000; // Cache for 10 seconds to avoid duplicate network calls

const listeners: Set<(settings: SystemSettings) => void> = new Set();

export function subscribeSystemSettings(listener: (settings: SystemSettings) => void): () => void {
  listeners.add(listener);
  // Send current cached settings immediately
  listener(cachedSettings);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach(fn => fn(cachedSettings));
}

export async function fetchSystemSettings(force: boolean = false): Promise<SystemSettings> {
  const now = Date.now();
  if (!force && (now - lastFetchedAt < CACHE_TTL_MS)) {
    return cachedSettings;
  }

  try {
    const res = await fetch('/api/system-settings');
    if (res.ok) {
      const data = await res.json();
      const newSettings = parseSettingsData(data);
      
      cachedSettings = newSettings;
      if (typeof window !== 'undefined') {
        localStorage.setItem('system_settings_cache', JSON.stringify(newSettings));
      }
      lastFetchedAt = now;
      notifyListeners();
    }
  } catch (e) {
    // silent catch for network drops
  }

  return cachedSettings;
}

export function getCachedSystemSettings(): SystemSettings {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('system_settings_cache');
      if (saved) {
        return parseSettingsData(JSON.parse(saved));
      }
    } catch (e) {}
  }
  return cachedSettings;
}

export async function updateSystemSettingsOnServer(
  token: string,
  newSettings: Partial<SystemSettings>
): Promise<SystemSettings> {
  try {
    const res = await fetch('/api/system-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newSettings)
    });

    if (res.ok) {
      const data = await res.json();
      cachedSettings = parseSettingsData(data.settings);
      if (typeof window !== 'undefined') {
        localStorage.setItem('system_settings_cache', JSON.stringify(cachedSettings));
      }
      lastFetchedAt = Date.now();
      notifyListeners();
      return cachedSettings;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update system settings');
    }
  } catch (e) {
    console.error('Error updating system settings:', e);
    throw e;
  }
}

export function checkFeatureLock(
  feature: 'editMode' | 'subscriptions' | 'saveEdits' | 'templatePreview',
  userEmail?: string | null,
  userRole?: string | null
): { isLocked: boolean; noticeMessage: string } {
  const settings = getCachedSystemSettings();

  if (feature === 'editMode' && settings.lockEditMode) {
    return {
      isLocked: true,
      noticeMessage: settings.customNoticeMessage || 'مغلق الآن - الدخول لبيئة التعديل مغلق حالياً من قبل الإدارة'
    };
  }

  if (feature === 'subscriptions' && settings.lockSubscriptions) {
    return {
      isLocked: true,
      noticeMessage: settings.customNoticeMessage || 'توجد مشكلة مؤقتة في بوابة الدفع الإلكتروني حالياً. يرجى التواصل معنا عبر الواتساب على الرقم 0778091269 لإكمال عملية الاشتراك.'
    };
  }

  if (feature === 'saveEdits' && settings.lockSaveEdits) {
    return {
      isLocked: true,
      noticeMessage: settings.customNoticeMessage || 'مغلق الآن - حفظ التعديلات مغلق حالياً من قبل الإدارة'
    };
  }

  if (feature === 'templatePreview' && settings.lockTemplatePreview) {
    return {
      isLocked: true,
      noticeMessage: settings.customNoticeMessage || 'مغلق الآن - الدخول لمعاينة القوالب مغلق حالياً من قبل الإدارة'
    };
  }

  return { isLocked: false, noticeMessage: '' };
}
