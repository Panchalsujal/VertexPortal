import StudentNote from "../models/studentNote.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";

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

  const rawPayload = payload || {};
  const nestedData = rawPayload.data && typeof rawPayload.data === "object" ? rawPayload.data : {};

  const lectureId = rawPayload.lectureId || nestedData.lectureId;
  const title = rawPayload.title !== undefined ? rawPayload.title : (nestedData.title || "");
  const content = rawPayload.content !== undefined ? rawPayload.content : nestedData.content;
  const isPinned = rawPayload.isPinned !== undefined ? rawPayload.isPinned : (nestedData.isPinned || false);

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

  const rawPayload = payload || {};
  const nestedData = rawPayload.data && typeof rawPayload.data === "object" ? rawPayload.data : {};

  const title = rawPayload.title !== undefined ? rawPayload.title : nestedData.title;
  const content = rawPayload.content !== undefined ? rawPayload.content : nestedData.content;
  const isPinned = rawPayload.isPinned !== undefined ? rawPayload.isPinned : nestedData.isPinned;

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

/*
 * ============================================
 * ADMIN: GET ALL NOTES
 * ============================================
 */
export async function getAdminNotes({ query = {} }) {
  const { page, limit, skip } = getPagination(query);
  const { search = "", courseId, studentId, pinned } = query;

  const filter = { isActive: true };

  if (courseId) {
    validateObjectId(courseId, "course ID");
    filter.course = courseId;
  }

  if (studentId) {
    validateObjectId(studentId, "student ID");
    filter.student = studentId;
  }

  if (pinned !== null && pinned !== undefined && pinned !== "") {
    filter.isPinned = pinned === "true" || pinned === true;
  }

  const normalizedSearch = String(search || "").trim();
  if (normalizedSearch) {
    const searchRegex = new RegExp(
      normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const matchingUsers = await User.find({
      $or: [{ fullName: searchRegex }, { email: searchRegex }],
    })
      .select("_id")
      .lean();
    const userIds = matchingUsers.map((u) => u._id);

    const matchingCourses = await Course.find({
      title: searchRegex,
    })
      .select("_id")
      .lean();
    const courseIds = matchingCourses.map((c) => c._id);

    const searchConditions = [
      { title: searchRegex },
      { content: searchRegex },
    ];

    if (userIds.length > 0) {
      searchConditions.push({ student: { $in: userIds } });
    }
    if (courseIds.length > 0) {
      searchConditions.push({ course: { $in: courseIds } });
    }

    filter.$or = searchConditions;
  }

  const [
    notes,
    totalRecords,
    totalAllNotes,
    pinnedAllNotes,
    distinctCourses,
    distinctStudents,
  ] = await Promise.all([
    StudentNote.find(filter)
      .populate({
        path: "student",
        select: "fullName email avatarUrl role status",
      })
      .populate({
        path: "course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "lecture",
        select: "title type order",
      })
      .populate({
        path: "module",
        select: "title order",
      })
      .sort({
        isPinned: -1,
        updatedAt: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    StudentNote.countDocuments(filter),
    StudentNote.countDocuments({ isActive: true }),
    StudentNote.countDocuments({ isActive: true, isPinned: true }),
    StudentNote.distinct("course", { isActive: true }),
    StudentNote.distinct("student", { isActive: true }),
  ]);

  return {
    notes,
    total: totalRecords,
    stats: {
      total: totalAllNotes,
      pinned: pinnedAllNotes,
      courses: distinctCourses.length,
      students: distinctStudents.length,
    },
    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),
  };
}

/*
 * ============================================
 * ADMIN: GET SINGLE NOTE
 * ============================================
 */
export async function getAdminNoteById({ noteId }) {
  const validNoteId = validateObjectId(noteId, "note ID");
  const note = await StudentNote.findOne({
    _id: validNoteId,
    isActive: true,
  })
    .populate({
      path: "student",
      select: "fullName email avatarUrl role status",
    })
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .populate({
      path: "lecture",
      select: "title type order",
    })
    .populate({
      path: "module",
      select: "title order",
    })
    .lean();

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  return note;
}

/*
 * ============================================
 * ADMIN: DELETE NOTE
 * ============================================
 */
export async function deleteAdminNote({ noteId }) {
  const validNoteId = validateObjectId(noteId, "note ID");
  const note = await StudentNote.findById(validNoteId);

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  note.isActive = false;
  await note.save();

  return {
    noteId: note._id,
    message: "Note deleted successfully",
  };
}