import {
  asyncHandler,
} from "../utils/asyncHandler.js";

import {
  createAiConversation,
  getMyAiConversations,
  getAiConversationById,
  renameAiConversation,
  updateAiConversationArchive,
  deleteAiConversation,
} from "../service/aiAssistant.service.js";

/*
 * ============================================
 * CREATE AI CONVERSATION
 * ============================================
 *
 * POST /api/ai/conversations
 */
export const createAiConversationController =
  asyncHandler(
    async (req, res) => {
      const conversation =
        await createAiConversation({
          userId:
            req.user.id,

          userRole:
            req.user.role,

          payload:
            req.body,
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "AI conversation created successfully",

          conversation,
        });
    },
  );

/*
 * ============================================
 * GET MY AI CONVERSATIONS
 * ============================================
 *
 * GET /api/ai/conversations
 */
export const getMyAiConversationsController =
  asyncHandler(
    async (req, res) => {
      const result =
        await getMyAiConversations({
          userId:
            req.user.id,

          query:
            req.query,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "AI conversations fetched successfully",

          conversations:
            result.conversations,

          pagination:
            result.pagination,
        });
    },
  );

/*
 * ============================================
 * GET SINGLE CONVERSATION + MESSAGES
 * ============================================
 *
 * GET /api/ai/conversations/:conversationId
 */
export const getAiConversationByIdController =
  asyncHandler(
    async (req, res) => {
      const {
        conversationId,
      } = req.params;

      const result =
        await getAiConversationById({
          userId:
            req.user.id,

          conversationId,

          query:
            req.query,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "AI conversation fetched successfully",

          conversation:
            result.conversation,

          messages:
            result.messages,

          pagination:
            result.pagination,
        });
    },
  );

/*
 * ============================================
 * RENAME CONVERSATION
 * ============================================
 *
 * PATCH /api/ai/conversations/:conversationId/title
 */
export const renameAiConversationController =
  asyncHandler(
    async (req, res) => {
      const {
        conversationId,
      } = req.params;

      const {
        title,
      } = req.body || {};

      const conversation =
        await renameAiConversation({
          userId:
            req.user.id,

          conversationId,

          title,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "AI conversation renamed successfully",

          conversation,
        });
    },
  );

/*
 * ============================================
 * ARCHIVE / UNARCHIVE CONVERSATION
 * ============================================
 *
 * PATCH /api/ai/conversations/:conversationId/archive
 */
export const updateAiConversationArchiveController =
  asyncHandler(
    async (req, res) => {
      const {
        conversationId,
      } = req.params;

      const {
        isArchived,
      } = req.body || {};

      const conversation =
        await updateAiConversationArchive({
          userId:
            req.user.id,

          conversationId,

          isArchived,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            isArchived
              ? "AI conversation archived successfully"
              : "AI conversation restored successfully",

          conversation,
        });
    },
  );

/*
 * ============================================
 * DELETE CONVERSATION
 * ============================================
 *
 * DELETE /api/ai/conversations/:conversationId
 */
export const deleteAiConversationController =
  asyncHandler(
    async (req, res) => {
      const {
        conversationId,
      } = req.params;

      const result =
        await deleteAiConversation({
          userId:
            req.user.id,

          conversationId,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            result.message,

          conversationId:
            result.conversationId,
        });
    },
  );