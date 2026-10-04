import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users, tenants, subscriptions, notifications } from '../db/schema.ts';
import { eq, and, isNull, or } from 'drizzle-orm';
import geoip from 'geoip-lite';
import { logger } from '../lib/logger.ts';
import { sendWelcomeEmail } from '../lib/sendAutomatedEmail.ts';

function getIpLocation(ip: string): string {
  try {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1')) {
      return 'الموقع المحلي (Localhost)';
    }
    const cleanIp = ip.split(',')[0].trim();
    const geo = geoip.lookup(cleanIp);
    if (geo) {
      const city = geo.city ? geo.city : '';
      const country = geo.country ? geo.country : '';
      if (city && country) return `${city}، ${country}`;
      return city || country || 'غير معروف';
    }
    return 'غير معروف';
  } catch (error) {
    console.error('Failed to resolve IP location:', error);
    return 'غير معروف';
  }
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken | any;
  dbUser?: any;
}

// In-memory cache for database users to accelerate API requests and avoid DB connection bottlenecks
const userCache = new Map<string, { user: any; timestamp: number }>();
const USER_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  let decodedToken: DecodedIdToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (authError: any) {
    logger.warn('Error verifying Firebase ID token:', { message: authError.message, code: authError.code });
    res.status(401).json({ 
      error: 'Unauthorized: Invalid or expired token',
      ...(process.env.NODE_ENV === 'development' ? { details: authError.message } : {})
    });
    return;
  }

  try {
    req.user = decodedToken;
    let dbUser: any = null;

    // Check fast in-memory cache first
    const cachedEntry = userCache.get(decodedToken.uid);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < USER_CACHE_TTL_MS)) {
      dbUser = { ...cachedEntry.user };
    } else {
      // Fetch user from DB with retry logic for transient disconnects
      let retries = 2;
      while (retries >= 0) {
        try {
          const userList = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
          dbUser = userList.length > 0 ? userList[0] : null;
          break;
        } catch (dbErr) {
          retries--;
          if (retries < 0) {
            // If DB query fails after retries, fallback to stale cache if available
            if (cachedEntry) {
              dbUser = { ...cachedEntry.user };
              break;
            }
            // Construct resilient fallback user object from verified token if DB is temporarily unreachable
            const normEmail = decodedToken.email?.toLowerCase().trim() || '';
            const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
            const isOwner = normEmail === 'ahmadalriqib@gmail.com' || (superAdminEmail && normEmail === superAdminEmail);
            
            dbUser = {
              id: -1,
              uid: decodedToken.uid,
              email: normEmail,
              name: decodedToken.name || normEmail.split('@')[0] || 'المستخدم',
              role: isOwner ? 'super_admin' : 'user',
              status: 'active',
              permissions: isOwner ? 'all' : 'none'
            };
            logger.warn(`Database connection lost in requireAuth. Created resilient user fallback for ${normEmail}`);
            break;
          }
          await new Promise(r => setTimeout(r, 150));
        }
      }

      // If not found by UID, try email
      if (!dbUser && decodedToken.email) {
        const emailList = await db.select().from(users).where(eq(users.email, decodedToken.email.toLowerCase().trim()));
        if (emailList.length > 0) {
          dbUser = emailList[0];
          // Sync the UID
          db.update(users).set({ uid: decodedToken.uid }).where(eq(users.id, dbUser.id)).catch(() => {});
          dbUser.uid = decodedToken.uid;
        }
      }

      // Auto-create user record if not found
      if (!dbUser && decodedToken.email) {
        const normEmail = decodedToken.email.toLowerCase().trim();
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
        const isOwner = normEmail === 'ahmadalriqib@gmail.com' || (superAdminEmail && normEmail === superAdminEmail);
        const defaultRole = isOwner ? 'super_admin' : 'user';

        try {
          const inserted = await db.insert(users).values({
            uid: decodedToken.uid,
            email: normEmail,
            name: decodedToken.name || normEmail.split('@')[0],
            avatarUrl: decodedToken.picture || null,
            role: defaultRole,
            status: 'active'
          }).returning();
          if (Array.isArray(inserted) && inserted.length > 0) {
            dbUser = inserted[0];
            if (dbUser.email) {
              sendWelcomeEmail(
                dbUser.email,
                dbUser.name || 'عميلنا العزيز',
                `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`
              ).catch(e => console.error('Failed to send welcome email on initial login:', e));

              db.insert(notifications).values({
                tenantId: null,
                targetEmail: dbUser.email.toLowerCase(),
                title: 'أهلاً وسهلاً بك في منصة بنيان! 🎉',
                message: `مرحباً بك يا ${dbUser.name || 'عميلنا العزيز'}! يسعدنا انضمامك إلى منصة بنيان، مساحتك الرقمية جاهزة ولوحة التحكم مجهزة لتطوير أعمالك وموقعك.`,
                isRequired: 1,
                isRead: 0
              }).catch(e => console.error('Failed to create in-app notification on initial login:', e));
            }
          }
        } catch (err) {
          const existing = await db.select().from(users).where(eq(users.email, normEmail));
          if (existing.length > 0) {
            dbUser = existing[0];
            if (!dbUser.uid) {
              db.update(users).set({ uid: decodedToken.uid }).where(eq(users.id, dbUser.id)).catch(() => {});
              dbUser.uid = decodedToken.uid;
            }
          }
        }
      }

      if (dbUser) {
        userCache.set(decodedToken.uid, { user: dbUser, timestamp: Date.now() });
      }
    }

    if (dbUser) {
      const normEmail = dbUser.email?.toLowerCase().trim();
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
      const isOwner = normEmail === 'ahmadalriqib@gmail.com' || (superAdminEmail && normEmail === superAdminEmail);
      
      // Always guarantee platform owner has super_admin role
      if (isOwner && dbUser.role !== 'super_admin') {
        dbUser.role = 'super_admin';
        db.update(users).set({ role: 'super_admin' }).where(eq(users.id, dbUser.id)).catch(() => {});
      }

      // Sync google fields if different or missing (non-blocking)
      let updatedFields: any = {};
      if (decodedToken.picture && dbUser.avatarUrl !== decodedToken.picture) {
        updatedFields.avatarUrl = decodedToken.picture;
      }
      if (decodedToken.name && !dbUser.name) {
        updatedFields.name = decodedToken.name;
      }

      const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      if (rawIp && dbUser.ipAddress !== rawIp) {
        updatedFields.ipAddress = rawIp;
        updatedFields.location = getIpLocation(rawIp);
      }

      const now = new Date();
      const lastActiveMs = dbUser.lastActiveAt ? new Date(dbUser.lastActiveAt).getTime() : 0;
      if (now.getTime() - lastActiveMs > 30 * 1000) {
        updatedFields.lastActiveAt = now;
      }

      if (Object.keys(updatedFields).length > 0) {
        Object.assign(dbUser, updatedFields);
        db.update(users).set(updatedFields).where(eq(users.id, dbUser.id)).catch(() => {});
        userCache.set(decodedToken.uid, { user: dbUser, timestamp: Date.now() });
      }
    }

    req.dbUser = dbUser;

    // Check for impersonation (strictly require primary user to have role === 'super_admin')
    const impersonateEmail = req.headers['x-impersonate-email'];
    if (impersonateEmail) {
      const isSuperAdmin = dbUser && dbUser.role === 'super_admin';
      if (isSuperAdmin && typeof impersonateEmail === 'string') {
        const impUserList = await db.select().from(users).where(eq(users.email, impersonateEmail.toLowerCase().trim()));
        if (impUserList.length > 0) {
          req.user = {
            ...decodedToken,
            uid: impUserList[0].uid,
            email: impUserList[0].email
          };
          req.dbUser = impUserList[0];
        }
      } else {
        // Strip header if non super_admin to prevent header spoofing or unauthorized downstream usage
        delete req.headers['x-impersonate-email'];
      }
    }

    if (!req.dbUser) {
      res.status(401).json({ error: 'Unauthorized: User record not found' });
      return;
    }
    
    next();
  } catch (error: any) {
    // If the error is from Firebase token verification (usually happens if token is invalid/expired/revoked)
    if (error.code && error.code.startsWith('auth/')) {
      logger.warn('Error verifying Firebase ID token:', { message: error.message, code: error.code });
      res.status(401).json({ 
        error: 'Unauthorized: Invalid or revoked token',
        ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
      });
      return;
    }
    // Otherwise it's likely a database or other server error
    logger.error('Database/Server error in requireAuth:', error, { cause: error.cause });
    const details = error.cause ? `${error.message} | Cause: ${error.cause.message || String(error.cause)}` : (error.message || String(error));
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details
    });
    return;
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const email = (req.dbUser?.email || req.user?.email || '')?.toLowerCase().trim();
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const isOwner = email === 'ahmadalriqib@gmail.com' || (superAdminEmail && email === superAdminEmail);

  const role = req.dbUser?.role || (isOwner ? 'super_admin' : undefined);
  const permissions = req.dbUser?.permissions || (isOwner ? 'all' : undefined);

  // Platform roles have admin access (including staff and accounts with assigned permissions)
  const isPlatformRole = ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(role) || (permissions && permissions !== 'none');
  const hasAdminAccess = isOwner || isPlatformRole;

  if (!hasAdminAccess) {
    res.status(403).json({ error: 'Forbidden: Platform admin access required' });
    return;
  }
  next();
};

