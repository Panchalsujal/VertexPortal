import api from './axios';

// ─── §33: Discussion Report APIs ──────────────────────────────────────────

export const createDiscussionReport = (data) => api.post('/discussion-reports', data);
export const getMyDiscussionReports = () => api.get('/discussion-reports/my');
