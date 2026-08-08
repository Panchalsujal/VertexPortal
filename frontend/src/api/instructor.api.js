import api from './axios';

// ─── Instructor Quiz APIs ──────────────────────────────────────────────────
export const createQuiz = (data) => api.post('/instructor/quizzes', data);
export const getInstructorQuizzes = () => api.get('/instructor/quizzes');
export const getInstructorQuiz = (quizId) => api.get(`/instructor/quizzes/${quizId}`);
export const updateQuiz = (quizId, data) => api.patch(`/instructor/quizzes/${quizId}`, data);
export const updateQuizStatus = (quizId, data) =>
  api.patch(`/instructor/quizzes/${quizId}/status`, data);
export const deleteQuiz = (quizId) => api.delete(`/instructor/quizzes/${quizId}`);
export const restoreQuiz = (quizId) => api.patch(`/instructor/quizzes/${quizId}/restore`);

// Quiz Questions
export const addQuizQuestion = (quizId, data) =>
  api.post(`/instructor/quizzes/${quizId}/questions`, data);
export const updateQuizQuestion = (quizId, questionId, data) =>
  api.patch(`/instructor/quizzes/${quizId}/questions/${questionId}`, data);
export const deleteQuizQuestion = (quizId, questionId) =>
  api.delete(`/instructor/quizzes/${quizId}/questions/${questionId}`);
export const restoreQuizQuestion = (quizId, questionId) =>
  api.patch(`/instructor/quizzes/${quizId}/questions/${questionId}/restore`);

// Quiz Attempts (Instructor view)
export const getQuizAttempts = (quizId) =>
  api.get(`/instructor/quizzes/${quizId}/attempts`);
export const getQuizAttempt = (quizId, attemptId) =>
  api.get(`/instructor/quizzes/${quizId}/attempts/${attemptId}`);
export const evaluateAnswer = (quizId, attemptId, answerId, data) =>
  api.patch(
    `/instructor/quizzes/${quizId}/attempts/${attemptId}/answers/${answerId}/evaluate`,
    data
  );
export const submitAttemptByInstructor = (quizId, attemptId) =>
  api.post(`/instructor/quizzes/${quizId}/attempts/${attemptId}/submit`);
export const updateQuizResultSettings = (quizId, data) =>
  api.patch(`/instructor/quizzes/${quizId}/results/settings`, data);
export const getQuizAnalytics = (quizId) =>
  api.get(`/instructor/quizzes/${quizId}/analytics`);

// ─── Instructor Assignment APIs ────────────────────────────────────────────
export const createAssignment = (data) => api.post('/instructor/assignments', data);
export const getInstructorAssignments = () => api.get('/instructor/assignments');
export const getInstructorAssignment = (assignmentId) =>
  api.get(`/instructor/assignments/${assignmentId}`);
export const updateAssignment = (assignmentId, data) =>
  api.patch(`/instructor/assignments/${assignmentId}`, data);
export const updateAssignmentStatus = (assignmentId, data) =>
  api.patch(`/instructor/assignments/${assignmentId}/status`, data);
export const deleteAssignment = (assignmentId) =>
  api.delete(`/instructor/assignments/${assignmentId}`);
export const restoreAssignment = (assignmentId) =>
  api.patch(`/instructor/assignments/${assignmentId}/restore`);
export const getAssignmentSubmissions = (assignmentId) =>
  api.get(`/instructor/assignments/${assignmentId}/submissions`);
export const getAssignmentSubmission = (assignmentId, submissionId) =>
  api.get(`/instructor/assignments/${assignmentId}/submissions/${submissionId}`);
export const gradeSubmission = (assignmentId, submissionId, data) =>
  api.patch(
    `/instructor/assignments/${assignmentId}/submissions/${submissionId}/grade`,
    data
  );
export const returnSubmission = (assignmentId, submissionId, data) =>
  api.patch(
    `/instructor/assignments/${assignmentId}/submissions/${submissionId}/return`,
    data
  );
export const getAssignmentAnalytics = (assignmentId) =>
  api.get(`/instructor/assignments/${assignmentId}/analytics`);

// ─── Instructor Announcement APIs ─────────────────────────────────────────
export const createAnnouncement = (data) => api.post('/instructor/announcements', data);
export const getInstructorAnnouncements = () => api.get('/instructor/announcements');
export const getInstructorAnnouncement = (announcementId) =>
  api.get(`/instructor/announcements/${announcementId}`);
export const updateAnnouncement = (announcementId, data) =>
  api.patch(`/instructor/announcements/${announcementId}`, data);
export const updateAnnouncementStatus = (announcementId, data) =>
  api.patch(`/instructor/announcements/${announcementId}/status`, data);

// ─── Instructor Live Class APIs ────────────────────────────────────────────
export const createLiveClass = (data) => api.post('/instructor/live-classes', data);
export const getInstructorLiveClasses = () => api.get('/instructor/live-classes');
export const getInstructorLiveClass = (liveClassId) =>
  api.get(`/instructor/live-classes/${liveClassId}`);
export const updateLiveClass = (liveClassId, data) =>
  api.patch(`/instructor/live-classes/${liveClassId}`, data);
export const updateLiveClassStatus = (liveClassId, data) =>
  api.patch(`/instructor/live-classes/${liveClassId}/status`, data);
export const cancelLiveClass = (liveClassId, data) =>
  api.patch(`/instructor/live-classes/${liveClassId}/cancel`, data);
