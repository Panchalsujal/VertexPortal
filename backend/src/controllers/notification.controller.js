import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  archiveNotification,
  restoreNotification,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../service/notification.service.js";

export const getMyNotificationsController = asyncHandler(async (req, res) => {
  const result = await getMyNotifications({
    userId: req.user.id,
    query: req.query,
  });

  return res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    ...result,
  });
});

export const markNotificationAsReadController = asyncHandler(
  async (req, res) => {
    const { notificationId } = req.params;

    const result = await markNotificationAsRead({
      userId: req.user.id,
      notificationId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      notification: result.notification,
    });
  },
);

export const markAllNotificationsAsReadController = asyncHandler(
  async (req, res) => {
    const result = await markAllNotificationsAsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: result.message,
      modifiedCount: result.modifiedCount,
    });
  },
);


export const archiveNotificationController =
  asyncHandler(async (req, res) => {
    const { notificationId } =
      req.params;

    const result =
      await archiveNotification({
        userId: req.user.id,
        notificationId,
      });

    return res.status(200).json({
      success: true,
      message: result.message,
      notification:
        result.notification,
    });
  });

export const restoreNotificationController =
  asyncHandler(async (req, res) => {
    const { notificationId } =
      req.params;

    const result =
      await restoreNotification({
        userId: req.user.id,
        notificationId,
      });

    return res.status(200).json({
      success: true,
      message: result.message,
      notification:
        result.notification,
    });
  });

export const deleteNotificationController =
  asyncHandler(async (req, res) => {
    const { notificationId } =
      req.params;

    const result =
      await deleteNotification({
        userId: req.user.id,
        notificationId,
      });

    return res.status(200).json({
      success: true,
      message: result.message,
      notificationId:
        result.notificationId,
    });
  });

export const getNotificationPreferencesController =
  asyncHandler(async (req, res) => {
    const preferences =
      await getNotificationPreferences(
        req.user.id,
      );

    return res.status(200).json({
      success: true,
      message:
        "Notification preferences fetched successfully",
      preferences,
    });
  });

export const updateNotificationPreferencesController =
  asyncHandler(async (req, res) => {
    const preferences =
      await updateNotificationPreferences({
        userId: req.user.id,
        payload: req.body,
      });

    return res.status(200).json({
      success: true,
      message:
        "Notification preferences updated successfully",
      preferences,
    });
  });