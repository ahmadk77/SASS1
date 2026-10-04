import React, { useState, useEffect } from 'react';
const RestaurantTemplate = React.lazy(() => import('../templates/RestaurantTemplate'));
const LuxuryRestaurant = React.lazy(() => import('../templates/LuxuryRestaurant'));
const ModernGrill = React.lazy(() => import('../templates/ModernGrill'));
const FastFoodDelivery = React.lazy(() => import('../templates/FastFoodDelivery'));
const CozyCafe = React.lazy(() => import('../templates/CozyCafe'));
const SpecialtyCoffee = React.lazy(() => import('../templates/SpecialtyCoffee'));
const BakeryCafe = React.lazy(() => import('../templates/BakeryCafe'));
const LuxuryVillas = React.lazy(() => import('../templates/LuxuryVillas'));
const ModernApartments = React.lazy(() => import('../templates/ModernApartments'));
const CommercialAgency = React.lazy(() => import('../templates/CommercialAgency'));
const HeavyConstruction = React.lazy(() => import('../templates/HeavyConstruction'));
const ModernArchitecture = React.lazy(() => import('../templates/ModernArchitecture'));
const DecorFinishing = React.lazy(() => import('../templates/DecorFinishing'));
const FashionTemplate = React.lazy(() => import('../templates/FashionTemplate'));
const ElectronicStore = React.lazy(() => import('../templates/ElectronicStore'));
const SkincareStore = React.lazy(() => import('../templates/SkincareStore'));
const DentalClinic = React.lazy(() => import('../templates/DentalClinic'));
import { getDefaultItemsForTemplate } from '../lib/defaultData';
import { STOCK_LOGOS } from './TemplateLiveEditorDrawer';
import { ShoppingCart, MessageSquare, Send, X, Plus, Minus, Check, PhoneCall, HelpCircle, Sparkles, Type, Palette, Upload, Image as ImageIcon, Maximize2 } from 'lucide-react';

