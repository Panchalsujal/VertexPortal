import mongoose from "mongoose";

import Order from "../models/order.model.js";

import { validateObjectId } from "../utils/validator.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { parseEnumQuery, parseSortQuery } from "../utils/queryParser.js";

import { ApiError } from "../utils/ApiError.js";

const ORDER_STATUSES = ["pending", "paid", "failed", "cancelled", "refunded"];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const ANALYTICS_PERIODS = ["7d", "30d", "90d", "1y", "all"];

/*
 * ============================================
 * Helper: period range
 * ============================================
 */
function getPeriodRange(period = "30d") {
  if (!ANALYTICS_PERIODS.includes(period)) {
    throw new ApiError(400, "Invalid analytics period");
  }

  const endDate = new Date();

  if (period === "all") {
    return {
      startDate: null,
      endDate,
    };
  }

  const startDate = new Date(endDate);

  if (period === "7d") {
    startDate.setDate(startDate.getDate() - 7);
  }

  if (period === "30d") {
    startDate.setDate(startDate.getDate() - 30);
  }

  if (period === "90d") {
    startDate.setDate(startDate.getDate() - 90);
  }

  if (period === "1y") {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  return {
    startDate,
    endDate,
  };
}

/*
 * ============================================
 * GET ALL ORDERS
 * ============================================
 */
export async function getAdminOrders({ query = {} }) {
  const {
    student,
    course,
    orderStatus,
    paymentStatus,
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,

    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  /*
   * Student filter
   */
  if (student) {
    validateObjectId(student, "student ID");

    filter.student = student;
  }

  /*
   * Course filter
   */
  if (course) {
    validateObjectId(course, "course ID");

    filter["courses.course"] = course;
  }

  /*
   * Order status
   */
  const parsedOrderStatus = parseEnumQuery(
    orderStatus,
    ORDER_STATUSES,
    "Order status",
  );

  if (parsedOrderStatus !== undefined) {
    filter.orderStatus = parsedOrderStatus;
  }

  /*
   * Payment status
   */
  const parsedPaymentStatus = parseEnumQuery(
    paymentStatus,
    PAYMENT_STATUSES,
    "Payment status",
  );

  if (parsedPaymentStatus !== undefined) {
    filter.paymentStatus = parsedPaymentStatus;
  }

  /*
   * Payment method
   */
  if (paymentMethod) {
    if (paymentMethod !== "razorpay") {
      throw new ApiError(400, "Invalid payment method");
    }

    filter.paymentMethod = paymentMethod;
  }

  /*
   * Razorpay order ID
   */
  if (razorpayOrderId?.trim()) {
    filter.razorpayOrderId = String(razorpayOrderId).trim();
  }

  /*
   * Razorpay payment ID
   */
  if (razorpayPaymentId?.trim()) {
    filter.razorpayPaymentId = String(razorpayPaymentId).trim();
  }

  /*
   * Sorting
   */
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
      "paidAt",
      "subtotal",
      "discountAmount",
      "totalAmount",
      "orderStatus",
      "paymentStatus",
    ],

    defaultField: "createdAt",

    defaultOrder: "desc",
  });

  const [orders, totalRecords] = await Promise.all([
    Order.find(filter)
      .populate({
        path: "student",

        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "coupon",

        select: "code discountType discountValue",
      })
      .populate({
        path: "courses.course",

        select: "title slug thumbnailUrl status isPublished isActive",
      })
      .populate({
        path: "courses.instructor",

        select: "fullName email avatarUrl",
      })
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      student: student || null,

      course: course || null,

      orderStatus: parsedOrderStatus ?? null,

      paymentStatus: parsedPaymentStatus ?? null,

      paymentMethod: paymentMethod || null,

      razorpayOrderId: razorpayOrderId?.trim() || null,

      razorpayPaymentId: razorpayPaymentId?.trim() || null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

/*
 * ============================================
 * SINGLE ORDER DETAILS
 * ============================================
 */
export async function getAdminOrderById({ orderId }) {
  validateObjectId(orderId, "order ID");

  const order = await Order.findById(orderId)
    .populate({
      path: "student",

      select: "fullName email avatarUrl role status isActive isEmailVerified",
    })
    .populate({
      path: "coupon",

      select: "code discountType discountValue isActive",
    })
    .populate({
      path: "courses.course",

      select: "title slug thumbnailUrl status isPublished isActive",
    })
    .populate({
      path: "courses.instructor",

      select: "fullName email avatarUrl",
    })
    .lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
}

/*
 * ============================================
 * CANCEL PENDING ORDER
 *
 * Sirf unpaid pending order ko cancel.
 * Paid order ko cancel karna refund nahi hota.
 * ============================================
 */
export async function cancelAdminOrder({ orderId }) {
  validateObjectId(orderId, "order ID");

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.orderStatus === "cancelled") {
    return {
      order,

      changed: false,

      message: "Order is already cancelled",
    };
  }

  if (order.orderStatus === "refunded") {
    throw new ApiError(409, "Refunded order cannot be cancelled");
  }

  /*
   * Paid order ko manually cancel
   * nahi karenge.
   */
  if (order.paymentStatus === "paid") {
    throw new ApiError(
      409,
      "Paid order cannot be cancelled directly. Refund must be processed first.",
    );
  }

  order.orderStatus = "cancelled";

  await order.save();

  return {
    order,

    changed: true,

    message: "Order cancelled successfully",
  };
}

/*
 * ============================================
 * MARK FAILED
 *
 * Payment provider verification/reconciliation
 * ke baad hi admin use kare.
 * ============================================
 */
export async function markAdminOrderFailed({ orderId }) {
  validateObjectId(orderId, "order ID");

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(409, "Paid order cannot be marked as failed");
  }

  if (order.paymentStatus === "failed" && order.orderStatus === "failed") {
    return {
      order,

      changed: false,

      message: "Order is already marked as failed",
    };
  }

  order.paymentStatus = "failed";

  order.orderStatus = "failed";

  await order.save();

  return {
    order,

    changed: true,

    message: "Order marked as failed successfully",
  };
}

