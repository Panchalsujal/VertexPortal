import mongoose from "mongoose";

import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Enrollment from "../models/enrollment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createCourseModuleController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  if (!title?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Module title is required",
    });
  }

  const course = await Course.findById(courseId);

  if (!course || !course.isActive) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner = course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You cannot add modules to this course",
    });
  }

  const lastModule = await CourseModule.findOne({
    course: courseId,
    isActive: true,
  })
    .sort({ order: -1 })
    .select("order")
    .lean();

  const ORDER_GAP = 1000;

  const nextOrder = lastModule ? lastModule.order + ORDER_GAP : ORDER_GAP;

  const courseModule = await CourseModule.create({
    course: courseId,
    title: title.trim(),
    description: description?.trim() || "",
    order: nextOrder,
  });

  course.totalModules = await CourseModule.countDocuments({
    course: courseId,
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

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      isActive: true,
    }).select("_id instructor");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let moduleFilter = {
      course: courseId,
      isActive: true,
      isPublished: true,
    };

    if (req.user) {
      const isAdmin = req.user.role === "admin";
      const isOwner = course.instructor?.toString() === req.user.id?.toString();
      const isEnrolled = await Enrollment.exists({
        student: req.user.id,
        course: courseId,
        status: { $in: ["active", "completed"] },
      });

      if (isAdmin || isOwner || isEnrolled) {
        moduleFilter = {
          course: courseId,
          isActive: true,
        };
      }
    }

    const modules = await CourseModule.find(moduleFilter)
      .sort({ order: 1 })
      .select("title description order totalLectures totalDurationInSeconds isPublished")
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

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(courseId).select(
      "_id instructor isActive",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const isOwner = course.instructor.toString() === req.user.id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage this course",
      });
    }

    const modules = await CourseModule.find({
      course: courseId,
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
  const allowedFields = ["title", "description", "isPublished"];

  const hasValidField = allowedFields.some(
    (field) => req.body[field] !== undefined,
  );

  if (!hasValidField) {
    return res.status(400).json({
      success: false,
      message: "Provide at least one field to update",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  const courseModule = await CourseModule.findById(moduleId);

  console.log(courseModule);

  if (!courseModule) {
    return res.status(404).json({
      success: false,
      message: "Course module not found",
    });
  }

  const course = await Course.findById(courseModule.course).select(
    "instructor isActive",
  );

  if (!course || !course.isActive) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner = course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to update this module",
    });
  }

  if (title !== undefined) {
    const normalizedTitle = String(title).trim();

    if (normalizedTitle.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Module title must contain at least 2 characters",
      });
    }

    courseModule.title = normalizedTitle;
  }

  if (description !== undefined) {
    courseModule.description = String(description).trim();
  }

  if (isPublished !== undefined) {
    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPublished must be a boolean value",
      });
    }

    courseModule.isPublished = isPublished;
  }

  if (courseModule.isActive && (courseModule.order === null || courseModule.order === undefined)) {
    const lastModule = await CourseModule.findOne({
      course: courseModule.course,
      isActive: true,
      _id: { $ne: courseModule._id },
    })
      .sort({ order: -1 })
      .select("order")
      .lean();

    const ORDER_GAP = 1000;
    courseModule.order = lastModule ? (lastModule.order || 0) + ORDER_GAP : ORDER_GAP;
  }

  await courseModule.save();

  return res.status(200).json({
    success: true,
    message: "Course module updated successfully",
    module: courseModule,
  });
});

export const archiveCourseModuleController = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  const courseModule = await CourseModule.findOne({
    _id: moduleId,
    isActive: true,
  });

  if (!courseModule) {
    return res.status(404).json({
      success: false,
      message: "Course module not found",
    });
  }

  const course = await Course.findById(courseModule.course).select(
    "instructor totalModules isActive",
  );

  if (!course || !course.isActive) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner = course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You cannot archive this module",
    });
  }

  courseModule.isActive = false;
  courseModule.isPublished = false;
  courseModule.order = null;

  await courseModule.save();

  course.totalModules = await CourseModule.countDocuments({
    course: courseModule.course,
    isActive: true,
  });

  await course.save();

  return res.status(200).json({
    success: true,
    message: "Course module archived successfully",
  });
});

export const CourseModulePublishController = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  const courseModule = await CourseModule.findById(moduleId);

  if (!courseModule) {
    return res.status(404).json({
      success: false,
      message: "Course module not found",
    });
  }

  const course = await Course.findById(courseModule.course).select(
    "instructor isActive",
  );

  if (!course || !course.isActive) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  const isOwner = course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to publish this module",
    });
  }

  courseModule.isPublished = true;
  courseModule.isActive = true;

  if (courseModule.order === null || courseModule.order === undefined) {
    const lastModule = await CourseModule.findOne({
      course: courseModule.course,
      isActive: true,
      _id: { $ne: courseModule._id },
    })
      .sort({ order: -1 })
      .select("order")
      .lean();

    const ORDER_GAP = 1000;
    courseModule.order = lastModule ? (lastModule.order || 0) + ORDER_GAP : ORDER_GAP;
  }

  await courseModule.save();

  return res.status(200).json({
    success: true,
    message: "Course module published successfully",
    module: courseModule,
  });
});

