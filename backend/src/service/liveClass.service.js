import mongoose from "mongoose";
import LiveClass from "../models/liveClass.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import { validateObjectId } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";
import { notifyCourseEnrolledStudents } from "./notification.service.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import LiveClassAttendance from "../models/liveClassAttendance.model.js";
import { buildSearchFilter } from "../utils/search.js";
import User from "../models/user.model.js";
import { escapeRegex } from "../utils/search.js";
import {
  createBulkNotifications,
  dispatchNotification,
} from "./notification.service.js";
import {
  parseBooleanQuery,
  parseEnumQuery,
  parseNumberQuery,
  parseSortQuery,
} from "../utils/queryParser.js";
const LIVE_CLASS_PROVIDERS = ["google_meet", "zoom", "livekit", "custom"];

function parseLiveClassDate(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Invalid ${fieldName.toLowerCase()}`);
  }

  return date;
}

function normalizeMeetingUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    throw new ApiError(400, "Meeting URL is required");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ApiError(400, "Invalid meeting URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new ApiError(400, "Meeting URL must use HTTP or HTTPS");
  }

  return parsedUrl.toString();
}

export async function createLiveClass({ instructorId, userRole, payload }) {
  validateObjectId(instructorId, "instructor ID");

  const {
    courseId,
    moduleId = null,
    lectureId = null,

    title,
    description = "",

    provider = "google_meet",

    meetingUrl,
    meetingId = "",
    meetingPassword = "",

    startsAt,
    endsAt,

    timezone = "Asia/Kolkata",

    allowEarlyJoinMinutes = 10,
    maxParticipants = null,

    recordingEnabled = false,
  } = payload || {};

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  validateObjectId(courseId, "course ID");

  if (moduleId) {
    validateObjectId(moduleId, "module ID");
  }

  if (lectureId) {
    validateObjectId(lectureId, "lecture ID");
  }

  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle.length < 3) {
    throw new ApiError(400, "Live class title must be at least 3 characters");
  }

  if (normalizedTitle.length > 200) {
    throw new ApiError(400, "Live class title cannot exceed 200 characters");
  }

  const normalizedDescription = String(description || "").trim();

  if (normalizedDescription.length > 5000) {
    throw new ApiError(
      400,
      "Live class description cannot exceed 5000 characters",
    );
  }

  const parsedProvider =
    parseEnumQuery(provider, LIVE_CLASS_PROVIDERS, "Live class provider") ??
    "google_meet";

  const normalizedMeetingUrl = normalizeMeetingUrl(meetingUrl);

  const parsedStartsAt = parseLiveClassDate(startsAt, "Start time");

  const parsedEndsAt = parseLiveClassDate(endsAt, "End time");

  if (parsedEndsAt <= parsedStartsAt) {
    throw new ApiError(400, "Live class end time must be after start time");
  }

  const durationInMinutes = Math.ceil(
    (parsedEndsAt.getTime() - parsedStartsAt.getTime()) / (1000 * 60),
  );

  if (durationInMinutes > 1440) {
    throw new ApiError(400, "Live class duration cannot exceed 24 hours");
  }

  const parsedEarlyJoinMinutes =
    parseNumberQuery(allowEarlyJoinMinutes, {
      fieldName: "Allow early join minutes",
      min: 0,
      max: 120,
      integer: true,
    }) ?? 10;

  let parsedMaxParticipants = null;

  if (
    maxParticipants !== undefined &&
    maxParticipants !== null &&
    maxParticipants !== ""
  ) {
    parsedMaxParticipants = parseNumberQuery(maxParticipants, {
      fieldName: "Maximum participants",
      min: 1,
      max: 100000,
      integer: true,
    });
  }

  const parsedRecordingEnabled =
    typeof recordingEnabled === "boolean"
      ? recordingEnabled
      : parseBooleanQuery(recordingEnabled, "recordingEnabled");

  const courseQuery = {
    _id: courseId,
    isActive: true,
  };
  if (userRole !== "admin") {
    courseQuery.instructor = instructorId;
  }

  const course = await Course.findOne(courseQuery)
    .select(
      `
      title
      instructor
      status
      isPublished
      isActive
    `,
    )
    .lean();

  if (!course) {
    throw new ApiError(
      404,
      "Course not found or you are not authorized to create live classes for this course",
    );
  }

  let selectedModule = null;

  if (moduleId) {
    selectedModule = await CourseModule.findOne({
      _id: moduleId,
      course: courseId,
      isActive: true,
    })
      .select("_id title course")
      .lean();

    if (!selectedModule) {
      throw new ApiError(404, "Module not found in this course");
    }
  }

  let selectedLecture = null;

  if (lectureId) {
    selectedLecture = await Lecture.findOne({
      _id: lectureId,
      course: courseId,
      isActive: true,
    })
      .select("_id title module course")
      .lean();

    if (!selectedLecture) {
      throw new ApiError(404, "Lecture not found in this course");
    }

    if (moduleId && selectedLecture.module?.toString() !== String(moduleId)) {
      throw new ApiError(400, "Lecture does not belong to the selected module");
    }
  }

  const finalModuleId = selectedModule?._id ?? selectedLecture?.module ?? null;

  /*
   * Instructor same time me overlapping class
   * schedule na kare.
   */
  const overlappingClass = await LiveClass.exists({
    instructor: instructorId,

    status: {
      $in: ["scheduled", "live"],
    },

    startsAt: {
      $lt: parsedEndsAt,
    },

    endsAt: {
      $gt: parsedStartsAt,
    },
  });

  if (overlappingClass) {
    throw new ApiError(
      409,
      "Another live class is already scheduled during this time",
    );
  }

  const liveClass = await LiveClass.create({
    course: new mongoose.Types.ObjectId(courseId),

    module: finalModuleId,

    lecture: selectedLecture?._id ?? null,

    instructor: new mongoose.Types.ObjectId(instructorId),

    title: normalizedTitle,

    description: normalizedDescription,

    provider: parsedProvider,

    meetingUrl: normalizedMeetingUrl,

    meetingId: String(meetingId || "").trim(),

    meetingPassword: String(meetingPassword || "").trim(),

    startsAt: parsedStartsAt,

    endsAt: parsedEndsAt,

    timezone: String(timezone || "Asia/Kolkata").trim(),

    durationInMinutes,

    allowEarlyJoinMinutes: parsedEarlyJoinMinutes,

    maxParticipants: parsedMaxParticipants,

    recordingEnabled: parsedRecordingEnabled ?? false,

    status: payload?.status || "scheduled",

    isPublished: true,

    publishedAt: new Date(),

    isActive: true,
  });

  // Notify all enrolled students (in-app & email)
  notifyCourseEnrolledStudents({
    courseId: courseId,
    type: "live_class",
    title: `Live Class Scheduled: ${normalizedTitle}`,
    message: `A new live class "${normalizedTitle}" has been scheduled for your course ${course.title || ""} on ${parsedStartsAt.toLocaleString()}.`,
    resourceType: "live_class",
    resourceId: liveClass._id,
    actionUrl: `/student/live-classes`,
  });

  return liveClass;
}

export async function getInstructorLiveClasses({
  instructorId,
  userRole,
  query = {},
}) {
  validateObjectId(instructorId, "instructor ID");

  const {
    search,
    course,
    status,
    provider,
    isPublished,
    sortBy = "startsAt",
    order = "asc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};
  if (userRole !== "admin") {
    filter.instructor = instructorId;
  }

  const searchFilter = buildSearchFilter(search, ["title", "description"]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  if (course) {
    validateObjectId(course, "course ID");
    filter.course = course;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "scheduled", "live", "completed", "cancelled", "archived"],
    "Live class status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedProvider = parseEnumQuery(
    provider,
    LIVE_CLASS_PROVIDERS,
    "Live class provider",
  );

  if (parsedProvider !== undefined) {
    filter.provider = parsedProvider;
  }

  const parsedIsPublished = parseBooleanQuery(isPublished, "isPublished");

  if (parsedIsPublished !== undefined) {
    filter.isPublished = parsedIsPublished;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "startsAt",
      "endsAt",
      "createdAt",
      "updatedAt",
      "title",
      "durationInMinutes",
    ],
    defaultField: "startsAt",
    defaultOrder: "asc",
  });

  const [liveClasses, totalRecords] = await Promise.all([
    LiveClass.find(filter)
      .populate({
        path: "course",
        select: "title slug thumbnailUrl status isPublished isActive",
      })
      .populate({
        path: "module",
        select: "title order isPublished isActive",
      })
      .populate({
        path: "lecture",
        select: "title type order isPublished isActive",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    LiveClass.countDocuments(filter),
  ]);

  const now = new Date();

  const formattedLiveClasses = liveClasses.map((item) => {
    let timingStatus = "upcoming";

    if (item.status === "cancelled") {
      timingStatus = "cancelled";
    } else if (item.status === "completed") {
      timingStatus = "completed";
    } else if (now >= new Date(item.startsAt) && now < new Date(item.endsAt)) {
      timingStatus = "live";
    } else if (now >= new Date(item.endsAt)) {
      timingStatus = "ended";
    }

    return {
      ...item,
      timingStatus,
    };
  });

  return {
    liveClasses: formattedLiveClasses,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,
      status: parsedStatus ?? null,
      provider: parsedProvider ?? null,
      isPublished: parsedIsPublished ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getInstructorLiveClassById({
  instructorId,
  userRole,
  liveClassId,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(liveClassId, "live class ID");

  const filter = { _id: liveClassId };
  if (userRole !== "admin") {
    filter.instructor = instructorId;
  }

  const liveClass = await LiveClass.findOne(filter)
    .select("+meetingPassword")
    .populate({
      path: "course",
      select: "title slug thumbnailUrl status isPublished isActive",
    })
    .populate({
      path: "module",
      select: "title order isPublished isActive",
    })
    .populate({
      path: "lecture",
      select: "title type order isPublished isActive",
    })
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  return liveClass;
}

export async function cancelLiveClass({
  instructorId,
  userRole,
  liveClassId,
  reason,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(liveClassId, "live class ID");

  const normalizedReason = String(reason || "").trim();

  if (!normalizedReason) {
    throw new ApiError(400, "Cancellation reason is required");
  }

  if (normalizedReason.length > 1000) {
    throw new ApiError(
      400,
      "Cancellation reason cannot exceed 1000 characters",
    );
  }

  const filter = { _id: liveClassId };
  if (userRole !== "admin") {
    filter.instructor = instructorId;
  }

  const liveClass = await LiveClass.findOne(filter);

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  if (["completed", "archived"].includes(liveClass.status)) {
    throw new ApiError(
      409,
      `${liveClass.status} live class cannot be cancelled`,
    );
  }

  if (liveClass.status === "cancelled") {
    return {
      liveClass,
      message: "Live class is already cancelled",
    };
  }

  liveClass.status = "cancelled";
  liveClass.isPublished = false;
  liveClass.cancelledAt = new Date();
  liveClass.cancellationReason = normalizedReason;

  await liveClass.save();

  let notificationResult = null;

  try {
    notificationResult = await notifyStudentsForLiveClass({
      liveClass,
      event: "cancelled",
    });
  } catch (error) {
    console.error("Live class cancellation notification failed:", error);
  }

  return {
    liveClass,
    notificationResult,

    message: "Live class cancelled successfully",
  };
}

export async function updateLiveClassStatus({
  instructorId,
  userRole,
  liveClassId,
  status,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(liveClassId, "live class ID");

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "scheduled", "live", "completed", "cancelled", "archived"],
    "Live class status",
  );

  const filter = { _id: liveClassId };
  if (userRole !== "admin") {
    filter.instructor = instructorId;
  }

  const liveClass = await LiveClass.findOne(filter);

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  if (liveClass.status === parsedStatus) {
    return {
      liveClass,
      message: `Live class is already ${parsedStatus}`,
    };
  }

  const allowedTransitions = {
    draft: ["scheduled", "cancelled", "archived"],

    scheduled: ["draft", "live", "cancelled", "archived"],

    live: ["completed", "cancelled"],

    completed: ["archived"],

    cancelled: ["draft", "archived"],

    archived: ["draft"],
  };

  const allowed = allowedTransitions[liveClass.status] ?? [];

  if (!allowed.includes(parsedStatus)) {
    throw new ApiError(
      400,
      `Live class status cannot change from ${liveClass.status} to ${parsedStatus}`,
    );
  }

  if (parsedStatus === "scheduled") {
    const course = await Course.findOne({
      _id: liveClass.course,
      instructor: instructorId,
      status: "published",
      isPublished: true,
      isActive: true,
    }).lean();

    if (!course) {
      throw new ApiError(
        400,
        "Course must be published and active before scheduling live class",
      );
    }

    if (new Date(liveClass.endsAt) <= new Date()) {
      throw new ApiError(400, "Past live class cannot be scheduled");
    }

    liveClass.status = "scheduled";
    liveClass.isPublished = true;
    liveClass.isActive = true;
    liveClass.publishedAt = liveClass.publishedAt ?? new Date();
  }

  if (parsedStatus === "draft") {
    liveClass.status = "draft";
    liveClass.isPublished = false;
    liveClass.isActive = true;
    liveClass.publishedAt = null;

    liveClass.cancelledAt = null;
    liveClass.cancellationReason = "";
  }

  if (parsedStatus === "live") {
    liveClass.status = "live";
    liveClass.isPublished = true;
    liveClass.isActive = true;

    liveClass.startedAtActual = liveClass.startedAtActual ?? new Date();
  }

  if (parsedStatus === "completed") {
    const now = new Date();

    liveClass.status = "completed";

    liveClass.isPublished = true;

    liveClass.isActive = true;

    liveClass.endedAtActual = liveClass.endedAtActual ?? now;
  }

  if (parsedStatus === "cancelled") {
    liveClass.status = "cancelled";
    liveClass.isPublished = false;
    liveClass.isActive = true;
    liveClass.cancelledAt = new Date();
  }

  if (parsedStatus === "archived") {
    liveClass.status = "archived";
    liveClass.isPublished = false;
    liveClass.isActive = false;
  }

  await liveClass.save();

  let attendanceFinalization = null;
  let notificationResult = null;

  if (parsedStatus === "completed") {
    attendanceFinalization = await finalizeLiveClassAttendance({
      liveClassId: liveClass._id,
      liveClass,
    });
  }

  if (["scheduled", "live", "completed"].includes(parsedStatus)) {
    try {
      notificationResult = await notifyStudentsForLiveClass({
        liveClass,
        event: parsedStatus,
      });
    } catch (error) {
      console.error("Live class notification failed:", error);
    }
  }

  return {
    liveClass,
    attendanceFinalization,
    notificationResult,

    message: `Live class status updated to ${parsedStatus}`,
  };
}

export async function updateLiveClass({
  instructorId,
  userRole,
  liveClassId,
  payload,
}) {
  validateObjectId(
    instructorId,
    "instructor ID",
  );

  validateObjectId(
    liveClassId,
    "live class ID",
  );

  if (
    !payload ||
    Object.keys(payload).length === 0
  ) {
    throw new ApiError(
      400,
      "At least one field is required for update",
    );
  }

  /*
   * Instructor sirf apni class update karega.
   * Admin kisi bhi live class ko update kar sakta hai.
   */
  const filter = {
    _id: liveClassId,
  };

  if (userRole !== "admin") {
    filter.instructor =
      instructorId;
  }

  const liveClass =
    await LiveClass.findOne(
      filter,
    ).select(
      "+meetingPassword",
    );

  if (!liveClass) {
    throw new ApiError(
      404,
      "Live class not found",
    );
  }

  if (
    [
      "completed",
      "cancelled",
      "archived",
    ].includes(
      liveClass.status,
    )
  ) {
    throw new ApiError(
      400,
      `${liveClass.status} live class cannot be updated`,
    );
  }

  /*
   * Course change allow nahi karenge.
   */
  if (
    payload.courseId !== undefined ||
    payload.course !== undefined
  ) {
    throw new ApiError(
      400,
      "Live class course cannot be changed",
    );
  }

  /*
   * Existing schedule snapshot.
   *
   * Isse detect karenge ki class reschedule hui hai
   * ya nahi.
   */
  const originalStartsAt =
    liveClass.startsAt
      ? new Date(
          liveClass.startsAt,
        )
      : null;

  const originalEndsAt =
    liveClass.endsAt
      ? new Date(
          liveClass.endsAt,
        )
      : null;

  /*
   * Title
   */
  if (
    payload.title !== undefined
  ) {
    const title = String(
      payload.title || "",
    ).trim();

    if (title.length < 3) {
      throw new ApiError(
        400,
        "Live class title must be at least 3 characters",
      );
    }

    if (title.length > 200) {
      throw new ApiError(
        400,
        "Live class title cannot exceed 200 characters",
      );
    }

    liveClass.title = title;
  }

  /*
   * Description
   */
  if (
    payload.description !==
    undefined
  ) {
    const description =
      String(
        payload.description ||
          "",
      ).trim();

    if (
      description.length >
      5000
    ) {
      throw new ApiError(
        400,
        "Live class description cannot exceed 5000 characters",
      );
    }

    liveClass.description =
      description;
  }

  /*
   * Provider
   */
  if (
    payload.provider !==
    undefined
  ) {
    liveClass.provider =
      parseEnumQuery(
        payload.provider,
        LIVE_CLASS_PROVIDERS,
        "Live class provider",
      );
  }

  /*
   * Meeting URL
   */
  if (
    payload.meetingUrl !==
    undefined
  ) {
    liveClass.meetingUrl =
      normalizeMeetingUrl(
        payload.meetingUrl,
      );
  }

  /*
   * Meeting ID
   */
  if (
    payload.meetingId !==
    undefined
  ) {
    liveClass.meetingId =
      String(
        payload.meetingId ||
          "",
      ).trim();
  }

  /*
   * Meeting Password
   */
  if (
    payload.meetingPassword !==
    undefined
  ) {
    liveClass.meetingPassword =
      String(
        payload.meetingPassword ||
          "",
      ).trim();
  }

  /*
   * New start/end values.
   */
  let nextStartsAt =
    liveClass.startsAt;

  let nextEndsAt =
    liveClass.endsAt;

  if (
    payload.startsAt !==
    undefined
  ) {
    nextStartsAt =
      parseLiveClassDate(
        payload.startsAt,
        "Start time",
      );
  }

  if (
    payload.endsAt !==
    undefined
  ) {
    nextEndsAt =
      parseLiveClassDate(
        payload.endsAt,
        "End time",
      );
  }

  if (
    nextEndsAt <= nextStartsAt
  ) {
    throw new ApiError(
      400,
      "Live class end time must be after start time",
    );
  }

  const durationInMinutes =
    Math.ceil(
      (
        nextEndsAt.getTime() -
        nextStartsAt.getTime()
      ) /
        60000,
    );

  if (
    durationInMinutes > 1440
  ) {
    throw new ApiError(
      400,
      "Live class duration cannot exceed 24 hours",
    );
  }

  /*
   * Instructor overlap validation.
   *
   * Admin kisi aur instructor ki class edit kar sakta hai,
   * isliye request user id nahi, actual class instructor
   * use karenge.
   */
  const classInstructorId =
    liveClass.instructor;

  const overlappingClass =
    await LiveClass.exists({
      _id: {
        $ne:
          liveClass._id,
      },

      instructor:
        classInstructorId,

      status: {
        $in: [
          "scheduled",
          "live",
        ],
      },

      startsAt: {
        $lt:
          nextEndsAt,
      },

      endsAt: {
        $gt:
          nextStartsAt,
      },
    });

  if (overlappingClass) {
    throw new ApiError(
      409,
      "Another live class is already scheduled during this time",
    );
  }

  /*
   * Update schedule.
   */
  liveClass.startsAt =
    nextStartsAt;

  liveClass.endsAt =
    nextEndsAt;

  liveClass.durationInMinutes =
    durationInMinutes;

  /*
   * Schedule changed?
   */
  const scheduleChanged =
    !originalStartsAt ||
    !originalEndsAt ||
    originalStartsAt.getTime() !==
      nextStartsAt.getTime() ||
    originalEndsAt.getTime() !==
      nextEndsAt.getTime();

  /*
   * Reschedule hone par reminder flags reset.
   *
   * Isse new schedule ke according 24h / 1h / 10m
   * reminders dobara send ho sakenge.
   */
  if (scheduleChanged) {
    liveClass.reminders = {
      reminder24HoursSent:
        false,

      reminder1HourSent:
        false,

      reminder10MinutesSent:
        false,
    };
  }

  /*
   * Early join.
   */
  if (
    payload.allowEarlyJoinMinutes !==
    undefined
  ) {
    liveClass.allowEarlyJoinMinutes =
      parseNumberQuery(
        payload.allowEarlyJoinMinutes,
        {
          fieldName:
            "Allow early join minutes",

          min: 0,

          max: 120,

          integer: true,
        },
      );
  }

  /*
   * Maximum participants.
   */
  if (
    payload.maxParticipants !==
    undefined
  ) {
    liveClass.maxParticipants =
      payload.maxParticipants ===
        null ||
      payload.maxParticipants ===
        ""
        ? null
        : parseNumberQuery(
            payload.maxParticipants,
            {
              fieldName:
                "Maximum participants",

              min: 1,

              max: 100000,

              integer: true,
            },
          );
  }

  /*
   * Recording setting.
   */
  if (
    payload.recordingEnabled !==
    undefined
  ) {
    liveClass.recordingEnabled =
      typeof payload.recordingEnabled ===
      "boolean"
        ? payload.recordingEnabled
        : parseBooleanQuery(
            payload.recordingEnabled,
            "recordingEnabled",
          );
  }

  /*
   * Timezone.
   */
  if (
    payload.timezone !==
    undefined
  ) {
    liveClass.timezone =
      String(
        payload.timezone ||
          "",
      ).trim() ||
      "Asia/Kolkata";
  }

  /*
   * Save final document.
   */
  await liveClass.save();

  return {
    liveClass,

    scheduleChanged,

    message:
      scheduleChanged
        ? "Live class rescheduled successfully"
        : "Live class updated successfully",
  };
}

export async function getStudentLiveClasses({ studentId, query = {} }) {
  validateObjectId(studentId, "student ID");

  const {
    course,
    status = "upcoming",
    sortBy = "startsAt",
    order = "asc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const now = new Date();

  const enrollments = await Enrollment.find({
    student: studentId,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("course expiresAt")
    .lean();

  const validCourseIds = enrollments
    .filter(
      (enrollment) =>
        !enrollment.expiresAt ||
        new Date(enrollment.expiresAt).getTime() > now.getTime(),
    )
    .map((enrollment) => enrollment.course);

  if (validCourseIds.length === 0) {
    return {
      liveClasses: [],
      pagination: buildPaginationMeta({
        page,
        limit,
        totalRecords: 0,
      }),
    };
  }

  const filter = {
    course: {
      $in: validCourseIds,
    },
    isActive: true,
    isPublished: true,
    status: {
      $in: ["scheduled", "live", "completed"],
    },
  };

  if (course) {
    validateObjectId(course, "course ID");

    const isEnrolled = validCourseIds.some(
      (courseId) => courseId.toString() === String(course),
    );

    if (!isEnrolled) {
      throw new ApiError(403, "You are not enrolled in this course");
    }

    filter.course = course;
  }

  const parsedStatus =
    parseEnumQuery(
      status,
      ["upcoming", "live", "completed", "all"],
      "Live class filter",
    ) ?? "upcoming";

  if (parsedStatus === "upcoming") {
    filter.startsAt = {
      $gt: now,
    };

    filter.status = "scheduled";
  }

  if (parsedStatus === "live") {
    filter.status = "live";
  }

  if (parsedStatus === "completed") {
    filter.status = "completed";
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "startsAt",
      "endsAt",
      "createdAt",
      "title",
      "durationInMinutes",
    ],
    defaultField: "startsAt",
    defaultOrder: "asc",
  });

  const [liveClasses, totalRecords] = await Promise.all([
    LiveClass.find(filter)
      .select(
        `
          course
          module
          lecture
          instructor
          title
          description
          provider
          startsAt
          endsAt
          timezone
          durationInMinutes
          allowEarlyJoinMinutes
          maxParticipants
          recordingEnabled
          recordingUrl
          notesUrl
          status
          publishedAt
          createdAt
        `,
      )
      .populate({
        path: "course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "module",
        select: "title order",
      })
      .populate({
        path: "lecture",
        select: "title type order",
      })
      .populate({
        path: "instructor",
        select: "fullName avatarUrl",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    LiveClass.countDocuments(filter),
  ]);

  const formatted = liveClasses.map((liveClass) => {
    const startsAt = new Date(liveClass.startsAt);

    const joinOpensAt = new Date(
      startsAt.getTime() - (liveClass.allowEarlyJoinMinutes ?? 0) * 60 * 1000,
    );

    const joinClosesAt = new Date(liveClass.endsAt);

    const canJoin =
      ["scheduled", "live"].includes(liveClass.status) &&
      now >= joinOpensAt &&
      now < joinClosesAt;

    return {
      ...liveClass,

      join: {
        canJoin,
        joinOpensAt,
        joinClosesAt,
      },
    };
  });

  return {
    liveClasses: formatted,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      course: course || null,
      status: parsedStatus,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getStudentLiveClassById({ studentId, liveClassId }) {
  validateObjectId(studentId, "student ID");
  validateObjectId(liveClassId, "live class ID");

  const now = new Date();

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    isActive: true,
    isPublished: true,
    status: {
      $in: ["scheduled", "live", "completed"],
    },
  })
    .select(
      `
        course
        module
        lecture
        instructor
        title
        description
        provider
        startsAt
        endsAt
        timezone
        durationInMinutes
        allowEarlyJoinMinutes
        maxParticipants
        recordingEnabled
        recordingUrl
        notesUrl
        status
        publishedAt
      `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .populate({
      path: "module",
      select: "title order",
    })
    .populate({
      path: "lecture",
      select: "title type order",
    })
    .populate({
      path: "instructor",
      select: "fullName avatarUrl",
    })
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: liveClass.course._id,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("_id expiresAt")
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(403, "Your course enrollment has expired");
  }

  const joinOpensAt = new Date(
    new Date(liveClass.startsAt).getTime() -
      (liveClass.allowEarlyJoinMinutes ?? 0) * 60 * 1000,
  );

  const joinClosesAt = new Date(liveClass.endsAt);

  const canJoin =
    ["scheduled", "live"].includes(liveClass.status) &&
    now >= joinOpensAt &&
    now < joinClosesAt;

  return {
    liveClass,

    join: {
      canJoin,
      joinOpensAt,
      joinClosesAt,
    },
  };
}

export async function joinStudentLiveClass({ studentId, liveClassId }) {
  validateObjectId(studentId, "student ID");

  validateObjectId(liveClassId, "live class ID");

  const now = new Date();

  /*
   * Joinable live class fetch.
   *
   * meetingPassword normally hidden hai,
   * is endpoint par explicitly select karenge.
   */
  const liveClass = await LiveClass.findOne({
    _id: liveClassId,

    isActive: true,

    isPublished: true,

    status: {
      $in: ["scheduled", "live"],
    },
  })
    .select(
      `
        +meetingPassword

        course
        title

        provider

        meetingUrl
        meetingId

        startsAt
        endsAt

        allowEarlyJoinMinutes

        maxParticipants

        status
      `,
    )
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found or not joinable");
  }

  /*
   * Student enrollment validation.
   */
  const enrollment = await Enrollment.findOne({
    student: studentId,

    course: liveClass.course,

    status: {
      $in: ["active", "completed"],
    },
  })
    .select(
      `
        _id
        expiresAt
      `,
    )
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  /*
   * Enrollment expiry validation.
   */
  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(403, "Your course enrollment has expired");
  }

  /*
   * Join window calculate.
   */
  const joinOpensAt = new Date(
    new Date(liveClass.startsAt).getTime() -
      (liveClass.allowEarlyJoinMinutes ?? 0) * 60 * 1000,
  );

  const joinClosesAt = new Date(liveClass.endsAt);

  /*
   * Too early.
   */
  if (now < joinOpensAt) {
    throw new ApiError(
      403,
      `Live class can be joined ${liveClass.allowEarlyJoinMinutes ?? 0} minutes before start time`,
    );
  }

  /*
   * Class ended.
   */
  if (now >= joinClosesAt) {
    throw new ApiError(410, "Live class has ended");
  }

  /*
   * Ab saari security validations complete hain.
   *
   * Iske baad attendance record create/resume karna safe hai.
   */
  const attendanceResult = await joinLiveClassAttendance({
    studentId,
    liveClassId,
  });

  /*
   * Meeting credentials sirf secure join endpoint
   * ke response me return karenge.
   */
  return {
    liveClass: {
      id: liveClass._id,

      title: liveClass.title,

      provider: liveClass.provider,

      status: liveClass.status,
    },

    meeting: {
      url: liveClass.meetingUrl,

      meetingId: liveClass.meetingId || null,

      password: liveClass.meetingPassword || null,
    },

    enrollmentId: enrollment._id,

    attendance: {
      id: attendanceResult.attendance._id,

      status: attendanceResult.attendance.status,

      joinCount: attendanceResult.attendance.joinCount,

      resumedSession: attendanceResult.resumedSession,
    },

    joinWindow: {
      joinOpensAt,
      joinClosesAt,
    },

    message: "Live class join access granted",
  };
}
function calculateAttendancePercentage({
  totalDurationInSeconds,
  liveClassDurationInMinutes,
}) {
  const totalClassSeconds = Number(liveClassDurationInMinutes || 0) * 60;

  if (totalClassSeconds <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Number(((totalDurationInSeconds / totalClassSeconds) * 100).toFixed(2)),
  );
}

export async function joinLiveClassAttendance({ studentId, liveClassId }) {
  validateObjectId(studentId, "student ID");
  validateObjectId(liveClassId, "live class ID");

  const now = new Date();

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    isActive: true,
    isPublished: true,
    status: {
      $in: ["scheduled", "live"],
    },
  })
    .select(
      `
        course
        title
        startsAt
        endsAt
        durationInMinutes
        allowEarlyJoinMinutes
      `,
    )
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found or not joinable");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: liveClass.course,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("_id expiresAt")
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  const joinOpensAt = new Date(
    new Date(liveClass.startsAt).getTime() -
      (liveClass.allowEarlyJoinMinutes ?? 0) * 60 * 1000,
  );

  if (now < joinOpensAt) {
    throw new ApiError(403, "Live class join window has not opened yet");
  }

  if (now >= new Date(liveClass.endsAt)) {
    throw new ApiError(410, "Live class has ended");
  }

  let attendance = await LiveClassAttendance.findOne({
    liveClass: liveClassId,
    student: studentId,
  });

  if (!attendance) {
    attendance = await LiveClassAttendance.create({
      liveClass: liveClassId,
      course: liveClass.course,
      student: studentId,
      enrollment: enrollment._id,

      firstJoinedAt: now,
      lastJoinedAt: now,

      totalDurationInSeconds: 0,
      joinCount: 1,

      isPresent: true,
      status: "present",

      sessions: [
        {
          joinedAt: now,
          leftAt: null,
          durationInSeconds: 0,
        },
      ],
    });

    return {
      attendance,
      resumedSession: false,
      message: "Live class attendance started",
    };
  }

  const activeSession = attendance.sessions.find(
    (session) => session.leftAt === null,
  );

  if (activeSession) {
    return {
      attendance,
      resumedSession: true,
      message: "Student is already marked present",
    };
  }

  attendance.sessions.push({
    joinedAt: now,
    leftAt: null,
    durationInSeconds: 0,
  });

  attendance.lastJoinedAt = now;
  attendance.joinCount += 1;
  attendance.isPresent = true;
  attendance.status = "present";

  await attendance.save();

  return {
    attendance,
    resumedSession: false,
    message: "Live class attendance resumed",
  };
}

export async function leaveLiveClassAttendance({ studentId, liveClassId }) {
  validateObjectId(studentId, "student ID");
  validateObjectId(liveClassId, "live class ID");

  const now = new Date();

  const liveClass = await LiveClass.findById(liveClassId)
    .select(
      `
        durationInMinutes
        status
        endsAt
      `,
    )
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const attendance = await LiveClassAttendance.findOne({
    liveClass: liveClassId,
    student: studentId,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  const activeSession = [...attendance.sessions]
    .reverse()
    .find((session) => session.leftAt === null);

  if (!activeSession) {
    return {
      attendance,
      message: "Student has already left the live class",
    };
  }

  activeSession.leftAt = now;

  activeSession.durationInSeconds = Math.max(
    0,
    Math.floor(
      (now.getTime() - new Date(activeSession.joinedAt).getTime()) / 1000,
    ),
  );

  attendance.totalDurationInSeconds += activeSession.durationInSeconds;

  attendance.lastLeftAt = now;

  attendance.isPresent = false;

  attendance.status =
    liveClass.status === "completed" || now >= new Date(liveClass.endsAt)
      ? "completed"
      : "left";

  attendance.attendancePercentage = calculateAttendancePercentage({
    totalDurationInSeconds: attendance.totalDurationInSeconds,

    liveClassDurationInMinutes: liveClass.durationInMinutes,
  });

  await attendance.save();

  return {
    attendance,
    message: "Live class attendance updated successfully",
  };
}

export async function getInstructorLiveClassAttendance({
  instructorId,
  liveClassId,
  query = {},
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(liveClassId, "live class ID");

  const {
    search,
    status,
    isPresent,
    sortBy = "totalDurationInSeconds",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    instructor: instructorId,
  })
    .select(
      `
        title
        course
        startsAt
        endsAt
        durationInMinutes
        status
      `,
    )
    .populate({
      path: "course",
      select: "title slug",
    })
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const filter = {
    liveClass: liveClassId,
  };

  const parsedStatus = parseEnumQuery(
    status,
    ["not_joined", "present", "left", "completed"],
    "Attendance status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedIsPresent = parseBooleanQuery(isPresent, "isPresent");

  if (parsedIsPresent !== undefined) {
    filter.isPresent = parsedIsPresent;
  }

  if (search?.trim()) {
    const escapedSearch = escapeRegex(search.trim());

    const matchingStudents = await User.find({
      role: "student",

      $or: [
        {
          fullName: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ],
    })
      .select("_id")
      .lean();

    filter.student = {
      $in: matchingStudents.map((student) => student._id),
    };
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: [
      "firstJoinedAt",
      "lastJoinedAt",
      "lastLeftAt",
      "totalDurationInSeconds",
      "attendancePercentage",
      "joinCount",
      "createdAt",
      "updatedAt",
    ],

    defaultField: "totalDurationInSeconds",

    defaultOrder: "desc",
  });

  const [records, totalRecords] = await Promise.all([
    LiveClassAttendance.find(filter)
      .populate({
        path: "student",
        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "enrollment",
        select: "status progressPercentage enrolledAt",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    LiveClassAttendance.countDocuments(filter),
  ]);

  return {
    liveClass,

    attendance: records,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      status: parsedStatus ?? null,
      isPresent: parsedIsPresent ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getInstructorLiveClassAttendanceAnalytics({
  instructorId,
  liveClassId,
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(liveClassId, "live class ID");

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    instructor: instructorId,
  })
    .select(
      `
        title
        course
        startsAt
        endsAt
        durationInMinutes
        status
      `,
    )
    .populate({
      path: "course",
      select: "title slug",
    })
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const [totalEligibleStudents, statsResult, joinedStudentIds] =
    await Promise.all([
      Enrollment.countDocuments({
        course: liveClass.course._id,
        status: {
          $in: ["active", "completed"],
        },
      }),

      LiveClassAttendance.aggregate([
        {
          $match: {
            liveClass: new mongoose.Types.ObjectId(liveClassId),
          },
        },

        {
          $group: {
            _id: null,

            totalJoinedStudents: {
              $sum: 1,
            },

            currentlyPresent: {
              $sum: {
                $cond: ["$isPresent", 1, 0],
              },
            },

            completedAttendance: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "completed"],
                  },
                  1,
                  0,
                ],
              },
            },

            averageDurationInSeconds: {
              $avg: "$totalDurationInSeconds",
            },

            averageAttendancePercentage: {
              $avg: "$attendancePercentage",
            },

            highestAttendancePercentage: {
              $max: "$attendancePercentage",
            },

            lowestAttendancePercentage: {
              $min: "$attendancePercentage",
            },

            totalJoinEvents: {
              $sum: "$joinCount",
            },
          },
        },
      ]),

      LiveClassAttendance.find({
        liveClass: liveClassId,
      })
        .select("student")
        .lean(),
    ]);

  const stats = statsResult[0] ?? {
    totalJoinedStudents: 0,
    currentlyPresent: 0,
    completedAttendance: 0,
    averageDurationInSeconds: 0,
    averageAttendancePercentage: 0,
    highestAttendancePercentage: 0,
    lowestAttendancePercentage: 0,
    totalJoinEvents: 0,
  };

  const joinedIds = joinedStudentIds.map((item) => item.student);

  const missedStudents = await Enrollment.find({
    course: liveClass.course._id,

    status: {
      $in: ["active", "completed"],
    },

    student: {
      $nin: joinedIds,
    },
  })
    .select("student")
    .populate({
      path: "student",
      select: "fullName email avatarUrl",
    })
    .lean();

  const attendanceRate =
    totalEligibleStudents > 0
      ? Number(
          ((stats.totalJoinedStudents / totalEligibleStudents) * 100).toFixed(
            2,
          ),
        )
      : 0;

  const missedCount = Math.max(
    totalEligibleStudents - stats.totalJoinedStudents,
    0,
  );

  return {
    liveClass,

    summary: {
      totalEligibleStudents,

      totalJoinedStudents: stats.totalJoinedStudents ?? 0,

      missedStudents: missedCount,

      attendanceRate,

      currentlyPresent: stats.currentlyPresent ?? 0,

      completedAttendance: stats.completedAttendance ?? 0,

      totalJoinEvents: stats.totalJoinEvents ?? 0,

      averageDurationInSeconds: Number(
        (stats.averageDurationInSeconds ?? 0).toFixed(2),
      ),

      averageAttendancePercentage: Number(
        (stats.averageAttendancePercentage ?? 0).toFixed(2),
      ),

      highestAttendancePercentage: Number(
        (stats.highestAttendancePercentage ?? 0).toFixed(2),
      ),

      lowestAttendancePercentage: Number(
        (stats.lowestAttendancePercentage ?? 0).toFixed(2),
      ),
    },

    missedStudents: missedStudents.map((item) => item.student),
  };
}

async function finalizeLiveClassAttendance({ liveClassId, liveClass }) {
  const effectiveEndTime = liveClass.endedAtActual
    ? new Date(liveClass.endedAtActual)
    : new Date();

  const attendanceRecords = await LiveClassAttendance.find({
    liveClass: liveClassId,
  });

  for (const attendance of attendanceRecords) {
    let addedDuration = 0;

    for (const session of attendance.sessions) {
      if (session.leftAt !== null) {
        continue;
      }

      /*
       * Session ko actual class end time par close karenge.
       *
       * Agar current time class ke scheduled endsAt se aage hai,
       * to scheduled end time se zyada attendance count nahi karenge.
       */
      const scheduledEndTime = new Date(liveClass.endsAt);

      const sessionEndTime =
        effectiveEndTime < scheduledEndTime
          ? effectiveEndTime
          : scheduledEndTime;

      session.leftAt = sessionEndTime;

      session.durationInSeconds = Math.max(
        0,
        Math.floor(
          (sessionEndTime.getTime() - new Date(session.joinedAt).getTime()) /
            1000,
        ),
      );

      addedDuration += session.durationInSeconds;
    }

    attendance.totalDurationInSeconds += addedDuration;

    attendance.totalDurationInSeconds = Math.min(
      attendance.totalDurationInSeconds,

      Number(liveClass.durationInMinutes || 0) * 60,
    );

    if (attendance.sessions.length > 0) {
      const latestClosedSession = [...attendance.sessions]
        .reverse()
        .find((session) => session.leftAt !== null);

      attendance.lastLeftAt =
        latestClosedSession?.leftAt ?? attendance.lastLeftAt;
    }

    attendance.isPresent = false;

    attendance.status = "completed";

    attendance.attendancePercentage = calculateAttendancePercentage({
      totalDurationInSeconds: attendance.totalDurationInSeconds,

      liveClassDurationInMinutes: liveClass.durationInMinutes,
    });

    await attendance.save();
  }

  return {
    finalizedCount: attendanceRecords.length,
  };
}

async function getActiveEnrolledStudentIds(courseId) {
  const now = new Date();

  const enrollments = await Enrollment.find({
    course: courseId,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("student expiresAt")
    .lean();

  return enrollments
    .filter(
      (enrollment) =>
        !enrollment.expiresAt ||
        new Date(enrollment.expiresAt).getTime() > now.getTime(),
    )
    .map((enrollment) => enrollment.student.toString());
}

async function notifyStudentsForLiveClass({ liveClass, event }) {
  const studentIds = await getActiveEnrolledStudentIds(liveClass.course);

  if (studentIds.length === 0) {
    return {
      insertedCount: 0,
    };
  }

  let title = "";
  let message = "";

  if (event === "scheduled") {
    title = "Live class scheduled";

    message =
      `"${liveClass.title}" has been scheduled for ` +
      `${new Date(liveClass.startsAt).toLocaleString("en-IN")}.`;
  }

  if (event === "live") {
    title = "Live class started";

    message = `"${liveClass.title}" is live now.`;
  }

  if (event === "cancelled") {
    title = "Live class cancelled";

    message =
      `"${liveClass.title}" has been cancelled.` +
      (liveClass.cancellationReason
        ? ` Reason: ${liveClass.cancellationReason}`
        : "");
  }

  if (event === "completed") {
    title = "Live class completed";

    message = `"${liveClass.title}" has been completed.`;
  }

  if (!title || !message) {
    return {
      insertedCount: 0,
    };
  }

  return createBulkNotifications({
    userIds: studentIds,

    title,

    message,

    type: "live_class",

    resourceType: "live_class",

    resourceId: liveClass._id,

    courseId: liveClass.course,

    actionUrl: `/student/live-classes/${liveClass._id}`,

    metadata: {
      liveClassId: liveClass._id.toString(),

      event,

      startsAt: liveClass.startsAt,

      endsAt: liveClass.endsAt,

      status: liveClass.status,
    },
  });
}
