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
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { uploadLectureVideo } from "../middlewares/lectureVideo.middleware.js";
import { uploadLectureDocument } from "../middlewares/lectureDocument.middleware.js";
import Router from "express";

const router = Router();

// Protected media streaming (local files)
router.get("/media/:type/:filename", optionalAuthMiddleware, streamProtectedMediaController);

// ImageKit client-side upload: generate auth token
router.get(
  "/upload-auth-token",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  getUploadAuthTokenController,
);

// ImageKit client-side upload: save resulting CDN url + fileId to DB
router.patch(
  "/:lectureId/update-media-url",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  updateLectureMediaUrlController,
);

router.patch(
  "/:lectureId/publish",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  publishLectureController,
);

/**
 * @access Private
 * @desc Create a new lecture for a specific module
 * @Api POST /api/lectures/:moduleId/create-lecture
 * @param { moduleId: string }
 * @body { title: string, description: string, content: string, isPublished: boolean }
 * @returns { message: string, lecture: object }
 */

router.post(
  "/:moduleId/create-lecture",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  createLectureController,
);

/**
 * @access Private
 * @desc Get all lectures for a specific module (for management)
 * @Api GET /api/lectures/:moduleId/manage
 * @param { moduleId: string }
 * @returns { message: string, lectures: array }
 */

router.get(
  "/:moduleId/manage",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  getManageLecturesByModuleController,
);

/**
 * @access Public / Enrolled
 * @desc Get all published lectures for a specific module
 * @Api GET /api/lectures/:moduleId/lectures
 * @param { moduleId: string }
 * @returns { message: string, lectures: array }
 */

router.get("/:moduleId/lectures", optionalAuthMiddleware, getPublishedLecturesByModuleController);

/**
 * @access Private
 * @desc Update a specific lecture
 * @Api PATCH /api/lectures/:lectureId/update-lecture
 * @param { lectureId: string }
 * @body { title: string, description: string, content: string, isPublished: boolean }
 * @returns { message: string, lecture: object }
 */

router.patch(
  "/:lectureId/update-lecture",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  updateLectureController,
);

/**
 * @access Private
 * @desc Upload a video for a specific lecture
 * @Api PATCH /api/lectures/:lectureId/upload-video
 * @param { lectureId: string }
 * @body { video: file }
 * @returns { message: string, lecture: object }
 */

router.patch(
  "/:lectureId/upload-video",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  uploadLectureVideo.single("video"),
  uploadLectureVideoController,
);

/**
 * @access Private
 * @desc Upload a document for a specific lecture
 * @Api PATCH /api/lectures/:lectureId/document
 * @param { lectureId: string }
 * @body { document: file }
 * @returns { message: string, lecture: object }
 */

router.patch(
  "/:lectureId/upload-document",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  uploadLectureDocument.single("document"),
  uploadLectureDocumentController,
);

/** * @access Private
 * @desc Reorder lectures within a module
 * @Api PATCH /api/lectures/:lectureId/reorder
 * @param { lectureId: string }
 * @body { newOrder: number }
 * @returns { message: string, lecture: object }
 */

router.patch(
  "/:lectureId/reorder",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  reorderLectureController,
);

/**
 * @access Private
 * @desc Archive a specific lecture
 * @Api DELETE /api/lectures/:lectureId
 * @param { lectureId: string }
 * @returns { message: string, lecture: object }
 */

router.delete(
  "/:lectureId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  archiveLectureController,
);
export default router;
