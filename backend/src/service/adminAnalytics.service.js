import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Order from "../models/order.model.js";
import Enrollment from "../models/enrollment.model.js";
import Coupon from "../models/coupon.model.js";
import mongoose from "mongoose";
import CourseReview from "../models/courseReview.model.js";
import LiveClass from "../models/liveClass.model.js";
import CouponUsage from "../models/couponUsage.model.js";

import { parseNumberQuery } from "../utils/queryParser.js";

export async function getAnalyticsOverview() {
  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const startOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  const endOfPreviousMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  const [
    totalRevenueResult,
    currentMonthRevenueResult,
    previousMonthRevenueResult,

    totalOrders,
    currentMonthOrders,
    previousMonthOrders,

    totalStudents,
    currentMonthStudents,
    previousMonthStudents,

    totalCourses,
    publishedCourses,

    totalEnrollments,
    activeCoupons,
  ] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          orderStatus: "paid",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          orderStatus: "paid",
          paymentStatus: "paid",
          paidAt: {
            $gte: startOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          orderStatus: "paid",
          paymentStatus: "paid",
          paidAt: {
            $gte: startOfPreviousMonth,
            $lte: endOfPreviousMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ]),

    Order.countDocuments({
      orderStatus: "paid",
      paymentStatus: "paid",
    }),

    Order.countDocuments({
      orderStatus: "paid",
      paymentStatus: "paid",
      paidAt: {
        $gte: startOfMonth,
      },
    }),

    Order.countDocuments({
      orderStatus: "paid",
      paymentStatus: "paid",
      paidAt: {
        $gte: startOfPreviousMonth,
        $lte: endOfPreviousMonth,
      },
    }),

    User.countDocuments({
      role: "student",
      isActive: true,
    }),

    User.countDocuments({
      role: "student",
      createdAt: {
        $gte: startOfMonth,
      },
    }),

    User.countDocuments({
      role: "student",
      createdAt: {
        $gte: startOfPreviousMonth,
        $lte: endOfPreviousMonth,
      },
    }),

    Course.countDocuments({
      isActive: true,
    }),

    Course.countDocuments({
      status: "published",
      isPublished: true,
      isActive: true,
    }),

    Enrollment.countDocuments({
      status: {
        $in: ["active", "completed"],
      },
    }),

    Coupon.countDocuments({
      isDeleted: false,
      isActive: true,
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
    }),
  ]);

  const totalRevenue =
    totalRevenueResult[0]?.totalRevenue ?? 0;

  const currentMonthRevenue =
    currentMonthRevenueResult[0]?.totalRevenue ?? 0;

  const previousMonthRevenue =
    previousMonthRevenueResult[0]?.totalRevenue ?? 0;

  return {
    revenue: {
      total: totalRevenue,
      currentMonth: currentMonthRevenue,
      previousMonth: previousMonthRevenue,
      growthPercentage: calculateGrowthPercentage(
        currentMonthRevenue,
        previousMonthRevenue,
      ),
    },

    orders: {
      total: totalOrders,
      currentMonth: currentMonthOrders,
      previousMonth: previousMonthOrders,
      growthPercentage: calculateGrowthPercentage(
        currentMonthOrders,
        previousMonthOrders,
      ),
    },

    students: {
      total: totalStudents,
      currentMonth: currentMonthStudents,
      previousMonth: previousMonthStudents,
      growthPercentage: calculateGrowthPercentage(
        currentMonthStudents,
        previousMonthStudents,
      ),
    },

    courses: {
      total: totalCourses,
      published: publishedCourses,
    },

    enrollments: {
      total: totalEnrollments,
    },

    coupons: {
      active: activeCoupons,
    },
  };
}

function calculateGrowthPercentage(
  currentValue,
  previousValue,
) {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Number(
    (
      ((currentValue - previousValue) /
        previousValue) *
      100
    ).toFixed(2),
  );
}

