import cron, { ScheduledTask } from "node-cron";
import { eq, and, lt } from "drizzle-orm";
import { db } from "../db/index.ts";
import { abandonedCarts } from "../db/schema.ts";
import { logger } from "../lib/logger.ts";

/**
 * Scheduled job for abandoned cart recovery notifications.
 * Runs every 15 minutes to inspect carts inactive for > 2 hours with 'pending' status.
 */
export function startAbandonedCartRecoveryCron(): ScheduledTask {
  // Cron schedule: Run every 15 minutes
  const task = cron.schedule("*/15 * * * *", async () => {
    logger.info("Running Abandoned Cart Recovery check...", { cron: "abandonedCartRecovery" });
    
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // 1. Query Drizzle DB for carts inactive for > 2 hours with status 'pending'
      const pendingCarts = await db
        .select()
        .from(abandonedCarts)
        .where(
          and(
            eq(abandonedCarts.status, "pending"),
            lt(abandonedCarts.lastActiveAt, twoHoursAgo)
          )
        );

      if (pendingCarts.length === 0) {
        logger.info("No abandoned carts pending notification.", { cron: "abandonedCartRecovery" });
        return;
      }

      logger.info(`Found ${pendingCarts.length} abandoned cart(s) to process.`, { cron: "abandonedCartRecovery", count: pendingCarts.length });

      // 2. Loop through results to simulate sending a recovery notification
      for (const cart of pendingCarts) {
        try {
          const recipient = cart.customerEmail || cart.customerPhone || `Cart #${cart.id}`;
          logger.info(`Sending recovery reminder to ${recipient}`, { tenantId: cart.tenantId, totalAmount: cart.totalAmount });

          // 3. Securely update status to 'notified' using Drizzle
          await db
            .update(abandonedCarts)
            .set({
              status: "notified",
              updatedAt: new Date(),
            })
            .where(eq(abandonedCarts.id, cart.id));

          logger.info(`Cart ID ${cart.id} status updated to 'notified'.`, { cartId: cart.id });
        } catch (itemError) {
          logger.error(`Error processing cart ID ${cart.id}:`, itemError, { cartId: cart.id });
        }
      }
    } catch (error) {
      logger.error("Error executing abandoned cart recovery job:", error);
    }
  });

  return task;
}
