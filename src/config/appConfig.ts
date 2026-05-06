const DEFAULT_API_BASE_URL = 'https://csti-production.up.railway.app';

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || '442 251 05 21',
  contactPhoneHref: import.meta.env.VITE_CONTACT_PHONE_HREF || '+524422510521',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'ventas@csti.com.mx',
  contactAddress:
    import.meta.env.VITE_CONTACT_ADDRESS ||
    'Pirineos no. 515 int. 41-J, Parque Industrial Micro Santiago, CP 76120, Santiago de Queretaro, Qro.',
};
