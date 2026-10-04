import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Shield, Store, Globe, ArrowRight, LogOut, LayoutDashboard, Sparkles, Building2, UserCheck, QrCode } from 'lucide-react';
import PaymentSuccess from '../components/PaymentSuccess';
import { QRCodeModal } from '../components/QRCodeModal';

export default function MyManagements() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedQRSite, setSelectedQRSite] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken();
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

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setDbStatus(statusData);
          }

          if (sitesRes.ok) {
            const sitesData = await sitesRes.json();
            if (sitesData.sites) {
              setSites(sitesData.sites);
            }
          }
        } catch (e) {
          console.error('Error fetching managements info:', e);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const userEmail = user?.email?.toLowerCase().trim();
  const dbEmail = dbStatus?.email?.toLowerCase().trim();
  const isPlatformSuperOwner = userEmail === 'ahmadalriqib@gmail.com' || dbEmail === 'ahmadalriqib@gmail.com';

  const isOwnerOrPlatformAdmin = 
    isPlatformSuperOwner ||
    (['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbStatus?.role)) ||
    (dbStatus?.permissions && dbStatus?.permissions !== 'none');

  const isTapSuccess = typeof window !== 'undefined' && window.location.search.includes('tap_status=success');

  if (isTapSuccess) {
    return <PaymentSuccess onGoToDashboard={() => navigate('/dashboard')} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-serif" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold">جاري تحميل إداراتك ومتاجرك...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>إداراتي - لوحات التحكم المتاحة لحسابك</title>
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100 font-serif pb-20" dir="rtl" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        {/* Top Navbar */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">إداراتي</h1>
                <p className="text-xs text-slate-400 font-medium">إدارة المنصة والمتاجر المرتبطة بحسابك</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-white">{user?.displayName || user?.email}</span>
                <span className="text-[10px] text-blue-400 font-mono">{dbStatus?.role || 'مستخدم مسجل'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 space-y-3"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              اختر الإدارة أو المتجر الذي تريد الدخول إليه
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
              بناءً على صلاحيات بريدك الإلكتروني (<span className="text-blue-400 font-mono font-bold">{user?.email}</span>)، لديك الصلاحية للوصول إلى اللوحات التالية:
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Platform Admin Card (if authorized) */}
            {isOwnerOrPlatformAdmin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-blue-500/30 hover:border-blue-500/60 p-8 rounded-3xl shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mb-6 shadow-inner">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                      {user?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com' || dbStatus?.role === 'super_admin' ? 'مالك المنظومة 👑' : 'موظف في منصة بنيان 🛡️'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      {user?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com' || dbStatus?.role === 'super_admin' ? 'صلاحيات رئيسية كاملة' : 'صلاحيات موظف مخصصة'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">
                    {user?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com' || dbStatus?.role === 'super_admin' ? 'إدارة منصة بنيان' : 'لوحة تحكم موظفي المنصة'}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    {user?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com' || dbStatus?.role === 'super_admin'
                      ? 'أنت صاحب ومسؤول منصة بنيان، تمتلك الصلاحيات الكاملة لإدارة المشتركين والمتاجر والنظام.'
                      : 'أنت موظف في منصة بنيان، يمكنك الوصول للأقسام والتذاكر المخصصة لك وفق صلاحياتك.'}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/admin')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-3 group-hover:translate-x-1 cursor-pointer"
                >
                  <span>
                    {user?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com' || dbStatus?.role === 'super_admin' ? 'الدخول لإدارة المنصة' : 'الدخول كـ موظف في منصة بنيان'}
                  </span>
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
              </motion.div>
            )}

            {/* 2. Tenant / Store Dashboards */}
            {sites.map((site, index) => {
              const isSiteOwner = site.isOwner === true || 
                site.userRelation === 'owner' ||
                isPlatformSuperOwner ||
                dbStatus?.role === 'super_admin' ||
                dbStatus?.role === 'admin' ||
                (site.userId && dbStatus?.id && Number(site.userId) === Number(dbStatus.id)) ||
                (site.assignedUserEmail && userEmail && site.assignedUserEmail.toLowerCase().trim() === userEmail);
              return (
                <motion.div
                  key={site.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + (index * 0.1) }}
                  className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border border-purple-500/30 hover:border-purple-500/60 p-8 rounded-3xl shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>

                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mb-6 shadow-inner">
                      <Store className="w-7 h-7" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {isSiteOwner ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-black border border-emerald-500/30 flex items-center gap-1.5">
                          <span>👑</span>
                          <span>أنت صاحب موقع {site.name}</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-black border border-blue-500/30 flex items-center gap-1.5">
                          <span>🛡️</span>
                          <span>أنت موظف في موقع {site.name}</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-mono">ID: {site.id}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">{site.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mb-6 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 inline-block">
                      {site?.customDomain || `${site?.subdomain || site?.id || 'demo'}.bunyan.website`}
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                      {isSiteOwner 
                        ? `أنت صاحب موقع ${site.name}، يمكنك إدارة المنتجات، الطلبات، الاشتراكات، وإدارة الموقع بالكامل.`
                        : `أنت موظف في موقع ${site.name}، يمكنك إدارة الأقسام والطلبات المتاحة لك وفق صلاحياتك.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setSelectedQRSite(site)}
                      className="sm:col-span-1 py-4 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      title="عرض رمز QR للموقع"
                    >
                      <QrCode className="w-5 h-5 text-blue-400" />
                      <span className="sm:hidden text-xs">رمز QR</span>
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard?impersonateTenantId=${site.id}`)}
                      className="sm:col-span-3 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-3 group-hover:translate-x-1 cursor-pointer"
                    >
                      <span>{isSiteOwner ? `الدخول كـ صاحب موقع` : `الدخول كـ موظف في موقع ${site.name}`}</span>
                      <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <QRCodeModal
            isOpen={!!selectedQRSite}
            onClose={() => setSelectedQRSite(null)}
            siteName={selectedQRSite?.name || ''}
            subdomain={selectedQRSite?.subdomain}
            customDomain={selectedQRSite?.customDomain}
          />

          {sites.length === 0 && !isOwnerOrPlatformAdmin && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
              <Building2 className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">لا توجد إدارات أو متاجر مرتبطة بهذا الحساب حالياً</h3>
              <p className="text-slate-400 text-sm">
                إذا تم تعيينك كموظف أو قمت بإنشاء متجر، يرجى التأكد من استخدام البريد الإلكتروني الصحيح.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
