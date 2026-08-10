import api from './axios';

// ─── §39: Admin Orders APIs ───────────────────────────────────────────────

export const getAdminOrderAnalytics = () => api.get('/admin/orders/analytics');
export const getAdminOrdersList = (params) => api.get('/admin/orders', { params });
export const getAdminOrderDetail = (orderId) => api.get(`/admin/orders/${orderId}`);
export const cancelAdminOrder = (orderId) => api.patch(`/admin/orders/${orderId}/cancel`);
export const markAdminOrderFailed = (orderId) => api.patch(`/admin/orders/${orderId}/failed`);
export const markAdminOrderRefunded = (orderId) => api.patch(`/admin/orders/${orderId}/refunded`);
