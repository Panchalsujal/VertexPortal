import mongoose from "mongoose";

import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import LectureProgress from "../models/lectureProgress.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function getMyCourses(studentId) {
  const enrollments = await Enrollment.find({
    student: studentId,
    status: {
      $in: ["active", "completed"],
    },
  })
    .populate({
      path: "course",
      select: `
        title
        slug
        subtitle
        thumbnailUrl
        totalLectures
        totalDurationInSeconds
        instructor
        isPublished
        isActive
        averageRating
        totalReviews
      `,
      populate: {
        path: "instructor",
        select: "fullName avatarUrl",
      },
    })
    .sort({
      lastWatchedAt: -1,
      createdAt: -1,
    })
    .lean();

  const courses = enrollments
    .filter((enrollment) => enrollment.course)
    .map((enrollment) => {
      const course = enrollment.course;
      const instructor = course.instructor;

      return {
        enrollmentId: enrollment._id,

        courseId: course._id,

        title: course.title,

        slug: course.slug,

        subtitle: course.subtitle,

        thumbnailUrl: course.thumbnailUrl,

        averageRating: course.averageRating ?? 0,

        totalReviews: course.totalReviews ?? 0,

        instructor: instructor
          ? {
              id: instructor._id,
              fullName: instructor.fullName,
              avatarUrl: instructor.avatarUrl,
            }
          : null,

        progressPercentage: enrollment.progressPercentage ?? 0,

        completedLecturesCount: enrollment.completedLecturesCount ?? 0,

        totalLectures: course.totalLectures ?? 0,

        totalDurationInSeconds: course.totalDurationInSeconds ?? 0,

        lastWatchedLecture: enrollment.lastWatchedLecture ?? null,

        lastWatchedAt: enrollment.lastWatchedAt ?? null,

        enrolledAt: enrollment.enrolledAt,

        expiresAt: enrollment.expiresAt ?? null,

        status: enrollment.status,

        isCourseAvailable:
          course.isActive === true && course.isPublished === true,
      };
    });

  return courses;
}

export async function getContinueLearning(studentId) {
  const enrollments = await Enrollment.find({
    student: studentId,

    status: {
      $in: ["active", "completed"],
    },

    $or: [
      {
        lastWatchedLecture: {
          $ne: null,
        },
      },
      {
        progressPercentage: {
          $gt: 0,
        },
      },
    ],
  })
    .populate({
      path: "course",

      select: `
        title
        slug
        subtitle
        thumbnailUrl
        totalLectures
        totalDurationInSeconds
        instructor
        isPublished
        isActive
        averageRating
        totalReviews
      `,

      populate: {
        path: "instructor",
        select: "fullName avatarUrl",
      },
    })
    .populate({
      path: "lastWatchedLecture",

      select: `
        title
        type
        module
        order
        durationInSeconds
        videoUrl
        documentUrl
      `,
    })
    .sort({
      lastWatchedAt: -1,
    })
    .lean();

  return enrollments
    .filter((enrollment) => enrollment.course)
    .map((enrollment) => {
      const course = enrollment.course;
      const instructor = course.instructor;

      return {
        enrollmentId: enrollment._id,
        courseId: course._id,

        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle,
        thumbnailUrl: course.thumbnailUrl,

        instructor: instructor
          ? {
              id: instructor._id,
              fullName: instructor.fullName,
              avatarUrl: instructor.avatarUrl,
            }
          : null,

        progressPercentage: enrollment.progressPercentage ?? 0,

        completedLecturesCount: enrollment.completedLecturesCount ?? 0,

        totalLectures: course.totalLectures ?? 0,

        totalDurationInSeconds: course.totalDurationInSeconds ?? 0,

        lastWatchedLecture: enrollment.lastWatchedLecture ?? null,

        lastWatchedAt: enrollment.lastWatchedAt ?? null,

        status: enrollment.status,

        isCourseCompleted: enrollment.status === "completed",

        isCourseAvailable:
          course.isActive === true && course.isPublished === true,
      };
    });
}

export async function getResumeLearning({ studentId, courseId }) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: {
      $in: ["active", "completed"],
    },
  })
    .populate({
      path: "lastWatchedLecture",
      select: `
        title
        description
        type
        module
        course
        order
        durationInSeconds
        isPublished
        isActive
      `,
    })
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= Date.now()
  ) {
    throw new ApiError(403, "Your enrollment has expired");
  }

  let resumeLecture = enrollment.lastWatchedLecture;

  /*
   * Last watched lecture available aur valid hai,
   * to wahi resume lecture hogi.
   */
  if (resumeLecture && resumeLecture.isActive && resumeLecture.isPublished) {
    return {
      enrollmentId: enrollment._id,
      courseId,
      moduleId: resumeLecture.module,
      lectureId: resumeLecture._id,
      lecture: resumeLecture,
      progressPercentage: enrollment.progressPercentage ?? 0,
      lastWatchedAt: enrollment.lastWatchedAt ?? null,
      isCourseCompleted: enrollment.status === "completed",
    };
  }

  /*
   * Agar student ne abhi course start nahi kiya
   * ya last watched lecture archive/unpublish ho gayi,
   * to course ki first published lecture return karo.
   */
  resumeLecture = await Lecture.findOne({
    course: courseId,
    isActive: true,
    isPublished: true,
  })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .select(
      `
      title
      description
      type
      module
      course
      order
      durationInSeconds
    `,
    )
    .lean();

  if (!resumeLecture) {
    throw new ApiError(
      404,
      "No published lectures are available in this course",
    );
  }

  return {
    enrollmentId: enrollment._id,
    courseId,
    moduleId: resumeLecture.module,
    lectureId: resumeLecture._id,
    lecture: resumeLecture,
    progressPercentage: enrollment.progressPercentage ?? 0,
    lastWatchedAt: enrollment.lastWatchedAt ?? null,
    isCourseCompleted: enrollment.status === "completed",
  };
}

