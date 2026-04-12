import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../../../../services/orderService';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) return <div className={styles.loading}>Cargando detalle del pedido...</div>;
  if (!order) return <div className={styles.error}>No se encontró el pedido.</div>;

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return styles.delivered;
      case 'PENDIENTE': return styles.processing;
      default: return styles.processing;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return 'Completado';
      case 'PENDIENTE': return 'Pendiente';
      case 'FALLIDO': return 'Fallido';
      default: return status;
    }
  };

  return (
    <div className={styles.orderDetailContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pedido #{order.id}</h1>
        <Link to="/perfil/pedidos" className={styles.btnBack}>
          ← Volver a mis pedidos
        </Link>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Estado del Pago</h3>
          <span className={`${styles.statusPill} ${getStatusClass(order.estado_pago)}`}>
            {formatStatus(order.estado_pago)}
          </span>
          <p className={styles.infoContent} style={{ marginTop: '10px' }}>
            <strong>PayPal ID:</strong> {order.paypal_order_id || 'N/A'}
          </p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Dirección de Envío</h3>
          <p className={styles.infoContent}>
            {order.direccion_envio}
          </p>
        </div>
      </div>

      <div className={styles.itemsCard}>
        <h3 className={styles.cardTitle}>Productos</h3>
        <div className={styles.itemsList}>
          {order.items.map((item: any) => (
            <div key={item.id} className={styles.itemRow}>
              <img 
                src={item.producto.imagen || '/img/brand-placeholder.png'} 
                alt={item.producto.descripcion} 
                className={styles.itemImage}
              />
              <div className={styles.itemInfo}>
                <h4>{item.producto.descripcion}</h4>
                <div className={styles.itemMeta}>
                  <span>Cantidad: {item.cantidad}</span>
                  <span style={{ margin: '0 10px' }}>|</span>
                  <span>Unitario: ${Number(item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className={styles.itemPrice}>
                ${(item.cantidad * item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                <span className={styles.itemSubtotal}>Subtotal</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.totalCard}>
          <span className={styles.totalLabel}>Monto Total</span>
          <span className={styles.totalValue}>
            ${Number(order.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default OrderDetail;
