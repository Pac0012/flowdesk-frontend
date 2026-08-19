import axios from 'axios';

// Initialize central axios instance with base API mapping context
const api = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || '/api' 
});

// Request Interceptor: Support both 'fd_token' and standard 'token' keys
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fd_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Wipe local profiles and redirect on token expiration (401)
api.interceptors.response.use(
  response => response,
  error => {
    // Only redirect if a protected route returns 401 (ignore login endpoint errors)
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('fd_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// 1. Authentication Services
export const authAPI = {
  login: data => api.post('/auth/login', data),
  register: data => api.post('/auth/register', data)
};

// 2. Distributed Task Operations (Mapped to Spring Boot Endpoints)
export const taskAPI = {
  getAll: () => api.get('/tasks'),
  assign: data => api.post('/tasks/assign', data), // Aligned with TaskController @PostMapping("/assign")
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  rate: (id, data) => api.patch(`/tasks/${id}/rate`, data), // Aligned with TaskController @PatchMapping("/{id}/rate")
  delete: id => api.delete(`/tasks/${id}`)
};

// 3. User & Team Metrics Services
export const userAPI = {
  getMe: () => api.get('/users/me'),
  getTeam: () => api.get('/users/team'),
  getStats: () => api.get('/users/stats')
};

// 4. Monthly Progress Report Form Management
export const reportAPI = {
  getAll: () => api.get('/reports'),
  submit: formData => api.post('/reports', formData),
  review: (id, data) => api.patch(`/reports/${id}/review`, data),
  download: id => api.get(`/reports/${id}/download`, { responseType: 'blob' })
};

// 5. Weekly Work Logsheet Handling
export const logAPI = {
  getAll: () => api.get('/logsheets'),
  submit: formData => api.post('/logsheets', formData),
  approve: id => api.patch(`/logsheets/${id}/approve`, {})
};

// 6. Role-Aware Attendance Register Services
export const attendanceAPI = {
  getTodayStatus: () => api.get('/attendance/today'),
  checkIn: (userId, status = 'PRESENT') =>
    api.post('/attendance/mark', {
      userId,
      status
    }),
  getHistory: () => api.get('/attendance/today'),
  getAdminMasterLog: () => api.get('/attendance/today')
};

// 7. Company Announcements & Notice Board
export const announcementAPI = {
  getAll: () => api.get('/notices'),
  create: data => api.post('/notices', data),
  delete: id => api.delete(`/notices/${id}`)
};

export default api;