export async function getRevenueAnalytics(query = {}) {
  const months = parseNumberQuery(query.months, {
    fieldName: "Months",
    min: 1,
    max: 24,
    integer: true,
  }) ?? 12;

  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months + 1,
    1,
    0,
    0,
    0,
    0,
  );

  const revenueByMonth = await Order.aggregate([
    {
      $match: {
        orderStatus: "paid",
        paymentStatus: "paid",
        paidAt: {
          $gte: startDate,
          $lte: now,
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
        },

        revenue: {
          $sum: "$totalAmount",
        },

        orders: {
          $sum: 1,
        },

        averageOrderValue: {
          $avg: "$totalAmount",
        },

        totalDiscount: {
          $sum: "$discountAmount",
        },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  const revenueMap = new Map(
    revenueByMonth.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item,
    ]),
  );

  const monthlyData = [];

  for (let index = 0; index < months; index += 1) {
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + index,
      1,
    );

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const key = `${year}-${month}`;
    const item = revenueMap.get(key);

    monthlyData.push({
      year,
      month,

      monthName: date.toLocaleString("en-US", {
        month: "short",
      }),

      label: date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),

      revenue: Number(
        (item?.revenue ?? 0).toFixed(2),
      ),

      orders: item?.orders ?? 0,

      averageOrderValue: Number(
        (item?.averageOrderValue ?? 0).toFixed(2),
      ),

      totalDiscount: Number(
        (item?.totalDiscount ?? 0).toFixed(2),
      ),
    });
  }

  const totals = monthlyData.reduce(
    (summary, item) => {
      summary.revenue += item.revenue;
      summary.orders += item.orders;
      summary.totalDiscount += item.totalDiscount;

      return summary;
    },
    {
      revenue: 0,
      orders: 0,
      totalDiscount: 0,
    },
  );

  const overallAverageOrderValue =
    totals.orders > 0
      ? Number(
          (
            totals.revenue / totals.orders
          ).toFixed(2),
        )
      : 0;

  const currentMonth =
    monthlyData.at(-1) ?? null;

  const previousMonth =
    monthlyData.at(-2) ?? null;

  return {
    period: {
      months,
      from: startDate,
      to: now,
    },

    summary: {
      totalRevenue: Number(
        totals.revenue.toFixed(2),
      ),

      totalOrders: totals.orders,

      totalDiscount: Number(
        totals.totalDiscount.toFixed(2),
      ),

      averageOrderValue:
        overallAverageOrderValue,

      revenueGrowthPercentage:
        calculateGrowthPercentage(
          currentMonth?.revenue ?? 0,
          previousMonth?.revenue ?? 0,
        ),

      orderGrowthPercentage:
        calculateGrowthPercentage(
          currentMonth?.orders ?? 0,
          previousMonth?.orders ?? 0,
        ),
    },

    monthlyData,
  };
}

export async function getStudentAnalytics(query = {}) {
  const months =
    parseNumberQuery(query.months, {
      fieldName: "Months",
      min: 1,
      max: 24,
      integer: true,
    }) ?? 12;

  const now = new Date();

  /*
   * Example:
   * Current month = August 2026
   * months = 6
   *
   * Start date = March 1, 2026
   */
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months + 1,
    1,
    0,
    0,
    0,
    0,
  );

  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
    0,
    0,
    0,
    0,
  );

  const previousMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  const [
    registrationsByMonth,
    totalStudents,
    activeStudents,
    inactiveStudents,
    suspendedStudents,
    currentMonthRegistrations,
    previousMonthRegistrations,
  ] = await Promise.all([
    User.aggregate([
      {
        $match: {
          role: "student",

          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },

            month: {
              $month: "$createdAt",
            },
          },

          registrations: {
            $sum: 1,
          },

          activeRegistrations: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$status", "active"],
                    },
                    {
                      $eq: ["$isActive", true],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          inactiveRegistrations: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $eq: ["$status", "inactive"],
                    },
                    {
                      $eq: ["$isActive", false],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          suspendedRegistrations: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "suspended"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    User.countDocuments({
      role: "student",
    }),

    User.countDocuments({
      role: "student",
      status: "active",
      isActive: true,
    }),

    User.countDocuments({
      role: "student",
      status: "inactive",
    }),

    User.countDocuments({
      role: "student",
      status: "suspended",
    }),

    User.countDocuments({
      role: "student",

      createdAt: {
        $gte: currentMonthStart,
        $lte: now,
      },
    }),

    User.countDocuments({
      role: "student",

      createdAt: {
        $gte: previousMonthStart,
        $lte: previousMonthEnd,
      },
    }),
  ]);

  /*
   * Aggregation sirf un months ko return karegi
   * jahan registrations available hain.
   *
   * Isliye missing months ke liye zero fill karenge.
   */
  const registrationMap = new Map(
    registrationsByMonth.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item,
    ]),
  );

  const monthlyData = [];

  for (let index = 0; index < months; index += 1) {
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + index,
      1,
    );

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const key = `${year}-${month}`;
    const item = registrationMap.get(key);

    monthlyData.push({
      year,
      month,

      monthName: date.toLocaleString("en-US", {
        month: "short",
      }),

      label: date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),

      registrations:
        item?.registrations ?? 0,

      activeRegistrations:
        item?.activeRegistrations ?? 0,

      inactiveRegistrations:
        item?.inactiveRegistrations ?? 0,

      suspendedRegistrations:
        item?.suspendedRegistrations ?? 0,
    });
  }

  const periodRegistrations = monthlyData.reduce(
    (total, item) =>
      total + item.registrations,
    0,
  );

  const averageMonthlyRegistrations =
    months > 0
      ? Number(
          (
            periodRegistrations / months
          ).toFixed(2),
        )
      : 0;

  return {
    period: {
      months,
      from: startDate,
      to: now,
    },

    summary: {
      totalStudents,
      activeStudents,
      inactiveStudents,
      suspendedStudents,

      currentMonthRegistrations,
      previousMonthRegistrations,

      growthPercentage:
        calculateGrowthPercentage(
          currentMonthRegistrations,
          previousMonthRegistrations,
        ),

      periodRegistrations,

      averageMonthlyRegistrations,
    },

    monthlyData,
  };
}

