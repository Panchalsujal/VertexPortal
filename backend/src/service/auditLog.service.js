import AuditLog from "../models/auditLog.model.js";
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

  const searchFilter = buildSearchFilter(search, [
    "action",
    "resourceType",
    "description",
    "ipAddress",
    "userAgent",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
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
    filter.action = action.trim();
  }

  if (resourceType?.trim()) {
    filter.resourceType = resourceType.trim();
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