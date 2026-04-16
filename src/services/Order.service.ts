import api from './Api.service';

export const orderService = {
  getOrders: async () => {
    const response = await api.get('/api/pagos/mis-pedidos/');
    return response.data;
  },
  getOrderById: async (id: string | undefined) => {
    const response = await api.get(`/api/pagos/mis-pedidos/${id}/`);
    return response.data;
  }
};
