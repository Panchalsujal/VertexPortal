import mongoose from "mongoose";

const discussionVoteSchema = new mongoose.Schema(
  {
    user: {
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/*
 * Same user same target ko sirf ek upvote
 * de sakta hai.
 */
discussionVoteSchema.index(
  {
    user: 1,
    targetType: 1,
    targetId: 1,
  },
  {
    unique: true,
  },
);

/*
 * Target ke votes fast lookup.
 */
discussionVoteSchema.index({
  targetType: 1,
  targetId: 1,
  createdAt: -1,
});

const DiscussionVote = mongoose.model("DiscussionVote", discussionVoteSchema);

export default DiscussionVote;
