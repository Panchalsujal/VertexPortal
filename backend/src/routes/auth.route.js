import { Router } from "express";
import {
  registerController,
  loginController,
  googleAuthController,
  getMeController,
  logoutController,
  verifyEmailController,
  resendVerificationController,
  forgotPasswordController,
  verifyResetTokenController,
  resetPasswordController,
} from "../controllers/auth.controller.js";
import {
  registerValidator,
  loginValidator,
} from "../validators/user.validatore.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { setCsrfToken } from "../middlewares/csrf.middleware.js";

const router = Router();
/**
 * @access Public
 * @desc Register a new user
 * @Api /api/auth/register
 */
router.post("/register", registerValidator, registerController);

/**
 * @access Public
 * @desc Login a user
 * @Api /api/auth/login
 */
router.post("/login", loginValidator, loginController);

/**
 * @access Public
 * @desc Google OAuth2 One-Tap / Sign-in
 * @Api /api/auth/google
 */
router.post("/google", googleAuthController);

/**
 *  @access Private
 *  @desc Get the currently logged-in user (also sets CSRF token cookie — Layer 5)
 *  @Api /api/auth/me
 */
router.get("/me", authMiddleware, setCsrfToken, getMeController);


/**
 *  @access Private
 *  @desc Logout the currently logged-in user
 *  @Api /api/auth/logout
 */
router.post("/logout", authMiddleware, logoutController);

/**
 *  @access Public
 *  @desc Verify email address
 *  @Api /api/auth/verify-email/:userId/:token
 */
router.get("/verify-email/:userId/:token", verifyEmailController);

/**
 *  @access Public
 *  @desc Resend verification email
 *  @Api /api/auth/resend-verification
 */
router.post("/resend-verification", resendVerificationController);

/**
 *  @access Public
 *  @desc Request password reset email
 *  @Api /api/auth/forgot-password
 */
router.post("/forgot-password", forgotPasswordController);

/**
 *  @access Public
 *  @desc Verify password reset token validity
 *  @Api /api/auth/verify-reset-token/:userId/:token
 */
router.get("/verify-reset-token/:userId/:token", verifyResetTokenController);

/**
 *  @access Public
 *  @desc Reset password with token
 *  @Api /api/auth/reset-password/:userId/:token
 */
router.post("/reset-password/:userId/:token", resetPasswordController);

export default router;
