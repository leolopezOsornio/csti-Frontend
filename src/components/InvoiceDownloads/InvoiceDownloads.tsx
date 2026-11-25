import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileCode } from '@fortawesome/free-solid-svg-icons';
import { billingService, invoiceDownloadMessage, InvoiceDownloadError } from '../../services/Billing.service';
import type { InvoiceDownloadSource, InvoiceFormat } from '../../services/Billing.service';

export default function InvoiceDownloads({ invoice, className }: {
  invoice: InvoiceDownloadSource;
  className?: string;
}) {
  const [downloading, setDownloading] = useState<InvoiceFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const active = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const download = async (format: InvoiceFormat) => {
    if (active.current) return;
    active.current = true;
    setError(null);
    setNeedsLogin(false);
    setDownloading(format);
    try { await billingService.downloadInvoice(invoice, format); }
    catch (failure) {
      if (mounted.current) {
        setError(invoiceDownloadMessage(failure));
        setNeedsLogin(failure instanceof InvoiceDownloadError && failure.status === 401);
      }
    }
    finally {
      active.current = false;
      if (mounted.current) setDownloading(null);
    }
  };

  return <div aria-busy={downloading !== null}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {(['pdf', 'xml'] as const).map(format => <button key={format} type="button" className={className}
        disabled={downloading !== null} onClick={() => { void download(format); }}
        aria-label={`Descargar factura ${format.toUpperCase()}`}>
        <FontAwesomeIcon icon={format === 'pdf' ? faFilePdf : faFileCode} /> {format.toUpperCase()}
      </button>)}
    </div>
    {downloading && <p role="status">Descargando {downloading.toUpperCase()}...</p>}
    {error && <p role="alert">{error}</p>}
    {needsLogin && <a href="/login">Iniciar sesión de nuevo</a>}
  </div>;
}
