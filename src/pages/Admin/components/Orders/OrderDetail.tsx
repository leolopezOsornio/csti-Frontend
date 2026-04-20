import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faPrint,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import adminPanelService from '../../../../services/AdminPanel.service';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await adminPanelService.getOrderById(id!);
      setOrder(data);
    } catch (error) {
      console.error("Error al cargar detalle de pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loadingContainer}>Cargando detalle del pedido...</div>;
  if (!order) return <div className={styles.errorContainer}>Pedido no encontrado.</div>;

  const subtotal = order.items.reduce((acc: number, item: any) => acc + (Number(item.precio_unitario) * item.cantidad), 0);
  // Asumiendo que el total ya incluye el IVA en la base de datos
  const total = Number(order.monto_total);
  const iva = total - subtotal;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Detalle del Pedido #{order.id}</h1>
          <span className={`${styles.statusPill} ${order.estado_pago === 'COMPLETADO' ? styles.statusCompletado : styles.statusPendiente
            }`}>
            {order.estado_pago}
          </span>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary}>
            <FontAwesomeIcon icon={faPaperPlane} />
            Marcar como Enviado
          </button>
          <button className={styles.btnSecondary} onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} />
            Imprimir Nota
          </button>
        </div>
      </header>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Artículos del Pedido</h2>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>P. Unitario</th>
                <th>Cant.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.productCell}>
                      <img
                        src={item.producto_imagen || '/placeholder-product.png'}
                        alt={item.producto_nombre}
                        className={styles.productImg}
                        onError={(e: any) => { e.target.src = '/placeholder-product.png' }}
                      />
                      <div className={styles.productDesc}>
                        <span className={styles.productName}>{item.producto_nombre}</span>
                        <span className={styles.productSku}>{item.producto_clave}</span>
                      </div>
                    </div>
                  </td>
                  <td>${Number(item.precio_unitario).toLocaleString()}</td>
                  <td>{item.cantidad}</td>
                  <td style={{ fontWeight: 600 }}>${(Number(item.precio_unitario) * item.cantidad).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.totalsWrapper}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal:</span>
              <span className={styles.totalValue}>${subtotal.toLocaleString()}</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Impuestos:</span>
              <span className={styles.totalValue}>${iva.toLocaleString()}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.finalTotal}`}>
              <span>Total:</span>
              <span>${total.toLocaleString()} MXN</span>
            </div>
          </div>
        </section>

        {/* Right Column (Sidebar) */}
        <aside className={styles.sidebar}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Información del Cliente</h2>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Nombre Completo</span>
              <span className={styles.infoValue}>{order.user_data?.first_name} {order.user_data?.last_name}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Correo Electrónico</span>
              <span className={styles.infoValue}>{order.user_data?.email}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Teléfono</span>
              <span className={styles.infoValue}>{order.user_profile?.telefono || 'No proporcionado'}</span>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Dirección de Envío</h2>
            <p className={styles.infoValue}>{order.direccion_envio}</p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Detalle de Pago</h2>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Proveedor: PayPal</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span className={styles.infoLabel}>Transaction ID:</span>
                <span className={styles.paypalTag}>{order.paypal_order_id || 'N/A'}</span>
                <FontAwesomeIcon
                  icon={faCopy}
                  style={{ fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => {
                    if (order.paypal_order_id) {
                      navigator.clipboard.writeText(order.paypal_order_id);
                      alert("ID copiado al portapapeles");
                    }
                  }}
                />
              </div>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha de creación:</span>
              <span className={styles.infoValue}>{formatDate(order.creado_en)}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetail;
