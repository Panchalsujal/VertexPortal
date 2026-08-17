import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { renderCacheService } from "../service/renderCache.service.js";
import { serverRenderService } from "../service/serverRender.service.js";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Certificate from "../models/certificate.model.js";
import Category from "../models/category.model.js";
import Enrollment from "../models/enrollment.model.js";

const router = Router();

/**
 * @route GET /ssr/courses/:slug
 * @desc Get server-rendered course page or fragment with locale awareness and dynamic holes
 * @access Public (Optional Auth for dynamic hole hydration)
 */
router.get(
  "/courses/:slug",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const isFragment = req.query.format === "fragment" || req.headers["x-fragment-request"] === "true";
    const locale = renderCacheService.normalizeLocale(req);

    const cacheKey = renderCacheService.generateCacheKey({
      route: "courses",
      params: { slug, isFragment },
      query: {},
      locale,
      format: isFragment ? "fragment" : "html",
    });

    const cacheResult = await renderCacheService.getOrRender({
      key: cacheKey,
      tags: [`course:${slug}`, "catalog"],
      ttlSeconds: 3600, // 1 hour TTL
      renderFn: async () => {
        const course = await Course.findOne({
          slug,
          status: "published",
          isPublished: true,
          isActive: true,
        })
          .populate("category", "name slug")
          .populate("instructor", "fullName avatarUrl")
          .lean();

        if (!course) {
          const err = new Error("Course not found");
          err.statusCode = 404;
          throw err;
        }

        const modules = await CourseModule.find({
          course: course._id,
          isActive: true,
          isPublished: true,
        })
          .sort({ order: 1 })
          .lean();

        const renderedContent = serverRenderService.renderCourseDetail({
          course,
          modules,
          isFragment,
          locale,
        });

        return {
          content: renderedContent,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600",
          },
        };
      },
    });

    let finalHtml = cacheResult.content;

    // Dynamically fill personalized holes if user is authenticated
    if (req.user) {
      let isEnrolled = false;
      let progressPercent = 0;

      // Check if user is enrolled
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        courseSlug: slug,
        status: "active",
      }).lean();

      if (enrollment) {
        isEnrolled = true;
        progressPercent = enrollment.progressPercentage || 0;
      }

      finalHtml = serverRenderService.fillDynamicHoles(
        finalHtml,
        {
          user: req.user,
          isEnrolled,
          progressPercent,
          courseSlug: slug,
        },
        locale
      );
    }

    res.setHeader("X-Cache-Status", cacheResult.isHit ? (cacheResult.isStale ? "STALE" : "HIT") : "MISS");
    res.setHeader("X-Locale", locale);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(finalHtml);
  })
);

/**
 * @route GET /ssr/certificates/:verificationCode
 * @desc Get server-rendered certificate verification view or fragment
 * @access Public
 */
router.get(
  "/certificates/:verificationCode",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const { verificationCode } = req.params;
    const isFragment = req.query.format === "fragment" || req.headers["x-fragment-request"] === "true";
    const locale = renderCacheService.normalizeLocale(req);

    const cacheKey = renderCacheService.generateCacheKey({
      route: "certificates",
      params: { verificationCode, isFragment },
      query: {},
      locale,
      format: isFragment ? "fragment" : "html",
    });

    const cacheResult = await renderCacheService.getOrRender({
      key: cacheKey,
      tags: [`certificate:${verificationCode}`],
      ttlSeconds: 86400, // 24 hours TTL for immutable credentials
      renderFn: async () => {
        const normalizedCode = verificationCode.toUpperCase().trim();
        const certificate = await Certificate.findOne({
          $or: [
            { verificationCode: normalizedCode },
            { certificateNumber: normalizedCode },
          ],
        })
          .populate("student", "fullName email")
          .populate("course", "title slug")
          .lean();

        if (!certificate) {
          const err = new Error("Certificate record not found");
          err.statusCode = 404;
          throw err;
        }

        const isValid = certificate.status !== "revoked";
        const renderedContent = serverRenderService.renderCertificateVerification({
          certificate,
          isValid,
          isFragment,
          locale,
        });

        return {
          content: renderedContent,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        };
      },
    });

    let finalHtml = cacheResult.content;
    if (req.user) {
      finalHtml = serverRenderService.fillDynamicHoles(
        finalHtml,
        { user: req.user },
        locale
      );
    }

    res.setHeader("X-Cache-Status", cacheResult.isHit ? (cacheResult.isStale ? "STALE" : "HIT") : "MISS");
    res.setHeader("X-Locale", locale);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(finalHtml);
  })
);

/**
 * @route GET /ssr/catalog
 * @desc Get server-rendered catalog and categories fragment
 * @access Public
 */
router.get(
  "/catalog",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const locale = renderCacheService.normalizeLocale(req);
    const category = req.query.category || "";

    const cacheKey = renderCacheService.generateCacheKey({
      route: "catalog",
      params: {},
      query: { category },
      locale,
      format: "fragment",
    });

    const cacheResult = await renderCacheService.getOrRender({
      key: cacheKey,
      tags: ["catalog", "categories"],
      ttlSeconds: 600, // 10 minutes TTL
      renderFn: async () => {
        const filter = {
          status: "published",
          isPublished: true,
          isActive: true,
        };

        const [courses, categories] = await Promise.all([
          Course.find(filter)
            .populate("instructor", "fullName avatarUrl")
            .select("title slug thumbnailUrl price averageRating instructor")
            .limit(12)
            .lean(),
          Category.find({ isActive: true }).select("name slug").lean(),
        ]);

        const renderedContent = serverRenderService.renderCatalogFragment({
          courses,
          categories,
          locale,
        });

        return {
          content: renderedContent,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        };
      },
    });

    res.setHeader("X-Cache-Status", cacheResult.isHit ? "HIT" : "MISS");
    res.setHeader("X-Locale", locale);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(cacheResult.content);
  })
);

/**
 * @route GET /ssr/stats
 * @desc Get SSR cache performance metrics & render load savings
 * @access Public
 */
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const stats = renderCacheService.getStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  })
);

/**
 * @route POST /ssr/cache/purge
 * @desc Purge cache by tag, key, or flush all
 * @access Public / Internal
 */
router.post(
  "/cache/purge",
  asyncHandler(async (req, res) => {
    const { tag, key, all } = req.body || {};

    if (all) {
      const count = renderCacheService.flushAll();
      return res.status(200).json({
        success: true,
        message: `Flushed all ${count} entries from SSR cache`,
      });
    }

    if (tag) {
      const count = renderCacheService.purgeByTag(tag);
      return res.status(200).json({
        success: true,
        message: `Purged ${count} entries tagged with "${tag}"`,
      });
    }

    if (key) {
      const purged = renderCacheService.purgeKey(key);
      return res.status(200).json({
        success: true,
        message: purged ? `Purged key "${key}"` : "Key not found in cache",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Please specify 'tag', 'key', or 'all: true'",
    });
  })
);

export default router;
