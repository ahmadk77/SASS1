import React, { useState } from 'react';
import { Coffee, ShoppingBag, Clock, Plus, Trash2, Edit, Sparkles, X, Star, Layers, TrendingUp, Receipt, RotateCcw } from 'lucide-react';
import { getDefaultItemsForTemplate } from '../../../lib/defaultData';
import ImageGalleryPicker from './ImageGalleryPicker';

interface CozyCafeManagerProps {
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

export default function CozyCafeManager({
  content,
  tenant,
  templateId = 4,
  handleUpdateContent,
  setContent,
  dashboardColor = '#C5A880',
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: CozyCafeManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCafeOpen, setIsCafeOpen] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    title: '',
    category: 'قهوة مختصة',
    price: '',
    originalPrice: '',
    temperature: 'حار 🔥',
    sweetnessLevel: '50% (متوسط الحلاوة)',
    milkType: 'حليب عادي / كامل الدسم',
    prepTime: '10 دقائق',
    tags: 'الأكثر طلباً ⭐',
    description: '',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const orders = Array.isArray(content?.orders) ? content.orders : [];
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;
  const totalOrdersCount = orders.length;
  const categoriesCount = Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean))).length;

  const totalRevenue = orders.reduce((acc: number, o: any) => {
    const amt = parseFloat(String(o.total || o.price || 0).replace(/[^0-9.]/g, '')) || 0;
    return acc + amt;
  }, items.length * 28);

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
      category: 'قهوة مختصة',
      price: '',
      originalPrice: '',
      temperature: 'حار 🔥',
      sweetnessLevel: '50%',
      milkType: 'حليب عادي',
      prepTime: '10 دقائق',
      tags: 'الأكثر طلباً ⭐',
      description: '',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800'
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
      category: item.category || item.type || 'قهوة مختصة',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      temperature: item.temperature || 'حار 🔥',
      sweetnessLevel: item.sweetnessLevel || '50%',
      milkType: item.milkType || 'حليب عادي',
      prepTime: item.prepTime || '10 دقائق',
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || 'الأكثر طلباً ⭐'),
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800'
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
      temperature: newItemForm.temperature,
      sweetnessLevel: newItemForm.sweetnessLevel,
      milkType: newItemForm.milkType,
      prepTime: newItemForm.prepTime,
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
    if (!confirm('هل أنت متأكد من حذف هذا الصنف من المقهى؟')) return;
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
      {/* 📊 بطاقات الإحصائيات الخاصة بالمقهى */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedCategory('all')}
          className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-amber-900/60">إجمالي المشروبات والأصناف</p>
            <h3 className="text-2xl font-black text-[#1E120A] mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#C5A880] flex items-center justify-center font-bold shadow-inner">
            <Coffee size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`لديك ${pendingOrdersCount} طلب قهوة نشط بانتظار الباريستا.`)}
          className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-amber-400"
        >
          <div>
            <p className="text-xs font-bold text-amber-900/60">الطلبات النشطة</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{pendingOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900/60">متوسط وقت الباريستا</p>
            <h3 className="text-2xl font-black text-[#1E120A] mt-1">10 دقائق</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div 
          onClick={() => setIsCafeOpen(!isCafeOpen)}
          className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-emerald-400"
        >
          <div>
            <p className="text-xs font-bold text-amber-900/60">حالة المقهى</p>
            <h3 className={`text-xl font-black mt-1 ${isCafeOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCafeOpen ? '☕ مفتوح للزوار' : '🔒 مغلق مؤقتاً'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900/60">إجمالي الطلبات الواردة</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{totalOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Receipt size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900/60">التصنيفات المتاحة</p>
            <h3 className="text-2xl font-black text-indigo-700 mt-1">{categoriesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900/60">أصناف القهوة والحلويات</p>
            <h3 className="text-2xl font-black text-[#C5A880] mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#C5A880] flex items-center justify-center font-bold">
            <Star size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900/60">الإيرادات المقدرة</p>
            <h3 className="text-2xl font-black text-teal-700 mt-1">{totalRevenue.toLocaleString()} ر.س</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Header & Quick Action */}
      <div className="bg-gradient-to-l from-[#1E120A] via-[#2D1B10] to-[#140C07] p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-[#C5A880]/30">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C5A880]/20 text-[#E6D5BC] border border-[#C5A880]/40 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Coffee size={14} /> إدارة المقاهي المختصة والمشروبات الدافئة والباردة
          </div>
          <h2 className="text-2xl font-black">تحكم بأنواع القهوة، الحلويات الطازجة، وتفضيلات الحلاوة والحرارة</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaults = getDefaultItemsForTemplate(templateId || 4);
              setContent({ ...content, items: defaults });
              handleUpdateContent();
              alert('تم استعادة أصناف المقهى الافتراضية بنجاح!');
            }}
            className="bg-[#2D1B10] hover:bg-[#3D2517] text-[#C5A880] border border-[#C5A880]/30 px-5 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>استعادة أصناف القالب</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-[#C5A880] hover:bg-[#b0946d] text-[#1E120A] px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة مشروب أو صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-amber-900/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في قائمة المقهى..."
            className="w-full bg-[#FCFAF7] border border-amber-900/10 text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold focus:border-[#C5A880] transition-all text-[#1E120A]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedCategory === cat ? 'bg-[#1E120A] text-[#C5A880] shadow' : 'bg-[#FCFAF7] text-slate-600 hover:bg-slate-100 border border-amber-900/10'
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
            <div key={item.id || idx} className="bg-white rounded-3xl border border-amber-900/10 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-52 bg-amber-50 overflow-hidden">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800'}
                  alt={item.name || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-[#1E120A]/80 backdrop-blur-md text-[#C5A880] text-[11px] font-bold px-3 py-1 rounded-full border border-[#C5A880]/30">
                  {item.category || item.type || 'مقهى'}
                </span>
                <div className="absolute top-3 left-3 flex flex-col items-end gap-1">
                  {tags.map((t: string, tIdx: number) => (
                    <span key={tIdx} className="bg-[#C5A880] text-[#1E120A] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-3 left-3 bg-[#1E120A] text-[#C5A880] border border-[#C5A880]/40 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <span>{item.price}</span>
                  {item.originalPrice && <span className="text-[11px] text-amber-200/60 line-through">{item.originalPrice}</span>}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-[#1E120A] text-base mb-1">{item.name || item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-700 font-bold">
                    {item.temperature && <span className="bg-[#FCFAF7] border border-amber-900/10 px-2.5 py-1 rounded-lg">🌡️ {item.temperature}</span>}
                    {item.sweetnessLevel && <span className="bg-[#FCFAF7] border border-amber-900/10 px-2.5 py-1 rounded-lg">🍬 حلاوة: {item.sweetnessLevel}</span>}
                    {item.milkType && <span className="bg-[#FCFAF7] border border-amber-900/10 px-2.5 py-1 rounded-lg">🥛 {item.milkType}</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <Clock size={13} className="text-[#C5A880]" /> {item.prepTime || '10 دقائق'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(item, realIdx >= 0 ? realIdx : idx)}
                      className="p-2 bg-amber-50 text-[#1E120A] hover:bg-amber-100 rounded-xl cursor-pointer transition-colors"
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
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-3xl border border-amber-900/10 p-12 text-center text-slate-400 text-sm font-bold">
          لا توجد أصناف مطابقة لبحثك.
        </div>
      )}

      {/* Modal for Add / Edit Cozy Cafe Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-[#FCFAF7] shrink-0">
              <h3 className="font-black text-[#1E120A] text-lg">
                {editingIndex !== null ? 'تعديل مشروب أو صنف المقهى' : 'إضافة مشروب أو صنف جديد'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المشروب أو الصنف *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })}
                  placeholder="مثال: Spanish Latte أو Croissant"
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
                    placeholder="مثال: قهوة مختصة، حلويات"
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
                    placeholder="مثال: ٢٢ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-[#C5A880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درجة الحرارة</label>
                  <select
                    value={newItemForm.temperature}
                    onChange={e => setNewItemForm({ ...newItemForm, temperature: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="حار 🔥">حار 🔥</option>
                    <option value="بارد ❄️">بارد ❄️</option>
                    <option value="عادي / بدرجة الغرفة">عادي / بدرجة الغرفة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مستوى السحابة والحلاوة (Sweetness)</label>
                  <select
                    value={newItemForm.sweetnessLevel}
                    onChange={e => setNewItemForm({ ...newItemForm, sweetnessLevel: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="0% (بدون سكر)">0% (بدون سكر)</option>
                    <option value="25% (قليل الحلاوة)">25% (قليل الحلاوة)</option>
                    <option value="50% (متوسط الحلاوة)">50% (متوسط الحلاوة)</option>
                    <option value="100% (عادي)">100% (عادي)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحليب المفضل</label>
                  <select
                    value={newItemForm.milkType}
                    onChange={e => setNewItemForm({ ...newItemForm, milkType: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="حليب عادي / كامل الدسم">حليب عادي / كامل الدسم</option>
                    <option value="حليب قليل الدسم">حليب قليل الدسم</option>
                    <option value="حليب اللوز (Almond)">حليب اللوز (Almond)</option>
                    <option value="حليب الشوفان (Oat)">حليب الشوفان (Oat)</option>
                    <option value="حليب الصويا">حليب الصويا</option>
                    <option value="بدون حليب (أسود)">بدون حليب (أسود)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الباريستا والتحضير</label>
                  <input
                    type="text"
                    value={newItemForm.prepTime}
                    onChange={e => setNewItemForm({ ...newItemForm, prepTime: e.target.value })}
                    placeholder="مثال: 10 دقائق"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الأصلي المشطوب (إن وجد)</label>
                  <input
                    type="text"
                    value={newItemForm.originalPrice}
                    onChange={e => setNewItemForm({ ...newItemForm, originalPrice: e.target.value })}
                    placeholder="مثال: ٢٨ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وسوم الشارات الديناميكية</label>
                  <input
                    type="text"
                    value={newItemForm.tags}
                    onChange={e => setNewItemForm({ ...newItemForm, tags: e.target.value })}
                    placeholder="الأكثر طلباً ⭐, جديد ✨"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة الصنف</label>
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
                  placeholder="مثال: إسبريسو مزدوج مع حليب مبخر وفاخر ونكهة السبانيش لاتيه الخاصة."
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
                  className="px-6 py-2.5 rounded-xl bg-[#1E120A] text-[#C5A880] text-xs font-black shadow cursor-pointer hover:bg-[#2D1B10]"
                >
                  حفظ الصنف في قائمة المقهى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
