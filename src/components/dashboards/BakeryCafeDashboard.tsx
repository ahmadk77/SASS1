import React from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';

export default function BakeryCafeDashboard({ content, handleEditItem }: DashboardTemplateProps) {
  const items = content?.items || [];

  return (
    <div className="min-h-full bg-[#fdfbf7] p-10 font-sans" dir="rtl">
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-[#5c4d43] mb-3">مخبوزات اليوم الطازجة 🥖</h1>
        <p className="text-[#aba198] text-sm">مراقبة المخزون، الدفعات الجديدة، والحلويات اليومية</p>
      </header>

      {/* Warm Pastel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {items.map((item: any, i: number) => {
          const isLowStock = item.stock <= 5;
          return (
            <div key={i} className="bg-white rounded-[2rem] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[#f0ebe1] hover:shadow-lg transition-all flex flex-col cursor-pointer" onClick={() => handleEditItem(item, i)}>
              
              <div className="relative h-48 rounded-3xl overflow-hidden mb-5 bg-[#f5f2eb]">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                
                {/* Fresh Batch / Low Stock Indicator */}
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm ${isLowStock ? 'bg-[#ffecec] text-[#d9534f]' : 'bg-[#eaf5ec] text-[#5cb85c]'}`}>
                    {isLowStock ? `باقي ${item.stock} فقط!` : 'طازج من الفرن'}
                  </span>
                </div>
              </div>

              <div className="px-2 pb-2 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-bold text-[#5c4d43] text-lg">{item.name || item.title}</h2>
                  <span className="font-black text-[#d68c45]">{item.price} ر.س</span>
                </div>
                
                <p className="text-[#aba198] text-xs line-clamp-2 mb-4">
                  {item.description}
                </p>

                <div className="mt-auto pt-4 border-t border-[#f0ebe1] flex justify-between items-center">
                  <span className="text-xs font-bold text-[#8c827a]">الكمية المتوفرة: {item.stock || 0}</span>
                  <button className="bg-[#fcf7f2] text-[#d68c45] hover:bg-[#d68c45] hover:text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors">
                    تعديل
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
