import mongoose from "mongoose";

import Discussion from "../models/discussion.model.js";
import DiscussionReply from "../models/discussionReply.model.js";
import DiscussionReport from "../models/discussionReport.model.js";
import Enrollment from "../models/enrollment.model.js";

import { validateObjectId } from "../utils/validator.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { parseEnumQuery, parseSortQuery } from "../utils/queryParser.js";

import { ApiError } from "../utils/ApiError.js";

const REPORT_REASONS = [
  "spam",
  "harassment",
  "abusive_language",
  "inappropriate_content",
  "misinformation",
  "plagiarism",
  "other",
];

const REPORT_STATUSES = ["pending", "reviewing", "resolved", "rejected"];

const MODERATION_ACTIONS = [
  "none",
  "hide_content",
  "delete_content",
  "lock_discussion",
];

/*
 * ------------------------------------------------
 * Internal helper:
 * Discussion access validate
 * ------------------------------------------------
 */
async function validateDiscussionAccess({ userId, userRole, discussion }) {
  if (userRole === "admin") {
    return;
  }

  if (userRole === "instructor") {
    if (discussion.course.instructor.toString() !== String(userId)) {
      throw new ApiError(403, "You do not have access to this discussion");
    }

    return;
  }

  if (userRole === "student") {
    const enrollment = await Enrollment.findOne({
      student: userId,

      course: discussion.course._id,

      status: {
        $in: ["active", "completed"],
      },
    })
      .select("_id expiresAt")
      .lean();

    if (!enrollment) {
      throw new ApiError(403, "You are not enrolled in this course");
    }

    if (
      enrollment.expiresAt &&
      new Date(enrollment.expiresAt).getTime() <= Date.now()
    ) {
      throw new ApiError(403, "Your course enrollment has expired");
    }

    return;
  }

  throw new ApiError(403, "You do not have access to this discussion");
}

/*
 * ------------------------------------------------
 * Create report
 *
 * Student / instructor / admin
 * discussion ya reply report kar sakta hai.
 * ------------------------------------------------
 */
export async function createDiscussionReport({ userId, userRole, payload }) {
  validateObjectId(userId, "user ID");

  const { targetType, targetId, reason, description = "" } = payload || {};

  const parsedTargetType = parseEnumQuery(
    targetType,
    ["discussion", "reply"],
    "Report target type",
  );

  if (!targetId) {
    throw new ApiError(400, "Report target ID is required");
  }

  validateObjectId(targetId, "report target ID");

  const parsedReason = parseEnumQuery(reason, REPORT_REASONS, "Report reason");

  const normalizedDescription = String(description || "").trim();

  if (normalizedDescription.length > 2000) {
    throw new ApiError(400, "Report description cannot exceed 2000 characters");
  }

  let discussion = null;
  let reply = null;

  /*
   * Discussion report.
   */
  if (parsedTargetType === "discussion") {
    discussion = await Discussion.findOne({
      _id: targetId,

      isActive: true,
    }).populate({
      path: "course",

      select: "_id instructor title",
    });

    if (!discussion) {
      throw new ApiError(404, "Discussion not found");
    }
  }

  /*
   * Reply report.
   */
  if (parsedTargetType === "reply") {
    reply = await DiscussionReply.findOne({
      _id: targetId,

      isActive: true,
    });

    if (!reply) {
      throw new ApiError(404, "Discussion reply not found");
    }

    discussion = await Discussion.findOne({
      _id: reply.discussion,

      isActive: true,
    }).populate({
      path: "course",

      select: "_id instructor title",
    });

    if (!discussion) {
      throw new ApiError(404, "Parent discussion not found");
    }
  }

  await validateDiscussionAccess({
    userId,
    userRole,
    discussion,
  });

  /*
   * User apne khud ke content ko report na kare.
   */
  const targetAuthorId =
    parsedTargetType === "discussion" ? discussion.author : reply.author;

  if (targetAuthorId.toString() === String(userId)) {
    throw new ApiError(400, "You cannot report your own content");
  }

  /*
   * Same user same target ko duplicate
   * pending/reviewing report na kare.
   */
  const existingReport = await DiscussionReport.findOne({
    reporter: userId,

    targetType: parsedTargetType,

    targetId,

    status: {
      $in: ["pending", "reviewing"],
    },
  })
    .select("_id status")
    .lean();

  if (existingReport) {
    throw new ApiError(409, "You have already reported this content");
  }

  try {
    const report = await DiscussionReport.create({
      reporter: userId,

      course: discussion.course._id,

      discussion: discussion._id,

      targetType: parsedTargetType,

      targetId,

      targetAuthor: targetAuthorId,

      reason: parsedReason,

      description: normalizedDescription,

      status: "pending",

      reviewedBy: null,

      reviewedAt: null,

      resolutionNote: "",

      moderationAction: "none",

      resolvedAt: null,
    });

    return {
      report,

      message: "Content reported successfully",
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "You have already reported this content");
    }

    throw error;
  }
}

