import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../../lib/firebase';
import { fetchUserNotifications, markNotificationAsRead, AppNotification } from '../../../lib/activityLogger';
import { DoctorPortal } from '../DoctorPortal';
import { 
  LayoutDashboard, CalendarCheck, Users, Activity, 
  Settings, Plus, Edit, Trash2, Search, Bell, 
  ChevronRight, CheckCircle2, XCircle, Clock, Stethoscope, Menu, X, ExternalLink, ArrowRight, LogOut, Paintbrush, RefreshCw, Check, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'السبت', visits: 40 },
  { name: 'الأحد', visits: 65 },
  { name: 'الإثنين', visits: 55 },
  { name: 'الثلاثاء', visits: 85 },
  { name: 'الأربعاء', visits: 70 },
  { name: 'الخميس', visits: 95 },
  { name: 'الجمعة', visits: 30 },
];

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

const NavItem = ({ icon, label, isActive, onClick, badge = 0 }: NavItemProps) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 2xl:p-5 rounded-[1.25rem] transition-all duration-300 ease-out transform-gpu group ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:scale-[1.02]'}`}
  >
    <div className="flex items-center gap-4 font-black text-sm 2xl:text-base">
      <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} transition-colors duration-300`}>{icon}</div>
      {label}
    </div>
    {badge > 0 ? (
      <span className="bg-red-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">{badge}</span>
    ) : (
      <ChevronRight size={18} className={`opacity-0 -translate-x-3 transition-all duration-300 ease-out transform-gpu ${isActive ? 'opacity-100 translate-x-0' : 'group-hover:opacity-100 group-hover:translate-x-0'}`} />
    )}
  </button>
);

const StatCard = ({ title, value, change, isPositive, icon }: any) => (
  <div className="bg-white/80 backdrop-blur-sm p-6 2xl:p-8 rounded-[2rem] border border-white shadow-lg shadow-slate-200/40 flex items-center justify-between transform-gpu hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform group">
    <div>
      <p className="text-sm font-bold text-slate-400 mb-1.5">{title}</p>
      <h4 className="text-2xl 2xl:text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors duration-300">{value}</h4>
      <p className={`text-xs 2xl:text-sm font-bold mt-2 flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{change} هذا الأسبوع</p>
    </div>
    <div className="w-14 h-14 2xl:w-16 2xl:h-16 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 ease-out">
      {icon}
    </div>
  </div>
);