const ORDER_GAP = 1000;

export const reorderCourseModuleController = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const { previousModuleId = null, nextModuleId = null } = req.body;

  // -----------------------------
  // 1. Validate IDs
  // -----------------------------
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  if (
    previousModuleId &&
    !mongoose.Types.ObjectId.isValid(previousModuleId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid previous module ID",
    });
  }

  if (
    nextModuleId &&
    !mongoose.Types.ObjectId.isValid(nextModuleId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid next module ID",
    });
  }

  if (
    moduleId === previousModuleId ||
    moduleId === nextModuleId
  ) {
    return res.status(400).json({
      success: false,
      message: "Module cannot be placed relative to itself",
    });
  }

  // -----------------------------
  // 2. Find target module
  // -----------------------------
  const courseModule = await CourseModule.findOne({
    _id: moduleId,
    isActive: true,
  });

  if (!courseModule) {
    return res.status(404).json({
      success: false,
      message: "Course module not found",
    });
  }

  // -----------------------------
  // 3. Check course and ownership
  // -----------------------------
  const course = await Course.findOne({
    _id: courseModule.course,
    isActive: true,
  }).select("instructor");

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
      message: "You cannot reorder modules in this course",
    });
  }

  // -----------------------------
  // 4. Fetch all active modules
  // -----------------------------
  const allModules = await CourseModule.find({
    course: courseModule.course,
    isActive: true,
  })
    .sort({ order: 1, createdAt: 1 })
    .select("_id title order isPublished");

  if (allModules.length <= 1) {
    return res.status(200).json({
      success: true,
      message: "Module is already in the correct position",
      modules: allModules,
    });
  }

  // Remove target module from existing list
  const targetModule = allModules.find(
    (module) => module._id.toString() === moduleId,
  );

  const remainingModules = allModules.filter(
    (module) => module._id.toString() !== moduleId,
  );

  if (!targetModule) {
    return res.status(404).json({
      success: false,
      message: "Target module not found",
    });
  }

  // -----------------------------
  // 5. Validate previous/next modules
  // -----------------------------
  const previousIndex = previousModuleId
    ? remainingModules.findIndex(
        (module) =>
          module._id.toString() === previousModuleId,
      )
    : -1;

  const nextIndex = nextModuleId
    ? remainingModules.findIndex(
        (module) =>
          module._id.toString() === nextModuleId,
      )
    : -1;

  if (previousModuleId && previousIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Previous module not found in this course",
    });
  }

  if (nextModuleId && nextIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Next module not found in this course",
    });
  }

  if (
    previousModuleId &&
    nextModuleId &&
    previousIndex + 1 !== nextIndex
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Previous and next modules must be adjacent in the final sequence",
    });
  }

  // -----------------------------
  // 6. Calculate insertion position
  // -----------------------------
  let insertIndex;

  // First position
  if (!previousModuleId && nextModuleId) {
    insertIndex = nextIndex;
  }

  // Last position
  else if (previousModuleId && !nextModuleId) {
    insertIndex = previousIndex + 1;
  }

  // Between two modules
  else if (previousModuleId && nextModuleId) {
    insertIndex = nextIndex;
  }

  // No previous and next means only/default first position
  else {
    insertIndex = 0;
  }

  remainingModules.splice(insertIndex, 0, targetModule);

  // -----------------------------
  // 7. Reassign orders safely
  // -----------------------------
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      /*
       * First set all active module orders to null.
       * Partial unique index ignores null orders.
       * This prevents E11000 during reassignment.
       */
      await CourseModule.updateMany(
        {
          course: courseModule.course,
          isActive: true,
        },
        {
          $set: {
            order: null,
          },
        },
        {
          session,
        },
      );

      const operations = remainingModules.map(
        (module, index) => ({
          updateOne: {
            filter: {
              _id: module._id,
              course: courseModule.course,
              isActive: true,
            },
            update: {
              $set: {
                order: (index + 1) * ORDER_GAP,
              },
            },
          },
        }),
      );

      if (operations.length > 0) {
        await CourseModule.bulkWrite(operations, {
          session,
          ordered: true,
        });
      }
    });
  } finally {
    await session.endSession();
  }

  // -----------------------------
  // 8. Return updated sequence
  // -----------------------------
  const reorderedModules = await CourseModule.find({
    course: courseModule.course,
    isActive: true,
  })
    .sort({ order: 1 })
    .select("title description order isPublished")
    .lean();

  return res.status(200).json({
    success: true,
    message: "Course modules reordered successfully",
    modules: reorderedModules,
  });
});