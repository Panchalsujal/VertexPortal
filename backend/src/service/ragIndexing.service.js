import mongoose from "mongoose";

import RagIndexingJob from "../models/ragIndexingJob.model.js";
import Course from "../models/course.model.js";

import { ApiError } from "../utils/ApiError.js";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function validateObjectId(id, label = "ID") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
}

function normalizeError(error) {
  const message =
    error?.message ||
    "Unknown RAG indexing error";

  return String(message).slice(0, 5000);
}

/*
 * =========================================================
 * CHECK INSTRUCTOR / ADMIN ACCESS
 * =========================================================
 */

async function validateIndexingManagementAccess({
  userId,
  userRole,
  courseId,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(courseId, "course ID");

  if (userRole === "admin") {
    return;
  }

  if (userRole !== "instructor") {
    throw new ApiError(
      403,
      "You are not allowed to manage AI indexing",
    );
  }

  const course = await Course.findOne({
    _id: courseId,
    isActive: true,
  })
    .select("_id instructor")
    .lean();

  if (!course) {
    throw new ApiError(
      404,
      "Course not found",
    );
  }

  if (
    course.instructor.toString() !==
    String(userId)
  ) {
    throw new ApiError(
      403,
      "You are not the instructor of this course",
    );
  }
}

/*
 * =========================================================
 * CREATE / RESET INDEXING JOB
 * =========================================================
 */

export async function createOrResetRagIndexingJob({
  userId,
  courseId,
  moduleId = null,
  lectureId = null,

  resourceType,
  resourceId,

  metadata = null,
}) {
  validateObjectId(userId, "user ID");
  validateObjectId(courseId, "course ID");
  validateObjectId(resourceId, "resource ID");

  if (moduleId) {
    validateObjectId(moduleId, "module ID");
  }

  if (lectureId) {
    validateObjectId(lectureId, "lecture ID");
  }

  const allowedResourceTypes = [
    "course",
    "module",
    "lecture",
    "document",
    "note",
  ];

  if (
    !allowedResourceTypes.includes(
      resourceType,
    )
  ) {
    throw new ApiError(
      400,
      "Invalid RAG resource type",
    );
  }

  /*
   * Same resource re-index ho raha ho to
   * duplicate job create nahi karenge.
   */
  const job =
    await RagIndexingJob.findOneAndUpdate(
      {
        resourceType,
        resourceId,
        isActive: true,
      },
      {
        $set: {
          course: courseId,
          module: moduleId,
          lecture: lectureId,

          status: "pending",

          chunksCreated: 0,

          lastError: null,

          startedAt: null,
          completedAt: null,
          failedAt: null,

          metadata,

          createdBy: userId,
        },

        $setOnInsert: {
          retryCount: 0,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
      },
    );

  return job;
}

/*
 * =========================================================
 * MARK PROCESSING
 * =========================================================
 */

export async function markRagIndexingProcessing(
  jobId,
) {
  validateObjectId(
    jobId,
    "indexing job ID",
  );

  const now = new Date();

  const job =
    await RagIndexingJob.findOneAndUpdate(
      {
        _id: jobId,
        isActive: true,
      },
      {
        $set: {
          status: "processing",

          startedAt: now,

          completedAt: null,
          failedAt: null,

          lastError: null,

          chunksCreated: 0,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

  if (!job) {
    throw new ApiError(
      404,
      "RAG indexing job not found",
    );
  }

  return job;
}

/*
 * =========================================================
 * MARK COMPLETED
 * =========================================================
 */

export async function markRagIndexingCompleted({
  jobId,
  chunksCreated = 0,
  metadata = undefined,
}) {
  validateObjectId(
    jobId,
    "indexing job ID",
  );

  const now = new Date();

  const update = {
    $set: {
      status: "completed",

      chunksCreated:
        Math.max(
          Number(chunksCreated) || 0,
          0,
        ),

      completedAt: now,

      failedAt: null,

      lastError: null,

      lastIndexedAt: now,
    },
  };

  /*
   * metadata undefined ho to existing
   * metadata overwrite nahi karenge.
   */
  if (metadata !== undefined) {
    update.$set.metadata = metadata;
  }

  const job =
    await RagIndexingJob.findOneAndUpdate(
      {
        _id: jobId,
        isActive: true,
      },
      update,
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

  if (!job) {
    throw new ApiError(
      404,
      "RAG indexing job not found",
    );
  }

  return job;
}

/*
 * =========================================================
 * MARK FAILED
 * =========================================================
 */

export async function markRagIndexingFailed({
  jobId,
  error,
}) {
  validateObjectId(
    jobId,
    "indexing job ID",
  );

  const job =
    await RagIndexingJob.findOneAndUpdate(
      {
        _id: jobId,
        isActive: true,
      },
      {
        $set: {
          status: "failed",

          failedAt: new Date(),

          completedAt: null,

          lastError:
            normalizeError(error),

          chunksCreated: 0,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

  if (!job) {
    throw new ApiError(
      404,
      "RAG indexing job not found",
    );
  }

  return job;
}

/*
 * =========================================================
 * GET SINGLE INDEXING STATUS
 * =========================================================
 */

export async function getRagIndexingJob({
  userId,
  userRole,
  jobId,
}) {
  validateObjectId(
    jobId,
    "indexing job ID",
  );

  const job =
    await RagIndexingJob.findOne({
      _id: jobId,
      isActive: true,
    })
      .populate({
        path: "course",
        select:
          "title instructor",
      })
      .populate({
        path: "lecture",
        select:
          "title type",
      });

  if (!job) {
    throw new ApiError(
      404,
      "RAG indexing job not found",
    );
  }

  await validateIndexingManagementAccess({
    userId,
    userRole,
    courseId:
      job.course._id,
  });

  return job;
}

/*
 * =========================================================
 * GET COURSE INDEXING JOBS
 * =========================================================
 */

export async function getCourseRagIndexingJobs({
  userId,
  userRole,
  courseId,

  status = null,

  page = 1,
  limit = 20,
}) {
  validateObjectId(
    courseId,
    "course ID",
  );

  await validateIndexingManagementAccess({
    userId,
    userRole,
    courseId,
  });

  const parsedPage =
    Math.max(
      Number(page) || 1,
      1,
    );

  const parsedLimit =
    Math.min(
      Math.max(
        Number(limit) || 20,
        1,
      ),
      100,
    );

  const filter = {
    course: courseId,
    isActive: true,
  };

  if (status) {
    const allowedStatuses = [
      "pending",
      "processing",
      "completed",
      "failed",
    ];

    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      throw new ApiError(
        400,
        "Invalid indexing status",
      );
    }

    filter.status = status;
  }

  const [
    jobs,
    total,
  ] =
    await Promise.all([
      RagIndexingJob.find(
        filter,
      )
        .populate({
          path: "lecture",
          select:
            "title type",
        })
        .sort({
          updatedAt: -1,
        })
        .skip(
          (parsedPage - 1) *
            parsedLimit,
        )
        .limit(parsedLimit)
        .lean(),

      RagIndexingJob.countDocuments(
        filter,
      ),
    ]);

  return {
    jobs,

    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,

      totalPages:
        Math.ceil(
          total /
            parsedLimit,
        ),
    },
  };
}

/*
 * =========================================================
 * PREPARE RETRY
 * =========================================================
 *
 * Actual PDF/video re-processing next integration
 * step me resource-specific service karegi.
 *
 * Is function ka kaam:
 *
 * authorization
 * + validation
 * + retry count
 * + status transition
 */

export async function prepareRagIndexingRetry({
  userId,
  userRole,
  jobId,
}) {
  validateObjectId(
    jobId,
    "indexing job ID",
  );

  const job =
    await RagIndexingJob.findOne({
      _id: jobId,
      isActive: true,
    });

  if (!job) {
    throw new ApiError(
      404,
      "RAG indexing job not found",
    );
  }

  await validateIndexingManagementAccess({
    userId,
    userRole,
    courseId:
      job.course,
  });

  /*
   * Successful job ko accidentally retry
   * nahi karenge.
   *
   * Re-indexing future me separate endpoint
   * ho sakta hai.
   */
  if (
    job.status ===
    "completed"
  ) {
    throw new ApiError(
      409,
      "Completed indexing job does not require retry",
    );
  }

  if (
    job.status ===
    "processing"
  ) {
    throw new ApiError(
      409,
      "Indexing job is already processing",
    );
  }

  job.retryCount += 1;

  job.status =
    "pending";

  job.lastError =
    null;

  job.startedAt =
    null;

  job.completedAt =
    null;

  job.failedAt =
    null;

  await job.save();

  return job;
}