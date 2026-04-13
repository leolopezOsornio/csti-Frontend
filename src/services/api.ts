// src/services/api.ts
import axios from 'axios';

// Creamos la instancia apuntando a la URL donde corre tu Django
const api = axios.create({
  //baseURL: 'http://127.0.0.1:8000',
  baseURL: 'https://csti-production.up.railway.app',
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