import api from './axios';

// ─── §36: Instructor Dashboard APIs ───────────────────────────────────────

export const getInstructorDashboardOverview = () => api.get('/instructor/dashboard');
export const getInstructorCoursePerformance = () => api.get('/instructor/dashboard/courses');
export const getInstructorRevenueAnalytics = (params) => api.get('/instructor/dashboard/revenue', { params });
export const getInstructorLiveClassOverview = () => api.get('/instructor/dashboard/live-classes');
