import styles from './TrackingTimeline.module.css';

interface TrackingMilestone {
  id: string;
  title: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
  date: string;
  location: string;
  details: string[];
}

interface TrackingData {
  carrier: string;
  tracking_number: string;
  status: string;
  estimated_delivery: string;
  delivered_date?: string | null;
  destination_city?: string;
  url_guia?: string | null;
  milestones?: TrackingMilestone[];
  events?: any[];
}

interface TrackingTimelineProps {
  trackingData: TrackingData | null;
  order?: any;
}

const TrackingTimeline = ({ trackingData, order }: TrackingTimelineProps) => {
  if (!trackingData) {
    return (
      <div className={styles.timelineContainer}>
        <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>
          Información de rastreo no disponible aún.
        </p>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatEstimatedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(d);
  };

  const milestones: TrackingMilestone[] = trackingData.milestones || [
    {
      id: '1',
      title: 'En preparación',
      status: 'COMPLETED',
      date: new Date().toISOString(),
      location: 'Almacén Central Querétaro',
      details: ['La etiqueta de envío ha sido generada en Envia.com.']
    }
  ];

  const isDelivered = trackingData.status === 'ENTREGADO' || trackingData.status === 'COMPLETADO';
  const isInTransit = trackingData.status === 'EN_TRANSITO' || trackingData.status === 'RECOLECTADO';

  return (
    <div className={styles.container}>
      <div className={`${styles.statusBanner} ${isDelivered ? styles.bannerDelivered : isInTransit ? styles.bannerInTransit : styles.bannerCreated}`}>
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
            {isDelivered ? 'Entregado' : isInTransit ? 'En camino' : 'En preparación'}
          </h2>
          <p className={styles.bannerSubtitle}>
            {isDelivered ? (
              `Llegó el ${formatDate(trackingData.delivered_date || new Date().toISOString())}. Tu paquete ha sido entregado exitosamente en ${trackingData.destination_city || 'tu domicilio'}.`
            ) : (
              `Llegada estimada: ${formatEstimatedDate(trackingData.estimated_delivery)}. Tu paquete está en viaje hacia ${trackingData.destination_city || 'tu localidad'}.`
            )}
          </p>
        </div>
      </div>

      <div className={styles.timelineBox}>
        <div className={styles.timeline}>
          {milestones.map((ms, index) => {
            const isLast = index === milestones.length - 1;
            const statusClass = ms.status === 'COMPLETED' ? styles.completed : ms.status === 'ACTIVE' ? styles.active : styles.pending;

            return (
              <div key={ms.id} className={`${styles.milestoneRow} ${statusClass}`}>
                {!isLast && (
                  <div className={`${styles.connectorLine} ${ms.status === 'COMPLETED' ? styles.lineCompleted : ''}`}></div>
                )}
                
                <div className={styles.dotContainer}>
                  <div className={styles.dot}>
                    {ms.status === 'COMPLETED' ? (
                      <i className="fa-solid fa-check"></i>
                    ) : ms.status === 'ACTIVE' ? (
                      <div className={styles.activePulse}></div>
                    ) : null}
                  </div>
                </div>

                <div className={styles.contentContainer}>
                  <div className={styles.milestoneHeader}>
                    <div className={styles.titleArea}>
                      <h4 className={styles.milestoneTitle}>{ms.title}</h4>
                      <span className={styles.locationBadge}>
                        <i className="fa-solid fa-location-dot"></i> {ms.location}
                      </span>
                    </div>
                    <span className={styles.milestoneDate}>
                      {formatDate(ms.date)}
                    </span>
                  </div>

                  <div className={styles.detailsList}>
                    {ms.details.map((detail, idx) => (
                      <div key={idx} className={styles.detailItem}>
                        <span className={styles.detailBullet}>•</span>
                        <p className={styles.detailText}>{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.carrierCard}>
        <div className={styles.carrierLeft}>
          <div className={styles.carrierIconBox}>
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <div>
            <h4 className={styles.carrierTitle}>{trackingData.carrier} (Estándar a domicilio)</h4>
            <p className={styles.carrierCode}>
              Código de seguimiento: <strong>{trackingData.tracking_number}</strong>
            </p>
          </div>
        </div>

        {(trackingData.url_guia || order?.url_guia) && (
          <a
            href={trackingData.url_guia || order?.url_guia}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.pdfButton}
          >
            <i className="fa-solid fa-file-pdf"></i> Descargar Etiqueta PDF
          </a>
        )}
      </div>
    </div>
  );
};

export default TrackingTimeline;
