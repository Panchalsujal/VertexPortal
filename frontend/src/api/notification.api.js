import api from './axios';

export const getNotifications = (params) => api.get('/notifications', { params });
export const getNotificationPreferences = () => api.get('/notifications/preferences');
export const updateNotificationPreferences = (data) =>
  api.patch('/notifications/preferences', data);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const markNotificationRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`);
export const archiveNotification = (notificationId) =>
  api.patch(`/notifications/${notificationId}/archive`);
export const restoreNotification = (notificationId) =>
  api.patch(`/notifications/${notificationId}/restore`);
export const deleteNotification = (notificationId) =>
  api.delete(`/notifications/${notificationId}`);
