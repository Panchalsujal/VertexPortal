import LiveClass from "../models/liveClass.model.js";
import Enrollment from "../models/enrollment.model.js";
import { config } from "../config/config.js";
import { executeChunkedBulkWrite } from "../utils/bulkWriteHelper.js";
import {
  dispatchBulkNotifications,
} from "./notification.service.js";

function getFrontendUrl() {
  return (
    config.FRONTEND_URL
    );
}

async function getActiveStudentIds(
  courseId,
) {
  const now = new Date();

  const enrollments =
    await Enrollment.find({
      course: courseId,

      status: {
        $in: [
          "active",
          "completed",
        ],
      },
    })
      .select(
        "student expiresAt",
      )
      .lean();

  return enrollments
    .filter(
      (enrollment) =>
        !enrollment.expiresAt ||
        new Date(
          enrollment.expiresAt,
        ).getTime() >
          now.getTime(),
    )
    .map(
      (enrollment) =>
        enrollment.student.toString(),
    );
}

function formatClassStartTime(
  startsAt,
) {
  return new Date(
    startsAt,
  ).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone:
        "Asia/Kolkata",
    },
  );
}

async function sendLiveClassReminder({
  liveClass,
  reminderType,
}) {
  const studentIds =
    await getActiveStudentIds(
      liveClass.course,
    );

  if (
    studentIds.length === 0
  ) {
    return {
      skipped: true,
      reason:
        "No active enrolled students",
    };
  }

  let title;
  let message;

  const formattedStart =
    formatClassStartTime(
      liveClass.startsAt,
    );

  if (
    reminderType ===
    "24_hours"
  ) {
    title =
      "Live class tomorrow";

    message =
      `"${liveClass.title}" is scheduled for ${formattedStart}.`;
  }

  if (
    reminderType ===
    "1_hour"
  ) {
    title =
      "Live class starts in 1 hour";

    message =
      `"${liveClass.title}" will start in approximately 1 hour.`;
  }

  if (
    reminderType ===
    "10_minutes"
  ) {
    title =
      "Live class starts soon";

    message =
      `"${liveClass.title}" will start in approximately 10 minutes.`;
  }

  if (!title || !message) {
    throw new Error(
      `Invalid reminder type: ${reminderType}`,
    );
  }

  const actionUrl =
    `${getFrontendUrl()}/student/live-classes/${liveClass._id}`;

  const result =
    await dispatchBulkNotifications({
      userIds:
        studentIds,

      title,

      message,

      type:
        "live_class",

      resourceType:
        "live_class",

      resourceId:
        liveClass._id,

      courseId:
        liveClass.course,

      actionUrl,

      metadata: {
        liveClassId:
          liveClass._id.toString(),

        reminderType,

        startsAt:
          liveClass.startsAt,

        endsAt:
          liveClass.endsAt,
      },

      expiresAt:
        liveClass.endsAt,
    });

  return {
    skipped: false,
    result,
  };
}

export async function processLiveClassReminders() {
  const now = new Date();

  /*
   * Sirf future scheduled classes.
   */
  const liveClasses =
    await LiveClass.find({
      status:
        "scheduled",

      isPublished:
        true,

      isActive:
        true,

      startsAt: {
        $gt: now,
      },
    })
      .select(`
        course
        title
        startsAt
        endsAt
        timezone
        reminders
      `);

  const summary = {
    checked:
      liveClasses.length,

    reminder24Hours:
      0,

    reminder1Hour:
      0,

    reminder10Minutes:
      0,

    failed:
      0,
  };

  const bulkOperations = [];

  for (const liveClass of liveClasses) {
    try {
      const startsAt = new Date(liveClass.startsAt);
      const differenceMs = startsAt.getTime() - now.getTime();
      const differenceMinutes = differenceMs / (1000 * 60);

      /*
       * 24 hour reminder:
       * Scheduler har minute chalega, isliye 23h59 - 24h range target karenge.
       */
      if (
        !liveClass.reminders?.reminder24HoursSent &&
        differenceMinutes <= 24 * 60 &&
        differenceMinutes > 23 * 60
      ) {
        await sendLiveClassReminder({
          liveClass,
          reminderType: "24_hours",
        });

        bulkOperations.push({
          updateOne: {
            filter: { _id: liveClass._id },
            update: {
              $set: {
                "reminders.reminder24HoursSent": true,
              },
            },
          },
        });

        summary.reminder24Hours += 1;
        continue;
      }

      /*
       * 1 hour reminder.
       */
      if (
        !liveClass.reminders?.reminder1HourSent &&
        differenceMinutes <= 60 &&
        differenceMinutes > 10
      ) {
        await sendLiveClassReminder({
          liveClass,
          reminderType: "1_hour",
        });

        bulkOperations.push({
          updateOne: {
            filter: { _id: liveClass._id },
            update: {
              $set: {
                "reminders.reminder1HourSent": true,
              },
            },
          },
        });

        summary.reminder1Hour += 1;
        continue;
      }

      /*
       * 10 minute reminder.
       */
      if (
        !liveClass.reminders?.reminder10MinutesSent &&
        differenceMinutes <= 10 &&
        differenceMinutes > 0
      ) {
        await sendLiveClassReminder({
          liveClass,
          reminderType: "10_minutes",
        });

        bulkOperations.push({
          updateOne: {
            filter: { _id: liveClass._id },
            update: {
              $set: {
                "reminders.reminder10MinutesSent": true,
              },
            },
          },
        });

        summary.reminder10Minutes += 1;
      }
    } catch (error) {
      summary.failed += 1;

      console.error(
        `Live class reminder failed for ${liveClass._id}:`,
        error,
      );
    }
  }

  if (bulkOperations.length > 0) {
    await executeChunkedBulkWrite(LiveClass, bulkOperations, {
      chunkSize: 500,
      ordered: false,
    });
  }

  return summary;
}