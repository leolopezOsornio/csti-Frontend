import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../../../../services/Address.service';
import { displayMoney } from '../../../../services/Checkout.service';
import { cartQuoteKey } from '../../../../services/Shipping.service';
import { useShippingQuote } from '../../../../hooks/useShippingQuote';
import type { ShippingCartItem } from '../../../../services/Shipping.service';
import styles from '../CartSummary/CartSummary.module.css';

interface CartSummaryProps {
  total: number;
  items: ShippingCartItem[];
}

const CartSummary = ({ total, items }: CartSummaryProps) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const accountId = user?.id ?? null;
  
  const [address, setAddress] = useState<{ id: number; codigo_postal: string } | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressAttempt, setAddressAttempt] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const context = { addressId: address?.id ?? 0, cartKey: cartQuoteKey(items, total) };
  const { quote, selectedRate: shippingRate, loading: loadingShipping, error: quoteError } =
    useShippingQuote(context, items, JSON.stringify([accountId, address]), accountId !== null);

  useEffect(() => {
    let active = true;
    addressService.getAddresses().then((addresses: { id: number; codigo_postal: string; es_principal?: boolean }[]) => {
      if (!active) return;
      const principal = addresses.find(candidate => candidate.es_principal) ?? addresses[0] ?? null;
      setAddress(principal);
      setAddressError(principal ? null : 'Agrega una dirección en tu perfil para continuar.');
      try {
        if (principal) localStorage.setItem('selectedAddressId', String(principal.id));
        else localStorage.removeItem('selectedAddressId');
      } catch { /* Storage is optional. */ }
    }).catch(() => {
      if (!active) return;
      setAddress(null);
      setAddressError('No se pudieron cargar tus direcciones. Intenta de nuevo.');
    });
    return () => { active = false; };
  }, [addressAttempt, accountId]);

  useEffect(() => {
    const invalidate = () => { setAddress(null); setAddressAttempt(value => value + 1); };
    window.addEventListener('focus', invalidate);
    window.addEventListener('storage', invalidate);
    return () => { window.removeEventListener('focus', invalidate); window.removeEventListener('storage', invalidate); };
  }, []);


  useEffect(() => {
    const marker = document.getElementById('cart-bottom-marker');
    if (!marker) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsAtBottom(entries[0].isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px 0px -280px 0px',
        threshold: 0
      }
    );

    observer.observe(marker);
    return () => observer.disconnect();
  }, [total]);

  const handleCheckout = () => {
    if (quote && shippingRate && address) navigate('/payment');
  };



  return (
    <aside className={`${styles.cartSummaryCol} ${isAtBottom ? styles.atBottom : ''}`}>
      <div className={styles.cartSummaryCard}>
        <h2 className={styles.summaryTitle}>Resumen de compra</h2>

        <div className={styles.summaryRow}>
          <span>Productos</span>
          <span>
            {displayMoney(quote?.items_total)}
          </span>
        </div>

        <div className={styles.summaryRow}>
          <span>Envío</span>
          {loadingShipping ? (
            <span style={{color: '#64748b', fontSize: '0.9rem'}}>Calculando...</span>
          ) : shippingRate ? (
            <span>{displayMoney(quote?.shipping_total)}</span>
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
            {displayMoney(quote?.total)}
          </span>
        </div>

        {(addressError || quoteError) && <div role="alert">
          <p>{addressError || quoteError}</p>
          <button type="button" onClick={() => { setAddress(null); setAddressAttempt(value => value + 1); }}>Reintentar cotización</button>
        </div>}
        <button
          className={styles.btnCheckout} 
          onClick={handleCheckout}
          disabled={loadingShipping || !quote || !shippingRate || !address}
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
