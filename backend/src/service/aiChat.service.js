import { Mistral } from "@mistralai/mistralai";

import AiConversation from "../models/aiConversation.model.js";
import AiMessage from "../models/aiMessage.model.js";

import {
  searchCourseKnowledge,
} from "./rag.service.js";

import {
  saveAiAssistantMessage,
} from "./aiAssistant.service.js";

import {
  validateObjectId,
} from "../utils/validator.js";

import { config } from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";

const mistral = new Mistral({
  apiKey: config.MISTRAL_API_KEY,
});

/*
 * Mistral docs currently expose multiple
 * chat-capable models. Keep model configurable
 * so later model changes don't require service edits.
 */
const CHAT_MODEL =
  config.MISTRAL_CHAT_MODEL ||
  "mistral-large-latest";

const MAX_HISTORY_MESSAGES = 10;

const RAG_RESULT_LIMIT = 6;

const RAG_MINIMUM_SCORE = 0.55;

/*
 * ============================================
 * Convert Mistral response content to string
 * ============================================
 *
 * Mistral response content can be plain string,
 * or a list of content chunks.
 */
function extractAssistantText(content) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (
          chunk &&
          typeof chunk === "object" &&
          chunk.type === "text"
        ) {
          return chunk.text || "";
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

/*
 * ============================================
 * Build RAG context
 * ============================================
 */
function buildRagContext(results) {
  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    return "";
  }

  return results
    .map((result, index) => {
      return [
        `[Source ${index + 1}]`,
        `Title: ${result.title}`,
        `Type: ${result.resourceType}`,
        `Score: ${Number(
          result.score || 0,
        ).toFixed(4)}`,
        `Content: ${result.content}`,
      ].join("\n");
    })
    .join("\n\n");
}

/*
 * ============================================
 * Convert RAG results to AiMessage sources
 * ============================================
 */
function buildMessageSources(results) {
  return results.map((result) => ({
    resourceType:
      result.resourceType,

    resourceId:
      result.resourceId,

    title:
      result.title || "",

    excerpt:
      String(
        result.content || "",
      ).slice(0, 2000),

    score:
      Number(
        result.score || 0,
      ),
  }));
}

/*
 * ============================================
 * Recent conversation history
 * ============================================
 */
async function getConversationHistory(
  conversationId,
) {
  const messages =
    await AiMessage.find({
      conversation:
        conversationId,

      isActive:
        true,

      role: {
        $in: [
          "user",
          "assistant",
        ],
      },
    })
      .select(
        "role content createdAt",
      )
      .sort({
        createdAt:
          -1,
      })
      .limit(
        MAX_HISTORY_MESSAGES,
      )
      .lean();

  /*
   * DB se latest-first liya,
   * model ko chronological order chahiye.
   */
  return messages
    .reverse()
    .map((message) => ({
      role:
        message.role,

      content:
        message.content,
    }));
}

/*
 * ============================================
 * System prompt
 * ============================================
 */
function buildSystemPrompt({
  hasCourse,
}) {
  if (hasCourse) {
    return `
You are an AI learning assistant inside an LMS.

Your primary job is to answer the user's question using the supplied course context.

Rules:
1. Prefer the supplied course context over general knowledge.
2. Do not invent facts that are not supported by the course context.
3. If the context is insufficient, clearly say that the course material does not contain enough information.
4. You may explain the retrieved material in simpler language.
5. Keep answers clear, educational, and concise.
6. When course sources are supplied, refer to them naturally as Source 1, Source 2, etc.
7. Never claim that a source says something unless it is present in that source.
`.trim();
  }

  return `
You are an AI learning assistant inside an LMS.

Help the user understand concepts clearly and accurately.
Keep answers educational, concise, and structured when useful.
`.trim();
}

/*
 * ============================================
 * Send message + generate AI answer
 * ============================================
 */
