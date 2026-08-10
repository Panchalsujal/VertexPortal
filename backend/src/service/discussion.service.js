import Discussion from "../models/discussion.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import DiscussionReply from "../models/discussionReply.model.js";
import User from "../models/user.model.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { parseEnumQuery, parseSortQuery } from "../utils/queryParser.js";

import { buildSearchFilter } from "../utils/search.js";
import { validateObjectId } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";

export async function createDiscussion({ userId, userRole, payload }) {
  validateObjectId(userId, "user ID");

  const {
    courseId,
    moduleId = null,
    lectureId = null,
    title,
    content,
    tags = [],
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
    throw new ApiError(400, "Discussion title must be at least 3 characters");
  }

  if (normalizedTitle.length > 200) {
    throw new ApiError(400, "Discussion title cannot exceed 200 characters");
  }

  const normalizedContent = String(content || "").trim();

  if (normalizedContent.length < 3) {
    throw new ApiError(400, "Discussion content is required");
  }

  if (normalizedContent.length > 10000) {
    throw new ApiError(
      400,
      "Discussion content cannot exceed 10000 characters",
    );
  }

  const course = await Course.findOne({
    _id: courseId,
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
    throw new ApiError(404, "Course not found");
  }

  /*
   * Student ke liye enrollment required.
   * Instructor apne course me directly post kar sakta hai.
   */
  if (userRole === "student") {
    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,

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
      new Date(enrollment.expiresAt).getTime() <= Date.now()
    ) {
      throw new ApiError(403, "Your course enrollment has expired");
    }
  }

  if (
    userRole === "instructor" &&
    course.instructor.toString() !== String(userId)
  ) {
    throw new ApiError(403, "You are not the instructor of this course");
  }

  let selectedModule = null;

  if (moduleId) {
    selectedModule = await CourseModule.findOne({
      _id: moduleId,
      course: courseId,
      isActive: true,
    })
      .select("_id title")
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
      .select("_id title module")
      .lean();

    if (!selectedLecture) {
      throw new ApiError(404, "Lecture not found in this course");
    }

    if (moduleId && selectedLecture.module?.toString() !== String(moduleId)) {
      throw new ApiError(400, "Lecture does not belong to selected module");
    }
  }

  const normalizedTags = Array.isArray(tags)
    ? [
        ...new Set(
          tags
            .map((tag) =>
              String(tag || "")
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean),
        ),
      ].slice(0, 10)
    : [];

  const discussion = await Discussion.create({
    course: courseId,

    module: selectedModule?._id ?? selectedLecture?.module ?? null,

    lecture: selectedLecture?._id ?? null,

    author: userId,

    title: normalizedTitle,

    content: normalizedContent,

    tags: normalizedTags,

    status: "open",

    isPinned: false,

    isLocked: false,

    isResolved: false,

    answerCount: 0,

    viewCount: 0,

    lastActivityAt: new Date(),

    isActive: true,
  });

  return discussion;
}

