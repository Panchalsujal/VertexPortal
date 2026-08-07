import mongoose from "mongoose";

import LiveClass from "../models/liveClass.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";

import { validateObjectId } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { buildSearchFilter } from "../utils/search.js";

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

export async function createLiveClass({ instructorId, payload }) {
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

  const course = await Course.findOne({
    _id: courseId,
    instructor: instructorId,
    isActive: true,
  })
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
      "Course not found or you are not the course instructor",
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

    status: "draft",

    isPublished: false,

    publishedAt: null,

    isActive: true,
  });

  return liveClass;
}

export async function getInstructorLiveClasses({ instructorId, query = {} }) {
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

  const filter = {
    instructor: instructorId,
  };

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
  liveClassId,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(liveClassId, "live class ID");

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    instructor: instructorId,
  })
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

export async function cancelLiveClass({ instructorId, liveClassId, reason }) {
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

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    instructor: instructorId,
  });

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

  return {
    liveClass,
    message: "Live class cancelled successfully",
  };
}

export async function updateLiveClassStatus({
  instructorId,
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

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    instructor: instructorId,
  });

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
    liveClass.status = "completed";
    liveClass.isPublished = true;
    liveClass.isActive = true;

    liveClass.endedAtActual = liveClass.endedAtActual ?? new Date();
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

  return {
    liveClass,
    message: `Live class status updated to ${parsedStatus}`,
  };
}

export async function updateLiveClass({ instructorId, liveClassId, payload }) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(liveClassId, "live class ID");

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const liveClass = await LiveClass.findOne({
    _id: liveClassId,
    instructor: instructorId,
  }).select("+meetingPassword");

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  if (["completed", "cancelled", "archived"].includes(liveClass.status)) {
    throw new ApiError(400, `${liveClass.status} live class cannot be updated`);
  }

  if (payload.courseId !== undefined || payload.course !== undefined) {
    throw new ApiError(400, "Live class course cannot be changed");
  }

  if (payload.title !== undefined) {
    const title = String(payload.title || "").trim();

    if (title.length < 3) {
      throw new ApiError(400, "Live class title must be at least 3 characters");
    }

    if (title.length > 200) {
      throw new ApiError(400, "Live class title cannot exceed 200 characters");
    }

    liveClass.title = title;
  }

  if (payload.description !== undefined) {
    const description = String(payload.description || "").trim();

    if (description.length > 5000) {
      throw new ApiError(
        400,
        "Live class description cannot exceed 5000 characters",
      );
    }

    liveClass.description = description;
  }

  if (payload.provider !== undefined) {
    liveClass.provider = parseEnumQuery(
      payload.provider,
      LIVE_CLASS_PROVIDERS,
      "Live class provider",
    );
  }

  if (payload.meetingUrl !== undefined) {
    liveClass.meetingUrl = normalizeMeetingUrl(payload.meetingUrl);
  }

  if (payload.meetingId !== undefined) {
    liveClass.meetingId = String(payload.meetingId || "").trim();
  }

  if (payload.meetingPassword !== undefined) {
    liveClass.meetingPassword = String(payload.meetingPassword || "").trim();
  }

  let nextStartsAt = liveClass.startsAt;

  let nextEndsAt = liveClass.endsAt;

  if (payload.startsAt !== undefined) {
    nextStartsAt = parseLiveClassDate(payload.startsAt, "Start time");
  }

  if (payload.endsAt !== undefined) {
    nextEndsAt = parseLiveClassDate(payload.endsAt, "End time");
  }

  if (nextEndsAt <= nextStartsAt) {
    throw new ApiError(400, "Live class end time must be after start time");
  }

  const durationInMinutes = Math.ceil(
    (nextEndsAt.getTime() - nextStartsAt.getTime()) / 60000,
  );

  if (durationInMinutes > 1440) {
    throw new ApiError(400, "Live class duration cannot exceed 24 hours");
  }

  const overlappingClass = await LiveClass.exists({
    _id: {
      $ne: liveClass._id,
    },
    instructor: instructorId,
    status: {
      $in: ["scheduled", "live"],
    },
    startsAt: {
      $lt: nextEndsAt,
    },
    endsAt: {
      $gt: nextStartsAt,
    },
  });

  if (overlappingClass) {
    throw new ApiError(
      409,
      "Another live class is already scheduled during this time",
    );
  }

  liveClass.startsAt = nextStartsAt;
  liveClass.endsAt = nextEndsAt;
  liveClass.durationInMinutes = durationInMinutes;

  if (payload.allowEarlyJoinMinutes !== undefined) {
    liveClass.allowEarlyJoinMinutes = parseNumberQuery(
      payload.allowEarlyJoinMinutes,
      {
        fieldName: "Allow early join minutes",
        min: 0,
        max: 120,
        integer: true,
      },
    );
  }

  if (payload.maxParticipants !== undefined) {
    liveClass.maxParticipants =
      payload.maxParticipants === null || payload.maxParticipants === ""
        ? null
        : parseNumberQuery(payload.maxParticipants, {
            fieldName: "Maximum participants",
            min: 1,
            max: 100000,
            integer: true,
          });
  }

  if (payload.recordingEnabled !== undefined) {
    liveClass.recordingEnabled =
      typeof payload.recordingEnabled === "boolean"
        ? payload.recordingEnabled
        : parseBooleanQuery(payload.recordingEnabled, "recordingEnabled");
  }

  if (payload.timezone !== undefined) {
    liveClass.timezone =
      String(payload.timezone || "").trim() || "Asia/Kolkata";
  }

  await liveClass.save();

  return {
    liveClass,
    message: "Live class updated successfully",
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

  if (now < joinOpensAt) {
    throw new ApiError(
      403,
      `Live class can be joined ${liveClass.allowEarlyJoinMinutes} minutes before start time`,
    );
  }

  if (now >= joinClosesAt) {
    throw new ApiError(410, "Live class has ended");
  }

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

    joinWindow: {
      joinOpensAt,
      joinClosesAt,
    },

    message: "Live class join access granted",
  };
}
