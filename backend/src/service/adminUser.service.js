import User from "../models/user.model.js";
import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";

import { validateObjectId } from "../utils/validator.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import {
  parseBooleanQuery,
  parseEnumQuery,
  parseSortQuery,
} from "../utils/queryParser.js";

import { buildSearchFilter } from "../utils/search.js";

import { ApiError } from "../utils/ApiError.js";

const USER_ROLES = ["student", "instructor", "admin"];

const USER_STATUSES = ["active", "inactive", "suspended"];

/*
 * =====================================================
 * GET ALL USERS
 * =====================================================
 */
export async function getAdminUsers({ adminId, query = {} }) {
  validateObjectId(adminId, "admin ID");

  const {
    search,
    role,
    status,
    isActive,
    isEmailVerified,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  /*
   * Search
   */
  const searchFilter = buildSearchFilter(search, ["fullName", "email"]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  /*
   * Role filter
   */
  const parsedRole = parseEnumQuery(role, USER_ROLES, "User role");

  if (parsedRole !== undefined) {
    filter.role = parsedRole;
  }

  /*
   * Status filter
   */
  const parsedStatus = parseEnumQuery(status, USER_STATUSES, "User status");

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  /*
   * Active filter
   */
  const parsedIsActive = parseBooleanQuery(isActive, "isActive");

  if (parsedIsActive !== undefined) {
    filter.isActive = parsedIsActive;
  }

  /*
   * Email verification
   */
  const parsedIsEmailVerified = parseBooleanQuery(
    isEmailVerified,
    "isEmailVerified",
  );

  if (parsedIsEmailVerified !== undefined) {
    filter.isEmailVerified = parsedIsEmailVerified;
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
      "fullName",
      "email",
      "role",
      "status",
      "lastLoginAt",
    ],

    defaultField: "createdAt",

    defaultOrder: "desc",
  });

  const [users, totalRecords] = await Promise.all([
    User.find(filter)
      .select(
        `
        fullName
        email
        avatarUrl
        role
        status
        isActive
        isEmailVerified
        lastLoginAt
        createdAt
        updatedAt
      `,
      )
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,

      role: parsedRole ?? null,

      status: parsedStatus ?? null,

      isActive: parsedIsActive ?? null,

      isEmailVerified: parsedIsEmailVerified ?? null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

/*
 * =====================================================
 * GET SINGLE USER
 * =====================================================
 */
export async function getAdminUserById({ adminId, userId }) {
  validateObjectId(adminId, "admin ID");

  validateObjectId(userId, "user ID");

  const user = await User.findById(userId)
    .select(
      `
        fullName
        email
        avatarUrl
        role
        status
        isActive
        isEmailVerified
        lastLoginAt
        createdAt
        updatedAt
      `,
    )
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let additionalStats = {};

  /*
   * Student stats
   */
  if (user.role === "student") {
    const [totalEnrollments, activeEnrollments, completedEnrollments] =
      await Promise.all([
        Enrollment.countDocuments({
          student: userId,
        }),

        Enrollment.countDocuments({
          student: userId,

          status: "active",
        }),

        Enrollment.countDocuments({
          student: userId,

          status: "completed",
        }),
      ]);

    additionalStats = {
      student: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
      },
    };
  }

  /*
   * Instructor stats
   */
  if (user.role === "instructor") {
    const [totalCourses, publishedCourses, draftCourses] = await Promise.all([
      Course.countDocuments({
        instructor: userId,
      }),

      Course.countDocuments({
        instructor: userId,

        status: "published",

        isPublished: true,

        isActive: true,
      }),

      Course.countDocuments({
        instructor: userId,

        status: "draft",
      }),
    ]);

    additionalStats = {
      instructor: {
        totalCourses,
        publishedCourses,
        draftCourses,
      },
    };
  }

  return {
    user,

    stats: additionalStats,
  };
}

/*
 * =====================================================
 * UPDATE USER STATUS
 *
 * active / inactive / suspended
 * =====================================================
 */
export async function updateAdminUserStatus({ adminId, userId, status }) {
  validateObjectId(adminId, "admin ID");

  validateObjectId(userId, "user ID");

  if (String(adminId) === String(userId)) {
    throw new ApiError(400, "You cannot change your own account status");
  }

  const parsedStatus = parseEnumQuery(status, USER_STATUSES, "User status");

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === parsedStatus) {
    return {
      user,

      changed: false,

      message: `User is already ${parsedStatus}`,
    };
  }

  user.status = parsedStatus;

  /*
   * status aur isActive sync rakho
   */
  if (parsedStatus === "active") {
    user.isActive = true;
  }

  if (parsedStatus === "inactive" || parsedStatus === "suspended") {
    user.isActive = false;
  }

  await user.save();

  return {
    user,

    changed: true,

    message: `User status updated to ${parsedStatus}`,
  };
}

/*
 * =====================================================
 * ACTIVATE USER
 * =====================================================
 */
export async function activateUser({ adminId, userId }) {
  return updateAdminUserStatus({
    adminId,
    userId,
    status: "active",
  });
}

/*
 * =====================================================
 * DEACTIVATE USER
 * =====================================================
 */
export async function deactivateUser({ adminId, userId }) {
  return updateAdminUserStatus({
    adminId,
    userId,
    status: "inactive",
  });
}

/*
 * =====================================================
 * SUSPEND USER
 * =====================================================
 */
export async function suspendUser({ adminId, userId }) {
  return updateAdminUserStatus({
    adminId,
    userId,
    status: "suspended",
  });
}

/*
 * =====================================================
 * UPDATE USER ROLE
 * =====================================================
 */
export async function updateAdminUserRole({ adminId, userId, role }) {
  validateObjectId(adminId, "admin ID");

  validateObjectId(userId, "user ID");

  if (String(adminId) === String(userId)) {
    throw new ApiError(400, "You cannot change your own role");
  }

  const parsedRole = parseEnumQuery(role, USER_ROLES, "User role");

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === parsedRole) {
    return {
      user,

      changed: false,

      message: `User already has role ${parsedRole}`,
    };
  }

  /*
   * Instructor → student
   * tab change na hone dena agar
   * instructor ke courses exist karte hain.
   */
  if (user.role === "instructor" && parsedRole === "student") {
    const instructorCourses = await Course.countDocuments({
      instructor: user._id,
    });

    if (instructorCourses > 0) {
      throw new ApiError(
        409,
        "Instructor role cannot be changed while courses are assigned",
      );
    }
  }

  user.role = parsedRole;

  await user.save();

  return {
    user,

    changed: true,

    message: `User role updated to ${parsedRole}`,
  };
}

