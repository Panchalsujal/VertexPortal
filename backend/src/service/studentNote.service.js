import StudentNote from "../models/studentNote.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import mongoose from "mongoose";

import {
  validateObjectId,
} from "../utils/validator.js";

import {
  getPagination,
  buildPaginationMeta,
} from "../utils/pagination.js";

import {
  ApiError,
} from "../utils/ApiError.js";

/*
 * ============================================
 * RESOLVE COURSE OBJECT ID
 * ============================================
 *
 * Accepts Mongo ObjectId, Course Document, Course Object,
 * Course Slug, or Title and resolves to valid Course _id string.
 */
async function resolveCourseObjectId(courseInput) {
  if (!courseInput) {
    throw new ApiError(400, "Course ID is required");
  }

  let str;
  if (typeof courseInput === "string") {
    str = courseInput.trim();
  } else if (courseInput instanceof mongoose.Types.ObjectId) {
    return courseInput.toString();
  } else if (typeof courseInput === "object" && courseInput !== null) {
    if (courseInput._id) {
      const inner = courseInput._id;
      str = inner instanceof mongoose.Types.ObjectId ? inner.toString() : String(inner).trim();
    } else if (typeof courseInput.id === "string") {
      str = courseInput.id.trim();
    } else if (typeof courseInput.toString === "function" && courseInput.toString() !== "[object Object]") {
      str = courseInput.toString().trim();
    } else {
      str = String(courseInput).trim();
    }
  } else {
    str = String(courseInput).trim();
  }

  if (!str) {
    throw new ApiError(400, "Course ID is required");
  }

  if (mongoose.Types.ObjectId.isValid(str)) {
    return str;
  }

  const courseBySlug = await Course.findOne({ slug: str }).select("_id").lean();
  if (courseBySlug) {
    return courseBySlug._id.toString();
  }

  const courseByTitle = await Course.findOne({ title: str }).select("_id").lean();
  if (courseByTitle) {
    return courseByTitle._id.toString();
  }

  throw new ApiError(400, "Invalid course ID");
}

/*
 * ============================================
 * STUDENT COURSE ACCESS
 * ============================================
 */
async function validateStudentCourseAccess({
  studentId,
  courseId,
}) {
  const validStudentId = validateObjectId(
    studentId,
    "student ID",
  );

  const validCourseId = await resolveCourseObjectId(courseId);

  const user = await User.findById(validStudentId).select("role").lean();
  if (user && (user.role === "admin" || user.role === "instructor")) {
    return { status: "active", courseId: validCourseId };
  }

  const enrollment =
    await Enrollment.findOne({
      student: validStudentId,
      course: validCourseId,
      status: {
        $in: [
          "active",
          "completed",
        ],
      },
    })
      .select(
        "_id status expiresAt",
      )
      .lean();

  if (!enrollment) {
    throw new ApiError(
      403,
      "You are not enrolled in this course",
    );
  }

  if (
    enrollment.expiresAt &&
    new Date(
      enrollment.expiresAt,
    ).getTime() <= Date.now()
  ) {
    throw new ApiError(
      403,
      "Your course enrollment has expired",
    );
  }

  return { ...enrollment, courseId: validCourseId };
}

/*
 * ============================================
 * GET LECTURE + VALIDATE ACCESS
 * ============================================
 */
async function getAccessibleLecture({
  studentId,
  lectureId,
  fallbackCourseId = null,
}) {
  const validLectureId = validateObjectId(
    lectureId,
    "lecture ID",
  );

  const lecture =
    await Lecture.findOne({
      _id: validLectureId,
      isActive: true,
    })
      .select("_id course module title isPublished isActive")
      .populate({ path: "module", select: "course" })
      .lean();

  if (!lecture) {
    throw new ApiError(
      404,
      "Lecture not found",
    );
  }

  let rawCourse =
    lecture.course ||
    (lecture.module && typeof lecture.module === "object"
      ? lecture.module.course
      : null) ||
    fallbackCourseId;

  if (!rawCourse && lecture.module) {
    const modDoc = await CourseModule.findById(lecture.module).select("course").lean();
    if (modDoc) {
      rawCourse = modDoc.course;
    }
  }

  if (!rawCourse) {
    throw new ApiError(
      400,
      "Invalid course ID",
    );
  }

  const resolvedCourseId = await resolveCourseObjectId(rawCourse);

  await validateStudentCourseAccess({
    studentId,
    courseId: resolvedCourseId,
  });

  return {
    ...lecture,
    course: resolvedCourseId,
    module: lecture.module && typeof lecture.module === "object" ? lecture.module._id : lecture.module,
  };
}

