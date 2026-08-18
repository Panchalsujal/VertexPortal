import { Router } from "express";

import {
  getAdminUsersController,
  getAdminUserByIdController,
  updateAdminUserStatusController,
  activateUserController,
  deactivateUserController,
  suspendUserController,
  updateAdminUserRoleController,
  getAdminUserAnalyticsController,
} from "../controllers/adminUser.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { auditLogAction } from "../middlewares/auditLog.middleware.js";

const router = Router();

router.use(
  authMiddleware,
  authorizeRoles("admin"),
);

/*
 * User analytics
 *
 * Dynamic /:userId se pehle.
 */
router.get("/analytics", getAdminUserAnalyticsController);

/*
 * User listing
 */
router.get("/", getAdminUsersController);

/*
 * Activate
 */
router.patch(
  "/:userId/activate",
  auditLogAction("USER_ACTIVATED", "User", (req) => req.params.userId),
  activateUserController,
);

/*
 * Deactivate
 */
router.patch(
  "/:userId/deactivate",
  auditLogAction("USER_DEACTIVATED", "User", (req) => req.params.userId),
  deactivateUserController,
);

/*
 * Suspend
 */
router.patch(
  "/:userId/suspend",
  auditLogAction("USER_SUSPENDED", "User", (req) => req.params.userId),
  suspendUserController,
);

/*
 * Generic status
 */
router.patch(
  "/:userId/status",
  auditLogAction("USER_STATUS_UPDATED", "User", (req) => req.params.userId),
  updateAdminUserStatusController,
);

/*
 * Role
 */
router.patch(
  "/:userId/role",
  auditLogAction("USER_ROLE_UPDATED", "User", (req) => req.params.userId),
  updateAdminUserRoleController,
);

/*
 * Single user details
 */
router.get("/:userId", getAdminUserByIdController);

export default router;
