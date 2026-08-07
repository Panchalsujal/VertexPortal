import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getCourseReviewsController,
  getMyReviewController,
} from "../controllers/review.controller.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
const router = express.Router();

/** * @access Private
 * @desc Create a new review for a specific course
 * @Api POST /api/courses/:courseId/reviews
 * @param { courseId: string }
 * @body { rating: number, comment: string }
 * @returns { message: string, review: object }
 */

router.post(
  "/courses/:courseId/reviews",
  authMiddleware,
  createReviewController,
);

/**
 * @access Private
 * @desc Update a review for a specific course
 * @Api PATCH /api/reviews/:reviewId
 * @param { reviewId: string }
 * @body { rating: number, comment: string }
 * @returns { message: string, review: object }
 */

router.patch("/reviews/:reviewId", authMiddleware, updateReviewController);

/**
 * @access Private
 * @desc Delete a review for a specific course
 * @Api DELETE /api/reviews/:reviewId
 * @param { reviewId: string }
 * @returns { message: string }
 */

router.delete("/reviews/:reviewId", authMiddleware, deleteReviewController);

/** * @access Public
 * @desc Get all reviews for a specific course
 * @Api GET /api/courses/:courseId/reviews
 * @param { courseId: string }
 * @returns { message: string, reviews: array }
 */

router.get("/courses/:courseId/reviews", getCourseReviewsController);

/** * @access Private
 * @desc Get the review of the logged-in user for a specific course
 * @Api GET /api/courses/:courseId/my-review
 * @param { courseId: string }
 * @returns { message: string, review: object }
 */

router.get(
  "/courses/:courseId/my-review",
  authMiddleware,
  getMyReviewController,
);

export default router;
