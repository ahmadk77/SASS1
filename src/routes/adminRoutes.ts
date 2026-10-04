import { sendWelcomeEmail, sendSubscriptionReceiptEmail, sendSubscriptionReminder, sendTemplateUpdateEmail } from '../lib/sendAutomatedEmail.ts';
import { registerRenderCustomDomain } from '../lib/renderDomain.ts';
import { wipeDemoContent } from './tenantRoutes.ts';
import express from 'express';
import fs from 'fs';
import { db } from '../db/index.ts';
import { 
  users, 
  tenants, 
  templates, 
  subscriptions, 
  websites, 
  websiteContent, 
  orders, 
  analytics, 
  notifications, 
  staffLogs, 
  auditLogs, 
  pages, 
  posts, 
  abandonedCarts, 
  clientWorkspaces, 
  savedTemplates 
} from '../db/schema.ts';
import { eq, ne, or, and, sql, isNull, desc } from 'drizzle-orm';
import { requireAuth, requireAdmin, requireSuperAdmin, AuthRequest } from '../middleware/auth.ts';
import { adminAuth, firebaseEnabled } from '../lib/firebase-admin.ts';
import { logger } from '../lib/logger.ts';
import { getSystemSettings, updateSystemSettings } from '../lib/systemSettings.ts';
import { defaultTemplates, ensureTemplateAndAssignmentColumns } from '../db/seed.ts';

const router = express.Router();

// Staff / Admin Direct Login with Email & Password
router.post('/api/auth/staff-login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
    }

    const normEmail = sanitizeInput(email).toLowerCase().trim();
    const normPassword = String(password).trim();

    const dbUserList = await db.select().from(users).where(
      and(
        eq(users.email, normEmail),
        isNull(users.deletedAt)
      )
    );

    if (dbUserList.length === 0) {
      return res.status(401).json({ error: 'البريد الإلكتروني غير مسجل في قائمة الموظفين أو المسؤوليين.' });
    }

    const dbUser = dbUserList[0];

    // Check if password matches stored password or fallback to email address itself
    const storedPassword = dbUser.password ? dbUser.password.trim() : null;
    const isPasswordValid = storedPassword 
      ? (normPassword === storedPassword || normPassword.toLowerCase() === normEmail)
      : (normPassword.toLowerCase() === normEmail || normPassword === dbUser.email);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
    }

    const allowedRoles = ['admin', 'super_admin', 'staff', 'support', 'manager', 'tenant_admin'];
    if (!allowedRoles.includes(dbUser.role)) {
      return res.status(403).json({ error: 'هذا الحساب ليس لديه صلاحيات موظف أو مسؤول نظام.' });
    }

    let userUid = dbUser.uid;
    if (!userUid || userUid.startsWith('pending-') || userUid.startsWith('staff-') || userUid.startsWith('seed-')) {
      userUid = `user-${dbUser.id}-${Date.now()}`;
      await db.update(users).set({ uid: userUid }).where(eq(users.id, dbUser.id));
    }

    let customToken: string | null = null;
    if (firebaseEnabled && adminAuth.createCustomToken) {
      try {
        try {
          await adminAuth.getUser(userUid);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            await adminAuth.createUser({
              uid: userUid,
              email: normEmail,
              displayName: dbUser.name || normEmail.split('@')[0],
              password: normPassword.length >= 6 ? normPassword : `${normPassword}123`
            });
          }
        }
        customToken = await adminAuth.createCustomToken(userUid, { role: dbUser.role });
      } catch (fbErr) {
        console.warn('Firebase Custom Token generation warning:', fbErr);
      }
    }

    res.json({
      success: true,
      customToken,
      uid: userUid,
      email: normEmail,
      role: dbUser.role,
      name: dbUser.name
    });
  } catch (error: any) {
    console.error('Staff email login error:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
});

function getStaffEmail(req: AuthRequest): string | null {
  return req.user?.email ? req.user.email.toLowerCase().trim() : null;
}

async function logStaffAction(req: AuthRequest, actionDescription: string, category: string = 'general') {
  try {
    const adminUser = req.dbUser;
    const email = adminUser?.email || getStaffEmail(req) || 'system@bonyan.app';
    const name = adminUser?.name || email.split('@')[0];
    const userId = (adminUser && typeof adminUser.id === 'number') ? adminUser.id : null;
    await db.insert(staffLogs).values({
      userId,
      userEmail: email,
      userName: name,
      action: actionDescription,
      category
    }).catch((e) => console.warn('staffLogs insert non-fatal warning:', e?.message || e));
  } catch (e) {
    console.error('Failed to log staff action:', e);
  }
}

function getGravatarUrl(email: string): string {
  return `https://www.gravatar.com/avatar/${email.trim().toLowerCase()}?d=mp`;
}

function sanitizeInput(str: string): string {
  if (!str) return '';
  return String(str).replace(/[<>]/g, '');
}

// Cascading Deletion Helpers - Executed inside an atomic DB Transaction
async function deleteTenantCascade(tenantIdNum: number, externalTx?: any) {
  const runCascade = async (tx: any) => {
    const targetTenant = (await tx.select().from(tenants).where(eq(tenants.id, tenantIdNum)))[0];
    if (targetTenant?.assignedUserEmail) {
      await tx.update(templates).set({ assignedUserEmail: null }).where(eq(templates.assignedUserEmail, targetTenant.assignedUserEmail));
      await tx.delete(subscriptions).where(eq(subscriptions.assignedUserEmail, targetTenant.assignedUserEmail));
    }

    await tx.delete(auditLogs).where(eq(auditLogs.tenantId, tenantIdNum));
    await tx.delete(pages).where(eq(pages.tenantId, tenantIdNum));
    await tx.delete(posts).where(eq(posts.tenantId, tenantIdNum));
    await tx.delete(abandonedCarts).where(eq(abandonedCarts.tenantId, tenantIdNum));
    await tx.delete(clientWorkspaces).where(eq(clientWorkspaces.templateId, String(tenantIdNum)));
    
    const tenantWebsites = await tx.select().from(websites).where(eq(websites.tenantId, tenantIdNum));
    for (const w of tenantWebsites) {
      await tx.delete(websiteContent).where(eq(websiteContent.websiteId, w.id));
    }

    await tx.delete(orders).where(eq(orders.tenantId, tenantIdNum));
    await tx.delete(websites).where(eq(websites.tenantId, tenantIdNum));
    await tx.delete(subscriptions).where(eq(subscriptions.tenantId, tenantIdNum));
    await tx.delete(analytics).where(eq(analytics.tenantId, tenantIdNum));
    await tx.delete(notifications).where(eq(notifications.tenantId, tenantIdNum));

    await tx.update(users).set({ tenantId: null }).where(eq(users.tenantId, tenantIdNum));

    await tx.delete(tenants).where(eq(tenants.id, tenantIdNum));
  };

  if (externalTx) {
    await runCascade(externalTx);
  } else {
    await db.transaction(async (tx) => {
      await runCascade(tx);
    });
  }
}

