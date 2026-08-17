import slugify from "slugify";
import Category from "../models/category.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../middlewares/regex.middleware.js";
import mongoose from "mongoose";
import { renderCacheService } from "../service/renderCache.service.js";

export const createCategoryController = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  const normalizedName = name.trim();

  const slug = slugify(normalizedName, {
    lower: true,
    strict: true,
    trim: true,
  });

  if (!slug) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid category name",
    });
  }

  const existingCategory = await Category.findOne({
    $or: [
      { name: { $regex: `^${escapeRegex(normalizedName)}$`, $options: "i" } },
      { slug },
    ],
  });

  if (existingCategory) {
    return res.status(409).json({
      success: false,
      message: "Category already exists",
    });
  }

  const category = await Category.create({
    name: normalizedName,
    slug,
    description: description?.trim() || "",
  });

  renderCacheService.purgeByTag("catalog");
  renderCacheService.purgeByTag("categories");

  return res.status(201).json({
    success: true,
    message: "Category created successfully",
    category,
  });
});



export const getAllCategoriesController = asyncHandler(async (req, res) => {
  const cacheKey = "api:categories:all";
  const cacheResult = await renderCacheService.getOrRender({
    key: cacheKey,
    tags: ["categories", "catalog"],
    ttlSeconds: 1800, // 30 minutes in Redis
    renderFn: async () => {
      const categories = await Category.find({
        isActive: true,
      })
        .sort({ name: 1 })
        .select("name slug description")
        .lean();

      return {
        content: categories,
      };
    },
  });

  res.setHeader("X-Cache-Status", cacheResult.isHit ? (cacheResult.isStale ? "STALE" : "HIT") : "MISS");
  res.setHeader("X-Cache-Tier", cacheResult.tier || "MEMORY");

  const categories = cacheResult.content || [];

  return res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    count: categories.length,
    categories,
  });
});

export const getCategoryBySlugController = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const cacheKey = `api:category:${slug}`;
  const cacheResult = await renderCacheService.getOrRender({
    key: cacheKey,
    tags: ["categories", "catalog"],
    ttlSeconds: 1800,
    renderFn: async () => {
      const category = await Category.findOne({
        slug,
        isActive: true,
      }).select("name slug description createdAt").lean();

      if (!category) {
        const err = new Error("Category not found");
        err.statusCode = 404;
        throw err;
      }

      return {
        content: category,
      };
    },
  });

  res.setHeader("X-Cache-Status", cacheResult.isHit ? (cacheResult.isStale ? "STALE" : "HIT") : "MISS");
  res.setHeader("X-Cache-Tier", cacheResult.tier || "MEMORY");

  return res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    category: cacheResult.content,
  });
});


export const updateCategoryController = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { name, description, isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  if (name !== undefined) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Category name cannot be empty",
      });
    }

    const newSlug = slugify(normalizedName, {
      lower: true,
      strict: true,
      trim: true,
    });

    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId },
      $or: [
        {
          name: {
            $regex: `^${escapeRegex(normalizedName)}$`,
            $options: "i",
          },
        },
        { slug: newSlug },
      ],
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Another category already exists with this name",
      });
    }

    category.name = normalizedName;
    category.slug = newSlug;
  }

  if (description !== undefined) {
    category.description = description.trim();
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    category.isActive = isActive;
  }

  await category.save();

  renderCacheService.purgeByTag("catalog");
  renderCacheService.purgeByTag("categories");

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category,
  });
});


export const deleteCategoryController = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category id",
    });
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  category.isActive = false;

  await category.save();

  renderCacheService.purgeByTag("catalog");
  renderCacheService.purgeByTag("categories");

  return res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
