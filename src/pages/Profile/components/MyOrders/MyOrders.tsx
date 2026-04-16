// src/pages/Profile/components/MyOrders/MyOrders.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../../../services/Order.service';
import styles from '../MyOrders/MyOrders.module.css';

const MyOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return styles.delivered;
      case 'PENDIENTE': return styles.processing;
      case 'FALLIDO': return styles.processing; // O crear una roja si existiera
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

  if (loading) return <p>Cargando pedidos...</p>;

  return (
    <>
      <h1 className={styles.pageTitle}>Historial de Pedidos</h1>

      <div className={styles.ordersList}>
        {orders.length === 0 ? (
          <div className={styles.noOrders}>
            <p>Aún no has realizado ningún pedido.</p>
            <Link to="/listado" className={styles.btnDetails}>Ir a la tienda</Link>
          </div>
        ) : (
          orders.map((orden) => {
            const date = new Date(orden.creado_en).toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });

            return (
              <div key={orden.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderId}>Pedido #{orden.id}</span>
                  <span className={`${styles.statusPill} ${getStatusClass(orden.estado_pago)}`}>
                    {formatStatus(orden.estado_pago)}
                  </span>
                </div>

                <div className={styles.orderBody}>
                  <div className={styles.orderDate}>Fecha: {date}</div>
                  <div className={styles.orderPreview}>
                    <div className={styles.orderThumbs}>
                      {orden.items.slice(0, 3).map((item: any) => (
                        <img 
                          key={item.id}
                          src={item.producto.imagen || '/img/brand-placeholder.png'} 
                          className={styles.thumbMini} 
                          alt={item.producto.descripcion} 
                        />
                      ))}
                    </div>
                    {orden.items.length > 3 && (
                      <span className={styles.moreItems}>+ {orden.items.length - 3} artículos más</span>
                    )}
                    {orden.items.length <= 3 && orden.items.length > 0 && (
                      <span className={styles.moreItems}>
                        {orden.items.length} {orden.items.length === 1 ? 'artículo' : 'artículos'}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.orderFooter}>
                  <span className={styles.orderTotal}>Total: ${Number(orden.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  <Link to={`/perfil/pedidos/${orden.id}`} className={styles.btnDetails}>Ver Detalles</Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default MyOrders;
