import api from './Api.service';

export interface ShippingRate {
  id: string;
  type: 'standard' | 'express';
  title: string;
  description: string;
  days: number;
  price: number;
  internalProvider: string;
}

const mockRates: ShippingRate[] = [
  {
    id: 'estandar_cva',
    type: 'standard',
    title: 'Envío Estándar Nacional',
    description: 'Llega entre 3 a 5 días hábiles.',
    days: 4,
    price: 150.0,
    internalProvider: 'CVA'
  }
];

export const shippingService = {
  getRates: async (addressId: number, cartItems: any[] = []): Promise<ShippingRate[]> => {
    if (!addressId) {
      return mockRates;
    }
    try {
      const productIds = cartItems.map(item => item.product?.id || item.producto?.id || item.id).filter(id => id);
      const response = await api.post('/api/pagos/envios/cotizar/', { 
        direccionID: addressId,
        productos: productIds 
      });
      if (response.data && response.data.rates && response.data.rates.length > 0) {
        return response.data.rates.map((rate: any) => ({
          id: rate.id,
          type: (rate.title.toLowerCase().includes('express') || rate.price > 170) ? 'express' : 'standard',
          title: rate.title,
          description: `Entrega estimada: ${rate.estimated_days}`,
          days: rate.title.toLowerCase().includes('express') ? 1 : 4,
          price: rate.price,
          internalProvider: rate.carrier
        }));
      }
    } catch (err) {
      console.warn("No se pudieron cotizar tarifas de Envia en vivo, usando respaldo:", err);
    }
    return mockRates;
  },

  getDefaultRate: async (addressId: number, cartItems: any[] = []): Promise<ShippingRate> => {
    try {
      const rates = await shippingService.getRates(addressId, cartItems);
      if (rates && rates.length > 0) {
        return rates.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      }
    } catch (e) {
      console.warn("Error getting default rate, falling back to mock");
    }
    return mockRates[0];
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

  getTracking: async (orderId: string, orderData?: any) => {
    return new Promise(async (resolve) => {
      const carrier = orderData?.paqueteria || 'FedEx Express';
      const tracking_number = orderData?.numero_de_guia || '782349102384';
      let status = orderData?.estado_envio || 'CREADO';
      const url_guia = orderData?.url_guia || null;
      let liveEvents: any[] = [];

      try {
        if (orderId && orderId !== 'undefined') {
          const res = await api.get(`/api/pagos/envios/rastrear/${orderId}/`);
          if (res.data && res.data.live_tracking) {
            console.log("📍 [Envia.com API] Datos de rastreo en vivo recibidos:", res.data.live_tracking);
            const liveData = res.data.live_tracking;
            if (liveData.events && Array.isArray(liveData.events) && liveData.events.length > 0) {
              liveEvents = liveData.events;
            }
            if (res.data.status) status = res.data.status;
          }
        }
      } catch (err) {
        console.log("Nota: Consultando rastreo (usando respaldo logístico para Sandbox):", err);
      }

      const baseDate = orderData?.creado_en ? new Date(orderData.creado_en) : new Date();
      const carrierLower = String(carrier || '').toLowerCase();

      let deliveryDays = 3;
      if (carrierLower.includes('dhl') || carrierLower.includes('siguiente') || carrierLower.includes('domestic')) {
        deliveryDays = 1;
      } else if (carrierLower.includes('fedex') || carrierLower.includes('saver') || carrierLower.includes('express')) {
        deliveryDays = 2;
      } else if (carrierLower.includes('estafeta') || carrierLower.includes('terrestre') || carrierLower.includes('estándar')) {
        deliveryDays = 4;
      }

      const t_creado = new Date(baseDate.getTime());
      const t_recolectado = new Date(baseDate.getTime() + 1000 * 60 * 60 * (deliveryDays === 1 ? 2 : 4));
      const t_transito_1 = new Date(baseDate.getTime() + 1000 * 60 * 60 * (deliveryDays === 1 ? 8 : 14));
      const t_transito_2 = new Date(baseDate.getTime() + 1000 * 60 * 60 * (deliveryDays === 1 ? 16 : deliveryDays * 12));

      const estimatedDeliveryDate = new Date(baseDate.getTime() + 86400000 * deliveryDays);
      const t_entregado = orderData?.actualizado_en ? new Date(orderData.actualizado_en) : new Date(baseDate.getTime() + 86400000 * deliveryDays);

      const addressStr = orderData?.direccion_envio || "";
      let destinationCity = "tu ciudad";
      if (addressStr.includes(',')) {
        const parts = addressStr.split(',');
        if (parts.length >= 2) {
          destinationCity = parts[parts.length - 2].trim() || parts[parts.length - 1].replace(/CP:.*$/, '').trim();
        }
      }

      const currentDate = new Date();
      if ((status === 'EN_TRANSITO' || status === 'CREADO') && currentDate >= estimatedDeliveryDate) {
        status = 'ENTREGADO';
      }

      let m1Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'COMPLETED';
      let m2Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'PENDING';
      let m3Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'PENDING';
      let m4Status: 'COMPLETED' | 'ACTIVE' | 'PENDING' = 'PENDING';

      if (status === 'CREADO') {
        m1Status = 'ACTIVE';
        m2Status = 'PENDING';
        m3Status = 'PENDING';
        m4Status = 'PENDING';
      } else if (status === 'RECOLECTADO') {
        m1Status = 'COMPLETED';
        m2Status = 'ACTIVE';
        m3Status = 'PENDING';
        m4Status = 'PENDING';
      } else if (status === 'EN_TRANSITO') {
        m1Status = 'COMPLETED';
        m2Status = 'COMPLETED';
        m3Status = 'ACTIVE';
        m4Status = 'PENDING';
      } else if (status === 'ENTREGADO' || status === 'COMPLETADO') {
        m1Status = 'COMPLETED';
        m2Status = 'COMPLETED';
        m3Status = 'COMPLETED';
        m4Status = 'COMPLETED';
      }

      const milestones = [
        {
          id: '1',
          title: 'En preparación',
          status: m1Status,
          date: t_creado.toISOString(),
          location: 'Centro de Distribución',
          details: m1Status !== 'PENDING' ? [
            'Tu pedido ha sido confirmado y el pago autorizado por el sistema.',
            'Estamos empaquetando tus productos con protección de alta seguridad.',
            `La etiqueta de envío de ${carrier} ha sido generada con guía ${tracking_number}.`
          ] : ['El pedido será procesado en el almacén central.']
        },
        {
          id: '2',
          title: 'En camino',
          status: m2Status,
          date: (m2Status !== 'PENDING' ? t_transito_1 : t_recolectado).toISOString(),
          location: `Centro Logístico Regional - ${carrier}`,
          details: m2Status !== 'PENDING' ? [
            `El paquete fue recolectado por el mensajero de ${carrier} en el Centro de Distribución.`,
            'Salió del centro de distribución regional y sigue en viaje por carretera.',
            `En tránsito interurbano hacia el centro logístico de tu zona (${destinationCity}).`
          ] : [`El paquete será recolectado y transportado por ${carrier}.`]
        },
        {
          id: '3',
          title: 'En el último tramo del recorrido',
          status: m3Status,
          date: (m3Status !== 'PENDING' ? t_transito_2 : new Date(t_transito_2.getTime() + 3600000)).toISOString(),
          location: `Sucursal Destino - ${destinationCity}`,
          details: m3Status !== 'PENDING' ? [
            `Llegó a la central de distribución local de ${carrier} en ${destinationCity}.`,
            'Tu paquete está muy cerca. El mensajero ha cargado tu envío en la unidad de reparto.',
            'En reparto a tu domicilio. Recuerda tener a la mano una identificación para recibirlo.'
          ] : [`Pendiente de arribo al centro de distribución en ${destinationCity}.`]
        },
        {
          id: '4',
          title: 'Entregado',
          status: m4Status,
          date: (m4Status === 'COMPLETED' ? t_entregado : estimatedDeliveryDate).toISOString(),
          location: 'Domicilio del receptor',
          details: m4Status === 'COMPLETED' ? [
            `Entregamos el paquete con éxito en tu dirección (${destinationCity}).`,
            `Firma y confirmación electrónica registrada por el operador de ${carrier}.`,
            '¡Gracias por tu confianza y compra en CSTI!'
          ] : [`Llegada estimada: ${new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(estimatedDeliveryDate)}.`]
        }
      ];

      setTimeout(() => {
        resolve({
          carrier,
          tracking_number,
          url_guia,
          status,
          estimated_delivery: estimatedDeliveryDate.toISOString(),
          delivered_date: m4Status === 'COMPLETED' ? t_entregado.toISOString() : null,
          destination_city: destinationCity,
          milestones,
          events: [
            {
              date: t_creado.toISOString(),
              status: 'CREADO',
              description: 'La etiqueta de envío ha sido generada en Envia.com.'
            },
            ...(status !== 'CREADO' ? [{
              date: new Date().toISOString(),
              status: status,
              description: `El paquete está actualmente en estado: ${status}.`
            }] : [])
          ]
        });
      }, 300);
    });
  }
};
