import mongoose from "mongoose";
import slugify from "slugify";
import Course from "../models/course.model.js";
import Category from "../models/category.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import imagekit from "../service/imagekit.js";
import { escapeRegex, generateUniqueCourseSlug, normalizeStringArray } from "../middlewares/regex.middleware.js";
import { renderCacheService } from "../service/renderCache.service.js";
export const createCourseController = asyncHandler(async (req, res) => {
  const {
    title,
    subtitle,
    description,
    categoryId,
    level,
    language,
    price,
    discountPrice,
    requirements,
    learningOutcomes,
  } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Course title is required",
    });
  }

  if (!description?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Course description is required",
    });
  }

  if (!categoryId) {
    return res.status(400).json({
      success: false,
      message: "Category ID is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }

  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found or inactive",
    });
  }

  const normalizedTitle = title.trim();

  const baseSlug = slugify(normalizedTitle, {
    lower: true,
    strict: true,
    trim: true,
  });

  if (!baseSlug) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid course title",
    });
  }

  const slug = await generateUniqueCourseSlug(baseSlug);

  const normalizedPrice =
    price === undefined || price === null || price === ""
      ? 0
      : Number(price);

  const normalizedDiscountPrice =
    discountPrice === undefined ||
    discountPrice === null ||
    discountPrice === ""
      ? null
      : Number(discountPrice);

  if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Price must be a valid non-negative number",
    });
  }

  if (
    normalizedDiscountPrice !== null &&
    (Number.isNaN(normalizedDiscountPrice) ||
      normalizedDiscountPrice < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Discount price must be a valid non-negative number",
    });
  }

  if (
    normalizedDiscountPrice !== null &&
    normalizedDiscountPrice >= normalizedPrice
  ) {
    return res.status(400).json({
      success: false,
      message: "Discount price must be less than the regular price",
    });
  }

  const course = await Course.create({
    title: normalizedTitle,
    slug,
    subtitle: subtitle?.trim() || "",
    description: description.trim(),
    category: category._id,
    instructor: req.user.id,
    level: level || "beginner",
    language: language?.trim() || "English",
    price: normalizedPrice,
    discountPrice: normalizedDiscountPrice,
    requirements: normalizeStringArray(requirements),
    learningOutcomes: normalizeStringArray(learningOutcomes),
  });

  const populatedCourse = await Course.findById(course._id)
    .populate("category", "name slug")
    .populate("instructor", "fullName email avatarUrl");

  return res.status(201).json({
    success: true,
    message: "Course created successfully",
    course: populatedCourse,
  });
});
export const getAllCoursesController = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    level,
    language,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    sort = "newest",
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  if (req.user && (req.user.role === "admin" || req.user.role === "instructor")) {
    if (req.user.role === "admin") {
      filter.isActive = true;
    } else {
      filter.$or = [
        { status: "published", isPublished: true, isActive: true },
        { instructor: req.user.id, isActive: true },
      ];
    }
  } else {
    filter.status = "published";
    filter.isPublished = true;
    filter.isActive = true;
  }

  if (search?.trim()) {
    filter.$text = {
      $search: search.trim(),
    };
  }

  if (level) {
    filter.level = level;
  }

  if (language?.trim()) {
    filter.language = {
      $regex: `^${escapeRegex(language.trim())}$`,
      $options: "i",
    };
  }

  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    } else {
      const categoryDocument = await Category.findOne({
        slug: category,
        isActive: true,
      }).select("_id");

      if (!categoryDocument) {
        return res.status(200).json({
          success: true,
          message: "Courses fetched successfully",
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            totalCourses: 0,
            totalPages: 0,
          },
          courses: [],
        });
      }

      filter.category = categoryDocument._id;
    }
  }

  const minimumPrice =
    minPrice === undefined || minPrice === ""
      ? null
      : Number(minPrice);

  const maximumPrice =
    maxPrice === undefined || maxPrice === ""
      ? null
      : Number(maxPrice);

  if (minimumPrice !== null && Number.isNaN(minimumPrice)) {
    return res.status(400).json({
      success: false,
      message: "minPrice must be a valid number",
    });
  }

  if (maximumPrice !== null && Number.isNaN(maximumPrice)) {
    return res.status(400).json({
      success: false,
      message: "maxPrice must be a valid number",
    });
  }

  if (
    minimumPrice !== null &&
    maximumPrice !== null &&
    minimumPrice > maximumPrice
  ) {
    return res.status(400).json({
      success: false,
      message: "minPrice cannot be greater than maxPrice",
    });
  }

  if (minimumPrice !== null || maximumPrice !== null) {
    filter.price = {};

    if (minimumPrice !== null) {
      filter.price.$gte = minimumPrice;
    }

    if (maximumPrice !== null) {
      filter.price.$lte = maximumPrice;
    }
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_low: { price: 1 },
    price_high: { price: -1 },
    rating: { averageRating: -1, totalReviews: -1 },
    popular: { enrolledStudentsCount: -1 },
  };

  const selectedSort = sortOptions[sort] || sortOptions.newest;

  const [courses, totalCourses] = await Promise.all([
    Course.find(filter)
      .populate("category", "name slug")
      .populate("instructor", "fullName avatarUrl")
      .select(
        "title slug subtitle thumbnailUrl category instructor level language price discountPrice averageRating totalReviews enrolledStudentsCount totalDurationInSeconds status isPublished isActive publishedAt totalModules totalLectures createdAt updatedAt",
      )
      .sort(selectedSort)
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Course.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    message: "Courses fetched successfully",
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalCourses,
      totalPages: Math.ceil(totalCourses / limitNumber),
    },
    courses,
  });
});

