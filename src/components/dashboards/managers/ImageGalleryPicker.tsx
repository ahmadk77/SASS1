import React, { useState } from 'react';
import { Image as ImageIcon, Check, Sparkles, X, Link as LinkIcon, Upload } from 'lucide-react';

interface ImageGalleryPickerProps {
  currentImage?: string;
  currentImages?: string[];
  onSelectImage: (url: string) => void;
  onAddImageToList?: (url: string) => void;
  isMulti?: boolean;
}

const PRESET_GALLERIES = [
  {
    category: 'أزياء وموضة',
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800',
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=800'
    ]
  },
  {
    category: 'فلل وعقارات فاخرة',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1000',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1000',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000'
    ]
  },
  {
    category: 'قهوة ومحمصة',
    images: [
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=800',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800'
    ]
  },
  {
    category: 'مخبوزات وحلويات',
    images: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800',
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800'
    ]
  },
  {
    category: 'وجبات ومأكولات',
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800',
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800'
    ]
  }
];

export default function ImageGalleryPicker({
  currentImage,
  currentImages = [],
  onSelectImage,
  onAddImageToList,
  isMulti = false
}: ImageGalleryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        if (base64Url) {
          onSelectImage(base64Url);
          if (isMulti && onAddImageToList) {
            onAddImageToList(base64Url);
          }
        }
      };
      reader.readAsDataURL(file as Blob);
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-700">صور المعرض والصور البصرية</label>
        <div className="flex items-center gap-2">
          {/* Local Device Upload Button */}
          <label className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
            <Upload size={14} />
            <span>رفع من جهازي 📁</span>
            <input
              type="file"
              accept="image/*"
              multiple={isMulti}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Sparkles size={14} />
            <span>معرض الصور الجاهز 🖼️</span>
          </button>
        </div>
      </div>

      {/* Modal for Preset Gallery */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ImageIcon size={18} />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">معرض صور المنصة والأنشطة</h3>
                  <p className="text-[11px] text-slate-500">اختر صورة جاهزة تناسب مشروعك أو نشاطك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-slate-50/50 px-4 pt-2 gap-2 overflow-x-auto shrink-0">
              {PRESET_GALLERIES.map((gal, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === idx
                      ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {gal.category}
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50/30">
              {PRESET_GALLERIES[activeTab].images.map((url, i) => {
                const isSelected = currentImage === url || currentImages.includes(url);
                return (
                  <div
                    key={i}
                    onClick={() => {
                      onSelectImage(url);
                      if (isMulti && onAddImageToList) {
                        onAddImageToList(url);
                      }
                      setIsOpen(false);
                    }}
                    className={`relative rounded-2xl overflow-hidden border-2 aspect-video group cursor-pointer shadow-sm transition-all hover:scale-[1.02] ${
                      isSelected ? 'border-amber-600 ring-4 ring-amber-600/20' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={url} alt="Gallery item" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs font-bold flex items-center gap-1">
                        <Check size={14} /> اختيار هذه الصورة
                      </span>
                    </div>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shadow">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom URL Footer */}
            <div className="p-4 border-t bg-white flex flex-col sm:flex-row gap-3 items-center shrink-0">
              <div className="relative flex-1 w-full">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LinkIcon size={16} />
                </span>
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="أو أدخل رابط صورة مباشر (https://...)"
                  className="w-full pr-10 pl-4 py-2.5 border rounded-xl text-xs font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (customUrl.trim()) {
                    onSelectImage(customUrl.trim());
                    if (isMulti && onAddImageToList) {
                      onAddImageToList(customUrl.trim());
                    }
                    setCustomUrl('');
                    setIsOpen(false);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                استخدام الرابط المخصص
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
