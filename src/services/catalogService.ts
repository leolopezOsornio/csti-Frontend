// src/services/catalogService.ts
import api from './api';

export const catalogService = {
  getHomeSections: async () => {
    try {
      const response = await api.get('/catalogo/api/home/');
      return response.data;
    } catch (error) {
      console.error("Error al obtener las secciones del Home:", error);
      throw error;
    }
  },

  // NUEVO: Obtener detalle de marca y sus productos
  getBrandDetail: async (slug: string, page: number = 1) => {
    try {
      const response = await api.get(`/catalogo/api/marca/${slug}/?page=${page}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el detalle de la marca ${slug}:`, error);
      throw error;
    }
  },

  // NUEVO: Obtener ficha técnica del producto
  getProductDetail: async (clave: string) => {
    try {
      const response = await api.get(`/catalogo/api/productos/${clave}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el producto ${clave}:`, error);
      throw error;
    }
  }
};