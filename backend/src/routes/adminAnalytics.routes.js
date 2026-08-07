import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

import {
  getAnalyticsOverviewController,
  getRevenueAnalyticsController,
  getStudentAnalyticsController,
  getOrderAnalyticsController,
  getCourseAnalyticsController,
  getReviewAnalyticsController,
  getLiveClassAnalyticsController,
  getCouponAnalyticsController,
} from "../controllers/adminAnalytics.controller.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.get("/overview", getAnalyticsOverviewController);

router.get("/revenue", getRevenueAnalyticsController);

router.get("/students", getStudentAnalyticsController);

router.get("/orders", getOrderAnalyticsController);

router.get("/courses", getCourseAnalyticsController);
router.get("/reviews", getReviewAnalyticsController);

router.get("/live-classes", getLiveClassAnalyticsController);

router.get(
  "/coupons",
  getCouponAnalyticsController,
);
export default router;
