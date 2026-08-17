import { Mistral } from "@mistralai/mistralai";

import AiConversation from "../models/aiConversation.model.js";
import AiMessage from "../models/aiMessage.model.js";
import Course from "../models/course.model.js";

import { searchCourseKnowledge } from "./rag.service.js";

import { saveAiAssistantMessage } from "./aiAssistant.service.js";

import { validateObjectId } from "../utils/validator.js";

import { config } from "../config/config.js";

import { ApiError } from "../utils/ApiError.js";
import { circuitBreakers } from "../utils/circuitBreaker.js";

/*
 * ============================================
 * CONFIG VALIDATION
 * ============================================
 */

if (!config.MISTRAL_API_KEY) {
  throw new Error("MISTRAL_API_KEY is missing from environment variables");
}

const mistral = new Mistral({
  apiKey: config.MISTRAL_API_KEY,
});

const CHAT_MODEL = config.MISTRAL_CHAT_MODEL || "mistral-large-latest";

const MAX_HISTORY_MESSAGES = 10;

const RAG_RESULT_LIMIT = 6;

/*
 * ============================================
 * CONVERT MISTRAL CONTENT TO STRING
 * ============================================
 */

function extractAssistantText(content) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((chunk) => {
        if (chunk && typeof chunk === "object" && chunk.type === "text") {
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
 * BUILD GROUPED RAG CONTEXT
 * ============================================
 *
 * Same resource ke multiple chunks ko
 * same Source number milega.
 */
function buildRagContext(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return "";
  }

  const groupedSources = new Map();

  for (const result of results) {
    const resourceType = String(result.resourceType || "");

    const resourceId = String(result.resourceId || "");

    if (!resourceType || !resourceId) {
      continue;
    }

    const key = `${resourceType}:${resourceId}`;

    if (!groupedSources.has(key)) {
      groupedSources.set(key, {
        resourceType,

        resourceId,

        title: result.title || "",

        chunks: [],
      });
    }

    const source = groupedSources.get(key);

    source.chunks.push({
      content: String(result.content || "").trim(),

      score: Number(result.score || 0),

      chunkIndex: result.chunkIndex,
    });
  }

  return Array.from(groupedSources.values())
    .map((source, index) => {
      /*
       * Highest score first.
       */
      const chunks = [...source.chunks].sort((a, b) => b.score - a.score);

      const combinedContent = chunks
        .map((chunk, chunkIndex) =>
          [`Chunk ${chunkIndex + 1}:`, chunk.content].join("\n"),
        )
        .join("\n\n");

      return [
        `[Source ${index + 1}]`,

        `Title: ${source.title}`,

        `Type: ${source.resourceType}`,

        `Resource ID: ${source.resourceId}`,

        `Content:`,

        combinedContent,
      ].join("\n");
    })
    .join("\n\n");
}

/*
 * ============================================
 * BUILD UNIQUE MESSAGE SOURCES
 * ============================================
 *
 * RAG ke multiple chunks same resource se
 * aa sakte hain.
 *
 * AI ko saare chunks context ke liye milenge,
 * lekin API sources me same resource
 * sirf ek baar return hoga.
 */
function buildMessageSources(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }

  const sourceMap = new Map();

  for (const result of results) {
    const resourceType = String(result.resourceType || "");

    const resourceId = String(result.resourceId || "");

    if (!resourceType || !resourceId) {
      continue;
    }

    /*
     * resourceType bhi key me rakhenge
     * because theoretically same ObjectId
     * different resource type me ho sakta hai.
     */
    const key = `${resourceType}:${resourceId}`;

    const score = Number(result.score || 0);

    const excerpt = String(result.content || "")
      .trim()
      .slice(0, 2000);

    /*
     * First occurrence
     */
    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        resourceType,

        resourceId: result.resourceId,

        title: result.title || "",

        excerpt,

        score,
      });

      continue;
    }

    /*
     * Same resource ka agar better scoring
     * chunk mila to source card me wahi
     * excerpt use karenge.
     */
    const existing = sourceMap.get(key);

    if (score > Number(existing.score || 0)) {
      sourceMap.set(key, {
        resourceType,

        resourceId: result.resourceId,

        title: result.title || "",

        excerpt,

        score,
      });
    }
  }

  /*
   * Highest score first
   */
  return Array.from(sourceMap.values()).sort(
    (a, b) => Number(b.score || 0) - Number(a.score || 0),
  );
}

/*
 * ============================================
 * RECENT CONVERSATION HISTORY
 * ============================================
 */

