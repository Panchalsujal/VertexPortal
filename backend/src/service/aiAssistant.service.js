import mongoose from "mongoose";

import AiConversation from "../models/aiConversation.model.js";
import AiMessage from "../models/aiMessage.model.js";

import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";

import {
  validateObjectId,
} from "../utils/validator.js";

import {
  getPagination,
  buildPaginationMeta,
} from "../utils/pagination.js";

import {
  ApiError,
} from "../utils/ApiError.js";

/*
 * =========================================
 * Course access validation
 * =========================================
 */
async function validateCourseAccess({
  userId,
  userRole,
  courseId,
}) {
  validateObjectId(
    courseId,
    "course ID",
  );

  const course =
    await Course.findOne({
      _id: courseId,
      isActive: true,
    })
      .select(`
        _id
        title
        slug
        instructor
        status
        isPublished
        isActive
      `)
      .lean();

  if (!course) {
    throw new ApiError(
      404,
      "Course not found",
    );
  }

  /*
   * Admin full access.
   */
  if (userRole === "admin") {
    return course;
  }

  /*
   * Instructor only own course.
   */
  if (userRole === "instructor") {
    if (
      course.instructor.toString() !==
      String(userId)
    ) {
      throw new ApiError(
        403,
        "You do not have access to this course",
      );
    }

    return course;
  }

  /*
   * Student enrollment required.
   */
  if (userRole === "student") {
    const enrollment =
      await Enrollment.findOne({
        student: userId,

        course: courseId,

        status: {
          $in: [
            "active",
            "completed",
          ],
        },
      })
        .select(
          "_id expiresAt",
        )
        .lean();

    if (!enrollment) {
      throw new ApiError(
        403,
        "You are not enrolled in this course",
      );
    }

    if (
      enrollment.expiresAt &&
      new Date(
        enrollment.expiresAt,
      ).getTime() <= Date.now()
    ) {
      throw new ApiError(
        403,
        "Your course enrollment has expired",
      );
    }

    return course;
  }

  throw new ApiError(
    403,
    "You do not have access to this course",
  );
}

/*
 * =========================================
 * Create AI conversation
 * =========================================
 */
