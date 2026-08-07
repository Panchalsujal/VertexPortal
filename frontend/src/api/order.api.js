import api from './axios';

export const createPaymentOrder = (data) => api.post('/orders/create', data);
export const verifyPayment = (data) => api.post('/orders/verify', data);
export const checkoutPreview = (data) => api.post('/checkout/preview', data);
