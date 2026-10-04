import React from 'react';
import { Plus, Utensils, Edit, Trash2, Tag, Upload, ArrowUpRight, Sparkles, ShoppingBag, Clock, Flame, Star, PackageCheck } from 'lucide-react';
import { getDefaultItemsForTemplate } from '../../../lib/defaultData';
import CouponsAndShippingManager from '../managers/CouponsAndShippingManager';

interface ContentTabProps {
  templateId: number;
  content: any;
  dashboardColor: string;
  handleAddItem: () => void;
  handleEditItem: (idx: number) => void;
  handleDeleteItem: (itemId: number | string) => void;
  handleUpdateItem: (itemId: number | string, field: string, value: any) => void;
  showToast: (msg: string) => void;
  isLuxuryRestaurant: boolean;
  isFastFoodDelivery: boolean;
  isBoutique: boolean;
  isPerfumeStore: boolean;
  isElectronicsStore: boolean;
  isRealEstate: boolean;
  isConstruction: boolean;
  isEcommerce: boolean;
  setContent?: (content: any) => void;
  handleUpdateContent?: (silent?: boolean, updatedContent?: any) => void;
}

export default function ContentTab({
  templateId,
  content,
  dashboardColor,
  handleAddItem,
  handleEditItem,
  handleDeleteItem,
  handleUpdateItem,
  showToast,
  isLuxuryRestaurant,
  isFastFoodDelivery,
  isBoutique,
  isPerfumeStore,
  isElectronicsStore,
  isRealEstate,
  isConstruction,
  isEcommerce,
  setContent,
  handleUpdateContent
}: ContentTabProps) {
  const contentItems = Array.isArray(content?.items) ? content.items : [];

  const handleRestoreOriginalImage = (itemId: number, index: number) => {
    const defaults = getDefaultItemsForTemplate(templateId || 1);
    const defaultItem = defaults.find((d: any) => d.id === itemId) || defaults[index % defaults.length];
    if (defaultItem && defaultItem.image) {
      handleUpdateItem(itemId, 'image', defaultItem.image);
      showToast('تم استعادة صورة القالب الأصلية بنجاح');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-800 text-xl font-black">
            {isBoutique ? 'كتالوج معروضات ومنتجات البوتيك 👗' : isPerfumeStore ? 'كتالوج العطور والبخور الفاخرة 🌸' : isElectronicsStore ? 'كتالوج الأجهزة والإلكترونيات الذكية 📱' : 'قائمة العناصر والمنتجات المضافة'}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {isEcommerce 
              ? 'إدارة شاملة لمنتجات المتجر، رفع الصور المتعددة وتحديد كميات المخزون.'
              : 'يمكنك إضافة، تعديل وحذف العناصر الظاهرة في الموقع حالياً.'
            }
          </p>
        </div>
        <button onClick={handleAddItem} style={{ backgroundColor: dashboardColor }} className="text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer">
          <Plus size={18} /> {
            isLuxuryRestaurant ? 'إضافة طبق فاخر جديد 🍽️' : 
            isFastFoodDelivery ? 'إضافة وجبة توصيل سريعة 🍔' : 
            isBoutique ? 'إضافة منتج بوتيك جديد 👗' : 
            isPerfumeStore ? 'إضافة عطر جديد 🌸' : 
            isElectronicsStore ? 'إضافة جهاز جديد 📱' : 
            'إضافة عنصر جديد'
          }
        </button>
      </div>

      {/* Restore Original Image Helper Banner */}
      {!isBoutique && !isFastFoodDelivery && (
        <div className="bg-slate-100 border-b border-slate-200 p-4 px-6 flex items-center justify-between gap-4 text-xs text-slate-800 font-bold">
          <div className="flex items-center gap-2.5">
            <span className="text-base">📸</span>
            <span>تنبيه استعادة الصور:</span>
            <span className="font-normal text-slate-700">
              إذا قمت بتغيير صورة أي عنصر وأردت العودة للصورة الأصلية الافتراضية المرفقة مع القالب، اضغط على زر <strong className="font-bold underline text-slate-900">"استعادة صورة القالب"</strong> الموجود أسفل كل صورة.
            </span>
          </div>
        </div>
      )}

      {/* Content Items List */}
      <div className="p-6">
        {contentItems.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-4 bg-slate-50/50 rounded-3xl border border-slate-200/80">
            <PackageCheck className="w-16 h-16 mx-auto text-slate-400" />
            <h4 className="font-black text-slate-800 text-lg">الكتالوج فارغ حالياً</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              اضغط على زر "إضافة عنصر جديد" لبدء إضافة المعروضات أو الأطباق أو العقارات أو الخدمات.
            </p>
            <button onClick={handleAddItem} style={{ backgroundColor: dashboardColor }} className="text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer">
              <Plus size={18} /> إضافة أول عنصر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentItems.map((item: any, idx: number) => (
              <div key={item.id || idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col group relative overflow-hidden">
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600'} 
                    alt={item.name || item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {item.category && (
                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {item.category}
                    </span>
                  )}
                  {item.price && (
                    <span className="absolute bottom-3 left-3 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow">
                      {item.price} ر.س
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-black text-slate-800 text-base mb-1">{item.name || item.title || 'بدون عنوان'}</h4>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{item.description || item.subtitle || 'بدون وصف'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button 
                      type="button"
                      onClick={() => handleRestoreOriginalImage(item.id, idx)} 
                      className="text-[11px] text-slate-500 hover:text-slate-900 underline font-medium cursor-pointer"
                    >
                      استعادة صورة القالب
                    </button>

                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handleEditItem(idx)} 
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteItem(item.id)} 
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
