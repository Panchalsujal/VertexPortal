import mongoose from "mongoose";

import Notification from "../models/notification.model.js";
import NotificationPreference from "../models/notificationPreference.model.js";

import {
  sendNotificationEmail,
} from "./notificationEmail.service.js";

import {
  validateObjectId,
} from "../utils/validator.js";

import {
  getPagination,
  buildPaginationMeta,
} from "../utils/pagination.js";

import {
  parseBooleanQuery,
  parseEnumQuery,
  parseSortQuery,
} from "../utils/queryParser.js";

import { ApiError } from "../utils/ApiError.js";

const NOTIFICATION_TYPES = [
  "announcement",
  "assignment",
  "assignment_graded",
  "assignment_returned",
  "quiz",
  "quiz_result",
  "certificate",
  "live_class",
  "course_update",
  "system",
];

export async function createNotification({
  userId,
  title,
  message,
  type = "system",
  resourceType = null,
  resourceId = null,
  courseId = null,
  actionUrl = "",
  metadata = null,
  expiresAt = null,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  if (resourceId) {
    validateObjectId(
      resourceId,
      "resource ID",
    );
  }

  if (courseId) {
    validateObjectId(
      courseId,
      "course ID",
    );
  }

  const normalizedTitle =
    String(title || "").trim();

  const normalizedMessage =
    String(message || "").trim();

  if (!normalizedTitle) {
    throw new ApiError(
      400,
      "Notification title is required",
    );
  }

  if (
    normalizedTitle.length > 200
  ) {
    throw new ApiError(
      400,
      "Notification title cannot exceed 200 characters",
    );
  }

  if (!normalizedMessage) {
    throw new ApiError(
      400,
      "Notification message is required",
    );
  }

  if (
    normalizedMessage.length > 2000
  ) {
    throw new ApiError(
      400,
      "Notification message cannot exceed 2000 characters",
    );
  }

  const parsedType =
    parseEnumQuery(
      type,
      NOTIFICATION_TYPES,
      "Notification type",
    ) ?? "system";

  /*
   * In-app preference check.
   */
  const preferences =
    await NotificationPreference.findOne({
      user: userId,
    })
      .select(
        `inApp.${parsedType}`,
      )
      .lean();

  const inAppEnabled =
    preferences?.inApp?.[
      parsedType
    ] ?? true;

  if (!inAppEnabled) {
    return {
      skipped: true,

      notification: null,

      reason:
        "Notification disabled by user preference",
    };
  }

  let parsedExpiresAt = null;

  if (expiresAt) {
    parsedExpiresAt =
      new Date(expiresAt);

    if (
      Number.isNaN(
        parsedExpiresAt.getTime(),
      )
    ) {
      throw new ApiError(
        400,
        "Invalid notification expiry date",
      );
    }
  }

  const normalizedActionUrl =
    String(actionUrl || "").trim();

  if (
    normalizedActionUrl.length > 2000
  ) {
    throw new ApiError(
      400,
      "Notification action URL cannot exceed 2000 characters",
    );
  }

  const notification =
    await Notification.create({
      user: userId,

      title:
        normalizedTitle,

      message:
        normalizedMessage,

      type:
        parsedType,

      resourceType,

      resourceId:
        resourceId || null,

      course:
        courseId || null,

      actionUrl:
        normalizedActionUrl,

      metadata:
        metadata ?? null,

      isRead: false,

      readAt: null,

      isArchived: false,

      archivedAt: null,

      expiresAt:
        parsedExpiresAt,
    });

  return {
    skipped: false,

    notification,

    reason: null,
  };
}

/*
 * Common notification dispatcher.
 *
 * In-app + email dono handle karega.
 */
export async function dispatchNotification({
  userId,
  title,
  message,
  type = "system",
  resourceType = null,
  resourceId = null,
  courseId = null,
  actionUrl = "",
  metadata = null,
  expiresAt = null,
}) {
  let inAppResult;

  try {
    inAppResult =
      await createNotification({
        userId,
        title,
        message,
        type,
        resourceType,
        resourceId,
        courseId,
        actionUrl,
        metadata,
        expiresAt,
      });
  } catch (error) {
    console.error(
      "In-app notification failed:",
      error,
    );

    inAppResult = {
      skipped: false,
      notification: null,

      reason:
        error?.message ||
        "In-app notification failed",
    };
  }

  let emailResult;

  try {
    emailResult =
      await sendNotificationEmail({
        userId,
        type,
        title,
        message,
        actionUrl,
      });
  } catch (error) {
    console.error(
      "Email notification failed:",
      error,
    );

    emailResult = {
      skipped: false,
      sent: false,

      reason:
        error?.message ||
        "Email notification failed",
    };
  }

  return {
    inApp:
      inAppResult,

    email:
      emailResult,
  };
}

/*
 * Bulk in-app notifications.
 */
export async function createBulkNotifications({
  userIds,
  title,
  message,
  type = "system",
  resourceType = null,
  resourceId = null,
  courseId = null,
  actionUrl = "",
  metadata = null,
  expiresAt = null,
}) {
  if (
    !Array.isArray(userIds) ||
    userIds.length === 0
  ) {
    return {
      insertedCount: 0,
    };
  }

  const normalizedTitle =
    String(title || "").trim();

  const normalizedMessage =
    String(message || "").trim();

  if (!normalizedTitle) {
    throw new ApiError(
      400,
      "Notification title is required",
    );
  }

  if (!normalizedMessage) {
    throw new ApiError(
      400,
      "Notification message is required",
    );
  }

  const parsedType =
    parseEnumQuery(
      type,
      NOTIFICATION_TYPES,
      "Notification type",
    ) ?? "system";

  const uniqueUserIds = [
    ...new Set(
      userIds.map((id) =>
        String(id).trim(),
      ),
    ),
  ];

  for (const userId of uniqueUserIds) {
    validateObjectId(
      userId,
      "user ID",
    );
  }

  if (resourceId) {
    validateObjectId(
      resourceId,
      "resource ID",
    );
  }

  if (courseId) {
    validateObjectId(
      courseId,
      "course ID",
    );
  }

  let parsedExpiresAt = null;

  if (expiresAt) {
    parsedExpiresAt =
      new Date(expiresAt);

    if (
      Number.isNaN(
        parsedExpiresAt.getTime(),
      )
    ) {
      throw new ApiError(
        400,
        "Invalid notification expiry date",
      );
    }
  }

  const preferenceDocuments =
    await NotificationPreference.find({
      user: {
        $in: uniqueUserIds,
      },
    })
      .select(
        `user inApp.${parsedType}`,
      )
      .lean();

  const preferenceMap = new Map(
    preferenceDocuments.map(
      (preference) => [
        preference.user.toString(),

        preference.inApp?.[
          parsedType
        ] ?? true,
      ],
    ),
  );

  const enabledUserIds =
    uniqueUserIds.filter(
      (userId) =>
        preferenceMap.get(userId) ??
        true,
    );

  if (
    enabledUserIds.length === 0
  ) {
    return {
      insertedCount: 0,
    };
  }

  const documents =
    enabledUserIds.map(
      (userId) => ({
        user:
          new mongoose.Types.ObjectId(
            userId,
          ),

        title:
          normalizedTitle,

        message:
          normalizedMessage,

        type:
          parsedType,

        resourceType,

        resourceId:
          resourceId
            ? new mongoose.Types.ObjectId(
                resourceId,
              )
            : null,

        course:
          courseId
            ? new mongoose.Types.ObjectId(
                courseId,
              )
            : null,

        actionUrl:
          String(
            actionUrl || "",
          ).trim(),

        metadata,

        expiresAt:
          parsedExpiresAt,

        isRead: false,

        readAt: null,

        isArchived: false,

        archivedAt: null,
      }),
    );

  const notifications =
    await Notification.insertMany(
      documents,
      {
        ordered: false,
      },
    );

  return {
    insertedCount:
      notifications.length,
  };
}

export async function getMyNotifications({
  userId,
  query = {},
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  const {
    type,
    isRead,
    isArchived = false,

    sortBy = "createdAt",

    order = "desc",
  } = query;

  const {
    page,
    limit,
    skip,
  } = getPagination(query);

  const now = new Date();

  const filter = {
    user: userId,

    $or: [
      {
        expiresAt: null,
      },

      {
        expiresAt: {
          $gt: now,
        },
      },
    ],
  };

  const parsedType =
    parseEnumQuery(
      type,
      NOTIFICATION_TYPES,
      "Notification type",
    );

  if (
    parsedType !== undefined
  ) {
    filter.type = parsedType;
  }

  const parsedIsRead =
    parseBooleanQuery(
      isRead,
      "isRead",
    );

  if (
    parsedIsRead !== undefined
  ) {
    filter.isRead =
      parsedIsRead;
  }

  const parsedIsArchived =
    parseBooleanQuery(
      isArchived,
      "isArchived",
    );

  if (
    parsedIsArchived !== undefined
  ) {
    filter.isArchived =
      parsedIsArchived;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: [
      "createdAt",
      "updatedAt",
      "readAt",
    ],

    defaultField:
      "createdAt",

    defaultOrder:
      "desc",
  });

  const [
    notifications,
    totalRecords,
    unreadCount,
  ] = await Promise.all([
    Notification.find(filter)
      .populate({
        path: "course",

        select:
          "title slug thumbnailUrl",
      })
      .sort({
        [selectedSortField]:
          sortOrder,

        _id:
          sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Notification.countDocuments(
      filter,
    ),

    Notification.countDocuments({
      user: userId,

      isRead: false,

      isArchived: false,

      $or: [
        {
          expiresAt: null,
        },

        {
          expiresAt: {
            $gt: now,
          },
        },
      ],
    }),
  ]);

  return {
    notifications,

    unreadCount,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        totalRecords,
      }),

    filters: {
      type:
        parsedType ?? null,

      isRead:
        parsedIsRead ?? null,

      isArchived:
        parsedIsArchived ?? false,

      sortBy:
        selectedSortField,

      order:
        normalizedOrder,
    },
  };
}

export async function markNotificationAsRead({
  userId,
  notificationId,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    notificationId,
    "notification ID",
  );

  const notification =
    await Notification.findOne({
      _id:
        notificationId,

      user:
        userId,
    });

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found",
    );
  }

  if (notification.isRead) {
    return {
      notification,

      message:
        "Notification is already read",
    };
  }

  notification.isRead = true;

  notification.readAt =
    new Date();

  await notification.save();

  return {
    notification,

    message:
      "Notification marked as read",
  };
}

