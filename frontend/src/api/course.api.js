import api from './axios';

export const getAllCourses = (params) => api.get('/courses', { params });
export const getCourseBySlug = (slug) => api.get(`/courses/${slug}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (courseId, data) => api.patch(`/courses/${courseId}`, data);
export const publishCourse = (courseId) => api.patch(`/courses/${courseId}/publish`);
export const archiveCourse = (courseId) => api.delete(`/courses/${courseId}`);
export const updateCourseThumbnail = (courseId, formData) =>
  api.patch(`/courses/${courseId}/thumbnail`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
