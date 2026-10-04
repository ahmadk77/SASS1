import React, { useState } from 'react';

interface CardImageSliderProps {
  images?: string[];
  mainImage?: string;
  title: string;
  price?: string;
  category?: string;
  aspectRatio?: string; // e.g. "aspect-[4/3]" or "h-64"
  className?: string;
  badgeBg?: string;
}

export const CardImageSlider: React.FC<CardImageSliderProps> = ({
  images,
  mainImage,
  title,
  price,
  category,
  aspectRatio = "aspect-square",
  className = "",
  badgeBg = "bg-black/70 text-white border-white/20"
}) => {
  // Build full list of images for the slider
  const fallbackImages = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80'
  ];

  let gallery: string[] = [];
  if (images && Array.isArray(images) && images.length > 0) {
    gallery = images;
  } else if (mainImage) {
    gallery = [mainImage, ...fallbackImages.filter(img => img !== mainImage).slice(0, 2)];
  } else {
    gallery = fallbackImages.slice(0, 3);
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 30;

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % gallery.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      e.stopPropagation();
      setCurrentIdx((prev) => (prev + 1) % gallery.length);
    } else if (isRightSwipe) {
      e.stopPropagation();
      setCurrentIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
    }
  };

  return (
    <div 
      className={`relative overflow-hidden bg-slate-900 group/card-slider select-none rounded-2xl ${aspectRatio} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img 
        src={gallery[currentIdx] || gallery[0]} 
        alt={title} 
        className="w-full h-full object-cover transition-all duration-300 pointer-events-none" 
      />

      {/* Badges: Price / Category */}
      {price && (
        <div className={`absolute top-4 right-4 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md border z-10 ${badgeBg}`}>
          {price}
        </div>
      )}
      {category && !price && (
        <div className={`absolute top-4 right-4 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md border z-10 ${badgeBg}`}>
          {category}
        </div>
      )}

      {/* Image Counter Badge */}
      {gallery.length > 1 && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-mono border border-white/20 z-10">
          {currentIdx + 1} / {gallery.length}
        </div>
      )}

      {/* Touch Swipe Hint / Hover Arrow Controls */}
      {gallery.length > 1 && (
        <>
          <button 
            type="button"
            onClick={prevImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white w-9 h-9 rounded-full flex items-center justify-center text-xl backdrop-blur-md transition-all opacity-80 md:opacity-0 group-hover/card-slider:opacity-100 z-20 shadow-lg border border-white/10"
            aria-label="الصورة السابقة"
          >
            ›
          </button>
          <button 
            type="button"
            onClick={nextImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white w-9 h-9 rounded-full flex items-center justify-center text-xl backdrop-blur-md transition-all opacity-80 md:opacity-0 group-hover/card-slider:opacity-100 z-20 shadow-lg border border-white/10"
            aria-label="الصورة التالية"
          >
            ‹
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {gallery.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {gallery.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIdx(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
