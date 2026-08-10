import mongoose from "mongoose";

import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Order from "../models/order.model.js";
import CourseReview from "../models/courseReview.model.js";
import LiveClass from "../models/liveClass.model.js";

import { validateObjectId } from "../utils/validator.js";

import { ApiError } from "../utils/ApiError.js";

/*
 * ============================================
 * INSTRUCTOR COURSES
 * ============================================
 */
async function getInstructorCourses(instructorId) {
  validateObjectId(instructorId, "instructor ID");

  return Course.find({
    instructor: instructorId,

    isActive: true,
  })
    .select(
      `
      _id
      title
      slug
      thumbnailUrl
      status
      isPublished
      price
      discountPrice
      enrolledStudentsCount
      wishlistCount
      averageRating
      totalRatings
      totalReviews
      totalModules
      totalLectures
      totalDurationInSeconds
      createdAt
      publishedAt
    `,
    )
    .sort({
      createdAt: -1,
    })
    .lean();
}

/*
 * ============================================
 * DASHBOARD OVERVIEW
 * ============================================
 */
export async function getInstructorDashboardOverview({ instructorId }) {
  validateObjectId(instructorId, "instructor ID");

  const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

  const courses = await getInstructorCourses(instructorId);

  const courseIds = courses.map((course) => course._id);

  const totalCourses = courses.length;

  const publishedCourses = courses.filter(
    (course) => course.status === "published" && course.isPublished === true,
  ).length;

  const draftCourses = courses.filter(
    (course) => course.status === "draft",
  ).length;

  const archivedCourses = courses.filter(
    (course) => course.status === "archived",
  ).length;

  /*
   * Instructor ke koi courses hi nahi hain.
   */
  if (courseIds.length === 0) {
    return {
      overview: {
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        archivedCourses: 0,

        totalStudents: 0,
        activeStudents: 0,
        completedStudents: 0,

        totalRevenue: 0,

        averageRating: 0,
        totalReviews: 0,

        upcomingLiveClasses: 0,
      },

      recentEnrollments: [],

      upcomingLiveClasses: [],

      topCourses: [],
    };
  }

  const now = new Date();

  const [
    enrollmentStats,
    revenueStats,
    reviewStats,
    recentEnrollments,
    upcomingClasses,
  ] = await Promise.all([
    /*
     * ========================================
     * ENROLLMENTS
     * ========================================
     */
    Enrollment.aggregate([
      {
        $match: {
          course: {
            $in: courseIds,
          },
        },
      },

      {
        $group: {
          _id: "$status",

          count: {
            $sum: 1,
          },
        },
      },
    ]),

    /*
     * ========================================
     * REVENUE
     *
     * Order.courses me instructor snapshot
     * already stored hai.
     * ========================================
     */
    Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",

          orderStatus: "paid",
        },
      },

      {
        $unwind: "$courses",
      },

      {
        $match: {
          "courses.instructor": instructorObjectId,
        },
      },

      {
        $group: {
          _id: null,

          totalRevenue: {
            $sum: "$courses.finalPrice",
          },
        },
      },
    ]),

    /*
     * ========================================
     * REVIEWS
     * ========================================
     */
    CourseReview.aggregate([
      {
        $match: {
          course: {
            $in: courseIds,
          },

          isPublished: true,
        },
      },

      {
        $group: {
          _id: null,

          averageRating: {
            $avg: "$rating",
          },

          totalReviews: {
            $sum: 1,
          },
        },
      },
    ]),

    /*
     * ========================================
     * RECENT ENROLLMENTS
     * ========================================
     */
    Enrollment.find({
      course: {
        $in: courseIds,
      },

      status: {
        $in: ["active", "completed"],
      },
    })
      .populate({
        path: "student",

        select: "fullName email avatarUrl",
      })
      .populate({
        path: "course",

        select: "title slug thumbnailUrl",
      })
      .sort({
        enrolledAt: -1,
      })
      .limit(10)
      .select(
        `
          student
          course
          status
          progressPercentage
          enrolledAt
          completedAt
        `,
      )
      .lean(),

    /*
     * ========================================
     * UPCOMING LIVE CLASSES
     * ========================================
     */
    LiveClass.find({
      instructor: instructorId,

      isActive: true,

      isPublished: true,

      status: {
        $in: ["scheduled", "live"],
      },

      endsAt: {
        $gte: now,
      },
    })
      .populate({
        path: "course",

        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "module",

        select: "title order",
      })
      .populate({
        path: "lecture",

        select: "title order type",
      })
      .sort({
        startsAt: 1,
      })
      .limit(10)
      .select(
        `
          course
          module
          lecture
          title
          provider
          startsAt
          endsAt
          timezone
          durationInMinutes
          status
          recordingEnabled
        `,
      )
      .lean(),
  ]);

  /*
   * ============================================
   * ENROLLMENT COUNTS
   * ============================================
   */
  let activeStudents = 0;

  let completedStudents = 0;

  let cancelledStudents = 0;

  let expiredStudents = 0;

  for (const item of enrollmentStats) {
    if (item._id === "active") {
      activeStudents = item.count;
    }

    if (item._id === "completed") {
      completedStudents = item.count;
    }

    if (item._id === "cancelled") {
      cancelledStudents = item.count;
    }

    if (item._id === "expired") {
      expiredStudents = item.count;
    }
  }

  const totalStudents =
    activeStudents + completedStudents + cancelledStudents + expiredStudents;

  /*
   * ============================================
   * REVENUE
   * ============================================
   */
  const totalRevenue = Number(revenueStats?.[0]?.totalRevenue || 0);

  /*
   * ============================================
   * REVIEW SUMMARY
   * ============================================
   */
  const averageRating = Number(
    (reviewStats?.[0]?.averageRating || 0).toFixed(2),
  );

  const totalReviews = Number(reviewStats?.[0]?.totalReviews || 0);

  /*
   * ============================================
   * TOP COURSES
   * ============================================
   */
  const topCourses = [...courses]
    .sort((a, b) => {
      const studentDiff =
        Number(b.enrolledStudentsCount || 0) -
        Number(a.enrolledStudentsCount || 0);

      if (studentDiff !== 0) {
        return studentDiff;
      }

      return Number(b.averageRating || 0) - Number(a.averageRating || 0);
    })
    .slice(0, 5)
    .map((course) => ({
      _id: course._id,

      title: course.title,

      slug: course.slug,

      thumbnailUrl: course.thumbnailUrl,

      enrolledStudentsCount: course.enrolledStudentsCount,

      averageRating: course.averageRating,

      totalReviews: course.totalReviews,

      status: course.status,

      isPublished: course.isPublished,
    }));

  return {
    overview: {
      totalCourses,

      publishedCourses,

      draftCourses,

      archivedCourses,

      totalStudents,

      activeStudents,

      completedStudents,

      cancelledStudents,

      expiredStudents,

      totalRevenue,

      averageRating,

      totalReviews,

      upcomingLiveClasses: upcomingClasses.length,
    },

    recentEnrollments,

    upcomingLiveClasses: upcomingClasses,

    topCourses,
  };
}

