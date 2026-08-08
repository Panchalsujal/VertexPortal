import api from './axios';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const verifyEmail = (userId, token) => api.get(`/auth/verify-email/${userId}/${token}`);
