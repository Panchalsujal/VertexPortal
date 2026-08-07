import api from './axios';

export const createModule = (courseId, data) => api.post(`/modules/${courseId}/modules`, data);
export const getPublishedModules = (courseId) => api.get(`/modules/${courseId}/modules`);
export const getManageModules = (courseId) => api.get(`/modules/${courseId}/modules/manage`);
export const updateModule = (moduleId, data) => api.patch(`/modules/updatemodule/${moduleId}`, data);
export const deleteModule = (moduleId) => api.delete(`/modules/deletemodule/${moduleId}`);
export const publishModule = (moduleId) => api.patch(`/modules/${moduleId}/publish`);
export const reorderModule = (moduleId, data) => api.patch(`/modules/${moduleId}/reorder`, data);
