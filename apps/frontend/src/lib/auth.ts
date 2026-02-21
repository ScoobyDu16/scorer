import { api, TurfLoginData, TurfRegisterData, AuthResponse } from './api';

export const authAPI = {
  login: async (data: TurfLoginData): Promise<AuthResponse> => {
    console.log('API login called with:', data);
    const response = await api.post('/turfs/login', data);
    console.log('API login response:', response.data);
    return response.data;
  },

  register: async (data: TurfRegisterData): Promise<AuthResponse> => {
    console.log('API register called with:', data);
    const response = await api.post('/turfs/register', data);
    console.log('API register response:', response.data);
    return response.data;
  },

  getMe: async () => {
    console.log('API getMe called');
    const response = await api.get('/turfs/me');
    console.log('API getMe response:', response.data);
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
