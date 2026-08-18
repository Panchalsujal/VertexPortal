import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireElevatedSession } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { validateCsrfToken } from "../middlewares/csrf.middleware.js";
import { auditLogAction } from "../middlewares/auditLog.middleware.js";
import {
  requireActionSignature,
  generateActionSignatureController,
} from "../middlewares/actionSignature.middleware.js";
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

// ─── Shared security middleware stack for all admin routes ────────────────────
// Layer 2: Elevated session  |  Layer 4: Audit log  |  Layer 5: CSRF
const adminGuard = [
  authMiddleware,
  requireElevatedSession,
  authorizeRoles("admin"),
  validateCsrfToken,
];

// Middleware to skip route if parameter is not a 24-character hex Mongo ObjectId
const requireObjectId = (paramName) => (req, res, next) => {
  const val = req.params[paramName];
  if (!val || !/^[0-9a-fA-F]{24}$/.test(val)) {
    return next("route");
  }
  next();
};

// ─── Layer 6: Action Signature endpoint ──────────────────────────────────────
// Frontend must call this BEFORE performing any dangerous mutation.
router.post(
  "/sign-action",
  authMiddleware,
  requireElevatedSession,
  authorizeRoles("admin"),
  generateActionSignatureController
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get(
  "/dashboard",
  ...adminGuard,
  getDashboardSummaryController,
);

// ─── Orders Routes ────────────────────────────────────────────────────────────
router.get(
  "/orders",
  ...adminGuard,
  getOrdersController,
);

router.get(
  "/orders/:orderId",
  ...adminGuard,
  requireObjectId("orderId"),
  getOrderByIdController,
);

// ─── Students Routes ──────────────────────────────────────────────────────────
router.get(
  "/students",
  ...adminGuard,
  getStudentsController,
);

router.get(
  "/students/:studentId",
  ...adminGuard,
  requireObjectId("studentId"),
  getStudentByIdController,
);

router.patch(
  "/students/:studentId/status",
  ...adminGuard,
  requireObjectId("studentId"),
  auditLogAction("STUDENT_STATUS_CHANGE", "User", (req) => req.params.studentId),
  updateStudentStatusController,
);

// ─── Courses Routes ───────────────────────────────────────────────────────────
router.get(
  "/courses",
  ...adminGuard,
  getCoursesController,
);

router.get(
  "/courses/:courseId",
  ...adminGuard,
  requireObjectId("courseId"),
  getCourseByIdController,
);

router.patch(
  "/courses/:courseId/status",
  ...adminGuard,
  requireObjectId("courseId"),
  auditLogAction("COURSE_STATUS_CHANGE", "Course", (req) => req.params.courseId),
  updateCourseStatusController,
);

// Layer 6: Course DELETE requires pre-flight action signature
router.delete(
  "/courses/:courseId",
  ...adminGuard,
  requireObjectId("courseId"),
  requireActionSignature("COURSE_DELETE"),
  auditLogAction("COURSE_DELETED", "Course", (req) => req.params.courseId),
  deleteCourseController,
);

router.patch(
  "/courses/:courseId/restore",
  ...adminGuard,
  requireObjectId("courseId"),
  auditLogAction("COURSE_RESTORED", "Course", (req) => req.params.courseId),
  restoreCourseController,
);

// ─── Reviews Routes ───────────────────────────────────────────────────────────
router.get(
  "/reviews",
  ...adminGuard,
  getReviewsController,
);

router.patch(
  "/reviews/:reviewId/status",
  ...adminGuard,
  requireObjectId("reviewId"),
  auditLogAction("REVIEW_STATUS_CHANGE", "CourseReview", (req) => req.params.reviewId),
  updateReviewStatusController,
);

export default router;
