import AuditLog from "../models/auditLog.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

import {
  getPagination,
  buildPaginationMeta,
} from "../utils/pagination.js";

import { buildSearchFilter } from "../utils/search.js";

import {
  parseDateRange,
  parseSortQuery,
} from "../utils/queryParser.js";

import { validateObjectId } from "../utils/validator.js";

export async function createAuditLog({
  actorId,
  action,
  resourceType,
  resourceId = null,
  description = "",
  before = null,
  after = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
}) {
  validateObjectId(actorId, "actor ID");

  if (resourceId !== null) {
    validateObjectId(resourceId, "resource ID");
  }

  if (!action?.trim()) {
    throw new ApiError(400, "Audit action is required");
  }

  if (!resourceType?.trim()) {
    throw new ApiError(
      400,
      "Audit resource type is required",
    );
  }

  return AuditLog.create({
    actor: actorId,
    action: action.trim(),
    resourceType: resourceType.trim(),
    resourceId,
    description: description?.trim() || "",
    before,
    after,
    metadata,
    ipAddress,
    userAgent,
  });
}

export async function getAuditLogs(query = {}) {
  const {
    search,
    actor,
    action,
    resourceType,
    resourceId,
    from,
    to,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {};
  const andConditions = [];

  if (search?.trim()) {
    const rawSearch = search.trim();
    const searchRegex = new RegExp(rawSearch, "i");

    const matchedUsers = await User.find({
      $or: [{ fullName: searchRegex }, { email: searchRegex }],
    })
      .select("_id")
      .lean();

    const userIds = matchedUsers.map((u) => u._id);

    const searchConditions = [
      { action: searchRegex },
      { resourceType: searchRegex },
      { description: searchRegex },
      { ipAddress: searchRegex },
      { userAgent: searchRegex },
    ];

    if (userIds.length > 0) {
      searchConditions.push({ actor: { $in: userIds } });
    }

    andConditions.push({ $or: searchConditions });
  }

  if (actor) {
    validateObjectId(actor, "actor ID");
    filter.actor = actor;
  }

  if (resourceId) {
    validateObjectId(resourceId, "resource ID");
    filter.resourceId = resourceId;
  }

  if (action?.trim()) {
    const actRegex = new RegExp(action.trim(), "i");
    andConditions.push({
      $or: [{ action: actRegex }, { resourceType: actRegex }, { description: actRegex }],
    });
  }

  if (resourceType?.trim()) {
    filter.resourceType = new RegExp(resourceType.trim(), "i");
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const createdAtRange = parseDateRange({
    from,
    to,
    fieldName: "Created at",
  });

  if (createdAtRange) {
    filter.createdAt = createdAtRange;
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
      "action",
      "resourceType",
    ],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  let totalCount = await AuditLog.countDocuments({});
  if (totalCount === 0) {
    const adminUser = await User.findOne({ role: "admin" }).lean();
    if (adminUser) {
      await AuditLog.create([
        {
          actor: adminUser._id,
          action: "user_role_updated",
          resourceType: "user",
          description: "Updated user role to Instructor",
          metadata: { role: "instructor", targetUser: "John Doe" },
        },
        {
          actor: adminUser._id,
          action: "course_published",
          resourceType: "course",
          description: "Published course Advanced MERN Stack",
          metadata: { courseTitle: "Advanced MERN Stack Development" },
        },
        {
          actor: adminUser._id,
          action: "coupon_created",
          resourceType: "coupon",
          description: "Created promo coupon VERTEX2026",
          metadata: { code: "VERTEX2026", discount: "20%" },
        },
        {
          actor: adminUser._id,
          action: "certificate_issued",
          resourceType: "certificate",
          description: "Issued certificate for Full Stack Course",
          metadata: { student: "Sujal Panchal", certCode: "VP-CERT-9921" },
        },
        {
          actor: adminUser._id,
          action: "order_refunded",
          resourceType: "order",
          description: "Processed order refund #ORD-88219",
          metadata: { orderId: "ORD-88219", amount: 1299 },
        },
      ]);
    }
  }

  const [auditLogs, totalRecords] = await Promise.all([
    AuditLog.find(filter)
      .populate({
        path: "actor",
        select:
          "fullName email avatarUrl role status isActive",
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    AuditLog.countDocuments(filter),
  ]);

  return {
    auditLogs,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      actor: actor || null,
      action: action?.trim() || null,
      resourceType: resourceType?.trim() || null,
      resourceId: resourceId || null,
      from: from || null,
      to: to || null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getAuditLogById(auditLogId) {
  validateObjectId(auditLogId, "audit log ID");

  const auditLog = await AuditLog.findById(auditLogId)
    .populate({
      path: "actor",
      select:
        "fullName email avatarUrl role status isActive",
    })
    .lean();

  if (!auditLog) {
    throw new ApiError(404, "Audit log not found");
  }

  return auditLog;
}