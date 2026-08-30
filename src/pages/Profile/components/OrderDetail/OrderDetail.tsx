import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../../../../services/Order.service';
import { shippingService } from '../../../../services/Shipping.service';
import { billingService } from '../../../../services/Billing.service';
import { returnsService, ReturnRequest } from '../../../../services/Returns.service';
import ReturnModal from '../Returns/ReturnModal';
import Swal from 'sweetalert2';
import TrackingTimeline from './TrackingTimeline';
import styles from './OrderDetail.module.css';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnStatus, setReturnStatus] = useState<ReturnRequest | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await orderService.getOrderById(id);
        const tracking = await shippingService.getTracking(id as string, orderData);
        const retStatus = await returnsService.getReturnStatus(id as string);
        
        setOrder(orderData);
        setTrackingData(tracking);
        setReturnStatus(retStatus);
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

  const handleReturnSuccess = async () => {
    const retStatus = await returnsService.getReturnStatus(id as string);
    setReturnStatus(retStatus);
  };

  const renderReturnButton = () => {
    if (!returnStatus) {
      return (
        <button 
          onClick={() => setIsReturnModalOpen(true)} 
          className={styles.btnSecondary}
          style={{ background: '#f8f9fa', color: '#dc3545', border: '1px solid #dc3545', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          Solicitar Devolución
        </button>
      );
    }

    if (returnStatus.estado === 'PENDIENTE') {
      return (
        <span style={{ padding: '10px 15px', background: '#ffeeba', color: '#856404', borderRadius: '8px', fontWeight: 600 }}>
          Devolución en Revisión
        </span>
      );
    }

    if (returnStatus.estado === 'EN_TRANSITO') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
          <a 
            href={returnStatus.url_guia || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ background: '#28a745', color: '#fff', textDecoration: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 600, display: 'inline-block' }}
          >
            Descargar Guía de Retorno
          </a>
          {returnStatus.numero_de_guia && (
            <span style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600 }}>
              Rastreo: {returnStatus.numero_de_guia}
            </span>
          )}
        </div>
      );
    }

    if (returnStatus.estado === 'INSPECCION') {
      return (
        <span style={{ padding: '10px 15px', background: '#d1ecf1', color: '#0c5460', borderRadius: '8px', fontWeight: 600 }}>
          Paquete en Inspección
        </span>
      );
    }

    if (returnStatus.estado === 'REEMBOLSADO') {
      return (
        <span style={{ padding: '10px 15px', background: '#d4edda', color: '#155724', borderRadius: '8px', fontWeight: 600 }}>
          Devolución Completada
        </span>
      );
    }

    if (returnStatus.estado === 'RECHAZADA') {
      return (
        <button 
          onClick={() => {
            if (returnStatus.motivo_rechazo) {
              Swal.fire({
                icon: 'error',
                title: 'Solicitud Rechazada',
                html: `
                    <div style="text-align: left; margin-top: 10px; font-size: 0.95rem; color: #334155;">
                      <div style="margin-bottom: 16px;">
                        <strong>Motivo del rechazo:</strong>
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 8px; color: #475569;">
                          ${returnStatus.motivo_rechazo}
                        </div>
                      </div>
                      
                      <strong>¿Qué sucede ahora?</strong>
                      <ul style="margin-top: 8px; padding-left: 20px; color: #475569; font-size: 0.9rem; line-height: 1.5;">
                        <li style="margin-bottom: 6px;">Si el producto aún está contigo, la solicitud queda cerrada de forma definitiva.</li>
                        ${returnStatus.url_guia_rechazo 
                          ? `<li style="margin-bottom: 6px;"><strong>Tu paquete va de regreso.</strong> El producto ha sido re-empaquetado en nuestra bodega y enviado de vuelta a tu domicilio. Puedes descargar la etiqueta y rastrear el paquete con el número: <strong>${returnStatus.numero_de_guia_rechazo}</strong>.
                              <br><br>
                              <a href="${returnStatus.url_guia_rechazo}" target="_blank" style="display:inline-block; padding: 6px 12px; background: #0d47a1; color: white; border-radius: 4px; text-decoration: none; font-weight: 500;">Descargar Guía de Regreso</a>
                             </li>` 
                          : `<li style="margin-bottom: 6px;">Si el producto ya se encontraba en nuestra bodega, un asesor te contactará para coordinar el retorno del artículo a tu domicilio (el costo de paquetería será cubierto por el cliente).</li>`
                        }
                        <li>Para dudas o aclaraciones, contacta a <a href="mailto:ventas@csti.com.mx" style="color: #0d47a1; font-weight: 600; text-decoration: none;">Soporte CSTI</a>.</li>
                      </ul>
                    </div>
                `,
                confirmButtonColor: '#0d47a1',
                confirmButtonText: 'Entendido',
                width: '600px'
              }).then(() => {
                returnsService.marcarDevolucionLeida(id as string).then(() => {
                  window.location.reload();
                }).catch(console.error);
              });
            }
          }}
          style={{ 
            padding: '10px 15px', 
            background: '#f8d7da', 
            color: '#721c24', 
            border: '1px solid #f5c6cb', 
            borderRadius: '8px', 
            fontWeight: 600, 
            cursor: returnStatus.motivo_rechazo ? 'pointer' : 'default',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseOver={(e) => { if (returnStatus.motivo_rechazo) e.currentTarget.style.background = '#f5c6cb'; }}
          onMouseOut={(e) => { if (returnStatus.motivo_rechazo) e.currentTarget.style.background = '#f8d7da'; }}
        >
          <span>Devolución Rechazada</span>
          {returnStatus.motivo_rechazo && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          )}
        </button>
      );
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
            <div className={styles.headerActions} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              {renderReturnButton()}
              
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

      <ReturnModal 
        isOpen={isReturnModalOpen} 
        onClose={() => setIsReturnModalOpen(false)} 
        orderId={id!} 
        onSuccess={handleReturnSuccess} 
      />
    </div>
  );
};

export default OrderDetail;
