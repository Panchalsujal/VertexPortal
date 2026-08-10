import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createDiscussion,
  getDiscussions,
  getDiscussionById,
  createDiscussionReply,
  acceptDiscussionAnswer,
  updateDiscussionResolvedStatus,
  updateDiscussionModeration,
  updateDiscussionReply,
  deleteDiscussionReply,
  updateDiscussion,
  deleteDiscussion,
} from "../service/discussion.service.js";

/*
 * Create discussion
 */
export const createDiscussionController = asyncHandler(async (req, res) => {
  const discussion = await createDiscussion({
    userId: req.user.id,
    userRole: req.user.role,
    payload: req.body,
  });

  return res.status(201).json({
    success: true,
    message: "Discussion created successfully",
    discussion,
  });
});

/*
 * Get discussion list
 */
export const getDiscussionsController = asyncHandler(async (req, res) => {
  const result = await getDiscussions({
    userId: req.user.id,
    userRole: req.user.role,
    query: req.query,
  });

  return res.status(200).json({
    success: true,
    message: "Discussions fetched successfully",
    ...result,
  });
});

/*
 * Get single discussion
 */
export const getDiscussionByIdController = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;

  const result = await getDiscussionById({
    userId: req.user.id,
    userRole: req.user.role,
    discussionId,
  });

  return res.status(200).json({
    success: true,
    message: "Discussion fetched successfully",
    ...result,
  });
});

/*
 * Update discussion
 */
export const updateDiscussionController = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;

  const result = await updateDiscussion({
    userId: req.user.id,
    userRole: req.user.role,
    discussionId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    discussion: result.discussion,
  });
});

/*
 * Delete discussion
 */
export const deleteDiscussionController = asyncHandler(async (req, res) => {
  const { discussionId } = req.params;

  const result = await deleteDiscussion({
    userId: req.user.id,
    userRole: req.user.role,
    discussionId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    discussionId: result.discussionId,
  });
});

/*
 * Create discussion reply
 */
export const createDiscussionReplyController = asyncHandler(
  async (req, res) => {
    const { discussionId } = req.params;

    const result = await createDiscussionReply({
      userId: req.user.id,
      userRole: req.user.role,
      discussionId,
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      reply: result.reply,
      discussion: result.discussion,
    });
  },
);

/*
 * Update discussion reply
 */
export const updateDiscussionReplyController = asyncHandler(
  async (req, res) => {
    const { discussionId, replyId } = req.params;

    const result = await updateDiscussionReply({
      userId: req.user.id,
      userRole: req.user.role,
      discussionId,
      replyId,
      content: req.body?.content,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      reply: result.reply,
    });
  },
);

/*
 * Delete discussion reply
 */
export const deleteDiscussionReplyController = asyncHandler(
  async (req, res) => {
    const { discussionId, replyId } = req.params;

    const result = await deleteDiscussionReply({
      userId: req.user.id,
      userRole: req.user.role,
      discussionId,
      replyId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      replyId: result.replyId,
      discussion: result.discussion,
    });
  },
);

/*
 * Accept discussion answer
 */
export const acceptDiscussionAnswerController = asyncHandler(
  async (req, res) => {
    const { discussionId, replyId } = req.params;

    const result = await acceptDiscussionAnswer({
      userId: req.user.id,
      userRole: req.user.role,
      discussionId,
      replyId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      changed: result.changed,
      reply: result.reply,
      discussion: result.discussion,
    });
  },
);

/*
 * Resolve / reopen discussion
 */
export const updateDiscussionResolvedStatusController = asyncHandler(
  async (req, res) => {
    const { discussionId } = req.params;

    const { isResolved } = req.body || {};

    const result = await updateDiscussionResolvedStatus({
      userId: req.user.id,
      userRole: req.user.role,
      discussionId,
      isResolved,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      discussion: result.discussion,
    });
  },
);

/*
 * Pin / lock discussion
 */
export const updateDiscussionModerationController = asyncHandler(
  async (req, res) => {
    const { discussionId } = req.params;

    const result = await updateDiscussionModeration({
      userId: req.user.id,
      userRole: req.user.role,
      discussionId,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      discussion: result.discussion,
    });
  },
);
