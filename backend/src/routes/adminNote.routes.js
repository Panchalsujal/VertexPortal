import { Router } from "express";

import {
  getAdminNotesController,
  getAdminNoteByIdController,
  deleteAdminNoteController,
} from "../controllers/studentNote.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { auditLogAction } from "../middlewares/auditLog.middleware.js";

const router = Router();

router.use(authMiddleware, authorizeRoles("admin"));

/*
 * GET all notes (with search, filter, pagination, stats)
 */
router.get("/", getAdminNotesController);

/*
 * GET single note details
 */
router.get("/:noteId", getAdminNoteByIdController);

/*
 * DELETE note (admin moderation)
 */
router.delete(
  "/:noteId",
  auditLogAction("STUDENT_NOTE_DELETED", "StudentNote", (req) => req.params.noteId),
  deleteAdminNoteController,
);

export default router;