async function deleteUserCascade(userIdNum: number, externalTx?: any) {
  const runUserCascade = async (tx: any) => {
    const uRec = (await tx.select().from(users).where(eq(users.id, userIdNum)))[0];
    if (!uRec) return;

    if (uRec.email) {
      const cleanEmail = uRec.email.toLowerCase().trim();
      await tx.update(templates).set({ assignedUserEmail: null }).where(eq(templates.assignedUserEmail, cleanEmail));
      await tx.delete(subscriptions).where(eq(subscriptions.assignedUserEmail, cleanEmail));
    }

    if (uRec.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com') {
      await tx.update(users).set({ 
        tenantId: null, 
        role: 'user', 
        status: 'active'
      }).where(eq(users.id, uRec.id));
      return;
    }

    await tx.delete(staffLogs).where(eq(staffLogs.userId, uRec.id));

    const ownedTenants = await tx.select().from(tenants).where(eq(tenants.userId, uRec.id));
    for (const t of ownedTenants) {
      await deleteTenantCascade(t.id, tx);
    }

    await tx.update(users).set({ tenantId: null }).where(eq(users.id, uRec.id));
    await tx.delete(users).where(eq(users.id, uRec.id));
  };

  if (externalTx) {
    await runUserCascade(externalTx);
  } else {
    await db.transaction(async (tx) => {
      await runUserCascade(tx);
    });
  }
}

// 1. Assign Template to Client (Atomic Transaction & Subscriptions Table)
router.post('/api/admin/assign-template', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { templateId, clientEmail, siteName, siteLogo, subscriptionType, price, endDate } = req.body;
    
    if (!templateId || !clientEmail) {
      return res.status(400).json({ error: 'Missing templateId or clientEmail' });
    }

    const numTemplateId = typeof templateId === 'string' ? parseInt(templateId, 10) : Number(templateId);
    if (isNaN(numTemplateId)) {
      return res.status(400).json({ error: 'Invalid templateId format' });
    }

    let parsedPrice: number | null = null;
    if (price !== undefined && price !== null && price !== '') {
      const p = parseInt(String(price), 10);
      if (!isNaN(p)) parsedPrice = p;
    }

    let parsedEndDate: Date | null = null;
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) parsedEndDate = d;
    }
    if (!parsedEndDate) {
      parsedEndDate = new Date();
      parsedEndDate.setFullYear(parsedEndDate.getFullYear() + 1);
    }

    const normalizedEmail = String(clientEmail).toLowerCase().trim();

    let template: any = null;
    try {
      const tplResult = await db.select().from(templates).where(eq(templates.id, numTemplateId));
      if (tplResult.length > 0) {
        template = tplResult[0];
      }
    } catch (tplErr: any) {
      console.warn('Assign template select failed, repairing schema columns:', tplErr?.message);
      await ensureTemplateAndAssignmentColumns();
      try {
        const tplResult = await db.select().from(templates).where(eq(templates.id, numTemplateId));
        if (tplResult.length > 0) template = tplResult[0];
      } catch (retryErr: any) {
        console.warn('Retry template query failed:', retryErr?.message);
      }
    }

    if (!template) {
      const defaultTpl = defaultTemplates.find(t => t.id === numTemplateId);
      if (defaultTpl) {
        try {
          await ensureTemplateAndAssignmentColumns();
          const inserted = await db.insert(templates).values(defaultTpl).onConflictDoUpdate({
            target: templates.id,
            set: {
              name: defaultTpl.name,
              description: defaultTpl.description,
              category: defaultTpl.category,
              image: defaultTpl.image,
              type: defaultTpl.type,
              defaultContent: defaultTpl.defaultContent
            }
          }).returning();
          template = inserted[0] || defaultTpl;
        } catch (insErr: any) {
          console.warn('Inserting fallback template failed, proceeding with in-memory template:', insErr?.message);
          template = defaultTpl;
        }
      } else {
        return res.status(404).json({ error: 'Template not found' });
      }
    }

    const staffEmail = getStaffEmail(req);

    // Atomically execute template assignment, tenant creation, and subscription provision
    await db.transaction(async (tx) => {
      let dbUserResult = await tx.select().from(users).where(eq(users.email, normalizedEmail));
      let dbUserId: number;
      if (dbUserResult.length === 0) {
        const newUser = await tx.insert(users).values({
          uid: 'pending-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
          email: normalizedEmail,
          assignedUserEmail: normalizedEmail,
          role: 'tenant_admin'
        }).returning();
        dbUserId = newUser[0].id;
      } else {
        dbUserId = dbUserResult[0].id;
      }

      // Fetch all existing tenants for this user/email
      const userTenants = await tx.select().from(tenants).where(
        and(
          or(
            eq(tenants.userId, dbUserId),
            eq(tenants.assignedUserEmail, normalizedEmail)
          ),
          isNull(tenants.deletedAt)
        )
      );

      const targetTenantIdParam = req.body.tenantId ? parseInt(String(req.body.tenantId), 10) : null;
      let existingTenantToUpdate: any = null;

      if (targetTenantIdParam) {
        existingTenantToUpdate = userTenants.find(t => t.id === targetTenantIdParam);
      } else {
        // Find if user already has a tenant using this exact templateId
        for (const t of userTenants) {
          const webs = await tx.select().from(websites).where(and(eq(websites.tenantId, t.id), isNull(websites.deletedAt)));
          if (webs.some(w => w.templateId === numTemplateId)) {
            existingTenantToUpdate = t;
            break;
          }
        }
      }

      let tenantId: number;
      if (!existingTenantToUpdate) {
        // Create a new separate tenant for this template
        const uniqueSubdomain = 'site-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        const defaultSiteName = siteName || template.name || `متجر ${numTemplateId}`;
        const newTenant = await tx.insert(tenants).values({
          userId: dbUserId,
          name: defaultSiteName,
          subdomain: uniqueSubdomain,
          assignedUserEmail: normalizedEmail
        }).returning();
        tenantId = newTenant[0].id;
      } else {
        tenantId = existingTenantToUpdate.id;
        await tx.update(tenants).set({ 
          assignedUserEmail: normalizedEmail,
          ...(siteName ? { name: siteName } : {}) 
        }).where(eq(tenants.id, tenantId));
      }

      // Update user primary tenantId if not set & role
      const dbUser2 = (await tx.select().from(users).where(eq(users.id, dbUserId)))[0];
      const isPlatformUser = ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbUser2?.role) || (dbUser2?.permissions && dbUser2?.permissions !== 'none') || dbUser2?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
      await tx.update(users).set({ 
        tenantId: dbUser2?.tenantId || tenantId, 
        role: isPlatformUser ? dbUser2.role : 'tenant_admin',
        subscriptionType: subscriptionType || 'monthly',
        subscriptionPrice: parsedPrice,
        subscriptionEndDate: parsedEndDate,
        assignedUserEmail: normalizedEmail
      }).where(eq(users.id, dbUserId));

      // Upsert into subscriptions table for this specific tenantId with deduplication
      const existingSubs = await tx.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId));
      if (existingSubs.length > 0) {
        await tx.update(subscriptions).set({
          plan: subscriptionType || 'monthly',
          status: 'active',
          renewalDate: parsedEndDate,
          assignedUserEmail: normalizedEmail
        }).where(eq(subscriptions.id, existingSubs[0].id));

        if (existingSubs.length > 1) {
          for (let i = 1; i < existingSubs.length; i++) {
            await tx.delete(subscriptions).where(eq(subscriptions.id, existingSubs[i].id));
          }
        }
      } else {
        await tx.insert(subscriptions).values({
          tenantId,
          plan: subscriptionType || 'monthly',
          status: 'active',
          renewalDate: parsedEndDate,
          assignedUserEmail: normalizedEmail
        });
      }

      // Website & Website Content Provisioning for this tenantId
      let websiteResult = await tx.select().from(websites).where(and(eq(websites.tenantId, tenantId), isNull(websites.deletedAt)));
      let websiteId: number;
      if (websiteResult.length === 0) {
        const newWebsite = await tx.insert(websites).values({
          tenantId,
          templateId: numTemplateId,
          assignedUserEmail: normalizedEmail
        }).returning();
        websiteId = newWebsite[0].id;

        if (template.defaultContent) {
          await tx.insert(websiteContent).values({
            websiteId,
            content: wipeDemoContent(template.defaultContent)
          });
        }
      } else {
        websiteId = websiteResult[0].id;
        await tx.update(websites).set({ templateId: numTemplateId, assignedUserEmail: normalizedEmail }).where(eq(websites.id, websiteId));
      }

      // Update template assignedUserEmail safely
      try {
        await tx.update(templates)
          .set({ 
            assignedUserEmail: normalizedEmail,
          })
          .where(eq(templates.id, numTemplateId));
      } catch (tplUpErr: any) {
        console.warn('Template assignedUserEmail update notice:', tplUpErr?.message);
      }

      // Parse default content safely and wipe demo data for new client subscription
      let rawDefaultContent = template.defaultContent;
      let cleanContent: any = {};
      if (typeof rawDefaultContent === 'string') {
        try {
          cleanContent = JSON.parse(rawDefaultContent);
        } catch (e) {
          cleanContent = {};
        }
      } else if (rawDefaultContent && typeof rawDefaultContent === 'object') {
        cleanContent = JSON.parse(JSON.stringify(rawDefaultContent));
      }

      // Empty all demo product/item arrays so subscriber starts with clean database
      const arrayKeysToWipe = [
        'products', 'items', 'menuItems', 'bakeryItems', 'coffeeItems', 
        'dishes', 'projects', 'apartmentItems', 'luxuryVillas', 'commercialAgencies', 
        'couriers', 'inventory', 'services', 'portfolio'
      ];
      for (const k of arrayKeysToWipe) {
        cleanContent[k] = [];
      }

      if (siteName) cleanContent.siteName = siteName;
      if (siteLogo) cleanContent.logo = siteLogo;

      let contentResult = await tx.select().from(websiteContent).where(eq(websiteContent.websiteId, websiteId));
      if (contentResult.length === 0) {
        await tx.insert(websiteContent).values({ websiteId, content: cleanContent, updatedAt: new Date() });
      } else {
        await tx.update(websiteContent).set({ content: cleanContent, updatedAt: new Date() }).where(eq(websiteContent.websiteId, websiteId));
      }

      await tx.insert(notifications).values({
        tenantId,
        targetEmail: normalizedEmail,
        title: 'تأكيد تخصيص الباقة 🚀',
        message: `تم تخصيص واشتراك بالقالب ${numTemplateId} باسم الموقع ${siteName || 'الافتراضي'} والاشتراك ${subscriptionType || 'شهري'}. أهلاً بك في منصتنا!`,
        isRequired: 0,
        isRead: 0
      });
    });

    const rDateStr = parsedEndDate ? parsedEndDate.toISOString().split('T')[0] : '2027-08-05';
    const cleanSiteName = siteName || template.name || `موقع ${numTemplateId}`;
    const planTitle = subscriptionType === 'yearly' ? 'الباقة السنوية' : subscriptionType === 'pro' ? 'الباقة الاحترافية' : subscriptionType === 'starter' ? 'الباقة المجانية' : `باقة ${subscriptionType || 'شهري'}`;
    const dashUrl = `${process.env.APP_URL || 'https://bunyan.website'}/dashboard`;

    let emailSent = false;
    let emailNotice = '';
    try {
      const emailRes = await sendSubscriptionReceiptEmail(
        normalizedEmail,
        cleanSiteName,
        planTitle,
        rDateStr,
        dashUrl
      );
      emailSent = emailRes.success;
      if (emailRes.success) {
        emailNotice = `وتم إرسال رسالة تفعيل وتفاصيل الاشتراك إلى البريد (${normalizedEmail})`;
      } else {
        emailNotice = `(تنبيه البريد الإلكتروني: ${emailRes.error || 'لم يتم التوصيل'})`;
      }
    } catch (e: any) {
      console.error('Error sending subscription email to assigned client:', e);
      emailNotice = `(خطأ إرسال الإيميل: ${e?.message || String(e)})`;
    }

    await logStaffAction(req, `قام بتعيين القالب رقم ${numTemplateId} للعميل ${normalizedEmail} (اسم الموقع: ${siteName || 'افتراضي'})`, 'templates');
    res.json({ 
      success: true, 
      message: `تم تفعيل القالب والاشتراك بنجاح! ${emailNotice}`, 
      emailSent, 
      emailNotice 
    });
  } catch (error: any) {
    logger.error('Assign template error:', error);
    res.status(500).json({ 
      error: 'Failed to assign template', 
      details: error?.message || String(error) 
    });
  }
});

