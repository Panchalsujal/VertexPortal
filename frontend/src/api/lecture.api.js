import api from './axios';

export const createLecture = (moduleId, data) => api.post(`/lectures/${moduleId}/create-lecture`, data);
export const getPublishedLectures = (moduleId) => api.get(`/lectures/${moduleId}/lectures`);
export const getManageLectures = (moduleId) => api.get(`/lectures/${moduleId}/manage`);
export const updateLecture = (lectureId, data) => api.patch(`/lectures/${lectureId}/update-lecture`, data);
export const publishLecture = (lectureId) => api.patch(`/lectures/${lectureId}/publish`);
export const archiveLecture = (lectureId) => api.delete(`/lectures/${lectureId}`);
export const uploadLectureVideo = (lectureId, formData, onUploadProgress) =>
  api.patch(`/lectures/${lectureId}/upload-video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
export const uploadLectureDocument = (lectureId, formData, onUploadProgress) =>
  api.patch(`/lectures/${lectureId}/upload-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
export const reorderLecture = (lectureId, data) => api.patch(`/lectures/${lectureId}/reorder`, data);

// ImageKit client-side direct upload helpers
export const getUploadAuthToken = () => api.get('/lectures/upload-auth-token');
export const updateLectureMediaUrl = (lectureId, data) =>
  api.patch(`/lectures/${lectureId}/update-media-url`, data);

