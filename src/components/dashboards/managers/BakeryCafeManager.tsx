import React, { useState } from 'react';
import { Cake, ShoppingBag, Clock, Plus, Trash2, Edit, Sparkles, X, Star, Layers, TrendingUp, Receipt, RotateCcw } from 'lucide-react';
import { getDefaultItemsForTemplate } from '../../../lib/defaultData';
import ImageGalleryPicker from './ImageGalleryPicker';

interface BakeryCafeManagerProps {
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

export default function BakeryCafeManager({
  content,
  tenant,
  templateId = 6,
  handleUpdateContent,
  setContent,
  dashboardColor = '#f43f5e',
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: BakeryCafeManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFreshStatusActive, setIsFreshStatusActive] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    title: '',
    category: 'مخبوزات فرنسية',
    price: '',
    originalPrice: '',
    isFreshDaily: true,
    calories: '320 سعرة',
    prepTime: '15 دقيقة',
    allergens: 'جلوتين، حليب، زبدة',
    description: '',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const orders = Array.isArray(content?.orders) ? content.orders : [];
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;
  const totalOrdersCount = orders.length;
  const categoriesCount = Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean))).length;

  const totalRevenue = orders.reduce((acc: number, o: any) => {
    const amt = parseFloat(String(o.total || o.price || 0).replace(/[^0-9.]/g, '')) || 0;
    return acc + amt;
  }, items.length * 35);

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
      category: 'مخبوزات فرنسية',
      price: '',
      originalPrice: '',
      isFreshDaily: true,
      calories: '320 سعرة',
      prepTime: '15 دقيقة',
      allergens: 'جلوتين، حليب',
      description: '',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800'
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
      category: item.category || item.type || 'مخبوزات فرنسية',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      isFreshDaily: item.isFreshDaily !== false,
      calories: item.calories || '320 سعرة',
      prepTime: item.prepTime || '15 دقيقة',
      allergens: item.allergens || 'جلوتين، حليب',
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800'
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
      originalPrice: newItemForm.originalPrice,
      isFreshDaily: newItemForm.isFreshDaily,
      calories: newItemForm.calories,
      prepTime: newItemForm.prepTime,
      allergens: newItemForm.allergens,
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
    if (!confirm('هل أنت متأكد من حذف هذا الصنف من المخبوزات؟')) return;
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
      {/* 📊 بطاقات الإحصائيات الخاصة بالمخابز والحلويات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedCategory('all')}
          className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-rose-900/60">إجمالي المخبوزات والحلويات</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-inner">
            <Cake size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`لديك ${pendingOrdersCount} طلب مخبوزات معلق بانتظار التجهيز والتغليف.`)}
          className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-rose-300"
        >
          <div>
            <p className="text-xs font-bold text-rose-900/60">الطلبات المعلقة</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{pendingOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-900/60">متوسط وقت التجهيز</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">15 دقيقة</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div 
          onClick={() => setIsFreshStatusActive(!isFreshStatusActive)}
          className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-emerald-300"
        >
          <div>
            <p className="text-xs font-bold text-rose-900/60">حالة الخبز اليومي</p>
            <h3 className={`text-xl font-black mt-1 ${isFreshStatusActive ? 'text-rose-600' : 'text-slate-600'}`}>
              {isFreshStatusActive ? '🥐 طازج وساخن' : '🍞 مخبوزات سابقة'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-900/60">إجمالي الطلبات الواردة</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{totalOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Receipt size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-900/60">التصنيفات المتاحة</p>
            <h3 className="text-2xl font-black text-indigo-700 mt-1">{categoriesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-900/60">أصناف الكيك والمعجنات</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Star size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-900/60">الإيرادات المقدرة</p>
            <h3 className="text-2xl font-black text-teal-700 mt-1">{totalRevenue.toLocaleString()} ر.س</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Header & Quick Action */}
      <div className="bg-gradient-to-l from-rose-950 via-rose-900 to-stone-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-rose-500/30">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Cake size={14} /> إدارة مخبوزات وحلويات المقهى
          </div>
          <h2 className="text-2xl font-black">إضافة الكيك، المعجنات الطازجة، وتحديد تفاصيل التحضير</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaults = getDefaultItemsForTemplate(6);
              setContent({ ...content, items: defaults });
              handleUpdateContent();
              alert('تم استعادة أصناف المخابز والحلويات الافتراضية بنجاح!');
            }}
            className="bg-stone-900 hover:bg-stone-800 text-rose-300 border border-rose-500/30 px-5 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>استعادة مخبوزات القالب</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة مخبوز أو حلويات</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-rose-900/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في المخبوزات والحلويات..."
            className="w-full bg-rose-50/30 border border-rose-900/10 text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold focus:border-rose-500 transition-all text-slate-900"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedCategory === cat ? 'bg-rose-600 text-white shadow' : 'bg-rose-50/50 text-slate-700 hover:bg-rose-100 border border-rose-900/10'
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
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border border-rose-900/10 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-52 bg-rose-50 overflow-hidden">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800'}
                  alt={item.name || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  {item.category || item.type || 'مخبوزات'}
                </span>
                {item.isFreshDaily !== false && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                    طازج يومياً 🥐
                  </span>
                )}
                <div className="absolute bottom-3 left-3 bg-rose-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <span>{item.price}</span>
                  {item.originalPrice && <span className="text-[11px] text-rose-200 line-through">{item.originalPrice}</span>}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.name || item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-600 font-bold">
                    {item.calories && <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🔥 {item.calories}</span>}
                    {item.prepTime && <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg">⏱️ {item.prepTime}</span>}
                  </div>
                  {item.allergens && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl">
                      ⚠️ الحساسية: <span className="font-bold text-slate-700">{item.allergens}</span>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item, realIdx >= 0 ? realIdx : idx)}
                    className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
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
        <div className="bg-white rounded-3xl border border-rose-900/10 p-12 text-center text-slate-400 text-sm font-bold">
          لا توجد مخبوزات أو حلويات مطابقة لبحثك.
        </div>
      )}

      {/* Modal for Add / Edit Bakery Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-rose-50/50 shrink-0">
              <h3 className="font-black text-slate-800 text-lg">
                {editingIndex !== null ? 'تعديل صنف المخبوزات والحلويات' : 'إضافة مخبوز أو حلويات جديدة'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج / الصنف *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })}
                  placeholder="مثال: Almond Croissant أو Chocolate Cake"
                  className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفئة المخصصة</label>
                  <select
                    value={newItemForm.category}
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="مخبوزات فرنسية">مخبوزات فرنسية</option>
                    <option value="كيك ومناسبات">كيك ومناسبات</option>
                    <option value="حلويات شرقية وغربية">حلويات شرقية وغربية</option>
                    <option value="معجنات طازجة">معجنات طازجة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الأساسي *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.price}
                    onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="مثال: ١٨ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-rose-600"
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
                    placeholder="مثال: ٢٢ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مؤشر الخبز اليومي الطازج</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="checkbox"
                      id="isFreshDaily"
                      checked={newItemForm.isFreshDaily}
                      onChange={e => setNewItemForm({ ...newItemForm, isFreshDaily: e.target.checked })}
                      className="w-5 h-5 text-rose-600 rounded accent-rose-600 cursor-pointer"
                    />
                    <label htmlFor="isFreshDaily" className="text-xs font-bold text-slate-700 cursor-pointer">
                      طازج ومخبوز اليوم 🥐
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعرات الحرارية</label>
                  <input
                    type="text"
                    value={newItemForm.calories}
                    onChange={e => setNewItemForm({ ...newItemForm, calories: e.target.value })}
                    placeholder="مثال: 320 سعرة"
                    className="w-full px-4 py-3 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت التجهيز</label>
                  <input
                    type="text"
                    value={newItemForm.prepTime}
                    onChange={e => setNewItemForm({ ...newItemForm, prepTime: e.target.value })}
                    placeholder="مثال: 15 دقيقة"
                    className="w-full px-4 py-3 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مسببات الحساسية (Allergens)</label>
                <input
                  type="text"
                  value={newItemForm.allergens}
                  onChange={e => setNewItemForm({ ...newItemForm, allergens: e.target.value })}
                  placeholder="مثال: جلوتين، حليب، مكسرات"
                  className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                />
              </div>

              <div className="space-y-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة المخبوز أو الحلويات</label>
                  <input
                    type="url"
                    value={newItemForm.image}
                    onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف الصنف والمكونات</label>
                <textarea
                  rows={2}
                  value={newItemForm.description}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="مثال: كرواسون مقرمش محشو باللوز الفاخر والزبدة الفرنسية الطازجة."
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
                  className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black shadow cursor-pointer hover:bg-rose-700"
                >
                  حفظ الصنف في المخبز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