export async function getOrderAnalytics(query = {}) {
  const months =
    parseNumberQuery(query.months, {
      fieldName: "Months",
      min: 1,
      max: 24,
      integer: true,
    }) ?? 12;

  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months + 1,
    1,
    0,
    0,
    0,
    0,
  );

  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const previousMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
    0,
    0,
    0,
    0,
  );

  const previousMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  const [
    ordersByMonth,
    totalOrders,
    paidOrders,
    pendingOrders,
    failedOrders,
    refundedOrders,
    cancelledOrders,
    currentMonthPaidOrders,
    previousMonthPaidOrders,
    totalPaidRevenueResult,
  ] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },

          totalOrders: {
            $sum: 1,
          },

          paidOrders: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$orderStatus", "paid"],
                    },
                    {
                      $eq: ["$paymentStatus", "paid"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $eq: ["$orderStatus", "pending"],
                    },
                    {
                      $eq: ["$paymentStatus", "pending"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          failedOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $eq: ["$orderStatus", "failed"],
                    },
                    {
                      $eq: ["$paymentStatus", "failed"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          refundedOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $eq: ["$orderStatus", "refunded"],
                    },
                    {
                      $eq: ["$paymentStatus", "refunded"],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          cancelledOrders: {
            $sum: {
              $cond: [
                {
                  $eq: ["$orderStatus", "cancelled"],
                },
                1,
                0,
              ],
            },
          },

          paidRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$orderStatus", "paid"],
                    },
                    {
                      $eq: ["$paymentStatus", "paid"],
                    },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },

          totalDiscount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$orderStatus", "paid"],
                    },
                    {
                      $eq: ["$paymentStatus", "paid"],
                    },
                  ],
                },
                "$discountAmount",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    Order.countDocuments(),

    Order.countDocuments({
      orderStatus: "paid",
      paymentStatus: "paid",
    }),

    Order.countDocuments({
      $or: [
        {
          orderStatus: "pending",
        },
        {
          paymentStatus: "pending",
        },
      ],
    }),

    Order.countDocuments({
      $or: [
        {
          orderStatus: "failed",
        },
        {
          paymentStatus: "failed",
        },
      ],
    }),

    Order.countDocuments({
      $or: [
        {
          orderStatus: "refunded",
        },
        {
          paymentStatus: "refunded",
        },
      ],
    }),

    Order.countDocuments({
      orderStatus: "cancelled",
    }),

    Order.countDocuments({
      orderStatus: "paid",
      paymentStatus: "paid",
      paidAt: {
        $gte: currentMonthStart,
        $lte: now,
      },
    }),

    Order.countDocuments({
      orderStatus: "paid",
      paymentStatus: "paid",
      paidAt: {
        $gte: previousMonthStart,
        $lte: previousMonthEnd,
      },
    }),

    Order.aggregate([
      {
        $match: {
          orderStatus: "paid",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,

          totalRevenue: {
            $sum: "$totalAmount",
          },

          totalDiscount: {
            $sum: "$discountAmount",
          },
        },
      },
    ]),
  ]);

  const orderMap = new Map(
    ordersByMonth.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item,
    ]),
  );

  const monthlyData = [];

  for (let index = 0; index < months; index += 1) {
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + index,
      1,
    );

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const key = `${year}-${month}`;
    const item = orderMap.get(key);

    const monthTotalOrders = item?.totalOrders ?? 0;
    const monthPaidOrders = item?.paidOrders ?? 0;

    monthlyData.push({
      year,
      month,

      monthName: date.toLocaleString("en-US", {
        month: "short",
      }),

      label: date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),

      totalOrders: monthTotalOrders,
      paidOrders: monthPaidOrders,
      pendingOrders: item?.pendingOrders ?? 0,
      failedOrders: item?.failedOrders ?? 0,
      refundedOrders: item?.refundedOrders ?? 0,
      cancelledOrders: item?.cancelledOrders ?? 0,

      paidRevenue: Number(
        (item?.paidRevenue ?? 0).toFixed(2),
      ),

      totalDiscount: Number(
        (item?.totalDiscount ?? 0).toFixed(2),
      ),

      conversionRate:
        monthTotalOrders > 0
          ? Number(
              (
                (monthPaidOrders / monthTotalOrders) *
                100
              ).toFixed(2),
            )
          : 0,
    });
  }

  const totalRevenue =
    totalPaidRevenueResult[0]?.totalRevenue ?? 0;

  const totalDiscount =
    totalPaidRevenueResult[0]?.totalDiscount ?? 0;

  const conversionRate =
    totalOrders > 0
      ? Number(
          ((paidOrders / totalOrders) * 100).toFixed(2),
        )
      : 0;

  const averageOrderValue =
    paidOrders > 0
      ? Number((totalRevenue / paidOrders).toFixed(2))
      : 0;

  return {
    period: {
      months,
      from: startDate,
      to: now,
    },

    summary: {
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      refundedOrders,
      cancelledOrders,

      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      averageOrderValue,
      conversionRate,

      currentMonthPaidOrders,
      previousMonthPaidOrders,

      growthPercentage: calculateGrowthPercentage(
        currentMonthPaidOrders,
        previousMonthPaidOrders,
      ),
    },

    monthlyData,
  };
}

