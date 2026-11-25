import { useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import { cartService } from '../../services/Cart.service';
import { addressService } from '../../services/Address.service';
import { cartQuoteKey, isQuoteCurrent } from '../../services/Shipping.service';
import type { ShippingCartItem } from '../../services/Shipping.service';
import { CheckoutError, displayMoney } from '../../services/Checkout.service';
import { checkoutAccount } from '../../services/CheckoutRecovery';
import { CheckoutSession } from '../../services/CheckoutSession';
import { revalidateCheckoutShipping } from '../../services/CheckoutShipping.service';
import { useShippingQuote } from '../../hooks/useShippingQuote';
import CheckoutPayPal from '../../components/CheckoutPayPal';
import CheckoutStatus from '../../components/CheckoutStatus';
import styles from './Payment.module.css';

interface Address { id: number; destinatario: string; calle: string; numero_exterior: string; codigo_postal: string; es_principal?: boolean }
interface Cart { items: ShippingCartItem[]; total: string | number }
const EMPTY: ShippingCartItem[] = [];

function AccountCheckout({ accountId }: { accountId: number }) {
  const { refreshCart } = useContext(CartContext);
  const session = useMemo(() => new CheckoutSession(accountId, () => checkoutAccount() === accountId), [accountId]);
  const state = useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState(0);
  const [load, setLoad] = useState(0);
  const [loaded, setLoaded] = useState(-1);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const address = addresses.find(candidate => candidate.id === addressId);
  const items = cart?.items ?? EMPTY;
  const context = { addressId, cartKey: cartQuoteKey(items, cart?.total ?? '') };
  const canQuote = loaded === load && !state.reference && state.phase === 'idle';
  const shipping = useShippingQuote(context, items, JSON.stringify(address), canQuote);
  const quote = shipping.quote;
  const quoteReady = !!quote && isQuoteCurrent(quote, context) && !!quote.selected_rate_id && quote.total !== null;
  const busy = ['creating_intent', 'creating_paypal', 'capturing', 'reconciling'].includes(state.phase);
  const resumeReady = !!state.reference?.intentId && ['CREATED', 'PAYPAL_ORDER_CREATED'].includes(state.intent?.state ?? '');

  useEffect(() => { void session.restore(); }, [session]);
  useEffect(() => {
    let active = true;
    Promise.all([cartService.getCart(), addressService.getAddresses()]).then(([data, rows]: [Cart, Address[]]) => {
      if (!active) return;
      setCart(data); setAddresses(rows);
      let preferred = 0;
      try { preferred = Number(localStorage.getItem('selectedAddressId')); } catch { /* Optional preference. */ }
      setAddressId((rows.find(row => row.id === preferred) ?? rows.find(row => row.es_principal) ?? rows[0])?.id ?? 0);
      setError('');
    }).catch(() => { if (active) setError('No se pudieron cargar carrito y direcciones. La recuperación de compra sigue disponible.'); })
      .finally(() => { if (active) setLoaded(load); });
    return () => { active = false; };
  }, [load]);
  useEffect(() => {
    const invalidate = () => { if (!session.snapshot().reference) setLoad(value => value + 1); };
    window.addEventListener('focus', invalidate); window.addEventListener('storage', invalidate);
    return () => { window.removeEventListener('focus', invalidate); window.removeEventListener('storage', invalidate); };
  }, [session]);
  useEffect(() => { if (state.phase === 'paid') void refreshCart(); }, [state.phase, refreshCart]);

  const prepareQuote = async () => {
    if (!quoteReady || !quote || !address) throw new CheckoutError('QUOTE_EXPIRED', 409);
    try { await revalidateCheckoutShipping(quote, context, quote.selected_rate_id!, address); }
    catch { setError('Cambió el carrito o la dirección. Revisa una nueva cotización.'); setLoad(value => value + 1); throw new CheckoutError('QUOTE_CHANGED', 409); }
    return quote;
  };
  const showPayPal = quoteReady || resumeReady || ['creating_intent', 'creating_paypal', 'awaiting_approval', 'capturing'].includes(state.phase);
  return <div className={styles.paymentContainer}>
    <h1 className={styles.paymentTitle}>Finalizar compra</h1>
    <CheckoutStatus state={state} />
    {state.reference && <section>
      <p>Guarda este código de recuperación antes de cerrar sesión. Contiene referencias de la compra, no datos de pago.</p>
      <textarea aria-label="Código de recuperación de esta compra" readOnly value={JSON.stringify(state.reference)} rows={4} />
      {state.phase !== 'paid' && <button disabled={busy} onClick={() => void session.recover()}>Consultar y recuperar compra</button>}
      {state.phase !== 'paid' && <button disabled={busy} onClick={() => void session.cancel()}>Solicitar cancelación</button>}
    </section>}
    {state.phase === 'paid' && state.intent?.order_id && <Link to="/perfil/pedidos" onClick={() => session.acknowledgePaid()}>Ver mi pedido confirmado</Link>}
    {state.phase === 'cancelled' && <button onClick={() => window.location.reload()}>Volver a cotizar</button>}
    {!state.reference && ['attention', 'requote', 'unavailable'].includes(state.phase) &&
      <button onClick={() => { session.retryQuote(); setLoad(value => value + 1); }}>Volver a cotizar</button>}
    {!state.reference && state.phase !== 'paid' && <details><summary>Recuperar una compra con mi código</summary>
      <textarea aria-label="Código de recuperación guardado" value={code} onChange={event => setCode(event.target.value)} />
      <button onClick={() => { try { session.importCode(code); setCode(''); void session.restore(); } catch { setError('El código no es válido para esta cuenta.'); } }}>Recuperar referencia</button>
    </details>}
    {error && <div role="alert"><p>{error}</p><button onClick={() => setLoad(value => value + 1)}>Reintentar carga</button></div>}
    {!state.reference && state.phase === 'idle' && <div className={styles.paymentLayout}>
      <section className={styles.paymentMain}>
        <h2>Dirección de entrega</h2>
        <select aria-label="Dirección de entrega" value={addressId} onChange={event => setAddressId(Number(event.target.value))}>
          <option value={0}>Selecciona una dirección</option>
          {addresses.map(row => <option key={row.id} value={row.id}>{row.destinatario} — {row.calle} {row.numero_exterior}, CP {row.codigo_postal}</option>)}
        </select>
        <Link to="/perfil/direcciones">Revisar direcciones</Link>
        <h2>Envío</h2>
        {shipping.loading && <p role="status">Cotizando y confirmando tarifa…</p>}
        {shipping.error && <div role="alert"><p>{shipping.error}</p><button onClick={shipping.retry}>Reintentar cotización</button></div>}
        {quote?.rates.map(rate => <button key={rate.id} type="button" aria-pressed={quote.selected_rate_id === rate.id}
          onClick={() => void shipping.selectRate(rate.id)}>{rate.carrier} — {rate.service}: {displayMoney(rate.price)}</button>)}
        <h2>Productos cotizados</h2>
        {quote?.lines.map(line => <p key={line.item_id}>{line.description} · Cantidad: {line.quantity} · Precio unitario: {displayMoney(line.unit_price)}</p>)}
        {loaded === load && !items.length && <p>Tu carrito está vacío.</p>}
      </section>
      <aside className={styles.paymentSidebar}>
        <p>Productos: {displayMoney(quote?.items_total)}</p>
        <p>Envío: {displayMoney(quote?.shipping_total)}</p>
        <p>IVA de productos incluido: {displayMoney(quote?.items_tax)}</p>
        <p>IVA de envío incluido: {displayMoney(quote?.shipping_tax)}</p>
        <strong>Total a pagar: {displayMoney(quote?.total)}</strong>
        {quote && <p>Vigente hasta {new Date(quote.expires_at).toLocaleString()}</p>}
      </aside>
    </div>}
    {showPayPal && <div className={styles.paypalContainer}>
      <CheckoutPayPal session={session} prepareQuote={prepareQuote} disabled={busy || (!quoteReady && !resumeReady)} clientId={import.meta.env.VITE_PAYPAL_CLIENT_ID ?? ''} />
    </div>}
    {!showPayPal && state.phase === 'idle' && <p>El pago está bloqueado hasta obtener una cotización válida.</p>}
  </div>;
}
export default function Payment() {
  const { user, isLoading } = useContext(AuthContext);
  if (isLoading) return <p role="status">Validando sesión…</p>;
  if (!user) return <p>Inicia sesión con la cuenta de tu compra para continuar. <Link to="/login">Iniciar sesión</Link></p>;
  return <AccountCheckout key={user.id} accountId={user.id} />;
}
