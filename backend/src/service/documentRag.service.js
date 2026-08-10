import Lecture from "../models/lecture.model.js";

import {
  ingestRagResource,
} from "./rag.service.js";

import {
  extractPdfTextFromBuffer,
} from "./pdfText.service.js";

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
 * =========================================================
 * PDF LECTURE DOCUMENT
 * =========================================================
 *
 * Flow:
 *
 * lecture validate
 *      ↓
 * indexing job pending
 *      ↓
 * processing
 *      ↓
 * PDF text extraction
 *      ↓
 * chunking + Mistral embeddings
 *      ↓
 * MongoDB RAG chunks
 *      ↓
 * indexing job completed
 *
 * Failure:
 *
 * processing
 *      ↓
 * failed
 *      ↓
 * lastError save
 * =========================================================
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

  if (
    !fileBuffer ||
    !Buffer.isBuffer(fileBuffer)
  ) {
    throw new ApiError(
      400,
      "Valid PDF file buffer is required",
    );
  }

  /*
   * =====================================================
   * 1. Find lecture
   * =====================================================
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
        documentUrl
        documentFileId
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
   * =====================================================
   * 2. Only document lectures
   * =====================================================
   */

  if (
    lecture.type !==
    "document"
  ) {
    throw new ApiError(
      400,
      "Only document lectures can be indexed using this service",
    );
  }

  /*
   * =====================================================
   * 3. Create/reset indexing job
   * =====================================================
   *
   * document resource ke liye
   * lecture._id ko resourceId use kar rahe hain.
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
        "document",

      resourceId:
        lecture._id,

      metadata: {
        source:
          "lecture_document",

        fileName:
          String(
            fileName || "",
          ),

        documentUrl:
          lecture.documentUrl ??
          null,

        documentFileId:
          lecture.documentFileId ??
          null,
      },
    });

  /*
   * =====================================================
   * 4. Mark processing
   * =====================================================
   */

  await markRagIndexingProcessing(
    indexingJob._id,
  );

  try {
    /*
     * ===================================================
     * 5. Extract PDF text
     * ===================================================
     */

    const {
      text,
      pageCount,
    } =
      await extractPdfTextFromBuffer(
        fileBuffer,
      );

    /*
     * ===================================================
     * 6. Build knowledge text
     * ===================================================
     */

    const finalText = [
      lecture.title
        ? `Lecture Title:\n${lecture.title}`
        : null,

      fileName
        ? `Document File Name:\n${fileName}`
        : null,

      lecture.description
        ? `Description:\n${lecture.description}`
        : null,

      `Document Content:\n${text}`,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!finalText) {
      throw new ApiError(
        400,
        "Document does not contain indexable text",
      );
    }

    /*
     * ===================================================
     * 7. RAG indexing
     * ===================================================
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

          documentFileId:
            lecture.documentFileId ??
            null,

          pageCount,

          source:
            "lecture_document",
        },
      });

    /*
     * ===================================================
     * 8. Mark completed
     * ===================================================
     */

    const completedJob =
      await markRagIndexingCompleted({
        jobId:
          indexingJob._id,

        chunksCreated:
          result.chunksCreated,

        metadata: {
          source:
            "lecture_document",

          lectureId:
            lecture._id.toString(),

          fileName:
            String(
              fileName || "",
            ),

          documentUrl:
            lecture.documentUrl ??
            null,

          documentFileId:
            lecture.documentFileId ??
            null,

          pageCount,

          chunksCreated:
            result.chunksCreated,
        },
      });

    /*
     * ===================================================
     * 9. Final result
     * ===================================================
     */

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

      pageCount,

      chunksCreated:
        result.chunksCreated,

      message:
        "Lecture document indexed for AI successfully",
    };
  } catch (error) {
    /*
     * ===================================================
     * 10. Mark failed
     * ===================================================
     */

    try {
      await markRagIndexingFailed({
        jobId:
          indexingJob._id,

        error,
      });
    } catch (
      statusError
    ) {
      console.error(
        "Failed to update RAG indexing job status:",
        statusError,
      );
    }

    /*
     * Original error preserve karenge.
     */
    throw error;
  }
}