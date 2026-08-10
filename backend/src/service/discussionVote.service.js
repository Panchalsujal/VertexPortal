import Discussion from "../models/discussion.model.js";
import DiscussionReply from "../models/discussionReply.model.js";
import DiscussionVote from "../models/discussionVote.model.js";
import Enrollment from "../models/enrollment.model.js";

import { validateObjectId } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";

/*
 * Discussion access validation.
 */
async function getAccessibleDiscussion({ userId, userRole, discussionId }) {
  const discussion = await Discussion.findOne({
    _id: discussionId,
    isActive: true,
  })
    .populate({
      path: "course",
      select: "_id instructor title",
    })
    .lean();

  if (!discussion) {
    throw new ApiError(404, "Discussion not found");
  }

  /*
   * Admin full access.
   */
  if (userRole === "admin") {
    return discussion;
  }

  /*
   * Instructor only own course.
   */
  if (userRole === "instructor") {
    if (discussion.course.instructor.toString() !== String(userId)) {
      throw new ApiError(403, "You do not have access to this discussion");
    }

    return discussion;
  }

  /*
   * Student enrollment required.
   */
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

    return discussion;
  }

  throw new ApiError(403, "You do not have access to this discussion");
}

/*
 * Discussion upvote toggle.
 */
export async function toggleDiscussionUpvote({
  userId,
  userRole,
  discussionId,
}) {
  validateObjectId(userId, "user ID");

  validateObjectId(discussionId, "discussion ID");

  const discussion = await getAccessibleDiscussion({
    userId,
    userRole,
    discussionId,
  });

  const existingVote = await DiscussionVote.findOne({
    user: userId,

    targetType: "discussion",

    targetId: discussionId,
  });

  /*
   * Already upvoted =>
   * remove upvote.
   */
  if (existingVote) {
    await existingVote.deleteOne();

    const updatedDiscussion = await Discussion.findByIdAndUpdate(
      discussionId,

      [
        {
          $set: {
            upvoteCount: {
              $max: [
                0,

                {
                  $subtract: [
                    {
                      $ifNull: ["$upvoteCount", 0],
                    },

                    1,
                  ],
                },
              ],
            },
          },
        },
      ],

      {
        new: true,
      },
    )
      .select("_id upvoteCount")
      .lean();

    return {
      upvoted: false,

      upvoteCount: updatedDiscussion?.upvoteCount ?? 0,

      message: "Discussion upvote removed successfully",
    };
  }

  /*
   * Create new vote.
   */
  try {
    await DiscussionVote.create({
      user: userId,

      course: discussion.course._id,

      targetType: "discussion",

      targetId: discussionId,
    });
  } catch (error) {
    /*
     * Concurrent duplicate request protection.
     */
    if (error?.code === 11000) {
      const currentDiscussion = await Discussion.findById(discussionId)
        .select("_id upvoteCount")
        .lean();

      return {
        upvoted: true,

        upvoteCount: currentDiscussion?.upvoteCount ?? 0,

        message: "Discussion is already upvoted",
      };
    }

    throw error;
  }

  const updatedDiscussion = await Discussion.findByIdAndUpdate(
    discussionId,

    {
      $inc: {
        upvoteCount: 1,
      },
    },

    {
      new: true,
    },
  )
    .select("_id upvoteCount")
    .lean();

  return {
    upvoted: true,

    upvoteCount: updatedDiscussion?.upvoteCount ?? 0,

    message: "Discussion upvoted successfully",
  };
}

/*
 * Reply upvote toggle.
 */
export async function toggleDiscussionReplyUpvote({
  userId,
  userRole,
  discussionId,
  replyId,
}) {
  validateObjectId(userId, "user ID");

  validateObjectId(discussionId, "discussion ID");

  validateObjectId(replyId, "reply ID");

  const discussion = await getAccessibleDiscussion({
    userId,
    userRole,
    discussionId,
  });

  const reply = await DiscussionReply.findOne({
    _id: replyId,

    discussion: discussionId,

    isActive: true,
  })
    .select("_id discussion upvoteCount")
    .lean();

  if (!reply) {
    throw new ApiError(404, "Discussion reply not found");
  }

  const existingVote = await DiscussionVote.findOne({
    user: userId,

    targetType: "reply",

    targetId: replyId,
  });

  /*
   * Existing vote remove.
   */
  if (existingVote) {
    await existingVote.deleteOne();

    const updatedReply = await DiscussionReply.findByIdAndUpdate(
      replyId,

      [
        {
          $set: {
            upvoteCount: {
              $max: [
                0,

                {
                  $subtract: [
                    {
                      $ifNull: ["$upvoteCount", 0],
                    },

                    1,
                  ],
                },
              ],
            },
          },
        },
      ],

      {
        new: true,
      },
    )
      .select("_id upvoteCount")
      .lean();

    return {
      upvoted: false,

      upvoteCount: updatedReply?.upvoteCount ?? 0,

      message: "Reply upvote removed successfully",
    };
  }

  /*
   * New reply vote.
   */
  try {
    await DiscussionVote.create({
      user: userId,

      course: discussion.course._id,

      targetType: "reply",

      targetId: replyId,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const currentReply = await DiscussionReply.findById(replyId)
        .select("_id upvoteCount")
        .lean();

      return {
        upvoted: true,

        upvoteCount: currentReply?.upvoteCount ?? 0,

        message: "Reply is already upvoted",
      };
    }

    throw error;
  }

  const updatedReply = await DiscussionReply.findByIdAndUpdate(
    replyId,

    {
      $inc: {
        upvoteCount: 1,
      },
    },

    {
      new: true,
    },
  )
    .select("_id upvoteCount")
    .lean();

  return {
    upvoted: true,

    upvoteCount: updatedReply?.upvoteCount ?? 0,

    message: "Reply upvoted successfully",
  };
}

/*
 * Current user ka complete vote state
 * current discussion ke liye.
 */
export async function getDiscussionVoteStatus({
  userId,
  userRole,
  discussionId,
}) {
  validateObjectId(userId, "user ID");

  validateObjectId(discussionId, "discussion ID");

  await getAccessibleDiscussion({
    userId,
    userRole,
    discussionId,
  });

  /*
   * IMPORTANT:
   *
   * Current discussion ke active replies
   * pehle identify karenge.
   */
  const replies = await DiscussionReply.find({
    discussion: discussionId,

    isActive: true,
  })
    .select("_id")
    .lean();

  const replyIds = replies.map((reply) => reply._id);

  /*
   * Discussion vote.
   */
  const discussionVote = await DiscussionVote.findOne({
    user: userId,

    targetType: "discussion",

    targetId: discussionId,
  })
    .select("_id")
    .lean();

  /*
   * Sirf CURRENT discussion ke reply votes.
   */
  const replyVotes =
    replyIds.length > 0
      ? await DiscussionVote.find({
          user: userId,

          targetType: "reply",

          targetId: {
            $in: replyIds,
          },
        })
          .select("targetId")
          .lean()
      : [];

  return {
    discussionUpvoted: Boolean(discussionVote),

    replyUpvotes: replyVotes.map((vote) => vote.targetId.toString()),
  };
}
