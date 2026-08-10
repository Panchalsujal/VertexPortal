import api from './axios';

export const addToCart = (courseId) => api.post(`/cart/${courseId}`);
export const getMyCart = () => api.get('/cart');
export const removeFromCart = (courseId) => api.delete(`/cart/${courseId}`);
export const getCartStatus = (courseId) => api.get(`/cart/${courseId}/status`);
export const clearCart = () => api.delete('/cart');
