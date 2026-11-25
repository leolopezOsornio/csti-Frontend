import axios from 'axios';
import { appConfig } from '../config/appConfig';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Fiscal downloads surface terminal 401 in the UI instead of navigating. */
    redirectOnAuthFailure?: boolean;
    checkoutSessionToken?: string | null;
  }
}

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    if (config.checkoutSessionToken !== undefined && (!token || config.checkoutSessionToken !== token)) {
      return Promise.reject(new Error('SESSION_CHANGED'));
    }

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

    if (!originalRequest) return Promise.reject(error);
    const checkoutRequest = originalRequest.checkoutSessionToken !== undefined;
    const currentToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    // Never replay a checkout POST under a different login after an async 401.
    if (checkoutRequest && originalRequest.checkoutSessionToken !== currentToken) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry && !checkoutRequest) {
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
        if (originalRequest.redirectOnAuthFailure !== false) window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