async function getConversationHistory(conversationId) {
  const messages = await AiMessage.find({
    conversation: conversationId,

    isActive: true,

    role: {
      $in: ["user", "assistant"],
    },
  })
    .select("role content createdAt")
    .sort({
      createdAt: -1,
    })
    .limit(MAX_HISTORY_MESSAGES)
    .lean();

  /*
   * Latest-first ko chronological order
   * me convert.
   */
  return messages.reverse().map((message) => ({
    role: message.role,

    content: message.content,
  }));
}

/*
 * ============================================
 * SYSTEM PROMPT
 * ============================================
 */

function buildSystemPrompt({ hasCourse, hasLectureScope }) {
  const languageAndMarkdownRules = `
LANGUAGE & FORMATTING RULES:
1. ALWAYS respond in clear English (or Hinglish if the user explicitly wrote the prompt in Hindi/Hinglish).
2. STRICTLY FORBIDDEN: Do NOT output Chinese, Japanese, or any Asian script under any circumstances. All explanations, labels, notes, and citations MUST be in English.
3. ALWAYS format your response in clean, beautiful GitHub Flavored Markdown (MD).
4. Use clear section headers (###, ####), bold highlights (**text**), bullet points (- or 1.), and code blocks where helpful.
5. Keep paragraphs structured, readable, and visually engaging.`;

  if (hasCourse) {
    return `
You are the expert AI Tutor and Learning Assistant inside VertexPortal LMS.

Your primary job is to answer the user's question using the supplied course context and uploaded syllabus/documents.

Rules:
1. Prefer the supplied course context and documents over generic knowledge.
2. Do not invent facts that are not supported by the supplied course context.
3. If the context contains specific syllabus details (e.g. project names, module topics, tools), extract and quote the exact items from the document.
4. Keep answers clear, educational, and structured.
5. When course sources are supplied, refer to them naturally.
${languageAndMarkdownRules}
`.trim();
  }

  return `
You are an expert AI learning assistant inside VertexPortal LMS.

Help the user understand concepts clearly, accurately, and comprehensively.

${languageAndMarkdownRules}
`.trim();
}

/*
 * ============================================
 * MISTRAL ERROR HANDLER
 * ============================================
 */

function handleChatError(error) {
  if (error instanceof ApiError) {
    throw error;
  }

  const status = error?.status ?? error?.statusCode;

  if (status === 429) {
    throw new ApiError(429, "Mistral rate limit exceeded");
  }

  if (status === 401) {
    throw new ApiError(500, "Invalid Mistral API configuration");
  }

  if (status === 400) {
    throw new ApiError(400, "Invalid AI generation request");
  }

  throw new ApiError(500, "Failed to generate AI response");
}

/*
 * ============================================
 * GENERATE AI ANSWER
 * ============================================
 */

