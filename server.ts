import * as fs from 'fs';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import { db } from './src/db/index.ts';
import { templates, tenants, websites, websiteContent, subscriptions, users } from './src/db/schema.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { requireAuth, requireAdmin, requireSuperAdmin, requireActiveSubscription, AuthRequest } from './src/middleware/auth.ts';
import { subdomainMiddleware, SubdomainRequest } from './src/middleware/subdomain.ts';
import { eq, or, and, sql } from 'drizzle-orm';
import { seedDatabase } from './src/db/seed.ts';
import { auditLogger } from './src/middleware/auditLogger.ts';
import { startAbandonedCartRecoveryCron } from './src/cron/abandonedCartRecovery.ts';
import { startSubscriptionCronJobs } from './src/cron/cronJobs.ts';

import { logger } from './src/lib/logger.ts';

import tenantRoutes from './src/routes/tenantRoutes.ts';
import adminRoutes from './src/routes/adminRoutes.ts';
import cmsRoutes from './src/routes/cmsRoutes.ts';

// Rate Limiters for Security
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const strictApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests for this endpoint, please slow down.' }
});

async function startServer() {
  // Seed Database on startup if empty
  await seedDatabase();

  // Initial template seed for special client if required
  try {
    const defaultUserEmail = 'ahmaksj66@gmail.com';
    const existingUser = await db.select().from(users).where(eq(users.email, defaultUserEmail));
    
    let dbUser;
    if (existingUser.length === 0) {
      const newUser = await db.insert(users).values({
        uid: 'seed-ahmaksj66',
        email: defaultUserEmail,
        name: 'متجر الأجهزة الإلكترونية',
        role: 'tenant_admin',
        status: 'active'
      }).returning();
      dbUser = newUser[0];
    } else {
      dbUser = existingUser[0];
      await db.update(users).set({ name: 'متجر الأجهزة الإلكترونية' }).where(eq(users.id, dbUser.id));
    }

    let userTenant = dbUser.tenantId ? (await db.select().from(tenants).where(eq(tenants.id, dbUser.tenantId)))[0] : null;
    if (!userTenant) {
      const existingTenant = await db.select().from(tenants).where(eq(tenants.userId, dbUser.id));
      if (existingTenant.length > 0) {
        userTenant = existingTenant[0];
        await db.update(tenants).set({ name: 'متجر الأجهزة الإلكترونية', subdomain: 'electronic-store' }).where(eq(tenants.id, userTenant.id));
      } else {
        const newTenant = await db.insert(tenants).values({
          userId: dbUser.id,
          name: 'متجر الأجهزة الإلكترونية',
          subdomain: 'electronic-store',
        }).returning();
        userTenant = newTenant[0];
        await db.update(users).set({ tenantId: userTenant.id, role: 'tenant_admin' }).where(eq(users.id, dbUser.id));
      }
    } else {
      await db.update(tenants).set({ name: 'متجر الأجهزة الإلكترونية' }).where(eq(tenants.id, userTenant.id));
    }

    const tenantSub = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, userTenant.id));
    if (tenantSub.length === 0) {
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      await db.insert(subscriptions).values({
        tenantId: userTenant.id,
        plan: 'yearly',
        status: 'active',
        renewalDate: oneYearLater,
        assignedUserEmail: defaultUserEmail
      });
    }

    let elecTemplate = await db.select().from(templates).where(eq(templates.name, 'متجر الأجهزة الإلكترونية'));
    if (elecTemplate.length === 0) {
      elecTemplate = await db.select().from(templates).where(eq(templates.id, 14));
    }
    const templateId = elecTemplate.length > 0 ? elecTemplate[0].id : 14;

    const userWebsite = await db.select().from(websites).where(eq(websites.tenantId, userTenant.id));
    let websiteId: number;
    if (userWebsite.length === 0) {
      const newWeb = await db.insert(websites).values({
        tenantId: userTenant.id,
        templateId
      }).returning();
      websiteId = newWeb[0].id;
    } else {
      websiteId = userWebsite[0].id;
      // Force update to template 14 if it was restaurant
      await db.update(websites).set({ templateId }).where(eq(websites.id, websiteId));
    }

    const existingContent = await db.select().from(websiteContent).where(eq(websiteContent.websiteId, websiteId));
    const defaultElectronicContent = {
      siteName: 'متجر الأجهزة الإلكترونية',
      heroTitle: 'أحدث الأجهزة الذكية والتقنيات العصرية',
      heroSubtitle: 'عالمك الذكي للتقنية الحديثة بضمان معتمد',
      primaryColor: '#4f46e5',
      secondaryColor: '#818cf8',
      products: [
        {
          id: 1,
          title: 'آيفون 16 برو ماكس - 256 جيجابايت',
          price: 5399,
          originalPrice: 5899,
          category: 'الهواتف الذكية',
          primaryImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800',
          colors: ['التيتانيوم الطبيعي', 'التيتانيوم الأسود', 'فضي معدني'],
          storageOptions: ['256GB', '512GB', '1TB'],
          description: 'شاشة Super Retina XDR مقاس 6.9 بوصة، معالج A18 Pro الخارق.'
        },
        {
          id: 2,
          title: 'ماك بوك برو 16 إنش - M3 Max',
          price: 11499,
          originalPrice: 12499,
          category: 'الحواسيب',
          primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800',
          colors: ['رمادي فلكي', 'فضي معدني'],
          storageOptions: ['512GB SSD', '1TB SSD', '2TB SSD'],
          description: 'أداء استثنائي للمحترفين والمصممين.'
        }
      ]
    };

    if (existingContent.length === 0) {
      await db.insert(websiteContent).values({
        websiteId,
        content: defaultElectronicContent
      });
    } else {
      // Update content to electronic store if it was restaurant
      await db.update(websiteContent).set({ content: defaultElectronicContent }).where(eq(websiteContent.websiteId, websiteId));
    }
  } catch (e) {
    logger.error('Error assigning restaurant template to ahmaksj66@gmail.com:', e);
  }

  // Start cron tasks
  startAbandonedCartRecoveryCron();
  startSubscriptionCronJobs();

  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  app.use(helmet({ 
    contentSecurityPolicy: false, 
    crossOriginOpenerPolicy: false, 
    crossOriginEmbedderPolicy: false 
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(globalLimiter);
  app.use('/api', strictApiLimiter);
  app.use(subdomainMiddleware);
  app.use(auditLogger as any);

  // Mount Modular Routers
  app.use((req, res, next) => {
    res.on('finish', () => {
      fs.appendFileSync("requests.log", `${req.method} ${req.url} -> ${res.statusCode}\n`);
    });
    next();
  });
  app.use(tenantRoutes);
  app.use(adminRoutes);
  app.use(cmsRoutes);

  // Centralized Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled Error:', err, {
      cause: err.cause,
      detail: err.detail,
      code: err.code,
      path: req.path
    });

    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      details: err.detail || err.message || String(err),
      code: err.code
    });
  });

  // API Fallthrough Catch-All: Return 404 JSON instead of letting /api requests serve Vite index.html
  app.use('/api', (req: express.Request, res: express.Response) => {
    logger.warn(`API Route Not Found (404): ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      method: req.method,
      path: req.originalUrl
    });
  });

  // Vite middleware for development
  app.use((req, res, next) => { console.log("FALLTHROUGH:", req.method, req.url, req.path); next(); });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
