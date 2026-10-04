import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Image as ImageIcon, CheckCircle, ChevronDown, Paperclip, HelpCircle } from 'lucide-react';
import { auth, storage, loginWithGoogle } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function SupportWidget({ tenant, primaryColor = '#000000' }: { tenant: any, primaryColor?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // New ticket form
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Reply form
  const [replyText, setReplyText] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Pagination for tickets
  const [customerTicketPage, setCustomerTicketPage] = useState(1);
  const customerTicketsPerPage = 4;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-widget', handleOpen);
    return () => window.removeEventListener('open-support-widget', handleOpen);
  }, []);
  
  useEffect(() => {
    if (isOpen && auth.currentUser) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, auth.currentUser]);

  useEffect(() => {
    if (activeTicket) {
      fetchMessages(activeTicket.id);
      const interval = setInterval(() => {
        fetchMessages(activeTicket.id);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [activeTicket]);

  const fetchTickets = async () => {
    try {
      const email = auth.currentUser?.email;
      if (!email) return;
      
      const res = await fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/support-tickets?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (ticketId: number) => {
    try {
      const email = auth.currentUser?.email;
      if (!email) return;
      
      const res = await fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/support-tickets/${ticketId}/messages?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.ticketStatus && activeTicket && activeTicket.status !== data.ticketStatus) {
          setActiveTicket((prev: any) => prev ? { ...prev, status: data.ticketStatus } : null);
        }
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      const res = await fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/support-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          subject,
          message,
          images
        })
      });
      
      if (res.ok) {
        setSubject('');
        setMessage('');
        setImages([]);
        setIsCreating(false);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if ((!replyText.trim() && images.length === 0) || !activeTicket) return;
    
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const res = await fetch(`/api/public/websites/${tenant?.subdomain || tenant?.id || 'demo'}/support-tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          message: replyText,
          images
        })
      });
      
      if (res.ok) {
        setReplyText('');
        setImages([]);
        fetchMessages(activeTicket.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت');
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);

    const processFileReader = (f: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(f);
      });
    };

    try {
      // First read locally as data URL for instant response
      const dataUrl = await processFileReader(file);

      let uploadedUrl: string | null = null;

      // Try uploading to Firebase storage with a 2-second timeout
      try {
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const tenantId = tenant?.id || tenant?.subdomain || 'demo';
        const storageRef = ref(storage, `tenants/${tenantId}/support/${uniqueFilename}`);
        
        const uploadTask = uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef));
        const timeoutTask = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Upload timeout')), 2000));

        uploadedUrl = await Promise.race([uploadTask, timeoutTask]);
      } catch (storageErr) {
        console.warn('Firebase Storage upload timed out/failed, using fast DataURL:', storageErr);
      }

      const finalUrl = uploadedUrl || dataUrl;
      if (finalUrl) {
        setImages(prev => [...prev, finalUrl]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء تحميل الصورة');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[190] animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 bottom-0 right-0 w-full md:w-[420px] bg-white shadow-2xl z-[200] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300" dir="rtl">
            {/* Header (Hidden when inside active chat view to eliminate clutter as requested) */}
            {!activeTicket && (
              <div className="p-4 text-white flex justify-between items-center shadow-xs shrink-0" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-2">
                  {isCreating && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                      }}
                      className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="العودة للقائمة"
                    >
                      <span>← القائمة</span>
                    </button>
                  )}
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span>المساعدة والدعم الفني</span>
                    </h3>
                    <p className="text-[11px] opacity-90 mt-0.5">تواصل مباشر مع قسم الإدارة والدعم</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOpen(false)} 
                  className="px-2.5 py-1 bg-white/20 hover:bg-rose-600 rounded-xl transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X size={16} />
                </button>
              </div>
            )}

          {!auth.currentUser ? (
            <div className="p-8 text-center flex-1 flex flex-col justify-center items-center">
              <MessageCircle size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-800 mb-2 font-bold text-base">يرجى تسجيل الدخول أولاً</p>
              <p className="text-xs text-gray-500 mb-6 max-w-xs leading-relaxed">يجب عليك تسجيل الدخول بحسابك لتتمكن من إنشاء تذكرة مساعدة ومتابعة المحادثات مع فريق الدعم الفني.</p>
              <button
                type="button"
                onClick={() => loginWithGoogle().catch((err) => console.error(err))}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>تسجيل الدخول باستخدام Google</span>
              </button>
            </div>
          ) : isCreating ? (
            /* Create Ticket Form */
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col bg-slate-50">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">صفحة إنشـاء طلب مساعدة جديد</h4>
                <button 
                  onClick={() => setIsCreating(false)} 
                  className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1"
                >
                  ← إغلاق العودة للقائمة
                </button>
              </div>
              
              <form onSubmit={handleCreateTicket} className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الموضوع</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black bg-white focus:border-black outline-none font-medium placeholder:text-gray-400"
                    placeholder="مثال: استفسار عن شحنة أو منتج"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الرسالة التفصيلية</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black bg-white focus:border-black outline-none h-28 resize-none font-medium placeholder:text-gray-400"
                    placeholder="اشرح استفسارك هنا بكل وضوح..."
                  />
                </div>
                
                {images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative shrink-0">
                        <img src={img} alt="" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                        <button 
                          type="button"
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-gray-500 hover:text-black flex items-center gap-1 text-sm font-bold"
                  >
                    {isUploading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Paperclip size={16} />}
                    إرفاق صورة
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  
                  <button
                    type="submit"
                    disabled={!subject.trim() || !message.trim() || isUploading}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer"
                  >
                    إرسال الطلب
                  </button>
                </div>
              </form>
            </div>
          ) : activeTicket ? (
            /* Active Chat View */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-100">
              {/* Clean Focused Header with Client Name */}
              <div className="p-3 bg-slate-900 text-white shadow-md z-10 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <button 
                    onClick={() => { setActiveTicket(null); setMessages([]); }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title="العودة للقائمة"
                  >
                    <span>← القائمة</span>
                  </button>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-white truncate max-w-[150px]">{activeTicket.subject}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        activeTicket.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        activeTicket.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        activeTicket.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}>
                        {activeTicket.status === 'pending' ? 'بانتظار الموافقة' :
                         activeTicket.status === 'approved' ? 'مقبول ومفتوح' :
                         activeTicket.status === 'rejected' ? 'مرفوض' : 'مغلق'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-semibold truncate mt-0.5">
                      اسم العميل: <span className="text-white font-bold">{activeTicket.customerName || auth.currentUser?.displayName || auth.currentUser?.email || 'حساب العميل'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="إغلاق"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8 font-medium">
                    بدأت المحادثة. اكتب رسالتك وسيرد عليك المدير الفني قريباً.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderType === 'customer';
                    return (
                      <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                          isMe 
                            ? 'bg-slate-900 text-white rounded-tl-xs' 
                            : 'bg-white text-slate-900 border border-slate-200 rounded-tr-xs'
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-1 border-b border-black/5 pb-1 text-[10px] font-black">
                            <span className={isMe ? 'text-slate-300' : 'text-indigo-600'}>
                              {isMe ? `أنت (${activeTicket.customerName || 'العميل'})` : '👨‍💼 المدير الفني والدعم'}
                            </span>
                            <span className={isMe ? 'text-slate-400' : 'text-slate-400'}>
                              {new Date(msg.createdAt).toLocaleTimeString('ar-JO', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>

                          <p className={`text-xs font-medium leading-relaxed whitespace-pre-wrap ${isMe ? 'text-white' : 'text-slate-900'}`}>
                            {msg.message}
                          </p>
                          
                          {msg.images && msg.images.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {msg.images.map((img: string, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setPreviewImageUrl(img)}
                                  className="relative rounded-lg overflow-hidden border border-slate-200 shadow-xs group cursor-pointer text-right"
                                >
                                  <img src={img} alt="" className="rounded-lg max-h-32 w-full object-cover group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                    🔍 تكبير الصورة
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Bottom Input Area - Full Width without Empty Gaps */}
              {activeTicket.status === 'approved' ? (
                <div className="p-3 bg-white border-t border-slate-200 shadow-lg shrink-0">
                  {images.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                      {images.map((img, i) => (
                        <div key={i} className="relative shrink-0">
                          <img src={img} alt="" className="h-12 w-12 object-cover rounded-lg border border-slate-200" />
                          <button 
                            type="button"
                            onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-slate-900 transition-colors">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="إرفاق صورة"
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Paperclip size={18} />
                      )}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="اكتب رسالتك للمدير الفني..."
                      className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-900 focus:outline-none font-medium placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={(!replyText.trim() && images.length === 0) || isUploading}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
                    >
                      <span>إرسال</span>
                      <Send size={14} className="rtl:-scale-x-100" />
                    </button>
                  </div>
                </div>
              ) : activeTicket.status === 'pending' ? (
                <div className="p-3 bg-amber-50 border-t border-amber-200 text-center text-xs text-amber-900 font-bold shrink-0">
                  ⏳ الطلب بانتظار موافقة المدير الفني لفتح المحادثة المباشرة.
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border-t border-rose-200 text-center text-xs text-rose-900 font-bold shrink-0">
                  🔒 تم إنهاء أو رفض المحادثة من قبل المدير الفني. لا يمكن إرسال المزيد من الرسائل.
                </div>
              )}
            </div>
          ) : (
            /* Tickets List Page */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
                <h4 className="font-bold text-gray-800 text-sm">صفحة 1: قائمة طلباتي السابقة</h4>
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  + إنشاء طلب جديد
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto overscroll-contain p-2 bg-slate-50 space-y-2">
                {tickets.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <p className="text-sm mb-4">ليس لديك أي طلبات مساعدة سابقة.</p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-gray-800 cursor-pointer"
                    >
                      إنشاء طلب مساعدة
                    </button>
                  </div>
                ) : (
                  (() => {
                    const totalCustomerPages = Math.max(1, Math.ceil(tickets.length / customerTicketsPerPage));
                    const currentCustomerPage = Math.min(customerTicketPage, totalCustomerPages);
                    const paginatedCustomerTickets = tickets.slice((currentCustomerPage - 1) * customerTicketsPerPage, currentCustomerPage * customerTicketsPerPage);

                    return (
                      <>
                        {paginatedCustomerTickets.map(ticket => (
                          <div
                            key={ticket.id}
                            onClick={() => setActiveTicket(ticket)}
                            className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs cursor-pointer hover:border-slate-900 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="font-bold text-sm text-gray-900 truncate max-w-[70%]">{ticket.subject}</h5>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                ticket.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {ticket.status === 'pending' ? 'قيد المراجعة' : ticket.status === 'approved' ? 'مفتوح' : 'مغلق'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{ticket.message}</p>
                            <div className="mt-2 text-[10px] text-gray-400">
                              {new Date(ticket.createdAt).toLocaleDateString('ar-JO')}
                            </div>
                          </div>
                        ))}

                        {/* Customer Pagination controls */}
                        {totalCustomerPages > 1 && (
                          <div className="pt-2 px-1 flex items-center justify-between text-xs font-bold text-slate-700 border-t border-slate-200 mt-2">
                            <button
                              type="button"
                              disabled={currentCustomerPage === 1}
                              onClick={() => setCustomerTicketPage(p => Math.max(1, p - 1))}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                            >
                              السابق
                            </button>
                            <span>صفحة {currentCustomerPage} من {totalCustomerPages}</span>
                            <button
                              type="button"
                              disabled={currentCustomerPage === totalCustomerPages}
                              onClick={() => setCustomerTicketPage(p => Math.min(totalCustomerPages, p + 1))}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                            >
                              التالي
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          )}
          </div>
        </>
      )}

      {/* 🖼️ Modal Lightbox for Image Preview */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-xs z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
          dir="rtl"
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 bg-slate-950 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-200">
                🖼️ معاينة الصورة المرفقة
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg transition-colors"
                >
                  تحميل / فتح برابط ↗️
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X size={14} />
                  <span>إغلاق</span>
                </button>
              </div>
            </div>
            <div className="p-3 bg-slate-900 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img 
                src={previewImageUrl} 
                alt="المرفق المكبر" 
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl" 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