/*
 * ============================================
 * COURSE PERFORMANCE
 * ============================================
 */
export async function getInstructorCoursePerformance({ instructorId }) {
  validateObjectId(instructorId, "instructor ID");

  const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

  const courses = await getInstructorCourses(instructorId);

  if (courses.length === 0) {
    return [];
  }

  const courseIds = courses.map((course) => course._id);

  /*
   * Revenue per course.
   */
  const revenueByCourse = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",

        orderStatus: "paid",
      },
    },

    {
      $unwind: "$courses",
    },

    {
      $match: {
        "courses.instructor": instructorObjectId,

        "courses.course": {
          $in: courseIds,
        },
      },
    },

    {
      $group: {
        _id: "$courses.course",

        revenue: {
          $sum: "$courses.finalPrice",
        },

        sales: {
          $sum: 1,
        },
      },
    },
  ]);

  const revenueMap = new Map(
    revenueByCourse.map((item) => [
      String(item._id),
      {
        revenue: Number(item.revenue || 0),

        sales: Number(item.sales || 0),
      },
    ]),
  );

  /*
   * Enrollment stats per course.
   */
  const enrollmentStats = await Enrollment.aggregate([
    {
      $match: {
        course: {
          $in: courseIds,
        },
      },
    },

    {
      $group: {
        _id: "$course",

        totalEnrollments: {
          $sum: 1,
        },

        activeStudents: {
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

        completedStudents: {
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
  ]);

  const enrollmentMap = new Map(
    enrollmentStats.map((item) => [String(item._id), item]),
  );

  return courses.map((course) => {
    const courseId = String(course._id);

    const revenue = revenueMap.get(courseId) || {
      revenue: 0,
      sales: 0,
    };

    const enrollment = enrollmentMap.get(courseId) || {
      totalEnrollments: 0,
      activeStudents: 0,
      completedStudents: 0,
      averageProgress: 0,
    };

    return {
      course: {
        _id: course._id,

        title: course.title,

        slug: course.slug,

        thumbnailUrl: course.thumbnailUrl,

        status: course.status,

        isPublished: course.isPublished,
      },

      students: {
        total: Number(enrollment.totalEnrollments || 0),

        active: Number(enrollment.activeStudents || 0),

        completed: Number(enrollment.completedStudents || 0),

        averageProgress: Number((enrollment.averageProgress || 0).toFixed(2)),
      },

      sales: {
        totalSales: revenue.sales,

        revenue: revenue.revenue,
      },

      reviews: {
        averageRating: Number(course.averageRating || 0),

        totalReviews: Number(course.totalReviews || 0),
      },
    };
  });
}

/*
 * ============================================
 * REVENUE ANALYTICS
 * ============================================
 *
 * Default last 30 days.
 */
export async function getInstructorRevenueAnalytics({
  instructorId,
  days = 30,
}) {
  validateObjectId(instructorId, "instructor ID");

  const parsedDays = Math.min(Math.max(Number(days) || 30, 1), 365);

  const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

  const startDate = new Date();

  startDate.setHours(0, 0, 0, 0);

  startDate.setDate(startDate.getDate() - (parsedDays - 1));

  const revenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",

        orderStatus: "paid",

        paidAt: {
          $gte: startDate,
        },
      },
    },

    {
      $unwind: "$courses",
    },

    {
      $match: {
        "courses.instructor": instructorObjectId,
      },
    },

    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",

            date: "$paidAt",
          },
        },

        revenue: {
          $sum: "$courses.finalPrice",
        },

        sales: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const revenueMap = new Map(
    revenue.map((item) => [
      item._id,
      {
        revenue: Number(item.revenue || 0),

        sales: Number(item.sales || 0),
      },
    ]),
  );

  /*
   * Missing dates ko bhi 0 ke saath return.
   */
  const timeline = [];

  for (let index = 0; index < parsedDays; index += 1) {
    const date = new Date(startDate);

    date.setDate(startDate.getDate() + index);

    const key = date.toISOString().slice(0, 10);

    const item = revenueMap.get(key) || {
      revenue: 0,
      sales: 0,
    };

    timeline.push({
      date: key,

      revenue: item.revenue,

      sales: item.sales,
    });
  }

  const totalRevenue = timeline.reduce(
    (total, item) => total + item.revenue,
    0,
  );

  const totalSales = timeline.reduce((total, item) => total + item.sales, 0);

  return {
    days: parsedDays,

    startDate,

    endDate: new Date(),

    totalRevenue: Number(totalRevenue.toFixed(2)),

    totalSales,

    timeline,
  };
}

/*
 * ============================================
 * INSTRUCTOR LIVE CLASS OVERVIEW
 * ============================================
 */
export async function getInstructorLiveClassOverview({ instructorId }) {
  validateObjectId(instructorId, "instructor ID");

  const now = new Date();

  const [upcoming, completedCount, cancelledCount, liveCount] =
    await Promise.all([
      LiveClass.find({
        instructor: instructorId,

        isActive: true,

        status: {
          $in: ["scheduled", "live"],
        },

        endsAt: {
          $gte: now,
        },
      })
        .populate({
          path: "course",

          select: "title slug thumbnailUrl",
        })
        .sort({
          startsAt: 1,
        })
        .limit(20)
        .lean(),

      LiveClass.countDocuments({
        instructor: instructorId,

        status: "completed",
      }),

      LiveClass.countDocuments({
        instructor: instructorId,

        status: "cancelled",
      }),

      LiveClass.countDocuments({
        instructor: instructorId,

        status: "live",
      }),
    ]);

  return {
    stats: {
      upcoming: upcoming.filter((item) => item.status === "scheduled").length,

      live: liveCount,

      completed: completedCount,

      cancelled: cancelledCount,
    },

    upcomingClasses: upcoming,
  };
}
