import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createAssignment,
  getInstructorAssignments,
  getInstructorAssignmentById,
  updateAssignment,
  updateAssignmentStatus,
  deleteAssignment,
  restoreAssignment,
  getInstructorAssignmentSubmissions,
  getInstructorAssignmentSubmissionById,
  gradeAssignmentSubmission,
  returnAssignmentSubmission,
  getAssignmentAnalytics,
} from "../service/assignment.service.js";

export const createAssignmentController = asyncHandler(async (req, res) => {
  const assignment = await createAssignment({
    instructorId: req.user.id,
    payload: req.body,
  });

  return res.status(201).json({
    success: true,
    message: "Assignment created successfully",
    assignment,
  });
});

export const getInstructorAssignmentsController = asyncHandler(
  async (req, res) => {
    const result = await getInstructorAssignments({
      instructorId: req.user.id,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Instructor assignments fetched successfully",
      ...result,
    });
  },
);

export const getInstructorAssignmentByIdController = asyncHandler(
  async (req, res) => {
    const { assignmentId } = req.params;

    const result = await getInstructorAssignmentById({
      instructorId: req.user.id,
      assignmentId,
    });

    return res.status(200).json({
      success: true,
      message: "Assignment details fetched successfully",
      ...result,
    });
  },
);

export const updateAssignmentController = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const result = await updateAssignment({
    instructorId: req.user.id,
    assignmentId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    assignment: result.assignment,
  });
});

export const updateAssignmentStatusController = asyncHandler(
  async (req, res) => {
    const { assignmentId } = req.params;
    const { status } = req.body || {};

    const result = await updateAssignmentStatus({
      instructorId: req.user.id,
      assignmentId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      assignment: result.assignment,
    });
  },
);

export const deleteAssignmentController = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const result = await deleteAssignment({
    instructorId: req.user.id,
    assignmentId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    assignment: result.assignment,
  });
});

export const restoreAssignmentController = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  const result = await restoreAssignment({
    instructorId: req.user.id,
    assignmentId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    assignment: result.assignment,
  });
});

export const getInstructorAssignmentSubmissionsController = asyncHandler(
  async (req, res) => {
    const { assignmentId } = req.params;

    const result = await getInstructorAssignmentSubmissions({
      instructorId: req.user.id,
      assignmentId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Assignment submissions fetched successfully",
      ...result,
    });
  },
);

export const getInstructorAssignmentSubmissionByIdController = asyncHandler(
  async (req, res) => {
    const { assignmentId, submissionId } = req.params;

    const result = await getInstructorAssignmentSubmissionById({
      instructorId: req.user.id,
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

export const gradeAssignmentSubmissionController = asyncHandler(
  async (req, res) => {
    const { assignmentId, submissionId } = req.params;

    const result = await gradeAssignmentSubmission({
      instructorId: req.user.id,
      assignmentId,
      submissionId,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: result.message,

      submission: {
        id: result.submission._id,

        assignment: result.submission.assignment,

        student: result.submission.student,

        attemptNumber: result.submission.attemptNumber,

        status: result.submission.status,

        marksAwarded: result.submission.marksAwarded,

        totalMarks: result.submission.totalMarks,

        percentage: result.submission.percentage,

        isPassed: result.submission.isPassed,

        feedback: result.submission.feedback,

        reviewedAt: result.submission.reviewedAt,

        reviewedBy: result.submission.reviewedBy,

        gradedAt: result.submission.gradedAt,
      },
    });
  },
);

export const returnAssignmentSubmissionController = asyncHandler(
  async (req, res) => {
    const { assignmentId, submissionId } = req.params;

    const { returnReason } = req.body || {};

    const result = await returnAssignmentSubmission({
      instructorId: req.user.id,
      assignmentId,
      submissionId,
      returnReason,
    });

    return res.status(200).json({
      success: true,
      message: result.message,

      submission: {
        id: result.submission._id,

        assignment: result.submission.assignment,

        student: result.submission.student,

        attemptNumber: result.submission.attemptNumber,

        status: result.submission.status,

        returnedAt: result.submission.returnedAt,

        returnReason: result.submission.returnReason,

        reviewedAt: result.submission.reviewedAt,

        reviewedBy: result.submission.reviewedBy,
      },
    });
  },
);

export const getAssignmentAnalyticsController = asyncHandler(
  async (req, res) => {
    const { assignmentId } = req.params;

    const analytics = await getAssignmentAnalytics({
      instructorId: req.user.id,
      assignmentId,
    });

    return res.status(200).json({
      success: true,
      message: "Assignment analytics fetched successfully",
      analytics,
    });
  },
);
