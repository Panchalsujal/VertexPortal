import api from './axios';

// ─── §38: Admin Users APIs ────────────────────────────────────────────────

export const getAdminUsersAnalytics = () => api.get('/admin/users/analytics');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const getAdminUser = (userId) => api.get(`/admin/users/${userId}`);
export const activateAdminUser = (userId) => api.patch(`/admin/users/${userId}/activate`);
export const deactivateAdminUser = (userId) => api.patch(`/admin/users/${userId}/deactivate`);
export const suspendAdminUser = (userId) => api.patch(`/admin/users/${userId}/suspend`);
export const updateAdminUserStatus = (userId, data) => api.patch(`/admin/users/${userId}/status`, data);
export const updateAdminUserRole = (userId, data) => api.patch(`/admin/users/${userId}/role`, data);
