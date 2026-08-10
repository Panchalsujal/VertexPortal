import { Router } from "express";

import {
  createDiscussionController,
  getDiscussionsController,
  getDiscussionByIdController,
  updateDiscussionController,
  deleteDiscussionController,

  createDiscussionReplyController,
  updateDiscussionReplyController,
  deleteDiscussionReplyController,

  acceptDiscussionAnswerController,

  updateDiscussionResolvedStatusController,
  updateDiscussionModerationController,
} from "../controllers/discussion.controller.js";

import {
  toggleDiscussionUpvoteController,
  toggleDiscussionReplyUpvoteController,
  getDiscussionVoteStatusController,
} from "../controllers/discussionVote.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles(
    "student",
    "instructor",
    "admin",
  ),
);

/*
 * ==========================
 * DISCUSSION ROOT
 * ==========================
 */

router.post(
  "/",
  createDiscussionController,
);

router.get(
  "/",
  getDiscussionsController,
);

/*
 * ==========================
 * VOTES
 * ==========================
 */

router.get(
  "/:discussionId/votes",
  getDiscussionVoteStatusController,
);

router.post(
  "/:discussionId/upvote",
  toggleDiscussionUpvoteController,
);

router.post(
  "/:discussionId/replies/:replyId/upvote",
  toggleDiscussionReplyUpvoteController,
);

/*
 * ==========================
 * REPLIES
 * ==========================
 */

router.post(
  "/:discussionId/replies",
  createDiscussionReplyController,
);

router.patch(
  "/:discussionId/replies/:replyId/accept",
  acceptDiscussionAnswerController,
);

router.patch(
  "/:discussionId/replies/:replyId",
  updateDiscussionReplyController,
);

router.delete(
  "/:discussionId/replies/:replyId",
  deleteDiscussionReplyController,
);

/*
 * ==========================
 * DISCUSSION MANAGEMENT
 * ==========================
 */

router.patch(
  "/:discussionId/resolved",
  updateDiscussionResolvedStatusController,
);

router.patch(
  "/:discussionId/moderation",
  updateDiscussionModerationController,
);

/*
 * ==========================
 * SINGLE DISCUSSION
 * ==========================
 */

router.get(
  "/:discussionId",
  getDiscussionByIdController,
);

router.patch(
  "/:discussionId",
  updateDiscussionController,
);

router.delete(
  "/:discussionId",
  deleteDiscussionController,
);

export default router;