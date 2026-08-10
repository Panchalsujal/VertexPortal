import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getAdminCourses,
  getAdminCourseById,
  publishAdminCourse,
  unpublishAdminCourse,
  activateAdminCourse,
  deactivateAdminCourse,
  archiveAdminCourse,
  getAdminCourseAnalytics,
} from "../service/adminCourse.service.js";

/*
 * All courses
 */
export const getAdminCoursesController = asyncHandler(async (req, res) => {
  const result = await getAdminCourses({
    query: req.query,
  });

  return res.status(200).json({
    success: true,

    message: "Courses fetched successfully",

    ...result,
  });
});

/*
 * Course analytics
 */
export const getAdminCourseAnalyticsController = asyncHandler(
  async (req, res) => {
    const analytics = await getAdminCourseAnalytics();

    return res.status(200).json({
      success: true,

      message: "Course analytics fetched successfully",

      analytics,
    });
  },
);

/*
 * Single course
 */
export const getAdminCourseByIdController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await getAdminCourseById({
    courseId,
  });

  return res.status(200).json({
    success: true,

    message: "Course fetched successfully",

    ...result,
  });
});

/*
 * Publish
 */
export const publishAdminCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await publishAdminCourse({
    courseId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    course: result.course,
  });
});

/*
 * Unpublish
 */
export const unpublishAdminCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await unpublishAdminCourse({
    courseId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    course: result.course,
  });
});

/*
 * Activate
 */
export const activateAdminCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await activateAdminCourse({
    courseId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    course: result.course,
  });
});

/*
 * Deactivate
 */
export const deactivateAdminCourseController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    const result = await deactivateAdminCourse({
      courseId,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      changed: result.changed,

      course: result.course,
    });
  },
);

/*
 * Archive
 */
export const archiveAdminCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await archiveAdminCourse({
    courseId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    course: result.course,
  });
});
