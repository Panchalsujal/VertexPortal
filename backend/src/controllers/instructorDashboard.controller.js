import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getInstructorDashboardOverview,
  getInstructorCoursePerformance,
  getInstructorRevenueAnalytics,
  getInstructorLiveClassOverview,
} from "../service/instructorDashboard.service.js";

/*
 * ============================================
 * INSTRUCTOR DASHBOARD OVERVIEW
 * ============================================
 *
 * GET /api/instructor/dashboard
 */
export const getInstructorDashboardOverviewController = asyncHandler(
  async (req, res) => {
    const result = await getInstructorDashboardOverview({
      instructorId: req.user.id,
    });

    return res.status(200).json({
      success: true,

      message: "Instructor dashboard fetched successfully",

      overview: result.overview,

      recentEnrollments: result.recentEnrollments,

      upcomingLiveClasses: result.upcomingLiveClasses,

      topCourses: result.topCourses,
    });
  },
);

/*
 * ============================================
 * COURSE PERFORMANCE
 * ============================================
 *
 * GET /api/instructor/dashboard/courses
 */
export const getInstructorCoursePerformanceController = asyncHandler(
  async (req, res) => {
    const courses = await getInstructorCoursePerformance({
      instructorId: req.user.id,
    });

    return res.status(200).json({
      success: true,

      message: "Instructor course performance fetched successfully",

      count: courses.length,

      courses,
    });
  },
);

/*
 * ============================================
 * REVENUE ANALYTICS
 * ============================================
 *
 * GET /api/instructor/dashboard/revenue?days=30
 */
export const getInstructorRevenueAnalyticsController = asyncHandler(
  async (req, res) => {
    const { days = 30 } = req.query;

    const result = await getInstructorRevenueAnalytics({
      instructorId: req.user.id,

      days,
    });

    return res.status(200).json({
      success: true,

      message: "Instructor revenue analytics fetched successfully",

      analytics: result,
    });
  },
);

/*
 * ============================================
 * LIVE CLASS OVERVIEW
 * ============================================
 *
 * GET /api/instructor/dashboard/live-classes
 */
export const getInstructorLiveClassOverviewController = asyncHandler(
  async (req, res) => {
    const result = await getInstructorLiveClassOverview({
      instructorId: req.user.id,
    });

    return res.status(200).json({
      success: true,

      message: "Instructor live class overview fetched successfully",

      stats: result.stats,

      upcomingClasses: result.upcomingClasses,
    });
  },
);
