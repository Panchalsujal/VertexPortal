import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createDiscussion, getDiscussions, getDiscussionById,
  updateDiscussion, deleteDiscussion,
  createDiscussionReply, updateDiscussionReply, deleteDiscussionReply,
  acceptDiscussionAnswer, updateDiscussionResolved, updateDiscussionModeration,
  toggleDiscussionUpvote, toggleReplyUpvote, getDiscussionVoteStatus,
} from '../../api/discussion.api';

const getErr = (e) => e?.message || e?.response?.data?.message || 'Failed';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchDiscussions = createAsyncThunk('discussions/fetchAll', async (params, { rejectWithValue }) => {
  try { const r = await getDiscussions(params); return r.data; }
  catch (e) { return rejectWithValue(getErr(e)); }
});

export const fetchDiscussionById = createAsyncThunk('discussions/fetchOne', async (id, { rejectWithValue }) => {
  try { const r = await getDiscussionById(id); return r.data.discussion; }
  catch (e) { return rejectWithValue(getErr(e)); }
});

export const addDiscussion = createAsyncThunk('discussions/create', async (data, { rejectWithValue }) => {
  try { const r = await createDiscussion(data); return r.data.discussion; }
  catch (e) { return rejectWithValue(getErr(e)); }
});

export const editDiscussion = createAsyncThunk('discussions/update', async ({ id, data }, { rejectWithValue }) => {
  try { const r = await updateDiscussion(id, data); return r.data.discussion; }
  catch (e) { return rejectWithValue(getErr(e)); }
});

export const removeDiscussion = createAsyncThunk('discussions/delete', async (id, { rejectWithValue }) => {
  try { await deleteDiscussion(id); return id; }
  catch (e) { return rejectWithValue(getErr(e)); }
});

export const addReply = createAsyncThunk('discussions/addReply', async ({ discussionId, data }, { dispatch, rejectWithValue }) => {
  try {
    const r = await createDiscussionReply(discussionId, data);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(getErr(e));
  }
});

export const removeReply = createAsyncThunk('discussions/removeReply', async ({ discussionId, replyId }, { dispatch, rejectWithValue }) => {
  try {
    const r = await deleteDiscussionReply(discussionId, replyId);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(getErr(e));
  }
});

export const acceptAnswer = createAsyncThunk('discussions/acceptAnswer', async ({ discussionId, replyId }, { dispatch, rejectWithValue }) => {
  try {
    const r = await acceptDiscussionAnswer(discussionId, replyId);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(getErr(e));
  }
});

export const markResolved = createAsyncThunk('discussions/resolve', async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const r = await updateDiscussionResolved(id, data);
    dispatch(fetchDiscussionById(id));
    return r.data.discussion;
  } catch (e) {
    return rejectWithValue(getErr(e));
  }
});

export const moderateDiscussion = createAsyncThunk('discussions/moderate', async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const r = await updateDiscussionModeration(id, data);
    dispatch(fetchDiscussionById(id));
    return r.data.discussion;
  } catch (e) {
    return rejectWithValue(getErr(e));
  }
});

export const upvoteDiscussion = createAsyncThunk('discussions/upvote', async (id, { dispatch, rejectWithValue }) => {
  try {
    const r = await toggleDiscussionUpvote(id);
    dispatch(fetchDiscussionById(id));
    return r.data;
  } catch (e) {
    return rejectWithValue(getErr(e));
  }
});

export const upvoteReply = createAsyncThunk('discussions/upvoteReply', async ({ discussionId, replyId }, { dispatch, rejectWithValue }) => {
  try {
    const r = await toggleReplyUpvote(discussionId, replyId);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(getErr(e));
  }
});

export const fetchVoteStatus = createAsyncThunk('discussions/voteStatus', async (id, { rejectWithValue }) => {
  try { const r = await getDiscussionVoteStatus(id); return r.data; }
  catch (e) { return rejectWithValue(getErr(e)); }
});

