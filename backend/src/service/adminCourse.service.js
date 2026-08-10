import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";

import { validateObjectId } from "../utils/validator.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import {
  parseBooleanQuery,
  parseEnumQuery,
  parseSortQuery,
} from "../utils/queryParser.js";

import { buildSearchFilter } from "../utils/search.js";

import { ApiError } from "../utils/ApiError.js";

const COURSE_STATUSES = ["draft", "published", "archived"];

/*
 * =====================================================
 * GET ALL COURSES
 * =====================================================
 */
export async function getAdminCourses({ query = {} }) {
  const {
    search,
    status,
    instructor,
    category,
    isPublished,
    isActive,

    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  /*
   * Search
   */
  const searchFilter = buildSearchFilter(search, [
    "title",
    "subtitle",
    "description",
    "slug",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  /*
   * Status
   */
  const parsedStatus = parseEnumQuery(status, COURSE_STATUSES, "Course status");

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  /*
   * Instructor
   */
  if (instructor) {
    validateObjectId(instructor, "instructor ID");

    filter.instructor = instructor;
  }

  /*
   * Category
   */
  if (category) {
    validateObjectId(category, "category ID");

    filter.category = category;
  }

  /*
   * Published
   */
  const parsedIsPublished = parseBooleanQuery(isPublished, "isPublished");

  if (parsedIsPublished !== undefined) {
    filter.isPublished = parsedIsPublished;
  }

  /*
   * Active
   */
  const parsedIsActive = parseBooleanQuery(isActive, "isActive");

  if (parsedIsActive !== undefined) {
    filter.isActive = parsedIsActive;
  }

  /*
   * Sorting
   */
  const {
    sortBy: selectedSortField,

    sortOrder,

    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: [
      "createdAt",
      "updatedAt",
      "title",
      "price",
      "discountPrice",
      "status",
    ],

    defaultField: "createdAt",

    defaultOrder: "desc",
  });

  const [courses, totalRecords] = await Promise.all([
    Course.find(filter)
      .populate({
        path: "instructor",

        select: "fullName email avatarUrl role status isActive",
      })
      .populate({
        path: "category",

        select: "name slug",
      })
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Course.countDocuments(filter),
  ]);

  return {
    courses,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,

      status: parsedStatus ?? null,

      instructor: instructor || null,

      category: category || null,

      isPublished: parsedIsPublished ?? null,

      isActive: parsedIsActive ?? null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

/*
 * =====================================================
 * GET COURSE DETAILS
 * =====================================================
 */
export async function getAdminCourseById({ courseId }) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId)
    .populate({
      path: "instructor",

      select: "fullName email avatarUrl role status isActive",
    })
    .populate({
      path: "category",

      select: "name slug",
    })
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const [
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    cancelledEnrollments,
    expiredEnrollments,
  ] = await Promise.all([
    Enrollment.countDocuments({
      course: courseId,
    }),

    Enrollment.countDocuments({
      course: courseId,

      status: "active",
    }),

    Enrollment.countDocuments({
      course: courseId,

      status: "completed",
    }),

    Enrollment.countDocuments({
      course: courseId,

      status: "cancelled",
    }),

    Enrollment.countDocuments({
      course: courseId,

      status: "expired",
    }),
  ]);

  return {
    course,

    stats: {
      enrollments: {
        total: totalEnrollments,

        active: activeEnrollments,

        completed: completedEnrollments,

        cancelled: cancelledEnrollments,

        expired: expiredEnrollments,
      },
    },
  };
}

/*
 * =====================================================
 * PUBLISH COURSE
 * =====================================================
 */
export async function publishAdminCourse({ courseId }) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (!course.isActive) {
    throw new ApiError(409, "Inactive course cannot be published");
  }

  if (course.status === "published" && course.isPublished) {
    return {
      course,

      changed: false,

      message: "Course is already published",
    };
  }

  /*
   * Instructor validation.
   */
  const instructor = await User.findOne({
    _id: course.instructor,

    role: "instructor",

    status: "active",

    isActive: true,
  })
    .select("_id")
    .lean();

  if (!instructor) {
    throw new ApiError(
      409,
      "Course instructor must be active before publishing",
    );
  }

  course.status = "published";

  course.isPublished = true;

  /*
   * Agar tumhare Course model me publishedAt field hai,
   * to ye automatically useful rahega.
   */
  if ("publishedAt" in course) {
    course.publishedAt = course.publishedAt ?? new Date();
  }

  await course.save();

  return {
    course,

    changed: true,

    message: "Course published successfully",
  };
}

/*
 * =====================================================
 * UNPUBLISH COURSE
 * =====================================================
 */
export async function unpublishAdminCourse({ courseId }) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.status === "draft" && !course.isPublished) {
    return {
      course,

      changed: false,

      message: "Course is already unpublished",
    };
  }

  course.status = "draft";

  course.isPublished = false;

  if ("publishedAt" in course) {
    course.publishedAt = null;
  }

  await course.save();

  return {
    course,

    changed: true,

    message: "Course unpublished successfully",
  };
}

