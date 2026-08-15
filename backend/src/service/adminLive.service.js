import mongoose from "mongoose";

import LiveClass from "../models/liveClass.model.js";
import Enrollment from "../models/enrollment.model.js";

import { ApiError } from "../utils/ApiError.js";
import { validateObjectId, validateRequired } from "../utils/validator.js";
import { buildSearchFilter } from "../utils/searchFilterBuilder.js";
import { logAdminAction } from "../service/adminAuditLogger.service.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import { parseEnumQuery } from "../utils/queryParser.js";
export async function getLiveClassById(liveClassId) {
  validateObjectId(liveClassId, "live class ID");

  const liveClassObjectId = new mongoose.Types.ObjectId(liveClassId);

  const liveClass = await LiveClass.findById(liveClassObjectId)
    .populate({
      path: "course",
      select: `
        title
        slug
        thumbnailUrl
        status
        isPublished
        isActive
        enrolledStudentsCount
      `,
    })
    .populate({
      path: "module",
      select: `
        title
        description
        order
        isPublished
        isActive
      `,
    })
    .populate({
      path: "instructor",
      select: `
        fullName
        email
        avatarUrl
        status
        isActive
      `,
    })
    .populate({
      path: "cancelledBy",
      select: `
        fullName
        email
        avatarUrl
        role
      `,
    })
    .lean();

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const courseId = liveClass.course?._id;

  const enrollmentCount = courseId
    ? await Enrollment.countDocuments({
        course: courseId,
        status: {
          $in: ["active", "completed"],
        },
      })
    : 0;

  const scheduledDurationInSeconds =
    liveClass.scheduledStartAt && liveClass.scheduledEndAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(liveClass.scheduledEndAt).getTime() -
              new Date(liveClass.scheduledStartAt).getTime()) /
              1000,
          ),
        )
      : 0;

  const actualDurationInSeconds =
    liveClass.actualStartAt && liveClass.actualEndAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(liveClass.actualEndAt).getTime() -
              new Date(liveClass.actualStartAt).getTime()) /
              1000,
          ),
        )
      : 0;

  const attendanceCount = liveClass.attendanceCount ?? 0;

  const attendancePercentage =
    enrollmentCount > 0
      ? Number(((attendanceCount / enrollmentCount) * 100).toFixed(2))
      : 0;

  return {
    liveClass,

    summary: {
      enrollmentCount,
      attendanceCount,
      attendancePercentage,

      scheduledDurationInSeconds,
      actualDurationInSeconds,

      isUpcoming:
        liveClass.status === "scheduled" &&
        new Date(liveClass.scheduledStartAt).getTime() > Date.now(),

      isLive: liveClass.status === "live",

      isCompleted: liveClass.status === "completed",

      isCancelled: liveClass.status === "cancelled",

      hasRecording: Boolean(liveClass.recordingUrl),
    },
  };
}

