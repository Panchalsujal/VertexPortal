import { Router } from "express";

import {
  ingestRagResourceController,
  ingestCourseForRagController,
  ingestModuleForRagController,
  ingestLectureForRagController,
  searchCourseKnowledgeController,
  getCourseRagChunksController,
  deleteRagResourceController,
} from "../controllers/rag.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles("student", "instructor", "admin"),
);

/*
 * Semantic search
 */
router.post("/courses/:courseId/search", searchCourseKnowledgeController);

/*
 * Indexed content
 */
router.get("/courses/:courseId/chunks", getCourseRagChunksController);

/*
 * Generic ingestion
 */
router.post("/resources", ingestRagResourceController);

/*
 * Course indexing
 */
router.post("/courses/:courseId/index", ingestCourseForRagController);

/*
 * Module indexing
 */
router.post("/modules/:moduleId/index", ingestModuleForRagController);

/*
 * Lecture indexing
 */
router.post("/lectures/:lectureId/index", ingestLectureForRagController);

/*
 * Delete resource
 */
router.delete(
  "/courses/:courseId/resources/:resourceType/:resourceId",
  deleteRagResourceController,
);

export default router;
