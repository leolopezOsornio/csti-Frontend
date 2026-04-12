// src/services/paymentService.ts
import api from './api';

export const paymentService = {
  verifyPayment: async (orderID: string, direccionID: number) => {
    try {
      const response = await api.post('/api/pagos/verificar/', {
        orderID,
        direccionID
      });
      return response.data;
    } catch (error) {
      console.error("Error al verificar el pago:", error);
      throw error;
    }
  }
};
