import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Lock, X, Globe, Sparkles, CreditCard, Apple, Smartphone, MessageCircle, AlertTriangle, Copy, Check, ExternalLink, Phone } from 'lucide-react';
import { auth } from '../lib/firebase.ts';
import { checkFeatureLock, fetchSystemSettings } from '../lib/systemSettingsClient.ts';
import { getSubscriptionPlans, formatCurrencyPrice } from '../lib/subscriptionPlans.ts';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentDetails: { provider: string; invoiceId: string; plan: string; billingCycle: 'monthly' | 'yearly'; price: string; customDomain?: string; storeName?: string }) => void;
  tenantName: string;
  planName?: string;
  amount?: string;
  templateId?: number | string;
}

function PayPalSmartButtons({ handleCreateOrder, handlePayPalApprove, setErrorMessage }: {
  handleCreateOrder: () => Promise<string>;
  handlePayPalApprove: (data: { orderID: string }) => Promise<void>;
  setErrorMessage: (msg: string | null) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="bg-slate-900 text-white p-5 rounded-2xl text-center space-y-2">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold">جاري تحميل أزرار باي بال المباشرة...</p>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="bg-amber-950/80 border border-amber-500/40 text-amber-100 p-4 rounded-2xl text-center space-y-3">
        <p className="text-xs font-bold">⚠️ يتعذر اتصال المتصفح المباشر بالنطاق السريع لـ PayPal.</p>
        <p className="text-[11px] text-amber-300/80">يمكنك المتابعة بإنشاء الطلب والانتقال فوراً لصفحة الدفع بـ PayPal.</p>
        <button
          type="button"
          onClick={async () => {
            try {
              const orderId = await handleCreateOrder();
              window.open(`https://www.paypal.com/checkoutnow?token=${orderId}`, '_blank');
            } catch (err: any) {
              setErrorMessage(err.message || 'فشل الاتصال بـ PayPal');
            }
          }}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer"
        >
          الانتقال المباشر لـ PayPal (Checkout) 🔗
        </button>
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{ layout: "vertical", color: "gold", shape: "rect", label: "subscribe" }}
      createOrder={async () => {
        try {
          return await handleCreateOrder();
        } catch (err: any) {
          setErrorMessage(err.message || "حدث خطأ في إنشاء الطلب عبر باي بال.");
          throw err;
        }
      }}
      onApprove={async (data) => {
        await handlePayPalApprove({ orderID: data.orderID });
      }}
      onError={(err) => {
        console.error("PayPal Error:", err);
        setErrorMessage("حدث خطأ في بوابة PayPal. يرجى التأكد من بيانات الدفع ومحاولة مرة أخرى.");
      }}
      onCancel={() => {
        setErrorMessage("تم إلغاء عملية الدفع من قبل المستخدم.");
      }}
    />
  );
}

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  tenantName,
  planName,
  amount,
  templateId
}: PaymentCheckoutModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedMethod, setSelectedMethod] = useState<string>('paypal');
  const [domainOption, setDomainOption] = useState<'free' | 'custom'>('free');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [storeNameInput, setStoreNameInput] = useState(() => tenantName || (typeof window !== 'undefined' ? localStorage.getItem('tenant_store_name') : null) || 'موقعي الخاص');
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const storedCurrency = (typeof window !== 'undefined' ? (localStorage.getItem('app_currency') || localStorage.getItem('currency') || 'USD') : 'USD').toUpperCase();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('selectedPlanId') : null;
    if (storedId && ['starter', 'monthly', 'yearly', 'pro', 'enterprise'].includes(storedId)) {
      if (storedId === 'pro') return 'monthly';
      if (storedId === 'enterprise') return 'yearly';
      return storedId;
    }
    if (planName?.includes('Starter') || planName?.includes('مجانية')) return 'starter';
    if (planName?.includes('Enterprise') || planName?.includes('الشركات') || planName?.includes('سنوي') || planName?.includes('Yearly')) return 'yearly';
    return 'monthly';
  });

  const plans = getSubscriptionPlans(storedCurrency, domainOption === 'custom');
  const activePlan = plans.find(p => p.id === selectedPlanId) || plans[1];
  const effectivePlanTitle = activePlan.name;
  const isFreePlan = activePlan.id === 'starter' || activePlan.rawPriceSAR === '0.00';

  let calculatedPriceUSD = 0;
  if (!isFreePlan) {
    if (selectedPlanId === 'yearly') {
      calculatedPriceUSD = domainOption === 'custom' ? 362 : 350;
    } else {
      calculatedPriceUSD = domainOption === 'custom' ? 40 : 35;
    }
  }
  const effectiveAmount = isFreePlan ? activePlan.price : formatCurrencyPrice(calculatedPriceUSD, storedCurrency);

  useEffect(() => {
    if (isOpen) {
      fetchSystemSettings(true).then((fresh) => {
        if (fresh.lockSubscriptions) {
          setLockedNotice(fresh.customNoticeMessage || 'توجد مشكلة مؤقتة في بوابة الدفع الإلكتروني حالياً. يمكنك تفعيل اشتراكك وتأكيده مباشرة عبر الواتساب.');
        } else {
          setLockedNotice(null);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isFreePlan && domainOption === 'custom') {
      setDomainOption('free');
    }
  }, [isFreePlan, domainOption]);

  if (!isOpen) return null;

  const handlePayPalApprove = async (data: { orderID: string }) => {
    const fresh = await fetchSystemSettings(true);
    if (fresh.lockSubscriptions) {
      setLockedNotice(fresh.customNoticeMessage || 'مغلق الآن - الاشتراكات مغلقة حالياً من الإدارة');
      return;
    }
    const userEmail = auth.currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : null);
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    const lockCheck = checkFeatureLock('subscriptions', userEmail, userRole);
    if (lockCheck.isLocked) {
      setLockedNotice(lockCheck.noticeMessage || 'مغلق الآن - خدمة الاشتراكات مغلقة');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
      const finalDomain = domainOption === 'custom' && customDomainInput.trim() ? customDomainInput.trim() : undefined;

      const captureRes = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderId: data.orderID,
          plan: effectivePlanTitle,
          amount: effectiveAmount,
          tenantName: storeNameInput,
          customDomain: finalDomain,
          billingCycle,
          templateId
        })
      });

      const captureData = await captureRes.json();
      if (!captureRes.ok || !captureData.success) {
        throw new Error(captureData.error || 'فشل إتمام معاملة الدفع عبر باي بال');
      }

      setIsProcessing(false);
      if (storeNameInput) {
        document.title = `${storeNameInput} - منصة المتاجر`;
        localStorage.setItem('tenant_store_name', storeNameInput);
      }
      onSuccess({
        provider: 'PayPal (حسابك التجاري المباشر ⚡)',
        invoiceId: captureData.invoiceId || `PP-${data.orderID}`,
        plan: effectivePlanTitle,
        billingCycle,
        price: effectiveAmount,
        customDomain: finalDomain,
        storeName: storeNameInput
      });
      onClose();
    } catch (err: any) {
      console.error('PayPal capture error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء تأكيد الدفع وتفعيل الاشتراك');
    }
  };

  const handleFreeTrialActivation = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const fresh = await fetchSystemSettings(true);
      if (fresh.lockSubscriptions) {
        setLockedNotice(fresh.customNoticeMessage || 'مغلق الآن - الاشتراكات مغلقة حالياً من الإدارة');
        setIsProcessing(false);
        return;
      }
      const userEmail = auth.currentUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('user_email') : null);
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
      const lockCheck = checkFeatureLock('subscriptions', userEmail, userRole);
      if (lockCheck.isLocked) {
        setLockedNotice(lockCheck.noticeMessage || 'مغلق الآن - خدمة الاشتراكات مغلقة');
        setIsProcessing(false);
        return;
      }

      const trialInvoiceId = `TRIAL-${Date.now()}`;
      if (storeNameInput) {
        document.title = `${storeNameInput} - منصة المتاجر`;
        localStorage.setItem('tenant_store_name', storeNameInput);
      }
      onSuccess({
        provider: 'تفعيل مجاني (Free Trial)',
        invoiceId: trialInvoiceId,
        plan: effectivePlanTitle,
        billingCycle: 'monthly',
        price: '0.00',
        customDomain: undefined,
        storeName: storeNameInput
      });
      onClose();
    } catch (err: any) {
      console.error('Free trial activation error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء تفعيل التجربة المجانية');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (storeNameInput) {
        document.title = `${storeNameInput} - منصة المتاجر`;
        localStorage.setItem('tenant_store_name', storeNameInput);
      }
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
      const finalDomain = domainOption === 'custom' && customDomainInput.trim() ? customDomainInput.trim() : undefined;
      const cycle = selectedPlanId === 'yearly' ? 'yearly' : 'monthly';

      const res = await fetch('/api/tenants/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          plan: effectivePlanTitle,
          amount: effectiveAmount,
          tenantName: storeNameInput,
          customDomain: finalDomain,
          billingCycle: cycle,
          templateId,
          provider: 'بطاقة ائتمانية آمنة'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل تفعيل الاشتراك');
      }

      onSuccess({
        provider: 'بطاقة ائتمانية آمنة',
        invoiceId: data.invoiceId || `INV-${Date.now()}`,
        plan: effectivePlanTitle,
        billingCycle: cycle,
        price: effectiveAmount,
        customDomain: finalDomain,
        storeName: storeNameInput
      });
      onClose();
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء معالجة الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrder = async () => {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
    const createRes = await fetch('/api/payments/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        amount: effectiveAmount,
        amountUSD: calculatedPriceUSD,
        plan: effectivePlanTitle
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      throw new Error(createData.error || 'فشل إنشاء طلب الدفع');
    }
    return createData.orderId;
  };

  const envClientId = ((import.meta as any).env?.VITE_PAYPAL_CLIENT_ID as string)?.trim();
  const liveClientId = "AS--SzWdCpnGsTo9Jqhes9-sY1Mf7LnVmGZjzRRZN7Y-OHaeEDTSJGIyA81oaaowV3XNA3hmSujWjpXo";
  const paypalClientId = envClientId || liveClientId;

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD", intent: "capture" }}>
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col" dir="rtl">
          
          {/* Header */}
          <div className="bg-gradient-to-l from-slate-900 to-blue-950 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center text-blue-400">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black">الدفع الآمن عبر PayPal (حصرياً)</h2>
                <p className="text-xs text-blue-200">الدفع المسبق الإلزامي لتفعيل القالب وإنشاء المشروع فوراً</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Locked Service / Payment Gateway Issue Banner */}
          {lockedNotice && (
            <div className="bg-amber-950/90 border-b border-amber-500/40 px-6 py-5 text-right text-amber-100 space-y-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <span>توجد مشكلة مؤقتة في بوابة الدفع الإلكتروني ⚠️</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-bold">
                {lockedNotice}
              </p>

              <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={`https://wa.me/962778091269?text=${encodeURIComponent(
                    tenantName || planName 
                      ? `اريد الاشتراك بقالب (${tenantName || planName}) هل يمكنني معرفة التفاصيل` 
                      : `اريد الاشتراك بقالب هل يمكنني معرفة التفاصيل`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageCircle size={18} className="fill-white/20" />
                  <span>تواصل مع إدارة المنصة 💬</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center gap-3 text-red-800 font-bold text-xs animate-in slide-in-from-top-2">
              <span className="text-red-600 font-bold shrink-0">⚠️ تنبيه:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">

            {/* Plan Selector Grid */}
            <div className="space-y-3 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-white flex items-center gap-1.5">
                  <Sparkles size={16} className="text-blue-400" />
                  <span>اختر باقة الاشتراك:</span>
                </label>
                <span className="text-[10px] text-slate-400 font-bold">يتم التفعيل فور نجاح الدفع</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {plans.map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(p.id);
                        localStorage.setItem('selectedPlanId', p.id);
                        if (p.id === 'starter') {
                          setDomainOption('free');
                        }
                      }}
                      className={`p-3 rounded-xl border text-right transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 text-white ring-2 ring-blue-500/30 shadow-md'
                          : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute -top-2 left-2 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          الأكثر طلباً
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs block text-white">{p.name}</span>
                          {isSelected && <CheckCircle2 size={15} className="text-blue-400 shrink-0" />}
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-sm font-black text-blue-400">{p.price}</span>
                          <span className="text-[10px] text-slate-400">/ {p.duration}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domain Option Selector */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Globe size={16} className="text-blue-600" />
                  <span>نطاق الموقع (الدومين):</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDomainOption('free')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                    domainOption === 'free'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="block font-black">بدون دومين خاص</span>
                    <span className="text-[10px] text-slate-500">استخدام النطاق الافتراضي المجاني</span>
                  </div>
                  {domainOption === 'free' && <CheckCircle2 size={16} className="text-blue-600" />}
                </button>

                <button
                  type="button"
                  disabled={isFreePlan}
                  onClick={() => {
                    if (isFreePlan) return;
                    setDomainOption('custom');
                  }}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                    isFreePlan
                      ? 'opacity-60 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                      : domainOption === 'custom'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="block font-black">مع دومين مخصص</span>
                      {isFreePlan && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          يتطلب باقة مدفوعة
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {selectedPlanId === 'yearly'
                        ? `إضافة نطاق خاص (+${formatCurrencyPrice(12, storedCurrency)} سنوياً)`
                        : `إضافة نطاق خاص (+${formatCurrencyPrice(5, storedCurrency)} شهرياً)`}
                    </span>
                  </div>
                  {domainOption === 'custom' && !isFreePlan && <CheckCircle2 size={16} className="text-blue-600" />}
                </button>
              </div>

              {domainOption === 'custom' && !isFreePlan && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">اكتب اسم الدومين المطلوب (مثال: mystore.com):</label>
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="mystore.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 dir-ltr text-left"
                  />
                </div>
              )}
            </div>

            {/* Premium Store Name Input */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/60 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
              
              <div className="relative z-10 space-y-3">
                <label className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Globe size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 block">اسم نشاطك التجاري أو موقعك</span>
                    <span className="text-[10px] text-slate-500 font-bold">سيتم اعتماده كاسم رسمي في كافة أنحاء المنصة والاشعارات</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={storeNameInput}
                    onChange={(e) => {
                      setStoreNameInput(e.target.value);
                      localStorage.setItem('tenant_store_name', e.target.value);
                      document.title = `${e.target.value || 'موقعي'} - منصة المتاجر`;
                    }}
                    placeholder="مثال: مطعم النور، شركة الأفق..."
                    className="w-full px-4 py-3.5 bg-white border-2 border-white focus:border-blue-500 rounded-2xl text-sm font-black text-slate-900 outline-none shadow-sm transition-all placeholder:text-slate-400 placeholder:font-medium"
                  />
                  {storeNameInput && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 p-1.5 rounded-lg">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block mb-1">الخطة المختارة للقالب:</span>
                <h3 className="font-black text-slate-900 text-sm md:text-base">{effectivePlanTitle}</h3>
                <p className="text-xs text-blue-700 font-bold mt-1">المشروع / المتجر: {tenantName}</p>
              </div>
              <div className="text-left dir-ltr">
                <span className="text-[10px] text-slate-500 block font-sans">الإجمالي المطلوب</span>
                <span className="text-lg md:text-xl font-black text-blue-800">{effectiveAmount}</span>
              </div>
            </div>

            {/* Strict PayPal Paywall & Provisioning Instruction */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-950">
                <ShieldCheck size={18} className="text-amber-600 shrink-0" />
                <span>نظام الدفع المشدد (Pay-First-Then-Provision):</span>
              </div>
              <p className="leading-relaxed">
                لا يمكن الوصول إلى لوحة الإدارة أو القالب إلا بعد إتمام الدفع بنجاح وتأكيد عملية التحويل عبر باي بال. اضغط على زر باي بال أدناه للدفع الفوري.
              </p>
            </div>

            {/* Payment Method Selector - PayPal Only */}
            <div className="pt-2 space-y-3">
              <label className="text-xs font-black text-slate-800 block mb-2">طريقة الدفع المتاحة:</label>

              {/* الخيار الوحيد: PayPal */}
              <div 
                className="relative flex items-center justify-between p-4 rounded-2xl border-2 border-amber-500 bg-amber-50/50 shadow-md shadow-amber-900/5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center w-10 h-10">
                    PP
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">PayPal</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">الدفع العالمي المباشر عبر حساب باي بال</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-amber-600 animate-in zoom-in duration-200" />
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-2">
              {isProcessing ? (
                <div className="bg-slate-900 text-white p-6 rounded-2xl text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-black">جاري التوجيه لبوابة الدفع وتأكيد الحساب...</p>
                </div>
              ) : selectedMethod === 'paypal' ? (
                <div className="z-10 relative mt-2 space-y-3">
                  <PayPalSmartButtons
                    handleCreateOrder={handleCreateOrder}
                    handlePayPalApprove={handlePayPalApprove}
                    setErrorMessage={setErrorMessage}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCardPayment}
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 text-sm mt-2 cursor-pointer"
                >
                  <span>متابعة للدفع الآمن عبر البطاقة ({effectiveAmount})</span>
                </button>
              )}
            </div>

          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <span className="text-[11px] text-slate-500 font-bold">مدعوم بواسطة PayPal Commercial Gateway ⚡</span>
          </div>

        </div>
      </div>
    </PayPalScriptProvider>
  );
}
