import StudentNote from "../models/studentNote.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";

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
 * STUDENT COURSE ACCESS
 * ============================================
 */
async function validateStudentCourseAccess({
  studentId,
  courseId,
}) {
  validateObjectId(
    studentId,
    "student ID",
  );

  validateObjectId(
    courseId,
    "course ID",
  );

  const user = await User.findById(studentId).select("role").lean();
  if (user && (user.role === "admin" || user.role === "instructor")) {
    return { status: "active" };
  }

  const enrollment =
    await Enrollment.findOne({
      student:
        studentId,

      course:
        courseId,

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
    const newEnrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: "active",
      enrolledAt: new Date(),
    });
    return newEnrollment;
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

  return enrollment;
}

/*
 * ============================================
 * GET LECTURE + VALIDATE ACCESS
 * ============================================
 */
async function getAccessibleLecture({
  studentId,
  lectureId,
}) {
  validateObjectId(
    lectureId,
    "lecture ID",
  );

  const lecture =
    await Lecture.findOne({
      _id:
        lectureId,

      isActive:
        true,
    })
      .select(`
        _id
        course
        module
        title
        isPublished
        isActive
      `)
      .lean();

  if (!lecture) {
    throw new ApiError(
      404,
      "Lecture not found",
    );
  }

  if (!lecture.isPublished) {
    throw new ApiError(
      403,
      "This lecture is not available",
    );
  }

  await validateStudentCourseAccess({
    studentId,
    courseId:
      lecture.course,
  });

  return lecture;
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
    });

  const note =
    await StudentNote.create({
      student:
        studentId,

      course:
        lecture.course,

      module:
        lecture.module ??
        null,

      lecture:
        lecture._id,

      title:
        normalizedTitle,

      content:
        normalizedContent,

      isPinned,

      isActive:
        true,
    });

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
  validateObjectId(
    studentId,
    "student ID",
  );

  validateObjectId(
    courseId,
    "course ID",
  );

  await validateStudentCourseAccess({
    studentId,
    courseId,
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
    student:
      studentId,

    course:
      courseId,

    isActive:
      true,
  };

  if (lectureId) {
    validateObjectId(
      lectureId,
      "lecture ID",
    );

    const lectureExists =
      await Lecture.exists({
        _id:
          lectureId,

        course:
          courseId,

        isActive:
          true,
      });

    if (!lectureExists) {
      throw new ApiError(
        404,
        "Lecture not found in this course",
      );
    }

    filter.lecture =
      lectureId;
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