import { Router } from "express";

import {
  createLiveClassController,
  getInstructorLiveClassesController,
  getInstructorLiveClassByIdController,
  updateLiveClassController,
  updateLiveClassStatusController,
  cancelLiveClassController,
  getInstructorLiveClassAttendanceController,
  getInstructorLiveClassAttendanceAnalyticsController,
} from "../controllers/liveClass.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

/*
 * Instructor + Admin protected routes
 */
router.use(authMiddleware, authorizeRoles("instructor", "admin"));

/*
 * Create live class
 */
router.post("/", createLiveClassController);

/*
 * Get instructor live classes
 */
router.get("/", getInstructorLiveClassesController);

/*
 * Attendance list
 */
router.get(
  "/:liveClassId/attendance",
  getInstructorLiveClassAttendanceController,
);

/*
 * Attendance analytics
 */
router.get(
  "/:liveClassId/attendance/analytics",
  getInstructorLiveClassAttendanceAnalyticsController,
);

/*
 * Update live class status
 *
 * draft → scheduled → live → completed
 */
router.patch("/:liveClassId/status", updateLiveClassStatusController);

/*
 * Cancel live class
 */
router.patch("/:liveClassId/cancel", cancelLiveClassController);

/*
 * Get single live class
 */
router.get("/:liveClassId", getInstructorLiveClassByIdController);

/*
 * Update live class
 */
router.patch("/:liveClassId", updateLiveClassController);

export default router;
