import { Router } from "express";

import {
  getAdminDiscussionReportsController,
  getAdminDiscussionReportByIdController,
  startDiscussionReportReviewController,
  resolveDiscussionReportController,
} from "../controllers/discussionReport.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles("admin"),
);

/*
 * All reports.
 */
router.get("/", getAdminDiscussionReportsController);

/*
 * Start reviewing.
 */
router.patch("/:reportId/review", startDiscussionReportReviewController);

/*
 * Resolve / reject.
 */
router.patch("/:reportId/resolve", resolveDiscussionReportController);

/*
 * Single report.
 *
 * Dynamic detail route ko bottom me rakho.
 */
router.get("/:reportId", getAdminDiscussionReportByIdController);

export default router;
