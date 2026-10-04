import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  UserCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  Database, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  KeyRound, 
  Lock 
} from 'lucide-react';

export interface AuditLogItem {
  id: number;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'CONFIG_CHANGE';
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  isDangerous?: boolean;
}

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const AuditLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tenant/logs');
        if (res.ok) {
          const data = await res.json();
          const rawLogs = data.logs || data.auditLogs || [];
          if (Array.isArray(rawLogs) && rawLogs.length > 0) {
            const dbLogs: AuditLogItem[] = rawLogs.map((l: any) => ({
              id: l.id,
              userId: String(l.userId || 'usr_staff'),
              userName: l.userName || l.userEmail || 'مشرف',
              userRole: l.userId ? 'مدير/موظف' : 'مستخدم',
              action: (l.action?.includes('DELETE') || l.action?.includes('حذف') ? 'DELETE' : l.action?.includes('PUT') || l.action?.includes('PATCH') || l.action?.includes('تحديث') ? 'UPDATE' : 'CREATE') as any,
              resourceType: l.resourceType || 'general',
              resourceId: String(l.resourceId || l.id),
              details: l.action || 'إجراء على النظام',
              ipAddress: l.changes?.ip || 'غير متوفر',
              createdAt: l.createdAt ? new Date(l.createdAt).toLocaleString('ar-SA') : new Date().toLocaleString('ar-SA'),
              isDangerous: l.action?.includes('DELETE') || l.action?.includes('حذف')
            }));
            setLogs(dbLogs);
          } else {
            setLogs([]);
          }
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: AuditLogItem['action'], isDangerous?: boolean) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <PlusCircle size={12} />
            <span>إنشاء (CREATE)</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Edit3 size={12} />
            <span>تحديث (UPDATE)</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Trash2 size={12} />
            <span>حذف (DELETE)</span>
          </span>
        );
      case 'CONFIG_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <KeyRound size={12} />
            <span>تعديل إعدادات</span>
          </span>
        );
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <UserCheck size={12} />
            <span>تسجيل دخول</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#008060] mb-1">
            <ShieldCheck size={18} />
            <span>سجل الأمان والعمليات (Audit Trail Logs)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">تتبع نشاط الموظفين والتغييرات</h2>
          <p className="text-xs text-slate-500 mt-1">سجل مدقق لكافة التحركات والإجراءات الحساسة والتعديلات في المتجر.</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold self-start md:self-auto">
          <Lock size={15} />
          <span>التسجيل مفعّل ومحمي تلقائياً</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Action Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterAction('ALL')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
              filterAction === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilterAction('CREATE')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
              filterAction === 'CREATE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            إنشاء
          </button>
          <button
            onClick={() => setFilterAction('UPDATE')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
              filterAction === 'UPDATE' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تحديث
          </button>
          <button
            onClick={() => setFilterAction('DELETE')}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
              filterAction === 'DELETE' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            حذف
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="بحث بالمستخدم، السجل، أو الوصف..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008060] focus:bg-white transition-all"
          />
          <Search size={15} className="absolute right-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* Audit Timeline List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              لا توجد سجلات مطابقة للبحث حالياً.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border transition-all ${
                  log.isDangerous
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    {getActionBadge(log.action, log.isDangerous)}

                    <span className="text-xs font-bold text-slate-900">
                      {log.userName}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {log.userRole}
                    </span>

                    {log.isDangerous && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={12} />
                        <span>إجراء حساس جداً</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{log.createdAt}</span>
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      IP: {log.ipAddress}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100 mt-1">
                  {log.details}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>المورد: {log.resourceType} ({log.resourceId})</span>
                  <span>ID السجل: #{log.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default AuditLogsViewer;
