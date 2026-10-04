import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { cleanFirestoreData } from './activityLogger';

export const submitLead = async (tenantId: number | string, data: any, type: 'leads' | 'orders' = 'leads') => {
  if (!tenantId) throw new Error('Tenant ID is required');
  let firestoreSuccess = false;
  try {
    const leadsRef = collection(db, `user_sites/${tenantId}/${type}`);
    await addDoc(leadsRef, cleanFirestoreData({
      ...data,
      createdAt: serverTimestamp(),
      status: 'new'
    }));
    firestoreSuccess = true;
  } catch (error) {
    console.error('Error submitting lead to firestore:', error);
  }

  // Also POST to backend Express API database
  if (typeof window !== 'undefined') {
    try {
      const customerName = data.customerName || data.name || data.customer?.name || 'عميل المتجر';
      const customerPhone = data.customerPhone || data.phone || data.customer?.phone || '0000000000';
      const customerEmail = data.customerEmail || data.email || data.customer?.email || null;
      const totalPrice = data.totalPrice || data.total || data.details?.total || data.cartTotalAmount || null;
      const items = data.items || data.details?.items || null;

      const res = await fetch(`/api/public/websites/${encodeURIComponent(String(tenantId))}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          type: type === 'orders' ? 'store_order' : 'contact_lead',
          details: data.details || data,
          items,
          totalPrice
        })
      });
      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.error('Error submitting lead to server API:', err);
    }
  }

  return firestoreSuccess;
};

export const subscribeToLeads = (tenantId: number | string, type: 'leads' | 'orders' = 'leads', callback: (leads: any[]) => void) => {
  if (!tenantId) return () => {};
  const leadsRef = collection(db, `user_sites/${tenantId}/${type}`);
  const q = query(leadsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(leads);
  }, (error) => {
    console.info(`Firestore leads subscription notice for ${tenantId}:`, error?.message || error);
    callback([]);
  });
};
