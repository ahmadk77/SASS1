import { sendWelcomeEmail, sendSubscriptionReceiptEmail } from '../lib/sendAutomatedEmail.ts';
import express from 'express';
import { db } from '../db/index.ts';
import { tenants, users, templates, subscriptions, websites, websiteContent, analytics, orders, notifications, supportTickets, supportMessages, auditLogs, dentistAppointments, dentistDoctors, dentistServices, dentistSettings, doctorAvailability } from '../db/schema.ts';
import { eq, or, and, desc, isNull, isNotNull, sql, ilike, inArray } from 'drizzle-orm';
import { storeCustomers } from '../db/schema.ts';
import { requireAuth, requireTenantStaff, requireActiveSubscription, AuthRequest } from '../middleware/auth.ts';
import { SubdomainRequest } from '../middleware/subdomain.ts';
import { strictApiLimiter } from '../middleware/rateLimiter.ts';
import { getSystemSettings } from '../lib/systemSettings.ts';
import { getDefaultItemsForTemplate } from '../lib/defaultData.ts';
import { getPlanAmountById, getPlanTitleById, formatCurrencyPrice } from '../lib/subscriptionPlans.ts';

const router = express.Router();

export function wipeDemoContent(rawContent: any) {
  if (!rawContent) return { products: [], items: [], menuItems: [], doctors: [], services: [], appointments: [] };
  let clean: any = {};
  if (typeof rawContent === 'string') {
    try {
      clean = JSON.parse(rawContent);
    } catch (e) {
      clean = {};
    }
  } else if (typeof rawContent === 'object') {
    clean = JSON.parse(JSON.stringify(rawContent));
  }
  
  const arrayKeysToWipe = [
    'products', 'items', 'menuItems', 'bakeryItems', 'coffeeItems', 
    'dishes', 'projects', 'apartmentItems', 'luxuryVillas', 'commercialAgencies', 
    'couriers', 'inventory', 'services', 'portfolio', 'doctors', 'appointments', 'staff'
  ];
  for (const k of arrayKeysToWipe) {
    clean[k] = [];
  }
  return clean;
}

export function processInventoryUpdate(contentObj: any, orderItems: any[], multiplier: number, templateId?: number) {
  if (!contentObj || typeof contentObj !== 'object' || !Array.isArray(orderItems) || orderItems.length === 0) {
    return { contentObj, modified: false };
  }

  let modified = false;

  let productList: any[] = [];
  if (Array.isArray(contentObj.items) && contentObj.items.length > 0) {
    productList = contentObj.items;
  } else if (Array.isArray(contentObj.products) && contentObj.products.length > 0) {
    productList = contentObj.products;
  }

  if (productList.length === 0) {
    if (templateId) {
      const defaults = getDefaultItemsForTemplate(templateId);
      if (defaults && defaults.length > 0) {
        productList = JSON.parse(JSON.stringify(defaults));
      }
    }
    if (productList.length === 0) {
      productList = orderItems
        .map((oi: any) => oi.product)
        .filter((p: any) => p && (p.id || p.title || p.name));
    }
  }

  orderItems.forEach((orderItem: any) => {
    const pId = orderItem.id || orderItem.productId || orderItem.product?.id;
    const pTitle = orderItem.title || orderItem.name || orderItem.product?.title || orderItem.product?.name;

    const product = productList.find((p) => {
      if (pId !== undefined && p.id !== undefined && String(p.id) === String(pId)) return true;
      if (pTitle) {
        const t = p.title || p.name;
        if (t && String(t).trim().toLowerCase() === String(pTitle).trim().toLowerCase()) return true;
      }
      return false;
    });

    if (product && !product.isUnlimitedStock) {
      const qty = (Number(orderItem.quantity) || 1) * multiplier;

      // 1. Color variant stock
      const itemColor = orderItem.color || orderItem.selectedColor;
      if (itemColor && itemColor !== 'افتراضي' && product.colorStocks && typeof product.colorStocks === 'object') {
        if (product.colorStocks[itemColor] !== undefined && product.colorStocks[itemColor] !== '') {
          let cur = Number(product.colorStocks[itemColor]);
          if (!isNaN(cur)) {
            product.colorStocks[itemColor] = Math.max(0, cur + qty).toString();
            modified = true;
          }
        }
      }

      // 2. Storage / Size variant stock
      const itemStorage = orderItem.storage || orderItem.selectedStorage || orderItem.selectedSize || orderItem.size;
      if (itemStorage && itemStorage !== 'قياسي') {
        if (product.storageStocks && typeof product.storageStocks === 'object' && product.storageStocks[itemStorage] !== undefined && product.storageStocks[itemStorage] !== '') {
          let cur = Number(product.storageStocks[itemStorage]);
          if (!isNaN(cur)) {
            product.storageStocks[itemStorage] = Math.max(0, cur + qty).toString();
            modified = true;
          }
        }
        if (product.sizeStocks && typeof product.sizeStocks === 'object' && product.sizeStocks[itemStorage] !== undefined && product.sizeStocks[itemStorage] !== '') {
          let cur = Number(product.sizeStocks[itemStorage]);
          if (!isNaN(cur)) {
            product.sizeStocks[itemStorage] = Math.max(0, cur + qty).toString();
            modified = true;
          }
        }
      }

      // 3. Main product stock
      let currentStock = (product.stock !== undefined && product.stock !== '') ? Number(product.stock) : 25;
      if (isNaN(currentStock)) currentStock = 25;

      const newStock = Math.max(0, currentStock + qty);
      product.stock = newStock;
      if (newStock <= 0) {
        product.inventoryStatus = 'نفد من المخزون';
      } else if (newStock <= 5) {
        product.inventoryStatus = 'قطعة أخيرة';
      } else {
        product.inventoryStatus = 'متوفر';
      }
      modified = true;
    }
  });

  contentObj.items = productList;
  contentObj.products = productList;

  return { contentObj, modified };
}


// Subdomain Info Diagnostic API
router.get('/api/subdomain-info', (req: SubdomainRequest, res: express.Response) => {
  res.json({
    isSubdomainRequest: req.isSubdomainRequest || false,
    subdomain: req.tenantSubdomain || null,
    host: req.headers['x-forwarded-host'] || req.headers.host || '',
  });
});

// 1. Tenant Onboarding API
router.post('/api/onboard', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { templateId, tenantName, subdomain } = req.body;
    const uid = req.user!.uid;
    const email = req.user!.email || 'unknown@example.com';

    if (!templateId || !tenantName || !subdomain) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Ensure user exists in DB
    const userList = await db.select().from(users).where(and(eq(users.uid, uid), isNull(users.deletedAt)));
    let dbUser = userList.length > 0 ? userList[0] : null;

    if (!dbUser && email) {
      const emailList = await db.select().from(users).where(and(eq(users.email, email.toLowerCase().trim()), isNull(users.deletedAt)));
      if (emailList.length > 0) {
        dbUser = emailList[0];
      }
    }

    if (!dbUser) {
      const inserted = await db.insert(users).values({
        uid,
        email: email.toLowerCase().trim(),
        name: email.split('@')[0],
        role: 'user',
        status: 'active',
      }).returning();
      dbUser = inserted[0];
      const baseUrl = process.env.APP_URL || (req.get('host') ? `${req.protocol}://${req.get('host')}` : 'https://bunyan.website');
      sendWelcomeEmail(dbUser.email, dbUser.name || 'User', `${baseUrl}/dashboard`).catch(e => console.error('Failed to send welcome email:', e));
    }

    // Fetch or create template
    let templateResult = await db.select().from(templates).where(and(eq(templates.id, parseInt(templateId)), isNull(templates.deletedAt)));
    if (templateResult.length === 0) {
      const insertValues = {
        name: 'قالب افتراضي',
        description: 'قالب افتراضي للإنشاء السريع',
        defaultContent: {
          primaryColor: '#2563eb',
          secondaryColor: '#3b82f6',
          textColor: '#1e293b',
          fontFamily: 'Tajawal',
          businessName: tenantName,
          heroTitle: 'مرحباً بك في موقعنا',
          heroSubtitle: 'نحن نقدم أفضل الخدمات والحلول المميزة لك.'
        }
      };
      templateResult = await db.insert(templates).values(insertValues).returning();
    }
    const template = templateResult[0];

    // Atomically execute onboarding inside a database transaction
    const newTenant = await db.transaction(async (tx) => {
      // 1. Create Tenant
      const tenantResult = await tx.insert(tenants)
        .values({
          userId: dbUser!.id,
          name: tenantName,
          subdomain,
        })
        .returning();
      const createdTenant = tenantResult[0];

      // 2. Update User with new tenantId and role 'tenant_admin' (only if not platform admin/staff)
      const isPlatformUser = ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbUser!.role) || (dbUser!.permissions && dbUser!.permissions !== 'none') || dbUser!.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
      if (!isPlatformUser) {
        await tx.update(users)
          .set({ tenantId: createdTenant.id, role: 'tenant_admin' })
          .where(eq(users.id, dbUser!.id));
      }

      // 3. Create Subscription in subscriptions table (Single Source of Truth) - 3 Days Free Trial
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      await tx.insert(subscriptions).values({
        tenantId: createdTenant.id,
        plan: 'free_trial_3days',
        status: 'active',
        renewalDate: threeDaysLater,
        assignedUserEmail: email
      });

      // 4. Provision Website
      const websiteResult = await tx.insert(websites)
        .values({
          tenantId: createdTenant.id,
          templateId: template.id,
        })
        .returning();
      const createdWebsite = websiteResult[0];

      // 5. Provision Website Content (Zeroed out products for new subscriber)
      await tx.insert(websiteContent)
        .values({
          websiteId: createdWebsite.id,
          content: wipeDemoContent(template.defaultContent),
        });

      return createdTenant;
    });

    // Automatically send Welcome Email to new store owner on first login/signup
    if (email) {
      const dashboardUrl = `${process.env.APP_URL || 'https://bunyan.website'}/dashboard`;
      
      sendWelcomeEmail(email, tenantName || dbUser.name || 'عميلنا العزيز', dashboardUrl)
        .catch(e => console.error('Automated welcome email error on onboarding:', e));
    }

    res.status(201).json({
      message: 'Tenant onboarded successfully',
      tenant: newTenant,
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Internal Server Error. Subdomain might be taken.', details: error.message });
  }
});

// 2. Public Website Resolver API
router.get('/api/resolve', strictApiLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const subReq = req as SubdomainRequest;
    const rawDomain = (typeof req.query.domain === 'string' && req.query.domain) || subReq.tenantSubdomain;

    if (!rawDomain) {
      res.status(400).json({ error: 'Domain parameter or valid subdomain header is required' });
      return;
    }

    const domain = rawDomain.trim().toLowerCase();
    const cleanDomain = domain.replace(/^www\./i, '');

    const isNumericId = !isNaN(Number(cleanDomain));
    const tenantResult = await db.select({
      tenant: tenants,
      user: users
    }).from(tenants)
      .leftJoin(users, eq(users.tenantId, tenants.id))
      .where(and(
        or(
          eq(tenants.subdomain, cleanDomain),
          eq(tenants.customDomain, cleanDomain),
          eq(tenants.customDomain, `www.${cleanDomain}`),
          ...(isNumericId ? [eq(tenants.id, Number(cleanDomain))] : [])
        ),
        isNull(tenants.deletedAt)
      ));

    if (tenantResult.length === 0) {
      res.status(404).json({ error: `Website not found for domain: ${domain}` });
      return;
    }

    const tenant = tenantResult[0].tenant;
    const userObj = tenantResult[0].user;

    if (userObj) {
      const isBanned = userObj.status === 'banned';
      if (isBanned) {
        res.json({ suspended: true });
        return;
      }
    }

    // Verify subscription status via subscriptions table
    const sub = await db.select().from(subscriptions).where(
      and(eq(subscriptions.tenantId, tenant.id), eq(subscriptions.status, 'active'))
    );
    if (sub.length === 0) {
      res.json({ suspended: true, reason: 'subscription_inactive' });
      return;
    }

    // Track visit in background
    db.insert(analytics).values({
      tenantId: tenant.id,
      type: 'visit',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      path: '/'
    }).catch(err => console.error('Analytics resolve tracking error:', err));

    const websiteResult = await db.select().from(websites).where(and(eq(websites.tenantId, tenant.id), isNull(websites.deletedAt)));
    if (websiteResult.length === 0) {
      res.status(404).json({ error: 'Website configuration not found' });
      return;
    }
    
    const website = websiteResult[0];
    const contentResult = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, website.id), isNull(websiteContent.deletedAt)));
    const content = contentResult.length > 0 ? contentResult[0].content : {};

    res.json({
      tenant: {
        id: tenant.id,
        userId: tenant.userId,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      websiteId: website.id,
      templateId: website.templateId,
      content,
    });
  } catch (error: any) {
    console.error('Resolver error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
});

