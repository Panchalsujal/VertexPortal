import Router from "express";

import {
  createLectureController,
  getPublishedLecturesByModuleController,
  getManageLecturesByModuleController,
  updateLectureController,
  uploadLectureVideoController,
  uploadLectureDocumentController,
  reorderLectureController,
  archiveLectureController,
  publishLectureController,
  streamProtectedMediaController,
  getUploadAuthTokenController,
  updateLectureMediaUrlController,
} from "../controllers/lecture.controller.js";

import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

import { uploadLectureVideo } from "../middlewares/lectureVideo.middleware.js";

import { uploadLectureDocument } from "../middlewares/lectureDocument.middleware.js";

const router = Router();

/*
 * =====================================================
 * PROTECTED MEDIA STREAMING
 * =====================================================
 *
 * GET /api/lectures/media/:type/:filename
 *
 * type:
 * videos
 * documents
 */
router.get(
  "/media/:type/:filename",
  optionalAuthMiddleware,
  streamProtectedMediaController,
);

/*
 * =====================================================
 * IMAGEKIT CLIENT-SIDE UPLOAD
 * =====================================================
 */

/*
 * Generate ImageKit authentication token.
 *
 * GET /api/lectures/upload-auth-token
 */
router.get(
  "/upload-auth-token",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  getUploadAuthTokenController,
);

/*
 * Client-side ImageKit upload ke baad
 * CDN URL + fileId database me save.
 *
 * PATCH /api/lectures/:lectureId/update-media-url
 */
router.patch(
  "/:lectureId/update-media-url",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  updateLectureMediaUrlController,
);

/*
 * =====================================================
 * PUBLISH LECTURE
 * =====================================================
 *
 * PATCH /api/lectures/:lectureId/publish
 */
router.patch(
  "/:lectureId/publish",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  publishLectureController,
);

/*
 * =====================================================
 * CREATE LECTURE
 * =====================================================
 *
 * POST /api/lectures/:moduleId/create-lecture
 */
router.post(
  "/:moduleId/create-lecture",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  createLectureController,
);

/*
 * =====================================================
 * MANAGE MODULE LECTURES
 * =====================================================
 *
 * GET /api/lectures/:moduleId/manage
 */
router.get(
  "/:moduleId/manage",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  getManageLecturesByModuleController,
);

/*
 * =====================================================
 * GET PUBLISHED LECTURES
 * =====================================================
 *
 * GET /api/lectures/:moduleId/lectures
 *
 * Public / enrolled / instructor / admin
 */
router.get(
  "/:moduleId/lectures",
  optionalAuthMiddleware,
  getPublishedLecturesByModuleController,
);

/*
 * =====================================================
 * UPDATE LECTURE
 * =====================================================
 *
 * PATCH /api/lectures/:lectureId/update-lecture
 *
 * Text lecture update hone par
 * controller RAG re-indexing bhi karega.
 */
router.patch(
  "/:lectureId/update-lecture",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  updateLectureController,
);

/*
 * =====================================================
 * VIDEO UPLOAD
 * =====================================================
 *
 * PATCH /api/lectures/:lectureId/upload-video
 *
 * form-data:
 * video = FILE
 */
router.patch(
  "/:lectureId/upload-video",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  uploadLectureVideo.single("video"),
  uploadLectureVideoController,
);

/*
 * =====================================================
 * DOCUMENT / PDF UPLOAD
 * =====================================================
 *
 * PATCH /api/lectures/:lectureId/upload-document
 *
 * form-data:
 * document = PDF
 *
 * Flow:
 *
 * PDF
 * ↓
 * ImageKit
 * ↓
 * text extraction
 * ↓
 * Mistral embeddings
 * ↓
 * ragchunks
 */
router.patch(
  "/:lectureId/upload-document",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  uploadLectureDocument.single("document"),
  uploadLectureDocumentController,
);

/*
 * =====================================================
 * REORDER LECTURE
 * =====================================================
 *
 * PATCH /api/lectures/:lectureId/reorder
 *
 * body:
 * {
 *   previousLectureId,
 *   nextLectureId
 * }
 */
router.patch(
  "/:lectureId/reorder",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  reorderLectureController,
);

/*
 * =====================================================
 * ARCHIVE LECTURE
 * =====================================================
 *
 * DELETE /api/lectures/:lectureId
 *
 * Lecture archive hone par
 * related RAG chunks bhi remove honge.
 */
router.delete(
  "/:lectureId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  archiveLectureController,
);

export default router;
