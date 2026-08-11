import { Router } from "express";

import {
  getStudentLiveClassesController,
  getStudentLiveClassByIdController,
  joinStudentLiveClassController,
  leaveStudentLiveClassController,
  getStudentLiveClassAttendanceHistoryController,
  getStudentLiveClassResourcesController,
} from "../controllers/studentLiveClass.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("student", "admin", "instructor"));

router.get("/", getStudentLiveClassesController);

// IMPORTANT: static routes must be defined BEFORE param routes
router.get(
  "/attendance/history",
  getStudentLiveClassAttendanceHistoryController,
);

router.get("/:liveClassId/resources", getStudentLiveClassResourcesController);

router.post("/:liveClassId/join", joinStudentLiveClassController);

router.post("/:liveClassId/leave", leaveStudentLiveClassController);

router.get("/:liveClassId", getStudentLiveClassByIdController);

export default router;
