import axios from 'axios';
import { appConfig } from '../config/appConfig';

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const isPersistent = !!localStorage.getItem('refresh_token');
        const refresh = isPersistent 
          ? localStorage.getItem('refresh_token') 
          : sessionStorage.getItem('refresh_token');

        if (refresh) {
          const baseURL = api.defaults.baseURL || 'https://csti-production.up.railway.app';
          
          const response = await axios.post(`${baseURL}/accounts/api/token/refresh/`, { refresh });

          const newAccessToken = response.data.access;

          const storage = isPersistent ? localStorage : sessionStorage;
          storage.setItem('access_token', newAccessToken);

          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si el refresh token también expiró, limpiamos todo y redirigimos al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