/*
 * =====================================================
 * USER ANALYTICS
 * =====================================================
 */
export async function getAdminUserAnalytics() {
  const [
    totalUsers,
    students,
    instructors,
    admins,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    verifiedUsers,
    unverifiedUsers,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      role: "student",
    }),

    User.countDocuments({
      role: "instructor",
    }),

    User.countDocuments({
      role: "admin",
    }),

    User.countDocuments({
      status: "active",

      isActive: true,
    }),

    User.countDocuments({
      status: "inactive",
    }),

    User.countDocuments({
      status: "suspended",
    }),

    User.countDocuments({
      isEmailVerified: true,
    }),

    User.countDocuments({
      isEmailVerified: {
        $ne: true,
      },
    }),
  ]);

  const roleDistribution = await User.aggregate([
    {
      $group: {
        _id: "$role",

        count: {
          $sum: 1,
        },
      },
    },

    {
      $project: {
        _id: 0,

        role: "$_id",

        count: 1,
      },
    },
  ]);

  const statusDistribution = await User.aggregate([
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
  ]);

  return {
    overview: {
      totalUsers,
      students,
      instructors,
      admins,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      verifiedUsers,
      unverifiedUsers,
    },

    distributions: {
      roles: roleDistribution,

      statuses: statusDistribution,
    },
  };
}