/*
 * ============================================
 * CREATE STUDENT NOTE
 * ============================================
 */
export async function createStudentNote({
  studentId,
  payload,
}) {
  validateObjectId(
    studentId,
    "student ID",
  );

  const {
    lectureId,
    courseId = null,
    title = "",
    content,
    isPinned = false,
  } = payload || {};

  if (!lectureId) {
    throw new ApiError(
      400,
      "Lecture ID is required",
    );
  }

  const normalizedTitle =
    String(title || "").trim();

  const normalizedContent =
    String(content || "").trim();

  if (!normalizedContent) {
    throw new ApiError(
      400,
      "Note content is required",
    );
  }

  if (
    normalizedTitle.length >
    200
  ) {
    throw new ApiError(
      400,
      "Note title cannot exceed 200 characters",
    );
  }

  if (
    normalizedContent.length >
    20000
  ) {
    throw new ApiError(
      400,
      "Note content cannot exceed 20000 characters",
    );
  }

  if (
    typeof isPinned !==
    "boolean"
  ) {
    throw new ApiError(
      400,
      "isPinned must be boolean",
    );
  }

  const lecture =
    await getAccessibleLecture({
      studentId,
      lectureId,
      fallbackCourseId: courseId,
    });

  const note = await StudentNote.create({
    student: studentId,
    course: lecture.course,
    module: lecture.module ?? null,
    lecture: lecture._id,
    title: normalizedTitle,
    content: normalizedContent,
    isPinned,
    isActive: true,
  });

  await note.populate([
    { path: "lecture", select: "title type order" },
    { path: "module", select: "title order" },
  ]);

  return note;
}

/*
 * ============================================
 * GET NOTES FOR ONE LECTURE
 * ============================================
 */
export async function getStudentLectureNotes({
  studentId,
  lectureId,
  query = {},
}) {
  validateObjectId(
    studentId,
    "student ID",
  );

  const lecture =
    await getAccessibleLecture({
      studentId,
      lectureId,
    });

  const {
    page,
    limit,
    skip,
  } =
    getPagination(query);

  const filter = {
    student:
      studentId,

    lecture:
      lecture._id,

    isActive:
      true,
  };

  const [
    notes,
    totalRecords,
  ] =
    await Promise.all([
      StudentNote.find(
        filter,
      )
        .sort({
          isPinned: -1,
          updatedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      StudentNote.countDocuments(
        filter,
      ),
    ]);

  return {
    lecture: {
      _id:
        lecture._id,

      title:
        lecture.title,

      course:
        lecture.course,

      module:
        lecture.module,
    },

    notes,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        totalRecords,
      }),
  };
}

/*
 * ============================================
 * GET ALL NOTES FOR COURSE
 * ============================================
 */
export async function getStudentCourseNotes({
  studentId,
  courseId,
  query = {},
}) {
  const validStudentId = validateObjectId(
    studentId,
    "student ID",
  );

  const validCourseId = await resolveCourseObjectId(courseId);

  await validateStudentCourseAccess({
    studentId: validStudentId,
    courseId: validCourseId,
  });

  const {
    page,
    limit,
    skip,
  } =
    getPagination(query);

  const {
    lectureId = null,
    moduleId = null,
    pinned = null,
    search = "",
  } = query;

  const filter = {
    student: validStudentId,

    course: validCourseId,

    isActive:
      true,
  };

  if (lectureId) {
    const validLecId = validateObjectId(
      lectureId,
      "lecture ID",
    );

    filter.lecture = validLecId;
  }

  if (moduleId) {
    validateObjectId(
      moduleId,
      "module ID",
    );

    filter.module =
      moduleId;
  }

  if (
    pinned !== null &&
    pinned !== undefined &&
    pinned !== ""
  ) {
    if (
      pinned !== "true" &&
      pinned !== "false"
    ) {
      throw new ApiError(
        400,
        "pinned must be true or false",
      );
    }

    filter.isPinned =
      pinned === "true";
  }

  const normalizedSearch =
    String(search || "").trim();

  if (normalizedSearch) {
    const safeSearch =
      normalizedSearch.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

    filter.$or = [
      {
        title: {
          $regex:
            safeSearch,

          $options:
            "i",
        },
      },

      {
        content: {
          $regex:
            safeSearch,

          $options:
            "i",
        },
      },
    ];
  }

  const [
    notes,
    totalRecords,
  ] =
    await Promise.all([
      StudentNote.find(
        filter,
      )
        .populate({
          path:
            "lecture",

          select:
            "title type order",
        })
        .populate({
          path:
            "module",

          select:
            "title order",
        })
        .sort({
          isPinned: -1,
          updatedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      StudentNote.countDocuments(
        filter,
      ),
    ]);

  return {
    notes,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        totalRecords,
      }),
  };
}

