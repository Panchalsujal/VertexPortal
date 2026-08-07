import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createEnrollmentController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  const session = await mongoose.startSession();

  let createdEnrollment;

  try {
    await session.withTransaction(async () => {
      const course = await Course.findOne({
        _id: courseId,
        isActive: true,
        isPublished: true,
        status: "published",
      })
        .select("title instructor enrolledStudentsCount price discountPrice")
        .session(session);

      if (!course) {
        const error = new Error("Course not found");
        error.statusCode = 404;
        throw error;
      }

      if (course.instructor.toString() === req.user.id.toString()) {
        const error = new Error("You cannot enroll in your own course");
        error.statusCode = 400;
        throw error;
      }

      /*
       * Abhi free enrollment implement ho raha hai.
       * Paid course ke liye direct enrollment allow nahi karenge.
       */
      const effectivePrice =
        course.discountPrice !== null && course.discountPrice !== undefined
          ? course.discountPrice
          : course.price;

      if (effectivePrice > 0) {
        const error = new Error(
          "This is a paid course. Complete payment before enrollment",
        );
        error.statusCode = 402;
        throw error;
      }

      /*
       * Sirf active enrollment check mat karo.
       * Compound unique index student + course par hai,
       * isliye cancelled/expired record bhi duplicate create rokega.
       */
      const existingEnrollment = await Enrollment.findOne({
        student: req.user.id,
        course: course._id,
      }).session(session);

      if (existingEnrollment) {
        if (existingEnrollment.status === "active") {
          const error = new Error("You are already enrolled in this course");
          error.statusCode = 409;
          throw error;
        }

        if (existingEnrollment.status === "completed") {
          const error = new Error("You have already completed this course");
          error.statusCode = 409;
          throw error;
        }

        /*
         * Cancelled ya expired enrollment ko reactivate karenge.
         * Naya duplicate enrollment document create nahi karenge.
         */
        existingEnrollment.status = "active";
        existingEnrollment.enrolledAt = new Date();
        existingEnrollment.expiresAt = null;
        existingEnrollment.progressPercentage = 0;
        existingEnrollment.completedLecturesCount = 0;
        existingEnrollment.lastWatchedLecture = null;
        existingEnrollment.lastWatchedAt = null;

        createdEnrollment = await existingEnrollment.save({ session });
      } else {
        const enrollments = await Enrollment.create(
          [
            {
              student: req.user.id,
              course: course._id,
              status: "active",
            },
          ],
          { session },
        );

        createdEnrollment = enrollments[0];
      }

      await Course.updateOne(
        {
          _id: course._id,
          isActive: true,
        },
        {
          $inc: {
            enrolledStudentsCount: 1,
          },
        },
        {
          session,
        },
      );
    });

    await createdEnrollment.populate({
      path: "course",
      select:
        "title slug thumbnailUrl instructor level language totalLectures totalDurationInSeconds",
    });

    return res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      enrollment: createdEnrollment,
    });
  } catch (error) {
    /*
     * Multiple simultaneous requests unique index tak pahunch sakti hain.
     * Duplicate key ko clean API response me convert karo.
     */
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

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


export const getMyEnrollmentsController = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
  } = req.query;

  const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);

  const limitNumber = Math.min(
    Math.max(Number.parseInt(limit, 10) || 10, 1),
    50,
  );

  const allowedStatuses = [
    "active",
    "completed",
    "cancelled",
    "expired",
  ];

  const filter = {
    student: req.user.id,
  };

  if (status) {
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment status",
      });
    }

    filter.status = status;
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [enrollments, totalEnrollments] = await Promise.all([
    Enrollment.find(filter)
      .populate({
        path: "course",
        select: [
          "title",
          "slug",
          "subtitle",
          "thumbnailUrl",
          "level",
          "language",
          "price",
          "discountPrice",
          "totalLectures",
          "totalDurationInSeconds",
          "averageRating",
          "instructor",
          "isActive",
          "isPublished",
          "status",
        ].join(" "),
        populate: {
          path: "instructor",
          select: "fullName avatarUrl",
        },
      })
      .populate({
        path: "lastWatchedLecture",
        select: "title module durationInSeconds type",
      })
      .sort({
        lastWatchedAt: -1,
        enrolledAt: -1,
      })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Enrollment.countDocuments(filter),
  ]);

  const formattedEnrollments = enrollments.map((enrollment) => ({
    id: enrollment._id,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt,
    expiresAt: enrollment.expiresAt,

    progress: {
      percentage: enrollment.progressPercentage,
      completedLecturesCount:
        enrollment.completedLecturesCount,
    },

    lastWatchedAt: enrollment.lastWatchedAt,
    lastWatchedLecture: enrollment.lastWatchedLecture,

    course: enrollment.course,
  }));

  const totalPages = Math.ceil(
    totalEnrollments / limitNumber,
  );

  return res.status(200).json({
    success: true,
    message: "Enrolled courses fetched successfully",

    enrollments: formattedEnrollments,

    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalEnrollments,
      limit: limitNumber,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    },
  });
});


export const getEnrollmentByCourseController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId,
    })
      .populate({
        path: "lastWatchedLecture",
        select: "title type durationInSeconds",
      })
      .lean();

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        enrolled: false,
      });
    }

    return res.status(200).json({
      success: true,
      enrolled: true,
      enrollment: {
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        expiresAt: enrollment.expiresAt,

        progressPercentage:
          enrollment.progressPercentage,

        completedLecturesCount:
          enrollment.completedLecturesCount,

        lastWatchedLecture:
          enrollment.lastWatchedLecture,

        lastWatchedAt:
          enrollment.lastWatchedAt,
      },
    });
  },
);