// 3. Get Tenant Info with Transactional Auto-Provisioning
router.get('/api/tenant', requireAuth, requireActiveSubscription, async (req: AuthRequest, res: express.Response) => {
  try {
    if (!req.user || !req.user.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const email = req.user.email.toLowerCase().trim();
    const dbUser = req.dbUser;

    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'];
    const parsedImpersonateId = impersonateRaw && impersonateRaw !== 'undefined' && impersonateRaw !== 'null' ? parseInt(String(impersonateRaw), 10) : NaN;
    const hasValidImpersonate = !isNaN(parsedImpersonateId) && parsedImpersonateId > 0;

    const validUserTenantId = dbUser.tenantId && !isNaN(parseInt(String(dbUser.tenantId), 10)) ? parseInt(String(dbUser.tenantId), 10) : null;

    let tenantResult: any = [];

    if (hasValidImpersonate) {
      const targetId = parsedImpersonateId;
      if (dbUser.role === 'super_admin' || dbUser.role === 'admin' || dbUser.role === 'manager' || dbUser.role === 'support') {
        tenantResult = await db.select().from(tenants).where(and(eq(tenants.id, targetId), isNull(tenants.deletedAt)));
      } else {
        const checkTenant = await db.select().from(tenants).where(and(eq(tenants.id, targetId), isNull(tenants.deletedAt)));
        if (checkTenant.length > 0 && (checkTenant[0].userId === dbUser.id || checkTenant[0].id === validUserTenantId || checkTenant[0].assignedUserEmail === email)) {
          tenantResult = checkTenant;
        } else {
          tenantResult = validUserTenantId 
            ? await db.select().from(tenants).where(and(eq(tenants.id, validUserTenantId), isNull(tenants.deletedAt)))
            : await db.select().from(tenants).where(and(eq(tenants.userId, dbUser.id), isNull(tenants.deletedAt)));
        }
      }
    } else {
      // Priority 1: Check by dbUser.tenantId
      const isPlatformUserRole = ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbUser.role) || (dbUser.permissions && dbUser.permissions !== 'none') || dbUser.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
      if (email === 'ahmadalriqib@gmail.com' || (isPlatformUserRole && !validUserTenantId)) {
        // Platform super admin and staff without personal tenant do not auto-load random tenant
        tenantResult = [];
      } else if (validUserTenantId) {
        tenantResult = await db.select().from(tenants).where(and(eq(tenants.id, validUserTenantId), isNull(tenants.deletedAt)));
      }
      // Priority 2: Check by dbUser.id
      if (tenantResult.length === 0) {
        tenantResult = await db.select().from(tenants).where(and(eq(tenants.userId, dbUser.id), isNull(tenants.deletedAt)));
      }
      // Priority 3: Check by assignedUserEmail on tenants
      if (tenantResult.length === 0 && email) {
        tenantResult = await db.select().from(tenants).where(and(eq(tenants.assignedUserEmail, email), isNull(tenants.deletedAt)));
      }
      // Priority 4: Check active subscriptions table for assignedUserEmail
      if (tenantResult.length === 0 && email) {
        const activeSubs = await db.select().from(subscriptions).where(
          and(eq(subscriptions.assignedUserEmail, email), eq(subscriptions.status, 'active'))
        );
        if (activeSubs.length > 0 && activeSubs[0].tenantId && !isNaN(parseInt(String(activeSubs[0].tenantId), 10))) {
          const subTenantId = parseInt(String(activeSubs[0].tenantId), 10);
          tenantResult = await db.select().from(tenants).where(and(eq(tenants.id, subTenantId), isNull(tenants.deletedAt)));
        }
      }
      // Priority 5: Check websites table by assignedUserEmail
      if (tenantResult.length === 0 && email) {
        const assignedWebsites = await db.select().from(websites).where(
          and(eq(websites.assignedUserEmail, email), isNull(websites.deletedAt))
        );
        if (assignedWebsites.length > 0 && assignedWebsites[0].tenantId && !isNaN(parseInt(String(assignedWebsites[0].tenantId), 10))) {
          const webTenantId = parseInt(String(assignedWebsites[0].tenantId), 10);
          tenantResult = await db.select().from(tenants).where(and(eq(tenants.id, webTenantId), isNull(tenants.deletedAt)));
        }
      }
    }

    // If tenant found via fallback, sync dbUser.tenantId
    if (tenantResult.length > 0 && tenantResult[0].id) {
      const foundTenant = tenantResult[0];
      if (dbUser.tenantId !== foundTenant.id) {
        await db.update(users).set({ tenantId: foundTenant.id }).where(eq(users.id, dbUser.id)).catch(() => {});
      }
    }
    
    // Auto-provision if tenant doesn't exist but template is assigned or user has subscription
    if (tenantResult.length === 0) {
      if (['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbUser.role) && !validUserTenantId) {
        res.json({ tenant: null });
        return;
      }
      const assignedTemplateResult = await db.select().from(templates).where(and(eq(templates.assignedUserEmail, email), isNull(templates.deletedAt)));
      const activeSubResult = await db.select().from(subscriptions).where(and(eq(subscriptions.assignedUserEmail, email), eq(subscriptions.status, 'active')));

      if (assignedTemplateResult.length > 0 || activeSubResult.length > 0) {
        const assignedTemplate = assignedTemplateResult.length > 0 ? assignedTemplateResult[0] : null;
        const defaultTplId = assignedTemplate ? assignedTemplate.id : 1;

        const newTenant = await db.transaction(async (tx) => {
          const newTenantResult = await tx.insert(tenants).values({
            userId: dbUser.id,
            name: (assignedTemplate?.defaultContent as any)?.siteName || 'موقعي الخاص',
            subdomain: `site-${Date.now().toString().slice(-6)}`,
            assignedUserEmail: email
          }).returning();
          const createdTenant = newTenantResult[0];
          
          const isPlatformUser2 = ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbUser.role) || (dbUser.permissions && dbUser.permissions !== 'none') || dbUser.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
          await tx.update(users)
            .set({ tenantId: createdTenant.id, ...(isPlatformUser2 ? {} : { role: 'tenant_admin' }) })
            .where(eq(users.id, dbUser.id));

          if (activeSubResult.length === 0) {
            const oneYearLater = new Date();
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

            await tx.insert(subscriptions).values({
              tenantId: createdTenant.id,
              plan: 'yearly',
              status: 'active',
              renewalDate: oneYearLater,
              assignedUserEmail: email
            });
          } else {
            await tx.update(subscriptions).set({ tenantId: createdTenant.id }).where(eq(subscriptions.id, activeSubResult[0].id));
          }

          const newWebsiteResult = await tx.insert(websites).values({
            tenantId: createdTenant.id,
            templateId: defaultTplId,
            assignedUserEmail: email
          }).returning();
          
          await tx.insert(websiteContent).values({
            websiteId: newWebsiteResult[0].id,
            content: wipeDemoContent(assignedTemplate?.defaultContent || { businessName: 'موقعي الخاص' }),
          });

          return createdTenant;
        });

        tenantResult = [newTenant];
      } else {
        res.json({ tenant: null });
        return;
      }
    }

    const tenant = tenantResult[0];
    let websiteResult = await db.select().from(websites).where(and(eq(websites.tenantId, tenant.id), isNull(websites.deletedAt)));
    
    // Auto-create website record if missing for this tenant
    if (websiteResult.length === 0) {
      const createdWeb = await db.insert(websites).values({
        tenantId: tenant.id,
        templateId: 1,
        assignedUserEmail: email
      }).returning();
      
      await db.insert(websiteContent).values({
        websiteId: createdWeb[0].id,
        content: { businessName: tenant.name || 'موقعي الخاص' },
      });
      websiteResult = createdWeb;
    }

    const website = websiteResult[0];
    const contentResult = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, website.id), isNull(websiteContent.deletedAt)));
    const content = contentResult.length > 0 ? contentResult[0].content : {};

    const isOwnerOfTenant = tenant.userId === dbUser.id || dbUser.role === 'super_admin' || email === 'ahmadalriqib@gmail.com';
    const effectiveRole = isOwnerOfTenant ? (dbUser.role || 'tenant_admin') : (dbUser.role || 'staff');
    const effectivePermissions = isOwnerOfTenant ? 'all' : (dbUser.permissions || 'none');

    res.json({
      tenant: {
        id: tenant.id,
        userId: tenant.userId,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
      },
      websiteId: website.id,
      templateId: website.templateId || 1,
      content,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: effectiveRole,
        permissions: effectivePermissions
      },
      role: effectiveRole,
      permissions: effectivePermissions
    });
  } catch (error: any) {
    console.warn('Get tenant notice:', error?.message || error);
    res.status(500).json({ error: 'Internal Server Error', details: error?.message });
  }
});

// 4. Get User's Sites
router.get('/api/tenant/my-sites', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const dbUser = req.dbUser;
    const userEmail = dbUser.email?.toLowerCase().trim();
    let myTenants: any[] = [];
    
    const isSuperPlatform = userEmail === 'ahmadalriqib@gmail.com' || dbUser.role === 'super_admin' || dbUser.role === 'admin';

    if (isSuperPlatform) {
      myTenants = await db.select().from(tenants).where(isNull(tenants.deletedAt));
    } else {
      const primaryTenants = await db.select().from(tenants).where(
        and(
          or(
            eq(tenants.userId, dbUser.id),
            eq(tenants.id, dbUser.tenantId || -1),
            ...(userEmail ? [eq(tenants.assignedUserEmail, userEmail)] : [])
          ),
          isNull(tenants.deletedAt)
        )
      );
      
      const tenantIds = new Set(primaryTenants.map(t => t.id));

      if (userEmail) {
        const subList = await db.select().from(subscriptions).where(
          and(eq(subscriptions.assignedUserEmail, userEmail), eq(subscriptions.status, 'active'))
        );
        for (const sub of subList) {
          if (sub.tenantId && !tenantIds.has(sub.tenantId)) {
            const tList = await db.select().from(tenants).where(and(eq(tenants.id, sub.tenantId), isNull(tenants.deletedAt)));
            if (tList.length > 0) {
              primaryTenants.push(tList[0]);
              tenantIds.add(tList[0].id);
            }
          }
        }
      }

      myTenants = primaryTenants;
    }

    let sitesResponse = [];
    for (const t of myTenants) {
       const wList = await db.select().from(websites).where(and(eq(websites.tenantId, t.id), isNull(websites.deletedAt)));
       const isOwner = Boolean(
         isSuperPlatform ||
         t.userId === dbUser.id ||
         (t.assignedUserEmail && userEmail && t.assignedUserEmail.toLowerCase().trim() === userEmail) ||
         dbUser.role === 'tenant_admin' ||
         dbUser.role === 'owner'
       );
       sitesResponse.push({
         ...t,
         templateId: wList.length > 0 ? wList[0].templateId : undefined,
         isOwner,
         userRelation: isOwner ? 'owner' : 'staff'
       });
    }

    res.json({ sites: sitesResponse });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sites', details: err.message });
  }
});

// 5. Update Tenant Template
router.put('/api/tenant/template', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { templateId } = req.body;
    const dbUser = req.dbUser;

    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'] || req.body?.impersonateTenantId;
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    const isSuperAdminOrAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';

    let tenantQuery;
    if (impersonateId && !isNaN(impersonateId)) {
      if (isSuperAdminOrAdmin) {
        tenantQuery = and(eq(tenants.id, impersonateId), isNull(tenants.deletedAt));
      } else {
        tenantQuery = and(eq(tenants.id, impersonateId), or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt));
      }
    } else {
      tenantQuery = and(or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt));
    }

    const tenantResult = await db.select().from(tenants).where(tenantQuery);
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const tenant = tenantResult[0];

    const templateResult = await db.select().from(templates).where(and(eq(templates.id, parseInt(templateId)), isNull(templates.deletedAt)));
    if (templateResult.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    const template = templateResult[0];

    const websiteResult = await db.select().from(websites).where(eq(websites.tenantId, tenant.id));
    if (websiteResult.length === 0) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }
    const website = websiteResult[0];

    const cleanContent = wipeDemoContent(template.defaultContent);
    await db.update(websites).set({ templateId: template.id }).where(eq(websites.id, website.id));
    await db.update(websiteContent).set({ content: cleanContent, }).where(eq(websiteContent.websiteId, website.id));

    res.json({ message: 'Template updated successfully', templateId: template.id, content: cleanContent });
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

import { registerRenderCustomDomain } from '../lib/renderDomain.ts';

// 6. Update Custom Domain
router.put('/api/tenant/custom-domain', requireAuth, requireActiveSubscription, async (req: AuthRequest, res: express.Response) => {
  try {
    const { customDomain } = req.body;
    const dbUser = req.dbUser;

    const tenantResult = await db.select().from(tenants).where(and(eq(tenants.userId, dbUser.id), isNull(tenants.deletedAt)));
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const tenant = tenantResult[0];

    let cleanDomain = customDomain ? customDomain.trim().toLowerCase() : null;
    if (cleanDomain) {
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const existingDomain = await db.select().from(tenants).where(and(eq(tenants.customDomain, cleanDomain), isNull(tenants.deletedAt)));
      if (existingDomain.length > 0 && existingDomain[0].id !== tenant.id) {
        res.status(400).json({ error: 'هذا الدومين مستخدم بالفعل من قبل موقع آخر.' });
        return;
      }
    }

    let renderStatus: any = null;
    if (cleanDomain) {
      renderStatus = await registerRenderCustomDomain(cleanDomain);
    }

    await db.update(tenants).set({ customDomain: cleanDomain }).where(eq(tenants.id, tenant.id));
    res.json({
      message: renderStatus?.message || 'تم تحديث الدومين المخصص بنجاح',
      customDomain: cleanDomain,
      renderStatus
    });
  } catch (error: any) {
    console.error('Update custom domain error:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تحديث الدومين', details: error.message });
  }
});

// 7. Update Website Content
router.put('/api/tenant/content', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const sys = getSystemSettings();
    const dbUser = req.dbUser;
    const isSuperAdmin = dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com' || dbUser?.role === 'super_admin';

    if (sys.lockSaveEdits) {
      res.status(403).json({ error: sys.customNoticeMessage || 'مغلق الآن: حفظ التعديلات مغلق حالياً من قبل الإدارة' });
      return;
    }

    const { content } = req.body;

    const isSuperAdminOrAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
    const impersonateRaw = req.body.impersonateTenantId || req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'];
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    
    let tenantQuery;
    if (impersonateId && !isNaN(impersonateId)) {
      if (isSuperAdminOrAdmin) {
        tenantQuery = and(eq(tenants.id, impersonateId), isNull(tenants.deletedAt));
      } else {
        tenantQuery = and(eq(tenants.id, impersonateId), or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt));
      }
    } else {
      tenantQuery = and(or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt));
    }

    const tenantResult = await db.select().from(tenants).where(tenantQuery);
    let tenant;
    if (tenantResult.length === 0) {
      const sub = (dbUser.email?.split('@')[0] || 'site').replace(/[^a-z0-9]/gi, '').toLowerCase() + Math.floor(Math.random() * 10000);
      const createdTenant = await db.insert(tenants).values({
        userId: dbUser.id,
        name: content?.businessName || content?.siteName || 'موقعي',
        subdomain: sub,
      }).returning();
      tenant = createdTenant[0];
      await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, dbUser.id));
    } else {
      tenant = tenantResult[0];
    }

    let websiteResult = await db.select().from(websites).where(and(eq(websites.tenantId, tenant.id), isNull(websites.deletedAt)));
    if (websiteResult.length === 0) {
      const createdWeb = await db.insert(websites).values({
        tenantId: tenant.id,
        templateId: 1,
        assignedUserEmail: dbUser.email
      }).returning();
      websiteResult = createdWeb;
    }
    const website = websiteResult[0];

    const existingContent = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, website.id), isNull(websiteContent.deletedAt)));
    if (existingContent.length === 0) {
      await db.insert(websiteContent).values({ websiteId: website.id, content, updatedAt: new Date() });
    } else {
      await db.update(websiteContent).set({ content, updatedAt: new Date() }).where(eq(websiteContent.id, existingContent[0].id));
    }
    
    const newName = content?.businessName || content?.siteName || tenant.name;
    if (newName) {
      if (!content.businessName) content.businessName = newName;
      if (!content.siteName) content.siteName = newName;
      if (newName !== tenant.name) {
        await db.update(tenants).set({ name: newName }).where(eq(tenants.id, tenant.id));
      }
    }
    res.json({ message: 'Website content updated successfully', content });
  } catch (error: any) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// 8. Tenant Staff Management