/*
 * ------------------------------------------------
 * User ke apne reports
 * ------------------------------------------------
 */
export async function getMyDiscussionReports({ userId, query = {} }) {
  validateObjectId(userId, "user ID");

  const { status, targetType, sortBy = "createdAt", order = "desc" } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    reporter: userId,
  };

  const parsedStatus = parseEnumQuery(status, REPORT_STATUSES, "Report status");

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedTargetType = parseEnumQuery(
    targetType,
    ["discussion", "reply"],
    "Report target type",
  );

  if (parsedTargetType !== undefined) {
    filter.targetType = parsedTargetType;
  }

  const {
    sortBy: selectedSortField,

    sortOrder,

    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: [
      "createdAt",
      "updatedAt",
      "reviewedAt",
      "resolvedAt",
      "status",
    ],

    defaultField: "createdAt",

    defaultOrder: "desc",
  });

  const [reports, totalRecords] = await Promise.all([
    DiscussionReport.find(filter)
      .populate({
        path: "discussion",

        select: "title status isActive",
      })
      .populate({
        path: "course",

        select: "title slug",
      })
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    DiscussionReport.countDocuments(filter),
  ]);

  return {
    reports,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      status: parsedStatus ?? null,

      targetType: parsedTargetType ?? null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

/*
 * ------------------------------------------------
 * Admin report listing
 * ------------------------------------------------
 */
export async function getAdminDiscussionReports({ query = {} }) {
  const {
    status,
    reason,
    targetType,
    course,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};

  const parsedStatus = parseEnumQuery(status, REPORT_STATUSES, "Report status");

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedReason = parseEnumQuery(reason, REPORT_REASONS, "Report reason");

  if (parsedReason !== undefined) {
    filter.reason = parsedReason;
  }

  const parsedTargetType = parseEnumQuery(
    targetType,
    ["discussion", "reply"],
    "Report target type",
  );

  if (parsedTargetType !== undefined) {
    filter.targetType = parsedTargetType;
  }

  if (course) {
    validateObjectId(course, "course ID");

    filter.course = course;
  }

  const {
    sortBy: selectedSortField,

    sortOrder,

    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: [
      "createdAt",
      "updatedAt",
      "reviewedAt",
      "resolvedAt",
      "status",
      "reason",
    ],

    defaultField: "createdAt",

    defaultOrder: "desc",
  });

  const [reports, totalRecords, pendingCount, reviewingCount] =
    await Promise.all([
      DiscussionReport.find(filter)
        .populate({
          path: "reporter",

          select: "fullName email avatarUrl role",
        })
        .populate({
          path: "targetAuthor",

          select: "fullName email avatarUrl role",
        })
        .populate({
          path: "course",

          select: "title slug",
        })
        .populate({
          path: "discussion",

          select: "title status isActive isLocked",
        })
        .populate({
          path: "reviewedBy",

          select: "fullName email",
        })
        .sort({
          [selectedSortField]: sortOrder,

          _id: sortOrder,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      DiscussionReport.countDocuments(filter),

      DiscussionReport.countDocuments({
        status: "pending",
      }),

      DiscussionReport.countDocuments({
        status: "reviewing",
      }),
    ]);

  return {
    reports,

    summary: {
      pending: pendingCount,

      reviewing: reviewingCount,
    },

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      status: parsedStatus ?? null,

      reason: parsedReason ?? null,

      targetType: parsedTargetType ?? null,

      course: course ?? null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

/*
 * ------------------------------------------------
 * Admin single report
 * ------------------------------------------------
 */
export async function getAdminDiscussionReportById({ reportId }) {
  validateObjectId(reportId, "report ID");

  const report = await DiscussionReport.findById(reportId)
    .populate({
      path: "reporter",

      select: "fullName email avatarUrl role status isActive",
    })
    .populate({
      path: "targetAuthor",

      select: "fullName email avatarUrl role status isActive",
    })
    .populate({
      path: "course",

      select: "title slug instructor",
    })
    .populate({
      path: "discussion",

      select: `
          title
          content
          author
          status
          isPinned
          isLocked
          isResolved
          isActive
          createdAt
        `,
    })
    .populate({
      path: "reviewedBy",

      select: "fullName email",
    })
    .lean();

  if (!report) {
    throw new ApiError(404, "Discussion report not found");
  }

  let reportedContent = null;

  if (report.targetType === "discussion") {
    reportedContent = await Discussion.findById(report.targetId)
      .select(
        `
          title
          content
          author
          status
          isLocked
          isActive
          createdAt
        `,
      )
      .populate({
        path: "author",

        select: "fullName email avatarUrl role",
      })
      .lean();
  }

  if (report.targetType === "reply") {
    reportedContent = await DiscussionReply.findById(report.targetId)
      .select(
        `
          content
          author
          discussion
          parentReply
          isInstructorReply
          isAcceptedAnswer
          isActive
          createdAt
        `,
      )
      .populate({
        path: "author",

        select: "fullName email avatarUrl role",
      })
      .lean();
  }

  return {
    report,

    reportedContent,
  };
}

/*
 * ------------------------------------------------
 * Admin status => reviewing
 * ------------------------------------------------
 */
export async function startDiscussionReportReview({ adminId, reportId }) {
  validateObjectId(adminId, "admin ID");

  validateObjectId(reportId, "report ID");

  const report = await DiscussionReport.findById(reportId);

  if (!report) {
    throw new ApiError(404, "Discussion report not found");
  }

  if (["resolved", "rejected"].includes(report.status)) {
    throw new ApiError(409, `Report is already ${report.status}`);
  }

  report.status = "reviewing";

  report.reviewedBy = adminId;

  report.reviewedAt = report.reviewedAt ?? new Date();

  await report.save();

  return {
    report,

    message: "Discussion report review started",
  };
}

/*
 * ------------------------------------------------
 * Admin resolve/reject report
 *
 * Optional moderation actions:
 * none
 * hide_content
 * delete_content
 * lock_discussion
 * ------------------------------------------------
 */
export async function resolveDiscussionReport({ adminId, reportId, payload }) {
  validateObjectId(adminId, "admin ID");

  validateObjectId(reportId, "report ID");

  const {
    status,
    resolutionNote = "",
    moderationAction = "none",
  } = payload || {};

  const parsedStatus = parseEnumQuery(
    status,
    ["resolved", "rejected"],
    "Report resolution status",
  );

  const parsedAction =
    parseEnumQuery(moderationAction, MODERATION_ACTIONS, "Moderation action") ??
    "none";

  const normalizedResolutionNote = String(resolutionNote || "").trim();

  if (normalizedResolutionNote.length > 2000) {
    throw new ApiError(400, "Resolution note cannot exceed 2000 characters");
  }

  const report = await DiscussionReport.findById(reportId);

  if (!report) {
    throw new ApiError(404, "Discussion report not found");
  }

  if (["resolved", "rejected"].includes(report.status)) {
    throw new ApiError(409, `Report is already ${report.status}`);
  }

  /*
   * Rejected report par moderation action
   * nahi hona chahiye.
   */
  if (parsedStatus === "rejected" && parsedAction !== "none") {
    throw new ApiError(400, "Rejected report cannot apply a moderation action");
  }

  /*
   * Moderation actions sirf resolved case me.
   */
  if (parsedStatus === "resolved") {
    /*
     * Hide/Delete target discussion.
     */
    if (report.targetType === "discussion") {
      const discussion = await Discussion.findById(report.targetId);

      if (!discussion) {
        throw new ApiError(404, "Reported discussion no longer exists");
      }

      if (
        parsedAction === "hide_content" ||
        parsedAction === "delete_content"
      ) {
        discussion.isActive = false;

        discussion.isLocked = true;

        await discussion.save();

        /*
         * Discussion delete/hide ke saath
         * replies bhi hide.
         */
        await DiscussionReply.updateMany(
          {
            discussion: discussion._id,
          },

          {
            $set: {
              isActive: false,
            },
          },
        );
      }

      if (parsedAction === "lock_discussion") {
        discussion.isLocked = true;

        await discussion.save();
      }
    }

    /*
     * Reply moderation.
     */
    if (report.targetType === "reply") {
      const reply = await DiscussionReply.findById(report.targetId);

      if (!reply) {
        throw new ApiError(404, "Reported reply no longer exists");
      }

      if (
        parsedAction === "hide_content" ||
        parsedAction === "delete_content"
      ) {
        const wasActive = reply.isActive;

        const wasAccepted = reply.isAcceptedAnswer;

        reply.isActive = false;

        reply.isAcceptedAnswer = false;

        reply.acceptedAt = null;

        reply.acceptedBy = null;

        await reply.save();

        /*
         * Parent discussion counters update.
         */
        if (wasActive) {
          const discussion = await Discussion.findById(reply.discussion);

          if (discussion) {
            discussion.answerCount = Math.max(
              0,
              (discussion.answerCount ?? 0) - 1,
            );

            if (wasAccepted) {
              discussion.isResolved = false;

              discussion.resolvedAt = null;

              discussion.resolvedBy = null;

              discussion.status =
                discussion.answerCount > 0 ? "answered" : "open";
            }

            discussion.lastActivityAt = new Date();

            await discussion.save();
          }
        }
      }

      /*
       * Reply ka parent discussion lock.
       */
      if (parsedAction === "lock_discussion") {
        await Discussion.findByIdAndUpdate(
          reply.discussion,

          {
            $set: {
              isLocked: true,
            },
          },
        );
      }
    }
  }

  const now = new Date();

  report.status = parsedStatus;

  report.reviewedBy = adminId;

  report.reviewedAt = report.reviewedAt ?? now;

  report.resolutionNote = normalizedResolutionNote;

  report.moderationAction = parsedAction;

  report.resolvedAt = now;

  await report.save();

  return {
    report,

    message:
      parsedStatus === "resolved"
        ? "Discussion report resolved successfully"
        : "Discussion report rejected successfully",
  };
}
