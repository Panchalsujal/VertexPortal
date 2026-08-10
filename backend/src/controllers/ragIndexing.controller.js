import {
  asyncHandler,
} from "../utils/asyncHandler.js";

import {
  getRagIndexingJob,
  getCourseRagIndexingJobs,
} from "../service/ragIndexing.service.js";

import {
  retryRagIndexing,
} from "../service/ragIndexingRetry.service.js";

/*
 * =============================================
 * GET SINGLE INDEXING JOB
 * =============================================
 */

export const getRagIndexingJobController =
  asyncHandler(
    async (req, res) => {
      const {
        jobId,
      } = req.params;

      const job =
        await getRagIndexingJob({
          userId:
            req.user.id,

          userRole:
            req.user.role,

          jobId,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "RAG indexing status fetched successfully",

          job,
        });
    },
  );

/*
 * =============================================
 * GET COURSE INDEXING JOBS
 * =============================================
 */

export const getCourseRagIndexingJobsController =
  asyncHandler(
    async (req, res) => {
      const {
        courseId,
      } = req.params;

      const {
        status = null,
        page = 1,
        limit = 20,
      } = req.query;

      const result =
        await getCourseRagIndexingJobs({
          userId:
            req.user.id,

          userRole:
            req.user.role,

          courseId,

          status,

          page,

          limit,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Course RAG indexing jobs fetched successfully",

          jobs:
            result.jobs,

          pagination:
            result.pagination,
        });
    },
  );

/*
 * =============================================
 * ACTUAL RETRY
 * =============================================
 */

export const retryRagIndexingJobController =
  asyncHandler(
    async (req, res) => {
      const {
        jobId,
      } = req.params;

      const result =
        await retryRagIndexing({
          userId:
            req.user.id,

          userRole:
            req.user.role,

          jobId,
        });

      return res
        .status(200)
        .json({
          success: true,

          message:
            result.message,

          result,
        });
    },
  );