import styles from './TrackingTimeline.module.css';

interface TrackingEvent {
  date: string;
  status: string;
  description: string;
}

interface TrackingData {
  carrier: string;
  tracking_number: string;
  status: string;
  estimated_delivery: string;
  events: TrackingEvent[];
}

interface TrackingTimelineProps {
  trackingData: TrackingData | null;
}

const TrackingTimeline = ({ trackingData }: TrackingTimelineProps) => {
  if (!trackingData) {
    return (
      <div className={styles.timelineContainer}>
        <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>
          Información de rastreo no disponible aún.
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
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

  return (
    <div className={styles.timelineContainer}>
      <header className={styles.timelineHeader}>
        <div className={styles.carrierInfo}>
          <div className={styles.carrierIcon}>
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <div>
            <h4 className={styles.carrierName}>{trackingData.carrier}</h4>
            <p className={styles.trackingNumber}>Guía: {trackingData.tracking_number}</p>
          </div>
        </div>
        <div className={styles.estimatedDelivery}>
          <p>Llegada estimada</p>
          <strong>{formatEstimatedDate(trackingData.estimated_delivery)}</strong>
        </div>
      </header>

      <div className={styles.timeline}>
        {trackingData.events.map((event, index) => {
          // Asumimos que el último evento en el array es el más reciente (activo)
          const isActive = index === trackingData.events.length - 1;
          
          return (
            <div key={index} className={`${styles.event} ${isActive ? styles.active : ''}`}>
              <div className={styles.eventDot}></div>
              <div className={styles.eventContent}>
                <div>
                  <h5 className={styles.eventStatus}>{event.status}</h5>
                  <p className={styles.eventDesc}>{event.description}</p>
                </div>
                <div className={styles.eventDate}>
                  {formatDate(event.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingTimeline;
