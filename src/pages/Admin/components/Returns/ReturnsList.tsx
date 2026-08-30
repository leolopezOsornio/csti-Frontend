import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faImage } from '@fortawesome/free-solid-svg-icons';
import { getUserInitials } from '../../../../utils/userDisplay';
import styles from './ReturnsList.module.css';
import { returnsService } from '../../../../services/Returns.service';

type EstadoDevolucion = 'PENDIENTE' | 'EN_TRANSITO' | 'INSPECCION' | 'REEMBOLSADO' | 'RECHAZADA';


const TABS = ['Todas', 'PENDIENTE', 'EN_TRANSITO', 'INSPECCION', 'COMPLETADAS'];

const ReturnsList = () => {
    const [returns, setReturns] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const data = await returnsService.getAllReturns();
            setReturns(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar las devoluciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const verEvidencia = (fotos: string[]) => {
        if (!fotos || fotos.length === 0) {
            Swal.fire('Sin Evidencia', 'El cliente no adjuntó fotografías a esta solicitud.', 'info');
            return;
        }

        const imagesHtml = fotos.map(f => `<img src="${f}" style="max-width:100%; border-radius:8px; margin-bottom:10px; border:1px solid #ddd;" />`).join('');
        
        Swal.fire({
            title: 'Evidencia Fotográfica',
            html: `<div style="max-height: 400px; overflow-y: auto;">${imagesHtml}</div>`,
            width: '600px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0d47a1'
        });
    };

    const handleAction = async (id: number, accion: string) => {
        try {
            if (accion === 'Autorizar') {
                const { isConfirmed } = await Swal.fire({
                    title: 'Autorizar Envío',
                    text: 'Se generará la guía automáticamente con Envia.com y el cliente será notificado.',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, generar guía',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#10b981'
                });
                if (isConfirmed) {
                    await returnsService.updateReturnStatus(id, 'EN_TRANSITO');
                    fetchReturns();
                    window.dispatchEvent(new Event('returnsUpdated'));
                    Swal.fire('¡Autorizado!', 'Guía generada y enviada al cliente.', 'success');
                }
            } 
            else if (accion === 'Recibir') {
                const { isConfirmed } = await Swal.fire({
                    title: 'Paquete Recibido',
                    text: '¿Confirmas que el paquete llegó a la bodega y pasará a inspección?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Confirmar recepción',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#3b82f6'
                });
                if (isConfirmed) {
                    await returnsService.updateReturnStatus(id, 'INSPECCION');
                    fetchReturns();
                    window.dispatchEvent(new Event('returnsUpdated'));
                    Swal.fire('Recibido', 'El paquete está en zona de inspección.', 'success');
                }
            }
            else if (accion === 'Reembolsar') {
                const { isConfirmed } = await Swal.fire({
                    title: 'Aprobar Reembolso',
                    text: '¿La inspección fue exitosa? Se autorizará la devolución del dinero al cliente.',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Aprobar Reembolso',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#10b981'
                });
                if (isConfirmed) {
                    await returnsService.updateReturnStatus(id, 'REEMBOLSADO');
                    fetchReturns();
                    window.dispatchEvent(new Event('returnsUpdated'));
                    Swal.fire('¡Reembolsado!', 'El dinero ha sido devuelto al cliente exitosamente.', 'success');
                }
            }
            else if (accion === 'Rechazar') {
                const { isConfirmed, value: motivoRechazo } = await Swal.fire({
                    title: 'Rechazar Devolución',
                    input: 'textarea',
                    inputLabel: 'Motivo de rechazo',
                    inputPlaceholder: 'Ej: El producto llegó con golpes por mal uso...',
                    showCancelButton: true,
                    confirmButtonText: 'Rechazar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#ef4444'
                });
                if (isConfirmed && motivoRechazo) {
                    await returnsService.updateReturnStatus(id, 'RECHAZADA', motivoRechazo);
                    fetchReturns();
                    window.dispatchEvent(new Event('returnsUpdated'));
                    Swal.fire('Rechazada', 'La solicitud ha sido rechazada.', 'info');
                } else if (isConfirmed && !motivoRechazo) {
                    Swal.fire('Error', 'Debe proporcionar un motivo para rechazar.', 'error');
                }
            }
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.error || 'Ocurrió un error al actualizar el estado', 'error');
        }
    };

    const getPillStyle = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE': return styles.pillPendiente;
            case 'EN_TRANSITO': return styles.pillTransito;
            case 'INSPECCION': return styles.pillInspeccion;
            case 'REEMBOLSADO': return styles.pillReembolsado;
            case 'RECHAZADA': return styles.pillRechazado;
            default: return '';
        }
    };

    const filteredReturns = returns.filter(ret => {
        const clientName = ret.cliente_nombre || 'Cliente'; 
        const orderIdStr = String(ret.orden || '');
        const searchMatch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            orderIdStr.toLowerCase().includes(searchTerm.toLowerCase());
        
        let tabMatch = true;
        if (activeTab === 'PENDIENTE') tabMatch = ret.estado === 'PENDIENTE';
        if (activeTab === 'EN_TRANSITO') tabMatch = ret.estado === 'EN_TRANSITO';
        if (activeTab === 'INSPECCION') tabMatch = ret.estado === 'INSPECCION';
        if (activeTab === 'COMPLETADAS') tabMatch = ['REEMBOLSADO', 'RECHAZADA'].includes(ret.estado);

        return searchMatch && tabMatch;
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitles}>
                    <h1 className={styles.title}>Gestión de Devoluciones</h1>
                    <p className={styles.subtitle}>
                        Control de logística inversa: Autoriza envíos, inspecciona paquetes y gestiona reembolsos.
                    </p>
                </div>
                
                <div className={styles.controls}>
                    <div className={styles.searchGroup}>
                        <div className={styles.searchWrapper}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente o ID..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className={styles.tabsContainer}>
                {TABS.map(tab => (
                    <button 
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <section className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Cliente</th>
                            <th>Motivo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    Cargando devoluciones...
                                </td>
                            </tr>
                        ) : filteredReturns.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    No hay devoluciones que coincidan con los filtros.
                                </td>
                            </tr>
                        ) : (
                            filteredReturns.map((ret) => (
                                <tr key={ret.id}>
                                    <td>#{ret.orden}</td>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <span className={styles.avatar} aria-hidden="true">
                                                {getUserInitials(
                                                    ret.cliente_nombre?.split(' ')[0] || 'C', 
                                                    ret.cliente_nombre?.split(' ')[1] || 'L', 
                                                    ret.cliente_email || 'cliente@example.com'
                                                )}
                                            </span>
                                            <div className={styles.userDetails}>
                                                <span className={styles.userName}>{ret.cliente_nombre || 'Cliente'}</span>
                                                <span className={styles.userEmail}>{ret.cliente_email || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>{ret.motivo}</div>
                                        {ret.evidencias && ret.evidencias.length > 0 && (
                                            <button 
                                                className={styles.btnEvidencia} 
                                                onClick={() => verEvidencia(ret.evidencias.map((e:any) => e.imagen))}
                                            >
                                                <FontAwesomeIcon icon={faImage} /> Ver Fotos ({ret.evidencias.length})
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                            <span className={`${styles.pill} ${getPillStyle(ret.estado)}`}>
                                                {ret.estado.replace('_', ' ')}
                                            </span>
                                            {ret.atendido_por_nombre && (
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Atendido por: <strong style={{ color: '#475569' }}>{ret.atendido_por_nombre}</strong>
                                                </span>
                                            )}
                                            {ret.estado === 'EN_TRANSITO' && ret.url_guia && (
                                                <a href={ret.url_guia} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>
                                                    Ver Guía Inversa
                                                </a>
                                            )}
                                            {ret.estado === 'RECHAZADA' && ret.url_guia_rechazo && (
                                                <a href={ret.url_guia_rechazo} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#ef4444', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    Descargar Guía Retorno
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {ret.estado === 'PENDIENTE' && (
                                                <>
                                                    <button className={`${styles.actionBtn} ${styles.btnAprobar}`} onClick={() => handleAction(ret.id, 'Autorizar')}>
                                                        Autorizar Envío
                                                    </button>
                                                    <button className={`${styles.actionBtn} ${styles.btnRechazar}`} onClick={() => handleAction(ret.id, 'Rechazar')}>
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                            {ret.estado === 'EN_TRANSITO' && (
                                                <button className={`${styles.actionBtn} ${styles.btnAccion}`} onClick={() => handleAction(ret.id, 'Recibir')}>
                                                    Marcar Recibido
                                                </button>
                                            )}
                                            {ret.estado === 'INSPECCION' && (
                                                <>
                                                    <button className={`${styles.actionBtn} ${styles.btnAprobar}`} onClick={() => handleAction(ret.id, 'Reembolsar')}>
                                                        Aprobar Reembolso
                                                    </button>
                                                    <button className={`${styles.actionBtn} ${styles.btnRechazar}`} onClick={() => handleAction(ret.id, 'Rechazar')}>
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                            {(ret.estado === 'REEMBOLSADO' || ret.estado === 'RECHAZADA') && (
                                                <span className={styles.badgeCompletado}>
                                                    Finalizada
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default ReturnsList;
