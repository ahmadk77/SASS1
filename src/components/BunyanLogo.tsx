import React from 'react';

interface BunyanLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'light-text';
}

export const BunyanLogo: React.FC<BunyanLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: { main: 'text-sm', sub: 'text-[9px]' },
    md: { main: 'text-xl', sub: 'text-[11px]' },
    lg: { main: 'text-2xl', sub: 'text-[13px]' },
    xl: { main: 'text-4xl', sub: 'text-[18px]' },
  };

  const textColor = variant === 'light-text' ? 'text-white' : 'text-slate-900';
  const subTextColor = variant === 'light-text' ? 'text-blue-400' : 'text-blue-600';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`} dir="ltr">
      {/* 3D Isometric Bunyan Icon */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="bunyanBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0066FF" />
              <stop offset="1" stopColor="#002999" />
            </linearGradient>
            <linearGradient id="topFaceGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="sideLeftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#CBD5E1" />
              <stop offset="1" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="sideRightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#E2E8F0" />
              <stop offset="1" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* Rounded Blue App Icon Container */}
          <rect width="120" height="120" rx="30" fill="url(#bunyanBg)" />

          {/* Bottom Isometric Layer */}
          <g transform="translate(0, 18)">
            {/* Top Face */}
            <path d="M60 52 L90 67 L60 82 L30 67 Z" fill="url(#topFaceGrad)" />
            {/* Left Side */}
            <path d="M30 67 L60 82 L60 94 L30 79 Z" fill="url(#sideLeftGrad)" />
            {/* Right Side */}
            <path d="M60 82 L90 67 L90 79 L60 94 Z" fill="url(#sideRightGrad)" />
          </g>

          {/* Middle Isometric Layer */}
          <g transform="translate(0, 3)">
            {/* Top Face */}
            <path d="M60 38 L84 50 L60 62 L36 50 Z" fill="url(#topFaceGrad)" />
            {/* Left Side */}
            <path d="M36 50 L60 62 L60 71 L36 59 Z" fill="url(#sideLeftGrad)" />
            {/* Right Side */}
            <path d="M60 62 L84 50 L84 59 L60 71 Z" fill="url(#sideRightGrad)" />
          </g>

          {/* Top Isometric Diamond */}
          <g transform="translate(0, -9)">
            {/* Top Face */}
            <path d="M60 26 L74 33 L60 40 L46 33 Z" fill="url(#topFaceGrad)" />
            {/* Left Side */}
            <path d="M46 33 L60 40 L60 46 L46 39 Z" fill="url(#sideLeftGrad)" />
            {/* Right Side */}
            <path d="M60 40 L74 33 L74 39 L60 46 Z" fill="url(#sideRightGrad)" />
          </g>
        </svg>
      </div>

      {/* Brand Text */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col justify-center leading-none tracking-tight">
          <span className={`font-black tracking-tighter ${textColor} ${textSizes[size].main}`} style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em' }}>
            BUNYAN
          </span>
          <span className={`font-extrabold tracking-[0.28em] ${subTextColor} ${textSizes[size].sub} mt-0.5`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            COMMERCE
          </span>
        </div>
      )}
    </div>
  );
};

export default BunyanLogo;
