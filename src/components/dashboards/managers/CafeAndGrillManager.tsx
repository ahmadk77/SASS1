import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Utensils, X, Star } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  templateId?: number;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function CafeAndGrillManager({ content, setContent, templateId }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    title: '',
    category: 'الأطباق الرئيسية',
    price: '',
    calories: '450',
    prepTime: '١٥ دقيقة',
    description: '',
    isChefSpecial: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const categories = ['all', ...Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || item.type === selectedCategory;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    return matchesCat && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      name: '',
      title: '',
      category: 'الأطباق الرئيسية',
      price: '',
      calories: '450',
      prepTime: '١٥ دقيقة',
      description: '',
      isChefSpecial: false,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    setNewItemForm({
      name: item.name || item.title || '',
      title: item.title || item.name || '',
      category: item.category || item.type || 'الأطباق الرئيسية',
      price: item.price || '',
      calories: item.calories || '450',
      prepTime: item.prepTime || '١٥ دقيقة',
      description: item.description || '',
      isChefSpecial: !!item.isChefSpecial,
      image: item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const titleVal = newItemForm.name || newItemForm.title;
    if (!titleVal) return;
    const updated = [...items];
    const data = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      name: titleVal,
      title: titleVal,
      category: newItemForm.category,
      price: newItemForm.price || '0',
      calories: newItemForm.calories,
      prepTime: newItemForm.prepTime,
      description: newItemForm.description,
      isChefSpecial: newItemForm.isChefSpecial,
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
      <div className="bg-gradient-to-l from-rose-950 via-orange-950 to-slate-950 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Utensils size={14} /> لوحة إدارة المطاعم والمقاهي والمشويات
          </div>
          <h2 className="text-2xl font-black">إدارة أطباق المنيو، المشروبات والعروض السريعة</h2>
        </div>
        <button onClick={handleOpenAdd} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer">
          <Plus size={16} /> <span>إضافة صنف جديد</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث في المنيو..." className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat: string) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${selectedCategory === cat ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
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
                <img src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'} alt={item.name || item.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">{item.category}</span>
                {item.isChefSpecial && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                    <Star size={12} fill="white" /> مميز
                  </span>
                )}
                <span className="absolute bottom-3 left-3 bg-rose-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow">{item.price}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.name || item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-bold">
                    {item.calories && <span>🔥 {item.calories} سعرة</span>}
                    {item.prepTime && <span>⏱️ {item.prepTime}</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-rose-50 text-rose-700 rounded-xl cursor-pointer"><Edit size={15} /></button>
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
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطبق / الصنف *</label>
                <input type="text" required value={newItemForm.name} onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <input type="text" value={newItemForm.category} onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر *</label>
                  <input type="text" required value={newItemForm.price} onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-rose-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعرات الحرارية</label>
                  <input type="text" value={newItemForm.calories} onChange={e => setNewItemForm({ ...newItemForm, calories: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت التحضير</label>
                  <input type="text" value={newItemForm.prepTime} onChange={e => setNewItemForm({ ...newItemForm, prepTime: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
                </div>
              </div>
              <div className="space-y-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
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
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف والمكونات</label>
                <textarea rows={2} value={newItemForm.description} onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isChefSpecial" checked={newItemForm.isChefSpecial} onChange={e => setNewItemForm({ ...newItemForm, isChefSpecial: e.target.checked })} className="w-4 h-4 accent-rose-600 rounded" />
                <label htmlFor="isChefSpecial" className="text-xs font-bold text-slate-700 cursor-pointer">تمييز كطبق الشيف / الأكثر طلباً ⭐</label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black shadow">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
