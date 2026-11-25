import { addressService } from './Address.service';
import { cartService } from './Cart.service';
import { cartQuoteKey, isQuoteCurrent, ShippingError } from './Shipping.service';
import type { QuoteContext, ShippingQuote } from './Shipping.service';

const addressKey = (value: unknown) => value && typeof value === 'object'
  ? JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : '';

// Recheck immediately before opening the PayPal order. This does not replace
// backend authorization, quote binding, stock validation or capture validation.
export async function revalidateCheckoutShipping(quote: ShippingQuote | null, context: QuoteContext,
  selectedRateId: string, selectedAddress: unknown) {
  if (!isQuoteCurrent(quote, context)) throw new ShippingError('La cotización venció. Cotiza de nuevo.');
  const selected = quote.rates.find(rate => rate.id === selectedRateId);
  if (!selected) throw new ShippingError('Selecciona una tarifa válida.');
  const [cart, addresses] = await Promise.all([cartService.getCart(), addressService.getAddresses()]);
  const address = addresses.find((candidate: { id: number }) => candidate.id === context.addressId);
  if (!address || addressKey(address) !== addressKey(selectedAddress) || cartQuoteKey(cart.items, cart.total) !== context.cartKey) {
    throw new ShippingError('Cambió el carrito o la dirección. Revisa una nueva cotización.');
  }
  if (quote.selected_rate_id !== selectedRateId || quote.total === null) {
    throw new ShippingError('Selecciona una tarifa confirmada por el backend.');
  }
  // A slow request may have crossed the local freshness boundary.
  if (!isQuoteCurrent(quote, context)) throw new ShippingError('La cotización venció. Cotiza de nuevo.');
  return selected;
}
