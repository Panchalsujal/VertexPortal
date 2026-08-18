import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { auditLogAction } from "../middlewares/auditLog.middleware.js";

import {
  getLiveClassesController,
  getLiveClassByIdController,
  updateLiveClassStatusController,
  cancelLiveClassController,
  restoreLiveClassController,
} from "../controllers/admin.controller.js";

import {
  getInstructorLiveClassAttendanceController,
  getInstructorLiveClassAttendanceAnalyticsController,
} from "../controllers/liveClass.controller.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  getLiveClassesController,
);

router.get(
  "/:liveClassId",
  authMiddleware,
  authorizeRoles("admin"),
  getLiveClassByIdController,
);

router.get(
  "/:liveClassId/attendance",
  authMiddleware,
  authorizeRoles("admin"),
  getInstructorLiveClassAttendanceController,
);

router.get(
  "/:liveClassId/attendance/analytics",
  authMiddleware,
  authorizeRoles("admin"),
  getInstructorLiveClassAttendanceAnalyticsController,
);

router.patch(
  "/:liveClassId/status",
  authMiddleware,
  authorizeRoles("admin"),
  auditLogAction("LIVE_CLASS_STATUS_UPDATED", "LiveClass", (req) => req.params.liveClassId),
  updateLiveClassStatusController,
);

router.delete(
  "/:liveClassId",
  authMiddleware,
  authorizeRoles("admin"),
  auditLogAction("LIVE_CLASS_CANCELLED", "LiveClass", (req) => req.params.liveClassId),
  cancelLiveClassController,
);

router.patch(
  "/:liveClassId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  auditLogAction("LIVE_CLASS_RESTORED", "LiveClass", (req) => req.params.liveClassId),
  restoreLiveClassController,
);

export default router;
