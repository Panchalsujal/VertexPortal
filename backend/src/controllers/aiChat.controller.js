import { asyncHandler } from "../utils/asyncHandler.js";

import { generateAiAnswer } from "../service/aiChat.service.js";

export const generateAiAnswerController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const {
    content,
    moduleId = null,
    lectureId = null,
    resourceType = null,
    courseId = null,
  } = req.body || {};

  const result = await generateAiAnswer({
    userId: req.user.id,
    userRole: req.user.role,
    conversationId,
    content,
    moduleId,
    lectureId,
    resourceType,
    courseId,
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
