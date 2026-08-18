import { Router } from "express";

import {
  createCouponController,
  getAllCouponsController,
  getCouponByIdController,
  updateCouponController,
  toggleCouponStatusController,
  deleteCouponController,
  restoreCouponController,
} from "../controllers/adminCoupon.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { auditLogAction } from "../middlewares/auditLog.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.post(
  "/",
  auditLogAction("COUPON_CREATED", "Coupon"),
  createCouponController,
);

router.get("/", getAllCouponsController);

router.get("/:couponId", getCouponByIdController);

router.patch(
  "/:couponId",
  auditLogAction("COUPON_UPDATED", "Coupon", (req) => req.params.couponId),
  updateCouponController,
);

router.patch(
  "/:couponId/status",
  auditLogAction("COUPON_STATUS_TOGGLED", "Coupon", (req) => req.params.couponId),
  toggleCouponStatusController,
);

router.delete(
  "/:couponId",
  auditLogAction("COUPON_DELETED", "Coupon", (req) => req.params.couponId),
  deleteCouponController,
);

router.patch(
  "/:couponId/restore",
  auditLogAction("COUPON_RESTORED", "Coupon", (req) => req.params.couponId),
  restoreCouponController,
);

export default router;
