// src/services/catalogService.ts
import api from './api';

export const catalogService = {
  getHomeSections: async () => {
    try {
      // Usamos la ruta que creamos en el paso anterior en Django
      const response = await api.get('/catalogo/api/home/');
      return response.data;
    } catch (error) {
      console.error("Error al obtener las secciones del Home:", error);
      throw error;
    }
  }
};