/**
 * Layer 6: Action Signature — Dangerous Mutation Protection
 * ──────────────────────────────────────────────────────────
 * For destructive admin operations (course delete, user promote, order refund),
 * the client must first call POST /api/admin/sign-action to receive a
 * time-limited HMAC token (valid 5 minutes), then include it as
 * X-Action-Signature header in the actual mutation request.
 *
 * This prevents:
 *  - Accidental button double-clicks on destructive actions
 *  - Automated scripts / CSRF-assisted attacks
 *  - Replay attacks (tokens are single-use, stored in memory)
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config/config.js";

const SIGNATURE_HEADER = "x-action-signature";
const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes
const pendingSignatures = new Map(); // In-memory store (use Redis in clustered env)

// Cleanup expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingSignatures.entries()) {
    if (now > val.expiresAt) {
      pendingSignatures.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Generates a one-time action signature token.
 * Called by POST /api/admin/sign-action before a dangerous mutation.
 */
export function generateActionSignatureController(req, res) {
  try {
    const { action, resourceId } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: "Action name is required" });
    }

    const nonce = randomBytes(16).toString("hex");
    const payload = `${req.user._id}:${action}:${resourceId || ""}:${nonce}`;
    const signature = createHmac("sha256", config.JWT_SECRET)
      .update(payload)
      .digest("hex");

    const tokenKey = `${req.user._id}:${action}:${signature}`;
    pendingSignatures.set(tokenKey, {
      signature,
      userId: req.user._id.toString(),
      action,
      resourceId: resourceId || null,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });

    console.log(`[ACTION-SIG] Signature issued for ${req.user.email} → action: ${action}`);

    return res.status(200).json({
      success: true,
      message: "Action signature issued. Valid for 5 minutes.",
      data: { signature, expiresIn: TOKEN_TTL_MS / 1000 },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to generate action signature" });
  }
}

/**
 * Middleware to validate the action signature on dangerous routes.
 * @param {string} action - The expected action name e.g. "COURSE_DELETE"
 */
export function requireActionSignature(action) {
  return (req, res, next) => {
    const provided = req.headers[SIGNATURE_HEADER];

    if (!provided) {
      return res.status(403).json({
        success: false,
        message: "Action signature required for this operation. Please confirm the action first.",
        code: "ACTION_SIGNATURE_REQUIRED",
      });
    }

    const tokenKey = `${req.user._id}:${action}:${provided}`;
    const stored = pendingSignatures.get(tokenKey);

    if (!stored) {
      return res.status(403).json({
        success: false,
        message: "Invalid or unknown action signature.",
        code: "ACTION_SIGNATURE_INVALID",
      });
    }

    if (Date.now() > stored.expiresAt) {
      pendingSignatures.delete(tokenKey);
      return res.status(403).json({
        success: false,
        message: "Action signature has expired. Please request a new one.",
        code: "ACTION_SIGNATURE_EXPIRED",
      });
    }

    if (stored.userId !== req.user._id.toString()) {
      pendingSignatures.delete(tokenKey);
      return res.status(403).json({
        success: false,
        message: "Action signature user mismatch.",
        code: "ACTION_SIGNATURE_MISMATCH",
      });
    }

    // Single-use: remove after validation
    pendingSignatures.delete(tokenKey);

    console.log(
      `[ACTION-SIG] Signature consumed for ${req.user.email} → action: ${action}, resource: ${stored.resourceId}`
    );

    next();
  };
}
