import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, HardHat, X, ShoppingBag, Clock, Building2 } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function HeavyConstructionManager({ content, tenant, handleUpdateContent, setContent }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    client: 'وزارة النقل / جهة حكومية',
    budget: '15,000,000 ر.س',
    duration: '10 أشهر',
    status: 'قيد التنفيذ (60%)',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const pendingInquiriesCount = Array.isArray(content?.orders) ? content.orders.filter((o: any) => o.status === 'pending').length : 0;

  const filteredItems = items.filter((item: any) => {
    const name = item.name || item.title || '';
    const desc = item.client || item.status || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      title: '',
      client: 'وزارة النقل / جهة حكومية',
      budget: '15,000,000 ر.س',
      duration: '10 أشهر',
      status: 'قيد التنفيذ (60%)',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    setNewItemForm({
      title: item.title || item.name || '',
      client: item.client || 'جهة حكومية / خاصة',
      budget: item.budget || item.price || '10,000,000 ر.س',
      duration: item.duration || '12 شهر',
      status: item.status || 'قيد التنفيذ',
      image: item.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000'
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title) return;
    const updated = [...items];
    const data = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      title: newItemForm.title,
      name: newItemForm.title,
      client: newItemForm.client,
      budget: newItemForm.budget,
      price: newItemForm.budget,
      duration: newItemForm.duration,
      status: newItemForm.status,
      image: newItemForm.image
    };
    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    setContent({ ...content, items: updated });
    if (handleUpdateContent) handleUpdateContent();
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    setContent({ ...content, items: items.filter((_: any, i: number) => i !== index) });
    if (handleUpdateContent) handleUpdateContent();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* 📊 بطاقات الإحصائيات الخاصة بالمقاولات الثقيلة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي المشاريع الإنشائية</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <HardHat size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">استفسارات العملاء المعلقة</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingInquiriesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">متوسط مدة التنفيذ</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">10 أشهر</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">حالة الجداول الزمنية</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">منتظمة وآمنة</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Building2 size={22} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800">إدارة محفظة مشاريع المقاولات والبناء</h3>
          <p className="text-xs text-slate-500 mt-1">إضافة المشاريع الإنشائية الكبرى، تحديد الميزانيات، ونسب الإنجاز.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث عن مشروع..." className="w-full bg-slate-50 border text-xs pr-10 pl-4 py-3 rounded-xl outline-none font-bold" />
          </div>
          <button onClick={handleOpenAdd} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <Plus size={16} /> <span>إضافة مشروع إنشائي</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-52 bg-stone-100 overflow-hidden">
                <img src={item.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=1000'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">{item.status || 'قيد التنفيذ'}</span>
                <span className="absolute bottom-3 left-3 bg-amber-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow">{item.budget || item.price}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base mb-1">{item.title || item.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    العميل: <span className="font-bold text-slate-700">{item.client || 'جهة حكومية / خاصة'}</span>
                  </p>
                  <p className="text-xs font-semibold text-amber-700 mt-2 bg-amber-50 p-2 rounded-xl border border-amber-100">
                    مدة التنفيذ: {item.duration || '10 أشهر'}
                  </p>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl cursor-pointer transition-colors" title="تعديل">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => handleDelete(realIdx >= 0 ? realIdx : idx)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors" title="حذف">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل المشروع الإنشائي' : 'إضافة مشروع إنشائي جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المشروع الإنشائي *</label>
                <input type="text" required value={newItemForm.title} onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })} placeholder="مثال: Al-Faris Infrastructure Complex" className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الميزانية الإجمالية *</label>
                  <input type="text" required value={newItemForm.budget} onChange={e => setNewItemForm({ ...newItemForm, budget: e.target.value })} placeholder="مثال: 15,000,000 ر.س" className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-amber-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العميل / الجهة المالكة</label>
                  <input type="text" value={newItemForm.client} onChange={e => setNewItemForm({ ...newItemForm, client: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مدة التنفيذ</label>
                  <input type="text" value={newItemForm.duration} onChange={e => setNewItemForm({ ...newItemForm, duration: e.target.value })} placeholder="مثال: 10 أشهر" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نسبة وحالة الإنجاز</label>
                  <input type="text" value={newItemForm.status} onChange={e => setNewItemForm({ ...newItemForm, status: e.target.value })} placeholder="مكتمل 60%..." className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
              </div>
              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط الصورة</label>
                  <input type="url" value={newItemForm.image} onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-xs bg-white" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-black shadow">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
