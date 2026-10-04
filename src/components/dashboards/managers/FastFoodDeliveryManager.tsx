import React, { useState } from 'react';
import { Zap, ShoppingBag, Clock, Plus, Trash2, Edit, Flame, X, Star, Layers, TrendingUp, Receipt, RotateCcw } from 'lucide-react';
import { getDefaultItemsForTemplate } from '../../../lib/defaultData';
import ImageGalleryPicker from './ImageGalleryPicker';

interface FastFoodDeliveryManagerProps {
  content: any;
  tenant: any;
  templateId?: number;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
  dashboardColor?: string;
  handleAddItem?: () => void;
  handleEditItem?: (item: any, index: number) => void;
  handleDeleteItem?: (id: number) => void;
}

export default function FastFoodDeliveryManager({
  content,
  tenant,
  templateId = 3,
  handleUpdateContent,
  setContent,
  dashboardColor = '#dc2626',
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: FastFoodDeliveryManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'tag' | 'pending'>('all');
  const [isInstantOrderingActive, setIsInstantOrderingActive] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    title: '',
    category: 'برجر لحم',
    price: '',
    originalPrice: '',
    calories: '650 سعرة',
    prepTime: '15-25 دقيقة',
    tags: 'الأكثر طلباً ⭐, حار 🔥',
    description: '',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const orders = Array.isArray(content?.orders) ? content.orders : [];
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;
  const totalOrdersCount = orders.length;
  const categoriesCount = Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean))).length;

  const totalRevenue = orders.reduce((acc: number, o: any) => {
    const amt = parseFloat(String(o.total || o.price || 0).replace(/[^0-9.]/g, '')) || 0;
    return acc + amt;
  }, items.length * 45);

  const categories = ['all', ...Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || item.type === selectedCategory;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    return matchesCat && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAddModal = () => {
    if (handleAddItem) {
      handleAddItem();
      return;
    }
    setEditingIndex(null);
    setNewItemForm({
      name: '',
      title: '',
      category: 'برجر لحم',
      price: '',
      originalPrice: '',
      calories: '650 سعرة',
      prepTime: '15-25 دقيقة',
      tags: 'الأكثر طلباً ⭐',
      description: '',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any, idx: number) => {
    if (handleEditItem) {
      handleEditItem(item, idx);
      return;
    }
    setEditingIndex(idx);
    setNewItemForm({
      name: item.name || item.title || '',
      title: item.title || item.name || '',
      category: item.category || item.type || 'برجر لحم',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      calories: item.calories || '650 سعرة',
      prepTime: item.prepTime || item.deliveryTime || '15-25 دقيقة',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || 'الأكثر طلباً ⭐'),
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const titleVal = newItemForm.name || newItemForm.title;
    if (!titleVal) return;
    const updated = [...items];
    const tagsArray = newItemForm.tags.split(',').map(t => t.trim()).filter(Boolean);

    const data = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      name: titleVal,
      title: titleVal,
      category: newItemForm.category,
      type: newItemForm.category,
      price: newItemForm.price || '0',
      originalPrice: newItemForm.originalPrice,
      calories: newItemForm.calories,
      prepTime: newItemForm.prepTime,
      deliveryTime: newItemForm.prepTime,
      tags: tagsArray,
      description: newItemForm.description,
      image: newItemForm.image
    };

    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    setContent({ ...content, items: updated });
    handleUpdateContent();
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوجبة؟')) return;
    const targetItem = items[index];
    if (handleDeleteItem && targetItem?.id) {
      handleDeleteItem(targetItem.id);
      return;
    }
    const updated = items.filter((_: any, idx: number) => idx !== index);
    setContent({ ...content, items: updated });
    handleUpdateContent();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* 📊 بطاقات الإحصائيات الخاصة بالبرجر والوجبات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setSelectedCategory('all'); }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الوجبات والعروض</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Flame size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`لديك ${pendingOrdersCount} طلب معلق بانتظار التجهيز السريع.`)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-amber-300"
        >
          <div>
            <p className="text-xs font-bold text-slate-500">الطلبات السريعة المعلقة</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`إجمالي الطلبات الواردة للمطعم: ${totalOrdersCount}`)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-purple-300"
        >
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الطلبات الواردة</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{totalOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Receipt size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">متوسط وقت التوصيل</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">15-25 دقيقة</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div 
          onClick={() => setIsInstantOrderingActive(!isInstantOrderingActive)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
        >
          <div>
            <p className="text-xs font-bold text-slate-500">حالة الطلبات الفورية</p>
            <h3 className={`text-xl font-black mt-1 ${isInstantOrderingActive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isInstantOrderingActive ? '🟢 نشط وسريع' : '🔴 متوقف مؤقتاً'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Zap size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">التصنيفات النشطة</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{categoriesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">أطباق الشيف والوجبات</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <Star size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">الإيرادات المقدرة</p>
            <h3 className="text-2xl font-black text-teal-700 mt-1">{totalRevenue.toLocaleString()} ر.س</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Header & Quick Action */}
      <div className="bg-gradient-to-l from-red-950 via-red-900 to-stone-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Zap size={14} /> إدارة البرجر والوجبات السريعة والتوصيل
          </div>
          <h2 className="text-2xl font-black">إدارة السندويتشات، الكومبو، العروض الترويجية والإضافات</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaults = getDefaultItemsForTemplate(3);
              setContent({ ...content, items: defaults });
              handleUpdateContent();
              alert('تم استعادة أطباق البرجر والوجبات السريعة الافتراضية بنجاح!');
            }}
            className="bg-stone-800 hover:bg-stone-700 text-red-300 border border-red-500/30 px-5 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>استعادة وجبات القالب</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة وجبة برجر جديدة</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في الوجبات السريعة..."
            className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold focus:border-red-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedCategory === cat ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'جميع التصنيفات' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-52 bg-slate-100 overflow-hidden">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800'}
                  alt={item.name || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  {item.category || item.type || 'سريعة'}
                </span>
                <div className="absolute top-3 left-3 flex flex-col items-end gap-1">
                  {tags.map((t: string, tIdx: number) => (
                    <span key={tIdx} className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <span>{item.price}</span>
                  {item.originalPrice && <span className="text-[11px] text-red-200 line-through">{item.originalPrice}</span>}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.name || item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-600 font-bold">
                    {item.calories && <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🔥 {item.calories}</span>}
                    {item.prepTime && <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg">⏱️ {item.prepTime}</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item, realIdx >= 0 ? realIdx : idx)}
                    className="p-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl cursor-pointer transition-colors"
                    title="تعديل"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(realIdx >= 0 ? realIdx : idx)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-3xl border p-12 text-center text-slate-400 text-sm font-bold">
          لا توجد وجبات مطابقة لبحثك.
        </div>
      )}

      {/* Modal for Add / Edit Fast Food Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 text-lg">
                {editingIndex !== null ? 'تعديل وجبة البرجر والسريعة' : 'إضافة وجبة برجر جديدة'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الوجبة أو السندويتش *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })}
                  placeholder="مثال: Classic Double Burger"
                  className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفئة المخصصة</label>
                  <input
                    type="text"
                    value={newItemForm.category}
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الأساسي *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.price}
                    onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="مثال: ٣٥ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الأصلي المشطوب (عرض)</label>
                  <input
                    type="text"
                    value={newItemForm.originalPrice}
                    onChange={e => setNewItemForm({ ...newItemForm, originalPrice: e.target.value })}
                    placeholder="مثال: ٤٥ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وسوم الشارات الديناميكية</label>
                  <input
                    type="text"
                    value={newItemForm.tags}
                    onChange={e => setNewItemForm({ ...newItemForm, tags: e.target.value })}
                    placeholder="الأكثر طلباً ⭐, حار 🔥"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعرات الحرارية</label>
                  <input
                    type="text"
                    value={newItemForm.calories}
                    onChange={e => setNewItemForm({ ...newItemForm, calories: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت التحضير والتوصيل</label>
                  <input
                    type="text"
                    value={newItemForm.prepTime}
                    onChange={e => setNewItemForm({ ...newItemForm, prepTime: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-red-50/50 p-4 rounded-2xl border border-red-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة الوجبة</label>
                  <input
                    type="url"
                    value={newItemForm.image}
                    onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مكونات الوجبة والإضافات (Addons)</label>
                <textarea
                  rows={2}
                  value={newItemForm.description}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="مثال: شريحتين لحم أنغوس، جبن چيدر، صوص خاص، مع بطاطس مقلية ومشروب."
                  className="w-full px-4 py-3 border rounded-xl text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 shrink-0 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black shadow cursor-pointer hover:bg-red-700"
                >
                  حفظ الوجبة والسندويتش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
