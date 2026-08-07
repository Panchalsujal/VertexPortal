import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createQuiz,
  addQuizQuestion,
  getInstructorQuizById,
  getInstructorQuizzes,
  updateQuiz,
  updateQuizStatus,
  updateQuizQuestion,
  deleteQuizQuestion,
  restoreQuizQuestion,
  getInstructorQuizAttempts,
  getInstructorQuizAttemptById,
  evaluateQuizAnswerManually,
  instructorSubmitQuizAttempt,
  updateQuizResultSettings,
  deleteQuiz,
  restoreQuiz,
  getQuizAnalytics,
} from "../service/quiz.service.js";

export const createQuizController = asyncHandler(async (req, res) => {
  const quiz = await createQuiz({
    instructorId: req.user.id,
    payload: req.body,
  });

  return res.status(201).json({
    success: true,
    message: "Quiz created successfully",
    quiz,
  });
});

export const addQuizQuestionController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const result = await addQuizQuestion({
    instructorId: req.user.id,
    quizId,
    payload: req.body,
  });

  return res.status(201).json({
    success: true,
    message: "Quiz question added successfully",
    question: result.question,
    quiz: result.quiz,
  });
});

export const getInstructorQuizByIdController = asyncHandler(
  async (req, res) => {
    const { quizId } = req.params;

    const result = await getInstructorQuizById({
      instructorId: req.user.id,
      quizId,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz details fetched successfully",
      ...result,
    });
  },
);

export const getInstructorQuizzesController = asyncHandler(async (req, res) => {
  const result = await getInstructorQuizzes({
    instructorId: req.user.id,
    query: req.query,
  });

  return res.status(200).json({
    success: true,
    message: "Instructor quizzes fetched successfully",
    ...result,
  });
});

export const updateQuizController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const result = await updateQuiz({
    instructorId: req.user.id,
    quizId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    quiz: result.quiz,
  });
});

export const updateQuizStatusController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { status } = req.body || {};

  const result = await updateQuizStatus({
    instructorId: req.user.id,
    quizId,
    status,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    quiz: result.quiz,
  });
});

export const updateQuizQuestionController = asyncHandler(async (req, res) => {
  const { quizId, questionId } = req.params;

  const result = await updateQuizQuestion({
    instructorId: req.user.id,
    quizId,
    questionId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    question: result.question,
    quiz: result.quiz,
  });
});

export const deleteQuizQuestionController = asyncHandler(async (req, res) => {
  const { quizId, questionId } = req.params;

  const result = await deleteQuizQuestion({
    instructorId: req.user.id,
    quizId,
    questionId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,

    question: {
      id: result.question._id,
      questionText: result.question.questionText,
      order: result.question.order,
      marks: result.question.marks,
      isActive: result.question.isActive,
    },

    quiz: result.quiz,
  });
});

export const restoreQuizQuestionController = asyncHandler(async (req, res) => {
  const { quizId, questionId } = req.params;

  const result = await restoreQuizQuestion({
    instructorId: req.user.id,
    quizId,
    questionId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    question: {
      id: result.question._id,

      questionText: result.question.questionText,

      order: result.question.order,

      marks: result.question.marks,

      isActive: result.question.isActive,
    },

    quiz: result.quiz,
  });
});

export const getInstructorQuizAttemptsController = asyncHandler(
  async (req, res) => {
    const { quizId } = req.params;

    const result = await getInstructorQuizAttempts({
      instructorId: req.user.id,
      quizId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz attempts fetched successfully",
      ...result,
    });
  },
);

export const getInstructorQuizAttemptByIdController = asyncHandler(
  async (req, res) => {
    const { quizId, attemptId } = req.params;

    const result = await getInstructorQuizAttemptById({
      instructorId: req.user.id,
      quizId,
      attemptId,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz attempt details fetched successfully",
      ...result,
    });
  },
);

export const evaluateQuizAnswerController = asyncHandler(async (req, res) => {
  const { quizId, attemptId, answerId } = req.params;

  const result = await evaluateQuizAnswerManually({
    instructorId: req.user.id,
    quizId,
    attemptId,
    answerId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    answer: result.answer,
    attempt: result.attempt,
  });
});

export const instructorSubmitQuizAttemptController = asyncHandler(
  async (req, res) => {
    const { quizId, attemptId } = req.params;

    const result = await instructorSubmitQuizAttempt({
      instructorId: req.user.id,
      quizId,
      attemptId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      attempt: result.attempt,
    });
  },
);

export const updateQuizResultSettingsController = asyncHandler(
  async (req, res) => {
    const { quizId } = req.params;

    const quiz = await updateQuizResultSettings({
      instructorId: req.user.id,
      quizId,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Quiz result settings updated successfully",
      quiz,
    });
  },
);

export const deleteQuizController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const result = await deleteQuiz({
    instructorId: req.user.id,
    quizId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    quiz: result.quiz,
  });
});

export const restoreQuizController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const result = await restoreQuiz({
    instructorId: req.user.id,
    quizId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    quiz: result.quiz,
  });
});

export const getQuizAnalyticsController = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const analytics = await getQuizAnalytics({
    instructorId: req.user.id,
    quizId,
  });

  return res.status(200).json({
    success: true,
    message: "Quiz analytics fetched successfully",
    analytics,
  });
});
