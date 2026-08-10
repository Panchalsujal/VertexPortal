import api from './axios';

// ─── §34: Admin Discussion Report APIs ────────────────────────────────────

export const getAdminDiscussionReports = (params) => api.get('/admin/discussion-reports', { params });
export const getAdminDiscussionReport = (reportId) => api.get(`/admin/discussion-reports/${reportId}`);
export const startDiscussionReportReview = (reportId) => api.patch(`/admin/discussion-reports/${reportId}/review`);
export const resolveDiscussionReport = (reportId, data) => api.patch(`/admin/discussion-reports/${reportId}/resolve`, data);