export const requireTenantStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.dbUser) {
    res.status(401).json({ error: 'Unauthorized: Authentication required' });
    return;
  }

  const email = req.dbUser.email?.toLowerCase().trim();
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const isOwner = email === 'ahmadalriqib@gmail.com' || (superAdminEmail && email === superAdminEmail);
  const role = req.dbUser.role;

  // Platform super admin, admin, and platform staff can access tenant endpoints
  if (isOwner || ['super_admin', 'admin', 'manager', 'support', 'staff'].includes(role) || (req.dbUser.permissions && req.dbUser.permissions !== 'none')) {
    next();
    return;
  }

  const allowedTenantRoles = ['tenant_admin', 'staff', 'manager', 'supervisor', 'editor', 'support', 'viewer', 'owner'];
  if (!allowedTenantRoles.includes(role)) {
    res.status(403).json({ error: 'Forbidden: Tenant staff access required' });
    return;
  }

  // Strictly verify tenant boundaries if target tenant ID is provided
  const targetTenantId = req.params?.tenantId || req.query?.tenantId || req.body?.tenantId || req.headers['x-impersonate-tenant-id'];
  if (targetTenantId) {
    const parsedTargetId = parseInt(String(targetTenantId), 10);
    if (!isNaN(parsedTargetId) && req.dbUser.tenantId && req.dbUser.tenantId !== parsedTargetId) {
      res.status(403).json({ error: 'Forbidden: Cannot access different tenant data' });
      return;
    }
  }

  next();
};

