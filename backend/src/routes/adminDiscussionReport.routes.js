import { Router } from "express";

import {
  getAdminDiscussionReportsController,
  getAdminDiscussionReportByIdController,
  startDiscussionReportReviewController,
  resolveDiscussionReportController,
} from "../controllers/discussionReport.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { auditLogAction } from "../middlewares/auditLog.middleware.js";

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
router.patch(
  "/:reportId/review",
  auditLogAction("DISCUSSION_REPORT_REVIEW_STARTED", "DiscussionReport", (req) => req.params.reportId),
  startDiscussionReportReviewController,
);

/*
 * Resolve / reject.
 */
router.patch(
  "/:reportId/resolve",
  auditLogAction("DISCUSSION_REPORT_RESOLVED", "DiscussionReport", (req) => req.params.reportId),
  resolveDiscussionReportController,
);

/*
 * Single report.
 *
 * Dynamic detail route ko bottom me rakho.
 */
router.get("/:reportId", getAdminDiscussionReportByIdController);

export default router;
