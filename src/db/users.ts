import { db } from './index.ts';
import { users } from './schema.ts';
import { eq, and, isNull } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
    const isOwner = normalizedEmail === 'ahmadalriqib@gmail.com' || (superAdminEmail ? normalizedEmail === superAdminEmail : false);

    const updateSet: any = {
      uid,
      deletedAt: null
    };

    if (isOwner) {
      updateSet.role = 'super_admin';
      updateSet.permissions = 'all';
      updateSet.status = 'active';
    }

    const result = await db.insert(users)
      .values({ 
        uid, 
        email: normalizedEmail,
        role: isOwner ? 'super_admin' : 'owner',
        permissions: isOwner ? 'all' : 'none',
        status: 'active',
        subscriptionEndDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years active
      })
      .onConflictDoUpdate({
        target: users.email,
        set: updateSet
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query failed:", error);
    throw new Error("Failed to get or create user.", { cause: error });
  }
}
