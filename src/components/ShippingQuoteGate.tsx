import type { ReactNode } from 'react';
import { isQuoteCurrent } from '../services/Shipping.service';
import type { QuoteContext, ShippingQuote } from '../services/Shipping.service';

export default function ShippingQuoteGate({ quote, context, selectedRateId, children }: {
  quote: ShippingQuote | null;
  context: QuoteContext;
  selectedRateId: string | null;
  children: ReactNode;
}) {
  if (!isQuoteCurrent(quote, context) || quote.total === null || quote.selected_rate_id !== selectedRateId ||
      !quote.rates.some(rate => rate.id === selectedRateId)) {
    return <p role="status">El pago está bloqueado hasta obtener una cotización válida.</p>;
  }
  return children;
}