// ─── Slice ────────────────────────────────────────────────────────────────────
const discussionsSlice = createSlice({
  name: 'discussions',
  initialState: {
    list: [], current: null, pagination: null, voteStatus: null,
    loading: false, error: null,
  },
  reducers: {
    clearCurrent: (s) => { s.current = null; },
    setDiscussionsSnapshot: (s, a) => {
      if (a.payload.list !== undefined) s.list = a.payload.list;
      if (a.payload.current !== undefined) s.current = a.payload.current;
      if (a.payload.voteStatus !== undefined) s.voteStatus = a.payload.voteStatus;
    },
    optimisticToggleDiscussionUpvote: (s, a) => {
      const { id } = a.payload;
      const currentlyUpvoted = Boolean(s.voteStatus?.discussionUpvoted);
      const newUpvoted = !currentlyUpvoted;
      const delta = newUpvoted ? 1 : -1;

      if (!s.voteStatus) s.voteStatus = { discussionUpvoted: false, replyUpvotes: [] };
      s.voteStatus.discussionUpvoted = newUpvoted;

      if (s.current && (s.current._id === id || s.current.id === id)) {
        const currentCount = Number(s.current.upvoteCount ?? s.current.upvotesCount ?? s.current.upvotes?.length ?? 0);
        const nextCount = Math.max(0, currentCount + delta);
        s.current.upvoteCount = nextCount;
        s.current.upvotesCount = nextCount;
      }
      const listItem = s.list.find((d) => d._id === id || d.id === id);
      if (listItem) {
        const currentCount = Number(listItem.upvoteCount ?? listItem.upvotesCount ?? listItem.upvotes?.length ?? 0);
        const nextCount = Math.max(0, currentCount + delta);
        listItem.upvoteCount = nextCount;
        listItem.upvotesCount = nextCount;
      }
    },
    optimisticToggleReplyUpvote: (s, a) => {
      const { replyId } = a.payload;
      if (!s.voteStatus) s.voteStatus = { discussionUpvoted: false, replyUpvotes: [] };
      if (!Array.isArray(s.voteStatus.replyUpvotes)) s.voteStatus.replyUpvotes = [];

      const strReplyId = String(replyId);
      const isUpvoted = s.voteStatus.replyUpvotes.map(String).includes(strReplyId);
      const delta = isUpvoted ? -1 : 1;

      if (isUpvoted) {
        s.voteStatus.replyUpvotes = s.voteStatus.replyUpvotes.filter((id) => String(id) !== strReplyId);
      } else {
        s.voteStatus.replyUpvotes.push(replyId);
      }

      if (s.current && Array.isArray(s.current.replies)) {
        const reply = s.current.replies.find((r) => String(r._id || r.id) === strReplyId);
        if (reply) {
          const currentCount = Number(reply.upvoteCount ?? reply.upvotesCount ?? reply.upvotes?.length ?? 0);
          const nextCount = Math.max(0, currentCount + delta);
          reply.upvoteCount = nextCount;
          reply.upvotesCount = nextCount;
        }
      }
    },
    optimisticRemoveDiscussion: (s, a) => {
      const id = a.payload;
      s.list = s.list.filter((d) => d._id !== id && d.id !== id);
      if (s.current && (s.current._id === id || s.current.id === id)) {
        s.current = null;
      }
    },
    optimisticRemoveReply: (s, a) => {
      const { replyId } = a.payload;
      if (s.current && Array.isArray(s.current.replies)) {
        s.current.replies = s.current.replies.filter((r) => String(r._id || r.id) !== String(replyId));
      }
    },
    optimisticAddReply: (s, a) => {
      const { reply } = a.payload;
      if (s.current) {
        if (!Array.isArray(s.current.replies)) s.current.replies = [];
        s.current.replies.push(reply);
      }
    },
    optimisticModerateDiscussion: (s, a) => {
      const { id, data } = a.payload;
      if (s.current && (s.current._id === id || s.current.id === id)) {
        Object.assign(s.current, data);
      }
      const listItem = s.list.find((d) => d._id === id || d.id === id);
      if (listItem) {
        Object.assign(listItem, data);
      }
    },
  },
  extraReducers: (b) => {
    b
      .addCase(fetchDiscussions.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDiscussions.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.discussions || []; s.pagination = a.payload.pagination; })
      .addCase(fetchDiscussions.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchDiscussionById.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(addDiscussion.fulfilled, (s, a) => { s.list.unshift(a.payload); })
      .addCase(editDiscussion.fulfilled, (s, a) => { const i = s.list.findIndex(d => d._id === a.payload._id); if (i !== -1) s.list[i] = a.payload; if (s.current?._id === a.payload._id) s.current = a.payload; })
      .addCase(removeDiscussion.fulfilled, (s, a) => { s.list = s.list.filter(d => d._id !== a.payload); if (s.current?._id === a.payload) s.current = null; })
      .addCase(fetchVoteStatus.fulfilled, (s, a) => { s.voteStatus = a.payload; });
  },
});

export const {
  clearCurrent,
  setDiscussionsSnapshot,
  optimisticToggleDiscussionUpvote,
  optimisticToggleReplyUpvote,
  optimisticRemoveDiscussion,
  optimisticRemoveReply,
  optimisticAddReply,
  optimisticModerateDiscussion,
} = discussionsSlice.actions;
export const selectDiscussions = (s) => s.discussions.list;
export const selectCurrentDiscussion = (s) => s.discussions.current;
export const selectDiscussionPagination = (s) => s.discussions.pagination;
export const selectDiscussionLoading = (s) => s.discussions.loading;
export const selectDiscussionVoteStatus = (s) => s.discussions.voteStatus;
export default discussionsSlice.reducer;
