import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import {
  getMyCoursesController,
  getContinueLearningController,
  getResumeLearningController,
  getCoursePlayerController,
  getGamificationController,
  getReferralController,
} from "../controllers/student.controller.js";

const router = Router();

/**
 * @access Private
 * @description Get student gamification streak and badges
 * @api GET /api/student/gamification
 */
router.get(
  "/gamification",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  getGamificationController,
);

/**
 * @access Private
 * @description Get student referral code and stats
 * @api GET /api/student/referral
 */
router.get(
  "/referral",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  getReferralController,
);

/**
 * @access  Private
 * @description  Get all courses for the logged-in student
 * @api GET /api/student/my-courses
 * @returns { message: string, count: number, courses: array }
 */

router.get(
  "/my-courses",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  getMyCoursesController,
);

/**
 * @access  Private
 * @description  Get all courses that the logged-in student is currently learning
 * @api GET /api/student/continue-learning
 * @returns { message: string, count: number, courses: array }
 */


router.get(
  "/continue-learning",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  getContinueLearningController,
);

/**
 * @access  Private
 * @description  Get the resume learning data for a specific course for the logged-in student
 * @api GET /api/student/course/:courseId/resume
 * @param { courseId: string }
 * @returns { message: string, resume: object }
 */


router.get(
  "/course/:courseId/resume",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  getResumeLearningController,
);


/**
 * @access  Private
 * @description  Get the course player data for a specific course for the logged-in student
 * @api GET /api/student/course/:courseId/player
 * @param { courseId: string }
 * @returns { message: string, data: object }
 */

router.get(
  "/course/:courseId/player",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  getCoursePlayerController,
);

export default router;
