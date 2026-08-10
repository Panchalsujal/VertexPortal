import { Router } from "express";

import { getAdminDashboardController } from "../controllers/adminDashboard.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

/*
 * Admin only.
 */
router.use(
  authMiddleware,

  authorizeRoles("admin"),
);

/*
 * Main admin dashboard.
 */
router.get("/", getAdminDashboardController);

export default router;
