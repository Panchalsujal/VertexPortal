/**
 * Layer 5: CSRF Protection — Double-Submit Cookie Pattern
 * ─────────────────────────────────────────────────────────
 * On GET /api/auth/me — a `csrf_token` cookie (readable by JS) is set.
 * On state-changing requests (POST/PUT/PATCH/DELETE) to admin/instructor routes,
 * the client must echo back the token in X-CSRF-Token header.
 *
 * NOTE: This only protects cookie-based auth. Bearer token requests are
 * inherently CSRF-safe (browsers don't auto-send Authorization headers).
 * We apply this selectively on admin/instructor mutation routes.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Middleware to generate and set CSRF token cookie if not already present.
 * Attach to GET /api/auth/me so every login flow receives a token.
 */
export function setCsrfToken(req, res, next) {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = randomBytes(TOKEN_LENGTH).toString("hex");

    const isSecure =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https";

    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // Must be readable by JS to include in header
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
  next();
}

/**
 * Middleware to validate CSRF token on state-changing admin/instructor requests.
 * Add to all admin/instructor mutation route groups.
 */
export function validateCsrfToken(req, res, next) {
  // Safe HTTP methods don't need CSRF protection
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // If Bearer token is present (non-cookie auth), skip CSRF — it's inherently safe
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: "CSRF token missing. Request blocked for security.",
      code: "CSRF_TOKEN_MISSING",
    });
  }

  // Constant-time comparison to prevent timing attacks
  const cookieBuf = Buffer.from(cookieToken);
  const headerBuf = Buffer.from(headerToken);

  if (
    cookieBuf.length !== headerBuf.length ||
    !timingSafeEqual(cookieBuf, headerBuf)
  ) {
    console.warn(`[CSRF] Invalid token attempt from IP: ${req.ip} on ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      message: "Invalid CSRF token. Request blocked.",
      code: "CSRF_TOKEN_INVALID",
    });
  }

  next();
}
