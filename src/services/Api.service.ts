// src/services/api.ts
import axios from 'axios';
import { appConfig } from '../config/appConfig';

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token JWT en las peticiones (si existe)
api.interceptors.request.use(
  (config) => {
    // Buscamos el token en el almacenamiento local o de sesión
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    // Si existe, lo agregamos al header Authorization
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar la renovación automática de tokens (refresh token) en errores 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si la petición falla por token expirado (401) y no hemos reintentado ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Determinamos en qué almacenamiento se encuentra el refresh_token
        const isPersistent = !!localStorage.getItem('refresh_token');
        const refresh = isPersistent 
          ? localStorage.getItem('refresh_token') 
          : sessionStorage.getItem('refresh_token');

        if (refresh) {
          const baseURL = api.defaults.baseURL || 'https://csti-production.up.railway.app';
          
          // Solicitamos un nuevo token de acceso usando axios directamente
          const response = await axios.post(`${baseURL}/accounts/api/token/refresh/`, { refresh });

          const newAccessToken = response.data.access;

          // Guardamos el nuevo token de acceso en el mismo almacenamiento de origen
          const storage = isPersistent ? localStorage : sessionStorage;
          storage.setItem('access_token', newAccessToken);

          // Actualizamos los headers y reintentamos la petición original
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
