import mongoose from "mongoose";

import Assignment from "../models/assignment.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import { buildSearchFilter } from "../utils/search.js";
import AssignmentSubmission from "../models/assignmentSubmission.model.js";
import User from "../models/user.model.js";
import { escapeRegex } from "../utils/search.js";
import { dispatchNotification } from "./notification.service.js";
import { uploadAssignmentSubmissionFiles } from "./assignmentUpload.service.js";
import {
  parseBooleanQuery,
  parseEnumQuery,
  parseSortQuery,
  parseDateRange,
} from "../utils/queryParser.js";
import { validateObjectId } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_SUBMISSION_TYPES = ["text", "file", "link"];

const DEFAULT_ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
];

function parseDateValue(value, fieldName, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, `Invalid ${fieldName.toLowerCase()}`);
  }

  return parsedDate;
}

function parseSubmissionTypes(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(400, "At least one submission type is required");
  }

  const normalizedTypes = [
    ...new Set(
      value.map((type) =>
        String(type || "")
          .trim()
          .toLowerCase(),
      ),
    ),
  ].filter(Boolean);

  const invalidType = normalizedTypes.find(
    (type) => !ALLOWED_SUBMISSION_TYPES.includes(type),
  );

  if (invalidType) {
    throw new ApiError(400, `Invalid submission type: ${invalidType}`);
  }

  return normalizedTypes;
}

function parseAllowedFileTypes(value) {
  if (value === undefined) {
    return DEFAULT_ALLOWED_FILE_TYPES;
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, "Allowed file types must be an array");
  }

  return [
    ...new Set(value.map((type) => String(type || "").trim()).filter(Boolean)),
  ];
}

export async function createAssignment({ instructorId, payload }) {
  validateObjectId(instructorId, "instructor ID");

  const {
    courseId,
    moduleId = null,
    lectureId = null,

    title,
    description,
    instructions = "",

    attachmentUrl = null,
    attachmentFileId = null,
    attachmentName = null,
    attachmentMimeType = null,

    totalMarks = 100,
    passingMarks = 40,
    maxAttempts = 1,

    availableFrom = null,
    dueAt,

    allowLateSubmission = false,
    lateSubmissionUntil = null,

    allowedSubmissionTypes = ["file"],
    allowedFileTypes,
    maxFileSizeInBytes = 10 * 1024 * 1024,
  } = payload || {};

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  validateObjectId(courseId, "course ID");

  if (moduleId) {
    validateObjectId(moduleId, "module ID");
  }

  if (lectureId) {
    validateObjectId(lectureId, "lecture ID");
  }

  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle.length < 3) {
    throw new ApiError(400, "Assignment title must be at least 3 characters");
  }

  if (normalizedTitle.length > 150) {
    throw new ApiError(400, "Assignment title cannot exceed 150 characters");
  }

  const normalizedDescription = String(description || "").trim();

  if (normalizedDescription.length < 10) {
    throw new ApiError(
      400,
      "Assignment description must be at least 10 characters",
    );
  }

  if (normalizedDescription.length > 5000) {
    throw new ApiError(
      400,
      "Assignment description cannot exceed 5000 characters",
    );
  }

  const normalizedInstructions = String(instructions || "").trim();

  if (normalizedInstructions.length > 5000) {
    throw new ApiError(
      400,
      "Assignment instructions cannot exceed 5000 characters",
    );
  }

  const parsedTotalMarks =
    parseNumberQuery(totalMarks, {
      fieldName: "Total marks",
      min: 1,
      max: 1000,
    }) ?? 100;

  const parsedPassingMarks =
    parseNumberQuery(passingMarks, {
      fieldName: "Passing marks",
      min: 0,
      max: parsedTotalMarks,
    }) ?? 40;

  if (parsedPassingMarks > parsedTotalMarks) {
    throw new ApiError(400, "Passing marks cannot be greater than total marks");
  }

  const parsedMaxAttempts =
    parseNumberQuery(maxAttempts, {
      fieldName: "Maximum attempts",
      min: 1,
      max: 100,
      integer: true,
    }) ?? 1;

  const parsedMaxFileSize = parseNumberQuery(maxFileSizeInBytes, {
    fieldName: "Maximum file size in bytes",
    min: 1,
    max: 100 * 1024 * 1024,
    integer: true,
  });

  const parsedAvailableFrom = parseDateValue(
    availableFrom,
    "Available from date",
  );

  const parsedDueAt = parseDateValue(dueAt, "Due date", {
    required: true,
  });

  if (parsedAvailableFrom && parsedDueAt <= parsedAvailableFrom) {
    throw new ApiError(
      400,
      "Assignment due date must be after available from date",
    );
  }

  const parsedAllowLateSubmission =
    typeof allowLateSubmission === "boolean"
      ? allowLateSubmission
      : parseBooleanQuery(allowLateSubmission, "allowLateSubmission");

  const parsedLateSubmissionUntil = parseDateValue(
    lateSubmissionUntil,
    "Late submission deadline",
  );

  if (parsedAllowLateSubmission && !parsedLateSubmissionUntil) {
    throw new ApiError(
      400,
      "Late submission deadline is required when late submission is enabled",
    );
  }

  if (parsedLateSubmissionUntil && parsedLateSubmissionUntil <= parsedDueAt) {
    throw new ApiError(
      400,
      "Late submission deadline must be after assignment due date",
    );
  }

  const parsedSubmissionTypes = parseSubmissionTypes(allowedSubmissionTypes);

  const parsedAllowedFileTypes = parseAllowedFileTypes(allowedFileTypes);

  if (
    !parsedSubmissionTypes.includes("file") &&
    parsedAllowedFileTypes.length > 0
  ) {
    throw new ApiError(
      400,
      "Allowed file types can only be provided when file submission is enabled",
    );
  }

  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

  const course = await Course.findOne({
    _id: courseObjectId,
    instructor: instructorObjectId,
    isActive: true,
  })
    .select(
      `
      title
      instructor
      status
      isPublished
      isActive
    `,
    )
    .lean();

  if (!course) {
    throw new ApiError(
      404,
      "Course not found or you are not the course instructor",
    );
  }

  let selectedModule = null;

  if (moduleId) {
    selectedModule = await CourseModule.findOne({
      _id: moduleId,
      course: courseObjectId,
      isActive: true,
    })
      .select(
        `
          title
          course
          isPublished
          isActive
        `,
      )
      .lean();

    if (!selectedModule) {
      throw new ApiError(404, "Module not found in this course");
    }
  }

  let selectedLecture = null;

  if (lectureId) {
    selectedLecture = await Lecture.findOne({
      _id: lectureId,
      course: courseObjectId,
      isActive: true,
    })
      .select(
        `
          title
          course
          module
          isPublished
          isActive
        `,
      )
      .lean();

    if (!selectedLecture) {
      throw new ApiError(404, "Lecture not found in this course");
    }

    if (moduleId && selectedLecture.module?.toString() !== String(moduleId)) {
      throw new ApiError(400, "Lecture does not belong to the selected module");
    }
  }

  const finalModuleId = selectedModule?._id ?? selectedLecture?.module ?? null;

  const assignment = await Assignment.create({
    course: courseObjectId,

    module: finalModuleId,

    lecture: selectedLecture?._id ?? null,

    instructor: instructorObjectId,

    title: normalizedTitle,

    description: normalizedDescription,

    instructions: normalizedInstructions,

    attachmentUrl: attachmentUrl ? String(attachmentUrl).trim() : null,

    attachmentFileId: attachmentFileId ? String(attachmentFileId).trim() : null,

    attachmentName: attachmentName ? String(attachmentName).trim() : null,

    attachmentMimeType: attachmentMimeType
      ? String(attachmentMimeType).trim()
      : null,

    totalMarks: parsedTotalMarks,

    passingMarks: parsedPassingMarks,

    maxAttempts: parsedMaxAttempts,

    availableFrom: parsedAvailableFrom,

    dueAt: parsedDueAt,

    allowLateSubmission: parsedAllowLateSubmission ?? false,

    lateSubmissionUntil: parsedAllowLateSubmission
      ? parsedLateSubmissionUntil
      : null,

    allowedSubmissionTypes: parsedSubmissionTypes,

    allowedFileTypes: parsedSubmissionTypes.includes("file")
      ? parsedAllowedFileTypes
      : [],

    maxFileSizeInBytes: parsedMaxFileSize,

    status: "draft",
    isPublished: false,
    publishedAt: null,
    isActive: true,
  });

  return assignment;
}

