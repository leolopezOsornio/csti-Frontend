// src/pages/Admin/components/Orders/OrderDetail.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faPrint, 
  faCopy 
} from '@fortawesome/free-solid-svg-icons';
import styles from './OrderDetail.module.css';

// Mock Data
const order = {
  id: 'ORD-123456',
  estado_pago: 'Pagado (PayPal)',
  creado_en: 'Jan 23, 2026',
  monto_total: 47558.84,
  paypal_order_id: 'PAYID-XK99...',
  user: {
    first_name: 'Nombre',
    last_name: 'Apellidos',
    email: 'correo@electronico.com',
  },
  perfil: {
    telefono: '+52 442 123 4567',
  },
  direccion_envio: 'Calle y Número, Colonia, Código Postal, Ciudad, Estado, México',
  items: [
    {
      id: 1,
      producto: { 
        clave: 'LXT-100', 
        descripcion: 'Laptop Lenovo ThinkPad X1 Carbon Gen 10', 
        imagen: 'https://via.placeholder.com/100' 
      },
      cantidad: 1,
      precio_unitario: 34500.00,
    },
    {
      id: 2,
      producto: { 
        clave: 'MON-S5', 
        descripcion: 'Monitor Curvo Gaming Samsung Odyssey G5...', 
        imagen: 'https://via.placeholder.com/100' 
      },
      cantidad: 1,
      precio_unitario: 6499.00,
    }
  ],
};

const OrderDetail = () => {
  const subtotal = order.items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Detalle del Pedido #{order.id}</h1>
          <span className={styles.statusPill}>{order.estado_pago}</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnPrimary}>
            <FontAwesomeIcon icon={faPaperPlane} />
            Marcar como Enviado
          </button>
          <button className={styles.btnSecondary}>
            <FontAwesomeIcon icon={faPrint} />
            Imprimir Nota de Venta
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
                <th>SKU</th>
                <th>P. Unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.productCell}>
                      <img src={item.producto.imagen} alt={item.producto.descripcion} className={styles.productImg} />
                      <div className={styles.productDesc}>
                        <span className={styles.productName}>{item.producto.descripcion}</span>
                        <span className={styles.productSku}>{item.producto.clave}</span>
                      </div>
                    </div>
                  </td>
                  <td>{item.producto.clave}</td>
                  <td>${item.precio_unitario.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>${(item.precio_unitario * item.cantidad).toLocaleString()}</td>
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
              <span className={styles.totalLabel}>IVA (16%):</span>
              <span className={styles.totalValue}>${iva.toLocaleString()}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.finalTotal}`}>
              <span>Total:</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Right Column (Sidebar) */}
        <aside className={styles.sidebar}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Cliente</h2>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Nombre Apellidos</span>
              <span className={styles.infoValue}>{order.user.first_name} {order.user.last_name}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Correo Electrónico</span>
              <span className={styles.infoValue}>{order.user.email}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Teléfono</span>
              <span className={styles.infoValue}>{order.perfil.telefono}</span>
            </div>
            <button className={styles.linkButton}>Ver historial del cliente</button>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Dirección de Envío</h2>
            <p className={styles.infoValue}>{order.direccion_envio}</p>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Detalles de Pago</h2>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Proveedor: PayPal</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                <span className={styles.infoLabel}>Transaction ID:</span>
                <span className={styles.paypalTag}>{order.paypal_order_id}</span>
                <FontAwesomeIcon icon={faCopy} style={{ fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer' }} />
              </div>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Fecha: {order.creado_en}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default OrderDetail;
