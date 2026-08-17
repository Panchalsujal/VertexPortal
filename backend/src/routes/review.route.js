import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getCourseReviewsController,
  getMyReviewController,
  getFeaturedReviewsController,
  getPlatformStatsController,
} from "../controllers/review.controller.js";

const router = express.Router();

/**
 * Public featured reviews & platform stats for landing page
 */
router.get("/reviews/featured", getFeaturedReviewsController);
router.get("/reviews/stats", getPlatformStatsController);

/**
 * Create a new review for a course
 */
router.post("/courses/:courseId/reviews", authMiddleware, createReviewController);

/**
 * Update a review
 */
router.patch("/reviews/:reviewId", authMiddleware, updateReviewController);

/**
 * Delete a review
 */
router.delete("/reviews/:reviewId", authMiddleware, deleteReviewController);

/**
 * Get all reviews for a course
 */
router.get("/courses/:courseId/reviews", getCourseReviewsController);

/**
 * Get my review for a course
 */
router.get("/courses/:courseId/my-review", authMiddleware, getMyReviewController);

export default router;
