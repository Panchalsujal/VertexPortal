import api from './axios';

// ─── §32: Discussion APIs ──────────────────────────────────────────────────

export const createDiscussion = (data) => api.post('/discussions', data);
export const getDiscussions = (params) => api.get('/discussions', { params });
export const getDiscussionById = (discussionId) => api.get(`/discussions/${discussionId}`);
export const updateDiscussion = (discussionId, data) => api.patch(`/discussions/${discussionId}`, data);
export const deleteDiscussion = (discussionId) => api.delete(`/discussions/${discussionId}`);

// Replies
export const createDiscussionReply = (discussionId, data) => api.post(`/discussions/${discussionId}/replies`, data);
export const updateDiscussionReply = (discussionId, replyId, data) => api.patch(`/discussions/${discussionId}/replies/${replyId}`, data);
export const deleteDiscussionReply = (discussionId, replyId) => api.delete(`/discussions/${discussionId}/replies/${replyId}`);
export const acceptDiscussionAnswer = (discussionId, replyId) => api.patch(`/discussions/${discussionId}/replies/${replyId}/accept`);

// Moderation
export const updateDiscussionResolved = (discussionId, data) => api.patch(`/discussions/${discussionId}/resolved`, data);
export const updateDiscussionModeration = (discussionId, data) => api.patch(`/discussions/${discussionId}/moderation`, data);

// Votes
export const toggleDiscussionUpvote = (discussionId) => api.post(`/discussions/${discussionId}/upvote`);
export const toggleReplyUpvote = (discussionId, replyId) => api.post(`/discussions/${discussionId}/replies/${replyId}/upvote`);
export const getDiscussionVoteStatus = (discussionId) => api.get(`/discussions/${discussionId}/votes`);
