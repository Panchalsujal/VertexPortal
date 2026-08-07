import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCourseModuleController,
  getPublishedCourseModulesController,
  getManageCourseModulesController,
  updateCourseModuleController,
  archiveCourseModuleController,
  CourseModulePublishController,
  reorderCourseModuleController,
} from "../controllers/module.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";
import { Router } from "express";

const router = Router();

/** * @route POST /api/courses/:courseId/modules
 * @desc Create a new module for a course
 * @access Private (admin, instructor)
 */

router.post(
  "/:courseId/modules",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  createCourseModuleController,
);

/** * @route GET /api/courses/:courseId/modules
 * @desc Get all modules for a course
 * @access Public / Enrolled
 */

router.get("/:courseId/modules", optionalAuthMiddleware, getPublishedCourseModulesController);

/** * @route GET /api/courses/:courseId/modules/manage
 * @desc Get all modules for a course (for management)
 * @access Private (admin, instructor)
 */

router.get(
  "/:courseId/modules/manage",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  getManageCourseModulesController,
);

/** * @route PATCH /api/modules/:moduleId
 * @desc Update a module for a course
 * @access Private (admin, instructor)
 */

router.patch(
  "/updatemodule/:moduleId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  updateCourseModuleController,
);

/** * @route DELETE /api/modules/:moduleId
 * @desc Archive a module for a course
 * @access Private (admin, instructor)
 */

router.delete(
  "/deletemodule/:moduleId",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  archiveCourseModuleController,
);

/** * @route GET /api/modules/:moduleId /published
 * @desc Get a module by ID (for published courses)
 * @access Public
 */

router.patch(
  "/:moduleId/publish",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  CourseModulePublishController,
);




/** * @route PATCH /api/modules/:moduleId/reorder
 * @desc Reorder a module for a course
 * @access Private (admin, instructor)
 */

router.patch(
  "/:moduleId/reorder",
  authMiddleware,
  authorizeRoles("admin", "instructor"),
  reorderCourseModuleController,
);
export default router;
