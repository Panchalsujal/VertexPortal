import Lecture from "../models/lecture.model.js";

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
 * Build lecture knowledge text
 * ==========================================
 */
function buildLectureKnowledgeText(
  lecture,
) {
  const sections = [];

  if (lecture.title) {
    sections.push(
      `Lecture Title:\n${lecture.title}`,
    );
  }

  if (lecture.description) {
    sections.push(
      `Description:\n${lecture.description}`,
    );
  }

  if (lecture.content) {
    sections.push(
      `Lecture Content:\n${lecture.content}`,
    );
  }

  return sections
    .join("\n\n")
    .trim();
}

/*
 * ==========================================
 * Index/Re-index lecture into RAG
 * ==========================================
 */
export async function indexLectureForAi({
  userId,
  userRole,
  lectureId,
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
      _id: lectureId,
      isActive: true,
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
        documentUrl
        isPublished
        isActive
      `)
      .lean();

  if (!lecture) {
    throw new ApiError(
      404,
      "Lecture not found",
    );
  }

  /*
   * Quiz/live ko abhi RAG me directly
   * index nahi karenge.
   */
  if (
    [
      "quiz",
      "live",
    ].includes(
      lecture.type,
    )
  ) {
    throw new ApiError(
      400,
      `${lecture.type} lecture cannot be indexed directly`,
    );
  }

  const text =
    buildLectureKnowledgeText(
      lecture,
    );

  /*
   * Video/document lecture me agar description/content
   * nahi hai to actual useful text available nahi hoga.
   */
  if (!text) {
    throw new ApiError(
      400,
      "Lecture does not contain indexable text",
    );
  }

  /*
   * Sirf title available ho aur actual educational
   * content nahi ho to bhi index avoid karenge.
   */
  if (
    !lecture.description?.trim() &&
    !lecture.content?.trim()
  ) {
    if (
      lecture.type ===
      "video"
    ) {
      throw new ApiError(
        400,
        "Video lecture requires description, content, or transcript before AI indexing",
      );
    }

    if (
      lecture.type ===
      "document"
    ) {
      throw new ApiError(
        400,
        "Document text must be extracted before AI indexing",
      );
    }
  }

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
        lectureType:
          lecture.type,

        isPublished:
          lecture.isPublished,

        videoUrl:
          lecture.videoUrl ??
          null,

        documentUrl:
          lecture.documentUrl ??
          null,
      },
    });

  return {
    lectureId:
      lecture._id,

    courseId:
      lecture.course,

    moduleId:
      lecture.module,

    lectureType:
      lecture.type,

    chunksCreated:
      result.chunksCreated,

    message:
      "Lecture indexed for AI successfully",
  };
}

/*
 * ==========================================
 * Safe automatic indexing helper
 *
 * Lecture create/update ke baad use karenge.
 *
 * Main lecture API fail nahi hogi agar
 * AI indexing fail ho jaye.
 * ==========================================
 */
export async function tryIndexLectureForAi({
  userId,
  userRole,
  lectureId,
}) {
  try {
    const result =
      await indexLectureForAi({
        userId,
        userRole,
        lectureId,
      });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error(
      `Lecture AI indexing failed for ${lectureId}:`,
      error,
    );

    return {
      success: false,

      lectureId,

      message:
        error.message ||
        "Lecture AI indexing failed",
    };
  }
}