export async function getInstructorAssignments({ instructorId, query = {} }) {
  validateObjectId(instructorId, "instructor ID");

  const {
    search,
    course,
    module,
    lecture,
    status,
    isPublished,
    isActive,
    from,
    to,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    instructor: instructorId,
  };

  const searchFilter = buildSearchFilter(search, [
    "title",
    "description",
    "instructions",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  if (course) {
    validateObjectId(course, "course ID");
    filter.course = course;
  }

  if (module) {
    validateObjectId(module, "module ID");
    filter.module = module;
  }

  if (lecture) {
    validateObjectId(lecture, "lecture ID");

    filter.lecture = lecture;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Assignment status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedIsPublished = parseBooleanQuery(isPublished, "isPublished");

  if (parsedIsPublished !== undefined) {
    filter.isPublished = parsedIsPublished;
  }

  const parsedIsActive = parseBooleanQuery(isActive, "isActive");

  if (parsedIsActive !== undefined) {
    filter.isActive = parsedIsActive;
  }

  const dueDateRange = parseDateRange({
    from,
    to,
    fieldName: "Assignment due date",
  });

  if (dueDateRange) {
    filter.dueAt = dueDateRange;
  }

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
      "dueAt",
      "availableFrom",
      "publishedAt",
      "totalMarks",
      "passingMarks",
      "maxAttempts",
    ],

    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [assignments, totalRecords] = await Promise.all([
    Assignment.find(filter)
      .select(
        `
          course
          module
          lecture
          instructor
          title
          description
          instructions
          attachmentUrl
          attachmentFileId
          attachmentName
          attachmentMimeType
          totalMarks
          passingMarks
          maxAttempts
          availableFrom
          dueAt
          allowLateSubmission
          lateSubmissionUntil
          allowedSubmissionTypes
          allowedFileTypes
          maxFileSizeInBytes
          status
          isPublished
          publishedAt
          isActive
          createdAt
          updatedAt
        `,
      )
      .populate({
        path: "course",
        select: `
            title
            slug
            thumbnailUrl
            status
            isPublished
            isActive
          `,
      })
      .populate({
        path: "module",
        select: `
            title
            order
            isPublished
            isActive
          `,
      })
      .populate({
        path: "lecture",
        select: `
            title
            type
            order
            isPublished
            isActive
          `,
      })
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Assignment.countDocuments(filter),
  ]);

  const now = new Date();

  const formattedAssignments = assignments.map((assignment) => {
    let availabilityStatus = "available";

    if (
      assignment.availableFrom &&
      new Date(assignment.availableFrom).getTime() > now.getTime()
    ) {
      availabilityStatus = "upcoming";
    }

    if (
      assignment.dueAt &&
      new Date(assignment.dueAt).getTime() <= now.getTime()
    ) {
      availabilityStatus =
        assignment.allowLateSubmission &&
        assignment.lateSubmissionUntil &&
        new Date(assignment.lateSubmissionUntil).getTime() > now.getTime()
          ? "late_submission"
          : "expired";
    }

    return {
      ...assignment,
      availabilityStatus,
    };
  });

  return {
    assignments: formattedAssignments,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,
      module: module || null,
      lecture: lecture || null,
      status: parsedStatus ?? null,

      isPublished: parsedIsPublished ?? null,

      isActive: parsedIsActive ?? null,

      from: from || null,
      to: to || null,

      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getInstructorAssignmentById({
  instructorId,
  assignmentId,
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(assignmentId, "assignment ID");

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  })
    .populate({
      path: "course",
      select: `
          title
          slug
          thumbnailUrl
          level
          status
          isPublished
          isActive
        `,
    })
    .populate({
      path: "module",
      select: `
          title
          order
          isPublished
        `,
    })
    .populate({
      path: "lecture",
      select: `
          title
          order
          type
          isPublished
        `,
    })
    .lean();

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  const [totalStudents, submissionStats, recentSubmissions] = await Promise.all(
    [
      Enrollment.countDocuments({
        course: assignment.course._id,
        status: {
          $in: ["active", "completed"],
        },
      }),

      AssignmentSubmission.aggregate([
        {
          $match: {
            assignment: new mongoose.Types.ObjectId(assignmentId),
          },
        },

        {
          $group: {
            _id: null,

            totalSubmissions: {
              $sum: 1,
            },

            submitted: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "submitted"],
                  },
                  1,
                  0,
                ],
              },
            },

            underReview: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "under_review"],
                  },
                  1,
                  0,
                ],
              },
            },

            graded: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "graded"],
                  },
                  1,
                  0,
                ],
              },
            },

            returned: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "returned"],
                  },
                  1,
                  0,
                ],
              },
            },

            passed: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$isPassed", true],
                  },
                  1,
                  0,
                ],
              },
            },

            failed: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$isPassed", false],
                  },
                  1,
                  0,
                ],
              },
            },

            lateSubmissions: {
              $sum: {
                $cond: ["$isLate", 1, 0],
              },
            },

            averageMarks: {
              $avg: "$marksAwarded",
            },

            highestMarks: {
              $max: "$marksAwarded",
            },

            lowestMarks: {
              $min: "$marksAwarded",
            },
          },
        },
      ]),

      AssignmentSubmission.find({
        assignment: assignmentId,
      })
        .populate({
          path: "student",
          select: `
          fullName
          email
          avatarUrl
        `,
        })
        .sort({
          submittedAt: -1,
        })
        .limit(10)
        .lean(),
    ],
  );

  const stats = submissionStats[0] ?? {
    totalSubmissions: 0,
    submitted: 0,
    underReview: 0,
    graded: 0,
    returned: 0,
    passed: 0,
    failed: 0,
    lateSubmissions: 0,
    averageMarks: 0,
    highestMarks: 0,
    lowestMarks: 0,
  };

  const pendingSubmissions = Math.max(
    totalStudents - stats.totalSubmissions,
    0,
  );

  const submissionRate =
    totalStudents > 0
      ? Number(((stats.totalSubmissions / totalStudents) * 100).toFixed(2))
      : 0;

  const passRate =
    stats.graded > 0
      ? Number(((stats.passed / stats.graded) * 100).toFixed(2))
      : 0;

  return {
    assignment,

    statistics: {
      totalStudents,

      totalSubmissions: stats.totalSubmissions,

      pendingSubmissions,

      submissionRate,

      submitted: stats.submitted,

      underReview: stats.underReview,

      graded: stats.graded,

      returned: stats.returned,

      passed: stats.passed,

      failed: stats.failed,

      passRate,

      lateSubmissions: stats.lateSubmissions,

      averageMarks: Number((stats.averageMarks ?? 0).toFixed(2)),

      highestMarks: stats.highestMarks,

      lowestMarks: stats.lowestMarks,
    },

    recentSubmissions,
  };
}

