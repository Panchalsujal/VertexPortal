import mongoose from "mongoose";

import Announcement from "../models/announcement.model.js";
import Course from "../models/course.model.js";

import { validateObjectId } from "../utils/validator.js";

import { ApiError } from "../utils/ApiError.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { buildSearchFilter } from "../utils/search.js";
import Enrollment from "../models/enrollment.model.js";
import AnnouncementRead from "../models/announcementRead.model.js";
import {
  parseBooleanQuery,
  parseEnumQuery,
  parseSortQuery,
} from "../utils/queryParser.js";

import { createBulkNotifications } from "./notification.service.js";

const ANNOUNCEMENT_TYPES = [
  "general",
  "important",
  "course_update",
  "assignment",
  "quiz",
  "live_class",
];

const RESOURCE_TYPES = ["assignment", "quiz", "lecture", "live_class"];

function parseAnnouncementDate(value, fieldName, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Invalid ${fieldName.toLowerCase()}`);
  }

  return date;
}

export async function createAnnouncement({ instructorId, payload }) {
  validateObjectId(instructorId, "instructor ID");

  const {
    courseId,
    title,
    content,
    type = "general",

    relatedResourceType = null,
    relatedResourceId = null,

    publishAt = new Date(),
    expiresAt = null,

    isPinned = false,
  } = payload || {};

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  validateObjectId(courseId, "course ID");

  const course = await Course.findOne({
    _id: courseId,
    instructor: instructorId,
    isActive: true,
  })
    .select("title instructor status isPublished isActive")
    .lean();

  if (!course) {
    throw new ApiError(
      404,
      "Course not found or you are not the course instructor",
    );
  }

  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle.length < 3) {
    throw new ApiError(400, "Announcement title must be at least 3 characters");
  }

  if (normalizedTitle.length > 200) {
    throw new ApiError(400, "Announcement title cannot exceed 200 characters");
  }

  const normalizedContent = String(content || "").trim();

  if (normalizedContent.length < 3) {
    throw new ApiError(400, "Announcement content is required");
  }

  if (normalizedContent.length > 10000) {
    throw new ApiError(
      400,
      "Announcement content cannot exceed 10000 characters",
    );
  }

  const parsedType =
    parseEnumQuery(type, ANNOUNCEMENT_TYPES, "Announcement type") ?? "general";

  let parsedResourceType = null;
  let parsedResourceId = null;

  if (relatedResourceType) {
    parsedResourceType = parseEnumQuery(
      relatedResourceType,
      RESOURCE_TYPES,
      "Related resource type",
    );

    if (!relatedResourceId) {
      throw new ApiError(400, "Related resource ID is required");
    }

    validateObjectId(relatedResourceId, "related resource ID");

    parsedResourceId = new mongoose.Types.ObjectId(relatedResourceId);
  }

  if (relatedResourceId && !relatedResourceType) {
    throw new ApiError(400, "Related resource type is required");
  }

  const parsedPublishAt = parseAnnouncementDate(publishAt, "Publish date", {
    required: true,
  });

  const parsedExpiresAt = parseAnnouncementDate(expiresAt, "Expiry date");

  if (parsedExpiresAt && parsedExpiresAt <= parsedPublishAt) {
    throw new ApiError(
      400,
      "Announcement expiry date must be after publish date",
    );
  }

  const parsedIsPinned =
    typeof isPinned === "boolean"
      ? isPinned
      : parseBooleanQuery(isPinned, "isPinned");

  const announcement = await Announcement.create({
    course: course._id,
    instructor: instructorId,

    title: normalizedTitle,
    content: normalizedContent,

    type: parsedType,

    relatedResourceType: parsedResourceType,

    relatedResourceId: parsedResourceId,

    publishAt: parsedPublishAt,

    expiresAt: parsedExpiresAt,

    isPinned: parsedIsPinned ?? false,

    status: "draft",
    isPublished: false,
    publishedAt: null,
    isActive: true,
  });

  return announcement;
}

export async function getInstructorAnnouncements({ instructorId, query = {} }) {
  validateObjectId(instructorId, "instructor ID");

  const {
    search,
    course,
    type,
    status,
    isPinned,
    isPublished,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    instructor: instructorId,
  };

  const searchFilter = buildSearchFilter(search, ["title", "content"]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  if (course) {
    validateObjectId(course, "course ID");
    filter.course = course;
  }

  const parsedType = parseEnumQuery(
    type,
    ANNOUNCEMENT_TYPES,
    "Announcement type",
  );

  if (parsedType !== undefined) {
    filter.type = parsedType;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Announcement status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedIsPinned = parseBooleanQuery(isPinned, "isPinned");

  if (parsedIsPinned !== undefined) {
    filter.isPinned = parsedIsPinned;
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
      "createdAt",
      "updatedAt",
      "publishAt",
      "expiresAt",
      "publishedAt",
      "title",
    ],

    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [announcements, totalRecords] = await Promise.all([
    Announcement.find(filter)
      .populate({
        path: "course",
        select: "title slug thumbnailUrl status isPublished isActive",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Announcement.countDocuments(filter),
  ]);

  return {
    announcements,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,
      type: parsedType ?? null,
      status: parsedStatus ?? null,
      isPinned: parsedIsPinned ?? null,
      isPublished: parsedIsPublished ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getInstructorAnnouncementById({
  instructorId,
  announcementId,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(announcementId, "announcement ID");

  const announcement = await Announcement.findOne({
    _id: announcementId,
    instructor: instructorId,
  })
    .populate({
      path: "course",
      select: "title slug thumbnailUrl status isPublished isActive",
    })
    .lean();

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return announcement;
}

export async function updateAnnouncementStatus({
  instructorId,
  announcementId,
  status,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(announcementId, "announcement ID");

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Announcement status",
  );

  const announcement = await Announcement.findOne({
    _id: announcementId,
    instructor: instructorId,
  });

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  if (announcement.status === parsedStatus) {
    return {
      announcement,
      message: `Announcement is already ${parsedStatus}`,
    };
  }

  if (parsedStatus === "published") {
    const course = await Course.findOne({
      _id: announcement.course,
      instructor: instructorId,
      status: "published",
      isPublished: true,
      isActive: true,
    });

    if (!course) {
      throw new ApiError(
        400,
        "Course must be published and active before publishing announcement",
      );
    }

    announcement.status = "published";
    announcement.isPublished = true;
    announcement.isActive = true;
    announcement.publishedAt = announcement.publishedAt ?? new Date();
  }

  if (parsedStatus === "draft") {
    announcement.status = "draft";
    announcement.isPublished = false;
    announcement.isActive = true;
    announcement.publishedAt = null;
  }

  if (parsedStatus === "archived") {
    announcement.status = "archived";
    announcement.isPublished = false;
    announcement.isActive = false;
  }

  await announcement.save();

  if (parsedStatus === "published") {
    try {
      const enrollments = await Enrollment.find({
        course: announcement.course,

        status: {
          $in: ["active", "completed"],
        },
      })
        .select("student expiresAt")
        .lean();

      const now = new Date();

      const studentIds = enrollments
        .filter(
          (enrollment) =>
            !enrollment.expiresAt ||
            new Date(enrollment.expiresAt).getTime() > now.getTime(),
        )
        .map((enrollment) => enrollment.student.toString());

      if (studentIds.length > 0) {
        await createBulkNotifications({
          userIds: studentIds,

          title: announcement.title,

          message:
            announcement.content.length > 250
              ? `${announcement.content.slice(0, 247)}...`
              : announcement.content,

          type: "announcement",

          resourceType: "announcement",

          resourceId: announcement._id,

          courseId: announcement.course,

          actionUrl: `/student/announcements/${announcement._id}`,

          metadata: {
            announcementType: announcement.type,

            isPinned: announcement.isPinned,

            relatedResourceType: announcement.relatedResourceType,

            relatedResourceId: announcement.relatedResourceId,
          },

          expiresAt: announcement.expiresAt,
        });
      }
    } catch (error) {
      console.error("Announcement notifications failed:", error);
    }
  }

  return {
    announcement,
    message: `Announcement status updated to ${parsedStatus}`,
  };
}

export async function updateAnnouncement({
  instructorId,
  announcementId,
  payload,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(announcementId, "announcement ID");

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const announcement = await Announcement.findOne({
    _id: announcementId,
    instructor: instructorId,
  });

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  if (announcement.status === "archived") {
    throw new ApiError(400, "Archived announcement cannot be updated");
  }

  if (payload.courseId !== undefined) {
    throw new ApiError(400, "Announcement course cannot be changed");
  }

  if (payload.title !== undefined) {
    const title = String(payload.title || "").trim();

    if (title.length < 3) {
      throw new ApiError(
        400,
        "Announcement title must be at least 3 characters",
      );
    }

    if (title.length > 200) {
      throw new ApiError(
        400,
        "Announcement title cannot exceed 200 characters",
      );
    }

    announcement.title = title;
  }

  if (payload.content !== undefined) {
    const content = String(payload.content || "").trim();

    if (content.length < 3) {
      throw new ApiError(400, "Announcement content is required");
    }

    if (content.length > 10000) {
      throw new ApiError(
        400,
        "Announcement content cannot exceed 10000 characters",
      );
    }

    announcement.content = content;
  }

  if (payload.type !== undefined) {
    announcement.type = parseEnumQuery(
      payload.type,
      ANNOUNCEMENT_TYPES,
      "Announcement type",
    );
  }

  if (payload.relatedResourceType !== undefined) {
    if (
      payload.relatedResourceType === null ||
      payload.relatedResourceType === ""
    ) {
      announcement.relatedResourceType = null;
      announcement.relatedResourceId = null;
    } else {
      announcement.relatedResourceType = parseEnumQuery(
        payload.relatedResourceType,
        RESOURCE_TYPES,
        "Related resource type",
      );
    }
  }

  if (payload.relatedResourceId !== undefined) {
    if (
      payload.relatedResourceId === null ||
      payload.relatedResourceId === ""
    ) {
      announcement.relatedResourceId = null;
    } else {
      validateObjectId(payload.relatedResourceId, "related resource ID");

      announcement.relatedResourceId = payload.relatedResourceId;
    }
  }

  if (announcement.relatedResourceType && !announcement.relatedResourceId) {
    throw new ApiError(400, "Related resource ID is required");
  }

  if (payload.publishAt !== undefined) {
    announcement.publishAt = parseAnnouncementDate(
      payload.publishAt,
      "Publish date",
      {
        required: true,
      },
    );
  }

  if (payload.expiresAt !== undefined) {
    announcement.expiresAt =
      payload.expiresAt === null || payload.expiresAt === ""
        ? null
        : parseAnnouncementDate(payload.expiresAt, "Expiry date");
  }

  if (
    announcement.publishAt &&
    announcement.expiresAt &&
    announcement.expiresAt <= announcement.publishAt
  ) {
    throw new ApiError(
      400,
      "Announcement expiry date must be after publish date",
    );
  }

  if (payload.isPinned !== undefined) {
    announcement.isPinned =
      typeof payload.isPinned === "boolean"
        ? payload.isPinned
        : parseBooleanQuery(payload.isPinned, "isPinned");
  }

  await announcement.save();

  return {
    announcement,
    message: "Announcement updated successfully",
  };
}

export async function getStudentAnnouncements({ studentId, query = {} }) {
  validateObjectId(studentId, "student ID");

  const {
    search,
    course,
    type,
    unreadOnly,
    pinnedOnly,
    sortBy = "publishAt",
    order = "desc",
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

  const activeEnrollments = enrollments.filter(
    (enrollment) =>
      !enrollment.expiresAt ||
      new Date(enrollment.expiresAt).getTime() > now.getTime(),
  );

  const enrolledCourseIds = activeEnrollments.map(
    (enrollment) => enrollment.course,
  );

  if (enrolledCourseIds.length === 0) {
    return {
      announcements: [],

      pagination: buildPaginationMeta({
        page,
        limit,
        totalRecords: 0,
      }),

      unreadCount: 0,

      filters: {
        search: search?.trim() || null,
        course: course || null,
        type: null,
        unreadOnly: false,
        pinnedOnly: false,
        sortBy: "publishAt",
        order: "desc",
      },
    };
  }

  const filter = {
    course: {
      $in: enrolledCourseIds,
    },

    status: "published",
    isPublished: true,
    isActive: true,

    publishAt: {
      $lte: now,
    },

    $and: [
      {
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
    ],
  };

  if (course) {
    validateObjectId(course, "course ID");

    const isEnrolled = enrolledCourseIds.some(
      (courseId) => courseId.toString() === String(course),
    );

    if (!isEnrolled) {
      throw new ApiError(403, "You are not enrolled in this course");
    }

    filter.course = course;
  }

  const searchFilter = buildSearchFilter(search, ["title", "content"]);

  if (searchFilter) {
    filter.$and.push({
      $or: searchFilter,
    });
  }

  const parsedType = parseEnumQuery(
    type,
    ANNOUNCEMENT_TYPES,
    "Announcement type",
  );

  if (parsedType !== undefined) {
    filter.type = parsedType;
  }

  const parsedUnreadOnly = parseBooleanQuery(unreadOnly, "unreadOnly");

  const parsedPinnedOnly = parseBooleanQuery(pinnedOnly, "pinnedOnly");

  if (parsedPinnedOnly === true) {
    filter.isPinned = true;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: ["publishAt", "createdAt", "updatedAt", "title"],

    defaultField: "publishAt",
    defaultOrder: "desc",
  });

  /*
   * unreadOnly filter ke liye read IDs fetch.
   */
  const readRecords = await AnnouncementRead.find({
    student: studentId,
    course: {
      $in: enrolledCourseIds,
    },
  })
    .select("announcement")
    .lean();

  const readAnnouncementIds = readRecords.map((record) => record.announcement);

  if (parsedUnreadOnly === true) {
    filter._id = {
      $nin: readAnnouncementIds,
    };
  }

  const [announcements, totalRecords] = await Promise.all([
    Announcement.find(filter)
      .select(
        `
          course
          instructor
          title
          content
          type
          relatedResourceType
          relatedResourceId
          publishAt
          expiresAt
          isPinned
          publishedAt
          createdAt
          updatedAt
        `,
      )
      .populate({
        path: "course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "instructor",
        select: "fullName avatarUrl",
      })
      .sort({
        isPinned: -1,
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Announcement.countDocuments(filter),
  ]);

  const readSet = new Set(readAnnouncementIds.map((id) => id.toString()));

  const formattedAnnouncements = announcements.map((announcement) => ({
    ...announcement,

    isRead: readSet.has(announcement._id.toString()),
  }));

  const unreadCount = await Announcement.countDocuments({
    course: {
      $in: enrolledCourseIds,
    },

    status: "published",
    isPublished: true,
    isActive: true,

    publishAt: {
      $lte: now,
    },

    _id: {
      $nin: readAnnouncementIds,
    },

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
  });

  return {
    announcements: formattedAnnouncements,

    unreadCount,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,
      type: parsedType ?? null,

      unreadOnly: parsedUnreadOnly ?? false,

      pinnedOnly: parsedPinnedOnly ?? false,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

export async function getStudentAnnouncementById({
  studentId,
  announcementId,
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(announcementId, "announcement ID");

  const now = new Date();

  const announcement = await Announcement.findOne({
    _id: announcementId,

    status: "published",
    isPublished: true,
    isActive: true,

    publishAt: {
      $lte: now,
    },

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
  })
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .populate({
      path: "instructor",
      select: "fullName avatarUrl",
    })
    .lean();

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: announcement.course._id,

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

  const readRecord = await AnnouncementRead.findOne({
    announcement: announcementId,
    student: studentId,
  })
    .select("readAt")
    .lean();

  return {
    announcement: {
      ...announcement,

      isRead: Boolean(readRecord),

      readAt: readRecord?.readAt ?? null,
    },
  };
}

export async function markAnnouncementAsRead({ studentId, announcementId }) {
  validateObjectId(studentId, "student ID");
  validateObjectId(announcementId, "announcement ID");

  const now = new Date();

  const announcement = await Announcement.findOne({
    _id: announcementId,

    status: "published",
    isPublished: true,
    isActive: true,

    publishAt: {
      $lte: now,
    },
  })
    .select("course expiresAt")
    .lean();

  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  if (
    announcement.expiresAt &&
    new Date(announcement.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(410, "Announcement has expired");
  }

  const enrollment = await Enrollment.exists({
    student: studentId,
    course: announcement.course,

    status: {
      $in: ["active", "completed"],
    },
  });

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  const readRecord = await AnnouncementRead.findOneAndUpdate(
    {
      announcement: announcement._id,

      student: studentId,
    },

    {
      $setOnInsert: {
        course: announcement.course,

        readAt: now,
      },
    },

    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return {
    readRecord,

    message: "Announcement marked as read",
  };
}

export async function markAllAnnouncementsAsRead({
  studentId,
  courseId = null,
}) {
  validateObjectId(studentId, "student ID");

  if (courseId) {
    validateObjectId(courseId, "course ID");
  }

  const now = new Date();

  const enrollments = await Enrollment.find({
    student: studentId,

    status: {
      $in: ["active", "completed"],
    },

    ...(courseId
      ? {
          course: courseId,
        }
      : {}),
  })
    .select("course expiresAt")
    .lean();

  const courseIds = enrollments
    .filter(
      (enrollment) =>
        !enrollment.expiresAt ||
        new Date(enrollment.expiresAt).getTime() > now.getTime(),
    )
    .map((enrollment) => enrollment.course);

  if (courseId && courseIds.length === 0) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  if (courseIds.length === 0) {
    return {
      markedCount: 0,

      message: "No announcements available to mark as read",
    };
  }

  const announcements = await Announcement.find({
    course: {
      $in: courseIds,
    },

    status: "published",
    isPublished: true,
    isActive: true,

    publishAt: {
      $lte: now,
    },

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
  })
    .select("_id course")
    .lean();

  if (announcements.length === 0) {
    return {
      markedCount: 0,

      message: "No announcements available to mark as read",
    };
  }

  const operations = announcements.map((announcement) => ({
    updateOne: {
      filter: {
        announcement: announcement._id,

        student: new mongoose.Types.ObjectId(studentId),
      },

      update: {
        $setOnInsert: {
          course: announcement.course,

          readAt: now,
        },
      },

      upsert: true,
    },
  }));

  const result = await AnnouncementRead.bulkWrite(operations, {
    ordered: false,
  });

  return {
    markedCount: result.upsertedCount ?? 0,

    message: "Announcements marked as read",
  };
}
