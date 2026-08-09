import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileCode } from '@fortawesome/free-solid-svg-icons';
import { billingService, Invoice } from '../../../../services/Billing.service';
import styles from './InvoicesList.module.css';

const InvoicesList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await billingService.getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error("Error al obtener historial de facturas", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando sus facturas...</p>
      </div>
    );
  }

  return (
    <div className={styles.invoicesContainer}>
      <h2>Mis Facturas</h2>
      <p className={styles.subtitle}>
        Historial de todos sus comprobantes fiscales (CFDI 4.0).
      </p>

      {invoices.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aún no ha generado ninguna factura.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>No. Pedido</th>
                <th>Fecha de Emisión</th>
                <th>Folio Fiscal (UUID)</th>
                <th>Estado</th>
                <th>Descargas</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>#{invoice.orden_id}</td>
                  <td>{formatDate(invoice.creado_en)}</td>
                  <td>{invoice.uuid || 'Pendiente'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[invoice.status.toLowerCase()] || ''}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {invoice.facturapi_id && (
                        <a href={`http://localhost:8000/api/facturacion/descargar/${invoice.facturapi_id}/pdf/`} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn} title="Descargar PDF">
                          <FontAwesomeIcon icon={faFilePdf} /> PDF
                        </a>
                      )}
                      {invoice.facturapi_id && (
                        <a href={`http://localhost:8000/api/facturacion/descargar/${invoice.facturapi_id}/xml/`} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn} title="Descargar XML">
                          <FontAwesomeIcon icon={faFileCode} /> XML
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoicesList;