/*
 * =====================================================
 * ACTIVATE COURSE
 * =====================================================
 */
export async function activateAdminCourse({ courseId }) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.isActive) {
    return {
      course,

      changed: false,

      message: "Course is already active",
    };
  }

  course.isActive = true;

  await course.save();

  return {
    course,

    changed: true,

    message: "Course activated successfully",
  };
}

/*
 * =====================================================
 * DEACTIVATE COURSE
 * =====================================================
 */
export async function deactivateAdminCourse({ courseId }) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (!course.isActive) {
    return {
      course,

      changed: false,

      message: "Course is already inactive",
    };
  }

  /*
   * Course inactive karte time public listing
   * se bhi hata denge.
   */
  course.isActive = false;

  course.isPublished = false;

  /*
   * Existing enrollments delete/cancel nahi honge.
   * Historical data safe rahega.
   */
  await course.save();

  return {
    course,

    changed: true,

    message: "Course deactivated successfully",
  };
}

/*
 * =====================================================
 * ARCHIVE COURSE
 * =====================================================
 */
export async function archiveAdminCourse({ courseId }) {
  validateObjectId(courseId, "course ID");

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.status === "archived") {
    return {
      course,

      changed: false,

      message: "Course is already archived",
    };
  }

  course.status = "archived";

  course.isPublished = false;

  course.isActive = false;

  await course.save();

  return {
    course,

    changed: true,

    message: "Course archived successfully",
  };
}

/*
 * =====================================================
 * ADMIN COURSE ANALYTICS
 * =====================================================
 */
export async function getAdminCourseAnalytics() {
  const [
    totalCourses,
    publishedCourses,
    draftCourses,
    archivedCourses,
    activeCourses,
    inactiveCourses,
  ] = await Promise.all([
    Course.countDocuments(),

    Course.countDocuments({
      status: "published",

      isPublished: true,
    }),

    Course.countDocuments({
      status: "draft",
    }),

    Course.countDocuments({
      status: "archived",
    }),

    Course.countDocuments({
      isActive: true,
    }),

    Course.countDocuments({
      isActive: false,
    }),
  ]);

  const statusDistribution = await Course.aggregate([
    {
      $group: {
        _id: "$status",

        count: {
          $sum: 1,
        },
      },
    },

    {
      $project: {
        _id: 0,

        status: "$_id",

        count: 1,
      },
    },

    {
      $sort: {
        count: -1,
      },
    },
  ]);

  /*
   * Top courses by enrollments.
   */
  const topCourses = await Enrollment.aggregate([
    {
      $group: {
        _id: "$course",

        totalEnrollments: {
          $sum: 1,
        },

        activeEnrollments: {
          $sum: {
            $cond: [
              {
                $eq: ["$status", "active"],
              },

              1,

              0,
            ],
          },
        },

        completedEnrollments: {
          $sum: {
            $cond: [
              {
                $eq: ["$status", "completed"],
              },

              1,

              0,
            ],
          },
        },
      },
    },

    {
      $sort: {
        totalEnrollments: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "courses",

        localField: "_id",

        foreignField: "_id",

        as: "course",
      },
    },

    {
      $unwind: {
        path: "$course",

        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "users",

        localField: "course.instructor",

        foreignField: "_id",

        as: "instructor",
      },
    },

    {
      $unwind: {
        path: "$instructor",

        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 0,

        courseId: "$_id",

        title: "$course.title",

        slug: "$course.slug",

        thumbnailUrl: "$course.thumbnailUrl",

        instructor: {
          id: "$instructor._id",

          fullName: "$instructor.fullName",

          email: "$instructor.email",
        },

        totalEnrollments: 1,

        activeEnrollments: 1,

        completedEnrollments: 1,
      },
    },
  ]);

  /*
   * Instructor-wise course distribution.
   */
  const topInstructors = await Course.aggregate([
    {
      $group: {
        _id: "$instructor",

        totalCourses: {
          $sum: 1,
        },

        publishedCourses: {
          $sum: {
            $cond: [
              {
                $eq: ["$status", "published"],
              },

              1,

              0,
            ],
          },
        },
      },
    },

    {
      $sort: {
        totalCourses: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "users",

        localField: "_id",

        foreignField: "_id",

        as: "instructor",
      },
    },

    {
      $unwind: {
        path: "$instructor",

        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 0,

        instructorId: "$_id",

        fullName: "$instructor.fullName",

        email: "$instructor.email",

        avatarUrl: "$instructor.avatarUrl",

        totalCourses: 1,

        publishedCourses: 1,
      },
    },
  ]);

  return {
    overview: {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      activeCourses,
      inactiveCourses,
    },

    statusDistribution,

    topCourses,

    topInstructors,
  };
}
