import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check, ExternalLink, X, Sparkles, Link as LinkIcon, Edit3 } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  subdomain?: string;
  customDomain?: string;
  explicitUrl?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  siteName,
  subdomain,
  customDomain,
  explicitUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  // Compute live full working URL vs clean domain URL
  const defaultLiveUrl = explicitUrl || (
    customDomain
      ? `https://${customDomain.replace(/^https?:\/\//, '')}`
      : subdomain
      ? `${window.location.origin}/?domain=${subdomain}`
      : window.location.href
  );

  const defaultSubdomainUrl = customDomain
    ? `https://${customDomain.replace(/^https?:\/\//, '')}`
    : subdomain
    ? `https://${subdomain}.bunyan.website`
    : window.location.origin;

  const [activeUrl, setActiveUrl] = useState<string>(defaultLiveUrl);

  // Reset active URL whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setActiveUrl(defaultLiveUrl);
      setIsEditingUrl(false);
    }
  }, [isOpen, defaultLiveUrl]);

  // Generate QR Code when activeUrl changes
  useEffect(() => {
    if (isOpen && canvasRef.current && activeUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        activeUrl,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (err) => {
          if (err) console.error('Failed to generate QR Code:', err);
        }
      );
    }
  }, [isOpen, activeUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPNG = () => {
    setDownloading(true);
    try {
      // Create high resolution canvas for printing (1000x1320 px)
      const hiResCanvas = document.createElement('canvas');
      hiResCanvas.width = 1000;
      hiResCanvas.height = 1320;
      const ctx = hiResCanvas.getContext('2d');

      if (!ctx) return;

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 1320);

      // Draw top header banner
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 0, 1000, 140);

      ctx.font = 'bold 42px Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('منصة بنيان • BUNYAN PLATFORM', 500, 85);

      // Render QR Code onto temp canvas
      const qrCanvas = document.createElement('canvas');
      QRCode.toCanvas(
        qrCanvas,
        activeUrl,
        {
          width: 680,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) {
            console.error(error);
            setDownloading(false);
            return;
          }

          // Draw QR Code onto main high resolution canvas
          ctx.drawImage(qrCanvas, 160, 190, 680, 680);

          // Draw Site Name
          ctx.font = 'bold 46px Arial, sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.fillText(siteName || 'موقعي الإلكتروني', 500, 940);

          // Draw Full URL with background pill
          const urlText = activeUrl;
          ctx.font = 'bold 26px monospace, sans-serif';
          const textWidth = ctx.measureText(urlText).width;
          const pillWidth = Math.min(textWidth + 60, 920);

          ctx.fillStyle = '#f1f5f9';
          if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(500 - pillWidth / 2, 980, pillWidth, 60, 12);
            ctx.fill();
          } else {
            ctx.fillRect(500 - pillWidth / 2, 980, pillWidth, 60);
          }

          ctx.fillStyle = '#2563eb';
          ctx.fillText(urlText.length > 55 ? urlText.substring(0, 52) + '...' : urlText, 500, 1020);

          // Footer note
          ctx.font = '24px Arial, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText('امسح الرمز بواسطة كاميرا الجوال لفتح الموقع مباشرة 📱', 500, 1210);

          // Download trigger
          const link = document.createElement('a');
          link.download = `QR-${siteName || 'bunyan-site'}.png`;
          link.href = hiResCanvas.toDataURL('image/png');
          link.click();
          setDownloading(false);
        }
      );
    } catch (e) {
      console.error(e);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-right text-slate-100 shadow-2xl relative overflow-hidden" dir="rtl">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">رمز الـ QR الكامل للموقع 📱</h3>
              <p className="text-xs text-slate-400">يتضمن الرابط الكامل لفتح الموقع فوراً عند مسحه بالجوال</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preset URL Selector Tabs */}
        {!explicitUrl && (
          <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 text-xs font-bold">
            <button
              onClick={() => {
                setActiveUrl(defaultLiveUrl);
                setIsEditingUrl(false);
              }}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeUrl === defaultLiveUrl && !isEditingUrl
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon size={14} />
              <span>الرابط المباشر الكامل</span>
            </button>
            <button
              onClick={() => {
                setActiveUrl(defaultSubdomainUrl);
                setIsEditingUrl(false);
              }}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeUrl === defaultSubdomainUrl && !isEditingUrl
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={14} />
              <span>دومين الموقع ({subdomain || 'الفرعي'})</span>
            </button>
          </div>
        )}

        {/* QR Display Card */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 text-center flex flex-col items-center justify-center relative mb-5">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200 mb-3 transform hover:scale-105 transition-transform duration-300">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <h4 className="font-black text-white text-base mb-1.5">{siteName}</h4>

          {/* Full URL Box */}
          {isEditingUrl ? (
            <div className="w-full mt-1">
              <input
                type="url"
                value={activeUrl}
                onChange={(e) => setActiveUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-blue-500/80 rounded-xl text-xs font-mono text-blue-300 text-center focus:outline-none direction-ltr"
                placeholder="https://..."
                dir="ltr"
              />
              <p className="text-[10px] text-slate-400 mt-1">تستطيع تعديل أو كتابة أي رابط مخصص للباركود</p>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 text-blue-300 border border-slate-800 text-xs font-mono font-bold direction-ltr overflow-hidden">
              <span className="truncate flex-1 text-left select-all" dir="ltr">
                {activeUrl}
              </span>
              <button
                onClick={() => setIsEditingUrl(true)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 shrink-0 transition-colors cursor-pointer"
                title="تعديل الرابط"
              >
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer active:scale-98"
          >
            <Download size={18} />
            <span>{downloading ? 'جاري تجهيز الصورة...' : 'تنزيل رمز QR بدقة عالية للطباعة 🖼️'}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700/70 cursor-pointer"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copied ? 'تم نسخ الرابط!' : 'نسخ الرابط الكامل'}</span>
            </button>

            <button
              onClick={() => window.open(activeUrl, '_blank')}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700/70 cursor-pointer"
            >
              <ExternalLink size={16} />
              <span>فتح الرابط مباشرة</span>
            </button>
          </div>
        </div>

        {/* Usage Tip */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
          <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>ملاحظة:</strong> الباركود الآن مشفّر برابط الموقع الكامل (مع البرتوكول والبرامترات) ليتمكن أي هاتف من فتح الصفحة مباشرة فوراً.
          </p>
        </div>
      </div>
    </div>
  );
};
