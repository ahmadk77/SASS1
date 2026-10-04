import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, ShoppingBag, Sparkles, X, Check, Image as ImageIcon, Tag, Truck, Percent, Save } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ManagerProps {
  content: any;
  tenant: any;
  templateId?: number;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function EcommerceManager({ content, setContent, templateId, handleUpdateContent }: ManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ index: number; title: string } | null>(null);

  // Promo Code & Shipping state
  const promoCodes = Array.isArray(content?.promoCodes) ? content.promoCodes : [];
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDiscount, setNewCodeDiscount] = useState('');
  const [shippingFeeInput, setShippingFeeInput] = useState<string>(content?.shippingFee !== undefined ? String(content.shippingFee) : '15');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const tId = Number(templateId || content?.templateId || 13);
  const isBoutique = tId === 13;
  const isElectronics = tId === 14;
  const isPerfume = tId === 15;

  const [newItemForm, setNewItemForm] = useState<any>({
    name: '',
    title: '',
    category: isBoutique ? 'فساتين سهرة' : isElectronics ? 'هواتف ذكية' : 'عطور شرقية',
    price: '',
    originalPrice: '',
    stock: 15,
    fabric: isBoutique ? 'حرير طبيعي' : '',
    description: '',
    image: isElectronics ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800' : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800',
    images: [],
    sizes: isElectronics ? ['128GB', '256GB', '512GB', '1TB'] : ['S', 'M', 'L', 'XL'],
    colors: ['أسود كلاسيكي', 'أبيض ملكي', 'ذهبي'],
    tags: ['عرض ساخن 🔥', 'الأكثر مبيعاً 👑']
  });

  const items = Array.isArray(content?.items) ? content.items : [];
  const categories = ['all', ...Array.from(new Set(items.map((i: any) => i.category || i.type).filter(Boolean)))];

  const filteredItems = items.filter((item: any) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory || item.type === selectedCategory;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    return matchesCat && (name.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      name: '',
      title: '',
      category: isBoutique ? 'فساتين سهرة' : isElectronics ? 'هواتف ذكية' : 'عطور شرقية',
      price: '',
      originalPrice: '',
      stock: 15,
      fabric: isBoutique ? 'حرير طبيعي' : '',
      description: '',
      image: isElectronics ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800' : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800',
      images: [],
      sizes: isElectronics ? ['128GB', '256GB', '512GB', '1TB'] : ['S', 'M', 'L', 'XL'],
      colors: ['أسود', 'أبيض'],
      tags: ['الأكثر مبيعاً']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    setNewItemForm({
      name: item.name || item.title || '',
      title: item.title || item.name || '',
      category: item.category || item.type || 'عام',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      stock: item.stock !== undefined ? item.stock : 10,
      fabric: item.fabric || '',
      description: item.description || '',
      image: item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800',
      images: Array.isArray(item.images) ? item.images : [],
      sizes: Array.isArray(item.sizes) ? item.sizes : ['S', 'M', 'L'],
      colors: Array.isArray(item.colors) ? item.colors : ['أسود'],
      tags: Array.isArray(item.tags) ? item.tags : []
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
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
      originalPrice: newItemForm.originalPrice || '',
      stock: Number(newItemForm.stock) || 0,
      fabric: newItemForm.fabric,
      description: newItemForm.description,
      image: newItemForm.image,
      images: newItemForm.images,
      sizes: newItemForm.sizes,
      colors: newItemForm.colors,
      tags: newItemForm.tags
    };
    if (editingIndex !== null) updated[editingIndex] = data;
    else updated.unshift(data);

    setContent({ ...content, items: updated });
    setIsModalOpen(false);
  };

  const handleDelete = (index: number) => {
    const item = items[index];
    const itemTitle = item?.name || item?.title || 'هذا المنتج';
    setItemToDelete({ index, title: itemTitle });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    setContent({ ...content, items: items.filter((_: any, i: number) => i !== itemToDelete.index) });
    setItemToDelete(null);
  };

  const handleAddPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim() || !newCodeDiscount) return;
    const codeObj = {
      id: `code_${Date.now()}`,
      code: newCodeName.trim().toUpperCase(),
      discountPercent: Number(newCodeDiscount) || 10,
      createdAt: new Date().toISOString()
    };
    const updatedCodes = [codeObj, ...promoCodes];
    const newContent = { ...content, promoCodes: updatedCodes };
    setContent(newContent);
    if (handleUpdateContent) handleUpdateContent(false);
    setNewCodeName('');
    setNewCodeDiscount('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleDeletePromoCode = (codeId: string) => {
    const updatedCodes = promoCodes.filter((c: any) => c.id !== codeId && c.code !== codeId);
    const newContent = { ...content, promoCodes: updatedCodes };
    setContent(newContent);
    if (handleUpdateContent) handleUpdateContent(false);
  };

  const handleSaveShippingFee = () => {
    const newContent = { ...content, shippingFee: Number(shippingFeeInput) || 0 };
    setContent(newContent);
    if (handleUpdateContent) handleUpdateContent(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans" dir="rtl">
      <div className="bg-gradient-to-l from-pink-950 via-purple-950 to-slate-950 p-8 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-300 px-3.5 py-1.5 rounded-full text-xs font-black mb-3">
            <ShoppingBag size={14} /> لوحة إدارة متجر التجارة الإلكترونية والبوتيك
          </div>
          <h2 className="text-2xl font-black">
            {isBoutique ? 'إدارة الأزياء والقطع الفاخرة' : isPerfume ? 'إدارة العطور الملكية والبخور' : 'إدارة الإلكترونيات والأجهزة الذكية'}
          </h2>
        </div>
        <button onClick={handleOpenAdd} className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer">
          <Plus size={16} /> <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* 🏷️ قسم أكواد الخصم وتكلفة الشحن */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قسم أكواد الخصم */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                <Tag size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">قسم أكواد الخصم (Promo Codes)</h3>
                <p className="text-xs text-slate-500 font-medium">أضف كود خصم وحدد نسبة الخصم للعملاء عند إتمام الطلب</p>
              </div>
            </div>
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                ✓ تم الحفظ بنجاح
              </span>
            )}
          </div>

          <form onSubmit={handleAddPromoCode} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-2xl border">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كود الخصم (رمز الكوبون)</label>
              <input
                type="text"
                required
                value={newCodeName}
                onChange={e => setNewCodeName(e.target.value)}
                placeholder="مثال: SALE20"
                className="w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-bold uppercase tracking-wider text-pink-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الخصم (%)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={newCodeDiscount}
                  onChange={e => setNewCodeDiscount(e.target.value)}
                  placeholder="20"
                  className="w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-800 outline-none pl-8"
                />
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              <span>إضافة كود الخصم</span>
            </button>
          </form>

          {/* قائمة الأكواد الحالية */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 mb-2">الأكواد المتاحة للعملاء:</h4>
            {promoCodes.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed text-xs text-slate-400 font-medium">
                لا توجد أكواد خصم حالية. قم بإنشاء أول كود خصم لعملائك!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {promoCodes.map((pc: any) => (
                  <div key={pc.id || pc.code} className="flex items-center justify-between p-3.5 bg-pink-50/50 border border-pink-100 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-xs text-pink-700 bg-white border border-pink-200 px-3 py-1 rounded-xl shadow-xs">
                        {pc.code}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        خصم {pc.discountPercent}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePromoCode(pc.id || pc.code)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="حذف الكود"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* قسم تحديد قيمة الشحن */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b pb-4">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Truck size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-base">تكلفة الشحن (Shipping Fee)</h3>
                <p className="text-xs text-slate-500 font-medium">حدد رسوم التوصيل للعميل عند الشراء</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">قيمة الشحن الثابتة</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={shippingFeeInput}
                  onChange={e => setShippingFeeInput(e.target.value)}
                  placeholder="15"
                  className="w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-black text-indigo-900 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">سيتم إضافة هذا المبلغ تلقائياً لطلب العميل في السلة.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveShippingFee}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save size={15} />
            <span>حفظ قيمة الشحن</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث في المنتجات..." className="w-full bg-slate-50 border text-xs pr-11 pl-4 py-3 rounded-2xl outline-none font-bold" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat: string) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${selectedCategory === cat ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {cat === 'all' ? 'جميع التصنيفات' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item: any, idx: number) => {
          const realIdx = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
          return (
            <div key={item.id || idx} className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col">
              <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={item.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800'} alt={item.name || item.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">{item.category || item.type}</span>
                <span className="absolute bottom-3 left-3 bg-pink-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow">{item.price}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-base mb-1">{item.name || item.title}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-bold">المخزون: {item.stock ?? 10}</span>
                    {item.fabric && <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-bold">القماش: {item.fabric}</span>}
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-end gap-1.5">
                  <button onClick={() => handleOpenEdit(item, realIdx >= 0 ? realIdx : idx)} className="p-2 bg-pink-50 text-pink-700 rounded-xl cursor-pointer"><Edit size={15} /></button>
                  <button onClick={() => handleDelete(realIdx >= 0 ? realIdx : idx)} className="p-2 bg-rose-50 text-rose-600 rounded-xl cursor-pointer"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 text-lg">{editingIndex !== null ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-full bg-white border flex items-center justify-center cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج *</label>
                <input type="text" required value={newItemForm.name} onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <input type="text" value={newItemForm.category} onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر *</label>
                  <input type="text" required value={newItemForm.price} onChange={e => setNewItemForm({ ...newItemForm, price: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold text-pink-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">السعر قبل الخصم (اختياري)</label>
                  <input type="text" value={newItemForm.originalPrice} onChange={e => setNewItemForm({ ...newItemForm, originalPrice: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المخزون</label>
                  <input type="number" value={newItemForm.stock} onChange={e => setNewItemForm({ ...newItemForm, stock: Number(e.target.value) })} className="w-full px-4 py-3 border rounded-xl text-sm font-bold" />
                </div>
              </div>
              {isBoutique && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع القماش / الخامة</label>
                  <input type="text" value={newItemForm.fabric} onChange={e => setNewItemForm({ ...newItemForm, fabric: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" placeholder="مثال: حرير إيطالي مطرز" />
                </div>
              )}
              <div className="space-y-3 bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
                <ImageGalleryPicker
                  currentImage={newItemForm.image}
                  onSelectImage={url => setNewItemForm({ ...newItemForm, image: url })}
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط الصورة الرئيسية</label>
                  <input type="url" value={newItemForm.image} onChange={e => setNewItemForm({ ...newItemForm, image: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-xs bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف</label>
                <textarea rows={3} value={newItemForm.description} onChange={e => setNewItemForm({ ...newItemForm, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3 shrink-0 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border text-xs font-bold">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-pink-600 text-white text-xs font-black shadow">حفظ المنتج</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ إشعار وتأكيد الحذف من المنصة */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 dir-rtl" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">تأكيد حذف المنتج</h3>
                  <p className="text-xs font-semibold text-slate-500">إشعار منصة التجارة الإلكترونية</p>
                </div>
              </div>
              <button
                onClick={() => setItemToDelete(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <p className="text-xs font-bold text-slate-700">
                هل أنت متأكد من رغبتك في حذف المنتج التالي؟
              </p>
              <p className="text-sm font-black text-rose-600 bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                "{itemToDelete.title}"
              </p>
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                سيتم إزالة المنتج بشكل نهائي من منصة العرض وإلغاء ظهوره للزوار.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 size={16} />
                <span>نعم، تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
