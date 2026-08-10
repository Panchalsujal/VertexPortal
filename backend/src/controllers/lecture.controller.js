// controllers/lecture.controller.js

import mongoose from "mongoose";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import imagekit from "../service/imagekit.js";
import Enrollment from "../models/enrollment.model.js";
import { config } from "../config/config.js";
import {
  ingestLectureForRag,
  deleteRagResource,
} from "../service/rag.service.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORDER_GAP = 1000;

const ALLOWED_LECTURE_TYPES = ["video", "text", "document", "quiz", "live"];

export const createLectureController = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  const {
    title,
    description,
    type = "video",
    content,
    durationInSeconds = 0,
    isPreview = false,
  } = req.body;

  // 1. Validate module ID
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid module ID",
    });
  }

  // 2. Validate title
  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Lecture title must contain at least 2 characters",
    });
  }

  // 3. Validate lecture type
  if (!ALLOWED_LECTURE_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Lecture type must be one of: ${ALLOWED_LECTURE_TYPES.join(
        ", ",
      )}`,
    });
  }

  // 4. Validate duration
  const normalizedDuration = Number(durationInSeconds);

  if (!Number.isFinite(normalizedDuration) || normalizedDuration < 0) {
    return res.status(400).json({
      success: false,
      message: "durationInSeconds must be a valid non-negative number",
    });
  }

  // 5. Validate preview value
  if (typeof isPreview !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isPreview must be a boolean value",
    });
  }

  // 6. Find module
  const courseModule = await CourseModule.findOne({
    _id: moduleId,
    isActive: true,
  }).select("course title isActive");

  if (!courseModule) {
    return res.status(404).json({
      success: false,
      message: "Course module not found",
    });
  }

  // 7. Find course
  const course = await Course.findOne({
    _id: courseModule.course,
    isActive: true,
  }).select("instructor totalLectures totalDurationInSeconds");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  // 8. Check ownership
  const isOwner = course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You cannot add lectures to this course",
    });
  }

  // 9. Validate type-specific fields
  if (type === "text" && !String(content || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "Content is required for a text lecture",
    });
  }

  /*
   * Video/document file upload alag endpoint se hoga.
   * Isliye create time par URL required nahi rakha.
   */

  // 10. Find last active lecture
  const lastLecture = await Lecture.findOne({
    module: courseModule._id,
    isActive: true,
    order: {
      $type: "number",
    },
  })
    .sort({ order: -1 })
    .select("order")
    .lean();

  const nextOrder = lastLecture ? lastLecture.order + ORDER_GAP : ORDER_GAP;

  // 11. Create lecture
  const lecture = await Lecture.create({
    course: course._id,
    module: courseModule._id,
    title: normalizedTitle,
    description: String(description || "").trim(),
    type,
    content: type === "text" ? String(content).trim() : "",
    durationInSeconds: normalizedDuration,
    order: nextOrder,
    isPreview,
  });

  // 12. Update module aggregate values
  const [moduleStats] = await Lecture.aggregate([
    {
      $match: {
        module: courseModule._id,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalLectures: {
          $sum: 1,
        },
        totalDurationInSeconds: {
          $sum: "$durationInSeconds",
        },
      },
    },
  ]);

  courseModule.totalLectures = moduleStats?.totalLectures || 0;
  courseModule.totalDurationInSeconds =
    moduleStats?.totalDurationInSeconds || 0;

  await courseModule.save();

  // 13. Update course aggregate values
  const [courseStats] = await Lecture.aggregate([
    {
      $match: {
        course: course._id,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalLectures: {
          $sum: 1,
        },
        totalDurationInSeconds: {
          $sum: "$durationInSeconds",
        },
      },
    },
  ]);

  course.totalLectures = courseStats?.totalLectures || 0;
  course.totalDurationInSeconds = courseStats?.totalDurationInSeconds || 0;

  await course.save();

  /*
   * Auto RAG indexing
   *
   * Abhi sirf text lecture ko automatically
   * index karenge because uska actual content
   * database me available hai.
   *
   * RAG failure ki wajah se lecture creation
   * fail nahi hona chahiye.
   */
  if (lecture.type === "text" && String(lecture.content || "").trim()) {
    try {
      await ingestLectureForRag({
        userId: req.user.id,
        userRole: req.user.role,
        lectureId: lecture._id,
      });
    } catch (error) {
      console.error("Lecture RAG indexing failed:", error);
    }
  }

  return res.status(201).json({
    success: true,
    message: "Lecture created successfully",
    lecture,
  });
});

export const getPublishedLecturesByModuleController = asyncHandler(
  async (req, res) => {
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
    }).select("course title");

    if (!courseModule) {
      return res.status(404).json({
        success: false,
        message: "Course module not found",
      });
    }

    const course = await Course.findOne({
      _id: courseModule.course,
      isActive: true,
    }).select("_id instructor");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let hasFullAccess = false;
    if (req.user) {
      if (
        req.user.role === "admin" ||
        course.instructor?.toString() === req.user.id?.toString()
      ) {
        hasFullAccess = true;
      } else {
        const isEnrolled = await Enrollment.exists({
          student: req.user.id,
          course: course._id,
          status: { $in: ["active", "completed"] },
        });

        if (isEnrolled) {
          hasFullAccess = true;
        }
      }
    }

    const lectureFilter = {
      module: courseModule._id,
      course: course._id,
      isActive: true,
    };
    if (!hasFullAccess) {
      lectureFilter.isPublished = true;
    }

    const lectures = await Lecture.find(lectureFilter)
      .sort({ order: 1 })
      .select(
        "title description type durationInSeconds order isPreview videoUrl documentUrl content isPublished",
      )
      .lean();

    const publicLectures = lectures.map((lecture) => {
      if (hasFullAccess || lecture.isPreview) {
        return lecture;
      }

      return {
        _id: lecture._id,
        title: lecture.title,
        description: lecture.description,
        type: lecture.type,
        durationInSeconds: lecture.durationInSeconds,
        order: lecture.order,
        isPreview: lecture.isPreview,

        videoUrl: null,
        documentUrl: null,
        content: "",
        isLocked: true,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Published lectures fetched successfully",
      count: publicLectures.length,
      lectures: publicLectures,
    });
  },
);

export const getManageLecturesByModuleController = asyncHandler(
  async (req, res) => {
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
    }).select("course title");

    if (!courseModule) {
      return res.status(404).json({
        success: false,
        message: "Course module not found",
      });
    }

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

    const isOwner = course.instructor.toString() === req.user.id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage lectures in this course",
      });
    }

    const lectures = await Lecture.find({
      module: courseModule._id,
      course: course._id,
      isActive: true,
    })
      .sort({ order: 1 })
      .select(
        "title description type videoUrl videoFileId documentUrl documentFileId content durationInSeconds order isPreview isPublished isActive createdAt updatedAt",
      )
      .lean();

    return res.status(200).json({
      success: true,
      message: "Course lectures fetched successfully",
      count: lectures.length,
      lectures,
    });
  },
);

export const updateLectureController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  const {
    title,
    description,
    type,
    content,
    durationInSeconds,
    isPreview,
    isPublished,
  } = req.body;

  // 1. Validate lecture ID
  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture ID",
    });
  }

  // 2. Reject empty update body
  const allowedFields = [
    "title",
    "description",
    "type",
    "content",
    "durationInSeconds",
    "isPreview",
    "isPublished",
  ];

  const providedFields = Object.keys(req.body).filter((field) =>
    allowedFields.includes(field),
  );

  if (providedFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide at least one valid field to update",
    });
  }

  // 3. Find lecture
  const lecture = await Lecture.findOne({
    _id: lectureId,
    isActive: true,
  });

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  // 4. Find related course
  const course = await Course.findOne({
    _id: lecture.course,
    isActive: true,
  }).select("instructor");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  // 5. Permission check
  const isOwner = course.instructor.toString() === req.user.id.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You cannot update this lecture",
    });
  }

  // 6. Validate title
  if (title !== undefined) {
    const normalizedTitle = String(title).trim();

    if (normalizedTitle.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Lecture title must contain at least 2 characters",
      });
    }

    if (normalizedTitle.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Lecture title cannot exceed 150 characters",
      });
    }

    lecture.title = normalizedTitle;
  }

  // 7. Update description
  if (description !== undefined) {
    const normalizedDescription = String(description).trim();

    if (normalizedDescription.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Lecture description cannot exceed 1000 characters",
      });
    }

    lecture.description = normalizedDescription;
  }

  // 8. Validate lecture type
  if (type !== undefined) {
    if (!ALLOWED_LECTURE_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Lecture type must be one of: ${ALLOWED_LECTURE_TYPES.join(", ")}`,
      });
    }

    lecture.type = type;
  }

  const finalLectureType = type || lecture.type;

  // 9. Update content
  if (content !== undefined) {
    lecture.content = String(content).trim();
  }

  if (
    finalLectureType === "text" &&
    !String(content !== undefined ? content : lecture.content).trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Content is required for a text lecture",
    });
  }

  /*
   * Type change hone par unrelated content clear.
   */
  if (type !== undefined) {
    if (type !== "text") {
      lecture.content = "";
    }

    if (type !== "video") {
      lecture.videoUrl = null;
      lecture.videoFileId = null;
    }

    if (type !== "document") {
      lecture.documentUrl = null;
      lecture.documentFileId = null;
    }
  }

  // 10. Validate duration
  if (durationInSeconds !== undefined) {
    const normalizedDuration = Number(durationInSeconds);

    if (!Number.isFinite(normalizedDuration) || normalizedDuration < 0) {
      return res.status(400).json({
        success: false,
        message: "durationInSeconds must be a valid non-negative number",
      });
    }

    lecture.durationInSeconds = normalizedDuration;
  }

  // 11. Validate preview
  if (isPreview !== undefined) {
    if (typeof isPreview !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPreview must be a boolean value",
      });
    }

    lecture.isPreview = isPreview;
  }

  // 12. Validate publish status
  if (isPublished !== undefined) {
    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPublished must be a boolean value",
      });
    }

    if (isPublished) {
      if (lecture.type === "video" && !lecture.videoUrl) {
        return res.status(400).json({
          success: false,
          message: "Upload a video before publishing this lecture",
        });
      }

      if (lecture.type === "document" && !lecture.documentUrl) {
        return res.status(400).json({
          success: false,
          message: "Upload a document before publishing this lecture",
        });
      }

      if (lecture.type === "text" && !String(lecture.content || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Text content is required before publishing",
        });
      }
    }

    lecture.isPublished = isPublished;
  }

  // 13. Save lecture
  await lecture.save();

  /*
   * 14. Re-index RAG only when
   * AI-relevant fields change.
   */
  const shouldReindexRag =
    title !== undefined ||
    description !== undefined ||
    content !== undefined ||
    type !== undefined;

  if (shouldReindexRag) {
    try {
      if (lecture.type === "text" && String(lecture.content || "").trim()) {
        await ingestLectureForRag({
          userId: req.user.id,

          userRole: req.user.role,

          lectureId: lecture._id,
        });
      } else {
        /*
         * Agar lecture pehle text tha
         * aur ab dusre type me convert hua,
         * old RAG chunks remove karo.
         */
        await deleteRagResource({
          userId: req.user.id,

          userRole: req.user.role,

          courseId: lecture.course,

          resourceType: "lecture",

          resourceId: lecture._id,
        });
      }
    } catch (error) {
      console.error("Lecture RAG re-indexing failed:", error);
    }
  }

  // 15. Recalculate module statistics
  const [moduleStats] = await Lecture.aggregate([
    {
      $match: {
        module: lecture.module,

        isActive: true,
      },
    },

    {
      $group: {
        _id: null,

        totalLectures: {
          $sum: 1,
        },

        totalDurationInSeconds: {
          $sum: "$durationInSeconds",
        },
      },
    },
  ]);

  await CourseModule.findByIdAndUpdate(
    lecture.module,

    {
      $set: {
        totalLectures: moduleStats?.totalLectures || 0,

        totalDurationInSeconds: moduleStats?.totalDurationInSeconds || 0,
      },
    },
  );

  // 16. Recalculate course statistics
  const [courseStats] = await Lecture.aggregate([
    {
      $match: {
        course: lecture.course,

        isActive: true,
      },
    },

    {
      $group: {
        _id: null,

        totalLectures: {
          $sum: 1,
        },

        totalDurationInSeconds: {
          $sum: "$durationInSeconds",
        },
      },
    },
  ]);

  await Course.findByIdAndUpdate(
    lecture.course,

    {
      $set: {
        totalLectures: courseStats?.totalLectures || 0,

        totalDurationInSeconds: courseStats?.totalDurationInSeconds || 0,
      },
    },
  );

  return res.status(200).json({
    success: true,
    message: "Lecture updated successfully",
    lecture,
  });
});

