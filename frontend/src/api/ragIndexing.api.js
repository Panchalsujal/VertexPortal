import api from './axios';

// ─── §43: RAG Indexing APIs ───────────────────────────────────────────────

export const getCourseIndexingJobs = (courseId) =>
  api.get(`/ai/indexing/course/${courseId}`);
export const getIndexingJob = (jobId) =>
  api.get(`/ai/indexing/${jobId}`);
export const retryIndexingJob = (jobId) =>
  api.post(`/ai/indexing/${jobId}/retry`);
