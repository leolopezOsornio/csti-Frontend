import type { CheckoutQuote } from './Checkout.service';
import type { CheckoutSession } from './CheckoutSession';

export function checkoutCallbacks(session: CheckoutSession, prepareQuote: () => Promise<CheckoutQuote>) {
  return {
    createOrder: async () => {
      if (session.snapshot().reference?.intentId) return session.resumeOrder();
      return session.start(await prepareQuote());
    },
    onApprove: async (data: { orderID: string }) => { await session.approve(data.orderID); },
    onCancel: async () => { await session.cancel(); },
    onError: () => { session.gatewayError(); },
  };
}
