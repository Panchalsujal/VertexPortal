import api from './axios';

export const getAllCoupons = (params) => api.get('/admin/coupons', { params });
export const getCouponById = (couponId) => api.get(`/admin/coupons/${couponId}`);
export const createCoupon = (data) => api.post('/admin/coupons', data);
export const updateCoupon = (couponId, data) => api.patch(`/admin/coupons/${couponId}`, data);
export const toggleCouponStatus = (couponId, isActive) => api.patch(`/admin/coupons/${couponId}/status`, { isActive });
export const deleteCoupon = (couponId) => api.delete(`/admin/coupons/${couponId}`);
export const restoreCoupon = (couponId) => api.patch(`/admin/coupons/${couponId}/restore`);
