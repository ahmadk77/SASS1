import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

const TEMPLATE_NAMES_MAP: Record<string, string> = {
  '1': 'قالب المطعم الإيطالي والفاخر',
  '2': 'قالب برجر ستيشن للوجبات السريعة',
  '3': 'قالب بيتزا ووجبات عائلية',
  '4': 'قالب كافيه وقهوة كلاسيك',
  '5': 'قالب محمص وقهوة مختصة',
  '6': 'قالب بوتيك الحلويات والآيس كريم',
  '7': 'قالب العقارات والفلل الفاخرة',
  '8': 'قالب الشقق والمجمعات السكنية',
  '9': 'قالب المركز والمكتب العقاري',
  '10': 'قالب شركات المقاولات والبناء',
  '11': 'قالب الاستشارات والتصميم المعماري',
  '12': 'قالب التصميم الداخلي والتجديد',
  '13': 'قالب أزياء وبوتيك فاخر',
  '14': 'قالب الإلكترونيات والهواتف الذكية',
  '15': 'قالب العناية بالبشرة والجسم'
};

const normalizeDateString = (val: any): string => {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  if (val && typeof val.toDate === 'function') return val.toDate().toISOString();
  if (val && typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
  if (val && typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
  return new Date().toISOString();
};

export const cleanFirestoreData = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && (val.constructor === Object || !val.constructor)) {
        clean[key] = cleanFirestoreData(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean as T;
};

export interface UserActivity {
  id?: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface EditedTemplate {
  id: string;
  userId: string;
  userEmail: string;
  templateId: number | string;
  templateName: string;
  customizations: any;
  updatedAt: string;
  isSubscribed?: boolean;
}

// Log a user activity to Firestore
export const logUserActivity = async (
  userId: string,
  userEmail: string,
  action: string,
  details: string,
  userName?: string
) => {
  try {
    const activityRef = collection(db, 'user_activities');
    const timestamp = new Date().toISOString();
    await addDoc(activityRef, cleanFirestoreData({
      userId: userId || '',
      userEmail: userEmail || '',
      userName: userName || userEmail?.split('@')[0] || 'عميل',
      action: action || '',
      details: details || '',
      timestamp,
      createdAt: serverTimestamp()
    }));
    console.log('Logged activity:', action, details);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      // Handled silently without console warning
    } else {
      console.error('Error logging user activity:', err);
    }
  }
};

// Save or Update an Edited Template
export const saveEditedTemplate = async (
  userId: string,
  userEmail: string,
  templateId: number | string,
  templateName: string,
  customizations: any,
  customDocId?: string
) => {
  const docId = customDocId || `${userId}_template_${templateId}`;
  const updatedAt = new Date().toISOString();

  const data: EditedTemplate = {
    id: docId,
    userId,
    userEmail,
    templateId,
    templateName,
    customizations,
    updatedAt,
    isSubscribed: false
  };

  // 1. Synchronously update localStorage for instant persistence across multiple keys
  try {
    const delKey = `waas_deleted_templates_${userId}`;
    const rawDel = localStorage.getItem(delKey);
    if (rawDel) {
      const delList: string[] = JSON.parse(rawDel);
      const filteredDel = delList.filter(d => d !== docId && d !== String(templateId));
      localStorage.setItem(delKey, JSON.stringify(filteredDel));
    }
  } catch (e) {}

  try {
    const keysToSave = [
      `waas_edited_templates_${userId}`
    ];
    if (userId === 'usr_default' || String(userId).startsWith('guest_')) {
      keysToSave.push('waas_edited_templates_usr_default');
    }
    if (userEmail && userEmail.includes('@')) {
      keysToSave.push(`waas_edited_templates_${userEmail.toLowerCase().trim()}`);
    }

    keysToSave.forEach(localKey => {
      const raw = localStorage.getItem(localKey);
      const list: EditedTemplate[] = raw ? JSON.parse(raw) : [];
      const index = list.findIndex(item => item.id === docId || (String(item.templateId) === String(templateId) && (item.userId === userId || (userEmail && item.userEmail === userEmail))));
      if (index >= 0) {
        list[index] = data;
      } else {
        list.unshift(data);
      }
      localStorage.setItem(localKey, JSON.stringify(list));
    });

    // Also write to workspace key for workspace component compatibility
    const wsKey = `waas_workspace_${userId}`;
    localStorage.setItem(wsKey, JSON.stringify({
      id: docId,
      templateId: String(templateId),
      name: templateName,
      customizations,
      updatedAt
    }));
  } catch (lsErr) {
    console.warn('LocalStorage save failed:', lsErr);
  }

  // 2. Async save to Firestore
  try {
    const docRef = doc(db, 'edited_templates', docId);
    await setDoc(docRef, data, { merge: true });
    
    // Log activity
    await logUserActivity(
      userId,
      userEmail,
      'تعديل قالب',
      `قام بتعديل وتخصيص القالب: ${templateName}`
    );
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore save edited template notice: permissions restricted, saved locally via LocalStorage.');
    } else {
      console.warn('Firestore save edited template error:', errMsg);
    }
  }

  return data;
};

// Fetch all edited templates for a user
export const fetchUserEditedTemplates = async (userId: string, userEmail?: string) => {
  const listMap = new Map<string, EditedTemplate>();
  const isAllAdminMode = userId === 'admin_all_templates' || userId === 'all';
  const normUserEmail = userEmail?.toLowerCase().trim();

  // Load deleted set
  const deletedSet = new Set<string>();
  try {
    const rawDel1 = localStorage.getItem(`waas_deleted_templates_${userId}`);
    if (rawDel1) JSON.parse(rawDel1).forEach((d: string) => deletedSet.add(String(d)));
    const rawDel2 = localStorage.getItem('waas_deleted_templates_usr_default');
    if (rawDel2) JSON.parse(rawDel2).forEach((d: string) => deletedSet.add(String(d)));
  } catch (e) {}

  const isDeleted = (id?: string, tplId?: any) => {
    if (id && deletedSet.has(String(id))) return true;
    if (tplId !== undefined && tplId !== null && deletedSet.has(String(tplId))) return true;
    return false;
  };

  const isItemMatch = (itemUserId?: string, itemEmail?: string, assignedEmail?: string) => {
    if (isAllAdminMode) return true;
    const normItemEmail = itemEmail?.toLowerCase().trim();
    const normAssignedEmail = assignedEmail?.toLowerCase().trim();

    if (!itemUserId || itemUserId === 'usr_default' || itemUserId === 'default_client' || String(itemUserId).startsWith('guest_')) {
      return true; // Allow default/guest templates for users so they don't disappear
    }

    const isRealUserQuery = (userId && userId !== 'usr_default' && !String(userId).startsWith('guest_')) || Boolean(normUserEmail);

    if (isRealUserQuery) {
      if (userId && userId !== 'usr_default' && itemUserId === userId) return true;
      if (normUserEmail && ((normItemEmail && normItemEmail === normUserEmail) || (normAssignedEmail && normAssignedEmail === normUserEmail))) return true;
      return false;
    }

    return true;
  };

  // 1. Load from ALL relevant localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isRelevantKey = isAllAdminMode || 
        key.startsWith('waas_edited_templates') || 
        key.includes('edited_templates') || 
        key.startsWith('waas_workspace') || 
        key.includes('workspace') ||
        (userId && key.includes(userId)) ||
        (normUserEmail && key.includes(normUserEmail));

      if (isRelevantKey) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const list: EditedTemplate[] = Array.isArray(parsed) ? parsed : [parsed];
            list.forEach(item => {
              if (item && (item.templateId || item.customizations || item.id)) {
                if (isDeleted(item.id, item.templateId)) return;
                if (isItemMatch(item.userId, item.userEmail, (item as any).assignedUserEmail)) {
                  const tIdStr = String(item.templateId || '1');
                  const cleanName = item.templateName && item.templateName !== 'قالب مخصص' 
                    ? item.templateName 
                    : (TEMPLATE_NAMES_MAP[tIdStr] || (item as any).name || `قالب رقم ${tIdStr}`);
                  const docId = item.id || `${item.userId || userId}_template_${tIdStr}`;

                  listMap.set(docId, {
                    ...item,
                    id: docId,
                    userId: item.userId || userId,
                    userEmail: item.userEmail || userEmail || '',
                    templateId: item.templateId || '1',
                    templateName: cleanName,
                    customizations: item.customizations || {},
                    updatedAt: normalizeDateString(item.updatedAt)
                  });
                }
              }
            });
          } catch (e) {}
        }
      }
    }
  } catch (lsErr) {
    console.warn('LocalStorage read failed:', lsErr);
  }

  // 2. Fetch from Firestore
  try {
    const snapAll = await getDocs(collection(db, 'edited_templates'));
    snapAll.forEach((doc) => {
      const data = doc.data() as EditedTemplate;
      if (isDeleted(doc.id, data.templateId)) return;
      if (isItemMatch(data.userId, data.userEmail, (data as any).assignedUserEmail)) {
        const tIdStr = String(data.templateId || '');
        const cleanName = data.templateName && data.templateName !== 'قالب مخصص' ? data.templateName : (TEMPLATE_NAMES_MAP[tIdStr] || (data as any).name || `قالب رقم ${tIdStr || '1'}`);
        listMap.set(doc.id, {
          id: doc.id,
          ...data,
          templateName: cleanName,
          updatedAt: normalizeDateString(data.updatedAt)
        });
      }
    });

    const wsSnap = await getDocs(collection(db, 'workspaces'));
    wsSnap.forEach((doc) => {
      const wsData = doc.data();
      if (isDeleted(doc.id, wsData.templateId)) return;
      if (isItemMatch(wsData.userId, wsData.userEmail, wsData.assignedUserEmail)) {
        const tIdStr = String(wsData.templateId || 1);
        const cleanName = wsData.name || wsData.templateName || TEMPLATE_NAMES_MAP[tIdStr] || `قالب رقم ${tIdStr}`;
        listMap.set(doc.id, {
          id: doc.id,
          userId: wsData.userId || userId,
          userEmail: wsData.userEmail || userEmail || '',
          templateId: wsData.templateId || 1,
          templateName: cleanName,
          customizations: wsData.customizations || {},
          updatedAt: normalizeDateString(wsData.updatedAt),
          isSubscribed: wsData.status === 'published'
        });
      }
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for edited templates, using local storage fallback.');
    } else {
      console.error('Error fetching edited templates from firestore:', err);
    }
  }

  const resultList = Array.from(listMap.values());
  resultList.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  return resultList;
};

