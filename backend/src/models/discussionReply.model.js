import mongoose from "mongoose";

const discussionReplySchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 10000,
    },

    parentReply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionReply",
      default: null,
      index: true,
    },

    /*
     * Total upvotes on this reply.
     */
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Reply instructor/admin ne diya hai ya nahi.
     */
    isInstructorReply: {
      type: Boolean,
      default: false,
      index: true,
    },

    /*
     * Accepted answer.
     */
    isAcceptedAnswer: {
      type: Boolean,
      default: false,
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
     * Edit tracking.
     */
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    /*
     * Soft delete.
     */
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
 * Discussion replies chronological order me fetch
 * karne ke liye.
 */
discussionReplySchema.index({
  discussion: 1,
  createdAt: 1,
});

/*
 * Parent ke nested replies fetch karne ke liye.
 */
discussionReplySchema.index({
  discussion: 1,
  parentReply: 1,
  createdAt: 1,
});

const DiscussionReply = mongoose.model(
  "DiscussionReply",
  discussionReplySchema,
);

export default DiscussionReply;