export async function getCoursePlayer({
  studentId,
  courseId,
}) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // 1. Enrollment check
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: {
      $in: ["active", "completed"],
    },
  }).lean();

  if (!enrollment) {
    throw new ApiError(
      403,
      "You are not enrolled in this course",
    );
  }

  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= Date.now()
  ) {
    throw new ApiError(
      403,
      "Your enrollment has expired",
    );
  }

  // 2. Course fetch
  const course = await Course.findOne({
    _id: courseId,
    isActive: true,
  })
    .select(`
      title
      slug
      subtitle
      thumbnailUrl
      instructor
      totalModules
      totalLectures
      totalDurationInSeconds
    `)
    .populate({
      path: "instructor",
      select: "fullName avatarUrl",
    })
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // 3. Active published modules
  const modules = await CourseModule.find({
    course: courseId,
    isActive: true,
    isPublished: true,
  })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .select(`
      title
      description
      order
      totalLectures
      totalDurationInSeconds
    `)
    .lean();

  const moduleIds = modules.map(
    (module) => module._id,
  );

  // 4. Published lectures
  const lectures = await Lecture.find({
    course: courseId,
    module: {
      $in: moduleIds,
    },
    isActive: true,
    isPublished: true,
  })
    .sort({
      module: 1,
      order: 1,
      createdAt: 1,
    })
    .select(`
      title
      description
      module
      type
      order
      durationInSeconds
      isPreview
      videoUrl
      documentUrl
      content
    `)
    .lean();

  // 5. Student lecture progress
  const lectureIds = lectures.map(
    (lecture) => lecture._id,
  );

  const lectureProgressList =
    await LectureProgress.find({
      enrollment: enrollment._id,
      lecture: {
        $in: lectureIds,
      },
    })
      .select(`
        lecture
        isCompleted
        watchedDurationInSeconds
        completedAt
        updatedAt
      `)
      .lean();

  const progressMap = new Map(
    lectureProgressList.map((progress) => [
      progress.lecture.toString(),
      progress,
    ]),
  );

  // 6. Lectures module-wise group karo
  const lecturesByModule = new Map();

  for (const lecture of lectures) {
    const moduleId = lecture.module.toString();

    if (!lecturesByModule.has(moduleId)) {
      lecturesByModule.set(moduleId, []);
    }

    const progress = progressMap.get(
      lecture._id.toString(),
    );

    const duration =
      Number(lecture.durationInSeconds) || 0;

    const watchedDuration =
      progress?.watchedDurationInSeconds ?? 0;

    const watchedPercentage =
      duration > 0
        ? Math.min(
            100,
            Number(
              (
                (watchedDuration / duration) *
                100
              ).toFixed(2),
            ),
          )
        : 0;

    lecturesByModule.get(moduleId).push({
      _id: lecture._id,
      title: lecture.title,
      description: lecture.description,
      type: lecture.type,
      order: lecture.order,
      durationInSeconds: duration,
      isPreview: lecture.isPreview,

      /*
       * Student enrolled hai, isliye actual content
       * return kar sakte hain.
       */
      videoUrl: lecture.videoUrl,
      documentUrl: lecture.documentUrl,
      content: lecture.content,

      progress: {
        isCompleted:
          progress?.isCompleted ?? false,

        watchedDurationInSeconds:
          watchedDuration,

        watchedPercentage,

        completedAt:
          progress?.completedAt ?? null,

        lastWatchedAt:
          progress?.updatedAt ?? null,
      },

      isCurrentLecture:
        enrollment.lastWatchedLecture?.toString() ===
        lecture._id.toString(),
    });
  }

  const curriculum = modules.map((module) => ({
    _id: module._id,
    title: module.title,
    description: module.description,
    order: module.order,
    totalLectures: module.totalLectures,
    totalDurationInSeconds:
      module.totalDurationInSeconds,
    lectures:
      lecturesByModule.get(
        module._id.toString(),
      ) ?? [],
  }));

  return {
    course: {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle,
      thumbnailUrl: course.thumbnailUrl,
      instructor: course.instructor,
      totalModules: course.totalModules,
      totalLectures: course.totalLectures,
      totalDurationInSeconds:
        course.totalDurationInSeconds,
    },

    enrollment: {
      _id: enrollment._id,
      status: enrollment.status,
      progressPercentage:
        enrollment.progressPercentage ?? 0,
      completedLecturesCount:
        enrollment.completedLecturesCount ?? 0,
      lastWatchedLecture:
        enrollment.lastWatchedLecture ?? null,
      lastWatchedAt:
        enrollment.lastWatchedAt ?? null,
      enrolledAt: enrollment.enrolledAt,
      expiresAt: enrollment.expiresAt ?? null,
      isCourseCompleted:
        enrollment.status === "completed",
    },

    curriculum,
  };
}
