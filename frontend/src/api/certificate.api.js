import api from './axios';

// ─── Student Certificate APIs ──────────────────────────────────────────────
export const getMyCertificates = () => api.get('/certificates/me');
export const getMyCertificate = (certificateId) =>
  api.get(`/certificates/me/${certificateId}`);
export const downloadMyCertificate = (certificateId) =>
  api.get(`/certificates/me/${certificateId}/download`, { responseType: 'blob' });
export const verifyCertificate = (verificationCode) =>
  api.get(`/certificates/verify/${verificationCode}`);

// ─── Admin Certificate APIs ────────────────────────────────────────────────
export const adminIssueCertificate = (data) => api.post('/admin/certificates/issue', data);
export const adminGetAllCertificates = (params) =>
  api.get('/admin/certificates', { params });
export const adminGetIssueQueue = () => api.get('/admin/certificates/issue-queue');
export const adminRetryCertificate = (enrollmentId) =>
  api.post(`/admin/certificates/retry/${enrollmentId}`);
export const adminRetryBulkCertificates = () =>
  api.post('/admin/certificates/retry-bulk');
export const adminDownloadCertificate = (certificateId) =>
  api.get(`/admin/certificates/${certificateId}/download`, { responseType: 'blob' });
export const adminRevokeCertificate = (certificateId, data) =>
  api.patch(`/admin/certificates/${certificateId}/revoke`, data);
export const adminRestoreCertificate = (certificateId) =>
  api.patch(`/admin/certificates/${certificateId}/restore`);
export const adminRegenerateCertificatePdf = (certificateId) =>
  api.post(`/admin/certificates/${certificateId}/regenerate-pdf`);
