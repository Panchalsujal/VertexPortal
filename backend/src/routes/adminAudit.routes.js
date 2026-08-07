import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

import {
  getAuditLogsController,
  getAuditLogByIdController,
} from "../controllers/adminAudit.controller.js";

const router = Router();

router.use(
  authMiddleware,
  authorizeRoles("admin"),
);

router.get("/", getAuditLogsController);

router.get(
  "/:auditLogId",
  getAuditLogByIdController,
);

export default router;