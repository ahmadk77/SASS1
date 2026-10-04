import React, { useState } from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';
import { 
  Building, Plus, Search, Edit3, Trash2, TrendingUp, Layers, MapPin, 
  Eye, Tag, ShieldCheck, DollarSign, PieChart, Briefcase, Table, LayoutGrid
} from 'lucide-react';

export default function CommercialAgencyDashboard({
  content,
  analyticsData,
  orders = [],
  tenant,
  handleAddItem,
  handleEditItem,
  handleDeleteItem,
  handleUpdateItem
}: DashboardTemplateProps) {
  const assets = content?.items || [];
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const categories = ['الكل', ...Array.from(new Set(assets.map((asset: any) => asset.category || 'عقارات تجارية')))];

  const filteredAssets = assets.filter((asset: any) => {
    const matchesCategory = activeCategory === 'الكل' || asset.category === activeCategory;
    const name = asset.title || asset.name || '';
    const desc = asset.description || '';
    const loc = asset.location || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          loc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-full bg-[#f4f7fb] p-6 lg:p-10 font-sans text-slate-800 selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Corporate Executive Header */}
      <div className="bg-slate-900 text-white p-6 lg:p-8 rounded-3xl mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-bold shrink-0">
              <Briefcase size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-0.5 rounded-full border border-blue-500/20">
                  إدارة الأصول والاستثمارات التجارية
                </span>
                <span className="text-xs text-slate-400 font-mono">Commercial Agency Admin</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                {content?.businessName || tenant?.name || 'وكالة العقارات والاستثمار التجاري'}
              </h1>
            </div>
          </div>

          <button
            onClick={handleAddItem}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-xl shadow-blue-600/30 transition duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} />
            <span>إضافة أصل تجاري جديد</span>
          </button>
        </div>

        {/* Corporate ROI & Asset Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1 font-medium">الأصول التجاريّة</span>
            <span className="text-2xl font-black text-blue-400">{assets.length} أصل</span>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1 font-medium">متوسط العائد المتوقع (ROI)</span>
            <span className="text-2xl font-black text-emerald-400">+8.8% سنوياً</span>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1 font-medium">نسبة الإشغال الإجمالية</span>
            <span className="text-xl font-bold text-white">92% مكتملة</span>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 text-xs block mb-1 font-medium">المعاينات الاستثمارية</span>
            <span className="text-2xl font-black text-blue-400">{orders.length} استفسار</span>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Toggle Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition duration-300 whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & View Switch */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم الأصل أو الموقع..."
              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 pr-10 pl-4 py-2.5 rounded-xl focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              title="عرض الجدول"
            >
              <Table size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              title="عرض الشبكة"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm font-medium">
          <Building className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>لا توجد أصول تجارية مسجلة تطابق خيارات البحث الحالية.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Executive Data Table */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">الأصل التجاري</th>
                  <th className="px-6 py-4">الموقع والاستخدام</th>
                  <th className="px-6 py-4">المساحة (م²)</th>
                  <th className="px-6 py-4">العائد المتوقع (ROI)</th>
                  <th className="px-6 py-4">السعر / الإيجار</th>
                  <th className="px-6 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset: any, idx: number) => {
                  const actualIndex = assets.indexOf(asset);
                  return (
                    <tr key={asset.id || idx} className="hover:bg-blue-50/40 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={asset.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400'}
                            alt={asset.title || asset.name}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="block font-bold text-slate-900 text-base">{asset.title || asset.name}</span>
                            <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mt-1 inline-block">
                              {asset.category || 'مكاتب تجارية'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin size={14} className="text-blue-600 shrink-0" />
                          <span>{asset.location || 'طريق الملك فهد / الرياض'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-mono font-bold text-xs">
                        {asset.area || '1,200 م²'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
                          <TrendingUp size={12} />
                          <span>{asset.roi || '+8.5%'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-blue-600 text-base font-mono">
                        {asset.price}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditItem(asset, actualIndex)}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 font-bold text-xs bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            <Edit3 size={14} />
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => handleDeleteItem(actualIndex)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Corporate Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssets.map((asset: any, idx: number) => {
            const actualIndex = assets.indexOf(asset);
            return (
              <div
                key={asset.id || idx}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                    <img
                      src={asset.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400'}
                      alt={asset.title || asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      {asset.category || 'عقار تجاري'}
                    </span>
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <TrendingUp size={12} />
                      <span>ROI {asset.roi || '+8.5%'}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition mb-1">
                    {asset.title || asset.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <MapPin size={12} className="text-blue-600 shrink-0" />
                    <span>{asset.location || 'طريق الملك فهد / الرياض'}</span>
                  </p>
                  <p className="text-slate-600 text-xs line-clamp-2 font-light leading-relaxed mb-4">
                    {asset.description}
                  </p>

                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl mb-4 text-xs font-bold text-slate-700">
                    <span>المساحة الإجمالية:</span>
                    <span className="text-blue-600 font-mono">{asset.area || '1,200 م²'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="font-black text-blue-600 text-base font-mono">{asset.price}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditItem(asset, actualIndex)}
                      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer"
                    >
                      <Edit3 size={14} />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDeleteItem(actualIndex)}
                      className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
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
    </div>
  );
}
