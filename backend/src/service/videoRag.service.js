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
  fileName,
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  validateObjectId(
    lectureId,
    "lecture ID",
  );

  const lecture =
    await Lecture.findOne({
      _id:
        lectureId,

      isActive:
        true,
    })
      .select(`
        _id
        course
        module
        title
        description
        type
        videoUrl
        isPublished
      `)
      .lean();

  if (!lecture) {
    throw new ApiError(
      404,
      "Lecture not found",
    );
  }

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
   * 1. Video → MP3
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
   * 2. MP3 → transcript
   */
  const transcription =
    await transcribeAudioBuffer({
      audioBuffer,

      fileName:
        audioFileName,
    });

  /*
   * 3. Build AI knowledge
   */
  const text = [
    lecture.title
      ? `Lecture Title:\n${lecture.title}`
      : null,

    lecture.description
      ? `Description:\n${lecture.description}`
      : null,

    `Video Transcript:\n${transcription.text}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  /*
   * 4. Transcript → embeddings → ragchunks
   */
  const result =
    await ingestRagResource({
      userId,
      userRole,

      courseId:
        lecture.course,

      moduleId:
        lecture.module,

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

        originalFileName:
          fileName,

        transcriptionLanguage:
          transcription.language,

        transcriptionModel:
          transcription.model,

        transcriptionUsage:
          transcription.usage,
      },
    });

  return {
    lectureId:
      lecture._id,

    courseId:
      lecture.course,

    transcript:
      transcription.text,

    language:
      transcription.language,

    chunksCreated:
      result.chunksCreated,

    transcriptionUsage:
      transcription.usage,

    message:
      "Lecture video transcribed and indexed for AI successfully",
  };
}