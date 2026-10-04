import React, { useState } from 'react';
import { ShoppingBag, User, Phone, Mail, MessageCircle, Trash2, RefreshCw, AlertTriangle, Eye, X, FileText, Tag, Share2, Truck, Send } from 'lucide-react';
import CourierShareModal from '../../CourierShareModal';

interface OrdersTabProps {
  orders: any[];
  tenant?: any;
  content?: any;
  templateId?: number;
  dashboardColor?: string;
  fetchOrders: (authToken?: string) => Promise<void> | void;
  handleUpdateOrderStatus: (orderId: string | number, newStatus: string, details?: any) => Promise<void>;
  handleDeleteOrder?: (orderId: string | number) => Promise<void>;
  handleRestoreOrder?: (orderId: string | number) => Promise<void>;
  handlePermanentDeleteOrder?: (orderId: string | number) => Promise<void>;
  setOrders?: any;
  showToast?: any;
  isCozyCafe?: boolean;
}

export const getOrderDisplayPrice = (order: any) => {
  if (!order) return 'مجاني / استفسار';

  // 1. Direct top-level fields
  if (order.totalPrice && String(order.totalPrice).trim() !== '' && String(order.totalPrice).trim() !== '0') {
    return String(order.totalPrice);
  }
  if (order.total && String(order.total).trim() !== '' && String(order.total).trim() !== '0') {
    return String(order.total);
  }

  // 2. Nested details fields
  const details = order.details || {};
  if (details.finalTotal && String(details.finalTotal).trim() !== '' && String(details.finalTotal).trim() !== '0') {
    return String(details.finalTotal);
  }
  if (details.total && String(details.total).trim() !== '' && String(details.total).trim() !== '0') {
    return String(details.total);
  }
  if (details.cartTotal && String(details.cartTotal).trim() !== '' && String(details.cartTotal).trim() !== '0') {
    return String(details.cartTotal);
  }
  if (details.subtotal && String(details.subtotal).trim() !== '' && String(details.subtotal).trim() !== '0') {
    return String(details.subtotal);
  }

  // 3. Sum up items if available
  const items = Array.isArray(order.items) ? order.items : (Array.isArray(details.items) ? details.items : []);
  if (items && items.length > 0) {
    let calculatedSum = 0;
    let hasNumericPrice = false;
    let currencySymbol = '';

    for (const item of items) {
      if (item) {
        const itemPriceStr = String(item.price || item.unitPrice || '0');
        const numericMatch = itemPriceStr.match(/[\d.]+/);
        if (numericMatch) {
          const num = parseFloat(numericMatch[0]);
          const qty = Number(item.quantity || item.qty || 1);
          if (!isNaN(num) && num > 0) {
            calculatedSum += num * qty;
            hasNumericPrice = true;
          }
        }
        if (!currencySymbol) {
          if (itemPriceStr.includes('ريال')) currencySymbol = 'ريال';
          else if (itemPriceStr.includes('د.أ') || itemPriceStr.includes('دينار')) currencySymbol = 'د.أ';
          else if (itemPriceStr.includes('$')) currencySymbol = '$';
          else if (itemPriceStr.includes('€')) currencySymbol = '€';
          else if (itemPriceStr.includes('ج.م')) currencySymbol = 'ج.م';
          else if (itemPriceStr.includes('د.إ')) currencySymbol = 'د.إ';
        }
      }
    }

    if (hasNumericPrice && calculatedSum > 0) {
      return `${calculatedSum} ${currencySymbol || 'د.أ'}`.trim();
    }
  }

  // 4. Fallback check for inquiry orders
  if (order.type === 'property_inquiry' || order.type === 'consultation' || order.type === 'contact') {
    return 'طلب استفسار';
  }

  return 'مجاني / استفسار';
};

