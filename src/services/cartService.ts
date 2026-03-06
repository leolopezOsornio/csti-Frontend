// src/services/cartService.ts
import api from './api';

export const cartService = {
    getCart: async () => {
        const response = await api.get('/carrito/api/mi-carrito/');
        return response.data;
    },

    addToCart: async (productoId: number, cantidad: number = 1) => {
        const response = await api.post('/carrito/api/agregar/', {
            producto_id: productoId,
            cantidad
        });
        return response.data;
    },

    updateQuantity: async (itemId: number, cantidad: number) => {
        const response = await api.put(`/carrito/api/actualizar/${itemId}/`, { cantidad });
        return response.data;
    },

    removeItem: async (itemId: number) => {
        const response = await api.delete(`/carrito/api/eliminar/${itemId}/`);
        return response.data;
    }
};