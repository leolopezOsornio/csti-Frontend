import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../../../../../services/Address.service';
import { shippingService } from '../../../../../services/Shipping.service';
import { ShippingRate } from '../../../../../types/shipping.types';
import styles from '../CartSummary/CartSummary.module.css';

interface CartSummaryProps {
  total: number;
}

const CartSummary = ({ total }: CartSummaryProps) => {
  const navigate = useNavigate();
  
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
  const [address, setAddress] = useState<any>(null);
  const [loadingShipping, setLoadingShipping] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const fetchDefaultShipping = async () => {
      try {
        const addresses = await addressService.getAddresses();
        if (addresses && addresses.length > 0) {
          // Tomar la principal o la primera
          const principal = addresses.find((a: any) => a.es_principal) || addresses[0];
          setAddress(principal);

          // Obtener tarifa más barata por defecto
          const defaultRate = await shippingService.getDefaultRate(principal.id, []);
          setShippingRate(defaultRate);
          
          // Guardarlo en localStorage para el Payment
          shippingService.saveSelectedRate(defaultRate);
          localStorage.setItem('selectedAddressId', principal.id.toString());
        }
      } catch (error) {
        console.error("Error obteniendo envío por defecto:", error);
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchDefaultShipping();
  }, []);

  // Detect scroll to bottom using a precise IntersectionObserver
  useEffect(() => {
    const marker = document.getElementById('cart-bottom-marker');
    if (!marker) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Desaparece el blur cuando el marcador entra en la zona visible
        // por encima de la tarjeta de resumen (margen de -250px)
        setIsAtBottom(entries[0].isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px 0px -280px 0px', // Aproximadamente la altura del summary card
        threshold: 0
      }
    );

    observer.observe(marker);
    return () => observer.disconnect();
  }, [total]); // Dependencia de total para que el observer se mantenga activo si hay cambios

  const handleCheckout = () => {
    navigate('/payment');
  };

  return (
    <aside className={`${styles.cartSummaryCol} ${isAtBottom ? styles.atBottom : ''}`}>
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