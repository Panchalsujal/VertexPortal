import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema(
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

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 10000,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "open",
        "answered",
        "resolved",
        "closed",
      ],
      default: "open",
      index: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    isLocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    answerCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
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

discussionSchema.index({
  course: 1,
  status: 1,
  lastActivityAt: -1,
});

discussionSchema.index({
  lecture: 1,
  createdAt: -1,
});

discussionSchema.index({
  author: 1,
  createdAt: -1,
});

const Discussion = mongoose.model(
  "Discussion",
  discussionSchema,
);

export default Discussion;