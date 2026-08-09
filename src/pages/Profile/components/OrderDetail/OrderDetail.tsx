import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../../../../services/Order.service';
import { shippingService } from '../../../../services/Shipping.service';
import { billingService } from '../../../../services/Billing.service';
import Swal from 'sweetalert2';
import TrackingTimeline from './TrackingTimeline';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await orderService.getOrderById(id);
        const tracking = await shippingService.getTracking(id as string, orderData);
        setOrder(orderData);
        setTrackingData(tracking);
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

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      const invoice = await billingService.generateInvoice(id!);
      
      Swal.fire({
        icon: 'success',
        title: '¡Factura generada!',
        text: 'Su factura ha sido timbrada correctamente.',
        confirmButtonColor: '#007bff'
      });
      
      // Update local state to hide button
      setOrder(prev => ({ ...prev, facturada: true }));
      
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 404) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos Fiscales Faltantes',
          text: 'Antes de facturar, por favor guarde sus Datos Fiscales en su perfil.',
          showCancelButton: true,
          confirmButtonText: 'Ir a Datos Fiscales',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#007bff'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/perfil/facturacion/datos';
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al facturar',
          text: error.response?.data?.error || 'Ocurrió un problema inesperado.',
        });
      }
    } finally {
      setGeneratingInvoice(false);
    }
  };

  return (
    <div className={styles.orderDetailContainer}>
      <div style={{ marginBottom: '30px' }}>
        <Link to="/perfil/pedidos" className={styles.btnBack} style={{ marginBottom: '15px' }}>
          ← Volver a mis pedidos
        </Link>
        <header className={styles.header} style={{ marginBottom: 0 }}>
          <h1 className={styles.title}>Pedido #{order.id}</h1>

          {order.estado_pago === 'COMPLETADO' && (
            <div className={styles.headerActions}>
              {order.facturada ? (
                <Link to="/perfil/facturacion/historial" className={styles.btnSuccess}>
                  ✓ Pedido facturado (Descargar)
                </Link>
              ) : (
                <button 
                  onClick={handleGenerateInvoice} 
                  className={styles.btnPrimary} 
                  disabled={generatingInvoice}
                >
                  {generatingInvoice ? 'Generando...' : 'Generar Factura CFDI'}
                </button>
              )}
            </div>
          )}
        </header>
      </div>

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

      <div style={{ marginBottom: '30px' }}>
        <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Rastreo de Envío</h3>
        <TrackingTimeline trackingData={trackingData} order={order} />
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