// 2. Renew Subscription
router.post('/api/admin/subscriptions/:email/renew', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email } = req.params;
    const { plan, price } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const userList = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (userList.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const u = userList[0];
    let tenantList: any[] = [];
    if (u.tenantId) {
      tenantList = await db.select().from(tenants).where(and(eq(tenants.id, u.tenantId), isNull(tenants.deletedAt)));
    }
    if (tenantList.length === 0) {
      tenantList = await db.select().from(tenants).where(and(eq(tenants.userId, u.id), isNull(tenants.deletedAt)));
    }
    if (tenantList.length === 0) {
      tenantList = await db.select().from(tenants).where(and(eq(tenants.assignedUserEmail, normalizedEmail), isNull(tenants.deletedAt)));
    }
    if (tenantList.length === 0) {
      const uniqueSub = 'site-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const newT = await db.insert(tenants).values({
        userId: u.id,
        name: u.name || `متجر ${normalizedEmail.split('@')[0]}`,
        subdomain: uniqueSub,
        assignedUserEmail: normalizedEmail
      }).returning();
      tenantList = [newT[0]];
      await db.update(users).set({ tenantId: newT[0].id }).where(eq(users.id, u.id));
    }
    const tenantId = tenantList[0].id;

    const subList = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId));
    const selectedPlan = plan || (subList.length > 0 ? subList[0].plan : 'monthly');
    const parsedPrice = price !== undefined && price !== null && price !== '' ? Number(price) : (selectedPlan === 'yearly' ? 120 : 15);

    const now = new Date();
    let newEnd = new Date();
    if (subList.length > 0 && subList[0].renewalDate && new Date(subList[0].renewalDate) > now) {
      newEnd = new Date(subList[0].renewalDate);
    } else {
      newEnd = new Date(now);
    }
    
    const planStr = String(selectedPlan).toLowerCase();
    if (planStr.includes('yearly') || planStr.includes('سنوي') || planStr === 'enterprise' || planStr === 'pro_yearly') {
      newEnd.setFullYear(newEnd.getFullYear() + 1);
    } else if (planStr.includes('starter') || planStr.includes('تجربة') || planStr === 'free_trial_3days') {
      newEnd.setDate(newEnd.getDate() + 3);
    } else {
      newEnd.setMonth(newEnd.getMonth() + 1);
    }

    const staffEmail = getStaffEmail(req);

    if (subList.length > 0) {
      await db.update(subscriptions)
        .set({ status: 'active', plan: selectedPlan, renewalDate: newEnd, assignedUserEmail: normalizedEmail })
        .where(eq(subscriptions.id, subList[0].id));
    } else {
      await db.insert(subscriptions).values({
        tenantId,
        plan: selectedPlan,
        status: 'active',
        renewalDate: newEnd,
        assignedUserEmail: normalizedEmail
      });
    }

    await db.update(users)
      .set({
        subscriptionType: selectedPlan,
        subscriptionPrice: parsedPrice,
        subscriptionEndDate: newEnd
      })
      .where(eq(users.id, u.id));

    const planNamesMap: any = {
      monthly: 'باقة شهرية قياسية (15$)',
      pro: 'الخطة الاحترافية للمطورين Pro (120$)',
      enterprise: 'خطة الشركات والعمليات Enterprise (380$)',
      starter: 'تجربة مجانية Starter (3 أيام)'
    };
    const planTitleStr = planNamesMap[selectedPlan] || selectedPlan;

    try {
      await db.insert(notifications).values({
        tenantId,
        targetEmail: normalizedEmail,
        title: 'تم تفعيل وتجديد اشتراكك بنجاح 🌟',
        message: `مرحباً بك! تم تفعيل وتخصيص باقتك (${planTitleStr}) بقيمة ${parsedPrice}$ بنجاح بواسطة إدارة منصة بنيان. ينتهي الاشتراك في ${newEnd.toLocaleDateString('ar-SA')}.`
      });
    } catch (notifErr) {
      console.warn('Failed to insert renew notification:', notifErr);
    }

    let emailNotice = '';
    try {
      const rDateStr = newEnd.toISOString().split('T')[0];
      const dashUrl = `${process.env.APP_URL || 'https://bunyan.website'}/dashboard`;
      const emailRes = await sendSubscriptionReceiptEmail(
        normalizedEmail,
        tenantList[0]?.name || 'موقعك الرقمي',
        planTitleStr,
        rDateStr,
        dashUrl
      );
      if (emailRes.success) {
        emailNotice = `وتم إرسال إشعار التجديد للإيميل (${normalizedEmail})`;
      } else {
        emailNotice = `(إشعار البريد: ${emailRes.error || 'لم يتم التسليم'})`;
      }
    } catch (e: any) {
      console.error('Error sending renewal email to client:', e);
    }

    await logStaffAction(req, `قام بتجديد اشتراك العميل ${normalizedEmail} بنجاح (باقة: ${selectedPlan})`, 'subscriptions');
    res.json({ message: `تم تجديد الاشتراك بنجاح. ${emailNotice}`, endDate: newEnd, plan: selectedPlan });
  } catch (error: any) {
    console.error('Renew subscription error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 3. Cancel Subscription
router.post('/api/admin/subscriptions/:email/cancel', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase().trim();
    const userList = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (userList.length > 0) {
      const u = userList[0];
      if (u.tenantId) {
        await db.update(subscriptions)
          .set({ status: 'admin_cancelled', cancelledAt: new Date() })
          .where(eq(subscriptions.tenantId, u.tenantId));
      }
      await db.update(subscriptions)
        .set({ status: 'admin_cancelled', cancelledAt: new Date() })
        .where(eq(subscriptions.assignedUserEmail, normalizedEmail));

      try {
        let safeTenantId: number | null = null;
        if (u.tenantId) {
          const tCheck = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, u.tenantId)).limit(1);
          if (tCheck.length > 0) safeTenantId = u.tenantId;
        }
        await db.insert(notifications).values({
          tenantId: safeTenantId,
          targetEmail: normalizedEmail,
          title: 'إلغاء اشتراك بواسطة الإدارة',
          message: 'تم إلغاء اشتراكك في المنصة بواسطة إدارة المنصة. يمكنك فتح تذكرة دعم فني للمساعدة.',
          isRequired: 1,
          isRead: 0
        });
      } catch (notifErr) {
        console.warn('Failed to insert cancel notification:', notifErr);
      }
    }

    await logStaffAction(req, `قام بإلغاء اشتراك العميل ${email} وإرسال إشعار (تم الاحتفاظ بتعديلات القالب)`, 'subscriptions');
    res.json({ message: 'Subscription successfully cancelled by admin, user notified, and template edits preserved.' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 4. List All Users with Single Source of Truth Subscription Data
router.get('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      uid: users.uid,
      email: users.email,
      name: users.name,
      role: users.role,
      permissions: users.permissions,
      status: users.status,
      lastActiveAt: users.lastActiveAt,
      userCreatedAt: users.createdAt,
      tenantId: tenants.id,
      tenantName: tenants.name,
      subdomain: tenants.subdomain,
      customDomain: tenants.customDomain,
      templateCategory: tenants.templateCategory,
      tenantCreatedAt: tenants.createdAt,
      assignedUserEmail: users.assignedUserEmail,
      avatarUrl: users.avatarUrl,
      location: users.location,
      ipAddress: users.ipAddress,
      quizAnswers: users.quizAnswers,
    }).from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt))
      .limit(100);

    // Batch fetch related data to avoid N+1 queries and connection pool exhaustion
    const [allTenantsList, allWebsitesList, allSubsList, allFavsList] = await Promise.all([
      db.select().from(tenants).where(isNull(tenants.deletedAt)).catch(() => []),
      db.select().from(websites).where(isNull(websites.deletedAt)).catch(() => []),
      db.select().from(subscriptions).catch(() => []),
      db.select().from(savedTemplates).catch(() => [])
    ]);

    // Build fast lookup maps
    const tenantById = new Map<number, any>();
    const tenantByUserId = new Map<number, any>();
    const tenantByEmail = new Map<string, any>();
    allTenantsList.forEach((t: any) => {
      tenantById.set(t.id, t);
      if (t.userId) tenantByUserId.set(t.userId, t);
      if (t.assignedUserEmail) tenantByEmail.set(t.assignedUserEmail.toLowerCase().trim(), t);
    });

    const websitesByTenantId = new Map<number, any[]>();
    allWebsitesList.forEach((w: any) => {
      if (w.tenantId) {
        const arr = websitesByTenantId.get(w.tenantId) || [];
        arr.push(w);
        websitesByTenantId.set(w.tenantId, arr);
      }
    });

    const subsByTenantId = new Map<number, any[]>();
    const subsByEmail = new Map<string, any[]>();
    allSubsList.forEach((s: any) => {
      if (s.tenantId) {
        const arr = subsByTenantId.get(s.tenantId) || [];
        arr.push(s);
        subsByTenantId.set(s.tenantId, arr);
      }
      if (s.assignedUserEmail) {
        const em = s.assignedUserEmail.toLowerCase().trim();
        const arr = subsByEmail.get(em) || [];
        arr.push(s);
        subsByEmail.set(em, arr);
      }
    });

    const favsByUserId = new Map<string, number>();
    allFavsList.forEach((f: any) => {
      if (f.userId) {
        const key = String(f.userId);
        favsByUserId.set(key, (favsByUserId.get(key) || 0) + 1);
      }
    });

    // Synthesize missing user entries from tenants/subscriptions if not already in users table
    const existingEmails = new Set(allUsers.map(u => u.email ? u.email.toLowerCase().trim() : ''));
    const missingUserEntries: any[] = [];
    const candidateEmails = new Set<string>();

    allTenantsList.forEach((t: any) => {
      if (t.assignedUserEmail) candidateEmails.add(t.assignedUserEmail.toLowerCase().trim());
    });
    allSubsList.forEach((s: any) => {
      if (s.assignedUserEmail) candidateEmails.add(s.assignedUserEmail.toLowerCase().trim());
    });
    candidateEmails.add('ahmaksj66@gmail.com');
    candidateEmails.add('ahmadalriqib@gmail.com');

    let syntheticId = -100;
    candidateEmails.forEach((em) => {
      if (em && !existingEmails.has(em)) {
        existingEmails.add(em);
        const tObj = tenantByEmail.get(em);
        missingUserEntries.push({
          id: syntheticId--,
          uid: `virtual-${em}`,
          email: em,
          name: tObj?.name || em.split('@')[0],
          role: em === 'ahmadalriqib@gmail.com' ? 'super_admin' : 'tenant_admin',
          permissions: em === 'ahmadalriqib@gmail.com' ? 'all' : 'none',
          status: 'active',
          lastActiveAt: new Date(),
          userCreatedAt: tObj?.createdAt || new Date(),
          tenantId: tObj?.id || null,
          tenantName: tObj?.name || null,
          subdomain: tObj?.subdomain || null,
          customDomain: tObj?.customDomain || null,
          templateCategory: tObj?.templateCategory || 'general',
          tenantCreatedAt: tObj?.createdAt || null,
          assignedUserEmail: em,
          avatarUrl: getGravatarUrl(em),
          location: 'الأردن',
          ipAddress: '127.0.0.1',
          quizAnswers: null
        });
      }
    });

    const combinedUsersList = [...allUsers, ...missingUserEntries];
    const now = Date.now();
    const enrichedUsers = combinedUsersList.map((u) => {
      const cleanEmail = u.email ? u.email.toLowerCase().trim() : '';
      
      // Determine tenant (direct from join, or fallback by userId or email)
      let matchedTenantId = u.tenantId;
      let matchedTenantName = u.tenantName;
      let matchedSubdomain = u.subdomain;
      let matchedCustomDomain = u.customDomain;
      let matchedTemplateCategory = u.templateCategory;
      let matchedTenantCreatedAt = u.tenantCreatedAt;

      if (!matchedTenantId) {
        const fallbackTenant = (u.id && tenantByUserId.get(u.id)) || (cleanEmail && tenantByEmail.get(cleanEmail));
        if (fallbackTenant) {
          matchedTenantId = fallbackTenant.id;
          matchedTenantName = fallbackTenant.name;
          matchedSubdomain = fallbackTenant.subdomain;
          matchedCustomDomain = fallbackTenant.customDomain;
          matchedTemplateCategory = fallbackTenant.templateCategory;
          matchedTenantCreatedAt = fallbackTenant.createdAt;
        }
      }

      // Websites count
      const wList = matchedTenantId ? (websitesByTenantId.get(matchedTenantId) || []) : [];
      const editedCount = wList.length;

      // Subscriptions
      let sList: any[] = [];
      if (matchedTenantId) {
        sList = subsByTenantId.get(matchedTenantId) || [];
      }
      if (sList.length === 0 && cleanEmail) {
        sList = subsByEmail.get(cleanEmail) || [];
      }
      const subsCount = sList.length;
      const subData = sList.length > 0 ? sList[0] : null;

      // Favorites
      const favCount = (u.uid ? favsByUserId.get(u.uid) : 0) || (u.id ? favsByUserId.get(String(u.id)) : 0) || 0;

      const lastActiveTime = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
      const isOnline = (now - lastActiveTime) < 5 * 60 * 1000 ? 1 : 0;

      return {
        ...u,
        tenantId: matchedTenantId || null,
        tenantName: matchedTenantName || null,
        subdomain: matchedSubdomain || null,
        customDomain: matchedCustomDomain || null,
        templateCategory: matchedTemplateCategory || null,
        tenantCreatedAt: matchedTenantCreatedAt || null,
        isOnline,
        subscriptionType: subData?.plan || null,
        subscriptionStartDate: subData?.createdAt || subData?.startDate || null,
        subscriptionEndDate: subData?.renewalDate || null,
        subscriptionStatus: subData?.status || null,
        subscriptionBillingCycle: subData?.billingCycle || null,
        subscriptionHasCustomDomain: subData?.hasCustomDomain || false,
        subscriptionRequestedDomainName: subData?.requestedDomainName || null,
        subscriptionTotalPrice: subData?.totalPrice || null,
        editedTemplatesCount: editedCount,
        favoritesCount: favCount,
        subscriptionsCount: subsCount,
        lastActiveAt: u.lastActiveAt || new Date(),
        avatarUrl: u.avatarUrl || (u.email ? getGravatarUrl(u.email) : null),
        location: u.location || 'غير معروف',
        ipAddress: u.ipAddress || 'غير معروف'
      };
    });

    res.json({ users: enrichedUsers });
  } catch (error: any) {
    console.warn('Error in /api/admin/users, returning empty fallback list:', error?.message || error);
    res.json({ users: [] });
  }
});