export const publishCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner =
    course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to publish this course",
    });
  }

  if (course.status === "published" && course.isPublished) {
    course.status = "draft";
    course.isPublished = false;
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Course unpublished successfully",
      course,
    });
  }

  if (!course.title || !course.description || !course.category) {
    return res.status(400).json({
      success: false,
      message: "Course information is incomplete",
    });
  }

  course.status = "published";
  course.isPublished = true;
  course.isActive = true;
  course.publishedAt = new Date();

  await course.save();

  // Invalidate SSR and fragment caches
  renderCacheService.purgeByTag(`course:${course.slug}`);
  renderCacheService.purgeByTag("catalog");

  return res.status(200).json({
    success: true,
    message: "Course published successfully",
    course,
  });
});
export const getCourseBySlugController = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const cacheKey = `api:course:${slug}`;
  const cacheResult = await renderCacheService.getOrRender({
    key: cacheKey,
    tags: [`course:${slug}`, "catalog"],
    ttlSeconds: 3600, // 1 hour in Redis / L1
    renderFn: async () => {
      const course = await Course.findOne({
        slug,
        status: "published",
        isPublished: true,
        isActive: true,
      })
        .populate("category", "name slug")
        .populate("instructor", "fullName avatarUrl")
        .select(
          "title slug subtitle description thumbnailUrl category instructor level language price discountPrice requirements learningOutcomes totalModules totalLectures totalDurationInSeconds enrolledStudentsCount averageRating totalReviews publishedAt",
        )
        .lean();

      if (!course) {
        const err = new Error("Course not found");
        err.statusCode = 404;
        throw err;
      }

      return {
        content: course,
      };
    },
  });

  res.setHeader("X-Cache-Status", cacheResult.isHit ? (cacheResult.isStale ? "STALE" : "HIT") : "MISS");
  res.setHeader("X-Cache-Tier", cacheResult.tier || "MEMORY");

  return res.status(200).json({
    success: true,
    message: "Course fetched successfully",
    course: cacheResult.content,
  });
});

