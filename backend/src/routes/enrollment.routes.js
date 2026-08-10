import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { createEnrollmentController, getMyEnrollmentsController, getEnrollmentByCourseController } from "../controllers/enrollment.controller.js";

const router = Router();

/**
 * @access Private
 * @desc Create a new enrollment for a specific course
 * @Api POST /api/enrollments/:courseId
 */
router.post(
  "/:courseId",
  authMiddleware,
  authorizeRoles("student", "instructor", "admin"),
  createEnrollmentController,
);

/**
 * @access Private
 * @desc Get all enrollments for the logged-in user
 * @Api GET /api/enrollments/me
 */
router.get(
  "/me",
  authMiddleware,
  authorizeRoles("student", "instructor", "admin"),
  getMyEnrollmentsController,
);

/** 
 * @access Private
 * @desc Get enrollment details for a specific course for the logged-in user
 * @Api GET /api/enrollments/:courseId
 */
router.get(
  "/:courseId",
  authMiddleware,
  authorizeRoles("student", "instructor", "admin"),
  getEnrollmentByCourseController,
);

export default router;
