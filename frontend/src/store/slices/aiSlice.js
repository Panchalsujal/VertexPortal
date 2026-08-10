import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createAiConversation, getMyAiConversations, getAiConversationById,
  sendAiMessage, renameAiConversation, archiveAiConversation, deleteAiConversation,
} from '../../api/ai.api';

export const fetchConversations = createAsyncThunk('ai/fetchConversations', async (params, { rejectWithValue }) => {
  try { const r = await getMyAiConversations(params); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchConversation = createAsyncThunk('ai/fetchOne', async ({ id, params }, { rejectWithValue }) => {
  try { const r = await getAiConversationById(id, params); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const startConversation = createAsyncThunk('ai/create', async (data, { rejectWithValue }) => {
  try { const r = await createAiConversation(data); return r.data.conversation; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const sendMessage = createAsyncThunk('ai/sendMessage', async ({ conversationId, data }, { rejectWithValue }) => {
  try { const r = await sendAiMessage(conversationId, data); return r.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const renameConversation = createAsyncThunk('ai/rename', async ({ conversationId, data }, { rejectWithValue }) => {
  try { const r = await renameAiConversation(conversationId, data); return r.data.conversation; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const toggleArchiveConversation = createAsyncThunk('ai/archive', async ({ conversationId, data }, { rejectWithValue }) => {
  try { const r = await archiveAiConversation(conversationId, data); return r.data.conversation; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const removeConversation = createAsyncThunk('ai/delete', async (conversationId, { rejectWithValue }) => {
  try { await deleteAiConversation(conversationId); return conversationId; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    conversations: [], current: null, messages: [],
    pagination: null, sending: false, loading: false, error: null,
  },
  reducers: { clearAiChat: (s) => { s.current = null; s.messages = []; } },
  extraReducers: (b) => {
    b
      .addCase(fetchConversations.pending, (s) => { s.loading = true; })
      .addCase(fetchConversations.fulfilled, (s, a) => { s.loading = false; s.conversations = a.payload.conversations || []; s.pagination = a.payload.pagination; })
      .addCase(fetchConversations.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchConversation.fulfilled, (s, a) => { s.current = a.payload.conversation; s.messages = a.payload.messages || []; })
      .addCase(startConversation.fulfilled, (s, a) => { s.conversations.unshift(a.payload); s.current = a.payload; s.messages = []; })
      .addCase(sendMessage.pending, (s) => { s.sending = true; })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.sending = false;
        if (a.payload.userMessage) s.messages.push(a.payload.userMessage);
        const botMsg = a.payload.assistantMessage || a.payload.aiMessage;
        if (botMsg) s.messages.push(botMsg);
      })
      .addCase(sendMessage.rejected, (s, a) => { s.sending = false; s.error = a.payload; })
      .addCase(renameConversation.fulfilled, (s, a) => {
        const i = s.conversations.findIndex(c => c._id === a.payload._id);
        if (i !== -1) s.conversations[i] = a.payload;
        if (s.current?._id === a.payload._id) s.current = a.payload;
      })
      .addCase(toggleArchiveConversation.fulfilled, (s, a) => {
        const i = s.conversations.findIndex(c => c._id === a.payload._id);
        if (i !== -1) s.conversations[i] = a.payload;
      })
      .addCase(removeConversation.fulfilled, (s, a) => {
        s.conversations = s.conversations.filter(c => c._id !== a.payload);
        if (s.current?._id === a.payload) { s.current = null; s.messages = []; }
      });
  },
});

export const { clearAiChat } = aiSlice.actions;
export const selectAiConversations = (s) => s.ai.conversations;
export const selectCurrentConversation = (s) => s.ai.current;
export const selectAiMessages = (s) => s.ai.messages;
export const selectAiSending = (s) => s.ai.sending;
export const selectAiLoading = (s) => s.ai.loading;
export default aiSlice.reducer;
