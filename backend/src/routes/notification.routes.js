import { Router } from "express";

import {
  getMyNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  archiveNotificationController,
  restoreNotificationController,
  deleteNotificationController,
  getNotificationPreferencesController,
  updateNotificationPreferencesController,
} from "../controllers/notification.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getMyNotificationsController);

router.get("/preferences", getNotificationPreferencesController);

router.patch("/preferences", updateNotificationPreferencesController);

router.patch("/read-all", markAllNotificationsAsReadController);

router.patch("/:notificationId/read", markNotificationAsReadController);

router.patch("/:notificationId/archive", archiveNotificationController);

router.patch("/:notificationId/restore", restoreNotificationController);

router.delete("/:notificationId", deleteNotificationController);

export default router;
