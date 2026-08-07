import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAdminDashboard,
  getOrders,
  getOrderById,
  getStudents,
  getStudentById,
  updateStudentStatus,
  getCourses,
  getCourseById,
  updateCourseStatus,
  deleteCourse,
  restoreCourse,
  getReviews,
  getDashboardSummary,
  updateReviewStatus,
} from "../service/admin.service.js";
import { createAuditLog } from "../service/auditLog.service.js";
import { getRequestMetadata } from "../utils/requestMetadata.js";
import User from "../models/user.model.js"; 


import {
  getLiveClasses,
  getLiveClassById,
  updateLiveClassStatus,
  cancelLiveClass,
  restoreLiveClass,
} from "../service/adminLive.service.js";


import { ApiError } from "../utils/ApiError.js";

import { logAdminAction } from "../service/adminAuditLogger.service.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";

export const getDashboardSummaryController = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardSummary();

  return res.status(200).json({
    success: true,
    message: "Dashboard summary fetched successfully",

    dashboard,
  });
});

export const getDashboardController = asyncHandler(async (req, res) => {
  const dashboard = await getAdminDashboard();

  return res.status(200).json({
    success: true,
    data: dashboard,
  });
});

export const getOrdersController = asyncHandler(async (req, res) => {
  const result = await getOrders(req.query);

  return res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    ...result,
  });
});

export const getOrderByIdController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await getOrderById(orderId);

  return res.status(200).json({
    success: true,
    message: "Order details fetched successfully",
    order,
  });
});

export const getStudentsController = asyncHandler(async (req, res) => {
  const result = await getStudents(req.query);

  return res.status(200).json({
    success: true,
    message: "Students fetched successfully",
    ...result,
  });
});

export const getStudentByIdController = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const result = await getStudentById(studentId);

  return res.status(200).json({
    success: true,
    message: "Student details fetched successfully",
    ...result,
  });
});

export const updateStudentStatusController = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { status } = req.body || {};
  const beforeStudent = await User.findOne({
    _id: studentId,
    role: "student",
  })
    .select("status isActive")
    .lean();

  const result = await updateStudentStatus({
    studentId,
    status,
  });

  const { ipAddress, userAgent } = getRequestMetadata(req);

  await createAuditLog({
    actorId: req.user.id,
    action: "student_status_updated",
    resourceType: "student",
    resourceId: result.student._id,
    description: `Student status updated to ${result.student.status}`,
    before: beforeStudent
      ? {
          status: beforeStudent.status,
          isActive: beforeStudent.isActive,
        }
      : null,
    after: {
      status: result.student.status,
      isActive: result.student.isActive,
    },
    metadata: {
      studentEmail: result.student.email,
    },
    ipAddress,
    userAgent,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    student: result.student,
  });
});

export const getCoursesController = asyncHandler(async (req, res) => {
  const result = await getCourses(req.query);

  return res.status(200).json({
    success: true,
    message: "Courses fetched successfully",
    ...result,
  });
});

export const getCourseByIdController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await getCourseById(courseId);

  return res.status(200).json({
    success: true,
    message: "Course details fetched successfully",
    ...result,
  });
});

export const updateCourseStatusController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { status } = req.body || {};

  const result = await updateCourseStatus({
    courseId,
    status,
  });

  if (result.changed) {
    const { ipAddress, userAgent } = getRequestMetadata(req);

    await createAuditLog({
      actorId: req.user.id,
      action: AUDIT_ACTIONS.COURSE_STATUS_UPDATED,
      resourceType: "course",
      resourceId: result.course._id,
      description: `Course status updated to ${result.course.status}`,
      before: result.before,
      after: result.after,
      metadata: {
        courseTitle: result.course.title,
      },
      ipAddress,
      userAgent,
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    course: result.course,
  });
});

export const deleteCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await deleteCourse(courseId);

  if (result.changed) {
    const { ipAddress, userAgent } = getRequestMetadata(req);

    await createAuditLog({
      actorId: req.user.id,

      action: AUDIT_ACTIONS.COURSE_ARCHIVED,

      resourceType: "course",

      resourceId: result.course._id,

      description: `Course "${result.course.title}" archived`,

      before: result.before,

      after: result.after,

      metadata: {
        courseTitle: result.course.title,
        courseSlug: result.course.slug,
      },

      ipAddress,

      userAgent,
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,

    course: {
      id: result.course._id,
      title: result.course.title,
      slug: result.course.slug,
      status: result.course.status,
      isPublished: result.course.isPublished,
      isActive: result.course.isActive,
      publishedAt: result.course.publishedAt,
    },
  });
});

