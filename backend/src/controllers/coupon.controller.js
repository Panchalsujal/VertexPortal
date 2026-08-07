import mongoose from "mongoose";

import Coupon from "../models/coupon.model.js";
import Course from "../models/course.model.js";
import Category from "../models/category.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  normalizeCouponCode,
  prepareCouponData,
} from "../service/coupon.service.js";

export const createCouponController = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, expiresAt } = req.body || {};

  if (
    code === undefined ||
    discountType === undefined ||
    discountValue === undefined ||
    expiresAt === undefined
  ) {
    throw new ApiError(
      400,
      "Code, discount type, discount value and expiry date are required",
    );
  }

  const normalizedCode = normalizeCouponCode(code);

  const existingCoupon = await Coupon.exists({
    code: normalizedCode,
  });

  if (existingCoupon) {
    throw new ApiError(409, "Coupon code already exists");
  }

  const couponData = await prepareCouponData({
    ...req.body,
    code: normalizedCode,
    startsAt: req.body.startsAt ?? new Date(),
  });

  const coupon = await Coupon.create({
    ...couponData,
    createdBy: req.user.id,
  });

  return res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    coupon,
  });
});

export const getAllCouponsController = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    discountType,
    sort = "newest",
  } = req.query;

  const currentPage = Number(page);
  const pageLimit = Number(limit);

  if (!Number.isInteger(currentPage) || currentPage < 1) {
    throw new ApiError(400, "Page must be at least 1");
  }

  if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100");
  }

  const filter = {};

  // Search by coupon code or description
  if (search.trim()) {
    filter.$or = [
      {
        code: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  if (discountType && !["percentage", "fixed"].includes(discountType)) {
    throw new ApiError(400, "Invalid discount type");
  }

  if (discountType) {
    filter.discountType = discountType;
  }

  const now = new Date();

  switch (status) {
    case "active":
      filter.isActive = true;
      filter.startsAt = { $lte: now };
      filter.expiresAt = { $gt: now };
      break;

    case "scheduled":
      filter.isActive = true;
      filter.startsAt = { $gt: now };
      break;

    case "expired":
      filter.expiresAt = { $lte: now };
      break;

    case "inactive":
      filter.isActive = false;
      break;

    case undefined:
    case "":
    case "all":
      break;

    default:
      throw new ApiError(400, "Invalid coupon status");
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    expiringSoon: { expiresAt: 1 },
    usageHigh: { usageCount: -1 },
    usageLow: { usageCount: 1 },
  };

  const sortBy = sortOptions[sort];

  if (!sortBy) {
    throw new ApiError(400, "Invalid sort option");
  }

  const skip = (currentPage - 1) * pageLimit;

  const [coupons, totalCoupons] = await Promise.all([
    Coupon.find(filter)
      .populate("createdBy", "fullName email")
      .populate("applicableCourses", "title thumbnail")
      .populate("applicableCategories", "name")
      .populate("excludedCourses", "title thumbnail")
      .sort(sortBy)
      .skip(skip)
      .limit(pageLimit)
      .lean(),

    Coupon.countDocuments(filter),
  ]);

  const formattedCoupons = coupons.map((coupon) => {
    let currentStatus = "inactive";

    if (coupon.isActive) {
      if (new Date(coupon.startsAt) > now) {
        currentStatus = "scheduled";
      } else if (new Date(coupon.expiresAt) <= now) {
        currentStatus = "expired";
      } else {
        currentStatus = "active";
      }
    }

    return {
      ...coupon,
      status: currentStatus,
      remainingUses:
        coupon.usageLimit === null
          ? null
          : Math.max(coupon.usageLimit - coupon.usageCount, 0),
    };
  });

  const totalPages = Math.ceil(totalCoupons / pageLimit);

  return res.status(200).json({
    success: true,

    coupons: formattedCoupons,

    pagination: {
      currentPage,
      totalPages,
      totalCoupons,
      limit: pageLimit,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },

    filters: {
      search,
      status: status || "all",
      discountType: discountType || "all",
      sort,
    },
  });
});

export const getCouponByIdController = asyncHandler(async (req, res) => {
  const { couponId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid coupon ID",
    });
  }

  const coupon = await Coupon.findById(couponId)
    .populate("createdBy", "fullName email avatarUrl")
    .populate("applicableCourses", "title thumbnail price")
    .populate("excludedCourses", "title thumbnail price")
    .populate("applicableCategories", "name")
    .lean();

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  const now = new Date();

  let status = "inactive";

  if (coupon.isActive) {
    if (new Date(coupon.startsAt) > now) {
      status = "scheduled";
    } else if (new Date(coupon.expiresAt) <= now) {
      status = "expired";
    } else {
      status = "active";
    }
  }

  const remainingUses =
    coupon.usageLimit === null
      ? null
      : Math.max(coupon.usageLimit - coupon.usageCount, 0);

  return res.status(200).json({
    success: true,

    coupon: {
      ...coupon,
      status,
      remainingUses,
    },
  });
});

