import { Router } from "express";

import {
  createQuizController,
  addQuizQuestionController,
  getInstructorQuizByIdController,
  getInstructorQuizzesController,
  updateQuizController,
  updateQuizStatusController,
  updateQuizQuestionController,
  deleteQuizQuestionController,
  restoreQuizQuestionController,
  getInstructorQuizAttemptsController,
  getInstructorQuizAttemptByIdController,
  evaluateQuizAnswerController,
  instructorSubmitQuizAttemptController,
  updateQuizResultSettingsController,
  getQuizAnalyticsController,
  restoreQuizController,
  deleteQuizController
} from "../controllers/quiz.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("instructor", "admin"));

router.post("/", createQuizController);

router.get("/", getInstructorQuizzesController);

router.post("/:quizId/questions", addQuizQuestionController);

router.patch(
  "/:quizId/questions/:questionId/restore",
  restoreQuizQuestionController,
);

router.patch("/:quizId/questions/:questionId", updateQuizQuestionController);

router.delete("/:quizId/questions/:questionId", deleteQuizQuestionController);

router.get("/:quizId/attempts", getInstructorQuizAttemptsController);

router.get(
  "/:quizId/attempts/:attemptId",
  getInstructorQuizAttemptByIdController,
);

router.patch(
  "/:quizId/attempts/:attemptId/answers/:answerId/evaluate",
  evaluateQuizAnswerController,
);

router.post(
  "/:quizId/attempts/:attemptId/submit",
  instructorSubmitQuizAttemptController,
);

router.patch("/:quizId/results/settings", updateQuizResultSettingsController);

router.get("/:quizId/analytics", getQuizAnalyticsController);

router.patch("/:quizId/status", updateQuizStatusController);

router.patch("/:quizId/restore", restoreQuizController);

router.delete("/:quizId", deleteQuizController);

router.get("/:quizId", getInstructorQuizByIdController);

router.patch("/:quizId", updateQuizController);
export default router;
