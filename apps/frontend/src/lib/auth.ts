import { api, TurfLoginData, TurfRegisterData, AuthResponse } from './api';

export const authAPI = {
  login: async (data: TurfLoginData): Promise<AuthResponse> => {
    const response = await api.post('/turfs/login', data);
    return response.data;
  },

  register: async (data: TurfRegisterData): Promise<AuthResponse> => {
    const response = await api.post('/turfs/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/turfs/me');
    return response.data;
  },
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};
