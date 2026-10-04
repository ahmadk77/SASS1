import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Check, X, Send, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';
import { auth, storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface SupportTicketsTabProps {
  tenant: any;
  dashboardColor: string;
}

export default function SupportTicketsTab({ tenant, dashboardColor }: SupportTicketsTabProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'closed'>('all');
  const [ticketPage, setTicketPage] = useState(1);
  const ticketsPerPage = 5;
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/tenant/${tenant.id}/support-tickets`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [tenant.id]);

  const fetchMessages = async (ticketId: number) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenant/${tenant.id}/support-tickets/${ticketId}/messages`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected' | 'closed', note?: string) => {
    if (!selectedTicket) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenant/${tenant.id}/support-tickets/${selectedTicket.id}/status`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          systemNote: note || (newStatus === 'rejected' ? '❌ تم رفض طلب المساعدة من قبل إدارة الدعم الفني.' : newStatus === 'closed' ? '🔒 تم إنهاء وإغلاق المحادثة رسميًا.' : '✅ تم قبول طلبك وفتح قناة المحادثة المباشرة.')
        })
      });
      if (res.ok) {
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
        setSelectedTicket({ ...selectedTicket, status: newStatus });
        fetchMessages(selectedTicket.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveTicket = async (ticketId: number) => {
    await handleUpdateStatus('approved');
  };

  const handleSendMessage = async () => {
    if ((!replyText.trim() && replyImages.length === 0) || !selectedTicket) return;
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/tenant/${tenant.id}/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: replyText,
          images: replyImages
        })
      });
      
      if (res.ok) {
        setReplyText('');
        setReplyImages([]);
        fetchMessages(selectedTicket.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `tenants/${tenant.id}/support/${uniqueFilename}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setReplyImages([...replyImages, downloadURL]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPerPage));
  const currentPage = Math.min(ticketPage, totalPages);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={24} className="text-indigo-600" />
            طلبات المساعدة والدعم الفني (نظام المحادثات)
          </h3>
          <p className="text-sm text-gray-500 mt-1">تتبع استفسارات العملاء والرد المباشر عليهم عبر صفحة محادثة مخصصة.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-bold">
          <button
            onClick={() => { setStatusFilter('all'); setTicketPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            الكل ({tickets.length})
          </button>
          <button
            onClick={() => { setStatusFilter('pending'); setTicketPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            بانتظار الموافقة ({tickets.filter(t => t.status === 'pending').length})
          </button>
          <button
            onClick={() => { setStatusFilter('approved'); setTicketPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            مفتوح ({tickets.filter(t => t.status === 'approved').length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
        {/* Tickets List */}
        <div className={`lg:col-span-1 border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h4 className="font-bold text-gray-800 text-sm">قائمة الطلبات (صفحة {currentPage} من {totalPages})</h4>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
              {filteredTickets.length} طلب
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {filteredTickets.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-sm">لا توجد طلبات مساعدة ضمن هذا التصنيف</div>
            ) : (
              paginatedTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-4 rounded-xl cursor-pointer transition-colors border ${selectedTicket?.id === ticket.id ? 'border-indigo-500 bg-indigo-50 shadow-xs' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-sm text-gray-900 line-clamp-1">{ticket.subject}</h5>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                      ticket.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      ticket.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.status === 'pending' ? 'بانتظار الموافقة' : ticket.status === 'approved' ? 'مفتوح' : 'مغلق'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{ticket.message}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="truncate pr-2" dir="ltr">{ticket.customerEmail}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString('ar-JO')}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination controls for tickets */}
          {totalPages > 1 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setTicketPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                السابق
              </button>
              <span className="text-slate-600">صفحة {currentPage} من {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setTicketPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                التالي
              </button>
            </div>
          )}
        </div>

        {/* Chat / Detail Area */}
        <div className={`lg:col-span-2 border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col ${!selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
                    title="العودة للقائمة"
                  >
                    <span>← القائمة</span>
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-base">{selectedTicket.subject}</h4>
                      <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                        #{selectedTicket.id}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        selectedTicket.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        selectedTicket.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        selectedTicket.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}>
                        {selectedTicket.status === 'pending' ? 'بانتظار الموافقة' :
                         selectedTicket.status === 'approved' ? 'مقبول ومفتوح' :
                         selectedTicket.status === 'rejected' ? 'مرفوض' : 'محادثة مغلقة'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                      <span>العميل: <strong className="text-white bg-slate-800 px-2 py-0.5 rounded-md">{selectedTicket.customerName || 'عميل مجهول'}</strong></span>
                      <span dir="ltr" className="text-slate-400">({selectedTicket.customerEmail})</span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  {selectedTicket.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus('approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <CheckCircle size={14} /> قبول الطلب
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('rejected')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        <X size={14} /> رفض الطلب
                      </button>
                    </>
                  )}

                  {selectedTicket.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus('closed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-700"
                      title="إغلاق المحادثة نهائياً"
                    >
                      <X size={14} /> إنهاء المحادثة
                    </button>
                  )}

                  {(selectedTicket.status === 'closed' || selectedTicket.status === 'rejected') && (
                    <button
                      onClick={() => handleUpdateStatus('approved')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <CheckCircle size={14} /> إعادة فتح المحادثة
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="إغلاق النافذة"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {messages.map((msg, idx) => {
                  const isStaff = msg.senderType === 'staff';
                  return (
                    <div key={idx} className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-3 ${isStaff ? 'bg-white border border-gray-200 rounded-tr-sm' : 'bg-indigo-600 text-white rounded-tl-sm'}`}>
                        <div className={`text-[10px] mb-1 ${isStaff ? 'text-indigo-600 font-bold' : 'text-indigo-200'}`}>
                          {isStaff ? 'الدعم الفني' : 'العميل'}
                        </div>
                        <p className={`text-sm ${isStaff ? 'text-gray-800' : 'text-white'}`}>{msg.message}</p>
                        
                        {msg.images && msg.images.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {msg.images.map((img: string, i: number) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPreviewImageUrl(img)}
                                className="relative rounded-lg overflow-hidden border border-black/10 group cursor-pointer text-right"
                              >
                                <img src={img} alt="مرفق" className="rounded-lg max-h-32 w-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                                  🔍 تكبير الصورة
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className={`text-[9px] mt-2 text-left ${isStaff ? 'text-gray-400' : 'text-indigo-200'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('ar-JO')}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedTicket.status === 'approved' ? (
                <div className="p-4 border-t border-gray-200 bg-white">
                  {replyImages.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                      {replyImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img src={img} alt="" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                          <button 
                            onClick={() => setReplyImages(replyImages.filter((_, idx) => idx !== i))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shrink-0"
                    >
                      {isUploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <ImageIcon size={20} />}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="اكتب رسالتك هنا..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
                    />
                    
                    <button
                      onClick={handleSendMessage}
                      disabled={(!replyText.trim() && replyImages.length === 0) || isUploading}
                      className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shrink-0 disabled:opacity-50"
                    >
                      <Send size={20} className="rtl:-scale-x-100" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
                  يجب الموافقة على الطلب لتمكين المحادثة مع العميل.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>اختر طلباً من القائمة لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>

      {/* 🖼️ Modal Lightbox for Image Preview */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-xs z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 text-white">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                🖼️ معاينة المرفق (التفاصيل الكاملة)
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  تحميل / فتح برابط مباشر ↗️
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>إغلاق</span>
                  <X size={16} />
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
    </div>
  );
}
