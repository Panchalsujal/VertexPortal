import {
  Router,
} from "express";

import {
  createAiConversationController,
  getMyAiConversationsController,
  getAiConversationByIdController,
  renameAiConversationController,
  updateAiConversationArchiveController,
  deleteAiConversationController,
} from "../controllers/aiAssistant.controller.js";

import {
  generateAiAnswerController,
} from "../controllers/aiChat.controller.js";

import {
  authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/authorize.middleware.js";

const router =
  Router();

router.use(
  authMiddleware,

  authorizeRoles(
    "student",
    "instructor",
    "admin",
  ),
);

/*
 * Create conversation
 */
router.post(
  "/conversations",
  createAiConversationController,
);

/*
 * Conversation listing
 */
router.get(
  "/conversations",
  getMyAiConversationsController,
);

/*
 * ====================================
 * MAIN AI CHAT ENDPOINT
 * ====================================
 */
router.post(
  "/conversations/:conversationId/messages",
  generateAiAnswerController,
);

/*
 * Rename
 */
router.patch(
  "/conversations/:conversationId/title",
  renameAiConversationController,
);

/*
 * Archive / restore
 */
router.patch(
  "/conversations/:conversationId/archive",
  updateAiConversationArchiveController,
);

/*
 * Conversation + messages
 */
router.get(
  "/conversations/:conversationId",
  getAiConversationByIdController,
);

/*
 * Delete
 */
router.delete(
  "/conversations/:conversationId",
  deleteAiConversationController,
);

export default router;