import { asyncHandler } from "../utils/asyncHandler.js";

import { generateAiAnswer } from "../service/aiChat.service.js";

/*
 * Send question and generate AI response.
 */
export const generateAiAnswerController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const { content } = req.body || {};

  const result = await generateAiAnswer({
    userId: req.user.id,

    userRole: req.user.role,

    conversationId,

    content,
  });

  return res.status(201).json({
    success: true,

    message: "AI response generated successfully",

    userMessage: result.userMessage,

    assistantMessage: result.assistantMessage,

    sources: result.sources,

    retrieval: result.retrieval,

    model: result.model,
  });
});
