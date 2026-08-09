// src/services/Billing.service.ts
import api from './Api.service';

export interface FiscalData {
  rfc: string;
  razon_social: string;
  codigo_postal: string;
  regimen_fiscal: string;
  uso_cfdi: string;
}

export interface Invoice {
  id: number;
  orden_id: number;
  facturapi_id: string;
  uuid: string;
  pdf_url: string;
  xml_url: string;
  status: string;
  creado_en: string;
}

export const billingService = {
  // Obtener datos fiscales del usuario
  getFiscalData: async (): Promise<FiscalData | null> => {
    try {
      const response = await api.get('/api/facturacion/perfil/');
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null; // El usuario aún no tiene datos fiscales
      }
      throw error;
    }
  },

  // Guardar o actualizar datos fiscales
  saveFiscalData: async (data: FiscalData): Promise<FiscalData> => {
    const response = await api.post('/api/facturacion/perfil/', data);
    return response.data;
  },

  // Obtener historial de facturas
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get('/api/facturacion/mis-facturas/');
    return response.data;
  },

  // Generar factura para una orden
  generateInvoice: async (ordenId: number | string): Promise<Invoice> => {
    const response = await api.post(`/api/facturacion/generar/${ordenId}/`);
    return response.data;
  }
};
