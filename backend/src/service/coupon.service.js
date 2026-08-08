import mongoose from "mongoose";

import Course from "../models/course.model.js";
import Category from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";

const DISCOUNT_TYPES = ["percentage", "fixed"];

export const normalizeCouponCode = (code) => {
  if (typeof code !== "string" || !code.trim()) {
    throw new ApiError(400, "Coupon code is required");
  }

  return code.trim().toUpperCase();
};

export const parseOptionalNumber = (
  value,
  fieldName,
  {
    min = null,
    max = null,
    allowNull = false,
    integer = false,
  } = {},
) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    if (allowNull) {
      return null;
    }

    throw new ApiError(
      400,
      `${fieldName} cannot be null or empty`,
    );
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new ApiError(
      400,
      `${fieldName} must be a valid number`,
    );
  }

  if (integer && !Number.isInteger(parsedValue)) {
    throw new ApiError(
      400,
      `${fieldName} must be an integer`,
    );
  }

  if (min !== null && parsedValue < min) {
    throw new ApiError(
      400,
      `${fieldName} must be at least ${min}`,
    );
  }

  if (max !== null && parsedValue > max) {
    throw new ApiError(
      400,
      `${fieldName} cannot exceed ${max}`,
    );
  }

  return parsedValue;
};

export const parseCouponDate = (
  value,
  fieldName,
  { required = false } = {},
) => {
  if (value === undefined) {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  if (value === null || value === "") {
    if (required) {
      throw new ApiError(
        400,
        `${fieldName} cannot be empty`,
      );
    }

    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(
      400,
      `${fieldName} must be a valid date`,
    );
  }

  return parsedDate;
};

export const validateCouponDateRange = (
  startsAt,
  expiresAt,
) => {
  if (!startsAt || !expiresAt) {
    return;
  }

  if (expiresAt <= startsAt) {
    throw new ApiError(
      400,
      "Coupon expiry date must be after start date",
    );
  }
};

const normalizeObjectIdArray = (
  values,
  fieldName,
) => {
  if (values === undefined) {
    return undefined;
  }

  if (!Array.isArray(values)) {
    throw new ApiError(
      400,
      `${fieldName} must be an array`,
    );
  }

  const normalizedValues = [
    ...new Set(values.map((value) => String(value))),
  ];

  const hasInvalidId = normalizedValues.some(
    (value) =>
      !mongoose.Types.ObjectId.isValid(value),
  );

  if (hasInvalidId) {
    throw new ApiError(
      400,
      `${fieldName} contains an invalid ID`,
    );
  }

  return normalizedValues;
};

export const validateCourseIds = async (
  values,
  fieldName = "Courses",
) => {
  const normalizedIds = normalizeObjectIdArray(
    values,
    fieldName,
  );

  if (normalizedIds === undefined) {
    return undefined;
  }

  if (normalizedIds.length === 0) {
    return [];
  }

  const validCoursesCount =
    await Course.countDocuments({
      _id: {
        $in: normalizedIds,
      },
    });

  if (validCoursesCount !== normalizedIds.length) {
    throw new ApiError(
      400,
      `One or more ${fieldName.toLowerCase()} are invalid`,
    );
  }

  return normalizedIds;
};

export const validateCategoryIds = async (
  values,
) => {
  const normalizedIds = normalizeObjectIdArray(
    values,
    "Applicable categories",
  );

  if (normalizedIds === undefined) {
    return undefined;
  }

  if (normalizedIds.length === 0) {
    return [];
  }

  const validCategoriesCount =
    await Category.countDocuments({
      _id: {
        $in: normalizedIds,
      },
    });

  if (
    validCategoriesCount !== normalizedIds.length
  ) {
    throw new ApiError(
      400,
      "One or more applicable categories are invalid",
    );
  }

  return normalizedIds;
};

export const validateCourseRules = ({
  applicableCourses = [],
  excludedCourses = [],
}) => {
  const applicableCourseIds = new Set(
    applicableCourses.map(String),
  );

  const duplicateCourse = excludedCourses.find(
    (courseId) =>
      applicableCourseIds.has(String(courseId)),
  );

  if (duplicateCourse) {
    throw new ApiError(
      400,
      "A course cannot be both applicable and excluded",
    );
  }
};

export const validateDiscountData = ({
  discountType,
  discountValue,
  maxDiscountAmount,
}) => {
  if (
    !DISCOUNT_TYPES.includes(discountType)
  ) {
    throw new ApiError(
      400,
      "Discount type must be percentage or fixed",
    );
  }

  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0
  ) {
    throw new ApiError(
      400,
      "Discount value must be greater than 0",
    );
  }

  if (
    discountType === "percentage" &&
    discountValue > 100
  ) {
    throw new ApiError(
      400,
      "Percentage discount cannot exceed 100",
    );
  }

  if (
    discountType === "fixed" &&
    maxDiscountAmount !== null &&
    maxDiscountAmount !== undefined
  ) {
    throw new ApiError(
      400,
      "Maximum discount amount is only valid for percentage coupons",
    );
  }
};

