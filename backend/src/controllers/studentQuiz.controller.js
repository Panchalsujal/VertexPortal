import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getStudentQuizzes,
  getStudentQuizById,
  startQuizAttempt,
  saveQuizAnswer,
  submitQuizAttempt,
  getStudentQuizAttemptResult,
  getStudentQuizAttempts,
  getStudentQuizAttemptById,
} from "../service/quiz.service.js";

export const getStudentQuizzesController = asyncHandler(async (req, res) => {
  const result = await getStudentQuizzes({
    studentId: req.user.id,
    query: req.query,
  });

  return res.status(200).json({
    success: true,
    message: "Student quizzes fetched successfully",
    ...result,
  });
});

export const startQuizAttemptController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const result = await startQuizAttempt({
    studentId: req.user.id,
    quizId,
  });

  return res.status(result.resumed ? 200 : 201).json({
    success: true,
    message: result.message,
    attempt: result.attempt,
    questions: result.questions,
    savedAnswers: result.savedAnswers,
    resumed: result.resumed,
  });
});

export const getStudentQuizByIdController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const result = await getStudentQuizById({
    studentId: req.user.id,
    quizId,
  });

  return res.status(200).json({
    success: true,
    message: "Quiz details fetched successfully",
    ...result,
  });
});

export const saveQuizAnswerController = asyncHandler(async (req, res) => {
  const { quizId, attemptId, questionId } = req.params;

  const result = await saveQuizAnswer({
    studentId: req.user.id,
    quizId,
    attemptId,
    questionId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    answer: result.answer,
    attemptProgress: result.attemptProgress,
  });
});

export const submitQuizAttemptController = asyncHandler(async (req, res) => {
  const { quizId, attemptId } = req.params;

  const { submissionReason = "manual", answers } = req.body || {};

  const result = await submitQuizAttempt({
    studentId: req.user.id,
    quizId,
    attemptId,
    submissionReason,
    incomingAnswers: answers,
  });

  return res.status(200).json({
    success: true,
    message: result.message,

    alreadySubmitted: result.alreadySubmitted,

    attempt: {
      id: result.attempt._id,
      status: result.attempt.status,
      attemptNumber: result.attempt.attemptNumber,
      submittedAt: result.attempt.submittedAt,
      evaluatedAt: result.attempt.evaluatedAt,
    },

    ...result.result,
  });
});

export const getStudentQuizAttemptResultController = asyncHandler(
  async (req, res) => {
    const { quizId, attemptId } = req.params;

    const result = await getStudentQuizAttemptResult({
      studentId: req.user.id,
      quizId,
      attemptId,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz result fetched successfully",
      ...result,
    });
  },
);

export const getStudentQuizAttemptsController = asyncHandler(
  async (req, res) => {
    const { quizId } = req.params;

    const result = await getStudentQuizAttempts({
      studentId: req.user.id,
      quizId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz attempt history fetched successfully",
      ...result,
    });
  },
);

export const getStudentQuizAttemptByIdController = asyncHandler(
  async (req, res) => {
    const { quizId, attemptId } = req.params;

    const result = await getStudentQuizAttemptById({
      studentId: req.user.id,
      quizId,
      attemptId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      ...result,
    });
  },
);
