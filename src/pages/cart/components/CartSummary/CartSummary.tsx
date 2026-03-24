// src/pages/cart/components/CartSummary.tsx
import Swal from 'sweetalert2';
import styles from './CartSummary.module.css';

interface CartSummaryProps {
  total: number;
}

const CartSummary = ({ total }: CartSummaryProps) => {
  const handleCheckout = () => {
    Swal.fire({
      title: 'Procesando...',
      text: 'Redirigiendo a la pasarela de pago segura.',
      icon: 'info',
      confirmButtonColor: '#00b4d8',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <aside className={styles.cartSummaryCol}>
      <div className={styles.cartSummaryCard}>
        <h2 className={styles.summaryTitle}>Resumen del Pedido</h2>

        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>
            ${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}*
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span>IVA (16%)</span>
          <span>Calculado al final</span>
        </div>

        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span className={styles.labelTotal}>Total</span>
          <span className={styles.valueTotal}>
            ${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <button className={styles.btnCheckout} onClick={handleCheckout}>
          Proceder al Pago
        </button>

        <div className={styles.trustSignal}>
          <i className="fa-solid fa-lock"></i> Transacción 100% Segura
        </div>

        <p className={styles.summaryNote}>
          * Los precios incluyen IVA si aplica. El desglose final se mostrará en la factura.
        </p>
      </div>
    </aside>
  );
};

export default CartSummary;