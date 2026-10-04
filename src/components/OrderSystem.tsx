import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Clock, CheckCircle2, ChevronDown, RefreshCw, MessageSquare, Check, AlertTriangle } from 'lucide-react';

export default function OrderSystem({ subdomain, primaryColor }: { subdomain: string, primaryColor: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [orderPayload, setOrderPayload] = useState<any>(null);
  
  const [confirmModalOrder, setConfirmModalOrder] = useState<any>(null);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [trackedOrders, setTrackedOrders] = useState<any[]>([]);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Feedback states for orders in the tracking view
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load tracked orders from localStorage
    const saved = localStorage.getItem(`orders_${subdomain}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTrackedOrders(parsed);
        const hasActiveOrders = parsed.some((o: any) => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'customer_cancelled');
        if (hasActiveOrders) {
          // Auto-open tracking modal to show current orders
          setTimeout(() => {
            setIsTrackOpen(true);
            // We need to pass a callback or useEffect dependency, but we can't call it here easily since it's defined later.
            // Wait, we can just trigger a custom event or let a useEffect handle it.
            window.dispatchEvent(new CustomEvent('CHECK_ORDERS'));
          }, 1500);
        }
      } catch (e) {}
    }

    const handleOpenOrder = (e: any) => {
      setOrderPayload(e.detail);
      setIsOpen(true);
      setSuccess(false);
    };

    window.addEventListener('OPEN_ORDER_MODAL', handleOpenOrder);
    
    // Global Click Analytics Tracker
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, [role="button"]');
      if (clickable) {
        const text = clickable.textContent?.trim().slice(0, 50) || '';
        const id = clickable.id || '';
        fetch(`/api/public/websites/${subdomain}/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'click',
            path: window.location.pathname,
            elementId: id || null,
            elementText: text || null
          })
        }).catch(() => {});
      }
    };
    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('OPEN_ORDER_MODAL', handleOpenOrder);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [subdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/public/websites/${subdomain}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          type: orderPayload?.type || 'general_order',
          details: { 
            message: orderPayload?.message, 
            data: orderPayload?.orderData, 
            items: orderPayload?.items || orderPayload?.orderData?.items 
          },
          totalPrice: orderPayload?.totalPrice || orderPayload?.orderData?.totalPrice || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        // Save order for tracking (Note: backend returns order in data.order, so we read data.order.id)
        const orderId = data.order?.id || data.orderId;
        const newTracked = [{ id: orderId, phone: customerPhone, name: customerName, date: new Date().toISOString(), status: 'pending' }, ...trackedOrders];
        setTrackedOrders(newTracked);
        localStorage.setItem(`orders_${subdomain}`, JSON.stringify(newTracked));
      } else {
        const err = await res.json();
        setError(err.error || 'حدث خطأ أثناء الإرسال');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const checkOrdersStatus = async () => {
    setRefreshing(true);
    try {
      // Reload from local storage in case a new order was added
      const saved = localStorage.getItem(`orders_${subdomain}`);
      let currentTracked = trackedOrders;
      if (saved) {
        try {
          currentTracked = JSON.parse(saved);
        } catch(e) {}
      }

      const updated = await Promise.all(currentTracked.map(async (order: any) => {
        const res = await fetch(`/api/public/orders/${order.id}?phone=${encodeURIComponent(order.phone)}`);
        if (res.ok) {
          const data = await res.json();
          return { ...order, status: data.order.status, details: data.order.details };
        }
        return order;
      }));
      
      // Filter out orders that have been cleared by feedback loop
      const activeOrders = updated.filter(order => !order.details?.customerCleared);
      setTrackedOrders(activeOrders);
      localStorage.setItem(`orders_${subdomain}`, JSON.stringify(activeOrders));
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handleCheck = () => {
      setIsTrackOpen(true);
      checkOrdersStatus();
    };
    window.addEventListener('CHECK_ORDERS', handleCheck);
    return () => window.removeEventListener('CHECK_ORDERS', handleCheck);
  }, [trackedOrders, subdomain]);

  const handleFeedbackSubmit = async (orderId: string, phone: string, feedbackText: string | null, isCleared: boolean) => {
    setSubmittingFeedback(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/public/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          feedback: feedbackText,
          cleared: isCleared
        })
      });

      if (res.ok) {
        // If feedback marks it as cleared (e.g. perfect or feedback submitted), remove from client's tracked list
        if (isCleared) {
          const updated = trackedOrders.filter(o => o.id !== orderId);
          setTrackedOrders(updated);
          localStorage.setItem(`orders_${subdomain}`, JSON.stringify(updated));
        } else {
          await checkOrdersStatus();
        }
      }
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة 🕒';
      case 'confirmed': return 'تم التأكيد ✅';
      case 'completed': return 'مكتمل 🎉';
      case 'cancelled': return 'ملغي ❌';
      default: return 'قيد المراجعة 🕒';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'confirmed': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'completed': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'cancelled': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-amber-500 bg-amber-50 border-amber-200';
    }
  };

  return (
    <>
      {/* Track Orders Button */}
      {trackedOrders.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9900]">
          <button
            onClick={() => { setIsTrackOpen(true); checkOrdersStatus(); }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-white transition-all hover:-translate-y-1 active:scale-95"
            style={{ backgroundColor: primaryColor }}
            dir="rtl"
          >
            <Clock size={20} className="animate-pulse" />
            <span>مراقبة طلبك ({trackedOrders.length})</span>
          </button>
        </div>
      )}

      {/* Track Orders Modal */}
      <AnimatePresence>
        {isTrackOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9950] flex items-center justify-center p-4"
            dir="rtl"
            onClick={() => setIsTrackOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Clock className="text-slate-500" /> متابعة حالة طلبك
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={checkOrdersStatus} className={`p-2 bg-white rounded-full text-slate-500 hover:text-slate-800 shadow-sm ${refreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw size={18} />
                  </button>
                  <button onClick={() => setIsTrackOpen(false)} className="p-2 bg-white rounded-full text-slate-500 hover:text-slate-800 shadow-sm">
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {trackedOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-400 font-bold">لا يوجد طلبات نشطة حالياً.</p>
                  </div>
                ) : (
                  trackedOrders.map((order, idx) => (
                    <div key={idx} className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-bold text-slate-400 block mb-1">طلب رقم #{order.id}</span>
                          <h4 className="font-bold text-slate-800">{new Date(order.date).toLocaleDateString('ar-SA')}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status || 'pending')}`}>
                          {getStatusText(order.status || 'pending')}
                        </span>
                      </div>

                      {order.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-dashed border-slate-100 bg-emerald-50/50 rounded-xl p-3">
                          <p className="text-xs font-bold text-slate-600 mb-2">اكتمل الطلب! هل لديك أي ملاحظات؟</p>
                          <div className="flex gap-2 mb-3">
                            <button
                              disabled={submittingFeedback[order.id]}
                              onClick={() => handleFeedbackSubmit(order.id, order.phone, null, true)}
                              className="flex-1 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={14} /> تمام، لا ملاحظات
                            </button>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={feedbackNotes[order.id] || ''}
                              onChange={e => setFeedbackNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                              placeholder="أدخل ملاحظاتك هنا..."
                              className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-300"
                            />
                            <button
                              disabled={submittingFeedback[order.id] || !feedbackNotes[order.id]}
                              onClick={() => handleFeedbackSubmit(order.id, order.phone, feedbackNotes[order.id], true)}
                              className="px-3 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              إرسال
                            </button>
                          </div>
                        </div>
                      )}

                      {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'customer_cancelled' && (
                        <button
                          type="button"
                          onClick={() => setConfirmModalOrder(order)}
                          className="mt-3 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X size={14} />
                          <span>إلغاء الطلب</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Order Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            dir="rtl"
            onClick={() => !loading && !success && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: primaryColor }}></div>
                <h3 className="text-2xl font-black text-slate-800 relative z-10 flex items-center gap-2">
                  إتمام الطلب <span role="img" aria-label="rocket"></span>
                </h3>
                {!loading && !success && (
                  <button onClick={() => setIsOpen(false)} className="relative z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              {success ? (
                <div className="p-10 text-center flex flex-col items-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h4 className="text-2xl font-black text-slate-800 mb-2">تم استلام طلبك بنجاح!</h4>
                  <p className="text-slate-500 font-medium mb-6">سيتم مراجعة طلبك وتحديث حالته فوراً.</p>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setSuccess(false);
                      setOrderPayload(null);
                      setIsTrackOpen(true);
                      checkOrdersStatus();
                    }}
                    className="w-full py-4 text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 hover:brightness-110"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Clock size={20} />
                    مراقبة طلبك الآن
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 text-center">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكريم <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      disabled={loading}
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-slate-300 rounded-xl px-4 py-3 outline-none transition-colors font-bold text-slate-800"
                      placeholder="محمد عبدالله"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الجوال <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      required
                      disabled={loading}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-slate-300 rounded-xl px-4 py-3 outline-none transition-colors font-bold text-slate-800"
                      placeholder="05X XXX XXXX"
                      dir="ltr"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-black text-white text-lg flex items-center justify-center gap-2 disabled:opacity-70 shadow-xl transition-transform active:scale-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send size={20} />
                          إرسال الطلب الآن
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      {confirmModalOrder && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">إلغاء الطلب ⚠️</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم إيقاف معالجة الطلب نهائياً.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  const targetOrd = confirmModalOrder;
                  setConfirmModalOrder(null);
                  try {
                    await fetch(`/api/public/orders/${targetOrd.id}/cancel`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phone: targetOrd.phone })
                    });
                    const updated = trackedOrders.map(o => o.id === targetOrd.id ? { ...o, status: 'customer_cancelled', details: { ...o.details, cancelledBy: 'customer' } } : o);
                    setTrackedOrders(updated);
                    localStorage.setItem(`orders_${subdomain}`, JSON.stringify(updated));
                  } catch (e) {
                    console.error('Error cancelling order:', e);
                  }
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                نعم، إلغاء الطلب
              </button>
              <button
                type="button"
                onClick={() => setConfirmModalOrder(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                تراجع والاحتفاظ بالطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

