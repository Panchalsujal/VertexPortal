import mongoose from "mongoose";

import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";
import LiveClass from "../models/liveClass.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import CourseReview from "../models/courseReview.model.js";

import { recalculateCourseRating } from "./review.service.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { buildSearchFilter, escapeRegex } from "../utils/search.js";

import { validateObjectId, validateBooleanBody } from "../utils/validator.js";

import {
  parseBooleanQuery,
  parseSortQuery,
  parseEnumQuery,
  parseDateRange,
  parseNumberQuery,
} from "../utils/queryParser.js";

import { ApiError } from "../utils/ApiError.js";

async function getDashboardSummaryData() {
  const now = new Date();

  const [
    totalStudents,
    totalInstructors,
    totalCourses,
    publishedCourses,
    draftCourses,
    totalOrders,
    revenueResult,
    activeCoupons,
    liveClasses,
  ] = await Promise.all([
    User.countDocuments({
      role: "student",
      isActive: true,
    }),

    User.countDocuments({
      role: "instructor",
      isActive: true,
    }),

    Course.countDocuments({
      isActive: true,
    }),

    Course.countDocuments({
      status: "published",
      isPublished: true,
      isActive: true,
    }),

    Course.countDocuments({
      status: "draft",
      isActive: true,
    }),

    Order.countDocuments({
      orderStatus: "paid",
      paymentStatus: "paid",
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
        },
      },
    ]),

    Coupon.countDocuments({
      isActive: true,
      isDeleted: false,
      startsAt: {
        $lte: now,
      },
      expiresAt: {
        $gt: now,
      },
    }),

    LiveClass.countDocuments({
      isActive: true,
      status: {
        $in: ["scheduled", "live"],
      },
    }),
  ]);

  return {
    totalStudents,
    totalInstructors,
    totalCourses,
    publishedCourses,
    draftCourses,
    totalOrders,
    totalRevenue: revenueResult[0]?.totalRevenue ?? 0,
    activeCoupons,
    liveClasses,
  };
}

export async function getDashboardSummary() {
  return getDashboardSummaryData();
}

export async function getAdminDashboard() {
  const now = new Date();

  const [
    summary,
    recentOrders,
    recentStudents,
    topCourses,
    recentReviews,
    upcomingLiveClasses,
  ] = await Promise.all([
    getDashboardSummaryData(),

    Order.find({
      orderStatus: "paid",
      paymentStatus: "paid",
    })
      .select(
        `
        student
        courses
        subtotal
        discountAmount
        totalAmount
        paymentMethod
        paymentStatus
        orderStatus
        coupon
        paidAt
        createdAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl",
      })
      .populate({
        path: "courses.course",
        select: "title thumbnailUrl slug",
      })
      .populate({
        path: "coupon",
        select: "code",
      })
      .sort({
        paidAt: -1,
        createdAt: -1,
      })
      .limit(5)
      .lean(),

    User.find({
      role: "student",
      isActive: true,
    })
      .select("fullName email avatarUrl status isActive createdAt")
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean(),

    Course.find({
      isActive: true,
      isPublished: true,
      status: "published",
    })
      .select(
        `
        title
        slug
        thumbnailUrl
        instructor
        enrolledStudentsCount
        wishlistCount
        averageRating
        totalReviews
      `,
      )
      .populate({
        path: "instructor",
        select: "fullName avatarUrl",
      })
      .sort({
        enrolledStudentsCount: -1,
        averageRating: -1,
      })
      .limit(5)
      .lean(),

    CourseReview.find({
      isPublished: true,
    })
      .select(
        `
        student
        course
        rating
        title
        comment
        isEdited
        createdAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName avatarUrl",
      })
      .populate({
        path: "course",
        select: "title slug thumbnailUrl",
      })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean(),

    LiveClass.find({
      isActive: true,
      isPublished: true,
      status: "scheduled",
      scheduledStartAt: {
        $gte: now,
      },
    })
      .select(
        `
        course
        instructor
        title
        scheduledStartAt
        scheduledEndAt
        meetingProvider
        status
        maxParticipants
        attendanceCount
      `,
      )
      .populate({
        path: "course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "instructor",
        select: "fullName avatarUrl",
      })
      .sort({
        scheduledStartAt: 1,
      })
      .limit(5)
      .lean(),
  ]);

  return {
    summary,
    recentOrders,
    recentStudents,
    topCourses,
    recentReviews,
    upcomingLiveClasses,
  };
}

