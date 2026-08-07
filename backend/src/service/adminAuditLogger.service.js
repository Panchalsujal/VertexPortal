import { createAuditLog } from "./auditLog.service.js";
import { getRequestMetadata } from "../utils/requestMetadata.js";

export async function logAdminAction(
  req,
  {
    action,
    resourceType,
    resourceId = null,
    description = "",
    before = null,
    after = null,
    metadata = null,
  },
) {
  const { ipAddress, userAgent } =
    getRequestMetadata(req);

  return createAuditLog({
    actorId: req.user.id,
    action,
    resourceType,
    resourceId,
    description,
    before,
    after,
    metadata,
    ipAddress,
    userAgent,
  });
}