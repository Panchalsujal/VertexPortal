import api from './axios';

export const addToWishlist = (courseId) => api.post(`/wishlist/${courseId}`);
export const removeFromWishlist = (courseId) => api.delete(`/wishlist/${courseId}`);
export const getMyWishlist = () => api.get('/wishlist');
export const getWishlistStatus = (courseId) => api.get(`/wishlist/${courseId}/status`);