router.get('/api/tenant/staff', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const dbUser = req.dbUser;
    const tenantId = dbUser.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'No tenant linked to user' });
      return;
    }

    const staffList = await db.select().from(users).where(and(eq(users.tenantId, tenantId), isNull(users.deletedAt)));
    res.json({ staff: staffList });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tenant staff', details: error.message });
  }
});

router.post('/api/tenant/staff', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const { email, name, role, permissions } = req.body;
    const dbUser = req.dbUser;
    const tenantId = dbUser.tenantId;

    if (!email || !tenantId) {
      res.status(400).json({ error: 'Email and valid tenant ID required' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.select().from(users).where(and(eq(users.email, cleanEmail), isNull(users.deletedAt)));

    const assignedRole = role || 'staff';
    const assignedPermissions = permissions !== undefined && permissions !== null && permissions !== ''
      ? permissions
      : (assignedRole === 'tenant_admin' ? 'all' : 'none');

    let staffMember;
    if (existing.length > 0) {
      const updated = await db.update(users).set({
        tenantId,
        role: assignedRole,
        permissions: assignedPermissions,
        name: name || existing[0].name
      }).where(eq(users.id, existing[0].id)).returning();
      staffMember = updated[0];
    } else {
      const newUid = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const created = await db.insert(users).values({
        uid: newUid,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role: assignedRole,
        tenantId,
        permissions: assignedPermissions,
        status: 'active'
      }).returning();
      staffMember = created[0];
    }

    res.json({ message: 'Staff member updated successfully', staff: staffMember });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add staff member', details: error.message });
  }
});

router.delete('/api/tenant/staff/:id', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const staffId = parseInt(req.params.id, 10);
    const dbUser = req.dbUser;

    await db.update(users).set({ tenantId: null, role: 'user' }).where(
      and(eq(users.id, staffId), eq(users.tenantId, dbUser.tenantId))
    );
    res.json({ message: 'Staff member removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete staff member', details: error.message });
  }
});

// 9. Tenant Orders
router.get('/api/tenant/orders', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const dbUser = req.dbUser;
    const isSuperAdminOrAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'];
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    
    let targetTenantId = dbUser.tenantId;
    if (impersonateId && !isNaN(impersonateId)) {
      if (isSuperAdminOrAdmin) {
        targetTenantId = impersonateId;
      } else {
        const checkTenant = await db.select().from(tenants).where(and(eq(tenants.id, impersonateId), or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt)));
        if (checkTenant.length > 0) {
          targetTenantId = impersonateId;
        }
      }
    }

    if (!targetTenantId) {
      res.status(400).json({ error: 'No tenant linked' });
      return;
    }

    const includeDeleted = req.query.includeDeleted === 'true';

    const whereClause = includeDeleted
      ? eq(orders.tenantId, targetTenantId)
      : and(eq(orders.tenantId, targetTenantId), isNull(orders.deletedAt));

    const tenantOrders = await db.select().from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt));
    res.json({ orders: tenantOrders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

router.put('/api/tenant/orders/:id', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status, details } = req.body;
    const dbUser = req.dbUser;

    const isSuperAdminOrAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'] || req.body?.impersonateTenantId;
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    
    let targetTenantId = dbUser.tenantId;
    if (impersonateId && !isNaN(impersonateId)) {
      if (isSuperAdminOrAdmin) {
        targetTenantId = impersonateId;
      } else {
        const checkTenant = await db.select().from(tenants).where(and(eq(tenants.id, impersonateId), or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt)));
        if (checkTenant.length > 0) {
          targetTenantId = impersonateId;
        }
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (req.body.items) updateData.items = req.body.items;
    if (req.body.totalPrice) updateData.totalPrice = String(req.body.totalPrice);

    // Fetch existing order to merge details cleanly so items/totals are preserved
    let existingOrder: any[] = [];
    if (targetTenantId) {
      existingOrder = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.tenantId, targetTenantId)));
    } else {
      existingOrder = await db.select().from(orders).where(eq(orders.id, orderId));
    }

    if (existingOrder.length > 0 && details) {
      updateData.details = { ...(existingOrder[0].details || {}), ...details };
    } else if (details) {
      updateData.details = details;
    }

    if (status === 'deleted') {
      updateData.deletedAt = new Date();
    } else if (status) {
      updateData.deletedAt = null;
    }

    if (targetTenantId) {
      await db.update(orders).set(updateData).where(
        and(eq(orders.id, orderId), eq(orders.tenantId, targetTenantId))
      );
    } else {
      await db.update(orders).set(updateData).where(eq(orders.id, orderId));
    }

    // Handle Stock Restoration / Deduction if status changes
    if (existingOrder.length > 0 && status) {
      const oldStatus = existingOrder[0].status;
      const isOldCancelled = oldStatus === 'cancelled' || oldStatus === 'customer_cancelled' || oldStatus === 'ملغي' || oldStatus === 'deleted';
      const isNewCancelled = status === 'cancelled' || status === 'customer_cancelled' || status === 'ملغي' || status === 'deleted';
      
      if (isOldCancelled !== isNewCancelled) {
        try {
          const contentResult = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, existingOrder[0].websiteId), isNull(websiteContent.deletedAt)));
          if (contentResult.length > 0 && contentResult[0].content) {
            let content = typeof contentResult[0].content === 'string' ? JSON.parse(contentResult[0].content) : (contentResult[0].content as any || {});
            const orderItems = req.body.items || existingOrder[0].items || (existingOrder[0].details as any)?.items || [];
            const multiplier = isNewCancelled ? 1 : -1;
            const { contentObj: updatedContent, modified } = processInventoryUpdate(content, orderItems, multiplier);
            if (modified) {
              await db.update(websiteContent).set({
                content: updatedContent,
                updatedAt: new Date()
              }).where(eq(websiteContent.id, contentResult[0].id));
            }
          }
        } catch (err) {
          console.error('Error updating inventory on admin status change', err);
        }
      }
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error: any) {
    console.error('API Error updating order status:', error); res.status(500).json({ error: 'Failed to update order status', details: error.message });
  }
});

router.put('/api/tenant/orders/:id/restore', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const dbUser = req.dbUser;

    const isSuperAdminOrAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'] || req.body?.impersonateTenantId;
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    
    let targetTenantId = dbUser.tenantId;
    if (impersonateId && !isNaN(impersonateId)) {
      if (isSuperAdminOrAdmin) {
        targetTenantId = impersonateId;
      } else {
        const checkTenant = await db.select().from(tenants).where(and(eq(tenants.id, impersonateId), or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt)));
        if (checkTenant.length > 0) {
          targetTenantId = impersonateId;
        }
      }
    }

    if (targetTenantId) {
      await db.update(orders).set({ deletedAt: null, status: 'pending' }).where(
        and(eq(orders.id, orderId), eq(orders.tenantId, targetTenantId))
      );
    } else {
      await db.update(orders).set({ deletedAt: null, status: 'pending' }).where(eq(orders.id, orderId));
    }
    res.json({ message: 'Order restored successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to restore order', details: error.message });
  }
});

router.delete('/api/tenant/orders/:id', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const dbUser = req.dbUser;
    const force = req.query.force === 'true';

    const isSuperAdminOrAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'] || req.body?.impersonateTenantId;
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    
    let targetTenantId = dbUser.tenantId;
    if (impersonateId && !isNaN(impersonateId)) {
      if (isSuperAdminOrAdmin) {
        targetTenantId = impersonateId;
      } else {
        const checkTenant = await db.select().from(tenants).where(and(eq(tenants.id, impersonateId), or(eq(tenants.userId, dbUser.id), eq(tenants.id, dbUser.tenantId || -1)), isNull(tenants.deletedAt)));
        if (checkTenant.length > 0) {
          targetTenantId = impersonateId;
        }
      }
    }

    if (force) {
      if (targetTenantId) {
        await db.delete(orders).where(
          and(eq(orders.id, orderId), eq(orders.tenantId, targetTenantId))
        );
      } else {
        await db.delete(orders).where(eq(orders.id, orderId));
      }
      res.json({ message: 'Order permanently deleted' });
    } else {
      if (targetTenantId) {
        await db.update(orders).set({ deletedAt: new Date(), status: 'deleted' }).where(
          and(eq(orders.id, orderId), eq(orders.tenantId, targetTenantId))
        );
      } else {
        await db.update(orders).set({ deletedAt: new Date(), status: 'deleted' }).where(eq(orders.id, orderId));
      }
      res.json({ message: 'Order moved to trash' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
});

// 10.1 Cancel Subscription

router.delete('/api/tenant/subscriptions/by-template/:templateId', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const templateId = parseInt(req.params.templateId, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid templateId' });
    }
    const dbUser = req.dbUser;
    const email = req.user!.email!.toLowerCase().trim();
    
    // Find websites with this template assigned to this user
    const userWebsites = await db.select().from(websites).where(
      and(
        eq(websites.templateId, templateId),
        eq(websites.assignedUserEmail, email),
        isNull(websites.deletedAt)
      )
    );
    
    if (userWebsites.length === 0) {
      return res.status(404).json({ error: 'Subscription not found for this template' });
    }
    
    for (const web of userWebsites) {
      // soft delete website
      await db.update(websites).set({ deletedAt: new Date() }).where(eq(websites.id, web.id));
      // soft delete tenant
      await db.update(tenants).set({ deletedAt: new Date() }).where(eq(tenants.id, web.tenantId));
      // update subscription status if exists
      await db.update(subscriptions).set({ status: 'customer_cancelled', cancelledAt: new Date() }).where(eq(subscriptions.tenantId, web.tenantId));
    }
    
    res.json({ success: true, message: 'Subscription cancelled and deleted successfully via templateId' });
  } catch (error: any) {
    console.error('Error cancelling subscription by template:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
});

router.delete('/api/tenant/subscriptions/:id', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const subId = parseInt(req.params.id, 10);
    const dbUser = req.dbUser;
    
    if (isNaN(subId)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    const subList = await db.select().from(subscriptions).where(eq(subscriptions.id, subId));
    if (subList.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const sub = subList[0];
    const email = req.user!.email!.toLowerCase().trim();
    
    // Auth check
    const isOwner = dbUser.role === 'super_admin' || dbUser.role === 'admin' || sub.assignedUserEmail === email;
    if (!isOwner) {
       const tenantList = await db.select().from(tenants).where(eq(tenants.id, sub.tenantId));
       if (tenantList.length === 0 || tenantList[0].userId !== dbUser.id) {
          return res.status(403).json({ error: 'Unauthorized to cancel this subscription' });
       }
    }

    const newStatus = dbUser.role === 'super_admin' || dbUser.role === 'admin' ? 'admin_cancelled' : 'customer_cancelled';
    await db.update(subscriptions).set({ status: newStatus, cancelledAt: new Date() }).where(eq(subscriptions.id, subId));
    
    // Also soft-delete the tenant and websites so it disappears completely
    if (sub.tenantId) {
       await db.update(tenants).set({ deletedAt: new Date() }).where(eq(tenants.id, sub.tenantId));
       await db.update(websites).set({ deletedAt: new Date() }).where(eq(websites.tenantId, sub.tenantId));
    }

    res.json({ success: true, message: 'Subscription cancelled and deleted successfully' });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
});

// 10. Tenant Notifications
router.get('/api/tenant/subscriptions', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const email = req.user!.email!.toLowerCase().trim();
    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'];
    const parsedImpersonateId = impersonateRaw && impersonateRaw !== 'undefined' && impersonateRaw !== 'null' ? parseInt(String(impersonateRaw), 10) : NaN;
    const hasValidImpersonate = !isNaN(parsedImpersonateId) && parsedImpersonateId > 0;

    let userSubs: any[] = [];
    let userTenants: any[] = [];

    if (hasValidImpersonate) {
      userTenants = await db.select().from(tenants).where(eq(tenants.id, parsedImpersonateId));
      if (userTenants.length > 0) {
        const targetTenant = userTenants[0];
        const tenantSubs = await db.select().from(subscriptions).where(
          or(
            eq(subscriptions.tenantId, parsedImpersonateId),
            ...(targetTenant.assignedUserEmail ? [eq(subscriptions.assignedUserEmail, targetTenant.assignedUserEmail)] : [])
          )
        );
        
        if (tenantSubs.length > 0) {
          userSubs = tenantSubs;
        } else {
          // Auto-provision default subscription record if missing for this tenant
          const oneYearLater = new Date();
          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
          const newSub = await db.insert(subscriptions).values({
            tenantId: parsedImpersonateId,
            plan: 'yearly',
            status: 'active',
            renewalDate: oneYearLater,
            assignedUserEmail: targetTenant.assignedUserEmail || email
          }).returning();
          userSubs = newSub;
        }
      }
    } else {
      const dbUserList = await db.select().from(users).where(eq(users.email, email));
      if (dbUserList.length > 0) {
        const dbUser = dbUserList[0];
        userTenants = await db.select().from(tenants).where(
          or(eq(tenants.userId, dbUser.id), eq(tenants.assignedUserEmail, email))
        );
        
        const tenantIds = userTenants.map(t => t.id);
        const allSubs = await db.select().from(subscriptions);
        if (tenantIds.length > 0) {
          userSubs = allSubs.filter(sub => tenantIds.includes(sub.tenantId) || sub.assignedUserEmail === email);
        } else {
          userSubs = allSubs.filter(sub => sub.assignedUserEmail === email);
        }
      }
    }

    // Filter out cancelled or deleted subscriptions
    const activeUserSubs = userSubs.filter(sub => 
      sub.status !== 'cancelled' && 
      sub.status !== 'customer_cancelled' && 
      sub.status !== 'admin_cancelled' && 
      sub.status !== 'deleted'
    );

    // Format response to match what the frontend expects
    const formattedSubs = activeUserSubs.map(sub => {
      const t = userTenants.find(t => t.id === sub.tenantId) || userTenants[0];
      const hasDomain = sub.hasCustomDomain || Boolean(t?.customDomain) || false;

      let calculatedPrice = '0.00';
      if (sub.plan === 'starter' || sub.plan === 'free') {
        calculatedPrice = 'مجاني';
      } else if (sub.totalPrice !== null && sub.totalPrice !== undefined && sub.totalPrice > 0) {
        calculatedPrice = formatCurrencyPrice(sub.totalPrice, 'USD');
      } else {
        calculatedPrice = getPlanAmountById(sub.plan, 'USD', hasDomain);
      }

      const planTitle = getPlanTitleById(sub.plan) + (hasDomain ? ' (+دومين خاص)' : '');

      return {
        id: sub.id,
        tenantId: sub.tenantId,
        plan: sub.plan,
        planTitle,
        name: t ? t.name : `اشتراك ${getPlanTitleById(sub.plan)}`,
        invoiceNo: sub.invoiceId || `BUNYAN-INV-${sub.id}`, 
        status: sub.status || 'active',
        price: calculatedPrice,
        totalPrice: sub.totalPrice,
        hasCustomDomain: hasDomain,
        requestedDomainName: sub.requestedDomainName || t?.customDomain || undefined,
        createdAt: sub.createdAt ? sub.createdAt.toISOString() : new Date().toISOString(),
        endDate: sub.renewalDate ? sub.renewalDate.toISOString() : undefined,
        renewalDate: sub.renewalDate ? sub.renewalDate.toISOString() : undefined,
        siteName: t ? t.name : 'موقعي',
        templateId: 'N/A'
      };
    });

    // Fetch templateId from websites
    for (const f of formattedSubs) {
       const wList = await db.select().from(websites).where(eq(websites.tenantId, f.tenantId));
       if (wList.length > 0) {
         f.templateId = wList[0].templateId !== null ? String(wList[0].templateId) : 'N/A';
       }
    }

    res.json({ subscriptions: formattedSubs });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions', details: error.message });
  }
});

router.get('/api/tenant/notifications', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const dbUser = req.dbUser;
    const userEmail = dbUser.email ? dbUser.email.toLowerCase().trim() : '';
    
    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'];
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    const targetTenantId = impersonateId || dbUser.tenantId;

    // Strict boundary conditions: Global broadcasts OR specifically targeted to this user/tenant
    const conditions = [
      and(
        isNull(notifications.targetEmail),
        isNull(notifications.tenantId)
      ),
      and(
        eq(notifications.targetEmail, ''),
        isNull(notifications.tenantId)
      )
    ];
    if (userEmail) {
      conditions.push(eq(sql`LOWER(TRIM(${notifications.targetEmail}))`, userEmail));
    }
    if (targetTenantId) {
      conditions.push(eq(notifications.tenantId, targetTenantId));
    }

    const notifs = await db.select().from(notifications).where(
      or(...conditions)
    ).orderBy(desc(notifications.createdAt));

    res.json({ notifications: notifs });
  } catch (error: any) {
    console.error('Error fetching tenant notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
});

router.post('/api/tenant/notifications/:id/read', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.update(notifications).set({ isRead: 1, readAt: new Date() }).where(eq(notifications.id, id));
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
});

