import mongoose from "mongoose";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import LiveClass from "../models/liveClass.model.js";
import Discussion from "../models/discussion.model.js";
import Order from "../models/order.model.js";
import Certificate from "../models/certificate.model.js";
import { ApiError } from "../utils/ApiError.js";

const DASHBOARD_PERIODS = ["7d", "30d", "90d", "1y", "all"];

/*
 * Period ke according start date.
 */
function getPeriodStartDate(period) {
  const now = new Date();

  if (period === "all") {
    return null;
  }

  if (period === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (period === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (period === "90d") {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  if (period === "1y") {
    const startDate = new Date(now);
    startDate.setFullYear(startDate.getFullYear() - 1);
    return startDate;
  }

  return null;
}

/*
 * Growth percentage calculate.
 */
function calculateGrowth({ current, previous }) {
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);

  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Number(
    (((currentValue - previousValue) / previousValue) * 100).toFixed(2),
  );
}

/*
 * Previous period range calculate.
 */
function getPreviousPeriodRange({ startDate, endDate }) {
  if (!startDate) {
    return null;
  }

  const durationMs = endDate.getTime() - startDate.getTime();

  return {
    previousStartDate: new Date(startDate.getTime() - durationMs),
    previousEndDate: new Date(startDate.getTime()),
  };
}

/*
 * Admin dashboard aggregated stats.
 */
export async function getAdminDashboard({ period = "30d" } = {}) {
  if (!DASHBOARD_PERIODS.includes(period)) {
    throw new ApiError(400, "Invalid dashboard period");
  }

  const endDate = new Date();
  const startDate = getPeriodStartDate(period);

  const currentPeriodFilter = startDate
    ? {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      }
    : {};

  const previousPeriod = getPreviousPeriodRange({
    startDate,
    endDate,
  });

  const previousPeriodFilter = previousPeriod
    ? {
        createdAt: {
          $gte: previousPeriod.previousStartDate,
          $lt: previousPeriod.previousEndDate,
        },
      }
    : null;

  /*
   * Main dashboard counters.
   */
  const [
    totalUsers,
    totalStudents,
    totalInstructors,
    totalAdmins,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    verifiedUsers,
    unverifiedUsers,

    totalCourses,
    publishedCourses,
    draftCourses,

    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    cancelledEnrollments,
    expiredEnrollments,

    totalLiveClasses,
    scheduledLiveClasses,
    liveNowClasses,
    completedLiveClasses,
    cancelledLiveClasses,

    totalDiscussions,
    openDiscussions,
    answeredDiscussions,
    resolvedDiscussions,

    totalCertificates,
    totalOrders,
    paidOrders,
  ] = await Promise.all([
    /* Users */
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "instructor" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ status: "active", isActive: true }),
    User.countDocuments({ status: "inactive" }),
    User.countDocuments({ status: "suspended" }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ isEmailVerified: { $ne: true } }),

    /* Courses */
    Course.countDocuments(),
    Course.countDocuments({ status: "published", isPublished: true, isActive: true }),
    Course.countDocuments({ status: "draft" }),

    /* Enrollments */
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: "active" }),
    Enrollment.countDocuments({ status: "completed" }),
    Enrollment.countDocuments({ status: "cancelled" }),
    Enrollment.countDocuments({ status: "expired" }),

    /* Live Classes */
    LiveClass.countDocuments(),
    LiveClass.countDocuments({ status: "scheduled", isActive: true }),
    LiveClass.countDocuments({ status: "live", isActive: true }),
    LiveClass.countDocuments({ status: "completed" }),
    LiveClass.countDocuments({ status: "cancelled" }),

    /* Discussions */
    Discussion.countDocuments({ isActive: true }),
    Discussion.countDocuments({ isActive: true, status: "open" }),
    Discussion.countDocuments({ isActive: true, status: "answered" }),
    Discussion.countDocuments({ isActive: true, status: "resolved" }),

    /* Certificates & Orders */
    Certificate.countDocuments({ isRevoked: { $ne: true } }),
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: "paid" }),
  ]);

  /*
   * Revenue Calculations
   */
  const [revenueAgg, currentPeriodRevenueAgg, previousPeriodRevenueAgg] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", ...(startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {}) } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]),
    previousPeriodFilter
      ? Order.aggregate([
          { $match: { paymentStatus: "paid", ...previousPeriodFilter } },
          { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
        ])
      : Promise.resolve([]),
  ]);

  const totalGrossRevenue = revenueAgg[0]?.totalRevenue || 0;
  const currentPeriodRevenue = currentPeriodRevenueAgg[0]?.totalRevenue || 0;
  const previousPeriodRevenue = previousPeriodRevenueAgg[0]?.totalRevenue || 0;
  const revenueGrowth = previousPeriodFilter
    ? calculateGrowth({ current: currentPeriodRevenue, previous: previousPeriodRevenue })
    : null;

  /*
   * Current period counters.
   */
  const [
    newUsers,
    newStudents,
    newInstructors,
    newCourses,
    newEnrollments,
    newDiscussions,
    newLiveClasses,
  ] = await Promise.all([
    User.countDocuments(currentPeriodFilter),
    User.countDocuments({ role: "student", ...currentPeriodFilter }),
    User.countDocuments({ role: "instructor", ...currentPeriodFilter }),
    Course.countDocuments(currentPeriodFilter),
    Enrollment.countDocuments(currentPeriodFilter),
    Discussion.countDocuments({ isActive: true, ...currentPeriodFilter }),
    LiveClass.countDocuments(currentPeriodFilter),
  ]);

  /*
   * Previous period stats.
   */
  let previousStats = {
    users: 0,
    students: 0,
    instructors: 0,
    courses: 0,
    enrollments: 0,
    discussions: 0,
    liveClasses: 0,
  };

  if (previousPeriodFilter) {
    const [
      prevUsers,
      prevStudents,
      prevInstructors,
      prevCourses,
      prevEnrollments,
      prevDiscussions,
      prevLiveClasses,
    ] = await Promise.all([
      User.countDocuments(previousPeriodFilter),
      User.countDocuments({ role: "student", ...previousPeriodFilter }),
      User.countDocuments({ role: "instructor", ...previousPeriodFilter }),
      Course.countDocuments(previousPeriodFilter),
      Enrollment.countDocuments(previousPeriodFilter),
      Discussion.countDocuments({ isActive: true, ...previousPeriodFilter }),
      LiveClass.countDocuments(previousPeriodFilter),
    ]);

    previousStats = {
      users: prevUsers,
      students: prevStudents,
      instructors: prevInstructors,
      courses: prevCourses,
      enrollments: prevEnrollments,
      discussions: prevDiscussions,
      liveClasses: prevLiveClasses,
    };
  }

  /*
   * Recent records.
   */
  const [
    recentUsers,
    recentCourses,
    recentDiscussions,
    upcomingLiveClasses,
  ] = await Promise.all([
    User.find()
      .select("fullName email role status avatarUrl createdAt isEmailVerified")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    Course.find()
      .select("title slug status isPublished price averageRating enrolledStudentsCount thumbnailUrl createdAt")
      .populate({ path: "instructor", select: "fullName avatarUrl" })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    Discussion.find({ isActive: true })
      .select("title content status viewCount lastActivityAt createdAt")
      .populate({ path: "course", select: "title slug" })
      .populate({ path: "author", select: "fullName avatarUrl role" })
      .sort({ lastActivityAt: -1 })
      .limit(10)
      .lean(),

    LiveClass.find({ status: "scheduled", isActive: true })
      .select("title scheduledAt durationInMinutes meetingUrl course instructor")
      .populate({ path: "course", select: "title slug" })
      .populate({ path: "instructor", select: "fullName" })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean(),
  ]);

  /*
   * Top courses by enrollment.
   */
  let topCourses = await Enrollment.aggregate([
    {
      $group: {
        _id: "$course",
        enrollmentCount: { $sum: 1 },
        completedCount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        activeCount: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
      },
    },
    { $sort: { enrollmentCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        courseId: "$_id",
        title: "$course.title",
        slug: "$course.slug",
        thumbnailUrl: "$course.thumbnailUrl",
        price: "$course.price",
        averageRating: "$course.averageRating",
        enrollmentCount: 1,
        completedCount: 1,
        activeCount: 1,
      },
    },
  ]);

  // If no enrollment aggregations yet, populate from published courses
  if (!topCourses || topCourses.length === 0) {
    const published = await Course.find({ isPublished: true })
      .sort({ enrolledStudentsCount: -1, createdAt: -1 })
      .limit(10)
      .lean();

    topCourses = published.map(c => ({
      courseId: c._id,
      title: c.title,
      slug: c.slug,
      thumbnailUrl: c.thumbnailUrl,
      price: c.price,
      averageRating: c.averageRating || 0,
      enrollmentCount: c.enrolledStudentsCount || 0,
      completedCount: 0,
      activeCount: c.enrolledStudentsCount || 0,
    }));
  }

  /*
   * User role distribution.
   */
  const userRoleDistribution = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
    { $project: { _id: 0, role: "$_id", count: 1 } },
    { $sort: { count: -1 } },
  ]);

  /*
   * Course status distribution.
   */
  const courseStatusDistribution = await Course.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);

  /*
   * Enrollment status distribution.
   */
  const enrollmentStatusDistribution = await Enrollment.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);

  return {
    period,
    range: { startDate, endDate },
    overview: {
      users: {
        total: totalUsers,
        students: totalStudents,
        instructors: totalInstructors,
        admins: totalAdmins,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        cancelled: cancelledEnrollments,
        expired: expiredEnrollments,
      },
      finance: {
        totalRevenue: totalGrossRevenue,
        paidOrders: paidOrders,
        totalOrders: totalOrders,
      },
      certificates: {
        total: totalCertificates,
      },
      liveClasses: {
        total: totalLiveClasses,
        scheduled: scheduledLiveClasses,
        live: liveNowClasses,
        completed: completedLiveClasses,
        cancelled: cancelledLiveClasses,
      },
      discussions: {
        total: totalDiscussions,
        open: openDiscussions,
        answered: answeredDiscussions,
        resolved: resolvedDiscussions,
      },
    },
    systemHealth: {
      apiServer: "Online",
      database: mongoose.connection.readyState === 1 ? "Online" : "Connecting",
      liveClasses: "Online",
      emailDispatch: "Online",
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    periodStats: {
      users: {
        current: newUsers,
        previous: previousStats.users,
        growthPercentage: previousPeriodFilter
          ? calculateGrowth({ current: newUsers, previous: previousStats.users })
          : null,
      },
      students: {
        current: newStudents,
        previous: previousStats.students,
        growthPercentage: previousPeriodFilter
          ? calculateGrowth({ current: newStudents, previous: previousStats.students })
          : null,
      },
      instructors: {
        current: newInstructors,
        previous: previousStats.instructors,
        growthPercentage: previousPeriodFilter
          ? calculateGrowth({ current: newInstructors, previous: previousStats.instructors })
          : null,
      },
      courses: {
        current: newCourses,
        previous: previousStats.courses,
        growthPercentage: previousPeriodFilter
          ? calculateGrowth({ current: newCourses, previous: previousStats.courses })
          : null,
      },
      enrollments: {
        current: newEnrollments,
        previous: previousStats.enrollments,
        growthPercentage: previousPeriodFilter
          ? calculateGrowth({ current: newEnrollments, previous: previousStats.enrollments })
          : null,
      },
      revenue: {
        current: currentPeriodRevenue,
        previous: previousPeriodRevenue,
        growthPercentage: revenueGrowth,
      },
      discussions: {
        current: newDiscussions,
        previous: previousStats.discussions,
        growthPercentage: previousPeriodFilter
          ? calculateGrowth({ current: newDiscussions, previous: previousStats.discussions })
          : null,
      },
      liveClasses: {
        current: newLiveClasses,
        previous: previousStats.liveClasses,
        growthPercentage: previousPeriodFilter
          ? calculateGrowth({ current: newLiveClasses, previous: previousStats.liveClasses })
          : null,
      },
    },
    distributions: {
      users: userRoleDistribution,
      courses: courseStatusDistribution,
      enrollments: enrollmentStatusDistribution,
    },
    topCourses,
    recent: {
      users: recentUsers,
      courses: recentCourses,
      discussions: recentDiscussions,
      upcomingLiveClasses,
    },
  };
}
