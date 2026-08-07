import api from './axios';

export const updateMyProfile = (data) => api.patch('/users/me', data);
export const updatePassword = (data) => api.patch('/users/me/password', data);
export const updateAvatar = (formData) =>
  api.patch('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
