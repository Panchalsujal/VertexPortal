/**
 * Layer 4: Audit Log Middleware
 * ─────────────────────────────
 * Auto-logs every sensitive admin/instructor action to the AuditLog collection.
 * Usage: auditLogAction("USER_STATUS_CHANGE", "User") in route middleware chain.
 * Supports before/after snapshot injection via res.locals.
 */
import AuditLog from "../models/auditLog.model.js";

/**
 * Get client IP from request, respecting proxy headers.
 */
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Returns an Express middleware that creates an audit log entry after the
 * response is sent. Reads optional before/after state from res.locals.auditBefore
 * and res.locals.auditAfter for richer log entries.
 *
 * @param {string} action       - Human-readable action name e.g. "COURSE_DELETED"
 * @param {string} resourceType - Model name e.g. "Course", "User", "Coupon"
 * @param {Function} [getResourceId] - Optional fn(req) => ObjectId for target resource
 */
export function auditLogAction(action, resourceType, getResourceId = null) {
  return async (req, res, next) => {
    // Hook into the response "finish" event so we only log AFTER the action succeeds
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      // Only audit successful mutations (2xx responses)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const actor = req.user?._id || req.user?.id;
          if (!actor) {
            return originalJson(body);
          }

          const resourceId = getResourceId
            ? getResourceId(req)
            : req.params?.id ||
              req.params?.courseId ||
              req.params?.userId ||
              req.params?.orderId ||
              req.params?.couponId ||
              req.params?.reviewId ||
              req.params?.studentId ||
              req.params?.reportId ||
              req.params?.noteId ||
              req.params?.liveClassId ||
              req.params?.certificateId ||
              null;

          await AuditLog.create({
            actor,
            action: action.toLowerCase(),
            resourceType: resourceType.toLowerCase(),
            resourceId: resourceId || null,
            description: `${req.method} ${req.originalUrl}`,
            before: res.locals.auditBefore || null,
            after: res.locals.auditAfter || null,
            metadata: {
              method: req.method,
              path: req.originalUrl,
              bodyKeys: req.body ? Object.keys(req.body) : [],
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers["user-agent"] || null,
          });
        } catch (logErr) {
          // Never let audit logging break the response
          console.error("[AUDIT-LOG] Failed to write audit log:", logErr.message);
        }
      }

      return originalJson(body);
    };

    next();
  };
}
