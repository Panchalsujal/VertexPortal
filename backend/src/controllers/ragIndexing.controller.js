import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getRagIndexingJob,
  getCourseRagIndexingJobs,
  prepareRagIndexingRetry,
} from "../service/ragIndexing.service.js";

/*
 * =========================================================
 * GET SINGLE RAG INDEXING JOB
 * =========================================================
 *
 * GET /api/ai/indexing/:jobId
 *
 * Access:
 * - Admin
 * - Course instructor
 */

export const getRagIndexingJobController = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await getRagIndexingJob({
    userId: req.user.id,
    userRole: req.user.role,
    jobId,
  });

  return res.status(200).json({
    success: true,

    message: "RAG indexing status fetched successfully",

    job,
  });
});

/*
 * =========================================================
 * GET COURSE RAG INDEXING JOBS
 * =========================================================
 *
 * GET /api/ai/indexing/course/:courseId
 *
 * Query:
 *
 * ?status=failed
 * ?page=1
 * ?limit=20
 *
 * Access:
 * - Admin
 * - Course instructor
 */

export const getCourseRagIndexingJobsController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    const { status = null, page = 1, limit = 20 } = req.query;

    const result = await getCourseRagIndexingJobs({
      userId: req.user.id,
      userRole: req.user.role,

      courseId,

      status,

      page,
      limit,
    });

    return res.status(200).json({
      success: true,

      message: "Course RAG indexing jobs fetched successfully",

      jobs: result.jobs,

      pagination: result.pagination,
    });
  },
);

/*
 * =========================================================
 * PREPARE FAILED INDEXING JOB FOR RETRY
 * =========================================================
 *
 * POST /api/ai/indexing/:jobId/retry
 *
 * IMPORTANT:
 *
 * Abhi ye actual PDF/video ko process nahi karega.
 *
 * Ye:
 *
 * failed
 *   ↓
 * pending
 *
 * karega aur retryCount increase karega.
 *
 * Actual retry processing integration next step me aayega.
 *
 * Access:
 * - Admin
 * - Course instructor
 */

export const retryRagIndexingJobController = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await prepareRagIndexingRetry({
    userId: req.user.id,
    userRole: req.user.role,
    jobId,
  });

  return res.status(200).json({
    success: true,

    message: "RAG indexing job prepared for retry successfully",

    job,
  });
});