export const uploadLectureVideoController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture ID",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Video file is required",
    });
  }

  const lecture = await Lecture.findOne({
    _id: lectureId,
    isActive: true,
  });

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  const course = await Course.findOne({
    _id: lecture.course,
    isActive: true,
  }).select("instructor");

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
      message: "You cannot upload video for this lecture",
    });
  }

  // Delete previous video on ImageKit if exists
  if (lecture.videoFileId) {
    try {
      await imagekit.deleteFile(lecture.videoFileId);
    } catch (err) {
      console.error("Failed to delete old lecture video:", err);
    }
  }

  const uploadedVideo = await imagekit.upload({
    file: req.file.buffer,
    fileName: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
    folder: "/lms/course-videos",
    useUniqueFileName: true,
  });

  lecture.videoUrl = uploadedVideo.url;
  lecture.videoFileId = uploadedVideo.fileId;
  lecture.isPublished = true;

  await lecture.save();

  // Auto-publish parent module as well
  await CourseModule.findByIdAndUpdate(lecture.module, { isPublished: true });

  return res.status(200).json({
    success: true,
    message: "Lecture video uploaded successfully to ImageKit",
    lecture: {
      _id: lecture._id,
      title: lecture.title,
      videoUrl: lecture.videoUrl,
      videoFileId: lecture.videoFileId,
    },
  });
});

