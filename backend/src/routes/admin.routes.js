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

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  getDashboardSummaryController,
);

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
  getOrderByIdController,
);

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
  getStudentByIdController,
);

router.patch(
  "/students/:studentId/status",
  authMiddleware,
  authorizeRoles("admin"),
  updateStudentStatusController,
);

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
  getCourseByIdController,
);

router.patch(
  "/courses/:courseId/status",
  authMiddleware,
  authorizeRoles("admin"),
  updateCourseStatusController,
);

router.delete(
  "/courses/:courseId",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCourseController,
);

router.patch(
  "/courses/:courseId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  restoreCourseController,
);

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
  updateReviewStatusController,
);
export default router;
