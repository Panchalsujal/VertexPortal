import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token if present
api.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

// Response interceptor for consistent error handling and automatic session cleanup on auth failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    // Handle token expiration or unauthorized access
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    // Handle suspended/inactive accounts
    if (status === 403 && (message.includes('suspended') || message.includes('inactive'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
