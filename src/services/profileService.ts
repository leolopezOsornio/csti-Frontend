// src/services/profileService.ts
import api from './api';

export const profileService = {
  // Obtener todos los datos del perfil (nombre, correo, teléfono, fecha)
  getProfile: async () => {
    try {
      const response = await api.get('/accounts/api/perfil/');
      return response.data;
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      throw error;
    }
  },

  // Actualizar nombre, apellido y teléfono
  updateProfile: async (data: { first_name: string; last_name: string; telefono: string }) => {
    try {
      const response = await api.put('/accounts/api/perfil/', data);
      return response.data; // { mensaje, user }
    } catch (error) {
      throw error;
    }
  },

  // Cambiar contraseña por seguridad
  changePassword: async (data: any) => {
    try {
      const response = await api.put('/accounts/api/perfil/cambiar-password/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};