import { Router } from "express";

import { indexLectureForAiController } from "../controllers/lectureRag.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

import { authorizeRoles } from "../middlewares/authorize.middleware.js";

const router = Router();

router.use(
  authMiddleware,

  authorizeRoles("instructor", "admin"),
);

/*
 * Manual index / re-index lecture.
 */
router.post("/:lectureId/index", indexLectureForAiController);

export default router;
