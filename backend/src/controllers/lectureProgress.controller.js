import mongoose from "mongoose";

import Course from "../models/course.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import LectureProgress from "../models/lectureProgress.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateEnrollmentAccess } from "../utils/validateEnrollmentAccess.js";
import { completeLectureProgress } from "../service/progress.service.js";
import { issueCertificate } from "../service/certificate.service.js";
import { ApiError } from "../utils/ApiError.js";

export const markLectureCompletedController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  const session = await mongoose.startSession();

  let progressResult = null;

  try {
    await session.withTransaction(async () => {
      const lecture = await Lecture.findOne({
        _id: lectureId,
        isActive: true,
        isPublished: true,
      })
        .select("course module title type durationInSeconds")
        .session(session);

      if (!lecture) {
        throw new ApiError(404, "Lecture not found");
      }

      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: lecture.course,

        status: {
          $in: ["active", "completed"],
        },
      }).session(session);

      if (!enrollment) {
        throw new ApiError(403, "You are not enrolled in this course");
      }

      progressResult = await completeLectureProgress({
        enrollment,
        lecture,
        session,
      });
    });
  } finally {
    await session.endSession();
  }

  let certificate = null;
  let certificateMessage = null;

  /*
   * MongoDB transaction commit hone ke baad
   * PDF generate aur upload hoga.
   */
  if (
    progressResult?.shouldIssueCertificate &&
    progressResult.certificateData
  ) {
    try {
      const certificateResult = await issueCertificate(
        progressResult.certificateData,
      );

      certificate = certificateResult.certificate;

      certificateMessage = certificateResult.message;
    } catch (error) {
      console.error("Automatic certificate issue failed:", error);

      /*
       * Failed state issueCertificate service ke
       * andar already save ho chuki hai.
       */
      certificateMessage =
        "Course completed, but certificate generation is pending";
    }
  }

  return res.status(200).json({
    success: true,

    message: progressResult.isCourseCompleted
      ? "Course completed successfully"
      : "Lecture completed successfully",

    progress: progressResult,

    certificate,

    certificateMessage,
  });
});
export const updateWatchTimeController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;
  const { watchedDurationInSeconds } = req.body;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture ID",
    });
  }

  const parsedWatchTime = Number(watchedDurationInSeconds);

  if (
    watchedDurationInSeconds === undefined ||
    !Number.isFinite(parsedWatchTime) ||
    parsedWatchTime < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "watchedDurationInSeconds must be a valid non-negative number",
    });
  }

  const session = await mongoose.startSession();

  let responseData;

  try {
    await session.withTransaction(async () => {
      const lecture = await Lecture.findOne({
        _id: lectureId,
        isActive: true,
        isPublished: true,
      })
        .select("course module title type durationInSeconds")
        .session(session);

      if (!lecture) {
        const error = new Error("Lecture not found or not published");

        error.statusCode = 404;
        throw error;
      }

      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: lecture.course,
      }).session(session);

      if (!enrollment) {
        const error = new Error("You are not enrolled in this course");

        error.statusCode = 403;
        throw error;
      }

      validateEnrollmentAccess(enrollment);

      const lectureDuration = Number(lecture.durationInSeconds) || 0;

      const normalizedWatchTime =
        lectureDuration > 0
          ? Math.min(parsedWatchTime, lectureDuration)
          : parsedWatchTime;

      const lectureProgress = await LectureProgress.findOneAndUpdate(
        {
          enrollment: enrollment._id,
          lecture: lecture._id,
        },
        {
          $max: {
            watchedDurationInSeconds: normalizedWatchTime,
          },

          $setOnInsert: {
            isCompleted: false,
            completedAt: null,
          },
        },
        {
          returnDocument: 'after',
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          session,
        },
      );

      const currentWatchedPercentage =
        lectureDuration > 0
          ? Math.min(
              100,
              Number(
                (
                  (lectureProgress.watchedDurationInSeconds / lectureDuration) *
                  100
                ).toFixed(2),
              ),
            )
          : 0;

      let completionResult = null;
      let autoCompletedNow = false;

      if (currentWatchedPercentage >= 95 && !lectureProgress.isCompleted) {
        completionResult = await completeLectureProgress({
          enrollment,
          lecture,
          session,
        });

        autoCompletedNow = true;
      } else {
        enrollment.lastWatchedLecture = lecture._id;
        enrollment.lastWatchedAt = new Date();

        await enrollment.save({ session });
      }

      const finalLectureProgress =
        completionResult?.lectureProgress ?? lectureProgress;

      const finalWatchedPercentage =
        lectureDuration > 0
          ? Math.min(
              100,
              Number(
                (
                  (finalLectureProgress.watchedDurationInSeconds /
                    lectureDuration) *
                  100
                ).toFixed(2),
              ),
            )
          : 0;

      responseData = {
        lectureProgress: finalLectureProgress,

        watchedPercentage: finalWatchedPercentage,

        completedLecturesCount:
          completionResult?.completedLecturesCount ??
          enrollment.completedLecturesCount,

        totalLectures: completionResult?.totalLectures ?? null,

        progressPercentage:
          completionResult?.progressPercentage ?? enrollment.progressPercentage,

        isCourseCompleted:
          completionResult?.isCourseCompleted ??
          enrollment.status === "completed",

        lastWatchedAt:
          completionResult?.lastWatchedAt ?? enrollment.lastWatchedAt,

        autoCompletedNow,
      };
    });

    return res.status(200).json({
      success: true,

      message: responseData.autoCompletedNow
        ? "Watch time updated and lecture completed successfully"
        : "Lecture watch time updated successfully",

      progress: {
        lectureId,

        watchedDurationInSeconds:
          responseData.lectureProgress.watchedDurationInSeconds,

        watchedPercentage: responseData.watchedPercentage,

        isCompleted: responseData.lectureProgress.isCompleted,

        completedLecturesCount: responseData.completedLecturesCount,

        totalLectures: responseData.totalLectures,

        courseProgressPercentage: responseData.progressPercentage,

        isCourseCompleted: responseData.isCourseCompleted,

        lastWatchedAt: responseData.lastWatchedAt,

        autoCompletedNow: responseData.autoCompletedNow,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Lecture progress already exists. Please retry",
      });
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

export const getCourseProgressController = asyncHandler(async (req, res) => {
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
    .select(
      `
          course
          status
          progressPercentage
          completedLecturesCount
          lastWatchedLecture
          lastWatchedAt
          expiresAt
        `,
    )
    .populate({
      path: "lastWatchedLecture",
      select: "title type durationInSeconds module order",
    })
    .lean();

  if (!enrollment) {
    const course = await Course.findById(courseId).select("instructor");
    const isAdmin = req.user.role === "admin";
    const isOwner =
      course && course.instructor.toString() === req.user.id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    enrollment = {
      course: courseId,
      status: "active",
      progressPercentage: 0,
      completedLecturesCount: 0,
      lastWatchedLecture: null,
      lastWatchedAt: null,
      expiresAt: null,
    };
  } else {
    validateEnrollmentAccess(enrollment);
  }

  const lectures = await Lecture.find({
    course: courseId,
    isActive: true,
    isPublished: true,
  })
    .select(
      `
          title
          description
          module
          type
          order
          durationInSeconds
          isPreview
        `,
    )
    .sort({
      module: 1,
      order: 1,
    })
    .lean();

  const lectureProgressList = await LectureProgress.find({
    enrollment: enrollment._id,
  })
    .select(
      `
            lecture
            isCompleted
            watchedDurationInSeconds
            completedAt
            updatedAt
          `,
    )
    .lean();

  const progressMap = new Map(
    lectureProgressList.map((progress) => [
      progress.lecture.toString(),
      progress,
    ]),
  );

  const lectureDetails = lectures.map((lecture) => {
    const progress = progressMap.get(lecture._id.toString());

    const watchedDurationInSeconds = progress?.watchedDurationInSeconds ?? 0;

    const durationInSeconds = Number(lecture.durationInSeconds) || 0;

    const watchedPercentage =
      durationInSeconds > 0
        ? Math.min(
            100,
            Number(
              ((watchedDurationInSeconds / durationInSeconds) * 100).toFixed(2),
            ),
          )
        : 0;

    return {
      _id: lecture._id,
      title: lecture.title,
      description: lecture.description,
      module: lecture.module,
      type: lecture.type,
      order: lecture.order,
      durationInSeconds,
      isPreview: lecture.isPreview,

      progress: {
        isCompleted: progress?.isCompleted ?? false,

        watchedDurationInSeconds,

        watchedPercentage,

        completedAt: progress?.completedAt ?? null,

        lastWatchedAt: progress?.updatedAt ?? null,
      },
    };
  });

  const totalLectures = lectures.length;

  const completedLecturesCount = lectureDetails.filter(
    (lecture) => lecture.progress.isCompleted,
  ).length;

  const calculatedProgressPercentage =
    totalLectures > 0
      ? Math.min(
          100,
          Number(((completedLecturesCount / totalLectures) * 100).toFixed(2)),
        )
      : 0;

  return res.status(200).json({
    success: true,
    message: "Course progress fetched successfully",

    enrollment: {
      status: enrollment.status,

      progressPercentage: calculatedProgressPercentage,

      completedLecturesCount,

      totalLectures,

      isCourseCompleted:
        totalLectures > 0 && completedLecturesCount === totalLectures,

      lastWatchedLecture: enrollment.lastWatchedLecture,

      lastWatchedAt: enrollment.lastWatchedAt,

      expiresAt: enrollment.expiresAt,
    },

    lectures: lectureDetails,
  });
});

export const getContinueLearningController = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.user.id,
    status: "active",
  })
    .populate({
      path: "course",
      select: "title slug thumbnail instructor totalDurationInSeconds",
    })
    .sort({
      lastWatchedAt: -1,
    });

  const data = await Promise.all(
    enrollments.map(async (enrollment) => {
      const totalLectures = await Lecture.countDocuments({
        course: enrollment.course._id,
        isActive: true,
        isPublished: true,
      });

      let nextLecture = null;

      if (enrollment.lastWatchedLecture) {
        const lastLecture = await Lecture.findById(
          enrollment.lastWatchedLecture,
        ).select("order module course");

        if (lastLecture) {
          nextLecture = await Lecture.findOne({
            course: lastLecture.course,
            isActive: true,
            isPublished: true,

            $or: [
              {
                module: lastLecture.module,
                order: {
                  $gt: lastLecture.order,
                },
              },
              {
                module: {
                  $gt: lastLecture.module,
                },
              },
            ],
          })
            .sort({
              module: 1,
              order: 1,
            })
            .select("title durationInSeconds type");
        }
      }

      return {
        course: enrollment.course,

        progressPercentage: enrollment.progressPercentage,

        completedLecturesCount: enrollment.completedLecturesCount,

        totalLectures,

        lastWatchedLecture: enrollment.lastWatchedLecture,

        lastWatchedAt: enrollment.lastWatchedAt,

        nextLecture,
      };
    }),
  );

  return res.status(200).json({
    success: true,
    message: "Continue learning fetched successfully",

    courses: data,
  });
});
