import Router from "express";

import {
  getRagIndexingJobController,
  getCourseRagIndexingJobsController,
  retryRagIndexingJobController,
} from "../controllers/ragIndexing.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

/*
 * =========================================================
 * COURSE INDEXING JOBS
 * =========================================================
 *
 * GET /api/ai/indexing/course/:courseId
 */

router.get(
  "/course/:courseId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  getCourseRagIndexingJobsController,
);

/*
 * =========================================================
 * SINGLE INDEXING JOB
 * =========================================================
 *
 * GET /api/ai/indexing/:jobId
 */

router.get(
  "/:jobId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  getRagIndexingJobController,
);

/*
 * =========================================================
 * RETRY INDEXING JOB
 * =========================================================
 *
 * POST /api/ai/indexing/:jobId/retry
 */

router.post(
  "/:jobId/retry",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  retryRagIndexingJobController,
);

export default router;
