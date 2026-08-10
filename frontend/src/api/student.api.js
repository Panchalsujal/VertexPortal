import api from './axios';

// ─── Student Course APIs ───────────────────────────────────────────────────
export const getMyCourses = () => api.get('/student/my-courses');
export const getContinueLearning = () => api.get('/student/continue-learning');
export const resumeCourse = (courseId) => api.get(`/student/course/${courseId}/resume`);
export const getCoursePlayer = (courseId) => api.get(`/student/course/${courseId}/player`);

// ─── Student Quiz APIs ─────────────────────────────────────────────────────
export const getStudentQuizzes = () => api.get('/student/quizzes');
export const getStudentQuiz = (quizId) => api.get(`/student/quizzes/${quizId}`);
export const startQuizAttempt = (quizId) => api.post(`/student/quizzes/${quizId}/attempts/start`);
export const saveQuizAnswer = (quizId, attemptId, questionId, data) =>
  api.put(`/student/quizzes/${quizId}/attempts/${attemptId}/answers/${questionId}`, data);
export const submitQuizAttempt = (quizId, attemptId) =>
  api.post(`/student/quizzes/${quizId}/attempts/${attemptId}/submit`);
export const getQuizAttempts = (quizId) => api.get(`/student/quizzes/${quizId}/attempts`);
export const getQuizAttempt = (quizId, attemptId) =>
  api.get(`/student/quizzes/${quizId}/attempts/${attemptId}`);
export const getQuizAttemptResult = (quizId, attemptId) =>
  api.get(`/student/quizzes/${quizId}/attempts/${attemptId}/result`);

// ─── Student Assignment APIs ───────────────────────────────────────────────
export const getStudentAssignments = (params) =>
  api.get('/student/assignments', { params: { availability: 'all', ...params } });
export const getStudentAssignment = (assignmentId) =>
  api.get(`/student/assignments/${assignmentId}`);
export const submitAssignment = (assignmentId, formData) =>
  api.post(`/student/assignments/${assignmentId}/submissions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getMyAssignmentSubmissions = (assignmentId) =>
  api.get(`/student/assignments/${assignmentId}/submissions`);
export const getAssignmentSubmission = (assignmentId, submissionId) =>
  api.get(`/student/assignments/${assignmentId}/submissions/${submissionId}`);

// ─── Student Announcement APIs ─────────────────────────────────────────────
export const getStudentAnnouncements = () => api.get('/student/announcements');
export const getStudentAnnouncement = (announcementId) =>
  api.get(`/student/announcements/${announcementId}`);
export const markAllAnnouncementsRead = () =>
  api.patch('/student/announcements/read-all');
export const markAnnouncementRead = (announcementId) =>
  api.patch(`/student/announcements/${announcementId}/read`);

// ─── Student Live Class APIs ───────────────────────────────────────────────
export const getStudentLiveClasses = () => api.get('/student/live-classes');
export const getStudentLiveClass = (liveClassId) =>
  api.get(`/student/live-classes/${liveClassId}`);
export const joinLiveClass = (liveClassId) =>
  api.post(`/student/live-classes/${liveClassId}/join`);
export const leaveLiveClass = (liveClassId) =>
  api.post(`/student/live-classes/${liveClassId}/leave`);
export const getLiveClassResources = (liveClassId) =>
  api.get(`/student/live-classes/${liveClassId}/resources`);
export const getLiveClassAttendanceHistory = () =>
  api.get('/student/live-classes/attendance/history');

