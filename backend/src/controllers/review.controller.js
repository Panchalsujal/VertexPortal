import mongoose from "mongoose";

import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import CourseReview from "../models/courseReview.model.js";
import User from "../models/user.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { recalculateCourseRating } from "../service/review.service.js";
import { validateEnrollmentAccess } from "../utils/validateEnrollmentAccess.js";

export const createReviewController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { rating, title, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  const parsedRating = Number(rating);

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  const session = await mongoose.startSession();

  let review;

  try {
    await session.withTransaction(async () => {
      const course = await Course.findOne({
        _id: courseId,
        isActive: true,
        isPublished: true,
      }).session(session);

      if (!course) {
        const error = new Error("Course not found or not published");

        error.statusCode = 404;
        throw error;
      }

      if (course.instructor.toString() === req.user.id) {
        const error = new Error("Instructor cannot review own course");

        error.statusCode = 403;
        throw error;
      }

      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: courseId,
      }).session(session);

      if (!enrollment) {
        const error = new Error("You must enroll before reviewing this course");

        error.statusCode = 403;
        throw error;
      }

      validateEnrollmentAccess(enrollment);

      const alreadyReviewed = await CourseReview.exists({
        student: req.user.id,
        course: courseId,
      }).session(session);

      if (alreadyReviewed) {
        const error = new Error("You have already reviewed this course");

        error.statusCode = 409;
        throw error;
      }

      review = await CourseReview.create(
        [
          {
            student: req.user.id,
            course: courseId,
            rating: parsedRating,
            title: title?.trim(),
            comment: comment?.trim(),
          },
        ],
        {
          session,
        },
      );

      review = review[0];

      await recalculateCourseRating(courseId, session);
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this course",
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

export const updateReviewController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, title, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid review ID",
    });
  }

  const parsedRating = Number(rating);

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  const session = await mongoose.startSession();

  let review;

  try {
    await session.withTransaction(async () => {
      review = await CourseReview.findOne({
        _id: reviewId,
        student: req.user.id,
      }).session(session);

      if (!review) {
        const error = new Error("Review not found");

        error.statusCode = 404;
        throw error;
      }

      review.rating = parsedRating;
      review.title = title?.trim() || "";
      review.comment = comment?.trim() || "";
      review.isEdited = true;

      await review.save({ session });

      await recalculateCourseRating(review.course, session);
    });

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

export const deleteReviewController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid review ID",
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const review = await CourseReview.findOne({
        _id: reviewId,
        student: req.user.id,
      }).session(session);

      console.log(review);

      if (!review) {
        const error = new Error("Review not found");
        error.statusCode = 404;
        throw error;
      }

      const courseId = review.course;

      await review.deleteOne({ session });

      await recalculateCourseRating(courseId, session);
    });

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

export const getCourseReviewsController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const { page = 1, limit = 10, sort = "newest", rating } = req.query;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive integer",
    });
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
    return res.status(400).json({
      success: false,
      message: "Limit must be between 1 and 50",
    });
  }

  const course = await Course.findOne({
    _id: courseId,
    isActive: true,
    isPublished: true,
  })
    .select("title averageRating totalRatings totalReviews ratingDistribution")
    .lean();

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const filter = {
    course: courseId,
    isPublished: true,
  };

  if (rating !== undefined) {
    const parsedRating = Number(rating);

    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating filter must be between 1 and 5",
      });
    }

    filter.rating = parsedRating;
  }

  const sortOptions = {
    newest: {
      createdAt: -1,
    },

    oldest: {
      createdAt: 1,
    },

    highest: {
      rating: -1,
      createdAt: -1,
    },

    lowest: {
      rating: 1,
      createdAt: -1,
    },
  };

  const selectedSort = sortOptions[sort];

  if (!selectedSort) {
    return res.status(400).json({
      success: false,
      message: "Sort must be newest, oldest, highest, or lowest",
    });
  }

  const skip = (parsedPage - 1) * parsedLimit;

  const [reviews, totalReviews] = await Promise.all([
    CourseReview.find(filter)
      .populate({
        path: "student",
        select: "fullName avatarUrl",
      })
      .sort(selectedSort)
      .skip(skip)
      .limit(parsedLimit)
      .select("student rating title comment isEdited createdAt updatedAt")
      .lean(),

    CourseReview.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalReviews / parsedLimit);

  return res.status(200).json({
    success: true,
    message: "Course reviews fetched successfully",

    course: {
      _id: course._id,
      title: course.title,
      averageRating: course.averageRating,
      totalRatings: course.totalRatings,
      totalReviews: course.totalReviews,
      ratingDistribution: course.ratingDistribution,
    },

    reviews,

    pagination: {
      currentPage: parsedPage,
      totalPages,
      totalReviews,
      limit: parsedLimit,
      hasNextPage: parsedPage < totalPages,
      hasPreviousPage: parsedPage > 1,
    },

    filters: {
      sort,
      rating: rating !== undefined ? Number(rating) : null,
    },
  });
});


export const getMyReviewController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const review = await CourseReview.findOne({
      student: req.user.id,
      course: courseId,
    })
      .select(
        "rating title comment isEdited createdAt updatedAt",
      )
      .lean();

    if (!review) {
      return res.status(200).json({
        success: true,
        hasReviewed: false,
        review: null,
      });
    }

    return res.status(200).json({
      success: true,
      hasReviewed: true,
      review,
    });
  },
);

/**
 * Get featured / latest high-rated reviews across the platform for landing page
 */
export const getFeaturedReviewsController = asyncHandler(async (req, res) => {
  const reviews = await CourseReview.find({ isPublished: true, rating: { $gte: 4 } })
    .sort({ rating: -1, createdAt: -1 })
    .limit(10)
    .populate({
      path: "student",
      select: "fullName avatarUrl headline role",
    })
    .populate({
      path: "course",
      select: "title slug",
    })
    .lean();

  return res.status(200).json({
    success: true,
    data: reviews,
    reviews,
  });
});

/**
 * Get public platform stats (enrolled learners, average rating, total reviews, courses count)
 */
export const getPlatformStatsController = asyncHandler(async (req, res) => {
  const [totalStudents, totalEnrollments, totalReviews, reviewStats, totalCourses, recentStudents] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Enrollment.countDocuments({ status: "active" }),
    CourseReview.countDocuments({ isPublished: true }),
    CourseReview.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
    Course.countDocuments({ isPublished: true, isActive: true }),
    User.find({ role: "student" })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("fullName avatarUrl")
      .lean(),
  ]);

  const rawAvg = reviewStats[0]?.avgRating;
  const avgRating = rawAvg ? Number(rawAvg.toFixed(1)) : 4.9;

  return res.status(200).json({
    success: true,
    stats: {
      totalStudents: totalStudents || 0,
      totalEnrollments: totalEnrollments || 0,
      totalReviews: totalReviews || 0,
      averageRating: avgRating || 4.9,
      totalCourses: totalCourses || 0,
      recentStudents: recentStudents || [],
    },
  });
});