import React, { useEffect, useState } from 'react';
import { loginWithGoogle, auth, signInWithCustomToken, signInWithEmailAndPassword } from '../lib/firebase';
import { useNavigate } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Lock, Mail, UserCheck, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginMode, setLoginMode] = useState<'google' | 'staff'>('google');
  
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoading(true);
        const normEmail = user.email?.toLowerCase().trim();
        const selectedTplId = localStorage.getItem('selectedTemplateId');
        if (selectedTplId) {
          navigate('/dashboard');
          return;
        }

        try {
          const token = await user.getIdToken();
          // Trigger backend user sync and await it
          await fetch('/api/user/ping', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch((err) => {
            console.error("SYNC_ERROR:", err);
          });

          const [statusRes, sitesRes] = await Promise.all([
            fetch('/api/me/status', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/tenant/my-sites', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          let isPlatformAdmin = normEmail === 'ahmadalriqib@gmail.com';
          let siteCount = 0;
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (['admin', 'super_admin', 'manager', 'support', 'staff'].includes(statusData.role) || (statusData.permissions && statusData.permissions !== 'none')) {
              isPlatformAdmin = true;
            }
          }
          if (sitesRes.ok) {
            const sitesData = await sitesRes.json();
            siteCount = sitesData.count || (sitesData.sites ? sitesData.sites.length : 0);
          }

          if (isPlatformAdmin || siteCount > 1) {
            navigate('/managements');
            return;
          } else {
            navigate('/dashboard');
            return;
          }
        } catch (err) {
          console.error("SYNC_ERROR:", err);
          navigate('/dashboard');
          return;
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    try {
      const user = await loginWithGoogle();
      if (!user) {
        setIsLoading(false);
        return;
      }
      // Navigation happens in onAuthStateChanged
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoginError('فشل تسجيل الدخول. يرجى التأكد من السماح بالنوافذ المنبثقة (Popups) أو فتح الموقع في نافذة جديدة.');
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim() || !staffPassword.trim()) {
      setLoginError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffEmail, password: staffPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'فشل تسجيل الدخول للموظف.');
        setIsLoading(false);
        return;
      }

      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      } else {
        try {
          await signInWithEmailAndPassword(auth, staffEmail.trim().toLowerCase(), staffPassword.trim());
        } catch (fbErr: any) {
          console.warn('Firebase direct login fallback:', fbErr);
          setLoginError('تمت التحقق من الحساب ولكن يرجى التأكد من كلمة المرور أو استخدام تسجيل الدخول من جوجل.');
        }
      }
    } catch (err: any) {
      console.error('Staff login error:', err);
      setLoginError('حدث خطأ في الاتصال أثناء تسجيل دخول الموظف.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول - بنيان Bunyan</title>
      </Helmet>
      
      <div className="min-h-[100dvh] flex bg-slate-950 font-serif" dir="rtl" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        {/* Right Side: Login Container */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 xl:px-32 relative z-10">
          
          <div className="absolute top-8 right-8 lg:right-16 flex items-center gap-6">
             <div className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                بنيان Bunyan
             </div>
             <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
               العودة للموقع
             </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-md w-full"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              مرحباً بعودتك إلى <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">مساحتك الإبداعية</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
              قم بتسجيل الدخول للوصول إلى لوحة التحكم، وإدارة مواقعك، ومتابعة إحصائياتك.
            </p>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setLoginMode('google'); setLoginError(''); }}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  loginMode === 'google'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>حساب جوجل</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('staff'); setLoginError(''); }}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  loginMode === 'staff'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <KeyRound size={14} />
                <span>دخول الموظفين</span>
              </button>
            </div>

            {loginError && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {loginMode === 'google' ? (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full relative group overflow-hidden bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-2xl p-1 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-4 bg-slate-900 px-6 py-4 rounded-xl">
                    {isLoading ? (
                      <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="text-white font-bold text-base sm:text-lg">تسجيل الدخول بواسطة جوجل</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-xs text-purple-200 flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white mb-0.5">💡 تسجيل دخول موظفي المنصة:</span>
                    <span>أدخل البريد الإلكتروني للموظف وكلمة المرور الخاصة به (أو البريد الإلكتروني إذا لم يتم تخصيص كلمة مرور بعد).</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-purple-400" />
                    <span>البريد الإلكتروني للموظف:</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    placeholder="staff@domain.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock size={14} className="text-purple-400" />
                    <span>كلمة المرور الخاص بك:</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={e => setStaffPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white py-3.5 px-6 rounded-2xl text-sm font-bold shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      <span>تسجيل دخول موظف المنصة</span>
                    </>
                  )}
                </button>
              </form>
            )}
            
            <p className="mt-8 text-xs sm:text-sm text-slate-500 text-center">
              بتسجيلك الدخول، أنت توافق على <a href="#" className="text-slate-300 hover:text-white underline underline-offset-4">شروط الخدمة</a> و <a href="#" className="text-slate-300 hover:text-white underline underline-offset-4">سياسة الخصوصية</a>.
            </p>
            <p className="mt-4 text-xs text-slate-400 text-center bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              ملاحظة: إذا واجهت مشكلة في نافذة تسجيل الدخول (Popup Blocked)، يرجى فتح الموقع في علامة تبويب جديدة.
            </p>
          </motion.div>
        </div>

        {/* Left Side: Abstract Visual (Hidden on mobile) */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center">
          {/* Base Background Image */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
          
          {/* Vibrant Gradients */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-transparent to-indigo-900/80 mix-blend-multiply"></div>
          
          {/* Animated Glow Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -right-1/4 w-full h-full bg-blue-600/30 blur-[120px] rounded-full pointer-events-none"
          ></motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -left-1/4 w-full h-full bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none"
          ></motion.div>

          {/* Glassmorphic Overlay Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative z-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl max-w-lg w-full mx-12 shadow-2xl"
          >
            <div className="flex gap-3 mb-6">
              <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
              <div className="w-4 h-1 bg-indigo-500 rounded-full"></div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-relaxed">
              "لقد تغيرت طريقة إدارتي لعملي تماماً. الموقع سريع، أنيق، وسهل التعديل."
            </h2>
            <div className="flex items-center gap-4 mt-8">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150" alt="User" className="w-12 h-12 rounded-full border-2 border-white/20" />
              <div>
                <h4 className="text-white font-bold">أحمد محمد</h4>
                <p className="text-slate-400 text-sm">مؤسس سلسلة مقاهي</p>
              </div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </>
  );
}