export const uploadLectureDocumentController = asyncHandler(
  async (req, res) => {
    const { lectureId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lecture ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    const lecture = await Lecture.findOne({
      _id: lectureId,
      isActive: true,
    });

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    const course = await Course.findOne({
      _id: lecture.course,
      isActive: true,
    }).select("instructor");

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
        message: "You cannot upload documents for this lecture",
      });
    }

    // Delete previous document on ImageKit if exists
    if (lecture.documentFileId) {
      try {
        await imagekit.deleteFile(lecture.documentFileId);
      } catch (error) {
        console.error("Failed to delete old lecture document:", error);
      }
    }

    const uploadedDocument = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      folder: "/lms/course-documents",
      useUniqueFileName: true,
    });

    lecture.documentUrl = uploadedDocument.url;
    lecture.documentFileId = uploadedDocument.fileId;
    lecture.isPublished = true;

    await lecture.save();

    // Auto-publish parent module as well
    await CourseModule.findByIdAndUpdate(lecture.module, { isPublished: true });

    return res.status(200).json({
      success: true,
      message: "Lecture document uploaded successfully to ImageKit",
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        documentUrl: lecture.documentUrl,
        documentFileId: lecture.documentFileId,
      },
    });
  },
);

/**
 * @desc  Generate ImageKit client-side upload auth token
 *        so the browser can upload directly to ImageKit (bypasses 100MB server limit)
 * @access Private (admin / instructor)
 */