export async function updateAssignment({
  instructorId,
  assignmentId,
  payload,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(assignmentId, "assignment ID");

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  });

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  if (assignment.status === "archived") {
    throw new ApiError(400, "Archived assignment cannot be updated");
  }

  if (payload.courseId !== undefined || payload.course !== undefined) {
    throw new ApiError(400, "Assignment course cannot be changed");
  }

  const before = {
    module: assignment.module,
    lecture: assignment.lecture,
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions,
    totalMarks: assignment.totalMarks,
    passingMarks: assignment.passingMarks,
    maxAttempts: assignment.maxAttempts,
    availableFrom: assignment.availableFrom,
    dueAt: assignment.dueAt,
    allowLateSubmission: assignment.allowLateSubmission,
    lateSubmissionUntil: assignment.lateSubmissionUntil,
    allowedSubmissionTypes: assignment.allowedSubmissionTypes,
    allowedFileTypes: assignment.allowedFileTypes,
    maxFileSizeInBytes: assignment.maxFileSizeInBytes,
  };

  let selectedModuleId = assignment.module?.toString() ?? null;

  let selectedLectureId = assignment.lecture?.toString() ?? null;

  if (payload.moduleId !== undefined) {
    if (payload.moduleId === null || payload.moduleId === "") {
      selectedModuleId = null;
    } else {
      validateObjectId(payload.moduleId, "module ID");

      selectedModuleId = String(payload.moduleId);
    }
  }

  if (payload.lectureId !== undefined) {
    if (payload.lectureId === null || payload.lectureId === "") {
      selectedLectureId = null;
    } else {
      validateObjectId(payload.lectureId, "lecture ID");

      selectedLectureId = String(payload.lectureId);
    }
  }

  if (selectedModuleId) {
    const moduleExists = await CourseModule.exists({
      _id: selectedModuleId,
      course: assignment.course,
      isActive: true,
    });

    if (!moduleExists) {
      throw new ApiError(404, "Module not found in this assignment course");
    }
  }

  if (selectedLectureId) {
    const lecture = await Lecture.findOne({
      _id: selectedLectureId,
      course: assignment.course,
      isActive: true,
    })
      .select("module")
      .lean();

    if (!lecture) {
      throw new ApiError(404, "Lecture not found in this assignment course");
    }

    if (!selectedModuleId) {
      selectedModuleId = lecture.module?.toString() ?? null;
    }

    if (selectedModuleId && lecture.module?.toString() !== selectedModuleId) {
      throw new ApiError(400, "Lecture does not belong to the selected module");
    }
  }

  if (payload.title !== undefined) {
    const title = String(payload.title || "").trim();

    if (title.length < 3) {
      throw new ApiError(400, "Assignment title must be at least 3 characters");
    }

    if (title.length > 150) {
      throw new ApiError(400, "Assignment title cannot exceed 150 characters");
    }

    assignment.title = title;
  }

  if (payload.description !== undefined) {
    const description = String(payload.description || "").trim();

    if (description.length < 10) {
      throw new ApiError(
        400,
        "Assignment description must be at least 10 characters",
      );
    }

    if (description.length > 5000) {
      throw new ApiError(
        400,
        "Assignment description cannot exceed 5000 characters",
      );
    }

    assignment.description = description;
  }

  if (payload.instructions !== undefined) {
    const instructions = String(payload.instructions || "").trim();

    if (instructions.length > 5000) {
      throw new ApiError(
        400,
        "Assignment instructions cannot exceed 5000 characters",
      );
    }

    assignment.instructions = instructions;
  }

  if (payload.totalMarks !== undefined) {
    assignment.totalMarks = parseNumberQuery(payload.totalMarks, {
      fieldName: "Total marks",
      min: 1,
      max: 1000,
    });
  }

  if (payload.passingMarks !== undefined) {
    assignment.passingMarks = parseNumberQuery(payload.passingMarks, {
      fieldName: "Passing marks",
      min: 0,
      max: assignment.totalMarks,
    });
  }

  if (assignment.passingMarks > assignment.totalMarks) {
    throw new ApiError(400, "Passing marks cannot be greater than total marks");
  }

  if (payload.maxAttempts !== undefined) {
    assignment.maxAttempts = parseNumberQuery(payload.maxAttempts, {
      fieldName: "Maximum attempts",
      min: 1,
      max: 100,
      integer: true,
    });
  }

  if (payload.availableFrom !== undefined) {
    assignment.availableFrom =
      payload.availableFrom === null || payload.availableFrom === ""
        ? null
        : parseDateValue(payload.availableFrom, "Available from date");
  }

  if (payload.dueAt !== undefined) {
    assignment.dueAt = parseDateValue(payload.dueAt, "Due date", {
      required: true,
    });
  }

  if (
    assignment.availableFrom &&
    assignment.dueAt <= assignment.availableFrom
  ) {
    throw new ApiError(
      400,
      "Assignment due date must be after available from date",
    );
  }

  if (payload.allowLateSubmission !== undefined) {
    assignment.allowLateSubmission =
      typeof payload.allowLateSubmission === "boolean"
        ? payload.allowLateSubmission
        : parseBooleanQuery(payload.allowLateSubmission, "allowLateSubmission");
  }

  if (payload.lateSubmissionUntil !== undefined) {
    assignment.lateSubmissionUntil =
      payload.lateSubmissionUntil === null || payload.lateSubmissionUntil === ""
        ? null
        : parseDateValue(
            payload.lateSubmissionUntil,
            "Late submission deadline",
          );
  }

  if (assignment.allowLateSubmission && !assignment.lateSubmissionUntil) {
    throw new ApiError(
      400,
      "Late submission deadline is required when late submission is enabled",
    );
  }

  if (
    assignment.lateSubmissionUntil &&
    assignment.lateSubmissionUntil <= assignment.dueAt
  ) {
    throw new ApiError(
      400,
      "Late submission deadline must be after assignment due date",
    );
  }

  if (!assignment.allowLateSubmission) {
    assignment.lateSubmissionUntil = null;
  }

  if (payload.allowedSubmissionTypes !== undefined) {
    assignment.allowedSubmissionTypes = parseSubmissionTypes(
      payload.allowedSubmissionTypes,
    );
  }

  if (payload.allowedFileTypes !== undefined) {
    assignment.allowedFileTypes = parseAllowedFileTypes(
      payload.allowedFileTypes,
    );
  }

  if (!assignment.allowedSubmissionTypes.includes("file")) {
    assignment.allowedFileTypes = [];
  }

  if (payload.maxFileSizeInBytes !== undefined) {
    assignment.maxFileSizeInBytes = parseNumberQuery(
      payload.maxFileSizeInBytes,
      {
        fieldName: "Maximum file size in bytes",
        min: 1,
        max: 100 * 1024 * 1024,
        integer: true,
      },
    );
  }

  assignment.module = selectedModuleId;
  assignment.lecture = selectedLectureId;

  await assignment.save();

  const after = {
    module: assignment.module,
    lecture: assignment.lecture,
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions,
    totalMarks: assignment.totalMarks,
    passingMarks: assignment.passingMarks,
    maxAttempts: assignment.maxAttempts,
    availableFrom: assignment.availableFrom,
    dueAt: assignment.dueAt,
    allowLateSubmission: assignment.allowLateSubmission,
    lateSubmissionUntil: assignment.lateSubmissionUntil,
    allowedSubmissionTypes: assignment.allowedSubmissionTypes,
    allowedFileTypes: assignment.allowedFileTypes,
    maxFileSizeInBytes: assignment.maxFileSizeInBytes,
  };

  const changed = JSON.stringify(before) !== JSON.stringify(after);

  return {
    assignment,
    before,
    after,
    changed,
    message: changed
      ? "Assignment updated successfully"
      : "No assignment changes were detected",
  };
}

export async function updateAssignmentStatus({
  instructorId,
  assignmentId,
  status,
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(assignmentId, "assignment ID");

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Assignment status",
  );

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  });

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const before = {
    status: assignment.status,
    isPublished: assignment.isPublished,
    publishedAt: assignment.publishedAt,
    isActive: assignment.isActive,
  };

  if (assignment.status === parsedStatus) {
    return {
      assignment,
      before,
      after: before,
      changed: false,
      message: `Assignment is already ${parsedStatus}`,
    };
  }

  const allowedTransitions = {
    draft: ["published", "archived"],
    published: ["draft", "archived"],
    archived: ["draft"],
  };

  const allowedNextStatuses = allowedTransitions[assignment.status] ?? [];

  if (!allowedNextStatuses.includes(parsedStatus)) {
    throw new ApiError(
      400,
      `Assignment status cannot change from ${assignment.status} to ${parsedStatus}`,
    );
  }

  if (parsedStatus === "published") {
    /*
     * Course published hona required hai.
     */
    const course = await Course.findOne({
      _id: assignment.course,
      instructor: instructorId,
      status: "published",
      isPublished: true,
      isActive: true,
    })
      .select("_id title")
      .lean();

    if (!course) {
      throw new ApiError(
        400,
        "Course must be published and active before publishing the assignment",
      );
    }

    /*
     * Module attached hai to wo bhi valid/published ho.
     */
    if (assignment.module) {
      const moduleExists = await CourseModule.exists({
        _id: assignment.module,
        course: assignment.course,
        isPublished: true,
        isActive: true,
      });

      if (!moduleExists) {
        throw new ApiError(
          400,
          "Selected module must be published and active before publishing the assignment",
        );
      }
    }

    /*
     * Lecture attached hai to wo bhi valid/published ho.
     */
    if (assignment.lecture) {
      const lectureExists = await Lecture.exists({
        _id: assignment.lecture,
        course: assignment.course,
        isPublished: true,
        isActive: true,
      });

      if (!lectureExists) {
        throw new ApiError(
          400,
          "Selected lecture must be published and active before publishing the assignment",
        );
      }
    }

    if (!assignment.title?.trim()) {
      throw new ApiError(400, "Assignment title is required before publishing");
    }

    if (!assignment.description?.trim()) {
      throw new ApiError(
        400,
        "Assignment description is required before publishing",
      );
    }

    if (!assignment.dueAt) {
      throw new ApiError(
        400,
        "Assignment due date is required before publishing",
      );
    }

    if (
      assignment.availableFrom &&
      assignment.dueAt <= assignment.availableFrom
    ) {
      throw new ApiError(
        400,
        "Assignment due date must be after available from date",
      );
    }

    if (assignment.passingMarks > assignment.totalMarks) {
      throw new ApiError(
        400,
        "Passing marks cannot be greater than total marks",
      );
    }

    if (
      !Array.isArray(assignment.allowedSubmissionTypes) ||
      assignment.allowedSubmissionTypes.length === 0
    ) {
      throw new ApiError(
        400,
        "At least one submission type is required before publishing",
      );
    }

    if (assignment.allowLateSubmission && !assignment.lateSubmissionUntil) {
      throw new ApiError(
        400,
        "Late submission deadline is required before publishing",
      );
    }

    assignment.status = "published";
    assignment.isPublished = true;
    assignment.isActive = true;

    assignment.publishedAt = assignment.publishedAt ?? new Date();
  }

  if (parsedStatus === "draft") {
    assignment.status = "draft";
    assignment.isPublished = false;
    assignment.isActive = true;
    assignment.publishedAt = null;
  }

  if (parsedStatus === "archived") {
    assignment.status = "archived";
    assignment.isPublished = false;
    assignment.isActive = false;
    assignment.publishedAt = null;
  }

  await assignment.save();

  const after = {
    status: assignment.status,
    isPublished: assignment.isPublished,
    publishedAt: assignment.publishedAt,
    isActive: assignment.isActive,
  };

  return {
    assignment,
    before,
    after,
    changed: true,
    message: `Assignment status updated to ${parsedStatus}`,
  };
}

