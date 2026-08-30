import api from './Api.service';

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

  getBrandDetail: async (slug: string, page: number = 1) => {
    try {
      const response = await api.get(`/catalogo/api/marca/${slug}/?page=${page}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el detalle de la marca ${slug}:`, error);
      throw error;
    }
  },

  getProductDetail: async (clave: string) => {
    try {
      const response = await api.get(`/catalogo/api/productos/${clave}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el producto ${clave}:`, error);
      throw error;
    }
  },


  getFilters: async (queryString: string = '') => {
    try {
      const response = await api.get(`/catalogo/api/filtros/?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener filtros:", error);
      throw error;
    }
  },

  getProductsList: async (queryString: string) => {
    try {
      const response = await api.get(`/catalogo/api/listado/?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener lista de productos:", error);
      throw error;
    }
  }
};
