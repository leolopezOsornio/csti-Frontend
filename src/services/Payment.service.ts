import api from './Api.service';

export const paymentService = {
  verifyPayment: async (orderID: string, direccionID: number, shippingCost: number = 0, shippingCarrier: string = "FedEx Express") => {
    try {
      const response = await api.post('/api/pagos/verificar/', {
        orderID,
        direccionID,
        shippingCost,
        shippingCarrier
      });
      return response.data;
    } catch (error) {
      console.error("Error al verificar el pago:", error);
      throw error;
    }
  }
};
