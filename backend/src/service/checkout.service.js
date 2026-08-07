import CartItem from "../models/cartItem.model.js";
import Enrollment from "../models/enrollment.model.js";
import Coupon from "../models/coupon.model.js";
import CouponUsage from "../models/couponUsage.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function validateCheckout({ studentId, couponCode = null }) {
  // 1. Student ka cart fetch karo
  const cartItems = await CartItem.find({
    student: studentId,
  }).populate({
    path: "course",
    select:
      "title instructor category price discountPrice status isPublished isActive",
  });

  if (cartItems.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  const validCourses = [];
  const invalidCartItemIds = [];

  for (const cartItem of cartItems) {
    const course = cartItem.course;

    // Course delete/archive/unpublish ho gaya
    if (
      !course ||
      !course.isActive ||
      !course.isPublished ||
      course.status !== "published"
    ) {
      invalidCartItemIds.push(cartItem._id);
      continue;
    }

    // Instructor apna course purchase nahi kar sakta
    if (course.instructor.toString() === studentId.toString()) {
      invalidCartItemIds.push(cartItem._id);
      continue;
    }

    // Already enrolled check
    const existingEnrollment = await Enrollment.exists({
      student: studentId,
      course: course._id,
      status: {
        $in: ["active", "completed"],
      },
    });

    if (existingEnrollment) {
      invalidCartItemIds.push(cartItem._id);
      continue;
    }

    const originalPrice = Number(course.price) || 0;

    const currentPrice =
      course.discountPrice !== null && course.discountPrice !== undefined
        ? Number(course.discountPrice)
        : originalPrice;

    validCourses.push({
      cartItemId: cartItem._id,
      courseId: course._id,
      title: course.title,
      instructor: course.instructor,
      category: course.category,
      originalPrice,
      currentPrice,
      addedPrice: cartItem.addedPrice,
      priceChanged: Number(cartItem.addedPrice) !== currentPrice,
    });
  }

  if (validCourses.length === 0) {
    throw new ApiError(
      400,
      "No purchasable courses are available in your cart",
    );
  }

  const subtotal = validCourses.reduce(
    (total, item) => total + item.currentPrice,
    0,
  );

  let coupon = null;
  let discountAmount = 0;
  let discountedCourseIds = [];

  if (couponCode?.trim()) {
    coupon = await validateCouponForCheckout({
      code: couponCode,
      subtotal,
      studentId,
      courses: validCourses,
    });

    const discountResult = calculateCouponDiscount({
      coupon,
      courses: validCourses,
    });

    discountAmount = discountResult.discountAmount;
    discountedCourseIds = discountResult.discountedCourseIds;
  }

  const totalAmount = Math.max(subtotal - discountAmount, 0);

  const orderCourses = validCourses.map((item) => ({
    course: item.courseId,
    title: item.title,
    instructor: item.instructor,
    originalPrice: item.originalPrice,
    finalPrice: item.currentPrice,
  }));

  return {
    courses: orderCourses,

    pricing: {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
    },

    coupon: coupon
      ? {
          id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountedCourseIds,
        }
      : null,

    invalidCartItemIds,

    priceChanges: validCourses
      .filter((item) => item.priceChanged)
      .map((item) => ({
        courseId: item.courseId,
        title: item.title,
        addedPrice: item.addedPrice,
        currentPrice: item.currentPrice,
      })),
  };
}

async function validateCouponForCheckout({
  code,
  subtotal,
  courses,
  studentId,
}) {
  const normalizedCode = code.trim().toUpperCase();
  const now = new Date();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isDeleted: false,
  });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  if (!coupon.isActive) {
    throw new ApiError(400, "Coupon is inactive");
  }

  if (coupon.startsAt > now) {
    throw new ApiError(400, "Coupon is not active yet");
  }

  if (coupon.expiresAt <= now) {
    throw new ApiError(400, "Coupon has expired");
  }

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit has been reached");
  }

  const studentUsageCount = await CouponUsage.countDocuments({
    coupon: coupon._id,
    student: studentId,
  });

  if (studentUsageCount >= coupon.perUserLimit) {
    throw new ApiError(
      400,
      "You have already used this coupon maximum allowed times",
    );
  }

  if (subtotal < coupon.minimumCartAmount) {
    throw new ApiError(
      400,
      `Minimum cart amount for this coupon is ${coupon.minimumCartAmount}`,
    );
  }

  const applicableCourses = getCouponApplicableCourses(coupon, courses);

  if (applicableCourses.length === 0) {
    throw new ApiError(400, "Coupon is not applicable to courses in your cart");
  }

  return coupon;
}

function calculateCouponDiscount({ coupon, courses }) {
  const applicableCourses = getCouponApplicableCourses(coupon, courses);

  const applicableAmount = applicableCourses.reduce(
    (total, item) => total + item.currentPrice,
    0,
  );

  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (applicableAmount * coupon.discountValue) / 100;

    if (coupon.maxDiscountAmount !== null) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, applicableAmount);
  }

  return {
    discountAmount,
    discountedCourseIds: applicableCourses.map((item) => item.courseId),
  };
}

function getCouponApplicableCourses(coupon, courses) {
  const applicableCourseIds = new Set(
    (coupon.applicableCourses || []).map((id) => id.toString()),
  );

  const applicableCategoryIds = new Set(
    (coupon.applicableCategories || []).map((id) => id.toString()),
  );

  const excludedCourseIds = new Set(
    (coupon.excludedCourses || []).map((id) => id.toString()),
  );

  const hasCourseRestrictions = applicableCourseIds.size > 0;

  const hasCategoryRestrictions = applicableCategoryIds.size > 0;

  return courses.filter((item) => {
    const courseId = item.courseId.toString();

    const categoryId = item.category ? item.category.toString() : null;

    // Excluded course par coupon kabhi apply nahi hoga
    if (excludedCourseIds.has(courseId)) {
      return false;
    }

    /*
     * Dono applicable arrays empty hain,
     * to coupon sab courses par apply hoga.
     */
    if (!hasCourseRestrictions && !hasCategoryRestrictions) {
      return true;
    }

    const matchesCourse = applicableCourseIds.has(courseId);

    const matchesCategory = categoryId && applicableCategoryIds.has(categoryId);

    return matchesCourse || matchesCategory;
  });
}