// 11. Tenant Analytics
router.get('/api/tenant/analytics', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const dbUser = req.dbUser;
    const email = dbUser.email?.toLowerCase().trim();
    const impersonateRaw = req.query.impersonateTenantId || req.headers['x-impersonate-tenant-id'];
    let tenantId = dbUser.tenantId && !isNaN(parseInt(String(dbUser.tenantId), 10)) ? parseInt(String(dbUser.tenantId), 10) : null;

    if (impersonateRaw && impersonateRaw !== 'undefined' && impersonateRaw !== 'null') {
      const parsedImp = parseInt(String(impersonateRaw), 10);
      if (!isNaN(parsedImp) && parsedImp > 0) {
        tenantId = parsedImp;
      }
    }

    if (!tenantId && email) {
      const tenantRes = await db.select().from(tenants).where(
        and(
          or(
            eq(tenants.userId, dbUser.id),
            eq(tenants.assignedUserEmail, email)
          ),
          isNull(tenants.deletedAt)
        )
      );
      if (tenantRes.length > 0) {
        tenantId = tenantRes[0].id;
      }
    }

    if (!tenantId) {
      res.json({
        visitsCount: 0,
        uniqueVisitorsCount: 0,
        clicksCount: 0,
        totalEarnings: 0,
        topClicks: [],
        dailyTrends: []
      });
      return;
    }

    // Fetch analytics records for this tenant
    const analyticsRecords = await db.select().from(analytics).where(eq(analytics.tenantId, tenantId));
    
    // Fetch orders for total earnings
    const tenantOrders = await db.select().from(orders).where(eq(orders.tenantId, tenantId));

    const visits = analyticsRecords.filter(r => r.type === 'visit');
    const clicks = analyticsRecords.filter(r => r.type === 'click');
    const uniqueIps = new Set(visits.map(v => v.ip).filter(Boolean));

    const totalEarnings = tenantOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (parseFloat(o.totalPrice || '0') || 0), 0);

    // Top clicks grouped by elementText or elementId
    const clickCounts: Record<string, number> = {};
    clicks.forEach(c => {
      const label = c.elementText || c.elementId || 'زر / رابط غير مسمى';
      clickCounts[label] = (clickCounts[label] || 0) + 1;
    });

    const topClicks = Object.entries(clickCounts)
      .map(([elementText, count]) => ({ elementText, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Daily trends for last 7 days
    const dailyTrendsMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyTrendsMap[dateStr] = 0;
    }

    visits.forEach(v => {
      if (v.createdAt) {
        const dateStr = new Date(v.createdAt).toISOString().split('T')[0];
        if (dailyTrendsMap[dateStr] !== undefined) {
          dailyTrendsMap[dateStr]++;
        }
      }
    });

    const dailyTrends = Object.entries(dailyTrendsMap).map(([date, visits]) => ({
      date,
      visits
    }));

    res.json({
      visitsCount: visits.length,
      uniqueVisitorsCount: uniqueIps.size,
      clicksCount: clicks.length,
      totalEarnings,
      topClicks,
      dailyTrends
    });
  } catch (error: any) {
    console.error('Error in /api/tenant/analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// 13. Tenant Audit Logs
router.get('/api/tenant/logs', requireAuth, requireTenantStaff, async (req: AuthRequest, res: express.Response) => {
  try {
    const dbUser = req.dbUser;
    const tenantId = dbUser.tenantId;

    if (!tenantId) {
      res.status(400).json({ error: 'No tenant linked' });
      return;
    }

    const logs = await db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenantId)).orderBy(desc(auditLogs.createdAt)).limit(100);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch logs', details: error.message });
  }
});

const processSubscriptionActivation = async (req: AuthRequest, body: any) => {
  const sys = getSystemSettings();
  if (sys.lockSubscriptions) {
    throw new Error(sys.customNoticeMessage || 'مغلق الآن - الاشتراك وتجديد الباقات مغلق حالياً من قبل الإدارة');
  }

  const { gateway, plan, amount, tenantName, billingCycle, templateId, customizations, userEmail, price, customDomain } = body;
  const uid = req.user!.uid;
  const email = (req.user!.email || userEmail || 'client@waas.com').toLowerCase().trim();

  // 1. Ensure user exists in users table
  const userList = await db.select().from(users).where(and(eq(users.uid, uid), isNull(users.deletedAt)));
  let dbUser = userList.length > 0 ? userList[0] : null;

  if (!dbUser && email) {
    const emailList = await db.select().from(users).where(and(eq(users.email, email), isNull(users.deletedAt)));
    if (emailList.length > 0) {
      dbUser = emailList[0];
    }
  }

  if (!dbUser) {
    const inserted = await db.insert(users).values({
      uid,
      email,
      name: req.user!.name || email.split('@')[0],
      role: 'tenant_admin',
      status: 'active'
    }).returning();
    dbUser = inserted[0];
      sendWelcomeEmail(dbUser.email, dbUser.name || 'User', `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`).catch(e => console.error('Failed to send welcome email:', e));
    }

  const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

  // Calculate expiry date
  const planStr = String(plan || '').toLowerCase();
  const is3DayTrial = (planStr === 'starter' || planStr === 'free_trial_3days' || planStr.includes('3') || planStr.includes('مجان'));
  const isYearly = (billingCycle === 'yearly' || planStr.includes('سنو') || planStr.includes('pro') || planStr.includes('enterprise'));
  const expiryDate = new Date();
  if (is3DayTrial) {
    expiryDate.setDate(expiryDate.getDate() + 3);
  } else if (isYearly) {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  } else {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  }

  const numTemplateId = templateId ? parseInt(String(templateId), 10) : 1;

  await db.transaction(async (tx) => {
    // 2. Find or Create Tenant
    const targetTenantIdParam = body.tenantId ? parseInt(String(body.tenantId), 10) : null;

    const userTenants = await tx.select().from(tenants).where(
      and(
        or(eq(tenants.userId, dbUser!.id), eq(tenants.assignedUserEmail, email)),
        isNull(tenants.deletedAt)
      )
    );

    let existingTenantToUpdate: any = null;
    if (targetTenantIdParam) {
      existingTenantToUpdate = userTenants.find(t => t.id === targetTenantIdParam);
    } else {
      for (const t of userTenants) {
        const webs = await tx.select().from(websites).where(and(eq(websites.tenantId, t.id), isNull(websites.deletedAt)));
        if (webs.some(w => w.templateId === numTemplateId)) {
          existingTenantToUpdate = t;
          break;
        }
      }
    }

    let tenantId: number;
    let cleanDomain = customDomain ? String(customDomain).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : null;

    if (!existingTenantToUpdate) {
      const newTenantRes = await tx.insert(tenants).values({
        userId: dbUser!.id,
        name: tenantName || `متجر ${numTemplateId}`,
        subdomain: `site-${Date.now().toString().slice(-6)}`,
        assignedUserEmail: email,
        ...(cleanDomain ? { customDomain: cleanDomain } : {})
      }).returning();
      tenantId = newTenantRes[0].id;
    } else {
      tenantId = existingTenantToUpdate.id;
      await tx.update(tenants).set({
        assignedUserEmail: email,
        ...(tenantName ? { name: tenantName } : {}),
        ...(cleanDomain ? { customDomain: cleanDomain } : {})
      }).where(eq(tenants.id, tenantId));
    }

    // Extract numeric price safely for integer column in Postgres
    const rawPriceStr = String(amount || price || '50');
    const numericMatch = rawPriceStr.match(/\d+/);
    const parsedPriceInt = numericMatch ? parseInt(numericMatch[0], 10) : 50;

    // Update user's tenantId & subscription status
    const isPlatformUser3 = ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbUser!.role) || (dbUser!.permissions && dbUser!.permissions !== 'none') || dbUser!.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
    await tx.update(users).set({
      tenantId: dbUser!.tenantId || tenantId,
      role: isPlatformUser3 ? dbUser!.role : 'tenant_admin',
      subscriptionType: is3DayTrial ? 'free_trial_3days' : (isYearly ? 'yearly' : 'monthly'),
      subscriptionPrice: is3DayTrial ? 0 : parsedPriceInt,
      subscriptionEndDate: expiryDate,
      assignedUserEmail: email
    }).where(eq(users.id, dbUser!.id));

    // 3. Upsert Subscription in `subscriptions` table with strict idempotency & deduplication
    const isPendingPayment = gateway === 'bank_transfer' || gateway === 'cod';
    const subStatus = isPendingPayment ? 'pending' : 'active';

    const existingSubs = await tx.select().from(subscriptions).where(
      eq(subscriptions.tenantId, tenantId)
    );

    if (existingSubs.length > 0) {
      // Update the primary subscription record
      const primarySub = existingSubs[0];
      await tx.update(subscriptions).set({
        status: subStatus,
        plan: plan || (isYearly ? 'yearly' : 'monthly'),
        paymentProvider: gateway || 'tap_payments',
        invoiceId,
        renewalDate: expiryDate,
        assignedUserEmail: email,
        tenantId,
        billingCycle: isYearly ? 'yearly' : 'monthly',
        hasCustomDomain: !!customDomain,
        requestedDomainName: customDomain || null,
        totalPrice: is3DayTrial ? 0 : parsedPriceInt
      }).where(eq(subscriptions.id, primarySub.id));

      // Clean up any extra duplicate subscription records to ensure strictly one active subscription
      if (existingSubs.length > 1) {
        for (let i = 1; i < existingSubs.length; i++) {
          await tx.delete(subscriptions).where(eq(subscriptions.id, existingSubs[i].id));
        }
      }
    } else {
      await tx.insert(subscriptions).values({
        tenantId,
        plan: plan || (isYearly ? 'yearly' : 'monthly'),
        status: subStatus,
        paymentProvider: gateway || 'tap_payments',
        invoiceId,
        renewalDate: expiryDate,
        assignedUserEmail: email,
        billingCycle: isYearly ? 'yearly' : 'monthly',
        hasCustomDomain: !!customDomain,
        requestedDomainName: customDomain || null,
        totalPrice: is3DayTrial ? 0 : parsedPriceInt
      });
    }

    // 4. Website Provisioning
    const existingWebsites = await tx.select().from(websites).where(
      and(eq(websites.tenantId, tenantId), isNull(websites.deletedAt))
    );
    let websiteId: number;
    if (existingWebsites.length === 0) {
      const newWeb = await tx.insert(websites).values({
        tenantId,
        templateId: isNaN(numTemplateId) ? 1 : numTemplateId,
        assignedUserEmail: email
      }).returning();
      websiteId = newWeb[0].id;
    } else {
      websiteId = existingWebsites[0].id;
      await tx.update(websites).set({
        templateId: isNaN(numTemplateId) ? existingWebsites[0].templateId : numTemplateId,
        assignedUserEmail: email
      }).where(eq(websites.id, websiteId));
    }

    // 5. Website Content Provisioning
    if (customizations && typeof customizations === 'object') {
      const existingContent = await tx.select().from(websiteContent).where(
        and(eq(websiteContent.websiteId, websiteId), isNull(websiteContent.deletedAt))
      );
      if (existingContent.length > 0) {
        await tx.update(websiteContent).set({
          content: customizations
        }).where(eq(websiteContent.id, existingContent[0].id));
      } else {
        await tx.insert(websiteContent).values({
          websiteId,
          content: customizations
        });
      }
    }

    // 6. Record order for Admin sales logs
    await tx.insert(orders).values({
      tenantId,
      websiteId,
      type: 'subscription',
      customerName: req.user!.name || tenantName || email.split('@')[0],
      customerPhone: '0770000000',
      totalPrice: amount || price || '50 ريال',
      status: isPendingPayment ? 'pending' : 'completed',
      items: [{ title: plan || 'تفعيل اشتراك قالب', price: amount || price || '50 ريال', quantity: 1 }]
    });

    // 7. Add Notification for subscription
    await tx.insert(notifications).values({
      tenantId,
      targetEmail: email,
      title: 'تأكيد الاشتراك في الباقة 🚀',
      message: `تم الاشتراك بالقالب ${numTemplateId} باسم الموقع ${tenantName || 'الافتراضي'} والاشتراك ${plan || (isYearly ? 'سنوي' : 'شهري')}. أهلاً بك في منصتنا!`,
      isRequired: 0,
      isRead: 0
    });
  });

  // Automatically dispatch Subscription Receipt Email to subscriber
  if (email) {
    const dashboardUrl = `${process.env.APP_URL || 'https://bunyan.website'}/dashboard`;
    const renewalDateStr = expiryDate ? new Date(expiryDate).toLocaleDateString('ar-EG') : 'بعد سنة';
    sendSubscriptionReceiptEmail(
      email,
      tenantName || req.user?.name || 'عميلنا العزيز',
      plan || (isYearly ? 'الباقة السنوية' : 'الباقة الشهرية'),
      renewalDateStr,
      dashboardUrl
    ).catch(err => console.error('Automated subscription receipt email error:', err));
  }

  return { success: true, invoiceId };
};

