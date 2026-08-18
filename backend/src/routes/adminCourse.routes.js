import { Router } from "express";

import {
  getAdminCoursesController,
  getAdminCourseAnalyticsController,
  getAdminCourseByIdController,
  publishAdminCourseController,
  unpublishAdminCourseController,
  activateAdminCourseController,
  deactivateAdminCourseController,
  archiveAdminCourseController,
} from "../controllers/adminCourse.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { auditLogAction } from "../middlewares/auditLog.middleware.js";

const router = Router();

router.use(
  authMiddleware,
  authorizeRoles("admin"),
);

/*
 * Analytics before /:courseId
 */
router.get("/analytics", getAdminCourseAnalyticsController);

/*
 * All courses
 */
router.get("/", getAdminCoursesController);

/*
 * Publish
 */
router.patch(
  "/:courseId/publish",
  auditLogAction("COURSE_PUBLISHED", "Course", (req) => req.params.courseId),
  publishAdminCourseController,
);

/*
 * Unpublish
 */
router.patch(
  "/:courseId/unpublish",
  auditLogAction("COURSE_UNPUBLISHED", "Course", (req) => req.params.courseId),
  unpublishAdminCourseController,
);

/*
 * Activate
 */
router.patch(
  "/:courseId/activate",
  auditLogAction("COURSE_ACTIVATED", "Course", (req) => req.params.courseId),
  activateAdminCourseController,
);

/*
 * Deactivate
 */
router.patch(
  "/:courseId/deactivate",
  auditLogAction("COURSE_DEACTIVATED", "Course", (req) => req.params.courseId),
  deactivateAdminCourseController,
);

/*
 * Archive
 */
router.patch(
  "/:courseId/archive",
  auditLogAction("COURSE_ARCHIVED", "Course", (req) => req.params.courseId),
  archiveAdminCourseController,
);

/*
 * Single course
 */
router.get("/:courseId", getAdminCourseByIdController);

export default router;
