import React from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';

export default function FastFoodDashboard({ content, handleEditItem, handleDeleteItem }: DashboardTemplateProps) {
  const items = content?.items || [];

  return (
    <div className="min-h-full bg-slate-950 p-6 font-sans" dir="rtl">
      {/* High-Energy Neon Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_0_40px_-10px_rgba(239,68,68,0.6)]">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight">إدارة الطلبات السريعة ⚡</h1>
          <p className="text-red-100 font-bold mt-1">عروض، وجبات، وتوصيل صاروخي</p>
        </div>
        <button className="bg-black text-white font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95 w-full md:w-auto">
          + وجبة جديدة
        </button>
      </header>

      {/* Dense Grid Layout for Fast Edits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item: any, i: number) => {
          const hasDiscount = item.originalPrice && Number(item.originalPrice) > Number(item.price);
          
          return (
            <div key={i} className="bg-slate-900 border-2 border-slate-800 hover:border-red-500 rounded-2xl overflow-hidden flex flex-col group transition-colors">
              
              <div className="relative h-44 bg-slate-800">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                
                {/* Strike-through Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-black px-2 py-1 rounded-md shadow-lg animate-bounce">
                    عرض حصري!
                  </div>
                )}
                
                {/* Calories Overlay */}
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-1 rounded-md">
                  {item.calories || '550'} kcal
                </div>

                {/* Delivery Time Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-black/90 backdrop-blur-sm text-center py-1.5 text-[10px] font-black text-orange-400 border-t border-red-500/30">
                  ⏱ التوصيل: {item.deliveryTime || '15-20 دقيقة'}
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h2 className="font-black text-white text-base truncate mb-1">{item.name || item.title}</h2>
                <span className="text-slate-400 text-[10px] font-bold truncate block mb-2">{item.description}</span>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-black text-red-500">{item.price} ر.س</span>
                  {hasDiscount && (
                    <span className="text-xs text-slate-500 line-through font-bold">{item.originalPrice} ر.س</span>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button onClick={() => handleEditItem(item, i)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black py-2.5 rounded-xl transition-colors">
                    تعديل الوجبة
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
