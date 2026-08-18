import jwt from "jsonwebtoken";
import {config} from "../config/config.js";

export function generateToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

/**
 * Layer 2: Generates a short-lived elevated session token for admin/instructor users.
 * Expires in 1 hour. Contains sessionType="elevated" claim for middleware verification.
 */
export function generateElevatedToken(payload) {
  return jwt.sign(
    { ...payload, sessionType: "elevated" },
    config.JWT_SECRET,
    { expiresIn: "1h" }
  );
}