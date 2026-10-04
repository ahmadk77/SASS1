import React, { useState } from 'react';
import { Tag, Percent, Truck, Plus, Trash2, Save, Sparkles, CheckCircle2, ShieldCheck, Coins, Globe } from 'lucide-react';

interface CouponsAndShippingManagerProps {
  content: any;
  setContent?: (content: any) => void;
  handleUpdateContent?: (silent?: boolean, updatedContent?: any) => void;
  showToast?: (msg: string) => void;
}

const CURRENCY_OPTIONS = [
  { code: 'SAR', symbol: 'ر.س', label: '🇸🇦 ريال سعودي (ر.س)', phonePrefix: '966' },
  { code: 'JOD', symbol: 'د.أ', label: '🇯🇴 دينار أردني (د.أ)', phonePrefix: '962' },
  { code: 'AED', symbol: 'د.إ', label: '🇦🇪 درهم إماراتي (د.إ)', phonePrefix: '971' },
  { code: 'EGP', symbol: 'ج.م', label: '🇪🇬 جنيه مصري (ج.م)', phonePrefix: '20' },
  { code: 'KWD', symbol: 'د.ك', label: '🇰🇼 دينار كويتي (د.ك)', phonePrefix: '965' },
  { code: 'QAR', symbol: 'ر.ق', label: '🇶🇦 ريال قطري (ر.ق)', phonePrefix: '974' },
  { code: 'OMR', symbol: 'ر.ع', label: '🇴🇲 ريال عماني (ر.ع)', phonePrefix: '968' },
  { code: 'BHD', symbol: 'د.ب', label: '🇧🇭 دينار بحريني (د.ب)', phonePrefix: '973' },
  { code: 'USD', symbol: '$', label: '💵 دولار أمريكي ($)', phonePrefix: '1' },
  { code: 'EUR', symbol: '€', label: '🇪🇺 يورو (€)', phonePrefix: '49' },
];