export async function generateAiAnswer({
  userId,
  userRole,
  conversationId,
  content,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    conversationId,
    "conversation ID",
  );

  const normalizedContent =
    String(content || "").trim();

  if (!normalizedContent) {
    throw new ApiError(
      400,
      "Message is required",
    );
  }

  if (
    normalizedContent.length >
    10000
  ) {
    throw new ApiError(
      400,
      "Message cannot exceed 10000 characters",
    );
  }

  const conversation =
    await AiConversation.findOne({
      _id:
        conversationId,

      user:
        userId,

      isActive:
        true,
    });

  if (!conversation) {
    throw new ApiError(
      404,
      "AI conversation not found",
    );
  }

  /*
   * User message save.
   */
  const userMessage =
    await AiMessage.create({
      conversation:
        conversation._id,

      user:
        userId,

      course:
        conversation.course ??
        null,

      role:
        "user",

      content:
        normalizedContent,

      sources:
        [],

      metadata:
        null,

      isActive:
        true,
    });

  conversation.messageCount +=
    1;

  conversation.lastMessageAt =
    new Date();

  /*
   * First user message se conversation title.
   */
  if (
    conversation.messageCount ===
      1 &&
    (
      !conversation.title ||
      conversation.title ===
        "New conversation"
    )
  ) {
    conversation.title =
      normalizedContent.length >
      60
        ? `${normalizedContent.slice(
            0,
            57,
          )}...`
        : normalizedContent;
  }

  await conversation.save();

  /*
   * ======================================
   * RAG retrieval
   * ======================================
   */
  let ragResults = [];

  if (conversation.course) {
    try {
      ragResults =
        await searchCourseKnowledge({
          userId,
          userRole,

          courseId:
            conversation.course,

          query:
            normalizedContent,

          limit:
            RAG_RESULT_LIMIT,

          minimumScore:
            RAG_MINIMUM_SCORE,
        });
    } catch (error) {
      console.error(
        "RAG retrieval failed:",
        error,
      );

      throw new ApiError(
        500,
        "Failed to retrieve course knowledge",
      );
    }
  }

  const ragContext =
    buildRagContext(
      ragResults,
    );

  /*
   * ======================================
   * Conversation history
   * ======================================
   *
   * Note:
   * userMessage abhi DB me save ho chuka hai,
   * so history me current question bhi present hai.
   */
  const history =
    await getConversationHistory(
      conversation._id,
    );

  /*
   * Current question ko history se duplicate
   * hone se bachane ke liye last message remove.
   */
  const previousHistory =
    history.length > 0
      ? history.slice(0, -1)
      : [];

  const systemPrompt =
    buildSystemPrompt({
      hasCourse:
        Boolean(
          conversation.course,
        ),
    });

  const modelMessages = [
    {
      role:
        "system",

      content:
        systemPrompt,
    },

    ...previousHistory,

    /*
     * Course-linked conversation hai to
     * context + question ek user message me.
     */
    {
      role:
        "user",

      content:
        conversation.course
          ? `
COURSE CONTEXT:

${
  ragContext ||
  "No relevant course context was retrieved."
}

USER QUESTION:

${normalizedContent}
`.trim()
          : normalizedContent,
    },
  ];

  /*
   * ======================================
   * Mistral generation
   * ======================================
   */
  let response;

  try {
    response =
      await mistral.chat.complete({
        model:
          CHAT_MODEL,

        messages:
          modelMessages,

        temperature:
          0.2,

        maxTokens:
          1200,
      });
  } catch (error) {
    console.error(
      "Mistral chat generation failed:",
      error,
    );

    if (
      error?.status === 429 ||
      error?.statusCode === 429
    ) {
      throw new ApiError(
        429,
        "Mistral rate limit exceeded",
      );
    }

    if (
      error?.status === 401 ||
      error?.statusCode === 401
    ) {
      throw new ApiError(
        500,
        "Invalid Mistral API configuration",
      );
    }

    throw new ApiError(
      500,
      "Failed to generate AI response",
    );
  }

  const rawContent =
    response?.choices?.[0]
      ?.message?.content;

  const assistantText =
    extractAssistantText(
      rawContent,
    );

  if (!assistantText) {
    throw new ApiError(
      500,
      "AI returned an empty response",
    );
  }

  /*
   * ======================================
   * Save assistant message
   * ======================================
   */
  const sources =
    buildMessageSources(
      ragResults,
    );

  const assistantMessage =
    await saveAiAssistantMessage({
      conversationId:
        conversation._id,

      userId,

      content:
        assistantText,

      sources,

      metadata: {
        provider:
          "mistral",

        model:
          CHAT_MODEL,

        ragEnabled:
          Boolean(
            conversation.course,
          ),

        retrievedChunks:
          ragResults.length,

        usage: {
          promptTokens:
            response?.usage
              ?.promptTokens ??
            null,

          completionTokens:
            response?.usage
              ?.completionTokens ??
            null,

          totalTokens:
            response?.usage
              ?.totalTokens ??
            null,
        },
      },
    });

  return {
    userMessage,

    assistantMessage,

    sources,

    retrieval: {
      enabled:
        Boolean(
          conversation.course,
        ),

      retrievedChunks:
        ragResults.length,

      results:
        ragResults,
    },

    model: {
      provider:
        "mistral",

      name:
        CHAT_MODEL,
    },
  };
}