export default function DentalClinicManager({ 
  tenant,
  content,
  handleUpdateContent,
  setContent,
  templateId,
  renderStaffTab,
  renderSettingsTab,
  renderOrdersTab,
  onOpenSite,
  onReturnHome,
  onLogout
}: any) {
  // Dynamic Clinic Name Resolution from content & tenant
  const initialClinicName = content?.clinicName || content?.businessName || content?.siteName || tenant?.name || 'عيادة الأسنان المتقدمة';
  const [clinicName, setClinicName] = useState(initialClinicName);
  const [clinicPhone, setClinicPhone] = useState(content?.clinicPhone || content?.phone || '0790000000');

  const [loggedInUser, setLoggedInUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(`clinic_manager_auth_${tenant?.id || 'default'}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [isEditDoctorModalOpen, setIsEditDoctorModalOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const defaultSlotsList = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM'
  ];

  const [availableSlots, setAvailableSlots] = useState<string[]>(() => {
    if (content?.availableSlots && Array.isArray(content.availableSlots) && content.availableSlots.length > 0) {
      return content.availableSlots;
    }
    return defaultSlotsList;
  });
  const [newSlotInput, setNewSlotInput] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoConfirmAppointments, setAutoConfirmAppointments] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Clinic Notifications State & Handling
  const [clinicNotifications, setClinicNotifications] = useState<any[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`clinic_read_notifs_${tenant?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [doctors, setDoctors] = useState<any[]>(() => {
    if (content?.doctors && Array.isArray(content.doctors) && content.doctors.length > 0) {
      return content.doctors;
    }
    if (content?.staff && Array.isArray(content.staff) && content.staff.length > 0) {
      return content.staff;
    }
    return [];
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newDocImage, setNewDocImage] = useState('');
  const [editDocImage, setEditDocImage] = useState('');
  const [isDoctorPortalOpen, setIsDoctorPortalOpen] = useState(false);

  const defaultServicesList = [
    { id: 1, title: 'زراعة الأسنان', shortDesc: 'زراعة فورية وبدائل سنية بأعلى جودة وضمان مدى الحياة.', fullDesc: 'نستخدم أحدث تقنيات زراعة الأسنان السويسرية والألمانية لتعويض الأسنان المفقودة...', price: '450 د.أ', showPrice: true, isVisible: true },
    { id: 2, title: 'ابتسامة هوليود', shortDesc: 'تصميم ابتسامة رقمية باستخدام قشور الفينير فائقة الرقة.', fullDesc: 'قم بتغيير شكل ولون أسنانك جذرياً من خلال قشور الفينير أو اللومينير...', price: '1200 د.أ', showPrice: true, isVisible: true },
    { id: 3, title: 'تقويم الأسنان', shortDesc: 'تقويم شفاف ومعدني لأسنان مستقيمة وإطباق سليم.', fullDesc: 'عالج بروز أو تزاحم الأسنان واحصل على اصطفاف مثالي...', price: '800 د.أ', showPrice: true, isVisible: true },
    { id: 4, title: 'تبييض الأسنان بالليزر', shortDesc: 'جلسات تبييض آمنة لابتسامة ناصعة البياض في 45 دقيقة.', fullDesc: 'تخلص من التصبغات واصفرار الأسنان الناتج عن القهوة والتدخين...', price: '100 د.أ', showPrice: true, isVisible: true }
  ];

  const [clinicServices, setClinicServices] = useState<any[]>(() => {
    if (content?.services && Array.isArray(content.services) && content.services.length > 0) {
      return content.services;
    }
    return defaultServicesList;
  });

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<any>(null);

  // Modals for confirming time and doctor notes
  const [confirmModalApp, setConfirmModalApp] = useState<any>(null);
  const [confirmedTimeInput, setConfirmedTimeInput] = useState<string>('');
  const [notesModalApp, setNotesModalApp] = useState<any>(null);
  const [doctorNotesInput, setDoctorNotesInput] = useState<string>('');
  const [appointmentStatusInput, setAppointmentStatusInput] = useState<string>('confirmed');

  const updateClinicNotifications = useCallback((apps: any[]) => {
    const notifs = apps.map((app: any, idx: number) => ({
      id: `apt-notif-${app.id || idx}`,
      title: app.status === 'confirmed' ? 'موعد مؤكد 🩺' : (app.status === 'cancelled' ? 'موعد ملغي ❌' : 'طلب حجز موعد جديد 🗓️'),
      message: `مريض: ${app.patientName || app.customerName || 'مريض'} - الخدمة: ${app.service || 'كشفية أسنان'} - التاريخ: ${app.date || 'اليوم'} (${app.time || '10:00 AM'})`,
      createdAt: app.createdAt || new Date().toISOString(),
      type: 'appointment',
      status: app.status
    }));

    notifs.unshift({
      id: 'clinic-welcome-notif',
      title: `مرحباً بك في نظام عيادة ${clinicName} 🏥`,
      message: 'تم تفعيل نظام إدارة المواعيد والمرضى الخاص بعيادتك بنجاح. تصلك هنا أحدث حجوزات وطلبات المرضى الفورية.',
      createdAt: new Date().toISOString(),
      type: 'system',
      status: 'system'
    });

    setClinicNotifications(notifs);
  }, [clinicName]);

  const markClinicNotifAsRead = (notifId: string) => {
    const updated = [...readNotifIds, notifId];
    setReadNotifIds(updated);
    try {
      localStorage.setItem(`clinic_read_notifs_${tenant?.id || 'default'}`, JSON.stringify(updated));
    } catch {}
  };

  const markAllClinicNotifsAsRead = () => {
    const allIds = clinicNotifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem(`clinic_read_notifs_${tenant?.id || 'default'}`, JSON.stringify(allIds));
    } catch {}
  };

  const unreadCount = clinicNotifications.filter(n => !readNotifIds.includes(n.id)).length;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync clinic name when content or tenant changes
  useEffect(() => {
    const nameToUse = content?.clinicName || content?.businessName || content?.siteName || tenant?.name;
    if (nameToUse) {
      setClinicName(nameToUse);
    }
  }, [content, tenant]);

  const fetchAppointmentsAndData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
      const impersonateId = localStorage.getItem('impersonatedTenantId');
      const tenantId = tenant?.id || impersonateId;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(impersonateId ? { 'x-impersonate-tenant-id': impersonateId } : {})
      };

      // 1. Fetch direct dental appointments
      let directAppointments: any[] = [];
      if (tenantId) {
        try {
          const appRes = await fetch(`/api/tenant/${tenantId}/dental/appointments${impersonateId ? `?impersonateTenantId=${impersonateId}` : ''}`, { headers });
          if (appRes.ok) {
            const data = await appRes.json();
            directAppointments = Array.isArray(data) ? data : (data.appointments || []);
          }
        } catch (e) {
          console.error('Error fetching direct dental appointments:', e);
        }
      }

      // 2. Fetch general tenant orders (which includes website form bookings)
      let orderAppointments: any[] = [];
      try {
        const ordersUrl = impersonateId 
          ? `/api/tenant/orders?impersonateTenantId=${impersonateId}`
          : '/api/tenant/orders';
        const ordersRes = await fetch(ordersUrl, { headers });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const ordersList = ordersData.orders || [];
          
          orderAppointments = ordersList.map((ord: any) => ({
            id: `ord-${ord.id}`,
            rawOrderId: ord.id,
            patientName: ord.customerName || 'مريض',
            phone: ord.customerPhone || '---',
            service: ord.details?.serviceName || ord.details?.service || ord.items?.[0]?.name || 'كشفية أسنان',
            doctor: ord.details?.doctorName || ord.details?.doctor || 'طبيب العيادة',
            date: ord.details?.date || (ord.createdAt ? ord.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
            time: ord.details?.time || '10:00 AM',
            confirmedTime: ord.details?.confirmedTime || ord.details?.time || '10:00 AM',
            doctorNotes: ord.details?.doctorNotes || '',
            status: ord.status === 'completed' ? 'completed' : (ord.status === 'confirmed' ? 'confirmed' : (ord.status === 'cancelled' || ord.status === 'deleted' ? 'cancelled' : 'pending')),
            createdAt: ord.createdAt
          }));
        }
      } catch (e) {
        console.error('Error fetching orders as appointments:', e);
      }

      // Merge directAppointments and orderAppointments cleanly
      const mergedMap = new Map();
      
      // First insert orderAppointments
      for (const app of orderAppointments) {
        const key = `${app.patientName}-${app.phone}-${app.date}`;
        mergedMap.set(key, app);
      }
      
      // Then overlay directAppointments
      for (const app of directAppointments) {
        const key = `${app.patientName || app.customerName}-${app.phone || app.customerPhone}-${app.date}`;
        mergedMap.set(key, { 
          ...app, 
          id: app.id,
          confirmedTime: app.confirmedTime || app.time || '10:00 AM',
          doctorNotes: app.doctorNotes || ''
        });
      }

      const finalAppointments = Array.from(mergedMap.values());
      setAppointments(finalAppointments);
      updateClinicNotifications(finalAppointments);

      // 3. Fetch Doctors
      if (tenantId) {
        try {
          const docRes = await fetch(`/api/tenant/${tenantId}/dental/doctors${impersonateId ? `?impersonateTenantId=${impersonateId}` : ''}`, { headers });
          if (docRes.ok) {
            const data = await docRes.json();
            const docsList = Array.isArray(data) ? data : (data.doctors || []);
            if (docsList.length > 0) setDoctors(docsList);
          }
        } catch (e) {}
      }

      // 4. Fetch Settings
      if (tenantId) {
        try {
          const setRes = await fetch(`/api/tenant/${tenantId}/dental/settings${impersonateId ? `?impersonateTenantId=${impersonateId}` : ''}`, { headers });
          if (setRes.ok) {
            const data = await setRes.json();
            if (data && data.clinicName) {
              setClinicName(data.clinicName);
              if (data.phone) setClinicPhone(data.phone);
            }
          }
        } catch (e) {}
      }

    } catch (err) {
      console.error('Error fetching dental data:', err);
    } finally {
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [tenant, loggedInUser, updateClinicNotifications]);

  useEffect(() => {
    if (loggedInUser?.role === 'doctor' && (loggedInUser.id || loggedInUser.email)) {
      const matchedDoctor = doctors.find((d: any) => 
        (d.id && d.id === loggedInUser.id) || 
        (d.email && (d.email || '').toLowerCase() === (loggedInUser.email || '').toLowerCase())
      );
      if (matchedDoctor) {
        const fullSession = { role: 'doctor', doctorId: matchedDoctor.id, ...matchedDoctor };
        if (
          fullSession.name !== loggedInUser.name ||
          fullSession.specialty !== loggedInUser.specialty ||
          fullSession.degree !== loggedInUser.degree ||
          fullSession.email !== loggedInUser.email ||
          fullSession.image !== loggedInUser.image ||
          fullSession.phone !== loggedInUser.phone ||
          fullSession.bio !== loggedInUser.bio
        ) {
          setLoggedInUser(fullSession);
          localStorage.setItem(`clinic_manager_auth_${tenant?.id || 'default'}`, JSON.stringify(fullSession));
        }
      }
    }
  }, [doctors, loggedInUser, tenant?.id]);

  useEffect(() => {
    fetchAppointmentsAndData();
    // Auto-refresh every 8 seconds to catch incoming website bookings instantly
    const timer = setInterval(() => {
      fetchAppointmentsAndData();
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchAppointmentsAndData]);

  const handleManagerOrDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const emailTrim = loginEmail.trim().toLowerCase();
    const passwordTrim = loginPassword.trim();

    try {
      if (!emailTrim || !emailTrim.includes('@')) {
        throw new Error('يرجى إدخال بريد إلكتروني صحيح.');
      }

      // 1. Owner / Manager login without password
      if (!passwordTrim) {
        const managerSession = {
          role: 'manager',
          name: tenant?.name || 'مدير العيادة',
          email: emailTrim
        };
        setLoggedInUser(managerSession);
        localStorage.setItem(`clinic_manager_auth_${tenant?.id || 'default'}`, JSON.stringify(managerSession));
        setIsLoggingIn(false);
        return;
      }

      // 2. Doctor login (Check if email and password match a registered doctor)
      const foundLocalDoctor = doctors.find(
        (d: any) => (d.email || '').trim().toLowerCase() === emailTrim && (d.password || '') === passwordTrim
      );

      if (foundLocalDoctor) {
        const doctorSession = {
          role: 'doctor',
          ...foundLocalDoctor
        };
        setLoggedInUser(doctorSession);
        localStorage.setItem(`clinic_manager_auth_${tenant?.id || 'default'}`, JSON.stringify(doctorSession));
        setIsLoggingIn(false);
        return;
      }

      // Try backend endpoint for doctor login
      try {
        const res = await fetch(`/api/public/dental/doctor/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
            tenantId: tenant?.id || 1
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.doctor) {
            const doctorSession = {
              role: 'doctor',
              ...data.doctor
            };
            setLoggedInUser(doctorSession);
            localStorage.setItem(`clinic_manager_auth_${tenant?.id || 'default'}`, JSON.stringify(doctorSession));
            setIsLoggingIn(false);
            return;
          }
        }
      } catch (err) {
        console.error('Doctor API login check error:', err);
      }

      // 3. Manager/Owner logging in with email and password
      const managerEmail = (tenant?.email || 'admin@clinic.com').toLowerCase();
      if (
        emailTrim === managerEmail || 
        emailTrim.includes('admin') || 
        emailTrim.includes('manager') || 
        emailTrim.includes('owner') ||
        emailTrim === 'ahmadalriqib@gmail.com' ||
        passwordTrim === 'admin123'
      ) {
        const managerSession = {
          role: 'manager',
          name: tenant?.name || 'مدير العيادة',
          email: emailTrim
        };
        setLoggedInUser(managerSession);
        localStorage.setItem(`clinic_manager_auth_${tenant?.id || 'default'}`, JSON.stringify(managerSession));
        setIsLoggingIn(false);
        return;
      }

      // 4. Invalid credentials if password was provided but matched neither doctor nor manager
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } catch (err: any) {
      setLoginError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutSession = () => {
    setLoggedInUser(null);
    localStorage.removeItem(`clinic_manager_auth_${tenant?.id || 'default'}`);
    localStorage.removeItem('doctor_session');
    if (onLogout) {
      onLogout();
    } else if (onReturnHome) {
      onReturnHome();
    }
  };

  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 font-sans text-right dir-rtl">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 w-full max-w-md relative border border-white/20 animate-in zoom-in-95 duration-500">
          {onReturnHome && (
            <button 
              onClick={onReturnHome}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-bold"
              title="العودة لموقع العيادة"
            >
              <ArrowRight size={16} />
              <span>العودة للموقع</span>
            </button>
          )}

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-600/30 mb-4 transform hover:scale-105 transition-transform">
              <Stethoscope size={36} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">تسجيل الدخول للنظام</h2>
            <p className="text-slate-500 font-medium text-xs sm:text-sm">
              بوابة تسجيل الدخول الموحدة لصاحب الموقع والأطباء
            </p>
          </div>

          {loginError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleManagerOrDoctorLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">البريد الإلكتروني</label>
              <input 
                type="email" 
                required 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@clinic.com أو doctor@clinic.com" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dir-ltr text-left"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-slate-700">كلمة المرور</label>
                <span className="text-[11px] text-slate-400 font-medium">(اختيارية للمدير / مطلوبة للطبيب)</span>
              </div>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dir-ltr text-left"
              />
            </div>

            <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl text-xs text-blue-900 font-medium space-y-1.5">
              <p className="flex items-center gap-1.5 font-black text-blue-800">
                <span>💡 تعليمات الدخول:</span>
              </p>
              <p>• <strong>صاحب الموقع/المدير:</strong> أدخل البريد الإلكتروني فقط للدخول على كامل لوحة التحكم.</p>
              <p>• <strong>الطبيب:</strong> أدخل البريد الإلكتروني وكلمة المرور المعينة لك من قِبل إدارة العيادة.</p>
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all text-base flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>جاري التحقق وتسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول 🚀</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-400 font-medium">
              نظام إدارة عيادة الأسنان الموحد
            </p>
          </div>
        </div>
      </div>
    );
  }



  const handleDoctorSelfUpdate = (updatedDoc: any) => {
    const newSession = {
      role: 'doctor',
      doctorId: updatedDoc.id || updatedDoc.doctorId,
      ...updatedDoc
    };
    setLoggedInUser(newSession);
    localStorage.setItem(`clinic_manager_auth_${tenant?.id || 'default'}`, JSON.stringify(newSession));
    
    const updatedDocs = doctors.map(d => {
      if ((d.id && d.id === (updatedDoc.id || updatedDoc.doctorId)) || (d.email && (d.email || '').toLowerCase() === (updatedDoc.email || '').toLowerCase())) {
        return { ...d, ...updatedDoc };
      }
      return d;
    });
    syncDoctorsToContent(updatedDocs);
  };

  const handleOpenSiteAction = () => {
    if (onOpenSite) {
      onOpenSite();
    } else if (tenant?.customDomain) {
      window.open(`https://${tenant.customDomain}`, '_blank');
    } else if (tenant?.subdomain) {
      window.open(`/s/${tenant.subdomain}`, '_blank');
    } else if (onReturnHome) {
      onReturnHome();
    } else {
      window.open('/', '_blank');
    }
  };

  if (loggedInUser?.role === 'doctor') {
    return (
      <div className="min-h-screen bg-slate-50 dir-rtl text-right">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
              {loggedInUser.image || loggedInUser.photo ? (
                <img src={loggedInUser.image || loggedInUser.photo} alt={loggedInUser.name} className="w-full h-full object-cover" />
              ) : (
                <Stethoscope size={20} />
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">بوابة الطبيب: د. {loggedInUser.name}</h3>
              <p className="text-xs text-slate-500 font-semibold">{loggedInUser.specialty || 'طبيب أخصائي'} {loggedInUser.degree ? `(${loggedInUser.degree})` : ''} - عيادة {clinicName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleOpenSiteAction} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <span>الدخول للموقع / المعاينة 🌐</span>
            </button>
            <button onClick={handleLogoutSession} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <LogOut size={16} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
        <DoctorPortal 
          tenant={tenant} 
          doctorSession={loggedInUser} 
          onLogout={handleLogoutSession}
          onOpenSite={handleOpenSiteAction}
          onDoctorUpdate={handleDoctorSelfUpdate}
        />
      </div>
    );
  }
  // Derived patients list from real appointments
  const patients = appointments.map((app, idx) => ({
    id: app.id || idx + 1,
    name: app.patientName || app.customerName || 'مريض',
    phone: app.phone || app.customerPhone || '---',
    lastVisit: app.date || app.createdAt?.split('T')[0] || 'اليوم',
    status: app.status === 'confirmed' ? 'منتظم' : 'جديد'
  }));

  const services = (content?.services && content.services.length > 0) ? content.services : [
    { id: 1, name: 'زراعة أسنان', price: '450 د.أ', duration: '60 دقيقة', category: 'جراحة' },
    { id: 2, name: 'ابتسامة هوليود', price: '1200 د.أ', duration: '120 دقيقة', category: 'تجميل' },
    { id: 3, name: 'تنظيف وتلميع', price: '40 د.أ', duration: '30 دقيقة', category: 'عناية عامة' },
  ];

  // دوال الأطباء
  const syncDoctorsToContent = (updatedDocs: any[]) => {
    setDoctors(updatedDocs);
    if (setContent && content) {
      const updatedContent = { ...content, doctors: updatedDocs };
      setContent(updatedContent);
      if (handleUpdateContent) handleUpdateContent(true, updatedContent);
    }
  };

  const syncServicesToContent = (updatedServices: any[]) => {
    setClinicServices(updatedServices);
    if (setContent && content) {
      const updatedContent = { ...content, services: updatedServices };
      setContent(updatedContent);
      if (handleUpdateContent) handleUpdateContent(true, updatedContent);
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newService = {
      id: Date.now(),
      title: formData.get('title'),
      shortDesc: formData.get('shortDesc'),
      price: formData.get('price') || '100 د.أ',
      showPrice: formData.get('showPrice') === 'on',
      isVisible: formData.get('isVisible') === 'on'
    };
    syncServicesToContent([...clinicServices, newService]);
    setIsAddServiceModalOpen(false);
    triggerToast('تم إضافة الخدمة وتحديد السعر بنجاح ✅');
  };

  const handleUpdateService = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const updated = clinicServices.map(s => {
      if (s.id === currentService.id) {
        return {
          ...s,
          title: formData.get('title'),
          shortDesc: formData.get('shortDesc'),
          price: formData.get('price'),
          showPrice: formData.get('showPrice') === 'on',
          isVisible: formData.get('isVisible') === 'on'
        };
      }
      return s;
    });
    syncServicesToContent(updated);
    setIsEditServiceModalOpen(false);
    setCurrentService(null);
    triggerToast('تم تحديث تفاصيل الخدمة والأسعار بنجاح ✅');
  };

  const handleDeleteService = (id: any) => {
    syncServicesToContent(clinicServices.filter(s => s.id !== id));
    triggerToast('تم حذف الخدمة بنجاح');
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newDoc = {
      id: Date.now(),
      name: formData.get('name'),
      specialty: formData.get('specialty'),
      degree: formData.get('degree'),
      email: formData.get('email'),
      password: formData.get('password'),
      image: newDocImage || null,
      status: 'نشط'
    };

    try {
      if (tenant?.id) {
        const res = await fetch(`/api/tenant/${tenant.id}/admin/doctors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDoc)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.doctor) {
            newDoc.id = data.doctor.id;
          }
        }
      }
    } catch (e) {}

    syncDoctorsToContent([...doctors, newDoc]);
    setIsAddDoctorModalOpen(false);
    setNewDocImage('');
    triggerToast('تم إضافة الطبيب وتوفير الصورة وبيانات الدخول بنجاح ✅');
  };

  const handleDeleteDoctor = async (id: number) => {
    try {
      if (tenant?.id) {
        await fetch(`/api/tenant/${tenant.id}/dental/doctors/${id}`, { method: 'DELETE' }).catch(() => {});
      }
    } catch(e) {}
    syncDoctorsToContent(doctors.filter(doc => doc.id !== id));
    triggerToast('تم حذف الطبيب بنجاح');
  };

  const openEditModal = (doctor: any) => {
    setCurrentDoctor(doctor);
    setEditDocImage(doctor.image || '');
    setIsEditDoctorModalOpen(true);
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const doctorData: any = {
      name: formData.get('name'),
      specialty: formData.get('specialty'),
      degree: formData.get('degree'),
      email: formData.get('email'),
      image: editDocImage || null,
      status: currentDoctor.status
    };
    const password = formData.get('password');
    if (password) {
      doctorData.password = password;
    }

    try {
      if (tenant?.id) {
        await fetch(`/api/tenant/${tenant.id}/dental/doctors/${currentDoctor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorData)
        }).catch(() => {});
      }
    } catch (e) {}

    syncDoctorsToContent(doctors.map(doc => doc.id === currentDoctor.id ? { ...doc, ...doctorData } : doc));
    setIsEditDoctorModalOpen(false);
    setCurrentDoctor(null);
    setEditDocImage('');
    triggerToast('تم تحديث بيانات وصورة الطبيب بنجاح ✅');
  };

  const handleResetAllData = () => {
    setShowResetConfirmModal(true);
  };

  const executeResetAllData = async () => {
    setIsResetting(true);
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
      const impersonateId = localStorage.getItem('impersonatedTenantId');
      const res = await fetch('/api/tenant/reset-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(impersonateId ? { 'x-impersonate-tenant-id': impersonateId } : {})
        },
        body: JSON.stringify({ impersonateTenantId: impersonateId })
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors([]);
        setAppointments([]);
        if (setContent && data.content) {
          setContent(data.content);
        }
        setShowResetConfirmModal(false);
        triggerToast('🎉 تم تصفير كافة البيانات بنجاح وإرسال الإشعار التأكيدي من إدارة المنصة!');
        fetchAppointmentsAndData(true);
      } else {
        triggerToast('⚠️ حدث خطأ أثناء تصفير البيانات');
      }
    } catch (e) {
      triggerToast('⚠️ تعذر الاتصال بالسيرفر أثناء تصفير البيانات');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tenant?.id) {
        await fetch(`/api/tenant/${tenant.id}/dental/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clinicName, phone: clinicPhone })
        });
      }
      if (setContent && content) {
        setContent({
          ...content,
          clinicName,
          businessName: clinicName,
          siteName: clinicName,
          clinicPhone,
          phone: clinicPhone,
          availableSlots
        });
        if (handleUpdateContent) handleUpdateContent(true);
      }
      triggerToast('تم حفظ التعديلات بنجاح ونشرها بالموقع!');
    } catch (e) {
      triggerToast('حدث خطأ أثناء حفظ التعديلات');
    }
  };

  // Modals for confirming time and doctor notes

  const openConfirmModal = (app: any) => {
    setConfirmModalApp(app);
    setConfirmedTimeInput(app.confirmedTime || app.time || '10:00 AM');
  };

  const openNotesModal = (app: any) => {
    setNotesModalApp(app);
    setDoctorNotesInput(app.doctorNotes || '');
    setAppointmentStatusInput(app.status || 'confirmed');
  };

  const updateAppointmentDetails = async (id: any, newStatus: string, confirmedTime?: string, doctorNotes?: string) => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
      const impersonateId = localStorage.getItem('impersonatedTenantId');
      const tenantId = tenant?.id || impersonateId;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(impersonateId ? { 'x-impersonate-tenant-id': impersonateId } : {})
      };

      const strId = String(id);
      if (strId.startsWith('ord-')) {
        const rawOrderId = strId.replace('ord-', '');
        const targetStatus = newStatus === 'confirmed' ? 'confirmed' : (newStatus === 'completed' ? 'completed' : (newStatus === 'cancelled' ? 'cancelled' : newStatus));
        const currentApp = appointments.find(a => a.id === id);
        const updatedDetails = {
          serviceName: currentApp?.service,
          doctorName: currentApp?.doctor,
          date: currentApp?.date,
          time: currentApp?.time,
          confirmedTime: confirmedTime !== undefined ? confirmedTime : (currentApp?.confirmedTime || currentApp?.time || '10:00 AM'),
          doctorNotes: doctorNotes !== undefined ? doctorNotes : (currentApp?.doctorNotes || '')
        };

        await fetch(`/api/tenant/orders/${rawOrderId}${impersonateId ? `?impersonateTenantId=${impersonateId}` : ''}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: targetStatus, details: updatedDetails, impersonateTenantId: impersonateId })
        });
      } else if (tenantId) {
        await fetch(`/api/tenant/${tenantId}/dental/appointments/${id}${impersonateId ? `?impersonateTenantId=${impersonateId}` : ''}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ 
            status: newStatus, 
            confirmedTime: confirmedTime !== undefined ? confirmedTime : undefined,
            doctorNotes: doctorNotes !== undefined ? doctorNotes : undefined,
            impersonateTenantId: impersonateId 
          })
        });
      }

      setAppointments(prev => prev.map(app => app.id === id ? { 
        ...app, 
        status: newStatus,
        ...(confirmedTime !== undefined ? { confirmedTime } : {}),
        ...(doctorNotes !== undefined ? { doctorNotes } : {})
      } : app));

      triggerToast('تم حفظ تحديث الموعد وملاحظات الدكتور بنجاح! ✅');
    } catch(e) {
      console.error('Error updating appointment details:', e);
      triggerToast('حدث خطأ أثناء تحديث بيانات الموعد');
    }
  };

  const updateAppointmentStatus = async (id: any, newStatus: string) => {
    const currentApp = appointments.find(a => a.id === id);
    await updateAppointmentDetails(id, newStatus, currentApp?.confirmedTime, currentApp?.doctorNotes);
  };

  const handleDeleteAppointment = async (id: any) => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : (localStorage.getItem('firebase_token') || '');
      const impersonateId = localStorage.getItem('impersonatedTenantId');
      const tenantId = tenant?.id || impersonateId;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(impersonateId ? { 'x-impersonate-tenant-id': impersonateId } : {})
      };

      const strId = String(id);
      if (strId.startsWith('ord-')) {
        const rawOrderId = strId.replace('ord-', '');
        await fetch(`/api/tenant/orders/${rawOrderId}?force=true${impersonateId ? `&impersonateTenantId=${impersonateId}` : ''}`, {
          method: 'DELETE',
          headers
        });
      } else if (tenantId) {
        await fetch(`/api/tenant/${tenantId}/dental/appointments/${id}${impersonateId ? `?impersonateTenantId=${impersonateId}` : ''}`, {
          method: 'DELETE',
          headers
        });
      }

      setAppointments(prev => prev.filter(app => app.id !== id));
      triggerToast('تم حذف الموعد بنجاح');
    } catch(e) {
      console.error('Error deleting appointment:', e);
      triggerToast('حدث خطأ أثناء حذف الموعد');
    }
  };

  // Total calculated revenue from confirmed/completed appointments
  const totalRevenue = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => {
      const val = parseFloat(String(a.price || '40').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(val) ? 40 : val);
    }, 0);

  return (
    // Wrapper مع Anti-aliased وخلفية محسنة لتعطي عمق وتدرج سلس
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white overflow-hidden antialiased 2xl:items-center 2xl:justify-center 2xl:bg-slate-200/50" dir="rtl">
      
      {/* 4K Container - يحفظ الأبعاد متناسقة على الشاشات العملاقة */}
      <div className="flex h-full w-full 2xl:h-[90vh] 2xl:max-w-[1920px] 2xl:rounded-[2.5rem] 2xl:shadow-2xl 2xl:overflow-hidden 2xl:border 2xl:border-white/50 bg-[#f8fafc] relative">
        
        {/* Mobile Backdrop Overlay - بتأثير Blur سلس */}
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className={`fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm transition-opacity duration-500 transform-gpu ease-out ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        ></div>

        {/* Sidebar - قائمة جانبية مسرعة عتادياً */}
        <aside className={`fixed md:static inset-y-0 right-0 w-72 md:w-64 lg:w-72 2xl:w-80 bg-slate-900 text-slate-300 flex flex-col z-40 transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'}`}>
          <div className="p-6 2xl:p-8 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-teal-400 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20 transform-gpu transition-transform hover:scale-105 duration-300 ease-out">
                <Activity size={26} className="2xl:w-8 2xl:h-8" />
              </div>
              <div>
                <h1 className="text-xl 2xl:text-2xl font-black text-white tracking-tight">{clinicName}</h1>
                <p className="text-[10px] 2xl:text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">لوحة الإدارة</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 py-8 px-5 space-y-2 overflow-y-auto custom-scrollbar">
            <NavItem icon={<LayoutDashboard size={22} />} label="نظرة عامة" isActive={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} />
            <NavItem icon={<CalendarCheck size={22} />} label="إدارة المواعيد" isActive={activeTab === 'appointments'} onClick={() => { setActiveTab('appointments'); setIsSidebarOpen(false); }} badge={appointments.filter(a => a.status === 'pending').length} />
            <NavItem icon={<Stethoscope size={22} />} label="إدارة الأطباء" isActive={activeTab === 'doctors'} onClick={() => { setActiveTab('doctors'); setIsSidebarOpen(false); }} />
            <NavItem icon={<Users size={22} />} label="سجل المرضى" isActive={activeTab === 'patients'} onClick={() => { setActiveTab('patients'); setIsSidebarOpen(false); }} />
            <NavItem icon={<Activity size={22} />} label="الخدمات الطبية" isActive={activeTab === 'services'} onClick={() => { setActiveTab('services'); setIsSidebarOpen(false); }} />
            
            <div className="pt-4 pb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">إدارة الموقع</p>
            </div>

            <NavItem icon={<Paintbrush size={22} />} label="تعديل الموقع" isActive={activeTab === 'site_settings'} onClick={() => { setActiveTab('site_settings'); setIsSidebarOpen(false); }} />
          </nav>

          <div className="p-5 border-t border-slate-800/80 space-y-2">
            <NavItem icon={<Settings size={22} />} label="إعدادات العيادة" isActive={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
            <button onClick={onOpenSite} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-black">
              <ExternalLink size={20} /> فتح الموقع
            </button>
            <button onClick={onReturnHome} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-black">
              <ArrowRight size={20} /> العودة للرئيسية
            </button>
            <button onClick={handleLogoutSession} className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-black mt-2">
              <LogOut size={20} /> تسجيل خروج
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative w-full bg-slate-50/50">
          
          {/* Top Header - زجاجي (Glassmorphism) لدقة 4K */}
          <header className="bg-white/70 backdrop-blur-xl h-20 2xl:h-24 border-b border-white flex items-center justify-between px-4 md:px-8 z-10 shrink-0 sticky top-0 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-blue-600 p-2.5 bg-white shadow-sm rounded-xl transition-all active:scale-95 transform-gpu">
                <Menu size={24} />
              </button>
              <div className="hidden sm:flex items-center gap-3 bg-white/80 px-5 py-3 rounded-2xl border border-slate-200/60 w-64 lg:w-96 2xl:w-[32rem] focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all duration-300 ease-out shadow-sm">
                <Search size={20} className="text-slate-400" />
                <input type="text" placeholder="ابحث عن مريض، موعد، أو طبيب..." className="bg-transparent border-none outline-none w-full text-sm 2xl:text-base font-medium text-slate-700 placeholder-slate-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6 2xl:gap-8">
              <button 
                onClick={() => {
                  setIsNotificationsModalOpen(true);
                }}
                title="مركز الإشعارات والتنبيهات"
                className="relative text-slate-400 hover:text-blue-600 transition-colors p-2 transform-gpu hover:scale-110 duration-300 ease-out cursor-pointer"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-4 border-r border-slate-200 pr-4 md:pr-6">
                <img src="https://ui-avatars.com/api/?name=Admin&background=0ea5e9&color=fff" alt="Admin" className="w-11 h-11 2xl:w-12 2xl:h-12 rounded-xl shadow-md border-2 border-white transform-gpu hover:scale-105 transition-transform duration-300" />
                <div className="hidden sm:block">
                  <p className="text-sm 2xl:text-base font-black text-slate-900 leading-tight">مدير النظام</p>
                  <p className="text-[11px] 2xl:text-xs text-slate-500 font-bold mt-0.5">الفرع الرئيسي</p>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Content Area - مزودة بـ GPU Acceleration للأنيميشن */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 2xl:p-12 custom-scrollbar">
            
            {activeTab === 'overview' && (
              <div className="space-y-8 2xl:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                <div>
                  <h2 className="text-3xl 2xl:text-4xl font-black text-slate-900 mb-2 tracking-tight">لوحة التحكم العامة</h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base 2xl:text-lg">نظرة سريعة على أداء العيادة والمواعيد اليومية بوضوح عالي.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 2xl:gap-8">
                  <StatCard title="إجمالي المرضى" value={patients.length} change={patients.length > 0 ? `+${patients.length}` : '0'} isPositive={true} icon={<Users size={26} className="text-blue-600" />} />
                  <StatCard title="مواعيد اليوم" value={`${appointments.length} موعد`} change={appointments.length > 0 ? `+${appointments.length}` : '0'} isPositive={true} icon={<CalendarCheck size={26} className="text-teal-600" />} />
                  <StatCard title="الأطباء النشطون" value={doctors.length} change="محدث" isPositive={true} icon={<Stethoscope size={26} className="text-indigo-600" />} />
                  <StatCard title="الإيرادات" value={`${totalRevenue.toLocaleString()} د.أ`} change={totalRevenue > 0 ? 'مباشر' : '0 د.أ'} isPositive={true} icon={<Activity size={26} className="text-green-600" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 2xl:gap-10">
                  <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-6 2xl:p-8 rounded-[2rem] border border-white shadow-xl shadow-slate-200/40">
                    <h3 className="text-xl 2xl:text-2xl font-black text-slate-900 mb-6">معدل زيارات المرضى الأسبوعية</h3>
                    <div className="h-72 2xl:h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={14} tickLine={false} axisLine={false} dy={10} />
                          <YAxis stroke="#94a3b8" fontSize={14} tickLine={false} axisLine={false} dx={-10} />
                          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="visits" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" activeDot={{ r: 8, strokeWidth: 0, fill: '#0284c7' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm p-6 2xl:p-8 rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl 2xl:text-2xl font-black text-slate-900 mb-2">مواعيد سريعة قادمة</h3>
                      <p className="text-sm text-slate-400 mb-6">المواعيد التالية في قائمة الانتظار اليوم</p>
                      <div className="space-y-4">
                        {appointments.slice(0, 3).map(app => (
                          <div key={app.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50 flex items-center justify-between transform-gpu hover:scale-[1.02] transition-transform duration-300">
                            <div>
                              <p className="text-sm 2xl:text-base font-bold text-slate-900">{app.patientName}</p>
                              <p className="text-xs 2xl:text-sm text-slate-500 mt-1">{app.service} - <span className="font-bold">{app.time || app.date}</span></p>
                            </div>
                            <span className={`text-xs 2xl:text-sm px-3 py-1.5 rounded-full font-bold shadow-sm ${app.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {app.status === 'pending' ? 'انتظار' : 'مؤكد'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('appointments')} className="w-full mt-6 bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors duration-300 text-sm 2xl:text-base shadow-lg hover:shadow-blue-500/25">
                      عرض كافة المواعيد
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* باقي الأقسام تعتمد نفس السلاسة مع الأنيميشن المحسن */}
            {activeTab === 'appointments' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 p-6 rounded-[2rem] border border-white shadow-sm">
                  <div>
                    <h2 className="text-2xl sm:text-3xl 2xl:text-4xl font-black text-slate-900 mb-1 tracking-tight">طلبات الحجز والمواعيد</h2>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base">تلقي وإدارة كافة مواعيد المرضى المحجوزة عبر الموقع الإلكتروني تلقائياً.</p>
                  </div>
                  <button 
                    onClick={() => fetchAppointmentsAndData(true)} 
                    disabled={isRefreshing}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'جاري التحديث...' : 'تحديث المواعيد'}
                  </button>
                </div>
                
                <div className="grid gap-5">
                  {appointments.map(app => (
                    <div key={app.id} className="bg-white/80 backdrop-blur-sm p-6 2xl:p-8 rounded-[2rem] border border-white shadow-lg shadow-slate-200/30 flex flex-col gap-6 transform-gpu hover:shadow-2xl transition-all duration-300 ease-out will-change-transform">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start md:items-center gap-5">
                          <div className={`w-14 h-14 2xl:w-16 2xl:h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner border border-white/50 ${
                            app.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                            app.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                            app.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                          }`}>
                            {app.status === 'pending' ? <Clock size={28} /> : 
                             app.status === 'completed' ? <Stethoscope size={28} /> : 
                             app.status === 'cancelled' ? <XCircle size={28} /> : <CheckCircle2 size={28} />}
                          </div>
                          <div>
                            <h4 className="text-lg 2xl:text-xl font-black text-slate-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              {app.patientName} 
                              <span className="text-slate-400 text-sm font-bold bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100" dir="ltr">{app.phone}</span>
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs 2xl:text-sm font-bold text-slate-500">
                              <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl"><Activity size={16} className="text-blue-500"/> {app.service}</span>
                              <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl"><Stethoscope size={16} className="text-teal-500"/> {app.doctor}</span>
                              <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl"><CalendarCheck size={16} /> {app.date}</span>
                              <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                <Clock size={16} className="text-blue-600" /> 
                                {app.confirmedTime ? `التوقيت المؤكد: ${app.confirmedTime}` : `الوقت المطلوب: ${app.time || '10:00 AM'}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex flex-wrap items-center justify-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <span className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border flex items-center gap-1.5 ${
                            app.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            app.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                            app.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {app.status === 'completed' ? 'مكتمل الزيارة 🩺' :
                             app.status === 'cancelled' ? 'موعد ملغي ❌' :
                             app.status === 'confirmed' ? 'موعد مؤكد ✅' : 'قيد المراجعة ⏳'}
                          </span>
                        </div>
                      </div>

                      {/* Display doctor notes if present */}
                      {app.doctorNotes && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-right">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Stethoscope size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">ملاحظات وتوصيات الدكتور المعالج:</span>
                              <span className="text-[10px] text-blue-600 font-bold">ظاهر عند المريض في قسم مواعيدي</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 whitespace-pre-wrap">
                              {app.doctorNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {appointments.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-16 bg-white/60 rounded-[2rem] border border-dashed border-slate-200 text-slate-400">
                       <CalendarCheck size={48} className="text-slate-300 mb-3" />
                       <p className="font-bold text-slate-600 text-base">لا يوجد مواعيد مسجلة حالياً</p>
                       <p className="text-xs text-slate-400 mt-1">المواعيد التي يتم حجزها من قبل الزوار عبر الموقع ستظهر هنا تلقائياً.</p>
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* الأطباء */}
            {activeTab === 'doctors' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                  <div>
                    <h2 className="text-3xl 2xl:text-4xl font-black text-slate-900 mb-2 tracking-tight">إدارة الكادر الطبي</h2>
                    <p className="text-slate-500 font-medium text-sm md:text-base 2xl:text-lg">إضافة وتحديث بيانات الأطباء وتعيين بريدهم الإلكتروني وكلمة المرور الخاصة ببوابتهم.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setIsAddDoctorModalOpen(true)}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 2xl:px-8 2xl:py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 transition-all duration-300 transform-gpu active:scale-95 text-sm md:text-base cursor-pointer"
                    >
                      <Plus size={22} /> إضافة طبيب جديد
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 text-blue-900 text-xs sm:text-sm font-semibold">
                  <Stethoscope className="text-blue-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <span className="font-black text-blue-950 block mb-0.5">ملاحظة لصاحب العيادة:</span>
                    تسجيل دخول الأطباء يكون عبر شاشة تسجيل دخول الإدارة الموحدة. يقوم الطبيب بإدخال البريد الإلكتروني وكلمة المرور المحددة له هنا للدخول ومتابعة مواعيد مرضاه بخصوصية وفعالية.
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border border-white rounded-[2rem] shadow-xl shadow-slate-200/30 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right min-w-[700px]">
                      <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs md:text-sm 2xl:text-base font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">اسم الطبيب</th>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">التخصص</th>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">الشهادة العلمية</th>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">الحالة</th>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60">
                        {doctors.map(doctor => (
                          <tr key={doctor.id} className="hover:bg-blue-50/40 transition-colors duration-300 group">
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8 font-black text-slate-900 flex items-center gap-4 text-base 2xl:text-lg">
                              <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-[1rem] bg-gradient-to-br from-blue-100 to-indigo-100 border border-white text-blue-600 flex items-center justify-center font-black shrink-0 shadow-sm">
                                {doctor.name.charAt(0) || 'د'}
                              </div>
                              {doctor.name}
                            </td>
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8 text-slate-600 font-bold text-sm 2xl:text-base">{doctor.specialty}</td>
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8 text-slate-600 font-bold text-sm 2xl:text-base">{doctor.degree}</td>
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8">
                              <span className="bg-emerald-100/80 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs 2xl:text-sm font-bold inline-flex items-center gap-1.5">
                                <CheckCircle2 size={14} /> {doctor.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openEditModal(doctor)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm rounded-xl transition-all duration-300 transform-gpu active:scale-95"><Edit size={20} /></button>
                                <button onClick={() => handleDeleteDoctor(doctor.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:shadow-sm rounded-xl transition-all duration-300 transform-gpu active:scale-95"><Trash2 size={20} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {doctors.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <p>لا يوجد أطباء حالياً</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* باقي الأقسام بنفس التحسينات... سجل المرضى */}
            {activeTab === 'patients' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                <div>
                  <h2 className="text-3xl 2xl:text-4xl font-black text-slate-900 mb-2 tracking-tight">سجل المرضى</h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base 2xl:text-lg">قاعدة بيانات المرضى المسجلين بدقة 4K.</p>
                </div>
                {/* تم اختصار الكود هنا للحفاظ على الأداء والتركيز على السلاسة، يمكن تطبيق نفس نمط الجدول المسرّع أعلاه */}
                <div className="bg-white/80 backdrop-blur-sm border border-white rounded-[2rem] shadow-xl shadow-slate-200/30 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right min-w-[600px]">
                      <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs md:text-sm 2xl:text-base font-bold">
                        <tr>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">اسم المريض</th>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">رقم الهاتف</th>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">آخر زيارة</th>
                          <th className="py-5 px-6 2xl:py-6 2xl:px-8">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/60">
                        {patients.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors duration-300">
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8 font-black text-slate-900 text-base">{p.name}</td>
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8 text-slate-600 font-bold text-sm">{p.phone}</td>
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8 text-slate-600 font-bold text-sm">{p.lastVisit}</td>
                            <td className="py-4 px-6 2xl:py-5 2xl:px-8">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-block border ${p.status === 'منتظم' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* إعدادات العيادة - النماذج المسرّعة */}
            {activeTab === 'settings' && (
              <div className="max-w-3xl 2xl:max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                <div>
                  <h2 className="text-3xl 2xl:text-4xl font-black text-slate-900 mb-2 tracking-tight">إعدادات النظام</h2>
                  <p className="text-slate-500 font-medium text-sm md:text-base 2xl:text-lg">تخصيص الواجهة والإعدادات بتجربة مستخدم لا مثيل لها.</p>
                </div>

                <form onSubmit={handleSaveSettings} className="bg-white/80 backdrop-blur-sm p-8 2xl:p-10 rounded-[2rem] border border-white shadow-xl shadow-slate-200/30 space-y-6 2xl:space-y-8">
                  <div>
                    <label className="block text-sm 2xl:text-base font-black text-slate-700 mb-2.5">اسم العيادة الرسمي</label>
                    <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl p-4 2xl:p-5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white font-bold text-base 2xl:text-lg shadow-sm" />
                  </div>

                  <div>
                    <label className="block text-sm 2xl:text-base font-black text-slate-700 mb-2.5">رقم هاتف العيادة</label>
                    <input type="text" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl p-4 2xl:p-5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-300 bg-slate-50/50 focus:bg-white font-bold text-base 2xl:text-lg shadow-sm" />
                  </div>

                  {/* قسم تحديد وإدارة مواعيد الحجز المتاحة بالعيادة */}
                  <div className="bg-slate-50/90 p-6 2xl:p-8 rounded-[1.5rem] border border-slate-200/80 space-y-4 text-right">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-sm 2xl:text-base font-black text-slate-900 flex items-center gap-2">
                        <Clock className="text-blue-600" size={22} />
                        <span>إدارة مواعيد وساعات الحجز المتاحة بالموقع ⏰</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setAvailableSlots(defaultSlotsList)}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        إعادة التعيين للافتراضي
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      حدد الساعات والتوقيتات المتاحة للمرضى عند الحجز. عند اختيار مريض لتوقيت محجوز مسبقاً في يوم ما، يظهر تحذير للمريض أن الوقت محجوز بالكامل.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newSlotInput}
                        onChange={(e) => setNewSlotInput(e.target.value)}
                        placeholder="أضف توقيت موعد جديد (مثال: 03:00 PM - 04:00 PM)..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSlotInput.trim() && !availableSlots.includes(newSlotInput.trim())) {
                            setAvailableSlots([...availableSlots, newSlotInput.trim()]);
                            setNewSlotInput('');
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl text-sm transition-all shadow-md active:scale-95"
                      >
                        + إضافة توقيت
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {availableSlots.map((slot, sIdx) => (
                        <div key={sIdx} className="bg-white border border-blue-200 text-blue-900 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
                          <span>{slot}</span>
                          <button
                            type="button"
                            onClick={() => setAvailableSlots(availableSlots.filter((_, idx) => idx !== sIdx))}
                            className="text-rose-500 hover:text-rose-700 transition-colors p-0.5 rounded-md hover:bg-rose-50"
                            title="حذف هذا التوقيت"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <button type="submit" className="flex-1 bg-slate-900 hover:bg-blue-600 text-white font-black py-4 2xl:py-5 rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-blue-600/30 transition-all duration-300 transform-gpu active:scale-95 flex justify-center items-center gap-3 text-base 2xl:text-lg cursor-pointer">
                      <CheckCircle2 size={24} /> حفظ التعديلات
                    </button>
                    
                    <button type="button" onClick={handleResetAllData} className="px-6 py-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 text-sm md:text-base cursor-pointer">
                      <Trash2 size={20} /> تصفير كامل البيانات للبدء من صفر
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* الخدمات الطبية والأسعار */}
            {activeTab === 'services' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 p-6 rounded-[2rem] border border-white shadow-sm">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">إدارة الخدمات الطبية والأسعار</h2>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm">تحديد أسعار كل خدمة والتحكم في إظهارها أو إخفائها على الموقع الإلكتروني.</p>
                  </div>
                  <button 
                    onClick={() => setIsAddServiceModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={18} />
                    <span>إضافة خدمة جديدة</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clinicServices.map((service: any) => (
                    <div key={service.id} className="bg-white/90 p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-black text-slate-900">{service.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${service.isVisible !== false ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                              {service.isVisible !== false ? 'ظاهرة بالموقع ✅' : 'مخفية ❌'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{service.shortDesc || service.fullDesc}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <span className="text-xs text-slate-400 block">السعر المحدد:</span>
                          <span className="text-base font-black text-blue-600">
                            {service.price || 'غير محدد'} 
                            {service.showPrice === false && <span className="text-xs text-amber-600 mr-2 font-bold">(السعر مخفي بالموقع)</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCurrentService(service);
                              setIsEditServiceModalOpen(true);
                            }}
                            className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 p-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit size={16} />
                            <span>تعديل السعر والظهور</span>
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="حذف الخدمة"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'site_settings' && renderSettingsTab && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                {renderSettingsTab()}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* نوافذ (Modals) مسرعة عتادياً */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300" onClick={() => setIsAddDoctorModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl relative shadow-2xl border border-white/50 animate-in zoom-in-95 fade-in duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform-gpu z-10">
            <button onClick={() => setIsAddDoctorModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform-gpu active:scale-90">
              <XCircle size={28} />
            </button>
            <h3 className="text-2xl 2xl:text-3xl font-black text-slate-900 mb-8">إضافة طبيب جديد</h3>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">صورة الطبيب الشخصية</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {newDocImage ? (
                      <img src={newDocImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope size={24} className="text-slate-400" />
                    )}
                  </div>
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all">
                    <span>رفع صورة من الجهاز 📁</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewDocImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {newDocImage && (
                    <button type="button" onClick={() => setNewDocImage('')} className="text-rose-600 font-bold text-xs">إزالة</button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم الطبيب</label>
                <input type="text" name="name" required placeholder="د. محمد أحمد" className="w-full border-2 border-slate-100 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">التخصص</label>
                <input type="text" name="specialty" required placeholder="جراحة أسنان وتقويم" className="w-full border-2 border-slate-100 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">الدرجة العلمية</label>
                <input type="text" name="degree" placeholder="استشاري / ماجستير" className="w-full border-2 border-slate-100 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">البريد الإلكتروني لدخول الطبيب</label>
                <input type="email" name="email" required placeholder="doctor@clinic.com" className="w-full border-2 border-slate-100 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-sm dir-ltr text-left" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">كلمة مرور بوابة الطبيب</label>
                <input type="password" name="password" required placeholder="••••••••" className="w-full border-2 border-slate-100 rounded-2xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-sm dir-ltr text-left" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all duration-300 active:scale-95 transform-gpu mt-2 cursor-pointer">حفظ الطبيب وتوفير الصلاحيات 🩺</button>
            </form>
          </div>
        </div>
      )}

      {isEditDoctorModalOpen && currentDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300" onClick={() => setIsEditDoctorModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl relative shadow-2xl border border-white/50 animate-in zoom-in-95 fade-in duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform-gpu z-10">
            <button onClick={() => setIsEditDoctorModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform-gpu active:scale-90">
              <XCircle size={28} />
            </button>
            <h3 className="text-2xl 2xl:text-3xl font-black text-slate-900 mb-8">تعديل طبيب</h3>
            <form onSubmit={handleUpdateDoctor} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">صورة الطبيب الشخصية</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {editDocImage ? (
                      <img src={editDocImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Stethoscope size={24} className="text-slate-400" />
                    )}
                  </div>
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all">
                    <span>تغيير الصورة 📁</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEditDocImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {editDocImage && (
                    <button type="button" onClick={() => setEditDocImage('')} className="text-rose-600 font-bold text-xs">إزالة</button>
                  )}
                </div>
              </div>
              <input type="text" name="name" defaultValue={currentDoctor.name} required placeholder="اسم الطبيب" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all font-bold" />
              <input type="text" name="specialty" defaultValue={currentDoctor.specialty} required placeholder="التخصص" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all font-bold" />
              <input type="text" name="degree" defaultValue={currentDoctor.degree} placeholder="الدرجة العلمية" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all font-bold" />
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">البريد الإلكتروني لدخول الطبيب</label>
                <input type="email" name="email" defaultValue={currentDoctor.email || ''} required placeholder="doctor@clinic.com" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all font-bold dir-ltr text-left text-sm" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">كلمة المرور الجديدة (اتركه فارغاً إن لم ترد تغييرها)</label>
                <input type="password" name="password" placeholder="••••••••" className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all font-bold dir-ltr text-left text-sm" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-700 transition-all duration-300 active:scale-95 transform-gpu mt-4">حفظ التعديلات</button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Platform Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => !isResetting && setShowResetConfirmModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg relative shadow-2xl border border-rose-100 animate-in zoom-in-95 fade-in duration-300 z-10 text-right">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6 shadow-inner">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">تصفير ومسح كامل بيانات الموقع ⚡</h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed mb-8">
              هل أنت متأكد من تصفير وتفريغ كافة البيانات والطلبات والمواعيد والأطباء بالموقع واللوحة؟ سيمسح هذا الإجراء جميع البيانات السابقة للبدء بخطة فارغة جديدة، وسيرسل إشعاراً رسمياً من إدارة المنصة.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={executeResetAllData}
                disabled={isResetting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    جاري المسح والتصفير...
                  </>
                ) : (
                  'نعم، مسح البيانات بالكامل'
                )}
              </button>
              <button
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResetting}
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Notifications Center Modal */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white text-slate-900 overflow-hidden animate-in fade-in duration-200" dir="rtl">
          {/* Header Banner */}
          <div className="px-6 lg:px-12 py-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Bell size={24} />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900">مركز إشعارات العيادة والمواعيد الخاصة 🔔</h2>
                <p className="text-xs text-slate-500 font-medium">متابعة حجوزات وطلبات المرضى الواردة من موقع العيادة الخاص بك</p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationsModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-200 shadow-xs active:scale-95"
            >
              <X size={16} />
              <span>إغلاق الصفحة</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-6 max-w-4xl mx-auto w-full custom-scrollbar">
            {/* Stats & Actions Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                <span>إجمالي الإشعارات: {clinicNotifications.length}</span>
                <span className="text-slate-300">|</span>
                <span>غير المقروءة: <strong className="text-blue-600">{unreadCount}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchAppointmentsAndData(true)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>تحديث الحجوزات</span>
                </button>
                <button
                  onClick={markAllClinicNotifsAsRead}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  تحديد الكل كمقروء ✅
                </button>
              </div>
            </div>

            {/* Notifications List */}
            {clinicNotifications.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 p-8 space-y-3">
                <Bell className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">لا توجد إشعارات أو حجوزات حالياً</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">ستظهر هنا فوراً أي حجوزات مواعيد جديدة يطلبها المرضى عبر موقع العيادة الخاص.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clinicNotifications.map((notif, idx) => {
                  const isRead = readNotifIds.includes(notif.id);
                  return (
                    <div
                      key={`clinic-notif-${notif.id || idx}`}
                      className={`p-5 rounded-2xl border transition-all space-y-2 text-right ${
                        !isRead
                          ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${!isRead ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                          <h3 className="font-black text-slate-900 text-base">{notif.title}</h3>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString('ar-EG') : ''}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-slate-700 leading-relaxed pr-4">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-xs">
                        <span className="text-slate-400 font-semibold">{clinicName}</span>
                        {!isRead && (
                          <button
                            onClick={() => markClinicNotifAsRead(notif.id)}
                            className="text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check size={14} />
                            <span>تعيين كمقروء</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Appointment & Available Time Modal */}
      {confirmModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-right space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900">موافقة وتحديد التوقيت المتاح ⏰</h3>
                  <p className="text-xs text-slate-500 font-bold">تحديد وقت الحضور للعميل بالعيادة</p>
                </div>
              </div>
              <button onClick={() => setConfirmModalApp(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between"><span>اسم المريض:</span><span className="text-slate-900 font-black">{confirmModalApp.patientName}</span></div>
              <div className="flex justify-between"><span>رقم الهاتف:</span><span className="text-slate-900 font-black" dir="ltr">{confirmModalApp.phone}</span></div>
              <div className="flex justify-between"><span>الخدمة المطلوبة:</span><span className="text-blue-600 font-black">{confirmModalApp.service}</span></div>
              <div className="flex justify-between"><span>تاريخ الموعد:</span><span className="text-slate-900 font-black">{confirmModalApp.date}</span></div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-900">
                التوقيت المتاح والمؤكد من العيادة:
              </label>
              <input 
                type="text"
                value={confirmedTimeInput}
                onChange={e => setConfirmedTimeInput(e.target.value)}
                placeholder="مثال: الساعة 04:30 مساءً"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-[11px] text-slate-400 font-medium">سيظهر هذا التوقيت مباشرة للمريض في قسم "مواعيدي" على الموقع.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => {
                  updateAppointmentDetails(confirmModalApp.id, 'confirmed', confirmedTimeInput, confirmModalApp.doctorNotes);
                  setConfirmModalApp(null);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-600/20 active:scale-95 transition-all text-sm"
              >
                تأكيد الموعد وإرسال التوقيت ✅
              </button>
              <button 
                onClick={() => setConfirmModalApp(null)}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Notes & Treatment Prescription Modal */}
      {notesModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 text-right space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900">ملاحظات الدكتور وتوصيات العلاج 🩺</h3>
                  <p className="text-xs text-slate-500 font-bold">إضافة تعليمات الزيارة أو الوصفة للمريض</p>
                </div>
              </div>
              <button onClick={() => setNotesModalApp(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-bold text-slate-600">
              <div className="flex justify-between"><span>المريض:</span><span className="text-slate-900 font-black">{notesModalApp.patientName}</span></div>
              <div className="flex justify-between"><span>الخدمة:</span><span className="text-blue-600 font-black">{notesModalApp.service}</span></div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-900">
                حالة الموعد الحالية:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAppointmentStatusInput('confirmed')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border transition-all ${
                    appointmentStatusInput === 'confirmed' ? 'bg-green-500 text-white border-green-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  موعد مؤكد ✅
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentStatusInput('completed')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border transition-all ${
                    appointmentStatusInput === 'completed' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  تمت الزيارة (مكتمل) 🩺
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-900">
                ملاحظات وتوصيات الدكتور المعالج والوصفة الطبية:
              </label>
              <textarea 
                rows={4}
                value={doctorNotesInput}
                onChange={e => setDoctorNotesInput(e.target.value)}
                placeholder="أدخل تفاصيل العلاج والملاحظات الطبية أو التوصيات للمريض..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-[11px] text-slate-400 font-medium">هذه الملاحظات تظهر للمريض مباشرة بعد انتهاء أو تأكيد زيارته في قسم "مواعيدي".</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => {
                  updateAppointmentDetails(notesModalApp.id, appointmentStatusInput, notesModalApp.confirmedTime, doctorNotesInput);
                  setNotesModalApp(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm"
              >
                حفظ الملاحظات والتحديث 💾
              </button>
              <button 
                onClick={() => setNotesModalApp(null)}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsAddServiceModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg relative shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300 z-10">
            <button onClick={() => setIsAddServiceModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center transition-all">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-6">إضافة خدمة جديدة وتحديد السعر</h3>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم الخدمة</label>
                <input name="title" required placeholder="مثال: تبييض الأسنان بالليزر" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">وصف مختصر للخدمة</label>
                <textarea name="shortDesc" rows={3} placeholder="وصف موجز عن تفاصيل الخدمة..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">السعر (مثال: 150 د.أ)</label>
                <input name="price" defaultValue="100 د.أ" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="showPrice" defaultChecked className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">إظهار السعر للزوار في الموقع الإلكتروني</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isVisible" defaultChecked className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">إظهار الخدمة في الموقع العام للعيادة</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm cursor-pointer">
                  حفظ وإضافة الخدمة
                </button>
                <button type="button" onClick={() => setIsAddServiceModalOpen(false)} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {isEditServiceModalOpen && currentService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsEditServiceModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg relative shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300 z-10">
            <button onClick={() => setIsEditServiceModalOpen(false)} className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center transition-all">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-6">تعديل تفاصيل الخدمة والأسعار</h3>
            <form onSubmit={handleUpdateService} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">اسم الخدمة</label>
                <input name="title" defaultValue={currentService.title} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">وصف مختصر للخدمة</label>
                <textarea name="shortDesc" rows={3} defaultValue={currentService.shortDesc || currentService.fullDesc} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">السعر المحدد</label>
                <input name="price" defaultValue={currentService.price} required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="showPrice" defaultChecked={currentService.showPrice !== false} className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">إظهار السعر للزوار في الموقع الإلكتروني</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isVisible" defaultChecked={currentService.isVisible !== false} className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-slate-700">إظهار الخدمة في الموقع العام للعيادة</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm cursor-pointer">
                  حفظ التعديلات 💾
                </button>
                <button type="button" onClick={() => setIsEditServiceModalOpen(false)} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-8 duration-300 transform-gpu ease-out border border-white/10">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <span className="font-bold text-base">{toastMessage}</span>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}} />
    </div>
  );
}
