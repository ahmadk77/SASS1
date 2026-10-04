import React, { useState, useEffect } from 'react';
import { 
  Calendar, Phone, MapPin, Clock, ShieldCheck, 
  Star, Activity, CheckCircle2, ChevronLeft, 
  Menu, X, Sparkles, Users, Award, ChevronDown,
  MessageCircle, Quote, Play, Info, ArrowLeft, ArrowUpRight,
  CalendarCheck, Search, RefreshCw, Edit, FileText, Stethoscope, AlertCircle
} from 'lucide-react';
import { generateAvailableSlots, getDayOfWeekName } from '../utils/doctorSlotGenerator';

export default function DentalClinic({ tenant, content }: { tenant?: any; content?: any }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [infoModalContent, setInfoModalContent] = useState<any>(null);
  
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

  const availableSlots: string[] = (content?.availableSlots && Array.isArray(content.availableSlots) && content.availableSlots.length > 0)
    ? content.availableSlots
    : defaultSlotsList;

  const todayStr = new Date().toISOString().split('T')[0];

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [bookingData, setBookingData] = useState({ 
    name: '', 
    phone: '', 
    serviceId: '', 
    doctorId: '',
    date: todayStr,
    time: availableSlots[0] || '09:00 AM - 10:00 AM'
  });
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // All clinic appointments for conflict checking (تحديد التعارض)
  const [allClinicAppointments, setAllClinicAppointments] = useState<any[]>([]);

  const fetchAllClinicAppointments = async () => {
    const subdomain = tenant?.subdomain || tenant?.customDomain || tenant?.id || 'demo';
    try {
      const res = await fetch(`/api/public/websites/${subdomain}/dental/appointments`);
      if (res.ok) {
        const data = await res.json();
        const direct = (data.directAppointments || []).map((d: any) => ({
          id: `dir-${d.id}`,
          date: d.date || (d.createdAt ? d.createdAt.split('T')[0] : todayStr),
          time: d.time || '10:00 AM',
          confirmedTime: d.confirmedTime || d.time,
          status: d.status
        }));
        const orders = (data.orderAppointments || []).map((ord: any) => ({
          id: `ord-${ord.id}`,
          date: ord.details?.date || (ord.createdAt ? ord.createdAt.split('T')[0] : todayStr),
          time: ord.details?.time || ord.details?.confirmedTime || '10:00 AM',
          confirmedTime: ord.details?.confirmedTime || ord.details?.time,
          status: ord.status
        }));
        setAllClinicAppointments([...direct, ...orders]);
      }
    } catch (err) {
      console.error('Error fetching all clinic appointments:', err);
    }
  };

  useEffect(() => {
    fetchAllClinicAppointments();
  }, [tenant]);

  const isSlotBooked = (dateStr: string, slotStr: string) => {
    if (!dateStr || !slotStr) return false;
    return allClinicAppointments.some(app => {
      if (app.status === 'cancelled' || app.status === 'deleted') return false;
      const appDate = app.date || (app.createdAt ? app.createdAt.split('T')[0] : '');
      if (appDate !== dateStr) return false;

      const t1 = (app.confirmedTime || app.time || '').trim().toLowerCase();
      const t2 = slotStr.trim().toLowerCase();
      if (!t1) return false;

      return t1 === t2 || t1.includes(t2) || t2.includes(t1);
    });
  };

  const calculatedSlots = React.useMemo(() => {
    const dayOfWeek = getDayOfWeekName(bookingData.date);
    return generateAvailableSlots(
      bookingData.date,
      { dayOfWeek, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
      allClinicAppointments
    );
  }, [bookingData.date, bookingData.doctorId, allClinicAppointments]);

  // My Appointments (قسم مواعيدي) State
  const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(false);
  const [patientSearchPhone, setPatientSearchPhone] = useState(() => {
    try {
      return localStorage.getItem('dental_patient_phone') || '';
    } catch {
      return '';
    }
  });
  const [myAppointmentsList, setMyAppointmentsList] = useState<any[]>([]);
  const [isLoadingMyAppointments, setIsLoadingMyAppointments] = useState(false);

  const fetchPatientAppointments = async (phoneToSearch?: string) => {
    const targetPhone = (phoneToSearch !== undefined ? phoneToSearch : patientSearchPhone).trim();
    setIsLoadingMyAppointments(true);
    const subdomain = tenant?.subdomain || tenant?.customDomain || tenant?.id || 'demo';
    
    try {
      const res = await fetch(`/api/public/websites/${subdomain}/dental/appointments${targetPhone ? `?phone=${encodeURIComponent(targetPhone)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        const direct = (data.directAppointments || []).map((d: any) => ({
          id: `dir-${d.id}`,
          patientName: d.patientName || d.customerName || 'مريض',
          phone: d.phone || d.customerPhone || '---',
          service: d.service || 'كشفية أسنان',
          doctor: d.doctor || 'طبيب العيادة',
          date: d.date || (d.createdAt ? d.createdAt.split('T')[0] : todayStr),
          time: d.time || '10:00 AM',
          confirmedTime: d.confirmedTime || d.time || '10:00 AM',
          doctorNotes: d.doctorNotes || '',
          status: d.status || 'pending',
          createdAt: d.createdAt
        }));

        const orders = (data.orderAppointments || []).map((ord: any) => ({
          id: `ord-${ord.id}`,
          patientName: ord.customerName || 'مريض',
          phone: ord.customerPhone || '---',
          service: ord.details?.serviceName || ord.details?.service || 'كشفية أسنان',
          doctor: ord.details?.doctorName || ord.details?.doctor || 'طبيب العيادة',
          date: ord.details?.date || (ord.createdAt ? ord.createdAt.split('T')[0] : todayStr),
          time: ord.details?.time || '10:00 AM',
          confirmedTime: ord.details?.confirmedTime || ord.details?.time || '10:00 AM',
          doctorNotes: ord.details?.doctorNotes || '',
          status: ord.status === 'completed' ? 'completed' : (ord.status === 'confirmed' ? 'confirmed' : (ord.status === 'cancelled' || ord.status === 'deleted' ? 'cancelled' : 'pending')),
          createdAt: ord.createdAt
        }));

        const mergedMap = new Map();
        for (const item of [...direct, ...orders]) {
          mergedMap.set(item.id, item);
        }

        const combinedList = Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setMyAppointmentsList(combinedList);
      }
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
    } finally {
      setIsLoadingMyAppointments(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const defaultServices = [
    { 
      id: 1, 
      title: 'زراعة الأسنان', 
      shortDesc: 'تقنية ألمانية مضمونة مدى الحياة لاستعادة ابتسامتك.',
      fullDesc: 'نستخدم في إيليت دينتال أحدث أنظمة زراعة الأسنان الألمانية والسويسرية التي تضمن لك ثباتاً عالياً وعمراً طويلاً. تتم العملية تحت تخدير موضعي وبدون ألم، مع استخدام التصوير ثلاثي الأبعاد لضمان الدقة المتناهية.',
      features: ['تخطيط رقمي ثلاثي الأبعاد', 'زراعة فورية في بعض الحالات', 'تيجان من الزيركون عالي الشفافية', 'ضمان مدى الحياة'],
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80'
    },
    { 
      id: 2, 
      title: 'ابتسامة هوليود', 
      shortDesc: 'تصميم ابتسامة رقمية باستخدام قشور الفينير فائقة الرقة.',
      fullDesc: 'قم بتغيير شكل ولون أسنانك جذرياً من خلال قشور الفينير أو اللومينير. نقوم بتصميم ابتسامتك رقمياً قبل البدء لترى النتيجة النهائية، ونصمم القشور لتتناسب مع ملامح وجهك ولون بشرتك.',
      features: ['قشور فينير إيماكس (E-max)', 'تصميم الابتسامة الرقمي (DSD)', 'بدون برد للأسنان (في حالة اللومينير)', 'نتائج طبيعية ومشرقة'],
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80'
    },
    { 
      id: 3, 
      title: 'تقويم الأسنان', 
      shortDesc: 'تقويم شفاف ومعدني لأسنان مستقيمة وإطباق سليم.',
      fullDesc: 'عالج بروز أو تزاحم الأسنان واحصل على اصطفاف مثالي. نوفر أحدث أنواع التقويم بما فيها التقويم الشفاف (Invisalign) الذي يمنحك راحة ومظهراً غير مرئي أثناء فترة العلاج.',
      features: ['تقويم شفاف (إنفزلاين)', 'تقويم معدني وخزفي', 'متابعة دورية دقيقة', 'أقساط ميسرة للعلاج'],
      image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80'
    },
    { 
      id: 4, 
      title: 'تبييض الأسنان بالليزر', 
      shortDesc: 'جلسات تبييض آمنة لابتسامة ناصعة البياض في 45 دقيقة.',
      fullDesc: 'تخلص من التصبغات واصفرار الأسنان الناتج عن القهوة والتدخين من خلال جهاز زووم (Zoom) المتطور. علاج آمن لا يسبب حساسية ونتائجه فورية تدوم طويلاً.',
      features: ['تفتيح حتى 8 درجات', 'جلسة واحدة فقط (45 دقيقة)', 'مواد آمنة على طبقة المينا', 'علاج مضاد للحساسية بعد التبييض'],
      image: 'https://images.unsplash.com/photo-1570161463870-826be5c065f4?auto=format&fit=crop&w=800&q=80'
    },
  ];

  const defaultDoctors = [
    { id: 1, name: 'د. سارة محمد', specialty: 'استشارية تجميل الأسنان', degree: 'البورد الأمريكي في تجميل الأسنان', experience: '+12 سنة', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80' },
    { id: 2, name: 'د. أحمد خالد', specialty: 'استشاري جراحة وزراعة الفكين', degree: 'الزمالة البريطانية للزراعة', experience: '+18 سنة', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80' },
    { id: 3, name: 'د. ريم العبدالله', specialty: 'أخصائية تقويم الأسنان', degree: 'ماجستير تقويم الأسنان والفكين', experience: '+9 سنوات', image: 'https://images.unsplash.com/photo-1594824436951-7f12bc556488?auto=format&fit=crop&w=500&q=80' },
  ];

  const services = Array.isArray(content?.services) ? content.services : defaultServices;
  const doctors = Array.isArray(content?.doctors) ? content.doctors : defaultDoctors;
  const clinicName = content?.clinicName || content?.businessName || content?.siteName || tenant?.name || 'عيادة الأسنان المتقدمة';
  const clinicPhone = content?.clinicPhone || content?.phone || '+962 7 0000 0000';

  const faqs = [
    { question: 'هل عملية زراعة الأسنان مؤلمة؟', answer: 'على الإطلاق. تتم عملية الزراعة تحت تأثير التخدير الموضعي، ومعظم مرضانا يفيدون بأنهم لم يشعروا بأي ألم يذكر خلال الإجراء. كما نصف لك مسكنات خفيفة بعد العملية لضمان راحتك التامة.' },
    { question: 'كم تستغرق جلسة تبييض الأسنان بالليزر؟', answer: 'تستغرق الجلسة الواحدة حوالي 45 إلى 60 دقيقة فقط في العيادة، وستلاحظ الفرق الشاسع وتفتيح لون أسنانك بعد انتهاء الجلسة مباشرة.' },
    { question: 'ما هو الفرق بين الفينير واللومينير؟', answer: 'الفينير يتطلب إزالة طبقة رقيقة جداً (أقل من مليمتر) من مينا السن لضمان ثباته، بينما اللومينير هو قشور فائقة الرقة يتم لصقها مباشرة على السن دون الحاجة لبرده في معظم الحالات. طبيبنا سيحدد الأنسب لحالتك.' },
    { question: 'هل تقبلون الدفع بالتقسيط؟', answer: 'نعم، نحن نقدم خطط دفع مرنة وميسرة بالتعاون مع عدة بنوك وشركات تمويل لتسهيل حصولك على الابتسامة التي تتمناها دون عبء مالي.' },
  ];

  const initialTestimonials = [
    { name: 'خالد عبدالله', text: 'تجربتي مع زراعة الأسنان هنا كانت استثنائية. لم أشعر بأي ألم والفريق الطبي في قمة الاحترافية.', rating: 5, date: 'قبل أسبوع' },
    { name: 'ليلى منصور', text: 'صممت ابتسامتي (هوليود سمايل) مع د. سارة والنتيجة فاقت توقعاتي! الابتسامة طبيعية جداً.', rating: 5, date: 'قبل أسبوعين' },
    { name: 'عمر القاضي', text: 'عيادة راقية جداً، اهتمام بالنظافة والتعقيم، والمواعيد دقيقة جداً. أوصي بهم بشدة لأي شخص يبحث عن الجودة.', rating: 5, date: 'قبل شهر' },
  ];

  const [testimonials, setTestimonials] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`dental_clinic_reviews_${tenant?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return content?.testimonials || initialTestimonials;
  });

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewText.trim()) return;
    setIsSubmittingReview(true);

    const newEntry = {
      name: newReviewName.trim(),
      text: newReviewText.trim(),
      rating: newReviewRating,
      date: 'الآن'
    };

    const updated = [newEntry, ...testimonials];
    setTestimonials(updated);
    try {
      localStorage.setItem(`dental_clinic_reviews_${tenant?.id || 'default'}`, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewReviewName('');
    setNewReviewText('');
    setNewReviewRating(5);
    setIsSubmittingReview(false);
    setShowReviewForm(false);
    setReviewSuccessMsg(true);
    setTimeout(() => setReviewSuccessMsg(false), 4000);
  };

  const openBookingForService = (serviceId: any) => {
    setBookingData(prev => ({ ...prev, serviceId: String(serviceId), doctorId: '' }));
    setSelectedService(null);
    setIsBookingModalOpen(true);
  };

  const openBookingForDoctor = (doctorId: any) => {
    setBookingData(prev => ({ ...prev, doctorId: String(doctorId), serviceId: '' }));
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subdomain = tenant?.subdomain || tenant?.customDomain || tenant?.id || 'demo';
    const tenantId = tenant?.id;

    const selectedServiceObj = services.find((s: any) => String(s.id) === String(bookingData.serviceId));
    const selectedDoctorObj = doctors.find((d: any) => String(d.id) === String(bookingData.doctorId));
    const serviceTitle = selectedServiceObj ? selectedServiceObj.title || selectedServiceObj.name : 'خدمة أسنان';
    const doctorName = selectedDoctorObj ? selectedDoctorObj.name : 'طبيب العيادة';

    // 1. Send public order/booking request
    try {
      await fetch(`/api/public/websites/${subdomain}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: bookingData.name,
          customerPhone: bookingData.phone,
          type: 'appointment',
          details: {
            serviceId: bookingData.serviceId,
            doctorId: bookingData.doctorId,
            serviceName: serviceTitle,
            doctorName: doctorName,
            date: bookingData.date || todayStr,
            time: bookingData.time || '09:00 AM - 10:00 AM'
          }
        })
      });
    } catch (err) {
      console.error('Error submitting public order:', err);
    }

    // 2. Direct tenant appointment backend endpoint
    if (tenantId) {
      try {
        await fetch(`/api/tenant/${tenantId}/dental/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName: bookingData.name,
            phone: bookingData.phone,
            serviceId: bookingData.serviceId,
            doctorId: bookingData.doctorId,
            service: serviceTitle,
            doctor: doctorName,
            date: bookingData.date || todayStr,
            time: bookingData.time || '09:00 AM - 10:00 AM',
            status: 'pending'
          })
        });
      } catch (err) {
        console.error('Error submitting appointment:', err);
      }
    }

    try {
      localStorage.setItem('dental_patient_phone', bookingData.phone);
      localStorage.setItem('dental_patient_name', bookingData.name);
    } catch (e) {}
    setPatientSearchPhone(bookingData.phone);

    setIsBookingModalOpen(false);
    setShowSuccessMessage(true);
    fetchPatientAppointments(bookingData.phone);
    setBookingData({ name: '', phone: '', serviceId: '', doctorId: '' });
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const showPrivacyPolicy = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoModalContent({
      title: 'سياسة الخصوصية',
      content: `نحن في ${clinicName} نلتزم بحماية خصوصية بياناتك الطبية والشخصية. يتم تخزين جميع معلوماتك ومعالجاتك في أنظمة آمنة ومشفرة، ولا يتم مشاركتها مع أي طرف ثالث إلا بموافقتك الصريحة أو لأغراض التأمين الطبي الخاص بك بناءً على طلبك.`
    });
  };

  const showTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoModalContent({
      title: 'الشروط والأحكام',
      content: 'من خلال حجزك لموعد في عيادتنا، أنت توافق على الحضور في الوقت المحدد. في حال الرغبة في الإلغاء أو التأجيل، يرجى إبلاغنا قبل 24 ساعة على الأقل. تحتفظ العيادة بالحق في تعديل خطط العلاج بناءً على التقييم الطبي الدقيق بعد الفحص السريري والشعاعي.'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden" dir="rtl">
      
      {/* Top Bar - Ultra Premium */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 md:px-12 text-xs md:text-sm font-medium flex justify-between items-center z-50 relative border-b border-slate-800">
        <div className="flex items-center gap-4 md:gap-6">
          <span className="flex items-center gap-2 text-slate-400">
            <Clock size={14} className="text-blue-500" />
            <span className="hidden sm:inline">9 ص - 9 م (السبت - الخميس)</span>
          </span>
          <span className="hidden md:flex items-center gap-2 border-r border-slate-700 pr-6 text-slate-400">
            <MapPin size={14} className="text-blue-500" />
            مجمع الأعمال، عمان
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hidden sm:block hover:text-white transition-colors">مساعدة واستفسارات</a>
          <a href={`tel:${clinicPhone}`} className="flex items-center gap-2 text-white bg-blue-600/20 px-3 py-1 rounded-full hover:bg-blue-600/40 transition-colors border border-blue-500/30">
            <Phone size={12} className="text-blue-400" />
            <span dir="ltr" className="font-bold tracking-wider">{clinicPhone}</span>
          </a>
        </div>
      </div>

      {/* Navbar - Glassmorphism */}
      <nav className={`sticky top-0 z-40 transition-all duration-500 ${isScrolled ? 'bg-white/85 backdrop-blur-xl shadow-lg shadow-slate-200/20 py-3' : 'bg-white py-5'}`}>
        <div className="px-6 md:px-12 flex justify-between items-center max-w-[1400px] mx-auto">
          
          {/* Logo */}
          <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-gradient-to-br from-blue-600 to-teal-500 text-white p-2.5 rounded-xl shadow-lg shadow-blue-600/30 group-hover:shadow-blue-600/50 transition-all duration-300 group-hover:scale-105 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1s_forwards]"></div>
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{clinicName.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">{clinicName.split(' ').slice(1).join(' ') || 'دينتال'}</span></span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold -mt-0.5">رعاية سنية متقدمة</span>
            </div>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10 text-slate-600 font-bold text-sm">
            <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">الرئيسية</a>
            <a href="#services" onClick={(e) => scrollToSection(e, 'services')} className="hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">خدماتنا الحصرية</a>
            <a href="#doctors" onClick={(e) => scrollToSection(e, 'doctors')} className="hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">نخبة الأطباء</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-blue-600 transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:right-0 after:w-0 after:h-0.5 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300">عن العيادة</a>
          </div>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => {
                setIsMyAppointmentsOpen(true);
                fetchPatientAppointments();
              }}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all border border-blue-200 active:scale-95 shadow-xs cursor-pointer"
            >
              <CalendarCheck size={16} className="text-blue-600" />
              <span>مواعيدي 📅</span>
            </button>
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/20 transform hover:-translate-y-0.5 border border-slate-700 text-sm cursor-pointer"
            >
              <Calendar size={16} />
              <span>احجز استشارتك</span>
            </button>
            <button 
              className="md:hidden text-slate-900 p-2 bg-slate-100 rounded-lg cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl py-6 px-6 flex flex-col gap-2 z-40">
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsMyAppointmentsOpen(true);
                fetchPatientAppointments();
              }}
              className="w-full bg-blue-50 text-blue-600 font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-blue-200 cursor-pointer"
            >
              <CalendarCheck size={18} />
              <span>إدارة وتتبع مواعيدي 📅</span>
            </button>
            {['home', 'services', 'doctors', 'faq'].map((section) => {
              const labels: Record<string, string> = { home: 'الرئيسية', services: 'الخدمات', doctors: 'الأطباء', faq: 'الأسئلة الشائعة' };
              return (
                <a key={section} href={`#${section}`} onClick={(e) => scrollToSection(e, section)} className="text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  {labels[section]}
                </a>
              );
            })}
            <button 
              onClick={() => { setIsBookingModalOpen(true); setIsMobileMenuOpen(false); }}
              className="mt-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <Calendar size={20} /> احجز موعدك الآن
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-8 pb-12 md:pt-14 md:pb-16 px-4 md:px-12 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/70 via-white to-white pointer-events-none"></div>
        <div className="absolute top-10 right-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14 relative z-10">
          
          <div className="lg:w-1/2 space-y-6 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-800 px-4 py-2 rounded-full font-bold text-xs sm:text-sm border border-slate-200 shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              {content?.slogan || content?.heroSubtitle || 'العيادة رقم #1 في طب الأسنان التجميلي'}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              {content?.heroTitle || content?.title || content?.heading || (
                <>ابتسامة <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">تخطف الأنظار</span>، ورعاية تليق بك.</>
              )}
            </h1>
            
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              {content?.heroSubtitle || content?.subtitle || content?.slogan || 'نجمع بين دقة الفن وتطور العلوم الطبية لنقدم لك تجربة علاجية لا مثيل لها. استعد ثقتك مع فريق من النخبة وأحدث التقنيات العالمية.'}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-7 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <span>احجز استشارتك المجانية</span>
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={(e) => scrollToSection(e, 'services')}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 px-7 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 hover:border-slate-300 group cursor-pointer"
              >
                <span>تصفح خدماتنا</span>
                <div className="bg-slate-100 p-1 rounded-full group-hover:bg-slate-200 transition-colors">
                  <ArrowUpRight size={16} />
                </div>
              </button>
            </div>
          </div>

          <div className="lg:w-1/2 relative w-full max-w-md mx-auto">
            <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-100 h-[240px] sm:h-[280px]">
              <img 
                src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80" 
                alt="عيادة أسنان حديثة" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Clean summary bar below hero image */}
            <div className="mt-3.5 grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-slate-900 font-black text-xs">رعاية معتمدة</p>
                  <p className="text-slate-500 text-[10px] font-medium">أعلى معايير التعقيم</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Star size={18} fill="currentColor" />
                </div>
                <div>
                  <p className="text-slate-900 font-black text-xs">+5,000 مريض</p>
                  <p className="text-slate-500 text-[10px] font-medium">تقييم ممتاز 5.0</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-4 md:px-12 max-w-[1400px] mx-auto my-6 sm:my-8">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800/80">
            {[
              { number: '+15', label: 'سنة خبرة طبية', icon: <Award size={20} className="text-teal-400 mx-auto mb-2" /> },
              { number: '+5k', label: 'مريض سعيد', icon: <Users size={20} className="text-blue-400 mx-auto mb-2" /> },
              { number: '4', label: 'فروع متخصصة', icon: <MapPin size={20} className="text-teal-400 mx-auto mb-2" /> },
              { number: '99%', label: 'نسبة الرضا', icon: <Star size={20} className="text-blue-400 mx-auto mb-2" /> },
            ].map((stat, idx) => (
              <div key={idx} className={`text-center px-2 group ${idx > 1 ? 'pt-4 md:pt-0' : ''}`}>
                {stat.icon}
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">{stat.number}</div>
                <div className="text-slate-400 font-semibold text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 md:py-20 px-4 md:px-12 max-w-[1400px] mx-auto bg-[#F8FAFC]">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <h2 className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-700 px-3.5 py-1 rounded-full font-bold text-xs mb-3 uppercase">
            <Sparkles size={14} /> خدماتنا الحصرية
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 leading-tight">رعاية استثنائية مصممة خصيصاً لابتسامتك</h3>
          <p className="text-slate-500 text-sm sm:text-base font-medium">نقدم مجموعة متكاملة من علاجات الأسنان التجميلية والطبية بأحدث التقنيات.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service: any) => {
            if (service.isVisible === false) return null;
            return (
              <div key={service.id} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    {service.image ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                        <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
                        <Activity size={22} />
                      </div>
                    )}

                    {service.showPrice !== false && service.price && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-black text-xs border border-emerald-200/80 shrink-0">
                        {service.price}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-black text-slate-900 mb-2">{service.title}</h4>
                  
                  <p className="text-slate-500 text-xs leading-relaxed font-medium mb-4 line-clamp-3">
                    {service.shortDesc || service.fullDesc}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedService(service)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border border-slate-200/60"
                >
                  <span>التفاصيل</span>
                  <ArrowLeft size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="py-12 md:py-20 px-4 md:px-12 bg-white relative overflow-hidden border-y border-slate-100">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <h2 className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3.5 py-1 rounded-full font-bold text-xs mb-3 uppercase">
              <Users size={14} /> فريقنا الطبي
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 leading-tight">نخبة من أمهر الاستشاريين</h3>
            <p className="text-slate-500 text-sm sm:text-base font-medium">أطبائنا حاصلون على أعلى الزمالات والخبرات الطبية العالمية.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor: any) => (
              <div key={doctor.id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 shrink-0 border-2 border-white shadow-xs">
                      <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover object-top" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-base font-black text-slate-900">د. {doctor.name.replace(/^د\.\s*/, '')}</h4>
                      </div>
                      <p className="text-blue-600 font-bold text-xs mb-1">{doctor.specialty}</p>
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200/60">
                        <Star size={10} fill="currentColor" className="text-amber-500" /> 5.0 تقييم
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-5 bg-white p-3 rounded-xl border border-slate-200/60 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Award size={14} className="text-slate-400 shrink-0" /> {doctor.degree || 'استشاري معتمد'}
                    </p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Clock size={14} className="text-slate-400 shrink-0" /> الخبرة: {doctor.experience || '+10 سنوات'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => openBookingForDoctor(doctor.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Calendar size={14} />
                  <span>احجز موعد مع د. {doctor.name.replace(/^د\.\s*/, '').split(' ')[0]}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ & Testimonials */}
      <section id="faq" className="py-16 md:py-24 px-4 md:px-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 opacity-80 pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 relative z-10">
          
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-blue-400 font-bold tracking-wider text-xs sm:text-sm mb-1 uppercase">قصص نجاح وآراء المرضى</h2>
                <h3 className="text-2xl sm:text-3xl font-black">ماذا يقول مرضانا؟</h3>
              </div>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <span>{showReviewForm ? 'إلغاء' : 'أضف تقييمك ✍️'}</span>
              </button>
            </div>

            {reviewSuccessMsg && (
              <div className="mb-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>شكراً لك! تم إضافة تقييمك وتعليقك بنجاح.</span>
              </div>
            )}

            {showReviewForm && (
              <form onSubmit={handleAddReview} className="mb-6 bg-slate-800/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-blue-500/40 shadow-xl space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>شاركنا تجربتك وتقييمك لخدمتنا</span>
                </h4>
                
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">الاسم الكريم</label>
                  <input
                    type="text"
                    required
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="مثال: محمد أحمد"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">درجة التقييم</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          size={22}
                          className={star <= newReviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-amber-400 font-bold mr-2">({newReviewRating} من 5)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">التعليق والرأي</label>
                  <textarea
                    required
                    rows={3}
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="اكتب تجربتك مع العيادة، الأطباء، والخدمات..."
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'جاري الإرسال...' : 'إرسال التقييم 🌟'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {testimonials.map((test, idx) => (
                <div key={idx} className="bg-slate-800/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/80 relative group hover:bg-slate-800 transition-colors">
                  <Quote size={28} className="text-slate-700 absolute top-4 left-4 opacity-30 group-hover:text-blue-500/30 transition-colors" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex text-amber-400">
                      {[...Array(test.rating || 5)].map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                    </div>
                    {test.date && <span className="text-[10px] text-slate-400 font-medium">{test.date}</span>}
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-3 relative z-10">"{test.text}"</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-black text-xs shadow-inner">
                      {test.name ? test.name.charAt(0) : 'م'}
                    </div>
                    <span className="font-bold text-xs text-slate-200">{test.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-blue-400 font-bold tracking-wider text-xs sm:text-sm mb-2 uppercase">استفسارات شائعة</h2>
            <h3 className="text-2xl sm:text-3xl font-black mb-8">كل ما تحتاج معرفته</h3>
            
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/80 overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full text-right p-5 flex justify-between items-center focus:outline-none cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base pr-1 text-slate-100">{faq.question}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 shrink-0 ${activeFaq === idx ? 'bg-blue-600 rotate-180' : 'bg-slate-700'}`}>
                      <ChevronDown size={14} />
                    </div>
                  </button>
                  <div 
                    className={`transition-all duration-300 ease-in-out px-5 ${activeFaq === idx ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 py-0 opacity-0'} overflow-hidden`}
                  >
                    <p className="text-slate-300 leading-relaxed font-medium text-xs sm:text-sm border-t border-slate-700/50 pt-3 pr-1">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white shrink-0"><MessageCircle size={22} /></div>
              <div>
                <p className="font-bold text-sm text-white mb-0.5">لديك استفسار آخر؟</p>
                <p className="text-xs text-slate-400 mb-1.5">فريقنا متواجد للرد على كافة أسئلتك.</p>
                <a href={`tel:${clinicPhone}`} className="text-blue-400 font-bold text-xs hover:text-white transition-colors">اتصل بنا الآن ←</a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-white pt-24 pb-12 px-6 md:px-12 border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-teal-500 text-white p-2.5 rounded-xl">
                <ShieldCheck size={28} />
              </div>
              <span className="text-2xl font-black text-slate-900">{clinicName}</span>
            </div>
            <p className="text-slate-500 leading-relaxed font-medium">
              نلتزم بتقديم رعاية طبية سنية ترقى لأعلى المعايير العالمية في بيئة مريحة وفاخرة تضمن لك تجربة علاجية فريدة وبدون ألم.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"><Info size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"><Activity size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"><Star size={18} /></div>
            </div>
          </div>

          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-lg font-black text-slate-900 mb-6">روابط سريعة</h4>
            <ul className="space-y-4 text-slate-500 font-bold">
              <li><a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="hover:text-blue-600 transition-colors flex items-center gap-2"><ArrowLeft size={14} className="text-blue-600" /> الرئيسية</a></li>
              <li><a href="#services" onClick={(e) => scrollToSection(e, 'services')} className="hover:text-blue-600 transition-colors flex items-center gap-2"><ArrowLeft size={14} className="text-blue-600" /> الخدمات الطبية</a></li>
              <li><a href="#doctors" onClick={(e) => scrollToSection(e, 'doctors')} className="hover:text-blue-600 transition-colors flex items-center gap-2"><ArrowLeft size={14} className="text-blue-600" /> فريق الأطباء</a></li>
              <li><a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hover:text-blue-600 transition-colors flex items-center gap-2"><ArrowLeft size={14} className="text-blue-600" /> الأسئلة الشائعة</a></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-lg font-black text-slate-900 mb-6">تواصل معنا</h4>
            <ul className="space-y-5 text-slate-500 font-medium">
              <li className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><Phone size={18} /></div>
                <a href={`tel:${clinicPhone}`} dir="ltr" className="font-bold text-slate-700 hover:text-blue-600 transition-colors">{clinicPhone}</a>
              </li>
              <li className="flex items-start gap-4 p-2">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0 mt-1"><MapPin size={18} /></div>
                <span className="leading-relaxed font-bold text-slate-700">عمان، شارع مكة،<br/><span className="text-slate-500 font-medium">مجمع الأعمال، المبنى الرئيسي</span></span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-lg font-black text-slate-900 mb-6">ساعات العمل</h4>
            <ul className="space-y-4 text-slate-500 font-bold">
              <li className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span>السبت - الأربعاء</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700">9 ص - 9 م</span>
              </li>
              <li className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span>الخميس</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700">9 ص - 6 م</span>
              </li>
              <li className="flex justify-between items-center text-red-500 bg-red-50 p-4 rounded-xl mt-4 border border-red-100">
                <span className="flex items-center gap-2"><Activity size={16} /> الجمعة</span>
                <span>طوارئ 24/7</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-[1400px] mx-auto border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm font-bold">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} {clinicName}.</p>
          <div className="flex gap-6">
            <a href="#" onClick={showPrivacyPolicy} className="hover:text-blue-600 transition-colors">سياسة الخصوصية</a>
            <a href="#" onClick={showTerms} className="hover:text-blue-600 transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 w-full max-w-lg relative shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar my-auto">
            
            <button 
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-8 pt-2">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Calendar size={32} />
              </div>
              <h3 className="text-3xl font-black text-slate-900">حجز استشارة</h3>
              <p className="text-slate-500 mt-2 font-medium">سنتواصل معك لتأكيد الموعد المناسب لك.</p>
            </div>
            
            <form className="space-y-5" onSubmit={handleBookingSubmit}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  value={bookingData.name}
                  onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                  placeholder="أدخل اسمك الثلاثي" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-0 focus:border-blue-600 outline-none transition-colors bg-slate-50 focus:bg-white text-slate-900 font-bold placeholder-slate-400" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  required 
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                  placeholder="07X XXX XXXX" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-0 focus:border-blue-600 outline-none transition-colors bg-slate-50 focus:bg-white text-slate-900 font-bold placeholder-slate-400 text-right" 
                  dir="ltr" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الخدمة</label>
                  <div className="relative">
                    <select 
                      value={bookingData.serviceId}
                      onChange={(e) => setBookingData({...bookingData, serviceId: e.target.value})}
                      className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-0 focus:border-blue-600 outline-none transition-colors bg-slate-50 focus:bg-white text-slate-700 font-bold appearance-none cursor-pointer"
                    >
                      <option value="">عامة</option>
                      {services.map((s: any) => s.isVisible === false ? null : <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الطبيب المفضل</label>
                  <div className="relative">
                    <select 
                      value={bookingData.doctorId}
                      onChange={(e) => setBookingData({...bookingData, doctorId: e.target.value})}
                      className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-0 focus:border-blue-600 outline-none transition-colors bg-slate-50 focus:bg-white text-slate-700 font-bold appearance-none cursor-pointer"
                    >
                      <option value="">أي طبيب</option>
                      {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* تاريخ وتوقيت الحجز */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Calendar size={18} className="text-blue-600" /> تاريخ الموعد</span>
                    <span className="text-xs text-slate-400 font-normal">اختر اليوم المطلوب</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    required
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:ring-0 focus:border-blue-600 outline-none transition-colors bg-slate-50 focus:bg-white text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Clock size={18} className="text-blue-600" /> الوقت المتاح للحجز</span>
                    <span className="text-xs text-slate-500 font-medium">جدول الطبيب والتوقيت المتاح</span>
                  </label>
                  
                  {calculatedSlots.slots.length === 0 || calculatedSlots.availableSlots.length === 0 ? (
                    <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl text-center space-y-1">
                      <p className="text-sm font-black text-amber-900">Fully Booked for this date ⚠️</p>
                      <p className="text-xs font-bold text-amber-700">لا توجد مواعيد متاحة في هذا التاريخ. جميع الفترات محجوزة بالكامل، يُرجى اختيار تاريخ آخر.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1">
                      {calculatedSlots.slots.map((sObj, sIdx) => {
                        const isSelected = bookingData.time === sObj.timeLabel;
                        const booked = sObj.isBooked;

                        return (
                          <button
                            key={sIdx}
                            type="button"
                            disabled={booked}
                            onClick={() => setBookingData({ ...bookingData, time: sObj.timeLabel })}
                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              booked 
                                ? 'border-rose-100 bg-rose-50/70 text-rose-500 cursor-not-allowed opacity-75 line-through' 
                                : (isSelected ? 'border-blue-600 bg-blue-50 text-blue-900 font-black ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700')
                            }`}
                          >
                            <span>{sObj.timeLabel}</span>
                            {booked && <span className="text-[10px] text-rose-600 font-bold no-underline">(محجوز ❌)</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Warning Alert if Conflict */}
                {isSlotBooked(bookingData.date, bookingData.time) && (
                  <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                    <div className="text-xs leading-relaxed text-rose-800 font-bold">
                      <strong className="block text-sm text-rose-900 font-black mb-1">لا يوجد حجوزات متاحة في هذا الوقت! ⚠️</strong>
                      التوقيت المختار ({bookingData.time}) محجوز بالكامل في هذا اليوم ({bookingData.date}). يرجى اختيار موعد أو توقيت آخر متاح باللون الأزرق.
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={isSlotBooked(bookingData.date, bookingData.time) || calculatedSlots.availableSlots.length === 0}
                  className={`flex-1 font-black text-lg py-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${
                    isSlotBooked(bookingData.date, bookingData.time) || calculatedSlots.availableSlots.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:from-blue-700 hover:to-teal-600 active:scale-[0.98] shadow-xl shadow-blue-600/20 cursor-pointer'
                  }`}
                >
                  {calculatedSlots.availableSlots.length === 0 ? 'اليوم محجوز بالكامل' : isSlotBooked(bookingData.date, bookingData.time) ? 'التوقيت محجوز - اختر وقتاً آخر' : 'تأكيد طلب الحجز'} <CheckCircle2 size={20} />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                >
                  إغلاق ✕
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl relative shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 left-4 z-10 text-white bg-black/20 hover:bg-black/40 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="h-64 relative shrink-0">
              <img src={selectedService.image} alt={selectedService.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 right-8 text-white">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Activity size={24} />
                </div>
                <h3 className="text-3xl font-black">{selectedService.title}</h3>
              </div>
            </div>

            <div className="p-8 overflow-y-auto">
              <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
                {selectedService.fullDesc || selectedService.shortDesc}
              </p>
              
              <h4 className="font-bold text-slate-900 mb-4 text-lg">مميزات العلاج:</h4>
              <ul className="space-y-3 mb-8">
                {(selectedService.features || ['رعاية فائقة', 'أحدث التقنيات', 'نتائج مضمونة']).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-600 font-bold">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => openBookingForService(selectedService.id)}
                className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-600 transition-colors shadow-xl shadow-slate-900/20"
              >
                احجز لهذه الخدمة الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModalContent && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setInfoModalContent(null)}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
            <div className="mb-6">
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
                <Info size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">{infoModalContent.title}</h3>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              {infoModalContent.content}
            </p>
            <button 
              onClick={() => setInfoModalContent(null)}
              className="w-full mt-8 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* My Appointments (قسم مواعيدي) Modal */}
      {isMyAppointmentsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[105] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 sm:p-8 relative shrink-0">
              <button 
                onClick={() => setIsMyAppointmentsOpen(false)}
                className="absolute top-6 left-6 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <CalendarCheck size={24} />
                </div>
                <h3 className="text-2xl font-black text-white">قسم إدارة وتتبع مواعيدي 📅</h3>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
                متابعة مواعيدك المحجوزة لدى العيادة، الاطلاع على التوقيت المؤكد للحضور، وملاحظات وتوصيات طبيبك الخاص.
              </p>
            </div>

            {/* Search & Refresh Bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchPatientAppointments();
                }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="relative flex-1 w-full">
                  <input 
                    type="text"
                    value={patientSearchPhone}
                    onChange={(e) => setPatientSearchPhone(e.target.value)}
                    placeholder="أدخل رقم هاتفك الذي استخدمته بالحجز..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                  />
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    type="submit"
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>بحث عن مواعيدي</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => fetchPatientAppointments()}
                    disabled={isLoadingMyAppointments}
                    className="p-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                    title="تحديث المواعيد"
                  >
                    <RefreshCw size={18} className={isLoadingMyAppointments ? 'animate-spin text-blue-600' : ''} />
                  </button>
                </div>
              </form>
            </div>

            {/* Appointments Body */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {isLoadingMyAppointments ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <RefreshCw size={32} className="animate-spin text-blue-600" />
                  <p className="font-bold text-sm">جاري جلب مواعيدك...</p>
                </div>
              ) : myAppointmentsList.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-base">لا توجد مواعيد مسجلة لهذا الرقم</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    يرجى التأكد من كتابة رقم الهاتف الذي أدخلته عند طلب الموعد، أو قم بحجز موعد جديد الآن.
                  </p>
                  <button
                    onClick={() => {
                      setIsMyAppointmentsOpen(false);
                      setIsBookingModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors"
                  >
                    <Calendar size={16} />
                    <span>حجز موعد جديد</span>
                  </button>
                </div>
              ) : (
                myAppointmentsList.map((app) => (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                          {app.service}
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-1.5 flex items-center gap-2">
                          <span>{app.doctor}</span>
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                          app.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          app.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                          app.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {app.status === 'completed' ? 'تمت الزيارة 🩺' :
                           app.status === 'confirmed' ? 'موعد مؤكد ✅' :
                           app.status === 'cancelled' ? 'ملغي ❌' : 'قيد المراجعة ⏳'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <Calendar size={16} className="text-slate-400" />
                        <span>التاريخ: <strong className="text-slate-900">{app.date}</strong></span>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                        <Clock size={16} className="text-blue-600" />
                        <span>
                          {app.confirmedTime 
                            ? <span>التوقيت المؤكد للحضور: <strong className="text-blue-700">{app.confirmedTime}</strong></span>
                            : <span>الوقت المطلوب: <strong className="text-slate-900">{app.time || '10:00 AM'}</strong></span>
                          }
                        </span>
                      </div>
                    </div>

                    {/* Doctor's Notes Section */}
                    {app.doctorNotes ? (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-2 text-right">
                        <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
                          <Stethoscope size={18} className="text-emerald-600" />
                          <span>ملاحظات الدكتور وتوصيات العلاج / الوصفة الطبية:</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-emerald-100 whitespace-pre-wrap">
                          {app.doctorNotes}
                        </p>
                      </div>
                    ) : app.status === 'confirmed' || app.status === 'completed' ? (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-400 font-medium flex items-center gap-2">
                        <Info size={14} className="text-slate-400" />
                        <span>لم يقم الطبيب بإضافة ملاحظات خاصة لهذه الزيارة بعد.</span>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-slate-900/50 flex items-center gap-4 z-[110] animate-in slide-in-from-bottom-8 fade-in duration-300 border border-slate-700 min-w-[300px]">
          <div className="bg-green-500/20 text-green-400 p-2 rounded-full shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white">تم استلام طلبك بنجاح!</h4>
            <p className="text-slate-400 text-sm mt-1 font-medium">سنتواصل معك في أقرب وقت.</p>
          </div>
        </div>
      )}

    </div>
  );
}
