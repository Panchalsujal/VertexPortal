import api from './axios';

// ─── §41: AI Assistant APIs ───────────────────────────────────────────────

export const createAiConversation = (data) => api.post('/ai/conversations', data);
export const getMyAiConversations = (params) => api.get('/ai/conversations', { params });
export const getAiConversationById = (conversationId, params) =>
  api.get(`/ai/conversations/${conversationId}`, { params });
export const sendAiMessage = (conversationId, data) =>
  api.post(`/ai/conversations/${conversationId}/messages`, data);
export const renameAiConversation = (conversationId, data) =>
  api.patch(`/ai/conversations/${conversationId}/title`, data);
export const archiveAiConversation = (conversationId, data) =>
  api.patch(`/ai/conversations/${conversationId}/archive`, data);
export const deleteAiConversation = (conversationId) =>
  api.delete(`/ai/conversations/${conversationId}`);

// ─── AI Quiz Generation ────────────────────────────────────────────────────
export const generateQuizWithAi = (data) => api.post('/ai/generate-quiz', data);
