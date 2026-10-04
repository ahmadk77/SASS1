import React, { useEffect, useState } from 'react';
import TemplateRenderer from '../components/TemplateRenderer';
import OrderSystem from '../components/OrderSystem';
import { applyTenantTheme } from '../lib/themeOptimizer';
import { useNavigate } from 'react-router';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SuspendedPage from './SuspendedPage';
import { Helmet } from 'react-helmet-async';
import SiteFooter from '../components/SiteFooter';

export default function SiteRenderer({ domain }: { domain: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [siteData, setSiteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const normEmail = u.email?.toLowerCase().trim();
        const isStaffOrAdmin = normEmail === 'ahmadalriqib@gmail.com';
        if (isStaffOrAdmin) {
          setIsAdminUser(true);
        }
        try {
          const token = await u.getIdToken();
          const res = await fetch('/api/tenant', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUserData(data);
            if (data.user && ['admin', 'super_admin', 'staff', 'manager', 'support'].includes(data.user.role)) {
              setIsAdminUser(true);
            }
          }
        } catch (e) {
          console.error('Error fetching tenant in site renderer:', e);
        }
      } else {
        setCurrentUserData(null);
        setIsAdminUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/resolve?domain=${domain}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setSiteData(data);
          applyTenantTheme(data.content);
        } else {
          try {
            const errData = await res.json();
            setError(errData.error || errData.details || 'الموقع غير موجود');
          } catch(e) {
            setError('الموقع غير موجود');
          }
        }
      } catch (err) {
        setError('حدث خطأ أثناء تحميل الموقع');
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
  }, [domain]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-xl" dir="rtl">جاري التحميل...</div>;
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800" dir="rtl">
        <h1 className="text-2xl font-bold text-red-600">{error || 'موقع غير معروف'}</h1>
      </div>
    );
  }

  if (siteData.suspended) {
    return <SuspendedPage />;
  }

  return (
    <>
      <Helmet>
        <title>{siteData.content?.metaTitle || siteData.content?.businessName || siteData.tenant?.name || 'موقعي'}</title>
        <meta name="description" content={siteData.content?.metaDescription || siteData.content?.heroSubtitle || 'مرحباً بك في موقعنا'} />
        {siteData.content?.logoUrl && <link rel="icon" href={siteData.content.logoUrl} />}
        <meta property="og:title" content={siteData.content?.metaTitle || siteData.content?.businessName || siteData.tenant?.name || 'موقعي'} />
        <meta property="og:description" content={siteData.content?.metaDescription || siteData.content?.heroSubtitle || 'مرحباً بك في موقعنا'} />
        {siteData.content?.logoUrl && <meta property="og:image" content={siteData.content.logoUrl} />}
      </Helmet>
      <TemplateRenderer templateId={siteData.templateId} content={siteData.content} tenant={siteData.tenant} isEditable={false} />
      {siteData.templateId !== 13 && (
        <OrderSystem subdomain={siteData.tenant?.subdomain || siteData?.subdomain || 'demo'} primaryColor={siteData.content?.primaryColor || '#0ea5e9'} />
      )}
      <SiteFooter content={siteData.content} tenant={siteData.tenant} />
    </>
  );
}