export const validateCouponUsageLimits = ({
  usageLimit,
  usageCount = 0,
  perUserLimit,
}) => {
  if (
    usageLimit !== null &&
    usageLimit !== undefined &&
    usageLimit < usageCount
  ) {
    throw new ApiError(
      400,
      `Usage limit cannot be lower than current usage count (${usageCount})`,
    );
  }

  if (
    usageLimit !== null &&
    usageLimit !== undefined &&
    perUserLimit !== undefined &&
    perUserLimit > usageLimit
  ) {
    throw new ApiError(
      400,
      "Per-user limit cannot exceed total usage limit",
    );
  }
};

export const prepareCouponData = async (
  payload,
  { existingCoupon = null } = {},
) => {
  const preparedData = {};

  if (payload.code !== undefined) {
    preparedData.code = normalizeCouponCode(
      payload.code,
    );
  }

  if (payload.description !== undefined) {
    if (typeof payload.description !== "string") {
      throw new ApiError(
        400,
        "Description must be a string",
      );
    }

    preparedData.description =
      payload.description.trim();
  }

  if (payload.discountType !== undefined) {
    if (
      !DISCOUNT_TYPES.includes(
        payload.discountType,
      )
    ) {
      throw new ApiError(
        400,
        "Invalid discount type",
      );
    }

    preparedData.discountType =
      payload.discountType;
  }

  preparedData.discountValue =
    parseOptionalNumber(
      payload.discountValue,
      "Discount value",
      {
        min: 0.01,
      },
    );

  preparedData.minimumCartAmount =
    parseOptionalNumber(
      payload.minimumCartAmount,
      "Minimum cart amount",
      {
        min: 0,
      },
    );

  preparedData.maxDiscountAmount =
    parseOptionalNumber(
      payload.maxDiscountAmount,
      "Maximum discount amount",
      {
        min: 0,
        allowNull: true,
      },
    );

  preparedData.usageLimit =
    parseOptionalNumber(
      payload.usageLimit,
      "Usage limit",
      {
        min: 1,
        allowNull: true,
        integer: true,
      },
    );

  preparedData.perUserLimit =
    parseOptionalNumber(
      payload.perUserLimit,
      "Per-user limit",
      {
        min: 1,
        integer: true,
      },
    );

  preparedData.startsAt = parseCouponDate(
    payload.startsAt,
    "Start date",
  );

  preparedData.expiresAt = parseCouponDate(
    payload.expiresAt,
    "Expiry date",
  );

  preparedData.applicableCourses =
    await validateCourseIds(
      payload.applicableCourses,
      "Applicable courses",
    );

  preparedData.applicableCategories =
    await validateCategoryIds(
      payload.applicableCategories,
    );

  preparedData.excludedCourses =
    await validateCourseIds(
      payload.excludedCourses,
      "Excluded courses",
    );

  Object.keys(preparedData).forEach((key) => {
    if (preparedData[key] === undefined) {
      delete preparedData[key];
    }
  });

  const finalData = {
    ...(existingCoupon
      ? existingCoupon.toObject()
      : {}),
    ...preparedData,
  };

  validateDiscountData({
    discountType: finalData.discountType,
    discountValue: finalData.discountValue,
    maxDiscountAmount:
      finalData.maxDiscountAmount,
  });

  validateCouponDateRange(
    finalData.startsAt,
    finalData.expiresAt,
  );

  validateCouponUsageLimits({
    usageLimit: finalData.usageLimit,
    usageCount: finalData.usageCount ?? 0,
    perUserLimit: finalData.perUserLimit,
  });

  validateCourseRules({
    applicableCourses:
      finalData.applicableCourses ?? [],
    excludedCourses:
      finalData.excludedCourses ?? [],
  });

  return preparedData;
};

export const calculateCouponStatus = (
  coupon,
  now = new Date(),
) => {
  if (!coupon.isActive) {
    return "inactive";
  }

  if (new Date(coupon.startsAt) > now) {
    return "scheduled";
  }

  if (new Date(coupon.expiresAt) <= now) {
    return "expired";
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    return "exhausted";
  }

  return "active";
};

export const getRemainingCouponUses = (coupon) => {
  if (coupon.usageLimit === null) {
    return null;
  }

  return Math.max(
    coupon.usageLimit - coupon.usageCount,
    0,
  );
};