import {
  getStudentAssignments,
  getStudentAssignmentById,
  createAssignmentSubmission,
  getStudentAssignmentSubmissions,
  getStudentAssignmentSubmissionById,
} from "../service/assignment.service.js";

import {
  getMyCourses,
  getContinueLearning,
  getResumeLearning,
  getCoursePlayer,
} from "../service/student.service.js";


import {
  getStudentQuizzes,
  getStudentQuizById,
} from "../service/quiz.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createAssignmentSubmissionController = asyncHandler(
  async (req, res) => {
    const { assignmentId } = req.params;

    const result = await createAssignmentSubmission({
      studentId: req.user.id,
      assignmentId,
      payload: req.body,
      files: req.files ?? [],
    });

    return res.status(201).json({
      success: true,
      message: result.message,

      submission: result.submission,

      isResubmission: result.isResubmission,

      previousSubmission: result.previousSubmission,

      attemptSummary: result.attemptSummary,
    });
  },
);

export const getStudentAssignmentSubmissionsController = asyncHandler(
  async (req, res) => {
    const { assignmentId } = req.params;

    const result = await getStudentAssignmentSubmissions({
      studentId: req.user.id,
      assignmentId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Assignment submission history fetched successfully",
      ...result,
    });
  },
);

export const getStudentAssignmentSubmissionByIdController = asyncHandler(
  async (req, res) => {
    const { assignmentId, submissionId } = req.params;

    const result = await getStudentAssignmentSubmissionById({
      studentId: req.user.id,
      assignmentId,
      submissionId,
    });

    return res.status(200).json({
      success: true,
      message: "Assignment submission fetched successfully",
      ...result,
    });
  },
);

export const getStudentAssignmentByIdController = asyncHandler(
  async (req, res) => {
    const { assignmentId } = req.params;

    const result = await getStudentAssignmentById({
      studentId: req.user.id,
      assignmentId,
    });

    return res.status(200).json({
      success: true,
      message: "Assignment details fetched successfully",
      ...result,
    });
  },
);

export const getStudentAssignmentsController = asyncHandler(
  async (req, res) => {
    const result = await getStudentAssignments({
      studentId: req.user.id,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Student assignments fetched successfully",
      ...result,
    });
  },
);
