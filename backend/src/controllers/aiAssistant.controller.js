import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createAiConversation,
  getMyAiConversations,
  getAiConversationById,
  addAiUserMessage,
  renameAiConversation,
  updateAiConversationArchive,
  deleteAiConversation,
} from "../service/aiAssistant.service.js";

/*
 * Create conversation
 */
export const createAiConversationController = asyncHandler(async (req, res) => {
  const conversation = await createAiConversation({
    userId: req.user.id,

    userRole: req.user.role,

    payload: req.body,
  });

  return res.status(201).json({
    success: true,

    message: "AI conversation created successfully",

    conversation,
  });
});

/*
 * Conversation listing
 */
export const getMyAiConversationsController = asyncHandler(async (req, res) => {
  const result = await getMyAiConversations({
    userId: req.user.id,

    query: req.query,
  });

  return res.status(200).json({
    success: true,

    message: "AI conversations fetched successfully",

    ...result,
  });
});

/*
 * Conversation details
 */
export const getAiConversationByIdController = asyncHandler(
  async (req, res) => {
    const { conversationId } = req.params;

    const result = await getAiConversationById({
      userId: req.user.id,

      conversationId,

      query: req.query,
    });

    return res.status(200).json({
      success: true,

      message: "AI conversation fetched successfully",

      ...result,
    });
  },
);

/*
 * Add user message
 */
export const addAiUserMessageController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const { content } = req.body || {};

  const result = await addAiUserMessage({
    userId: req.user.id,

    userRole: req.user.role,

    conversationId,

    content,
  });

  return res.status(201).json({
    success: true,

    message: "Message added successfully",

    userMessage: result.message,

    conversation: result.conversation,
  });
});

/*
 * Rename
 */
export const renameAiConversationController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const { title } = req.body || {};

  const conversation = await renameAiConversation({
    userId: req.user.id,

    conversationId,

    title,
  });

  return res.status(200).json({
    success: true,

    message: "AI conversation renamed successfully",

    conversation,
  });
});

/*
 * Archive / restore
 */
export const updateAiConversationArchiveController = asyncHandler(
  async (req, res) => {
    const { conversationId } = req.params;

    const { isArchived } = req.body || {};

    const conversation = await updateAiConversationArchive({
      userId: req.user.id,

      conversationId,

      isArchived,
    });

    return res.status(200).json({
      success: true,

      message: isArchived
        ? "AI conversation archived successfully"
        : "AI conversation restored successfully",

      conversation,
    });
  },
);

/*
 * Delete
 */
export const deleteAiConversationController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const result = await deleteAiConversation({
    userId: req.user.id,

    conversationId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    conversationId: result.conversationId,
  });
});
