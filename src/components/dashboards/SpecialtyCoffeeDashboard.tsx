import React from 'react';
import { DashboardTemplateProps } from './DashboardTemplateRegistry';

export default function SpecialtyCoffeeDashboard({ content, handleEditItem }: DashboardTemplateProps) {
  const items = content?.items || [];

  return (
    <div className="min-h-full bg-zinc-950 p-8 font-sans" dir="rtl">
      {/* Industrial Header */}
      <header className="border-b-2 border-amber-600/30 pb-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-zinc-100 tracking-tight">المحمصة والمقهى المختص</h1>
          <p className="text-amber-500/70 font-mono text-xs mt-2 uppercase tracking-widest">BATCH & INVENTORY MANAGEMENT</p>
        </div>
        <button className="bg-amber-600/10 text-amber-500 border border-amber-600/50 hover:bg-amber-600 hover:text-zinc-950 font-bold px-5 py-2 rounded-md transition-all text-xs">
          + محصول جديد
        </button>
      </header>

      {/* Scientific Data Table Layout */}
      <div className="space-y-4">
        {items.map((item: any, i: number) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 hover:border-amber-600/40 p-4 flex items-center gap-6 rounded-lg transition-colors cursor-pointer" onClick={() => handleEditItem(item, i)}>
            
            <div className="w-20 h-20 bg-zinc-800 rounded-md overflow-hidden shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" />
            </div>

            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-zinc-200 text-lg">{item.name || item.title}</h2>
                  {item.category && <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded font-mono">{item.category}</span>}
                </div>
                <p className="text-zinc-500 text-xs truncate">{item.description}</p>
              </div>

              {/* Tasting Notes / Origin Chips */}
              <div className="flex flex-wrap gap-1.5">
                {item.tags?.slice(0, 3).map((tag: string, idx: number) => (
                  <span key={idx} className="bg-amber-900/20 text-amber-400 border border-amber-900/50 text-[9px] px-2 py-0.5 rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-left">
                <span className="block font-mono text-lg font-bold text-amber-500">{item.price} SAR</span>
                <span className="text-[10px] text-zinc-500 font-mono">Stock: {item.stock || '∞'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