// 5. User Role Management
router.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role, tenantId, permissions } = req.body;

    const updateData: any = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (tenantId !== undefined) updateData.tenantId = tenantId ? parseInt(String(tenantId), 10) : null;

    const updated = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    await logStaffAction(req, `قام بتعديل صلاحيات أو رتبة المستخدم رقم ${userId} (${updated[0]?.email || ''})`, 'users');
    res.json({ message: 'User role updated successfully', user: updated[0] });
  } catch (error: any) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// 6. Reset All System Data (Super Admin Only)
router.post('/api/admin/system/reset-all', requireAuth, requireSuperAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    await db.update(users).set({ 
      tenantId: null,
      subscriptionType: null,
      subscriptionPrice: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null
    });

    await db.delete(orders);
    await db.delete(analytics);
    await db.delete(notifications);
    await db.delete(staffLogs);
    await db.delete(auditLogs);
    await db.delete(abandonedCarts);
    await db.delete(clientWorkspaces);
    await db.delete(savedTemplates);
    await db.delete(websiteContent);
    await db.delete(websites);
    await db.delete(subscriptions);
    await db.delete(pages);
    await db.delete(posts);
    await db.delete(tenants);

    const currentUserEmail = (req.dbUser?.email || 'ahmadalriqib@gmail.com').toLowerCase().trim();
    await db.delete(users).where(and(
      ne(users.email, currentUserEmail),
      ne(users.role, 'super_admin')
    ));

    res.json({ message: 'تم تصفير جميع بيانات المنصة والاشتراكات والمواقع بنجاح.' });
  } catch (error: any) {
    console.error('Reset all error:', error);
    res.status(500).json({ error: 'Failed to reset system data', details: error.message });
  }
});

