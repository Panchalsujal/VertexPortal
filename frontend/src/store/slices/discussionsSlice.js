import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createDiscussion, getDiscussions, getDiscussionById,
  updateDiscussion, deleteDiscussion,
  createDiscussionReply, updateDiscussionReply, deleteDiscussionReply,
  acceptDiscussionAnswer, updateDiscussionResolved, updateDiscussionModeration,
  toggleDiscussionUpvote, toggleReplyUpvote, getDiscussionVoteStatus,
} from '../../api/discussion.api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchDiscussions = createAsyncThunk('discussions/fetchAll', async (params, { rejectWithValue }) => {
  try { const r = await getDiscussions(params); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchDiscussionById = createAsyncThunk('discussions/fetchOne', async (id, { rejectWithValue }) => {
  try { const r = await getDiscussionById(id); return r.data.discussion; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const addDiscussion = createAsyncThunk('discussions/create', async (data, { rejectWithValue }) => {
  try { const r = await createDiscussion(data); return r.data.discussion; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const editDiscussion = createAsyncThunk('discussions/update', async ({ id, data }, { rejectWithValue }) => {
  try { const r = await updateDiscussion(id, data); return r.data.discussion; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const removeDiscussion = createAsyncThunk('discussions/delete', async (id, { rejectWithValue }) => {
  try { await deleteDiscussion(id); return id; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const addReply = createAsyncThunk('discussions/addReply', async ({ discussionId, data }, { dispatch, rejectWithValue }) => {
  try {
    const r = await createDiscussionReply(discussionId, data);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const removeReply = createAsyncThunk('discussions/removeReply', async ({ discussionId, replyId }, { dispatch, rejectWithValue }) => {
  try {
    const r = await deleteDiscussionReply(discussionId, replyId);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const acceptAnswer = createAsyncThunk('discussions/acceptAnswer', async ({ discussionId, replyId }, { dispatch, rejectWithValue }) => {
  try {
    const r = await acceptDiscussionAnswer(discussionId, replyId);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const markResolved = createAsyncThunk('discussions/resolve', async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const r = await updateDiscussionResolved(id, data);
    dispatch(fetchDiscussionById(id));
    return r.data.discussion;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const moderateDiscussion = createAsyncThunk('discussions/moderate', async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const r = await updateDiscussionModeration(id, data);
    dispatch(fetchDiscussionById(id));
    return r.data.discussion;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const upvoteDiscussion = createAsyncThunk('discussions/upvote', async (id, { dispatch, rejectWithValue }) => {
  try {
    const r = await toggleDiscussionUpvote(id);
    dispatch(fetchDiscussionById(id));
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const upvoteReply = createAsyncThunk('discussions/upvoteReply', async ({ discussionId, replyId }, { dispatch, rejectWithValue }) => {
  try {
    const r = await toggleReplyUpvote(discussionId, replyId);
    dispatch(fetchDiscussionById(discussionId));
    return r.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed');
  }
});

export const fetchVoteStatus = createAsyncThunk('discussions/voteStatus', async (id, { rejectWithValue }) => {
  try { const r = await getDiscussionVoteStatus(id); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

// ─── Slice ────────────────────────────────────────────────────────────────────
const discussionsSlice = createSlice({
  name: 'discussions',
  initialState: {
    list: [], current: null, pagination: null, voteStatus: null,
    loading: false, error: null,
  },
  reducers: { clearCurrent: (s) => { s.current = null; } },
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

export const { clearCurrent } = discussionsSlice.actions;
export const selectDiscussions = (s) => s.discussions.list;
export const selectCurrentDiscussion = (s) => s.discussions.current;
export const selectDiscussionPagination = (s) => s.discussions.pagination;
export const selectDiscussionLoading = (s) => s.discussions.loading;
export const selectDiscussionVoteStatus = (s) => s.discussions.voteStatus;
export default discussionsSlice.reducer;