export async function deleteAssignment({ instructorId, assignmentId }) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(assignmentId, "assignment ID");

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  });

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const before = {
    status: assignment.status,
    isPublished: assignment.isPublished,
    isActive: assignment.isActive,
    publishedAt: assignment.publishedAt,
  };

  if (assignment.status === "archived" && assignment.isActive === false) {
    return {
      assignment,
      before,
      after: before,
      changed: false,
      message: "Assignment is already archived",
    };
  }

  /*
   * Existing submissions delete nahi honge.
   * Assignment sirf student side se unavailable hoga.
   */
  assignment.status = "archived";
  assignment.isPublished = false;
  assignment.isActive = false;
  assignment.publishedAt = null;

  await assignment.save();

  const after = {
    status: assignment.status,
    isPublished: assignment.isPublished,
    isActive: assignment.isActive,
    publishedAt: assignment.publishedAt,
  };

  return {
    assignment,
    before,
    after,
    changed: true,
    message: "Assignment archived successfully",
  };
}

export async function restoreAssignment({ instructorId, assignmentId }) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(assignmentId, "assignment ID");

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  });

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const before = {
    status: assignment.status,
    isPublished: assignment.isPublished,
    isActive: assignment.isActive,
    publishedAt: assignment.publishedAt,
  };

  if (assignment.status === "draft" && assignment.isActive === true) {
    return {
      assignment,
      before,
      after: before,
      changed: false,
      message: "Assignment is already active",
    };
  }

  if (assignment.status !== "archived") {
    throw new ApiError(400, "Only archived assignments can be restored");
  }

  /*
   * Restore ke baad direct publish nahi karenge.
   * Instructor review karke manually publish karega.
   */
  assignment.status = "draft";
  assignment.isPublished = false;
  assignment.isActive = true;
  assignment.publishedAt = null;

  await assignment.save();

  const after = {
    status: assignment.status,
    isPublished: assignment.isPublished,
    isActive: assignment.isActive,
    publishedAt: assignment.publishedAt,
  };

  return {
    assignment,
    before,
    after,
    changed: true,
    message: "Assignment restored successfully",
  };
}

