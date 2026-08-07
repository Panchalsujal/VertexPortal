import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { createEnrollmentController ,getMyEnrollmentsController,getEnrollmentByCourseController} from "../controllers/enrollment.controller.js";

const router = Router();


/**
 * @access Private
 * @desc Create a new enrollment for a specific course
 * @Api POST /api/enrollments/:courseId
 * @param { courseId: string }
 * @body { }
 * @returns { message: string, enrollment: object }
 */

router.post(
  "/:courseId",
  authMiddleware,
  authorizeRoles("student"),
  createEnrollmentController,
);


/**
 * @access Private
 * @desc Get all enrollments for the logged-in student
 * @Api GET /api/enrollments/me
 * @param { }
 * @returns { message: string, enrollments: array }
 */

router.get(
  "/me",
  authMiddleware,
  authorizeRoles("student"),
  getMyEnrollmentsController,
);


/** 
* @access Private
 * @desc Get enrollment details for a specific course for the logged-in student
 * @Api GET /api/enrollments/:courseId
 * @param { courseId: string }
 * @returns { message: string, enrollment: object }
 */

router.get(
  "/:courseId",
  authMiddleware,
  authorizeRoles("student"),
  getEnrollmentByCourseController,
);
export default router;
