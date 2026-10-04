import React, { useState } from 'react';
import { Building2, ShoppingBag, MapPin, Plus, Trash2, Edit, Home, Sparkles, Layers, TrendingUp, Receipt, RotateCcw, Bed, Bath, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { getDefaultItemsForTemplate } from '../../../lib/defaultData';
import ImageGalleryPicker from './ImageGalleryPicker';

interface LuxuryVillasManagerProps {
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

export default function LuxuryVillasManager({
  content,
  tenant,
  templateId = 7,
  handleUpdateContent,
  setContent,
  dashboardColor = '#0284c7',
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: LuxuryVillasManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isMarketActive, setIsMarketActive] = useState(true);

  // Active image index for each card preview during carousel browsing
  const [cardImageIndices, setCardImageIndices] = useState<{ [key: string]: number }>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    name: '',
    location: 'حي الملقا، الرياض',
    type: 'للبيع',
    price: '',
    originalPrice: '',
    beds: 5,
    baths: 6,
    area: '650',
    description: '',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000']
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const orders = Array.isArray(content?.orders) ? content.orders : [];
  const pendingInquiriesCount = orders.filter((o: any) => o.status === 'pending').length;
  const totalOrdersCount = orders.length;
  const typesCount = Array.from(new Set(items.map((i: any) => i.type || i.category).filter(Boolean))).length;

  const types = ['all', ...Array.from(new Set(items.map((i: any) => i.type || i.category).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    const itemType = item.type || item.category || '';
    const matchesType = selectedType === 'all' || itemType === selectedType;
    const title = item.title || item.name || '';
    const loc = item.location || '';
    const desc = item.description || '';
    return matchesType && (title.toLowerCase().includes(searchQuery.toLowerCase()) || loc.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAddModal = () => {
    if (handleAddItem) {
      handleAddItem();
      return;
    }
    setEditingIndex(null);
    setNewItemForm({
      title: '',
      name: '',
      location: 'حي حطين، الرياض',
      type: 'للبيع',
      price: '',
      originalPrice: '',
      beds: 6,
      baths: 7,
      area: '850',
      description: '',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000'
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any, idx: number) => {
    if (handleEditItem) {
      handleEditItem(item, idx);
      return;
    }
    setEditingIndex(idx);
    const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000'];
    setNewItemForm({
      title: item.title || item.name || '',
      name: item.name || item.title || '',
      location: item.location || 'الرياض',
      type: item.type || item.category || 'للبيع',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      beds: Number(item.beds) || 5,
      baths: Number(item.baths) || 6,
      area: String(item.area || '650'),
      description: item.description || '',
      image: itemImages[0],
      images: itemImages
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const titleVal = newItemForm.title || newItemForm.name;
    if (!titleVal) return;
    const updated = [...items];

    const finalImages = newItemForm.images.length > 0 ? newItemForm.images : [newItemForm.image];

    const data = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      title: titleVal,
      name: titleVal,
      location: newItemForm.location,
      type: newItemForm.type,
      category: newItemForm.type,
      price: newItemForm.price || '0',
      originalPrice: newItemForm.originalPrice,
      beds: Number(newItemForm.beds),
      baths: Number(newItemForm.baths),
      area: newItemForm.area,
      description: newItemForm.description,
      image: finalImages[0],
      images: finalImages
    };

    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    setContent({ ...content, items: updated });
    handleUpdateContent();
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقار من المحفظة؟')) return;
    const targetItem = items[index];
    if (handleDeleteItem && targetItem?.id) {
      handleDeleteItem(targetItem.id);
      return;
    }
    const updated = items.filter((_: any, idx: number) => idx !== index);
    setContent({ ...content, items: updated });
    handleUpdateContent();
  };

  const nextCardImage = (cardKey: string, total: number) => {
    setCardImageIndices(prev => {
      const current = prev[cardKey] || 0;
      const next = (current + 1) % total;
      return { ...prev, [cardKey]: next };
    });
  };

  const prevCardImage = (cardKey: string, total: number) => {
    setCardImageIndices(prev => {
      const current = prev[cardKey] || 0;
      const next = (current - 1 + total) % total;
      return { ...prev, [cardKey]: next };
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* 📊 بطاقات الإحصائيات الخاصة بالعقارات الفاخرة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedType('all')}
          className="bg-white p-5 rounded-2xl border border-sky-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-sky-900/60">إجمالي العقارات والفلل</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shadow-inner">
            <Building2 size={22} />
          </div>
        </div>

        <div 
          onClick={() => alert(`لديك ${pendingInquiriesCount} طلب معاينة عقار معلق بانتظار الجدولة.`)}
          className="bg-white p-5 rounded-2xl border border-sky-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-amber-400"
        >
          <div>
            <p className="text-xs font-bold text-sky-900/60">طلبات المعاينة المعلقة</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingInquiriesCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sky-900/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-sky-900/60">متوسط مساحة العقار</p>
            <h3 className="text-2xl font-black text-indigo-700 mt-1">650 م²</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Home size={22} />
          </div>
        </div>

        <div 
          onClick={() => setIsMarketActive(!isMarketActive)}
          className="bg-white p-5 rounded-2xl border border-sky-900/10 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:border-emerald-400"
        >
          <div>
            <p className="text-xs font-bold text-sky-900/60">حالة السوق العقاري</p>
            <h3 className={`text-xl font-black mt-1 ${isMarketActive ? 'text-emerald-600' : 'text-sky-700'}`}>
              {isMarketActive ? '💎 نشط واستثماري' : '📊 هادئ'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <MapPin size={22} />
          </div>
        </div>
      </div>

      {/* Header & Quick Action */}
      <div className="bg-gradient-to-l from-slate-950 via-sky-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-sky-500/30">
        <div>
          <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Building2 size={14} /> إدارة محفظة العقارات والفلل الفاخرة (معارض صور تفاعلية)
          </div>
          <h2 className="text-2xl font-black">إضافة صور متعددة للعقار، تصفح الصور يمين ويسار، ومتابعة المعاينات</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaults = getDefaultItemsForTemplate(7);
              setContent({ ...content, items: defaults });
              handleUpdateContent();
              alert('تم استعادة العقارات والفلل الافتراضية بنجاح!');
            }}
            className="bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 px-5 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>استعادة العقارات الافتراضية</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة عقار جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-sky-900/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في العقارات، المواقع، والفلل..."
            className="w-full bg-sky-50/40 border border-sky-900/10 text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold focus:border-sky-500 transition-all text-slate-900"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {types.map((tp: string) => (
            <button
              key={tp}
              onClick={() => setSelectedType(tp)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedType === tp ? 'bg-sky-600 text-white shadow' : 'bg-sky-50/60 text-slate-700 hover:bg-sky-100 border border-sky-900/10'
              }`}
            >
              {tp === 'all' ? 'جميع الأنواع' : tp}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Items with Multi-Image Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          const cardKey = item.id || `item-${idx}`;
          const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000'];
          const activeImgIdx = cardImageIndices[cardKey] || 0;
          const currentImgUrl = itemImages[activeImgIdx % itemImages.length];

          return (
            <div key={cardKey} className="bg-white rounded-3xl border border-sky-900/10 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="relative h-60 bg-sky-950 overflow-hidden">
                <img
                  src={currentImgUrl}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Carousel Navigation Arrows */}
                {itemImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => prevCardImage(cardKey, itemImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer z-10"
                      title="الصورة السابقة"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => nextCardImage(cardKey, itemImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center shadow-lg backdrop-blur-md transition-all cursor-pointer z-10"
                      title="الصورة التالية"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-sky-500/30 flex items-center gap-1.5 z-10">
                      <span>📷 {(activeImgIdx % itemImages.length) + 1} / {itemImages.length}</span>
                    </div>
                  </>
                )}

                <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-sky-500/30">
                  {item.location || 'الرياض'}
                </span>
                <span className="absolute top-3 left-3 bg-sky-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                  {item.type || item.category || 'للبيع'}
                </span>
                <div className="absolute bottom-3 left-3 bg-slate-900 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <span>{item.price}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base mb-1">{item.title || item.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description || 'عقار فاخر بتصميم هندسي فريد ومواصفات استثنائية تناسب الذوق الرفيع.'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-700 font-bold">
                    {item.beds && <span className="bg-sky-50 text-sky-900 border border-sky-900/10 px-2.5 py-1 rounded-lg flex items-center gap-1"><Bed size={13} /> {item.beds} غرف</span>}
                    {item.baths && <span className="bg-sky-50 text-sky-900 border border-sky-900/10 px-2.5 py-1 rounded-lg flex items-center gap-1"><Bath size={13} /> {item.baths} حمامات</span>}
                    {item.area && <span className="bg-indigo-50 text-indigo-900 border border-indigo-900/10 px-2.5 py-1 rounded-lg">📐 {item.area} م²</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    🟢 جاهز للإفراغ
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(item, realIdx >= 0 ? realIdx : idx)}
                      className="p-2 bg-sky-50 text-sky-900 hover:bg-sky-100 rounded-xl cursor-pointer transition-colors"
                      title="تعديل الصور والعقار"
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
        <div className="bg-white rounded-3xl border border-sky-900/10 p-12 text-center text-slate-400 text-sm font-bold">
          لا توجد عقارات مطابقة لبحثك.
        </div>
      )}

      {/* Modal for Add / Edit Luxury Villa with Multi-Image Support & Gallery Picker */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-sky-50/50 shrink-0">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  {editingIndex !== null ? 'تعديل بيانات العقار الفاخر ومعرض الصور' : 'إضافة عقار أو فيلا جديدة مع معرض صور'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">يمكنك إضافة صور متعددة ليتسنى للعملاء تصفحها يمين ويسار</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان العقار أو اسم الفلا *</label>
                <input
                  type="text"
                  required
                  value={newItemForm.title}
                  onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value, name: e.target.value })}
                  placeholder="مثال: Grand Royal Villa - Palm Jumeirah"
                  className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموقع الجغرافي (Location)</label>
                  <input
                    type="text"
                    value={newItemForm.location}
                    onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })}
                    placeholder="مثال: حي الملقا، الرياض"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع العرض (Type)</label>
                  <select
                    value={newItemForm.type}
                    onChange={e => setNewItemForm({ ...newItemForm, type: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="للبيع">للبيع</option>
                    <option value="للإيجار">للإيجار</option>
                    <option value="قيد الإنشاء">قيد الإنشاء</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر الإجمالي *</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.price}
                    onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="مثال: ١٥,٠٠٠,٠٠٠ ريال"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-sky-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">إجمالي المساحة (م²)</label>
                  <input
                    type="text"
                    value={newItemForm.area}
                    onChange={e => setNewItemForm({ ...newItemForm, area: e.target.value })}
                    placeholder="مثال: 850"
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عدد غرف النوم (Beds)</label>
                  <input
                    type="number"
                    value={newItemForm.beds}
                    onChange={e => setNewItemForm({ ...newItemForm, beds: Number(e.target.value) })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">دورات المياه (Baths)</label>
                  <input
                    type="number"
                    value={newItemForm.baths}
                    onChange={e => setNewItemForm({ ...newItemForm, baths: Number(e.target.value) })}
                    className="w-full px-4 py-3 border rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              {/* Multi-Image Gallery Section */}
              <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-3">
                <ImageGalleryPicker
                  isMulti={true}
                  currentImage={newItemForm.image}
                  currentImages={newItemForm.images}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                  onAddImageToList={url => {
                    if (!newItemForm.images.includes(url)) {
                      setNewItemForm(prev => ({ ...prev, images: [...prev.images, url] }));
                    }
                  }}
                />

                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">صور العقار المضافة ({newItemForm.images.length})</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                    {newItemForm.images.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                        <img src={imgUrl} alt={`Villa ${imgIdx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedList = newItemForm.images.filter((_, idx) => idx !== imgIdx);
                            setNewItemForm({
                              ...newItemForm,
                              images: updatedList,
                              image: updatedList[0] || ''
                            });
                          }}
                          className="absolute inset-0 bg-rose-950/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs"
                          title="حذف الصورة"
                        >
                          ✕ حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف العقار والمميزات الإضافية</label>
                <textarea
                  rows={2}
                  value={newItemForm.description}
                  onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="مثال: فيلا فخمة مع مسبح خاص وحديقة واسعة وتشطيبات رخامية فائقة الجودة."
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
                  className="px-6 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-black shadow cursor-pointer hover:bg-sky-700"
                >
                  حفظ العقار في المحفظة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
