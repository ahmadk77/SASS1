import React, { useState } from 'react';
import { Shirt, ShoppingBag, Tag, Plus, Trash2, Edit, Sparkles, Search, X, Check, Eye, Upload, Truck, Percent, Save, Bell } from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface FashionBoutiqueManagerProps {
  content: any;
  tenant?: any;
  templateId?: number;
  handleUpdateContent?: (silent?: boolean, overrideContent?: any) => void;
  setContent?: (content: any) => void;
  handleAddItem?: () => void;
  handleEditItem?: (item: any, index: number) => void;
  handleDeleteItem?: (id: number) => void;
}

const CATEGORY_OPTIONS_BOUTIQUE = ['فساتين', 'حقائب', 'إكسسوارات', 'أحذية', 'ملابس رسمية', 'عباءات فاخرة', 'مجموعة 2026', 'أزياء راقية'];
const SIZE_OPTIONS_BOUTIQUE = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];
const INVENTORY_OPTIONS_BOUTIQUE = ['متوفر', 'قطعة أخيرة', 'نفد من المخزون'];

export default function FashionBoutiqueManager({
  content,
  tenant,
  templateId = 13,
  handleUpdateContent,
  setContent,
  handleAddItem,
  handleEditItem,
  handleDeleteItem
}: FashionBoutiqueManagerProps) {
  const isElectronics = false;
  const CATEGORY_OPTIONS = CATEGORY_OPTIONS_BOUTIQUE;
  const SIZE_OPTIONS = SIZE_OPTIONS_BOUTIQUE;

  const items = Array.isArray(content?.items) && content.items.length > 0
    ? content.items 
    : (Array.isArray(content?.products) ? content.products : []);
  const pendingOrdersCount = content?.orders?.filter((o: any) => o.status === 'pending').length || 0;
  const outOfStockProducts = items.filter((i: any) => !i.isUnlimitedStock && Number(i.stock) <= 0).length;
  const lowStockProducts = items.filter((i: any) => !i.isUnlimitedStock && Number(i.stock) > 0 && Number(i.stock) <= 5).length;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ index: number; id?: number; title: string } | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    category: 'فساتين',
    price: '',
    originalPrice: '',
    stock: 20,
    isUnlimitedStock: false,
    sizes: ['S', 'M', 'L'] as string[],
    sizeStocks: {} as Record<string, number>,
    sizeDetails: {} as Record<string, string>,
    customSizeInput: '',
    colors: 'أسود، بيج، أبيض',
    colorStocks: {} as Record<string, number>,
    colorImages: {} as Record<string, string>,
    inventoryStatus: 'متوفر',
    description: '',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [adminProductPage, setAdminProductPage] = useState(1);
  const adminPageSize = 6;

  // 🏷️ Promo Code & Shipping state
  const promoCodes = Array.isArray(content?.promoCodes) ? content.promoCodes : [];
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDiscount, setNewCodeDiscount] = useState('');
  const [shippingFeeInput, setShippingFeeInput] = useState<string>(content?.shippingFee !== undefined ? String(content.shippingFee) : '15');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

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
    if (setContent) setContent(newContent);
    else if (content) content.promoCodes = updatedCodes;
    if (handleUpdateContent) handleUpdateContent(false, newContent);

    setNewCodeName('');
    setNewCodeDiscount('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleDeletePromoCode = (codeId: string) => {
    const updatedCodes = promoCodes.filter((c: any) => c.id !== codeId && c.code !== codeId);
    const newContent = { ...content, promoCodes: updatedCodes };
    if (setContent) setContent(newContent);
    else if (content) content.promoCodes = updatedCodes;
    if (handleUpdateContent) handleUpdateContent(false, newContent);
  };

  const handleSaveShippingFee = () => {
    const feeNum = Number(shippingFeeInput) || 0;
    const newContent = { ...content, shippingFee: feeNum };
    if (setContent) setContent(newContent);
    else if (content) content.shippingFee = feeNum;
    if (handleUpdateContent) handleUpdateContent(false, newContent);

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const filteredItems = items.filter((item: any) => {
    const titleMatch = (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = selectedCategory === 'الكل' || item.category === selectedCategory;
    return titleMatch && catMatch;
  });

  const totalAdminPages = Math.max(1, Math.ceil(filteredItems.length / adminPageSize));
  const currentAdminPage = Math.min(adminProductPage, totalAdminPages);
  const paginatedAdminItems = filteredItems.slice((currentAdminPage - 1) * adminPageSize, currentAdminPage * adminPageSize);

  const openAddModal = () => {
    if (handleAddItem && false) { // preferred internal modal for rich tailored fashion form
      handleAddItem();
      return;
    }
    setEditingIndex(null);
    setFormError(null);
    setFormState({
      title: '',
      category: 'فساتين',
      price: '35 JOD',
      originalPrice: '50 JOD',
      stock: 30,
      isUnlimitedStock: false,
      sizes: ['S', 'M', 'L'],
      sizeStocks: { S: 10, M: 10, L: 10 },
      sizeDetails: { S: 'مناسب لوزن 45-55 كغم', M: 'مناسب لوزن 55-65 كغم', L: 'مناسب لوزن 65-75 كغم' },
      customSizeInput: '',
      colors: 'أسود، بيج، أبيض',
      colorStocks: { 'أسود': 10, 'بيج': 10, 'أبيض': 10 },
      colorImages: {},
      inventoryStatus: 'متوفر',
      description: 'قطعة أنيقة مصنوعة من أجود الأقمشة الفاخرة لتناسب أسلوبك العالي.',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, idx: number) => {
    setEditingIndex(idx);
    setFormError(null);
    const parsedColorImages = typeof item.colorImages === 'string' 
      ? JSON.parse(item.colorImages || '{}') 
      : (item.colorImages || {});
    const rawSizeStocks = item.sizeStocks;
    const parsedSizeStocks = typeof rawSizeStocks === 'string'
      ? JSON.parse(rawSizeStocks || '{}')
      : (rawSizeStocks || {});
    const rawSizeDetails = item.sizeDetails;
    const parsedSizeDetails = typeof rawSizeDetails === 'string'
      ? JSON.parse(rawSizeDetails || '{}')
      : (rawSizeDetails || {});
    const parsedColorStocks = typeof item.colorStocks === 'string'
      ? JSON.parse(item.colorStocks || '{}')
      : (item.colorStocks || {});

    const isUnlimited = !!(item.isUnlimitedStock || item.unlimitedStock || Number(item.stock) >= 999999);

    setFormState({
      title: item.title || item.name || '',
      category: item.category || 'فساتين',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      stock: isUnlimited ? 999999 : (item.stock !== undefined ? Number(item.stock) : 20),
      isUnlimitedStock: isUnlimited,
      sizes: Array.isArray(item.sizes) ? item.sizes : (item.size ? [item.size] : ['S', 'M', 'L']),
      sizeStocks: parsedSizeStocks,
      sizeDetails: parsedSizeDetails,
      customSizeInput: '',
      colors: typeof item.colors === 'string' ? item.colors : (Array.isArray(item.colors) ? item.colors.join('، ') : 'أسود، بيج'),
      colorStocks: parsedColorStocks,
      colorImages: parsedColorImages,
      inventoryStatus: item.inventoryStatus || item.status || 'متوفر',
      description: item.description || '',
      image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const handleTotalStockChange = (newTotal: number) => {
    const stockNum = Math.max(0, newTotal);
    setFormError(null);
    setFormState(prev => ({
      ...prev,
      stock: stockNum
    }));
  };

  const handleSmartDistributeStock = (overrideTotal?: number) => {
    setFormError(null);
    setFormState(prev => {
      const total = overrideTotal !== undefined ? overrideTotal : Number(prev.stock) || 0;
      const newSizeStocks: Record<string, number> = { ...prev.sizeStocks };
      
      if (prev.sizes.length > 0) {
        const perSizeBase = Math.floor(total / prev.sizes.length);
        let rem = total % prev.sizes.length;
        prev.sizes.forEach(sz => {
          newSizeStocks[sz] = perSizeBase + (rem > 0 ? 1 : 0);
          if (rem > 0) rem--;
        });
      }

      const activeCols = prev.colors.split(/[,،]/).map(c => c.trim()).filter(Boolean);
      const newColorStocks: Record<string, number> = { ...prev.colorStocks };
      if (activeCols.length > 0) {
        const perColBase = Math.floor(total / activeCols.length);
        let remC = total % activeCols.length;
        activeCols.forEach(col => {
          newColorStocks[col] = perColBase + (remC > 0 ? 1 : 0);
          if (remC > 0) remC--;
        });
      }

      return {
        ...prev,
        stock: total,
        sizeStocks: newSizeStocks,
        colorStocks: newColorStocks
      };
    });
  };

  const handleToggleSize = (size: string) => {
    setFormError(null);
    setFormState(prev => {
      const exists = prev.sizes.includes(size);
      const newSizes = exists ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size];
      const newSizeStocks = { ...prev.sizeStocks };
      if (!exists && newSizeStocks[size] === undefined) {
        newSizeStocks[size] = 0;
      } else if (exists) {
        delete newSizeStocks[size];
      }
      return { ...prev, sizes: newSizes, sizeStocks: newSizeStocks };
    });
  };

  const handleAddCustomSize = () => {
    const val = formState.customSizeInput.trim();
    if (!val) return;
    if (!formState.sizes.includes(val)) {
      setFormState(prev => ({
        ...prev,
        sizes: [...prev.sizes, val],
        sizeStocks: { ...prev.sizeStocks, [val]: 0 },
        customSizeInput: ''
      }));
    } else {
      setFormState(prev => ({ ...prev, customSizeInput: '' }));
    }
  };

  const handleSizeStockChange = (size: string, val: number) => {
    setFormError(null);
    setFormState(prev => ({
      ...prev,
      sizeStocks: {
        ...prev.sizeStocks,
        [size]: Math.max(0, val)
      }
    }));
  };

  const handleSizeDetailChange = (size: string, detailText: string) => {
    setFormState(prev => ({
      ...prev,
      sizeDetails: {
        ...prev.sizeDetails,
        [size]: detailText
      }
    }));
  };

  const handleColorStockChange = (color: string, val: number) => {
    setFormError(null);
    setFormState(prev => ({
      ...prev,
      colorStocks: {
        ...prev.colorStocks,
        [color]: Math.max(0, val)
      }
    }));
  };

  const handleColorImageUpload = (color: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormState(prev => ({
          ...prev,
          colorImages: {
            ...prev.colorImages,
            [color]: result
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title) return;

    const stockNum = Number(formState.stock) || 0;
    const activeColors = formState.colors.split(/[,،]/).map(c => c.trim()).filter(Boolean);

    // Calculate sum of sizeStocks
    const cleanSizeStocks: Record<string, number> = {};
    let sizeSum = 0;
    for (const sz of formState.sizes) {
      const qty = Number(formState.sizeStocks[sz]) || 0;
      cleanSizeStocks[sz] = qty;
      sizeSum += qty;
    }

    // Calculate sum of colorStocks
    const cleanColorStocks: Record<string, number> = {};
    let colorSum = 0;
    for (const col of activeColors) {
      const qty = Number(formState.colorStocks[col]) || 0;
      cleanColorStocks[col] = qty;
      colorSum += qty;
    }

    // Clean colorImages
    const cleanColorImages: Record<string, string> = {};
    for (const key of Object.keys(formState.colorImages || {})) {
      if (formState.colorImages[key]) {
        cleanColorImages[key] = formState.colorImages[key];
      }
    }

    // Clean sizeDetails
    const cleanSizeDetails: Record<string, string> = {};
    for (const sz of formState.sizes) {
      if (formState.sizeDetails[sz]) {
        cleanSizeDetails[sz] = formState.sizeDetails[sz];
      }
    }

    // Validation checks (only if not unlimited stock)
    if (!formState.isUnlimitedStock) {
      if (sizeSum > stockNum) {
        setFormError(`مجموع كميات ${isElectronics ? 'السعات' : 'المقاسات'} (${sizeSum}) يتجاوز إجمالي المخزون المتاح (${stockNum}). يمكنك النقر على 'توزيع ذكي للمخزون' لتوزيعها تلقائياً.`);
        return;
      }

      if (colorSum > stockNum) {
        setFormError(`مجموع كميات الألوان (${colorSum}) يتجاوز إجمالي المخزون المتاح (${stockNum}). يمكنك النقر على 'توزيع ذكي للمخزون' لتوزيعها تلقائياً.`);
        return;
      }
    }

    setFormError(null);

    let computedStatus = formState.inventoryStatus;
    if (formState.isUnlimitedStock) {
      computedStatus = 'متوفر';
    } else if (stockNum <= 0) {
      computedStatus = 'نفد من المخزون';
    } else if (computedStatus === 'نفد من المخزون' && stockNum > 0) {
      computedStatus = 'متوفر';
    }

    const origPriceVal = formState.originalPrice ? String(formState.originalPrice).trim() : '';

    const firstColor = activeColors.length > 0 ? activeColors[0] : null;
    const computedImage = firstColor && cleanColorImages[firstColor] 
      ? cleanColorImages[firstColor] 
      : (formState.image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800');

    const newItemData: any = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      title: formState.title,
      name: formState.title,
      category: formState.category,
      price: formState.price,
      originalPrice: origPriceVal,
      original_price: origPriceVal,
      priceBeforeDiscount: origPriceVal,
      stock: formState.isUnlimitedStock ? 999999 : stockNum,
      isUnlimitedStock: formState.isUnlimitedStock,
      unlimitedStock: formState.isUnlimitedStock,
      sizes: formState.sizes,
      sizeStocks: cleanSizeStocks,
      sizeDetails: cleanSizeDetails,
      colors: activeColors,
      colorStocks: cleanColorStocks,
      colorImages: cleanColorImages,
      inventoryStatus: computedStatus,
      description: formState.description,
      image: computedImage,
      primaryImage: computedImage
    };
    
    if (isElectronics) {
      newItemData.storageOptions = formState.sizes;
      newItemData.storageStocks = cleanSizeStocks;
      newItemData.storageDetails = cleanSizeDetails;
    }

    const updatedItems = [...items];
    if (editingIndex !== null) {
      updatedItems[editingIndex] = newItemData;
    } else {
      updatedItems.unshift(newItemData);
    }

    const newContent = { ...content, items: updatedItems, products: updatedItems };
    if (setContent) {
      setContent(newContent);
    } else if (content) {
      content.items = updatedItems;
      content.products = updatedItems;
    }

    if (handleUpdateContent) {
      handleUpdateContent(false, newContent);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (index: number, itemId?: number) => {
    const item = items[index];
    const itemTitle = item?.title || item?.name || (isElectronics ? 'هذا المنتج' : 'هذه القطعة');
    setItemToDelete({ index, id: itemId || item?.id, title: itemTitle });
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const { index, id } = itemToDelete;

    if (handleDeleteItem && id) {
      handleDeleteItem(id);
      setItemToDelete(null);
      return;
    }

    const updatedItems = items.filter((_: any, i: number) => i !== index);
    const newContent = { ...content, items: updatedItems, products: updatedItems };
    if (setContent) {
      setContent(newContent);
    } else if (content) {
      content.items = updatedItems;
      content.products = updatedItems;
    }

    if (handleUpdateContent) {
      handleUpdateContent(false, newContent);
    }

    setItemToDelete(null);
  };

  return (
    <div className="space-y-8 font-sans dir-rtl text-right" dir="rtl">
      {/* 📊 بطاقات الإحصائيات الخاصة بالبوتيك */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:border-slate-400">
          <div>
            <p className="text-xs font-bold text-slate-500">{isElectronics ? 'إجمالي الأجهزة المعروضة' : 'إجمالي القطع المعروضة'}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{items.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Shirt size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:border-slate-400">
          <div>
            <p className="text-xs font-bold text-slate-500">الطلبات الجديدة</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingOrdersCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:border-slate-400">
          <div>
            <p className="text-xs font-bold text-slate-500">العروض والخصومات</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <span>نشط</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Tag size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:border-slate-400">
          <div>
            <p className="text-xs font-bold text-slate-500">{isElectronics ? 'الأجهزة الأحدث (New In)' : 'القطع الحصرية (New In)'}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">محدث ✨</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* 🏷️ قسم أكواد الخصم وتكلفة الشحن */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قسم أكواد الخصم */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Tag size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">قسم أكواد الخصم (Promo Codes)</h3>
                <p className="text-xs text-slate-500 font-medium">أضف كود خصم وحدد نسبة الخصم للعملاء عند إتمام الطلب</p>
              </div>
            </div>
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                ✓ تم الحفظ بنجاح
              </span>
            )}
          </div>

          <form onSubmit={handleAddPromoCode} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">كود الخصم (رمز الكوبون)</label>
              <input
                type="text"
                required
                value={newCodeName}
                onChange={e => setNewCodeName(e.target.value)}
                placeholder="مثال: SALE20"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-900 outline-none focus:border-black"
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
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none pl-8 focus:border-black"
                />
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              <span>إضافة كود الخصم</span>
            </button>
          </form>

          {/* قائمة الأكواد الحالية */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 mb-2">الأكواد المتاحة للعملاء:</h4>
            {promoCodes.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                لا توجد أكواد خصم حالية. قم بإنشاء أول كود خصم لعملائك!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {promoCodes.map((pc: any) => (
                  <div key={pc.id || pc.code} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-xs text-black bg-white border border-slate-300 px-3 py-1 rounded-lg shadow-xs">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b pb-4 border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Truck size={18} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">تكلفة الشحن (Shipping Fee)</h3>
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-black"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">سيتم إضافة هذا المبلغ تلقائياً لطلب العميل في السلة.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveShippingFee}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save size={15} />
            <span>حفظ قيمة الشحن</span>
          </button>
        </div>
      </div>

      {/* شريط الإدارة والبحث */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>{isElectronics ? 'إدارة كتالوج المنتجات الإلكترونية' : 'إدارة مجموعة الأزياء والبوتيك'}</span>
            <span className="text-[10px] bg-slate-900 text-white px-2.5 py-0.5 rounded-full font-bold">{isElectronics ? 'Smart Tech' : 'Chic & Minimalist'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">{isElectronics ? 'إضافة أجهزة جديدة، تحديد السعات والألوان، وإدارة المخزون بدقة.' : 'إضافة قطع جديدة، تحديد المقاسات والألوان، وإدارة المخزون بأناقة.'}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="relative bg-slate-100 hover:bg-slate-200 text-slate-800 p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
            title="تنبيهات المخزون والطلبات"
          >
            <Bell size={18} />
            {(outOfStockProducts > 0 || lowStockProducts > 0 || pendingOrdersCount > 0) && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {outOfStockProducts + lowStockProducts + pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={openAddModal}
            className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>{isElectronics ? 'إضافة جهاز جديد' : 'إضافة قطعة جديدة'}</span>
          </button>
        </div>
      </div>

      {/* البحث والتصنيفات */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isElectronics ? 'بحث باسم المنتج أو المواصفات...' : 'بحث باسم القطعة أو المواصفات...'}
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('الكل')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'الكل' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل
          </button>
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* جدول عرض القطع */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>{isElectronics ? 'الأجهزة المسجلة' : 'القطع المسجلة'} ({filteredItems.length})</span>
          <span className="text-[11px] text-slate-400">طراز كلاسيكي راقي</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <Shirt size={32} className="text-slate-300" />
            <p>{isElectronics ? 'لا توجد منتجات مضافة هنا حتى الآن.' : 'لا توجد قطع أزياء مضافة هنا حتى الآن.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedAdminItems.map((item: any, idx: number) => {
              const realIndex = items.findIndex((it: any) => (it.id && item.id && it.id === item.id) || it === item);
              const targetIdx = realIndex >= 0 ? realIndex : idx;

              return (
                <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-4">
                    {item.image || item.imageUrl ? (
                      <img
                        src={item.image || item.imageUrl}
                        alt={item.title || item.name}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] shrink-0 border border-slate-200">
                        صورة
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{item.title || item.name}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                          {item.category || (isElectronics ? 'منتج' : 'أزياء')}
                        </span>
                        {item.inventoryStatus && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.inventoryStatus === 'متوفر'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.inventoryStatus === 'قطعة أخيرة'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.inventoryStatus}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pt-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-lg font-black border border-indigo-100">
                            📦 المتبقي الإجمالي: {item.isUnlimitedStock ? '∞ (لا نهائي)' : `${item.stock ?? 20} قطعة`}
                          </span>
                          <span>{isElectronics ? 'السعات:' : 'المقاسات:'} <strong className="text-slate-800 font-bold">{Array.isArray(item.sizes || item.storageOptions) ? (item.sizes || item.storageOptions).join(', ') : (item.sizes || item.storageOptions || 'S, M, L')}</strong></span>
                          {item.colors && <span>الألوان: <strong className="text-slate-800 font-bold">{typeof item.colors === 'string' ? item.colors : item.colors.join('، ')}</strong></span>}
                        </div>

                        {/* Detailed stock breakdown per size/capacity and color */}
                        {(item.sizeStocks || item.storageStocks || item.colorStocks) && (
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-2 pt-1">
                            {(item.sizeStocks || item.storageStocks) && Object.keys(item.sizeStocks || item.storageStocks).length > 0 && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <strong className="text-slate-800 font-bold">{isElectronics ? 'السعات المتبقية:' : 'المقاسات المتبقية:'}</strong>{' '}
                                {Object.entries(item.sizeStocks || item.storageStocks).map(([sz, st]: [string, any]) => `${sz}: (${st} متبقي)`).join(' | ')}
                              </span>
                            )}
                            {item.colorStocks && Object.keys(item.colorStocks).length > 0 && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                <strong className="text-slate-800 font-bold">الألوان المتبقية:</strong>{' '}
                                {Object.entries(item.colorStocks).map(([col, st]: [string, any]) => `${col}: (${st} متبقي)`).join(' | ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="font-black text-slate-900 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      {item.price || 'حسب الطلب'}
                    </span>

                    <div className="flex items-center gap-1 border-r border-slate-200 pr-3 mr-1">
                      <button
                        onClick={() => openEditModal(item, targetIdx)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(targetIdx, item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 📄 شريط التنقل بين صفحات جدول المنتجات */}
        {totalAdminPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              <span>عرض الصفحة</span>
              <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-md">{currentAdminPage}</span>
              <span>من أصل {totalAdminPages} صفحات (إجمالي {filteredItems.length} {isElectronics ? 'منتج' : 'قطعة'})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentAdminPage === 1}
                onClick={() => setAdminProductPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                ← الصفحة السابقة
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAdminProductPage(p)}
                    className={`w-7 h-7 rounded-lg font-black transition-colors ${
                      p === currentAdminPage 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentAdminPage === totalAdminPages}
                onClick={() => setAdminProductPage(p => Math.min(totalAdminPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                الصفحة التالية →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 👗/📱 Tailored Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Shirt size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {editingIndex !== null ? (isElectronics ? 'تعديل المنتج' : 'تعديل قطعة الأزياء') : (isElectronics ? 'إضافة منتج إلكتروني جديد' : 'إضافة قطعة أزياء جديدة للبوتيك')}
                  </h3>
                  <p className="text-[11px] text-slate-500">{isElectronics ? 'حدد السعات والألوان والمخزون بدقة' : 'حدد المقاسات والألوان والمخزون بعناية فائقة'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Piece Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">{isElectronics ? 'اسم الجهاز / المنتج *' : 'اسم القطعة / المنتج *'}</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={e => setFormState({ ...formState, title: e.target.value })}
                  placeholder={isElectronics ? "مثال: آيفون 16 برو ماكس" : "مثال: Classic Silk Blouse أو فستان حرير فاخر"}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
                />
              </div>

              {/* Price, Original Price, and Total Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">السعر بعد الخصم *</label>
                  <input
                    type="text"
                    required
                    value={formState.price}
                    onChange={e => setFormState({ ...formState, price: e.target.value })}
                    placeholder="مثال: 35 JOD"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="text"
                    value={formState.originalPrice}
                    onChange={e => setFormState({ ...formState, originalPrice: e.target.value })}
                    placeholder="مثال: 50 JOD"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-slate-900 text-slate-500 line-through"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700">إجمالي المخزون *</label>
                    <button
                      type="button"
                      onClick={() => handleSmartDistributeStock()}
                      className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      title={isElectronics ? "توزيع الكمية الكلية بالتساوي على كافة السعات والألوان" : "توزيع الكمية الكلية بالتساوي على كافة المقاسات والألوان"}
                    >
                      <span>⚡ توزيع ذكي للمخزون</span>
                    </button>
                  </div>

                  <input
                    type="number"
                    min="0"
                    disabled={formState.isUnlimitedStock}
                    required={!formState.isUnlimitedStock}
                    value={formState.isUnlimitedStock ? '' : formState.stock}
                    onChange={e => {
                      const newVal = parseInt(e.target.value) || 0;
                      handleTotalStockChange(newVal);
                      handleSmartDistributeStock(newVal);
                    }}
                    placeholder={formState.isUnlimitedStock ? 'غير محدود (∞)' : 'مثال: 30'}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold outline-none focus:border-slate-900 ${
                      formState.isUnlimitedStock ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'border-slate-200 text-slate-900'
                    }`}
                  />

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formState.isUnlimitedStock}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFormState(prev => ({
                          ...prev,
                          isUnlimitedStock: checked,
                          stock: checked ? 999999 : 30
                        }));
                        if (!checked) {
                          handleSmartDistributeStock(30);
                        }
                      }}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">كمية لا نهائية من المخزون (∞)</span>
                  </label>
                </div>
              </div>

              {/* Category & Inventory Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">الفئة (Category)</label>
                  <select
                    value={formState.category}
                    onChange={e => setFormState({ ...formState, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900 bg-white"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">حالة المخزون (Inventory)</label>
                  <select
                    disabled={formState.isUnlimitedStock}
                    value={formState.isUnlimitedStock ? 'متوفر' : formState.inventoryStatus}
                    onChange={e => setFormState({ ...formState, inventoryStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900 bg-white disabled:bg-slate-100"
                  >
                    {INVENTORY_OPTIONS_BOUTIQUE.map(inv => (
                      <option key={inv} value={inv}>{inv}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sizes Selection, Custom Sizes, Stock & Details per Size */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">{isElectronics ? 'السعات التخزينية (Storage Options)' : 'المقاسات وتفاصيل النمرة (Sizes & Details)'}</label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {formState.isUnlimitedStock 
                      ? 'مخزون لا نهائي (∞)' 
                      : `موزع: ${Object.values(formState.sizeStocks || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0)} من ${formState.stock}`}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formState.sizes.map(sz => (
                    <div
                      key={sz}
                      className="px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 bg-slate-900 text-white shadow-xs"
                    >
                      <span>{sz}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className="text-white hover:text-rose-400 bg-white/20 hover:bg-white/30 rounded-full w-5 h-5 flex items-center justify-center transition-colors cursor-pointer"
                        title={isElectronics ? 'حذف السعة' : 'حذف المقاس'}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {SIZE_OPTIONS.filter(sz => !formState.sizes.includes(sz)).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 font-bold">{isElectronics ? 'سعات مقترحة:' : 'مقاسات مقترحة:'}</span>
                    {SIZE_OPTIONS.filter(sz => !formState.sizes.includes(sz)).map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors"
                      >
                        + {sz}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom Size Addition */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={formState.customSizeInput}
                    onChange={e => setFormState({ ...formState, customSizeInput: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                    placeholder={isElectronics ? "إضافة سعة خاصة (مثال: 2TB)" : "إضافة مقاس خاص (مثال: 38، 40، 42، XXL)"}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 cursor-pointer shrink-0"
                  >
                    {isElectronics ? '+ إضافة سعة' : '+ إضافة مقاس'}
                  </button>
                </div>

                {/* Per size stock & details inputs */}
                {formState.sizes.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                    <p className="text-[11px] font-bold text-slate-700">{isElectronics ? 'كميات وتفاصيل كل سعة (تظهر للعميل عند اختيار السعة):' : 'كميات وتفاصيل كل مقاس (تظهر للزبون عند اختيار النمرة):'}</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {formState.sizes.map(sz => (
                        <div key={sz} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">{sz}</span>
                            
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 font-bold">الكمية:</span>
                              <input
                                type="number"
                                min="0"
                                disabled={formState.isUnlimitedStock}
                                value={formState.isUnlimitedStock ? '999' : (formState.sizeStocks[sz] !== undefined ? formState.sizeStocks[sz] : '')}
                                onChange={e => handleSizeStockChange(sz, parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="w-16 text-center py-1 px-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-slate-900 bg-slate-50 disabled:bg-indigo-50 disabled:text-indigo-900"
                              />
                            </div>
                          </div>

                          <input
                            type="text"
                            value={formState.sizeDetails[sz] || ''}
                            onChange={e => handleSizeDetailChange(sz, e.target.value)}
                            placeholder={isElectronics ? `مواصفات السعة ${sz} (مثال: ذاكرة عشوائية 8 جيجابايت)` : `تفاصيل ملاءمة المقاس ${sz} (مثال: مناسب لوزن 50-60 كغم / طول 160 سم)`}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-slate-50 focus:bg-white outline-none focus:border-slate-900 text-slate-800 placeholder:text-slate-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Available Colors & Quantity & Color Images */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">الألوان المتوفرة (افصل بينها بفارزة)</label>
                  <input
                    type="text"
                    value={formState.colors}
                    onChange={e => setFormState({ ...formState, colors: e.target.value })}
                    placeholder="مثال: أسود، بيج، أبيض"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900 bg-white"
                  />
                </div>

                {/* Colors Stock & Image Upload per Color */}
                {formState.colors && (
                  <div className="space-y-3 pt-3 border-t border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">كميات الألوان وصور المعرض لكل لون:</p>
                      <span className="text-[10px] text-slate-500 font-medium">يمكنك اختيار صورة من معرض المنصة أو إرفاق ملف من جهازك</span>
                    </div>

                    <div className="space-y-3">
                      {formState.colors.split(/[,،]/).map(c => c.trim()).filter(Boolean).map(color => {
                        const colorImg = formState.colorImages[color];
                        return (
                          <div key={color} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {colorImg ? (
                                  <div className="relative group/colorimg">
                                    <img src={colorImg} alt={color} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormState(prev => {
                                          const newImgs = { ...prev.colorImages };
                                          delete newImgs[color];
                                          return { ...prev, colorImages: newImgs };
                                        });
                                      }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-700 cursor-pointer"
                                      title="حذف صورة اللون"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0 border border-dashed border-slate-300">
                                    بدون صورة
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs font-black text-slate-900 block">{color}</span>
                                  {colorImg && <span className="text-[10px] text-emerald-600 font-bold">تم تخصيص صورة ✓</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-bold">الكمية:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={formState.stock}
                                  value={formState.colorStocks[color] !== undefined ? formState.colorStocks[color] : ''}
                                  onChange={e => handleColorStockChange(color, parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-16 text-center py-1.5 px-1 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-slate-900 bg-slate-50"
                                />
                              </div>
                            </div>

                            {/* Color Image Selection Controls */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setColorPickerTarget(color)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                              >
                                <Sparkles size={13} />
                                <span>معرض الصور / Unsplash</span>
                              </button>

                              <label className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all">
                                <Upload size={13} />
                                <span>رفع من المعرض/الجهاز</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleColorImageUpload(color, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>

                              <div className="flex-1 min-w-[160px]">
                                <input
                                  type="url"
                                  value={colorImg || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setFormState(prev => ({
                                      ...prev,
                                      colorImages: {
                                        ...prev.colorImages,
                                        [color]: val
                                      }
                                    }));
                                  }}
                                  placeholder="أو ضع رابط صورة للون هنا..."
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-[11px] bg-slate-50 font-mono outline-none focus:border-slate-900"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Image Picker Modal Target */}
              {colorPickerTarget && (
                <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl w-full max-w-2xl p-5 shadow-2xl relative space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">اختيار صورة للون: <span className="text-amber-600">{colorPickerTarget}</span></h3>
                        <p className="text-[11px] text-slate-500">اختر من الصور الجاهزة أو اربط رابط صورة مخصص لهذا اللون</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setColorPickerTarget(null)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <ImageGalleryPicker
                      currentImage={formState.colorImages[colorPickerTarget]}
                      onSelectImage={url => {
                        setFormState(prev => ({
                          ...prev,
                          colorImages: {
                            ...prev.colorImages,
                            [colorPickerTarget]: url
                          }
                        }));
                        setColorPickerTarget(null);
                      }}
                    />

                    <div className="flex justify-end pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setColorPickerTarget(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">الوصف والمواصفات</label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={e => setFormState({ ...formState, description: e.target.value })}
                  placeholder="اكتب مواصفات الخامة والتصميم..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-slate-900 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  {isElectronics ? 'حفظ الجهاز' : 'حفظ القطعة'}
                </button>
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
                  <p className="text-xs font-semibold text-slate-500">{isElectronics ? 'إشعار المنصة' : 'إشعار منصة البوتيك'}</p>
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
                {isElectronics ? 'هل أنت متأكد من رغبتك في حذف الجهاز التالي؟' : 'هل أنت متأكد من رغبتك في حذف القطعة التالية؟'}
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

      {/* NOTIFICATIONS CENTER MODAL */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-right relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black">
                  🔔
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">مركز التنبيهات والإشعارات الفورية</h3>
                  <p className="text-slate-400 text-xs">تنبيهات نفاذ المخزون والطلبات الواردة من العملاء</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Stock Alerts Section */}
              <div>
                <h4 className="text-xs font-black text-slate-800 mb-2.5 flex items-center gap-1.5">
                  <span>📦 حالة المخزون والمنتجات الحرجة</span>
                  <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px]">
                    {outOfStockProducts + lowStockProducts} منتجات
                  </span>
                </h4>
                
                {outOfStockProducts === 0 && lowStockProducts === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center text-emerald-800 text-xs font-bold">
                    ✨ ممتاز! جميع منتجات المتجر متوفرة وبكميات ممتازة.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {items.filter((i: any) => !i.isUnlimitedStock && Number(i.stock) <= 5).map((prod: any, idx: number) => {
                      const isOut = Number(prod.stock) <= 0;
                      return (
                        <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isOut ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <div className="flex items-center gap-3">
                            <img src={prod.image || prod.primaryImage} alt={prod.title || prod.name} className="w-10 h-10 rounded-xl object-cover border" />
                            <div>
                              <p className="font-black text-xs text-slate-900">{prod.title || prod.name}</p>
                              <p className={`text-[11px] font-bold ${isOut ? 'text-rose-700' : 'text-amber-800'}`}>
                                {isOut ? '🛑 نفد تماماً من المخزون (0 قطع)' : `⚠️ قاربت الكمية على النفاذ (${prod.stock} قطع متبقية)`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setShowNotificationsModal(false); }}
                            className="text-[11px] font-black bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
                          >
                            تحديث المخزون ⚙️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pending Orders Alerts */}
              <div>
                <h4 className="text-xs font-black text-slate-800 mb-2.5 flex items-center gap-1.5">
                  <span>🛍️ طلبات المتجر الحديثة وقيد المراجعة</span>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
                    {content?.orders?.length || 0} طلبات
                  </span>
                </h4>

                {(!content?.orders || content.orders.length === 0) ? (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center text-slate-500 text-xs font-bold">
                    لا توجد طلبات جديدة حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {content.orders.slice(0, 5).map((ord: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-black text-slate-900">طلب رقم #{ord.id?.toString().slice(-6)} - {ord.customer?.name || 'عميل المتجر'}</p>
                          <p className="text-[11px] text-slate-500">{ord.createdAt || 'اليوم'} | الإجمالي: {ord.total}</p>
                        </div>
                        <span className="font-black px-2.5 py-1 rounded-xl text-[11px] bg-emerald-100 text-emerald-800">
                          {ord.status || 'قيد المراجعة'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md"
              >
                إغلاق الإشعارات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