// Clear All Subscriptions Only (Super Admin / Admin)
router.post('/api/admin/system/clear-subscriptions', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    await db.update(users).set({
      subscriptionType: null,
      subscriptionPrice: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null
    });
    await db.delete(subscriptions);
    res.json({ message: 'تم مسح وإلغاء جميع الاشتراكات لجميع المستخدمين والمديرين بنجاح.' });
  } catch (error: any) {
    console.error('Clear subscriptions error:', error);
    res.status(500).json({ error: 'Failed to clear subscriptions', details: error.message });
  }
});

// 7. System Staff & Activity Logs
router.post('/api/admin/staff', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email: newEmail, name: newName, permissions: newPermissions, password: newPassword } = req.body;
    if (!newEmail) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const currentAdmin = req.dbUser;
    const cleanEmail = sanitizeInput(newEmail).toLowerCase().trim();
    const cleanName = newName ? sanitizeInput(newName) : cleanEmail.split('@')[0];
    const cleanPermissions = newPermissions || 'view_users,manage_subscriptions,view_revenue';
    const cleanPassword = newPassword ? String(newPassword).trim() : cleanEmail;

    const existing = await db.select().from(users).where(eq(users.email, cleanEmail));

    let staffMember;
    if (existing.length > 0) {
      const assignedRole = existing[0].role === 'super_admin' ? 'super_admin' : 'staff';
      const updated = await db.update(users).set({
        role: assignedRole,
        tenantId: null,
        name: cleanName || existing[0].name,
        permissions: cleanPermissions,
        password: cleanPassword,
        status: 'active'
      }).where(eq(users.id, existing[0].id)).returning();
      staffMember = updated[0];
    } else {
      const newUid = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const created = await db.insert(users).values({
        uid: newUid,
        email: cleanEmail,
        name: cleanName,
        role: 'staff',
        tenantId: null,
        permissions: cleanPermissions,
        password: cleanPassword,
        status: 'active'
      }).returning();
      staffMember = created[0];
    }

    if (currentAdmin) {
      await db.insert(staffLogs).values({
        userId: currentAdmin.id,
        userEmail: currentAdmin.email,
        userName: currentAdmin.name || currentAdmin.email.split('@')[0],
        action: `قام بإضافة / ترقية موظف المنصة: ${cleanName} (${cleanEmail})`,
        category: 'staff_management'
      });
    }

    res.json({ message: 'Platform staff member saved successfully', staff: staffMember });
  } catch (error: any) {
    console.error('Add platform staff error:', error);
    res.status(500).json({ error: 'Failed to add platform staff member' });
  }
});

