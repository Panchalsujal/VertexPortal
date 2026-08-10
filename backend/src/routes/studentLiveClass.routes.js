import { Router } from "express";

import {
  getStudentLiveClassesController,
  getStudentLiveClassByIdController,
  joinStudentLiveClassController,
  leaveStudentLiveClassController,
} from "../controllers/studentLiveClass.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("student"));

router.get("/", getStudentLiveClassesController);

router.post("/:liveClassId/join", joinStudentLiveClassController);

router.post("/:liveClassId/leave", leaveStudentLiveClassController);

router.get("/:liveClassId", getStudentLiveClassByIdController);

export default router;
