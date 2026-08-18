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

// Helper function to extract a cookie value by name
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Request interceptor to attach bearer token and CSRF token if present
api.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }

  // Layer 5: Attach CSRF Token for mutation requests if csrf_token cookie exists
  const csrfToken = getCookie('csrf_token');
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(reqConfig.method?.toLowerCase())) {
    reqConfig.headers['x-csrf-token'] = csrfToken;
  }

  return reqConfig;
});

// Response interceptor for consistent error handling and automatic session cleanup on auth failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const code = error.response?.data?.code;

    // Handle token expiration or unauthorized access
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    // Handle elevated session expiration (Layer 2)
    if (status === 403 && (code === 'ELEVATED_SESSION_EXPIRED' || code === 'ELEVATED_SESSION_REQUIRED')) {
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/instructor')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?reason=session_expired';
      }
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
