import { Mistral } from "@mistralai/mistralai";

import { config } from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";

const EMBEDDING_MODEL = "mistral-embed";

export const EMBEDDING_DIMENSIONS = 1024;

if (!config.MISTRAL_API_KEY) {
  throw new Error("MISTRAL_API_KEY is missing from environment variables");
}

const mistral = new Mistral({
  apiKey: config.MISTRAL_API_KEY,
});

/*
 * =========================================
 * Single embedding
 * =========================================
 */
export async function generateEmbedding(text) {
  const normalizedText = String(text || "").trim();

  if (!normalizedText) {
    throw new ApiError(400, "Embedding text is required");
  }

  try {
    const response = await mistral.embeddings.create({
      model: EMBEDDING_MODEL,

      inputs: [normalizedText],
    });

    const embedding = response.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error("Mistral embedding was not generated");
    }

    return embedding;
  } catch (error) {
    console.error("Mistral embedding generation failed:", error);

    /*
     * Mistral API errors preserve karne ki
     * koshish karenge.
     */
    if (error?.statusCode === 429 || error?.status === 429) {
      throw new ApiError(429, "Mistral embedding rate limit exceeded");
    }

    if (error?.statusCode === 401 || error?.status === 401) {
      throw new ApiError(500, "Invalid Mistral API configuration");
    }

    throw new ApiError(500, "Failed to generate embedding");
  }
}

/*
 * =========================================
 * Bulk embeddings
 * =========================================
 */
export async function generateEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new ApiError(400, "Embedding texts are required");
  }

  const normalizedTexts = texts.map((text) => String(text || "").trim());

  if (normalizedTexts.some((text) => !text)) {
    throw new ApiError(400, "Embedding text cannot be empty");
  }

  try {
    const response = await mistral.embeddings.create({
      model: EMBEDDING_MODEL,

      inputs: normalizedTexts,
    });

    if (
      !Array.isArray(response.data) ||
      response.data.length !== normalizedTexts.length
    ) {
      throw new Error("Invalid Mistral embeddings response");
    }

    const embeddings = [...response.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    if (embeddings.some((embedding) => !Array.isArray(embedding))) {
      throw new Error("Invalid embedding returned by Mistral");
    }

    return embeddings;
  } catch (error) {
    console.error("Mistral bulk embedding generation failed:", error);

    if (error?.statusCode === 429 || error?.status === 429) {
      throw new ApiError(429, "Mistral embedding rate limit exceeded");
    }

    if (error?.statusCode === 401 || error?.status === 401) {
      throw new ApiError(500, "Invalid Mistral API configuration");
    }

    throw new ApiError(500, "Failed to generate embeddings");
  }
}