export default function TemplateRenderer({ 
  templateId, 
  content, 
  tenant,
  onUpdateContent,
  isEditable = true
}: { 
  templateId: number | string, 
  content: any, 
  tenant: any,
  onUpdateContent?: (newContent: any) => void,
  isEditable?: boolean
}) {
  const numTemplateId = Number(templateId) || 1;
  const [isModeEditing, setIsModeEditing] = useState(isEditable);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    setIsModeEditing(isEditable);
  }, [isEditable]);

  // Prepare content for templates - memoized to avoid mutation on each render
  const safeContent = React.useMemo(() => {
    const baseContent = { ...(content || {}) };
    
    // Bridge business/site/store name aliases
    const name = baseContent.businessName || baseContent.siteName || baseContent.storeName || baseContent.name || tenant?.name || '';
    if (name) {
      baseContent.businessName = name;
      baseContent.siteName = name;
      baseContent.storeName = name;
    }

    // Bridge hero title aliases
    const hTitle = baseContent.heroTitle || baseContent.title || baseContent.heading;
    if (hTitle) {
      baseContent.heroTitle = hTitle;
      baseContent.title = hTitle;
    }

    // Bridge hero subtitle / slogan aliases
    const hSub = baseContent.heroSubtitle || baseContent.subtitle || baseContent.slogan;
    if (hSub) {
      baseContent.heroSubtitle = hSub;
      baseContent.slogan = hSub;
      baseContent.subtitle = hSub;
    }

    // Bridge primary color aliases
    const pColor = baseContent.primaryColor || baseContent.mainColor || baseContent.themeColor;
    if (pColor) {
      baseContent.primaryColor = pColor;
      baseContent.mainColor = pColor;
    }

    // Bridge logo aliases
    const logo = baseContent.logoUrl || baseContent.logo || baseContent.brandLogo;
    if (logo) {
      baseContent.logoUrl = logo;
      baseContent.logo = logo;
    }

    // Bridge hero background image aliases
    const heroBg = baseContent.heroBgUrl || baseContent.heroBg || baseContent.heroImage || baseContent.bgImage;
    if (heroBg) {
      baseContent.heroBgUrl = heroBg;
      baseContent.heroBg = heroBg;
      baseContent.heroImage = heroBg;
    }

    // Bridge phone and whatsapp numbers
    const phone = baseContent.phoneNumber || baseContent.phone || baseContent.whatsappNumber || baseContent.whatsapp;
    if (phone) {
      baseContent.phoneNumber = phone;
      baseContent.phone = phone;
      baseContent.whatsappNumber = phone;
      baseContent.whatsapp = phone;
    }

    // Ensure safeContent.items is populated. If it's missing or has food items on non-restaurant templates, load correct defaults.
    const isRest = [1, 2, 3, 4, 5, 6].includes(numTemplateId);
    const isReal = [7, 8, 9].includes(numTemplateId);
    const isContract = [10, 11, 12].includes(numTemplateId);
    const listKey = isRest ? 'menuItems' : (isReal ? 'properties' : (isContract ? 'projects' : 'items'));
    
    let items = baseContent.items ?? baseContent.menuItems ?? baseContent.properties ?? baseContent.projects ?? baseContent.products;
    const hasFoodItems = Array.isArray(items) && items.length > 0 && items.some((item: any) => {
      const txt = (item.name || item.title || '') + ' ' + (item.category || '');
      return /ستيك|برجر|قهوة|اسبريسو|كابتشينو|كرواسون|بيتزا|سالمون|كافيار|دجاج|موهيتو/i.test(txt);
    });

    if (items === undefined || items === null || (!isRest && hasFoodItems)) {
      if (!isRest && hasFoodItems) {
        items = (tenant || baseContent.isSubscribed) ? [] : getDefaultItemsForTemplate(numTemplateId);
      } else if (tenant || baseContent.isSubscribed) {
        items = [];
      } else if (baseContent[listKey] && Array.isArray(baseContent[listKey])) {
        items = baseContent[listKey];
      } else {
        items = getDefaultItemsForTemplate(numTemplateId);
      }
      baseContent.items = items;
    }

    // Map content.items dynamically to specific fields expected by the active template
    if (items && Array.isArray(items)) {
      // For Restaurant/Cafe Templates (1, 2, 3, 4, 5, 6)
      if ([1, 2, 3, 4, 5, 6].includes(numTemplateId)) {
        baseContent.menuItems = items.map((item: any, index: number) => ({
          id: item.id || index + 1,
          name: item.name || item.title || 'عنصر جديد',
          description: item.description || '',
          price: item.price || '0',
          category: item.category || 'أخرى',
          image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300'
        }));
      }

      // For Real Estate Templates (7, 8, 9)
      if ([7, 8, 9].includes(numTemplateId)) {
        baseContent.properties = items.map((item: any, index: number) => ({
          id: item.id || index + 1,
          title: item.title || item.name || 'عقار جديد',
          price: item.price || '0',
          image: item.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
          location: item.location || item.category || 'الموقع',
          beds: item.beds || 3,
          baths: item.baths || 2,
          area: item.area || '150',
          type: item.type || 'للبيع',
          category: item.category || 'عام'
        }));
      }

      // For Contractor/Architecture/Renovation Templates (10, 11, 12)
      if ([10, 11, 12].includes(numTemplateId)) {
        baseContent.projects = items.map((item: any, index: number) => ({
          id: item.id || index + 1,
          title: item.title || item.name || 'مشروع جديد',
          category: item.category || 'مشروع',
          image: item.image || 'https://images.unsplash.com/photo-1541888087611-37d45f3661eb?q=80&w=800',
          description: item.description || ''
        }));
        baseContent.services = items.map((item: any, index: number) => ({
          id: item.id || index + 1,
          title: item.title || item.name || 'خدمة جديدة',
          description: item.description || '',
          icon: item.icon || '🏗️'
        }));
      }

      // For Boutique Template (13)
      if (numTemplateId === 13) {
        baseContent.items = items.map((item: any, index: number) => ({
          ...item,
          id: item.id || index + 1,
          name: item.name || item.title || 'منتج جديد',
          title: item.title || item.name || 'منتج جديد',
          description: item.description || '',
          price: item.price || '0',
          category: item.category || 'عام',
          image: item.image || item.primaryImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800',
          primaryImage: item.primaryImage || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800',
          images: item.images || [item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800'],
          sizes: item.sizes || ['S', 'M', 'L', 'XL'],
          colors: item.colors || ['أسود', 'فضي', 'ذهبي'],
          colorImages: item.colorImages || {},
          stock: item.stock !== undefined ? item.stock : 10
        }));
        baseContent.products = baseContent.items;
      }

      // For Electronic Store Template (14)
      if (numTemplateId === 14) {
        baseContent.items = items.map((item: any, index: number) => ({
          ...item,
          id: item.id || index + 1,
          name: item.name || item.title || 'جهاز إلكتروني',
          title: item.title || item.name || 'جهاز إلكتروني',
          description: item.description || '',
          price: item.price || '0',
          category: item.category || 'الهواتف الذكية',
          image: item.image || item.primaryImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800',
          primaryImage: item.primaryImage || item.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800',
          images: item.images || [item.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800'],
          storageOptions: item.storageOptions || item.sizes || ['128GB', '256GB', '512GB'],
          colors: item.colors || ['تيتانيوم طبيعي', 'أسود', 'فضي'],
          colorImages: item.colorImages || {},
          stock: item.stock !== undefined ? item.stock : 15
        }));
        baseContent.products = baseContent.items;
      }
    }
    
    return baseContent;
  }, [content, templateId]);

  // Section delete handler
  const saveContentToStorage = (updatedContent: any) => {
    try {
      localStorage.setItem(`template_content_${numTemplateId}`, JSON.stringify(updatedContent));
      localStorage.setItem(`template_content_${numTemplateId}_${tenant?.subdomain || 'default'}`, JSON.stringify(updatedContent));
    } catch (err) {
      console.error('Failed to save content to localStorage:', err);
    }
  };

  const handleDeleteSectionKeys = (keys: string[], title: string) => {
    const updatedContent = { ...safeContent };
    keys.forEach(k => {
      updatedContent[k] = false;
    });

    saveContentToStorage(updatedContent);

    if (onUpdateContent) {
      onUpdateContent(updatedContent);
    }
    window.dispatchEvent(new CustomEvent('UPDATE_TEMPLATE_CONTENT', { detail: updatedContent }));

    setNotificationToast(`تم حذف وإخفاء "${title}" وحفظ التعديل تلقائياً 💾🗑️`);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  const handleRestoreAll = () => {
    const updatedContent = { ...safeContent };
    [
      'showHero', 'showMenu', 'showProducts', 'showGallery',
      'showAbout', 'showFeatures', 'showServices', 'showProjects',
      'showProperties', 'showContact', 'showFooter', 'showStats'
    ].forEach(k => {
      updatedContent[k] = true;
    });

    saveContentToStorage(updatedContent);

    if (onUpdateContent) {
      onUpdateContent(updatedContent);
    }
    window.dispatchEvent(new CustomEvent('UPDATE_TEMPLATE_CONTENT', { detail: updatedContent }));

    setNotificationToast('تم استعادة جميع الأقسام وحفظ التغييرات 🔄💾');
    setTimeout(() => setNotificationToast(null), 3500);
  };

  const handleManualSave = () => {
    const updated = { ...safeContent };
    if (selectedTextElement) {
      const newText = (selectedTextElement.innerText || selectedTextElement.textContent || '').trim();
      const parentSection = selectedTextElement.closest('header, section, footer');
      const sectionId = parentSection?.getAttribute('id') || parentSection?.tagName || '';
      
      if (sectionId.toLowerCase().includes('hero') || parentSection?.tagName.toLowerCase() === 'header') {
        if (selectedTextElement.tagName.startsWith('H')) {
          updated.heroTitle = newText;
          updated.title = newText;
        } else {
          updated.heroSubtitle = newText;
          updated.subtitle = newText;
        }
      } else if (sectionId.toLowerCase().includes('about') || sectionId.toLowerCase().includes('philosophy')) {
        updated.aboutText = newText;
      } else {
        if (selectedTextElement.tagName.startsWith('H')) {
          updated.heroTitle = newText;
          updated.title = newText;
        } else {
          updated.heroSubtitle = newText;
        }
      }
    }

    console.log('Manual save triggered with updated content:', updated);
    saveContentToStorage(updated);
    if (onUpdateContent) {
      onUpdateContent(updated);
    }
    window.dispatchEvent(new CustomEvent('UPDATE_TEMPLATE_CONTENT', { detail: updated }));
    setNotificationToast('تم حفظ التعديلات والأقسام بنجاح! وستظهر دائماً في القالب 💾');
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Section hidden status checks
  const isHeroHidden = safeContent.showHero === false;
  const isMenuHidden = safeContent.showMenu === false || safeContent.showProducts === false;
  const isAboutHidden = safeContent.showAbout === false || safeContent.showFeatures === false;
  const isServicesHidden = safeContent.showServices === false || safeContent.showProjects === false;
  const isPropertiesHidden = safeContent.showProperties === false;
  const isContactHidden = safeContent.showContact === false || safeContent.showFooter === false;

  const hasAnyHidden = isHeroHidden || isMenuHidden || isAboutHidden || isServicesHidden || isPropertiesHidden || isContactHidden;

  // DOM Overlay Badge Injection for Direct Hover-To-Delete
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Always remove stale overlays first
    const existingOverlays = container.querySelectorAll('.section-delete-overlay-badge');
    existingOverlays.forEach(el => el.remove());

    if (!isModeEditing) return;

    const timer = setTimeout(() => {

      // Query candidate section nodes
      const sectionNodes = container.querySelectorAll(
        'header#hero, header, section#menu, section#products, section#about, section#philosophy, section#services, section#projects, section#properties, section#contact, section#location, section#visit, section, footer'
      );

      sectionNodes.forEach((node) => {
        const el = node as HTMLElement;
        if (el.offsetHeight < 40) return;
        if (el.querySelector('.section-delete-overlay-badge')) return;

        const idOrTag = (el.getAttribute('id') || el.tagName).toLowerCase();
        const textContent = (el.textContent || '').slice(0, 120);

        let title = 'قسم من القالب';
        let keys = ['showFeatures'];

        if (idOrTag.includes('hero') || el.tagName.toLowerCase() === 'header') {
          title = 'قسم الغلاف الرئيسي (Hero)';
          keys = ['showHero'];
        } else if (idOrTag.includes('menu') || idOrTag.includes('product') || textContent.includes('منيو') || textContent.includes('القائمة') || textContent.includes('منتجات')) {
          title = 'قسم المنيو والمنتجات';
          keys = ['showMenu', 'showProducts', 'showGallery'];
        } else if (idOrTag.includes('about') || idOrTag.includes('philosophy') || textContent.includes('من نحن') || textContent.includes('فلسفتنا') || textContent.includes('قصتنا')) {
          title = 'قسم من نحن والقصة';
          keys = ['showAbout', 'showFeatures'];
        } else if (idOrTag.includes('service') || textContent.includes('خدماتنا') || textContent.includes('الخدمات')) {
          title = 'قسم الخدمات والتخصصات';
          keys = ['showServices'];
        } else if (idOrTag.includes('project') || idOrTag.includes('gallery') || textContent.includes('المشاريع') || textContent.includes('معرض')) {
          title = 'قسم المشاريع والمعرض';
          keys = ['showProjects', 'showGallery'];
        } else if (idOrTag.includes('properties') || textContent.includes('العقارات') || textContent.includes('الوحدات')) {
          title = 'قسم العقارات المتاحة';
          keys = ['showProperties'];
        } else if (idOrTag.includes('contact') || idOrTag.includes('location') || idOrTag.includes('visit') || el.tagName.toLowerCase() === 'footer' || textContent.includes('تواصل') || textContent.includes('زيارتنا') || textContent.includes('حقوق')) {
          title = 'قسم التواصل والفوتر';
          keys = ['showContact', 'showFooter'];
        }

        const compStyle = window.getComputedStyle(el);
        if (compStyle.position === 'static') {
          el.style.position = 'relative';
        }

        el.classList.add('group/section');
        el.classList.add('transition-all');

        const badge = document.createElement('div');
        badge.className = 'section-delete-overlay-badge absolute top-4 right-4 z-50 opacity-90 hover:opacity-100 transition-all duration-200 pointer-events-auto flex items-center gap-2.5 bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-2xl border border-rose-500/40 text-xs font-bold font-sans dir-rtl ring-2 ring-black/20';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'text-slate-100 font-bold flex items-center gap-1.5';
        titleSpan.innerHTML = `📌 <span class="font-black text-rose-300">${title}</span>`;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-3.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border border-rose-400/50 hover:shadow-rose-600/30';
        deleteBtn.innerHTML = '🗑️ حذف هذا القسم';

        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          handleDeleteSectionKeys(keys, title);
        });

        badge.appendChild(titleSpan);
        badge.appendChild(deleteBtn);
        el.appendChild(badge);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [safeContent, templateId, isModeEditing]);

  // Interactive Ordering & Inquiring States
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [cart, setCart] = useState<Array<{ item: any, quantity: number }>>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  // Direct On-Click Text Formatting & Color / Size Control States
  const [selectedTextElement, setSelectedTextElement] = useState<HTMLElement | null>(null);
  const [selectedTextValue, setSelectedTextValue] = useState<string>('');
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#0f172a');
  const [selectedFontSize, setSelectedFontSize] = useState<number>(18);
  const [selectedFontWeight, setSelectedFontWeight] = useState<string>('normal');
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Global click listener for direct on-click text & logo editing in preview
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isModeEditing) return;

    const handleElementClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore editor controls & overlay buttons
      if (
        target.closest('.section-delete-overlay-badge') || 
        target.closest('.editing-control-toolbar') || 
        target.closest('.logo-modal-container') ||
        target.closest('button') && target.closest('.editing-control-toolbar')
      ) {
        return;
      }

      // Check if image/logo clicked
      const isImg = target.tagName === 'IMG' || target.getAttribute('alt')?.includes('شعار') || target.getAttribute('alt')?.includes('لوجو');
      if (isImg && (target.closest('header') || target.closest('nav') || target.className.includes('logo'))) {
        e.preventDefault();
        e.stopPropagation();
        setIsLogoModalOpen(true);
        return;
      }

      // Check if text element clicked
      const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'LI', 'LABEL'];
      const isTextNode = textTags.includes(target.tagName) || (target.tagName === 'DIV' && target.children.length === 0 && (target.innerText || '').trim().length > 0);

      if (isTextNode && (target.innerText || '').trim().length > 0) {
        e.stopPropagation();
        
        // Remove outline from previous element
        if (selectedTextElement) {
          selectedTextElement.style.outline = 'none';
        }

        setSelectedTextElement(target);
        setSelectedTextValue((target.innerText || target.textContent || '').trim());

        const comp = window.getComputedStyle(target);
        setSelectedTextColor(comp.color);
        const parsedSize = parseInt(comp.fontSize, 10);
        setSelectedFontSize(isNaN(parsedSize) ? 18 : parsedSize);
        setSelectedFontWeight(comp.fontWeight);

        // Highlight selected text element on screen
        target.style.outline = '2px dashed #10b981';
        target.style.outlineOffset = '2px';
      }
    };

    container.addEventListener('click', handleElementClick);
    return () => {
      container.removeEventListener('click', handleElementClick);
    };
  }, [isModeEditing, selectedTextElement]);

  const handleTextChange = (val: string) => {
    setSelectedTextValue(val);
    if (selectedTextElement) {
      selectedTextElement.innerText = val;
    }
  };

  const handleColorChange = (hex: string) => {
    setSelectedTextColor(hex);
    if (selectedTextElement) {
      selectedTextElement.style.color = hex;
    }
  };

  const handleFontSizeChange = (size: number) => {
    setSelectedFontSize(size);
    if (selectedTextElement) {
      selectedTextElement.style.fontSize = `${size}px`;
    }
  };

  const handleFontWeightToggle = () => {
    const isBold = selectedFontWeight === 'bold' || selectedFontWeight === '700' || selectedFontWeight === '800' || selectedFontWeight === '900';
    const nextWeight = isBold ? 'normal' : 'bold';
    setSelectedFontWeight(nextWeight);
    if (selectedTextElement) {
      selectedTextElement.style.fontWeight = nextWeight;
    }
  };

  const handleCloseTextEditor = () => {
    if (selectedTextElement) {
      selectedTextElement.style.outline = 'none';
    }
    setSelectedTextElement(null);
    handleManualSave();
  };

  useEffect(() => {
    if (tenant?.subdomain) {
      const checkLocal = () => {
        try {
          const saved = localStorage.getItem(`orders_${tenant?.subdomain || 'demo'}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            const active = parsed.filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled');
            setActiveOrdersCount(active.length);
          }
        } catch (e) {}
      };
      checkLocal();
      window.addEventListener('CHECK_ORDERS', checkLocal);
      return () => window.removeEventListener('CHECK_ORDERS', checkLocal);
    }
  }, [tenant?.subdomain]);

  useEffect(() => {
    const handleAdd = (e: any) => {
      if (safeContent.disableOrdering) {
        alert('استقبال الطلبات والمبيعات متوقف حالياً. القائمة للعرض فقط.');
        return;
      }
      if (e.detail) {
        addToCart(e.detail);
        setIsWidgetOpen(true);
      }
    };
    window.addEventListener('ADD_TO_CART' as any, handleAdd);
    return () => window.removeEventListener('ADD_TO_CART' as any, handleAdd);
  }, [cart, safeContent.disableOrdering]);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isRestaurant = [1, 2, 3, 4, 5, 6].includes(numTemplateId);
  const isRealEstate = [7, 8, 9].includes(numTemplateId);
  const isConstruction = [10, 11, 12].includes(numTemplateId);
  const isBoutique = numTemplateId === 13 || (!isRestaurant && !isRealEstate && !isConstruction);

  // Styling helpers based on merchant branding
  const primaryColor = safeContent.primaryColor || (isRestaurant ? '#f43f5e' : isRealEstate ? '#2563eb' : '#fbbf24');
  const fontFamilyClass = safeContent.fontFamily === 'Cairo' ? 'font-cairo' : safeContent.fontFamily === 'Almarai' ? 'font-almarai' : 'font-sans';

  // Add Item to Cart (Food templates)
  const addToCart = (meal: any) => {
    const existing = cart.find(c => c.item.id === meal.id);
    if (existing) {
      setCart(cart.map(c => c.item.id === meal.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { item: meal, quantity: 1 }]);
    }
  };

  const updateQuantity = (mealId: any, delta: number) => {
    const existing = cart.find(c => c.item.id === mealId);
    if (!existing) return;
    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(c => c.item.id !== mealId));
    } else {
      setCart(cart.map(c => c.item.id === mealId ? { ...c, quantity: newQty } : c));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, c) => {
      // Parse numerical price if possible, e.g. "30 ريال" -> 30
      const priceNum = parseFloat(c.item.price.replace(/[^\d.]/g, '')) || 0;
      return total + (priceNum * c.quantity);
    }, 0);
  };

  // Submit Order to backend database and redirect to WhatsApp
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('يرجى كتابة الاسم ورقم الهاتف على الأقل.');
      return;
    }

    setIsSubmitting(true);
    try {
      const subdomain = tenant?.subdomain || 'demo';
      let payload: any = {
        customerName,
        customerPhone,
        customerEmail,
        type: isRestaurant ? 'food_order' : isRealEstate ? 'property_inquiry' : 'quote_request',
        details: {}
      };

      if (isRestaurant) {
        payload.items = cart.map(c => ({
          name: c.item.name || c.item.title,
          price: c.item.price,
          quantity: c.quantity
        }));
        payload.totalPrice = `${getCartTotal()} ريال`;
        payload.details.notes = notes;
      } else if (isRealEstate) {
        const prop = safeContent.properties?.find((p: any) => p.id.toString() === selectedPropertyId) || safeContent.properties?.[0];
        payload.details.propertyTitle = prop ? prop.title : 'استفسار عام عن العقارات';
        payload.details.message = notes;
        payload.totalPrice = prop ? prop.price : null;
      } else if (isConstruction) {
        const srv = safeContent.services?.find((s: any) => s.id.toString() === selectedServiceId) || safeContent.projects?.find((p: any) => p.id.toString() === selectedServiceId) || safeContent.services?.[0];
        payload.details.serviceTitle = srv ? srv.title : 'طلب استشارة تسعير عامة';
        payload.details.message = notes;
      }

      // 1. Save to Database Cloud SQL
      const res = await fetch(`/api/public/websites/${subdomain}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const orderId = data.order?.id || data.orderId;
        
        // Save to local storage for tracking
        if (orderId) {
          const existingOrders = JSON.parse(localStorage.getItem(`orders_${subdomain}`) || '[]');
          const newTracked = [{ id: orderId, phone: customerPhone, name: customerName, date: new Date().toISOString(), status: 'pending' }, ...existingOrders];
          localStorage.setItem(`orders_${subdomain}`, JSON.stringify(newTracked));
        }

        // Success state
        setSuccessMessage('تم استلام طلبك بنجاح! يمكنك الآن متابعة حالة الطلب مباشرة من الموقع.');
        
        // Clear form & Cart after a short delay
        setTimeout(() => {
          if (orderId) {
            // Trigger the tracking system after the modal closes
            window.dispatchEvent(new CustomEvent('CHECK_ORDERS'));
          }
          setCart([]);
          setCustomerName('');
          setCustomerPhone('');
          setCustomerEmail('');
          setNotes('');
          setSuccessMessage('');
          setIsWidgetOpen(false);
        }, 2500);
      } else {
        alert('حدث خطأ أثناء حفظ الطلب في السيرفر. يرجى المحاولة لاحقاً.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في الشبكة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFontSizeClass = () => {
    if (safeContent.fontSize === 'small') return 'text-sm';
    if (safeContent.fontSize === 'large') return 'text-lg';
    return 'text-base';
  };

  // Extract templates
  const renderTemplate = () => {
    if (numTemplateId === 1) return <LuxuryRestaurant content={safeContent} tenant={tenant} />;
    if (numTemplateId === 2) return <ModernGrill content={safeContent} tenant={tenant} />;
    if (numTemplateId === 3) return <FastFoodDelivery content={safeContent} tenant={tenant} />;
    if (numTemplateId === 4) return <CozyCafe content={safeContent} tenant={tenant} />;
    if (numTemplateId === 5) return <SpecialtyCoffee content={safeContent} tenant={tenant} />;
    if (numTemplateId === 6) return <BakeryCafe content={safeContent} tenant={tenant} />;
    if (numTemplateId === 7) return <LuxuryVillas content={safeContent} tenant={tenant} />;
    if (numTemplateId === 8) return <ModernApartments content={safeContent} tenant={tenant} />;
    if (numTemplateId === 9) return <CommercialAgency content={safeContent} tenant={tenant} />;
    if (numTemplateId === 10) return <HeavyConstruction content={safeContent} tenant={tenant} />;
    if (numTemplateId === 11) return <ModernArchitecture content={safeContent} tenant={tenant} />;
    if (numTemplateId === 12) return <DecorFinishing content={safeContent} tenant={tenant} />;
    if (numTemplateId === 13) return <FashionTemplate content={safeContent} tenant={tenant} tenantName={safeContent.businessName || tenant?.name} setContent={(newC) => { saveContentToStorage(newC); if (onUpdateContent) onUpdateContent(newC); }} />;
    if (numTemplateId === 14) return <ElectronicStore content={safeContent} tenant={tenant} tenantName={safeContent.businessName || tenant?.name} setContent={(newC) => { saveContentToStorage(newC); if (onUpdateContent) onUpdateContent(newC); }} />;
    if (numTemplateId === 15) return <SkincareStore content={safeContent} tenant={tenant} tenantName={safeContent.businessName || tenant?.name} setContent={(newC) => { saveContentToStorage(newC); if (onUpdateContent) onUpdateContent(newC); }} />;
    if (numTemplateId === 16) return <DentalClinic content={safeContent} tenant={tenant} />;
    return <LuxuryRestaurant content={safeContent} tenant={tenant} />;
  };

  return (
    <div 
      ref={containerRef}
      className={`template-root-wrapper w-full max-w-[100vw] overflow-x-hidden min-h-[100dvh] flex flex-col relative ${getFontSizeClass()} ${fontFamilyClass} transition-all duration-500`}
      style={{
        '--dynamic-spacing': content?.spacing === 'compact' ? '0.75' : content?.spacing === 'spacious' ? '1.5' : '1',
      } as React.CSSProperties}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700;900&family=Almarai:wght@400;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');
        
        .font-cairo { font-family: 'Cairo', sans-serif !important; }
        .font-almarai { font-family: 'Almarai', sans-serif !important; }
        .font-sans { font-family: 'Tajawal', sans-serif !important; }

        ${safeContent.headingColor ? `.template-root-wrapper h1, .template-root-wrapper h2, .template-root-wrapper h3, .template-root-wrapper h4, .template-root-wrapper h5, .template-root-wrapper h6 { color: ${safeContent.headingColor} !important; }` : ''}
        ${safeContent.bodyTextColor ? `.template-root-wrapper p, .template-root-wrapper span, .template-root-wrapper li, .template-root-wrapper div:not(.bg-emerald-500) { color: ${safeContent.bodyTextColor}; }` : ''}

        ${safeContent.titleFontSize === 'small' ? `.template-root-wrapper h1 { font-size: 2rem !important; } .template-root-wrapper h2 { font-size: 1.5rem !important; }` : ''}
        ${safeContent.titleFontSize === 'large' ? `.template-root-wrapper h1 { font-size: 3.5rem !important; } .template-root-wrapper h2 { font-size: 2.5rem !important; }` : ''}
        ${safeContent.titleFontSize === 'xlarge' ? `.template-root-wrapper h1 { font-size: 4.25rem !important; } .template-root-wrapper h2 { font-size: 3rem !important; }` : ''}

        ${safeContent.bodyFontSize === 'small' ? `.template-root-wrapper p, .template-root-wrapper span { font-size: 0.8125rem !important; }` : ''}
        ${safeContent.bodyFontSize === 'large' ? `.template-root-wrapper p, .template-root-wrapper span { font-size: 1.125rem !important; }` : ''}
        ${safeContent.bodyFontSize === 'xlarge' ? `.template-root-wrapper p, .template-root-wrapper span { font-size: 1.25rem !important; }` : ''}
      `}</style>

      {/* Interactive Direct Section Control Bar (Editing Mode Only) */}
      {isEditable && (
        isModeEditing ? (
          <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-bold font-sans dir-rtl sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-black">وضع التحكم والتحرير المباشر للأقسام:</span>
              <span className="text-slate-300 hidden md:inline">يمكنك الوقوف على أي قسم بداخل الصفحة والنقر على "حذف هذا القسم 🗑️"</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1.5 py-0.5 whitespace-nowrap scrollbar-none px-1">
              <span className="text-slate-400 text-[11px] hidden sm:inline shrink-0">أقسام القالب:</span>
              
              <button
                onClick={() => handleDeleteSectionKeys(['showHero'], 'قسم الغلاف')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  safeContent.showHero === false 
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800 opacity-60 line-through' 
                    : 'bg-slate-800 hover:bg-rose-900/60 text-slate-200 border-slate-700 hover:text-white'
                }`}
                title="تعديل/حذف قسم الغلاف"
              >
                {safeContent.showHero === false ? '❌ الغلاف مخفي' : '🗑️ حذف الغلاف'}
              </button>

              <button
                onClick={() => handleDeleteSectionKeys(['showMenu', 'showProducts', 'showGallery'], 'قسم المنيو والمنتجات')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  safeContent.showMenu === false || safeContent.showProducts === false 
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800 opacity-60 line-through' 
                    : 'bg-slate-800 hover:bg-rose-900/60 text-slate-200 border-slate-700 hover:text-white'
                }`}
                title="تعديل/حذف قسم المنيو والمنتجات"
              >
                {safeContent.showMenu === false || safeContent.showProducts === false ? '❌ المنيو مخفي' : '🗑️ حذف المنيو'}
              </button>

              <button
                onClick={() => handleDeleteSectionKeys(['showAbout', 'showFeatures'], 'قسم من نحن والقصة')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  safeContent.showAbout === false || safeContent.showFeatures === false 
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800 opacity-60 line-through' 
                    : 'bg-slate-800 hover:bg-rose-900/60 text-slate-200 border-slate-700 hover:text-white'
                }`}
                title="تعديل/حذف قسم من نحن"
              >
                {safeContent.showAbout === false || safeContent.showFeatures === false ? '❌ من نحن مخفي' : '🗑️ حذف من نحن'}
              </button>

              <button
                onClick={() => handleDeleteSectionKeys(['showContact', 'showFooter'], 'قسم التواصل والفوتر')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  safeContent.showContact === false || safeContent.showFooter === false 
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800 opacity-60 line-through' 
                    : 'bg-slate-800 hover:bg-rose-900/60 text-slate-200 border-slate-700 hover:text-white'
                }`}
                title="تعديل/حذف قسم التواصل"
              >
                {safeContent.showContact === false || safeContent.showFooter === false ? '❌ التواصل مخفي' : '🗑️ حذف التواصل'}
              </button>

              {hasAnyHidden && (
                <button
                  onClick={handleRestoreAll}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 shadow-md active:scale-95 cursor-pointer ml-1"
                >
                  <span>🔄 استعادة الأقسام</span>
                </button>
              )}

              <button
                onClick={handleManualSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer border border-emerald-400/30 hover:shadow-emerald-600/30"
              >
                <span>💾 حفظ التعديلات</span>
              </button>

              <button
                onClick={() => {
                  handleManualSave();
                  setIsModeEditing(false);
                  setNotificationToast('تمت معاينة الموقع النهائي مع حفظ جميع التعديلات! 👁️');
                  setTimeout(() => setNotificationToast(null), 3500);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer border border-indigo-400/30"
                title="الخروج من وضع التحرير ومعاينة النتيجة النهائية"
              >
                <span>👁️ معاينة النهائي</span>
              </button>

              <button
                onClick={() => {
                  handleManualSave();
                  window.location.href = '/dashboard';
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer border border-slate-500/30"
                title="الخروج من القالب والعودة إلى لوحة التحكم الرئيسية مع البقاء مسجلاً للدخول"
              >
                <span>🚪 الخروج للوحة التحكم</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 dir-rtl flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-[85vw]">
            <button
              onClick={() => {
                setIsModeEditing(true);
                setNotificationToast('عدت لوضع التعديل والتحكم بالأقسام! ✏️');
                setTimeout(() => setNotificationToast(null), 3500);
              }}
              className="bg-slate-900/95 hover:bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xl border border-indigo-500/50 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:border-indigo-400"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>✏️ تعديل الأقسام</span>
            </button>

            <button
              onClick={() => {
                window.location.href = '/dashboard';
              }}
              className="bg-slate-900/95 hover:bg-slate-900 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-2xl border border-rose-500/50 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-black backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:border-rose-400"
              title="الخروج من القالب والعودة للوحة التحكم"
            >
              <span>🚪 لوحة التحكم</span>
            </button>
          </div>
        )
      )}

      {/* Floating Action Notification Toast */}
      {notificationToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 text-xs font-black animate-bounce dir-rtl">
          <span className="text-base"></span>
          <span>{notificationToast}</span>
        </div>
      )}
      
      {/* Operation Status Banners */}
      {isRestaurant && safeContent.disableOrdering && (
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 text-white text-xs md:text-sm font-black px-4 py-3 text-center shadow-2xl z-50 flex items-center justify-center gap-2 border-b border-rose-500 sticky top-0">
          <span className="text-base">📖</span>
          <span>المنيو للعرض فقط حالياً - استقبال الطلبات والمبيعات متوقف مؤقتاً</span>
        </div>
      )}

      {isRestaurant && !safeContent.disableOrdering && safeContent.disableDelivery && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-xs md:text-sm font-black px-4 py-3 text-center shadow-2xl z-50 flex items-center justify-center gap-2 border-b border-amber-400 sticky top-0">
          <span className="text-base">🛵</span>
          <span>خدمة التوصيل معلقة حالياً - الطلبات متوفرة للاستلام المباشر أو التواجد في الفرع</span>
        </div>
      )}

      {/* Active template layout */}
      <React.Suspense fallback={<div className="flex w-full h-full min-h-[500px] items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>{renderTemplate()}</React.Suspense>

      {/* Persistent Floating Widget/Order Button */}
      <div className="fixed bottom-3 left-3 sm:bottom-6 sm:left-6 z-40 flex flex-col gap-2 sm:gap-3 max-w-[85vw]">
        {/* WhatsApp Direct Chat Button */}
        {safeContent.whatsappNumber && (
          <a
            href={`https://wa.me/${safeContent.whatsappNumber.replace(/\+/g, '')}?text=${encodeURIComponent('مرحباً، أود التواصل معكم بخصوص خدماتكم.')}`}
            target="_blank"
            rel="noreferrer"
            className="text-white bg-emerald-500 px-5 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold border-2 border-white/20 self-start"
          >
            <MessageSquare size={20} />
            <span>تواصل عبر واتساب</span>
          </a>
        )}

        {/* Order/Inquiry Floating Button or Disable Badge */}
        {isRestaurant && safeContent.disableOrdering ? (
          <div className="bg-slate-900/90 text-amber-400 border-2 border-amber-500/40 px-5 py-3.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 font-black text-sm">
            <span>📖</span>
            <span>المنيو للعرض فقط حالياً</span>
          </div>
        ) : safeContent.onlineOrderingEnabled !== false ? (
          <button
            onClick={() => setIsWidgetOpen(true)}
            style={{ backgroundColor: primaryColor }}
            className="text-white px-5 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 font-bold animate-pulse border-2 border-white/20"
          >
            {isRestaurant && (
              <>
                <ShoppingCart size={20} />
                <span>طلب دليفري / حجز خارجي</span>
                {cart.length > 0 && (
                  <span className="w-5 h-5 bg-white text-slate-950 font-black text-xs rounded-full flex items-center justify-center">
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </span>
                )}
              </>
            )}

            {isRealEstate && (
              <>
                <MessageSquare size={20} />
                <span>حجز واستفسار عقاري مباشر</span>
              </>
            )}

            {isConstruction && (
              <>
                <PhoneCall size={20} />
                <span>طلب تسعير واستشارة مجانية</span>
              </>
            )}
          </button>
        ) : (
          isRestaurant && (
            <div className="bg-slate-950/95 backdrop-blur-xl border border-amber-500/30 text-white px-5 py-4 rounded-3xl shadow-2xl flex items-center gap-3 font-medium text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span>الطلبات أونلاين غير متاحة حالياً - نرحب بكم في موقعنا أو باتصال مباشر 📞</span>
            </div>
          )
        )}
      </div>

      {/* Unified Floating Drawer/Modal for Customer Inquiry */}
      {isWidgetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100" dir="rtl">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  {isRestaurant && <ShoppingCart size={20} />}
                  {isRealEstate && <MessageSquare size={20} />}
                  {isConstruction && <PhoneCall size={20} />}
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-base">
                    {isRestaurant && 'سلة الطلب السريع والدليفري'}
                    {isRealEstate && 'تواصل وحجز العقارات'}
                    {isConstruction && 'طلب تسعير وخدمات مخصصة'}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    سيصل طلبك مباشرة إلى إدارة {safeContent.businessName || tenant?.name || 'المنشأة'} وسنتواصل معك فوراً.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeOrdersCount > 0 && (
                  <button 
                    onClick={() => {
                      setIsWidgetOpen(false);
                      window.dispatchEvent(new CustomEvent('CHECK_ORDERS'));
                    }} 
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 border border-blue-200 shadow-sm transition-colors"
                  >
                    طلباتك الحالية ({activeOrdersCount})
                  </button>
                )}
                <button onClick={() => setIsWidgetOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Success Message Banner */}
            {successMessage ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check size={32} />
                </div>
                <h4 className="font-bold text-lg text-emerald-700">تم إرسال طلبك بنجاح!</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{successMessage}</p>
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. If Restaurant: Display Menu List & Current Cart items inside widget */}
                {isRestaurant && (
                  <div className="space-y-4">
                    <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider">📦 اختر وجباتك ومشروباتك:</h4>
                    
                    {/* Meal Selector list */}
                    {safeContent.menuItems && safeContent.menuItems.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 max-h-[180px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50">
                        {safeContent.menuItems.map((meal: any) => {
                          const inCart = cart.find(c => c.item.id === meal.id);
                          return (
                            <div key={meal.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <img src={meal.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-50" />
                                <div>
                                  <p className="font-bold text-slate-800">{meal.name}</p>
                                  <p className="text-[10px] text-rose-500 font-bold">{meal.price}</p>
                                </div>
                              </div>
                              
                              {inCart ? (
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => updateQuantity(meal.id, -1)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-700 font-bold hover:bg-slate-200">
                                    <Minus size={12} />
                                  </button>
                                  <span className="font-bold text-slate-800 w-4 text-center">{inCart.quantity}</span>
                                  <button type="button" onClick={() => addToCart(meal)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-700 font-bold hover:bg-slate-200">
                                    <Plus size={12} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addToCart(meal)}
                                  style={{ backgroundColor: primaryColor }}
                                  className="text-white px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-sm hover:opacity-90"
                                >
                                  إضافة للطلب
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">لا يوجد أطباق مضافة في المنيو حالياً.</p>
                    )}

                    {/* Cart Items Summary */}
                    {cart.length > 0 && (
                      <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-2">
                        <div className="flex justify-between items-center font-bold text-xs text-rose-800 border-b border-rose-100 pb-2">
                          <span>الوجبات المختارة</span>
                          <span>السعر</span>
                        </div>
                        {cart.map((c, i) => (
                          <div key={i} className="text-xs flex justify-between text-slate-600">
                            <span>{c.item.name} × {c.quantity}</span>
                            <span className="font-bold">{parseFloat(c.item.price.replace(/[^\d.]/g, '')) * c.quantity} ريال</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center font-black text-sm text-slate-800 border-t border-rose-100 pt-2 mt-2">
                          <span>الإجمالي التقريبي:</span>
                          <span className="text-rose-600">{getCartTotal()} ريال</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. If Real Estate: Property selector */}
                {isRealEstate && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">🏢 حدد العقار المعني بالاستفسار:</label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                    >
                      <option value="">-- اختر العقار من القائمة --</option>
                      {safeContent.properties && safeContent.properties.map((p: any) => (
                        <option key={p.id} value={p.id.toString()}>
                          {p.title} ({p.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. If Contractor: Service selector */}
                {isConstruction && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">🏗️ حدد الخدمة أو المشروع المطلوب:</label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                    >
                      <option value="">-- اختر الخدمة المطلوبة --</option>
                      {safeContent.services && safeContent.services.map((s: any) => (
                        <option key={s.id} value={s.id.toString()}>{s.title}</option>
                      ))}
                      {safeContent.projects && safeContent.projects.map((p: any) => (
                        <option key={p.id} value={p.id.toString()}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Contact Inputs */}
                <div className="space-y-4">
                  <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5">👤 معلوماتك الشخصية للتواصل:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">اسمك الكريم *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-rose-500 focus:bg-white font-medium"
                        placeholder="مثال: عبدالله محمد"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم الهاتف الجوال *</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-rose-500 focus:bg-white font-mono"
                        placeholder="05xxxxxxx"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-rose-500 focus:bg-white font-mono"
                      placeholder="username@example.com"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      {isRestaurant ? 'ملاحظات إضافية على الطلب' : 'تفاصيل الرسالة أو الطلب المخصص'}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 focus:bg-white min-h-[70px]"
                      placeholder={isRestaurant ? 'مثال: بدون بصل، زيادة كاتشب...' : 'اكتب تفاصيل طلبك أو استفسارك هنا لنجيبك فوراً...'}
                    />
                  </div>
                </div>

                {/* Confirm Buttons */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || (isRestaurant && cart.length === 0)}
                    style={{ backgroundColor: primaryColor }}
                    className="flex-1 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Send size={14} />
                    {isSubmitting ? 'جاري إرسال الطلب...' : (isRestaurant ? 'تأكيد وإتمام الطلب عبر الواتساب' : 'إرسال الاستفسار وتأكيده')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWidgetOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* FLOATING DIRECT TEXT FORMATTING TOOLBAR */}
      {selectedTextElement && isModeEditing && (
        <div className="editing-control-toolbar fixed bottom-4 left-1/2 -translate-x-1/2 z-[40] w-[95%] max-w-2xl bg-slate-900/98 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border-2 border-emerald-500 backdrop-blur-xl dir-rtl flex flex-col gap-3 font-sans transition-all animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <h4 className="font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                <Type size={16} />
                <span>شريط تعديل وتنسيق النص المباشر</span>
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <ImageIcon size={13} />
                <span>تغيير اللوجو من المعرض</span>
              </button>
              <button
                type="button"
                onClick={handleCloseTextEditor}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-md"
              >
                <Check size={14} />
                <span>إحفظ واغلق 💾</span>
              </button>
            </div>
          </div>

          {/* Live Text Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">تغيير محتوى النص (عدل هنا ليظهر فوراً في القالب):</label>
            <input
              type="text"
              value={selectedTextValue}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-bold"
              placeholder="اكتب النص الجديد هنا..."
            />
          </div>

          {/* Controls Grid: Colors & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Color Swatches */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Palette size={13} className="text-amber-400" />
                <span>تغيير لون النص (Text Color):</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['#0f172a', '#ffffff', '#d4af37', '#e11d48', '#0284c7', '#059669', '#7c3aed', '#d97706', '#475569'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorChange(c)}
                    className={`w-6 h-6 rounded-lg border-2 transition-all cursor-pointer active:scale-90 ${
                      selectedTextColor === c ? 'border-emerald-400 scale-110 shadow-md ring-2 ring-emerald-500/50' : 'border-slate-700 hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: c }}
                    title={`اختيار اللون ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={selectedTextColor.startsWith('#') ? selectedTextColor : '#0f172a'}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 p-0 cursor-pointer bg-transparent"
                  title="اختيار لون خاص"
                />
              </div>
            </div>

            {/* Font Size Slider */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>التحكم بحجم الخط (Font Size):</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{selectedFontSize}px</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(Math.max(10, selectedFontSize - 2))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-sm flex items-center justify-center text-white active:scale-95 border border-slate-700 cursor-pointer"
                  title="تصغير الخط"
                >
                  -
                </button>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={selectedFontSize}
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(Math.min(100, selectedFontSize + 2))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-sm flex items-center justify-center text-white active:scale-95 border border-slate-700 cursor-pointer"
                  title="تكبير الخط"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Presets & Weight */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
              <span className="text-slate-400 font-bold shrink-0">أحجام سريعة:</span>
              {[13, 16, 20, 26, 34, 46].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleFontSizeChange(s)}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                    selectedFontSize === s ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {s}px
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleFontWeightToggle}
              className={`px-3 py-1 rounded-xl border font-black text-xs transition-all cursor-pointer ${
                selectedFontWeight === 'bold' || selectedFontWeight === '700' || selectedFontWeight === '800' || selectedFontWeight === '900'
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {selectedFontWeight === 'bold' || selectedFontWeight === '700' || selectedFontWeight === '800' || selectedFontWeight === '900' ? 'خط عريض (Bold) ✓' : 'خط عادي (Normal)'}
            </button>
          </div>
        </div>
      )}

      {/* STOCK LOGO GALLERY MODAL */}
      {isLogoModalOpen && (
        <div className="logo-modal-container fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-3xl rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">معرض اللوجوهات والشعارات الجاهزة</h3>
                  <p className="text-[11px] text-slate-400">اختر شعاراً احترافياً لنشاطك التجاري بنقرة واحدة</p>
                </div>
              </div>

              <button
                onClick={() => setIsLogoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Gallery Stock Items */}
            <div className="space-y-4">
              {STOCK_LOGOS.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 border-r-2 border-amber-400 pr-2">
                    {group.category}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {group.items.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...safeContent,
                            logoUrl: item.url,
                            logo: item.url,
                          };
                          if (onUpdateContent) onUpdateContent(updated);
                          setIsLogoModalOpen(false);
                          setNotificationToast(`تم تغيير اللوجو إلى: ${item.name} ✨`);
                          setTimeout(() => setNotificationToast(null), 3000);
                        }}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 p-2 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer group hover:scale-105 shadow-md"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-1 flex items-center justify-center">
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-all" />
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold truncate max-w-full group-hover:text-emerald-400">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer custom upload or URL */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[240px]">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">أو أدخل رابط لوجو خاص بك (Image URL):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-left"
                    dir="ltr"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val) {
                          const updated = { ...safeContent, logoUrl: val, logo: val };
                          if (onUpdateContent) onUpdateContent(updated);
                          setIsLogoModalOpen(false);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all"
              >
                إغلاق المعرض
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
