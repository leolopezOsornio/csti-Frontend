import { useEffect, useMemo, useState } from 'react';
import { isQuoteCurrent, shippingService } from '../services/Shipping.service';
import type { QuoteContext, ShippingCartItem, ShippingQuote } from '../services/Shipping.service';
import { checkoutError } from '../services/Checkout.service';

export function useShippingQuote(context: QuoteContext, items: ShippingCartItem[], addressVersion: string, enabled = true) {
  // Depend on quote-relevant values, not a parent's newly allocated array.
  // Freeze the same snapshot used in the request and its effect identity.
  const snapshot = JSON.stringify(items.map(item => ({
    id: item.product?.id ?? item.producto?.id ?? item.id,
    cantidad: item.cantidad,
    precio_unitario: String(item.precio_unitario ?? ''),
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
  const quoteItems = useMemo(() => JSON.parse(snapshot) as ShippingCartItem[], [snapshot]);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([context.addressId, context.cartKey, addressVersion, snapshot, attempt, enabled]);
  const [result, setResult] = useState<{
    key: string; quote: ShippingQuote | null; selectedId: string | null; error: string | null; selecting?: boolean;
  }>({ key: '', quote: null, selectedId: null, error: null });

  useEffect(() => {
    let active = true;
    let expiry: ReturnType<typeof setTimeout>;
    const quoteContext = { addressId: context.addressId, cartKey: context.cartKey };
    if (!enabled || !context.addressId) return;
    const preferredId = shippingService.getSelectedRateId(quoteContext);
    shippingService.getQuote(quoteContext, quoteItems).then(async quote => {
      if (!active) return;
      const preferred = quote.rates.find(rate => rate.id === preferredId);
      const selected = preferred ?? quote.rates.reduce((a, b) => BigInt(a.price.replace('.', '')) <= BigInt(b.price.replace('.', '')) ? a : b);
      const confirmed = await shippingService.selectQuoteRate(quote, selected.id);
      if (!active) return;
      if (confirmed.expiresAt <= Date.now()) throw new Error('QUOTE_EXPIRED');
      setResult({ key, quote: confirmed, selectedId: selected.id, error: null });
      shippingService.saveSelectedRate(selected, quoteContext);
      expiry = setTimeout(() => setAttempt(value => value + 1), Math.max(0, confirmed.expiresAt - Date.now()));
    }).catch(error => {
      if (!active) return;
      shippingService.clearSelectedRate();
      setResult({ key, quote: null, selectedId: null,
        error: checkoutError(error).message });
    });
    return () => { active = false; clearTimeout(expiry); };
  }, [context.addressId, context.cartKey, quoteItems, addressVersion, key, enabled]);

  const matches = result.key === key;
  const quote = enabled && matches && !result.selecting && isQuoteCurrent(result.quote, context) ? result.quote : null;
  const selectedRate = quote?.rates.find(rate => rate.id === result.selectedId) ?? null;
  return {
    quote, selectedRate, loading: enabled && context.addressId > 0 && (!matches || !!result.selecting),
    error: context.addressId <= 0 && enabled ? 'Agrega una dirección válida para cotizar el envío.' : matches ? result.error : null,
    retry: () => setAttempt(value => value + 1),
    selectRate: async (id: string) => {
      const rate = quote?.rates.find(candidate => candidate.id === id);
      if (!rate) return;
      setResult(previous => ({ ...previous, selectedId: id, selecting: true }));
      try {
        const confirmed = await shippingService.selectQuoteRate(quote!, id);
        setResult(previous => previous.key === key && previous.selectedId === id
          ? { key, quote: confirmed, selectedId: id, error: null } : previous);
      } catch (error) {
        setResult(previous => previous.key === key && previous.selectedId === id
          ? { key, quote: null, selectedId: null, error: checkoutError(error).message } : previous);
      }
    },
  };
}
