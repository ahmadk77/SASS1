import React, { useState } from 'react';
import { 
  Smartphone, ShoppingBag, Tag, Plus, Trash2, Edit, Sparkles, Search, X, Check, Eye, Upload, 
  Truck, Percent, Save, Bell, Cpu, Battery, Monitor, LayoutDashboard, Settings, Users, Menu, 
  Paintbrush, ExternalLink, ArrowRight, LogOut, ChevronRight
} from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';

interface ElectronicStoreManagerProps {
  content: any;
  tenant?: any;
  templateId?: number;
  handleUpdateContent?: (silent?: boolean, overrideContent?: any) => void;
  setContent?: (content: any) => void;
  handleAddItem?: () => void;
  handleEditItem?: (item: any, index: number) => void;
  handleDeleteItem?: (id: number) => void;
  renderStaffTab?: () => React.ReactNode;
  renderSettingsTab?: () => React.ReactNode;
  renderOrdersTab?: () => React.ReactNode;
  onOpenSite?: () => void;
  onReturnHome?: () => void;
  onLogout?: () => void;
}

const NavItem = ({ icon, label, isActive, onClick, badge }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className="font-black text-sm">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        isActive ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

const CATEGORY_OPTIONS_ELECTRONICS = [
  'الهواتف الذكية',
  'الحواسيب',
  'الصوتيات',
  'الألعاب',
  'الكاميرات',
  'المنزل الذكي',
  'الساعات الذكية',
  'الأجهزة اللوحية',
  'الملحقات'
];

const STORAGE_OPTIONS_ELECTRONICS = ['128GB', '256GB', '512GB', '1TB', '2TB', 'قياسي'];

export default function ElectronicStoreManager({
  content,
  tenant,
  templateId = 14,
  handleUpdateContent,
  setContent,
  handleAddItem,
  handleEditItem,
  handleDeleteItem,
  renderStaffTab,
  renderSettingsTab,
  renderOrdersTab,
  onOpenSite,
  onReturnHome,
  onLogout
}: ElectronicStoreManagerProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    category: 'الهواتف الذكية',
    price: '',
    originalPrice: '',
    stock: 20,
    isUnlimitedStock: false,
    storageOptions: ['128GB', '256GB', '512GB'] as string[],
    storageStocks: { '128GB': 10, '256GB': 10, '512GB': 5 } as Record<string, number>,
    storageDetails: {} as Record<string, string>,
    customStorageInput: '',
    colors: 'تيتانيوم طبيعي، أسود، فضي',
    colorStocks: { 'تيتانيوم طبيعي': 10, 'أسود': 10, 'فضي': 5 } as Record<string, number>,
    colorImages: {} as Record<string, string>,
    inventoryStatus: 'متوفر',
    description: '',
    cpu: '',
    battery: '',
    screen: '',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800'
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
    setEditingIndex(null);
    setFormError(null);
    setFormState({
      title: '',
      category: 'الهواتف الذكية',
      price: '450 JOD',
      originalPrice: '520 JOD',
      stock: 30,
      isUnlimitedStock: false,
      storageOptions: ['128GB', '256GB', '512GB'],
      storageStocks: { '128GB': 10, '256GB': 10, '512GB': 10 },
      storageDetails: {},
      customStorageInput: '',
      colors: 'تيتانيوم طبيعي، أسود، فضي',
      colorStocks: { 'تيتانيوم طبيعي': 10, 'أسود': 10, 'فضي': 10 },
      colorImages: {},
      inventoryStatus: 'متوفر',
      description: 'جهاز عصري بأحدث التقنيات مع معالج سريع وشاشة عالية الدقة.',
      cpu: 'A18 Pro / M3',
      battery: '4500 mAh طاقة تدوم طوال اليوم',
      screen: 'OLED Super Retina XDR 120Hz',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, idx: number) => {
    setEditingIndex(idx);
    setFormError(null);
    const parsedColorImages = typeof item.colorImages === 'string' 
      ? JSON.parse(item.colorImages || '{}') 
      : (item.colorImages || {});
    const rawStorageStocks = item.storageStocks || item.sizeStocks;
    const parsedStorageStocks = typeof rawStorageStocks === 'string'
      ? JSON.parse(rawStorageStocks || '{}')
      : (rawStorageStocks || {});
    const rawStorageDetails = item.storageDetails || item.sizeDetails;
    const parsedStorageDetails = typeof rawStorageDetails === 'string'
      ? JSON.parse(rawStorageDetails || '{}')
      : (rawStorageDetails || {});
    const parsedColorStocks = typeof item.colorStocks === 'string'
      ? JSON.parse(item.colorStocks || '{}')
      : (item.colorStocks || {});

    const isUnlimited = !!(item.isUnlimitedStock || item.unlimitedStock || Number(item.stock) >= 999999);

    setFormState({
      title: item.title || item.name || '',
      category: item.category || 'الهواتف الذكية',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      stock: isUnlimited ? 999999 : (item.stock !== undefined ? Number(item.stock) : 20),
      isUnlimitedStock: isUnlimited,
      storageOptions: Array.isArray(item.storageOptions || item.sizes) ? (item.storageOptions || item.sizes) : ['128GB', '256GB', '512GB'],
      storageStocks: parsedStorageStocks,
      storageDetails: parsedStorageDetails,
      customStorageInput: '',
      colors: typeof item.colors === 'string' ? item.colors : (Array.isArray(item.colors) ? item.colors.join('، ') : 'تيتانيوم طبيعي، أسود'),
      colorStocks: parsedColorStocks,
      colorImages: parsedColorImages,
      inventoryStatus: item.inventoryStatus || item.status || 'متوفر',
      description: item.description || '',
      cpu: item.specs?.cpu || item.cpu || '',
      battery: item.specs?.battery || item.battery || '',
      screen: item.specs?.screen || item.screen || '',
      image: item.primaryImage || item.image || item.imageUrl || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800'
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      setFormError('يرجى كتابة عنوان المنتج الألكتروني.');
      return;
    }
    if (!formState.price.trim()) {
      setFormError('يرجى تحديد السعر الإلكتروني.');
      return;
    }

    const cleanColorsArray = formState.colors.split(/[,،]/).map(c => c.trim()).filter(Boolean);
    const finalStockNum = formState.isUnlimitedStock ? 999999 : Number(formState.stock || 0);

    const productPayload = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      title: formState.title.trim(),
      name: formState.title.trim(),
      category: formState.category,
      price: formState.price.trim(),
      originalPrice: formState.originalPrice.trim(),
      stock: finalStockNum,
      isUnlimitedStock: formState.isUnlimitedStock,
      unlimitedStock: formState.isUnlimitedStock,
      storageOptions: formState.storageOptions,
      sizes: formState.storageOptions,
      storageStocks: formState.storageStocks,
      sizeStocks: formState.storageStocks,
      storageDetails: formState.storageDetails,
      sizeDetails: formState.storageDetails,
      colors: cleanColorsArray,
      colorStocks: formState.colorStocks,
      colorImages: formState.colorImages,
      inventoryStatus: finalStockNum > 0 || formState.isUnlimitedStock ? 'متوفر' : 'نفد من المخزون',
      description: formState.description.trim(),
      specs: {
        cpu: formState.cpu.trim(),
        battery: formState.battery.trim(),
        screen: formState.screen.trim()
      },
      image: formState.image,
      primaryImage: formState.image,
      images: [formState.image]
    };

    let updatedItems = [...items];
    if (editingIndex !== null) {
      updatedItems[editingIndex] = productPayload;
    } else {
      updatedItems.unshift(productPayload);
    }

    const newContent = { 
      ...content, 
      items: updatedItems,
      products: updatedItems 
    };

    if (setContent) setContent(newContent);
    else if (content) {
      content.items = updatedItems;
      content.products = updatedItems;
    }

    if (handleUpdateContent) handleUpdateContent(false, newContent);
    setIsModalOpen(false);
  };

  const confirmDeleteAction = () => {
    if (!itemToDelete) return;
    const { index, id } = itemToDelete;

    if (handleDeleteItem && id) {
      handleDeleteItem(id);
    }

    const updatedItems = items.filter((_: any, idx: number) => idx !== index);
    const newContent = { ...content, items: updatedItems, products: updatedItems };

    if (setContent) setContent(newContent);
    else if (content) {
      content.items = updatedItems;
      content.products = updatedItems;
    }

    if (handleUpdateContent) handleUpdateContent(false, newContent);
    setItemToDelete(null);
  };

  const toggleStorageOption = (storageVal: string) => {
    const exists = formState.storageOptions.includes(storageVal);
    let newOptions = exists 
      ? formState.storageOptions.filter(s => s !== storageVal)
      : [...formState.storageOptions, storageVal];

    setFormState(prev => ({
      ...prev,
      storageOptions: newOptions
    }));
  };

  const addCustomStorage = () => {
    if (!formState.customStorageInput.trim()) return;
    const val = formState.customStorageInput.trim();
    if (!formState.storageOptions.includes(val)) {
      setFormState(prev => ({
        ...prev,
        storageOptions: [...prev.storageOptions, val],
        customStorageInput: ''
      }));
    }
  };

  const resolvedStoreName = content?.businessName || content?.siteName || content?.storeName || tenant?.name || 'متجر الإلكترونيات';

  return (
    <div dir="rtl" className="space-y-8 font-sans bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
      {/* 📱 Header & Live Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-indigo-600" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">{resolvedStoreName} 📱💻</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            تخصيص الهواتف والحواسيب، السعات التخزينية (GB/TB)، المواصفات التقنية والمخزون الحي
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingOrdersCount > 0 && (
            <button 
              onClick={() => setShowNotificationsModal(true)}
              className="relative p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-bold text-xs flex items-center gap-1.5 border border-indigo-200 transition-all"
            >
              <Bell className="w-4 h-4 text-indigo-600 animate-bounce" />
              <span>{pendingOrdersCount} طلبات جديدة</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة جهاز جديد</span>
          </button>
        </div>
      </div>

      {/* Stock Alert Banner */}
      {(outOfStockProducts > 0 || lowStockProducts > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-200/60 rounded-xl text-amber-800 font-bold">⚠️ تنبيه المخزون</span>
            <span>
              يوجد <strong className="text-amber-900 font-extrabold">{outOfStockProducts}</strong> جهاز نافد من المخزون، و <strong className="text-amber-900 font-extrabold">{lowStockProducts}</strong> أجهزة مخزونها منخفض!
            </span>
          </div>
          <button 
            onClick={() => setSelectedCategory('الكل')}
            className="text-indigo-700 font-bold hover:underline"
          >
            عرض الأجهزة ⚡
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم الجهاز أو المواصفات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('الكل')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'الكل'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            الكل ({items.length})
          </button>
          {CATEGORY_OPTIONS_ELECTRONICS.map((cat) => {
            const count = items.filter((i: any) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {paginatedAdminItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">لا توجد أجهزة إلكترونية مسجلة بهذه الفئة</p>
            <p className="text-xs text-slate-400">انقر على "إضافة جهاز جديد" لإدخال أول أجهزتك الذكية</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedAdminItems.map((item: any, idx: number) => {
              const realIndex = items.indexOf(item);
              const isOut = !item.isUnlimitedStock && Number(item.stock) <= 0;
              const isLow = !item.isUnlimitedStock && Number(item.stock) > 0 && Number(item.stock) <= 5;

              return (
                <div key={item.id || idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <img 
                      src={item.primaryImage || item.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=200'} 
                      alt={item.title || item.name} 
                      className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0" 
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-lg border border-indigo-100">
                          {item.category || 'إلكترونيات'}
                        </span>
                        {item.isUnlimitedStock ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200">
                            مخزون لا نهائي ♾️
                          </span>
                        ) : isOut ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-extrabold rounded-lg border border-rose-200">
                            نفد من المخزون ❌
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200">
                            مخزون منخفض ({item.stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg">
                            المخزون: {item.stock} قطعة
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{item.title || item.name}</h4>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="text-indigo-600 font-black">{item.price} JOD</span>
                        {item.originalPrice && <span className="line-through text-slate-400">{item.originalPrice} JOD</span>}
                        {item.specs?.cpu && <span className="text-slate-400">| {item.specs.cpu}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => openEditModal(item, realIndex)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => setItemToDelete({ index: realIndex, id: item.id, title: item.title || item.name })}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalAdminPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>الصفحة {currentAdminPage} من {totalAdminPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentAdminPage === 1}
                onClick={() => setAdminProductPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-100"
              >
                السابق
              </button>
              <button
                disabled={currentAdminPage === totalAdminPages}
                onClick={() => setAdminProductPage(p => Math.min(totalAdminPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-100"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🎟️ Promo Codes & Shipping Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Promo Codes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-sm text-slate-900">كوبونات الخصم والرموز الترويجية</h3>
          </div>

          <form onSubmit={handleAddPromoCode} className="flex gap-2">
            <input
              type="text"
              placeholder="رمز الكوبون (مثلاً SAVE10)"
              value={newCodeName}
              onChange={e => setNewCodeName(e.target.value)}
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase"
            />
            <input
              type="number"
              placeholder="% الخصم"
              value={newCodeDiscount}
              onChange={e => setNewCodeDiscount(e.target.value)}
              className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all"
            >
              إضافة
            </button>
          </form>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {promoCodes.length === 0 ? (
              <p className="text-xs text-slate-400">لا توجد كوبونات خصم حالياً</p>
            ) : (
              promoCodes.map((code: any) => (
                <div key={code.id || code.code} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="font-mono font-black text-indigo-700">{code.code}</span>
                  <span className="font-bold text-emerald-600">خصم {code.discountPercent}%</span>
                  <button onClick={() => handleDeletePromoCode(code.id || code.code)} className="text-rose-500 hover:text-rose-700 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shipping Fee */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900">رسوم التوصيل والشحن بالأردن</h3>
            </div>
            <p className="text-xs text-slate-500">حدد رسوم التوصيل الافتراضية للطلبات (JOD)</p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                value={shippingFeeInput}
                onChange={e => setShippingFeeInput(e.target.value)}
                className="w-32 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-800"
              />
              <span className="text-xs font-bold text-slate-600">دينار أردني</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccessMsg && <span className="text-xs text-emerald-600 font-bold">تم الحفظ بنجاح! ✓</span>}
            <button
              onClick={handleSaveShippingFee}
              className="mr-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>حفظ رسوم الشحن</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📱 Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900">
                {editingIndex !== null ? 'تعديل الجهاز الألكتروني 📱' : 'إضافة جهاز إلكتروني جديد 📱'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5">اسم الجهاز / الموديل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: آيفون 16 برو ماكس 256GB"
                    value={formState.title}
                    onChange={e => setFormState({ ...formState, title: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5">الفئة *</label>
                  <select
                    value={formState.category}
                    onChange={e => setFormState({ ...formState, category: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {CATEGORY_OPTIONS_ELECTRONICS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5">السعر الحالي (JOD) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 850.00"
                    value={formState.price}
                    onChange={e => setFormState({ ...formState, price: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: 990.00"
                    value={formState.originalPrice}
                    onChange={e => setFormState({ ...formState, originalPrice: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-extrabold mb-1.5">إجمالي المخزون المتاح</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={formState.isUnlimitedStock}
                      value={formState.isUnlimitedStock ? '' : formState.stock}
                      onChange={e => setFormState({ ...formState, stock: Number(e.target.value) })}
                      className="w-full p-3 border border-slate-200 rounded-2xl font-bold text-slate-800 disabled:bg-slate-100"
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isUnlimitedStock}
                      onChange={e => setFormState({ ...formState, isUnlimitedStock: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>مخزون مفتوح غير محدود</span>
                  </label>
                </div>
              </div>

              {/* Storage Options */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-slate-700 font-extrabold">السعات التخزينية المتاحة (Storage Options)</label>
                <div className="flex flex-wrap gap-2">
                  {STORAGE_OPTIONS_ELECTRONICS.map(sVal => {
                    const selected = formState.storageOptions.includes(sVal);
                    return (
                      <button
                        key={sVal}
                        type="button"
                        onClick={() => toggleStorageOption(sVal)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all border ${
                          selected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sVal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tech Specs */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <label className="block text-slate-700 font-extrabold">المواصفات التقنية (Tech Specs)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">المعالج (CPU / Chip)</span>
                    <input
                      type="text"
                      placeholder="مثال: Apple M3 / A18 Pro"
                      value={formState.cpu}
                      onChange={e => setFormState({ ...formState, cpu: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">البطارية (Battery)</span>
                    <input
                      type="text"
                      placeholder="مثال: 4500 mAh شحن سريع"
                      value={formState.battery}
                      onChange={e => setFormState({ ...formState, battery: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">الشاشة (Display)</span>
                    <input
                      type="text"
                      placeholder="مثال: 6.7 إنش OLED 120Hz"
                      value={formState.screen}
                      onChange={e => setFormState({ ...formState, screen: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-slate-700 font-extrabold">الألوان المتاحة (تفصل بينها بفصلات)</label>
                <input
                  type="text"
                  placeholder="مثال: تيتانيوم طبيعي، أسود فلكي، فضي"
                  value={formState.colors}
                  onChange={e => setFormState({ ...formState, colors: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-2xl font-bold text-slate-800"
                />
              </div>

              {/* Image Gallery */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-slate-700 font-extrabold">صورة الجهاز الرئيسية</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={formState.image}
                    onChange={e => setFormState({ ...formState, image: e.target.value })}
                    className="flex-1 p-3 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700"
                  />
                  <img src={formState.image} alt="Preview" className="w-12 h-12 rounded-xl object-cover border" />
                </div>
                <ImageGalleryPicker 
                  currentImage={formState.image} 
                  onSelectImage={(url) => setFormState({ ...formState, image: url })} 
                />
              </div>

              {/* Description */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-slate-700 font-extrabold">وصف الجهاز وتفاصيله</label>
                <textarea
                  rows={3}
                  placeholder="شرح مميزات الجهاز ونظام التشغيل والضمان..."
                  value={formState.description}
                  onChange={e => setFormState({ ...formState, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-2xl font-bold text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  حفظ الجهاز الذكي 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900">تأكيد حذف الجهاز</h3>
            <p className="text-xs text-slate-600 font-medium">
              هل أنت متأكد من رغبتك في حذف جهاز <strong className="text-slate-900 font-extrabold">"{itemToDelete.title}"</strong>؟
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-200"
              >
                نعم، احذف الجهاز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
