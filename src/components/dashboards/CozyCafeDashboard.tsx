import React from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';

export default function CozyCafeDashboard({ content, handleEditItem }: DashboardTemplateProps) {
  const items = content?.items || [];

  return (
    <div className="min-h-full bg-[#fdfbf7] p-8 font-sans" dir="rtl">
      {/* Bento Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-[#8c6b5d] text-[#fdfbf7] rounded-[2.5rem] p-10 flex flex-col justify-center shadow-sm">
          <h1 className="text-4xl font-black mb-3">المقهى الدافئ ☕</h1>
          <p className="text-[#e6e2db] font-medium text-sm">إدارة قائمة القهوة والمخبوزات، ومتابعة الطلبات اليومية بنمط مريح للعين.</p>
        </div>
        <div className="bg-white border-2 border-[#f0ede6] rounded-[2.5rem] p-8 flex items-center justify-center cursor-pointer hover:bg-[#faf8f5] transition-colors shadow-sm">
          <button className="text-[#8c6b5d] font-black text-xl flex items-center gap-3">
            <span className="text-4xl mb-1">+</span> صنف جديد
          </button>
        </div>
      </div>

      {/* Bento Grid layout for Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item: any, i: number) => (
          <div key={i} onClick={() => handleEditItem(item, i)} className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-[#f0ede6] hover:shadow-md hover:border-[#8c6b5d]/30 transition-all cursor-pointer flex flex-col group">
            <div className="relative h-60 rounded-[2rem] overflow-hidden mb-5 bg-[#f5f2eb]">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#8c6b5d] font-black px-4 py-2 rounded-2xl shadow-sm">
                {item.price} ر.س
              </div>
            </div>
            <div className="px-4 pb-3 flex-1 flex flex-col">
              <h2 className="text-xl font-bold text-[#4a3b32] mb-2">{item.name || item.title}</h2>
              <p className="text-[#968a82] text-sm line-clamp-2 leading-relaxed mb-4">{item.description}</p>
              
              <div className="mt-auto border-t border-[#f0ede6] pt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-[#8c6b5d] bg-[#f5f2eb] px-3 py-1.5 rounded-xl">{item.category || 'مشروبات'}</span>
                <span className="text-xs text-[#b0a69f] font-bold">تعديل التقديم ←</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
