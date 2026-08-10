import Lecture from "../models/lecture.model.js";

import {
  ingestRagResource,
} from "./rag.service.js";

import {
  extractPdfTextFromBuffer,
} from "./pdfText.service.js";

import {
  validateObjectId,
} from "../utils/validator.js";

import {
  ApiError,
} from "../utils/ApiError.js";

/*
 * PDF lecture document ko extract + index karega.
 */
export async function indexLectureDocumentForRag({
  userId,
  userRole,
  lectureId,
  fileBuffer,
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
        documentUrl
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
    "document"
  ) {
    throw new ApiError(
      400,
      "Only document lectures can be indexed using this service",
    );
  }

  const {
    text,
    pageCount,
  } =
    await extractPdfTextFromBuffer(
      fileBuffer,
    );

  const finalText = [
    lecture.title
      ? `Lecture Title:\n${lecture.title}`
      : null,

    lecture.description
      ? `Description:\n${lecture.description}`
      : null,

    `Document Content:\n${text}`,
  ]
    .filter(Boolean)
    .join("\n\n");

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
        "document",

      resourceId:
        lecture._id,

      title:
        lecture.title,

      text:
        finalText,

      metadata: {
        lectureId:
          lecture._id.toString(),

        fileName:
          String(
            fileName || "",
          ),

        documentUrl:
          lecture.documentUrl ??
          null,

        pageCount,

        source:
          "lecture_document",
      },
    });

  return {
    lectureId:
      lecture._id,

    courseId:
      lecture.course,

    pageCount,

    chunksCreated:
      result.chunksCreated,

    message:
      "Lecture document indexed for AI successfully",
  };
}