// Fetch user active subscriptions
export const fetchUserSubscriptionsFromFirestore = async (userId: string, userEmail?: string) => {
  const isAllAdminMode = userId === 'admin_all_subscriptions';
  const normUserEmail = userEmail?.toLowerCase().trim();

  const listMap = new Map<string, any>();

  // Load deleted set
  const deletedSet = new Set<string>();
  try {
    const rawDel1 = localStorage.getItem(`waas_deleted_subscriptions_${userId}`);
    if (rawDel1) JSON.parse(rawDel1).forEach((d: string) => deletedSet.add(String(d)));
    const rawDel2 = localStorage.getItem('waas_deleted_subscriptions_usr_default');
    if (rawDel2) JSON.parse(rawDel2).forEach((d: string) => deletedSet.add(String(d)));
  } catch (e) {}

  const isSubDeleted = (id?: string, tplId?: any) => {
    if (id && deletedSet.has(String(id))) return true;
    if (tplId !== undefined && tplId !== null && deletedSet.has(String(tplId))) return true;
    return false;
  };

  const isSubMatch = (itemUserId?: string, itemEmail?: string, assignedEmail?: string) => {
    if (isAllAdminMode) return true;
    if (!itemUserId || itemUserId === 'usr_default' || itemUserId === 'default_client' || String(itemUserId).startsWith('guest_')) {
      return true;
    }
    if (userId && userId !== 'usr_default' && !String(userId).startsWith('guest_')) {
      if (itemUserId === userId) return true;
      if (normUserEmail && ((itemEmail && itemEmail.toLowerCase().trim() === normUserEmail) || (assignedEmail && assignedEmail.toLowerCase().trim() === normUserEmail))) return true;
      return false;
    }
    return true;
  };

  // 1. Load from localStorage (check user-specific or default keys)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('waas_subscriptions_')) {
        const isUserSubKey = userId && userId !== 'usr_default' && key.includes(userId);
        const isDefaultSubKey = (!userId || userId === 'usr_default' || userId.startsWith('guest_'));
        if (isUserSubKey || isDefaultSubKey) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const list: any[] = Array.isArray(parsed) ? parsed : [parsed];
              list.forEach(item => {
                if (item && (item.id || item.templateId || item.plan)) {
                  if (isSubDeleted(item.id, item.templateId)) return;
                  if (item.status === 'cancelled' || item.status === 'deleted') return;
                  if (isSubMatch(item.userId, item.userEmail, item.assignedUserEmail) || userId === 'admin_all_subscriptions') {
                    const mapKey = String(item.templateId || item.id || '1');
                    listMap.set(mapKey, item);
                  }
                }
              });
            } catch (e) {}
          }
        }
      }
    }
  } catch (lsErr) {
    console.warn('LocalStorage subscription read notice:', lsErr);
  }

  // 2. Load from Firestore
  try {
    const snapAll = await getDocs(collection(db, 'subscriptions'));
    snapAll.forEach((doc) => {
      const data = doc.data();
      if (isSubDeleted(doc.id, data.templateId)) return;
      if (data.status === 'cancelled' || data.status === 'deleted') return;
      if (isSubMatch(data.userId, data.userEmail, data.assignedUserEmail)) {
        const mapKey = String(data.templateId || doc.id);
        listMap.set(mapKey, { id: doc.id, ...data });
      }
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for subscriptions, using local storage fallback.');
    } else {
      console.error('Error fetching subscriptions from firestore:', err);
    }
  }

  const subscriptionsArray = Array.from(listMap.values());
  // Deduplicate strictly by normalized templateId keeping the latest active subscription and prioritizing user-specific records over usr_default
  const uniqueMap = new Map<string, any>();
  const getNormalizedTplId = (item: any) => {
    if (item.templateId !== undefined && item.templateId !== null && item.templateId !== '') {
      return String(item.templateId);
    }
    if (item.id) {
      const parts = String(item.id).split('_');
      const lastPart = parts[parts.length - 1];
      if (lastPart && !isNaN(Number(lastPart))) {
        return lastPart;
      }
    }
    return String(item.id || '1');
  };

  subscriptionsArray.forEach(sub => {
    const tplKey = getNormalizedTplId(sub);
    const existing = uniqueMap.get(tplKey);
    if (!existing) {
      uniqueMap.set(tplKey, sub);
    } else {
      // Prioritize non-usr_default or matching userId/email
      const existingIsDefault = !existing.userId || existing.userId === 'usr_default' || String(existing.userId).startsWith('guest_');
      const currentIsDefault = !sub.userId || sub.userId === 'usr_default' || String(sub.userId).startsWith('guest_');

      if (existingIsDefault && !currentIsDefault) {
        uniqueMap.set(tplKey, sub);
      } else if (!existingIsDefault && currentIsDefault) {
        // keep existing
      } else {
        const existingTime = new Date(existing.startDate || existing.createdAt || 0).getTime();
        const currentSubTime = new Date(sub.startDate || sub.createdAt || 0).getTime();
        if (currentSubTime > existingTime) {
          uniqueMap.set(tplKey, sub);
        }
      }
    }
  });

  const finalArray = Array.from(uniqueMap.values());
  finalArray.sort((a, b) => new Date(b.startDate || b.createdAt || 0).getTime() - new Date(a.startDate || a.createdAt || 0).getTime());
  return finalArray;
};

