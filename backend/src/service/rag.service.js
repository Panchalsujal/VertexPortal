import mongoose from "mongoose";

import RagChunk from "../models/ragChunk.model.js";

import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";

import { generateEmbedding, generateEmbeddings } from "./embedding.service.js";

import { validateObjectId } from "../utils/validator.js";

import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

import { parseEnumQuery } from "../utils/queryParser.js";

import { ApiError } from "../utils/ApiError.js";

const RESOURCE_TYPES = ["course", "module", "lecture", "document", "note"];

const CHUNK_SIZE = 1400;
const CHUNK_OVERLAP = 200;

/*
 * RAG retrieval configuration
 */
const DEFAULT_SEARCH_LIMIT = 6;

const MAX_SEARCH_LIMIT = 20;

/*
 * Absolute minimum relevance.
 */
const DEFAULT_MINIMUM_SCORE = 0.65;

/*
 * Top result ke comparison me kitna
 * score drop allow karenge.
 *
 * Example:
 *
 * top = 0.86
 *
 * allowed:
 * >= 0.81
 */
const DEFAULT_RELATIVE_SCORE_DROP = 0.03;

/*
 * LLM ko unnecessarily huge context
 * nahi bhejna.
 */
const DEFAULT_MAX_CONTEXT_CHARACTERS = 12000;

/*
 * ----------------------------------
 * Text normalization
 * ----------------------------------
 */
function normalizeText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/*
 * ----------------------------------
 * Text chunking
 *
 * Character-based simple chunker.
 *
 * Later tokenizer-based chunker
 * bana sakte hain.
 * ----------------------------------
 */
export function splitTextIntoChunks(
  text,
  {
    chunkSize = CHUNK_SIZE,

    overlap = CHUNK_OVERLAP,
  } = {},
) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  if (overlap >= chunkSize) {
    throw new ApiError(400, "Chunk overlap must be smaller than chunk size");
  }

  const chunks = [];

  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    let end = Math.min(
      start + chunkSize,

      normalized.length,
    );

    /*
     * Possible ho to sentence/space boundary.
     */
    if (end < normalized.length) {
      const nearbyBreak = Math.max(
        normalized.lastIndexOf("\n", end),

        normalized.lastIndexOf(". ", end),

        normalized.lastIndexOf(" ", end),
      );

      if (nearbyBreak > start + chunkSize * 0.6) {
        end = nearbyBreak + 1;
      }
    }

    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({
        chunkIndex: index,

        content,
      });

      index += 1;
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}

/*
 * ==================================
 * COURSE ACCESS
 * ==================================
 */
export async function validateRagCourseAccess({ userId, userRole, courseId }) {
  validateObjectId(userId, "user ID");

  validateObjectId(courseId, "course ID");

  const course = await Course.findOne({
    _id: courseId,

    isActive: true,
  })
    .select(
      `
        _id
        title
        slug
        instructor
        status
        isPublished
        isActive
      `,
    )
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (userRole === "admin") {
    return course;
  }

  if (userRole === "instructor") {
    if (course.instructor.toString() !== String(userId)) {
      throw new ApiError(403, "You do not have access to this course");
    }

    return course;
  }

  if (userRole === "student") {
    const enrollment = await Enrollment.findOne({
      student: userId,

      course: courseId,

      status: {
        $in: ["active", "completed"],
      },
    })
      .select(
        `
          _id
          expiresAt
        `,
      )
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

    return course;
  }

  throw new ApiError(403, "You do not have access to this course");
}

/*
 * ==================================
 * GENERIC RESOURCE INGESTION
 * ==================================
 */
