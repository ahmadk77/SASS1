import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Compass, X, Image as ImageIcon, Sparkles, Layers, Users, Ruler, CheckCircle2, Clock, DollarSign, Building, FileText, Send, AlertCircle } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function ArchitectureDesignManager({ content, tenant, handleUpdateContent, setContent }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    clientName: 'مؤسسة الرياض للتطوير',
    architecturalStyle: 'مودرن معاصر (Ultra-Modern)',
    currentPhase: 'مرحلة التصور والنمذجة 3D',
    areaSqm: '1200 م²',
    designFee: '180,000 ر.س',
    location: 'الرياض - حي الياسمين',
    description: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1000'
    ]
  });

  const projects = Array.isArray(content?.items) && content.items.length > 0 
    ? content.items 
    : (Array.isArray(content?.projects) ? content.projects : [
        { 
          title: 'مجمع الفلل الانسيابية (Aura Residences)', 
          clientName: 'شركة البناء الذكي العقارية', 
          architecturalStyle: 'العمارة العضوية (Organic Modern)', 
          currentPhase: 'مرحلة النمذجة 3D والواجهات', 
          areaSqm: '3400 م²', 
          designFee: '450,000 ر.س', 
          location: 'الرياض', 
          description: 'تصميم معماري متكامل لـ 6 فلل فاخرة بطراز عضوي يتناغم مع الطبيعة.', 
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
          images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'] 
        },
        { 
          title: 'برج الأفق الإداري (Horizon Tower)', 
          clientName: 'مجموعة الأفق الاستثمارية', 
          architecturalStyle: 'نيوكلاسيك معاصر', 
          currentPhase: 'مراجعة المخططات التنفيذية (Blueprints)', 
          areaSqm: '12500 م²', 
          designFee: '1,200,000 ر.س', 
          location: 'جدة', 
          description: 'برج مكاتب تجارية ذكي مكون من 18 طابقاً مع واجهات زجاجية مزدوجة العزل.', 
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800',
          images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800'] 
        },
        { 
          title: 'متحف الفنون المعاصرة (Art Pavilion)', 
          clientName: 'وزارة الثقافة والهيئة المعمارية', 
          architecturalStyle: 'وحشية مبسطة (Brutalism Minimalist)', 
          currentPhase: 'بانتظار الاعتماد النهائي من العميل', 
          areaSqm: '4800 م²', 
          designFee: '680,000 ر.س', 
          location: 'الدرعية', 
          description: 'صرح ثقافي يعتمد على الخرسانة المعمارية المكشوفة والإضاءة الطبيعية الموجهة.', 
          image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800',
          images: ['https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=800'] 
        }
      ]);

  // 8 Professional Stats / KPI Cards
  const activeDesignProjects = projects.length;
  const pendingConsultations = Array.isArray(content?.consultations) ? content.consultations.length : 8;
  const totalDesignedArea = projects.reduce((acc: number, p: any) => {
    const num = parseInt((p.areaSqm || '0').replace(/[^0-9]/g, '')) || 0;
    return acc + num;
  }, 24500);
  const pendingClientApprovals = projects.filter((p: any) => (p.currentPhase || '').includes('اعتماد') || (p.currentPhase || '').includes('انتظار')).length || 3;
  const activeRevisions = 5;
  const completedBlueprints = 42;
  const seniorArchitectsActive = 7;
  const portfolioFeeRevenue = '2,350,000 ر.س';

  const phases = ['all', 'مرحلة التصور والنمذجة 3D', 'مراجعة المخططات التنفيذية (Blueprints)', 'بانتظار الاعتماد النهائي من العميل', 'التسليم النهائي'];

  const filteredProjects = projects.filter((item: any) => {
    const matchesPhase = selectedPhase === 'all' || (item.currentPhase || '').includes(selectedPhase);
    const name = item.name || item.title || '';
    const desc = item.description || item.clientName || item.architecturalStyle || '';
    return matchesPhase && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      title: '',
      clientName: '',
      architecturalStyle: 'مودرن معاصر (Ultra-Modern)',
      currentPhase: 'مرحلة التصور والنمذجة 3D',
      areaSqm: '800 م²',
      designFee: '150,000 ر.س',
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
      architecturalStyle: item.architecturalStyle || item.category || 'مودرن معاصر',
      currentPhase: item.currentPhase || 'مرحلة التصور والنمذجة 3D',
      areaSqm: item.areaSqm || '800 م²',
      designFee: item.designFee || item.budget || '150,000 ر.س',
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
      architecturalStyle: newItemForm.architecturalStyle,
      category: newItemForm.architecturalStyle,
      currentPhase: newItemForm.currentPhase,
      areaSqm: newItemForm.areaSqm,
      designFee: newItemForm.designFee,
      location: newItemForm.location,
      description: newItemForm.description,
      image: finalImages[0],
      images: finalImages
    };
    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    setContent({ ...content, items: updated, projects: updated });
    if (handleUpdateContent) handleUpdateContent();
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع المعماري؟')) return;
    const updated = projects.filter((_: any, i: number) => i !== index);
    setContent({ ...content, items: updated, projects: updated });
    if (handleUpdateContent) handleUpdateContent();
  };

  const handleSubmitForApproval = (idx: number) => {
    const updated = [...projects];
    updated[idx].currentPhase = 'بانتظار الاعتماد النهائي من العميل';
    setContent({ ...content, items: updated, projects: updated });
    if (handleUpdateContent) handleUpdateContent();
    alert('تم إرسال المخططات والنمذجة 3D للعميل للاعتماد بنجاح!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans text-slate-900 bg-stone-50/50 p-2 md:p-6 rounded-3xl" dir="rtl">
      
      {/* 8 Professional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">مشاريع التصميم النشطة</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeDesignProjects} مشاريع</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Compass size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">الاستشارات والطلبات المعلقة</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingConsultations} طلبات</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">إجمالي المساحة المصممة</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalDesignedArea.toLocaleString()} م²</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Ruler size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">بانتظار اعتمادات العملاء</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingClientApprovals} تصاميم</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">التعديلات والمراجعات النشطة</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeRevisions} تعديلات</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">المخططات المنجزة (Blueprints)</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{completedBlueprints} مخطط</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <FileText size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">كبار المهندسين المعماريين</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{seniorArchitectsActive} مهندسين</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Building size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">قيمة أتعاب التصميم الحالية</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{portfolioFeeRevenue}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-slate-950 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-slate-700">
            <Sparkles size={14} className="text-slate-300" /> لوحة تحكم الاستوديو المعماري (Architecture Design Manager)
          </div>
          <h2 className="text-2xl font-bold">إدارة المشاريع المعمارية، المخططات التنفيذية، ونمذجة 3D</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={handleOpenAdd} className="bg-white hover:bg-slate-200 text-slate-950 px-6 py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all">
            <Plus size={16} /> <span>إنشاء مشروع جديد / رفع مخطط</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث باسم المشروع، العميل أو الطراز..." className="w-full bg-stone-50 border border-slate-200 text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-medium text-slate-800" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {phases.map((phase: string) => (
            <button key={phase} onClick={() => setSelectedPhase(phase)} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${selectedPhase === phase ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200'}`}>
              {phase === 'all' ? 'جميع المراحل' : phase}
            </button>
          ))}
        </div>
      </div>

      {/* Project Management Grid / Table View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((item: any, idx: number) => {
          const realIdx = projects.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          const projectImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image];
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="relative h-52 bg-stone-100">
                <img src={projectImages[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-slate-700">
                  <Sparkles size={12} className="text-slate-300" /> {item.architecturalStyle || item.category || 'مودرن معاصر'}
                </div>
                {projectImages.length > 1 && (
                  <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <ImageIcon size={12} /> {projectImages.length} 3D Renders
                  </span>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 text-base">{item.title || item.name}</h3>
                    {item.clientName && <span className="text-[11px] bg-stone-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">{item.clientName}</span>}
                  </div>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-4">{item.description}</p>
                  
                  <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">المرحلة الحالية:</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{item.currentPhase || 'مرحلة التصور والنمذجة 3D'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">مساحة المشروع (Sqm):</span>
                      <span className="font-bold text-slate-900">{item.areaSqm || '800 م²'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">أتعاب التصميم المعماري:</span>
                      <span className="font-bold text-slate-900">{item.designFee || item.budget || '150,000 ر.س'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center gap-2">
                  <button onClick={() => handleSubmitForApproval(realIdx >= 0 ? realIdx : idx)} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer">
                    <Send size={13} /> إرسال للاعتماد
                  </button>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl cursor-pointer transition-colors" title="تعديل">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDelete(realIdx >= 0 ? realIdx : idx)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors" title="حذف">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Create / Edit Project */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-stone-50">
              <h3 className="font-bold text-slate-900 text-lg">{editingIndex !== null ? 'تعديل المشروع المعماري' : 'إضافة مشروع معماري جديد / رفع مخطط'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-stone-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المشروع المعماري *</label>
                  <input type="text" required value={newItemForm.title} onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })} placeholder="مثال: مجمع الفلل الانسيابية" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل / الجهة</label>
                  <input type="text" value={newItemForm.clientName} onChange={e => setNewItemForm({ ...newItemForm, clientName: e.target.value })} placeholder="مثال: شركة البناء الذكي العقارية" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الطراز المعماري</label>
                  <input type="text" value={newItemForm.architecturalStyle} onChange={e => setNewItemForm({ ...newItemForm, architecturalStyle: e.target.value })} placeholder="مثال: العمارة العضوية، نيوكلاسيك" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة الحالية</label>
                  <select value={newItemForm.currentPhase} onChange={e => setNewItemForm({ ...newItemForm, currentPhase: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold bg-white">
                    <option value="مرحلة التصور والنمذجة 3D">مرحلة التصور والنمذجة 3D</option>
                    <option value="مراجعة المخططات التنفيذية (Blueprints)">مراجعة المخططات التنفيذية (Blueprints)</option>
                    <option value="بانتظار الاعتماد النهائي من العميل">بانتظار الاعتماد النهائي من العميل</option>
                    <option value="التسليم النهائي">التسليم النهائي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مساحة المشروع (Sqm)</label>
                  <input type="text" value={newItemForm.areaSqm} onChange={e => setNewItemForm({ ...newItemForm, areaSqm: e.target.value })} placeholder="مثال: 1200 م²" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">أتعاب التصميم المعماري</label>
                  <input type="text" value={newItemForm.designFee} onChange={e => setNewItemForm({ ...newItemForm, designFee: e.target.value })} placeholder="مثال: 180,000 ر.س" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموقع أو المدينة</label>
                <input type="text" value={newItemForm.location} onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })} placeholder="مثال: الرياض - حي الياسمين" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المفهوم المعماري وتفاصيل المخططات</label>
                <textarea rows={3} value={newItemForm.description} onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })} placeholder="اكتب فلسفة التصميم المعماري والمواد المستخدمة..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-medium"></textarea>
              </div>

              <div className="space-y-3 bg-stone-100 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">اختر صور العرض / النمذجة 3D</label>
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-mono"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow cursor-pointer">حفظ المشروع المعماري</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
