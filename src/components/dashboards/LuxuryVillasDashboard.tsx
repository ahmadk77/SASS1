import React, { useState } from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';
import { 
  Building, Plus, Search, Edit3, Trash2, Bed, Bath, Home, Sparkles, 
  MapPin, ShieldCheck, Tag, Eye, Phone, ChevronRight, Layers, Users
} from 'lucide-react';

export default function LuxuryVillasDashboard({
  content,
  analyticsData,
  orders = [],
  tenant,
  handleAddItem,
  handleEditItem,
  handleDeleteItem,
  handleUpdateItem
}: DashboardTemplateProps) {
  const items = content?.items || [];
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['الكل', ...Array.from(new Set(items.map((item: any) => item.category || 'فلل فاخرة')))];

  const filteredItems = items.filter((item: any) => {
    const matchesCategory = activeCategory === 'الكل' || item.category === activeCategory;
    const name = item.title || item.name || '';
    const desc = item.description || '';
    const loc = item.location || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          loc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-full bg-[#080d18] p-6 lg:p-10 font-sans text-slate-100 selection:bg-amber-500 selection:text-black" dir="rtl">
      {/* Royal Gold & Deep Navy Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d1627] to-[#080d18] border border-amber-500/30 p-6 lg:p-8 rounded-3xl mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 text-slate-950 font-bold shrink-0">
              <Building size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/20">
                  لوحة إدارة الفلل والقصور الفاخرة
                </span>
                <span className="text-xs text-slate-400 font-mono">Luxury Villas Admin</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-wide">
                {content?.businessName || tenant?.name || 'محفظة القصور والفلل الملكية'}
              </h1>
            </div>
          </div>

          <button
            onClick={handleAddItem}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} />
            <span>إضافة فيلا أو قصر جديد</span>
          </button>
        </div>

        {/* Portfolio Executive Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 text-xs block mb-1">إجمالي الفلل المعروضة</span>
            <span className="text-2xl font-black font-serif text-amber-400">{items.length} عقار</span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 text-xs block mb-1">طلبات المعاينة والمحادثات</span>
            <span className="text-2xl font-black font-serif text-white">{orders.length} طلب</span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 text-xs block mb-1">متوسط مساحات الفلل</span>
            <span className="text-xl font-bold font-serif text-emerald-400">750 م²</span>
          </div>
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-slate-400 text-xs block mb-1">الزيارات المستهدفة</span>
            <span className="text-2xl font-black font-serif text-amber-400">{analyticsData?.totalVisits || 3200} زائر</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-300 whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالموقع، الاسم أو المواصفات..."
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 pr-10 pl-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Villas Horizontal Cards */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-500 text-sm font-light">
          <Home className="w-12 h-12 mx-auto mb-3 text-amber-500/40" />
          <p>لا توجد فلل تطابق خيارات البحث الحالية.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item: any, idx: number) => {
            const actualIndex = items.indexOf(item);
            return (
              <div
                key={item.id || idx}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/50 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-6 transition-all duration-300 shadow-xl group"
              >
                {/* Villa Image */}
                <div className="relative w-full md:w-64 h-44 rounded-2xl overflow-hidden bg-slate-950 shrink-0">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=600'}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-500/30">
                    {item.category || 'فيلا فاخرة'}
                  </span>
                  {item.badge && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-md">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-right space-y-2.5 w-full">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-serif font-bold text-white text-lg group-hover:text-amber-400 transition">
                      {item.title || item.name}
                    </h3>
                    <span className="text-amber-400 font-serif font-black text-xl shrink-0">
                      {item.price}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-2 font-light leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300 font-mono border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Bed size={14} className="text-amber-400" />
                      <span>{item.beds || 5} نوم</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath size={14} className="text-amber-400" />
                      <span>{item.baths || 6} حمامات</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={14} className="text-amber-400" />
                      <span>{item.location || 'حي النخيل / الرياض'}</span>
                    </span>
                    <span className="text-amber-400/90 font-bold">
                      المساحة: {item.area || '650 م²'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <button
                    onClick={() => handleEditItem(item, actualIndex)}
                    className="flex-1 md:flex-initial px-5 py-2.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>تعديل العقار</span>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(actualIndex)}
                    className="flex-1 md:flex-initial px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