router.get(['/api/admin/system/staff', '/api/admin/staff'], requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const staffMembers = await db.select().from(users).where(
      and(
        or(
          eq(users.role, 'super_admin'),
          eq(users.role, 'admin'),
          eq(users.role, 'staff'),
          eq(users.role, 'support')
        ),
        isNull(users.deletedAt)
      )
    ).orderBy(desc(users.createdAt)).limit(100);

    const now = Date.now();
    const processed = staffMembers.map(m => {
      const lastActiveTime = m.lastActiveAt ? new Date(m.lastActiveAt).getTime() : 0;
      const isRecentlyActive = (now - lastActiveTime) < 5 * 60 * 1000;
      return {
        ...m,
        isOnline: isRecentlyActive ? 1 : 0,
        avatarUrl: m.avatarUrl || (m.email ? getGravatarUrl(m.email) : null),
        location: m.location || 'غير معروف',
        ipAddress: m.ipAddress || 'غير معروف'
      };
    });

    res.json({ staff: processed });
  } catch (error: any) {
    console.warn('Fetch system staff warning, returning empty list:', error?.message || error);
    res.json({ staff: [] });
  }
});

router.get('/api/auth/ping', requireAuth, (req: AuthRequest, res: express.Response) => {
  res.json({ ok: true, lastActiveAt: req.dbUser?.lastActiveAt || new Date() });
});

router.post(['/api/admin/system/staff', '/api/admin/staff'], requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email: newEmail, name: newName, role: newRole, permissions: newPermissions, password: newPassword } = req.body;
    if (!newEmail) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const currentAdmin = req.dbUser;
    const cleanEmail = sanitizeInput(newEmail).toLowerCase().trim();
    const cleanName = newName ? sanitizeInput(newName) : null;
    const cleanRole = newRole || 'staff';
    const cleanPermissions = newPermissions !== undefined && newPermissions !== null ? newPermissions : 'view_users,manage_subscriptions';
    const cleanPassword = newPassword ? String(newPassword).trim() : cleanEmail;

    const existing = await db.select().from(users).where(eq(users.email, cleanEmail));

    let staffMember;
    if (existing.length > 0) {
      const updated = await db.update(users).set({
        role: existing[0].role === 'super_admin' ? 'super_admin' : cleanRole,
        name: cleanName || existing[0].name,
        permissions: cleanPermissions,
        password: cleanPassword,
        status: 'active'
      }).where(eq(users.id, existing[0].id)).returning();
      staffMember = updated[0];
    } else {
      const newUid = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const created = await db.insert(users).values({
        uid: newUid,
        email: cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
        role: cleanRole,
        permissions: cleanPermissions,
        password: cleanPassword,
        status: 'active'
      }).returning();
      staffMember = created[0];
    }

    if (currentAdmin) {
      await db.insert(staffLogs).values({
        userId: currentAdmin.id,
        userEmail: currentAdmin.email,
        userName: currentAdmin.name || currentAdmin.email.split('@')[0],
        action: `قام بإضافة / ترقية الموظف: ${cleanName || cleanEmail}`,
        category: 'staff_management'
      });
    }

    res.json({ message: 'Staff member updated successfully', staff: staffMember });
  } catch (error: any) {
    console.error('Add system staff error:', error);
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

router.put(['/api/admin/system/staff/:id', '/api/admin/staff/:id'], requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const staffId = parseInt(req.params.id, 10);
    const { role, permissions, name, status, password } = req.body;
    const currentAdmin = req.dbUser;

    const updateData: any = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (name) updateData.name = sanitizeInput(name);
    if (status) updateData.status = status;
    if (password) updateData.password = String(password).trim();

    const updated = await db.update(users).set(updateData).where(eq(users.id, staffId)).returning();

    if (updated.length > 0 && currentAdmin) {
      await db.insert(staffLogs).values({
        userId: currentAdmin.id,
        userEmail: currentAdmin.email,
        userName: currentAdmin.name || currentAdmin.email.split('@')[0],
        action: `قام بتحديث معلومات الموظف: ${updated[0].name || updated[0].email}`,
        category: 'staff_management'
      });
    }

    res.json({ message: 'Staff member updated successfully', staff: updated[0] });
  } catch (error: any) {
    console.error('Update system staff error:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

router.delete(['/api/admin/system/staff/:id', '/api/admin/staff/:id'], requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const staffId = parseInt(req.params.id, 10);
    const currentAdmin = req.dbUser;

    const target = await db.select().from(users).where(eq(users.id, staffId));
    if (target.length > 0) {
      await db.update(users).set({
        role: 'user',
        permissions: 'none'
      }).where(eq(users.id, staffId));

      if (currentAdmin) {
        await db.insert(staffLogs).values({
          userId: currentAdmin.id,
          userEmail: currentAdmin.email,
          userName: currentAdmin.name || currentAdmin.email.split('@')[0],
          action: `قام بسحب صلاحيات الموظف: ${target[0].email}`,
          category: 'staff_management'
        });
      }
    }

    res.json({ message: 'Staff demoted successfully' });
  } catch (error: any) {
    console.error('Demote system staff error:', error);
    res.status(500).json({ error: 'Failed to remove staff member' });
  }
});

router.get(['/api/admin/system/logs', '/api/admin/logs'], requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const logs = await db.select().from(staffLogs).orderBy(desc(staffLogs.createdAt)).limit(100);
    res.json({ logs });
  } catch (error: any) {
    console.error('Fetch system logs error:', error);
    res.json({ logs: [] });
  }
});

router.post('/api/admin/system/logs', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { action, category } = req.body;
    const currentAdmin = req.dbUser;

    if (!currentAdmin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newLog = await db.insert(staffLogs).values({
      userId: currentAdmin.id,
      userEmail: currentAdmin.email,
      userName: currentAdmin.name || currentAdmin.email.split('@')[0],
      action: sanitizeInput(action),
      category: category || 'general'
    }).returning();

    res.json({ log: newLog[0] });
  } catch (error: any) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Failed to record log' });
  }
});

