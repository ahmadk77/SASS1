import React, { useState } from 'react';
import { getOrderDisplayPrice } from './dashboards/tabs/OrdersTab';
import { X, Send, Printer, Truck, User, Phone, Check, MessageSquare, AlertCircle, FileText, ExternalLink } from 'lucide-react';

interface CourierShareModalProps {
  order: any;
  tenant: any;
  content: any;
  onClose: () => void;
  onUpdateOrderStatus?: (orderId: string | number, newStatus: string, details?: any) => Promise<void> | void;
}

export default function CourierShareModal({
  order,
  tenant,
  content,
  onClose,
  onUpdateOrderStatus
}: CourierShareModalProps) {
  const couriers: any[] = content?.couriers || [];
  
  const [selectedCourierId, setSelectedCourierId] = useState<string>(
    couriers.length > 0 ? couriers[0].id : 'custom'
  );
  const [customCourierName, setCustomCourierName] = useState<string>('');
  const [customCourierPhone, setCustomCourierPhone] = useState<string>('');
  const [autoUpdateStatus, setAutoUpdateStatus] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Selected courier object or custom
  const selectedCourierObj = couriers.find(c => String(c.id) === String(selectedCourierId));
  const activeCourierName = selectedCourierObj ? selectedCourierObj.name : customCourierName;
  const activeCourierPhone = selectedCourierObj ? selectedCourierObj.phone : customCourierPhone;

  const formatPhoneForWhatsApp = (phoneStr: string) => {
    if (!phoneStr) return '';
    let cleaned = phoneStr.trim().replace(/[^\d]/g, '');
    if (cleaned.startsWith('05') && cleaned.length === 10) {
      cleaned = '966' + cleaned.substring(1);
    } else if (cleaned.startsWith('07') && cleaned.length === 10) {
      cleaned = '962' + cleaned.substring(1);
    } else if (cleaned.startsWith('01') && cleaned.length === 11) {
      cleaned = '20' + cleaned.substring(1);
    }
    return cleaned;
  };

  const storeName = content?.businessName || tenant?.name || 'المتجر';
  const customerName = order.customerName || order.details?.customerName || order.customer?.name || 'عميل المتجر';
  const customerPhone = order.customerPhone || order.details?.customerPhone || order.customer?.phone || 'غير مدخل';
  const customerAddress = order.details?.address || order.customer?.address || 'غير محدد';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA') : (order.date || 'اليوم');
  const items = order.items || order.details?.items || [];
  const notes = order.details?.notes || order.details?.message || '';
  const finalTotal = getOrderDisplayPrice(order);

  const buildWhatsAppText = () => {
    let itemsListText = '';
    if (Array.isArray(items) && items.length > 0) {
      itemsListText = items.map((it: any, index: number) => {
        const name = it.title || it.name || it.product?.title || 'منتج';
        const qty = it.quantity || 1;
        const price = it.price ? `(${it.price})` : '';
        const storage = it.selectedStorage || it.storage ? ` (السعة: ${it.selectedStorage || it.storage})` : '';
        const color = it.selectedColor || it.color ? ` (اللون: ${it.selectedColor || it.color})` : '';
        const size = it.selectedSize ? ` (المقاس: ${it.selectedSize})` : '';
        return `  • ${name} ${storage}${color}${size} × ${qty} ${price}`;
      }).join('\n');
    } else {
      itemsListText = notes ? `  • ${notes}` : '  • تفاصيل الطلب حسب الفاتورة المرفقة';
    }

    const subtotal = order.subtotal || order.details?.subtotal;
    const shippingFee = order.shippingFee ?? order.details?.shippingFee;
    const discountAmount = order.discountAmount || order.details?.discountAmount;

    let text = `📦 *طلب جديد للتوصيل من متجر (${storeName})* 🚚\n\n`;
    if (activeCourierName) {
      text += `👋 *مرحباً بك عزيزي المندوب (${activeCourierName})*\n\n`;
    }
    text += `🆔 *رقم الطلب:* #${order.id}\n`;
    text += `📅 *التاريخ:* ${orderDate}\n\n`;

    text += `👤 *معلومات العميل والتسليم:*\n`;
    text += `• *الاسم:* ${customerName}\n`;
    text += `• *الهاتف:* ${customerPhone}\n`;
    text += `• *العنوان:* ${customerAddress}\n\n`;

    text += `🛒 *المنتجات المطلوبة:*\n${itemsListText}\n\n`;

    text += `💰 *تفاصيل المبالغ:*\n`;
    if (subtotal) text += `• المجموع الفرعي: ${subtotal}\n`;
    if (shippingFee !== undefined) text += `• رسوم التوصيل: ${shippingFee}\n`;
    if (discountAmount) text += `• الخصم: ${discountAmount}\n`;
    text += `💵 *الإجمالي النهائي المطلوب تحصيله:* *${finalTotal}*\n\n`;

    if (notes) {
      text += `📌 *ملاحظات التوصيل:* ${notes}\n\n`;
    }

    text += `نتمنى لك التوفيق بالتوصيل! 🚀`;
    return text;
  };

  const handleShareWhatsApp = async () => {
    if (!activeCourierPhone) {
      alert('يرجى اختيار مندوب أو إدخال رقم هاتف المندوب أولاً.');
      return;
    }

    // Auto-update order status if requested
    if (autoUpdateStatus && onUpdateOrderStatus) {
      const updatedDetails = {
        ...(order.details || {}),
        courierName: activeCourierName || 'مندوب التوصيل',
        courierPhone: activeCourierPhone
      };
      await onUpdateOrderStatus(order.id, 'on_the_way', updatedDetails);
    }

    const cleanPhone = formatPhoneForWhatsApp(activeCourierPhone);
    const text = buildWhatsAppText();
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = buildWhatsAppText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrintPDF = async () => {
    if (autoUpdateStatus && onUpdateOrderStatus && activeCourierPhone) {
      const updatedDetails = {
        ...(order.details || {}),
        courierName: activeCourierName || 'مندوب التوصيل',
        courierPhone: activeCourierPhone
      };
      await onUpdateOrderStatus(order.id, 'on_the_way', updatedDetails);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = Array.isArray(items) && items.length > 0 ? items.map((it: any, i: number) => `
      <tr>
        <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center;">${i + 1}</td>
        <td style="padding:10px; border-bottom:1px solid #e2e8f0; font-weight:bold;">${it.title || it.name || 'منتج'}</td>
        <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center;">${it.quantity || 1}</td>
        <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:left; font-weight:bold;">${it.price || ''}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="4" style="padding:15px; text-align:center; color:#64748b;">${notes || 'تفاصيل المشتريات متوفرة في الفاتورة'}</td>
      </tr>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>إشعار توصيل طلب #${order.id}</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #0f172a; background: #fff; line-height:1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; }
          .order-badge { font-size: 16px; font-weight: 800; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 16px; border-radius: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; font-size: 13px; }
          .card h4 { margin: 0 0 10px 0; color: #3b82f6; font-size: 13px; font-weight: 800; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          .card div { margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px; }
          th { background: #f1f5f9; padding: 12px; text-align: right; color: #475569; border-bottom: 2px solid #cbd5e1; font-weight: bold; }
          .total-card { background: #0f172a; color: #fff; padding: 18px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: bold; }
          .total-amount { color: #34d399; font-size: 20px; font-weight: 900; }
          .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; margin-top: 20px; font-size: 13px; color: #92400e; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">📦 متجر ${storeName}</div>
          <div class="order-badge">إشعار توصيل طلب #${order.id}</div>
        </div>

        <div class="grid">
          <div class="card">
            <h4>👤 بيانات التسليم للعميل:</h4>
            <div><strong>اسم العميل:</strong> ${customerName}</div>
            <div><strong>رقم الجوال:</strong> ${customerPhone}</div>
            <div><strong>العنوان:</strong> ${customerAddress}</div>
          </div>
          <div class="card">
            <h4>🚚 بيانات المندوب والشحن:</h4>
            <div><strong>اسم المندوب:</strong> ${activeCourierName || 'غير محدد'}</div>
            <div><strong>رقم المندوب:</strong> ${activeCourierPhone || 'غير محدد'}</div>
            <div><strong>تاريخ الطلب:</strong> ${orderDate}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align:center;">#</th>
              <th>المنتج / العنصر</th>
              <th style="width: 80px; text-align:center;">الكمية</th>
              <th style="width: 120px; text-align:left;">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-card">
          <span>المبلغ الإجمالي المطلوب تحصيله نقداً / مدى:</span>
          <span class="total-amount">${finalTotal}</span>
        </div>

        ${notes ? `<div class="notes"><strong>📌 ملاحظات إضافية للمندوب:</strong> ${notes}</div>` : ''}

        <div class="footer">
          تم إنشاؤه عبر نظام المبيعات والتوصيل لمتجر ${storeName} | ${new Date().toLocaleString('ar-SA')}
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-200">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="font-black text-base">مشاركة تفاصيل الطلب مع المندوب 📲</h3>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">الطلب #{order.id} - العميل: {customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800">

          {/* Quick Order Overview Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs font-bold">
            <div className="flex justify-between items-center text-slate-500 pb-2 border-b border-slate-200/60">
              <span>📅 التاريخ: {orderDate}</span>
              <span className="text-emerald-700 font-black text-sm">المطلوب تحصيله: {finalTotal}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>👤 <span className="text-slate-500">العميل:</span> {customerName}</div>
              <div>📞 <span className="text-slate-500">الهاتف:</span> <span dir="ltr">{customerPhone}</span></div>
            </div>
            <div>📍 <span className="text-slate-500">عنوان التسليم:</span> {customerAddress}</div>
          </div>

          {/* Courier Selector Section */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Truck size={16} className="text-indigo-600" />
              <span>اختر المندوب المستلم للطلب:</span>
            </label>

            {couriers.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {couriers.map((c: any) => {
                  const isSelected = String(c.id) === String(selectedCourierId);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCourierId(String(c.id))}
                      className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-black text-xs">{c.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{c.phone} {c.area ? `• ${c.area}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          c.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status === 'available' ? 'متاح ✅' : 'مشغول 🚗'}
                        </span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Option for custom courier */}
                <button
                  type="button"
                  onClick={() => setSelectedCourierId('custom')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    selectedCourierId === 'custom' 
                      ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      selectedCourierId === 'custom' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      +
                    </div>
                    <span className="font-bold text-xs">إدخال بيانات مندوب جديد غير مسجل</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedCourierId === 'custom' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {selectedCourierId === 'custom' && <Check size={12} />}
                  </div>
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>لا يوجد مناديب مسجلين في النظام بعد. يمكنك إدخال بيانات المندوب مباشرة أدناه:</span>
              </div>
            )}

            {/* Custom courier inputs if selected or no couriers */}
            {(selectedCourierId === 'custom' || couriers.length === 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المندوب:</label>
                  <input
                    type="text"
                    placeholder="مثال: أحمد المندوب"
                    value={customCourierName}
                    onChange={(e) => setCustomCourierName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم الواتساب للمندوب *:</label>
                  <input
                    type="text"
                    placeholder="مثال: 0501234567"
                    value={customCourierPhone}
                    onChange={(e) => setCustomCourierPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Auto Update Order Status Option */}
          <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 flex items-center gap-3">
            <input
              type="checkbox"
              id="autoUpdateStatus"
              checked={autoUpdateStatus}
              onChange={(e) => setAutoUpdateStatus(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="autoUpdateStatus" className="text-xs font-bold text-indigo-950 cursor-pointer select-none">
              تحديث حالة الطلب تلقائياً إلى "مع المندوب / بالطريق 🚚" وحفظ بيانات المندوب في الطلب
            </label>
          </div>

          {/* WhatsApp Text Preview Box */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-slate-600">معاينة نص الرسالة التي ستصل للمندوب:</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {isCopied ? <Check size={12} className="text-emerald-600" /> : <FileText size={12} />}
                <span>{isCopied ? 'تم نسخ النص!' : 'نسخ النص'}</span>
              </button>
            </div>
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl text-[11px] font-mono leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap border border-slate-800 select-all">
              {buildWhatsAppText()}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrintPDF}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
          >
            <Printer size={16} className="text-slate-600" />
            <span>طباعة / حفظ PDF للمندوب 📄</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <MessageSquare size={16} />
              <span>مشاركة ومحادثة عبر الواتساب 💬</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
