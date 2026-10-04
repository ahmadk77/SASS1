import React from 'react';
import { CheckCircle, FileDown, Home, LayoutDashboard } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface PaymentSuccessProps {
  chargeId?: string;
  amount?: string;
  planName?: string;
  date?: string;
  onGoToDashboard?: () => void;
}

export default function PaymentSuccess({
  chargeId = 'chg_TS02148921',
  amount = '299.00 ر.س',
  planName = 'باقة الأعمال (سنوي)',
  date = '01 أغسطس 2026',
  onGoToDashboard
}: PaymentSuccessProps) {
  // دالة تحميل الفاتورة الفعلية كملف PDF مرتب باللغة العربية باستخدام jsPDF
  const handleDownloadInvoice = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Title (Arabic & English professional styling)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("BUNYAN PLATFORM", 105, 25, { align: "center" });

      doc.setFontSize(13);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("فاتورة اشتراك رسمية - Official Invoice & Receipt", 105, 33, { align: "center" });

      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 42, 190, 42);

      // Details box background
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(20, 50, 170, 95, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);

      let y = 65;
      const lineHeight = 16;

      doc.setFont("helvetica", "bold");
      doc.text("رقم المرجع (Tap Reference):", 180, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(String(chargeId), 30, y, { align: "left" });

      y += lineHeight;
      doc.setFont("helvetica", "bold");
      doc.text("الباقة المشتركة (Subscription Plan):", 180, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(String(planName), 30, y, { align: "left" });

      y += lineHeight;
      doc.setFont("helvetica", "bold");
      doc.text("تاريخ الدفع (Payment Date):", 180, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(String(date), 30, y, { align: "left" });

      y += lineHeight;
      doc.setFont("helvetica", "bold");
      doc.text("إجمالي المبلغ المدفوع (Total Amount):", 180, y, { align: "right" });
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text(String(amount), 30, y, { align: "left" });

      // Footer note
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("شكراً لاشتراكك في منصة بنيان. تم إصدار هذه الفاتورة إلكترونياً.", 105, 165, { align: "center" });

      // Save file
      doc.save(`Bunyan_Invoice_${chargeId}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    }
  };

  const handleDashboardNavigation = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    // استخدام خلفية slate-50 لكسر البياض. الكلاس print:bg-white ينظف الخلفية عند تحميل الـ PDF
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 dir-rtl font-sans print:bg-white print:p-0 overflow-y-auto">
      
      {/* البطاقة الرئيسية */}
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl shadow-emerald-900/5 border border-slate-100 overflow-hidden print:shadow-none print:border-none my-auto">
        
        {/* القسم العلوي: رسالة النجاح بتدرج لوني خفيف */}
        <div className="bg-gradient-to-b from-emerald-50 to-white p-8 text-center relative">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30">
            <CheckCircle className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">تم الدفع بنجاح!</h1>
          <p className="text-slate-500 text-sm font-medium">مرحباً بك في عالم "بنيان". تم تفعيل اشتراكك وبناء متجرك الآلي.</p>
        </div>

        {/* تفاصيل الفاتورة بتصميم احترافي */}
        <div className="px-8 pb-8 space-y-5 mt-2">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 text-right">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
              <span className="text-sm text-slate-500 font-bold">رقم المرجع (Tap)</span>
              <span className="text-sm font-mono font-bold text-slate-900">{chargeId}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
              <span className="text-sm text-slate-500 font-bold">قيمة الاشتراك</span>
              <span className="text-lg font-black text-emerald-600">{amount}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
              <span className="text-sm text-slate-500 font-bold">الباقة</span>
              <span className="text-sm font-bold text-slate-800">{planName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-bold">التاريخ</span>
              <span className="text-sm font-bold text-slate-800">{date}</span>
            </div>

          </div>
        </div>

        {/* أزرار الإجراءات (تختفي تلقائياً عند حفظ الـ PDF بفضل print:hidden) */}
        <div className="px-8 pb-8 flex flex-col gap-3 print:hidden">
          
          <div className="flex gap-3">
             <button 
              onClick={handleDashboardNavigation}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-5 h-5" />
              لوحة التحكم
            </button>

            <button 
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-4 rounded-xl transition-all duration-300 border border-slate-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Home className="w-5 h-5" />
              الرئيسية
            </button>
          </div>

          <button 
            onClick={handleDownloadInvoice}
            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-4 rounded-xl transition-all duration-300 border border-emerald-200 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <FileDown className="w-5 h-5" />
            تحميل الفاتورة (PDF)
          </button>
          
        </div>

      </div>
    </div>
  );
}