export default function CouponsAndShippingManager({
  content,
  setContent,
  handleUpdateContent,
  showToast
}: CouponsAndShippingManagerProps) {
  const promoCodes = Array.isArray(content?.promoCodes) ? content.promoCodes : [];
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDiscount, setNewCodeDiscount] = useState('');
  const [newCodeMinOrders, setNewCodeMinOrders] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');
  const [newCodeMinCart, setNewCodeMinCart] = useState('');
  const [newCodeMaxCart, setNewCodeMaxCart] = useState('');

  // Announcement Banner States
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(content?.announcementEnabled ?? true);
  const [announcementText, setAnnouncementText] = useState<string>(content?.announcementText || '🔥 شحن مجاني لكافة المدن للطلبات فوق 300 ريال + ضمان معتمد لمدة سنتين');
  const [announcementBgColor, setAnnouncementBgColor] = useState<string>(content?.announcementBgColor || '#1e293b');
  const [announcementTextColor, setAnnouncementTextColor] = useState<string>(content?.announcementTextColor || '#ffffff');
  const [announcementIsBold, setAnnouncementIsBold] = useState<boolean>(content?.announcementIsBold ?? true);
  const [announcementAnimation, setAnnouncementAnimation] = useState<string>(content?.announcementAnimation || 'static');

  const [shippingFeeInput, setShippingFeeInput] = useState<string>(
    content?.shippingFee !== undefined ? String(content.shippingFee) : '15'
  );

  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    content?.currency || 'SAR'
  );
  const [currencySymbolInput, setCurrencySymbolInput] = useState<string>(
    content?.currencySymbol || content?.currency || 'ر.س'
  );
  const [countryCodeInput, setCountryCodeInput] = useState<string>(
    content?.countryCode || '966'
  );

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const notifyChange = (newContent: any) => {
    if (setContent) setContent(newContent);
    else if (content) Object.assign(content, newContent);

    if (handleUpdateContent) handleUpdateContent(false, newContent);
    if (showToast) showToast('تم تحديث البيانات وتعديلات الخصومات والشحن والعملة بنجاح ✓');
  };

  const handleAddPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim() || !newCodeDiscount) return;

    const codeObj = {
      id: `code_${Date.now()}`,
      code: newCodeName.trim().toUpperCase(),
      discountPercent: Number(newCodeDiscount) || 10,
      minPriorOrders: Number(newCodeMinOrders) || 0,
      maxUsesPerUser: Number(newCodeMaxUses) || 0,
      minCartAmount: Number(newCodeMinCart) || 0,
      maxCartAmount: Number(newCodeMaxCart) || 0,
      createdAt: new Date().toISOString()
    };

    const updatedCodes = [codeObj, ...promoCodes];
    const newContent = { ...content, promoCodes: updatedCodes };

    notifyChange(newContent);
    setNewCodeName('');
    setNewCodeDiscount('');
    setNewCodeMinOrders('');
    setNewCodeMaxUses('');
    setNewCodeMinCart('');
    setNewCodeMaxCart('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleDeletePromoCode = (codeId: string) => {
    const updatedCodes = promoCodes.filter((c: any) => c.id !== codeId && c.code !== codeId);
    const newContent = { ...content, promoCodes: updatedCodes };
    notifyChange(newContent);
  };

  const handleSaveAnnouncement = () => {
    const newContent = {
      ...content,
      announcementEnabled,
      announcementText,
      announcementBgColor,
      announcementTextColor,
      announcementIsBold,
      announcementAnimation
    };
    notifyChange(newContent);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleSelectCurrencyPreset = (code: string) => {
    const found = CURRENCY_OPTIONS.find(c => c.code === code);
    if (found) {
      setSelectedCurrency(found.code);
      setCurrencySymbolInput(found.symbol);
      setCountryCodeInput(found.phonePrefix);
    } else {
      setSelectedCurrency(code);
    }
  };

  const handleSaveStoreSettings = () => {
    const feeNum = Number(shippingFeeInput) || 0;
    const newContent = {
      ...content,
      shippingFee: feeNum,
      currency: selectedCurrency,
      currencySymbol: currencySymbolInput || selectedCurrency,
      countryCode: countryCodeInput || '966'
    };
    notifyChange(newContent);

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* Banner Header */}
      <div className="bg-gradient-to-l from-slate-900 via-purple-950 to-indigo-950 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>إدارة التسويق والشحن والعملة</span>
            </span>
          </div>
          <h2 className="text-2xl font-black">أكواد الخصم، رسوم الشحن وعملة المتجر 🏷️🚚💰</h2>
          <p className="text-slate-300 text-xs mt-1">أنشئ أكواد خصم ترويجية، حدد عملة متجرك ورسوم التوصيل الثابتة لجميع العملاء</p>
        </div>

        {saveSuccessMsg && (
          <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>تم حفظ التغييرات بنجاح!</span>
          </div>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قسم أكواد الخصم */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">إنشاء وأكواد الخصم (Promo Codes)</h3>
                <p className="text-xs text-slate-500 font-medium">أضف كود خصم للعملاء واستفد من حملاتك التسويقية</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddPromoCode} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">كود الخصم (رمز الكوبون)</label>
                <input
                  type="text"
                  required
                  value={newCodeName}
                  onChange={e => setNewCodeName(e.target.value)}
                  placeholder="مثال: SALE20"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-pink-600 outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة الخصم (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={newCodeDiscount}
                    onChange={e => setNewCodeDiscount(e.target.value)}
                    placeholder="20"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none pl-8 focus:border-pink-500"
                  />
                  <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الحد الأدنى للطلبات السابقة</label>
                <input
                  type="number"
                  min="0"
                  value={newCodeMinOrders}
                  onChange={e => setNewCodeMinOrders(e.target.value)}
                  placeholder="مثال: 2 (لازم طلبين)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-pink-500"
                />
                <span className="text-[10px] text-slate-400">عدد الطلبات التي يجب أن يكملها العميل أولاً</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الحد الأقصى للاستخدام لكل عميل</label>
                <input
                  type="number"
                  min="1"
                  value={newCodeMaxUses}
                  onChange={e => setNewCodeMaxUses(e.target.value)}
                  placeholder="مثال: 1 (مرة واحدة)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-pink-500"
                />
                <span className="text-[10px] text-slate-400">كم مرة مسموح للمستخدم استخدام الكود</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الحد الأدنى لقيمة السلة</label>
                <input
                  type="number"
                  min="0"
                  value={newCodeMinCart}
                  onChange={e => setNewCodeMinCart(e.target.value)}
                  placeholder="مثال: 100"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-pink-500"
                />
                <span className="text-[10px] text-slate-400">أقل مبلغ للسلة لتفعيل الكود</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">الحد الأقصى لقيمة السلة</label>
                <input
                  type="number"
                  min="0"
                  value={newCodeMaxCart}
                  onChange={e => setNewCodeMaxCart(e.target.value)}
                  placeholder="مثال: 1000"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-pink-500"
                />
                <span className="text-[10px] text-slate-400">أقصى مبلغ للسلة (اختياري)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>إضافة كود الخصم مع الشروط والقيود</span>
            </button>
          </form>

          {/* قائمة الأكواد الحالية */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700">الأكواد الفعالة حالياً للعملاء ({promoCodes.length}):</h4>
            {promoCodes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium space-y-1">
                <p className="font-bold text-slate-600">لا توجد أكواد خصم معرفة حتى الآن.</p>
                <p>قم بإنشاء كود خصم جديد ليظهر لعملائك عند الشراء من السلة!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {promoCodes.map((pc: any) => (
                  <div key={pc.id || pc.code} className="flex flex-col justify-between p-4 bg-pink-50/50 border border-pink-100 rounded-2xl shadow-2xs gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-xs text-pink-700 bg-white border border-pink-200 px-3 py-1.5 rounded-xl shadow-xs">
                          {pc.code}
                        </span>
                        <div>
                          <span className="text-xs font-black text-slate-800 block">
                            خصم {pc.discountPercent}%
                          </span>
                          <span className="text-[10px] text-pink-600 font-bold">كود فعال</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePromoCode(pc.id || pc.code)}
                        className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="حذف الكود"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-600 font-medium bg-white/80 p-2.5 rounded-xl border border-pink-100/60 space-y-1">
                      {pc.minPriorOrders > 0 && <p>• الحد الأدنى للطلبات السابقة: <strong className="text-slate-900">{pc.minPriorOrders} طلبات</strong></p>}
                      {pc.maxUsesPerUser > 0 && <p>• أقصى استخدام لكل عميل: <strong className="text-slate-900">{pc.maxUsesPerUser} مرات</strong></p>}
                      {pc.minCartAmount > 0 && <p>• الحد الأدنى لقيمة السلة: <strong className="text-slate-900">{pc.minCartAmount}</strong></p>}
                      {pc.maxCartAmount > 0 && <p>• الحد الأقصى لقيمة السلة: <strong className="text-slate-900">{pc.maxCartAmount}</strong></p>}
                      {!pc.minPriorOrders && !pc.maxUsesPerUser && !pc.minCartAmount && !pc.maxCartAmount && (
                        <p className="text-slate-400 italic">بدون قيود إضافية</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📢 إعلان الصفحة العلوي فوق مربع البحث */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">إعلان الصفحة العلوي المتحرك (Announcement Banner)</h3>
                  <p className="text-xs text-slate-500 font-medium">يظهر في أعلى المتجر فوق مربع البحث بخط عريض ومتحرك</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  onChange={e => setAnnouncementEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {announcementEnabled && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص الإعلان العلوي:</label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={e => setAnnouncementText(e.target.value)}
                    placeholder="مثال: 🔥 شحن مجاني للطلبات فوق 300 ريال"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">لون خلفية الإعلان:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={announcementBgColor}
                        onChange={e => setAnnouncementBgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={announcementBgColor}
                        onChange={e => setAnnouncementBgColor(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">لون خط النص:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={announcementTextColor}
                        onChange={e => setAnnouncementTextColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={announcementTextColor}
                        onChange={e => setAnnouncementTextColor(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">حركة الإعلان:</label>
                    <select
                      value={announcementAnimation}
                      onChange={e => setAnnouncementAnimation(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                    >
                      <option value="static">ثابت (Static)</option>
                      <option value="marquee-right">متحرك من اليمين للشمال ➡️</option>
                      <option value="marquee-left">متحرك من الشمال لليمين ⬅️</option>
                      <option value="pulse">نبض وتألق (Pulse)</option>
                      <option value="bounce">حركة خفيفة (Bounce)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="announcementIsBold"
                    checked={announcementIsBold}
                    onChange={e => setAnnouncementIsBold(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <label htmlFor="announcementIsBold" className="text-xs font-bold text-slate-700 cursor-pointer">
                    جعل خط النص عريضاً وقوياً (Bold)
                  </label>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveAnnouncement}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>حفظ إعدادات إعلان الصفحة العلوي</span>
            </button>
          </div>
        </div>

        {/* قسم تحديد عملة المتجر وقيمة الشحن */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* 💰 Currency Settings */}
            <div className="space-y-3 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">تغيير عملة المتجر</h3>
                  <p className="text-xs text-slate-500 font-medium">اختر عملة الأسعار المعروضة بالمتجر</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر العملة الرئيسية:</label>
                <select
                  value={selectedCurrency}
                  onChange={e => handleSelectCurrencyPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  {CURRENCY_OPTIONS.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                  <option value="CUSTOM">🖊️ عملة مخصصة أُخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رمز/اسم العملة المالي (يظهر بجانب الأسعار):</label>
                <input
                  type="text"
                  value={currencySymbolInput}
                  onChange={e => setCurrencySymbolInput(e.target.value)}
                  placeholder="مثال: ر.س أو د.أ أو $"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe size={13} className="text-indigo-600" />
                  <span>رمز دولة الواتساب الافتراضي (الرمز الدولي):</span>
                </label>
                <input
                  type="text"
                  value={countryCodeInput}
                  onChange={e => setCountryCodeInput(e.target.value)}
                  placeholder="مثال: 966 أو 962 أو 20"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1">يُستخدم تلقائياً عند التواصل بالواتساب إذا لم يدخل العميل رمز الدولة.</p>
              </div>
            </div>

            {/* 🚚 Shipping Fee Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">تكلفة الشحن والتوصيل</h3>
                  <p className="text-xs text-slate-500 font-medium">حدد تكلفة الشحن التي تضاف للطلب</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">قيمة الشحن الثابتة:</label>
                <input
                  type="number"
                  min="0"
                  value={shippingFeeInput}
                  onChange={e => setShippingFeeInput(e.target.value)}
                  placeholder="15"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-indigo-950 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 font-medium space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck size={14} className="text-indigo-600" />
                  <span>تنبيه للشحن والعملة:</span>
                </p>
                <p>تُطبق العملة وقيمة الشحن تلقائياً في السلة وفي فاتورة العميل ولوحة المبيعات.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveStoreSettings}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <Save size={16} />
            <span>حفظ إعدادات العملة والشحن</span>
          </button>
        </div>
      </div>
    </div>
  );
}

