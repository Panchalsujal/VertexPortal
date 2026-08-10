import mongoose from "mongoose";

const discussionReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    targetAuthor: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Course",

      required: true,

      index: true,
    },

    discussion: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Discussion",

      required: true,

      index: true,
    },

    targetType: {
      type: String,

      enum: ["discussion", "reply"],

      required: true,

      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,

      required: true,

      index: true,
    },

    reason: {
      type: String,

      enum: [
        "spam",
        "harassment",
        "abusive_language",
        "inappropriate_content",
        "misinformation",
        "plagiarism",
        "other",
      ],

      required: true,

      index: true,
    },

    description: {
      type: String,

      trim: true,

      default: "",

      maxlength: 2000,
    },

    status: {
      type: String,

      enum: ["pending", "reviewing", "resolved", "rejected"],

      default: "pending",

      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      default: null,
    },

    reviewedAt: {
      type: Date,

      default: null,
    },

    resolutionNote: {
      type: String,

      trim: true,

      default: "",

      maxlength: 2000,
    },

    moderationAction: {
      type: String,

      enum: ["none", "hide_content", "delete_content", "lock_discussion"],

      default: "none",
    },

    resolvedAt: {
      type: Date,

      default: null,
    },
  },
  {
    timestamps: true,

    versionKey: false,
  },
);

/*
 * Same user same content par ek hi active
 * pending/reviewing report ideally hona chahiye.
 *
 * Actual active-status duplicate protection
 * service me bhi hai.
 */
discussionReportSchema.index({
  reporter: 1,

  targetType: 1,

  targetId: 1,

  status: 1,
});

/*
 * Admin moderation queue.
 */
discussionReportSchema.index({
  status: 1,

  createdAt: -1,
});

/*
 * Ek content par kitne reports hain.
 */
discussionReportSchema.index({
  targetType: 1,

  targetId: 1,

  createdAt: -1,
});

/*
 * Course moderation.
 */
discussionReportSchema.index({
  course: 1,

  status: 1,

  createdAt: -1,
});

const DiscussionReport = mongoose.model(
  "DiscussionReport",
  discussionReportSchema,
);

export default DiscussionReport;
