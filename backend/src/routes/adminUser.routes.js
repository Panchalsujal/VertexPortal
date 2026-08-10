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
router.patch("/:userId/activate", activateUserController);

/*
 * Deactivate
 */
router.patch("/:userId/deactivate", deactivateUserController);

/*
 * Suspend
 */
router.patch("/:userId/suspend", suspendUserController);

/*
 * Generic status
 */
router.patch("/:userId/status", updateAdminUserStatusController);

/*
 * Role
 */
router.patch("/:userId/role", updateAdminUserRoleController);

/*
 * Single user details
 */
router.get("/:userId", getAdminUserByIdController);

export default router;
