import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { config } from "../config/config.js";

export async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive || user.status === "suspended" || user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status || "inactive"}. Please contact support.`,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user && user.isActive && user.status === "active") {
        req.user = user;
      }
    }
  } catch {
    // optional token parsing error ignored
  }

  next();
}

/**
 * Layer 2: Elevated Session Guard — Admin & Instructor panels only.
 * Validates the short-lived `admin_session` cookie (1h expiry, sessionType=elevated).
 * Must be used AFTER authMiddleware so req.user is already set.
 */
export async function requireElevatedSession(req, res, next) {
  try {
    const elevatedToken = req.cookies?.admin_session;

    if (!elevatedToken) {
      return res.status(403).json({
        success: false,
        message: "Elevated session required. Please log in again to access this panel.",
        code: "ELEVATED_SESSION_REQUIRED",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(elevatedToken, config.JWT_SECRET);
    } catch (err) {
      // Clear the stale cookie so the frontend redirects properly
      res.clearCookie("admin_session", { httpOnly: true, secure: true, sameSite: "none" });
      return res.status(403).json({
        success: false,
        message: "Elevated session expired. Please log in again.",
        code: "ELEVATED_SESSION_EXPIRED",
      });
    }

    // Validate the sessionType claim
    if (decoded.sessionType !== "elevated") {
      return res.status(403).json({
        success: false,
        message: "Invalid session type for this panel.",
        code: "INVALID_SESSION_TYPE",
      });
    }

    // Ensure the elevated token belongs to the same user as the auth token
    if (req.user && decoded.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Session mismatch detected.",
        code: "SESSION_MISMATCH",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Session validation error",
    });
  }
}