export async function getCourseAnalytics(query = {}) {
  const limit =
    parseNumberQuery(query.limit, {
      fieldName: "Limit",
      min: 1,
      max: 50,
      integer: true,
    }) ?? 10;

  const [
    courseSales,
    enrollmentStats,
    totalPublishedCourses,
  ] = await Promise.all([
    /*
     * Paid orders ke courses ko unwind karke
     * har course ki sales aur revenue calculate karenge.
     */
    Order.aggregate([
      {
        $match: {
          orderStatus: "paid",
          paymentStatus: "paid",
        },
      },
      {
        $unwind: "$courses",
      },
      {
        $group: {
          _id: "$courses.course",

          totalSales: {
            $sum: 1,
          },

          totalRevenue: {
            $sum: "$courses.finalPrice",
          },

          totalOriginalValue: {
            $sum: "$courses.originalPrice",
          },
        },
      },
      {
        $sort: {
          totalRevenue: -1,
          totalSales: -1,
        },
      },
    ]),

    /*
     * Enrollment aur completion statistics.
     */
    Enrollment.aggregate([
      {
        $group: {
          _id: "$course",

          totalEnrollments: {
            $sum: 1,
          },

          activeEnrollments: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "active"],
                },
                1,
                0,
              ],
            },
          },

          completedEnrollments: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "completed"],
                },
                1,
                0,
              ],
            },
          },

          cancelledEnrollments: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "cancelled"],
                },
                1,
                0,
              ],
            },
          },

          expiredEnrollments: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "expired"],
                },
                1,
                0,
              ],
            },
          },

          averageProgress: {
            $avg: "$progressPercentage",
          },
        },
      },
    ]),

    Course.countDocuments({
      status: "published",
      isPublished: true,
      isActive: true,
    }),
  ]);

  const salesMap = new Map(
    courseSales.map((item) => [
      item._id.toString(),
      item,
    ]),
  );

  const enrollmentMap = new Map(
    enrollmentStats.map((item) => [
      item._id.toString(),
      item,
    ]),
  );

  const courseIds = new Set([
    ...salesMap.keys(),
    ...enrollmentMap.keys(),
  ]);

  const objectIds = [...courseIds]
    .filter((courseId) =>
      mongoose.Types.ObjectId.isValid(courseId),
    )
    .map(
      (courseId) =>
        new mongoose.Types.ObjectId(courseId),
    );

  const courses = await Course.find({
    _id: {
      $in: objectIds,
    },
  })
    .select(`
      title
      slug
      thumbnailUrl
      instructor
      category
      price
      discountPrice
      status
      isPublished
      isActive
      averageRating
      totalReviews
      enrolledStudentsCount
    `)
    .populate({
      path: "instructor",
      select: "fullName email avatarUrl",
    })
    .populate({
      path: "category",
      select: "name slug",
    })
    .lean();

  const analytics = courses.map((course) => {
    const courseId = course._id.toString();

    const sales = salesMap.get(courseId) ?? {
      totalSales: 0,
      totalRevenue: 0,
      totalOriginalValue: 0,
    };

    const enrollments =
      enrollmentMap.get(courseId) ?? {
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        cancelledEnrollments: 0,
        expiredEnrollments: 0,
        averageProgress: 0,
      };

    const completionRate =
      enrollments.totalEnrollments > 0
        ? Number(
            (
              (enrollments.completedEnrollments /
                enrollments.totalEnrollments) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      course,

      sales: {
        totalSales: sales.totalSales ?? 0,

        totalRevenue: Number(
          (sales.totalRevenue ?? 0).toFixed(2),
        ),

        totalOriginalValue: Number(
          (
            sales.totalOriginalValue ?? 0
          ).toFixed(2),
        ),

        totalDiscountGiven: Number(
          Math.max(
            (sales.totalOriginalValue ?? 0) -
              (sales.totalRevenue ?? 0),
            0,
          ).toFixed(2),
        ),
      },

      enrollments: {
        total:
          enrollments.totalEnrollments ?? 0,

        active:
          enrollments.activeEnrollments ?? 0,

        completed:
          enrollments.completedEnrollments ?? 0,

        cancelled:
          enrollments.cancelledEnrollments ?? 0,

        expired:
          enrollments.expiredEnrollments ?? 0,

        averageProgress: Number(
          (
            enrollments.averageProgress ?? 0
          ).toFixed(2),
        ),

        completionRate,
      },
    };
  });

  const topSellingCourses = [...analytics]
    .sort(
      (first, second) =>
        second.sales.totalSales -
        first.sales.totalSales,
    )
    .slice(0, limit);

  const topRevenueCourses = [...analytics]
    .sort(
      (first, second) =>
        second.sales.totalRevenue -
        first.sales.totalRevenue,
    )
    .slice(0, limit);

  const topEnrolledCourses = [...analytics]
    .sort(
      (first, second) =>
        second.enrollments.total -
        first.enrollments.total,
    )
    .slice(0, limit);

  const totals = analytics.reduce(
    (summary, item) => {
      summary.totalSales +=
        item.sales.totalSales;

      summary.totalRevenue +=
        item.sales.totalRevenue;

      summary.totalEnrollments +=
        item.enrollments.total;

      summary.completedEnrollments +=
        item.enrollments.completed;

      return summary;
    },
    {
      totalSales: 0,
      totalRevenue: 0,
      totalEnrollments: 0,
      completedEnrollments: 0,
    },
  );

  const overallCompletionRate =
    totals.totalEnrollments > 0
      ? Number(
          (
            (totals.completedEnrollments /
              totals.totalEnrollments) *
            100
          ).toFixed(2),
        )
      : 0;

  return {
    summary: {
      totalPublishedCourses,

      coursesWithActivity:
        analytics.length,

      totalSales:
        totals.totalSales,

      totalRevenue: Number(
        totals.totalRevenue.toFixed(2),
      ),

      totalEnrollments:
        totals.totalEnrollments,

      completedEnrollments:
        totals.completedEnrollments,

      overallCompletionRate,
    },

    topSellingCourses,
    topRevenueCourses,
    topEnrolledCourses,
  };
}

