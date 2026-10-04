import React from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';
import { Plus, Trash2, Edit, HardHat, Building, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function HeavyConstructionDashboard({
  content,
  analyticsData,
  orders,
  tenant,
  handleAddItem,
  handleEditItem,
  handleDeleteItem,
  handleUpdateItem,
  dashboardColor,
  setActiveTab
}: DashboardTemplateProps) {
  const items = content?.items || [];

  return (
    <div className="space-y-8 pb-12 font-sans text-stone-900 bg-amber-50/40 min-h-full p-6" dir="rtl">
      {/* Brutalist Yellow/Black Blocky Header */}
      <div className="rounded-3xl p-8 bg-stone-900 border-4 border-yellow-400 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-yellow-400 text-stone-950 text-xs font-black mb-3">
              <HardHat size={15} /> <span>المقاولات والإنشاءات الثقيلة والهندسة</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              {content?.businessName || tenant?.name || 'شركة المقاولات العامة'}
            </h1>
            <p className="text-stone-300 text-sm mt-2 font-bold">
              لوحة تحكم بروتالية (Brutalist)، مشاريع كبرى، نسب إنجاز ثقيلة، ومتابعة المراحل الإنشائية.
            </p>
          </div>
          <button
            onClick={handleAddItem}
            className="px-6 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Plus size={16} /> <span>إضافة مشروع هندسي جديد</span>
          </button>
        </div>

        {/* Brutalist Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t-2 border-stone-800 font-mono">
          <div className="bg-stone-950 p-4 rounded-2xl border-2 border-yellow-400/40">
            <span className="text-xs text-stone-400 font-bold">المشاريع الإنشائية</span>
            <div className="text-2xl font-black text-yellow-400 mt-1">{items.length} مشروع</div>
          </div>
          <div className="bg-stone-950 p-4 rounded-2xl border-2 border-yellow-400/40">
            <span className="text-xs text-stone-400 font-bold">طلبات التسعير</span>
            <div className="text-2xl font-black text-white mt-1">{orders.length} طلب</div>
          </div>
          <div className="bg-stone-950 p-4 rounded-2xl border-2 border-yellow-400/40">
            <span className="text-xs text-stone-400 font-bold">معدل الإنجاز</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">78% مكتمل</div>
          </div>
          <div className="bg-stone-950 p-4 rounded-2xl border-2 border-yellow-400/40">
            <span className="text-xs text-stone-400 font-bold">الزيارات</span>
            <div className="text-2xl font-black text-yellow-400 mt-1">{analyticsData?.totalVisits || 1310} زائر</div>
          </div>
        </div>
      </div>

      {/* Projects with heavy progress bars */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-stone-900 border-r-4 border-yellow-500 pr-3 uppercase">
            سجل المشاريع الإنشائية ونسب الإنجاز
          </h3>
          <span className="text-xs font-bold text-stone-600">{items.length} مشاريع</span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-stone-300 rounded-3xl p-12 text-center text-stone-500">
            <HardHat className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
            <p className="text-sm font-bold">لا توجد مشاريع مضافة</p>
            <button onClick={handleAddItem} className="mt-4 px-4 py-2 bg-yellow-500 text-stone-950 font-bold text-xs rounded-xl">
              إضافة المشروع الأول
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((item: any, index: number) => (
              <div 
                key={item.id || index}
                className="bg-white border-2 border-stone-800 hover:border-yellow-600 rounded-3xl p-6 flex flex-col justify-between shadow-md transition-all"
              >
                <div>
                  {item.image && (
                    <div className="mb-4 overflow-hidden rounded-2xl border border-stone-800">
                      <img src={item.image} alt={item.title} className="w-full h-44 object-cover" />
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-black bg-yellow-400 text-stone-950 px-2.5 py-1 rounded-lg">
                      {item.category || 'إنشاءات كبرى'}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-600">{item.budget || 'مليون ر.س'}</span>
                  </div>
                  <h4 className="font-black text-stone-900 text-lg mb-1">{item.title || item.name}</h4>
                  <p className="text-stone-600 text-xs line-clamp-2 font-medium mb-4">{item.description}</p>

                  {/* Heavy Progress Bar */}
                  <div className="space-y-1.5 bg-stone-100 p-3 rounded-2xl border border-stone-200">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-stone-700">معدل إنجاز المشروع</span>
                      <span className="text-yellow-700 font-mono">{item.status || 'قيد التنفيذ (60%)'}</span>
                    </div>
                    <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-200 flex justify-between items-center">
                  <button
                    onClick={() => handleEditItem(item, index)}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Edit size={14} /> <span>تعديل المشروع</span>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
