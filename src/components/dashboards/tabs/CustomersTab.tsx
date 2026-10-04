import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag, Clock, Heart, Search } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface CustomersTabProps {
  tenant: any;
  dashboardColor: string;
}

export default function CustomersTab({ tenant, dashboardColor }: CustomersTabProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const tId = tenant?.id;
      if (!tId) return;

      const idToken = await user.getIdToken();
      const res = await fetch(`/api/tenant/${tId}/store-customers`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCustomers();
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [tenant?.id]);

  const filteredCustomers = customers.filter(c => {
    const search = searchTerm.toLowerCase();
    return (c.email && c.email.toLowerCase().includes(search)) || 
           (c.name && c.name.toLowerCase().includes(search)) ||
           (c.phone && c.phone.toLowerCase().includes(search));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            سجلات دخول العملاء
          </h3>
          <p className="text-sm text-gray-500 mt-1">تتبع العملاء الذين سجلوا الدخول إلى موقعك ونشاطهم.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-400" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">لا يوجد عملاء مسجلين</h4>
          <p className="text-gray-500 text-sm">لم يقم أي عميل بتسجيل الدخول إلى موقعك حتى الآن.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCustomers.map((customer, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex items-center gap-4">
                {customer.photoUrl ? (
                  <img src={customer.photoUrl} alt="" className="w-12 h-12 rounded-full border border-gray-100 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                    {customer.name ? customer.name.charAt(0) : (customer.email || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{customer.name || 'عميل غير معروف'}</h4>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 mt-0.5">
                    {customer.email && !customer.email.includes('@order.local') && (
                      <div className="flex items-center gap-1">
                        <Mail size={12} className="shrink-0" />
                        <span dir="ltr" className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={12} className="text-emerald-600 shrink-0" />
                        <span dir="ltr">{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center text-indigo-600 mb-1"><ShoppingBag size={18} /></div>
                  <div className="text-xl font-bold text-gray-900">{customer.totalOrders}</div>
                  <div className="text-[10px] text-gray-500 font-bold mt-1">إجمالي الطلبات</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center text-emerald-600 mb-1"><Clock size={18} /></div>
                  <div className="text-xl font-bold text-emerald-700">{customer.deliveredOrders}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">طلبات مستلمة</div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <div className="flex justify-center text-rose-500 mb-1"><Heart size={18} /></div>
                  <div className="text-xl font-bold text-rose-700">{customer.favoritesCount !== undefined ? customer.favoritesCount : (customer.favorites?.length || 0)}</div>
                  <div className="text-[10px] text-rose-600 font-bold mt-1">المنتجات المفضلة</div>
                </div>
              </div>
              
              <div className="text-[10px] text-gray-400 text-left pt-2">
                آخر ظهور: {new Date(customer.lastLoginAt).toLocaleString('ar-JO')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