export async function getReviewAnalytics(query = {}) {
  const months =
    parseNumberQuery(query.months, {
      fieldName: "Months",
      min: 1,
      max: 24,
      integer: true,
    }) ?? 12;

  const limit =
    parseNumberQuery(query.limit, {
      fieldName: "Limit",
      min: 1,
      max: 20,
      integer: true,
    }) ?? 10;

  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months + 1,
    1,
  );

  const [
    summary,
    monthlyReviews,
    topCourses,
  ] = await Promise.all([
    CourseReview.aggregate([
      {
        $match: {
          isPublished: true,
        },
      },
      {
        $group: {
          _id: null,

          totalReviews: {
            $sum: 1,
          },

          averageRating: {
            $avg: "$rating",
          },

          oneStar: {
            $sum: {
              $cond: [{ $eq: ["$rating", 1] }, 1, 0],
            },
          },

          twoStars: {
            $sum: {
              $cond: [{ $eq: ["$rating", 2] }, 1, 0],
            },
          },

          threeStars: {
            $sum: {
              $cond: [{ $eq: ["$rating", 3] }, 1, 0],
            },
          },

          fourStars: {
            $sum: {
              $cond: [{ $eq: ["$rating", 4] }, 1, 0],
            },
          },

          fiveStars: {
            $sum: {
              $cond: [{ $eq: ["$rating", 5] }, 1, 0],
            },
          },
        },
      },
    ]),

    CourseReview.aggregate([
      {
        $match: {
          isPublished: true,
          createdAt: {
            $gte: startDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },
            month: {
              $month: "$createdAt",
            },
          },

          reviews: {
            $sum: 1,
          },

          averageRating: {
            $avg: "$rating",
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    Course.find({
      isPublished: true,
      isActive: true,
    })
      .select(`
        title
        slug
        thumbnailUrl
        averageRating
        totalReviews
        instructor
      `)
      .populate({
        path: "instructor",
        select: "fullName avatarUrl",
      })
      .sort({
        averageRating: -1,
        totalReviews: -1,
      })
      .limit(limit)
      .lean(),
  ]);

  const stats = summary[0] ?? {
    totalReviews: 0,
    averageRating: 0,
    oneStar: 0,
    twoStars: 0,
    threeStars: 0,
    fourStars: 0,
    fiveStars: 0,
  };

  return {
    summary: {
      totalReviews: stats.totalReviews,

      averageRating: Number(
        (stats.averageRating ?? 0).toFixed(2),
      ),

      ratingDistribution: {
        oneStar: stats.oneStar,
        twoStars: stats.twoStars,
        threeStars: stats.threeStars,
        fourStars: stats.fourStars,
        fiveStars: stats.fiveStars,
      },
    },

    monthlyReviews,

    topRatedCourses: topCourses,
  };
}

export async function getLiveClassAnalytics(query = {}) {
  const months =
    parseNumberQuery(query.months, {
      fieldName: "Months",
      min: 1,
      max: 24,
      integer: true,
    }) ?? 12;

  const limit =
    parseNumberQuery(query.limit, {
      fieldName: "Limit",
      min: 1,
      max: 20,
      integer: true,
    }) ?? 10;

  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months + 1,
    1,
    0,
    0,
    0,
    0,
  );

  const [
    summaryResult,
    monthlyResult,
    topAttendedClasses,
  ] = await Promise.all([
    LiveClass.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,

          totalLiveClasses: {
            $sum: 1,
          },

          scheduledClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "scheduled"],
                },
                1,
                0,
              ],
            },
          },

          liveClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "live"],
                },
                1,
                0,
              ],
            },
          },

          completedClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "completed"],
                },
                1,
                0,
              ],
            },
          },

          cancelledClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "cancelled"],
                },
                1,
                0,
              ],
            },
          },

          totalAttendance: {
            $sum: {
              $ifNull: [
                "$attendanceCount",
                0,
              ],
            },
          },

          averageAttendance: {
            $avg: {
              $ifNull: [
                "$attendanceCount",
                0,
              ],
            },
          },

          totalCapacity: {
            $sum: {
              $ifNull: [
                "$maxParticipants",
                0,
              ],
            },
          },
        },
      },
    ]),

    LiveClass.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },

            month: {
              $month: "$createdAt",
            },
          },

          totalClasses: {
            $sum: 1,
          },

          scheduledClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "scheduled"],
                },
                1,
                0,
              ],
            },
          },

          liveClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "live"],
                },
                1,
                0,
              ],
            },
          },

          completedClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "completed"],
                },
                1,
                0,
              ],
            },
          },

          cancelledClasses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "cancelled"],
                },
                1,
                0,
              ],
            },
          },

          totalAttendance: {
            $sum: {
              $ifNull: [
                "$attendanceCount",
                0,
              ],
            },
          },

          averageAttendance: {
            $avg: {
              $ifNull: [
                "$attendanceCount",
                0,
              ],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    LiveClass.find({
      isActive: true,
      status: {
        $in: ["live", "completed"],
      },
    })
      .select(`
        title
        course
        instructor
        scheduledStartAt
        scheduledEndAt
        actualStartAt
        actualEndAt
        status
        meetingProvider
        attendanceCount
        maxParticipants
        recordingUrl
        createdAt
      `)
      .populate({
        path: "course",
        select:
          "title slug thumbnailUrl",
      })
      .populate({
        path: "instructor",
        select:
          "fullName email avatarUrl",
      })
      .sort({
        attendanceCount: -1,
        scheduledStartAt: -1,
      })
      .limit(limit)
      .lean(),
  ]);

  const summary = summaryResult[0] ?? {
    totalLiveClasses: 0,
    scheduledClasses: 0,
    liveClasses: 0,
    completedClasses: 0,
    cancelledClasses: 0,
    totalAttendance: 0,
    averageAttendance: 0,
    totalCapacity: 0,
  };

  const monthlyMap = new Map(
    monthlyResult.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item,
    ]),
  );

  const monthlyData = [];

  for (let index = 0; index < months; index += 1) {
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + index,
      1,
    );

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;

    const item = monthlyMap.get(key);

    monthlyData.push({
      year,
      month,

      monthName: date.toLocaleString(
        "en-US",
        {
          month: "short",
        },
      ),

      label: date.toLocaleString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        },
      ),

      totalClasses:
        item?.totalClasses ?? 0,

      scheduledClasses:
        item?.scheduledClasses ?? 0,

      liveClasses:
        item?.liveClasses ?? 0,

      completedClasses:
        item?.completedClasses ?? 0,

      cancelledClasses:
        item?.cancelledClasses ?? 0,

      totalAttendance:
        item?.totalAttendance ?? 0,

      averageAttendance: Number(
        (
          item?.averageAttendance ?? 0
        ).toFixed(2),
      ),
    });
  }

  const attendanceRate =
    summary.totalCapacity > 0
      ? Number(
          (
            (summary.totalAttendance /
              summary.totalCapacity) *
            100
          ).toFixed(2),
        )
      : 0;

  const completionRate =
    summary.totalLiveClasses > 0
      ? Number(
          (
            (summary.completedClasses /
              summary.totalLiveClasses) *
            100
          ).toFixed(2),
        )
      : 0;

  const cancellationRate =
    summary.totalLiveClasses > 0
      ? Number(
          (
            (summary.cancelledClasses /
              summary.totalLiveClasses) *
            100
          ).toFixed(2),
        )
      : 0;

  const formattedTopClasses =
    topAttendedClasses.map(
      (liveClass) => {
        const attendance =
          liveClass.attendanceCount ?? 0;

        const capacity =
          liveClass.maxParticipants ?? 0;

        return {
          ...liveClass,

          attendanceRate:
            capacity > 0
              ? Number(
                  (
                    (attendance /
                      capacity) *
                    100
                  ).toFixed(2),
                )
              : 0,

          hasRecording: Boolean(
            liveClass.recordingUrl,
          ),
        };
      },
    );

  return {
    period: {
      months,
      from: startDate,
      to: now,
    },

    summary: {
      totalLiveClasses:
        summary.totalLiveClasses ?? 0,

      scheduledClasses:
        summary.scheduledClasses ?? 0,

      liveClasses:
        summary.liveClasses ?? 0,

      completedClasses:
        summary.completedClasses ?? 0,

      cancelledClasses:
        summary.cancelledClasses ?? 0,

      totalAttendance:
        summary.totalAttendance ?? 0,

      averageAttendance: Number(
        (
          summary.averageAttendance ?? 0
        ).toFixed(2),
      ),

      totalCapacity:
        summary.totalCapacity ?? 0,

      attendanceRate,
      completionRate,
      cancellationRate,
    },

    monthlyData,

    topAttendedClasses:
      formattedTopClasses,
  };
}

