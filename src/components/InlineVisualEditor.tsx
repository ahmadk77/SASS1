import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { saveEditedTemplate } from '../lib/activityLogger';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Palette, 
  MoveUp, 
  MoveDown, 
  Check, 
  Upload, 
  Globe, 
  Sparkles, 
  Eye, 
  Save, 
  X,
  Type,
  Lock,
  Layout,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export interface VisualBlock {
  id: string;
  type: 'hero' | 'features' | 'cta' | 'gallery' | 'testimonials' | 'pricing';
  title: string;
  subtitle?: string;
  content?: string;
  ctaText?: string;
  image?: string;
  items?: any[];
  titleColor?: string;
  subtitleColor?: string;
  bgColor?: string;
}

interface InlineVisualEditorProps {
  initialBlocks?: VisualBlock[];
  workspaceId?: number | string;
  primaryColor?: string;
  onSave?: (updatedCustomizations: any) => void;
  readOnly?: boolean;
}

const DEFAULT_BLOCKS: VisualBlock[] = [
  {
    id: 'hero-block-1',
    type: 'hero',
    title: 'ابنِ حضورك الرقمي الاحترافي بلمساتك الخاصة',
    subtitle: 'أنشئ موقعاً مميزاً يعكس هوية عملك بأعلى المعايير، مع إمكانية التعديل السريع والمباشر.',
    ctaText: 'استكشف خدماتنا الآن',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200',
    titleColor: '#0f172a',
    subtitleColor: '#475569',
    bgColor: '#ffffff'
  },
  {
    id: 'features-block-1',
    type: 'features',
    title: 'مميزاتنا الحصرية لمشروعك',
    subtitle: 'نوفر لك الأدوات الذكية لتنمية وتطوير علامتك التجارية بأقل مجهود.',
    items: [
      { id: 'f1', title: 'تعديل سائل وبسيط', desc: 'انقر على أي عنصر للتعديل فوراً دون حاجة لخبرة برمجية.', icon: '⚡' },
      { id: 'f2', title: 'هوية بصرية ثابتة', desc: 'نظام تصميم محمي يضمن تناسق الخطوط والأحجام التلقائي.', icon: '🎨' },
      { id: 'f3', title: 'سرعة فائقة وأمان', desc: 'سيرفرات سحابية متقدمة تدعم أعلى استجابة وحماية.', icon: '🛡️' }
    ],
    bgColor: '#f8fafc'
  },
  {
    id: 'cta-block-1',
    type: 'cta',
    title: 'جاهز لإطلاق موقعك اليوم؟',
    subtitle: 'احصل على دومينك الخاص ولوحة تحكم متكاملة لإدارة المحتوى.',
    ctaText: 'ابدأ التجربة المجانية',
    bgColor: '#008060'
  }
];

const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200',
];

