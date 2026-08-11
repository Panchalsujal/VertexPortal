import mongoose from "mongoose";
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
    if (discussion.course.instructor?.toString() !== String(userId)) {
      throw new ApiError(403, "You do not have access to this discussion");
    }

    return discussion;
  }

  /*
   * Student enrollment check or auto-enrollment.
   */
  if (userRole === "student") {
    let enrollment = await Enrollment.findOne({
      student: userId,
      course: discussion.course._id,
      status: {
        $in: ["active", "completed"],
      },
    })
      .select("_id expiresAt")
      .lean();

    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: userId,
        course: discussion.course._id,
        status: "active",
        progressPercentage: 0,
        enrolledAt: new Date(),
      });
    } else if (
      enrollment.expiresAt &&
      new Date(enrollment.expiresAt).getTime() <= Date.now()
    ) {
      throw new ApiError(403, "Your course enrollment has expired");
    }

    return discussion;
  }

  return discussion;
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

  const userObjId = new mongoose.Types.ObjectId(userId);
  const targetObjId = new mongoose.Types.ObjectId(discussionId);

  const existingVote = await DiscussionVote.findOne({
    user: userObjId,
    targetType: "discussion",
    targetId: targetObjId,
  });

  /*
   * Already upvoted => Remove upvote (Unlike)
   */
  if (existingVote) {
    await existingVote.deleteOne();

    const realCount = await DiscussionVote.countDocuments({
      targetType: "discussion",
      targetId: targetObjId,
    });

    const updatedDiscussion = await Discussion.findByIdAndUpdate(
      discussionId,
      { upvoteCount: realCount },
      { new: true }
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
   * Create new vote (Like)
   */
  try {
    await DiscussionVote.create({
      user: userObjId,
      course: discussion.course._id,
      targetType: "discussion",
      targetId: targetObjId,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const realCount = await DiscussionVote.countDocuments({
        targetType: "discussion",
        targetId: targetObjId,
      });

      return {
        upvoted: true,
        upvoteCount: realCount,
        message: "Discussion is already upvoted",
      };
    }
    throw error;
  }

  const realCount = await DiscussionVote.countDocuments({
    targetType: "discussion",
    targetId: targetObjId,
  });

  const updatedDiscussion = await Discussion.findByIdAndUpdate(
    discussionId,
    { upvoteCount: realCount },
    { new: true }
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

  const userObjId = new mongoose.Types.ObjectId(userId);
  const replyObjId = new mongoose.Types.ObjectId(replyId);

  const existingVote = await DiscussionVote.findOne({
    user: userObjId,
    targetType: "reply",
    targetId: replyObjId,
  });

  /*
   * Existing vote remove (Unlike reply)
   */
  if (existingVote) {
    await existingVote.deleteOne();

    const realCount = await DiscussionVote.countDocuments({
      targetType: "reply",
      targetId: replyObjId,
    });

    const updatedReply = await DiscussionReply.findByIdAndUpdate(
      replyId,
      { upvoteCount: realCount },
      { new: true }
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
   * New reply vote
   */
  try {
    await DiscussionVote.create({
      user: userObjId,
      course: discussion.course._id,
      targetType: "reply",
      targetId: replyObjId,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const realCount = await DiscussionVote.countDocuments({
        targetType: "reply",
        targetId: replyObjId,
      });

      return {
        upvoted: true,
        upvoteCount: realCount,
        message: "Reply is already upvoted",
      };
    }
    throw error;
  }

  const realCount = await DiscussionVote.countDocuments({
    targetType: "reply",
    targetId: replyObjId,
  });

  const updatedReply = await DiscussionReply.findByIdAndUpdate(
    replyId,
    { upvoteCount: realCount },
    { new: true }
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
 * Current user ka vote status for discussion & replies
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

  const userObjId = new mongoose.Types.ObjectId(userId);
  const targetObjId = new mongoose.Types.ObjectId(discussionId);

  const replies = await DiscussionReply.find({
    discussion: discussionId,
    isActive: true,
  })
    .select("_id")
    .lean();

  const replyIds = replies.map((r) => new mongoose.Types.ObjectId(r._id));

  const discussionVote = await DiscussionVote.findOne({
    user: userObjId,
    targetType: "discussion",
    targetId: targetObjId,
  })
    .select("_id")
    .lean();

  const replyVotes =
    replyIds.length > 0
      ? await DiscussionVote.find({
          user: userObjId,
          targetType: "reply",
          targetId: { $in: replyIds },
        })
          .select("targetId")
          .lean()
      : [];

  return {
    discussionUpvoted: Boolean(discussionVote),
    replyUpvotes: replyVotes.map((vote) => vote.targetId.toString()),
  };
}
