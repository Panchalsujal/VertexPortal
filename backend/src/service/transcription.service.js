import { Mistral } from "@mistralai/mistralai";

import {
  config,
} from "../config/config.js";

import {
  ApiError,
} from "../utils/ApiError.js";

const mistral =
  new Mistral({
    apiKey:
      config.MISTRAL_API_KEY,
  });

const TRANSCRIPTION_MODEL =
  config.MISTRAL_TRANSCRIPTION_MODEL ||
  "voxtral-mini-latest";

/*
 * ==========================================
 * AUDIO BUFFER → TEXT
 * ==========================================
 */
export async function transcribeAudioBuffer({
  audioBuffer,
  fileName = "audio.mp3",
  language = null,
}) {
  if (
    !audioBuffer ||
    !Buffer.isBuffer(audioBuffer)
  ) {
    throw new ApiError(
      400,
      "Valid audio buffer is required",
    );
  }

  try {
    /*
     * SDK file object:
     * content + fileName
     */
    const response =
      await mistral.audio.transcriptions.complete({
        model:
          TRANSCRIPTION_MODEL,

        file: {
          content:
            audioBuffer,

          fileName,
        },

        /*
         * Language optional.
         * Null ho to model detect karega.
         */
        ...(language
          ? {
              language,
            }
          : {}),

        timestampGranularities: [
          "segment",
        ],
      });

    const transcript =
      String(
        response?.text || "",
      ).trim();

    if (!transcript) {
      throw new ApiError(
        400,
        "No speech could be transcribed from the video",
      );
    }

    return {
      text:
        transcript,

      language:
        response?.language ??
        language ??
        null,

      segments:
        response?.segments ??
        [],

      usage: {
        audioSeconds:
          response?.usage
            ?.promptAudioSeconds ??
          response?.usage
            ?.prompt_audio_seconds ??
          null,

        promptTokens:
          response?.usage
            ?.promptTokens ??
          response?.usage
            ?.prompt_tokens ??
          null,

        completionTokens:
          response?.usage
            ?.completionTokens ??
          response?.usage
            ?.completion_tokens ??
          null,

        totalTokens:
          response?.usage
            ?.totalTokens ??
          response?.usage
            ?.total_tokens ??
          null,
      },

      model:
        TRANSCRIPTION_MODEL,
    };
  } catch (error) {
    console.error(
      "Mistral transcription failed:",
      error,
    );

    if (
      error instanceof
      ApiError
    ) {
      throw error;
    }

    if (
      error?.status === 429 ||
      error?.statusCode === 429
    ) {
      throw new ApiError(
        429,
        "Mistral transcription rate limit exceeded",
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
      "Failed to transcribe lecture video",
    );
  }
}