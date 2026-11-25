import { displayMoney } from '../services/Checkout.service';
import type { CheckoutState } from '../services/CheckoutSession';

const labels = { idle: 'Selecciona una tarifa para continuar.', creating_intent: 'Preparando tu compra…',
  creating_paypal: 'Preparando la aprobación en PayPal…', awaiting_approval: 'Esperando tu aprobación en PayPal.',
  capturing: 'Confirmando el pago…', pending: 'Tu compra está pendiente de confirmación. No inicies otra compra.',
  reconciling: 'Consultando el resultado de tu compra…', paid: 'Pago confirmado', cancelled: 'Compra cancelada antes del cobro.',
  attention: 'Tu compra requiere atención.', unavailable: 'Las compras están temporalmente no disponibles.',
  requote: 'La cotización cambió o venció. Debes cotizar de nuevo.' };
export default function CheckoutStatus({ state }: { state: CheckoutState }) {
  const confirmed = state.phase === 'paid' && state.intent?.state === 'CAPTURED' && state.intent.order_id;
  return <section role="status" aria-live="polite">
    <h2>{confirmed ? `Pago confirmado. Pedido #${state.intent!.order_id}` : state.phase === 'paid' ? 'Tu compra requiere atención.' : labels[state.phase]}</h2>
    {state.message && <p>{state.message}</p>}
    {state.intent && <p>Importe registrado: {displayMoney(state.intent.total)}</p>}
    {state.intent?.fulfillment_state === 'REQUIRES_MANUAL_RECONCILIATION' && <p>El pago está registrado. La preparación del pedido requiere revisión por nuestro equipo.</p>}
  </section>;
}
