import {
  asyncHandler,
} from "../utils/asyncHandler.js";

import {
  createStudentNote,
  getStudentLectureNotes,
  getStudentCourseNotes,
  getStudentNoteById,
  updateStudentNote,
  deleteStudentNote,
  getAdminNotes,
  getAdminNoteById,
  deleteAdminNote,
} from "../service/studentNote.service.js";

/*
 * ============================================
 * CREATE NOTE
 * ============================================
 *
 * POST /api/notes
 */
export const createStudentNoteController =
  asyncHandler(async (req, res) => {
    const note =
      await createStudentNote({
        studentId:
          req.user.id,

        payload:
          req.body,
      });

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Note created successfully",

        note,
      });
  });

/*
 * ============================================
 * GET NOTES FOR LECTURE
 * ============================================
 *
 * GET /api/notes/lecture/:lectureId
 */
export const getStudentLectureNotesController =
  asyncHandler(async (req, res) => {
    const {
      lectureId,
    } = req.params;

    const result =
      await getStudentLectureNotes({
        studentId:
          req.user.id,

        lectureId,

        query:
          req.query,
      });

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Lecture notes fetched successfully",

        lecture:
          result.lecture,

        notes:
          result.notes,

        pagination:
          result.pagination,
      });
  });

/*
 * ============================================
 * GET COURSE NOTES
 * ============================================
 *
 * GET /api/notes/course/:courseId
 *
 * Query:
 * ?page=1
 * &limit=20
 * &lectureId=...
 * &moduleId=...
 * &pinned=true
 * &search=jwt
 */
export const getStudentCourseNotesController =
  asyncHandler(async (req, res) => {
    const {
      courseId,
    } = req.params;

    const result =
      await getStudentCourseNotes({
        studentId:
          req.user.id,

        courseId,

        query:
          req.query,
      });

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Course notes fetched successfully",

        notes:
          result.notes,

        pagination:
          result.pagination,
      });
  });

/*
 * ============================================
 * GET SINGLE NOTE
 * ============================================
 *
 * GET /api/notes/:noteId
 */
export const getStudentNoteByIdController =
  asyncHandler(async (req, res) => {
    const {
      noteId,
    } = req.params;

    const note =
      await getStudentNoteById({
        studentId:
          req.user.id,

        noteId,
      });

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Note fetched successfully",

        note,
      });
  });

/*
 * ============================================
 * UPDATE NOTE
 * ============================================
 *
 * PATCH /api/notes/:noteId
 */
export const updateStudentNoteController =
  asyncHandler(async (req, res) => {
    const {
      noteId,
    } = req.params;

    const note =
      await updateStudentNote({
        studentId:
          req.user.id,

        noteId,

        payload:
          req.body,
      });

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Note updated successfully",

        note,
      });
  });

/*
 * ============================================
 * DELETE NOTE
 * ============================================
 *
 * DELETE /api/notes/:noteId
 */
export const deleteStudentNoteController =
  asyncHandler(async (req, res) => {
    const {
      noteId,
    } = req.params;

    const result =
      await deleteStudentNote({
        studentId:
          req.user.id,

        noteId,
      });

    return res
      .status(200)
      .json({
        success: true,

        message:
          result.message,

        noteId:
          result.noteId,
      });
  });

/*
 * ============================================
 * ADMIN: GET ALL NOTES
 * ============================================
 *
 * GET /api/admin/notes
 */
export const getAdminNotesController = asyncHandler(async (req, res) => {
  const result = await getAdminNotes({
    query: req.query,
  });

  return res.status(200).json({
    success: true,
    message: "Admin notes fetched successfully",
    ...result,
  });
});

/*
 * ============================================
 * ADMIN: GET SINGLE NOTE
 * ============================================
 *
 * GET /api/admin/notes/:noteId
 */
export const getAdminNoteByIdController = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await getAdminNoteById({
    noteId,
  });

  return res.status(200).json({
    success: true,
    message: "Note fetched successfully",
    note,
  });
});

/*
 * ============================================
 * ADMIN: DELETE NOTE
 * ============================================
 *
 * DELETE /api/admin/notes/:noteId
 */
export const deleteAdminNoteController = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const result = await deleteAdminNote({
    noteId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    noteId: result.noteId,
  });
});