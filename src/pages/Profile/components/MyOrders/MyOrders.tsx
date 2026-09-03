import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
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

  const getOverallStatusClass = (orden: any) => {
    if (orden.estado_pago === 'FALLIDO') return styles.cancelled || styles.processing;
    if (orden.estado_pago === 'PENDIENTE') return styles.processing;
    
    // Si el pago se completó, el estado lo dicta el envío
    switch (orden.estado_envio) {
      case 'ENTREGADO': return styles.delivered;
      default: return styles.processing; // En Preparación, Tránsito, etc se ven como procesamiento (amarillo/naranja)
    }
  };

  const getOverallStatusText = (orden: any) => {
    if (orden.estado_pago === 'FALLIDO') return 'Pago Fallido';
    if (orden.estado_pago === 'PENDIENTE') return 'Pago Pendiente';
    
    // Si el pago se completó, el estado lo dicta el envío
    switch (orden.estado_envio) {
      case 'CREADO': return 'En Preparación';
      case 'RECOLECTADO': return 'Enviado';
      case 'EN_TRANSITO': return 'En Tránsito';
      case 'ENTREGADO': return 'Completado';
      default: return 'Procesando';
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  if (loading) return <p>Cargando pedidos...</p>;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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
          currentOrders.map((orden) => {
            const date = new Date(orden.creado_en).toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });

            return (
              <div key={orden.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderId}>Pedido #{orden.id}</span>
                  <span className={`${styles.statusPill} ${getOverallStatusClass(orden)}`}>
                    {getOverallStatusText(orden)}
                  </span>
                  
                  {orden.tiene_novedad_devolucion && (
                    <span className={styles.badgeAlert}>
                      <i className="fa-solid fa-bell"></i> Acción Requerida
                    </span>
                  )}
                  {orden.devolucion_estado && !orden.tiene_novedad_devolucion && (
                    <span className={`${styles.statusPill} ${styles.processing}`} style={{ marginLeft: 'auto', background: '#e2e8f0', color: '#475569' }}>
                      Devolución {orden.devolucion_estado.toLowerCase()}
                    </span>
                  )}
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

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageArrow} 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`${styles.pageDot} ${currentPage === page ? styles.activeDot : ''}`}
              title={`Página ${page}`}
            />
          ))}

          <button 
            className={styles.pageArrow} 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </>
  );
};

export default MyOrders;