const ensureCompleteBlocks = (inputBlocks?: VisualBlock[]): VisualBlock[] => {
  if (!inputBlocks || inputBlocks.length === 0) {
    return DEFAULT_BLOCKS;
  }

  // If user only has 1 or 2 blocks, supplement with missing sections so the full site is editable
  const hasFeatures = inputBlocks.some(b => b.type === 'features');
  const hasGallery = inputBlocks.some(b => b.type === 'gallery');
  const hasTestimonials = inputBlocks.some(b => b.type === 'testimonials');
  const hasCta = inputBlocks.some(b => b.type === 'cta');

  const result = [...inputBlocks];

  if (!hasFeatures) {
    result.push({
      id: `features-auto-${Date.now()}`,
      type: 'features',
      title: 'خدماتنا ومميزاتنا الحصرية',
      subtitle: 'نحرص على تقديم أفضل جودة واهتمام بأدق التفاصيل لعميلنا العزيز.',
      items: [
        { id: 'f1', title: 'جودة استثنائية', desc: 'معايير عالية يثق بها عملاؤنا دائماً.', icon: '⚡' },
        { id: 'f2', title: 'سرعة بالتنفيذ', desc: 'استجابة وتسليم في أوقات قياسية.', icon: '🎨' },
        { id: 'f3', title: 'دعم وتواصل مستمر', desc: 'فريق عمل متواجد للإجابة على استفساراتك.', icon: '🛡️' }
      ],
      bgColor: '#f8fafc'
    });
  }

  if (!hasGallery) {
    result.push({
      id: `gallery-auto-${Date.now()}`,
      type: 'gallery',
      title: 'معرض الصور والأعمال المميزة',
      subtitle: 'استعرض تشكيلة صور أعمالنا ومنتجاتنا الأكثر إقبالاً',
      items: [
        { id: 'g1', image: STOCK_IMAGES[0] },
        { id: 'g2', image: STOCK_IMAGES[1] },
        { id: 'g3', image: STOCK_IMAGES[2] }
      ],
      bgColor: '#ffffff'
    });
  }

  if (!hasTestimonials) {
    result.push({
      id: `testimonials-auto-${Date.now()}`,
      type: 'testimonials',
      title: 'آراء وتقييمات العملاء',
      subtitle: 'ماذا يقول عملاؤنا الكرام عن تجربتهم معنا',
      items: [
        { id: 't1', name: 'أحمد محمود', role: 'عميل متميز', comment: 'خدمة فائقة الجودة وسرعة بالتعامل، أنصح بها جداً!', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' },
        { id: 't2', name: 'سارة خالد', role: 'عميلة دائمة', comment: 'الموقع ممتاز جداً والتعديل المباشر هيأ كل الترتيبات.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }
      ],
      bgColor: '#f8fafc'
    });
  }

  if (!hasCta) {
    result.push({
      id: `cta-auto-${Date.now()}`,
      type: 'cta',
      title: 'جاهز لطلب خدمتك أو الاستفسار؟',
      subtitle: 'تواصل معنا الآن وسنكون سعداء بخدمتك فوراً.',
      ctaText: 'تواصل معنا الآن عبر الواتساب',
      bgColor: '#008060'
    });
  }

  return result;
};

export const InlineVisualEditor: React.FC<InlineVisualEditorProps> = ({
  initialBlocks,
  workspaceId,
  primaryColor = '#008060',
  onSave,
  readOnly = false,
}) => {
  const [blocks, setBlocks] = useState<VisualBlock[]>(() => ensureCompleteBlocks(initialBlocks));
  const [activeBlockHover, setActiveBlockHover] = useState<string | null>(null);
  
  // Image modal state
  const [editingImageBlockId, setEditingImageBlockId] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');

  // Add section modal state
  const [isAddBlockModalOpen, setIsAddBlockModalOpen] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);

  // Active color editing text
  const [colorPickerTarget, setColorPickerTarget] = useState<{ blockId: string; key: 'titleColor' | 'subtitleColor' } | null>(null);

  // Auto notification toast
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Reorder / Delete section logic
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
    triggerAutoSave(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      alert('يجب أن يحتوي الموقع على قسم واحد على الأقل.');
      return;
    }
    const filtered = blocks.filter(b => b.id !== id);
    setBlocks(filtered);
    triggerAutoSave(filtered);
  };

  const handleInsertBlock = (blockType: VisualBlock['type']) => {
    let newBlock: VisualBlock;
    const id = `block-${Date.now()}`;

    switch (blockType) {
      case 'hero':
        newBlock = {
          id,
          type: 'hero',
          title: 'عنوان رئيسي جديد جذّاب',
          subtitle: 'وصف توضيحي يعبر عن هوية العمل والخدمات القيمة المقدمة.',
          ctaText: 'اضغط هنا للبدء',
          image: STOCK_IMAGES[0],
          bgColor: '#ffffff'
        };
        break;
      case 'features':
        newBlock = {
          id,
          type: 'features',
          title: 'خدماتنا ومميزاتنا الفريدة',
          subtitle: 'مجموعة من النقاط التنافسية لعلامتك التجارية',
          items: [
            { id: '1', title: 'ميزة أولى', desc: 'تفاصيل الميزة والخدمة المتاحة للعملاء.', icon: '🌟' },
            { id: '2', title: 'ميزة ثانية', desc: 'شرح موجز للقيمة المضافة للخدمة.', icon: '🚀' }
          ],
          bgColor: '#f8fafc'
        };
        break;
      case 'cta':
        newBlock = {
          id,
          type: 'cta',
          title: 'تواصل معنا واحصل على عرضك الآن',
          subtitle: 'فريق عملنا جاهز للرد على كافة الاستفسارات',
          ctaText: 'تواصل الآن',
          bgColor: primaryColor
        };
        break;
      case 'gallery':
        newBlock = {
          id,
          type: 'gallery',
          title: 'معرض الصور والمنتجات',
          subtitle: 'استعرض تشكيلة أعمالنا الأخيرة',
          items: [
            { id: '1', image: STOCK_IMAGES[1] },
            { id: '2', image: STOCK_IMAGES[2] },
            { id: '3', image: STOCK_IMAGES[3] }
          ],
          bgColor: '#ffffff'
        };
        break;
      case 'testimonials':
        newBlock = {
          id,
          type: 'testimonials',
          title: 'آراء وتقييمات العملاء',
          subtitle: 'ماذا يقول عملاؤنا عن تجربتهم معنا',
          items: [
            { id: '1', name: 'أحمد محمود', role: 'رائد أعمال', comment: 'تجربة سلسة وموقع فائق الاحترافية!', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' },
            { id: '2', name: 'سارة خالد', role: 'مديرة تسويق', comment: 'التعديل المباشر وفر علينا أسابيع من التطوير.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }
          ],
          bgColor: '#f8fafc'
        };
        break;
      default:
        newBlock = {
          id,
          type: 'cta',
          title: 'قسم جديد',
          bgColor: '#ffffff'
        };
    }

    const updatedBlocks = [...blocks];
    if (insertAtIndex !== null) {
      updatedBlocks.splice(insertAtIndex + 1, 0, newBlock);
    } else {
      updatedBlocks.push(newBlock);
    }

    setBlocks(updatedBlocks);
    setIsAddBlockModalOpen(false);
    setInsertAtIndex(null);
    triggerAutoSave(updatedBlocks);
  };

  // Content change handlers
  const updateTextBlock = (blockId: string, field: keyof VisualBlock, value: string) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, [field]: value } : b);
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const updateItemText = (blockId: string, itemId: string, itemField: string, value: string) => {
    const updated = blocks.map(b => {
      if (b.id !== blockId || !b.items) return b;
      const updatedItems = b.items.map(item => item.id === itemId ? { ...item, [itemField]: value } : item);
      return { ...b, items: updatedItems };
    });
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const triggerAutoSave = (currentBlocks: VisualBlock[]) => {
    if (onSave) {
      onSave({ blocks: currentBlocks });
    }

    // Save to edited_templates in LocalStorage & Firestore
    (async () => {
      try {
        const userId = auth.currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : 'usr_default');
        const userEmail = auth.currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : 'client@waas.com');
        const docId = workspaceId ? String(workspaceId) : `${userId}_template_1`;
        await saveEditedTemplate(userId, userEmail, 1, 'قالب مخصص', { blocks: currentBlocks }, docId);
      } catch (e) {}
    })();

    // Also save directly to /api/tenant/content for live site sync
    (async () => {
      try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
        const impersonateId = localStorage.getItem('impersonatedTenantId');
        const url = impersonateId ? `/api/tenant/content?impersonateTenantId=${impersonateId}` : '/api/tenant/content';
        await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ content: { blocks: currentBlocks }, impersonateTenantId: impersonateId })
        });
      } catch (err) {
        console.error('Live content auto-save failed:', err);
      }
    })();
    setSaveStatus('تم الحفظ ونشر التعديل تلقائياً ✨');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  return (
    <div className="relative min-h-screen bg-slate-100 dir-rtl font-sans selection:bg-emerald-100">
      
      {/* Toast Save Notification */}
      {saveStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in zoom-in-95 pointer-events-none">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Global Design System Enforcement Notice */}
      {!readOnly && (
        <div className="bg-slate-900 text-slate-200 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-emerald-400" />
            <span>محرر القوالب البصري التفاعلي (Click-to-Edit Visual Engine)</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
              <Lock size={12} /> الأحجام والخطوط محمية بحساب النظام القياسي
            </span>
            <span>انقر على أي نص للتعديل الفوري</span>
          </div>
        </div>
      )}

      {/* Canvas Main Viewport */}
      <div className="max-w-6xl mx-auto my-6 bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden min-h-[700px] transition-all">
        {blocks.map((block, index) => {
          const isHovered = activeBlockHover === block.id && !readOnly;

          return (
            <React.Fragment key={block.id}>
              
              {/* Insert Section Divider / Plus Button */}
              {!readOnly && (
                <div className="relative py-1 group/divider">
                  <div className="absolute inset-0 flex items-center px-8 pointer-events-none">
                    <div className="w-full border-t-2 border-dashed border-slate-200 group-hover/divider:border-emerald-500 transition-colors" />
                  </div>
                  <div className="relative flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInsertAtIndex(index - 1);
                        setIsAddBlockModalOpen(true);
                      }}
                      className="px-3.5 py-1 rounded-full bg-white border border-slate-300 text-slate-600 font-bold text-xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm flex items-center gap-1.5 opacity-0 group-hover/divider:opacity-100 scale-90 group-hover/divider:scale-100 z-20"
                    >
                      <Plus size={14} /> <span>إضافة قسم هنا</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Individual Block Container */}
              <div 
                onMouseEnter={() => setActiveBlockHover(block.id)}
                onMouseLeave={() => setActiveBlockHover(null)}
                style={{ backgroundColor: block.bgColor || '#ffffff' }}
                className={`relative transition-all duration-200 ${
                  isHovered ? 'ring-2 ring-emerald-500 ring-offset-2 z-10' : ''
                }`}
              >
                {/* Floating Block Management Overlay Controls */}
                {isHovered && (
                  <div className="absolute top-3 left-4 z-30 flex items-center gap-2 bg-slate-900/90 text-white p-1.5 rounded-2xl shadow-xl backdrop-blur-md border border-slate-700/80 text-xs font-bold animate-in fade-in">
                    <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300 uppercase tracking-wider text-[10px]">
                      {block.type}
                    </span>

                    {/* Color Swatch Picker Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorPickerTarget(colorPickerTarget?.blockId === block.id ? null : { blockId: block.id, key: 'titleColor' });
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white"
                      title="لون النص"
                    >
                      <Palette size={15} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveBlock(index, 'up');
                      }}
                      disabled={index === 0}
                      className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white disabled:opacity-30"
                      title="رفع للأعلى"
                    >
                      <MoveUp size={15} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveBlock(index, 'down');
                      }}
                      disabled={index === blocks.length - 1}
                      className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-300 hover:text-white disabled:opacity-30"
                      title="إنزال لأسفل"
                    >
                      <MoveDown size={15} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBlock(block.id);
                      }}
                      className="p-1.5 hover:bg-rose-950 text-rose-400 hover:text-rose-200 rounded-xl transition-colors"
                      title="حذف هذا القسم"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}

                {/* Color Swatch Menu Modal Popup */}
                {colorPickerTarget?.blockId === block.id && (
                  <div className="absolute top-14 left-4 z-40 bg-white p-3 rounded-2xl shadow-2xl border border-slate-200 text-right space-y-2 text-xs">
                    <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between gap-4">
                      <span>اختر لون النص الرئيسي</span>
                      <button onClick={(e) => { e.stopPropagation(); setColorPickerTarget(null); }} className="text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {['#0f172a', '#008060', '#2563eb', '#dc2626', '#d97706', '#475569'].map(c => (
                        <button
                          key={c}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTextBlock(block.id, 'titleColor', c);
                            setColorPickerTarget(null);
                          }}
                          style={{ backgroundColor: c }}
                          className="w-7 h-7 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= HERO BLOCK ================= */}
                {block.type === 'hero' && (
                  <div className="py-20 px-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 text-right z-10">
                      
                      {/* Click to Edit Title - Font Locked to Global Admin Token */}
                      <h1 
                        contentEditable={!readOnly}
                        suppressContentEditableWarning={true}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          e.stopPropagation();
                          updateTextBlock(block.id, 'title', e.currentTarget.innerText);
                        }}
                        style={{ color: block.titleColor || '#0f172a' }}
                        className={`text-4xl md:text-5xl font-black leading-tight tracking-tight outline-none rounded-lg transition-all ${
                          !readOnly ? 'hover:bg-amber-50/60 focus:bg-amber-50 focus:ring-2 focus:ring-amber-400 px-1 cursor-text' : ''
                        }`}
                      >
                        {block.title}
                      </h1>

                      {/* Click to Edit Subtitle */}
                      <p 
                        contentEditable={!readOnly}
                        suppressContentEditableWarning={true}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          e.stopPropagation();
                          updateTextBlock(block.id, 'subtitle', e.currentTarget.innerText);
                        }}
                        style={{ color: block.subtitleColor || '#475569' }}
                        className={`text-lg font-normal leading-relaxed outline-none rounded-lg transition-all ${
                          !readOnly ? 'hover:bg-amber-50/60 focus:bg-amber-50 focus:ring-2 focus:ring-amber-400 px-1 cursor-text' : ''
                        }`}
                      >
                        {block.subtitle}
                      </p>

                      <div className="pt-2 flex items-center gap-4">
                        <span 
                          contentEditable={!readOnly}
                          suppressContentEditableWarning={true}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            e.stopPropagation();
                            updateTextBlock(block.id, 'ctaText', e.currentTarget.innerText);
                          }}
                          style={{ backgroundColor: primaryColor }}
                          className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg shadow-emerald-900/10 hover:opacity-95 transition-all outline-none cursor-text inline-block"
                        >
                          {block.ctaText || 'تواصل معنا'}
                        </span>
                      </div>
                    </div>

                    {/* Image Block with Swap Overlay */}
                    <div className="relative group/img rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 aspect-video md:aspect-square bg-slate-100 z-10">
                      <img 
                        src={block.image || STOCK_IMAGES[0]} 
                        alt="Hero" 
                        className="w-full h-full object-cover"
                      />
                      {!readOnly && (
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center p-4 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImageBlockId(block.id);
                            }}
                            className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-xs shadow-2xl flex items-center gap-2 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <ImageIcon size={16} className="text-emerald-600" />
                            <span>استبدال الصورة</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ================= FEATURES BLOCK ================= */}
                {block.type === 'features' && (
                  <div className="py-16 px-8 max-w-5xl mx-auto space-y-12 text-center">
                    <div className="space-y-3 max-w-2xl mx-auto">
                      <h2 
                        contentEditable={!readOnly}
                        suppressContentEditableWarning={true}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          e.stopPropagation();
                          updateTextBlock(block.id, 'title', e.currentTarget.innerText);
                        }}
                        style={{ color: block.titleColor || '#0f172a' }}
                        className="text-3xl font-extrabold outline-none hover:bg-amber-50/60 focus:bg-amber-50 focus:ring-2 focus:ring-amber-400 rounded-lg transition-all cursor-text px-1"
                      >
                        {block.title}
                      </h2>
                      <p 
                        contentEditable={!readOnly}
                        suppressContentEditableWarning={true}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          e.stopPropagation();
                          updateTextBlock(block.id, 'subtitle', e.currentTarget.innerText);
                        }}
                        className="text-slate-600 text-sm outline-none hover:bg-amber-50/60 focus:bg-amber-50 focus:ring-2 focus:ring-amber-400 rounded-lg transition-all cursor-text px-1"
                      >
                        {block.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
                      {(block.items || []).map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                          <div className="text-3xl">{item.icon || '✨'}</div>
                          <h3 
                            contentEditable={!readOnly}
                            suppressContentEditableWarning={true}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              e.stopPropagation();
                              updateItemText(block.id, item.id, 'title', e.currentTarget.innerText);
                            }}
                            className="font-bold text-slate-900 text-base outline-none hover:bg-amber-50/60 rounded px-1 cursor-text"
                          >
                            {item.title}
                          </h3>
                          <p 
                            contentEditable={!readOnly}
                            suppressContentEditableWarning={true}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              e.stopPropagation();
                              updateItemText(block.id, item.id, 'desc', e.currentTarget.innerText);
                            }}
                            className="text-slate-500 text-xs leading-relaxed outline-none hover:bg-amber-50/60 rounded px-1 cursor-text"
                          >
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= CTA BLOCK ================= */}
                {block.type === 'cta' && (
                  <div className="py-16 px-8 max-w-4xl mx-auto text-center space-y-6">
                    <h2 
                      contentEditable={!readOnly}
                      suppressContentEditableWarning={true}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        e.stopPropagation();
                        updateTextBlock(block.id, 'title', e.currentTarget.innerText);
                      }}
                      className="text-3xl font-black text-white outline-none hover:bg-white/10 rounded-lg px-2 transition-all cursor-text"
                    >
                      {block.title}
                    </h2>
                    <p 
                      contentEditable={!readOnly}
                      suppressContentEditableWarning={true}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        e.stopPropagation();
                        updateTextBlock(block.id, 'subtitle', e.currentTarget.innerText);
                      }}
                      className="text-emerald-50 text-base max-w-2xl mx-auto outline-none hover:bg-white/10 rounded-lg px-2 transition-all cursor-text"
                    >
                      {block.subtitle}
                    </p>
                    <div className="pt-2">
                      <span 
                        contentEditable={!readOnly}
                        suppressContentEditableWarning={true}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          e.stopPropagation();
                          updateTextBlock(block.id, 'ctaText', e.currentTarget.innerText);
                        }}
                        className="inline-block px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-xl hover:bg-slate-100 transition-all outline-none cursor-text"
                      >
                        {block.ctaText || 'ابدأ الآن'}
                      </span>
                    </div>
                  </div>
                )}

                {/* ================= GALLERY BLOCK ================= */}
                {block.type === 'gallery' && (
                  <div className="py-16 px-8 max-w-5xl mx-auto space-y-8 text-center">
                    <h2 
                      contentEditable={!readOnly}
                      suppressContentEditableWarning={true}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        e.stopPropagation();
                        updateTextBlock(block.id, 'title', e.currentTarget.innerText);
                      }}
                      className="text-3xl font-extrabold text-slate-900 outline-none hover:bg-amber-50/60 rounded px-1 cursor-text"
                    >
                      {block.title}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {(block.items || []).map((imgItem, idx) => (
                        <div key={imgItem.id || idx} className="rounded-2xl overflow-hidden aspect-square bg-slate-100 shadow-sm border border-slate-200/80">
                          <img src={imgItem.image} alt="Gallery" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= TESTIMONIALS BLOCK ================= */}
                {block.type === 'testimonials' && (
                  <div className="py-16 px-8 max-w-5xl mx-auto space-y-10 text-center">
                    <h2 
                      contentEditable={!readOnly}
                      suppressContentEditableWarning={true}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        e.stopPropagation();
                        updateTextBlock(block.id, 'title', e.currentTarget.innerText);
                      }}
                      className="text-3xl font-extrabold text-slate-900 outline-none hover:bg-amber-50/60 rounded px-1 cursor-text"
                    >
                      {block.title}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                      {(block.items || []).map((t) => (
                        <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                          <p 
                            contentEditable={!readOnly}
                            suppressContentEditableWarning={true}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onBlur={(e) => {
                              e.stopPropagation();
                              updateItemText(block.id, t.id, 'comment', e.currentTarget.innerText);
                            }}
                            className="text-slate-700 text-sm italic outline-none hover:bg-amber-50/60 rounded px-1 cursor-text"
                          >
                            "{t.comment}"
                          </p>
                          <div className="flex items-center gap-3 pt-2">
                            {t.avatar && <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />}
                            <div>
                              <div 
                                contentEditable={!readOnly}
                                suppressContentEditableWarning={true}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                  e.stopPropagation();
                                  updateItemText(block.id, t.id, 'name', e.currentTarget.innerText);
                                }}
                                className="font-bold text-slate-900 text-xs outline-none hover:bg-amber-50/60 rounded px-1 cursor-text"
                              >
                                {t.name}
                              </div>
                              <div 
                                contentEditable={!readOnly}
                                suppressContentEditableWarning={true}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                  e.stopPropagation();
                                  updateItemText(block.id, t.id, 'role', e.currentTarget.innerText);
                                }}
                                className="text-slate-400 text-[11px] outline-none hover:bg-amber-50/60 rounded px-1 cursor-text"
                              >
                                {t.role}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </React.Fragment>
          );
        })}

        {/* Bottom Add Section Button */}
        {!readOnly && (
          <div className="p-8 text-center bg-slate-50 border-t border-slate-200/80">
            <button
              onClick={() => {
                setInsertAtIndex(blocks.length - 1);
                setIsAddBlockModalOpen(true);
              }}
              className="px-6 py-3 rounded-2xl bg-white border-2 border-dashed border-slate-300 text-slate-700 font-bold text-xs hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2 mx-auto shadow-sm cursor-pointer"
            >
              <Plus size={16} /> <span>إضافة قسم جديد لأسفل الصفحة</span>
            </button>
          </div>
        )}
      </div>

      {/* Image Upload / Stock Gallery Modal */}
      {editingImageBlockId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-6 text-right shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ImageIcon size={18} className="text-emerald-600" />
                <span>استبدال وإدارة صورة القسم</span>
              </h3>
              <button onClick={() => setEditingImageBlockId(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">رابط صورة مخصص (URL)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
                  />
                  <button
                    onClick={() => {
                      if (customImageUrl) {
                        updateTextBlock(editingImageBlockId, 'image', customImageUrl);
                        setEditingImageBlockId(null);
                        setCustomImageUrl('');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700"
                  >
                    تطبيق
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700">أو اختر من مكتبة الصور الجاهزة:</label>
                <div className="grid grid-cols-3 gap-3">
                  {STOCK_IMAGES.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        updateTextBlock(editingImageBlockId, 'image', url);
                        setEditingImageBlockId(null);
                      }}
                      className="rounded-xl overflow-hidden h-20 border-2 border-transparent hover:border-emerald-500 transition-all aspect-video group relative cursor-pointer"
                    >
                      <img src={url} alt="stock" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Pre-built Blocks Gallery Modal */}
      {isAddBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-6 text-right shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Layout size={18} className="text-emerald-600" />
                <span>اختر نوع القسم الجديد لإضافته</span>
              </h3>
              <button onClick={() => setIsAddBlockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'hero', name: 'قسم هيرو رئيسي (Hero)', icon: '🚀', desc: 'عنوان ضخم مع صورة وزر تفاعلي' },
                { type: 'features', name: 'شبطة مميزات (Features)', icon: '⚡', desc: '3 أعمدة لعرض النقاط التنافسية' },
                { type: 'cta', name: 'دعوة للتفاعل (CTA)', icon: '🎯', desc: 'شريط ملفت لجلب العملاء والمبيعات' },
                { type: 'gallery', name: 'معرض صور (Gallery)', icon: '🖼️', desc: 'شبكة استعراض الصور والمنتجات' },
                { type: 'testimonials', name: 'آراء العملاء (Reviews)', icon: '⭐', desc: 'استعراض التقييمات وبناء الثقة' },
              ].map(b => (
                <button
                  key={b.type}
                  onClick={() => handleInsertBlock(b.type as any)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-right space-y-2 group cursor-pointer"
                >
                  <div className="text-2xl">{b.icon}</div>
                  <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-700">{b.name}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InlineVisualEditor;
