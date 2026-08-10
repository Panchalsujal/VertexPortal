import api from './axios';

// ─── §35: Student Notes APIs ───────────────────────────────────────────────

export const createNote = (data) => api.post('/notes', data);
export const getCourseNotes = (courseId, params) => api.get(`/notes/course/${courseId}`, { params });
export const getLectureNotes = (lectureId) => api.get(`/notes/lecture/${lectureId}`);
export const getNoteById = (noteId) => api.get(`/notes/${noteId}`);
export const updateNote = (noteId, data) => api.patch(`/notes/${noteId}`, data);
export const deleteNote = (noteId) => api.delete(`/notes/${noteId}`);
