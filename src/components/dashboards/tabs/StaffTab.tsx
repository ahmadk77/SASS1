import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, User, Trash2, X, Check, Key, HelpCircle, Lock, Edit3 } from 'lucide-react';

interface StaffMember {
  id: string | number;
  name?: string;
  email: string;
  role: string;
  permissions: string;
}

interface StaffTabProps {
  staffList: StaffMember[];
  fetchStaff: () => void;
  handleAddStaff: (e: React.FormEvent) => Promise<void>;
  handleDeleteStaff: (staffId: string | number) => Promise<void>;
  addingStaffLoading: boolean;
  newStaffName: string;
  setNewStaffName: (val: string) => void;
  newStaffEmail: string;
  setNewStaffEmail: (val: string) => void;
  newStaffRole: string;
  setNewStaffRole: (val: string) => void;
  newStaffPermissions: string;
  setNewStaffPermissions: (val: string) => void;
}

export default function StaffTab({
  staffList,
  fetchStaff,
  handleAddStaff,
  handleDeleteStaff,
  addingStaffLoading,
  newStaffName,
  setNewStaffName,
  newStaffEmail,
  setNewStaffEmail,
  newStaffRole,
  setNewStaffRole,
  newStaffPermissions,
  setNewStaffPermissions
}: StaffTabProps) {
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [permissionMode, setPermissionMode] = useState<'preset' | 'custom'>('preset');
  const [selectedDepts, setSelectedDepts] = useState<{ [key: string]: boolean }>({
    orders: true,
    content: true,
    couriers: false,
    customers: false,
    support: false,
    settings: false,
    staff: false
  });

  const availableDepts = [
    { key: 'orders', label: '📦 إدارة الطلبات والحجوزات' },
    { key: 'content', label: '🛒 المنتجات والمحتوى والمنيو' },
    { key: 'couriers', label: '🚚 إدارة المناديب والتوصيل' },
    { key: 'customers', label: '👥 سجلات وقاعدة العملاء' },
    { key: 'support', label: '💬 تذاكر وطلبات المساعدة' },
    { key: 'settings', label: '⚙️ إعدادات ومظهر المتجر' },
    { key: 'staff', label: '👥 فريق العمل والموظفين' },
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDeptToggle = (key: string) => {
    const updated = { ...selectedDepts, [key]: !selectedDepts[key] };
    setSelectedDepts(updated);
    
    // Convert selected keys to comma separated string
    const activeKeys = Object.keys(updated).filter(k => updated[k]);
    setNewStaffPermissions(activeKeys.length > 0 ? activeKeys.join(',') : 'none');
  };

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setPermissionMode('custom');
      const activeKeys = Object.keys(selectedDepts).filter(k => selectedDepts[k]);
      setNewStaffPermissions(activeKeys.length > 0 ? activeKeys.join(',') : 'orders,content');
    } else {
      setPermissionMode('preset');
      setNewStaffPermissions(preset);
    }
  };

  const handleEditMember = (member: StaffMember) => {
    setNewStaffEmail(member.email);
    setNewStaffName(member.name || '');
    setNewStaffRole(member.role || 'staff');
    
    const pStr = (member.permissions || '').toLowerCase();
    if (pStr === 'all' || pStr === 'orders_only' || pStr === 'content_only' || pStr === 'settings_only') {
      setPermissionMode('preset');
      setNewStaffPermissions(pStr);
    } else {
      setPermissionMode('custom');
      setNewStaffPermissions(pStr || 'orders,content');
      const newDepts: { [key: string]: boolean } = {
        orders: pStr.includes('orders'),
        content: pStr.includes('content'),
        couriers: pStr.includes('couriers'),
        customers: pStr.includes('customers'),
        support: pStr.includes('support'),
        settings: pStr.includes('settings'),
        staff: pStr.includes('staff'),
      };
      setSelectedDepts(newDepts);
    }
    setIsAddStaffModalOpen(true);
  };

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAddStaff(e);
    setIsAddStaffModalOpen(false);
  };

  const renderPermissionsBadges = (permsString: string) => {
    const pStr = (permsString || '').toLowerCase();
    if (pStr === 'all' || pStr === 'full' || pStr.includes('all')) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
          ⚡ وصول كامل لجميع الأقسام
        </span>
      );
    }

    if (pStr === 'orders_only') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          📦 الطلبات والحجوزات فقط
        </span>
      );
    }

    if (pStr === 'content_only') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          📝 المحتوى والمنتجات فقط
        </span>
      );
    }

    if (pStr === 'settings_only') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          ⚙️ الإعدادات والهوية فقط
        </span>
      );
    }

    const badges = [];
    if (pStr.includes('orders')) badges.push({ text: '📦 الطلبات', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' });
    if (pStr.includes('content')) badges.push({ text: '🛒 المنتجات والمنيو', color: 'bg-purple-50 text-purple-700 border-purple-200' });
    if (pStr.includes('couriers')) badges.push({ text: '🚚 المناديب', color: 'bg-blue-50 text-blue-700 border-blue-200' });
    if (pStr.includes('customers')) badges.push({ text: '👥 العملاء', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' });
    if (pStr.includes('support')) badges.push({ text: '💬 الدعم', color: 'bg-rose-50 text-rose-700 border-rose-200' });
    if (pStr.includes('settings')) badges.push({ text: '⚙️ الإعدادات', color: 'bg-amber-50 text-amber-700 border-amber-200' });
    if (pStr.includes('staff')) badges.push({ text: '👥 الموظفين', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' });

    if (badges.length === 0) {
      return <span className="text-xs text-slate-400 font-bold">مخصص ({pStr})</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {badges.map((b, idx) => (
          <span key={idx} className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${b.color}`}>
            {b.text}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300" dir="rtl">
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            إدارة الموظفين وتحديد صلاحيات الأقسام
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            أضِف موظفيك ببريدهم الإلكتروني وحدد بدقة الأقسام التي تظهر لهم في لوحة التحكم.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddStaffModalOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 justify-center cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          إضافة موظف جديد
        </button>
      </div>

      {/* Login Instructions Info Banner */}
      <div className="bg-indigo-950 text-white p-6 rounded-2xl border border-indigo-800 shadow-md flex flex-col sm:flex-row items-start gap-4">
        <div className="p-3 bg-indigo-900 rounded-xl shrink-0 text-amber-400">
          <Key className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
            <span>طريقة دخول الموظف إلى لوحة التحكم:</span>
          </h4>
          <p className="text-xs text-indigo-200 leading-relaxed font-medium">
            1. قم بإضافة إيميل الموظف من هذا القسم وتحديد الأقسام المسموح له بفتحها.<br />
            2. الموظف يدخل إلى الموقع ويضغط على <strong>"تسجيل الدخول"</strong> من خلال إيميل Google الخاض به.<br />
            3. النظام يتعرف عليه تلقائياً كموظف ويفتحه له لوحة التحكم مع <strong>إخفاء أي قسم لم تمنحه صلاحية الدخول إليه</strong>.
          </p>
        </div>
      </div>

      {/* Staff Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">قائمة الموظفين والمشرفين ({staffList.length})</h3>
          <button onClick={fetchStaff} className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer">
            تحديث القائمة 🔄
          </button>
        </div>

        {staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="font-bold text-slate-600">لا يوجد موظفون مضافون حالياً</p>
            <p className="text-xs mt-1">قم بإضافة أول موظف لمساعدتك في معالجة الطلبات وإدارة المنتجات.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">الموظف</th>
                  <th className="px-6 py-4">البريد الإلكتروني</th>
                  <th className="px-6 py-4">الدور / الرتبة</th>
                  <th className="px-6 py-4">الأقسام والصلاحيات المسموحة</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shrink-0">
                          {(member.name || member.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div>{member.name || 'بدون اسم'}</div>
                          <div className="text-xs text-slate-400 font-mono font-normal">ID: #{member.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600" dir="ltr">{member.email}</td>
                    <td className="px-6 py-4">
                      {member.role === 'tenant_admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Shield className="w-3.5 h-3.5" /> مشرف متجر
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <User className="w-3.5 h-3.5" /> موظف
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {renderPermissionsBadges(member.permissions)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        نشط
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditMember(member)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="تعديل الموظف والصلاحيات"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(member.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="إزالة الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Modal Add Staff */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-right space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-indigo-600" />
                إضافة موظف جديد وتحديد صلاحياته
              </h3>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmitForm} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الموظف الثلاثي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد عبد الله"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني للموظف (Email):</label>
                <input
                  type="email"
                  required
                  placeholder="employee@example.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-left"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 يسجل الموظف به برسمياً عبر خيار تسجيل الدخول بحسابه.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الدور (Role):</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                >
                  <option value="staff">موظف (Staff)</option>
                  <option value="tenant_admin">مشرف متجر (Tenant Admin)</option>
                </select>
              </div>

              {/* Permissions Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">طريقة تحديد الصلاحيات:</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handlePresetChange('all')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      permissionMode === 'preset' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ⚡ نماذج جاهزة
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('custom')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      permissionMode === 'custom' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🎯 تخصيص الأقسام بالظبط
                  </button>
                </div>

                {permissionMode === 'preset' ? (
                  <select
                    value={newStaffPermissions}
                    onChange={(e) => setNewStaffPermissions(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                  >
                    <option value="all">⚡ وصول شامل لجميع أقسام لوحة التحكم</option>
                    <option value="orders_only">📦 إدارة الطلبات والحجوزات فقط</option>
                    <option value="content_only">🛒 إدارة المنتجات والمحتوى والمنيو فقط</option>
                    <option value="settings_only">⚙️ التحكم بإعدادات ومظهر المتجر فقط</option>
                  </select>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 block mb-2">حدد الأقسام التي تظهر في القائمة الجانبية للموظف:</span>
                    {availableDepts.map(dept => (
                      <label key={dept.key} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!selectedDepts[dept.key]}
                          onChange={() => handleDeptToggle(dept.key)}
                          className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-800">{dept.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={addingStaffLoading}
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {addingStaffLoading ? 'جاري الإضافة...' : 'حفظ وإضافة الموظف'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-5 py-3.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

