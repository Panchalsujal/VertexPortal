import { Router } from "express";

import {
  createLiveClassController,
  getInstructorLiveClassesController,
  getInstructorLiveClassByIdController,
  updateLiveClassController,
  updateLiveClassStatusController,
  cancelLiveClassController,
} from "../controllers/liveClass.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("instructor","admin"));

router.post("/", createLiveClassController);

router.get("/", getInstructorLiveClassesController);

router.patch("/:liveClassId/status", updateLiveClassStatusController);

router.patch("/:liveClassId/cancel", cancelLiveClassController);

router.get("/:liveClassId", getInstructorLiveClassByIdController);

router.patch("/:liveClassId", updateLiveClassController);

export default router;
