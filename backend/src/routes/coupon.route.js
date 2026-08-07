import Router from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import {
  createCouponController,
  getAllCouponsController,
  getCouponByIdController,
  updateCouponController,
  toggleCouponStatusController,
  deleteCouponController,
} from "../controllers/coupon.controller.js";

const router = Router();

/**
 * @route POST /api/admin/coupons
 * @desc Create a new coupon
 * @access Admin
 */

router.post(
  "/admin/coupons",
  authMiddleware,
  authorizeRoles("admin"),
  createCouponController,
);

/**
 * @route GET /api/admin/coupons
 * @desc Get all coupons with pagination and filtering
 * @access Admin
 */

router.get(
  "/admin/coupons",
  authMiddleware,
  authorizeRoles("admin"),
  getAllCouponsController,
);

/**
 * @route GET /api/admin/coupons/:couponId
 * @desc Get a coupon by ID
 * @access Admin
 */

router.get(
  "/admin/coupons/:couponId",
  authMiddleware,
  authorizeRoles("admin"),
  getCouponByIdController,
);

/** * @route PATCH /api/admin/coupons/:couponId
 * @desc Update a coupon by ID
 * @access Admin
 */

router.patch(
  "/admin/coupons/:couponId",
  authMiddleware,
  authorizeRoles("admin"),
  updateCouponController,
);

/** * @route PATCH /api/admin/coupons/:couponId/status
 * @desc Toggle the status of a coupon by ID
 * @access Admin
 */

router.patch(
  "/admin/coupons/:couponId/status",
  authMiddleware,
  authorizeRoles("admin"),
  toggleCouponStatusController,
);



/** * @route DELETE /api/admin/coupons/:couponId
 * @desc Delete a coupon by ID
 * @access Admin
 */

router.delete(
    "/admin/coupons/:couponId",
    authMiddleware,
    authorizeRoles("admin"),
    deleteCouponController,
);
export default router;
