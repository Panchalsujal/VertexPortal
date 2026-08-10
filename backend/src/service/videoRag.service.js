import Lecture from "../models/lecture.model.js";

import {
  extractAudioFromVideoBuffer,
} from "./videoAudio.service.js";

import {
  transcribeAudioBuffer,
} from "./transcription.service.js";

import {
  ingestRagResource,
} from "./rag.service.js";

import {
  createOrResetRagIndexingJob,
  markRagIndexingProcessing,
  markRagIndexingCompleted,
  markRagIndexingFailed,
} from "./ragIndexing.service.js";

import {
  validateObjectId,
} from "../utils/validator.js";

import {
  ApiError,
} from "../utils/ApiError.js";

/*
 * ==========================================
 * VIDEO → TRANSCRIPT → RAG
 * ==========================================
 */

export async function indexLectureVideoForRag({
  userId,
  userRole,
  lectureId,
  videoBuffer,
  fileName = "",
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    lectureId,
    "lecture ID",
  );

  if (
    !videoBuffer ||
    !Buffer.isBuffer(videoBuffer)
  ) {
    throw new ApiError(
      400,
      "Valid video buffer is required",
    );
  }

  /*
   * 1. Find lecture
   */
  const lecture =
    await Lecture.findOne({
      _id: lectureId,
      isActive: true,
    })
      .select(`
        _id
        course
        module
        title
        description
        type
        videoUrl
        videoFileId
        isPublished
      `)
      .lean();

  if (!lecture) {
    throw new ApiError(
      404,
      "Lecture not found",
    );
  }

  /*
   * 2. Only video lecture allowed
   */
  if (
    lecture.type !==
    "video"
  ) {
    throw new ApiError(
      400,
      "Only video lectures can be transcribed",
    );
  }

  /*
   * 3. Create/reset indexing job
   */
  const indexingJob =
    await createOrResetRagIndexingJob({
      userId,

      courseId:
        lecture.course,

      moduleId:
        lecture.module ?? null,

      lectureId:
        lecture._id,

      resourceType:
        "lecture",

      resourceId:
        lecture._id,

      metadata: {
        source:
          "video_transcript",

        originalFileName:
          String(fileName || ""),

        videoUrl:
          lecture.videoUrl ?? null,

        videoFileId:
          lecture.videoFileId ?? null,
      },
    });

  /*
   * 4. Mark processing
   */
  await markRagIndexingProcessing(
    indexingJob._id,
  );

  try {
    /*
     * 5. Video → MP3
     */
    const {
      audioBuffer,
      fileName:
        audioFileName,
    } =
      await extractAudioFromVideoBuffer({
        videoBuffer,

        originalName:
          fileName,
      });

    /*
     * 6. Audio → transcript
     */
    const transcription =
      await transcribeAudioBuffer({
        audioBuffer,

        fileName:
          audioFileName,
      });

    const transcript =
      String(
        transcription.text || "",
      ).trim();

    if (!transcript) {
      throw new ApiError(
        400,
        "Video transcription returned empty text",
      );
    }

    /*
     * 7. Build knowledge text
     */
    const text = [
      lecture.title
        ? `Lecture Title:\n${lecture.title}`
        : null,

      fileName
        ? `Video File Name:\n${fileName}`
        : null,

      lecture.description
        ? `Description:\n${lecture.description}`
        : null,

      `Video Transcript:\n${transcript}`,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    /*
     * 8. Transcript → embeddings → ragchunks
     */
    const result =
      await ingestRagResource({
        userId,
        userRole,

        courseId:
          lecture.course,

        moduleId:
          lecture.module ?? null,

        lectureId:
          lecture._id,

        resourceType:
          "lecture",

        resourceId:
          lecture._id,

        title:
          lecture.title,

        text,

        metadata: {
          source:
            "video_transcript",

          videoUrl:
            lecture.videoUrl ??
            null,

          videoFileId:
            lecture.videoFileId ??
            null,

          originalFileName:
            String(fileName || ""),

          transcriptionLanguage:
            transcription.language ??
            null,

          transcriptionModel:
            transcription.model,

          transcriptionUsage:
            transcription.usage ??
            null,
        },
      });

    /*
     * 9. Mark completed
     */
    const completedJob =
      await markRagIndexingCompleted({
        jobId:
          indexingJob._id,

        chunksCreated:
          result.chunksCreated,

        metadata: {
          source:
            "video_transcript",

          lectureId:
            lecture._id.toString(),

          originalFileName:
            String(fileName || ""),

          videoUrl:
            lecture.videoUrl ??
            null,

          videoFileId:
            lecture.videoFileId ??
            null,

          transcriptionLanguage:
            transcription.language ??
            null,

          transcriptionModel:
            transcription.model,

          transcriptionUsage:
            transcription.usage ??
            null,

          chunksCreated:
            result.chunksCreated,
        },
      });

    return {
      lectureId:
        lecture._id,

      courseId:
        lecture.course,

      moduleId:
        lecture.module ?? null,

      indexingJobId:
        completedJob._id,

      indexingStatus:
        completedJob.status,

      transcript,

      language:
        transcription.language ??
        null,

      chunksCreated:
        result.chunksCreated,

      transcriptionUsage:
        transcription.usage ??
        null,

      message:
        "Lecture video transcribed and indexed for AI successfully",
    };
  } catch (error) {
    /*
     * 10. Mark failed
     */
    try {
      await markRagIndexingFailed({
        jobId:
          indexingJob._id,

        error,
      });
    } catch (statusError) {
      console.error(
        "Failed to update video RAG indexing job status:",
        statusError,
      );
    }

    throw error;
  }
}