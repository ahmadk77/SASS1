import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.ts";
import { auditLogs, tenants } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export interface AuthenticatedAuditRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    tenantId?: number;
    [key: string]: any;
  };
  dbUser?: {
    id: number;
    tenantId?: number | null;
    [key: string]: any;
  };
}

export const auditLogger = async (
  req: AuthenticatedAuditRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.on("finish", async () => {
    // Audit log for state-mutating HTTP methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      try {
        const userId = req.user?.uid || (req.dbUser?.id ? String(req.dbUser.id) : "anonymous");
        const rawTenantId = req.dbUser?.tenantId || req.user?.tenantId || null;
        let validTenantId: number | null = null;

        if (rawTenantId && !isNaN(Number(rawTenantId))) {
          const tIdNum = Number(rawTenantId);
          try {
            const tCheck = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, tIdNum)).limit(1);
            if (tCheck.length > 0) {
              validTenantId = tIdNum;
            }
          } catch {
            validTenantId = null;
          }
        }

        const action = `${req.method} ${req.baseUrl || ""}${req.path || req.url}`;
        
        // Sanitize sensitive values
        const sanitizedBody = { ...(req.body || {}) };
        if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]";
        if (sanitizedBody.token) sanitizedBody.token = "[REDACTED]";
        if (sanitizedBody.secret) sanitizedBody.secret = "[REDACTED]";

        const logPayload = {
          tenantId: validTenantId,
          userId: userId,
          action: action,
          resourceType: req.baseUrl ? req.baseUrl.replace(/^\/api\//, "") : "general",
          resourceId: req.params?.id || (req.body?.id ? String(req.body.id) : null),
          changes: {
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            ip: req.ip || req.socket.remoteAddress,
            body: sanitizedBody,
            params: req.params,
            query: req.query,
          },
        };

        try {
          await db.insert(auditLogs).values(logPayload);
        } catch {
          // If insert failed (e.g. invalid foreign key), fallback to null tenantId
          await db.insert(auditLogs).values({
            ...logPayload,
            tenantId: null,
          }).catch(() => {});
        }
      } catch (error) {
        console.error("Failed to write audit log entry:", error);
      }
    }
  });

  next();
};