/*
 * ============================================
 * GET SINGLE NOTE
 * ============================================
 */
export async function getStudentNoteById({
  studentId,
  noteId,
}) {
  validateObjectId(
    studentId,
    "student ID",
  );

  validateObjectId(
    noteId,
    "note ID",
  );

  const note =
    await StudentNote.findOne({
      _id:
        noteId,

      student:
        studentId,

      isActive:
        true,
    })
      .populate({
        path:
          "lecture",

        select:
          "title type order",
      })
      .populate({
        path:
          "module",

        select:
          "title order",
      })
      .populate({
        path:
          "course",

        select:
          "title slug thumbnailUrl",
      })
      .lean();

  if (!note) {
    throw new ApiError(
      404,
      "Note not found",
    );
  }

  await validateStudentCourseAccess({
    studentId,
    courseId:
      note.course?._id ??
      note.course,
  });

  return note;
}

/*
 * ============================================
 * UPDATE STUDENT NOTE
 * ============================================
 */
export async function updateStudentNote({
  studentId,
  noteId,
  payload,
}) {
  validateObjectId(
    studentId,
    "student ID",
  );

  validateObjectId(
    noteId,
    "note ID",
  );

  const note =
    await StudentNote.findOne({
      _id:
        noteId,

      student:
        studentId,

      isActive:
        true,
    });

  if (!note) {
    throw new ApiError(
      404,
      "Note not found",
    );
  }

  await validateStudentCourseAccess({
    studentId,
    courseId:
      note.course,
  });

  const {
    title,
    content,
    isPinned,
  } = payload || {};

  if (
    title === undefined &&
    content === undefined &&
    isPinned === undefined
  ) {
    throw new ApiError(
      400,
      "At least one note field is required",
    );
  }

  if (
    title !== undefined
  ) {
    const normalizedTitle =
      String(title || "").trim();

    if (
      normalizedTitle.length >
      200
    ) {
      throw new ApiError(
        400,
        "Note title cannot exceed 200 characters",
      );
    }

    note.title =
      normalizedTitle;
  }

  if (
    content !== undefined
  ) {
    const normalizedContent =
      String(content || "").trim();

    if (!normalizedContent) {
      throw new ApiError(
        400,
        "Note content cannot be empty",
      );
    }

    if (
      normalizedContent.length >
      20000
    ) {
      throw new ApiError(
        400,
        "Note content cannot exceed 20000 characters",
      );
    }

    note.content =
      normalizedContent;
  }

  if (
    isPinned !== undefined
  ) {
    if (
      typeof isPinned !==
      "boolean"
    ) {
      throw new ApiError(
        400,
        "isPinned must be boolean",
      );
    }

    note.isPinned =
      isPinned;
  }

  await note.save();

  return note;
}

/*
 * ============================================
 * DELETE STUDENT NOTE
 * ============================================
 *
 * Soft delete use karenge because model me
 * isActive already available hai.
 */
export async function deleteStudentNote({
  studentId,
  noteId,
}) {
  validateObjectId(
    studentId,
    "student ID",
  );

  validateObjectId(
    noteId,
    "note ID",
  );

  const note =
    await StudentNote.findOne({
      _id:
        noteId,

      student:
        studentId,

      isActive:
        true,
    });

  if (!note) {
    throw new ApiError(
      404,
      "Note not found",
    );
  }

  await validateStudentCourseAccess({
    studentId,
    courseId:
      note.course,
  });

  note.isActive =
    false;

  await note.save();

  return {
    noteId:
      note._id,

    message:
      "Note deleted successfully",
  };
}