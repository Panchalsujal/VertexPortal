import api from './axios';

// ─── §37: Admin Dashboard APIs ────────────────────────────────────────────

export const getAdminDashboardStats = () => api.get('/admin/dashboard');
