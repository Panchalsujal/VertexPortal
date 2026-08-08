import { Router } from "express";

import {
  createAnnouncementController,
  getInstructorAnnouncementsController,
  getInstructorAnnouncementByIdController,
  updateAnnouncementController,
  updateAnnouncementStatusController,
} from "../controllers/announcement.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("instructor", "admin"));

router.post("/", createAnnouncementController);

router.get("/", getInstructorAnnouncementsController);

router.patch("/:announcementId/status", updateAnnouncementStatusController);

router.get("/:announcementId", getInstructorAnnouncementByIdController);

router.patch("/:announcementId", updateAnnouncementController);

export default router;