export async function markAllNotificationsAsRead(
  userId,
) {
  validateObjectId(
    userId,
    "user ID",
  );

  const now = new Date();

  const result =
    await Notification.updateMany(
      {
        user: userId,

        isRead: false,

        isArchived: false,

        $or: [
          {
            expiresAt: null,
          },

          {
            expiresAt: {
              $gt: now,
            },
          },
        ],
      },

      {
        $set: {
          isRead: true,

          readAt: now,
        },
      },
    );

  return {
    modifiedCount:
      result.modifiedCount,

    message:
      "All notifications marked as read",
  };
}

export async function archiveNotification({
  userId,
  notificationId,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    notificationId,
    "notification ID",
  );

  const notification =
    await Notification.findOne({
      _id:
        notificationId,

      user:
        userId,
    });

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found",
    );
  }

  if (
    notification.isArchived
  ) {
    return {
      notification,

      message:
        "Notification is already archived",
    };
  }

  notification.isArchived =
    true;

  notification.archivedAt =
    new Date();

  await notification.save();

  return {
    notification,

    message:
      "Notification archived successfully",
  };
}

export async function restoreNotification({
  userId,
  notificationId,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    notificationId,
    "notification ID",
  );

  const notification =
    await Notification.findOne({
      _id:
        notificationId,

      user:
        userId,
    });

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found",
    );
  }

  if (
    !notification.isArchived
  ) {
    return {
      notification,

      message:
        "Notification is already active",
    };
  }

  notification.isArchived =
    false;

  notification.archivedAt =
    null;

  await notification.save();

  return {
    notification,

    message:
      "Notification restored successfully",
  };
}