export async function createAiConversation({
  userId,
  userRole,
  payload,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  const {
    courseId = null,
    title = "",
  } = payload || {};

  let course = null;

  if (courseId) {
    course =
      await validateCourseAccess({
        userId,
        userRole,
        courseId,
      });
  }

  const normalizedTitle =
    String(title || "").trim();

  if (
    normalizedTitle.length >
    200
  ) {
    throw new ApiError(
      400,
      "Conversation title cannot exceed 200 characters",
    );
  }

  const conversation =
    await AiConversation.create({
      user: userId,

      course:
        course?._id ?? null,

      title:
        normalizedTitle ||
        "New conversation",

      messageCount: 0,

      lastMessageAt:
        new Date(),

      isArchived: false,

      isActive: true,
    });

  return conversation;
}

/*
 * =========================================
 * Get current user's conversations
 * =========================================
 */
export async function getMyAiConversations({
  userId,
  query = {},
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  const {
    course,
    archived = "false",
  } = query;

  const {
    page,
    limit,
    skip,
  } =
    getPagination(query);

  const filter = {
    user: userId,
    isActive: true,
  };

  if (course) {
    validateObjectId(
      course,
      "course ID",
    );

    filter.course =
      course;
  }

  filter.isArchived =
    archived === "true";

  const [
    conversations,
    totalRecords,
  ] =
    await Promise.all([
      AiConversation.find(
        filter,
      )
        .populate({
          path: "course",

          select:
            "title slug thumbnailUrl",
        })
        .sort({
          lastMessageAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AiConversation.countDocuments(
        filter,
      ),
    ]);

  return {
    conversations,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        totalRecords,
      }),
  };
}

/*
 * =========================================
 * Get conversation + messages
 * =========================================
 */
export async function getAiConversationById({
  userId,
  conversationId,
  query = {},
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    conversationId,
    "conversation ID",
  );

  const conversation =
    await AiConversation.findOne({
      _id: conversationId,

      user: userId,

      isActive: true,
    })
      .populate({
        path: "course",

        select:
          "title slug thumbnailUrl",
      })
      .lean();

  if (!conversation) {
    throw new ApiError(
      404,
      "AI conversation not found",
    );
  }

  const {
    page,
    limit,
    skip,
  } =
    getPagination(query);

  const messageFilter = {
    conversation:
      conversationId,

    isActive: true,
  };

  const [
    messages,
    totalRecords,
  ] =
    await Promise.all([
      AiMessage.find(
        messageFilter,
      )
        .sort({
          createdAt: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AiMessage.countDocuments(
        messageFilter,
      ),
    ]);

  return {
    conversation,

    messages,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        totalRecords,
      }),
  };
}

/*
 * =========================================
 * Internal helper:
 * Save assistant response
 * =========================================
 */
export async function saveAiAssistantMessage({
  conversationId,
  userId,
  content,
  sources = [],
  metadata = null,
}) {
  validateObjectId(
    conversationId,
    "conversation ID",
  );

  validateObjectId(
    userId,
    "user ID",
  );

  const normalizedContent =
    String(content || "").trim();

  if (!normalizedContent) {
    throw new ApiError(
      400,
      "Assistant message content is required",
    );
  }

  if (
    normalizedContent.length >
    50000
  ) {
    throw new ApiError(
      400,
      "Assistant message cannot exceed 50000 characters",
    );
  }

  const conversation =
    await AiConversation.findOne({
      _id:
        conversationId,

      user:
        userId,

      isActive:
        true,
    });

  if (!conversation) {
    throw new ApiError(
      404,
      "AI conversation not found",
    );
  }

  const message =
    await AiMessage.create({
      conversation:
        conversation._id,

      user:
        userId,

      course:
        conversation.course ??
        null,

      role:
        "assistant",

      content:
        normalizedContent,

      sources:
        Array.isArray(sources)
          ? sources
          : [],

      metadata:
        metadata ?? null,

      isActive:
        true,
    });

  conversation.messageCount +=
    1;

  conversation.lastMessageAt =
    new Date();

  await conversation.save();

  return message;
}

/*
 * =========================================
 * Rename conversation
 * =========================================
 */
export async function renameAiConversation({
  userId,
  conversationId,
  title,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    conversationId,
    "conversation ID",
  );

  const normalizedTitle =
    String(title || "").trim();

  if (!normalizedTitle) {
    throw new ApiError(
      400,
      "Conversation title is required",
    );
  }

  if (
    normalizedTitle.length >
    200
  ) {
    throw new ApiError(
      400,
      "Conversation title cannot exceed 200 characters",
    );
  }

  const conversation =
    await AiConversation.findOneAndUpdate(
      {
        _id:
          conversationId,

        user:
          userId,

        isActive:
          true,
      },

      {
        $set: {
          title:
            normalizedTitle,
        },
      },

      {
        new: true,
        runValidators: true,
      },
    );

  if (!conversation) {
    throw new ApiError(
      404,
      "AI conversation not found",
    );
  }

  return conversation;
}

/*
 * =========================================
 * Archive / unarchive conversation
 * =========================================
 */
export async function updateAiConversationArchive({
  userId,
  conversationId,
  isArchived,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    conversationId,
    "conversation ID",
  );

  if (
    typeof isArchived !==
    "boolean"
  ) {
    throw new ApiError(
      400,
      "isArchived must be boolean",
    );
  }

  const conversation =
    await AiConversation.findOneAndUpdate(
      {
        _id:
          conversationId,

        user:
          userId,

        isActive:
          true,
      },

      {
        $set: {
          isArchived,
        },
      },

      {
        new: true,
        runValidators: true,
      },
    );

  if (!conversation) {
    throw new ApiError(
      404,
      "AI conversation not found",
    );
  }

  return conversation;
}

/*
 * =========================================
 * Delete conversation
 *
 * Soft-delete conversation + messages.
 * =========================================
 */
export async function deleteAiConversation({
  userId,
  conversationId,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    conversationId,
    "conversation ID",
  );

  const session =
    await mongoose.startSession();

  try {
    let deletedConversationId;

    await session.withTransaction(
      async () => {
        const conversation =
          await AiConversation.findOne({
            _id:
              conversationId,

            user:
              userId,

            isActive:
              true,
          }).session(session);

        if (!conversation) {
          throw new ApiError(
            404,
            "AI conversation not found",
          );
        }

        conversation.isActive =
          false;

        conversation.isArchived =
          true;

        await conversation.save({
          session,
        });

        await AiMessage.updateMany(
          {
            conversation:
              conversationId,

            isActive:
              true,
          },

          {
            $set: {
              isActive:
                false,
            },
          },

          {
            session,
          },
        );

        deletedConversationId =
          conversation._id;
      },
    );

    return {
      conversationId:
        deletedConversationId,

      message:
        "AI conversation deleted successfully",
    };
  } finally {
    await session.endSession();
  }
}