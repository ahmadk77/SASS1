import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SuspendedPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0F1218] p-4" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">الموقع متوقف مؤقتاً</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          عفواً، هذا الموقع متوقف حالياً. يرجى التواصل مع الإدارة لإعادة التفعيل أو تجديد الاشتراك.
        </p>
        <a 
          href="/"
          className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          العودة للرئيسية
        </a>
      </motion.div>
    </div>
  );
}
