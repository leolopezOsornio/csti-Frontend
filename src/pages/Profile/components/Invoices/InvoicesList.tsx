import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileCode } from '@fortawesome/free-solid-svg-icons';
import { billingService, Invoice } from '../../../../services/Billing.service';
import styles from './InvoicesList.module.css';

const InvoicesList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = invoices.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: '2-digit', month: '2-digit', day: '2-digit'
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
              {currentInvoices.map((invoice) => (
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
          
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <button 
                className={styles.navBtn} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                &#10094;
              </button>

              <div className={styles.paginationDots}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`${styles.dot} ${page === currentPage ? styles.activeDot : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Ir a la página ${page}`}
                  />
                ))}
              </div>

              <button 
                className={styles.navBtn} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                &#10095;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoicesList;
