import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

import { ApiError } from "../utils/ApiError.js";

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn(
      ffmpegPath,
      args,
      {
        windowsHide: true,
      },
    );

    let stderr = "";

    process.stderr.on(
      "data",
      (data) => {
        stderr += data.toString();
      },
    );

    process.on(
      "error",
      (error) => {
        reject(error);
      },
    );

    process.on(
      "close",
      (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `FFmpeg exited with code ${code}: ${stderr}`,
          ),
        );
      },
    );
  });
}

/*
 * ============================================
 * VIDEO BUFFER → MP3 AUDIO BUFFER
 * ============================================
 */
export async function extractAudioFromVideoBuffer({
  videoBuffer,
  originalName = "lecture-video.mp4",
}) {
  if (
    !videoBuffer ||
    !Buffer.isBuffer(videoBuffer)
  ) {
    throw new ApiError(
      400,
      "Valid video buffer is required",
    );
  }

  const tempId =
    crypto.randomUUID();

  const extension =
    path.extname(
      originalName,
    ) || ".mp4";

  const inputPath =
    path.join(
      os.tmpdir(),
      `${tempId}${extension}`,
    );

  const outputPath =
    path.join(
      os.tmpdir(),
      `${tempId}.mp3`,
    );

  try {
    await fs.writeFile(
      inputPath,
      videoBuffer,
    );

    /*
     * Video stream remove:
     * -vn
     *
     * Mono + 16 kHz speech audio
     * transcription ke liye enough hai.
     */
    await runFfmpeg([
      "-y",

      "-i",
      inputPath,

      "-vn",

      "-ac",
      "1",

      "-ar",
      "16000",

      "-codec:a",
      "libmp3lame",

      "-b:a",
      "64k",

      outputPath,
    ]);

    const audioBuffer =
      await fs.readFile(
        outputPath,
      );

    if (
      !audioBuffer ||
      audioBuffer.length === 0
    ) {
      throw new ApiError(
        500,
        "Audio extraction produced an empty file",
      );
    }

    return {
      audioBuffer,

      fileName:
        `${path.parse(originalName).name}.mp3`,
    };
  } catch (error) {
    console.error(
      "Video audio extraction failed:",
      error,
    );

    if (
      error instanceof
      ApiError
    ) {
      throw error;
    }

    throw new ApiError(
      500,
      "Failed to extract audio from video",
    );
  } finally {
    await Promise.allSettled([
      fs.unlink(inputPath),
      fs.unlink(outputPath),
    ]);
  }
}