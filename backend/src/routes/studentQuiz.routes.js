import { Router } from "express";

import {
  getStudentQuizzesController,
  getStudentQuizByIdController,
  startQuizAttemptController,
  saveQuizAnswerController,
  submitQuizAttemptController,
  getStudentQuizAttemptResultController,
  getStudentQuizAttemptsController,
  getStudentQuizAttemptByIdController,
} from "../controllers/studentQuiz.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("student", "admin", "instructor"));

router.get("/", getStudentQuizzesController);

router.post("/:quizId/attempts/start", startQuizAttemptController);

router.put(
  "/:quizId/attempts/:attemptId/answers/:questionId",
  saveQuizAnswerController,
);

router.post("/:quizId/attempts/:attemptId/submit", submitQuizAttemptController);

router.get(
  "/:quizId/attempts/:attemptId/result",
  getStudentQuizAttemptResultController,
);

router.get("/:quizId/attempts/:attemptId", getStudentQuizAttemptByIdController);

router.get("/:quizId/attempts", getStudentQuizAttemptsController);

router.get("/:quizId", getStudentQuizByIdController);

export default router;
