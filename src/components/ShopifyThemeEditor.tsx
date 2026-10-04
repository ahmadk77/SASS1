import React, { useState } from 'react';
import TemplateRenderer from './TemplateRenderer';
import { checkFeatureLock, fetchSystemSettings } from '../lib/systemSettingsClient';
import { auth } from '../lib/firebase';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Save, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  Paintbrush, 
  Layout, 
  Type, 
  ShoppingBag, 
  MessageSquare, 
  MapPin, 
  Share2, 
  CheckCircle2, 
  ArrowUpRight,
  Eye,
  Sliders,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface ShopifyThemeEditorProps {
  content: any;
  setContent: (newContent: any) => void;
  templateId: number;
  tenant: any;
  onSave: () => Promise<void>;
  isSaving: boolean;
  onResetHeroImage?: () => void;
  isRestaurant?: boolean;
}

const COLOR_PRESETS = [
  { name: 'روز أنيق', value: '#e11d48' },
  { name: 'ذهبي فاخر', value: '#d4af37' },
  { name: 'قهوة وخشبي', value: '#C5A880' },
  { name: 'أزرق ملكي', value: '#2563eb' },
  { name: 'أخضر زمردي', value: '#059669' },
  { name: 'عنابي راقي', value: '#881337' },
  { name: 'أسود ملكي', value: '#0f172a' },
  { name: 'برتقالي دافئ', value: '#f97316' },
];