const LOCKED_FIELDS_AFTER_USAGE = [
  "discountType",
  "discountValue",
  "minimumCartAmount",
  "perUserLimit",
  "applicableCourses",
  "applicableCategories",
  "excludedCourses",
];

export const updateCouponController = asyncHandler(
  async (req, res) => {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      throw new ApiError(400, "Invalid coupon ID");
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      throw new ApiError(
        400,
        "At least one field is required for update",
      );
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    // Once used, critical business fields cannot be changed
    if (coupon.usageCount > 0) {
      const attemptedLockedFields =
        LOCKED_FIELDS_AFTER_USAGE.filter(
          (field) => req.body[field] !== undefined,
        );

      if (attemptedLockedFields.length > 0) {
        throw new ApiError(
          400,
          `Coupon has already been used. These fields cannot be updated: ${attemptedLockedFields.join(
            ", ",
          )}`,
        );
      }
    }

    // Coupon code duplicate validation
    if (req.body.code !== undefined) {
      const normalizedCode = normalizeCouponCode(
        req.body.code,
      );

      if (normalizedCode !== coupon.code) {
        const existingCoupon = await Coupon.exists({
          code: normalizedCode,
          _id: {
            $ne: coupon._id,
          },
        });

        if (existingCoupon) {
          throw new ApiError(
            409,
            "Coupon code already exists",
          );
        }
      }

      req.body.code = normalizedCode;
    }

    const updateData = await prepareCouponData(
      req.body,
      {
        existingCoupon: coupon,
      },
    );

    const allowedFields = [
      "code",
      "description",
      "discountType",
      "discountValue",
      "minimumCartAmount",
      "maxDiscountAmount",
      "usageLimit",
      "perUserLimit",
      "applicableCourses",
      "applicableCategories",
      "excludedCourses",
      "startsAt",
      "expiresAt",
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        coupon[field] = updateData[field];
      }
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  },
);


export const toggleCouponStatusController = asyncHandler(
  async (req, res) => {
    const { couponId } = req.params;
    const { isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      throw new ApiError(400, "Invalid coupon ID");
    }

    if (typeof isActive !== "boolean") {
      throw new ApiError(
        400,
        "isActive must be true or false",
      );
    }

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    // Already in requested state
    if (coupon.isActive === isActive) {
      return res.status(200).json({
        success: true,
        message: `Coupon is already ${
          isActive ? "active" : "inactive"
        }`,
        coupon,
      });
    }

    coupon.isActive = isActive;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      coupon,
    });
  },
);

export const deleteCouponController = asyncHandler(
  async (req, res) => {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      throw new ApiError(400, "Invalid coupon ID");
    }

    const coupon = await Coupon.findOne({
      _id: couponId,
      isDeleted: false,
    });

    if (!coupon) {
      throw new ApiError(404, "Coupon not found");
    }

    if (coupon.usageCount > 0) {
      throw new ApiError(
        409,
        "Coupon has already been used and cannot be deleted",
      );
    }

    coupon.isDeleted = true;
    coupon.deletedAt = new Date();
    coupon.deletedBy = req.user.id;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  },
);