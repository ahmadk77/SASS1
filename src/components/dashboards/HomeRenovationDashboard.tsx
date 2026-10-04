import React from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';

export default function HomeRenovationDashboard({ content, handleEditItem }: DashboardTemplateProps) {
  const projects = content?.items || [];

  return (
    <div className="min-h-full bg-[#f8f7f5] p-10 font-sans" dir="rtl">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-[#2c3e35]">مشاريع التجديد والديكور</h1>
        <p className="text-[#64766b] mt-2 font-medium">سجل الأعمال، التصاميم الداخلية، وحالات التنفيذ</p>
      </header>

      {/* Task/Project Checklist Style Layout */}
      <div className="space-y-6 max-w-5xl">
        {projects.map((project: any, i: number) => (
          <div key={i} className="bg-white border-2 border-[#e8e6e1] rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-center hover:border-[#4a6b5d] transition-colors">
            
            {/* Conceptual Before/After Layout (Using single image here but styled to look structural) */}
            <div className="w-full md:w-64 h-32 rounded-xl overflow-hidden bg-[#e8e6e1] relative shrink-0 border border-[#d3d0c8]">
              <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 bg-[#2c3e35] text-white text-[10px] font-bold px-3 py-1 rounded-tr-lg">النتيجة النهائية</div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-[#2c3e35]">{project.title}</h2>
                <span className="bg-[#eef2f0] text-[#4a6b5d] text-xs font-bold px-3 py-1 rounded-full border border-[#d2ddd7]">
                  {project.status || 'قيد التنفيذ'}
                </span>
              </div>
              <p className="text-sm text-[#64766b] mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex justify-between items-center border-t border-[#e8e6e1] pt-4">
                <div className="text-xs text-[#8c9c93] font-bold">الميزانية: <span className="text-[#2c3e35]">{project.budget || 'غير محدد'}</span></div>
                <button onClick={() => handleEditItem(project, i)} className="text-[#4a6b5d] font-bold text-sm hover:underline underline-offset-4">
                  تحديث حالة المشروع ←
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
