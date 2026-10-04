import React, { useState, useEffect } from 'react';
import { X, Sparkles, Flame, CheckCircle2, ArrowLeft, Tag, ShieldCheck } from 'lucide-react';
import { fetchSystemSettings, subscribeSystemSettings, SystemSettings } from '../lib/systemSettingsClient';

interface PromoBannerModalProps {
  onSelectOffer?: () => void;
}

export const PromoBannerModal: React.FC<PromoBannerModalProps> = ({ onSelectOffer }) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('promo_banner_dismissed') === 'true' : false;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(() => fetchSystemSettings(false) as any);

  useEffect(() => {
    if (isDismissed) return;

    // Subscribe to system settings updates
    const unsubscribe = subscribeSystemSettings((s) => {
      setSettings(s);
      
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('promo_banner_dismissed') === 'true' : false;
      if (dismissed || isDismissed) {
        setIsDismissed(true);
        setIsOpen(false);
        return;
      }

      // Auto open if enabled and not dismissed in this session
      if (s.promoBannerEnabled && !dismissed && !isDismissed) {
        // Small delay so user sees initial page render smoothly
        const timer = setTimeout(() => {
          if (!sessionStorage.getItem('promo_banner_dismissed')) {
            setIsOpen(true);
          }
        }, 800);
        return () => clearTimeout(timer);
      } else if (!s.promoBannerEnabled) {
        setIsOpen(false);
      }
    });

    return () => unsubscribe();
  }, [isDismissed]);

  if (!isOpen || !settings.promoBannerEnabled || isDismissed) return null;

  const handleClose = () => {
    setIsOpen(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('promo_banner_dismissed', 'true');
    }
  };

  const handleAction = () => {
    handleClose();
    if (onSelectOffer) {
      onSelectOffer();
    } else if (settings.promoBannerBtnLink) {
      if (settings.promoBannerBtnLink.startsWith('#')) {
        const el = document.querySelector(settings.promoBannerBtnLink);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.location.href = settings.promoBannerBtnLink;
      }
    }
  };

  const isRedTheme = !settings.promoBannerTheme || settings.promoBannerTheme === 'red';
  const isPurpleTheme = settings.promoBannerTheme === 'purple';
  const isAmberTheme = settings.promoBannerTheme === 'amber';
  const isEmeraldTheme = settings.promoBannerTheme === 'emerald';

  // Dynamic Theme Colors
  const headerBg = isRedTheme
    ? 'from-red-600 via-rose-600 to-amber-600'
    : isPurpleTheme
    ? 'from-purple-600 via-indigo-600 to-pink-600'
    : isAmberTheme
    ? 'from-amber-500 via-orange-600 to-red-600'
    : 'from-emerald-600 via-teal-600 to-cyan-600';

  const badgeBg = isRedTheme
    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
    : isPurpleTheme
    ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
    : isAmberTheme
    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';

  const btnBg = isRedTheme
    ? 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-600/30'
    : isPurpleTheme
    ? 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
    : isAmberTheme
    ? 'from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-600/30'
    : 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30';

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm sm:max-w-md w-full text-right text-slate-100 shadow-2xl relative overflow-hidden transform animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Animated Background Pulse Glow */}
        <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-2xl opacity-25 ${
          isRedTheme ? 'bg-rose-600' : isPurpleTheme ? 'bg-purple-600' : isAmberTheme ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />

        {/* Compact Top Header Banner */}
        <div className={`bg-gradient-to-r ${headerBg} px-5 py-4 relative text-white text-center shadow-md`}>
          <button
            onClick={handleClose}
            className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs"
            title="إغلاق العرض"
          >
            <X size={16} />
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-[11px] font-black text-amber-200 mb-1.5">
            <Flame size={13} className="text-amber-300 animate-bounce" />
            <span>{settings.promoBannerBadge || 'عرض خاص لفترة محدودة ⚡'}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug text-white drop-shadow-xs">
            {settings.promoBannerTitle || 'اشتراك في أي قالب بـ $30 فقط! 🔥'}
          </h3>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 relative z-10">
          {/* Main Price Highlight Box */}
          <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <span className="text-slate-400 text-xs sm:text-sm line-through font-mono font-bold">$150 / سنة</span>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent font-black text-2xl sm:text-3xl font-mono">
                $30 فقط 🚀
              </span>
            </div>

            <p className="text-slate-300 font-bold text-xs leading-relaxed">
              {settings.promoBannerMessage || 'اختر أي قالب واشترك بـ 30$ فقط بدون مصاريف خفية!'}
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-around text-[10px] text-slate-400 font-bold">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>شامل الدومين والسيرفر</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>لوحة تحكم كاملة</span>
              </div>
            </div>
          </div>

          {/* Subtext */}
          {settings.promoBannerSubtext && (
            <p className="text-[11px] text-slate-400 leading-snug text-center px-1">
              {settings.promoBannerSubtext}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleAction}
              className={`w-full py-3 px-4 bg-gradient-to-r ${btnBg} text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98 group`}
            >
              <Sparkles size={16} className="text-amber-300 animate-spin-slow" />
              <span>{settings.promoBannerBtnText || 'اختر قالبك واشترك بـ $30 الآن 🎯'}</span>
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform rotate-0" />
            </button>

            <button
              onClick={handleClose}
              className="w-full py-1.5 px-3 bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              إغلاق وإكمال التصفح
            </button>
          </div>

          {/* Guarantee Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold text-center pt-0.5">
            <ShieldCheck size={13} className="text-blue-400" />
            <span>ضمان استرجاع الأموال والدعم الفني متوفر 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};
