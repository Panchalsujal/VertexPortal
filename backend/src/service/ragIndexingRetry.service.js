import Lecture from "../models/lecture.model.js";

import {
  prepareRagIndexingRetry,
  markRagIndexingProcessing,
  markRagIndexingCompleted,
  markRagIndexingFailed,
} from "./ragIndexing.service.js";

import {
  indexLectureDocumentForRag,
} from "./documentRag.service.js";

import {
  indexLectureVideoForRag,
} from "./videoRag.service.js";

import {
  ingestLectureForRag,
} from "./rag.service.js";

import {
  ApiError,
} from "../utils/ApiError.js";

/*
 * =========================================================
 * CONFIG
 * =========================================================
 */

const MAX_RETRY_FILE_SIZE =
  500 * 1024 * 1024;

/*
 * =========================================================
 * DOWNLOAD REMOTE FILE
 * =========================================================
 */

async function downloadRemoteFile(
  fileUrl,
) {
  const normalizedUrl =
    String(fileUrl || "").trim();

  if (!normalizedUrl) {
    throw new ApiError(
      400,
      "Source file URL is missing",
    );
  }

  let parsedUrl;

  try {
    parsedUrl =
      new URL(normalizedUrl);
  } catch {
    throw new ApiError(
      400,
      "Invalid source file URL",
    );
  }

  if (
    parsedUrl.protocol !== "https:"
  ) {
    throw new ApiError(
      400,
      "Only HTTPS source files are supported",
    );
  }

  let response;

  try {
    response =
      await fetch(
        parsedUrl.toString(),
        {
          method: "GET",
        },
      );
  } catch (error) {
    console.error(
      "Retry source download failed:",
      error,
    );

    throw new ApiError(
      502,
      "Failed to download source file",
    );
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      `Source file download failed with status ${response.status}`,
    );
  }

  /*
   * Header level size validation.
   */
  const contentLength =
    Number(
      response.headers.get(
        "content-length",
      ),
    );

  if (
    Number.isFinite(
      contentLength,
    ) &&
    contentLength >
      MAX_RETRY_FILE_SIZE
  ) {
    throw new ApiError(
      413,
      "Source file is too large to retry indexing",
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer,
    );

  if (!buffer.length) {
    throw new ApiError(
      400,
      "Downloaded source file is empty",
    );
  }

  /*
   * Final size validation.
   */
  if (
    buffer.length >
    MAX_RETRY_FILE_SIZE
  ) {
    throw new ApiError(
      413,
      "Source file is too large to retry indexing",
    );
  }

  return {
    buffer,

    contentType:
      response.headers.get(
        "content-type",
      ) || null,
  };
}

/*
 * =========================================================
 * FILE NAME FROM URL
 * =========================================================
 */

function getFileNameFromUrl(
  fileUrl,
  fallbackName = "resource",
) {
  try {
    const parsedUrl =
      new URL(fileUrl);

    const lastPart =
      parsedUrl.pathname
        .split("/")
        .filter(Boolean)
        .pop();

    if (!lastPart) {
      return fallbackName;
    }

    return (
      decodeURIComponent(
        lastPart,
      ) ||
      fallbackName
    );
  } catch {
    return fallbackName;
  }
}

/*
 * =========================================================
 * RETRY DOCUMENT
 * =========================================================
 */

async function retryDocumentIndexing({
  userId,
  userRole,
  job,
  lecture,
}) {
  if (
    lecture.type !==
    "document"
  ) {
    throw new ApiError(
      409,
      "Lecture is no longer a document lecture",
    );
  }

  if (
    !lecture.documentUrl
  ) {
    throw new ApiError(
      400,
      "Lecture document URL is missing",
    );
  }

  const {
    buffer,
  } =
    await downloadRemoteFile(
      lecture.documentUrl,
    );

  const fileName =
    job.metadata?.fileName ||
    getFileNameFromUrl(
      lecture.documentUrl,
      `${lecture.title}.pdf`,
    );

  /*
   * documentRag.service itself:
   *
   * pending/reset
   * processing
   * completed/failed
   *
   * handle karta hai.
   */
  const result =
    await indexLectureDocumentForRag({
      userId,
      userRole,

      lectureId:
        lecture._id,

      fileBuffer:
        buffer,

      fileName,
    });

  return {
    jobId:
      result.indexingJobId,

    resourceType:
      "document",

    resourceId:
      lecture._id,

    source:
      "lecture_document",

    status:
      result.indexingStatus,

    chunksCreated:
      result.chunksCreated,

    pageCount:
      result.pageCount,

    retryCount:
      job.retryCount,

    message:
      "Document AI indexing retried successfully",
  };
}

/*
 * =========================================================
 * RETRY VIDEO TRANSCRIPT
 * =========================================================
 */

