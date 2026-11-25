import { useEffect, useMemo, useState } from 'react';
import { isQuoteCurrent, shippingService } from '../services/Shipping.service';
import type { QuoteContext, ShippingCartItem, ShippingQuote } from '../services/Shipping.service';

export function useShippingQuote(context: QuoteContext, items: ShippingCartItem[], addressVersion: string) {
  // Depend on quote-relevant values, not a parent's newly allocated array.
  // Freeze the same snapshot used in the request and its effect identity.
  const snapshot = JSON.stringify(items.map(item => ({
    id: item.product?.id ?? item.producto?.id ?? item.id,
    cantidad: item.cantidad,
    precio_unitario: String(item.precio_unitario ?? ''),
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
  const quoteItems = useMemo(() => JSON.parse(snapshot) as ShippingCartItem[], [snapshot]);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([context.addressId, context.cartKey, addressVersion, snapshot, attempt]);
  const [result, setResult] = useState<{
    key: string; quote: ShippingQuote | null; selectedId: string | null; error: string | null;
  }>({ key: '', quote: null, selectedId: null, error: null });

  useEffect(() => {
    let active = true;
    let expiry: ReturnType<typeof setTimeout>;
    const quoteContext = { addressId: context.addressId, cartKey: context.cartKey };
    const preferredId = shippingService.getSelectedRateId(quoteContext);
    shippingService.getQuote(quoteContext, quoteItems).then(quote => {
      if (!active) return;
      const preferred = quote.rates.find(rate => rate.id === preferredId);
      const selected = preferred ?? quote.rates.reduce((a, b) => a.price <= b.price ? a : b);
      setResult({ key, quote, selectedId: selected.id, error: null });
      shippingService.saveSelectedRate(selected, quoteContext);
      expiry = setTimeout(() => setAttempt(value => value + 1), Math.max(0, quote.expiresAt - Date.now()));
    }).catch(() => {
      if (!active) return;
      shippingService.clearSelectedRate();
      setResult({ key, quote: null, selectedId: null,
        error: context.addressId > 0 ? 'No fue posible obtener una cotización válida. Intenta de nuevo.' : 'Agrega una dirección válida para cotizar el envío.' });
    });
    return () => { active = false; clearTimeout(expiry); };
  }, [context.addressId, context.cartKey, quoteItems, addressVersion, key]);

  const matches = result.key === key;
  const quote = matches && isQuoteCurrent(result.quote, context) ? result.quote : null;
  const selectedRate = quote?.rates.find(rate => rate.id === result.selectedId) ?? null;
  return {
    quote, selectedRate, loading: !matches, error: matches ? result.error : null,
    retry: () => setAttempt(value => value + 1),
    selectRate: (id: string) => {
      const rate = quote?.rates.find(candidate => candidate.id === id);
      if (!rate) return;
      setResult(previous => ({ ...previous, selectedId: id }));
      shippingService.saveSelectedRate(rate, context);
    },
  };
}
