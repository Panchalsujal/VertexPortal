import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import zlib from "zlib";
import path from "path";
import { fileURLToPath } from "url";

// Security Middlewares
import {
  globalLimiter,
  authLimiter,
  aiLimiter,
  orderLimiter,
} from "./middlewares/rateLimiter.middleware.js";
import { sanitizeInput } from "./middlewares/sanitize.middleware.js";
import { circuitBreakerRegistry } from "./utils/circuitBreaker.js";

// Routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import categoryRouter from "./routes/category.routes.js";
import courseRouter from "./routes/course.routes.js";
import moduleRouter from "./routes/module.route.js";
import lectureRouter from "./routes/lecture.route.js";
import enrollmentRouter from "./routes/enrollment.routes.js";
import lectureProgressRouter from "./routes/lectureProgress.routes.js";
import reviewRouter from "./routes/review.route.js";
import wishlistRouter from "./routes/wishlist.route.js";
import cartRouter from "./routes/cart.route.js";
import couponRouter from "./routes/coupon.route.js";
import checkoutRouter from "./routes/checkout.route.js";
import orderRouter from "./routes/order.routes.js";
import studentRoutes from "./routes/student.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminLiveRoutes from "./routes/adminLive.routes.js";
import adminCouponRoutes from "./routes/adminCoupon.routes.js";
import adminAnalyticsRoutes from "./routes/adminAnalytics.routes.js";
import adminAuditRoutes from "./routes/adminAudit.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import adminCertificateRoutes from "./routes/adminCertificate.routes.js";
import instructorQuizRoutes from "./routes/instructorQuiz.routes.js";
import studentQuizRoutes from "./routes/studentQuiz.routes.js";
import instructorAssignmentRoutes from "./routes/instructorAssignment.routes.js";
import studentAssignmentRoutes from "./routes/studentAssignment.routes.js";
import instructorAnnouncementRoutes from "./routes/instructorAnnouncement.routes.js";
import studentAnnouncementRoutes from "./routes/studentAnnouncement.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import instructorLiveClassRoutes from "./routes/instructorLiveClass.routes.js";
import studentLiveClassRoutes from "./routes/studentLiveClass.routes.js";
import discussionRoutes from "./routes/discussion.routes.js";
import discussionReportRoutes from "./routes/discussionReport.routes.js";
import adminDiscussionReportRoutes from "./routes/adminDiscussionReport.routes.js";
import adminNoteRoutes from "./routes/adminNote.routes.js";
import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import adminCourseRoutes from "./routes/adminCourse.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import instructorDashboardRoutes from "./routes/instructorDashboard.routes.js";
import aiAssistantRoutes from "./routes/aiAssistant.routes.js";
import ragRoutes from "./routes/rag.routes.js";
import ragIndexingRouter from "./routes/ragIndexing.routes.js";
import studentNoteRoutes from "./routes/studentNote.routes.js";
import ssrRoutes from "./routes/ssr.routes.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import seoRoutes from "./routes/seo.routes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// SECURITY & ENVIRONMENT CONFIGURATION
// ============================================

// Disable Express fingerprinting header
app.disable("x-powered-by");

// Trust reverse proxy (essential for rate limiting & secure cookies on Vercel/Render/Cloudflare)
app.set("trust proxy", 1);

// HTTP Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // APIs return JSON; prevents blocking external embeds/assets
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows static images/uploads to be loaded by frontend
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Permits Google OAuth popup postMessage communication
  })
);

// Allowed Origins for CORS
const staticAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:4173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
  "https://navgujaratacademy.online",
  "https://www.navgujaratacademy.online",
  "https://vertex-mu-eight.vercel.app",
];

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) =>
      url.trim().replace(/\/$/, "")
    )
  : [];

const allowedOrigins = Array.from(
  new Set([...staticAllowedOrigins, ...envOrigins])
);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");

    // Check whitelist or authorized vercel.app deployments
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      /^https:\/\/([a-zA-Z0-9-]+\.)?vercel\.app$/.test(normalizedOrigin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error("CORS policy violation: Access not allowed from this origin"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Range",
  ],
  exposedHeaders: ["Set-Cookie"],
};

