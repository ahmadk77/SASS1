import React, { useState } from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';
import { 
  Building2, Plus, Search, Edit3, Trash2, Bed, Bath, Home, Sparkles, 
  MapPin, Eye, Tag, Compass, Layers, CheckCircle, Shield
} from 'lucide-react';

export default function ModernApartmentsDashboard({
  content,
  analyticsData,
  orders = [],
  tenant,
  handleAddItem,
  handleEditItem,
  handleDeleteItem,
  handleUpdateItem
}: DashboardTemplateProps) {
  const units = content?.items || [];
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['الكل', ...Array.from(new Set(units.map((unit: any) => unit.category || 'شقق مودرن')))];

  const filteredUnits = units.filter((unit: any) => {
    const matchesCategory = activeCategory === 'الكل' || unit.category === activeCategory;
    const name = unit.title || unit.name || '';
    const desc = unit.description || '';
    const loc = unit.location || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          loc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-10 font-sans text-slate-800 relative overflow-hidden selection:bg-blue-500 selection:text-white" dir="rtl">
      {/* Dynamic Background Glowing Spheres */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner - Glassmorphism */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-white/80 p-6 lg:p-8 rounded-3xl mb-8 shadow-sm shadow-blue-950/5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold shrink-0">
              <Building2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">
                  لوحة الشقق والوحدات السكنية
                </span>
                <span className="text-xs text-slate-400 font-mono">Modern Apartments Admin</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {content?.businessName || tenant?.name || 'مجمع الشقق والوحدات المودرن'}
              </h1>
            </div>
          </div>

          <button
            onClick={handleAddItem}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 transition duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} />
            <span>إضافة شقة جديدة</span>
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200/50">
            <span className="text-slate-500 text-xs block mb-1 font-medium">الوحدات المعروضة</span>
            <span className="text-2xl font-black text-blue-600">{units.length} وحدة</span>
          </div>
          <div className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200/50">
            <span className="text-slate-500 text-xs block mb-1 font-medium">طلبات المعاينة</span>
            <span className="text-2xl font-black text-slate-900">{orders.length} طلب</span>
          </div>
          <div className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200/50">
            <span className="text-slate-500 text-xs block mb-1 font-medium">الجولات افتراضية 3D</span>
            <span className="text-xl font-bold text-cyan-600">متاحة ومفعلة ✨</span>
          </div>
          <div className="bg-slate-100/60 p-4 rounded-2xl border border-slate-200/50">
            <span className="text-slate-500 text-xs block mb-1 font-medium">الزيارات والمشاهدات</span>
            <span className="text-2xl font-black text-blue-600">{analyticsData?.totalVisits || 1850} زائر</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-300 whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالمنطقة، الشارع، أو نوع الشقة..."
            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pr-10 pl-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Grid of Glass Cards */}
      {filteredUnits.length === 0 ? (
        <div className="text-center py-20 bg-white/60 rounded-3xl border border-white text-slate-400 text-sm font-medium">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-blue-400/40" />
          <p>لا توجد شقق مسجلة تطابق خيارات البحث الحالية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
          {filteredUnits.map((unit: any, idx: number) => {
            const actualIndex = units.indexOf(unit);
            return (
              <div
                key={unit.id || idx}
                className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(37,99,235,0.12)] transition-all duration-500 flex flex-col justify-between group"
              >
                <div>
                  {/* Image */}
                  <div className="relative h-52 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                    <img
                      src={unit.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600'}
                      alt={unit.title || unit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Badge 3D */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles size={12} />
                      <span>3D Virtual Tour</span>
                    </div>

                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      {unit.category || 'شقة مودرن'}
                    </span>

                    <div className="absolute bottom-3 right-3 bg-blue-600 text-white font-black text-sm px-3.5 py-1 rounded-xl shadow-md">
                      {unit.price}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-2">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition mb-1">
                      {unit.title || unit.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500 shrink-0" />
                      <span>{unit.location || 'حي الملقا / الرياض'}</span>
                    </p>
                    <p className="text-slate-600 text-xs line-clamp-2 font-light leading-relaxed mb-4">
                      {unit.description}
                    </p>

                    {/* Specs Pills */}
                    <div className="flex items-center justify-between bg-slate-100/80 p-3 rounded-2xl mb-4 text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Bed size={14} className="text-blue-600" />
                          <span>{unit.beds || 3}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath size={14} className="text-blue-600" />
                          <span>{unit.baths || 2}</span>
                        </span>
                      </div>
                      <span className="text-blue-600 font-mono">{unit.area || '180 م²'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 px-2">
                  <button
                    onClick={() => handleEditItem(unit, actualIndex)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl transition duration-200 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>تعديل الشقة</span>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(actualIndex)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition duration-200 cursor-pointer"
                    title="حذف"
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
