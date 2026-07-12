export interface ShippingRate {
  id: string;
  type: 'standard' | 'express'; // Clasificación para la UI
  title: string; // Ej: Envío Estándar
  description: string; // Ej: Llega en 3 a 5 días
  days: number; // Tiempo estimado en días
  price: number;
  internalProvider: string; // Oculto al usuario final (ej. FedEx, Redpack)
}

const mockRates: ShippingRate[] = [
  {
    id: 'rate_standard_1',
    type: 'standard',
    title: 'Envío Estándar',
    description: 'Llega entre 3 a 5 días hábiles.',
    days: 4,
    price: 99.0,
    internalProvider: 'Estafeta'
  },
  {
    id: 'rate_express_1',
    type: 'express',
    title: 'Envío Express',
    description: 'Llega mañana o el siguiente día hábil.',
    days: 1,
    price: 250.0,
    internalProvider: 'DHL'
  }
];

// SIMULACIÓN (Mock) del servicio.
export const shippingService = {
  getRates: async (addressId: number, cartItems: any[]): Promise<ShippingRate[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockRates);
      }, 1200);
    });
  },

  getDefaultRate: async (addressId: number, cartItems: any[]): Promise<ShippingRate> => {
    return new Promise((resolve) => {
      // Retorna la más barata por defecto
      setTimeout(() => resolve(mockRates[0]), 800);
    });
  },

  saveSelectedRate: (rate: ShippingRate) => {
    localStorage.setItem('selectedShippingRate', JSON.stringify(rate));
  },

  getSelectedRate: (): ShippingRate | null => {
    const rate = localStorage.getItem('selectedShippingRate');
    return rate ? JSON.parse(rate) : null;
  },

  clearSelectedRate: () => {
    localStorage.removeItem('selectedShippingRate');
  },

  getTracking: async (orderId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          carrier: 'FedEx',
          tracking_number: '782349102384',
          status: 'EN_TRANSITO',
          estimated_delivery: '2026-07-10T18:00:00Z',
          events: [
            {
              date: '2026-07-07T10:00:00Z',
              status: 'CREADO',
              description: 'La etiqueta de envío ha sido creada.'
            },
            {
              date: '2026-07-07T15:30:00Z',
              status: 'RECOLECTADO',
              description: 'El paquete ha sido recolectado por el mensajero.'
            },
            {
              date: '2026-07-08T09:15:00Z',
              status: 'EN_TRANSITO',
              description: 'El paquete está en camino a la sucursal de destino.'
            }
          ]
        });
      }, 1000);
    });
  }
};
