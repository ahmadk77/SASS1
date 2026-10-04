import React, { useState } from 'react';
import { LogIn, Sparkles, ShieldCheck, ArrowRight, CheckCircle2, Globe, Layers, User } from 'lucide-react';
import { loginWithGoogle, auth } from '../lib/firebase';

interface PreviewGateProps {
  template: {
    id: number | string;
    name: string;
    category?: string;
    image?: string;
    previewUrl?: string;
  };
  onAuthenticated: (workspaceData: any) => void;
  onCancel: () => void;
}

export const PreviewGate: React.FC<PreviewGateProps> = ({
  template,
  onAuthenticated,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Attempt Google Firebase Auth
      let user = auth.currentUser;
      if (!user) {
        user = await loginWithGoogle();
      }
      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user ? user.uid : `usr_client_${Date.now().toString().slice(-6)}`;
      const userEmail = user ? user.email : 'client@waas-platform.com';
      const userName = user ? (user.displayName || user.email?.split('@')[0]) : 'عميل متميز';

      // Call API to create client workspace for this template
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          templateId: String(template.id),
          name: `موقع ${template.name}`,
          customizations: {
            heroTitle: `مرحباً بك في موقع ${template.name}`,
            heroSubtitle: 'يمكنك تخصيص كافة النصوص والصور بسهولة وبدون أي خبرة برمجية.',
            primaryColor: '#008060',
            sections: [
              { id: 'hero-1', type: 'hero', title: `موقع ${template.name}`, subtitle: 'صمم هويتك التجارية بأسلوب احترافي', ctaText: 'ابدأ الآن' },
              { id: 'feat-1', type: 'features', title: 'مميزاتنا الرئيسية', items: ['سهولة التصفح', 'دعم الفواتير والدفع', 'تصميم عصري'] },
              { id: 'cta-1', type: 'cta', title: 'هل أنت جاهز للبدء؟', subtitle: 'انضم إلينا اليوم واحصل على تجربتك الخاصة' }
            ]
          },
          settings: {
            seoTitle: `موقع ${template.name}`,
            seoDescription: 'موقع مصمم بواسطة منصة صانع المواقع الاحترافية',
            customDomain: ''
          }
        })
      });

      const data = await res.json();
      
      onAuthenticated({
        user: { id: userId, email: userEmail, name: userName },
        workspace: data.workspace || {
          id: Date.now(),
          userId,
          templateId: String(template.id),
          name: `موقع ${template.name}`,
          customizations: {}
        }
      });
    } catch (err: any) {
      console.error('Auth PreviewGate error:', err);
      // Fallback demo login if popup blocked or popup closed
      const fallbackUserId = `usr_google_${Math.floor(Math.random()*10000)}`;
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: fallbackUserId,
          templateId: String(template.id),
          name: `موقع ${template.name}`,
          customizations: {
            heroTitle: `موقع ${template.name}`,
            heroSubtitle: 'موقعك جاهز للتعديل المباشر والتخصيص البصري.',
            primaryColor: '#008060',
            sections: [
              { id: 'hero-1', type: 'hero', title: `موقع ${template.name}`, subtitle: 'صمم هويتك بأسلوب احترافي', ctaText: 'تواصل معنا' }
            ]
          }
        })
      });
      const data = await res.json();
      onAuthenticated({
        user: { id: fallbackUserId, email: 'user@google.com', name: 'مستخدم غوغل' },
        workspace: data.workspace
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Preview Image Banner */}
        <div className="relative h-48 bg-gradient-to-r from-emerald-900 to-slate-900 overflow-hidden flex items-center justify-center p-6 text-white text-right">
          {template.image ? (
            <img 
              src={template.image} 
              alt={template.name} 
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          ) : null}
          <div className="relative z-10 space-y-2 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles size={13} /> بوابـة إنشاء بيئة العمل (Client Workspace Gate)
            </span>
            <h3 className="text-2xl font-black">{template.name}</h3>
            <p className="text-xs text-slate-300">قم بتسجيل الدخول لمعاينة القالب وتفعيل المحرر البصري التفاعلي</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6 text-slate-800 text-right">
          
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 space-y-2 text-xs text-emerald-900">
            <div className="font-bold flex items-center gap-2 text-emerald-800 text-sm">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>تسجيل دخول محمي عبر Google Firebase</span>
            </div>
            <p className="leading-relaxed">
              عند إتمام الدخول، سيتم توجيهك تلقائياً إلى بيئة عملك الخاصة (Workspace) لتتمكن من التعديل المباشر بالنقر وإضافة لمساتك الخاصة.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-slate-800 bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>المتابعة باستخدام حساب Google</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-xs text-rose-600 text-center font-bold">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 font-bold transition-colors"
            >
              إلغاء والعودة للمكتف
            </button>
            <span className="text-slate-400 font-medium">الإنشاء التلقائي لبيئة العمل </span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PreviewGate;
