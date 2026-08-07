import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getStudentAnalytics,
  getOrderAnalytics,
  getCourseAnalytics,
  getReviewAnalytics,
  getLiveClassAnalytics,
  getCouponAnalytics,
} from "../service/adminAnalytics.service.js";

export const getAnalyticsOverviewController = asyncHandler(async (req, res) => {
  const analytics = await getAnalyticsOverview();

  return res.status(200).json({
    success: true,
    message: "Analytics overview fetched successfully",
    analytics,
  });
});

export const getRevenueAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getRevenueAnalytics(req.query);

  return res.status(200).json({
    success: true,
    message: "Revenue analytics fetched successfully",
    analytics,
  });
});

export const getStudentAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getStudentAnalytics(req.query);

  return res.status(200).json({
    success: true,
    message: "Student analytics fetched successfully",
    analytics,
  });
});

export const getOrderAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getOrderAnalytics(req.query);

  return res.status(200).json({
    success: true,
    message: "Order analytics fetched successfully",
    analytics,
  });
});

export const getCourseAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getCourseAnalytics(req.query);

  return res.status(200).json({
    success: true,
    message: "Course analytics fetched successfully",
    analytics,
  });
});

export const getReviewAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getReviewAnalytics(req.query);

  return res.status(200).json({
    success: true,
    message: "Review analytics fetched successfully",
    analytics,
  });
});

export const getLiveClassAnalyticsController = asyncHandler(
  async (req, res) => {
    const analytics = await getLiveClassAnalytics(req.query);

    return res.status(200).json({
      success: true,
      message: "Live class analytics fetched successfully",
      analytics,
    });
  },
);

export const getCouponAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await getCouponAnalytics(req.query);

  return res.status(200).json({
    success: true,
    message: "Coupon analytics fetched successfully",
    analytics,
  });
});