// CORS Middleware
app.use(cors(corsOptions));

// HTTP Compression (Gzip & Brotli for JSON/text responses >= 1KB)
app.use(
  compression({
    // Only compress responses exceeding 1KB threshold to prevent CPU overhead on tiny responses
    threshold: 1024,
    // Custom filter to respect client opt-out (x-no-compression) and check compressible content-types
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    // Brotli compression options
    brotli: {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
      },
    },
    // Gzip compression level
    level: 6,
  })
);

// Logging
app.use(morgan("dev"));

// Body Parsers with payload size limits to prevent DoS
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Prevent HTTP Parameter Pollution (e.g. ?id=1&id=2)
app.use(hpp());

// Sanitize inputs to prevent MongoDB NoSQL Injection ($gt, $ne, etc.)
app.use(sanitizeInput);

// Global API rate limiting
app.use("/api", globalLimiter);

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Ignore /favicon.ico requests to avoid 404 logs
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Health check endpoints & Circuit Breakers Monitoring
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));

const getCircuitBreakersHealthHandler = (req, res) => {
  const breakers = circuitBreakerRegistry.getAllStatus();
  const hasOpenBreakers = Object.values(breakers).some((b) => b.state === "OPEN");
  return res.status(hasOpenBreakers ? 503 : 200).json({
    status: hasOpenBreakers ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    breakers,
  });
};

app.get("/health/circuit-breakers", getCircuitBreakersHealthHandler);
app.get("/api/health/circuit-breakers", getCircuitBreakersHealthHandler);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the NavGujarat Academy API" });
});

// ============================================
// ROUTES MOUNTING (WITH SPECIALIZED RATE LIMITERS)
// ============================================

// Auth & Users (with strict anti-bruteforce limiter)
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);

// Specific Admin Sub-Routes (MUST be mounted before general /api/admin)
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/notes", adminNoteRoutes);
app.use("/api/admin/live-classes", adminLiveRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/audit-logs", adminAuditRoutes);
app.use("/api/admin/certificates", adminCertificateRoutes);
app.use("/api/admin/discussion-reports", adminDiscussionReportRoutes);

// Fallback General Admin Routes
app.use("/api/admin", adminRoutes);

// Student & Instructor Portal Routes
app.use("/api/categories", categoryRouter);
app.use("/api/student", studentRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/courses", courseRouter);
app.use("/api/modules", moduleRouter);
app.use("/api/lectures", lectureRouter);
app.use("/api/ai/rag", aiLimiter, ragRoutes);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api", lectureProgressRouter);
app.use("/api", reviewRouter);
app.use("/api", wishlistRouter);
app.use("/api/cart", cartRouter);
app.use("/api", couponRouter);
app.use("/api", orderLimiter, checkoutRouter);
app.use("/api/orders", orderLimiter, orderRouter);
app.use("/api/seo", seoRoutes);
app.use("/api/instructor/quizzes", instructorQuizRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/student/quizzes", studentQuizRoutes);
app.use("/api/instructor/assignments", instructorAssignmentRoutes);
app.use("/api/instructor/announcements", instructorAnnouncementRoutes);
app.use("/api/student/assignments", studentAssignmentRoutes);
app.use("/api/student/announcements", studentAnnouncementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/instructor/live-classes", instructorLiveClassRoutes);
app.use("/api/student/live-classes", studentLiveClassRoutes);
app.use("/api/discussion-reports", discussionReportRoutes);
app.use("/api/ai", aiLimiter, aiAssistantRoutes);
app.use("/api/ai/indexing", ragIndexingRouter);
app.use("/api/notes", studentNoteRoutes);
app.use("/api/instructor/dashboard", instructorDashboardRoutes);

// Server-Side Rendered (SSR) & Cached Fragment Routes
app.use("/ssr", ssrRoutes);
app.use("/api/ssr", ssrRoutes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