export const restoreCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await restoreCourse(courseId);

  if (result.changed) {
    const { ipAddress, userAgent } = getRequestMetadata(req);

    await createAuditLog({
      actorId: req.user.id,

      action: AUDIT_ACTIONS.COURSE_RESTORED,

      resourceType: "course",

      resourceId: result.course._id,

      description: `Course "${result.course.title}" restored`,

      before: result.before,

      after: result.after,

      metadata: {
        courseTitle: result.course.title,
        courseSlug: result.course.slug,
      },

      ipAddress,

      userAgent,
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,

    course: {
      id: result.course._id,
      title: result.course.title,
      slug: result.course.slug,
      status: result.course.status,
      isPublished: result.course.isPublished,
      isActive: result.course.isActive,
      publishedAt: result.course.publishedAt,
    },
  });
});

export const getReviewsController = asyncHandler(async (req, res) => {
  const result = await getReviews(req.query);

  return res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    ...result,
  });
});

export const updateReviewStatusController = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { isPublished } = req.body || {};

  const result = await updateReviewStatus({
    reviewId,
    isPublished,
  });

  if (result.changed) {
    const { ipAddress, userAgent } = getRequestMetadata(req);

    await createAuditLog({
      actorId: req.user.id,

      action: AUDIT_ACTIONS.REVIEW_STATUS_UPDATED,

      resourceType: "review",

      resourceId: result.review._id,

      description: `Review ${
        result.review.isPublished ? "published" : "hidden"
      }`,

      before: result.before,

      after: result.after,

      metadata: {
        courseId: result.review.course,
        studentId: result.review.student,
        rating: result.review.rating,
      },

      ipAddress,

      userAgent,
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    review: result.review,
  });
});

export const getLiveClassesController = asyncHandler(async (req, res) => {
  const result = await getLiveClasses(req.query);

  return res.status(200).json({
    success: true,
    message: "Live classes fetched successfully",
    ...result,
  });
});

export const getLiveClassByIdController = asyncHandler(async (req, res) => {
  const { liveClassId } = req.params;

  const result = await getLiveClassById(liveClassId);

  return res.status(200).json({
    success: true,
    message: "Live class details fetched successfully",
    ...result,
  });
});

export const updateLiveClassStatusController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const { status, cancellationReason } = req.body || {};

    const result = await updateLiveClassStatus({
      liveClassId,
      status,
      cancellationReason,
      adminId: req.user.id,
    });

    if (result.changed) {
      await logAdminAction(req, {
        action: AUDIT_ACTIONS.LIVE_CLASS_STATUS_UPDATED,

        resourceType: "live_class",

        resourceId: result.liveClass._id,

        description: `Live class "${result.liveClass.title}" status updated to ${result.liveClass.status}`,

        before: result.before,

        after: result.after,

        metadata: {
          title: result.liveClass.title,
          courseId: result.liveClass.course,
          instructorId: result.liveClass.instructor,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      liveClass: result.liveClass,
    });
  },
);

export const cancelLiveClassController = asyncHandler(async (req, res) => {
  const { liveClassId } = req.params;

  const { cancellationReason } = req.body || {};

  const result = await cancelLiveClass({
    liveClassId,
    cancellationReason,
    adminId: req.user.id,
  });

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.LIVE_CLASS_CANCELLED,

      resourceType: "live_class",

      resourceId: result.liveClass._id,

      description: `Live class "${result.liveClass.title}" cancelled`,

      before: result.before,

      after: result.after,

      metadata: {
        title: result.liveClass.title,
        courseId: result.liveClass.course,
        instructorId: result.liveClass.instructor,
        cancellationReason: result.liveClass.cancellationReason,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,

    liveClass: {
      id: result.liveClass._id,
      title: result.liveClass.title,
      status: result.liveClass.status,
      isActive: result.liveClass.isActive,
      isPublished: result.liveClass.isPublished,
      cancellationReason: result.liveClass.cancellationReason,
      cancelledAt: result.liveClass.cancelledAt,
      cancelledBy: result.liveClass.cancelledBy,
    },
  });
});

export const restoreLiveClassController = asyncHandler(async (req, res) => {
  const { liveClassId } = req.params;

  const result = await restoreLiveClass(liveClassId);

  if (result.changed) {
    await logAdminAction(req, {
      action: AUDIT_ACTIONS.LIVE_CLASS_RESTORED,

      resourceType: "live_class",

      resourceId: result.liveClass._id,

      description: `Live class "${result.liveClass.title}" restored`,

      before: result.before,

      after: result.after,

      metadata: {
        title: result.liveClass.title,
        courseId: result.liveClass.course,
        instructorId: result.liveClass.instructor,
        scheduledStartAt: result.liveClass.scheduledStartAt,
        scheduledEndAt: result.liveClass.scheduledEndAt,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    liveClass: result.liveClass,
  });
});