// Delete a Subscription
export const deleteSubscriptionInFirestore = async (id: string, userId: string, templateId?: any, userEmail?: string, templateName?: string) => {
  try {
    const tIdStr = templateId ? String(templateId) : '';
    const normEmail = userEmail?.toLowerCase().trim() || '';

    // 1. Mark as deleted in localStorage so it never re-appears
    try {
      const delKey = `waas_deleted_subscriptions_${userId}`;
      const rawDel = localStorage.getItem(delKey);
      const delList: string[] = rawDel ? JSON.parse(rawDel) : [];
      if (id && !delList.includes(id)) delList.push(id);
      if (tIdStr && !delList.includes(tIdStr)) delList.push(tIdStr);
      localStorage.setItem(delKey, JSON.stringify(delList));

      if (userId !== 'usr_default') {
        const rawDefDel = localStorage.getItem('waas_deleted_subscriptions_usr_default');
        const defDelList: string[] = rawDefDel ? JSON.parse(rawDefDel) : [];
        if (id && !defDelList.includes(id)) defDelList.push(id);
        if (tIdStr && !defDelList.includes(tIdStr)) defDelList.push(tIdStr);
        localStorage.setItem('waas_deleted_subscriptions_usr_default', JSON.stringify(defDelList));
      }
    } catch (e) {}

    // 2. LocalStorage cleanup across all keys
    try {
      const keysToClean = [`waas_subscriptions_${userId}`, 'waas_subscriptions_usr_default', 'app_subscription'];
      keysToClean.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((s: any) => 
                s.id !== id && (tIdStr === '' || String(s.templateId) !== tIdStr)
              );
              localStorage.setItem(key, JSON.stringify(filtered));
            } else if (parsed && typeof parsed === 'object') {
              if (parsed.id === id || (tIdStr && String(parsed.templateId) !== tIdStr)) {
                // keep if not matching
              } else {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {}
        }
      });
    } catch (e) {}

    // 3. Firestore Deletions
    const deleteDocSafely = async (collName: string, docId: string) => {
      if (!docId) return;
      try {
        await deleteDoc(doc(db, collName, docId));
      } catch (e) {}
    };

    // 3.5 PostgreSQL Deletions / Cancellations
    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      } else {
        token = localStorage.getItem('firebase_token') || '';
      }
      
      if (token && id && !id.startsWith('sub_') && !id.startsWith('ws_')) {
        await fetch(`/api/tenant/subscriptions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(e => console.error('Error cancelling subscription in backend:', e));
      }
    } catch (e) {}

    await Promise.all([
      deleteDocSafely('subscriptions', id),
      deleteDocSafely('subscriptions', `sub_${userId}_${templateId}`),
      deleteDocSafely('subscriptions', `sub_usr_default_${templateId}`),
      deleteDocSafely('workspaces', `ws_${id}`),
      deleteDocSafely('workspaces', `ws_${userId}_${templateId}`),
      deleteDocSafely('workspaces', `ws_usr_default_${templateId}`)
    ]);

    try {
      const snapSubs = await getDocs(collection(db, 'subscriptions'));
      snapSubs.forEach(async (d) => {
        const data = d.data();
        if (
          d.id === id ||
          (tIdStr && String(data.templateId) === tIdStr && (data.userId === userId || (normEmail && data.userEmail?.toLowerCase() === normEmail)))
        ) {
          await deleteDocSafely('subscriptions', d.id);
        }
      });
    } catch (e) {}

    // 4. Log activity so admin sees it
    try {
      await logUserActivity(
        userId,
        userEmail || 'user@domain.com',
        'إلغاء اشتراك',
        `قام العميل بإلغاء اشتراك القالب (${templateName || templateId || id})`
      );
    } catch (e) {}

    return true;
  } catch (err) {
    console.error('Error deleting subscription:', err);
    return false;
  }
};

// Cancel a Subscription
export const cancelSubscriptionInFirestore = async (
  id: string,
  userId: string,
  templateId?: any,
  userEmail?: string,
  templateName?: string,
  cancelledBy: 'customer' | 'admin' = 'customer'
) => {
  try {
    const tIdStr = templateId ? String(templateId) : '';
    
    try {
      const delKey = `waas_deleted_subscriptions_${userId}`;
      const rawDel = localStorage.getItem(delKey);
      const delArr = rawDel ? JSON.parse(rawDel) : [];
      if (id && !delArr.includes(id)) delArr.push(id);
      if (tIdStr && !delArr.includes(tIdStr)) delArr.push(tIdStr);
      localStorage.setItem(delKey, JSON.stringify(delArr));
    } catch (e) {}

    // 1. Update localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('subscription')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const updated = parsed.map((s: any) => {
                  if (s.id === id || (tIdStr && String(s.templateId) === tIdStr)) {
                    return { ...s, status: 'cancelled', cancelledBy, cancelledAt: new Date().toISOString() };
                  }
                  return s;
                });
                localStorage.setItem(key, JSON.stringify(updated));
              } else if (parsed && typeof parsed === 'object') {
                if (parsed.id === id || (tIdStr && String(parsed.templateId) === tIdStr)) {
                  parsed.status = 'cancelled';
                  parsed.cancelledBy = cancelledBy;
                  parsed.cancelledAt = new Date().toISOString();
                  localStorage.setItem(key, JSON.stringify(parsed));
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}

    // 2. Update Firestore doc if exists
    try {
      if (id) {
        await updateDoc(doc(db, 'subscriptions', id), {
          status: 'cancelled',
          cancelledBy,
          cancelledAt: new Date().toISOString()
        });
      }
    } catch (e) {
      try {
        if (id) {
          await setDoc(doc(db, 'subscriptions', id), {
            status: 'cancelled',
            cancelledBy,
            cancelledAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err2) {}
    }

    // 2.5 PostgreSQL backend cancellation
    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      } else {
        token = localStorage.getItem('firebase_token') || '';
      }
      
      if (token && templateId) {
        await fetch(`/api/tenant/subscriptions/by-template/${templateId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(e => console.error('Error cancelling subscription in backend:', e));
      } else if (token && id && !id.startsWith('sub_') && !id.startsWith('ws_')) {
        await fetch(`/api/tenant/subscriptions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(e => console.error('Error cancelling subscription in backend:', e));
      }
    } catch (e) {}

    // 3. Log activity & Create Notification
    try {
      await logUserActivity(
        userId,
        userEmail || 'user@domain.com',
        'إلغاء اشتراك',
        `تم إلغاء الاشتراك في القالب (${templateName || templateId || id}) بواسطة ${cancelledBy === 'customer' ? 'العميل' : 'الإدارة'}`
      );

      await createAppNotification({
        title: cancelledBy === 'admin' ? 'إلغاء اشتراك بواسطة الإدارة' : 'إلغاء اشتراك',
        message: cancelledBy === 'admin' 
          ? `تم إلغاء اشتراكك في القالب (${templateName || templateId || id}) بواسطة إدارة المنصة. يمكنك فتح تذكرة دعم للمساعدة.`
          : `تم إلغاء الاشتراك في القالب (${templateName || templateId || id}) عن طريقك بنجاح. تعديلات قالبك محفوظة.`,
        type: 'alert',
        targetType: 'specific',
        targetUserEmail: userEmail || ''
      });
    } catch (e) {}

    return true;
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    return false;
  }
};

// Delete Edited Template
export const deleteEditedTemplateInFirestore = async (id: string, userId: string, templateId?: any, userEmail?: string, templateName?: string) => {
  try {
    const tIdStr = templateId ? String(templateId) : '';
    const normEmail = userEmail?.toLowerCase().trim() || '';

    // 1. Mark as deleted in localStorage so it never re-appears locally
    try {
      const delKey = `waas_deleted_templates_${userId}`;
      const rawDel = localStorage.getItem(delKey);
      const delList: string[] = rawDel ? JSON.parse(rawDel) : [];
      if (id && !delList.includes(id)) delList.push(id);
      if (tIdStr && !delList.includes(tIdStr)) delList.push(tIdStr);
      localStorage.setItem(delKey, JSON.stringify(delList));

      if (userId !== 'usr_default') {
        const rawDefDel = localStorage.getItem('waas_deleted_templates_usr_default');
        const defDelList: string[] = rawDefDel ? JSON.parse(rawDefDel) : [];
        if (id && !defDelList.includes(id)) defDelList.push(id);
        if (tIdStr && !defDelList.includes(tIdStr)) defDelList.push(tIdStr);
        localStorage.setItem('waas_deleted_templates_usr_default', JSON.stringify(defDelList));
      }
    } catch (e) {}

    // 2. Clean up localStorage items matching this template or workspace
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('edited_templates') || key.includes('workspace'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const filtered = parsed.filter((e: any) => 
                  e.id !== id && 
                  (tIdStr === '' || String(e.templateId) !== tIdStr)
                );
                localStorage.setItem(key, JSON.stringify(filtered));
              } else if (parsed && typeof parsed === 'object') {
                if (parsed.id === id || (tIdStr && String(parsed.templateId) === tIdStr)) {
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}

    // 3. Firestore Deletions
    const deleteDocSafely = async (collName: string, docId: string) => {
      if (!docId) return;
      try {
        await deleteDoc(doc(db, collName, docId));
      } catch (e) {}
    };

    // Specific known Doc IDs
    await Promise.all([
      deleteDocSafely('edited_templates', id),
      deleteDocSafely('edited_templates', `${userId}_template_${templateId}`),
      deleteDocSafely('edited_templates', `usr_default_template_${templateId}`),
      deleteDocSafely('workspaces', id),
      deleteDocSafely('workspaces', `ws_${id}`),
      deleteDocSafely('workspaces', `${userId}_template_${templateId}`),
      deleteDocSafely('workspaces', `ws_${userId}_${templateId}`),
      deleteDocSafely('workspaces', `ws_usr_default_${templateId}`)
    ]);

    // Query Firestore collections to catch any other matching documents
    try {
      const snapEdits = await getDocs(collection(db, 'edited_templates'));
      snapEdits.forEach(async (d) => {
        const data = d.data();
        if (
          d.id === id ||
          (tIdStr && String(data.templateId) === tIdStr && (data.userId === userId || (normEmail && data.userEmail?.toLowerCase() === normEmail)))
        ) {
          await deleteDocSafely('edited_templates', d.id);
        }
      });
    } catch (e) {}

    try {
      const snapWs = await getDocs(collection(db, 'workspaces'));
      snapWs.forEach(async (d) => {
        const data = d.data();
        if (
          d.id === id ||
          (tIdStr && String(data.templateId) === tIdStr && (data.userId === userId || (normEmail && data.userEmail?.toLowerCase() === normEmail)))
        ) {
          await deleteDocSafely('workspaces', d.id);
        }
      });
    } catch (e) {}

    // 4. Log activity so admin sees it
    try {
      await logUserActivity(
        userId,
        userEmail || 'user@domain.com',
        'حذف قالب معدل',
        `قام العميل بحذف القالب المعدل (${templateName || templateId || id})`
      );
    } catch (e) {}

    return true;
  } catch (err) {
    console.error('Error deleting edited template:', err);
    return false;
  }
};

// Create a Subscription
export const createSubscriptionInFirestore = async (
  userId: string,
  userEmail: string,
  templateId: number | string,
  templateName: string,
  plan: 'monthly' | 'yearly' | string,
  price: string,
  customizations: any
) => {
  const subDocId = `sub_${userId}_${templateId}`;
  const now = new Date();

  // Accumulate renewal duration if active subscription already exists
  let baseDate = now;
  try {
    const localSubKey = `waas_subscriptions_${userId}`;
    const rawSubs = localStorage.getItem(localSubKey);
    const subList = rawSubs ? JSON.parse(rawSubs) : [];
    const existingActive = subList.find((s: any) => String(s.templateId) === String(templateId) && s.status === 'active');
    if (existingActive && existingActive.renewalDate) {
      const oldExpiry = new Date(existingActive.renewalDate);
      if (oldExpiry > now) {
        baseDate = oldExpiry;
      }
    }
  } catch (e) {}

  const expiry = new Date(baseDate);
  const planStr = String(plan).toLowerCase();
  if (planStr.includes('yearly' ) || planStr.includes('سنوية')) {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else if (planStr.includes('starter') || planStr.includes('مجانية') || price === '0.00') {
    expiry.setDate(expiry.getDate() + 3);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  const planTitle = planStr.includes('yearly') || planStr.includes('سنوية') 
    ? `باقة سنوية (${price})` 
    : (planStr.includes('starter') || planStr.includes('مجانية') || price === '0.00' ? 'باقة التجربة المجانية (3 أيام)' : `باقة شهرية (${price})`);

  const subData = {
    id: subDocId,
    userId,
    userEmail,
    templateId,
    templateName,
    plan,
    planTitle,
    price,
    status: 'active',
    startDate: now.toISOString(),
    renewalDate: expiry.toISOString(),
    customizations,
    createdAt: new Date().toISOString()
  };

  // 1. Sync to LocalStorage for instant UI updates
  try {
    const localSubKey = `waas_subscriptions_${userId}`;
    const rawSubs = localStorage.getItem(localSubKey);
    const subList = rawSubs ? JSON.parse(rawSubs) : [];
    const filteredSubs = subList.filter((s: any) => String(s.templateId) !== String(templateId));
    filteredSubs.push(subData);
    localStorage.setItem(localSubKey, JSON.stringify(filteredSubs));

    // Also mark template in edited_templates as subscribed in LocalStorage
    const localEditKey = `waas_edited_templates_${userId}`;
    const rawEdits = localStorage.getItem(localEditKey);
    if (rawEdits) {
      const editList: EditedTemplate[] = JSON.parse(rawEdits);
      const updatedEdits = editList.map(item => {
        if (String(item.templateId) === String(templateId)) {
          return { ...item, isSubscribed: true };
        }
        return item;
      });
      localStorage.setItem(localEditKey, JSON.stringify(updatedEdits));
    }
  } catch (lsErr) {
    console.warn('LocalStorage subscription save notice:', lsErr);
  }

  // 2. Async save to Firestore
  try {
    const subRef = doc(db, 'subscriptions', subDocId);
    await setDoc(subRef, { ...subData, createdAt: serverTimestamp() });

    // Mark edited template as subscribed or remove from drafts
    const draftDocId = `${userId}_template_${templateId}`;
    const draftRef = doc(db, 'edited_templates', draftDocId);
    await setDoc(draftRef, { isSubscribed: true }, { merge: true });

    // Also sync to workspaces collection for site rendering
    const wsRef = doc(db, 'workspaces', `ws_${subDocId}`);
    await setDoc(wsRef, {
      userId,
      userEmail,
      name: templateName,
      templateId,
      customizations,
      status: 'published',
      updatedAt: serverTimestamp()
    });

    // Log Activity
    await logUserActivity(
      userId,
      userEmail,
      'اشتراك جديد',
      `اشترك بنجاح في القالب (${templateName}) - الخطة: ${planTitle} - المبلغ: ${price}`
    );

    // Create subscription notification
    await createAppNotification({
      title: `تفعيل اشتراك جديد بنجاح 🎉`,
      message: `تم تفعيل اشتراكك في القالب (${templateName}) بنجاح على ${planTitle}. تاريخ التجديد القادم: ${expiry.toLocaleDateString('ar-SA')}`,
      type: 'success',
      targetType: 'specific',
      targetUserId: userId,
      targetUserEmail: userEmail,
      sender: 'النظام الآلي للاشتراكات'
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore subscription save notice: permissions restricted, saved locally via LocalStorage.');
    } else {
      console.warn('Firestore subscription save notice:', errMsg);
    }
  }

  return subData;
};

// Fetch all activities for a specific user (for Admin Client Details)
export const fetchUserActivities = async (userId: string, userEmail?: string) => {
  const listMap = new Map<string, UserActivity>();

  // 1. Try LocalStorage fallback first
  try {
    const rawLocal = localStorage.getItem('waas_user_activities');
    if (rawLocal) {
      const localList: UserActivity[] = JSON.parse(rawLocal);
      localList.forEach(act => {
        if (!userId || userId === 'usr_default' || act.userId === userId || act.userEmail === userEmail || (userEmail && act.userEmail === userEmail)) {
          if (act.id) listMap.set(act.id, act);
        }
      });
    }
  } catch (e) {}

  // 2. Try Firestore
  try {
    const snapshot = await getDocs(collection(db, 'user_activities'));
    snapshot.forEach((doc) => {
      const data = doc.data() as UserActivity;
      if (!userId || userId === 'usr_default' || data.userId === userId || data.userEmail === userEmail || (userEmail && data.userEmail === userEmail)) {
        listMap.set(doc.id, { id: doc.id, ...data });
      }
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for user activities, using local fallback.');
    } else {
      console.warn('Error fetching user activities from firestore:', errMsg);
    }
  }

  let list = Array.from(listMap.values());
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return list;
};

// Save User Interest Quiz Answers to LocalStorage, Firestore and API
export const saveUserQuizAnswers = async (userId: string, userEmail: string, answers: any) => {
  if (!answers) return;
  const timestamp = new Date().toISOString();
  const quizRecord = {
    userId,
    userEmail,
    answers,
    updatedAt: timestamp
  };

  // 1. LocalStorage
  try {
    localStorage.setItem('user_quiz_answers', JSON.stringify(answers));
    localStorage.setItem('user_quiz_completed', 'true');
    if (userId) {
      localStorage.setItem(`user_quiz_answers_${userId}`, JSON.stringify(quizRecord));
    }
  } catch (e) {
    console.warn('LocalStorage save quiz answers failed:', e);
  }

  // 2. Firestore
  try {
    const docKey = userId && userId !== 'usr_default' ? userId : (userEmail || 'usr_default');
    const quizRef = doc(db, 'user_quiz_answers', docKey);
    await setDoc(quizRef, { ...quizRecord, createdAt: serverTimestamp() }, { merge: true });

    // Also log user activity
    await logUserActivity(
      userId,
      userEmail,
      'إكمال استبيان الاهتمامات 🎯',
      `أجاب على استبيان الاهتمامات: المجال (${answers.categoryLabel || answers.category})، الهدف (${answers.goalLabel || answers.goal})، النمط (${answers.styleLabel || answers.style})`
    );
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore save quiz answers notice: permissions restricted, saved locally.');
    } else {
      console.warn('Firestore save quiz answers error:', errMsg);
    }
  }

  // 3. API endpoint
  try {
    await fetch('/api/user/quiz-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: userEmail, answers })
    });
  } catch (err) {
    console.warn('API save quiz answers error:', err);
  }

  return quizRecord;
};

// Fetch User Quiz Answers from Firestore or LocalStorage
export const fetchUserQuizAnswers = async (userId: string, userEmail?: string) => {
  // 1. Try LocalStorage
  try {
    if (userId) {
      const raw = localStorage.getItem(`user_quiz_answers_${userId}`);
      if (raw) return JSON.parse(raw);
    }
    const globalRaw = localStorage.getItem('user_quiz_answers');
    if (globalRaw) {
      return { answers: JSON.parse(globalRaw) };
    }
  } catch (e) {}

  // 2. Try Firestore
  try {
    const docKey = userId && userId !== 'usr_default' ? userId : (userEmail || '');
    if (docKey) {
      const snap = await getDocs(query(collection(db, 'user_quiz_answers'), where('userId', '==', userId)));
      if (!snap.empty) {
        return snap.docs[0].data();
      }
      if (userEmail) {
        const snapEmail = await getDocs(query(collection(db, 'user_quiz_answers'), where('userEmail', '==', userEmail)));
        if (!snapEmail.empty) {
          return snapEmail.docs[0].data();
        }
      }
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for quiz answers, using local fallback.');
    } else {
      console.warn('Error fetching quiz answers from firestore:', errMsg);
    }
  }

  return null;
};

// Admin Notes for Client Management
export interface ClientAdminNote {
  id?: string;
  userId: string;
  userEmail: string;
  author: string;
  note: string;
  createdAt: string;
}

export const fetchClientNotes = async (userId: string, userEmail?: string) => {
  const localMap = new Map<string, ClientAdminNote>();

  // 1. Read from LocalStorage fallback
  try {
    const key = `waas_client_notes_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: ClientAdminNote[] = JSON.parse(raw);
      parsed.forEach(n => { if (n.id) localMap.set(n.id, n); });
    }

    const allRaw = localStorage.getItem('waas_all_client_notes');
    if (allRaw) {
      const parsedAll: ClientAdminNote[] = JSON.parse(allRaw);
      parsedAll.forEach(n => {
        if ((n.userId === userId || (userEmail && n.userEmail?.toLowerCase() === userEmail.toLowerCase())) && n.id) {
          localMap.set(n.id, n);
        }
      });
    }
  } catch (e) {}

  // 2. Try Firestore
  try {
    const snap = await getDocs(collection(db, 'client_admin_notes'));
    snap.forEach((d) => {
      const data = d.data() as ClientAdminNote;
      if (data.userId === userId || (userEmail && data.userEmail?.toLowerCase() === userEmail.toLowerCase())) {
        localMap.set(d.id, { id: d.id, ...data });
      }
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for client admin notes, using local fallback.');
    } else {
      console.warn('Error fetching client admin notes from firestore:', errMsg);
    }
  }

  const list = Array.from(localMap.values());
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
};

export const addClientNote = async (userId: string, userEmail: string, note: string, author: string = 'الإدارة') => {
  if (!note || !note.trim()) return null;
  const noteData: ClientAdminNote = {
    id: `note_${Date.now()}`,
    userId,
    userEmail,
    author,
    note: note.trim(),
    createdAt: new Date().toISOString()
  };

  // 1. Save to LocalStorage fallback
  try {
    const key = `waas_client_notes_${userId}`;
    const raw = localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : [];
    existing.unshift(noteData);
    localStorage.setItem(key, JSON.stringify(existing));

    const allRaw = localStorage.getItem('waas_all_client_notes');
    const allList = allRaw ? JSON.parse(allRaw) : [];
    allList.unshift(noteData);
    localStorage.setItem('waas_all_client_notes', JSON.stringify(allList));
  } catch (e) {}

  // 2. Try Firestore
  try {
    const ref = await addDoc(collection(db, 'client_admin_notes'), cleanFirestoreData(noteData));
    return { id: ref.id, ...noteData };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for adding client note, saved locally.');
    } else {
      console.warn('Error adding client admin note to firestore:', errMsg);
    }
    return noteData;
  }
};

// Support Tickets System
export interface SupportTicket {
  id?: string;
  ticketNumber: string;
  userId: string;
  userEmail: string;
  userName?: string;
  category: string;
  subject: string;
  message: string;
  attachment?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
  clientReply?: string;
  clientAttachment?: string;
  createdAt: string;
}

export const createSupportTicket = async (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'status' | 'ticketNumber'>) => {
  const ticketNumber = '#' + Math.floor(1000 + Math.random() * 9000);
  const tempId = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newTicket: SupportTicket = {
    id: tempId,
    ...ticketData,
    ticketNumber,
    status: 'open',
    createdAt: new Date().toISOString()
  };

  // Always save locally in localStorage first for 100% reliability
  try {
    const existing = JSON.parse(localStorage.getItem('app_support_tickets') || '[]');
    localStorage.setItem('app_support_tickets', JSON.stringify([newTicket, ...existing]));
  } catch (e) {
    console.error('Error saving support ticket to localStorage:', e);
  }

  try {
    const rawData = cleanFirestoreData({
      ...ticketData,
      ticketNumber,
      status: 'open',
      createdAt: newTicket.createdAt
    });
    const ref = await addDoc(collection(db, 'support_tickets'), rawData);
    newTicket.id = ref.id;

    // Update local storage item ID to reflect firestore ID
    try {
      const existing = JSON.parse(localStorage.getItem('app_support_tickets') || '[]');
      const updated = existing.map((t: any) => t.ticketNumber === ticketNumber ? { ...t, id: ref.id } : t);
      localStorage.setItem('app_support_tickets', JSON.stringify(updated));
    } catch (e) {}

    // Also log activity
    await logUserActivity(
      ticketData.userId,
      ticketData.userEmail,
      'فتح تذكرة دعم فني',
      `تم فتح التذكرة رقم ${ticketNumber} بخصوص (${ticketData.subject})`,
      ticketData.userName || ticketData.userEmail
    ).catch(() => {});

    await createAppNotification({
      title: `تم استلام تذكرتك (${ticketNumber}) بنجاح 🎧`,
      message: `تم استلام استفسارك بخصوص (${ticketData.subject}). فريق الدعم الفني يراجع طلبك وسيقوم بالرد عليك قريباً.`,
      type: 'ticket',
      targetType: 'specific',
      targetUserId: ticketData.userId,
      targetUserEmail: ticketData.userEmail,
      sender: 'فريق الدعم الفني',
      ticketId: ref.id
    }).catch(() => {});

    return newTicket;
  } catch (err) {
    console.error('Error creating support ticket in firestore:', err);
    return newTicket;
  }
};

export const fetchSupportTickets = async () => {
  const map = new Map<string, SupportTicket>();

  // 1. Load local fallback
  try {
    const localList = JSON.parse(localStorage.getItem('app_support_tickets') || '[]');
    for (const t of localList) {
      if (t && t.id) map.set(t.id, t);
    }
  } catch (e) {}

  // 2. Fetch from Firestore
  try {
    const snap = await getDocs(collection(db, 'support_tickets'));
    snap.forEach((d) => {
      const data = d.data() as SupportTicket;
      map.set(d.id, { id: d.id, ...data });
    });
  } catch (err: any) {
    console.info('Firestore support tickets fetch note:', err?.message || err);
  }

  const list = Array.from(map.values());
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
};

export const updateSupportTicketStatus = async (
  ticketId: string, 
  status: SupportTicket['status'], 
  reply?: string, 
  repliedBy?: string,
  targetUser?: { userId?: string; userEmail?: string; ticketNumber?: string; subject?: string }
) => {
  try {
    // Update local storage first
    try {
      const existing = JSON.parse(localStorage.getItem('app_support_tickets') || '[]');
      const updated = existing.map((t: any) => {
        if (t.id === ticketId || t.ticketNumber === targetUser?.ticketNumber) {
          return {
            ...t,
            status,
            reply: reply !== undefined ? reply : t.reply,
            repliedBy: repliedBy !== undefined ? repliedBy : t.repliedBy,
            repliedAt: repliedBy !== undefined ? new Date().toISOString() : t.repliedAt
          };
        }
        return t;
      });
      localStorage.setItem('app_support_tickets', JSON.stringify(updated));
    } catch (e) {}

    const docRef = doc(db, 'support_tickets', ticketId);
    const updateData: any = { status };
    if (reply !== undefined) updateData.reply = reply;
    if (repliedBy !== undefined) {
      updateData.repliedBy = repliedBy;
      updateData.repliedAt = new Date().toISOString();
    }
    await updateDoc(docRef, updateData).catch(() => {});

    // Automatically trigger notification to the client if targetUser info provided
    if (targetUser && (targetUser.userId || targetUser.userEmail)) {
      const statusLabel = status === 'in_progress' ? 'قيد المعالجة والتحقيق 🟡' :
                          status === 'resolved' ? 'تم الحل والرد عليها 🟢' :
                          status === 'closed' ? 'مغلقة ⚪' : 'مفتوحة 🔴';
      
      const notifMsg = reply ? `تم الرد على تذكرتك (${targetUser.subject || targetUser.ticketNumber}): "${reply}" | الحالة: ${statusLabel}` : `تم تحديث حالة تذكرتك (${targetUser.subject || targetUser.ticketNumber}) إلى: ${statusLabel}`;
      
      await createAppNotification({
        title: `تحديث بشأن تذكرة الدعم ${targetUser.ticketNumber || ''}`,
        message: notifMsg,
        type: 'ticket',
        targetType: 'specific',
        targetUserId: targetUser.userId,
        targetUserEmail: targetUser.userEmail,
        sender: repliedBy || 'فريق الدعم الفني',
        ticketId
      }).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error('Error updating support ticket:', err);
    return false;
  }
};

export const addUserReplyToSupportTicket = async (
  ticketId: string,
  clientReply: string,
  clientAttachment?: string,
  ticketInfo?: { ticketNumber?: string; subject?: string; userId?: string; userEmail?: string; userName?: string }
) => {
  try {
    try {
      const existing = JSON.parse(localStorage.getItem('app_support_tickets') || '[]');
      const updated = existing.map((t: any) => {
        if (t.id === ticketId || t.ticketNumber === ticketInfo?.ticketNumber) {
          return {
            ...t,
            clientReply,
            clientAttachment: clientAttachment || t.clientAttachment,
            status: 'open'
          };
        }
        return t;
      });
      localStorage.setItem('app_support_tickets', JSON.stringify(updated));
    } catch (e) {}

    const docRef = doc(db, 'support_tickets', ticketId);
    const updateData: any = {
      clientReply,
      status: 'open'
    };
    if (clientAttachment) {
      updateData.clientAttachment = clientAttachment;
    }
    await updateDoc(docRef, updateData).catch(() => {});

    if (ticketInfo) {
      await logUserActivity(
        ticketInfo.userId || '',
        ticketInfo.userEmail || '',
        'تحديث تذكرة دعم',
        `أرسل العميل معلومات جديدة/رد على التذكرة ${ticketInfo.ticketNumber}: ${clientReply}`,
        ticketInfo.userName || ticketInfo.userEmail
      ).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('Error adding user reply to support ticket:', err);
    return false;
  }
};

// System & User Notifications
export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'ticket' | 'alert' | 'success' | 'promo' | 'system';
  targetType: 'all' | 'specific';
  targetUserId?: string;
  targetUserEmail?: string;
  sender?: string;
  createdAt: string;
  readBy?: string[];
  ticketId?: string;
}

const isDuplicateNotification = (list: AppNotification[], notif: AppNotification): boolean => {
  return list.some(existing => {
    if (existing.id === notif.id) return true;
    const sameMessage = (existing.message || "").trim().toLowerCase() === (notif.message || "").trim().toLowerCase();
    const sameTitle = (existing.title || '').trim().toLowerCase() === (notif.title || '').trim().toLowerCase();
    

    if (sameTitle && sameMessage) {
      const t1 = new Date(existing.createdAt).getTime();
      const t2 = new Date(notif.createdAt).getTime();
      if (isNaN(t1) || isNaN(t2) || Math.abs(t1 - t2) < 15 * 60 * 1000) {
        return true;
      }
    }
    return false;
  });
};

const saveLocalNotification = (notif: AppNotification) => {
  try {
    const stored: AppNotification[] = JSON.parse(localStorage.getItem('app_local_notifications') || '[]');
    if (!isDuplicateNotification(stored, notif)) {
      stored.unshift(notif);
      localStorage.setItem('app_local_notifications', JSON.stringify(stored.slice(0, 50)));
    }
  } catch (e) {
    console.error('Error saving local notification', e);
  }
};

export const createAppNotification = async (
  data: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>
) => {
  const newNotif: AppNotification = {
    ...data,
    readBy: [],
    createdAt: new Date().toISOString()
  };

  // 1. Sync to backend SQL DB via API
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetEmail: data.targetUserEmail || null,
          title: data.title,
          message: data.message,
          isRequired: data.type === 'alert' ? 1 : 0
        })
      });
    }
  } catch (e) {
    console.warn('Notice syncing notification to SQL endpoint:', e);
  }

  // 2. Save to Firestore
  try {
    const ref = await addDoc(collection(db, 'app_notifications'), cleanFirestoreData(newNotif));
    const result = { id: ref.id, ...newNotif };
    saveLocalNotification(result);
    return result;
  } catch (err: any) {
    const fallbackNotif: AppNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      ...newNotif
    };
    saveLocalNotification(fallbackNotif);
    return fallbackNotif;
  }
};

