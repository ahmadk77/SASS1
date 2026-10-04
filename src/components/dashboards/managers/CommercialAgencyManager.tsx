import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Building2, X, Briefcase, ShoppingBag, TrendingUp, MapPin } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function CommercialAgencyManager({ content, tenant, handleUpdateContent, setContent }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    price: '',
    location: 'الرياض - طريق الملك فهد',
    propertyType: 'مكتب إداري فاخر',
    suitableFor: 'شركات تقنية، استشارات',
    area: '320 م²',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const pendingInquiriesCount = Array.isArray(content?.orders) ? content.orders.filter((o: any) => o.status === 'pending').length : 0;

  const filteredItems = items.filter((item: any) => {
    const name = item.name || item.title || '';
    const desc = item.description || item.location || item.propertyType || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      title: '',
      price: '',
      location: 'الرياض - طريق الملك فهد',
      propertyType: 'مكتب إداري فاخر',
      suitableFor: 'شركات تقنية، استشارات',
      area: '320 م²',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    setNewItemForm({
      title: item.title || item.name || '',
      price: item.price || '',
      location: item.location || 'الرياض',
      propertyType: item.propertyType || 'مكتب إداري',
      suitableFor: item.suitableFor || 'تجزئة ومكاتب',
      area: item.area || '320 م²',
      image: item.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000'
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
      price: newItemForm.price || '0',
      location: newItemForm.location,
      propertyType: newItemForm.propertyType,
      suitableFor: newItemForm.suitableFor,
      area: newItemForm.area,
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
      {/* 📊 بطاقات الإحصائيات الخاصة بالوكالات التجارية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الأصول التجارية</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">استفسارات المستثمرين</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingInquiriesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">متوسط المساحة التجارية</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">320 م²</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">مؤشر العائد الاستثماري</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">مرتفع وآمن</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800">إدارة محفظة الوكالات التجارية والمكاتب</h3>
          <p className="text-xs text-slate-500 mt-1">إضافة الأصول التجارية، تحديد الأنشطة المناسبة، ومتابعة المستثمرين.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث عن أصل تجاري..." className="w-full bg-slate-50 border text-xs pr-10 pl-4 py-3 rounded-xl outline-none font-bold" />
          </div>
          <button onClick={handleOpenAdd} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <Plus size={16} /> <span>إضافة أصل تجاري جديد</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-52 bg-stone-100 overflow-hidden">
                <img src={item.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">{item.propertyType || 'مكتب إداري'}</span>
                <span className="absolute bottom-3 left-3 bg-purple-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow">{item.price}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base mb-1">{item.title || item.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <MapPin size={13} className="text-slate-400" /> {item.location || 'الرياض'}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 font-medium bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                    <span className="font-bold text-purple-900">النشاط المناسب:</span> {item.suitableFor || 'بنوك، مطاعم كبرى'}
                  </p>
                  <p className="text-xs font-semibold text-purple-600 mt-2">المساحة: {item.area || '320 م²'}</p>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl cursor-pointer transition-colors" title="تعديل">
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
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل الأصل التجاري' : 'إضافة أصل تجاري جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان العقار أو المشروع التجاري *</label>
                <input type="text" required value={newItemForm.title} onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })} placeholder="مثال: Al Olaya Commercial Tower" className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الاستثماري *</label>
                  <input type="text" required value={newItemForm.price} onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })} placeholder="مثال: 3,500,000 ر.س" className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-purple-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموقع الجغرافي والمدينة</label>
                  <input type="text" value={newItemForm.location} onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع العقار التجاري</label>
                  <input type="text" value={newItemForm.propertyType} onChange={e => setNewItemForm({ ...newItemForm, propertyType: e.target.value })} placeholder="مكتب إداري، معرض..." className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المساحة</label>
                  <input type="text" value={newItemForm.area} onChange={e => setNewItemForm({ ...newItemForm, area: e.target.value })} placeholder="مثال: 320 م²" className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">النشاط المناسب (Suitable For)</label>
                <input type="text" value={newItemForm.suitableFor} onChange={e => setNewItemForm({ ...newItemForm, suitableFor: e.target.value })} placeholder="بنوك، مطاعم كبرى، شركات تقنية..." className="w-full px-4 py-3 border rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
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
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black shadow">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
