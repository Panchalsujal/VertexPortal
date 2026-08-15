import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadAvatar } from "../middlewares/upload.middleware.js";

import { updateMyProfileController } from "../controllers/user.controller.js";
import { updatePasswordController } from "../controllers/user.controller.js";
import { updateAvatarController } from "../controllers/user.controller.js";

import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

/**
 * @access Private
 * @desc Update current user's profile Name
 * @api PATCH /api/user/me
 */
router.patch("/me", authMiddleware, updateMyProfileController);

/**
 * @access Private
 * @desc Update current user's password
 * @api PATCH /api/user/me/password
 * @requires oldPassword and newPassword in request body
 */
router.patch("/me/password", authMiddleware, authLimiter, updatePasswordController);

/**
 * @access Private
 * @desc Upload or update current user's avatar
 * @api PATCH /api/user/me/avatar
 */
router.patch(
  "/me/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"),
  updateAvatarController,
);

export default router;
