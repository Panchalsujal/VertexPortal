import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import {
  markLectureCompletedController,
  updateWatchTimeController,
  getCourseProgressController,
  getContinueLearningController
} from "../controllers/lectureProgress.controller.js";

const router = Router();

/**
 * @access Private
 * @desc Mark a lecture as completed for a specific student
 * @Api POST /api/lectures/:lectureId/complete
 * @param { lectureId: string }
 * @body { }
 * @returns { message: string, lectureProgress: object }
 */

router.post(
  "/lectures/:lectureId/complete",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  markLectureCompletedController,
);

/**
 * @access Private
 * @desc Get the progress of a specific course for a student
 * @Api GET /api/courses/:courseId/progress
 * @param { courseId: string }
 * @returns { message: string, courseProgress: object }
 */

router.get("/courses/:courseId/progress", authMiddleware, getCourseProgressController);

/**
 * @access Private
 * @desc Update the watch time for a specific lecture for a student
 * @Api PATCH /api/lectures/:lectureId/watch-time
 * @param { lectureId: string }
 * @body { watchedDurationInSeconds: number }
 * @returns { message: string, lectureProgress: object }
 */

router.patch(
  "/lectures/:lectureId/watch-time",
  authMiddleware,
  authorizeRoles("student", "admin", "instructor"),
  updateWatchTimeController,
);

router.get(
    "/me/continue-learning",
    authMiddleware,
    getContinueLearningController,
);

export default router;
