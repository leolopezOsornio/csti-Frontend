import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart, faEye } from '@fortawesome/free-solid-svg-icons';
import adminPanelService from '../../../../services/AdminPanel.service';
import styles from './Interests.module.css';

const Interests = () => {
  const [interestsData, setInterestsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const data = await adminPanelService.getInterests();
      setInterestsData(data);
    } catch (error) {
      console.error("Error al cargar intereses:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCartTotal = () => {
    return interestsData
      .filter((i: any) => i.tipo === 'Carrito')
      .reduce((acc, curr: any) => acc + Number(curr.valor_potencial), 0);
  };

  const getMostDesiredProduct = () => {
    // Lógica simplificada: primer producto de la primera wishlist
    const wishlists = interestsData.filter((i: any) => i.tipo === 'Wishlist');
    if (wishlists.length > 0 && (wishlists[0] as any).productos.length > 0) {
      return (wishlists[0] as any).productos[0].descripcion;
    }
    return "N/A";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Cargando intereses de usuarios...</div>;
  }

  return (
    <div className={styles.container}>
      <header>
        <h1 className={styles.title}>Monitoreo de Intereses</h1>
        <p className={styles.subtitle}>Visualiza carritos activos y listas de deseos de los usuarios.</p>
      </header>

      {/* Summary Cards */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconCyan}`}>
            <FontAwesomeIcon icon={faCartShopping} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Oportunidad en Carritos</span>
            <span className={styles.statSubLabel}>Valor Total Estimado</span>
            <span className={styles.statValue}>${calculateCartTotal().toLocaleString()} MXN</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRose}`}>
            <FontAwesomeIcon icon={faHeart} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Producto Destacado</span>
            <span className={styles.statSubLabel}>Basado en Wishlists</span>
            <span className={styles.statValue}>{getMostDesiredProduct()}</span>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Tipo</th>
              <th>Productos de Interés</th>
              <th>Valor Potencial</th>
              <th>Última Actividad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {interestsData.map((data: any, idx) => (
              <tr key={`${data.tipo}-${data.id}-${idx}`}>
                <td>
                  <div className={styles.userInfo}>
                    <img
                      src={`https://i.pravatar.cc/150?u=${data.user.email}`}
                      alt={data.user.first_name}
                      className={styles.avatar}
                    />
                    <span>{data.user.first_name} {data.user.last_name}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.pill} ${data.tipo === 'Carrito' ? styles.pillCarrito : styles.pillWishlist
                    }`}>
                    {data.tipo}
                  </span>
                </td>
                <td>
                  <div className={styles.productThumbnails}>
                    {data.productos.slice(0, 3).map((item: any, i: number) => (
                      <img
                        key={i}
                        src={item.imagen || '/placeholder-product.png'}
                        alt={item.descripcion}
                        className={styles.thumbnail}
                        title={item.descripcion}
                        onError={(e: any) => { e.target.src = '/placeholder-product.png' }}
                      />
                    ))}
                    {data.productos.length > 3 && (
                      <span className={styles.moreCount}>+{data.productos.length - 3} más</span>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>${Number(data.valor_potencial).toLocaleString()} MXN</td>
                <td>{formatDate(data.fecha_actualizacion)}</td>
                <td>
                  <button className={styles.actionBtn} title="Ver detalle">
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Interests;
