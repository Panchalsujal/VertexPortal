/**
 * Layer 8: Sensitive Data Masking
 * ─────────────────────────────────
 * Strips sensitive fields from user/document objects before API responses.
 * Use in admin controllers where bulk user data is returned.
 */

// Fields that should NEVER appear in any API response
const ALWAYS_STRIP_FIELDS = new Set([
  "password",
  "passwordHistory",
  "emailVerificationToken",
  "emailVerificationExpires",
  "passwordResetToken",
  "passwordResetExpires",
  "loginAttempts",
  "lockoutUntil",
  "knownIPs",
  "__v",
]);

// Fields masked in bulk/list responses (partially shown in detail views)
const BULK_MASK_FIELDS = new Set([
  "googleId",
]);

/**
 * Sanitizes a single user object for safe API exposure.
 * @param {Object} user - Mongoose document or plain object
 * @param {'detail'|'bulk'} [mode='bulk'] - detail shows more fields
 * @returns {Object} - Sanitized plain object
 */
export function sanitizeUser(user, mode = "bulk") {
  const obj = user?.toObject ? user.toObject() : { ...user };

  for (const field of ALWAYS_STRIP_FIELDS) {
    delete obj[field];
  }

  if (mode === "bulk") {
    for (const field of BULK_MASK_FIELDS) {
      if (obj[field]) {
        obj[field] = "[REDACTED]";
      }
    }
  }

  return obj;
}

/**
 * Sanitizes an array of user objects.
 * @param {Array} users
 * @param {'detail'|'bulk'} [mode='bulk']
 * @returns {Array}
 */
export function sanitizeUsers(users, mode = "bulk") {
  if (!Array.isArray(users)) return [];
  return users.map((u) => sanitizeUser(u, mode));
}

/**
 * Generic deep-strip of known sensitive keys from any response object.
 * @param {Object} obj
 * @returns {Object}
 */
export function stripSensitiveKeys(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(stripSensitiveKeys);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (ALWAYS_STRIP_FIELDS.has(key)) continue;
    result[key] = typeof value === "object" ? stripSensitiveKeys(value) : value;
  }
  return result;
}