export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const email = req.dbUser?.email?.toLowerCase().trim();
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const isOwner = email === 'ahmadalriqib@gmail.com' || (superAdminEmail && email === superAdminEmail);

  if (!req.dbUser || (!isOwner && req.dbUser.role !== 'super_admin')) {
    res.status(403).json({ error: 'Forbidden: Super Admin access required' });
    return;
  }
  next();
};

export async function isUserSubscriptionActive(dbUser: any): Promise<boolean> {
  if (!dbUser) return false;
  
  const email = dbUser.email?.toLowerCase().trim();
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  const isOwner = email === 'ahmadalriqib@gmail.com' || (superAdminEmail && email === superAdminEmail);

  // Platform Admins, Super Admins, and Platform Staff are always active
  if (isOwner || ['admin', 'super_admin', 'manager', 'support', 'staff'].includes(dbUser.role) || (dbUser.permissions && dbUser.permissions !== 'none')) {
    return true;
  }
  
  if (dbUser.status === 'banned' || dbUser.status === 'suspended') {
    return false;
  }

  let targetTenantId = dbUser.tenantId;
  if (!targetTenantId && email) {
    const tenantResult = await db.select().from(tenants).where(
      and(
        or(
          eq(tenants.userId, dbUser.id),
          eq(tenants.assignedUserEmail, email)
        ),
        isNull(tenants.deletedAt)
      )
    );
    if (tenantResult.length > 0) {
      targetTenantId = tenantResult[0].id;
    }
  }

  // Check if there is an explicit cancelled or expired subscription
  if (targetTenantId || email) {
    const subResult = await db.select().from(subscriptions).where(
      and(
        or(
          ...(targetTenantId ? [eq(subscriptions.tenantId, targetTenantId)] : []),
          ...(email ? [eq(subscriptions.assignedUserEmail, email)] : [])
        )
      )
    );

    if (subResult.length > 0) {
      const sub = subResult[0];
      if (sub.status === 'cancelled' || sub.status === 'expired') {
        if (sub.renewalDate && new Date(sub.renewalDate) < new Date()) {
          return false;
        }
      }
    }
  }

  // Default to active for seamless user experience
  return true;
}

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const isActive = await isUserSubscriptionActive(req.dbUser);
    if (!isActive) {
      const isGetTenant = req.method === 'GET' && (req.baseUrl + req.path === '/api/tenant' || req.originalUrl.split('?')[0] === '/api/tenant');
      if (isGetTenant) {
        res.json({ tenant: null, error: 'Subscription inactive' });
        return;
      }
      res.status(403).json({ error: 'Subscription inactive' });
      return;
    }
    next();
  } catch (error) {
    console.error('Error in requireActiveSubscription:', error);
    res.status(500).json({ error: 'Internal server error checking subscription' });
    return;
  }
};
