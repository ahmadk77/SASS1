import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, ShoppingBag, Sparkles, X, Check, 
  Image as ImageIcon, Tag, Truck, Percent, Save, Droplet, ShieldCheck, 
  Layers, Info, BarChart3, PackageCheck, Clock, UserCheck, Phone, MapPin, 
  Printer, Filter, MessageSquare, AlertCircle, Eye, ArrowUpRight, DollarSign, Bell
} from 'lucide-react';
import ImageGalleryPicker from './ImageGalleryPicker';
import { auth } from '../../../lib/firebase';
import CourierShareModal from '../../CourierShareModal';
import OrdersTab from '../tabs/OrdersTab';

interface ManagerProps {
  content: any;
  tenant: any;
  templateId?: number;
  handleUpdateContent: (silent?: boolean) => void;
  setContent: (content: any) => void;
}

export default function SkincareManager({ content, setContent, templateId, handleUpdateContent, tenant }: ManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'products' | 'orders' | 'categories' | 'promos' | 'settings'>('overview');
  
  // Products Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSkinTypeFilter, setSelectedSkinTypeFilter] = useState('all');

  // Orders Search & Filter
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

  // Modals & Messages
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ index: number; title: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Products array from content
  const items = Array.isArray(content?.items) ? content.items : [];

  // Dedicated Skincare Store Orders List
  const [skincareOrders, setSkincareOrders] = useState<any[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Default Skincare Categories & Skin Types
  const [categoriesList, setCategoriesList] = useState<string[]>(
    content?.skincareCategories || [
      'العناية بالوجه',
      'العناية بالجسم',
      'سيرومات وتغذية',
      'الحماية من الشمس',
      'مقشرات ومنظفات',
      'مجموعات العناية'
    ]
  );
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [skinTypesList, setSkinTypesList] = useState<string[]>(
    content?.skinTypesList || [
      'جميع أنواع البشرة',
      'البشرة الحساسة',
      'البشرة الدهنية والمعرضة للحبوب',
      'البشرة الجافة والمشدودة',
      'البشرة المختلطة'
    ]
  );
  const [newSkinTypeInput, setNewSkinTypeInput] = useState('');

  // Promo Code & Shipping state
  const promoCodes = Array.isArray(content?.promoCodes) ? content.promoCodes : [];
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDiscount, setNewCodeDiscount] = useState('');
  const [shippingFeeInput, setShippingFeeInput] = useState<string>(content?.shippingFee !== undefined ? String(content.shippingFee) : '25');

  // Skincare Store Branding settings
  const [storeName, setStoreName] = useState(content?.businessName || content?.siteName || tenant?.name || 'متجر العناية والجمال');
  const [heroTitle, setHeroTitle] = useState(content?.heroTitle || 'اكتشفي جمالك الطبيعي');
  const [heroSubtitle, setHeroSubtitle] = useState(content?.heroSubtitle || 'أفضل منتجات العناية بالبشرة والجسم بمكونات طبيعية 100% لبشرة مشرقة وصحية.');
  const [heroImage, setHeroImage] = useState(content?.heroImage || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200');
  const [whatsappNumber, setWhatsappNumber] = useState(content?.whatsappNumber || content?.phone || '966500000000');
  const [primaryColor, setPrimaryColor] = useState(content?.primaryColor || '#059669');
  const [shareOrderModal, setShareOrderModal] = useState<any>(null);

  // New Skincare Product Form State
  const [newItemForm, setNewItemForm] = useState<any>({
    title: '',
    category: 'العناية بالوجه',
    skinType: 'جميع أنواع البشرة',
    price: '',
    originalPrice: '',
    stock: 25,
    inventoryStatus: 'متوفر',
    description: '',
    primaryImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800',
    images: [],
    ingredients: ['حمض الهيالورونيك', 'نياسيناميد'],
    ingredientInput: '',
    volume: '50 مل',
    usage: 'يومياً صباحاً ومساءً'
  });

  // Load orders specific to Skincare Store (Template 15 / storeType: 'skincare')
  const loadSkincareOrders = async () => {
    try {
      let serverOrders: any[] = [];
      try {
        const token = await auth.currentUser?.getIdToken();
        const impersonateParam = tenant?.id ? `?impersonateTenantId=${tenant.id}` : '';
        const res = await fetch(`/api/tenant/orders${impersonateParam}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            serverOrders = data.orders.map((o: any) => ({
              ...o,
              date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-SA') : 'اليوم',
              customer: {
                name: o.customerName || o.details?.customerName || o.customer?.name || 'عميل المتجر',
                phone: o.customerPhone || o.details?.customerPhone || o.customer?.phone || '',
                address: o.details?.address || o.customer?.address || ''
              },
              total: o.totalPrice || o.total || o.details?.finalTotal || o.details?.subtotal || '0',
              items: o.items || o.details?.items || []
            }));
          }
        }
      } catch (err) {
        console.warn('Error fetching server skincare orders:', err);
      }

      let localOrders: any[] = [];
      const savedSkincare = localStorage.getItem('skincare_orders');
      if (savedSkincare) {
        const parsed = JSON.parse(savedSkincare);
        if (Array.isArray(parsed)) localOrders = [...parsed];
      }

      const combined = [...serverOrders];
      localOrders.forEach((lo: any) => {
        if (!combined.some(so => String(so.id) === String(lo.id))) {
          combined.push(lo);
        }
      });

      setSkincareOrders(combined);
    } catch (err) {
      console.error('Error loading skincare orders:', err);
    }
  };

  useEffect(() => {
    loadSkincareOrders();

    const handleNewOrder = () => {
      loadSkincareOrders();
    };

    window.addEventListener('SKINCARE_NEW_ORDER', handleNewOrder);
    return () => {
      window.removeEventListener('SKINCARE_NEW_ORDER', handleNewOrder);
    };
  }, [tenant?.subdomain, tenant?.id]);

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string | number, newStatus: string) => {
    const targetOrder = skincareOrders.find((o: any) => String(o.id) === String(orderId));
    const isCompleted = newStatus === 'completed' || newStatus === 'مكتمل' || newStatus === 'تم التسليم';

    if (isCompleted && targetOrder && !targetOrder.stockDeducted && content?.items) {
      const orderItems = targetOrder.items || targetOrder.details?.items || [];
      if (orderItems.length > 0) {
        const updatedProducts = content.items.map((prod: any) => {
          const matchingCartItems = orderItems.filter((ci: any) => String(ci.id || ci.product?.id) === String(prod.id) || ci.title === prod.title || ci.name === prod.title);
          if (matchingCartItems.length === 0) return prod;

          let totalQtyDeducted = 0;
          matchingCartItems.forEach((ci: any) => {
            totalQtyDeducted += (ci.quantity || 1);
          });

          const currentStock = prod.stock !== undefined ? Number(prod.stock) : 25;
          const finalStock = Math.max(0, currentStock - totalQtyDeducted);

          return {
            ...prod,
            stock: finalStock,
            inventoryStatus: finalStock <= 0 ? 'نافد السعة' : (finalStock <= 5 ? 'قطعة أخيرة' : 'متوفر')
          };
        });

        const updatedContent = { ...content, items: updatedProducts };
        await saveContentToBackendAndState(updatedContent);
      }
    }

    const updated = skincareOrders.map(o => String(o.id) === String(orderId) ? { 
      ...o, 
      status: newStatus,
      stockDeducted: isCompleted ? true : o.stockDeducted,
      details: isCompleted ? { ...(o.details || {}), cleared: true } : o.details
    } : o);
    setSkincareOrders(updated);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(`/api/tenant/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            status: newStatus,
            stockDeducted: isCompleted ? true : targetOrder?.stockDeducted,
            details: isCompleted ? { ...(targetOrder?.details || {}), cleared: true } : targetOrder?.details
          })
        });
      }
    } catch (e) {
      console.error('Error updating order status on server:', e);
    }

    try {
      localStorage.setItem('skincare_orders', JSON.stringify(updated));
    } catch (e) {
      console.error('Error updating order status locally:', e);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  // Order Delete & Restore Handlers
  const handleDeleteOrder = async (orderId: string | number) => {
    const updated = skincareOrders.map(o => String(o.id) === String(orderId) ? { ...o, status: 'deleted', deletedAt: new Date().toISOString() } : o);
    setSkincareOrders(updated);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(`/api/tenant/orders/${orderId}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
      }
    } catch (e) {
      console.error('Error soft deleting order on server:', e);
    }

    try {
      localStorage.setItem('skincare_orders', JSON.stringify(updated));
    } catch (e) {
      console.error('Error soft deleting order locally:', e);
    }
  };

  const handlePermanentDeleteOrder = async (orderId: string | number) => {
    const updated = skincareOrders.filter(o => String(o.id) !== String(orderId));
    setSkincareOrders(updated);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(`/api/tenant/orders/${orderId}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
      }
    } catch (e) {
      console.error('Error permanently deleting order on server:', e);
    }

    try {
      localStorage.setItem('skincare_orders', JSON.stringify(updated));
    } catch (e) {
      console.error('Error permanently deleting order locally:', e);
    }
  };

  const handleRestoreOrder = async (orderId: string | number) => {
    const updated = skincareOrders.map(o => String(o.id) === String(orderId) ? { ...o, status: 'pending', deletedAt: null } : o);
    setSkincareOrders(updated);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(`/api/tenant/orders/${orderId}/restore`, {
          method: 'PUT',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
      }
    } catch (e) {
      console.error('Error restoring order on server:', e);
    }

    try {
      localStorage.setItem('skincare_orders', JSON.stringify(updated));
    } catch (e) {
      console.error('Error restoring order locally:', e);
    }
  };

  // Save Content Helper
  const saveContentToBackendAndState = async (updatedContent: any) => {
    setContent(updatedContent);
    
    // Dispatch window event so live preview updates immediately
    window.dispatchEvent(new CustomEvent('UPDATE_TEMPLATE_CONTENT', { detail: updatedContent }));

    try {
      localStorage.setItem(`template_content_15`, JSON.stringify(updatedContent));
      if (tenant?.subdomain) {
        localStorage.setItem(`template_content_15_${tenant?.subdomain}`, JSON.stringify(updatedContent));
      }
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }

    if (handleUpdateContent) {
      handleUpdateContent(true);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Product Actions
  const handleOpenAdd = () => {
    setEditingIndex(null);
    setNewItemForm({
      title: '',
      category: categoriesList[0] || 'العناية بالوجه',
      skinType: skinTypesList[0] || 'جميع أنواع البشرة',
      price: '',
      originalPrice: '',
      stock: 25,
      inventoryStatus: 'متوفر',
      description: '',
      primaryImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800',
      images: [],
      ingredients: ['حمض الهيالورونيك', 'نياسيناميد'],
      ingredientInput: '',
      volume: '50 مل',
      usage: 'يومياً صباحاً ومساءً'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, idx: number) => {
    setEditingIndex(idx);
    setNewItemForm({
      title: item.title || item.name || '',
      category: item.category || 'العناية بالوجه',
      skinType: item.skinType || 'جميع أنواع البشرة',
      price: item.price || '',
      originalPrice: item.originalPrice || '',
      stock: item.stock !== undefined ? item.stock : 25,
      inventoryStatus: item.inventoryStatus || (item.stock > 0 ? 'متوفر' : 'نافد السعة'),
      description: item.description || '',
      primaryImage: item.primaryImage || item.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800',
      images: Array.isArray(item.images) ? item.images : [],
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : (item.ingredients ? [item.ingredients] : []),
      ingredientInput: '',
      volume: item.specs?.['الحجم'] || item.volume || '50 مل',
      usage: item.specs?.['الاستخدام'] || item.usage || 'يومياً'
    });
    setIsModalOpen(true);
  };

  const handleAddIngredientTag = () => {
    if (!newItemForm.ingredientInput?.trim()) return;
    const tag = newItemForm.ingredientInput.trim();
    if (!newItemForm.ingredients.includes(tag)) {
      setNewItemForm({
        ...newItemForm,
        ingredients: [...newItemForm.ingredients, tag],
        ingredientInput: ''
      });
    }
  };

  const handleRemoveIngredientTag = (tagToRemove: string) => {
    setNewItemForm({
      ...newItemForm,
      ingredients: newItemForm.ingredients.filter((t: string) => t !== tagToRemove)
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title.trim() || !newItemForm.price) {
      alert('يرجى ملء اسم المستحضر والسعر على الأقل.');
      return;
    }

    const priceNum = parseFloat(String(newItemForm.price).replace(/[^0-9.]/g, '')) || 0;
    const origPriceNum = newItemForm.originalPrice ? parseFloat(String(newItemForm.originalPrice).replace(/[^0-9.]/g, '')) : null;

    const formattedProduct = {
      id: editingIndex !== null && items[editingIndex]?.id ? items[editingIndex].id : Date.now(),
      title: newItemForm.title.trim(),
      name: newItemForm.title.trim(),
      category: newItemForm.category,
      skinType: newItemForm.skinType,
      price: priceNum,
      originalPrice: origPriceNum,
      stock: Number(newItemForm.stock) || 0,
      inventoryStatus: Number(newItemForm.stock) > 0 ? 'متوفر' : 'نافد السعة',
      description: newItemForm.description,
      primaryImage: newItemForm.primaryImage,
      image: newItemForm.primaryImage,
      images: newItemForm.images,
      ingredients: newItemForm.ingredients,
      specs: {
        'الحجم': newItemForm.volume || '50 مل',
        'الاستخدام': newItemForm.usage || 'يومياً'
      }
    };

    let updatedItems = [...items];
    if (editingIndex !== null) {
      updatedItems[editingIndex] = formattedProduct;
    } else {
      updatedItems = [formattedProduct, ...updatedItems];
    }

    const updatedContent = {
      ...content,
      items: updatedItems,
      products: updatedItems,
      skincareCategories: categoriesList,
      skinTypesList: skinTypesList
    };

    saveContentToBackendAndState(updatedContent);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = () => {
    if (!itemToDelete) return;
    const updatedItems = items.filter((_: any, idx: number) => idx !== itemToDelete.index);
    const updatedContent = {
      ...content,
      items: updatedItems,
      products: updatedItems
    };
    saveContentToBackendAndState(updatedContent);
    setItemToDelete(null);
  };

  // Categories & Skin Types Actions
  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    if (!categoriesList.includes(newCategoryInput.trim())) {
      const updated = [...categoriesList, newCategoryInput.trim()];
      setCategoriesList(updated);
      saveContentToBackendAndState({ ...content, skincareCategories: updated });
      setNewCategoryInput('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const updated = categoriesList.filter(c => c !== cat);
    setCategoriesList(updated);
    saveContentToBackendAndState({ ...content, skincareCategories: updated });
  };

  const handleAddSkinType = () => {
    if (!newSkinTypeInput.trim()) return;
    if (!skinTypesList.includes(newSkinTypeInput.trim())) {
      const updated = [...skinTypesList, newSkinTypeInput.trim()];
      setSkinTypesList(updated);
      saveContentToBackendAndState({ ...content, skinTypesList: updated });
      setNewSkinTypeInput('');
    }
  };

  const handleRemoveSkinType = (type: string) => {
    const updated = skinTypesList.filter(t => t !== type);
    setSkinTypesList(updated);
    saveContentToBackendAndState({ ...content, skinTypesList: updated });
  };

  // Promo Code Actions
  const handleAddPromoCode = () => {
    if (!newCodeName.trim() || !newCodeDiscount) return;
    const newPromo = {
      code: newCodeName.trim().toUpperCase(),
      discountPercent: Number(newCodeDiscount) || 10
    };
    const updatedPromos = [...promoCodes, newPromo];
    saveContentToBackendAndState({ ...content, promoCodes: updatedPromos });
    setNewCodeName('');
    setNewCodeDiscount('');
  };

  const handleRemovePromoCode = (codeStr: string) => {
    const updatedPromos = promoCodes.filter((p: any) => p.code !== codeStr);
    saveContentToBackendAndState({ ...content, promoCodes: updatedPromos });
  };

  const handleSaveShippingAndBranding = () => {
    const updatedContent = {
      ...content,
      businessName: storeName,
      siteName: storeName,
      heroTitle,
      heroSubtitle,
      heroImage,
      whatsappNumber,
      phone: whatsappNumber,
      primaryColor,
      shippingFee: Number(shippingFeeInput) || 25,
      skincareCategories: categoriesList,
      skinTypesList
    };
    saveContentToBackendAndState(updatedContent);
  };

  // Filtering Products
  const filteredItems = items.filter((item: any) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSkin = selectedSkinTypeFilter === 'all' || item.skinType === selectedSkinTypeFilter;
    const name = item.title || item.name || '';
    const desc = item.description || '';
    const ingr = Array.isArray(item.ingredients) ? item.ingredients.join(' ') : (item.ingredients || '');
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ingr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSkin && matchesSearch;
  });

  // Filtering Orders
  const filteredOrders = skincareOrders.filter((order: any) => {
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    const custName = order.customer?.name || '';
    const custPhone = order.customer?.phone || '';
    const orderIdStr = order.id || '';
    const matchesSearch = custName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                          custPhone.includes(orderSearchQuery) ||
                          orderIdStr.toLowerCase().includes(orderSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Overview Analytics Calculations
  const totalProducts = items.length;
  const outOfStockProducts = items.filter((i: any) => Number(i.stock) <= 0).length;
  const lowStockProducts = items.filter((i: any) => Number(i.stock) > 0 && Number(i.stock) <= 5).length;
  const totalOrdersCount = skincareOrders.length;
  const totalSalesRevenue = skincareOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const pendingOrdersCount = skincareOrders.filter(o => o.status === 'قيد المراجعة والتجهيز').length;
  const completedOrdersCount = skincareOrders.filter(o => o.status === 'مكتمل').length;

  return (
    <div className="space-y-6 dir-rtl text-right font-sans">
      
      {/* Main Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-3.5 py-1.5 rounded-full mb-3 backdrop-blur-md">
              <Droplet className="w-4 h-4 animate-pulse text-emerald-300" />
              <span>لوحة التحكم الحصرية لمتجر العناية بالبشرة والجمال</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              {storeName}
            </h1>
            <p className="text-emerald-100/80 text-xs md:text-sm mt-1 max-w-xl">
              إدارة مستحضرات التجميل، استلام الطلبات المخصصة للمتجر، مع متابعة المبيعات والإحصائيات مباشرة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="relative bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center"
              title="تنبيهات المخزون والطلبات"
            >
              <Bell className="w-5 h-5" />
              {(outOfStockProducts > 0 || lowStockProducts > 0 || pendingOrdersCount > 0) && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-950 animate-bounce">
                  {outOfStockProducts + lowStockProducts + pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={handleOpenAdd}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs md:text-sm transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-emerald-200"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة مستحضر جديد 🧴</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-8 border-t border-emerald-800/80 pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-white text-emerald-950 shadow-lg font-black'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 نظرة عامة والإحصائيات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-white text-emerald-950 shadow-lg font-black'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>🧴 منتجات العناية والمستحضرات ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
              activeSubTab === 'orders'
                ? 'bg-white text-emerald-950 shadow-lg font-black'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>📦 طلبات المتجر الواردة ({skincareOrders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {pendingOrdersCount} جديد
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-white text-emerald-950 shadow-lg font-black'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>🧪 تصنيفات البشرة والمكونات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('promos')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'promos'
                ? 'bg-white text-emerald-950 shadow-lg font-black'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>🎟️ الكبونات ورسوم الشحن</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-white text-emerald-950 shadow-lg font-black'
                : 'text-emerald-200 hover:bg-emerald-800/50 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>⚙️ إعدادات الواجهة والهوية</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs animate-bounce border border-emerald-300">
          <Check className="w-5 h-5 bg-slate-950 text-emerald-400 rounded-full p-0.5" />
          <span>تم الحفظ والتحديث بنجاح لقاعدة بيانات متجر العناية بالبشرة! 💾✨</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & STATS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Statistics Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Total Sales */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold block">إجمالي مبيعات المتجر</span>
                <span className="text-2xl font-black text-emerald-700">
                  {totalSalesRevenue.toLocaleString()} ريال
                </span>
                <span className="text-[11px] font-bold text-emerald-600 block">من الطلبات المكتملة والمجهزة</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Total Skincare Orders */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold block">إجمالي الطلبات الواردة</span>
                <span className="text-2xl font-black text-slate-900">
                  {totalOrdersCount} طلب
                </span>
                <span className="text-[11px] font-bold text-amber-600 block">
                  {pendingOrdersCount} طلب قيد التجهيز
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Total Products in Catalog */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold block">مستحضرات التجميل بالمحل</span>
                <span className="text-2xl font-black text-slate-900">
                  {totalProducts} منتج
                </span>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {categoriesList.length} أقسام تجميلية
                </span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                <Droplet className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Inventory Alert */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold block">تنبيهات المخزون</span>
                <span className={`text-2xl font-black ${outOfStockProducts > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {outOfStockProducts} نافد
                </span>
                <span className="text-[11px] font-bold text-slate-500 block">
                  {outOfStockProducts > 0 ? 'يحتاج لإعادة تزويد الكمية' : 'المخزون متوفر بالكامل'}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                outOfStockProducts > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Quick Skin Type Distribution & Recent Orders Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Skin Types Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-black">
                  ✨
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">توزيع المستحضرات حسب نوع البشرة</h3>
                  <p className="text-slate-400 text-[11px]">تغطية متجرك لاحتياجات البشرة</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {skinTypesList.map((skinType, i) => {
                  const count = items.filter((item: any) => item.skinType === skinType).length;
                  const pct = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;

                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700">{skinType}</span>
                        <span className="text-slate-500">{count} منتج ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Incoming Orders Table Preview */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-black">
                    📦
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">أحدث الطلبات الواردة للمتجر</h3>
                    <p className="text-slate-400 text-[11px]">الطلبات المخصصة لمتجر العناية بالبشرة</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSubTab('orders')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>عرض الكل ({skincareOrders.length})</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {skincareOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold">لا توجد طلبات واردة حالياً لهذا المتجر.</p>
                  <p className="text-[11px]">الطلبات التي يقوم العملاء بإرسالها من متجر العناية ستظهر هنا فوراً.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="pb-3">رقم الطلب</th>
                        <th className="pb-3">العميل</th>
                        <th className="pb-3">الإجمالي</th>
                        <th className="pb-3">الحالة</th>
                        <th className="pb-3">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {skincareOrders.slice(0, 5).map((order: any, idx: number) => (
                        <tr key={order.id || idx} className="hover:bg-slate-50 transition-all">
                          <td className="py-3 font-black text-emerald-700">{order.id}</td>
                          <td className="py-3 font-bold text-slate-800">{order.customer?.name || 'عميل المتجر'}</td>
                          <td className="py-3 font-black text-slate-900">{order.total} ريال</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              order.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'تم الشحن' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'ملغي' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status || 'قيد المراجعة'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{order.date || 'الآن'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PRODUCTS CATALOG */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          
          {/* Stock Alert Notification Banner */}
          {(outOfStockProducts > 0 || lowStockProducts > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 text-base shadow">
                  🔔
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">إشعارات وتنبيهات المخزون الحرج</h4>
                  <p className="text-amber-800 text-xs font-bold mt-0.5">
                    {outOfStockProducts > 0 ? `🛑 يوجد ${outOfStockProducts} منتج نفد تماماً من المخزون.` : ''}
                    {outOfStockProducts > 0 && lowStockProducts > 0 ? ' | ' : ''}
                    {lowStockProducts > 0 ? `⚠️ يوجد ${lowStockProducts} منتج قاربت كميتها على النفاذ (≤ 5 قطع).` : ''}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl">
                يتم التحديث تلقائياً مع طلبات الموقع 🔄
              </span>
            </div>
          )}

          {/* Search & Filters Bar */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المستحضر أو المكونات..."
                className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-none pb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 shrink-0">القسم:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">جميع الأقسام ({items.length})</option>
                  {categoriesList.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 shrink-0">نوع البشرة:</span>
                <select
                  value={selectedSkinTypeFilter}
                  onChange={(e) => setSelectedSkinTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">جميع أنواع البشرة</option>
                  {skinTypesList.map((st, i) => (
                    <option key={i} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
                🧴
              </div>
              <h3 className="text-lg font-black text-slate-800">لا توجد مستحضرات عناية مطابقة</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                لم نجد أي مستحضر عناية يطابق خيارات البحث والتصفية. قم بإضافة منتج جديد أو تغيير كلمة البحث.
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مستحضر الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item: any, idx: number) => {
                const originalIndex = items.findIndex((i: any) => i === item || (i.id && i.id === item.id));
                const realIdx = originalIndex !== -1 ? originalIndex : idx;

                return (
                  <div
                    key={item.id || idx}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Preview & Badges */}
                      <div className="relative h-52 bg-slate-100 overflow-hidden">
                        <img
                          src={item.primaryImage || item.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800'}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                          <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border border-emerald-500/30">
                            {item.category || 'العناية بالبشرة'}
                          </span>
                        </div>

                        {item.skinType && (
                          <div className="absolute bottom-3 right-3">
                            <span className="bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md">
                              ✨ {item.skinType}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-black text-slate-900 text-base leading-tight">
                            {item.title || item.name}
                          </h3>
                        </div>

                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {item.description || 'لا يوجد وصف للمستحضر حالياً.'}
                        </p>

                        {/* Active Ingredients Tags */}
                        {Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.ingredients.slice(0, 3).map((ingr: string, i: number) => (
                              <span key={i} className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-100">
                                🧪 {ingr}
                              </span>
                            ))}
                            {item.ingredients.length > 3 && (
                              <span className="text-slate-400 text-[10px] font-bold self-center">
                                +{item.ingredients.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price & Stock */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-emerald-700 font-black text-lg">
                              {item.price} ريال
                            </span>
                            {item.originalPrice && (
                              <span className="text-slate-400 text-xs line-through mr-2">
                                {item.originalPrice} ريال
                              </span>
                            )}
                          </div>

                          <div className="text-left">
                            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
                              Number(item.stock) <= 0 
                                ? 'bg-rose-100 text-rose-700' 
                                : Number(item.stock) <= 5 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {Number(item.stock) > 0 ? `المخزون المتبقي: ${item.stock} قطعة` : 'نفد من المخزون'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEdit(item, realIdx)}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-800 font-bold py-2 rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تعديل المستحضر</span>
                      </button>

                      <button
                        onClick={() => setItemToDelete({ index: realIdx, title: item.title || item.name })}
                        className="p-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-sm"
                        title="حذف المستحضر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEDICATED SKINCARE ORDERS MANAGEMENT */}
      {activeSubTab === 'orders' && (
        <OrdersTab
          orders={skincareOrders}
          tenant={tenant}
          content={content}
          templateId={templateId || 15}
          dashboardColor="#059669"
          fetchOrders={loadSkincareOrders}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          handleDeleteOrder={handleDeleteOrder}
          handleRestoreOrder={handleRestoreOrder}
          handlePermanentDeleteOrder={handlePermanentDeleteOrder}
        />
      )}

      {/* TAB 4: CATEGORIES & SKIN TYPES */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Skincare Categories */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black">
                🧪
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">أقسام ومجالات العناية بالبشرة</h3>
                <p className="text-slate-500 text-xs">إدارة تصنيفات المنتجات التي تظهر للعملاء بمتجرك.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="اسم القسم الجديد (مثلاً: العناية بالشفاه)..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAddCategory}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition-all cursor-pointer shadow-md"
              >
                إضافة قسم
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {categoriesList.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-800">🧴 {cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-600 transition-all p-1 cursor-pointer"
                    title="حذف القسم"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Skin Types List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center font-black">
                ✨
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">أنواع البشرة المستهدفة</h3>
                <p className="text-slate-500 text-xs">تحديد خيارات تصفية نوع البشرة بمتجرك.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkinTypeInput}
                onChange={(e) => setNewSkinTypeInput(e.target.value)}
                placeholder="نوع بشرة جديد (مثلاً: البشرة المعرضة للتصبغات)..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleAddSkinType}
                className="bg-teal-600 hover:bg-teal-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition-all cursor-pointer shadow-md"
              >
                إضافة خيار
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {skinTypesList.map((st, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-800">✨ {st}</span>
                  <button
                    onClick={() => handleRemoveSkinType(st)}
                    className="text-slate-400 hover:text-rose-600 transition-all p-1 cursor-pointer"
                    title="حذف النوع"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: PROMO CODES & SHIPPING */}
      {activeSubTab === 'promos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Promo Codes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center font-black">
                🎟️
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">كبونات الخصم والعروض</h3>
                <p className="text-slate-500 text-xs">إنشاء أكواد خصم تمنح نسبة تخفيض لعملائك بالمتجر.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value)}
                placeholder="كود الخصم (مثلاً: BEAUTY20)"
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 uppercase"
              />
              <input
                type="number"
                value={newCodeDiscount}
                onChange={(e) => setNewCodeDiscount(e.target.value)}
                placeholder="نسبة الخصم % (مثلاً: 20)"
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleAddPromoCode}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-2.5 rounded-2xl text-xs transition-all cursor-pointer shadow-md"
            >
              إضافة كود الخصم
            </button>

            <div className="space-y-2 pt-2">
              {promoCodes.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-4">لا توجد أكواد خصم حالياً.</p>
              ) : (
                promoCodes.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                        {p.code}
                      </span>
                      <span className="text-xs font-bold text-slate-600">خصم {p.discountPercent}%</span>
                    </div>
                    <button
                      onClick={() => handleRemovePromoCode(p.code)}
                      className="text-slate-400 hover:text-rose-600 transition-all p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shipping Settings */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black">
                🚚
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">رسوم الشحن والتوصيل</h3>
                <p className="text-slate-500 text-xs">تعديل تكلفة الشحن التلقائية لطلبات المتجر.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رسوم الشحن والتوصيل (بالريال):
                </label>
                <input
                  type="number"
                  value={shippingFeeInput}
                  onChange={(e) => setShippingFeeInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                <p className="font-bold">💡 الشحن المجاني التلقائي:</p>
                <p className="text-slate-600">الطلبات التي تتجاوز قيمة 300 ريال تحصل على شحن مجاني تلقائياً في صفحة الشراء.</p>
              </div>

              <button
                onClick={handleSaveShippingAndBranding}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>حفظ رسوم الشحن</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 6: BRANDING & HERO SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black">
              ⚙️
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">هوية وإعدادات متجر العناية بالبشرة</h3>
              <p className="text-slate-500 text-xs">تخصيص الاسم، العنوان الرئيسي، صورة الغلاف، ورقم التواصل عبر واتساب.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المتجر / العلامة التجارية:</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب لاستقبال الطلبات والاستفسارات:</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="966500000000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 dir-ltr text-right"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الرئيسي في غلاف المتجر (Hero Title):</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">الوصف الفرعي بالواجهة:</label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-700">رابط صورة الغلاف الرئيسي (Hero Banner Image):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              {heroImage && (
                <div className="h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                  <img src={heroImage} alt="Hero Banner Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveShippingAndBranding}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-xs md:text-sm transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>حفظ إعدادات الهوية والواجهة</span>
          </button>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-black">
                  🧴
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingIndex !== null ? 'تعديل مستحضر العناية' : 'إضافة مستحضر عناية جديد'}
                  </h3>
                  <p className="text-slate-500 text-xs">أدخل تفاصيل ومواصفات المنتج بدقة ليظهر بشكل جذاب بالمتجر.</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-bold text-slate-800">
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-700">اسم المستحضر / المنتج *:</label>
                  <input
                    type="text"
                    required
                    value={newItemForm.title}
                    onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
                    placeholder="مثلاً: سيروم النياسيناميد والزنك المنقي"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">قسم العناية / التصنيف *:</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {categoriesList.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skin Type & Volume */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-700">نوع البشرة الموصى به:</label>
                  <select
                    value={newItemForm.skinType}
                    onChange={(e) => setNewItemForm({ ...newItemForm, skinType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {skinTypesList.map((st, i) => (
                      <option key={i} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">حجم العبوة / السعة (مثلاً: 50 مل):</label>
                  <input
                    type="text"
                    value={newItemForm.volume}
                    onChange={(e) => setNewItemForm({ ...newItemForm, volume: e.target.value })}
                    placeholder="50 مل / 200 جم"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Prices & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-slate-700">السعر (بالريال) *:</label>
                  <input
                    type="number"
                    required
                    value={newItemForm.price}
                    onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })}
                    placeholder="120"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">السعر قبل الخصم (اختياري):</label>
                  <input
                    type="number"
                    value={newItemForm.originalPrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, originalPrice: e.target.value })}
                    placeholder="150"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-700">الكمية بالمخزون:</label>
                  <input
                    type="number"
                    value={newItemForm.stock}
                    onChange={(e) => setNewItemForm({ ...newItemForm, stock: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Ingredients Input & Tags */}
              <div>
                <label className="block mb-1 text-slate-700">المكونات الفعالة الأساسية (🧪):</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newItemForm.ingredientInput}
                    onChange={(e) => setNewItemForm({ ...newItemForm, ingredientInput: e.target.value })}
                    placeholder="أدخل اسم مكون وانقر إضافة (مثلاً: حمض الهيالورونيك)..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredientTag}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-2xl text-xs transition-all cursor-pointer shrink-0"
                  >
                    إضافة المكون
                  </button>
                </div>

                {Array.isArray(newItemForm.ingredients) && newItemForm.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    {newItemForm.ingredients.map((tag: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-xl">
                        🧪 {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientTag(tag)}
                          className="hover:text-rose-600 transition-all mr-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 text-slate-700">وصف المستحضر وفوائده للبشرة:</label>
                <textarea
                  rows={3}
                  value={newItemForm.description}
                  onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="اكتب وصفاً جذاباً لفوائد المنتج وطريقة مفعوله..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Primary Image URL */}
              <div>
                <label className="block mb-1 text-slate-700">رابط الصورة الرئيسية للمنتج:</label>
                <input
                  type="text"
                  value={newItemForm.primaryImage}
                  onChange={(e) => setNewItemForm({ ...newItemForm, primaryImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Gallery Image Picker Component */}
              <div className="pt-2">
                <ImageGalleryPicker
                  currentImages={newItemForm.images}
                  onSelectImage={(url) => setNewItemForm({ ...newItemForm, primaryImage: url })}
                  onAddImageToList={(url) => {
                    if (!newItemForm.images.includes(url)) {
                      setNewItemForm({ ...newItemForm, images: [...newItemForm.images, url] });
                    }
                  }}
                  isMulti
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingIndex !== null ? 'حفظ التعديلات' : 'إضافة المستحضر للمتجر'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE PRODUCT MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
              🗑️
            </div>
            <h3 className="font-black text-slate-900 text-lg">تأكيد حذف المستحضر</h3>
            <p className="text-slate-500 text-xs">
              هل أنت تأكد من رغبتك في حذف <span className="font-black text-slate-800">"{itemToDelete.title}"</span> من متجر العناية بالبشرة؟
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                تراجع
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all cursor-pointer shadow-md"
              >
                حذف الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Order Confirmation Modal */}
      {/* Courier Share Modal */}
      {shareOrderModal && (
        <CourierShareModal
          order={shareOrderModal}
          tenant={tenant}
          content={content}
          onClose={() => setShareOrderModal(null)}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
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
                    {items.filter((i: any) => Number(i.stock) <= 5).map((prod: any, idx: number) => {
                      const isOut = Number(prod.stock) <= 0;
                      return (
                        <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                          isOut ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <div className="flex items-center gap-3">
                            <img src={prod.primaryImage || prod.image} alt={prod.title} className="w-10 h-10 rounded-xl object-cover border" />
                            <div>
                              <p className="font-black text-xs text-slate-900">{prod.title || prod.name}</p>
                              <p className={`text-[11px] font-bold ${isOut ? 'text-rose-700' : 'text-amber-800'}`}>
                                {isOut ? '🛑 نفد تماماً من المخزون (0 قطع)' : `⚠️ قاربت الكمية على النفاذ (${prod.stock} قطع متبقية)`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setShowNotificationsModal(false); setActiveSubTab('products'); }}
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
                    {skincareOrders.length} طلبات
                  </span>
                </h4>

                {skincareOrders.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center text-slate-500 text-xs font-bold">
                    لا توجد طلبات جديدة حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {skincareOrders.slice(0, 5).map((ord: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-black text-slate-900">طلب رقم #{ord.id?.toString().slice(-6)} - {ord.customer?.name}</p>
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