async function retryVideoIndexing({
  userId,
  userRole,
  job,
  lecture,
}) {
  if (
    lecture.type !==
    "video"
  ) {
    throw new ApiError(
      409,
      "Lecture is no longer a video lecture",
    );
  }

  if (
    !lecture.videoUrl
  ) {
    throw new ApiError(
      400,
      "Lecture video URL is missing",
    );
  }

  const {
    buffer,
  } =
    await downloadRemoteFile(
      lecture.videoUrl,
    );

  const fileName =
    job.metadata
      ?.originalFileName ||
    getFileNameFromUrl(
      lecture.videoUrl,
      `${lecture.title}.mp4`,
    );

  /*
   * videoRag.service itself:
   *
   * pending/reset
   * processing
   * completed/failed
   *
   * handle karta hai.
   */
  const result =
    await indexLectureVideoForRag({
      userId,
      userRole,

      lectureId:
        lecture._id,

      videoBuffer:
        buffer,

      fileName,
    });

  return {
    jobId:
      result.indexingJobId,

    resourceType:
      "lecture",

    resourceId:
      lecture._id,

    source:
      "video_transcript",

    status:
      result.indexingStatus,

    chunksCreated:
      result.chunksCreated,

    language:
      result.language,

    transcriptionUsage:
      result.transcriptionUsage,

    retryCount:
      job.retryCount,

    message:
      "Video AI indexing retried successfully",
  };
}

/*
 * =========================================================
 * RETRY TEXT LECTURE
 * =========================================================
 */

async function retryTextLectureIndexing({
  userId,
  userRole,
  job,
  lecture,
}) {
  if (
    lecture.type !==
    "text"
  ) {
    throw new ApiError(
      409,
      "Lecture is no longer a text lecture",
    );
  }

  if (
    !String(
      lecture.content || "",
    ).trim()
  ) {
    throw new ApiError(
      400,
      "Text lecture does not contain indexable content",
    );
  }

  /*
   * prepareRagIndexingRetry()
   * job ko pending bana chuka hai.
   *
   * Ab processing.
   */
  await markRagIndexingProcessing(
    job._id,
  );

  try {
    const result =
      await ingestLectureForRag({
        userId,
        userRole,

        lectureId:
          lecture._id,
      });

    const completedJob =
      await markRagIndexingCompleted({
        jobId:
          job._id,

        chunksCreated:
          result.chunksCreated,

        metadata: {
          source:
            "text_lecture",

          lectureId:
            lecture._id.toString(),

          title:
            lecture.title,

          chunksCreated:
            result.chunksCreated,
        },
      });

    return {
      jobId:
        completedJob._id,

      resourceType:
        "lecture",

      resourceId:
        lecture._id,

      source:
        "text_lecture",

      status:
        completedJob.status,

      chunksCreated:
        result.chunksCreated,

      retryCount:
        completedJob.retryCount,

      message:
        "Text lecture AI indexing retried successfully",
    };
  } catch (error) {
    try {
      await markRagIndexingFailed({
        jobId:
          job._id,

        error,
      });
    } catch (statusError) {
      console.error(
        "Failed to mark text lecture retry as failed:",
        statusError,
      );
    }

    throw error;
  }
}

/*
 * =========================================================
 * MAIN RETRY SERVICE
 * =========================================================
 */

export async function retryRagIndexing({
  userId,
  userRole,
  jobId,
}) {
  /*
   * Authorization + status validation
   * + retryCount increment.
   */
  const job =
    await prepareRagIndexingRetry({
      userId,
      userRole,
      jobId,
    });

  /*
   * Course/module/note ka retry abhi
   * implement nahi kiya hai.
   *
   * Current production priority:
   *
   * - document
   * - video
   * - text lecture
   */

  /*
   * ========================================
   * FIND ASSOCIATED LECTURE
   * ========================================
   */

  let lecture = null;

  if (job.lecture) {
    lecture =
      await Lecture.findOne({
        _id:
          job.lecture,

        isActive:
          true,
      })
        .select(`
          _id
          course
          module
          title
          description
          content
          type
          videoUrl
          videoFileId
          documentUrl
          documentFileId
          isPublished
          isActive
        `)
        .lean();

    if (!lecture) {
      throw new ApiError(
        404,
        "Lecture associated with this indexing job was not found",
      );
    }
  }

  /*
   * ========================================
   * DOCUMENT
   * ========================================
   */

  if (
    job.resourceType ===
    "document"
  ) {
    if (!lecture) {
      throw new ApiError(
        400,
        "Document indexing job is not associated with a lecture",
      );
    }

    return retryDocumentIndexing({
      userId,
      userRole,
      job,
      lecture,
    });
  }

  /*
   * ========================================
   * LECTURE
   * ========================================
   */

  if (
    job.resourceType ===
    "lecture"
  ) {
    if (!lecture) {
      throw new ApiError(
        400,
        "Lecture indexing job is not associated with a lecture",
      );
    }

    const source =
      job.metadata?.source ||
      null;

    /*
     * Video transcript.
     */
    if (
      source ===
        "video_transcript" ||
      lecture.type ===
        "video"
    ) {
      return retryVideoIndexing({
        userId,
        userRole,
        job,
        lecture,
      });
    }

    /*
     * Text lecture.
     */
    if (
      source ===
        "text_lecture" ||
      lecture.type ===
        "text"
    ) {
      return retryTextLectureIndexing({
        userId,
        userRole,
        job,
        lecture,
      });
    }

    throw new ApiError(
      400,
      `Retry is not supported for lecture type "${lecture.type}"`,
    );
  }

  /*
   * ========================================
   * UNSUPPORTED RESOURCE
   * ========================================
   */

  throw new ApiError(
    400,
    `Retry is not implemented for resource type "${job.resourceType}"`,
  );
}