import { Router } from "express";

import {
  createCategoryController,
  getAllCategoriesController,
  getCategoryBySlugController,
  updateCategoryController,
  deleteCategoryController
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorize.middleware.js";




const router = Router();

/**
 * @access Admin
 * @desc Create a new category
 * @api POST /api/categories
 */
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  createCategoryController,
);

/**
 * @access Public
 * @desc Get all active categories
 * @api GET /api/categories
 */
router.get("/", getAllCategoriesController);

/**
 * @access Public
 * @desc Get a category by its slug
 * @api GET /api/categories/:slug
 */

router.get("/:slug", getCategoryBySlugController);
/**
 * @access Admin
 * @desc Update category
 * @api PATCH /api/categories/:categoryId
 */
router.patch(
  "/:categoryId",
  authMiddleware,
  authorizeRoles("admin"),
  updateCategoryController,
);



/** * @access Admin
 * @desc Delete category
 * @api DELETE /api/categories/:categoryId
 */

router.delete(
  "/:categoryId",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCategoryController
);


export default router;
