import mongoose from "mongoose";

import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Enrollment from "../models/enrollment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper for robust instructor ownership verification
const checkOwnership = (courseInstructor, user) => {
  if (!courseInstructor || !user) return false;
  const instructorId = (courseInstructor._id || courseInstructor).toString();
  const userId = (user._id || user.id || user).toString();
  return instructorId === userId;
};

// Helper to find course by ObjectId or Slug
const findCourseByIdOrSlug = async (courseIdOrSlug, selectFields) => {
  let query;
  if (mongoose.Types.ObjectId.isValid(courseIdOrSlug)) {
    query = Course.findById(courseIdOrSlug);
  } else {
    query = Course.findOne({ slug: courseIdOrSlug });
  }
  if (selectFields) {
    query = query.select(selectFields);
  }
  return await query;
};

export const createCourseModuleController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Module title is required",
    });
  }

  const course = await findCourseByIdOrSlug(courseId);

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner = checkOwnership(course.instructor, req.user);
  const isAdmin = req.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You cannot add modules to this course",
    });
  }

  const lastModule = await CourseModule.findOne({
    course: course._id,
    isActive: true,
  })
    .sort({ order: -1 })
    .select("order")
    .lean();

  const ORDER_GAP = 1000;

  const nextOrder = lastModule ? lastModule.order + ORDER_GAP : ORDER_GAP;

  const courseModule = await CourseModule.create({
    course: course._id,
    title: title.trim(),
    description: description?.trim() || "",
    order: nextOrder,
  });

  course.totalModules = await CourseModule.countDocuments({
    course: course._id,
    isActive: true,
  });

  await course.save();

  return res.status(201).json({
    success: true,
    message: "Course module created successfully",
    module: courseModule,
  });
});

export const getPublishedCourseModulesController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    const course = await findCourseByIdOrSlug(courseId, "_id instructor");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let moduleFilter = {
      course: course._id,
      isActive: true,
      isPublished: true,
    };

    if (req.user) {
      const isAdmin = req.user.role === "admin";
      const isOwner = checkOwnership(course.instructor, req.user);
      const isEnrolled = await Enrollment.exists({
        student: req.user._id || req.user.id,
        course: course._id,
        status: { $in: ["active", "completed"] },
      });

      if (isAdmin || isOwner || isEnrolled) {
        moduleFilter = {
          course: course._id,
          isActive: true,
        };
      }
    }

    const modules = await CourseModule.find(moduleFilter)
      .sort({ order: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Course modules fetched successfully",
      count: modules.length,
      modules,
    });
  },
);

export const getManageCourseModulesController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    const course = await findCourseByIdOrSlug(courseId, "_id instructor isActive");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const isOwner = checkOwnership(course.instructor, req.user);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage this course",
      });
    }

    const modules = await CourseModule.find({
      course: course._id,
    })
      .sort({ order: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Course modules fetched successfully",
      count: modules.length,
      modules,
    });
  },
);

export const updateCourseModuleController = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const { title, description, isPublished } = req.body;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  const moduleDoc = await CourseModule.findById(moduleId);

  if (!moduleDoc) {
    return res.status(404).json({
      success: false,
      message: "Module not found",
    });
  }

  const course = await Course.findById(moduleDoc.course).select(
    "_id instructor",
  );

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course associated with module not found",
    });
  }

  const isOwner = checkOwnership(course.instructor, req.user);
  const isAdmin = req.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You cannot update this module",
    });
  }

  if (title !== undefined) {
    if (!title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }
    moduleDoc.title = title.trim();
  }

  if (description !== undefined) {
    moduleDoc.description = description.trim();
  }

  if (typeof isPublished === "boolean") {
    moduleDoc.isPublished = isPublished;
  }

  await moduleDoc.save();

  return res.status(200).json({
    success: true,
    message: "Module updated successfully",
    module: moduleDoc,
  });
});

export const archiveCourseModuleController = asyncHandler(
  async (req, res) => {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const moduleDoc = await CourseModule.findById(moduleId);

    if (!moduleDoc || !moduleDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    const course = await Course.findById(moduleDoc.course).select(
      "_id instructor",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course associated with module not found",
      });
    }

    const isOwner = checkOwnership(course.instructor, req.user);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot archive this module",
      });
    }

    moduleDoc.isActive = false;
    moduleDoc.isPublished = false;
    await moduleDoc.save();

    course.totalModules = await CourseModule.countDocuments({
      course: course._id,
      isActive: true,
    });

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Module archived successfully",
    });
  },
);

export const CourseModulePublishController = asyncHandler(
  async (req, res) => {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID",
      });
    }

    const moduleDoc = await CourseModule.findById(moduleId);

    if (!moduleDoc || !moduleDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    const course = await Course.findById(moduleDoc.course).select(
      "_id instructor",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course associated with module not found",
      });
    }

    const isOwner = checkOwnership(course.instructor, req.user);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot change publish status of this module",
      });
    }

    moduleDoc.isPublished = !moduleDoc.isPublished;
    await moduleDoc.save();

    return res.status(200).json({
      success: true,
      message: `Module ${moduleDoc.isPublished ? "published" : "unpublished"} successfully`,
      module: moduleDoc,
    });
  },
);

export const reorderCourseModuleController = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const { previousModuleId, nextModuleId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  const currentModule = await CourseModule.findById(moduleId);

  if (!currentModule || !currentModule.isActive) {
    return res.status(404).json({
      success: false,
      message: "Module not found",
    });
  }

  const course = await Course.findById(currentModule.course).select(
    "_id instructor",
  );

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course associated with module not found",
    });
  }

  const isOwner = checkOwnership(course.instructor, req.user);
  const isAdmin = req.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You cannot reorder modules in this course",
    });
  }

  let prevOrder = null;
  let nextOrder = null;

  if (previousModuleId) {
    const prevMod = await CourseModule.findById(previousModuleId).select(
      "order",
    );
    if (prevMod) prevOrder = prevMod.order;
  }

  if (nextModuleId) {
    const nextMod = await CourseModule.findById(nextModuleId).select("order");
    if (nextMod) nextOrder = nextMod.order;
  }

  const ORDER_GAP = 1000;
  let newOrder;

  if (prevOrder !== null && nextOrder !== null) {
    newOrder = Math.round((prevOrder + nextOrder) / 2);
  } else if (prevOrder !== null) {
    newOrder = prevOrder + ORDER_GAP;
  } else if (nextOrder !== null) {
    newOrder = Math.max(1, nextOrder - ORDER_GAP);
  } else {
    newOrder = currentModule.order;
  }

  currentModule.order = newOrder;
  await currentModule.save();

  return res.status(200).json({
    success: true,
    message: "Module reordered successfully",
    module: currentModule,
  });
});