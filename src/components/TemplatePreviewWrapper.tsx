import React, { useState, useEffect } from 'react';
import { Wand2, Sparkles, Save, CheckCircle2, Eye, ShieldCheck, ArrowRight, LayoutTemplate, Lock } from 'lucide-react';
import InlineVisualEditor, { VisualBlock } from './InlineVisualEditor';
import { checkFeatureLock, fetchSystemSettings, subscribeSystemSettings, getCachedSystemSettings, SystemSettings } from '../lib/systemSettingsClient';
import { auth } from '../lib/firebase';

interface TemplatePreviewWrapperProps {
  initialBlocks?: VisualBlock[];
  workspaceId?: number | string;
  primaryColor?: string;
  templateName?: string;
  onSaveAndPublish?: (customizations: any) => void;
  onBack?: () => void;
}

export const TemplatePreviewWrapper: React.FC<TemplatePreviewWrapperProps> = ({
  initialBlocks,
  workspaceId,
  primaryColor = '#008060',
  templateName = 'قالب الموقع',
  onSaveAndPublish,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [sysSettings, setSysSettings] = useState<SystemSettings>(getCachedSystemSettings());

  useEffect(() => {
    fetchSystemSettings(true);
    const unsubscribe = subscribeSystemSettings((s) => setSysSettings(s));
    return () => unsubscribe();
  }, []);

  const getCurrentUserInfo = () => {
    const email = auth.currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : null);
    const role = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    return { email, role };
  };

  const handleEnterEditMode = async () => {
    const fresh = await fetchSystemSettings(true);
    if (fresh.lockEditMode) {
      const msg = fresh.customNoticeMessage || 'مغلق الآن - بيئة التعديل مغلقة من الإدارة';
      setLockedNotice(msg);
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }
    const { email, role } = getCurrentUserInfo();
    const lockCheck = checkFeatureLock('editMode', email, role);
    if (lockCheck.isLocked) {
      setLockedNotice(lockCheck.noticeMessage || 'مغلق الآن - بيئة التعديل مغلقة من الإدارة');
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }
    setIsEditing(true);
  };

  const handlePublish = async () => {
    const fresh = await fetchSystemSettings(true);
    if (fresh.lockSaveEdits) {
      const msg = fresh.customNoticeMessage || 'مغلق الآن - حفظ التعديلات مغلق حالياً من الإدارة';
      setLockedNotice(msg);
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }
    const { email, role } = getCurrentUserInfo();
    const lockCheck = checkFeatureLock('saveEdits', email, role);
    if (lockCheck.isLocked) {
      setLockedNotice(lockCheck.noticeMessage || 'مغلق الآن - حفظ التعديلات متوقف حالياً من الإدارة');
      setTimeout(() => setLockedNotice(null), 4000);
      return;
    }

    setSaveToast(true);
    if (onSaveAndPublish) {
      onSaveAndPublish({ workspaceId, isEditing });
    }
    setTimeout(() => {
      setSaveToast(false);
    }, 3000);
  };

  return (
    <div className="relative min-h-screen bg-slate-900 dir-rtl font-sans text-slate-100 flex flex-col">
      
      {/* Edit Mode Top Action Bar */}
      {isEditing && (
        <header className="sticky top-0 z-50 bg-slate-950/90 border-b border-slate-800/80 px-6 py-3.5 backdrop-blur-md flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="رجوع"
              >
                <ArrowRight size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-xs text-white">وضع التعديل مفعل</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              انقر على أجزاء النصوص للتحرير المباشر
            </span>
          </div>

           <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <Eye size={15} />
              <span>معاينة النهائي</span>
            </button>

            <button
              onClick={handlePublish}
              className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 active:scale-95 ${
                sysSettings.lockSaveEdits 
                  ? 'bg-rose-950 text-rose-300 border border-rose-600/60' 
                  : 'text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-950/50'
              }`}
            >
              {sysSettings.lockSaveEdits ? <Lock size={16} className="text-rose-400 shrink-0" /> : <Save size={16} />}
              <span>{sysSettings.lockSaveEdits ? 'حفظ التعديلات مغلق' : 'حفظ ونشر'}</span>
            </button>
          </div>
        </header>
      )}

      {/* Locked Notice Toast Notification */}
      {lockedNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-3 animate-in zoom-in-95 border border-rose-400">
          <Lock size={18} className="animate-bounce shrink-0" />
          <span>{lockedNotice}</span>
        </div>
      )}

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full text-xs font-extrabold shadow-2xl flex items-center gap-2.5 animate-in zoom-in-95 border border-emerald-400">
          <CheckCircle2 size={18} />
          <span>تم حفظ ونشر التعديلات بنجاح! 🚀</span>
        </div>
      )}

      {/* Canvas Viewport */}
      <main className="flex-1 bg-slate-100 relative">
        <InlineVisualEditor
          initialBlocks={initialBlocks}
          workspaceId={workspaceId}
          primaryColor={primaryColor}
          readOnly={!isEditing}
        />
      </main>

      {/* Floating Call To Action Button (When in Preview Mode) */}
      {!isEditing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <button
            onClick={handleEnterEditMode}
            className={`group relative px-6 py-3.5 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-300 flex items-center gap-3 border backdrop-blur-md cursor-pointer ${
              sysSettings.lockEditMode
                ? 'bg-rose-950/95 hover:bg-rose-900 text-rose-200 border-rose-600/80 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:scale-102 active:scale-98'
            }`}
          >
            {sysSettings.lockEditMode ? (
              <>
                <Lock size={18} className="text-rose-400 shrink-0" />
                <span className="whitespace-nowrap">بيئة التعديل مغلقة حالياً من الإدارة</span>
              </>
            ) : (
              <>
                <LayoutTemplate size={18} className="text-slate-300 shrink-0" />
                <span className="whitespace-nowrap">دخول بيئة التعديل</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};

export default TemplatePreviewWrapper;
