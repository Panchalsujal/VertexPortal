import { asyncHandler } from "../utils/asyncHandler.js";
import Coupon from "../models/coupon.model.js";

import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
  restoreCoupon,
} from "../service/adminCoupon.service.js";

import { createAuditLog } from "../service/auditLog.service.js";
import { getRequestMetadata } from "../utils/requestMetadata.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";

export const createCouponController = asyncHandler(async (req, res) => {
  const coupon = await createCoupon({
    payload: req.body,
    createdBy: req.user.id,
  });

  await logAdminAction(req, {
    action: AUDIT_ACTIONS.COUPON_CREATED,
    resourceType: "coupon",
    resourceId: coupon._id,
    description: `Coupon "${coupon.code}" created`,

    before: null,

    after: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumCartAmount: coupon.minimumCartAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
      isDeleted: coupon.isDeleted,
    },

    metadata: {
      couponCode: coupon.code,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    coupon,
  });
});

export const getAllCouponsController = asyncHandler(async (req, res) => {
  const result = await getCoupons(req.query);

  return res.status(200).json({
    success: true,
    message: "Coupons fetched successfully",
    ...result,
  });
});

export const getCouponByIdController = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const coupon = await getCouponById(couponId);

  return res.status(200).json({
    success: true,
    message: "Coupon details fetched successfully",
    coupon,
  });
});

export const updateCouponController = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const result = await updateCoupon({
    couponId,
    payload: req.body,
  });

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.COUPON_UPDATED,
      resourceType: "coupon",
      resourceId: result.coupon._id,
      description: `Coupon "${result.coupon.code}" updated`,
      before: result.before,
      after: result.after,

      metadata: {
        couponCode: result.coupon.code,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    coupon: result.coupon,
  });
});

export const deleteCouponController = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const result = await deleteCoupon({
    couponId,
    deletedBy: req.user.id,
  });

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.COUPON_DELETED,

      resourceType: "coupon",

      resourceId: result.coupon._id,

      description: `Coupon "${result.coupon.code}" deleted`,

      before: result.before,

      after: result.after,

      metadata: {
        couponCode: result.coupon.code,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const restoreCouponController = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  const result = await restoreCoupon(couponId);

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.COUPON_RESTORED,

      resourceType: "coupon",

      resourceId: result.coupon._id,

      description: `Coupon "${result.coupon.code}" restored`,

      before: result.before,

      after: result.after,

      metadata: {
        couponCode: result.coupon.code,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    coupon: result.coupon,
  });
});

export const toggleCouponStatusController = asyncHandler(async (req, res) => {
  const { couponId } = req.params;
  let { isActive } = req.body || {};

  // If isActive not provided, auto-toggle by reading the current coupon
  if (typeof isActive !== "boolean") {
    if (isActive === "true") {
      isActive = true;
    } else if (isActive === "false") {
      isActive = false;
    } else {
      // Auto-toggle: fetch current status and flip it
      const existing = await Coupon.findById(couponId).select("isActive").lean();
      if (!existing) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }
      isActive = !existing.isActive;
    }
  }

  const result = await updateCouponStatus({
    couponId,
    isActive,
  });

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.COUPON_STATUS_UPDATED,

      resourceType: "coupon",

      resourceId: result.coupon._id,

      description: `Coupon "${result.coupon.code}" ${
        result.coupon.isActive ? "activated" : "deactivated"
      }`,

      before: result.before,

      after: result.after,

      metadata: {
        couponCode: result.coupon.code,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    coupon: result.coupon,
  });
});