export async function getLiveClasses(query = {}) {
  const {
    search,
    course,
    instructor,
    status,
    meetingProvider,
    isPublished,
    isActive,
    from,
    to,
    sortBy = "scheduledStartAt",
    order = "asc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  const searchFilter = buildSearchFilter(search, [
    "title",
    "description",
    "roomName",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  if (course) {
    validateObjectId(course, "course ID");
    filter.course = course;
  }

  if (instructor) {
    validateObjectId(instructor, "instructor ID");
    filter.instructor = instructor;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["scheduled", "live", "completed", "cancelled"],
    "Live class status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedMeetingProvider = parseEnumQuery(
    meetingProvider,
    ["livekit", "external"],
    "Meeting provider",
  );

  if (parsedMeetingProvider !== undefined) {
    filter.meetingProvider = parsedMeetingProvider;
  }

  const parsedIsPublished = parseBooleanQuery(isPublished, "isPublished");

  const parsedIsActive = parseBooleanQuery(isActive, "isActive");

  if (parsedIsPublished !== undefined) {
    filter.isPublished = parsedIsPublished;
  }

  if (parsedIsActive !== undefined) {
    filter.isActive = parsedIsActive;
  }

  const scheduledDateRange = parseDateRange({
    from,
    to,
    fieldName: "Scheduled start",
  });

  if (scheduledDateRange) {
    filter.scheduledStartAt = scheduledDateRange;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "scheduledStartAt",
      "scheduledEndAt",
      "actualStartAt",
      "actualEndAt",
      "attendanceCount",
      "createdAt",
      "updatedAt",
    ],
    defaultField: "scheduledStartAt",
    defaultOrder: "asc",
  });

  const [liveClasses, totalRecords] = await Promise.all([
    LiveClass.find(filter)
      .select(
        `
        course
        module
        instructor
        title
        description
        scheduledStartAt
        scheduledEndAt
        actualStartAt
        actualEndAt
        status
        meetingProvider
        roomName
        externalMeetingUrl
        recordingUrl
        maxParticipants
        attendanceCount
        isRecordingEnabled
        isPublished
        isActive
        cancellationReason
        cancelledAt
        cancelledBy
        createdAt
        updatedAt
      `,
      )
      .populate({
        path: "course",
        select: "title slug thumbnailUrl status isPublished isActive",
      })
      .populate({
        path: "module",
        select: "title order isPublished isActive",
      })
      .populate({
        path: "instructor",
        select: "fullName email avatarUrl status isActive",
      })
      .populate({
        path: "cancelledBy",
        select: "fullName email avatarUrl role",
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

  return {
    liveClasses,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,
      instructor: instructor || null,
      status: parsedStatus ?? null,
      meetingProvider: parsedMeetingProvider ?? null,
      isPublished: parsedIsPublished ?? null,
      isActive: parsedIsActive ?? null,
      from: from || null,
      to: to || null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function updateLiveClassStatus({
  liveClassId,
  status,
  cancellationReason,
  adminId,
}) {
  validateObjectId(liveClassId, "live class ID");

  const parsedStatus = parseEnumQuery(
    status,
    ["scheduled", "live", "completed", "cancelled"],
    "Live class status",
  );

  if (adminId) {
    validateObjectId(adminId, "admin ID");
  }

  const liveClass = await LiveClass.findById(liveClassId);

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const before = {
    status: liveClass.status,
    isPublished: liveClass.isPublished,
    isActive: liveClass.isActive,
    actualStartAt: liveClass.actualStartAt,
    actualEndAt: liveClass.actualEndAt,
    cancelledAt: liveClass.cancelledAt,
    cancelledBy: liveClass.cancelledBy,
    cancellationReason: liveClass.cancellationReason,
  };

  if (liveClass.status === parsedStatus) {
    return {
      liveClass,
      before,
      after: before,
      changed: false,
      message: `Live class is already ${parsedStatus}`,
    };
  }

  const allowedTransitions = {
    scheduled: ["live", "cancelled"],
    live: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  const allowedNextStatuses = allowedTransitions[liveClass.status] ?? [];

  if (!allowedNextStatuses.includes(parsedStatus)) {
    throw new ApiError(
      400,
      `Live class status cannot change from ${liveClass.status} to ${parsedStatus}`,
    );
  }

  const now = new Date();

  if (parsedStatus === "live") {
    if (
      liveClass.scheduledEndAt &&
      new Date(liveClass.scheduledEndAt).getTime() <= now.getTime()
    ) {
      throw new ApiError(400, "Expired live class cannot be started");
    }

    liveClass.status = "live";
    liveClass.actualStartAt = liveClass.actualStartAt ?? now;
    liveClass.actualEndAt = null;
    liveClass.cancelledAt = null;
    liveClass.cancelledBy = null;
    liveClass.cancellationReason = "";
  }

  if (parsedStatus === "completed") {
    if (!liveClass.actualStartAt) {
      throw new ApiError(400, "Live class must be started before completion");
    }

    liveClass.status = "completed";
    liveClass.actualEndAt = now;
  }

  if (parsedStatus === "cancelled") {
    validateRequired(cancellationReason?.trim(), "Cancellation reason");

    liveClass.status = "cancelled";
    liveClass.isPublished = false;
    liveClass.cancelledAt = now;
    liveClass.cancelledBy = adminId ?? null;
    liveClass.cancellationReason = cancellationReason.trim();

    if (liveClass.actualStartAt && !liveClass.actualEndAt) {
      liveClass.actualEndAt = now;
    }
  }

  await liveClass.save();

  const after = {
    status: liveClass.status,
    isPublished: liveClass.isPublished,
    isActive: liveClass.isActive,
    actualStartAt: liveClass.actualStartAt,
    actualEndAt: liveClass.actualEndAt,
    cancelledAt: liveClass.cancelledAt,
    cancelledBy: liveClass.cancelledBy,
    cancellationReason: liveClass.cancellationReason,
  };

  return {
    liveClass,
    before,
    after,
    changed: true,
    message: `Live class status updated to ${parsedStatus}`,
  };
}

export async function cancelLiveClass({
  liveClassId,
  cancellationReason,
  adminId,
}) {
  validateObjectId(liveClassId, "live class ID");
  validateObjectId(adminId, "admin ID");

  validateRequired(cancellationReason?.trim(), "Cancellation reason");

  const liveClass = await LiveClass.findById(liveClassId);

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const before = {
    status: liveClass.status,
    isActive: liveClass.isActive,
    isPublished: liveClass.isPublished,
    actualStartAt: liveClass.actualStartAt,
    actualEndAt: liveClass.actualEndAt,
    cancelledAt: liveClass.cancelledAt,
    cancelledBy: liveClass.cancelledBy,
    cancellationReason: liveClass.cancellationReason,
  };

  if (liveClass.status === "completed") {
    throw new ApiError(400, "Completed live class cannot be cancelled");
  }

  if (liveClass.status === "cancelled" && liveClass.isActive === false) {
    return {
      liveClass,
      before,
      after: before,
      changed: false,
      message: "Live class is already cancelled",
    };
  }

  const now = new Date();

  liveClass.status = "cancelled";
  liveClass.isActive = false;
  liveClass.isPublished = false;
  liveClass.cancelledAt = now;
  liveClass.cancelledBy = adminId;
  liveClass.cancellationReason = cancellationReason.trim();

  if (liveClass.actualStartAt && !liveClass.actualEndAt) {
    liveClass.actualEndAt = now;
  }

  await liveClass.save();

  const after = {
    status: liveClass.status,
    isActive: liveClass.isActive,
    isPublished: liveClass.isPublished,
    actualStartAt: liveClass.actualStartAt,
    actualEndAt: liveClass.actualEndAt,
    cancelledAt: liveClass.cancelledAt,
    cancelledBy: liveClass.cancelledBy,
    cancellationReason: liveClass.cancellationReason,
  };

  return {
    liveClass,
    before,
    after,
    changed: true,
    message: "Live class cancelled successfully",
  };
}

export async function restoreLiveClass(liveClassId) {
  validateObjectId(liveClassId, "live class ID");

  const liveClass = await LiveClass.findById(liveClassId);

  if (!liveClass) {
    throw new ApiError(404, "Live class not found");
  }

  const before = {
    status: liveClass.status,
    isActive: liveClass.isActive,
    isPublished: liveClass.isPublished,
    actualStartAt: liveClass.actualStartAt,
    actualEndAt: liveClass.actualEndAt,
    cancelledAt: liveClass.cancelledAt,
    cancelledBy: liveClass.cancelledBy,
    cancellationReason: liveClass.cancellationReason,
  };

  if (
    liveClass.status === "scheduled" &&
    liveClass.isActive === true &&
    liveClass.isPublished === true
  ) {
    return {
      liveClass,
      before,
      after: before,
      changed: false,
      message: "Live class is already active",
    };
  }

  if (liveClass.status === "completed") {
    throw new ApiError(400, "Completed live class cannot be restored");
  }

  if (
    liveClass.scheduledStartAt &&
    new Date(liveClass.scheduledStartAt).getTime() <= Date.now()
  ) {
    throw new ApiError(400, "Past live class cannot be restored");
  }

  liveClass.status = "scheduled";
  liveClass.isActive = true;
  liveClass.isPublished = true;

  liveClass.cancelledAt = null;
  liveClass.cancelledBy = null;
  liveClass.cancellationReason = null;

  liveClass.actualStartAt = null;
  liveClass.actualEndAt = null;

  await liveClass.save();

  const after = {
    status: liveClass.status,
    isActive: liveClass.isActive,
    isPublished: liveClass.isPublished,
    actualStartAt: liveClass.actualStartAt,
    actualEndAt: liveClass.actualEndAt,
    cancelledAt: liveClass.cancelledAt,
    cancelledBy: liveClass.cancelledBy,
    cancellationReason: liveClass.cancellationReason,
  };

  return {
    liveClass,
    before,
    after,
    changed: true,
    message: "Live class restored successfully",
  };
}
