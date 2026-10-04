import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Building2, X, ChevronRight, ChevronLeft, Bed, Bath } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  templateId?: number;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function RealEstateManager({ content, setContent, templateId }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [cardImageIndices, setCardImageIndices] = useState<{ [key: string]: number }>({});

  const [newItemForm, setNewItemForm] = useState({
    title: '',
    type: 'للبيع',
    price: '',
    location: 'الرياض',
    beds: 5,
    baths: 6,
    area: '800',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000',
    images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000']
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const categories = ['all', ...Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || item.type === selectedCategory;
    const name = item.name || item.title || '';
    const desc = item.description || item.location || '';
    return matchesCat && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      title: '',
      type: 'للبيع',
      price: '',
      location: 'الرياض',
      beds: 5,
      baths: 6,
      area: '800',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000',
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000'
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000'];
    setNewItemForm({
      title: item.title || item.name || '',
      type: item.type || item.category || 'للبيع',
      price: item.price || '',
      location: item.location || 'الرياض',
      beds: Number(item.beds) || 4,
      baths: Number(item.baths) || 4,
      area: item.area || '500',
      image: itemImages[0],
      images: itemImages
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title) return;
    const updated = [...items];
    const finalImages = newItemForm.images.length > 0 ? newItemForm.images : [newItemForm.image];
    const data = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      title: newItemForm.title,
      name: newItemForm.title,
      type: newItemForm.type,
      category: newItemForm.type,
      price: newItemForm.price || '0',
      location: newItemForm.location,
      beds: Number(newItemForm.beds) || 4,
      baths: Number(newItemForm.baths) || 4,
      area: newItemForm.area,
      image: finalImages[0],
      images: finalImages
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
      <div className="bg-gradient-to-l from-amber-950 via-slate-900 to-black p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <Building2 size={14} /> لوحة إدارة العقارات والوحدات
          </div>
          <h2 className="text-2xl font-black">إدارة الفلل، الشقق والعقارات التجارية</h2>
        </div>
        <button onClick={handleOpenAdd} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer">
          <Plus size={16} /> <span>إضافة عقار جديد</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث في العقارات..." className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat: string) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${selectedCategory === cat ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {cat === 'all' ? 'الكل' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          const cardKey = item.id || `realestate-${idx}`;
          const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.image || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000'];
          const activeImgIdx = cardImageIndices[cardKey] || 0;
          const currentImgUrl = itemImages[activeImgIdx % itemImages.length];

          return (
            <div key={cardKey} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col group">
              <div className="relative h-56 bg-stone-900 overflow-hidden">
                <img src={currentImgUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                {itemImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => prevCardImage(cardKey, itemImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center shadow-md backdrop-blur-md transition-all cursor-pointer z-10"
                      title="الصورة السابقة"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => nextCardImage(cardKey, itemImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center shadow-md backdrop-blur-md transition-all cursor-pointer z-10"
                      title="الصورة التالية"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10">
                      📷 {(activeImgIdx % itemImages.length) + 1} / {itemImages.length}
                    </div>
                  </>
                )}

                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">{item.type || item.category}</span>
                <span className="absolute bottom-3 left-3 bg-amber-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow">{item.price}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.title || item.name}</h3>
                  <p className="text-slate-500 text-xs">{item.location}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 font-bold">
                    {item.beds && <span>🛏️ {item.beds} غرف</span>}
                    {item.baths && <span>🛁 {item.baths} حمامات</span>}
                    {item.area && <span>📐 {item.area} م²</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-amber-50 text-amber-700 rounded-xl cursor-pointer"><Edit size={15} /></button>
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
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل العقار' : 'إضافة عقار جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان العقار *</label>
                <input type="text" required value={newItemForm.title} onChange={e => setNewItemForm({ ...newItemForm, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر *</label>
                  <input type="text" required value={newItemForm.price} onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-amber-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع العرض</label>
                  <input type="text" value={newItemForm.type} onChange={e => setNewItemForm({ ...newItemForm, type: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">غرف النوم</label>
                  <input type="number" value={newItemForm.beds} onChange={e => setNewItemForm({ ...newItemForm, beds: Number(e.target.value) })} className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">دورات المياه</label>
                  <input type="number" value={newItemForm.baths} onChange={e => setNewItemForm({ ...newItemForm, baths: Number(e.target.value) })} className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المساحة (م²)</label>
                  <input type="text" value={newItemForm.area} onChange={e => setNewItemForm({ ...newItemForm, area: e.target.value })} className="w-full px-3 py-2.5 border rounded-xl text-xs font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموقع / الحي</label>
                <input type="text" value={newItemForm.location} onChange={e => setNewItemForm({ ...newItemForm, location: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
              </div>
              <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط الصورة الرئيسية</label>
                  <input type="url" value={newItemForm.image} onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-xs bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">صور العقار المضافة ({newItemForm.images.length})</label>
                  <div className="grid grid-cols-4 gap-2">
                    {newItemForm.images.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                        <img src={imgUrl} alt={`Property ${imgIdx}`} className="w-full h-full object-cover" />
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
                        >
                          ✕ حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-black shadow">حفظ العقار</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
