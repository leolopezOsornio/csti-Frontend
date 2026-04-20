// src/pages/Admin/components/Interests/Interests.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart, faEye } from '@fortawesome/free-solid-svg-icons';
import styles from './Interests.module.css';

// Mock Data
const interestsData = [
  {
    id: 1,
    user: { first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com' },
    tipo: 'Carrito',
    items: [
      { id: 1, imagen: 'https://via.placeholder.com/100', descripcion: 'Laptop Lenovo X1' },
      { id: 2, imagen: 'https://via.placeholder.com/100', descripcion: 'Monitor Dell 27' },
      { id: 3, imagen: 'https://via.placeholder.com/100', descripcion: 'Teclado Mecánico' },
      { id: 4, imagen: 'https://via.placeholder.com/100', descripcion: 'Mouse Logi' },
    ],
    total_calculado: '$154,000 MXN',
    actualizado: 'Hace 2 horas',
  },
  {
    id: 2,
    user: { first_name: 'Ana', last_name: 'García', email: 'ana@example.com' },
    tipo: 'Wishlist',
    items: [
      { id: 5, imagen: 'https://via.placeholder.com/100', descripcion: 'iPhone 15 Pro' },
    ],
    total_calculado: '$28,000 MXN',
    actualizado: 'Hace 4 horas',
  },
  {
    id: 3,
    user: { first_name: 'Carlos', last_name: 'López', email: 'carlos@example.com' },
    tipo: 'Carrito',
    items: [
      { id: 6, imagen: 'https://via.placeholder.com/100', descripcion: 'Silla Gamer' },
      { id: 7, imagen: 'https://via.placeholder.com/100', descripcion: 'Escritorio' },
    ],
    total_calculado: '$15,500 MXN',
    actualizado: 'Hace 5 horas',
  },
];

const Interests = () => {
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
            <span className={styles.statValue}>$154,000 MXN</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRose}`}>
            <FontAwesomeIcon icon={faHeart} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Productos más Deseados</span>
            <span className={styles.statSubLabel}>Basado en Wishlists</span>
            <span className={styles.statValue}>Laptop Lenovo X1</span>
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
            {interestsData.map((data) => (
              <tr key={data.id}>
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
                  <span className={`${styles.pill} ${
                    data.tipo === 'Carrito' ? styles.pillCarrito : styles.pillWishlist
                  }`}>
                    {data.tipo}
                  </span>
                </td>
                <td>
                  <div className={styles.productThumbnails}>
                    {data.items.slice(0, 3).map((item) => (
                      <img 
                        key={item.id} 
                        src={item.imagen} 
                        alt={item.descripcion} 
                        className={styles.thumbnail}
                        title={item.descripcion}
                      />
                    ))}
                    {data.items.length > 3 && (
                      <span className={styles.moreCount}>+{data.items.length - 3} más</span>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{data.total_calculado}</td>
                <td>{data.actualizado}</td>
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