export const updateCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const {
    title,
    subtitle,
    description,
    categoryId,
    level,
    language,
    price,
    discountPrice,
    requirements,
    learningOutcomes,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner =
    course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to update this course",
    });
  }

  if (title !== undefined) {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      return res.status(400).json({
        success: false,
        message: "Course title cannot be empty",
      });
    }

    const baseSlug = slugify(normalizedTitle, {
      lower: true,
      strict: true,
      trim: true,
    });

    const duplicateCourse = await Course.findOne({
      _id: { $ne: courseId },
      slug: baseSlug,
    });

    course.title = normalizedTitle;

    if (duplicateCourse) {
      course.slug = `${baseSlug}-${course._id.toString().slice(-6)}`;
    } else {
      course.slug = baseSlug;
    }
  }

  if (subtitle !== undefined) {
    course.subtitle = subtitle.trim();
  }

  if (description !== undefined) {
    const normalizedDescription = description.trim();

    if (!normalizedDescription) {
      return res.status(400).json({
        success: false,
        message: "Course description cannot be empty",
      });
    }

    course.description = normalizedDescription;
  }

  if (categoryId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    course.category = category._id;
  }

  if (level !== undefined) {
    const allowedLevels = [
      "beginner",
      "intermediate",
      "advanced",
      "all-levels",
    ];

    if (!allowedLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course level",
      });
    }

    course.level = level;
  }

  if (language !== undefined) {
    const normalizedLanguage = language.trim();

    if (!normalizedLanguage) {
      return res.status(400).json({
        success: false,
        message: "Language cannot be empty",
      });
    }

    course.language = normalizedLanguage;
  }

  const updatedPrice =
    price !== undefined ? Number(price) : course.price;

  const updatedDiscountPrice =
    discountPrice !== undefined
      ? discountPrice === null || discountPrice === ""
        ? null
        : Number(discountPrice)
      : course.discountPrice;

  if (Number.isNaN(updatedPrice) || updatedPrice < 0) {
    return res.status(400).json({
      success: false,
      message: "Price must be a valid non-negative number",
    });
  }

  if (
    updatedDiscountPrice !== null &&
    (Number.isNaN(updatedDiscountPrice) || updatedDiscountPrice < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Discount price must be a valid non-negative number",
    });
  }

  if (
    updatedDiscountPrice !== null &&
    updatedDiscountPrice >= updatedPrice
  ) {
    return res.status(400).json({
      success: false,
      message: "Discount price must be less than regular price",
    });
  }

  course.price = updatedPrice;
  course.discountPrice = updatedDiscountPrice;

  if (requirements !== undefined) {
    course.requirements = normalizeStringArray(requirements);
  }

  if (learningOutcomes !== undefined) {
    course.learningOutcomes =
      normalizeStringArray(learningOutcomes);
  }

  await course.save();

  // Invalidate SSR and fragment caches
  renderCacheService.purgeByTag(`course:${course.slug}`);
  renderCacheService.purgeByTag("catalog");

  const updatedCourse = await Course.findById(course._id)
    .populate("category", "name slug")
    .populate("instructor", "fullName email avatarUrl");

  return res.status(200).json({
    success: true,
    message: "Course updated successfully",
    course: updatedCourse,
  });
});

export const updateCourseThumbnailController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Course thumbnail image is required",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const isOwner =
      course.instructor.toString() === req.user.id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this course thumbnail",
      });
    }

    const uploadedImage = await imagekit.upload({
      file: req.file.buffer.toString("base64"),
      fileName: `course-${course._id}-${Date.now()}`,
      folder: "/lms/course-thumbnails",
      useUniqueFileName: true,
    });

    const oldThumbnailFileId = course.thumbnailFileId;

    course.thumbnailUrl = uploadedImage.url;
    course.thumbnailFileId = uploadedImage.fileId;

    await course.save();

    // Invalidate SSR cache
    renderCacheService.purgeByTag(`course:${course.slug}`);
    renderCacheService.purgeByTag("catalog");

    if (oldThumbnailFileId) {
      try {
        await imagekit.deleteFile(oldThumbnailFileId);
      } catch (error) {
        console.error(
          "Failed to delete old course thumbnail:",
          error.message,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Course thumbnail updated successfully",
      thumbnail: {
        url: course.thumbnailUrl,
        fileId: course.thumbnailFileId,
      },
    });
  },
);

export const archiveCourseController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  const course = await Course.findById(courseId);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner =
    course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to archive this course",
    });
  }

  if (!course.isActive && course.status === "archived") {
    return res.status(400).json({
      success: false,
      message: "Course is already archived",
    });
  }

  course.status = "archived";
  course.isActive = false;
  course.isPublished = false;

  await course.save();

  // Invalidate SSR cache
  renderCacheService.purgeByTag(`course:${course.slug}`);
  renderCacheService.purgeByTag("catalog");

  return res.status(200).json({
    success: true,
    message: "Course archived successfully",
  });
});