export async function getOrders(query = {}) {
  const {
    search,
    paymentStatus,
    orderStatus,
    paymentMethod,
    from,
    to,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  const parsedPaymentStatus = parseEnumQuery(
    paymentStatus,
    ["pending", "paid", "failed", "refunded"],
    "Payment status",
  );

  const parsedOrderStatus = parseEnumQuery(
    orderStatus,
    ["pending", "paid", "failed", "cancelled", "refunded"],
    "Order status",
  );

  const parsedPaymentMethod = parseEnumQuery(
    paymentMethod,
    ["razorpay"],
    "Payment method",
  );

  if (parsedPaymentStatus !== undefined) {
    filter.paymentStatus = parsedPaymentStatus;
  }

  if (parsedOrderStatus !== undefined) {
    filter.orderStatus = parsedOrderStatus;
  }

  if (parsedPaymentMethod !== undefined) {
    filter.paymentMethod = parsedPaymentMethod;
  }

  /*
   * Order document me student ka name/email direct nahi hai.
   * Isliye pehle matching student IDs fetch karenge.
   */
  if (search?.trim()) {
    const searchText = search.trim();
    const escapedSearchText = escapeRegex(searchText);

    const matchingStudents = await User.find({
      role: "student",
      $or: [
        {
          fullName: {
            $regex: escapedSearchText,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearchText,
            $options: "i",
          },
        },
      ],
    })
      .select("_id")
      .lean();

    const studentIds = matchingStudents.map((student) => student._id);

    const searchConditions = [
      {
        student: {
          $in: studentIds,
        },
      },
    ];

    if (mongoose.Types.ObjectId.isValid(searchText)) {
      searchConditions.push({
        _id: searchText,
      });
    }

    filter.$or = searchConditions;
  }

  /*
   * Reusable date-range helper.
   */
  const paidAtRange = parseDateRange({
    from,
    to,
    fieldName: "Paid at",
  });

  if (paidAtRange) {
    filter.paidAt = paidAtRange;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: ["createdAt", "updatedAt", "paidAt", "totalAmount"],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [orders, totalRecords] = await Promise.all([
    Order.find(filter)
      .select(
        `
        student
        courses
        subtotal
        discountAmount
        totalAmount
        coupon
        orderStatus
        paymentStatus
        paymentMethod
        razorpayOrderId
        razorpayPaymentId
        paidAt
        createdAt
        updatedAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "courses.course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "coupon",
        select: "code discountType discountValue",
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
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      paymentStatus: parsedPaymentStatus ?? null,
      orderStatus: parsedOrderStatus ?? null,
      paymentMethod: parsedPaymentMethod ?? null,
      from: from || null,
      to: to || null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getOrderById(orderId) {
  validateObjectId(orderId, "order ID");

  const order = await Order.findById(orderId)
    .populate({
      path: "student",
      select: `
        fullName
        email
        avatarUrl
        role
        status
        isActive
        isEmailVerified
        createdAt
      `,
    })
    .populate({
      path: "courses.course",
      select: `
        title
        slug
        thumbnailUrl
        level
        language
        status
        isPublished
        isActive
      `,
    })
    .populate({
      path: "courses.instructor",
      select: `
        fullName
        email
        avatarUrl
        status
        isActive
      `,
    })
    .populate({
      path: "coupon",
      select: `
        code
        description
        discountType
        discountValue
        minimumCartAmount
        maxDiscountAmount
        usageLimit
        usageCount
        perUserLimit
        startsAt
        expiresAt
        isActive
      `,
    })
    .lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return {
    ...order,

    courseCount: order.courses.length,

    isPaid: order.orderStatus === "paid" && order.paymentStatus === "paid",

    payment: {
      method: order.paymentMethod,
      status: order.paymentStatus,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paidAt: order.paidAt,
    },

    pricing: {
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
    },
  };
}

export async function getStudents(query = {}) {
  const {
    search,
    status,
    isActive,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    role: "student",
  };

  const parsedStatus = parseEnumQuery(
    status,
    ["active", "inactive", "suspended"],
    "Student status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedIsActive = parseBooleanQuery(isActive, "isActive");

  if (parsedIsActive !== undefined) {
    filter.isActive = parsedIsActive;
  }

  const searchFilter = buildSearchFilter(search, ["fullName", "email"]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: ["createdAt", "fullName", "lastLoginAt"],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [students, totalRecords] = await Promise.all([
    User.find(filter)
      .select(
        `
          fullName
          email
          avatarUrl
          role
          status
          isActive
          isEmailVerified
          lastLoginAt
          createdAt
          updatedAt
        `,
      )
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    students,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      status: parsedStatus ?? null,
      isActive: parsedIsActive ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}
export async function getStudentById(studentId) {
  validateObjectId(studentId, "student ID");

  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const RECENT_LIMIT = 10;

  const student = await User.findOne({
    _id: studentObjectId,
    role: "student",
  })
    .select(
      `
      fullName
      email
      avatarUrl
      role
      status
      isActive
      isEmailVerified
      lastLoginAt
      createdAt
      updatedAt
    `,
    )
    .lean();

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const [enrollments, orders, enrollmentStats, orderStats] = await Promise.all([
    Enrollment.find({
      student: studentObjectId,
    })
      .select(
        `
        course
        enrolledAt
        expiresAt
        status
        progressPercentage
        completedLecturesCount
        lastWatchedLecture
        lastWatchedAt
        createdAt
      `,
      )
      .populate({
        path: "course",
        select: `
          title
          slug
          thumbnailUrl
          instructor
          totalLectures
          totalDurationInSeconds
          averageRating
          isPublished
          isActive
        `,
        populate: {
          path: "instructor",
          select: "fullName avatarUrl",
        },
      })
      .populate({
        path: "lastWatchedLecture",
        select: "title type durationInSeconds module order",
      })
      .sort({
        createdAt: -1,
      })
      .limit(RECENT_LIMIT)
      .lean(),

    Order.find({
      student: studentObjectId,
    })
      .select(
        `
        courses
        subtotal
        discountAmount
        totalAmount
        coupon
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
        path: "courses.course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "coupon",
        select: "code",
      })
      .sort({
        createdAt: -1,
      })
      .limit(RECENT_LIMIT)
      .lean(),

    Enrollment.aggregate([
      {
        $match: {
          student: studentObjectId,
        },
      },
      {
        $group: {
          _id: null,

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

          completedCourses: {
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

          averageProgress: {
            $avg: "$progressPercentage",
          },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          student: studentObjectId,
          orderStatus: "paid",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,

          totalPaidOrders: {
            $sum: 1,
          },

          totalSpent: {
            $sum: "$totalAmount",
          },

          totalDiscountReceived: {
            $sum: "$discountAmount",
          },
        },
      },
    ]),
  ]);

  const enrollmentSummary = enrollmentStats[0] ?? {
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedCourses: 0,
    averageProgress: 0,
  };

  const orderSummary = orderStats[0] ?? {
    totalPaidOrders: 0,
    totalSpent: 0,
    totalDiscountReceived: 0,
  };

  return {
    student,

    summary: {
      totalEnrollments: enrollmentSummary.totalEnrollments ?? 0,

      activeEnrollments: enrollmentSummary.activeEnrollments ?? 0,

      completedCourses: enrollmentSummary.completedCourses ?? 0,

      averageProgress: Number(
        (enrollmentSummary.averageProgress ?? 0).toFixed(2),
      ),

      totalPaidOrders: orderSummary.totalPaidOrders ?? 0,

      totalSpent: orderSummary.totalSpent ?? 0,

      totalDiscountReceived: orderSummary.totalDiscountReceived ?? 0,
    },

    recentEnrollments: enrollments,

    recentOrders: orders,
  };
}

export async function updateStudentStatus({ studentId, status }) {
  validateObjectId(studentId, "student ID");

  const parsedStatus = parseEnumQuery(
    status,
    ["active", "inactive", "suspended"],
    "Student status",
  );

  const student = await User.findOne({
    _id: studentId,
    role: "student",
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (student.status === parsedStatus) {
    return {
      student,

      before: {
        status: student.status,
        isActive: student.isActive,
      },

      after: {
        status: student.status,
        isActive: student.isActive,
      },

      changed: false,

      message: `Student is already ${parsedStatus}`,
    };
  }

  /*
   * Update se pehle ki state.
   */
  const before = {
    status: student.status,
    isActive: student.isActive,
  };

  /*
   * New state apply karo.
   */
  student.status = parsedStatus;
  student.isActive = parsedStatus === "active";

  /*
   * Sirf ek baar save hoga.
   */
  await student.save();

  /*
   * Update ke baad ki state.
   */
  const after = {
    status: student.status,
    isActive: student.isActive,
  };

  return {
    student,
    before,
    after,
    changed: true,
    message: `Student status updated to ${parsedStatus}`,
  };
}

export async function getCourses(query = {}) {
  const {
    search,
    category,
    instructor,
    status,
    isPublished,
    isActive,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  const searchFilter = buildSearchFilter(search, ["title", "subtitle", "slug"]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  if (category) {
    validateObjectId(category, "category ID");
    filter.category = category;
  }

  if (instructor) {
    validateObjectId(instructor, "instructor ID");
    filter.instructor = instructor;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Course status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedIsPublished = parseBooleanQuery(isPublished, "isPublished");

  const parsedIsActive = parseBooleanQuery(isActive, "isActive");

  if (parsedIsPublished !== undefined) {
    filter.isPublished = parsedIsPublished;
  }

  if (parsedIsActive !== undefined) {
    filter.isActive = parsedIsActive;
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
      "title",
      "price",
      "discountPrice",
      "averageRating",
      "enrolledStudentsCount",
      "wishlistCount",
      "totalReviews",
    ],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [courses, totalRecords] = await Promise.all([
    Course.find(filter)
      .select(
        `
        title
        slug
        subtitle
        thumbnailUrl
        category
        instructor
        level
        language
        price
        discountPrice
        status
        isPublished
        publishedAt
        totalModules
        totalLectures
        totalDurationInSeconds
        enrolledStudentsCount
        wishlistCount
        averageRating
        totalRatings
        totalReviews
        isActive
        createdAt
        updatedAt
      `,
      )
      .populate({
        path: "instructor",
        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "category",
        select: "name slug isActive",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Course.countDocuments(filter),
  ]);

  return {
    courses,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      category: category || null,
      instructor: instructor || null,
      status: parsedStatus ?? null,
      isPublished: parsedIsPublished ?? null,
      isActive: parsedIsActive ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getCourseById(courseId) {
  validateObjectId(courseId, "course ID");

  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const RECENT_LIMIT = 5;

  const course = await Course.findById(courseObjectId)
    .populate({
      path: "instructor",
      select: `
        fullName
        email
        avatarUrl
        status
        isActive
        lastLoginAt
        createdAt
      `,
    })
    .populate({
      path: "category",
      select: `
        name
        slug
        description
        isActive
      `,
    })
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const [
    modules,
    lectures,
    enrollmentStats,
    reviewStats,
    revenueStats,
    recentEnrollments,
    recentReviews,
  ] = await Promise.all([
    CourseModule.find({
      course: courseObjectId,
    })
      .select(
        `
        title
        description
        order
        totalLectures
        totalDurationInSeconds
        isPublished
        isActive
        createdAt
        updatedAt
      `,
      )
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean(),

    Lecture.find({
      course: courseObjectId,
    })
      .select(
        `
        title
        description
        module
        type
        order
        durationInSeconds
        isPreview
        isPublished
        isActive
        createdAt
        updatedAt
      `,
      )
      .sort({
        module: 1,
        order: 1,
        createdAt: 1,
      })
      .lean(),

    Enrollment.aggregate([
      {
        $match: {
          course: courseObjectId,
        },
      },
      {
        $group: {
          _id: null,

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

    CourseReview.aggregate([
      {
        $match: {
          course: courseObjectId,
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
              $cond: [
                {
                  $eq: ["$rating", 1],
                },
                1,
                0,
              ],
            },
          },

          twoStars: {
            $sum: {
              $cond: [
                {
                  $eq: ["$rating", 2],
                },
                1,
                0,
              ],
            },
          },

          threeStars: {
            $sum: {
              $cond: [
                {
                  $eq: ["$rating", 3],
                },
                1,
                0,
              ],
            },
          },

          fourStars: {
            $sum: {
              $cond: [
                {
                  $eq: ["$rating", 4],
                },
                1,
                0,
              ],
            },
          },

          fiveStars: {
            $sum: {
              $cond: [
                {
                  $eq: ["$rating", 5],
                },
                1,
                0,
              ],
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
          "courses.course": courseObjectId,
        },
      },
      {
        $unwind: "$courses",
      },
      {
        $match: {
          "courses.course": courseObjectId,
        },
      },
      {
        $group: {
          _id: null,

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
    ]),

    Enrollment.find({
      course: courseObjectId,
    })
      .select(
        `
        student
        status
        progressPercentage
        completedLecturesCount
        enrolledAt
        lastWatchedAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl status isActive",
      })
      .sort({
        enrolledAt: -1,
      })
      .limit(RECENT_LIMIT)
      .lean(),

    CourseReview.find({
      course: courseObjectId,
      isPublished: true,
    })
      .select(
        `
        student
        rating
        title
        comment
        isEdited
        createdAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName avatarUrl",
      })
      .sort({
        createdAt: -1,
      })
      .limit(RECENT_LIMIT)
      .lean(),
  ]);

  const lecturesByModule = new Map();

  for (const lecture of lectures) {
    const moduleId = lecture.module?.toString();

    if (!moduleId) {
      continue;
    }

    if (!lecturesByModule.has(moduleId)) {
      lecturesByModule.set(moduleId, []);
    }

    lecturesByModule.get(moduleId).push(lecture);
  }

  const curriculum = modules.map((module) => ({
    ...module,

    lectures: lecturesByModule.get(module._id.toString()) ?? [],
  }));

  const enrollmentSummary = enrollmentStats[0] ?? {
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    cancelledEnrollments: 0,
    expiredEnrollments: 0,
    averageProgress: 0,
  };

  const reviewSummary = reviewStats[0] ?? {
    totalReviews: 0,
    averageRating: 0,
    oneStar: 0,
    twoStars: 0,
    threeStars: 0,
    fourStars: 0,
    fiveStars: 0,
  };

  const revenueSummary = revenueStats[0] ?? {
    totalSales: 0,
    totalRevenue: 0,
    totalOriginalValue: 0,
  };

  return {
    course,

    summary: {
      totalModules: modules.length,

      totalLectures: lectures.length,

      totalEnrollments: enrollmentSummary.totalEnrollments ?? 0,

      activeEnrollments: enrollmentSummary.activeEnrollments ?? 0,

      completedEnrollments: enrollmentSummary.completedEnrollments ?? 0,

      cancelledEnrollments: enrollmentSummary.cancelledEnrollments ?? 0,

      expiredEnrollments: enrollmentSummary.expiredEnrollments ?? 0,

      averageProgress: Number(
        (enrollmentSummary.averageProgress ?? 0).toFixed(2),
      ),

      totalSales: revenueSummary.totalSales ?? 0,

      totalRevenue: revenueSummary.totalRevenue ?? 0,

      totalOriginalValue: revenueSummary.totalOriginalValue ?? 0,

      averageRating: Number((reviewSummary.averageRating ?? 0).toFixed(2)),

      totalReviews: reviewSummary.totalReviews ?? 0,

      ratingDistribution: {
        oneStar: reviewSummary.oneStar ?? 0,

        twoStars: reviewSummary.twoStars ?? 0,

        threeStars: reviewSummary.threeStars ?? 0,

        fourStars: reviewSummary.fourStars ?? 0,

        fiveStars: reviewSummary.fiveStars ?? 0,
      },
    },

    curriculum,

    recentEnrollments,

    recentReviews,
  };
}

export async function updateCourseStatus({ courseId, status }) {
  validateObjectId(courseId, "course ID");

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Course status",
  );

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.status === parsedStatus) {
    return {
      course,
      before: {
        status: course.status,
        isPublished: course.isPublished,
        isActive: course.isActive,
        publishedAt: course.publishedAt,
      },
      after: {
        status: course.status,
        isPublished: course.isPublished,
        isActive: course.isActive,
        publishedAt: course.publishedAt,
      },
      changed: false,
      message: `Course is already ${parsedStatus}`,
    };
  }

  const before = {
    status: course.status,
    isPublished: course.isPublished,
    isActive: course.isActive,
    publishedAt: course.publishedAt,
  };

  if (parsedStatus === "published") {
    if (!course.title?.trim()) {
      throw new ApiError(400, "Course title is required before publishing");
    }

    if (!course.description?.trim()) {
      throw new ApiError(
        400,
        "Course description is required before publishing",
      );
    }

    if (!course.thumbnailUrl) {
      throw new ApiError(400, "Course thumbnail is required before publishing");
    }

    if (!course.category) {
      throw new ApiError(400, "Course category is required before publishing");
    }

    if (!course.instructor) {
      throw new ApiError(
        400,
        "Course instructor is required before publishing",
      );
    }

    if ((course.totalModules ?? 0) < 1) {
      throw new ApiError(
        400,
        "At least one module is required before publishing",
      );
    }

    if ((course.totalLectures ?? 0) < 1) {
      throw new ApiError(
        400,
        "At least one lecture is required before publishing",
      );
    }

    course.status = "published";
    course.isPublished = true;
    course.isActive = true;
    course.publishedAt = course.publishedAt ?? new Date();
  }

  if (parsedStatus === "draft") {
    course.status = "draft";
    course.isPublished = false;
    course.isActive = true;
    course.publishedAt = null;
  }

  if (parsedStatus === "archived") {
    course.status = "archived";
    course.isPublished = false;
    course.isActive = false;
    course.publishedAt = null;
  }

  await course.save();

  const after = {
    status: course.status,
    isPublished: course.isPublished,
    isActive: course.isActive,
    publishedAt: course.publishedAt,
  };

  return {
    course,
    before,
    after,
    changed: true,
    message: `Course status updated to ${parsedStatus}`,
  };
}

export async function deleteCourse(courseId) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const before = {
    status: course.status,
    isPublished: course.isPublished,
    isActive: course.isActive,
    publishedAt: course.publishedAt,
  };

  if (
    course.status === "archived" &&
    course.isActive === false &&
    course.isPublished === false
  ) {
    return {
      course,
      before,
      after: before,
      changed: false,
      message: "Course is already archived",
    };
  }

  course.status = "archived";
  course.isPublished = false;
  course.isActive = false;
  course.publishedAt = null;

  await course.save();

  const after = {
    status: course.status,
    isPublished: course.isPublished,
    isActive: course.isActive,
    publishedAt: course.publishedAt,
  };

  return {
    course,
    before,
    after,
    changed: true,
    message: "Course archived successfully",
  };
}

export async function restoreCourse(courseId) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const before = {
    status: course.status,
    isPublished: course.isPublished,
    isActive: course.isActive,
    publishedAt: course.publishedAt,
  };

  if (
    course.status === "draft" &&
    course.isActive === true &&
    course.isPublished === false
  ) {
    return {
      course,
      before,
      after: before,
      changed: false,
      message: "Course is already restored",
    };
  }

  if (course.status === "published") {
    throw new ApiError(400, "Published course does not need to be restored");
  }

  course.status = "draft";
  course.isPublished = false;
  course.isActive = true;
  course.publishedAt = null;

  await course.save();

  const after = {
    status: course.status,
    isPublished: course.isPublished,
    isActive: course.isActive,
    publishedAt: course.publishedAt,
  };

  return {
    course,
    before,
    after,
    changed: true,
    message: "Course restored successfully",
  };
}

export async function getReviews(query = {}) {
  const {
    search,
    rating,
    isPublished,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  const parsedRating = parseNumberQuery(rating, {
    fieldName: "Rating",
    min: 1,
    max: 5,
    integer: true,
  });

  if (parsedRating !== undefined) {
    filter.rating = parsedRating;
  }

  const parsedIsPublished = parseBooleanQuery(isPublished, "isPublished");

  if (parsedIsPublished !== undefined) {
    filter.isPublished = parsedIsPublished;
  }

  const searchFilter = buildSearchFilter(search, ["title", "comment"]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: ["createdAt", "updatedAt", "rating"],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [reviews, totalRecords] = await Promise.all([
    CourseReview.find(filter)
      .select(
        `
        student
        course
        rating
        title
        comment
        isEdited
        isPublished
        createdAt
        updatedAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "course",
        select:
          "title slug thumbnailUrl instructor status isPublished isActive",
        populate: {
          path: "instructor",
          select: "fullName avatarUrl",
        },
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    CourseReview.countDocuments(filter),
  ]);

  return {
    reviews,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      rating: parsedRating ?? null,
      isPublished: parsedIsPublished ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function updateReviewStatus({ reviewId, isPublished }) {
  validateObjectId(reviewId, "review ID");

  validateBooleanBody(isPublished, "isPublished");

  const review = await CourseReview.findById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const before = {
    isPublished: review.isPublished,
  };

  if (review.isPublished === isPublished) {
    return {
      review,
      before,
      after: before,
      changed: false,
      message: `Review is already ${isPublished ? "published" : "hidden"}`,
    };
  }

  review.isPublished = isPublished;

  await review.save();

  await recalculateCourseRating(review.course);

  const after = {
    isPublished: review.isPublished,
  };

  return {
    review,
    before,
    after,
    changed: true,
    message: `Review ${isPublished ? "published" : "hidden"} successfully`,
  };
}
