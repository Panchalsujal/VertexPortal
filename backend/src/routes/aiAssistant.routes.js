import { Router } from "express";

import {
  createAiConversationController,
  getMyAiConversationsController,
  getAiConversationByIdController,
  renameAiConversationController,
  updateAiConversationArchiveController,
  deleteAiConversationController,
} from "../controllers/aiAssistant.controller.js";

import { generateAiAnswerController } from "../controllers/aiChat.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

/*
 * All AI assistant routes require auth.
 */
router.use(
  authMiddleware,

  authorizeRoles("student", "instructor", "admin"),
);

/*
 * ============================================
 * CREATE CONVERSATION
 * ============================================
 *
 * POST /api/ai/conversations
 */
router.post("/conversations", createAiConversationController);

/*
 * ============================================
 * GET MY CONVERSATIONS
 * ============================================
 *
 * GET /api/ai/conversations
 */
router.get("/conversations", getMyAiConversationsController);

/*
 * ============================================
 * SEND MESSAGE + GENERATE AI RESPONSE
 * ============================================
 *
 * POST /api/ai/conversations/:conversationId/messages
 *
 * IMPORTANT:
 * Ye ab old addAiUserMessageController use nahi karta.
 *
 * Flow:
 *
 * user message
 * ↓
 * RAG search
 * ↓
 * Mistral
 * ↓
 * assistant message
 */
router.post(
  "/conversations/:conversationId/messages",
  generateAiAnswerController,
);

/*
 * ============================================
 * RENAME CONVERSATION
 * ============================================
 *
 * PATCH /api/ai/conversations/:conversationId/title
 */
router.patch(
  "/conversations/:conversationId/title",
  renameAiConversationController,
);

/*
 * ============================================
 * ARCHIVE / RESTORE
 * ============================================
 *
 * PATCH /api/ai/conversations/:conversationId/archive
 */
router.patch(
  "/conversations/:conversationId/archive",
  updateAiConversationArchiveController,
);

/*
 * ============================================
 * GET CONVERSATION + MESSAGES
 * ============================================
 *
 * GET /api/ai/conversations/:conversationId
 */
router.get("/conversations/:conversationId", getAiConversationByIdController);

/*
 * ============================================
 * DELETE CONVERSATION
 * ============================================
 *
 * DELETE /api/ai/conversations/:conversationId
 */
router.delete("/conversations/:conversationId", deleteAiConversationController);

export default router;
