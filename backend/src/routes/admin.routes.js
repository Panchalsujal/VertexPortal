import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import {
  getDashboardSummaryController,
  getOrdersController,
  getOrderByIdController,
  getStudentsController,
  getStudentByIdController,
  updateStudentStatusController,
  getCoursesController,
  getCourseByIdController,
  updateCourseStatusController,
  deleteCourseController,
  restoreCourseController,
  getReviewsController,
  updateReviewStatusController,
} from "../controllers/admin.controller.js";

const router = Router();

// Middleware to skip route if parameter is not a 24-character hex Mongo ObjectId
const requireObjectId = (paramName) => (req, res, next) => {
  const val = req.params[paramName];
  if (!val || !/^[0-9a-fA-F]{24}$/.test(val)) {
    return next("route");
  }
  next();
};

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  getDashboardSummaryController,
);

// Orders Routes
router.get(
  "/orders",
  authMiddleware,
  authorizeRoles("admin"),
  getOrdersController,
);

router.get(
  "/orders/:orderId",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("orderId"),
  getOrderByIdController,
);

// Students Routes
router.get(
  "/students",
  authMiddleware,
  authorizeRoles("admin"),
  getStudentsController,
);

router.get(
  "/students/:studentId",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("studentId"),
  getStudentByIdController,
);

router.patch(
  "/students/:studentId/status",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("studentId"),
  updateStudentStatusController,
);

// Courses Routes
router.get(
  "/courses",
  authMiddleware,
  authorizeRoles("admin"),
  getCoursesController,
);

router.get(
  "/courses/:courseId",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("courseId"),
  getCourseByIdController,
);

router.patch(
  "/courses/:courseId/status",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("courseId"),
  updateCourseStatusController,
);

router.delete(
  "/courses/:courseId",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("courseId"),
  deleteCourseController,
);

router.patch(
  "/courses/:courseId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("courseId"),
  restoreCourseController,
);

// Reviews Routes
router.get(
  "/reviews",
  authMiddleware,
  authorizeRoles("admin"),
  getReviewsController,
);

router.patch(
  "/reviews/:reviewId/status",
  authMiddleware,
  authorizeRoles("admin"),
  requireObjectId("reviewId"),
  updateReviewStatusController,
);

export default router;