export async function getDiscussions({ userId, userRole, query = {} }) {
  validateObjectId(userId, "user ID");

  const {
    search,
    course,
    lecture,
    status,
    tag,
    sortBy = "lastActivityAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    isActive: true,
  };

  /*
   * Student sirf enrolled courses ke discussions dekhega.
   */
  if (userRole === "student") {
    const enrollments = await Enrollment.find({
      student: userId,
      status: {
        $in: ["active", "completed"],
      },
    })
      .select("course expiresAt")
      .lean();

    const now = Date.now();

    const courseIds = enrollments
      .filter(
        (enrollment) =>
          !enrollment.expiresAt ||
          new Date(enrollment.expiresAt).getTime() > now,
      )
      .map((enrollment) => enrollment.course);

    filter.course = {
      $in: courseIds,
    };
  }

  /*
   * Instructor sirf apne courses.
   */
  if (userRole === "instructor") {
    const courses = await Course.find({
      instructor: userId,
      isActive: true,
    })
      .select("_id")
      .lean();

    filter.course = {
      $in: courses.map((course) => course._id),
    };
  }

  if (course) {
    validateObjectId(course, "course ID");

    /*
     * Existing access filter ko preserve karenge.
     */
    if (filter.course?.$in) {
      const allowed = filter.course.$in.some(
        (id) => id.toString() === String(course),
      );

      if (!allowed) {
        throw new ApiError(403, "You do not have access to this course");
      }
    }

    filter.course = course;
  }

  if (lecture) {
    validateObjectId(lecture, "lecture ID");

    filter.lecture = lecture;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["open", "answered", "resolved", "closed"],
    "Discussion status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  if (tag?.trim()) {
    filter.tags = String(tag).trim().toLowerCase();
  }

  const searchFilter = buildSearchFilter(search, ["title", "content", "tags"]);

  if (searchFilter) {
    filter.$or = searchFilter;
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
      "lastActivityAt",
      "answerCount",
      "viewCount",
      "title",
    ],

    defaultField: "lastActivityAt",

    defaultOrder: "desc",
  });

  const [discussions, totalRecords] = await Promise.all([
    Discussion.find(filter)
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
        select: "title order type",
      })
      .populate({
        path: "author",
        select: "fullName avatarUrl role",
      })
      .populate({
        path: "resolvedBy",
        select: "fullName avatarUrl role",
      })
      .sort({
        isPinned: -1,

        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Discussion.countDocuments(filter),
  ]);

  return {
    discussions,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,

      course: course || null,

      lecture: lecture || null,

      status: parsedStatus ?? null,

      tag: tag?.trim() || null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

export async function getDiscussionById({ userId, userRole, discussionId }) {
  validateObjectId(userId, "user ID");

  validateObjectId(discussionId, "discussion ID");

  const discussion = await Discussion.findOne({
    _id: discussionId,
    isActive: true,
  })
    .populate({
      path: "course",
      select: "title slug thumbnailUrl instructor",
    })
    .populate({
      path: "module",
      select: "title order",
    })
    .populate({
      path: "lecture",
      select: "title order type",
    })
    .populate({
      path: "author",
      select: "fullName avatarUrl role",
    })
    .populate({
      path: "resolvedBy",
      select: "fullName avatarUrl role",
    });

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  /*
   * Student enrollment access.
   */
  if (userRole === "student") {
    const enrollment = await Enrollment.findOne({
      student: userId,

      course: discussion.course._id,

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
      new Date(enrollment.expiresAt).getTime() <= Date.now()
    ) {
      throw new ApiError(403, "Your course enrollment has expired");
    }
  }

  if (
    userRole === "instructor" &&
    discussion.course.instructor.toString() !== String(userId)
  ) {
    throw new ApiError(403, "You do not have access to this discussion");
  }

  /*
   * View count increment.
   */
  discussion.viewCount += 1;

  await discussion.save();

  const replies = await DiscussionReply.find({
    discussion: discussionId,

    isActive: true,
  })
    .populate({
      path: "author",
      select: "fullName avatarUrl role",
    })
    .populate({
      path: "acceptedBy",

      select: "fullName avatarUrl role",
    })
    .sort({
      isAcceptedAnswer: -1,

      createdAt: 1,
    })
    .lean();

  return {
    discussion: discussion.toObject(),

    replies,
  };
}

export async function createDiscussionReply({
  userId,
  userRole,
  discussionId,
  payload,
}) {
  validateObjectId(userId, "user ID");

  validateObjectId(discussionId, "discussion ID");

  const { content, parentReplyId = null } = payload || {};

  const normalizedContent = String(content || "").trim();

  if (!normalizedContent) {
    throw new ApiError(400, "Reply content is required");
  }

  if (normalizedContent.length > 10000) {
    throw new ApiError(400, "Reply content cannot exceed 10000 characters");
  }

  if (parentReplyId) {
    validateObjectId(parentReplyId, "parent reply ID");
  }

  const discussion = await Discussion.findOne({
    _id: discussionId,

    isActive: true,
  }).populate({
    path: "course",

    select: "instructor",
  });

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  if (discussion.isLocked) {
    throw new ApiError(409, "Discussion is locked");
  }

  /*
   * Access validation.
   */
  if (userRole === "student") {
    const enrollment = await Enrollment.findOne({
      student: userId,

      course: discussion.course._id,

      status: {
        $in: ["active", "completed"],
      },
    })
      .select("_id expiresAt")
      .lean();

    if (!enrollment) {
      throw new ApiError(403, "You are not enrolled in this course");
    }
  }

  if (
    userRole === "instructor" &&
    discussion.course.instructor.toString() !== String(userId)
  ) {
    throw new ApiError(403, "You are not the instructor of this course");
  }

  /*
   * Parent reply validation.
   */
  if (parentReplyId) {
    const parentReply = await DiscussionReply.exists({
      _id: parentReplyId,

      discussion: discussionId,

      isActive: true,
    });

    if (!parentReply) {
      throw new ApiError(404, "Parent reply not found");
    }
  }

  const isInstructorReply = userRole === "instructor" || userRole === "admin";

  const reply = await DiscussionReply.create({
    discussion: discussionId,

    course: discussion.course._id,

    author: userId,

    content: normalizedContent,

    parentReply: parentReplyId || null,

    isInstructorReply,

    isAcceptedAnswer: false,

    isActive: true,
  });

  discussion.answerCount += 1;

  discussion.lastActivityAt = new Date();

  if (discussion.status === "open") {
    discussion.status = "answered";
  }

  await discussion.save();

  return {
    reply,

    discussion: {
      id: discussion._id,

      status: discussion.status,

      answerCount: discussion.answerCount,

      lastActivityAt: discussion.lastActivityAt,
    },

    message: "Reply added successfully",
  };
}

export async function acceptDiscussionAnswer({
  userId,
  userRole,
  discussionId,
  replyId,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(discussionId, "discussion ID");
  validateObjectId(replyId, "reply ID");

  const discussion = await Discussion.findOne({
    _id: discussionId,
    isActive: true,
  }).populate({
    path: "course",
    select: "instructor",
  });

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  const canAccept =
    userRole === "admin" ||
    discussion.author.toString() === String(userId) ||
    discussion.course.instructor.toString() === String(userId);

  if (!canAccept) {
    throw new ApiError(
      403,
      "You are not allowed to accept an answer for this discussion",
    );
  }

  const reply = await DiscussionReply.findOne({
    _id: replyId,
    discussion: discussionId,
    isActive: true,
  });

  if (!reply) {
    throw new ApiError(404, "Discussion reply not found");
  }

  if (reply.isAcceptedAnswer) {
    return {
      reply,
      discussion,
      message: "Reply is already the accepted answer",
    };
  }

  /*
   * Ek discussion me sirf ek accepted answer.
   */
  await DiscussionReply.updateMany(
    {
      discussion: discussionId,
      isAcceptedAnswer: true,
    },
    {
      $set: {
        isAcceptedAnswer: false,
        acceptedAt: null,
        acceptedBy: null,
      },
    },
  );

  const now = new Date();

  reply.isAcceptedAnswer = true;
  reply.acceptedAt = now;
  reply.acceptedBy = userId;

  await reply.save();

  discussion.status = "resolved";
  discussion.isResolved = true;
  discussion.resolvedAt = now;
  discussion.resolvedBy = userId;
  discussion.lastActivityAt = now;

  await discussion.save();

  return {
    reply,
    discussion,
    message: "Answer accepted successfully",
  };
}
export async function updateDiscussionResolvedStatus({
  userId,
  userRole,
  discussionId,
  isResolved,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(discussionId, "discussion ID");

  const discussion = await Discussion.findOne({
    _id: discussionId,
    isActive: true,
  }).populate({
    path: "course",
    select: "instructor",
  });

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  const canManage =
    userRole === "admin" ||
    discussion.author.toString() === String(userId) ||
    discussion.course.instructor.toString() === String(userId);

  if (!canManage) {
    throw new ApiError(403, "You are not allowed to update this discussion");
  }

  const parsedResolved =
    typeof isResolved === "boolean"
      ? isResolved
      : parseBooleanQuery(isResolved, "isResolved");

  if (parsedResolved) {
    discussion.isResolved = true;
    discussion.status = "resolved";
    discussion.resolvedAt = discussion.resolvedAt ?? new Date();
    discussion.resolvedBy = userId;
  } else {
    discussion.isResolved = false;
    discussion.status = discussion.answerCount > 0 ? "answered" : "open";
    discussion.resolvedAt = null;
    discussion.resolvedBy = null;
  }

  discussion.lastActivityAt = new Date();

  await discussion.save();

  return {
    discussion,
    message: parsedResolved
      ? "Discussion resolved successfully"
      : "Discussion reopened successfully",
  };
}

export async function updateDiscussionModeration({
  userId,
  userRole,
  discussionId,
  payload,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(discussionId, "discussion ID");

  const { isPinned, isLocked } = payload || {};

  if (isPinned === undefined && isLocked === undefined) {
    throw new ApiError(400, "isPinned or isLocked is required");
  }

  const discussion = await Discussion.findOne({
    _id: discussionId,
    isActive: true,
  }).populate({
    path: "course",
    select: "instructor",
  });

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  const canModerate =
    userRole === "admin" ||
    (userRole === "instructor" &&
      discussion.course.instructor.toString() === String(userId));

  if (!canModerate) {
    throw new ApiError(
      403,
      "Only course instructor or admin can moderate discussion",
    );
  }

  if (isPinned !== undefined) {
    discussion.isPinned =
      typeof isPinned === "boolean"
        ? isPinned
        : parseBooleanQuery(isPinned, "isPinned");
  }

  if (isLocked !== undefined) {
    discussion.isLocked =
      typeof isLocked === "boolean"
        ? isLocked
        : parseBooleanQuery(isLocked, "isLocked");
  }

  discussion.lastActivityAt = new Date();

  await discussion.save();

  return {
    discussion,
    message: "Discussion moderation updated successfully",
  };
}

export async function updateDiscussionReply({
  userId,
  userRole,
  discussionId,
  replyId,
  content,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(discussionId, "discussion ID");
  validateObjectId(replyId, "reply ID");

  const normalizedContent = String(content || "").trim();

  if (!normalizedContent) {
    throw new ApiError(400, "Reply content is required");
  }

  if (normalizedContent.length > 10000) {
    throw new ApiError(400, "Reply content cannot exceed 10000 characters");
  }

  const discussion = await Discussion.findOne({
    _id: discussionId,
    isActive: true,
  }).populate({
    path: "course",
    select: "instructor",
  });

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  const reply = await DiscussionReply.findOne({
    _id: replyId,
    discussion: discussionId,
    isActive: true,
  });

  if (!reply) {
    throw new ApiError(404, "Discussion reply not found");
  }

  const canEdit =
    userRole === "admin" ||
    reply.author.toString() === String(userId) ||
    (userRole === "instructor" &&
      discussion.course.instructor.toString() === String(userId));

  if (!canEdit) {
    throw new ApiError(403, "You are not allowed to edit this reply");
  }

  reply.content = normalizedContent;

  reply.isEdited = true;
  reply.editedAt = new Date();

  await reply.save();

  discussion.lastActivityAt = new Date();

  await discussion.save();

  return {
    reply,
    message: "Reply updated successfully",
  };
}

export async function deleteDiscussionReply({
  userId,
  userRole,
  discussionId,
  replyId,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(discussionId, "discussion ID");
  validateObjectId(replyId, "reply ID");

  const discussion = await Discussion.findOne({
    _id: discussionId,
    isActive: true,
  }).populate({
    path: "course",
    select: "instructor",
  });

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  const reply = await DiscussionReply.findOne({
    _id: replyId,
    discussion: discussionId,
    isActive: true,
  });

  if (!reply) {
    throw new ApiError(404, "Discussion reply not found");
  }

  const canDelete =
    userRole === "admin" ||
    reply.author.toString() === String(userId) ||
    (userRole === "instructor" &&
      discussion.course.instructor.toString() === String(userId));

  if (!canDelete) {
    throw new ApiError(403, "You are not allowed to delete this reply");
  }

  const wasAccepted = reply.isAcceptedAnswer;

  reply.isActive = false;
  reply.isAcceptedAnswer = false;
  reply.acceptedAt = null;
  reply.acceptedBy = null;

  await reply.save();

  discussion.answerCount = Math.max(0, discussion.answerCount - 1);

  discussion.lastActivityAt = new Date();

  if (wasAccepted) {
    discussion.isResolved = false;
    discussion.resolvedAt = null;
    discussion.resolvedBy = null;

    discussion.status = discussion.answerCount > 0 ? "answered" : "open";
  } else if (discussion.answerCount === 0 && !discussion.isResolved) {
    discussion.status = "open";
  }

  await discussion.save();

  return {
    replyId: reply._id,
    discussion: {
      id: discussion._id,
      status: discussion.status,
      answerCount: discussion.answerCount,
      isResolved: discussion.isResolved,
    },
    message: "Reply deleted successfully",
  };
}