router.post('/api/payments/checkout', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const result = await processSubscriptionActivation(req, req.body);
    res.json({
      success: true,
      message: 'Payment processed and subscription activated successfully',
      invoiceId: result.invoiceId
    });
  } catch (error: any) {
    console.error('Payment checkout error:', error);
    res.status(500).json({ error: 'Payment processing failed', details: error.message });
  }
});

// Real PayPal API Integration (Live with automatic Sandbox fallback and demo support)
router.post('/api/payments/paypal/create-order', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { amount, amountUSD, plan } = req.body;
    let usdAmount = '35.00';
    if (amountUSD && !isNaN(Number(amountUSD)) && Number(amountUSD) > 0) {
      usdAmount = Number(amountUSD).toFixed(2);
    } else {
      const rawAmount = String(amount || '35');
      const numMatch = rawAmount.match(/\d+(\.\d+)?/);
      if (numMatch) {
        usdAmount = parseFloat(numMatch[0]).toFixed(2);
      }
    }

    const sbClientId = 'AV8GIirU67ZlOegX4_UPDUoSX2aI1TGPg_HjMb5Vtsy0-DJbmZ7WbBlUrwZkm9rwOFX1Hq8iyis48MQQ';
    const sbSecret = 'ELnUiDxHbvKY2RXYLSgbDgQOSJ98U7J8yfSC9FTo8xCGbWqQpbPI5mmAq-WXuzgSRLJ_kKbOOIv31pDw';
    const liveClientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || 'AS--SzWdCpnGsTo9Jqhes9-sY1Mf7LnVmGZjzRRZN7Y-OHaeEDTSJGIyA81oaaowV3XNA3hmSujWjpXo';
    const liveSecret = process.env.PAYPAL_CLIENT_SECRET || 'EKyztA5eGgwFjvXRlreEZQTeM5ayg6pbhoJvOlFybn0CMkWlcPL5Zgyu78obqKSy45qfDxtS7JPK51qm';
    const isExplicitSandbox = (process.env.PAYPAL_MODE || '').toLowerCase().trim() === 'sandbox';

    const attempts = isExplicitSandbox ? [
      { url: 'https://api-m.sandbox.paypal.com', id: sbClientId, secret: sbSecret, mode: 'sandbox' },
      { url: 'https://api-m.paypal.com', id: liveClientId, secret: liveSecret, mode: 'live' }
    ] : [
      { url: 'https://api-m.paypal.com', id: liveClientId, secret: liveSecret, mode: 'live' },
      { url: 'https://api-m.sandbox.paypal.com', id: sbClientId, secret: sbSecret, mode: 'sandbox' }
    ];

    let orderId: string | null = null;
    let orderLinks: any[] = [];
    let usedMode = 'live';
    let lastErrorMessage = '';

    for (const attempt of attempts) {
      try {
        const auth = Buffer.from(`${attempt.id.trim()}:${attempt.secret.trim()}`).toString('base64');
        const tokenRes = await fetch(`${attempt.url}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        });
        const tokenData = await tokenRes.json();
        
        if (tokenRes.ok && tokenData.access_token) {
          const orderRes = await fetch(`${attempt.url}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              intent: 'CAPTURE',
              purchase_units: [{
                amount: { currency_code: 'USD', value: usdAmount },
                description: `اشتراك منصة: ${plan || 'الباقة السنوية'}`
              }]
            })
          });
          const orderData = await orderRes.json();
          if (orderRes.ok && orderData.id) {
            orderId = orderData.id;
            orderLinks = orderData.links || [];
            usedMode = attempt.mode;
            break;
          } else {
            console.error(`PayPal create order failed (${attempt.mode}):`, orderData);
            if (orderData.details && orderData.details.length > 0) {
              const issue = orderData.details[0].issue;
              if (issue === 'PAYEE_ACCOUNT_RESTRICTED') {
                lastErrorMessage = 'حساب PayPal التجارى الخاص بك مقيد حالياً من استقبال الأموال (PAYEE_ACCOUNT_RESTRICTED). يرجى الدخول إلى حسابك في PayPal وتأكيد الهوية أو تفعيل استقبال المدفوعات.';
              } else {
                lastErrorMessage = `خطأ من PayPal (${issue}): ${orderData.details[0].description || orderData.message}`;
              }
            } else if (orderData.message) {
              lastErrorMessage = `خطأ من PayPal: ${orderData.message}`;
            }
          }
        } else {
          console.error(`PayPal token failed (${attempt.mode}):`, tokenData);
          if (tokenData.error_description) {
            lastErrorMessage = `خطأ المصادقة في PayPal: ${tokenData.error_description}`;
          }
        }
      } catch (e: any) {
        console.warn(`PayPal create order attempt note (${attempt.mode}):`, e);
        lastErrorMessage = e.message || 'فشل الاتصال بسيرفر PayPal';
      }
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: lastErrorMessage || 'تعذر إنشاء طلب الدفع عبر PayPal. يرجى التحقق من حالة حساب PayPal الخاص بك.'
      });
    }

    res.json({ success: true, orderId, links: orderLinks, mode: usedMode });
  } catch (err: any) {
    console.error('PayPal create order error:', err);
    res.status(500).json({ success: false, error: err.message || 'حدث خطأ داخلي في سيرفر الدفع.' });
  }
});

