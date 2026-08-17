import api from './axios';

export const getCourseReviews = (courseId) => api.get(`/courses/${courseId}/reviews`);
export const getFeaturedReviews = () => api.get('/reviews/featured');
export const getPlatformStats = () => api.get('/reviews/stats');
export const getMyReview = (courseId) => api.get(`/courses/${courseId}/my-review`);
export const createReview = (courseId, data) => api.post(`/courses/${courseId}/reviews`, data);
export const updateReview = (reviewId, data) => api.patch(`/reviews/${reviewId}`, data);
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);
