

import {
  Router,
} from "express";

import {
  createStudentNoteController,
  getStudentLectureNotesController,
  getStudentCourseNotesController,
  getStudentNoteByIdController,
  updateStudentNoteController,
  deleteStudentNoteController,
} from "../controllers/studentNote.controller.js";

import {
  authMiddleware,
} from "../middlewares/auth.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/authorize.middleware.js";

const router = Router();

/*
 * ============================================
 * ALL NOTE ROUTES
 * ============================================
 *
 * Student only.
 */
router.use(
  authMiddleware,

  authorizeRoles(
    "student",
  ),
);

/*
 * ============================================
 * CREATE NOTE
 * ============================================
 *
 * POST /api/notes
 *
 * Body:
 * {
 *   lectureId,
 *   title?,
 *   content,
 *   isPinned?
 * }
 */
router.post(
  "/",
  createStudentNoteController,
);

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
router.get(
  "/course/:courseId",
  getStudentCourseNotesController,
);

/*
 * ============================================
 * GET LECTURE NOTES
 * ============================================
 *
 * GET /api/notes/lecture/:lectureId
 */
router.get(
  "/lecture/:lectureId",
  getStudentLectureNotesController,
);

/*
 * ============================================
 * GET SINGLE NOTE
 * ============================================
 *
 * GET /api/notes/:noteId
 */
router.get(
  "/:noteId",
  getStudentNoteByIdController,
);

/*
 * ============================================
 * UPDATE NOTE
 * ============================================
 *
 * PATCH /api/notes/:noteId
 */
router.patch(
  "/:noteId",
  updateStudentNoteController,
);

/*
 * ============================================
 * DELETE NOTE
 * ============================================
 *
 * DELETE /api/notes/:noteId
 */
router.delete(
  "/:noteId",
  deleteStudentNoteController,
);

export default router;