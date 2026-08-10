import { Router } from "express";

import {
  createDiscussionReportController,
  getMyDiscussionReportsController,
} from "../controllers/discussionReport.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles("student", "instructor", "admin"),
);

/*
 * Create report.
 */
router.post("/", createDiscussionReportController);

/*
 * Current user's reports.
 */
router.get("/my", getMyDiscussionReportsController);

export default router;
