import { Router } from "express";

import {
  getAdminOrdersController,
  getAdminOrderAnalyticsController,
  getAdminOrderByIdController,
  cancelAdminOrderController,
  markAdminOrderFailedController,
  markAdminOrderRefundedController,
} from "../controllers/adminOrder.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles("admin"),
);

/*
 * Analytics dynamic ID route se pehle.
 */
router.get("/analytics", getAdminOrderAnalyticsController);

/*
 * All orders
 */
router.get("/", getAdminOrdersController);

/*
 * Cancel unpaid order
 */
router.patch("/:orderId/cancel", cancelAdminOrderController);

/*
 * Mark failed
 */
router.patch("/:orderId/failed", markAdminOrderFailedController);

/*
 * Mark refunded.
 *
 * Ye Razorpay refund EXECUTE nahi karta.
 * Successful refund verification ke baad use karna.
 */
router.patch("/:orderId/refunded", markAdminOrderRefundedController);

/*
 * Single order
 */
router.get("/:orderId", getAdminOrderByIdController);

export default router;