/*
 * ============================================
 * MARK REFUNDED
 *
 * IMPORTANT:
 * Ye Razorpay refund execute nahi karta.
 *
 * Sirf tab use karo jab Razorpay refund
 * already successfully execute + verify ho gaya ho.
 * ============================================
 */
export async function markAdminOrderRefunded({ orderId }) {
  validateObjectId(orderId, "order ID");

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "refunded" && order.orderStatus === "refunded") {
    return {
      order,

      changed: false,

      message: "Order is already marked as refunded",
    };
  }

  if (order.paymentStatus !== "paid") {
    throw new ApiError(409, "Only paid orders can be marked as refunded");
  }

  if (!order.razorpayPaymentId) {
    throw new ApiError(409, "Razorpay payment ID is missing");
  }

  order.paymentStatus = "refunded";

  order.orderStatus = "refunded";

  await order.save();

  return {
    order,

    changed: true,

    message: "Order marked as refunded successfully",
  };
}

/*
 * ============================================
 * ORDER + REVENUE ANALYTICS
 * ============================================
 */
export async function getAdminOrderAnalytics({ period = "30d" }) {
  const { startDate, endDate } = getPeriodRange(period);

  /*
   * Revenue ke liye paid orders.
   *
   * Refunded orders current revenue me
   * include nahi karenge.
   */
  const paidDateFilter = startDate
    ? {
        paidAt: {
          $gte: startDate,

          $lte: endDate,
        },
      }
    : {};

  const createdDateFilter = startDate
    ? {
        createdAt: {
          $gte: startDate,

          $lte: endDate,
        },
      }
    : {};

  const [
    totalOrders,
    pendingOrders,
    paidOrders,
    failedOrders,
    cancelledOrders,
    refundedOrders,

    ordersInPeriod,
    paidOrdersInPeriod,
  ] = await Promise.all([
    Order.countDocuments(),

    Order.countDocuments({
      orderStatus: "pending",
    }),

    Order.countDocuments({
      orderStatus: "paid",

      paymentStatus: "paid",
    }),

    Order.countDocuments({
      orderStatus: "failed",
    }),

    Order.countDocuments({
      orderStatus: "cancelled",
    }),

    Order.countDocuments({
      orderStatus: "refunded",
    }),

    Order.countDocuments(createdDateFilter),

    Order.countDocuments({
      ...paidDateFilter,

      paymentStatus: "paid",

      orderStatus: "paid",
    }),
  ]);

  /*
   * Revenue aggregation.
   */
  const revenueResult = await Order.aggregate([
    {
      $match: {
        ...paidDateFilter,

        paymentStatus: "paid",

        orderStatus: "paid",
      },
    },

    {
      $group: {
        _id: null,

        grossSubtotal: {
          $sum: "$subtotal",
        },

        totalDiscount: {
          $sum: "$discountAmount",
        },

        totalRevenue: {
          $sum: "$totalAmount",
        },

        averageOrderValue: {
          $avg: "$totalAmount",
        },

        highestOrderValue: {
          $max: "$totalAmount",
        },

        lowestOrderValue: {
          $min: "$totalAmount",
        },
      },
    },
  ]);

  const revenue = revenueResult[0] ?? {
    grossSubtotal: 0,
    totalDiscount: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    highestOrderValue: 0,
    lowestOrderValue: 0,
  };

  /*
   * Course-wise sales + revenue.
   */
  const courseRevenue = await Order.aggregate([
    {
      $match: {
        ...paidDateFilter,

        paymentStatus: "paid",

        orderStatus: "paid",
      },
    },

    {
      $unwind: "$courses",
    },

    {
      $group: {
        _id: "$courses.course",

        title: {
          $first: "$courses.title",
        },

        instructor: {
          $first: "$courses.instructor",
        },

        salesCount: {
          $sum: 1,
        },

        originalRevenue: {
          $sum: "$courses.originalPrice",
        },

        revenue: {
          $sum: "$courses.finalPrice",
        },

        discountGiven: {
          $sum: {
            $subtract: ["$courses.originalPrice", "$courses.finalPrice"],
          },
        },
      },
    },

    {
      $sort: {
        revenue: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "users",

        localField: "instructor",

        foreignField: "_id",

        as: "instructorDetails",
      },
    },

    {
      $unwind: {
        path: "$instructorDetails",

        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 0,

        courseId: "$_id",

        title: 1,

        salesCount: 1,

        originalRevenue: 1,

        revenue: 1,

        discountGiven: 1,

        instructor: {
          id: "$instructorDetails._id",

          fullName: "$instructorDetails.fullName",

          email: "$instructorDetails.email",
        },
      },
    },
  ]);

  /*
   * Daily revenue trend.
   */
  const revenueTrend = await Order.aggregate([
    {
      $match: {
        ...paidDateFilter,

        paymentStatus: "paid",

        orderStatus: "paid",

        paidAt: {
          $ne: null,

          ...(startDate
            ? {
                $gte: startDate,

                $lte: endDate,
              }
            : {}),
        },
      },
    },

    {
      $group: {
        _id: {
          year: {
            $year: "$paidAt",
          },

          month: {
            $month: "$paidAt",
          },

          day: {
            $dayOfMonth: "$paidAt",
          },
        },

        revenue: {
          $sum: "$totalAmount",
        },

        orders: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        "_id.year": 1,

        "_id.month": 1,

        "_id.day": 1,
      },
    },

    {
      $project: {
        _id: 0,

        date: {
          $dateFromParts: {
            year: "$_id.year",

            month: "$_id.month",

            day: "$_id.day",
          },
        },

        revenue: 1,

        orders: 1,
      },
    },
  ]);

  /*
   * Payment/order status distribution.
   */
  const orderStatusDistribution = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",

        count: {
          $sum: 1,
        },
      },
    },

    {
      $project: {
        _id: 0,

        status: "$_id",

        count: 1,
      },
    },
  ]);

  const paymentStatusDistribution = await Order.aggregate([
    {
      $group: {
        _id: "$paymentStatus",

        count: {
          $sum: 1,
        },
      },
    },

    {
      $project: {
        _id: 0,

        status: "$_id",

        count: 1,
      },
    },
  ]);

  /*
   * Recent orders.
   */
  const recentOrders = await Order.find()
    .select(
      `
        student
        courses
        subtotal
        discountAmount
        totalAmount
        orderStatus
        paymentStatus
        paymentMethod
        razorpayOrderId
        razorpayPaymentId
        paidAt
        createdAt
      `,
    )
    .populate({
      path: "student",

      select: "fullName email avatarUrl",
    })
    .sort({
      createdAt: -1,
    })
    .limit(10)
    .lean();

  /*
   * Success rate.
   */
  const paymentSuccessRate =
    ordersInPeriod > 0
      ? Number(((paidOrdersInPeriod / ordersInPeriod) * 100).toFixed(2))
      : 0;

  return {
    period,

    range: {
      startDate,
      endDate,
    },

    overview: {
      totalOrders,

      pendingOrders,

      paidOrders,

      failedOrders,

      cancelledOrders,

      refundedOrders,

      ordersInPeriod,

      paidOrdersInPeriod,

      paymentSuccessRate,
    },

    revenue: {
      grossSubtotal: Number(revenue.grossSubtotal ?? 0),

      totalDiscount: Number(revenue.totalDiscount ?? 0),

      totalRevenue: Number(revenue.totalRevenue ?? 0),

      averageOrderValue: Number((revenue.averageOrderValue ?? 0).toFixed(2)),

      highestOrderValue: Number(revenue.highestOrderValue ?? 0),

      lowestOrderValue: Number(revenue.lowestOrderValue ?? 0),
    },

    distributions: {
      orderStatus: orderStatusDistribution,

      paymentStatus: paymentStatusDistribution,
    },

    topCourses: courseRevenue,

    revenueTrend,

    recentOrders,
  };
}