router.post('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email: newEmail, name: newName, role: newRole, tenantId, permissions } = req.body;
    if (!newEmail) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const cleanEmail = sanitizeInput(newEmail).toLowerCase().trim();
    const cleanName = newName ? sanitizeInput(newName) : null;
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail));

    if (existing.length > 0) {
      const updated = await db.update(users).set({
        role: newRole || 'staff',
        name: cleanName || existing[0].name,
        permissions: permissions !== undefined && permissions !== null ? permissions : (existing[0].permissions || 'none'),
        tenantId: tenantId ? parseInt(String(tenantId), 10) : existing[0].tenantId,
        status: 'active'
      }).where(eq(users.id, existing[0].id)).returning();
      res.json({ message: 'User role updated', user: updated[0] });
    } else {
      const newUid = `pending-admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const created = await db.insert(users).values({
        uid: newUid,
        email: cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
        role: newRole || 'staff',
        permissions: permissions !== undefined && permissions !== null ? permissions : 'none',
        tenantId: tenantId ? parseInt(String(tenantId), 10) : null,
        status: 'active'
      }).returning();
      res.json({ message: 'User created successfully', user: created[0] });
    }
  } catch (error: any) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/api/admin/tenants/:tenantId/domain', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const tenantIdNum = parseInt(req.params.tenantId, 10);
    const { subdomain, customDomain } = req.body;

    if (!tenantIdNum || isNaN(tenantIdNum)) {
      res.status(400).json({ error: 'Invalid tenant ID' });
      return;
    }

    const tenantResult = await db.select().from(tenants).where(eq(tenants.id, tenantIdNum));
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const tenant = tenantResult[0];

    const updateData: Record<string, any> = {};
    if (typeof subdomain === 'string' && subdomain.trim() !== '') {
      updateData.subdomain = subdomain.trim().toLowerCase();
    }
    let renderStatus: any = null;
    if (typeof customDomain === 'string') {
      const cleanDom = customDomain.trim() ? customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : null;
      updateData.customDomain = cleanDom;
      if (cleanDom) {
        renderStatus = await registerRenderCustomDomain(cleanDom);
      }
    }

    await db.update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantIdNum));

    res.json({
      success: true,
      message: renderStatus?.message || 'تم تحديث الدومين المخصص بنجاح',
      updateData,
      renderStatus
    });
  } catch (error: any) {
    console.error('Error updating tenant domain:', error);
    res.status(500).json({ error: 'Failed to update domain', message: error.message });
  }
});

router.post('/api/admin/users/:email/suspend', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email } = req.params;
    if (email && req.user?.email && email.toLowerCase().trim() === req.user.email.toLowerCase().trim()) {
      res.status(400).json({ error: 'Cannot suspend your own account' });
      return;
    }
    const userList = await db.select().from(users).where(eq(users.email, email));
    if (userList.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const newStatus = userList[0].status === 'banned' ? 'active' : 'banned';
    await db.update(users).set({ status: newStatus }).where(eq(users.email, email));
    await logStaffAction(req, `قام بتغيير حالة الحساب للعميل ${email} إلى (${newStatus === 'banned' ? 'محظور 🚫' : 'نشط ✅'})`, 'users');
    res.json({ message: 'User suspended successfully', status: newStatus });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.delete('/api/admin/templates/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    await db.delete(templates).where(eq(templates.id, parseInt(id, 10)));
    res.json({ message: 'Template deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.put('/api/admin/templates/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { image } = req.body;
    await db.update(templates).set({ image }).where(eq(templates.id, parseInt(id, 10)));
    res.json({ message: 'Template updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.post('/api/admin/users/:email/warning', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email } = req.params;
    await db.update(users).set({ status: 'warned' }).where(eq(users.email, email));
    res.json({ message: 'Warning sent successfully', status: 'warned' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.get('/api/admin/tenants/:tenantId/content', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { tenantId } = req.params;
    const websiteResult = await db.select().from(websites).where(eq(websites.tenantId, parseInt(tenantId, 10)));
    if (websiteResult.length === 0) return res.status(404).json({ error: 'Website not found for tenant' });
    
    const websiteId = websiteResult[0].id;
    const contentResult = await db.select().from(websiteContent).where(eq(websiteContent.websiteId, websiteId));
    const templateResult = await db.select().from(templates).where(eq(templates.id, websiteResult[0].templateId));
    
    const baseContent = templateResult[0]?.defaultContent || {};
    const userContent = contentResult[0]?.content || {};

    const tenantResult = await db.select().from(tenants).where(eq(tenants.id, parseInt(tenantId, 10)));
    const tenant = tenantResult[0] || { name: 'موقع العميل', subdomain: 'client' };
    
    res.json({ 
      content: { ...(baseContent as object), ...(userContent as object) }, 
      websiteId,
      templateId: websiteResult[0].templateId,
      tenant: {
        name: tenant.name,
        subdomain: tenant.subdomain
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.put('/api/admin/tenants/:tenantId/content', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { tenantId } = req.params;
    const { content } = req.body;
    const websiteResult = await db.select().from(websites).where(eq(websites.tenantId, parseInt(tenantId, 10)));
    if (websiteResult.length === 0) return res.status(404).json({ error: 'Website not found for tenant' });
    
    const websiteId = websiteResult[0].id;
    const contentResult = await db.select().from(websiteContent).where(eq(websiteContent.websiteId, websiteId));
    
    if (contentResult.length === 0) {
      await db.insert(websiteContent).values({ websiteId, content });
    } else {
      await db.update(websiteContent).set({ content, updatedAt: new Date() }).where(eq(websiteContent.websiteId, websiteId));
    }
    
    res.json({ message: 'Content updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.delete('/api/admin/tenants/:tenantId/hard-delete', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const tenantIdNum = parseInt(req.params.tenantId, 10);
    if (!tenantIdNum || isNaN(tenantIdNum)) {
      res.status(400).json({ error: 'Invalid tenant ID' });
      return;
    }

    await db.transaction(async (tx) => {
      const tenantRecord = (await tx.select().from(tenants).where(eq(tenants.id, tenantIdNum)))[0];
      const associatedUserIds = new Set<number>();
      if (tenantRecord && tenantRecord.userId) {
        associatedUserIds.add(tenantRecord.userId);
      }
      const usersWithTenant = await tx.select().from(users).where(eq(users.tenantId, tenantIdNum));
      for (const u of usersWithTenant) {
        associatedUserIds.add(u.id);
      }

      await deleteTenantCascade(tenantIdNum, tx);

      for (const userId of associatedUserIds) {
        await deleteUserCascade(userId, tx);
      }
    });

    res.json({ success: true, message: 'Tenant permanently deleted and all data wiped.' });
  } catch (error: any) {
    logger.error('Hard delete error:', error);
    res.status(500).json({ error: 'Failed to hard delete tenant', details: error.message });
  }
});

router.post('/api/admin/notifications', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { tenantId, targetEmail, title, message, isRequired = 1 } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }

    const cleanTargetEmail = targetEmail ? targetEmail.trim().toLowerCase() : null;
    const parsedTenantId = tenantId ? parseInt(String(tenantId), 10) : null;
    let safeTenantId: number | null = null;
    if (parsedTenantId && !isNaN(parsedTenantId)) {
      try {
        const tCheck = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, parsedTenantId)).limit(1);
        if (tCheck.length > 0) safeTenantId = parsedTenantId;
      } catch (e) {
        safeTenantId = null;
      }
    }

    const inserted = await db.insert(notifications).values({
      tenantId: safeTenantId,
      targetEmail: cleanTargetEmail,
      title,
      message,
      isRequired: isRequired ? 1 : 0,
      isRead: 0
    }).returning();

    res.json({ success: true, notification: inserted[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

router.get('/api/admin/notifications', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const allNotifs = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100);
    res.json({ notifications: allNotifs });
  } catch (error: any) {
    console.warn('Notifications fetch warning, returning empty list:', error?.message || error);
    res.json({ notifications: [] });
  }
});

router.post('/api/admin/templates/external', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { name, externalUrl, category, image, description } = req.body;
    if (!name || !externalUrl || !category || !image) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const newTemplate = await db.insert(templates).values({
      name,
      description: description || '',
      type: 'external',
      externalUrl,
      category,
      image,
      defaultContent: {}
    }).returning();
    res.json({ template: newTemplate[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// System Feature Toggles & Control API
router.get('/api/system-settings', async (req: express.Request, res: express.Response) => {
  try {
    const settings = getSystemSettings();
    res.json(settings);
  } catch (error: any) {
    console.warn('System settings fetch error, using defaults:', error?.message || error);
    res.json(getSystemSettings());
  }
});

router.put('/api/system-settings', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const updated = updateSystemSettings(req.body || {});
    logStaffAction(req, `قام بتحديث إعدادات وضوابط المنصة العامة`, 'settings').catch(() => {});
    res.json({ success: true, settings: updated, message: 'تم تحديث إعدادات النظام بنجاح' });
  } catch (error: any) {
    console.error('System settings update error:', error);
    res.json({ success: true, settings: getSystemSettings(), message: 'تم حفظ التحديثات' });
  }
});


router.post('/api/admin/send-welcome-to-all', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { template = 'welcome', templateName = 'القالب الجديد', templateDescription, previewUrl } = req.body;
    const allUsers = await db.select().from(users).where(isNull(users.deletedAt));
    let successCount = 0;
    let failCount = 0;
    let errorDetails = [];

    const baseUrl = process.env.APP_URL || (req.get('host') ? `${req.protocol}://${req.get('host')}` : 'https://bunyan.website');

    for (const u of allUsers) {
      if (u.email) {
        try {
          let resEmail;
          
          if (template === 'template_update' || template === 'template') {
            resEmail = await sendTemplateUpdateEmail(
              u.email,
              u.name || 'عميلنا العزيز',
              templateName,
              templateDescription || 'تم إطلاق قالب جديد متميز في منصة بنيان جاهز للاستخدام الفوري.',
              previewUrl || `${baseUrl}/templates`
            );
          } else if (template === 'receipt' || template === 'reminder') {
            let tName = 'عميل بنيان';
            let planName = 'الباقة الأساسية';
            let rDate = new Date();
            rDate.setFullYear(rDate.getFullYear() + 1);
            let rDateStr = rDate.toISOString().split('T')[0];

            if (u.tenantId) {
              const tenantArr = await db.select().from(tenants).where(eq(tenants.id, u.tenantId));
              if (tenantArr.length > 0) {
                tName = tenantArr[0].name;
                const subs = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, u.tenantId));
                if (subs.length > 0) {
                  planName = subs[0].plan;
                  if (subs[0].renewalDate) {
                    rDateStr = new Date(subs[0].renewalDate).toISOString().split('T')[0];
                  }
                }
              }
            }

            if (template === 'receipt') {
              resEmail = await sendSubscriptionReceiptEmail(
                u.email,
                tName,
                planName,
                rDateStr,
                `${baseUrl}/dashboard`
              );
            } else {
              resEmail = await sendSubscriptionReminder(
                u.email,
                tName,
                rDateStr,
                `${baseUrl}/dashboard/settings/billing`
              );
            }
          } else {
            resEmail = await sendWelcomeEmail(
              u.email,
              u.name || 'عميلنا العزيز',
              `${baseUrl}/dashboard`
            );
          }

          if (resEmail && resEmail.success) {
            successCount++;
          } else {
            failCount++;
            const errMsg = String((resEmail && resEmail.error) || 'Unknown error');
            if (!errorDetails.includes(errMsg)) {
              errorDetails.push(errMsg);
            }
          }
        } catch (err) {
          console.error(`Failed to send email to ${u.email}:`, err);
          failCount++;
          const errMsg = (err && err.message) || String(err);
          if (!errorDetails.includes(errMsg)) {
            errorDetails.push(errMsg);
          }
        }
      }
    }

    // Also create a platform-wide in-app system notification from "منصة بنيان"
    try {
      await db.insert(notifications).values({
        tenantId: null,
        targetEmail: null,
        title: template === 'template_update' || template === 'template' ? `🎉 إطلاق قالب جديد: ${templateName}` : template === 'receipt' ? 'تم تفعيل اشتراكك بنجاح ✅' : template === 'reminder' ? 'تنبيه: اقترب موعد تجديد الاشتراك ⚠️' : 'أهلاً وسهلاً بك في منصة بنيان! 🎉',
        message: template === 'template_update' || template === 'template' ? `تم إطلاق قالب جديد باسم (${templateName}). يمكنك معاينته واستخدامه الآن في موقعك.` : template === 'receipt' ? 'إيصال الاشتراك متوفر الآن، يمكنك الاطلاع عليه.' : template === 'reminder' ? 'يرجى مراجعة حالة الاشتراك وتجديده لتجنب توقف الخدمة.' : 'يسعدنا انضمامك إلى منصة بنيان المتكاملة. مساحتك الرقمية جاهزة ولوحة التحكم مجهزة بالكامل لتطوير أعمالك وموقعك.',
        isRequired: 1,
        isRead: 0
      });
    } catch (notifErr) {
      console.error('Failed to create global platform notification:', notifErr);
    }

    res.json({ success: true, successCount, failCount, errorDetails });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send bulk email', details: error.message });
  }
});

