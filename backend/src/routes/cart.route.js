import Router from "express";
import {
  addToCartController,
  getMyCartController,
  removeFromCartController,
  getCartStatusController,
  clearCartController,
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/cart/:courseId
 * @desc Add a course to the cart
 * @access Private (Authenticated users only)
 */
router.post("/:courseId", authMiddleware, addToCartController);

/** * @route GET /api/cart
 * @desc Get the user's cart
 * @access Private (Authenticated users only)
 */

router.get("/get-cart", authMiddleware, getMyCartController);

/** * @route DELETE /api/cart/:courseId
 * @desc Remove a course from the cart
 * @access Private (Authenticated users only)
 */

router.delete("/cart/:courseId", authMiddleware, removeFromCartController);

/**
 * @route GET /api/cart/:courseId/status
 * @desc Check if a course is in the user's cart
 * @access Private (Authenticated users only)
 */

router.get("/cart/:courseId/status", authMiddleware, getCartStatusController);

/**
 * @route DELETE /api/cart
 * @desc Clear the user's cart
 * @access Private (Authenticated users only)
 */

router.delete("/cart", authMiddleware, clearCartController);

export default router;
