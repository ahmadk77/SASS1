import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, Search, Utensils, 
  Sparkles, Flame, Clock, Check, X, Image as ImageIcon,
  ShoppingBag, Calendar, Star, Layers, TrendingUp, Receipt
} from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface LuxuryRestaurantManagerProps {
  content: any;
  tenant: any;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
  dashboardColor?: string;
  handleAddItem?: () => void;
  handleEditItem?: (item: any, index: number) => void;
  handleDeleteItem?: (id: number) => void;
}

export default function LuxuryRestaurantManager({
  content,
  tenant,
  handleUpdateContent,
  setContent,
  dashboardColor = '#d97706',
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: LuxuryRestaurantManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'chef' | 'pending'>('all');
  
  // Local modal state for luxury restaurant items
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'أطباق رئيسية ملكية',
    price: '',
    calories: '480',
    prepTime: '20 دقيقة',
    description: '',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
    isChefSpecial: true,
    ingredients: 'لحم أنجوس، زبدة الكمأة، روزماري طازج',
    allergens: 'لا توجد مسببات حساسية رئيسية'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const orders = Array.isArray(content?.orders) ? content.orders : [];
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;
  const totalOrdersCount = orders.length;
  const reservationsCount = Array.isArray(content?.reservations)
    ? content.reservations.length
    : (content?.tablesCount || 'نشط');
  const chefSpecialsCount = items.filter((i: any) => i.isChefSpecial).length;
  const categoriesCount = Array.from(new Set(items.map((i: any) => i.category).filter(Boolean))).length;
  
  // Calculate estimated total revenue
  const totalRevenue = orders.reduce((acc: number, o: any) => {
    const amt = parseFloat(String(o.total || o.price || 0).replace(/[^0-9.]/g, '')) || 0;
    return acc + amt;
  }, items.length * 120); // baseline estimate if no orders yet

  const categories = ['all', ...Array.from(new Set(items.map((i: any) => i.category).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    if (activeQuickFilter === 'chef' && !item.isChefSpecial) return false;
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAddModal = () => {
    if (handleAddItem) {
      handleAddItem();
      return;
    }
    setEditingIndex(null);
    setNewItemForm({
      name: '',
      category: 'أطباق رئيسية ملكية',
      price: '',
      calories: '480',
      prepTime: '20 دقيقة',
      description: '',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
      isChefSpecial: true,
      ingredients: 'لحم أنجوس، زبدة الكمأة، روزماري طازج',
      allergens: 'لا توجد مسببات حساسية رئيسية'
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
      category: item.category || 'أطباق رئيسية ملكية',
      price: item.price || '',
      calories: item.calories || '480',
      prepTime: item.prepTime || '20 دقيقة',
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
      isChefSpecial: item.isChefSpecial ?? true,
      ingredients: item.ingredients || '',
      allergens: item.allergens || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name) return;

    let updatedItems = [...items];
    const itemData = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      name: newItemForm.name,
      title: newItemForm.name,
      category: newItemForm.category,
      price: newItemForm.price || '0',
      calories: newItemForm.calories,
      prepTime: newItemForm.prepTime,
      description: newItemForm.description,
      image: newItemForm.image,
      isChefSpecial: newItemForm.isChefSpecial,
      ingredients: newItemForm.ingredients,
      allergens: newItemForm.allergens
    };

    if (editingIndex !== null) {
      updatedItems[editingIndex] = itemData;
    } else {
      updatedItems.unshift(itemData);
    }

    const newContent = {
      ...content,
      items: updatedItems
    };

    setContent(newContent);
    handleUpdateContent();
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبق الفاخر؟')) return;
    const targetItem = items[index];
    if (handleDeleteItem && targetItem?.id) {
      handleDeleteItem(targetItem.id);
      return;
    }
    const updatedItems = items.filter((_: any, idx: number) => idx !== index);
    const newContent = {
      ...content,
      items: updatedItems
    };
    setContent(newContent);
    handleUpdateContent();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* 📊 بطاقات الإحصائيات الشاملة والمخصصة للمطعم الفاخر */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* بطاقة الأطباق */}
        <div 
          onClick={() => { setActiveQuickFilter('all'); setSelectedCategory('all'); }}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between ${
            activeQuickFilter === 'all' && selectedCategory === 'all' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الأطباق</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Utensils size={22} />
          </div>
        </div>

        {/* بطاقة الطلبات المعلقة */}
        <div 
          onClick={() => {
            alert(`لديك ${pendingOrdersCount} طلب معلق بانتظار التحضير في المطبخ.`);
          }}
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

        {/* بطاقة إجمالي الطلبات */}
        <div 
          onClick={() => {
            alert(`إجمالي الطلبات الواردة للمطعم: ${totalOrdersCount} طلب.`);
          }}
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

        {/* بطاقة أطباق الشيف */}
        <div 
          onClick={() => {
            setActiveQuickFilter(activeQuickFilter === 'chef' ? 'all' : 'chef');
          }}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between ${
            activeQuickFilter === 'chef' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30' : 'border-slate-200'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-slate-500">أطباق الشيف المميزة ⭐</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{chefSpecialsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold">
            <Star size={22} />
          </div>
        </div>

        {/* بطاقة حجوزات الطاولات */}
        <div 
          onClick={() => {
            alert(`إجمالي حجوزات الطاولات النشطة اليوم: ${reservationsCount}`);
          }}
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

        {/* بطاقة التصنيفات النشطة */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">التصنيفات النشطة</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{categoriesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        {/* بطاقة متوسط وقت التحضير */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">متوسط وقت التحضير</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">20 دقيقة</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        {/* بطاقة الإيرادات المقدرة */}
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

      {/* Header & Quick action */}
      <div className="bg-gradient-to-l from-amber-900 via-amber-950 to-stone-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Sparkles size={14} /> لوحة إدارة مطعم المأكولات الراقية (Fine Dining)
          </div>
          <h2 className="text-2xl md:text-3xl font-black">إدارة قائمة الأطباق الفاخرة والضيافة</h2>
          <p className="text-amber-200/80 text-xs mt-1">تحكم في أطباق الشيف، المكونات، السعرات الحرارية، والأسعار بكل احترافية.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>إضافة طبق ملكي جديد</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في الأطباق والوصفات..."
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pr-11 pl-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs font-bold text-slate-400 ml-2">التصنيف:</span>
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'جميع الأطباق' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Dishes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <Utensils className="w-12 h-12 mx-auto text-amber-300 mb-3" />
            <p className="text-slate-800 font-black text-base">لا توجد أطباق مسجلة</p>
            <p className="text-slate-400 text-xs mt-1">اضغط على زر "إضافة طبق ملكي جديد" لبدء إثراء قائمة المطعم.</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-5 inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow cursor-pointer"
            >
              <Plus size={14} /> إضافة طبق الآن
            </button>
          </div>
        ) : (
          filteredItems.map((item: any, idx: number) => {
            const realIndex = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
            return (
              <div key={item.id || idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group">
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800'}
                    alt={item.name || item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.isChefSpecial && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-stone-950 font-black text-[10px] px-3 py-1 rounded-full shadow flex items-center gap-1">
                      <Sparkles size={12} /> توقيع الشيف ⭐
                    </span>
                  )}
                  {item.category && (
                    <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
                      {item.category}
                    </span>
                  )}
                  {item.price && (
                    <span className="absolute bottom-3 left-3 bg-amber-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow">
                      {item.price} ر.س
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-black text-slate-800 text-base mb-1">
                      {item.name || item.title || 'طبق بدون عنوان'}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {item.description || 'وصف طبق فاخر معد بأجود المكونات الطازجة.'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-bold">
                    {item.calories && (
                      <div className="flex items-center gap-1.5 text-amber-700">
                        <Flame size={14} /> السعرات الحرارية: {item.calories}
                      </div>
                    )}
                    {item.prepTime && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock size={14} /> وقت التحضير: {item.prepTime}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                      معرف الطبق: #{item.id || idx + 1}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item, realIndex >= 0 ? realIndex : idx)}
                        className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                        title="تعديل الطبق"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(realIndex >= 0 ? realIndex : idx)}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                        title="حذف الطبق"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-black text-slate-800 text-lg">
                  {editingIndex !== null ? 'تعديل بيانات الطبق الفاخر 🍽️' : 'إضافة طبق ملكي جديد للمنيو 🍽️👑'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">تحديد اسم الطبق، الكورس، السعرات الحرارية، المكونات ومسببات الحساسية.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">اسم الطبق الفاخر *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="مثال: ستيك فيليه بلاك أنجوس بصلصة الكمأة السوداء"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">تصنيف القائمة (الكورس)</label>
                  <input
                    type="text"
                    value={newItemForm.category}
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    placeholder="مثال: أطباق رئيسية ملكية، مقبلات فاخرة"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold mb-2"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['أطباق رئيسية ملكية', 'مقبلات فاخرة', 'شوربات وحساء', 'سلطات موسمية', 'حلويات الشيف الخاصة', 'كوكتيلات ومشروبات فاخرة'].map((cat, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setNewItemForm({ ...newItemForm, category: cat })}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          newItemForm.category === cat ? 'bg-amber-900 text-white border-amber-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">السعر (ر.س) *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.price}
                    onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="180"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-black text-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">السعرات الحرارية (كالوري)</label>
                  <input
                    type="text"
                    value={newItemForm.calories}
                    onChange={e => setNewItemForm({ ...newItemForm, calories: e.target.value })}
                    placeholder="480 سعرة"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">وقت التحضير</label>
                  <input
                    type="text"
                    value={newItemForm.prepTime}
                    onChange={e => setNewItemForm({ ...newItemForm, prepTime: e.target.value })}
                    placeholder="20 دقيقة"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">رابط صورة الطبق (URL)</label>
                  <input
                    type="url"
                    value={newItemForm.image}
                    onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">وصف الطبق المختصر</label>
                <textarea
                  rows={2}
                  value={newItemForm.description}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="وصف شهي ومغرٍ للعملاء..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">المكونات الرئيسية</label>
                  <input
                    type="text"
                    value={newItemForm.ingredients}
                    onChange={e => setNewItemForm({ ...newItemForm, ingredients: e.target.value })}
                    placeholder="لحم أنجوس، زبدة، ثوم..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">مسببات الحساسية</label>
                  <input
                    type="text"
                    value={newItemForm.allergens}
                    onChange={e => setNewItemForm({ ...newItemForm, allergens: e.target.value })}
                    placeholder="جلوتين، مكسرات، ألبان..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-black text-slate-800">توقيع الشيف (Signature Dish) ⭐</label>
                  <p className="text-[11px] text-slate-500">تمييز الطبق بشارة ذهبية خاصة في واجهة المطعم.</p>
                </div>
                <input
                  type="checkbox"
                  checked={newItemForm.isChefSpecial}
                  onChange={e => setNewItemForm({ ...newItemForm, isChefSpecial: e.target.checked })}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-lg transition-all cursor-pointer"
                >
                  {editingIndex !== null ? 'حفظ التعديلات' : 'إضافة الطبق للقائمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
