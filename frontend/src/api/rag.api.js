import api from './axios';

// ─── §42: RAG Knowledge Search APIs ──────────────────────────────────────

export const searchCourseKnowledge = (courseId, data) =>
  api.post(`/ai/rag/courses/${courseId}/search`, data);
export const getCourseRagChunks = (courseId) =>
  api.get(`/ai/rag/courses/${courseId}/chunks`);
export const ingestRagResource = (data) => api.post('/ai/rag/resources', data);
export const indexCourseForRag = (courseId) =>
  api.post(`/ai/rag/courses/${courseId}/index`);
export const indexModuleForRag = (moduleId) =>
  api.post(`/ai/rag/modules/${moduleId}/index`);
export const indexLectureForRag = (lectureId) =>
  api.post(`/ai/rag/lectures/${lectureId}/index`);
export const deleteRagResource = (courseId, resourceType, resourceId) =>
  api.delete(`/ai/rag/courses/${courseId}/resources/${resourceType}/${resourceId}`);
