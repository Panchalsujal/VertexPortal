import { Router } from "express";
import { uploadCourseThumbnail } from "../middlewares/courseThumbnail.middleware.js";

import {
  createCourseController,
  getAllCoursesController,
  publishCourseController,
  getCourseBySlugController,
  updateCourseController,
  updateCourseThumbnailController,
  archiveCourseController,
} from "../controllers/course.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();
/**
 * @access Public
 * @desc Get all published courses
 * @api GET /api/courses
 */
router.get("/", getAllCoursesController);

/**
 * @access Admin, Instructor
 * @desc Create a course
 * @api POST /api/courses
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  createCourseController,
);

/**
 * @access Admin, Instructor
 * @desc Publish a course
 * @api PATCH /api/courses/:courseId/publish
 */

router.patch(
  "/:courseId/publish",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  publishCourseController,
);

/** * @access Admin, Instructor
 * @desc Update course thumbnail
 * @api PATCH /api/courses/:courseId/thumbnail
 */
router.patch(
  "/:courseId/thumbnail",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  uploadCourseThumbnail.single("thumbnail"),
  updateCourseThumbnailController,
);

/**
 * @access Admin, Instructor
 * @desc Update a course
 * @api PATCH /api/courses/:courseId
 */

router.patch(
  "/:courseId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  updateCourseController,
);

/**
 * @access Admin, Course owner
 * @desc Archive course
 * @api DELETE /api/courses/:courseId
 */
router.delete(
  "/:courseId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  archiveCourseController,
);

/**
 * @access Public
 * @desc Get single published course by slug
 * @api GET /api/courses/:slug
 */
router.get("/:slug", getCourseBySlugController);

export default router;
