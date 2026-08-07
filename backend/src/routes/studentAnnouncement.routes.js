import { Router } from "express";

import {
  getStudentAnnouncementsController,
  getStudentAnnouncementByIdController,
  markAnnouncementAsReadController,
  markAllAnnouncementsAsReadController,
} from "../controllers/studentAnnouncement.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,
  authorizeRoles("student"),
);

router.get(
  "/",
  getStudentAnnouncementsController,
);

router.patch(
  "/read-all",
  markAllAnnouncementsAsReadController,
);

router.patch(
  "/:announcementId/read",
  markAnnouncementAsReadController,
);

router.get(
  "/:announcementId",
  getStudentAnnouncementByIdController,
);

export default router;