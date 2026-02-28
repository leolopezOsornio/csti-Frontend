// src/services/authService.ts
import api from './api';

export const authService = {
  // Función para iniciar sesión
  login: async (email: string, password: string) => {
    try {
      // Hacemos el POST al endpoint que acabamos de probar en Postman
      const response = await api.post('/accounts/api/login/', { email, password });
      
      // Si fue exitoso, guardamos los tokens
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      return response.data;
    } catch (error) {
      // Si hay error (401, 403, 404), lo lanzamos para manejarlo en el componente
      throw error;
    }
  },

  // Función para cerrar sesión (simplemente borra los tokens del frontend)
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};