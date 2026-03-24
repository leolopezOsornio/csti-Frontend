// src/pages/cart/components/EmptyCart.tsx
import { Link } from 'react-router-dom';
import styles from '../EmptyCart/EmptyCart.module.css';

const EmptyCart = () => {
  return (
    <div className={styles.emptyCart}>
      <img
        src="/img/carrito.png"
        alt="Carrito Vacío"
        className={styles.emptyCartImage}
      />

      <h2 className={styles.emptyCartTitle}>Tu carrito está vacío</h2>
      <p className={styles.emptyCartText}>
        Parece que aún no has agregado productos.
      </p>

      <Link to="/home" className={styles.btnCheckout}>
        Ir al Catálogo
      </Link>
    </div>
  );
};

export default EmptyCart;