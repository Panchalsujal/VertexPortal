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
router.patch("/:courseId/publish", publishAdminCourseController);

/*
 * Unpublish
 */
router.patch("/:courseId/unpublish", unpublishAdminCourseController);

/*
 * Activate
 */
router.patch("/:courseId/activate", activateAdminCourseController);

/*
 * Deactivate
 */
router.patch("/:courseId/deactivate", deactivateAdminCourseController);

/*
 * Archive
 */
router.patch("/:courseId/archive", archiveAdminCourseController);

/*
 * Single course
 */
router.get("/:courseId", getAdminCourseByIdController);

export default router;