export async function deleteNotification({
  userId,
  notificationId,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    notificationId,
    "notification ID",
  );

  const notification =
    await Notification.findOneAndDelete({
      _id:
        notificationId,

      user:
        userId,
    });

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found",
    );
  }

  return {
    notificationId:
      notification._id,

    message:
      "Notification deleted successfully",
  };
}

export async function getNotificationPreferences(
  userId,
) {
  validateObjectId(
    userId,
    "user ID",
  );

  let preferences =
    await NotificationPreference.findOne({
      user: userId,
    });

  if (!preferences) {
    preferences =
      await NotificationPreference.create({
        user: userId,
      });
  }

  return preferences;
}

export async function updateNotificationPreferences({
  userId,
  payload,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  if (
    !payload ||
    Object.keys(payload).length === 0
  ) {
    throw new ApiError(
      400,
      "At least one preference is required",
    );
  }

  const allowedChannels = [
    "inApp",
    "email",
  ];

  const update = {};

  for (
    const channel of allowedChannels
  ) {
    if (
      payload[channel] === undefined
    ) {
      continue;
    }

    if (
      !payload[channel] ||
      typeof payload[channel] !==
        "object" ||
      Array.isArray(
        payload[channel],
      )
    ) {
      throw new ApiError(
        400,
        `${channel} preferences must be an object`,
      );
    }

    for (
      const [type, value]
      of Object.entries(
        payload[channel],
      )
    ) {
      if (
        !NOTIFICATION_TYPES.includes(
          type,
        )
      ) {
        throw new ApiError(
          400,
          `Invalid notification type: ${type}`,
        );
      }

      const parsedValue =
        typeof value === "boolean"
          ? value
          : parseBooleanQuery(
              value,
              `${channel}.${type}`,
            );

      update[
        `${channel}.${type}`
      ] = parsedValue;
    }
  }

  if (
    Object.keys(update).length === 0
  ) {
    throw new ApiError(
      400,
      "No valid notification preferences provided",
    );
  }

  return NotificationPreference.findOneAndUpdate(
    {
      user: userId,
    },

    {
      $set:
        update,

      $setOnInsert: {
        user: userId,
      },
    },

    {
      new: true,

      upsert: true,

      runValidators: true,

      setDefaultsOnInsert: true,
    },
  );
}