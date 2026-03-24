import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for admin API
const adminAPI = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
adminAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('admin_access_token', accessToken);
          localStorage.setItem('admin_refresh_token', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return adminAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }

    return Promise.reject(error);
  }
);

export const adminAuthAPI = {
  login: async (email: string, password: string) => {
    return await adminAPI.post('/auth/login', { email, password });
  },

  refreshToken: async (refreshToken: string) => {
    return await adminAPI.post('/auth/refresh', { refreshToken });
  },

  getDashboardStats: async () => {
    return await adminAPI.get('/dashboard/stats');
  },

  getPendingTurfs: async () => {
    return await adminAPI.get('/turfs/pending');
  },

  verifyTurf: async (turfId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    return await adminAPI.post(`/turfs/${turfId}/verify`, { action, reason });
  },

  getAllTurfs: async (page = 1, limit = 20) => {
    return await adminAPI.get(`/turfs?page=${page}&limit=${limit}`);
  },

  getTurfDetails: async (turfId: string) => {
    return await adminAPI.get(`/turfs/${turfId}`);
  },

  updateTurfStatus: async (turfId: string, status: string) => {
    return await adminAPI.patch(`/turfs/${turfId}/status`, { status });
  },

  getAllUsers: async (page = 1, limit = 20, role?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (role) params.append('role', role);
    return await adminAPI.get(`/users?${params}`);
  },

  updateUserStatus: async (userId: string, status: 'ACTIVE' | 'BLOCKED') => {
    return await adminAPI.patch(`/users/${userId}/status`, { status });
  },

  getSubscriptions: async (page = 1, limit = 20) => {
    return await adminAPI.get(`/subscriptions?page=${page}&limit=${limit}`);
  },

  updateSubscription: async (subscriptionId: string, planId: string) => {
    return await adminAPI.patch(`/subscriptions/${subscriptionId}`, { planId });
  },

  getAllPlans: async () => {
    return await adminAPI.get('/plans');
  },

  createPlan: async (planData: any) => {
    return await adminAPI.post('/plans', planData);
  },

  updatePlan: async (planId: string, planData: any) => {
    return await adminAPI.patch(`/plans/${planId}`, planData);
  },

  getAuditLogs: async (page = 1, limit = 50, action?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (action) params.append('action', action);
    return await adminAPI.get(`/audit-logs?${params}`);
  }
};

export default adminAPI;
