import { Router } from "express";
import {
  addToWishlistController,
  removeFromWishlistController,
  getMyWishlistController,
  getWishlistStatusController,
} from "../controllers/wishlist.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();

/**
 * @access Private
 * @desc Add a course to the user's wishlist
 * @Api POST /api/wishlist/:courseId
 * @param { courseId: string }
 * @returns { message: string, wishlist: array }
 */

router.post("/wishlist/:courseId", authMiddleware, addToWishlistController);

/**
 * @access Private
 * @desc Remove a course from the user's wishlist
 * @Api DELETE /api/wishlist/:courseId
 *  @param { courseId: string }
 * @returns { message: string, wishlist: array }
 */

router.delete(
  "/wishlist/:courseId",
  authMiddleware,
  removeFromWishlistController,
);

/**
 * @access Private
 * @desc Get the user's wishlist
 * @Api GET /api/wishlist
 * @returns { message: string, wishlist: array }
 */

router.get("/wishlist", authMiddleware, getMyWishlistController);
/**
 * @access Private
 * @desc Get the wishlist status of a course for the user
 * @Api GET /api/wishlist/:courseId/status
 * @param { courseId: string }
 * @returns { message: string, isInWishlist: boolean }
 */

router.get(
  "/wishlist/:courseId/status",
  authMiddleware,
  getWishlistStatusController,
);

export default router;
