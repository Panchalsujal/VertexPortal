import Coupon from "../models/coupon.model.js";

import { normalizeCouponCode, prepareCouponData } from "./coupon.service.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { buildSearchFilter } from "../utils/search.js";

import { parseEnumQuery, parseSortQuery } from "../utils/queryParser.js";

import { validateBooleanBody, validateObjectId } from "../utils/validator.js";

import { ApiError } from "../utils/ApiError.js";
import { logAdminAction } from "../service/adminAuditLogger.service.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";

const LOCKED_FIELDS_AFTER_USAGE = [
  "discountType",
  "discountValue",
  "minimumCartAmount",
  "perUserLimit",
  "applicableCourses",
  "applicableCategories",
  "excludedCourses",
];

const ALLOWED_UPDATE_FIELDS = [
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

/**
 * Coupon ka calculated status return karta hai.
 */
function getCouponStatus(coupon, now = new Date()) {
  if (coupon.isDeleted) {
    return "deleted";
  }

  if (!coupon.isActive) {
    return "inactive";
  }

  if (new Date(coupon.startsAt).getTime() > now.getTime()) {
    return "scheduled";
  }

  if (new Date(coupon.expiresAt).getTime() <= now.getTime()) {
    return "expired";
  }

  return "active";
}

/**
 * Coupon response me calculated fields add karta hai.
 */
function formatCoupon(coupon, now = new Date()) {
  return {
    ...coupon,

    status: getCouponStatus(coupon, now),

    remainingUses:
      coupon.usageLimit === null
        ? null
        : Math.max(coupon.usageLimit - coupon.usageCount, 0),
  };
}

/**
 * Create coupon
 */
export async function createCoupon({ payload, createdBy }) {
  const { code, discountType, discountValue, expiresAt } = payload || {};

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

  validateObjectId(createdBy, "creator ID");

  const normalizedCode = normalizeCouponCode(code);

  const existingCoupon = await Coupon.exists({
    code: normalizedCode,
  });

  if (existingCoupon) {
    throw new ApiError(409, "Coupon code already exists");
  }

  const couponData = await prepareCouponData({
    ...payload,
    code: normalizedCode,
    startsAt: payload.startsAt ?? new Date(),
  });

  const coupon = await Coupon.create({
    ...couponData,
    createdBy,
  });

  return coupon;
}

/**
 * Get paginated coupon list
 */
export async function getCoupons(query = {}) {
  const {
    search,
    status,
    discountType,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  const searchFilter = buildSearchFilter(search, ["code", "description"]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  const parsedDiscountType = parseEnumQuery(
    discountType,
    ["percentage", "fixed"],
    "Discount type",
  );

  if (parsedDiscountType !== undefined) {
    filter.discountType = parsedDiscountType;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["all", "active", "scheduled", "expired", "inactive", "deleted"],
    "Coupon status",
  );

  const now = new Date();

  if (parsedStatus === "active") {
    filter.isDeleted = false;
    filter.isActive = true;
    filter.startsAt = {
      $lte: now,
    };
    filter.expiresAt = {
      $gt: now,
    };
  }

  if (parsedStatus === "scheduled") {
    filter.isDeleted = false;
    filter.isActive = true;
    filter.startsAt = {
      $gt: now,
    };
  }

  if (parsedStatus === "expired") {
    filter.isDeleted = false;
    filter.expiresAt = {
      $lte: now,
    };
  }

  if (parsedStatus === "inactive") {
    filter.isDeleted = false;
    filter.isActive = false;
  }

  if (parsedStatus === "deleted") {
    filter.isDeleted = true;
  }

  if (!parsedStatus || parsedStatus === "all") {
    filter.isDeleted = false;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "createdAt",
      "updatedAt",
      "startsAt",
      "expiresAt",
      "usageCount",
      "discountValue",
      "code",
    ],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [coupons, totalRecords] = await Promise.all([
    Coupon.find(filter)
      .populate({
        path: "createdBy",
        select: "fullName email avatarUrl",
      })
      .populate({
        path: "applicableCourses",
        select: "title slug thumbnailUrl price discountPrice",
      })
      .populate({
        path: "applicableCategories",
        select: "name slug",
      })
      .populate({
        path: "excludedCourses",
        select: "title slug thumbnailUrl price discountPrice",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Coupon.countDocuments(filter),
  ]);

  const formattedCoupons = coupons.map((coupon) => formatCoupon(coupon, now));

  return {
    coupons: formattedCoupons,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,

      status: parsedStatus || "all",

      discountType: parsedDiscountType ?? null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

/**
 * Get coupon details
 */
export async function getCouponById(couponId) {
  validateObjectId(couponId, "coupon ID");

  const coupon = await Coupon.findById(couponId)
    .populate({
      path: "createdBy",
      select: "fullName email avatarUrl",
    })
    .populate({
      path: "deletedBy",
      select: "fullName email avatarUrl role",
    })
    .populate({
      path: "applicableCourses",
      select: "title slug thumbnailUrl price discountPrice",
    })
    .populate({
      path: "excludedCourses",
      select: "title slug thumbnailUrl price discountPrice",
    })
    .populate({
      path: "applicableCategories",
      select: "name slug",
    })
    .lean();

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  return formatCoupon(coupon);
}

/**
 * Update coupon
 */
export async function updateCoupon({ couponId, payload }) {
  validateObjectId(couponId, "coupon ID");

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (coupon.isDeleted) {
    throw new ApiError(400, "Deleted coupon cannot be updated");
  }

  if (coupon.usageCount > 0) {
    const attemptedLockedFields = LOCKED_FIELDS_AFTER_USAGE.filter(
      (field) => payload[field] !== undefined,
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

  const before = {
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minimumCartAmount: coupon.minimumCartAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
    usageLimit: coupon.usageLimit,
    perUserLimit: coupon.perUserLimit,
    applicableCourses: coupon.applicableCourses,
    applicableCategories: coupon.applicableCategories,
    excludedCourses: coupon.excludedCourses,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
  };

  const normalizedPayload = {
    ...payload,
  };

  if (payload.code !== undefined) {
    const normalizedCode = normalizeCouponCode(payload.code);

    if (normalizedCode !== coupon.code) {
      const existingCoupon = await Coupon.exists({
        code: normalizedCode,
        _id: {
          $ne: coupon._id,
        },
      });

      if (existingCoupon) {
        throw new ApiError(409, "Coupon code already exists");
      }
    }

    normalizedPayload.code = normalizedCode;
  }

  const updateData = await prepareCouponData(normalizedPayload, {
    existingCoupon: coupon,
  });

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (updateData[field] !== undefined) {
      coupon[field] = updateData[field];
    }
  }

  await coupon.save();

  const after = {
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minimumCartAmount: coupon.minimumCartAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
    usageLimit: coupon.usageLimit,
    perUserLimit: coupon.perUserLimit,
    applicableCourses: coupon.applicableCourses,
    applicableCategories: coupon.applicableCategories,
    excludedCourses: coupon.excludedCourses,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
  };

  const changed = JSON.stringify(before) !== JSON.stringify(after);

  return {
    coupon,
    before,
    after,
    changed,
    message: changed
      ? "Coupon updated successfully"
      : "No coupon changes were detected",
  };
}
/**
 * Activate/deactivate coupon
 */
export async function updateCouponStatus({ couponId, isActive }) {
  validateObjectId(couponId, "coupon ID");

  validateBooleanBody(isActive, "isActive");

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (coupon.isDeleted) {
    throw new ApiError(400, "Deleted coupon status cannot be changed");
  }

  const before = {
    isActive: coupon.isActive,
  };

  if (coupon.isActive === isActive) {
    return {
      coupon,
      before,
      after: before,
      changed: false,
      message: `Coupon is already ${isActive ? "active" : "inactive"}`,
    };
  }

  coupon.isActive = isActive;

  await coupon.save();

  const after = {
    isActive: coupon.isActive,
  };

  return {
    coupon,
    before,
    after,
    changed: true,
    message: `Coupon ${isActive ? "activated" : "deactivated"} successfully`,
  };
}

/**
 * Soft delete coupon
 */
export async function deleteCoupon({ couponId, deletedBy }) {
  validateObjectId(couponId, "coupon ID");
  validateObjectId(deletedBy, "admin ID");

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  const before = {
    isDeleted: coupon.isDeleted,
    isActive: coupon.isActive,
    deletedAt: coupon.deletedAt,
    deletedBy: coupon.deletedBy,
  };

  if (coupon.isDeleted) {
    return {
      coupon,
      before,
      after: before,
      changed: false,
      message: "Coupon is already deleted",
    };
  }

  if (coupon.usageCount > 0) {
    throw new ApiError(
      409,
      "Coupon has already been used and cannot be deleted",
    );
  }

  coupon.isDeleted = true;
  coupon.isActive = false;
  coupon.deletedAt = new Date();
  coupon.deletedBy = deletedBy;

  await coupon.save();

  const after = {
    isDeleted: coupon.isDeleted,
    isActive: coupon.isActive,
    deletedAt: coupon.deletedAt,
    deletedBy: coupon.deletedBy,
  };

  return {
    coupon,
    before,
    after,
    changed: true,
    message: "Coupon deleted successfully",
  };
}

/**
 * Restore soft-deleted coupon
 */
export async function restoreCoupon(couponId) {
  validateObjectId(couponId, "coupon ID");

  const coupon = await Coupon.findById(couponId);

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  const before = {
    isDeleted: coupon.isDeleted,
    isActive: coupon.isActive,
    deletedAt: coupon.deletedAt,
    deletedBy: coupon.deletedBy,
  };

  if (!coupon.isDeleted) {
    return {
      coupon,
      before,
      after: before,
      changed: false,
      message: "Coupon is already restored",
    };
  }

  coupon.isDeleted = false;
  coupon.isActive = false;
  coupon.deletedAt = null;
  coupon.deletedBy = null;

  await coupon.save();

  const after = {
    isDeleted: coupon.isDeleted,
    isActive: coupon.isActive,
    deletedAt: coupon.deletedAt,
    deletedBy: coupon.deletedBy,
  };

  return {
    coupon,
    before,
    after,
    changed: true,
    message: "Coupon restored successfully",
  };
}
