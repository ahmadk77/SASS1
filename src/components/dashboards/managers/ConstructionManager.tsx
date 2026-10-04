import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, HardHat, X } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  templateId?: number;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function ConstructionManager({ content, setContent, templateId }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    category: 'مشاريع كبرى',
    budget: '',
    duration: '١٢ شهر',
    status: 'قيد التنفيذ',
    client: 'شركة تطوير',
    description: '',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f86e6?q=80&w=1000'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const categories = ['all', ...Array.from(new Set(items.map((i: any) => i.category).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    return matchesCat && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      title: '',
      category: 'مشاريع كبرى',
      budget: '',
      duration: '١٢ شهر',
      status: 'قيد التنفيذ',
      client: 'شركة تطوير',
      description: '',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f86e6?q=80&w=1000'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    setNewItemForm({
      title: item.title || item.name || '',
      category: item.category || 'مشاريع كبرى',
      budget: item.budget || item.price || '',
      duration: item.duration || '١٢ شهر',
      status: item.status || 'قيد التنفيذ',
      client: item.client || '',
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb18f86e6?q=80&w=1000'
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
      category: newItemForm.category,
      budget: newItemForm.budget,
      price: newItemForm.budget,
      duration: newItemForm.duration,
      status: newItemForm.status,
      client: newItemForm.client,
      description: newItemForm.description,
      image: newItemForm.image
    };
    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    setContent({ ...content, items: updated });
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    setContent({ ...content, items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      <div className="bg-gradient-to-l from-yellow-900 via-stone-950 to-black p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-300 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <HardHat size={14} /> لوحة إدارة المقاولات والهندسة
          </div>
          <h2 className="text-2xl font-black">إدارة المشاريع الهندسية، التصاميم والترميم</h2>
        </div>
        <button onClick={handleOpenAdd} className="bg-yellow-600 hover:bg-yellow-700 text-stone-950 px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer">
          <Plus size={16} /> <span>إضافة مشروع جديد</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث في المشاريع..." className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat: string) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${selectedCategory === cat ? 'bg-yellow-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {cat === 'all' ? 'الكل' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-48 bg-stone-100">
                <img src={item.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb18f86e6?q=80&w=1000'} alt={item.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">{item.category}</span>
                <span className="absolute bottom-3 left-3 bg-yellow-600 text-stone-950 font-black text-xs px-3 py-1.5 rounded-full shadow">{item.budget || item.price || 'متاح'}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.title || item.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-bold">
                    {item.duration && <span>⏱️ {item.duration}</span>}
                    {item.status && <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">{item.status}</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-yellow-50 text-yellow-800 rounded-xl cursor-pointer"><Edit size={15} /></button>
                  <button onClick={() => handleDelete(realIdx >= 0 ? realIdx : idx)} className="p-2 bg-rose-50 text-rose-600 rounded-xl cursor-pointer"><Trash2 size={15} /></button>
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
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل المشروع' : 'إضافة مشروع جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المشروع / الخدمة *</label>
                <input type="text" required value={newItemForm.title} onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <input type="text" value={newItemForm.category} onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الميزانية / التكلفة</label>
                  <input type="text" value={newItemForm.budget} onChange={e => setNewItemForm({ ...newItemForm, budget: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-yellow-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المدة الهندسية</label>
                  <input type="text" value={newItemForm.duration} onChange={e => setNewItemForm({ ...newItemForm, duration: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحالة</label>
                  <input type="text" value={newItemForm.status} onChange={e => setNewItemForm({ ...newItemForm, status: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
                </div>
              </div>
              <div className="space-y-3 bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط الصورة</label>
                  <input type="url" value={newItemForm.image} onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-xs bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف</label>
                <textarea rows={2} value={newItemForm.description} onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-yellow-600 text-stone-950 text-xs font-black shadow">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
