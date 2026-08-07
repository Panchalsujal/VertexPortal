import { Router } from "express";

import {
  createAssignmentController,
  getInstructorAssignmentsController,
  getInstructorAssignmentByIdController,
  updateAssignmentController,
  updateAssignmentStatusController,
  deleteAssignmentController,
  restoreAssignmentController,
  getInstructorAssignmentSubmissionsController,
  getInstructorAssignmentSubmissionByIdController,
  gradeAssignmentSubmissionController,
  returnAssignmentSubmissionController,
  getAssignmentAnalyticsController,
} from "../controllers/assignment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("instructor"));
router.post("/", createAssignmentController);
router.get("/", getInstructorAssignmentsController);
router.get("/:assignmentId", getInstructorAssignmentByIdController);
router.patch("/:assignmentId", updateAssignmentController);
router.patch("/:assignmentId/status", updateAssignmentStatusController);
router.patch("/:assignmentId/restore", restoreAssignmentController);
router.delete("/:assignmentId", deleteAssignmentController);
router.get(
  "/:assignmentId/submissions",
  getInstructorAssignmentSubmissionsController,
);
router.get(
  "/:assignmentId/submissions/:submissionId",
  getInstructorAssignmentSubmissionByIdController,
);

router.patch(
  "/:assignmentId/submissions/:submissionId/grade",
  gradeAssignmentSubmissionController,
);

router.patch(
  "/:assignmentId/submissions/:submissionId/return",
  returnAssignmentSubmissionController,
);

router.get("/:assignmentId/analytics", getAssignmentAnalyticsController);
export default router;
