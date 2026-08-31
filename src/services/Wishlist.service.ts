import api from './Api.service';

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/wishlist/api/mi-wishlist/');
    return response.data;
  },

  toggleWishlist: async (productoId: number) => {
    const response = await api.post('/wishlist/api/toggle/', { producto_id: productoId });
    return response.data;
  },

  removeItem: async (itemId: number) => {
    const response = await api.delete(`/wishlist/api/eliminar/${itemId}/`);
    return response.data;
  }
};
