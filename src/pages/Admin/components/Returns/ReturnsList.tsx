import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faImage } from '@fortawesome/free-solid-svg-icons';
import { getUserInitials } from '../../../../utils/userDisplay';
import styles from './ReturnsList.module.css';
import { returnsService } from '../../../../services/Returns.service';




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

    const formatMotivo = (motivo: string) => {
        if (!motivo) return 'No especificado';
        const dict: Record<string, string> = {
            'Dano_envio': 'Daño en envío',
            'Arrepentimiento': 'Arrepentimiento',
            'Defecto_fabrica': 'Defecto de fábrica',
            'Error_producto': 'Producto incorrecto'
        };
        return dict[motivo] || motivo.replace(/_/g, ' ');
    };

    const verDetalles = (ret: any) => {
        const fotos = ret.evidencias ? ret.evidencias.map((e: any) => e.imagen) : [];
        const comentarios = ret.comentarios || 'El cliente no dejó comentarios adicionales.';
        const motivo = formatMotivo(ret.motivo);
        const cliente = ret.cliente_nombre || 'Cliente';
        const email = ret.cliente_email || 'Sin correo';
        
        let htmlContent = '';
        
        const detallesHtml = `
            <div style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
                <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h5 style="margin: 0 0 8px 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Información del Cliente</h5>
                    <div style="color: #0f172a; font-weight: 500; font-size: 1rem; display: flex; alignItems: center; gap: 8px;">
                        <span style="display: inline-block; width: 32px; height: 32px; background: #eff6ff; color: #3b82f6; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-size: 0.9rem;">${cliente.charAt(0)}</span>
                        <div>
                            <div>${cliente}</div>
                            <div style="font-size: 0.85rem; color: #64748b; font-weight: 400;">${email}</div>
                        </div>
                    </div>
                </div>

                <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h5 style="margin: 0 0 8px 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Motivo Declarado</h5>
                    <div style="color: #0f172a; font-weight: 600; font-size: 1.05rem;">
                        ${motivo}
                    </div>
                </div>

                <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); flex-grow: 1;">
                    <h5 style="margin: 0 0 8px 0; color: #64748b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Detalles Adicionales</h5>
                    <div style="color: #475569; font-size: 0.95rem; white-space: pre-wrap; line-height: 1.6; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px dashed #cbd5e1; text-align: left;">${comentarios}</div>
                </div>
            </div>
        `;
        
        if (fotos.length > 0) {
            const imagesHtml = fotos.map((f: string) => `<div style="background: #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;"><img src="${f}" style="max-width:100%; border-radius:4px; display: block;" /></div>`).join('');
            htmlContent = `
                <div style="display: flex; gap: 24px; text-align: left; max-height: 600px; padding-top: 10px;">
                    <div style="flex: 1; overflow-y: auto; padding-right: 12px;">
                        <h4 style="margin-top:0; margin-bottom:16px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Evidencia Fotográfica</h4>
                        ${imagesHtml}
                    </div>
                    <div style="flex: 1; overflow-y: auto;">
                        <h4 style="margin-top:0; margin-bottom:16px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Desglose de la Solicitud</h4>
                        ${detallesHtml}
                    </div>
                </div>
            `;
        } else {
             htmlContent = `
                <div style="text-align: left; padding-top: 10px;">
                    <h4 style="margin-top:0; margin-bottom:16px; color: #1e293b; font-size: 1.1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Desglose de la Solicitud (Sin Fotos)</h4>
                    ${detallesHtml}
                </div>
            `;
        }

        Swal.fire({
            title: 'Detalles de la Devolución',
            html: htmlContent,
            width: fotos.length > 0 ? '900px' : '550px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#0f172a',
            customClass: {
                popup: 'swal-wide-popup'
            }
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
                                        <div style={{ fontWeight: 500, marginBottom: '6px' }}>{formatMotivo(ret.motivo)}</div>
                                        <button 
                                            className={styles.btnEvidencia} 
                                            onClick={() => verDetalles(ret)}
                                        >
                                            <FontAwesomeIcon icon={faMagnifyingGlass} /> Ver Detalles {ret.evidencias && ret.evidencias.length > 0 ? `(${ret.evidencias.length} fotos)` : ''}
                                        </button>
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
