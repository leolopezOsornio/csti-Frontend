import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { checkoutCallbacks } from '../services/CheckoutCallbacks';
import { CheckoutError } from '../services/Checkout.service';
import type { CheckoutQuote } from '../services/Checkout.service';
import type { CheckoutSession } from '../services/CheckoutSession';

export default function CheckoutPayPal({ session, prepareQuote, disabled, clientId }: {
  session: CheckoutSession; prepareQuote: () => Promise<CheckoutQuote>; disabled: boolean; clientId: string;
}) {
  if (!clientId) return <p role="status">El pago está temporalmente no disponible.</p>;
  const callbacks = checkoutCallbacks(session, async () => {
    if (disabled && !session.snapshot().reference) throw new CheckoutError('CHECKOUT_BLOCKED');
    return prepareQuote();
  });
  return <PayPalScriptProvider options={{ clientId, currency: 'MXN', intent: 'capture' }}>
    <PayPalButtons disabled={disabled} style={{ layout: 'vertical', color: 'gold', label: 'pay' }} {...callbacks} />
  </PayPalScriptProvider>;
}
