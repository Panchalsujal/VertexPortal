import api from './axios';

export const markLectureCompleted = (lectureId) => api.post(`/lectures/${lectureId}/complete`);
export const updateWatchTime = (lectureId, data) => api.patch(`/lectures/${lectureId}/watch-time`, data);
export const getCourseProgress = (courseId) => api.get(`/courses/${courseId}/progress`);
export const getContinueLearning = () => api.get('/me/continue-learning');
