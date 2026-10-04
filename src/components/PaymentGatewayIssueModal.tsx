import React from 'react';
import { X, AlertTriangle, MessageCircle, ExternalLink, ShieldAlert } from 'lucide-react';

interface PaymentGatewayIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMessage?: string;
  templateName?: string;
}

export const PaymentGatewayIssueModal: React.FC<PaymentGatewayIssueModalProps> = ({
  isOpen,
  onClose,
  customMessage,
  templateName
}) => {
  if (!isOpen) return null;

  const defaultMsgText = templateName 
    ? `اريد الاشتراك بقالب (${templateName}) هل يمكنني معرفة التفاصيل`
    : `اريد الاشتراك بقالب هل يمكنني معرفة التفاصيل`;

  const whatsappUrl = `https://wa.me/962778091269?text=${encodeURIComponent(defaultMsgText)}`;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full text-right text-slate-100 shadow-2xl relative overflow-hidden"
        dir="rtl"
      >
        {/* Top Accent Warning Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600" />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">توجد مشكلة مؤقتة في بوابة الدفع ⚠️</h3>
              <p className="text-xs text-amber-400 font-bold mt-0.5">الصيانة والدفع المباشر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Main Notice Box */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed font-bold space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
              <ShieldAlert size={18} className="shrink-0 text-amber-400" />
              <span>تنبيه هائم من الإدارة:</span>
            </div>
            <p className="text-slate-200">
              {customMessage || 'توجد مشكلة مؤقتة حالياً في بوابة الدفع المباشر، جاري العمل على حلها بأسرع وقت.'}
            </p>
            <p className="text-slate-300">
              يمكنك الدفع وإكمال اشتراكك فوراً بدون أي تأخير عن طريق التواصل المباشر مع إدارة المنصة.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-98"
            >
              <MessageCircle size={20} className="fill-white/20" />
              <span>تواصل مع إدارة المنصة 💬</span>
              <ExternalLink size={16} className="shrink-0" />
            </a>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

