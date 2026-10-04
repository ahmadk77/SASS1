import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getAuth } from 'firebase/auth';
import { Save, ArrowRight, Monitor, Smartphone, Palette, Type, LayoutTemplate, Layers, FileText, Plus, Trash2, Sparkles, Check, Image as ImageIcon, Globe, Sliders, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TemplateRenderer from '../components/TemplateRenderer';
import SiteFooter from '../components/SiteFooter';
import { applyTenantTheme } from '../lib/themeOptimizer';
import { getDefaultHeroForTemplate } from '../lib/defaultData';

export default function SuperAdminEditor() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // content, colors, backgrounds, typography, layout
  const [previewMode, setPreviewMode] = useState('desktop');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchContent();
  }, [tenantId]);

  useEffect(() => {
    if (content) {
      applyTenantTheme(content);
    }
  }, [content]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchContent = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/tenants/${tenantId}/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || {});
        setTemplateId(data.templateId);
        setTenant(data.tenant);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/tenants/${tenantId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        showToast(' تم نشر التغييرات وحفظها بنجاح لموقع المشترك!');
      } else {
        showToast('حدث خطأ أثناء الحفظ');
      }
    } catch (e) {
      console.error(e);
      showToast('خطأ في الاتصال بالخادم');
    }
    setSaving(false);
  };

  const handleChange = (key: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    if (!content?.items) return;
    const newItems = [...content.items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Maintain backwards compatibility with title vs name, price vs priceText
    if (field === 'title') newItems[index].name = value;
    if (field === 'price') newItems[index].priceText = value;
    handleChange('items', newItems);
  };

  const handleAddItem = () => {
    const currentItems = content?.items || [];
    const newItem = {
      id: Date.now(),
      title: 'عنصر جديد',
      name: 'عنصر جديد',
      price: '100',
      priceText: '100 ر.س',
      category: 'عام',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
      description: 'وصف افتراضي للعنصر الجديد المضاف من قبل الأدمن'
    };
    handleChange('items', [newItem, ...currentItems]);
    showToast('تم إضافة عنصر جديد للقائمة');
  };

  const handleDeleteItem = (index: number) => {
    if (!content?.items) return;
    const newItems = content.items.filter((_: any, i: number) => i !== index);
    handleChange('items', newItems);
    showToast('تم حذف العنصر');
  };

  if (loading) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-slate-950 text-white font-['Tajawal'] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-slate-300 font-bold text-sm tracking-wide">جاري تحميل المحرر الفائق (God-Mode Editor)...</p>
      </div>
    </div>
  );

  if (!content) return (
    <div className="h-[100dvh] flex items-center justify-center bg-slate-950 text-white font-['Tajawal']">
      <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl text-center backdrop-blur-xl">
        <p className="text-slate-300 font-bold">لم يتم العثور على محتوى الموقع المحدد</p>
        <button onClick={() => navigate('/admin')} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all">
          العودة للوحة التحكم
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-950 text-white font-['Tajawal'] overflow-hidden relative" dir="rtl">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 font-bold text-sm"
          >
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2.5 hover:bg-slate-800/80 rounded-xl transition-all text-slate-400 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-bold" title="العودة للوحة الإدارة">
            <ArrowRight className="w-5 h-5" />
            <span className="hidden sm:inline">لوحة الإدارة</span>
          </button>
          <button onClick={() => navigate('/')} className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-600/20 text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold" title="العودة للموقع الرئيسي مع البقاء مسجل الدخول">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>العودة للموقع (بدون خروج)</span>
          </button>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <h1 className="font-black text-base flex items-center gap-2 text-white">
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider">God Mode</span>
              محرر الإدارة المتقدم (Ultimate SuperAdmin)
            </h1>
            <p className="text-[11px] text-slate-400">
              المستأجر: <span className="text-slate-200 font-bold">{tenant?.name || 'غير معروف'}</span> ({tenant?.subdomain}.saasaa.com)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${previewMode === 'desktop' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="w-4 h-4" />
              <span>كمبيوتر</span>
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${previewMode === 'mobile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" />
              <span>جوال</span>
            </button>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="relative group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-6 py-2.5 rounded-xl font-black text-xs transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] flex items-center gap-2 border border-emerald-400/30 active:scale-95"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري النشر...' : 'نشر التغييرات فوراً'}
          </button>
        </div>
      </header>

      {/* Mobile Mode Switcher Bar */}
      <div className="md:hidden bg-slate-900/90 border-b border-slate-800 p-2 flex items-center justify-center gap-2 z-20 shrink-0 backdrop-blur-md">
        <button
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileView === 'editor'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>أدوات وقائمة التعديل</span>
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileView === 'preview'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>المعاينة الحية</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        <aside className={`w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800/80 bg-slate-900/30 backdrop-blur-xl flex-col shrink-0 h-full order-2 md:order-1 z-10 ${mobileView === 'editor' ? 'flex flex-1' : 'hidden md:flex'}`}>
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800/80 overflow-x-auto custom-scrollbar bg-slate-950/40 p-1 gap-1">
            <button 
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${activeTab === 'content' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              المحتوى
            </button>
            <button 
              onClick={() => setActiveTab('colors')}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${activeTab === 'colors' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <Palette className="w-3.5 h-3.5" />
              الألوان
            </button>
            <button 
              onClick={() => setActiveTab('backgrounds')}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${activeTab === 'backgrounds' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              الخلفيات
            </button>
            <button 
              onClick={() => setActiveTab('typography')}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${activeTab === 'typography' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <Type className="w-3.5 h-3.5" />
              الخطوط
            </button>
            <button 
              onClick={() => setActiveTab('layout')}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 ${activeTab === 'layout' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              التخطيط
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl text-xs text-slate-200 font-medium leading-relaxed space-y-1">
                  <div className="font-black text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>تحكم God-Mode الشامل بالمحتوى:</span>
                  </div>
                  <p className="text-slate-300">
                    يمكنك تعديل أي نص، عنوان، معلومات اتصالات، وكذلك جميع عناصر ومنتجات القالب مباشرة.
                  </p>
                </div>

                {/* Core Brand & Hero Details */}
                <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">معلومات الهوية والبانر الرئيسي</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">اسم النشاط التجاري / العنوان الرئيسي</label>
                    <input 
                      type="text" 
                      value={content?.title || content?.headerTitle || ''} 
                      onChange={(e) => {
                        handleChange('title', e.target.value);
                        handleChange('headerTitle', e.target.value);
                      }} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">عنوان البانر الرئيسي (Hero Title)</label>
                    <input 
                      type="text" 
                      value={content?.heroTitle || ''} 
                      onChange={(e) => handleChange('heroTitle', e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">الوصف الفرعي للبانر (Hero Subtitle / Description)</label>
                    <textarea 
                      rows={2}
                      value={content?.heroSubtitle || content?.heroDescription || ''} 
                      onChange={(e) => {
                        handleChange('heroSubtitle', e.target.value);
                        handleChange('heroDescription', e.target.value);
                      }} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">رقم الهاتف</label>
                      <input 
                        type="text" 
                        value={content?.phone || ''} 
                        onChange={(e) => handleChange('phone', e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300">رقم الواتساب</label>
                      <input 
                        type="text" 
                        value={content?.whatsapp || ''} 
                        onChange={(e) => handleChange('whatsapp', e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">نص التذييل النهائي (Footer Text)</label>
                    <input 
                      type="text" 
                      value={content?.footerText || ''} 
                      onChange={(e) => handleChange('footerText', e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Dynamic Items Array Editor */}
                <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider">عناصر ومنتجات القالب ({content?.items?.length || 0})</h3>
                      <p className="text-[10px] text-slate-400">تعديل مباشر لكل عنصر داخل القالب</p>
                    </div>
                    <button 
                      onClick={handleAddItem}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة عنصر
                    </button>
                  </div>

                  {(!content?.items || content.items.length === 0) ? (
                    <div className="text-center py-6 text-slate-500 text-xs font-bold">لا توجد عناصر مخصصة حالياً</div>
                  ) : (
                    <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                      {content.items.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3 relative group hover:border-slate-700 transition-colors">
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <span className="text-[10px] font-black bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">عنصر #{idx + 1}</span>
                            <button 
                              onClick={() => handleDeleteItem(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                              title="حذف هذا العنصر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">عنوان العنصر</label>
                              <input 
                                type="text" 
                                value={item.title || item.name || ''} 
                                onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400">السعر</label>
                              <input 
                                type="text" 
                                value={item.price || item.priceText || ''} 
                                onChange={(e) => handleUpdateItem(idx, 'price', e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-amber-400 font-bold outline-none focus:border-amber-500 text-center"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">رابط صورة العنصر (URL)</label>
                            <div className="flex gap-2 items-center">
                              <input 
                                type="text" 
                                value={item.image || ''} 
                                onChange={(e) => handleUpdateItem(idx, 'image', e.target.value)} 
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono outline-none focus:border-amber-500"
                                dir="ltr"
                              />
                              {item.image && (
                                <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400">الوصف التفصيلي</label>
                            <textarea 
                              rows={2}
                              value={item.description || ''} 
                              onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)} 
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* COLORS TAB */}
            {activeTab === 'colors' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="bg-slate-800/60 border border-slate-700/80 p-3 rounded-2xl text-xs text-slate-200 font-medium leading-relaxed">
                  <strong className="font-bold">God-Mode Styling:</strong> أي لون يتم اختياره هنا يتزامن مع لوحة ألوان الموقع ويعيد صياغة الثيم فوراً.
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>اللون الأساسي (Primary Accent)</span>
                    <span className="font-mono text-[10px] text-slate-500">{content?.primaryColor || '#ff4b2b'}</span>
                  </label>
                  <div className="flex gap-3 items-center bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <input type="color" value={content?.primaryColor || '#ff4b2b'} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                    <input type="text" value={content?.primaryColor || '#ff4b2b'} onChange={(e) => handleChange('primaryColor', e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-left font-mono text-white" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>اللون الثانوي (Secondary Theme)</span>
                    <span className="font-mono text-[10px] text-slate-500">{content?.secondaryColor || '#ffffff'}</span>
                  </label>
                  <div className="flex gap-3 items-center bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <input type="color" value={content?.secondaryColor || '#ffffff'} onChange={(e) => handleChange('secondaryColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                    <input type="text" value={content?.secondaryColor || '#ffffff'} onChange={(e) => handleChange('secondaryColor', e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-left font-mono text-white" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>لون النص الرئيسي (Body Text Color)</span>
                    <span className="font-mono text-[10px] text-slate-500">{content?.textColor || '#1f2937'}</span>
                  </label>
                  <div className="flex gap-3 items-center bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <input type="color" value={content?.textColor || '#1f2937'} onChange={(e) => handleChange('textColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                    <input type="text" value={content?.textColor || '#1f2937'} onChange={(e) => handleChange('textColor', e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-left font-mono text-white" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>خلفية الموقع العامة (Background Color)</span>
                    <span className="font-mono text-[10px] text-slate-500">{content?.bgColor || '#ffffff'}</span>
                  </label>
                  <div className="flex gap-3 items-center bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <input type="color" value={content?.bgColor || '#ffffff'} onChange={(e) => handleChange('bgColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0" />
                    <input type="text" value={content?.bgColor || '#ffffff'} onChange={(e) => handleChange('bgColor', e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-left font-mono text-white" dir="ltr" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* BACKGROUNDS TAB */}
            {activeTab === 'backgrounds' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">صورة خلفية القسم الرئيسي (Hero Background)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultHero = getDefaultHeroForTemplate(templateId || 1);
                        handleChange('heroImage', defaultHero);
                        handleChange('heroBgUrl', defaultHero);
                      }}
                      className="text-[10px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all flex items-center gap-1 shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>استعادة الأصلية</span>
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={content?.heroImage || content?.heroBgUrl || ''} 
                    onChange={(e) => {
                      handleChange('heroImage', e.target.value);
                      handleChange('heroBgUrl', e.target.value);
                    }} 
                    placeholder="https://..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500" 
                    dir="ltr"
                  />
                  {(content?.heroImage || content?.heroBgUrl) && (
                    <div className="h-28 w-full rounded-xl overflow-hidden border border-slate-800 relative">
                      <img src={content?.heroImage || content?.heroBgUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold">معاينة الخلفية</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">درجة عتمة الطبقة التراكبية للخلفية (Hero Overlay Opacity)</label>
                  <input 
                    type="range" min="0" max="90" step="5"
                    value={content?.heroOverlayOpacity ?? 50} 
                    onChange={(e) => handleChange('heroOverlayOpacity', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400 text-center font-mono">{content?.heroOverlayOpacity ?? 50}%</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">صورة خلفية القالب كاملة (Full Template Custom Pattern/BG)</label>
                  <input 
                    type="text" 
                    value={content?.templateBgImage || ''} 
                    onChange={(e) => handleChange('templateBgImage', e.target.value)} 
                    placeholder="https://..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-amber-500" 
                    dir="ltr"
                  />
                </div>
              </motion.div>
            )}

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">خط القالب العربي المختار (Font Family)</label>
                  <select 
                    value={content?.fontFamily || 'Tajawal'} 
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                  >
                    <option value="Tajawal">تجوال (Tajawal - حديث وأنيق)</option>
                    <option value="Cairo">كايرو (Cairo - عريض وواضح)</option>
                    <option value="Almarai">المراعي (Almarai - عصري ناعم)</option>
                    <option value="Changa">تشانجا (Changa - ديناميكي)</option>
                    <option value="Amiri">الأميري (Amiri - كلاسيكي فاخر)</option>
                    <option value="Inter">Inter (English Standard)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech Modern)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">حجم الخط الأساسي (Base Font Scale)</label>
                  <input 
                    type="range" min="13" max="22" 
                    value={content?.baseFontSize || 16} 
                    onChange={(e) => handleChange('baseFontSize', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400 text-center font-mono">{content?.baseFontSize || 16}px</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">وزن العناوين الرئيسية (Heading Weight)</label>
                  <select 
                    value={content?.headingWeight || 'font-black'} 
                    onChange={(e) => handleChange('headingWeight', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-500"
                  >
                    <option value="font-extrabold">عريض جداً (Extra Bold)</option>
                    <option value="font-black">أسود داكن (Black - 900)</option>
                    <option value="font-bold">عريض عادي (Bold)</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* LAYOUT TAB */}
            {activeTab === 'layout' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">إتاحة وإخفاء الأقسام (Sections Toggle)</h3>
                  
                  {[
                    { id: 'showHero', label: 'القسم الرئيسي (Hero)' },
                    { id: 'showFeatures', label: 'قسم المميزات / الأقسام' },
                    { id: 'showGallery', label: 'معرض الصور / المنتجات' },
                    { id: 'showTestimonials', label: 'آراء العملاء والتقييمات' },
                    { id: 'showContact', label: 'قسم معلومات الاتصال' }
                  ].map(section => (
                    <div key={section.id} className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-300 font-medium">{section.label}</span>
                      <button 
                        onClick={() => handleChange(section.id, content[section.id] !== false ? false : true)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${content[section.id] !== false ? 'bg-emerald-500' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${content[section.id] !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">انحناء زوايا الأزرار (Buttons Border Radius)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'rounded-none', label: 'حاد (Square)' },
                      { id: 'rounded-md', label: 'عادي (Slight)' },
                      { id: 'rounded-2xl', label: 'دائري (Rounded)' },
                      { id: 'rounded-full', label: 'بيضاوي (Pill)' }
                    ].map(r => (
                      <button 
                        key={r.id}
                        onClick={() => handleChange('buttonRadius', r.id)}
                        className={`py-2 text-xs font-bold border transition-all ${
                          (content?.buttonRadius || 'rounded-2xl') === r.id 
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                            : 'border-slate-800 text-slate-400 hover:border-slate-700'
                        } rounded-xl`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </aside>

        {/* Live Canvas Preview Area */}
        <main className={`flex-1 bg-slate-950 overflow-hidden items-center justify-center p-4 md:p-8 relative order-1 md:order-2 ${mobileView === 'preview' ? 'flex flex-1 min-h-[70vh]' : 'hidden md:flex'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 pointer-events-none"></div>
          
          <div className={`transition-all duration-500 ease-in-out relative border-8 border-slate-900 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-black/80 ${previewMode === 'mobile' ? 'w-[375px] max-w-[90vw] h-[812px] max-h-[80vh]' : 'w-full h-full max-w-6xl'}`}>
            <div className="absolute inset-0 overflow-y-auto">
              {templateId ? (
                <>
                  <TemplateRenderer templateId={templateId} content={content} tenant={tenant} />
                  <SiteFooter content={content} tenant={tenant} />
                </>
              ) : (
                <div className="p-8 text-center text-slate-500">جاري تحميل القالب...</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

