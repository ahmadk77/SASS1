import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, UserCheck, CheckCircle2, XCircle, 
  Save, LogOut, Lock, Mail, FileText, Stethoscope, 
  AlertCircle, Search, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import { getDayOfWeekName, generateAvailableSlots } from '../../utils/doctorSlotGenerator';

interface DoctorPortalProps {
  tenant?: any;
  doctorSession?: any;
  onLogout?: () => void;
  onOpenSite?: () => void;
  onDoctorUpdate?: (updatedDoctor: any) => void;
}

const DAYS_OF_WEEK = [
  { id: 'Sunday', label: 'الأحد' },
  { id: 'Monday', label: 'الإثنين' },
  { id: 'Tuesday', label: 'الثلاثاء' },
  { id: 'Wednesday', label: 'الأربعاء' },
  { id: 'Thursday', label: 'الخميس' },
  { id: 'Friday', label: 'الجمعة' },
  { id: 'Saturday', label: 'السبت' },
];

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  tenant,
  doctorSession: initialDoctorSession,
  onLogout,
  onOpenSite,
  onDoctorUpdate
}) => {
  // Auth state
  const [doctorSession, setDoctorSession] = useState<any>(() => {
    if (initialDoctorSession) return initialDoctorSession;
    try {
      const saved = localStorage.getItem('doctor_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (initialDoctorSession) {
      setDoctorSession(initialDoctorSession);
    }
  }, [initialDoctorSession]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab: 'appointments' | 'schedule' | 'profile'
  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'profile'>('appointments');

  // Profile State
  const [profileName, setProfileName] = useState(doctorSession?.name || '');
  const [profileSpecialty, setProfileSpecialty] = useState(doctorSession?.specialty || '');
  const [profileDegree, setProfileDegree] = useState(doctorSession?.degree || '');
  const [profileEmail, setProfileEmail] = useState(doctorSession?.email || '');
  const [profilePhone, setProfilePhone] = useState(doctorSession?.phone || '');
  const [profileBio, setProfileBio] = useState(doctorSession?.bio || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileImage, setProfileImage] = useState(doctorSession?.image || doctorSession?.photo || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile fields whenever doctorSession updates
  useEffect(() => {
    if (doctorSession) {
      setProfileName(doctorSession.name || '');
      setProfileSpecialty(doctorSession.specialty || '');
      setProfileDegree(doctorSession.degree || '');
      setProfileEmail(doctorSession.email || '');
      setProfilePhone(doctorSession.phone || '');
      setProfileBio(doctorSession.bio || '');
      setProfileImage(doctorSession.image || doctorSession.photo || '');
    }
  }, [doctorSession]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const docId = doctorSession?.doctorId || doctorSession?.id;
      const updatedDoctor = {
        ...doctorSession,
        name: profileName,
        specialty: profileSpecialty,
        degree: profileDegree,
        email: profileEmail,
        phone: profilePhone,
        bio: profileBio,
        image: profileImage,
        ...(profilePassword ? { password: profilePassword } : {})
      };

      if (docId) {
        try {
          await fetch(`/api/tenant/${tenantId}/doctor/${docId}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: profileName,
              specialty: profileSpecialty,
              degree: profileDegree,
              email: profileEmail,
              phone: profilePhone,
              bio: profileBio,
              password: profilePassword || undefined,
              image: profileImage
            })
          });
        } catch (e) {
          console.log('Doctor API sync note:', e);
        }
      }

      setDoctorSession(updatedDoctor);
      localStorage.setItem('doctor_session', JSON.stringify(updatedDoctor));
      
      if (onDoctorUpdate) {
        onDoctorUpdate(updatedDoctor);
      }

      showToast('تم تحديث الملف الشخصي والصورة الشخصية بنجاح ✅');
      setProfilePassword('');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الملف الشخصي');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Appointments State
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Schedule State (My Schedule)
  const [schedules, setSchedules] = useState<Record<string, { startTime: string; endTime: string; slotDurationMinutes: number; isAvailable: boolean }>>({
    Sunday: { startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    Monday: { startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    Tuesday: { startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    Wednesday: { startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    Thursday: { startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    Friday: { startTime: '09:00', endTime: '14:00', slotDurationMinutes: 30, isAvailable: false },
    Saturday: { startTime: '10:00', endTime: '16:00', slotDurationMinutes: 30, isAvailable: true },
  });

  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tenantId = tenant?.id || doctorSession?.tenantId || 1;

  // Trigger Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/public/dental/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          tenantId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تسجيل الدخول للطبيب');
      }

      setDoctorSession(data.doctor);
      localStorage.setItem('doctor_session', JSON.stringify(data.doctor));
      showToast(`مرحباً د. ${data.doctor.name} 👋`);
    } catch (err: any) {
      setLoginError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setDoctorSession(null);
    localStorage.removeItem('doctor_session');
    if (onLogout) onLogout();
  };

  // Fetch Doctor's Isolated Appointments
  const fetchDoctorAppointments = async () => {
    if (!doctorSession?.doctorId) return;
    setIsLoadingAppointments(true);

    try {
      const res = await fetch(`/api/tenant/${doctorSession.tenantId || tenantId}/doctor/${doctorSession.doctorId}/appointments`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Fetch Doctor's Schedule
  const fetchDoctorSchedule = async () => {
    if (!doctorSession?.doctorId) return;

    try {
      const res = await fetch(`/api/tenant/${doctorSession.tenantId || tenantId}/doctor/${doctorSession.doctorId}/availability`);
      if (res.ok) {
        const data = await res.json();
        if (data.schedule && Array.isArray(data.schedule) && data.schedule.length > 0) {
          const map: Record<string, any> = { ...schedules };
          data.schedule.forEach((item: any) => {
            if (item.dayOfWeek) {
              map[item.dayOfWeek] = {
                startTime: item.startTime || '09:00',
                endTime: item.endTime || '17:00',
                slotDurationMinutes: item.slotDurationMinutes || 30,
                isAvailable: item.isAvailable !== false
              };
            }
          });
          setSchedules(map);
        }
      }
    } catch (err) {
      console.error('Error fetching doctor schedule:', err);
    }
  };

  useEffect(() => {
    if (doctorSession?.doctorId) {
      fetchDoctorAppointments();
      fetchDoctorSchedule();
    }
  }, [doctorSession]);

  // Update Appointment Status or Notes
  const updateAppointment = async (appId: number, updateData: { status?: string; doctorNotes?: string }) => {
    try {
      const res = await fetch(`/api/tenant/${doctorSession.tenantId || tenantId}/doctor/${doctorSession.doctorId}/appointments/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        showToast('تم تحديث حالة الموعد بنجاح ✅');
        fetchDoctorAppointments();
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  // Save Doctor Schedule
  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const formattedSchedules = Object.keys(schedules).map(day => ({
        dayOfWeek: day,
        startTime: schedules[day].startTime,
        endTime: schedules[day].endTime,
        slotDurationMinutes: schedules[day].slotDurationMinutes,
        isAvailable: schedules[day].isAvailable
      }));

      const res = await fetch(`/api/tenant/${doctorSession.tenantId || tenantId}/doctor/${doctorSession.doctorId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: formattedSchedules })
      });

      if (res.ok) {
        showToast('تم حفظ أوقات العمل والجدول بنجاح ✅');
      } else {
        throw new Error('فشل الحفظ');
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      showToast('حدث خطأ أثناء حفظ الجدول');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Filtered Appointments list
  const filteredAppointments = appointments.filter(app => {
    const matchesQuery = !searchQuery || 
      (app.patientName && app.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.phone && app.phone.includes(searchQuery)) ||
      (app.service && app.service.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  // Render Login Form if Doctor is not authenticated
  if (!doctorSession) {
    return (
      <div className="w-full min-h-[500px] py-12 px-4 bg-slate-50 flex items-center justify-center dir-rtl text-right" dir="rtl">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500"></div>

          <div className="text-center mb-8 pt-2">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
              <Stethoscope size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">بوابة الأطباء 🩺</h1>
            <p className="text-slate-500 text-xs font-semibold">
              تسجيل دخول كادر عيادة الأسنان لمتابعة المواعيد والجدول
            </p>
          </div>

          {loginError && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-blue-600" />
                البريد الإلكتروني للطبيب
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all dir-ltr text-left"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock size={14} className="text-blue-600" />
                كلمة المرور
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all dir-ltr text-left"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-6"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> جاري التحقق...
                </>
              ) : (
                <>
                  الدخول للبوابة الطبية <ChevronRight size={18} className="rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-semibold">
              مخصص للأطباء المعينين بجدول العيادة فقط. البيانات معزولة بدقة.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 text-slate-900 font-sans dir-rtl text-right" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Doctor Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-blue-600/20 overflow-hidden shrink-0">
              {doctorSession?.image || doctorSession?.photo ? (
                <img src={doctorSession.image || doctorSession.photo} alt={doctorSession.name} className="w-full h-full object-cover" />
              ) : (
                <Stethoscope size={24} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">د. {doctorSession?.name}</h1>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                  طبيب معتمد
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                {doctorSession?.specialty || 'استشاري طب وجراحة الأسنان'} {doctorSession?.degree ? `(${doctorSession.degree})` : ''} • {tenant?.name || 'العيادة الطبية'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenSite && (
              <button
                type="button"
                onClick={onOpenSite}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>الدخول للموقع 🌐</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={16} /> خروج
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-slate-100 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-6 py-3 text-sm font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar size={18} />
            <span>مواعيدي المباشرة ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 text-sm font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={18} />
            <span>إدارة دوامي وجدولي الأسبوعي</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 text-sm font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck size={18} />
            <span>الملف الشخصي والصورة الشخصية</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: MY APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={18} className="absolute right-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المريض أو رقم الهاتف..."
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-black text-slate-500 whitespace-nowrap">تصفية حسب الحالة:</span>
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'pending', label: 'بانتظار التأكيد' },
                  { id: 'confirmed', label: 'مؤكد' },
                  { id: 'completed', label: 'مكتمل' },
                  { id: 'cancelled', label: 'ملغي' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === st.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}

                <button
                  onClick={fetchDoctorAppointments}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all shrink-0 cursor-pointer"
                  title="تحديث القائمة"
                >
                  <RefreshCw size={16} className={isLoadingAppointments ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Appointments Grid */}
            {isLoadingAppointments ? (
              <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
                <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">جاري جلب قائمة المواعيد الخاصة بك...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-slate-200">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">لا توجد مواعيد مسجلة حالياً</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  عندما يحجز المرضى موعداً معك تحديداً، ستظهر المواعيد هنا بشكل معزول ومباشر.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAppointments.map((app) => (
                  <div key={app.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      {/* Top status */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[11px] font-black px-3 py-1 rounded-full border ${
                          app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          app.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {app.status === 'confirmed' ? 'مؤكد ✅' :
                           app.status === 'completed' ? 'تم الفحص (مكتمل) 🩺' :
                           app.status === 'cancelled' ? 'ملغي ❌' : 'قيد الانتظار ⏳'}
                        </span>

                        <span className="text-[11px] text-slate-400 font-bold">#{app.id}</span>
                      </div>

                      {/* Patient Info */}
                      <div className="mb-4">
                        <h4 className="text-base font-black text-slate-900 mb-1">{app.patientName}</h4>
                        <p className="text-xs text-slate-500 font-bold dir-ltr text-right">{app.phone}</p>
                      </div>

                      {/* Service & Time */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 mb-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Stethoscope size={15} className="text-blue-600 shrink-0" />
                          <span className="truncate">{app.service || 'كشفية أسنان'}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {app.date}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {app.confirmedTime || app.time}</span>
                        </div>
                      </div>

                      {/* Doctor Notes Box */}
                      <div className="mb-4">
                        <label className="block text-[11px] font-black text-slate-500 mb-1 flex items-center gap-1">
                          <FileText size={12} /> ملاحظات الطبيب / التشخيص:
                        </label>
                        {editingNotesId === app.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="أدخل ملاحظات المعاينة والعلاج..."
                              className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-blue-400 rounded-xl outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  updateAppointment(app.id, { doctorNotes: tempNotes });
                                  setEditingNotesId(null);
                                }}
                                className="bg-blue-600 text-white text-[11px] font-black px-3 py-1 rounded-lg hover:bg-blue-700"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="bg-slate-200 text-slate-700 text-[11px] font-black px-3 py-1 rounded-lg hover:bg-slate-300"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotesId(app.id);
                              setTempNotes(app.doctorNotes || '');
                            }}
                            className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 cursor-pointer min-h-[42px]"
                          >
                            {app.doctorNotes ? app.doctorNotes : <span className="text-slate-400 text-[11px]">اضغط لإضافة ملاحظات أو تشخيص...</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      {app.status !== 'confirmed' && (
                        <button
                          onClick={() => updateAppointment(app.id, { status: 'confirmed' })}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={14} /> تأكيد
                        </button>
                      )}

                      {app.status !== 'completed' && (
                        <button
                          onClick={() => updateAppointment(app.id, { status: 'completed' })}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <UserCheck size={14} /> مكتمل
                        </button>
                      )}

                      {app.status !== 'cancelled' && (
                        <button
                          onClick={() => updateAppointment(app.id, { status: 'cancelled' })}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="إلغاء الموعد"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY SCHEDULE (DOAM MANAGEMENT) */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                  <Clock className="text-blue-600" size={24} />
                  إدارة جدول الدوام والأوقات المتاحة
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  حدد أوقات بدء وانتهاء العمل بكل يوم، بالإضافة لمدّة الكشفية بالأقسام ليقوم النظام بتوليد الحجوزات المتاحة تلقائياً للمرضى.
                </p>
              </div>

              <button
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                {isSavingSchedule ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                <span>حفظ الجدول الأسبوعي</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayConfig = schedules[day.id] || { startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true };

                return (
                  <div
                    key={day.id}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      dayConfig.isAvailable
                        ? 'bg-slate-50/80 border-slate-200'
                        : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={dayConfig.isAvailable}
                          onChange={(e) => {
                            setSchedules({
                              ...schedules,
                              [day.id]: { ...dayConfig, isAvailable: e.target.checked }
                            });
                          }}
                          className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                        />
                        <span className="font-black text-base text-slate-900">{day.label} ({day.id})</span>
                      </div>

                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                        dayConfig.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {dayConfig.isAvailable ? 'يوم عمل متاح 🟢' : 'عطلة / غير متاح 🔴'}
                      </span>
                    </div>

                    {dayConfig.isAvailable && (
                      <div className="grid grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">وقت البدء</label>
                          <input
                            type="time"
                            value={dayConfig.startTime}
                            onChange={(e) => {
                              setSchedules({
                                ...schedules,
                                [day.id]: { ...dayConfig, startTime: e.target.value }
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">وقت الانتهاء</label>
                          <input
                            type="time"
                            value={dayConfig.endTime}
                            onChange={(e) => {
                              setSchedules({
                                ...schedules,
                                [day.id]: { ...dayConfig, endTime: e.target.value }
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">مدة الجلسة (د)</label>
                          <select
                            value={dayConfig.slotDurationMinutes}
                            onChange={(e) => {
                              setSchedules({
                                ...schedules,
                                [day.id]: { ...dayConfig, slotDurationMinutes: parseInt(e.target.value, 10) }
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                          >
                            <option value={15}>15 دقيقة</option>
                            <option value={20}>20 دقيقة</option>
                            <option value={30}>30 دقيقة</option>
                            <option value={45}>45 دقيقة</option>
                            <option value={60}>60 دقيقة</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE & PHOTO MANAGEMENT */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-100 pb-6">
              <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                <UserCheck className="text-blue-600" size={24} />
                الملف الشخصي وإدارة الصورة الشخصية
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                يمكنك تحديث صورتك الشخصية من معرض جهازك، أو تعديل معلوماتك المهنية وكلمة المرور الخاصة ببوابتك.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Photo Upload & Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="relative w-28 h-28 rounded-3xl bg-blue-100 border-2 border-blue-300 overflow-hidden shadow-md flex items-center justify-center shrink-0">
                  {profileImage ? (
                    <img src={profileImage} alt={profileName} className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope size={40} className="text-blue-600" />
                  )}
                </div>

                <div className="flex-1 space-y-3 text-center sm:text-right w-full">
                  <h4 className="font-black text-sm text-slate-900">الصورة الشخصية للطبيب</h4>
                  <p className="text-xs text-slate-500">اختر صورة واضحة من معرض الصور بجهازك (PNG, JPG)</p>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95">
                      <span>اختيار صورة جديدة من الجهاز 📁</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>

                    {profileImage && (
                      <button
                        type="button"
                        onClick={() => setProfileImage('')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
                      >
                        إزالة الصورة 🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">اسم الطبيب</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">التخصص</label>
                  <input
                    type="text"
                    required
                    value={profileSpecialty}
                    onChange={(e) => setProfileSpecialty(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">الدرجة العلمية</label>
                  <input
                    type="text"
                    value={profileDegree}
                    onChange={(e) => setProfileDegree(e.target.value)}
                    placeholder="استشاري / أخصائي"
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">البريد الإلكتروني للدخول</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0791234567"
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all dir-ltr text-right"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1">نبذة عن الطبيب والخبرات</label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="اكتب نبذة عن خبراتك وشهاداتك الطبية..."
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1">كلمة المرور الجديدة (اختياري)</label>
                  <input
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="اتركه فارغاً إن لم ترد تغيير كلمة المرور"
                    className="w-full border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all dir-ltr text-left"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {isSavingProfile ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                <span>حفظ التعديلات وتحديث الملف الشخصي</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
