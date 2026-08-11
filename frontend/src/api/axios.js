import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling and automatic block on suspended/inactive status
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    if (status === 403 && (message.includes('suspended') || message.includes('inactive'))) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const customErr = new Error(message);
    customErr.response = error.response;
    customErr.status = status;
    return Promise.reject(customErr);
  }
);

export default api;
