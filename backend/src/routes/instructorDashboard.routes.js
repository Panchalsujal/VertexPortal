// src/routes/instructorDashboard.routes.js

import { Router } from "express";

import {
  getInstructorDashboardOverviewController,
  getInstructorCoursePerformanceController,
  getInstructorRevenueAnalyticsController,
  getInstructorLiveClassOverviewController,
} from "../controllers/instructorDashboard.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

/*
 * ============================================
 * ALL INSTRUCTOR DASHBOARD ROUTES
 * ============================================
 */
router.use(authMiddleware, authorizeRoles("instructor"));

/*
 * GET /api/instructor/dashboard
 */
router.get("/", getInstructorDashboardOverviewController);

/*
 * GET /api/instructor/dashboard/courses
 */
router.get("/courses", getInstructorCoursePerformanceController);

/*
 * GET /api/instructor/dashboard/revenue?days=30
 */
router.get("/revenue", getInstructorRevenueAnalyticsController);

/*
 * GET /api/instructor/dashboard/live-classes
 */
router.get("/live-classes", getInstructorLiveClassOverviewController);

export default router;
