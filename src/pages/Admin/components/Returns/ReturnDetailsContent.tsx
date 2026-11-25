import { safeMediaUrl } from '../../../../utils/safeMediaUrl';
import { formatMotivo } from '../../../../utils/returnDisplay';

export interface ReturnDetails {
  cliente_nombre?: unknown;
  cliente_email?: unknown;
  motivo?: unknown;
  comentarios?: unknown;
  evidencias?: unknown;
}
const text = (value: unknown, fallback: string) => typeof value === 'string' && value ? value : fallback;

export default function ReturnDetailsContent({ details }: { details: ReturnDetails }) {
  const client = text(details.cliente_nombre, 'Cliente');
  const evidence = Array.isArray(details.evidencias) ? details.evidencias : [];
  const images = evidence.map(value => safeMediaUrl(value && typeof value === 'object' ? value.imagen : null)).filter((url): url is string => url !== null);
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, textAlign: 'left', maxHeight: 600, overflowY: 'auto', paddingTop: 10 }}>
    {evidence.length > 0 && <section style={{ flex: '1 1 240px' }}>
      <h4>Evidencia Fotográfica</h4>
      {images.map((url, index) => <div key={`${url}-${index}`} style={{ background: '#f1f5f9', padding: 8, borderRadius: 8, marginBottom: 12, border: '1px solid #e2e8f0' }}>
        <img src={url} alt={`Evidencia ${index + 1}`} referrerPolicy="no-referrer" style={{ maxWidth: '100%', borderRadius: 4, display: 'block' }} />
      </div>)}
      {images.length !== evidence.length && <p>Algunas evidencias no se muestran porque su URL no está permitida.</p>}
    </section>}
    <section style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h4>Desglose de la Solicitud {evidence.length === 0 ? '(Sin Fotos)' : ''}</h4>
      <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <h5>Información del Cliente</h5>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', padding: 8 }}>{client.charAt(0)}</span>
          <div>{client}<div style={{ color: '#64748b', fontSize: '0.85rem' }}>{text(details.cliente_email, 'Sin correo')}</div></div>
        </div>
      </div>
      <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <h5>Motivo Declarado</h5><p>{formatMotivo(details.motivo)}</p>
      </div>
      <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <h5>Detalles Adicionales</h5>
        <p style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 6 }}>{text(details.comentarios, 'El cliente no dejó comentarios adicionales.')}</p>
      </div>
    </section>
  </div>;
}
