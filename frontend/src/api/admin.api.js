import api from './axios';

// ─── Admin Dashboard ───────────────────────────────────────────────────────
export const getAdminDashboard = () => api.get('/admin/dashboard');

// ─── Admin Orders ──────────────────────────────────────────────────────────
export const getAdminOrders = (params) => api.get('/admin/orders', { params });
export const getAdminOrder = (orderId) => api.get(`/admin/orders/${orderId}`);

// ─── Admin Students ────────────────────────────────────────────────────────
export const getAdminStudents = (params) => api.get('/admin/students', { params });
export const getAdminStudent = (studentId) => api.get(`/admin/students/${studentId}`);
export const updateStudentStatus = (studentId, data) =>
  api.patch(`/admin/students/${studentId}/status`, data);

// ─── Admin Courses ─────────────────────────────────────────────────────────
export const getAdminCourses = (params) => api.get('/admin/courses', { params });
export const getAdminCourse = (courseId) => api.get(`/admin/courses/${courseId}`);
export const updateAdminCourseStatus = (courseId, data) =>
  api.patch(`/admin/courses/${courseId}/status`, data);
export const deleteAdminCourse = (courseId) => api.delete(`/admin/courses/${courseId}`);
export const restoreAdminCourse = (courseId) =>
  api.patch(`/admin/courses/${courseId}/restore`);

// ─── Admin Reviews ─────────────────────────────────────────────────────────
export const getAdminReviews = (params) => api.get('/admin/reviews', { params });
export const updateAdminReviewStatus = (reviewId, data) =>
  api.patch(`/admin/reviews/${reviewId}/status`, data);

// ─── Admin Coupons ─────────────────────────────────────────────────────────
export const getAdminCoupons = (params) => api.get('/admin/coupons', { params });
export const getAdminCoupon = (couponId) => api.get(`/admin/coupons/${couponId}`);
export const createAdminCoupon = (data) => api.post('/admin/coupons', data);
export const updateAdminCoupon = (couponId, data) =>
  api.patch(`/admin/coupons/${couponId}`, data);
export const toggleAdminCouponStatus = (couponId) =>
  api.patch(`/admin/coupons/${couponId}/status`);
export const deleteAdminCoupon = (couponId) =>
  api.delete(`/admin/coupons/${couponId}`);
export const restoreAdminCoupon = (couponId) =>
  api.patch(`/admin/coupons/${couponId}/restore`);

// ─── Admin Analytics ──────────────────────────────────────────────────────
export const getAnalyticsOverview = () => api.get('/admin/analytics/overview');
export const getRevenueAnalytics = (params) =>
  api.get('/admin/analytics/revenue', { params });
export const getStudentAnalytics = () => api.get('/admin/analytics/students');
export const getOrderAnalytics = () => api.get('/admin/analytics/orders');
export const getCourseAnalytics = () => api.get('/admin/analytics/courses');
export const getReviewAnalytics = () => api.get('/admin/analytics/reviews');
export const getLiveClassAnalytics = () => api.get('/admin/analytics/live-classes');
export const getCouponAnalytics = () => api.get('/admin/analytics/coupons');

// ─── Admin Audit Logs ──────────────────────────────────────────────────────
export const getAuditLogs = (params) => api.get('/admin/audit-logs', { params });
export const getAuditLog = (auditLogId) => api.get(`/admin/audit-logs/${auditLogId}`);

// ─── Admin Live Classes ────────────────────────────────────────────────────
export const getAdminLiveClasses = (params) =>
  api.get('/admin/live-classes', { params });
export const getAdminLiveClass = (liveClassId) =>
  api.get(`/admin/live-classes/${liveClassId}`);
export const updateAdminLiveClassStatus = (liveClassId, data) =>
  api.patch(`/admin/live-classes/${liveClassId}/status`, data);
export const deleteAdminLiveClass = (liveClassId) =>
  api.delete(`/admin/live-classes/${liveClassId}`);
export const restoreAdminLiveClass = (liveClassId) =>
  api.patch(`/admin/live-classes/${liveClassId}/restore`);
