import mongoose from "mongoose";

const ragChunkSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      default: null,
      index: true,
    },

    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      default: null,
      index: true,
    },

    resourceType: {
      type: String,
      enum: [
        "course",
        "module",
        "lecture",
        "document",
        "note",
      ],
      required: true,
      index: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    content: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Mistral mistral-embed
     * embedding dimensions = 1024
     */
    embedding: {
      type: [Number],
      required: true,
      select: false,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/*
 * Same active resource ka same chunk
 * duplicate nahi ho sakta.
 */
ragChunkSchema.index(
  {
    course: 1,
    resourceType: 1,
    resourceId: 1,
    chunkIndex: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
    },
  },
);

/*
 * Course resource filtering.
 */
ragChunkSchema.index({
  course: 1,
  resourceType: 1,
  isActive: 1,
});

const RagChunk = mongoose.model(
  "RagChunk",
  ragChunkSchema,
);

export default RagChunk;