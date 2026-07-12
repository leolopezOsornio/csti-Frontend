import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../../../../services/Address.service';
import { shippingService, ShippingRate } from '../../../../services/Shipping.service';
import styles from '../CartSummary/CartSummary.module.css';

interface CartSummaryProps {
  total: number;
}

const CartSummary = ({ total }: CartSummaryProps) => {
  const navigate = useNavigate();
  
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
  const [address, setAddress] = useState<any>(null);
  const [loadingShipping, setLoadingShipping] = useState(true);

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

  const handleCheckout = () => {
    navigate('/payment');
  };

  const finalTotal = total + (shippingRate?.price || 0);

  return (
    <aside className={styles.cartSummaryCol}>
      <div className={styles.cartSummaryCard}>
        <h2 className={styles.summaryTitle}>Resumen de compra</h2>

        <div className={styles.summaryRow}>
          <span>Productos</span>
          <span>
            ${Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span>Envío</span>
          {loadingShipping ? (
            <span style={{color: '#64748b', fontSize: '0.9rem'}}>Calculando...</span>
          ) : shippingRate ? (
            <span>${shippingRate.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          ) : (
            <span>Pendiente</span>
          )}
        </div>
        
        {address && shippingRate && (
          <p style={{fontSize: '0.85rem', color: '#10b981', margin: '-0.5rem 0 1rem 0'}}>
            <i className="fa-solid fa-truck"></i> Envío a CP {address.codigo_postal}
          </p>
        )}

        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span className={styles.labelTotal}>Total</span>
          <span className={styles.valueTotal}>
            ${Number(finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <button 
          className={styles.btnCheckout} 
          onClick={handleCheckout}
          disabled={loadingShipping}
        >
          {loadingShipping ? 'Espere...' : 'Continuar'}
        </button>

        <div className={styles.trustSignal}>
          <i className="fa-solid fa-lock"></i> Transacción 100% Segura
        </div>
      </div>
    </aside>
  );
};

export default CartSummary;