export const getUploadAuthTokenController = asyncHandler(async (req, res) => {
  // Generate ImageKit auth params using the private key
  const authParams = imagekit.getAuthenticationParameters();

  const publicKey = config.IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = config.IMAGEKIT_URL_ENDPOINT;

  console.log("[ImageKit Auth Token]", {
    token: authParams.token,
    expire: authParams.expire,
    signatureLength: authParams.signature?.length,
    publicKeyPrefix: publicKey?.slice(0, 10),
    urlEndpoint,
  });

  if (!publicKey || !urlEndpoint) {
    return res.status(500).json({
      success: false,
      message:
        "ImageKit public key or URL endpoint is not configured on the server.",
    });
  }

  return res.status(200).json({
    success: true,
    token: authParams.token,
    expire: String(authParams.expire), // ensure string for FormData
    signature: authParams.signature,
    publicKey,
    urlEndpoint,
  });
});

/**
 * @desc  Save the imagekit CDN url + fileId returned by a client-side upload
 * @body  { mediaType: "video" | "document", url: string, fileId: string }
 * @access Private (admin / instructor)
 */
export const updateLectureMediaUrlController = asyncHandler(
  async (req, res) => {
    const { lectureId } = req.params;
    const { mediaType, url, fileId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(lectureId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid lecture ID" });
    }

    if (!["video", "document"].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: "mediaType must be 'video' or 'document'",
      });
    }

    if (!url || !fileId) {
      return res
        .status(400)
        .json({ success: false, message: "url and fileId are required" });
    }

    const lecture = await Lecture.findOne({ _id: lectureId, isActive: true });
    if (!lecture) {
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });
    }

    const course = await Course.findOne({
      _id: lecture.course,
      isActive: true,
    }).select("instructor");
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const isOwner = course.instructor.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (mediaType === "video") {
      // Delete old video from ImageKit if it was previously stored there
      if (lecture.videoFileId) {
        try {
          await imagekit.deleteFile(lecture.videoFileId);
        } catch {}
      }
      lecture.videoUrl = url;
      lecture.videoFileId = fileId;
    } else {
      if (lecture.documentFileId) {
        try {
          await imagekit.deleteFile(lecture.documentFileId);
        } catch {}
      }
      lecture.documentUrl = url;
      lecture.documentFileId = fileId;
    }

    await lecture.save();

    return res.status(200).json({
      success: true,
      message: `Lecture ${mediaType} URL saved successfully`,
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        documentUrl: lecture.documentUrl,
      },
    });
  },
);

