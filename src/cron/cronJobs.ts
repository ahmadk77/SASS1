import cron from 'node-cron';
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { subscriptions, tenants, users, notifications } from '../db/schema.ts';
import { sendSubscriptionReminder } from '../lib/sendAutomatedEmail.ts';

export const checkAndSendSubscriptionReminders = async () => {
  console.log('Running automated subscription reminder check...');
  try {
    const now = new Date();
    const activeSubs = await db
      .select({
        id: subscriptions.id,
        tenantId: subscriptions.tenantId,
        assignedEmail: subscriptions.assignedUserEmail,
        renewalDate: subscriptions.renewalDate,
        tenantName: tenants.name,
        userEmail: users.email
      })
      .from(subscriptions)
      .leftJoin(tenants, eq(subscriptions.tenantId, tenants.id))
      .leftJoin(users, eq(tenants.userId, users.id))
      .where(and(eq(subscriptions.status, 'active'), isNotNull(subscriptions.renewalDate)));

    for (const sub of activeSubs) {
      if (!sub.renewalDate) continue;
      const renewDate = new Date(sub.renewalDate);
      const diffMs = renewDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Send warning/reminder if sub expires within 7 days or today
      if (diffDays >= 0 && diffDays <= 7) {
        const targetEmail = sub.assignedEmail || sub.userEmail;
        if (targetEmail) {
          console.log(`Sending automated reminder email & notification to ${targetEmail} for store ${sub.tenantName} (${diffDays} days remaining)`);
          const dateStr = renewDate.toLocaleDateString('ar-EG');
          
          // 1. Send Email Warning
          await sendSubscriptionReminder(
            targetEmail,
            sub.tenantName || 'عميلنا العزيز',
            dateStr,
            `${process.env.APP_URL || 'https://bunyan.website'}/dashboard/settings/billing`
          ).catch(e => console.error(`Failed to send reminder email to ${targetEmail}:`, e));

          // 2. Create In-App Notification Warning
          try {
            const warningTitle = diffDays === 0 
              ? '⚠️ تنبيه عاجل: اشتراكك ينتهي اليوم!' 
              : `⚠️ تحذير اشتراك: متبقي ${diffDays} أيام على انتهاء الاشتراك`;
            
            await db.insert(notifications).values({
              tenantId: sub.tenantId,
              targetEmail,
              title: warningTitle,
              message: `نود تذكيرك بأن اشتراكك في منصة بنيان لموقع (${sub.tenantName || 'موقعك الرقمي'}) ينتهي بتاريخ ${dateStr}. يرجى تجديد الاشتراك لضمان استمرار عمل موقعك الإلكتروني دون انقطاع.`,
              isRequired: diffDays <= 3 ? 1 : 0,
              isRead: 0
            });
          } catch (err) {
            console.error('Failed to create in-app notification warning:', err);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in subscription reminder cron job:', error);
  }
};

export const startSubscriptionCronJobs = () => {
  // Execute initial check on startup
  checkAndSendSubscriptionReminders();

  // Schedule to run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    await checkAndSendSubscriptionReminders();
  });
};
