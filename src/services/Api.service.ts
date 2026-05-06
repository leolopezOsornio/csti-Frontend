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
    // Buscamos el token en el almacenamiento local
    const token = localStorage.getItem('access_token');

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

export default api;
