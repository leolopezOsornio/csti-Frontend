import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import adminPanelService from '../../../../services/AdminPanel.service';
import styles from './OrdersList.module.css';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminPanelService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'COMPLETADO':
        return <span className={`${styles.pill} ${styles.pillCompletado}`}>Completado</span>;
      case 'PENDIENTE':
        return <span className={`${styles.pill} ${styles.pillPendiente}`}>Pendiente</span>;
      case 'FALLIDO':
        return <span className={`${styles.pill} ${styles.pillFallido}`}>Fallido</span>;
      default:
        return <span className={styles.pill}>{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Cargando órdenes...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Listado de Órdenes</h1>
      </header>

      <section className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Monto Total</th>
              <th>Estado Pago</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id}>
                <td><span className={styles.orderId}>#{order.id}</span></td>
                <td>
                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>
                      {order.user_data?.first_name} {order.user_data?.last_name}
                    </span>
                    <span className={styles.clientEmail}>{order.user_data?.email}</span>
                  </div>
                </td>
                <td><span className={styles.amount}>${Number(order.monto_total).toLocaleString()} MXN</span></td>
                <td>{getStatusPill(order.estado_pago)}</td>
                <td><span className={styles.date}>{formatDate(order.creado_en)}</span></td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.viewBtn}
                      title="Ver Detalle"
                      onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default OrdersList;