export async function ingestRagResource({
  userId,
  userRole,
  courseId,

  resourceType,
  resourceId,

  title,
  text,

  moduleId = null,
  lectureId = null,

  metadata = null,
}) {
  validateObjectId(userId, "user ID");

  validateObjectId(courseId, "course ID");

  validateObjectId(resourceId, "resource ID");

  const parsedResourceType = parseEnumQuery(
    resourceType,
    RESOURCE_TYPES,
    "RAG resource type",
  );

  await validateRagCourseAccess({
    userId,
    userRole,
    courseId,
  });

  /*
   * Student ingestion nahi karega.
   */
  if (userRole === "student") {
    throw new ApiError(403, "Students cannot add AI knowledge resources");
  }

  if (moduleId) {
    validateObjectId(moduleId, "module ID");
  }

  if (lectureId) {
    validateObjectId(lectureId, "lecture ID");
  }

  const normalizedTitle = String(title || "").trim();

  if (!normalizedTitle) {
    throw new ApiError(400, "Resource title is required");
  }

  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    throw new ApiError(400, "Resource text is required");
  }

  const chunks = splitTextIntoChunks(normalizedText);

  if (chunks.length === 0) {
    throw new ApiError(400, "No valid chunks generated");
  }

  /*
   * Bulk embeddings.
   */
  const embeddings = await generateEmbeddings(
    chunks.map((chunk) => chunk.content),
  );

  /*
   * Same resource re-ingest ho to
   * purane chunks remove.
   */
  await RagChunk.deleteMany({
    course: courseId,

    resourceType: parsedResourceType,

    resourceId,
  });

  const documents = chunks.map((chunk, index) => ({
    course: new mongoose.Types.ObjectId(courseId),

    module: moduleId ? new mongoose.Types.ObjectId(moduleId) : null,

    lecture: lectureId ? new mongoose.Types.ObjectId(lectureId) : null,

    resourceType: parsedResourceType,

    resourceId: new mongoose.Types.ObjectId(resourceId),

    title: normalizedTitle,

    content: chunk.content,

    chunkIndex: chunk.chunkIndex,

    embedding: embeddings[index],

    metadata: metadata ?? null,

    isActive: true,
  }));

  await RagChunk.insertMany(documents);

  return {
    courseId,

    resourceType: parsedResourceType,

    resourceId,

    title: normalizedTitle,

    chunksCreated: documents.length,

    message: "AI knowledge resource indexed successfully",
  };
}

/*
 * ==================================
 * INGEST COURSE
 * ==================================
 */
export async function ingestCourseForRag({ userId, userRole, courseId }) {
  const course = await validateRagCourseAccess({
    userId,
    userRole,
    courseId,
  });

  if (userRole === "student") {
    throw new ApiError(403, "Students cannot index course content");
  }

  const content = [course.title].filter(Boolean).join("\n\n");

  return ingestRagResource({
    userId,
    userRole,

    courseId,

    resourceType: "course",

    resourceId: course._id,

    title: course.title,

    text: content,
  });
}

/*
 * ==================================
 * INGEST MODULE
 * ==================================
 */
export async function ingestModuleForRag({ userId, userRole, moduleId }) {
  validateObjectId(moduleId, "module ID");

  const module = await CourseModule.findOne({
    _id: moduleId,

    isActive: true,
  })
    .select(
      `
        _id
        course
        title
      `,
    )
    .lean();

  if (!module) {
    throw new ApiError(404, "Course module not found");
  }

  await validateRagCourseAccess({
    userId,
    userRole,

    courseId: module.course,
  });

  if (userRole === "student") {
    throw new ApiError(403, "Students cannot index module content");
  }

  return ingestRagResource({
    userId,
    userRole,

    courseId: module.course,

    moduleId: module._id,

    resourceType: "module",

    resourceId: module._id,

    title: module.title,

    text: module.title,
  });
}

/*
 * ==================================
 * INGEST LECTURE
 *
 * Ye title + textual fields ingest karta hai.
 *
 * Tumhare Lecture model me actual field names
 * ke according text fields baad me extend kar
 * sakte ho.
 * ==================================
 */
