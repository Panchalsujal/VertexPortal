import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createAiConversation,
  getMyAiConversations,
  getAiConversationById,
  renameAiConversation,
  updateAiConversationArchive,
  deleteAiConversation,
} from "../service/aiAssistant.service.js";

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

export const getMyAiConversationsController = asyncHandler(async (req, res) => {
  const result = await getMyAiConversations({
    userId: req.user.id,
    query: req.query,
  });

  return res.status(200).json({
    success: true,
    message: "AI conversations fetched successfully",
    conversations: result.conversations,
    pagination: result.pagination,
  });
});

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
      conversation: result.conversation,
      messages: result.messages,
      pagination: result.pagination,
    });
  },
);

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
