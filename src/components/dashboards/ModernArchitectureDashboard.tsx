import React from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';

export default function ModernArchitectureDashboard({ content, handleEditItem }: DashboardTemplateProps) {
  const blueprints = content?.items || [];

  return (
    <div className="min-h-full bg-white p-12" dir="rtl">
      <header className="border-b-2 border-black pb-4 mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-black tracking-tighter uppercase">STUDIO</h1>
          <p className="text-zinc-500 mt-2 text-sm tracking-widest uppercase">Architectural Concepts & Blueprints</p>
        </div>
        <button className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-full text-2xl hover:scale-110 transition-transform">
          +
        </button>
      </header>

      {/* Asymmetrical Grid layout suitable for blueprints */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {blueprints.map((blueprint: any, i: number) => (
          <div key={i} className={`flex flex-col cursor-pointer ${i % 3 === 0 ? 'md:col-span-2 xl:col-span-2' : ''}`} onClick={() => handleEditItem(blueprint, i)}>
            
            <div className={`relative bg-zinc-100 mb-4 border border-zinc-200 overflow-hidden ${i % 3 === 0 ? 'aspect-video' : 'aspect-square'}`}>
              <img src={blueprint.image} alt={blueprint.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700" />
              <div className="absolute top-0 left-0 bg-white border-b border-r border-zinc-200 p-2 text-[10px] font-mono text-black font-black">
                {String(i + 1).padStart(2, '0')} // {blueprint.category || 'CONCEPT'}
              </div>
            </div>

            <div className="pr-2 border-r-2 border-black">
              <h2 className="text-2xl font-black text-black mb-1">{blueprint.title}</h2>
              <p className="text-zinc-500 text-xs font-medium max-w-sm line-clamp-2 mb-2">{blueprint.description}</p>
              <span className="font-mono text-xs font-black text-black block">{blueprint.area || '0'} SQM</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
