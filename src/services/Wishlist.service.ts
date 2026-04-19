// src/services/wishlistService.ts
import api from './Api.service';

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/wishlist/api/mi-wishlist/');
    return response.data;
  },

  // Alterna entre agregar o quitar el favorito por ID de producto
  toggleWishlist: async (productoId: number) => {
    const response = await api.post('/wishlist/api/toggle/', { producto_id: productoId });
    return response.data;
  },

  // Elimina un item de la lista usando el ID del item (no del producto)
  removeItem: async (itemId: number) => {
    const response = await api.delete(`/wishlist/api/eliminar/${itemId}/`);
    return response.data;
  }
};