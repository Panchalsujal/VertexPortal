import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import LectureProgress from "../models/lectureProgress.model.js";
import { issueCertificate } from "./certificate.service.js";

export async function completeLectureProgress({
  enrollment,
  lecture,
  session = null,
}) {
  const now = new Date();

  const queryOptions = {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  };

  if (session) {
    queryOptions.session = session;
  }

  const lectureProgress =
    await LectureProgress.findOneAndUpdate(
      {
        enrollment: enrollment._id,
        lecture: lecture._id,
      },
      {
        $set: {
          isCompleted: true,
          completedAt: now,
        },

        $max: {
          watchedDurationInSeconds:
            Number(lecture.durationInSeconds) || 0,
        },

        $setOnInsert: {
          student: enrollment.student,
          course: enrollment.course,
        },
      },
      queryOptions,
    );

  const completedLecturesQuery =
    LectureProgress.countDocuments({
      enrollment: enrollment._id,
      isCompleted: true,
    });

  const totalLecturesQuery =
    Lecture.countDocuments({
      course: lecture.course,
      isActive: true,
      isPublished: true,
    });

  if (session) {
    completedLecturesQuery.session(session);
    totalLecturesQuery.session(session);
  }

  const [
    completedLecturesCount,
    totalLectures,
  ] = await Promise.all([
    completedLecturesQuery,
    totalLecturesQuery,
  ]);

  const progressPercentage =
    totalLectures > 0
      ? Math.min(
          100,
          Number(
            (
              (completedLecturesCount /
                totalLectures) *
              100
            ).toFixed(2),
          ),
        )
      : 0;

  const isCourseCompleted =
    totalLectures > 0 &&
    completedLecturesCount >= totalLectures;

  enrollment.completedLecturesCount =
    completedLecturesCount;

  enrollment.progressPercentage =
    progressPercentage;

  enrollment.lastWatchedLecture =
    lecture._id;

  enrollment.lastWatchedAt = now;

  if (isCourseCompleted) {
    enrollment.status = "completed";

    /*
     * Pehli completion date preserve hogi.
     */
    enrollment.completedAt =
      enrollment.completedAt ?? now;

    /*
     * Already issued certificate ko pending nahi karenge.
     */
    if (
      enrollment.certificateStatus !== "issued"
    ) {
      enrollment.certificateStatus = "pending";
      enrollment.certificateIssueError = "";
    }
  } else {
    enrollment.status = "active";
    enrollment.completedAt = null;

    if (
      enrollment.certificateStatus !== "issued"
    ) {
      enrollment.certificateStatus =
        "not_eligible";

      enrollment.certificateIssueError = "";
    }
  }

  if (session) {
    await enrollment.save({ session });
  } else {
    await enrollment.save();
  }

  const shouldIssueCertificate =
    isCourseCompleted &&
    enrollment.certificateStatus !== "issued";

  return {
    lectureProgress,

    completedLecturesCount,
    totalLectures,

    progressPercentage,
    isCourseCompleted,

    enrollmentStatus: enrollment.status,
    completedAt: enrollment.completedAt,

    certificateStatus:
      enrollment.certificateStatus,

    shouldIssueCertificate,

    certificateData: shouldIssueCertificate
      ? {
          studentId:
            enrollment.student.toString(),

          courseId:
            enrollment.course.toString(),

          enrollmentId:
            enrollment._id.toString(),
        }
      : null,

    lastWatchedLecture:
      enrollment.lastWatchedLecture,

    lastWatchedAt:
      enrollment.lastWatchedAt,
  };
}
