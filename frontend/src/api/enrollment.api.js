import api from './axios';

export const createEnrollment = (courseId) => api.post(`/enrollments/${courseId}`);
export const getMyEnrollments = () => api.get('/enrollments/me');
export const getEnrollmentByCourse = (courseId) => api.get(`/enrollments/${courseId}`);
