import api from './Api.service';

const adminPanelService = {
  // Dashboard & Charts
  getDashboardStats: async () => {
    const response = await api.get('/api/admin-panel/stats/');
    return response.data;
  },
  
  getSalesChart: async () => {
    const response = await api.get('/api/admin-panel/sales-chart/');
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await api.get('/api/admin-panel/users/');
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await api.post('/api/admin-panel/users/', data);
    return response.data;
  },

  updateUser: async (id: number, data: any) => {
    const response = await api.patch(`/api/admin-panel/users/${id}/`, data);
    return response.data;
  },

  deactivateUser: async (id: number) => {
    const response = await api.delete(`/api/admin-panel/users/${id}/`);
    return response.data;
  },

  // Interest Monitoring
  getInterests: async () => {
    const response = await api.get('/api/admin-panel/interests/');
    return response.data;
  },

  // Orders
  getOrders: async () => {
    const response = await api.get('/api/admin-panel/orders/');
    return response.data;
  },

  getOrderById: async (id: string | number) => {
    const response = await api.get(`/api/admin-panel/orders/${id}/`);
    return response.data;
  }
};

export default adminPanelService;
