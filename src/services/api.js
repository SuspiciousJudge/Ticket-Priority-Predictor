import axios from 'axios';

// Use Vite env var prefix `VITE_` in the frontend. In development create `.env` with
// `VITE_API_BASE_URL=http://localhost:5000/api` or rely on the fallback below.
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

/**
 * Store token in localStorage (remember me) or sessionStorage (session only).
 * Call with `null` to clear.
 */
export const setAuthToken = (token, remember = true) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (remember) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }
};

/**
 * Retrieve a stored token from either storage.
 */
export const getStoredToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data || {};
    const message = data.message || err.message;

    if (err.response?.status === 401) {
      // Clear stored tokens so ProtectedRoute redirects to /login on next render.
      // Do NOT hard-redirect with window.location — that causes a full page reload,
      // loses React state, and can loop with ProtectedRoute's own 401 handling.
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }

    return Promise.reject({
      status: err.response?.status,
      message,
      fieldErrors: data.fieldErrors || null,
      data,
    });
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
  getStats: () => api.get('/tickets/stats'),
  getSimilar: (id) => api.get(`/tickets/${id}/similar`),
};

export const teamsAPI = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  remove: (id) => api.delete(`/teams/${id}`),
  addMember: (teamId, data) => api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  getTickets: (id) => api.get(`/users/${id}/tickets`),
  getPerformance: (id) => api.get(`/users/${id}/performance`),
};

export default api;
