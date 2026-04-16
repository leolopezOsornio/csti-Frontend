// src/services/addressService.ts
import api from './Api.service';

export const addressService = {
  getAddresses: async () => {
    const response = await api.get('/direcciones/api/mis-direcciones/');
    return response.data;
  },

  addAddress: async (data: any) => {
    const response = await api.post('/direcciones/api/mis-direcciones/', data);
    return response.data;
  },

  updateAddress: async (id: number, data: any) => {
    const response = await api.put(`/direcciones/api/mis-direcciones/${id}/`, data);
    return response.data;
  },

  deleteAddress: async (id: number) => {
    const response = await api.delete(`/direcciones/api/mis-direcciones/${id}/`);
    return response.data;
  },

  setMainAddress: async (id: number) => {
    const response = await api.post(`/direcciones/api/mis-direcciones/${id}/marcar-principal/`);
    return response.data;
  }
};