export default function OrdersTab({
  orders,
  tenant,
  content,
  templateId,
  dashboardColor,
  fetchOrders,
  handleUpdateOrderStatus,
  handleDeleteOrder,
  handleRestoreOrder,
  handlePermanentDeleteOrder
}: OrdersTabProps) {
  const [orderSubTab, setOrderSubTab] = useState<'active' | 'completed'>('active');
  const [assignCourierOrder, setAssignCourierOrder] = useState<any>(null);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState<any>(null);
  const [shareOrderModal, setShareOrderModal] = useState<any>(null);
  const [platformModal, setPlatformModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type?: 'danger' | 'warning' | 'success';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const isFastFoodDelivery = templateId === 5;
  const isSpecialtyCoffee = templateId === 3;
  const isLuxuryRestaurant = templateId === 1;

  const openWhatsApp = (phone: string, customerName: string) => {
    const businessName = content?.businessName || tenant?.name || 'موقعنا';
    let cleanPhone = (phone || '').trim().replace(/[^\d]/g, '');

    // Strip leading 00 if present (e.g. 0096277... -> 96277...)
    if (cleanPhone.startsWith('00')) {
      cleanPhone = cleanPhone.substring(2);
    }

    // If starts with single 0 (local number entered without country code)
    if (cleanPhone.startsWith('0')) {
      const defaultPrefix = content?.countryCode || (content?.currency === 'JOD' ? '962' : content?.currency === 'EGP' ? '20' : content?.currency === 'AED' ? '971' : '966');
      cleanPhone = defaultPrefix + cleanPhone.substring(1);
    }

    let message = `مرحباً ${customerName}، يسعدنا تواصلك معنا بخصوص طلبك عبر موقعنا (${businessName})...`;

    if (isLuxuryRestaurant) {
      message = `مرحباً بك ${customerName}، يسعدنا تواصلك مع إدارة المطعم الفاخر (${businessName}) بخصوص طلبك وحجز الطاولة الخاصة بك...`;
    } else if (isFastFoodDelivery) {
      message = `أهلاً بك ${customerName}! معك خدمة العملاء لمطعم ${businessName} للتوصيل السريع 🍔🛵 بخصوص طلبك رقم...`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const isCustomerCancelled = (o: any) => o.status === 'customer_cancelled' || o.details?.cancelledBy === 'customer' || o.cancelledBy === 'customer';
  const isAdminCancelled = (o: any) => (o.status === 'cancelled' || o.status === 'deleted' || o.deletedAt != null || o.status === 'ملغي') && !isCustomerCancelled(o);
  const isCompletedOrder = (o: any) => o.status === 'completed' || o.status === 'مكتمل';

  const activeOrders = orders.filter(o => !isCompletedOrder(o) && !isAdminCancelled(o) && !isCustomerCancelled(o));
  const completedAndCancelledOrders = orders.filter(o => isCompletedOrder(o) || isAdminCancelled(o) || isCustomerCancelled(o));

  const filteredOrders = orderSubTab === 'active' ? activeOrders : completedAndCancelledOrders;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-50 gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-xl font-black">الطلبات الواردة مباشرة من الموقع</h3>
            <p className="text-slate-500 text-xs mt-0.5">هنا تصلك جميع الطلبات والاستفسارات التي يقوم الزبائن بإرسالها حياً من موقعك.</p>
          </div>

          {/* Sub tabs filtering */}
          <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1 self-stretch lg:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setOrderSubTab('active')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                orderSubTab === 'active' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الطلبات النشطة ({activeOrders.length})
            </button>

            <button
              type="button"
              onClick={() => setOrderSubTab('completed')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                orderSubTab === 'completed' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الطلبات المكتملة والملغية ({completedAndCancelledOrders.length})
            </button>
          </div>

          <button onClick={() => fetchOrders()} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer">
            تحديث القائمة 🔄
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <ShoppingBag className="w-14 h-14 mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-700">
              {orderSubTab === 'active' 
                ? 'لا يوجد طلبات أو استفسارات نشطة حالياً' 
                : orderSubTab === 'completed'
                ? 'لا يوجد طلبات مكتملة بعد'
                : 'لا يوجد طلبات محذوفة أو ملغية بعد'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {orderSubTab === 'active' 
                ? 'عندما يقوم زوار موقعك بتقديم طلب جديد، سيظهر في هذه القائمة فوراً لتتمكن من إدارته.' 
                : orderSubTab === 'completed'
                ? 'الطلبات التي تكتمل بنجاح ستنتقل تلقائياً إلى هذا القسم للأرشفة.'
                : 'الطلبات الملغية أو المحذوفة تنتقل هنا. طلبات العميل الملغية تكون للقراءة فقط، أما طلبات الإدارة الملغية فيمكنك استرجاعها لتنشط من جديد.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-24">رقم الطلب</th>
                  <th className="px-6 py-4">العميل ومعلومات التواصل</th>
                  <th className="px-6 py-4">نوع الطلب</th>
                  <th className="px-6 py-4">تفاصيل الطلب / الرسالة والتقييمات</th>
                  <th className="px-6 py-4 w-32">السعر الإجمالي</th>
                  <th className="px-6 py-4 w-36">حالة الطلب</th>
                  <th className="px-6 py-4 text-center w-28">الواتساب / إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order, idx) => (
                  <tr key={order.id || idx} className="hover:bg-slate-50 transition-colors">
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono font-black" style={{ color: dashboardColor }}>
                      #{order.id}
                    </td>

                    {/* Client Details */}
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        {order.customerName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5" dir="ltr">
                        <Phone size={12} className="text-slate-400" />
                        {order.customerPhone}
                      </div>
                      {order.customerEmail && (
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5" dir="ltr">
                          <Mail size={12} className="text-slate-400" />
                          {order.customerEmail}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-SA') : 'الآن'}
                      </div>
                    </td>

                    {/* Order Type */}
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                        order.type === 'food_order' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        order.type === 'property_inquiry' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {order.type === 'food_order' && 'طلب طعام'}
                        {order.type === 'property_inquiry' && 'استفسار عقار'}
                        {order.type === 'quote_request' && 'طلب تسعيرة'}
                        {order.type === 'ecommerce_order' && 'طلب متجر'}
                        {order.type === 'electronics_order' && 'طلب إلكترونيات'}
                        {(order.type === 'general_order' || !order.type) && 'طلب عام'}
                      </span>
                    </td>

                    {/* Order details + Feedback */}
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex flex-col sm:flex-row gap-1.5 mb-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderModal(order)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-[1.01]"
                          title="عرض تفاصيل الطلب الكاملة"
                        >
                          <Eye size={14} />
                          <span>التفاصيل 👁️</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShareOrderModal(order)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs hover:scale-[1.01]"
                          title="مشاركة تفاصيل الطلب مع المندوب عبر الواتساب أو PDF"
                        >
                          <Truck size={14} className="text-emerald-600" />
                          <span>مشاركة مع مندوب 📲</span>
                        </button>
                      </div>

                      {(order.type === 'food_order' || Array.isArray(order.items)) ? (
                        <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                            <div key={i} className="text-xs flex items-center justify-between gap-3 font-medium text-slate-700 bg-white p-1.5 rounded-lg border border-slate-200">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-900 block truncate">{item.name || item.title || item.product?.title}</span>
                                {(item.selectedStorage || item.selectedColor || item.selectedSize || item.color || item.storage) && (
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    {(item.selectedStorage || item.storage) && `السعة: ${item.selectedStorage || item.storage}`}
                                    {(item.selectedStorage || item.storage) && (item.selectedColor || item.color || item.selectedSize) && ' | '}
                                    {(item.selectedColor || item.color) && `اللون: ${item.selectedColor || item.color}`}
                                    {item.selectedSize && `المقاس: ${item.selectedSize}`}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-black font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">الكمية: x{item.quantity || 1}</span>
                                <span className="font-bold font-mono text-xs" style={{ color: dashboardColor }}>{item.price}</span>
                              </div>
                            </div>
                          ))}
                          {order.details?.notes && (
                            <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-1 mt-1">
                              📌 ملاحظة: {order.details.notes}
                            </p>
                          )}
                          {order.details?.address && (
                            <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-1 mt-1">
                              📍 العنوان: {order.details.address}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {order.details?.propertyTitle && (
                            <p className="font-bold text-slate-800 mb-1">🏠 العقار: {order.details.propertyTitle}</p>
                          )}
                          {order.details?.serviceTitle && (
                            <p className="font-bold text-slate-800 mb-1">🏗️ الخدمة: {order.details.serviceTitle}</p>
                          )}
                          <p className="italic bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-500">
                            "{order.details?.message || 'لا يوجد تفاصيل رسالة مضافة'}"
                          </p>
                          {order.details?.address && (
                            <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-1 mt-1">
                              📍 العنوان: {order.details.address}
                            </p>
                          )}
                        </div>
                      )}

                      
                      {/* Courier Information */}
                      {order.details?.courierName && (
                        <div className="mt-2 text-[11px] bg-indigo-50 text-indigo-700 p-2 rounded-lg font-bold flex flex-col gap-1">
                          <div>المندوب: {order.details.courierName}</div>
                          {order.details.courierPhone && <div>الهاتف: {order.details.courierPhone}</div>}
                        </div>
                      )}

                      {/* Feedback Block for Completed Orders */}
                      {order.status === 'completed' && (
                        <div className="mt-2.5 pt-2 border-t border-slate-150">
                          {order.details?.feedback ? (
                            <div className="bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-2xl text-xs text-emerald-800 shadow-sm">
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                <span>⭐</span>
                                <span>ملاحظة العميل:</span>
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-lg text-[10px] font-black">
                                  {order.details?.feedbackRating || 5}/5
                                </span>
                              </div>
                              <p className="italic text-[11px] text-emerald-700 leading-relaxed">
                                "{order.details.feedback}"
                              </p>
                            </div>
                          ) : order.details?.customerCleared ? (
                            <div className="bg-sky-50 border border-sky-100 p-2.5 rounded-2xl text-xs text-sky-800 font-bold flex items-center gap-1.5 shadow-sm">
                              <span className="text-sm">👍</span>
                              <span>أكد العميل عدم وجود ملاحظات (مكتمل تماماً)</span>
                            </div>
                          ) : (
                            <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-[10px] text-slate-400 italic flex items-center gap-1.5">
                              <span>⏳</span>
                              <span>بانتظار أن يضع الزبون ملاحظاته أو تؤكد استلامه...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Total Price */}
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono text-sm">
                      {getOrderDisplayPrice(order)}
                    </td>

                    {/* Status update selector */}
                    <td className="px-6 py-4">
                      {isCustomerCancelled(order) ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-black">
                            🛑 ملغي بواسطة العميل
                          </span>
                          <p className="text-[10px] text-rose-500 font-bold">لا يمكن استرجاعه</p>
                        </div>
                      ) : isAdminCancelled(order) ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-black">
                            ⚠️ ملغي بواسطة الإدارة
                          </span>
                        </div>
                      ) : order.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black">
                          ✅ مكتمل بنجاح
                        </span>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => {
                            if (e.target.value === 'on_the_way') {
                              setAssignCourierOrder(order);
                            } else {
                              handleUpdateOrderStatus(order.id, e.target.value);
                            }
                          }}
                          className={`font-bold text-xs rounded-xl border px-3 py-1.5 outline-none cursor-pointer ${
                            order.status === 'pending' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                            order.status === 'confirmed' || order.status === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'on_the_way' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isFastFoodDelivery ? (
                            <>
                              <option value="pending">⏳ جديد - قيد التأكيد</option>
                              <option value="preparing">🍳 جاري التحضير بالمطبخ</option>
                              <option value="on_the_way">🛵 مع الكابتن بالطريق</option>
                              <option value="completed">✅ تم التسليم للزبون</option>
                              <option value="cancelled">❌ ملغي (من الإدارة)</option>
                            </>
                          ) : isSpecialtyCoffee ? (
                            <>
                              <option value="pending">⏳ جديد - بانتظار الاعتماد</option>
                              <option value="preparing">☕ جاري التحضير والتقطير</option>
                              <option value="on_the_way">📦 جاهز للاستلام / الشحن</option>
                              <option value="completed">✅ تم التسليم بنجاح</option>
                              <option value="cancelled">❌ ملغي (من الإدارة)</option>
                            </>
                          ) : (
                            <>
                              <option value="pending">جديد / قيد الانتظار</option>
                              <option value="confirmed">قيد التجهيز / التواصل</option>
                              <option value="on_the_way">جاري الشحن / مع المندوب</option>
                              <option value="completed">مكتمل بنجاح</option>
                              <option value="cancelled">ملغي (من الإدارة)</option>
                            </>
                          )}
                        </select>
                      )}
                    </td>

                    {/* WhatsApp direct contact & Delete / Restore */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* If order was cancelled by ADMIN, show Restore Order button */}
                        {isAdminCancelled(order) && (
                          <button
                            type="button"
                            onClick={() => {
                              setPlatformModal({
                                isOpen: true,
                                title: 'إشعار من المنصة: استرجاع وإعادة تنشيط الطلب 🔄',
                                message: `هل ترغب في استرجاع الطلب رقم #${order.id} ونقله إلى قائمة الطلبات النشطة؟`,
                                confirmText: 'نعم، إعادة تنشيط الطلب',
                                cancelText: 'إلغاء والتراجع',
                                type: 'success',
                                onConfirm: async () => {
                                  if (handleRestoreOrder) {
                                    await handleRestoreOrder(order.id);
                                  } else {
                                    await handleUpdateOrderStatus(order.id, 'pending', { cancelledBy: null });
                                  }
                                }
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95"
                            title="إعادة تنشيط الطلب"
                          >
                            <RefreshCw size={13} />
                            <span>إعادة تنشيط 🔄</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openWhatsApp(order.customerPhone, order.customerName)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all hover:-translate-y-0.5 cursor-pointer"
                          title="تواصل سريع واتساب"
                        >
                          <MessageCircle size={16} />
                          <span className="text-[10px] font-bold hidden md:inline">مراسلة</span>
                        </button>

                        {orderSubTab === 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPlatformModal({
                                isOpen: true,
                                title: 'إلغاء الطلب ونقله إلى قسم الطلبات الملغية 🗑️',
                                message: `هل أنت متأكد من إلغاء الطلب رقم #${order.id}؟ سينتقل إلى قسم "الطلبات الملغية" ويمكنك إعادة تنشيطه لاحقاً.`,
                                confirmText: 'نعم، إلغاء الطلب',
                                cancelText: 'إلغاء والتراجع',
                                type: 'danger',
                                onConfirm: async () => {
                                  await handleUpdateOrderStatus(order.id, 'cancelled', { cancelledBy: 'admin', cancelledAt: new Date().toISOString() });
                                }
                              });
                            }}
                            className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                            title="إلغاء الطلب"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Mobile Card List View (مناسب تماماً للجوال) */}
            <div className="block md:hidden p-4 space-y-4 bg-slate-50/50">
              {filteredOrders.map((order, idx) => (
                <div key={order.id || idx} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  {/* Card Header: Order ID & Status */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm px-3 py-1 bg-slate-100 rounded-xl" style={{ color: dashboardColor }}>
                        #{order.id}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA') : 'اليوم'}
                      </span>
                    </div>

                    {/* Order Status Badge or Dropdown */}
                    {isCustomerCancelled(order) ? (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-xs font-black">
                        🛑 ملغي بواسطة العميل
                      </span>
                    ) : isAdminCancelled(order) ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-black">
                        ⚠️ ملغي بواسطة الإدارة
                      </span>
                    ) : order.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-black">
                        ✅ مكتمل بنجاح
                      </span>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => {
                          if (e.target.value === 'on_the_way') {
                            setAssignCourierOrder(order);
                          } else {
                            handleUpdateOrderStatus(order.id, e.target.value);
                          }
                        }}
                        className={`font-bold text-xs rounded-xl border px-2.5 py-1 outline-none cursor-pointer ${
                          order.status === 'pending' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                          order.status === 'confirmed' || order.status === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'on_the_way' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isFastFoodDelivery ? (
                          <>
                            <option value="pending">⏳ جديد - قيد التأكيد</option>
                            <option value="preparing">🍳 جاري التحضير بالمطبخ</option>
                            <option value="on_the_way">🛵 مع الكابتن بالطريق</option>
                            <option value="completed">✅ تم التسليم للزبون</option>
                            <option value="cancelled">❌ ملغي (من الإدارة)</option>
                          </>
                        ) : isSpecialtyCoffee ? (
                          <>
                            <option value="pending">⏳ جديد - بانتظار الاعتماد</option>
                            <option value="preparing">☕ جاري التحضير والتقطير</option>
                            <option value="on_the_way">📦 جاهز للاستلام / الشحن</option>
                            <option value="completed">✅ تم التسليم بنجاح</option>
                            <option value="cancelled">❌ ملغي (من الإدارة)</option>
                          </>
                        ) : (
                          <>
                            <option value="pending">جديد / قيد الانتظار</option>
                            <option value="confirmed">قيد التجهيز / التواصل</option>
                            <option value="on_the_way">جاري الشحن / مع المندوب</option>
                            <option value="completed">مكتمل بنجاح</option>
                            <option value="cancelled">ملغي (من الإدارة)</option>
                          </>
                        )}
                      </select>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-400" />
                        <span>{order.customerName}</span>
                      </span>
                      {order.customerPhone && (
                        <button
                          type="button"
                          onClick={() => openWhatsApp(order.customerPhone, order.customerName)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-xl flex items-center gap-1 font-bold text-[11px]"
                        >
                          <MessageCircle size={13} />
                          <span>واتساب</span>
                        </button>
                      )}
                    </div>
                    {order.customerPhone && (
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1" dir="ltr">
                        <Phone size={12} className="text-slate-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Items with Quantity Controls */}
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="bg-slate-50/80 p-3 rounded-2xl space-y-2">
                      <span className="text-[11px] font-black text-slate-600 block border-b border-slate-200 pb-1">المنتجات المطلوبة:</span>
                      <div className="space-y-1.5">
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
                            <span className="font-bold text-slate-800 min-w-0 truncate">{item.name || item.title || item.product?.title}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">الكمية: x{item.quantity || 1}</span>
                              <span className="font-bold font-mono" style={{ color: dashboardColor }}>{item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coupon & Financial Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">الإجمالي (بعد الخصم الكوبون):</span>
                      {(order.promoCode || order.details?.promoCode) && (
                        <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                          🏷️ {order.promoCode || order.details?.promoCode}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-base text-slate-900">
                      {getOrderDisplayPrice(order)}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderModal(order)}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Eye size={14} />
                      <span>التفاصيل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareOrderModal(order)}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Truck size={14} className="text-emerald-600" />
                      <span>مندوب 📲</span>
                    </button>
                    {isAdminCancelled(order) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlatformModal({
                            isOpen: true,
                            title: 'إشعار من المنصة: استرجاع وإعادة تنشيط الطلب 🔄',
                            message: `هل ترغب في استرجاع الطلب رقم #${order.id} ونقله إلى قائمة الطلبات النشطة؟`,
                            confirmText: 'نعم، إعادة تنشيط الطلب',
                            cancelText: 'إلغاء والتراجع',
                            type: 'success',
                            onConfirm: async () => {
                              if (handleRestoreOrder) {
                                await handleRestoreOrder(order.id);
                              } else {
                                await handleUpdateOrderStatus(order.id, 'pending', { cancelledBy: null });
                              }
                            }
                          });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <RefreshCw size={13} />
                        <span>تنشيط 🔄</span>
                      </button>
                    )}
                    {orderSubTab === 'active' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlatformModal({
                            isOpen: true,
                            title: 'إلغاء الطلب ونقله إلى قسم الطلبات الملغية 🗑️',
                            message: `هل أنت متأكد من إلغاء الطلب رقم #${order.id}؟ سينتقل إلى قسم "الطلبات الملغية" ويمكنك إعادة تنشيطه لاحقاً.`,
                            confirmText: 'نعم، إلغاء الطلب',
                            cancelText: 'إلغاء والتراجع',
                            type: 'danger',
                            onConfirm: async () => {
                              await handleUpdateOrderStatus(order.id, 'cancelled', { cancelledBy: 'admin', cancelledAt: new Date().toISOString() });
                            }
                          });
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="إلغاء الطلب"
                      >
                        <Trash2 size={14} />
                        <span>إلغاء 🗑️</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      
      {/* Assign Courier Modal */}
      {assignCourierOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-slate-800">تعيين مندوب وتحديث حالة الشحن</h3>
            <p className="text-xs text-slate-500 mb-6 font-bold">الطلب رقم: {assignCourierOrder.id}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">اختر المندوب</label>
                <select 
                  value={selectedCourier} 
                  onChange={e => setSelectedCourier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                >
                  <option value="">-- اختر المندوب --</option>
                  {(content?.couriers || []).filter((c: any) => c.status === 'available').map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.area} ({c.phone})</option>
                  ))}
                </select>
                {content?.couriers?.length === 0 && <p className="text-[10px] text-amber-600 mt-1 font-bold">لا يوجد مناديب مسجلين. يرجى إضافتهم من تبويب إدارة المناديب.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">الوقت المتوقع للتوصيل (اختياري)</label>
                <input 
                  type="text" 
                  value={expectedDelivery} 
                  onChange={e => setExpectedDelivery(e.target.value)}
                  placeholder="مثال: غداً بين 2-4 مساءً"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    const courier = (content?.couriers || []).find((c: any) => c.id === selectedCourier);
                    const orderDetails = {
                      ...assignCourierOrder.details,
                      courierName: courier ? courier.name : 'غير محدد',
                      courierPhone: courier ? courier.phone : '',
                      expectedDelivery
                    };
                    handleUpdateOrderStatus(assignCourierOrder.id, 'on_the_way', orderDetails);
                    setAssignCourierOrder(null);
                    setSelectedCourier('');
                    setExpectedDelivery('');
                  }}
                  className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700"
                >
                  تأكيد الشحن
                </button>
                <button 
                  onClick={() => {
                    setAssignCourierOrder(null);
                    // Revert the select visually by forcing a re-render or fetching orders
                    fetchOrders();
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Notice Confirmation Modal */}
      {platformModal && platformModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className={`p-6 ${platformModal.type === 'danger' ? 'bg-rose-50 border-b border-rose-100' : platformModal.type === 'success' ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-amber-50 border-b border-amber-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${platformModal.type === 'danger' ? 'bg-rose-500 text-white' : platformModal.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 block mb-0.5">إشعار رسمي من المنصة</span>
                  <h3 className="text-base font-black text-slate-900">{platformModal.title}</h3>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                {platformModal.message}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const action = platformModal.onConfirm;
                    setPlatformModal(null);
                    action();
                  }}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black text-white shadow-md transition-all hover:scale-[1.02] cursor-pointer ${
                    platformModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : platformModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                  }`}
                >
                  {platformModal.confirmText}
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformModal(null)}
                  className="flex-1 py-3 px-4 rounded-2xl text-xs font-black bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {platformModal.cancelText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Modal: تفاصيل الطلب الدقيقة */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex justify-between items-center border-b border-indigo-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black">تفاصيل الطلب الدقيقة 📦</h3>
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800">
                      #{selectedOrderModal.id}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-0.5">بيانات العميل الشاملة، المنتجات، تفاصيل الخصم الكلي، الكوبون ورسوم الشحن</p>
                </div>
              </div>

              {/* Close Button X */}
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-2xl transition-all cursor-pointer"
                title="إغلاق النافذة"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Customer Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <User size={15} className="text-indigo-600" />
                  <span>معلومات العميل والتواصل</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">اسم العميل:</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedOrderModal.customerName || 'غير محدد'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">رقم الهاتف والجوال:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 font-mono" dir="ltr">{selectedOrderModal.customerPhone}</span>
                      {selectedOrderModal.customerPhone && (
                        <button
                          type="button"
                          onClick={() => openWhatsApp(selectedOrderModal.customerPhone, selectedOrderModal.customerName)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <MessageCircle size={12} />
                          <span>واتساب</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedOrderModal.customerEmail && (
                    <div>
                      <span className="text-slate-400 font-bold block mb-0.5">البريد الإلكتروني:</span>
                      <span className="font-medium text-slate-700 font-mono" dir="ltr">{selectedOrderModal.customerEmail}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 font-bold block mb-0.5">تاريخ ووقت الطلب:</span>
                    <span className="font-medium text-slate-700">
                      {selectedOrderModal.createdAt ? new Date(selectedOrderModal.createdAt).toLocaleString('ar-SA') : 'الآن'}
                    </span>
                  </div>
                  {(selectedOrderModal.customerAddress || selectedOrderModal.details?.address) && (
                    <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-bold block mb-0.5">📍 عنوان الشحن والتوصيل التفصيلي:</span>
                      <span className="font-bold text-slate-800 leading-relaxed">
                        {selectedOrderModal.customerAddress || selectedOrderModal.details?.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Products List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingBag size={15} className="text-indigo-600" />
                    <span>المنتجات المطلوبة في هذا الطلب</span>
                  </span>
                  <span className="text-slate-500 text-[11px] font-bold">
                    ({Array.isArray(selectedOrderModal.items) ? selectedOrderModal.items.length : 0} عناصر)
                  </span>
                </h4>

                {Array.isArray(selectedOrderModal.items) && selectedOrderModal.items.length > 0 ? (
                  <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    {selectedOrderModal.items.map((item: any, idx: number) => {
                      const img = (item.selectedColor && item.colorImages?.[item.selectedColor]) || item.primaryImage || item.image || item.product?.primaryImage || item.product?.image;
                      const title = item.name || item.title || item.product?.title || 'منتج بدون عنوان';
                      const qty = item.quantity || 1;
                      const unitPrice = item.price || 0;

                      return (
                        <div key={idx} className="p-3.5 flex items-center gap-3.5 hover:bg-slate-50/80 transition-colors">
                          {img ? (
                            <img src={img} alt="" className="w-12 h-14 object-cover rounded-xl border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <ShoppingBag size={20} />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-bold text-xs text-slate-900">{title}</p>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5 space-x-2 space-x-reverse">
                              {(item.selectedStorage || item.storage) && (
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                                  السعة: {item.selectedStorage || item.storage}
                                </span>
                              )}
                              {(item.selectedColor || item.color) && (
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                                  اللون: {item.selectedColor || item.color}
                                </span>
                              )}
                              {item.selectedSize && (
                                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                                  المقاس: {item.selectedSize}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-left font-mono flex flex-col items-end gap-1">
                            <p className="font-bold text-xs text-slate-900">{unitPrice}</p>
                            <span className="text-[11px] font-black font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              الكمية: x{qty}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                    {selectedOrderModal.details?.message || selectedOrderModal.details?.notes || 'لا يوجد تفاصيل عناصر قائمة لهذا الطلب.'}
                  </div>
                )}
              </div>

              {/* Financial Details (كود الخصم، الخصم، رسوم الشحن والمجموع) */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-pink-50/50 p-4 rounded-2xl border border-indigo-100/80 space-y-3">
                <h4 className="text-xs font-black text-indigo-950 flex items-center gap-2 border-b border-indigo-100 pb-2">
                  <Tag size={15} className="text-indigo-600" />
                  <span>تفاصيل الفاتورة، الخصومات وكود الكوبون</span>
                </h4>

                <div className="space-y-2 text-xs font-bold text-slate-700">
                  {/* Promo Code badge if present */}
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-indigo-100/80 shadow-2xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Tag size={14} className="text-pink-600" />
                      <span>كود الخصم المستعمل ( الكوبون ):</span>
                    </span>
                    {selectedOrderModal.promoCode || selectedOrderModal.details?.promoCode ? (
                      <span className="font-mono font-black text-xs text-pink-700 bg-pink-100/80 border border-pink-300 px-3 py-1 rounded-lg">
                        🏷️ {selectedOrderModal.promoCode || selectedOrderModal.details?.promoCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium italic">لم يتم استخدام كود خصم</span>
                    )}
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-between items-center px-1">
                    <span className="text-slate-500">المجموع الفرعي (قبل الخصم والشحن):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedOrderModal.subtotal || selectedOrderModal.details?.subtotal ? `${selectedOrderModal.subtotal || selectedOrderModal.details?.subtotal}` : 'حسب العناصر'}
                    </span>
                  </div>

                  {/* Discount Value */}
                  <div className="flex justify-between items-center px-1 text-emerald-700">
                    <span className="flex items-center gap-1">
                      <span>قيمة الخصم المقتطعة:</span>
                      {(selectedOrderModal.discountPercent || selectedOrderModal.details?.discountPercent) > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-black">
                          {selectedOrderModal.discountPercent || selectedOrderModal.details?.discountPercent}% OFF
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-black">
                      {selectedOrderModal.discountAmount || selectedOrderModal.details?.discountAmount
                        ? `- ${selectedOrderModal.discountAmount || selectedOrderModal.details?.discountAmount}`
                        : (selectedOrderModal.promoCode || selectedOrderModal.details?.promoCode) ? 'مخصوم' : '0'}
                    </span>
                  </div>

                  {/* Shipping Fee */}
                  <div className="flex justify-between items-center px-1">
                    <span className="text-slate-500">رسوم الشحن والتوصيل:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedOrderModal.shippingFee !== undefined || selectedOrderModal.details?.shippingFee !== undefined
                        ? `+ ${selectedOrderModal.shippingFee ?? selectedOrderModal.details?.shippingFee}`
                        : 'محتسبة في الإجمالي'}
                    </span>
                  </div>

                  {/* Final Total */}
                  <div className="flex justify-between items-center bg-indigo-950 text-white p-3.5 rounded-xl mt-2 shadow-md">
                    <span className="font-black text-sm">الإجمالي النهائي المطلوب للدفع:</span>
                    <span className="font-mono font-black text-base text-emerald-300">
                      {getOrderDisplayPrice(selectedOrderModal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes if any */}
              {selectedOrderModal.details?.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">📌 ملاحظات إضافية على الطلب:</span>
                  <p className="text-slate-600 font-medium leading-relaxed">{selectedOrderModal.details.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShareOrderModal(selectedOrderModal)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02]"
              >
                <Truck size={16} />
                <span>مشاركة مع المندوب 📲</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const targetOrd = selectedOrderModal;
                    setSelectedOrderModal(null);
                    setPlatformModal({
                      isOpen: true,
                      title: 'إشعار من المنصة: نقل للمحذوفات 🗑️',
                      message: `هل أنت متأكد من نقل الطلب رقم #${targetOrd.id} إلى قسم "الطلبات المحذوفة"؟`,
                      confirmText: 'نعم، نقل للمحذوفات',
                      cancelText: 'إلغاء والتراجع',
                      type: 'danger',
                      onConfirm: async () => {
                        await handleDeleteOrder(targetOrd.id);
                      }
                    });
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={15} />
                  <span>حذف الطلب 🗑️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X size={15} />
                  <span>إغلاق</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courier Share Modal */}
      {shareOrderModal && (
        <CourierShareModal
          order={shareOrderModal}
          tenant={tenant}
          content={content}
          onClose={() => setShareOrderModal(null)}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}

    </div>
  </div>
  );
}