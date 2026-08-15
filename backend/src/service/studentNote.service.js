import StudentNote from "../models/studentNote.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";

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
 * VALIDATE STUDENT COURSE ACCESS
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

  const validCourseId = validateObjectId(
    courseId,
    "course ID",
  );

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
  const validLectureId =
    validateObjectId(
      lectureId,
      "lecture ID",
    );

  const lecture =
    await Lecture.findOne({
      _id: validLectureId,
      isActive: true,
    })
      .select(
        "_id course module title type isPublished isActive",
      )
      .lean();

  if (!lecture) {
    throw new ApiError(
      404,
      "Lecture not found",
    );
  }

  /*
   * Lecture schema me course required hai.
   * Isliye course frontend se lene ki zarurat nahi.
   */
  if (!lecture.course) {
    throw new ApiError(
      400,
      "Lecture is not linked to a course",
    );
  }

  const courseId =
    validateObjectId(
      lecture.course,
      "course ID",
    );

  await validateStudentCourseAccess({
    studentId,
    courseId,
  });

  return {
    ...lecture,

    course:
      courseId,
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
  const validStudentId =
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
    String(
      title || "",
    ).trim();

  const normalizedContent =
    String(
      content || "",
    ).trim();

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
      studentId:
        validStudentId,

      lectureId,
    });

  const note =
    await StudentNote.create({
      student:
        validStudentId,

      course:
        lecture.course,

      module:
        lecture.module ?? null,

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

  await note.populate([
    {
      path: "course",
      select:
        "title slug thumbnailUrl",
    },

    {
      path: "lecture",
      select:
        "title type order",
    },

    {
      path: "module",
      select:
        "title order",
    },
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
  const validStudentId =
    validateObjectId(
      studentId,
      "student ID",
    );

  const lecture =
    await getAccessibleLecture({
      studentId:
        validStudentId,

      lectureId,
    });

  const {
    page,
    limit,
    skip,
  } = getPagination(
    query,
  );

  const filter = {
    student:
      validStudentId,

    lecture:
      lecture._id,

    isActive:
      true,
  };

  const [
    notes,
    totalRecords,
  ] = await Promise.all([
    StudentNote.find(
      filter,
    )
      .populate({
        path: "lecture",
        select:
          "title type order",
      })
      .populate({
        path: "module",
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
  const validStudentId =
    validateObjectId(
      studentId,
      "student ID",
    );

  const validCourseId =
    validateObjectId(
      courseId,
      "course ID",
    );

  await validateStudentCourseAccess({
    studentId:
      validStudentId,

    courseId:
      validCourseId,
  });

  const {
    page,
    limit,
    skip,
  } = getPagination(
    query,
  );

  const {
    lectureId = null,
    moduleId = null,
    pinned = null,
    search = "",
  } = query;

  const filter = {
    student:
      validStudentId,

    course:
      validCourseId,

    isActive:
      true,
  };

  if (lectureId) {
    filter.lecture =
      validateObjectId(
        lectureId,
        "lecture ID",
      );
  }

  if (moduleId) {
    filter.module =
      validateObjectId(
        moduleId,
        "module ID",
      );
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
    String(
      search || "",
    ).trim();

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
  ] = await Promise.all([
    StudentNote.find(
      filter,
    )
      .populate({
        path: "lecture",
        select:
          "title type order",
      })
      .populate({
        path: "module",
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
  const validStudentId =
    validateObjectId(
      studentId,
      "student ID",
    );

  const validNoteId =
    validateObjectId(
      noteId,
      "note ID",
    );

  const note =
    await StudentNote.findOne({
      _id:
        validNoteId,

      student:
        validStudentId,

      isActive:
        true,
    })
      .populate({
        path: "lecture",
        select:
          "title type order",
      })
      .populate({
        path: "module",
        select:
          "title order",
      })
      .populate({
        path: "course",
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

  /*
   * Populated course document se _id nikalo.
   */
  const noteCourseId =
    note.course?._id ??
    note.course;

  await validateStudentCourseAccess({
    studentId:
      validStudentId,

    courseId:
      noteCourseId,
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
  const validStudentId =
    validateObjectId(
      studentId,
      "student ID",
    );

  const validNoteId =
    validateObjectId(
      noteId,
      "note ID",
    );

  const note =
    await StudentNote.findOne({
      _id:
        validNoteId,

      student:
        validStudentId,

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
    studentId:
      validStudentId,

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
      String(
        title || "",
      ).trim();

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
      String(
        content || "",
      ).trim();

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

  await note.populate([
    {
      path: "course",
      select:
        "title slug thumbnailUrl",
    },

    {
      path: "lecture",
      select:
        "title type order",
    },

    {
      path: "module",
      select:
        "title order",
    },
  ]);

  return note;
}

/*
 * ============================================
 * DELETE STUDENT NOTE
 * ============================================
 */
export async function deleteStudentNote({
  studentId,
  noteId,
}) {
  const validStudentId =
    validateObjectId(
      studentId,
      "student ID",
    );

  const validNoteId =
    validateObjectId(
      noteId,
      "note ID",
    );

  const note =
    await StudentNote.findOne({
      _id:
        validNoteId,

      student:
        validStudentId,

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
    studentId:
      validStudentId,

    courseId:
      note.course,
  });

  /*
   * Soft delete
   */
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