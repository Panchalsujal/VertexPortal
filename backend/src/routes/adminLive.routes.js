import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

import {
  getLiveClassesController,
  getLiveClassByIdController,
  updateLiveClassStatusController,
  cancelLiveClassController,
  restoreLiveClassController,
} from "../controllers/admin.controller.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  getLiveClassesController,
);

router.get(
  "/:liveClassId",
  authMiddleware,
  authorizeRoles("admin"),
  getLiveClassByIdController,
);

router.patch(
  "/:liveClassId/status",
  authMiddleware,
  authorizeRoles("admin"),
  updateLiveClassStatusController,
);

router.delete(
  "/:liveClassId",
  authMiddleware,
  authorizeRoles("admin"),
  cancelLiveClassController,
);

router.patch(
  "/:liveClassId/restore",
  authMiddleware,
  authorizeRoles("admin"),
  restoreLiveClassController,
);

export default router;