export async function ingestLectureForRag({ userId, userRole, lectureId }) {
  validateObjectId(lectureId, "lecture ID");

  const lecture = await Lecture.findOne({
    _id: lectureId,
    isActive: true,
  })
    .select(
      `
        _id
        course
        module
        title
        description
        content
        type
        videoUrl
        documentUrl
        isPublished
      `,
    )
    .lean();

  if (!lecture) {
    throw new ApiError(404, "Lecture not found");
  }

  await validateRagCourseAccess({
    userId,
    userRole,
    courseId: lecture.course,
  });

  if (userRole === "student") {
    throw new ApiError(403, "Students cannot index lecture content");
  }

  /*
   * Quiz aur live lecture ko directly
   * RAG me index nahi karenge.
   */
  if (["quiz", "live"].includes(lecture.type)) {
    throw new ApiError(
      400,
      `${lecture.type} lecture cannot be indexed directly`,
    );
  }

  /*
   * Lecture ke actual textual fields.
   */
  const lectureText = [
    lecture.title ? `Lecture Title:\n${lecture.title}` : null,

    lecture.description ? `Description:\n${lecture.description}` : null,

    lecture.content ? `Lecture Content:\n${lecture.content}` : null,
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  /*
   * Sirf title ko useful RAG knowledge
   * consider nahi karenge.
   */
  const hasUsefulContent =
    Boolean(String(lecture.description || "").trim()) ||
    Boolean(String(lecture.content || "").trim());

  if (!hasUsefulContent) {
    if (lecture.type === "video") {
      throw new ApiError(
        400,
        "Video lecture requires transcript, description, or text content before AI indexing",
      );
    }

    if (lecture.type === "document") {
      throw new ApiError(
        400,
        "Document text must be extracted before AI indexing",
      );
    }

    throw new ApiError(
      400,
      "Lecture does not contain enough text content to index",
    );
  }

  return ingestRagResource({
    userId,
    userRole,

    courseId: lecture.course,

    moduleId: lecture.module ?? null,

    lectureId: lecture._id,

    resourceType: "lecture",

    resourceId: lecture._id,

    title: lecture.title,

    text: lectureText,

    metadata: {
      lectureType: lecture.type,

      isPublished: lecture.isPublished,

      videoUrl: lecture.videoUrl ?? null,

      documentUrl: lecture.documentUrl ?? null,
    },
  });
}

/*
 * ==================================
 * VECTOR SEARCH
 * ==================================
 */
export async function searchCourseKnowledge({
  userId,
  userRole,
  courseId,

  query,

  limit = DEFAULT_SEARCH_LIMIT,

  minimumScore = DEFAULT_MINIMUM_SCORE,

  relativeScoreDrop = DEFAULT_RELATIVE_SCORE_DROP,

  maxContextCharacters = DEFAULT_MAX_CONTEXT_CHARACTERS,
}) {
  /*
   * ----------------------------------
   * Course access
   * ----------------------------------
   */
  await validateRagCourseAccess({
    userId,
    userRole,
    courseId,
  });

  /*
   * ----------------------------------
   * Query validation
   * ----------------------------------
   */
  const normalizedQuery = String(query || "").trim();

  if (!normalizedQuery) {
    throw new ApiError(400, "Search query is required");
  }

  /*
   * ----------------------------------
   * Limit validation
   * ----------------------------------
   */
  const parsedLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_SEARCH_LIMIT, 1),
    MAX_SEARCH_LIMIT,
  );

  /*
   * ----------------------------------
   * Minimum score
   * ----------------------------------
   */
  const parsedMinimumScore = Number.isFinite(Number(minimumScore))
    ? Number(minimumScore)
    : DEFAULT_MINIMUM_SCORE;

  /*
   * ----------------------------------
   * Relative score drop
   * ----------------------------------
   */
  const parsedRelativeScoreDrop = Number.isFinite(Number(relativeScoreDrop))
    ? Math.max(Number(relativeScoreDrop), 0)
    : DEFAULT_RELATIVE_SCORE_DROP;

  /*
   * ----------------------------------
   * Context size
   * ----------------------------------
   */
  const parsedMaxContextCharacters = Number.isFinite(
    Number(maxContextCharacters),
  )
    ? Math.max(Number(maxContextCharacters), 1000)
    : DEFAULT_MAX_CONTEXT_CHARACTERS;

  /*
   * ----------------------------------
   * Query embedding
   * ----------------------------------
   */
  const queryEmbedding = await generateEmbedding(normalizedQuery);

  /*
   * Hum final required limit se
   * thode extra candidates retrieve
   * karenge.
   *
   * Baad me JS side par:
   *
   * - relative filtering
   * - duplicates
   * - context limit
   *
   * apply honge.
   */
  const vectorLimit = Math.min(Math.max(parsedLimit * 3, 12), 50);

  /*
   * ----------------------------------
   * MongoDB Vector Search
   * ----------------------------------
   */
  const rawResults = await RagChunk.aggregate([
    {
      $vectorSearch: {
        index: "rag_vector_index",

        path: "embedding",

        queryVector: queryEmbedding,

        numCandidates: Math.max(vectorLimit * 10, 100),

        limit: vectorLimit,

        filter: {
          course: new mongoose.Types.ObjectId(courseId),

          isActive: true,
        },
      },
    },

    {
      $project: {
        _id: 1,

        course: 1,

        module: 1,

        lecture: 1,

        resourceType: 1,

        resourceId: 1,

        title: 1,

        content: 1,

        chunkIndex: 1,

        metadata: 1,

        score: {
          $meta: "vectorSearchScore",
        },
      },
    },

    /*
     * First-level absolute
     * relevance filtering.
     */
    {
      $match: {
        score: {
          $gte: parsedMinimumScore,
        },
      },
    },

    {
      $sort: {
        score: -1,
      },
    },
  ]);

  if (rawResults.length === 0) {
    return [];
  }

  /*
   * ==================================
   * RELATIVE SCORE FILTER
   * ==================================
   *
   * Example:
   *
   * top result = 0.90
   * drop       = 0.05
   *
   * threshold  = 0.85
   *
   * 0.90 ✅
   * 0.88 ✅
   * 0.86 ✅
   * 0.82 ❌
   */
  const topScore = Number(rawResults[0].score);

  const relativeThreshold = Math.max(
    parsedMinimumScore,

    topScore - parsedRelativeScoreDrop,
  );

  const relevantResults = rawResults.filter(
    (result) => Number(result.score) >= relativeThreshold,
  );

  /*
   * ==================================
   * EXACT DUPLICATE REMOVAL
   * ==================================
   *
   * Same resource + same chunk
   * accidentally duplicate ho to
   * LLM ko twice nahi bhejenge.
   */
  const seenChunks = new Set();

  const uniqueResults = [];

  for (const result of relevantResults) {
    const duplicateKey = [
      String(result.resourceType),

      String(result.resourceId),

      String(result.chunkIndex),
    ].join(":");

    if (seenChunks.has(duplicateKey)) {
      continue;
    }

    seenChunks.add(duplicateKey);

    uniqueResults.push(result);
  }

  /*
   * ==================================
   * CONTEXT SIZE CONTROL
   * ==================================
   *
   * Long PDF/video ke 20 chunks
   * accidentally LLM prompt me
   * nahi jayenge.
   */
  const finalResults = [];

  let totalCharacters = 0;

  for (const result of uniqueResults) {
    if (finalResults.length >= parsedLimit) {
      break;
    }

    const contentLength = String(result.content || "").length;

    /*
     * First result ko always allow.
     *
     * Baaki results context limit
     * exceed kare to stop.
     */
    if (
      finalResults.length > 0 &&
      totalCharacters + contentLength > parsedMaxContextCharacters
    ) {
      break;
    }

    finalResults.push(result);

    totalCharacters += contentLength;
  }

  return finalResults;
}