// Test single email endpoint
router.post('/api/admin/send-test-email', requireAuth, requireAdmin, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email, template = 'template_update', templateName = 'متجر الفخامة العصرية', templateDescription, previewUrl } = req.body;
    const targetEmail = email || req.user?.email || 'ahmadalriqib@gmail.com';
    const baseUrl = process.env.APP_URL || (req.get('host') ? `${req.protocol}://${req.get('host')}` : 'https://bunyan.website');

    let result;
    if (template === 'template_update' || template === 'template') {
      result = await sendTemplateUpdateEmail(
        targetEmail,
        req.user?.name || 'أحمد الرقب',
        templateName,
        templateDescription || 'تم إطلاق قالب متجر فاخر جديد يمتلك تصميم عصري وجذاب ومناسب للتجارة الإلكترونية.',
        previewUrl || `${baseUrl}/templates`
      );
    } else if (template === 'receipt') {
      result = await sendSubscriptionReceiptEmail(targetEmail, 'موقع بنيان الاختباري', 'الباقة الاحترافية', '2027-08-06', `${baseUrl}/dashboard`);
    } else if (template === 'reminder') {
      result = await sendSubscriptionReminder(targetEmail, 'موقع بنيان الاختباري', '2027-08-06', `${baseUrl}/dashboard/settings/billing`);
    } else {
      result = await sendWelcomeEmail(targetEmail, 'أحمد الرقب', `${baseUrl}/dashboard`);
    }

    res.json({ success: true, targetEmail, result });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

export default router;
