import React, { useState } from 'react';
import { Coffee, ShoppingBag, Package, Plus, Trash2, Edit, Award, X, Sparkles, Layers, TrendingUp, Receipt, RotateCcw } from 'lucide-react';
import { getDefaultItemsForTemplate } from '../../../lib/defaultData';
import ImageGalleryPicker from './ImageGalleryPicker';

interface SpecialtyCoffeeManagerProps {
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

export default function SpecialtyCoffeeManager({
  content,
  tenant,
  templateId = 5,
  handleUpdateContent,
  setContent,
  dashboardColor = '#d97706',
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: SpecialtyCoffeeManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('all');
  const [isRoasteryActive, setIsRoasteryActive] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    name: '',
    title: '',
    origin: 'إثيوبيا',
    roastLevel: 'تحميص متوسط (Medium Roast)',
    process: 'مغسول (Washed)',
    flavorNotes: 'شوكولاتة بالحليب، فواكه استوائية، ياسمين',
    weight: '250 جرام',
    stockLevel: 'متوفر بكثرة (50+ عبوة)',
    price: '',
    originalPrice: '',
    category: 'محاصيل الفلتر والإسبريسو',
    description: '',
    image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800'
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const orders = Array.isArray(content?.orders) ? content.orders : [];
  const pendingOrdersCount = orders.filter((o: any) => o.status === 'pending').length;
  const totalOrdersCount = orders.length;
  const originsCount = Array.from(new Set(items.map((i: any) => i.origin || i.category).filter(Boolean))).length;

  const totalRevenue = orders.reduce((acc: number, o: any) => {
    const amt = parseFloat(String(o.total || o.price || 0).replace(/[^0-9.]/g, '')) || 0;
    return acc + amt;
  }, items.length * 65);

  const origins = ['all', ...Array.from(new Set(items.map((i: any) => i.origin).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    const matchesOrigin = selectedOrigin === 'all' || item.origin === selectedOrigin;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    const notes = item.flavorNotes || '';
    return matchesOrigin && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()) || notes.toLowerCase().includes(searchQuery.toLowerCase()));
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
      origin: 'إثيوبيا',
      roastLevel: 'تحميص متوسط (Medium Roast)',
      process: 'مغسول (Washed)',
      flavorNotes: 'توت، شوكولاتة داكنة',
      weight: '250 جرام',
      stockLevel: 'متوفر',
      price: '',
      originalPrice: '',
      category: 'محاصيل الفلتر',
      description: '',
      image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800'
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
      origin: item.origin || 'إثيوبيا',
      roastLevel: item.roastLevel || 'تحميص متوسط',
      process: item.process || 'مغسول',
      flavorNotes: item.flavorNotes || 'شوكولاتة، فاكهية',
      weight: item.weight || '250 جرام',
      stockLevel: item.stockLevel || 'متوفر',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      category: item.category || 'محاصيل الفلتر',
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800'
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
      origin: newItemForm.origin,
      roastLevel: newItemForm.roastLevel,
      process: newItemForm.process,
      flavorNotes: newItemForm.flavorNotes,
      weight: newItemForm.weight,
      stockLevel: newItemForm.stockLevel,
      price: newItemForm.price || '0',
      originalPrice: newItemForm.originalPrice,
      category: newItemForm.category,
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
    if (!confirm('هل أنت متأكد من حذف محصول القهوة هذا؟')) return;
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
      {/* 📊 بطاقات الإحصائيات الخاصة بالقهوة المختصة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedOrigin('all')}
          className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-amber-900/60">محاصيل القهوة المتاحة</p>
            <h3 className="text-2xl font-black text-amber-950 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shadow-inner">
            <Coffee size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`لديك ${pendingOrdersCount} طلب محصول معلق بانتظار الشحن والتغليف.`)}
          className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-amber-400"
        >
          <div>
            <p className="text-xs font-bold text-amber-900/60">الطلبات المعلقة</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{pendingOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div 
          onClick={() => setIsRoasteryActive(!isRoasteryActive)}
          className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-emerald-400"
        >
          <div>
            <p className="text-xs font-bold text-amber-900/60">حالة المخزون العام</p>
            <h3 className={`text-xl font-black mt-1 ${isRoasteryActive ? 'text-emerald-600' : 'text-amber-700'}`}>
              {isRoasteryActive ? '🟢 متوفر ومستقر' : '⚠️ تحديث المخزون'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900/60">جودة التحميص</p>
            <h3 className="text-2xl font-black text-amber-800 mt-1">فاخرة (Grade A)</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Award size={22} />
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
            <p className="text-xs font-bold text-amber-900/60">بلدان المناشئ</p>
            <h3 className="text-2xl font-black text-indigo-700 mt-1">{originsCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-900/60">المحاصيل والعبوات</p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles size={22} />
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
      <div className="bg-gradient-to-l from-amber-950 via-amber-900 to-stone-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-amber-600/30">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-600/20 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Coffee size={14} /> إدارة محاصيل ومحمصة القهوة المختصة
          </div>
          <h2 className="text-2xl font-black">إضافة محاصيل جديدة، تحديد درجات التحميص، والإيحاءات والوزن</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaults = getDefaultItemsForTemplate(5);
              setContent({ ...content, items: defaults });
              handleUpdateContent();
              alert('تم استعادة محاصيل القهوة الافتراضية بنجاح!');
            }}
            className="bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/30 px-5 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>استعادة المحاصيل الافتراضية</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة محصول قهوة</span>
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
            placeholder="بحث في المحاصيل والإيحاءات..."
            className="w-full bg-amber-50/40 border border-amber-900/10 text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold focus:border-amber-600 transition-all text-amber-950"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {origins.map((orig: string) => (
            <button
              key={orig}
              onClick={() => setSelectedOrigin(orig)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedOrigin === orig ? 'bg-amber-800 text-white shadow' : 'bg-amber-50/60 text-slate-700 hover:bg-amber-100 border border-amber-900/10'
              }`}
            >
              {orig === 'all' ? 'جميع المناشئ' : orig}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border border-amber-900/10 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-52 bg-amber-50 overflow-hidden">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800'}
                  alt={item.name || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-amber-950/80 backdrop-blur-md text-amber-200 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-500/30">
                  {item.origin || 'إثيوبيا'}
                </span>
                <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                  {item.weight || '250 جرام'}
                </span>
                <div className="absolute bottom-3 left-3 bg-amber-900 text-amber-100 border border-amber-500/40 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <span>{item.price}</span>
                  {item.originalPrice && <span className="text-[11px] text-amber-200/60 line-through">{item.originalPrice}</span>}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-amber-950 text-base mb-1">{item.name || item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-700 font-bold">
                    {item.roastLevel && <span className="bg-amber-50/80 text-amber-900 border border-amber-900/10 px-2.5 py-1 rounded-lg">🔥 {item.roastLevel}</span>}
                    {item.process && <span className="bg-amber-50/80 text-amber-900 border border-amber-900/10 px-2.5 py-1 rounded-lg">💧 {item.process}</span>}
                  </div>
                  {item.flavorNotes && (
                    <div className="mt-2 text-xs font-medium text-amber-800 bg-amber-100/60 p-2 rounded-xl">
                      🍒 الإيحاءات: {item.flavorNotes}
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    📦 {item.stockLevel || 'متوفر'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(item, realIdx >= 0 ? realIdx : idx)}
                      className="p-2 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-xl cursor-pointer transition-colors"
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
          لا توجد محاصيل قهوة مطابقة لبحثك.
        </div>
      )}

      {/* Modal for Add / Edit Specialty Coffee Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-amber-50/50 shrink-0">
              <h3 className="font-black text-amber-950 text-lg">
                {editingIndex !== null ? 'تعديل محصول القهوة المختصة' : 'إضافة محصول قهوة جديد'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج / محصول القهوة *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })}
                  placeholder="مثال: Ethiopian Yirgacheffe أو Colombia Geisha"
                  className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">بلد المنشأ (Origin)</label>
                  <input
                    type="text"
                    value={newItemForm.origin}
                    onChange={e => setNewItemForm({ ...newItemForm, origin: e.target.value })}
                    placeholder="مثال: إثيوبيا، كولومبيا، برازيل"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مستوى التحميص (Roast Level)</label>
                  <select
                    value={newItemForm.roastLevel}
                    onChange={e => setNewItemForm({ ...newItemForm, roastLevel: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="تحميص خفيف (Light Roast)">تحميص خفيف (Light Roast)</option>
                    <option value="تحميص متوسط (Medium Roast)">تحميص متوسط (Medium Roast)</option>
                    <option value="تحميص غامق (Dark Roast)">تحميص غامق (Dark Roast)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة المعالجة (Process)</label>
                  <select
                    value={newItemForm.process}
                    onChange={e => setNewItemForm({ ...newItemForm, process: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="مجفف (Natural)">مجفف (Natural)</option>
                    <option value="مغسول (Washed)">مغسول (Washed)</option>
                    <option value="لاهوائي (Anaerobic)">لاهوائي (Anaerobic)</option>
                    <option value="عسلي (Honey)">عسلي (Honey)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وزن وحجم العبوة (Weight)</label>
                  <select
                    value={newItemForm.weight}
                    onChange={e => setNewItemForm({ ...newItemForm, weight: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="150 جرام">150 جرام</option>
                    <option value="250 جرام">250 جرام</option>
                    <option value="500 جرام">500 جرام</option>
                    <option value="1 كيلو">1 كيلو</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الأساسي *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.price}
                    onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="مثال: ٦٥ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الأصلي المشطوب (عرض)</label>
                  <input
                    type="text"
                    value={newItemForm.originalPrice}
                    onChange={e => setNewItemForm({ ...newItemForm, originalPrice: e.target.value })}
                    placeholder="مثال: ٧٥ ر.س"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مستوى المخزون (Stock)</label>
                  <input
                    type="text"
                    value={newItemForm.stockLevel}
                    onChange={e => setNewItemForm({ ...newItemForm, stockLevel: e.target.value })}
                    placeholder="مثال: متوفر بكثرة، 20 عبوة"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">إيحاءات القهوة (Flavor Notes)</label>
                  <input
                    type="text"
                    value={newItemForm.flavorNotes}
                    onChange={e => setNewItemForm({ ...newItemForm, flavorNotes: e.target.value })}
                    placeholder="مثال: شوكولاتة، فاكهية، ياسمين"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة المحصول</label>
                  <input
                    type="url"
                    value={newItemForm.image}
                    onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المحصول وقصة التحميص</label>
                <textarea
                  rows={2}
                  value={newItemForm.description}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="مثال: محصول فاخر من مرتفعات إثيوبيا، يتميز بقوام غني وإيحاءات عطرية فاخرة."
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
                  className="px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-black shadow cursor-pointer hover:bg-amber-800"
                >
                  حفظ المحصول في المحمصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