export const archiveLectureController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture ID",
    });
  }

  const lecture = await Lecture.findOne({
    _id: lectureId,
    isActive: true,
  });

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  const course = await Course.findOne({
    _id: lecture.course,
    isActive: true,
  }).select("instructor");

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
      message: "You cannot archive this lecture",
    });
  }

  lecture.isActive = false;
  lecture.isPublished = false;
  lecture.order = null;

  await lecture.save();

  try {
    await deleteRagResource({
      userId: req.user.id,
      userRole: req.user.role,
      courseId: lecture.course,
      resourceType: "lecture",
      resourceId: lecture._id,
    });
  } catch (error) {
    console.error("Archived lecture RAG cleanup failed:", error);
  }

  const [moduleStats] = await Lecture.aggregate([
    {
      $match: {
        module: lecture.module,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalLectures: {
          $sum: 1,
        },
        totalDurationInSeconds: {
          $sum: "$durationInSeconds",
        },
      },
    },
  ]);

  await CourseModule.findByIdAndUpdate(lecture.module, {
    $set: {
      totalLectures: moduleStats?.totalLectures || 0,
      totalDurationInSeconds: moduleStats?.totalDurationInSeconds || 0,
    },
  });

  const [courseStats] = await Lecture.aggregate([
    {
      $match: {
        course: lecture.course,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        totalLectures: {
          $sum: 1,
        },
        totalDurationInSeconds: {
          $sum: "$durationInSeconds",
        },
      },
    },
  ]);

  await Course.findByIdAndUpdate(lecture.course, {
    $set: {
      totalLectures: courseStats?.totalLectures || 0,
      totalDurationInSeconds: courseStats?.totalDurationInSeconds || 0,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Lecture archived successfully",
  });
});

const LECTURE_ORDER_GAP = 1000;

export const reorderLectureController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  const { previousLectureId = null, nextLectureId = null } = req.body;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture ID",
    });
  }

  if (
    previousLectureId &&
    !mongoose.Types.ObjectId.isValid(previousLectureId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid previous lecture ID",
    });
  }

  if (nextLectureId && !mongoose.Types.ObjectId.isValid(nextLectureId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid next lecture ID",
    });
  }

  if (lectureId === previousLectureId || lectureId === nextLectureId) {
    return res.status(400).json({
      success: false,
      message: "Lecture cannot be placed relative to itself",
    });
  }

  const lecture = await Lecture.findOne({
    _id: lectureId,
    isActive: true,
  });

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  const course = await Course.findOne({
    _id: lecture.course,
    isActive: true,
  }).select("instructor");

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
      message: "You cannot reorder lectures in this course",
    });
  }

  const allLectures = await Lecture.find({
    module: lecture.module,
    course: lecture.course,
    isActive: true,
  })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .select("_id title order isPublished");

  if (allLectures.length <= 1) {
    return res.status(200).json({
      success: true,
      message: "Lecture is already in the correct position",
      lectures: allLectures,
    });
  }

  const targetLecture = allLectures.find(
    (item) => item._id.toString() === lectureId,
  );

  const remainingLectures = allLectures.filter(
    (item) => item._id.toString() !== lectureId,
  );

  if (!targetLecture) {
    return res.status(404).json({
      success: false,
      message: "Target lecture not found",
    });
  }

  const previousIndex = previousLectureId
    ? remainingLectures.findIndex(
        (item) => item._id.toString() === previousLectureId,
      )
    : -1;

  const nextIndex = nextLectureId
    ? remainingLectures.findIndex(
        (item) => item._id.toString() === nextLectureId,
      )
    : -1;

  if (previousLectureId && previousIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Previous lecture not found in this module",
    });
  }

  if (nextLectureId && nextIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Next lecture not found in this module",
    });
  }

  if (previousLectureId && nextLectureId && previousIndex + 1 !== nextIndex) {
    return res.status(400).json({
      success: false,
      message:
        "Previous and next lectures must be adjacent in the final sequence",
    });
  }

  let insertIndex;

  if (!previousLectureId && nextLectureId) {
    insertIndex = nextIndex;
  } else if (previousLectureId && !nextLectureId) {
    insertIndex = previousIndex + 1;
  } else if (previousLectureId && nextLectureId) {
    insertIndex = nextIndex;
  } else {
    insertIndex = 0;
  }

  remainingLectures.splice(insertIndex, 0, targetLecture);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      /*
       * Partial unique index null values ko ignore karega.
       * Isse old orders clear karte waqt collision nahi hogi.
       */
      await Lecture.updateMany(
        {
          module: lecture.module,
          course: lecture.course,
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

      const operations = remainingLectures.map((item, index) => ({
        updateOne: {
          filter: {
            _id: item._id,
            module: lecture.module,
            course: lecture.course,
            isActive: true,
          },
          update: {
            $set: {
              order: (index + 1) * LECTURE_ORDER_GAP,
            },
          },
        },
      }));

      if (operations.length > 0) {
        await Lecture.bulkWrite(operations, {
          session,
          ordered: true,
        });
      }
    });
  } finally {
    await session.endSession();
  }

  const reorderedLectures = await Lecture.find({
    module: lecture.module,
    course: lecture.course,
    isActive: true,
  })
    .sort({ order: 1 })
    .select(
      "title description type durationInSeconds order isPreview isPublished",
    )
    .lean();

  return res.status(200).json({
    success: true,
    message: "Lectures reordered successfully",
    lectures: reorderedLectures,
  });
});

