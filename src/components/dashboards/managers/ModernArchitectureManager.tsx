import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Compass, X } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function ModernArchitectureManager({ content, setContent }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    category: 'تصميم معماري',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'
  });

  const items = Array.isArray(content?.items) ? content.items : [];

  const filteredItems = items.filter((item: any) => {
    const name = item.name || item.title || '';
    const desc = item.description || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({ title: '', category: 'تصميم معماري', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    setNewItemForm({
      title: item.title || item.name || '',
      category: item.category || 'تصميم معماري',
      image: item.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'
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
      <div className="bg-gradient-to-l from-slate-800 via-slate-900 to-black p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Compass size={14} /> لوحة إدارة التصميم المعماري
          </div>
          <h2 className="text-2xl font-black">إدارة التصاميم الهندسية والمخططات</h2>
        </div>
        <button onClick={handleOpenAdd} className="bg-slate-200 hover:bg-white text-slate-950 px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer">
          <Plus size={16} /> <span>إضافة تصميم جديد</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث..." className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-48 bg-stone-100">
                <img src={item.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'} alt={item.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-3 left-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">{item.category}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.title || item.name}</h3>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-slate-100 text-slate-800 rounded-xl cursor-pointer"><Edit size={15} /></button>
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
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل التصميم' : 'إضافة تصميم جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم التصميم *</label>
                <input type="text" required value={newItemForm.title} onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                <input type="text" value={newItemForm.category} onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div className="space-y-3 bg-slate-100 p-4 rounded-2xl border border-slate-200">
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
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
