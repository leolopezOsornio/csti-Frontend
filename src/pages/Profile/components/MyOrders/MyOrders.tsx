// src/pages/Profile/components/MyOrders/MyOrders.tsx
import styles from '../MyOrders/MyOrders.module.css';

const MyOrders = () => {
  return (
    <>
      <h1 className={styles.pageTitle}>Historial de Pedidos</h1>

      <div className={styles.ordersList}>
        <div className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <span className={styles.orderId}>Pedido #ORD-123456</span>
            <span className={`${styles.statusPill} ${styles.processing}`}>
              En Proceso
            </span>
          </div>

          <div className={styles.orderBody}>
            <div className={styles.orderDate}>Fecha: 23 Ene 2026</div>
            <div className={styles.orderPreview}>
              <div className={styles.orderThumbs}>
                <img src="/img/laptop.png" className={styles.thumbMini} alt="Producto" />
                <img src="/img/brand-placeholder.png" className={styles.thumbMini} alt="Producto" />
              </div>
              <span className={styles.moreItems}>+ 1 artículo más</span>
            </div>
          </div>

          <div className={styles.orderFooter}>
            <span className={styles.orderTotal}>Total: $47,558.84</span>
            <a href="#" className={styles.btnDetails}>Ver Detalles</a>
          </div>
        </div>

        <div className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <span className={styles.orderId}>Pedido #ORD-987654</span>
            <span className={`${styles.statusPill} ${styles.delivered}`}>
              Entregado
            </span>
          </div>

          <div className={styles.orderBody}>
            <div className={styles.orderDate}>Fecha: 15 Dic 2025</div>
            <div className={styles.orderPreview}>
              <div className={styles.orderThumbs}>
                <img src="/img/laptop.png" className={styles.thumbMini} alt="Producto" />
              </div>
              <span className={styles.moreItems}>1 artículo</span>
            </div>
          </div>

          <div className={styles.orderFooter}>
            <span className={styles.orderTotal}>Total: $12,200.00</span>
            <a href="#" className={styles.btnDetails}>Ver Detalles</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyOrders;