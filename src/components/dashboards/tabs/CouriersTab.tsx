import React, { useState } from 'react';
import { Truck, User, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';

interface CouriersTabProps {
  content: any;
  setContent: (content: any) => void;
  handleUpdateContent: (silent?: boolean) => Promise<void>;
  dashboardColor: string;
}

export default function CouriersTab({ content, setContent, handleUpdateContent, dashboardColor }: CouriersTabProps) {
  const [couriers, setCouriers] = useState<any[]>(content?.couriers || []);
  const [newCourier, setNewCourier] = useState({ name: '', phone: '', area: '', status: 'available' });

  const handleAddCourier = async () => {
    if (!newCourier.name || !newCourier.phone) return;
    const updatedCouriers = [...couriers, { ...newCourier, id: Date.now().toString(), ordersCount: 0 }];
    setCouriers(updatedCouriers);
    setContent({ ...content, couriers: updatedCouriers });
    await handleUpdateContent(true);
    setNewCourier({ name: '', phone: '', area: '', status: 'available' });
  };

  const handleDeleteCourier = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف المندوب؟')) return;
    const updatedCouriers = couriers.filter(c => c.id !== id);
    setCouriers(updatedCouriers);
    setContent({ ...content, couriers: updatedCouriers });
    await handleUpdateContent(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const updatedCouriers = couriers.map(c => c.id === id ? { ...c, status } : c);
    setCouriers(updatedCouriers);
    setContent({ ...content, couriers: updatedCouriers });
    await handleUpdateContent(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Truck className="text-indigo-600" /> إدارة المناديب والشحن
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input type="text" placeholder="اسم المندوب *" value={newCourier.name} onChange={e => setNewCourier({...newCourier, name: e.target.value})} className="px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
          <input type="text" placeholder="رقم الهاتف *" value={newCourier.phone} onChange={e => setNewCourier({...newCourier, phone: e.target.value})} className="px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
          <input type="text" placeholder="المنطقة / الحي *" value={newCourier.area} onChange={e => setNewCourier({...newCourier, area: e.target.value})} className="px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold" />
          <button onClick={handleAddCourier} className="bg-indigo-600 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">إضافة المندوب</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4 rounded-r-xl">المندوب</th>
                <th className="px-6 py-4">المنطقة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">عدد الطلبات</th>
                <th className="px-6 py-4 rounded-l-xl">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {couriers.map((courier, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-xs flex flex-col gap-1">
                    <span>{courier.name}</span>
                    <span className="text-slate-400 font-mono">{courier.phone}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-xs text-slate-600">{courier.area}</td>
                  <td className="px-6 py-4">
                    <select value={courier.status} onChange={e => handleStatusChange(courier.id, e.target.value)} className="text-xs font-bold border rounded-lg px-2 py-1 outline-none">
                      <option value="available">متاح ✅</option>
                      <option value="busy">مشغول 🚗</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 font-bold text-xs text-indigo-600">{courier.ordersCount || 0}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteCourier(courier.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">حذف</button>
                  </td>
                </tr>
              ))}
              {couriers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold text-xs">لا يوجد مناديب مسجلين بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
