import { asyncHandler } from "../utils/asyncHandler.js";

import {
  ingestRagResource,
  ingestCourseForRag,
  ingestModuleForRag,
  ingestLectureForRag,
  searchCourseKnowledge,
  getCourseRagChunks,
  deleteRagResource,
} from "../service/rag.service.js";

/*
 * Generic text ingestion
 */
export const ingestRagResourceController = asyncHandler(async (req, res) => {
  const result = await ingestRagResource({
    userId: req.user.id,

    userRole: req.user.role,

    courseId: req.body?.courseId,

    resourceType: req.body?.resourceType,

    resourceId: req.body?.resourceId,

    title: req.body?.title,

    text: req.body?.text,

    moduleId: req.body?.moduleId ?? null,

    lectureId: req.body?.lectureId ?? null,

    metadata: req.body?.metadata ?? null,
  });

  return res.status(201).json({
    success: true,

    message: result.message,

    result,
  });
});

/*
 * Course indexing
 */
export const ingestCourseForRagController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await ingestCourseForRag({
    userId: req.user.id,

    userRole: req.user.role,

    courseId,
  });

  return res.status(201).json({
    success: true,

    message: result.message,

    result,
  });
});

/*
 * Module indexing
 */
export const ingestModuleForRagController = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  const result = await ingestModuleForRag({
    userId: req.user.id,

    userRole: req.user.role,

    moduleId,
  });

  return res.status(201).json({
    success: true,

    message: result.message,

    result,
  });
});

/*
 * Lecture indexing
 */
export const ingestLectureForRagController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  const result = await ingestLectureForRag({
    userId: req.user.id,

    userRole: req.user.role,

    lectureId,
  });

  return res.status(201).json({
    success: true,

    message: result.message,

    result,
  });
});

/*
 * Semantic search
 */
export const searchCourseKnowledgeController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    const { query, limit, minimumScore } = req.body || {};

    const results = await searchCourseKnowledge({
      userId: req.user.id,

      userRole: req.user.role,

      courseId,

      query,

      limit,

      minimumScore,
    });

    return res.status(200).json({
      success: true,

      message: "Course knowledge search completed successfully",

      count: results.length,

      results,
    });
  },
);

/*
 * Indexed chunks
 */
export const getCourseRagChunksController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await getCourseRagChunks({
    userId: req.user.id,

    userRole: req.user.role,

    courseId,

    query: req.query,
  });

  return res.status(200).json({
    success: true,

    message: "Indexed AI knowledge fetched successfully",

    ...result,
  });
});

/*
 * Delete resource chunks
 */
export const deleteRagResourceController = asyncHandler(async (req, res) => {
  const { courseId, resourceType, resourceId } = req.params;

  const result = await deleteRagResource({
    userId: req.user.id,

    userRole: req.user.role,

    courseId,

    resourceType,

    resourceId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    deletedChunks: result.deletedChunks,
  });
});
