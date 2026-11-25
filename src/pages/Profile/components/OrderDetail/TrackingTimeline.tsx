import styles from './TrackingTimeline.module.css';

import type { TrackingData } from '../../../../services/Shipping.service';
interface TrackingTimelineProps { trackingData: TrackingData | null }

const TrackingTimeline = ({ trackingData }: TrackingTimelineProps) => {
  if (!trackingData) {
    return (
      <div className={styles.timelineContainer}>
        <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>
          Rastreo temporalmente no disponible
        </p>
      </div>
    );
  }

  const isDelivered = trackingData.status === 'ENTREGADO';
  const isInTransit = trackingData.status === 'EN_TRANSITO' || trackingData.status === 'RECOLECTADO';

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    if (!carrier || !trackingNumber) return null;
    const c = carrier.toLowerCase();
    if (c.includes('dhl')) return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${encodeURIComponent(trackingNumber)}`;
    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`;
    if (c.includes('estafeta')) return `https://www.estafeta.com/Herramientas/Rastreo`;
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.statusBanner} ${isDelivered ? styles.bannerDelivered : isInTransit ? styles.bannerInTransit : styles.bannerCreated}`} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.bannerIcon}>
          {isDelivered ? (
            <i className="fa-solid fa-circle-check"></i>
          ) : isInTransit ? (
            <i className="fa-solid fa-truck-fast"></i>
          ) : (
            <i className="fa-solid fa-box-open"></i>
          )}
        </div>
        <div className={styles.bannerText}>
          <h2 className={styles.bannerTitle}>
            {isDelivered ? 'Entregado' : isInTransit ? 'En camino' : trackingData.status || 'Estado no disponible'}
          </h2>
          <p className={styles.bannerSubtitle}>
            {trackingData.message || 'Estado confirmado por el backend de rastreo.'}
          </p>
        </div>
      </div>

      {trackingData.estimated_delivery && <p>Fecha estimada por la paquetería: {new Date(trackingData.estimated_delivery).toLocaleDateString('es-MX')}. No constituye confirmación de entrega.</p>}
      <div className={styles.carrierCard} style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '12px' }}>
        <div className={styles.carrierLeft}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            fontSize: '1.2rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
          <div>
            <h4 className={styles.carrierTitle}>{trackingData.carrier || 'Transportista no informado'}</h4>
            <p className={styles.carrierCode}>
              Guía de rastreo: <strong>{trackingData.tracking_number || 'Aún no asignada'}</strong>
            </p>
          </div>
        </div>

        {trackingData.tracking_number && trackingData.carrier && getTrackingUrl(trackingData.carrier, trackingData.tracking_number) && (
          <a
            href={getTrackingUrl(trackingData.carrier, trackingData.tracking_number)!}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pdfButton}
            style={{ backgroundColor: '#00b4d8', color: 'white', border: 'none', padding: '0.6rem 1.2rem', textDecoration: 'none', marginLeft: 'auto' }}
          >
            <i className="fa-solid fa-up-right-from-square"></i> Rastrear
          </a>
        )}
        
      </div>
    </div>
  );
};

export default TrackingTimeline;
