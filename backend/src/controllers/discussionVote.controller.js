import { asyncHandler } from "../utils/asyncHandler.js";

import {
  toggleDiscussionUpvote,
  toggleDiscussionReplyUpvote,
  getDiscussionVoteStatus,
} from "../service/discussionVote.service.js";

/*
 * Discussion upvote toggle.
 */
export const toggleDiscussionUpvoteController = asyncHandler(
  async (req, res) => {
    const { discussionId } = req.params;

    const result = await toggleDiscussionUpvote({
      userId: req.user.id,

      userRole: req.user.role,

      discussionId,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      upvoted: result.upvoted,

      upvoteCount: result.upvoteCount,
    });
  },
);

/*
 * Reply upvote toggle.
 */
export const toggleDiscussionReplyUpvoteController = asyncHandler(
  async (req, res) => {
    const { discussionId, replyId } = req.params;

    const result = await toggleDiscussionReplyUpvote({
      userId: req.user.id,

      userRole: req.user.role,

      discussionId,

      replyId,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      upvoted: result.upvoted,

      upvoteCount: result.upvoteCount,
    });
  },
);

/*
 * Current user vote status.
 */
export const getDiscussionVoteStatusController = asyncHandler(
  async (req, res) => {
    const { discussionId } = req.params;

    const result = await getDiscussionVoteStatus({
      userId: req.user.id,

      userRole: req.user.role,

      discussionId,
    });

    return res.status(200).json({
      success: true,

      message: "Discussion vote status fetched successfully",

      discussionUpvoted: result.discussionUpvoted,

      replyUpvotes: result.replyUpvotes,
    });
  },
);
