import { Router } from "express";

import {
  getStudentAssignmentsController,
  getStudentAssignmentByIdController,
  createAssignmentSubmissionController,
  getStudentAssignmentSubmissionsController,
  getStudentAssignmentSubmissionByIdController,
} from "../controllers/studentAssignment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

import { assignmentUpload } from "../middlewares/assignmentUpload.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("student"));
router.get("/", getStudentAssignmentsController);

router.post(
  "/:assignmentId/submissions",
  assignmentUpload.array("files", 5),
  createAssignmentSubmissionController,
);

router.get(
  "/:assignmentId/submissions",
  getStudentAssignmentSubmissionsController,
);

router.get(
  "/:assignmentId/submissions/:submissionId",
  getStudentAssignmentSubmissionByIdController,
);

router.get("/:assignmentId", getStudentAssignmentByIdController);

export default router;
