import rateLimit from "express-rate-limit";

/**
 * Standard handler for when a rate limit is exceeded
 */
const rateLimitHandler = (message) => (req, res) => {
  return res.status(429).json({
    success: false,
    message: message || "Too many requests from this IP. Please try again later.",
  });
};

/**
 * General API rate limiter (protects against overall spam/DoS)
 * 500 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many requests from this IP. Please try again after 15 minutes."),
});

/**
 * Strict rate limiter for Authentication routes
 * Protects against brute-force password guessing & OTP spamming
 * 20 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many authentication attempts. Please try again after 15 minutes."),
});

/**
 * Layer 1: Ultra-strict rate limiter for Admin/Instructor login attempts
 * Only 5 requests per 15 minutes per IP — admins should never be brute-forced
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: rateLimitHandler(
    "Too many admin login attempts from this IP. Access is temporarily blocked. Please try again after 15 minutes."
  ),
});

/**
 * AI Endpoints rate limiter
 * Protects against expensive LLM API abuse
 * 40 requests per 1 minute per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many AI requests. Please slow down and try again shortly."),
});

/**
 * Checkout & Orders rate limiter
 * Prevents fraudulent payment spam and card testing attacks
 * 30 requests per 15 minutes per IP
 */
export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler("Too many order/checkout requests. Please try again later."),
});
