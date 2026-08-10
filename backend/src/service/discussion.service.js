import Discussion from "../models/discussion.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import DiscussionReply from "../models/discussionReply.model.js";
import User from "../models/user.model.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import { dispatchNotification } from "./notification.service.js";
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

  const normalizedContent = String(content || payload?.body || "").trim();

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
   * Student ke liye active enrollment required.
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

  /*
   * Instructor sirf apne course me discussion
   * create kar sakta hai.
   */
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

  /*
   * Student ne question create kiya hai to
   * course instructor ko notify karo.
   */
  if (userRole === "student" && course.instructor) {
    try {
      await dispatchNotification({
        userId: course.instructor,

        title: "New course discussion",

        message: `A student posted a new question: "${discussion.title}"`,

        type: "discussion",

        resourceType: "discussion",

        resourceId: discussion._id,

        courseId: discussion.course,

        actionUrl: `${process.env.FRONTEND_URL}/discussions/${discussion._id}`,

        metadata: {
          discussionId: discussion._id.toString(),

          authorId: discussion.author.toString(),

          event: "discussion_created",
        },
      });
    } catch (error) {
      console.error("Discussion instructor notification failed:", error);
    }
  }

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

  const formattedReplies = replies.map((r) => ({
    ...r,
    user: r.author || r.user,
    isAccepted: r.isAcceptedAnswer || r.isAccepted,
  }));

  const discussionObj = discussion.toObject();
  discussionObj.replies = formattedReplies;

  return {
    discussion: discussionObj,
    replies: formattedReplies,
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
   * Student access validation.
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

  /*
   * Instructor sirf apne course me reply kar sakta hai.
   */
  if (
    userRole === "instructor" &&
    discussion.course.instructor.toString() !== String(userId)
  ) {
    throw new ApiError(403, "You are not the instructor of this course");
  }

  /*
   * Parent reply validation.
   */
  let parentReply = null;

  if (parentReplyId) {
    parentReply = await DiscussionReply.findOne({
      _id: parentReplyId,
      discussion: discussionId,
      isActive: true,
    })
      .select("_id author")
      .lean();

    if (!parentReply) {
      throw new ApiError(404, "Parent reply not found");
    }
  }

  const isInstructorReply = userRole === "instructor" || userRole === "admin";

  /*
   * Create reply.
   */
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

  /*
   * Update discussion statistics.
   */
  discussion.answerCount += 1;

  discussion.lastActivityAt = new Date();

  if (discussion.status === "open") {
    discussion.status = "answered";
  }

  await discussion.save();

  /*
   * Common discussion URL.
   *
   * Student/instructor dono same frontend page
   * open kar saken.
   */
  const discussionUrl = `${process.env.FRONTEND_URL}/discussions/${discussion._id}`;

  /*
   * Discussion author notification.
   *
   * Self notification avoid.
   */
  if (discussion.author.toString() !== String(userId)) {
    try {
      await dispatchNotification({
        userId: discussion.author,

        title: isInstructorReply
          ? "Instructor replied to your question"
          : "New reply to your discussion",

        message: isInstructorReply
          ? `Your instructor replied to "${discussion.title}".`
          : `Someone replied to "${discussion.title}".`,

        type: "discussion_reply",

        resourceType: "discussion",

        resourceId: discussion._id,

        courseId: discussion.course._id,

        actionUrl: discussionUrl,

        metadata: {
          discussionId: discussion._id.toString(),

          replyId: reply._id.toString(),

          replyAuthorId: String(userId),

          event: isInstructorReply ? "instructor_reply" : "discussion_reply",
        },
      });
    } catch (error) {
      console.error("Discussion reply notification failed:", error);
    }
  }

  /*
   * Nested reply notification.
   *
   * Parent author ko notify karenge except:
   * - parent author current user hai
   * - parent author discussion author hai
   *   (discussion author already notified above)
   */
  if (
    parentReply &&
    parentReply.author.toString() !== String(userId) &&
    parentReply.author.toString() !== discussion.author.toString()
  ) {
    try {
      await dispatchNotification({
        userId: parentReply.author,

        title: "New reply to your answer",

        message: `Someone replied to your answer in "${discussion.title}".`,

        type: "discussion_reply",

        resourceType: "discussion",

        resourceId: discussion._id,

        courseId: discussion.course._id,

        actionUrl: discussionUrl,

        metadata: {
          discussionId: discussion._id.toString(),

          replyId: reply._id.toString(),

          parentReplyId: parentReply._id.toString(),

          replyAuthorId: String(userId),

          event: "nested_reply",
        },
      });
    } catch (error) {
      console.error("Nested discussion reply notification failed:", error);
    }
  }

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

  /*
   * Same accepted answer already selected.
   */
  if (reply.isAcceptedAnswer) {
    return {
      reply,
      discussion,
      changed: false,
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
      _id: {
        $ne: reply._id,
      },
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

  /*
   * Selected reply ko accepted mark karo.
   */
  reply.isAcceptedAnswer = true;
  reply.acceptedAt = now;
  reply.acceptedBy = userId;

  await reply.save();

  /*
   * Discussion resolve karo.
   */
  discussion.status = "resolved";
  discussion.isResolved = true;
  discussion.resolvedAt = now;
  discussion.resolvedBy = userId;
  discussion.lastActivityAt = now;

  await discussion.save();

  /*
   * Accepted answer author ko notify karo.
   *
   * Self notification avoid.
   */
  if (reply.author.toString() !== String(userId)) {
    try {
      await dispatchNotification({
        userId: reply.author,

        title: "Your answer was accepted",

        message: `Your answer to "${discussion.title}" was accepted.`,

        type: "answer_accepted",

        resourceType: "discussion",

        resourceId: discussion._id,

        courseId: discussion.course._id,

        actionUrl: `${process.env.FRONTEND_URL}/discussions/${discussion._id}`,

        metadata: {
          discussionId: discussion._id.toString(),

          replyId: reply._id.toString(),

          acceptedBy: String(userId),

          event: "answer_accepted",
        },
      });
    } catch (error) {
      console.error("Accepted answer notification failed:", error);
    }
  }

  return {
    reply,
    discussion,
    changed: true,
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

export async function updateDiscussion({
  userId,
  userRole,
  discussionId,
  payload,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(discussionId, "discussion ID");

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
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

  const canEdit =
    userRole === "admin" ||
    discussion.author.toString() === String(userId) ||
    (userRole === "instructor" &&
      discussion.course.instructor.toString() === String(userId));

  if (!canEdit) {
    throw new ApiError(403, "You are not allowed to update this discussion");
  }

  if (discussion.isLocked && userRole === "student") {
    throw new ApiError(409, "Locked discussion cannot be updated");
  }

  if (payload.courseId !== undefined || payload.course !== undefined) {
    throw new ApiError(400, "Discussion course cannot be changed");
  }

  if (payload.moduleId !== undefined || payload.module !== undefined) {
    throw new ApiError(400, "Discussion module cannot be changed");
  }

  if (payload.lectureId !== undefined || payload.lecture !== undefined) {
    throw new ApiError(400, "Discussion lecture cannot be changed");
  }

  if (payload.title !== undefined) {
    const title = String(payload.title || "").trim();

    if (title.length < 3) {
      throw new ApiError(400, "Discussion title must be at least 3 characters");
    }

    if (title.length > 200) {
      throw new ApiError(400, "Discussion title cannot exceed 200 characters");
    }

    discussion.title = title;
  }

  if (payload.content !== undefined) {
    const content = String(payload.content || "").trim();

    if (content.length < 3) {
      throw new ApiError(
        400,
        "Discussion content must be at least 3 characters",
      );
    }

    if (content.length > 10000) {
      throw new ApiError(
        400,
        "Discussion content cannot exceed 10000 characters",
      );
    }

    discussion.content = content;
  }

  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags)) {
      throw new ApiError(400, "Discussion tags must be an array");
    }

    discussion.tags = [
      ...new Set(
        payload.tags
          .map((tag) =>
            String(tag || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    ].slice(0, 10);
  }

  discussion.lastActivityAt = new Date();

  await discussion.save();

  return {
    discussion,
    message: "Discussion updated successfully",
  };
}

export async function deleteDiscussion({ userId, userRole, discussionId }) {
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

  const canDelete =
    userRole === "admin" ||
    discussion.author.toString() === String(userId) ||
    (userRole === "instructor" &&
      discussion.course.instructor.toString() === String(userId));

  if (!canDelete) {
    throw new ApiError(403, "You are not allowed to delete this discussion");
  }

  discussion.isActive = false;
  discussion.isLocked = true;

  await discussion.save();

  /*
   * Replies bhi soft-delete kar denge.
   */
  await DiscussionReply.updateMany(
    {
      discussion: discussionId,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        isAcceptedAnswer: false,
        acceptedAt: null,
        acceptedBy: null,
      },
    },
  );

  return {
    discussionId: discussion._id,
    message: "Discussion deleted successfully",
  };
}