export async function getStudentAssignments({ studentId, query = {} }) {
  validateObjectId(studentId, "student ID");

  const {
    search,
    course,
    availability = "available",
    sortBy = "dueAt",
    order = "asc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const enrollments = await Enrollment.find({
    student: studentId,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("course expiresAt")
    .lean();

  const validEnrollments = enrollments.filter((enrollment) => {
    if (!enrollment.expiresAt) {
      return true;
    }

    return new Date(enrollment.expiresAt).getTime() > Date.now();
  });

  const enrolledCourseIds = validEnrollments.map(
    (enrollment) => enrollment.course,
  );

  if (enrolledCourseIds.length === 0) {
    return {
      assignments: [],

      pagination: buildPaginationMeta({
        page,
        limit,
        totalRecords: 0,
      }),

      filters: {
        search: search?.trim() || null,
        course: course || null,
        availability,
        sortBy: "dueAt",
        order: "asc",
      },
    };
  }

  const filter = {
    course: {
      $in: enrolledCourseIds,
    },

    status: "published",
    isPublished: true,
    isActive: true,
  };

  if (course) {
    validateObjectId(course, "course ID");

    const isEnrolled = enrolledCourseIds.some(
      (courseId) => courseId.toString() === String(course),
    );

    if (!isEnrolled) {
      throw new ApiError(403, "You are not enrolled in this course");
    }

    filter.course = course;
  }

  const searchFilter = buildSearchFilter(search, [
    "title",
    "description",
    "instructions",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  const parsedAvailability =
    parseEnumQuery(
      availability,
      ["available", "upcoming", "late_submission", "expired", "all"],
      "Assignment availability",
    ) ?? "available";

  const now = new Date();

  if (parsedAvailability === "available") {
    filter.$and = [
      {
        $or: [
          {
            availableFrom: null,
          },
          {
            availableFrom: {
              $lte: now,
            },
          },
        ],
      },

      {
        dueAt: {
          $gt: now,
        },
      },
    ];
  }

  if (parsedAvailability === "upcoming") {
    filter.availableFrom = {
      $gt: now,
    };
  }

  if (parsedAvailability === "late_submission") {
    filter.dueAt = {
      $lte: now,
    };

    filter.allowLateSubmission = true;

    filter.lateSubmissionUntil = {
      $gt: now,
    };
  }

  if (parsedAvailability === "expired") {
    filter.$or = [
      {
        allowLateSubmission: false,
        dueAt: {
          $lte: now,
        },
      },

      {
        allowLateSubmission: true,
        lateSubmissionUntil: {
          $ne: null,
          $lte: now,
        },
      },
    ];
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: [
      "createdAt",
      "publishedAt",
      "availableFrom",
      "dueAt",
      "lateSubmissionUntil",
      "title",
      "totalMarks",
    ],

    defaultField: "dueAt",
    defaultOrder: "asc",
  });

  const [assignments, totalRecords] = await Promise.all([
    Assignment.find(filter)
      .select(
        `
          course
          module
          lecture
          title
          description
          instructions
          attachmentUrl
          attachmentName
          attachmentMimeType
          totalMarks
          passingMarks
          maxAttempts
          availableFrom
          dueAt
          allowLateSubmission
          lateSubmissionUntil
          allowedSubmissionTypes
          allowedFileTypes
          maxFileSizeInBytes
          publishedAt
          createdAt
        `,
      )
      .populate({
        path: "course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "module",
        select: "title order",
      })
      .populate({
        path: "lecture",
        select: "title type order",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Assignment.countDocuments(filter),
  ]);

  const assignmentIds = assignments.map((assignment) => assignment._id);

  const submissionStats =
    assignmentIds.length > 0
      ? await AssignmentSubmission.aggregate([
          {
            $match: {
              student: new mongoose.Types.ObjectId(studentId),

              assignment: {
                $in: assignmentIds,
              },
            },
          },
          {
            $group: {
              _id: "$assignment",

              attemptsUsed: {
                $sum: 1,
              },

              latestSubmissionId: {
                $last: "$_id",
              },

              latestStatus: {
                $last: "$status",
              },

              bestPercentage: {
                $max: "$percentage",
              },

              passed: {
                $max: {
                  $cond: [
                    {
                      $eq: ["$isPassed", true],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
      : [];

  const submissionMap = new Map(
    submissionStats.map((item) => [item._id.toString(), item]),
  );

  const formattedAssignments = assignments.map((assignment) => {
    const stats = submissionMap.get(assignment._id.toString());

    let availabilityStatus = "available";

    if (
      assignment.availableFrom &&
      new Date(assignment.availableFrom).getTime() > now.getTime()
    ) {
      availabilityStatus = "upcoming";
    } else if (new Date(assignment.dueAt).getTime() <= now.getTime()) {
      if (
        assignment.allowLateSubmission &&
        assignment.lateSubmissionUntil &&
        new Date(assignment.lateSubmissionUntil).getTime() > now.getTime()
      ) {
        availabilityStatus = "late_submission";
      } else {
        availabilityStatus = "expired";
      }
    }

    const attemptsUsed = stats?.attemptsUsed ?? 0;

    const attemptsRemaining = Math.max(
      assignment.maxAttempts - attemptsUsed,
      0,
    );

    return {
      ...assignment,

      availabilityStatus,

      submissionSummary: {
        attemptsUsed,
        attemptsRemaining,

        latestSubmissionId: stats?.latestSubmissionId ?? null,

        latestStatus: stats?.latestStatus ?? null,

        bestPercentage: Number((stats?.bestPercentage ?? 0).toFixed(2)),

        isPassed: stats?.passed === 1,

        canSubmit:
          ["available", "late_submission"].includes(availabilityStatus) &&
          attemptsRemaining > 0,
      },
    };
  });

  return {
    assignments: formattedAssignments,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,

      availability: parsedAvailability,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

export async function getStudentAssignmentById({ studentId, assignmentId }) {
  validateObjectId(studentId, "student ID");
  validateObjectId(assignmentId, "assignment ID");

  const now = new Date();

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    status: "published",
    isPublished: true,
    isActive: true,
  })
    .populate({
      path: "course",
      select: `
          title
          slug
          thumbnailUrl
          instructor
        `,
      populate: {
        path: "instructor",
        select: "fullName avatarUrl",
      },
    })
    .populate({
      path: "module",
      select: "title order",
    })
    .populate({
      path: "lecture",
      select: "title type order",
    })
    .lean();

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: assignment.course._id,

    status: {
      $in: ["active", "completed"],
    },
  })
    .select(
      `
        status
        progressPercentage
        enrolledAt
        expiresAt
      `,
    )
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(403, "Your course enrollment has expired");
  }

  let availabilityStatus = "available";

  if (
    assignment.availableFrom &&
    new Date(assignment.availableFrom).getTime() > now.getTime()
  ) {
    availabilityStatus = "upcoming";
  } else if (new Date(assignment.dueAt).getTime() <= now.getTime()) {
    if (
      assignment.allowLateSubmission &&
      assignment.lateSubmissionUntil &&
      new Date(assignment.lateSubmissionUntil).getTime() > now.getTime()
    ) {
      availabilityStatus = "late_submission";
    } else {
      availabilityStatus = "expired";
    }
  }

  const submissions = await AssignmentSubmission.find({
    assignment: assignmentId,
    student: studentId,
  })
    .select(
      `
        attemptNumber
        textAnswer
        linkAnswer
        files
        status
        isLate
        submittedAt
        reviewedAt
        gradedAt
        marksAwarded
        totalMarks
        percentage
        isPassed
        feedback
        returnedAt
        returnReason
        createdAt
        updatedAt
      `,
    )
    .sort({
      attemptNumber: -1,
    })
    .lean();

  const attemptsUsed = submissions.length;

  const attemptsRemaining = Math.max(assignment.maxAttempts - attemptsUsed, 0);

  const latestSubmission = submissions[0] ?? null;

  const bestGradedSubmission =
    submissions
      .filter(
        (submission) =>
          submission.status === "graded" && submission.percentage !== null,
      )
      .sort((first, second) => second.percentage - first.percentage)[0] ?? null;

  return {
    assignment: {
      ...assignment,
      availabilityStatus,
    },

    enrollment,

    submissionSummary: {
      attemptsUsed,
      maxAttempts: assignment.maxAttempts,
      attemptsRemaining,

      latestSubmission,

      bestSubmission: bestGradedSubmission,

      hasPassed: submissions.some((submission) => submission.isPassed === true),

      canSubmit:
        ["available", "late_submission"].includes(availabilityStatus) &&
        attemptsRemaining > 0,
    },

    submissions,
  };
}

function normalizeSubmissionLink(value) {
  const link = String(value || "").trim();

  if (!link) {
    return "";
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(link);
  } catch {
    throw new ApiError(400, "Invalid submission link");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new ApiError(400, "Submission link must use HTTP or HTTPS");
  }

  return parsedUrl.toString();
}
export async function createAssignmentSubmission({
  studentId,
  assignmentId,
  payload,
  files = [],
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(assignmentId, "assignment ID");

  const { textAnswer = "", linkAnswer = "" } = payload || {};

  const now = new Date();

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    status: "published",
    isPublished: true,
    isActive: true,
  }).lean();

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: assignment.course,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select(
      `
        student
        course
        status
        expiresAt
      `,
    )
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(403, "Your course enrollment has expired");
  }

  if (
    assignment.availableFrom &&
    new Date(assignment.availableFrom).getTime() > now.getTime()
  ) {
    throw new ApiError(400, "Assignment is not available yet");
  }

  /*
   * Deadline validation
   */
  const dueAt = new Date(assignment.dueAt);

  const isAfterDueDate = now.getTime() > dueAt.getTime();

  let isLate = false;

  if (isAfterDueDate) {
    if (!assignment.allowLateSubmission) {
      throw new ApiError(400, "Assignment submission deadline has passed");
    }

    if (!assignment.lateSubmissionUntil) {
      throw new ApiError(400, "Late submission deadline is not configured");
    }

    const lateSubmissionUntil = new Date(assignment.lateSubmissionUntil);

    if (now.getTime() > lateSubmissionUntil.getTime()) {
      throw new ApiError(400, "Late submission deadline has passed");
    }

    isLate = true;
  }

  /*
   * Student ke previous submissions.
   */
  const previousSubmissions = await AssignmentSubmission.find({
    assignment: assignmentId,
    student: studentId,
    status: {
      $ne: "cancelled",
    },
  })
    .select(
      `
        attemptNumber
        status
        submittedAt
        returnedAt
        returnReason
      `,
    )
    .sort({
      attemptNumber: 1,
    })
    .lean();

  const attemptsUsed = previousSubmissions.length;

  if (attemptsUsed >= assignment.maxAttempts) {
    throw new ApiError(403, "Maximum assignment submission attempts reached");
  }

  const latestSubmission =
    previousSubmissions.length > 0
      ? previousSubmissions[previousSubmissions.length - 1]
      : null;

  /*
   * First attempt allowed directly hai.
   *
   * Next attempts tabhi allowed honge jab previous
   * submission instructor ne returned ki ho.
   */
  if (latestSubmission && latestSubmission.status !== "returned") {
    throw new ApiError(
      409,
      `Previous submission is ${latestSubmission.status}. New attempt is allowed only after the previous submission is returned`,
    );
  }

  const attemptNumber = attemptsUsed + 1;

  const normalizedTextAnswer = String(textAnswer || "").trim();

  if (normalizedTextAnswer.length > 10000) {
    throw new ApiError(400, "Text answer cannot exceed 10000 characters");
  }

  const normalizedLinkAnswer = normalizeSubmissionLink(linkAnswer);

  const submissionTypes = assignment.allowedSubmissionTypes ?? [];

  if (normalizedTextAnswer && !submissionTypes.includes("text")) {
    throw new ApiError(
      400,
      "Text submission is not allowed for this assignment",
    );
  }

  if (normalizedLinkAnswer && !submissionTypes.includes("link")) {
    throw new ApiError(
      400,
      "Link submission is not allowed for this assignment",
    );
  }

  if (files.length > 0 && !submissionTypes.includes("file")) {
    throw new ApiError(
      400,
      "File submission is not allowed for this assignment",
    );
  }

  if (files.length > 5) {
    throw new ApiError(400, "Maximum 5 files are allowed per submission");
  }

  if (files.length > 0) {
    const allowedFileTypes = assignment.allowedFileTypes ?? [];

    for (const file of files) {
      if (
        allowedFileTypes.length > 0 &&
        !allowedFileTypes.includes(file.mimetype)
      ) {
        throw new ApiError(400, `File type ${file.mimetype} is not allowed`);
      }

      if (file.size > assignment.maxFileSizeInBytes) {
        throw new ApiError(
          400,
          `${file.originalname} exceeds the maximum allowed file size`,
        );
      }
    }
  }

  if (!normalizedTextAnswer && !normalizedLinkAnswer && files.length === 0) {
    throw new ApiError(
      400,
      "Submission requires text, link, or at least one file",
    );
  }

  /*
   * Files upload.
   */
  const uploadedFiles = await uploadAssignmentSubmissionFiles({
    files,

    assignmentId: assignment._id.toString(),

    studentId: studentId.toString(),

    attemptNumber,
  });

  try {
    const submission = await AssignmentSubmission.create({
      assignment: assignment._id,
      student: studentId,
      course: assignment.course,
      enrollment: enrollment._id,

      attemptNumber,

      textAnswer: normalizedTextAnswer,

      linkAnswer: normalizedLinkAnswer,

      files: uploadedFiles,

      status: "submitted",

      isLate,

      submittedAt: now,

      totalMarks: assignment.totalMarks,

      marksAwarded: null,
      percentage: null,
      isPassed: null,

      feedback: "",

      reviewedAt: null,
      reviewedBy: null,
      gradedAt: null,

      returnedAt: null,
      returnReason: "",
    });

    return {
      submission,

      isResubmission: attemptNumber > 1,

      previousSubmission: latestSubmission,

      attemptSummary: {
        attemptNumber,

        attemptsUsed: attemptsUsed + 1,

        maxAttempts: assignment.maxAttempts,

        attemptsRemaining: Math.max(
          assignment.maxAttempts - (attemptsUsed + 1),
          0,
        ),
      },

      message:
        attemptNumber > 1
          ? "Assignment resubmitted successfully"
          : isLate
            ? "Assignment submitted successfully as a late submission"
            : "Assignment submitted successfully",
    };
  } catch (error) {
    /*
     * Concurrent submissions ke case me
     * unique attempt index protect karega.
     */
    if (error?.code === 11000) {
      throw new ApiError(
        409,
        "Another assignment submission attempt was created. Please refresh and try again",
      );
    }

    throw error;
  }
}

export async function getInstructorAssignmentSubmissions({
  instructorId,
  assignmentId,
  query = {},
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(assignmentId, "assignment ID");

  const {
    search,
    status,
    isLate,
    result,
    sortBy = "submittedAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  })
    .select(
      `
      title
      course
      totalMarks
      passingMarks
      maxAttempts
      dueAt
      status
      isPublished
      isActive
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const filter = {
    assignment: assignmentId,
  };

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "submitted", "under_review", "graded", "returned", "cancelled"],
    "Submission status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedIsLate = parseBooleanQuery(isLate, "isLate");

  if (parsedIsLate !== undefined) {
    filter.isLate = parsedIsLate;
  }

  const parsedResult = parseEnumQuery(
    result,
    ["passed", "failed"],
    "Submission result",
  );

  if (parsedResult === "passed") {
    filter.status = "graded";
    filter.isPassed = true;
  }

  if (parsedResult === "failed") {
    filter.status = "graded";
    filter.isPassed = false;
  }

  /*
   * Student name/email search.
   */
  if (search?.trim()) {
    const searchText = search.trim();
    const escapedSearchText = escapeRegex(searchText);

    const students = await User.find({
      role: "student",
      $or: [
        {
          fullName: {
            $regex: escapedSearchText,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearchText,
            $options: "i",
          },
        },
      ],
    })
      .select("_id")
      .lean();

    filter.student = {
      $in: students.map((student) => student._id),
    };
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "attemptNumber",
      "submittedAt",
      "reviewedAt",
      "gradedAt",
      "marksAwarded",
      "percentage",
      "createdAt",
      "updatedAt",
    ],
    defaultField: "submittedAt",
    defaultOrder: "desc",
  });

  const [submissions, totalRecords, summaryResult] = await Promise.all([
    AssignmentSubmission.find(filter)
      .select(
        `
          assignment
          student
          enrollment
          attemptNumber
          textAnswer
          linkAnswer
          files
          status
          isLate
          submittedAt
          reviewedAt
          gradedAt
          reviewedBy
          marksAwarded
          totalMarks
          percentage
          isPassed
          feedback
          returnedAt
          returnReason
          createdAt
          updatedAt
        `,
      )
      .populate({
        path: "student",
        select: `
            fullName
            email
            avatarUrl
            status
            isActive
          `,
      })
      .populate({
        path: "reviewedBy",
        select: "fullName email avatarUrl role",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    AssignmentSubmission.countDocuments(filter),

    AssignmentSubmission.aggregate([
      {
        $match: {
          assignment: new mongoose.Types.ObjectId(assignmentId),
        },
      },
      {
        $group: {
          _id: null,

          totalSubmissions: {
            $sum: 1,
          },

          uniqueStudents: {
            $addToSet: "$student",
          },

          submitted: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "submitted"],
                },
                1,
                0,
              ],
            },
          },

          underReview: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "under_review"],
                },
                1,
                0,
              ],
            },
          },

          graded: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                1,
                0,
              ],
            },
          },

          returned: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "returned"],
                },
                1,
                0,
              ],
            },
          },

          lateSubmissions: {
            $sum: {
              $cond: ["$isLate", 1, 0],
            },
          },

          passed: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isPassed", true],
                },
                1,
                0,
              ],
            },
          },

          failed: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isPassed", false],
                },
                1,
                0,
              ],
            },
          },

          averageMarks: {
            $avg: "$marksAwarded",
          },

          averagePercentage: {
            $avg: "$percentage",
          },
        },
      },
      {
        $addFields: {
          uniqueStudentCount: {
            $size: "$uniqueStudents",
          },
        },
      },
    ]),
  ]);

  const summary = summaryResult[0] ?? {
    totalSubmissions: 0,
    uniqueStudentCount: 0,
    submitted: 0,
    underReview: 0,
    graded: 0,
    returned: 0,
    lateSubmissions: 0,
    passed: 0,
    failed: 0,
    averageMarks: 0,
    averagePercentage: 0,
  };

  return {
    assignment,

    summary: {
      totalSubmissions: summary.totalSubmissions ?? 0,

      uniqueStudents: summary.uniqueStudentCount ?? 0,

      submitted: summary.submitted ?? 0,

      underReview: summary.underReview ?? 0,

      graded: summary.graded ?? 0,

      returned: summary.returned ?? 0,

      lateSubmissions: summary.lateSubmissions ?? 0,

      passed: summary.passed ?? 0,

      failed: summary.failed ?? 0,

      averageMarks: Number((summary.averageMarks ?? 0).toFixed(2)),

      averagePercentage: Number((summary.averagePercentage ?? 0).toFixed(2)),
    },

    submissions,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      status: parsedStatus ?? null,
      isLate: parsedIsLate ?? null,
      result: parsedResult ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getInstructorAssignmentSubmissionById({
  instructorId,
  assignmentId,
  submissionId,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(assignmentId, "assignment ID");
  validateObjectId(submissionId, "submission ID");

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  })
    .select(
      `
      title
      course
      totalMarks
      passingMarks
      dueAt
      allowLateSubmission
      lateSubmissionUntil
      maxAttempts
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    assignment: assignmentId,
  })
    .select(
      `
        +privateNote
        assignment
        student
        course
        enrollment
        attemptNumber
        textAnswer
        linkAnswer
        files
        status
        isLate
        submittedAt
        reviewedAt
        gradedAt
        reviewedBy
        marksAwarded
        totalMarks
        percentage
        isPassed
        feedback
        privateNote
        returnedAt
        returnReason
        createdAt
        updatedAt
      `,
    )
    .populate({
      path: "student",
      select: `
          fullName
          email
          avatarUrl
          status
          isActive
          lastLoginAt
        `,
    })
    .populate({
      path: "enrollment",
      select: `
          status
          progressPercentage
          enrolledAt
          completedAt
        `,
    })
    .populate({
      path: "reviewedBy",
      select: "fullName email avatarUrl role",
    })
    .lean();

  if (!submission) {
    throw new ApiError(404, "Assignment submission not found");
  }

  /*
   * Same student ke previous attempts.
   */
  const previousAttempts = await AssignmentSubmission.find({
    assignment: assignmentId,
    student: submission.student._id,

    _id: {
      $ne: submission._id,
    },
  })
    .select(
      `
        attemptNumber
        status
        isLate
        submittedAt
        marksAwarded
        totalMarks
        percentage
        isPassed
        feedback
        returnedAt
        returnReason
      `,
    )
    .sort({
      attemptNumber: -1,
    })
    .lean();

  return {
    assignment,

    submission,

    previousAttempts,

    grading: {
      canGrade: ["submitted", "under_review", "returned"].includes(
        submission.status,
      ),

      alreadyGraded: submission.status === "graded",

      maxMarks: assignment.totalMarks,

      passingMarks: assignment.passingMarks,
    },
  };
}

export async function gradeAssignmentSubmission({
  instructorId,
  assignmentId,
  submissionId,
  payload,
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(assignmentId, "assignment ID");

  validateObjectId(submissionId, "submission ID");

  const { marksAwarded, feedback = "", privateNote = "" } = payload || {};

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  })
    .select(
      `
        title
        totalMarks
        passingMarks
        status
        isActive
      `,
    )
    .lean();

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    assignment: assignmentId,
  }).select("+privateNote");

  if (!submission) {
    throw new ApiError(404, "Assignment submission not found");
  }

  if (submission.status === "cancelled") {
    throw new ApiError(409, "Cancelled submission cannot be graded");
  }

  if (submission.status === "draft") {
    throw new ApiError(409, "Draft submission cannot be graded");
  }

  const parsedMarks = parseNumberQuery(marksAwarded, {
    fieldName: "Marks awarded",
    min: 0,
    max: assignment.totalMarks,
  });

  const normalizedFeedback = String(feedback || "").trim();

  const normalizedPrivateNote = String(privateNote || "").trim();

  if (normalizedFeedback.length > 5000) {
    throw new ApiError(400, "Feedback cannot exceed 5000 characters");
  }

  if (normalizedPrivateNote.length > 5000) {
    throw new ApiError(400, "Private note cannot exceed 5000 characters");
  }

  const percentage =
    assignment.totalMarks > 0
      ? Number(((parsedMarks / assignment.totalMarks) * 100).toFixed(2))
      : 0;

  const isPassed = parsedMarks >= assignment.passingMarks;

  const before = {
    status: submission.status,

    marksAwarded: submission.marksAwarded,

    totalMarks: submission.totalMarks,

    percentage: submission.percentage,

    isPassed: submission.isPassed,

    feedback: submission.feedback,

    privateNote: submission.privateNote,

    reviewedAt: submission.reviewedAt,

    reviewedBy: submission.reviewedBy,

    gradedAt: submission.gradedAt,
  };

  const now = new Date();

  submission.status = "graded";

  submission.marksAwarded = parsedMarks;

  /*
   * Assignment marks snapshot sync rakhenge.
   */
  submission.totalMarks = assignment.totalMarks;

  submission.percentage = percentage;

  submission.isPassed = isPassed;

  submission.feedback = normalizedFeedback;

  submission.privateNote = normalizedPrivateNote;

  submission.reviewedAt = now;
  submission.reviewedBy = instructorId;

  submission.gradedAt = now;

  /*
   * Agar pehle returned tha to returned state clear.
   */
  submission.returnedAt = null;
  submission.returnReason = "";

  await submission.save();

  try {
    await dispatchNotification({
      userId: submission.student,

      title: "Assignment graded",

      message: `Your assignment "${assignment.title}" has been graded.`,

      type: "assignment_graded",

      resourceType: "submission",

      resourceId: submission._id,

      courseId: submission.course,

      actionUrl: `${process.env.FRONTEND_URL}/student/assignments/${assignmentId}/submissions/${submission._id}`,

      metadata: {
        marksAwarded: submission.marksAwarded,

        totalMarks: submission.totalMarks,

        percentage: submission.percentage,

        isPassed: submission.isPassed,
      },
    });
  } catch (error) {
    console.error("Assignment graded notification failed:", error);
  }

  const after = {
    status: submission.status,

    marksAwarded: submission.marksAwarded,

    totalMarks: submission.totalMarks,

    percentage: submission.percentage,

    isPassed: submission.isPassed,

    feedback: submission.feedback,

    privateNote: submission.privateNote,

    reviewedAt: submission.reviewedAt,

    reviewedBy: submission.reviewedBy,

    gradedAt: submission.gradedAt,
  };

  return {
    submission,
    before,
    after,
    changed: JSON.stringify(before) !== JSON.stringify(after),

    message: "Assignment submission graded successfully",
  };
}

export async function returnAssignmentSubmission({
  instructorId,
  assignmentId,
  submissionId,
  returnReason,
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(assignmentId, "assignment ID");

  validateObjectId(submissionId, "submission ID");

  const normalizedReason = String(returnReason || "").trim();

  if (!normalizedReason) {
    throw new ApiError(400, "Return reason is required");
  }

  if (normalizedReason.length > 2000) {
    throw new ApiError(400, "Return reason cannot exceed 2000 characters");
  }

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  })
    .select(
      `
        title
        maxAttempts
        status
        isActive
      `,
    )
    .lean();

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    assignment: assignmentId,
  }).select("+privateNote");

  if (!submission) {
    throw new ApiError(404, "Assignment submission not found");
  }

  if (submission.status === "cancelled") {
    throw new ApiError(409, "Cancelled submission cannot be returned");
  }

  if (submission.status === "draft") {
    throw new ApiError(409, "Draft submission cannot be returned");
  }

  if (submission.status === "returned") {
    return {
      submission,
      changed: false,
      message: "Assignment submission is already returned",
    };
  }

  /*
   * Student ke attempts check karenge.
   */
  const attemptsUsed = await AssignmentSubmission.countDocuments({
    assignment: assignmentId,
    student: submission.student,

    status: {
      $ne: "cancelled",
    },
  });

  if (attemptsUsed >= assignment.maxAttempts) {
    throw new ApiError(
      409,
      "Submission cannot be returned because maximum assignment attempts have already been used",
    );
  }

  const before = {
    status: submission.status,
    returnedAt: submission.returnedAt,
    returnReason: submission.returnReason,
    reviewedAt: submission.reviewedAt,
    reviewedBy: submission.reviewedBy,
  };

  const now = new Date();

  submission.status = "returned";

  submission.returnedAt = now;
  submission.returnReason = normalizedReason;

  submission.reviewedAt = now;
  submission.reviewedBy = instructorId;

  /*
   * Agar pehle grade hua tha aur instructor
   * correction ke liye return kar raha hai,
   * previous grade clear karenge.
   */
  submission.marksAwarded = null;
  submission.percentage = null;
  submission.isPassed = null;
  submission.gradedAt = null;

  await submission.save();

  try {
    await dispatchNotification({
      userId: submission.student,

      title: "Assignment returned",

      message: `Your assignment "${assignment.title}" was returned for corrections.`,

      type: "assignment_returned",

      resourceType: "submission",

      resourceId: submission._id,

      courseId: submission.course,

      actionUrl: `${process.env.FRONTEND_URL}/student/assignments/${assignmentId}/submissions/${submission._id}`,

      metadata: {
        returnReason: submission.returnReason,

        attemptNumber: submission.attemptNumber,
      },
    });
  } catch (error) {
    console.error("Assignment returned notification failed:", error);
  }

  const after = {
    status: submission.status,
    returnedAt: submission.returnedAt,
    returnReason: submission.returnReason,
    reviewedAt: submission.reviewedAt,
    reviewedBy: submission.reviewedBy,
  };

  return {
    submission,
    before,
    after,
    changed: true,

    message: "Assignment submission returned for resubmission successfully",
  };
}

export async function getStudentAssignmentSubmissions({
  studentId,
  assignmentId,
  query = {},
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(assignmentId, "assignment ID");

  const { status, sortBy = "attemptNumber", order = "desc" } = query;

  const { page, limit, skip } = getPagination(query);

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    status: "published",
    isPublished: true,
    isActive: true,
  })
    .select(
      `
      title
      course
      totalMarks
      passingMarks
      maxAttempts
      dueAt
      allowLateSubmission
      lateSubmissionUntil
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: assignment.course._id,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("_id status expiresAt")
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  const filter = {
    assignment: assignmentId,
    student: studentId,
  };

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "submitted", "under_review", "graded", "returned", "cancelled"],
    "Submission status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "attemptNumber",
      "submittedAt",
      "reviewedAt",
      "gradedAt",
      "percentage",
      "createdAt",
      "updatedAt",
    ],
    defaultField: "attemptNumber",
    defaultOrder: "desc",
  });

  const [submissions, totalRecords] = await Promise.all([
    AssignmentSubmission.find(filter)
      .select(
        `
          attemptNumber
          textAnswer
          linkAnswer
          files
          status
          isLate
          submittedAt
          reviewedAt
          gradedAt
          marksAwarded
          totalMarks
          percentage
          isPassed
          feedback
          returnedAt
          returnReason
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

    AssignmentSubmission.countDocuments(filter),
  ]);

  const attemptsUsed = await AssignmentSubmission.countDocuments({
    assignment: assignmentId,
    student: studentId,
    status: {
      $ne: "cancelled",
    },
  });

  const gradedSubmissions = await AssignmentSubmission.find({
    assignment: assignmentId,
    student: studentId,
    status: "graded",
  })
    .select(
      `
        attemptNumber
        marksAwarded
        totalMarks
        percentage
        isPassed
        gradedAt
      `,
    )
    .lean();

  const bestSubmission =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((best, current) =>
          (current.percentage ?? 0) > (best.percentage ?? 0) ? current : best,
        )
      : null;

  return {
    assignment,

    summary: {
      attemptsUsed,

      maxAttempts: assignment.maxAttempts,

      attemptsRemaining: Math.max(assignment.maxAttempts - attemptsUsed, 0),

      gradedAttempts: gradedSubmissions.length,

      hasPassed: gradedSubmissions.some(
        (submission) => submission.isPassed === true,
      ),

      bestSubmission: bestSubmission
        ? {
            submissionId: bestSubmission._id,

            attemptNumber: bestSubmission.attemptNumber,

            marksAwarded: bestSubmission.marksAwarded,

            totalMarks: bestSubmission.totalMarks,

            percentage: bestSubmission.percentage,

            isPassed: bestSubmission.isPassed,

            gradedAt: bestSubmission.gradedAt,
          }
        : null,
    },

    submissions,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      status: parsedStatus ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getStudentAssignmentSubmissionById({
  studentId,
  assignmentId,
  submissionId,
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(assignmentId, "assignment ID");
  validateObjectId(submissionId, "submission ID");

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    status: "published",
    isPublished: true,
    isActive: true,
  })
    .select(
      `
      title
      description
      instructions
      course
      totalMarks
      passingMarks
      maxAttempts
      dueAt
      allowLateSubmission
      lateSubmissionUntil
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: assignment.course._id,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("_id status")
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    assignment: assignmentId,
    student: studentId,
  })
    .select(
      `
        assignment
        student
        course
        enrollment
        attemptNumber
        textAnswer
        linkAnswer
        files
        status
        isLate
        submittedAt
        reviewedAt
        gradedAt
        reviewedBy
        marksAwarded
        totalMarks
        percentage
        isPassed
        feedback
        returnedAt
        returnReason
        createdAt
        updatedAt
      `,
    )
    .populate({
      path: "reviewedBy",
      select: "fullName avatarUrl",
    })
    .lean();

  if (!submission) {
    throw new ApiError(404, "Assignment submission not found");
  }

  const previousAttempts = await AssignmentSubmission.find({
    assignment: assignmentId,
    student: studentId,

    attemptNumber: {
      $lt: submission.attemptNumber,
    },

    status: {
      $ne: "cancelled",
    },
  })
    .select(
      `
        attemptNumber
        status
        isLate
        submittedAt
        gradedAt
        marksAwarded
        totalMarks
        percentage
        isPassed
        feedback
        returnedAt
        returnReason
      `,
    )
    .sort({
      attemptNumber: -1,
    })
    .lean();

  const attemptsUsed = await AssignmentSubmission.countDocuments({
    assignment: assignmentId,
    student: studentId,
    status: {
      $ne: "cancelled",
    },
  });

  return {
    assignment,

    submission,

    previousAttempts,

    attemptSummary: {
      attemptsUsed,

      maxAttempts: assignment.maxAttempts,

      attemptsRemaining: Math.max(assignment.maxAttempts - attemptsUsed, 0),

      canResubmit:
        submission.status === "returned" &&
        attemptsUsed < assignment.maxAttempts,
    },
  };
}

export async function getAssignmentAnalytics({ instructorId, assignmentId }) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(assignmentId, "assignment ID");

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    instructor: instructorId,
  })
    .select(
      `
        title
        course
        totalMarks
        passingMarks
        maxAttempts
        dueAt
        allowLateSubmission
        lateSubmissionUntil
        status
        isPublished
        isActive
      `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!assignment) {
    throw new ApiError(
      404,
      "Assignment not found or you are not the assignment instructor",
    );
  }

  const courseId = assignment.course._id;

  const [
    totalEligibleStudents,
    submissionStatsResult,
    attemptDistribution,
    topSubmissions,
    latestSubmissions,
  ] = await Promise.all([
    Enrollment.countDocuments({
      course: courseId,
      status: {
        $in: ["active", "completed"],
      },
    }),

    AssignmentSubmission.aggregate([
      {
        $match: {
          assignment: new mongoose.Types.ObjectId(assignmentId),

          status: {
            $ne: "cancelled",
          },
        },
      },

      {
        $group: {
          _id: null,

          totalAttempts: {
            $sum: 1,
          },

          uniqueStudents: {
            $addToSet: "$student",
          },

          submitted: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "submitted"],
                },
                1,
                0,
              ],
            },
          },

          underReview: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "under_review"],
                },
                1,
                0,
              ],
            },
          },

          graded: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                1,
                0,
              ],
            },
          },

          returned: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "returned"],
                },
                1,
                0,
              ],
            },
          },

          lateSubmissions: {
            $sum: {
              $cond: ["$isLate", 1, 0],
            },
          },

          passed: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isPassed", true],
                },
                1,
                0,
              ],
            },
          },

          failed: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isPassed", false],
                },
                1,
                0,
              ],
            },
          },

          averageMarks: {
            $avg: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                "$marksAwarded",
                null,
              ],
            },
          },

          averagePercentage: {
            $avg: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                "$percentage",
                null,
              ],
            },
          },

          highestMarks: {
            $max: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                "$marksAwarded",
                null,
              ],
            },
          },

          lowestMarks: {
            $min: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                "$marksAwarded",
                null,
              ],
            },
          },

          highestPercentage: {
            $max: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                "$percentage",
                null,
              ],
            },
          },

          lowestPercentage: {
            $min: {
              $cond: [
                {
                  $eq: ["$status", "graded"],
                },
                "$percentage",
                null,
              ],
            },
          },
        },
      },

      {
        $addFields: {
          uniqueStudentCount: {
            $size: "$uniqueStudents",
          },
        },
      },
    ]),

    AssignmentSubmission.aggregate([
      {
        $match: {
          assignment: new mongoose.Types.ObjectId(assignmentId),

          status: {
            $ne: "cancelled",
          },
        },
      },

      {
        $group: {
          _id: "$student",

          attempts: {
            $sum: 1,
          },

          bestPercentage: {
            $max: "$percentage",
          },

          passed: {
            $max: {
              $cond: [
                {
                  $eq: ["$isPassed", true],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $group: {
          _id: "$attempts",

          students: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]),

    AssignmentSubmission.find({
      assignment: assignmentId,

      status: "graded",
    })
      .select(
        `
        student
        attemptNumber
        marksAwarded
        totalMarks
        percentage
        isPassed
        gradedAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl",
      })
      .sort({
        percentage: -1,
        marksAwarded: -1,
        gradedAt: 1,
      })
      .limit(10)
      .lean(),

    AssignmentSubmission.find({
      assignment: assignmentId,

      status: {
        $ne: "cancelled",
      },
    })
      .select(
        `
        student
        attemptNumber
        status
        isLate
        submittedAt
        marksAwarded
        percentage
        isPassed
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl",
      })
      .sort({
        submittedAt: -1,
      })
      .limit(10)
      .lean(),
  ]);

  const stats = submissionStatsResult[0] ?? {
    totalAttempts: 0,
    uniqueStudentCount: 0,
    submitted: 0,
    underReview: 0,
    graded: 0,
    returned: 0,
    lateSubmissions: 0,
    passed: 0,
    failed: 0,
    averageMarks: 0,
    averagePercentage: 0,
    highestMarks: 0,
    lowestMarks: 0,
    highestPercentage: 0,
    lowestPercentage: 0,
  };

  const studentsSubmitted = stats.uniqueStudentCount ?? 0;

  const studentsPending = Math.max(
    totalEligibleStudents - studentsSubmitted,
    0,
  );

  const submissionRate =
    totalEligibleStudents > 0
      ? Number(((studentsSubmitted / totalEligibleStudents) * 100).toFixed(2))
      : 0;

  const passRate =
    stats.graded > 0
      ? Number(((stats.passed / stats.graded) * 100).toFixed(2))
      : 0;

  const lateSubmissionRate =
    stats.totalAttempts > 0
      ? Number(((stats.lateSubmissions / stats.totalAttempts) * 100).toFixed(2))
      : 0;

  return {
    assignment,

    summary: {
      totalEligibleStudents,

      studentsSubmitted,

      studentsPending,

      submissionRate,

      totalAttempts: stats.totalAttempts ?? 0,

      submitted: stats.submitted ?? 0,

      underReview: stats.underReview ?? 0,

      graded: stats.graded ?? 0,

      returned: stats.returned ?? 0,

      passed: stats.passed ?? 0,

      failed: stats.failed ?? 0,

      passRate,

      lateSubmissions: stats.lateSubmissions ?? 0,

      lateSubmissionRate,

      averageMarks: Number((stats.averageMarks ?? 0).toFixed(2)),

      averagePercentage: Number((stats.averagePercentage ?? 0).toFixed(2)),

      highestMarks: stats.highestMarks ?? 0,

      lowestMarks: stats.lowestMarks ?? 0,

      highestPercentage: stats.highestPercentage ?? 0,

      lowestPercentage: stats.lowestPercentage ?? 0,
    },

    attemptDistribution: attemptDistribution.map((item) => ({
      attemptNumber: item._id,

      students: item.students,
    })),

    topSubmissions,

    latestSubmissions,
  };
}