/*
 * ==================================
 * LIST INDEXED RESOURCES
 * ==================================
 */
export async function getCourseRagChunks({
  userId,
  userRole,
  courseId,
  query = {},
}) {
  await validateRagCourseAccess({
    userId,
    userRole,
    courseId,
  });

  const { resourceType } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    course: courseId,

    isActive: true,
  };

  const parsedResourceType = parseEnumQuery(
    resourceType,
    RESOURCE_TYPES,
    "RAG resource type",
  );

  if (parsedResourceType !== undefined) {
    filter.resourceType = parsedResourceType;
  }

  const [chunks, totalRecords] = await Promise.all([
    RagChunk.find(filter)
      .select(
        `
        course
        module
        lecture
        resourceType
        resourceId
        title
        content
        chunkIndex
        metadata
        createdAt
        updatedAt
      `,
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    RagChunk.countDocuments(filter),
  ]);

  return {
    chunks,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),
  };
}

/*
 * ==================================
 * DELETE INDEXED RESOURCE
 * ==================================
 */
export async function deleteRagResource({
  userId,
  userRole,
  courseId,

  resourceType,
  resourceId,
}) {
  await validateRagCourseAccess({
    userId,
    userRole,
    courseId,
  });

  if (userRole === "student") {
    throw new ApiError(403, "Students cannot delete AI knowledge resources");
  }

  validateObjectId(resourceId, "resource ID");

  const parsedResourceType = parseEnumQuery(
    resourceType,
    RESOURCE_TYPES,
    "RAG resource type",
  );

  const result = await RagChunk.deleteMany({
    course: courseId,

    resourceType: parsedResourceType,

    resourceId,
  });

  return {
    deletedChunks: result.deletedCount,

    message: "AI knowledge resource deleted successfully",
  };
}
