import { Mistral } from "@mistralai/mistralai";
import { config } from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";

const mistral = new Mistral({
  apiKey: config.MISTRAL_API_KEY,
});

const CHAT_MODEL = config.MISTRAL_CHAT_MODEL || "mistral-large-latest";

/**
 * Generates MCQs for a given topic or lecture content using Mistral AI.
 */
export async function generateQuizWithAi({ topic, count = 5, difficulty = "medium" }) {
  if (!topic || !topic.trim()) {
    throw new ApiError(400, "Topic or lecture content is required to generate quiz questions");
  }

  const numQuestions = Math.min(Math.max(Number(count) || 5, 1), 10);

  const prompt = `You are an expert curriculum designer and educator.
Generate exactly ${numQuestions} multiple-choice questions (MCQs) for the following topic/content at '${difficulty}' difficulty level:

Topic / Content:
${topic.trim().slice(0, 4000)}

Requirements:
1. Provide exactly 4 options per question.
2. Mark exactly 1 option as correct (isCorrect: true) and the others as false (isCorrect: false).
3. Include a concise explanation for why the correct answer is right.
4. Output MUST be ONLY valid JSON matching this exact schema, without markdown code fences or conversational text:

[
  {
    "questionText": "What is ...?",
    "points": 1,
    "explanation": "This is correct because...",
    "options": [
      { "text": "Option A", "isCorrect": false },
      { "text": "Option B", "isCorrect": true },
      { "text": "Option C", "isCorrect": false },
      { "text": "Option D", "isCorrect": false }
    ]
  }
]`;

  try {
    const response = await mistral.chat.complete({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a JSON-only API that generates structured educational quiz questions. Output strictly raw JSON array.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    let rawContent = response.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") {
      if (Array.isArray(rawContent)) {
        rawContent = rawContent.map((item) => (typeof item === "string" ? item : item?.text || "")).join("");
      } else {
        rawContent = String(rawContent || "");
      }
    }

    // Clean markdown fences if any
    const cleanJson = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const questions = JSON.parse(cleanJson);

    if (!Array.isArray(questions)) {
      throw new Error("AI output was not a valid questions array");
    }

    // Validate and format questions
    const formattedQuestions = questions.map((q, idx) => ({
      questionText: String(q.questionText || `Question ${idx + 1}`).trim(),
      points: Number(q.points) || 1,
      explanation: String(q.explanation || "").trim(),
      options: Array.isArray(q.options)
        ? q.options.map((opt) => ({
            text: String(opt.text || "").trim(),
            isCorrect: Boolean(opt.isCorrect),
            explanation: String(opt.explanation || "").trim(),
          }))
        : [],
    }));

    return formattedQuestions;
  } catch (error) {
    console.error("AI Quiz Generator error:", error);
    throw new ApiError(500, "Failed to generate AI quiz questions: " + (error.message || "Unknown error"));
  }
}
