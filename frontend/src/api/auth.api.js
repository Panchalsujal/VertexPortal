import api from './axios';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const verifyEmail = (userId, token) => api.get(`/auth/verify-email/${userId}/${token}`);
export const googleAuth = (data) => api.post('/auth/google', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const verifyResetToken = (userId, token) => api.get(`/auth/verify-reset-token/${userId}/${token}`);
export const resetPassword = (userId, token, data) => api.post(`/auth/reset-password/${userId}/${token}`, data);
