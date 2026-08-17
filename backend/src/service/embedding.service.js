import { Mistral } from "@mistralai/mistralai";

import { config } from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";
import { circuitBreakers } from "../utils/circuitBreaker.js";

const EMBEDDING_MODEL = "mistral-embed";

export const EMBEDDING_DIMENSIONS = 1024;

if (!config.MISTRAL_API_KEY) {
  throw new Error(
    "MISTRAL_API_KEY is missing from environment variables",
  );
}

const mistral = new Mistral({
  apiKey: config.MISTRAL_API_KEY,
});

/*
 * ==========================================
 * Validate embedding
 * ==========================================
 */
function validateEmbedding(embedding) {
  if (!Array.isArray(embedding)) {
    throw new ApiError(
      500,
      "Invalid embedding returned by Mistral",
    );
  }

  if (
    embedding.length !==
    EMBEDDING_DIMENSIONS
  ) {
    throw new ApiError(
      500,
      `Invalid embedding dimensions. Expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`,
    );
  }

  const hasInvalidValue =
    embedding.some(
      (value) =>
        typeof value !== "number" ||
        !Number.isFinite(value),
    );

  if (hasInvalidValue) {
    throw new ApiError(
      500,
      "Embedding contains invalid numeric values",
    );
  }

  return embedding;
}

/*
 * ==========================================
 * Mistral API error handler
 * ==========================================
 */
function handleEmbeddingError(
  error,
  fallbackMessage,
) {
  /*
   * Hamare own ApiError ko preserve karo.
   */
  if (error instanceof ApiError) {
    throw error;
  }

  const status =
    error?.statusCode ??
    error?.status;

  if (status === 429) {
    throw new ApiError(
      429,
      "Mistral embedding rate limit exceeded",
    );
  }

  if (status === 401) {
    throw new ApiError(
      500,
      "Invalid Mistral API configuration",
    );
  }

  if (status === 400) {
    throw new ApiError(
      400,
      "Invalid embedding request",
    );
  }

  throw new ApiError(
    500,
    fallbackMessage,
  );
}

/*
 * ==========================================
 * Single embedding
 * ==========================================
 */
export async function generateEmbedding(
  text,
) {
  const normalizedText =
    String(text || "").trim();

  if (!normalizedText) {
    throw new ApiError(
      400,
      "Embedding text is required",
    );
  }

  try {
    const response = await circuitBreakers.mistralEmbedding.fire(() =>
      mistral.embeddings.create({
        model: EMBEDDING_MODEL,
        inputs: [normalizedText],
      })
    );

    const embedding =
      response.data?.[0]?.embedding;

    return validateEmbedding(
      embedding,
    );
  } catch (error) {
    console.error(
      "Mistral embedding generation failed:",
      error,
    );

    handleEmbeddingError(
      error,
      "Failed to generate embedding",
    );
  }
}

/*
 * ==========================================
 * Bulk embeddings
 * ==========================================
 */
export async function generateEmbeddings(
  texts,
) {
  if (
    !Array.isArray(texts) ||
    texts.length === 0
  ) {
    throw new ApiError(
      400,
      "Embedding texts are required",
    );
  }

  const normalizedTexts =
    texts.map((text) =>
      String(text || "").trim(),
    );

  if (
    normalizedTexts.some(
      (text) => !text,
    )
  ) {
    throw new ApiError(
      400,
      "Embedding text cannot be empty",
    );
  }

  try {
    const response = await circuitBreakers.mistralEmbedding.fire(() =>
      mistral.embeddings.create({
        model: EMBEDDING_MODEL,
        inputs: normalizedTexts,
      })
    );

    if (
      !Array.isArray(response.data) ||
      response.data.length !==
        normalizedTexts.length
    ) {
      throw new ApiError(
        500,
        "Invalid Mistral embeddings response",
      );
    }

    /*
     * Input order preserve karo.
     */
    const sortedData =
      [...response.data].sort(
        (a, b) =>
          Number(a.index) -
          Number(b.index),
      );

    const embeddings =
      sortedData.map((item) =>
        validateEmbedding(
          item.embedding,
        ),
      );

    return embeddings;
  } catch (error) {
    console.error(
      "Mistral bulk embedding generation failed:",
      error,
    );

    handleEmbeddingError(
      error,
      "Failed to generate embeddings",
    );
  }
}