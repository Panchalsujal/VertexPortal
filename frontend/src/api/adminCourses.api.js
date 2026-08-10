import api from './axios';

// ─── §40: Admin Courses APIs ──────────────────────────────────────────────

export const getAdminCourseAnalytics = () => api.get('/admin/courses/analytics');
export const getAdminCoursesList = (params) => api.get('/admin/courses', { params });
export const getAdminCourseDetail = (courseId) => api.get(`/admin/courses/${courseId}`);
export const publishAdminCourse = (courseId) => api.patch(`/admin/courses/${courseId}/publish`);
export const unpublishAdminCourse = (courseId) => api.patch(`/admin/courses/${courseId}/unpublish`);
export const activateAdminCourse = (courseId) => api.patch(`/admin/courses/${courseId}/activate`);
export const deactivateAdminCourse = (courseId) => api.patch(`/admin/courses/${courseId}/deactivate`);
export const archiveAdminCourse = (courseId) => api.patch(`/admin/courses/${courseId}/archive`);