export const publishLectureController = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(lectureId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid lecture ID",
    });
  }

  const lecture = await Lecture.findOne({
    _id: lectureId,
    isActive: true,
  });

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  lecture.isPublished = true;

  if (
    lecture.isActive &&
    (lecture.order === null || lecture.order === undefined)
  ) {
    const lastLecture = await Lecture.findOne({
      module: lecture.module,
      isActive: true,
      _id: { $ne: lecture._id },
    })
      .sort({ order: -1 })
      .select("order")
      .lean();

    const ORDER_GAP = 1000;
    lecture.order = lastLecture
      ? (lastLecture.order || 0) + ORDER_GAP
      : ORDER_GAP;
  }

  await lecture.save();

  return res.status(200).json({
    success: true,
    message: "Lecture published successfully",
    lecture,
  });
});

export const streamProtectedMediaController = asyncHandler(async (req, res) => {
  const { type, filename } = req.params;
  const safeFilename = path.basename(filename);

  if (!["videos", "documents"].includes(type)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid media type" });
  }

  const filePath = path.join(
    __dirname,
    `../../public/uploads/${type}`,
    safeFilename,
  );

  try {
    await fs.access(filePath);
  } catch {
    return res
      .status(404)
      .json({ success: false, message: "Media file not found" });
  }

  const targetUrl = `/api/lectures/media/${type}/${safeFilename}`;
  const fallbackUrl = `/uploads/${type}/${safeFilename}`;

  const lecture = await Lecture.findOne({
    $or: [
      { videoUrl: targetUrl },
      { documentUrl: targetUrl },
      { videoUrl: fallbackUrl },
      { documentUrl: fallbackUrl },
    ],
    isActive: true,
  });

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found for this media file",
    });
  }

  const course = await Course.findById(lecture.course).select("instructor");

  if (!course) {
    return res
      .status(404)
      .json({ success: false, message: "Course not found" });
  }

  // Permission Check: Admin, Instructor, or Active/Completed Enrolled Student
  let isAuthorized = false;
  if (req.user) {
    if (
      req.user.role === "admin" ||
      course.instructor?.toString() === req.user.id?.toString()
    ) {
      isAuthorized = true;
    } else {
      const isEnrolled = await Enrollment.exists({
        student: req.user.id,
        course: course._id,
        status: { $in: ["active", "completed"] },
      });
      if (isEnrolled) isAuthorized = true;
    }
  }

  if (!isAuthorized && !lecture.isPreview) {
    return res.status(403).json({
      success: false,
      message:
        "Access Denied: You must be logged in and enrolled in this course to view this content.",
    });
  }

  const stat = await fs.stat(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range && type === "videos") {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const stream = fsSync.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
    });
    return stream.pipe(res);
  }

  res.writeHead(200, {
    "Content-Length": fileSize,
    "Content-Type": type === "videos" ? "video/mp4" : "application/pdf",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
  });
  return fsSync.createReadStream(filePath).pipe(res);
});
