import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Wrench, X, Image as ImageIcon, Sparkles, Layers, Users, Ruler, PackageCheck, CheckCircle2, Clock, DollarSign, Building } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function DecorFinishingManager({ content, setContent }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    clientName: 'شركة الأفق العقارية',
    category: 'فلل سكنية',
    style: 'مودرن فاخر',
    areaSqm: '350 م²',
    completionPhase: 'التشطيبات النهائية والباركيه',
    budget: '120,000 ر.س',
    duration: '6 أسابيع',
    location: 'الرياض',
    description: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000'
    ]
  });

  const projects = Array.isArray(content?.projects) 
    ? content.projects 
    : (Array.isArray(content?.items) ? content.items : [
        { title: 'فيلا قصر النخيل', clientName: 'الشيخ فهد التميمي', category: 'فلل سكنية', style: 'مودرن فاخر', areaSqm: '680 م²', completionPhase: 'التشطيبات النهائية والباركيه', budget: '340,000 ر.س', duration: '8 أسابيع', location: 'الرياض', description: 'تصميم وتشطيب متكامل لقصر سكني مع إضاءات مخفية وأرضيات رخام إيطالي وجداريات فنية.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800', images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'] },
        { title: 'المكاتب الإدارية لشركة أفق', clientName: 'شركة أفق للتقنية', category: 'مكاتب تجارية', style: 'نيوكلاسيك معاصر', areaSqm: '850 م²', completionPhase: 'تركيب الأسقف المستعارة والزجاج', budget: '420,000 ر.س', duration: '10 أسابيع', location: 'جدة', description: 'تنفيذ وتجهيز طابق كامل مكاتب تنفيذية وقاعات اجتماعات ذكية بتصميم عصري.', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800', images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800'] },
        { title: 'بنتهاوس أفق الرياض', clientName: 'د. خالد السعيد', category: 'شقق فارهة', style: 'جاباندي (Japandi)', areaSqm: '320 م²', completionPhase: 'تسليم ومراجعة الجودة', budget: '185,000 ر.س', duration: '5 أسابيع', location: 'الخبر', description: 'ديكورات خشبية دافئة وتصاميم هندسية minimalist تمنح السكينة والرحابة.', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800'] },
      ]);

  // 8 Required Detailed KPI / Stats Cards
  const activeFitOutSites = projects.length;
  const pendingConsultationsCount = Array.isArray(content?.consultations) ? content.consultations.length : 5;
  const totalAreaUnderFinishing = projects.reduce((acc: number, p: any) => {
    const num = parseInt((p.areaSqm || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + num;
  }, 1850);
  const handedOverProjects = 34;
  const activeSiteTeams = 12;
  const materialProcurementAlerts = 'شحنة الرخام الإيطالي في الطريق (متبقي 2 يوم)';
  const upcomingHandoverDeadlines = 'فيلا قصر النخيل (خلال 6 أيام)';
  const monthlyContractValue = '940,000 ر.س';

  const categories = ['all', ...Array.from(new Set(projects.map((p: any) => p.category).filter(Boolean)))];

  const filteredProjects = projects.filter((item: any) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const name = item.name || item.title || '';
    const desc = item.description || item.location || item.clientName || '';
    return matchesCat && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({ 
      title: '', 
      clientName: '',
      category: 'فلل سكنية', 
      style: 'مودرن فاخر',
      areaSqm: '300 م²',
      completionPhase: 'التأسيس والخلطة الأسمنتية',
      budget: '150,000 ر.س',
      duration: '6 أسابيع',
      location: 'الرياض',
      description: '',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000', 
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000'
      ] 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'];
    setNewItemForm({
      title: item.title || item.name || '',
      clientName: item.clientName || '',
      category: item.category || 'فلل سكنية',
      style: item.style || 'مودرن فاخر',
      areaSqm: item.areaSqm || '300 م²',
      completionPhase: item.completionPhase || 'التشطيبات النهائية',
      budget: item.budget || '150,000 ر.س',
      duration: item.duration || '6 أسابيع',
      location: item.location || 'الرياض',
      description: item.description || '',
      image: itemImages[0],
      images: itemImages
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title) return;
    const updated = [...projects];
    const finalImages = newItemForm.images.length > 0 ? newItemForm.images : [newItemForm.image];
    const data = {
      id: editingIndex !== null && projects[editingIndex]?.id ? projects[editingIndex].id : Date.now(),
      title: newItemForm.title,
      name: newItemForm.title,
      clientName: newItemForm.clientName,
      category: newItemForm.category,
      style: newItemForm.style,
      areaSqm: newItemForm.areaSqm,
      completionPhase: newItemForm.completionPhase,
      budget: newItemForm.budget,
      duration: newItemForm.duration,
      location: newItemForm.location,
      description: newItemForm.description,
      image: finalImages[0],
      images: finalImages
    };
    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    setContent({ ...content, projects: updated, items: updated });
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع أو باقة التشطيب؟')) return;
    const updated = projects.filter((_: any, i: number) => i !== index);
    setContent({ ...content, projects: updated, items: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* 8 Required Comprehensive KPI / Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">1. مواقع التشطيب النشطة</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeFitOutSites} مواقع</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">2. الاستشارات والطلبات المعلقة</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingConsultationsCount} طلب</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">3. إجمالي المساحة تحت التشطيب</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalAreaUnderFinishing.toLocaleString()} م²</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Ruler size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">4. المشاريع المسلمة بنجاح</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{handedOverProjects} مشروع</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">5. الفرق الهندسية والمقاولون</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeSiteTeams} فرق نشطة</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">6. تنبيهات توريد المواد</p>
            <h3 className="text-xs font-black text-amber-700 mt-2 line-clamp-1">{materialProcurementAlerts}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <PackageCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">7. مواعيد التسليم القادمة</p>
            <h3 className="text-xs font-black text-emerald-700 mt-2 line-clamp-1">{upcomingHandoverDeadlines}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">8. قيمة العقود الشهرية</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{monthlyContractValue}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-stone-900 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Wrench size={14} /> لوحة تحكم شركة الديكور والتشطيب الفاخر (DecorAndFinishing Manager)
          </div>
          <h2 className="text-2xl font-black">إدارة مشاريع الفلل، المكاتب، باقات التشطيب والمهندسين</h2>
        </div>
        <button onClick={handleOpenAdd} className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all">
          <Plus size={16} /> <span>إضافة مشروع أو باقة تشطيب</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالمشروع، العميل أو الطراز..." className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat: string) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {cat === 'all' ? 'جميع الفئات' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Management Table / Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((item: any, idx: number) => {
          const realIdx = projects.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          const projectImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image];
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="relative h-52 bg-stone-100">
                <img src={projectImages[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-400" /> {item.style || 'مودرن فاخر'}
                </div>
                <span className="absolute bottom-3 left-3 bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow">{item.category || 'فلل سكنية'}</span>
                {projectImages.length > 1 && (
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <ImageIcon size={12} /> {projectImages.length} صور
                  </span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-slate-900 text-base">{item.title || item.name}</h3>
                    {item.clientName && <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold">{item.clientName}</span>}
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-3">{item.description}</p>
                  
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">مرحلة التنفيذ الحالية:</span>
                      <span className="font-bold text-amber-700">{item.completionPhase || 'التشطيبات والدهانات'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المساحة:</span>
                      <span className="font-black text-slate-800">{item.areaSqm || '300 م²'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">الميزانية / التكلفة:</span>
                      <span className="font-black text-slate-900">{item.budget || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-slate-100 text-slate-700 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-bold px-3">
                    <Edit size={14} /> تعديل
                  </button>
                  <button onClick={() => handleDelete(realIdx >= 0 ? realIdx : idx)} className="p-2 bg-rose-50 text-rose-600 rounded-xl cursor-pointer hover:bg-rose-100 transition-colors flex items-center gap-1 text-xs font-bold px-3">
                    <Trash2 size={14} /> حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل المشروع أو الباقة' : 'إضافة مشروع أو باقة تشطيب جديدة'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المشروع أو باقة التشطيب *</label>
                  <input type="text" required value={newItemForm.title} onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })} placeholder="مثال: فيلا قصر النخيل" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل (اختياري)</label>
                  <input type="text" value={newItemForm.clientName} onChange={e => setNewItemForm({ ...newItemForm, clientName: e.target.value })} placeholder="مثال: الشيخ فهد التميمي" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">فئة العقار</label>
                  <select value={newItemForm.category} onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-xs font-bold bg-white">
                    <option value="فلل سكنية">فلل سكنية</option>
                    <option value="مكاتب تجارية">مكاتب تجارية</option>
                    <option value="شقق فارهة">شقق فارهة</option>
                    <option value="مطاعم ومقاهي">مطاعم ومقاهي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الطراز المعماري</label>
                  <input type="text" value={newItemForm.style} onChange={e => setNewItemForm({ ...newItemForm, style: e.target.value })} placeholder="مثال: مودرن فاخر، نيوكلاسيك" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المساحة (Sqm)</label>
                  <input type="text" value={newItemForm.areaSqm} onChange={e => setNewItemForm({ ...newItemForm, areaSqm: e.target.value })} placeholder="مثال: 500 م²" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مرحلة التنفيذ الحالية</label>
                  <input type="text" value={newItemForm.completionPhase} onChange={e => setNewItemForm({ ...newItemForm, completionPhase: e.target.value })} placeholder="مثال: التشطيبات النهائية" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الميزانية أو التكلفة</label>
                  <input type="text" value={newItemForm.budget} onChange={e => setNewItemForm({ ...newItemForm, budget: e.target.value })} placeholder="مثال: 200,000 ر.س" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مدة التنفيذ</label>
                  <input type="text" value={newItemForm.duration} onChange={e => setNewItemForm({ ...newItemForm, duration: e.target.value })} placeholder="مثال: 8 أسابيع" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموقع أو المدينة</label>
                <input type="text" value={newItemForm.location} onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })} placeholder="مثال: الرياض - حي الملقا" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف تفاصيل التشطيب والمواد</label>
                <textarea rows={3} value={newItemForm.description} onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })} placeholder="اكتب تفاصيل أعمال التشطيب والديكور..." className="w-full px-4 py-3 border rounded-xl text-xs font-medium"></textarea>
              </div>

              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <label className="block text-xs font-bold text-amber-900 mb-1">اختر الصور أو أضف الروابط</label>
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url, images: [url, ...(newItemForm.images.slice(1))] })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">روابط الصور (مفصولة بسطر جديد)</label>
                  <textarea 
                    rows={2} 
                    value={newItemForm.images.join('\n')} 
                    onChange={e => {
                      const urls = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                      setNewItemForm({ ...newItemForm, images: urls.length > 0 ? urls : [newItemForm.image] });
                    }} 
                    placeholder="https://images.unsplash.com/..." 
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-mono"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow cursor-pointer">حفظ المشروع</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