export async function getCouponAnalytics(query = {}) {
  const months =
    parseNumberQuery(query.months, {
      fieldName: "Months",
      min: 1,
      max: 24,
      integer: true,
    }) ?? 12;

  const limit =
    parseNumberQuery(query.limit, {
      fieldName: "Limit",
      min: 1,
      max: 20,
      integer: true,
    }) ?? 10;

  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - months + 1,
    1,
    0,
    0,
    0,
    0,
  );

  const [
    couponSummaryResult,
    usageSummaryResult,
    monthlyUsageResult,
    topCouponsResult,
  ] = await Promise.all([
    Coupon.aggregate([
      {
        $group: {
          _id: null,

          totalCoupons: {
            $sum: 1,
          },

          deletedCoupons: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isDeleted", true],
                },
                1,
                0,
              ],
            },
          },

          activeCoupons: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$isDeleted", false],
                    },
                    {
                      $eq: ["$isActive", true],
                    },
                    {
                      $lte: ["$startsAt", now],
                    },
                    {
                      $gt: ["$expiresAt", now],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          scheduledCoupons: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$isDeleted", false],
                    },
                    {
                      $eq: ["$isActive", true],
                    },
                    {
                      $gt: ["$startsAt", now],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          expiredCoupons: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$isDeleted", false],
                    },
                    {
                      $lte: ["$expiresAt", now],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          inactiveCoupons: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$isDeleted", false],
                    },
                    {
                      $eq: ["$isActive", false],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          totalUsageCount: {
            $sum: {
              $ifNull: ["$usageCount", 0],
            },
          },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          orderStatus: "paid",
          paymentStatus: "paid",
          coupon: {
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: null,

          couponOrders: {
            $sum: 1,
          },

          couponRevenue: {
            $sum: "$totalAmount",
          },

          totalDiscountGiven: {
            $sum: "$discountAmount",
          },
        },
      },
    ]),

    CouponUsage.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },

            month: {
              $month: "$createdAt",
            },
          },

          usageCount: {
            $sum: 1,
          },

          totalDiscount: {
            $sum: {
              $ifNull: ["$discountAmount", 0],
            },
          },

          totalRevenue: {
            $sum: {
              $ifNull: ["$finalAmount", 0],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),

    CouponUsage.aggregate([
      {
        $group: {
          _id: "$coupon",

          usageCount: {
            $sum: 1,
          },

          uniqueStudents: {
            $addToSet: "$student",
          },

          totalDiscount: {
            $sum: {
              $ifNull: ["$discountAmount", 0],
            },
          },

          totalRevenue: {
            $sum: {
              $ifNull: ["$finalAmount", 0],
            },
          },
        },
      },
      {
        $addFields: {
          uniqueStudentCount: {
            $size: "$uniqueStudents",
          },
        },
      },
      {
        $sort: {
          usageCount: -1,
          totalRevenue: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "coupons",
          localField: "_id",
          foreignField: "_id",
          as: "coupon",
        },
      },
      {
        $unwind: {
          path: "$coupon",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,

          couponId: "$_id",

          code: "$coupon.code",

          description: "$coupon.description",

          discountType: "$coupon.discountType",

          discountValue: "$coupon.discountValue",

          isActive: "$coupon.isActive",

          isDeleted: "$coupon.isDeleted",

          startsAt: "$coupon.startsAt",

          expiresAt: "$coupon.expiresAt",

          usageCount: 1,

          uniqueStudentCount: 1,

          totalDiscount: 1,

          totalRevenue: 1,
        },
      },
    ]),
  ]);

  const couponSummary =
    couponSummaryResult[0] ?? {
      totalCoupons: 0,
      deletedCoupons: 0,
      activeCoupons: 0,
      scheduledCoupons: 0,
      expiredCoupons: 0,
      inactiveCoupons: 0,
      totalUsageCount: 0,
    };

  const usageSummary =
    usageSummaryResult[0] ?? {
      couponOrders: 0,
      couponRevenue: 0,
      totalDiscountGiven: 0,
    };

  const monthlyUsageMap = new Map(
    monthlyUsageResult.map((item) => [
      `${item._id.year}-${item._id.month}`,
      item,
    ]),
  );

  const monthlyData = [];

  for (let index = 0; index < months; index += 1) {
    const date = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + index,
      1,
    );

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const key = `${year}-${month}`;
    const item = monthlyUsageMap.get(key);

    monthlyData.push({
      year,
      month,

      monthName: date.toLocaleString("en-US", {
        month: "short",
      }),

      label: date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),

      usageCount: item?.usageCount ?? 0,

      totalDiscount: Number(
        (item?.totalDiscount ?? 0).toFixed(2),
      ),

      totalRevenue: Number(
        (item?.totalRevenue ?? 0).toFixed(2),
      ),
    });
  }

  const couponConversionRate =
    usageSummary.couponOrders > 0
      ? Number(
          (
            (couponSummary.totalUsageCount /
              usageSummary.couponOrders) *
            100
          ).toFixed(2),
        )
      : 0;

  const averageDiscountPerUsage =
    couponSummary.totalUsageCount > 0
      ? Number(
          (
            usageSummary.totalDiscountGiven /
            couponSummary.totalUsageCount
          ).toFixed(2),
        )
      : 0;

  const formattedTopCoupons =
    topCouponsResult.map((coupon) => ({
      ...coupon,

      totalDiscount: Number(
        (coupon.totalDiscount ?? 0).toFixed(2),
      ),

      totalRevenue: Number(
        (coupon.totalRevenue ?? 0).toFixed(2),
      ),
    }));

  return {
    period: {
      months,
      from: startDate,
      to: now,
    },

    summary: {
      totalCoupons:
        couponSummary.totalCoupons ?? 0,

      activeCoupons:
        couponSummary.activeCoupons ?? 0,

      scheduledCoupons:
        couponSummary.scheduledCoupons ?? 0,

      expiredCoupons:
        couponSummary.expiredCoupons ?? 0,

      inactiveCoupons:
        couponSummary.inactiveCoupons ?? 0,

      deletedCoupons:
        couponSummary.deletedCoupons ?? 0,

      totalUsageCount:
        couponSummary.totalUsageCount ?? 0,

      couponOrders:
        usageSummary.couponOrders ?? 0,

      couponRevenue: Number(
        (
          usageSummary.couponRevenue ?? 0
        ).toFixed(2),
      ),

      totalDiscountGiven: Number(
        (
          usageSummary.totalDiscountGiven ?? 0
        ).toFixed(2),
      ),

      averageDiscountPerUsage,

      couponConversionRate,
    },

    monthlyData,

    topCoupons: formattedTopCoupons,
  };
}