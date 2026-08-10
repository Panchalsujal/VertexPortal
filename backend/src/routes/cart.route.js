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
 * Add a course to cart
 * Supports: POST /api/cart/:courseId and POST /api/cart/add/:courseId
 */
router.post("/:courseId", authMiddleware, addToCartController);
router.post("/add/:courseId", authMiddleware, addToCartController);

/**
 * Get user cart
 * Supports: GET /api/cart and GET /api/cart/get-cart
 */
router.get("/", authMiddleware, getMyCartController);
router.get("/get-cart", authMiddleware, getMyCartController);

/**
 * Remove course from cart
 * Supports: DELETE /api/cart/:courseId and DELETE /api/cart/cart/:courseId
 */
router.delete("/:courseId", authMiddleware, removeFromCartController);
router.delete("/cart/:courseId", authMiddleware, removeFromCartController);

/**
 * Check course cart status
 * Supports: GET /api/cart/:courseId/status and GET /api/cart/cart/:courseId/status
 */
router.get("/:courseId/status", authMiddleware, getCartStatusController);
router.get("/cart/:courseId/status", authMiddleware, getCartStatusController);

/**
 * Clear user cart
 * Supports: DELETE /api/cart and DELETE /api/cart/cart
 */
router.delete("/", authMiddleware, clearCartController);
router.delete("/cart", authMiddleware, clearCartController);

export default router;
