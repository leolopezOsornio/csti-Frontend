import api from './Api.service';

export interface ReturnRequest {
  id?: number;
  orden_id: string | number;
  motivo: string;
  comentarios: string;
  estado?: 'PENDIENTE' | 'EN_TRANSITO' | 'INSPECCION' | 'REEMBOLSADO' | 'RECHAZADA';
  url_guia?: string | null;
  numero_de_guia?: string | null;
  motivo_rechazo?: string | null;
  fecha_solicitud?: string;
}

export const returnsService = {
  // Enviar una solicitud de devolución
  requestReturn: async (data: FormData | ReturnRequest): Promise<ReturnRequest> => {
    // Si mandamos archivos, debe ser un FormData
    const response = await api.post('/api/pagos/envios/devoluciones/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  },

  // Obtener estado de devolución de una orden específica (Cliente)
  getReturnStatus: async (ordenId: string | number): Promise<ReturnRequest | null> => {
    try {
      const response = await api.get(`/api/pagos/envios/devoluciones/orden/${ordenId}/`);
      return response.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  // Obtener todas las devoluciones (Administrador)
  getAllReturns: async (): Promise<ReturnRequest[]> => {
    const response = await api.get('/api/pagos/envios/devoluciones/admin/');
    return response.data;
  },

  // Cambiar estado de una devolución (Administrador)
  updateReturnStatus: async (devolucionId: number, estado: string, motivoRechazo?: string): Promise<ReturnRequest> => {
    const response = await api.post(`/api/pagos/envios/devoluciones/admin/${devolucionId}/transicionar/`, {
      estado,
      motivo_rechazo: motivoRechazo
    });
    return response.data;
  }
};
