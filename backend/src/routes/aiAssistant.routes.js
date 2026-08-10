import { Router } from "express";

import {
  createAiConversationController,
  getMyAiConversationsController,
  getAiConversationByIdController,
  addAiUserMessageController,
  renameAiConversationController,
  updateAiConversationArchiveController,
  deleteAiConversationController,
} from "../controllers/aiAssistant.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles("student", "instructor", "admin"),
);

/*
 * Create conversation
 */
router.post("/conversations", createAiConversationController);

/*
 * My conversations
 */
router.get("/conversations", getMyAiConversationsController);

/*
 * Send/add message
 */
router.post(
  "/conversations/:conversationId/messages",
  addAiUserMessageController,
);

/*
 * Rename
 */
router.patch(
  "/conversations/:conversationId/title",
  renameAiConversationController,
);

/*
 * Archive
 */
router.patch(
  "/conversations/:conversationId/archive",
  updateAiConversationArchiveController,
);

/*
 * Details
 */
router.get("/conversations/:conversationId", getAiConversationByIdController);

/*
 * Delete
 */
router.delete("/conversations/:conversationId", deleteAiConversationController);

export default router;
