import { Router } from "express";

import {
  createDiscussionController,
  getDiscussionsController,
  getDiscussionByIdController,
  createDiscussionReplyController,
  acceptDiscussionAnswerController,
  updateDiscussionResolvedStatusController,
  updateDiscussionModerationController,
  updateDiscussionReplyController,
  deleteDiscussionReplyController,
} from "../controllers/discussion.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles("student", "instructor", "admin"),
);

router.post("/", createDiscussionController);

router.get("/", getDiscussionsController);

router.post("/:discussionId/replies", createDiscussionReplyController);

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

router.patch(
  "/:discussionId/resolved",
  updateDiscussionResolvedStatusController,
);

router.patch("/:discussionId/moderation", updateDiscussionModerationController);

router.get("/:discussionId", getDiscussionByIdController);

export default router;