export const fetchUserNotifications = async (userId?: string, userEmail?: string) => {
  const list: AppNotification[] = [];

  // 1. Fetch from server API
  try {
    let token = '';
    if (auth.currentUser) {
       token = await auth.currentUser.getIdToken();
    } else {
       token = localStorage.getItem('firebase_token') || '';
    }
    
    if (token) {
      const res = await fetch('/api/tenant/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.notifications) {
          data.notifications.forEach((n: any) => {
             list.push({
               id: n.id ? `pg_notif_${n.id}` : `srv_${Date.now()}_${Math.random()}`,
               title: n.title,
               message: n.message,
               type: n.type || 'system',
               readBy: n.isRead === 1 ? [userId] : [],
               createdAt: n.createdAt,
               targetType: 'specific',
               targetUserId: userId
             });
          });
        }
      }
    }
  } catch (e) {
    // Non-critical fallback for offline or unauthenticated state
    console.debug('Server notifications fetch skipped/fallback active:', e);
  }

  // 2. Fetch from local storage fallback
  try {
    const stored: AppNotification[] = JSON.parse(localStorage.getItem('app_local_notifications') || '[]');
    stored.forEach(notif => {
      const isGlobal = notif.targetType === 'all' && !notif.targetUserId && !notif.targetUserEmail;
      const matchesUser = (userId && notif.targetUserId === userId) || 
                          (userEmail && notif.targetUserEmail?.toLowerCase() === userEmail?.toLowerCase());
      // If notification has a target user/email specified, it must match current user. If no target specified or targetType == all (without specific user), it's global.
      const isAllowed = isGlobal || matchesUser || (!notif.targetUserId && !notif.targetUserEmail);
      if (
        isAllowed &&
        !isDuplicateNotification(list, notif)
      ) {
        list.push(notif);
      }
    });
  } catch (e) {}

  // 3. Fetch from Firestore app_notifications
  try {
    const snap = await getDocs(collection(db, 'app_notifications'));
    snap.forEach((d) => {
      const notif = { id: d.id, ...d.data() as AppNotification };
      const isGlobal = notif.targetType === 'all' && !notif.targetUserId && !notif.targetUserEmail;
      const matchesUser = (userId && notif.targetUserId === userId) || 
                          (userEmail && notif.targetUserEmail?.toLowerCase() === userEmail?.toLowerCase());
      const isAllowed = isGlobal || matchesUser || (!notif.targetUserId && !notif.targetUserEmail);
      if (
        isAllowed &&
        !isDuplicateNotification(list, notif)
      ) {
        list.push(notif);
      }
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for user notifications.');
    } else {
      console.warn('Error fetching Firestore user notifications:', err);
    }
  }

  // Filter out any site-specific customer orders or clinic appointments just in case
  const cleanList = list.filter(n => {
    const title = (n.title || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();
    if (
      title.includes('حجز موعد') ||
      title.includes('طلب جديد') ||
      msg.includes('حجز موعد') ||
      msg.includes('طلب جديد') ||
      msg.includes('وصل طلب جديد') ||
      msg.includes('قام المريض') ||
      msg.includes('طلب جديد برقم') ||
      n.id?.startsWith('db_notif_')
    ) {
      return false;
    }
    return true;
  });

  cleanList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return cleanList;
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  // Always update local storage first
  try {
    const stored: AppNotification[] = JSON.parse(localStorage.getItem('app_local_notifications') || '[]');
    let updated = false;
    const newStored = stored.map(notif => {
      if (notif.id === notificationId) {
        updated = true;
        const readBy = notif.readBy || [];
        if (!readBy.includes(userId)) readBy.push(userId);
        return { ...notif, readBy };
      }
      return notif;
    });
    if (updated) {
      localStorage.setItem('app_local_notifications', JSON.stringify(newStored));
    }
  } catch (e) {}

  if (notificationId.startsWith('pg_notif_') || notificationId.startsWith('db_notif_')) {
    const rawId = notificationId.replace('pg_notif_', '').replace('db_notif_', '');
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch(`/api/tenant/notifications/${rawId}/read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      return true;
    } catch (e) {
      console.warn('Error marking DB notification as read:', e);
      return false;
    }
  }

  // Skip Firestore for local notifications
  if (notificationId.startsWith('local_') || notificationId.startsWith('srv_')) {
     return true;
  }

  try {
    const docRef = doc(db, 'app_notifications', notificationId);
    const snap = await getDocs(collection(db, 'app_notifications'));
    let currentReadBy: string[] = [];
    snap.forEach(d => {
      if (d.id === notificationId) {
        currentReadBy = (d.data().readBy || []) as string[];
      }
    });
    if (!currentReadBy.includes(userId)) {
      currentReadBy.push(userId);
      await updateDoc(docRef, { readBy: currentReadBy });
    }
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for marking notifications read, saved locally.');
      return true;
    }
    console.warn('Error marking notification read:', err);
    return false;
  }
};

export const fetchAllNotificationsAdmin = async () => {
  const list: AppNotification[] = [];

  // 1. Fetch from SQL DB via admin endpoint
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const res = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        (data.notifications || []).forEach((n: any) => {
          const item: AppNotification = {
            id: `db_notif_${n.id}`,
            title: n.title,
            message: n.message,
            type: n.isRequired ? 'alert' : 'info',
            targetType: n.targetEmail ? 'specific' : 'all',
            targetUserEmail: n.targetEmail || undefined,
            createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
            readBy: n.isRead ? ['admin'] : [],
            sender: 'إدارة المنصة'
          };
          if (!isDuplicateNotification(list, item)) {
            list.push(item);
          }
        });
      }
    }
  } catch (e) {
    console.warn('Notice fetching admin DB notifications:', e);
  }

  // 2. Fetch from local storage fallback
  try {
    const stored: AppNotification[] = JSON.parse(localStorage.getItem('app_local_notifications') || '[]');
    stored.forEach(notif => {
      if (!isDuplicateNotification(list, notif)) {
        list.push(notif);
      }
    });
  } catch (e) {}

  // 3. Fetch from Firestore app_notifications
  try {
    const snap = await getDocs(collection(db, 'app_notifications'));
    snap.forEach((d) => {
      const notif = { id: d.id, ...d.data() as AppNotification };
      if (!isDuplicateNotification(list, notif)) {
        list.push(notif);
      }
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.code === 'permission-denied' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient')) {
      console.info('Firestore notice: permissions restricted for admin notifications.');
    } else {
      console.warn('Error fetching Firestore admin notifications:', err);
    }
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
};

export const deleteNotificationAdmin = async (notifId: string) => {
  if (notifId.startsWith('db_notif_')) {
    return true;
  }
  try {
    await deleteDoc(doc(db, 'app_notifications', notifId));
    return true;
  } catch (err) {
    console.error('Error deleting notification:', err);
    return false;
  }
};

export const fetchUserSupportTickets = async (userId?: string, userEmail?: string) => {
  const map = new Map<string, SupportTicket>();

  // 1. Load local fallback
  try {
    const localList = JSON.parse(localStorage.getItem('app_support_tickets') || '[]');
    for (const t of localList) {
      if (t) {
        if (
          !userId && !userEmail ||
          (userId && t.userId === userId) ||
          (userEmail && t.userEmail?.toLowerCase().trim() === userEmail?.toLowerCase().trim()) ||
          t.userId === 'usr_guest'
        ) {
          map.set(t.id || t.ticketNumber, t);
        }
      }
    }
  } catch (e) {}

  // 2. Fetch from Firestore
  try {
    const snap = await getDocs(collection(db, 'support_tickets'));
    snap.forEach((d) => {
      const data = d.data() as SupportTicket;
      if (
        !userId && !userEmail ||
        (userId && data.userId === userId) ||
        (userEmail && data.userEmail?.toLowerCase().trim() === userEmail?.toLowerCase().trim()) ||
        data.userId === 'usr_guest'
      ) {
        map.set(d.id, { id: d.id, ...data });
      }
    });
  } catch (err: any) {
    console.info('Firestore user support tickets fetch note:', err?.message || err);
  }

  const list = Array.from(map.values());
  // If list is still empty, include all local tickets as fallback
  if (list.length === 0) {
    try {
      const localList = JSON.parse(localStorage.getItem('app_support_tickets') || '[]');
      for (const t of localList) {
        if (t) map.set(t.id || t.ticketNumber, t);
      }
    } catch (e) {}
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
};


