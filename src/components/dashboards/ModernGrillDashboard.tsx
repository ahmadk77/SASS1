import React, { useState } from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';
import { Flame, Plus, Search, Edit3, Trash2, Clock, Eye, Sparkles, Filter, ShieldCheck, Tag } from 'lucide-react';

export default function ModernGrillDashboard({ content, handleEditItem, handleDeleteItem }: DashboardTemplateProps) {
  const items = content?.items || content?.menuItems || [];
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['الكل', ...Array.from(new Set(items.map((item: any) => item.category || 'أخرى')))];

  const filteredItems = items.filter((item: any) => {
    const matchesCategory = activeCategory === 'الكل' || item.category === activeCategory;
    const name = item.name || item.title || '';
    const desc = item.description || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-full bg-[#121212] p-6 lg:p-10 font-sans text-zinc-100 selection:bg-orange-500 selection:text-black" dir="rtl">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black border border-orange-500/30 p-6 lg:p-8 rounded-2xl mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-black font-bold">
              <Flame size={28} className="fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                  لوحة تحكم المشاوي المدخنة
                </span>
                <span className="text-xs text-zinc-400 font-mono">Modern Grill Admin</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">إدارة قائمة الأطباق والمشويات</h1>
            </div>
          </div>

          <button
            onClick={() => handleEditItem(null, -1)}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} />
            <span>إضافة طبق مشوي جديد</span>
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-400 text-xs font-medium block mb-1">إجمالي الأطباق في القائمة</span>
            <span className="text-2xl font-black text-orange-500">{items.length}</span>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-400 text-xs font-medium block mb-1">الأقسام المتاحة</span>
            <span className="text-2xl font-black text-amber-400">{categories.length - 1}</span>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-400 text-xs font-medium block mb-1">الأكثر طلباً 🔥</span>
            <span className="text-xl font-bold text-zinc-100 truncate block">ستيك ريب آي / أضلاع</span>
          </div>
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-400 text-xs font-medium block mb-1">متوسط التحضير</span>
            <span className="text-xl font-bold text-zinc-100">20 دقيقة</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-300 whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن طبق أو مكونات..."
            className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 pr-10 pl-4 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 transition"
          />
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-sm">
          لا توجد أطباق تطابق خيارات البحث الحالية.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item: any, idx: number) => {
            const actualIndex = items.indexOf(item);
            return (
              <div
                key={item.id || idx}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/50 rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col justify-between shadow-xl"
              >
                <div>
                  {/* Card Image Header */}
                  <div className="relative h-52 bg-black overflow-hidden">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400'}
                      alt={item.name || item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                    {/* Category Badge */}
                    <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md text-orange-400 text-[11px] font-bold px-3 py-1 rounded-full border border-orange-500/30 flex items-center gap-1">
                      <Tag size={12} />
                      <span>{item.category || 'مشويات'}</span>
                    </span>

                    {/* Badge */}
                    {item.badge && (
                      <span className="absolute top-3 left-3 bg-orange-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                        {item.badge}
                      </span>
                    )}

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-sm px-3.5 py-1 rounded-lg shadow-lg">
                      {item.price}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400 transition mb-2">
                      {item.name || item.title}
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-4 font-light">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-orange-500" />
                        <span>{item.prepTime || '20 دقيقة'}</span>
                      </span>
                      {item.calories && (
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                          {item.calories}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleEditItem(item, actualIndex)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-orange-500 hover:text-black text-zinc-200 text-xs font-bold py-2 px-3 rounded-xl transition duration-200 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>تعديل الطبق</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(actualIndex)}
                    className="p-2 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl transition duration-200 cursor-pointer"
                    title="حذف الطبق"
                  >
                    <Trash2 size={16} />
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
