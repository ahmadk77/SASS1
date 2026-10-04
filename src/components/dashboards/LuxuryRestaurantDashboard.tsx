import React, { useState } from 'react';
import { 
  Sparkles, Plus, Trash2, Edit3, UtensilsCrossed, Crown, 
  Award, AlertCircle, Search, Flame
} from 'lucide-react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';

export default function LuxuryRestaurantDashboard({ 
  content, 
  handleAddItem, 
  handleEditItem, 
  handleDeleteItem, 
  handleUpdateItem 
}: DashboardTemplateProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const items = content?.items || [];

  // Extract categories dynamically
  const categories = ['all', ...Array.from(new Set(items.map((it: any) => it.category).filter(Boolean)))];

  // Filter items
  const filteredItems = items.filter((item: any) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Analytics counts
  const totalItems = items.length;
  const chefSpecialsCount = items.filter((i: any) => i.isChefSpecial || i.badge?.includes('شيف') || i.isSpecial).length;

  return (
    <div className="min-h-full bg-[#0a0a0a] text-zinc-100 p-6 md:p-10 font-serif" dir="rtl">
      {/* Top Header */}
      <header className="border-b border-[#cfb53b]/30 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#cfb53b] text-xs font-sans tracking-widest uppercase mb-2">
            <Crown size={14} className="text-[#cfb53b]" />
            <span>لوحة التحكم الخاصة • إدارة المأكولات الراقية</span>
          </div>
          <h1 className="text-3xl md:text-5xl text-[#cfb53b] font-light tracking-widest flex items-center gap-3">
            القائمة الفاخرة
          </h1>
          <p className="text-zinc-500 mt-2 text-sm font-sans tracking-wide max-w-xl leading-relaxed">
            استعرض وتبرّع بضبط هندسة أطباقك الاستثنائية، تجارب التذوق، المكونات، وتوصيات الشيف الفاخرة.
          </p>
        </div>

        <button 
          onClick={handleAddItem}
          className="inline-flex items-center gap-2 bg-[#cfb53b] text-black font-sans font-semibold px-6 py-3 hover:bg-[#e2c74d] transition-all duration-300 text-xs tracking-wider shadow-lg shadow-[#cfb53b]/10 rounded-sm cursor-pointer hover:scale-[1.02]"
        >
          <Plus size={16} />
          <span>+ إضافة طبق فاخر</span>
        </button>
      </header>

      {/* Luxury Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 font-sans">
        <div className="bg-[#111111] border border-zinc-800/80 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">إجمالي الأطباق</p>
            <p className="text-2xl font-light text-[#cfb53b] mt-0.5">{totalItems}</p>
          </div>
          <UtensilsCrossed size={20} className="text-zinc-700" />
        </div>

        <div className="bg-[#111111] border border-zinc-800/80 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">توصيات الشيف</p>
            <p className="text-2xl font-light text-[#cfb53b] mt-0.5">{chefSpecialsCount}</p>
          </div>
          <Award size={20} className="text-[#cfb53b]/60" />
        </div>

        <div className="bg-[#111111] border border-zinc-800/80 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">التصنيفات</p>
            <p className="text-2xl font-light text-zinc-300 mt-0.5">{Math.max(categories.length - 1, 0)}</p>
          </div>
          <Flame size={20} className="text-zinc-700" />
        </div>

        <div className="bg-[#111111] border border-zinc-800/80 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">حالة القائمة</p>
            <p className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              مفعلة مباشرة
            </p>
          </div>
          <Sparkles size={20} className="text-emerald-500/50" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 pb-4 border-b border-zinc-900 font-sans">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-medium tracking-wider transition-all whitespace-nowrap rounded-sm border ${
                activeCategory === cat
                  ? 'bg-[#cfb53b] text-black border-[#cfb53b] font-bold shadow-md shadow-[#cfb53b]/10'
                  : 'bg-[#121212] text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat === 'all' ? 'جميع الأطباق' : cat}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الأطباق والمكونات..."
            className="w-full bg-[#121212] border border-zinc-800 text-xs text-zinc-200 pr-9 pl-4 py-2.5 rounded-sm focus:outline-none focus:border-[#cfb53b] transition-colors placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Items Container - Large Horizontal Hero-style Cards */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] border border-dashed border-zinc-800 rounded-sm font-sans p-8">
          <UtensilsCrossed size={40} className="mx-auto text-zinc-700 mb-4 stroke-[1]" />
          <p className="text-zinc-400 text-base font-light">لا توجد أطباق تطابق خيارات البحث الحالية</p>
          <p className="text-zinc-600 text-xs mt-1">قم بإضافة طبق جديد أو تعديل فلتر البحث لاستعراض تشكيلتك الفاخرة.</p>
          <button
            onClick={handleAddItem}
            className="mt-6 inline-flex items-center gap-2 bg-transparent text-[#cfb53b] border border-[#cfb53b]/50 px-5 py-2 hover:bg-[#cfb53b] hover:text-black transition-all text-xs tracking-wider cursor-pointer"
          >
            <Plus size={14} />
            <span>إضافة طبق الآن</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredItems.map((item: any, i: number) => {
            const isChef = item.isChefSpecial || item.badge?.includes('شيف') || item.isSpecial;
            const allergensList = Array.isArray(item.allergens) 
              ? item.allergens 
              : (typeof item.allergens === 'string' && item.allergens.trim() ? item.allergens.split('،') : []);

            return (
              <div 
                key={item.id || i} 
                className="flex flex-col md:flex-row bg-[#111111] border border-zinc-800/90 hover:border-[#cfb53b]/60 transition-all duration-500 rounded-sm overflow-hidden group shadow-2xl relative"
              >
                {/* Visual Anchor: 1/3 Width Dish Image */}
                <div className="md:w-1/3 relative h-64 md:h-auto min-h-[220px] bg-zinc-950 overflow-hidden shrink-0">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name || item.title} 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 bg-gradient-to-br from-zinc-950 to-zinc-900">
                      <UtensilsCrossed size={36} className="stroke-[1] mb-2" />
                      <span className="text-[11px] font-sans tracking-widest uppercase text-zinc-600">طعام فاخر</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#111111] via-transparent to-transparent opacity-80" />

                  {/* Category Pill on Image */}
                  {item.category && (
                    <span className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-zinc-300 border border-zinc-700/80 px-3 py-1 text-[10px] font-sans tracking-widest rounded-sm uppercase">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Content Area: 2/3 Width */}
                <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between relative">
                  <div>
                    {/* Header Row: Title & Price */}
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-3 border-b border-zinc-900">
                      <div>
                        <h2 className="text-2xl md:text-3xl text-zinc-100 font-light tracking-wide group-hover:text-[#cfb53b] transition-colors duration-300">
                          {item.name || item.title}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl md:text-3xl text-[#cfb53b] font-light font-mono tracking-tight block">
                          {item.price}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-zinc-400 font-sans text-sm md:text-base leading-relaxed max-w-2xl mb-6 font-light">
                      {item.description || 'لا يوجد وصف متاح للطبق حتى الآن.'}
                    </p>

                    {/* Badges, Chef Specials & Allergens */}
                    <div className="flex flex-wrap items-center gap-3 mb-6 font-sans">
                      {isChef && (
                        <div className="inline-flex items-center gap-1.5 text-[#cfb53b] bg-[#cfb53b]/10 border border-[#cfb53b]/40 px-3 py-1 rounded-sm text-[11px] font-medium tracking-wider uppercase">
                          <Crown size={12} className="text-[#cfb53b]" />
                          <span>توصية الشيف</span>
                        </div>
                      )}

                      {allergensList.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-3 py-1 rounded-sm text-[11px] font-light">
                          <AlertCircle size={12} className="text-amber-500/80 shrink-0" />
                          <span>مسببات الحساسية: {Array.isArray(allergensList) ? allergensList.join('، ') : allergensList}</span>
                        </div>
                      )}

                      {item.calories && (
                        <div className="inline-flex items-center gap-1 text-zinc-500 text-[11px] bg-zinc-950 px-2.5 py-1 rounded-sm border border-zinc-800/60">
                          <Flame size={11} className="text-orange-400" />
                          <span>{item.calories} سُعرة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-900/90 font-sans">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleEditItem(item, i)} 
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-[#cfb53b] transition duration-300 text-xs tracking-widest border-b border-transparent hover:border-[#cfb53b] pb-0.5 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>تعديل الوصفة</span>
                      </button>

                      <button 
                        onClick={() => handleDeleteItem(item.id ?? i)} 
                        className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-red-400 transition duration-300 text-xs tracking-widest border-b border-transparent hover:border-red-400 pb-0.5 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>إزالة الطبق</span>
                      </button>
                    </div>

                    {handleUpdateItem && (
                      <button
                        onClick={() => handleUpdateItem(item.id ?? i, 'isChefSpecial', !isChef)}
                        className={`text-[11px] px-3 py-1 transition-all rounded-sm border cursor-pointer ${
                          isChef 
                            ? 'text-[#cfb53b] border-[#cfb53b]/30 hover:bg-[#cfb53b]/10' 
                            : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                        }`}
                        title="تبديل توصية الشيف"
                      >
                        {isChef ? '★ تمييز كـ توصية شيف' : '☆ تظليل كتوصية شيف'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
