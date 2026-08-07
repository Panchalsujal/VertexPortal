import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getAuditLogs,
  getAuditLogById,
} from "../service/auditLog.service.js";

export const getAuditLogsController = asyncHandler(
  async (req, res) => {
    const result = await getAuditLogs(req.query);

    return res.status(200).json({
      success: true,
      message: "Audit logs fetched successfully",
      ...result,
    });
  },
);

export const getAuditLogByIdController = asyncHandler(
  async (req, res) => {
    const { auditLogId } = req.params;

    const auditLog =
      await getAuditLogById(auditLogId);

    return res.status(200).json({
      success: true,
      message: "Audit log fetched successfully",
      auditLog,
    });
  },
);