export default function ShopifyThemeEditor({
  content,
  setContent,
  templateId,
  tenant,
  onSave,
  isSaving,
  onResetHeroImage,
  isRestaurant = true
}: ShopifyThemeEditorProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeMobileView, setActiveMobileView] = useState<'editor' | 'preview'>('editor');
  const [openSection, setOpenSection] = useState<string | null>('header');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [saveLockedError, setSaveLockedError] = useState<string | null>(null);

  const toggleAccordion = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleSave = async () => {
    await fetchSystemSettings(true);
    const userEmail = auth.currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : null);
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    const lockCheck = checkFeatureLock('saveEdits', userEmail, userRole);

    if (lockCheck.isLocked) {
      setSaveLockedError(lockCheck.noticeMessage || 'مغلق الآن - حفظ التعديلات مغلق حالياً من قبل الإدارة');
      setTimeout(() => setSaveLockedError(null), 4000);
      return;
    }

    await onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const currentDomain = tenant?.subdomain ? `${tenant.subdomain}.domain.com` : 'your-store.com';

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[680px] bg-slate-50 text-slate-900 rounded-3xl overflow-hidden border border-slate-200 shadow-xl relative">
      
      {/* Save Locked Alert Banner */}
      {saveLockedError && (
        <div className="bg-rose-600 text-white px-6 py-3 font-bold text-xs flex items-center justify-between shadow-lg z-30 animate-in slide-in-from-top-2">
          <span>{saveLockedError}</span>
          <button onClick={() => setSaveLockedError(null)} className="text-white hover:text-slate-200">✕</button>
        </div>
      )}
      
      {/* Top Shopify Style Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 z-20 shadow-sm">
        
        {/* Left: Brand / Editor Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-md shadow-emerald-600/20">
            <Sliders size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm text-slate-900 tracking-wide">مُخصّص قوالب شوبيفاي المباشر</h2>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Shopify Editor v2.5
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">عدّل الألوان، البانرات، والمحتوى مع معاينة حية وتفاعلية فورية</p>
          </div>
        </div>

        {/* Center: Device View Mode Switcher */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              deviceMode === 'desktop'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Laptop size={15} />
            <span>حاسوب</span>
          </button>

          <button
            onClick={() => setDeviceMode('tablet')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              deviceMode === 'tablet'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Tablet size={15} />
            <span>تابلت</span>
          </button>

          <button
            onClick={() => setDeviceMode('mobile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              deviceMode === 'mobile'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone size={15} />
            <span>جوال</span>
          </button>
        </div>

        {/* Right: Actions (Save & External Preview) */}
        <div className="flex items-center gap-3">
          <a
            href={window.location.origin}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold transition-all"
            title="فتح الموقع المباشر في نافذة جديدة"
          >
            <Globe size={14} className="text-emerald-600" />
            <span>الموقع المباشر</span>
            <ArrowUpRight size={13} className="text-slate-400" />
          </a>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md ${
              saveSuccess
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري الحفظ...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>تم الحفظ والنشر!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>حفظ ونشر التغييرات</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Switcher Bar */}
      <div className="md:hidden flex bg-slate-100 border-b border-slate-200 p-2 shrink-0 z-10 sticky top-0 justify-around gap-2">
        <button
          onClick={() => setActiveMobileView('editor')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs transition-all ${
            activeMobileView === 'editor'
              ? 'bg-[#008060] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders size={14} />
          <span>لوحة التعديل (Editor)</span>
        </button>
        <button
          onClick={() => setActiveMobileView('preview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs transition-all ${
            activeMobileView === 'preview'
              ? 'bg-[#008060] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Eye size={14} />
          <span>المعاينة الحية (Live Preview)</span>
        </button>
      </div>

      {/* Main Shopify Editor Area (Split-Screen) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Side: Shopify Sections Control Panel */}
        <div className={`w-full md:w-[380px] shrink-0 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col overflow-y-auto ${activeMobileView === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Layout size={15} className="text-emerald-600" />
              <span>أقسام وإعدادات القالب (Sections)</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">Shopify Architecture</span>
          </div>

          <div className="p-3 space-y-2.5 flex-1">
            
            {/* 1. Header & Announcement Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => toggleAccordion('header')}
                className="w-full px-4 py-3.5 flex items-center justify-between text-right text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">📢</span>
                  <span>الرأس والشريط الإعلاني (Header)</span>
                </div>
                {openSection === 'header' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {openSection === 'header' && (
                <div className="p-4 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">اسم المتجر / العلامة التجارية</label>
                    <input
                      type="text"
                      value={content?.businessName || ''}
                      onChange={e => setContent({ ...content, businessName: e.target.value, siteName: e.target.value })}
                      placeholder="اسم المنشأة"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">نص الشريط الإعلاني العلوي (Announcement Bar)</label>
                    <input
                      type="text"
                      value={content?.announcementText || ''}
                      onChange={e => setContent({ ...content, announcementText: e.target.value })}
                      placeholder="مثال: خصم 20% لفترة محدودة على جميع الطلبات 🎉"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                      <input
                        type="text"
                        value={content?.phone || ''}
                        onChange={e => setContent({ ...content, phone: e.target.value })}
                        placeholder="0500000000"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">رقم الواتساب</label>
                      <input
                        type="text"
                        value={content?.whatsapp || ''}
                        onChange={e => setContent({ ...content, whatsapp: e.target.value })}
                        placeholder="966500000000"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Hero Banner Section */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => toggleAccordion('hero')}
                className="w-full px-4 py-3.5 flex items-center justify-between text-right text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs">🖼️</span>
                  <span>البانر الرئيسي والواجهة (Hero Banner)</span>
                </div>
                {openSection === 'hero' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {openSection === 'hero' && (
                <div className="p-4 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">العنوان الرئيسي للبانر</label>
                    <input
                      type="text"
                      value={content?.heroTitle || ''}
                      onChange={e => setContent({ ...content, heroTitle: e.target.value })}
                      placeholder="مثال: أهلاً بكم في عالم المذاق الأصيل"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">الوصف الفرعي (Subtitle)</label>
                    <textarea
                      rows={2}
                      value={content?.heroSubtitle || ''}
                      onChange={e => setContent({ ...content, heroSubtitle: e.target.value })}
                      placeholder="وصف مختصر للخدمة أو المنشأة..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium resize-none shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700">رابط صورة خلفية البانر</label>
                      {onResetHeroImage && (
                        <button
                          type="button"
                          onClick={onResetHeroImage}
                          className="text-[10px] text-teal-600 hover:underline flex items-center gap-1 font-bold"
                        >
                          <RotateCcw size={10} />
                          <span>استعادة الافتراضية</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={content?.heroBgUrl || ''}
                      onChange={e => setContent({ ...content, heroBgUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium text-[11px] shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">نص زر الإجراء (CTA)</label>
                      <input
                        type="text"
                        value={content?.heroCtaText || ''}
                        onChange={e => setContent({ ...content, heroCtaText: e.target.value })}
                        placeholder="تصفح المنيو / اطلب الآن"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">نص زر الثانوية</label>
                      <input
                        type="text"
                        value={content?.heroSecondaryCtaText || ''}
                        onChange={e => setContent({ ...content, heroSecondaryCtaText: e.target.value })}
                        placeholder="تواصل معنا"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Global Theme Styles & Colors */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => toggleAccordion('style')}
                className="w-full px-4 py-3.5 flex items-center justify-between text-right text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs"></span>
                  <span>الألوان والمظهر العام (Theme Styles)</span>
                </div>
                {openSection === 'style' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {openSection === 'style' && (
                <div className="p-4 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/50 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-2">اللون الأساسي للهوية (Primary Color)</label>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="color"
                        value={content?.primaryColor || '#e11d48'}
                        onChange={e => setContent({ ...content, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl bg-transparent border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={content?.primaryColor || '#e11d48'}
                        onChange={e => setContent({ ...content, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none font-mono font-bold shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 block">نماذج ألوان مقترحة:</span>
                      <div className="grid grid-cols-4 gap-2">
                        {COLOR_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setContent({ ...content, primaryColor: p.value })}
                            className="flex items-center gap-1.5 p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-[10px] text-slate-700 font-bold transition-all shadow-sm"
                          >
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: p.value }}></span>
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Operations & Ordering */}
            {isRestaurant && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm">
                <button
                  onClick={() => toggleAccordion('operations')}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-right text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">🛍️</span>
                    <span>إعدادات الطلب والتوصيل (Store Operations)</span>
                  </div>
                  {openSection === 'operations' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {openSection === 'operations' && (
                  <div className="p-4 pt-2 border-t border-slate-100 space-y-3.5 bg-slate-50/50 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="font-bold text-slate-900">إيقاف المبيعات (المنيو للعرض فقط)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">إخفاء زر الشراء وإبراز شارة "للعرض فقط"</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!content?.disableOrdering}
                        onChange={e => setContent({ ...content, disableOrdering: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600 border-slate-300 shrink-0"
                      />
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="font-bold text-slate-900">تعليق التوصيل مؤقتاً</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">إظهار تنبيه بإيقاف التوصيل المباشر</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!content?.disableDelivery}
                        onChange={e => setContent({ ...content, disableDelivery: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-600 border-slate-300 shrink-0"
                      />
                    </div>

                    {content?.disableDelivery && (
                      <div>
                        <label className="block font-bold text-amber-800 mb-1.5">رسالة التوصيل للعملاء</label>
                        <input
                          type="text"
                          value={content?.deliveryMessage || ''}
                          onChange={e => setContent({ ...content, deliveryMessage: e.target.value })}
                          placeholder="مثال: التوصيل متوقف حالياً وسيعود في تمام الـ 4 عصراً"
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-slate-900 outline-none font-medium shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. Location & Social Links */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm">
              <button
                onClick={() => toggleAccordion('location')}
                className="w-full px-4 py-3.5 flex items-center justify-between text-right text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-xs">📍</span>
                  <span>الموقع وسائل التواصل (Contact & Social)</span>
                </div>
                {openSection === 'location' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {openSection === 'location' && (
                <div className="p-4 pt-2 border-t border-slate-100 space-y-3.5 bg-slate-50/50 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">العنوان المباشر</label>
                    <input
                      type="text"
                      value={content?.address || ''}
                      onChange={e => setContent({ ...content, address: e.target.value })}
                      placeholder="الرياض - حي الملز - طريق صلاح الدين"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">أوقات العمل</label>
                    <input
                      type="text"
                      value={content?.workingHours || ''}
                      onChange={e => setContent({ ...content, workingHours: e.target.value })}
                      placeholder="يومياً من الساعة 12:00 ظهراً حتى 12:00 منتصف الليل"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">رابط إنستغرام</label>
                      <input
                        type="text"
                        value={content?.instagram || ''}
                        onChange={e => setContent({ ...content, instagram: e.target.value })}
                        placeholder="https://instagram.com/..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium text-[11px] shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">رابط تيك توك</label>
                      <input
                        type="text"
                        value={content?.tiktok || ''}
                        onChange={e => setContent({ ...content, tiktok: e.target.value })}
                        placeholder="https://tiktok.com/@..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-600 font-medium text-[11px] shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>


            {/* Links and Policies Section */}
            <div className="border-t border-slate-100">
              <button
                onClick={() => toggleAccordion('links')}
                className="w-full px-4 py-3.5 flex items-center justify-between text-right text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">🔗</span>
                  <span>روابط الصفحات والسياسات</span>
                </div>
                {openSection === 'links' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {openSection === 'links' && (
                <div className="p-4 pt-2 border-t border-slate-100 space-y-3.5 bg-slate-50/50 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">نص سياسة الخصوصية (يفتح كصفحة)</label>
                    <textarea
                      rows={4}
                      value={content?.privacyPolicyText || ''}
                      onChange={e => setContent({ ...content, privacyPolicyText: e.target.value })}
                      placeholder="اكتب سياسة الخصوصية هنا..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-medium shadow-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">نص شروط الخدمة (يفتح كصفحة)</label>
                    <textarea
                      rows={4}
                      value={content?.termsText || ''}
                      onChange={e => setContent({ ...content, termsText: e.target.value })}
                      placeholder="اكتب شروط الخدمة هنا..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-medium shadow-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">رابط تطبيق iOS (App Store)</label>
                    <input
                      type="text"
                      value={content?.iosAppUrl || ''}
                      onChange={e => setContent({ ...content, iosAppUrl: e.target.value })}
                      placeholder="https://apps.apple.com/..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-medium shadow-sm dir-ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">رابط تطبيق Android (Google Play)</label>
                    <input
                      type="text"
                      value={content?.androidAppUrl || ''}
                      onChange={e => setContent({ ...content, androidAppUrl: e.target.value })}
                      placeholder="https://play.google.com/..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-indigo-600 font-medium shadow-sm dir-ltr"
                    />
                  </div>
                </div>
              )}
            </div>
          <div className="p-4 border-t border-slate-200 bg-white">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>حفظ جميع الأقسام والتعديلات </span>
            </button>
          </div>

        </div>

        {/* Right Side: Interactive Live Shopify Preview Window */}
        <div className={`flex-1 bg-slate-100 p-4 md:p-6 overflow-hidden flex flex-col items-center justify-start ${activeMobileView === 'preview' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* Simulated Browser Bar */}
          <div className="w-full max-w-5xl bg-slate-200/80 rounded-t-2xl border border-slate-300 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
            </div>

            <div className="flex-1 max-w-md bg-white px-4 py-1.5 rounded-xl border border-slate-300 flex items-center justify-center text-xs text-slate-600 font-mono dir-ltr truncate shadow-sm">
              <Globe size={13} className="mr-2 text-emerald-600 shrink-0" />
              <span>https://{currentDomain}/preview</span>
            </div>

            <div className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>معاينة حية وتفاعلية</span>
            </div>
          </div>

          {/* Interactive Frame Container */}
          <div className="w-full max-w-5xl flex-1 bg-white rounded-b-2xl border-x border-b border-slate-300 overflow-y-auto shadow-md relative transition-all duration-300">
            <div
              className={`mx-auto transition-all duration-300 bg-white min-h-full ${
                deviceMode === 'mobile'
                  ? 'max-w-[390px] border-x-8 border-y-8 border-slate-800 my-4 rounded-[40px] shadow-2xl overflow-hidden'
                  : deviceMode === 'tablet'
                  ? 'max-w-[768px] border-x-4 border-slate-800 my-2 rounded-2xl shadow-xl'
                  : 'w-full'
              }`}
            >
              <TemplateRenderer
                templateId={Number(templateId) || 1}
                content={content}
                tenant={tenant}
                onUpdateContent={setContent}
                isEditable={true}
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