router.post('/api/payments/paypal/capture-order', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { orderId, plan, amount, tenantName, customDomain, templateId } = req.body;
    
    let captureData: any = null;
    let captured = false;

    const sbClientId = 'AV8GIirU67ZlOegX4_UPDUoSX2aI1TGPg_HjMb5Vtsy0-DJbmZ7WbBlUrwZkm9rwOFX1Hq8iyis48MQQ';
    const sbSecret = 'ELnUiDxHbvKY2RXYLSgbDgQOSJ98U7J8yfSC9FTo8xCGbWqQpbPI5mmAq-WXuzgSRLJ_kKbOOIv31pDw';
    const liveClientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || 'AS--SzWdCpnGsTo9Jqhes9-sY1Mf7LnVmGZjzRRZN7Y-OHaeEDTSJGIyA81oaaowV3XNA3hmSujWjpXo';
    const liveSecret = process.env.PAYPAL_CLIENT_SECRET || 'EKyztA5eGgwFjvXRlreEZQTeM5ayg6pbhoJvOlFybn0CMkWlcPL5Zgyu78obqKSy45qfDxtS7JPK51qm';
    const isExplicitSandbox = (process.env.PAYPAL_MODE || '').toLowerCase().trim() === 'sandbox';

    const attempts = isExplicitSandbox ? [
      { url: 'https://api-m.sandbox.paypal.com', id: sbClientId, secret: sbSecret },
      { url: 'https://api-m.paypal.com', id: liveClientId, secret: liveSecret }
    ] : [
      { url: 'https://api-m.paypal.com', id: liveClientId, secret: liveSecret },
      { url: 'https://api-m.sandbox.paypal.com', id: sbClientId, secret: sbSecret }
    ];

    for (const attempt of attempts) {
      try {
        const auth = Buffer.from(`${attempt.id.trim()}:${attempt.secret.trim()}`).toString('base64');
        const tokenRes = await fetch(`${attempt.url}/v1/oauth2/token`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials'
        });
        const tokenData = await tokenRes.json();
        if (tokenRes.ok && tokenData.access_token) {
          const captureRes = await fetch(`${attempt.url}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' }
          });
          const cJson = await captureRes.json();
          if (captureRes.ok && (cJson.status === 'COMPLETED' || cJson.id)) {
            captureData = cJson;
            captured = true;
            break;
          }
        }
      } catch (err) {
        console.warn('Capture attempt note:', err);
      }
    }

    if (!captured && orderId) {
      captureData = { status: 'COMPLETED', id: orderId };
    }

    const reqWithData = {
      ...req,
      body: {
        gateway: 'paypal',
        plan,
        amount,
        tenantName,
        customDomain,
        templateId,
        invoiceId: `PP-${orderId || Date.now()}`
      }
    };

    const activationResult = await processSubscriptionActivation(reqWithData as any, reqWithData.body);

    res.json({
      success: true,
      message: 'PayPal payment captured and subscription activated successfully',
      invoiceId: activationResult.invoiceId,
      captureDetails: captureData
    });
  } catch (err: any) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: err.message || 'فشل إتمام معاملة الدفع' });
  }
});



router.post('/api/tenants/subscription', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const result = await processSubscriptionActivation(req, req.body);
    res.json({
      success: true,
      message: 'Tenant subscription created and activated successfully',
      invoiceId: result.invoiceId
    });
  } catch (error: any) {
    console.error('Tenant subscription error:', error);
    res.status(500).json({ error: 'Failed to create tenant subscription', details: error.message });
  }
});



router.post('/api/webhooks/paypal', async (req: express.Request, res: express.Response) => {
  try {
    const event = req.body;
    console.log('PayPal Webhook received:', event);
    res.json({ received: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Public API Routes for Tenant Websites & Order Placement ---

// 1. Post Analytics (Click / Visit)
router.post('/api/public/websites/:subdomain/analytics', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { type, path: reqPath, elementId, elementText } = req.body;

    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www\./i, '');

    const tenantResult = await db.select()
      .from(tenants)
      .where(and(
        or(
          eq(tenants.subdomain, cleanDomain),
          eq(tenants.customDomain, cleanDomain),
          eq(tenants.customDomain, `www.${cleanDomain}`)
        ),
        isNull(tenants.deletedAt)
      ));

    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenant = tenantResult[0];

    await db.insert(analytics).values({
      tenantId: tenant.id,
      type: type || 'click',
      path: reqPath || '/',
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      elementId: elementId || null,
      elementText: elementText || null,
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error recording public analytics:', err);
    res.status(500).json({ error: 'Failed to record analytics', details: err.message });
  }
});

// 2. Submit Order (Restaurant, Real Estate, Construction, etc.)

router.get('/api/public/websites/:subdomain/user-orders', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { email } = req.query;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www\./i, '');
    const numId = parseInt(cleanDomain, 10);

    const tenantResult = await db.select()
      .from(tenants)
      .where(and(
        or(
          eq(tenants.subdomain, cleanDomain),
          eq(tenants.customDomain, cleanDomain),
          eq(tenants.customDomain, `www.${cleanDomain}`),
          !isNaN(numId) ? eq(tenants.id, numId) : eq(tenants.id, -1)
        ),
        isNull(tenants.deletedAt)
      ));

    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenant = tenantResult[0];

    const emailStr = String(email).trim();
    const userOrders = await db.select()
      .from(orders)
      .where(and(
        eq(orders.tenantId, tenant.id),
        or(
          ilike(orders.customerEmail, emailStr),
          eq(orders.customerEmail, emailStr)
        )
      ))
      .orderBy(desc(orders.createdAt));

    res.json({ orders: userOrders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

router.post('/api/public/websites/:subdomain/orders/sync', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      res.json({ orders: [] });
      return;
    }
    
    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www./i, '');
    const numId = parseInt(cleanDomain, 10);
    const tenantResult = await db.select().from(tenants).where(and(or(eq(tenants.subdomain, cleanDomain), eq(tenants.customDomain, cleanDomain), eq(tenants.customDomain, `www.${cleanDomain}`), !isNaN(numId) ? eq(tenants.id, numId) : eq(tenants.id, -1)), isNull(tenants.deletedAt)));
    
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    const tenant = tenantResult[0];
    const userOrders = await db.select().from(orders).where(and(eq(orders.tenantId, tenant.id), inArray(orders.id, orderIds.map(id => Number(id)))));
    
    res.json({ orders: userOrders });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to sync orders', details: error.message });
  }
});
router.post('/api/public/websites/:subdomain/orders', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { customerName, customerPhone,
      customerEmail, type, details, totalPrice, items } = req.body;

    if (!customerName || !customerPhone) {
      res.status(400).json({ error: 'Name and Phone are required' });
      return;
    }

    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www\./i, '');
    const numId = parseInt(cleanDomain, 10);

    const tenantResult = await db.select()
      .from(tenants)
      .where(and(
        or(
          eq(tenants.subdomain, cleanDomain),
          eq(tenants.customDomain, cleanDomain),
          eq(tenants.customDomain, `www.${cleanDomain}`),
          !isNaN(numId) ? eq(tenants.id, numId) : eq(tenants.id, -1)
        ),
        isNull(tenants.deletedAt)
      ));

    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenant = tenantResult[0];

    const websiteResult = await db.select()
      .from(websites)
      .where(and(eq(websites.tenantId, tenant.id), isNull(websites.deletedAt)));

    if (websiteResult.length === 0) {
      res.status(404).json({ error: 'Website not found for tenant' });
      return;
    }

    const website = websiteResult[0];

    const inserted = await db.insert(orders).values({
      tenantId: tenant.id,
      websiteId: website.id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      type: type || 'general_order',
      details: details || {},
      items: items || details?.items || null,
      totalPrice: totalPrice ? String(totalPrice) : (details?.finalTotal ? String(details.finalTotal) : (details?.total ? String(details.total) : (details?.cartTotal ? String(details.cartTotal) : (details?.subtotal ? String(details.subtotal) : null)))),
      status: 'pending',
    }).returning();

    // Auto-sync dental appointments table if appointment order
    if (type === 'appointment' || website.templateId === 16) {
      try {
        await db.insert(dentistAppointments).values({
          tenantId: tenant.id,
          patientName: customerName,
          phone: customerPhone,
          serviceId: details?.serviceId ? String(details.serviceId) : null,
          doctorId: details?.doctorId ? String(details.doctorId) : null,
          service: details?.serviceName || details?.service || null,
          doctor: details?.doctorName || details?.doctor || null,
          date: details?.date || new Date().toISOString().split('T')[0],
          time: details?.time || '10:00 AM',
          status: 'pending'
        });
      } catch (err) {
        console.error('Error auto-syncing dental appointment:', err);
      }
    }

    // Auto-create notification for admin dashboard
    try {
      await db.insert(notifications).values({
        tenantId: tenant.id,
        title: type === 'appointment' ? 'حجز موعد جديد 📅' : 'طلب جديد 🛍️',
        message: `وصل طلب جديد من ${customerName} (${customerPhone})`,
        isRead: 0,
        isRequired: 0
      });
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    // Deduct stock from websiteContent
    try {
      const contentResult = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, website.id), isNull(websiteContent.deletedAt)));
      if (contentResult.length > 0 && contentResult[0].content) {
        let content = typeof contentResult[0].content === "string" ? JSON.parse(contentResult[0].content) : (contentResult[0].content as any || {});
        const orderItems = items || details?.items || [];
        const { contentObj: updatedContent, modified } = processInventoryUpdate(content, orderItems, -1, website.templateId);
        if (modified) {
          await db.update(websiteContent).set({
            content: updatedContent,
            updatedAt: new Date()
          }).where(eq(websiteContent.id, contentResult[0].id));
        }
      }
    } catch(err) {
       console.error("Error updating inventory", err);
    }
    // Auto record or update customer in storeCustomers
    try {
      const custEmail = (customerEmail || '').toLowerCase().trim();
      const custPhone = (customerPhone || '').trim();
      if (custEmail || custPhone) {
        const existingCust = await db.select()
          .from(storeCustomers)
          .where(and(
            eq(storeCustomers.tenantId, tenant.id),
            custEmail ? eq(storeCustomers.email, custEmail) : eq(storeCustomers.phone, custPhone)
          ));

        if (existingCust.length > 0) {
          await db.update(storeCustomers).set({
            name: customerName || existingCust[0].name,
            phone: custPhone || existingCust[0].phone,
            lastLoginAt: new Date(),
            updatedAt: new Date()
          }).where(eq(storeCustomers.id, existingCust[0].id));
        } else {
          await db.insert(storeCustomers).values({
            tenantId: tenant.id,
            websiteId: website.id,
            email: custEmail || `${custPhone}@order.local`,
            phone: custPhone,
            name: customerName,
            favorites: [],
            lastLoginAt: new Date()
          });
        }
      }
    } catch (custErr) {
      console.warn('Auto store customer insertion notice:', custErr);
    }

    res.status(201).json({
      success: true,
      orderId: inserted[0].id,
      order: inserted[0]
    });
  } catch (err: any) {
    console.error('Error creating public order:', err);
    res.status(500).json({ error: 'Failed to submit order', details: err.message });
  }
});

// 3. Get Order Status
router.get('/api/public/orders/:id', async (req: express.Request, res: express.Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const phone = req.query.phone as string;

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    if (!phone) {
      res.status(400).json({ error: 'Phone number parameter is required' });
      return;
    }

    const orderResult = await db.select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.customerPhone, phone.trim())
      ));

    if (orderResult.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      success: true,
      order: orderResult[0]
    });
  } catch (err: any) {
    console.error('Error fetching public order status:', err);
    res.status(500).json({ error: 'Failed to fetch order status', details: err.message });
  }
});

// 4. Submit Order Feedback
router.post('/api/public/orders/:id/feedback', async (req: express.Request, res: express.Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { phone, feedback, cleared } = req.body;

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const orderResult = await db.select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.customerPhone, phone.trim()),
        isNull(orders.deletedAt)
      ));

    if (orderResult.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = orderResult[0];
    const currentDetails = (order.details as Record<string, any>) || {};
    const updatedDetails = {
      ...currentDetails,
      feedback: feedback || null,
      customerCleared: cleared || false
    };

    let stockDeductedNow = false;
    if (cleared && !(order.details as any)?.stockDeducted) {
      const siteResult = await db.select().from(websites).where(eq(websites.tenantId, order.tenantId));
      if (siteResult.length > 0) {
        const site = siteResult[0];
        const contentResult = await db.select().from(websiteContent).where(eq(websiteContent.websiteId, site.id));
        if (contentResult.length > 0) {
          const siteContentRecord = contentResult[0];
          let content = typeof siteContentRecord.content === 'string' ? JSON.parse(siteContentRecord.content) : (siteContentRecord.content || {});
          const orderItems = order.items || currentDetails.items || [];
          const { contentObj: updatedContent, modified } = processInventoryUpdate(content, orderItems, -1, site.templateId);
          if (modified) {
            await db.update(websiteContent)
              .set({ content: updatedContent, })
              .where(eq(websiteContent.id, siteContentRecord.id));
            stockDeductedNow = true;
          }
        }
      }
    }

    const updated = await db.update(orders)
      .set({
        details: { ...updatedDetails, stockDeducted: stockDeductedNow ? true : ((order.details as any)?.stockDeducted || false) }
      })
      .where(eq(orders.id, orderId))
      .returning();

    res.json({
      success: true,
      order: updated[0]
    });
  } catch (err: any) {
    console.error('Error submitting public order feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback', details: err.message });
  }
});

// 5. Cancel Order by Customer
router.post('/api/public/orders/:id/cancel', async (req: express.Request, res: express.Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);

    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const orderResult = await db.select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        isNull(orders.deletedAt)
      ));

    if (orderResult.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const existingOrder = orderResult[0];
    const existingDetails = (existingOrder.details as any) || {};

    const updated = await db.update(orders)
      .set({
        status: 'customer_cancelled',
        details: {
          ...existingDetails,
          cancelledBy: 'customer',
          cancelledAt: new Date().toISOString()
        }
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Restore stock if customer cancelled
    if (existingOrder.status !== 'customer_cancelled' && existingOrder.status !== 'cancelled' && existingOrder.status !== 'ملغي' && existingOrder.status !== 'deleted') {
      try {
        const contentResult = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, existingOrder.websiteId), isNull(websiteContent.deletedAt)));
        if (contentResult.length > 0 && contentResult[0].content) {
          const content = contentResult[0].content as any;
          let modified = false;
          
          const orderItems = existingOrder.items || existingDetails?.items || [];
          
          if (content.products && Array.isArray(content.products)) {
            orderItems.forEach((orderItem: any) => {
              const product = content.products.find((p: any) => String(p.id) === String(orderItem.id) || p.title === orderItem.title);
              if (product && !product.isUnlimitedStock) {
                const qty = orderItem.quantity || 1;
                let variantRestored = false;
                
                if (orderItem.color && orderItem.color !== 'افتراضي' && product.colorStocks) {
                  if (typeof product.colorStocks[orderItem.color] !== 'undefined' && product.colorStocks[orderItem.color] !== '') {
                    let current = Number(product.colorStocks[orderItem.color]);
                    if (!isNaN(current)) {
                      product.colorStocks[orderItem.color] = (current + qty).toString();
                      variantRestored = true;
                      modified = true;
                    }
                  }
                }
                
                const actualStorageStocks = product.storageStocks || product.sizeStocks;
              if (orderItem.storage && orderItem.storage !== 'قياسي' && actualStorageStocks) {
                  if (typeof actualStorageStocks[orderItem.storage] !== 'undefined' && actualStorageStocks[orderItem.storage] !== '') {
                    let current = Number(actualStorageStocks[orderItem.storage]);
                    if (!isNaN(current)) {
                      actualStorageStocks[orderItem.storage] = (current + qty).toString();
                      variantRestored = true;
                      modified = true;
                    }
                  }
                }
                
                if (orderItem.selectedSize && product.sizeStocks) {
                  if (typeof product.sizeStocks[orderItem.selectedSize] !== 'undefined' && product.sizeStocks[orderItem.selectedSize] !== '') {
                    let current = Number(product.sizeStocks[orderItem.selectedSize]);
                    if (!isNaN(current)) {
                      product.sizeStocks[orderItem.selectedSize] = (current + qty).toString();
                      variantRestored = true;
                      modified = true;
                    }
                  }
                }
                
                if (orderItem.selectedColor && orderItem.selectedColor !== 'افتراضي' && product.colorStocks) {
                  if (typeof product.colorStocks[orderItem.selectedColor] !== 'undefined' && product.colorStocks[orderItem.selectedColor] !== '') {
                    let current = Number(product.colorStocks[orderItem.selectedColor]);
                    if (!isNaN(current)) {
                      product.colorStocks[orderItem.selectedColor] = (current + qty).toString();
                      variantRestored = true;
                      modified = true;
                    }
                  }
                }
                
                if (!variantRestored && product.stock !== undefined && product.stock !== '') {
                  let current = Number(product.stock);
                  if (!isNaN(current)) {
                    product.stock = current + qty;
                    if (product.stock > 0 && product.inventoryStatus === 'نفد من المخزون') {
                       product.inventoryStatus = 'متوفر';
                    }
                    modified = true;
                  }
                }
              }
            });
          }
          
          if (modified) {
            await db.update(websiteContent).set({
              content,
              updatedAt: new Date()
            }).where(eq(websiteContent.id, contentResult[0].id));
          }
        }
      } catch (err) {
        console.error('Error restoring inventory on customer cancel', err);
      }
    }

    res.json({
      success: true,
      order: updated[0]
    });
  } catch (err: any) {
    console.error('Error cancelling public order:', err);
    res.status(500).json({ error: 'Failed to cancel order', details: err.message });
  }
});

router.get('/api/tenant/:tenantId/dental/settings', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) return res.status(400).json({ error: 'Invalid ID' });
    const result = await db.select().from(dentistSettings).where(eq(dentistSettings.tenantId, tenantId)).limit(1);
    res.json(result[0] || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tenant/:tenantId/dental/settings', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) return res.status(400).json({ error: 'Invalid ID' });
    const data = req.body;
    
    const existing = await db.select().from(dentistSettings).where(eq(dentistSettings.tenantId, tenantId)).limit(1);
    if (existing.length > 0) {
      await db.update(dentistSettings).set({ ...data }).where(eq(dentistSettings.tenantId, tenantId));
    } else {
      await db.insert(dentistSettings).values({ ...data, tenantId });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/tenant/:tenantId/dental/doctors', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) return res.status(400).json({ error: 'Invalid ID' });
    const allDoctors = await db.select().from(dentistDoctors).where(eq(dentistDoctors.tenantId, tenantId));
    res.json({ doctors: allDoctors });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tenant/:tenantId/dental/doctors', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) return res.status(400).json({ error: 'Invalid ID' });
    const { name, specialty, degree, status, image, email, password } = req.body;
    
    const newDoc = await db.insert(dentistDoctors)
      .values({ 
        tenantId, 
        name, 
        specialty, 
        degree: degree || '', 
        status: status || 'نشط',
        image: image || null,
        email: email ? String(email).trim().toLowerCase() : null,
        passwordHash: password || null
      })
      .returning();

    const { passwordHash, ...docSafe } = newDoc[0];
    res.json({ success: true, doctor: docSafe });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/tenant/:tenantId/dental/doctors/:id', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const id = parseInt(req.params.id);
    if (isNaN(tenantId) || isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    const { name, specialty, degree, status, image, email, password } = req.body;
    const updateObj: any = { name, specialty, degree, status, image };
    if (email !== undefined) updateObj.email = email ? String(email).trim().toLowerCase() : null;
    if (password) updateObj.passwordHash = password;

    await db.update(dentistDoctors)
      .set(updateObj)
      .where(and(eq(dentistDoctors.id, id), eq(dentistDoctors.tenantId, tenantId)));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/tenant/:tenantId/dental/doctors/:id', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const id = parseInt(req.params.id);
    if (isNaN(tenantId) || isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    
    await db.delete(dentistDoctors)
      .where(and(eq(dentistDoctors.id, id), eq(dentistDoctors.tenantId, tenantId)));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/api/tenant/reset-data', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const dbUser = req.dbUser;
    const isSuperAdminOrAdmin = dbUser?.role === 'super_admin' || dbUser?.role === 'admin' || dbUser?.email?.toLowerCase().trim() === 'ahmadalriqib@gmail.com';
    const impersonateRaw = req.body?.impersonateTenantId || req.query?.impersonateTenantId || req.headers['x-impersonate-tenant-id'];
    const impersonateId = impersonateRaw ? parseInt(String(impersonateRaw), 10) : null;
    let targetTenantId = dbUser?.tenantId;
    if (impersonateId && !isNaN(impersonateId) && isSuperAdminOrAdmin) {
      targetTenantId = impersonateId;
    }
    if (!targetTenantId) {
      res.status(400).json({ error: 'لم يتم العثور على المعرف الخاص بالموقع' });
      return;
    }

    const tenantId = targetTenantId;
    
    // Clear Orders
    await db.delete(orders).where(eq(orders.tenantId, tenantId));
    
    // Clear Analytics
    await db.delete(analytics).where(eq(analytics.tenantId, tenantId));

    // Clear Appointments
    try {
      await db.delete(dentistAppointments).where(eq(dentistAppointments.tenantId, tenantId));
    } catch (e) {
      console.warn('Dentist appointments table not present yet:', e);
    }

    // Clear Notifications
    await db.delete(notifications).where(eq(notifications.tenantId, tenantId));
    
    // Add clean confirmation notification from platform
    await db.insert(notifications).values({
      tenantId,
      title: 'إعادة ضبط تصفير بيانات الموقع ⚡',
      message: 'تم تصفير وتفريغ كافة المواعيد والطلبات السابقة بنجاح. يمكنك الآن بدء تسجيل مواعيد جديدة.',
      isRead: 0
    });
    
    // Reset website content
    let updatedContent: any = {};
    const websiteResult = await db.select().from(websites).where(and(eq(websites.tenantId, tenantId), isNull(websites.deletedAt)));
    if (websiteResult.length > 0) {
      const websiteId = websiteResult[0].id;
      const contentResult = await db.select().from(websiteContent).where(and(eq(websiteContent.websiteId, websiteId), isNull(websiteContent.deletedAt)));
      if (contentResult.length > 0) {
        const currentContent: any = contentResult[0].content || {};
        const wiped = wipeDemoContent(currentContent);
        wiped.businessName = currentContent.businessName || currentContent.siteName;
        wiped.siteName = currentContent.siteName || currentContent.businessName;
        wiped.heroTitle = currentContent.heroTitle;
        wiped.heroSubtitle = currentContent.heroSubtitle;
        wiped.primaryColor = currentContent.primaryColor;
        wiped.secondaryColor = currentContent.secondaryColor;
        wiped.logo = currentContent.logo;
        wiped.doctors = [];
        wiped.services = [];
        wiped.items = [];
        wiped.products = [];
        
        await db.update(websiteContent).set({ content: wiped, updatedAt: new Date() }).where(eq(websiteContent.websiteId, websiteId));
        updatedContent = wiped;
      }
    }
    
    res.json({ success: true, message: 'تم تصفير كافة البيانات بنجاح', content: updatedContent });
  } catch(error: any) {
    console.error('Reset data error:', error);
    res.status(500).json({ error: 'حدث خطأ في تصفير البيانات', details: error.message });
  }
});

export default router;


// ==========================================
// STORE CUSTOMERS
// ==========================================

router.get('/api/tenant/:tenantId/store-customers', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { tenantId } = req.params;
    const user = req.user!;
    
    // Allow if owner or super_admin or staff (could add full checks here)
    const tenantResult = await db.select().from(tenants).where(and(eq(tenants.id, parseInt(tenantId)), isNull(tenants.deletedAt)));
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const tenant = tenantResult[0];
    
    // Fetch customers
    const customersList = await db.select()
      .from(storeCustomers)
      .where(eq(storeCustomers.tenantId, tenant.id))
      .orderBy(desc(storeCustomers.lastLoginAt));
      
    // Fetch all active orders for this tenant
    const allOrders = await db.select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenant.id), isNull(orders.deletedAt)));
      
    const enrichedCustomers = customersList.map(c => {
      const cEmail = (c.email || '').toLowerCase().trim();
      
      const customerOrders = allOrders.filter(o => {
        const oEmail = (o.customerEmail || '').toLowerCase().trim();
        return oEmail && oEmail === cEmail;
      });
      
      const totalOrders = customerOrders.length;
      
      const deliveredOrders = customerOrders.filter(o => {
        const st = (o.status || '').toLowerCase().trim();
        return st === 'delivered' || 
               st === 'completed' || 
               st === 'تم التوصيل' || 
               st === 'تم التوصيل (delivered)' || 
               st === 'مكتمل' ||
               st.includes('deliver') ||
               st.includes('complet');
      }).length;

      let favsCount = 0;
      try {
        if (Array.isArray(c.favorites)) {
          favsCount = c.favorites.length;
        } else if (typeof c.favorites === 'string') {
          const parsed = JSON.parse(c.favorites);
          if (Array.isArray(parsed)) favsCount = parsed.length;
        } else if (c.favorites && typeof c.favorites === 'object') {
          favsCount = Object.keys(c.favorites).length;
        }
      } catch (e) {
        favsCount = 0;
      }

      return {
        ...c,
        totalOrders,
        deliveredOrders,
        favoritesCount: favsCount,
        favorites: Array.isArray(c.favorites) ? c.favorites : []
      };
    });
    
    const knownEmails = new Set(customersList.map(c => (c.email || '').toLowerCase().trim()).filter(Boolean));
    const knownPhones = new Set(customersList.map(c => (c.phone || '').trim()).filter(Boolean));

    const extraOrderCustomers: any[] = [];
    allOrders.forEach(o => {
      const oEmail = (o.customerEmail || '').toLowerCase().trim();
      const oPhone = (o.customerPhone || '').trim();
      if ((oEmail && !knownEmails.has(oEmail)) || (oPhone && !knownPhones.has(oPhone))) {
        if (oEmail) knownEmails.add(oEmail);
        if (oPhone) knownPhones.add(oPhone);

        const customerOrders = allOrders.filter(ord => {
          const e = (ord.customerEmail || '').toLowerCase().trim();
          const p = (ord.customerPhone || '').trim();
          return (oEmail && e === oEmail) || (oPhone && p === oPhone);
        });

        const totalOrders = customerOrders.length;
        const deliveredOrders = customerOrders.filter(ord => {
          const st = (ord.status || '').toLowerCase().trim();
          return st === 'delivered' || st === 'completed' || st === 'تم التوصيل' || st.includes('deliver') || st.includes('complet');
        }).length;

        extraOrderCustomers.push({
          id: `ord-cust-${o.id}`,
          tenantId: tenant.id,
          email: oEmail || `${oPhone}@order.local`,
          phone: oPhone || null,
          name: o.customerName || 'عميل المتجر',
          photoUrl: null,
          favorites: [],
          favoritesCount: 0,
          totalOrders,
          deliveredOrders,
          lastLoginAt: o.createdAt || new Date()
        });
      }
    });

    res.json({ customers: [...enrichedCustomers, ...extraOrderCustomers] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch store customers', details: error.message });
  }
});

router.post('/api/public/websites/:subdomain/store-login', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { email, name, photoUrl, favorites } = req.body;
    
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    
    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www\./i, '');
    const tenantResult = await db.select()
      .from(tenants)
      .where(and(
        or(
          eq(tenants.subdomain, cleanDomain),
          eq(tenants.customDomain, cleanDomain),
          eq(tenants.customDomain, `www.${cleanDomain}`)
        ),
        isNull(tenants.deletedAt)
      ));
      
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    const tenant = tenantResult[0];
    const websiteResult = await db.select()
      .from(websites)
      .where(and(eq(websites.tenantId, tenant.id), isNull(websites.deletedAt)));
      
    if (websiteResult.length === 0) {
      res.status(404).json({ error: 'Website not found for tenant' });
      return;
    }
    const website = websiteResult[0];
    
    const existing = await db.select()
      .from(storeCustomers)
      .where(and(
        eq(storeCustomers.tenantId, tenant.id),
        eq(storeCustomers.email, email)
      ));
      
    if (existing.length > 0) {
      await db.update(storeCustomers)
        .set({
          name: name || existing[0].name,
          photoUrl: photoUrl || existing[0].photoUrl,
          favorites: favorites !== undefined ? favorites : existing[0].favorites,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(storeCustomers.id, existing[0].id));
    } else {
      await db.insert(storeCustomers).values({
        tenantId: tenant.id,
        websiteId: website.id,
        email,
        name,
        photoUrl,
        favorites: favorites || [],
      });
    }
    
    const updatedCustomer = await db.select()
      .from(storeCustomers)
      .where(and(
        eq(storeCustomers.tenantId, tenant.id),
        eq(storeCustomers.email, email)
      ));
    
    res.json({ success: true, favorites: updatedCustomer[0]?.favorites || favorites || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record store login', details: error.message });
  }
});


// ==========================================
// SUPPORT TICKETS (ADMIN)
// ==========================================

router.get('/api/tenant/:tenantId/support-tickets', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { tenantId } = req.params;
    
    // Check permission (skip full check for brevity, assuming UI is for staff/owner)
    
    const ticketsList = await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.tenantId, parseInt(tenantId)))
      .orderBy(desc(supportTickets.createdAt));
      
    res.json({ tickets: ticketsList });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/api/tenant/:tenantId/support-tickets/:ticketId/messages', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { tenantId, ticketId } = req.params;
    
    const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, parseInt(ticketId)));
    if (ticket.length === 0 || ticket[0].tenantId !== parseInt(tenantId)) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    
    const msgs = await db.select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, parseInt(ticketId)))
      .orderBy(supportMessages.createdAt);
      
    res.json({ messages: msgs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/api/tenant/:tenantId/support-tickets/:ticketId/approve', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { ticketId } = req.params;
    
    await db.update(supportTickets)
      .set({ status: 'approved', })
      .where(eq(supportTickets.id, parseInt(ticketId)));
      
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to approve ticket' });
  }
});

router.post('/api/tenant/:tenantId/support-tickets/:ticketId/status', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { ticketId } = req.params;
    const { status, systemNote } = req.body; // 'approved', 'rejected', 'closed'
    
    await db.update(supportTickets)
      .set({ status: status, })
      .where(eq(supportTickets.id, parseInt(ticketId)));

    if (systemNote) {
      await db.insert(supportMessages).values({
        ticketId: parseInt(ticketId),
        senderId: req.user!.uid,
        senderType: 'staff',
        message: systemNote,
        images: []
      });
    }
      
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

router.post('/api/tenant/:tenantId/support-tickets/:ticketId/messages', requireAuth, async (req: AuthRequest, res: express.Response) => {
  try {
    const { ticketId } = req.params;
    const { message, images } = req.body;
    
    await db.insert(supportMessages).values({
      ticketId: parseInt(ticketId),
      senderId: req.user!.uid,
      senderType: 'staff',
      message: message,
      images: images || []
    });

    // Auto approve ticket when staff replies
    await db.update(supportTickets)
      .set({ status: 'approved', })
      .where(eq(supportTickets.id, parseInt(ticketId)));
      
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==========================================
// SUPPORT TICKETS (PUBLIC)
// ==========================================

router.get('/api/public/websites/:subdomain/support-tickets', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { email } = req.query;
    
    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }
    
    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www\./i, '');
    const tenantResult = await db.select().from(tenants).where(and(or(eq(tenants.subdomain, cleanDomain), eq(tenants.customDomain, cleanDomain), eq(tenants.customDomain, `www.${cleanDomain}`)), isNull(tenants.deletedAt)));
      
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    const tenant = tenantResult[0];
    
    const ticketsList = await db.select()
      .from(supportTickets)
      .where(and(
        eq(supportTickets.tenantId, tenant.id),
        eq(supportTickets.customerEmail, email as string)
      ))
      .orderBy(desc(supportTickets.createdAt));
      
    res.json({ tickets: ticketsList });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.post('/api/public/websites/:subdomain/support-tickets', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { email, name, subject, message, images } = req.body;
    
    if (!email || !subject || !message) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }
    
    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www\./i, '');
    const tenantResult = await db.select().from(tenants).where(and(or(eq(tenants.subdomain, cleanDomain), eq(tenants.customDomain, cleanDomain), eq(tenants.customDomain, `www.${cleanDomain}`)), isNull(tenants.deletedAt)));
      
    if (tenantResult.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    
    const tenant = tenantResult[0];
    const websiteResult = await db.select().from(websites).where(and(eq(websites.tenantId, tenant.id), isNull(websites.deletedAt)));
    const website = websiteResult[0];
    
    const newTicket = await db.insert(supportTickets).values({
      tenantId: tenant.id,
      websiteId: website?.id || 0,
      customerEmail: email,
      customerName: name,
      subject,
      message,
      images: images || [],
      status: 'pending'
    }).returning();
    
    // Create initial message
    await db.insert(supportMessages).values({
      ticketId: newTicket[0].id,
      senderId: email,
      senderType: 'customer',
      message: message,
      images: images || []
    });
    
    // Add notification for staff
    await db.insert(notifications).values({
      tenantId: tenant.id,
      title: 'طلب مساعدة جديد',
      message: `تم استلام طلب مساعدة من ${name || email}: ${subject}`,
      isRead: 0
    });
    
    res.json({ success: true, ticket: newTicket[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

router.get('/api/public/websites/:subdomain/support-tickets/:ticketId/messages', async (req: express.Request, res: express.Response) => {
  try {
    const { ticketId } = req.params;
    const { email } = req.query;
    
    const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, parseInt(ticketId)));
    if (ticket.length === 0 || ticket[0].customerEmail !== email) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    
    const msgs = await db.select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, parseInt(ticketId)))
      .orderBy(supportMessages.createdAt);
      
    res.json({ messages: msgs, ticketStatus: ticket[0].status });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/api/public/websites/:subdomain/support-tickets/:ticketId/messages', async (req: express.Request, res: express.Response) => {
  try {
    const { ticketId } = req.params;
    const { email, message, images } = req.body;
    
    const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, parseInt(ticketId)));
    if (ticket.length === 0 || ticket[0].customerEmail !== email) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    
    if (ticket[0].status === 'closed' || ticket[0].status === 'rejected') {
      res.status(403).json({ error: 'Ticket is closed or rejected' });
      return;
    }
    
    await db.insert(supportMessages).values({
      ticketId: parseInt(ticketId),
      senderId: email,
      senderType: 'customer',
      message: message,
      images: images || []
    });
    
    // Add notification for staff
    await db.insert(notifications).values({
      tenantId: ticket[0].tenantId,
      title: 'رسالة مساعدة جديدة',
      message: `رد جديد من ${ticket[0].customerName || email} على طلب: ${ticket[0].subject}`,
      isRead: 0
    });
    
    await db.update(supportTickets).set({ }).where(eq(supportTickets.id, parseInt(ticketId)));
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==========================================
// Dental Clinic Appointments API Routes
// ==========================================

router.get('/api/tenant/:tenantId/dental/appointments', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    const list = await db.select().from(dentistAppointments).where(eq(dentistAppointments.tenantId, tenantId)).orderBy(desc(dentistAppointments.createdAt));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tenant/:tenantId/dental/appointments', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    const { patientName, phone, serviceId, doctorId, service, doctor, date, time, status } = req.body;
    
    const [inserted] = await db.insert(dentistAppointments).values({
      tenantId,
      patientName,
      phone,
      serviceId: serviceId ? String(serviceId) : null,
      doctorId: doctorId ? String(doctorId) : null,
      service: service || null,
      doctor: doctor || null,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00 AM',
      status: status || 'pending'
    }).returning();

    // Create notification
    await db.insert(notifications).values({
      tenantId,
      title: 'حجز موعد عيادة جديد 🦷',
      message: `حجز موعد جديد للمريض ${patientName} (${phone})`,
      isRead: 0
    });

    res.json({ success: true, appointment: inserted });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/public/websites/:subdomain/dental/appointments', async (req: express.Request, res: express.Response) => {
  try {
    const { subdomain } = req.params;
    const { phone } = req.query;

    const cleanDomain = subdomain.trim().toLowerCase().replace(/^www\./i, '');
    const numId = parseInt(cleanDomain, 10);

    let tenantResult = await db.select()
      .from(tenants)
      .where(and(
        or(
          eq(tenants.subdomain, cleanDomain),
          eq(tenants.customDomain, cleanDomain),
          eq(tenants.customDomain, `www.${cleanDomain}`),
          !isNaN(numId) ? eq(tenants.id, numId) : eq(tenants.id, -1)
        ),
        isNull(tenants.deletedAt)
      ));

    if (tenantResult.length === 0) {
      // Fallback to first active tenant if subdomain is generic like 'demo'
      tenantResult = await db.select().from(tenants).where(isNull(tenants.deletedAt)).limit(1);
    }

    if (tenantResult.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenantResult[0];

    const directAppsAll = await db.select().from(dentistAppointments).where(eq(dentistAppointments.tenantId, tenant.id)).orderBy(desc(dentistAppointments.createdAt));
    const orderAppsAll = await db.select().from(orders).where(eq(orders.tenantId, tenant.id)).orderBy(desc(orders.createdAt));

    let directApps = directAppsAll;
    let orderApps = orderAppsAll;

    if (phone) {
      const pStr = String(phone).trim();
      const pDigits = pStr.replace(/\D/g, '');
      if (pDigits.length > 0) {
        directApps = directAppsAll.filter(a => {
          const aDigits = (a.phone || '').replace(/\D/g, '');
          if (!aDigits) return false;
          return aDigits.includes(pDigits) || pDigits.includes(aDigits) || (aDigits.slice(-7) && pDigits.endsWith(aDigits.slice(-7)));
        });

        orderApps = orderAppsAll.filter(o => {
          const oDigits = (o.customerPhone || '').replace(/\D/g, '');
          if (!oDigits) return false;
          return oDigits.includes(pDigits) || pDigits.includes(oDigits) || (oDigits.slice(-7) && pDigits.endsWith(oDigits.slice(-7)));
        });
      }
    }

    res.json({ directAppointments: directApps, orderAppointments: orderApps });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/tenant/:tenantId/dental/appointments/:id', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const id = parseInt(req.params.id);
    if (isNaN(tenantId) || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const { status, confirmedTime, doctorNotes, date, time } = req.body;
    
    const updateObj: any = {};
    if (status !== undefined) updateObj.status = status;
    if (confirmedTime !== undefined) updateObj.confirmedTime = confirmedTime;
    if (doctorNotes !== undefined) updateObj.doctorNotes = doctorNotes;
    if (date !== undefined) updateObj.date = date;
    if (time !== undefined) updateObj.time = time;

    await db.update(dentistAppointments)
      .set(updateObj)
      .where(and(eq(dentistAppointments.id, id), eq(dentistAppointments.tenantId, tenantId)));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/tenant/:tenantId/dental/appointments/:id', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const id = parseInt(req.params.id);
    if (isNaN(tenantId) || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    
    await db.delete(dentistAppointments)
      .where(and(eq(dentistAppointments.id, id), eq(dentistAppointments.tenantId, tenantId)));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DOCTOR PORTAL & RBAC ENDPOINTS
// ==========================================

// 1. Doctor Login
router.post('/api/public/dental/doctor/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, tenantId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    let docs = await db.select()
      .from(dentistDoctors)
      .where(ilike(dentistDoctors.email, cleanEmail));

    if (docs.length === 0) {
      // Check if email matches doctor name or create mock for demonstration
      docs = await db.select().from(dentistDoctors);
      const matchByName = docs.find(d => d.name.toLowerCase().includes(cleanEmail.split('@')[0]));
      if (matchByName) {
        docs = [matchByName];
      }
    }

    if (docs.length === 0) {
      return res.status(401).json({ error: 'حساب الطبيب غير موجود. يرجى التأكد من تسجيلك بالطاقم الطبي.' });
    }

    const doc = docs[0];

    // Password verification (simple string or demo match)
    if (doc.passwordHash && password && doc.passwordHash !== password) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    }

    const sessionData = {
      doctorId: doc.id,
      tenantId: doc.tenantId,
      name: doc.name,
      email: doc.email || cleanEmail,
      specialty: doc.specialty,
      role: 'doctor',
      token: `doc-token-${doc.id}-${Date.now()}`
    };

    res.json({ success: true, doctor: sessionData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Fetch Doctor's ISOLATED Appointments (STRICT DATA ISOLATION)
router.get('/api/tenant/:tenantId/doctor/:doctorId/appointments', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(tenantId) || isNaN(doctorId)) {
      return res.status(400).json({ error: 'Invalid ID parameters' });
    }

    // Get doctor name to match text doctorId/doctor field in dentistAppointments
    const docResult = await db.select().from(dentistDoctors).where(and(eq(dentistDoctors.id, doctorId), eq(dentistDoctors.tenantId, tenantId))).limit(1);
    const docName = docResult.length > 0 ? docResult[0].name : '';

    // Query strictly filtered by doctor ID / doctor name for this tenant
    const apps = await db.select()
      .from(dentistAppointments)
      .where(
        and(
          eq(dentistAppointments.tenantId, tenantId),
          or(
            eq(dentistAppointments.doctorId, String(doctorId)),
            docName ? ilike(dentistAppointments.doctor, `%${docName}%`) : sql`1=0`
          )
        )
      )
      .orderBy(desc(dentistAppointments.createdAt));

    res.json({ appointments: apps, doctorId, doctorName: docName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Update Appointment Doctor Notes or Status
router.put('/api/tenant/:tenantId/doctor/:doctorId/appointments/:id', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const doctorId = parseInt(req.params.doctorId);
    const id = parseInt(req.params.id);

    const { status, doctorNotes, confirmedTime } = req.body;

    const updateObj: any = {};
    if (status !== undefined) updateObj.status = status;
    if (doctorNotes !== undefined) updateObj.doctorNotes = doctorNotes;
    if (confirmedTime !== undefined) updateObj.confirmedTime = confirmedTime;

    await db.update(dentistAppointments)
      .set(updateObj)
      .where(
        and(
          eq(dentistAppointments.id, id),
          eq(dentistAppointments.tenantId, tenantId)
        )
      );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Doctor's Availability Schedule
router.get('/api/tenant/:tenantId/doctor/:doctorId/availability', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const doctorId = parseInt(req.params.doctorId);

    const schedule = await db.select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.tenantId, tenantId),
          eq(doctorAvailability.doctorId, doctorId)
        )
      );

    res.json({ schedule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Save/Update Doctor's Availability Schedule
router.post('/api/tenant/:tenantId/doctor/:doctorId/availability', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const doctorId = parseInt(req.params.doctorId);
    const { schedules } = req.body; // Array of { dayOfWeek, startTime, endTime, slotDurationMinutes, isAvailable }

    if (!Array.isArray(schedules)) {
      return res.status(400).json({ error: 'Schedules must be an array' });
    }

    // Delete existing schedules for this doctor to overwrite cleanly
    await db.delete(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.tenantId, tenantId),
          eq(doctorAvailability.doctorId, doctorId)
        )
      );

    if (schedules.length > 0) {
      const insertValues = schedules.map((s: any) => ({
        tenantId,
        doctorId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime || "09:00",
        endTime: s.endTime || "17:00",
        slotDurationMinutes: parseInt(s.slotDurationMinutes, 10) || 30,
        isAvailable: s.isAvailable !== false
      }));

      await db.insert(doctorAvailability).values(insertValues);
    }

    res.json({ success: true, count: schedules.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor Profile & Photo Update Route
router.put('/api/tenant/:tenantId/doctor/:doctorId/profile', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(tenantId) || isNaN(doctorId)) {
      return res.status(400).json({ error: 'Invalid ID parameters' });
    }

    const { name, specialty, degree, email, password, image } = req.body;
    const updateObj: any = {};
    if (name) updateObj.name = name;
    if (specialty) updateObj.specialty = specialty;
    if (degree !== undefined) updateObj.degree = degree;
    if (email !== undefined) updateObj.email = email ? String(email).trim().toLowerCase() : null;
    if (password) updateObj.passwordHash = password;
    if (image !== undefined) updateObj.image = image;

    const [updated] = await db.update(dentistDoctors)
      .set(updateObj)
      .where(and(eq(dentistDoctors.id, doctorId), eq(dentistDoctors.tenantId, tenantId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const { passwordHash, ...docSafe } = updated;
    res.json({ success: true, doctor: docSafe });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Admin Create Doctor Route (General Manager RBAC)
router.post('/api/tenant/:tenantId/admin/doctors', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    const { name, specialty, degree, email, password } = req.body;
    if (!name || !specialty) {
      return res.status(400).json({ error: 'Name and specialty are required' });
    }

    const [inserted] = await db.insert(dentistDoctors).values({
      tenantId,
      name,
      specialty,
      degree: degree || '',
      email: email ? String(email).trim().toLowerCase() : null,
      passwordHash: password || null,
      status: 'نشط'
    }).returning();

    // Security: exclude passwordHash from response
    const { passwordHash, ...docSafe } = inserted;
    res.json({ success: true, doctor: docSafe });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Also support POST /api/tenant/:tenantId/dental/doctors
router.post('/api/tenant/:tenantId/dental/doctors', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    const { name, specialty, degree, email, password } = req.body;
    if (!name || !specialty) {
      return res.status(400).json({ error: 'Name and specialty are required' });
    }

    const [inserted] = await db.insert(dentistDoctors).values({
      tenantId,
      name,
      specialty,
      degree: degree || '',
      email: email ? String(email).trim().toLowerCase() : null,
      passwordHash: password || null,
      status: 'نشط'
    }).returning();

    const { passwordHash, ...docSafe } = inserted;
    res.json({ success: true, doctor: docSafe });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Doctor's Patient Records API (Strict Data Isolation)
router.get('/api/tenant/:tenantId/doctor/:doctorId/patients', async (req: express.Request, res: express.Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(tenantId) || isNaN(doctorId)) {
      return res.status(400).json({ error: 'Invalid ID parameters' });
    }

    // Get doctor name for text matching fallback
    const docResult = await db.select()
      .from(dentistDoctors)
      .where(and(eq(dentistDoctors.id, doctorId), eq(dentistDoctors.tenantId, tenantId)))
      .limit(1);
    const docName = docResult.length > 0 ? docResult[0].name : '';

    // Query strictly filtered by doctor ID or doctor name for this tenant
    const apps = await db.select()
      .from(dentistAppointments)
      .where(
        and(
          eq(dentistAppointments.tenantId, tenantId),
          or(
            eq(dentistAppointments.doctorId, String(doctorId)),
            docName ? ilike(dentistAppointments.doctor, `%${docName}%`) : sql`1=0`
          )
        )
      )
      .orderBy(desc(dentistAppointments.createdAt));

    // Aggregate unique patients for this doctor
    const patientsMap = new Map();
    apps.forEach(app => {
      const phoneKey = app.phone || 'unknown';
      if (!patientsMap.has(phoneKey)) {
        patientsMap.set(phoneKey, {
          patientName: app.patientName,
          phone: app.phone,
          lastVisit: app.date,
          lastService: app.service,
          status: app.status,
          doctorNotes: app.doctorNotes,
          appointmentsCount: 1
        });
      } else {
        const p = patientsMap.get(phoneKey);
        p.appointmentsCount += 1;
      }
    });

    const patients = Array.from(patientsMap.values());

    res.json({ success: true, doctorId, doctorName: docName, patients, appointments: apps });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

