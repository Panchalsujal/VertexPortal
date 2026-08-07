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

const router = Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.post("/", createCouponController);

router.get("/", getAllCouponsController);

router.get("/:couponId", getCouponByIdController);

router.patch("/:couponId", updateCouponController);

router.patch("/:couponId/status", toggleCouponStatusController);

router.delete("/:couponId", deleteCouponController);

router.patch("/:couponId/restore", restoreCouponController);

export default router;