export async function generateAiAnswer({
  userId,
  userRole,
  conversationId,
  content,
  moduleId = null,
  lectureId = null,
  resourceType = null,
  courseId = null,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(conversationId, "conversation ID");

  const normalizedContent = String(content || "").trim();
  if (!normalizedContent) {
    throw new ApiError(400, "Message content is required");
  }

  const conversation = await AiConversation.findOne({
    _id: conversationId,
    user: userId,
    isActive: true,
  });

  if (!conversation) {
    throw new ApiError(404, "Active conversation not found");
  }

  // If conversation doesn't have course linked yet but courseId was passed, attach it
  const activeCourseId = conversation.course || courseId || null;
  if (!conversation.course && courseId) {
    conversation.course = courseId;
  }

  /*
   * ======================================
   * SAVE USER MESSAGE
   * ======================================
   */
  const userMessage = await AiMessage.create({
    conversation: conversation._id,
    user: userId,
    role: "user",
    content: normalizedContent,
    scope: {
      course: activeCourseId,
      module: moduleId,
      lecture: lectureId,
      resourceType,
    },
  });

  /*
   * ======================================
   * UPDATE CONVERSATION
   * ======================================
   */
  conversation.messageCount += 1;
  conversation.lastMessageAt = new Date();

  if (
    conversation.messageCount === 1 &&
    (!conversation.title || conversation.title === "New conversation")
  ) {
    conversation.title =
      normalizedContent.length > 60
        ? `${normalizedContent.slice(0, 57)}...`
        : normalizedContent;
  }

  await conversation.save();

  /*
   * ======================================
   * RAG RETRIEVAL & COURSE CONTEXT
   * ======================================
   */
  let ragResults = [];
  let courseDetails = null;

  if (activeCourseId) {
    try {
      courseDetails = await Course.findById(activeCourseId)
        .populate("instructor", "fullName email")
        .select("title description category level price totalLectures totalDuration")
        .lean();
    } catch (err) {
      console.warn("Could not fetch course metadata for AI Tutor:", err?.message || err);
    }

    try {
      const results = await searchCourseKnowledge({
        userId,
        userRole,
        courseId: activeCourseId,
        query: normalizedContent,
        moduleId,
        lectureId,
        resourceType,
        limit: RAG_RESULT_LIMIT,
      });

      ragResults = Array.isArray(results) ? results : [];
    } catch (error) {
      console.warn("RAG retrieval failed, falling back to direct AI chat:", error?.message || error);
      ragResults = [];
    }
  }

  /*
   * ======================================
   * BUILD RAG CONTEXT
   * ======================================
   */
  const ragContext = buildRagContext(ragResults);

  /*
   * ======================================
   * CONVERSATION HISTORY
   * ======================================
   */
  const history = await getConversationHistory(conversation._id);
  const previousHistory = history.length > 0 ? history.slice(0, -1) : [];

  /*
   * ======================================
   * SYSTEM PROMPT
   * ======================================
   */
  const systemPrompt = buildSystemPrompt({
    hasCourse: Boolean(activeCourseId),
    hasLectureScope: Boolean(lectureId),
  });

  /*
   * ======================================
   * MODEL MESSAGES
   * ======================================
   */
  const courseOverviewText = courseDetails
    ? `ACTIVE COURSE INFORMATION:
- Course Title: ${courseDetails.title}
- Description: ${courseDetails.description || "Comprehensive hands-on training"}
- Instructor: ${courseDetails.instructor?.fullName || "VertexPortal Faculty"}
- Level: ${courseDetails.level || "All Levels"}
- Category: ${courseDetails.category || "Development"}
- Total Lectures: ${courseDetails.totalLectures || 0}`
    : "";

  const modelMessages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...previousHistory,
    {
      role: "user",
      content: activeCourseId
        ? `
${courseOverviewText}

ACTIVE COURSE MATERIAL & UPLOADED DOCUMENTS (PRIMARY SOURCE OF TRUTH):
${ragContext || "No specific sub-topics/transcripts matched this query. Please answer using the course overview information above."}

CRITICAL INSTRUCTIONS:
- You are the official AI Teaching Assistant for this course.
- ALWAYS respond in English. Do NOT output Chinese characters or other non-Latin scripts.
- If the retrieved course material contains information related to the question, you MUST base your answer directly on that material.
- If asking about projects, curriculum, modules, or syllabus, list the EXACT project titles and topics from the uploaded document above rather than inventing generic examples.

USER QUESTION:
${normalizedContent}
`.trim()
        : normalizedContent,
    },
  ];

  /*
   * ======================================
   * MISTRAL GENERATION
   * ======================================
   */

  let response;

  try {
    response = await circuitBreakers.mistral.fire(
      () =>
        mistral.chat.complete({
          model: CHAT_MODEL,
          messages: modelMessages,
          temperature: 0.2,
          maxTokens: 1200,
        }),
      {
        args: [],
      }
    );
  } catch (error) {
    console.error("Mistral chat generation failed:", error);

    handleChatError(error);
  }

  /*
   * ======================================
   * PARSE AI RESPONSE
   * ======================================
   */

  const rawContent = response?.choices?.[0]?.message?.content;

  const assistantText = extractAssistantText(rawContent);

  if (!assistantText) {
    throw new ApiError(500, "AI returned an empty response");
  }

  /*
   * ======================================
   * BUILD SOURCES
   * ======================================
   */

  const sources = buildMessageSources(ragResults);

  /*
   * ======================================
   * SAVE ASSISTANT MESSAGE
   * ======================================
   */

  const assistantMessage = await saveAiAssistantMessage({
    conversationId: conversation._id,

    userId,

    content: assistantText,

    sources,

    metadata: {
      provider: "mistral",

      model: CHAT_MODEL,

      ragEnabled: Boolean(conversation.course),

      retrievedChunks: ragResults.length,

      ragScope: {
        moduleId: moduleId ?? null,

        lectureId: lectureId ?? null,

        resourceType: resourceType ?? null,
      },

      usage: {
        promptTokens: response?.usage?.promptTokens ?? null,

        completionTokens: response?.usage?.completionTokens ?? null,

        totalTokens: response?.usage?.totalTokens ?? null,
      },
    },
  });

  /*
   * ======================================
   * FINAL RESPONSE
   * ======================================
   */

  return {
    userMessage,

    assistantMessage,

    sources,

    retrieval: {
      enabled: Boolean(conversation.course),

      retrievedChunks: ragResults.length,

      scope: {
        moduleId: moduleId ?? null,

        lectureId: lectureId ?? null,

        resourceType: resourceType ?? null,
      },
    },

    model: {
      provider: "mistral",

      name: CHAT_MODEL,
    },
  };
}
