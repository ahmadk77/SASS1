import React, { useState } from 'react';
import { 
  FileText, 
  FilePlus, 
  Edit3, 
  Trash2, 
  Eye, 
  Search, 
  Globe, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Layers, 
  PlusCircle, 
  Share2 
} from 'lucide-react';

export interface CmsItem {
  id: number;
  type: 'page' | 'post';
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorName?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

const INITIAL_CMS_DATA: CmsItem[] = [
  {
    id: 1,
    type: 'page',
    title: 'من نحن - قصة متجرنا',
    slug: 'about-us',
    content: 'نحن متجر رائد في تقديم أرقى المنتجات والخدمات المميزة في المملكة والخليج بأعلى معايير الجودة والاحترافية.',
    seoTitle: 'من نحن | متجرنا الإلكتروني المميز',
    seoDescription: 'تعرف على قصة تأسيس متجرنا ورؤيتنا في تقديم أفضل المنتجات والخدمات.',
    seoKeywords: 'من نحن, متجر, جودة, تسوق',
    status: 'published',
    createdAt: '2026-07-20',
    updatedAt: '2026-07-21',
  },
  {
    id: 2,
    type: 'page',
    title: 'سياسة الخصوصية والشروط',
    slug: 'privacy-policy',
    content: 'تحدد هذه السياسة كيفية التعامل مع بيانات العملاء وحمايتها وفق الأنظمة والقوانين المعمول بها.',
    seoTitle: 'سياسة الخصوصية والأمان',
    seoDescription: 'احرص على قراءة سياسة الخصوصية وشروط الاستخدام لمتجرنا.',
    seoKeywords: 'خصوصية, أمان, شروط الاستخدام',
    status: 'published',
    createdAt: '2026-07-18',
    updatedAt: '2026-07-18',
  },
  {
    id: 3,
    type: 'post',
    title: 'أفضل 5 نصائح لاختيار المنتجات العصرية لعام 2026',
    slug: 'top-5-shopping-tips-2026',
    content: 'تتغير الموضة والمنتجات المبتكرة باستمرار. إليك أهم 5 معايير يجب الانتباه لها عند الشراء عبر الإنترنت لضمان أقصى قيمة مقابل السعر.',
    excerpt: 'دليل شامل لاختيار المنتجات الذكية لعام 2026 بأفضل العروض.',
    coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    authorName: 'فريق التحرير',
    seoTitle: 'نصائح التسوق العصري 2026',
    seoDescription: 'اكتشف النصائح الذهبية للتسوق الذكي من متجرنا.',
    seoKeywords: 'تخفيضات, تسوق, 2026, نصائح',
    status: 'published',
    createdAt: '2026-07-21',
    updatedAt: '2026-07-22',
  },
  {
    id: 4,
    type: 'post',
    title: 'دليل العناية بالمنتجات والحفاظ على جودتها',
    slug: 'product-care-guide',
    content: 'للحفاظ على جودة مشترياتك لأطول فترة ممكنة، نوصي باتباع الخطوات والملاحظات التالية في الاستخدام والتخزين.',
    excerpt: 'تعلم الطرق الصحيحة للعناية بمنتجاتك وتمديد عمرها الافتراضي.',
    authorName: 'قسم الدعم الفني',
    seoTitle: 'دليل العناية بالمنتجات',
    seoDescription: 'نصائح إرشادية لحفظ المنتجات في أفضل حالة.',
    status: 'draft',
    createdAt: '2026-07-22',
    updatedAt: '2026-07-22',
  }
];

export const CmsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'page' | 'post'>('page');
  const [items, setItems] = useState<CmsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CmsItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CmsItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    authorName: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    status: 'published' as 'draft' | 'published',
  });

  const loadCmsData = async () => {
    try {
      setLoading(true);
      const [pagesRes, postsRes] = await Promise.all([
        fetch('/api/cms/pages'),
        fetch('/api/cms/posts')
      ]);

      const pagesData = await pagesRes.json();
      const postsData = await postsRes.json();

      let fetchedPages: CmsItem[] = (pagesData.pages || []).map((p: any) => ({
        id: p.id,
        type: 'page',
        title: p.title,
        slug: p.slug,
        content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content),
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords,
        status: p.status || 'published',
        createdAt: p.createdAt ? String(p.createdAt).split('T')[0] : '2026-07-22',
        updatedAt: p.updatedAt ? String(p.updatedAt).split('T')[0] : '2026-07-22',
      }));

      let fetchedPosts: CmsItem[] = (postsData.posts || []).map((p: any) => ({
        id: p.id,
        type: 'post',
        title: p.title,
        slug: p.slug,
        content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content),
        excerpt: p.excerpt,
        coverImage: p.coverImage,
        authorName: p.authorName,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords,
        status: p.status || 'published',
        createdAt: p.createdAt ? String(p.createdAt).split('T')[0] : '2026-07-22',
        updatedAt: p.updatedAt ? String(p.updatedAt).split('T')[0] : '2026-07-22',
      }));

      // If DB is completely empty, seed initial data into DB automatically
      if (fetchedPages.length === 0 && fetchedPosts.length === 0) {
        for (const initItem of INITIAL_CMS_DATA) {
          const endpoint = initItem.type === 'page' ? '/api/cms/pages' : '/api/cms/posts';
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initItem),
          });
        }
        // Reload after initial seed
        const [rePagesRes, rePostsRes] = await Promise.all([
          fetch('/api/cms/pages'),
          fetch('/api/cms/posts')
        ]);
        const rePagesData = await rePagesRes.json();
        const rePostsData = await rePostsRes.json();
        fetchedPages = (rePagesData.pages || []).map((p: any) => ({
          id: p.id,
          type: 'page',
          title: p.title,
          slug: p.slug,
          content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content),
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          seoKeywords: p.seoKeywords,
          status: p.status || 'published',
          createdAt: p.createdAt ? String(p.createdAt).split('T')[0] : '2026-07-22',
          updatedAt: p.updatedAt ? String(p.updatedAt).split('T')[0] : '2026-07-22',
        }));
        fetchedPosts = (rePostsData.posts || []).map((p: any) => ({
          id: p.id,
          type: 'post',
          title: p.title,
          slug: p.slug,
          content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content),
          excerpt: p.excerpt,
          coverImage: p.coverImage,
          authorName: p.authorName,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          seoKeywords: p.seoKeywords,
          status: p.status || 'published',
          createdAt: p.createdAt ? String(p.createdAt).split('T')[0] : '2026-07-22',
          updatedAt: p.updatedAt ? String(p.updatedAt).split('T')[0] : '2026-07-22',
        }));
      }

      setItems([...fetchedPages, ...fetchedPosts]);
    } catch (e) {
      console.error('Error loading CMS data:', e);
      setItems(INITIAL_CMS_DATA);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCmsData();
  }, []);

  const filteredItems = items
    .filter(i => i.type === activeTab)
    .filter(i => 
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      authorName: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      status: 'published',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: CmsItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      content: item.content,
      excerpt: item.excerpt || '',
      authorName: item.authorName || '',
      seoTitle: item.seoTitle || '',
      seoDescription: item.seoDescription || '',
      seoKeywords: item.seoKeywords || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت تأكد من حذف هذا العنصر نهائياً؟')) return;
    try {
      const targetItem = items.find(i => i.id === id);
      if (targetItem) {
        const endpoint = targetItem.type === 'page' ? `/api/cms/pages/${id}` : `/api/cms/posts/${id}`;
        await fetch(endpoint, { method: 'DELETE' });
      }
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const generatedSlug = formData.slug.trim() || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0621-\u064A-]+/g, '');

    try {
      if (editingItem) {
        const endpoint = editingItem.type === 'page' ? `/api/cms/pages/${editingItem.id}` : `/api/cms/posts/${editingItem.id}`;
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            slug: generatedSlug,
            content: formData.content,
            excerpt: formData.excerpt,
            authorName: formData.authorName,
            seoTitle: formData.seoTitle,
            seoDescription: formData.seoDescription,
            seoKeywords: formData.seoKeywords,
            status: formData.status,
          })
        });
        if (res.ok) {
          await loadCmsData();
        }
      } else {
        const endpoint = activeTab === 'page' ? '/api/cms/pages' : '/api/cms/posts';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            slug: generatedSlug,
            content: formData.content,
            excerpt: formData.excerpt,
            authorName: formData.authorName,
            seoTitle: formData.seoTitle,
            seoDescription: formData.seoDescription,
            seoKeywords: formData.seoKeywords,
            status: formData.status,
          })
        });
        if (res.ok) {
          await loadCmsData();
        }
      }
    } catch (err) {
      console.error('Error submitting CMS item:', err);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#008060] mb-1">
            <Globe size={18} />
            <span>نظام إدارة المحتوى والمقالات (CMS Engine)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">الصفحات التعريفية والمقالات</h2>
          <p className="text-xs text-slate-500 mt-1">أنشئ صفحات مستقلة ومقالات مدونة مجهزة بتهيئة محركات البحث (SEO).</p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#008060] hover:bg-[#006e52] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <PlusCircle size={16} />
          <span>{activeTab === 'page' ? 'إضافة صفحة جديدة' : 'إضافة مقال جديد'}</span>
        </button>
      </div>

      {/* Tabs & Filter Control */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('page')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'page'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} />
            <span>الصفحات ({items.filter(i => i.type === 'page').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('post')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'post'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 size={15} />
            <span>المقالات ({items.filter(i => i.type === 'post').length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={activeTab === 'page' ? 'بحث في الصفحات...' : 'بحث في المقالات...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all"
          />
          <Search size={15} className="absolute right-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FilePlus size={24} />
            </div>
            <h3 className="font-bold text-sm text-slate-800">لا توجد محتويات حتى الآن</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              قم بإنشاء {activeTab === 'page' ? 'صفحة تعريفية جديدة' : 'مقال جديد'} لزيادة تفاعل الزوار وتحسين حضورك في محركات البحث.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 transition-all inline-flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              <span>إنشاء الآن</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">العنوان والوصف</th>
                  <th className="p-4">الرابط اللطيف (Slug)</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">تاريخ التحديث</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#008060] flex items-center justify-center shrink-0 mt-0.5">
                          {item.type === 'page' ? <FileText size={18} /> : <Edit3 size={18} />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-sm group-hover:text-[#008060] transition-colors">
                            {item.title}
                          </span>
                          {item.excerpt && (
                            <span className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                              {item.excerpt}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 dir-ltr text-right font-mono text-slate-600 font-medium">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[11px]">
                        /{item.slug}
                      </span>
                    </td>

                    <td className="p-4">
                      {item.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <CheckCircle2 size={12} />
                          <span>منشور</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <Clock size={12} />
                          <span>مسودة</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {item.updatedAt}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                          title="معاينة"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#008060] hover:bg-emerald-50 transition-all"
                          title="تعديل"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#008060] text-white flex items-center justify-center font-bold text-sm">
                  {activeTab === 'page' ? <FileText size={16} /> : <Edit3 size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingItem ? `تعديل ${activeTab === 'page' ? 'الصفحة' : 'المقال'}` : `إنشاء ${activeTab === 'page' ? 'صفحة جديدة' : 'مقال جديد'}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">أدخل كافة المعلومات وتفاصيل تهيئة محركات البحث SEO.</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Title & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">عنوان المحتوى *</label>
                  <input
                    type="text"
                    required
                    placeholder={activeTab === 'page' ? 'مثال: الشروط والأحكام' : 'مثال: أهم صيحات عام 2026'}
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">حالة النشر</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all"
                  >
                    <option value="published">منشور (Public)</option>
                    <option value="draft">مسودة (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">الرابط الفرعي (Slug)</label>
                <input
                  type="text"
                  placeholder="اتركه فارغاً للتوليد التلقائي من العنوان"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all dir-ltr text-right"
                />
              </div>

              {/* Post specific fields */}
              {activeTab === 'post' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">اسم الكاتب</label>
                    <input
                      type="text"
                      placeholder="مثال: فريق التحرير"
                      value={formData.authorName}
                      onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">مقتطف مختصر</label>
                    <input
                      type="text"
                      placeholder="ملخص قصير للمقال يظهر في القائمة"
                      value={formData.excerpt}
                      onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Content Body */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">محتوى {activeTab === 'page' ? 'الصفحة' : 'المقال'}</label>
                <textarea
                  rows={6}
                  placeholder="اكتب المحتوى بالتفصيل هنا..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all"
                ></textarea>
              </div>

              {/* SEO Settings Block */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles size={15} className="text-amber-500" />
                  <span>إعدادات تهيئة محركات البحث (SEO Meta)</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">عنوان SEO (Meta Title)</label>
                    <input
                      type="text"
                      placeholder="العنوان الذي سيظهر في نتائج محرك بحث جوجل"
                      value={formData.seoTitle}
                      onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">وصف SEO (Meta Description)</label>
                    <textarea
                      rows={2}
                      placeholder="وصف مختصر ومحفز للضغط عند ظهور المقال في محرك البحث"
                      value={formData.seoDescription}
                      onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060]"
                    ></textarea>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">الكلمات المفتاحية (Keywords)</label>
                    <input
                      type="text"
                      placeholder="مثال: متجر, عروض, تسوق"
                      value={formData.seoKeywords}
                      onChange={e => setFormData({ ...formData, seoKeywords: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold shadow-sm transition-all"
                >
                  {editingItem ? 'حفظ التعديلات' : 'نشر وإنشاء'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                معاينة {viewingItem.type === 'page' ? 'الصفحة' : 'المقال'}
              </span>
              <button onClick={() => setViewingItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">{viewingItem.title}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">/{viewingItem.slug}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
              {viewingItem.content}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default CmsManager;
