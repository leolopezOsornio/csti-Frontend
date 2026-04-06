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
  },

  // --- NUEVAS FUNCIONES PARA EL LISTADO ---

  // 1. Obtener filtros dinámicos (Categorías, Marcas y Precio Máximo)
  getFilters: async (queryString: string = '') => {
    try {
      const response = await api.get(`/catalogo/api/filtros/?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener filtros:", error);
      throw error;
    }
  },

  // 2. Obtener lista de productos basados en la URL actual
  getProductsList: async (queryString: string) => {
    try {
      // queryString será algo como "desc=gaming&marcas=HP&page=2"
      const response = await api.get(`/catalogo/api/listado/?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener lista de productos:", error);
      throw error;
    }
  }
};