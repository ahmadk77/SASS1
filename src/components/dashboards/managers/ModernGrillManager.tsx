import React, { useState } from 'react';
import { Flame, ShoppingBag, Calendar, Clock, Plus, Trash2, Edit, X, Star, Layers, TrendingUp, Receipt, RotateCcw } from 'lucide-react';
import { getDefaultItemsForTemplate } from '../../../lib/defaultData';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ModernGrillManagerProps {
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

export default function ModernGrillManager({
  content,
  tenant,
  templateId,
  handleUpdateContent,
  setContent,
  dashboardColor = '#ea580c',
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: ModernGrillManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'chef' | 'pending'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    title: '',
    category: 'ستيك ومشويات',
    price: '',
    calories: '650',
    prepTime: '٢٥ دقيقة',
    doneness: 'Medium',
    cutType: 'Ribeye',
    description: '',
    isChefSpecial: true,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const orders = Array.isArray(content?.orders) ? content.orders : [];
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;
  const totalOrdersCount = orders.length;
  const reservationsCount = Array.isArray(content?.reservations) ? content.reservations.length : (content?.tablesCount || 'نشط');
  const chefSpecialsCount = items.filter((i: any) => i.isChefSpecial).length;
  const categoriesCount = Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean))).length;

  const totalRevenue = orders.reduce((acc: number, o: any) => {
    const amt = parseFloat(String(o.total || o.price || 0).replace(/[^0-9.]/g, '')) || 0;
    return acc + amt;
  }, items.length * 150);

  const categories = ['all', ...Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    if (activeQuickFilter === 'chef' && !item.isChefSpecial) return false;
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
      category: 'ستيك ومشويات',
      price: '',
      calories: '650',
      prepTime: '٢٥ دقيقة',
      doneness: 'Medium',
      cutType: 'Ribeye',
      description: '',
      isChefSpecial: true,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'
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
      category: item.category || item.type || 'ستيك ومشويات',
      price: item.price || '',
      calories: item.calories || '650',
      prepTime: item.prepTime || '٢٥ دقيقة',
      doneness: item.doneness || 'Medium',
      cutType: item.cutType || 'Ribeye',
      description: item.description || '',
      isChefSpecial: !!item.isChefSpecial,
      image: item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const titleVal = newItemForm.name || newItemForm.title;
    if (!titleVal) return;
    const updated = [...items];
    const data = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      name: titleVal,
      title: titleVal,
      category: newItemForm.category,
      type: newItemForm.category,
      price: newItemForm.price || '0',
      calories: newItemForm.calories,
      prepTime: newItemForm.prepTime,
      doneness: newItemForm.doneness,
      cutType: newItemForm.cutType,
      description: newItemForm.description,
      isChefSpecial: newItemForm.isChefSpecial,
      image: newItemForm.image
    };

    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    const newContent = { ...content, items: updated };
    setContent(newContent);
    handleUpdateContent();
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف طبق المشويات هذا؟')) return;
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
      {/* 📊 بطاقات الإحصائيات الشاملة والمخصصة للمشويات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setActiveQuickFilter('all'); setSelectedCategory('all'); }}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between ${
            activeQuickFilter === 'all' && selectedCategory === 'all' ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-500">أطباق المشويات والستيك</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Flame size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`لديك ${pendingOrdersCount} طلب مشويات معلق بانتظار الشواء.`)}
          className="bg-white p-5 rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between hover:border-rose-300"
        >
          <div>
            <p className="text-xs font-bold text-slate-500">الطلبات المعلقة</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{pendingOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`إجمالي طلبات المشويات الواردة: ${totalOrdersCount}`)}
          className="bg-white p-5 rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between hover:border-purple-300"
        >
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الطلبات الواردة</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{totalOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Receipt size={22} />
          </div>
        </div>

        <div 
          onClick={() => setActiveQuickFilter(activeQuickFilter === 'chef' ? 'all' : 'chef')}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between ${
            activeQuickFilter === 'chef' ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-500">أطباق الستيك المميزة ⭐</p>
            <h3 className="text-2xl font-black text-orange-600 mt-1">{chefSpecialsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold">
            <Star size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`حجوزات طاولات قسم المشويات اليوم: ${reservationsCount}`)}
          className="bg-white p-5 rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between hover:border-blue-300"
        >
          <div>
            <p className="text-xs font-bold text-slate-500">حجوزات الطاولات</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{reservationsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar size={22} />
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
            <p className="text-xs font-bold text-slate-500">متوسط وقت الشواء</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">٢٥ دقيقة</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock size={22} />
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
      <div className="bg-gradient-to-l from-orange-950 via-stone-900 to-black p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Flame size={14} /> إدارة المشويات والستيك الفاخر
          </div>
          <h2 className="text-2xl font-black">تحكم بأطباق اللحوم، درجات الاستواء والصلصات</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaults = getDefaultItemsForTemplate(2);
              setContent({ ...content, items: defaults });
              handleUpdateContent();
              alert('تم استعادة أطباق المشويات والستيك الافتراضية بنجاح!');
            }}
            className="bg-stone-800 hover:bg-stone-700 text-orange-300 border border-orange-500/30 px-5 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>استعادة منتجات المشويات</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة طبق مشويات جديد</span>
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
            placeholder="بحث في قائمة المشويات والستيك..."
            className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold focus:border-orange-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedCategory === cat ? 'bg-orange-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'جميع التصنيفات' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Grill Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-52 bg-slate-100 overflow-hidden">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'}
                  alt={item.name || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  {item.category || item.type || 'مشويات'}
                </span>
                {item.isChefSpecial && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow flex items-center gap-1">
                    <Star size={12} fill="white" /> ستيك مميز
                  </span>
                )}
                <span className="absolute bottom-3 left-3 bg-orange-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg">
                  {item.price}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.name || item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-600 font-bold">
                    {item.calories && <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🔥 {item.calories} سعرة</span>}
                    {item.prepTime && <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg">⏱️ {item.prepTime}</span>}
                    {item.doneness && <span className="bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg">🥩 {item.doneness}</span>}
                    {item.cutType && <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg">🔪 {item.cutType}</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item, realIdx >= 0 ? realIdx : idx)}
                    className="p-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-xl cursor-pointer transition-colors"
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
          لا توجد أطباق مشويات مطابقة لبحثك.
        </div>
      )}

      {/* Modal for Add / Edit Grill Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 text-lg">
                {editingIndex !== null ? 'تعديل طبق المشويات والستيك' : 'إضافة طبق مشويات جديد'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم طبق المشويات / الستيك *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })}
                  placeholder="مثال: Ribeye Steak 350g"
                  className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={newItemForm.category}
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.price}
                    onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="مثال: ١٨5 ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-orange-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درجة الاستواء (Doneness)</label>
                  <select
                    value={newItemForm.doneness}
                    onChange={e => setNewItemForm({ ...newItemForm, doneness: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="Rare">Rare (ناضج قليلاً)</option>
                    <option value="Medium Rare">Medium Rare (متوسط النضج خفيف)</option>
                    <option value="Medium">Medium (متوسط النضج)</option>
                    <option value="Medium Well">Medium Well (شبه تام النضج)</option>
                    <option value="Well Done">Well Done (تام النضج)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع القطعة (Cut Type)</label>
                  <input
                    type="text"
                    value={newItemForm.cutType}
                    onChange={e => setNewItemForm({ ...newItemForm, cutType: e.target.value })}
                    placeholder="Ribeye, Fillet, T-Bone..."
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الشواء والتحضير</label>
                  <input
                    type="text"
                    value={newItemForm.prepTime}
                    onChange={e => setNewItemForm({ ...newItemForm, prepTime: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة الطبق</label>
                  <input
                    type="url"
                    value={newItemForm.image}
                    onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف الطبق والمكونات</label>
                <textarea
                  rows={2}
                  value={newItemForm.description}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isChefSpecialGrill"
                  checked={newItemForm.isChefSpecial}
                  onChange={e => setNewItemForm({ ...newItemForm, isChefSpecial: e.target.checked })}
                  className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                />
                <label htmlFor="isChefSpecialGrill" className="text-xs font-bold text-slate-700 cursor-pointer">
                  تمييز كطبق ستيك مميز ⭐
                </label>
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
                  className="px-6 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black shadow cursor-pointer hover:bg-orange-700"
                >
                  حفظ طبق المشويات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
